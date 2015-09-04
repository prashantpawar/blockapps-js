var HTTPQuery = require("./HTTPQuery.js");
var Promise = require('bluebird');
var Address = require("./Address.js");

module.exports.solc = solc;
function solc(code) {
    if (typeof code !== "string" || code.match(/[0-9a-fA-F]*/) === null) {
        throw "Routes.solc(code): code must be a hex string";
    }
    return HTTPQuery("/solc", {"post": {"src":code}}).then(function(solcResponse) {
        if (solcResponse["contracts"].length != 1) {
            return Promise.OperationalError(
                "Routes.solc: Code must (currently) define one and only one " +
                    "contract.");
        }
        else {
            return {
                "vmCode" : solcResponse["contracts"][0]["bin"],
                "symTab" : solcResponse["xabis"]
            };
        }
    });
}

module.exports.extabi = extabi;
function extabi(code) {
    if (typeof code !== "string" || code.match(/[0-9a-fA-F]*/) === null) {
        throw "Routes.extabi(code): code must be a hex string";
    }
    return HTTPQuery("/extabi", {"post": {"src":code}});
}

module.exports.faucet = faucet;
function faucet(address) {
    var addr = Address(address).toString();
    return HTTPQuery("/faucet", {"post": addr}).return(pollPromise(function () {
        return HTTPQuery("/account", {"get": addr}).then(function (accts) {
            // Only polls for the creation of a new account.
            if (accts.length != 0) {
                return Promise.resolve();
            }
            else {
                return Promise.reject();
            }
        });
    }));
}

module.exports.login = login;
// loginObj: email, app, loginpass
function login(loginObj, address) {
    loginObj.address = Address(address).toString();
    return HTTPQuery("/login", {"post": loginObj});
}

module.exports.wallet = wallet;
function wallet(loginObj, enckey) {
    if (typeof loginObj !== "object" || typeof enckey !== "string" ||
        enckey.match(/[0-9a-fA-F]*/) === null) {
        throw "Routes.wallet(loginObj, enckey): must have " +
            "loginObj = {email, app, loginpass}, " +
            "enckey = encoded key, as hex string";
    }
    loginObj.enckey = enckey;
    return HTTPQuery("/wallet", {"post": loginObj});
}

module.exports.developer = developer;
function developer(loginObj) {
    if (typeof loginObj !== "object") {
        throw "Routes.developer(loginObj): must have " +
            "loginObj = {email, app, loginpass}";
    }
    return HTTPQuery("/developer", {"post": loginObj});
}

module.exports.register = register;
// appObj: developer, appurl, repourl
function register(loginObj, appObj) {
    if (typeof loginObj !== "object") {
        throw "Routes.register(loginObj,_): must have " +
            "loginObj = {email, app, loginpass}";
    }
    if (typeof appObj !== "object") {
        throw "Routes.register(_,appObj): must have " +
            "appObj = {developer, appurl, repourl}";
    }
    for (prop in appObj) {
        loginObj[prop] = appObj[prop];
    }
    return HTTPQuery("/register", {"post": loginObj});
}

module.exports.block = block;
function block(blockQueryObj) {
    if (typeof blockQueryObj !== "object") {
        throw "Routes.block(blockQueryObj): blockQueryObj must be " +
            "a dictionary of query parameters";
    }
    return HTTPQuery("/block", {"get": blockQueryObj});
}

module.exports.blockLast = blockLast;
function blockLast(n) {
    return HTTPQuery("/block/last/" + n, {"get":{}});
}

module.exports.account = account;
function account(accountQueryObj) {
    if (typeof accountQueryObj !== "object") {
        throw "Routes.account(accountQueryObj): accountQueryObj must be " +
            "a dictionary of query parameters";
    }
    return HTTPQuery("/account", {"get" : accountQueryObj});
}

module.exports.accountAddress = accountAddress;
function accountAddress(address) {
    return account({"address": Address(address).toString()}).get(0);
}

module.exports.submitTransaction = submitTransaction;
function submitTransaction(txObj) {
    return HTTPQuery("/transaction", {"data":txObj}).return(pollPromise(function(){
        return transactionResult(txObj.partialHash).then(function(txList) {
            if (txList.length !== 0) {
                var txResult = txList[0];
                var contractsCreated = txResult.contractsCreated.split(",");
                txResult.contractsCreated = contractsCreated;
                return Promise.resolve(txResult);
            }
            else {
                return Promise.reject();
            }
        });
    }));
}

module.exports.transaction = transaction;
function transaction(transactionQueryObj) {
    if (typeof transactionQueryObj !== "object") {
        throw "Routes.transaction(transactionQueryObj): transactionQueryObj must "+
            "be a dictionary of query parameters";
    }
    return HTTPQuery("/transaction", {"get": transactionQueryObj});
}

module.exports.transactionLast = transactionLast;
function transactionLast(n) {
    if (typeof transactionQueryObj !== "number") {
        throw "Routes.transactionLast(n): n must be an integer";
    }
    return HTTPQuery("/transaction/last/" + n, {"get":{}});
}

module.exports.transactionResult = transactionResult;
function transactionResult(txHash) {
    if (typeof txHash !== "string" || txHash.match(/[0-9a-fA-F]*/) === null) {
        throw "Routes.transactionResult(txHash): txHash must be a hex string";
    }
    return HTTPQuery("/transactionResult" + txHash, {"get":{}});
}

module.exports.storage = storage;
function storage(storageQueryObj) {
    if (typeof storageQueryObj !== "object") {
        throw "Routes.storage(storageQueryObj): storageQueryObj must " +
            "be a dictionary of query parameters";
    }
    return HTTPQuery("/storage", {"get": storageQueryObj});
}

module.exports.storageAddress = storageAddress;
function storageAddress(address) {
    return storage({"address": Address(address).toString()});
}
