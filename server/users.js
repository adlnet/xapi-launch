
var schemas = require("./schemas.js");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var requirejs = require('requirejs');
var session = require('express-session')

exports.ensureLoggedIn = require("./utils.js").ensureLoggedIn;
exports.ensureNotLoggedIn = require("./utils.js").ensureNotLoggedIn;
exports.validateTypeWrapper = require("./utils.js").validateTypeWrapper;

requirejs.config(
{
    nodeRequire: require
});
//validate the incoming JSON object against a given schema
function validateTypeWrapper(type, cb)
{
    return function(req, res, next)
    {
        var dataRequest = req.body;
        var output = validate(dataRequest, type);
        if (output.errors.length == 0)
        {
            cb(req, res, next)
        }
        else
        {
            var message = "";
            for (var i = 0; i < output.errors.length; i++)
                message += output.errors[i].stack + ", ";
            res.status(500).send("500 - input validataion failed. " + message);
        }
    }
}
function ensureLoggedIn(cb)
{
    return function(req, res, next)
    {
        if(req.user)
            cb(req, res, next)
        else
        {
            res.redirect("/");
        }
    }
}

function ensureNotLoggedIn(cb)
{
    return function(req, res, next)
    {
        if(!req.user)
            cb(req, res, next)
        else
        {
            res.redirect("/");
        }
    }
}

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
        res.render('createAccount',
        {})
    });
    app.get("/users/login", function(req, res, next)
    {
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

    app.get('/users/logout',ensureLoggedIn(function(req,res,next)
    {
        req.logout();
        res.redirect("/");
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