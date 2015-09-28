before(function() {
    lib = require("../index.js");

    chai = require("chai");
    expect = chai.expect;

    chaiPromise = require("chai-as-promised");
    chai.use(chaiPromise);
    Promise = require("bluebird");

    nock = require("nock");
    serverUrl = lib.query.serverURI + lib.query.apiPrefix;
    blockapps = nock(serverUrl);

    addressTo = "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3";
    addressFrom = "e1fd0d4a52b75a694de8b55528ad48e2e2cf7859";
    privkeyFrom =
        "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";
    address = addressFrom;

    value = lib.ethbase.Int(10).pow(18).toString(10);
    gasPrice = 11;
    gasLimit = 123456;
    nonce = 17;
    data = "abcd"
});
