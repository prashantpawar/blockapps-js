var bigInt = require('big-integer');
var bigNum = require('bignumber.js');

module.exports = Int;
module.exports.isInstance = bigInt.isInstance

function Int(x) {
    var result;
    if (typeof x === "number" || Int.isInstance(x)) {
        result = bigInt(x);
    }
    else if (typeof x === "string") {
        if (x.slice(0,2) === "0x") {
            x = x.slice(2);
            result = bigInt(x,16);
        }
        else {
            result = bigInt(x,10);
        }
    }
    else if (Buffer.isBuffer(x)) {
        if (x.length == 0) {
            result = bigInt(0);
        }
        else {
            result = bigInt(x.toString("hex"),16);
        }
    }
    else {
        try {
            result = bigInt(x.toString(), 10);
        }
        catch (e) {
            var err = "Received exception:\n" + e + "\n" +
                "Int(x): x must be a number, hex string, or Buffer";
            throw new Error(err);
        }
    }

    return result;
}
