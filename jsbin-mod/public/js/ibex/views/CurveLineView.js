def([
  "jquery",
  "backbone",
  "underscore",
  "raphael"
], function ($, Backbone, _, Raphael) {
  return Backbone.View.extend({
    events: {},

    colors: [
      "hsb(0, .75, .75)",  //red
      "hsb(.8, .75, .75)", //purple
      "hsb(.3, .75, .75)", // green
      "hsb(.6, .75, .75)", // blue
      "hsb(.1, .75, .75)" // orange
    ],

    initialize: function (o) {
      this.fromHTMLLine = o.fromHTMLLine;
      this.fromEl = o.fromEl;
      this.toEl = o.toEl;
      this.htmlMirror = o.htmlMirror;
      this.jsMirror = o.jsMirror;
      this.toJSLine = o.toJSLine;

      this.reDrawDebounce = _.debounce(_.bind(this.reDraw, this), 0);
      this.bindListeners("on");
    },

    reDraw: function () {
      this.undraw();
      this.draw();
    },

    undraw: function () {
      if (!this.r) {
        return;
      }
      $(this.r.canvas).remove();
      this.r = null;
    },

    bindListeners: function (onOff) {
      this.htmlMirror[onOff]("scroll", this.reDrawDebounce);
      this.jsMirror[onOff]("scroll", this.reDrawDebounce);
      this.htmlMirror[onOff]("viewportChange", this.reDrawDebounce);
      this.jsMirror[onOff]("viewportChange", this.reDrawDebounce);
      $(window)[onOff]("resize", this.reDrawDebounce);
    },

    destroy: function () {
      this.undraw();
      this.bindListeners("off");
      this.remove();
    },

    getHTMLMirror: function () {
      if (!this.$htmlMirror) {
        this.$htmlMirror = $($(".CodeMirror-code")[0]);
      }

      return this.$htmlMirror;
    },

    getJSMirror: function () {
      if (!this.$jsMirror) {
        this.$jsMirror = $($(".CodeMirror-code")[2]);
      }

      return this.$jsMirror;
    },

    draw: function () {
      var leftAbsolutePosition, topAbsolutePosition;

      var fromPos;
      if (!this.fromEl && this.fromHTMLLine !== undefined) {
        var $htmlMirror = this.getHTMLMirror();
        var htmlFirstLineVisible = parseInt($htmlMirror.find("div:first-child .CodeMirror-linenumber")[0].innerHTML);
        var htmlLastLineVisible = parseInt($htmlMirror.find("div:last-child .CodeMirror-linenumber")[0].innerHTML);

        var rect = $htmlMirror[0].getBoundingClientRect();
        if (this.fromHTMLLine >= htmlFirstLineVisible) {
          if (this.fromHTMLLine <= htmlLastLineVisible) {
            var el = $htmlMirror.find("div:nth-child(" + (this.fromHTMLLine - htmlFirstLineVisible) + ")")[0];
            var fromEl = $(el)[0];
            if (fromEl) {
              fromPos = fromEl.getBoundingClientRect();
            }
          } else {
            fromPos = { //down
              height: 12,
              top: rect.bottom,
              right: rect.right,
              bottom: rect.bottom
            };
          }
        } else {
          fromPos = { //up
            height: 12,
            top: rect.top,
            right: rect.right,
            bottom: rect.top
          };
        }
      } else {
        fromPos = $(this.fromEl)[0].getBoundingClientRect();
      }
      var toPos = $(this.toEl)[0].getBoundingClientRect();

      if (!toPos.height || !toPos.width) {
        var $jsMirror = this.getJSMirror();
        var jsFirstLineVisible = parseInt($jsMirror.find("div:first-child .CodeMirror-linenumber")[0].innerHTML);
        var jsLastLineVisible = parseInt($jsMirror.find("div:last-child .CodeMirror-linenumber")[0].innerHTML);
        var rectJS = $jsMirror[0].getBoundingClientRect();

        if (this.toJSLine >= jsFirstLineVisible) {
          if (this.toJSLine > jsLastLineVisible) {
            toPos = { //down
              height: 12,
              top: rectJS.bottom,
              left: rectJS.left - 40,
              bottom: rectJS.bottom
            };
          }
        } else {
          toPos = { //up
            height: 12,
            top: rectJS.top,
            left: rectJS.left - 40,
            bottom: rectJS.top
          };
        }
      }

      if (!fromPos || !toPos ||
        fromPos.height < 1 || fromPos.height < 1 ||
        toPos.height < 1 || toPos.width < 1) {
        return;
      }

      var x, y, zx, zy;
      if (fromPos.top >= toPos.top) {
        leftAbsolutePosition = fromPos.right - 15;
        topAbsolutePosition = toPos.bottom;
        x = 0;
        y = fromPos.top - topAbsolutePosition + fromPos.height + 7;
        zx = toPos.left - leftAbsolutePosition;
        zy = -toPos.height / 2;
      } else {
        leftAbsolutePosition = fromPos.right - 15;
        topAbsolutePosition = fromPos.bottom;
        x = 0;
        y = fromPos.height / 2;
        zx = toPos.left - leftAbsolutePosition;
        zy = toPos.top - topAbsolutePosition + toPos.height / 2;
      }

      var ax = x + (zx - x) * (2 / 5);
      var ay = y;
      var bx = x + (zx - x) * (3 / 5);
      var by = zy;

      this.color = this.color || this.colors[_.random(0, 4)];

      var $div = $("div");

      var r = Raphael($div, 1, 1);
      this.r = r;

      $(r.canvas).attr("style", "overflow: visible; position: absolute; z-index: 3;" +
        "left: " + leftAbsolutePosition + "px;" +
        "top: " + topAbsolutePosition + "px;"
      );
      var path = [["M", x, y], ["C", ax, ay, bx, by, zx, zy]];

      r.path(path).attr({
        stroke: this.color,
        "stroke-width": 1,
        "stroke-linecap": "round"
      });
    }
  });
});
