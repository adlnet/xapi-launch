var mongoose = require('mongoose');

var pullGenerator = require("../utils.js").pullGenerator;
var setGenerator = require("../utils.js").setGenerator;
var incGenerator = require("../utils.js").incGenerator;

var contentRecord = mongoose.Schema(
{
    url: String,
    title: String,
    description: String,
    created: Date,
    accessed: Date,
    owner: String,
    publicKey: String,
    timeToConsume: Number,
    sessionLength: Number,
    iconURL: String,
    mediaTypeKey: String,
    launchType: String,
    launches: Number,
    stars: Array,
    packageLink: String,
    customData: String
});

contentRecord.methods.xapiForm = function()
{
    var def = {};
    def.id = require("../../config.js").config.host + "/content/" + this.key;
    def.definition = {};
    def.definition.name = {
        "en-US": this.title
    };
    def.definition.description = {
        "en-US": this.description
    };
    def.definition.type = require("../../config.js").config.host + "/content/";
    return def;
}
contentRecord.methods.dbForm = function()
{
    return this.toObject();
}
contentRecord.methods.star = setGenerator("stars", this);
contentRecord.methods.unStar = pullGenerator("stars", this);
contentRecord.methods.incLaunches = incGenerator("launches", this);

module.exports = mongoose.model('contentRecord', contentRecord);