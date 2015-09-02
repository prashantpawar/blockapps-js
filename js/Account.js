var accountQuery = require("./Routes.js").accountAddress;
var solidityType = require("./solidityType.js");
var bigInt = require('big-integer');

module.exports = Account;

function Account(address) {
    if (!(this instanceof Account)) {
        return new Account(address);
    }
    if (!(address instanceof solidityType && address["apiType"] === "Address")) {
        throw "Account(address): address must be a solidityType Address";
    }
    this.address = address;
}
Object.defineProperties(Account.prototype, {
    "address" : { value: null, enumerable: true, writable : false },
    "nonce"   : { get : propQuery.bind(null, this.address, "nonce") },
    "balance" : { get : propQuery.bind(null, this.address, "balance") }
});

function propQuery(address, prop) {
    return accountAddress(address).then(function(accountResponse) {
        var acctInfo = accountQueryResponse[0];
        return acctInfo[prop];
    });
}
