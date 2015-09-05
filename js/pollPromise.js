module.exports = pollPromise;

var defaults = {
    "pollEveryMS" : 500,
    "pollTimeoutMS" : 10000
}

module.exports.defaults = defaults;

function pollPromise(promiseFn) {
    function doPoll() {
        return promiseFn().delay(defaults.pollEveryMS).catch(NotDoneError, doPoll);
    }
    return promiseFn().catch(NotDoneError, doPoll).timeout(defaults.pollTimeoutMS);
}

module.exports.NotDoneError = NotDoneError;
function NotDoneError(s, f, l) {
    this.name = "NotDoneError";
    this.message = s;
    Error.captureStackTrace(this, NotDoneError);
}
NotDoneError.prototype = Object.create(Error.prototype);
NotDoneError.prototype.constructor = NotDoneError;
