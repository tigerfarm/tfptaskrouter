console.log("+++ Set a conference call's status to: completed.");
// https://www.twilio.com/docs/voice/api/conference-resource
// 
//          1         2         3         4         5
// 123456789012345678901234567890123456789012345678901234567890
// Thu Feb 15 2024 19:32:44 GMT-0800 (Pacific Standard Time)
//
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const trClient = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);

conferenceSid = "CF20dd0670c21ddb1684dbb51b83d5ce6a";
console.log("+ theConferenceSid: " + conferenceSid);
trClient.conferences(conferenceSid)
        .update({status: 'completed'})
        .then(conference =>
            console.log("++ Conference ended, set to completed: " + conference.friendlyName)
        );
