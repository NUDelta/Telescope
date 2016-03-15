define([
  "backbone",
  "../views/PanelView",
  "../agents/UnravelAgent"
], function (Backbone, HomeView, UnravelAgent) {

  return Backbone.Router.extend({
    initialize: function () {
    },

    routes: {
      "": "start"
    },

    start: function () {
      this.homeView = new HomeView();
      var router = this;

      UnravelAgent.checkActive(function (isActive) {
        router.unravelAgent = new UnravelAgent();
        router.homeView.render(isActive);
        document.body.appendChild(router.homeView.el);
        if (!isActive) {
          return;
        }

        //router.on("mutation", function (mutations) {
          //router.homeView.handleMutations(mutations);
        //}, router);

        //router.on("JSTrace", function (data) {
        //  router.homeView.handleJSTrace(data);
        //}, router);

        router.on("fondueDTO", function (data) {
          router.homeView.handleFondueDto(data);
        }, router);

        router.on("ContentScriptReloaded", function (data) {
          router.homeView.onFondueReady();
        }, router);

        router.on("TabUpdate", function (data) {
          UnravelAgent.checkActive(function (isActive) {
            if (!isActive) {
              window.location.href = "";
            }
          });
        }, router);

      });
    }
  });
});
