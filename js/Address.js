var Int = require("./Int.js")

module.exports = Address;

function Address(x) {
    if (x.isAddress) {
        return x;
    }
    if (typeof x === "number" || Int.isInstance(x)) {
        x = x.toString(16);
    }

    var result;
    if (typeof x === "string") {
        result = new Buffer(20);
        result.fill(0);
        if (x.slice(0,2) === "0x") {
            x = x.slice(2);
        }
        if (x.length > 40) {
            x = x.slice(-40);
        }
        if (x.length % 2 != 0) {
            x = "0" + x;
        }
        var byteLength = x.length/2;
        result.write(x, 20 - byteLength, byteLength, "hex");
    }
    else if (Buffer.isBuffer(x)) {
        result = x.slice(-20);
    }
    else {
        throw "Address(x): x must be a number, a hex string, or a Buffer";
    }
    result.toString = function() {
        return Buffer.prototype.toString.call(this,"hex");
    };
    result.isAddress = true;
    return result;
}
