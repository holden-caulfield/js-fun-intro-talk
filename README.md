js-fun-intro-talk
=================

These repository contains the materials used for a presentation called "Functional Programming, why should you care?", which is aimed for javascript developers that want to do a first glimpse on Functional Programming and understand how it is both an influence to javascript so far and a door opening possibilities for javascript on the future.

In addition to the presentation slides, the presentation is supported by a coding sample. In the example, a simplified (but still real-life) problem is addressed with javascript using [node.js](http://nodejs.org) and incrementally incorporating functional programming idioms to the solution.

The slides and each example are on separated folders so people can read/run them separatedly. Below there is a general description of the code example approach, and then each example has its own readme to dig into details.


The Code
--------

The problem used for this exercise is inspired by the excelent resource site [Front End Rescue](http://uptodate.frontendrescue.org/). The idea was to create a simple command line tool that given a keyword and a target amount of results, look for articles on the RSS feeds of the sites in the "blogs" section of the site

Each version of the solution addresses the problem in an incrementally more "functional" way:

# Example #1 uses *no functional constructs at all* and relies heavily on node's event system. The usual techniques to reduce callback hell (e.g. callback modularization and naming) are used.

# Example #2 adds *some basic functional constructs* that are more or less "mainstream" on javascript due to libraries like underscore.js. Things such as replacing imperative loops by high order functions, function composition, etc.

# Example #3 aims to *go functional to a wider extent* and change the callback oriented structure of the solution into a promises-driven one. Libraries and concepts here are less common in mainstream state-of-the-art javascript.

Running the Code
----------------

Each example must be installed and can be run separatedly in isolation. You need to have *node.js* installed on your system. *Node.js v0.10.24* was used during the development and presentation of this example, but since the example doesn't use fancy features, etc. is likely to run well on other versions as well.

Each example has its dependencies explicitly declare the standard way on its own *package.json* file. To prepare/install an example, just get into that particular example's folder run the usual [npm](https://npmjs.org) command, for example:

`cd 1-callbacks
npm install`

Will prepare the first example. Then, you can run it with the usual node command and passing two extra arguments for the keyword and the amount of targeted results. So for example:

`node callbacks.js functional 4`

Will search for up to 4 articles that contain the word "functional" somewhere. 

During the execution any errors (request timeouts, unparsable content, non-supported urls, etc.) should be logged, but the system *should still go on without crashing*. The system should log the results as well, and finish *as soon as it reaches the target amount of results* (this is, instead of keep launching or processing unnecessary requests)

So, a possible output would look like: 

`
Looking for 4 articles matching 'functional'
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
[Error: Protocol:https: not supported.]
{ source: 'EchoJS',
  uri: 'http://blakeembrey.com/articles/compose-functions-javascript/' }
{ source: 'EchoJS',
  uri: 'http://mrjoelkemp.com/2014/01/javascript-an-exploration-of-prototypal-inheritance/' }
{ source: 'SitePoint',
  uri: 'http://www.sitepoint.com/practical-guide-angularjs-directives-part-two/' }
{ source: 'EchoJS',
  uri: 'http://www.2ality.com/2014/01/tc39-march-november-2013.html' }
Done. Exiting...
`

Disclaimers
-----------

Even though the example is relatively real-life, specially in terms of the task to accomplish, it still remains an educative effort. So, not every corner case is covered, and some considerations that would usually be part of the solution (e.g. finishing the process in a tidy way instead of just killing it) were disregarded to keep the focus on the subject of discussion and make that more readable.

Also, it is worth noticing that the code sometimes "abuses" of asynchronism. In particular, it is clear that in some cases the tasks the way they are solved are not going to be long-running so one would argue there is no need to issue a callback/promise for them. In this sense, it is important to keep in mind that in a more realistic scenario it may be the case that long-running computations or i/o are needed. For example, the "matching" taks just uses "indexOf", but a more realistic approach would use a full-text parser or even a external service such as solr/Lucene to do a weighted matching, etc. The spirit of this example is to aim for cases on which several i/o or long-running operations will be performed and for such scenario a structure on which every step can be spawned asynchronously is the best model.