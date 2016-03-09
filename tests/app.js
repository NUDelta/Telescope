var express = require('express');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

var httpServer = require('http').createServer(app).listen(3004, function () {
  console.log(3004);
});