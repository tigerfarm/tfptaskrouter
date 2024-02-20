// Documentation:
// https://www.twilio.com/docs/taskrouter/api/task
//
console.log("+++ List and delete all tasks.");
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
                taskDelete(t.sid, t.assignmentStatus);
            });
        });

function taskDelete(taskSid, assignmentStatus) {
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .remove()
            .then(task => console.log("++ Task assignment: " + assignmentStatus + ", deleted: " + taskSid));
}
// eof