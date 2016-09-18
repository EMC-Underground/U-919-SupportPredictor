const synaptic = require('synaptic');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({httpOptions: { timeout: 2000 }, apiVersion: '2006-03-01', region: 'us-east-1'});

// Main config JSON object. Data is read from S3 into it
var config = {};

// Set up Neural Objects
var Neuron = synaptic.Neuron,
     Layer = synaptic.Layer,
   Network = synaptic.Network,
   Trainer = synaptic.Trainer,
 Architect = synaptic.Architect;

var myNetwork = new Architect.Perceptron(2, 4, 4, 1);
var trainer = new Trainer(myNetwork);

// State variables
var selectedFrame = ""; // When non-empty keeps frame ID

// hack.
var predictData = [
   { 'input': [1,0,6019,96], 'output': [0] },
   { 'input': [2,0,4755,63], 'output': [0] },
   { 'input': [3,0,13381,88], 'output': [0] },
   { 'input': [0,5,9143,148], 'output': [1] },
   { 'input': [1,1,5320,57], 'output': [1] },
   { 'input': [2,1,15267,59], 'output': [1] }
];

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * SupportPredictor is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var SupportPredictor = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
SupportPredictor.prototype = Object.create(AlexaSkill.prototype);
SupportPredictor.prototype.constructor = SupportPredictor;

SupportPredictor.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("SupportPredictor onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

SupportPredictor.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("SupportPredictor onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Dell EMC Support Predictor. I have data for " + Object.keys(config).length + " frames. Please tell me which frame to use?";
    var repromptText = "Please choose a frame.";
    response.ask(speechOutput, repromptText);
};

SupportPredictor.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("SupportPredictor onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

SupportPredictor.prototype.intentHandlers = {

      "ListFrames": function (intent, session, response) {
        var speechOutput = "I see: " +
          Object.keys(config).length + " frames, and they are: " +
          Object.keys(config).map(k => " " + k + " is a " + config[k].model);

        speechOutput += ". Please choose a frame.";
        var repromptText = "Please choose a frame.";

        response.ask(speechOutput, repromptText);
      },

      "ChooseFrame": function (intent, session, response) {
      var repromptText = "Please choose a date for the prediction.";
      var speechOutput = "";

      // get the frame ID from Echo
      var frame = intent.slots.Frame;

      // Does this frame exist in our list?
      if (config[frame.value]) {
        //Found one! Great.
        //console.log("Found: ", frame, " with ", config[frame].SN);

        //record the selection in the State
        selectedFrame = frame.value;

        //"Building the neural network for frame 1234. Built successfully! Which day should I predict for?"
        speechOutput += "Building the neural network for " + config[frame.value].model + " frame " + frame.value + ". ";

        //train the neural network
        var flag = trainer.train(config[frame.value].trainingSet, {
            rate: .02,
            iterations: 8000,
            error: .01,
            cost: Trainer.cost.CROSS_ENTROPY
        });

        if (Math.round(flag.error*100) < 20) {
            // error is less than 20%, pretty good!
            speechOutput += "Built successfully! Which day should I predict for?";
            // repromptText = "Please chose a date for the prediction.";
        } else if (Math.round(flag.error*100) < 50) {
            // error is between 50 and 20%... could be better, but ok
            speechOutput += "Built with poor accuracy... Consider getting better training data! Which day should I predict for?";
            // repromptText = "Please chose a date for the prediction.";
        } else {
            // error is greater than 50%. No accurate prediction possible
            speechOutput += "Built unsuccessfully! Please load me with better historical training data! ";
            speechOutput += "Cannot make a prediction, sorry.";
            response.tell(speechOutput);
        }

      } else {
        //Nope, not there.
        //console.log("not found: ", frame);
        speechOutput += "I did not find frame " + frame.value + ". Please choose a different frame.";
        repromptText = "Please choose a frame. You may ask to list frames.";
      }

      response.ask (speechOutput, repromptText);
    },

    "WhichPremonition": function (intent, session, response) {
      var speechOutput="";
      var repromptText="";

      // get the date from Echo
      var date = intent.slots.When;

      //Check the the frame is already selected
      if (selectedFrame === "") {
        // it is not. Yell at 'em dumb users!!!
        speechOutput = "Please choose a frame first.";
        repromptText = "Please choose a frame. You may ask to list frames.";
      } else {
        // Ok, frame has already been select. Whew!

        //As a hack, randomly pick a test set
        var testSet = Math.floor(Math.random() * predictData.length);

        // this is where the magic happens.  right here: ---vvvvvvvvv--- see below
        speechOutput = "There is a " + Math.round(myNetwork.activate(predictData[testSet].input)*100) + "% chance that there is an issue on " + date.value + "with the frame " + selectedFrame + "... ";
        speechOutput += " Would you like to hear a prediction about another date?";
        repromptText = "Please chose a date or a frame. You may ask to list frames."
      }

      response.ask (speechOutput, repromptText);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {

      var speechOutput = "Please choose one of the " + Object.keys(config).length;
      speechOutput += " frames for a prediction about an upcoming support request.";
      speechOutput += " You may also ask to list the frames."
      var repromptText = "Please choose a frame.";
      response.ask(speechOutput, repromptText);
    },

    "Goodbye": function (intent, session, response) {
      var speechOutput = "Thank you for using the Dell EMC Support Predictor. Goodbye";
      response.tell(speechOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
      var speechOutput = "Goodbye";
      response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
      var speechOutput = "Goodbye";
      response.tell(speechOutput);
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {

  var params = {
    Bucket: 'supportpredictor',
    Key: 'allData.json',
    ResponseContentType : 'application/json'
  }

  s3.getObject(params, function (err, data) {
    if(err) {
      console.log("Error: ", err, " Stack: ", err.stack);
      // config[err]=err.stack;
    } else {
      // read the json into the config
      config = JSON.parse(data.Body);
    }
    // Create an instance of the SupportPredictor skill.
    var supportPredictor = new SupportPredictor();
    supportPredictor.execute(event, context);

  });

};
