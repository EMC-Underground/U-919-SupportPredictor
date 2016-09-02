
/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

const synaptic = require('synaptic');

// build neuron netowrk
var Neuron = synaptic.Neuron,
 Layer = synaptic.Layer,
 Network = synaptic.Network,
 Trainer = synaptic.Trainer,
 Architect = synaptic.Architect;

var myNetwork = new Architect.Perceptron(2, 4, 4, 1);
var trainer = new Trainer(myNetwork);

var trainingSet = [
  { 'input': [0,3,16605,98],  'output': [1] },
  { 'input': [1,0,7859,119],  'output': [0] },
  { 'input': [0,2,12591,138], 'output': [1] },
  { 'input': [1,0,11814,169], 'output': [0] },
  { 'input': [2,0,10453,86],  'output': [0] },
  { 'input': [3,0,19170,153], 'output': [0] },
  { 'input': [4,0,18448,100], 'output': [0] },
  { 'input': [5,0,14280,141], 'output': [0] },
  { 'input': [6,0,13319,197], 'output': [0] },
  { 'input': [7,0,7212,180],  'output': [0] },
  { 'input': [8,0,4978,100],  'output': [0] },
  { 'input': [9,0,10408,8],   'output': [0] },
  { 'input': [0,1,14546,58],  'output': [1] },
  { 'input': [1,0,2580,28],   'output': [0] },
  { 'input': [2,0,15171,115], 'output': [0] },
];

var todaysData = [
  // { 'input': [1,0,6019,96], 'output': [0] },
  // { 'input': [2,0,4755,63], 'output': [0] },
   { 'input': [3,0,13381,88], 'output': [0] },
  // { 'input': [0,5,9143,148], 'output': [1] },
  // { 'input': [1,1,5320,57], 'output': [1] },
  // { 'input': [2,1,15267,59], 'output': [1] }
];

var tomorrowsData = [
  // { 'input': [1,0,6019,96], 'output': [0] },
  // { 'input': [2,0,4755,63], 'output': [0] },
  // { 'input': [3,0,13381,88], 'output': [0] },
   { 'input': [0,5,9143,148], 'output': [1] },
  // { 'input': [1,1,5320,57], 'output': [1] },
  // { 'input': [2,1,15267,59], 'output': [1] }
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
    var speechOutput = "Welcome to the EMC Support Predictor. I have data for two frames. Please tell me which one to use?.";
    var repromptText = "Please choose a frame.";
    response.ask(speechOutput, repromptText);
};

SupportPredictor.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("SupportPredictor onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

SupportPredictor.prototype.intentHandlers = {
    // Welcome and ask to chose a frame
    "ChoseFrame": function (intent, session, response) {
      handleChoseFrame(intent, session, response);
    },

    // Chose time
    "WhichPremonition": function (intent, session, response) {
      handleWhen(intent,session, response);
    },

    // Default functions help .etc.
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Please chose one of the two frames for a prediction
        about an upcoming support request");
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

function handleChoseFrame(intent, session, response) {
  var speechText;

  // find what the user said
  var frame = intent.slots.Frame;

  // Train the Neural Network
  var flag = trainer.train(trainingSet, {
    rate: .02,
    iterations: 8000,
    error: .01,
    shuffle: true,
    cost: Trainer.cost.CROSS_ENTROPY
	});

  speechText = "Neural network for frame " + frame;

  // Check the training result (error)
  // if too large, complain.
  if(Math.round(flag.error*100) <= 1) {
    speechText += "is trained within one percent of accuracy!";
  } else {
    speechText += "was not trained well. Please consider chaining the training set.";
  }

  speechText += " Which day should I predict for?";

  //Reprompt speech will be triggered if the user doesn't respond.
  var repromptText = "Should I predict for today or tomrrow?";

  //TODO check that frame is already chosen

  response.ask(speechText, repromptText);
};

function handleWhen(intent, session, response) {
  var speechText;

  var when = intent.slots.When;

  if (when === "today") {
    todaysData.forEach(function(match) {
      var activations = match.input;
      //console.log(activations, Math.round(myNetwork.activate(activations)*100),"%");
    });
  } else {
    tomorrowsData.forEach(function(match) {
      var activations = match.input;
      //console.log(activations, Math.round(myNetwork.activate(activations)*100),"%");
    });
  }

  speechText = "There is a " + Math.round(myNetwork.activate(activations)*100)
  + " percent chance there is an issue " + when;

  //TODO check that frame is already chosen

  response.tell(speechText);
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the SupportPredictor skill.
    var supportPredictor = new SupportPredictor();
    supportPredictor.execute(event, context);
};
