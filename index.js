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

var correctAnswer, whichCard, whichAnswerCorrect;

var qGen = false;
var prevqGen;

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
            var title, term, choiceA, choiceB;

            whichCard = getRandomInt(0, cardset.length);

            whichAnswerCorrect = getRandomInt(0, 100);

            if (whichAnswerCorrect % 2 == 0) {
                choiceA = cardset[whichCard].definition;
                choiceB = cardset[((whichCard + 1) > (cardset.length - 1)) ? 0 : (whichCard + 1)].definition;
                correctAnswer = "a";
            }
            else if (whichAnswerCorrect % 2 == 1) {
                choiceA = cardset[((whichCard + 1) > (cardset.length - 1)) ? 0 : (whichCard + 1)].definition; //if i add and it exceeds the array limit, go down to zero.
                choiceB = cardset[whichCard].definition;
                correctAnswer = "b";
            } else {
                choiceA = "I AM ERROR.";
                choiceB = "I AM BAGU."
                correctAnswer = "a";
            }

            console.log("ANSWER SET");
            title = cardset[whichCard].title;
            term = cardset[whichCard].term;

            questionOutput = {
                speech: "The name of the cardset is: " + title + ". The front of the card says: " + term + ". What's probably on the other side? Is it A: " + choiceA + " or B: " + choiceB + ". If you're unsure of your answer, say I don't know.",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptQuestion = {
                speech: "Again, the front says " + term + " and the choices are A: " + choiceA + " or B: " + choiceB,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            console.log("ASKING QUESTION NOT ERROR");

            response.ask(questionOutput, repromptQuestion);

            callback();
        }


        var questionOutput, repromptQuestion;

        if (cardsetTypes.indexOf(cardSetName) != -1) {
            Async.waterfall([
                setCardset,
                generateQuestion
            ], function () {
                qGen = !qGen;
            })
        }
        else {
            var speech;
            if (cardSetName) {
                speech = "I'm sorry, I couldn't find a card set called " + cardSetName + ". Please check the android app to ensure that you have added a set of that name. What else can I help you with?";
            } else {
                speech = "I'm sorry, I couldn't find a card set. Please check the android app to ensure that you have added a set. What else can I help you with?";
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

        console.log(correctAnswer);
        correctAnswer = (whichAnswerCorrect % 2 == 0) ? 'a' : 'b';

        var continuePrompt, repromptContinue;

        prevqGen = qGen;

        if (currentChoice == "i don't know") {
            continuePrompt = {
                speech: "Oh. That's too bad. You should've studied more. The correct answer was " + correctAnswer + ". Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            repromptContinue = {
                speech: "Do you want to continue?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            }
            response.ask(continuePrompt, repromptContinue);
        } else {

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