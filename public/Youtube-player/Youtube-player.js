$(document).ready(function()
{
    ADL.launch(function(err, apiData, xAPI)
    {
        if (err)
        {
        	alert("launch error:" + err);
        }
        else
        {
            function youtube_parser(url)
            {
                var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
                var match = url.match(regExp);
                return (match && match[7].length == 11) ? match[7] : false;
            }

            if (!err)
            {
                apiData.media.youtubeID = youtube_parser(apiData.media.url);
                var content = apiData.content;
                var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/launched", apiData.media.url);
                xAPI.sendStatement(t);
            }


            var player;

            function onPlayerReady(event)
            {

            }

            function onPlayerStateChange(event)
            {
                if (event.data == YT.PlayerState.PLAYING)
                {
                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/played", apiData.media.url);
                    xAPI.sendStatement(t);
                }
                if (event.data == YT.PlayerState.PAUSED)
                {
                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/paused", apiData.media.url);
                    xAPI.sendStatement(t);
                }
                if (event.data == YT.PlayerState.ENDED)
                {
                    var t = new ADL.XAPIStatement(apiData.actor, "http://adlnet.gov/expapi/verbs/completed", apiData.media.url);
                    xAPI.sendStatement(t);
                }
            }

            window.onYouTubeIframeAPIReady = function()
            {

                player = new YT.Player('player',
                {
                    height: '390',
                    width: '640',
                    videoId: youtube_parser(apiData.media.url),
                    events:
                    {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });

            }
            $(document.head).append("<script src='https://www.youtube.com/iframe_api' ></script>");
        }
    }, true)
})