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

    markDomManipulatingNodes: function () {
      var keyHash = {};
      var partialKeys = [];

      //Gather all fn's in HTML Document that modify
      for (var key in HTMLDocument.prototype) {
        if (typeof document[key] === "function") {
          keyHash["document." + key] = true;
        }
      }

      //Gather all fn's in the Element prototype that modify
      for (var key in HTMLElement.prototype) {
        try {
          if (typeof HTMLElement.prototype[key] === "function") {
            partialKeys.push("." + key);
          }
        } catch (ignored) {
        }
      }

      var activeNodes = this.getActiveNodes();
      var _partialKeys = _(partialKeys);

      //Run a check against each active node to see if it modifies the dom
      //  If so, mark it and all of its callers
      var arrNodeIds = [];
      _(activeNodes).each(function (nodeModel) {
        nodeModel.set("domModifier", false);

        var nodeName = nodeModel.get("name");

        var elementModifier = !!_partialKeys.find(function (partialKey) {
          if (nodeName.indexOf(partialKey) > -1) {
            return true;
          }
        });

        if (keyHash[nodeName] || elementModifier) {
          var invokes = nodeModel.get("invokes") || [];

          _(invokes).each(function (invoke) {
            arrNodeIds.push(invoke.nodeId);

            _(invoke.callStack || []).each(function (caller) {
              arrNodeIds.push(caller.nodeId);
            });
          });
        }
      });

      _(arrNodeIds).each(function (nodeId) {
        var nodeModel = this.get(nodeId);
        if (nodeModel) {
          nodeModel.set("domModifier", true);
        }
      }, this);
    }
  });
});