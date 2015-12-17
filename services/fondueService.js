var fondue = require("../fondue/fondue");
var crypto = require("crypto");
var redis = require('redis');
var redisClient = redis.createClient();
var util = require("../util/util");

redisClient.on('connect', function () {
  console.log('Redis Connected.');
});

module.exports = {
  /**
   Returns instrumented JavaScript. From the cache, if it's there.
   */
  instrumentJavaScript: function (src, fondueOptions, callback, passedSource, i, iterLoc) {
    var md5 = crypto.createHash("md5");
    md5.update(JSON.stringify(arguments));
    var digest = md5.digest("hex");

    redisClient.get(digest, function (err, foundSrc) {
      if (foundSrc != null) {
        console.log("Found src:", digest);
        callback(foundSrc, passedSource, i, iterLoc);
      } else {
        console.log("Adding New Instrumented Source:", digest);
        var instrumentedSrc = fondue.instrument(src, fondueOptions).toString();

        redisClient.set(digest, instrumentedSrc, function (err, reply) {
          callback(instrumentedSrc, passedSource, i, iterLoc);
        });
      }
    });
  },

  /**
   Returns the given HTML after instrumenting all JavaScript found in <script> tags.
   */
  instrumentHTML: function (src, fondueOptions, callback) {
    var scriptLocs = [];
    var scriptBeginRegexp = /<\s*script[^>]*>/ig;
    var scriptEndRegexp = /<\s*\/\s*script/i;
    var lastScriptEnd = 0;

    var match;
    while (match = scriptBeginRegexp.exec(src)) {
      var scriptBegin = match.index + match[0].length;
      if (scriptBegin < lastScriptEnd) {
        continue;
      }
      var endMatch = scriptEndRegexp.exec(src.slice(scriptBegin));
      if (endMatch) {
        var scriptEnd = scriptBegin + endMatch.index;
        scriptLocs.push({start: scriptBegin, end: scriptEnd});
        lastScriptEnd = scriptEnd;
      }
    }

    var hits = 0;
    var retSrc = [];
    var instCallback = function (instSrc, passedSrc, preI, iterLoc) {
      hits++;
      retSrc[preI] = instSrc;

      if (hits === scriptLocs.length) {
        for (var i = scriptLocs.length - 1; i >= 0; i--) {
          passedSrc = passedSrc.slice(0, scriptLocs[i].start) + retSrc[i] + passedSrc.slice(scriptLocs[i].end);
        }

        // remove the doctype if there was one (it gets put back below)
        var doctype = "";
        var doctypeMatch = /^(<!doctype[^\n]+\n)/i.exec(passedSrc);
        if (doctypeMatch) {
          doctype = doctypeMatch[1];
          passedSrc = passedSrc.slice(doctypeMatch[1].length);
        }

        // assemble!
        passedSrc = doctype + "<script>\n" + fondue.instrumentationPrefix(fondueOptions) + "\n</script>\n" + passedSrc;

        callback(passedSrc, true);
      }
    };

    // process the scripts in reverse order
    for (var i = scriptLocs.length - 1; i >= 0; i--) {
      var loc = scriptLocs[i];
      var script = src.slice(loc.start, loc.end);
      var options = util.mergeInto(fondueOptions, {});
      options.path = options.path + "-script-" + i;
      var prefix = src.slice(0, loc.start).replace(/[^\n]/g, " "); // padding it out so line numbers make sense
      this.instrumentJavaScript(prefix + script, options, instCallback, src.valueOf(), i, loc);
    }
  }

};