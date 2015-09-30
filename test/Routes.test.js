describe("Routes", function() {
    before(function() {
        routes = lib.routes;
    });

    describe("'solc' route", function() {
        before(function() {
            code = "                 \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
            solc = routes.solc;
        });
        beforeEach(function() {
            solcMock = blockapps.post("/solc");
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts strings and only strings, returning a promise", function() {
            expect(solc(code)).has.property("then").which.is.a("function");
            var solcThrow = solc.bind(null, ["not", "a", "string"]);
            expect(solcThrow).to.throw(Error);
        });
        it("compiles a valid contract", function() {
            solcMock.reply(200, {
                "contracts" : [{"name" : "C", "bin" : "60006c"}],
                "xabis" : { "C" : {"x" : {}, "f" : {} } }
            });
            var codeSolc = solc(code);
            return Promise.join(
                expect(codeSolc).is.eventually.ok,
                expect(codeSolc).to.eventually.have.property("vmCode")
                    .which.equals("60006c"),
                expect(codeSolc).to.eventually.have.property("symTab")
                    .which.eqls({"x": {}, "f": {}}),
                expect(codeSolc).to.eventually.have.property("name")
                    .which.equals("C"),
                function() {}
            );
        });
        it("rejects code with multiple contracts", function() {
            solcMock.reply(200, {
                "contracts" : [
                    {"name" : "C", "bin" : "60006c"},
                    {"name" : "D", "bin" : "60006c"}
                ],
                "xabis" : {
                    "C" : {"x" : {}, "f" : {} },
                    "D" : {"x" : {}, "f" : {} }
                }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeSolc = solc(code).catch(function(){}).then;
            return expect(codeSolc).to.throw(Error);
        });
        it("handles compilation errors", function() {
            solcMock.reply(200, {
                "error" : "Compilation failed"
            });
            var codeSolc = solc("").catch(function(){}).then;
            return expect(codeSolc).to.throw(Error);
        });
    });

    describe("'extabi' route", function() {

        before(function() {
            code = "                 \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
            extabi = routes.extabi;
        });
        beforeEach(function() {
            extabiMock = blockapps.post("/extabi");
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts strings and only strings, returning a promise", function() {
            expect(extabi(code)).has.property("then").which.is.a("function");
            var extabiThrow = extabi.bind(null, ["not", "a", "string"]);
            expect(extabiThrow).to.throw(Error);
        });
        it("parses a valid contract", function() {
            extabiMock.reply(200, {
                "C" : {"x" : {}, "f" : {} }
            });
            var codeExtabi = extabi(code);
            expect(codeExtabi).to.eventually.have.property("C");
        });
        it("rejects code with multiple contracts", function() {
            extabiMock.reply(200, {
                "C" : {"x" : {}, "f" : {} },
                "D" : {"x" : {}, "f" : {} }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeExtabi = extabi(code).catch(function(){}).then;
            return expect(codeExtabi).to.throw(Error);
        });
    });

    describe("'faucet' route", function() {
        before(function() {
            faucet = routes.faucet;
        });
        beforeEach(function() {
            pollevery = lib.polling.pollEveryMS;
            timeout = lib.polling.pollTimeoutMS;
        });
        afterEach(function() {
            lib.polling.pollEveryMS = pollevery;
            lib.polling.pollTimeoutMS = timeout;
            nock.cleanAll();
        });
        it("accepts an address", function() {
            expect(faucet(address)).to.be.ok;
            expect(faucet(1)).to.be.ok;
            expect(faucet("a")).to.be.ok;
            expect(faucet(lib.ethbase.Address(address))).to.be.ok
        });
        it("POSTs to /faucet", function() {
            blockapps.get("/account").query({"address":address}).reply(200, [{}]);
            blockapps.post("/faucet").reply(200, "Success!");
            return expect(faucet(address).return(true)).to.eventually.be.ok
        });
        it("Handles timeouts", function() {
            blockapps.get("/account").query({"address":address}).reply(200, []);
            blockapps.post("/faucet").reply(200, "Success!");
            lib.polling.pollEveryMS = 10;
            var f = faucet(address).catch(function() {
                return function() {throw new Error;}
            });
            return Promise.join(
                expect(f).to.eventually.throw(Error),
                expect(f).to.eventually.not.throw(Promise.TimeoutError),
                function(){}
            );
        });
    });

    describe("'login' route", function() {
        before(function() {
            login = routes.login;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts only {email, app, loginpass} and an address", function() {
            expect(login({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            }, address)).to.be.ok;
            // expect(login({
            //     "emai1": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "loginpass": "password"
            // }, address)).to.not.be.ok;
            // expect(login({
            //     "email": "ryan.reich@gmail.com",
            //     "4pp": "bloc",
            //     "loginpass": "password"
            // }, address)).to.not.be.ok;
            // expect(login({
            //     "email": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "loginpas$": "password"
            // }, address)).to.not.be.ok;
            expect(login.bind(null,{
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            },"address")).to.throw(Error);
            expect(login.bind(null,address, {
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            })).to.throw(Error);
        });
        it("POSTs to /login", function() {
            blockapps.post("/login").reply(200, "Success!");
            return expect(login({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            }, address)).to.eventually.be.ok;
        });
    });
    describe("'wallet' route", function() {
        before(function() {
            wallet = routes.wallet;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts only {email, app, loginpass} and a key", function() {
            expect(wallet({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "walletpass": "password"
            }, privkeyFrom)).to.be.ok;
            // expect(wallet({
            //     "emai1": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "walletpass": "password"
            // }, address)).to.not.be.ok;
            // expect(wallet({
            //     "email": "ryan.reich@gmail.com",
            //     "4pp": "bloc",
            //     "walletpass": "password"
            // }, address)).to.not.be.ok;
            // expect(wallet({
            //     "email": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "walletpas$": "password"
            // }, address)).to.not.be.ok;
            expect(wallet.bind(null,{
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "walletpass": "password"
            },"address")).to.throw(Error);
            expect(wallet.bind(null,privkeyFrom, {
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "walletpass": "password"
            })).to.throw(Error);
        });
        it("POSTs to /wallet", function() {
            blockapps.post("/wallet").reply(200, "Success!");
            return expect(wallet({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            }, privkeyFrom)).to.eventually.be.ok;
        });
    });
    describe("'developer' route", function() {
        before(function() {
            developer = routes.developer;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts only {email, app, loginpass}", function() {
            expect(developer({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "developerpass": "password"
            })).to.be.ok;
            // expect(developer({
            //     "emai1": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "developerpass": "password"
            // }, address)).to.not.be.ok;
            // expect(developer({
            //     "email": "ryan.reich@gmail.com",
            //     "4pp": "bloc",
            //     "developerpass": "password"
            // }, address)).to.not.be.ok;
            // expect(developer({
            //     "email": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "developerpas$": "password"
            // }, address)).to.not.be.ok;
            expect(developer.bind(
                null, '\
{"email": "ryan.reich@gmail.com", "app": "bloc", "developerpass": "password"}'
            )).to.throw(Error);
        });
        it("POSTs to /developer", function() {
            blockapps.post("/developer").reply(200, "Success!");
            return expect(developer({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            })).to.eventually.be.ok;
        });
    });
    describe("'register' route", function() {
        before(function() {
            register = routes.register;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts only {email, app, loginpass} and a key", function() {
            expect(register({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "registerpass": "password"
            }, {
                "developer": "Ryan Reich",
                "appurl": "ryancreich.info",
                "repourl": "https://github.com/blockapps/bloc"
            })).to.be.ok;
            // expect(register({
            //     "emai1": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "registerpass": "password"
            // }, address)).to.not.be.ok;
            // expect(register({
            //     "email": "ryan.reich@gmail.com",
            //     "4pp": "bloc",
            //     "registerpass": "password"
            // }, address)).to.not.be.ok;
            // expect(register({
            //     "email": "ryan.reich@gmail.com",
            //     "app": "bloc",
            //     "registerpas$": "password"
            // }, address)).to.not.be.ok;
            expect(register.bind(
                null,
'{"email": "ryan.reich@gmail.com", "app": "bloc", "registerpass": "password"}',
'{"developer": "Ryan Reich", "appurl": "ryancreich.info", \
"repourl": "https://github.com/blockapps/bloc"}'
            )).to.throw(Error);
        });
        it("POSTs to /register", function() {
            blockapps.post("/register").reply(200, "Success!");
            return expect(register({
                "email": "ryan.reich@gmail.com",
                "app": "bloc",
                "loginpass": "password"
            }, {
                "developer": "Ryan Reich",
                "appurl": "ryancreich.info",
                "repourl": "https://github.com/blockapps/bloc"
            })).to.eventually.be.ok;
        });
    });
    describe("'block' route", function() {
        before(function() {
            block = routes.block;
            queryObj = {"address" : address}
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should accept a query object and nothing else", function() {
            expect(block({"address" : address})).to.be.ok;
            expect(block.bind(null,address)).to.throw(Error);
        });
        it("GETs from /block, returning a list", function() {
            blockapps.get("/block").query(queryObj).reply(200, [{}]);
            return expect(block(queryObj)).to.eventually.be.ok;
        });
        it("should handle empty list replies", function() {
            blockapps.get("/block").query(queryObj).reply(200, []);
            var query = block(queryObj).catch(
                Error, function() {return "NotDoneError";}
            );
            return expect(query).to.eventually.equal("NotDoneError");
        });
    });
    describe("'blockLast' route", function() {
        before(function() {
            blockLast = routes.blockLast;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should take a number", function() {
            expect(blockLast(1)).to.be.ok;
        });
        it("should round up its argument", function() {
            blockapps.get("/block/last/1").times(2).reply(200, "Success!");
            return Promise.join(
                expect(blockLast(1)).to.eventually.equal("Success!"),
                expect(blockLast(0.5)).to.eventually.equal("Success!"),
                function(){}
            );
        });
        it("should reject nonpositive arguments", function() {
            expect(blockLast.bind(null,0)).to.throw(Error);
            expect(blockLast.bind(null,-1)).to.throw(Error);
        });
        it("should query /block/last/", function() {
            blockapps.get("/block/last/1").reply(200, "Success!");
            return expect(blockLast(1)).to.eventually.be.ok;
        })
    });
    describe("'account' route", function() {
        before(function() {
            account = routes.account;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should accept a query object and nothing else", function() {
            expect(account({"address" : address})).to.be.ok;
            expect(account.bind(null,address)).to.throw(Error);
        });
        it("GETs from /account, returning a list", function() {
            blockapps.get("/account").query(queryObj).reply(200, [{}]);
            return expect(account(queryObj)).to.eventually.be.ok;
        });
        it("should handle empty list replies", function() {
            blockapps.get("/account").query(queryObj).reply(200, []);
            var query = account(queryObj).catch(
                Error, function() {return "NotDoneError";}
            );
            return expect(query).to.eventually.equal("NotDoneError");
        }); 
    });
    describe("'accountAddress' route", function() {
        before(function() {
            accountAddress = routes.accountAddress;
        });
        afterEach(function() {
            nock.cleanAll;
        });
        it("should accept an address", function() {
            expect(accountAddress(address)).to.be.ok;
        });
        it("should return an object, not a list", function() {
            blockapps.get("/account").query(queryObj).reply(200, [{}]);
            return expect(accountAddress(address)).to.eventually.be
                .an.instanceOf(Object).and.eventually.not.be.an.instanceOf(Array);
        });
    });
    describe("'submitTransaction' route", function() {
        before(function() {
            submitTransaction = routes.submitTransaction;
            txObj = {
                "nonce"      : 0,
                "gasPrice"   : 1,
                "gasLimit"   : 2,
                "value"      : "3",
                "codeOrData" : data,
                "from"       : addressFrom,
                "to"         : addressTo,
                "r"          : 0,
                "s"          : 0,
                "v"          : 0,
                "hash"       : "1234",
                "partialHash": "1234"
            };
        });
        beforeEach(function() {
            pollevery = lib.polling.pollEveryMS;
            timeout = lib.polling.pollTimeoutMS;
        });
        afterEach(function() {
            lib.polling.pollEveryMS = pollevery;
            lib.polling.pollTimeoutMS = timeout;
            nock.cleanAll;
        });
        it("POSTs to /transaction and polls /transactionResult/", function() {
            blockapps.post("/transaction").reply(200);
            blockapps.get("/transactionResult/" + txObj.hash).reply(200, [{
                "message" : "Success!",
                "contractsCreated" : "",
            }]);
            lib.polling.pollEveryMS = 10;

            return expect(submitTransaction(txObj)).to.eventually.be.ok;
        });
        it("handles timeouts", function() {
            blockapps.post("/transaction").reply(200);
            blockapps.get("/transactionResult/" + txObj.hash).reply(200, []);
            lib.polling.pollEveryMS = 20;
            lib.polling.pollTimeoutMS = 10;

            return expect(submitTransaction(txObj)).to.eventually.be.rejected;
        });
        it("handles failed transactions", function() {
            blockapps.post("/transaction").reply(200);
            blockapps.get("/transaction").query({"hash": txObj.hash}).reply(200,{});
            blockapps.get("/transactionResult/" + txObj.hash).reply(200, [{
                "message" : "Bad transaction",
                "transactionHash" : ""
            }]);
            lib.polling.pollEveryMS = 10;
            lib.polling.pollTimeoutMS = 20;

            return expect(submitTransaction(txObj)).to.eventually.be.rejected;
        }); 
    });
    describe("'transaction' route", function() {
        before(function() {
            transaction = routes.transaction;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should accept a query object and nothing else", function() {
            blockapps.get("/transaction").query({"address":address}).reply(200, [{}])
            expect(transaction({"address" : address})).to.be.ok;
            expect(transaction.bind(null,address)).to.throw(Error);
        });
        it("GETs from /transaction, returning a list", function() {
            blockapps.get("/transaction").query(queryObj).reply(200, [{}]);
            return expect(transaction(queryObj)).to.eventually.be.ok;
        });
        it("should handle empty list replies", function() {
            blockapps.get("/transaction").query(queryObj).reply(200, []);
            var query = transaction(queryObj).catch(
                Error, function() {return "NotDoneError";}
            );
            return expect(query).to.eventually.equal("NotDoneError");
        }); 
    });
    describe("'transactionLast' route", function() {
        before(function() {
            transactionLast = routes.transactionLast;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should take a number", function() {
            expect(transactionLast(1)).to.be.ok;
        });
        it("should round up its argument", function() {
            blockapps.get("/transaction/last/1").times(2).reply(200, "Success!");
            return Promise.join(
                expect(transactionLast(1)).to.eventually.equal("Success!"),
                expect(transactionLast(0.5)).to.eventually.equal("Success!"),
                function(){}
            );
        });
        it("should reject nonpositive arguments", function() {
            expect(transactionLast.bind(null,0)).to.throw(Error);
            expect(transactionLast.bind(null,-1)).to.throw(Error);
        });
        it("should query /transaction/last/", function() {
            blockapps.get("/transaction/last/1").reply(200, "Success!");
            return expect(transactionLast(1)).to.eventually.be.ok;
        })
    });
    describe("'transactionResult' route", function() {
        before(function() {
            transactionResult = routes.transactionResult;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should accept a hex string and nothing else", function() {
            expect(transactionResult("abcd")).to.be.ok;
            expect(transactionResult.bind(null, "xyz")).to.throw(Error);
        });
        it("should query /transactionResult", function() {
            blockapps.get("/transactionResult/abcd").reply(200, [{
                "message" : "Success!",
                "contractsCreated": ""
            }]);
            return expect(transactionResult("abcd")).to.eventually.be.fullfilled;
        });
        it("should handle empty list results", function() {
            blockapps.get("/transactionResult/abcd").reply(200, []);
            var query = transactionResult("abcd").catch(
                require("../js/pollPromise").NotDoneError,
                function() {return "NotDone";}
            );
            return expect(query).to.eventually.equal("NotDone");
        });
        it("should convert contractsCreated to a list", function() {
            blockapps.get("/transactionResult/abcd").reply(200, [{
                "message" : "Success!",
                "contractsCreated": "1,2"
            }]);
            return expect(transactionResult("abcd")).to.eventually
                .have.property("contractsCreated").which.eqls(["1","2"]);
        });
    });
    describe("'storage' route", function() {
        before(function() {
            storage = routes.storage;
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("should accept a query object and nothing else", function() {
            blockapps.get("/storage").query({"address":address}).reply(200, [{}])
            expect(storage({"address" : address})).to.be.ok;
            expect(storage.bind(null,address)).to.throw(Error);
        });
        it("GETs from /storage, returning a list", function() {
            blockapps.get("/storage").query(queryObj).reply(200, [{}]);
            return expect(storage(queryObj)).to.eventually.be.ok;
        });
        it("should handle empty list replies", function() {
            blockapps.get("/storage").query(queryObj).reply(200, []);
            var query = storage(queryObj).catch(
                Error, function() {return "NotDoneError";}
            );
            return expect(query).to.eventually.equal("NotDoneError");
        }); 
    });
    describe("'storageAddress' route", function() {
        before(function() {
            storageAddress = routes.storageAddress;
        });
        afterEach(function() {
            nock.cleanAll;
        });
        it("should accept an address", function() {
            expect(storageAddress(address)).to.be.ok;
        });
        it("should return an object, not a list", function() {
            blockapps.get("/storage").query(queryObj).reply(200, {});
            return expect(storageAddress(address)).to.eventually.be
                .an.instanceOf(Object).and.eventually.not.be.an.instanceOf(Array);
        });
    });
});
