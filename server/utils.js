"use strict";
var validate = require('jsonschema').validate;
var schemas = require("./schemas.js");
var config = require("./config.js").config;

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
            console.log("500 - input validataion failed. " + message);
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
            res.redirect("/users/login?r="+encodeURIComponent(req.originalUrl));
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
            res.redirect("/users/logout");
        }
    }
}

function ensureOneCall(cb)
{
	var calls = 0;
	return function(arg1,arg2,arg3,arg4,arg5,arg6)
	{
		calls ++;
		if(calls == 1)
			cb(arg1,arg2,arg3,arg4,arg5,arg6);
		else
		{
			console.log("callback already called!");
		}
	}
}

function blockInDemoMode(req,res,next)
{
    if(config.demoMode)
        return res.status(401).send("Not available in Demo Mode");
    else
        next();
}
exports.ensureLoggedIn = ensureLoggedIn;
exports.ensureNotLoggedIn = ensureNotLoggedIn;
exports.validateTypeWrapper = validateTypeWrapper;
exports.ensureOneCall = ensureOneCall;
exports.blockInDemoMode = blockInDemoMode;