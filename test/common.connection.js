/**
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var assert = require('assert'),
    async = require('async'),
    conn = require('../lib/common/connection.js');

describe('Connection', function() {

  var tokenNeverExpires = new conn.Token('token', new Date(3000, 0, 0));
  var tokenExpired = new conn.Token('token', new Date(2011, 0, 0));
  it('should fetch a new token if token expires', function(done) {
    var c = new conn.Connection({
      email: 'x@provider',
      privateKey: '/some/path',
      scopes: ['scope1', 'scope2']
    });
    c.token = tokenExpired;
    c.fetchToken = function(cb) {
      done();
    };
    c.requester = function(opts, callback) {
      callback(null);
    };
    c.req({ uri: 'https://someuri' }, function(){});
  });

  it('should be able to make other requests wait while connecting', function(done) {
    var numTokenFetches = 0;
    var c = new conn.Connection({
      email: 'x@provider',
      privateKey: '/some/path',
      scopes: ['scope1', 'scope2']
    });
    c.fetchToken = function(cb) {
      numTokenFetches++;
      setTimeout(function() {
        cb(null, tokenNeverExpires);
      }, 100);
    };
    c.requester = function(opts, callback) {
      callback(null);
    };

    async.parallel([
      function(done) { c.req({ uri: 'https://someuri' }, done); },
      function(done) { c.req({ uri: 'https://someuri' }, done); },
      function(done) { c.req({ uri: 'https://someuri' }, done); }
    ], function(err) {
      assert.equal(err, null);
      assert.equal(numTokenFetches, 1);
      assert.equal(c.token, tokenNeverExpires);
      done();
    });
  });

  it('should fetch a new token if token is invalid', function(done) {
    var c = new conn.Connection({
      email: 'x@provider',
      privateKey: '/some/path',
      scopes: ['scope1', 'scope2']
    });
    c.token = new conn.Token();
    c.fetchToken = function(cb) {
      done();
    };
    c.requester = function(opts, callback) {
      callback(null);
    };
    c.req({ uri: 'https://someuri' }, function(){});
  });

});