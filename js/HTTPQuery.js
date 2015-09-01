var request = require("request");
var request = Promise.promisify(require("bluebird"));

module.exports = HTTPQuery;
module.exports.defaults = {
    "apiPrefix" : "/eth/v1.0";
    "serverURI" : "http://hacknet.blockapps.net"
};

function HTTPQuery(queryPath, params) {
    var options = {
        "uri":exports.serverURI + exports.apiPrefix + arg.queryPath,
        "json":true
    };
    if (params.keys().length != 1) {
        throw "HTTPQuery(_, params): params must have exactly one field, the method get|post|data";
    }
    var method = params.keys()[0];
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
        throw "HTTPQuery(_, params): params must be of the form {get|post|data: {<name>: <value>, ..} }";
        break;
    }

    return request(options).spread(function(response, body) {return body;});
}
