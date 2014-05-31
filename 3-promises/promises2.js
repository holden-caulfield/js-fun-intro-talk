/**
  Examples for a Javascript talk:
  "Functional Programming, why should you care?"

  Example 3 - Promises (alternative, uber-purist, version)
*/
//notice we don't require the event system anymore
var parser = require('rssparser'),
    Q = require('q'),
    http = require("http"),
    _ = require('./funderscore'),
    feeds = [
    {"name": "Quirks Mode+", "url":"http://www.quirksmode.org/blog/index.xml"},
    {"name": "A List Apart", "url":"http://feeds.feedburner.com/alistapart/main"},
    {"name": "DailyJS", "url":"http://feeds.feedburner.com/dailyjs"},
    {"name": "The Morning Brew", "url":"http://feeds.feedburner.com/ReflectivePerspective"},
    {"name": "Treehouse", "url":"http://feeds.feedburner.com/teamtreehouse"},
    {"name": "EchoJS", "url":"http://www.echojs.com/rss"},
    {"name": ".net Magazine", "url":"http://feeds.feedburner.com/CreativeBloq"},
    {"name": "HTML5 Rocks", "url":"http://feeds.feedburner.com/html5rocks"},
    {"name": "HTML5 Doctor", "url":"http://feeds2.feedburner.com/html5doctor"},
    {"name": "Nettuts+", "url":"http://feeds.feedburner.com/nettuts-summary"},
    {"name": "CSS Tricks", "url":"http://feeds.feedburner.com/CssTricks"},
    {"name": "Smashing Magazine", "url":"http://rss1.smashingmagazine.com/feed/"},
    {"name": "24 Ways", "url":"http://feeds.feedburner.com/24ways"},
    {"name": "SitePoint", "url":"http://www.sitepoint.com/feed/"}
    ],
    found=0,
    kw = process.argv[2],
    target=process.argv[3];
//in this uber-purist version we define ALL functions as values, this is
//somewhat more similar to how you would do things on a pure FP language

//fist line that gets executed, just logs the parameters in a readable fashion
console.log("Looking for " + target + " articles matching '" + kw +"'" );

//register a general error handler since we always react the same way
//this could be overriden locally using the "fail" method on promises
Q.onerror = function (err) {
  if (err != "NoMatch") console.log(err);
};

var parseFeed = function(feed) {
 var addSource = _.partial(_.fextend, {"source" : feed.name });
 //this translates a regular node callback-based function into a Q-promise-based one
 return Q.nfcall(parser.parseURL, feed.url, {})
      .get('items')
      .then(function(items){
        return _.fmap(addSource, items);
      }); 
}

//this one will likely be on a different module on a real implementation
var promisedGet = function(url) {
  var defer = Q.defer();
  http.get(url, function (res) {
    var body = "";
    res.setEncoding('utf-8');
      res.on('data', function(chunk) {
          body += chunk;
        })
      .on('end', function() {
        defer.resolve(body);
      });
  }).on('error', function(e) { 
    defer.reject(e);
  });
  return defer.promise;
};

var processFeed = Q.promised(function processItems(items) {
  var fetch = Q.promised(function (item) {
    var firstOf = function() {
      return _.find(arguments, function(item) { return item });
    }
    item.uri = firstOf(item.url, item.id, item.link);
    return promisedGet(item.uri).then(function(body) {
      item.body = body;
      return item;
    });
  }),
  select = Q.promised(function selectRelevant(item) {
    if (item && item.body.toString().indexOf(kw) > 0) {
      return item;
    } else throw "NoMatch";
  }),
  print = Q.promised(function(item) {
    console.log(_.pick(item, ["source", "uri", "title"]));
    if (++found >= target) {
      console.log("Done. Exiting...");
      process.exit();
    }
  });
  //we trigger a new pipe with the items we fetched
  //Ideally this would be one big pipe, see discussion in the readme
  _.fpipe(items, [fetch, select, print, Q.done]);
});

_.fpipe(feeds, [parseFeed, processFeed]);
