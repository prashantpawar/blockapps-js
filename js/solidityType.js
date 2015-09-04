var Int = require("./Int.js");
var Address = require("./Address.js");
var nodeEnum = require('enum');
var sha3 = require("./Crypto").sha3;
var EthWord = require("./Storage.js").Word;
var Transaction = require("./Transaction.js");
var Promise = require('bluebird');

/*
 *  solMethod
 */

module.exports.solMethod = solMethod;
function solMethod(symRow) {
    var fArgs = symRow["functionArgs"];
    var fDomain = symRow["functionDomain"];
    var fRet = symRow["functionReturns"];
    return {
        set args (argObj) {
            if (typeof argObj !== "object") {
                throw "Solidity function call: \"args\" must be " +
                    "an object of the form {argName: {} ..}";
            }
            var arr = fArgs.map(function(arg) {
                if (argObj[arg] === undefined) {
                    throw "Solidity function \"" + sym + "\": " +
                        "arguments must include \"" + arg + "\"";
                }
                return readInput(fDomain[arg], argObj[arg]);
            });
            Object.defineProperty(this, "_data", {
                value : funcArgs(symRow, arr)
            });
        },
        set argList (argList) {
            if (Object.getPrototypeOf(argList).constructor !== Array) {
                throw "Solidity function call: " +
                    "\"argList\" must be an array";
            }
            if (argList.length !== fArgs.length) {
                throw "Solidity function \"" + sym + "\": " +
                    "must be exactly " + fArgs.length + " arguments";
            }

            var arr = fArgs.forEach(function(arg, i) {
                return readInput(fDomain[arg], argObj[i]);
            });
            Object.defineProperty(this, "_data", {
                value : funcArgs(symRow, arr)
            });
        },
        set txParams (txParams) {
            ["value", "gasPrice", "gasLimit"].map(function(param) {
                if (txParams[param] === undefined) {
                    throw "Solidity function call: \"txParams\"" +
                        "must be {value, gasPrice, gasLimit}";
                }
            });
            Object.defineProperty(this, "_params", {
                value: txParams
            });
        },
        callFrom : function(from) {
            if (this._data === undefined) {
                throw "Solidity function call: must invoke .args|.argsList first";
            }
            this._params.data = this._data;
            return function(to, from) {
                return Transaction(this._params)(from, to).get("response").
                    then(decodeReturn.bind(null, fRet));
            }
        }
    };
}

function funcArgs(symRow, x) {
    var symRow1 = {
        "jsType" : "Array",
        "arrayElements" : symRow["functionDomain"]
    };
    return symRow["functionHash"] + funcArg(symRow1, x);
}

function funcArg(symRow1, y) {
    var type = symRow1["jsType"];
    switch (type) {
    case "Address":
        var result = y.toString();
        for (var i = 0; i < 12; ++i) {
            result = "00" + result;
        }
        return result;
    case "Bool":
        var result = y ? "01" : "00";
        for (var i = 0; i < 31; ++i) {
            result = "00" + result;
        }
        return result;
    case "Bytes":
        var length = isDynamic(symRow1) ? null : y.length;
        return encodingBytes(y.toString("hex"), length);
    case "Int":
        if (y.geq(0)) {
            var result = y.toString(16);
            if (result.length % 2 != 0) {
                result = "0" + result;
            }
            while (result.length < 64) {
                result = "00" + result;
            }
            return result;
        }
        else {
            return funcArg(symRow1, y.plus(Int(2).pow(256)));
        }
    case "String":
        return encodingBytes(y.toString("utf8"), null);
    case "Array":
        var eltRows = symRow1["arrayElements"];
        if (eltRows === undefined) {
            eltRows = (new Array(y.length)).map(function() {
                return symRow1["arrayElement"];
            });
        }

        var totalHeadLength = 0;
        var head = [];
        var tail = [];
        y.forEach(function(obj, i) {
            var objRow = eltRows[i];
            if (isDynamic(objRow)) {
                totalHeadLength += 32;
                head.push(undefined);
                tail.push(funcArg(objRow, obj));
            }
            else {
                var enc = funcArg(rowObj, obj);
                totalHeadLength += enc.length/2; // Bytes not nibbles
                head.push(enc);
                tail.push("");
            }
        })

        var currentTailLength = 0;
        head = head.map(function(z, i) {
            var lastTailLength = currentTailLength;
            currentTailLength += tail[i].length;
            if (z === undefined) {
                return funcArg({"jsType" : "Int"},
                          Int(totalHeadLength + lastTailLength));
            }
            else {
                return z;
            }
        });

        var enc = head.join("") + tail.join("");
        if (isDynamic(symRow1)) {
            len = funcArg({"jsType": "Int"}, Int(y.length));
            enc = len + enc
        }

        return enc;
    default:
        throw "Solidity function call: cannot pass an argument of type " + type;
    }
}


function encodingBytes(hexString, length) {
    var result = hexString;
    while (result.length % 32 != 0) {
        result = result + "00";
    }

    if (length !== null) {
        var len = funcArg({"jsType" : "Int"}, Int(hexString.length));
        result = len + result;
    }
    
    return result;
}

function decodeReturn(symRow, x) {
    function getLength(symRow1) {
        if (!isDynamic(symRow1)) {
            return parseInt(symRow1.arrayLength,16);
        }
        else {
            return go({ "jsType" : "Int" });
        }
    }
    
    function go(symRow1) {
        var type = symRow1["jsType"];
        switch (type) {
        case "Address":
            var result = new Buffer(20);
            result.write(x,24,40,"hex");
            x = x.slice(64);
            return result;
        case "Bool":
            var result = (x.slice(0,64)[-1] === '1');
            x = x.slice(64);
            return result;
        case "Bytes":
            var length = getLength(symRow1);
            var roundLength = Math.floor(length + 32); // Rounded up

            var result = (new Buffer(length)).write(x,0,length,"hex");
            x = x.slice(roundLength);
            return result;
        case "Int":
            var result = Int(x.slice(0,64));
            x = x.slice(64);
            return result;
        case "String":
            return go({ "jsType" : "Bytes" }).toString("utf8");            
        case "Array":
            var length = getLength(symRow1);
            x = x.slice(length * 64); // drop the "heads"

            var eltRow = symRow1["arrayElement"];
            return (new Array(length)).map(go.bind(null, eltRow));
        default:
            throw "Solidity function call: return value cannot have type " + type;
            break;
        }
    }
    return go(symRow);
}

/*
 *  readInput
 */

module.exports.readInput = readInput;
function readInput(symRow, x) {
    var type = symRow["jsType"];
    switch(type) {
    case "Address":
        return Address(x);
    case "Array":
    case "Bool":
        return x;
    case "Bytes":
        var bytes = isDynamic(symRow) ? symRow["arrayLength"] : symRow["bytesUsed"];
        bytes = parseInt(bytes, 16);
        
        if (typeof x !== "string") {
            throw "Solidity value: type Bytes: takes hex string input";
        }
        if (x.slice(0,2) === "0x") {
            x = x.slice(2);
        }
        if (x.lengh % 2 != 0) {
            x = "0" + x;
        }
        if (x.length > bytes) {
            throw "Solidity value: type Bytes: " +
                "maximum " + bytes + " bytes (" + 2*bytes + " hex digits) allowed";
        }
        var buf = Buffer(bytes);
        buf.write(x, bytes - x.length/2, x.length, "hex");
        return buf;
    case "Enum":
        return x;
    case "Int":
        return Int(x);
    case "String":
        return x;
    case "Struct":
        if (typeof x !== "object") {
            throw "Solidity value: type Struct: takes object input";
        }

        var fields = symRow["structFields"];
        var result = {};
        for (fieldName in x) {
            var fieldRow = fields[fieldName];
            if (fieldRow === undefined) {
                throw "Solidity value: type Struct: " +
                    "does not have a field \"" + fieldName + "\"";
            }
            result[fieldName] = readInput(fieldRow, x[fieldName]);
        }

        for (fieldName in fields) {
            if (!(fieldName in result)) {
                throw "Solidity value: type Struct: " +
                    "missing field \"" + fieldName + "\"";
            }
        }

        return result;
    default:
        throw "Solidity value: cannot read type " + type + " from input";
    }
}

/*
 *  readSolVar
 */

module.exports.readSolVar = readSolVar;
function readSolVar(symRow, storage) {
    var type = symRow["jsType"];
    switch(type) {
    case "Address":
        return simpleBuf(symRow, storage).then(Address);
    case "Array":
        if (isDynamic(symRow)) {
            symRow = dynamicRow(symRow, storage);
        }

        return Promise.join(symRow, function(symRow) {
            var arrElt = symRow["arrayElement"];
            var eltRow = {};
            for (var name in arrElt) {
                eltRow[name] = arrElt[name];
            };
            eltRow["atStorageKey"] = symRow["atStorageKey"];
            eltRow["atStorageOffset"] = "0x0";

            var eltSize = parseInt(eltRow["bytesUsed"],16);
            var numElts = parseInt(symRow["arrayLength"],16);

            var arrayCR = parseInt(symRow["arrayNewKeyEach"],16);
            var arrayCRSkip = (eltSize < 32 ? 1 : eltSize / 32);

            var result = [];
            while (result.length < numElts) {
                result.push(readSolVar(eltRow, storage));
                
                if (result.length % arrayCR == 0) {
                    var oldKey = Int(eltRow["atStorageKey"]);
                    eltRow["atStorageKey"] = oldKey.plus(arrayCRSkip).toString(16);
                    eltRow["atStorageOffset"] = "0x0";
                }
                else {
                    var oldOff = parseInt(eltRow["atStorageOffset"]);
                    eltRow["atStorageOffset"] = (eltSize + oldOff).toString(16);
                }
            }
            return Promise.all(result);
        });

    case "Bool":
        return simpleBuf(symRow, storage).get(0).then(Object.is.bind(1));
    case "Bytes":
        if (!isDynamic(symRow)) {
            return simpleBuf(symRow, storage);
        }
        else {
            dynamicRow(symRow, storage).then(function(symRow) {
                var length = parseInt(symRow["arrayLength"],16);
                var realKey = symRow["atStorageKey"];
                
                var numSlots = (length + 31)/32; // Round up
                return storage.getKeyRange(realKey,numSlots).call(slice,0,length);
            });
        }
    case "Enum":
        var symRow1 = {}
        for (var name in symRow) {
            symRow1[name] = symRow[name];
        }
        symRow1["jsType"] = "Int";
        return readSolVar(symRow1, storage).call(valueOf);
    case "Int":
        return simpleBuf(symRow, storage).then(Int);
    case "String":
        var symRow1 = {}
        for (var name in symRow) {
            symRow1[name] = symRow[name];
        }
        symRow1["jsType"] = "Bytes";
        return readSolVar(symRow1, storage).call(toString, "utf8");
    case "Struct":
        var structFields = symRow["structFields"];
        var baseKey = Int(symRow["atStorageKey"]);
        
        var result = {};
        for (var field in structFields) {
            var structField = structFields[name];
            var fieldRow = {};
            for (var name in structFields[field]) {
                fieldRow[name] = structField[name];
            }
            var fieldKey = Int(fieldRow["atStorageKey"]);
            var realKey = baseKey.plus(fieldKey);
            fieldRow["atStorageKey"] = baseKey.plus(fieldKey).toString(16);
            if (isDynamic(fieldRow)) {
                var realKeyHex = EthWord(realKey.toString(16)).toString();
                fieldRow["arrayDataStart"] = sha3(realKeyHex);
            }
            result[field] = readSolVar(fieldRow, storage);
        }

        return Promise.props(result);
    default:
        throw "Solidity contract: cannot read type " + type + " from storage";
    }
}

function dynamicRow(symRow, storage) {
    var key = EthWord(symRow["atStorageKey"]);
    var length = storage.getSubKey(key,0,32).call(toString, "hex");
    var realKey = symRow["arrayDataStart"];

    var result = {};
    for (var name in symRow) {
        result[name] = symRow[name];
    }
    result["atStorageKey"] = realKey;
    result["arrayLength"] = length;
    delete result["arrayDataStart"];

    return Promise.props(result);
}

function simpleBuf(symRow, storage) {
    var symKey = EthWord(symRow["atStorageKey"]);
    var symOffset = (typeof symRow["atStorageOffset"] === "undefined") ?
        "0x0" : symRow["atStorageOffset"];
    var intOffset = parseInt(symOffset,16);
    var intBytes = parseInt(symRow["bytesUsed"],16);

    return storage.getSubKey(symKey, intOffset, intBytes);
}

function isDynamic(symRow) {
    switch (symRow["jsType"]) {
    case "Array": case "Bytes": case "String":
        if (symRow["arrayLength"] === undefined) {
            return true;
        }
        // Fall through!
    default:
        return false;
    }
}
