def([
  "jquery",
  "backbone",
  "underscore",
  "./GutterPillView",
  "./CurveLineView",
  "../routers/JSBinSocketRouter"
], function ($, Backbone, _, GutterPillView, CurveLineView, JSBinSocketRouter) {
  return Backbone.View.extend({
    htmlLineGutterPill: {},

    jsNodeIdGutterPill: {},

    initialize: function (codeMirrorJSView, codeMirrorHTMLView, activeNodeCollection, sourceCollection, jsBinRouter) {
      this.codeMirrorJSView = codeMirrorJSView;
      this.codeMirrorHTMLView = codeMirrorHTMLView;
      this.sourceCollection = sourceCollection;

      this.drawLineFromJSToHTML = _.bind(this.drawLineFromJSToHTML, this);
      this.drawLineFromHTMLToJS = _.bind(this.drawLineFromHTMLToJS, this);
      this.destroyPillLines = _.bind(this.destroyPillLines, this);
      this.pillCollapseFn = _.bind(this.pillCollapseFn, this);
      this.pillExpandFn = _.bind(this.pillExpandFn, this);

      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();
      this.jsBinRouter = jsBinRouter;
      this.activeNodeCollection = activeNodeCollection;
    },

    collapseAll: function () {
      var htmlGutterViews = _(this.htmlLineGutterPill).values();
      var jsGutterViews = _(this.jsNodeIdGutterPill).values();
      _(htmlGutterViews.concat(jsGutterViews)).each(function (gutterPillView) {
        this.pillCollapseFn(gutterPillView);
      }, this);

      this.codeMirrorHTMLView.removeAllHighlights();
      this.codeMirrorHTMLView.hideMask();
    },

    addHTMLGutterPills: function () {
      this.activeNodeCollection.eachDomQuery(function (domFnName, queryString, activeNodes) {
        this.codeMirrorHTMLView.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          var pill = new GutterPillView(this.codeMirrorHTMLView.htmlMirror, lineNumber, null, this.sourceCollection, activeNodes, this.jsBinRouter);
          this.htmlLineGutterPill[lineNumber] = pill;

          pill.addRelatedDomQueries([{
            domFnName: domFnName,
            queryString: queryString,
            html: codeLine
          }]);

          pill.setCount(pill.getRelatedDomQueries().length);
          pill.setExpandFn(this.pillExpandFn);
          pill.setCollapseFn(this.pillCollapseFn);
        }, this);
      }, this);
    },

    addJSGutterPills: function (sourceModel, domModifiersOnly) {
      var activeNodeModels = this.activeNodeCollection.getActiveNodes(sourceModel.get("path"), domModifiersOnly);
      _(activeNodeModels).each(function (activeNodeModel) {
        //subtract one, because the mirror start line === node.startLine
        var startLine = sourceModel.getMirrorPos().startLine + activeNodeModel.get("startLine") - 1;

        var pill;
        if (this.jsNodeIdGutterPill[activeNodeModel.get("id")]) {
          pill = this.jsNodeIdGutterPill[activeNodeModel.get("id")];
        } else {
          pill = new GutterPillView(this.codeMirrorJSView.jsMirror, startLine, activeNodeModel, this.sourceCollection, null, this.jsBinRouter);
          this.jsNodeIdGutterPill[activeNodeModel.get("id")] = pill;
        }

        pill.setCount(activeNodeModel.getHits());
        pill.setExpandFn(this.pillExpandFn);
        pill.setCollapseFn(this.pillCollapseFn);
      }, this);
    },

    pillExpandFn: function (gutterPillView) {
      this.jsBinRouter.pauseUIUpdates();
      if (gutterPillView.expanded) {
        return;
      }

      this.collapseAll();

      if (gutterPillView.htmlRelatedNodeModels) {
        this.drawLineFromHTMLToJS(gutterPillView);
      } else {
        this.drawLineFromJSToHTML(gutterPillView);
      }
      this.jsBinSocketRouter.emit("jsbin:html", {
        selected: true,
        relatedDomQueries: gutterPillView.getRelatedDomQueries()
      });

      gutterPillView.expanded = true;
    },

    pillCollapseFn: function (gutterPillView) {
      if (!gutterPillView.expanded) {
        return;
      }

      gutterPillView.$el.removeClass("selected");
      if (gutterPillView.nonDom) {
        gutterPillView.expanded = false;
        this.codeMirrorHTMLView.$missingEl.hide();
        this.codeMirrorHTMLView.$missingElMask.hide();
      } else {
        this.destroyPillLines(gutterPillView);

        this.jsBinSocketRouter.emit("jsbin:html", {
          selected: false,
          relatedDomQueries: gutterPillView.getRelatedDomQueries()
        });
      }

      gutterPillView.expanded = false;

      this.codeMirrorHTMLView.removeAllHighlights();
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

      var firstScrollLine = null;
      _(domQueries).each(function (domQueryObj) {
        var domFnName = domQueryObj.domFnName;
        var queryString = domQueryObj.queryString;

        this.codeMirrorHTMLView.whereLines(domFnName, queryString, function (codeLine, lineNumber) {
          this.codeMirrorHTMLView.highlightLine(lineNumber, codeLine.length);

          rdqArr.push({
            domFnName: domFnName,
            queryString: queryString,
            html: codeLine
          });
          arrLineNumbers.push(lineNumber);

          if (firstScrollLine === null || lineNumber < firstScrollLine) {
            firstScrollLine = lineNumber;
          }
        }, this);
      }, this);

      this.codeMirrorHTMLView.scrollToLine(firstScrollLine);

      var arrLines = [];

      if (!arrLineNumbers.length) {
        //JS node queried the dom for something that wasn't there
        this.codeMirrorHTMLView.showMissingElMessage(domQueries, gutterPillView);
        return;
      }

      _(arrLineNumbers).each(function (lineNumber) {
        var lineView = new CurveLineView({
          fromHTMLLine: lineNumber,
          fromEl: null,
          toEl: pillEl,
          toJSLine: gutterPillView.line,
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

    drawLineFromHTMLToJS: function (gutterPillView) {
      if (!gutterPillView.htmlRelatedNodeModels) {
        return;
      }

      var lineNumber = gutterPillView.line;
      var codeLine = this.codeMirrorHTMLView.htmlMirror.getLine(lineNumber);
      this.codeMirrorHTMLView.highlightLine(lineNumber, codeLine.length);

      var arrJSPillEl = [];
      var arrJSPillLine = [];
      var arrJsPill = [];
      var arrRelatedDQ = gutterPillView.getRelatedDomQueries();

      _(arrRelatedDQ).each(function (dq) {
        var nodeModels = this.activeNodeCollection.getModelsByDomQuery(dq.domFnName, dq.queryString);
        _(nodeModels).each(function (nodeModel) {
          var jsPill = this.jsNodeIdGutterPill[nodeModel.get("id")];
          if (jsPill) {
            arrJsPill.push(jsPill);
          }
        }, this);
      }, this);

      var firstScrollLine = null;
      _(arrJsPill).chain().uniq(function (jsPill) {
        return jsPill.cid;
      }).each(function (jsPill) {
        arrJSPillEl.push(jsPill.$el[0]);
        arrJSPillLine.push(jsPill.line);

        if (firstScrollLine === null || jsPill.line < firstScrollLine) {
          firstScrollLine = jsPill.line;
        }
      });

      this.codeMirrorJSView.scrollToLine(firstScrollLine);

      var arrLines = [];
      _(arrJSPillEl).each(function (el, i) {
        var lineView = new CurveLineView({
          fromHTMLLine: lineNumber,
          fromEl: null,
          toEl: el,
          toJSLine: arrJSPillLine[i],
          jsMirror: this.codeMirrorHTMLView.htmlMirror,
          htmlMirror: this.codeMirrorJSView.jsMirror
        });
        lineView.draw();
        arrLines.push(lineView);
      }, this);

      gutterPillView.arrLines = arrLines;
    },

    destroyPillLines: function (gutterPillView) {
      _(gutterPillView.arrLines || []).each(function (lineView) {
        lineView.destroy();
      });

      gutterPillView.arrLines = [];
    },

    emitHTMLSelect: function (selected, relatedDomQueries) {
      this.jsBinSocketRouter.emit("jsbin:html", {
        selected: selected,
        relatedDomQueries: relatedDomQueries
      });
    },

    removeAllHTMLGutterPills: function () {
      this.destroyPillInMap("htmlLineGutterPill");
    },

    removeAllJSGutterPills: function () {
      this.destroyPillInMap("jsNodeIdGutterPill");
    },

    destroyPillInMap: function (mapKey) {
      var gutterViews = _(this[mapKey]).values();

      _(gutterViews).each(function (gutterPillView) {
        if (gutterPillView.expanded) {
          this.jsBinSocketRouter.emit("jsbin:html", {
            selected: false,
            relatedDomQueries: gutterPillView.getRelatedDomQueries()
          });
          gutterPillView.expanded = false;
        }

        gutterPillView.destroy();
      }, this);

      this[mapKey] = {};
    }
  })
});