var Int = require("../js/Int.js");
var bigInt = require('big-integer');

var expect = require('chai').expect;

describe("Int type", function() {
    var number = 161;
    var decString = "161";
    var hexString = "0xa1";
    var bytes = new Buffer("a1", "hex");

    it("should return a new Int object", function() {
        expect(typeof Int).to.equal('function');
    });
    it("should construct a 'big-integer'", function() {
        var ethInt = Int(number);
        expect(bigInt.isInstance(ethInt)).to.be.true;
    });
    it("should accept native numbers", function() {
        var ethInt = Int(number);
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept decimal strings", function() {
        var ethInt = Int(decString);
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept 0x(hex) strings", function() {
        var ethInt = Int(hexString);
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept hex Buffers", function() {
        var ethInt = Int(bytes);
        expect(ethInt.valueOf()).to.equal(number);
    });
});
