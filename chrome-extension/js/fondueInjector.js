define([], function () {
  return function () {
    var FondueBridge = function () {
    };

    FondueBridge.MAX_LOG_COUNT = 2000;
    FondueBridge.MAX_STACK_DEPTH = 20;

    FondueBridge.prototype = {
      constructor: FondueBridge,

      startTracking: function () {
        window.__tracer.resetTrace();
        this.hitsHandle = null;
        this.logHandle = null;
        this._nodeArr = null;

        //Track Hits
        if (!this.hitsHandle) {
          this.hitsHandle = window.__tracer.trackHits();
        }
        window.__tracer.hitCountDeltas(this.hitsHandle); //Reset the deltas counter

        //Gather Nodes
        if (!this._nodeArr) {
          var nodesHandle = window.__tracer.trackNodes();
          this._nodeArr = unravelAgent._(window.__tracer.newNodes(nodesHandle));
        }

        //Track Logs
        if (!this.logHandle) {
          var ids = this._nodeArr.pluck("id");
          this.logHandle = window.__tracer.trackLogs({ids: ids});
        }
      },

      getNodeActivity: function () {
        try {
          //Get the last n javascript calls logged
          var _tracerInvocations = unravelAgent._(window.__tracer.logDelta(this.logHandle, FondueBridge.MAX_LOG_COUNT));

          //For each one, get its callStack, up to 10 deep
          _tracerInvocations.each(function (invocation) {
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
              var node = this._nodeArr.find(function (node) {
                return node.id === call.nodeId;
              });

              call.nodeName = node && node.name ? node.name : "";
            }, this);

            //Give this invocation a nodename too
            var node = this._nodeArr.find(function (node) {
              return node.id === invocation.nodeId;
            });
            invocation.nodeName = node && node.name ? node.name : "";
          }, this);

          //Create hash for efficient lookups
          var nodeInvocations = _tracerInvocations.reduce(function (memo, invoke) {
            if (memo[invoke.nodeId]) {
              memo[invoke.nodeId].push(invoke);
            } else {
              memo[invoke.nodeId] = [invoke];
            }
            return memo;
          }, {});

          //Populate a node DTO with everything we need all at once
          var nodeHits = window.__tracer.hitCountDeltas(this.hitsHandle);
          return this._nodeArr.map(function (node) {
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
              hits: nodeHits[node.id] || 0,  //hitCount
              invokes: nodeInvocations[node.id] || []
            };
          });
        } catch (err) {
          debugger;
        }
      }
    };

    window.unravelAgent.fondueBridge = new FondueBridge();
  };
});