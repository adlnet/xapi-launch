var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
exports.setup = function(app, DAL)
{
	app.get("/", function(res, req, next)
	{
		req.render('home', res.locals)
	});
	app.get("/content/register", ensureLoggedIn(function(res, req, next)
	{
		req.render('registerContent', res.locals)
	}));
	app.post("/content/register", ensureLoggedIn(validateTypeWrapper(schemas.registerContentRequest, function(req, res, next)
	{
		var content = req.body;
		content.owner = req.user.email;
		DAL.getContent(content.url, function(err, record)
		{
			
			if (err)
				res.status(500).send(err);
			else
			{
				if (record)
				{
					res.status(500).send("url already registered");
				}
				else
				{
					
					DAL.registerContent(content, function(err)
					{
						if (err)
						{
							return res.status(500).send(err);
						}
						else return res.status(200).send("200 OK");
					});
				}
			}
		});
	})));
	app.get("/content/:key/delete", ensureLoggedIn(function(req, res, next)
	{
		DAL.getContentByKey(req.params.key, function(err, content)
		{
			console.log('get content by key');
			if (content)
			{
				console.log(content.owner , req.user.email);
				if (content.owner == req.user.email)
				{
					console.log("user is the owner");
					content.delete(function(err)
					{
						res.redirect("/content/browse")
					})
				}
			}
			else
			{
				res.redirect("/content/browse")
			}
		})
	}));
	app.get("/content/browse", function(req, res, next)
	{
		DAL.getAllContent(function(err, results)
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
					
				}
				res.locals.results = results;
				res.render('results', res.locals);
			}
		})
	});
	app.get("/content/search/", ensureLoggedIn(function(req, res, next)
	{
		res.render('registerContent', res.locals)
	}));
}