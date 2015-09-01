
var units = { 
    wei     : 1,
    kwei    : 1000,   
    mwei    : 1000000,
    szabo   : 1000000000,
    finney  : 1000000000000,
    ether   : 1000000000000000
  };

module.exports = (function () {
  return {
    units : units
  };
})();
