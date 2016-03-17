define([
  "../injectors/jQueryInjector",
  "../injectors/underscoreInjector",
  "../injectors/observerInjector",
  "../injectors/jsTraceInjector",
  "../injectors/fondueInjector",
  "../injectors/whittleInjector",
  "../injectors/introJSInjector",
  "../injectors/introJSBridgeInjector",
  "../injectors/highlightJSInjector"
], function (jQueryInjector,
             underscoreInjector,
             observerInjector,
             jsTraceInjector,
             fondueInjector,
             whittleInjector,
             introJSInjector,
             introJSBridgeInjector,
             highlightJSInjector) {
  function UnravelAgent() {
    if (!(this instanceof UnravelAgent)) {
      throw new TypeError("UnravelAgent constructor cannot be called as a function.");
    }
  }

  UnravelAgent.reloadInjecting = function () {
    var agentFn = function () {
      window.unravelAgent = {
        selectElement: function (el) {
          window.dispatchEvent(new CustomEvent("ElementSelected", {"detail": unravelAgent.$(el).getPath()}));
        }
      };
    };

    //Order is important here
    var f1 = "(" + agentFn.toString() + ").apply(this, []); ";
    var f2 = "(" + jQueryInjector.toString() + ").apply(this, []); ";
    var f3 = "(" + underscoreInjector.toString() + ").apply(this, []); ";
    var f5 = "(" + jsTraceInjector.toString() + ").apply(this, []); ";
    var f6 = "(" + observerInjector.toString() + ").apply(this, []); ";
    var f7 = "(" + fondueInjector.toString() + ").apply(this, []); ";
    var f8 = "(" + whittleInjector.toString() + ").apply(this, []); ";
    var f9 = "(" + introJSInjector.toString() + ").apply(this, []); ";
    var f10 = "(" + highlightJSInjector.toString() + ").apply(this, []); ";
    var f11 = "(" + introJSBridgeInjector.toString() + ").apply(this, []); ";

    chrome.devtools.inspectedWindow.reload({
      ignoreCache: true,
      injectedScript: f1 + f2 + f3 + f5 + f6 + f7 + f8 + f9 + f10 + f11
    });

    var checkTimeout = function (isActive) {
      if (isActive) {
        window.location.href = "";
      } else {
        window.setTimeout(function () {
          UnravelAgent.checkActive(checkTimeout)
        }, 1000);
      }
    };

    checkTimeout(false);
  };

  //public static
  UnravelAgent.checkActive = function (callback) {
    UnravelAgent.runInPage(function () {
      return !!window.unravelAgent;
    }, callback);
  };

  UnravelAgent.runInPage = function (fn, callback) {
    var args = Array.prototype.slice.call(arguments, 2);
    var evalCode = "(" + fn.toString() + ").apply(this, " + JSON.stringify(args) + ");";
    chrome.devtools.inspectedWindow.eval(evalCode, {}, callback);
  };

  UnravelAgent.prototype = {
    //instance methods
    constructor: UnravelAgent,

    isInjecting: false
  };

  return UnravelAgent;
});