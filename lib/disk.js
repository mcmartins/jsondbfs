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

var util = require('./util');

/**
 * Provides disk storage to save data.
 *
 * @param {object} options
 * @param {string}  options.file
 * @constructor
 */
function Disk(options) {
  options = options || {};
  this.flushFile = options.file;
  console.log('Data will be handled using \'Disk\' driver');
}

/**
 * Writes a list of objects to the data driver
 *
 * @param content the content to write
 * @param callback
 */
Disk.prototype.set = function set(content, callback) {
  return util.fileSystem.write(this.flushFile, content, callback);
};

/**
 * Reads a list of objects from the data driver
 *
 * @param callback
 */
Disk.prototype.get = function get(callback) {
  return util.fileSystem.read(this.flushFile, callback);
};

/**
 * Locks the data provider
 *
 * @param callback
 */
Disk.prototype.lock = function lock(callback) {
  return util.fileSystem.lock(this.flushFile, callback);
};

/**
 * Unlocks the data provider
 *
 * @param callback
 */
Disk.prototype.unlock = function unlock(callback) {
  return util.fileSystem.unlock(this.flushFile, callback);
};

module.exports = Disk;
