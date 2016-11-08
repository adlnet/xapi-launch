var form = require("./form.js").form;
var adminUserForm = form("./server/forms/adminCreateUser.json");
var user = require('./ODM/schemas/userAccount.js');
var CryptoJS = require("../public/scripts/pbkdf2.js").CryptoJS;
var config = require("./config");
var crypto = require('crypto');
exports.setup = function(app, DAL)
{
	var rmdir = require('rimraf');

	function mustBeAdmin(req, res, next)
	{
		if (req.user !== require("./users.js").adminUser)
			return res.status(401).send("must be admin");
		else
			next();
	}
	app.get("/admin/clearDB", mustBeAdmin, function(req, res, next)
	{
		var path = require("path").join(__dirname, "filedata");
		rmdir(path, function(err, d)
		{
			DAL.DB.remove(
			{},
			{
				multi: true
			}, function(err, numRemoved)
			{
				res.status(200).send("DB clear");
			});
		});
	})

	function userIsAdmin(req, res, next)
	{
		if (req.user && req.user.email == config.admin_email)
		{
			res.locals.isAdmin = true;
		}
		next();
	}

	function cannotBeAdmin(req, res, next)
	{
		var user = req.user;
		if (user && user.email == config.admin_email)
		{
			return res.send(strings.not_admin);
		}
		next();
	}

	function getUser(req, res, next)
	{
		user.findOne(
		{
			_id: req.params.uuid
		}, function(err, _user)
		{
			if (_user)
			{
				req._user = _user;
				next();
			}
			else
			{
				res.send("User not found");
			}
		})
	}

	function users(req, res, next)
	{
		user.find(
		{}, function(err, _users)
		{
			res.render("admin/users",
			{
				_users: _users
			});
		})
	}

	function viewUser(req, res, next)
	{
		res.render("admin/user",
		{
			_user: req._user
		});
	}

	function deleteUser(req, res, next)
	{
		req._user.remove(function(err)
		{
			res.redirect("/admin/users")
		})
	}

	function verifyUser(req, res, next)
	{
		req._user.verifiedEmail = true;
		req._user.save(function(err)
		{
			res.redirect("/admin/users")
		})
	}

	function unVerifyUser(req, res, next)
	{
		req._user.verifiedEmail = false;
		req._user.verifyCode = CryptoJS.lib.WordArray.random(128 / 8).toString();
		req._user.save(function(err)
		{
			res.redirect("/admin/users")
		})
	}

	function resetPassword(req, res, next)
	{
		req._user.forgotPassword();
		req._user.save(function(err)
		{
			res.redirect("/admin/users")
		})
	}

	function createUser(req, res, next)
	{
		var request = req.body;
		//even though the admin user is not actually in the DB, we must prevent people 
		//from creating a user with that email
		if (req.body.email == config.admin_email)
		{
			return res.status(400).send(strings.user_exists);
		}
		//Ensure that the email address is unique
		user.findOne(
		{
			email: req.body.email
		}, function(err, _user)
		{
			if (_user)
			{
				return res.status(400).send(strings.user_exists)
			}
			var newuser = new user();
			newuser.username = request.username;
			//var randomSalt = CryptoJS.lib.WordArray.random(128 / 8)
			var randomSalt = crypto.randomBytes(16);
			newuser.salt = randomSalt.toString('hex');
			newuser.resetPassword( request.password);
			newuser.verifiedEmail = false;
			newuser.email = request.email;
			//newuser.verifyCode = CryptoJS.lib.WordArray.random(128 / 8).toString();
			newuser.verifyCode = crypto.randomBytes(16).toString('hex');
			
			newuser.save(function(err)
			{
				if (!err)
				{
					res.status(200).send(
					{
						text: " success",
						redirect: "/admin/users/"
					});
				}
				else
					res.status(500).send(err);
			})
		});
	}

	app.get("/admin/users", mustBeAdmin, users);
	app.get("/admin/users/:uuid/delete", mustBeAdmin, getUser, deleteUser);
	app.get("/admin/users/:uuid/verify", mustBeAdmin, getUser, verifyUser);
	app.get("/admin/users/:uuid/unverify", mustBeAdmin, getUser, unVerifyUser);
	app.get("/admin/users/:uuid/resetPassword", mustBeAdmin, getUser, resetPassword);
	app.get("/admin/users/create/", mustBeAdmin, adminUserForm);
	app.post("/admin/users/create/", mustBeAdmin, adminUserForm, createUser)
}