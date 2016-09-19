"use strict";
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
var async = require('async');
var config = require("./config.js").config;
var blockInDemoMode = require("./utils.js").blockInDemoMode;
var checkOwner = require("./users.js").checkOwner;
var userHasRole = require("./users.js").userHasRole;
exports.setup = function(app, DAL)
{
    app.get("/media/browse", function(req, res, next)
    {
        res.locals.pageTitle = "Browse All Media";
        DAL.getAllMediaTypes(function(err, types)
        {
            DAL.getAllMedia(function(err, results)
            {
                //console.log(results);
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
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user);
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                        for (var j in types)
                        {
                            if (results[i].mediaTypeKey == types[j].uuid)
                            {
                                //console.log("got here");
                                results[i].virtuals.mediaType = types[j];
                            }
                        }
                    }
                    
                    res.locals.results = results;
                    res.render('mediaResults', res.locals);
                }
            })
        });
    });

   

    app.get("/media/register", blockInDemoMode, userHasRole("creator"), ensureLoggedIn(function(req, res, next)
    {
        DAL.getAllMediaTypes(function(err, types)
        {
            
            res.locals.pageTitle = "Register New Media";
            res.locals.types = types;
            //console.log(types);
            res.render('registerMedia', res.locals);
        })

    }));
    app.post("/media/register",blockInDemoMode, userHasRole("creator"), ensureLoggedIn(validateTypeWrapper(schemas.registerMediaRequest, function(req, res, next)
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
    app.get("/media/:key/delete",blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, media)
        {
            if (!media)
                return res.status(500).send("invalid media key");
            if (!checkOwner(media,req.user))
            {
                return res.status(500).send("you are not the owner of this media");
            }
            media.delete(function(err)
            {
                res.redirect("/media/browse");
            })
        })

    }));
    app.get("/media/:key/edit",blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, media)
        {
            if (!media)
                return res.status(500).send("invalid media key");
            if (!checkOwner(media,req.user))
            {
                return res.status(500).send("you are not the owner of this media");
            }
            DAL.getAllMediaTypes(function(err, types)
            {
                for (var i in types)
                {
                    if (media.mediaTypeKey == types[i].uuid)
                    {
                        types[i].virtuals.selected = true;
                    }
                }

              
                res.locals.media = media;
                res.locals.types = types;
                res.render("editMedia", res.locals);
            });
        })

    }));
    app.post("/media/:key/edit",blockInDemoMode, validateTypeWrapper(schemas.registerMediaRequest, ensureLoggedIn(function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, media)
        {

            if (!media)
                return res.status(500).send("invalid media key");
            if (!checkOwner(media,req.user))
            {
                return res.status(500).send("you are not the owner of this media");
            }
            DAL.getAllMediaTypes(function(err, types)
            {
                var found = false;
                for (var i in types)
                {
                    if (req.body.mediaTypeKey == types[i].uuid)
                    {
                        found = true;
                    }
                }
                if (!found)
                {
                    return res.status(401).send("invalid mediaType")
                }
                media.url = req.body.url;
                media.title = req.body.title;
                media.description = req.body.description;
                media.mediaTypeKey = req.body.mediaTypeKey;
                media.save(function(err)
                {
                    if (err)
                        return res.status(500).send(err);
                    else
                        return res.status(200).send("200 - OK");
                })
            });
        })

    })));
    app.get("/media/:key/launches", function(req, res, next)
    {
        DAL.getAllMediaLaunch(req.params.key, function(err, results)
        {
            if (err)
                return res.status(500).send(err);
            var rest = [];
            for (var i in results)
            {
                var data = results[i].dbForm()
                data.created = ((new Date(data.created)).toDateString());
                data.resultLink = config.LRS_Url + "/statements?format=exact&activity=" + encodeURIComponent(results[i].xapiForm().id) + "&related_activities=true";
                rest.push(data);
            }

            async.eachSeries(rest, function(i, cb)
            {
                DAL.getContentByKey(i.contentKey, function(err, content)
                {
                    if (!content)
                    {
                        return res.status(500).send("bad content key");
                    }
                    i.contentURL = content.url;
                    i.contentTitle = content.title;
                    i.owned = req.user && i.email == req.user.email;

                    if (!i.owned)
                    {
                        i.uuid = "{{hidden}}";
                    }

                    DAL.getMedia(i.mediaKey, function(err, media)
                    {
                        i.media = media;
                        cb();
                    })

                })
            }, function()
            {
                res.locals.results = rest;
                res.locals.pageTitle = "App Launch History";
                res.render("launchHistory", res.locals);
            })

        })
    });
    app.get("/media/search", function(req, res, next)
    {
        res.locals.pageTitle = "Search All Media";
        res.render("searchMedia", res.locals);
    })
    app.get("/media/search/:search", function(req, res, next)
    {
        res.locals.pageTitle = "Search All Media";
        var search = decodeURIComponent(req.params.search);
        var reg = new RegExp(search);
        DAL.findMedia( reg, function(err, results)
        {
            if (err)
            {
                res.locals.error = err;
                res.render('error', res.locals);
            }
            else
            {
                DAL.getAllMediaTypes(function(err, types)
                {
                    for (var i in results)
                    {
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i] , req.user);
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                        for (var j in types)
                        {
                            if (results[i].mediaTypeKey == types[j].uuid)
                                results[i].virtuals.mediaType = types[j];
                        }
                    }
                    res.locals.results = results;
                    res.render('mediaResults', res.locals);
                });
            }
        })
    });
    app.get("/media/:key", function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, content)
        {
            //console.log('get content by key');
            //console.log(err);
            if (content)
            {
                var data = content.dbForm();
                res.status(200).send(data);
            }
            else
            {
                res.status(500).send(err);
            }
        })
    });
    app.get("/media/:key/xapi", function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, content)
        {
            //console.log('get content by key');
            //console.log(err);
            if (content)
            {
                var data = content.xapiForm();
                res.status(200).send(data);
            }
            else
            {
                res.status(500).send(err);
            }
        })
    });
    app.post("/media/:key/star",blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
            DAL.getMedia(req.params.key,function(err,content)
            {
                    if(err)
                        return res.status(500).send(err);
                    if(!content)
                        return res.status(400).send("content not found");
                    content.star(req.user.email,function()
                    {
                            res.status(200).send();
                    })
            });
    }));
    app.post("/media/:key/unstar",blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
            DAL.getMedia(req.params.key,function(err,content)
            {
                    if(err)
                        return res.status(500).send(err);
                    if(!content)
                        return res.status(400).send("content not found");
                    content.unStar(req.user.email,function()
                    {
                            res.status(200).send();
                    })
            });
    }));
}