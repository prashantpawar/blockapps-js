describe("pollPromise", function() {
    before(function() {
        polling = lib.polling;
        pollPromise = require("../js/pollPromise");
    });
    it("should poll", function() {
        var count = 0;
        var promise = new Promise(function(resolve, reject) {
            if (count < 5) {
                ++count;
                throw new pollPromise.NotDoneError;
            }
            return resolve("Success!");
        });
        expect(pollPromise(function() {return promise})).
            to.eventually.equal("Success!");
    });
    it("should respond to 'pollEveryMS'", function() {
        var done = [false, false];
        var counts = [0,0]
        function promise(i) {
            return new Promise(function(resolve, reject) {
                if (done[i]) {
                    return resolve(counts[i]);
                }
                else {
                    ++counts[i];
                    throw new pollPromise.NotDoneError;
                }
            });
        }

        function finish(i) {
            done[i] = true;
        }

        setTimeout(finish.bind(null, 1), 9000);
        var poll1 = pollPromise(promise.bind(null, 1));

        polling.pollEveryMS = 1500;
        var poll2 = pollPromise(promise.bind(null, 2));

        expect(poll1).to.eventually.be.within(16,20);
        expect(poll2).to.eventually.be.within(4,8);
    });
    it("should respond to 'pollTimeoutMS'", function() {
        var done = [false, false, false, false];
        function promise(i) {
            return new Promise(function(resolve, reject) {
                if (done[i]) {
                    return resolve("Success!");
                }
                else {
                    throw new pollPromise.NotDoneError;
                }
            });
        }

        function finish(i) {
            done[i] = true;
        }

        setTimeout(finish.bind(null, 1), 9000);
        var poll1 = pollPromise(promise.bind(null, 1));

        setTimeout(finish.bind(null, 2), 11000);
        var poll2 = pollPromise(promise.bind(null, 2));
        
        polling.pollTimeoutMS = 5000;
        setTimeout(finish.bind(null, 2), 4000);
        var poll3 = pollPromise(promise.bind(null, 3));

        setTimeout(finish.bind(null, 4), 6000);
        var poll4 = pollPromise(promise.bind(null, 4));

        expect(poll1).to.eventually.be.ok;
        expect(poll2).to.eventually.throw(Promise.TimeoutError);
        expect(poll3).to.eventually.be.ok;
        expect(poll4).to.eventually.throw(Promise.TimeoutError);
    });
});
