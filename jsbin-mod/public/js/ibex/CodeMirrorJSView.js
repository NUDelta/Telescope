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
    nodeIdGutterPill: {},

    initialize: function (codeMirrors, sourceCollection, activeNodeCollection) {
      this.codeMirrors = codeMirrors;
      this.sourceCollection = sourceCollection;
      this.activeNodeCollection = activeNodeCollection;
      this.activeNodeCollection.markDomManipulatingNodes();
    },

    showSources: function () {
      this.jsMirror = this.codeMirrors.js;
      this.jsMirror.setOption("lineNumbers", true);

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
        this.addGutterPills(sourceModel);

        if (this.activeCodeOnly) {
          this.deleteInactiveLines(sourceModel);
        }
      }, this);

      this.scrollTop();
    },

    addGutterPills: function (sourceModel) {
      var activeNodeModels = this.activeNodeCollection.where({type: "function", path: sourceModel.get("path")});
      _(activeNodeModels).each(function (activeNodeModel) {
        var activeNode = activeNodeModel.toJSON();

        //subtract one, because the mirror start line === node.startLine
        var startLine = sourceModel.getMirrorPos().startLine + activeNode.startLine - 1;
        var pill = new GutterPillView(this.jsMirror, startLine, activeNode, this.sourceCollection);
        pill.setCount(activeNode.hits);
        pill.on("pill:expand", function (gutterPillView) {
          this.htmlJSLinksView.drawLineFromJSToHTML(gutterPillView);
        }, this);
        pill.on("pill:collapse", function (gutterPillView) {
          this.htmlJSLinksView.removeJSToHTMLLine(gutterPillView);
        }, this);
        this.nodeIdGutterPill[activeNodeModel.get("id")] = pill;
      }, this);
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
        line: endLine + 1,
        ch: -1
      };

      doc.replaceRange("", startPos, endPos);
    },

    deleteInactiveLines: function (sourceModel) {
      var pos = sourceModel.getMirrorPos();
      var activeLines = sourceModel.getActiveLines();
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
      var margin = $(window).height() / 2;
      this.jsMirror.scrollIntoView({line: position.line, ch: 0}, margin);
      this.jsMirror.setCursor({line: position.line});
    },

    scrollTop: function () {
      window.setTimeout(_.bind(function () {
        this.jsMirror.scrollTo({line: 0, ch: 0});
        this.jsMirror.setCursor({line: 0});
      }, this), 1);
    }
  });
})
;