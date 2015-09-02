var Promise = require('bluebird');

module.exports = pollPromise;
function pollPromise(promiseFn) {
    function pollFn() {
        return promiseFn().delay(exports.pollEveryMS).then(pollFn);
    }
    return pollFn().timeout(exports.polTimeoutMS);
}

module.exports.pollEveryMS = 500;
module.exports.pollTimeoutMS = 10000;
