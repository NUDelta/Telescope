define([
  "underscore",
  "backbone"
], function (_, Backbone) {
  var instance = null;

  var PanelSocketRouter = Backbone.Router.extend({
    heardIds: [],

    connected: false,

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
      this.socket.on("jsbin:listen", _.bind(function (obj) {
        this.heardIds.push(obj.binId);
        this.trySocketLock();
      }, this));

    },

    trySocketLock(){
      if (this.binId) {
        if (this.heardIds.length) {
          var foundId = _(this.heardIds).find(function (id) {
            return id === this.binId;
          }, this);
          if (foundId) {
            this.connected = true;
            this.socket.off("jsbin:listen");
            this.trigger("connected");
            this.emit("browser:listen", {});
          }
        }
      }
    },

    setBinId: function (binId) {
      if (!this.connected) {
        this.binId = binId;
        this.trySocketLock();
      }
    },

    emit: function (eventStr, obj) {
      if (!this.binId) {
        throw new Error("No bin ID found to broadcast to.");
      }

      if (typeof obj !== "object" || _.isArray(obj)) {
        throw new Error("Emit only objects please.")
      }

      obj.userId = this.userId;
      obj.binId = this.binId;
      this.socket.emit(eventStr, obj);

      return this;
    },

    onSocketData: function (eventStr, callback, context) {
      if (context) {
        callback = _.bind(callback, context);
      }

      this.socket.on(eventStr, callback);

      return this;
    }
  });

  PanelSocketRouter.getInstance = function () {
    if (instance === null) {
      instance = new PanelSocketRouter();
    }
    return instance;
  };

  return PanelSocketRouter;
});