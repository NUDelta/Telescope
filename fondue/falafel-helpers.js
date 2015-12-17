var eselector = require('./esprima-selector');

// decorates the given esprima node with tag-specific helpers.
// statements and the like get:
//   node.before(src) - inserts src before the node
//   node.after(src) - inserts src after the node
//   node.wrap(beforeSrc, afterSrc) - wraps the node
//
// expressions just get:
//   node.wrap(beforeSrc, afterSrc) - wraps the node (be sure to match parentheses)
//
// blocks get:
//   node.before(src) - inserts src before everything in the block
//   node.after(src, useFinally) - inserts src after everything in the block; if useFinally is true, the block is wrapped with try-block with src in the finally clause
module.exports = function (node, options) {
	options = (options || {});
	var primitives = options.falafelMap ? falafelMapPrimitives : falafelPrimitives;

	var w = eselector.nodeTag(node);
	if (w) {
		node.update = newUpdate(node);
		if (['statement', 'declaration', 'program', 'block'].indexOf(w.name) !== -1) {
			node.before = before;
			node.after = after;
			node.wrap = beforeAfterWrap;
		} else if (w.name === "expression") {
			node.wrap = parensWrap;
		} else if (['switch-case'].indexOf(w.name) !== -1) {
			// TODO
		} else if (['declarator', 'property', 'clause'].indexOf(w.name) !== -1) {
			// skip
		} else {
			throw new Error('unrecognized node ' + w.name + ' (' + node.type + ')');
		}
	}

	return node;

	function before(src) {
		rawWrap.call(this, primitives.sequence('{', src), '}');
	}
	function after(src, catchSrc) {
		if (catchSrc === true) {
			rawWrap.call(this, '{ try {', primitives.sequence('} finally {', src, '} }'));
		} else if (catchSrc) {
			rawWrap.call(this, '{ try {', primitives.sequence('} catch (__e) {', catchSrc, '} finally {', src, '} }'));
		} else {
			rawWrap.call(this, '{', primitives.sequence(src, '}'));
		}
	}
	function beforeAfterWrap(beforeSrc, afterSrc, useFinally) {
		this.before(beforeSrc);
		this.after(afterSrc, useFinally);
	}
	function parensWrap(beforeSrc, afterSrc) {
		this.update('(', beforeSrc, primitives.source(this), afterSrc, ')');
	}
	function rawWrap(beforeSrc, afterSrc) {
		this.update(beforeSrc, primitives.source(this), afterSrc);
	}
	function newUpdate(node) {
		var oldUpdate = node.update;
		return function () {
			var seq = primitives.sequence.apply(this, arguments);
			return oldUpdate.call(this, seq);
		};
	}
}

// returns a version of f where the node argument has been wrapped with the function above
module.exports.wrap = function (f, options) {
	return function (node) {
		return f(module.exports(node, options));
	};
};

var falafelPrimitives = {
	sequence: function () { return Array.prototype.join.call(arguments, '') },
	source: function (node) { return node.source() },
};

var falafelMapPrimitives = {
	sequence: function () { return Array.prototype.slice.call(arguments) },
	source: function (node) { return node.sourceNodes() },
};
