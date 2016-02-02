var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var util = require('./util/util');
var ROUTES = require('./routes/routes');

var app = express();

var lessMiddleware = require('less-middleware');
var crossOriginMiddleware = require("./middleware/crossOriginMiddleware");

app.use(lessMiddleware(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'chrome-extension')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(crossOriginMiddleware);

//Upgrade HTTP traffic
require('http').createServer(function (req, res) {
  var host = req.headers.host.split(":")[0];
  res.writeHead(301, {"Location": "https://" + host + ":" + ROUTES.HTTPS_PORT + req.url});
  res.end();
}).listen(ROUTES.HTTP_PORT, function(){
  console.log('HTTPS upgrade listening on port ' + ROUTES.HTTP_PORT);
});

require("https").createServer({
  cert: util.getLocalCert(),
  key: util.getLocalKey()
}, app).listen(ROUTES.HTTPS_PORT, function () {
  console.log('Express server listening on port ' + ROUTES.HTTPS_PORT);
});

require("./routes/api")(app);
require('./routes/pages')(app);