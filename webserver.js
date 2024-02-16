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
var WORKSPACE_SID = process.env.WORKSPACE_SID;
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

    // Helper function to create Policy
    const Policy = taskrouter.TaskRouterCapability.Policy;
    function buildWorkspacePolicy(options) {
        options = options || {};
        const resources = options.resources || [];
        const urlComponents = [
            TASKROUTER_BASE_URL,
            version,
            'Workspaces',
            WORKSPACE_SID
        ];
        // console.log("+ urlComponents " + urlComponents.concat(resources).join('/') + " " + options.method);
        return new Policy({
            url: urlComponents.concat(resources).join('/'),
            method: options.method,
            allow: true
        });
    }
    const workspacePolicies = [
        // Workspace Policy
        buildWorkspacePolicy({resources: [], method: 'GET'}),
        // Workspace subresources fetch Policy
        buildWorkspacePolicy({resources: ['**'], method: 'GET'}),
        // Workspace resources update Policy
        buildWorkspacePolicy({resources: ['**'], method: 'POST'}),
        // Workspace resources delete Policy
        buildWorkspacePolicy({resources: ['**'], method: 'DELETE'}),
    ];
    const eventBridgePolicies = util.defaultEventBridgePolicies(
            ACCOUNT_SID,
            WORKSPACE_SID
            );
    const capability = new taskrouter.TaskRouterCapability({
        accountSid: ACCOUNT_SID,
        authToken: ACCOUNT_AUTH_TOKEN,
        workspaceSid: WORKSPACE_SID,
        channelId: "WKb9302b30213ee6a76c10cf8b4cf94612" // WORKSPACE_SID
    });
    eventBridgePolicies.concat(workspacePolicies).forEach(policy => {
        capability.addPolicy(policy);
    });

    const theToken = capability.toJwt();
    console.log("+ theToken: " + theToken);
    return(theToken);
}

// -----------------------------------------------------------------------------
// Sample call PHP program
function generateTokenPHP(res, theIdentity, tokenPassword) {
    if (theIdentity === "") {
        console.log("- Required: user identity for creating a token.");
        return "";
    }
    if (tokenPassword === "") {
        console.log("- Required: tokenPassword");
        return "";
    }
    console.log("++ Get Client token, ID: " + theIdentity);
    const exec = require('child_process').exec;
    const theProgramName = "generateTrToken.php";
    const theProgram = 'php ' + path.join(process.cwd(), theProgramName) + " " + theIdentity + " " + tokenPassword;
    exec(theProgram, (error, stdout, stderr) => {
        theResponse = `${stdout}`;
        console.log('+ theResponse: ' + theResponse);
        // console.log(`${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
        res.send(theResponse);
    });
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
function conferenceCompleted(conferenceName) {
    console.log("++ conferenceName=" + conferenceName);
    const exec = require('child_process').exec;
    const theProgramName = "conferenceCompleted.php";
    const theProgram = 'php ' + path.join(process.cwd(), theProgramName) + " " + conferenceName;
    exec(theProgram, (error, stdout, stderr) => {
        theResponse = `${stdout}`;
        console.log('+ theResponse: ' + theResponse);
        // console.log(`${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
        return(theResponse);
    });
}

app.get('/tfptaskrouter/conferenceCompleted', function (req, res) {
    sayMessage("+ conferenceCompleted: end a conference call.");
    if (req.query.conferenceName) {
        res.send(conferenceCompleted(req.query.conferenceName));
    } else {
        sayMessage("- Parameter required: conferenceName.");
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
