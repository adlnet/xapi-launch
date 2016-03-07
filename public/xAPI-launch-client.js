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

function cb_wrap(cb)
{
    return function()
    {
        var args = arguments;
        window.setTimeout(function()
        {
            var callerArgs = [];
            for (var i = 0; i < args.length; i++)
            {
                callerArgs.push(args[i]);
            }
            cb.apply(window, callerArgs);
        }, 0)
    }
}

function xAPILaunch(cb, terminate_on_unload)
{
    cb = cb_wrap(cb);
    try
    {
        $(document.body).append("<script src='/static/xapiwrapper.min.js'></script>");

        var launchToken = getQueryVariable("xAPILaunchKey");
        var launchEndpoint = getQueryVariable("xAPILaunchService");

        var encrypted = getQueryVariable("encrypted");
        if (!encrypted)
        {
            //here, we'd have to implement decryption for the data. This makes little sense in a client side only course
        }

        if (!launchToken || !launchEndpoint)
            return cb("invalid launch parameters");
        var launch = new URL(launchEndpoint);
        launch.pathname += "launch/" + launchToken;
        $.post(launch.toString(), function() {

        }).success(function(body, xhr)
        {
            var launchData = body;

            var conf = {};
            conf['endpoint'] = launchData.endpoint;
            conf["actor"] = launchData.actor;

            window.onunload = function()
            {

                if (!terminate_on_unload)
                    return;

                var launch = new URL(launchEndpoint);
                launch.pathname += "launch/" + launchToken + "/terminate";

                $.ajax(
                {
                    url: launch.toString(),
                    async: false,
                    method: "POST",
                    contentType: "application/json",
                    data: '{"code":0,"description":"User closed content"}'

                })

            }
            ADL.XAPIWrapper.changeConfig(conf);
            return cb(null, body, ADL.XAPIWrapper);
        }).error(function(err)
        {
            //exit the try catch so inner execptions in the callback don't trigger this catch
            window.setTimeout(function()
            {
                return cb(err);
            })
        });
    }
    catch (e)
    {
        cb(e);
    }
};