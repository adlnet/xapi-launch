var multiparty = require('multiparty');
var async = require("async");
var fs = require("fs");
function form(schema)
{

	function _get(req, res, next)
	{
		var url = require("url").parse(req.url);
		console.log(url);
		if(url.pathname[url.pathname.length-1] !== "/")
			return res.redirect(""+ url.pathname+"/" + (url.search ? url.search : ""));
		function _render(schemaCopy)
		{
			if(req.formTitle)
			{
				schemaCopy.title =  req.formTitle;
			}
			if(req.formSubmitText)
			{
				schemaCopy.submitText = req.formSubmitText;
			}
			if(!req.defaults && req.query.defaults)
			{
				req.defaults = JSON.parse(decodeURIComponent(req.query.defaults));
			}
			
			if (req.defaults)
			{

					for (var i in schemaCopy.fields)
					{

							var id = schemaCopy.fields[i].id;

							if (schemaCopy.fields[i].type.isCheck == true)
							{ console.log("isCheck")
								if(req.defaults[id] && req.defaults[id] !== undefined)
								{
									schemaCopy.fields[i].default == true;
								}else
								{
									schemaCopy.fields[i].default == false;
								}

							}
							else if (schemaCopy.fields[i].type.isCheckboxTree == true)
							{
									var _default = req.defaults[id];
									
									if(_default)
									{
										if(_default.constructor != Array)
										{
											_default = [_default];
										}
									}
									function walk(c)
									{
										if(!c) return;
										if(_default.indexOf(c.text) !== -1)
										{
											c.selected = true;
											
										}
										for(var i in c.children)
											{
												walk(c.children[i])
											}
									}
									if(_default)
										walk(schemaCopy.fields[i].options);
							}
							else if (schemaCopy.fields[i].type.isMultiCheck == true)
							{ console.log("isMultiCheck")
									for(var k in schemaCopy.fields[i].options)
									{
										if(req.defaults[schemaCopy.fields[i].options[k].id] !== undefined)
											schemaCopy.fields[i].options[k].default = !!req.defaults[schemaCopy.fields[i].options[k].id];

									}
							}
							else if (schemaCopy.fields[i].type.isSelect == true)
							{ console.log("isSelect")
									for(var k in schemaCopy.fields[i].options)
									{
										if(schemaCopy.fields[i].options[k].value == req.defaults[id])
											schemaCopy.fields[i].options[k].default = true;
									}
							}
							else if (schemaCopy.fields[i].type.isRadio == true)
							{

							}
							else
							{

								if(req.defaults[id] !== undefined)
								{

									schemaCopy.fields[i].default = req.defaults[id];
								}
							}

					}

			}
			res.render("forms/formshell",
			{
				form: schemaCopy,
				pageTitle: schemaCopy.title,
				submitText: "Update Email"
			})
		}
		if (req.formSchema)
		{
			return _render(JSON.parse(JSON.stringify(req.formSchema)));
		}
		if (schema.constructor === String)
		{
			require('fs').readFile(schema, function(err, data)
			{
				try
				{
					var formSchema = JSON.parse(data);
					_render(formSchema);
				}
				catch (e)
				{
					console.log(e);
					res.status(400).send("Error writing form: " + JSON.stringify(e))
				}
			});
		}
		else
		{
			var schemaCopy = JSON.parse(JSON.stringify(schemaCopy));
			_render(schemaCopy);
		}
	};

	function _post(req, res, next)
	{
		//doValidate
		var body = req.body;

		res.redirect = function(url)
		{
			res.status(200).send({text:'OK',redirect:url});
		}
		function doValidate(schema)
		{
			var form = {};
			for (var i in schema.fields)
			{
				if (schema.fields[i].type.isCheck == true)
				{
					form[schema.fields[i].id] = !!body[schema.fields[i].id];
				}
				if ((schema.fields[i].type.isSelect == true || schema.fields[i].type.isCheckboxTree == true) && schema.fields[i].multiple == true && body[schema.fields[i].id])
				{
					form[schema.fields[i].id] = JSON.parse(body[schema.fields[i].id]);
				}
				else if (schema.fields[i].type.isMultiCheck == true )
				{
					var options = schema.fields[i].options;
					for (var j in options)
						form[options[j].id] = !!body[options[j].id]
				}
				else if (schema.fields[i].type.isFile == true)
				{
					//the file is missing from the post
					if(!req.files[schema.fields[i].id])
					{
						return res.status(400).send("Expected file not found in post");
					}
				}
				else
				{
					console.log(body[schema.fields[i].id], "test");
					form[schema.fields[i].id] = body[schema.fields[i].id];
				}
			}
			req.body = form;

			next();
		}
		if(req.formSchema)
		{
			return doValidate(JSON.parse(JSON.stringify(req.formSchema)));
		}
		if (schema.constructor === String)
		{
			require('fs').readFile(schema, function(err, data)
			{
				try
				{
					var formSchema = JSON.parse(data);
					doValidate(formSchema);
				}
				catch (e)
				{
					res.status(400).send("Error writing form: " + JSON.stringify(e))
				}
			});
		}
		else
			doValidate(schema);
	};

	return function(req, res, next)
	{
		if (req.method == "GET")
			_get(req, res, next);
		if (req.method == "POST")
		{

			var form = new multiparty.Form();
		    form.parse(req, function(err, fields, files) {


		    	req.body = {};
		    	req.files = {};
		    	for(var i in fields)
		    	{
		    		req.body[i] = fields[i][0];
		    	}

		    	var fileNames = Object.keys(files);
		    	async.eachSeries(fileNames,function(i,cb)
		    	{

		    		req.files[i] = files[i][0];
		    		fs.readFile(files[i][0].path,function(err,data)
		    		{
		    			req.files[i].buffer = data;
		    			fs.unlink(req.files[i].path,function(err)
		    			{
		    				delete req.files[i].path;
		    				cb();
		    			})
		    		})
		    	},
		    	function(err)
		    	{
		    		_post(req, res, next);
		    	})



		    });

		}
	}
}
exports.form = form;
exports.guessSchema = function(obj)
{
	var schema = {};
	schema.title = "Auto Generated Schema";
	schema.fields = [];
	for (var i in obj)
	{
		var val = obj[i];
		if (typeof val == "boolean")
		{
			var field = {};
			field.id = i;
			field.helptext = "Auto generated boolean select for " + i;
			field.default = val;
			field.label = i;
			field.type = {
				isCheck: true
			}
			schema.fields.push(field);
		}
		else
		{
			var field = {};
			field.id = i;
			field.label = i;
			field.helptext = "Auto generated text input for " + i;
			field.default = val;
			field.type = {
				isText: true,
				type:"text"
			}
			schema.fields.push(field);
		}
	}
	schema.submitText = "Submit";
	return schema;
}
