var validate = require('jsonschema').validate;
var schemas = require("./schemas.js");
var passport = require("passport");
var LocalStrategy = require("passport-local");
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

exports.setup = function(app, DAL)
{
    app.get("/users/create", function(res, req, next)
    {
        req.render('createAccount',
        {})
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
                        done(null, user);
                    else
                        done(null, false)
                }
                else
                {
                    done(null, false);
                }

            })
        }
    ));

    app.get('/users/login',
        passport.authenticate('local',
        {
            failureRedirect: '/users/create'
        }),
        function(req, res)
        {
            res.redirect('/');
        });
}