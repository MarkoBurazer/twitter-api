var fs  = require('fs');
var _   = require('lodash');
var readline = require('readline');

var file_name = process.argv[2];

var rl = null;
var search_queries = ['#good',   '#happy',  '#hope',  '#love',     '#relaxed', '#wonderful', '#blessed',    "#great",     "#lucky",   "#sunny", "#optimistic", "#satisfied", "#thrilled",
                      '#notgood','#afraid', '#angry', '#confused', '#sad',     '#scared',    '#frustrated', "#depressed", "#hateful", "#bad",   "#unhappy",    "#terrified", "#scared"];

var positive_queries = ['#good',   '#happy',  '#hope',  '#love',     '#relaxed', '#wonderful', '#blessed',    "#great",     "#lucky",   "#sunny", "#optimistic", "#satisfied", "#thrilled"];
var negative_queries =  [ '#notgood','#afraid', '#angry', '#confused', '#sad',     '#scared',    '#frustrated', "#depressed", "#hateful", "#bad",   "#unhappy",    "#terrified", "#scared"];


if(file_name) {
  setRLToReadTweetsFile();
  tweetCounter();
}
else {
  var read_user_input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  console.log('Optionen:');
  console.log('[1] Dateien aus Verzeichnis zusammenfügen');
  console.log('[2] Tweets aus Datei zusammenzählen (am häufigsten getweetete hashtags)');
  console.log('[3] Tweets aus Datei zusammenzählen (nur die search_queries filtern)');
  console.log('[4] Alles Tags nach Vorkommen abspeichern')
  console.log('[5] Tweets nach Location');
  console.log('[6] Emotion Counter per Hour')
  read_user_input.question('\nAuswahl: ', function(select) {
    switch (select) {
      case '1':
        read_user_input.question('Verzeichnis: ', function(dirname) {
          console.log('\nACHTUNG: Datei sollte nicht existieren, da sonst alle tweets in diese datei angehängt werden.');
          read_user_input.question('Neue Datei: ', function(concatfile) {
            concatFiles(dirname, concatfile);
            read_user_input.close();
          });
        });
        break;
      case '2':
        read_user_input.question('Dateipfad: ', function(filename) {
          file_name = filename;
          setRLToReadTweetsFile();
          tweetCounter(false);
          read_user_input.close();
        });
        break;
      case '3':
        read_user_input.question('Dateipfad: ', function(filename) {
          file_name = filename;
          setRLToReadTweetsFile();
          tweetCounter(true);
          read_user_input.close();
        });
        break;
      case '4':
        read_user_input.question('Dateipfad: ', function(filename) {
            file_name = filename;
            setRLToReadTweetsFile();
            tagCounter();
            read_user_input.close();
        });
        break;
      case '5':
        read_user_input.question('Dateipfad: ', function(filename) {
            read_user_input.question('Bubbles?: ', function(bubbles) {
                file_name = filename;
                setRLToReadTweetsFile();
                locationCounter(false, bubbles == "yes" ? true : false);
                read_user_input.close();
            });
        });
        break;
        case '6':
        read_user_input.question('Dateipfad: ', function(filename) {
            file_name = filename;
            setRLToReadTweetsFile();
            timeZoneAnalyzer(true);
            read_user_input.close();
        });
        break;

      default:
        console.log('Ungültige Eingabe!');
        read_user_input.close();
    }

  });
}


// erstellt .json datei mit liste der am häufigsten getweeteten hashtags (aufsteigend sortiert)
function locationCounter(search_queries_only, bubbles = false) {
  var tweets = [];
  var hashtags = {};
  var locations = {};

  var create_file = file_name.replace('.json', search_queries_only ? 'location_queries.json'  : 'location.json');
  fs.open(create_file, 'r', function (err, fd) {
    if(err) {
      var x = 0;
      rl.on('line', function (line) {
        x++;
        // console.log('Line from file:', line);
        // tweets.push(line);
        line = line.replace(/\n/g, '');
        var tweet = null;
        try {
          tweet = JSON.parse(line.substring(0,line.length-1));
        }
        catch (err) {
          //
        }
        if(!tweet || tweet.limit) {
          //some tweets are broken?
          return;
        }
        tweet.uhrzeit = new Date(tweet.created_at) + (tweet.user.utc_offset*1000);
        tweets.push(tweet);
        process.stdout.write('\r\x1b[Kprocessed '+tweets.length);
      });

      rl.on('close', function() {
        process.stdout.write('\n');

        var x = 0;
        _.each(tweets, function(tweet) {
          x++;
          if(!tweet.entities) console.log(x, tweet);
          if(!tweet.user) console.log("no user:", x, tweet);
          var tmp_tags = tweet.entities.hashtags;
          var loc = tweet.user.time_zone;
          _.each(tmp_tags, function(tag) {
            var hashtag_text = tag.text.toLowerCase();
            if(hashtags[hashtag_text] !== undefined) {
              hashtags[hashtag_text].value += 1;
              hashtags[hashtag_text].time_zone.push(loc);

            }
            else{
              if(search_queries_only) {
                if(search_queries.indexOf('#' + hashtag_text) > 0) {
                  if(loc != null){
                    hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [loc.toString()] };
                  }
                  else{
                    hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [] };
                  }
                }
              }
              else {
                hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [loc] };
              }
            }
          });
          
        });
        hashtags = _.filter(hashtags, function(tag){
            return (tag.value>10)
        });
        _.each(hashtags, function(tag) {
          tag.time_zone = _(tag.time_zone).groupBy().map(function(a,b){
            return { country: b, count: a.length }
          }).value();
        });

        

        var locs = ""
        
        if(bubbles){
            locs += "id,value\nflare,\n"
            _.each(hashtags, function(tag){
                locs += "flare." + tag.label +  ",\n";
                _.each(tag.time_zone, function(zone){
                    if(zone.country != "null"){
                        locs += "flare." + tag.label +  "." + zone.country.replace(/ /g, "") + "," + zone.count + "\n"
                    }
                });
            });
        }
        else{
            _.each(hashtags, function(tag){
                console.log(tag.time_zone)
                _.each(tag.time_zone, function(zone){
                    console.log(zone.country)
                    if(zone.country != "null")
                        locs += zone.country.replace(/ /g, "") + "\n"
                });
            });
        }
        
        
        fs.appendFileSync("allLocs.json", locs)
        
        var sorted_locations = _.sortBy(hashtags,['value']);
        var stringified = '[';
        _.each(sorted_locations, function(loc) {
          stringified += JSON.stringify(loc) + ',\n';
        });
        fs.appendFile(create_file, stringified + ']', function(err) {
          if(err)
            console.log(err);
          else
            console.log(create_file + ' erstellt.');
        });
      });
    }
    else {
      console.log('ERROR: datei existiert bereits');
    }
  });
}

function timeZoneAnalyzer(search_queries_only) {
    var tweets = [];
    var hashtags = {};
    var time_data =
        [
            {hour: 0, value_pos:0, value_neg:0},
            {hour: 1, value_pos:0, value_neg:0},
            {hour: 2, value_pos:0, value_neg:0},
            {hour: 3, value_pos:0, value_neg:0},
            {hour: 4, value_pos:0, value_neg:0},
            {hour: 5, value_pos:0, value_neg:0},
            {hour: 6, value_pos:0, value_neg:0},
            {hour: 7, value_pos:0, value_neg:0},
            {hour: 8, value_pos:0, value_neg:0},
            {hour: 9, value_pos:0, value_neg:0},
            {hour: 10, value_pos:0, value_neg:0},
            {hour: 11, value_pos:0, value_neg:0},
            {hour: 12, value_pos:0, value_neg:0},
            {hour: 13, value_pos:0, value_neg:0},
            {hour: 14, value_pos:0, value_neg:0},
            {hour: 15, value_pos:0, value_neg:0},
            {hour: 16, value_pos:0, value_neg:0},
            {hour: 17, value_pos:0, value_neg:0},
            {hour: 18, value_pos:0, value_neg:0},
            {hour: 19, value_pos:0, value_neg:0},
            {hour: 20, value_pos:0, value_neg:0},
            {hour: 21, value_pos:0, value_neg:0},
            {hour: 22, value_pos:0, value_neg:0},
            {hour: 23, value_pos:0, value_neg:0},
            ];

    var create_file = file_name.replace('.json', search_queries_only ? 'emotionCounterQueries.json'  : 'emotionCounter.json');
    fs.open(create_file, 'r', function (err, fd) {
        if(err) {
            var x = 0;
            rl.on('line', function (line) {
                x++;
                // console.log('Line from file:', line);
                // tweets.push(line);
                line = line.replace(/\n/g, '');
                var tweet = null;
                try {
                    tweet = JSON.parse(line.substring(0,line.length-1));
                }
                catch (err) {
                    //
                }
                if(!tweet || tweet.limit) {
                    //some tweets are broken?
                    return;
                }
                if(tweet.user.utc_offset != null || tweet.user.utc_offset != undefined)
                  tweet.uhrzeit = (new Date(tweet.created_at).getTime() + (tweet.user.utc_offset*1000));
                tweets.push(tweet);
                process.stdout.write('\r\x1b[Kprocessed '+tweets.length);
            });

            rl.on('close', function() {
                process.stdout.write('\n');

                var x = 0;
                _.each(tweets, function(tweet) {
                    var emotion = false;
                    x++;
                    if(!tweet.entities) console.log(x, tweet);
                    if(!tweet.user) console.log("no user:", x, tweet);
                    var tmp_tags = tweet.entities.hashtags;
                    var loc = tweet.user.time_zone;
                    _.each(tmp_tags, function(tag) {
                        var hashtag_text = tag.text.toLowerCase();

                        if(positive_queries.indexOf(hashtag_text)){
                          emotion = true;
                        }
                        if(hashtags[hashtag_text] !== undefined) {
                            hashtags[hashtag_text].value += 1;
                            hashtags[hashtag_text].time_zone.push(loc);
                        }
                        else{
                            if(search_queries_only) {
                                if(search_queries.indexOf('#' + hashtag_text) > 0) {
                                    if(loc != null){
                                        hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [loc.toString()] };
                                    }
                                    else{
                                        hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [] };
                                    }
                                }
                            }
                            else {
                                hashtags[hashtag_text] = { label: hashtag_text, value: 1, time_zone: [loc] };
                            }
                        }
                    });

                    if(tweet.uhrzeit) {
                        var time = new Date(tweet.uhrzeit);
                        if (emotion) {
                            time_data[time.getHours()].value_pos += 1;
                        }
                        else {
                            time_data[time.getHours()].value_neg += 1;
                        }
                    }

                });
                hashtags = _.filter(hashtags, function(tag){
                    return (tag.value>10)
                });
                _.each(hashtags, function(tag) {
                    tag.time_zone = _(tag.time_zone).groupBy().map(function(a,b){
                        return { country: b, count: a.length }
                    }).value();
                });

                var locs = ""

                locs += "id,value\nflare,\n"
                _.each(hashtags, function(tag){
                    locs += "flare." + tag.label +  ",\n";
                    _.each(tag.time_zone, function(zone){
                        if(zone.country != "null"){
                            locs += "flare." + tag.label +  "." + zone.country.replace(/ /g, "") + "," + zone.count + "\n"
                        }
                    });
                });

                var sorted_locations = _.sortBy(hashtags,['value']);
                var stringified = '[';
                _.each(time_data, function(t) {
                    stringified += JSON.stringify(t) + ',\n';
                });
                fs.appendFile(create_file, stringified + ']', function(err) {
                    if(err)
                        console.log(err);
                    else
                        console.log(create_file + ' erstellt.');
                });
            });
        }
        else {
            console.log('ERROR: datei existiert bereits');
        }
    });
}

function tagCounter() {
  var tweets = [];
  var hashtags = "";

  var create_file = file_name.replace('.json', 'tags.json');
  fs.open(create_file, 'r', function (err, fd) {
    if(err) {
      var x = 0;
      rl.on('line', function (line) {
        x++;
        // console.log('Line from file:', line);
        // tweets.push(line);
        line = line.replace(/\n/g, '');
        var tweet = null;
        try {
          tweet = JSON.parse(line.substring(0,line.length-1));
        }
        catch (err) {
          //
        }
        if(!tweet || tweet.limit) {
          //some tweets are broken?
          return;
        }
        tweets.push(tweet);
        process.stdout.write('\r\x1b[Kprocessed '+tweets.length);
      });

      rl.on('close', function() {
        process.stdout.write('\n');

        var x = 0;
        _.each(tweets, function(tweet) {
          x++;
          if(!tweet.entities) console.log(x, tweet);
          var tmp_tags = tweet.entities.hashtags;
          _.each(tmp_tags, function(tag) {
            var hashtag_text = tag.text.toLowerCase();

            hashtags += hashtag_text + ' '
          });
        });

        fs.appendFile(create_file, hashtags, function(err) {
          if(err)
            console.log(err);
          else
            console.log(create_file + ' erstellt.');
        });
      });
    }
    else {
      console.log('ERROR: datei existiert bereits');
    }
  });
}

function setRLToReadTweetsFile() {
  rl = readline.createInterface({
    input: fs.createReadStream(file_name)
  });
}

function concatFiles(dir, concatfile) {
  fs.readdir(dir, function(err, files) {
    if(err) {
      console.log('Verzeichnis nicht gefunden');
    }
    else {
      var x = 0;
      _.each(files, function(file) {
        x++;
        console.log(x + ' readFile: '+dir+'/'+file);
        fs.readFile(dir+'/'+file, 'utf8', function(err, data) {
          if(err) return console.log(err);
          process.stdout.write('appendFile: '+dir+'/'+concatfile);
          fs.appendFileSync(dir+'/'+concatfile, data);
          process.stdout.write(' ... ok\n');

          // fs.appendFile(dir+'/'+concatfile, data, function () {
          //   if(err)
          //     console.log(err);
          //   else {
          //     process.stdout.write(' ... ok\n');
          //   }
          // });
        });
      });
    }
  });
}