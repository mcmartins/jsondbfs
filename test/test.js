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

var JSONDBFS = require('../index'),
  assert = require('assert'),
  async = require('async'),
  JSONDriver, database;

/**
 * JSON DB FS Test Specification
 */
describe('JSONDBFS Driver', function testSpec() {

  before(function (done) {
    JSONDriver = new JSONDBFS();
    done();
  });

  function generateRandomName() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  it('should insert 100000 entries', function test(done) {
    this.timeout(5000);

    var data = [];
    var Driver = new JSONDBFS();
    Driver.connect(['AnotherCollection'], function (err, db) {
      async.times(100000, function (n, next) {
        data.push({name: generateRandomName(), id: n});
        next();
      }, function (err, cenas) {
        assert.equal(err, undefined);
        assert.notEqual(cenas, undefined);
        db.AnotherCollection.insert(data, function (err, data) {
          assert.equal(err, undefined);
          assert.notEqual(data, undefined);
          done();
        });
      });
    });
  });

  it('should insert 100 concurrent objects', function test(done) {
    this.timeout(5000);
    var concurrent = 100;
    var Driver = new JSONDBFS();
    Driver.connect(['Concurrent'], function (err, db) {
      async.times(concurrent, function (n, next) {
        db.Concurrent.insert({name: generateRandomName(), id: n}, function (err, data) {
          assert.notEqual(data, undefined);
          next(err);
        });
      }, function afterInsert(err, iter) {
        assert.equal(err, undefined);
        assert.equal(iter, concurrent);
        db.Concurrent.count(function (err, count) {
          assert.equal(err, undefined);
          assert.equal(concurrent, count);
          done();
        });
      });
    });
  });

  it('should fail creating a connection to an invalid path', function test(done) {
    var Driver = new JSONDBFS({path: '/invalid'});
    Driver.connect(['Users'], function (err, db) {
      assert.notEqual(err, undefined);
      assert.equal(db, undefined);
      done();
    });
  });

  it('should create a new collection using override options', function test(done) {
    var Driver = new JSONDBFS({path: '/tmp/', inMemory: false});
    Driver.connect(['Users'], function (err, db) {
      assert.equal(err, undefined);
      assert.notEqual(db, undefined);
      done();
    });
  });

  it('should fail creating collections with invalid names / parameters', function test(done) {
    var Driver = new JSONDBFS({path: '/tmp/', inMemory: false});
    Driver.connect(['Users/|'], function (err, db) {
      assert.notEqual(err, undefined);
      assert.equal(db, undefined);
      Driver.connect('Users', function (err, db) {
        assert.notEqual(err, undefined);
        assert.equal(db, undefined);
        done();
      });
    });
  });

  it('should create a new collection using default options', function test(done) {
    JSONDriver.connect(['Users'], function (err, db) {
      assert.equal(err, undefined);
      assert.notEqual(db, undefined);
      // store database object to use later
      database = db;
      done();
    });
  });

  it('should insert a new object', function test(done) {
    database['Users'].insert({name: 'Manuel', roles: ['Admin', 'Super']}, function (err) {
      assert.equal(err, undefined);
      database['Users'].insert({name: 'John', roles: ['User']}, function (err) {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  it('should update an object', function test(done) {
    database['Users'].update({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, function (err, ret) {
      assert.equal(err, undefined);
      assert.equal(ret.nMatched, 1);
      done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count(function (err, count) {
      assert.equal(err, undefined);
      assert(count, 1);
      done();
    });
  });

  it('should find all users', function test(done) {
    database['Users'].find(function (err, documents) {
      assert.equal(err, undefined);
      assert(documents.length, 2);
      console.log(documents);
      done();
    });
  });

  it('should find a particular user', function test(done) {
    database['Users'].find({name: 'John'}, function (err, documents) {
      assert.equal(err, undefined);
      assert(documents.length, 1);
      console.log(documents);
      database['Users'].findOne({name: 'John'}, function (err, user) {
        assert.equal(err, undefined);
        assert.notEqual(user, null);
        console.log(user);
        done();
      });
    });
  });

  it('should find a particular user and update', function test(done) {
    database['Users'].findAndModify({name: 'Manuel Martins'}, {
      name: 'Manuel Martins',
      token: null
    }, function (err, ret) {
      assert.equal(err, undefined);
      assert.notEqual(ret, null);
      console.log(ret);
      done();
    });
  });

  it('should insert if document is not found to update', function test(done) {
    database['Users'].update({name: 'Manuel'}, {
      name: 'Manuel Martins',
      token: null
    }, {upsert: true}, function (err, ret) {
      assert.equal(err, undefined);
      assert.notEqual(ret, null);
      console.log(ret);
      done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count({name: 'John'}, function (err, count) {
      assert.equal(err, undefined);
      assert(count, 1);
      done();
    });
  });

  it('should remove an object', function test(done) {
    database['Users'].remove({name: 'John'}, function (err) {
      assert.equal(err, undefined);
      database['Users'].remove({name: 'Manuel Martins'}, function (err) {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  it('should throw if no criteria is specified', function test(done) {
    database['Users'].findOne(function (err) {
      assert.notEqual(err, undefined);
      database['Users'].findAndModify(function (err) {
        assert.notEqual(err, undefined);
        database['Users'].update(function (err) {
          assert.notEqual(err, undefined);
          database['Users'].update({}, function (err) {
            assert.notEqual(err, undefined);
            database['Users'].remove(function (err) {
              assert.notEqual(err, undefined);
              done();
            });
          });
        });
      });
    });
  });

  it('should throw if no callback is specified', function test(done) {
    try {
      database['Users'].findOne();
    } catch(err) {
      assert.notEqual(err, undefined);
    }
    try {
      database['Users'].find();
    } catch(err) {
      assert.notEqual(err, undefined);
    }
    try {
      database['Users'].count();
    } catch(err) {
      assert.notEqual(err, undefined);
    }
    done();
  });

  it('should use the noop callback', function test(done) {
    try {
      database['Users'].insert({name: 'Maria', roles: ['Admin', 'Super']});
    } catch(err) {
      assert.equal(err, undefined);
    }
    try {
      database['Users'].update({name: 'Maria'}, {name: 'Maria D.'});
    } catch(err) {
      assert.equal(err, undefined);
    }
    try {
      database['Users'].remove({name: 'Maria'});
    } catch(err) {
      assert.equal(err, undefined);
    }
    done();
  });

  it('should find an element in a big file', function test(done) {
    this.timeout(5000);
    var Driver = new JSONDBFS();
    Driver.connect(['big'], function (err, db) {
      db.big.find({"_id": "560d4ce67666691542f88260"}, function (err, data) {
        assert.equal(err, undefined);
        assert.notEqual(data, undefined);
        done();
      });
    });
  });

});
