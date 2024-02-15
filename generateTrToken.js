// Documentation:
// https://www.twilio.com/docs/taskrouter/js-sdk-v1/workspace
//
console.log("+++ Start...");
const ACCOUNT_SID = process.env.TR_ACCOUNT_SID;
const ACCOUNT_AUTH_TOKEN = process.env.TR_AUTH_TOKEN;
const WORKSPACE_SID = process.env.WORKSPACE_SID;

// -------------------------------------------------------
const taskrouter = require('twilio').jwt.taskrouter;
const util = taskrouter.util;

// To set up environmental variables, see http://twil.io/secure
const accountSid = process.env.TR_ACCOUNT_SID;
const authToken = process.env.TR_AUTH_TOKEN;
const workspaceSid = process.env.WORKSPACE_SID;
console.log("+ accountSid   :" + accountSid + ":");
console.log("+ authToken    :" + authToken + ":");
console.log("+ workspaceSid :" + workspaceSid + ":");

const TASKROUTER_BASE_URL = 'https://taskrouter.twilio.com';
const version = 'v1';

// Helper function to create Policy
const Policy = taskrouter.TaskRouterCapability.Policy;
function buildWorkspacePolicy(options) {
    options = options || {};
    const resources = options.resources || [];
    const urlComponents = [
        TASKROUTER_BASE_URL,
        version,
        'Workspaces',
        workspaceSid
    ];
    console.log("+ urlComponents " + urlComponents.concat(resources).join('/') + " " + options.method);
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
// Event Bridge Policies
const eventBridgePolicies = util.defaultEventBridgePolicies(
        accountSid,
        workspaceSid
        );

const capability = new taskrouter.TaskRouterCapability({
    accountSid: accountSid,
    authToken: authToken,
    workspaceSid: workspaceSid,
    channelId: "WKb9302b30213ee6a76c10cf8b4cf94612" // workspaceSid
});
eventBridgePolicies.concat(workspacePolicies).forEach(policy => {
  capability.addPolicy(policy);
});

const token = capability.toJwt();

// eof