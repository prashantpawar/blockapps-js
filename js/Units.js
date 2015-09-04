

var units = { 
    wei     : 1,
    kwei    : 1000,   
    mwei    : 1000000,
    szabo   : 1000000000,
    finney  : 1000000000000,
    ether   : 1000000000000000
  };

var stringToEthUnit = function(str) {
  switch (str) {
    case 'eth': return units.eth;
    case 'wei': return units.wei;
    case 'kwei': return units.kwei;
    case 'mwei': return units.mwei;
    case 'szabo': return units.szabo;
    case 'finney': return units.finney;
    default : throw "Unit not found";
  }
}

module.exports = (function () {
  return {
    units : units,
    stringToEthUnit : stringToEthUnit
  };
})();
