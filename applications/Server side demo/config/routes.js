
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var home = require('../app/controllers/home');
var question = require('../app/controllers/question');
var request = require('request');

/**
 * Expose
 */

function requireLogin(req, res, next){
    if(req.query.xAPILaunchKey && req.query.xAPILaunchService){
        getActorToken(req, res, next);
    }
    else if(!req.user && !req.session.xAPIActor){
        throw new Error("You must be logged in to continue");
    }
    else next();
}

function error(res, data){
    res.status(500).send(data);
}

function getActorToken(req, res, next){
    var path = "launch/" + req.query.xAPILaunchKey;
    var service = req.query.xAPILaunchService;

    var endpoint = service.slice(-1) === '/' ? service + path : service + '/' + path;

    request.post(endpoint, (err, httpRes, body) => {
        console.log("Cookies: ", httpRes.headers["set-cookie"]);

        if(httpRes.headers["set-cookie"]) question.useCookie(httpRes.headers["set-cookie"][0]);

        var data;
        try{
            var data = JSON.parse(body);
        }
        catch(e){
            return error(res, body);
        }

        if(httpRes.statusCode === 200 && data){
            req.session.xAPIActor = data;
            res.redirect("/question/1");
            console.log("Success!");
        }
        else{
            return error(res, body);
        }
    });
}

module.exports = function (app, passport) {

  app.get('/', home.index);
  app.use('/question', requireLogin, question.router);

  app.use('/login', passport.authenticate('github'));
  app.use('/logout', function(req, res){
      req.logout();
      res.redirect("/");
  });

  app.get('/github/callback',
      passport.authenticate('github', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/question/1');
  });


  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
};
