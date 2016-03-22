var schemas = require("./schemas.js");
var types = require("./types.js");
var async = require("async");
require("./dalFunctionFactory.js").init(types);
var getGenerator = require("./dalFunctionFactory.js").getGenerator;
var getAllGenerator = require("./dalFunctionFactory.js").getAllGenerator;
var createGenerator = require("./dalFunctionFactory.js").createGenerator;
var searchGenerator = require("./dalFunctionFactory.js").searchGenerator;

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
//AWWWW SO META!
DAL.prototype.getContent = getGenerator("url", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getContentByKey = getGenerator("_id", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllContentByOwner = getAllGenerator("owner", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllMediaByOwner = getAllGenerator("owner", schemas.media, "media", "media");
DAL.prototype.getAllContent = getAllGenerator(null, schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getUser = getGenerator("email", schemas.account, "userAccount", "userAccount");
DAL.prototype.getUserByKey = getGenerator("_id", schemas.account, "userAccount", "userAccount");
DAL.prototype.getAllUsers = getAllGenerator(null, schemas.account, "userAccount", "userAccount");
DAL.prototype.getAllUsersLaunch = getAllGenerator("email", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getAllContentLaunch = getAllGenerator("contentKey", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getLaunchByGuid = getGenerator("uuid", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getAllMediaLaunch = getAllGenerator("mediaKey", schemas.launch, "launchRecord", "launchRecord");
DAL.prototype.getAllMedia = getAllGenerator(null, schemas.media, "media", "media");
DAL.prototype.getAllMediaByType = getAllGenerator("mediaTypeKey", schemas.media, "media", "media");
DAL.prototype.getAllContentByMediaType = getAllGenerator("mediaTypeKey", schemas.content, "contentRecord", "contentRecord");
DAL.prototype._getAllMediaTypes = getAllGenerator(null, schemas.mediaType, "mediaType", "mediaType");
DAL.prototype.findContent = searchGenerator(["url", "description", "title", "owner", "_id"], schemas.content, "contentRecord", "contentRecord");
DAL.prototype.findMedia = searchGenerator(["url", "description", "title", "mediaType", "_id"], schemas.media, "media", "media");
//hard coded test for now
DAL.prototype.getAllMediaTypes = function(cb)
{
    this._getAllMediaTypes(function(err, results)
    {
        if (err)
            return cb(err);
        var video = new types.mediaType();
        video.uuid = "VIDEO-TEST-UUID";
        video.name = "video";
        video.owner = "System";
        video.iconURL = "http://www.iconarchive.com/download/i89801/alecive/flatwoken/Apps-Player-Video.ico"
        var html = new types.mediaType();
        html.uuid = "HTML-TEST-UUID";
        html.name = "HTML";
        html.owner = "System";
        html.iconURL = "http://extensions.siberiancms.com/wp-content/uploads/edd/2014/04/html-icon.png";
        var none = new types.mediaType();
        none.uuid = "";
        none.name = "Supports No Media";
        none.owner = "System";
        cb(null, [video, html, none].concat(results));
    })
}
DAL.prototype.getMedia = getGenerator("_id", schemas.media, "media", "media");
//hard coded test
DAL.prototype._getMediaType = getGenerator("uuid", schemas.mediaType, "mediaType", "mediaType");
DAL.prototype.getMediaType = function(type, cb)
    {
        if (type == "VIDEO-TEST-UUID")
        {
            var video = new types.mediaType();
            video.uuid = "VIDEO-TEST-UUID";
            video.name = "video";
            video.owner = "System";
            video.iconURL = "http://www.iconarchive.com/download/i89801/alecive/flatwoken/Apps-Player-Video.ico"
            return cb(null, video);
        }
        if (type == "HTML-TEST-UUID")
        {
            var html = new types.mediaType();
            html.uuid = "HTML-TEST-UUID";
            html.name = "HTML";
            html.owner = "System";
            html.iconURL = "http://extensions.siberiancms.com/wp-content/uploads/edd/2014/04/html-icon.png";
            return cb(null, html);
        }
        if (type == "")
        {
            var none = new types.mediaType();
            none.uuid = "";
            none.name = "Supports No Media";
            none.owner = "System";
            return cb(null, none);
        }
        this._getMediaType(type, cb);
    } //
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
            record.launchType = request.launchType;
            self.DB.save(null, record.dbForm(), function(err, key)
            {
                record.init(key, self.DB, self, null, function()
                {
                    contentRegistered(err, record);
                });
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
            account.lrsConfig = request.lrsConfig;
            self.DB.save(null, account.dbForm(), function(err, key)
            {
                account.init(key, self.DB, self, null, function()
                {
                    userCreatedCB(err, account);
                })
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
        launch.mediaKey = request.mediaKey;
        launch.userguid = require("guid").raw();
        launch.passguid = require("guid").raw();
        self.DB.save(null, launch.dbForm(), function(err, key)
        {
            launch.init(key, self.DB, self, null, function()
            {
                requestCreated(err, launch);
            });
        })
    }
    catch (e)
    {
        console.log(e)
    }
}
DAL.prototype.createMediaType = function(name, description, iconURL, owner, mediaCreated)
{
    var self = this;
    try
    {
        var mediaType = new types.mediaType();
        mediaType.name = name;
        mediaType.description = description;
        mediaType.iconURL = iconURL;
        mediaType.owner = owner;
        mediaType.uuid = require("guid").raw();
        self.DB.save(null, mediaType.dbForm(), function(err, key)
        {
            mediaType.init(key, self.DB, self, null, function()
            {
                mediaCreated(err, mediaType);
            });
        })
    }
    catch (e)
    {
        console.log(e)
    }
}
DAL.prototype.createMediaRecord = function(url, mediaTypeKey, title, description, owner, mediaCreated)
{
    var self = this;
    try
    {
        var media = new types.media();
        media.url = url;
        media.mediaTypeKey = mediaTypeKey;
        media.title = title;
        media.description = description;
        media.owner = owner;
        self.DB.save(null, media.dbForm(), function(err, key)
        {
            media.init(key, self.DB, self, null, function()
            {
                mediaCreated(err, media);
            });
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