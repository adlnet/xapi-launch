var moduleID = "http://adlnet.gov/xapi/samples/xapi-jqm/course/"; // trailing slash
var quizID = moduleID + "chapters/05-quiz#quiz"
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
    // Send a statement
    ADL.XAPIWrapper.sendStatement(stmt);
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
    ADL.XAPIWrapper.sendStatement(stmt);

    setChapterComplete();

    // Mastered statement
    var chaptersCompleted = getChaptersCompleted();
    if ( percentage == 100 && chaptersCompleted.length == 5 ) {
        courseMastered();
        // show a badge by appending to display -- PoC
        display += '<p><img src="../media/488px-badge-french-toast.jpg" alt="French Toast Badge" title="French Toast Badge" style="width:100%;max-width:488px" /></p><h4>French Toast Master</h4><p>Congratulations, you have mastered the course in How to Make French Toast</p>';
    }

    $("#quiz_results").html(display);
}
