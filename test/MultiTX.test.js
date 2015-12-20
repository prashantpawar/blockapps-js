describe("the MultiTX module", function() {
    it("correctly sends and returns multiple transactions", function() {
        var symtab = {
            "count": {
                "atStorageKey": "0",
                "bytesUsed": "20",
                "jsType": "Int",
                "solidityType": "uint256"
            },
            "decr": {
                "functionDomain": [],
                "functionArgs": [],
                "functionHash": "d9f2ac8a",
                "bytesUsed": "0",
                "jsType": "Function",
                "functionReturns": {
                    "atStorageKey": "0",
                    "bytesUsed": "20",
                    "jsType": "Int",
                    "solidityType": "int256"
                },
                "solidityType": "function() returns (int256)"
            },
            "incr": {
                "functionDomain": [],
                "functionArgs": [],
                "functionHash": "119fbbd4",
                "bytesUsed": "0",
                "jsType": "Function",
                "functionReturns": {
                    "atStorageKey": "0",
                    "bytesUsed": "20",
                    "jsType": "Int",
                    "solidityType": "int256"
                },
                "solidityType": "function() returns (int256)"
            },
            "accum": {
                "atStorageKey": "1",
                "bytesUsed": "20",
                "jsType": "Int",
                "solidityType": "int256"
            },
            "put": {
                "functionDomain": [
                    {
                        "atStorageKey": "0",
                        "bytesUsed": "20",
                        "jsType": "Int",
                        "solidityType": "int256"
                    }
                ],
                "functionArgs": [
                    "x"
                ],
                "functionHash": "f84c854a",
                "bytesUsed": "0",
                "jsType": "Function",
                "solidityType": "function(int256) returns ()"
            }
        };
        solidityMock(symtab);

        var call1Data = symtab.put.functionHash + Word(3);
        var call2Data = symtab.incr.functionHash;
        var call3Data = symtab.decr.functionHash;
        
        var tx = Transaction(txArgs);
        tx.data = Word(3).toString() +
            Word(0) + Word(call1Data.length/2) + call1Data + Word(txArgs.to) +
            Word(0) + Word(10000) +
            Word(0) + Word(call2Data.length/2) + call2Data + Word(txArgs.to) +
            Word(32) + Word(10000) +
            Word(0) + Word(call3Data.length/2) + call3Data + Word(txArgs.to) +
            Word(32) + Word(10000);
        tx.to = MultiTX.address;
        tx.nonce = txArgs.nonce;
        tx.value = 0x400;
        tx.sign(new Buffer(txArgs.privkey, "hex"));
            
        sendTXmock({
            tx: tx,
            txResult: {
                succeed: true,
                response: "00" +
                    Word(4) + "00" +
                    Word(2) + "00"
            }
        });
        getRoutes.storage({
            query: {address: MultiTX.address, keyhex:"1"},
            reply: [{
                key: Word(1).toString(),
                value: Word(0x400).toString()
            }]
        });

        var ss = newSolidityState();
        return ss.then(function(ss) {
            var call1 = ss.put(3).txParams({gasLimit: 10000});
            var call2 = ss.incr().txParams({gasLimit: 10000});
            var call3 = ss.decr().txParams({gasLimit: 10000});
            return MultiTX([call1, call2, call3])
                .txParams(txArgs).multiSend(txArgs.privkey);
        }).then(function(rets) {
            var exRets = [rets[0] == null,
                          Int(4).equals(rets[1]),
                          Int(2).equals(rets[2])];
            exRets.forEach(function(b) {
                expect(b).to.be.true;
            });
        });
    });
});
