var htmlMinify = require('html-minifier').minify;
var UglifyJS = require('uglify-js');

var fs = require('fs');

module.exports = {
  beautifyHTML: function (body) {
    return htmlMinify(body, {
      removeComments: true,
      minifyJS: {
        fromString: true,
        warnings: true,
        mangle: false,
        compress: {
          sequences: false,  // join consecutive statemets with the “comma operator”
          properties: false,  // optimize property access: a["foo"] → a.foo
          dead_code: false,  // discard unreachable code
          drop_debugger: false,  // discard “debugger” statements
          unsafe: false, // some unsafe optimizations (see below)
          conditionals: false,  // optimize if-s and conditional expressions
          comparisons: false,  // optimize comparisons
          evaluate: false,  // evaluate constant expressions
          booleans: false,  // optimize boolean expressions
          loops: false,  // optimize loops
          unused: false,  // drop unused variables/functions
          hoist_funs: false,  // hoist function declarations
          hoist_vars: false, // hoist variable declarations
          if_return: false,  // optimize if-s followed by return/continue
          join_vars: false,  // join var declarations
          cascade: false,  // try to cascade `right` into `left` in sequences
          side_effects: false,  // drop side-effect-free statements
          warnings: true,  // warn about potentially dangerous optimizations/code
          global_defs: {}     // global definitions
        }
      }
    });
  },

  /*
   @src: the unclean source
   @path: optional, filename of the JS
   */
  beautifyJS: function (src, path) {
    var cleanJS = "";

    try {
      cleanJS = UglifyJS.minify(src, {
        fromString: true,
        warnings: true,
        mangle: false,
        compress: {
          sequences: false,  // join consecutive statemets with the “comma operator”
          properties: false,  // optimize property access: a["foo"] → a.foo
          dead_code: false,  // discard unreachable code
          drop_debugger: false,  // discard “debugger” statements
          unsafe: false, // some unsafe optimizations (see below)
          conditionals: false,  // optimize if-s and conditional expressions
          comparisons: false,  // optimize comparisons
          evaluate: false,  // evaluate constant expressions
          booleans: false,  // optimize boolean expressions
          loops: false,  // optimize loops
          unused: false,  // drop unused variables/functions
          hoist_funs: false,  // hoist function declarations
          hoist_vars: false, // hoist variable declarations
          if_return: false,  // optimize if-s followed by return/continue
          join_vars: false,  // join var declarations
          cascade: false,  // try to cascade `right` into `left` in sequences
          side_effects: false,  // drop side-effect-free statements
          warnings: true,  // warn about potentially dangerous optimizations/code
          global_defs: {}     // global definitions
        },
        output: {
          indent_start: 0,
          indent_level: 2,
          quote_keys: false,
          space_colon: true,
          ascii_only: false,
          unescape_regexps: false,
          inline_script: false,
          width: 120,
          max_line_len: 32000,
          beautify: true,
          source_map: null,
          bracketize: false,
          semicolons: false,
          comments: true,
          preserve_line: false,
          screw_ie8: false,
          preamble: null,
          quote_style: 0
        }
      }).code;
    } catch (ig) {
      console.warn("Could not JS beautify, passing original source through.", path ? " (" + path + ")" : "");
      cleanJS = src;
    }

    return cleanJS;
  },

  /**
   Usage:

   function foo(options) {
     options = mergeInto(options, { bar: "baz" });
     // ...
   }
   */
  mergeInto: function (options, defaultOptions) {
    for (var key in options) {
      if (options[key] !== undefined) {
        defaultOptions[key] = options[key];
      }
    }
    return defaultOptions;
  },

  getLocalCert: function () {
    return fs.readFileSync("util/mockCerts/cert.pem");
  },

  getLocalKey: function () {
    return fs.readFileSync("util/mockCerts/key.pem");
  },

};