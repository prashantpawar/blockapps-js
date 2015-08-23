var SolTypes = require("../js/SolTypes.js");
var Contract = require("../js/Contract.js")
var Address = require("../js/Address.js")

var chai = require("chai");
var expect = chai.expect;

describe("Contract's empty constructor", function () {
    var contract;
    beforeEach(function () {
        contract = new Contract();
    });
    it("should return a new Contract object", function () {
        expect(contract).to.exist;
    });
    
    it("should have the balance set", function () {
        expect(contract.balance).to.be.a('object');
    });
    
    it("should have the nonce set", function () {
        expect(contract.nonce).to.be.a('object');
    });

});

describe("Contract's address constructor", function () {
    var contract;
    var address = "0x0CAFEBABE";
    var v_address = "00000000000000000000000000000000cafebabe";
    var symtab = {"name":"hello"};

    beforeEach(function() {
        contract = new Contract({
            address: address,
            symtab: symtab
        });
    });

    it("should have address set", function () {
        expect(contract.address.toString()).to.equal(v_address);
    });

    it("should have a getter function", function () {
        expect(contract.get).to.be.a('function');
    });

    it("should have a call function", function () {
        expect(contract.call).to.be.a('function');
    });

    it("should have a Storage object", function () {
        expect(contract._storage).to.be.an('object');
    });
});
