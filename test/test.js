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
  assert = require('assert');

/**
 * JSON DB FS Test Specification
 */
describe('JSONDBFS Driver', function testSpec() {

  before(function (done) {
    var JSONDriver = new JSONDBFS({path: 'C:\\Users\\Manuel\\Desktop'});
    JSONDriver.connect(['TESTE'], function(err, db){
      console.log(db);
      db.TESTE.insert({teste: 'test data 1'}, function(err){
        db.TESTE.insert({teste: 'test data 2'}, function(err){
          db.TESTE.findOne({teste: 'test data 2'}, function(err, c){
            console.log('1'+c);
            db.TESTE.find({teste: 'test data 2'}, function(err, c){
              console.log('2'+c);
              db.TESTE.count(function(err, c){
                console.log('count'+c);
                db.TESTE.update({teste: 'test data 1'}, {teste: 'test data 3'},  {multi: true}, function(err, ret){
                  console.log(err);
                  console.log(ret);
                  db.TESTE.remove({teste: 'test data 1'}, {multi: true}, function(err){

                  })
                })
              });
            });
          });
        });
      });
    });
    done();
  });

  it('should create a new collection', function test(done) {
    assert(false, true);
    done();
  });

  it('should insert a new object', function test(done) {
    assert(false, true);
    done();
  });

});
