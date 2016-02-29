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
      "click #record": "record",
      "click #reset": "reset",
      "click #whittle": "whittle",
      "click #reload": "reloadInjecting",
      "click #fiddle": "fiddle",
      "click #installTracer": "installTracer",
      "click #redirectTraces": "redirectTraces"
    },

    pathsDomRows: [],

    pathsJSRows: [],

    domPathsToKeep: [],

    arrDomHitLines: [],

    filterSVG: true,

    whittled: false,

    activeCSS: "",

    activeHTML: "",

    initialize: function () {
      this.storeNodeActivity = _.bind(this.storeNodeActivity, this);
      this.fiddle = _.bind(this.fiddle, this);
      this.whittle = _.bind(this.whittle, this);

      this.ibexSocketRouter = IbexSocketRouter.getInstance();
      this.callStackCollection = new CallStackCollection();
      this.nodeCollection = new NodeCollection();
    },

    render: function (unravelAgentActive) {
      this.$el.html(this.template());

      if (unravelAgentActive) {
        this.$(".active-mode").show();
      } else {
        this.$(".restart-mode").show();
        return;
      }
    },

    whittle: function (e, callback) {
      this.whittled = true;

      var whittleCallback = function (o) {
        this.location = o.location;
        this.activeHTML = o.activeHTML;
        this.activeCSS = o.activeCSS;
        this.metaScripts = o.metaScripts;

        if (callback) {
          callback();
        }
      };

      UnravelAgent.runInPage(function (safePaths) {
        var location = unravelAgent.getLocation();
        var metaScripts = unravelAgent.metaScripts();
        var activeCSS = unravelAgent.gatherCSS(safePaths);
        var activeHTML = unravelAgent.whittle(safePaths); //important to run _after_ css

        return {
          location: location,
          metaScripts: metaScripts,
          activeCSS: activeCSS,
          activeHTML: activeHTML
        };
      }, _.bind(whittleCallback, this), this.domPathsToKeep);
    },

    handleJSTrace: function (traceEventObj) {
      this.callStackCollection.add(traceEventObj);
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
      });
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

    fiddle: function () {
      if (!this.whittled) {
        this.whittle(null, this.fiddle);
        return;
      }

      var hitScripts = _.chain(this.nodeCollection.getActiveNodeArr()).pluck("path").unique().map(function (path) {
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

      var jsBinCallback = _.bind(function (response) {
        var binUrl = response.url;
        var tabUrl = "http://localhost:8080/" + binUrl + "/edit?html,js";
        console.log(tabUrl);
        window.open(tabUrl);
        this.activeHTML = "";
        this.activeCSS = "";
        this.reloadInjecting();
      }, this);

      var postToBin = _.bind(function () {
        try {
          $.ajax({
            url: "http://localhost:8080/api/save",
            data: {
              html: this.activeHTML,
              css: this.activeCSS,
              javascript: "",
              fondue: {
                traces: JSON.stringify(this.nodeCollection.getActiveNodeArr()),
                scripts: JSON.stringify(hitScripts)
              }
            },
            datatype: "json",
            method: "post"
          }).done(jsBinCallback);
        } catch (err) {
          debugger;
        }
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
            this.getScriptsFromExternal(externalScripts, postToBin);
          }, this));
        } else {
          this.getScriptsFromInlineHTML(this.location.href, _.bind(function (arrJs) {
            scriptHTMLCallback(arrJs);
            postToBin();
          }, this));
        }
      } else if (externalScripts.length > 0) {
        this.getScriptsFromExternal(externalScripts, postToBin);
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

    record: function () {
      if (this.$("#record .active").is(":visible")) {
        this.stop();
      } else {
        this.start();
      }
    },

    start: function () {
      var callback = function () {
        this.$("#record .inactive").hide();
        this.$("#record .active").show();
      };

      var path = this.constrainToPath ? this.currentPath : "";

      UnravelAgent.runInPage(function (path) {
        //unravelAgent.startObserving(path);
        //unravelAgent.traceJsOn();
        unravelAgent.fondueBridge.startTracking();
      }, callback, path);

      var that = this;
      var fondueCallback = function (functionMap) {
        that.fondueFnMap = functionMap;
      };

      UnravelAgent.runInPage(function () {
        return unravelAgent.fondueBridge.getFunctionMap();
      }, fondueCallback);
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
      this.domPathsToKeep = [];
      this.arrDomHitLines = [];
      this.pathsDomRows = [];
      this.pathsJSRows = [];
      this.activeHTML = "";
      this.activeCSS = "";
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

    parseSelector: function (htmlString) {
      var $el = $(htmlString);

      if (!$el.prop || !$el.prop("tagName")) {
        return "";
      }

      var tagName = $el.prop("tagName").toLowerCase();
      var idName = $el.attr("id") || "";
      if (idName.length > 0) {
        idName = "#" + idName;
      }
      var nameAttr = $el.attr("name") || "";
      if (nameAttr.length > 0) {
        nameAttr = '[name="' + nameAttr + '"]';
      }

      var className;
      try {
        className = "." + $el.attr("class").split(" ").join(".");
      } catch (err) {
        className = "";
      }

      return tagName + idName + className + nameAttr;
    },

    handleMutations: function (mutations) {
      _(mutations).map(function (mutation) {
        mutation.selector = this.parseSelector(mutation.target);
        var path = (mutation.path || "");

        if (this.filterSVG && mutation.path.toLowerCase().indexOf("svg") > -1) {
          return;
        }

        if (!this.pathsDomRows[path]) {
          var tags = path.split(">");
          var paths = [];

          for (var i = 0; i < tags.length; i++) {
            var subPath = tags.slice(0, i + 1);
            subPath = subPath.join(">");
            paths.push(subPath);
          }

          this.domPathsToKeep = _.union(this.domPathsToKeep, paths);
        }
      }, this);
    },

    reloadInjecting: function () {
      UnravelAgent.reloadInjecting();
    }
  });
});