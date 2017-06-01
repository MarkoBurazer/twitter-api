var express = require('express');
var http    = require('http');
var Twitter = require('twitter');
var fs      = require('fs');
var _       = require('lodash');

var day = parseInt(process.argv[2]);
if(isNaN(day)) return;
var writeFile = 'tweets/2017-05-'+day+'.json';

console.log('Creating file tweets/2017-05-'+day+'.json');
function concatFiles(hour) {
  if(hour > 23) {
    process.stdout.write('\r\x1b[KDone ['+hour+"/24]");
    return;
  }
  var hour_string = hour < 10 ? '0'+hour.toString() : hour.toString();
  var readfile = 'tweets/2017-05-'+day+'/2017-05-'+day+'-'+hour_string+'00.json';

  fs.readFile(readfile, 'utf8', function(err, data) {
    if(err) return console.log(err);
    // console.log('writing ' + writeFile);
    fs.appendFile(writeFile, data, function () {
      if(err)
        console.log(err);
      else {
        process.stdout.write('\r\x1b[Kwriting ['+(hour+1)+"/24]");
        concatFiles(hour+1);
      }
    });
  });
}

fs.readFile(writeFile, function (err, data) {
  if(err)
    concatFiles(0);
  else
    console.log('ERROR: ' + writeFile + ' already exists');
});