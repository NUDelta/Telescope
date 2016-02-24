def([
  "jquery",
  "backbone",
  "underscore",
  "GutterPillView",
  "ActiveCodePanelView",
  "CodeMirrorJSView",
  "CodeMirrorHTMLView",
  "CodeMirrorCSSView",
  "SourceCollection",
  "ActiveNodeCollection"
], function ($, Backbone, _,
             GutterPillView,
             ActiveCodePanelView,
             CodeMirrorJSView,
             CodeMirrorHTMLView,
             CodeMirrorCSSView,
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

      this.codeMirrorJSView.on("jsView:linkHTML", this.codeMirrorHTMLView.drawRelatedHTML);
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