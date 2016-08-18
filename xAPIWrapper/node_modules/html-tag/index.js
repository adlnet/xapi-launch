/*!
 * html-tag <https://github.com/jonschlinkert/html-tag>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

'use strict';


/**
 * ## tag( name, attrs, text )
 *
 * Create a snippet of HTML.
 *
 * **Examples:**
 *
 * ```js
 * tag('a', {href: 'http://www.google.com'}, 'Google');
 * tag('img', {src: 'foo.jpg'});
 * ```
 *
 * yields:
 *
 * ```html
 * <a href="http://www.google.com">Google</a>
 * <img src="foo.jpg">
 * ```
 *
 * @param {String} `tag` The tag to create.
 * @param {Object} `attrs` Optional attributes
 * @param {String} `text` Optional text
 * @return {String} HTML
 */

module.exports = function (tag, attrs, text) {
  var html = '<' + tag;

  for (var i in attrs) {
    if (attrs[i]) html += ' ' + i + '="' + attrs[i] + '"';
  }

  if (typeof text === 'boolean' && text === true) {
    html += '></' + tag + '>';
    return html;
  }

  html += text ? '>' + text + '</' + tag + '>' : '>';
  return html;
};