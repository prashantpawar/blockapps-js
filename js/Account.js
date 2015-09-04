var accountQuery = require("./Routes.js").accountAddress;
var solidityType = require("./solidityType.js");
var Address = require("./Address.js");

module.exports = Account;

function Account(address) {
    if (!(this instanceof Account)) {
        return new Account(address);
    }
    Address.assert(address, "Account(address): address ");
    this.address = address;
}
Object.defineProperties(Account.prototype, {
    "address" : { value: null, enumerable: true, writable : false },
    "nonce"   : { get : propQuery.bind(null, this.address, "nonce") },
    "balance" : { get : propQuery.bind(null, this.address, "balance") }
});

function propQuery(address, prop) {
    return accountAddress(address).get(0).get(prop);
}
