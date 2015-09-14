/**
 * (C) Copyright 2015 Manuel Martins.
 *
 * This module is inspired by json_file_system.
 * (json_file_system is Copyright (c) 2014 Jalal Hejazi,
 *  Licensed under the MIT license.)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Created by: ManuelMartins
 * Created on: 11-09-2015
 *
 */
'use strict';

require('babel/register');

var fs = require('fs'),
  async = require('async'),
  merge = require('merge'),
  uuid = require('node-uuid'),
  lockFile = require('lockfile'),
  criteriaTest = require('json-criteria').test,
  ENCODING = 'utf-8';

/**
 *
 * @param options
 * @constructor
 */
function Collection(options) {
  options = options || {};
  this._db = options.db;
  this._dbFile = options.path;
  this._inMemory = options.inMemory;
  this._lockFile = options.path + '.lock';
}

function generateUUID() {
  return uuid.v4().replace('/-/g', '');
}

function writeFile(content, callback) {
  content = content || [];
  fs.writeFile(this._dbFile, JSON.stringify(content, null, 0), callback);
}

function readFile(callback) {
  return fs.readFile(this._dbFile, ENCODING, function(err, content) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, JSON.parse(content));
    }
  });
}

function createLock(callback) {
  lockFile.lock(this._lockFile, {
    wait: 20000,
    pollPeriod: 50,
    stale: 500,
    retries: 5,
    retryWait: 500
  }, callback);
}

function releaseLock() {
  lockFile.unlock(this._lockFile, function handle(err){
    if(err) {
      console.log('Oopss');
    }
  });
}

Collection.prototype.find = function(criteria, callback) {
  readFile(function(err, collection) {
    if (err) {
      return callback(err);
    }
    if (!criteria) {
      return callback(null, collection);
    } else {
      var resources = [];
      // filter collection using criteria in parallel
      async.each(collection, function filter(resource, next) {
        if (criteriaTest(resource, criteria)) {
          resources.push(resource);
        }
      }, function finalize(err) {
        if (err) {
          console.log('Oopss');
          return callback(err);
        } else {
          return callback(null, resources);
        }
      });
    }
  });
};

Collection.prototype.findOne = function(criteria, callback) {
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  this.find(criteria, function(err, collection) {
    if (err) {
      return callback(err);
    }
    return callback(null, collection.length >= 0 ? collection[0] :
      undefined);
  });
};

Collection.prototype.save = function(data, callback) {
  createLock(function execute(err) {
    if (err) {
      return callback(err);
    }
    readFile(function read(err, collection) {
      if (err) {
        return callback(err);
      }
      data._id = generateUUID();
      collection.push(data);
      writeFile(collection, function finalize(err) {
        releaseLock();
        if (err) {
          console.log(err);
          return callback(err);
        }
        return callback(null, data);
      });
    });
  });
};

Collection.prototype.update = function(data, criteria, options, callback) {
  options = options || {};
  var ret = {},
    collection = readFile();
  var records = finder(collection, criteria, true);
  if (records.length) {
    if (options.multi) {
      // FIXME replace with jsoncriteria
      collection = updateFiltered(collection, criteria, data, true);
      ret.updated = records.length;
      ret.inserted = 0;
    } else {
      // FIXME replace with jsoncriteria
      collection = updateFiltered(collection, criteria, data, false);
      ret.updated = 1;
      ret.inserted = 0;
    }
  } else {
    if (options.upsert) {
      data._id = generateUUID();
      collection.push(data);
      ret.updated = 0;
      ret.inserted = 1;
    } else {
      ret.updated = 0;
      ret.inserted = 0;
    }
  }
  releaseLock();
  writeFile(collection);
  return ret;
};

Collection.prototype.remove = function(criteria, multi, callback) {
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  createLock(function execute(err) {
    if (err) {
      return callback(err);
    }
    readFile(function(err, collection) {
      if (err) {
        return callback(err);
      }
      var resources = [];
      // filter collection using criteria in parallel
      async.each(collection, function filter(resource, next) {
        if (criteriaTest(resource, criteria)) {
          resources.push(resource);
        }
      }, function finalize(err) {
        if (err) {
          console.log('Oops');
          return callback(err);
        } else {
          writeFile(resources, function() {
            releaseLock();
            if (err) {
              return callback(err);
            } else {
              return callback(null, true);
            }
          });
        }
      });
    });
  });
};

Collection.prototype.count = function(criteria, callback) {
  readFile(function(err, collection) {
    return callback(err, collection.length);
  });
};

module.exports = Collection;