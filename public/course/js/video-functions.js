var TUTORIAL_VIDEO_URL = "http://www.youtube-nocookie.com/embed/vPrtNzvDS5M?rel=0";

// initialize youtube video tracking
var chapterID = $("body").attr("data-chapter");
var pageID = "p1"; // lazy
var wrapper = Popcorn.HTMLYouTubeVideoElement("#How-to-make-french-toast-xapi-jqm-video");
wrapper.src = TUTORIAL_VIDEO_URL 
var video = Popcorn(wrapper);
var videoContext = createContext(chapterID, pageID, undefined, true);
ADL.XAPIVideo.addVideo(video, "", true, false, false, false, videoContext);
