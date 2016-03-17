define([], function () {
    return function () {
      var IntroJsBridge = function () {
      };

      IntroJsBridge.styleElID = "unravel-introjs-style";
      IntroJsBridge.styleElTemplate = "<div id='" + IntroJsBridge.styleElID + "'>" +
        "<style>" +
        unravelAgent.introCss +
        "</style><style>" +
        unravelAgent.hljsCSS +
        "</style>" +
        "</div>";

      IntroJsBridge.prototype = {
        constructor: IntroJsBridge,

        testOn: function () {
          this.addHighlight([
            {
              domFnName: "getElementById",
              queryString: "effect1"
            },
            {
              domFnName: "getElementById",
              queryString: "effect2"
            }
          ]);
        },

        testOff: function () {
          this.removeHilight([
            {
              domFnName: "getElementById",
              queryString: "effect1"
            },
            {
              domFnName: "getElementById",
              queryString: "effect2"
            }
          ]);
        },

        addHighlight: function (relatedDomQueries) {
          this.insertCSS();

          var els = [];
          unravelAgent._(relatedDomQueries).each(function (q) {
            var el;
            try {
              var domFnName = q.domFnName;
              var queryString = q.queryString;
              el = document[domFnName](queryString);
            } catch (ig) {
            }

            var html = q.html;

            if (el) {
              els.push({
                el: el,
                html: html
              });
            }
          }, this);

          var stepArr = [];
          unravelAgent._(els).map(function (el) {
            stepArr.push({
              element: el.el,
              intro: unravelAgent.hljs.highlight("html", el.html).value
            });
          });

          if (!stepArr.length) {
            return;
          }

          this.intro = unravelAgent.introJs();
          this.intro.setOptions({
            steps: stepArr,
            showStepNumbers: false,
            showButtons: stepArr.length > 1,
            showBullets: false,
            showProgress: false,
            scrollToElement: true,
            disableInteraction: stepArr.length < 2
          });

          this.intro.start();
        },

        removeHilight: function (relatedDomQueries) {
          this.removeCSS();
          if (this.intro) {
            this.intro.exit();
          }
        },

        insertCSS: function () {
          if (!unravelAgent.$("#" + IntroJsBridge.styleElID).length) {
            unravelAgent.$("body").append(IntroJsBridge.styleElTemplate)
          }
        },

        removeCSS: function () {
          unravelAgent.$("#" + IntroJsBridge.styleElID).remove();
        }
      };

      window.unravelAgent.introJsBridge = new IntroJsBridge();
    }
  }
);