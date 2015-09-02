var ethTransaction = require('ethereumjs-tx');
var privateToAddress = require('ethereumjs-util').privateToAddress;
var submitTransaction = require("./Routes.js").submitTransaction;
var Account = require("./Account.js");

module.exports = Transaction;

// argObj = {
//   data:, value:, gasPrice:, gasLimit:
// }
function Transaction(argObj) {
    var tx = new ethTransaction();
    tx.gasPrice = argObj.gasPrice;
    tx.gasLimit = argObj.gasLimit;
    tx.value = argObj.value;
    tx.data = argObj.data;

    return function(addressTo, privKeyFrom) {
        tx.from = privateToAddress(privKeyFrom).toString("hex");
        tx.to = (addressTo ==/* Intentional */ undefined) ? "" : addressTo;
        
        Object.defineProperty(tx, "partialHash", {
            get : function() {
                return bufToString(this.hash());
            }
        });

        return Account(tx.from).nonce.then(function(nonce) {
            tx.nonce = nonce;
            tx.sign(privKeyFrom);
            tx.toJSON = txToJSON;
            return submitTransaction(tx);
        })
    }
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
