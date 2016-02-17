define([
  "backbone",
  "underscore",
  "CallStackModel"
], function (Backbone, _, CallStackModel) {
  return Backbone.Collection.extend({
    model: CallStackModel
  });
});