const http = require('http');

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hello World!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const fetchCurrentTotal = (countedThingName) => {
  return new Promise((resolve, reject) => {

    const req = http.get(`http://jdunk.com:2001/get/${countedThingName}`, (resp) => {
      let respBody = '';

      resp.on('data', d => {
        respBody += d;
      });
      resp.on('end', () => {
        resolve(respBody);
      });
    });

    req.on('error', error => {
      console.error(error);
      reject(error);
    });

    req.end();
  });
};

const makeAddRequest = (num, countedThingName) => {
  return new Promise((resolve, reject) => {

    const req = http.get(`http://jdunk.com:2001/add/${num}/${countedThingName}`, (resp) => {
      let respBody = '';

      resp.on('data', d => {
        respBody += d;
      });
      resp.on('end', () => {
        resolve(respBody);
      });
    });

    req.on('error', error => {
      console.error(error);
      reject(error);
    });

    req.end();
  });
};

const GetIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetIntent';
  },
  async handle(handlerInput) {
    const thingName = handlerInput.requestEnvelope.request.intent.slots.countedThing.value;
    const resp = await fetchCurrentTotal(thingName);
    let objResp;
    let speechText;

    if (!resp || ! (objResp = JSON.parse(resp)) || ! ('count' in objResp)) {
      speechText = 'An error was encountered. Please try again later.';
    }
    else {
      speechText = `The current ${thingName} total is ${objResp.count}`;
    }

console.log({ resp: JSON.parse(resp) });

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Get current total', speechText)
      .getResponse();
  }
};

const returnErrorResponse = (handlerInput, errMsg) => {
    return handlerInput.responseBuilder
      .speak(errMsg)
      .withSimpleCard(errMsg, speechText)
      .getResponse();
};

const AddIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddIntent';
  },
  async handle(handlerInput) {
    const whatToAdd = handlerInput.requestEnvelope.request.intent.slots.whatToAdd.value;
    const indexOfSpace = whatToAdd.indexOf(' ');

    if (indexOfSpace === -1) {
      // Only "add X" (where X is just 1 word) was spoken/heard
      return returnErrorResponse(handlerInput, 'This command requires both a number and what to count. For example, add 50 jumping jacks.');
    }

    const num = whatToAdd.substr(0, indexOfSpace);
    const thingName = whatToAdd.substr(indexOfSpace + 1);

    const resp = await makeAddRequest(num, thingName);

    let objResp;
    let speechText;

    if (!resp || ! (objResp = JSON.parse(resp)) || ! ('count' in objResp)) {
      speechText = 'An error occurred. Please try again later.';
    }
    else {
      speechText = `Done. The ${thingName} total is now ${objResp.count}`;
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Add intent detected', speechText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloWorldIntentHandler,
    GetIntentHandler,
    AddIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .lambda();