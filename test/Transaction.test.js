describe("Transaction", function() {
    before(function() {
        Transaction = lib.ethbase.Transaction;
        Int = lib.ethbase.Int;
        Address = lib.ethbase.Address;
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
               return Int(value).equals(Int(Transaction.defaults.value));
           });
           expect(tx.gasPrice).to.satisfy(function(gasPrice) {
               return Int(gasPrice).equals(Int(Transaction.defaults.gasPrice));
           })
           expect(tx.gasLimit).to.satisfy(function(gasLimit) {
               return Int(gasLimit).equals(Int(Transaction.defaults.gasLimit));
           });
       });

    it("should return an object with a method .send'", function() {
        expect(tx).to.have.property("send").which.is.a("function");
    });

    describe("the .send method", function() {
        function setupTXMock(n,succeed, create) {
            var success = "Success!"
            var failure = "Failed..."

            blockapps
                .get('/account')
                .times(n)
                .query({address: addressFrom})
                .reply(200, [{"nonce": 0}]);
            blockapps
                .post("/transaction")
                .times(n)
                .reply(200);
            blockapps
                .filteringPath(/transactionResult\/[a-f0-9]*/, 'transactionResult')
                .get("/transactionResult")
                .times(n)
                .reply(200, function(uri) {
                    console.log(uri)
                    return [{
                        "message": succeed ? success : failure,
                        "transactionHash": uri.split('/').pop(),
                        "contractsCreated":
                        (created === undefined) ? "" : created.join(",")
                    }]
                });
            blockapps
                .filteringPath(/transaction\?hash=.*/, "transaction/hash")
                .get("/transaction/hash")
                .times(n)
                .reply(200, {})
        }
        
        afterEach(function() {
            nock.cleanAll();
        });

        // it("should take a private key, returning a promise", function() {
        //     setupTXMock(1,true);
        //     txS = tx.send(privkeyFrom)
        //     expect(txS).to.have.property("then").which.is.a("function");
        // });
        // it("should maybe also take an address, returning a promise", function() {
        //     setupTXMock(1,true);
        //     expect(tx.send(privkeyFrom, addressTo)).to.have.property("then")
        //         .which.is.a("function");
        // });
        it("return promise should be the transactionResult object", function() {
            nock('http://hacknet.blockapps.net:80')
                .get('/eth/v1.0/account')
                .query({"address":"e1fd0d4a52b75a694de8b55528ad48e2e2cf7859"})
                .reply(200, [{"nonce":1881}]);

            nock('http://hacknet.blockapps.net:80')
                .post('/eth/v1.0/transaction', {"nonce":1881,"gasPrice":11,"gasLimit":123456,"value":"1000000000000000000","codeOrData":"abcd","from":"e1fd0d4a52b75a694de8b55528ad48e2e2cf7859","to":"000000000000000000000000000000000000000a","r":"015571b643f9e53cfd04449bad369f938266792ed7ac4ddfe158f888e1c75f99","s":"375329a297a2f1d6bdf616608092604bba4fb33d3a4284477d163a012ae3def4","v":"1c","hash":"c6edd25c76947b5809466b28a8425c1886b84f09d5b65656c687583c998a4d96"})
                .reply(200, "c6edd25c76947b5809466b28a8425c1886b84f09d5b65656c687583c998a4d96");

            nock('http://hacknet.blockapps.net:80')
                .get('/eth/v1.0/transactionResult/c6edd25c76947b5809466b28a8425c1886b84f09d5b65656c687583c998a4d96')
                .reply(200, [{"transactionHash":"c6edd25c76947b5809466b28a8425c1886b84f09d5b65656c687583c998a4d96","message":"Success!","contractsCreated":"a,b"}]);

            var txR = tx.send(privkeyFrom)
            return Promise.join(
                expect(txR).to.eventually.have.property("transactionHash"),
                expect(txR).to.eventually.have.property("contractsCreated")
                    .which.eqls(["a", "b"])
            );
        });
        // it("second argument should override the 'to' parameter", function() {
        //     setupTXMock(2,true);
        //     blockapps.post("/transaction").reply(200);
        //     var txR = Transaction().send(privkeyFrom);
        //     var txR2 = Transaction().send(privkeyFrom, addressTo);
        //     return Promise.join(
        //         function(hash1, hash2) {
        //             if (hash1 == hash2) {
        //                 throw Error("transactions do not differ")
        //             }
        //         }
        //     );
        // });
    });
});
