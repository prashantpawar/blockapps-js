var accountQuery = require("./Routes.js").accountAddress;
var solidityType = require("./solidityType.js");
var Address = require("./Address.js");

module.exports = Account;

function Account(address) {
    this.address = Address(address);
}
Object.defineProperties(Account.prototype, {
    "address" : { value: null, enumerable: true, writable : false },
    "nonce"   : { get : propQuery.bind(null, this.address, "nonce") },
    "balance" : { get : propQuery.bind(null, this.address, "balance") }
});

function propQuery(address, prop) {
    return accountAddress(address).get(prop).then(Int);
}
