def([
  "jquery",
  "backbone",
  "underscore",
  "GutterPillView",
  "ActiveCodePanelView",
  "CodeMirrorJSView",
  "CodeMirrorHTMLView",
  "CodeMirrorCSSView",
  "HTMLJSLinksView",
  "SourceCollection",
  "ActiveNodeCollection",
  "JSBinSocketRouter"
], function ($, Backbone, _,
             GutterPillView,
             ActiveCodePanelView,
             CodeMirrorJSView,
             CodeMirrorHTMLView,
             CodeMirrorCSSView,
             HTMLJSLinksView,
             SourceCollection,
             ActiveNodeCollection,
             JSBinSocketRouter) {
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

      this.jSBinSocketRouter = JSBinSocketRouter.getInstance();
      this.jSBinSocketRouter.onSocketData("fondueDTO:arrInvocations", function (obj) {
        console.log("fondueDTO:arrInvocations", obj);
      }, this);
      this.jSBinSocketRouter.onSocketData("fondueDTO:css", function (obj) {
        this.codeMirrorCSSView.setCode(obj.css);
      }, this);
      this.jSBinSocketRouter.onSocketData("fondueDTO:html", function (obj) {
        this.codeMirrorHTMLView.setCode(obj.html);
      }, this);
      this.jSBinSocketRouter.onSocketData("fondueDTO:scripts", function (obj) {
        console.log("fondueDTO:scripts", obj);
      }, this);

      this.activeNodeCollection = new ActiveNodeCollection();
      this.sourceCollection = new SourceCollection(null, {
        scripts: [],
        activeNodeCollection: this.activeNodeCollection
      });

      this.codeMirrorJSView = new CodeMirrorJSView(this.codeMirrors, this.sourceCollection, this.activeNodeCollection);
      this.codeMirrorHTMLView = new CodeMirrorHTMLView(this.codeMirrors, this.activeNodeCollection);
      this.activeCodePanelView = new ActiveCodePanelView(this.sourceCollection, this.codeMirrorJSView);
      this.codeMirrorCSSView = new CodeMirrorCSSView(this.codeMirrors);

      this.htmlJSLinksView = new HTMLJSLinksView(this.codeMirrorJSView, this.codeMirrorHTMLView);
      this.codeMirrorJSView.htmlJSLinksView = this.htmlJSLinksView;
      this.codeMirrorHTMLView.htmlJSLinksView = this.htmlJSLinksView;

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