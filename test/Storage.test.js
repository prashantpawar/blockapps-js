var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var nock = require("nock");

var Int = require("../js/Int.js");
var Address = require("../js/Address.js");
var Storage = require("../js/Storage.js");
var HTTPQuery = require("../js/HTTPQuery.js");
var serverUrl = HTTPQuery.defaults.serverURI + HTTPQuery.defaults.apiPrefix;

describe("Storage", function() {
    var address = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";
    it("should return a new Storage object", function() {
        expect(typeof Storage).to.equal('function');
    });
    it("should take an address as an argument", function() {
        expect(Storage(address)).to.exist;
    });

    describe("when initialized with an address", function() {
        var storage = Storage(address);
        var blockappsServer = nock(serverUrl);
        var keys = [
            {
                "addressStateRefId":2849,
                "value":"000000000000000000000000\
e1fd0d4a52b75a694de8b55528ad48e2e2cf7859",
                "key":"00000000000000000000000000\
00000000000000000000000000000000000000"
            },
            {
                "addressStateRefId":2849,
                "value":"000000000000000000000000\
0000000000000000000000000000000000000400",
                "key":"00000000000000000000000000\
00000000000000000000000000000000000002"
            }
        ];
        beforeEach(function () {
            blockappsServer
                .get("/storage")
                .query({address: address, keyhex: "1"})
                .reply(200, [])
                .get("/storage")
                .query({address: address, minkey: Int(0).toString(10), maxkey: Int(2).toString(10)})
                .reply(200, keys)
                .get("/storage")
                .query({address: address, keyhex: "0"})
                .reply(200, [keys[0]])
                .get("/storage")
                .query({address: address, keyhex: Address(0).toString()})
                .reply(200, [keys[0]]);
        });
        afterEach(function () {
        });

        it("should have a method 'getSubKey'...", function() {
            expect(storage).to.have.property('getSubKey')
                .which.is.a('function');
        });

        describe("the 'getSubKey' method", function() {
            var subkey;
            beforeEach(function() {
                subkey = storage.getSubKey("0",0, 20);
            });

            it("should return a promise", function() {
                expect(subkey).to.have.property("then")
                    .which.is.a("function");
            });
            it("...whose value should be a Buffer", function() {
                return expect(subkey).to.eventually.satisfy(Buffer.isBuffer);
            });
            it("...which is correct", function() {
                return expect(subkey).to.eventually.satisfy(function(skey) {
                    return Address(address).equals(skey);
                });
            });
            it("should return zero for a nonexistent key", function() {
                subkey = storage.getSubKey("1", 3, 5);
                return expect(subkey).to.eventually.satisfy(function(skey) {
                    return Buffer("0000000000", "hex").equals(skey);
                });
            });
        });

        it("should have a method 'getKeyRange'...", function() {
            expect(storage).to.have.property('getKeyRange')
                .which.is.a("function");
        });

        describe("the 'getKeyRange' method", function() {
            var keyrange;
            beforeEach(function() {
                keyrange = storage.getKeyRange(0, 3);
            });

            it("should return a promise", function() {
                expect(keyrange).to.have.property("then")
                    .which.is.a("function");
            });
            it("...whose value should be a Buffer", function() {
                return expect(keyrange).to.eventually.satisfy(Buffer.isBuffer);
            });
            it("...which is correct", function() {
                return expect(keyrange).to.eventually.satisfy(function(kr) {
                    return Buffer(keys[0].value + Storage.Word(0).toString()
                                  + keys[1].value, "hex").equals(kr);
                });
            });
        });
    });

    it("has a method 'Word'", function() {
        expect(Storage).to.have.property('Word')
            .which.is.a("function");
    });
    
    describe("its associated Word type", function() {
        var word = Storage.Word(57);
        it("should take a number as an argument", function() {
            expect(word).to.exist;
        });
        it("should return a Buffer of length 32", function() {
            expect(word).to.satisfy(Buffer.isBuffer).and
                .to.satisfy(function(w) {return w.length == 32});
        });
        it("'.toString' should return hex", function() {
            expect(word.toString()).to.equal("00000000000000000000000000\
00000000000000000000000000000000000039");
        });
    });
});
