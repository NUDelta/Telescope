def([
  "jquery",
  "backbone",
  "underscore",
  "ActiveNodeModel"
], function ($, Backbone, _, ActiveNodeModel) {
  return Backbone.Collection.extend({
    model: ActiveNodeModel,

    markDomManipulatingNodes: function () {
      var partialKeys = [];

      //Gather all fn's in HTML Document that modify
      for (var key in HTMLDocument.prototype) {
        if (typeof document[key] === "function") {
          partialKeys.push(key);
        }
      }

      //Gather all fn's in the Element prototype that modify
      for (var key in HTMLElement.prototype) {
        try {
          if (typeof HTMLElement.prototype[key] === "function") {
            partialKeys.push(key);
          }
        } catch (ignored) {
        }
      }

      var _partialKeys = _(partialKeys);

      //Run a check against each active node to see if it modifies the dom
      //  If so, mark it and all of its callers
      var arrNodeIds = [];
      this.each(function (nodeModel) {
        nodeModel.set("domModifier", false);

        var nodeName = nodeModel.get("name");

        if(!nodeName){
          return;
        }

        var elementModifier = !!_partialKeys.find(function (partialKey) {
          if (nodeName.indexOf(partialKey) > -1) {
            return true;
          }
        });

        if (elementModifier) {
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
  })
});