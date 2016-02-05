var express = require('express');
var async = require('async');
var app = express();
var Datastore  = require('nedb');
var DB = null;
var hoganExpress = require('hogan-express');

async.series([

    function loadDB(cb)
    {
    	
        DB = new Datastore({ filename: './data.db', autoload: true })
        DB = require("./server/DAL.js").setup(DB);
        	console.log("ghot here")
            cb();
    }
], function startServer()
{
	//serve static files
	
	app.use('/static', express.static('public'));

	app.use(require("body-parser").json());
	app.use( require("body-parser").urlencoded({ extended: true }) );
	app.use(require("cookie-parser")());

	
	//use mustache templating
	app.engine('html', hoganExpress);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');
	app.set('partials', {header:'header',footer:'footer',scripts:'scripts'});
	app.set('layout', 'layout');

	//setup various routes
	require('./server/users.js').setup(app,DB);
	require('./server/xapi.js').setup(app,DB);
	require('./server/admin.js').setup(app,DB);
	require('./server/content.js').setup(app,DB);
	require('./server/launch.js').setup(app,DB);
    
    app.all("*",function(req,res,next)
    {
    	res.redirect("/");
    });
    app.listen(3000, function() {

    })

});