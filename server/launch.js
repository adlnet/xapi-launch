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
exports.setup = function(app, DAL)
{
	//need some input on actual xAPI data here.
	function sendLaunchData(launch, req, res)
	{
		DAL.getUser(launch.email, function(err, user)
		{
			DAL.getContentByKey(launch.contentKey, function(err, content)
			{
				var launchData = {};
				launchData.actor = {};
				launchData.actor.email = launch.owner;
				launchData.actor.name = user.username;
				launchData.endpoint = "http://localhost:3000/" + launch.uuid + "/xAPI";
				launchData.context = {};
				launchData.context.activity = content.dbForm();
				launchData.context.url = content.url;
				res.status(200).send(launchData);
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
						res.locals.launch = JSON.stringify(launch.dbForm());
						res.locals.content = JSON.stringify(content.dbForm());
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
				if (Date.now() - (new Date(launch.created)) < 1000 * 60)
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
					launch.save(function(err)
					{
						//the launch is saved in the DB in the 2 state
						delete lockedKeys[req.params.key];
						res.status(500).send("launch initialization timeout");
					})
				}
			}
		});
	});

	function validateLaunchSession(cb)
	{
		//validate that the incoming request is scoped to the given session cookie
		//the the launch exists and is in the open state
		//and that the launch started less than 3 hours ago.
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
				//who is serveing the content to the student. 
				if (launch.client !== req.cookies["connect.sid"])
				{
					console.log(launch.client, req.cookies["connect.sid"])
					res.status(500).send("You are not the registered consumer for this launch.");
					return;
				}
				//it might also be better to use the cookie timeout to scope this... but I think that 
				//the client could hold onto the cookie longer than the specified timeout if 
				//the client is a server and implementing its own HTTP
				//you can also imagine that a given client might have more than one active launch on this server
				//and so the same client session token is shared between several launches
				if (Date.now() - (new Date(launch.created)) > 1000 * 60 * 180)
				{
					launch.state = 2;
					launch.save(function()
					{
						res.status(500).send("This launch was closed automatically after 3 hours");
					});
					return;
				}
				req.launch = launch
				cb(req, res, next);
			});
		}
	}
	app.get("/launch/:key/xAPI/*", validateLaunchSession(function(req, res, next)
	{
		res.status(500).send("not implemented");
	}));
	app.post("/launch/:key/xAPI/*", validateLaunchSession(function(req, res, next)
	{
		//here, we need to validate the activity and append the context data
		//then forward to our registered LRS
		res.status(500).send("not implemented");
	}));
	app.post("/launch/:key/terminate", validateLaunchSession(function(req, res, next)
	{
		//the content explicitly terminates the launch session
		if (lockedKeys[req.params.key])
		{
			res.status(500).send("key is locked to prevent double launch");
			return;
		}
		lockedKeys[req.params.key] = true;
		req.launch.state = 2;
		req.launch.save(function(err)
		{
			delete lockedKeys[req.params.key];
			res.status(200).send("launch successfully closed")
		})
	}));
}