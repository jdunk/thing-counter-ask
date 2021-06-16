const Alexa = require('ask-sdk-core');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { functionName, awsRegion } = require('./config.js');

const client = new LambdaClient({ region: awsRegion });

const invokeLambda = async (params) => {
  return await client.send(new InvokeCommand({
    FunctionName: functionName,
    Payload: Buffer.from(JSON.stringify(params)),
  }));
};

const fixRawThingName = (rawStr) => {
  let thing = rawStr;

  if (thing.substr(0,4) === 'the ') {
    thing = thing.substr(4);
  }

  return thing;
}

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

const fetchCurrentTotal = async (thingName) => {
  return await invokeLambda({
    action: 'get',
    thing: thingName,
  });
};

const makeAddRequest = async (num, thingName) => {
  return await invokeLambda({
    action: 'add',
    thing: thingName,
    num,
  });
};

const GetIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetIntent';
  },
  async handle(handlerInput) {
    const thingName = fixRawThingName(handlerInput.requestEnvelope.request.intent.slots.countedThing.value);
    const resp = await fetchCurrentTotal(thingName);
    let speechText;

    const respDataStr = resp?.Payload && Buffer.from(resp?.Payload, 'base64').toString();
    let respData;

    try {
      respData = respDataStr && JSON.parse(respDataStr);
    }
    catch(e) {} // Handled below

    const respCount = respData?.body?.data?.count;

    if (!respCount && respCount !== 0) {
      speechText = 'An error occurred for the get intent. You may want to try again later.';
    }
    else {
      speechText = `The ${thingName} total is ${respCount}.`;
    }

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

    const respDataStr = resp?.Payload && Buffer.from(resp?.Payload, 'base64').toString();
    let respData;

    try {
      respData = respDataStr && JSON.parse(respDataStr);
    }
    catch(e) {} // Handled below

    const respCount = respData?.body?.data?.count;

    if (!respCount) {
      speechText = 'An error occurred for the add intent. You may want to try again later.';
    }
    else {
      speechText = `Done. The ${thingName} total is now ${respCount}.`;
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