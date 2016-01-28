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

var path = require('path');
var _ = require('underscore');
var async = require('async');
var Collection = require('./lib/collection');
var util = require('./lib/util');

/**
 * JSON DB FS Main entry point
 * Initializes a connection to the specified collections.
 *
 * @param collections an array of collections names
 *                    the collection names will be created as files in the specified 'path'
 * @param {object} options
 * @param {string} options.path defaults to '/tmp/'
 * @param {string} options.driver one of ['memory', 'disk'], defaults to 'disk'
 * @param {object} options.memory
 * @param {boolean} options.memory.flush true if you want to flush memory to file, this will be used as the time to flush memory to disk, defaults to false
 * @param {float} options.memory.flushInterval when using 'memory' driver this will be used as the time to flush memory to disk, defaults to 10000ms (10s)
 * @param callback executes the callback with the default signature (err, database)
 */
module.exports.connect = function (collections, options, callback) {
  if (typeof collections === 'function') {
    callback = collections;
    collections = undefined;
  }
  if (typeof options === 'function') {
    // should be the callback
    callback = options;
    options = undefined;
  }
  if (!options) {
    options = {};
  }
  if (!callback || typeof callback !== 'function') {
    // callback should exist and should be a function, we cannot proceed without
    throw new Error('No callback provided!');
  }
  if (!collections || (!_.isArray(collections) && typeof collections !== 'string')) {
    // at least one collection should be a provided, we cannot proceed
    return callback(new Error('No collections provided!'));
  }
  var self = this;
  // internal properties
  self._db = {};
  self._db._path = options.path || '/tmp/';
  self._db._driver = options.driver || 'disk';
  self._db._memory = options.memory || {flush: false};
  async.waterfall([
    function validateDatabasePath(next) {
      util.fileSystem.exists(self._db._path, function afterCheck(exists) {
        if (!exists) {
          console.error('Cannot access the following path: %s', self._db._path);
          return callback(new Error('Cannot access the following path: ' + self._db._path));
        }
        return next();
      });
    },
    function attachOrCreateCollections() {
      if (!_.isArray(collections)) {
        collections = [collections];
      }
      // in parallel initialize each collection
      async.each(collections, function attachOrCreate(collection, next) {
        console.log('Collection \'%s\' is about to be attached', collection);
        var filePath = path.join(self._db._path, collection + '.json');
        util.fileSystem.exists(filePath, function afterCheck(exists) {
          if (!exists) {
            util.fileSystem.write(filePath, function afterWriteFile(err) {
              // we want to load into memory the file, so we need to create Collection object here
              if (err) {
                return next(err);
              }
              console.log('File \'%s\' has been created for Collection \'%s\'', filePath, collection);
              self[collection] = new Collection({db: self, file: filePath});
              return next();
            });
          } else {
            // the file exists we're good to go
            console.log('File \'%s\' has been attached for Collection \'%s\'', filePath, collection);
            self[collection] = new Collection({db: self, file: filePath});
            return next();
          }
        });
      }, function afterAttachOrCreate(err) {
        if (err) {
          console.error('Collection names must not contain any extension or any character not allowed in a filename.');
          return callback(err);
        } else {
          console.log('JSON collections database path is %s', self._db._path);
          return callback(undefined, self);
        }
      });
    }
  ]);
};
