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

function xAPILaunch(cb, terminate_on_unload)
{

    $(document.body).append("<script src='/static/staticContentDemo/xapiwrapper.min.js'></script>");

    var launchToken = getQueryVariable("xAPILaunchKey");
    var launchEndpoint = getQueryVariable("xAPILaunchService");

    var encrypted = getQueryVariable("encrypted");
    if (!encrypted)
    {
        //here, we'd have to implement decryption for the data. This makes little sense in a client side only course
    }


    if (!launchToken || !launchEndpoint)
        cb("invalid launch parameters");
    var launch = new URL(launchEndpoint);
    launch.pathname += "launch/" + launchToken;
    $.post(launch.toString(), function() {

    }).success(function(body, xhr)
    {


        var launchData = body;

        var conf = {};
        conf['endpoint'] = launchData.endpoint;

        //conf['auth'] = "Basic " + toBase64('tom:1234');

        // Statement defaults [optional configuration]
        conf["actor"] = launchData.actor;
        // conf["registration"] =  ruuid();
        // conf["grouping"] = launchData.contextActivities.grouping.uuid;
        // conf["parent"] = launchData.contextActivities.parent;
        // conf["activity_platform"] = "default platform";

        window.onunload = function()
        {

            if (!terminate_on_unload)
                return;

            var launch = new URL(launchEndpoint);
            launch.pathname += "launch/" + launchToken + "/terminate";
        /*    if (navigator.sendBeacon)
                navigator.sendBeacon(launch.toString(),
                {
                    code: "0",
                    description: "User closed content"
                });
            else*/
                $.ajax(
                {
                    url: launch.toString(),
                    async: false,
                    method:"POST",
                    contentType:"application/json",
                    data: '{"code":0,"description":"User closed content"}'

                })

        }
        ADL.XAPIWrapper.changeConfig(conf);
        cb(null, body, ADL.XAPIWrapper);
    }).error(function() {

    });
};