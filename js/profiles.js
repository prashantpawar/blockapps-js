var ethValue = require("./Units.js").ethValue;
var polling = require("./pollPromise.js").defaults;
var txParams = require("./Transaction.js").defaults;
var query = require("./HTTPQuery.js").defaults;

module.exports = setProfile;
function setProfile(profName, version) {
    var profile = profiles[profName];

    query.serverURI = profile.serverURI;
    if (typeof version === "string" && version.match(/^[0-9]+\.[0-9]+$/)) {
        query.apiPrefix = "/eth/v" + version;
    }

    polling.pollEveryMS = profile.pollEveryMS;
    polling.pollTimeoutMS = profile.pollTimeoutMS;

    txParams.gasPrice = profile.gasPrice;
    txParams.gasLimit = profile.gasLimit;
}

var profiles = {
    "hacknet" :
    {
        "serverURI" : "http://hacknet.blockapps.net",
        "pollEveryMS" : 500,
        "pollTimeoutMS" : 10000,
        "gasPrice" : ethValue(1).in("wei"),
        "gasLimit" : 3141592
    },
    "ethereum":
    {
        "serverURI" : "http://api.blockapps.net",
        "pollEveryMS" : 1000,
        "pollTimeoutMS" : 30000,
        "gasPrice" : ethValue(1).in("szabo"),
        "gasLimit" : 1e6
    }
};
module.exports.profiles = profiles;
