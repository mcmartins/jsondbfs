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

var path = require('path'),
  _ = require('underscore'),
  async = require('async'),
  Collection = require('./lib/collection'),
  IOHandler = require('./lib/ioHandler');

/**
 * JSON DB FS Main entry point
 * Initializes a connection to the specified collections.
 *
 * @param collections an array of collections names
 *                    the collection names will be created as files in the specified 'path'
 * @param {Object} options
 *        {String} options.path defaults to '/tmp/'
 *        {String} options.inMemory defaults to 'false'
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
  if (!collections) {
    // at least one collection should be a provided, we cannot proceed
    return callback(new Error('No collections provided!'));
  }
  var self = this;
  // internal properties
  self._path = options.path || '/tmp/';
  self._inMemory = options.inMemory || false;
  self._ioHandler = new IOHandler(options);
  self._db = {};
  async.waterfall([
    function validatePath(next) {
      self._ioHandler.pathExists(self._path, function afterCheck(exists) {
        if (!exists) {
          console.error('Cannot access the following path: ' + self._path);
          return callback(new Error('Cannot access the following path: ' + self._path));
        }
        self._db._path = self._path;
        self._db._inMemory = self._inMemory;
        self._db._ioHandler = self._ioHandler;
        return next();
      });
    },
    function createCollections() {
      if (!_.isArray(collections)) {
        collections = [collections];
      }
      // in parallel initialize each collection
      async.each(collections, function create(collection, next) {
        var fullPath = path.join(self._path, collection + '.json');
        console.log('The following Collection is about to be attached: ' + collection);
        self[collection] = new Collection({db: self, path: fullPath});
        self._ioHandler.pathExists(fullPath, function afterCheck(exists) {
          if (!exists) {
            self._ioHandler.writeFile(fullPath, function afterWriteFile(err) {
              return next(err);
            });
          } else {
            // the file exists we're good to go (I hope ...)
            return next();
          }
        });
      }, function afterCreate(err) {
        if (err) {
          console.error('Collection names must not contain any extension or any character not allowed in a filename.');
          return callback(err);
        } else {
          console.log('JSON collections database path is: ' + self._path);
          return callback(null, self);
        }
      });
    }
  ]);
};