# blockapps-js

[![Build Status](https://travis-ci.org/blockapps/blockapps-js.svg)](https://travis-ci.org/blockapps/blockapps-js)
[![Coverage Status](https://coveralls.io/repos/blockapps/blockapps-js/badge.svg?branch=master&service=github)](https://coveralls.io/github/blockapps/blockapps-js?branch=master)

blockapps-js is a library that exposes a number of functions for
interacting with the Blockchain via the BlockApps API.  Currently it
has strong support for compiling Solidity code, creating the resulting
contract, and querying its variables or calling its functions through
Javascript code.

## Installation

`npm install blockapps-js`

## Documentation

Documentation is available at http://blockapps.net/apidocs.  Below is
the API for this particular module.

## API Overview

All functionality is included in the `blockapps-js` module:

```js
var blockapps = require('blockapps-js');
/* blockapps = {
 *   ethbase : { Account, Address, Int, Storage, Transaction },
 *   routes,
 *   Solidity
 * }
```

The various submodules of blockapps are described in detail below.
Aside from Address and Int, all the public methods return promises
(from the bluebird library).

### Quick start

See the `bulkQuery` sample dApp in the `examples/` directory for a
complete, working example.  Here are some snippets illustrating common
operations.

#### Query an account's balance

```js
var Account = require('blockapps-js').ethbase.Account;

// The "0x" prefix is optional for addresses
var address = "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3"

Account(address).balance.then(function(balance) {
  // In here, "balance" is a big-integer you can manipulate directly.
});
```

#### Send ether between accounts

```js
var ethbase = require('blockapps-js').ethbase
var Transaction = ethbase.Transaction;
var Int = ethbase.Int;

var addressTo = "16ae8aaf39a18a3035c7bf71f14c507eda83d3e3";
var privkeyFrom = "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";

// This statement doesn't actually send a transaction; it just sets it up.
var valueTX = Transaction({"value" : Int(10).pow(18)}); // 1 ether

valueTX.send(privkeyFrom, addressTo).then(function(txResult) {
  // txResult.message is either "Success!" or an error message
  // For this transaction, the error would be about insufficient balance.
});
```

#### Compile Solidity code

```js
var Solidity = require('blockapps-js').Solidity

var code = "contract C { int x = -2; }"; // For instance

Solidity(code).then(function(solObj) {
  // solObj.vmCode is the compiled code.  You could submit it directly with
  // a Transaction, but there is a better way.

  // solObj.symTab has more information than you could possibly want about the
  // global variables and functions defined in the code.

  // solObj.name is the name of the contrat, i.e. "C"

  // solObj.code is the code itself.
}).catch(function(err) {
  // err is the compiler error if the code is malformed.
})
```

#### Create a Solidity contract and read its state

```js
var Solidity = require('blockapps-js').Solidity

var code = "contract C { int x = -2; }"; // For instance
var privkey = "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";

Solidity(code).newContract(privkey, {"value": 100}).then(function(contract) {
  contract.account.balance.equals(100); // You shouldn't use == with big-integers
  contract.state.x == -2; // If you do use ==, the big-integer is downcast.
});
```

#### Call a Solidity method

```js
var Solidity = require('blockapps-js').Solidity;
var Promise = require('bluebird'); // This is the promise library we use

var code = 'contract C {                        \n\
  uint knocks;                                  \n\
                                                \n\
  function knock(uint times) returns (string) { \n\
    knocks += times;                            \n\
    if (times == 0) {                           \n\
      return "I couldn\'t hear that!";          \n\
    }                                           \n\
    else {                                      \n\
      return "Okay, okay!";                     \n\
    }                                           \n\
  }                                             \n\
}';

var privkey = "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";

Solidity(code).newContract(privkey).then(function(contract) {
  // This sets up a call to the code's "knock" method;
  // The account owned by this private key pays the execution fees.
  var knock = function(n) {
    return contract.state.knock(n).callFrom(privkey);
  };
  
  Promise.map([0,1,2,3], knock).then(function(replies) {
    replies[0] == "I couldn't hear that!";
    replies[1] == "Okay, okay!";
    // etc.
  }).then(function() {
    contract.state.knocks == 6; 
  });
});
```

#### Call many methods in a single message transaction

```js
var Solidity = require('blockapps-js').Solidity;
var MultiTX = require('blockapps-js').MultiTX;
var Promise = require('bluebird'); // This is the promise library we use

var code = 'contract C {                        \n\
  uint knocks;                                  \n\
                                                \n\
  function knock(uint times) returns (string) { \n\
    knocks += times;                            \n\
    if (times == 0) {                           \n\
      return "I couldn\'t hear that!";          \n\
    }                                           \n\
    else {                                      \n\
      return "Okay, okay!";                     \n\
    }                                           \n\
  }                                             \n\
}';

var privkey = "1dd885a423f4e212740f116afa66d40aafdbb3a381079150371801871d9ea281";

Solidity(code).newContract(privkey).then(function(contract) {
  // This time, we don't actually call the Solidity method yet.
  // However, we should take care to specify gas limits individually.
  // If this limit seems high...you never know.  But it should not
  // be so high that paying it in the middle of a VM run would
  // cause an out-of-gas exception.
  function knock(n) {
    return contract.state.knock(n).txParams({gasLimit: 100000});
  }

  // This does all four calls in a single transaction, which saves a
  // lot of gas and time.
  MultiTX([0,1,2,3].map(knock)).multiSend(privkey)
  .then(function(replies) {
    replies[0] == "I couldn't hear that!";
    replies[1] == "Okay, okay!";
    // etc.
  }).then(function() {
    contract.state.knocks == 6; 
  });
});
```

## API details

The `blockapps-js` library has four main submodules.

### The `ethbase` submodule

This component provides Javascript support for the basic concepts of
Ethereum, independent of high-level languages or implementation
features.

 - `ethbase.Int`: The constructor for an abstraction of Ethereum's
   32-byte words, which are implemented via the `big-integer` library.
   The constructor accepts numbers or Ints, 0x(hex) strings, decimal
   strings, or Buffers, but does not truncate to 32 bytes.  Note that
   arithmetic must be performed with the `.plus` (etc.) methods rather
   than the arithmetic operators, which degrade big integers to 8-byte
   (floating-point) Javascript numbers.

 - `ethbase.Address`: The constructor for Ethereum "addresses"
   (20-byte words), which are implemented as the Buffer type.  Its
   argument can be a number, an Int, a hex string, or another Buffer,
   all of which are truncated to 20 bytes.

 - `ethbase.Account`: This constructor accepts an argument convertible
   to Address and defines an object with three properties.

   - `address`: the account's constructing address.

   - `nonce`: the "nonce", or number of successful transactions sent
     from this account.  The value of this property is a Promise
     resolving to the Int value of the nonce.

   - `balance`: the balance, in "wei", of the account.  The value of
     this property is a Promise resolving to the Int value of the
     balance.  Note that 1 ether is equal to 1e18 wei.

 - `ethbase.Storage`: The constructor for the key-value storage
   associated with an address.  It accepts an argument convertible to
   address and returns an object with the following methods:

   - `getSubKey(key, start, size)`: fetches the `size` (number) bytes
     at storage key `key` (hex string) starting `start` (number) bytes
     in.  It returns a Promise resolving to the Buffer of these bytes.

   - `getKeyRange(start, itemsNum)`: fetches `itemsNum` (number) keys
     beginning at `start` (hex string) in a single contiguous Buffer.
     It returns a Promise resolving to this Buffer.

 - `ethbase.Storage.Word`: a constructor accepting hex strings,
   numbers, or Ints and encoding them into 32-byte Buffers.  It throws
   an exception if the input is too long.

 - `ethbase.Transaction`: a constructor for Ethereum transactions.
   `blockapps-js` abstracts a transaction into two parts:

   - *parameters*: The argument to Transaction is an object with up to
      four members: the numbers `value`, `gasPrice`, and `gasLimit`,
      whose defaults are provided in `ethbase.Transaction.defaults` as
      respectively 0, 1, and 3141592; and the hex string or Buffer
      `data`.  Optionally, this object may contain `to` as well, a
      value convertible to Address.

   - *participants*: A call to `ethbase.Transaction` returns an object
      with a method `send` taking two arguments, respectively a
      private key (hex string) and Address, denoting the sender and
      recipient of the transaction.  The second argument is optional
      if `to` is passed as a parameter to `ethbase.Transaction`, and
      overrides it if present.  Calling this function sends the
      transaction and returns a Promise resolving to the transaction
      result (see the "routes" section).

### The `routes` submodule

This submodule exports Javascript interfaces to the BlockApps web
routes for querying the Ethereum "database".  All of them return
Promises, since they must perform an asychronous request.  These
requests are made to the BlockApps server and path at:

 - `query.apiPrefix`: by default, `/eth/v1.0`.
 - `query.serverURI`: by default, `http://hacknet.blockapps.net`.

Some of the routes (namely, *faucet* and *submitTransaction*) poll the
server for their results, with the following parameters:

 - `polling.pollEveryMS`: by default, 500 (milliseconds)
 - `polling.pollTimeoutMS`: by default, 10000 (milliseconds)

The routes are:

 - `routes.solc(code)`: takes Solidity source code and returns a
   Promise resolving to an object `{vmCode, symTab, name}`, where
   `vmCode` is the compiled Ethereum VM opcodes, `name` is the name of
   the Solidity contract (currently, only code defining a single
   contract is supported), and `symTab` is an object containing
   storage layout and type information for all state variables and
   functions in the source.  Normally you will not need to use this
   object.

 - `routes.extabi(code)`: like `solc`, but returns only the symTab directly.

 - `routes.faucet(address)`: takes an argument convertible to Address
   and supplies it with 1000 ether.  This is available only on the
   BlockApps hacknet, for obvious reasons.

 - `routes.block(blockQueryObj)`: queries the block database,
   returning a list of Ethereum blocks as Javascript objects.  The
   following queries are allowed, and may be combined:

   - *ntx* : number of transactions in the block
   - *number* : block number; *minnumber*, *maxnumber*: range for *number*
   - *gaslim* : gas limit for the block; *mingaslim*, *maxgaslim*:
      range for *gaslim*
   - *gasused* : total gas used in the block; *mingasused*,
      *maxgasused*: range for *gasused*
   - *diff* : block difficulty (the basic mining parameter); *mindiff*,
      *maxdiff*: range for *diff*
   - *txaddress*: matches any block containing any transaction either
      from or to the given address.
   - *coinbase*: the address of the "coinbase"; i.e. the address mining the block.
   - *address*: matches any block in which the account at this address is present.
   - *hash*: the block hash

 - `routes.blockLast(n)`: returns the last *n* blocks in the database.

 - `routes.account(accountQueryObj)`, like `routes.block`, but queries
   accounts.  Its queries are:

   - *balance*, *minbalance*, *maxbalance*: queries the account balance
   - *nonce*, *minnonce*, *maxnonce*: queries the account nonce
   - *address*: the account address

 - `routes.accountAddress(address)`: a shortcut to
   `routes.account({"address" : address})` returning a single Ethereum
   account object (*not* an `ethcore.Account`) rather than a list.

 - `routes.transaction(transactionQueryObj)`: like `routes.block`, but
   queries transactions.  Its queries are:

   - *from*, *to*, *address*: matches transactions from, to, or either
      a particular address.
   - *hash*: the transaction hash.
   - *gasprice*, *mingasprice*, *maxgasprice*: the gas price of a transaction.
   - *gaslimit*, *mingaslimit*, *maxgaslimit*: the gas limit of a transaction.
   - *value*, *minvalue*, *maxvalue*: the value sent with the transaction.
   - *blocknumber*: the block number containing this transaction.

 - `routes.transactionLast(n)`: returns a list of the last *n*
   transactions received by the client operating the database.

 - `routes.submitTransaction(txObj)`: this is the low-level interface
   for the `ethcore.Transaction` object.  It accepts an object
   containing precisely the following fields, and returns a Promise
   resolving to "transaction result" object with fields summarizing
   the VM execution.  The Transaction and Solidity objects (below)
   handle the most useful cases, so when using this route directly,
   the most important fact about the transaction result is that its
   presence indicates success.

   - *nonce*, *gasPrice*, *gasLimit*: numbers.
   - *value*: a number encoded in base 10.
   - *codeOrData*, *from*, *to*: hex strings, the latter two addresses.
   - *r*, *s*, *v*, *hash*: cryptographic signature of the other parts.

 - `routes.storage(storageQueryObj)`: like `routes.block`, but queries
   storage.  It accepts the following queries:

   - *key*, *minkey*, *maxkey*: queries storage "keys", i.e. locations
      in memory. These are base-10 integer strings.
   - *keystring*, *keyhex*: alternative formats for key accepting
      UTF-8 strings or hex strings to denote the key.  They do not
      have corresponding ranges.
   - *value*, *minvalue*, *maxvalue*: base-10 storage values.
   - *valuestring*: alternative format as a UTF-8 string.
   - *address*: limits the storage to a particular address.  This is
      virtually required.

 - `routes.storageAddress(address)`: gets all storage from *address*.

### The `Solidity` submodule

This submodule is the interface to the Solidity language, allowing
source code to be transformed into Ethereum contracts and these
contracts' states queried and methods invoked directly from
Javascript.

 - `Solidity(code)`: effectively an interface to `routes.solc`, it
   returns a Promise of an object with the following prototype:

   - *code*: the constructing code.
   - *name*: the Solidity contract name.
   - *vmCode*: the compiled bytecode.
   - *symTab*: the storage layout and type "symbol table" of functions
      and variables
   - *newContract(privkey, [txParams])*: submits a contract creation
      transaction for the *vmCode* with the optional parameters
      (subject to `ethcore.Transaction.defaults`) as well as the
      *required* parameter *privkey*.  This returns the promise of a
      "contract object" described next.

 - The contract object has as its prototype the Solidity object that
   created it, as well as the following properties:

   - *account*: the `ethcore.Account` object for its address
   - *state*: an object containing as properties every state variable
      and top-level function in the Solidity code.  The value of
      `state.varName` is a Promise resolving to the value of that
      variable at the time the query is made, of the types given
      below.  Mappings and functions have special syntax.

Finally, it is possible to "attach" some metadata to a Solidity or
contract object.  This facilitates recording and reloading these
objects between sessions without creating new Ethereum contracts or
even recompiling.

  - `Solidity.attach({code, name, vmCode, symTab[, address]})`: given
    the metadata in the argument, create either a Solidity or contract
    object with this data.  More specifically:

    - If `address` is absent, a Solidity object is returned.  This
      object is equivalent to `Solidity(code)` with the other
      properties set to the values in the argument; no check is
      performed that these values are actually correct.  The only way
      you should use this is by the equivalent of
      `Solidity.attach(JSON.stringify(solObj))`, as it avoids
      recompilation.

    - If `address` is present, a contract object is returned.  This is
      the same as performing `Solidity(code).newContract(???)`, except
      that no private key is necessary and the resulting object's
      `account` member has address equal to `address`.  No check is
      performed that this address actually exists or has the Solidity
      ABI indicated by the other parameters.  It simply allows
      resuming work with a contract object previously created directly
      by `newContract`. (Note that `JSON.stringify(contractObj)` does
      not have the correct format to submit to `Solidity.attach`.)

#### State variables
Every Solidity type is given a corresponding Javascript (or Node.js)
type. They are:
   - *address*: the `ethcore.Address` (i.e. Buffer) type, of length 20 bytes.
   - *bool*: the `boolean` type.
   - *bytes* and its variants: the Buffer type of any length
   - *int*, *uint*, and their variants: the `ethcore.Int` (i.e. `big-integer`) type
   - *string*: the `string` type
   - arrays: Javascript arrays of the corresponding type.  Fixed and
     dynamic arrays are not distinguished in this representation.
   - enums: the type itself is represented via the `enum` library;
     each name/value is a value of this type.
   - structs: Javascript objects whose enumerable properties are the
     names of the fields of the struct, with values equal to the
     representations of the struct fields.

#### Mappings
These are treated specially in two ways.  First, naturally, a key must
be supplied and the corresponding value returned.  Second, a Solidity
mapping has no global knowledge of its contents, and thus, the entire
mapping cannot be retrieved with a single query.  Therefore, a mapping
variable accepts keys and returns promises of individual values, not
the promise of an associative array (as might be expected from the
description).  Each `state.mappingName` is a function having argument
and return value:

   - *argument*: The mapping key, provided as any value that
      represents (as above) or can be converted to the type of the
      mapping key (i.e. hex strings for Addresses).
   - *return value*: a Promise resolving to that value.

#### Functions
A Solidity function `fName` appears as `state.fName` in the
corresponding contract object.  This is actually a member function
that takes the arguments of `fName`, either as:

  - A single object whose enumerable properties are the names of the
    Solidity function's arguments, and whose values (like those of
    mapping keys) are apropriate representations of the arguments to
    be passed.  All arguments must be passed at once.

  - Multiple parameters corresponding to the arguments of the Solidity
    function.  This is chiefly useful for functions with anonymous or
    positionally meaningful parameters.  Again, all arguments must be
    passed at once.

The return value of this function has two methods:

  - *txParams(params)*: takes optional transaction parameters `{value,
      gasPrice, gasLimit}`.  Returns the same object, now with these
      parameters remembered.

  - *callFrom(privkey)*: calls the function from the account with the
     given private key.  Its return value is a Promise of the return
     value of the Solidity function, if any.

Thus, one calls a solidity function as

```js
contractObj.state.fName(args|arg1, arg2, ..)[   .txParams(params)].callFrom(privkey);
```

### The `MultiTX` submodule
This submodule makes use of a contract (currently only available on
hacknet.blockapps.net) that sequentially executes a list of
transactions in a single message call.  This has several advantages
over sending them individually in series:

 1. The overhead for a single Ethereum message call is 21,000 gas
   before the VM even begins execution.  This cost is *not* incurred
   for CALL opcodes within an existing execution environment, though,
   so enormous gas savings are possible if several transactions are
   rendered as CALLs in a single message-call transaction for which
   the up-front cost is only paid once.

   These savings are not realized for contract-creation transactions,
   since the CREATE opcode is even more expensive (32,000 gas).
   However, the following benefit may compensate even for this.

 2. A valid transaction must contain the current nonce of the sender,
   and if successful, increments that nonce.  Thus, each transaction
   in a sequence must wait for confirmation of the success of the
   previous one before it can be sent with any hope of acceptance.
   The MultiTX facility, however, only sends one transaction, and
   therefore only needs to query the nonce once, so there is no delay
   in executing the latter members of the sequence.

 3. Similarly, if one wishes to make a series of related transactions
   each depending on the outcome of the earlier ones, then they have
   to be sent in strict sequence.  MultiTX respects the sequencing of
   its arguments, but compresses the time frame for execution.

The `MultiTX` function takes one argument, a Javascript array of
"unsent transactions".  An unsent transaction can be either:

 - The result of a call to `ethbase.Transaction({data, value,
   gasLimit, to})`; `gasPrice`, if present, is ignored.  Though
   `gasLimit` is technically optional, it is recommended to include it
   in each case, because as the calls are made, these limits are
   deducted in advance, and one must take care not to run out of gas.

 - The result of a call to `contract.state.method(args)`, possibly
   with a subsequent `txParams` call, where `contract` is any Solidity
   contract object as described previously.

It accepts a further call to its member `txParams`, which only
respects the parameters `gasPrice` and `gasLimit`.  Each of the
constituent transactions is run with the gasLimit provided to it, and
the gas limit provided in `txParams` (or the default gas limit for a
Transaction, if not present) is used for the overall MultiTX call.
Since only one gas price can be set for a single VM run, the overall
`gasPrice` applies to all the constituents.

Finally, the member function `multiSend(privkey)` executes the list of
transactions in sequence in a single message call sent from the
account with the given private key.  Once again, since a single
transaction may have only one originator, it is not possible to send a
MultiTX from several accounts.

The value sent with MultiTX is computed from the constituent values;
there may be a fee in addition (at the moment, it is `0x400` wei),
which is automatically added on.

The call `MultiTX([txs]).multiSend(privkey)` returns the Promise of a
list of return values, one for each transaction.  If the return type
is unknown (as for a bare unsent `Transaction`) or void (as for a
Solidity function with no return value) then the corresponding entry
in the list is `null`; otherwise, it is the same as what would be
returned from a single Solidity method call.  If a constituent
transaction failed for some reason, then its return value is
`undefined`.
