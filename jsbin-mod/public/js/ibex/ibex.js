def([
  "GutterPillView",
  "ActiveCodePanelView",
  "util"
], function (GutterPillView, ActiveCodePanelView, util) {
  return function (editor) {
    var codeMirror = editor.editor;

    var fondue = JSON.parse(template.fondue);

    var sourceHeader = "// Don't remove this line: Begin Source File: ";
    var sourceFooter = "// Don't remove this line: End Source File: ";

    fondue.scripts = _(fondue.scripts).sortBy(function (script) {
      return script.order;
    }).reject("builtIn").value();

    var extractedHeadJS = _(fondue.scripts).reduce(function (memo, scriptObj) {
      if (scriptObj.domPath.indexOf("body") > -1) {
        return memo;
      }

      var startJS = sourceHeader + scriptObj.path + "\n";
      var endJS = sourceFooter + scriptObj.path + "\n\n\n";
      memo += startJS + scriptObj.js + endJS;
      return memo;
    }, "");

    var extractedBodyJS = _(fondue.scripts).reduce(function (memo, scriptObj) {
      if (scriptObj.domPath.indexOf("body") === -1) {
        return memo;
      }

      var startJS = sourceHeader + scriptObj.path + "\n";
      var endJS = sourceFooter + scriptObj.path + "\n\n\n";

      memo += startJS + scriptObj.js + endJS;
      return memo;
    }, "");

    if (extractedBodyJS) {
      extractedBodyJS = "//Begin DOM Ready Section\n" +
        "document.onreadystatechange = function () {\n" +
        "if (document.readyState == 'complete') {\n" +
        extractedBodyJS +
        "}}; //End DOM Ready Section\n";
    }

    codeMirror.setCode(extractedHeadJS + extractedBodyJS);

    var scriptObj;
    codeMirror.eachLine(function (line) {
      var arr = line.text.split(sourceHeader);
      if (arr.length > 1) {
        scriptObj = _(fondue.scripts).find(function (script) {
          if (script.path === arr[1]) {
            return true;
          }
        });

        if (scriptObj) {
          scriptObj.binStartLine = line.lineNo();
        }
      }

      arr = line.text.split(sourceFooter);
      if (arr.length > 1) {
        scriptObj = _(fondue.scripts).find(function (script) {
          if (script.path === arr[1]) {
            return true;
          }
        });

        if (scriptObj) {
          scriptObj.binEndLine = line.lineNo() - 1;
        }
      }
    });

    window.fondueMirror = codeMirror;
    window.fondue = fondue;

    fondue.activeLineColorMarks = [];
    fondue.activeLineHideMarks = [];
    fondue.activeLines = [];
    fondue.fileHideLines = {};
    fondue.fileHideMarks = {};
    fondue.allHiddenLines = [];


    var activeCodePanelView = new ActiveCodePanelView();
    activeCodePanelView.render();

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
        var pill = new GutterPillView(fondueMirror, startLine, trace);
        pill.setCount(trace.hits);
      }
    });

    window.setTimeout(function () {
      fondueMirror.scrollTo({line: 0, ch: 0});
      fondueMirror.setCursor({line: 0})
    }, 1)

  };
});