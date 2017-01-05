//globals: equal, responseText, statement, ok, deepEqual, QUnit, module, asyncTest, Util, start, golfStatements, console
/*jslint bitwise: true, browser: true, plusplus: true, maxerr: 50, indent: 4 */
function Config() {
	"use strict";
}

Config.endpoint = "https://lrs.adlnet.gov/xapi/";
Config.user = "jqm";
Config.password = "xapijqm";

// Local Storage email names -- should / cloud be unique across apps
var storageKeyName = "xapi-jqm/name";
var storageKeyEmail = "xapi-jqm/email";

// "global" variables
var moduleID = "http://adlnet.gov/xapi/samples/xapi-jqm/course/"; // trailing slash
var moduleName = "How to Make French Toast xapi-jqm Course Demo";
var courseType = "http://adlnet.gov/xapi/activities/course";

var baseActivity = {
    "id": moduleID,
    "definition": {
        "name": {
            "en-US": moduleName
        },
        "description": {
            "en-US": "A sample HTML5 mobile app with xAPI tracking that teaches you how to make french toast."
        }
    },
    "objectType": "Activity"
};
