def([
  "jquery",
  "backbone",
  "underscore",
  "TraceModel"
], function ($, Backbone, _, TraceModel) {
  return Backbone.Collection.extend({
    model: TraceModel,
  })
});