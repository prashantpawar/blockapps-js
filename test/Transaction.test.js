describe("Transaction", function() {
    beforeEach(function() {
        tx = Transaction(txArgs);
    });
    after(function() {
        delete tx;
    });

    it("should take a parameter object {data, value, gasPrice, gasLimit, to}",
       function() {
           expect(tx.data).to.satisfy(function(d) {
               return (new Buffer(txArgs.data, "hex")).equals(d);
           });
           expect(tx.value).to.satisfy(function(val) {
               return Int(txArgs.value).equals(Int(val));
           });
           expect(tx.gasPrice).to.satisfy(function(gp) {
               return Int(txArgs.gasPrice).equals(Int(gp));
           });
           expect(tx.gasLimit).to.satisfy(function(gl) {
               return Int(txArgs.gasLimit).equals(Int(gl));
           });
           expect(tx.to).to.satisfy(function(to) {
               return Address(txArgs.to).equals(to);
           });
       });

    it("should provide defaults for {value, gasPrice, gasLimit}",
       function() {
           var tx = Transaction();
           expect(tx.value).to.satisfy(function(value) {
               return Int(value).equals(Int(txDefaults.value));
           });
           expect(tx.gasPrice).to.satisfy(function(gasPrice) {
               return Int(gasPrice).equals(Int(txDefaults.gasPrice));
           })
           expect(tx.gasLimit).to.satisfy(function(gasLimit) {
               return Int(gasLimit).equals(Int(txDefaults.gasLimit));
           });
       });

    it("should have 'send' and 'partialHash'", function() {
        expect('send' in tx).to.be.true;
        expect('partialHash' in tx).to.be.true;
    });

    describe("the .send method", function() {
        before(function() {
            privkeyFrom = txArgs.privkey;
        });
        after(function() {
            delete privkeyFrom;
        });

        it("should take a private key and address, returning a promise \
to the transactionResult object",
           function() {
               tx.nonce = 0;
               tx.from = address;
               tx.to = Address(0).toString();
               tx.sign(new Buffer(txArgs.privkey, "hex"));
               
               sendTXmock({
                   tx: tx,
                   txResult: {succeed: true, contractsCreated: ["a","b"]},
               });
               var txS = tx.send(privkeyFrom, 0);
               return Promise.join(
                   expect(txS).to.eventually.have.property("transactionHash"),
                   expect(txS).to.eventually.have.property("contractsCreated")
                       .which.eqls(["a", "b"]),
                   function() {}
               );
           }
        );
        it("second argument should override the 'to' parameter", function() {     
            sendTXmock({tx: txArgs, txResult: {succeed: true}});
            var p = tx.send(privkeyFrom, null);
            expect(tx.to).to.satisfy(function(to2) {
                return to2.equals(Address(0));
            });
            return p;
        });
        it("second argument should be optional if 'to' is passed initially",
           function() {
               sendTXmock({tx: txArgs, txResult: {succeed: true}});
               var txS = tx.send(privkeyFrom);
               return expect(txS).to.eventually.be.fulfilled;
           }
          );
    });
});
