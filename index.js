'use strict';

var DockerEvents = require('docker-events');

function DockerTracker(docker) {
  var that = this;
  this.containers = {};
  this.docker = docker;

  this.emitter = new DockerEvents({
    docker: docker
  });

  this.emitter.on('create', function(msg) {
    that.containers[msg.id] = docker.getContainer(msg.id);
  });

  this.emitter.on('destroy', function(msg) {
    delete that.containers[msg.id];
  });

  docker.listContainers({all: true}, function (err, containers) {
    if (err) {
      throw err;
    }

    that.emitter.start();

    containers.forEach(function(containerInfo) {
      that.containers[containerInfo.Id] = docker.getContainer(containerInfo.Id);
    });

  });

}

module.exports = function (docker) {
  return new DockerTracker(docker);
};
