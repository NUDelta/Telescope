def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "text!../templates/SourceListPanel.html",
  "text!../templates/UIControls.html"
], function ($, Backbone, _, Handlebars, panelTemplate, uiControlsTemplate) {
  return Backbone.View.extend({
    template: Handlebars.compile(panelTemplate),
    uiControlsTemplate: Handlebars.compile(uiControlsTemplate),

    el: ".dropdownmenu[data-type='javascript']",

    events: {
      "click #fondue-toggle-inactive": "toggleInactiveClicked",
      "click .fondue-file-link": "scrollFileClicked",
      "click .fondue-toggle-file": "toggleFileClicked",
    },

    initialize: function (sourceCollection, codeMirrorJSView) {
      this.sourceCollection = sourceCollection;
      this.codeMirrorJSView = codeMirrorJSView;
      this.$htmlDropDown = $(".dropdownmenu[data-type='html']");
      this.$htmlDropDown.empty();
      this.$cssDropDown = $(".dropdownmenu[data-type='css']");
      this.$cssDropDown.empty();
      this.$el = $(".dropdownmenu[data-type='javascript']");
      this.$el.empty();
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

      this.$el.html(html);
      this.hideKnownLibs();

      $(".control").append(this.uiControlsTemplate());
      $("#pauseUpdates").click(_.bind(this.togglePauseClicked, this));
      $("#resetTraces").click(_.bind(this.resetClicked, this));
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
        var $el = this.$el.find(el);
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

    togglePauseClicked: function (e) {
      if (this.paused) {
        this.trigger("activeCodePanel:pause", false);
        this.paused = false;
        var $pauseUpdates = $("#pauseUpdates");
        $pauseUpdates.text("Pause Updates");
        $pauseUpdates.css("background-color", "lightyellow");
        $pauseUpdates.css("color", "black");
      } else {
        this.trigger("activeCodePanel:pause", true);
        this.pause();
      }
    },

    pause: function () {
      this.paused = true;
      var $pauseUpdates = $("#pauseUpdates");
      $pauseUpdates.text("Resume Updates");
      $pauseUpdates.css("background-color", "red");
      $pauseUpdates.css("color", "white");
    },

    resetClicked: function (e) {
      this.trigger("activeCodePanel:reset", false);
    },

    toggleFileClicked: function (e) {
      var foundModel = this.getModelFromEl(e.currentTarget);

      if (!foundModel) {
        return;
      }

      if (this.$el.find(e.currentTarget).is(':checked')) {
        this.hideSource(foundModel);
      } else {
        this.showSource(foundModel);
      }
    },

    getModelFromEl: function (el) {
      var sourceCID = this.$el.find(el).attr("data");
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