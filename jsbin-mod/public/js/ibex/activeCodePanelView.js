def([
  "jquery",
  "backbone",
  "underscore"
], function ($, Backbone, _) {
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

  return Backbone.View.extend({
    panelHeight: 90,

    initialize: function () {
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
    },

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
      _(this.fondue.scripts).chain()
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
  });
});