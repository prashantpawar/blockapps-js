module.exports = Address;
module.exports.assert = assertAddress;

function Address(x) {
    var result = new Buffer(20);
    if (typeof x === "number") {
        x = x.toString(16);
    }
    if (typeof x === "string") {
        hexStringToBuffer.call(result, x);
    }
    else if (Buffer.isBuffer(x)) {
        x.copy(result, 20 - x.length);
    }
    else {
        throw "Address(x): x must be a number, a hex string, or a Buffer";
    }
    result.toString = Buffer.prototype.toString.bind(this,"hex");
    result.isAddress = true;
    return result;
}

function assertAddress(x, prefix) {
    if (!x.isAddress) {
        throw "" + prefix + "was not created by Address()";
    }
}

function hexStringToBuffer(hexString) {
    this.fill(0);

    if (hexString.slice(0,2) === "0x") {
        hexString = hexString.slice(2);
    }
    if (hexString.length > 40) {
        hexString = hexString.slice(-40);
    }
    if (hexString.length % 2 != 0) {
        hexString = "0" + hexString;
    }

    var byteLength = hexString.length/2;
    this.write(hexString, 20 - byteLength, byteLength, "hex");
}
