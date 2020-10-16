// Including libraries
const app = require('http').createServer(function (request, response) {

    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(8080);

const io = require('socket.io').listen(app);
const static_server = require('node-static'); // for serving files

// This will make all the files in the current folder
// accessible from the web
const fileServer = new static_server.Server();

let id_room_dict = [];

// If the URL of the socket server is opened in a browser


// This is the port for our web server.
// you will need to go to http://localhost:8080 to see it
console.log("Starting")
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {
    //console.log(socket)
    // Start listening for mouse move events

    socket.join('default');

    socket.on('join', function (data){
      console.log(data);
      id_room_dict[data.id]= data.room;
      socket.join(data.room);
      io.in(data.room).emit('join', data);
    });

    socket.on('sync', function (data){
        console.log("Sync");
        console.log(data);
      socket.to(data.room).broadcast.emit('sync', data);
    });

    socket.on('start', function (data) {
        console.log("Start Game!");
        console.log(data);

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        socket.to(data.room).broadcast.emit('start', data);
    });

    socket.on('move', function (data) {

        console.log("move");

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        socket.to(data.room).broadcast.emit('move', data);
    });

    socket.on('opened', function (data) {

        console.log(data);

        // This line sends the event (broadcasts it)
        // to everyone except the originating client.
        socket.to(data.room).broadcast.emit('open', data);
    });


});