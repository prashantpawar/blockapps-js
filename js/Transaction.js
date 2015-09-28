var ethTransaction = require('ethereumjs-tx');
var privateToAddress = require('ethereumjs-util').privateToAddress;
var submitTransaction = require("./Routes.js").submitTransaction;
var Account = require("./Account.js");
var Address = require("./Address.js");
var Int = require("./Int.js");

module.exports = Transaction;
module.exports.defaults = {
    "value": 0,
    "gasPrice": 1,
    "gasLimit": 3141592
};

// argObj = {
//   data:, value:, gasPrice:, gasLimit:
// }
function Transaction(argObj) {
    var tx = new ethTransaction();
    if (argObj === undefined) {
        argObj = module.exports.defaults;
    }
    
    tx.gasPrice = !("gasPrice" in argObj) ?
        module.exports.defaults.gasPrice : Int(argObj.gasPrice).toString(16);
    tx.gasLimit = !("gasLimit" in argObj) ?
        module.exports.defaults.gasLimit : Int(argObj.gasLimit).toString(16);
    tx.value    = !("value" in argObj) ?
        module.exports.defaults.value : Int(argObj.value).toString(16);
    tx.data = argObj.data;
    
    if (argObj.to !== undefined) {
        tx.to = Address(argObj.to).toString();
    }
    tx.toJSON = txToJSON;
    
    Object.defineProperty(tx, "partialHash", {
        get : function() {
            return bufToString(this.hash());
        },
        enumerable : true
    });
    
    tx.send = function(privKeyFrom, addressTo) {
        privKeyFrom = new Buffer(privKeyFrom,"hex");
        var fromAddr = Address(privateToAddress(privKeyFrom));
        tx.from = fromAddr.toString();
        if (addressTo !=/* Intentional */ undefined) {
            tx.to = Address(addressTo).toString();
        }

        return Account(fromAddr).nonce.then(function(nonce) {
            tx.nonce = nonce.toString(16);
            tx.sign(privKeyFrom);
            return submitTransaction(tx);
        })
    }
    return tx;
}

function txToJSON() {
    var result = {
        "nonce"      : bufToNum(checkZero(this.nonce)),
        "gasPrice"   : bufToNum(checkZero(this.gasPrice)),
        "gasLimit"   : bufToNum(checkZero(this.gasLimit)),
        "value"      : bufToNum(checkZero(this.value)).toString(10),
        "codeOrData" : bufToString(this.data),
        "from"       : bufToString(this.from),
        "to"         : bufToString(this.to),
        "r"          : bufToString(this.r),
        "s"          : bufToString(this.s),
        "v"          : bufToString(this.v),
        "hash"       : this.partialHash
    }
    if (result["to"].length === 0) {
        delete result["to"];
    }
    return result;
}

function bufToNum(buf) {
    return parseInt(bufToString(buf),16);
}

function bufToString(buf) {
    return buf.toString("hex");
}

function checkZero(buf) {
    return (buf.length === 0) ? new Buffer([0]) : buf;
}
