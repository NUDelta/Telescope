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

        getNodes: function () {
          if (!this.nodeArr) {
            this.nodesHandle = window.__tracer.trackNodes();
            this.nodeArr = window.__tracer.newNodes(this.nodesHandle);
          }

          return this.nodeArr;
        },

        startTracking: function () {
          var nodeArr = this.getNodes();
          this.startTrackInterval(nodeArr);
        },

        resetTracer: function () {
          window.__tracer.resetTrace();
          this.logHandle = window.__tracer.trackLogs({ids: this.ids});
          this.resetInvokeCounts();
        },

        resetInvokeCounts: function () {
          unravelAgent._(this.nodeArr).each(function (node) {
            if (node.invokeCountTowardsMax) {
              node.invokeCountTowardsMax = 0;
            }
          });
        },

        startTrackInterval: function (nodeArr) {
          var domReady = !!unravelAgent.$("body").length;

          if (!domReady) {
            setTimeout(unravelAgent._.bind(function () {
              this.startTrackInterval(nodeArr);
            }, this), 100);
          }

          var _nodeArr = unravelAgent._(nodeArr);
          var nodeMap = {};
          _nodeArr.each(function (node) {
            nodeMap[node.id] = node;
          });
          this.ids = _nodeArr.pluck("id");
          this.nodeMap = nodeMap;
          if (!_nodeArr || _nodeArr.length < 1) {
            return;
          }

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

        //Todo keep in sync with activeNodeModel
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
              return true;
            }
          });
        },

        emitNodeActivity: function () {
          try {
            //Get the last n javascript calls logged
            var arrInvocations = window.__tracer.logDelta(this.logHandle, FondueBridge.MAX_LOG_COUNT);
            if (arrInvocations.length < 1) {
              return;
            }

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
              var isDomQuery = this.isDomQueryNode(node);

              var underMaxInvokes = true;
              if (!isDomQuery) {
                if (node.invokeCountTowardsMax) {
                  node.invokeCountTowardsMax++;
                } else {
                  node.invokeCountTowardsMax = 1;
                }

                underMaxInvokes = node.invokeCountTowardsMax < FondueBridge.MAX_INVOKE_LOG_COUNT;
              }

              if (isDomQuery || underMaxInvokes) {
                invocation.callStack = unravelAgent._(__tracer.backtrace({
                  invocationId: invocation.invocationId,
                  range: [0, FondueBridge.MAX_STACK_DEPTH]
                })).reverse();

                //Remove the last item on the stack, === the invocation
                if (invocation.callStack.length > 0) {
                  invocation.callStack.pop();
                }

                //Add the node name to each call in the callstack
                unravelAgent._(invocation.callStack).each(function (call) {
                  var node = this.nodeMap[call.nodeId];
                  call.nodeName = node && node.name ? node.name : "";
                }, this);
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