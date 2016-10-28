var mongoose = require('mongoose');
var userSchema = mongoose.Schema(
{
    username: String,
    email: String,
    salt: String,
    password: String,
    roles: Array,
    lrsConfig:Object
})

userSchema.methods.dbForm = function()
{
    return this.toObject();
}
userSchema.methods.addRole = function(role)
{
    if (this.roles.indexOf(role) == -1)
        this.roles.push(role);
}
userSchema.methods.removeRole = function(role)
{
    var idx = this.roles.indexOf(role);
    if (idx > -1)
        this.roles.splice(idx, 1);
}
userSchema.methods.hasRole = function(role)
{
    return true;
    var idx = this.roles.indexOf(role);
    return (idx > -1)
}
userSchema.methods.isAdmin = function()
{
    return this.roles.indexOf("admin") !== -1
}
userSchema.methods.isCreator = function()
{
    return true; // alwasy for now
    return this.roles.indexOf("creator") !== -1
}
module.exports = mongoose.model('userAccount', userSchema)