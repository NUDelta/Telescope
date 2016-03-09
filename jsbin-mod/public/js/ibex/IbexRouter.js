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

      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();

      var updateMirrors = _.bind(function () {
        this.codeMirrorJSView.showSources();
        this.codeMirrorHTMLView.render();
      }, this);
      this.jsBinSocketRouter.onSocketData("fondueDTO:arrInvocations", function (obj) {
        this.activeNodeCollection.merge(obj.invocations);

        if (!this.pauseUIUpdates) {
          updateMirrors();
        }
      }, this);
      this.jsBinSocketRouter.onSocketData("fondueDTO:css", function (obj) {
        this.codeMirrorCSSView.setCode(obj.css);
      }, this);
      this.jsBinSocketRouter.onSocketData("fondueDTO:html", function (obj) {
        this.codeMirrorHTMLView.setCode(obj.html);
      }, this);
      this.jsBinSocketRouter.onSocketData("fondueDTO:scripts", function (obj) {
        this.sourceCollection.add(obj.scripts);
        this.codeMirrorJSView.showSources();
        this.activeCodePanelView.render();
      }, this);
      this.activeCodePanelView.on("activeCodePanel:pause", function (isPaused) {
        this.pauseUIUpdates = isPaused;
      }, this);
      this.activeCodePanelView.on("activeCodePanel:reset", function () {
        //todo emit to pane that we need a reset
        this.activeNodeCollection.empty();
        updateMirrors();
      }, this)
    },

    nav: function (panelType, codeMirrorInstance) {
      this[panelType](codeMirrorInstance);
    },

    javascript: function (codeMirrorInstance) {
      this.codeMirrors.js = codeMirrorInstance;
      this.codeMirrorJSView.showSources();
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