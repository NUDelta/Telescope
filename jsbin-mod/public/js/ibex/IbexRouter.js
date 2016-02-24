def([
  "jquery",
  "backbone",
  "underscore",
  "GutterPillView",
  "ActiveCodePanelView",
  "CodeMirrorJSView",
  "CodeMirrorHTMLView",
  "CodeMirrorCSSView",
  "CurveLineView",
  "SourceCollection",
  "ActiveNodeCollection"
], function ($, Backbone, _,
             GutterPillView,
             ActiveCodePanelView,
             CodeMirrorJSView,
             CodeMirrorHTMLView,
             CodeMirrorCSSView,
             CurveLineView,
             SourceCollection,
             ActiveNodeCollection) {
  var instance = null;

  var IbexRouter = Backbone.Router.extend({
    codeMirrors: {
      js: null,
      html: null,
      css: null
    },

    initialize: function () {
      if (instance !== null) {
        throw new Error("Cannot instantiate more than one Singleton, use MySingleton.getInstance()");
      }

      var fondue = JSON.parse(template.fondue);
      this.activeNodeCollection = new ActiveNodeCollection(fondue.traces);
      this.sourceCollection = new SourceCollection(null, {
        scripts: fondue.scripts,
        activeNodeCollection: this.activeNodeCollection
      });

      this.codeMirrorJSView = new CodeMirrorJSView(this.codeMirrors, this.sourceCollection, this.activeNodeCollection);
      this.activeCodePanelView = new ActiveCodePanelView(this.sourceCollection, this.codeMirrorJSView);
      this.codeMirrorHTMLView = new CodeMirrorHTMLView(this.codeMirrors, template.html);
      this.codeMirrorCSSView = new CodeMirrorCSSView(this.codeMirrors, template.css);

      this.codeMirrorJSView.on("jsView:linkHTML", function (gutterPillView) {
        var pillPos = gutterPillView.$el[0].getBoundingClientRect();
        var arrHTMLPos = this.codeMirrorHTMLView.drawRelatedHTML(gutterPillView.trace);
        var arrLines = [];

        _(arrHTMLPos).each(function (htmlPos) {
          var lineView = new CurveLineView(htmlPos, pillPos);
          lineView.draw();
          arrLines.push(lineView);
        });

        gutterPillView.arrLines = arrLines;
      }, this);

      this.codeMirrorJSView.on("jsView:unlinkHTML", function (gutterPillView) {
        this.codeMirrorHTMLView.undrawRelatedHTML(gutterPillView.trace);

        _(gutterPillView.arrLines || []).each(function (lineView) {
          lineView.undraw();
        });
      }, this);
    },

    nav: function (panelType, codeMirrorInstance) {
      this[panelType](codeMirrorInstance);
    },

    javascript: function (codeMirrorInstance) {
      this.codeMirrors.js = codeMirrorInstance;
      this.codeMirrorJSView.showSources();
      this.activeCodePanelView.render();
    },

    html: function (codeMirrorInstance) {
      this.codeMirrors.html = codeMirrorInstance;
      this.codeMirrorHTMLView.render();
    },

    css: function (codeMirrorInstance) {
      this.codeMirrors.css = codeMirrorInstance;
      this.codeMirrorCSSView.render();
    }
  });

  IbexRouter.getInstance = function () {
    if (instance === null) {
      instance = new IbexRouter();
    }
    return instance;
  };

  return IbexRouter;
});