/*global describe, it */
'use strict';
var assert = require('assert');
var dockerTracker = require('../');
var async = require('async');
var Docker = require('dockerode');
var docker = new Docker();
var devNull = require('dev-null');

describe('docker-tracker node module', function () {

  // kill all running containers before each test

  this.beforeEach(function(done) {
    docker.listContainers({all: true}, function (err, containers) {
      if (err) {
        return done(err);
      }
      var killContainer = function(containerInfo, callback) {
        var container = docker.getContainer(containerInfo.Id);
        container.remove({force: true}, callback);
      };

      async.each(containers, killContainer, done);
    });
  });


  this.beforeEach(function() {
    this.tracker = dockerTracker(docker);
  });

  describe('when there are no containers running', function(){
    it('has not containers in the model', function() {
      assert.deepEqual(this.tracker.containers, []);
    });
  });

  describe('when there is one container running', function() {

    this.beforeEach(function(done) {
      docker.run('ubuntu', ['bash', '-c', 'uname -a'], devNull(), done);
    });

    this.beforeEach(function(done) {
      setTimeout(done,400);
    });

    it ('has one container in the model', function() {
      assert.equal(Object.keys(this.tracker.containers).length, 1);
    });

    it ('keeps complete container information', function() {
      var firstKey = Object.keys(this.tracker.containers)[0];
      var firstValue = this.tracker.containers[firstKey];
      assert.notEqual(firstValue.State, null);
    });

    describe('when the container is deleted', function() {
      this.beforeEach(function(done) {
        var container = docker.getContainer(Object.keys(this.tracker.containers)[0]);
        container.remove({force: true}, done);
      });

      this.beforeEach(function(done) {
        setTimeout(done,400);
      });

      it('has no containers in the model', function() {
        assert.deepEqual(this.tracker.containers, {});
      });
    });

  });



});
