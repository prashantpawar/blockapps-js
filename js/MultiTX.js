var Address = require("./Address.js");
var Account = require("./Account.js");
var Solidity = require("./Solidity.js");
var solidityType = require("./solidityType");
var Transaction = require("./Transaction.js");
var ethTypes = {
    "Int": require("./Int.js"),
    "Address": require("./Address.js"),
}

module.exports = MultiTX;

var multiplexer = Solidity.attach({
    "address": "1e6c341f2fc96503250852ed8a20a2a654fbe0cc",
    "code": "",
    "name": "multiplexer",
    "vmCode": "",
    "symTab": {
        "creator" : {
            "solidityType" : "address",
            "jsType" : "Address",
            "atStorageKey" : 0,
            "bytesUsed" : 20
        },
        "fee" : {
            "solidityType" : "uint256",
            "jsType" : "Int",
            "atStorageKey" : 1,
            "bytesUsed" : 20
        }
    }
});

function argEncode(type, value) {
    return solidityType.funcArg({"jsType" : type}, ethTypes[type](value));
}

function MultiTX(txArray) {
    if (arguments.length > 1 || !(arguments[0] instanceof Array) ) {
        throw "MultiTX takes one array as an argument";
    }

    var totalValue = ethTypes.Int(0);
    var rets = [];
    var multiTX = argEncode("Int", txArray.length);
    txArray.forEach(function(tx) {
        totalValue = totalValue.add(ethTypes.Int(tx.value));

        multiTX += argEncode("Int", tx.value);
        multiTX += argEncode("Int", tx.data.length) + tx.data.toString("hex");
        if (tx.to.length == 0) {
            multiTX += argEncode("Address", 0);
            rets.push({
                "solidityType" : "address",
                "jsType" : "Address",
                "bytesUsed" : 20
            });
            return;
        }
        else {
            multiTX += argEncode("Address", tx.to);
        }

        var retLength = 0;
        if (tx._ret !== undefined) {
            retLength = solidityType.encodingLength(tx._ret);
        }
        multiTX += argEncode("Int", retLength) + argEncode("Int", tx.gasLimit);
        
        rets.push(tx._ret);
    });

    var tx = Transaction({
        "data" : multiTX,
        "to" : multiplexer.account.address
    });
    Object.defineProperties(tx, {
        multiValue: { "value" : totalValue },
        multiRets: { "value" : rets },
        multiSend: { "value" : sendMultiTX, enumerable : true},
        txParams: { "value" : txParams, enumerable : true}
    });

    return tx;
}

function txParams(params) {
    var tx = this;
    ["gasPrice", "gasLimit"].forEach(function(param) {
        if (param in params) {
            tx[param] = params[param];
        }
    });
    return tx;
}

function sendMultiTX(privkey) {
    var tx = this;
    return multiplexer.state.fee.then(function(fee) {
        tx.value = tx.multiValue.add(fee).toString(16);
        return tx.send(privkey);
    }).get("response").then(function(returns) {
        var retBytes = new Buffer(returns, "hex");
        var noMore = false;
        return tx.multiRets.map(function(retType) {
            if (noMore) {
                return undefined;
            }
            
            var thisReturn;
            if (retType === undefined) {
                thisReturn = new Buffer(0);
            }
            else {
                var retLen = parseInt(retType["bytesUsed"], 16);
                thisReturn = retBytes.slice(0, retLen);
                retBytes = retBytes.slice(retLen);
            }
            
            var retStatus = retBytes[0];
            retBytes = retBytes.slice(1);

            noMore = ((retStatus & 0x10) != 0);
            var success = ((retStatus & 0x01) == 0);

            if (success) {
                return solidityType.decodeReturn(retType, thisReturn);
            }
            else {
                return undefined;
            }                            
        });
    });
}
