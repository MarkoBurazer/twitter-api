var fs  = require('fs');
var _   = require('lodash');
var readline = require('readline');

var file_name = process.argv[2];

var rl = null;
var search_queries = ['#good',   '#happy',  '#hope',  '#love',     '#relaxed', '#wonderful', '#blessed',    "#great",     "#lucky",   "#sunny", "#optimistic", "#satisfied", "#thrilled",
                      '#notgood','#afraid', '#angry', '#confused', '#sad',     '#scared',    '#frustrated', "#depressed", "#hateful", "#bad",   "#unhappy",    "#terrified", "#scared"];

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
      default:
        console.log('Ungültige Eingabe!');
        read_user_input.close();
    }

  });
}


// erstellt .json datei mit liste der am häufigsten getweeteten hashtags (aufsteigend sortiert)
function tweetCounter(search_queries_only) {
  var tweets = [];
  var hashtags = {};

  var create_file = file_name.replace('.json', search_queries_only ? 'tagcount_queries.json'  : 'tagcount.json');
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

            if(hashtags[hashtag_text] !== undefined) {
              hashtags[hashtag_text].value += 1;

            }
            else{
              if(search_queries_only) {
                if(search_queries.indexOf('#' + hashtag_text) > 0) {
                  hashtags[hashtag_text] = { label: hashtag_text, value: 1, date: tweet.created_at };
                }
              }
              else {
                hashtags[hashtag_text] = { label: hashtag_text, value: 1, date: tweet.created_at };
              }
            }
          });
        });

        var sorted_hashtags = _.sortBy(hashtags,['value']);
        var stringified = '[';
        _.each(sorted_hashtags, function(tag) {
          stringified += JSON.stringify(tag) + ',\n';
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