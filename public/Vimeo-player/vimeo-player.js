$(document).ready(function()
{
    xAPILaunch(function(err, apiData, xAPI)
    {
        if (err)
        {
            alert("launch error:" + err);
        }
        else
        {
          

            var t = t = /com\/(.*?)$/;
            
            var videoID = t.exec(apiData.media.url)[1];


            var iframe = $('#player')[0];
            iframe.src = "http://player.vimeo.com/video/" + videoID + "?api=1&player_id=player";

            $(iframe).load(function()
            {


                function onPause()
                {
                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/paused", apiData.media.url);
                    xAPI.sendStatement(t);
                }

                function onPlay()
                {

                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/played", apiData.media.url);
                    xAPI.sendStatement(t);
                }

                function onFinish()
                {
                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/completed", apiData.media.url);
                    xAPI.sendStatement(t);
                }

                function onPlayProgress()
                {

                }

                var player = $f(iframe);
                // When the player is ready, add listeners for pause, finish, and playProgress
                player.addEvent('ready', function()
                {

                    player.addEvent('pause', onPause);
                    player.addEvent('play', onPlay);
                    player.addEvent('finish', onFinish);
                    player.addEvent('playProgress', onPlayProgress);
                });

            })
        }
    }, true)
})