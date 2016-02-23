define([
  "backbone",
  "underscore",
  "NodeModel"
], function (Backbone, _, NodeModel) {
  return Backbone.Collection.extend({
    model: NodeModel,

    idAttribute: "id",

    getActiveNodes: function () {
      return this.reduce(function (memo, nodeModel) {
        var id = nodeModel.get("id");
        if (id && id.split("-").length > 5 && nodeModel.get("hits") > 0) {
          memo.push(nodeModel);
        }

        return memo;
      }, []);
    },

    getActiveNodeArr: function () {
      return _(this.getActiveNodes()).map(function (nodeModel) {
        return nodeModel.toJSON();
      });
    },


  });
});