def([
  "jquery",
  "backbone",
  "underscore",
  "ActiveNodeModel",
  "JSBinSocketRouter"
], function ($, Backbone, _, ActiveNodeModel, JSBinSocketRouter) {
  return Backbone.Collection.extend({
    model: ActiveNodeModel,

    idAttribute: "id",

    initialize: function () {
      this.jsBinSocketRouter = JSBinSocketRouter.getInstance();
      this.jsBinSocketRouter.onSocketData("fondueDTO:nodeBacktrace", function (obj) {
        var model = this.get(obj.id);
        if (model) {
          model.set("callStack", obj.callStack);
        }
      }, this);

      this.empty = _.bind(this.empty, this);
    },

    merge: function (arrInvocations) {
      var nodesCreated = 0;
      _(arrInvocations).each(function (invocation) {
        var node = invocation.node;
        invocation.nodeName = node && node.name ? node.name : "";

        var activeNodeModel = this.get(invocation.nodeId);
        if (!activeNodeModel) {
          activeNodeModel = new ActiveNodeModel(node);
          this.add(activeNodeModel);
          nodesCreated++;
        }

        var invokeArr = activeNodeModel.get("invokes") || [];

        if (invokeArr.length < 500) {
          invokeArr.push(invocation);
          activeNodeModel.set("invokes", invokeArr);
        }
        activeNodeModel.set("hits", (activeNodeModel.get("hits") || 0) + 1);
      }, this);
      if (nodesCreated) {
        console.log("\tActiveNodeCollection: Added " + nodesCreated + " new nodes.");
      }
    },

    empty: function () {
      var model;

      while (model = this.first()) {
        model.set("id", null);
        model.destroy();
      }
    },

    getDomQueryNodes: function () {
      var queryNodeMap = {};

      this.each(function (nodeModel) {
        var arrDomQueryObjs = nodeModel.getDomQueries();

        if (!arrDomQueryObjs.length) {
          return;
        }

        _(arrDomQueryObjs).each(function (domQueryObj) {
          var key = domQueryObj.domFnName + "|" + domQueryObj.queryString;
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