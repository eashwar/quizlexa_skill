/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/



'use strict';

var AlexaSkill = require('./AlexaSkill');

var Firebase = require('firebase');

var Async = require('async');

var cardsets;

var cardsetGlobal;

var title, term, choiceA, choiceB, whichCard, whichAnswerCorrect, canAsk, questionOutput, repromptQuestion;

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
        if (cardSlot && cardSlot.value) {
            cardSetName = cardSlot.value.toLowerCase();
        }

        console.log("DEFINING CARDSETS");

        cardsets = new Firebase('https://quizlet.firebaseio.com/' + cardSetName + '/');

        console.log("GOING TO START CALLBACK STUFF");

        function setCardset(callback) {
            console.log("SETTING CARDSET");

            return cardsets.once("value").then(function (data) {
                var cardset = data.val();
                callback(null, cardset);
            });

        }

        function generateQuestion(cardset, callback) {
            console.log("CALLBACK FUNCTION CALLED")
            console.log(cardset.length)
            cardsetGlobal = cardset;
            whichCard = getRandomInt(0, cardset.length);
            whichAnswerCorrect = getRandomInt(0, 100);

            if (whichAnswerCorrect % 2 == 0) {
                choiceA = cardset[whichCard].definition;
                choiceB = cardset[((whichCard + 1) > (cardset.length - 1)) ? 0 : (whichCard + 1)].definition;
                correctAnswer = "a";
            }
            else {
                choiceA = cardset[((whichCard + 1) > (cardset.length - 1)) ? 0 : (whichCard + 1)].definition; //if i add and it exceeds the array limit, go down to zero.
                choiceB = cardset[whichCard].definition;
                correctAnswer = "b";
            }

            console.log("ANSWER SET");
            title = cardset[whichCard].title;
            term = cardset[whichCard].term;

            questionOutput = {
                speech: "The specific subject is: " + title + ". The front side of the card says: " + term + ". What is likely on the other side of the card? Is it A: " + choiceA + " or B: " + choiceB,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptQuestion = {
                speech: "Again, the front side is " + term + " and the choices are A: " + choiceA + " or B: " + choiceB,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            console.log("ASKING QUESTION NOT ERROR");

            response.ask(questionOutput, repromptQuestion);

            callback();
        }

        if (cardsetTypes.indexOf(cardSetName) != -1) {
            Async.waterfall([
                setCardset,
                generateQuestion
            ], function () {
                console.log("done")
            })
        }
        else {
            var speech;
            if (cardSetName) {
                speech = "I'm sorry, I could not find a card set called " + cardSetName + ". What else can I help with?";
            } else {
                speech = "I'm sorry, I could not find a card set. What else can I help with?";
            }
            questionOutput = {
                speech: speech,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptQuestion = {
                speech: "What else can I help with?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            console.log("ASKING ERROR QUESTION");
            response.ask(questionOutput, repromptQuestion);
        }
    },
    "PickAnswer": function (intent, session, response) {
        var answerSlot = intent.slots.Answer,
            currentChoice;
        if (answerSlot && answerSlot.value) {
            currentChoice = answerSlot.value.toLowerCase();
        }

        console.log(currentChoice);

        var continuePrompt, repromptContinue;

        if (currentChoice == correctAnswer) {
            continuePrompt = {
                speech: "Correct! Nice Job. Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            repromptContinue = {
                speech: "Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            response.ask(continuePrompt, repromptContinue);
        }
        else {
            continuePrompt = {
                speech: "Nope! You were incorrect. Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            repromptContinue = {
                speech: "Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            response.ask(continuePrompt, repromptContinue);
        }
    },
    "AMAZON.YesIntent": function (intent, session, response) {
        var speechOutput = {
            speech: "Okay. You can ask me for a card from any stack you have added using the android app.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        }
        var repromptText = {
            speech: "Okay. You can ask me for a card from any stack you have added using the android app.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        }
        response.ask(speechOutput, repromptText);
    },
    "AMAZON.NoIntent": function (intent, session, response) {
        var speechOutput = "Thanks for using Quizlexa.";
        response.tell(speechOutput);
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

var cardsetTypes =
    [
        'science',
        'chemistry',
        'biology',
        'physics',
        'philosophy',
        'social studies',
        'world history',
        'US history',
        'math',
        'geometry',
        'algebra',
        'calculus',
        'literature',
        'general',
        'hackathon'
    ]

exports.handler = function (event, context) {
    var quizlexa = new Quizlexa();
    quizlexa.execute(event, context);
};