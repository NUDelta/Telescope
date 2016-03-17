def([
  "jquery",
  "backbone",
  "underscore",
  "./CurveLineView",
  "../routers/JSBinSocketRouter"
], function ($, Backbone, _, CurveLineView, JSBinSocketRouter) {
  return Backbone.View.extend({
    initialize: function (codeMirrorJSView, codeMirrorHTMLView) {
      this.codeMirrorJSView = codeMirrorJSView;
      this.codeMirrorHTMLView = codeMirrorHTMLView;
      this.drawLineFromJSToHTML = _.bind(this.drawLineFromJSToHTML, this);
      this.drawLineFromHTMLToJS = _.bind(this.drawLineFromHTMLToJS, this);
      this.removeJSToHTMLLine = _.bind(this.removeJSToHTMLLine, this);
      this.removeHTMLToJSLine = _.bind(this.removeHTMLToJSLine, this);
      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();
    },

    drawLineFromJSToHTML: function (gutterPillView) {
      var pillEl = gutterPillView.$el[0];
      var activeNodeModel = gutterPillView.activeNodeModel;

      var relatedDomQueries = activeNodeModel.get("relatedDomQueries");
      if (!relatedDomQueries || relatedDomQueries.length < 1) {
        return;
      }

      var arrLineNumbers = [];

      var rdqArr = [];

      _(relatedDomQueries).each(function (relatedDomQuery) {
        var domFnName = relatedDomQuery.domFnName;
        var queryString = relatedDomQuery.queryString;

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
      gutterPillView.setRelatedDomQueries(rdqArr);
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
      if (!gutterPillView.htmlRelatedNodeModels || gutterPillView.htmlRelatedNodeModels.length < 1) {
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

      _(gutterPillView.htmlRelatedNodeModels).each(function (activeNodeModel) {
        var invokes = activeNodeModel.get("invokes");

        _(invokes).each(function (invoke) {
          if(this.codeMirrorJSView.nodeIdGutterPill[invoke.nodeId]){
            var jsPill = this.codeMirrorJSView.nodeIdGutterPill[invoke.nodeId];
            arrJSPillEl.push(jsPill.$el[0]);
          }

          _(invoke.callStack || []).each(function (caller) {
            var jsPill = this.codeMirrorJSView.nodeIdGutterPill[caller.nodeId];
            if (!jsPill) {
              return;
            }

            arrJSPillEl.push(jsPill.$el[0]);
          }, this);
        }, this);
      }, this);

      var arrLines = [];

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