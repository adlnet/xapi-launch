"use strict";
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
var blockInDemoMode = require("./utils.js").blockInDemoMode;
var CryptoJS = require("../public/scripts/pbkdf2.js").CryptoJS;

function userHasRole (role)
{
    return function(req, res, next)
    {
        if(!req.user) return res.status(401).send("not authorized");
        if (req.user.hasRole(role))
            next();
        else
            res.status(401).send("not authorized");
    }
}

exports.userHasRole = userHasRole

requirejs.config(
{
    nodeRequire: require
});

exports.checkOwner = function(obj,user)
{
    if(user == adminUser) return true;
    if(!obj || !user ) return false;
    if(obj.owner == user.email)
        return true;
    return false;
}
var checkOwner = require("./users.js").checkOwner;

function hash(pass,salt)
{
     var key = CryptoJS.PBKDF2(pass, salt,
                        {
                            keySize: 512 / 32,
                            iterations: 100
                        });
     return key.toString();
}

try{
var adminUser = function()
{
    this.username = "Admin";
    this.email = config.admin_email;
    this.salt = "";
    this.password = hash(config.admin_pass,"");
    this.dataType = "userAccount";
    this.roles = ["admin","creator"];

    Object.defineProperty(this,"isAdmin",{
        get:function()
        {
            return this.roles.indexOf("admin") !== -1
        }
    })
    Object.defineProperty(this,"isCreator",{
        get:function()
        {
            return this.roles.indexOf("creator") !== -1
        }
    })

    this.addRole = function(role)
    {
        
    }
    this.removeRole = function(role)
    {
      
    }
    this.hasRole = function(role)
    {
      return true;
    }
    this.save = function(cb)
    {
        process.nextTick(cb);
    }
    return this;
}.apply({});
} catch(e)
{
    console.log("error creating admin user. does the config file include admin_pass and admin_email?")
}


exports.adminUser = adminUser;
exports.setup = function(app, DAL)
{
    app.use(session(
    {
        resave: false,
        saveUninitialized: true,
        secret: "foobar"
    }));

    
    passport.use(new LocalStrategy(
        function(username, password, done)
        {
            if (username == config.admin_email)
            {
                console.log("admin login");
                console.log(password);
                if (password == adminUser.password)
                {
                    return done(null, adminUser);
                }
                else
                {
                    return done(null, false);
                }
            }
            else
            {
                DAL.getUser(username.toLowerCase(), function(err, user)
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
        }
    ));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done)
    {
        //console.log("SERIALIZING USER");
        done(null, user.email);
    });
    passport.deserializeUser(function(id, done)
    {
        if(id == config.admin_email)
        {
            return done(null,adminUser);
        }
        DAL.getUser(id, function(err, user)
        {
            done(err, user);
        });
    });

    if(config && config.demoMode)
    {
        app.use(function createMockUser(req, res, next)
        {
            DAL.getUser(config.demoModeUser,function(err,user)
            {
                if(!user)
                {
                    console.log("Could not find demo mode user");
                    process.exit();
                }
                req.user = user;
                next();
            })
        });
    }


    app.use(function defaultToServerLRS(req, res, next)
    {
      if(!req.user)
        return next();
      if(!req.user.lrsConfig || !req.user.lrsConfig.endpoint)
      {
        req.lrsConfig = {
            username: config.LRS_Username, 
            password: config.LRS_Password,
            endpoint: config.LRS_Url
        }
      }
      else if(req.user)
      {
        req.lrsConfig = req.user.lrsConfig;
      }
      next();
    });

    app.use(function saveUserToLocals(req, res, next)
    {
        res.locals.user = req.user;
        next();
    });

    app.get("/users/testCookie", function(req, res, next)
    {
        //console.log(req.sessionID);
        res.status(200).send(req.cookies["connect.sid"]);
    });
    app.get("/users/create", blockInDemoMode, function(req, res, next)
    {
        res.locals.pageTitle = "Create Account";
        res.render('createAccount',
        {})
    });
    app.get("/users/login", blockInDemoMode, function(req, res, next)
    {
        res.locals.pageTitle = "Login";
        if (req.user) res.redirect("/");
        else
            res.render('login',
            {})
    });
    app.get("/users/salt", blockInDemoMode,  function(req, res, next)
    {
        if(req.query.email == config.admin_email)
        {
            res.status(200).send(adminUser.salt);
            return;
        }
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
    app.post("/users/create",blockInDemoMode,  validateTypeWrapper(schemas.createAccountRequest, function(req, res, next)
    {
        DAL.createUser(req.body, function(err, user)
        {
            if (!err)
                res.status(200).send("200 - OK");
            else
                res.status(500).send(err);
        });
    }));

    app.get("/users/me",blockInDemoMode,  ensureLoggedIn(function(req, res, next)
    {
        res.render("editAccount",{
            user:req.user
        })
    }));
    app.post("/users/edit",blockInDemoMode,  ensureLoggedIn(validateTypeWrapper(schemas.editAccountRequest, function(req, res, next)
    {
        if(!req.user)
            return res.status(404).send("User not found");
        req.user.lrsConfig = req.body.lrsConfig;
        req.user.save(function(err)
        {
            res.status(200).send("200 - OK");
        })
    })));

    app.get('/users/logout',blockInDemoMode,  ensureLoggedIn(function(req, res, next)
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

                launch.remove(function(err)
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

            rest = rest.sort(function(a, b)
            {
                return (new Date(b.created)) - (new Date(a.created));
            })

            async.eachSeries(rest, function(i, cb)
            {
                DAL.getContentByKey(i.contentKey, function(err, content)
                {


                    if (content)
                    {
                        i.contentURL = content.url;
                        i.contentTitle = content.title;
                    }
                    else
                    {
                        i.contentURL = "{{content removed}}";
                        i.contentTitle = "{{content removed}}";
                    }
                    i.owned = req.user && i.email == req.user.email;

                    DAL.getMedia(i.mediaKey, function(err, media)
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
        DAL.getAllMediaTypes(function(err, types)
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
                    //console.log(results);
                    for (var i in results)
                    {
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user);
                        for (var j in types)
                            if (types[j].uuid == results[i].mediaTypeKey)
                                results[i].virtuals.mediaType = types[j];
                    }
                    res.locals.results = results;
                    res.render('contentResults', res.locals);
                }
            })
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
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user);
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        for (var j in types)
                        {
                            if (results[i].mediaTypeKey == types[j].uuid)
                                results[i].virtuals.mediaType = types[j];
                        }
                    }
                    res.locals.results = results;
                    res.render('mediaResults', res.locals);
                }
            })
        });
    }));


    app.post('/users/login',blockInDemoMode,  function(req, res, next)
    {
        if (req.user)
        {
            return res.status(200).send("already logged in");
        }
        passport.authenticate('local', function(err, user, info)
        {
            //console.log(err, user, info)
            if (err)
            {
                return next(err);
            }
            if (!user)
            {
                return res.status(400).send("login failed");
            }
            //console.log("login");
            req.login(user, function(err)
            {
                //console.log("login " + err)
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