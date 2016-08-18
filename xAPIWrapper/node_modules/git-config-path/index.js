/*!
 * git-config-path <https://github.com/jonschlinkert/git-config-path>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var home = require('os-homedir');

module.exports = function(type) {
  var configPath = path.join(process.cwd(), '.git/config');
  if (!exists(configPath) || type === 'global') {
    configPath = path.join(home(), '.gitconfig');
  }
  if (!exists(configPath)) {
    configPath = path.join(home(), '.config/git/config');
  }
  if (!exists(configPath)) {
    configPath = null;
  }
  return configPath;
};

function exists(fp) {
  try {
    fs.statSync(fp);
    return true;
  } catch (err) {}
  return false;
}
