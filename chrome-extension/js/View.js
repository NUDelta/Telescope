define([
  "backbone",
  "underscore",
  "jquery",
  "datatables",
  "handlebars",
  "UnravelAgent",
  "text!templates/view.html",
  "CallStackCollection",
  "NodeCollection",
  "IbexSocketRouter"
], function (Backbone, _, $, datatables, Handlebars, UnravelAgent, viewTemplate,
             CallStackCollection,
             NodeCollection,
             IbexSocketRouter) {
  return Backbone.View.extend({
    template: Handlebars.compile(viewTemplate),

    events: {
      "click #reload": "reloadInjecting"
    },

    initialize: function () {
      this.storeNodeActivity = _.bind(this.storeNodeActivity, this);
      this.transportScriptData = _.bind(this.transportScriptData, this);
      this.getScriptMetaData = _.bind(this.getScriptMetaData, this);

      this.ibexSocketRouter = IbexSocketRouter.getInstance();
      this.callStackCollection = new CallStackCollection();
      this.nodeCollection = new NodeCollection();
      this.ibexSocketRouter.on("connected", function () {
        this.start();
        this.getScriptMetaData(this.transportScriptData);
      }, this);

    },

    render: function (unravelAgentActive) {
      this.$el.html(this.template());

      if (unravelAgentActive) {
        this.$(".active-mode").show();
        this.createBin();
      } else {
        this.$(".restart-mode").show();
        return;
      }
    },

    createBin: function () {
      var jsBinCallback = _.bind(function (response) {
        var binUrl = response.url;
        var tabUrl = "http://localhost:8080/" + binUrl + "/edit?html,js";
        console.log(tabUrl);
        window.open(tabUrl);
        this.ibexSocketRouter.setBinId(binUrl);
        this.installTracer();
      }, this);

      $.ajax({
        url: "http://localhost:8080/api/save",
        data: {
          html: "",
          css: "",
          javascript: "",
          fondue: {
            traces: [],
            scripts: []
          }
        },
        datatype: "json",
        method: "post"
      }).done(jsBinCallback);
    },

    getScriptMetaData: function (callback) {
      var metaCallback = function (o) {
        this.location = o.location;
        this.metaScripts = o.metaScripts;

        if (callback) {
          callback();
        }
      };

      UnravelAgent.runInPage(function () {
        var location = unravelAgent.getLocation();
        var metaScripts = unravelAgent.metaScripts();

        return {
          location: location,
          metaScripts: metaScripts
        };
      }, _.bind(metaCallback, this));
    },

    handleJSTrace: function (traceEventObj) {
      this.callStackCollection.add(traceEventObj);
    },

    handleFondueDto: function (fondueDTO) {
      this.ibexSocketRouter.emit(fondueDTO.eventStr, fondueDTO.obj);
    },

    corsGet: function (url, callback) {
      var http = new XMLHttpRequest();
      http.open("GET", url, true);

      http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
          try {
            callback(http);
          } catch (err) {
            debugger;
          }

        }
      };

      http.send();
    },

    installTracer: function () {
      this.redirectTraces();
      UnravelAgent.runInPage(function () {
        unravelAgent.reWritePage();
      }); //fires event when done, picked up by content script
    },

    redirectTraces: function () {
      if (!this.redirectingSources) {
        this.redirectingSources = true;
      } else {
        this.redirectingSources = false;
      }
      UnravelAgent.runInPage(function (redirecting) {
        window.dispatchEvent(new CustomEvent("UnravelRedirectRequests", {
          "detail": {
            redirecting: redirecting,
            origin: window.location.origin
          }
        }));
        return redirecting;
      }, function (redirecting) {
        if (redirecting) {
          this.$("#redirectTraces .inactive").hide();
          this.$("#redirectTraces .active").show();
        } else {
          this.$("#redirectTraces .inactive").show();
          this.$("#redirectTraces .active").hide();
        }
      }, this.redirectingSources);
    },

    transportScriptData: function () {
      var hitScripts = _.chain(this.nodeCollection.models)
        .map(function (model) {
          return model.toJSON()
        })
        .pluck("path")
        .unique()
        .map(function (path) {
          var meta = _.find(this.metaScripts, function (s) {
            return s.path === path;
          }, this);

          if (!meta) {
            return {
              path: path,
              builtIn: true,
              url: null,
              inline: null,
              domPath: null,
              order: null,
              js: ""
            };
          }

          return {
            path: path,
            url: meta.url.split("#")[0], //ignore hash parts
            builtIn: false,
            inline: meta.inline,
            domPath: meta.domPath,
            order: meta.order,
            js: ""
          };
        }, this).value();

      var emitToBin = _.bind(function () {
        this.ibexSocketRouter.emit("fondueDTO:scripts", {scripts: hitScripts});
      }, this);

      var externalScripts = _(hitScripts).chain().where({
        inline: false
      }).sortBy(function (o) {
        return o.order
      }).value();

      var internalScripts = _(hitScripts).chain().where({
        inline: true
      }).sortBy(function (o) {
        return o.order
      }).value();

      var scriptHTMLCallback = function (arrJs) {
        _(arrJs).each(function (srcJS, i) {
          internalScripts[i].js = srcJS; //need a better way to tie
        });
      };

      if (internalScripts.length > 0) {
        if (externalScripts.length > 0) {
          this.getScriptsFromInlineHTML(this.location.href, _.bind(function (arrJs) {
            scriptHTMLCallback(arrJs);
            this.getScriptsFromExternal(externalScripts, emitToBin);
          }, this));
        } else {
          this.getScriptsFromInlineHTML(this.location.href, _.bind(function (arrJs) {
            scriptHTMLCallback(arrJs);
            emitToBin();
          }, this));
        }
      } else if (externalScripts.length > 0) {
        this.getScriptsFromExternal(externalScripts, emitToBin);
      }
    },

    getScriptsFromInlineHTML: function (htmlUrl, callback) {
      htmlUrl = htmlUrl.split("#")[0] + "";  //ignoring after hashes because server doesn't get them
      htmlUrl = "https://localhost:3001/beautifyHTML?url=" + encodeURIComponent(htmlUrl);

      this.corsGet(htmlUrl, _.bind(function (http) {
        var $html = $(http.responseText);
        var arrEl = [];
        $html.each(function (i, el) {
          if (el.tagName !== "SCRIPT") {
            return;
          }

          if (!el.getAttribute("src")) {
            arrEl.push(el.innerHTML);
          }
        });

        callback = _.bind(callback, this);
        callback(arrEl);
      }, this));
    },

    getScriptsFromExternal: function (externalScripts, callback) {
      var tries = 0;
      _(externalScripts).each(function (fileObj) {
        var formattedUrl = "https://localhost:3001/beautifyJS?url=" + encodeURIComponent(fileObj.path);

        this.corsGet(formattedUrl, _.bind(function (http) {
          var fileObj = _(externalScripts).find(function (file) {
            return file.url.split("url=")[1] === http.responseURL.split("url=")[1];
          });
          fileObj.js = http.responseText;

          tries++;
          if (tries == externalScripts.length) {
            callback();
          }
        }, this));
      }, this);
    },

    start: function () {
      var callback = _.bind(function (nodeArr) {
        this.nodeCollection.add(nodeArr);
      }, this);

      UnravelAgent.runInPage(function () {
        var nodeArr = unravelAgent.fondueBridge.startTracking();

        unravelAgent.emitCSS();
        unravelAgent.emitHTML();

        return nodeArr;
      }, callback);
    },

    stop: function () {
      UnravelAgent.runInPage(function () {
        //unravelAgent.stopObserving();
        //unravelAgent.traceJsOff();
      }, function () {
        this.$("#record .active").hide();
        this.$("#record .inactive").show();
      });

      UnravelAgent.runInPage(function () {
        return unravelAgent.fondueBridge.getNodeActivity();
      }, this.storeNodeActivity);
    },

    reset: function () {
      this.callStackCollection.reset(null, {});
      this.nodeCollection.reset(null, {});
      this.stop();
    },

    storeNodeActivity: function (nodeActivity) {
      if (!nodeActivity) {
        console.warn("Fondue injector is broken or not injected yet. JS Capturing disabled.");
        return;
      }

      this.nodeCollection.add(nodeActivity);
    },

    reloadInjecting: function () {
      UnravelAgent.reloadInjecting();
    }
  });
});