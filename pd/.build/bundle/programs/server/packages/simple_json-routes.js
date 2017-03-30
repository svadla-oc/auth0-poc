(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var main = Package.webapp.main;
var WebAppInternals = Package.webapp.WebAppInternals;
var _ = Package.underscore._;

/* Package-scope variables */
var JsonRoutes;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/simple_json-routes/packages/simple_json-routes.js                           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/simple:json-routes/json-routes.js                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
/* global JsonRoutes:true */                                                     // 1
                                                                                 // 2
var Fiber = Npm.require("fibers");                                               // 3
var connect = Npm.require('connect');                                            // 4
var connectRoute = Npm.require('connect-route');                                 // 5
                                                                                 // 6
JsonRoutes = {};                                                                 // 7
                                                                                 // 8
WebApp.rawConnectHandlers.use(connect.urlencoded());                             // 9
WebApp.rawConnectHandlers.use(connect.json());                                   // 10
WebApp.rawConnectHandlers.use(connect.query());                                  // 11
                                                                                 // 12
// Handler for adding middleware before an endpoint (JsonRoutes.middleWare       // 13
// is just for legacy reasons). Also serves as a namespace for middleware        // 14
// packages to declare their middleware functions.                               // 15
JsonRoutes.Middleware = JsonRoutes.middleWare = connect();                       // 16
WebApp.rawConnectHandlers.use(JsonRoutes.Middleware);                            // 17
                                                                                 // 18
// List of all defined JSON API endpoints                                        // 19
JsonRoutes.routes = [];                                                          // 20
                                                                                 // 21
// Save reference to router for later                                            // 22
var connectRouter;                                                               // 23
                                                                                 // 24
// Register as a middleware                                                      // 25
WebApp.rawConnectHandlers.use(connectRoute(function (router) {                   // 26
  connectRouter = router;                                                        // 27
}));                                                                             // 28
                                                                                 // 29
JsonRoutes.add = function (method, path, handler) {                              // 30
  // Make sure path starts with a slash                                          // 31
  if (path[0] !== "/") {                                                         // 32
    path = "/" + path;                                                           // 33
  }                                                                              // 34
                                                                                 // 35
  // Add to list of known endpoints                                              // 36
  JsonRoutes.routes.push({                                                       // 37
    method: method,                                                              // 38
    path: path                                                                   // 39
  });                                                                            // 40
                                                                                 // 41
  connectRouter[method.toLowerCase()](path, function (req, res, next) {          // 42
    Fiber(function () {                                                          // 43
      try {                                                                      // 44
        handler(req, res, next);                                                 // 45
      } catch (err) {                                                            // 46
        JsonRoutes.sendError(res, getStatusCodeFromError(err), err);             // 47
      }                                                                          // 48
    }).run();                                                                    // 49
  });                                                                            // 50
};                                                                               // 51
                                                                                 // 52
var responseHeaders = {                                                          // 53
  "Cache-Control": "no-store",                                                   // 54
  "Pragma": "no-cache"                                                           // 55
};                                                                               // 56
                                                                                 // 57
JsonRoutes.setResponseHeaders = function (headers) {                             // 58
  responseHeaders = headers;                                                     // 59
};                                                                               // 60
                                                                                 // 61
/**                                                                              // 62
 * Convert `Error` objects to plain response objects suitable                    // 63
 * for serialization.                                                            // 64
 *                                                                               // 65
 * @param {Any} [error] Should be a Meteor.Error or Error object. If anything    // 66
 *   else is passed or this argument isn't provided, a generic                   // 67
 *   "internal-server-error" object is returned                                  // 68
 */                                                                              // 69
JsonRoutes._errorToJson = function (error) {                                     // 70
  if (error instanceof Meteor.Error) {                                           // 71
    return buildErrorResponse(error);                                            // 72
  } else if (error && error.sanitizedError instanceof Meteor.Error) {            // 73
    return buildErrorResponse(error.sanitizedError);                             // 74
  } else {                                                                       // 75
    return {                                                                     // 76
      error: 'internal-server-error',                                            // 77
      reason: 'Internal server error'                                            // 78
    };                                                                           // 79
  }                                                                              // 80
};                                                                               // 81
                                                                                 // 82
/**                                                                              // 83
 * Sets the response headers, status code, and body, and ends it.                // 84
 * The JSON response will be pretty printed if NODE_ENV is `development`.        // 85
 *                                                                               // 86
 * @param {Object} res Response object                                           // 87
 * @param {Number} code HTTP status code.                                        // 88
 * @param {Object|Array|null|undefined} data The object to stringify as          // 89
 *   the response. If `null`, the response will be "null". If                    // 90
 *   `undefined`, there will be no response body.                                // 91
 */                                                                              // 92
JsonRoutes.sendResult = function (res, code, data) {                             // 93
  // Set headers on response                                                     // 94
  setHeaders(res);                                                               // 95
                                                                                 // 96
  // Set status code on response                                                 // 97
  res.statusCode = code || 200;                                                  // 98
                                                                                 // 99
  // Set response body                                                           // 100
  writeJsonToBody(res, data);                                                    // 101
                                                                                 // 102
  // Send the response                                                           // 103
  res.end();                                                                     // 104
};                                                                               // 105
                                                                                 // 106
/**                                                                              // 107
 * Sets the response headers, status code, and body, and ends it.                // 108
 * The JSON response will be pretty printed if NODE_ENV is `development`.        // 109
 *                                                                               // 110
 * @param {Object} res Response object                                           // 111
 * @param {Number} code The status code to send. Default is 500.                 // 112
 * @param {Error|Meteor.Error} error The error object to stringify as            // 113
 *   the response. A JSON representation of the error details will be            // 114
 *   sent. You can set `error.data` or `error.sanitizedError.data` to            // 115
 *   some extra data to be serialized and sent with the response.                // 116
 */                                                                              // 117
JsonRoutes.sendError = function (res, code, error) {                             // 118
  // Set headers on response                                                     // 119
  setHeaders(res);                                                               // 120
                                                                                 // 121
  // If no error passed in, use the default empty error                          // 122
  error = error || new Error();                                                  // 123
                                                                                 // 124
  // Set status code on response                                                 // 125
  res.statusCode = code || 500;                                                  // 126
                                                                                 // 127
  // Convert `Error` objects to JSON representations                             // 128
  var json = JsonRoutes._errorToJson(error);                                     // 129
                                                                                 // 130
  // Set response body                                                           // 131
  writeJsonToBody(res, json);                                                    // 132
                                                                                 // 133
  // Send the response                                                           // 134
  res.end();                                                                     // 135
};                                                                               // 136
                                                                                 // 137
function setHeaders(res) {                                                       // 138
  _.each(responseHeaders, function (value, key) {                                // 139
    res.setHeader(key, value);                                                   // 140
  });                                                                            // 141
}                                                                                // 142
                                                                                 // 143
function getStatusCodeFromError(error) {                                         // 144
  // Bail out if no error passed in                                              // 145
  if (! error) {                                                                 // 146
    return 500;                                                                  // 147
  }                                                                              // 148
                                                                                 // 149
  // If an error or sanitizedError has a `statusCode` property, we use that.     // 150
  // This allows packages to check whether JsonRoutes package is used and if so, // 151
  // to include a specific error status code with the errors they throw.         // 152
  if (error.sanitizedError && error.sanitizedError.statusCode) {                 // 153
    return error.sanitizedError.statusCode;                                      // 154
  }                                                                              // 155
                                                                                 // 156
  if (error.statusCode) {                                                        // 157
    return error.statusCode;                                                     // 158
  }                                                                              // 159
                                                                                 // 160
  // At this point, we know the error doesn't have any attached error code       // 161
  if (error instanceof Meteor.Error ||                                           // 162
    (error.sanitizedError instanceof Meteor.Error)) {                            // 163
      // If we at least put in some effort to throw a user-facing Meteor.Error,  // 164
      // the default code should be less severe                                  // 165
      return 400;                                                                // 166
  }                                                                              // 167
                                                                                 // 168
  // Most pessimistic case: internal server error 500                            // 169
  return 500;                                                                    // 170
}                                                                                // 171
                                                                                 // 172
function buildErrorResponse(errObj) {                                            // 173
  // If an error has a `data` property, we                                       // 174
  // send that. This allows packages to include                                  // 175
  // extra client-safe data with the errors they throw.                          // 176
  var fields = ['error', 'reason', 'details', 'data'];                           // 177
  return _.pick(errObj, fields);                                                 // 178
}                                                                                // 179
                                                                                 // 180
function writeJsonToBody(res, json) {                                            // 181
  if (json !== undefined) {                                                      // 182
    var shouldPrettyPrint = (process.env.NODE_ENV === 'development');            // 183
    var spacer = shouldPrettyPrint ? 2 : null;                                   // 184
    res.setHeader("Content-type", "application/json");                           // 185
    res.write(JSON.stringify(json, null, spacer));                               // 186
  }                                                                              // 187
}                                                                                // 188
                                                                                 // 189
///////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package['simple:json-routes'] = {}, {
  JsonRoutes: JsonRoutes
});

})();

//# sourceMappingURL=simple_json-routes.js.map
