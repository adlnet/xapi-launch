var form = require("./form.js").form;
var fs = require("fs");
var utils = require("./utils.js");
var blockInDemoMode = require("./utils.js").blockInDemoMode;
var AdmZip = require('adm-zip');
var async = require('async');
var config = require("./config.js").config;
var ensureLoggedIn = utils.ensureLoggedIn(function(req, res, next)
{
	next();
});
var File = require("./types.js").file;
var Package = require("./types.js").package;

function userHasRole(role)
{
	return function(req, res, next)
	{
		console.log("asdf");
		if (req.user.hasRole(role))
			next();
		else
			res.status(401).send("not authorized");
	}
}
exports.setup = function(app, DAL)
{
	app.get("/packages/upload/", ensureLoggedIn, form("./server/forms/uploadZip.json"));
	app.post("/packages/upload/", ensureLoggedIn, form("./server/forms/uploadZip.json"), function(req, res, next)
	{
		var package = require("node-uuid").v4();
		var file = req.files.zip;
		var zip = new AdmZip(file.buffer);
		var entries = zip.getEntries();
		var files = [];
		async.eachSeries(entries, function(entry, nextEntry)
		{
			if (entry.isDirectory)
				return nextEntry();
			var _f = new File()
			_f.DB = DAL.DB;
			files.push(_f);
			_f.package = package;
			_f.owner = req.user.email;
			_f.fromZipEntry(entry, nextEntry)
		}, function(err)
		{
			var _p = new Package()
			_p.DB = DAL.DB;
			_p.id = package;
			_p.name = file.originalFilename;
			_p.owner = req.user.email;
			var contentRequest = {};
			contentRequest.url = (config.host || "http://localhost:3000/") + "package/" + _p.id + "/index.html";
			contentRequest.title = _p.name;
			contentRequest.description = "Generated from uploaded zip file.";
			contentRequest.owner = req.user.email;
			contentRequest.packageLink = _p.id;
			contentRequest.iconURL = "/static/img/zip.png";
			DAL.registerContent(contentRequest, function(err, content)
			{
				_p.contentLink = content.key;
				_p.save(function()
				{
					res.redirect("/content/" + content.key +"/edit");
				})
			})
		});
	});

	function deletePackage(id, cb)
	{
		DAL.findPackage(
		{
			id: id,
		}, function(err, packages)
		{
			DAL.findFile(
			{
				package: id,
			}, function(err, files)
			{
				async.eachSeries(files, function(i, next)
				{
					i.deleteAndRemove(next)
				}, function()
				{
					packages[0].cleanAndDelete(function()
					{
						DAL.getContentByKey(packages[0].contentLink, function(err, content)
						{
							if (content)
							{
								content.delete(function()
								{
									cb(null)
								})
							}
							else
								cb(null);
						})
					})
				})
			})
		})
	}

	app.get("/packages/:id/delete", ensureLoggedIn, function(req, res, next)
	{
		DAL.findPackage(
		{
			id: req.params.id,
		}, function(err, packages)
		{
			if (!packages[0])
			{
				return res.status(404).send("package not found")
			}
			if (packages[0].owner !== req.user.email)
			{
				return res.status(401).send("Not authorized")
			}

			deletePackage(req.params.id,function(err)
			{
				res.redirect("/packages/");
			});
		});
	});
	app.get("/package/:id/*", function(req, res, next)
	{
		var query = {
			package: req.params.id,
			path: req.params[0] || "index.html"
		};
		DAL.findFile(query, function(err, files)
		{
			if (files[0])
			{
				files[0].getData(function(err, d)
				{
					res.contentType(require("path").extname(req.params[0] || "index.html")).send(d);;
				})
			}
			else
			{
				res.status(404).send();
			}
		})
	});
	app.get("/package/:id", function(req, res, next)
	{
		var query = {
			package: req.params.id,
		};
		DAL.findFile(query, function(err, files)
		{
			res.render("dirlist",
			{
				files: files,
				id: req.params.id
			})
		})
	});
	app.get("/packages", ensureLoggedIn, function(req, res, next)
	{
		var query = {
			owner: req.user.email
		};
		DAL.findPackage(query, function(err, packages)
		{
			res.render("packagelist",
			{
				packages: packages,
				id: req.params.id
			})
		})
	});
	exports.deletePackage = deletePackage;
}