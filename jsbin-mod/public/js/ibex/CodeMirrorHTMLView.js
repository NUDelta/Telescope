def([
  "jquery",
  "backbone",
  "underscore",
  "GutterPillView"
], function ($, Backbone, _, GutterPillView) {
  return Backbone.View.extend({
    htmlMirror: null,
    htmlSource: "",
    nodeMarkers: {},

    initialize: function (codeMirrors, htmlSource, activeNodeCollection) {
      this.codeMirrors = codeMirrors;
      this.htmlSource = htmlSource;
      this.activeNodeCollection = activeNodeCollection;
    },

    render: function () {
      this.htmlMirror = this.codeMirrors.html;
      this.htmlMirror.setCode(this.htmlSource);
      this.addGutterPills();
    },

    addGutterPills: function () {
      var queryNodeMap = this.activeNodeCollection.getDomQueryNodes();

      this.gutterPills = [];
      var domQueries = _(queryNodeMap).keys();
      _(domQueries).each(function (domFnQueryStr) {
        var domFnName = domFnQueryStr.split("|")[0];
        var queryString = domFnQueryStr.split("|")[1];
        var activeNodes = queryNodeMap[domFnQueryStr];

        this.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var pill = new GutterPillView(this.htmlMirror, lineNumber, activeNodes, this.sourceCollection);
          pill.setCount(activeNodes.length);
          this.gutterPills.push(pill);
        }, this);
      }, this);
    },

    whereLines: function (domFnName, queryString, iterFn, context) {
      if (context) {
        iterFn = _.bind(iterFn, context);
      }

      var htmlLineArr = [];
      for (var i = 0; i < this.htmlMirror.lineCount(); i++) {
        htmlLineArr.push(this.htmlMirror.getLine(i));
      }
      _(htmlLineArr).each(function (codeLine, lineNumber) {
        var queryFn = this.getjQueryFn(domFnName);

        try {
          if (queryFn(queryString, codeLine)) {
            iterFn(codeLine, lineNumber);
          }
        } catch (ig) {
        }
      }, this);
    },

    scrollTop: function () {
      window.setTimeout(_.bind(function () {
        this.jsMirror.scrollTo({line: 0, ch: 0});
        this.jsMirror.setCursor({line: 0});
      }, this), 1);
    },

    highlightLines: function (lineNumber, length) {
      var marker = this.htmlMirror.markText(
        {
          line: lineNumber,
          ch: 0
        },
        {
          line: lineNumber,
          ch: length - 1
        },
        {
          css: "background-color:#fffcbd"
        }
      );

      return marker;
    },

    addNodeMarker: function (node, marker) {
      this.nodeMarkers[node.id] = this.nodeMarkers[node.id] || [];
      this.nodeMarkers[node.id].push(marker);
    },

    clearMarkersForNode: function (node) {
      _(this.nodeMarkers[node.id]).each(function (marker) {
        marker.clear();
      });

      delete this.nodeMarkers[node.id];
    },

    getjQueryFn: function (expression) {
      switch (expression) {
        case "getElementsByTagName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "getElementsByTagNameNS":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "getElementsByClassName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("." + val).length;
          };
          break;
        case "getElementsByName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("[name='" + val + "']").length;
          };
          break;
        case "getElementById":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("#" + val).length;
          };
          break;
        case "querySelector":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "querySelectorAll":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        default:
          return function () {
          }
      }
    }
  });
});