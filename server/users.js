var schemas = require("./schemas.js");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var requirejs = require('requirejs');
var session = require('express-session')
var async = require("async");
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var ensureNotLoggedIn = require("./utils.js").ensureNotLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper;
var config = require("./config.js").config;
requirejs.config(
{
    nodeRequire: require
});


exports.setup = function(app, DAL)
{
    app.use(session(
    {
        resave: false,
        saveUninitialized: false,
        secret: "foobar"
    }));

    passport.use(new LocalStrategy(
        function(username, password, done)
        {
            DAL.getUser(username, function(err, user)
            {
                if (err)
                {
                    done(null, false);
                    return;
                }
                if (user)
                {
                    if (user.password == password)
                    {
                        done(null, user);
                    }
                    else
                    {
                        done(null, false)
                    }
                }
                else
                {
                    done(null, false);
                }
            })
        }
    ));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done)
    {
        console.log("SERIALIZING USER");
        done(null, user.email);
    });
    passport.deserializeUser(function(id, done)
    {
        DAL.getUser(id, function(err, user)
        {
            done(err, user);
        });
    });
    app.use(function saveUserToLocals(req, res, next)
    {
        res.locals.user = req.user;
        next();
    });

    app.get("/users/create", function(req, res, next)
    {
        res.locals.pageTitle = "Create Account";
        res.render('createAccount',
        {})
    });
    app.get("/users/login", function(req, res, next)
    {
        res.locals.pageTitle = "Login";
        if (req.user) res.redirect("/");
        else
            res.render('login',
            {})
    });
    app.get("/users/salt", function(req, res, next)
    {
        DAL.getUser(req.query.email, function(err, user)
        {
            if (user && !err)
            {
                res.status(200).send(user.salt);
            }
            else
            {
                var CryptoJS = require("../public/scripts/pbkdf2.js").CryptoJS;
                var randomSalt = CryptoJS.lib.WordArray.random(128 / 8)
                res.status(200).send(randomSalt.toString());
            }
        });
    });
    app.post("/users/create", validateTypeWrapper(schemas.createAccountRequest, function(req, res, next)
    {
        DAL.createUser(req.body, function(err, user)
        {
            if (!err)
                res.status(200).send("200 - OK");
            else
                res.status(500).send(err);
        });
    }));

    app.get('/users/logout', ensureLoggedIn(function(req, res, next)
    {
        req.logout();
        res.redirect("/");
    }));
    app.get("/users/launches/:guid/delete", ensureLoggedIn(function(req, res, next)
    {
        DAL.getLaunchByGuid(req.params.guid, function(err, launch)
        {
            if (launch && launch.email == req.user.email)
            {

                launch.delete(function(err)
                {
                    res.redirect("/users/launches");
                })
            }
            else
            {
                res.redirect("/users/launches");
            }
        })
    }))
    app.get('/users/launches', ensureLoggedIn(function(req, res, next)
    {
        DAL.getAllUsersLaunch(req.user.email, function(err, results)
        {
            if (err)
                return res.status(500).send(err);
            var rest = [];
            for (var i in results)
            {
                var data = results[i].dbForm()
                data.createdTime = ((new Date(data.created)).toDateString());
                data.resultLink = config.LRS_Url + "/statements?format=exact&activity=" + encodeURIComponent(results[i].xapiForm().id) + "&related_activities=true";
                rest.push(data);
            }

            rest = rest.sort(function(a,b)
            {
                return (new Date(b.created)) - (new Date(a.created));
            })

            async.eachSeries(rest, function(i, cb)
            {
                DAL.getContentByKey(i.contentKey, function(err, content)
                {



                    if(content)
                    {
                        i.contentURL = content.url;
                        i.contentTitle = content.title;
                    }else
                    {
                        i.contentURL = "{{content removed}}";
                        i.contentTitle = "{{content removed}}";
                    }
                    i.owned = req.user && i.email == req.user.email;

                    DAL.getMedia(i.mediaKey,function(err,media)
                    {
                        i.media = media;
                        cb();
                    })
                    
                })
            }, function()
            {
                res.locals.results = rest;
                res.locals.pageTitle = "My Launch History";



                res.render("launchHistory", res.locals);
            })

        })
    }));
    app.get("/users/content", ensureLoggedIn(function(req, res, next)
    {
        DAL.getAllContentByOwner(req.user.email, function(err, results)
        {
            res.locals.pageTitle = "Your Apps";
            if (err)
            {
                res.locals.error = err;

                res.render('error', res.locals);
            }
            else
            {
                console.log(results);
                for (var i in results)
                {
                    results[i].launchKey = results[i].key;
                    results[i].owned = !!req.user && results[i].owner == req.user.email;

                }
                res.locals.results = results;
                res.render('contentResults', res.locals);
            }
        })
    }));


    app.get("/users/media", ensureLoggedIn(function(req, res, next)
    {
    

        res.locals.pageTitle = "Your Media";
        DAL.getAllMediaTypes(function(err, types)
        {
            DAL.getAllMediaByOwner(req.user.email, function(err, results)
            {
                if (err)
                {
                    res.locals.error = err;
                    res.render('error', res.locals);
                }
                else
                {
                    for (var i in results)
                    {
                        results[i].launchKey = results[i].key;
                        results[i].owned = !!req.user && results[i].owner == req.user.email;
                        results[i].resultLink = "/results/" + results[i].launchKey;
                        for (var j in types)
                        {
                            if (results[i].mediaTypeKey == types[j].uuid)
                                results[i].mediaType = types[j];
                        }
                    }
                    res.locals.results = results;
                    res.render('mediaResults', res.locals);
                }
            })
        });
    }));



    app.post('/users/login', function(req, res, next)
    {
        if (req.user)
        {
            return res.status(200).send("already logged in");
        }
        passport.authenticate('local', function(err, user, info)
        {
            console.log(err, user, info)
            if (err)
            {
                return next(err);
            }
            if (!user)
            {
                return res.status(400).send("login failed");
            }
            console.log("login");
            req.login(user, function(err)
            {
                console.log("login " + err)
                if (err)
                {
                    return next(err);
                }
                req.user = user;
                return res.status(200).send("login ok");
            });
        })(req, res, next);
    });
}