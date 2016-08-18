'use strict';

var chalk = require('chalk');

/**
 * ```js
 * // Lo-Dash
 * <%= log("this is a message!") %>
 * <%= log("%j", foo) %>
 *
 * // Handlebars
 * {{log "this is a message!"}}
 * ```
 */

exports.log = function log_() {
  console.log.apply(console, arguments);
};

/**
 * ```js
 * // Lo-Dash
 * <%= info("this is a message!") %>
 * <%= info("%j", foo) %>
 *
 * // Handlebars
 * {{info "this is a message!"}}
 * ```
 */

exports.info = function info_() {
  arguments[0] = chalk.cyan(arguments[0]);
  console.log.apply(console, arguments);
};

/**
 * ```js
 * // Lo-Dash
 * <%= bold("this is a message!") %>
 * <%= bold("%j", foo) %>
 *
 * // Handlebars
 * {{bold "this is a message!"}}
 * ```
 */

exports.bold = function bold_() {
  arguments[0] = chalk.bold(arguments[0]);
  console.log.apply(console, arguments);
};

exports.warn = function warn_() {
  arguments[0] = chalk.yellow(arguments[0]);
  console.warn.apply(console, arguments);
};

exports.error = function error_() {
  arguments[0] = chalk.red(arguments[0]);
  console.error.apply(console, arguments);
};

/**
 * Outputs a debug statement with the current context,
 * and/or `val`
 */

exports.debug = function debug_(val) {
  var args = [].slice.call(arguments);

  console.log();
  console.log('=================================');
  console.log('context: %j', this);
  console.log();
  if (!isUndefined(val)) {
    console.log.apply(console, ['value: %j'].concat(val));
  }
  console.log('=================================');
  console.log();
  return;
};

/**
 * Returns stringified JSON, wrapped in a markdown-formatted
 * codeblock, html pre tags, or nothing based on the `ext`
 * passed on the context.
 */

exports._inspect = function inspect_(context, options) {
  context = JSON.stringify(context, null, 2);
  var ext = options && options.hash && options.hash.ext || 'html';
  return switchOutput(ext, context);
};

/**
 * Generate output for the `inspect` helper based on the
 * extension passed.
 */

function switchOutput(ext, res) {
  if (ext[0] === '.') ext = ext.slice(1);
  switch (ext) {
    case 'md':
      return ''
        + '\n```json\n'
        + res
        + '\n```\n';
    case 'html':
      return ''
        + '<pre><code class="json">\n'
        + res
        + '</code></pre>';
    default:
      return res;
  }
}

function isUndefined(val) {
  return typeof val === 'undefined'
    || typeof val === 'function'
    || val.hash != null;
}
