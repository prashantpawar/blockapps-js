var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var ethTransaction = sinon.spy();
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
        var valueTX;
        beforeEach(function () {
            valueTX = Transaction({"value" : Int(10).pow(18)});
        });

        it("which should exist", function () {
            expect(typeof valueTX).to.equal('function');
        });
    });
});
