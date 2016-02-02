var validate = require('jsonschema').validate;
var schemas = require("./schemas.js");
var types = require("./types.js");
var async = require('async');
var ensureOneCall = require('./utils.js').ensureOneCall;

function DAL(DB)
{
	this.DB = DB;
}
DAL.prototype.getUser = function(email, gotUser)
{
	var self = this;
	this.DB.find(
	{
		dataType: "userAccount",
		email: email
	}, ensureOneCall(function(err, results)
	{
		if (!results) results = {};
		if (Object.keys(results).length > 1)
		{
			gotUser("invalid number of search results!");
			return;
		}
		else if (Object.keys(results).length == 0)
		{
			gotUser(null, undefined);
			return;
		}
		else
		{
			var record = results[Object.keys(results)[0]];
			var account = new types.userAccount(record.email, record.username, record.salt, record.password);
			account.init(Object.keys(results)[0], self.DB);
			gotUser(null, account);
			return;
		}
	}));
}
DAL.prototype.getContent = function(url, gotContent)
{
	var self = this;
	this.DB.find(
	{
		dataType: "contentRecord",
		url: url
	}, ensureOneCall(function(err, results)
	{
		console.log("got content results" + url);
		console.log(results);
		if (!results) results = {};
		if (Object.keys(results).length > 1)
		{
			gotContent("invalid number of search results!");
			return;
		}
		else if (Object.keys(results).length == 0)
		{
			gotContent(null, undefined);
			return;
		}
		else
		{
			var record = results[Object.keys(results)[0]];
			var content = new types.contentRecord(record.url, record.title, record.description, record.created, record.accessed, record.owner);
			content.init(Object.keys(results)[0], self.DB);
			gotContent(null, content);
			return;
		}
	}));
}
DAL.prototype.getContentByKey = function(key, gotContent)
{
	var self = this;
	this.DB.get(key, function(err, doc)
	{
		if (err)
		{
			
			gotContent(err)
		}
		else
		{
			var record = doc;
			var v = validate(schemas.content, doc);
			if (v.errors.length == 0)
			{
				var content = new types.contentRecord(record.url, record.title, record.description, record.created, record.accessed, record.owner);
				content.init(key, self.DB);
				gotContent(null, content);
			}
			else
			{
				gotContent("Validation failed. The given key is not a key to a contentRecord.");
			}
		}
	})
}
DAL.prototype.getAllContent = function(gotContent)
{
	var self = this;
	this.DB.find(
	{
		dataType: "contentRecord"
	}, ensureOneCall(function(err, results)
	{
		if (err)
			gotContent(err)
		else
		{
			var allcontent = [];
			for (var i in results)
			{
				var record = results[i];
				var content = new types.contentRecord(record.url, record.title, record.description, record.created, record.accessed, record.owner);
				content.init(i, self.DB);
				allcontent.push(content);
			}
			gotContent(null, allcontent);
		}
	}))
}
DAL.prototype.registerContent = function(request, contentRegistered)
{
	var self = this;
	async.series([function checkExisting(cb)
	{
		self.getContent(request.url, function(err, content)
		{
			if (err) //there should be an error - the user record should not exist
			{
				cb(err);
			}
			else if (content)
			{
				cb("Content already exists");
			}
			else
			{
				cb();
			}
		});
	}], function(err)
	{
		if (err)
		{
			contentRegistered(err, undefined);
		}
		else
		{
			var record = new types.contentRecord(request.url, request.title, request.description, Date.now(), Date.now(), request.owner)
			self.DB.save(null, record.dbForm(), function(err, key)
			{
				record.init(key, self.DB);
				contentRegistered(err, record);
			})
		}
	})
}
DAL.prototype.createUser = function(request, userCreatedCB)
{
	var self = this;
	async.series([function checkExisting(cb)
	{
		self.getUser(request.email, function(err, user)
		{
			if (err) //there should be an error - the user record should not exist
			{
				cb(err);
			}
			else if (user)
			{
				cb("User already exists");
			}
			else
			{
				cb();
			}
		});
	}], function(err)
	{
		if (err)
		{
			userCreatedCB(err, undefined);
		}
		else
		{
			var account = new types.userAccount(request.email, request.username, request.salt, request.password);
			self.DB.save(null, account.dbForm(), function(err, key)
			{
				account.init(key, self.DB)
				userCreatedCB(err, account);
			})
		}
	})
}
exports.setup = function(DB)
{
	return new DAL(DB);
}