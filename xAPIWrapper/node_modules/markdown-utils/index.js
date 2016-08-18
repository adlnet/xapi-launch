/*!
 * markdown-utils <https://github.com/jonschlinkert/markdown-utils>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var isNumber = require('is-number');
var slice = require('array-slice');
var listitem = require('list-item');
var codeBlock = require('to-gfm-code-block');

/**
 * Create a markdown-formatted blockquote.
 *
 * ```js
 * utils.blockquote('This is a blockquote');
 * //=> '> This is a blockquote'
 * ```
 *
 * @name blockquote
 * @param  {String} `str`
 * @api public
 */

exports.blockquote = function blockquote(str) {
  return '> ' + str;
};

/**
 * Create a markdown-formatted `<code></code>` snippet.
 *
 * ```js
 * utils.code('var foo = bar;');
 * //=> '`var foo = bar;`'
 * ```
 *
 * @name code
 * @param  {String} `str`
 * @api public
 */

exports.code = function code(str) {
  return '`' + str + '`';
};

/**
 * Create markdown-formatted `<del></del>`.
 *
 * ```js
 * utils.del('text');
 * //=> '~~text~~'
 * ```
 *
 * @name del
 * @param  {String} `str`
 * @api public
 */

exports.del = function del(str) {
  return '~~' + str + '~~';
};

/**
 * Create a markdown-formatted em.
 *
 * ```js
 * utils.em('This is emphasized');
 * //=> '_This is emphasized_'
 * ```
 *
 * @name em
 * @param  {String} `str`
 * @api public
 */

exports.em = function em(str) {
  return '_' + str + '_';
};

/**
 * Create a markdown-formatted heading.
 *
 * ```js
 * utils.h(1, 'This is a heading');
 * //=> '# This is a heading'
 * ```
 *
 * @name h
 * @param  {String} `str`
 * @param  {Number} `level`
 * @api public
 */

exports.h = function h(level, str) {
  return exports.heading(str, level);
};

/**
 * Create a markdown-formatted h1 heading.
 *
 * ```js
 * utils.h1('This is a heading');
 * //=> '# This is a heading'
 * ```
 *
 * @name h1
 * @param  {String} `str`
 * @api public
 */

exports.h1 = function h1(str) {
  return '# ' + str;
};

/**
 * Create a markdown-formatted h2 heading.
 *
 * ```js
 * utils.h2('This is a heading');
 * //=> '## This is a heading'
 * ```
 *
 * @name h2
 * @param  {String} `str`
 * @api public
 */

exports.h2 = function h2(str) {
  return '## ' + str;
};

/**
 * Create a markdown-formatted h3 heading.
 *
 * ```js
 * utils.h3('This is a heading');
 * //=> '### This is a heading'
 * ```
 *
 * @name h3
 * @param  {String} `str`
 * @api public
 */

exports.h3 = function h3(str) {
  return '### ' + str;
};

/**
 * Create a markdown-formatted h4 heading.
 *
 * ```js
 * utils.h4('This is a heading');
 * //=> '#### This is a heading'
 * ```
 *
 * @name h4
 * @param  {String} `str`
 * @api public
 */

exports.h4 = function h4(str) {
  return '#### ' + str;
};

/**
 * Create a markdown-formatted h5 heading.
 *
 * ```js
 * utils.h5('This is a heading');
 * //=> '##### This is a heading'
 * ```
 *
 * @name h5
 * @param  {String} `str`
 * @api public
 */

exports.h5 = function h5(str) {
  return '##### ' + str;
};

/**
 * Create a markdown-formatted h6 heading.
 *
 * ```js
 * utils.h6('This is a heading');
 * //=> '###### This is a heading'
 * ```
 *
 * @name h6
 * @param  {String} `str`
 * @api public
 */

exports.h6 = function h6(str) {
  return '###### ' + str;
};

/**
 * Create a markdown-formatted heading.
 *
 * ```js
 * utils.heading('This is a heading', 1);
 * //=> '# This is a heading'
 * ```
 *
 * @name heading
 * @param  {String} `str`
 * @param  {Number} `level`
 * @api public
 */

exports.heading = function heading(str, level) {
  return exports['h' + (level || 1)](str);
};

/**
 * Create a markdown-formatted horizontal rule.
 *
 * ```js
 * utils.hr();
 * //=> '***'
 * ```
 *
 * @name hr
 * @param  {String} `str` Alternate string to use. Default is `***` to avoid collision with `---` which is used for front matter.
 * @api public
 */

exports.hr = function hr(str) {
  return str || '***';
};

/**
 * Create a markdown-formatted link from the given values.
 *
 * ```js
 * utils.link('fs-utils', 'https://github.com/assemble/fs-utils', 'hover title');
 * //=> [fs-utils](https://github.com/assemble/fs-utils "hover title")
 * ```
 *
 * @name link
 * @param  {String} `anchor`
 * @param  {String} `href`
 * @param  {String} `title`
 * @api public
 */

exports.link = function link(anchor, href, title) {
  return '[' + anchor + '](' + href + (title ? ' "' + title + '"' : '') + ')';
};

/**
 * Create a markdown-formatted anchor link from the given values.
 *
 * ```js
 * utils.anchor('embed', 'assemble/handlebars-helpers/lib/code.js', 25, 'v0.6.0');
 * //=> [embed](https://github.com/assemble/handlebars-helpers/blob/v0.6.0/lib/helpers/code.js#L25)
 * ```
 *
 * @name anchor
 * @param  {String} `anchor`
 * @param  {String} `href`
 * @param  {String} `title`
 * @api public
 */

exports.anchor = function anchor(text, repo, line, branch) {
  return '[' + text + '](' + format(repo, branch, line) + ')';
};

function format(str, branch, line) {
  var segs = str.split(/[\\\/]/);
  var repo = slice(segs, 0, 2).join('/');
  var rest = slice(segs, 2).join('/');
  if (isNumber(branch)) {
    line = branch;
    branch = 'master';
  }
  var res = 'https://github.com/';
  res += (repo + '/blob/' + branch + '/' + rest);
  res += (line ? '#L' + line : '');
  return res;
}

/**
 * Create a markdown-formatted reference link from the given values.
 *
 * ```js
 * utils.reference('template', 'https://github/jonschlinkert/template', 'Make stuff!');
 * //=> [template]: https://github/jonschlinkert/template "Make stuff!"
 * ```
 *
 * @name reference
 * @param  {String} `id`
 * @param  {String} `url`
 * @param  {String} `title`
 * @api public
 */

exports.reference = function reference(id, url, title) {
  return '[' + id + ']: ' + url + (title ? ' "' + title + '"' : '');
};

/**
 * Create a markdown-formatted image from the given values.
 *
 * ```js
 * utils.image(alt, src);
 * //=> ![Build Status](https://travis-ci.org/jonschlinkert/template.svg)
 *
 * utils.image(alt, src, title);
 * //=> ![Build Status](https://travis-ci.org/jonschlinkert/template.svg "This is title of image!")
 * ```
 *
 * @name image
 * @param  {String} `alt`
 * @param  {String} `src`
 * @param  {String} `title`
 * @api public
 */

exports.image = function image(alt, src, title) {
  return '!' + exports.link(alt, src, title);
};

/**
 * Create a markdown-formatted badge.
 *
 * ```js
 * utils.badge(alt, img_url, url);
 * //=> [![Build Status](https://travis-ci.org/jonschlinkert/template.svg)](https://travis-ci.org/jonschlinkert/template)
 * ```
 *
 * @name badge
 * @param  {String} `alt`
 * @param  {String} `img_url`
 * @param  {String} `url`
 * @api public
 */

exports.badge = function badge(alt, img_url, url, title) {
  return exports.link(exports.image(alt, img_url, title), url);
};

/**
 * Returns a function to generate a plain-text/markdown list-item,
 * allowing options to be cached for subsequent calls.
 *
 * ```js
 * var li = listitem(options);
 *
 * li(0, 'Level 0 list item');
 * //=> '- Level 0 list item'
 *
 * li(1, 'Level 1 list item');
 * //=> '  * Level 1 list item'
 *
 * li(2, 'Level 2 list item');
 * //=> '    + Level 2 list item'
 * ```
 *
 * @name .li
 * @param  {String} `options`
 *   @option {Boolean} [options] `nobullet` Pass true if you only want the list iten and identation, but no bullets.
 *   @option {String} [options] `indent` The amount of leading indentation to use. default is `  `.
 *   @option {String|Array} [options] `chars` If a string is passed, [expand-range] will be used to generate an array of bullets (visit [expand-range] to see all options.) Or directly pass an array of bullets, numbers, letters or other characters to use for each list item. Default `['-', '*', '+', '~']`
 * @param {Function} `fn` pass a function [expand-range] to modify the bullet for an item as it's generated. See the [examples].
 * @api public
 */

exports.li = function li(str, lvl, opts, fn) {
  return listitem(opts, fn)(lvl, str);
};

/**
 * Create a markdown-formatted `<pre><code></code></pre>` snippet with or without lang.
 *
 * ```js
 * utils.pre('var foo = bar;');
 * ```
 * Results in:
 *
 * ```html
 * <pre>
 * var foo = bar;
 * </pre>
 * ```
 *
 * @name pre
 * @param  {String} `str`
 * @param  {String} `language`
 * @api public
 */

exports.pre = function pre(str) {
  if (typeof str !== 'string') {
    throw new TypeError('markdown-pre expects a string.');
  }

  var code = '';
  code += '<pre>'
  code += '\n';
  code += str;
  code += '\n';
  code += '</pre>';
  return code;
};

/**
 * Create a markdown-formatted code snippet with or without `lang`.
 *
 * ```js
 * utils.gfm('var foo = bar;', 'js');
 * ```
 * Results in:
 *
 * <pre>
 * ```js
 * var foo = bar;
 * ```
 * </pre>
 *
 * @name pre
 * @param  {String} `str`
 * @param  {String} `language`
 * @api public
 */

exports.gfm = function gfm(str, lang) {
  if (typeof str !== 'string') {
    throw new TypeError('markdown-gfm expects a string.');
  }
  return codeBlock(str, lang);
};

/**
 * Create markdown-formatted bold text.
 *
 * ```js
 * utils.strong('This is bold');
 * //=> '**This is bold**'
 * ```
 *
 * @name strong
 * @param  {String} `str`
 * @api public
 */

exports.strong = function strong(str) {
  return '**' + str + '**';
};

/**
 * Create a markdown-formatted todo item.
 *
 * ```js
 * utils.todo('this is a todo.');
 * //=> '- [ ] this is a todo'
 *
 * utils.todo('this is a completed todo.', true);
 * //=> '- [x] this is a todo'
 * ```
 *
 * @name todo
 * @param  {String} `str`
 * @api public
 */

exports.todo = function todo(str, checked) {
  return (checked ? '- [x] ' : '- [ ] ') + str;
};

