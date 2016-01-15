var cheerio = require('cheerio');
var _ = require('underscore');
var URI = require('URIjs');
var request = require("request");
var util = require("../util/util");
var routes = require("../routes/routes");
var fondueService = require("./fondueService");

module.exports = {
  instrumentHTML: function (url, basePath, callback) {
    request({url: url, method: "GET", rejectUnauthorized: false, headers: {
      //"Host": "interfacelift.com",
      //"Connection": "keep-alive",
      //"Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36",
      //"DNT": "1",
      "Accept-Language": "en-US,en;q=0.8"
    }}, function (err, subRes, body) {
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

      var cleanedSrc = $.html();
      fondueService.instrumentHTML(cleanedSrc, fondueOptions, function (src) {
        var $ = cheerio.load(src);
        $("html > head").prepend($("script")[0]);

        var html = $.html();

        //var fs = require("fs");
        //fs.writeFileSync("foo.html", html, "utf8");

        callback(html);
      });
    });

  },

  instrumentJS: function (url, basePath, callback) {
    request({
      url: url,
      fileName: basePath,
      method: "GET",
      rejectUnauthorized: false,
      gzip: true
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