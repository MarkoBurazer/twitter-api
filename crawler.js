var express = require('express');
var http    = require('http');
var Twitter = require('twitter');
var fs      = require('fs');
var _       = require('lodash');

var client = new Twitter({
  consumer_key: 'pJ2kmpf8xcejK1HTU0T7HyWAK',
  consumer_secret: 'xaaRhIQXQP5mXvsFdzOwszvtxWqqAyyUGWJkFE9R1S02tCgwWs',
  access_token_key: '31735707-zilujoedSvrzbm8abkgtfJMEVaZ6zUKFyJrNveQiS',
  access_token_secret: 'qF7v7o44v2oK1XhgDhQrzRCSvwOnJp1bHMpQGOV2nlp1Q'
});

//positive: happy,  hope,  love,     relaxed, wonderful, blessed
//negative: afraid, angry, confused, sad,     scared,    frustrated
var search_queries = ['#happy', '#hope', '#love', '#relaxed', '#wonderful', '#blessed',
                      '#afraid', '#angry', '#confused', '#sad', '#scared', '#frustrated'];
var search_query = '#happy';
var crawl_counter = 1;
var date = "2017-05-17"
var time = "10:57:47";
var date2 = "2017-05-12";

// _.each(search_queries, function(search_query) {
  console.log('crawling...' + search_query);
  for(var i=0; i < crawl_counter; i++) {
    var query = '#happy';//'#happy';// + ' until:' + date;
    console.log(query);
    client.stream('search/tweets', { q: query, until:date }, function(error, tweets, response) {
      if(error) {
        console.log(error);
        return;
      }
      console.log(tweets);
      var statuses = tweets.statuses;
      var string = JSON.stringify(statuses).slice(1,-1);
      string = string.replace(/},{"created_at/g,'\n{"created_at')

      fs.appendFile('tweets/'+search_query+'.json', string + ',\n', function(err) {
        if(err) console.log(err);
        else
          console.log(search_query + ' ' + i + ' ...done!');
      });
    });
  }
// });
