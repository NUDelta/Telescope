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

    earliestTimeStamp: 0,

    latestTimeStamp: 0,

    minInvokeTime: 0,

    maxInvokeTime: 0,

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

    getEarliestTimeStamp: function () {
      return this.earliestTimeStamp;
    },

    getLatestTimeStamp: function () {
      return this.latestTimeStamp;
    },

    getActiveNodes: function (path, domModifiersOnly) {
      return this.filter(function (model) {
        var hasHits = !!model.getHits();
        var hasPath = !!model.get("path");
        var matchesPath = path ? path === model.get("path") : true;
        var domModifier = domModifiersOnly ? !!model.get("domModifier") : true;
        var isFunction = model.get("type") === "function";

        return hasHits && isFunction && hasPath && matchesPath && domModifier;
      });
    },

    setTimeStampBounds: function (minInvokeTime, maxInvokeTime) {
      this.minInvokeTime = minInvokeTime;
      this.maxInvokeTime = maxInvokeTime;
      this.populateQueryNodeMap();
    },

    mergeNodes: function (arrNodes) {
      this.hasFullNodeList = true;

      var nodesCreated = 0;
      _(arrNodes).each(function (node) {
        var activeNodeModel = this.get(node.id);
        if (!activeNodeModel) {
          activeNodeModel = new ActiveNodeModel(node);
          this.add(activeNodeModel);
          nodesCreated++;
        }
      }, this);
      if (nodesCreated) {
        console.log("\tActiveNodeCollection: Added " + nodesCreated + " new nodes.");
      }

      this.populateQueryNodeMap();
    },

    mergeInvocations: function (arrInvocations) {
      //We have to relate them as the come with the full list
      // if (!this.hasFullNodeList) {
      //   return;
      // }

      var nodesCreated = 0;
      _(arrInvocations).each(function (invocation) {
        var node = invocation.node;
        invocation.nodeName = node && node.name ? node.name : "";

        var timestamp = invocation.timestamp;

        if (!this.earliestTimeStamp || timestamp < this.earliestTimeStamp) {
          this.earliestTimeStamp = timestamp;
        }
        if (!this.latestTimeStamp || timestamp > this.latestTimeStamp) {
          this.latestTimeStamp = timestamp;
        }

        var activeNodeModel = this.get(invocation.nodeId);
        if (!activeNodeModel) {
          activeNodeModel = new ActiveNodeModel(node);
          this.add(activeNodeModel);
          nodesCreated++;
        }

        var invokeArr = activeNodeModel.get("invokes") || [];

        if (invokeArr.length < 100) {
          invokeArr.push(invocation);
          activeNodeModel.set("invokes", invokeArr);
        }
      }, this);
      if (nodesCreated) {
        console.log("\tActiveNodeCollection: Added " + nodesCreated + " new nodes.");
      }

      this.populateQueryNodeMap();
    },

    empty: function () {
      var model;

      while (model = this.first()) {
        model.set("id", null);
        model.destroy();
      }

      this.queryNodeMap = {};
    },

    eachDomQuery: function (iterFn, context) {
      if (context) {
        iterFn = _.bind(iterFn, context);
      }

      var domQueries = _(this.queryNodeMap).keys();
      _(domQueries).each(function (domFnQueryStr) {
        var domFnName = domFnQueryStr.split("|")[0];
        var queryString = domFnQueryStr.split("|")[1];
        var activeNodes = this.getModelsByDomQuery(domFnName, queryString);

        iterFn(domFnName, queryString, activeNodes);
      }, this);
    },

    getModelsByDomQuery: function (domFnName, queryString) {
      return this.queryNodeMap[domFnName + "|" + queryString];
    },

    findQueriesPerNode: function (nodeModel) {
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

    timeStampInRange: function (timestamp) {
      if (this.minInvokeTime) {
        if (this.maxInvokeTime) {
          return timestamp >= this.minInvokeTime && timestamp <= this.maxInvokeTime;
        } else {
          return timestamp >= this.minInvokeTime;
        }
      } else if (this.maxInvokeTime) {
        return timestamp <= this.maxInvokeTime;
      } else {
        return true;
      }
    },

    populateQueryNodeMap: function () {
      this.queryNodeMap = {};

      var searchNodes = [];
      this.each(function (model) {
        model.set("domModifier", false);

        var hasHits = !!model.getHits();
        var hasPath = !!model.get("path");

        if (hasHits && hasPath) {
          searchNodes.push(model);
        }
      }, this);

      //Run a check against each active node to see if it modifies the dom
      _(searchNodes).each(function (nodeModel) {
        //  If so, find all of its callers
        var domQueryFn = nodeModel.getDomQueryFn();
        if (domQueryFn) {
          var invokes = nodeModel.get("invokes");
          _(invokes).each(function (invoke) {
            if (!this.timeStampInRange(invoke.timestamp)) {
              return;
            }

            var domQueryString = nodeModel.getDomQueryStringFromInvoke(invoke);

            // Mark them as related
            if (domQueryString) {
              var key = domQueryFn + "|" + domQueryString;
              var arrNodes = this.queryNodeMap[key] || [];
              arrNodes.push(nodeModel);

              nodeModel.set("domModifier", true);

              _(invoke.callStack).each(function (caller) {
                var callerNodeModel = this.get(caller.nodeId);
                if (callerNodeModel) {
                  arrNodes.push(callerNodeModel);
                  callerNodeModel.set("domModifier", true);
                }
              }, this);

              this.queryNodeMap[key] = arrNodes;
            }
          }, this);
        }
      }, this);
    }

  })
});