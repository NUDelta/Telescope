var express = require('express');
var path = require('path');
var fs = require('fs');


var app = express();

app.use(function (req, res, next) {
  res.setHeader("origin", req.headers.origin);
  res.setHeader("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

  //res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

var HTTP_PORT = 3002;
var HTTPS_PORT = 3003;

//Upgrade HTTP traffic
var httpServer = require('http').createServer(function (req, res) {
  var host = req.headers.host.split(":")[0];
  res.writeHead(301, {"Location": "https://" + host + ":" + HTTPS_PORT + req.url});
  res.end();
}).listen(HTTP_PORT, function () {
  console.log('HTTPS upgrade listening on port ' + HTTP_PORT);
});

var httpsServer = require("https").createServer({
  cert: fs.readFileSync("mockCerts/cert.pem"),
  key: fs.readFileSync("mockCerts/key.pem")
}, app).listen(HTTPS_PORT, function () {
  console.log('Socket server listening on port ' + HTTPS_PORT);
});

require('./socketConf')(httpsServer);