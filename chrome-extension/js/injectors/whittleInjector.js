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

        var i = 0;
        unravelAgent._(scripts).each(function (scriptEl) {
          var url = "";

          var $scriptEl = unravelAgent.$(scriptEl);
          if (scriptEl.src) {
            $scriptEl.attr("src", scriptEl.src);
            url = scriptEl.src;
          } else {
            if (scriptEl.innerHTML.indexOf("__tracer.add") > -1) {
              //Inline scripts
              url = scriptEl.innerHTML.split("__tracer.add(\"")[1].split("\"")[0];
            } else {
              if (scriptEl.innerHTML.indexOf("tracer") > -1) {
                //It is the default fondue tracer script... ignore it
                return;
              } else {
                //Untraced inline scripts
                //https://localhost:3001/-script-0
                url = "untraced-inline-script";
              }
            }
          }

          if (url.indexOf("https://localhost:3001/instrument?js=true&url=") > -1) {
            url = decodeURIComponent(url).split("https://localhost:3001/instrument?js=true&url=")[1];
          }

          metaScripts.push({
            path: url,
            url: url,
            inline: !scriptEl.src,
            domPath: $scriptEl.getPath(),
            order: i
          });

          i++;
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
                css += cssRules[j].cssText + "\n";
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

      window.unravelAgent.emitHTMLSelect = function () {
        if (!window.unravelAgent.htmlCleaned) {
          unravelAgent.$("[src]").each(function (index, value) {
            var $el = unravelAgent.$(this);
            $el.attr("src", $el[0].src);
          });

          var trashEls = [];
          var allDescendants = function (parentEl) {
            for (var i = 0; i < parentEl.childNodes.length; i++) {
              var el = parentEl.childNodes[i];

              if (el && el.nodeType && el.nodeType === 8) {//comment node
                trashEls.push(el);
              }

              allDescendants(el);
            }
          };

          allDescendants(unravelAgent.$("html")[0]);

          unravelAgent._(trashEls).each(function (el) {
            el.remove();
          });

          window.unravelAgent.htmlCleaned = true;
        }

        window.dispatchEvent(new CustomEvent("fondueDTO",
          {
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
