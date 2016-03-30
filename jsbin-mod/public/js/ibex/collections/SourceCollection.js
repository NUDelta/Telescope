def([
  "jquery",
  "backbone",
  "underscore",
  "../models/SourceModel"
], function ($, Backbone, _, SourceModel) {
  return Backbone.Collection.extend({
    model: SourceModel,

    sortReversed: true,

    initialize: function (ignored, o) {
      this.activeNodeCollection = o.activeNodeCollection; //used in sourceModel
      this.add(o.scripts);
    },

    empty: function () {
      var model;

      while (model = this.first()) {
        model.set("id", null);
        model.destroy();
      }
    },

    setOrder: function (reversed) {
      this.sortReversed = !!reversed;
    },

    getOrdered: function () {
      var ordered = this.chain()
        .reject(function (model) {
          return model.get("builtIn")
        })
        .sortBy(function (model) {
          return model.get("order")
        })
        .sortBy(function (model) {
          var domPath = model.get("domPath");
          if (domPath && domPath.indexOf("body") === -1) {
            return 0;
          } else {
            return 1;
          }
        })
        .value();

      if (this.sortReversed) {
        return ordered.reverse();
      } else {
        return ordered;
      }
    },

    getByCid: function (cid) {
      return this.find(function (model) {
        return model.cid === cid;
      });
    },

    getArrHeadScripts: function (scripts) {
      return this.reduce(function (memo, model) {
        if (model.get("domPath").indexOf("body") > -1) {
          return memo;
        } else {
          memo.push(model);
          return memo;
        }
      }, []);
    },

    getArrBodyScripts: function (scripts) {
      return this.reduce(function (memo, model) {
        if (model.get("domPath").indexOf("body") === -1) {
          return memo;
        } else {
          memo.push(model);
          return memo;
        }
      }, []);
    },

    getScriptNames: function () {

    }

  });
});