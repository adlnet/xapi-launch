'use strict';

/**
 * Module dependences
 */

var typeOf = require('kind-of');
var date = require('date.js');
var moment = require('moment');
var extend = require('extend-shallow');

module.exports = function momentHelper(str, pattern, options) {
  // if no args are passed, return a formatted date
  if (str == null && pattern == null) {
    moment.locale('en');
    return moment().format('MMMM DD, YYYY');
  }

  var opts = {lang: 'en', date: new Date()};
  opts = extend({}, opts, str, pattern, options);
  opts = extend({}, opts, opts.hash);

  // set the language to use
  moment.locale(opts.lang);

  if (opts.datejs === false) {
    return moment(new Date(str)).format(pattern);
  }
  // if both args are strings, this could apply to either lib.
  // so instead of doing magic we'll just ask the user to tell
  // us if the args should be passed to date.js or moment.
  if (typeof str === 'string' && typeof pattern === 'string') {
    return moment(date(str)).format(pattern);
  }

  // If handlebars, expose moment methods as hash properties
  if (opts.hash) {
    if (opts.context) {
      extend(opts.hash, opts.context);
    }

    var res = moment(str);
    for (var key in opts.hash) {
      if (res[key]) {
        return res[key](opts.hash[key]);
      } else {
        console.log('moment.js does not support "' + key + '"');
      }
    }
  }

  if (typeOf(str) === 'object') {
    return moment(str).format(pattern);
  }

  // if only a string is passed, assume it's a date pattern ('YYYY')
  if (typeof str === 'string' && !pattern) {
    return moment().format(str);
  }

  return moment(str).format(pattern);
};
