// Documentation:
// https://www.twilio.com/docs/taskrouter/api/task
// https://www.twilio.com/docs/taskrouter/api/reservations
//
console.log("+++ List tasks.");
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const trClient = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);
const WORKSPACE_SID = process.env.WORKSPACE_SID;

trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
        .tasks
        .list({limit: 20})
        .then(tasks => {
            tasks.forEach(t => {
                // Sample assignmentStatus: pending, assigned, canceled, wrapping.
                assignmentStatus = t.assignmentStatus;
                isWrapping = "";
                if (assignmentStatus === "wrapping") {
                    isWrapping = "-*";
                }
                console.log("++ "
                        + "SID: " + t.sid
                        + " assignmentStatus: " + t.assignmentStatus + isWrapping
                        + ", Queue:" + t.taskQueueFriendlyName
                        // + " attributes:" + t.attributes
                        );
            });
        });

// eof