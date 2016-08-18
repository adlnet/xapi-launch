var actorName = document.getElementById("launchName").value
var actorName = document.getElementById("launchEmail").value

var video = "xIoRWIgzvbM"; // Change this to your video ID
// "global" variables read by ADL.XAPIYoutubeStatements
ADL.XAPIYoutubeStatements.changeConfig({
  "actor":  {"name": "pauliejes", "mbox": "mailto:pauliejes@gmail.com", "objectType": "Agent"},
  "videoActivity": {"id":"https://www.youtube.com/watch?v=" + video, "definition":{"name": {"en-US":video}} }
});
function initYT() {
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: video,
    playerVars: { 'autoplay': 0 },
    events: {
      'onReady': ADL.XAPIYoutubeStatements.onPlayerReady,
      'onStateChange': ADL.XAPIYoutubeStatements.onStateChange
    }
  });
}

initYT();
// Auth for the LRS
var conf = {
    "endpoint" : "https://lrs.adlnet.gov/xapi/statements",
    "auth" : "Basic " + toBase64("xapi-tools:xapi-tools"),
};

ADL.XAPIWrapper.changeConfig(conf);
/*
 * Custom Callbacks
 */
ADL.XAPIYoutubeStatements.onPlayerReadyCallback = function(stmt) {
  console.log("on ready callback");
}
// Dispatch Youtube statements with XAPIWrapper
ADL.XAPIYoutubeStatements.onStateChangeCallback = function(event, stmt) {
  console.log(stmt);
  if (stmt) {
    stmt['timestamp'] = (new Date()).toISOString();
    ADL.XAPIWrapper.sendStatement(stmt, function(){});
  } else {
    console.warn("no statement found in callback for event: " + event);
  }
}
