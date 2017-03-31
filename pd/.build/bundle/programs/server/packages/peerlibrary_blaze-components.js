(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var EJSON = Package.ejson.EJSON;
var Spacebars = Package.spacebars.Spacebars;
var BaseComponent = Package['peerlibrary:base-component'].BaseComponent;
var BaseComponentDebug = Package['peerlibrary:base-component'].BaseComponentDebug;
var assert = Package['peerlibrary:assert'].assert;
var ReactiveField = Package['peerlibrary:reactive-field'].ReactiveField;
var ComputedField = Package['peerlibrary:computed-field'].ComputedField;
var HTML = Package.htmljs.HTML;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare, BlazeComponent, BlazeComponentDebug;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/peerlibrary_blaze-components/packages/peerlibrary_blaze-components.js                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/peerlibrary:blaze-components/lookup.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* This file backports Blaze lookup.js from Meteor 1.2 so that required                                               // 1
   Blaze features to support Blaze Components are available also in                                                   // 2
   older Meteor versions.                                                                                             // 3
                                                                                                                      // 4
   TODO: Remove this file eventually.                                                                                 // 5
 */                                                                                                                   // 6
                                                                                                                      // 7
// Check if we are not running Meteor 1.2+.                                                                           // 8
if (! Blaze._getTemplate) {                                                                                           // 9
  // If `x` is a function, binds the value of `this` for that function                                                // 10
  // to the current data context.                                                                                     // 11
  var bindDataContext = function (x) {                                                                                // 12
    if (typeof x === 'function') {                                                                                    // 13
      return function () {                                                                                            // 14
        var data = Blaze.getData();                                                                                   // 15
        if (data == null)                                                                                             // 16
          data = {};                                                                                                  // 17
        return x.apply(data, arguments);                                                                              // 18
      };                                                                                                              // 19
    }                                                                                                                 // 20
    return x;                                                                                                         // 21
  };                                                                                                                  // 22
                                                                                                                      // 23
  Blaze._getTemplateHelper = function (template, name, tmplInstanceFunc) {                                            // 24
    // XXX COMPAT WITH 0.9.3                                                                                          // 25
    var isKnownOldStyleHelper = false;                                                                                // 26
                                                                                                                      // 27
    if (template.__helpers.has(name)) {                                                                               // 28
      var helper = template.__helpers.get(name);                                                                      // 29
      if (helper === Blaze._OLDSTYLE_HELPER) {                                                                        // 30
        isKnownOldStyleHelper = true;                                                                                 // 31
      } else if (helper != null) {                                                                                    // 32
        return wrapHelper(bindDataContext(helper), tmplInstanceFunc);                                                 // 33
      } else {                                                                                                        // 34
        return null;                                                                                                  // 35
      }                                                                                                               // 36
    }                                                                                                                 // 37
                                                                                                                      // 38
    // old-style helper                                                                                               // 39
    if (name in template) {                                                                                           // 40
      // Only warn once per helper                                                                                    // 41
      if (!isKnownOldStyleHelper) {                                                                                   // 42
        template.__helpers.set(name, Blaze._OLDSTYLE_HELPER);                                                         // 43
        if (!template._NOWARN_OLDSTYLE_HELPERS) {                                                                     // 44
          Blaze._warn('Assigning helper with `' + template.viewName + '.' +                                           // 45
            name + ' = ...` is deprecated.  Use `' + template.viewName +                                              // 46
            '.helpers(...)` instead.');                                                                               // 47
        }                                                                                                             // 48
      }                                                                                                               // 49
      if (template[name] != null) {                                                                                   // 50
        return wrapHelper(bindDataContext(template[name]), tmplInstanceFunc);                                         // 51
      }                                                                                                               // 52
    }                                                                                                                 // 53
                                                                                                                      // 54
    return null;                                                                                                      // 55
  };                                                                                                                  // 56
                                                                                                                      // 57
  var wrapHelper = function (f, templateFunc) {                                                                       // 58
    // XXX COMPAT WITH METEOR 1.0.3.2                                                                                 // 59
    if (!Blaze.Template._withTemplateInstanceFunc) {                                                                  // 60
      return Blaze._wrapCatchingExceptions(f, 'template helper');                                                     // 61
    }                                                                                                                 // 62
                                                                                                                      // 63
    if (typeof f !== "function") {                                                                                    // 64
      return f;                                                                                                       // 65
    }                                                                                                                 // 66
                                                                                                                      // 67
    return function () {                                                                                              // 68
      var self = this;                                                                                                // 69
      var args = arguments;                                                                                           // 70
                                                                                                                      // 71
      return Blaze.Template._withTemplateInstanceFunc(templateFunc, function () {                                     // 72
        return Blaze._wrapCatchingExceptions(f, 'template helper').apply(self, args);                                 // 73
      });                                                                                                             // 74
    };                                                                                                                // 75
  };                                                                                                                  // 76
                                                                                                                      // 77
  // templateInstance argument is provided to be available for possible                                               // 78
  // alternative implementations of this function by 3rd party packages.                                              // 79
  Blaze._getTemplate = function (name, templateInstance) {                                                            // 80
    if ((name in Blaze.Template) && (Blaze.Template[name] instanceof Blaze.Template)) {                               // 81
      return Blaze.Template[name];                                                                                    // 82
    }                                                                                                                 // 83
    return null;                                                                                                      // 84
  };                                                                                                                  // 85
                                                                                                                      // 86
  Blaze._getGlobalHelper = function (name, templateInstance) {                                                        // 87
    if (Blaze._globalHelpers[name] != null) {                                                                         // 88
      return wrapHelper(bindDataContext(Blaze._globalHelpers[name]), templateInstance);                               // 89
    }                                                                                                                 // 90
    return null;                                                                                                      // 91
  };                                                                                                                  // 92
                                                                                                                      // 93
  Blaze.View.prototype.lookup = function (name, _options) {                                                           // 94
    var template = this.template;                                                                                     // 95
    var lookupTemplate = _options && _options.template;                                                               // 96
    var helper;                                                                                                       // 97
    var binding;                                                                                                      // 98
    var boundTmplInstance;                                                                                            // 99
    var foundTemplate;                                                                                                // 100
                                                                                                                      // 101
    if (this.templateInstance) {                                                                                      // 102
      boundTmplInstance = _.bind(this.templateInstance, this);                                                        // 103
    }                                                                                                                 // 104
                                                                                                                      // 105
    // 0. looking up the parent data context with the special "../" syntax                                            // 106
    if (/^\./.test(name)) {                                                                                           // 107
      // starts with a dot. must be a series of dots which maps to an                                                 // 108
      // ancestor of the appropriate height.                                                                          // 109
      if (!/^(\.)+$/.test(name))                                                                                      // 110
        throw new Error("id starting with dot must be a series of dots");                                             // 111
                                                                                                                      // 112
      return Blaze._parentData(name.length - 1, true /*_functionWrapped*/);                                           // 113
                                                                                                                      // 114
    }                                                                                                                 // 115
                                                                                                                      // 116
    // 1. look up a helper on the current template                                                                    // 117
    if (template && ((helper = Blaze._getTemplateHelper(template, name, boundTmplInstance)) != null)) {               // 118
      return helper;                                                                                                  // 119
    }                                                                                                                 // 120
                                                                                                                      // 121
    // 2. look up a binding by traversing the lexical view hierarchy inside the                                       // 122
    // current template                                                                                               // 123
    /*if (template && (binding = Blaze._lexicalBindingLookup(Blaze.currentView, name)) != null) {                     // 124
      return binding;                                                                                                 // 125
    }*/                                                                                                               // 126
                                                                                                                      // 127
    // 3. look up a template by name                                                                                  // 128
    if (lookupTemplate && ((foundTemplate = Blaze._getTemplate(name, boundTmplInstance)) != null)) {                  // 129
      return foundTemplate;                                                                                           // 130
    }                                                                                                                 // 131
                                                                                                                      // 132
    // 4. look up a global helper                                                                                     // 133
    if ((helper = Blaze._getGlobalHelper(name, boundTmplInstance)) != null) {                                         // 134
      return helper;                                                                                                  // 135
    }                                                                                                                 // 136
                                                                                                                      // 137
    // 5. look up in a data context                                                                                   // 138
    return function () {                                                                                              // 139
      var isCalledAsFunction = (arguments.length > 0);                                                                // 140
      var data = Blaze.getData();                                                                                     // 141
      var x = data && data[name];                                                                                     // 142
      if (!x) {                                                                                                       // 143
        if (lookupTemplate) {                                                                                         // 144
          throw new Error("No such template: " + name);                                                               // 145
        } else if (isCalledAsFunction) {                                                                              // 146
          throw new Error("No such function: " + name);                                                               // 147
        } /*else if (name.charAt(0) === '@' && ((x === null) ||                                                       // 148
          (x === undefined))) {                                                                                       // 149
          // Throw an error if the user tries to use a `@directive`                                                   // 150
          // that doesn't exist.  We don't implement all directives                                                   // 151
          // from Handlebars, so there's a potential for confusion                                                    // 152
          // if we fail silently.  On the other hand, we want to                                                      // 153
          // throw late in case some app or package wants to provide                                                  // 154
          // a missing directive.                                                                                     // 155
          throw new Error("Unsupported directive: " + name);                                                          // 156
        }*/                                                                                                           // 157
      }                                                                                                               // 158
      if (!data) {                                                                                                    // 159
        return null;                                                                                                  // 160
      }                                                                                                               // 161
      if (typeof x !== 'function') {                                                                                  // 162
        if (isCalledAsFunction) {                                                                                     // 163
          throw new Error("Can't call non-function: " + x);                                                           // 164
        }                                                                                                             // 165
        return x;                                                                                                     // 166
      }                                                                                                               // 167
      return x.apply(data, arguments);                                                                                // 168
    };                                                                                                                // 169
  };                                                                                                                  // 170
}                                                                                                                     // 171
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/peerlibrary:blaze-components/lib.coffee.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ComponentsNamespaceReference, REQUIRE_RENDERED_INSTANCE, SUPPORTS_REACTIVE_INSTANCE, addEvents, bindComponent, bindDataContext, callTemplateBaseHooks, getTemplateBase, getTemplateInstance, getTemplateInstanceFunction, method, methodName, originalDot, originalGetTemplate, originalInclude, registerFirstCreatedHook, registerHooks, templateInstanceToComponent, withTemplateInstanceFunc, wrapHelper, _fn, _ref,                
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

getTemplateInstance = function(view) {
  while (view && !view._templateInstance) {
    view = view.parentView;
  }
  return view != null ? view._templateInstance : void 0;
};

templateInstanceToComponent = function(templateInstanceFunc) {
  var templateInstance;
  templateInstance = typeof templateInstanceFunc === "function" ? templateInstanceFunc() : void 0;
  templateInstance = getTemplateInstance(templateInstance != null ? templateInstance.view : void 0);
  while (templateInstance) {
    if ('component' in templateInstance) {
      return templateInstance.component;
    }
    templateInstance = getTemplateInstance(templateInstance.view.parentView);
  }
  return null;
};

getTemplateInstanceFunction = function(view) {
  var templateInstance;
  templateInstance = getTemplateInstance(view);
  return function() {
    return templateInstance;
  };
};

ComponentsNamespaceReference = (function() {
  function ComponentsNamespaceReference(namespace, templateInstance) {
    this.namespace = namespace;
    this.templateInstance = templateInstance;
  }

  return ComponentsNamespaceReference;

})();

originalDot = Spacebars.dot;

Spacebars.dot = function() {
  var args, value;
  value = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  if (value instanceof ComponentsNamespaceReference) {
    return Blaze._getTemplate("" + value.namespace + "." + (args.join('.')), value.templateInstance);
  }
  return originalDot.apply(null, [value].concat(__slice.call(args)));
};

originalInclude = Spacebars.include;

Spacebars.include = function() {
  var args, templateOrFunction;
  templateOrFunction = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  if (templateOrFunction instanceof ComponentsNamespaceReference) {
    templateOrFunction = Blaze._getTemplate(templateOrFunction.namespace, templateOrFunction.templateInstance);
  }
  return originalInclude.apply(null, [templateOrFunction].concat(__slice.call(args)));
};

Blaze._getTemplateHelper = function(template, name, templateInstance) {
  var component, helper, isKnownOldStyleHelper, mixinOrComponent, _ref, _ref1, _ref2;
  isKnownOldStyleHelper = false;
  if (template.__helpers.has(name)) {
    helper = template.__helpers.get(name);
    if (helper === Blaze._OLDSTYLE_HELPER) {
      isKnownOldStyleHelper = true;
    } else if (helper != null) {
      return wrapHelper(bindDataContext(helper), templateInstance);
    } else {
      return null;
    }
  }
  if (name in template) {
    if (!isKnownOldStyleHelper) {
      template.__helpers.set(name, Blaze._OLDSTYLE_HELPER);
      if (!template._NOWARN_OLDSTYLE_HELPERS) {
        Blaze._warn("Assigning helper with `" + template.viewName + "." + name + " = ...` is deprecated.  Use `" + template.viewName + ".helpers(...)` instead.");
      }
    }
    if (template[name] != null) {
      return wrapHelper(bindDataContext(template[name]), templateInstance);
    } else {
      return null;
    }
  }
  if (!templateInstance) {
    return null;
  }
  if ((_ref = template.viewName) === 'Template.__dynamicWithDataContext' || _ref === 'Template.__dynamic') {
    return null;
  }
  component = Tracker.nonreactive(function() {
    return templateInstanceToComponent(templateInstance);
  });
  if (component) {
    if (mixinOrComponent = component.getFirstWith(null, name)) {
      return wrapHelper(bindComponent(mixinOrComponent, mixinOrComponent[name]), templateInstance);
    }
  }
  if (name && name in BlazeComponent.components) {
    return new ComponentsNamespaceReference(name, templateInstance);
  }
  if (component) {
    if ((helper = (_ref1 = component._componentInternals) != null ? (_ref2 = _ref1.templateBase) != null ? _ref2.__helpers.get(name) : void 0 : void 0) != null) {
      return wrapHelper(bindDataContext(helper), templateInstance);
    }
  }
  return null;
};

bindComponent = function(component, helper) {
  if (_.isFunction(helper)) {
    return _.bind(helper, component);
  } else {
    return helper;
  }
};

bindDataContext = function(helper) {
  if (_.isFunction(helper)) {
    return function() {
      var data;
      data = Blaze.getData();
      if (data == null) {
        data = {};
      }
      return helper.apply(data, arguments);
    };
  } else {
    return helper;
  }
};

wrapHelper = function(f, templateFunc) {
  if (!Blaze.Template._withTemplateInstanceFunc) {
    return Blaze._wrapCatchingExceptions(f, 'template helper');
  }
  if (!_.isFunction(f)) {
    return f;
  }
  return function() {
    var args, self;
    self = this;
    args = arguments;
    return Blaze.Template._withTemplateInstanceFunc(templateFunc, function() {
      return Blaze._wrapCatchingExceptions(f, 'template helper').apply(self, args);
    });
  };
};

if (Blaze.Template._withTemplateInstanceFunc) {
  withTemplateInstanceFunc = Blaze.Template._withTemplateInstanceFunc;
} else {
  withTemplateInstanceFunc = function(templateInstance, f) {
    return f();
  };
}

getTemplateBase = function(component) {
  return Tracker.nonreactive(function() {
    var componentTemplate, templateBase;
    componentTemplate = component.template();
    if (_.isString(componentTemplate)) {
      templateBase = Template[componentTemplate];
      if (!templateBase) {
        throw new Error("Template '" + componentTemplate + "' cannot be found.");
      }
    } else if (componentTemplate) {
      templateBase = componentTemplate;
    } else {
      throw new Error("Template for the component '" + (component.componentName() || 'unnamed') + "' not provided.");
    }
    return templateBase;
  });
};

callTemplateBaseHooks = function(component, hookName) {
  var callbacks, templateInstance;
  if (component._componentInternals == null) {
    component._componentInternals = {};
  }
  if (!component._componentInternals.templateInstance) {
    return;
  }
  templateInstance = Tracker.nonreactive(function() {
    return component._componentInternals.templateInstance();
  });
  callbacks = component._componentInternals.templateBase._getCallbacks(hookName);
  Template._withTemplateInstanceFunc(function() {
    return templateInstance;
  }, function() {
    var callback, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
      callback = callbacks[_i];
      _results.push(callback.call(templateInstance));
    }
    return _results;
  });
};

addEvents = function(view, component) {
  var eventMap, events, eventsList, handler, spec, _fn, _i, _len;
  eventsList = component.events();
  if (!_.isArray(eventsList)) {
    throw new Error("'events' method from the component '" + (component.componentName() || 'unnamed') + "' did not return a list of event maps.");
  }
  for (_i = 0, _len = eventsList.length; _i < _len; _i++) {
    events = eventsList[_i];
    eventMap = {};
    _fn = function(spec, handler) {
      return eventMap[spec] = function() {
        var args, currentView, event, templateInstance;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        event = args[0];
        currentView = Blaze.getView(event.currentTarget);
        templateInstance = getTemplateInstanceFunction(currentView);
        withTemplateInstanceFunc(templateInstance, function() {
          return Blaze._withCurrentView(currentView, function() {
            return handler.apply(component, args);
          });
        });
      };
    };
    for (spec in events) {
      handler = events[spec];
      _fn(spec, handler);
    }
    Blaze._addEventMap(view, eventMap, view);
  }
};

originalGetTemplate = Blaze._getTemplate;

Blaze._getTemplate = function(name, templateInstance) {
  var template;
  template = Tracker.nonreactive(function() {
    var parentComponent, _ref;
    parentComponent = templateInstanceToComponent(templateInstance);
    return (_ref = BlazeComponent.getComponent(name)) != null ? _ref.renderComponent(parentComponent) : void 0;
  });
  if (template && (template instanceof Blaze.Template || _.isFunction(template))) {
    return template;
  }
  return originalGetTemplate(name);
};

registerHooks = function(template, hooks) {
  if (template.onCreated) {
    template.onCreated(hooks.onCreated);
    template.onRendered(hooks.onRendered);
    return template.onDestroyed(hooks.onDestroyed);
  } else {
    template.created = hooks.onCreated;
    template.rendered = hooks.onRendered;
    return template.destroyed = hooks.onDestroyed;
  }
};

registerFirstCreatedHook = function(template, onCreated) {
  var oldCreated;
  if (template._callbacks) {
    return template._callbacks.created.unshift(onCreated);
  } else {
    oldCreated = template.created;
    return template.created = function() {
      onCreated.call(this);
      return oldCreated != null ? oldCreated.call(this) : void 0;
    };
  }
};

BlazeComponent = (function(_super) {
  __extends(BlazeComponent, _super);

  function BlazeComponent() {
    return BlazeComponent.__super__.constructor.apply(this, arguments);
  }

  BlazeComponent.getComponentForElement = function(domElement) {
    if (!domElement) {
      return null;
    }
    if (domElement.nodeType !== Node.ELEMENT_NODE) {
      throw new Error("Expected DOM element.");
    }
    return templateInstanceToComponent((function(_this) {
      return function() {
        return getTemplateInstance(Blaze.getView(domElement));
      };
    })(this));
  };

  BlazeComponent.prototype.mixins = function() {
    return [];
  };

  BlazeComponent.prototype.mixinParent = function(mixinParent) {
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if (mixinParent) {
      this._componentInternals.mixinParent = mixinParent;
      return this;
    }
    return this._componentInternals.mixinParent || null;
  };

  BlazeComponent.prototype.requireMixin = function(nameOrMixin) {
    var _ref;
    assert((_ref = this._componentInternals) != null ? _ref.mixins : void 0);
    Tracker.nonreactive((function(_this) {
      return function() {
        var mixinInstance, mixinInstanceComponent, _base, _ref1, _ref2, _ref3;
        if (_this.getMixin(nameOrMixin)) {
          return;
        }
        if (_.isString(nameOrMixin)) {
          if (_this.constructor.getComponent) {
            mixinInstanceComponent = _this.constructor.getComponent(nameOrMixin);
          } else {
            mixinInstanceComponent = BlazeComponent.getComponent(nameOrMixin);
          }
          if (!mixinInstanceComponent) {
            throw new Error("Unknown mixin '" + nameOrMixin + "'.");
          }
          mixinInstance = new mixinInstanceComponent();
        } else if (_.isFunction(nameOrMixin)) {
          mixinInstance = new nameOrMixin();
        } else {
          mixinInstance = nameOrMixin;
        }
        _this._componentInternals.mixins.push(mixinInstance);
        if (mixinInstance.mixinParent) {
          mixinInstance.mixinParent(_this);
        }
        if (typeof mixinInstance.createMixins === "function") {
          mixinInstance.createMixins();
        }
        if ((_base = _this._componentInternals).templateInstance == null) {
          _base.templateInstance = new ReactiveField(null, function(a, b) {
            return a === b;
          });
        }
        if (!((_ref1 = _this._componentInternals.templateInstance()) != null ? _ref1.view.isDestroyed : void 0)) {
          if (!_this._componentInternals.inOnCreated && ((_ref2 = _this._componentInternals.templateInstance()) != null ? _ref2.view.isCreated : void 0)) {
            if (typeof mixinInstance.onCreated === "function") {
              mixinInstance.onCreated();
            }
          }
          if (!_this._componentInternals.inOnRendered && ((_ref3 = _this._componentInternals.templateInstance()) != null ? _ref3.view.isRendered : void 0)) {
            return typeof mixinInstance.onRendered === "function" ? mixinInstance.onRendered() : void 0;
          }
        }
      };
    })(this));
    return this;
  };

  BlazeComponent.prototype.createMixins = function() {
    var mixin, _i, _len, _ref;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if (this._componentInternals.mixins) {
      return;
    }
    this._componentInternals.mixins = [];
    _ref = this.mixins();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      mixin = _ref[_i];
      this.requireMixin(mixin);
    }
    return this;
  };

  BlazeComponent.prototype.getMixin = function(nameOrMixin) {
    var mixin, mixinComponentName, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    assert((_ref = this._componentInternals) != null ? _ref.mixins : void 0);
    if (_.isString(nameOrMixin)) {
      _ref1 = this._componentInternals.mixins;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        mixin = _ref1[_i];
        mixinComponentName = (typeof mixin.componentName === "function" ? mixin.componentName() : void 0) || null;
        if (mixinComponentName && mixinComponentName === nameOrMixin) {
          return mixin;
        }
      }
    } else {
      _ref2 = this._componentInternals.mixins;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        mixin = _ref2[_j];
        if (mixin.constructor === nameOrMixin) {
          return mixin;
        } else if (mixin === nameOrMixin) {
          return mixin;
        }
      }
    }
    return null;
  };

  BlazeComponent.prototype.callFirstWith = function() {
    var afterComponentOrMixin, args, mixin, propertyName;
    afterComponentOrMixin = arguments[0], propertyName = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    mixin = this.getFirstWith(afterComponentOrMixin, propertyName);
    if (!mixin) {
      return;
    }
    if (_.isFunction(mixin[propertyName])) {
      return mixin[propertyName].apply(mixin, args);
    } else {
      return mixin[propertyName];
    }
  };

  BlazeComponent.prototype.getFirstWith = function(afterComponentOrMixin, propertyName) {
    var found, mixin, _i, _len, _ref, _ref1;
    assert((_ref = this._componentInternals) != null ? _ref.mixins : void 0);
    if (!afterComponentOrMixin) {
      if (propertyName in this) {
        return this;
      }
      found = true;
    } else if (afterComponentOrMixin && afterComponentOrMixin === this) {
      found = true;
    } else {
      found = false;
    }
    _ref1 = this._componentInternals.mixins;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      mixin = _ref1[_i];
      if (found && propertyName in mixin) {
        return mixin;
      }
      if (mixin === afterComponentOrMixin) {
        found = true;
      }
    }
    return null;
  };

  BlazeComponent.renderComponent = function(parentComponent) {
    return Tracker.nonreactive((function(_this) {
      return function() {
        var componentClass, data, templateInstance;
        componentClass = _this;
        if (Blaze.currentView) {
          data = Template.currentData();
        } else {
          data = null;
        }
        if ((data != null ? data.constructor : void 0) !== share.argumentsConstructor) {
          templateInstance = getTemplateInstanceFunction(Blaze.currentView);
          return withTemplateInstanceFunc(templateInstance, function() {
            var component;
            component = new componentClass();
            return component.renderComponent(parentComponent);
          });
        }
        return function() {
          var currentWith, nonreactiveArguments, reactiveArguments;
          assert(Tracker.active);
          currentWith = Blaze.getView('with');
          reactiveArguments = new ComputedField(function() {
            data = currentWith.dataVar.get();
            assert.equal(data != null ? data.constructor : void 0, share.argumentsConstructor);
            return data._arguments;
          }, EJSON.equals);
          nonreactiveArguments = reactiveArguments();
          return Tracker.nonreactive(function() {
            var template;
            template = Blaze._withCurrentView(Blaze.currentView.parentView.parentView, (function(_this) {
              return function() {
                templateInstance = getTemplateInstanceFunction(Blaze.currentView);
                return withTemplateInstanceFunc(templateInstance, function() {
                  var component;
                  component = (function(func, args, ctor) {
                    ctor.prototype = func.prototype;
                    var child = new ctor, result = func.apply(child, args);
                    return Object(result) === result ? result : child;
                  })(componentClass, nonreactiveArguments, function(){});
                  return component.renderComponent(parentComponent);
                });
              };
            })(this));
            registerFirstCreatedHook(template, function() {
              this.view.originalParentView = this.view.parentView;
              return this.view.parentView = this.view.parentView.parentView.parentView;
            });
            return template;
          });
        };
      };
    })(this));
  };

  BlazeComponent.prototype.renderComponent = function(parentComponent) {
    return Tracker.nonreactive((function(_this) {
      return function() {
        var component, template, templateBase;
        component = _this;
        component.createMixins();
        templateBase = getTemplateBase(component);
        template = new Blaze.Template("BlazeComponent." + (component.componentName() || 'unnamed'), templateBase.renderFunction);
        if (component._componentInternals == null) {
          component._componentInternals = {};
        }
        component._componentInternals.templateBase = templateBase;
        registerHooks(template, {
          onCreated: function() {
            var componentOrMixin, _base, _base1, _base2, _base3, _results;
            if (parentComponent) {
              Tracker.nonreactive((function(_this) {
                return function() {
                  assert(!component.parentComponent());
                  component.parentComponent(parentComponent);
                  return parentComponent.addChildComponent(component);
                };
              })(this));
            }
            this.view._onViewRendered((function(_this) {
              return function() {
                var componentOrMixin, _results;
                if (_this.view.renderCount !== 1) {
                  return;
                }
                componentOrMixin = null;
                _results = [];
                while (componentOrMixin = _this.component.getFirstWith(componentOrMixin, 'events')) {
                  _results.push(addEvents(_this.view, componentOrMixin));
                }
                return _results;
              };
            })(this));
            this.component = component;
            assert(!Tracker.nonreactive((function(_this) {
              return function() {
                var _base;
                return typeof (_base = _this.component._componentInternals).templateInstance === "function" ? _base.templateInstance() : void 0;
              };
            })(this)));
            if ((_base = this.component._componentInternals).templateInstance == null) {
              _base.templateInstance = new ReactiveField(this, function(a, b) {
                return a === b;
              });
            }
            this.component._componentInternals.templateInstance(this);
            if ((_base1 = this.component._componentInternals).isCreated == null) {
              _base1.isCreated = new ReactiveField(true);
            }
            this.component._componentInternals.isCreated(true);
            if ((_base2 = this.component._componentInternals).isRendered == null) {
              _base2.isRendered = new ReactiveField(false);
            }
            this.component._componentInternals.isRendered(false);
            if ((_base3 = this.component._componentInternals).isDestroyed == null) {
              _base3.isDestroyed = new ReactiveField(false);
            }
            this.component._componentInternals.isDestroyed(false);
            try {
              this.component._componentInternals.inOnCreated = true;
              componentOrMixin = null;
              _results = [];
              while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'onCreated')) {
                _results.push(componentOrMixin.onCreated());
              }
              return _results;
            } finally {
              delete this.component._componentInternals.inOnCreated;
            }
          },
          onRendered: function() {
            var componentOrMixin, _base, _results;
            if ((_base = this.component._componentInternals).isRendered == null) {
              _base.isRendered = new ReactiveField(true);
            }
            this.component._componentInternals.isRendered(true);
            Tracker.nonreactive((function(_this) {
              return function() {
                return assert.equal(_this.component._componentInternals.isCreated(), true);
              };
            })(this));
            try {
              this.component._componentInternals.inOnRendered = true;
              componentOrMixin = null;
              _results = [];
              while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'onRendered')) {
                _results.push(componentOrMixin.onRendered());
              }
              return _results;
            } finally {
              delete this.component._componentInternals.inOnRendered;
            }
          },
          onDestroyed: function() {
            return this.autorun((function(_this) {
              return function(computation) {
                if (_this.component.childComponents().length) {
                  return;
                }
                computation.stop();
                return Tracker.nonreactive(function() {
                  var componentOrMixin, _base, _base1;
                  assert.equal(_this.component._componentInternals.isCreated(), true);
                  _this.component._componentInternals.isCreated(false);
                  if ((_base = _this.component._componentInternals).isRendered == null) {
                    _base.isRendered = new ReactiveField(false);
                  }
                  _this.component._componentInternals.isRendered(false);
                  if ((_base1 = _this.component._componentInternals).isDestroyed == null) {
                    _base1.isDestroyed = new ReactiveField(true);
                  }
                  _this.component._componentInternals.isDestroyed(true);
                  componentOrMixin = null;
                  while (componentOrMixin = _this.component.getFirstWith(componentOrMixin, 'onDestroyed')) {
                    componentOrMixin.onDestroyed();
                  }
                  if (parentComponent) {
                    component.parentComponent(null);
                    parentComponent.removeChildComponent(component);
                  }
                  return _this.component._componentInternals.templateInstance(null);
                });
              };
            })(this));
          }
        });
        return template;
      };
    })(this));
  };

  BlazeComponent.prototype.removeComponent = function() {
    if (this.isRendered()) {
      return Blaze.remove(this._componentInternals.templateInstance().view);
    }
  };

  BlazeComponent.prototype.template = function() {
    return this.callFirstWith(this, 'template') || this.constructor.componentName();
  };

  BlazeComponent.prototype.onCreated = function() {
    return callTemplateBaseHooks(this, 'created');
  };

  BlazeComponent.prototype.onRendered = function() {
    return callTemplateBaseHooks(this, 'rendered');
  };

  BlazeComponent.prototype.onDestroyed = function() {
    return callTemplateBaseHooks(this, 'destroyed');
  };

  BlazeComponent.prototype.isCreated = function() {
    var _base;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if ((_base = this._componentInternals).isCreated == null) {
      _base.isCreated = new ReactiveField(false);
    }
    return this._componentInternals.isCreated();
  };

  BlazeComponent.prototype.isRendered = function() {
    var _base;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if ((_base = this._componentInternals).isRendered == null) {
      _base.isRendered = new ReactiveField(false);
    }
    return this._componentInternals.isRendered();
  };

  BlazeComponent.prototype.isDestroyed = function() {
    var _base;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if ((_base = this._componentInternals).isDestroyed == null) {
      _base.isDestroyed = new ReactiveField(false);
    }
    return this._componentInternals.isDestroyed();
  };

  BlazeComponent.prototype.insertDOMElement = function(parent, node, before) {
    if (before == null) {
      before = null;
    }
    if (parent && node && (node.parentNode !== parent || node.nextSibling !== before)) {
      parent.insertBefore(node, before);
    }
  };

  BlazeComponent.prototype.moveDOMElement = function(parent, node, before) {
    if (before == null) {
      before = null;
    }
    if (parent && node && (node.parentNode !== parent || node.nextSibling !== before)) {
      parent.insertBefore(node, before);
    }
  };

  BlazeComponent.prototype.removeDOMElement = function(parent, node) {
    if (parent && node && node.parentNode === parent) {
      parent.removeChild(node);
    }
  };

  BlazeComponent.prototype.events = function() {
    var eventMap, events, handler, spec, templateInstance, view, _fn, _i, _len, _ref, _results;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if (!this._componentInternals.templateInstance) {
      return [];
    }
    view = Tracker.nonreactive((function(_this) {
      return function() {
        return _this._componentInternals.templateInstance().view;
      };
    })(this));
    templateInstance = getTemplateInstanceFunction(view);
    _ref = this._componentInternals.templateBase.__eventMaps;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      events = _ref[_i];
      eventMap = {};
      _fn = function(spec, handler) {
        return eventMap[spec] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return withTemplateInstanceFunc(templateInstance, function() {
            return Blaze._withCurrentView(view, function() {
              return handler.apply(view, args);
            });
          });
        };
      };
      for (spec in events) {
        handler = events[spec];
        _fn(spec, handler);
      }
      _results.push(eventMap);
    }
    return _results;
  };

  BlazeComponent.prototype.data = function() {
    var view, _base, _ref;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    if ((_base = this._componentInternals).templateInstance == null) {
      _base.templateInstance = new ReactiveField(null, function(a, b) {
        return a === b;
      });
    }
    if (view = (_ref = this._componentInternals.templateInstance()) != null ? _ref.view : void 0) {
      return Blaze.getData(view);
    }
    return void 0;
  };

  BlazeComponent.currentData = function() {
    if (Blaze.currentView) {
      return Blaze.getData();
    }
    return void 0;
  };

  BlazeComponent.prototype.currentData = function() {
    return this.constructor.currentData();
  };

  BlazeComponent.prototype.component = function() {
    return this;
  };

  BlazeComponent.currentComponent = function() {
    return Tracker.nonreactive((function(_this) {
      return function() {
        return templateInstanceToComponent(Template.instance);
      };
    })(this));
  };

  BlazeComponent.prototype.currentComponent = function() {
    return this.constructor.currentComponent();
  };

  BlazeComponent.prototype.firstNode = function() {
    if (this.isRendered()) {
      return this._componentInternals.templateInstance().view._domrange.firstNode();
    }
    return void 0;
  };

  BlazeComponent.prototype.lastNode = function() {
    if (this.isRendered()) {
      return this._componentInternals.templateInstance().view._domrange.lastNode();
    }
    return void 0;
  };

  return BlazeComponent;

})(BaseComponent);

SUPPORTS_REACTIVE_INSTANCE = ['subscriptionsReady'];

REQUIRE_RENDERED_INSTANCE = ['$', 'find', 'findAll'];

_ref = Blaze.TemplateInstance.prototype;
_fn = function(methodName, method) {
  if (__indexOf.call(SUPPORTS_REACTIVE_INSTANCE, methodName) >= 0) {
    return BlazeComponent.prototype[methodName] = function() {
      var args, templateInstance, _base;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this._componentInternals == null) {
        this._componentInternals = {};
      }
      if ((_base = this._componentInternals).templateInstance == null) {
        _base.templateInstance = new ReactiveField(null, function(a, b) {
          return a === b;
        });
      }
      if (templateInstance = this._componentInternals.templateInstance()) {
        return templateInstance[methodName].apply(templateInstance, args);
      }
      return void 0;
    };
  } else if (__indexOf.call(REQUIRE_RENDERED_INSTANCE, methodName) >= 0) {
    return BlazeComponent.prototype[methodName] = function() {
      var args, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.isRendered()) {
        return (_ref1 = this._componentInternals.templateInstance())[methodName].apply(_ref1, args);
      }
      return void 0;
    };
  } else {
    return BlazeComponent.prototype[methodName] = function() {
      var args, templateInstance;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      templateInstance = Tracker.nonreactive((function(_this) {
        return function() {
          var _ref1;
          return (_ref1 = _this._componentInternals) != null ? typeof _ref1.templateInstance === "function" ? _ref1.templateInstance() : void 0 : void 0;
        };
      })(this));
      if (!templateInstance) {
        throw new Error("The component has to be created before calling '" + methodName + "'.");
      }
      return templateInstance[methodName].apply(templateInstance, args);
    };
  }
};
for (methodName in _ref) {
  method = _ref[methodName];
  _fn(methodName, method);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/peerlibrary:blaze-components/debug.coffee.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var                     
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

BlazeComponentDebug = (function(_super) {
  __extends(BlazeComponentDebug, _super);

  function BlazeComponentDebug() {
    return BlazeComponentDebug.__super__.constructor.apply(this, arguments);
  }

  BlazeComponentDebug.startComponent = function(component) {
    BlazeComponentDebug.__super__.constructor.startComponent.apply(this, arguments);
    return console.log(component.data());
  };

  BlazeComponentDebug.startMarkedComponent = function(component) {
    BlazeComponentDebug.__super__.constructor.startMarkedComponent.apply(this, arguments);
    return console.log(component.data());
  };

  BlazeComponentDebug.dumpComponentSubtree = function(rootComponentOrElement) {
    if (rootComponentOrElement.nodeType === Node.ELEMENT_NODE) {
      rootComponentOrElement = BlazeComponent.getComponentForElement(rootComponentOrElement);
    }
    return BlazeComponentDebug.__super__.constructor.dumpComponentSubtree.apply(this, arguments);
  };

  BlazeComponentDebug.dumpComponentTree = function(rootComponentOrElement) {
    if (rootComponentOrElement.nodeType === Node.ELEMENT_NODE) {
      rootComponentOrElement = BlazeComponent.getComponentForElement(rootComponentOrElement);
    }
    return BlazeComponentDebug.__super__.constructor.dumpComponentTree.apply(this, arguments);
  };

  BlazeComponentDebug.dumpAllComponents = function() {
    var allRootComponents, rootComponent, _i, _len;
    allRootComponents = [];
    $('*').each((function(_this) {
      return function(i, element) {
        var component, rootComponent;
        component = BlazeComponent.getComponentForElement(element);
        if (!component) {
          return;
        }
        rootComponent = _this.componentRoot(component);
        if (__indexOf.call(allRootComponents, rootComponent) < 0) {
          return allRootComponents.push(rootComponent);
        }
      };
    })(this));
    for (_i = 0, _len = allRootComponents.length; _i < _len; _i++) {
      rootComponent = allRootComponents[_i];
      this.dumpComponentSubtree(rootComponent);
    }
  };

  return BlazeComponentDebug;

})(BaseComponentDebug);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['peerlibrary:blaze-components'] = {}, {
  BlazeComponent: BlazeComponent,
  BlazeComponentDebug: BlazeComponentDebug
});

})();

//# sourceMappingURL=peerlibrary_blaze-components.js.map
