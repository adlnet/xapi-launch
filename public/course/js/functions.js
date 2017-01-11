/* in progress */
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
var actor;
ADL.launch(function(err,apiData,xAPIWrapper){


        if(err){
            console.log(err);
            ADL.XAPIWrapper.changeConfig({
                endpoint: "https://lrs.adlnet.gov/xapi/",
                user: 'Neat',
                password: 'p356a012'
            });
            wrapper = ADL.XAPIWrapper;
            
            var stmt = new ADL.XAPIStatement(actor,"http://adlnet.gov/expapi/verbs/initialized","http://localhost:8081"+window.location.pathname);

            
            updateLRS(stmt);

        } else {            
            console.log("--- Launch ---");
            lData = apiData;
            wrapper = xAPIWrapper;
            actor = lData.actor;
            console.log(lData.actor);

            var stmt = new ADL.XAPIStatement(actor,"http://adlnet.gov/expapi/verbs/initialized","http://localhost:8081"+window.location.pathname);

            //lets shim this in, so that the ADL.XAPIWrapper.sendStatement looks just like it always did
            ADL.XAPIWrapper = xAPIWrapper;
            ADL.XAPIWrapper._sendStatement = ADL.XAPIWrapper.sendStatement;
            ADL.XAPIWrapper.sendStatement = function(statement,cb)
            {
                statement.actor = apiData.actor;
                //we have to make this object dumb JSON, not the object that is returned from the wrapper
                statement = JSON.parse(JSON.stringify(statement));
                signStatement(statement,function(err,statement,signature)
                {
                    $('code').text(JSON.stringify(statement,null,1) + "\r\n\r\n" + signature);     

                     var attachmentMetadata = {
                            "usageType": "http://adlnet.gov/expapi/attachments/signature",
                            "display":
                            {
                                "en-US": "Actor Signature"
                            },
                            "description":
                            {
                                "en-US": "A signature proving the actor of this statement was present when the statement was generated"
                            },
                            "contentType": "application/octet-stream"   
                        }
                        var attachment = {
                            value: signature,
                            type:attachmentMetadata
                        }

                 
                    ADL.XAPIWrapper._sendStatement(statement,cb,[attachment]);

                });
            
            }

            updateLRS(stmt);


        }

    },false);
// Global Actor
// actor = getActor();

/* Page Change Logic */
// if ( actor  == false ) {
//     checkLoggedIn();
// } else { // silly thing to wrap in an else but I need to restructure the code to handle a missing actor on login page

//     doConfig();

//     // Handle chapter clicks to send launch statements
//     $( document ).on("vclick", "a.chapter", function() {
//         $chapter = $(this);
//         var chapter = $chapter.parent("li").attr("id");
//         var name = $chapter.text();
//         chapterLaunched(chapter, name);
//     });

//     // Abstracted page changing logic -- catch-all
//     $( window ).on("pagechange", function(event) {

//         var chapter = $("body").attr("data-chapter");
//         var pageID = $.mobile.activePage.attr("id");
//         var activityID = moduleID + chapter + "/" + pageID;
//         var context = createContext(chapter);

//         var stmt = {
//             "actor": actor,
//             "verb": ADL.custom.verbs.read,
//             "context": context,
//             "object": {
//                 "id" : activityID,
//                 "objectType": "Activity",
//                 "definition": {
//                     "name": {
//                         "en-US": moduleName + ": " + chapter + ", page: " + pageID
//                     }
//                 }
//             }
//         };

//         // Send a statement
//         ADL.XAPIWrapper.sendStatement(stmt);
//         ADL.XAPIWrapper.sendState(moduleID, actor, "session-state", null, { "info": "reading", "chapter": chapter, "page": pageID });

//     });
// } // end silly else


function updateLRS(stmnt){
    console.log("--- send stmnt ---");
    console.log(stmnt);
    wrapper.sendStatement(stmnt, outputResults);
}

//The callback for the LRS.
var outputResults = function (resp, thing) {
        var spanclass = "text-info";
        var text = "";
        if (resp.status >= 400) {
            spanclass = "text-danger";
            text = (thing.totalErrors > 1) ? "Errors: " : "Error: ";
            for ( var res in thing.results ) {
                text += "<br>" + ((thing.results[res].instance.id) ? thing.results[res].instance.id : "Statement " + res);
                for ( var err in thing.results[res].errors ) {
                    text += "<br>&nbsp;&nbsp;" + thing.results[res].errors[err].trace;
                    text += "<br>&nbsp;&nbsp;&nbsp;&nbsp;" + thing.results[res].errors[err].message;
                }
            }
        } else {
            if ( resp.responseText )
                text = "Successfully sent " + resp.responseText;
            else
                text = thing;
        }

        console.log(text);
    };
/* State functions */
function getState() {
    return wrapper.getState(moduleID, actor, "session-state");
}

/* Course Progress */

// Get from State API
function getChaptersCompleted() {
    var chaptersCompleted = wrapper.getState(moduleID, actor, "chapters-completed");
    return chaptersCompleted.chapters;
}

// Set in State API
function setChapterComplete() {
    var chapterID = $("body").attr("data-chapter");
    var currentCompletedChapters = getChaptersCompleted();   
    var chapterCompleted = [ chapterID ];

    var hash = {}, union = [];

    // #thatHappened
    $.each($.merge($.merge([], currentCompletedChapters), chapterCompleted), function (index, value) { hash[value] = value; });
    $.each(hash, function (key, value) { union.push(key); } );
    
    wrapper.sendState(moduleID, actor, "chapters-completed", null, { "chapters": union });

    doConfig();

    // statement for launching content
    var stmt = {
        "actor": actor,
        "verb": ADL.verbs.completed,
        "context": createContext(),
        "object": {
            "id": moduleID + chapterCompleted,
            "objectType": "Activity",
            "definition": {
                "name": {
                    "en-US": moduleName + ": " + chapterCompleted
                }
            }
        }
    };

    // Send chapterComplete statement
    // updateLRS(stmt);

}

/* Helpers */
function doConfig() { // sorry
    Config.actor = actor;
    ADL.XAPIWrapper.changeConfig(Config);
}

function getPage() {
    var url = window.location.pathname;
    var filename = url.substring(url.lastIndexOf('/')+1);
    return filename;
}

/* Name, Email, Actor, gets and sets */

// Actor
function getActor() {
    var name = localStorage.getItem(storageKeyName);
    var email = localStorage.getItem(storageKeyEmail);
    if ( name == null || email == null ) {
        return false;
    } else {
        var actor = { "mbox": "mailto:" + email, "name": name };
        return actor;
    }
}
function setActor( name, email ) {
    setUserName(name);
    setUserEmail(email);
}

// Name
function getUserName() {
    return localStorage.getItem(storageKeyName);
}
function setUserName(name) {
    localStorage.setItem(storageKeyName, name);
}

// Email
function getUserEmail() {
    return localStorage.getItem(storageKeyEmail);
}
function setUserEmail(email) {
    localStorage.setItem(storageKeyEmail, email);
}

// Destroy all the things
function clearActor() {
    localStorage.removeItem(storageKeyName);
    localStorage.removeItem(storageKeyEmail);
}

/* Login / Logout functions */
function checkLoggedIn() {
    // If the actor doesn't exist, send them to the login page
    if ( getPage() != "00-account.html" ) {
        userLogin();
    }
}

/*
function getBaseURL() {
    // silly regex hack for now #helpWanted
    var regex = new RegExp("(index.html|.*\/chapters\/.*|.*\/glossary.html)");
    var location = window.location.href;
    if ( regex.test(location) ) {
        var str = location.split("/").pop();
        var baseurl = location.replace(str, "");
        var str = "chapters/"
        var baseurl = baseurl.replace(str, "");
    } else {
        // otherwise give up and send them to the github version
        var baseurl = "http://adlnet.github.io/xapi-jqm/demos/course/";
    }
    return baseurl;
}

function userLogin() {
    // Should get the page root
    window.location = "chapters/00-account.html#login";
}

function userLogout() {
    courseExited();
    clearActor();
    window.location = "../"; // lol
}

function userRegister( name, email ) {
    // should error check this
    setActor(name, email);
    // Set global actor var so other functions can use it
    actor = getActor();
    courseRegistered();
    // Setup chapters-complete
    ADL.XAPIWrapper.sendState(moduleID, actor, "chapters-completed", null, { "chapters": [] });
}

// jqm's submission process is the reason I'm doing it this way
function userRegisterSubmit() {
    if ( $("#reg-name").val() != "" && $("#reg-email").val() != "" ) {
        userRegister($("#reg-name").val(), $("#reg-email").val());
        courseLaunched();
        window.location = "../index.html"
    }
}
*/

/*
 * xAPIy
 */
function checkboxClicked(chapter, pageID, checkboxID, checkboxName) {
    
    // doConfig();
    
    // Figure out if it was checked or unchecked
    var isChecked = $("#"+checkboxID).prop('checked');
    var checkedVerb = (isChecked) ? ADL.custom.verbs.checked : ADL.custom.verbs.unchecked;

    var baseActivity = {
        "id": moduleID + "/" + chapter + "/" + pageID + "#" + checkboxID,
        "definition": {
            "name": {
                "en-US": checkboxName
            },
            "description": {
                "en-US": "The " + checkboxName + " checkbox from chapter " + chapter + "; page " + pageID
            }
        },
        "objectType": "Activity"
    };

    // statement for checking content
    var stmt = {
        "actor": actor,
        "verb": checkedVerb,
        "object": baseActivity,
        "context": createContext(chapter, pageID, undefined, true)
    };

    // Send statement
    updateLRS(stmt);

}

/* 
 * SCORMy
 */
function courseRegistered() {
    
    doConfig();

    // statement for launching content
    var stmt = {
        "actor": actor,
        "verb": ADL.verbs.registered,
        "object": baseActivity
    };

    // Send registered statement
    ADL.XAPIWrapper.sendStatement(stmt);

}

function courseLaunched() {
    
    doConfig();

    // statement for launching content
    var stmt = {
        "actor": actor,
        "verb": ADL.verbs.launched,
        "object": baseActivity
    };

    // Send launched statement
    updateLRS(stmt);

}

function chapterLaunched(chapter, name) {
        var activityID = moduleID + chapter;

        var stmt = {
            "actor": actor,
            "verb": ADL.verbs.launched,
            "context": createContext(),
            "object": {
                "id":  activityID,
                "objectType": "Activity",
                "definition": {
                    "name": {
                        "en-US": moduleName + ": " + chapter
                    }
                }
            }
        };

        // Send a statement
        updateLRS(stmt);
}


function courseMastered() {
    
    doConfig();

    // statement for launching content
    var stmt = {
        "actor": actor,
        "verb": ADL.verbs.mastered,
        "object": baseActivity
    };

    // Send launched statement
    updateLRS(stmt);

}

function courseExited() {

    doConfig();

    // statement for launching content
    var stmt = {
        "actor": actor,
        "verb": ADL.verbs.exited,
        "object": baseActivity
    };

    // Send exited statement
    updateLRS(stmt);

}

// supply the chapter, the page, and any sub-activity in that chapter and page. add both if you want the parentChapter activity
// added as a separate activity in the context from the parentChapter/parentPage activity
function createContext( parentChapter, parentPage, subParentActivity, both ) {
    var baseContext = {
        "contextActivities": {
            "parent": [
                baseActivity
            ]
        }
    };

    // set both
    if ( typeof both === "undefined") {
        both = false;
    }

    // if parent chapter make the chapterActivity
    if ( typeof parentChapter !== "undefined" ) {
        var chapterActivity = {
            "id": moduleID + parentChapter,
            "definition": {
                "name": {
                    "en-US": moduleName + ": " + parentChapter
                }
            },
            "objectType": "Activity"
        };
        
        // if parent page and don't want both, just append the parent page to the end of the parentChapter activity
        if ( typeof parentPage !== "undefined" && !both ) {
            chapterActivity["id"] = chapterActivity["id"] + "/" + parentPage;
            chapterActivity["definition"]["name"]["en-US"] = chapterActivity["definition"]["name"]["en-US"]  + ", page: " + parentPage;
        }
        // else they want both
        else if ( typeof parentPage !== "undefined" && both ) {
            var chapterParentActivity = {
                "id": moduleID + parentChapter + "/" + parentPage,
                "definition": {
                    "name": {
                        "en-US": moduleName + ": " + parentChapter + ", page: " + parentPage
                    }
                },
                "objectType": "Activity"
            };
            baseContext.contextActivities.parent.push(chapterParentActivity);            
        }
        baseContext.contextActivities.parent.push(chapterActivity);
    
        // if there is a sub activity, add it
        if ( typeof subParentActivity !== "undefined" ) {
            var subActivity = {
                "id": moduleID + parentChapter + "/" + parentPage + "#" + subParentActivity,
                "definition": {
                    "name": {
                        "en-US": moduleName + ": " + parentChapter + ", page: " + parentPage + " " + subParentActivity
                    }
                },
                "objectType": "Activity"
            };
            baseContext.contextActivities.parent.push(subActivity);
        }
    }
    return baseContext;
}


/*
    Quiz code
*/
var moduleID = "http://adlnet.gov/xapi/samples/xapi-jqm/course/"; // trailing slash
var quizID = moduleID;
var quizActivity = {
    "id": quizID,
    "definition": {
        "name": {
            "en-US": "xAPI for jQuery Mobile French Toast Demo quiz"
        }
    },
    "objectType": "Activity"
};

var CORRECT_QUIZ_ANSWERS = [ [2,3,6], [4], "bread" ];

function gradeQuestion() {
    var chapter = $("body").attr("data-chapter");
    var pageID = $.mobile.activePage.attr("id");
    var quiz_name = "q" + pageID[1]
    var questionID = quizID + "#" + quiz_name;

    var q_form = $("#" + pageID + "_form :input")
    var question_type = q_form[0].type
    var correct_answer = CORRECT_QUIZ_ANSWERS[parseInt(pageID[1]) - 1];
    var correct_answer_display = [];

    switch ( question_type ) {
        case 'radio':
        case 'checkbox':
            var user_answer = [];
            var user_answer_display = [];
            
            //loop through radio/checkboxex and push ones that were selected
            $("#" + pageID + "_form input").each(function(idx, val) {
                    if ( val.checked ){
                        user_answer.push(idx + 1);
                        user_answer_display.push(this.previousSibling.textContent);
                    }
                    if ( $.inArray(idx+1, correct_answer ) > -1) {
                        correct_answer_display.push(this.previousSibling.textContent);
                    }
                });

            //compare radio/checkbox selections 
            var success = false;
            if ( correct_answer.join(',') === user_answer.sort().join(',') ) {
                success = true;
            }

            var stmt = {
                "actor": actor,
                "verb": ADL.verbs.answered,
                "object": {
                    "id" : questionID,
                    "objectType": "Activity",
                    "definition": {
                        "name": {
                            "en-US": moduleName + " " + quiz_name
                        }
                    }
                },
                "result": {
                    "success": success,
                    "response": user_answer.toString() + " " + user_answer_display.toString(),
                    "extensions":{
                        "answer:correct_answer": correct_answer.toString() + " " + correct_answer_display.toString()
                    }
                },
                "context":createContext(chapter, pageID, "quiz")
            };            
            break;
        case 'text':
            user_answer = q_form.val();
            success = false;
            if ( user_answer.toLowerCase() === correct_answer.toLowerCase() ) {
                success = true;
            }
            var stmt = {
                "actor": actor,
                "verb": ADL.verbs.answered,
                "object": {
                    "id" : questionID,
                    "objectType": "Activity",
                    "definition": {
                        "name": {
                            "en-US": moduleName + " " + quiz_name
                        }
                    }
                },
                "result": {
                    "success": success,
                    "response": user_answer,
                    "extensions":{
                        "answer:correct_answer": correct_answer
                    }
                },
                "context":createContext(chapter, pageID, "quiz")
            };
            break;
    }

    console.log("quiz stmt");
    // Send a statement
    updateLRS(stmt);
    localStorage.setItem("xapi-jqm/" + actor["name"] + "/" + quiz_name, success);
}

function makeAssessment() { 
    var chapter = $("body").attr("data-chapter");    
    var results = [];
    var correct = 0;

    for ( var i=0; i < CORRECT_QUIZ_ANSWERS.length; i++ ) {
        results.push(localStorage.getItem("xapi-jqm/" + actor['name'] + "/" + "q" + (i+1)));
        localStorage.removeItem("xapi-jqm/" + actor['name'] + "/" + "q" + (i+1));
    }

    $.each(results, function(idx, val) {
        if (val === "true"){
            correct++;
        }
    });

    var verb = ADL.verbs.failed;
    var percentage = Math.round( (correct/CORRECT_QUIZ_ANSWERS.length) * 100 )
    var display = "";
    if ( percentage > 60 ) {
        verb = ADL.verbs.passed;
        display = "You passed the quiz! You scored " + percentage + "%"
    } else {
        display = "You failed the quiz! You scored " + percentage + "%"        
    }
    var stmt = {
        "actor": actor,
        "verb": verb,
        "object": quizActivity,
        "result": {
            "score":{
                "min": 0,
                "raw": correct,
                "max": CORRECT_QUIZ_ANSWERS.length
            }
        },
        "context": createContext(chapter)
    };
    // Send a statement
    updateLRS(stmt);

    // setChapterComplete();

    // // Mastered statement
    // var chaptersCompleted = getChaptersCompleted();
    // if ( percentage == 100 && chaptersCompleted.length == 5 ) {
    //     courseMastered();
    //     // show a badge by appending to display -- PoC
    //     display += '<p><img src="../media/488px-badge-french-toast.jpg" alt="French Toast Badge" title="French Toast Badge" style="width:100%;max-width:488px" /></p><h4>French Toast Master</h4><p>Congratulations, you have mastered the course in How to Make French Toast</p>';
    // }

    $("#quiz_results").html(display);
}

// End Quiz Code


$( document ).ready(function() {
    // Handle checkbox clicks -- basic no knowledge of context or checked
    $(":checkbox").change(function(event) {
        $checkbox = $(this);
        var checkboxID = $checkbox.attr("id");
        var checkboxName = $checkbox.siblings("label").text();
        var chapter = $("body").attr("data-chapter");
        var pageID = $.mobile.activePage.attr("id");
        checkboxClicked(chapter, pageID, checkboxID, checkboxName);
    });
});
