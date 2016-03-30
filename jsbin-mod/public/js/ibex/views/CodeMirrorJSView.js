def([
  "jquery",
  "backbone",
  "underscore",
], function ($, Backbone, _) {
  return Backbone.View.extend({
    jsMirror: null,
    sources: null,
    mirrorLastLine: 0,
    activeCodeOnly: true,

    initialize: function (codeMirrors, sourceCollection, activeNodeCollection, jsBinRouter) {
      this.codeMirrors = codeMirrors;
      this.sourceCollection = sourceCollection;
      this.activeNodeCollection = activeNodeCollection;
      this.jsBinRouter = jsBinRouter;
    },

    showSources: function () {
      this.jsMirror = this.codeMirrors.js;
      this.jsMirror.setOption("lineNumbers", true);

      this.htmlJSLinksView.removeAllJSGutterPills();
      this.deleteAllLines();

      //Write the source and delete its lines in each iteration
      var sourceModels = this.sourceCollection.getOrdered();
      _(sourceModels).each(function (sourceModel) {
        if (!sourceModel.isVisible()) {
          return;
        }

        var sourceCode = sourceModel.getCode();
        var mirrorPosition = this.insertLines(sourceCode);
        //By iterating through, the mirror position will stay correct
        // as we append sources
        sourceModel.setMirrorPos(mirrorPosition);
        this.htmlJSLinksView.addJSGutterPills(sourceModel, this.domModifiersOnly);

        if (this.activeCodeOnly || this.domModifiersOnly) {
          this.deleteInactiveLines(sourceModel);
        }
      }, this);

      this.scrollTop();
    },

    showOptional: function (options) {
      this.activeCodeOnly = options.activeCodeOnly;
      this.domModifiersOnly = options.domModifiersOnly;
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
      this.jsMirror.setCode("");
    },

    deleteLines: function (startLine, endLine) {
      var doc = this.jsMirror.getDoc();

      var startPos = {
        line: startLine,
        ch: -1
      };
      var endPos = {
        line: endLine + 1,
        ch: -1
      };

      doc.replaceRange("", startPos, endPos);
    },

    deleteInactiveLines: function (sourceModel) {
      var pos = sourceModel.getMirrorPos();
      var activeLines = sourceModel.getActiveLines(this.domModifiersOnly);
      var allLines = _.range(pos.startLine, pos.endLine); //inclusive, exclusive
      var linesToDelete = _.difference(allLines, activeLines);
      _(linesToDelete).sortBy(function (num) {
        return num
      });

      var ranges = [];
      for (var i = 0; i < linesToDelete.length; i++) {
        var currentNum = linesToDelete[i];
        while (linesToDelete[i + 1] - linesToDelete[i] <= 1) {
          i++;
        }

        ranges.push({
          start: currentNum,
          end: linesToDelete[i]
        });
      }

      //as we delete lines, subtract the line numbers from future ranges
      var lastDiff = 0;
      _(ranges).each(function (range) {
        this.deleteLines(range.start - lastDiff, range.end - lastDiff);

        lastDiff += (range.end - range.start) + 1;
      }, this);
    },

    scrollToSourceModel: function (sourceModel) {
      var position = sourceModel.getMirrorPos();
      this.scrollToLine(position.line);
    },

    scrollTop: function () {
      window.setTimeout(_.bind(function () {
        this.scrollToLine(0);
      }, this), 1);
    },

    scrollToLine: function (line) {
      var t = this.jsMirror.charCoords({line: line || 0, ch: 0}, "local").top;
      var middleHeight = this.jsMirror.getScrollerElement().offsetHeight / 2;
      this.jsMirror.scrollTo(null, t - middleHeight - 5);
    }
  });
})
;