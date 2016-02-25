def([
  "jquery",
  "backbone",
  "underscore"
], function ($, Backbone, _) {
  return Backbone.Model.extend({
    _domQueryKeys: _([
      "getElementsByTagName",
      "getElementsByTagNameNS",
      "getElementsByClassName",
      "getElementsByName",
      "getElementById",
      "querySelector",
      "querySelectorAll"
    ]),

    getDomQueries: function () {
      var nodeName = this.get("name");

      if (!nodeName) {
        return [];
      }

      var domQueryKey = this._domQueryKeys.find(function (partialKey) {
        if (nodeName.indexOf(partialKey) > -1) {
          return true;
        }
      });

      if (domQueryKey) {
        var invokes = this.get("invokes") || [];
        var arrDomItems = [];

        _(invokes).each(function (invoke) {
          var domQueryFromInvoke = this.getDomQueryFromInvoke(invoke, domQueryKey);
          if (domQueryFromInvoke) {
            arrDomItems.push(domQueryFromInvoke);
          }
        }, this);

        arrDomItems = _(arrDomItems).uniq(false, function (o) {
          return o.domQueryKey + o.queryString;
        });

        return arrDomItems;
      }

      return [];
    },

    getDomQueryFromInvoke: function (invoke, domQueryKey) {
      try {
        if (invoke.arguments[0].value.type === "string") {
          return {
            domQueryKey: domQueryKey,
            queryString: invoke.arguments[0].value.value
          };
        }
      } catch (ignored) {
        return null;
      }
    }
  });
});