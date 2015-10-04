describe("HTTPQuery", function() {
    it("should respond to default parameters", function() {
        var nock = require("nock");
        
        setProfile("ethereum", "2.0");
        var blockapps2 = nock(query.serverURI + query.apiPrefix);

        blockapps2.get("/").reply(200, "Success!");
        var query2 = HTTPQuery("/", {"get":{}});

        var e = expect(query2).to.eventually.be.ok;

        setProfile("hacknet", "1.0");
        return e;
    });
    it("should take 'get', 'post', and 'data' parameters and no others",function() {
        var params = {
            "a" : 1,
            "b" : "2",
            "c" : ["3", "4"],
            "d" : { "e" : 5 }
        };

        getRoutes.account();
        var query1 = HTTPQuery("/account", {"get":params});

        postRoutes.transaction()
        var query2 = HTTPQuery("/transaction", {"post":params});

        postRoutes.transaction()
        var query3 = HTTPQuery("/transaction", {"data":params});

        function f() {
            HTTPQuery("/path", {"p":params});
        }

        return Promise.join(
            expect(query1).to.eventually.be.fulfilled,
            expect(query2).to.eventually.be.fulfilled,
            expect(query3).to.eventually.be.fulfilled,
            expect(f).to.throw(Error),
            function() {}
        );
    });
    it("should reject multiple parameters", function() {
        var query1 = HTTPQuery.bind(null,"/path", {"get":{}, "post":{}});
        var query2 = HTTPQuery.bind(null,"/path", {"get":{}, "data":{}});
        var query3 = HTTPQuery.bind(null,"/path", {"get":{}, "post":{}});
        var query4 = HTTPQuery.bind(null,"/path", {"get":{}, "post":{}, "data":{}});

        return Promise.join(
            expect(query1).to.throw(Error),
            expect(query2).to.throw(Error),
            expect(query3).to.throw(Error),
            expect(query4).to.throw(Error),
            function() {}
        );
    });
    // it("should handle syntax errors in JSON responses", function() {
    //     blockapps.post("/path").reply(200, );
    //     var query = HTTPQuery("/path", {"post":{}});
        
    //     return expect(query).to.eventually.eql([]);
    // });
});
