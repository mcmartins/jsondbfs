# JSON DB FS

[![Build Status](https://travis-ci.org/mcmartins/jsondbfs.svg)](https://travis-ci.org/mcmartins/jsondbfs)
[![Test Coverage](https://codeclimate.com/mcmartins/mcmartins/jsondbfs/badges/coverage.svg)](https://codeclimate.com/github/mcmartins/jsondbfs/coverage)
[![Code Climate](https://codeclimate.com/mcmartins/mcmartins/jsondbfs/badges/gpa.svg)](https://codeclimate.com/github/mcmartins/jsondbfs)
[![Dependency Status](https://gemnasium.com/mcmartins/jsondbfs.png)](https://gemnasium.com/mcmartins/jsondbfs)

[![NPM version](http://img.shields.io/npm/v/mcmartins/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/mcmartins/jsondbfs)
[![NPM downloads](http://img.shields.io/npm/dm/mcmartins/jsondbfs.svg?style=flat)](https://www.npmjs.com/package/mcmartins/jsondbfs)

# README

JSON FileSystem Database is a JSON database such as MongoDB backed by Files store in the FileSystem.<br/>
Implemented with **Pessimistic Transaction Locking** approach.<br/>
All methods are asynchronous and access / filtering is executed in parallel using [async](https://github.com/caolan/async).<br/>
Based on [Jalalhejazi](https://github.com/Jalalhejazi) [jsonfs](https://github.com/Jalalhejazi/jsonfs).

# Dependencies

Internal unique ids generated with [node-uuid](https://github.com/broofa/node-uuid).<br/>
Object utility [underscore](https://github.com/jashkenas/underscore).<br/>
Methods implemented using asynchronous and parallel strategies from [async](https://github.com/caolan/async).<br/>
Pessimistic transaction locking is performed using [lockfile](https://github.com/npm/lockfile).<br/>
Criteria queries on JSON objects Mongo style [json-criteria](https://github.com/mirek/node-json-criteria).

# API

```javascript
var JSONDBFS = require('../index'),
  JSONDriver = new JSONDBFS(),
  database;

  JSONDriver.connect(['Users'], function(err, db){
    database = db;
  });

  database['Users'].insert({name: 'Manuel', roles: ['Admin', 'Super']}, function(err){
    ...
  });

  database['Users'].count(function(err, count){
    ...
  });

  database['Users'].update({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, function(err, result){
    // { nMatched: 1, nModified: 1, nUpserted: 0 }
  });

  database['Users'].find(function(err, documents){
    ...
  });

  database['Users'].find({name: 'John'},function(err, documents){
    ...
  });

  database['Users'].findOne({name: 'John'},function(err, document){
    ...
  });
```

# License

Apache License, Version 2.0