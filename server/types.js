exports.userAccount = function(email,username,salt,password)
{
	this.username = username;
	this.email = email;
	this.salt = salt;
	this.password = password;
	this.dataType = "userAccount";
}