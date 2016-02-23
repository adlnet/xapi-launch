//generate a getter for a database object
//keyname is a field that should be unique, and is used to find it. For users, this is the email
//for content, this is the url
//schema is a jsonSchema for the data, typeConstructor is the name of hte type that should be defined in
//types.js, and the datatypename is the name for that type. Normally these are the same
var async = require('async');
var ensureOneCall = require('./utils.js').ensureOneCall;
var validate = require('jsonschema').validate;

exports.init = function(types)
{
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
                            if (record.dataType == dataTypeName)
                            {
                                var content = new types[typeConstructor]();
                                content.init(keyval, self.DB, record);
                                return got(null, content);
                            }
                            else
                                return got("wrong data type");
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
                            if (record.dataType == dataTypeName)
                            {
                                var content = new types[typeConstructor]();
                                content.init(record._id, self.DB, record);
                                return got(null, content);
                            }
                            else
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

    function createGenerator(field, schema, typeConstructor, dataTypeName)
    {
        var getter = getGenerator(field, schema, typeConstructor, dataTypeName);
        return function(fieldVal, gotContent)
        {
            var self = this;

            function create()
            {
                var content = new types[typeConstructor]();
                content.init(null, self.DB,
                {});
                content[field] = fieldVal;
                content.save(function(err, content)
                {
                    if (err)
                        return gotContent(err);
                    gotContent(null, content);
                })
            }
            if (field)
            {
                console.log("call getter");
                getter.call(this, fieldVal, function(err, gotVal)
                {
                    console.log(err, gotVal);
                    if (err)
                        return gotContent(err);
                    if (gotVal)
                        return gotContent("value is not unique")
                    return create();
                })
            }
            else
            {
                create();
            }
        }
    }

    function searchGenerator(searchfields, schema, typeConstructor, dataTypeName)
    {
        return function(regex, skip, limit, sort, gotContent)
        {
            var self = this;
            if (typeof skip == "function")
            {
                gotContent = skip;
                skip = 0;
                limit = 0;
                sort = null;
            }
            if (typeof sort == "function")
            {
                gotContent = sort;
                sort = null;
            }
            var search = {
                $and: [
                {
                    dataType: dataTypeName
                },
                {
                    $or: []
                }]
            }
            for (var i in searchfields)
            {
                var field = {};
                field[searchfields[i]] = regex;
                search.$and[1].$or.push(field);
            }

            function searchComplete(err, results)
            {
                if (err)
                    return gotContent(err);
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
            };
            if (!skip && !limit && !sort)
            {
                self.DB.find(search).exec(searchComplete);
            }
            else
            {
                self.DB.find(search).skip(skip).limit(limit).sort(sort).exec(searchComplete);
            }
        }
    }
    exports.getGenerator = getGenerator;
    exports.getAllGenerator = getAllGenerator;
    exports.createGenerator = createGenerator;
    exports.searchGenerator = searchGenerator;
}