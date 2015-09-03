var solc = require("./Routes.js").solc;
var Account = require("./Account.js");
var Transaction = require("./Transaction.js");
var Storage = require("./Storage.js");
var EthWord = require("./EthWord.js");
var sha3 = require("Crypto").sha3;

var solidityType = require("./solidityType.js");
var readSolVar = solidityType.readSolVar;
var readInput = solidityType.readInput;
var solMethod = solidityType.method;

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
            switch (symRow["jsType"]) {
            case "Function":
                result.state[sym] = solMethod(symRow);
                break;
            case "Mapping":
                var mapKey = EthWord(symRow["atStorageKey"]).toString();
                var keyRow = symRow["mappingKey"];
                var valRow = symRow["mappingVaue"];

                result.state[sym] = {
                    set key (x) {
                        var keyObj = readInput(keyRow, x);
                        var key = sha3(keyObj.storageBytes() + mapKey);
                        valRow["atStorageKey"] = key;
                        result.state[sym].value = readSolVar(valRow, storage);
                    }
                };
                break;
            case "Struct":
                if (symRow["atStorageKey"] === undefined) {
                    continue;
                }
                var userName = symRow["solidityType"];
                var structFields = solObj.symTab[userName]["structFields"];
                symRow["structFields"] = structFields;
                // fall through!
            default:
                Object.defineProperty(result.state, sym, {
                    get : readSolVar.bind(null, symRow, storage),
                    enumerable : true 
                });
                break;
            }
        }
        return result;
    }).catch(function(e) {
        throw "Solidity.newContract(txParams): " + e;
    });
};
