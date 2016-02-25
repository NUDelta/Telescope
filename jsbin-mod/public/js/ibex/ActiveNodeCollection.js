def([
  "jquery",
  "backbone",
  "underscore",
  "ActiveNodeModel"
], function ($, Backbone, _, ActiveNodeModel) {
  return Backbone.Collection.extend({
    model: ActiveNodeModel,

    getDomQueryNodes: function () {
      var queryNodeMap = {};

      this.each(function (nodeModel) {
        var domQueries = nodeModel.getDomQueries();

        if (!domQueries.length) {
          return;
        }

        _(domQueries).each(function (domQuery) {
          var key = domQuery.domQueryKey + "|" + domQuery.queryString;
          if (queryNodeMap[key]) {
            queryNodeMap[key].push(nodeModel);
          } else {
            queryNodeMap[key] = [nodeModel];
          }
        });
      }, this);

      return queryNodeMap;
    },

    markDomManipulatingNodes: function () {
      //Run a check against each active node to see if it modifies the dom
      //  If so, mark it and all of its callers
      this.each(function (nodeModel) {
        var arrNodeIds = [];
        var domQueries = nodeModel.getDomQueries();

        if (domQueries.length) {
          var invokes = nodeModel.get("invokes") || [];
          _(invokes).each(function (invoke) {
            arrNodeIds.push(invoke.nodeId);

            _(invoke.callStack || []).each(function (caller) {
              arrNodeIds.push(caller.nodeId);
            });
          });
        }

        arrNodeIds = _(arrNodeIds).uniq();
        _(arrNodeIds).each(function (nodeId) {
          var nodeModel = this.get(nodeId);
          if (nodeModel) {
            nodeModel.set("relatedDomModifier", true);

            var relatedDomQueries = nodeModel.get("relatedDomQueries") || [];
            nodeModel.set("relatedDomQueries", relatedDomQueries.concat(domQueries));
          }
        }, this);
      }, this);
    }

  })
});