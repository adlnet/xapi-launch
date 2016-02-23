"use strict";
function saveableType(self)
{

    self.virtuals = {};
    self.key = null;
    self._id = null;
    self.DB = null;
    Object.defineProperty(self, "init",
    {
        value: function(key, DB, record)
        {
            try{
            console.log("init " + key);
            for (var i in record)
                this[i] = record[i];
            self.DB = DB;
            self.key = key;
            }catch(e)
            {
                console.log(e);
                console.log(self);
                throw(e);
            }
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
                if (key == "virtuals")
                    return undefined;
                if (key == "key")
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

exports.saveableType = saveableType;