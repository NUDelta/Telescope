define([], function () {
    return function () {
      var IntroJsBridge = function () {
      };

      IntroJsBridge.styleElID = "unravel-introjs-style";
      IntroJsBridge.styleElTemplate = "<div id='" + IntroJsBridge.styleElID + "'>" +
        "<style>" +
        unravelAgent.introCss +
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
          unravelAgent._(relatedDomQueries).each(function () {
            var el;
            try {
              var q = relatedDomQueries[0];
              var domFnName = q.domFnName;
              var queryString = q.queryString;
              el = document[domFnName](queryString);
            } catch (ig) {
            }

            if (el) {
              els.push(el);
            }
          }, this);
          els = unravelAgent._(els).flatten();

          if (!els.length) {
            return;
          }
          var firstEl = els.shift();

          this.intro = unravelAgent.introJs();
          this.intro.setOptions({
            steps: [
              {
                element: firstEl,
                elements: els,

              }
            ],
            showStepNumbers: false,
            showButtons: false,
            showBullets: false,
            showProgress: false,
            scrollToElement: true,
            disableInteraction: true
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