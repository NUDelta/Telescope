var annotateSourceTraces = function () {

  req([
    "GutterPillView",
    "util"
  ], function (GutterPillView, util) {
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
  });


};
