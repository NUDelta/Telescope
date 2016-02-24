def([
  "jquery",
  "backbone",
  "underscore",
], function ($, Backbone, _) {
  return Backbone.View.extend({
    htmlMirror: null,
    htmlSource: "",
    markers: [],

    initialize: function (codeMirrors, htmlSource) {
      this.codeMirrors = codeMirrors;
      this.htmlSource = htmlSource;
      this.drawRelatedHTML = _.bind(this.drawRelatedHTML, this);
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
    },

    drawRelatedHTML: function (activeNode) {
      if (!activeNode.domQueries || activeNode.domQueries.length < 1) {
        return [];
      }

      var arrPos = [];

      //translate query into jquery search
      _(activeNode.domQueries).each(function (domQuery) {
        var domQueryKey = domQuery.domQueryKey;
        var queryString = domQuery.queryString;

        var queryFn = this.getjQueryFn(domQueryKey);

        for (var i = 0; i < this.htmlMirror.lineCount(); i++) {
          var codeLine = this.htmlMirror.getLine(i);

          try {
            if (queryFn(queryString, codeLine)) {
              var marker = this.highlightLines(i, codeLine.length);
              if (activeNode.markers) {
                activeNode.markers.push(marker);
              } else {
                activeNode.markers = [marker];
              }

              var pos = $($(".CodeMirror-code")[0]).find("div:nth-child(" + i + ")")[0].getBoundingClientRect();
              arrPos.push(pos);
            }
          } catch (ig) {
          }
        }

      }, this);

      return arrPos;
    },

    undrawRelatedHTML: function (activeNode) {
       _(activeNode.markers || []).each(function (marker) {
        marker.clear();
      });
    },

    highlightLines: function (lineNumber, length) {
      var marker = this.htmlMirror.markText(
        {
          line: lineNumber,
          ch: 0
        },
        {
          line: lineNumber,
          ch: length - 1
        },
        {
          css: "background-color:#fffcbd"
        }
      );

      return marker;
    },

    getjQueryFn: function (expression) {
      switch (expression) {
        case "getElementsByTagName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "getElementsByTagNameNS":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "getElementsByClassName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("." + val).length;
          };
          break;
        case "getElementsByName":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("[name='" + val + "']").length;
          };
          break;
        case "getElementById":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find("#" + val).length;
          };
          break;
        case "querySelector":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        case "querySelectorAll":
          return function (val, line) {
            var $html = $("<html></html>");
            $html.append(line);
            return !!$html.find(val).length;
          };
          break;
        default:
          return function () {
          }
      }
    }

  });
});