(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Accounts = Package['accounts-base'].Accounts;
var Random = Package.random.Random;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare, presences, Presence;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/3stack_presence/packages/3stack_presence.js                                    //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/3stack:presence/lib/collection.coffee.js                                    //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
              

presences = new Mongo.Collection('presences');
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/3stack:presence/lib/heartbeat.coffee.js                                     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Heartbeat,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Heartbeat = (function() {
  function Heartbeat(interval) {
    this.interval = interval;
    this.tock = __bind(this.tock, this);
    this.tick = __bind(this.tick, this);
    this.heartbeat = null;
    this.action = null;
    this.started = false;
  }

  Heartbeat.prototype.start = function(action) {
    this.action = action;
    if (this.started) {
      return;
    }
    this.started = true;
    this._enqueue();
  };

  Heartbeat.prototype.stop = function() {
    this.started = false;
    this.action = null;
    this._dequeue();
  };

  Heartbeat.prototype.tick = function() {
    if (typeof this.action === "function") {
      this.action();
    }
  };

  Heartbeat.prototype.tock = function() {
    if (!this.started) {
      return;
    }
    this._dequeue();
    this._enqueue();
  };

  Heartbeat.prototype._dequeue = function() {
    if (this.heartbeat != null) {
      Meteor.clearTimeout(this.heartbeat);
      this.heartbeat = null;
    }
  };

  Heartbeat.prototype._enqueue = function() {
    this.heartbeat = Meteor.setTimeout(this.tick, this.interval);
  };

  return Heartbeat;

})();

this.Heartbeat = Heartbeat;
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/3stack:presence/lib/server/monitor.coffee.js                                //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ServerMonitor,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ServerMonitor = (function() {
  function ServerMonitor() {
    this.pulse = __bind(this.pulse, this);
    this.onStartup = __bind(this.onStartup, this);
    this.serverId = Random.id();
    this.options = {
      heartbeat: false,
      timeout: false,
      hash: null,
      salt: ""
    };
    this.heartbeat = null;
    this.started = false;
    Meteor.startup(this.onStartup);
  }

  ServerMonitor.prototype.configure = function(options) {
    if (this.started) {
      throw new Error("Must configure Presence on the server before Meteor.startup()");
    }
    _.extend(this.options, options);
    if (this.options.heartbeat === false) {
      this.heartbeat = null;
    } else {
      if (!this.options.timeout) {
        this.options.timeout = this.options.heartbeat * 5;
      }
      this.heartbeat = new Heartbeat(this.options.heartbeat);
    }
  };

  ServerMonitor.prototype.generateSessionKey = function() {
    return "" + this.serverId + "-" + (Random.id());
  };

  ServerMonitor.prototype.onStartup = function() {
    this.started = true;
    if (this.heartbeat == null) {
      presences.remove({});
    } else {
      this.serverHeartbeats = new Mongo.Collection('presence.servers');
      this.serverHeartbeats.insert({
        _id: this.serverId,
        lastSeen: new Date()
      });
      this.heartbeat.start(this.pulse);
    }
  };

  ServerMonitor.prototype.pulse = function() {
    var serverIds, verify;
    verify = this.serverHeartbeats.upsert({
      _id: this.serverId
    }, {
      $set: {
        lastSeen: new Date()
      }
    });
    if (verify.insertedId != null) {
      console.warn("Presence: Server Timeout - Presence lost for current connections");
    }
    this.serverHeartbeats.remove({
      lastSeen: {
        $lt: new Date(new Date().getTime() - this.options.timeout)
      }
    });
    serverIds = _.pluck(this.serverHeartbeats.find({}).fetch(), "_id");
    presences.remove({
      serverId: {
        $nin: serverIds
      }
    });
    this.heartbeat.tock();
  };

  ServerMonitor.prototype.hash = function(userId, value) {
    if (this.options.hash !== null) {
      return this.options.hash(userId + this.options.salt, value);
    } else {
      return value;
    }
  };

  return ServerMonitor;

})();

this.ServerMonitor = ServerMonitor;
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/3stack:presence/lib/server/presence.coffee.js                               //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
             

Presence = new ServerMonitor();

Meteor.onConnection(function(connection) {
  var now;
  connection.sessionKey = Presence.generateSessionKey();
  now = new Date();
  presences.insert({
    _id: connection.sessionKey,
    serverId: Presence.serverId,
    clientAddress: connection.clientAddress,
    status: 'connecting',
    connectedAt: now,
    lastSeen: now,
    state: {},
    userId: null
  });
  connection.onClose(function() {
    presences.remove({
      _id: connection.sessionKey
    });
  });
});

Meteor.publish(null, function() {
  var hashedToken;
  presences.update({
    _id: this.connection.sessionKey,
    status: 'connecting'
  }, {
    $set: {
      status: 'connected'
    }
  });
  hashedToken = null;
  if (this.userId != null) {
    hashedToken = Accounts._getLoginToken(this.connection.id);
    hashedToken = Presence.hash(this.userId, hashedToken);
  }
  presences.update({
    _id: this.connection.sessionKey
  }, {
    $set: {
      loginToken: hashedToken,
      userId: this.userId,
      lastSeen: new Date()
    }
  });
  this.ready();
});

Meteor.methods({
  'setPresence': function(state) {
    check(state, Match.Any);
    this.unblock();
    presences.update({
      _id: this.connection.sessionKey
    }, {
      $set: {
        userId: this.userId,
        lastSeen: new Date(),
        state: state,
        status: 'online'
      }
    });
    return null;
  }
});
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['3stack:presence'] = {}, {
  Presence: Presence,
  presences: presences
});

})();

//# sourceMappingURL=3stack_presence.js.map
