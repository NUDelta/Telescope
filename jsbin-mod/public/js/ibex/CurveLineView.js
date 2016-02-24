def([
  "jquery",
  "backbone",
  "underscore",
  "raphael"
], function ($, Backbone, _, Raphael) {
  return Backbone.View.extend({
    events: {},

    initialize: function (fromPos, toPos) {
      this.fromPos = fromPos;
      this.toPos = toPos;
    },

    undraw: function(){
      if(!this.r){
        return;
      }
      $(this.r.canvas).remove();
      this.r = null;
    },

    draw: function () {
      var colors = [
        "hsb(0, .75, .75)",  //red
        "hsb(.8, .75, .75)", //purple
        "hsb(.3, .75, .75)", // green
        "hsb(.6, .75, .75)", // blue
        "hsb(.1, .75, .75)" // orange
      ];

      var leftAbsolutePosition, topAbsolutePosition;

      var x, y,zx,zy;
      if (this.fromPos.top >= this.toPos.top) {
        leftAbsolutePosition = this.fromPos.right - 15;
        topAbsolutePosition = this.toPos.bottom;
        x = 0;
        y = this.fromPos.top - topAbsolutePosition;
        zx = this.toPos.left - leftAbsolutePosition;
        zy = 0;
      } else {
        leftAbsolutePosition = this.fromPos.right - 15;
        topAbsolutePosition = this.fromPos.bottom;
        x = 0;
        y = 0;
        zx = this.toPos.left - leftAbsolutePosition;
        zy = this.toPos.top - topAbsolutePosition;
      }

      var ax = x + (zx - x) * (2 / 5);
      var ay = y;
      var bx = x + (zx - x) * (3 / 5);
      var by = zy;

      var color = colors[_.random(0, 4)];

      var $div = $("div");

      var r = Raphael($div, 1, 1);
      this.r = r;
      var discattr = {};

      $(r.canvas).attr("style", "overflow: visible; position: absolute; z-index: 3;" +
        "left: " + leftAbsolutePosition + "px;" +
        "top: " + topAbsolutePosition + "px;"
      );
      function curve() {
        var path = [["M", x, y], ["C", ax, ay, bx, by, zx, zy]];

        var curve = r.path(path).attr({
          stroke: color || Raphael.getColor(),
          "stroke-width": 1,
          "stroke-linecap": "round"
        });

        var controls = r.set(
          //r.circle(x, y, 5).attr(discattr),
          //r.circle(zx, zy, 5).attr(discattr)
        );
      }

      function move(dx, dy) {
        this.update(dx - (this.dx || 0), dy - (this.dy || 0));
        this.dx = dx;
        this.dy = dy;
      }

      function up() {
        this.dx = this.dy = 0;
      }

      curve();
    }
  });
});