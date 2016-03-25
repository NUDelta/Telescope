define([], function () {
    return function () {
      var FondueBridge = function () {
      };

      FondueBridge.MAX_LOG_COUNT = 1000;
      FondueBridge.MAX_STACK_DEPTH = 20;
      FondueBridge.EMIT_INTERVAL_MILLIS = 1000;
      FondueBridge.MAX_INVOKE_LOG_COUNT = 4;

      FondueBridge.prototype = {
        constructor: FondueBridge,

        initialize: function () {
          this.updateTrackedNodes = unravelAgent._.bind(this.updateTrackedNodes, this);
          this.startTracking = unravelAgent._.bind(this.startTracking, this);
          this.getNodes = unravelAgent._.bind(this.getNodes, this);
          this.resetTracer = unravelAgent._.bind(this.resetTracer, this);
          this.startTrackInterval = unravelAgent._.bind(this.startTrackInterval, this);
          this.getNewNodes = unravelAgent._.bind(this.getNewNodes, this);
        },

        getNodes: function () {
          return unravelAgent._(this.nodeMap).values();
        },

        getNewNodes: function () {
          // if (!this.nodesHandle) {
          //   debugger;
          //   this.nodesHandle = window.__tracer.trackNodes();
          // }

          return window.__tracer.newNodes(window.__tracer.trackNodes());
        },

        startTracking: function () {
          console.log("FondueInjector: startTracking()");
          this.startTrackInterval();
        },

        resetTracer: function () {
          window.__tracer.resetTrace();
          this.logHandle = window.__tracer.trackLogs({ids: this.ids});
        },

        updateTrackedNodes: function () {
          console.log("FondueInjector: updateTrackedNodes()");

          var newNodes = this.getNewNodes();
          if (!newNodes || !newNodes.length) {
            return;
          }
          var _nodeArr = unravelAgent._(newNodes);
          this.nodeMap = this.nodeMap || {};
          _nodeArr.each(function (node) {
            if (!this.nodeMap[node.id]) {
              this.nodeMap[node.id] = node;
            }
          }, this);
          this.ids = unravelAgent._(this.nodeMap).keys();
          this.logHandle = window.__tracer.trackLogs({ids: this.ids});
        },

        startTrackInterval: function () {
          this.updateTrackedNodes();
          if (!this.ids || this.ids.length < 1) {
            console.log("fondueInjector: startTrackInterval: no nodes yet.");
            setTimeout(unravelAgent._.bind(function () {
              this.startTrackInterval();
            }, this), 100);
          }

          console.log("fondueInjector: startTrackInterval: got nodes!");
          this.resetTracer();
          if (this.interval) {
            window.clearInterval(this.interval);
          }

          this.interval = setInterval(unravelAgent._.bind(function () {
            this.emitNodeActivity();
          }, this), FondueBridge.EMIT_INTERVAL_MILLIS);
        },

        emitNodeList: function () {
          var nodeArr = this.getNodes();

          var nodes = unravelAgent._(nodeArr).map(function (node) {
            return {
              id: node.id,
              type: node.type,
              name: node.name,
              path: node.path,
              params: node.params,
              parentId: node.parentId,
              startLine: node.start.line,
              startColumn: node.start.column,
              endLine: node.end.line,
              endColumn: node.end.column,
              childrenIds: node.childrenIds,
              hits: 0,
              invokes: []
            };
          });

          window.dispatchEvent(new CustomEvent("fondueDTO", {
            detail: {
              eventStr: "fondueDTO:newNodeList",
              obj: {nodes: nodes}
            }
          }));
        },

        //keep in sync with activeNodeModel
        _domFnNames: unravelAgent._([
          "getElementsByTagName",
          "getElementsByTagNameNS",
          "getElementsByClassName",
          "getElementsByName",
          "getElementById",
          "querySelector",
          //"createElement",
          "querySelectorAll"
        ]),

        isDomQueryNode: function (node) {
          if (!node.name) {
            return false;
          }

          return !!this._domFnNames.find(function (fnName) {
            if (node.name.indexOf(fnName) > -1) {
              node.domQuery = true;
              return true;
            }
          });
        },

        emitNodeActivity: function () {
          try {
            //Get the last n javascript calls logged
            var arrInvocations = window.__tracer.logDelta(this.logHandle, FondueBridge.MAX_LOG_COUNT);
            if (arrInvocations.length < 1) {
              console.log("emitNodeActivity:no invocations")
              return;
            }
            console.log("emitNodeActivity:", arrInvocations.length, "invocations!")

            var _arrInvocations = unravelAgent._(arrInvocations);

            //For each one, get its callStack, up to 10 deep
            _arrInvocations.each(function (invocation) {
              //Give this invocation a nodename too
              var node = this.nodeMap[invocation.nodeId];
              if (!node.startLine) {
                node.startLine = node.start.line;
                node.startColumn = node.start.column;
                node.endLine = node.end.line;
                node.endColumn = node.end.column;
              }

              invocation.node = node;
              if (node.domQuery || this.isDomQueryNode(node)) {
                invocation.callStack = unravelAgent._(__tracer.backtrace({
                  invocationId: invocation.invocationId,
                  range: [0, FondueBridge.MAX_STACK_DEPTH]
                })).reverse();

                //Remove the last item on the stack, === the invocation
                if (invocation.callStack.length > 0) {
                  invocation.callStack.pop();
                }
              } else {
                invocation.callStack = [];
              }
            }, this);

            window.dispatchEvent(new CustomEvent("fondueDTO", {
                detail: {
                  eventStr: "fondueDTO:arrInvocations",
                  obj: {invocations: _arrInvocations.value()}
                }
              })
            );
          } catch (err) {
            console.warn("Err on dispatching invocations.")
          }
        }
      };

      window.unravelAgent.fondueBridge = new FondueBridge();
    }
  }
);