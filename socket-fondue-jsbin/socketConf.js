module.exports = function (httpServer) {
  var socketIO = require("socket.io")(httpServer);
  var _ = require("underscore");
  var cheerio = require('cheerio');
  var util = require("../fondue-api/util/util");

  var io = socketIO;
  var binSockets = {}; //supports multiple browsers
  var binBrowserSocket = {};

  var arrDisconnectedSocketIds = [];

  io.use(function (socket, next) {
    next(null, true);  //Mock authentication success
  });

  var deleteDisconnectedSocketId = function (id) {
    var ind = arrDisconnectedSocketIds.indexOf(id);
    if (ind >= 0) {
      arrDisconnectedSocketIds.splice(ind, 1);
    }
  };

  var emitToBin = function (binId, eventStr, data) {
    if (binId) {
      var socketArr = binSockets[binId];
      var deleteIndexes = [];

      _(socketArr).each(function (socket, i) {
        if (_(arrDisconnectedSocketIds).contains(socket.id)) {
          deleteIndexes.push(i);
          deleteDisconnectedSocketId(socket.id);
        } else {
          console.log("emitting ", eventStr, " to ", binId, " on socket id:", socket.id);
          socket.emit(eventStr, data);
        }
      });

      _(deleteIndexes).each(function (ind) {
        socketArr.splice(ind, 1);
      });
    }
  };

  var emitToBrowser = function (binId, eventStr, data) {
    if (binId) {
      var socket = binBrowserSocket[binId];
      if (socket) {
        if (_(arrDisconnectedSocketIds).contains(socket.id)) {
          delete binBrowserSocket[binId];
          deleteDisconnectedSocketId(socket.id);
          return;
        }

        console.log("emitting ", eventStr, " from bin ", binId, " to browser on socket id:", socket.id);
        socket.emit(eventStr, data);
      }
    }
  };

  io.on("connection", function (socket) {
    socket.emit("user:id", {
        id: socket.id
      }
    );

    socket.on("jsbin:listen", function (data) {
      var userId = data.userId;
      var binId = data.binId;
      var sockets = io.sockets;

      if (!userId || !binId) {
        console.error("Need userid and bin id to get socket connection");
      }

      if (binSockets[binId]) {
        binSockets[binId].push(sockets.sockets[userId]);
      } else {
        binSockets[binId] = [sockets.sockets[userId]];
      }

      io.sockets.emit("jsbin:listen", {
        binId: binId
      });
      console.log("Bin [", binId, "] is listening on socket [", userId, "]");
    });

    socket.on("browser:listen", function (data) {
      binBrowserSocket[data.binId] = socket;
      console.log("Browser with socketID [", socket.id, "] is listening to bin [", data.binId, "]");
    });

    socket.on("fondueDTO:nodeBacktrace", function (data) {
      emitToBin(data.binId, "fondueDTO:nodeBacktrace", data);
    });

    socket.on("fondueDTO:arrInvocations", function (data) {
      console.log("heard invocations destined for bin ", data.binId);

      emitToBin(data.binId, "fondueDTO:arrInvocations", data);
    });

    socket.on("fondueDTO:nodes", function (data) {
      console.log("heard nodes destined for bin ", data.binId);

      emitToBin(data.binId, "fondueDTO:nodes", data);
    });

    socket.on("fondueDTO:scripts", function (data) {
      console.log("heard scripts destined for bin ", data.binId);

      emitToBin(data.binId, "fondueDTO:scripts", data);
    });

    socket.on("fondueDTO:newNodeList", function (data) {
      console.log("heard nodes destined for bin ", data.binId);

      emitToBin(data.binId, "fondueDTO:newNodeList", data);
    });

    socket.on("fondueDTO:css", function (data) {
      console.log("heard css destined for bin ", data.binId);

      data.css = util.beautifyCSS(data.css);

      emitToBin(data.binId, "fondueDTO:css", data);
    });

    socket.on("fondueDTO:html", function (data) {
      console.log("heard html destined for bin ", data.binId);

      var $ = cheerio.load(data.html);
      $('[data-unravel="ignore"]').remove();
      $("meta").remove();
      $("link").remove();
      $("script").remove();
      $("style").remove();
      $("head").remove();
      $("noscript").remove();
      $("svg").remove();
      $("#unravel-introjs-style").remove();
      var body = $.html();

      data.html = util.beautifyHTML(body);

      emitToBin(data.binId, "fondueDTO:html", data);
    });


    socket.on("jsbin:reset", function (data) {
      emitToBrowser(data.binId, "jsbin:reset", data);
    });

    socket.on("jsbin:resendAll", function (data) {
      emitToBrowser(data.binId, "jsbin:resendAll", data);
    });

    socket.on("jsbin:html", function (data) {
      emitToBrowser(data.binId, "jsbin:html", data);
    });

    socket.on('disconnect', function () {
      arrDisconnectedSocketIds.push(socket.id);
    });
  });
};


