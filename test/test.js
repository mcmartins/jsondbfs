/**
 * (C) Copyright 2014 WebGAP (http://www.webgap.eu/).
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
  JSONDriver, database;

/**
 * JSON DB FS Test Specification
 */
describe('JSONDBFS Driver', function testSpec() {

  before(function (done) {
    JSONDriver = new JSONDBFS();
    done();
  });

  it('should create a new collection', function test(done) {
    JSONDriver.connect(['Users'], function(err, db){
      assert.equal(err, undefined);
      assert.notEqual(db, undefined);
      console.log('Database Object: ' + db);
      database = db;
      done();
    });
  });

  it('should insert a new object', function test(done) {
    database['Users'].insert({name: 'Manuel', roles: ['Admin', 'Super']}, function(err){
      assert.equal(err, undefined);
      done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count(function(err, count){
      assert(count, 1);
      done();
    });
  });

  it('should update an object', function test(done) {
    database['Users'].update({name: 'Manuel'}, {name: 'Manuel Martins', token: 'xsf32S123ss'}, function(err, ret){
      assert.equal(ret.nMatched, 1);
      done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count(function(err, count){
      assert(count, 1);
      done();
    });
  });

  it('should insert another object', function test(done) {
    database['Users'].insert({name: 'John', roles: ['User']}, function(err){
      assert.equal(err, undefined);
      done();
    });
  });

  it('should count the number of objects', function test(done) {
    database['Users'].count(function(err, count){
      assert.equal(err, undefined);
      assert(count, 2);
      done();
    });
  });

  it('should find all users', function test(done) {
    database['Users'].find(function(err, documents){
      assert.equal(err, undefined);
      assert(documents.length, 2);
      console.log(documents);
      done();
    });
  });

  it('should find a particular user', function test(done) {
    database['Users'].find({name: 'John'},function(err, documents){
      assert.equal(err, undefined);
      assert(documents.length, 1);
      console.log(documents);
      done();
    });
  });

  it('should find a particular user', function test(done) {
    database['Users'].findOne({name: 'John'},function(err, user){
      assert.equal(err, undefined);
      assert.notEqual(user, null);
      console.log(user);
      done();
    });
  });

  it('should remove an object', function test(done) {
    database['Users'].remove({name: 'John'}, function(err){
      assert.equal(err, undefined);
      done();
    });
  });

  it('should remove an object', function test(done) {
    database['Users'].remove({name: 'Manuel Martins'}, function(err){
      assert.equal(err, undefined);
      done();
    });
  });

});
