const achieve = require('achieve');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const rooms = require('achieve_rooms');

// You can set place your app components anywhere, by setting the root path.
// achieve.setAppPath("C:/programs/tomcat9/webapps");

/*
// To use HTTPS or HTTP2, you need to have certificates.
// The options object provides certificate paths and non-default ports

const options = {
  key: fs.readFileSync('c:/mycerts/privkey.pem'),
  ca: fs.readFileSync('c:/mycerts/chain.pem'),
  cert: fs.readFileSync('c:/mycerts/fullchain.pem'),
  httpsPort: 8440,  // outside range example: "httpsPort: 0" defaults
  http2Port: 8441
};
*/

// Create servers for https, http, and http2
// Optional ... if you're just getting started and don't have certificates, just start http with 
// achieve.listen() which defaults to port 80 or achieve.listen(port number)
// Note that websockets are not yet supported on HTTP2
const sserver = achieve.slisten(options);
const server = achieve.listen(8989);  // backwards compatable ... if arg is Number, http is run on that port
const server2 = achieve.listen2(options);

// Create Websocket Servers
const ws1 = new WebSocket.Server({ noServer: true });
const wss1 = new WebSocket.Server({ noServer: true });

// Create handlers (call-backs) for insecure websockets
ws1.on('connection', function connection(ws) {
  console.log("non-secure connection");
  ws.on('message', function incoming(data) {
    console.log("ns broadcast: " + data);
    rooms.broadcast(ws,data);
  });
  ws.on('close', function close() {
    rooms.remove(ws);
  });
});
server.on('upgrade', function upgrade(request, socket, head) {
  console.log("ns upgrade");
  let pathname = url.parse(request.url).pathname;
    ws1.handleUpgrade(request, socket, head, function done(ws) {
      let room = rooms.joinRoom(ws,request.url);
      ws1.emit('connection', ws, request);
    });
});

// Create handlers (call-backs) for secure websockets
wss1.on('connection', function connection(ws, request) {
  console.log("secure connection");
  ws.on('message', function incoming(data) {
 //   console.log("message: " + data);
    rooms.broadcast(ws,data);
  });
  ws.on('close', function close() {
     rooms.remove(ws);
  });
});
sserver.on('upgrade', function upgrade(request, socket, head) {
  let pathname = url.parse(request.url).pathname;
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      let room = rooms.joinRoom(ws,request.url);
      wss1.emit('connection', ws, request);
    });
});
