define([], function () {
  return function () {
    var FondueBridge = function () {
    };

    FondueBridge.MAX_LOG_COUNT = 2000;
    FondueBridge.MAX_STACK_DEPTH = 20;

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

      startTrackInterval: function (nodeArr) {
        var domReady = !!unravelAgent.$("body").length;

        if (!domReady) {
          setTimeout(unravelAgent._.bind(function () {
            this.startTrackInterval(nodeArr);
          }, this), 100);
        }

        window.__tracer.resetTrace();
        var hitsHandle = window.__tracer.trackHits();
        var _nodeArr = unravelAgent._(nodeArr);
        var nodeMap = {};
        _nodeArr.each(function (node) {
          nodeMap[node.id] = node;
        });
        var ids = _nodeArr.pluck("id");
        var logHandle = window.__tracer.trackLogs({ids: ids});
        this.emitNodeList(_nodeArr);

        var interval = setInterval(unravelAgent._.bind(function () {
          if (!_nodeArr || _nodeArr.length < 1) {
            return;
          }

          var nodeHits = window.__tracer.hitCountDeltas(hitsHandle); //Reset the deltas counter
          if (Object.keys(nodeHits).length < 1) {
            return;
          }

          this.emitNodeActivity(logHandle, nodeMap, nodeHits);
        }, this), 100);
      },

      emitNodeList: function (_nodeArr) {
        if (_nodeArr.length < 1) {
          return;
        }

        var nodes = _nodeArr.map(function (node) {
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
            //hits: nodeHits[node.id] || 0,  //hitCount
            //invokes: nodeInvocations[node.id] || []
          };
        });

        //window.dispatchEvent(new CustomEvent("fondueDTO", {
        //    detail: {
        //      eventStr: "fondueDTO:nodes",
        //      obj: {nodes: nodes}
        //    }
        //  })
        //);
      },

      emitNodeActivity: function (logHandle, nodeMap, nodeHits) {
        try {
          //Get the last n javascript calls logged
          var _arrInvocations = unravelAgent._(window.__tracer.logDelta(logHandle, FondueBridge.MAX_LOG_COUNT));
          var activeNodeArr = [];
          var _activeNodeArr = unravelAgent._(activeNodeArr);

          //For each one, get its callStack, up to 10 deep
          _arrInvocations.each(function (invocation) {
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
              var node = nodeMap[call.nodeId];
              call.nodeName = node && node.name ? node.name : "";
            }, this);

            //Give this invocation a nodename too
            var node = nodeMap[invocation.nodeId];
            invocation.nodeName = node && node.name ? node.name : "";

            if (!node.startLine) {
              node.startLine = node.start.line;
              node.startColumn = node.start.column;
              node.endLine = node.end.line;
              node.endColumn = node.end.column;
            }

            if (node.hits !== undefined) {
              node.hits += (nodeHits[node.id] || 1);
            } else {
              node.hits = 1;
            }

            if (node.invokes) {
              node.invokes.push(invocation);
            } else {
              node.invokes = [invocation];
            }

            var inArr = _activeNodeArr.find(function (node) {
              return node.id === invocation.nodeId;
            });
            if (!inArr) {
              activeNodeArr.push(node);
            }
          }, this);

          window.dispatchEvent(new CustomEvent("fondueDTO", {
              detail: {
                eventStr: "fondueDTO:arrInvocations",
                obj: {invocations: activeNodeArr}
              }
            })
          );
        } catch (err) {
          debugger;
        }
      }
    };

    window.unravelAgent.fondueBridge = new FondueBridge();
  };
});