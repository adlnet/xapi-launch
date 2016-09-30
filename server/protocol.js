"use strict";
var schemas = require("./schemas.js");
var requirejs = require('requirejs');
var session = require('express-session')
var async = require("async");
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var ensureNotLoggedIn = require("./utils.js").ensureNotLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper;
var lockedKeys = {};
var config = require("./config.js").config;
var checkOwner = require("./users.js").checkOwner;
exports.setup = function(app, DAL)
{
	app.get("/handler", ensureLoggedIn(function(req, res, next){

		res.send("You tried to launch " + req.query.uri);
	}));

}