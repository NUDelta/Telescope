/*
 This script is added to the web, but in its own context.
 */

var addListeners = function (notifyRouter) {
  if (notifyRouter) {
    chrome.extension.sendMessage({
      target: "page",
      name: "ContentScriptReloaded",
      data: {}
    });
  }

  window.addEventListener("UnravelKeepAlive", function (event) {
    chrome.extension.sendMessage({
      target: "page",
      name: "UnravelKeepAlive",
      data: event.detail
    });
  }, false);

  window.addEventListener("DOMObserve", function (event) {
    var str = event.detail;

    chrome.extension.sendMessage({
      target: "page",
      name: "mutation",
      data: str
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

// Sends a message to the background when the DOM of the inspected page is ready
// (typically used by the panel to check if the backbone agent is on the page).
  window.addEventListener('DOMContentLoaded', function () {
    chrome.extension.sendMessage({
      target: 'page',
      name: 'ready'
    });
  }, false);

  window.addEventListener("UnravelRedirectRequests", function (event) {
    chrome.extension.sendMessage({
      target: "page",
      name: "UnravelRedirectRequests",
      data: event.detail
    });
  }, false);

  window.addEventListener("ReloadContentListeners", function (event) {
    setTimeout(function () {
      addListeners(true);
    }, 0)
  }, false);

  //chrome.extension.sendMessage({
  //  target: "page",
  //  name: "UnravelRedirectRequests",
  //  data: {
  //    contentScript: true,
  //    redirecting: false,
  //    origin: window.location.origin
  //  }
  //});
};

addListeners();