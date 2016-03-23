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
      try {
        instrumentService.instrumentHTML(url, basePath, function (html) {
          res.send(html);
        });
      } catch (err) {
        console.warn("Error on instrumentHTML:", url);
        res.send("");
      }
    } else if (js === "true") {
      try {
        instrumentService.instrumentJS(url, basePath, function (js) {
          res.send(js);
        });
      } catch (err) {
        console.warn("Error on instrumentJS:", url);
        res.send("");
      }
    }
  });

  app.get("/inlineScriptSrcs", function (req, res) {
    var url = req.param("url");

    instrumentService.getInlineScriptSources(url, function (arrSrcs) {
      res.send(JSON.stringify(arrSrcs));
    });
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