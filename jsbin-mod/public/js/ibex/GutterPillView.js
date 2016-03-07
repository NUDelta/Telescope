def([
  "jquery",
  "backbone",
  "underscore",
  "util"
], function ($, Backbone, _, util) {
  var invocationTemplate =
    '<div class="fondue-invocation-row">' +
    '  <div class="fondue-call-header">_callNum_</div>' +
    '</div>';

  var calledByTemplate =
    '<div class="fondue-call-row"> ' +
    ' <div class="fondue-called-by">' +
    '   <div>_calledby_</div>' +
    ' </div> ' +
    ' <div class="fondue-called-args-wrap"> ' +
    '   <div class="fondue-called-args"> ' +
    '     <ul class="fondue-args-list"> ' +
    '     </ul> ' +
    '   </div> ' +
    ' </div> ' +
    '</div>';

  var argTemplate = '' +
    '<li class="fondue-args-list-item"> ' +
    ' <div class="fondue-arg">_arg_</div>' +
    ' <div style="float:left;">&nbsp;=&nbsp;</div> ' +
    ' <div class="fondue-val">_val_</div> ' +
    '</li> ';

  var preTemplate = '<pre class="fondue-pre"><a href="javascript:;" class="fondue-object-toggle">(-)</a></pre>';

  return Backbone.View.extend({
    el: "<span class='theseus-call-count none'><span class='counts'></span></span>",

    events: {
      "click": "expandTrace"
    },

    initialize: function (codeMirror, line, traces, sourceCollection) {
      this.sourceCollection = sourceCollection;
      this.line = line;
      this.mirror = codeMirror;

      codeMirror.setGutterMarker(line, "pill-gutter", this.$el[0]);

      if (traces.length) {
        this.traces = traces;
      } else {
        this.trace = traces;
      }

      this.setDomModifier();
    },

    destroy: function () {
      this.mirror.setGutterMarker(this.line, null, null);
      this.remove();
    },

    setCount: function (count) {
      var txt = " call" + (count === 1 ? "" : "s");
      if (this.traces) {
        txt = count === 1 ? " query" : " queries";
      }

      var html = count + txt;
      this.$el.find(".counts").html(html);
      this.$el.toggleClass("none", count === 0);
    },

    setDomModifier: function () {
      if (this.trace && this.trace.relatedDomModifier) {
        this.$el.attr("style", "background-color: yellow !important;");
      }
    },

    setActive: function (isActive) {
      this._active = isActive;
      this.$el.toggleClass("active", isActive);
    },
    toggle: function () {
      this.setActive(!this._active);
    },

    htmlGutterHandle: function (e) {
      this.trigger("", this);
    },

    expandTrace: function (e) {
      if (!this.$activeLine && !this.traces) {
        this.$activeLine = $(e.currentTarget).parent().parent().parent();
        this.$expander = $('<div class="expander-node"></div>');
        this.$invokeNode = $('<div class="invoke-node"></div>');
        this.$activeLine.prepend(this.$invokeNode);
        this.$activeLine.prepend(this.$expander);

        if (this.trace.invokes) {
          _(this.trace.invokes).each(function (invocation, i) {
            var callStack = invocation.callStack || [];
            callStack.push(invocation);

            var invokeHTML = invocationTemplate.replace("_callNum_", "Call " + (i + 1));
            var $invokeRow = $(invokeHTML);

            _(callStack).each(function (callInvoke) {

              var idArr = callInvoke.nodeId.split("-");
              var idArrRev = _(idArr).clone().reverse();

              if (idArr.length < 5) {
                return;
              }

              var path = idArr.slice(0, -5).join("-");
              var type = idArrRev[4];
              var startLine = idArrRev[3];
              var startColumn = idArrRev[2];
              //var endLine = idArrRev[1];
              //var endColumn = idArrRev[0];

              var filePathTemplate =
                '<a href="javascript:;" class="fondue-call-link" dataLine="_lineNo_" dataCol="_colNo_">_path_</a>';

              var scriptModel = this.sourceCollection.find(function (scriptModel) {
                return scriptModel.get("path") === path;
              });
              var script = scriptModel.toJSON();

              var mirrorLine = script.binStartLine + parseInt(startLine);

              filePathTemplate = filePathTemplate.replace("_lineNo_", mirrorLine);
              filePathTemplate = filePathTemplate.replace("_colNo_", startColumn);
              filePathTemplate = filePathTemplate.replace("_path_", path + ":" + startLine + ":" + startColumn);

              var name = callInvoke.nodeName ? type + " <span class='call-name'>" + callInvoke.nodeName + "</span>" : type;
              var $callRow = $(calledByTemplate.replace("_calledby_", name + " at <span class='call-path'>" + filePathTemplate + "</span>"));

              _(callInvoke.arguments).each(function (arg, i) {
                var argValue;

                if (arg.value && arg.value.preview) {
                  if (arg.value.ownProperties) {
                    var $pre = $(preTemplate).append(util.stringifyObjToHTML(arg.value.ownProperties));
                    argValue = $pre[0].outerHTML;
                  } else {
                    argValue = arg.value.preview;
                  }
                } else if (arg.value.value === undefined) {
                  argValue = "undefined";
                } else if (arg.value.value === null) {
                  argValue = "null"
                } else if (arg.value.value && arg.value.value.trim().length < 1) {
                  argValue = "\"" + arg.value.value + "\"";
                } else {
                  argValue = JSON.stringify(arg.value.value);
                }

                if (!arg.name) {
                  arg.name = "arguments[" + i + "]";
                }

                $callRow.find(".fondue-args-list").append(argTemplate.replace("_arg_", arg.name).replace("_val_", argValue));

                var objToggle = $callRow.find(".fondue-object-toggle");
                if (objToggle.length > 0) {
                  $(objToggle).click(function (e) {
                    var $target = $(e.currentTarget);
                    var $parent = $($target.parent());
                    if ($parent.height() > 16) {
                      $parent.attr("data", $parent.height());
                      $parent.animate({height: 16}, 200);
                      $target.text("(+)")
                    } else {
                      $parent.animate({height: $parent.attr("data")});
                      $target.text("(-)")
                    }
                  });
                }
              }, this);

              $invokeRow.append($callRow);
            }, this);

            this.$invokeNode.append($invokeRow);
            var that = this;
            setTimeout(function () {
              _(that.$invokeNode.find(".fondue-object-toggle")).each(function (el) {
                $(el).trigger("click");  //Start the toggles closed
              });
            }, 100);

            this.$invokeNode.find(".fondue-call-link").click(function (e) {
              var lineNo = $(e.currentTarget).attr("dataLine");
              var colNo = $(e.currentTarget).attr("dataCol");
              var margin = $(window).height() / 2;
              lineNo = parseInt(lineNo);
              colNo = parseInt(colNo);
              //fondueMirror.scrollIntoView({line: lineNo, ch: colNo}, margin);
              //fondueMirror.setCursor({line: lineNo});
            }, this);
          }, this);
        }
      }

      var expandCallback = _.bind(function () {
        this.trigger("pill:expand", this);
      }, this);

      if (this.expanded) {
        this.trigger("pill:collapse", this);
        this.expanded = false;

        if (this.traces) {
          return;
        }

        this.$invokeNode.animate({
          height: 0
        }, 200);
        this.$expander.animate({
          height: 0
        }, 200);
      } else {
        this.expanded = true;

        if (this.traces) {
          expandCallback();
          return;
        }

        this.$invokeNode.animate({
          height: 200
        }, 200, expandCallback);
        this.$expander.animate({
          height: 200
        }, 200);
      }
    }
  });
});