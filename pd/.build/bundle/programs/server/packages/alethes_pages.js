(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var Tracker = Package.deps.Tracker;
var Deps = Package.deps.Deps;
var _ = Package.underscore._;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var EJSON = Package.ejson.EJSON;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var Log = Package.logging.Log;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var Random = Package.random.Random;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var __coffeescriptShare;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/alethes_pages/lib/pages.coffee.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
                                                                                                                      //
var Pages,                                                                                                            //
    slice = [].slice,                                                                                                 //
    indexOf = [].indexOf || function (item) {                                                                         //
  for (var i = 0, l = this.length; i < l; i++) {                                                                      //
    if (i in this && this[i] === item) return i;                                                                      //
  }return -1;                                                                                                         //
};                                                                                                                    //
                                                                                                                      //
this.__Pages = Pages = function () {                                                                                  //
  Pages.prototype.settings = {                                                                                        //
    dataMargin: [true, Number, 3],                                                                                    //
    divWrapper: [true, Match.OneOf(Match.Optional(String), Match.Optional(Boolean)), "pagesCont"],                    //
    fields: [true, Object, {}],                                                                                       //
    filters: [true, Object, {}],                                                                                      //
    itemTemplate: [true, String, "_pagesItemDefault"],                                                                //
    navShowEdges: [true, Boolean, false],                                                                             //
    navShowFirst: [true, Boolean, true],                                                                              //
    navShowLast: [true, Boolean, true],                                                                               //
    resetOnReload: [true, Boolean, false],                                                                            //
    paginationMargin: [true, Number, 3],                                                                              //
    perPage: [true, Number, 10],                                                                                      //
    route: [true, String, "/page/"],                                                                                  //
    router: [true, Match.Optional(String), void 0],                                                                   //
    routerTemplate: [true, String, "pages"],                                                                          //
    routerLayout: [true, Match.Optional(String), void 0],                                                             //
    sort: [true, Object, {}],                                                                                         //
    auth: [false, Match.Optional(Function), void 0],                                                                  //
    availableSettings: [false, Object, {}],                                                                           //
    fastRender: [false, Boolean, false],                                                                              //
    homeRoute: [false, Match.OneOf(String, Array, Boolean), "/"],                                                     //
    infinite: [false, Boolean, false],                                                                                //
    infiniteItemsLimit: [false, Number, Infinity],                                                                    //
    infiniteTrigger: [false, Number, .9],                                                                             //
    infiniteRateLimit: [false, Number, 1],                                                                            //
    infiniteStep: [false, Number, 10],                                                                                //
    initPage: [false, Number, 1],                                                                                     //
    maxSubscriptions: [false, Number, 20],                                                                            //
    navTemplate: [false, String, "_pagesNavCont"],                                                                    //
    onDeniedSetting: [false, Function, function (k, v, e) {                                                           //
      return typeof console !== "undefined" && console !== null ? console.log("Changing " + k + " not allowed.") : void 0;
    }],                                                                                                               //
    pageCountFrequency: [false, Number, 10000],                                                                       //
    pageSizeLimit: [false, Number, 60],                                                                               //
    pageTemplate: [false, String, "_pagesPageCont"],                                                                  //
    rateLimit: [false, Number, 1],                                                                                    //
    routeSettings: [false, Match.Optional(Function), void 0],                                                         //
    scrollBoxSelector: [String, void 0],                                                                              //
    table: [false, Match.OneOf(Boolean, Object), false],                                                              //
    tableItemTemplate: [false, String, "_pagesTableItem"],                                                            //
    tableTemplate: [false, String, "_pagesTable"],                                                                    //
    templateName: [false, Match.Optional(String), void 0]                                                             //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype._nInstances = 0;                                                                                    //
                                                                                                                      //
  Pages.prototype.collections = {};                                                                                   //
                                                                                                                      //
  Pages.prototype.instances = {};                                                                                     //
                                                                                                                      //
  Pages.prototype.methods = {                                                                                         //
    "CountPages": function () {                                                                                       //
      function CountPages(sub) {                                                                                      //
        var n;                                                                                                        //
        n = sub.get("nPublishedPages");                                                                               //
        if (n != null) {                                                                                              //
          return n;                                                                                                   //
        }                                                                                                             //
        n = Math.ceil(this.Collection.find({                                                                          //
          $and: [sub.get("filters"), sub.get("realFilters") || {}]                                                    //
        }).count() / sub.get("perPage"));                                                                             //
        return n || 1;                                                                                                //
      }                                                                                                               //
                                                                                                                      //
      return CountPages;                                                                                              //
    }(),                                                                                                              //
    "Set": function () {                                                                                              //
      function Set(k, v, sub) {                                                                                       //
        var _k, _v, changes;                                                                                          //
        if (this.settings[k] == null) {                                                                               //
          this.error("invalid-option", "Invalid option name: " + k + ".");                                            //
        }                                                                                                             //
        check(k, String);                                                                                             //
        check(v, this.settings[k][1]);                                                                                //
        check(sub, Match.Where(function (sub) {                                                                       //
          var ref;                                                                                                    //
          return ((ref = sub.connection) != null ? ref.id : void 0) != null;                                          //
        }));                                                                                                          //
        if (!this.availableSettings[k] || _.isFunction(this.availableSettings[k]) && !this.availableSettings[k](v, sub)) {
          this.error("forbidden-option", "Changing " + k + " not allowed.");                                          //
        }                                                                                                             //
        changes = 0;                                                                                                  //
        if (v != null) {                                                                                              //
          changes = this._set(k, v, {                                                                                 //
            cid: sub.connection.id                                                                                    //
          });                                                                                                         //
        } else if (!_.isString(k)) {                                                                                  //
          for (_k in meteorBabelHelpers.sanitizeForInObject(k)) {                                                     //
            _v = k[_k];                                                                                               //
            changes += this.set(_k, _v, {                                                                             //
              cid: sub.connection.id                                                                                  //
            });                                                                                                       //
          }                                                                                                           //
        }                                                                                                             //
        return changes;                                                                                               //
      }                                                                                                               //
                                                                                                                      //
      return Set;                                                                                                     //
    }(),                                                                                                              //
    "Unsubscribe": function () {                                                                                      //
      function Unsubscribe() {                                                                                        //
        var cid, k, ref, sub, subs;                                                                                   //
        cid = arguments[arguments.length - 1].connection.id;                                                          //
        subs = {};                                                                                                    //
        ref = this.subscriptions;                                                                                     //
        for (k in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                      //
          sub = ref[k];                                                                                               //
          if (k === "length" || k === "order") {                                                                      //
            continue;                                                                                                 //
          }                                                                                                           //
          if (sub.connection.id === cid) {                                                                            //
            sub.stop();                                                                                               //
            delete this.subscriptions[k];                                                                             //
          }                                                                                                           //
        }                                                                                                             //
        this.subscriptions.length = 0;                                                                                //
        return true;                                                                                                  //
      }                                                                                                               //
                                                                                                                      //
      return Unsubscribe;                                                                                             //
    }()                                                                                                               //
  };                                                                                                                  //
                                                                                                                      //
  function Pages(collection, settings) {                                                                              //
    if (settings == null) {                                                                                           //
      settings = {};                                                                                                  //
    }                                                                                                                 //
    if (!(this instanceof Meteor.Pagination)) {                                                                       //
      throw new Meteor.Error("missing-new", "The Meteor.Pagination instance has to be initiated with `new`");         //
    }                                                                                                                 //
    this.init = this.beforeFirstReady = true;                                                                         //
    if (this.debug == null) {                                                                                         //
      this.debug = typeof PAGES_DEBUG !== "undefined" && PAGES_DEBUG !== null && PAGES_DEBUG || (typeof process !== "undefined" && process !== null ? process.env.PAGES_DEBUG : void 0);
    }                                                                                                                 //
    this.subscriptions = {                                                                                            //
      length: 0,                                                                                                      //
      order: []                                                                                                       //
    };                                                                                                                //
    this.userSettings = {};                                                                                           //
    this._currentPage = 1;                                                                                            //
    this.setCollection(collection);                                                                                   //
    this.setInitial(settings);                                                                                        //
    this.setDefaults();                                                                                               //
    this.setRouter();                                                                                                 //
    this[(Meteor.isServer ? "server" : "client") + "Init"]();                                                         //
    this.registerInstance();                                                                                          //
    this;                                                                                                             //
  }                                                                                                                   //
                                                                                                                      //
  Pages.prototype.error = function (code, msg) {                                                                      //
    if (code == null) {                                                                                               //
      msg = code;                                                                                                     //
    }                                                                                                                 //
    throw new Meteor.Error(code, msg);                                                                                //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.serverInit = function () {                                                                          //
    var self;                                                                                                         //
    this.setMethods();                                                                                                //
    self = this;                                                                                                      //
    Meteor.onConnection(function (_this) {                                                                            //
      return function (connection) {                                                                                  //
        return connection.onClose(function () {                                                                       //
          return delete _this.userSettings[connection.id];                                                            //
        });                                                                                                           //
      };                                                                                                              //
    }(this));                                                                                                         //
    return Meteor.publish(this.id, function (page) {                                                                  //
      return self.publish.call(self, page, this);                                                                     //
    });                                                                                                               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.clientInit = function () {                                                                          //
    this.requested = {};                                                                                              //
    this.received = {};                                                                                               //
    this.queue = [];                                                                                                  //
    this.nextPageCount = this.now();                                                                                  //
    this.groundDB = Package["ground:db"] != null;                                                                     //
    if (this.infinite) {                                                                                              //
      this.sess("limit", 10);                                                                                         //
      this.lastOffsetHeight = 0;                                                                                      //
    }                                                                                                                 //
    if (this.maxSubscriptions < 1) {                                                                                  //
      this.maxSubscriptions = 1;                                                                                      //
    }                                                                                                                 //
    this.setTemplates();                                                                                              //
    Tracker.autorun(function (_this) {                                                                                //
      return function () {                                                                                            //
        Meteor.status();                                                                                              //
        if (typeof Meteor.userId === "function") {                                                                    //
          Meteor.userId();                                                                                            //
        }                                                                                                             //
        _this.countPages();                                                                                           //
        return _this.reload();                                                                                        //
      };                                                                                                              //
    }(this));                                                                                                         //
    if (this.templateName == null) {                                                                                  //
      this.templateName = this.name;                                                                                  //
    }                                                                                                                 //
    return Template[this.templateName].onRendered(function (_this) {                                                  //
      return function () {                                                                                            //
        if (_this.infinite) {                                                                                         //
          return _this.setInfiniteTrigger();                                                                          //
        }                                                                                                             //
      };                                                                                                              //
    }(this));                                                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.reload = _.throttle(function () {                                                                   //
    this.unsubscribe();                                                                                               //
    return this.countPages(function (_this) {                                                                         //
      return function (total) {                                                                                       //
        var p;                                                                                                        //
        p = _this.currentPage();                                                                                      //
        if (p == null || _this.resetOnReload || p > total) {                                                          //
          p = 1;                                                                                                      //
        }                                                                                                             //
        _this.sess("currentPage", false);                                                                             //
        return _this.sess("currentPage", p);                                                                          //
      };                                                                                                              //
    }(this));                                                                                                         //
  }, 1000, {                                                                                                          //
    trailing: false                                                                                                   //
  });                                                                                                                 //
                                                                                                                      //
  Pages.prototype.unsubscribe = function (page, cid) {                                                                //
    var k, ref, ref1, sub;                                                                                            //
    if (this.beforeFirstReady) {                                                                                      //
      return;                                                                                                         //
    }                                                                                                                 //
    if (page == null) {                                                                                               //
      ref = this.subscriptions;                                                                                       //
      for (k in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                        //
        sub = ref[k];                                                                                                 //
        if (k === "length" || k === "order") {                                                                        //
          continue;                                                                                                   //
        }                                                                                                             //
        sub.stop();                                                                                                   //
        delete this.subscriptions[k];                                                                                 //
      }                                                                                                               //
      this.subscriptions.length = 0;                                                                                  //
      this.initPage = null;                                                                                           //
      this.requested = {};                                                                                            //
      this.received = {};                                                                                             //
      this.queue = [];                                                                                                //
    } else if (Meteor.isServer) {                                                                                     //
      check(cid, String);                                                                                             //
      if ((ref1 = this.subscriptions[cid]) != null ? ref1[page] : void 0) {                                           //
        this.subscriptions[cid][page].stop();                                                                         //
        delete this.subscriptions[cid][page];                                                                         //
        this.subscriptions.length--;                                                                                  //
      }                                                                                                               //
    } else if (this.subscriptions[page]) {                                                                            //
      this.subscriptions[page].stop();                                                                                //
      delete this.subscriptions[page];                                                                                //
      delete this.requested[page];                                                                                    //
      delete this.received[page];                                                                                     //
      this.subscriptions.order = _.without(this.subscriptions.order, Number(page));                                   //
      this.subscriptions.length--;                                                                                    //
    }                                                                                                                 //
    return true;                                                                                                      //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setDefaults = function () {                                                                         //
    var k, ref, results, v;                                                                                           //
    ref = this.settings;                                                                                              //
    results = [];                                                                                                     //
    for (k in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                          //
      v = ref[k];                                                                                                     //
      if (v[2] != null) {                                                                                             //
        results.push(this[k] != null ? this[k] : this[k] = v[2]);                                                     //
      } else {                                                                                                        //
        results.push(void 0);                                                                                         //
      }                                                                                                               //
    }                                                                                                                 //
    return results;                                                                                                   //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.syncSettings = function (cb) {                                                                      //
    var S, k, ref, v;                                                                                                 //
    S = {};                                                                                                           //
    ref = this.settings;                                                                                              //
    for (k in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                          //
      v = ref[k];                                                                                                     //
      if (v[0]) {                                                                                                     //
        S[k] = this[k];                                                                                               //
      }                                                                                                               //
    }                                                                                                                 //
    return this.set(S, cb != null ? {                                                                                 //
      cb: cb.bind(this)                                                                                               //
    } : null);                                                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setMethods = function () {                                                                          //
    var f, n, nm, ref, self;                                                                                          //
    nm = {};                                                                                                          //
    self = this;                                                                                                      //
    ref = this.methods;                                                                                               //
    for (n in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                          //
      f = ref[n];                                                                                                     //
      nm[this.getMethodName(n)] = function (f) {                                                                      //
        return function () {                                                                                          //
          var arg, k, r, v;                                                                                           //
          arg = function () {                                                                                         //
            var results;                                                                                              //
            results = [];                                                                                             //
            for (k in meteorBabelHelpers.sanitizeForInObject(arguments)) {                                            //
              v = arguments[k];                                                                                       //
              results.push(v);                                                                                        //
            }                                                                                                         //
            return results;                                                                                           //
          }.apply(this, arguments);                                                                                   //
          arg.push(this);                                                                                             //
          this.get = _.bind(function (self, k) {                                                                      //
            return self.get(k, this.connection.id);                                                                   //
          }, this, self);                                                                                             //
          r = f.apply(self, arg);                                                                                     //
          return r;                                                                                                   //
        };                                                                                                            //
      }(f);                                                                                                           //
    }                                                                                                                 //
    return Meteor.methods(nm);                                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.getMethodName = function (name) {                                                                   //
    return this.id + "/" + name;                                                                                      //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.call = function () {                                                                                //
    var args, last;                                                                                                   //
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];                                                     //
    check(args, Array);                                                                                               //
    if (args.length < 1) {                                                                                            //
      this.error("method-name-missing", "Method name not provided in a method call.");                                //
    }                                                                                                                 //
    args[0] = this.getMethodName(args[0]);                                                                            //
    last = args.length - 1;                                                                                           //
    if (_.isFunction(args[last])) {                                                                                   //
      args[last] = args[last].bind(this);                                                                             //
    }                                                                                                                 //
    return Meteor.call.apply(this, args);                                                                             //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.sess = function (k, v) {                                                                            //
    if (typeof Session === "undefined" || Session === null) {                                                         //
      return;                                                                                                         //
    }                                                                                                                 //
    k = this.id + "." + k;                                                                                            //
    if (arguments.length === 2) {                                                                                     //
      return Session.set(k, v);                                                                                       //
    } else {                                                                                                          //
      return Session.get(k);                                                                                          //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.get = function (setting, connectionId) {                                                            //
    var ref, ref1;                                                                                                    //
    return (ref = (ref1 = this.userSettings[connectionId]) != null ? ref1[setting] : void 0) != null ? ref : this[setting];
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.set = function () {                                                                                 //
    var _k, _v, ch, k, opts;                                                                                          //
    k = arguments[0], opts = 2 <= arguments.length ? slice.call(arguments, 1) : [];                                   //
    ch = 0;                                                                                                           //
    switch (opts.length) {                                                                                            //
      case 0:                                                                                                         //
        if (_.isObject(k)) {                                                                                          //
          for (_k in meteorBabelHelpers.sanitizeForInObject(k)) {                                                     //
            _v = k[_k];                                                                                               //
            ch += this._set(_k, _v);                                                                                  //
          }                                                                                                           //
        }                                                                                                             //
        break;                                                                                                        //
      case 1:                                                                                                         //
        if (_.isObject(k)) {                                                                                          //
          if (_.isFunction(opts[0])) {                                                                                //
            opts[0] = {                                                                                               //
              cb: opts[0]                                                                                             //
            };                                                                                                        //
          }                                                                                                           //
          for (_k in meteorBabelHelpers.sanitizeForInObject(k)) {                                                     //
            _v = k[_k];                                                                                               //
            ch += this._set(_k, _v, opts[0]);                                                                         //
          }                                                                                                           //
        } else {                                                                                                      //
          check(k, String);                                                                                           //
          ch = this._set(k, opts[0]);                                                                                 //
        }                                                                                                             //
        break;                                                                                                        //
      case 2:                                                                                                         //
        if (_.isFunction(opts[1])) {                                                                                  //
          opts[1] = {                                                                                                 //
            cb: opts[1]                                                                                               //
          };                                                                                                          //
        }                                                                                                             //
        ch = this._set(k, opts[0], opts[1]);                                                                          //
        break;                                                                                                        //
      case 3:                                                                                                         //
        check(opts[1], Object);                                                                                       //
        check(opts[2], Function);                                                                                     //
        opts[2] = {                                                                                                   //
          cb: opts[2]                                                                                                 //
        };                                                                                                            //
        ch = this._set(k, opts[1], opts[2]);                                                                          //
    }                                                                                                                 //
    if (Meteor.isClient && ch) {                                                                                      //
      this.reload();                                                                                                  //
    }                                                                                                                 //
    return ch;                                                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setInitial = function (settings) {                                                                  //
    this.setInitDone = false;                                                                                         //
    this.set(settings);                                                                                               //
    return this.setInitDone = true;                                                                                   //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.sanitizeRegex = function (v) {                                                                      //
    var lis;                                                                                                          //
    if (_.isRegExp(v)) {                                                                                              //
      v = v.toString();                                                                                               //
      lis = v.lastIndexOf("/");                                                                                       //
      v = {                                                                                                           //
        $regex: v.slice(1, lis),                                                                                      //
        $options: v.slice(1 + lis)                                                                                    //
      };                                                                                                              //
    }                                                                                                                 //
    return v;                                                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.sanitizeRegexObj = function (obj) {                                                                 //
    var k, v;                                                                                                         //
    if (_.isRegExp(obj)) {                                                                                            //
      return this.sanitizeRegex(obj);                                                                                 //
    }                                                                                                                 //
    for (k in meteorBabelHelpers.sanitizeForInObject(obj)) {                                                          //
      v = obj[k];                                                                                                     //
      if (_.isRegExp(v)) {                                                                                            //
        obj[k] = this.sanitizeRegex(v);                                                                               //
      } else if ("object" === (typeof v === "undefined" ? "undefined" : _typeof(v))) {                                //
        obj[k] = this.sanitizeRegexObj(v);                                                                            //
      }                                                                                                               //
    }                                                                                                                 //
    return obj;                                                                                                       //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype._set = function (k, v, opts) {                                                                      //
    var base, ch, name1, oldV, ref, ref1, ref2;                                                                       //
    if (opts == null) {                                                                                               //
      opts = {};                                                                                                      //
    }                                                                                                                 //
    check(k, String);                                                                                                 //
    ch = 1;                                                                                                           //
    if (Meteor.isServer || this[k] == null || ((ref = this.settings[k]) != null ? ref[0] : void 0) || opts.init) {    //
      if (((ref1 = this.settings[k]) != null ? ref1[1] : void 0) != null && ((ref2 = this.settings[k]) != null ? ref2[1] : void 0) !== true) {
        check(v, this.settings[k][1]);                                                                                //
      }                                                                                                               //
      this.sanitizeRegexObj(v);                                                                                       //
      oldV = this.get(k, opts != null ? opts.cid : void 0);                                                           //
      if (this.valuesEqual(v, oldV)) {                                                                                //
        return 0;                                                                                                     //
      }                                                                                                               //
      if (Meteor.isClient) {                                                                                          //
        this[k] = v;                                                                                                  //
        if (this.setInitDone) {                                                                                       //
          this.call("Set", k, v, function (e, r) {                                                                    //
            if (e) {                                                                                                  //
              this[k] = oldV;                                                                                         //
              return this.onDeniedSetting.call(this, k, v, e);                                                        //
            }                                                                                                         //
            return typeof opts.cb === "function" ? opts.cb(ch) : void 0;                                              //
          });                                                                                                         //
        }                                                                                                             //
      } else {                                                                                                        //
        if (opts.cid) {                                                                                               //
          if (ch != null) {                                                                                           //
            if ((base = this.userSettings)[name1 = opts.cid] == null) {                                               //
              base[name1] = {};                                                                                       //
            }                                                                                                         //
            this.userSettings[opts.cid][k] = v;                                                                       //
          }                                                                                                           //
        } else {                                                                                                      //
          this[k] = v;                                                                                                //
        }                                                                                                             //
        if (typeof opts.cb === "function") {                                                                          //
          opts.cb(ch);                                                                                                //
        }                                                                                                             //
      }                                                                                                               //
    } else {                                                                                                          //
      this.onDeniedSetting.call(this, k, v);                                                                          //
    }                                                                                                                 //
    return ch;                                                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.valuesEqual = function (v1, v2) {                                                                   //
    if (_.isFunction(v1)) {                                                                                           //
      return _.isFunction(v2) && v1.toString() === v2.toString();                                                     //
    } else {                                                                                                          //
      return _.isEqual(v1, v2);                                                                                       //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setId = function (name) {                                                                           //
    var n;                                                                                                            //
    if (this.templateName) {                                                                                          //
      name = this.templateName;                                                                                       //
    }                                                                                                                 //
    while (name in Pages.prototype.instances) {                                                                       //
      n = name.match(/[0-9]+$/);                                                                                      //
      if (n != null) {                                                                                                //
        name = name.slice(0, name.length - n[0].length) + (parseInt(n) + 1);                                          //
      } else {                                                                                                        //
        name = name + "2";                                                                                            //
      }                                                                                                               //
    }                                                                                                                 //
    this.id = "pages_" + name;                                                                                        //
    return this.name = name;                                                                                          //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.registerInstance = function () {                                                                    //
    Pages.prototype._nInstances++;                                                                                    //
    return Pages.prototype.instances[this.name] = this;                                                               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setCollection = function (collection) {                                                             //
    var e, error;                                                                                                     //
    if ((typeof collection === "undefined" ? "undefined" : _typeof(collection)) === "object") {                       //
      Pages.prototype.collections[collection._name] = collection;                                                     //
      this.Collection = collection;                                                                                   //
    } else {                                                                                                          //
      try {                                                                                                           //
        this.Collection = new Mongo.Collection(collection);                                                           //
        Pages.prototype.collections[collection] = this.Collection;                                                    //
      } catch (error) {                                                                                               //
        e = error;                                                                                                    //
        this.Collection = Pages.prototype.collections[collection];                                                    //
        this.Collection instanceof Mongo.Collection || this.error("collection-inaccessible", "The '" + collection + "' collection was created outside of <Meteor.Pagination>. Pass the collection object instead of the collection's name to the <Meteor.Pagination> constructor.");
      }                                                                                                               //
    }                                                                                                                 //
    return this.setId(this.Collection._name);                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.linkTo = function (page) {                                                                          //
    var params, ref;                                                                                                  //
    if ((ref = Router.current()) != null ? ref.params : void 0) {                                                     //
      params = Router.current().params;                                                                               //
      params.page = page;                                                                                             //
      return Router.routes[this.name + "_page"].path(params);                                                         //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setRouter = function () {                                                                           //
    var init, l, pr, ref, self, t;                                                                                    //
    if (this.router === "iron-router") {                                                                              //
      if (this.route.indexOf(":page") === -1) {                                                                       //
        if (this.route[0] !== "/") {                                                                                  //
          this.route = "/" + this.route;                                                                              //
        }                                                                                                             //
        if (this.route[this.route.length - 1] !== "/") {                                                              //
          this.route += "/";                                                                                          //
        }                                                                                                             //
        pr = this.route = this.route + ":page";                                                                       //
      }                                                                                                               //
      t = this.routerTemplate;                                                                                        //
      l = (ref = this.routerLayout) != null ? ref : void 0;                                                           //
      self = this;                                                                                                    //
      init = true;                                                                                                    //
      Router.map(function () {                                                                                        //
        var hr, j, k, len, ref1, results;                                                                             //
        if (!self.infinite) {                                                                                         //
          this.route(self.name + "_page", {                                                                           //
            path: pr,                                                                                                 //
            template: t,                                                                                              //
            layoutTemplate: l,                                                                                        //
            onBeforeAction: function () {                                                                             //
              function onBeforeAction() {                                                                             //
                var page;                                                                                             //
                page = parseInt(this.params.page);                                                                    //
                if (self.init) {                                                                                      //
                  self.sess("oldPage", page);                                                                         //
                  self.sess("currentPage", page);                                                                     //
                }                                                                                                     //
                if (self.routeSettings != null) {                                                                     //
                  self.routeSettings(this);                                                                           //
                }                                                                                                     //
                Tracker.nonreactive(function (_this) {                                                                //
                  return function () {                                                                                //
                    return self.onNavClick(page);                                                                     //
                  };                                                                                                  //
                }(this));                                                                                             //
                return this.next();                                                                                   //
              }                                                                                                       //
                                                                                                                      //
              return onBeforeAction;                                                                                  //
            }()                                                                                                       //
          });                                                                                                         //
        }                                                                                                             //
        if (self.homeRoute) {                                                                                         //
          if (_.isString(self.homeRoute)) {                                                                           //
            self.homeRoute = [self.homeRoute];                                                                        //
          }                                                                                                           //
          ref1 = self.homeRoute;                                                                                      //
          results = [];                                                                                               //
          for (k = j = 0, len = ref1.length; j < len; k = ++j) {                                                      //
            hr = ref1[k];                                                                                             //
            results.push(this.route(self.name + "_home" + k, {                                                        //
              path: hr,                                                                                               //
              template: t,                                                                                            //
              layoutTemplate: l,                                                                                      //
              onBeforeAction: function () {                                                                           //
                function onBeforeAction() {                                                                           //
                  if (self.routeSettings != null) {                                                                   //
                    self.routeSettings(this);                                                                         //
                  }                                                                                                   //
                  if (self.init) {                                                                                    //
                    self.sess("oldPage", 1);                                                                          //
                    self.sess("currentPage", 1);                                                                      //
                  }                                                                                                   //
                  return this.next();                                                                                 //
                }                                                                                                     //
                                                                                                                      //
                return onBeforeAction;                                                                                //
              }()                                                                                                     //
            }));                                                                                                      //
          }                                                                                                           //
          return results;                                                                                             //
        }                                                                                                             //
      });                                                                                                             //
      if (Meteor.isServer && this.fastRender) {                                                                       //
        self = this;                                                                                                  //
        FastRender.route(pr, function (params) {                                                                      //
          return this.subscribe(self.id, parseInt(params.page));                                                      //
        });                                                                                                           //
        return FastRender.route(this.homeRoute, function () {                                                         //
          return this.subscribe(self.id, 1);                                                                          //
        });                                                                                                           //
      }                                                                                                               //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.isEmpty = function () {                                                                             //
    return this.isReady() && this.Collection.find(_.object([["_" + this.id + "_i", 0]])).count() === 0;               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setPerPage = function () {                                                                          //
    return this.perPage = this.pageSizeLimit < this.perPage ? this.pageSizeLimit : this.perPage;                      //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setTemplates = function () {                                                                        //
    var helpers, i, j, len, name, ref, tn;                                                                            //
    name = this.templateName || this.name;                                                                            //
    if (this.table && this.itemTemplate === "_pagesItemDefault") {                                                    //
      this.itemTemplate = this.tableItemTemplate;                                                                     //
    }                                                                                                                 //
    ref = [this.navTemplate, this.pageTemplate, this.itemTemplate, this.tableTemplate];                               //
    for (j = 0, len = ref.length; j < len; j++) {                                                                     //
      i = ref[j];                                                                                                     //
      tn = this.id + i;                                                                                               //
      Template[tn] = new Blaze.Template("Template." + tn, Template[i].renderFunction);                                //
      Template[tn].__eventMaps = Template[tn].__eventMaps.concat(Template[i].__eventMaps);                            //
      helpers = {                                                                                                     //
        pagesData: this                                                                                               //
      };                                                                                                              //
      _.each(Template[i].__helpers, function (_this) {                                                                //
        return function (helper, name) {                                                                              //
          if (name[0] === " ") {                                                                                      //
            return helpers[name.slice(1)] = _.bind(helper, _this);                                                    //
          }                                                                                                           //
        };                                                                                                            //
      }(this));                                                                                                       //
      Template[tn].helpers(helpers);                                                                                  //
    }                                                                                                                 //
    return Template[name].helpers({                                                                                   //
      pagesData: this,                                                                                                //
      pagesNav: Template[this.id + this.navTemplate],                                                                 //
      pages: Template[this.id + this.pageTemplate]                                                                    //
    });                                                                                                               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.countPages = _.throttle(function (cb) {                                                             //
    var n, ref;                                                                                                       //
    if (!Meteor.status().connected && Package["ground:db"] != null) {                                                 //
      n = ((ref = this.Collection.findOne({}, {                                                                       //
        sort: _.object([["_" + this.id + "_p", -1]])                                                                  //
      })) != null ? ref["_" + this.id + "_p"] : void 0) || 0;                                                         //
      this.setTotalPages(n);                                                                                          //
      return typeof cb === "function" ? cb(n) : void 0;                                                               //
    } else {                                                                                                          //
      return this.call("CountPages", function (_this) {                                                               //
        return function (e, r) {                                                                                      //
          var now;                                                                                                    //
          if (e != null) {                                                                                            //
            throw e;                                                                                                  //
          }                                                                                                           //
          _this.setTotalPages(r);                                                                                     //
          now = _this.now();                                                                                          //
          if (_this.nextPageCount < now) {                                                                            //
            _this.nextPageCount = now + _this.pageCountFrequency;                                                     //
            setTimeout(_.bind(_this.countPages, _this), _this.pageCountFrequency);                                    //
          }                                                                                                           //
          return typeof cb === "function" ? cb(r) : void 0;                                                           //
        };                                                                                                            //
      }(this));                                                                                                       //
    }                                                                                                                 //
  }, 1000);                                                                                                           //
                                                                                                                      //
  Pages.prototype.setTotalPages = function (n) {                                                                      //
    this.sess("totalPages", n);                                                                                       //
    if (this.sess("currentPage") > n) {                                                                               //
      return this.sess("currentPage", 1);                                                                             //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.enforceSubscriptionLimit = function (cid) {                                                         //
    var ref;                                                                                                          //
    if (Meteor.isServer) {                                                                                            //
      check(cid, String);                                                                                             //
      if (((ref = this.subscriptions[cid]) != null ? ref.length : void 0) >= this.maxSubscriptions) {                 //
        return this.error("subscription-limit-reached", "Subscription limit reached. Unable to open a new subscription.");
      }                                                                                                               //
    } else {                                                                                                          //
      while (this.subscriptions.length >= this.maxSubscriptions) {                                                    //
        this.unsubscribe(this.subscriptions.order[0]);                                                                //
      }                                                                                                               //
      return true;                                                                                                    //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.publish = function (page, sub) {                                                                    //
    var base, c, cid, get, handle, handle2, init, n, name1, query, self, set;                                         //
    check(page, Number);                                                                                              //
    check(sub, Match.Where(function (s) {                                                                             //
      return s.ready != null;                                                                                         //
    }));                                                                                                              //
    cid = sub.connection.id;                                                                                          //
    init = true;                                                                                                      //
    if ((base = this.subscriptions)[name1 = sub.connection.id] == null) {                                             //
      base[name1] = {                                                                                                 //
        length: 0                                                                                                     //
      };                                                                                                              //
    }                                                                                                                 //
    this.enforceSubscriptionLimit(cid);                                                                               //
    get = sub.get = _.bind(function (cid, k) {                                                                        //
      return this.get(k, cid);                                                                                        //
    }, this, cid);                                                                                                    //
    set = sub.set = _.bind(function (cid, k, v) {                                                                     //
      return this.set(k, v, {                                                                                         //
        cid: cid                                                                                                      //
      });                                                                                                             //
    }, this, cid);                                                                                                    //
    query = _.bind(function (sub, get, set) {                                                                         //
      var c, filters, options, r, ref, ref1, skip;                                                                    //
      if ((ref = this.userSettings[cid]) != null) {                                                                   //
        delete ref.realFilters;                                                                                       //
      }                                                                                                               //
      if ((ref1 = this.userSettings[cid]) != null) {                                                                  //
        delete ref1.nPublishedPages;                                                                                  //
      }                                                                                                               //
      this.setPerPage();                                                                                              //
      skip = (page - 1) * get("perPage");                                                                             //
      if (skip < 0) {                                                                                                 //
        skip = 0;                                                                                                     //
      }                                                                                                               //
      filters = get("filters");                                                                                       //
      options = {                                                                                                     //
        sort: get("sort"),                                                                                            //
        fields: get("fields"),                                                                                        //
        skip: skip,                                                                                                   //
        limit: get("perPage")                                                                                         //
      };                                                                                                              //
      if (this.auth != null) {                                                                                        //
        r = this.auth.call(this, skip, sub);                                                                          //
        if (!r) {                                                                                                     //
          set("nPublishedPages", 0);                                                                                  //
          sub.ready();                                                                                                //
          return this.ready();                                                                                        //
        } else if (_.isNumber(r)) {                                                                                   //
          set("nPublishedPages", r);                                                                                  //
          if (page > r) {                                                                                             //
            sub.ready();                                                                                              //
            return this.ready();                                                                                      //
          }                                                                                                           //
        } else if (_.isArray(r) && r.length === 2) {                                                                  //
          if (_.isFunction(r[0].fetch)) {                                                                             //
            c = r;                                                                                                    //
          } else {                                                                                                    //
            filters = r[0];                                                                                           //
            options = r[1];                                                                                           //
          }                                                                                                           //
        } else if (_.isFunction(r.fetch)) {                                                                           //
          c = r;                                                                                                      //
        }                                                                                                             //
      }                                                                                                               //
      if (!EJSON.equals({}, filters) && !EJSON.equals(get("filters"), filters)) {                                     //
        set("realFilters", filters);                                                                                  //
      }                                                                                                               //
      return c || this.Collection.find(filters, options);                                                             //
    }, this, sub, get, set);                                                                                          //
    c = query();                                                                                                      //
    self = this;                                                                                                      //
    handle = c.observe({                                                                                              //
      addedAt: _.bind(function (sub, query, doc, at) {                                                                //
        var id;                                                                                                       //
        if (init) {                                                                                                   //
          return;                                                                                                     //
        }                                                                                                             //
        doc["_" + this.id + "_p"] = page;                                                                             //
        doc["_" + this.id + "_i"] = at;                                                                               //
        id = doc._id;                                                                                                 //
        delete doc._id;                                                                                               //
        return query().forEach(function (_this) {                                                                     //
          return function (o, i) {                                                                                    //
            if (i === at) {                                                                                           //
              return sub.added(_this.Collection._name, id, doc);                                                      //
            } else {                                                                                                  //
              return sub.changed(_this.Collection._name, o._id, _.object([["_" + _this.id + "_i", i]]));              //
            }                                                                                                         //
          };                                                                                                          //
        }(this));                                                                                                     //
      }, this, sub, query)                                                                                            //
    });                                                                                                               //
    handle2 = c.observeChanges({                                                                                      //
      movedBefore: _.bind(function (sub, query, id, before) {                                                         //
        return query().forEach(function (_this) {                                                                     //
          return function (o, i) {                                                                                    //
            return sub.changed(_this.Collection._name, o._id, _.object([["_" + _this.id + "_i", i]]));                //
          };                                                                                                          //
        }(this));                                                                                                     //
      }, this, sub, query),                                                                                           //
      changed: _.bind(function (sub, query, id, fields) {                                                             //
        var e, error;                                                                                                 //
        try {                                                                                                         //
          return sub.changed(this.Collection._name, id, fields);                                                      //
        } catch (error) {                                                                                             //
          e = error;                                                                                                  //
        }                                                                                                             //
      }, this, sub, query),                                                                                           //
      removed: _.bind(function (sub, query, id) {                                                                     //
        var e, error;                                                                                                 //
        try {                                                                                                         //
          sub.removed(this.Collection._name, id);                                                                     //
          return query().forEach(function (_this) {                                                                   //
            return function (o, i) {                                                                                  //
              return sub.changed(_this.Collection._name, o._id, _.object([["_" + _this.id + "_i", i]]));              //
            };                                                                                                        //
          }(this));                                                                                                   //
        } catch (error) {                                                                                             //
          e = error;                                                                                                  //
        }                                                                                                             //
      }, this, sub, query)                                                                                            //
    });                                                                                                               //
    n = 0;                                                                                                            //
    c.forEach(function (_this) {                                                                                      //
      return function (doc, index, cursor) {                                                                          //
        n++;                                                                                                          //
        doc["_" + _this.id + "_p"] = page;                                                                            //
        doc["_" + _this.id + "_i"] = index;                                                                           //
        return sub.added(_this.Collection._name, doc._id, doc);                                                       //
      };                                                                                                              //
    }(this));                                                                                                         //
    init = false;                                                                                                     //
    sub.onStop(_.bind(function (page) {                                                                               //
      delete this.subscriptions[sub.connection.id][page];                                                             //
      this.subscriptions[sub.connection.id].length--;                                                                 //
      handle.stop();                                                                                                  //
      return handle2.stop();                                                                                          //
    }, this, page));                                                                                                  //
    this.subscriptions[sub.connection.id][page] = sub;                                                                //
    this.subscriptions[sub.connection.id].length++;                                                                   //
    return sub.ready();                                                                                               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.loading = function (p) {                                                                            //
    if (!this.fastRender && p === this.currentPage()) {                                                               //
      return this.sess("ready", false);                                                                               //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.now = function () {                                                                                 //
    return new Date().getTime();                                                                                      //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.log = function () {                                                                                 //
    var a, i, j, len;                                                                                                 //
    a = ["Pages: " + this.name + " -"];                                                                               //
    for (j = 0, len = arguments.length; j < len; j++) {                                                               //
      i = arguments[j];                                                                                               //
      a.push(i);                                                                                                      //
    }                                                                                                                 //
    return this.debug && console.log.apply(console, a);                                                               //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.logRequest = function (p) {                                                                         //
    this.timeLastRequest = this.now();                                                                                //
    this.requesting = p;                                                                                              //
    return this.requested[p] = 1;                                                                                     //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.logResponse = function (p) {                                                                        //
    delete this.requested[p];                                                                                         //
    return this.received[p] = 1;                                                                                      //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.clearQueue = function () {                                                                          //
    return this.queue = [];                                                                                           //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.neighbors = function (page) {                                                                       //
    var d, j, maxMargin, n, np, pp, ref;                                                                              //
    n = [];                                                                                                           //
    if (this.dataMargin === 0 || this.maxSubscriptions < 2) {                                                         //
      return n;                                                                                                       //
    }                                                                                                                 //
    maxMargin = Math.floor((this.maxSubscriptions - 1) / 2);                                                          //
    for (d = j = 1, ref = _.min([maxMargin, this.dataMargin]); 1 <= ref ? j <= ref : j >= ref; d = 1 <= ref ? ++j : --j) {
      np = page + d;                                                                                                  //
      if (np <= this.sess("totalPages")) {                                                                            //
        n.push(np);                                                                                                   //
      }                                                                                                               //
      pp = page - d;                                                                                                  //
      if (pp > 0) {                                                                                                   //
        n.push(pp);                                                                                                   //
      }                                                                                                               //
    }                                                                                                                 //
    return n;                                                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.queueNeighbors = function (page) {                                                                  //
    var j, len, p, ref, results;                                                                                      //
    ref = this.neighbors(page);                                                                                       //
    results = [];                                                                                                     //
    for (j = 0, len = ref.length; j < len; j++) {                                                                     //
      p = ref[j];                                                                                                     //
      if (!this.received[p] && !this.requested[p] && indexOf.call(this.queue, p) < 0) {                               //
        results.push(this.queue.push(p));                                                                             //
      } else {                                                                                                        //
        results.push(void 0);                                                                                         //
      }                                                                                                               //
    }                                                                                                                 //
    return results;                                                                                                   //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.paginationNavItem = function (label, page, disabled, active) {                                      //
    if (active == null) {                                                                                             //
      active = false;                                                                                                 //
    }                                                                                                                 //
    return {                                                                                                          //
      p: label,                                                                                                       //
      n: page,                                                                                                        //
      active: active ? "active" : "",                                                                                 //
      disabled: disabled ? "disabled" : ""                                                                            //
    };                                                                                                                //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.navigationNeighbors = function () {                                                                 //
    var from, i, j, k, len, m, n, p, page, ref, ref1, to, total;                                                      //
    page = this.currentPage();                                                                                        //
    total = this.sess("totalPages");                                                                                  //
    from = page - this.paginationMargin;                                                                              //
    to = page + this.paginationMargin;                                                                                //
    if (from < 1) {                                                                                                   //
      to += 1 - from;                                                                                                 //
      from = 1;                                                                                                       //
    }                                                                                                                 //
    if (to > total) {                                                                                                 //
      from -= to - total;                                                                                             //
      to = total;                                                                                                     //
    }                                                                                                                 //
    if (from < 1) {                                                                                                   //
      from = 1;                                                                                                       //
    }                                                                                                                 //
    if (to > total) {                                                                                                 //
      to = total;                                                                                                     //
    }                                                                                                                 //
    n = [];                                                                                                           //
    if (this.navShowFirst || this.navShowEdges) {                                                                     //
      n.push(this.paginationNavItem("«", 1, page === 1));                                                             //
    }                                                                                                                 //
    n.push(this.paginationNavItem("<", page - 1, page === 1));                                                        //
    for (p = j = ref = from, ref1 = to; ref <= ref1 ? j <= ref1 : j >= ref1; p = ref <= ref1 ? ++j : --j) {           //
      n.push(this.paginationNavItem(p, p, page > total, p === page));                                                 //
    }                                                                                                                 //
    n.push(this.paginationNavItem(">", page + 1, page >= total));                                                     //
    if (this.navShowLast || this.navShowEdges) {                                                                      //
      n.push(this.paginationNavItem("»", total, page >= total));                                                      //
    }                                                                                                                 //
    for (k = m = 0, len = n.length; m < len; k = ++m) {                                                               //
      i = n[k];                                                                                                       //
      n[k]['_p'] = this;                                                                                              //
    }                                                                                                                 //
    return n;                                                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.onNavClick = function (n) {                                                                         //
    if (n <= this.sess("totalPages") && n > 0) {                                                                      //
      Tracker.nonreactive(function (_this) {                                                                          //
        return function () {                                                                                          //
          var cp;                                                                                                     //
          cp = _this.sess("currentPage");                                                                             //
          if (_this.received[cp]) {                                                                                   //
            return _this.sess("oldPage", cp);                                                                         //
          }                                                                                                           //
        };                                                                                                            //
      }(this));                                                                                                       //
      return this.sess("currentPage", n);                                                                             //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.setInfiniteTrigger = function () {                                                                  //
    this.scrollBoxSelector = this.scrollBoxSelector || window;                                                        //
    this.scrollBox = $(this.scrollBoxSelector);                                                                       //
    return this.scrollBox.scroll(_.bind(_.throttle(function () {                                                      //
      var l, oh, t;                                                                                                   //
      t = this.infiniteTrigger;                                                                                       //
      oh = this.scrollBox[0].scrollHeight;                                                                            //
      if (this.lastOffsetHeight != null && this.lastOffsetHeight > oh) {                                              //
        return;                                                                                                       //
      }                                                                                                               //
      this.lastOffsetHeight = oh;                                                                                     //
      if (t > 1) {                                                                                                    //
        l = oh - t;                                                                                                   //
      } else if (t > 0) {                                                                                             //
        l = oh * t;                                                                                                   //
      } else {                                                                                                        //
        return;                                                                                                       //
      }                                                                                                               //
      if (this.scrollBox.scrollTop() + this.scrollBox[0].offsetHeight >= l) {                                         //
        return this.sess("limit", this.sess("limit") + this.infiniteStep);                                            //
                                                                                                                      //
        /*                                                                                                            //
        if @lastPage < @sess "totalPages"                                                                             //
          console.log "i want page #{@lastPage + 1}"                                                                  //
          @sess("currentPage", @lastPage + 1)                                                                         //
         */                                                                                                           //
      }                                                                                                               //
    }, this.infiniteRateLimit * 1000), this));                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.checkQueue = _.throttle(function () {                                                               //
    var cp, i, k, neighbors, ref, results, results1, v;                                                               //
    cp = this.currentPage();                                                                                          //
    neighbors = this.neighbors(cp);                                                                                   //
    if (!this.received[cp]) {                                                                                         //
      this.clearQueue();                                                                                              //
      this.requestPage(cp);                                                                                           //
      cp = String(cp);                                                                                                //
      ref = this.requested;                                                                                           //
      results = [];                                                                                                   //
      for (k in meteorBabelHelpers.sanitizeForInObject(ref)) {                                                        //
        v = ref[k];                                                                                                   //
        if (k !== cp) {                                                                                               //
          if (this.subscriptions[k] != null) {                                                                        //
            this.subscriptions[k].stop();                                                                             //
            delete this.subscriptions[k];                                                                             //
            this.subscriptions.length--;                                                                              //
          }                                                                                                           //
          results.push(delete this.requested[k]);                                                                     //
        } else {                                                                                                      //
          results.push(void 0);                                                                                       //
        }                                                                                                             //
      }                                                                                                               //
      return results;                                                                                                 //
    } else if (this.queue.length) {                                                                                   //
      results1 = [];                                                                                                  //
      while (this.queue.length > 0) {                                                                                 //
        i = this.queue.shift();                                                                                       //
        if (indexOf.call(neighbors, i) >= 0) {                                                                        //
          this.requestPage(i);                                                                                        //
          break;                                                                                                      //
        } else {                                                                                                      //
          results1.push(void 0);                                                                                      //
        }                                                                                                             //
      }                                                                                                               //
      return results1;                                                                                                //
    }                                                                                                                 //
  }, 500);                                                                                                            //
                                                                                                                      //
  Pages.prototype.currentPage = function () {                                                                         //
    if (Meteor.isClient && this.sess("currentPage") != null) {                                                        //
      return this.sess("currentPage");                                                                                //
    } else {                                                                                                          //
      return this._currentPage;                                                                                       //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.isReady = function () {                                                                             //
    return this.sess("ready");                                                                                        //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.ready = function (p) {                                                                              //
    if (p === true || p === this.currentPage() && typeof Session !== "undefined" && Session !== null) {               //
      return this.sess("ready", true);                                                                                //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.checkInitPage = function () {                                                                       //
    var error, ref, ref1, ref2;                                                                                       //
    if (this.init && !this.initPage) {                                                                                //
      if (this.router) {                                                                                              //
        if ((ref = Router.current()) != null) {                                                                       //
          if ((ref1 = ref.route) != null) {                                                                           //
            ref1.getName();                                                                                           //
          }                                                                                                           //
        }                                                                                                             //
        try {                                                                                                         //
          this.initPage = parseInt((ref2 = Router.current().route.params(location.href)) != null ? ref2.page : void 0) || 1;
        } catch (error) {                                                                                             //
          return;                                                                                                     //
        }                                                                                                             //
      } else {                                                                                                        //
        this.initPage = 1;                                                                                            //
      }                                                                                                               //
    }                                                                                                                 //
    this.init = false;                                                                                                //
    this.sess("oldPage", this.initPage);                                                                              //
    return this.sess("currentPage", this.initPage);                                                                   //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.getPage = function (page) {                                                                         //
    var c, n, total;                                                                                                  //
    if (Meteor.isClient) {                                                                                            //
      if (page == null) {                                                                                             //
        page = this.currentPage();                                                                                    //
      }                                                                                                               //
      page = parseInt(page);                                                                                          //
      if (page === NaN) {                                                                                             //
        return;                                                                                                       //
      }                                                                                                               //
      total = this.sess("totalPages");                                                                                //
      if (total === 0) {                                                                                              //
        return this.ready(true);                                                                                      //
      }                                                                                                               //
      if (page <= total) {                                                                                            //
        this.requestPage(page);                                                                                       //
        this.queueNeighbors(page);                                                                                    //
        this.checkQueue();                                                                                            //
      }                                                                                                               //
      if (this.infinite) {                                                                                            //
        n = this.Collection.find({}, {                                                                                //
          fields: this.fields,                                                                                        //
          sort: this.sort                                                                                             //
        }).count();                                                                                                   //
        c = this.Collection.find({}, {                                                                                //
          fields: this.fields,                                                                                        //
          sort: this.sort,                                                                                            //
          skip: n > this.infiniteItemsLimit ? n - this.infiniteItemsLimit : 0,                                        //
          limit: this.sess("limit") || this.infiniteItemsLimit                                                        //
        });                                                                                                           //
      } else {                                                                                                        //
        c = this.Collection.find(_.object([["_" + this.id + "_p", page]]), {                                          //
          fields: this.fields,                                                                                        //
          sort: _.object([["_" + this.id + "_i", 1]])                                                                 //
        });                                                                                                           //
        c.observeChanges({                                                                                            //
          added: function (_this) {                                                                                   //
            return function () {                                                                                      //
              return _this.countPages();                                                                              //
            };                                                                                                        //
          }(this),                                                                                                    //
          removed: function (_this) {                                                                                 //
            return function () {                                                                                      //
                                                                                                                      //
              /* !! */                                                                                                //
              _this.requestPage(_this.sess("currentPage"));                                                           //
              return _this.countPages();                                                                              //
            };                                                                                                        //
          }(this)                                                                                                     //
        });                                                                                                           //
      }                                                                                                               //
      return c.fetch();                                                                                               //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.requestPage = function (page) {                                                                     //
    if (!page || this.requested[page] || this.received[page]) {                                                       //
      return;                                                                                                         //
    }                                                                                                                 //
    this.log("Requesting page " + page);                                                                              //
    this.logRequest(page);                                                                                            //
    if (!Meteor.status().connected && this.groundDB) {                                                                //
      if (this.Collection.findOne(_.object([["_" + this.id + "_p", page]]))) {                                        //
        return this.onPage(page);                                                                                     //
      } else {                                                                                                        //
        return setTimeout(_.bind(function (page) {                                                                    //
          if (this.currentPage() === page && !this.received[page]) {                                                  //
            delete this.requested[page];                                                                              //
            return this.requestPage(page);                                                                            //
          }                                                                                                           //
        }, this, page), 500);                                                                                         //
      }                                                                                                               //
    } else {                                                                                                          //
      this.enforceSubscriptionLimit();                                                                                //
      return Meteor.defer(_.bind(function (page) {                                                                    //
        this.subscriptions[page] = Meteor.subscribe(this.id, page, {                                                  //
          onReady: _.bind(function (page) {                                                                           //
            return this.onPage(page);                                                                                 //
          }, this, page),                                                                                             //
          onError: function (_this) {                                                                                 //
            return function (e) {                                                                                     //
              if (e.error === "subscription-limit-reached") {                                                         //
                return setTimeout(_.bind(function (page) {                                                            //
                  if (this.currentPage() === page && !this.received[page]) {                                          //
                    delete this.requested[page];                                                                      //
                    return this.requestPage(page);                                                                    //
                  }                                                                                                   //
                }, _this, page), 500);                                                                                //
              } else {                                                                                                //
                return _this.error(e.message);                                                                        //
              }                                                                                                       //
            };                                                                                                        //
          }(this)                                                                                                     //
        });                                                                                                           //
        this.subscriptions.order.push(page);                                                                          //
        return this.subscriptions.length++;                                                                           //
      }, this, page));                                                                                                //
    }                                                                                                                 //
  };                                                                                                                  //
                                                                                                                      //
  Pages.prototype.onPage = function (page) {                                                                          //
    this.log("Received page " + page);                                                                                //
    this.beforeFirstReady = false;                                                                                    //
    this.logResponse(page);                                                                                           //
    this.ready(page);                                                                                                 //
    if (this.infinite) {                                                                                              //
      this.lastPage = page;                                                                                           //
    }                                                                                                                 //
    this.countPages();                                                                                                //
    return this.checkQueue();                                                                                         //
  };                                                                                                                  //
                                                                                                                      //
  return Pages;                                                                                                       //
}();                                                                                                                  //
                                                                                                                      //
Meteor.Pagination = Pages;                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['alethes:pages'] = {};

})();
