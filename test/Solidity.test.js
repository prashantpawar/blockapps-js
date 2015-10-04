describe("Solidity", function () {
    describe("the Solidity constructor", function() {
        before(function() {
            code = "                 \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
        });
        beforeEach(function() {
            postRoutes.solc({
                reply : {
                    "contracts" : [{"name" : "C", "bin" : "60006c"}],
                    "xabis" : { "C" : {"x" : {}, "f" : {} } }
                }
            });
        });
        it("accepts valid Solidity code, returning a Solidity object", function() {
            return expect(Solidity(code)).to.eventually.be.fulfilled
                .and.to.eventually.be.an.instanceOf(Solidity);
        });
        it("correctly assigns code, name, vmCode, symTab", function() {
            var solCode = Solidity(code);
            return Promise.join(
                expect(solCode).to.eventually.have.property("code", code),
                expect(solCode).to.eventually.have.property("name", "C"),
                expect(solCode).to.eventually.have.property("vmCode", "60006c"),
                expect(solCode).to.eventually.have.property("symTab")
                    .that.eqls({
                        "x":{},
                        "f":{}
                    }),
                function(){}
            );
        });
    });
    describe("contract objects", function() {

    });
    describe("the 'attach' function", function() {
        
    });
});
