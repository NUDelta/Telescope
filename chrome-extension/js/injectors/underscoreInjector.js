define([],
  function () {
    return function () {

      (function () {

        //     Underscore.js 1.8.3
        // Baseline setup
        // --------------

        // Establish the root object, `window` in the browser, or `exports` on the server.
        var root = this;

        // Save the previous value of the `underscorejs` variable.
        var previousUnderscore = undefined;

        // Save bytes in the minified (but not gzipped) version:
        var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

        // Create quick reference variables for speed access to core prototypes.
        var
          push = ArrayProto.push,
          slice = ArrayProto.slice,
          toString = ObjProto.toString,
          hasOwnProperty = ObjProto.hasOwnProperty;

        // All **ECMAScript 5** native function implementations that we hope to use
        // are declared here.
        var
          nativeIsArray = Array.isArray,
          nativeKeys = Object.keys,
          nativeBind = FuncProto.bind,
          nativeCreate = Object.create;

        // Naked function reference for surrogate-prototype-swapping.
        var Ctor = function () {
        };

        // Create a safe reference to the Underscore object for use below.
        var underscorejs = function (obj) {
          if (obj instanceof underscorejs) return obj;
          if (!(this instanceof underscorejs)) return new underscorejs(obj);
          this._wrapped = obj;
        };

        // Current version.
        underscorejs.VERSION = '1.8.3';

        // Internal function that returns an efficient (for current engines) version
        // of the passed-in callback, to be repeatedly applied in other Underscore
        // functions.
        var optimizeCb = function (func, context, argCount) {
          if (context === void 0) return func;
          switch (argCount == null ? 3 : argCount) {
            case 1:
              return function (value) {
                return func.call(context, value);
              };
            case 2:
              return function (value, other) {
                return func.call(context, value, other);
              };
            case 3:
              return function (value, index, collection) {
                return func.call(context, value, index, collection);
              };
            case 4:
              return function (accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
              };
          }
          return function () {
            return func.apply(context, arguments);
          };
        };

        // A mostly-internal function to generate callbacks that can be applied
        // to each element in a collection, returning the desired result — either
        // identity, an arbitrary callback, a property matcher, or a property accessor.
        var cb = function (value, context, argCount) {
          if (value == null) return underscorejs.identity;
          if (underscorejs.isFunction(value)) return optimizeCb(value, context, argCount);
          if (underscorejs.isObject(value)) return underscorejs.matcher(value);
          return underscorejs.property(value);
        };
        underscorejs.iteratee = function (value, context) {
          return cb(value, context, Infinity);
        };

        // An internal function for creating assigner functions.
        var createAssigner = function (keysFunc, undefinedOnly) {
          return function (obj) {
            var length = arguments.length;
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
              var source = arguments[index],
                keys = keysFunc(source),
                l = keys.length;
              for (var i = 0; i < l; i++) {
                var key = keys[i];
                if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
              }
            }
            return obj;
          };
        };

        // An internal function for creating a new object that inherits from another.
        var baseCreate = function (prototype) {
          if (!underscorejs.isObject(prototype)) return {};
          if (nativeCreate) return nativeCreate(prototype);
          Ctor.prototype = prototype;
          var result = new Ctor;
          Ctor.prototype = null;
          return result;
        };

        var property = function (key) {
          return function (obj) {
            return obj == null ? void 0 : obj[key];
          };
        };

        // Helper for collection methods to determine whether a collection
        // should be iterated as an array or as an object
        // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
        // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
        var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
        var getLength = property('length');
        var isArrayLike = function (collection) {
          var length = getLength(collection);
          return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
        };

        // Collection Functions
        // --------------------

        // The cornerstone, an `each` implementation, aka `forEach`.
        // Handles raw objects in addition to array-likes. Treats all
        // sparse array-likes as if they were dense.
        underscorejs.each = underscorejs.forEach = function (obj, iteratee, context) {
          iteratee = optimizeCb(iteratee, context);
          var i, length;
          if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
              iteratee(obj[i], i, obj);
            }
          } else {
            var keys = underscorejs.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
              iteratee(obj[keys[i]], keys[i], obj);
            }
          }
          return obj;
        };

        // Return the results of applying the iteratee to each element.
        underscorejs.map = underscorejs.collect = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          var keys = !isArrayLike(obj) && underscorejs.keys(obj),
            length = (keys || obj).length,
            results = Array(length);
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
        };

        // Create a reducing function iterating left or right.
        function createReduce(dir) {
          // Optimized iterator function as using arguments.length
          // in the main function will deoptimize the, see #1991.
          function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
              var currentKey = keys ? keys[index] : index;
              memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
          }

          return function (obj, iteratee, memo, context) {
            iteratee = optimizeCb(iteratee, context, 4);
            var keys = !isArrayLike(obj) && underscorejs.keys(obj),
              length = (keys || obj).length,
              index = dir > 0 ? 0 : length - 1;
            // Determine the initial value if none is provided.
            if (arguments.length < 3) {
              memo = obj[keys ? keys[index] : index];
              index += dir;
            }
            return iterator(obj, iteratee, memo, keys, index, length);
          };
        }

        // **Reduce** builds up a single result from a list of values, aka `inject`,
        // or `foldl`.
        underscorejs.reduce = underscorejs.foldl = underscorejs.inject = createReduce(1);

        // The right-associative version of reduce, also known as `foldr`.
        underscorejs.reduceRight = underscorejs.foldr = createReduce(-1);

        // Return the first value which passes a truth test. Aliased as `detect`.
        underscorejs.find = underscorejs.detect = function (obj, predicate, context) {
          var key;
          if (isArrayLike(obj)) {
            key = underscorejs.findIndex(obj, predicate, context);
          } else {
            key = underscorejs.findKey(obj, predicate, context);
          }
          if (key !== void 0 && key !== -1) return obj[key];
        };

        // Return all the elements that pass a truth test.
        // Aliased as `select`.
        underscorejs.filter = underscorejs.select = function (obj, predicate, context) {
          var results = [];
          predicate = cb(predicate, context);
          underscorejs.each(obj, function (value, index, list) {
            if (predicate(value, index, list)) results.push(value);
          });
          return results;
        };

        // Return all the elements for which a truth test fails.
        underscorejs.reject = function (obj, predicate, context) {
          return underscorejs.filter(obj, underscorejs.negate(cb(predicate)), context);
        };

        // Determine whether all of the elements match a truth test.
        // Aliased as `all`.
        underscorejs.every = underscorejs.all = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && underscorejs.keys(obj),
            length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false;
          }
          return true;
        };

        // Determine if at least one element in the object matches a truth test.
        // Aliased as `any`.
        underscorejs.some = underscorejs.any = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && underscorejs.keys(obj),
            length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
          }
          return false;
        };

        // Determine if the array or object contains a given item (using `===`).
        // Aliased as `includes` and `include`.
        underscorejs.contains = underscorejs.includes = underscorejs.include = function (obj, item, fromIndex, guard) {
          if (!isArrayLike(obj)) obj = underscorejs.values(obj);
          if (typeof fromIndex != 'number' || guard) fromIndex = 0;
          return underscorejs.indexOf(obj, item, fromIndex) >= 0;
        };

        // Invoke a method (with arguments) on every item in a collection.
        underscorejs.invoke = function (obj, method) {
          var args = slice.call(arguments, 2);
          var isFunc = underscorejs.isFunction(method);
          return underscorejs.map(obj, function (value) {
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value, args);
          });
        };

        // Convenience version of a common use case of `map`: fetching a property.
        underscorejs.pluck = function (obj, key) {
          return underscorejs.map(obj, underscorejs.property(key));
        };

        // Convenience version of a common use case of `filter`: selecting only objects
        // containing specific `key:value` pairs.
        underscorejs.where = function (obj, attrs) {
          return underscorejs.filter(obj, underscorejs.matcher(attrs));
        };

        // Convenience version of a common use case of `find`: getting the first object
        // containing specific `key:value` pairs.
        underscorejs.findWhere = function (obj, attrs) {
          return underscorejs.find(obj, underscorejs.matcher(attrs));
        };

        // Return the maximum element (or element-based computation).
        underscorejs.max = function (obj, iteratee, context) {
          var result = -Infinity, lastComputed = -Infinity,
            value, computed;
          if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : underscorejs.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
              value = obj[i];
              if (value > result) {
                result = value;
              }
            }
          } else {
            iteratee = cb(iteratee, context);
            underscorejs.each(obj, function (value, index, list) {
              computed = iteratee(value, index, list);
              if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                result = value;
                lastComputed = computed;
              }
            });
          }
          return result;
        };

        // Return the minimum element (or element-based computation).
        underscorejs.min = function (obj, iteratee, context) {
          var result = Infinity, lastComputed = Infinity,
            value, computed;
          if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : underscorejs.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
              value = obj[i];
              if (value < result) {
                result = value;
              }
            }
          } else {
            iteratee = cb(iteratee, context);
            underscorejs.each(obj, function (value, index, list) {
              computed = iteratee(value, index, list);
              if (computed < lastComputed || computed === Infinity && result === Infinity) {
                result = value;
                lastComputed = computed;
              }
            });
          }
          return result;
        };

        // Shuffle a collection, using the modern version of the
        // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
        underscorejs.shuffle = function (obj) {
          var set = isArrayLike(obj) ? obj : underscorejs.values(obj);
          var length = set.length;
          var shuffled = Array(length);
          for (var index = 0, rand; index < length; index++) {
            rand = underscorejs.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
          }
          return shuffled;
        };

        // Sample **n** random values from a collection.
        // If **n** is not specified, returns a single random element.
        // The internal `guard` argument allows it to work with `map`.
        underscorejs.sample = function (obj, n, guard) {
          if (n == null || guard) {
            if (!isArrayLike(obj)) obj = underscorejs.values(obj);
            return obj[underscorejs.random(obj.length - 1)];
          }
          return underscorejs.shuffle(obj).slice(0, Math.max(0, n));
        };

        // Sort the object's values by a criterion produced by an iteratee.
        underscorejs.sortBy = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          return underscorejs.pluck(underscorejs.map(obj, function (value, index, list) {
            return {
              value: value,
              index: index,
              criteria: iteratee(value, index, list)
            };
          }).sort(function (left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
              if (a > b || a === void 0) return 1;
              if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
          }), 'value');
        };

        // An internal function used for aggregate "group by" operations.
        var group = function (behavior) {
          return function (obj, iteratee, context) {
            var result = {};
            iteratee = cb(iteratee, context);
            underscorejs.each(obj, function (value, index) {
              var key = iteratee(value, index, obj);
              behavior(result, value, key);
            });
            return result;
          };
        };

        // Groups the object's values by a criterion. Pass either a string attribute
        // to group by, or a function that returns the criterion.
        underscorejs.groupBy = group(function (result, value, key) {
          if (underscorejs.has(result, key)) result[key].push(value); else result[key] = [value];
        });

        // Indexes the object's values by a criterion, similar to `groupBy`, but for
        // when you know that your index values will be unique.
        underscorejs.indexBy = group(function (result, value, key) {
          result[key] = value;
        });

        // Counts instances of an object that group by a certain criterion. Pass
        // either a string attribute to count by, or a function that returns the
        // criterion.
        underscorejs.countBy = group(function (result, value, key) {
          if (underscorejs.has(result, key)) result[key]++; else result[key] = 1;
        });

        // Safely create a real, live array from anything iterable.
        underscorejs.toArray = function (obj) {
          if (!obj) return [];
          if (underscorejs.isArray(obj)) return slice.call(obj);
          if (isArrayLike(obj)) return underscorejs.map(obj, underscorejs.identity);
          return underscorejs.values(obj);
        };

        // Return the number of elements in an object.
        underscorejs.size = function (obj) {
          if (obj == null) return 0;
          return isArrayLike(obj) ? obj.length : underscorejs.keys(obj).length;
        };

        // Split a collection into two arrays: one whose elements all satisfy the given
        // predicate, and one whose elements all do not satisfy the predicate.
        underscorejs.partition = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var pass = [], fail = [];
          underscorejs.each(obj, function (value, key, obj) {
            (predicate(value, key, obj) ? pass : fail).push(value);
          });
          return [pass, fail];
        };

        // Array Functions
        // ---------------

        // Get the first element of an array. Passing **n** will return the first N
        // values in the array. Aliased as `head` and `take`. The **guard** check
        // allows it to work with `underscorejs.map`.
        underscorejs.first = underscorejs.head = underscorejs.take = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[0];
          return underscorejs.initial(array, array.length - n);
        };

        // Returns everything but the last entry of the array. Especially useful on
        // the arguments object. Passing **n** will return all the values in
        // the array, excluding the last N.
        underscorejs.initial = function (array, n, guard) {
          return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
        };

        // Get the last element of an array. Passing **n** will return the last N
        // values in the array.
        underscorejs.last = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[array.length - 1];
          return underscorejs.rest(array, Math.max(0, array.length - n));
        };

        // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
        // Especially useful on the arguments object. Passing an **n** will return
        // the rest N values in the array.
        underscorejs.rest = underscorejs.tail = underscorejs.drop = function (array, n, guard) {
          return slice.call(array, n == null || guard ? 1 : n);
        };

        // Trim out all falsy values from an array.
        underscorejs.compact = function (array) {
          return underscorejs.filter(array, underscorejs.identity);
        };

        // Internal implementation of a recursive `flatten` function.
        var flatten = function (input, shallow, strict, startIndex) {
          var output = [], idx = 0;
          for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
            var value = input[i];
            if (isArrayLike(value) && (underscorejs.isArray(value) || underscorejs.isArguments(value))) {
              //flatten current level of array or arguments object
              if (!shallow) value = flatten(value, shallow, strict);
              var j = 0, len = value.length;
              output.length += len;
              while (j < len) {
                output[idx++] = value[j++];
              }
            } else if (!strict) {
              output[idx++] = value;
            }
          }
          return output;
        };

        // Flatten out an array, either recursively (by default), or just one level.
        underscorejs.flatten = function (array, shallow) {
          return flatten(array, shallow, false);
        };

        // Return a version of the array that does not contain the specified value(s).
        underscorejs.without = function (array) {
          return underscorejs.difference(array, slice.call(arguments, 1));
        };

        // Produce a duplicate-free version of the array. If the array has already
        // been sorted, you have the option of using a faster algorithm.
        // Aliased as `unique`.
        underscorejs.uniq = underscorejs.unique = function (array, isSorted, iteratee, context) {
          if (!underscorejs.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
          }
          if (iteratee != null) iteratee = cb(iteratee, context);
          var result = [];
          var seen = [];
          for (var i = 0, length = getLength(array); i < length; i++) {
            var value = array[i],
              computed = iteratee ? iteratee(value, i, array) : value;
            if (isSorted) {
              if (!i || seen !== computed) result.push(value);
              seen = computed;
            } else if (iteratee) {
              if (!underscorejs.contains(seen, computed)) {
                seen.push(computed);
                result.push(value);
              }
            } else if (!underscorejs.contains(result, value)) {
              result.push(value);
            }
          }
          return result;
        };

        // Produce an array that contains the union: each distinct element from all of
        // the passed-in arrays.
        underscorejs.union = function () {
          return underscorejs.uniq(flatten(arguments, true, true));
        };

        // Produce an array that contains every item shared between all the
        // passed-in arrays.
        underscorejs.intersection = function (array) {
          var result = [];
          var argsLength = arguments.length;
          for (var i = 0, length = getLength(array); i < length; i++) {
            var item = array[i];
            if (underscorejs.contains(result, item)) continue;
            for (var j = 1; j < argsLength; j++) {
              if (!underscorejs.contains(arguments[j], item)) break;
            }
            if (j === argsLength) result.push(item);
          }
          return result;
        };

        // Take the difference between one array and a number of other arrays.
        // Only the elements present in just the first array will remain.
        underscorejs.difference = function (array) {
          var rest = flatten(arguments, true, true, 1);
          return underscorejs.filter(array, function (value) {
            return !underscorejs.contains(rest, value);
          });
        };

        // Zip together multiple lists into a single array -- elements that share
        // an index go together.
        underscorejs.zip = function () {
          return underscorejs.unzip(arguments);
        };

        // Complement of underscorejs.zip. Unzip accepts an array of arrays and groups
        // each array's elements on shared indices
        underscorejs.unzip = function (array) {
          var length = array && underscorejs.max(array, getLength).length || 0;
          var result = Array(length);

          for (var index = 0; index < length; index++) {
            result[index] = underscorejs.pluck(array, index);
          }
          return result;
        };

        // Converts lists into objects. Pass either a single array of `[key, value]`
        // pairs, or two parallel arrays of the same length -- one of keys, and one of
        // the corresponding values.
        underscorejs.object = function (list, values) {
          var result = {};
          for (var i = 0, length = getLength(list); i < length; i++) {
            if (values) {
              result[list[i]] = values[i];
            } else {
              result[list[i][0]] = list[i][1];
            }
          }
          return result;
        };

        // Generator function to create the findIndex and findLastIndex functions
        function createPredicateIndexFinder(dir) {
          return function (array, predicate, context) {
            predicate = cb(predicate, context);
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
              if (predicate(array[index], index, array)) return index;
            }
            return -1;
          };
        }

        // Returns the first index on an array-like that passes a predicate test
        underscorejs.findIndex = createPredicateIndexFinder(1);
        underscorejs.findLastIndex = createPredicateIndexFinder(-1);

        // Use a comparator function to figure out the smallest index at which
        // an object should be inserted so as to maintain order. Uses binary search.
        underscorejs.sortedIndex = function (array, obj, iteratee, context) {
          iteratee = cb(iteratee, context, 1);
          var value = iteratee(obj);
          var low = 0, high = getLength(array);
          while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
          }
          return low;
        };

        // Generator function to create the indexOf and lastIndexOf functions
        function createIndexFinder(dir, predicateFind, sortedIndex) {
          return function (array, item, idx) {
            var i = 0, length = getLength(array);
            if (typeof idx == 'number') {
              if (dir > 0) {
                i = idx >= 0 ? idx : Math.max(idx + length, i);
              } else {
                length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
              }
            } else if (sortedIndex && idx && length) {
              idx = sortedIndex(array, item);
              return array[idx] === item ? idx : -1;
            }
            if (item !== item) {
              idx = predicateFind(slice.call(array, i, length), underscorejs.isNaN);
              return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
              if (array[idx] === item) return idx;
            }
            return -1;
          };
        }

        // Return the position of the first occurrence of an item in an array,
        // or -1 if the item is not included in the array.
        // If the array is large and already in sort order, pass `true`
        // for **isSorted** to use binary search.
        underscorejs.indexOf = createIndexFinder(1, underscorejs.findIndex, underscorejs.sortedIndex);
        underscorejs.lastIndexOf = createIndexFinder(-1, underscorejs.findLastIndex);

        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        underscorejs.range = function (start, stop, step) {
          if (stop == null) {
            stop = start || 0;
            start = 0;
          }
          step = step || 1;

          var length = Math.max(Math.ceil((stop - start) / step), 0);
          var range = Array(length);

          for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
          }

          return range;
        };

        // Function (ahem) Functions
        // ------------------

        // Determines whether to execute a function as a constructor
        // or a normal function with the provided arguments
        var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {
          if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
          var self = baseCreate(sourceFunc.prototype);
          var result = sourceFunc.apply(self, args);
          if (underscorejs.isObject(result)) return result;
          return self;
        };

        // Create a function bound to a given object (assigning `this`, and arguments,
        // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
        // available.
        underscorejs.bind = function (func, context) {
          if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
          if (!underscorejs.isFunction(func)) throw new TypeError('Bind must be called on a function');
          var args = slice.call(arguments, 2);
          var bound = function () {
            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
          };
          return bound;
        };

        // Partially apply a function by creating a version that has had some of its
        // arguments pre-filled, without changing its dynamic `this` context. underscorejs acts
        // as a placeholder, allowing any combination of arguments to be pre-filled.
        underscorejs.partial = function (func) {
          var boundArgs = slice.call(arguments, 1);
          var bound = function () {
            var position = 0, length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
              args[i] = boundArgs[i] === underscorejs ? arguments[position++] : boundArgs[i];
            }
            while (position < arguments.length) args.push(arguments[position++]);
            return executeBound(func, bound, this, this, args);
          };
          return bound;
        };

        // Bind a number of an object's methods to that object. Remaining arguments
        // are the method names to be bound. Useful for ensuring that all callbacks
        // defined on an object belong to it.
        underscorejs.bindAll = function (obj) {
          var i, length = arguments.length, key;
          if (length <= 1) throw new Error('bindAll must be passed function names');
          for (i = 1; i < length; i++) {
            key = arguments[i];
            obj[key] = underscorejs.bind(obj[key], obj);
          }
          return obj;
        };

        // Memoize an expensive function by storing its results.
        underscorejs.memoize = function (func, hasher) {
          var memoize = function (key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!underscorejs.has(cache, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
          };
          memoize.cache = {};
          return memoize;
        };

        // Delays a function for the given number of milliseconds, and then calls
        // it with the arguments supplied.
        underscorejs.delay = function (func, wait) {
          var args = slice.call(arguments, 2);
          return setTimeout(function () {
            return func.apply(null, args);
          }, wait);
        };

        // Defers a function, scheduling it to run after the current call stack has
        // cleared.
        underscorejs.defer = underscorejs.partial(underscorejs.delay, underscorejs, 1);

        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        underscorejs.throttle = function (func, wait, options) {
          var context, args, result;
          var timeout = null;
          var previous = 0;
          if (!options) options = {};
          var later = function () {
            previous = options.leading === false ? 0 : underscorejs.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          };
          return function () {
            var now = underscorejs.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
              if (timeout) {
                clearTimeout(timeout);
                timeout = null;
              }
              previous = now;
              result = func.apply(context, args);
              if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) {
              timeout = setTimeout(later, remaining);
            }
            return result;
          };
        };

        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        underscorejs.debounce = function (func, wait, immediate) {
          var timeout, args, context, timestamp, result;

          var later = function () {
            var last = underscorejs.now() - timestamp;

            if (last < wait && last >= 0) {
              timeout = setTimeout(later, wait - last);
            } else {
              timeout = null;
              if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
              }
            }
          };

          return function () {
            context = this;
            args = arguments;
            timestamp = underscorejs.now();
            var callNow = immediate && !timeout;
            if (!timeout) timeout = setTimeout(later, wait);
            if (callNow) {
              result = func.apply(context, args);
              context = args = null;
            }

            return result;
          };
        };

        // Returns the first function passed as an argument to the second,
        // allowing you to adjust arguments, run code before and after, and
        // conditionally execute the original function.
        underscorejs.wrap = function (func, wrapper) {
          return underscorejs.partial(wrapper, func);
        };

        // Returns a negated version of the passed-in predicate.
        underscorejs.negate = function (predicate) {
          return function () {
            return !predicate.apply(this, arguments);
          };
        };

        // Returns a function that is the composition of a list of functions, each
        // consuming the return value of the function that follows.
        underscorejs.compose = function () {
          var args = arguments;
          var start = args.length - 1;
          return function () {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) result = args[i].call(this, result);
            return result;
          };
        };

        // Returns a function that will only be executed on and after the Nth call.
        underscorejs.after = function (times, func) {
          return function () {
            if (--times < 1) {
              return func.apply(this, arguments);
            }
          };
        };

        // Returns a function that will only be executed up to (but not including) the Nth call.
        underscorejs.before = function (times, func) {
          var memo;
          return function () {
            if (--times > 0) {
              memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
          };
        };

        // Returns a function that will be executed at most one time, no matter how
        // often you call it. Useful for lazy initialization.
        underscorejs.once = underscorejs.partial(underscorejs.before, 2);

        // Object Functions
        // ----------------

        // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
        var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
        var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
          'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

        function collectNonEnumProps(obj, keys) {
          var nonEnumIdx = nonEnumerableProps.length;
          var constructor = obj.constructor;
          var proto = (underscorejs.isFunction(constructor) && constructor.prototype) || ObjProto;

          // Constructor is a special case.
          var prop = 'constructor';
          if (underscorejs.has(obj, prop) && !underscorejs.contains(keys, prop)) keys.push(prop);

          while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !underscorejs.contains(keys, prop)) {
              keys.push(prop);
            }
          }
        }

        // Retrieve the names of an object's own properties.
        // Delegates to **ECMAScript 5**'s native `Object.keys`
        underscorejs.keys = function (obj) {
          if (!underscorejs.isObject(obj)) return [];
          if (nativeKeys) return nativeKeys(obj);
          var keys = [];
          for (var key in obj) if (underscorejs.has(obj, key)) keys.push(key);
          // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
        };

        // Retrieve all the property names of an object.
        underscorejs.allKeys = function (obj) {
          if (!underscorejs.isObject(obj)) return [];
          var keys = [];
          for (var key in obj) keys.push(key);
          // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
        };

        // Retrieve the values of an object's properties.
        underscorejs.values = function (obj) {
          var keys = underscorejs.keys(obj);
          var length = keys.length;
          var values = Array(length);
          for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
          }
          return values;
        };

        // Returns the results of applying the iteratee to each element of the object
        // In contrast to underscorejs.map it returns an object
        underscorejs.mapObject = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          var keys = underscorejs.keys(obj),
            length = keys.length,
            results = {},
            currentKey;
          for (var index = 0; index < length; index++) {
            currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
        };

        // Convert an object into a list of `[key, value]` pairs.
        underscorejs.pairs = function (obj) {
          var keys = underscorejs.keys(obj);
          var length = keys.length;
          var pairs = Array(length);
          for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
          }
          return pairs;
        };

        // Invert the keys and values of an object. The values must be serializable.
        underscorejs.invert = function (obj) {
          var result = {};
          var keys = underscorejs.keys(obj);
          for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
          }
          return result;
        };

        // Return a sorted list of the function names available on the object.
        // Aliased as `methods`
        underscorejs.functions = underscorejs.methods = function (obj) {
          var names = [];
          for (var key in obj) {
            if (underscorejs.isFunction(obj[key])) names.push(key);
          }
          return names.sort();
        };

        // Extend a given object with all the properties in passed-in object(s).
        underscorejs.extend = createAssigner(underscorejs.allKeys);

        // Assigns a given object with all the own properties in the passed-in object(s)
        // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
        underscorejs.extendOwn = underscorejs.assign = createAssigner(underscorejs.keys);

        // Returns the first key on an object that passes a predicate test
        underscorejs.findKey = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = underscorejs.keys(obj), key;
          for (var i = 0, length = keys.length; i < length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
          }
        };

        // Return a copy of the object only containing the whitelisted properties.
        underscorejs.pick = function (object, oiteratee, context) {
          var result = {}, obj = object, iteratee, keys;
          if (obj == null) return result;
          if (underscorejs.isFunction(oiteratee)) {
            keys = underscorejs.allKeys(obj);
            iteratee = optimizeCb(oiteratee, context);
          } else {
            keys = flatten(arguments, false, false, 1);
            iteratee = function (value, key, obj) {
              return key in obj;
            };
            obj = Object(obj);
          }
          for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) result[key] = value;
          }
          return result;
        };

        // Return a copy of the object without the blacklisted properties.
        underscorejs.omit = function (obj, iteratee, context) {
          if (underscorejs.isFunction(iteratee)) {
            iteratee = underscorejs.negate(iteratee);
          } else {
            var keys = underscorejs.map(flatten(arguments, false, false, 1), String);
            iteratee = function (value, key) {
              return !underscorejs.contains(keys, key);
            };
          }
          return underscorejs.pick(obj, iteratee, context);
        };

        // Fill in a given object with default properties.
        underscorejs.defaults = createAssigner(underscorejs.allKeys, true);

        // Creates an object that inherits from the given prototype object.
        // If additional properties are provided then they will be added to the
        // created object.
        underscorejs.create = function (prototype, props) {
          var result = baseCreate(prototype);
          if (props) underscorejs.extendOwn(result, props);
          return result;
        };

        // Create a (shallow-cloned) duplicate of an object.
        underscorejs.clone = function (obj) {
          if (!underscorejs.isObject(obj)) return obj;
          return underscorejs.isArray(obj) ? obj.slice() : underscorejs.extend({}, obj);
        };

        // Invokes interceptor with the obj, and then returns obj.
        // The primary purpose of this method is to "tap into" a method chain, in
        // order to perform operations on intermediate results within the chain.
        underscorejs.tap = function (obj, interceptor) {
          interceptor(obj);
          return obj;
        };

        // Returns whether an object has a given set of `key:value` pairs.
        underscorejs.isMatch = function (object, attrs) {
          var keys = underscorejs.keys(attrs), length = keys.length;
          if (object == null) return !length;
          var obj = Object(object);
          for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
          }
          return true;
        };


        // Internal recursive comparison function for `isEqual`.
        var eq = function (a, b, aStack, bStack) {
          // Identical objects are equal. `0 === -0`, but they aren't identical.
          // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
          if (a === b) return a !== 0 || 1 / a === 1 / b;
          // A strict comparison is necessary because `null == undefined`.
          if (a == null || b == null) return a === b;
          // Unwrap any wrapped objects.
          if (a instanceof underscorejs) a = a._wrapped;
          if (b instanceof underscorejs) b = b._wrapped;
          // Compare `[[Class]]` names.
          var className = toString.call(a);
          if (className !== toString.call(b)) return false;
          switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
              // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
              // equivalent to `new String("5")`.
              return '' + a === '' + b;
            case '[object Number]':
              // `NaN`s are equivalent, but non-reflexive.
              // Object(NaN) is equivalent to NaN
              if (+a !== +a) return +b !== +b;
              // An `egal` comparison is performed for other numeric values.
              return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
              // Coerce dates and booleans to numeric primitive values. Dates are compared by their
              // millisecond representations. Note that invalid dates with millisecond representations
              // of `NaN` are not equivalent.
              return +a === +b;
          }

          var areArrays = className === '[object Array]';
          if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(underscorejs.isFunction(aCtor) && aCtor instanceof aCtor &&
              underscorejs.isFunction(bCtor) && bCtor instanceof bCtor)
              && ('constructor' in a && 'constructor' in b)) {
              return false;
            }
          }
          // Assume equality for cyclic structures. The algorithm for detecting cyclic
          // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

          // Initializing stack of traversed objects.
          // It's done here since we only need them for objects and arrays comparison.
          aStack = aStack || [];
          bStack = bStack || [];
          var length = aStack.length;
          while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
          }

          // Add the first object to the stack of traversed objects.
          aStack.push(a);
          bStack.push(b);

          // Recursively compare objects and arrays.
          if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
              if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
          } else {
            // Deep compare objects.
            var keys = underscorejs.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (underscorejs.keys(b).length !== length) return false;
            while (length--) {
              // Deep compare each member
              key = keys[length];
              if (!(underscorejs.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
          }
          // Remove the first object from the stack of traversed objects.
          aStack.pop();
          bStack.pop();
          return true;
        };

        // Perform a deep comparison to check if two objects are equal.
        underscorejs.isEqual = function (a, b) {
          return eq(a, b);
        };

        // Is a given array, string, or object empty?
        // An "empty" object has no enumerable own-properties.
        underscorejs.isEmpty = function (obj) {
          if (obj == null) return true;
          if (isArrayLike(obj) && (underscorejs.isArray(obj) || underscorejs.isString(obj) || underscorejs.isArguments(obj))) return obj.length === 0;
          return underscorejs.keys(obj).length === 0;
        };

        // Is a given value a DOM element?
        underscorejs.isElement = function (obj) {
          return !!(obj && obj.nodeType === 1);
        };

        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        underscorejs.isArray = nativeIsArray || function (obj) {
            return toString.call(obj) === '[object Array]';
          };

        // Is a given variable an object?
        underscorejs.isObject = function (obj) {
          var type = typeof obj;
          return type === 'function' || type === 'object' && !!obj;
        };

        // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
        underscorejs.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function (name) {
          underscorejs['is' + name] = function (obj) {
            return toString.call(obj) === '[object ' + name + ']';
          };
        });

        // Define a fallback version of the method in browsers (ahem, IE < 9), where
        // there isn't any inspectable "Arguments" type.
        if (!underscorejs.isArguments(arguments)) {
          underscorejs.isArguments = function (obj) {
            return underscorejs.has(obj, 'callee');
          };
        }

        // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
        // IE 11 (#1621), and in Safari 8 (#1929).
        if (typeof /./ != 'function' && typeof Int8Array != 'object') {
          underscorejs.isFunction = function (obj) {
            return typeof obj == 'function' || false;
          };
        }

        // Is a given object a finite number?
        underscorejs.isFinite = function (obj) {
          return isFinite(obj) && !isNaN(parseFloat(obj));
        };

        // Is the given value `NaN`? (NaN is the only number which does not equal itself).
        underscorejs.isNaN = function (obj) {
          return underscorejs.isNumber(obj) && obj !== +obj;
        };

        // Is a given value a boolean?
        underscorejs.isBoolean = function (obj) {
          return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
        };

        // Is a given value equal to null?
        underscorejs.isNull = function (obj) {
          return obj === null;
        };

        // Is a given variable undefined?
        underscorejs.isUndefined = function (obj) {
          return obj === void 0;
        };

        // Shortcut function for checking if an object has a given property directly
        // on itself (in other words, not on a prototype).
        underscorejs.has = function (obj, key) {
          return obj != null && hasOwnProperty.call(obj, key);
        };

        // Utility Functions
        // -----------------

        // Run Underscore.js in *noConflict* mode, returning the `underscorejs` variable to its
        // previous owner. Returns a reference to the Underscore object.
        underscorejs.noConflict = function () {
          return this;
        };

        // Keep the identity function around for default iteratees.
        underscorejs.identity = function (value) {
          return value;
        };

        // Predicate-generating functions. Often useful outside of Underscore.
        underscorejs.constant = function (value) {
          return function () {
            return value;
          };
        };

        underscorejs.noop = function () {
        };

        underscorejs.property = property;

        // Generates a function for a given object that returns a given property.
        underscorejs.propertyOf = function (obj) {
          return obj == null ? function () {
          } : function (key) {
            return obj[key];
          };
        };

        // Returns a predicate for checking whether an object has a given set of
        // `key:value` pairs.
        underscorejs.matcher = underscorejs.matches = function (attrs) {
          attrs = underscorejs.extendOwn({}, attrs);
          return function (obj) {
            return underscorejs.isMatch(obj, attrs);
          };
        };

        // Run a function **n** times.
        underscorejs.times = function (n, iteratee, context) {
          var accum = Array(Math.max(0, n));
          iteratee = optimizeCb(iteratee, context, 1);
          for (var i = 0; i < n; i++) accum[i] = iteratee(i);
          return accum;
        };

        // Return a random integer between min and max (inclusive).
        underscorejs.random = function (min, max) {
          if (max == null) {
            max = min;
            min = 0;
          }
          return min + Math.floor(Math.random() * (max - min + 1));
        };

        // A (possibly faster) way to get the current timestamp as an integer.
        underscorejs.now = Date.now || function () {
            return new Date().getTime();
          };

        // List of HTML entities for escaping.
        var escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '`': '&#x60;'
        };
        var unescapeMap = underscorejs.invert(escapeMap);

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        var createEscaper = function (map) {
          var escaper = function (match) {
            return map[match];
          };
          // Regexes for identifying a key that needs to be escaped
          var source = '(?:' + underscorejs.keys(map).join('|') + ')';
          var testRegexp = RegExp(source);
          var replaceRegexp = RegExp(source, 'g');
          return function (string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
          };
        };
        underscorejs.escape = createEscaper(escapeMap);
        underscorejs.unescape = createEscaper(unescapeMap);

        // If the value of the named `property` is a function then invoke it with the
        // `object` as context; otherwise, return it.
        underscorejs.result = function (object, property, fallback) {
          var value = object == null ? void 0 : object[property];
          if (value === void 0) {
            value = fallback;
          }
          return underscorejs.isFunction(value) ? value.call(object) : value;
        };

        // Generate a unique integer id (unique within the entire client session).
        // Useful for temporary DOM ids.
        var idCounter = 0;
        underscorejs.uniqueId = function (prefix) {
          var id = ++idCounter + '';
          return prefix ? prefix + id : id;
        };

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        underscorejs.templateSettings = {
          evaluate: /<%([\s\S]+?)%>/g,
          interpolate: /<%=([\s\S]+?)%>/g,
          escape: /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /(.)^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
          "'": "'",
          '\\': '\\',
          '\r': 'r',
          '\n': 'n',
          '\u2028': 'u2028',
          '\u2029': 'u2029'
        };

        var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

        var escapeChar = function (match) {
          return '\\' + escapes[match];
        };

        // JavaScript micro-templating, similar to John Resig's implementation.
        // Underscore templating handles arbitrary delimiters, preserves whitespace,
        // and correctly escapes quotes within interpolated code.
        // NB: `oldSettings` only exists for backwards compatibility.
        underscorejs.template = function (text, settings, oldSettings) {
          if (!settings && oldSettings) settings = oldSettings;
          settings = underscorejs.defaults({}, settings, underscorejs.templateSettings);

          // Combine delimiters into one regular expression via alternation.
          var matcher = RegExp([
              (settings.escape || noMatch).source,
              (settings.interpolate || noMatch).source,
              (settings.evaluate || noMatch).source
            ].join('|') + '|$', 'g');

          // Compile the template source, escaping string literals appropriately.
          var index = 0;
          var source = "__p+='";
          text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
              source += "'+\n((__t=(" + escape + "))==null?'':underscorejs.escape(__t))+\n'";
            } else if (interpolate) {
              source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
              source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
          });
          source += "';\n";

          // If a variable is not specified, place data values in local scope.
          if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

          source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + 'return __p;\n';

          try {
            var render = new Function(settings.variable || 'obj', 'underscorejs', source);
          } catch (e) {
            e.source = source;
            throw e;
          }

          var template = function (data) {
            return render.call(this, data, underscorejs);
          };

          // Provide the compiled source as a convenience for precompilation.
          var argument = settings.variable || 'obj';
          template.source = 'function(' + argument + '){\n' + source + '}';

          return template;
        };

        // Add a "chain" function. Start chaining a wrapped Underscore object.
        underscorejs.chain = function (obj) {
          var instance = underscorejs(obj);
          instance._chain = true;
          return instance;
        };

        // OOP
        // ---------------
        // If Underscore is called as a function, it returns a wrapped object that
        // can be used OO-style. This wrapper holds altered versions of all the
        // underscore functions. Wrapped objects may be chained.

        // Helper function to continue chaining intermediate results.
        var result = function (instance, obj) {
          return instance._chain ? underscorejs(obj).chain() : obj;
        };

        // Add your own custom functions to the Underscore object.
        underscorejs.mixin = function (obj) {
          underscorejs.each(underscorejs.functions(obj), function (name) {
            var func = underscorejs[name] = obj[name];
            underscorejs.prototype[name] = function () {
              var args = [this._wrapped];
              push.apply(args, arguments);
              return result(this, func.apply(underscorejs, args));
            };
          });
        };

        // Add all of the Underscore functions to the wrapper object.
        underscorejs.mixin(underscorejs);

        // Add all mutator Array functions to the wrapper.
        underscorejs.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
          var method = ArrayProto[name];
          underscorejs.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
          };
        });

        // Add all accessor Array functions to the wrapper.
        underscorejs.each(['concat', 'join', 'slice'], function (name) {
          var method = ArrayProto[name];
          underscorejs.prototype[name] = function () {
            return result(this, method.apply(this._wrapped, arguments));
          };
        });

        // Extracts the result from a wrapped and chained object.
        underscorejs.prototype.value = function () {
          return this._wrapped;
        };

        // Provide unwrapping proxy for some methods used in engine operations
        // such as arithmetic and JSON stringification.
        underscorejs.prototype.valueOf = underscorejs.prototype.toJSON = underscorejs.prototype.value;

        underscorejs.prototype.toString = function () {
          return '' + this._wrapped;
        };

        window.unravelAgent._ = underscorejs;
      })();
    };
  });
