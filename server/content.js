"use strict";
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper
var schemas = require("./schemas.js");
var async = require('async');
var config = require("./config.js").config;
var blockInDemoMode = require("./utils.js").blockInDemoMode;
var form = require("./form.js").form;
var checkOwner = require("./users.js").checkOwner;
var userHasRole = require("./users.js").userHasRole;

function mustLogIn(req,res,next)
{
    if(req.user)
           next();
        else
        {
            res.redirect("/users/login?r="+encodeURIComponent(req.originalUrl));
        }
}
exports.setup = function(app, DAL)
{   
    if(!config) return; // the config file was not found
    if(!config.demoMode)
    {
    app.get("/", function(res, req, next)
    {
        res.locals = {};
        res.locals.pageTitle = "Home";
        res.locals.host = config.host || "http://localhost:3000/";
        req.render('home', res.locals)
    });
    }else
    {
        app.get("/",browseContent);
    }
    app.get("/content/register", blockInDemoMode, userHasRole("creator"),mustLogIn,function(req, res, next)
    {

        
        DAL.getAllMediaTypes(function(err, types)
        {
            req.formSchema = JSON.parse(require('fs').readFileSync("./server/forms/app.json").toString());
            req.defaults = {};
            req.defaults.fields = {};
            
            res.locals = {};    
            res.locals.pageTitle = "Register New App";
            //select none type by default
            
            types[0].virtuals.selected = true;
            for(var i in types)
            {
                req.formSchema.fields[req.formSchema.fields.length-2].options.push({
                    text : types[i].name,
                    value : types[i]._id.toString()
                })
            }
            
           // req.render('registerContent', res.locals)
           
           
            form()(req,res,next);
        });

    });
    app.post("/content/register/",  blockInDemoMode, userHasRole("creator"), mustLogIn,form("./server/forms/app.json"),(validateTypeWrapper(schemas.registerContentRequest, function(req, res, next)
    {
        var content = req.body;
        content.owner = req.user.email;

        //test the format of the supplied key, if one was set
        try
        {
            if (req.body.publicKey)
                var testKey = new require('node-rsa')(req.body.publicKey)
        }
        catch (e)
        {
            res.status(500).send(e.message);
            return;
        }

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
    app.get("/content/:key/delete", blockInDemoMode,  ensureLoggedIn(function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            //console.log('get content by key');
            //console.log(err);
            if (content)
            {
                //console.log(content.owner, req.user.email);
                if (checkOwner(content,req.user))
                {
                    //console.log("user is the owner");
                    content.remove(function(err)
                    {
                        if(content.packageLink)
                        {
                            require("./files.js").deletePackage(content.packageLink,function()
                            {
                                res.redirect("/content/browse")    
                            })
                        }
                        else
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


    app.get("/content/:key/edit",  blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            if (content)
            {
                if (checkOwner(content,req.user))
                {
                    DAL.getAllMediaTypes(function(err, types)
                    {
                        if (!res.locals)
                            res.locals = {};
                        res.locals.content = content;
                        res.locals.pageTitle = "Edit App";
                        res.locals.types = types;
                        for (var i in types)
                        {
                            if (content.mediaTypeKey == types[i].uuid)
                            {
                                types[i].virtuals.selected = true;;
                            }
                        }

                        res.locals.launchIsPopup = content.launchType == "popup";
                        res.locals.launchIsRedirect = content.launchType == "redirect";
                        res.locals.launchIsFrame = content.launchType == "frame";
                        res.locals.launchIsManuel = content.launchType == "popup";
                        res.render("editContent", res.locals);
                    });
                }
            }
            else
            {
                res.status(500).send(err);
            }
        })
    }));
    app.post("/content/:key/edit",  blockInDemoMode, ensureLoggedIn(validateTypeWrapper(schemas.registerContentRequest, function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            //test the format of the supplied key, if one was set
            try
            {
                if (req.body.publicKey)
                    var testKey = new require('node-rsa')(req.body.publicKey)
            }
            catch (e)
            {
                res.status(500).send(e.message);
                //console.log(e);
                return;
            }
            if (content)
            {
                if (checkOwner(content,req.user))
                {
                    content.url = req.body.url;
                    content.title = req.body.title;
                    content.description = req.body.description;
                    content.publicKey = req.body.publicKey;

                    content.timeToConsume = req.body.timeToConsume;
                    content.sessionLength = req.body.sessionLength;
                    content.mediaTypeKey = req.body.mediaTypeKey;
                    content.launchType = req.body.launchType;
                    content.customData = req.body.customData;
                    content.save(function(err)
                    {
                        if (err)
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
    function browseContent(req, res, next)
    {
        res.locals.pageTitle = "Browse All Apps";
        DAL.getAllMediaTypes(function(err, types)
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
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user) ;
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        for (var j in types)
                            if (types[j].uuid == results[i].mediaTypeKey)
                                results[i].virtuals.mediaType = types[j];
                    }
                    res.locals.results = results;
                    res.render('contentResults', res.locals);
                }
            })
        })
    };
    app.get("/content/browse", browseContent);

    app.get("/content/:key/xapi", function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            //console.log('get content by key');
            //console.log(err);
            if (content)
            {
                var data = content.xapiForm();
                data.publicKey = undefined;
                res.status(200).send(data);
            }
            else
            {
                res.status(500).send(err);
            }
        })
    });
    app.post("/content/:key/star",  blockInDemoMode, ensureLoggedIn(function(req, res, next)
    {
            DAL.getContentByKey(req.params.key,function(err,content)
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
    app.post("/content/:key/unstar", blockInDemoMode,  ensureLoggedIn(function(req, res, next)
    {
            DAL.getContentByKey(req.params.key,function(err,content)
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
    app.get("/content/:key/launches", function(req, res, next)
    {
        DAL.getAllContentLaunch(req.params.key, function(err, results)
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
    app.get("/content/search", function(req, res, next)
    {
        res.locals.pageTitle = "Search All Apps";
        res.render("search", res.locals);
    })
    app.get("/content/search/:search", function(req, res, next)
    {
        res.locals.pageTitle = "Search All Apps";
        var search = decodeURIComponent(req.params.search);
        var reg = new RegExp(search);
        DAL.getAllMediaTypes(function(err, types)
        {
            DAL.findContent(reg, function(err, results)
            {
                if (err)
                {
                    res.locals.error = err;
                    console.log(err);
                    res.send(err);
                }
                else
                {
                    for (var i in results)
                    {
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user);
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                         for (var j in types)
                            if (types[j].uuid == results[i].mediaTypeKey)
                                results[i].virtuals.mediaType = types[j];
                    }
                    res.locals.results = results;
                    res.render('contentResults', res.locals);
                   
                }
            })
        })
    });
    app.get("/content/searchid/:search", function(req, res, next)
    {
        res.locals.pageTitle = "Search All Apps";
        var search = decodeURIComponent(req.params.search);
        var reg = (search);
        DAL.getAllMediaTypes(function(err, types)
        {
            DAL.getContentByKey(reg, function(err, result)
            {
                if (err || !result)
                {
                    res.locals.error = err;
                    console.log(err);
                    res.send(err);
                }
                else
                {
                    var results = [result];
                    for (var i in results)
                    {
                        results[i].virtuals.launchKey = results[i]._id;
                        results[i].virtuals.owned = !!req.user && checkOwner(results[i],req.user);
                        results[i].virtuals.resultLink = "/results/" + results[i].virtuals.launchKey;
                        results[i].virtuals.stared = req.user && results[i].stars.indexOf(req.user.email) > -1;
                         for (var j in types)
                            if (types[j].uuid == results[i].mediaTypeKey)
                                results[i].virtuals.mediaType = types[j];
                    }
                    res.locals.results = results;
                    res.render('contentResults', res.locals);
                   
                }
            })
        })
    });
    app.get("/content/:key", function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            //console.log('get content by key');
            //console.log(err);
            if (content)
            {
                var data = content.dbForm();
                data.publicKey = undefined;
                res.status(200).send(data);
            }
            else
            {
                res.status(500).send(err);
            }
        })
    });
    app.get("/results/:key", ensureLoggedIn(function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            DAL.getLaunchByGuid(req.params.key, function(err, launch)
            {
                if (content && !checkOwner(content,req.user))
                    return res.status(401).send("You are not the owner of this content.");
                if (launch && launch.email !== req.user.email)
                    return res.status(401).send("You are not the owner of this launch.");
                if (!content && !launch)
                    return res.status(400).send("Unknown Identifier.");
                var content_or_launch = content || launch;
                console.log(req.lrsConfig.endpoint);
                var resultLink = req.lrsConfig.endpoint + "statements?format=exact&activity=" + encodeURIComponent(content_or_launch.xapiForm().id) + "&related_activities=true&limit=1000";

                res.locals.searchLink = resultLink;
                require('request')(
                {
                    uri: resultLink,
                    method: "GET",
                    followRedirect: true,
                    headers:
                    {
                        "X-Experience-API-Version": "1.0.1"
                    }
                }, function(e, r, body)
                {
                    if(e ||  r.statusCode != 200)
                    {
                        return res.status(500).send(e + ' ' + body);
                    }
                    res.locals.pageTitle = "Results for " + (content ? content.title : launch.email);
                    res.locals.results = JSON.parse(body).statements;
                    for(var i in res.locals.results)
                        res.locals.results[i].str = JSON.stringify(res.locals.results[i],null,2);
                    res.render("statements", res.locals);
                }).auth(req.lrsConfig.username, req.lrsConfig.password, true)
            })

        })

    }));
}