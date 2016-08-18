/*!
 * code-context <https://github.com/jonschlinkert/code-context>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var parse = require('parse-code-context');

module.exports = function (str, fn) {
  if (typeof str !== 'string') {
    throw new TypeError('code-context expects a string.');
  }

  var lines = str.split(/[\r\n]/);
  var len = lines.length, res = [], i = -1, j = 0;
  var num = 1;

  while (++i < len) {
    var o = parse(lines[i].replace(/^\s+/, ''), num++);
    if (!o) continue;

    if (typeof fn === 'function') {
      o = fn(o, j++, lines);
    }

    if (!o) continue;
    res.push(o);
  }
  return res;
};
