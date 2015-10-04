describe("Int type", function() {
    var number = 161;

    it("should return a new Int object", function() {
        expect(Int).to.be.a('function');
    });
    it("should construct a 'big-integer'", function() {
        var bigInt = require('big-integer');
        var ethInt = Int(number);
        expect(bigInt.isInstance(ethInt)).to.be.true;
    });
    it("should accept native numbers", function() {
        var ethInt = Int(number);
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept decimal strings", function() {
        var ethInt = Int("161");
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept 0x(hex) strings", function() {
        var ethInt = Int("0xa1");
        expect(ethInt.valueOf()).to.equal(number);
    });
    it("should accept hex Buffers", function() {
        var ethInt = Int(new Buffer("a1", "hex"));
        expect(ethInt.valueOf()).to.equal(number);
    });
});
