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
 * Created on: 26-01-2016
 *
 */

'use strict';

var Memory = require('./memory');
var Disk = require('./disk');

/**
 * Provides the most common I/O operations.
 *
 * @param {object} options
 * @param {object} options.db
 * @param {object} options.db._
 * @param {string} options.db._._driver
 * @constructor
 */
function DataHandler(options) {
  options = options || {};
  var dataHandler = options.db._db._driver || 'disk';
  switch (dataHandler) {
    // load the driver to be used just once
    case 'memory':
      this.dataHandlerDriver = new Memory(options);
      break;
    case 'disk':
    default:
      this.dataHandlerDriver = new Disk(options);
  }
}

/**
 * Writes a list of objects to the data driver
 *
 * @param content the content to write
 * @param callback
 */
DataHandler.prototype.set = function write(content, callback) {
  return this.dataHandlerDriver.set(content, callback);
};

/**
 * Reads a list of objects from the data driver
 *
 * @param callback
 */
DataHandler.prototype.get = function read(callback) {
  return this.dataHandlerDriver.get(callback);
};

/**
 * Locks the data provider
 *
 * @param callback
 */
DataHandler.prototype.lock = function read(callback) {
  return this.dataHandlerDriver.lock(callback);
};

/**
 * Unlocks the data provider
 *
 * @param callback
 */
DataHandler.prototype.unlock = function read(callback) {
  return this.dataHandlerDriver.unlock(callback);
};


module.exports = DataHandler;
