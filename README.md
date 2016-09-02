# Alexa Challenge
A simple Amazon Echo project to participate in the EMC Underground Challenge

# Support Predictor
The solution's goal is to predict whether a support case will be open for a
specific EMC array. The prediction is using ML (Machine Learning) inside an AWS
lambda function using an existing historical data set.

## Logic:
- Initialize ML NN (neural network)
- Load a training set for a specified frame
- Ask user for a future date (currently: today or tomorrow)
- Support Predictor tells the channces

## Sample dialog
- (User)  "Alexa, use Support Predictor"
- (Alexa) "Welcome to the EMC Support Predictor. I have data for two frames: 1234 and 5678. Please tell me which one to use?"
- (User)  "Frame 1234"
- (Alexa) "Building the neural network for frame 1234. Built successfully! Which day should I predict for?"
- (User)  "Today" || "Tomorrow"
- (Alexa) "There is a XX% chance that there is an issue today!"

# Development
The project is using NODE.JS. The ML component is the "synaptic" library:
`cd src && npm install synaptic`
