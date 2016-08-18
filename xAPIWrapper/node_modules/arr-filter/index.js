/*!
 * arr-filter <https://github.com/jonschlinkert/arr-filter>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License
 */

'use strict';

var iterator = require('make-iterator');

module.exports = function filter(arr, cb, thisArg) {
  if (arr == null) {
    return [];
  }

  if (typeof cb !== 'function') {
    throw new TypeError('arr-filter expects a callback function.');
  }

  cb = iterator(cb, thisArg);
  var len = arr.length;
  var res = arr.slice();
  var i = 0;

  while (len--) {
    if (!cb(arr[len], i++)) {
      res.splice(len, 1);
    }
  }

  return res;
};

