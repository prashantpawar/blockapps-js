# blockapps-js

[![Build Status](https://travis-ci.org/blockapps/blockapps-js.svg)](https://travis-ci.org/blockapps/blockapps-js)

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
TODO

## API details

The `blockapps-js` library has three main submodules.

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

 - `ethbase.Transaction`: a constructor for Ethereum transactions.  `blockapps-js` abstracts a transaction into two parts:

   - *parameters*: The argument to Transaction is an object with up to
      three members: `value`, `gasPrice`, and `gasLimit`, all numbers.
      Their defaults are provided in `ethbase.Transaction.defaults` as
      respectively 0, 1, and 3141592.

   - *participants*: A call to `ethbase.Transaction` returns a
      function with two arguments, respectively a private key (hex
      string) and Address, denoting the sender and recipient of the
      transaction.  Calling this function sends the transaction and
      returns a Promise resolving to the transaction result (see the
      "routes" section).

### The `routes` submodule

This submodule exports Javascript interfaces to the BlockApps web
routes for querying the Ethereum "database".  All of them return
Promises, since they must perform an asychronous request.  These
requests are made to the BlockApps server and path at:

 - `query.apiPrefix`: by default, `/eth/v1.0`.
 - `query.serverURI`: by default, `http://hacknet.blockapps.net`.

The routes are:

 - `routes.solc(code)`: takes Solidity source code and returns a
   Promise resolving to an object `{vmCode, symTab}`, where `vmCode`
   is the compiled Ethereum VM opcodes and `symTab` is an object
   containing storage layout and type information for all state
   variables and functions in the source.  Normally you will not need
   to use this object.

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
   - *vmCode*: the compiled bytecode.
   - *symTab*: the storage layout and type "symbol table" of functions and variables
   - *newContract([txParams])*: submits a contract creation transaction for the
      *vmCode* with the optional parameters (subject to
      `ethcore.Transaction.defaults`).  This returns the promise of a
      "contract object" described next.

 - The contract object has as its prototype the Solidity object that
   created it, as well as the following properties:

   - *account*: the `ethcore.Account` object for its address
   - *state*: an object containing as properties every state variable and top-level
      function in the Solidity code.  The value of `state.varName` is
      a Promise resolving to the value of that variable at the time
      the query is made, of the types given below.  Mappings and
      functions have special syntax.

 - **State variables**: Every Solidity is given a corresponding
     Javascript (or Node.js) type.  They are:
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

 - **Mappings**: These are treated specially in two ways.  First,
     naturally, a key must be supplied and the corresponding value
     returned.  Second, a Solidity mapping has no global knowledge of
     its contents, and thus, the entire mapping cannot be retrieved
     with a single query.  Therefore, a mapping variable accepts keys
     and returns promises of individual values, not the promise of an
     associative array (as might be expected from the description).
     Each `state.mappingName` is a function having argument and return
     value:

   - *argument*: The mapping key, provided as any value that
      represents (as above) or can be converted to the type of the
      mapping key (i.e. hex strings for Addresses).
   - *return value*: a Promise resolving to that value.

 - **Functions**: To call a function `state.funcName`, one must pass
     the arguments and, optionally, the transaction parameters
     (particularly important if a value transfer is required or the
     gas limit is notable).  Then, to actually make the call, the
     private key of the calling account must be provided.  The
     corresponding properties of `state.funcName` are:

   - *args*: this accepts a single parameter, an object whose
      enumerable properties are the names of the Solidity function's
      arguments, and whose values (like those of mapping keys) are
      apropriate representations of the arguments to be passed.  All
      arguments must be passed at once.

   - *argList*: this accepts an ordered list of unnamed arguments.
      This is chiefly useful for functions with anonymous or
      positionally meaningful parameters.  Again, all arguments must
      be passed at once; this is mutually exclusive with *args*.

   - *txParams*: the optional object `{value, gasPrice, gasLimit}` of
      transaction parameters.

   - *callFrom(privKey)*: calls the function from the account with the
      given private key.  Its return value is a Promise of the return
      value of the Solidity function, if any.