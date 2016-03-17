def([
  "jquery",
  "backbone",
  "underscore",
  "../models/ActiveNodeModel",
  "../routers/JSBinSocketRouter"
], function ($, Backbone, _, ActiveNodeModel, JSBinSocketRouter) {
  return Backbone.Collection.extend({
    model: ActiveNodeModel,

    idAttribute: "id",

    queryNodeMap: {},

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
      return this.queryNodeMap;
    },

    findRelatedQueries: function (nodeModel) {
      var id = nodeModel.get("id");
      var domQueryArr = [];
      _(this.queryNodeMap).each(function (value, key) {
        var found = _(value).find(function (nodeM) {
          return id === nodeM.get("id");
        });
        if (found) {
          var domFnName = key.split("|")[0];
          var queryString = key.split("|")[1];
          domQueryArr.push({
            domFnName: domFnName,
            queryString: queryString
          });
        }
      });

      return domQueryArr;
    },

    relateNodesByDomQuery: function () {
      var searchNodes = this.filter(function (model) {
        var hasHits = !!model.get("hits");
        var hasPath = !!model.get("path");
        return hasHits && hasPath;
      });

      //Run a check against each active node to see if it modifies the dom
      _(searchNodes).each(function (nodeModel) {
        var arrNodeIds = [];
        var domQueries = nodeModel.getDomQueries();

        //  If so, find all of its callers
        if (domQueries.length) {
          console.log("node:", nodeModel.get("id"));

          var invokes = nodeModel.get("invokes");
          _(invokes).each(function (invoke) {
            if (invoke.processed) {
              return;
            }

            invoke.processed = true;
            arrNodeIds.push(invoke.nodeId);
            console.log("invoke:", invoke.nodeId);

            _(invoke.callStack || []).each(function (caller) {
              arrNodeIds.push(caller.nodeId);
              console.log("call:", caller.nodeId)
            });
          });
        }

        // Mark them as related
        arrNodeIds = _(arrNodeIds).uniq();
        _(arrNodeIds).each(function (nodeId) {
          var nodeModel = this.get(nodeId);
          nodeModel.set("domModifier", true);

          _(domQueries).each(function (domQueryObj) {
            var key = domQueryObj.domFnName + "|" + domQueryObj.queryString;
            var arrNodes = this.queryNodeMap[key] || [];
            arrNodes.push(nodeModel);
            this.queryNodeMap[key] = arrNodes;
          }, this);
        }, this);
      }, this);
    }

  })
});