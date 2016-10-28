var rmdir = require('rimraf');
var mongoose = require('mongoose');
var package = mongoose.Schema(
{
    id: String,
    owner: String,
    name: String,
    associatedContent: String
});
package.methods.cleanAndDelete = function(cb)
{
    var path = require("path").join(__dirname, "filedata", this.id);
    rmdir(path, function(err, d)
    {
        this.delete(cb)
    }.bind(this));
}
package.methods.dbForm = function()
{
    return this.toObject();
}
module.exports = mongoose.model('package', package);