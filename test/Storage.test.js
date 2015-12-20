describe("Storage", function() {
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
    function query(obj) {
        var result = {"address": address};
        for (name in obj) {
            result[name] = obj[name];
        }
        return result;
    }
    
    before(function() {
        storage = Storage(address);
    });
    after(function() {
        delete storage;
    });
    
    it("should take an address, returning a new Storage object", function() {
        expect(storage).to.be.an.instanceOf(Storage);
    });

    it("should have 'address', 'getSubKey', 'getKeyRange', 'Word'", function() {
        expect(storage).to.have.property("address").which.equals(address);
        expect(Storage.prototype).to.have.property("getSubKey");
        expect(Storage.prototype).to.have.property("getKeyRange");
        expect(Storage).to.have.property("Word");
    });
    
    describe("the 'getSubKey' method", function() {
        it("should return a promise of a Buffer containing the subkey", function(){
            var mock = getRoutes.storage({
                reply: [keys[0]],
                query: query({"keyhex" : "0"})
            });
            var subkey = storage.getSubKey("0",10,10);
            return expect(subkey).to.eventually.satisfy(function(buf) {
                return (new Buffer("22334455667788990011", "hex")).equals(buf);
            });
        });
        it("should return zero for a nonexistent key", function() {
            getRoutes.storage({
                reply: [],
                query: query({"keyhex" : "1"})
            });
            var subkey = storage.getSubKey("1", 3, 5);
            return expect(subkey).to.eventually.satisfy(function(buf) {
                return (new Buffer("0000000000", "hex")).equals(buf);
            });
        });
    });

    describe("the 'getKeyRange' method", function() {
        it("should return a promise of a Buffer containing the range", function(){
            getRoutes.storage({
                reply: keys,
                query: query({minkey: 0, maxkey: 2})
            });
            var keyrange = storage.getKeyRange(0, 3);
            return expect(keyrange).to.eventually.satisfy(function(kr) {
                return Buffer(keys[0].value + Storage.Word(0).toString()
                              + keys[1].value, "hex").equals(kr);
            });
        });
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
