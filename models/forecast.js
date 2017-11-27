import API from '../api/api';
import redis from 'redis';
import city from 'redis';
import fs from 'fs';
const client = redis.createClient(process.env.REDIS_URL);

export default class Forecast {

  constructor(req) {

    /*

    Perform basic checks. We attempt to accept data in many ways, to prevent false Api calls.
    Why is it so? Well first off, when there is an ideal situation and mobile phone's GPS is working,
    then with a high probability they will send Latitude and Longitude as this is most precise way
    to describe location. If for some reason user can't send lat & lon, they will want to send city id.
    In some situations, however, we may receive only the name of the Town and Country code. Therefore,
    we must consider all possible cases.

    1. Check if request has Latitude and Longitude
    2. If no, then check if request has city id
    3. If the request is more general then we assume they provide at least town and country code
    
    */

    client.on('error', function (err) {
      console.log('Error ' + err);
    });

    if (req.query.lat && req.query.lon) {
      //If only Lat and Lon params available
      this.type = 1;
      this.lat = req.query.lat;
      this.lon = req.query.lon;
    } else if (req.query.cityid) {
      //If cityID param is available
      this.type = 2;
      this.cityid = req.query.cityid
    } else if (req.query.cityname && req.query.countrycode) {
      //If only cityname and countrycode params available
      this.type = 3;
      this.cityname = req.query.cityname;
      this.countrycode = req.query.countrycode;
    }

  }

  getForecast(res, cacheExpiredIn = 60 * 60 * 6) {

    switch (this.type) {
      case 1:

        /* Set consts from incoming params */
        const lat = this.lat;
        const lon = this.lon;

        /* 
          Search within our Redis Keys if we have a key in cached with the name
          matching ...{latitude},{longitude}...
        */
        client.keys('*' + lat + ',' + lon + '*', function (err, foundKeys) {

          if (foundKeys.length > 0) {

            /* Key found! Return cached weather forecast */
            client.get(foundKeys[0], function (err, reply) {
              res.json(JSON.parse(reply));
              console.timeEnd("server_response_time");
            });

          } else {

            /*
              Key not found. Possible reasons are that we did not request weather
              forecast for such city before or it just expired (after 6 hours).
              Now we call http://openweathermap.org/ API and https://api.sunrise-sunset.org/json
              to get Weather Forecast and Sunset/Sunrise data for the given location.
              We want to do a Promise here, to not to miss any data.
            */
            Promise.all([
              API.getForecastByLatLon({
                lat: lat,
                lon: lon,
              }),
              API.getSunActivity({
                lat: lat,
                lon: lon
              }),
            ]).then((response) => {

              response[0].list = response[0].list.splice(0, 8);
              response[0].cnt = response[0].list.length;

              /* Return weather data */
              res.json({
                forecast: response[0],
                sunrise: response[1].results.sunrise,
                sunset: response[1].results.sunset,
              });

              console.timeEnd("server_response_time");

              /* 
                Now save results to Redis cache and set an expiry time for 6 hours.
                As weather data updated not so frequently, I believe 6 hours is an optimal
                time for the cache expiration. Each individual city will have its own expiration of 6 hours.
              */
              response[0].cached = true;
              client.set(response[0].city.name.toLowerCase() + ',' + response[0].city.country.toLowerCase() + ',' + response[0].city.id + ',' + lat + ',' + lon, JSON.stringify(response[0]));
              client.expire(response[0].city.name.toLowerCase() + ',' + response[0].city.country.toLowerCase() + ',' + response[0].city.id + ',' + lat + ',' + lon, cacheExpiredIn);

            }).catch(e => {
              res.json({
                error: e
              })
            });
          }

        });

        break;

      case 2:

        const cityid = this.cityid;

        /* Go through Redis cache */
        client.keys('*,' + cityid + ',*', function (err, foundKeys) {

          if (foundKeys.length > 0) {

            /* Cached forecast found, return now */
            client.get(foundKeys[0], function (err, reply) {
              res.json(JSON.parse(reply));
              console.timeEnd("server_response_time");
            });

          } else {

            /* No cached result for the city, call API */
            Promise.all([
              API.getForecastByCityID({
                cityid: cityid,
              }),
            ]).then((response) => {

              Promise.all([
                API.getSunActivity({
                  lat: response[0].city.coord.lat,
                  lon: response[0].city.coord.lon
                }),
              ]).then((sunRes) => {

                response[0].list = response[0].list.splice(0, 8);
                response[0].cnt = response[0].list.length;

                /* Return weather data */
                res.json({
                  forecast: response[0],
                  sunrise: sunRes[0].results.sunrise,
                  sunset: sunRes[0].results.sunset
                });

                console.timeEnd("server_response_time");
                response[0].cached = true;
                client.set(response[0].city.name.toLowerCase() + ',' + response[0].city.country.toLowerCase() + ',' + cityid + ',' + response[0].city.coord.lat + ',' + response[0].city.coord.lon, JSON.stringify(response[0]));
                client.expire(response[0].city.name.toLowerCase() + ',' + response[0].city.country.toLowerCase() + ',' + cityid + ',' + response[0].city.coord.lat + ',' + response[0].city.coord.lon, cacheExpiredIn);

              }).catch(e => {
                res.json({
                  error: e
                })
              });

            }).catch(e => {
              res.json({
                error: e
              })
            });
          }

        });

        break;

      case 3:

        const cityname = this.cityname.toLowerCase();
        const countrycode = this.countrycode.toLowerCase();

        /* Go through Redis cache */
        client.keys(cityname + ',' + countrycode + '*', function (err, foundKeys) {

          if (foundKeys.length > 0) {

            /* Cached forecast found, return now */
            client.get(foundKeys[0], function (err, reply) {
              res.json(JSON.parse(reply));
              console.timeEnd("server_response_time");
            });

          } else {

            /* No cached result for the city, call API */
            Promise.all([
              API.getForecastByCityName({
                cityname: cityname.toLowerCase(),
                countrycode: countrycode.toLowerCase()
              }),
            ]).then((response) => {

              Promise.all([
                API.getSunActivity({
                  lat: response[0].city.coord.lat,
                  lon: response[0].city.coord.lon
                }),
              ]).then((sunRes) => {

                response[0].list = response[0].list.splice(0, 8);
                response[0].cnt = response[0].list.length;

                /* Return weather data */
                res.json({
                  forecast: response[0],
                  sunrise: sunRes[0].results.sunrise,
                  sunset: sunRes[0].results.sunset
                });

                console.timeEnd("server_response_time");
                response[0].cached = true;
                client.set(cityname + ',' + countrycode + ',' + response[0].city.id + ',' + response[0].city.coord.lat + ',' + response[0].city.coord.lon, JSON.stringify(response[0]));
                client.expire(cityname + ',' + countrycode + ',' + response[0].city.id + ',' + response[0].city.coord.lat + ',' + response[0].city.coord.lon, cacheExpiredIn);

              }).catch(e => {
                res.json({
                  error: e
                })
              });

            }).catch(e => {
              res.json({
                error: e
              })
            });
          }

        });

        break;

      default:
        //Bad request
        res.json({
          error: "Not enough data. Send get request with params either 1. cityname={cityname}&countrycode={countrycode} 2. cityid={cityid} 3. lat={latitude}&lon={longtitude}"
        })
        break;
    }

  }

}