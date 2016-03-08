define([],
  function () {
    return function () {
      window.unravelAgent.getLocation = function () {
        return {
          origin: window.location.origin,
          path: window.location.pathname,
          href: window.location.href
        };
      };

      window.unravelAgent.metaScripts = function () {
        var metaScripts = [];
        var scripts = unravelAgent.$("script");

        unravelAgent._(scripts).each(function (scriptEl, h) {
          var path = "";
          var url = "";

          var $scriptEl = unravelAgent.$(scriptEl);
          if (scriptEl.src) {
            $scriptEl.attr("src", scriptEl.src);
            url = scriptEl.src;
          } else {
            try {
              path = scriptEl.innerHTML.split("__tracer.add(\"")[1].split("\"")[0];
            } catch (err) {
              return;
            }
          }

          if (url.indexOf("localhost:300") > -1) {
            try {
              path = decodeURIComponent(url).split("https://localhost:3001/instrument?js=true&url=")[1];
            } catch (ig) {
            }
          }

          metaScripts.push({
            path: path,
            url: url || window.location.href,
            inline: !scriptEl.src,
            domPath: $scriptEl.getPath(),
            order: h
          });
        });


        return metaScripts;
      };

      window.unravelAgent.emitCSS = function () {
        var css = "";
        if (document.styleSheets && document.styleSheets.length) {
          for (var i = 0; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i] && document.styleSheets[i].cssRules) {
              var cssRules = document.styleSheets[i].cssRules;

              for (var j = 0; j < cssRules.length; j++) {

                //var mediaRuleText = "";
                //
                //try {
                //  var keepRule = false;
                //  var selectorText = cssRules[j].selectorText;
                //  var selectors = selectorText.split(",");
                //  keepRule = !!_(selectors).find(function (selector) {
                //    var checkText = selector.indexOf(':') > -1 ? selector.substr(0, selector.indexOf(':')) : selector;
                //    return !!unravelAgent.$(checkText).length;
                //  });
                //
                //} catch (err) {
                //  if (cssRules[j] instanceof CSSMediaRule) {  //CSSKeyframesRule
                //    var subRulesToRemove = [];
                //
                //    var mediaRule = cssRules[j];
                //    var innerCSSRules = mediaRule.cssRules;
                //    for (var k = 0; k < innerCSSRules.length; k++) {
                //      var innerMediaRule = innerCSSRules[k];
                //      var innerSelectorText = innerMediaRule.selectorText;
                //
                //      try {
                //        var innerSelectors = innerSelectorText.split(",");
                //        var innerExists = !!_(innerSelectors).find(function (selector) {
                //          var checkText = selector.indexOf(':') > -1 ? selector.substr(0, selector.indexOf(':')) : selector;
                //          return !!unravelAgent.$(checkText).length;
                //        });
                //        if (!innerExists) {
                //          subRulesToRemove.push(innerMediaRule.cssText);
                //        }
                //      } catch (err) {
                //      }
                //    }
                //    keepRule = false;
                //
                //    if (innerCSSRules.length === subRulesToRemove.length) {
                //      mediaRuleText = "";
                //    } else {
                //      mediaRuleText = cssRules[j].cssText;
                //      for (var l = 0; l < subRulesToRemove.length; l++) {
                //        mediaRuleText = mediaRuleText.replace(subRulesToRemove[l], "");
                //      }
                //    }
                //  } else if (cssRules[j] instanceof CSSFontFaceRule) {
                //    //if (cssRules[j].cssText.length > 1000) {
                //    keepRule = false;
                //    //} else {
                //    //  keepRule = true;
                //    //}
                //  } else if (cssRules[j] instanceof CSSKeyframesRule) {
                //    keepRule = false;
                //  } else {
                //    console.log("Blindly passing rule type:", typeof cssRules[j]);
                //    keepRule = true;
                //  }
                //}

                //if (true) {
                css += cssRules[j].cssText + "\n";
                //} else if (mediaRuleText) {
                //  css += mediaRuleText;
                //}
              }
            }
          }
        }

        window.dispatchEvent(new CustomEvent("fondueDTO", {
            detail: {
              eventStr: "fondueDTO:css",
              obj: {css: css}
            }
          })
        );
      };

      window.unravelAgent.emitHTML = function () {
        unravelAgent.$("[src]").each(function (index, value) {
          var $el = unravelAgent.$(this);
          $el.attr("src", $el[0].src);
        });

        window.dispatchEvent(new CustomEvent("fondueDTO", {
            detail: {
              eventStr: "fondueDTO:html",
              obj: {html: unravelAgent.$("html")[0].outerHTML}
            }
          })
        );
      };
    };
  })
;
