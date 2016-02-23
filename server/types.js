function saveableType(self)
{


    Object.defineProperty(self, "init",
    {
        value: function(key, DB, record)
        {
            self.DB = DB;
            self.key = key;
            console.log("init " + key);
            for (var i in record)
                this[i] = record[i];
        }
    })
    Object.defineProperty(self, "dbForm",
    {
        value: function()
        {
            return JSON.parse(JSON.stringify(self, function(key, val)
            {
                if (key == "_id")
                    return undefined;
                if (key == "DB")
                    return undefined;
                if (key == "init")
                    return undefined;
                if (key == "dbForm")
                    return undefined;
                return val;
            }))
        }
    })
    Object.defineProperty(self, "save",
    {
        value: function(cb)
        {
            if (self.DB)
            {
                if (self.key !== null)
                {
                    self.DB.update(
                    {
                        _id: self.key
                    }, self.dbForm(), function(err, num)
                    {
                        if (err)
                            return cb(err);
                        else
                            cb(null, self);
                    })
                }
                else
                {
                    self.DB.save(null, self.dbForm(), function(err, key)
                    {
                        self.key = key;
                        cb(err, self);
                    })
                }
            }
            else
            {
                if (cb)
                    cb("saveableType not initialized")
            }
        }
    })
    Object.defineProperty(self, "delete",
    {
        value: function(cb)
        {

            if (self.DB)
            {
                console.log('remove ', self.key);
                self.DB.remove(
                {
                    _id: self.key
                },
                {}, cb)
            }
            else
            {
                console.log("this.DB is null");
                if (cb)
                    cb("saveableType not initialized")
            }
        }
    })
}
exports.userAccount = function(email, username, salt, password)
{
    saveableType(this);
    this.username = username;
    this.email = email;
    this.salt = salt;
    this.password = password;
    this.dataType = "userAccount";
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
}

exports.mediaType = function()
{
	saveableType(this);
	this.dataType = "mediaType";
	this.uuid = "";
	this.title = "";
	this.name = "";
}

exports.media= function()
{
	saveableType(this);
	this.dataType = "media";
	this.uuid = "";
	this.title = "";
	this.name = "";

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
}