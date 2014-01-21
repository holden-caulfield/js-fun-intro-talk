var parser = require('rssparser'),
    http = require("http"),
    events = require('events'),
    emitter = new events.EventEmitter(),
    feeds = [
    {"name": "DailyJS", "url":"http://feeds.feedburner.com/dailyjs"},
    {"name": "The Morning Brew", "url":"http://feeds.feedburner.com/ReflectivePerspective"},
    {"name": "Treehouse", "url":"http://feeds.feedburner.com/teamtreehouse"},
    {"name": "EchoJS", "url":"http://www.echojs.com/rss"},
    {"name": ".net Magazine", "url":"http://feeds.feedburner.com/CreativeBloq"},
    {"name": "HTML5 Rocks", "url":"http://feeds.feedburner.com/html5rocks"},
    {"name": "HTML5 Doctor", "url":"http://feeds2.feedburner.com/html5doctor"},
    {"name": "Nettuts+", "url":"http://feeds.feedburner.com/nettuts-summary"},
    {"name": "Quirks Mode+", "url":"http://www.quirksmode.org/blog/index.xml"},
    {"name": "CSS Tricks", "url":"http://feeds.feedburner.com/CssTricks"},
    {"name": "CSS Wizardy", "url":"http://feeds.feedburner.com/csswizardrycom"},
    {"name": "Smashing Magazine", "url":"http://rss1.smashingmagazine.com/feed/"},
    {"name": "24 Ways", "url":"http://feeds.feedburner.com/24ways"},
    {"name": "A List Apart", "url":"http://feeds.feedburner.com/alistapart/main"},
    {"name": "SitePoint", "url":"http://www.sitepoint.com/feed/"}
    ],
    found=0,
    kw = process.argv[2],
    target=process.argv[3];

console.log("Looking for " + target + " articles matching '" + kw +"'" );

emitter.on("feed", parseFeed);
emitter.on("news", fetchItem);
emitter.on("fetched", selectRelevant);
emitter.on("select", sendToOutput);

function parseFeed(feed) {
  parser.parseURL(feed.url, {}, function(err, out) {
    if(err) {
      console.log(err);
    } else {
      results = out.items;
      for (j=0; j< results.length; j++) {
        var item = results[j];
        item.source = feed.name;
        emitter.emit("news", item);
      }
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
  if (found++ < target) {
    console.log({
      "source": item.source,
      "uri": item.uri
    });
  } else {
    console.log("Done. Exiting...");
    emitter.removeAllListeners();
    process.exit();
  }
}

function firstOf() {
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i]) return arguments[i];
  }
}

for (i=0; i<feeds.length; i++) {
  emitter.emit("feed", feeds[i]);
}
