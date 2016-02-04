def([
  "jquery",
  "backbone",
  "underscore",
  "GutterPillView",
], function ($, Backbone, _, GutterPillView) {
  return Backbone.View.extend({
    jsMirror: null,
    sources: null,
    mirrorLastLine: 0,
    activeCodeOnly: true,

    initialize: function (codeMirror, sourceCollection) {
      this.jsMirror = codeMirror;
      this.jsMirror.setOption("lineNumbers", true);
      this.sourceCollection = sourceCollection;
    },

    showSources: function () {
      this.deleteAllLines();

      var sourceModels = this.sourceCollection.getOrdered();
      _(sourceModels).each(function (sourceModel) {
        if (!sourceModel.isVisible()) {
          return;
        }

        var sourceCode = sourceModel.getCode(this.activeCodeOnly);
        var mirrorPosition = this.insertLines(sourceCode);
        sourceModel.setMirrorPos(mirrorPosition);
      }, this);

      this.scrollTop();
    },

    showInactive: function () {
      this.activeCodeOnly = false;
      this.showSources();
    },

    hideInactive: function () {
      this.activeCodeOnly = true;
      this.showSources();
    },

    showSourceModel: function (sourceModel) {
      sourceModel.show();
      this.showSources();
    },

    hideSourceModel: function (sourceModel) {
      sourceModel.hide();
      this.showSources();
    },

    insertLines: function (sourceStr, atLine) {
      var doc = this.jsMirror.getDoc();
      var startLineCount = doc.lineCount() - 1;

      var pos = { // create a new object to avoid mutation of the original selection
        line: atLine || startLineCount,
        ch: -1 // set the character position to the end of the line
      };
      doc.replaceRange(sourceStr + '\n', pos); // adds a new line

      var endLineCount = doc.lineCount() - 1;
      var linesInserted = endLineCount - startLineCount;

      return {
        startLine: pos.line,
        endLine: pos.line + linesInserted
      };
    },

    deleteAllLines: function () {
      var doc = this.jsMirror.getDoc();
      var lastLine = doc.lineCount();
      this.deleteLines(0, lastLine);
    },

    deleteLines: function (startLine, endLine) {
      var doc = this.jsMirror.getDoc();

      var startPos = {
        line: startLine,
        ch: -1
      };
      var endPos = {
        line: endLine,
        ch: doc.getLine(endLine - 1).length - 1
      };

      doc.replaceRange("", startPos, endPos);
    },

    scrollToSourceModel: function (sourceModel) {
      var position = sourceModel.getMirrorPos();
      var margin = $(window).height() / 2;
      this.jsMirror.scrollIntoView({line: position.line, ch: 0}, margin);
      this.jsMirror.setCursor({line: position.line});
    },

    scrollTop: function () {
      window.setTimeout(_.bind(function () {
        this.jsMirror.scrollTo({line: 0, ch: 0});
        this.jsMirror.setCursor({line: 0})
      }, this), 1);
    }
  });
});