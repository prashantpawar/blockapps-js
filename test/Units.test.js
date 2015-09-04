var units = require("../js/Units");

var chai = require("chai");
var expect = chai.expect;

describe("Units are integers", function () {
    var unitObj = units.unitSchema;

    it("should be an integer ether", function () {
        expect(unitObj.ether).to.equal(1000000000000000);
    });
    it("should exist", function () {
        expect(unitObj.ether).to.exist;
    });

});

