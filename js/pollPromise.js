var Promise = require('bluebird');

module.exports = pollPromise;

var defaults = {}

module.exports.defaults = defaults;

function pollPromise(promiseFn) {
    function doPoll() {
        return promiseFn().cancellable().
            catch(NotDoneError, function() {
                return Promise.resolve().delay(defaults.pollEveryMS).then(doPoll);
            });
    }
    
    return doPoll().timeout(defaults.pollTimeoutMS);
}

module.exports.NotDoneError = NotDoneError;
function NotDoneError(s, f, l) {
    this.name = "NotDoneError";
    this.message = s;
    Error.captureStackTrace(this, NotDoneError);
}
NotDoneError.prototype = Object.create(Error.prototype);
NotDoneError.prototype.constructor = NotDoneError;
