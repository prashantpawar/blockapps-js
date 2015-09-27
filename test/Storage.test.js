describe("Storage", function() {
    before(function() {
        Storage = lib.ethbase.Storage;
        storage = Storage(address);
    });
    
    it("should return a new Storage object", function() {
        expect(Storage).to.be.a('function');
    });
    it("should take an address as an argument", function() {
        expect(storage).to.exist;
    });

    describe("when initialized with an address", function() {
        var keys = [
            {
                "value": 
                "0011223344556677889900112233445566778899001122334455667788990011",
                "key":
                "0000000000000000000000000000000000000000000000000000000000000000"
            },
            {
                "value":
                "0000000000000000000000000000000000000000000000000000000000000400",
                "key":
                "0000000000000000000000000000000000000000000000000000000000000002"
            }
        ];
        beforeEach(function () {
            blockapps
                .get("/storage")
                .query({address: address, keyhex: "1"})
                .reply(200, [])
                .get("/storage")
                .query({address: address, minkey: 0, maxkey: 2})
                .reply(200, keys)
                .get("/storage")
                .query({address: address, keyhex: "0"})
                .reply(200, [keys[0]])
                .get("/storage")
                .query({address: address, keyhex: Address(0).toString()})
                .reply(200, [keys[0]]);
        });
        afterEach(function () {
            nock.cleanAll();
        });

        it("should have a method 'getSubKey'...", function() {
            expect(storage).to.have.property('getSubKey')
                .which.is.a('function');
        });

        describe("the 'getSubKey' method", function() {
            beforeEach(function() {
                subkey = storage.getSubKey("0",10,10);
            });

            it("should return a promise", function() {
                expect(subkey).to.have.property("then").which.is.a("function");
            });
            it("...whose value should be a Buffer", function() {
                return expect(subkey).to.eventually.satisfy(Buffer.isBuffer);
            });
            it("...which is correct", function() {
                return expect(subkey.call("toString", "hex"))
                    .to.eventually.equal("22334455667788990011");
            });
            it("should return zero for a nonexistent key", function() {
                subkey = storage.getSubKey("1", 3, 5);
                return expect(subkey.call("toString", "hex"))
                    .to.eventually.equal("0000000000");
            });
        });

        it("should have a method 'getKeyRange'...", function() {
            expect(storage).to.have.property('getKeyRange').which.is.a("function");
        });

        describe("the 'getKeyRange' method", function() {
            var keyrange;
            beforeEach(function() {
                keyrange = storage.getKeyRange(0, 3);
            });

            it("should return a promise", function() {
                expect(keyrange).to.have.property("then").which.is.a("function");
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
        expect(Storage).to.have.property('Word').which.is.a("function");
    });
    
    describe("its associated Word type", function() {
        before(function() {
            word = Storage.Word(57);
        });
        it("should take a number as an argument", function() {
            expect(word).to.exist;
        });
        it("should return a Buffer of length 32", function() {
            expect(word).to.satisfy(Buffer.isBuffer);
            expect(word.length).to.equal(32);
        });
        it("'.toString' should return hex", function() {
            expect(word.toString()).to.equal(
                "0000000000000000000000000000000000000000000000000000000000000039"
            );
        });
    });
});
