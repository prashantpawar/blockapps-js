module.exports = EthWord;
module.exports.zero = EthWord.bind(undefined, "00");

function EthWord(x) {
    if (typeof x !== "string" || x.match(/[0-9a-fA-F]/) === null) {
        throw "EthWord(x): x must be a hex string");
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
