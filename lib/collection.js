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

require("babel-polyfill");

var util = require('./util');
var async = require('async');
var _ = require('underscore');
var DataHandler = require('./dataHandler');
var matchCriteria = require('json-criteria').test;

/**
 * Defines a Collection.
 * Holds access methods to the current collection.
 *
 * @param {object} options
 * @param {string} options.db the database object
 * @param {string} options.file the path of the collections
 * @constructor
 */
function Collection(options) {
  options = options || {};
  this._dataHandler = new DataHandler(options);
}

/**
 * Handles callback behaviour.
 * If call back is not provided or is not a function a 'no op callback' is used
 *
 * @param callback
 * @returns {*}
 */
function checkCallback(callback) {
  if (!callback || typeof callback !== 'function') {
    return function noopCallback() {
    };
  } else {
    return callback;
  }
}

/**
 * Filters the collection using mongodb criteria
 *
 * @param criteria the criteria to match
 * @param {object} options
 * @param {boolean} options.multi returns multiple if matches
 * @param callback
 */
Collection.prototype.find = function find(criteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (!options) {
    options = {
      multi: true
    };
  }
  if (typeof criteria === 'function') {
    callback = criteria;
    criteria = undefined;
  }
  callback = checkCallback(callback);
  var self = this;
  self._dataHandler.get(function afterReadFile(err, documents) {
    if (err) {
      return callback(err);
    }
    if (!criteria) {
      return callback(undefined, documents);
    } else {
      var filteredDocuments = [];
      async.each(documents, function filter(document, next) {
        if (matchCriteria(document, criteria)) {
          if (!options.multi) {
            return next(document);
          }
          filteredDocuments.push(document);
        }
        return next();
      }, function afterFiltering(result) {
        if (_.isError(result)) {
          return callback(result);
        } else if (result) {
          // ok, is not an error, so is the single object filtered
          return callback(undefined, result);
        } else {
          return callback(undefined, filteredDocuments);
        }
      });
    }
  });
};

/**
 * Filters the collection using mongodb criteria and returns the first matched document
 *
 * @param criteria the criteria to match
 * @param callback
 * @returns {*}
 */
Collection.prototype.findOne = function findOne(criteria, callback) {
  if (typeof criteria === 'function') {
    // must be the callback, but this method does not work without criteria
    callback = criteria;
    criteria = undefined;
  }
  callback = checkCallback(callback);
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  this.find(criteria, {multi: false}, callback);
};

/**
 * Filters the collection using mongodb criteria updates the document(s) and returns the changed ones
 *
 * @param criteria th criteria to match
 * @param updateCriteria the criteria to update
 * @param {object} options
 * @param {boolean} options.multi updates multiple if matches
 * @param {boolean} options.retObj true to return the changed object(s), returns an array with one or more match depending on options
 * @param callback
 * @returns {*}
 */
Collection.prototype.findAndModify = function findAndModify(criteria, updateCriteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (!options) {
    options = {
      multi: true,
      retObj: true
    };
  }
  if (typeof criteria === 'function') {
    // must be the callback, but this method does not work without criteria
    callback = criteria;
    criteria = undefined;
  }
  if (typeof updateCriteria === 'function') {
    // must be the callback, but this method does not work without update criteria
    callback = updateCriteria;
    updateCriteria = undefined;
  }
  callback = checkCallback(callback);
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  if (!updateCriteria) {
    return callback(new Error('No update criteria specified!'));
  }
  var self = this;
  self.update(criteria, updateCriteria, options, callback);
};

/**
 * Inserts a new document in the collection
 *
 * @param data the object to insert
 * @param callback
 */
Collection.prototype.insert = function insert(data, callback) {
  if (typeof data === 'function' || !data) {
    callback = data;
    data = undefined;
  }
  callback = checkCallback(callback);
  if (!data) {
    return callback(new Error('No data passed to persist!'));
  }
  var self = this;
  // generate unique internal id for each document
  data._id = util.generateUUID();
  self._dataHandler.lock(function afterLockFile(err) {
    if (err) {
      return callback(err);
    }
    self._dataHandler.get(function afterReadFile(err, documents) {
      if (err) {
        self._dataHandler.unlock();
        return callback(err);
      }
      documents.push(data);
      if (_.isArray(data)) {
        documents = _.flatten(documents);
      }
      self._dataHandler.set(documents, function afterWriteFile(err) {
        self._dataHandler.unlock();
        if (err) {
          return callback(err);
        }
        return callback(undefined, data);
      });
    });
  });
};

/**
 * Updates documents based on mongodb criteria
 *
 * @param criteria the criteria to match
 * @param updateCriteria the update criteria
 * @param {object} options
 * @param {boolean} options.multi update multiple if matches
 * @param {boolean} options.upsert insert if no matches were found to update
 * @param {boolean} options.retObj true to return the changed object(s), returns an array with one or more match depending on options
 * @param callback
 */
Collection.prototype.update = function update(criteria, updateCriteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (!options) {
    options = {
      upsert: false,
      multi: true,
      retObj: false
    };
  }
  if (typeof criteria === 'function') {
    // must be the callback, but this method does not work without criteria
    callback = criteria;
    criteria = undefined;
  }
  if (typeof updateCriteria === 'function') {
    // must be the callback, but this method does not work without update criteria
    callback = updateCriteria;
    updateCriteria = undefined;
  }
  callback = checkCallback(callback);
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  if (!updateCriteria) {
    return callback(new Error('No update criteria specified!'));
  }
  var ret = {
    nMatched: 0,
    nModified: 0,
    nUpserted: 0
  };
  var self = this;
  self._dataHandler.lock(function afterLockFile(err) {
    if (err) {
      return callback(err);
    }
    self._dataHandler.get(function afterReadFile(err, documents) {
      if (err) {
        self._dataHandler.unlock();
        return callback(err);
      }
      async.map(documents, function matches(document, next) {
        if (matchCriteria(document, criteria)) {
          for (var propertyName in updateCriteria) {
            document[propertyName] = updateCriteria[propertyName];
          }
          ret.nModified++;
          ret.nMatched++;
        }
        return next(undefined, document);
      }, function afterFilter(err, filteredDocuments) {
        if (err) {
          self._dataHandler.unlock();
          return callback(err);
        }
        if (!options.multi) {
          filteredDocuments = [filteredDocuments[0]];
        }
        if (ret.nModified > 0) {
          self._dataHandler.set(filteredDocuments, function afterWriteFile(err) {
            self._dataHandler.unlock();
            if (err) {
              return callback(err);
            }
            return callback(undefined, options.retObj ? filteredDocuments : ret);
          });
        } else {
          self._dataHandler.unlock();
          if (options.upsert) {
            self.insert(updateCriteria, function afterInsert(err) {
              if (err) {
                return callback(err);
              }
              ret.nUpserted = 1;
              return callback(undefined, options.retObj ? updateCriteria : ret);
            });
          } else {
            return callback(undefined, options.retObj ? updateCriteria : ret);
          }
        }
      });
    });
  });
};

/**
 * Removes documents based in mongodb criteria
 *
 * @param criteria the criteria to match
 * @param {object} options
 * @param {boolean} options.multi remove multiple if matches
 * @param callback
 * @returns {*}
 */
Collection.prototype.remove = function remove(criteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {
      multi: true
    };
  }
  if (typeof criteria === 'function') {
    // must be the callback, but this method does not work without criteria
    // should we allow to remove everything?
    callback = criteria;
    criteria = undefined;

  }
  callback = checkCallback(callback);
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  var self = this;
  self._dataHandler.lock(function afterLockFile(err) {
    if (err) {
      return callback(err);
    }
    self._dataHandler.get(function afterReadFile(err, documents) {
      if (err) {
        self._dataHandler.unlock();
        return callback(err);
      }
      async.reject(documents, function matches(document, next) {
        return next(matchCriteria(document, criteria));
      }, function afterFilter(filteredDocuments) {
        self._dataHandler.set(filteredDocuments, function afterWriteFile(err) {
          self._dataHandler.unlock();
          if (err) {
            return callback(err);
          } else {
            return callback(undefined, true);
          }
        });
      });
    });
  });
};

/**
 * Counts the number of documents in the collection
 *
 * @param criteria the criteria to match
 * @param callback
 */
Collection.prototype.count = function count(criteria, callback) {
  if (typeof criteria === 'function') {
    callback = criteria;
    criteria = undefined;
  }
  callback = checkCallback(callback);
  var self = this;
  if (!criteria) {
    self._dataHandler.get(function afterReadFile(err, documents) {
      return callback(err, documents.length);
    });
  } else {
    self.find(criteria, function afterFind(err, filteredDocuments) {
      if (err) {
        return callback(err);
      }
      return callback(undefined, filteredDocuments.length);
    });
  }
};

module.exports = Collection;
