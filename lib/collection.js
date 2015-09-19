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

require('babel/register');

var async = require('async'),
  _ = require('underscore'),
  criteriaTest = require('json-criteria').test;

/**
 * Defines a Collection.
 * Holds access methods to the current collection.
 *
 * @param {Object} options
 *        {String} options.db
 *        {String} options.path
 * @constructor
 */
function Collection(options) {
  options = options || {};
  this._db = options.db;
  this._dbFile = options.path;
  this._dbFileLock = options.path + '.lock';
}

/**
 * Filters the collection using mongodb criteria
 *
 * @param criteria
 * @param {Object} options
 *        {Boolean} options.multi
 * @param callback
 */
Collection.prototype.find = function (criteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {
      multi: true
    };
  }
  var self = this;
  self._db._ioHandler.readFile(self._dbFile, function afterReadFile(err, documents) {
    if (err) {
      return callback(err);
    }
    if (!criteria) {
      return callback(null, documents);
    } else {
      var filteredDocuments = [];
      // filter documents using criteria in parallel
      async.each(documents, function filter(document, next) {
        if (criteriaTest(document, criteria)) {
          if (!options.multi) {
            return next(document);
          }
          filteredDocuments.push(document);
        }
        return next();
      }, function finalize(err) {
        if (_.isError(err)) {
          return callback(err);
        } else if (err) {
          // is in fact the single object
          return callback(null, err);
        } else {
          return callback(null, filteredDocuments);
        }
      });
    }
  });
};

/**
 * Filters the collection using mongodb criteria and returns the first matched document
 *
 * @param criteria
 * @param callback
 * @returns {*}
 */
Collection.prototype.findOne = function (criteria, callback) {
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  var self = this;
  self.find(criteria, {multi: false}, function afterFind(err, filteredDocuments) {
    if (err) {
      return callback(err);
    }
    return callback(null, filteredDocuments);
  });
};

/**
 * Filters the collection using mongodb criteria updates the document(s) and returns the changed ones
 *
 * @param criteria
 * @param updateCriteria
 * @param {Object} options
 *        {Boolean} options.multi
 * @param callback
 * @returns {*}
 */
Collection.prototype.findAndModify = function (criteria, updateCriteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  if (!updateCriteria) {
    return callback(new Error('No update criteria specified!'));
  }
  var self = this;
  var ret = {
    nMatched: 0,
    nModified: 0,
    nUpserted: 0
  };
  self.find(criteria, function afterFind(err, filteredDocuments) {
    if (err) {
      return callback(err);
    }
    if (filteredDocuments) {
      // TODO implement options.multi
      async.each(filteredDocuments, function filter(document, nextDoc) {
        async.each(updateCriteria, function filter(propertyName, nextProp) {
          if (document.hasOwnProperty(propertyName)) {
            document[propertyName] = updateCriteria[propertyName];
          }
          return nextProp();
        }, function finalize(err) {
          if (err) {
            return callback(err);
          } else {
            self.update({_id: filteredDocuments[document]._id}, filteredDocuments[document],
              function afterUpdate(err, res) {
                if (err) {
                  return callback(err);
                }
                ret.nMatched += res.nMatched;
                ret.nModified += res.nModified;
                ret.nUpserted += res.nUpserted;
                return nextDoc();
              });
          }
        });
      }, function finalize(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, ret);
      });
    }
  });
};

/**
 * Inserts a new document in the collection
 *
 * @param data
 * @param callback
 */
Collection.prototype.insert = function (data, callback) {
  var self = this;
  self._db._ioHandler.lockFile(self._dbFileLock, function afterLockFile(err) {
    if (err) {
      return callback(err);
    }
    self._db._ioHandler.readFile(self._dbFile, function afterReadFile(err, documents) {
      if (err) {
        self._db._ioHandler.releaseLock(self._dbFileLock);
        return callback(err);
      }
      // generate unique internal id for each document
      data._id = self._db._ioHandler.generateUUID();
      documents.push(data);
      self._db._ioHandler.writeFile(self._dbFile, documents, function afterWriteFile(err) {
        self._db._ioHandler.releaseLock(self._dbFileLock);
        if (err) {
          // something happened while writing to the file!
          return callback(err);
        }
        return callback(null, data);
      });
    });
  });
};

/**
 * Updates documents based on mongodb criteria
 *
 * @param criteria
 * @param data
 * @param {Object} options
 *        {Boolean} options.multi
 *        {Boolean} options.upsert
 * @param callback
 */
Collection.prototype.update = function (criteria, data, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var ret = {
    nMatched: 0,
    nModified: 0,
    nUpserted: 0
  };
  var self = this;
  self._db._ioHandler.lockFile(self._dbFileLock, function afterLockFile(err) {
    if (err) {
      return callback(err);
    }
    self.find(criteria, options, function afterFind(err, filteredDocuments) {
      if (err) {
        self._db._ioHandler.releaseLock(self._dbFileLock);
        return callback(err);
      }
      if (filteredDocuments.length) {
        ret.nMatched = filteredDocuments.length;
        if (err) {
          self._db._ioHandler.releaseLock(self._dbFileLock);
          return callback(err);
        }
        if (!options.multi) {
          filteredDocuments = [filteredDocuments[0]];
        }
        async.each(filteredDocuments, function filter(document, nextDoc) {
          document = data;
          ret.nModified++;
          return nextDoc();
        }, function finalize(err) {
          if (err) {
            self._db._ioHandler.releaseLock(self._dbFileLock);
            return callback(err);
          }
          self._db._ioHandler.readFile(self._dbFile, function afterReadFile(err, documents) {
            if (err) {
              self._db._ioHandler.releaseLock(self._dbFileLock);
              // couldn't read the file!?
              return callback(err);
            }
            // TODO maybe this union won't work :S
            var mergedDocuments = _.union(documents, filteredDocuments);
            self._db._ioHandler.writeFile(self._dbFile, mergedDocuments, function afterWriteFile(err) {
              self._db._ioHandler.releaseLock(self._dbFileLock);
              if (err) {
                // something happened while writing the file!
                return callback(err);
              }
              return callback(null, ret);
            });
          });
        });
      } else {
        if (options.upsert) {
          self.insert(data, function afterInsert(err) {
            self._db._ioHandler.releaseLock(self._dbFileLock);
            if (err) {
              // something happened with the insert
              return callback(err);
            }
            ret.nUpserted = 1;
            return callback(null, ret);
          });
        } else {
          self._db._ioHandler.releaseLock(self._dbFileLock);
          return callback(null, ret);
        }
      }
    });
  });
};

/**
 * Removes documents based in mongodb criteria
 *
 * @param criteria
 * @param {Object} options
 *        {Boolean} options.multi
 * @param callback
 * @returns {*}
 */
Collection.prototype.remove = function (criteria, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!criteria) {
    return callback(new Error('No criteria specified!'));
  }
  var self = this;
  self.find(criteria, options, function afterFind(err, filteredDocuments) {
    if (err) {
      return callback(err);
    }
    self._db._ioHandler.lockFile(self._dbFileLock, function afterLockFile(err) {
      if (err) {
        return callback(err);
      }
      self._db._ioHandler.readFile(self._dbFile, function afterReadFile(err, documents) {
        if (err) {
          self._db._ioHandler.releaseLock(self._dbFileLock);
          return callback(err);
        }
        var mergedDocuments = _.intersection(documents, filteredDocuments);
        self._db._ioHandler.writeFile(self._dbFile, mergedDocuments, function afterWriteFile(err) {
          self._db._ioHandler.releaseLock(self._dbFileLock);
          if (err) {
            return callback(err);
          } else {
            return callback(null, true);
          }
        });
      });
    });
  });
};

/**
 * Counts the number of documents in the collection
 *
 * @param criteria
 * @param callback
 */
Collection.prototype.count = function (criteria, callback) {
  if (typeof criteria === 'function') {
    callback = criteria;
    criteria = null;
  }
  var self = this;
  if (!criteria) {
    self._db._ioHandler.readFile(self._dbFile, function afterReadFile(err, documents) {
      return callback(err, documents.length);
    });
  } else {
    self.find(criteria, function afterFind(err, filteredDocuments) {
      if (err) {
        return callback(err);
      }
      return callback(null, filteredDocuments.length);
    });
  }
};

module.exports = Collection;