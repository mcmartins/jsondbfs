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

var ENCODING = 'utf-8';
var fs = require('fs');
var uuid = require('node-uuid');
var lockFile = require('lockfile');

/**
 * Generates an UUID string without '-'
 */
module.exports.generateUUID = function generateUUID() {
  return uuid.v4().replace('/-/g', '');
};

module.exports.fileSystem = {

  write: function write(file, content, callback) {
    if (typeof content === 'function') {
      callback = content;
      content = [];
    }
    content = JSON.stringify(content, null, 0);
    fs.writeFile(file, content, function afterWriteFile(err) {
      return callback(err);
    });
  },

  read: function read(file, callback) {
    return fs.readFile(file, ENCODING, function afterReadFile(err, content) {
      if (err) {
        return callback(err);
      }
      else {
        return callback(null, JSON.parse(content));
      }
    });
  },

  exists: function exists(file, callback) {
    return fs.exists(file, callback);
  },

  lock: function(file, callback) {
    var _dbFileLock = generateLockFileName(file);
    lockFile.lock(_dbFileLock, _lockOptions, callback);
  },

  unlock: function(file, callback) {
    callback = callback || function afterUnlockFile(err) {
      if (err) {
        console.log('Oopss we couldn\'t release the lock!');
        throw err;
      }
    };
    var _dbFileLock = generateLockFileName(file);
    lockFile.unlock(_dbFileLock, callback);
  }
};

var _lockOptions = {
  wait: 10000,
  pollPeriod: 100,
  stale: 10000,
  retries: 1000,
  retryWait: 100
};

function generateLockFileName(file) {
  return file + '.lock';
}