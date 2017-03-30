(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPServer = Package['ddp-server'].DDPServer;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var DDP = Package['ddp-client'].DDP;

/* Package-scope variables */
var PublishRelations;

var require = meteorInstall({"node_modules":{"meteor":{"cottz:publish-relations":{"lib":{"server":{"index.js":["./publish_relations","./methods",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/index.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _publish_relations = require('./publish_relations');                                                               // 1
                                                                                                                       //
var _publish_relations2 = _interopRequireDefault(_publish_relations);                                                  //
                                                                                                                       //
require('./methods');                                                                                                  // 2
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
exports['default'] = _publish_relations2['default'];                                                                   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"handler_controller.js":["babel-runtime/helpers/classCallCheck","meteor/underscore",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/handler_controller.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _underscore = require("meteor/underscore");                                                                        // 1
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
// The aim of handler Controller is to keep all observers that can be created within methods                           //
// its structure is very simple, has a 'handlers' object containing all observers children and                         //
// the observer father is stored within 'handler'                                                                      //
                                                                                                                       //
var HandlerController = function () {                                                                                  //
  function HandlerController() {                                                                                       // 6
    (0, _classCallCheck3["default"])(this, HandlerController);                                                         // 6
                                                                                                                       //
    this.handlers = {};                                                                                                // 7
  }                                                                                                                    // 8
                                                                                                                       //
  HandlerController.prototype.set = function set(handler) {                                                            //
    return this.handler = handler;                                                                                     // 10
  };                                                                                                                   // 11
                                                                                                                       //
  HandlerController.prototype.addBasic = function addBasic(collection, handler) {                                      //
    var oldHandler = this.handlers[collection];                                                                        // 13
    return oldHandler || (this.handlers[collection] = handler || new HandlerController());                             // 14
  };                                                                                                                   // 15
                                                                                                                       //
  HandlerController.prototype.add = function add(cursor, options) {                                                    //
    if (!cursor) throw new Error("you're not sending the cursor");                                                     // 17
                                                                                                                       //
    var description = cursor._cursorDescription;                                                                       // 20
    var collection = options.collection || description.collectionName;                                                 // 21
    var selector = description.selector;                                                                               // 22
                                                                                                                       //
    var oldHandler = this.handlers[collection];                                                                        // 24
    if (oldHandler) {                                                                                                  // 25
      // when the selector equals method stops running, no change occurs and everything                                //
      // will still work properly without running the same observer again                                              //
      oldHandler.equalSelector = _underscore._.isEqual(oldHandler.selector, selector);                                 // 28
      if (oldHandler.equalSelector) return oldHandler;                                                                 // 29
                                                                                                                       //
      oldHandler.stop();                                                                                               // 32
    }                                                                                                                  // 33
                                                                                                                       //
    var newHandler = options.handler ? cursor[options.handler](options.callbacks) : new HandlerController();           // 35
                                                                                                                       //
    newHandler.selector = selector;                                                                                    // 39
                                                                                                                       //
    return this.handlers[collection] = newHandler;                                                                     // 41
  };                                                                                                                   // 42
                                                                                                                       //
  HandlerController.prototype.stop = function stop() {                                                                 //
    var handlers = this.handlers;                                                                                      // 44
                                                                                                                       //
    this.handler && this.handler.stop();                                                                               // 46
                                                                                                                       //
    for (var key in handlers) {                                                                                        // 48
      handlers[key].stop();                                                                                            // 49
    };                                                                                                                 // 50
                                                                                                                       //
    this.handlers = [];                                                                                                // 52
  };                                                                                                                   // 53
                                                                                                                       //
  HandlerController.prototype.remove = function remove(_id) {                                                          //
    var handler = this.handlers[_id];                                                                                  // 55
    if (handler) {                                                                                                     // 56
      handler.stop();                                                                                                  // 57
      delete this.handlers[_id];                                                                                       // 58
    }                                                                                                                  // 59
  };                                                                                                                   // 60
                                                                                                                       //
  return HandlerController;                                                                                            //
}();                                                                                                                   //
                                                                                                                       //
exports["default"] = HandlerController;                                                                                //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"methods.js":["meteor/meteor","meteor/check","meteor/ddp-server",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/methods.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _meteor = require('meteor/meteor');                                                                                // 1
                                                                                                                       //
var _check = require('meteor/check');                                                                                  // 2
                                                                                                                       //
var _ddpServer = require('meteor/ddp-server');                                                                         // 3
                                                                                                                       //
var crossbar = _ddpServer.DDPServer._InvalidationCrossbar;                                                             // 5
                                                                                                                       //
_meteor.Meteor.methods({                                                                                               // 7
  'PR.changePagination': function PRChangePagination(data) {                                                           // 8
    (0, _check.check)(data, {                                                                                          // 9
      _id: String,                                                                                                     // 10
      field: String,                                                                                                   // 11
      skip: _check.Match.Integer                                                                                       // 12
    });                                                                                                                // 9
                                                                                                                       //
    crossbar.fire(_.extend({                                                                                           // 15
      collection: 'paginations',                                                                                       // 16
      id: this.connection.id                                                                                           // 17
    }, data));                                                                                                         // 15
  },                                                                                                                   // 19
  'PR.fireListener': function PRFireListener(collection, options) {                                                    // 20
    (0, _check.check)(collection, String);                                                                             // 21
    (0, _check.check)(options, Object);                                                                                // 22
                                                                                                                       //
    crossbar.fire(_.extend({                                                                                           // 24
      collection: 'listen-' + collection,                                                                              // 25
      id: this.connection.id                                                                                           // 26
    }, options));                                                                                                      // 24
  }                                                                                                                    // 28
});                                                                                                                    // 7
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"publish_relations.js":["meteor/meteor","./handler_controller","./cursor",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/publish_relations.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
exports.PublishRelations = undefined;                                                                                  //
                                                                                                                       //
var _meteor = require('meteor/meteor');                                                                                // 1
                                                                                                                       //
var _handler_controller = require('./handler_controller');                                                             // 2
                                                                                                                       //
var _handler_controller2 = _interopRequireDefault(_handler_controller);                                                //
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 3
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
exports.PublishRelations = PublishRelations = function PublishRelations(name, callback) {                              // 5
  return _meteor.Meteor.publish(name, function () {                                                                    // 6
    var handler = new _handler_controller2['default'](),                                                               // 7
        cursors = new _cursor2['default'](this, handler);                                                              // 7
                                                                                                                       //
    this._publicationName = name;                                                                                      // 10
    this.onStop(function () {                                                                                          // 11
      return handler.stop();                                                                                           // 11
    });                                                                                                                // 11
                                                                                                                       //
    for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {                           // 6
      params[_key] = arguments[_key];                                                                                  // 6
    }                                                                                                                  // 6
                                                                                                                       //
    var cb = callback.apply(_.extend(cursors, this), params);                                                          // 13
    // kadira show me alerts when I use this return (but works well)                                                   //
    // return cb || (!this._ready && this.ready());                                                                    //
    return cb;                                                                                                         // 16
  });                                                                                                                  // 17
};                                                                                                                     // 18
                                                                                                                       //
_meteor.Meteor.publishRelations = PublishRelations;                                                                    // 20
                                                                                                                       //
exports['default'] = PublishRelations;                                                                                 //
exports.PublishRelations = PublishRelations;                                                                           //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"cursor":{"change_parent_doc.js":["./cursor",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/change_parent_doc.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 1
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
// DEPRECATED                                                                                                          //
// designed to change something in the master document while the callbacks are executed                                //
// changes to the document are sent to the main document with the return of the callbacks                              //
_cursor2['default'].prototype.changeParentDoc = function (cursor, callbacks, onRemoved) {                              // 5
  var sub = this.sub;                                                                                                  // 6
  var _id = this._id;                                                                                                  // 7
  var collection = this.collection;                                                                                    // 8
                                                                                                                       //
  var result = this;                                                                                                   // 10
                                                                                                                       //
  if (!_id || !collection) throw new Error("you can't use this method without being within a document");               // 12
                                                                                                                       //
  callbacks = this._getCallbacks(callbacks, onRemoved);                                                                // 15
                                                                                                                       //
  this.handler.add(cursor, {                                                                                           // 17
    handler: 'observeChanges',                                                                                         // 18
    callbacks: {                                                                                                       // 19
      added: function added(id, doc) {                                                                                 // 20
        result._addedWithCPD = callbacks.added(id, doc);                                                               // 21
      },                                                                                                               // 22
      changed: function changed(id, doc) {                                                                             // 23
        var changes = callbacks.changed(id, doc);                                                                      // 24
        if (changes) sub.changed(collection, _id, changes);                                                            // 25
      },                                                                                                               // 27
      removed: function removed(id) {                                                                                  // 28
        var changes = callbacks.removed(id);                                                                           // 29
        if (changes) sub.changed(collection, _id, changes);                                                            // 30
      }                                                                                                                // 32
    }                                                                                                                  // 19
  });                                                                                                                  // 17
                                                                                                                       //
  return result._addedWithCPD || {};                                                                                   // 36
};                                                                                                                     // 37
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"crossbar.js":["meteor/underscore","./cursor","meteor/ddp-server",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/crossbar.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 2
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
var _ddpServer = require('meteor/ddp-server');                                                                         // 3
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
var crossbar = _ddpServer.DDPServer._InvalidationCrossbar;                                                             // 5
// designed to paginate a list, works in conjunction with the methods                                                  //
// do not call back to the main callback, only the array is changed in the collection                                  //
_cursor2['default'].prototype.paginate = function (fieldData, limit, infinite) {                                       // 8
  var sub = this.sub;                                                                                                  // 9
  var collection = this.collection;                                                                                    // 10
                                                                                                                       //
  if (!this._id || !collection) throw new Error("you can't use this method without being within a document");          // 12
                                                                                                                       //
  var field = Object.keys(fieldData)[0];                                                                               // 15
  var copy = _underscore._.clone(fieldData)[field];                                                                    // 16
  var max = copy.length;                                                                                               // 17
  var connectionId = sub.connection.id;                                                                                // 18
                                                                                                                       //
  fieldData[field] = copy.slice(0, limit);                                                                             // 20
                                                                                                                       //
  var listener = crossbar.listen({                                                                                     // 22
    collection: 'paginations',                                                                                         // 23
    id: connectionId                                                                                                   // 24
  }, function (data) {                                                                                                 // 22
    if (!data.id || data.id !== connectionId) return;                                                                  // 26
                                                                                                                       //
    var skip = data.skip;                                                                                              // 28
                                                                                                                       //
    if (skip >= max && !infinite) return;                                                                              // 30
                                                                                                                       //
    fieldData[field] = infinite ? copy.slice(0, skip) : copy.slice(skip, skip + limit);                                // 33
    sub.changed(collection, data._id, fieldData);                                                                      // 34
  });                                                                                                                  // 35
                                                                                                                       //
  this.handler.addBasic(field, listener);                                                                              // 37
                                                                                                                       //
  return fieldData[field];                                                                                             // 39
};                                                                                                                     // 40
                                                                                                                       //
_cursor2['default'].prototype.listen = function (options, callback, run) {                                             // 42
  var sub = this.sub;                                                                                                  // 43
  var name = 'listen-' + this._publicationName;                                                                        // 44
                                                                                                                       //
  var listener = crossbar.listen({                                                                                     // 46
    collection: name,                                                                                                  // 47
    id: sub.connection.id                                                                                              // 48
  }, function (data) {                                                                                                 // 46
    if (!data.id || data.id !== sub.connection.id) return;                                                             // 50
                                                                                                                       //
    _underscore._.extend(options, _underscore._.omit(data, 'collection', 'id'));                                       // 52
    callback(false);                                                                                                   // 53
  });                                                                                                                  // 54
                                                                                                                       //
  var handler = this.handler.addBasic(name);                                                                           // 56
                                                                                                                       //
  if (run !== false) callback(true);                                                                                   // 58
                                                                                                                       //
  return handler.set(listener);                                                                                        // 60
};                                                                                                                     // 61
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"cursor.js":["babel-runtime/helpers/classCallCheck","babel-runtime/helpers/possibleConstructorReturn","babel-runtime/helpers/inherits","meteor/underscore","./nonreactive",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/cursor.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');                          //
                                                                                                                       //
var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);                                 //
                                                                                                                       //
var _inherits2 = require('babel-runtime/helpers/inherits');                                                            //
                                                                                                                       //
var _inherits3 = _interopRequireDefault(_inherits2);                                                                   //
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
var _nonreactive = require('./nonreactive');                                                                           // 2
                                                                                                                       //
var _nonreactive2 = _interopRequireDefault(_nonreactive);                                                              //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
var CursorMethods = function (_CursorMethodsNR) {                                                                      //
  (0, _inherits3['default'])(CursorMethods, _CursorMethodsNR);                                                         //
                                                                                                                       //
  function CursorMethods(sub, handler, _id, collection) {                                                              // 5
    (0, _classCallCheck3['default'])(this, CursorMethods);                                                             // 5
                                                                                                                       //
    var _this = (0, _possibleConstructorReturn3['default'])(this, _CursorMethodsNR.call(this, sub));                   // 5
                                                                                                                       //
    _this.handler = handler;                                                                                           // 8
    _this._id = _id;                                                                                                   // 9
    _this.collection = collection;                                                                                     // 10
    return _this;                                                                                                      // 5
  }                                                                                                                    // 11
                                                                                                                       //
  CursorMethods.prototype.cursor = function cursor(_cursor, collection, callbacks) {                                   //
    var sub = this.sub;                                                                                                // 13
                                                                                                                       //
    if (!_underscore._.isString(collection)) {                                                                         // 15
      callbacks = collection;                                                                                          // 16
      collection = _cursor._getCollectionName();                                                                       // 17
    }                                                                                                                  // 18
                                                                                                                       //
    var handler = this.handler.add(_cursor, { collection: collection });                                               // 20
    if (handler.equalSelector) return handler;                                                                         // 21
                                                                                                                       //
    if (callbacks) callbacks = this._getCallbacks(callbacks);                                                          // 24
                                                                                                                       //
    function applyCallback(id, doc, method) {                                                                          // 27
      var cb = callbacks && callbacks[method];                                                                         // 28
                                                                                                                       //
      if (cb) {                                                                                                        // 30
        var methods = new CursorMethods(sub, handler.addBasic(id), id, collection),                                    // 31
            isChanged = method === 'changed';                                                                          // 31
                                                                                                                       //
        return cb.call(methods, id, doc, isChanged) || doc;                                                            // 34
      } else return doc;                                                                                               // 35
    };                                                                                                                 // 37
                                                                                                                       //
    var observeChanges = _cursor.observeChanges({                                                                      // 39
      added: function added(id, doc) {                                                                                 // 40
        sub.added(collection, id, applyCallback(id, doc, 'added'));                                                    // 41
      },                                                                                                               // 42
      changed: function changed(id, doc) {                                                                             // 43
        sub.changed(collection, id, applyCallback(id, doc, 'changed'));                                                // 44
      },                                                                                                               // 45
      removed: function removed(id) {                                                                                  // 46
        if (callbacks) {                                                                                               // 47
          callbacks.removed(id);                                                                                       // 48
          handler.remove(id);                                                                                          // 49
        }                                                                                                              // 50
                                                                                                                       //
        sub.removed(collection, id);                                                                                   // 52
      }                                                                                                                // 53
    });                                                                                                                // 39
                                                                                                                       //
    return handler.set(observeChanges);                                                                                // 56
  };                                                                                                                   // 57
                                                                                                                       //
  return CursorMethods;                                                                                                //
}(_nonreactive2['default']);                                                                                           //
                                                                                                                       //
exports['default'] = CursorMethods;                                                                                    //
;                                                                                                                      // 58
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"index.js":["./cursor","./join","./observe","./change_parent_doc","./crossbar","./utils",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/index.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 1
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
require('./join');                                                                                                     // 2
                                                                                                                       //
require('./observe');                                                                                                  // 3
                                                                                                                       //
require('./change_parent_doc');                                                                                        // 4
                                                                                                                       //
require('./crossbar');                                                                                                 // 5
                                                                                                                       //
require('./utils');                                                                                                    // 6
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
exports['default'] = _cursor2['default'];                                                                              //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"join.js":["babel-runtime/helpers/classCallCheck","meteor/underscore","./cursor",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/join.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
var _cursor2 = require('./cursor');                                                                                    // 2
                                                                                                                       //
var _cursor3 = _interopRequireDefault(_cursor2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
_cursor3['default'].prototype.join = function () {                                                                     // 4
  for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {                             // 4
    params[_key] = arguments[_key];                                                                                    // 4
  }                                                                                                                    // 4
                                                                                                                       //
  return new (Function.prototype.bind.apply(CursorJoin, [null].concat([this], params)))();                             // 5
};                                                                                                                     // 6
                                                                                                                       //
var CursorJoin = function () {                                                                                         //
  function CursorJoin(methods, collection, options, name) {                                                            // 9
    (0, _classCallCheck3['default'])(this, CursorJoin);                                                                // 9
                                                                                                                       //
    this.methods = methods;                                                                                            // 10
    this.collection = collection;                                                                                      // 11
    this.options = options;                                                                                            // 12
    this.name = name;                                                                                                  // 13
                                                                                                                       //
    this.data = [];                                                                                                    // 15
    this.sent = false;                                                                                                 // 16
  }                                                                                                                    // 17
                                                                                                                       //
  CursorJoin.prototype.push = function push() {                                                                        //
    var _this = this;                                                                                                  // 18
                                                                                                                       //
    var changed = void 0;                                                                                              // 19
                                                                                                                       //
    for (var _len2 = arguments.length, _ids = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {                       // 18
      _ids[_key2] = arguments[_key2];                                                                                  // 18
    }                                                                                                                  // 18
                                                                                                                       //
    _underscore._.each(_ids, function (_id) {                                                                          // 21
      if (!_id || _underscore._.contains(_this.data, _id)) return;                                                     // 22
                                                                                                                       //
      _this.data.push(_id);                                                                                            // 25
      changed = true;                                                                                                  // 26
    });                                                                                                                // 27
                                                                                                                       //
    if (this.sent && changed) return this._cursor();                                                                   // 29
  };                                                                                                                   // 31
                                                                                                                       //
  CursorJoin.prototype.send = function send() {                                                                        //
    this.sent = true;                                                                                                  // 33
    if (!this.data.length) return;                                                                                     // 34
                                                                                                                       //
    return this._cursor();                                                                                             // 36
  };                                                                                                                   // 37
                                                                                                                       //
  CursorJoin.prototype._selector = function _selector() {                                                              //
    var _id = { $in: this.data };                                                                                      // 39
    return _underscore._.isFunction(this.selector) ? this.selector(_id) : { _id: _id };                                // 40
  };                                                                                                                   // 41
                                                                                                                       //
  CursorJoin.prototype._cursor = function _cursor() {                                                                  //
    return this.methods.cursor(this.collection.find(this._selector(), this.options), this.name);                       // 43
  };                                                                                                                   // 44
                                                                                                                       //
  return CursorJoin;                                                                                                   //
}();                                                                                                                   //
                                                                                                                       //
;                                                                                                                      // 45
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"observe.js":["./cursor",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/observe.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 1
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
_cursor2['default'].prototype.observe = function (cursor, callbacks) {                                                 // 3
  this.handler.add(cursor, {                                                                                           // 4
    handler: 'observe',                                                                                                // 5
    callbacks: callbacks                                                                                               // 6
  });                                                                                                                  // 4
};                                                                                                                     // 8
                                                                                                                       //
_cursor2['default'].prototype.observeChanges = function (cursor, callbacks) {                                          // 10
  this.handler.add(cursor, {                                                                                           // 11
    handler: 'observeChanges',                                                                                         // 12
    callbacks: callbacks                                                                                               // 13
  });                                                                                                                  // 11
};                                                                                                                     // 15
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"utils.js":["meteor/underscore","./cursor",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/utils.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 2
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
function getCB(cb, method) {                                                                                           // 4
  var callback = cb[method];                                                                                           // 5
  if (callback && !_underscore._.isFunction(callback)) throw new Error(method + ' should be a function or undefined');
                                                                                                                       //
  return callback || function () {};                                                                                   // 9
};                                                                                                                     // 10
                                                                                                                       //
_cursor2['default'].prototype._getCallbacks = function (cb, onRemoved) {                                               // 12
  if (_underscore._.isFunction(cb)) {                                                                                  // 13
    return {                                                                                                           // 14
      added: cb,                                                                                                       // 15
      changed: cb,                                                                                                     // 16
      removed: getCB({ onRemoved: onRemoved }, 'onRemoved')                                                            // 17
    };                                                                                                                 // 14
  }                                                                                                                    // 19
                                                                                                                       //
  return {                                                                                                             // 21
    added: getCB(cb, 'added'),                                                                                         // 22
    changed: getCB(cb, 'changed'),                                                                                     // 23
    removed: getCB(cb, 'removed')                                                                                      // 24
  };                                                                                                                   // 21
};                                                                                                                     // 26
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"nonreactive":{"cursor.js":["babel-runtime/helpers/classCallCheck","meteor/underscore",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/cursor.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
var CursorMethodsNR = function () {                                                                                    //
  function CursorMethodsNR(sub) {                                                                                      // 4
    (0, _classCallCheck3['default'])(this, CursorMethodsNR);                                                           // 4
                                                                                                                       //
    this.sub = sub;                                                                                                    // 5
  }                                                                                                                    // 6
                                                                                                                       //
  CursorMethodsNR.prototype.cursorNonreactive = function cursorNonreactive(cursor, collection, onAdded) {              //
    var sub = this.sub;                                                                                                // 8
                                                                                                                       //
    if (!_underscore._.isString(collection)) {                                                                         // 10
      onAdded = collection;                                                                                            // 11
      collection = cursor._getCollectionName();                                                                        // 12
    }                                                                                                                  // 13
    if (!_underscore._.isFunction(onAdded)) onAdded = function onAdded() {};                                           // 14
                                                                                                                       //
    cursor.forEach(function (doc) {                                                                                    // 17
      var _id = doc._id;                                                                                               // 18
      sub.added(collection, _id, onAdded.call(new CursorMethodsNR(sub), _id, doc) || doc);                             // 19
    });                                                                                                                // 20
  };                                                                                                                   // 21
                                                                                                                       //
  return CursorMethodsNR;                                                                                              //
}();                                                                                                                   //
                                                                                                                       //
exports['default'] = CursorMethodsNR;                                                                                  //
;                                                                                                                      // 22
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"index.js":["./cursor","./join",function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/index.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.__esModule = true;                                                                                             //
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 1
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
require('./join');                                                                                                     // 2
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
exports['default'] = _cursor2['default'];                                                                              //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"join.js":["babel-runtime/helpers/classCallCheck","meteor/underscore","./cursor",function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/join.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');                                                //
                                                                                                                       //
var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);                                                       //
                                                                                                                       //
var _underscore = require('meteor/underscore');                                                                        // 1
                                                                                                                       //
var _cursor = require('./cursor');                                                                                     // 2
                                                                                                                       //
var _cursor2 = _interopRequireDefault(_cursor);                                                                        //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }                      //
                                                                                                                       //
_cursor2['default'].prototype.joinNonreactive = function () {                                                          // 4
  for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {                             // 4
    params[_key] = arguments[_key];                                                                                    // 4
  }                                                                                                                    // 4
                                                                                                                       //
  return new (Function.prototype.bind.apply(CursorJoinNonreactive, [null].concat([this.sub], params)))();              // 5
};                                                                                                                     // 6
                                                                                                                       //
var CursorJoinNonreactive = function () {                                                                              //
  function CursorJoinNonreactive(sub, collection, options, name) {                                                     // 9
    (0, _classCallCheck3['default'])(this, CursorJoinNonreactive);                                                     // 9
                                                                                                                       //
    this.sub = sub;                                                                                                    // 10
    this.collection = collection;                                                                                      // 11
    this.options = options;                                                                                            // 12
    this.name = name || collection._name;                                                                              // 13
                                                                                                                       //
    this.data = [];                                                                                                    // 15
    this.sent = false;                                                                                                 // 16
  }                                                                                                                    // 17
                                                                                                                       //
  CursorJoinNonreactive.prototype._selector = function _selector() {                                                   //
    var _id = arguments.length <= 0 || arguments[0] === undefined ? { $in: this.data } : arguments[0];                 // 18
                                                                                                                       //
    return _underscore._.isFunction(this.selector) ? this.selector(_id) : { _id: _id };                                // 19
  };                                                                                                                   // 20
                                                                                                                       //
  CursorJoinNonreactive.prototype.push = function push() {                                                             //
    var _this = this;                                                                                                  // 21
                                                                                                                       //
    var newIds = [];                                                                                                   // 22
                                                                                                                       //
    for (var _len2 = arguments.length, _ids = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {                       // 21
      _ids[_key2] = arguments[_key2];                                                                                  // 21
    }                                                                                                                  // 21
                                                                                                                       //
    _underscore._.each(_ids, function (_id) {                                                                          // 24
      if (!_id || _underscore._.contains(_this.data, _id)) return;                                                     // 25
                                                                                                                       //
      _this.data.push(_id);                                                                                            // 28
      newIds.push(_id);                                                                                                // 29
    });                                                                                                                // 30
                                                                                                                       //
    if (this.sent && newIds.length) return this.added(newIds.length > 1 ? { $in: newIds } : newIds[0]);                // 32
  };                                                                                                                   // 34
                                                                                                                       //
  CursorJoinNonreactive.prototype.send = function send() {                                                             //
    this.sent = true;                                                                                                  // 36
    if (!this.data.length) return;                                                                                     // 37
                                                                                                                       //
    return this.added();                                                                                               // 39
  };                                                                                                                   // 40
                                                                                                                       //
  CursorJoinNonreactive.prototype.added = function added(_id) {                                                        //
    var _this2 = this;                                                                                                 // 41
                                                                                                                       //
    this.collection.find(this._selector(_id), this.options).forEach(function (doc) {                                   // 42
      _this2.sub.added(_this2.name, doc._id, _underscore._.omit(doc, '_id'));                                          // 43
    });                                                                                                                // 44
  };                                                                                                                   // 45
                                                                                                                       //
  return CursorJoinNonreactive;                                                                                        //
}();                                                                                                                   //
                                                                                                                       //
;                                                                                                                      // 46
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]}}}}}}}},{"extensions":[".js",".json"]});
var exports = require("./node_modules/meteor/cottz:publish-relations/lib/server/index.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['cottz:publish-relations'] = exports, {
  PublishRelations: PublishRelations
});

})();

//# sourceMappingURL=cottz_publish-relations.js.map
