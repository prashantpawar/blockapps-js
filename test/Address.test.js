var Address = require("../js/Address");

var expect = require('chai').expect;

describe("Address type", function() {
    var address = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";

    it("should return a new Address object", function() {
        expect(typeof Address).to.equal('function');
    });
    it("should construct a Buffer...", function() {
        var addrObj = Address(address);
        expect(Buffer.isBuffer(addrObj)).to.be.true
    });
    it("...which should have exactly 20 bytes", function() {
        var addrObj = Address(address);
        expect(addrObj.length).to.equal(20);
    });
    it("should accept both hex and 0x(hex) strings", function() {
        var addrObj1 = Address(address);
        var addrObj2 = Address("0x" + address);
        expect(addrObj1.equals(addrObj2)).to.be.true;
    });
    it("should copy another Address", function() {
        var addrObj1 = Address(address);
        var addrObj2 = Address(addrObj1);
        expect(addrObj1.equals(addrObj2)).to.be.true;
    });
    it("should take only one argument", function() {
        var addrObj1 = Address(address);
        var addrObj2 = Address(address, "utf8");
        expect(addrObj1.equals(addrObj2)).to.be.true;
    });
    it("should have a method 'toString'...", function() {
        var addrObj = Address(address);
        expect(addrObj).to.have.property("toString").which.is.a('function');
    });
    it("...which should return the original address as a hex string", function() {
        var addrObj = Address(address);
        expect(addrObj.toString()).to.equal(address);
    });
    it("...and which should take no arguments", function() {
        var addrObj = Address(address);
        expect(addrObj.toString()).to.equal(addrObj.toString("utf8"));
    });
});
