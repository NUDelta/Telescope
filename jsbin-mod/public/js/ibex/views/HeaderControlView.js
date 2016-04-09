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
      "click #jsScriptOrder": "toggleJSOrder"
    },

    initialize: function (activeNodeCollection) {
      this.activeNodeCollection = activeNodeCollection;

      this.timeSlideChange = _.bind(this.timeSlideChange, this);
      this.jsDetailChange = _.bind(this.jsDetailChange, this);
      this.pause = _.bind(this.pause, this);
      this.resume = _.bind(this.resume, this);

      this.triggerSlideChangeThrottled = _.throttle(_.bind(function () {
        this.triggerSlideChange();
      }, this), 1000);
    },

    render: function () {
      this.$("#fondue-ui-controls").remove();

      this.$el.append(this.template());

      this.renderDetailSlider();
      this.renderSlider();
    },

    renderDetailSlider: function () {
      this.$detailSlider = this.$("#detailSlider");
      this.$detailSlider.slider({
        range: "min",
        min: 1,
        max: 100,
        value: 1,
        orientation: "horizontal",
        animate: true,
        slide: this.jsDetailChange
      });
    },

    renderSlider: function () {
      this.$(".timeline-slider-wrap #timeLineSlider").remove();
      this.$(".timeline-slider-wrap").append("<div id='timeLineSlider'></div>");
      this.$timeLineSlider = this.$("#timeLineSlider");

      this.earliestTS = this.activeNodeCollection.getEarliestTimeStamp();
      this.latestTS = this.activeNodeCollection.getLatestTimeStamp();

      this.$timeLineSlider.slider({
        range: true,
        min: this.earliestTS,
        max: this.latestTS,
        values: [this.slideValLower || this.earliestTS, this.slideValUpper || this.latestTS],
        slide: this.timeSlideChange
      });
      this.updateCallTimeSliderLabel()
    },

    timeSlideChange: function (event, ui) {
      this.slideValLower = ui.values[0];
      this.slideValUpper = ui.values[1];

      this.updateCallTimeSliderLabel();

      this.activeNodeCollection.setTimeStampBounds(this.slideValLower, this.slideValUpper);
      this.triggerSlideChangeThrottled();
    },

    updateCallTimeSliderLabel: function () {
      var lowerDiff;
      if (this.slideValLower) {
        lowerDiff = this.getTimeDiff(this.earliestTS, this.slideValLower);
      } else {
        lowerDiff = "0s";
      }
      var higherDiff;
      if (this.slideValUpper) {
        higherDiff = this.getTimeDiff(this.earliestTS, this.slideValUpper);
      } else {
        higherDiff = this.getTimeDiff(this.earliestTS, this.latestTS);
      }

      this.$("#slideValLower").text(lowerDiff);
      this.$("#slideValUpper").text(higherDiff);
    },

    getTimeDiff: function (tsA, tsB) {
      var a = moment(tsA);
      var b = moment(tsB);
      var seconds = b.diff(a, 's');
      seconds = seconds ? seconds + "s" : "";

      if (!seconds) {
        seconds = "0s";
      }

      return seconds;
    },

    triggerSlideChange: function () {
      this.trigger("timeSlideChange");
    },

    setTimeSlideVal: function (lowerVal, upperVal) {
      this.$timeLineSlider.slider("values", lowerVal);
      this.$timeLineSlider.slider("values", upperVal);
    },

    jsDetailChange: function (event, ui) {
      var newVal = Math.ceil(ui.value / 20);

      if (this.lastDetailSlideVal) {
        if (newVal !== this.lastDetailSlideVal) {
          this.$('#detailLevel').text(newVal);
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
      $pauseUpdates.find("#pauseStatusOn").hide();
      $pauseUpdates.find("#pauseStatusOff").show();
      $pauseUpdates.parent().addClass("active");
      $pauseUpdates.parent().removeClass("inactive");
    },

    resume: function () {
      this.paused = false;
      var $pauseUpdates = this.$("#pauseUpdates");
      $pauseUpdates.find("#pauseStatusOn").show();
      $pauseUpdates.find("#pauseStatusOff").hide();
      $pauseUpdates.parent().removeClass("active");
      $pauseUpdates.parent().addClass("inactive");
    },

    resetClicked: function (e) {
      this.trigger("activeCodePanel:reset", false);
    }
  });
});