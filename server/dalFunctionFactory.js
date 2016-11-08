//generate a getter for a database object
//keyname is a field that should be unique, and is used to find it. For users, this is the email
//for content, this is the url
//schema is a jsonSchema for the data, typeConstructor is the name of hte type that should be defined in
//types.js, and the datatypename is the name for that type. Normally these are the same
var async = require('async');
var types = require("./types.js");

function getGenerator(keyname, schema, typeConstructor, dataTypeName)
{
    return function(keyval, got)
    {
        var self = this;
        var query = {}
        query[keyname] = keyval;
        types[dataTypeName].findOne(
            query).exec(function(err, result)
        {
            if (result)
                result.virtuals = {};
            got(err, result)
        });
    }
}

function getAllGenerator(condition, schema, typeConstructor, dataTypeName)
{
    return function(cond, gotContent)
    {
        if (!condition)
            gotContent = cond;
        var self = this;
        var query = {}
        if (condition)
        {
            query[condition] = cond;
        }
        types[dataTypeName].find(
            query).exec(function(err, results)
        {
            for (var i in results)
                results[i].virtuals = {};
            gotContent(err, results)
        })
    }
}

function searchComplexGenerator(schema, typeConstructor, dataTypeName)
{
    return function(query, skip, limit, sort, gotContent)
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
        if (!skip && !limit && !sort)
        {
            types[dataTypeName].find(query).exec(gotContent);
        }
        else
        {
            types[dataTypeName].find(query).skip(skip).limit(limit).sort(sort).exec(gotContent);
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
            $or: []
        }
        for (var i in searchfields)
        {
            var field = {};
            field[searchfields[i]] = regex;
            search.$or.push(field);
        }
        if (!skip && !limit && !sort)
        {
            types[dataTypeName].find(search).exec(function(err, results)
            {
                for (var i in results)
                    results[i].virtuals = {};
                gotContent(err, results)
            });
        }
        else
        {
            types[dataTypeName].find(search).skip(skip).limit(limit).sort(sort).exec(function(err, results)
            {
                for (var i in results)
                    results[i].virtuals = {};
                gotContent(err, results)
            });
        }
    }
}
exports.getGenerator = getGenerator;
exports.getAllGenerator = getAllGenerator;
exports.searchGenerator = searchGenerator;
exports.searchComplexGenerator = searchComplexGenerator;