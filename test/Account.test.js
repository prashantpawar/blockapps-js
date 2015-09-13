var chai = require("chai");
var expect = chai.expect;
var nock = require("nock");
var Account = require("../js/Account.js")
var HTTPQuery = require("../js/HTTPQuery.js");
var serverUrl = HTTPQuery.defaults.serverURI + HTTPQuery.defaults.apiPrefix;

describe("Account", function () {
    it("should return a new Account object", function () {
        expect(typeof Account).to.equal('function');
    });

    describe("when initialized with address", function () {
        var address = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";
        var balanceAmount = "33000000000000000000";
        var account;
        beforeEach(function () {
            account = Account(address);
        });
        afterEach(function () {
        });

        it("should have balance property as a promise", function () {
            var balancePromise = account.balance;
            expect(balancePromise).to.have.property('then');
        });
        it("should correctly fetch balance", function () {
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
                    "nonce": 0
                }]);
            var balancePromise = account.balance;
            balancePromise.then(function(balance) {
                expect(balance.toString()).to.equal(balanceAmount);
            });
        });
        it("should have nonce property as a promise", function () {
            var nonce = account.nonce;
            expect(nonce).to.have.property('then');
        });
    });
});
