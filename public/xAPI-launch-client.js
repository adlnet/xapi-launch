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


//The library will append the necessary launch info to each new A that is linked to the page. 
//NOTE: This cannot work if you programmatically change the window location. If you do, you must
//execute the logic in setupCourseLinks to send the initialization data to the new location (if
//you wish that new location to track as part of this session)
function observeForNewLinks()
{
    // select the target node
    var target = document.body;
    // create an observer instance
    var observer = new MutationObserver(function(mutations)
    {  
        mutations.forEach(function(mutation)
        {
            for(var i in mutation.addedNodes)
            {
                if(mutation.addedNodes[i].constructor == HTMLAnchorElement)
                {
                    var node = $(mutation.addedNodes[i]);
                    setupCourseLinks(node);
                }
            }
        });
    });
    // configuration of the observer:
    var config = {
        attributes: true,
        childList: true,
        subtree:true
    };
    // pass in the target node, as well as the observer options
    observer.observe(target, config);
    // later, you can stop observing
  ///  observer.disconnect();
}
//This library will init all links in the DOM that include the attribute "courseLink = true"
//with the information necessary for the document at that link to track as part of this session.
function setupCourseLinks($nodes)
{
    var launchToken = getQueryVariable("xAPILaunchKey");
    var launchEndpoint = getQueryVariable("xAPILaunchService");
    var encrypted = getQueryVariable("encrypted");
    var query = "xAPILaunchKey=" + launchToken + "&xAPILaunchService=" + launchEndpoint;
    if (encrypted)
    {
        query += "&encrypted=true";
    }
    $nodes.each(function(e)
    {
        var link = $(this);
        var href = link.attr('href');
        var courseLink = link.attr('courseLink');
        if (courseLink == "true")
        {
            if (href.indexOf("?") > -1)
            {
                href = href + "&" + query;
            }
            else
                href = href + "?" + query;
            link.attr('href', href);
        }
    });
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
        $.post(launch.toString(), function() {}).success(function(body, xhr)
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

            //Links that include "courseLink='true'"
            setupCourseLinks($(document.body).find("a"));
            //Also, if links are added dynamically, we will do the same logic for those links.
            observeForNewLinks();
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