def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "text!../templates/SourceListPanel.html"
], function ($, Backbone, _, Handlebars, panelTemplate) {
  return Backbone.View.extend({
    template: Handlebars.compile(panelTemplate),

    el: ".dropdownmenu[data-type='javascript']",

    events: {
      "click #fondue-toggle-inactive": "toggleInactiveClicked",
      "click .fondue-file-link": "scrollFileClicked",
      "click .fondue-toggle-file": "toggleFileClicked"
    },

    _blockLibs: _([
      "a3c5de",
      "jquery",
      "moderniz",
      "plugins",
      "moment",
      "underscore",
      "backbone",
      "require",
      "angular",
      "react",
      "handlebars",
      "html5shiv",
      "underscore"
    ]),

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
    },

    detailChange: function (headerControlVal) {
      this.sourceCollection.each(function (sourceModel) {
        sourceModel.show();
      });

      switch (headerControlVal) {
        case 1:  //active js dom modifiers only, no libraries
          this.markBlockedSourceModels();
          this.codeMirrorJSView.showOptional({
            domModifiersOnly: true,
            activeCodeOnly: true
          });
          break;
        case 2:  //active js dom modifiers only with libraries
          this.codeMirrorJSView.showOptional({
            domModifiersOnly: true,
            activeCodeOnly: true
          });
          break;
        case 3:  //active js only
          this.markBlockedSourceModels();
          this.codeMirrorJSView.showOptional({
            domModifiersOnly: false,
            activeCodeOnly: true
          });
          break;
        case 4:  // active js with known libs
          this.codeMirrorJSView.showOptional({
            domModifiersOnly: false,
            activeCodeOnly: true
          });
          break;
        case 5:  // all js
          this.codeMirrorJSView.showOptional({
            domModifiersOnly: false,
            activeCodeOnly: false
          });
          break;
      }
    },

    getBlockedSourceModels: function () {
      var blockedSourceModels = [];

      _($(".fondue-file-link")).each(function (el) {
        var $el = this.$el.find(el);
        var text = $el.text();

        var blockedLib = this._blockLibs.find(function (lib) {
          if (text.toLowerCase().indexOf(lib) > -1) {
            return true;
          }
        }, this);

        var sourceModel = this.getModelFromEl($el);
        if (blockedLib) {
          blockedSourceModels.push(sourceModel);
        }
      }, this);

      return blockedSourceModels;
    },

    markBlockedSourceModels: function () {
      _(this.getBlockedSourceModels()).each(function (sourceModel) {
        sourceModel.hide();
      });

      _($(".fondue-file-link")).each(function (el) {
        var $el = this.$el.find(el);
        var sourceModel = this.getModelFromEl($el);

        if (sourceModel.isVisible()) {
          $el.parent().find("input").prop("checked", false);
        } else {
          $el.parent().find("input").prop("checked", true);
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
      sourceModel.hide();
      this.codeMirrorJSView.showSources();
    },

    showSource: function (sourceModel) {
      sourceModel.show();
      this.codeMirrorJSView.showSources();
    }
  });
});