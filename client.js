"use strict";
var net = require('net');

// client is a net.Socket connection to the SERVER;
var client = net.connect({port: 6969, host: '0.0.0.0'}, function() {
  console.log('Listening on client: ' + client.localAddress + ':' + client.localPort);
  console.log('Connected to server: ' + client.remoteAddress + ':' + client.remotePort);
});

// send data from stdin to server;
process.stdin.on('data', function(data) {
  client.write(data);
});

// send data from server to stdout;
client.on('data', function(data) {
  process.stdout.write(data);
});

client.on('end', function() {
  console.log('Disconnected from server: ' + client.remoteAddress + ':' + client.remotePort);
});
