var schemas = require("./schemas.js");
var types = require("./types.js");
var async = require("async");
var getGenerator = require("./dalFunctionFactory.js").getGenerator;
var getAllGenerator = require("./dalFunctionFactory.js").getAllGenerator;
var searchGenerator = require("./dalFunctionFactory.js").searchGenerator;
var searchComplexGenerator = require("./dalFunctionFactory.js").searchComplexGenerator;
var email = require("./email.js");

function DAL()
{}
//AWWWW SO META!
DAL.prototype.getContent = getGenerator("url", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getContentByKey = getGenerator("_id", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllContentByOwner = getAllGenerator("owner", schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getAllMediaByOwner = getAllGenerator("owner", schemas.media, "media", "media");
DAL.prototype.getAllContent = getAllGenerator(null, schemas.content, "contentRecord", "contentRecord");
DAL.prototype.getUser = getGenerator("email", schemas.account, "userAccount", "userAccount");
DAL.prototype.getUserByName = getGenerator("username", schemas.account, "userAccount", "userAccount");
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
DAL.prototype.findContent = searchGenerator(["url", "description", "title", "owner"], schemas.content, "contentRecord", "contentRecord");
DAL.prototype.findMedia = searchGenerator(["url", "description", "title", "mediaType"], schemas.media, "media", "media");
//hard coded test for now
DAL.prototype.getAllMediaTypes = function(cb)
{
    this._getAllMediaTypes(function(err, results)
    {
        if (err)
            return cb(err);
        var none = new types.mediaType();
        none.uuid = "";
        none.name = "Supports No Media";
        none.owner = "System";
        none.virtuals = {};
        cb(null, [none].concat(results));
    })
}
DAL.prototype.getMedia = getGenerator("_id", schemas.media, "media", "media");
DAL.prototype.getMediaByURL = getGenerator("url", schemas.media, "media", "media");
//hard coded test
DAL.prototype._getMediaType = getGenerator("uuid", schemas.mediaType, "mediaType", "mediaType");
DAL.prototype.getMediaType = function(type, cb)
    {
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
            var record = new types.contentRecord()
            record.url = request.url;
            record.title = request.title;
            record.description = request.description;
            record.created = Date.now();
            record.accessed = Date.now();
            record.owner = request.owner;
            record.publicKey = request.publicKey;
            record.timeToConsume = request.timeToConsume;
            record.sessionLength = request.sessionLength;
            record.mediaTypeKey = request.mediaTypeKey;
            record.launchType = request.launchType;
            record.packageLink = request.packageLink;
            record.iconURL = request.iconURL;
            record.customData = request.customData;
            record.save(function(err)
            {
                record.key = record._id;
                record._id = record._id;
                contentRegistered(err, record);
            })
        }
    })
}
DAL.prototype.createUser = function(request, userCreatedCB)
{
    var self = this;
    async.series([
        function checkExistingEmail(cb)
        {
            self.getUser(request.email, function(err, user)
            {
                if (err) //there should be an error - the user record should not exist
                {
                    cb(err);
                }
                else if (user)
                {
                    cb("User Email already exists");
                }
                else
                {
                    cb();
                }
            });
        },
        function checkExistingName(cb)
        {
            self.getUserByName(request.username, function(err, user)
            {
                if (err) //there should be an error - the user record should not exist
                {
                    cb(err);
                }
                else if (user)
                {
                    cb("User Username already exists");
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
            var account = new types.userAccount();
            account.username = request.username;
            account.email = request.email.toLowerCase();
            account.salt = request.salt;
            account.password = request.password;
            account.roles = [];
            account.lrsConfig = request.lrsConfig;
            account.verifiedEmail = false;

            account.verifyCode = require("crypto").randomBytes(16).toString('hex');
            email.sendEmailValidateEmail(account);
            
            account.save(function(err, key)
            {
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
        var launch = new types.launchRecord();
        launch.state = 0;
        launch.email = request.email;
        launch.contentKey = request.contentKey;
        launch.uuid = require("guid").raw();
        launch.mediaKey = request.mediaKey;
        launch.customData = request.customData;
        launch.courseContext = request.courseContext;
        launch.save(function(err)
        {
            requestCreated(err, launch);
        })
    }
    catch (e)
    {
        //console.log(e)
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
        mediaType.save(function(err)
        {
            mediaCreated(err, mediaType);
        })
    }
    catch (e)
    {
        //console.log(e)
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
        media.save(function(err)
        {
            mediaCreated(err, media);
        })
    }
    catch (e)
    {
        //console.log(e)
    }
}
DAL.prototype.findFile = searchComplexGenerator(schemas.file, "file", "file");
DAL.prototype.findPackage = searchComplexGenerator(schemas.package, "package", "package");
DAL.prototype.getPackageByContentLink = getGenerator("contentLink", schemas.package, "package", "package");
exports.DAL = DAL;