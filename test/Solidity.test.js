describe("Solidity", function () {
    describe("the Solidity constructor", function() {
        var solcReply = {
            "contracts" : [{"name" : "C", "bin" : "60006c"}],
            "xabis" : { "C" : {"x" : {}, "f" : {} } }
        };
        it("returns a Solidity object", function() {
            postRoutes.solc({reply:solcReply});
            return expect(Solidity("")).to.eventually.be.an.instanceOf(Solidity);
        });
        it("correctly assigns code, name, vmCode, symTab", function() {
            postRoutes.solc({reply:solcReply});
            var solCode = Solidity("abcd");
            return Promise.join(
                expect(solCode).to.eventually.have.property("code", "abcd"),
                expect(solCode).to.eventually.have.property("name", "C"),
                expect(solCode).to.eventually.have.property("vmCode", "60006c"),
                expect(solCode).to.eventually.have.property("symTab")
                    .that.eqls({"x":{}, "f":{}}),
                function(){}
            );
        });
    });
    describe("contract objects", function() {
        it("Solidity prototype should have property 'newContract'", function() {
            expect(Solidity.prototype).to.have.property("newContract");
        });
        it("should have property 'account' which is an Account", function() {
            solidityMock();
            return expect(newSolidity()).to.eventually.have
                .property("account").which.is.an.instanceOf(Account);
        });
        it("should have property 'state'", function() {
            solidityMock();
            return expect(newSolidity()).to.eventually.have.property("state");
        });
        describe("simple state variables", function() {
            it("correctly interprets 'address' as promise to Address", function() {
                var symtab = {
                    "a": {
                        "atStorageKey": "100",
                        "atStorageOffset": "1",
                        "bytesUsed": "14",
                        "jsType": "Address",
                        "solidityType": "address"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "100"},
                    reply: [{
                        "key": Word(100).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf.write(txArgs.from, 31-20, 20, "hex");
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("a")).to.eventually.satisfy(function(x) {
                    return x.isAddress && x.equals(Address(txArgs.from));
                })
            });
            it("correctly interprets 'bool' as promise to boolean", function() {
                var symtab = {
                    "b": {
                        "atStorageKey": "100",
                        "atStorageOffset": "1",
                        "bytesUsed": "1",
                        "jsType": "Bool",
                        "solidityType": "bool"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "100"},
                    reply: [{
                        "key": Word(100).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf[30] = 1;
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("b")).to.eventually.satisfy(function(x){
                    return (typeof x === "boolean") && x === true;
                });
            });            
            it("correctly interprets 'bytes<n>' as promise to Buffer", function() {
                var symtab = {
                    "bs": {
                        "atStorageKey": "100",
                        "atStorageOffset": "1",
                        "bytesUsed": "a",
                        "jsType": "Bytes",
                        "solidityType": "bytes10"
                    }
                };
                var bytes = "abcdefghij";
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "100"},
                    reply: [{
                        "key": Word(100).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf.write(bytes,31-10,10,"utf8");
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("bs")).to.eventually.satisfy(function(x){
                    return Buffer.isBuffer(x) && x.equals(new Buffer(bytes,"utf8"));
                });
            });
            it("correctly interprets 'enum' as promise to enum", function() {
                var symtab = {
                    "E": {
                        "bytesUsed": "1",
                        "jsType": "Enum",
                        "enumNames": {
                            "A": 0,
                            "B": 1,
                            "C": 2
                        },
                        "solidityType": "enum {A = 0, B = 1, C = 2}"
                    },
                    "x": {
                        "atStorageKey": "0",
                        "bytesUsed": "1",
                        "jsType": "Enum",
                        "solidityType": "E"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "0"},
                    reply: [{
                        "key": Word(0).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf[31] = 2;
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("x").get("key")).to.eventually.equal("C");
            });
            it("correctly interprets 'int<n>' as promise to Int", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "100",
                        "atStorageOffset": "1",
                        "bytesUsed": "1",
                        "jsType": "Int",
                        "solidityType": "int16"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "100"},
                    reply: [{
                        "key": Word(100).toString(),
                        "value": (function() {
                            var intVal = Int(2).pow(16).minus(2);
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf.write(intVal.toString(16),31-2,2,"hex");
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("x")).to.eventually.satisfy(function(x){
                    return Int.isInstance(x) && x.equals(-2);
                });
            });
            it("correctly interprets 'uint<n>' as promise to Int", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "100",
                        "atStorageOffset": "1",
                        "bytesUsed": "1",
                        "jsType": "Int",
                        "solidityType": "uint16"
                    }
                }
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": "100"},
                    reply: [{
                        "key": Word(100).toString(),
                        "value": (function() {
                            var intVal = Int(2).pow(16).minus(2);
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf.write(intVal.toString(16),31-2,2,"hex");
                            return buf.toString("hex");
                        })()
                    }]
                });
                var s = newSolidityState();
                return expect(s.get("x")).to.eventually.satisfy(function(x){
                    return Int.isInstance(x) && x.equals(254);
                });
            });
        });
        describe("compound and dynamic-length state variables", function() {
            it("correctly interprets 'bytes' as promise to Buffer", function() {
                var bytes = "abcdefghij";
                var bytesHex = (new Buffer(bytes, "utf8")).toString("hex");
                var symtab = {
                    "bs": {
                        "atStorageKey": "0",
                        "bytesUsed": "20",
                        "jsType": "Bytes",
                        "arrayNewKeyEach": "20",
                        "arrayDataStart": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                        "solidityType": "bytes"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": Word(0).toString()},
                    reply: [{
                        "key": Word(0).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf[31] = 65;
                            return buf.toString("hex");
                        })()
                    }]
                });
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "minkey": Int("0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563").toString(10),
                        "maxkey": Int("0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e565").toString(10),
                    },
                    reply: [
                        {
                            "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                            "value": "0000" + bytesHex + bytesHex + bytesHex
                        },
                        {
                            "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e565",
                            "value": bytesHex + bytesHex + bytesHex + "0000"
                        }
                    ]
                });
                var s = newSolidityState();
                return expect(s.get("bs")).to.eventually.satisfy(function(x){
                    var y = new Buffer(
                        "0000" + bytesHex + bytesHex + bytesHex +
                            (new Buffer(32)).fill(0).toString("hex") +
                            bytesHex.slice(0,2),
                        "hex"
                    );
                    return x.equals(y);
                });
            });
            it("correctly interprets 'string' as promise to string", function() {
                var bytes = "abcdefghij";
                var bytesHex = (new Buffer(bytes, "utf8")).toString("hex");
                var symtab = {
                    "s": {
                        "atStorageKey": "0",
                        "bytesUsed": "20",
                        "jsType": "String",
                        "arrayNewKeyEach": "20",
                        "arrayDataStart": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                        "solidityType": "string"
                    }
                };
                solidityMock(symtab);
                getRoutes.storage({
                    query: {"address": txArgs.to, "keyhex": Word(0).toString()},
                    reply: [{
                        "key": Word(0).toString(),
                        "value": (function() {
                            var buf = new Buffer(32);
                            buf.fill(0);
                            buf[31] = 40;
                            return buf.toString("hex");
                        })()
                    }]
                });
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "minkey": Int("0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563").toString(10),
                        "maxkey": Int("0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564").toString(10),
                    },
                    reply: [
                        {
                            "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                            "value": bytesHex + bytesHex + bytesHex +
                                bytesHex.slice(0,4)
                        },
                        {
                            "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564",
                            "value": bytesHex.slice(4) +
                                bytesHex + bytesHex + bytesHex.slice(0,-4)
                        }
                    ]
                });
                var s = newSolidityState();
                return expect(s.get("s")).to.eventually.equal(
                    bytes + bytes + bytes + bytes
                );
            });
            it("correctly interprets 'struct' as promise to object",
               function() {
                   var symtab = {
                       "s": {
                           "atStorageKey": "0",
                           "bytesUsed": "40",
                           "jsType": "Struct",
                           "solidityType": "S"
                       },
                       "S": {
                           "bytesUsed": "40",
                           "structFields": {
                               "bs": {
                                   "atStorageKey": "0",
                                   "bytesUsed": "a",
                                   "jsType": "Bytes",
                                   "solidityType": "bytes10"
                               },
                               "b": {
                                   "atStorageKey": "0",
                                   "bytesUsed": "1",
                                   "jsType": "Bool",
                                   "atStorageOffset": "a",
                                   "solidityType": "bool"
                               },
                               "x": {
                                   "atStorageKey": "1",
                                   "bytesUsed": "20",
                                   "jsType": "Int",
                                   "solidityType": "int256"
                               }
                           },
                           "jsType": "Struct",
                           "solidityType": "struct {bytes10 bs; bool b; int256 x}"
                       }
                   };
                   solidityMock(symtab);
                   getRoutes.storage({
                       n:2,
                       query: {
                           "address": txArgs.to,
                           "keyhex": "0"
                       },
                       reply: [{
                           "key": Word(0).toString(),
                           "value": (new Buffer(21)).fill(0).toString("hex") +
                               "01" + 
                               (new Buffer("RyanCReich", "utf8")).toString("hex")
                       }]
                   });
                   getRoutes.storage({
                       query: {
                           "address": txArgs.to,
                           "keyhex": "1"
                       },
                       reply: [{
                           "key": Word(1).toString(),
                           "value": Int(1729).toString(16)
                       }]
                   });
                   var s = newSolidityState();
                   return expect(s.get("s")).to.eventually.eql({
                       "bs": new Buffer("RyanCReich", "utf8"),
                       "b": true,
                       "x": Int(1729)
                   });
               }
              );
            it("correctly interprets static array as promise to JS array",
               function() {
                   var bytes = "abcdefghij";
                   var bytesHex = (new Buffer(bytes, "utf8")).toString("hex");
                   var symtab ={
                       "a": {
                           "arrayLength": "9",
                           "atStorageKey": "0",
                           "bytesUsed": "60",
                           "jsType": "Array",
                           "arrayElement": {
                               "atStorageKey": "0",
                               "bytesUsed": "a",
                               "jsType": "Bytes",
                               "solidityType": "bytes10"
                           },
                           "arrayNewKeyEach": "3",
                           "solidityType": "bytes10[9]"
                       }
                   };
                   solidityMock(symtab);
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": 0
                       },
                       reply: [{
                           "key": Word(0).toString(),
                           "value": "0000" + bytesHex + bytesHex + bytesHex
                       }]
                   });
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": 1
                       },
                       reply: []
                   });
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": 2
                       },
                       reply:[{
                           "key": Word(2).toString(),
                           "value": "0000" + bytesHex + bytesHex + bytesHex
                       }]
                   });
                   var s = newSolidityState();
                   return expect(s.get("a")).to.eventually.satisfy(function(x){
                       var result = true;
                       [0,1,2,6,7,8].forEach(function(i) {
                           result = result && x[i].equals(new Buffer(bytesHex, "hex"));
                       });
                       [3,4,5].forEach(function(i) {
                           result = result && x[i].equals((new Buffer(10)).fill(0));
                       });
                       return result;
                   });
               }
              );
            it("correctly interprets dynamic array as promise to JS array",
               function() {
                   var bytes = "abcdefghij";
                   var bytesHex = (new Buffer(bytes, "utf8")).toString("hex");
                   var symtab = {
                       "a": {
                           "atStorageKey": "0",
                           "bytesUsed": "20",
                           "jsType": "Array",
                           "arrayElement": {
                               "bytesUsed": "a",
                               "jsType": "Bytes",
                               "solidityType": "bytes10"
                           },
                           "arrayNewKeyEach": "3",
                           "arrayDataStart": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                           "solidityType": "bytes10[]"
                       }
                   }
                   solidityMock(symtab);
                   getRoutes.storage({
                       query: {"address": txArgs.to, "keyhex": Word(0).toString()},
                       reply: [{
                           "key": Word(0).toString(),
                           "value": (function() {
                               var buf = new Buffer(32);
                               buf.fill(0);
                               buf[31] = 9;
                               return buf.toString("hex");
                           })()
                       }]
                   });
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563"
                       },
                       reply: [{
                           "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
                           "value": "0000" + bytesHex + bytesHex + bytesHex
                       }]
                   });
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e564"
                       },
                       reply: []
                   });
                   getRoutes.storage({
                       n:3,
                       query: {
                           "address": txArgs.to,
                           "keyhex": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e565"
                       },
                       reply:[{
                           "key": "290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e565",
                           "value": "0000" + bytesHex + bytesHex + bytesHex
                       }]
                   });
                   var s = newSolidityState();
                   return expect(s.get("a")).to.eventually.satisfy(function(x){
                       var result = true;
                       [0,1,2,6,7,8].forEach(function(i) {
                           result = result && x[i].equals(new Buffer(bytesHex, "hex"));
                       });
                       [3,4,5].forEach(function(i) {
                           result = result && x[i].equals((new Buffer(10)).fill(0));
                       });
                       return result;
                   });
               }
              );
        });            
        describe("state mappings", function() {
            it("correctly takes 'address' arguments", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "0",
                        "mappingKey": {
                            "bytesUsed": "14",
                            "jsType": "Address",
                            "solidityType": "address"
                        },
                        "bytesUsed": "20",
                        "jsType": "Mapping",
                        "mappingValue": {
                            "bytesUsed": "20",
                            "jsType": "Int",
                            "solidityType": "int256"
                        },
                        "solidityType": "mapping (address => int256)"
                    }
                };
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "keyhex": "0b975de0ea7bdcbb33fb77f8cfd47684595c51770c1d3f9574dae844acdf2ff2"
                    },
                    reply: [{
                        "key": "0b975de0ea7bdcbb33fb77f8cfd47684595c51770c1d3f9574dae844acdf2ff2",
                        "value": Word(Int(1)).toString()
                    }]
                });
                solidityMock(symtab);
                var s = newSolidityState();
                return expect(s.call("x", txArgs.from).call("equals", 1))
                    .to.eventually.be.true;
            });
            it("correctly takes 'bool' arguments", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "0",
                        "mappingKey": {
                            "bytesUsed": "1",
                            "jsType": "Bool",
                            "solidityType": "bool"
                        },
                        "bytesUsed": "20",
                        "jsType": "Mapping",
                        "mappingValue": {
                            "bytesUsed": "20",
                            "jsType": "Int",
                            "solidityType": "int256"
                        },
                        "solidityType": "mapping (address => int256)"
                    }
                };
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "keyhex": "ada5013122d395ba3c54772283fb069b10426056ef8ca54750cb9bb552a59e7d"
                    },
                    reply: [{
                        "key": "ada5013122d395ba3c54772283fb069b10426056ef8ca54750cb9bb552a59e7d",
                        "value": Word(Int(1)).toString()
                    }]
                });
                solidityMock(symtab);
                var s = newSolidityState();
                return expect(s.call("x", true).call("equals", 1))
                    .to.eventually.be.true;
            });
            it("correctly takes 'bytes<n>' arguments", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "0",
                        "mappingKey": {
                            "bytesUsed": "4",
                            "jsType": "Bytes",
                            "solidityType": "bytes4"
                        },
                        "bytesUsed": "20",
                        "jsType": "Mapping",
                        "mappingValue": {
                            "bytesUsed": "20",
                            "jsType": "Int",
                            "solidityType": "int256"
                        },
                        "solidityType": "mapping (address => int256)"
                    }
                };
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "keyhex": "7d522ee7ead57ad93cf87f99e1cf6686156d688fed74505929fa32d4d774eb33"
                    },
                    reply: [{
                        "key": "7d522ee7ead57ad93cf87f99e1cf6686156d688fed74505929fa32d4d774eb33",
                        "value": Word(Int(1)).toString()
                    }]
                });
                solidityMock(symtab);
                var s = newSolidityState();
                return expect(s.call("x", "abcd1234").call("equals", 1))
                    .to.eventually.be.true;
            });
            it("correctly takes 'int<n>' arguments", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "0",
                        "mappingKey": {
                            "bytesUsed": "4",
                            "jsType": "Int",
                            "solidityType": "int32"
                        },
                        "bytesUsed": "20",
                        "jsType": "Mapping",
                        "mappingValue": {
                            "bytesUsed": "20",
                            "jsType": "Int",
                            "solidityType": "int256"
                        },
                        "solidityType": "mapping (int32 => int256)"
                    }
                };
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "keyhex": "47b50c45b2ba1167311702ffae1e6695bc736c9a407e001fa596d0fb460dc1ce"
                    },
                    reply: [{
                        "key": "47b50c45b2ba1167311702ffae1e6695bc736c9a407e001fa596d0fb460dc1ce",
                        "value": Word(Int(1)).toString()
                    }]
                });
                solidityMock(symtab);
                var s = newSolidityState();
                return expect(s.call("x", Int(2).pow(16)).call("equals", 1))
                    .to.eventually.be.true;
            });
            it("correctly takes 'uint<n>' arguments", function() {
                var symtab = {
                    "x": {
                        "atStorageKey": "0",
                        "mappingKey": {
                            "bytesUsed": "4",
                            "jsType": "Int",
                            "solidityType": "uint32"
                        },
                        "bytesUsed": "20",
                        "jsType": "Mapping",
                        "mappingValue": {
                            "bytesUsed": "20",
                            "jsType": "Int",
                            "solidityType": "int256"
                        },
                        "solidityType": "mapping (uint32 => int256)"
                    }
                };
                getRoutes.storage({
                    query: {
                        "address": txArgs.to,
                        "keyhex": "4688c4a134da497cc3f0b55e9778e4537b7ad05c1cc9ae8ad6123cdcbd66f1d6"
                    },
                    reply: [{
                        "key": "4688c4a134da497cc3f0b55e9778e4537b7ad05c1cc9ae8ad6123cdcbd66f1d6",
                        "value": Word(Int(1)).toString()
                    }]
                });
                solidityMock(symtab);
                var s = newSolidityState();
                return expect(s.call("x", -Int(2).pow(16)).call("equals", 1))
                    .to.eventually.be.true;
            });
            
        });
        describe("state methods", function() {

        });
    });
    describe("the 'attach' function", function() {
        
    });
});
