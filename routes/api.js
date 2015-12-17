var instrumentService = require("../services/instrumentService");
var beautifyService = require("../services/beautifyService");
var routes = require("../routes/routes");

module.exports = function (app) {
  app.get(routes.INSTRUMENT, function (req, res) {
    var url = req.param("url");
    var html = req.param("html");
    var js = req.param("js");
    var basePath = req.param("basePath");
    var beautifyOnly = req.param("beautifyOnly");  //deprecated

    if (html === "true") {
      instrumentService.instrumentHTML(url, basePath, function (html) {
        res.send(html);
      });
    } else if (js === "true") {
      instrumentService.instrumentJS(url, basePath, function (js) {
        res.send(js);
      });
    }
  });

  app.get(routes.BEAUTIFY_HTML, function (req, res) {
    var url = req.param("url");

    beautifyService.beautifyHTML(url, function (beautifiedHTML) {
      res.send(beautifiedHTML);
    });
  });

  app.get(routes.BEAUTIFY_JS, function (req, res) {
    var url = req.param("url");

    beautifyService.beautifyJS(url, function (beautifiedJS) {
      res.send(beautifiedJS);
    });
  });
};


