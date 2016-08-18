/*!
 * parse-code-context <https://github.com/jonschlinkert/parse-code-context>
 * Regex originally sourced and modified from <https://github.com/visionmedia/dox>.
 *
 * Copyright (c) 2015 Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (str, i) {
  var match = null;

  // function statement
  if (match = /^function[ \t]([\w$]+)[ \t]*([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function statement',
      name: match[1],
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // function expression
  } else if (match = /^var[ \t]*([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function expression',
      name: match[1],
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // module.exports expression
  } else if (match = /^(module\.exports)[ \t]*=[ \t]*function[ \t]([\w$]+)[ \t]*([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'function expression',
      receiver: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '()',
      original: str
    };
    // module.exports method
  } else if (match = /^(module\.exports)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'method',
      receiver: match[1],
      name: '',
      params: (match[2]).split(/\W/g).filter(Boolean),
      string: match[1] + '.' + match[2] + '()',
      original: str
    };
    // prototype method
  } else if (match = /^([\w$]+)\.prototype\.([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'prototype method',
      class: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '.prototype.' + match[2] + '()',
      original: str
    };
    // prototype property
  } else if (match = /^([\w$]+)\.prototype\.([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'prototype property',
      class: match[1],
      name: match[2],
      value: match[3],
      string: match[1] + '.prototype.' + match[2],
      original: str
    };
    // method
  } else if (match = /^([\w$.]+)\.([\w$]+)[ \t]*=[ \t]*function([\w\W]+)?/.exec(str)) {
    return {
      begin: i,
      type: 'method',
      receiver: match[1],
      name: match[2],
      params: (match[3]).split(/\W/g).filter(Boolean),
      string: match[1] + '.' + match[2] + '()',
      original: str
    };
    // property
  } else if (match = /^([\w$]+)\.([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'property',
      receiver: match[1],
      name: match[2],
      value: match[3],
      string: match[1] + '.' + match[2],
      original: str
    };
    // declaration
  } else if (match = /^var[ \t]+([\w$]+)[ \t]*=[ \t]*([^\n;]+)/.exec(str)) {
    return {
      begin: i,
      type: 'declaration',
      name: match[1],
      value: match[2],
      string: match[1],
      original: str
    };
  }
  return null;
};
