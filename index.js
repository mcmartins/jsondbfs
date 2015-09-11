/**
 * (C) Copyright 2015 Manuel Martins.
 *
 * This module is inspired by json_file_system.
 * json_file_system is Copyright (c) 2014 Jalal Hejazi, Licensed under the MIT license.
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
  fs = require('fs'),
  async = require('async'),
  util = require('./util'),
  Collection = require('./collection'),
  msg = require('./messages.json');

module.exports.connect = function(path, collections, callback) {
  var self = this;
  self._db = {};
  async.waterfall([
    function createDBFile(next) {
      fs.exists(path, function(exists) {
        if (!exists) {
          console.log(msg.connect_error_db_path, path);
          return callback(new Error(msg.connect_error_db_path));
        }
        self._db.path = path;
        console.log(msg.connect_success + path);
        return next();
      });
    },
    function loadCollections() {
      if (typeof collections === 'object' && collections.length) {
        for (var i = 0; i < collections.length; i++) {
          var p = path.join(this._db.path, (collections[i].indexOf(
              '.json') >= 0 ? collections[i] : collections[i] +
            '.json'));
          if (!util.isValidPath(p)) {
            util.writeToFile(p);
          }
          var _c = collections[i].replace('.json', '');
          this[_c] = new Collection(this, _c);
        }
      } else {
        console.log(msg.invalid_connection_array);
        return callback(new Error(msg.invalid_connection_array));
      }
      console.log(msg.collections_loaded);
      return callback(null, self);
    }
  ]);
};
