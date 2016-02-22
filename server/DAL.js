var validate = require('jsonschema').validate;
var schemas = require("./schemas.js");
var types = require("./types.js");
var async = require('async');
var ensureOneCall = require('./utils.js').ensureOneCall;

function DAL(DB)
{
    this.DB = DB;
    this.DB.get = function(key, cb)
    {
        DB.findOne(
        {
            _id: key
        }, function(err, doc)
        {
            cb(err, doc)
        });
    }
    this.DB.save = function(key, value, cb)
    {
        if (key)
            value._id = key;
        DB.insert(value, function(err, doc)
        {
            if (err)
                cb(err)
            else
                cb(err, doc._id)
        });
    }
}


//generate a getter for a database object
//keyname is a field that should be unique, and is used to find it. For users, this is the email
//for content, this is the url
//schema is a jsonSchema for the data, typeConstructor is the name of hte type that should be defined in
//types.js, and the datatypename is the name for that type. Normally these are the same
function getGenerator(keyname, schema, typeConstructor, dataTypeName)
{
    if (keyname == "_id")
    {
        return function(keyval, got)
        {
            var self = this;

            self.DB.get(
                keyval, ensureOneCall(function(err, doc)
                {

                    if (err)
                    {
                        got(err);
                        return;
                    }
                    if (!doc)
                    {
                        got(null, null);
                        return;
                    }
                    var record = doc;
                    var v = validate(schema, doc);

                    if (v.errors.length == 0)
                    {
                    	if(record.dataType == dataTypeName)
                        {
	                        var content = new types[typeConstructor]();
	                        content.init(keyval, self.DB, record);
	                        return got(null, content);
	                    }else
	                    	return  got("wrong data type");

                    }
                    else
                    {
                        got("Validation failed. The given key is not a key to a " + dataTypeName);
                    }
                }));
        }

    }
    else
    {
        return function(keyval, got)
        {
            var self = this;
            var query = {
                dataType: dataTypeName,
            }

            query[keyname] = keyval;
            console.log(query)
            self.DB.find(
                query, ensureOneCall(function(err, results)
                {

                    if (results.length > 1)
                    {
                        got("invalid number of search results!");
                        return;
                    }
                    else if (results.length == 0)
                    {
                        got(null, undefined);
                        return;
                    }
                    else
                    {
                        var record = results[0];
                        if(record.dataType == dataTypeName)
                        {
                        	var content = new types[typeConstructor]();
                        	content.init(record._id, self.DB, record);
                        	return got(null, content);
                        }else
                        return got("wrong data type");
                        return;
                    }
                }));
        }
    }
}

function getAllGenerator(condition, schema, typeConstructor, dataTypeName)
{

    return function(cond, gotContent)
    {
        try
        {
            console.log(condition, cond)
            if (!condition)
                gotContent = cond;
            var self = this;
            var query = {
                dataType: dataTypeName
            }
            if (condition)
            {
                query[condition] = cond;
            }
            
            this.DB.find(
                query, ensureOneCall(function(err, results)
                {
                    try
                    {
                        if (err)
                            gotContent(err)
                        else
                        {
                            var allcontent = [];
                            for (var i in results)
                            {
                                var record = results[i];
                                if (record.dataType == dataTypeName)
                                {
                                    var content = new types[typeConstructor]();
                                    content.init(record._id, self.DB, record);
                                    allcontent.push(content);
                                }
                            }
                            gotContent(null, allcontent);
                        }
                    }
                    catch (e)
                    {
                        console.log(e)
                    }
                }))
        }
        catch (e)
        {
            console.log(e)
        }
    }
}


//AWWWW SO META!
DAL.prototype.getContent = getGenerator("url", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getContentByKey = getGenerator("_id", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllContentByOwner = getAllGenerator("owner", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllContent = getAllGenerator(null, schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getUser = getGenerator("email", schemas.account, "userAccount", "userAccount");
DAL.prototype.getUserByKey = getGenerator("_id", schemas.account, "userAccount", "userAccount");
DAL.prototype.getAllUsers = getAllGenerator(null, schemas.account, "userAccount", "userAccount");
DAL.prototype.getAllUsersLaunch = getAllGenerator("email", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getAllContentLaunch = getAllGenerator("contentKey", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getLaunchByGuid = getGenerator("uuid", schemas.launch, "launchRecord", "launchRecord");

DAL.prototype.getAllMediaLaunch = getAllGenerator("mediaKey", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getAllMedia = getAllGenerator(null, schemas.media, "media", "media");

//hard coded test for now
DAL.prototype.getAllMediaTypes = function(cb)
{
    var video = new types.mediaType();
    video.uuid = "VIDEO-TEST-UUID";
    video.name = "video";
    video.owner = "asdf@asdf.com";

    var html = new types.mediaType();
    html.uuid = "HTML-TEST-UUID";
    html.name = "HTML";
    html.owner = "asdf@asdf.com";

    cb(null, [video, html]);
} //getAllGenerator(null,schemas.mediaType,"mediaType","mediaType");

DAL.prototype.getMedia = getGenerator("_id", schemas.media, "media", "media");

//hard coded test
DAL.prototype.getMediaType = function(type, cb)
{

    if (type == "VIDEO-TEST-UUID")
    {
        var video = new types.mediaType();
        video.uuid = "VIDEO-TEST-UUID";
        video.name = "video";
        video.owner = "asdf@asdf.com";
        return cb(null, video);
    }

    if (type == "HTML-TEST-UUID")
    {
        var html = new types.mediaType();
        html.uuid = "HTML-TEST-UUID";
        html.name = "HTML";
        html.owner = "asdf@asdf.com";
        return cb(null, html);
    }


} //getGenerator("uuid",schemas.mediaType,"mediaType","mediaType");


DAL.prototype.registerContent = function(request, contentRegistered)
{
    var self = this;
    async.series([

        function checkExisting(cb)
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
        }
    ], function(err)
    {
        if (err)
        {
            contentRegistered(err, undefined);
        }
        else
        {
            var record = new types.contentRecord(request.url, request.title, request.description, Date.now(), Date.now(), request.owner, request.publicKey)
            record.timeToConsume = request.timeToConsume;
            record.sessionLength = request.sessionLength;
            record.mediaTypeKey = request.mediaTypeKey;
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
    async.series([

        function checkExisting(cb)
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
        }
    ], function(err)
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
DAL.prototype.createLaunchRecord = function(request, requestCreated)
{
    var self = this;
    try
    {
        var launch = new types.launchRecord(request.email, request.contentKey, require("guid").raw());
        self.DB.save(null, launch.dbForm(), function(err, key)
        {
            launch.init(key, self.DB);
            requestCreated(err, launch);
        })
    }
    catch (e)
    {
        console.log(e)
    }
}

DAL.prototype.createMediaType = function(name, description, mediaCreated)
{
    var self = this;
    try
    {
        var mediaType = new types.mediaType();
        mediaType.name = name;
        mediaType.description = description;
        mediaType.uuid = require("guid").raw();

        self.DB.save(null, mediaType.dbForm(), function(err, key)
        {
            mediaType.init(key, self.DB);
            mediaCreated(err, mediaType);
        })
    }
    catch (e)
    {
        console.log(e)
    }
}


DAL.prototype.createMediaRecord = function(url, type, title, description, owner, mediaCreated)
{
    var self = this;
    try
    {
        var media = new types.media();
        media.url = url;
        media.type = type;
        media.title = title;
        media.description = description;
        media.owner = owner;

        self.DB.save(null, media.dbForm(), function(err, key)
        {
            media.init(key, self.DB);
            mediaCreated(err, media);
        })
    }
    catch (e)
    {
        console.log(e)
    }
}
exports.setup = function(DB)
{
    return new DAL(DB);
}