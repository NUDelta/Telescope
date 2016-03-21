def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "text!../templates/UIControls.html"
], function ($, Backbone, _, Handlebars, UIControlsTemplate) {
  return Backbone.View.extend({
    template: Handlebars.compile(UIControlsTemplate),

    el: ".control",

    events: {
      "click #pauseUpdates": "togglePauseClicked",
      "click #resetTraces": "resetClicked"
    },

    initialize: function () {
    },

    render: function () {
      this.$("#fondue-ui-controls").remove();

      this.$el.append(this.template());
    },

    togglePauseClicked: function (e) {
      if (this.paused) {
        this.trigger("activeCodePanel:pause", false);
        this.resume();
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

    resume: function () {
      this.paused = false;
      var $pauseUpdates = $("#pauseUpdates");
      $pauseUpdates.text("Pause Updates");
      $pauseUpdates.css("background-color", "lightyellow");
      $pauseUpdates.css("color", "black");
    },

    resetClicked: function (e) {
      this.trigger("activeCodePanel:reset", false);
    }
  });
});