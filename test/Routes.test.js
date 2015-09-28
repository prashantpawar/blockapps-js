describe("Routes", function() {
    before(function() {
        routes = lib.routes;
    });

    describe("'solc' route", function() {
        before(function() {
            code = "                 \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
            solc = routes.solc;
        });
        beforeEach(function() {
            solcMock = blockapps.post("/solc");
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts strings and only strings, returning a promise", function() {
            expect(solc(code)).has.property("then").which.is.a("function");
            var solcThrow = solc.bind(null, ["not", "a", "string"]);
            expect(solcThrow).to.throw(Error);
        });
        it("compiles a valid contract", function() {
            solcMock.reply(200, {
                "contracts" : [{"name" : "C", "bin" : "60006c"}],
                "xabis" : { "C" : {"x" : {}, "f" : {} } }
            });
            var codeSolc = solc(code);
            return Promise.join(
                expect(codeSolc).is.eventually.ok,
                expect(codeSolc).to.eventually.have.property("vmCode")
                    .which.equals("60006c"),
                expect(codeSolc).to.eventually.have.property("symTab")
                    .which.eqls({"x": {}, "f": {}}),
                expect(codeSolc).to.eventually.have.property("name")
                    .which.equals("C"),
                function() {}
            );
        });
        it("rejects code with multiple contracts", function() {
            solcMock.reply(200, {
                "contracts" : [
                    {"name" : "C", "bin" : "60006c"},
                    {"name" : "D", "bin" : "60006c"}
                ],
                "xabis" : {
                    "C" : {"x" : {}, "f" : {} },
                    "D" : {"x" : {}, "f" : {} }
                }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeSolc = solc(code).catch(function(){}).then;
            return expect(codeSolc).to.throw(Error);
        });
        it("handles compilation errors", function() {
            solcMock.reply(200, {
                "error" : "Compilation failed"
            });
            var codeSolc = solc("").catch(function(){}).then;
            return expect(codeSolc).to.throw(Error);
        });
    });

    describe("'extabi' route", function() {

        before(function() {
            code = "                 \
contract C {                             \n\
  int x = -1;                            \n\
  function C() {}                        \n\
  function f(string s) returns (int) {}  \n\
}                                        \
";
            extabi = routes.extabi;
        });
        beforeEach(function() {
            extabiMock = blockapps.post("/extabi");
        });
        afterEach(function() {
            nock.cleanAll();
        });
        it("accepts strings and only strings, returning a promise", function() {
            expect(extabi(code)).has.property("then").which.is.a("function");
            var extabiThrow = extabi.bind(null, ["not", "a", "string"]);
            expect(extabiThrow).to.throw(Error);
        });
        it("parses a valid contract", function() {
            extabiMock.reply(200, {
                "C" : {"x" : {}, "f" : {} }
            });
            var codeExtabi = extabi(code);
            expect(codeExtabi).to.eventually.have.property("C");
        });
        it("rejects code with multiple contracts", function() {
            extabiMock.reply(200, {
                "C" : {"x" : {}, "f" : {} },
                "D" : {"x" : {}, "f" : {} }
            });
            var code2 = code + "\n" + code.replace("C", "D");
            var codeExtabi = extabi(code).catch(function(){}).then;
            return expect(codeExtabi).to.throw(Error);
        });

    })
});
