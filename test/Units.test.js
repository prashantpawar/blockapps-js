describe("Units module", function() {
    before(function() {
        Units = lib.ethbase.Units;
        Int = lib.ethbase.Int;
    });

    it("should provide the 'ethValue' function", function() {
        expect(Units.ethValue).to.be.a("function");
    });
    it("should provide the 'convertEth' function", function() {
        expect(Units.convertEth).to.be.a("function");
    });
    it("should export the 'ethereum' units scheme", function() {
        expect(Units.schemes).to.have.property("ethereum");
    });

    describe("The 'ethValue' function", function() {
        before(function() {
            ethValue = Units.ethValue;
            u = Int(2).pow(256).minus(1);
            x = ethValue(u);
            y = x.in("ether");
        });
        it("should accept the Int type", function() {
            expect(x).to.exist;
        });
        it("should accept the 'ether' denomination", function() {
            expect(y).to.exist;
        });
        it("in 'ether', should be convertible to the Int type", function() {
            expect(Int(y)).to.exist;
        });
    });

    describe("The 'convertEth' function", function() {
        before(function() {
            convertEth = Units.convertEth;
            u = Int(2).pow(256).minus(1);
            n = 3;
            d = 5;
        });
        it("should accept one Int argument", function() {
            expect(convertEth(u)).to.exist;
        })
        it("should accept two Int arguments", function() {
            expect(convertEth(n,d)).to.exist;
        });
        it("with two arguments, should be equivalent to their ratio", function() {
            var c = convertEth(n,d).from("wei").to("wei");
            expect(c.toString()).to.equal((n/d).toString());
        });
        it("should convert from 'ether' to 'szabo' exactly", function() {
            expect(convertEth(n,d).from("ether").to("szabo").toString())
                .to.equal((1000000*n/d).toString());
        });
        it("should convert from 'szabo' to 'ether'", function() {
            expect(convertEth(1000000).from("szabo").to("ether").toString())
                .to.equal("1");
        });
    });
});
