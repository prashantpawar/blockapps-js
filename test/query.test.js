describe("HTTPQuery", function() {
    before(function() {
        query = lib.query;
        HTTPQuery = require("../js/HTTPQuery");
        blockapps.filteringPath(/path\?.*/, "path");
    });
    it("should respond to default parameters", function() {
        var apiPrefix = query.apiPrefix;
        var apiPrefix2 = "/eth/v2.0";
        var serverURI = query.serverURI;
        var serverURI2 = "http://hacknet2.blockapps.net";
        var blockapps2 = nock(serverURI + apiPrefix2);
        var blockapps3 = nock(serverURI2 + apiPrefix);

        blockapps.get("/").reply(200, "Success!");
        var query1 = HTTPQuery("/", {"get":{}});
        
        blockapps2.get("/").reply(200, "Success!");
        query.apiPrefix = apiPrefix2;
        var query2 = HTTPQuery("/", {"get":{}});

        blockapps3.get("/").reply(200, "Success!");
        query.apiPrefix = apiPrefix;
        query.serverURI = serverURI2;
        var query3 = HTTPQuery("/", {"get":{}});

        query.serverURI = serverURI;
        return Promise.join(
            expect(query1).to.eventually.be.ok,
            expect(query2).to.eventually.be.ok,
            expect(query3).to.eventually.be.ok,
            function() {}
        );
    });
    it("should take 'get', 'post', and 'data' parameters and no others",function() {
        var params = {
            "a" : 1,
            "b" : "2",
            "c" : ["3", "4"],
            "d" : { "e" : 5 }
        };
        
        blockapps.get("/path").reply(200, "Success!");
        var query1 = HTTPQuery("/path", {"get":params});

        blockapps.post("/path").reply(200, "Success!");
        var query2 = HTTPQuery("/path", {"post":params});

        blockapps.post("/path").reply(200, "Success!");
        var query3 = HTTPQuery("/path", {"data":params});

        var query4 = HTTPQuery.bind(null,"/path", {"p":params});

        return Promise.join(
            expect(query1).to.eventually.be.ok,
            expect(query2).to.eventually.be.ok,
            expect(query3).to.eventually.be.ok,
            expect(query4).to.throw(Error),
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
