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

var async = require('async'),
  merge = require('merge'),
  criteriaTest = require('json-criteria').test;

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
}

Collection.prototype.find = function(criteria, options, callback) {
  if (typeof options === 'function') {
    callback = options, options = {};
  }
  this._db._ioHandler.readFile(this._dbFile, function(err, collection) {
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
          if (!options.multi) {
            // go out if you just want to fin one record
          }
          next();
        }
      }, function finalize(err) {
        if (err) {
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
  this.find(criteria, {multi: false}, function(err, collection) {
    if (err) {
      return callback(err);
    }
    return callback(null, collection);
  });
};

Collection.prototype.findAndModify  = function(criteria, updateCriteria, callback) {
  return callback(new Error('Not implemented!'));
}

Collection.prototype.insert = function(data, callback) {
  var self = this;
  self._db._ioHandler.lockFile(function execute(err) {
    if (err) {
      // couldn't acquire the lock!
      return callback(err);
    }
    self._db._ioHandler.readFile(self._dbFile, function read(err, collection) {
      if (err) {
        // couldn't read the file!?
        return callback(err);
      }
      data._id = self._db._ioHandler.generateUUID();
      collection.push(data);
      self._db._ioHandler.writeFile(self._dbFile, collection, function finalize(err) {
        self._db._ioHandler.releaseLock();
        if (err) {
          // something happened while writing to the file!
          return callback(err);
        }
        return callback(null, data);
      });
    });
  });
};

Collection.prototype.update = function(criteria, data, options, callback) {
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
  // TODO should return an object as mongoDB { "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 }
  releaseLock();
  writeFile(collection);
  return ret;
};

Collection.prototype.remove = function(criteria, multi, callback) {
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  var self = this;
  self._db._ioHandler.lockFile(function execute(err) {
    if (err) {
      return callback(err);
    }
    self._db._ioHandler.readFile(self._dbFile, function(err, collection) {
      if (err) {
        return callback(err);
      }
      var resources = [];
      // filter collection using criteria in parallel
      async.each(collection, function filter(resource, next) {
        if (criteriaTest(resource, criteria)) {
          resources.push(resource);
        }
        next();
      }, function finalize(err) {
        if (err) {
          return callback(err);
        } else {
          self._db._ioHandler.writeFile(self._dbFile, resources, function finalize(err) {
            self._db._ioHandler.releaseLock();
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
  this._db._ioHandler.readFile(this._dbFile, function(err, collection) {
    return callback(err, collection.length);
  });
};

module.exports = Collection;