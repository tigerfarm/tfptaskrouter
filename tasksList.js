// Documentation:
// https://www.twilio.com/docs/taskrouter/api/task
// https://www.twilio.com/docs/taskrouter/api/reservations
//
console.log("+++ List tasks and their reservations(if any).");
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
                isWrapping = "";
                if (assignmentStatus === "wrapping") {
                    isWrapping = "-*";
                } else {
                    console.log("++ "
                            + "SID: " + t.sid
                            + " assignmentStatus: " + t.assignmentStatus
                            );
                }
                reservationList(t.sid, t.assignmentStatus, isWrapping);
            });
        });
        
// Check if a task has any reservations.
function reservationList(taskSid, assignmentStatus, isWrapping) {
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .reservations
            .list({limit: 20})
            .then(reservation => {
                reservation.forEach(r => {
                    console.log("++"
                            + " SID: " + taskSid
                            + " assignmentStatus: " + assignmentStatus + isWrapping
                            + " Reservation sid:" + r.sid
                            + " workerName:" + r.workerName
                            );
                });
            });
}

// eof