/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/



'use strict';

var AlexaSkill = require('./AlexaSkill');
var Firebase = require('firebase');
var cardsets = new Firebase("https://quizlet.firebaseio.com/");

var correctAnswer;

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
        
        var whichCardSet = getRandomInt(0, cardsets.cardSetName.length());
        var whichCard = getRandomInt(0, cardsets.cardSetName[whichCardSet].terms.length);
        var whichAnswerCorrect = getRandomInt(0, 100);
        
        var choiceA, choiceB;
        
        if (whichAnswerCorrect%2 == 0)
        {
            choiceA = cardsets.cardSetName[whichCardSet].terms[whichCard].definition;
            correctAnswer = "a";
        }
        else
        {
            choiceA = cardsets.cardSetName[whichCardSet].terms[((whichCard + 1) > (cardsets.cardSetName[whichCardSet].terms.length - 1)) ? 0 : (whichCard + 1)].definition; //if i add and it exceeds the array limit, go down to zero.
        }
        if (whichAnswerCorrect%2 == 1)
        {
            choiceB = cardsets.cardSetName[whichCardSet].terms[whichCard].definition;
            correctAnswer = "b";
        }
        else
        {
            choiceB = cardsets.cardSetName[whichCardSet].terms[((whichCard + 1) > (cardsets.cardSetName[whichCardSet].terms.length - 1)) ? 0 : (whichCard + 1)].definition;
        }
        
        var term = cardsets.cardSetName[whichCardSet].terms[whichCard].term;     


        var speechOutput,
            repromptOutput;
        if (choiceA && choiceB) {
            speechOutput = {
                speech: "For the term " + term + " what is the correct definition? Is it A: " + choiceA + " or B: " + choiceB + " ?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptOutput = {
                speech: "Again, the term is " + term + " and the choices are A: " + choiceA + " or B: " + choiceB + " ?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.ask(speechOutput, repromptOutput);
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
    "PickAnswer": function (intent, session, response) {
         var answerChoices = intent.slots.Answer,
            currentChoice;
        if (answerChoices && answerChoices.value){
            currentChoice = answerChoices.value.toLowerCase();
        }
        
        var speechOutput;
        
        if (currentChoice == correctAnswer)
        {
            speechOutput = {
                speech: "Correct! Nice Job.",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
        }
        else
        {
             speechOutput = {
                speech: "Nope! Try again.",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
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
function getRandomInt(min, max) { //max value is excluded
  return Math.floor(Math.random() * (max - min)) + min;
}

exports.handler = function (event, context) {
    var quizlexa = new Quizlexa();
    quizlexa.execute(event, context);
};