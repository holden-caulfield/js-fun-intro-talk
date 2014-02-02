/**
  Examples for a Javascript talk:
  "Functional Programming, why should you care?"

  Example 3 - Promises
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

//register a general error handler since we always react the same way
//this could be overriden locally using the "fail" method on promises
Q.onerror = handleError;

//Q.promised transforms a regular function in a function that takes and
//returns a promise. You can think of it as "unwrapping" the promise and then
//"wrapping" them again. Excellent for pipelining promises
var processFeed = Q.promised(processItems)

//this is now of first line of execution, notice order does not matter anymore
//also notice the pipe explicitly says what to do (but not how to do asynchronism)
_.fpipe(feeds, [parseFeed, processFeed]);


function parseFeed(feed) {
 var addSource = _.partial(_.fextend, {"source" : feed.name });
 //this translates a regular node callback-based function into a Q-promise-based one
 return Q.nfcall(parser.parseURL, feed.url, {})
	  	.get('items')
	  	.then(function(items){
	  		return _.fmap(addSource, items);
	  	}); 
}

function processItems(items) {
	var fetch = Q.promised(fetchItem),
		select = Q.promised(selectRelevant),
		print = Q.promised(sendToOutput);
	//we trigger a new pipe with the items we fetched
	//Ideally this would be one big pipe, see discussion in the readme
	_.fpipe(items, [fetch, select, print, Q.done]);
}

function fetchItem(item) {
	item.uri = firstOf(item.url, item.id, item.link);
	return promisedGet(item.uri)
		.then(
			function(body) {
				item.body = body;
				return item;
			}
		);
};

function selectRelevant(item) {
	if (item && item.body.toString().indexOf(kw) > 0) {
		return item;
	} else throw "NoMatch";
};

function sendToOutput(item) {
	console.log(_.pick(item, ["source", "uri", "title"]));
	if (++found >= target) {
	  	console.log("Done. Exiting...");
		process.exit();
	}
};

// this shows how you can turn any function to a promised based function using Q's "defer".
// this is because http has a more complicated callback scheme than other node's operations. 
function promisedGet(url) {
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

function handleError(err) {
	if (err != "NoMatch") console.log(err);
}

function firstOf() {
  return _.find(arguments, function(item) { return item });
}
