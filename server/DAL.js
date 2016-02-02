var validate =require('jsonschema').validate;
var schemas = require("./schemas.js");
var types = require("./types.js");
var async = require('async');
function DAL(DB)
{
	this.DB = DB;
}

function ensureOneCall(cb)
{
	var calls = 0;
	return function(arg1,arg2,arg3,arg4,arg5,arg6)
	{
		calls ++;
		if(calls == 1)
			cb(arg1,arg2,arg3,arg4,arg5,arg6);
		else
		{
			console.log("callback already called!");
		}
	}
}

DAL.prototype.getUser = function(email,gotUser)
{
	console.log("getuser" + email)
	this.DB.find({dataType:"userAccount",email:email},ensureOneCall(function(err,results)
	{
		console.log("gotuser" + email)
		if(!results) results = [];
		if(Object.keys(results).length > 1)
		{
			gotUser("invalid number of search results!");
			return;
		}else if (Object.keys(results).length == 0)
		{
			gotUser(null,undefined);
			return;
		}else
		{
			
			var record = results[Object.keys(results)[0]];
			var account = new types.userAccount(record.email,record.username,record.salt,record.password);
			gotUser(null, account);
			return;
		}
	}));
}
DAL.prototype.createUser = function(request,userCreatedCB)
{
	var self =  this;
	async.series([function checkExisting(cb){
		self.getUser(request.email,function(err,user)
		{
			if(err) //there should be an error - the user record should not exist
			{
				cb(err);
			}
			else if(user)
			{
				cb("User already exists");
			}else
			{
				cb();
			}
		});
	}],function(err)
	{
		if(err)
		{
			userCreatedCB(err,undefined);
		}else
		{
			var account = new types.userAccount(request.email,request.username,request.salt,request.password);
			self.DB.save(null,account,function(err,key)
			{
				userCreatedCB(err,key);
			})
		}
	})
}

exports.setup = function(DB)
{
	return new DAL(DB);
}