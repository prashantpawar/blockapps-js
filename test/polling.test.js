describe("pollPromise", function() {
    before(function() {
        polling = lib.polling;
        pollPromise = require("../js/pollPromise");
    });
    beforeEach(function() {
        pollevery = lib.polling.pollEveryMS;
        timeout = lib.polling.pollTimeoutMS;
    });
    afterEach(function() {
        lib.polling.pollEveryMS = pollevery;
        lib.polling.pollTimeoutMS = timeout;
    })
    
    it("should poll", function() {
        var count = 0;
        function promise() {
            return new Promise(function(resolve, reject) {
                if (count < 2) {
                    ++count;
                    throw new pollPromise.NotDoneError;
                }
                return resolve("Success!");
            });
        }

        polling.pollEveryMS = 5;
        return expect(pollPromise(promise)).to.eventually.equal("Success!");
    });
    it("should respond to 'pollEveryMS'", function() {
        var done = false;
        var count = 0;
        function promise() {
            return new Promise(function(resolve, reject) {
                if (done) {
                    return resolve(count);
                }
                else {
                    ++count;
                    throw new pollPromise.NotDoneError;
                }
            });
        }

        function finish() {
            done = true;
        }

        
        polling.pollEveryMS = 5;
        var poll = pollPromise(promise);
        setTimeout(finish, 20);

        return expect(poll).to.eventually.be.within(3,5);
    });
    it("should respond to 'pollTimeoutMS'", function() {
        var done = [false, false];
        function promise(i) {
            return new Promise(function(resolve, reject) {
                if (done[i]) {
                    resolve("Success");
                }
                else {
                    throw new pollPromise.NotDoneError;
                }
            });
        }

        function finish(i) {
            done[i] = true;
        } 

        polling.pollEveryMS = 4
        polling.pollTimeoutMS = 20;
        
        setTimeout(finish.bind(null, 0), 15);
        var poll0 = pollPromise(promise.bind(null, 0));

        // setTimeout(finish.bind(null, 1), 25);
        // var poll1 = pollPromise(promise.bind(null, 1)).catch(
        //     Promise.TimeoutError, function() {
        //         return "Timed out";
        //     });

        return Promise.join(
            expect(poll0).to.eventually.equal("Success"),
            //expect(poll1).to.eventually.equal("Timed out"), 
            function() {}
        );
    });
});
