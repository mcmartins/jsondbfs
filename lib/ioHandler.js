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
 * Created on: 13-09-2015
 *
 */

'use strict';

var fs = require('fs');
var uuid = require('node-uuid');
var lockFile = require('lockfile');
var ENCODING = 'utf-8';

/**
 * Provides the most common I/O operations.
 *
 * @param {Object} options
 * @param {float}  options.lockWait
 * @param {float}  options.lockPollPeriod
 * @param {float}  options.lockStale
 * @param {float}  options.lockRetries
 * @param {float} options.lockRetryWait
 * @constructor
 */
function IOHandler(options) {
  options = options || {};
  this._lockOptions = {
    wait: options.lockWait || 60000,
    pollPeriod: options.lockPollPeriod || 50,
    stale: options.lockStale || 60000,
    retries: options.lockRetries || 10000,
    retryWait: options.lockRetryWait || 50
  };
}

/**
 * Generates an UUID string without '-'
 */
IOHandler.prototype.generateUUID = function () {
  return uuid.v4().replace('/-/g', '');
};

/**
 * Writes objects into a file
 *
 * @param file the filoe to write
 * @param content the content to write
 * @param callback
 */
IOHandler.prototype.writeFile = function (file, content, callback) {
  if (typeof content === 'function') {
    callback = content;
    content = [];
  }
  fs.writeFile(file, JSON.stringify(content, null, 0), callback);
};

/**
 * Reads objects from a file. The object is parsed with JSON.parse
 *
 * @param file the file to read
 * @param callback
 */
IOHandler.prototype.readFile = function (file, callback) {
  return fs.readFile(file, ENCODING, function afterReadFile(err, content) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, JSON.parse(content));
    }
  });
};

IOHandler.prototype.pathExists = function (file, callback) {
  return fs.exists(file, callback);
};

/**
 * Creates a .lock file in order to guarantee atomicity
 *
 * @param file the file to lock
 * @param callback
 */
IOHandler.prototype.lockFile = function (file, callback) {
  lockFile.lock(file, this._lockOptions, callback);
};

/**
 * Release the .lock file
 *
 * @param file the file to release lock
 * @param callback
 */
IOHandler.prototype.releaseLock = function (file, callback) {
  callback = callback || function afterUnlockFile(err) {
      if (err) {
        console.log('Oopss we couldn\'t release the lock!');
        throw err;
      }
    };
  lockFile.unlock(file, callback);
};

module.exports = IOHandler;
