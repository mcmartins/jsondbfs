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

/**
 * Creates the collections json files in the specified path.
 * 
 * @returns Connection object
 * 
 */
module.exports.connect = function(path, collections, callback) {
  var self = this;
  self._db = {};
  async.waterfall([
    function validatePath(next) {
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
    function createCollections() {
      // FIXME replace this with underscore.js isArray
      if (typeof collections === 'object' && collections.length) {
       // FIXME must be asynchronous and in parallel
        for (var i = 0; i < collections.length; i++) {
          var p = path.join(self._db.path, (collections[i].indexOf(
              '.json') >= 0 ? collections[i] : collections[i] +
            '.json'));
          // FIXME must be asynchronous
          if (!util.isValidPath(p)) {
           // FIXME must be asynchronous
            util.writeToFile(p);
          }
          var _c = collections[i].replace('.json', '');
          self[_c] = new Collection(self, _c);
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
