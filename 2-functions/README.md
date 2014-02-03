Example 2 - Functions
=====================

This version of the example aims to improve the initial example by including some relatively "mainstream" javascript functional constructs. In particular the example relies on [underscore.js](www.underscorejs.org), even though some tweaks were necessary to make it serve better its purpose. The sections below discuss which in particular is improved but also which issues from example #1 remain there.

Adding "fun" to underscore
--------------------------

If you take a close look the example, you will see that it requires a file called "funderscore", instead of the regular underscore. This is a very small improvement file on which underscore is extended with a few extra methods that help reflecting functional programming concepts better. 

For this example, we just added a modified versions of [_.extend](http://underscorejs.org/#extend), called _.fextend, that receive the parameters in reversed order. So, _.fextend receives first the extensions to make and then the object that will be extended. This flipped versions work better with [_.partial](http://underscorejs.org/#partial) for the purposes of this example.

This strategy to extend underscore was inspired on [this discussion](http://www.reddit.com/r/javascript/comments/1l9gqu/hey_underscorejs_youre_doing_functional/). If you want to see the talk that originated the argument you can check [this video](http://www.youtube.com/watch?v=m3svKOdZijA) (I recommend you do). On example #3 other improvements are introduced. Those are discussed on its corresponding readme.

The flipping itself was inspired in [this great article](http://dailyjs.com/2012/09/14/functional-programming/). You will notice that instead of flipping all the arguments we flip the first two explicitly. Flipping all the arguments doesn't work if the caller sends more parameters than what you expect, and that is actually what [_.map](http://underscorejs.org/#map), [_.each](http://underscorejs.org/#each), etc. will do in our example: they also pass the index of the item on the collection to the mapping function. 

For this example flipping explicitly the first two arguments is enough. If you want to check how a more comprehensive solution could be done, check [Underscore Extras](https://github.com/rhysbrettbowen/Underscore.Extras) _.flip method. The guy that made Underscore Extras is actually the guy that did the suggestion I've picked up on the discussion thread. 

What was actually improved
--------------------------

With underscore and the "funderscore" improvements discussed above, we have a way to do local improvements to some parts of the code.

The first and most obvious thing is to improve imperative loops. Again, this is probably the most widespread use of functional programming concepts in javascript. Even though you may think about them as functions for "collections" (actually underscore calls them that way), in functional programming the concepts of map, filter, etc. apply to things that are not collections as well. If you want to dig more on that, you can check about [functors, monads](http://learnyouahaskell.com/functors-applicative-functors-and-monoids), and if you feel brave enough [category theory in general](http://en.wikibooks.org/wiki/Haskell/Category_theory)... 

...anyway, is out of the scope of this example. For this example, all you need to know is the base idea of *high order functions*: this is functions that may take functions as parameters or return functions as result.

So, our initial loop over the feeds can be changed to:

	_.each(feeds, parseFeed);

The other improvement we can make is at the *parseFeed* function, here we need to make a slightly more sophisticated trick combining what we know with the concept of *partial application*: the idea that you can get a function that receives several parameters and pre-apply only a subset of them to get back a function that you can call with the remaining parameters (once or many times) in a future sentence.

This is when our change to _.extend comes to play, so we can do this:

	var addSource = _.partial(_.fextend, {"source" : feed.name });

Here we are creating a *new function* that will extend any given object with the proper "source" field. If we would use the usual _.extend, we would get a function that always extend the same object, adding more and more to it, which is clearly less useful IMHO.

Notice that we have a *var* declaration whose value is a function. This is totally valid in javascript, but may be more or less weird to you. With a functional programming mindset, values can be functions: is just another type they may have.

Finally, we pass the function we just created to *_.map* it over the list of items from the feed, and for *_.each* of them we invoke the next step, *fetchItem*

	_.each(_.map(out.items, addSource), fetchItem);

This may result a bit harder to follow until you get used to it, but once you do it quickly becomes more readable. It has the benefit of making a stronger focus on *what* to do instead of *how* to do it. There's no index variables, no intermediate variables to handle the items whithin the collection, etc. This makes it also less error prone: is very hard to get one of this functional constructs "almost right". Either they are correct, or they fail in your face.

Compromises and remainig challenges 
-----------------------------------

As you may have noticed already, while we introduced the use of _.each and _.map we lost the asynchronism on some steps that are obviously not long-running. This is clear if you look at the event chain: you'll see is two events shorter. We are basically making the opposite choice as in example #1 when we assumed that everything could be long running. 

If we wanted to get back full asyncronicity, we could add some helper functions that emit the events, with some help of our partial application trick:

	function emitEvent(eventName, data) {
	  emitter.emit(eventName, data);
	}

	var emitFeed = _.partial(emitEvent, "feed");
	var emitNews = _.partial(emitEvent, "news");

Then our event chain can be fully restored, and for example our starting line would be:

	_.each(feeds, emitFeed);

You can check this in full in functions2.js. You would argue that this introduces a little bit too much boilerplate, and I would agree. 

Also, notice that we still didn't fix the most important issue on example #1: the callbacks are still there, the flow is still not evident and our code still needs to carefully make sure that the events are emitted after the handlers are registered.

There's an arguably better solution, if we move one step forward into the functional paradigm, and that is what we will explore on [example #3](https://github.com/holden-caulfield/js-fun-intro-talk/tree/master/3-promises)
