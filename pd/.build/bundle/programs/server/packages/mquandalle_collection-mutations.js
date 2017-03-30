(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"mquandalle:collection-mutations":{"mutations.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/mquandalle_collection-mutations/mutations.js                                     //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
Mongo.Collection.prototype.mutations = function (mutations) {                                // 1
  var collection = this;                                                                     // 2
                                                                                             //
  collection.helpers(_.chain(mutations).map(function (action, name) {                        // 4
    return [name, function () {                                                              // 5
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];                                                        // 5
      }                                                                                      // 5
                                                                                             //
      var mutation = action.apply(this, args);                                               // 6
      if (mutation) {                                                                        // 7
        collection.update(this._id, mutation);                                               // 8
      }                                                                                      // 9
    }];                                                                                      // 10
  }).object().value());                                                                      // 11
};                                                                                           // 12
///////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{"extensions":[".js",".json"]});
require("./node_modules/meteor/mquandalle:collection-mutations/mutations.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['mquandalle:collection-mutations'] = {};

})();

//# sourceMappingURL=mquandalle_collection-mutations.js.map
