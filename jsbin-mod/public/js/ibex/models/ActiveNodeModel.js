def([
  "jquery",
  "backbone",
  "underscore"
], function ($, Backbone, _) {
  return Backbone.Model.extend({
    // TODO Keep in sync with Fondue Injector
    _domFnNames: _([
      "getElementsByTagName",
      "getElementsByTagNameNS",
      "getElementsByClassName",
      "getElementsByName",
      "getElementById",
      "querySelector",
      //"createElement",
      "querySelectorAll"
    ]),

    getHits: function () {
      var invokes = this.get("invokes");
      var i = 0;

      _(invokes).each(function (invoke) {
        if (this.collection.timeStampInRange(invoke.timestamp)) {
          i++;
        }
      }, this);

      return i;
    },

    getDomQueryFn: function () {
      if (this.domFnName) {
        return this.domFnName;
      }

      var name = this.get("name");
      if (!name) {
        return null;
      }

      this.domFnName = this._domFnNames.find(function (fnName) {
        if (name.indexOf(fnName) > -1) {
          return true;
        }
      });
      return this.domFnName;
    },

    getDomQueryStringFromInvoke: function (invoke) {
      if (invoke &&
        invoke.arguments &&
        invoke.arguments[0] &&
        invoke.arguments[0].value &&
        invoke.arguments[0].value.type === "string") {
        var value = invoke.arguments[0].value.value;

        if (value !== "*" && value !== "script") {
          return value;
        }
      } else {
        return null;
      }
    }
  });
});