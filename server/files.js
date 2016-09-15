
var form = require("./form.js").form;
var fs = require("fs");

var utils = require("./utils.js");
var blockInDemoMode = require("./utils.js").blockInDemoMode;

 var ensureLoggedIn = utils.ensureLoggedIn(function(req,res,next)
	{
		next();
	});

function userHasRole(role)
{
	return function(req,res,next)
	{
		console.log("asdf");
		if(req.user.hasRole(role))
			next();
		else
			res.status(401).send("not authorized");
	}
}

exports.setup = function(app, DAL)
{
	app.get("/files/upload/",ensureLoggedIn,form("./server/forms/uploadZip.json"));

}