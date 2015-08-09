var Contract = require("./Contract.js");
var Transaction = require("./Transaction.js");
var HTTPQuery = require("./HTTPQuery.js");

module.exports = Solidity;

function Solidity(code) {
    if (this instanceof Solidity) {
        this.code = code;
        this.vmCode = undefined;
//        this.abi = undefined;
        this.symtab = undefined;

        this.toContract = compileAndSubmit;
        this.compile = compileSolidity;
        this.submit = submitSolidity;
    }
    else {
        return new Solidity(code);
    }
}

// argObj = {
//   apiURL:, fromAccount:, value:, gasPrice:, gasLimit:
// }
function compileAndSubmit(argObj, callback) {
    function contractCallback(address) {
        var contract = Contract({
            address: address,
 //           abi: this.abi,
            symtab: this.symtab,
        });
        callback(contract);
    }
    function submitCallback(transaction) {
        transaction.contractCreated(argObj.apiURL, contractCallback.bind(this));
    }
    function compileCallback(solidity) { 
        submitSolidity.bind(this) (argObj, submitCallback.bind(this));
    }
    compileSolidity.bind(this)(argObj.apiURL, compileCallback.bind(this));
}

function submitSolidity(argObj, callback) {
    argObj.toAccount = Contract();
    argObj.data = this.vmCode;
    var submitTX = Transaction(argObj);
    submitTX.send(argObj.apiURL, callback);
}

function compileSolidity(apiURL, callback) {
    function getSolc(responseText) {
        var solcResult = JSON.parse(responseText);
        if (solcResult["contracts"].length != 1) {
            console.log("Code must define one and only one contract");
            return;
        }
        var name = solcResult["contracts"][0]["name"];
        this.symtab = solcResult["xabis"][name];
        //this.abi = solcResult["abis"][0]["abi"];
        this.vmCode = solcResult["contracts"][0]["bin"];
        if (typeof callback === "function") {
            callback(this);
        }
    }

    HTTPQuery.postAPI(apiURL + HTTPQuery.apiPrefix +
                      "/solc", "src=" + encodeURIComponent(this.code),
                      "application/x-www-form-urlencoded", getSolc.bind(this));
}
