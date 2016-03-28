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

    jsOrderReversed: true,

    events: {
      "click #pauseUpdates": "togglePauseClicked",
      "click #resetTraces": "resetClicked",
      "click #jsScriptOrder": "toggleJSOrder",
      "input #detailSlider": "jsDetailChange"
    },

    initialize: function () {
    },

    render: function () {
      this.$("#fondue-ui-controls").remove();

      this.$el.append(this.template());
      this.$detailSlider = this.$("#detailSlider");

      var $timeLineSlider = this.$("#timeLineSlider");
      $timeLineSlider.slider({
        range: true,
        values: [17, 67]
      });
    },

    jsDetailChange: function () {
      var newVal = Math.ceil(this.$detailSlider.val() / 25);

      if (this.lastDetailSlideVal) {
        if (newVal !== this.lastDetailSlideVal) {
          this.lastDetailSlideVal = newVal;
          this.trigger("jsDetailChange", newVal);
        }
      } else {
        this.lastDetailSlideVal = newVal
      }
    },

    togglePauseClicked: function () {
      if (this.paused) {
        this.trigger("activeCodePanel:pause", false);
        this.resume();
      } else {
        this.trigger("activeCodePanel:pause", true);
        this.pause();
      }
    },

    toggleJSOrder: function () {
      if (this.jsOrderReversed) {
        this.$(".orderUpDown.reverse").hide();
        this.$(".orderUpDown.normal").show();
        this.jsOrderReversed = false;
      } else {
        this.$(".orderUpDown.reverse").show();
        this.$(".orderUpDown.normal").hide();
        this.jsOrderReversed = true;
      }
      this.trigger("controlView:order", this.jsOrderReversed);
    },


    pause: function () {
      this.paused = true;
      var $pauseUpdates = this.$("#pauseUpdates");
      $pauseUpdates.text("Resume Updates");
      $pauseUpdates.css("background-color", "red");
      $pauseUpdates.css("color", "white");
    },

    resume: function () {
      this.paused = false;
      var $pauseUpdates = this.$("#pauseUpdates");
      $pauseUpdates.text("Pause Updates");
      $pauseUpdates.css("background-color", "lightyellow");
      $pauseUpdates.css("color", "black");
    },

    resetClicked: function (e) {
      this.trigger("activeCodePanel:reset", false);
    }
  });
});