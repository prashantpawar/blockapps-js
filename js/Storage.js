var storageQuery = require("./Routes.js").storage;
var Int = require("./Int.js");
var Address = require("./Address.js");

module.exports = Storage;
function Storage(address) {
    this.address = Address(address).toString();
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
    var promise = storageQuery({
        "minkey":first.toString(10),
        "maxkey":maxKey.toString(10),
        "address":this.address
    });
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

module.exports.Word = EthWord;
module.exports.Word.zero = EthWord.bind(undefined, "00");
function EthWord(x) {
    if (typeof x === "string" && x.match(/[0-9a-fA-F]/) === null) {
        throw "EthWord(x): x must be a hex string";
    }
    if (typeof x == "number" || Int.isInstance(x)) {
        x = x.toString(16);
    }
    if (x.length % 2 != 0) {
        x = "0" + x;
    }
    var numBytes = hexString.length / 2

    if (numBytes > 32) {
        throw "EthWord(x): x must have at most 32 bytes";
    }

    var result = new Buffer(32);
    result.fill(0);
    result.write(hexString, 32 - numBytes, numBytes, "hex");
    return result;
}
