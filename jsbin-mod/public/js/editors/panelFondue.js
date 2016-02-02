var createFonduePanel = function () {
  var panelTemplate =
    '<div class="fondue-panel"> ' +
    ' <div class="group-wrap"> ' +
    '   <ul id="fondue-toggle-group">' +
    '     <li>  ' +
    '       <img id="hider-spinner" src="/images/spinner.gif" style="height:12px; display:none;"> ' +
    '       <input type="checkbox" id="fondue-toggle-inactive"/> Hide Inactive Code ' +
    '     </li>' +
    '   </ul> ' +
    ' </div>' +
    '</div>';

  var fileToggleTemplate =
    '<li>  ' +
    '  <input type="checkbox" id="fondue-toggle-inactive" data="_path_"/> Hide _fileLink_ _headBody_' +
    '</li>';

  var filePathTemplate =
    '<a href="javascript:;" class="fondue-file-link" data="_lineNo_">_path_</a>';

  var fondueMasterToggleTemplate =
    '<a role="button" id="fonduePanelToggle" class="button group" href="javascript:;" aria-label="FondueMaster">Tracing</a>';

  var FonduePanelView = function (fondue) {
    this.$el = $(panelTemplate);
    this.$masterToggle = $(fondueMasterToggleTemplate);
    this.on = this.$el.on.bind(this.$el);
    this.render = _.bind(this.render, this);
    this.toggleInactive = _.bind(this.toggleInactive, this);
    this.toggleFile = _.bind(this.toggleFile, this);
    this.openClose = _.bind(this.openClose, this);
    this.fondue = fondue;
    this.$el.find("#fondue-toggle-inactive").on("click", this.toggleInactive);
    this.$binControl = $("#control");
    this.controlHeightStart = this.$binControl.height();
    this.$mirrorWrap = $(".CodeMirror-scroll");
    this.mirrorWrapStart = this.$mirrorWrap.css("height");
    this.$bin = $("#bin");
    this.binTopStart = parseInt(this.$bin.css("top"));
  };

  FonduePanelView.prototype = {
    panelHeight: 90,

    render: function () {
      var $panel = $("#panels");

      if (this.$binControl.find(".fondue-panel").length < 1) {
        this.$binControl.append(this.$el);
        this.$el.css("height", this.panelHeight + "px");
      }
      if ($panel.find("#fonduePanelToggle").length < 1) {
        $panel.append(this.$masterToggle);
        this.$masterToggle.on("click", this.openClose);
      }

      this.makeToggles();
    },

    openClose: function () {
      var subtractHeight;

      if (this.$binControl.height() < this.controlHeightStart) {
        subtractHeight = 0;
      } else {
        subtractHeight = this.panelHeight;
      }
      this.$bin.animate({top: this.binTopStart - subtractHeight}, {duration: 50, queue: false}, false);
      this.$mirrorWrap.animate({height: this.mirrorWrapStart - subtractHeight}, {duration: 50, queue: false}, false);
      this.$binControl.animate({height: this.controlHeightStart - subtractHeight}, {duration: 200, queue: false}, true);
    },

    makeToggles: function () {
      _(this.fondue.scripts)
        .reject("builtIn")
        .sortBy("order")
        .sortBy(function (scriptObj) {
          if (scriptObj.domPath.indexOf("body") === -1) {
            return 0;
          } else {
            return 1;
          }
        })
        .each(function (script) {
          var path = script.path;
          var headBody = "";
          if (script.domPath.indexOf("body") === -1) {
            headBody = "(head)"
          } else {
            headBody = "(body)"
          }
          var fileLink = filePathTemplate.replace("_path_", path).replace("_lineNo_", script.binStartLine);
          var $fileToggle = $(fileToggleTemplate.replace("_path_", path).replace("_fileLink_", fileLink).replace("_headBody_", headBody));
          $fileToggle.find("input").on("click", this.toggleFile);
          this.$el.find("#fondue-toggle-group").append($fileToggle);
        }, this);

      $(".fondue-file-link").click(function (e) {
        var lineNo = $(e.currentTarget).attr("data");
        var margin = $(window).height() / 2;
        var line = parseInt(lineNo) + 1;
        fondueMirror.scrollIntoView({line: line, ch: 0}, margin);
        fondueMirror.setCursor({line: line});
      });
    },

    toggleFile: function (e) {
      var $toggle = $(e.currentTarget);
      var path = $toggle.attr("data");
      if ($toggle.is(':checked')) {
        this.hideFile(path);
      } else {
        this.showFile(path);
      }
    },

    toggleInactive: function (e) {
      var $el = $(e.currentTarget);
      if ($el.is(':checked')) {
        this.hideInactive();
      } else {
        this.showInactive();
      }
    },

    showFile: function (path) {
      var markers = fondue.fileHideMarks[path];
      if (markers) {
        this.showSmart(markers, fondue.fileHideLines[path]);
      }
      fondue.fileHideLines[path] = [];
      fondue.fileHideMarks[path] = [];

      if (fondue.activeLineHideMarks.length > 0) {
        this.showInactive();
        this.hideInactive();
      }
    },

    showInactive: function () {
      var allLines = _.range(0, fondueMirror.lineCount());
      var inactiveLines = _.difference(allLines, fondue.activeLines);

      this.showSmart(fondue.activeLineHideMarks, inactiveLines);
      fondue.activeLineHideMarks = [];
    },

    hideFile: function (path) {
      var script = _(window.fondue.scripts).find(function (script) {
        return script.path === path;
      });

      var startLine = script.binStartLine;
      var endLine = script.binEndLine;

      var reHide = false;
      if (fondue.activeLineHideMarks.length > 0) {
        this.showInactive();
        reHide = true;
      }

      fondue.fileHideMarks[path] = [];
      this.hideSmart(startLine, endLine, fondue.fileHideMarks[path]);
      fondue.fileHideLines[path] = _.range(startLine, endLine + 1);

      if (reHide) {
        this.hideInactive();
      }
    },

    hideInactive: function () {
      this.hideSmart(0, fondueMirror.lineCount() - 1, fondue.activeLineHideMarks, fondue.activeLines);
    },

    showSmart: function (markerArr, linesToRemoveFromAllHidden) {
      _(markerArr).each(function (marker) {
        marker.clear();
      });

      fondue.allHiddenLines = _.difference(fondue.allHiddenLines, linesToRemoveFromAllHidden);
    },

    hideSmart: function (startLine, endLine, markerArr, additonalLinesToKeepShown) {
      var preHiddenLines = fondue.allHiddenLines.concat(additonalLinesToKeepShown || []);
      preHiddenLines = preHiddenLines.concat(_(fondue.fileHideLines).values().flatten().value());

      //preHiddenLines = _.reject(preHiddenLines, function (lineNumber) {
      //  return lineNumber < startLine || lineNumber > endLine;
      //});

      if (preHiddenLines.length < 1) {
        markerArr.push(window.fondueMirror.markText({
          line: startLine
        }, {
          line: endLine
        }, {collapsed: true}));
        fondue.allHiddenLines = fondue.allHiddenLines.concat(_.range(startLine, endLine + 1));
      } else {
        var ranges = [];
        var _preHiddenLines = _(preHiddenLines).sortBy(function (i) {
          return i;
        }).uniq();
        var lastLine = null;
        for (var i = startLine; i <= endLine; i++) {
          if (i === endLine && lastLine !== null) {
            if (_preHiddenLines.contains(i)) {
              ranges.push([lastLine, i - 1]);
            } else {
              ranges.push([lastLine, i]);
            }
          } else if (i === endLine && lastLine === null) {
            ranges.push([endLine, endLine]);
          } else if (_preHiddenLines.contains(i)) {
            if (lastLine !== null) {
              ranges.push([lastLine, i - 1]);
              lastLine = null;
            }
          } else {
            if (lastLine === null) {
              lastLine = i;
            }
          }
        }

        _(ranges).each(function (range) {
          markerArr.push(window.fondueMirror.markText({
            line: range[0]
          }, {
            line: range[1]
          }, {collapsed: true}));

          fondue.allHiddenLines = fondue.allHiddenLines.concat(_.range(range[0], range[1] + 1));
        }, this);
      }
    }
  };

  var panelView = new FonduePanelView(fondue);
  panelView.render();
};

var annotateSourceTraces = function () {
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

  fondueMirror.setOption("lineNumbers", true);

  _(fondue.traces).each(function (trace) {
    var script = _(fondue.scripts).find(function (scriptObj) {
      return scriptObj.path === trace.path;
    });

    var lineOffset = script.binStartLine;

    var startLine = lineOffset + parseInt(trace.startLine);
    var endLine = lineOffset + parseInt(trace.endLine);
    var marker = fondueMirror.markText(
      {
        line: startLine,
        ch: parseInt(trace.startColumn)
      },
      {
        line: endLine,
        ch: parseInt(trace.endColumn)
      },
      {
        css: "background-color:#fffcbd"
      }
    );

    var addedActiveLines = _.range(startLine, endLine + 1);
    marker.activeLines = addedActiveLines;
    fondue.activeLineColorMarks.push(marker);
    fondue.activeLines = fondue.activeLines.concat(addedActiveLines);

    if (trace.type === "function") {
      var pill = new PillView(fondueMirror, startLine, trace);
      pill.setCount(trace.hits);
      pill.on("click", function (e) {
        if (!pill.$activeLine) {
          pill.$activeLine = $(e.currentTarget).parent().parent().parent();
          pill.$expander = $('<div class="expander-node"></div>');
          pill.$invokeNode = $('<div class="invoke-node"></div>');
          pill.$activeLine.prepend(pill.$invokeNode);
          pill.$activeLine.prepend(pill.$expander);

          if (trace.invokes) {
            _(trace.invokes).each(function (invocation, i) {
              if (invocation.callStack) {

                var invokeHTML = invocationTemplate.replace("_callNum_", "Call " + (i + 1));
                var $invokeRow = $(invokeHTML);

                _(invocation.callStack).each(function (callInvoke, j) {

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

                  var script = _.find(fondue.scripts, function (script) {
                    return script.path === path;
                  });

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
                        var $pre = $(preTemplate).append(stringifyObjToHTML(arg.value.ownProperties));
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
                  });

                  $invokeRow.append($callRow);
                }, this);

                pill.$invokeNode.append($invokeRow);
                setTimeout(function () {
                  _(pill.$invokeNode.find(".fondue-object-toggle")).each(function (el) {
                    $(el).trigger("click");  //Start the toggles closed
                  });
                }, 100);

                pill.$invokeNode.find(".fondue-call-link").click(function (e) {
                  var lineNo = $(e.currentTarget).attr("dataLine");
                  var colNo = $(e.currentTarget).attr("dataCol");
                  var margin = $(window).height() / 2;
                  lineNo = parseInt(lineNo);
                  colNo = parseInt(colNo);
                  fondueMirror.scrollIntoView({line: lineNo, ch: colNo}, margin);
                  fondueMirror.setCursor({line: lineNo});
                });
              } else {
                debugger;
                pill.$invokeNode.append(calledByTemplate.replace("_calledby_", "(No caller captured)"));
                _(invocation.arguments).each(function (arg) {
                  var argValue = arg.value.value;
                  if (argValue === undefined) {
                    argValue = "undefined";
                  } else if (argValue === null) {
                    argValue = "null"
                  } else if (argValue && argValue.trim().length < 1) {
                    argValue = "\"" + argValue + "\"";
                  } else {
                    argValue = JSON.stringify(argValue);
                  }

                  pill.$invokeNode.find(".fondue-args-list").append(argTemplate.replace("_arg_", arg.name).replace("_val_", argValue));
                });
              }
            });
          }
        }

        if (pill.expanded) {
          pill.$invokeNode.animate({
            height: 0
          }, 200);
          pill.$expander.animate({
            height: 0
          }, 200);
          pill.expanded = false;
        } else {
          pill.$invokeNode.animate({
            height: 200
          }, 200);
          pill.$expander.animate({
            height: 200
          }, 200);
          pill.expanded = true;
        }
      });
    }
  });
};

function PillView(codeMirror, line) {
  this.$el = $("<span class='theseus-call-count none'><span class='counts'>0 calls</span></span>");
  codeMirror.setGutterMarker(line, "pill-gutter", this.$el[0]);
  this.on = this.$el.on.bind(this.$el);
}
PillView.prototype = {
  setCount: function (count) {
    var html = count + " call" + (count === 1 ? "" : "s");
    this.$el.find(".counts").html(html);
    this.$el.toggleClass("none", count === 0);
  },
  setActive: function (isActive) {
    this._active = isActive;
    this.$el.toggleClass("active", isActive);
  },
  toggle: function () {
    this.setActive(!this._active);
  },
};

function stringifyObjToHTML(obj) {
  var json = JSON.stringify(obj, null, 2);

  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    var cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}