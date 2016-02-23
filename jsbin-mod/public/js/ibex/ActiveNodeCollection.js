def([
  "jquery",
  "backbone",
  "underscore",
  "ActiveNodeModel"
], function ($, Backbone, _, ActiveNodeModel) {
  return Backbone.Collection.extend({
    model: ActiveNodeModel,

    markDomManipulatingNodes: function () {
      var _domQueryKeys = _([
        "getElementsByTagName",
        "getElementsByTagNameNS",
        "getElementsByClassName",
        "getElementsByName",
        "getElementById",
        "querySelector",
        "querySelectorAll"
      ]);

      //Run a check against each active node to see if it modifies the dom
      //  If so, mark it and all of its callers
      var arrNodeIds = [];
      var arrDomItems = [];
      this.each(function (nodeModel) {
        nodeModel.set("domModifier", false);

        var nodeName = nodeModel.get("name");

        if (!nodeName) {
          return;
        }

        var domQueryKey = _domQueryKeys.find(function (partialKey) {
          if (nodeName.indexOf(partialKey) > -1) {
            return true;
          }
        });

        if (domQueryKey) {
          var invokes = nodeModel.get("invokes") || [];
          _(invokes).each(function (invoke) {

            try {
              if (invoke.arguments[0].value.type === "string") {
                arrDomItems.push({
                  domQueryKey: domQueryKey,
                  queryString: invoke.arguments[0].value.value
                });
              }
            } catch (ignored) {
            }

            arrNodeIds.push(invoke.nodeId);

            _(invoke.callStack || []).each(function (caller) {
              arrNodeIds.push(caller.nodeId);
            });
          });
        }
      });

      arrDomItems = _(arrDomItems).uniq(false, function(o){
        return o.domQueryKey + o.queryString;
      });

      _(arrNodeIds).each(function (nodeId) {
        var nodeModel = this.get(nodeId);
        if (nodeModel) {
          nodeModel.set("domModifier", true);
          nodeModel.set("domQueries", arrDomItems);
        }
      }, this);
    },

    getAllDOMFns: function () {
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

      return _(partialKeys).unique();
    }
  })
});