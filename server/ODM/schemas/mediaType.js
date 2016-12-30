var mongoose = require('mongoose');
var mediaType = mongoose.Schema(
{
	uuid: String,
	title: String,
	name: String,
	description: String,
	iconURL: String,
	owner: String,
})
mediaType.methods.dbForm = function()
{
    return this.toObject();
}
module.exports = mongoose.model('mediaType', mediaType);