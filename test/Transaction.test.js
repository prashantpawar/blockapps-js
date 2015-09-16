var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var nock = require("nock");
var HTTPQuery = require("../js/HTTPQuery.js");
var serverUrl = HTTPQuery.defaults.serverURI + HTTPQuery.defaults.apiPrefix;

var Transaction = require("../js/Transaction.js");
var Int = require("../js/Int.js");

var expect = chai.expect;

describe("Transaction", function () {
    describe("should", function () {
        it("return a new Transaction object", function () {
            expect(typeof Transaction).to.equal('function');
        });
    });

    describe("should construct and return a function", function () {
        var addressTo = "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3";
        var privkeyFrom = "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";
        var hash = "4e46c98305d2e7d647bf62e7d3fb96fc8a83b0ceef6d5d22610e884f2452c304";
        var successMessage = "Success!";
        var errorMessage = "Error!";
        var gasPrice = 11;
        var gasLimit = 123456;
        var value = Int(10).pow(18);
        var valueTX;
        var transactionResult, blockappsServer;
        beforeEach(function () {
            blockappsServer = nock(serverUrl)
                .post('/transaction', {
                    "nonce":0,
                    "gasPrice": gasPrice,
                    "gasLimit": gasLimit,
                    "value": value.toString(),
                    "codeOrData":"",
                    "from":"e1fd0d4a52b75a694de8b55528ad48e2e2cf7859",
                    "to": addressTo,
                    "r":"23d3af3c6284bdca605fd0deb1e3855ef9c1f32c71988a083a2f31d8e5f0aa93",
                    "s":"1919806bf5812332cf8f2c56d712260fe4ad64c26a51a4f46cbae590f2aa697d",
                    "v":"1b",
                    "hash":hash
                }).reply(200);
            transactionResult = nock(serverUrl).get('/transactionResult/' + hash);
        });

        it("which should exist", function () {
            valueTX = Transaction({"value" : value});
            expect(typeof valueTX).to.equal('function');
        });

        it("which successfully transfer eth", function () {
            transactionResult.reply(200, [{
                "message": successMessage,
                "contractsCreated": "124,242"
            }]);
            valueTX = Transaction({
                "value" : Int(10).pow(18),
                "gasPrice": gasPrice,
                "gasLimit": gasLimit
            });
            valueTX(privkeyFrom, addressTo).then(function(txResult) {
                expect(txResult.message).to.equals(successMessage);
                expect(txResult.contractsCreated).to.include('124');
                expect(txResult.contractsCreated).to.include('242');
            }); 
        });

        it("which should handle failure during transaction", function () {
            transactionResult.reply(200, [{
                "message": errorMessage
            }]);
            valueTX = Transaction({
                "value" : Int(10).pow(18),
                "gasPrice": gasPrice,
                "gasLimit": gasLimit
            });

            valueTX(privkeyFrom, addressTo).then(function(txResult) {
                console.warn("I shouldn't be here");
            },function(txResult) {
                expect(txResult.message).to.equals(errorMessage);
                expect(txResult.contractsCreated).to.not.exist;
            }); 
        });
    });
});
