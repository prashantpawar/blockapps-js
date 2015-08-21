var SolTypes = require("../js/SolTypes.js");
var Contract = require("../js/Contract.js")

var chai = require("chai");
var expect = chai.expect;

describe("Solidity", function () {
    var contract;
    beforeEach(function () {
        contract = new Contract();
    });
    it("should return a new Contract object", function () {
        expect(contract).to.exist;
    });
    
    it("should have a balance set to 0", function () {
        expect(contract.balance).to.be.an.instanceof(SolTypes.Int);
    });
});