def([
  "jquery",
  "backbone",
  "underscore",
  "../util/util"
], function ($, Backbone, _, util) {
  return Backbone.View.extend({
    el: "<span class='theseus-call-count none'><span class='counts'></span></span>",

    events: {
      "click": "toggleTrace"
    },

    initialize: function (codeMirror, line, activeNodeModel, sourceCollection, htmlRelatedNodeModels, jsBinRouter) {
      this.sourceCollection = sourceCollection;
      this.line = line;
      this.jsBinRouter = jsBinRouter;
      this.mirror = codeMirror;
      this.marker = codeMirror.setGutterMarker(line, "pill-gutter", this.$el[0]);

      this.activeNodeModel = activeNodeModel;
      this.htmlRelatedNodeModels = htmlRelatedNodeModels;

      this.setDomModifier();
    },

    addRelatedDomQueries: function (relatedDomQueries) {
      this.relatedDomQueries = this.relatedDomQueries || [];
      this.relatedDomQueries = this.relatedDomQueries.concat(relatedDomQueries);
      this.relatedDomQueries = _(this.relatedDomQueries).uniq(function (domQueryObj) {
        return domQueryObj.domFnName + domQueryObj.queryString;
      });
    },

    getRelatedDomQueries: function () {
      return this.relatedDomQueries || [];
    },

    destroy: function () {
      this.mirror.setGutterMarker(this.marker, "pill-gutter", null);
      this.remove();
    },

    setCount: function (count) {
      var txt = " call" + (count === 1 ? "" : "s");
      if (this.htmlRelatedNodeModels) {
        txt = count === 1 ? " query" : " queries";
      }

      var html = count + txt;
      this.$el.find(".counts").html(html);
      this.$el.toggleClass("none", count === 0);
      this.count = count;
    },

    getCount: function () {
      return this.count || 0;
    },

    setDomModifier: function () {
      if (this.activeNodeModel && this.activeNodeModel.get("domModifier")) {
        this.$el.attr("style", "background-color: yellow !important;");
      }
    },

    setActive: function (isActive) {
      this._active = isActive;
      this.$el.toggleClass("active", isActive);
    },

    toggle: function () {
      this.setActive(!this._active);
    },

    setCollapseFn: function (fn) {
      this.collapseFn = fn;
    },

    setExpandFn: function (fn) {
      this.expandFn = fn;
    },

    toggleTrace: function (e) {
      if (this.expanded) {
        this.collapseFn(this);
        this.expanded = false;
      } else {
        this.jsBinRouter.pauseUIUpdates();
        this.expandFn(this);
        this.expanded = true;
      }
    },

    collapseQuiet: function () {
      this.expanded = false;
    }
  });
});