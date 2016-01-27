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

/**
 * Provides in memory storage and regular flush to disk.
 *
 * @param {Object} options
 * @param {float}  options.db._flush
 * @param {String}  options.file
 * @constructor
 */
function Memory(options) {
  options = options || {};
  var self = this;
  self.flush = options.db._db._flush || 10000;
  self.flushFile = options.file;
  self.memoryTable = new Set();
  console.log('Using \'Memory\' data handler...');
  util.fileSystem.read(self.flushFile, function afterRead(err, content) {
    if (err) {
      throw err;
    }
    self.memoryTable.add(content);
    // set interval to flush
    setInterval(function flushToDisk() {
      util.fileSystem.lock(self.flushFile, function afterLock(err) {
        if (err) {
          throw err;
        }
        self.get(function afterGet(err, content) {
          if (err) {
            util.fileSystem.unlock(self.flushFile);
            throw err;
          }
          util.fileSystem.write(self.flushFile, content, function afterWriteFile(err) {
            util.fileSystem.unlock(self.flushFile);
            if (err) {
              throw err;
            }
          });
        });
      });
    }, self.flush);
  });
}

/**
 * Writes a list of objects to the data driver
 *
 * @param content the content to write
 * @param callback
 */
Memory.prototype.set = function set(content, callback) {
  this.memoryTable.clear();
  this.memoryTable.add(content);
  return callback(undefined, this.memoryTable);
};

/**
 * Reads a list of objects from the data driver
 *
 * @param callback
 */
Memory.prototype.get = function get(callback) {
  return callback(undefined, Array.from(this.memoryTable));
};

/**
 * Locks the data provider
 *
 * @param callback
 */
Memory.prototype.lock = function lock(callback) {
  return callback(undefined);
};

/**
 * Unlocks the data provider
 *
 * @param callback
 */
Memory.prototype.unlock = function unlock(callback) {
  callback = callback || function afterUnlockFile(err) {
    if (err) {
      console.log('Oopss we couldn\'t release the lock!');
      throw err;
    }
  };
  return callback(undefined);
};

module.exports = Memory;
