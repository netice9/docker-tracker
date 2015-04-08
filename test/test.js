/*global describe, it */
'use strict';
var assert = require('assert');
var dockerTracker = require('../');
var async = require('async');
var Docker = require('dockerode');
var docker = new Docker();
// var devNull = require('dev-null');

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
    it('has no containers in the model', function() {
      assert.deepEqual(this.tracker.containers, []);
    });

    describe('when one container is added', function() {
      it ('emits "create" event', function(done) {
        this.tracker.once('create', function(containerId) {
          assert(containerId);
          done();
        });
        docker.createContainer({
          Cmd: ['sleep', '500'],
          Image: 'ubuntu',
          OpenStdin: false,
          Tty: false
        }, function(err) {
          if (err) {
            throw err;
          }
        });
      });

    });
  });

  describe('when there is one container running', function() {

    this.beforeEach(function(done) {
      docker.createContainer({
        Cmd: ['sleep', '500'],
        Image: 'ubuntu',
        OpenStdin: false,
        Tty: false
      }, function(err, container) {
        if (err) {
          return done(err);
        }
        container.start(done);
      });

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


    it ('emits "stop" event when container is stopped', function(done) {

      var firstKey = Object.keys(this.tracker.containers)[0];
      var firstValue = this.tracker.containers[firstKey];
      var container = docker.getContainer(firstValue.Id);
      container.stop(function(err) {
        if (err) {
          throw err;
        }
      });

      this.tracker.once('stop', function(containerId) {
        assert(containerId);
        done();
      });
    });

    it ('emits "destroy" event when container is removed', function(done) {

      var firstKey = Object.keys(this.tracker.containers)[0];
      var firstValue = this.tracker.containers[firstKey];
      var container = docker.getContainer(firstValue.Id);
      container.remove({force: true}, function(err) {
        if (err) {
          throw err;
        }
      });

      this.tracker.once('destroy', function(containerId) {
        assert(containerId);
        done();
      });
    });

    describe('when container is stopped', function() {

      this.beforeEach(function(done) {
        var container = docker.getContainer(Object.keys(this.tracker.containers)[0]);
        container.stop({}, done);
      });

      this.beforeEach(function(done) {
        setTimeout(done,600);
      });

      it ("container's state should be updated", function() {
        var firstKey = Object.keys(this.tracker.containers)[0];
        var firstValue = this.tracker.containers[firstKey];
        assert.equal(firstValue.State.Running, false);
      });

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
