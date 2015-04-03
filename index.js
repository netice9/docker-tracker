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
    docker.getContainer(msg.id).inspect(function(err, containerData) {
      that.containers[msg.id] = containerData;
    });
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
      docker.getContainer(containerInfo.Id).inspect(function(err, containerData) {
        that.containers[containerInfo.Id] = containerData;
      });
    });

  });

}

module.exports = function (docker) {
  return new DockerTracker(docker);
};
