import express from 'express';
let router = express.Router();
import Forecast from '../models/forecast';


/* Root route */
router.get('/', (req, res, next) => {
  console.time("server_response_time");

  /* 
    Define expiration time for the cached weather data.
    We set 6 hours by default. Read further in /models/forecast.js file
  */
  const cacheExpiredIn = 60 * 60 * 6;

  /* Call our Forecast class and pass request params */
  let forecast = new Forecast(req)
  forecast.getForecast(res, cacheExpiredIn)
});

/* Testing all our modules */
router.get('/test', (req, res, next) => {

  console.time("server_response_time");

  /* Cache expiry for 20 sec for the test */
  const cacheExpiredIn = 20;

  /* Define some test cities */
  const testData = [
    {
      "id": 2905457,
      "name": "Herzogenaurach",
      "country": "DE",
      "coord": {
        "lon": 10.88565,
        "lat": 49.567982
      }
    },
    {
      "id": 2643743,
      "name": "London",
      "country": "GB",
      "coord": {
        "lon": -0.12574,
        "lat": 51.50853
      }
    },
    {
      "id": 5128638,
      "name": "New York",
      "country": "US",
      "coord": {
        "lon": -75.499901,
        "lat": 43.000351
      }
    },
    {
      "id": 1850147,
      "name": "Tokyo",
      "country": "JP",
      "coord": {
        "lon": 139.691711,
        "lat": 35.689499
      }
    },
    {
      "id": 323786,
      "name": "Ankara",
      "country": "TR",
      "coord": {
        "lon": 32.854271,
        "lat": 39.919868
      }
    },
  ];

  /* Pick random city and random test type */
  const testType = Math.floor(Math.random() * 3) + 1;
  const cityID = Math.floor(Math.random() * testData.length) + 0;

  switch (testType) {
    case 1:
      req.query.lat = testData[cityID].coord.lat;
      req.query.lon = testData[cityID].coord.lon;
      break;

    case 2:
      req.query.cityid = testData[cityID].id;
      break;

    case 3:
      req.query.cityname = testData[cityID].name;
      req.query.countrycode = testData[cityID].country;
      break;

    default:
      break;
  }

  let forecast = new Forecast(req);
  forecast.getForecast(res, cacheExpiredIn);

});


export default router;