

var unitSchema = { 
    wei     : 1,
    kwei    : 1000,   
    mwei    : 1000000,
    szabo   : 1000000000,
    finney  : 1000000000000,
    ether   : 1000000000000000
  };

var stringToEthUnit = function(str) {
  switch (str) {
    case 'eth': return unitSchema.eth;
    case 'wei': return unitSchema.wei;
    case 'kwei': return unitSchema.kwei;
    case 'mwei': return unitSchema.mwei;
    case 'szabo': return unitSchema.szabo;
    case 'finney': return unitSchema.finney;
    default : throw "Unit not found";
  }
}

module.exports = (function () {
  return {
    unitSchema : unitSchema,
    stringToEthUnit : stringToEthUnit
  };
})();
