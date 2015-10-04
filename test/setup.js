var nock = require("nock");

before(function() {
    var lib = require("../index.js");
    
    var ethbase = lib.ethbase;
    Int = ethbase.Int;
    Account = ethbase.Account;
    Address = ethbase.Address;
    Storage = ethbase.Storage;
    Transaction = ethbase.Transaction;
    Word = ethbase.Word;
    Units = ethbase.Units;

    polling = lib.polling;
    pollevery = polling.pollEveryMS;
    timeout = polling.pollTimeoutMS;

    setProfile = lib.setProfile;
    query = lib.query;
    txDefaults = Transaction.defaults;
    
    routes = lib.routes;
    
    Solidity = lib.Solidity;
    MultiTX = lib.MultiTX;

    pollPromise = require("../js/pollPromise.js");
    HTTPQuery = require("../js/HTTPQuery");
    
    var chai = require("chai");
    expect = chai.expect;

    var chaiPromise = require("chai-as-promised");
    chai.use(chaiPromise);
    Promise = require("bluebird");

    var serverURI = lib.query.serverURI;
    var apiPrefix = lib.query.apiPrefix + "/";
    function mock(f) {
        var result = nock(serverURI);
        result.getAPI  = function(path) { return this.get(apiPrefix + path); }
        result.postAPI = function(path) { return this.post(apiPrefix + path); }
        return function(args) {
            if (args === undefined) {
                args = {};
            }
            var n = "n" in args ? args.n : 1;
            var status = "status" in args ? args.status : 200;
            var reply = args.reply;
            var query = args.query;

            return f(result, query).times(n).reply(status, reply);
        }
    };
    getRoutes = {};
    ["block", "account", "transaction", "storage"].forEach(function(path) {
        getRoutes[path] = mock(function(scope, query) {
            if (query === undefined) {
                return scope.filteringPath(/\?.*$/, "").getAPI(path);
            }
            else {
                return scope.getAPI(path).query(query);
            }
        });
    });
    postRoutes = {};
    ["solc", "extabi", "faucet", "transaction",
     "login", "wallet", "developer", "register"].forEach(function(path) {
         postRoutes[path] = mock(function(scope, query) {
             return scope.postAPI(path, query);
         })
     });
    staticRoutes = {};
    ["block/last", "transaction/last", "transactionResult"].forEach(function(path) {
        staticRoutes[path] = mock(function(scope, query) {
            if (query === undefined) {
                return scope.filteringPath(/\/[0-9a-fA-F]*$/, "").getAPI(path);
            }
            else {
                return scope.getAPI(path + "/" + query);
            }
        })
    });

    txRMock = function(txRArgs) {
        var n = 1;
        var txResult = [];
        var query = undefined;
        if (txRArgs !== undefined) {
            if ("n" in txRArgs) {
                n = txRArgs.n;
            }
            query = txRArgs.hash;

            if ("succeed" in txRArgs) {
                txResult = [{
                    "message" : txRArgs.succeed ? "Success!" : "Failure...",
                    "transactionHash" : query,
                    "contractsCreated" : ("contractsCreated" in txRArgs) ?
                        txRArgs.contractsCreated.join(",") : ""
                }];
            }
        }
        return staticRoutes.transactionResult({query:query, reply:txResult, n:n});
    }

    txMock = function(args) {
        var n = "n" in args ? args.n : 1;
        var txRArgs = args.txResult;
        if (txRArgs === undefined) {
            txRArgs = {};
        }
        txRArgs.hash = args.txQuery.hash
        txRArgs.n = n;

        return {
            transaction : postRoutes.transaction({n:n, query:args.txQuery}),
            txResult: txRMock(txRArgs)
        };
    }

    sendTXmock = function(args) {
        var txJSON = JSON.parse(JSON.stringify(args.tx));
        var n = "n" in args ? args.n : 1;
        var fromQuery = { "address" : txJSON.from };
        var fromResult = [{"nonce" : txJSON.nonce }];

        var txMocks = txMock({
            txQuery: txJSON,
            txResult:args.txResult,
            n:n
        });
        return {
            account : getRoutes.account({query:fromQuery, reply:fromResult, n:n}),
            transaction: txMocks.transaction,
            txResult: txMocks.txResult
        };
    }

    faucetMock = function() {
        args = arguments[0];
        var n = "n" in args ? args.n : 1;
        var reply = "reply" in args ? args.reply : [{}];
        var aQ = "address" in args ? { "address" : args.address } : undefined;
        
        return {
            account : getRoutes.account({query:aQ, reply:reply, n:n}),
            faucet : postRoutes.faucet({n:n})
        };
    }

    txArgs = {
        "value" : Units.ethValue(1).in("ether"),
        "gasPrice" : Units.ethValue(1).in("szabo"),
        "gasLimit" : 3141592,
        "nonce" : 17,
        "data" : "6000fc",
        "from" : "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859",
        "to" : "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3",
        "privkey" :
        "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281"
    }

    address = txArgs.from;
    addrQuery = {"address" : address};
});

afterEach(function() {
    nock.cleanAll();
    
    polling.pollEveryMS = pollevery;
    polling.pollTimeoutMS = timeout;
});
