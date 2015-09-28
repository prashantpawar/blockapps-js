var chai = require("chai");
var chaiPromise = require("chai-as-promised");
chai.use(chaiPromise);
var expect = chai.expect;
var nock = require("nock");

var HTTPQuery = require("../js/HTTPQuery.js");
var serverUrl = HTTPQuery.defaults.serverURI + HTTPQuery.defaults.apiPrefix;

var Address = require("../js/Address.js");
var Transaction = require("../js/Transaction.js");
var Int = require("../js/Int.js");

describe("Transaction", function() {
    it("should return a new Transaction object", function () {
        expect(Transaction).to.be.a("function");
    });

    it("should take a parameter object {data, value, gasPrice, gasLimit, to}",
       function() {
           var tx = Transaction({
               data: "abcd",
               value: 1,
               gasPrice: 2,
               gasLimit: 100,
               to: "a"
           });
           expect(tx.data).to.satisfy(function(data) {
               var abcd = new Buffer("abcd", "hex");
               return data.equals(abcd);
           });
           expect(tx.value).to.satisfy(function(value) {
               return Int(value) == 1;
           });
           expect(tx.gasPrice).to.satisfy(function(gasPrice) {
               return Int(gasPrice) == 2;
           });
           expect(tx.gasLimit).to.satisfy(function(gasLimit) {
               return Int(gasLimit) == 100;
           });
           expect(tx.to).to.satisfy(function(to) {
               return Address("a").equals(to);
           });
       });

    it("should provide defaults for {value, gasPrice, gasLimit}",
       function() {
           var tx = Transaction({
               data: "abcd",
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
        var tx = Transaction();
        expect(tx).to.have.property("send").which.is.a("function");
    });

    describe("the .send method", function() {
        var tx, blockappsServer

        var addressTo = "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3";
        var addressFrom = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";
        var privkeyFrom = "1dd885a423f4e212740f116afa66d40aafdbb3a3\
81079150371801871d9ea281";

        var value = Int(10).pow(18).toString(10);
        var gasPrice = 11;
        var gasLimit = 123456;
        var hash1="4f2413b25145f6f28339c2d7e8f1a1e3ce20ae1a68c9b2c8c0a520482b8cb74f"
        var hash2="4e46c98305d2e7d647bf62e7d3fb96fc8a83b0ceef6d5d22610e884f2452c304"

        var success = "Success!"
        var failure = "Failed..."
        
        function txResult(hash, message, created) {
            blockappsServer.get("/transactionResult/" + hash).reply(200,[{
                "message": message,
                "transactionHash": hash,
                "contractsCreated": (created === undefined) ? "" : created.join(",")
            }])
        }
        
        beforeEach(function() {
            tx = Transaction({
                value: value,
                gasPrice: gasPrice,
                gasLimit: gasLimit
            });
            blockappsServer = nock(serverUrl).post("/transaction").reply(200);
        });

        it("should take a private key, returning a promise", function() {
            txResult(hash1, success);
            expect(tx.send(privkeyFrom)).to.have.property("then")
                .which.is.a("function");
        });
        it("should maybe also take an address, returning a promise", function() {
            txResult(hash2, success);
            expect(tx.send(privkeyFrom, addressTo)).to.have.property("then")
                .which.is.a("function");
        });
    });
});
