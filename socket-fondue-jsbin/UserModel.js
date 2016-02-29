if (typeof define !== 'function') {
  var define = require('amdefine')(module)
}

define(
  [
    "backbone"
  ],
  function (Backbone) {
    return Backbone.Model.extend({});
  }
);
