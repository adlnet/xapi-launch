var mongoose = require('mongoose');

var pullGenerator = require("../utils.js").pullGenerator;
var setGenerator = require("../utils.js").setGenerator;
var incGenerator = require("../utils.js").incGenerator;

var media = mongoose.Schema(
{
    uuid: String,
    title: String,
    name: String,
    url: String,
    mediaTypeKey: String,
    description: String,
    owner: String,
    launches: Number,
    stars: Array
})

media.methods.incLaunches = incGenerator("launches", this);
media.methods.star = setGenerator("stars", this);
media.methods.unStar = pullGenerator("stars", this);
media.methods.xapiForm = function()
{
    var def = {};
    def.id = require("../../config.js").config.host + "/media/" + this.key;
    def.definition = {};
    def.definition.name = {
        "en-US": this.title
    };
    def.definition.description = {
        "en-US": this.description
    };
    def.definition.type = require("../../config.js").config.host + "/media/";
    return def;
}
media.methods.dbForm = function()
{
    return this.toObject();
}
module.exports = mongoose.model('media', media);