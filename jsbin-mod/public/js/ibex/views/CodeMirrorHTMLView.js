def([
  "jquery",
  "backbone",
  "underscore",
  "./GutterPillView",
  "../routers/JSBinSocketRouter"
], function ($, Backbone, _, GutterPillView, JSBinSocketRouter) {
  return Backbone.View.extend({
    htmlMirror: null,
    htmlSource: "",
    nodeMarkers: {},
    gutterPills: [],

    initialize: function (codeMirrors, activeNodeCollection, jsBinRouter) {
      this.codeMirrors = codeMirrors;
      this.activeNodeCollection = activeNodeCollection;
      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();
      this.jsBinRouter = jsBinRouter;
    },

    render: function () {
      if (!this.htmlMirror) {
        this.htmlMirror = this.codeMirrors.html;
      }

      if (!this.htmlSource) {
        return;
      }
      this.htmlMirror.setCode(this.htmlSource);
      this.addGutterPills();
    },

    hasHTML: function () {
      return !!this.htmlSource;
    },

    removeAllGutterPills: function () {
      _(this.gutterPills).each(function (pill) {
        pill.destroy();
      }, this);

      this.gutterPills = [];
      this.lineGutterPill = {};
    },

    collapseAllGutterPills: function () {
      _(this.gutterPills).each(function (pill) {
        pill.collapseQuiet();
        this.eraseLinksToJS(pill);
      }, this);
    },

    addGutterPills: function () {
      this.removeAllGutterPills();

      var queryNodeMap = this.activeNodeCollection.getDomQueryNodeMap();

      var domQueries = _(queryNodeMap).keys();
      _(domQueries).each(function (domFnQueryStr) {
        var domFnName = domFnQueryStr.split("|")[0];
        var queryString = domFnQueryStr.split("|")[1];
        var activeNodes = queryNodeMap[domFnQueryStr];

        this.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var pill;
          if (this.lineGutterPill[lineNumber]) {
            pill = this.lineGutterPill[lineNumber];
          } else {
            pill = new GutterPillView(this.htmlMirror, lineNumber, null, this.sourceCollection, activeNodes, this.jsBinRouter);
            this.lineGutterPill[lineNumber] = pill;
          }

          pill.addRelatedDomQueries([{
            domFnName: domFnName,
            queryString: queryString,
            html: codeLine
          }]);

          pill.setCount(pill.getRelatedDomQueries().length);
          pill.setExpandFn(_.bind(this.drawLinksToJS, this));
          pill.setCollapseFn(_.bind(this.eraseLinksToJS, this));
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

    drawLinksToJS: function (gutterPillView) {
      this.htmlJSLinksView.drawLineFromHTMLToJS(gutterPillView);
      this.emitHTMLSelect(true, gutterPillView.getRelatedDomQueries());
    },

    eraseLinksToJS: function (gutterPillView) {
      this.htmlJSLinksView.removeHTMLToJSLine(gutterPillView);
      this.emitHTMLSelect(false, gutterPillView.getRelatedDomQueries());
    },

    emitHTMLSelect: function (selected, relatedDomQueries) {
      this.jsBinSocketRouter.emit("jsbin:html", {
        selected: selected,
        relatedDomQueries: relatedDomQueries
      });
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

    addNodeMarker: function (nodeId, marker) {
      this.nodeMarkers[nodeId] = this.nodeMarkers[nodeId] || [];
      this.nodeMarkers[nodeId].push(marker);
    },

    addNodesMarker: function (arrIds, marker) {
      var key = _(arrIds).join("");
      this.nodeMarkers[key] = this.nodeMarkers[key] || [];
      this.nodeMarkers[key].push(marker);
    },

    clearMarkersForNode: function (nodeId) {
      _(this.nodeMarkers[nodeId]).each(function (marker) {
        marker.clear();
      });

      delete this.nodeMarkers[nodeId];
    },

    clearMarkersForNodes: function (nodesArr) {
      var key = _(nodesArr).join("");

      _(this.nodeMarkers[key]).each(function (marker) {
        marker.clear();
      });

      delete this.nodeMarkers[key];
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