var mongoose = require('mongoose');
var launchRecord = mongoose.Schema(
{
    email: String,
    contentKey: String,
    created: Date,
    state: Number,
    uuid: String,
    client: String,
    publicKey: String,
    mediaKey: String,
    termination: Number,
    userguid: String,
    passguid: String,
    customData: String,
    courseContext: String
});

launchRecord.methods.xapiForm = function()
{
    var def = {};
    def.id = require("../../config.js").config.host + "/launches/" + this.uuid;
    def.definition = {};
    def.definition.name = {
        "en-US": "Launch Record"
    };
    def.definition.description = {
        "en-US": "The user launched xAPI enabled content."
    };
    def.definition.type = require("../../config.js").config.host + "/launch/";
    def.definition.moreInfo = require("../../config.js").config.host + "/content/" + this.contentKey;
    return def;
}
launchRecord.methods.dbForm = function()
{
    return this.toObject();
}
module.exports = mongoose.model('launchRecord', launchRecord);