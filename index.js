'use strict';

var DockerEvents = require('docker-events');

var events = require('events');
var util = require('util');

function DockerTracker(docker) {
  var that = this;
  this.containers = {};
  this.docker = docker;

  this.emitter = new DockerEvents({
    docker: docker
  });

  // TODO: die?

  ['create', 'start', 'stop'].forEach(function(eventName) {
    that.emitter.on(eventName, function(msg) {
      docker.getContainer(msg.id).inspect(function(err, containerData) {
        that.containers[msg.id] = containerData;
        that.emit(eventName, msg.id);
      });
    });
  });

  this.emitter.on('destroy', function(msg) {
    that.emit('destroy', msg.id);
    delete that.containers[msg.id];
  });

  docker.listContainers({all: true}, function (err, containers) {
    if (err) {
      throw err;
    }

    that.emitter.start();
    containers.forEach(function(containerInfo) {
      docker.getContainer(containerInfo.Id).inspect(function(err, containerData) {
        that.containers[containerInfo.Id] = containerData;
      });
    });

  });

}

util.inherits(DockerTracker, events.EventEmitter);


module.exports = function (docker) {
  return new DockerTracker(docker);
};
