// Docs: https://www.twilio.com/docs/voice/api/queue-resource
console.log("++ Get voice queue list.");
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const client = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);

client.queues.list({
    limit: 20
}).then(queues => queues.forEach(q => {
        var si = q.dateCreated.toString().indexOf(' ') + 1;
        console.log('+ '
                + ' DateCreated:' + q.dateCreated.toString().substring(si, si + 12)
                + ' SID:' + q.sid
                + ' currentSize:' + q.currentSize + "   "
                + ' maxSize:' + q.maxSize
                + ' friendlyName:' + q.friendlyName
                + ' averageWaitTime:' + q.averageWaitTime
                );
    }));

