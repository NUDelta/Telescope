def([
  "jquery",
  "backbone",
  "underscore",
  "./CurveLineView",
  "../routers/JSBinSocketRouter"
], function ($, Backbone, _, CurveLineView, JSBinSocketRouter) {
  return Backbone.View.extend({
    initialize: function (codeMirrorJSView, codeMirrorHTMLView, activeNodeCollection) {
      this.codeMirrorJSView = codeMirrorJSView;
      this.codeMirrorHTMLView = codeMirrorHTMLView;
      this.drawLineFromJSToHTML = _.bind(this.drawLineFromJSToHTML, this);
      this.drawLineFromHTMLToJS = _.bind(this.drawLineFromHTMLToJS, this);
      this.removeJSToHTMLLine = _.bind(this.removeJSToHTMLLine, this);
      this.removeHTMLToJSLine = _.bind(this.removeHTMLToJSLine, this);
      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();
      this.activeNodeCollection = activeNodeCollection;
    },

    collapseAll: function () {
      this.codeMirrorJSView.collapseAllGutterPills();
      this.codeMirrorHTMLView.collapseAllGutterPills();
    },

    drawLineFromJSToHTML: function (gutterPillView) {
      var pillEl = gutterPillView.$el[0];
      var activeNodeModel = gutterPillView.activeNodeModel;

      var domQueries = this.activeNodeCollection.findQueriesPerNode(activeNodeModel);
      if (domQueries.length < 1) {
        return;
      }

      var arrLineNumbers = [];
      var rdqArr = [];

      _(domQueries).each(function (domQueryObj) {
        var domFnName = domQueryObj.domFnName;
        var queryString = domQueryObj.queryString;

        this.codeMirrorHTMLView.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
          this.codeMirrorHTMLView.addNodeMarker(activeNodeModel.get("id"), marker);

          rdqArr.push({
            domFnName: domFnName,
            queryString: queryString,
            html: codeLine
          });
          arrLineNumbers.push(lineNumber);
        }, this);
      }, this);

      var arrLines = [];

      if (arrLineNumbers.length) {
        this.collapseAll();
      }

      _(arrLineNumbers).each(function (lineNumber) {
        var lineView = new CurveLineView({
          fromHTMLLine: lineNumber,
          fromEl: null,
          toEl: pillEl,
          jsMirror: this.codeMirrorHTMLView.htmlMirror,
          htmlMirror: this.codeMirrorJSView.jsMirror
        });
        lineView.draw();
        arrLines.push(lineView);
      }, this);

      gutterPillView.arrLines = arrLines;
      gutterPillView.addRelatedDomQueries(rdqArr);
      this.emitHTMLSelect(true, gutterPillView.getRelatedDomQueries());
    },

    removeJSToHTMLLine: function (gutterPillView) {
      this.codeMirrorHTMLView.clearMarkersForNode(gutterPillView.activeNodeModel.get("id"));

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.destroy();
      });

      gutterPillView.arrLines = [];
      this.emitHTMLSelect(false, gutterPillView.getRelatedDomQueries());
    },

    emitHTMLSelect: function (selected, relatedDomQueries) {
      this.jsBinSocketRouter.emit("jsbin:html", {
        selected: selected,
        relatedDomQueries: relatedDomQueries
      });
    },

    removeHTMLToJSLine: function (gutterPillView) {
      var arrIds = _(gutterPillView.htmlRelatedNodeModels).map(function (activeNodeModel) {
        return activeNodeModel.get("id");
      });
      this.codeMirrorHTMLView.clearMarkersForNodes(arrIds);

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.destroy();
      });

      gutterPillView.arrLines = [];
    },

    drawLineFromHTMLToJS: function (gutterPillView) {
      if (!gutterPillView.htmlRelatedNodeModels) {
        return;
      }

      var lineNumber = gutterPillView.line;
      var codeLine = this.codeMirrorHTMLView.htmlMirror.getLine(lineNumber);
      var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
      var arrIds = _(gutterPillView.htmlRelatedNodeModels).map(function (activeNodeModel) {
        return activeNodeModel.get("id");
      });
      this.codeMirrorHTMLView.addNodesMarker(arrIds, marker);

      var arrJSPillEl = [];
      var queryNodeMap = this.activeNodeCollection.getDomQueryNodeMap();

      var arrRelatedDQ = gutterPillView.getRelatedDomQueries();
      _(arrRelatedDQ).each(function (dq) {
        var nodeModels = queryNodeMap[dq.domFnName + "|" + dq.queryString];
        _(nodeModels).each(function (nodeModel) {
          var jsPill = this.codeMirrorJSView.nodeIdGutterPill[nodeModel.get("id")];
          if (jsPill) {
            arrJSPillEl.push(jsPill.$el[0]);
          }
        }, this);
      }, this);

      var arrLines = [];

      if (arrJSPillEl.length) {
        this.collapseAll();
      }

      _(arrJSPillEl).each(function (el) {
        var lineView = new CurveLineView({
          fromHTMLLine: lineNumber,
          fromEl: null,
          toEl: el,
          jsMirror: this.codeMirrorHTMLView.htmlMirror,
          htmlMirror: this.codeMirrorJSView.jsMirror
        });
        lineView.draw();
        arrLines.push(lineView);
      }, this);

      gutterPillView.arrLines = arrLines;
    }
  })
});