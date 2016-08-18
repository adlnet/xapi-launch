/*!
 * html-tag <https://github.com/jonschlinkert/html-tag>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT License
 */

var expect = require('chai').expect;
var htmlTag = require('../');

describe('when text is passed:', function () {
  it('should create an element with a closing tag.', function () {
    var actual = htmlTag('a', {href: 'http://www.google.com'}, 'Google');
    expect(actual).to.eql('<a href="http://www.google.com">Google</a>');
  });
});

describe('when no text is passed:', function () {
  it('should create a void element.', function () {
    var actual = htmlTag('img', {src: 'foo.jpg'});
    expect(actual).to.eql('<img src="foo.jpg">');
  });
});

describe('when a boolean value is passed as the last arg:', function () {
  it('should create an empty text node and a closing tag.', function () {
    var actual = htmlTag('a', {href: 'foo.html'}, true);
    expect(actual).to.eql('<a href="foo.html"></a>');
  });
});
