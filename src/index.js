//Load synaptic library
const synaptic = require('synaptic');

var Neuron = synaptic.Neuron,
 Layer = synaptic.Layer,
 Network = synaptic.Network,
 Trainer = synaptic.Trainer,
 Architect = synaptic.Architect;

var myNetwork = new Architect.Perceptron(2, 4, 4, 1);
var trainer = new Trainer(myNetwork);

var knownFrames = [
  { 'SN' : "1234", 'model': "VMAX" },
  { 'SN' : "2345", 'model': "VMAX" },
  { 'SN' : "3456", 'model': "VNX" },
  { 'SN' : "4567", 'model': "VNX" },
];

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

var predictData = [
   { 'input': [1,0,6019,96], 'output': [0] },
   { 'input': [2,0,4755,63], 'output': [0] },
   { 'input': [3,0,13381,88], 'output': [0] },
   { 'input': [0,5,9143,148], 'output': [1] },
   { 'input': [1,1,5320,57], 'output': [1] },
   { 'input': [2,1,15267,59], 'output': [1] }
];

function search(array, key, prop){
  // Optional, but fallback to key['name'] if not selected
  prop = (typeof prop === 'undefined') ? 'name' : prop;

  for (var i=0; i < array.length; i++) {
    if (array[i][prop] === key) {
      return array[i];
    }
  }
}

var selectedFrame = "";

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
    // var speechOutput = "Welcome to the EMC Support Predictor. You can ask for a prediction for today.";
    // var repromptText = "Ask for today's premonition.";
    var speechOutput = "Welcome to the Dell EMC Support Predictor. I have data for " + knownFrames.length + " frames. Please tell me which frame to use?";
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
      var speechOutput = "I have data for " + knownFrames.length + " frames. ";

      speechOutput += "And they are: " + Object.keys(knownFrames).map(k => knownFrames[k].SN);

      speechOutput += ". Please choose a frame.";
      var repromptText = "Please choose a frame.";

      response.ask (speechOutput, repromptText);
    },

    "ChooseFrame": function (intent, session, response) {
      var repromptText = "Please choose a date for the prediction.";
      var frame = intent.slots.Frame;
      var speechOutput= "";

      // search(array, 'string 1', 'id');
      var found = search(knownFrames, frame.value, 'SN');

      if (found) {
        // speechOutput += " and I found it. Model is " + found.model + ". ";
        selectedFrame = frame.value;

        //"Building the neural network for frame 1234. Built successfully! Which day should I predict for?"
        speechOutput += "Building the neural network for " + found.model + " frame " + frame.value + ". ";

        //train the neural network
        var flag = trainer.train(trainingSet, {
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
        speechOutput += "I did not find frame " + frame.value + ". Please choose a different frame.";
        repromptText = "Please choose a frame. You may ask to list frames."
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
        // it didn't. Yell at 'em dumb users!!!
        speechOutput = "Please chose a frame first.";
        repromptText = "Please chose a frame. You may ask to list frames.";

        // response.ask (speechOutput, repromptText);
      } else {
        // Ok, frame selected

        //As a hack, randomly pick a test set
        var testSet = Math.floor(Math.random() * predictData.length);

        // this is where the magic happens.  right here: ---vvvvvvvvv--- see below
        speechOutput = "There is a " + Math.round(myNetwork.activate(predictData[testSet].input)*100) + "% chance that there is an issue on " + date.value + "... ";
        speechOutput += " Would you like to ask about another frame?";
        repromptText = "Please chose a frame. You may ask to list frames."
      }
      response.ask (speechOutput, repromptText);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
      var speechOutput = "Please chose one of the " + knownFrames.length + " frames for a prediction about an upcoming support request. ";
      speechOutput += "You may also ask to list the frames."
      var repromptText = "Please choose a frame.";
      response.ask(speechOutput, repromptText);
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
    // Create an instance of the SupportPredictor skill.
    var supportPredictor = new SupportPredictor();
    supportPredictor.execute(event, context);
};
