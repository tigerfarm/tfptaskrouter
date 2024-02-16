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
                            + " taskQueueFriendlyName:" + t.taskQueueFriendlyName
                            // + " attributes:" + t.attributes
                            );
                    printAttributes(t.attributes);
                }
                // console.log("++ attributes:" + t.attributes);
                reservationList(t.sid, t.taskQueueFriendlyName, t.assignmentStatus, isWrapping, t.attributes);
            });
        });
        
// Check if a task has any reservations.
function reservationList(taskSid, taskQueue, assignmentStatus, isWrapping, theAttributes) {
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .reservations
            .list({limit: 20})
            .then(reservation => {
                reservation.forEach(r => {
                    console.log("++"
                            + " SID: " + taskSid
                            + " assignmentStatus: " + assignmentStatus + isWrapping
                            + " Task Queue:" + taskQueue
                            + " Reservation sid:" + r.sid
                            + " workerName:" + r.workerName
                            );
                    printAttributes(theAttributes);
                });
            });
}

function printAttributes(theAttributes) {
                        console.log("+++ theAttributes"
                            + " from:" + JSON.parse(theAttributes).from
                            + " conference.sid:" + JSON.parse(theAttributes).conference.sid
                            + " worker:" + JSON.parse(theAttributes).conference.participants.worker
                            + " customer:" + JSON.parse(theAttributes).conference.participants.customer
                            );
}
// Sample task JSON attributes:
// {"from_country":"US","called":"+16505552222",
// "from":"+16508661111","direction":"inbound",
// "to":"+16505552222",
// "to_country":"US","to_city":"SAN BRUNO",
// "to_state":"CA","caller_country":"US","call_sid":"CA0e4f74c48a5551810b2f0ac8fb509c14","account_sid":"ACxxxxxxxxx","from_zip":"94030",
// "called_zip":"94030","caller_state":"CA","to_zip":"94030","called_country":"US","from_city":"SAN BRUNO","called_city":"SAN BRUNO","caller_zip":"94030","api_version":"2010-04-01","called_state":"CA","from_state":"CA","caller":"+16508661111","caller_city":"SAN BRUNO",
// "conference":{"sid":"CF7a96054293a6280bd244e9f4fa259e96",
// "participants":{"worker":"CA3e32fa5be1444eaff2685390fb410bec","customer":"CA0e4f74c48a5551810b2f0ac8fb509c14"}}}


// eof