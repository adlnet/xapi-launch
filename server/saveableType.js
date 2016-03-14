"use strict";


var mongo = require('mongodb')


function saveableType(self)
{
    self.virtuals = {};
    self.key = null;
    self._id = null;
    self.DB = null;
    self.DAL = null;
    Object.defineProperty(self, "init",
    {
        writable:true,
        value: function(key, DB, DAL, record, cb)
        {
            try
            {
                for (var i in record)
                    this[i] = record[i];
                self.DB = DB;
                self.DAL = DAL;
                self.key = key;
            }
            catch (e)
            {
                console.log(e);
                console.log(self);
                throw (e);
            }
            cb(null);
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
                if (key == "DAL")
                    return undefined;
                return val;
            }))
        }
    })
    Object.defineProperty(self, "save",
    {
        writable:true,
        value: function(cb)
        {
            if (self.DB)
            {
                if (self.key !== null)
                {
                    self.DB.update(
                    {
                        _id: (new mongo.ObjectID(self.key))
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
        writable:true,
        value: function(cb)
        {
            if (self.DB)
            {
                console.log('remove ', self.key);
                self.DB.remove(
                {
                    _id: (new mongo.ObjectID(self.key))
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
var blob = function(self)
{
    saveableType(self);
    self.blobKey = require("node-uuid").v4();
    self.virtuals.save = self.save;
    self.virtuals.init = self.init;
    self.virtuals.dirty = false;
    self.loads = 0;
    self.getData = function()
    {
        return this.virtuals.blobdata;
    }
    self.setData = function(data)
    {
        this.virtuals.dirty = true;
        this.virtuals.blobdata = data;
    }
    self.save = function(cb)
    {
        if (this.virtuals.dirty)
        {
            fs.writeFile(global.datapath + "/blobs/" + self.blobKey, self.virtuals.blobdata, function(err)
            {
                if (err) return cb(err);
                this.virtuals.dirty = false;
                this.virtuals.save(cb)
            })
        }
        else
            this.virtuals.save(cb)
    }
    self.init = function(key, DB, DAL, record, cb)
    {
        this.virtuals.init(key, DB, DAL, record, function(err)
        {
            self.loads++;
            fs.readFile(global.datapath + "/blobs/" + self.blobKey, function(err, data)
            {
                //if (err) return cb(err);
                self.virtuals.blobdata = data;
                cb();
            })
        })
    }
}
exports.blob = blob;
exports.saveableType = saveableType;