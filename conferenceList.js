console.log("+++ List conference calls.");
// https://www.twilio.com/docs/voice/api/conference-resource
// 
//          1         2         3         4         5
// 123456789012345678901234567890123456789012345678901234567890
// Thu Feb 15 2024 19:32:44 GMT-0800 (Pacific Standard Time)
//
var accountSid = process.env.TR_ACCOUNT_SID;
var authToken = process.env.TR_AUTH_TOKEN;
var client = require('twilio')(accountSid, authToken);
client.conferences.each({
    // friendlyName: 'support',
    // status: 'in-progress'
    // status: 'completed'
},
        conferences => {
            dateString = conferences.dateCreated;
            console.log("+ "
                    // + "+ dateCreated: " + dateString.getMonth()
                    + " SID: " + conferences.sid
                    + " status: " + conferences.status
                    + " friendlyName: " + conferences.friendlyName
                    );
        });