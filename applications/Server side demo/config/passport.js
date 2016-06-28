
/*!
 * Module dependencies.
 */

var local = require('./passport/local');
var github = require('./passport/github');

/**
 * Expose
 */

module.exports = function (passport, config) {
  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  // use these strategies
  //passport.use(local);
  passport.use(github);
};
