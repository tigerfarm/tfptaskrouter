// Documentation:
// https://www.twilio.com/docs/taskrouter/api/workspace
// https://www.twilio.com/docs/taskrouter/api/activity
// https://www.twilio.com/docs/taskrouter/api/worker
//
console.log("+++ List a workers data.");
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const trClient = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);
const workspaceSid = process.env.WORKSPACE_SID;

// Doesn't wait:
async function getWorkerSid(theIdentity) {
    var workerNameQuery = "`name IN ['" + theIdentity + "']}`";
    const response = await trClient.taskrouter.v1.workspaces(workspaceSid)
            .workers
            .list({targetWorkersExpression: workerNameQuery})
            .then(workers => workers.forEach(worker => {
                    theWorkerSid = worker.sid;
                    console.log("++ await Dave's data, "
                            + "SID: " + theWorkerSid
                            + " : " + worker.friendlyName
                            );
                }));
}
getWorkerSid("dave");

var WORKER_SID = 'WKb9302b30213ee6a76c10cf8b4cf94612';
var abc = trClient.taskrouter.v1.workspaces(workspaceSid)
        .workers(WORKER_SID)
        .fetch()
        .then(worker => console.log("++ SID: "
                    + worker.sid
                    + " : " + worker.friendlyName
                    ));

// Sample TaskRouter worker attributes: 
//  {"name":"dave","skills":["support"],"contact_uri":"+16505551111"}
var workerName = 'dave';
var workerNameQuery = "`name IN ['" + workerName + "']}`";
trClient.taskrouter.v1.workspaces(workspaceSid)
        .workers
        .list({targetWorkersExpression: workerNameQuery})
        .then(workers => workers.forEach(worker =>
                console.log("++ Dave's data, "
                        + "SID: " + worker.sid
                        + " : " + worker.friendlyName
                        )
            ));



// eof