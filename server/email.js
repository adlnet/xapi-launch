const strings = require("./strings").strings,
	config = require("../config"),
	async = require('async'),
	fs = require('fs'),
	libpath = require('path'),
	Mustache = require("mustache");

var templateCache = {};

//Compile the emails from HTML, just like a normal templated view.
async.each(['verifyEmail', 'forgotPassword'],

	function(tplFile, done)
	{
		fs.readFile( libpath.join('./views/emails', tplFile+'.html'), 'utf8',
			function(err, text)
			{
				if(err) done(err);
				else {
					Mustache.parse(text);
					templateCache[tplFile] = text;
					done();
				}
			}
		);
	},

	function(err){
		if(err) throw err;
	}
);

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://'+encodeURIComponent(config.email_user)+':'+encodeURIComponent(config.email_pass)+'@'+config.email_server);

//just logging to the console for now, need to get actual email hooked up
exports.sendEmailValidateEmail = function(user) {
    console.log("The user's verification key is ", user.verifyCode);

    var message = Mustache.render( templateCache.verifyEmail, 
	{
		username: user.username,
		verify_url: config.host + "/users/validateEmail/" + user.verifyCode,
		verify_url_base: config.host + "/users/validateEmail/",
		verify_code: user.verifyCode
	});

	var mailOptions = {
	    from: '"LRS Test" <admin@adlnet.gov.com>', // sender address
	    to: user.email, // list of receivers
	    subject: strings.validate_email_subject, // Subject line
	    text: message, // plaintext body
	    html: message // html body
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        return console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	});

}

//just logging to the console for now, need to get actual email hooked up
exports.sendForgotPasswordEmail = function(user,plaintext) {
    console.log("The user's password reset key is ", plaintext);

    var message = Mustache.render( templateCache.forgotPassword,
	{
		username: user.username,
		login_url: config.host + "/users/login/",
		temp_password: plaintext
	});
	
	var mailOptions = {
	    from: config.system_email_from, // sender address
	    to: user.email, // list of receivers
	    subject: strings.forgot_password_email_subject, // Subject line
	    text: message, // plaintext body
	    html: message // html body
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        return console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	});
}
