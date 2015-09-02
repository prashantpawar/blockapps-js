var solc = require("./Routes.js").solc;
var solidityType = require("./solidityType.js");
var Account = require("./Account.js");
var Transaction = require("./Transaction.js");
var Storage = require("./Storage.js");

module.exports = Solidity;

function Solidity(code) {
    return solc(code).then(function(x) {
        var result = Object.create(Solidity.prototype);
        result.code = code;
        result.vmCode = x.vmCode;
        result.symTab = x.symTab;
        return result;
    }).catch(function(e) {
        throw "Solidity(code): " + e;
    });
}
Solidity.prototype = {
    "code" : "",
    "vmCode" : null,
    "symTab" : null,
    "constructor" : Solidity,
    "newContract" : SolContract
};

// txParams = {value, gasPrice, gasLimit, privkey}
function SolContract(txParams) {
    var solObj = this;
    txParams.data = this.vmCode;
    return Transaction(txParams)(null, txParams.privKey).then(function(txResponse){
        if (txResponse.contractsCreated.length !== 1) {
            throw "Solidity(code).newContract(_): " +
                "code must create one and only one account";
        }
        var newAddr = txResponse.contractsCreated[0];
        var result = Object.create(solObj);
        var storage = new Storage(newAddr);
        result.account = new Account(solidityType.newAddress().canonStr(newAddr));
        result.state = {};
        for (var sym in solObj.symTab) {
            var symRow = solObj.symTab[sym];
            if (symRow["atStorageKey"] === undefined &&
                symRow["jstype"] !== "Function") { // user-defined types
                continue;
            }
            result.state[sym] = solidityType(symRow).storage(storage);
        }
        return result;
    }).catch(function(e) {
        throw "Solidity.newContract(txParams): " + e;
    });
};
