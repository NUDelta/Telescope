def([
  "GutterPillView",
  "ActiveCodePanelView",
  "CodeMirrorJSView",
  "SourceCollection",
  "ActiveNodeCollection"
], function (GutterPillView, ActiveCodePanelView, CodeMirrorJSView, SourceCollection, ActiveNodeCollection) {
  return function (editor) {
    var codeMirror = editor.editor;

    var fondue = JSON.parse(template.fondue);

    var activeNodeCollection = new ActiveNodeCollection(fondue.traces);
    var sourceCollection = new SourceCollection(null, {
      scripts: fondue.scripts,
      activeNodeCollection: activeNodeCollection
    });


    var codeMirrorJSView = new CodeMirrorJSView(codeMirror, sourceCollection, activeNodeCollection);
    codeMirrorJSView.showSources();

    var activeCodePanelView = new ActiveCodePanelView(sourceCollection, codeMirrorJSView);
    activeCodePanelView.render();
  };
});