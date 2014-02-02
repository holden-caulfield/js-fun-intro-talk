Example 2 - Functions
=====================

This version of the example aims to go "full functional" including a concept called *promises*. As you will see, using promises lets us use high order functions all around finally addressing the callback hell issue. 

First thing about promises
--------------------------

So why promises have anything to do with functional programming and getting around callback hell? In the next lines I'll try to give a very simplistic (and not strictly accurate) brief on that.

Promises represent an *eventual* value of a computation that *may or may not* succeed. This is: they may be pending, fulfilled (with a value) or failed (with an exception). This makes them an ideal abstraction for asynchronous computations, one that encapsulates the whole dealing-with-the-callbacks thing and focuses on the data (and data types) that are returned.

The key advantage of a promise based approach over callback based approachs is that promised based function *return meaningful values*, namely values that have type "promise of a", with "a" being any given value. Callback based functions return nothing, and pass the results to the callback function instead. When computations pass data around, the most natural way to do it is through the return values of the invoked functions or methods.

In a more theoretical fashion, promises are (almost) monads. You can investigate more about monads, but for now: remember that we said in example #2 that other things different than iterables could be *map*ped, *filter*ed, etc.? Well, when different types support the same set of functions, FP people say they belong to a *category*. Monads are one category, that demands a particular set of functions to be supported. 

I also like to think of monads as some sort of "envelope" that wraps a piece of data, adding some extra nature to it but still allowing the data to be passed around computations that can "open" the envelope, as long as they "wrap" the data again before returning. In the case of promises, the "envelope" adds the *eventual* nature. 

More "fun" with underscore
--------------------------

To fulfill this example, we need to take one step further and add more extensions to underscore, applying the same trick we used on example #2.

First thing we do is to create a flipped version of [_.map](http://underscorejs.org/#map), called _.fmap, same way and for the same reasons we did _.fextend. Being able to map the same function several times to different collections is more useful than mapping over the same collection time and again.

Then we need to introduce the monadic operator *bind*. This has nothing to do with underscore's _.bind function. Bind in this context is one method that the *monad category* must support. The definition of bind is as follows:
- takes a monad "m" wrapping an underlying type "a"
- takes a function "f" that goes from "a" to a monad "m" wrapping an underlying type "b" ("a" and "b" may or may not be the same, but the monad "m" *must* be the same)
- returns a monad "m" wrapping a "b"

If you think about this with *lists*, say you have a list of *words*, and a function *getChars* that extracts each *character* of a *word* (so f takes a *word* and return a *list of chars*). If you do:

	bind(getChars, words)

You will get out a *list of chars*. Notice that if you would just use _.map, you would get a *list of lists of chars*. In this sense, bind is different than map because it "flattens" the result (bind is actually called "flatmap" on some languages like scala). And that's exactly how we implement _.fbind, by using another underscore function rooted in functional programming [_.compose](http://underscorejs.org/#compose):

	_.mixin({fbind: _.compose(_.flatten, _.fmap)});

This "flattening" property allows functions to be piped arbitrarly without really being aware of the whole chain: they always need to deal with the same monad. A "pipe" function can be implemented then using yet another high order function from underscore, [_.reduce](http://underscorejs.org/#reduce):

	_.mixin({fpipe: function(initial, funcs) {
					_.reduce(funcs, function(partial, f) {
							return _.fbind(f, partial);
					}, initial)
				}
		});

Take a look at what "fpipe" does. It starts with an initial value, and then uses _.reduce to go over a list of functions binding them one after the other, so it would be like.
	
	_.bind(f[n], _.bind(f[n-1], .... _.bind(f[0], initial))...).

This will be an excellent tool for pipelining computations against promises.

About Q and why using Q over other libraries
--------------------------------------------

There are many implementations of promises in javascript. There's even a [baseline standard](http://wiki.commonjs.org/wiki/Promises/A) defining the minimum requirements all promises implementations on javascript should comply with. Among them, [Q](https://github.com/kriskowal/q) was the best fit for this example. The next paragraphs go over the key features of Q that are used on this example, and how those features make Q a great library for functional programming with promises.

(If you don't know anything about promises, now is a good time to at least read the [introduction section on Q's readme](https://github.com/kriskowal/q#introduction)).

First of all, since Q complies with the Promises/A standard, that means that every time we provide a "then" handler, the result is already wrapped back into a promise. This helps with the pipelining strategy we discussed before.

But Q goes one step further providing a *Q.promised* function that basically takes any function and converts it in a function that will "unwrap" promises that it may receive as parameters and wrap the results again into promises. So this really exploits the power of the monad concept and allow us to chain through the pipeline without having to explicitly "then"ing between completely separated operations that may be chained in different ways (or be part of more than one chain/pipe).

Q also plays very well with node: it has a Q.nfcall that would transform any standard node callback style function into a Q promises based one.

Finally, for cases when Q.nfcall is not enough, you can always resort to Q.defer(), which allows you to manually create a value that will hold a promise (a.k.a. a "deffered"), and control when and how it is fulfilled, by calling its resolve method (with a result value) or its reject method (with an exception).

Putting it all together 
-----------------------

So let's start transforming our example from callbacks to promises.

We first start declaring what our program will do:

	_.fpipe(feeds, [parseFeed, processFeed]);

Simple, isn't it? For each feed, we need to parse it, and then process its results. We are going to do this asynchronously (so we can parse and process several feeds in paralell), but our code is not messed up with any thread/callback handling. Is like if this was synchronous operations over a collection.

In parseFeed, we will take advantage of *Q.nfcall* to convert the node-style callback API of rssparser into a promised based one:

	return Q.nfcall(parser.parseURL, feed.url, {})
	  	.get('items')
	  	.then(function(items){
	  		return _.fmap(addSource, items);
	  	}); 

Notice also the "get" call: Q promises have some utility functions to do common operations on promises without having to manually use the "then" method. In this case, "get" unwraps the promise, gets a specific field for an object and returns it wrapped in a new promise. The result of all this would be a promise wrapping the collection after the _.fmap call.

For processFeed, the interesting thing to notice is that we are using a fairly standard function *processItems* and we don't make it explicitly know that is receiving a promise. Insted, we decorate it with the Q.promised function like this:

	var processFeed = Q.promised(processItems)

Also notice that we are storing a "var" with a function. That's something that is more or less common on javascript, and it is absolutely fundamental on function programming: the ability to threat functions as any other value.

On *processItems* we issue several pipes (one per each item on the feed). So one item on the first pipe generates several pipes on this stage. All is running asynchronously, but without making it mess with the code organization or readability:

	var fetch = Q.promised(fetchItem),
		select = Q.promised(selectRelevant),
		print = Q.promised(sendToOutput);
		_.fpipe(items, [fetch, select, print, Q.done]);

Also notice how we do once again the trick of decorating the functions so the implementation is not aware about the fact that promises are received and returned. We are also using once again our trick of storing functions as values.

It is important to mention that the pipe ends with *Q.done*. This makes sure that errors get fired at the end of the promise chain. We have registered our error handler globally using:

	Q.onerror = handleError;

Notice there is a "valid" exception, the "NoMatch" that is thrown on the *selectRelevant* function, that is part of our actual business. so we don't log that one. 

We are not forced to handle errors globally, we have always the alternative to handle things locally using the *fail* method on promises, and that is specially interesting when you can actually recover and put back something meaningful on the pipe.

Finally, fetching things over HTTP is a bit more complicated than a regular node callback processing. There is a "q-http" extension that handles this, but we've chosen to do this manually to showcase Q.defer:

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

Of course, the interesting thing here is that you implement things such as *promisedGet* once, and then you never deal with the callback again

The uber-purist way
-------------------

What was pending
----------------

