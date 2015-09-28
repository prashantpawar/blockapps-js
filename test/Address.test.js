describe("Address type", function() {
    before(function() {
        Address = lib.ethbase.Address;
        addrObj = Address(address);
    })

    it("should return a new Address object", function() {
        expect(Address).to.be.a('function');
    });
    it("should construct a Buffer...", function() {
        expect(Buffer.isBuffer(addrObj)).to.be.true
    });
    it("...which should have exactly 20 bytes", function() {
        expect(addrObj.length).to.equal(20);
    });
    it("should accept both hex and 0x(hex) strings", function() {
        var addrObj2 = Address("0x" + address);
        expect(addrObj.equals(addrObj2)).to.be.true;
    });
    it("should copy another Address", function() {
        var addrObj2 = Address(addrObj);
        expect(addrObj.equals(addrObj2)).to.be.true;
    });
    it("should take only one argument", function() {
        var addrObj2 = Address(address, "utf8");
        expect(addrObj.equals(addrObj2)).to.be.true;
    });
    it("should have a method 'toString'...", function() {
        expect(addrObj).to.have.property("toString").which.is.a('function');
    });
    it("...which should return the original address as a hex string", function() {
        expect(addrObj.toString()).to.equal(address);
    });
    it("...and which should take no arguments", function() {
        expect(addrObj.toString()).to.equal(addrObj.toString("utf8"));
    });
});
