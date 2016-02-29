module.exports = function (httpServer) {
  var socketIO = require("socket.io")(httpServer);
  var UserCollection = require("./UserCollection");
  var UserModel = require("./UserModel");
  var userCollection = new UserCollection();

  var io = socketIO;

  io.use(function (socket, next) {
    var userModel = userCollection.findByHandShake(socket.request);

    if (!userModel) {
      userModel = userCollection.createFromHandShake(socket.request);
    }

    socket.request.userModel = userModel;
    next(null, true);  //Mock authentication success
  });

  io.on("connection", function (socket) {
    socket.emit("user:id", {
        id: socket.request.userModel.get("id")
      }
    );

    socket.on("question:create", function (data) {
      io.sockets.emit("questionCollection:add", {foo:"bar"});
    });

  });
};