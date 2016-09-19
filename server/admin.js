exports.setup = function(app, DAL)
{
	var rmdir = require('rimraf');

	function mustBeAdmin(req, res, next)
	{
		if (req.user !== require("./users.js").adminUser)
			return res.status(401).send("must be admin");
		else
			next();
	}
	app.get("/admin/clearDB", mustBeAdmin, function(req, res, next)
	{
		var path = require("path").join(__dirname, "filedata");
		rmdir(path, function(err, d)
		{
			DAL.DB.remove(
			{},
			{
				multi: true
			}, function(err, numRemoved) {
				res.status(200).send("DB clear");
			});
		});
	})
}