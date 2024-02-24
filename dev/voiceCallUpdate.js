// Docs:
// https://www.twilio.com/docs/voice/api/call-resource?code-sample=code-update-a-call-in-progress-with-url&code-language=Node.js&code-sdk-version=4.x
//
console.log("++ Update/Modify a voice call in-progress.");
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const client = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);

client.calls('CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      .update({method: 'POST', url: 'http://demo.twilio.com/docs/voice.xml'})
      .then(call => console.log('+ ' + call.to));

