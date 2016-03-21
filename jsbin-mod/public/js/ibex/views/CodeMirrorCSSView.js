def([
  "jquery",
  "backbone",
  "underscore",
], function ($, Backbone, _) {
  return Backbone.View.extend({
    cssMirror: null,
    cssSource: "",

    initialize: function (codeMirrors) {
      this.codeMirrors = codeMirrors;
    },

    render: function () {
      this.cssMirror = this.codeMirrors.css;
      this.cssMirror.setOption('lineNumbers', true);
    },

    setCode: function (strCode) {
      this.cssMirror.setCode(strCode);
      this.cssSource = strCode;
    },

    scrollTop: function () {
      window.setTimeout(_.bind(function () {
        this.jsMirror.scrollTo({line: 0, ch: 0});
        this.jsMirror.setCursor({line: 0});
      }, this), 1);
    }

  });
})
;