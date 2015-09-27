describe("Account", function () {
    before(function() {
        Account = lib.ethbase.Account;
        Address = lib.ethbase.Address;
        Int = lib.ethbase.Int;
        account = Account(address);
    });

    it("should return a new Account object", function () {
        expect(Account).to.be.a('function');
    });
    it("should take an address as an argument", function() {
        expect(account).to.exist;
    });

    describe("when initialized with address", function () {
        beforeEach(function () {
            blockapps
                .get('/account')
                .query({
                    "address": address
                })
                .reply(200, [{
                    "balance": value,
                    "address": address,
                    "nonce": nonce
                }]);
        });
        afterEach(function () {
            nock.cleanAll();
        });

        it("should have a property 'address' equal to its argument", function() {
            var ethAddr = Address(address);
            expect(account).to.have.property('address').
                which.satisfy(function(addr) {return addr.equals(ethAddr);});
        });
        it("should have balance property as a promise", function () {
            expect(account).to.have.property('balance')
                .which.has.property('then')
                .which.is.a('function');
        });        
        it("should correctly fetch balance as an Int", function () {
            return expect(account.balance).to.eventually
                .satisfy(function(val) {return val.equals(Int(value));});
        });
        it("should have nonce property as a promise", function () {
            expect(account).to.have.property('nonce')
                .which.has.property('then')
                .which.is.a('function');
        });
        it("should correctly fetch nonce as an Int", function () {
            return expect(account.nonce).to.eventually
                .satisfy(function(non) {return non.equals(Int(nonce));});
        });
    });
});
