define([
  "backbone",
  "underscore"
], function (Backbone, _) {
  return Backbone.Model.extend({
    initialize: function(){
      //this.parseTraceEvent();
    },

    parseTraceEvent: function () {
      var callStack = this.parseError();

      var formattedArgs = traceEvent.args.replace("[", "");
      formattedArgs = formattedArgs.replace("]", "");
      var domCall = "<span>document." + traceEvent.functionName + "(" + formattedArgs + ")</span><br/>";
      var formattedTrace = "";
      callStack = _(callStack).reverse();
      _(callStack).each(function (frame) {
        var cleanedScriptName = frame.script;

        if (cleanedScriptName.indexOf("theseus")) {
          cleanedScriptName = decodeURIComponent(cleanedScriptName).replace("https://localhost:9001/?url=", "");
          cleanedScriptName = cleanedScriptName.split(".js")[0];
        }

        var sourceUrl = "<a href='#' title='Inspect Element' class='inspectSource' data-path='" + frame.script + "|||" + frame.lineNumber + "'>" + (cleanedScriptName || 'none') + ":" + (frame.lineNumber || "none") + ":" + (frame.charNumber || "none") + "</a>";
        formattedTrace += sourceUrl + " (" + frame.functionName + ")<br/>";
      });


    },

    parseError: function () {
      var error = this.get("stack");
      var frames = error.split('|||').slice(1).map(function (line) {
        var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);

        if (tokens[1] === "function)") {
          tokens[0] = tokens[0] + " " + tokens[1] + " " + tokens[2] + " " + tokens[3];
          tokens[1] = tokens[4];
          tokens = tokens.slice(0, 2);
        }

        var urlLike = "";
        try {
          urlLike = tokens.pop().replace(/[\(\)\s]/g, '');
        } catch (ignored) {
          return "remove";
        }
        var locationParts = urlLike.split(':');
        var lastNumber = locationParts.pop();
        var possibleNumber = locationParts[locationParts.length - 1];
        if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
          var lineNumber = locationParts.pop();
          locationParts = [locationParts.join(':'), lineNumber, lastNumber];
        } else {
          locationParts = [locationParts.join(':'), lastNumber, undefined];
        }


        var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];

        if (functionName && functionName.indexOf("unravelAgent") > -1) {
          return "remove";
        }

        return {
          functionName: functionName,
          script: locationParts[0],
          lineNumber: locationParts[1],
          charNumber: locationParts[2]
        };
      }, this);

      return _(frames).without("remove");
    }
  });
});