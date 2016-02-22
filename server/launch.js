var schemas = require("./schemas.js");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var requirejs = require('requirejs');
var session = require('express-session')
var async = require("async");
var ensureLoggedIn = require("./utils.js").ensureLoggedIn;
var ensureNotLoggedIn = require("./utils.js").ensureNotLoggedIn;
var validateTypeWrapper = require("./utils.js").validateTypeWrapper;
var lockedKeys = {};
var config = require("./config.js").config;
exports.setup = function(app, DAL)
{
    //need some input on actual xAPI data here.
    function sendLaunchData(launch, req, res)
    {
        DAL.getUser(launch.email, function(err, user)
        {
            DAL.getContentByKey(launch.contentKey, function(err, content)
            {
                DAL.getMedia(launch.mediaKey, function(err, media)
                {

                    var launchData = {};
                    launchData.actor = {
                        objectType: "Agent",
                        name: user.username,
                        mbox: "mailto:" + user.email
                    };

                    var localServer = "http://localhost:3000/"; //this should come from a config file
                    launchData.endpoint = localServer + "launch/" + launch.uuid + "/xAPI/";
                    launchData.contextActivities = {};
                    launchData.contextActivities.parent = content.xapiForm();
                    launchData.contextActivities.grouping = launch.xapiForm();
                    launchData.sessionLength = content.sessionLength;
                    launchData.media = media;
                    if (content.publicKey)
                    {
                        var key = require("node-rsa").key(content.publicKey);
                        launchData = key.encrypt(key, 'hex', 'utf8');
                    }

                    res.status(200).send(launchData);
                })

            })
        })
    }
    //Get a new launch token for a given piece of content. This must be requested by the student logged into
    //the launchpad. If there is valid content, we create a new launch token and save it to the DB.
    //Some client will trade this token for credentials and an endpoint for xAPI statements.
    //this is the proper place for the launch server to enforce access limits on the content. 
    //The launch server could have all sorts of business logic around if a new launch for given content is allowed.
    //This is out of scope of the launch spec.
    app.get("/launch/:key", ensureLoggedIn(function(req, res, next)
    {
        DAL.getContentByKey(req.params.key, function(err, content)
        {
            if (content)
            {
                DAL.createLaunchRecord(
                {
                    email: req.user.email,
                    contentKey: req.params.key
                }, function(err, launch)
                {
                    if (err)
                        res.status(500).send(err);
                    else
                    {

                        var clientlaunch = launch.dbForm();
                        var clientContent = content.dbForm();

                        clientContent.publicKey = !!clientContent.publicKey; //be sure not to send the actual public key to the client

                        res.locals.endpoint = "http://localhost:3000/"; //this should come from the config file

                        //the the content has a public key, use it to encrypt the data. Note that the student has access to
                        //the launch uuid in plaintext... is this ok?
                        if (content.publicKey)
                        {
                            var key = new require('node-rsa')(content.publicKey);
                            clientlaunch.uuid = key.encrypt(clientlaunch.uuid, 'hex', 'utf8');
                            res.locals.endpoint = key.encrypt(res.locals.endpoint, 'hex', 'utf8');
                        }

                        res.locals.launch = JSON.stringify(clientlaunch);
                        res.locals.content = JSON.stringify(clientContent);


                        res.render("launch.html", res.locals);
                    }
                })
            }
            else
            {
                res.status(500).send(err);
            }
        })
    }));


    //Get a new launch token for a given piece of content. This must be requested by the student logged into
    //the launchpad. If there is valid content, we create a new launch token and save it to the DB.
    //Some client will trade this token for credentials and an endpoint for xAPI statements.
    //this is the proper place for the launch server to enforce access limits on the content. 
    //The launch server could have all sorts of business logic around if a new launch for given content is allowed.
    //This is out of scope of the launch spec.
    app.get("/launch/media/:key", ensureLoggedIn(function(req, res, next)
    {
        DAL.getMedia(req.params.key, function(err, media)
        {
            DAL.getAllContentByMediaType(media.mediaTypeKey, function(err, allPlayers)
            {
                if (err)
                    return res.status(401).send(err);
                if (!allPlayers || allPlayers.length == 0)
                    return res.status(401).send("No apps can play this content");

                //might want to let the use choose which player
                var content = allPlayers[0];
                if (content)
                {
                    DAL.createLaunchRecord(
                    {
                        email: req.user.email,
                        contentKey: content.key,
                        mediaKey: req.params.key
                    }, function(err, launch)
                    {
                        if (err)
                            res.status(500).send(err);
                        else
                        {

                            var clientlaunch = launch.dbForm();
                            var clientContent = content.dbForm();

                            clientContent.publicKey = !!clientContent.publicKey; //be sure not to send the actual public key to the client

                            res.locals.endpoint = "http://localhost:3000/"; //this should come from the config file

                            //the the content has a public key, use it to encrypt the data. Note that the student has access to
                            //the launch uuid in plaintext... is this ok?
                            if (content.publicKey)
                            {
                                var key = new require('node-rsa')(content.publicKey);
                                clientlaunch.uuid = key.encrypt(clientlaunch.uuid, 'hex', 'utf8');
                                res.locals.endpoint = key.encrypt(res.locals.endpoint, 'hex', 'utf8');
                            }

                            res.locals.launch = JSON.stringify(clientlaunch);
                            res.locals.content = JSON.stringify(clientContent);


                            res.render("launch.html", res.locals);
                        }
                    })
                }
                else
                {
                    res.status(500).send(err);
                }

            })
        })
    }));

    //Some client is trading the launch key for endpoints and actor info. This can only happen
    //once. After the token is exchanged, the client session identifier is used to access the database
    //and xAPI operations. We do this becaus the client will forward the launch token to some other server
    //via a querystring. That server will either exchange the token itself, or serve code to the client that will
    //exchange the token directly.
    app.post("/launch/:key", function(req, res, next)
    {
        if (lockedKeys[req.params.key])
        {
            res.status(500).send("key is locked to prevent double launch");
            return;
        }
        //we need a synchronous way to lock access to the key.
        //otherwise, 2 requests could come in for the same launch
        //and both execute the line DAL.getLaunchByGuid. Both would get a 
        //launch in state 0. Then we would activate the session for 2 clients. 
        //This is because the database logic is asynchronous, and thus the second request
        //could start before the DB operation finishes and return the launch record
        //this synchronous check prevents that case
        lockedKeys[req.params.key] = true;
        DAL.getLaunchByGuid(req.params.key, function(err, launch)
        {
            if (!launch)
            {
                delete lockedKeys[req.params.key];
                res.status(500).send("invalid launch key");
            }
            else
            {
                DAL.getContentByKey(launch.contentKey, function(err, content)
                {
                    //the launch can only be initiated once. Once this token is traded for the actor and endpoint
                    //information, session is started for the client that traded the token. 
                    //requests for XAPI data must come from the client who has the session that traded in the launch
                    //token.
                    if (launch.state !== 0)
                    {
                        delete lockedKeys[req.params.key];
                        //while we won't re-initialize the launch, the registered client for the launch can send the token again
                        //this handles the case where the user refreshes the page. This is not a new launch, but client side content
                        //will need to re-fetch the actor data. Note that only the client that initially started the launch
                        //can re-fetch actor data from this endpoint. 
                        if (launch.client == req.cookies["connect.sid"])
                        {
                            sendLaunchData(launch, req, res);
                            return;
                        }
                        else
                        {
                            res.status(500).send("The launch token has already been used.");
                            return
                        }
                    }
                    //if the content does not initiate the launch in 60 seconds,
                    //it will time out and switch to the closed state
                    //enforce this only if the time recorded for this content is a positive number
                    if (content.timeToConsume > 0 && Date.now() - (new Date(launch.created)) < 1000 * content.timeToConsume)
                    {
                        //here, we need to verify that the incoming request came from the same domain
                        //that we sent the student to. It's possible that server redirect rules might
                        //make this check too restrictive. We could perhaps allow the content record
                        //to specify an alternitive list of domains that may initiate the launch
                        launch.state = 1;
                        launch.client = req.cookies["connect.sid"];
                        launch.save(function(err)
                        {
                            //the launch is saved in the DB in the 1 state. The launch is active and 
                            //accepting statements from the client recorded in launch.client
                            delete lockedKeys[req.params.key];
                            sendLaunchData(launch, req, res);
                        })
                    }
                    else
                    {
                        //we are closing this launch activity. The content did not trade in the launch token
                        //in a reasonable amount of time.
                        launch.state = 2;
                        launch.termination = {
                            code: 1,
                            description: "Content not launched in valid timespan"
                        };
                        launch.save(function(err)
                        {
                            //the launch is saved in the DB in the 2 state
                            delete lockedKeys[req.params.key];
                            res.status(500).send("launch initialization timeout");
                        })
                    }
                })
            }
        });
    });

    function validateLaunchSession(cb)
    {
        //validate that the incoming request is scoped to the given session cookie
        //the the launch exists and is in the open state
        //and that the launch started less than the timeToConsume seconds ago.
        //if all those things are true then this is valid 
        return function(req, res, next)
        {
            DAL.getLaunchByGuid(req.params.key, function(err, launch)
            {
                if (!launch)
                {
                    res.status(500).send("invalid launch key");
                    return;
                }
                if (launch.state !== 1)
                {
                    res.status(500).send("Launch is not in the open state");
                    return
                }
                //The client posting to the xAPI for this launch must be the client that
                //activated the launch. Note that this is the students session on the launch server 
                //in the case that the content is a dumb html file, but could be some thrid party 
                //who is serving the content to the student. 
                if (launch.client !== req.cookies["connect.sid"])
                {
                    console.log(launch.client, req.cookies["connect.sid"])
                    res.status(500).send("You are not the registered consumer for this launch.");
                    return;
                }

                req.launch = launch;
                DAL.getContentByKey(launch.contentKey, function(err, content)
                {


                    if (err || !content)
                    {
                        res.status(500).send("The content associated with this launch has been removed");
                        return
                    }
                    req.content = content;


                    //it might also be better to use the cookie timeout to scope this... but I think that 
                    //the client could hold onto the cookie longer than the specified timeout if 
                    //the client is a server and implementing its own HTTP
                    //you can also imagine that a given client might have more than one active launch on this server
                    //and so the same client session token is shared between several launches
                    //enforce this only if the time recorded for this content is a positive number
                    if (content.sessionLength > 0 && Date.now() - (new Date(launch.created)) > 1000 * content.sessionLength)
                    {
                        launch.state = 2;
                        launch.termination = {
                            code: 2,
                            description: "This launch was closed automatically after the launch grace period expired"
                        };
                        launch.save(function()
                        {
                            res.status(500).send("This launch was closed automatically after 3 hours");
                        });
                        return;
                    }
                    DAL.getMedia(launch.mediaKey, function(err, media)
                    {
                        req.media = media;
                        cb(req, res, next);
                    })

                })

            });
        }
    }

    app.post("/launch/:key/xAPI/statements", validateLaunchSession(function(req, res, next)
    {
        //here, we need to validate the activity and append the context data
        //then forward to our registered LRS

        var postedStatement = req.body;
        if (postedStatement.constructor !== 'Array')
        {
            postedStatement = [postedStatement];
        }
        for (var i = 0; i < postedStatement.length; i++)
        {
            if (!postedStatement[i].context)
            {
                postedStatement[i].context = {};
            }
            var contextActivities = postedStatement[i].context.contextActivities;
            if (!contextActivities)
                contextActivities = postedStatement[i].context.contextActivities = {
                    parent: req.launch.xapiForm(),
                    grouping: req.content.xapiForm()
                };
            else
            {
                //if the parent is exists
                if (contextActivities.parent)
                {
                    //if it's an array, check that the parent launch is included, add if not. 
                    //if it's not an array, make it an array and include the context
                    if (contextActivities.parent.constructor == "Array")
                    {
                        var included = false;
                        for (var i in contextActivities.parent)
                        {
                            if (contextActivities.parent[i].uuid = req.launch.uuid)
                            {
                                included = true;
                                break;
                            }
                        }
                        if (!included)
                        {
                            contextActivities.parent.push(req.launch.xapiForm());
                        }
                    }
                    else
                    {
                        contextActivities.parent = [contextActivities.parent, req.launch.xapiForm()];
                    }
                }
                else
                {
                    contextActivities.parent = req.launch.xapiForm();
                }
                //if it's an array, check that the grouping content is included, add if not. 
                //if it's not an array, make it an array and include the context
                if (contextActivities.grouping)
                {
                    if (contextActivities.grouping.constructor == "Array")
                    {
                        var included = false;
                        for (var i in contextActivities.grouping)
                        {
                            if (contextActivities.grouping[i].url = req.content.url)
                            {
                                included = true;
                                break;
                            }
                        }
                        if (!included)
                        {
                            contextActivities.grouping.push(req.content.xapiForm());
                        }
                        if(req.media)
                        {
                            var included = false;
                            for (var i in contextActivities.grouping)
                            {
                                if (contextActivities.grouping[i].url = req.media.url)
                                {
                                    included = true;
                                    break;
                                }
                            }
                            if (!included)
                            {
                                contextActivities.grouping.push(req.media.xapiForm());
                            }
                        }
                    }
                    else
                    {
                        contextActivities.grouping = [contextActivities.grouping, req.content.xapiForm()];
                        if(request.media)
                        {
                        	contextActivities.grouping.push(req.media.xapiForm());
                        }
                    }
                }
                else
                {
                	if(!req.media)
                    	contextActivities.grouping = req.content.xapiForm();
                    else
                    	contextActivities.grouping = [req.content.xapiForm(),req.media.xapiForm()];
                }
            }
        }

        (function post(url)
        {
            //send the modified statement up to the configured LRS
            require('request')(
            {
                uri: url,
                method: "POST",
                body: postedStatement,
                json: true,
                followRedirect: true,
                headers:
                {
                    "X-Experience-API-Version": req.headers[
                        "x-experience-api-version"]
                }
            }, function(e, r, body)
            {
                if (e)
                {
                    res.status(500).send(e);

                }
                else
                {
                    if (r.statusCode == 301)
                    {
                        post(r.headers.location);

                    }
                    else
                    {
                        console.log(r.request.headers);
                        console.log(config.LRS_Username, config.LRS_Password);
                        res.status(r.statusCode).send(body);
                    }
                }
            }).auth(config.LRS_Username, config.LRS_Password, true);
        })(config.LRS_Url + "/statements");
    }));

    app.all("/launch/:key/xAPI/*", validateLaunchSession(function(req, res, next)
    {
        //passthrough all other XAPI statements
        var proxyAddress = config.LRS_Url + req.params[0];
        req.pipe(require('request')(proxyAddress)).pipe(res);
    }));

    app.get("/launches/:key", function(req, res, next)
    {
        DAL.getLaunchByGuid(req.params.key, function(err, launch)
        {
            if (!launch)
                res.status(404).send('launch not found');
            else
            {
                var data = launch.dbForm();
                data.client = undefined;
                res.status(200).send(data);
            }
        });
    });
    app.get("/launches/:key/xapi", function(req, res, next)
    {
        DAL.getLaunchByGuid(req.params.key, function(err, launch)
        {
            if (!launch)
                res.status(404).send('launch not found');
            else
            {
                var data = launch.dbForm();
                data.client = undefined;
                res.status(200).send(data);
            }
        });
    });


    app.post("/launch/:key/terminate", validateLaunchSession(validateTypeWrapper(schemas.termination, function(req, res, next)
    {
        //the content explicitly terminates the launch session
        if (lockedKeys[req.params.key])
        {
            res.status(500).send("key is locked to prevent double launch");
            return;
        }
        lockedKeys[req.params.key] = true;
        req.launch.state = 2;
        req.launch.termination = req.body; // this must be a valid termination object at this point
        req.launch.save(function(err)
        {
            delete lockedKeys[req.params.key];
            res.status(200).send("launch successfully closed")
        })
    })));
}