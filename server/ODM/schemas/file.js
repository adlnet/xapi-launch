var mkdirp = require('mkdirp');
var mongoose = require('mongoose');
var file = mongoose.Schema(
{
    package: String,
    data: String,
    path: String,
    owner: String
});

file.methods.fromZipEntry = function(ze, cb)
{
    console.log(ze.entryName);
    this.path = ze.entryName;
    ze.getDataAsync(function(buf)
    {
        var path = require("path").join(__dirname, "filedata", this.package, this.path);
        mkdirp(require("path").dirname(path), function(err)
        {
            require("fs").writeFile(path, buf, function()
            {
                this.save(cb);
            }.bind(this))
        }.bind(this));
    }.bind(this));
}
file.methods.getData = function(cb)
{
    var path = require("path").join(__dirname, "filedata", this.package, this.path);
    require("fs").readFile(path, function(err, d)
    {
        cb(err, d);
    });
}
file.methods.deleteAndRemove = function(cb)
{
    var path = require("path").join(__dirname, "filedata", this.package, this.path);
    require("fs").unlink(path, function(err, d)
    {
        this.delete(cb)
    }.bind(this));
}
file.methods.dbForm = function()
{
    return this.toObject();
}
module.exports = mongoose.model('file', file);