def([
  "GutterPillView",
  "ActiveCodePanelView",
  "CodeMirrorJSView",
  "SourceCollection",
  "TraceCollection"
], function (GutterPillView, ActiveCodePanelView, CodeMirrorJSView, SourceCollection, TraceCollection) {
  return function (editor) {
    var codeMirror = editor.editor;

    var fondue = JSON.parse(template.fondue);

    var traceCollection = new TraceCollection(fondue.traces);
    var sourceCollection = new SourceCollection(null, {
      scripts: fondue.scripts,
      traceCollection: traceCollection
    });

    var codeMirrorJSView = new CodeMirrorJSView(codeMirror, sourceCollection);
    codeMirrorJSView.showSources();

    var activeCodePanelView = new ActiveCodePanelView(sourceCollection, codeMirrorJSView);
    activeCodePanelView.render();
  };
});