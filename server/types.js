var saveableType = require("./saveableType").saveableType;


function incGenerator(key,self)
{
    return function(cb)
    {
        var inc = { $inc: {} };
        inc.$inc[key] = 1;
        self.DB.update({_id:self._id},inc,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

function setGenerator(key,self)
{
    return function(val,cb)
    {
        var addToSet = { $addToSet: {} };
        addToSet.$addToSet[key] = val;
        self.DB.update({_id:self._id},addToSet,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

function pullGenerator(key,self)
{
    return function(val,cb)
    {
        var pull = { $pull: {} };
        pull.$pull[key] = val;
        self.DB.update({_id:self._id},pull,function(err)
        {
            if(err && cb)
                return cb(err);
            else if(cb) return cb();
        })
    }
}

var mkdirp = require('mkdirp');

exports.file = function(email, username, salt, password)
{
    this.package = null;
    this.data = null;
    this.path = null;
    this.dataType = "file";
    this.owner = null;
    this.fromZipEntry = function(ze,cb)
    {
        console.log(ze.entryName);
        this.path = ze.entryName;
        ze.getDataAsync( function(buf)
        {
            var path = require("path").join(__dirname,"filedata",this.package,this.path);
            mkdirp(require("path").dirname(path), function (err) {
               
                require("fs").writeFile(path,buf,function()
                {
                    this.save(cb);
                }.bind(this))

            }.bind(this));

          
            
        }.bind(this));
    }
    this.getData = function(cb)
    {
        var path = require("path").join(__dirname,"filedata",this.package,this.path);
        require("fs").readFile(path,function(err,d)
        {
            cb(err,d);
        });
    }
    this.deleteAndRemove = function(cb)
    {
        var path = require("path").join(__dirname,"filedata",this.package,this.path);
        require("fs").unlink(path,function(err,d)
        {
            this.delete(cb)
        }.bind(this));
    }
    saveableType(this);
}
var rmdir = require('rimraf');
exports.package = function()
{
    this.id = null;
    this.dataType = "package";
    this.owner = null;
    this.name = null;
    this.associatedContent = null;
    this.cleanAndDelete = function(cb)
    {
        var path = require("path").join(__dirname,"filedata",this.id);
        rmdir(path,function(err,d)
        {
            this.delete(cb)
        }.bind(this));
    }
    saveableType(this);
}

exports.userAccount = function(email, username, salt, password)
{
    saveableType(this);
    this.username = username;
    this.email = email;
    this.salt = salt;
    this.password = password;
    this.dataType = "userAccount";
    this.roles = [];
    this.addRole = function(role)
    {
        if(this.roles.indexOf(role) == -1)
                this.roles.push(role);
    }
    this.removeRole = function(role)
    {
        var idx = this.roles.indexOf(role);
        if(idx > -1)
            this.roles.splice(idx,1);
    }
    this.hasRole = function(role)
    {
        var idx = this.roles.indexOf(role);
        return (idx > -1)
    }
     Object.defineProperty(this,"isAdmin",{
        get:function()
        {
            return this.roles.indexOf("admin") !== -1
        }
    })
    Object.defineProperty(this,"isCreator",{
        get:function()
        {
            return this.roles.indexOf("creator") !== -1
        }
    })
}
exports.contentRecord = function(url, title, description, created, accessed, owner, key)
{
    saveableType(this);
    this.url = url;
    this.title = title;
    this.description = description;
    this.dataType = "contentRecord";
    this.created = created;
    this.accessed = accessed;
    this.owner = owner;
    this.publicKey = key;
    this.timeToConsume = 0;
    this.sessionLength = 0;
    this.iconURL = "";
    this.mediaTypeKey = null;
    this.launchType = 0;
    this.launches = 0;
    this.incLaunches = incGenerator("launches",this);
    this.stars = [];
    this.star = setGenerator("stars",this);
    this.unStar = pullGenerator("stars",this);
    this.packageLink = null;
    this.xapiForm = function()
    {
        var def = {};
        def.id = "http://localhost:3000/content/"+this.key;
        def.definition = {};
        def.definition.name = {
            "en-US": this.title
        };
        def.definition.description = {
            "en-US": this.description
        };
        def.definition.type= "http://localhost:3000/content/";
        return def;
    }
    Object.preventExtensions(this);
}

exports.launchRecord = function(email, key, uuid)
{
    saveableType(this);
    this.email = email;
    this.contentKey = key;
    this.dataType = "launchRecord";
    this.created = Date.now();
    this.state = 0;
    this.uuid = uuid;
    this.client = "uninitialized";
    this.publicKey = null;
    this.mediaKey = null;
    this.termination = null;
    this.userguid = null;
    this.passguid = null;
    this.xapiForm = function()
    {
        var def = {};
        def.id = "http://localhost:3000/launches/" + this.uuid;
        def.definition = {};
        def.definition.name = {
            "en-US": "Launch Record"
        };
        def.definition.description = {
            "en-US": "The user launched xAPI enabled content."
        };
        def.definition.type= "http://localhost:3000/launch/";
        def.definition.moreInfo = "http://localhost:3000/content/"+this.contentKey;
        
        return def;
    }
    Object.preventExtensions(this);
}

exports.mediaType = function()
{
	saveableType(this);
	this.dataType = "mediaType";
	this.uuid = "";
	this.title = "";
	this.name = "";
    this.description = "";
    this.iconURL = "";
    this.owner = "";
    Object.preventExtensions(this);
}

exports.media= function()
{
	saveableType(this);
	this.dataType = "media";
	this.uuid = "";
	this.title = "";
	this.name = "";
    this.url = "";
    this.mediaTypeKey = ""; 
    this.description = "";
    this.owner = "";

    this.launches = 0;
    this.incLaunches = incGenerator("launches",this);
    this.stars = [];
    this.star = setGenerator("stars",this);
    this.unStar = pullGenerator("stars",this);

	this.xapiForm = function()
    {
        var def = {};
        def.id = "http://localhost:3000/media/"+this.key;
        def.definition = {};
        def.definition.name = {
            "en-US": this.title
        };
        def.definition.description = {
            "en-US": this.description
        };
        def.definition.type= "http://localhost:3000/media/";
        return def;
    }
    Object.preventExtensions(this);
}