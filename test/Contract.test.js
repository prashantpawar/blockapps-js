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

    it("should have properly set the name from symtab", function () {
        expect(contract.name).to.equal('name');
    });

    it("should have sync method set", function () {
        expect(contract.sync).to.be.a('function');
    });
});

describe("Contract's private key constructor", function () {
    var contract;
    var privkey = "ff3abf5f2363b8c4a8839870ec6a1e7ec289ace9ff13905295c9b6bd646f443a";
    var address_from_privkey = "9266dff53dff79efde6df65b6c1e6cb4f63fd3dd";

    beforeEach(function() {
        contract = new Contract({
            privkey: privkey
        });
    });

    it("should have privkey set", function () {
        expect(contract.privateKey).to.an('object');
    });

    it("should have address set", function () {
        expect(contract.address.toString()).to.equal(address_from_privkey);
    });

    it("should have sync method set", function () {
        expect(contract.sync).to.be.a('function');
    });
});
