var Twitter = require('twitter');
var fs      = require('fs');
var cron    = require('node-cron');
var moment  = require('moment');

var client = new Twitter({
  consumer_key: 'pJ2kmpf8xcejK1HTU0T7HyWAK',
  consumer_secret: 'xaaRhIQXQP5mXvsFdzOwszvtxWqqAyyUGWJkFE9R1S02tCgwWs',
  access_token_key: '31735707-zilujoedSvrzbm8abkgtfJMEVaZ6zUKFyJrNveQiS',
  access_token_secret: 'qF7v7o44v2oK1XhgDhQrzRCSvwOnJp1bHMpQGOV2nlp1Q'
});

var time_format          = 'YYYY-MM-DD H:mm:ss';
var file_name_format     = 'YYYY-MM-DD-HH00';
// var cron_schedule = '* * * * *'; // jede volle Minute zB 12:00, 12:01, 12:02, ...
var cron_schedule = '0,10,20,30,40,50 * * * *'; // alle 10 Minuten zb. 12:00, 12:10, 12:20, 12:30, 12:40...
var script_execution_time = 1000*60;

// var search_queries = ['#good',   '#happy',  '#hope',  '#love',     '#relaxed', '#wonderful', '#blessed',    "#great",     "#lucky",   "#sunny", "#optimistic", "#satisfied", "#thrilled",
//                       '#notgood','#afraid', '#angry', '#confused', '#sad',     '#scared',    '#frustrated', "#depressed", "#hateful", "#bad",   "#unhappy",    "#terrified", "#scared"];

function startStream() {
  /**
   * Stream statuses filtered by keyword
   * number of tweets per second depends on topic popularity
   **/
  client.stream('statuses/filter', {track: '#' },  function(stream) {
    stream.on('data', function(tweet) {
      var log = moment().format(time_format);

      var string = JSON.stringify(tweet);
      var file_name = moment().format(file_name_format);
      // console.log('tweets/'+file_name+'.json');
      console.log(log);
      fs.appendFile('tweets/random-'+file_name+'.json', string + ',\n', function(err) {
        if(err) console.log(err);
      });
      fs.appendFile('tweets/random-logs.txt', log + ',\n', function(err) {
        if(err) console.log(err);
      });
    });

    stream.on('error', function(error) {
      console.log(error);
      var log = moment().format(time_format);
      fs.appendFile('random-logs-offline.txt', log + ',\n', function(err) {
        if(err) console.log(err);
      });
    });

    setTimeout(function() {
      stream.destroy();
    }, script_execution_time);
  });
}

cron.schedule(cron_schedule, function() {
  console.log('starting stream ', moment().format(time_format));
  startStream();
});