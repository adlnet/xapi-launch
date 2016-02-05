var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
var async = require('async');
exports.setup = function(app, DAL)
{
	app.get("/", function(res, req, next)
	{
		res.locals = {};
		res.locals.pageTitle = "Home";
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
	
	
	app.get("/content/:key/edit", ensureLoggedIn( function(req, res, next)
	{
		DAL.getContentByKey(req.params.key, function(err, content)
		{
			if (content)
			{
				if(content.owner == req.user.email)
				{
					if(!res.locals)
						res.locals = {};
					res.locals.content = content;
					res.locals.pageTitle = "Edit Content";
					res.render("editContent",res.locals); 
				}
			}
			else
			{
				res.status(500).send(err);
			}
		})
	}));
	app.post("/content/:key/edit", ensureLoggedIn(validateTypeWrapper(schemas.registerContentRequest, function(req, res, next)
	{
		DAL.getContentByKey(req.params.key, function(err, content)
		{
			if (content)
			{
				if(content.owner == req.user.email)
				{
					content.url = req.body.url;
					content.title = req.body.title;
					content.description = req.body.description;
					content.save(function(err)
					{
						if(err)
							res.status(500).send(err);
						else
							res.status(200).send("OK");
					})
				}
			}
			else
			{
				res.status(500).send(err);
			}
		})
	})));
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
	app.get("/content/:key/launches", function(req, res, next)
	{
		DAL.getAllContentLaunch(req.params.key,function(err, results)
        {
            if (err)
                return res.status(500).send(err);
            var rest = [];
            for (var i in results)
            {
                var data = results[i].dbForm()
                data.created = ((new Date(data.created)).toDateString());
                rest.push(data);
            }

            async.eachSeries(rest, function(i, cb)
            {
                DAL.getContentByKey(i.contentKey, function(err, content)
                {
                    i.contentURL = content.url;
                    i.contentTitle = content.title;
                    i.owned = req.user && i.email == req.user.email;
                    if(!i.owned)
                    {
                    	i.uuid = "{{hidden}}";
                    }
                    cb();
                })
            }, function()
            {
                res.locals.results = rest;
                res.locals.pageTitle = "Content Launch History";
                res.render("launchHistory", res.locals);
            })

        })
	});
	app.get("/content/search", function(req, res, next){
		res.locals.pageTitle = "Search All Content";
        res.render("search", res.locals);
	})
	app.get("/content/search/:search", function(req, res, next)
	{
		res.locals.pageTitle = "Search All Content";
		var search = decodeURIComponent(req.params.search);
		var reg = new RegExp(search);
		DAL.DB.find({$and:[{dataType:"contentRecord"},{$or:[{_id:search},{title:reg},{description:reg},{url:reg},{owner:reg}]}]} ,function(err, results)
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
					results[i].launchKey = results[i]._id;
					results[i].owned = !!req.user && results[i].owner == req.user.email;
					
				}
				res.locals.results = results;
				res.render('results', res.locals);
			}
		})
	});
}