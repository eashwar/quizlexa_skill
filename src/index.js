/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/



'use strict';

var AlexaSkill = require('./AlexaSkill');
var cardsets = require('./cardsets');

var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var Quizlexa = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Quizlexa.prototype = Object.create(AlexaSkill.prototype);
Quizlexa.prototype.constructor = Quizlexa;

Quizlexa.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to Quizlexa. You can ask for a card from any of the sets that you've added on your Android application.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

Quizlexa.prototype.intentHandlers = {
    "GetCardSet": function (intent, session, response) {
        var cardSlot = intent.slots.CardStack,
            cardSetName;
        if (cardSlot && cardSlot.value){
            cardSetName = cardSlot.value.toLowerCase();
        }

        var cardTitle = "Recipe for " + cardSetName,
            cardSet = cardsets[cardSetName],
            speechOutput,
            repromptOutput;
        if (cardSet) {
            speechOutput = {
                speech: cardSet,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.tellWithCard(speechOutput, cardTitle, cardSet);
        } else {
            var speech;
            if (cardSetName) {
                speech = "I'm sorry, I could not find a card set called " + cardSetName + ". What else can I help with?";
            } else {
                speech = "I'm sorry, I could not find a card set. What else can I help with?";
            }
            speechOutput = {
                speech: speech,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptOutput = {
                speech: "What else can I help with?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.ask(speechOutput, repromptOutput);
        }
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Thanks for using Quizlexa.";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Thanks for using Quizlexa.";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can ask for a card from a card set that you have added using the android app... Now, what can I help you with?";
        var repromptText = "You can ask for a card from a card set that you have added using the android app... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

exports.handler = function (event, context) {
    var quizlexa = new Quizlexa();
    quizlexa.execute(event, context);
};