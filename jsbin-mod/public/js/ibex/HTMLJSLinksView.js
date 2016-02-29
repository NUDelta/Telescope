def([
  "jquery",
  "backbone",
  "underscore",
  "CurveLineView"
], function ($, Backbone, _, CurveLineView) {
  return Backbone.View.extend({
    initialize: function (codeMirrorJSView, codeMirrorHTMLView) {
      this.codeMirrorJSView = codeMirrorJSView;
      this.codeMirrorHTMLView = codeMirrorHTMLView;
      this.drawLineFromJSToHTML = _.bind(this.drawLineFromJSToHTML, this);
      this.drawLineFromHTMLToJS = _.bind(this.drawLineFromHTMLToJS, this);
      this.removeJSToHTMLLine = _.bind(this.removeJSToHTMLLine, this);
      this.removeHTMLToJSLine = _.bind(this.removeHTMLToJSLine, this);
    },

    drawLineFromJSToHTML: function (gutterPillView) {
      var pillEl = gutterPillView.$el[0];
      var activeNode = gutterPillView.trace;

      if (!activeNode.relatedDomQueries || activeNode.relatedDomQueries.length < 1) {
        return;
      }

      var arrLineNumbers = [];

      _(activeNode.relatedDomQueries).each(function (relatedDomQuery) {
        var domFnName = relatedDomQuery.domFnName;
        var queryString = relatedDomQuery.queryString;

        this.codeMirrorHTMLView.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
          this.codeMirrorHTMLView.addNodeMarker(gutterPillView.trace, marker);

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
    },

    removeJSToHTMLLine: function (gutterPillView) {
      this.codeMirrorHTMLView.clearMarkersForNode(gutterPillView.trace);

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.destroy();
      });

      gutterPillView.arrLines = [];
    },

    removeHTMLToJSLine: function (gutterPillView) {
      this.codeMirrorHTMLView.clearMarkersForNodes(gutterPillView.traces);

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.destroy();
      });

      gutterPillView.arrLines = [];
    },

    drawLineFromHTMLToJS: function (gutterPillView) {
      var activeNodes = gutterPillView.traces;
      if (!activeNodes || activeNodes.length < 1) {
        return;
      }

      var lineNumber = gutterPillView.line;
      var codeLine = this.codeMirrorHTMLView.htmlMirror.getLine(lineNumber);
      var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
      this.codeMirrorHTMLView.addNodesMarker(gutterPillView.traces, marker);

      var arrJSPillEl = [];

      _(activeNodes).each(function (activeNode) {
        var invokes = activeNode.get("invokes");

        _(invokes).each(function (invoke) {
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
          fromEl:null,
          toEl:el,
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