var router = require('express').Router();
var request = require('request');
var cookie;

const maxQs = 3;

exports.router = router;

exports.useCookie = function(sess){
        cookie = sess;
};

exports.index = function (req, res) {
  res.render('home/index', {
    title: 'Node Express Mongoose Boilerplate'
  });
};

router.get('/:number', function(req, res){
    var number = parseInt(req.params.number);
    if(number === maxQs + 1) res.redirect("/");
    else if(isNaN(number) || number < 1 || number > maxQs) throw new Error("Question number is out of range");

    var a = parseInt(Math.random() * 25);
    var b = parseInt(Math.random() * 25);
    var title = `This is the test! ${a} + ${b} + ${req.params.number}`;
    var user = req.user || req.session.xAPIActor.actor;
    var testing = true;

    res.render('question/assess', { a, b, user, title, number, testing } );
});

router.get('/', function(req, res){

});

router.post('/answer', function(req, res){
    var a = parseInt(req.body.a);
    var b = parseInt(req.body.b);
    var answer = parseInt(req.body.answer);
    var number = parseInt(req.body.number) + 1;

    sendStatement(req, a + b === answer, `${a} + ${b} = ${answer}`, body => {
        console.log(body);
        res.redirect('/question/' + number);
    });
});

function sendStatement(req, result, object, done){
    var config = req.session.xAPIActor;
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    var statement = {
        actor: config.actor,
        //contextActivities: config.contextActivities,
        verb: {
            id: "http://adlnet.gov/expapi/verbs/answered",
            display: { "en-US" : "answered" },
        },
        object: {
            id: fullUrl,
            definition: {
                name: {
                    "en-US": "Math problem"
                },
                description: {
                    "en-US": object
                }
            }
        },
        result: {
            success: result
        }
    };

    var opts = {
        //url: "http://localhost:3000/users/testCookie",
        url: config.endpoint + "statements",
        method: "POST"
    };

    console.log("XAPI!!! ", opts);

    xapi_request(opts, JSON.stringify(statement), (err, res, body) => {
        if(err) throw new Error(err);
        else done(body);
    });
}

function xapi_request(options, data, callback) {
    try {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = options.headers['Content-Type'] || "application/json";
        options.headers['X-Experience-API-Version'] = options.headers['X-Experience-API-Version'] || '1.0.1';
        options.headers['Cookie'] = cookie;

        if (data) {
            options.body = data;
        }
         console.log("going to call with options: " + JSON.stringify(options));
        request(options, callback);
    } catch (e) {
        if (callback && typeof callback === 'function') {
            callback(e);
        } else {
            console.log(e);
        }
    }
};
