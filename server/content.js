var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
exports.setup = function(app, DAL)
{
	app.get("/", function(res, req, next)
	{
		res.locals = {};
		res.locals.pageTitle = "home";
		req.render('home', res.locals)
	});
	app.get("/content/register", ensureLoggedIn(function(res, req, next)
	{
		res.locals = {};
		res.locals.pageTitle = "Register New Content";
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
			console.log(err);
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
	app.get("/content/:key/json", function(req, res, next)
	{
		DAL.getContentByKey(req.params.key, function(err, content)
		{
			console.log('get content by key');
			console.log(err);
			if (content)
			{
				res.status(200).send(content.dbForm());
			}
			else
			{
				res.status(500).send(err);
			}
		})
	});
	app.get('/content/:key/launches',function(req,res,next)
    {
        DAL.getAllContentLaunch(req.params.key,function(err,results)
        {
            if(err)
                return res.status(500).send(err);
            var rest = [];
            for (var i in results)
                rest.push(results[i].dbForm());
            res.status(200).send(rest);
        })
    });
	app.get("/content/:key/launch", ensureLoggedIn( function(req, res, next)
	{
		DAL.getContentByKey(req.params.key, function(err, content)
		{
			if (content)
			{
				DAL.createLaunchRecord({email:req.user.email,contentKey:req.params.key},function(err,launch)
				{
					if(err)
						res.status(500).send(err);
					else
						res.status(200).send(launch.dbForm());
				})
			}
			else
			{
				res.status(500).send(err);
			}
		})
	}));
	app.get("/content/launch/:guid", ensureLoggedIn( function(req, res, next)
	{
		DAL.getLaunchByGuid(req.params.guid, function(err, launch)
		{
			if (content)
			{
				if(launch.state == 0)
				{
					//return launch data
					launch.state = 1;
					launch.save(function(err)
					{

					});
				}
			}
			else
			{
				res.status(500).send(err);
			}
		})
	}));
	app.get("/content/browse", function(req, res, next)
	{
		res.locals.pageTitle = "Browse All Content";
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
		res.locals.pageTitle = "Register New Content";
		res.render('registerContent', res.locals)
	}));
}