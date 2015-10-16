"use strict";

var net = require('net');
var connects = [];

// socket is a net.Socket connection to a CLIENT;
// server is a net.Server object, NOT a Stream!
var server = net.createServer(function(socket) {
  console.log("Connect to client: " + socket.remoteAddress + ':' + socket.remotePort);
  connects.push(socket);

  // write data to stdout from client socket;
  socket.on('data', function(data) {
    process.stdout.write(data);
    // socket.unshift(data);

    for (var i = 0; i < connects.length; i++) {
      if (connects[i].remoteAddress !== socket.remoteAddress ||
        connects[i].remotePort !== socket.remotePort) {
          connects[i].write(socket.remoteAddress + ':' + socket.remotePort + ' data: ' + data);
          // socket.pipe(connects[i]);   // broadcast new data to clients;
      }
    }
  });

  socket.on('end', function() {
    console.log("Disconnected from client: " + socket.remoteAddress + ':' + socket.remotePort);
  });
});

server.listen(6969, '0.0.0.0', function() {
  console.log('Listening on server: ', server.address());
});
