console.log("+++ Set a conference call's status to: completed.");
// https://www.twilio.com/docs/voice/api/conference-resource
// 
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const trClient = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);

conferenceSid = "CFbe1c7137e028b6ed411fdd2aa12fbecb";
console.log("+ theConferenceSid: " + conferenceSid);
trClient.conferences(conferenceSid)
        .update({status: 'completed'})
        .then(conference =>
            console.log("++ Conference ended, set to completed: " + conference.friendlyName)
        ).catch(function (err) {
    console.error("- Error: " + err);
});
