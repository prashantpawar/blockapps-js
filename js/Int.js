var bigInt = require('big-integer');

module.exports = Int;
module.exports.assert = assertInt;
module.exports.isInstance = bigInt.isInstance

function Int(x) {
    var result;
    if (typeof x === "number" || Int.isInstance(x)) {
        result = bigInt(x);
    }
    else if (typeof x === "string") {
        if (x.slice(0,2) === "0x") {
            x = x.slice(2);
        }
        result = bigInt(x,16);
    }
    else if (Buffer.isBuffer(x)) {
        result = bigInt(x.toString("hex"),16);
    }
    else {
        throw "Int(x): x must be a number, hex string, or Buffer";
    }

    return result;
}

function assertInt(x, prefix) {
    if (!bigInt.isInstance(x)) {
        throw "" + prefix + "was not created by Int()";
    }
}
