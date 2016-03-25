define([],
  function () {
    return function () {
      window.unravelAgent.traceJsOn = function () {
        window.unravelAgent.storedCalls = {};

        if (window.unravelAgent.traceJsActive) {
          window.unravelAgent.traceJsOff();
        }
        window.unravelAgent.traceJsActive = true;

        if (!window.unravelAgent.functionPool) {
          window.unravelAgent.functionPool = {};
        }

        for (var func in document) {
          if (typeof(document[func]) === 'function') {
            window.unravelAgent.functionPool[func] = document[func];
            (function () {
              var functionName = func;  //closure in the func reference
              document[functionName] = function () {
                var args = [].splice.call(arguments, 0);

                if (functionName.indexOf("createEvent") < 0) {
                  var error = new Error();
                  var strArgs;
                  try {
                    strArgs = JSON.stringify(args);
                  } catch (ignored) {
                  }

                  var stackTrace = error.stack.replace(/(?:\r\n|\r|\n)/g, '|||');
                  if (stackTrace.indexOf("getPath") < 0) {
                    var traceObj = {
                      "detail": {
                        stack: error.stack.replace(/(?:\r\n|\r|\n)/g, '|||'),
                        functionName: functionName,
                        args: strArgs
                      }
                    };
                    window.dispatchEvent(new CustomEvent("JSTrace", traceObj));
                  }
                }

                return window.unravelAgent.functionPool[functionName].apply(document, args);
              }
            })();
          }
        }
      };

      window.unravelAgent.traceJsOff = function () {
        if (!window.unravelAgent.functionPool) {
          return;
        }

        for (var func in window.document) {
          if (typeof(window.document[func]) === 'function') {
            window.document[func] = window.unravelAgent.functionPool[func];
          }
        }

        window.unravelAgent.traceJsActive = false;
      };

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

        // if (window.self !== window.top) {
        //   console.log("Ignoring iframe rewrite");
        //   return;
        // }

        if (!window.location || !window.location.href || !window.location.origin || !window.location.pathname) {
          console.log("Ignoring rewrite for page/frame without enough location info");
          return;
        }

        var instrumentedURL = "https://localhost:3001/instrument?url=" + encodeURIComponent(window.location.href) +
          "&html=true&basePath=" + encodeURIComponent(window.location.origin + window.location.pathname) +
          "&callback=window.unravelAgent.reWriteCallback&fmt=json";

        var http = new XMLHttpRequest();
        http.open("GET", instrumentedURL, true);
        var complete = false;

        var callback = function () {
          if (http.readyState == 4 && http.status == 200 && !complete) {
            complete = true;
            try {
              var interval_id = window.setInterval("", 9999); // Get a reference to the last
              for (var i = 1; i < interval_id; i++) {
                window.clearInterval(i);
              }
              window.clearInterval(interval_id);

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

              var res = JSON.parse(http.responseText);
              window.dispatchEvent(new CustomEvent("ReloadContentListeners")); //Async request to reinit contentscript

              //Rewrite with fondue
              document.open('text/html');
              // document.write(http.responseText);
              document.write(res.htmlStr);
              document.close();

              var loadScripts = function (arrScripts, insertFn, callback) {
                if (!arrScripts || !arrScripts.length) {
                  callback();
                  return;
                }

                var scriptAttrs = arrScripts.shift();

                var script = document.createElement('script');
                var html = scriptAttrs.html;
                delete scriptAttrs.html;

                if (html) {
                  script.innerHTML = html;
                }

                unravelAgent.$(script).attr(scriptAttrs);

                console.log("Inserting", script.src ? script.src : "inline script");

                if (script.src) {
                  script.async = false;
                  script.onload = function () {
                    loadScripts(arrScripts, insertFn, callback);
                  };
                  script.onerror = function () {
                    loadScripts(arrScripts, insertFn, callback);
                  };
                  insertFn(script);
                } else {
                  insertFn(script);
                  loadScripts(arrScripts, insertFn, callback);
                }
              };

              var preHeadInsertFn = function (scriptEl) {
                unravelAgent.$(scriptEl).insertBefore("head");
              };

              var headInsertFn = function (scriptEl) {
                document.head.appendChild(scriptEl);
              };

              var preBodyInsertFn = function (scriptEl) {
                unravelAgent.$(scriptEl).insertBefore("body");
              };

              var bodyInsertFn = function (scriptEl) {
                unravelAgent.fondueBridge.updateTrackedNodes();
                document.body.appendChild(scriptEl);
              };

              var postBodyInsertFn = function (scriptEl) {
                unravelAgent.fondueBridge.updateTrackedNodes();
                unravelAgent.$("html").append(scriptEl);
              };

              // console.log("Loading pre-head scripts...");
              loadScripts(res.preHeadScripts, preHeadInsertFn, function () {
                // console.log("Loading head scripts...");
                loadScripts(res.headScripts, headInsertFn, function () {
                  // console.log("Loading pre-body scripts...");
                  loadScripts(res.preBodyScripts, preBodyInsertFn, function () {
                    unravelAgent.fondueBridge.startTracking();

                    console.log("Append body string...");
                    unravelAgent.$("body").attr(res.bodyAttr);
                    unravelAgent.$("body").append(res.bodyStr);
                    // console.log("Loading body scripts...");
                    loadScripts(res.bodyScripts, bodyInsertFn, function () {
                      unravelAgent.$("html").append(res.postBodyStr);
                      // console.log("Appending post-body...");
                      loadScripts(res.postBodyScripts, postBodyInsertFn, function () {
                        unravelAgent.fondueBridge.updateTrackedNodes();
                        unravelAgent.scriptLoadComplete = true;
                      });
                    });
                  })
                })
              });

            } catch (err) {
              debugger;
            }
          }
        };

        http.onreadystatechange = window.unravelAgent.$.proxy(callback, this);
        http.send();
      };

    };

  });

