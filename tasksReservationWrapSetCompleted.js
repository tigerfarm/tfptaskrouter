// Documentation:
// https://www.twilio.com/docs/taskrouter/api/task
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
                assignmentStatus = t.assignmentStatus;
                console.log("++ "
                        + "SID: " + t.sid
                        + " assignmentStatus: " + t.assignmentStatus
                        );
                if (assignmentStatus === "wrapping") {
                    console.log("++ Set task to completed.");
                    taskSetStatus(t.sid, 'completed');
                }
            });
        });

function taskSetStatus(taskSid, theStatus) {
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .update({
                assignmentStatus: theStatus,
                reason: 'Was stuck in wrapping'
            })
            .then(task => console.log("+++ Task status set: " + task.assignmentStatus));
}
// eof