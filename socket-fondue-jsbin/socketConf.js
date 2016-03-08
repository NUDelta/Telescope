module.exports = function (httpServer) {
  var socketIO = require("socket.io")(httpServer);
  var _ = require("underscore");
  var cheerio = require('cheerio');
  var beautify_html = require('js-beautify').html;
  var beautify_css = require('js-beautify').css;
  var htmlMinify = require('html-minifier').minify;

  var io = socketIO;
  var binSockets = {}; //supports multiple browsers

  io.use(function (socket, next) {
    next(null, true);  //Mock authentication success
  });

  var emitToBin = function (binId, eventStr, data) {
    if (binId) {
      var socketArr = binSockets[binId];
      _(socketArr).each(function (socket) {
        console.log("emitting ", eventStr, " to ", binId, " on socket id:", socket.id);
        socket.emit(eventStr, data);
      });
    }
  };

  //socket.on("question:create", function (data) {
  //  io.sockets.emit("questionCollection:add", {foo:"bar"});
  //});

  io.on("connection", function (socket) {
    socket.emit("user:id", {
        id: socket.id
      }
    );

    socket.on("listen", function (data) {
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

      io.sockets.emit("jsbin:live", {binId: binId});
      console.log("Bin [", binId, "] is listening on socket [", userId, "]");
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

    socket.on("fondueDTO:css", function (data) {
      console.log("heard css destined for bin ", data.binId);

      data.css = beautify_css(data.css, {
        "indent_size": 2,
        "indent_char": " ",
        "eol": "\n"
      });

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
      var body = $.html();

      body = htmlMinify(body, {
        removeComments: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        removeTagWhitespace:true,
        removeRedundantAttributes: true,
        useShortDoctype:true,
        removeEmptyAttributes: true
      });

      data.html = beautify_html(body, {
        "indent_size": 2,
        "indent_char": " ",
        "eol": "\n"
      });

      emitToBin(data.binId, "fondueDTO:html", data);
    });
  });
};


