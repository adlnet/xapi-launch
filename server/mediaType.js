"use strict";
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
var async = require('async');
var config = require("./config.js").config;

exports.setup = function(app, DAL)
{
    app.get("/mediaType/browse", function(req, res, next)
    {

       //DAL.getMediaType("b5c7a376-b2b6-bb2c-a612-7b3afc9c54ee",function(err,type){type.delete(function(){})})

        DAL.getAllMediaTypes(function(err, types)
        {

            res.locals.pageTitle = "All MediaTypes";
            for (var i in types)
            {
                if (req.user && types[i].owner == req.user.email)
                    types[i].virtuals.owned = true;
            }

            res.locals.results = types;
            res.render('mediaTypes', res.locals);
        })
    });
    app.get(["/mediaType/:key/media", "/mediaType//media"], function(req, res, next)
    {
        DAL.getMediaType(req.params.key || "", function(err, mediaType)
        {
            if (!mediaType)
                return res.status(401).send("unknown media type");

            res.locals.pageTitle = "Browse All " + mediaType.name + " Media";
            DAL.getAllMediaByType(req.params.key, function(err, results)
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
                        results[i].virtuals.launchKey = results[i].key;
                        results[i].virtuals.owned = !!req.user && results[i].owner == req.user.email;
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                        results[i].virtuals.mediaType = mediaType;
                    }
                    res.locals.results = results;
                    res.render('mediaResults', res.locals);
                }
            })
        })

    });

    app.get("/mediaType/register", ensureLoggedIn(function(req, res, next)
    {

        res.locals.pageTitle = "Register New MediaType";
        res.locals.user = req.user;
        res.render('registerMediaType', res.locals);
    }));
    app.post("/mediaType/register", validateTypeWrapper(schemas.registerMediaTypeRequest, ensureLoggedIn(function(req, res, next)
    {
        DAL.createMediaType(req.body.name, req.body.description, req.body.iconURL, req.user.email, function(err, type)
        {
            if (err)
                return res.status(500).send(err)
            return res.status(200).send(type.dbForm());
        })

    })));


    app.get("/mediaType/:key", function(req, res, next)
    {
        DAL.getMediaType(req.params.key, function(err, type)
        {
            if (err)
                return res.status(500).send(err)
            if (!type)
                return res.status(401).send("unknown type")
           


            
            res.status(200).send(type.dbForm());
        })

    });
    app.get("/mediaType/:key/edit", ensureLoggedIn(function(req, res, next)
    {
        DAL.getMediaType(req.params.key, function(err, type)
        {
            if (err)
                return res.status(500).send(err)
            if (!type)
                return res.status(401).send("unknown type")
            if (type.owner !== req.user.email)
                return res.status(401).send("You are not the owner of this type")


            res.locals.type = type;
            res.locals.pageTitle = "Edit MediaType";
            res.render('editMediaType', res.locals);
        })

    }));

    app.post("/mediaType/:key/edit", validateTypeWrapper(schemas.registerMediaTypeRequest, ensureLoggedIn(function(req, res, next)
    {
        DAL.getMediaType(req.params.key, function(err, type)
        {
            if (err)
                return res.status(500).send(err)
            if (!type)
                return res.status(401).send("unknown type")
            if (type.owner !== req.user.email)
                return res.status(401).send("You are not the owner of this type")

            type.description = req.body.description;
            type.name = req.body.name;
            type.iconURL = req.body.iconURL;
            type.save(function(err)
            {
                if (err)
                    return res.status(500).send(err);
                return res.redirect("/mediaType/browse")
            })
        })

    })));

    app.get("/mediaType/:key/delete", ensureLoggedIn(function(req, res, next)
    {
        DAL.getMediaType(req.params.key, function(err, type)
        {
            if (err)
                return res.status(500).send(err)
            if (!type)
                return res.status(401).send("unknown type")
            if (type.owner !== req.user.email)
                return res.status(401).send("You are not the owner of this type")

            type.delete(function(err)
            {
                if (err)
                    return res.status(500).send(err);
                return res.redirect("/mediaType/browse")
            })
        })

    }));
}