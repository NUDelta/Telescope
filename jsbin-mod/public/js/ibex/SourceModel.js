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
    initialize: function () {
      this.traceCollection = this.collection.traceCollection;
    },

    getCode: function () {
      return this.get("js");
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

    getActiveLines: function () {
      var traces = this.traceCollection.where({path: this.get("path")});

      var arr = [];
      _(traces).each(function (trace) {
        var startLine = this.startLine + parseInt(trace.get("startLine")) - 1; //minus 1 codemirror lines are 0 based
        var endLine = this.startLine + parseInt(trace.get("endLine")) -1;

        arr = arr.concat(_.range(startLine, endLine + 1));
      }, this);

      return arr;
    }
  });
});