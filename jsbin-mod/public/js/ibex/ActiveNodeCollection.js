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

    getActiveNodes: function (path) {
      return this.filter(function (model) {
        var hasHits = !!model.get("hits");
        var hasPath = !!model.get("path");
        var matchesPath = path ? path === model.get("path") : true;
        //var isFunction = model.get("type") === "function" || model.get("type") === "callsite";
        var isFunction = model.get("type") === "function";
        return hasHits && isFunction && hasPath && matchesPath;
      });
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

      this.relateNodesByDomQuery();
    },

    empty: function () {
      var model;

      while (model = this.first()) {
        model.set("id", null);
        model.destroy();
      }
    },

    getDomQueryNodeMap: function () {
      var queryNodeMap = {};

      var activeNodes = this.getActiveNodes();
      _(activeNodes).each(function (nodeModel) {
        var arrDomQueryObjs = nodeModel.get("relatedDomQueries");

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

    relateNodesByDomQuery: function () {
      var searchNodes = this.filter(function (model) {
        var hasHits = !!model.get("hits");
        var hasPath = !!model.get("path");
        return hasHits && hasPath;
      });

      //Reset model related queries
      _(searchNodes).each(function (model) {
        model.unset("relatedDomQueries");
      });

      //Run a check against each active node to see if it modifies the dom
      //  If so, mark it and all of its callers
      _(searchNodes).each(function (nodeModel) {
        var arrNodeIds = [];
        var domQueries = nodeModel.getDomQueries();


        if (domQueries.length) {
          var invokes = nodeModel.get("invokes");
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
            var relatedDomQueries = nodeModel.get("relatedDomQueries") || [];
            nodeModel.set("relatedDomQueries", relatedDomQueries.concat(domQueries));
          }
        }, this);
      }, this);
    }

  })
});