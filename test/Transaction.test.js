describe("Transaction", function() {
    before(function() {
        Transaction = lib.ethbase.Transaction;
    });

    beforeEach(function() {
        tx = Transaction({
            value: value,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            to: "a",
            data: data
        });
    });
    
    it("should return a new Transaction object", function () {
        expect(Transaction).to.be.a("function");
    });

    it("should take a parameter object {data, value, gasPrice, gasLimit, to}",
       function() {
           expect(tx.data).to.satisfy(function(d) {
               return d.equals(new Buffer(data, "hex"));
           });
           expect(tx.value).to.satisfy(function(val) {
               return Int(value).equals(Int(val));
           });
           expect(tx.gasPrice).to.satisfy(function(gp) {
               return Int(gasPrice).equals(Int(gp));
           });
           expect(tx.gasLimit).to.satisfy(function(gl) {
               return Int(gasLimit).equals(Int(gl));
           });
           expect(tx.to).to.satisfy(function(to) {
               return Address("a").equals(to);
           });
       });

    it("should provide defaults for {value, gasPrice, gasLimit}",
       function() {
           var tx = Transaction({
               data: data,
               to: "a"
           });
           expect(tx.value).to.satisfy(function(value) {
               return Int(value) == Transaction.defaults.value;
           });
           expect(tx.gasPrice).to.satisfy(function(gasPrice) {
               return Int(gasPrice) == Transaction.defaults.gasPrice;
           })
           expect(tx.gasLimit).to.satisfy(function(gasLimit) {
               return Int(gasLimit) == Transaction.defaults.gasLimit;
           });
       });

    it("should return an object with a method .send'", function() {
        expect(tx).to.have.property("send").which.is.a("function");
    });

    describe("the .send method", function() {
        function txResult(succeeded, created) {
            var success = "Success!"
            var failure = "Failed..."

            blockapps
                .filteringPath(/transactionResult\/[a-f0-9]*/, 'transactionResult')
                .get("/transactionResult")
                .reply(200, [{
                    "message": succeeded ? success : failure,
                    "transactionHash": "abcd",
                    "contractsCreated":
                    (created === undefined) ? "" : created.join(",")
                }]);
        }
        
        beforeEach(function() {
            blockapps
                .post("/transaction").reply(200)
                .get('/account')
                .query({address: addressFrom})
                .reply(200, [{
                    "balance": 0,
                    "address": addressFrom,
                    "code":"",
                    "nonce": 0
                }]);
        });

        afterEach(function() {
            nock.cleanAll();
        });

        it("should take a private key, returning a promise", function() {
            txResult(true);
            expect(tx.send(privkeyFrom)).to.have.property("then")
                .which.is.a("function");
        });
        it("should maybe also take an address, returning a promise", function() {
            txResult(true);
            expect(tx.send(privkeyFrom, addressTo)).to.have.property("then")
                .which.is.a("function");
        });
        it("return promise should be the transactionResult object", function() {
            var Promise = require("bluebird");
            var contractsCreated = ["a", "b"]
            txResult(true, contractsCreated);
            var txR = tx.send(privkeyFrom)
            return Promise.join(
                expect(txR).to.eventually.have.property("transactionHash"),
                expect(txR).to.eventually.have.property("contractsCreated")
                    .which.eqls(contractsCreated)
            );
        });
    });
});
