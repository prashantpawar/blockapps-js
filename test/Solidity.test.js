describe("Solidity", function () {
    before(function() {
        Solidity = lib.Solidity;
    });
    beforeEach(function () {
        pollevery = lib.polling.pollEveryMS;
        timeout = lib.polling.pollTimeoutMS;
    });
    afterEach(function() {
        lib.polling.pollEveryMS = pollevery;
        lib.polling.pollTimeoutMS = timeout;
        nock.cleanAll();
    });

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
            blockapps.post("/solc").reply(200, {
                "contracts" : [{"name" : "C", "bin" : "60006c"}],
                "xabis" : { "C" : {"x" : {}, "f" : {} } }
            });
        });
        it("accepts valid Solidity code, returning a Solidity object", function() {
            return expect(Solidity(code)).to.eventually.be.fulfilled
                .and.to.eventually.be.an.instanceOf(Solidity);
        });
        it("correctly assigns code and contract name", function() {
            var solCode = Solidity(code);
            return Promise.join(
                expect(solCode).to.eventually.have.property("code", code),
                expect(solCode).to.eventually.have.property("name", "C"),
                function(){}
            );
        });
    });
    describe("contract objects", function() {

    });
    describe("the 'attach' function", function() {
        
    });
});
