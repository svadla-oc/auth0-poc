(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var DocHead;

var require = meteorInstall({"node_modules":{"meteor":{"kadira:dochead":{"lib":{"both.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/kadira_dochead/lib/both.js                                                                   //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
var FlowRouter = null;                                                                                   // 1
if (Package['kadira:flow-router-ssr']) {                                                                 // 2
  FlowRouter = Package['kadira:flow-router-ssr'].FlowRouter;                                             // 3
}                                                                                                        // 4
                                                                                                         //
if (Meteor.isClient) {                                                                                   // 6
  var titleDependency = new Tracker.Dependency();                                                        // 7
}                                                                                                        // 8
                                                                                                         //
DocHead = {                                                                                              // 10
  currentTitle: null,                                                                                    // 11
  setTitle: function setTitle(title) {                                                                   // 12
    if (Meteor.isClient) {                                                                               // 13
      titleDependency.changed();                                                                         // 14
      document.title = title;                                                                            // 15
    } else {                                                                                             // 16
      this.currentTitle = title;                                                                         // 17
      var titleHtml = '<title>' + title + '</title>';                                                    // 18
      this._addToHead(titleHtml);                                                                        // 19
    }                                                                                                    // 20
  },                                                                                                     // 21
  addMeta: function addMeta(info) {                                                                      // 22
    this._addTag(info, 'meta');                                                                          // 23
  },                                                                                                     // 24
  addLink: function addLink(info) {                                                                      // 25
    this._addTag(info, 'link');                                                                          // 26
  },                                                                                                     // 27
  getTitle: function getTitle() {                                                                        // 28
    if (Meteor.isClient) {                                                                               // 29
      titleDependency.depend();                                                                          // 30
      return document.title;                                                                             // 31
    }                                                                                                    // 32
    return this.currentTitle;                                                                            // 33
  },                                                                                                     // 34
  addLdJsonScript: function addLdJsonScript(jsonObj) {                                                   // 35
    var strObj = JSON.stringify(jsonObj);                                                                // 36
    this._addLdJsonScript(strObj);                                                                       // 37
  },                                                                                                     // 38
  loadScript: function loadScript(url, options, callback) {                                              // 39
    if (Meteor.isClient) {                                                                               // 40
      npmLoadScript(url, options, callback);                                                             // 41
    }                                                                                                    // 42
  },                                                                                                     // 43
  _addTag: function _addTag(info, tag) {                                                                 // 44
    var meta = this._buildTag(info, tag);                                                                // 45
    if (Meteor.isClient) {                                                                               // 46
      document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', meta);                    // 47
    } else {                                                                                             // 48
      this._addToHead(meta);                                                                             // 49
    }                                                                                                    // 50
  },                                                                                                     // 51
  _addToHead: function _addToHead(html) {                                                                // 52
    // only work there is kadira:flow-router-ssr                                                         //
    if (!FlowRouter) {                                                                                   // 54
      return;                                                                                            // 55
    }                                                                                                    // 56
    var ssrContext = FlowRouter.ssrContext.get();                                                        // 57
    if (ssrContext) {                                                                                    // 58
      ssrContext.addToHead(html);                                                                        // 59
    }                                                                                                    // 60
  },                                                                                                     // 61
  _buildTag: function _buildTag(metaInfo, type) {                                                        // 62
    var props = "";                                                                                      // 63
    for (var key in metaInfo) {                                                                          // 64
      props += key + '="' + metaInfo[key] + '" ';                                                        // 65
    }                                                                                                    // 66
    props += 'dochead="1"';                                                                              // 67
    var meta = '<' + type + ' ' + props + '/>';                                                          // 68
    return meta;                                                                                         // 69
  },                                                                                                     // 70
  _addLdJsonScript: function _addLdJsonScript(stringifiedObject) {                                       // 71
    var scriptTag = '<script type="application/ld+json" dochead="1">' + stringifiedObject + '</script>';
    if (Meteor.isClient) {                                                                               // 73
      document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', scriptTag);               // 74
    } else {                                                                                             // 75
      this._addToHead(scriptTag);                                                                        // 76
    }                                                                                                    // 77
  },                                                                                                     // 78
  removeDocHeadAddedTags: function removeDocHeadAddedTags() {                                            // 79
    if (Meteor.isClient) {                                                                               // 80
      var elements = document.querySelectorAll('[dochead="1"]');                                         // 81
      // We use for-of here to loop only over iterable objects                                           //
      for (var _iterator = elements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;                                                                                        // 83
                                                                                                         //
        if (_isArray) {                                                                                  // 83
          if (_i >= _iterator.length) break;                                                             // 83
          _ref = _iterator[_i++];                                                                        // 83
        } else {                                                                                         // 83
          _i = _iterator.next();                                                                         // 83
          if (_i.done) break;                                                                            // 83
          _ref = _i.value;                                                                               // 83
        }                                                                                                // 83
                                                                                                         //
        var element = _ref;                                                                              // 83
                                                                                                         //
        element.parentNode.removeChild(element);                                                         // 84
      }                                                                                                  // 85
    }                                                                                                    // 86
  }                                                                                                      // 87
};                                                                                                       // 10
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{"extensions":[".js",".json"]});
require("./node_modules/meteor/kadira:dochead/lib/both.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['kadira:dochead'] = {}, {
  DocHead: DocHead
});

})();

//# sourceMappingURL=kadira_dochead.js.map
