"use strict";
var net = require('net');

var users = { Admin: { pwd: 'superSecretPWD123', last: 0 } };
var connects = {};    // { socketIP: { socket: socket, username: username } }

// socket is a net.Socket connection to a CLIENT;
// server is a net.Server object, NOT a Stream!
var server = net.createServer(function(socket) {
  console.log("Connected to client: ", socket.remoteAddress, ':', socket.remotePort);
  socket.write('Please input your username:password (separated by a colon) to login or register.\n');
  // use pipe() to handle memory & network usage, but need a transform stream to add and filter content;

  socket.on('data', function(data) {
    data = data.toString().trim();    // convert Buffer to a String, then trim();
    var authenticating = false;
    var colon = data.indexOf(':');
    var username = colon === -1 ? '' : data.substring(0, colon);
    var password = colon === -1 ? '' : data.substring(colon + 1);
    var socketIP = socket.remoteAddress + ':' + socket.remotePort;
    if (!connects[socketIP]) {        // if username is not registered or username is not logged in;
      if (colon === -1) {
        return socket.write('username:password (separated by a colon) must be inputted first.\n');
      }
      else if ((!users[username] && password) || (users[username] && users[username].pwd === password)) {
        if (!users[username])
          users[username] = { pwd: password, last: Date.now() };    // save the user;
        else if (users[username].last) {                            // only 1 session allowed;
          console.log('Access Denied: ' + username + ' already logged in. Client ', socketIP, ' denied.');
          socket.end('Access Denied: ' + username + ' already logged in.\n');
          return socket.destroy();
        }
        else
          users[username].last = Date.now();      // set last to prevent concurrent logins;
        authenticating = true;
      }
      else {    // new user but no password, or old user but password mismatch;
        console.log('Access Denied: invalid username and/or password: ', socketIP);
        socket.end('Access Denied: invalid username and/or password.\n');
        return socket.destroy();
      }
    }
    if (authenticating) {
      connects[socketIP] = { socket: socket, username: username };
      console.log(username, ' logged in at ', new Date());
      socket.write('You are now logged in to: ' + socket.localAddress + ':' + socket.localPort + '\n');
    }
    else if (data === 'logout') {
      username = connects[socketIP].username;   // set username, since client just sends 'logout';
      users[username].last = 0;     // reset to enable relogin;
      delete connects[socketIP];
      console.log(username, ' logged out at ', new Date());
      socket.end('You are now logged out from: ' + socket.localAddress + ':' + socket.localPort + '\n');
      socket.destroy();
    }
    else {
      var ips = Object.keys(connects);
      for (var i = 0; i < ips.length; i++) {
        if (ips[i] !== socketIP)       // broadcast new data to clients;
          connects[ips[i]].socket.write(connects[socketIP].username + ': ' + data + '\n');
      }
      process.stdout.write(connects[socketIP].username + ': ' + data + '\n');
    } // write data from client socket to stdout;
  });

  socket.on('end', function() {
    console.log("Disconnected from client: ", socket.remoteAddress, ':', socket.remotePort);
  });

  socket.on('error', function(error) {
    var socketIP = socket.remoteAddress + ':' + socket.remotePort;
    console.log('Error code (', error.code, '): ', error.message, '; Client: ', socketIP);
    delete connects[socketIP];
    socket.destroy();
  });
});

// send data from stdin to all clients;
process.stdin.on('data', function(data) {
  var ips = Object.keys(connects);
  for (var i = 0; i < ips.length; i++) {
    connects[ips[i]].socket.write('Admin: ' + data + '\n');
  }
});

process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');
server.listen(6969, '0.0.0.0', function() {
  console.log('Listening on server: ', server.address());
});
