exports.setup = function(app,DB)
{
	app.get("/",function(res,req,next)
	{
		req.render('home',res.locals)
	});
	
}