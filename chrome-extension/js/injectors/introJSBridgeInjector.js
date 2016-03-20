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

        addHighlight: function (relatedDomQueries) {
          this.removeHilight();
          this.insertCSS();
          var $previousIntroOverlay = unravelAgent.$("div.introjs-overlay");
          if ($previousIntroOverlay.length) {
            $previousIntroOverlay.remove();
          }

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
                html: html,
                visible: unravelAgent.$(el).is(":visible")
              });
            }
          }, this);

          var stepArr = [];
          unravelAgent._(els).map(function (el) {
            var invisibleNotice = "";
            if (!el.visible) {
              invisibleNotice = "<h6 style='font-weight:bold;'>(Element is Hidden)</h6>"
            }

            stepArr.push({
              element: el.visible ? el.el : undefined,
              intro: invisibleNotice + unravelAgent.hljs.highlight("html", el.html).value
            });
          });

          if (!stepArr.length) {
            return;
          }

          window.unravelAgent.stopObserving();
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
          this.intro.onexit(window.unravelAgent.startObserving);

          this.intro.start();
        },

        removeHilight: function () {
          this.removeCSS();
          if (this.intro) {
            this.intro.exit();
            this.intro = null;
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