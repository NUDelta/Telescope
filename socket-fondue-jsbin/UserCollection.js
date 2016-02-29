if (typeof define !== 'function') {
  var define = require('amdefine')(module)
}

define(
  [
    'underscore',
    'backbone',
    './UserModel'
  ],
  function (_, Backbone, UserModel) {
    return Backbone.Collection.extend({
      model: UserModel,

      findByHandShake: function (handShakeObj) {
        var cookieObj = this.cookieToObject(handShakeObj.headers.cookie) || {};

        var userModel = this.get(cookieObj.uid);
        if (userModel) {
          console.log("User lookup: Found with id:" + cookieObj.uid);
        } else {
          console.log("User lookup: No user found with id:" + cookieObj.uid);
        }
        return userModel;
      },

      createFromHandShake: function (handShakeObj) {
        var id = (this.cookieToObject(handShakeObj.headers.cookie) || {}).uid;

        id = id ? id : Math.random() * 10000000000000000;

        var userModel = new UserModel({
          id: id
        });
        this.add(userModel);
        console.log("Created user with id: " + userModel.get("id"));

        return userModel;
      },

      cookieToObject: function (cookie) {
        if (typeof(cookie) !== "string") return;

        return _(cookie.split("; ")).reduce(function (o, keyVal) {
          var split = keyVal.split("=");
          o[split[0]] = split[1];
          return o;
        }, {});
      }
    });
  }
);