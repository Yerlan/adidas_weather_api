import fetch from 'node-fetch';

const forecastAPI = 'http://api.openweathermap.org/data/2.5/forecast';
const sunActivityAPI = 'https://api.sunrise-sunset.org/json';
const apiKey = '1ec6dedef31f15c6fbb10559680faa5a';

const getForecastByCityID = (params) => {

  if (params && params.cityid) {
    return fetch(forecastAPI + '?id=' + params.cityid + '&APPID=' + apiKey, {
      method: 'GET',
    }).then((res) => {
      return res.json()
    }).then((r) => {
      return r;
    });
  } else {
    return {
      'error': 'Not enough data'
    }
  }

}

const getForecastByLatLon = (params) => {

  if (params && params.lat && params.lon) {
    return fetch(forecastAPI + '?lat=' + params.lat + '&lon=' + params.lon + '&APPID=' + apiKey, {
      method: 'GET',
    }).then((res) => {
      return res.json()
    }).then((r) => {
      return r;
    });
  } else {
    return {
      'error': 'Not enough data'
    }
  }

}

const getForecastByCityName = (params) => {

  if (params && params.cityname && params.countrycode) {
    return fetch(forecastAPI + '?q=' + params.cityname + ',' + params.countrycode + '&APPID=' + apiKey, {
      method: 'GET',
    }).then((res) => {
      return res.json()
    }).then((r) => {
      return r;
    });
  } else {
    return {
      'error': 'Not enough data'
    }
  }

}


const getSunActivity = (params) => {

  if (params && params.lat && params.lon) {
    return fetch(sunActivityAPI + '?lat=' + params.lat + '&lng=' + params.lon, {
      method: 'GET',
    }).then((res) => {
      return res.json()
    }).then((r) => {
      return r;
    });
  } else {
    return {
      'error': 'Not enough data'
    }
  }

}

export default {
  getForecastByCityID: getForecastByCityID,
  getForecastByLatLon: getForecastByLatLon,
  getForecastByCityName: getForecastByCityName,
  getSunActivity: getSunActivity
}