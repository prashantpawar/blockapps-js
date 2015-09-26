var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var nock = require("nock");

var Address = require("../js/Address.js")
var Account = require("../js/Account.js")
var Int = require("../js/Int.js");
var HTTPQuery = require("../js/HTTPQuery.js");
var serverUrl = HTTPQuery.defaults.serverURI + HTTPQuery.defaults.apiPrefix;

describe("Account", function () {
    var address = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";

    it("should return a new Account object", function () {
        expect(typeof Account).to.equal('function');
    });
    it("should take an address as an argument", function() {
        expect(Account(address)).to.exist;
    });

    describe("when initialized with address", function () {
        var balanceAmount = "33000000000000000000";
        var nonceCount = 17;
        var account;
        beforeEach(function () {
            account = Account(address);
            var blockappsServer = nock(serverUrl)
                .get('/account')
                .query({address: address})
                .reply(200, [{
                    "contractRoot":"56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
                    "kind":"AddressStateRef",
                    "balance": balanceAmount,
                    "address": address,
                    "latestBlockNum":7006,
                    "latestBlockId":7007,
                    "code":"",
                    "nonce": nonceCount
                }]);
        });
        afterEach(function () {
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
                .satisfy(function(bal) {return bal.equals(Int(balanceAmount));});
        });
        it("should have nonce property as a promise", function () {
            expect(account).to.have.property('nonce')
                .which.has.property('then')
                .which.is.a('function');
        });
        it("should correctly fetch nonce as an Int", function () {
            return expect(account.nonce).to.eventually
                .satisfy(function(non) {return non.equals(Int(nonceCount));});
        });
    });
});
