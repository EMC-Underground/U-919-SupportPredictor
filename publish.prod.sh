#!/bin/bash

NAME=SupportPredictor
cd src
rm ${NAME}.zip
zip -Xrq ${NAME}.zip AlexaSkill.js index.js config.json node_modules/*
#zip -Xrq ${NAME}.zip -x \*.zip *
aws lambda update-function-code --function-name ${NAME} --zip-file fileb://${NAME}.zip
cd ..
