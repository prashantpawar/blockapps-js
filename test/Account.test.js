describe("Account", function () {
    before(function() {
        account = Account(address);
    });
    after(function() {
        delete account;
    });

    it("should return a new Account object", function () {
        expect(account).to.be.an.instanceOf(Account);
    });
    it("prototype should have 'address', 'nonce', 'balance'", function() {
        expect("address" in Account.prototype).to.be.true;
        expect("nonce" in Account.prototype).to.be.true;
        expect("balance" in Account.prototype).to.be.true;
    });

    describe("when initialized with address", function () {
        before(function() {
            replyObj = [{
                "balance": txArgs.value,
                "address": address,
                "nonce": txArgs.nonce
            }];
        });
        after(function() {
            delete replyObj;
        });
        
        it("should have a property 'address' equal to its argument", function() {
            var ethAddr = Address(address);
            expect(account).to.have.property('address').
                which.satisfy(function(addr) {return addr.equals(ethAddr);});
        });
        it("'balance' should correctly fetch balance as an Int", function () {
            getRoutes.account({query:addrQuery, reply:replyObj});
            return expect(account.balance).to.eventually
                .satisfy(function(val) {return val.equals(Int(txArgs.value));});
        });
        it("'nonce' should correctly fetch nonce as an Int", function () {
            getRoutes.account({query:addrQuery, reply:replyObj});
            return expect(account.nonce).to.eventually
                .satisfy(function(non) {return non.equals(Int(txArgs.nonce));});
        });
    });
});
