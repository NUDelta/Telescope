define([],
  function () {
    return function () {
      window.unravelAgent.reWritePage = function () {

        //todo revisit https://developer.mozilla.org/en-US/docs/Web/API/Window
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

        var http = new XMLHttpRequest();
        var instrumentedURL = "https://localhost:3001/instrument?url=" + encodeURIComponent(window.location.href) + "&html=true&basePath=" + encodeURIComponent(window.location.origin + window.location.pathname) + "&callback=window.unravelAgent.reWriteCallback";
        http.open("GET", instrumentedURL, true);
        var complete = false;

        //var script = document.createElement('script');
        //script.src = instrumentedURL;
        //document.getElementsByTagName('head')[0].appendChild(script);

        var callback = function () {
          if (http.readyState == 4 && http.status == 200 && !complete) {
            complete = true;
            try {
              window.unravelAgent.response = http.responseText;

              var deleteKeys = [];

              for (var key in window) {
                if (window.hasOwnProperty(key)) {
                  if (!window.unravelAgent._(keepKeys).contains(key)) {
                    deleteKeys.push(key);
                  }
                }
              }

              console.log("Deleting", JSON.stringify(deleteKeys));

              var wontDeleteKeys = [];
              window.unravelAgent._(deleteKeys).each(function (key) {
                var wasDeleted = delete window[key];
                if (!wasDeleted) {
                  wontDeleteKeys.push(key);
                }
              });

              window.unravelAgent._(wontDeleteKeys).each(function (key) {
                window[key] = undefined;
                delete window[key];
                if (window[key]) {
                  console.log("Secondary delete didn't work:", key);
                }
              });

              if (window.localStorage && window.localStorage.clear) {
                window.localStorage.clear();
              }

              var interval_id = window.setInterval("", 9999); // Get a reference to the last
              for (var i = 1; i < interval_id; i++) {
                window.clearInterval(i);
              }
              window.clearInterval(interval_id);

              document.open('text/html');
              document.write("<html><head></head><body></body></html>");
              document.close();

              document.open('text/html');
              document.write(http.responseText);
              document.close();
            } catch (err) {
              debugger;
            }
          }
        };

        http.onreadystatechange = window.unravelAgent.$.proxy(callback, this);
        http.send();
      };


      //  window.unravelAgent.reWriteCallback = function (res) {
      //    debugger;
      //    try {
      //      window.unravelAgent.response = http.responseText;
      //
      //      var deleteKeys = [];
      //
      //      for (var key in window) {
      //        if (window.hasOwnProperty(key)) {
      //          if (!window.unravelAgent._(keepKeys).contains(key)) {
      //            deleteKeys.push(key);
      //          }
      //        }
      //      }
      //
      //      console.log("Deleting", JSON.stringify(deleteKeys));
      //
      //      var wontDeleteKeys = [];
      //      window.unravelAgent._(deleteKeys).each(function (key) {
      //        var wasDeleted = delete window[key];
      //        if (!wasDeleted) {
      //          wontDeleteKeys.push(key);
      //        }
      //      });
      //
      //      window.unravelAgent._(wontDeleteKeys).each(function (key) {
      //        window[key] = undefined;
      //        delete window[key];
      //        if (window[key]) {
      //          console.log("Secondary delete didn't work:", key);
      //        }
      //      });
      //
      //      if (window.localStorage && window.localStorage.clear) {
      //        window.localStorage.clear();
      //      }
      //
      //      document.open('text/html');
      //      document.write("<html><head></head><body></body></html>");
      //      document.close();
      //
      //      document.open('text/html');
      //      document.write(http.responseText);
      //      document.close();
      //    } catch (err) {
      //      debugger;
      //    }
      //  };
    };

  });

