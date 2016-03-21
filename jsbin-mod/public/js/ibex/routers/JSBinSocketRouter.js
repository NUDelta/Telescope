def([
  "underscore",
  "backbone"
], function (_, Backbone) {
  var instance = null;

  var JSBinSocketRouter = Backbone.Router.extend({
    initialize: function () {
      if (instance !== null) {
        throw new Error("Cannot instantiate more than one SocketRouter, use SocketRouter.getInstance()");
      }

      this.binId = window.location.pathname.split("/")[1];

      this.socket = io.connect('https://localhost:3003');
      this.socket.on('connect', function () {
        console.log("Socket connection established.");
      });
      this.socket.on("user:id", _.bind(function (obj) {
        this.userId = obj.id;
        this.emit("jsbin:listen", {
          userId: this.userId,
          binId: this.binId
        });
      }, this));
    },

    emit: function (eventStr, obj) {
      obj.binId = this.binId;
      this.socket.emit(eventStr, obj);

      return this;
    },

    onSocketData: function (eventStr, callback, context) {
      if (context) {
        callback = _.bind(callback, context);
      }

      //Filter for only events for this bin id
      this.socket.on(eventStr, _.bind(function (data) {
        if (data && data.binId === this.binId) {
          callback(data);
        }
      }, this));

      return this;
    }
  });

  JSBinSocketRouter.getInstance = function () {
    if (instance === null) {
      instance = new JSBinSocketRouter();
    }
    return instance;
  };

  return JSBinSocketRouter;
});