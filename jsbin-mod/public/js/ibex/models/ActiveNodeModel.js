def([
  "jquery",
  "backbone",
  "underscore"
], function ($, Backbone, _) {
  return Backbone.Model.extend({
    _domFnNames: _([
      "getElementsByTagName",
      "getElementsByTagNameNS",
      "getElementsByClassName",
      "getElementsByName",
      "getElementById",
      "querySelector",
      "createElement",
      "querySelectorAll"
    ]),

    getDomQueries: function () {
      var nodeName = this.get("name");

      if (!nodeName) {
        return [];
      }

      var domFnName = this._domFnNames.find(function (fnName) {
        if (nodeName.indexOf(fnName) > -1) {
          return true;
        }
      });

      if (domFnName) {
        var invokes = this.get("invokes") || [];
        var arrDomQueryObjs = [];

        _(invokes).each(function (invoke) {
          var queryObj = this.getQueryFromInvoke(invoke, domFnName);
          if (queryObj) {
            if (!(queryObj.domFnName === "getElementsByTagName" && queryObj.queryString === "script")) {
              arrDomQueryObjs.push(queryObj);
            }
          }
        }, this);

        arrDomQueryObjs = _(arrDomQueryObjs).uniq(false, function (o) {
          return o.domFnName + o.queryString;
        });

        return arrDomQueryObjs;
      }

      return [];
    },

    getQueryFromInvoke: function (invoke, domFnName) {
      try {
        if (invoke.arguments[0].value.type === "string") {
          return {
            domFnName: domFnName,
            queryString: invoke.arguments[0].value.value
          };
        }
      } catch (ignored) {
        return null;
      }
    }
  });
});