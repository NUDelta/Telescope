define([
  "backbone",
  "underscore",
  "jquery",
  "handlebars",
  "../agents/UnravelAgent",
  "../collections/NodeCollection",
  "../routers/PanelSocketRouter",
  "text!../templates/view.html"
], function (Backbone, _, $,
             Handlebars,
             UnravelAgent,
             NodeCollection,
             IbexSocketRouter, viewTemplate) {
  return Backbone.View.extend({
    template: Handlebars.compile(viewTemplate),

    events: {
      "click #reload": "reloadInjecting"
    },

    initialize: function () {
      this.sendScriptsToJSBin = _.bind(this.sendScriptsToJSBin, this);
      this.getScriptMetaData = _.bind(this.getScriptMetaData, this);

      this.ibexSocketRouter = IbexSocketRouter.getInstance();

      this.ibexSocketRouter.onSocketData("jsbin:reset", this.resetTracerResendNodes, this);
      this.ibexSocketRouter.onSocketData("jsbin:resendAll", this.sendNodesHTMLCSSToJSBin, this);
      this.ibexSocketRouter.onSocketData("jsbin:html", this.introPageHTML, this);

      this.nodeCollection = new NodeCollection();
      this.binSetupInProgress = true;
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

    introPageHTML: function (o) {
      if (o.selected === true) {
        UnravelAgent.runInPage(function (relatedDomQueries) {
          unravelAgent.introJsBridge.addHighlight(relatedDomQueries);
        }, null, o.relatedDomQueries);
      } else if (o.selected === false) {
        UnravelAgent.runInPage(function (relatedDomQueries) {
          unravelAgent.introJsBridge.removeHilight(relatedDomQueries);
        }, null, o.relatedDomQueries);
      }
    },

    resetTracerResendNodes: function () {
      console.log("JSBin requesting tracer reset and new node list.");
      UnravelAgent.runInPage(function () {
        unravelAgent.fondueBridge.resetTracer();
        unravelAgent.fondueBridge.emitNodeList();
      });
    },

    sendNodesHTMLCSSToJSBin: function (data) {
      if (this.binSetupInProgress) {
        console.log("Ignoring JSBin resendAll request, still setting up...");
        return;
      }

      if (this.sendingToBin) {
        console.log("Ignoring JSBin resendAll request, transmission in progress...");
        return;
      }

      var send = _.bind(function () {
        if (!this.binReady) {
          console.log("Bin not ready for data, waiting...");
          setTimeout(send, 500);
          return;
        }

        console.log("Sending JSBin new set of HTML/CSS/JS");
        console.log("sendingToBin set to True");
        this.sendingToBin = true;
        this.sendScriptsToJSBin();

        var setFalse = _.bind(function () {
          console.log("sendingToBin set to False");
          this.sendingToBin = false;
        }, this);

        var transmissionDone = _.bind(function () {
          setTimeout(setFalse, 10000);
        }, this);

        UnravelAgent.runInPage(function () {
          unravelAgent.emitCSS();
          unravelAgent.emitHTMLSelect();
          unravelAgent.fondueBridge.emitNodeList();
        }, transmissionDone);
      }, this);

      send();
    },

    onBinReady: function () {
      this.binReady = true;
    },

    onFondueReady: function () {
      var panelView = this;
      var tryToGetNodes = function () {
        console.log("Waiting on fondue'd doc to load...");

        var onNodesLoaded = function (nodeArr) {
          if (!nodeArr) {
            setTimeout(tryToGetNodes, 500);
          } else {
            panelView.nodeCollection.add(nodeArr);
            console.log("", nodeArr.length, " nodes loaded.");
            panelView.getScriptMetaData(function () {
              console.log("getScriptMetaData callback");

              UnravelAgent.runInPage(function () {
                unravelAgent.startObserving();
              }, function () {
                panelView.binSetupInProgress = false;
                panelView.sendNodesHTMLCSSToJSBin();
              });
            });
          }
        };

        UnravelAgent.runInPage(function () {
          // var hasBodyChildren = !!$("body").children().length;
          // var scripts = unravelAgent.$("script");
          // if (hasBodyChildren && scripts && scripts[0]) {
          if (unravelAgent.scriptLoadComplete) {
            return unravelAgent.fondueBridge.getNodes(); //for our script metadata
          } else {
            console.log("PanelView: Waiting on scripts to finish loading...");
            return false;
          }
        }, onNodesLoaded);
      };

      tryToGetNodes();
    },

    createBin: function () {
      var jsBinCallback = _.bind(function (response) {
        var binUrl = response.url;
        var tabUrl = "http://localhost:3005/" + binUrl + "/edit?html,js";
        console.log(tabUrl);
        window.open(tabUrl);
        this.ibexSocketRouter.setBinId(binUrl);
      }, this);

      $.ajax({
        url: "http://localhost:3005/api/save",
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

    sendScriptsToJSBin: function (callback) {
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
        if (callback) {
          callback();
        }
      }, this);

      var externalScripts = _(hitScripts).chain().where({
        inline: false
      }).sortBy(function (o) {
        return o.order
      }).value();

      var internalScripts = [];
      _.each(this.metaScripts, function (s) {
        if (s.unTraced) {
          internalScripts.push({
            path: s.path,
            url: s.url, //ignore hash parts
            builtIn: false,
            inline: s.inline,
            domPath: s.domPath,
            order: s.order,
            unTraced: true,
            js: ""
          });
        }
      }, this);

      internalScripts = _(hitScripts.concat(internalScripts)).chain().where({
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

          if (fileObj) {
            fileObj.js = js;
          } else {
            console.warn("HTML INLINE SCRIPT ORDER MISMATCH." +
              " Instrument Service cheerio found a script in a " +
              "different order than the whittle injector.");
          }
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

    reloadInjecting: function () {
        UnravelAgent.reloadInjecting();
    }
  });
});