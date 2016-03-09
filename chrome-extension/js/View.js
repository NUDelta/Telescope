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
      "click #reload": "reloadInjecting",
    },

    initialize: function () {
      this.storeNodeActivity = _.bind(this.storeNodeActivity, this);
      this.transportScriptData = _.bind(this.transportScriptData, this);
      this.getScriptMetaData = _.bind(this.getScriptMetaData, this);

      this.ibexSocketRouter = IbexSocketRouter.getInstance();
      this.callStackCollection = new CallStackCollection();
      this.nodeCollection = new NodeCollection();
    },

    render: function (unravelAgentActive) {
      this.$el.html(this.template());

      if (unravelAgentActive) {
        this.$(".active-mode").show();

        this.createBin(); //Right after chrome injection, before fondue installed

        this.ibexSocketRouter.on("connected", this.onBinReady, this);
      } else {
        this.$(".restart-mode").show();
        return;
      }
    },

    onBinReady: function () {
      UnravelAgent.runInPage(function () {
        unravelAgent.emitCSS();
        unravelAgent.emitHTML();
      }, _.bind(this.installTracer, this));
    },

    onFondueReady: function () {
      var that = this;
      var transportFn = _.bind(function () {
        var callback = _.bind(function (nodeArr) {
          if (!nodeArr) {
            setTimeout(transportFn, 100);
          } else {
            this.nodeCollection.add(nodeArr);
            this.getScriptMetaData(_.bind(function () {
              this.transportScriptData(function () {
                UnravelAgent.runInPage(function () {
                  unravelAgent.fondueBridge.startTracking();
                });
              });
            }, this));
          }
        }, that);

        UnravelAgent.runInPage(function () {
          if (unravelAgent.$("body").length) {
            return unravelAgent.fondueBridge.getNodes();
          } else {
            return false;
          }
        }, callback);

      }, this);

      transportFn();
    },

    createBin: function () {
      var jsBinCallback = _.bind(function (response) {
        var binUrl = response.url;
        var tabUrl = "http://localhost:8080/" + binUrl + "/edit?html,js";
        console.log(tabUrl);
        window.open(tabUrl);
        this.ibexSocketRouter.setBinId(binUrl);
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
            console.warn("Err on http req: ", http);
          }

        }
      };

      http.send();
    },

    installTracer: function (callback) {
      this.redirectTraces();
      UnravelAgent.runInPage(function () {
        unravelAgent.reWritePage();
      }, callback);
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

    transportScriptData: function (callback) {
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
        callback();
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

      var scriptHTMLCallback = function (arrJsOrder) {
        _(arrJsOrder).each(function (srcJS, i) {
          var order = srcJS.order;
          var js = srcJS.js;

          var fileObj = _(internalScripts).find(function (file) {
            return file.order === order;
          });

          if(!fileObj){
            console.warn("HTML INLINE SCRIPT ORDER MISMATCH." +
              " Instrument Service cheerio found a script in a " +
              "different order than the whittle injector.");
          }

          fileObj.js = js;
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
      var fetchUrl = "https://localhost:3001/inlineScriptSrcs?url=" + encodeURIComponent(htmlUrl);

      this.corsGet(fetchUrl, _.bind(function (http) {
        var arrJSOrder = JSON.parse(http.responseText);
        callback = _.bind(callback, this);
        callback(arrJSOrder);
      }, this));
    },

    getScriptsFromExternal: function (externalScripts, callback) {
      var tries = 0;
      _(externalScripts).each(function (fileObj) {
        var formattedUrl = "https://localhost:3001/beautifyJS?url=" + encodeURIComponent(fileObj.path);

        this.corsGet(formattedUrl, _.bind(function (http) {
          var fileObj = _(externalScripts).find(function (file) {
            var fetchedUrl = decodeURIComponent(http.responseURL.split("url=")[1]);
            return file.url === fetchedUrl;
          });
          fileObj.js = http.responseText;

          tries++;
          if (tries == externalScripts.length) {
            callback();
          }
        }, this));
      }, this);
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