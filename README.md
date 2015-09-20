# JSON DB FS

[![Build Status](https://travis-ci.org/mcmartins/jsondbfs.svg)](https://travis-ci.org/mcmartins/jsondbfs)
[![Test Coverage](https://codeclimate.com/github/mcmartins/jsondbfs/badges/coverage.svg)](https://codeclimate.com/github/mcmartins/jsondbfs/coverage)
[![Code Climate](https://codeclimate.com/github/mcmartins/jsondbfs/badges/gpa.svg)](https://codeclimate.com/github/mcmartins/jsondbfs)
[![Dependency Status](https://gemnasium.com/mcmartins/jsondbfs.png)](https://gemnasium.com/mcmartins/jsondbfs)

[![NPM version](http://img.shields.io/npm/v/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/jsondbfs)
[![NPM downloads](http://img.shields.io/npm/dm/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/jsondbfs)

# README

JSON FileSystem Database is a JSON database such as MongoDB backed by FileSystem IO.<br/>
Implemented with **Pessimistic Transaction Locking** approach.<br/>
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
var database,
  JSONDBFS = require('../index'),
  JSONDriver = new JSONDBFS({path: '/path/to/store/collections'});
  
  // receives an array containing the collections you want to create / use ['Users', 'Others']
  JSONDriver.connect(['Users'], function(err, db){
    database = db;
  });

  // the collection can be accessed by doing: 'database['Users'].insert' or 'database.Users.insert'
  database['Users'].insert({name: 'Manuel', roles: ['Admin', 'Super']}, function(err){
    ...
  });

  database['Users'].count(function(err, count){
    // returns the lenth of the collection
    // with criteria returns the number of documents matching that criteria
    ...
  });

  database['Users'].update({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, function(err, result){
    // result is { nMatched: 1, nModified: 1, nUpserted: 0 }
  });

  database['Users'].find(function(err, documents){
    // returns everything since there is no criteria specified
    ...
  });

  database['Users'].find({name: 'John'},function(err, documents){
    // returns an array with the elements that match the criteria
    ...
  });

  database['Users'].findOne({name: 'John'},function(err, document){
    // returns the first document that matches the criteria
    ...
  });
```

# Options

```javascript
var Driver = new JSONDBFS({path: '/path/to/store/collections', inMemory: true});
...
database.Collection.update(criteria, updateCriteria, {upsert: false, multi: true}, callback);
```

Please check the implementation ands tests for more details.

# License

Apache License, Version 2.0
