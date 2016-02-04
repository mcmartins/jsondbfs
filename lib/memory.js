/**
 * (C) Copyright 2016 Manuel Martins.
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
 * Created on: 26-01-2016
 *
 */

'use strict';

var util = require('./util');

function defaultCallback(err) {
  if (err) {
    console.log(err);
  }
}

/**
 * Provides in memory storage and regular flush to disk.
 *
 * @param {object} options
 * @param {object}  options.db
 * @param {float}  options.db._flush
 * @param {string}  options.file
 * @constructor
 */
function Memory(options) {
  options = options || {};
  var self = this;
  self.flush = options.db._db._memory.flush || false;
  self.flushInterval = options.db._db._memory.flushInterval || 10000;
  self.flushFile = options.file;
  self.memoryTable = [];
  console.log('Data will be handled using \'Memory\' driver');
  // :S yeah we need to load it synchronously otherwise it might be loaded after the first insert
  var content = util.fileSystem.readSync(self.flushFile);
  self.set(content);
  if (self.flush) {
    console.log('\'Memory\' driver will flush data every %sms', self.flushInterval);
    // set interval to flush
    setInterval(function flushToDisk() {
      util.fileSystem.lock(self.flushFile, function afterLock(err) {
        if (err) {
          throw err;
        }
        self.get(function afterGet(err, inMemoryContent) {
          if (err) {
            util.fileSystem.unlock(self.flushFile);
            throw err;
          }
          util.fileSystem.write(self.flushFile, inMemoryContent, function afterWrite(err) {
            util.fileSystem.unlock(self.flushFile);
            if (err) {
              throw err;
            }
          });
        });
      });
    }, self.flushInterval);
  }
}

/**
 * Writes a list of objects to the data driver
 *
 * @param content the content to write
 * @param callback
 */
Memory.prototype.set = function set(content, callback) {
  var self = this;
  callback = callback || defaultCallback;
  self.memoryTable = util.clone(content);
  return callback(undefined, self.memoryTable);
};

/**
 * Reads a list of objects from the data driver
 *
 * @param callback
 */
Memory.prototype.get = function get(callback) {
  var self = this;
  process.nextTick(function(){
    callback = callback || defaultCallback;
    return callback(undefined, self.memoryTable);
  });
};

/**
 * Locks the data provider
 *
 * @param callback
 */
Memory.prototype.lock = function lock(callback) {
  process.nextTick(function(){
    callback = callback || defaultCallback;
    return callback(undefined);
  });
};

/**
 * Unlocks the data provider
 *
 * @param callback
 */
Memory.prototype.unlock = function unlock(callback) {
  process.nextTick(function(){
    callback = callback || defaultCallback;
    return callback(undefined);
  });
};

module.exports = Memory;
