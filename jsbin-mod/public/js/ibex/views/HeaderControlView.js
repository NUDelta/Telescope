def([
  "jquery",
  "backbone",
  "underscore",
  "handlebars",
  "moment",
  "text!../templates/UIControls.html"
], function ($, Backbone, _, Handlebars, moment, UIControlsTemplate) {
  return Backbone.View.extend({
    template: Handlebars.compile(UIControlsTemplate),

    el: ".control",

    jsOrderReversed: true,

    slideValLower: 0,

    slideValUpper: 0,

    events: {
      "click #pauseUpdates": "togglePauseClicked",
      "click #resetTraces": "resetClicked",
      "click #jsScriptOrder": "toggleJSOrder",
      "input #detailSlider": "jsDetailChange"
    },

    initialize: function (activeNodeCollection) {
      this.activeNodeCollection = activeNodeCollection;

      this.timeSlideChange = _.bind(this.timeSlideChange, this);
      this.pause = _.bind(this.pause, this);
      this.resume = _.bind(this.resume, this);

      this.triggerSlideChange = _.throttle(_.bind(function () {
        this.trigger("timeSlideChange");
      }, this), 500);
    },

    render: function () {
      this.$("#fondue-ui-controls").remove();

      this.$el.append(this.template());
      this.$detailSlider = this.$("#detailSlider");

      this.renderSlider();
    },

    renderSlider: function () {
      this.$(".timeline-slider-wrap #timeLineSlider").remove();
      this.$(".timeline-slider-wrap").append("<div id='timeLineSlider'></div>");
      this.$timeLineSlider = this.$("#timeLineSlider");

      var earliestTS = this.activeNodeCollection.getEarliestTimeStamp();
      var latestTS = this.activeNodeCollection.getLatestTimeStamp();

      this.$timeLineSlider.slider({
        range: true,
        min: earliestTS,
        max: latestTS,
        values: [this.slideValLower || earliestTS, this.slideValUpper || latestTS],
        slide: this.timeSlideChange
      });
    },

    timeSlideChange: function (event, ui) {
      this.slideValLower = ui.values[0];
      this.slideValUpper = ui.values[1];

      this.activeNodeCollection.setTimeStampBounds(this.slideValLower, this.slideValUpper);
      this.triggerSlideChange();
    },

    triggerSlideChange: function () {
      this.trigger("timeSlideChange");
    },

    setTimeSlideVal: function (lowerVal, upperVal) {
      this.$timeLineSlider.slider("values", lowerVal);
      this.$timeLineSlider.slider("values", upperVal);
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