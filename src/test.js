//Load synaptic library
const synaptic = require('synaptic');
const AWS = require('aws-sdk');

// var knownFrames = require("./data/knownFrames.json");
//
// var speechOutput = "length is: " + Object.keys(knownFrames).length + " And they are: " + Object.keys(knownFrames).map(k => " " + k) + ".";
//
// var frame = "2345";

// function findArray( array, key ) {
//   var found = "";
// Object.keys(knownFrames).map(([keyy, value]) => console.log(keyy, value));
  // console.log("here:", found);
//   return found;
//
// }

// // f = findArray(knownFrames, frame);
// function returnProperty (array, lookfor, propName) {
//   for (var key in array) {
//     if (array.hasOwnProperty(key)) {
//       if (key == lookfor) {
//         // console.log(key + " -> " + array[key][propName]);
//         return array[key][propName];
//       }
//     }
//   }
// }
//
// if (returnProperty(knownFrames, frame, "model")) {
//   console.log(speechOutput, " ", returnProperty(knownFrames, frame, "SN"));
// } else {
//   console.log("ops.");
// }

//
// configfiles.map(function(configfile) {
//   var params = {
//     Bucket: "bucket",
//     Key: configfile,
//   };
//   console.log(params);
// });
//

//===========================
// Read date from S3
//
var s3 = new AWS.S3({httpOptions: { timeout: 2000 }, apiVersion: '2006-03-01', region: 'us-east-1'});
var config = {};

let configfiles = [
  // "knownFrames" ,
  // "trainingSet" ,
  "allData"
];

var frame="1254";

// const bucketName = 'supportpredictor';

var theRestOfLogic = function () {
  console.log("I see: " +
    Object.keys(config).length + " frames, and they are: " +
    Object.keys(config).map(k => " " + k + " is a " + config[k].model));
    // " Date is: " + config[frame].trainingSet[10].input);
    // +
    // // + " " + config.trainingSet[0].input
    // );

    if (config[frame]) {
      console.log("Found: ", frame, " with ", config[frame].SN);
    } else {
      console.log("not found: ", frame);
    }

}

var readConfig = function(bucket, configfiles) {
  return Promise.all(configfiles.map(function(configfile) {
    var params = {
      Bucket: bucket,
      Key: configfile+'.json',
      ResponseContentType : 'application/json'
    };
    return s3.getObject(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
        // console.log("==============BAD=============");
      } else {
        // config[configfile] = JSON.parse(data.Body);
        config = JSON.parse(data.Body);
        // console.log("  - " + configfile + ": " + Object.keys(config).map(k => " " + k));
        // console.log("=============GOOD===============");
      }
    }).promise();
  }))
}
//          bucketname         file names
readConfig('supportpredictor', ["allData"]) // second parameter must be an array, even with one element
  .then(theRestOfLogic)
  .catch(console.error.bind(console));


  // var s3 = new AWS.S3({httpOptions: { timeout: 20000 }});
  // var params = {
  //   Bucket: 'supportpredictor',
  //   Key: 'knownFrames.json',
  //   ResponseContentType : 'application/json',
  // };
  //
  // var result = s3.getObject(params, function (err, data) {
  //   if (err) {
  //     console.log(err, err.stack);
  //     response.tell("Cannot find any frames, please try again later.");
  //   }
  //   else {
  //     knownFrames = JSON.parse(data.Body);
  //   }
  // });
