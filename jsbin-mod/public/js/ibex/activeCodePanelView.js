def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "text!templates/SourceListPanel.html"
], function ($, Backbone, _, Handlebars, panelTemplate) {
  return Backbone.View.extend({
    panelHeight: 90,

    template: Handlebars.compile(panelTemplate),

    el: "#control",

    events: {
      "click #fondue-toggle-inactive": "toggleInactiveClicked",
      "click .fondue-file-link": "scrollFileClicked",
      "click .fondue-toggle-file": "toggleFileClicked"
    },

    initialize: function (sourceCollection, codeMirrorJSView) {
      this.sourceCollection = sourceCollection;
      this.codeMirrorJSView = codeMirrorJSView;
    },

    render: function () {
      //Append our code panel and set it to $el
      if (this.$(".fondue-panel").length < 1) {
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
      }
    },

    scrollFileClicked: function (e) {
      var sourceCID = $(e.currentTarget).attr("data");
      var foundModel = this.sourceCollection.getByCid(sourceCID);

      if(foundModel){
        this.codeMirrorJSView.scrollToSourceModel(foundModel);
      }
    },

    toggleFileClicked: function (e) {
      var $toggle = $(e.currentTarget);
      var sourceCID = $toggle.attr("data");
      var foundModel = this.sourceCollection.getByCid(sourceCID);

      if(!foundModel){
        return;
      }

      if ($toggle.is(':checked')) {
        this.codeMirrorJSView.hideSourceModel(foundModel);
      } else {
        this.codeMirrorJSView.showSourceModel(foundModel);
      }
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