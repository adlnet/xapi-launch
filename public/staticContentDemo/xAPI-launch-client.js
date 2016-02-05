function getQueryVariable(variable)
{
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++)
	{
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == variable)
		{
			return decodeURIComponent(pair[1]);
		}
	}
	console.log('Query variable %s not found', variable);
}

function xAPILaunch(cb)
{
	
	var launchToken = getQueryVariable("xAPILaunchKey");
	var launchEndpoint = getQueryVariable("xAPILaunchService");
	if(!launchToken || !launchEndpoint)
		cb("invalid launch parameters");
	var launch = new URL(launchEndpoint);
	launch.pathname += "launch/"+launchToken;
	$.post(launch.toString(),function()
	{

	}).success(function(){

	}).error(function(){
		
	});
};