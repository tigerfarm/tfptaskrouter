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
console.log("+++ TaskRouter application web server is starting up.");
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

const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const WORKSPACE_SID = process.env.WORKSPACE_SID;
console.log("+ ACCOUNT_SID   :" + ACCOUNT_SID + ":");
console.log("+ WORKSPACE_SID :" + WORKSPACE_SID + ":");
//
const trClient = require('twilio')(ACCOUNT_SID, ACCOUNT_AUTH_TOKEN);
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
function generateToken(theIdentity, tokenPassword) {
    if (theIdentity === "") {
        console.log("- Required: user identity for creating a token.");
        return "";
    }
    if (tokenPassword === "") {
        console.log("- Required: tokenPassword");
        return "";
    }
    sayMessage("+ Generate token, ID: " + theIdentity);

    // Need to get the WORKER_SID from theIdentity. 
    var WORKER_SID = 'WKb9302b30213ee6a76c10cf8b4cf94612';

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
        buildWorkspacePolicy({resources: ['Workers', WORKER_SID, 'Reservations', '**'], method: 'POST'}),
        //
        // Should restrict the following,
        // however it allows the worker set themselves online and offline.
        buildWorkspacePolicy({resources: ['**'], method: 'POST'}),
    ];

    const capability = new taskrouter.TaskRouterCapability({
        accountSid: ACCOUNT_SID,
        authToken: ACCOUNT_AUTH_TOKEN,
        workspaceSid: WORKSPACE_SID,
        channelId: WORKER_SID
    });
    const eventBridgePolicies = util.defaultEventBridgePolicies(ACCOUNT_SID, WORKER_SID);
    const workerPolicies = util.defaultWorkerPolicies(version, WORKSPACE_SID, WORKER_SID);
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
        if (req.query.clientid) {
            res.send(generateToken(req.query.clientid, req.query.tokenPassword));
        } else {
            sayMessage("- Parameter required: clientid.");
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
