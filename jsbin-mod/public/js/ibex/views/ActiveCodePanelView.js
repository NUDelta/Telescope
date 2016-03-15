def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "text!../templates/SourceListPanel.html"
], function ($, Backbone, _, Handlebars, panelTemplate) {
  return Backbone.View.extend({
    panelHeight: 90,

    template: Handlebars.compile(panelTemplate),

    el: "#control",

    events: {
      "click #fondue-toggle-inactive": "toggleInactiveClicked",
      "click .fondue-file-link": "scrollFileClicked",
      "click .fondue-toggle-file": "toggleFileClicked",
      "click #pauseUpdates": "togglePauseClicked",
      "click #resetTraces": "resetClicked"
    },

    initialize: function (sourceCollection, codeMirrorJSView) {
      this.sourceCollection = sourceCollection;
      this.codeMirrorJSView = codeMirrorJSView;
    },

    render: function () {
      this.$("#fondue-panel-view").remove();
      var sourceModels = this.sourceCollection.getOrdered();
      var arr = _(sourceModels).map(function (model) {
        var json = model.toJSON();
        json.sourceCID = model.cid;
        return json;
      });
      var html = this.template({
        sources: arr
      });

      this.$el.append(html);
      this.$(".fondue-panel").css("height", this.panelHeight + "px");

      this.hideKnownLibs();
    },

    _blockLibs: _([
      "jquery",
      "moment",
      "underscore",
      "backbone",
      "require"
    ]),

    hideKnownLibs: function () {
      _($(".fondue-file-link")).each(function (el) {
        var $el = this.$(el);
        var text = $el.text();

        var blockedLib = this._blockLibs.find(function (lib) {
          if (text.toLowerCase().indexOf(lib) > -1) {
            return true;
          }
        }, this);

        if (blockedLib) {
          $el.parent().find("input").attr("checked", "checked");
          this.hideSource(this.getModelFromEl($el));
        }
      }, this);
    },

    scrollFileClicked: function (e) {
      var sourceCID = $(e.currentTarget).attr("data");
      var foundModel = this.sourceCollection.getByCid(sourceCID);

      if (foundModel) {
        this.codeMirrorJSView.scrollToSourceModel(foundModel);
      }
    },

    togglePauseClicked:function(e){
      if(this.paused){
        this.trigger("activeCodePanel:pause", false);
        this.paused = false;
        this.$(e.currentTarget).text("Pause Updates");
        this.$(e.currentTarget).css("background-color", "lightyellow");
      } else {
        this.trigger("activeCodePanel:pause", true);
        this.paused = true;
        this.$(e.currentTarget).text("Resume Updates");
        this.$(e.currentTarget).css("background-color", "lightsalmon");
      }
    },

    resetClicked:function(e){
      this.trigger("activeCodePanel:reset", false);
    },

    toggleFileClicked: function (e) {
      var foundModel = this.getModelFromEl(e.currentTarget);

      if (!foundModel) {
        return;
      }

      if (this.$(e.currentTarget).is(':checked')) {
        this.hideSource(foundModel);
      } else {
        this.showSource(foundModel);
      }
    },

    getModelFromEl: function (el) {
      var sourceCID = this.$(el).attr("data");
      var foundModel = this.sourceCollection.getByCid(sourceCID);

      return foundModel || null;
    },

    hideSource: function (sourceModel) {
      this.codeMirrorJSView.hideSourceModel(sourceModel);
    },

    showSource: function (sourceModel) {
      this.codeMirrorJSView.showSourceModel(sourceModel);
    },

    toggleInactiveClicked: function (e) {
      var $el = $(e.currentTarget);
      if ($el.is(':checked')) {
        this.codeMirrorJSView.hideInactive();
      } else {
        this.codeMirrorJSView.showInactive();
      }
    }


  });
});