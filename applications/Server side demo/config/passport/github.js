
/**
 * Module dependencies.
 */

var GitHubStrategy = require('passport-github').Strategy;
var config = require('../config');

/**
 * Expose
 */

module.exports = new GitHubStrategy(config.github,
  function(accessToken, refreshToken, profile, done) {
    console.log("Logged in! ", profile);
    done(null, profile);
  }
);
