define([],
  function () {
    return function () {
      window.unravelAgent.reWritePage = function () {
        //https://developer.mozilla.org/en-US/docs/Web/API/Window
        var keepKeys = [
          "applicationCache",
          "btoa",
          "caches",
          "closed",
          "Components",
          "console",
          "content",
          "controllers",
          "crypto",
          "defaultStatus",
          "devicePixelRatio",
          "dialogArguments",
          "directories",
          "document",
          "frameElement",
          "frames",
          "fullScreen",
          "getComputedStyle",
          "globalStorage",
          "history",
          "innerHeight",
          "innerWidth",
          "length",
          "location",
          "locationbar",
          "localStorage",
          "menubar",
          "messageManager",
          "mozAnimationStartTime",
          "mozInnerScreenX",
          "mozInnerScreenY",
          "mozPaintCount",
          "name",
          "navigator",
          "opener",
          "outerHeight",
          "outerWidth",
          "pageXOffset",
          "pageYOffset",
          "sessionStorage",
          "parent",
          "performance",
          "personalbar",
          "pkcs11",
          "returnValue",
          "screen",
          "screenX",
          "screenY",
          "scrollbars",
          "scrollMaxX",
          "scrollMaxY",
          "scrollX",
          "scrollY",
          "self",
          "sessionStorage",
          "sidebar",
          "status",
          "statusbar",
          "toolbar",
          "top",
          "window",
          "external",
          "console",
          "chrome",
          "unravelAgent",
          "alert",
          "back",
          "blur",
          "cancelIdleCallback",
          "captureEvents",
          "clearImmediate",
          "close",
          "confirm",
          "disableExternalCapture",
          "dispatchEvent",
          "dump",
          "enableExternalCapture",
          "find",
          "focus",
          "forward",
          "getAttention",
          "getAttentionWithCycleCount",
          "getComputedStyle",
          "getDefaultComputedStyle",
          "getSelection",
          "home",
          "matchMedia",
          "maximize",
          "minimize",
          "moveBy",
          "moveTo",
          "mozRequestAnimationFrame",
          "open",
          "openDialog",
          "postMessage",
          "print",
          "prompt",
          "releaseEvents",
          "requestAnimationFrame",
          "removeEventListener",
          "requestIdleCallback",
          "resizeBy",
          "resizeTo",
          "restore",
          "routeEvent",
          "scroll",
          "scrollBy",
          "scrollByLines",
          "scrollByPages",
          "scrollTo",
          "setCursor",
          "setImmediate",
          "setTimeout",
          "setInterval",
          "clearInterval",
          "clearTimeout",
          "setResizable",
          "showModalDialog",
          "sizeToContent",
          "stop",
          "updateCommands"
        ];

        if (!window.location || !window.location.href || !window.location.origin || !window.location.pathname) {
          console.log("Ignoring rewrite for page/frame without enough location info");
          return;
        }

        var instrumentedURL = "https://localhost:3001/instrument?url=" + encodeURIComponent(window.location.href) +
          "&html=true&basePath=" + encodeURIComponent(window.location.origin + window.location.pathname) +
          "&callback=window.unravelAgent.reWriteCallback";

        var http = new XMLHttpRequest();
        http.open("GET", instrumentedURL, true);
        var complete = false;

        var onScriptInstrumentComplete = function () {
          if (http.readyState == 4 && http.status == 200 && !complete) {
            complete = true;
            try {
              var interval_id = window.setInterval("", 9999); // Get a reference to the last
              for (var i = 1; i <= interval_id; i++) {
                window.clearInterval(i);
              }

              var deleteKeys = [];

              for (var key in window) {
                if (window.hasOwnProperty(key)) {
                  if (!window.unravelAgent._(keepKeys).contains(key)) {
                    deleteKeys.push(key);
                  }
                }
              }

              var wontDeleteKeys = [];
              window.unravelAgent._(deleteKeys).each(function (key) {
                var wasDeleted = delete window[key];
                if (!wasDeleted) {
                  wontDeleteKeys.push(key);
                }
              });

              var secondDeleteFails = [];
              window.unravelAgent._(wontDeleteKeys).each(function (key) {
                window[key] = null;
                window[key] = undefined;
                delete window[key];
                if (window[key]) {
                  secondDeleteFails.push(key);
                  console.log("Secondary delete didn't work:", key);
                }
              });

              if (window.localStorage && window.localStorage.clear) {
                window.localStorage.clear();
              }

              window.dispatchEvent(new CustomEvent("ReloadContentListeners")); //Async request to reinit contentscript

              //Rewrite with fondue
              document.open('text/html');
              document.write(http.responseText);
              document.close();
            } catch (err) {
              debugger;
            }
          }
        };

        http.onreadystatechange = window.unravelAgent.$.proxy(onScriptInstrumentComplete, this);
        http.send();
      };

    };

  });

