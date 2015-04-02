/*global describe, it */
'use strict';
var assert = require('assert');
var dockerTracker = require('../');

describe('docker-tracker node module', function () {
  it('must have at least one test', function () {
    dockerTracker();
    assert(false, 'I was too lazy to write any tests. Shame on me.');
  });
});
