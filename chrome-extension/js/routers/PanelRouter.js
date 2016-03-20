define([
  "backbone",
  "../views/PanelView",
  "../agents/UnravelAgent"
], function (Backbone, HomeView, UnravelAgent) {

  return Backbone.Router.extend({
    heardReload: false,

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

        router.on("fondueDTO", function (data) {
          router.homeView.handleFondueDto(data);
        }, router);

        router.on("ContentScriptReloaded", function (data) {
          if (!this.heardReload) {
            this.heardReload = true;
            router.homeView.onFondueReady();
            UnravelAgent.runInPage(function () {
              window.dispatchEvent(new CustomEvent("StopCSReloadEmitter"));
            });
          }
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
