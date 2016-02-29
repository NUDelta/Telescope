define([
  "underscore",
  "backbone"
], function (_, Backbone) {
  var instance = null;

  var IbexSocketRouter = Backbone.Router.extend({
    initialize: function () {
      if (instance !== null) {
        throw new Error("Cannot instantiate more than one SocketRouter, use SocketRouter.getInstance()");
      }

      this.socket = io.connect('https://localhost:3003');
      this.on('connect', function () {
        console.log("Socket connection established.");
      });
      this.on("user:id", function (obj) {
        this.userId = obj.id;
        console.log("Storing socket user id in memory", this.userId);
      });
    },

    emit: function (eventStr, obj) {
      this.socket.emit(eventStr, obj);

      return this;
    },

    on: function (eventStr, callback, context) {
      if (context) {
        callback = _.bind(callback, context);
      }

      this.socket.on(eventStr, callback);

      return this;
    }
  });

  IbexSocketRouter.getInstance = function () {
    if (instance === null) {
      instance = new IbexSocketRouter();
    }
    return instance;
  };

  return IbexSocketRouter;
});