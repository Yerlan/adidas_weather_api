var redis = require('redis')
  , client = redis.createClient();

client.on('error', function (err) {
  console.log('Error ' + err);
});

client.on('connect', runSample);

function runSample() {
  // Set a value
  client.set('123', [{ "weather": "sunny" }, { "weather": "rainy" }].toString(), redis.print);
  // Expire in 3 seconds
  client.expire('string key', 3);

  // This timer is only to demo the TTL
  // Runs every second until the timeout
  // occurs on the value
  var myTimer = setInterval(function () {
    client.get('string key', function (err, reply) {
      if (reply) {
        console.log('I live: ' + reply.toString());
        client.ttl('string key', writeTTL);
      } else {
        clearTimeout(myTimer);
        console.log('I expired');
        client.quit();
      }
    });
  }, 1000);
}

function writeTTL(err, data) {
  console.log('I live for this long yet: ' + data);
}
