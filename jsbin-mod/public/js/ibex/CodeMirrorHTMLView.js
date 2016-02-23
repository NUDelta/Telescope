def([
  "jquery",
  "backbone",
  "underscore",
], function ($, Backbone, _) {
  return Backbone.View.extend({
    htmlMirror: null,
    htmlSource: "",

    initialize: function (codeMirrors, htmlSource) {
      this.codeMirrors = codeMirrors;
      this.htmlSource = htmlSource;
    },

    render: function () {
      this.htmlMirror = this.codeMirrors.html;
      this.htmlMirror.setCode(this.htmlSource);
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