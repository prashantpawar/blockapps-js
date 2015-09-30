var HTTPQuery = require("./HTTPQuery.js");
var Promise = require('bluebird');
var Address = require("./Address.js");
var pollPromise = require("./pollPromise.js");

module.exports.solc = solc;
function solc(code) {
    if (typeof code !== "string") {
        throw Promise.OperationalError("code must be a string");
    }
    return HTTPQuery("/solc", {"post": {"src":code}}).
        then(function(solcResponse) {
            if ("error" in solcResponse) {
                throw Promise.OperationalError(solcResponse.error);
            }
            if (solcResponse["contracts"].length != 1) {
                throw Promise.OperationalError(
                    "Code must (currently) define one and only one contract."
                );
            }
            else {
                var symTab0 = solcResponse["xabis"];
                var contractName = Object.keys(symTab0)[0];
                return {
                    "vmCode" : solcResponse["contracts"][0]["bin"],
                    "symTab" : symTab0[contractName],
                    "name"   : contractName
                };
            }
        });
}

module.exports.extabi = extabi;
function extabi(code) {
    if (typeof code !== "string" || code.match(/[0-9a-fA-F]*/) === null) {
        throw Promise.OperationalError("code must be a hex string");
    }
    return HTTPQuery("/extabi", {"post": {"src":code}}).
        then(function(extabi) {
            if (Object.keys(extabi).length != 1) {
                throw Promise.OperationalError(
                    "Code must (currently) define one and only one contract."
                );            
            }
            else {
                return extabi;
            }
        });
}

module.exports.faucet = faucet;
function faucet(address) {
    var addr = Address(address).toString();
    return HTTPQuery("/faucet", {"post": {"address" : addr}}).return(
        pollPromise(accountAddress.bind(null,addr))
    ).catch(Promise.TimeoutError, function(e) {
        throw new Error (
            "Faucet not yet run after " +
                pollPromise.defaults.pollTimeoutMS / 1000 + "seconds"
        );
    }).return()
}

module.exports.login = login;
// loginObj: email, app, loginpass
function login(loginObj, address) {
    if (typeof loginObj !== "object") {
        throw Promise.OperationalError(
            "must have loginObj = {email, app, loginpass}"
        );
    }
    loginObj.address = Address(address).toString();
    return HTTPQuery("/login", {"post": loginObj});
}

module.exports.wallet = wallet;
function wallet(loginObj, enckey) {
    if (typeof loginObj !== "object" || typeof enckey !== "string" ||
        !enckey.match(/^[0-9a-fA-F]*$/)) {
        throw Promise.OperationalError(
            "must have loginObj = {email, app, loginpass}, " +
                "enckey = encoded key, as hex string"
        );
    }
    loginObj.enckey = enckey;
    return HTTPQuery("/wallet", {"post": loginObj});
}

module.exports.developer = developer;
function developer(loginObj) {
    if (typeof loginObj !== "object") {
        throw Promise.OperationalError(
            "must have loginObj = {email, app, loginpass}"
        );
    }
    return HTTPQuery("/developer", {"post": loginObj});
}

module.exports.register = register;
// appObj: developer, appurl, repourl
function register(loginObj, appObj) {
    if (typeof loginObj !== "object") {
        throw Promise.OperationalError(
            "must have loginObj = {email, app, loginpass}"
        );
    }
    if (typeof appObj !== "object") {
        throw Promise.OperationalError(
            "must have appObj = {developer, appurl, repourl}"
        );
    }
    for (prop in appObj) {
        loginObj[prop] = appObj[prop];
    }
    return HTTPQuery("/register", {"post": loginObj});
}

module.exports.block = block;
function block(blockQueryObj) {
    if (typeof blockQueryObj !== "object") {
        throw Promise.OperationalError(
            "blockQueryObj must be a dictionary of query parameters"
        );
    }
    return HTTPQuery("/block", {"get": blockQueryObj}).then(function(blocks) {
        if (blocks.length === 0) {
            throw new pollPromise.NotDoneError("Query did not match any blocks");
        }
        else {
            return blocks;
        }
    });
}

module.exports.blockLast = blockLast;
function blockLast(n) {
    n = Math.ceil(n);
    if (n <= 0) {
        throw Promise.OperationalError("n must be positive");
    }
    return HTTPQuery("/block/last/" + n, {"get":{}});
}

module.exports.account = account;
function account(accountQueryObj) {
    if (typeof accountQueryObj !== "object") {
        throw Promise.OperationalError(
            "accountQueryObj must be a dictionary of query parameters"
        );
    }
    return HTTPQuery("/account", {"get" : accountQueryObj}).then(function(accts) {
        if (accts.length === 0) {
            throw new pollPromise.NotDoneError("Query did not match any accounts");
        }
        else {
            return accts;
        }
    });
}

module.exports.accountAddress = accountAddress;
function accountAddress(address) {
    return account({"address": Address(address).toString()}).get(0);
}

module.exports.submitTransaction = submitTransaction;
function submitTransaction(txObj) {
    return HTTPQuery("/transaction", {"data":txObj}).return(
        pollPromise(transactionResult.bind(null, txObj.partialHash))
    ).catch(Promise.TimeoutError, function() {
        return Promise.reject(
            "Transaction still incomplete after " +
                pollPromise.defaults.pollTimeoutMS / 1000 + " seconds"
        );
    }).catch(function(txResult) {
        var msg = "Transaction failed with transaction result:\n" +
            JSON.stringify(txResult, undefined, "  ") + "\n";
        if (txResult.transactionHash.length != 0) {
            return transaction({hash: txResult.transactionHash}).
                then(function(tx) {
                    return Promise.reject(msg + "\nTransaction was:\n" +
                                          JSON.stringify(tx, undefined, "  "));
                });
        }
        else {
            return Promise.reject(msg);
        }
    });
}

module.exports.transaction = transaction;
function transaction(transactionQueryObj) {
    if (typeof transactionQueryObj !== "object") {
        throw Promise.OperationalError(
            "transactionQueryObj must be a dictionary of query parameters"
        );
    }
    return HTTPQuery("/transaction", {"get": transactionQueryObj}).then(
        function(txs) {
        if (txs.length === 0) {
            throw new pollPromise.NotDoneError("Query did not match any transactions");
        }
        else {
            return txs;
        }
    });
}

module.exports.transactionLast = transactionLast;
function transactionLast(n) {
    n = Math.ceil(n);
    if (n <= 0) {
        throw Promise.OperationalError("n must be positive");
    }    
    return HTTPQuery("/transaction/last/" + n, {"get":{}});
}

module.exports.transactionResult = transactionResult;
function transactionResult(txHash) {
    if (typeof txHash !== "string" || !txHash.match(/^[0-9a-fA-F]*$/)) {
        throw Promise.OperationalError("txHash must be a hex string");
    }
    return HTTPQuery("/transactionResult/" + txHash, {"get":{}}).then(
        function(txList) {
            if (txList.length === 0) {
                throw new pollPromise.NotDoneError(
                    "The transaction with this hash has not yet been executed."
                );
            }
            return txList[0];
        }
    ).then(function(txResult){
        if (txResult.message !== "Success!") {
            return Promise.reject(txResult);
        }
        var contractsCreated = txResult.contractsCreated.split(",");
        txResult.contractsCreated = contractsCreated;
        return txResult;
    });
} 

module.exports.storage = storage;
function storage(storageQueryObj) {
    if (typeof storageQueryObj !== "object") {
        throw Promise.OperationalError(
            "storageQueryObj must be a dictionary of query parameters"
        );
    }
    return HTTPQuery("/storage", {"get": storageQueryObj}).then(
        function(stor) {
        if (stor.length === 0) {
            throw new pollPromise.NotDoneError(
                "Query did not match any storage locations"
            );
        }
        else {
            return stor;
        }
    });
}

module.exports.storageAddress = storageAddress;
function storageAddress(address) {
    return storage({"address": Address(address).toString()});
}
