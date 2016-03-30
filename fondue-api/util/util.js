var htmlMinify = require('html-minifier').minify;
var UglifyJS = require('uglify-js');
var beautify = require('js-beautify').js_beautify;
var beautify_html = require('js-beautify').html;
var beautify_css = require('js-beautify').css;

var fs = require('fs');
var minifyJSCompressOpts = {
  sequences: false,  // join consecutive statemets with the “comma operator”
  properties: false,  // optimize property access: a["foo"] → a.foo
  dead_code: false,  // discard unreachable code
  drop_debugger: true,  // discard “debugger” statements
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
};

var minifyJSOutputOpts = {
  indent_start: 0,
  indent_level: 1,
  quote_keys: false,
  space_colon: true,
  ascii_only: false,
  unescape_regexps: false,
  inline_script: false,
  width: 80,
  max_line_len: 80,
  beautify: true,
  source_map: null,
  bracketize: true,
  semicolons: true,
  comments: false,
  preserve_line: false,
  screw_ie8: true,
  preamble: null,
  quote_style: 0
};

module.exports = {
  beautifyHTML: function (body) {
    body = htmlMinify(body, {
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: {
        fromString: true,
        warnings: true,
        mangle: false,
        output: minifyJSOutputOpts,
        compress: minifyJSCompressOpts
      }
    });

    body = beautify_html(body, {
      "indent_size": 1,
      "indent_char": " ",
      "indent_with_tabs": false,
      "preserve_newlines": false,
      "max_preserve_newlines": 1,
      "wrap_line_length": 80,
      "jslint_happy": true,
      "keep_array_indentation": false,
      "brace_style": "collapse",
      "extra_liners": []
    });

    return body;
  },

  beautifyCSS: function (src) {
    return beautify_css(src, {
      "indent_size": 1,
      "indent_char": " ",
      "eol": "\n"
    });
  },

  /*
   @src: the unclean source
   @path: optional, filename of the JS
   */
  beautifyJS: function (src, path) {
    try {
      src = src.split("use strict").join("");
      src = UglifyJS.minify(src, {
        fromString: true,
        warnings: true,
        mangle: false,
        compress: minifyJSCompressOpts,
        output: minifyJSOutputOpts
      }).code;

      src = beautify(src, {
        "indent_size": 1,
        "indent_char": " ",
        "eol": "\n",
        "indent_level": 0,
        "indent_with_tabs": false,
        "preserve_newlines": false,
        "max_preserve_newlines": 1,
        "jslint_happy": true,
        "space_after_anon_function": true,
        "brace_style": "collapse",
        "keep_array_indentation": false,
        "keep_function_indentation": false,
        "space_before_conditional": true,
        "break_chained_methods": false,
        "eval_code": false,
        "unescape_strings": false,
        "wrap_line_length": 80,
        "wrap_attributes": "auto",
        "wrap_attributes_indent_size": 2,
        "end_with_newline": false
      });
    } catch (ig) {
      console.warn("Could not JS beautify, passing original source through.", path ? " (" + path + ")" : "");
      return null;
    }

    return src;
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