#!/bin/bash

NAME=tryS3
cd src
zip -Xrq ${NAME}.zip AlexaSkill.js index.js config.json node_modules/*
#zip -Xrq ${NAME}.zip -x \*.zip *
aws lambda update-function-code --function-name ${NAME} --zip-file fileb://${NAME}.zip
rm ${NAME}.zip
cd ..
