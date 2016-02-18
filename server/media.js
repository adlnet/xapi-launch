var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
var async = require('async');
var config = require("./config.js").config;

exports.setup = function(app, DAL)
{
    app.get("/media/browse", function(req, res, next)
    {
        res.locals.pageTitle = "Browse All Media";
        DAL.getAllMedia(function(err, results)
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
                    results[i].resultLink = "/results/" + results[i].launchKey;
                }
                res.locals.results = results;
                res.render('mediaResults', res.locals);
            }
        })
    });

    app.get("/media/register", ensureLoggedIn(function(req, res, next)
    {
    	DAL.getAllMediaTypes(function(err,types)
    	{
    		res.locals = {};
        	res.locals.pageTitle = "Register New Media";
        	res.locals.types = types;
        	console.log(types);
        	res.render('registerMedia', res.locals);
    	})
        
    }));
    app.post("/media/register", ensureLoggedIn(validateTypeWrapper(schemas.registerMediaRequest, function(req, res, next)
    {
        var media = req.body;
        media.owner = req.user.email;

        DAL.getMedia(media.url, function(err, record)
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
                    DAL.getMediaType(media.mediaTypeKey, function(err, mediaType)
                    {
                        if (!mediaType)
                            return res.status(500).send("invalid media type");
                        DAL.createMediaRecord(media.url, media.mediaTypeKey, media.title, media.description, media.owner, function(err)
                        {
                            if (err)
                            {
                                return res.status(500).send(err);
                            }
                            else return res.status(200).send("200 OK");
                        });
                    })

                }
            }
        });
    })));
    app.get("/media/:key/delete", ensureLoggedIn(function(req, res, next)
    {
    	DAL.getMedia(req.params.key,function(err,media)
    	{
    		if(!media)
    			return res.status(500).send("invalid media key");
    		if(media.owner !== req.user.email)
    		{
    			return res.status(500).send("you are not the owner of this media");
    		}
    		media.delete(function(err)
    		{
    			res.redirect("/media/browse");
    		})
    	})
        
    }));
}