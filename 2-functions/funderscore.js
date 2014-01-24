/**
  Examples for a Javascript talk:
  "Functional Programming, why should you care?"
  
  some very silly, non-production-ready "enhancements" to underscore
  to make it more friend for playing with functional programming exercises
*/
var _ = require('underscore');

//semi-borrowed from http://dailyjs.com/2012/09/14/functional-programming/
//it flips the first two args explicitly, tough. Flipping all arguments will
//get messed up on invocation if the calling function sends extra parameters
//(as _.map or _.each do, passing the index together with the item)
function flip2(func) {
  // preserve f
  var f = func;
  // construct g = f with first two args flipped
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return f.apply(this, [args[1], args[0]]);
  };
}

// extend the _ object with the very _.mixin function, suggestion found on this thread:
// http://www.reddit.com/r/javascript/comments/1l9gqu/hey_underscorejs_youre_doing_functional/
_.mixin({fextend: flip2(_.extend)});

module.exports = _;