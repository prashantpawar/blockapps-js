describe("Address type", function() {
    before(function() {
        addrObj = Address(address);
    })
    after(function() {
        delete addrObj;
    });

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
    it("should reject non-hex strings", function() {
        expect(Address.bind(null,"address")).to.throw(Error);
    });
    it("should copy another Address", function() {
        var addrObj2 = Address(addrObj);
        expect(addrObj.equals(addrObj2)).to.be.true;
    });
    it("should reject other types", function() {
        function f() {
            return Address({});
        }
        expect(f).to.throw(Error);
    });
    it("should truncate long strings from the left", function() {
        var addrObj2 = Address("000000000000000000000000000000000000000000000001");
        expect(addrObj2[19]).equals(1);
    });
    it("should pad short strings to the left", function() {
        var addrObj2 = Address("1");
        expect(addrObj2[0]).equals(0);
        expect(addrObj2[19]).equals(1);
    });
    it("should pad short Buffers to the left", function() {
        var addrObj2 = Address(new Buffer("a1", "hex"));
        expect(addrObj2[0]).equals(0);
        expect(addrObj2[19]).equals(161);
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
