/**
  Examples for a Javascript talk:
  "Functional Programming, why should you care?"

  Example 2 - Functions
*/
var parser = require('rssparser'),
    http = require("http"),
    events = require('events'),
    emitter = new events.EventEmitter(),
    //notice that this time we also require underscore. Actually we require a slightly 
    //tuned version of it to make it just a bit more functional.
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
    {"name": "CSS Wizardy", "url":"http://feeds.feedburner.com/csswizardrycom"},
    {"name": "Smashing Magazine", "url":"http://rss1.smashingmagazine.com/feed/"},
    {"name": "24 Ways", "url":"http://feeds.feedburner.com/24ways"},
    {"name": "SitePoint", "url":"http://www.sitepoint.com/feed/"}
    ],
    found=0,
    kw = process.argv[2],
    target=process.argv[3];

//fist line that gets executed, just logs the parameters in a readable fashion
console.log("Looking for " + target + " articles matching '" + kw +"'" );

// the event chain is simplified here to make a more direct usage of some high order functions
// this means we are sacrificing flexibility for simplicity and relaxing our initial constraint
// by acknowledging that some of the computations will not be long running
emitter.on("fetched", selectRelevant);
emitter.on("select", sendToOutput);


//some of the functions below are handlers for the events, some others just 
//get called directly. This is different from the approach on example #1
function parseFeed(feed) {
  // this gets us a function that will add the source to a given object
  var addSource = _.partial(_.fextend, {"source" : feed.name });
  parser.parseURL(feed.url, {}, function(err, out) {
    if(err) {
      console.log(err);
    } else {
      //the juiciest line on the example, we map partially applied function over
      //the feed items and then we apply the fetchItem func over them
      _.each(_.map(out.items, addSource), fetchItem);
    } 
  }); 
}

function fetchItem(item) {
  item.uri = firstOf(item.url, item.id, item.link);
  try {
    http.get(item.uri, function (res) {
      res.setEncoding('utf-8');
      item.body = "";
      res.on('data', function(chunk) {
        item.body += chunk;
      }).on('end', function() {
        emitter.emit("fetched", item);
      });
    }).on('error', function(e) { 
      console.log("Got error: " + e.message);
    });
  } catch (e) {
    console.log(e);
  }
};

function selectRelevant(item) {
  if (item.body.indexOf(kw) > 0) {
    emitter.emit("select", item);
  }
}

function sendToOutput(item) {
  //underscore provides a more elegant solution for logging what's available on each case
  //we can actually add some more fields if we are interested
  console.log(_.pick(item, ["source", "uri", "title"]));
  if (++found >= target) {
    console.log("Done. Exiting...");
    //ugly, but tidy exit. We remove the listeners for extra-tidyness (LOL)...
    emitter.removeAllListeners();
    //...then we just kill the process. Our work is done and we 
    //don't want to keep making requests or waiting for results
    process.exit();
  }
}

// a simple utilitary function, this one returns the first argument 
// passed that is not undefined, it is useful because different RSS 
// feeds may have the URL for the contents on a different field
function firstOf() {
  return _.find(arguments, function(item) { return item });
}

//this is actually the first computation that is executed and is "hidden" at the end of the code
//notice that if this is executed before the event handling registration, it will not crash
//but it would sliently do nothing, as the events would be emitted with no hanlder to catch them
_.each(feeds, parseFeed);
