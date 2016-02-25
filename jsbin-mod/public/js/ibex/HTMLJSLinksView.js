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
      var pillPos = gutterPillView.$el[0].getBoundingClientRect();
      var activeNode = gutterPillView.trace;

      if (!activeNode.relatedDomQueries || activeNode.relatedDomQueries.length < 1) {
        return;
      }

      var arrHTMLPos = [];

      _(activeNode.relatedDomQueries).each(function (relatedDomQuery) {
        var domFnName = relatedDomQuery.domFnName;
        var queryString = relatedDomQuery.queryString;

        this.codeMirrorHTMLView.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
          this.codeMirrorHTMLView.addNodeMarker(gutterPillView.trace, marker);

          var pos = $($(".CodeMirror-code")[0]).find("div:nth-child(" + lineNumber + ")")[0].getBoundingClientRect();
          arrHTMLPos.push(pos);
        }, this);
      }, this);

      var arrLines = [];

      _(arrHTMLPos).each(function (htmlPos) {
        var lineView = new CurveLineView(htmlPos, pillPos);
        lineView.draw();
        arrLines.push(lineView);
      });

      gutterPillView.arrLines = arrLines;
    },

    removeJSToHTMLLine: function (gutterPillView) {
      this.codeMirrorHTMLView.clearMarkersForNode(gutterPillView.trace);

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.undraw();
      });
    },

    removeHTMLToJSLine: function (gutterPillView) {
      this.codeMirrorHTMLView.clearMarkersForNodes(gutterPillView.traces);

      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.undraw();
      });
    },

    drawLineFromHTMLToJS: function (gutterPillView) {
      var activeNodes = gutterPillView.traces;
      if (!activeNodes || activeNodes.length < 1) {
        return;
      }

      var lineNumber = gutterPillView.line;
      var codeLine = this.codeMirrorHTMLView.htmlMirror.getLine(lineNumber);
      var marker = this.codeMirrorHTMLView.highlightLines(lineNumber, codeLine.length);
      var htmlPos = $($(".CodeMirror-code")[0]).find("div:nth-child(" + lineNumber + ")")[0].getBoundingClientRect();
      this.codeMirrorHTMLView.addNodesMarker(gutterPillView.traces, marker);

      var arrJSPos = [];

      _(activeNodes).each(function (activeNode) {
        var invokes = activeNode.get("invokes");

        _(invokes).each(function (invoke) {
          _(invoke.callStack || []).each(function (caller) {
            var jsPill = this.codeMirrorJSView.nodeIdGutterPill[caller.nodeId];
            if (!jsPill) {
              return;
            }

            var pos = jsPill.$el[0].getBoundingClientRect();
            arrJSPos.push(pos);
          }, this);
        }, this);
      }, this);

      var arrLines = [];

      arrJSPos = _(arrJSPos).filter(function (pos) {
        return pos.height > 0 && pos.width > 0;
      });

      _(arrJSPos).each(function (jsPos) {
        var lineView = new CurveLineView(htmlPos, jsPos);
        lineView.draw();
        arrLines.push(lineView);
      });

      gutterPillView.arrLines = arrLines;
    }
  })
});