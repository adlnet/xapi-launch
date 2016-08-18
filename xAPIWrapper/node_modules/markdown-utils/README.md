# markdown-utils [![NPM version](https://img.shields.io/npm/v/markdown-utils.svg?style=flat)](https://www.npmjs.com/package/markdown-utils) [![NPM downloads](https://img.shields.io/npm/dm/markdown-utils.svg?style=flat)](https://npmjs.org/package/markdown-utils) [![Build Status](https://img.shields.io/travis/jonschlinkert/markdown-utils.svg?style=flat)](https://travis-ci.org/jonschlinkert/markdown-utils)

Micro-utils for creating markdown snippets.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install markdown-utils --save
```

## Usage

```js
var mdu = require('markdown-utils');
```

## API

### [.blockquote](index.js#L28)

Create a markdown-formatted blockquote.

**Params**

* `str` **{String}**

**Example**

```js
utils.blockquote('This is a blockquote');
//=> '> This is a blockquote'
```

### [.code](index.js#L45)

Create a markdown-formatted `<code></code>` snippet.

**Params**

* `str` **{String}**

**Example**

```js
utils.code('var foo = bar;');
//=> '`var foo = bar;`'
```

### [.del](index.js#L62)

Create markdown-formatted `<del></del>`.

**Params**

* `str` **{String}**

**Example**

```js
utils.del('text');
//=> '~~text~~'
```

### [.em](index.js#L79)

Create a markdown-formatted em.

**Params**

* `str` **{String}**

**Example**

```js
utils.em('This is emphasized');
//=> '_This is emphasized_'
```

### [.h](index.js#L97)

Create a markdown-formatted heading.

**Params**

* `str` **{String}**
* `level` **{Number}**

**Example**

```js
utils.h(1, 'This is a heading');
//=> '# This is a heading'
```

### [.h1](index.js#L114)

Create a markdown-formatted h1 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h1('This is a heading');
//=> '# This is a heading'
```

### [.h2](index.js#L131)

Create a markdown-formatted h2 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h2('This is a heading');
//=> '## This is a heading'
```

### [.h3](index.js#L148)

Create a markdown-formatted h3 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h3('This is a heading');
//=> '### This is a heading'
```

### [.h4](index.js#L165)

Create a markdown-formatted h4 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h4('This is a heading');
//=> '#### This is a heading'
```

### [.h5](index.js#L182)

Create a markdown-formatted h5 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h5('This is a heading');
//=> '##### This is a heading'
```

### [.h6](index.js#L199)

Create a markdown-formatted h6 heading.

**Params**

* `str` **{String}**

**Example**

```js
utils.h6('This is a heading');
//=> '###### This is a heading'
```

### [.heading](index.js#L217)

Create a markdown-formatted heading.

**Params**

* `str` **{String}**
* `level` **{Number}**

**Example**

```js
utils.heading('This is a heading', 1);
//=> '# This is a heading'
```

### [.hr](index.js#L234)

Create a markdown-formatted horizontal rule.

**Params**

* `str` **{String}**: Alternate string to use. Default is `***` to avoid collision with `---` which is used for front matter.

**Example**

```js
utils.hr();
//=> '***'
```

### [.link](index.js#L253)

Create a markdown-formatted link from the given values.

**Params**

* `anchor` **{String}**
* `href` **{String}**
* `title` **{String}**

**Example**

```js
utils.link('fs-utils', 'https://github.com/assemble/fs-utils', 'hover title');
//=> [fs-utils](https://github.com/assemble/fs-utils "hover title")
```

### [.anchor](index.js#L272)

Create a markdown-formatted anchor link from the given values.

**Params**

* `anchor` **{String}**
* `href` **{String}**
* `title` **{String}**

**Example**

```js
utils.anchor('embed', 'assemble/handlebars-helpers/lib/code.js', 25, 'v0.6.0');
//=> [embed](https://github.com/assemble/handlebars-helpers/blob/v0.6.0/lib/helpers/code.js#L25)
```

### [.reference](index.js#L305)

Create a markdown-formatted reference link from the given values.

**Params**

* `id` **{String}**
* `url` **{String}**
* `title` **{String}**

**Example**

```js
utils.reference('template', 'https://github/jonschlinkert/template', 'Make stuff!');
//=> [template]: https://github/jonschlinkert/template "Make stuff!"
```

### [.image](index.js#L327)

Create a markdown-formatted image from the given values.

**Params**

* `alt` **{String}**
* `src` **{String}**
* `title` **{String}**

**Example**

```js
utils.image(alt, src);
//=> ![Build Status](https://travis-ci.org/jonschlinkert/template.svg)

utils.image(alt, src, title);
//=> ![Build Status](https://travis-ci.org/jonschlinkert/template.svg "This is title of image!")
```

### [.badge](index.js#L346)

Create a markdown-formatted badge.

**Params**

* `alt` **{String}**
* `img_url` **{String}**
* `url` **{String}**

**Example**

```js
utils.badge(alt, img_url, url);
//=> [![Build Status](https://travis-ci.org/jonschlinkert/template.svg)](https://travis-ci.org/jonschlinkert/template)
```

### [.li](index.js#L376)

Returns a function to generate a plain-text/markdown list-item, allowing options to be cached for subsequent calls.

**Params**

* 
`options` **{String}**

- `nobullet` **{Boolean}**: Pass true if you only want the list iten and identation, but no bullets.
- `indent` **{String}**: The amount of leading indentation to use. default is ``.
- `chars` **{String|Array}**: If a string is passed, [expand-range] will be used to generate an array of bullets (visit [expand-range] to see all options.) Or directly pass an array of bullets, numbers, letters or other characters to use for each list item. Default `['-', '*', '+', '~']`

* 
`fn` **{Function}**: pass a function [expand-range] to modify the bullet for an item as it's generated. See the [examples].

**Example**

```js
var li = listitem(options);

li(0, 'Level 0 list item');
//=> '- Level 0 list item'

li(1, 'Level 1 list item');
//=> '  * Level 1 list item'

li(2, 'Level 2 list item');
//=> '    + Level 2 list item'
```

### [.pre](index.js#L400)

Create a markdown-formatted `<pre><code></code></pre>` snippet with or without lang.

Results in:

**Params**

* `str` **{String}**
* `language` **{String}**

**Examples**

```js
utils.pre('var foo = bar;');
```

```html
<pre>
var foo = bar;
</pre>
```

### [.pre](index.js#L434)

Create a markdown-formatted code snippet with or without `lang`.

Results in:
<pre>
</pre>

**Params**

* `str` **{String}**
* `language` **{String}**

**Examples**

```js
utils.gfm('var foo = bar;', 'js');
```

```js
var foo = bar;
```

### [.strong](index.js#L454)

Create markdown-formatted bold text.

**Params**

* `str` **{String}**

**Example**

```js
utils.strong('This is bold');
//=> '**This is bold**'
```

### [.todo](index.js#L474)

Create a markdown-formatted todo item.

**Params**

* `str` **{String}**

**Example**

```js
utils.todo('this is a todo.');
//=> '- [ ] this is a todo'

utils.todo('this is a completed todo.', true);
//=> '- [x] this is a todo'
```

## Related projects

You might also be interested in these projects:

* [gfm-code-blocks](https://www.npmjs.com/package/gfm-code-blocks): Extract gfm (GitHub Flavored Markdown) fenced code blocks from a string. | [homepage](https://github.com/jonschlinkert/gfm-code-blocks)
* [markdown-link](https://www.npmjs.com/package/markdown-link): Micro util for generating a single markdown link. | [homepage](https://github.com/jonschlinkert/markdown-link)
* [markdown-toc](https://www.npmjs.com/package/markdown-toc): Generate a markdown TOC (table of contents) with Remarkable. | [homepage](https://github.com/jonschlinkert/markdown-toc)
* [remarkable](https://www.npmjs.com/package/remarkable): Markdown parser, done right. 100% Commonmark support, extensions, syntax plugins, high speed - all in… [more](https://www.npmjs.com/package/remarkable) | [homepage](https://github.com/jonschlinkert/remarkable)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/markdown-utils/issues/new).

## Building docs

Generate readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install verb && npm run docs
```

Or, if [verb](https://github.com/verbose/verb) is installed globally:

```sh
$ verb
```

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/jonschlinkert/markdown-utils/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on April 23, 2016._