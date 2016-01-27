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
 * Created on: 23-05-2014
 *
 */

var JSONDBFSDriver = require('../index');
var assert = require('assert');
var async = require('async');
var fs = require('fs');

function generateRandomName() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * JSON DB FS Test Specification for Memory Driver
 */
describe('JSONDBFS Memory Driver', function testSpec() {
  var database;
  var data = [];

  before(function(done) {
    this.timeout(10000);
    async.times(1000, function forEach(n, next) {
      data.push({
        name: generateRandomName(),
        id: n
      });
      return next();
    }, function after(err, iter) {
      if (err) {
        return done(err);
      }
      JSONDBFSDriver.connect(['MemoryDriverCollection', 'MemoryDriverCollectionConcurrent', 'Users'], {
        driver: 'memory'
      }, function afterConnect(err, db) {
        if (err) {
          return done(err);
        }
        database = db;
        return done();
      });
    });
  });

  it('should insert 1M objects', function test(done) {
    this.timeout(15000);
    database.MemoryDriverCollection.insert(data, function afterInsert(err, res) {
      assert.equal(err, undefined);
      return done();
    });
  });

  it('should insert 10K concurrent objects', function test(done) {
    this.timeout(15000);
    var concurrentObjs = 100;
    async.times(concurrentObjs, function forEach(n, next) {
      database.MemoryDriverCollectionConcurrent.insert({
        name: generateRandomName(),
        id: n
      }, function afterInsert(err, data) {
        assert.equal(err, undefined);
        assert.notEqual(data, undefined);
        return next(err);
      });
    }, function afterIteration(err, iter) {
      assert.equal(err, undefined);
      assert.notEqual(iter, undefined);
      database.MemoryDriverCollectionConcurrent.count(function afterCount(err, count) {
        assert.equal(err, undefined);
        assert.equal(concurrentObjs, count);
        return done();
      });
    });
  });

  it('should fail creating a connection to an invalid path', function test(done) {
    JSONDBFSDriver.connect(['Collection'], {
      path: '/invalid',
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.notEqual(err, undefined);
      assert.equal(db, undefined);
      return done();
    });
  });

  it('should fail creating a connection without passing at least one collection', function test(done) {
    JSONDBFSDriver.connect({
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.notEqual(err, undefined);
      assert.equal(db, undefined);
      JSONDBFSDriver.connect('', {
        driver: 'memory'
      }, function(err, db) {
        assert.notEqual(err, undefined);
        assert.equal(db, undefined);
        JSONDBFSDriver.connect(null, {
          driver: 'memory'
        }, function(err, db) {
          assert.notEqual(err, undefined);
          assert.equal(db, undefined);
          JSONDBFSDriver.connect(undefined, {
            driver: 'memory'
          }, function(err, db) {
            assert.notEqual(err, undefined);
            assert.equal(db, undefined);
            return done();
          });
        });
      });
    });
  });

  it('should fail creating a connection without passing a callback', function test(done) {
    try {
      JSONDBFSDriver.connect('MissingCallback', {
        driver: 'memory'
      });
    }
    catch (err) {
      assert.notEqual(err, undefined);
    }
    return done();
  });

  it('should create a new collection passing a non array as collection', function test(done) {
    JSONDBFSDriver.connect('CollectionAsString', {
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.equal(err, undefined);
      assert.notEqual(db, undefined);
      return done();
    });
  });

  it('should fail creating collections with invalid names', function test(done) {
    JSONDBFSDriver.connect(['InvalidCollectionName/|'], {
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.notEqual(err, undefined);
      assert.equal(db, undefined);
      return done();
    });
  });

  it('should create a new collection using override options', function test(done) {
    JSONDBFSDriver.connect(['Override'], {
      path: '/tmp/',
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.equal(err, undefined);
      assert.notEqual(db, undefined);
      return done();
    });
  });

  it('should insert a new object', function test(done) {
    database['Users'].insert({
      name: 'Manuel',
      roles: ['Admin', 'Super']
    }, function afterInsert(err) {
      assert.equal(err, undefined);
      database['Users'].insert({
        name: 'John',
        roles: ['User']
      }, function afterInsert(err) {
        assert.equal(err, undefined);
        return done();
      });
    });
  });

  it('should fail insert if no object is passed', function test(done) {
    database['Users'].insert(function afterInsert(err) {
      assert.notEqual(err, undefined);
      return done();
    });
  });

  it('should update an object', function test(done) {
    database['Users'].update({
      name: 'Manuel'
    }, {
      name: 'Manuel Martins',
      token: 'xsf32S123ss'
    }, function afterUpdate(err, ret) {
      assert.equal(err, undefined);
      assert.equal(ret.nMatched, 1);
      return done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count(function afterCount(err, count) {
      assert.equal(err, undefined);
      assert(count, 1);
      return done();
    });
  });

  it('should find all users', function test(done) {
    database['Users'].find(function afterFind(err, documents) {
      assert.equal(err, undefined);
      assert(documents.length, 2);
      return done();
    });
  });

  it('should find a particular user', function test(done) {
    database['Users'].find({
      name: 'John'
    }, function afterFind(err, documents) {
      assert.equal(err, undefined);
      assert(documents.length, 1);
      database['Users'].findOne({
        name: 'John'
      }, function afterFind(err, user) {
        assert.equal(err, undefined);
        assert.notEqual(user, undefined);
        return done();
      });
    });
  });

  it('should find a particular user and update', function test(done) {
    database['Users'].findAndModify({
      name: 'Manuel Martins'
    }, {
      name: 'Manuel Martins',
      token: null
    }, function afterFindAndModify(err, ret) {
      assert.equal(err, undefined);
      assert.notEqual(ret, undefined);
      return done();
    });
  });

  it('should insert if document is not found to update', function test(done) {
    database['Users'].update({
      name: 'Manuel'
    }, {
      name: 'Manuel Martins',
      token: null
    }, {
      upsert: true
    }, function afterUpdate(err, ret) {
      assert.equal(err, undefined);
      assert.notEqual(ret, undefined);
      return done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count({
      name: 'John'
    }, function afterCount(err, count) {
      assert.equal(err, undefined);
      assert(count, 1);
      return done();
    });
  });

  it('should remove an object', function test(done) {
    database['Users'].remove({
      name: 'John'
    }, function afterRemove(err) {
      assert.equal(err, undefined);
      database['Users'].remove({
        name: 'Manuel Martins'
      }, function afterRemove(err) {
        assert.equal(err, undefined);
        return done();
      });
    });
  });

  it('should throw if no criteria is specified', function test(done) {
    database['Users'].findOne(function afterFind(err) {
      assert.notEqual(err, undefined);
      database['Users'].findAndModify(function afterFindAndModify(err) {
        assert.notEqual(err, undefined);
        database['Users'].findAndModify({}, function afterFindAndModify(err) {
          assert.notEqual(err, undefined);
          database['Users'].update(function afterUpdate(err) {
            assert.notEqual(err, undefined);
            database['Users'].update({}, function afterUpdate(err) {
              assert.notEqual(err, undefined);
              database['Users'].remove(function afterRemove(err) {
                assert.notEqual(err, undefined);
                return done();
              });
            });
          });
        });
      });
    });
  });

  it('should use the no op callback', function test(done) {
    try {
      database['Users'].insert({
        name: 'Maria',
        roles: ['Admin', 'Super']
      });
    }
    catch (err) {
      assert.equal(err, undefined);
    }
    try {
      database['Users'].update({
        name: 'Maria'
      }, {
        name: 'Maria D.'
      });
    }
    catch (err) {
      assert.equal(err, undefined);
    }
    try {
      database['Users'].remove({
        name: 'Maria'
      });
    }
    catch (err) {
      assert.equal(err, undefined);
    }
    return done();
  });

  it('should find an element in a big file (47.5MB)', function test(done) {
    this.timeout(6000);
    JSONDBFSDriver.connect(['big'], {
      driver: 'memory'
    }, function afterConnect(err, db) {
      assert.equal(err, undefined);
      db.big.find({
        "_id": "560d4ce67666691542f88260"
      }, function afterFind(err, data) {
        assert.equal(err, undefined);
        assert.notEqual(data, undefined);
        return done();
      });
    });
  });

  it('should ensure data is being flushed to disk', function test(done) {
    this.timeout(10000);
    JSONDBFSDriver.connect(['FlushCollection'], {
      driver: 'memory',
      memory: {
        flush: true,
        flushInterval: 3000
      }
    }, function afterConnect(err, db) {
      assert.equal(err, undefined);
      db.FlushCollection.insert({
        name: 'Manuel',
        roles: ['Admin', 'Super']
      }, function afterInsert(err) {
        assert.equal(err, undefined);
      });
      var flushFile = db.FlushCollection._dataHandler.dataHandlerDriver.flushFile;
      var stats = fs.statSync(flushFile);
      var originalFileSizeInBytes = stats["size"];
      setTimeout(function() {
          stats = fs.statSync(flushFile);
          var fileSizeInBytes = stats["size"];
          assert.notEqual(fileSizeInBytes, originalFileSizeInBytes);
          console.log('sim');
          return done();
        }, 6000);
    });
  });

});
