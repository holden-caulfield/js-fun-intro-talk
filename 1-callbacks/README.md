Example 1 - Callbacks
=====================

This version of the example relies heavily on node's event system and callbacks to handle the asynchronous computations. The readme below discusses the challenges found during this approach, with a biased focus on what is ugly/cumbersome and may be improved with a different approach.

Coping with callback hell
-------------------------

First issue that one notices while coding imperative callbacks for asynchronous work is that the callbacks start to nest themselves when there is a "chain" of asynchonous computations that need to be done one after the other. Actually the first take of the exercise looked a bit more like this:

	for (i=0; i<feeds.length; i++) {
		parser.parseURL(feed.url, {}, function(err, out) {
    		if(err) {
      			console.log(err);
    		} else {
      			results = out.items;
      			for (j=0; j< results.length; j++) {
        			.....
        			http.get(item.uri, function (res) {
      					res.setEncoding('utf-8');
      					item.body = "";
      					res.on('data', function(chunk) {
        					item.body += chunk;
					    }).on('end', function() {
					    	.... //more callback hell here
					    }).on('error', function(e) { 
					      console.log("Got error: " + e.message);
					    });
					});
      			}
    		} 
  		}); 
	}

This is a very known issue usually referred to as "callback hell". One way to solve this is to change the callbacks from in-line closures to named functions, and that's exactly how it is done on the example. Then we use node's event system to make the "chain" more explicit and readable:

	emitter.on("feed", parseFeed);
	emitter.on("news", fetchItem);
	emitter.on("fetched", selectRelevant);
	emitter.on("select", sendToOutput);

Even though usually people don't keep the first version and do this named functions refactor, it is interesting that a callback based API leads you to think first like that and then have to reorganize your code.

Other issues about callbacks
----------------------------

Another issue I see with callback-based programming is that when you express your solution in the code you need to mix logic that deals explicitly with the asynchronism and logic that actually solves the problem at hand. One real issue while solving this was where exactly to put the code for the events registration vs the named callbacks. The decision in this case was to put all the event declaration first and then all the callback functions. Other option may have been to put every callback together with the corresponding event registration. Which one is more readable? I prefer the former but is something one may argue forever, and the reason is because neither is really good enough.

A more important issue arises as to *when* to register the event handlers vs. when to emit the events. Turns out that in order to guarantee that the program does what it needs to do, a careful control of the execution timing needs to be done. In particular, this loop needs to be executed *after* the event handlers are registered:

	for (i=0; i<feeds.length; i++) {
	  emitter.emit("feed", feeds[i]);
	}

If you put this *before* registering the handlers, then the code will not crash (meaning it is still syntactically and semantically correct) but will not do what you expect to do. This is because the events are emitted once, and with no handlers to catch them. Once you register the hanlders, it is already too late. In a more complicated environment, that may include page loads, requests finishing, etc. having to control this timing can be cumbersome or even force you to use something like *setTimeout* just to wait "enough" time before executing things.

Finally, in this case we are working with a direct "chain" of steps, so it is more or less predictable that one handling function will emit the next event in the chain. Other processes may be more complicated with "branches" that you need to coordinate, etc. In those cases it is a critical difference to notice that on a callback based solution each callback function, by design, *returns nothing*. This what the data needs to be passed by other channels instead of simply function call return values: the events emitted, shared memory, etc. 

Imperative loops
----------------

This is a somewhat obvious comment but imperative loops like the ones used on the example above have issues with readability and are error prone. In fact, at the moment of writing this readme I just noticed that on this other loop I dragged a "j" variable, just because initially it was nested on another loop with an "i" variable that I didn't want to shadow:

	for (j=0; j< results.length; j++) {
		var item = results[j];
        item.source = feed.name;
        emitter.emit("news", item);
    }

