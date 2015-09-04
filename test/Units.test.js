var units = require("../js/Units");

var chai = require("chai");
var expect = chai.expect;
var should = chai.should;

describe("Units exist and are integers", function () {
    var unitObj = units.unitSchema;

    it("should be an integer ether", function () {
        expect(unitObj.ether).to.equal(1000000000000000);
    });
    it("should exist", function () {
        expect(unitObj.ether).to.exist;
    });

});

describe("Unit parsing", function () {

    it("should be 1", function () {
        var t = units.stringToEthUnit('wei');
        expect(t).to.equal(1);
    });
    it("should be 1000000000000,", function () {
        var t = units.stringToEthUnit('finney');
        expect(t).to.equal(1000000000000);
    });

});

