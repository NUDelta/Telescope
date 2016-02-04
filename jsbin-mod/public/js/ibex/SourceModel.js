def([
  "jquery",
  "backbone",
  "underscore"
], function ($, Backbone, _) {

  /*
   var mockModel = {
   builtIn: false,
   domPath: "html>head>script:eq(1)",
   inline: true,
   js: "window.bimBazz={};",
   order: 1,
   path: "https://localhost:3001/-script-0",
   url: "https://localhost:3001/"
   };
   */

  return Backbone.Model.extend({
    initialize:function(){
      this.traceCollection = this.collection.traceCollection;
    },

    getCode: function (activeCodeOnly) {
      if (activeCodeOnly) {
        return this.get("js");

      } else {
        return this.get("js");
      }
    },

    hide: function () {
      this.set("hidden", true);
    },

    show: function () {
      this.set("hidden", false);
    },

    isVisible: function () {
      return !this.get("hidden");
    },

    getDisplayName: function () {
      var path = this.get("path");
      var headBody = "";
      if (this.get("domPath").indexOf("body") === -1) {
        headBody = "(head)"
      } else {
        headBody = "(body)"
      }
    },

    setMirrorPos: function (mirrorPosition) {
      this.startLine = mirrorPosition.startLine;
      this.endLine = mirrorPosition.endLine;
    },

    getMirrorPos: function () {
      return {
        startLine: this.startLine,
        endLine: this.endLine
      };
    },

    markActiveCodeMirrorLines: function () {
      _(fondue.traces).each(function (trace) {
        var script = _(fondue.scripts).find(function (scriptObj) {
          return scriptObj.path === trace.path;
        });

        var lineOffset = script.binStartLine;

        var startLine = lineOffset + parseInt(trace.startLine);
        var endLine = lineOffset + parseInt(trace.endLine);
        var marker = this.jsMirror.markText(
          {
            line: startLine,
            ch: parseInt(trace.startColumn)
          },
          {
            line: endLine,
            ch: parseInt(trace.endColumn)
          },
          {
            css: "background-color:#fffcbd"
          }
        );

        var addedActiveLines = _.range(startLine, endLine + 1);
        marker.activeLines = addedActiveLines;
        fondue.activeLineColorMarks.push(marker);
        fondue.activeLines = fondue.activeLines.concat(addedActiveLines);

        if (trace.type === "function") {
          var pill = new GutterPillView(this.jsMirror, startLine, trace);
          pill.setCount(trace.hits);
        }
      }, this);
    }
  });
});