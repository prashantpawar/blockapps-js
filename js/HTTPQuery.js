var Promise = require("bluebird");
var request = Promise.promisify(require("request"));

module.exports = HTTPQuery;
module.exports.apiPrefix = "/eth/v1.0";
module.exports.serverURI = "http://hacknet.blockapps.net";

function HTTPQuery(queryPath, params) {
    var options = {
        "uri":module.exports.serverURI + module.exports.apiPrefix + queryPath,
        "json":true
    };
    if (Object.keys(params).length != 1) {
        throw "HTTPQuery(_, params): params must have exactly one field, " +
            "the method get|post|data";
    }
    var method = Object.keys(params)[0];
    switch (method) {
    case "get":
        options.method = "GET";
        options.qs = params.get;
        break;
    case "post":
        options.method = "POST";
        options.form = params.post;
        break;
    case "data":
        options.method = "POST";
        options.body = params.data;
        break;
    default:
        throw "HTTPQuery(_, params): params must be of the form " +
            "{get|post|data: {<name>: <value>, ..} }";
        break;
    }

    return request(options).spread(function(response, body) {return body;});
}
