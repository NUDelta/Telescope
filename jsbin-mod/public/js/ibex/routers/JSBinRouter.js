def([
  "jquery",
  "backbone",
  "underscore",
  "../views/GutterPillView",
  "../views/ActiveCodePanelView",
  "../views/CodeMirrorJSView",
  "../views/CodeMirrorHTMLView",
  "../views/CodeMirrorCSSView",
  "../views/HTMLJSLinksView",
  "../collections/SourceCollection",
  "../collections/ActiveNodeCollection",
  "../routers/JSBinSocketRouter"
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

  var JSBinRouter = Backbone.Router.extend({
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
      this.htmlJSLinksView = new HTMLJSLinksView(this.codeMirrorJSView, this.codeMirrorHTMLView, this.activeNodeCollection);
      this.codeMirrorJSView.htmlJSLinksView = this.htmlJSLinksView;
      this.codeMirrorHTMLView.htmlJSLinksView = this.htmlJSLinksView;

      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();

      this.bindSocketHandlers();
      this.bindViewListeners();
    },

    bindSocketHandlers: function () {
      this.jsBinSocketRouter.onSocketData("fondueDTO:arrInvocations", function (obj) {
        this.activeNodeCollection.merge(obj.invocations);
        this.updateMirrors();

        if (!this.codeMirrorHTMLView.hasHTML()) {
          // this jsbin doesn't have all the setup code the browser sent
          // trigger a fetch to get everything we need
          console.log("Don't have html/css, requesting...");
          this.jsBinSocketRouter.emit("jsbin:resendAll", {});
        }
      }, this);

      this.jsBinSocketRouter.onSocketData("fondueDTO:css", function (obj) {
        console.log("Got CSS");
        this.codeMirrorCSSView.setCode(obj.css);
      }, this);

      this.jsBinSocketRouter.onSocketData("fondueDTO:html", function (obj) {
        console.log("Got HTML");
        this.codeMirrorHTMLView.render(obj.html);
      }, this);

      this.jsBinSocketRouter.onSocketData("fondueDTO:scripts", function (obj) {
        console.log("Got Scripts");

        this.sourceCollection.empty();
        this.sourceCollection.add(obj.scripts);
        this.activeCodePanelView.render();
        this.updateMirrors();
      }, this);

      this.jsBinSocketRouter.onSocketData("fondueDTO:newNodeList", function (obj) {
        console.log("Received", obj.nodes.length, "new nodes.");
        this.activeNodeCollection.merge(obj.nodes);
        this.resumeUIUpdates();
      }, this);
    },

    bindViewListeners: function () {
      this.activeCodePanelView.on("activeCodePanel:pause", function (pause) {
        if (pause) {
          this.puaseUIUpdates();
        } else {
          this.resumeUIUpdates();
        }
      }, this);

      this.activeCodePanelView.on("activeCodePanel:reset", function () {
        this.puaseUIUpdates();
        this.activeNodeCollection.empty();
        this.jsBinSocketRouter.emit("jsbin:reset", {});
      }, this);
    },

    puaseUIUpdates: function () {
      this.pauseUIUpdates = true;
    },

    resumeUIUpdates: function () {
      this.pauseUIUpdates = false;
      this.updateMirrors();
    },

    updateMirrors: function () {
      if (!this.pauseUIUpdates) {
        this.codeMirrorJSView.showSources();
        this.codeMirrorHTMLView.render();
      }
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

  JSBinRouter.getInstance = function () {
    if (instance === null) {
      instance = new JSBinRouter();
    }
    return instance;
  };

  return JSBinRouter;
});