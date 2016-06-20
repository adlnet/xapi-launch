var express = require('express');
var async = require('async');
var app = express();
var Datastore = require('nedb');
var DB = null;
var hoganExpress = require('hogan-express');
require('pretty-error').start();
async.series([
	function loadDB(cb)
	{
		DB = new Datastore(
		{
			filename: './data.db',
			autoload: true
		})
		DB = require("./server/DAL.js").setup(DB);
		
		cb();
	},
	function loadConfig(cb)
	{
		if (require("./server/config.js").config === null)
		{
			var readline = require('readline');
			var rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout
			});
			rl.question('Please enter the LRS URL: ', function(LRS_Url)
			{
				require("./server/config.js").config = {};
				require("./server/config.js").config.LRS_Url = LRS_Url; 
				rl.question('Please enter the LRS Username: ', function(LRS_Username) 
				{
					require("./server/config.js").config.LRS_Username = LRS_Username;
					rl.question('Please enter the LRS Password: ', function(LRS_Password) 
					{
						require("./server/config.js").config.LRS_Password = LRS_Password;
						// TODO: Log the answer in a database
						console.log('This information has been saved to config.json');
						require('fs').writeFileSync("./config.json",JSON.stringify(require("./server/config.js").config));
						rl.close();
						cb();
					});
				});
			});
		}
		else return cb();
	}
], function startServer()
{
	//serve static files
	app.use('/static', express.static('public'));
	app.use(require("body-parser").json());
	app.use(require("body-parser").urlencoded(
	{
		extended: true
	}));
	app.use(require("cookie-parser")());
	//use mustache templating
	app.engine('html', hoganExpress);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');
	app.set('partials',
	{
		header: 'header',
		footer: 'footer',
		scripts: 'scripts'
	});
	app.set('layout', 'layout');
	//setup various routes
	require('./server/users.js').setup(app, DB);
	require('./server/xapi.js').setup(app, DB);
	require('./server/admin.js').setup(app, DB);
	require('./server/content.js').setup(app, DB);
	require('./server/media.js').setup(app, DB);
	require('./server/mediaType.js').setup(app, DB);
	require('./server/launch.js').setup(app, DB);
	/*app.all("*",function(req,res,next)
	{
		res.redirect("/");
	});*/
	app.listen(3000, function() {})

	var app2 = express();
	app2.use('/static', express.static('public'));
	app2.listen(3001, function() {});

	var app3 = express();
	app3.use('/static', express.static('public'));
	app3.listen(3002, function() {})

	var app4 = express();
	app4.use('/static', express.static('public'));
	app4.listen(3003, function() {})
});