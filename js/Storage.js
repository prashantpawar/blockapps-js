var storageQuery = require("./Routes.js").storage;
var Int = require("./Int.js");
var Address = require("./Address.js");
var NotDoneError = require("./pollPromise.js").NotDoneError;

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
    return promise.catch(NotDoneError, function() {
        return [{"key" : key, "value" : "0"}];
    }).get(0).then(function(storageItem) {
        var keyValue = EthWord(storageItem.value);
        return keyValue.slice(32 - (start + size), 32 - start);
    });
}

function getKeyRange(start, itemsNum) {
    var first = Int("0x" + start);
    var maxKey = first.plus(itemsNum - 1);
    var promise = storageQuery({
        "minkey":first.toString(10),
        "maxkey":maxKey.toString(10),
        "address":this.address
    });
    return promise.catch(NotDoneError, function() {
        return [];
    }).then(function(storageQueryResponse){
        var keyVals = {};
        storageQueryResponse.map(function(keyVal) {
            keyVals[EthWord(keyVal.key).toString()] = keyVal.value;
        });
        
        var output = new Array(itemsNum);
        for (var i = 0; i < itemsNum; ++i) {
            var keyi = EthWord(first.plus(i)).toString();
            if (keyi in keyVals) {
                output[i] = keyVals[keyi];
            }
            else {
                output[i] = EthWord.zero().toString();
            }
        }
        return Buffer(output.join(""),"hex");
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
    var numBytes = x.length / 2

    if (numBytes > 32) {
        throw "EthWord(x): x must have at most 32 bytes";
    }
    var result = new Buffer(32);
    result.fill(0);
    result.write(x, 32 - numBytes, numBytes, "hex");

    result.toString = Buffer.prototype.toString.bind(result, "hex");
    return result;
}
