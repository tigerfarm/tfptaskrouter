// -----------------------------------------------------------------------------
// TaskRouter web server
// 
// Easy to use.
// Install modules.
//  $ npm install --save express
//  $ npm install --save twilio
//  
// Run the web server. Default port is hardcoded to 8000.
//  $ node websever.js
// 
// -----------------------------------------------------------------------------
console.log("+++ TaskRouter application web server is starting up, version 4.0.");
// -----------------------------------------------------------------------------
// 
var makeRequest = require('request');
// 
// -----------------------------------------------------------------------------
// $ npm install express --save
const express = require('express');
const path = require('path');
const url = require("url");
// When deploying to Heroku, must use the keyword, "PORT".
// This allows Heroku to override the value and use port 80. And when running locally can use other ports.
const PORT = process.env.PORT || 8000;
var app = express();
//
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// TaskRouter

const taskrouter = require('twilio').jwt.taskrouter;
const util = taskrouter.util;

// TaskRouter worker application password to obtain an access token.
const TR_TOKEN_PASSWORD = process.env.TR_TOKEN_PASSWORD;

const TR_ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const TR_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const WORKSPACE_SID = process.env.WORKSPACE_SID;
console.log("+ TR_ACCOUNT_SID   :" + TR_ACCOUNT_SID + ":");
console.log("+ WORKSPACE_SID :" + WORKSPACE_SID + ":");
//
const trClient = require('twilio')(TR_ACCOUNT_SID, TR_AUTH_TOKEN);
// Test that the TaskRouter API is working:
trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
        .fetch()
        .then(workspace => {
            console.log("+ Workspace friendlyName: " + workspace.friendlyName);
        });

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
var returnMessage = '';
function sayMessage(message) {
    returnMessage = returnMessage + message + "<br>";
    console.log(message);
}

// -----------------------------------------------------------------------------
// tfptaskrouter: Twilio Conversations functions
// -----------------------------------------------------------------------------
// 
// -----------------------------------------------------------------------------
// Generate a worker's TaskRouter token
// Documentation: https://www.twilio.com/docs/taskrouter/js-sdk-v1/workspace

const TASKROUTER_BASE_URL = 'https://taskrouter.twilio.com';
const version = 'v1';
function generateToken(workerSid, tokenPassword) {
    sayMessage("+ Generate token, workerSid: " + workerSid);

    // Helper function to create Policy
    function buildWorkspacePolicy(options) {
        options = options || {};
        var resources = options.resources || [];
        var urlComponents = [TASKROUTER_BASE_URL, version, 'Workspaces', WORKSPACE_SID]
        return new taskrouter.TaskRouterCapability.Policy({
            url: urlComponents.concat(resources).join('/'),
            method: options.method || 'GET',
            allow: true
        });
    }
    // Event Bridge Policies
    // Worker Policies
    const workspacePolicies = [
        // Workspace fetch Policy
        buildWorkspacePolicy(),
        // Workspace subresources fetch Policy
        buildWorkspacePolicy({resources: ['**']}),
        // Workspace Activities Update Policy
        buildWorkspacePolicy({resources: ['Activities'], method: 'POST'}),
        // Workspace Activities Worker Reserations Policy
        buildWorkspacePolicy({resources: ['Workers', workerSid, 'Reservations', '**'], method: 'POST'}),
        //
        // Should restrict the following,
        // however it allows the worker set themselves online and offline.
        buildWorkspacePolicy({resources: ['**'], method: 'POST'}),
    ];

    const capability = new taskrouter.TaskRouterCapability({
        accountSid: TR_ACCOUNT_SID,
        authToken: TR_AUTH_TOKEN,
        workspaceSid: WORKSPACE_SID,
        channelId: workerSid
    });
    const eventBridgePolicies = util.defaultEventBridgePolicies(TR_ACCOUNT_SID, workerSid);
    const workerPolicies = util.defaultWorkerPolicies(version, WORKSPACE_SID, workerSid);
    eventBridgePolicies.concat(workerPolicies).concat(workspacePolicies).forEach(function (policy) {
        capability.addPolicy(policy);
    });

    const theToken = capability.toJwt();
    console.log("+ theToken: " + theToken);
    return(theToken);
}

// -----------------------------------------------------------------------------
// Web server interface to call functions.
// 
// -----------------------------------------------------------------------------
app.get('/tfptaskrouter/generateToken', function (req, res) {
    sayMessage("+ Generate Token.");
    if (req.query.tokenPassword) {
        theTokenPassword = req.query.tokenPassword;
        if (theTokenPassword === TR_TOKEN_PASSWORD) {
            if (req.query.clientid) {
                theClientid = req.query.clientid;
                var workerNameQuery = "`name IN ['" + theClientid + "']}`";
                trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
                        .workers
                        .list({targetWorkersExpression: workerNameQuery})
                        .then(workers => workers.forEach(worker => {
                                workerSid = worker.sid;
                                console.log("++ workerSid: " + workerSid);
                                res.send(generateToken(workerSid, theTokenPassword));
                            }));
            } else {
                sayMessage("- Parameter required: clientid.");
                res.sendStatus(502);
            }
        } else {
            sayMessage("- Required, valid: tokenPassword.");
            res.sendStatus(502);
        }
    } else {
        sayMessage("- Parameter required: tokenPassword.");
        res.sendStatus(502);
    }
});

// -----------------------------------------------------------------------------
var arrayActivities = [];
var theFriendlyName = "";
var theList = "";
app.get('/tfptaskrouter/getTrActivites', function (req, res) {
    sayMessage("+ getTrActivites for WORKSPACE_SID: " + WORKSPACE_SID);
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .fetch()
            .then(workspace => {
                theFriendlyName = workspace.friendlyName;
                console.log("+ workspace friendlyName: " + theFriendlyName);
                theList = theFriendlyName + ":workspacefriendlyname";
                trClient.taskrouter.v1
                        .workspaces(WORKSPACE_SID).activities.list()
                        .then((activities) => {
                            console.log("++ Load workspace activies.");
                            activities.forEach((activity) => {
                                // console.log("+ SID: " + activity.sid + " : " + activity.friendlyName);
                                arrayActivities.push([activity.sid, activity.friendlyName]);
                                theList = theList + ":" + activity.sid + ":" + activity.friendlyName;
                            });
                            console.log(theList);
                            res.send(theList);
                        });
            });
});

// -----------------------------------------------------------------------------
function taskSetCompleted(taskSid) {
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .update({
                assignmentStatus: 'completed',
                reason: 'Status was "wrapping", changed to: "completed".'
            })
            .then(task => console.log("+++ Task set to status: " + task.assignmentStatus));
}
function taskSetWrapToCompleted(taskSid) {
    console.log("++ taskSid=" + taskSid);
    trClient.taskrouter.v1.workspaces(WORKSPACE_SID)
            .tasks(taskSid)
            .fetch()
            .then(task => {
                assignmentStatus = task.assignmentStatus;
                console.log("++ "
                        + "SID: " + task.sid
                        + " assignmentStatus: " + assignmentStatus
                        + " taskQueueFriendlyName: " + task.taskQueueFriendlyName
                        );
                if (assignmentStatus === "wrapping") {
                    taskSetCompleted(task.sid);
                    console.log("++ Task set to completed.");
                    return("++ Task set to completed.");
                }
            });
}

app.get('/tfptaskrouter/taskSetWrapToCompleted', function (req, res) {
    sayMessage("+ Change task status from 'wrapping' to 'completed'.");
    if (req.query.taskSid) {
        res.send(taskSetWrapToCompleted(req.query.taskSid));
    } else {
        sayMessage("- Parameter required: taskSid.");
        res.sendStatus(502);
    }
});

// -----------------------------------------------------------------------------
function conferenceCompleted(conferenceSid) {
    console.log("++ conferenceName=" + conferenceSid);
    trClient.conferences(conferenceSid)
            .update({status: 'completed'})
            .then(conference => {
                console.log("++ Conference ended, set to completed: " + conference.friendlyName);
                return("++ Conference ended");
            });
}

app.get('/tfptaskrouter/conferenceCompleted', function (req, res) {
    sayMessage("+ Received a request to end a conference call.");
    if (req.query.conferenceSid) {
        res.send(conferenceCompleted(req.query.conferenceSid));
    } else {
        sayMessage("- Parameter required: conferenceSid.");
        res.sendStatus(502);
    }
});

// -----------------------------------------------------------------------------
// Web server basics
// -----------------------------------------------------------------------------

app.get('/hello', function (req, res) {
    res.send('+ hello there.');
});
// -----------------------------------------------------------------------------
app.use(express.static('docroot'));
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('HTTP Error 500.');
});
app.listen(PORT, function () {
    console.log('+ Listening on port: ' + PORT);
});
