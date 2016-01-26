# JSON DB FS

[![Build Status](https://travis-ci.org/mcmartins/jsondbfs.svg)](https://travis-ci.org/mcmartins/jsondbfs)
[![Test Coverage](https://codeclimate.com/github/mcmartins/jsondbfs/badges/coverage.svg)](https://codeclimate.com/github/mcmartins/jsondbfs/coverage)
[![Code Climate](https://codeclimate.com/github/mcmartins/jsondbfs/badges/gpa.svg)](https://codeclimate.com/github/mcmartins/jsondbfs)
[![Dependency Status](https://gemnasium.com/mcmartins/jsondbfs.png)](https://gemnasium.com/mcmartins/jsondbfs)

[![NPM version](http://img.shields.io/npm/v/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/jsondbfs)
[![NPM downloads](http://img.shields.io/npm/dm/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/jsondbfs)

# README

JSON FileSystem Database is a JSON database such as MongoDB backed by FileSystem IO.<br/>
Currently supports 2 types of persistence drivers: Memory and Disk
Disk is Implemented with **Pessimistic Transaction Locking** approach.<br/>
All methods are asynchronous and accessing / filtering is executed in parallel using [async](https://github.com/caolan/async).<br/>
Based on [Jalalhejazi](https://github.com/Jalalhejazi), [jsonfs](https://github.com/Jalalhejazi/jsonfs).

# Dependencies

Internal unique ids generated with [node-uuid](https://github.com/broofa/node-uuid).<br/>
Object utility [underscore](https://github.com/jashkenas/underscore).<br/>
Methods implemented using asynchronous and parallel strategies from [async](https://github.com/caolan/async).<br/>
Pessimistic transaction locking is performed using [lockfile](https://github.com/npm/lockfile).<br/>
Criteria queries on JSON objects Mongo style [json-criteria](https://github.com/mirek/node-json-criteria).

# API

```javascript
  var JSONDBFSDriver = require('jsondbfs');
  var database;

  // receives an array containing the collections you want to create / use ['Users', 'Others']
  // existing collections will be attached
  JSONDBFSDriver.connect(['Users'], {path: '/path/to/store/collections', driver: 'memory'}, function(err, db){
    database = db;
  });

  // now the collection can be accessed in the database object: 'database['Users'].insert' or 'database.Users.insert'

  database.Users.insert({name: 'Manuel', roles: ['Admin', 'Super']}, function(err, document){
    // inserts the document and returns it representation in the database (including the internal id)
    ...
  });

  database.Users.count(function(err, count){
    // returns the length of the collection
    ...
  });

  database.Users.count({name: 'Manuel'}, function(err, count){
    // returns the number of documents matching that criteria
    ...
  });

  database.Users.update({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, function(err, result){
    // updates a specified document based on a criteria
    // result is { nMatched: 1, nModified: 1, nUpserted: 0 }
    ...
  });

  database.Users.findAndModify({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, {retObj: true}, function(err, result){
    // updates a specified document based on a criteria
    // result is the updated document
    // withou retObj info on updated / insert { nMatched: 1, nModified: 1, nUpserted: 0 } is returned
    ...
  });

  database.Users.find(function(err, documents){
    // returns everything since there is no criteria specified
    ...
  });

  database.Users.find({name: 'John'},function(err, documents){
    // returns an array with the elements that match the criteria
    ...
  });

  database.Users.findOne({name: 'John'},function(err, document){
    // returns the first document that matches the criteria
    ...
  });
  
  database.Users.remove({name: 'Manuel'}, function(err, success){
    // returns true if records were removed
    ...
  });
```

Support for [Query and Projection Operators](https://docs.mongodb.org/manual/reference/operator/query/):

```javascript
    database.Users.findOne({
      identities: {
        $elemMatch: {
          id: identity.id,
          provider: identity.provider
        }
      }
    }, function (err, document) {
      // returns the first document that matches the criteria inside an array of identities
      ...
    });

    database.Collection.find({
      quantity: { $gt: 25 }
    }, function (err, documents) {
      // returns the documents that matches the criteria
      ...
    });
    
    ...
```

Support provided by [json-criteria](https://github.com/mirek/node-json-criteria).

# Options

```javascript
// Driver options
var JSONDBFSDriver = require('jsondbfs');
var database;

// driver options
var driverOptions = {
 path: '/path/to/store/collections', 
 driver: 'memory' // defaults to 'disk'
 flush: 10000 // time interval to flush memory to disk
 };
JSONDBFSDriver.connect(['Collection'], driverOptions, callback);
...

// Collection options
database.Collection.update(criteria, updateCriteria, {upsert: false, multi: true, retObj: true}, callback);
database.Collection.findAndModify(criteria, updateCriteria, {upsert: false, multi: true, retObj: true}, callback);
database.Collection.find(criteria, {multi: false}, callback);
database.Collection.remove(criteria, {multi: false}, callback);
```

## Driver options

When initializing the Driver you can pass 2 options:

```bash
options.path - The path to store the collection files. Accepts a String. Defaults to '/tmp/'.
options.driver - One of ['memory', 'disk'], defaults to disk
```

### Database Collection File Lock options

Using a **Pessimistic Transaction Locking** approach, the collection files are protected using a transaction locking module.
The options to tune the lock are as follows:

```bash
options.lockWait - Time in ms to wait for lock release.
options.lockPollPeriod - Period in ms in which it polls to check if the lock has expired.
options.lockStale - A number of milliseconds before locks are considered to have expired.
options.lockRetries - Used by lock and lockSync. Retry n number of times before giving up.
options.lockRetryWait - Used by lock. Wait n milliseconds before retrying.
```

Please check [lockfile](https://github.com/npm/lockfile).

## Collections options

When updating a record you can pass 2 options:

```bash
options.upsert - If record is not found and this options is set to true, a new record will be created. Accepts a boolean 'true' or 'false'. Defaults to 'false'.<br/>
options.multi - Should update multiple records if they match. Accepts a boolean 'true' or 'false'. Defaults to 'true'.
options.retObj - Set to true if you want to return the updated object, otherwise a stats object is returned with info on updated records (as with MongoDB)
```

When removing or finding you can pass 1 option:

```bash
options.multi - Should update multiple records if they match. Accepts a boolean 'true' or 'false'. Defaults to 'true'.
```

Please check the implementation ands tests for more details.

# License

Apache License, Version 2.0
