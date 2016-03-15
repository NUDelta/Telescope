define([
  "backbone",
  "underscore",
  "../models/CallStackModel"
], function (Backbone, _, CallStackModel) {
  return Backbone.Collection.extend({
    model: CallStackModel
  });
});