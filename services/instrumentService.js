var cheerio = require('cheerio');
var _ = require('underscore');
var URI = require('URIjs');
var request = require("request");
var util = require("../util/util");
var routes = require("../routes/routes");
var fondueService = require("./fondueService");

module.exports = {
  instrumentHTML: function (url, basePath, callback) {
    request({url: url, method: "GET", rejectUnauthorized: false}, function (err, subRes, body) {
      if (err) throw err;

      body = util.beautifyHTML(body);  //Remove crap that breaks fondue

      var $ = cheerio.load(body);
      var domItems = $("*");
      _(domItems).each(function (domItem) {
        var $domItem = $(domItem);

        if ($domItem.is("script")) {
          var elSrcLink = $domItem.attr("src");
          if (elSrcLink && elSrcLink.indexOf("chrome-extension") < 0) {
            if ($domItem.is("script")) {
              if (elSrcLink && elSrcLink.indexOf("http") < 0) {
                elSrcLink = URI(elSrcLink).absoluteTo(basePath).toString();
              }

              $domItem.attr("src", routes.HOST + routes.INSTRUMENT + "?js=true&url=" + encodeURIComponent(elSrcLink));
            }
          }
        }

      });

      var fondueOptions = {
        path: url,
        include_prefix: false
      };

      fondueService.instrumentHTML($.html(), fondueOptions, function (src) {
        var $ = cheerio.load(src);
        $("html > head").prepend($("script")[0]);
        callback($.html());
      });
    });

  },

  instrumentJS: function (url, basePath, callback) {
    request({
      url: url,
      fileName: basePath,
      method: "GET",
      rejectUnauthorized: false
    }, function (err, subRes, body) {
      if (err) throw err;

      var fondueOptions = {
        path: url,
        include_prefix: false
      };

      fondueService.instrumentJavaScript(body, fondueOptions, function (src) {
        callback(src);
      });
    });
  }
};