/*
 This script can access the web page, but in its own scope.
 */

var addListeners = function (notifyRouter) {
  if (notifyRouter) {

    window.addEventListener("DOMObserve", function (event) {
      chrome.extension.sendMessage({
        target: "page",
        name: "mutation",
        data: event.detail
      });
    }, false);

    window.addEventListener("JSTrace", function (event) {
      chrome.extension.sendMessage({
        target: "page",
        name: "JSTrace",
        data: event.detail
      });
    }, false);

    window.addEventListener("fondueDTO", function (event) {
      chrome.extension.sendMessage({
        target: "page",
        name: "fondueDTO",
        data: event.detail
      });
    }, false);

    window.addEventListener("StopCSReloadEmitter", function (event) {
      window.clearInterval(interval);
      console.log("Telescope build: " + i + " millis.");
    }, false);
    var i = 0;
    var delayMillis = 50;
    var interval = setInterval(function () {
      i += delayMillis;
      chrome.extension.sendMessage({
        target: "page",
        name: "ContentScriptReloaded",
        data: {}
      });
    }, delayMillis);

  } else {
    console.log("Contentscript: Waiting for content reload.");

    window.addEventListener("ReloadContentListeners", function (event) {
      setTimeout(function () {
        addListeners(true);
      }, 0)
    }, false);
  }
};

addListeners();