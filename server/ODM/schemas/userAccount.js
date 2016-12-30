var mongoose = require('mongoose');
var CryptoJS = require("../../../public/scripts/pbkdf2.js").CryptoJS;
var crypto = require('crypto');

function hashPassword(u, s, p){

    s = CryptoJS.enc.Hex.parse(s);
    var key = CryptoJS.PBKDF2(p, s,
    {
        keySize: 512 / 32,
        iterations: 100
    });
    return key.toString();
}

var userSchema = mongoose.Schema(
{
    username: String,
    email:{
        type:String,
        index:true
    },
    salt: String,
    password: String,
    roles: Array,
    lrsConfig:Object,
    identity:Object,
    verifiedEmail:Boolean,
    verifyCode:String,
    passwordResetKey:String
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
userSchema.methods.checkResetKey = function(plaintext)
{
    //NOTE. We store the plaintext of the reset key. Should we hash it? If we do, we can't tell the user what it was manually
    if(this.passwordResetKey == plaintext)
    {
        return true;
    }
    return false;
}
userSchema.methods.forgotPassword = function(plaintext)
{
    var plaintext =   CryptoJS.lib.WordArray.random(128 / 8).toString();
    this.passwordResetKey = hashPassword(this.username,this.salt,plaintext);
    this.save();
    return plaintext;
}
userSchema.methods.resetPassword = function(plaintext)
{
    this.salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    this.password = hashPassword(this.username,this.salt,plaintext);

    //NOTE: we reset this to an unguessable number, rather then null or undefined as you might expect
    //this is because there is a greater risk of a bug allowing null or undefined to be submitted as the password at login
    //which would then look like a correct reset attempt. (becasue the user logged in with the temp reset key, which was null)
    //this is much safer, as no bug is going to accidently send this exact value
    this.passwordResetKey = CryptoJS.lib.WordArray.random(128 / 8).toString();
    this.save();
}
module.exports = mongoose.model('userAccount', userSchema)