describe("Routes", function() {
    var solcReply = {
        "contracts" : [{"name" : "C", "bin" : "60006c"}],
        "xabis" : { "C" : {"x" : {}, "f" : {} } }
    }
    var code = "                         \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";

    describe("'solc' route", function() {
        before(function() {
            solc = routes.solc;
        });
        after(function() {
            delete solc;
        });
        
        it("compiles a valid contract to the promise of a Solidity object",
           function() {
               postRoutes.solc({reply:solcReply});
               var codeSolc = solc(code);
               return Promise.join(
                   expect(codeSolc.get("vmCode"))
                       .to.eventually.equal("60006c"),
                   expect(codeSolc.get("symTab"))
                       .to.eventually.eql({"x": {}, "f": {}}),
                   expect(codeSolc.get("name"))
                       .to.eventually.eql("C"),
                   function() {}
               );
           }
          );
        it("rejects non-string input", function() {
            function f() {
                return solc(new Buffer(code));
            }
            expect(f).to.throw(Error);
        });
        it("rejects code with multiple contracts", function() {
            postRoutes.solc({
                reply: {
                    "contracts" : [
                        {"name" : "C", "bin" : "60006c"},
                        {"name" : "D", "bin" : "60006c"}
                    ],
                    "xabis" : {
                        "C" : {"x" : {}, "f" : {} },
                        "D" : {"x" : {}, "f" : {} }
                    }
                }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeSolc = solc(code2).catch(function(){return "Error";});
            return expect(codeSolc).to.eventually.equal("Error");
        });
        it("handles compilation errors", function() {
            postRoutes.solc({reply: {"error" : "Compilation failed"}});
            var codeSolc = solc(code);
            return expect(codeSolc).to.eventually.be.rejected;
        });
    });

    describe("'extabi' route", function() {
        var extabiReply = {
            "C" : { "x" : {}, "f" : {} }
        }
        var code = "                     \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
        before(function() {
            extabi = routes.extabi;
        });
        after(function() {
            delete extabi;
        });
        
        it("compiles a valid contract to the promise of a Solidity object",
           function() {
               postRoutes.extabi({ reply: extabiReply});
               var codeExtabi = extabi(code);
               return expect(codeExtabi).to.eventually.eql(extabiReply);
           }
          );
        it("rejects non-string input", function() {
            function f() {
                return extabi(new Buffer(code));
            }
            return expect(f).to.throw(Error);
        });
        it("rejects code with multiple contracts", function() {
            postRoutes.extabi({
                reply: {
                    "C" : {"x" : {}, "f" : {} },
                    "D" : {"x" : {}, "f" : {} }
                }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeExtabi = extabi(code2).catch(function(){return "Error";});
            return expect(codeExtabi).to.eventually.equal("Error");
        });
    });

    describe("'faucet' route", function() {
        before(function() {
            faucet = routes.faucet;
        });
        after(function() {
            delete faucet;
        });
        it("accepts arguments convertible to Address", function() {
            faucetMock({address:address});
            faucetMock({address:Address(1).toString()});
            faucetMock({address:address});
            return expect(Promise.join(
                faucet(address),
                faucet(1),
                faucet(Address(address)),
                function() {}
            )).to.eventually.be.fulfilled;
        });
        it("POSTs to /faucet", function() {
            var mock = faucetMock(addrQuery).faucet;
            return expect(faucet(address).then(mock.isDone))
                .to.eventually.be.true;
        });
        it("Handles timeouts", function() {
            faucetMock({address: address, reply: []});
            polling.pollEveryMS = 5;
            return expect(faucet(address)).to.eventually.be.rejected;
        });
    });

    describe("'login' route", function() {
        var loginArgs = {
            "email": "ryan.reich@gmail.com",
            "app": "bloc",
            "loginpass": "password"
        };
        before(function() {
            login = routes.login;
        });
        after(function() {
            delete login;
        });
        it("accepts only {email, app, loginpass} and an address", function() {
            postRoutes.login();
            expect(function() {
                login(loginArgs,"address");
            }).to.throw(Error);
            expect(function() {
                login(address, loginArgs);                
            }).to.throw(Error);
            return expect(login(loginArgs, address)).to.eventually.be.fulfilled;
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
        });
        it("POSTs to /login", function() {
            var mock = postRoutes.login();
            return expect(login(loginArgs, address).then(mock.isDone))
                .to.eventually.be.true;
        });
    });
    describe("'wallet' route", function() {
        var walletArgs = {
            "email": "ryan.reich@gmail.com",
            "app": "bloc",
            "walletpass": "password"
        };
        before(function() {
            wallet = routes.wallet;
        });
        after(function() {
            delete wallet;
        });
        it("accepts only {email, app, loginpass} and a key", function() {
            postRoutes.wallet();
            expect(function(){
                wallet(walletArgs, "privkey");
            }).to.throw(Error);
            expect(function(){
                wallet(privkeyFrom, walletArgs);
            }).to.throw(Error);            
            return expect(wallet(walletArgs, txArgs.privkey))
                .to.eventually.be.fulfilled;
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
        });
        it("POSTs to /wallet", function() {
            var mock = postRoutes.wallet();
            return expect(wallet(walletArgs, txArgs.privkey).then(mock.isDone))
                .to.eventually.be.true;
        });
    });
    describe("'developer' route", function() {
        var developerArgs = {
            "email": "ryan.reich@gmail.com",
            "app": "bloc",
            "developerpass": "password"
        };
        before(function() {
            developer = routes.developer;
        });
        after(function() {
            delete developer;
        });
        it("accepts only {email, app, loginpass}", function() {
            postRoutes.developer();
            expect(function() {
                developer(developerArgs.toString());
            }).to.throw(Error);
            return expect(developer(developerArgs)).to.eventually.be.fulfilled;
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
        });
        it("POSTs to /developer", function() {
            var mock = postRoutes.developer();
            return expect(developer(developerArgs).then(mock.isDone))
                .to.eventually.be.true;
        });
    });
    describe("'register' route", function() {
        var registerLogin = {
            "email": "ryan.reich@gmail.com",
            "app": "bloc",
            "registerpass": "password"
        };
        var registerArgs = {
            "developer": "Ryan Reich",
            "appurl": "ryancreich.info",
            "repourl": "https://github.com/blockapps/bloc"
        };
        before(function() {
            register = routes.register;
        });
        after(function() {
            delete register
        });
        it("accepts only {email, app, loginpass} and a key", function() {
            postRoutes.register();
            expect(function() {
                register(registerLogin.toString(), registerArgs.toString());
            });
            return expect(register(registerLogin, registerArgs))
                .to.eventually.be.fulfilled;
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
        });
        it("POSTs to /register", function() {
            var mock = postRoutes.register();
            return expect(register(registerLogin,registerArgs).then(mock.isDone))
                .to.eventually.be.true;
        });
    });
    describe("'block' route", function() {
        before(function() {
            block = routes.block;
        });
        after(function() {
            delete block;
        });
        it("should accept a query object and nothing else", function() {
            getRoutes.block({query: addrQuery, reply: [{}]});
            expect(function() {
                block(address);
            }).to.throw(Error);
            return expect(block(addrQuery)).to.eventually.be.fulfilled;
        });
        it("GETs from /block, returning a list", function() {
            var mock = getRoutes.block({query:addrQuery, reply:[{}]});
            return expect(block(addrQuery).then(mock.isDone))
                .to.eventually.be.true;
        });
        it("should handle empty list replies", function() {
            getRoutes.block({query:addrQuery, reply:[]});
            return expect(block(addrQuery)).to.eventually.be.rejected;
        });
    });
    describe("'blockLast' route", function() {
        before(function() {
            blockLast = routes.blockLast;
        });
        after(function() {
            delete blockLast;
        });
        it("should take a number", function() {
            staticRoutes["block/last"]({query:1});
            return expect(blockLast(1)).to.eventually.be.fulfilled;
        });
        it("should round up its argument", function() {
            staticRoutes["block/last"]({query:1});
            expect(blockLast(0.5)).to.eventually.be.fulfilled;
        });
        it("should reject nonpositive arguments", function() {
            expect(blockLast.bind(null,0)).to.throw(Error);
            expect(blockLast.bind(null,-1)).to.throw(Error);
        });
        it("should query /block/last/", function() {
            var mock = staticRoutes["block/last"]({query:1});
            return expect(blockLast(1).then(mock.isDone)).to.eventually.be.true;
        })
    });
    describe("'account' route", function() {
        before(function() {
            account = routes.account;
        });
        after(function() {
            delete account;
        });
        it("should accept a query object and nothing else", function() {
            getRoutes.account({query:addrQuery, reply:[{}]});
            return Promise.join(
                expect(account(addrQuery)).to.eventually.be.fulfilled,
                expect(account.bind(null,address)).to.throw(Error),
                function() {}
            );
        });
        it("GETs from /account, returning a list", function() {
            var mock = getRoutes.account({query:addrQuery, reply:[{}]});
            return account(addrQuery).then(function(x) {
                expect(x).to.be.an.instanceOf(Array);
                expect(mock.isDone()).to.be.true;
            });
        });
        it("should handle empty list replies", function() {
            getRoutes.account({query:addrQuery, reply:[]});
            return expect(account(addrQuery)).to.eventually
                .be.rejectedWith(pollPromise.NotDoneError);
        });
    });
    describe("'accountAddress' route", function() {
        before(function() {
            accountAddress = routes.accountAddress;
        });
        after(function() {
            delete accountAddress;
        });
        it("should accept an address", function() {
            getRoutes.account({query:addrQuery, reply:[{}]});
            expect(accountAddress(address)).to.eventually.be.fulfilled;
        });
        it("GETs from /account, returning an object, not a list", function() {
            var mock = getRoutes.account({query:addrQuery, reply:[{}]});
            var q = accountAddress(address);

            return Promise.join(
                expect(q).to.eventually.be
                    .an.instanceOf(Object).and.eventually.not.be
                    .an.instanceOf(Array),
                expect(q.then(mock.isDone)).to.eventually.be.true,
                function(){}
            );
        });
    });
    describe("'submitTransaction' route", function() {
        before(function() {
            txObj = Transaction(txArgs);
            txObj.nonce = 0;
            txObj.from = txArgs.from;
            submitTransaction = routes.submitTransaction;
        });
        after(function() {
            delete submitTransaction;
            delete txObj;
        });
        it("POSTs to /transaction and GETs from /transactionResult/", function() {
            var mocks = sendTXmock({
                tx: txObj,
                txResult: {succeed: true}
            });
            return expect(submitTransaction(txObj).then(function() {
                return mocks.transaction.isDone() && mocks.txResult.isDone();
            })).to.eventually.be.true;
        });
        it("handles timeouts", function() {
            sendTXmock({tx: txObj});
            polling.pollEveryMS = 10;
            polling.pollTimeoutMS = 5;

            return expect(submitTransaction(txObj)).to.eventually.be.rejected;
        });
        it("handles failed transactions", function() {
            sendTXmock({tx: txObj, txResult: {succeed: false}});
            polling.pollEveryMS = 5;
            polling.pollTimeoutMS = 10;

            return expect(submitTransaction(txObj)).to.eventually.be.rejected;
        }); 
    });
    describe("'transaction' route", function() {
        before(function() {
            transaction = routes.transaction;
        });
        after(function() {
            delete transaction;
        });
        it("should accept a query object and nothing else", function() {
            getRoutes.transaction({query:addrQuery, reply:[{}]});
            expect(function() {
                transaction(address);
            }).to.throw(Error);
            return expect(transaction({"address" : address}))
                .to.eventually.be.fulfilled;
        });
        it("GETs from /transaction, returning a list", function() {
            var mock = getRoutes.transaction({query:addrQuery, reply:[{}]});
            return expect(transaction(addrQuery).then(mock.isDone))
                .to.eventually.be.true;
        });
        it("should handle empty list replies", function() {
            getRoutes.transaction({query:addrQuery, reply:[]});
            return expect(transaction(addrQuery)).to.eventually
                .be.rejectedWith(pollPromise.NotDoneError);
        }); 
    });
    describe("'transactionLast' route", function() {
        before(function() {
            transactionLast = routes.transactionLast;
        });
        after(function() {
            delete transactionLast;
        });
        it("should take a number, rounding up its argument", function() {
            staticRoutes["transaction/last"]({query:1});
            expect(transactionLast(0.5)).to.eventually.be.fulfilled;
        });
        it("should reject nonpositive arguments", function() {
            expect(transactionLast.bind(null,0)).to.throw(Error);
            expect(transactionLast.bind(null,-1)).to.throw(Error);
        });
        it("should query /transaction/last/", function() {
            var mock = staticRoutes["transaction/last"]({query:1});
            return expect(transactionLast(1).then(mock.isDone))
                .to.eventually.be.true;
        })
    });
    describe("'transactionResult' route", function() {
        before(function() {
            transactionResult = routes.transactionResult;
        });
        after(function() {
            delete transactionResult;
        });
        it("GETs from /transactionResult, accepting a hex string and nothing else",
           function() {
               var mock = txRMock({succeed: true, hash: "abcd"});
               expect(function() {
                   transactionResult("xyz");
               }).to.throw(Error);
               return expect(transactionResult("abcd").then(mock.isDone))
                   .to.eventually.be.true;
           }
          );
        it("should handle empty list results", function() {
            txRMock({hash:"abcd"});
            return expect(transactionResult("abcd")).to.eventually
                .be.rejectedWith(pollPromise.NotDoneError);
        });
        it("should convert contractsCreated to a list", function() {
            txRMock({succeed:true, hash:"abcd", contractsCreated: ["1", "2"]});
            return expect(transactionResult("abcd")).to.eventually
                .have.property("contractsCreated").which.eqls(["1","2"]);
        });
    });
    describe("'storage' route", function() {
        before(function() {
            storage = routes.storage;
        });
        after(function() {
            delete storage;
        });
        it("GETs from /storage, accepting a query object and nothing else",
           function() {
               var mock = getRoutes.storage({query:addrQuery, reply:[{}]});

               expect(function() {
                   storage(address);
               }).to.throw(Error);
               return expect(storage(addrQuery).then(mock.isDone))
                   .to.eventually.be.true;
           }
          );
        it("should handle empty list replies", function() {
            getRoutes.storage({query:addrQuery, reply:[]});
            return expect(storage(addrQuery)).to.eventually
                .be.rejectedWith(pollPromise.NotDoneError);
        }); 
    });
    describe("'storageAddress' route", function() {
        before(function() {
            storageAddress = routes.storageAddress;
        });
        after(function() {
            delete addrQuery;
        });
        it("should accept an address, returning an object and not a list",
           function() {
               getRoutes.storage({query:addrQuery, reply:[{}]});
               var q = storageAddress(address);
               return Promise.join(
                   expect(q).to.eventually.be.fulfilled,
                   expect(q).to.eventually.be
                       .an.instanceOf(Object).and.eventually.not.be
                       .an.instanceOf(Array),
                   function(){}
               );
           }
          );
    });
});
