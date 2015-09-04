var EthWord = require("./EthWord.js");
var storageQuery = require("./Routes.js").storage;
var Int = require("./Int.js");
var Address = require("./Address.js");

module.exports = Storage;

function Storage(address) {
    Address.assert(address, "Storage(x): address ");
    this.address = address.toString();
}
Storage.prototype = {
    "address" : "",
    "getSubKey" : getSubKey,
    "getKeyRange" : getKeyRange
};

function getSubKey(key, start, size) {
    var promise = storageQuery({"keyhex":key, "address":this.address});
    return promise.then(function(storageQueryResponse) {
        var keyValue;
        if (storageQueryResponse.length === 0) {
            keyValue = EthWord.zero();
        }
        else {
            keyValue = EthWord(storageQueryResponse[0]["value"]);
        }
        return keyValue.slice(start, start + size);
    });
}

function getKeyRange(start, itemsNum) {
    var first = Int(start);
    var maxKey = first.plus(itemsNum - 1).toString(16);
    var promise = storageQuery({"minkey":start, "maxkey":maxKey,
                                "address":this.address});
    return promise.then(function(storageQueryResponse){
        var output = [];
        storageQueryResponse.map(function(keyVal) {
            var thisKey = Int(keyVal.key);
            var skipped = thisKey.minus(first).minus(output.length);
            pushZeros(output, skipped);
            output.push(EthWord(keyVal.value));
        });
        var remaining = itemsNum - output.length;
        pushZeros(output, remaining);
        return Buffer.concat(output, 32 * itemsNum);        
    });
}

function pushZeros(output, count) {
    for (var i = 0; i < count; ++i) {
        output.push(EthWord.zero());
    }
}
