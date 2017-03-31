var require = meteorInstall({"server":{"lib":{"auth0Utils.js":["fibers/future","body-parser","xmlhttprequest","fibers",function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/lib/auth0Utils.js                                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
'use strict';                                                                                                         // 1
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 2
  (function () {                                                                                                      // 2
    var Future = require('fibers/future');                                                                            // 3
    var bodyParser = require('body-parser');                                                                          // 4
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;                                                    // 5
    var Fiber = require('fibers');                                                                                    // 6
                                                                                                                      //
    Picker.middleware(bodyParser.urlencoded({ extended: false }));                                                    // 8
    Picker.middleware(bodyParser.json());                                                                             // 9
                                                                                                                      //
    var DOMAIN = "gigu.auth0.com";                                                                                    // 11
    var CLIENT_ID = "pHssjwxDj2G9Wa5LWseUzcOTIcutWUCo";                                                               // 12
    var CLIENT_SECRET = "mf5ih9DIi7Y0BTb-0XNWB4Ld4c2Bwuo3AIpWhX2OpvEYRUzawpZtlkXOCqPYRS3k";                           // 13
    var CALLBACK = process.env.ROOT_URL + "/callback";                                                                // 14
                                                                                                                      //
    Meteor.methods({                                                                                                  // 16
      getAuthCredentials: function getAuthCredentials() {                                                             // 17
        return {                                                                                                      // 18
          domain: DOMAIN,                                                                                             // 19
          id: CLIENT_ID,                                                                                              // 20
          secret: CLIENT_SECRET,                                                                                      // 21
          cb: CALLBACK                                                                                                // 22
        };                                                                                                            // 18
      },                                                                                                              // 24
      processAuthLogin: function processAuthLogin(accessCode) {                                                       // 25
        check(accessCode, String);                                                                                    // 26
        var future = new Future();                                                                                    // 27
        var xmlhttp = new XMLHttpRequest();                                                                           // 28
        var url = "https://" + DOMAIN + "/oauth/token";                                                               // 29
        // get access token                                                                                           //
        xmlhttp.open("POST", url, true);                                                                              // 31
        xmlhttp.setRequestHeader("Content-Type", "application/json");                                                 // 32
        xmlhttp.onreadystatechange = function () {                                                                    // 33
          if (xmlhttp.readyState === 4) {                                                                             // 34
            if (0 < xmlhttp.status / 200 && xmlhttp.status / 200 < 2) {                                               // 35
              (function () {                                                                                          // 35
                var response = JSON.parse(xmlhttp.responseText);                                                      // 36
                response.domain = DOMAIN, response.clientId = CLIENT_ID, response.callback = CALLBACK;                // 37
                var xmlhttp2 = new XMLHttpRequest();                                                                  // 40
                                                                                                                      //
                // get user profile                                                                                   //
                xmlhttp2.open("GET", "https://" + DOMAIN + "/userinfo", true);                                        // 43
                xmlhttp2.setRequestHeader("Content-Type", "application/json");                                        // 44
                xmlhttp2.setRequestHeader("Authorization", "Bearer " + response.access_token);                        // 45
                xmlhttp2.onreadystatechange = function () {                                                           // 46
                  if (xmlhttp2.readyState === 4) {                                                                    // 47
                    if (0 < xmlhttp2.status / 200 && xmlhttp2.status / 200 < 2) {                                     // 48
                      (function () {                                                                                  // 48
                        var userInfo = JSON.parse(xmlhttp2.responseText);                                             // 49
                                                                                                                      //
                        Fiber(function () {                                                                           // 51
                          try {                                                                                       // 52
                            // save user to local db                                                                  //
                            var acc = Accounts.createUser({                                                           // 54
                              username: userInfo.nickname,                                                            // 55
                              email: userInfo.email,                                                                  // 56
                              password: "oauthUserPasswordDefault"                                                    // 57
                            });                                                                                       // 54
                            if (acc) {                                                                                // 59
                              // send back user info to force login                                                   //
                              var newUser = Users.findOne(acc);                                                       // 61
                              future['return']({                                                                      // 62
                                username: newUser.username,                                                           // 63
                                password: "oauthUserPasswordDefault"                                                  // 64
                              });                                                                                     // 62
                            }                                                                                         // 66
                          } catch (err) {                                                                             // 67
                            var existUser = void 0;                                                                   // 68
                            // in case username exist use local db user                                               //
                            if (err.reason === 'Username already exists.') {                                          // 70
                              existUser = Users.find({ username: userInfo.nickname }).fetch()[0];                     // 71
                              future['return']({                                                                      // 72
                                username: existUser.username,                                                         // 73
                                password: "oauthUserPasswordDefault"                                                  // 74
                              });                                                                                     // 72
                            }                                                                                         // 76
                          }                                                                                           // 77
                        }).run();                                                                                     // 78
                      })();                                                                                           // 48
                    } else {                                                                                          // 79
                      future['return']({                                                                              // 80
                        error: JSON.parse(xmlhttp2.responseText).error                                                // 81
                      });                                                                                             // 80
                    }                                                                                                 // 83
                  }                                                                                                   // 84
                };                                                                                                    // 85
                xmlhttp2.send();                                                                                      // 86
              })();                                                                                                   // 35
            } else {                                                                                                  // 87
              future['return']({                                                                                      // 88
                error: JSON.parse(xmlhttp.responseText).error                                                         // 89
              });                                                                                                     // 88
            }                                                                                                         // 91
          }                                                                                                           // 92
        };                                                                                                            // 93
        xmlhttp.send(JSON.stringify({                                                                                 // 94
          grant_type: "authorization_code",                                                                           // 95
          client_id: CLIENT_ID,                                                                                       // 96
          client_secret: CLIENT_SECRET,                                                                               // 97
          code: accessCode,                                                                                           // 98
          redirect_uri: CALLBACK                                                                                      // 99
        }));                                                                                                          // 94
                                                                                                                      //
        return future.wait();                                                                                         // 102
      },                                                                                                              // 103
      processAuthLogout: function processAuthLogout() {                                                               // 104
        var future = new Future();                                                                                    // 105
        var xmlhttp = new XMLHttpRequest();                                                                           // 106
        var url = "https://" + DOMAIN + "/v2/logout?returnTo=" + encodeURIComponent(process.env.ROOT_URL + "/sign-in") + "&client_id=" + CLIENT_ID;
        // logout auth0 user                                                                                          //
        xmlhttp.open("GET", url, true);                                                                               // 109
        xmlhttp.setRequestHeader("Content-Type", "application/json");                                                 // 110
        xmlhttp.send();                                                                                               // 111
      }                                                                                                               // 112
    });                                                                                                               // 16
  })();                                                                                                               // 2
}                                                                                                                     // 114
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"ocUtils.js":["body-parser","fibers/future","xmlhttprequest","consul","../../models/export.js","request","form-data","fs",function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/lib/ocUtils.js                                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 1
  (function () {                                                                                                      // 1
    var bodyParser = require('body-parser');                                                                          // 2
    var Future = require('fibers/future');                                                                            // 3
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;                                                    // 4
    var consul = require('consul')({                                                                                  // 5
      host: process.env.CONSUL_SERVER_URL,                                                                            // 6
      port: process.env.CONSUL_SERVER_PORT                                                                            // 7
    });                                                                                                               // 5
                                                                                                                      //
    Picker.middleware(bodyParser.urlencoded({ extended: false }));                                                    // 10
    Picker.middleware(bodyParser.json());                                                                             // 11
                                                                                                                      //
    var postApi = Picker.filter(function (req, res) {                                                                 // 13
      return req.method == "POST";                                                                                    // 14
    });                                                                                                               // 15
                                                                                                                      //
    var putApi = Picker.filter(function (req, res) {                                                                  // 17
      return req.method == "PUT";                                                                                     // 18
    });                                                                                                               // 19
                                                                                                                      //
    Meteor.methods({                                                                                                  // 22
      getForm: function getForm(protocolId, formTitle) {                                                              // 23
        check(protocolId, String);                                                                                    // 24
        check(formTitle, String);                                                                                     // 25
        var future = new Future();                                                                                    // 26
        var xmlhttp = new XMLHttpRequest();                                                                           // 27
        xmlhttp.open("GET", "http://fm.openclinica.info:8080/api/protocol/" + protocolId + "/forms/" + formTitle, true);
        xmlhttp.onreadystatechange = function () {                                                                    // 29
          if (xmlhttp.readyState == 4) {                                                                              // 30
            if (0 < xmlhttp.status / 200 && xmlhttp.status / 200 < 2) future['return'](JSON.parse(xmlhttp.responseText));else future['return']("error");
          }                                                                                                           // 35
        };                                                                                                            // 36
        xmlhttp.send();                                                                                               // 37
                                                                                                                      //
        return future.wait();                                                                                         // 39
      },                                                                                                              // 40
      pushProtocol: function pushProtocol(boardId) {                                                                  // 41
        var exportClass = require('../../models/export.js');                                                          // 42
        check(boardId, String);                                                                                       // 43
                                                                                                                      //
        var exporter = new exportClass.Exporter(boardId);                                                             // 45
        var xmlhttp = new XMLHttpRequest();                                                                           // 46
        var future = new Future();                                                                                    // 47
        xmlhttp.open("POST", "http://pm.openclinica.info:8082/rest/importjson", true);                                // 48
        xmlhttp.setRequestHeader("Content-Type", "application/json");                                                 // 49
        xmlhttp.onreadystatechange = function () {                                                                    // 50
          if (xmlhttp.readyState === 4) future['return'](xmlhttp.status);                                             // 51
        };                                                                                                            // 53
        xmlhttp.send(JSON.stringify(exporter.build()));                                                               // 54
                                                                                                                      //
        return future.wait();                                                                                         // 56
      },                                                                                                              // 57
      postProtocol: function postProtocol(id) {                                                                       // 58
        check(id, String);                                                                                            // 59
                                                                                                                      //
        var obj = {                                                                                                   // 61
          protocolID: id                                                                                              // 62
        };                                                                                                            // 61
                                                                                                                      //
        var xmlhttp = new XMLHttpRequest();                                                                           // 65
        xmlhttp.open("POST", "http://ocbridge.openclinica.info:8085/api/createWebApp", true);                         // 66
        xmlhttp.setRequestHeader("Content-Type", "application/json");                                                 // 67
        xmlhttp.send(JSON.stringify(obj));                                                                            // 68
      },                                                                                                              // 69
      uploadForm: function uploadForm(boardId, formId, files) {                                                       // 70
        check(boardId, String);                                                                                       // 71
        check(formId, Number);                                                                                        // 72
        check(files, Array);                                                                                          // 73
                                                                                                                      //
        var request = require('request'),                                                                             // 75
            FormData = require('form-data'),                                                                          // 75
            fs = require('fs'),                                                                                       // 75
            future = new Future(),                                                                                    // 75
            streams = [];                                                                                             // 75
        var formData = new FormData();                                                                                // 80
        _.each(files, function (file) {                                                                               // 81
          // create temp file                                                                                         //
          fs.writeFile(file.name, file.binary, { encoding: "binary" }, function (err) {                               // 83
            streams.push(fs.createReadStream(process.env.PWD + '/programs/server/' + file.name));                     // 84
            if (files.length === streams.length) {                                                                    // 85
              formData = {                                                                                            // 86
                file: streams                                                                                         // 87
              };                                                                                                      // 86
              request.post({ url: 'http://fm.openclinica.info:8080/api/protocol/' + boardId + '/forms/' + formId + '/artifacts', formData: formData }, function optionalCallback(err, httpResponse, body) {
                if (err) {                                                                                            // 90
                  future['return']("error");                                                                          // 91
                } else {                                                                                              // 92
                  future['return'](JSON.parse(body));                                                                 // 93
                }                                                                                                     // 94
                // remove temp file                                                                                   //
                _.each(files, function (tmpFile) {                                                                    // 96
                  fs.unlink(process.env.PWD + '/programs/server/' + tmpFile.name);                                    // 97
                });                                                                                                   // 98
              });                                                                                                     // 99
            }                                                                                                         // 100
          });                                                                                                         // 101
        });                                                                                                           // 103
        return future.wait();                                                                                         // 104
      },                                                                                                              // 105
      createServiceConsul: function createServiceConsul() {                                                           // 106
        var service = { "ID": "ProtocolDesigner-b8rie0uf3jw8wylb89q4o4z9sjba8s9c", "Name": "ProtocolDesigner", "Tags": [], "Address": "pd.openclinica.info", "Port": 8082, "Check": { "Name": "Server up", "Notes": "Ensure Protocol Designer is running", "TCP": "pd.openclinica.info:8082", "Interval": "10s" } };
                                                                                                                      //
        consul.agent.service.register(service, function (err, result) {                                               // 109
          if (err) console.log("--> error on agent.service.register : ", err);                                        // 110
        });                                                                                                           // 112
      }                                                                                                               // 113
    });                                                                                                               // 22
                                                                                                                      //
    postApi.route('/copyProtocol', function (params, req, res, next) {                                                // 116
      var id = req.body.boardId;                                                                                      // 117
      var title = req.body.title;                                                                                     // 118
      if (id && title) {                                                                                              // 119
        (function () {                                                                                                // 119
          id = id.trim();                                                                                             // 120
          title = title.trim();                                                                                       // 121
          var board = Boards.findOne(id);                                                                             // 122
          var lists = Lists.find({ boardId: id, archived: false }).fetch();                                           // 123
          if (board) {                                                                                                // 124
            delete board._id;                                                                                         // 125
            delete board.createdAt;                                                                                   // 126
            delete board.modifiedAt;                                                                                  // 127
            delete board.slug;                                                                                        // 128
            board._parentId = id;                                                                                     // 129
            board.title = title;                                                                                      // 130
            board.slug = slug = getSlug(title);                                                                       // 131
                                                                                                                      //
            _.each(board.members, function (member) {                                                                 // 133
              if (member.group == '') {                                                                               // 134
                board.setGroup(member.userId, member.group || "public");                                              // 135
                member.group = member.group || "public";                                                              // 136
              }                                                                                                       // 137
            });                                                                                                       // 138
                                                                                                                      //
            Boards.insert(board, function (err, cloneId) {                                                            // 140
              var code = void 0,                                                                                      // 141
                  result = void 0;                                                                                    // 141
              if (err) {                                                                                              // 142
                code = 500;                                                                                           // 143
                result = {                                                                                            // 144
                  error: err.message                                                                                  // 145
                };                                                                                                    // 144
              } else {                                                                                                // 147
                code = 200;                                                                                           // 148
                result = {                                                                                            // 149
                  boardId: cloneId,                                                                                   // 150
                  protocolUrl: Meteor.absoluteUrl() + 'b/' + cloneId + '/' + board.slug                               // 151
                };                                                                                                    // 149
              }                                                                                                       // 153
              res.setHeader('Content-Type', 'application/json');                                                      // 154
              res.statusCode = code;                                                                                  // 155
              res.end(JSON.stringify(result));                                                                        // 156
            });                                                                                                       // 157
          } else {                                                                                                    // 158
            res.setHeader('Content-Type', 'application/json');                                                        // 159
            res.statusCode = 404;                                                                                     // 160
            res.end(JSON.stringify({ error: "Board not found." }));                                                   // 161
          }                                                                                                           // 162
        })();                                                                                                         // 119
      } else {                                                                                                        // 163
        res.setHeader('Content-Type', 'application/json');                                                            // 164
        res.statusCode = 404;                                                                                         // 165
        res.end(JSON.stringify({ error: "Missing parameter." }));                                                     // 166
      }                                                                                                               // 167
    });                                                                                                               // 168
                                                                                                                      //
    postApi.route('/protocols', function (params, req, res, next) {                                                   // 170
      var title = req.body.title;                                                                                     // 171
      if (title) {                                                                                                    // 172
        Boards.insert({                                                                                               // 173
          title: title.trim(),                                                                                        // 174
          permission: "public"                                                                                        // 175
        }, function (err, boardId) {                                                                                  // 173
          var code = void 0,                                                                                          // 177
              result = void 0;                                                                                        // 177
          if (err) {                                                                                                  // 178
            code = 500;                                                                                               // 179
            result = {                                                                                                // 180
              error: err.message                                                                                      // 181
            };                                                                                                        // 180
          } else {                                                                                                    // 183
            code = 200;                                                                                               // 184
            var board = Boards.findOne(boardId);                                                                      // 185
            result = {                                                                                                // 186
              boardId: boardId,                                                                                       // 187
              protocolUrl: Meteor.absoluteUrl() + 'b/' + boardId + '/' + board.slug                                   // 188
            };                                                                                                        // 186
          }                                                                                                           // 190
          res.setHeader('Content-Type', 'application/json');                                                          // 191
          res.statusCode = code;                                                                                      // 192
          res.end(JSON.stringify(result));                                                                            // 193
        });                                                                                                           // 194
      } else {                                                                                                        // 195
        res.setHeader('Content-Type', 'application/json');                                                            // 196
        res.statusCode = 404;                                                                                         // 197
        res.end(JSON.stringify({ error: 'Title not found.' }));                                                       // 198
      }                                                                                                               // 199
    });                                                                                                               // 201
                                                                                                                      //
    postApi.route('/renameProtocol', function (params, req, res, next) {                                              // 203
      var listBoardId = req.body.listBoardId,                                                                         // 204
          newName = req.body.title,                                                                                   // 204
          code = 200,                                                                                                 // 204
          message = undefined;                                                                                        // 204
                                                                                                                      //
      if (listBoardId && newName) {                                                                                   // 206
        if (!listBoardId[0]) {                                                                                        // 207
          code = 404;                                                                                                 // 208
          message = JSON.stringify({ error: 'Empty listBoardId.' });                                                  // 209
        } else {                                                                                                      // 210
          (function () {                                                                                              // 210
            var result = {                                                                                            // 211
              listBoardId: [],                                                                                        // 212
              protocolUrls: []                                                                                        // 213
            };                                                                                                        // 211
            _.each(listBoardId, function (boardId) {                                                                  // 215
              var board = Boards.findOne(boardId);                                                                    // 216
              board.rename(newName);                                                                                  // 217
              result.listBoardId.push(boardId);                                                                       // 218
              result.protocolUrls.push(Meteor.absoluteUrl() + 'b/' + boardId + '/' + board.slug);                     // 219
                                                                                                                      //
              var clones = Boards.find({ _parentId: boardId }).fetch();                                               // 221
              _.each(clones, function (clone) {                                                                       // 222
                clone.rename(newName);                                                                                // 223
                result.listBoardId.push(clone._id);                                                                   // 224
                result.protocolUrls.push(Meteor.absoluteUrl() + 'b/' + clone._id + '/' + clone.slug);                 // 225
              });                                                                                                     // 226
            });                                                                                                       // 227
            message = JSON.stringify(result);                                                                         // 228
          })();                                                                                                       // 210
        }                                                                                                             // 229
      } else {                                                                                                        // 230
        code = 404;                                                                                                   // 231
        message = JSON.stringify({ error: 'Missing parameter.' });                                                    // 232
      }                                                                                                               // 233
      res.setHeader('Content-Type', 'application/json');                                                              // 234
      res.statusCode = code;                                                                                          // 235
      if (message) res.end(message);else res.end();                                                                   // 236
    });                                                                                                               // 241
  })();                                                                                                               // 1
}                                                                                                                     // 242
                                                                                                                      //
Meteor.startup(function () {                                                                                          // 244
  if (process.env.CONSUL_SERVER_URL) Meteor.call("createServiceConsul");                                              // 245
});                                                                                                                   // 247
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"stormpathUtils.js":["stormpath","fibers",function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/lib/stormpathUtils.js                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 1
	(function () {                                                                                                       // 1
		var stormpath = require('stormpath');                                                                               // 2
		var Fiber = require('fibers');                                                                                      // 3
		// Create API Key from env(.bashrc)                                                                                 //
		var api = new stormpath.ApiKey(process.env.STORMPATH_CLIENT_APIKEY_ID, process.env.STORMPATH_CLIENT_APIKEY_SECRET);
		// Create client                                                                                                    //
		var client = new stormpath.Client({                                                                                 // 10
			apiKey: api                                                                                                        // 11
		});                                                                                                                 // 10
                                                                                                                      //
		// Use Picker to catch request                                                                                      //
		Picker.route('/sso', function (params, req, res, next) {                                                            // 15
			var groupName = undefined;                                                                                         // 16
                                                                                                                      //
			function saveUser(user, isNew, status) {                                                                           // 18
				// Encapsulate meteor method on fiber to prevent error                                                            //
				Fiber(function () {                                                                                               // 20
					// create function to redirect page to flowrouter                                                                //
					var sendResponse = function sendResponse(location) {                                                             // 22
						res.writeHead(301, {                                                                                            // 23
							'Location': location                                                                                           // 24
						});                                                                                                             // 23
						res.end();                                                                                                      // 26
					};                                                                                                               // 27
					// Username and email value must be unique so we can use try-catch to catch the existed file or new user with username or email that already exist on database. Send to sign-up page if found.
					try {                                                                                                            // 29
						var acc = Accounts.createUser(user);                                                                            // 30
						if (acc) {                                                                                                      // 31
							var newUser = Users.findOne(acc);                                                                              // 32
							if (groupName) {                                                                                               // 33
								newUser.setGroup(groupName);                                                                                  // 34
							}                                                                                                              // 35
							sendResponse('/stormpath/sign-in/' + newUser.username);                                                        // 36
						}                                                                                                               // 37
					} catch (err) {                                                                                                  // 38
						(function () {                                                                                                  // 38
							var existUser = void 0;                                                                                        // 39
							if (err.reason === 'Username already exists.') {                                                               // 40
								existUser = Users.find({ username: user.username }).fetch()[0];                                               // 41
								if (groupName) {                                                                                              // 42
									existUser.setGroup(groupName);                                                                               // 43
								}                                                                                                             // 44
								_.each(existUser.emails, function (email) {                                                                   // 45
									if (email.address === user.email) {                                                                          // 46
										sendResponse('/stormpath/sign-in/' + existUser.username);                                                   // 47
									} else {                                                                                                     // 48
										sendResponse('https://automation2.panduwana.com/restricted/secret');                                        // 49
									}                                                                                                            // 50
								});                                                                                                           // 51
							} else {                                                                                                       // 52
								sendResponse('https://automation2.panduwana.com/restricted/secret');                                          // 53
							}                                                                                                              // 54
						})();                                                                                                           // 38
					}                                                                                                                // 55
				}).run();                                                                                                         // 57
			}                                                                                                                  // 58
                                                                                                                      //
			// Handle callback from Site                                                                                       //
			client.getApplication(process.env.STORMPATH_APPLICATION_HREF, function (err, application) {                        // 61
				application.handleIdSiteCallback(req.url, function (err, idSiteAuthenticationResult) {                            // 62
                                                                                                                      //
					if (err) {                                                                                                       // 64
						res.end(500);                                                                                                   // 65
					} else {                                                                                                         // 66
						client.getGroup(idSiteAuthenticationResult.account.groups.href, function (err, group) {                         // 67
							if (group.items[0]) {                                                                                          // 68
								groupName = group.items[0].name;                                                                              // 69
							} else {                                                                                                       // 70
								groupName = "no-group";                                                                                       // 71
							}                                                                                                              // 72
							function newUser(isNew, status) {                                                                              // 73
								saveUser({                                                                                                    // 74
									username: idSiteAuthenticationResult.account.givenName,                                                      // 75
									email: idSiteAuthenticationResult.account.email,                                                             // 76
									password: idSiteAuthenticationResult.account.givenName                                                       // 77
								}, isNew, status);                                                                                            // 74
							}                                                                                                              // 79
							newUser(idSiteAuthenticationResult.isNew, idSiteAuthenticationResult.status);                                  // 80
						});                                                                                                             // 81
					}                                                                                                                // 82
				});                                                                                                               // 83
			});                                                                                                                // 84
		});                                                                                                                 // 85
	})();                                                                                                                // 1
}                                                                                                                     // 86
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"utils.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/lib/utils.js                                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
allowIsBoardAdmin = function allowIsBoardAdmin(userId, board) {                                                       // 1
  var user = Users.findOne(userId);                                                                                   // 2
  return board && (board.hasAdmin(userId) || board.hasGroup(user.group) || board.hasGroup("public"));                 // 3
};                                                                                                                    // 4
                                                                                                                      //
allowIsBoardMember = function allowIsBoardMember(userId, board) {                                                     // 6
  var user = Users.findOne(userId);                                                                                   // 7
  return board && (board.hasMember(userId) || board.hasGroup(user.group) || board.hasGroup("public"));                // 8
};                                                                                                                    // 9
                                                                                                                      //
allowIsBoardMemberByCard = function allowIsBoardMemberByCard(userId, card) {                                          // 11
  var board = card.board();                                                                                           // 12
  return board && board.hasMember(userId);                                                                            // 13
};                                                                                                                    // 14
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"notifications":{"email.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/notifications/email.js                                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// buffer each user's email text in a queue, then flush them in single email                                          //
Meteor.startup(function () {                                                                                          // 2
  Notifications.subscribe('email', function (user, title, description, params) {                                      // 3
    // add quote to make titles easier to read in email text                                                          //
    var quoteParams = _.clone(params);                                                                                // 5
    ['card', 'list', 'oldList', 'board', 'comment'].forEach(function (key) {                                          // 6
      if (quoteParams[key]) quoteParams[key] = '"' + params[key] + '"';                                               // 7
    });                                                                                                               // 8
                                                                                                                      //
    var text = params.user + ' ' + TAPi18n.__(description, quoteParams, user.getLanguage()) + '\n' + params.url;      // 10
    user.addEmailBuffer(text);                                                                                        // 11
                                                                                                                      //
    // unlike setTimeout(func, delay, args),                                                                          //
    // Meteor.setTimeout(func, delay) does not accept args :-(                                                        //
    // so we pass userId with closure                                                                                 //
    var userId = user._id;                                                                                            // 16
    Meteor.setTimeout(function () {                                                                                   // 17
      var user = Users.findOne(userId);                                                                               // 18
                                                                                                                      //
      // for each user, in the timed period, only the first call will get the cached content,                         //
      // other calls will get nothing                                                                                 //
      var texts = user.getEmailBuffer();                                                                              // 22
      if (texts.length === 0) return;                                                                                 // 23
                                                                                                                      //
      // merge the cached content into single email and flush                                                         //
      var text = texts.join('\n\n');                                                                                  // 26
      user.clearEmailBuffer();                                                                                        // 27
                                                                                                                      //
      try {                                                                                                           // 29
        Email.send({                                                                                                  // 30
          to: user.emails[0].address,                                                                                 // 31
          from: Accounts.emailTemplates.from,                                                                         // 32
          subject: TAPi18n.__('act-activity-notify', {}, user.getLanguage()),                                         // 33
          text: text                                                                                                  // 34
        });                                                                                                           // 30
      } catch (e) {                                                                                                   // 36
        return;                                                                                                       // 37
      }                                                                                                               // 38
    }, 30000);                                                                                                        // 39
  });                                                                                                                 // 40
});                                                                                                                   // 41
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"notifications.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/notifications/notifications.js                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// a map of notification service, like email, web, IM, qq, etc.                                                       //
                                                                                                                      //
// serviceName -> callback(user, title, description, params)                                                          //
// expected arguments to callback:                                                                                    //
// - user: Meteor user object                                                                                         //
// - title: String, TAPi18n key                                                                                       //
// - description, String, TAPi18n key                                                                                 //
// - params: Object, values extracted from context, to used for above two TAPi18n keys                                //
//   see example call to Notifications.notify() in models/activities.js                                               //
var notifyServices = {};                                                                                              // 10
                                                                                                                      //
Notifications = {                                                                                                     // 12
  subscribe: function subscribe(serviceName, callback) {                                                              // 13
    notifyServices[serviceName] = callback;                                                                           // 14
  },                                                                                                                  // 15
                                                                                                                      //
  unsubscribe: function unsubscribe(serviceName) {                                                                    // 17
    if (typeof notifyServices[serviceName] === 'function') delete notifyServices[serviceName];                        // 18
  },                                                                                                                  // 20
                                                                                                                      //
  // filter recipients according to user settings for notification                                                    //
  getUsers: function getUsers(participants, watchers) {                                                               // 23
    var userMap = {};                                                                                                 // 24
    participants.forEach(function (userId) {                                                                          // 25
      if (userMap[userId]) return;                                                                                    // 26
      var user = Users.findOne(userId);                                                                               // 27
      if (user && user.hasTag('notify-participate')) {                                                                // 28
        userMap[userId] = user;                                                                                       // 29
      }                                                                                                               // 30
    });                                                                                                               // 31
    watchers.forEach(function (userId) {                                                                              // 32
      if (userMap[userId]) return;                                                                                    // 33
      var user = Users.findOne(userId);                                                                               // 34
      if (user && user.hasTag('notify-watch')) {                                                                      // 35
        userMap[userId] = user;                                                                                       // 36
      }                                                                                                               // 37
    });                                                                                                               // 38
    return _.map(userMap, function (v) {                                                                              // 39
      return v;                                                                                                       // 39
    });                                                                                                               // 39
  },                                                                                                                  // 40
                                                                                                                      //
  notify: function notify(user, title, description, params) {                                                         // 42
    for (var k in notifyServices) {                                                                                   // 43
      var notifyImpl = notifyServices[k];                                                                             // 44
      if (notifyImpl && typeof notifyImpl === 'function') notifyImpl(user, title, description, params);               // 45
    }                                                                                                                 // 46
  }                                                                                                                   // 47
};                                                                                                                    // 12
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"profile.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/notifications/profile.js                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.startup(function () {                                                                                          // 1
  // XXX: add activity id to profile.notifications,                                                                   //
  // it can be displayed and rendered on web or mobile UI                                                             //
  // will uncomment the following code once UI implemented                                                            //
  //                                                                                                                  //
  // Notifications.subscribe('profile', (user, title, description, params) => {                                       //
  // user.addNotification(params.activityId);                                                                         //
  // });                                                                                                              //
});                                                                                                                   // 9
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"watch.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/notifications/watch.js                                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({                                                                                                      // 1
  watch: function watch(watchableType, id, level) {                                                                   // 2
    check(watchableType, String);                                                                                     // 3
    check(id, String);                                                                                                // 4
    check(level, Match.OneOf(String, null));                                                                          // 5
                                                                                                                      //
    var userId = Meteor.userId();                                                                                     // 7
                                                                                                                      //
    var watchableObj = null;                                                                                          // 9
    var board = null;                                                                                                 // 10
    if (watchableType === 'board') {                                                                                  // 11
      watchableObj = Boards.findOne(id);                                                                              // 12
      if (!watchableObj) throw new Meteor.Error('error-board-doesNotExist');                                          // 13
      board = watchableObj;                                                                                           // 14
    } else if (watchableType === 'list') {                                                                            // 16
      watchableObj = Lists.findOne(id);                                                                               // 17
      if (!watchableObj) throw new Meteor.Error('error-list-doesNotExist');                                           // 18
      board = watchableObj.board();                                                                                   // 19
    } else if (watchableType === 'card') {                                                                            // 21
      watchableObj = Cards.findOne(id);                                                                               // 22
      if (!watchableObj) throw new Meteor.Error('error-card-doesNotExist');                                           // 23
      board = watchableObj.board();                                                                                   // 24
    } else {                                                                                                          // 26
      throw new Meteor.Error('error-json-schema');                                                                    // 27
    }                                                                                                                 // 28
                                                                                                                      //
    if (board.permission === 'private' && !board.hasMember(userId)) throw new Meteor.Error('error-board-notAMember');
                                                                                                                      //
    watchableObj.setWatcher(userId, level);                                                                           // 33
    return true;                                                                                                      // 34
  }                                                                                                                   // 35
});                                                                                                                   // 1
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"activities.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/activities.js                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// We use activities fields at two different places:                                                                  //
// 1. The board sidebar                                                                                               //
// 2. The card activity tab                                                                                           //
// We use this publication to paginate for these two publications.                                                    //
                                                                                                                      //
Meteor.publish('activities', function (kind, id, limit, hideSystem) {                                                 // 6
  var _ref, _ref2;                                                                                                    // 6
                                                                                                                      //
  check(kind, Match.Where(function (x) {                                                                              // 7
    return ['board', 'card', 'list'].indexOf(x) !== -1;                                                               // 8
  }));                                                                                                                // 9
  check(id, String);                                                                                                  // 10
  check(limit, Number);                                                                                               // 11
  check(hideSystem, Boolean);                                                                                         // 12
                                                                                                                      //
  var selector = hideSystem ? { $and: [{ activityType: 'addComment' }, (_ref = {}, _ref[kind + 'Id'] = id, _ref)] } : (_ref2 = {}, _ref2[kind + 'Id'] = id, _ref2);
  return Activities.find(selector, {                                                                                  // 15
    limit: limit,                                                                                                     // 16
    sort: { createdAt: -1 }                                                                                           // 17
  });                                                                                                                 // 15
});                                                                                                                   // 19
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"avatars.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/avatars.js                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('my-avatars', function () {                                                                            // 1
  return Avatars.find({ userId: this.userId });                                                                       // 2
});                                                                                                                   // 3
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"boards.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/boards.js                                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// This is the publication used to display the board list. We publish all the                                         //
// non-archived boards:                                                                                               //
// 1. that the user is a member of                                                                                    //
// 2. the user has starred                                                                                            //
Meteor.publish('boards', function () {                                                                                // 5
  // Ensure that the user is connected. If it is not, we need to return an empty                                      //
  // array to tell the client to remove the previously published docs.                                                //
  if (!Match.test(this.userId, String)) return [];                                                                    // 8
                                                                                                                      //
  // Defensive programming to verify that starredBoards has the expected                                              //
  // format -- since the field is in the `profile` a user can modify it.                                              //
  var currentUser = Users.findOne(this.userId);                                                                       // 13
  var group = currentUser.group ? currentUser.group : '';                                                             // 14
  var _currentUser$profile$ = currentUser.profile.starredBoards;                                                      // 5
  var starredBoards = _currentUser$profile$ === undefined ? [] : _currentUser$profile$;                               // 5
                                                                                                                      //
  check(starredBoards, [String]);                                                                                     // 16
                                                                                                                      //
  return Boards.find({                                                                                                // 18
    archived: false,                                                                                                  // 19
    $or: [{                                                                                                           // 20
      _id: { $in: starredBoards },                                                                                    // 22
      permission: 'public'                                                                                            // 23
    }, { members: { $elemMatch: { userId: this.userId, isActive: true } } }, { members: { $elemMatch: { isActive: true, group: group } } }, { members: { $elemMatch: { isActive: true, group: 'public' } } }]
  }, {                                                                                                                // 18
    fields: {                                                                                                         // 30
      _id: 1,                                                                                                         // 31
      archived: 1,                                                                                                    // 32
      slug: 1,                                                                                                        // 33
      title: 1,                                                                                                       // 34
      description: 1,                                                                                                 // 35
      color: 1,                                                                                                       // 36
      members: 1,                                                                                                     // 37
      permission: 1                                                                                                   // 38
    }                                                                                                                 // 30
  }, {                                                                                                                // 29
    sort: ['title']                                                                                                   // 41
  });                                                                                                                 // 40
});                                                                                                                   // 43
                                                                                                                      //
Meteor.publish('archivedBoards', function () {                                                                        // 45
  if (!Match.test(this.userId, String)) return [];                                                                    // 46
                                                                                                                      //
  return Boards.find({                                                                                                // 49
    archived: true,                                                                                                   // 50
    members: {                                                                                                        // 51
      $elemMatch: {                                                                                                   // 52
        userId: this.userId,                                                                                          // 53
        isAdmin: true                                                                                                 // 54
      }                                                                                                               // 52
    }                                                                                                                 // 51
  }, {                                                                                                                // 49
    fields: {                                                                                                         // 58
      _id: 1,                                                                                                         // 59
      archived: 1,                                                                                                    // 60
      slug: 1,                                                                                                        // 61
      title: 1                                                                                                        // 62
    }                                                                                                                 // 58
  });                                                                                                                 // 57
});                                                                                                                   // 65
                                                                                                                      //
Meteor.publishRelations('board', function (boardId) {                                                                 // 67
  check(boardId, String);                                                                                             // 68
  var thisUserId = this.userId;                                                                                       // 69
                                                                                                                      //
  var currentUser = Users.findOne(this.userId);                                                                       // 71
  var group = '';                                                                                                     // 72
  if (currentUser) group = currentUser.group || '';                                                                   // 73
                                                                                                                      //
  this.cursor(Boards.find({                                                                                           // 76
    _id: boardId,                                                                                                     // 77
    archived: false,                                                                                                  // 78
    // If the board is not public the user has to be a member of it to see                                            //
    // it.                                                                                                            //
    $or: [{ permission: 'public' }, { members: { $elemMatch: { userId: this.userId, isActive: true } } }, { members: { $elemMatch: { isActive: true, group: group } } }, { members: { $elemMatch: { isActive: true, group: 'public' } } }]
  }, { limit: 1 }), function (boardId, board) {                                                                       // 76
    this.cursor(Lists.find({ boardId: boardId }));                                                                    // 88
                                                                                                                      //
    // Cards and cards comments                                                                                       //
    // XXX Originally we were publishing the card documents as a child of the                                         //
    // list publication defined above using the following selector `{ listId:                                         //
    // list._id }`. But it was causing a race condition in publish-composite,                                         //
    // that I documented here:                                                                                        //
    //                                                                                                                //
    //   https://github.com/englue/meteor-publish-composite/issues/29                                                 //
    //                                                                                                                //
    // cottz:publish had a similar problem:                                                                           //
    //                                                                                                                //
    //   https://github.com/Goluis/cottz-publish/issues/4                                                             //
    //                                                                                                                //
    // The current state of relational publishing in meteor is a bit sad,                                             //
    // there are a lot of various packages, with various APIs, some of them                                           //
    // are unmaintained. Fortunately this is something that will be fixed by                                          //
    // meteor-core at some point:                                                                                     //
    //                                                                                                                //
    //   https://trello.com/c/BGvIwkEa/48-easy-joins-in-subscriptions                                                 //
    //                                                                                                                //
    // And in the meantime our code below works pretty well -- it's not even a                                        //
    // hack!                                                                                                          //
    this.cursor(Cards.find({ boardId: boardId }), function (cardId) {                                                 // 111
      this.cursor(CardComments.find({ cardId: cardId }));                                                             // 112
      this.cursor(Attachments.find({ cardId: cardId }));                                                              // 113
      this.cursor(Checklists.find({ cardId: cardId }));                                                               // 114
    });                                                                                                               // 115
                                                                                                                      //
    if (board.members) {                                                                                              // 117
      // Board members. This publication also includes former board members that                                      //
      // aren't members anymore but may have some activities attached to them in                                      //
      // the history.                                                                                                 //
      var memberIds = _.pluck(board.members, 'userId');                                                               // 121
                                                                                                                      //
      // We omit the current user because the client should already have that data,                                   //
      // and sending it triggers a subtle bug:                                                                        //
      // https://github.com/wefork/wekan/issues/15                                                                    //
      this.cursor(Users.find({                                                                                        // 126
        _id: { $in: _.without(memberIds, thisUserId) }                                                                // 127
      }, { fields: {                                                                                                  // 126
          'username': 1,                                                                                              // 129
          'profile.fullname': 1,                                                                                      // 130
          'profile.avatarUrl': 1                                                                                      // 131
        } }));                                                                                                        // 128
                                                                                                                      //
      this.cursor(presences.find({ userId: { $in: memberIds } }));                                                    // 134
    }                                                                                                                 // 135
  });                                                                                                                 // 136
                                                                                                                      //
  return this.ready();                                                                                                // 138
});                                                                                                                   // 139
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cardComments.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/cardComments.js                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('cardComments', function () {                                                                          // 1
  return CardComments.find();                                                                                         // 2
});                                                                                                                   // 3
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cards.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/cards.js                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('card', function (cardId) {                                                                            // 1
  check(cardId, String);                                                                                              // 2
  return Cards.find({ _id: cardId });                                                                                 // 3
});                                                                                                                   // 4
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fast-render.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/fast-render.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
FastRender.onAllRoutes(function () {                                                                                  // 1
  this.subscribe('boards');                                                                                           // 2
});                                                                                                                   // 3
                                                                                                                      //
FastRender.route('/b/:id/:slug', function (_ref) {                                                                    // 5
  var id = _ref.id;                                                                                                   // 5
                                                                                                                      //
  this.subscribe('board', id);                                                                                        // 6
});                                                                                                                   // 7
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unsavedEdits.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/unsavedEdits.js                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('unsaved-edits', function () {                                                                         // 1
  return UnsavedEditCollection.find({                                                                                 // 2
    userId: this.userId                                                                                               // 3
  });                                                                                                                 // 2
});                                                                                                                   // 5
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/publications/users.js                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('user-miniprofile', function (userId) {                                                                // 1
  check(userId, String);                                                                                              // 2
                                                                                                                      //
  return Users.find(userId, {                                                                                         // 4
    fields: {                                                                                                         // 5
      'username': 1,                                                                                                  // 6
      'profile.fullname': 1,                                                                                          // 7
      'profile.avatarUrl': 1                                                                                          // 8
    }                                                                                                                 // 5
  });                                                                                                                 // 4
});                                                                                                                   // 11
                                                                                                                      //
Meteor.publish('user-extra-group', function (userId) {                                                                // 13
  check(userId, String);                                                                                              // 14
  return Users.find(userId, {                                                                                         // 15
    fields: {                                                                                                         // 16
      'username': 1,                                                                                                  // 17
      'profile': 1,                                                                                                   // 18
      'emails': 1,                                                                                                    // 19
      'group': 1                                                                                                      // 20
    }                                                                                                                 // 16
  });                                                                                                                 // 15
});                                                                                                                   // 23
                                                                                                                      //
Meteor.publish('user-by-group', function (group) {                                                                    // 25
  check(group, String);                                                                                               // 26
  return Users.find({ 'group': group }, {                                                                             // 27
    fields: {                                                                                                         // 28
      'username': 1,                                                                                                  // 29
      'profile': 1,                                                                                                   // 30
      'emails': 1,                                                                                                    // 31
      'group': 1                                                                                                      // 32
    }                                                                                                                 // 28
  });                                                                                                                 // 27
});                                                                                                                   // 35
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"migrations.js":["babel-runtime/helpers/extends",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/migrations.js                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _extends;module.import('babel-runtime/helpers/extends',{"default":function(v){_extends=v}});                      //
// Anytime you change the schema of one of the collection in a non-backward                                           //
// compatible way you have to write a migration in this file using the following                                      //
// API:                                                                                                               //
//                                                                                                                    //
//   Migrations.add(name, migrationCallback, optionalOrder);                                                          //
                                                                                                                      //
// Note that we have extra migrations defined in `sandstorm.js` that are                                              //
// exclusive to Sandstorm and shouldn’t be executed in the general case.                                              //
// XXX I guess if we had ES6 modules we could                                                                         //
// `import { isSandstorm } from sandstorm.js` and define the migration here as                                        //
// well, but for now I want to avoid definied too many globals.                                                       //
                                                                                                                      //
// In the context of migration functions we don't want to validate database                                           //
// mutation queries against the current (ie, latest) collection schema. Doing                                         //
// that would work at the time we write the migration but would break in the                                          //
// future when we'll update again the concerned collection schema.                                                    //
//                                                                                                                    //
// To prevent this bug we always have to disable the schema validation and                                            //
// argument transformations. We generally use the shorthandlers defined below.                                        //
var noValidate = {                                                                                                    // 20
  validate: false,                                                                                                    // 21
  filter: false,                                                                                                      // 22
  autoConvert: false,                                                                                                 // 23
  removeEmptyStrings: false,                                                                                          // 24
  getAutoValues: false                                                                                                // 25
};                                                                                                                    // 20
var noValidateMulti = _extends({}, noValidate, { multi: true });                                                      // 27
                                                                                                                      //
Migrations.add('board-background-color', function () {                                                                // 29
  var defaultColor = '#16A085';                                                                                       // 30
  Boards.update({                                                                                                     // 31
    background: {                                                                                                     // 32
      $exists: false                                                                                                  // 33
    }                                                                                                                 // 32
  }, {                                                                                                                // 31
    $set: {                                                                                                           // 36
      background: {                                                                                                   // 37
        type: 'color',                                                                                                // 38
        color: defaultColor                                                                                           // 39
      }                                                                                                               // 37
    }                                                                                                                 // 36
  }, noValidateMulti);                                                                                                // 35
});                                                                                                                   // 43
                                                                                                                      //
Migrations.add('lowercase-board-permission', function () {                                                            // 45
  ['Public', 'Private'].forEach(function (permission) {                                                               // 46
    Boards.update({ permission: permission }, { $set: { permission: permission.toLowerCase() } }, noValidateMulti);   // 47
  });                                                                                                                 // 52
});                                                                                                                   // 53
                                                                                                                      //
// Security migration: see https://github.com/wekan/wekan/issues/99                                                   //
Migrations.add('change-attachments-type-for-non-images', function () {                                                // 56
  var newTypeForNonImage = 'application/octet-stream';                                                                // 57
  Attachments.find().forEach(function (file) {                                                                        // 58
    if (!file.isImage()) {                                                                                            // 59
      Attachments.update(file._id, {                                                                                  // 60
        $set: {                                                                                                       // 61
          'original.type': newTypeForNonImage,                                                                        // 62
          'copies.attachments.type': newTypeForNonImage                                                               // 63
        }                                                                                                             // 61
      }, noValidate);                                                                                                 // 60
    }                                                                                                                 // 66
  });                                                                                                                 // 67
});                                                                                                                   // 68
                                                                                                                      //
Migrations.add('card-covers', function () {                                                                           // 70
  Cards.find().forEach(function (card) {                                                                              // 71
    var cover = Attachments.findOne({ cardId: card._id, cover: true });                                               // 72
    if (cover) {                                                                                                      // 73
      Cards.update(card._id, { $set: { coverId: cover._id } }, noValidate);                                           // 74
    }                                                                                                                 // 75
  });                                                                                                                 // 76
  Attachments.update({}, { $unset: { cover: '' } }, noValidateMulti);                                                 // 77
});                                                                                                                   // 78
                                                                                                                      //
Migrations.add('use-css-class-for-boards-colors', function () {                                                       // 80
  var associationTable = {                                                                                            // 81
    '#27AE60': 'nephritis',                                                                                           // 82
    '#C0392B': 'pomegranate',                                                                                         // 83
    '#2980B9': 'belize',                                                                                              // 84
    '#8E44AD': 'wisteria',                                                                                            // 85
    '#2C3E50': 'midnight',                                                                                            // 86
    '#E67E22': 'pumpkin'                                                                                              // 87
  };                                                                                                                  // 81
  Boards.find().forEach(function (board) {                                                                            // 89
    var oldBoardColor = board.background.color;                                                                       // 90
    var newBoardColor = associationTable[oldBoardColor];                                                              // 91
    Boards.update(board._id, {                                                                                        // 92
      $set: { color: newBoardColor },                                                                                 // 93
      $unset: { background: '' }                                                                                      // 94
    }, noValidate);                                                                                                   // 92
  });                                                                                                                 // 96
});                                                                                                                   // 97
                                                                                                                      //
Migrations.add('denormalize-star-number-per-board', function () {                                                     // 99
  Boards.find().forEach(function (board) {                                                                            // 100
    var nStars = Users.find({ 'profile.starredBoards': board._id }).count();                                          // 101
    Boards.update(board._id, { $set: { stars: nStars } }, noValidate);                                                // 102
  });                                                                                                                 // 103
});                                                                                                                   // 104
                                                                                                                      //
// We want to keep a trace of former members so we can efficiently publish their                                      //
// infos in the general board publication.                                                                            //
Migrations.add('add-member-isactive-field', function () {                                                             // 108
  Boards.find({}, { fields: { members: 1 } }).forEach(function (board) {                                              // 109
    var allUsersWithSomeActivity = _.chain(Activities.find({ boardId: board._id }, { fields: { userId: 1 } }).fetch()).pluck('userId').uniq().value();
    var currentUsers = _.pluck(board.members, 'userId');                                                              // 115
    var formerUsers = _.difference(allUsersWithSomeActivity, currentUsers);                                           // 116
                                                                                                                      //
    var newMemberSet = [];                                                                                            // 118
    board.members.forEach(function (member) {                                                                         // 119
      member.isActive = true;                                                                                         // 120
      newMemberSet.push(member);                                                                                      // 121
    });                                                                                                               // 122
    formerUsers.forEach(function (userId) {                                                                           // 123
      newMemberSet.push({                                                                                             // 124
        userId: userId,                                                                                               // 125
        isAdmin: false,                                                                                               // 126
        isActive: false                                                                                               // 127
      });                                                                                                             // 124
    });                                                                                                               // 129
    Boards.update(board._id, { $set: { members: newMemberSet } }, noValidate);                                        // 130
  });                                                                                                                 // 131
});                                                                                                                   // 132
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},"config":{"accounts.js":["babel-runtime/helpers/slicedToArray",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// config/accounts.js                                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _slicedToArray;module.import('babel-runtime/helpers/slicedToArray',{"default":function(v){_slicedToArray=v}});    //
var passwordField = AccountsTemplates.removeField('password');                                                        // 1
var emailField = AccountsTemplates.removeField('email');                                                              // 2
AccountsTemplates.addFields([{                                                                                        // 3
  _id: 'username',                                                                                                    // 4
  type: 'text',                                                                                                       // 5
  displayName: 'username',                                                                                            // 6
  required: true,                                                                                                     // 7
  minLength: 2                                                                                                        // 8
}, emailField, passwordField]);                                                                                       // 3
                                                                                                                      //
AccountsTemplates.configure({                                                                                         // 11
  defaultLayout: 'userFormsLayout',                                                                                   // 12
  defaultContentRegion: 'content',                                                                                    // 13
  confirmPassword: false,                                                                                             // 14
  enablePasswordChange: true,                                                                                         // 15
  sendVerificationEmail: true,                                                                                        // 16
  showForgotPasswordLink: true,                                                                                       // 17
  onLogoutHook: function onLogoutHook() {                                                                             // 18
    Meteor.call('processAuthLogout');                                                                                 // 19
    FlowRouter.go('signIn');                                                                                          // 20
  }                                                                                                                   // 21
});                                                                                                                   // 11
                                                                                                                      //
['signUp', 'resetPwd', 'forgotPwd', 'enrollAccount'].forEach(function (routeName) {                                   // 24
  return AccountsTemplates.configureRoute(routeName);                                                                 // 25
});                                                                                                                   // 25
                                                                                                                      //
// custom signIn page                                                                                                 //
AccountsTemplates.configureRoute('signIn', {                                                                          // 28
  layoutType: 'blaze',                                                                                                // 29
  name: 'signIn',                                                                                                     // 30
  path: '/sign-in',                                                                                                   // 31
  layoutTemplate: 'blanksContent'                                                                                     // 32
});                                                                                                                   // 28
                                                                                                                      //
Accounts.onLogin(function () {                                                                                        // 35
  FlowRouter.go("home");                                                                                              // 36
});                                                                                                                   // 37
                                                                                                                      //
// We display the form to change the password in a popup window that already                                          //
// have a title, so we unset the title automatically displayed by useraccounts.                                       //
AccountsTemplates.configure({                                                                                         // 41
  texts: {                                                                                                            // 42
    title: {                                                                                                          // 43
      changePwd: ''                                                                                                   // 44
    }                                                                                                                 // 43
  }                                                                                                                   // 42
});                                                                                                                   // 41
                                                                                                                      //
AccountsTemplates.configureRoute('changePwd', {                                                                       // 49
  redirect: function redirect() {                                                                                     // 50
    // XXX We should emit a notification once we have a notification system.                                          //
    // Currently the user has no indication that his modification has been                                            //
    // applied.                                                                                                       //
    Popup.back();                                                                                                     // 54
  }                                                                                                                   // 55
});                                                                                                                   // 49
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 58
  if (process.env.MAIL_FROM) {                                                                                        // 59
    Accounts.emailTemplates.from = process.env.MAIL_FROM;                                                             // 60
  }                                                                                                                   // 61
                                                                                                                      //
  ['resetPassword-subject', 'resetPassword-text', 'verifyEmail-subject', 'verifyEmail-text', 'enrollAccount-subject', 'enrollAccount-text'].forEach(function (str) {
    var _str$split = str.split('-');                                                                                  // 63
                                                                                                                      //
    var _str$split2 = _slicedToArray(_str$split, 2);                                                                  // 63
                                                                                                                      //
    var templateName = _str$split2[0];                                                                                // 63
    var field = _str$split2[1];                                                                                       // 63
                                                                                                                      //
    Accounts.emailTemplates[templateName][field] = function (user, url) {                                             // 65
      return TAPi18n.__('email-' + str, {                                                                             // 66
        url: url,                                                                                                     // 67
        user: user.getName(),                                                                                         // 68
        siteName: Accounts.emailTemplates.siteName                                                                    // 69
      }, user.getLanguage());                                                                                         // 66
    };                                                                                                                // 71
  });                                                                                                                 // 72
}                                                                                                                     // 73
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"router.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// config/router.js                                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var previousPath = void 0;                                                                                            // 1
FlowRouter.triggers.exit([function (_ref) {                                                                           // 2
  var path = _ref.path;                                                                                               // 2
                                                                                                                      //
  previousPath = path;                                                                                                // 3
}]);                                                                                                                  // 4
                                                                                                                      //
FlowRouter.route('/', {                                                                                               // 6
  name: 'home',                                                                                                       // 7
  triggersEnter: [AccountsTemplates.ensureSignedIn],                                                                  // 8
  action: function action() {                                                                                         // 9
    Session.set('currentBoard', null);                                                                                // 10
    Session.set('currentCard', null);                                                                                 // 11
    Session.set('currentList', null);                                                                                 // 12
    Utils.closeNotif();                                                                                               // 13
                                                                                                                      //
    Filter.reset();                                                                                                   // 15
    EscapeActions.executeAll();                                                                                       // 16
                                                                                                                      //
    BlazeLayout.render('defaultLayout', {                                                                             // 18
      headerBar: 'boardListHeaderBar',                                                                                // 19
      content: 'boardList'                                                                                            // 20
    });                                                                                                               // 18
  }                                                                                                                   // 22
});                                                                                                                   // 6
                                                                                                                      //
FlowRouter.route('/callback', {                                                                                       // 25
  name: 'callback',                                                                                                   // 26
  action: function action(params, queryParams) {                                                                      // 27
    // console.log(localStorage.getItem('authId'));                                                                   //
    // console.log(localStorage.getItem('authDomain'));                                                               //
    // console.log(params);                                                                                           //
    // console.log(queryParams);                                                                                      //
    // console.log((window.location.hash).split("#id_token=")[1]);                                                    //
    // let id_token = (window.location.hash).split("#id_token=")[1]                                                   //
    console.log("on callback");                                                                                       // 34
    var lock = new Auth0Lock(localStorage.getItem('authId'), localStorage.getItem('authDomain'));                     // 35
    lock.getUserInfo(localStorage.getItem('userToken'), function (error, profile) {                                   // 36
      if (error) {                                                                                                    // 37
        console.log("error :: ", error);                                                                              // 38
        FlowRouter.go('signIn');                                                                                      // 39
      } else {                                                                                                        // 40
        console.log("profile : ", profile);                                                                           // 41
        // localStorage.setItem('userToken', authResult.accessToken);                                                 //
        // localStorage.setItem('connection-name', getConnectionFromProfile(profile));                                //
        // localStorage.setItem('userProfile', JSON.stringify(profile));                                              //
        // FlowRouter.go('callback');                                                                                 //
      }                                                                                                               // 46
    });                                                                                                               // 47
                                                                                                                      //
    // Meteor.call('processAuthLogin', queryParams.code, function (err, response) {                                   //
    //   if (err || response.error) {                                                                                 //
    //     FlowRouter.go('home');                                                                                     //
    //   } else {                                                                                                     //
    //     // Meteor.loginWithPassword(response.username, response.password);                                         //
    //   }                                                                                                            //
    // });                                                                                                            //
                                                                                                                      //
    BlazeLayout.render('blanksLayout', {                                                                              // 57
      content: 'loadingCallback'                                                                                      // 58
    });                                                                                                               // 57
  }                                                                                                                   // 60
});                                                                                                                   // 25
                                                                                                                      //
FlowRouter.route('/b/:id/:slug', {                                                                                    // 63
  name: 'board',                                                                                                      // 64
  triggersEnter: [AccountsTemplates.ensureSignedIn],                                                                  // 65
  action: function action(params) {                                                                                   // 66
    var currentBoard = params.id;                                                                                     // 67
    var previousBoard = Session.get('currentBoard');                                                                  // 68
    Session.set('currentBoard', currentBoard);                                                                        // 69
    Session.set('currentCard', null);                                                                                 // 70
    Session.set('currentList', null);                                                                                 // 71
    Utils.closeNotif();                                                                                               // 72
                                                                                                                      //
    // If we close a card, we'll execute again this route action but we don't                                         //
    // want to excape every current actions (filters, etc.)                                                           //
    if (previousBoard !== currentBoard) {                                                                             // 76
      EscapeActions.executeAll();                                                                                     // 77
    } else {                                                                                                          // 78
      EscapeActions.executeUpTo('popup-close');                                                                       // 79
    }                                                                                                                 // 80
                                                                                                                      //
    BlazeLayout.render('defaultLayout', {                                                                             // 82
      headerBar: 'boardHeaderBar',                                                                                    // 83
      content: 'board'                                                                                                // 84
    });                                                                                                               // 82
  }                                                                                                                   // 86
});                                                                                                                   // 63
                                                                                                                      //
FlowRouter.route('/b/:boardId/:slug/l/:listId', {                                                                     // 89
  name: 'list',                                                                                                       // 90
  triggersEnter: [AccountsTemplates.ensureSignedIn],                                                                  // 91
  action: function action(params) {                                                                                   // 92
    EscapeActions.executeUpTo('inlinedForm');                                                                         // 93
    Utils.closeNotif();                                                                                               // 94
                                                                                                                      //
    Session.set('currentBoard', params.boardId);                                                                      // 96
    Session.set('currentCard', null);                                                                                 // 97
    Session.set('currentList', params.listId);                                                                        // 98
                                                                                                                      //
    BlazeLayout.render('defaultLayout', {                                                                             // 100
      headerBar: 'boardHeaderBar',                                                                                    // 101
      content: 'board'                                                                                                // 102
    });                                                                                                               // 100
  }                                                                                                                   // 104
});                                                                                                                   // 89
                                                                                                                      //
FlowRouter.route('/b/:boardId/:slug/:cardId', {                                                                       // 107
  name: 'card',                                                                                                       // 108
  triggersEnter: [AccountsTemplates.ensureSignedIn],                                                                  // 109
  action: function action(params) {                                                                                   // 110
    if (Meteor.user()) {                                                                                              // 111
      Meteor.subscribe('user-extra-group', Meteor.user()._id);                                                        // 112
    }                                                                                                                 // 113
    EscapeActions.executeUpTo('inlinedForm');                                                                         // 114
                                                                                                                      //
    Utils.closeNotif();                                                                                               // 116
                                                                                                                      //
    Session.set('currentBoard', params.boardId);                                                                      // 118
    Session.set('currentCard', params.cardId);                                                                        // 119
    Session.set('currentList', null);                                                                                 // 120
                                                                                                                      //
    BlazeLayout.render('defaultLayout', {                                                                             // 122
      headerBar: 'boardHeaderBar',                                                                                    // 123
      content: 'board'                                                                                                // 124
    });                                                                                                               // 122
  }                                                                                                                   // 126
});                                                                                                                   // 107
                                                                                                                      //
FlowRouter.route('/shortcuts', {                                                                                      // 129
  name: 'shortcuts',                                                                                                  // 130
  action: function action() {                                                                                         // 131
    var shortcutsTemplate = 'keyboardShortcuts';                                                                      // 132
                                                                                                                      //
    EscapeActions.executeUpTo('popup-close');                                                                         // 134
                                                                                                                      //
    if (previousPath) {                                                                                               // 136
      Modal.open(shortcutsTemplate, {                                                                                 // 137
        header: 'shortcutsModalTitle',                                                                                // 138
        onCloseGoTo: previousPath                                                                                     // 139
      });                                                                                                             // 137
    } else {                                                                                                          // 141
      BlazeLayout.render('defaultLayout', {                                                                           // 142
        headerBar: 'shortcutsHeaderBar',                                                                              // 143
        content: shortcutsTemplate                                                                                    // 144
      });                                                                                                             // 142
    }                                                                                                                 // 146
  }                                                                                                                   // 147
});                                                                                                                   // 129
                                                                                                                      //
FlowRouter.route('/import', {                                                                                         // 150
  name: 'import',                                                                                                     // 151
  triggersEnter: [AccountsTemplates.ensureSignedIn, function () {                                                     // 152
    Session.set('currentBoard', null);                                                                                // 155
    Session.set('currentCard', null);                                                                                 // 156
                                                                                                                      //
    Filter.reset();                                                                                                   // 158
    EscapeActions.executeAll();                                                                                       // 159
  }],                                                                                                                 // 160
  action: function action() {                                                                                         // 162
    BlazeLayout.render('defaultLayout', {                                                                             // 163
      headerBar: 'importHeaderBar',                                                                                   // 164
      content: 'import'                                                                                               // 165
    });                                                                                                               // 163
  }                                                                                                                   // 167
});                                                                                                                   // 150
                                                                                                                      //
FlowRouter.notFound = {                                                                                               // 170
  action: function action() {                                                                                         // 171
    BlazeLayout.render('defaultLayout', { content: 'notFound' });                                                     // 172
  }                                                                                                                   // 173
};                                                                                                                    // 170
                                                                                                                      //
// We maintain a list of redirections to ensure that we don't break old URLs                                          //
// when we change our routing scheme.                                                                                 //
var redirections = {                                                                                                  // 178
  '/boards': '/',                                                                                                     // 179
  '/boards/:id/:slug': '/b/:id/:slug',                                                                                // 180
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId'                                                                 // 181
};                                                                                                                    // 178
                                                                                                                      //
_.each(redirections, function (newPath, oldPath) {                                                                    // 184
  FlowRouter.route(oldPath, {                                                                                         // 185
    triggersEnter: [function (context, redirect) {                                                                    // 186
      redirect(FlowRouter.path(newPath, context.params));                                                             // 187
    }]                                                                                                                // 188
  });                                                                                                                 // 185
});                                                                                                                   // 190
                                                                                                                      //
// // As it is not possible to use template helpers in the page <head> we create a                                    //
// // reactive function whose role is to set any page-specific tag in the <head>                                      //
// // using the `kadira:dochead` package. Currently we only use it to display the                                     //
// // board title if we are in a board page (see #364) but we may want to support                                     //
// // some <meta> tags in the future.                                                                                 //
// const appTitle = 'Wekan';                                                                                          //
                                                                                                                      //
// // XXX The `Meteor.startup` should not be necessary -- we don't need to wait for                                   //
// // the complete DOM to be ready to call `DocHead.setTitle`. But the problem is                                     //
// // that the global variable `Boards` is undefined when this file loads so we                                       //
// // wait a bit until hopefully all files are loaded. This will be fixed in a                                        //
// // clean way once Meteor will support ES6 modules -- hopefully in Meteor 1.3.                                      //
// Meteor.isClient && Meteor.startup(() => {                                                                          //
//   Tracker.autorun(() => {                                                                                          //
//     const currentBoard = Boards.findOne(Session.get('currentBoard'));                                              //
//     const titleStack = [appTitle];                                                                                 //
//     if (currentBoard) {                                                                                            //
//       titleStack.push(currentBoard.title);                                                                         //
//     }                                                                                                              //
//     DocHead.setTitle(titleStack.reverse().join(' - '));                                                            //
//   });                                                                                                              //
// });                                                                                                                //
                                                                                                                      //
Meteor.isClient && Meteor.startup(function () {                                                                       // 215
  Tracker.autorun(function () {                                                                                       // 216
    var currentBoard = Boards.findOne(Session.get('currentBoard'));                                                   // 217
    var titleStack = [];                                                                                              // 218
    if (currentBoard) {                                                                                               // 219
      titleStack.push(currentBoard.title);                                                                            // 220
    }                                                                                                                 // 221
    DocHead.setTitle(titleStack);                                                                                     // 222
  });                                                                                                                 // 223
});                                                                                                                   // 224
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"i18n":{"ar.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ar.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ar"] = ["Arabic","العربية"];
TAPi18n._enable({"helper_name":"_","supported_languages":null,"i18n_files_route":"/tap-i18n","preloaded_langs":[],"cdn_path":null});
TAPi18n.languages_names["en"] = ["English","English"];
if(_.isUndefined(TAPi18n.translations["ar"])) {
  TAPi18n.translations["ar"] = {};
}

if(_.isUndefined(TAPi18n.translations["ar"][namespace])) {
  TAPi18n.translations["ar"][namespace] = {};
}

_.extend(TAPi18n.translations["ar"][namespace], {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"الإجراءات","activities":"الأنشطة","activity":"النشاط","activity-added":"تمت إضافة %s ل %s","activity-archived":"إلى الأرشيف %s","activity-attached":"إرفاق %s ل %s","activity-created":"أنشأ %s","activity-excluded":"استبعاد %s عن %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"انضم %s","activity-moved":"تم نقل %s من %s إلى %s","activity-on":"على %s","activity-removed":"حذف %s إلى %s","activity-sent":"إرسال %s إلى %s","activity-unjoined":"غادر %s","activity-checklist-added":"added checklist to %s","add":"أضف","add-attachment":"إرفاق ملف","add-board":"إضافة لوحة","add-card":"إضافة بطاقة","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"إضافة غلاف","add-label":"إضافة علامة","add-list":"إضافة قائمة","add-members":"تعيين أعضاء","added":"أُضيف","addMemberPopup-title":"الأعضاء","admin":"المدير","admin-desc":"إمكانية مشاهدة و تعديل و حذف أعضاء ، و تعديل إعدادات اللوحة أيضا.","all-boards":"كل اللوحات","and-n-other-card":"And __count__ other بطاقة","and-n-other-card_plural":"And __count__ other بطاقات","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"أرشف","archive-all":"أرشف الكل","archive-board":"أرشف اللوحة","archive-card":"أرشف البطاقة","archive-list":"أرشف هذه القائمة","archive-selection":"أرشف المُحدّد","archiveBoardPopup-title":"Archive Board?","archived-items":"عناصر في الأرشيف","archives":"أرشيفات","assign-member":"تعيين عضو","attached":"أُرفق)","attachment":"مرفق","attachment-delete-pop":"حذف المرق هو حذف نهائي . لا يمكن التراجع إذا حذف.","attachmentDeletePopup-title":"تريد حذف المرفق ?","attachments":"المرفقات","auto-watch":"Automatically watch boards when create it","avatar-too-big":"حجم ملف الصورة الخاصة بك كبير . لا يمكن  أن تتجاوز 70 كيلو أكتي","back":"رجوع","board-change-color":"تغيير اللومr","board-nb-stars":"%s نجوم","board-not-found":"لوحة مفقودة","board-private-info":"سوف تصبح هذه اللوحة <strong>خاصة</strong>","board-public-info":"سوف تصبح هذه اللوحة <strong>عامّة</strong>.","boardChangeColorPopup-title":"تعديل خلفية الشاشة","boardChangeTitlePopup-title":"إعادة تسمية اللوحة","boardChangeVisibilityPopup-title":"تعديل وضوح الرؤية","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"قائمة اللوحة","boards":"لوحات","bucket-example":"مثل « todo list » على سبيل المثال","cancel":"إلغاء","card-archived":"هذه البطاقة أُرشفت.","card-comments-title":"%s تعليقات لهذه البطاقة","card-delete-notice":"هذا حذف أبديّ . سوف تفقد كل الإجراءات المنوطة بهذه البطاقة","card-delete-pop":"سيتم إزالة جميع الإجراءات من تبعات النشاط، وأنك لن تكون قادرا على إعادة فتح البطاقة. لا يوجد التراجع.","card-delete-suggest-archive":"يمكنك أرشفة بطاقة لحذفها من اللوحة والمحافظة على النشاط.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"تعديل المرفقات","card-edit-labels":"تعديل العلامات","card-edit-members":"تعديل الأعضاء","card-labels-title":"تعديل علامات البطاقة.","card-members-title":"إضافة او حذف أعضاء للبطاقة.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"إرفاق من","cardDeletePopup-title":"حذف البطاقة ?","cardDetailsActionsPopup-title":"إجراءات على البطاقة","cardLabelsPopup-title":"علامات","cardMembersPopup-title":"أعضاء","cardMorePopup-title":"المزيد","cards":"بطاقات","change":"Change","change-avatar":"تعديل الصورة الشخصية","change-password":"تغيير كلمة المرور","change-permissions":"تعديل الصلاحيات","change-settings":"Change Settings","changeAvatarPopup-title":"تعديل الصورة الشخصية","changeLanguagePopup-title":"تغيير اللغة","changePasswordPopup-title":"تغيير كلمة المرور","changePermissionsPopup-title":"تعديل الصلاحيات","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"اضغط لإضافة اللوحة للمفضلة.","click-to-unstar":"اضغط لحذف اللوحة من المفضلة.","clipboard":"Clipboard or drag & drop","close":"غلق","close-board":"غلق اللوحة","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"تعليق","comment-placeholder":"صياغة تعليق","computer":"حاسوب","create":"إنشاء","createBoardPopup-title":"إنشاء لوحة","createLabelPopup-title":"إنشاء علامة","current":"الحالي","date":"Date","decline":"Decline","default-avatar":"صورة شخصية افتراضية","delete":"حذف","deleteLabelPopup-title":"حذف العلامة ?","description":"وصف","disambiguateMultiLabelPopup-title":"تحديد الإجراء على العلامة","disambiguateMultiMemberPopup-title":"تحديد الإجراء على العضو","discard":"التخلص منها","done":"Done","download":"تنزيل","edit":"تعديل","edit-avatar":"تعديل الصورة الشخصية","edit-profile":"تعديل الملف الشخصي","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"تعديل العلامة","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"تعديل الملف الشخصي","email":"البريد الإلكتروني","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"تصفية","filter-cards":"تصفية البطاقات","filter-clear":"مسح التصفية","filter-no-label":"No label","filter-no-member":"No member","filter-on":"التصفية تشتغل","filter-on-desc":"أنت بصدد تصفية بطاقات هذه اللوحة. اضغط هنا لتعديل التصفية.","filter-to-selection":"تصفية بالتحديد","fullname":"الإسم الكامل","header-logo-title":"الرجوع إلى صفحة اللوحات","hide-system-messages":"Hide system messages","home":"الرئيسية","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"معلومات","initials":"أولية","invalid-date":"Invalid date","joined":"انضمّ","just-invited":"You are just invited to this board","keyboard-shortcuts":"اختصار لوحة المفاتيح","label-create":"إنشاء علامة جديدة","label-default":"%s علامة (افتراضية)","label-delete-pop":"لا يوجد تراجع. سيؤدي هذا إلى إزالة هذه العلامة من جميع بطاقات والقضاء على تأريخها","labels":"علامات","language":"لغة","last-admin-desc":"لا يمكن تعديل الأدوار لأن ذلك يتطلب  صلاحيات المدير.","leave-board":"مغادرة اللوحة","link-card":"ربط هذه البطاقة","list-archive-cards":"أرضفت بطاقات هذه القائمة","list-archive-cards-pop":"سيقتضي هذا أرشفة جميع بطاقات هذه القائمة. لمشاهدة أرشيف البطاقات أو إعادتها إلى اللوحة، اضغط على -القائمة- ثم - أرشيف العناصر-","list-move-cards":"نقل بطاقات هذه القائمة","list-select-cards":"تحديد بطاقات هذه القائمة","listActionPopup-title":"قائمة الإجراءات","listImportCardPopup-title":"Import a Trello card","lists":"القائمات","log-out":"تسجيل الخروج","log-in":"تسجيل الدخول","loginPopup-title":"تسجيل الدخول","memberMenuPopup-title":"أفضليات الأعضاء","members":"أعضاء","menu":"القائمة","move-selection":"Move selection","moveCardPopup-title":"نقل البطاقة","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"تحديد أكثر من واحدة","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"لوحاتي","name":"اسم","no-archived-cards":"لا يوجد بطاقة في الأرشيف.","no-archived-lists":"لا يوجد قائمة في الأرشيف.","no-results":"لا توجد نتائج","normal":"عادي","normal-desc":"يمكن مشاهدة و تعديل  البطاقات. لا يمكن تغيير إعدادات الضبط.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"اختياري","or":"or","page-maybe-private":"قدتكون هذه الصفحة خاصة . قد تستطيع مشاهدتها ب  <a href='%s'>تسجيل الدخول</a>.","page-not-found":"صفحة غير موجودة","password":"كلمة المرور","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"خاص","private-desc":"هذه اللوحة خاصة . لا يسمح إلا للأعضاء .","profile":"ملف شخصي","public":"عامّ","public-desc":"هذه اللوحة عامة: مرئية لكلّ من يحصل على الرابط ، و هي مرئية أيضا  في محركات البحث مثل جوجل. التعديل مسموح به للأعضاء فقط.","quick-access-description":"أضف لوحة إلى المفضلة لإنشاء اختصار في هذا الشريط.","remove-cover":"حذف الغلاف","remove-from-board":"حذف من اللوحة","remove-label":"حذف هذه العلامة","remove-list":"Remove the list","remove-member":"حذف العضو","remove-member-from-card":"حذف من البطاقة","remove-member-pop":"حذف __name__ (__username__) من __boardTitle__ ? سيتم حذف هذا العضو من جميع بطاقة اللوحة مع إرسال إشعار له بذاك.","removeMemberPopup-title":"حذف العضو ?","rename":"إعادة التسمية","rename-board":"إعادة تسمية اللوحة","restore":"استعادة","save":"حفظ","search":"بحث","select-color":"اختيار لون","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"الإكمال التلقائي  للرموز التعبيرية","shortcut-autocomplete-members":"الإكمال التلقائي لأسماء الأعضاء","shortcut-clear-filters":"مسح التصفيات","shortcut-close-dialog":"غلق النافذة","shortcut-filter-my-cards":"تصفية بطاقاتي","shortcut-show-shortcuts":"عرض قائمة الإختصارات ،تلك","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"إظهار-إخفاء الشريط الجانبي للوحة","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"إنشاء حساب","star-board-title":"اضغط لإضافة هذه اللوحة إلى المفضلة . سوف يتم إظهارها على رأس بقية اللوحات.","starred-boards":"اللوحات المفضلة","starred-boards-description":"تعرض اللوحات المفضلة على رأس بقية اللوحات.","subscribe":"اشتراك و متابعة","team":"فريق","this-board":"هذه اللوحة","this-card":"هذه البطاقة","time":"Time","title":"عنوان","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"إلغاء تعيين العضو","unsaved-description":"لديك وصف غير محفوظ","unwatch":"Unwatch","upload":"Upload","upload-avatar":"رفع صورة شخصية","uploaded-avatar":"تم رفع الصورة الشخصية","username":"اسم المستخدم","view-it":"شاهدها","warn-list-archived":"انتبه : هذه البطاقة في أرشيف القائمات","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"ماذا تريد أن تنجز?"});
TAPi18n._registerServerTranslator("ar", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"br.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/br.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["br"] = ["br","br"];
if(_.isUndefined(TAPi18n.translations["br"])) {
  TAPi18n.translations["br"] = {};
}

if(_.isUndefined(TAPi18n.translations["br"][namespace])) {
  TAPi18n.translations["br"][namespace] = {};
}

_.extend(TAPi18n.translations["br"][namespace], {"accept":"Asantiñ","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Oberoù","activities":"Oberiantizoù","activity":"Oberiantiz","activity-added":"%s ouzhpennet da %s","activity-archived":"%s diellaouet","activity-attached":"%s liammet ouzh %s","activity-created":"%s krouet","activity-excluded":"excluded %s from %s","activity-imported":"%s enporzhiet eus %s da %s","activity-imported-board":"%s enporzhiet da %s","activity-joined":"joined %s","activity-moved":"moved %s from %s to %s","activity-on":"on %s","activity-removed":"removed %s from %s","activity-sent":"sent %s to %s","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Ouzhpenn","add-attachment":"Add an attachment","add-board":"Add a new board","add-card":"Ouzhpenn ur gartenn","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Ouzphenn ur golo","add-label":"Ouzhpenn an titl","add-list":"Ouzhpenn ur roll","add-members":"Ouzhpenn izili","added":"Ouzhpennet","addMemberPopup-title":"Izili","admin":"Merour","admin-desc":"Can view and edit cards, remove members, and change settings for the board.","all-boards":"All boards","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archive","archive-all":"Archive All","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"Archive this list","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"Archived Items","archives":"Archives","assign-member":"Assign member","attached":"attached","attachment":"Attachment","attachment-delete-pop":"Deleting an attachment is permanent. There is no undo.","attachmentDeletePopup-title":"Delete Attachment?","attachments":"Attachments","auto-watch":"Automatically watch boards when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"Back","board-change-color":"Kemmañ al liv","board-nb-stars":"%s stered","board-not-found":"Board not found","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"This board will be <strong>public</strong>.","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"Rename Board","boardChangeVisibilityPopup-title":"Change Visibility","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Board Menu","boards":"Boards","bucket-example":"Like “Bucket List” for example","cancel":"Cancel","card-archived":"This card is archived.","card-comments-title":"This card has %s comment.","card-delete-notice":"Deleting is permanent. You will lose all actions associated with this card.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-labels-title":"Change the labels for the card.","card-members-title":"Add or remove members of the board from the card.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"Diverkañ ar gartenn ?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Izili","cardMorePopup-title":"Muioc’h","cards":"Kartennoù","change":"Change","change-avatar":"Change Avatar","change-password":"Kemmañ ger-tremen","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"Change Avatar","changeLanguagePopup-title":"Change Language","changePasswordPopup-title":"Kemmañ ger-tremen","changePermissionsPopup-title":"Change Permissions","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Click to star this board.","click-to-unstar":"Click to unstar this board.","clipboard":"Clipboard or drag & drop","close":"Close","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"du","color-blue":"glas","color-green":"gwer","color-lime":"melen sitroñs","color-orange":"orañjez","color-pink":"roz","color-purple":"mouk","color-red":"ruz","color-sky":"pers","color-yellow":"melen","comment":"Comment","comment-placeholder":"Write a comment","computer":"Computer","create":"Krouiñ","createBoardPopup-title":"Create Board","createLabelPopup-title":"Create Label","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"Diverkañ","deleteLabelPopup-title":"Delete Label?","description":"Description","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Graet","download":"Download","edit":"Kemmañ","edit-avatar":"Change Avatar","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Change Label","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edit Profile","email":"Email","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Filter","filter-cards":"Filter Cards","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"You are filtering cards on this board. Click here to edit filter.","filter-to-selection":"Filter to selection","fullname":"Full Name","header-logo-title":"Go back to your boards page.","hide-system-messages":"Hide system messages","home":"Home","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Infos","initials":"Initials","invalid-date":"Invalid date","joined":"joined","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Create a new label","label-default":"%s label (default)","label-delete-pop":"There is no undo. This will remove this label from all cards and destroy its history.","labels":"Labels","language":"Yezh","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Leave Board","link-card":"Link to this card","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"List Actions","listImportCardPopup-title":"Import a Trello card","lists":"Lists","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Member Settings","members":"Izili","menu":"Menu","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"My Boards","name":"Name","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"No results","normal":"Normal","normal-desc":"Can view and edit cards. Can't change settings.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"optional","or":"or","page-maybe-private":"This page may be private. You may be able to view it by <a href='%s'>logging in</a>.","page-not-found":"Page not found.","password":"Ger-tremen","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"Private","private-desc":"This board is private. Only people added to the board can view and edit it.","profile":"Profile","public":"Public","public-desc":"This board is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the board can edit.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Remove Cover","remove-from-board":"Remove from Board","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"Remove Member","remove-member-from-card":"Remove from Card","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all cards on this board. They will receive a notification.","removeMemberPopup-title":"Remove Member?","rename":"Rename","rename-board":"Rename Board","restore":"Restore","save":"Save","search":"Search","select-color":"Select a color","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Create an Account","star-board-title":"Click to star this board. It will show up at top of your boards list.","starred-boards":"Starred Boards","starred-boards-description":"Starred boards show up at the top of your boards list.","subscribe":"Subscribe","team":"Team","this-board":"this board","this-card":"this card","time":"Time","title":"Title","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"Username","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"What do you want to do?"});
TAPi18n._registerServerTranslator("br", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ca.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ca.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ca"] = ["Catalan","Català"];
if(_.isUndefined(TAPi18n.translations["ca"])) {
  TAPi18n.translations["ca"] = {};
}

if(_.isUndefined(TAPi18n.translations["ca"][namespace])) {
  TAPi18n.translations["ca"][namespace] = {};
}

_.extend(TAPi18n.translations["ca"][namespace], {"accept":"Accepta","act-activity-notify":"[Wekan] Notificació d'activitat","act-addAttachment":"adjuntat __attachment__ a __card__","act-addComment":"comentat a __card__: __comment__","act-createBoard":"creat __board__","act-createCard":"afegit/da __card__ a __list__","act-createList":"afegit/da __list__ a __board__","act-addBoardMember":"afegit/da __member__ a __board__","act-archivedBoard":"__board__ arxivat","act-archivedCard":"__card__ arxivat/da","act-archivedList":"__list__ arxivat/da","act-importBoard":"__board__ importat","act-importCard":"__card__ importat","act-importList":"__list__ importat","act-joinMember":"afegit/da __member__ a __card__","act-moveCard":"mou __card__ de __oldList__ a __list__","act-removeBoardMember":"elimina __member__ de __board__","act-restoredCard":"recupera __card__ a __board__","act-unjoinMember":"elimina __member__ de __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Accions","activities":"Activitats","activity":"Activitat","activity-added":"ha afegit %s a %s","activity-archived":"ha arxivat %s","activity-attached":"ha adjuntat %s a %s","activity-created":"ha creat %s","activity-excluded":"ha exclòs %s de %s","activity-imported":"importat %s dins %s des de %s","activity-imported-board":"importat %s des de %s","activity-joined":"s'ha unit a %s","activity-moved":"ha mogut %s de %s a %s","activity-on":"en %s","activity-removed":"ha eliminat %s de %s","activity-sent":"ha enviat %s %s","activity-unjoined":"desassignat %s","activity-checklist-added":"Checklist afegida a %s","add":"Afegeix","add-attachment":"Afegeix arxiu adjunt","add-board":"Afegeix un nou tauler","add-card":"Afegeix fitxa","add-checklist":"Afegeix  una checklist","add-checklist-item":"Afegeix un ítem","add-cover":"Afegeix coberta","add-label":"Afegeix etiqueta","add-list":"Afegeix llista","add-members":"Afegeix membres","added":"Afegit","addMemberPopup-title":"Membres","admin":"Administrador","admin-desc":"Pots veure i editar fitxes, eliminar membres, i canviar la configuració del tauler","all-boards":"Tots els taulers","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Aplica","app-is-offline":"L'aplicació éstà fora de línia. Si refresca la pàgina perdrà les dades.","archive":"Desa","archive-all":"Desa Tot","archive-board":"Arxiva tauler","archive-card":"Arxiva fitxa","archive-list":"Arxiva aquesta llista","archive-selection":"Arxiva selecció","archiveBoardPopup-title":"Arxivar el tauler?","archived-items":"Elements arxivats","archives":"Arxivats","assign-member":"Assignar membre","attached":"adjuntat","attachment":"Adjunt","attachment-delete-pop":"L'esborrat d'un arxiu adjunt és permanent. No es pot desfer.","attachmentDeletePopup-title":"Esborrar adjunt?","attachments":"Adjunts","auto-watch":"Veure els taulers automàticament després de crear-los","avatar-too-big":"L'avatar és massa gran (70Kb max)","back":"Enrere","board-change-color":"Canvia el color","board-nb-stars":"%s estrelles","board-not-found":"No s'ha trobat el tauler","board-private-info":"Aquest tauler serà <strong> privat </ strong>.","board-public-info":"Aquest tauler serà <strong> públic </ strong>.","boardChangeColorPopup-title":"Canvia fons","boardChangeTitlePopup-title":"Canvia el nom tauler","boardChangeVisibilityPopup-title":"Canvia visibilitat","boardChangeWatchPopup-title":"Canvia seguiment","boardMenuPopup-title":"Menú del tauler","boards":"Taulers","bucket-example":"Igual que “Bucket List”,  per exemple","cancel":"Cancel·la","card-archived":"Aquesta fitxa està arxivada.","card-comments-title":"Aquesta fitxa té %s comentaris.","card-delete-notice":"L'esborrat és permanent. Perdreu totes les accions associades a aquesta fitxa.","card-delete-pop":"Totes les accions s'eliminaran de l'activitat i no podreu tornar a obrir la fitxa. No es pot desfer.","card-delete-suggest-archive":"Podeu arxivar una fitxa per extreure-la del tauler i preservar l'activitat.","card-due":"Finalitza","card-due-on":"Finalitza a","card-edit-attachments":"Edita arxius adjunts","card-edit-labels":"Edita etiquetes","card-edit-members":"Edita membres","card-labels-title":"Canvia les etiquetes de la fitxa","card-members-title":"Afegeix o eliminar membres del tauler des de la fitxa.","card-start":"Comença","card-start-on":"Comença a","cardAttachmentsPopup-title":"Adjunta des de","cardDeletePopup-title":"Esborrar fitxa?","cardDetailsActionsPopup-title":"Accions de fitxes","cardLabelsPopup-title":"Etiquetes","cardMembersPopup-title":"Membres","cardMorePopup-title":"Més","cards":"Fitxes","change":"Canvia","change-avatar":"Canvia Avatar","change-password":"Canvia la clau","change-permissions":"Canvia permisos","change-settings":"Canvia configuració","changeAvatarPopup-title":"Canvia Avatar","changeLanguagePopup-title":"Canvia idioma","changePasswordPopup-title":"Canvia la contrasenya","changePermissionsPopup-title":"Canvia permisos","changeSettingsPopup-title":"Canvia configuració","checklists":"Checklists","click-to-star":"Fes clic per destacar aquest tauler.","click-to-unstar":"Fes clic per deixar de destacar aquest tauler.","clipboard":"Portaretalls o estirar i amollar","close":"Tanca","close-board":"Tanca tauler","close-board-pop":"Podràs restaurar el tauler, seleccionant \"Arxivats\" de la finistra principal","color-black":"negre","color-blue":"blau","color-green":"verd","color-lime":"llima","color-orange":"taronja","color-pink":"rosa","color-purple":"púrpura","color-red":"vermell","color-sky":"cel","color-yellow":"groc","comment":"Comentari","comment-placeholder":"Escriu un comentari","computer":"Ordinador","create":"Crea","createBoardPopup-title":"Crea tauler","createLabelPopup-title":"Crea etiqueta","current":"Actual","date":"Data","decline":"Declina","default-avatar":"Avatar per defecte","delete":"Esborra","deleteLabelPopup-title":"Esborra etiqueta","description":"Descripció","disambiguateMultiLabelPopup-title":"Desfe l'ambigüitat en les etiquetes","disambiguateMultiMemberPopup-title":"Desfe l'ambigüitat en els membres","discard":"Descarta","done":"Fet","download":"Descarrega","edit":"Edita","edit-avatar":"Canvia Avatar","edit-profile":"Edita el teu Perfil","editCardStartDatePopup-title":"Canvia data d'inici","editCardDueDatePopup-title":"Canvia data de finalització","editLabelPopup-title":"Canvia etiqueta","editNotificationPopup-title":"Edita la notificació","editProfilePopup-title":"Edita teu Perfil","email":"Correu electrònic","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hola __user__,\n\nPer començar a utilitzar el servei, segueix l'enllaç següent.\n\n__url__\n\nGràcies.","email-fail":"Error enviant el correu","email-invalid":"Adreça de correu invàlida","email-invite":"Convida mitjançant correu electrònic","email-invite-subject":"__inviter__ t'ha convidat","email-invite-text":"Benvolgut __user__,\n\n __inviter__ t'ha convidat a participar al tauler \"__board__\" per col·laborar-hi.\n\nSegueix l'enllaç següent:\n\n __url__\n\n Gràcies.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hola __user__,\n \n per resetejar la teva contrasenya, segueix l'enllaç següent.\n \n __url__\n \n Gràcies.","email-sent":"Correu enviat","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hola __user__, \n\n per verificar el teu correu, segueix l'enllaç següent.\n\n __url__\n\n Gràcies.","error-board-doesNotExist":"Aquest tauler no existeix","error-board-notAdmin":"Necessites ser administrador d'aquest tauler per dur a lloc aquest acció","error-board-notAMember":"Necessites ser membre d'aquest tauler per dur a terme aquesta acció","error-json-malformed":"El text no és JSON vàlid","error-json-schema":"La dades JSON no contenen la informació en el format correcte","error-list-doesNotExist":"La llista no existeix","error-user-doesNotExist":"L'usuari no existeix","error-user-notAllowSelf":"Aquesta acció no està permesa","error-user-notCreated":"L'usuari no s'ha creat","error-username-taken":"Aquest usuari ja existeix","export-board":"Exporta tauler","filter":"Filtre","filter-cards":"Fitxes de filtre","filter-clear":"Elimina filtre","filter-no-label":"Sense etiqueta","filter-no-member":"Sense membres","filter-on":"Filtra per","filter-on-desc":"Estau filtrant fitxes en aquest tauler. Feu clic aquí per editar el filtre.","filter-to-selection":"Filtra selecció","fullname":"Nom complet","header-logo-title":"Torna a la teva pàgina de taulers","hide-system-messages":"Oculta missatges del sistema","home":"Inici","import":"importa","import-board":"Importa des de Trello","import-board-title":"Importa tauler des de Trello","import-board-trello-instruction":"En el teu tauler Trello, ves a 'Menú', 'Més'.' Imprimir i Exportar', 'Exportar JSON', i copia el text resultant.","import-json-placeholder":"Aferra codi JSON vàlid aquí","import-map-members":"Mapeja el membres","import-members-map":"El tauler importat conté membres. Assigna els membres que vulguis importar a usuaris Wekan","import-show-user-mapping":"Revisa l'assignació de membres","import-user-select":"Selecciona l'usuari Wekan que vulguis associar a aquest membre","importMapMembersAddPopup-title":"Selecciona un membre de Wekan","info":"Informacions","initials":"Inicials","invalid-date":"Data invàlida","joined":"s'ha unit","just-invited":"Has estat convidat a aquest tauler","keyboard-shortcuts":"Dreceres de teclat","label-create":"Crea una etiqueta nova","label-default":"%s etiqueta (per defecte)","label-delete-pop":"No es pot desfer. Això eliminarà aquesta etiqueta de totes les fitxes i destruirà la seva història.","labels":"Etiquetes","language":"Idioma","last-admin-desc":"No podeu canviar rols perquè ha d'haver-hi almenys un administrador.","leave-board":"Abandona tauler","link-card":"Enllaç a aquesta fitxa","list-archive-cards":"Arxiva totes les fitxes d'aquesta llista","list-archive-cards-pop":"Això eliminarà totes les fitxes d'aquesta llista del tauler. Per veure les fitxes arxivades i recuperar-les en el tauler, feu clic a \" Menú \"/ \" Articles Arxivat \".","list-move-cards":"Mou totes les fitxes d'aquesta llista","list-select-cards":"Selecciona totes les fitxes d'aquesta llista","listActionPopup-title":"Accions de la llista","listImportCardPopup-title":"importa una fitxa de Trello","lists":"Llistes","log-out":"Finalitza la  sessió","log-in":"Ingresa","loginPopup-title":"Inicia sessió","memberMenuPopup-title":"Configura membres","members":"Membres","menu":"Menú","move-selection":"Move selection","moveCardPopup-title":"Moure fitxa","moveCardToBottom-title":"Mou a la part inferior","moveCardToTop-title":"Mou a la part superior","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selecció","multi-selection-on":"Multi-Selecció està activada","muted":"En silenci","muted-info":"No seràs notificat dels canvis en aquest tauler","my-boards":"Els meus taulers","name":"Nom","no-archived-cards":"No hi ha fitxes arxivades.","no-archived-lists":"No hi ha llistes arxivades.","no-results":"Sense resultats","normal":"Normal","normal-desc":"Podeu veure i editar fitxes. No podeu canviar la configuració.","not-accepted-yet":"La invitació no ha esta acceptada encara","notify-participate":"Rebre actualitzacions per a cada fitxa de la qual n'ets creador o membre","notify-watch":"Rebre actualitzacions per qualsevol tauler, llista o fitxa en observació","optional":"opcional","or":"o","page-maybe-private":"Aquesta pàgina és privada. Per veure-la <a href='%s'> entra </a>.","page-not-found":"Pàgina no trobada.","password":"Contrasenya","paste-or-dragdrop":"aferra, o estira i amolla la imatge (només imatge)","participating":"Participant","preview":"Vista prèvia","previewAttachedImagePopup-title":"Vista prèvia","previewClipboardImagePopup-title":"Vista prèvia","private":"Privat","private-desc":"Aquest tauler és privat. Només les persones afegides al tauler poden veure´l i editar-lo.","profile":"Perfil","public":"Públic","public-desc":"Aquest tauler és públic. És visible per a qualsevol persona amb l'enllaç i es mostrarà en els motors de cerca com Google. Només persones afegides al tauler poden editar-lo.","quick-access-description":"Inicia un tauler per afegir un accés directe en aquest barra","remove-cover":"Elimina coberta","remove-from-board":"Elimina del tauler","remove-label":"Eliminia etiqueta","remove-list":"Elimina la llista","remove-member":"Elimina membre","remove-member-from-card":"Elimina de la fitxa","remove-member-pop":"Eliminar  __name__ (__username__) de __boardTitle__ ? El membre serà eliminat de totes les fitxes d'aquest tauler. Ells rebran una notificació.","removeMemberPopup-title":"Vols suprimir el membre?","rename":"Canvia el nom","rename-board":"Canvia el nom del tauler","restore":"Restaura","save":"Desa","search":"Cerca","select-color":"Selecciona un color","shortcut-assign-self":"Assigna't la ftixa actual","shortcut-autocomplete-emoji":"Autocompleta emoji","shortcut-autocomplete-members":"Autocompleta membres","shortcut-clear-filters":"Elimina tots els filters","shortcut-close-dialog":"Tanca el diàleg","shortcut-filter-my-cards":"Filtra les meves fitxes","shortcut-show-shortcuts":"Mostra aquesta lista d'accessos directes","shortcut-toggle-filterbar":"Canvia la barra lateral del tauler","shortcut-toggle-sidebar":"Canvia Sidebar del Tauler","show-cards-minimum-count":"Mostra contador de fitxes si la llista en conté més de","signupPopup-title":"Crea un compte","star-board-title":"Fes clic per destacar aquest tauler. Es mostrarà a la part superior de la llista de taulers.","starred-boards":"Taulers destacats","starred-boards-description":"Els taulers destacats es mostraran a la part superior de la llista de taulers.","subscribe":"Subscriure","team":"Equip","this-board":"aquest tauler","this-card":"aquesta fitxa","time":"Hora","title":"Títol","tracking":"En seguiment","tracking-info":"Seràs notificat per cada canvi a aquelles fitxes de les que n'eres creador o membre","unassign-member":"Desassignar membre","unsaved-description":"Tens una descripció sense desar.","unwatch":"Suprimeix observació","upload":"Puja","upload-avatar":"Actualitza avatar","uploaded-avatar":"Avatar actualitzat","username":"Nom d'Usuari","view-it":"Vist","warn-list-archived":"Avís: aquesta fitxa està en una llista arxivada","watch":"Observa","watching":"En observació","watching-info":"Seràs notificat de cada canvi en aquest tauler","welcome-board":"Tauler de benvinguda","welcome-list1":"Bàsics","welcome-list2":"Avançades","what-to-do":"Què vols fer?"});
TAPi18n._registerServerTranslator("ca", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cs.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/cs.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["cs"] = ["Czech","čeština‎"];
if(_.isUndefined(TAPi18n.translations["cs"])) {
  TAPi18n.translations["cs"] = {};
}

if(_.isUndefined(TAPi18n.translations["cs"][namespace])) {
  TAPi18n.translations["cs"][namespace] = {};
}

_.extend(TAPi18n.translations["cs"][namespace], {"accept":"Přijmout","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Akce","activities":"Aktivity","activity":"Aktivita","activity-added":"%s přidáno k %s","activity-archived":"%s archivováno","activity-attached":"přiloženo %s k %s","activity-created":"%s vytvořeno","activity-excluded":"%s vyjmuto z %s","activity-imported":"importován %s do %s z %s","activity-imported-board":"importován %s z %s","activity-joined":"spojen %s","activity-moved":"%s přesunuto z %s do %s","activity-on":"na %s","activity-removed":"odstraněn %s z %s","activity-sent":"%s posláno na %s","activity-unjoined":"odpojen %s","activity-checklist-added":"added checklist to %s","add":"Přidat","add-attachment":"Přidat přílohu","add-board":"Přidat nové tablo","add-card":"Přidat kartu","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Přidat obal","add-label":"Přidat štítek","add-list":"Přidat seznam","add-members":"Přidat členy","added":"Přidán","addMemberPopup-title":"Členové","admin":"Administrátor","admin-desc":"Může zobrazovat a upravovat karty, mazat členy a měnit nastavení tabla.","all-boards":"Všechna tabla","and-n-other-card":"A __count__ další karta(y)","and-n-other-card_plural":"A __count__ dalších karet","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archiv","archive-all":"Archivovat vše","archive-board":"Archivovat tablo","archive-card":"Archivovat kartu","archive-list":"Archivovat tento seznam","archive-selection":"Archivovat výběr","archiveBoardPopup-title":"Archivovat tablo?","archived-items":"Archivované položky","archives":"Archivy","assign-member":"Přiřadit člena","attached":"přiloženo","attachment":"Příloha","attachment-delete-pop":"Smazání přílohy je trvalé. Nejde vrátit zpět.","attachmentDeletePopup-title":"Smazat přílohu?","attachments":"Přílohy","auto-watch":"Automatically watch boards when create it","avatar-too-big":"Avatar je příliš velký (70Kb max)","back":"Zpět","board-change-color":"Změnit barvu","board-nb-stars":"%s hvězdiček","board-not-found":"Tablo nenalezeno","board-private-info":"Toto tablo bude <strong>soukromé</strong>.","board-public-info":"Toto tablo bude <strong>veřejné</strong>.","boardChangeColorPopup-title":"Změnit pozadí tabla","boardChangeTitlePopup-title":"Přejmenovat tablo","boardChangeVisibilityPopup-title":"Upravit viditelnost","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Menu tabla","boards":"Tabla","bucket-example":"Například \"Než mě odvedou\"","cancel":"Zrušit","card-archived":"Tato karta je archivována.","card-comments-title":"Tato karta má %s komentářů.","card-delete-notice":"Smazání je trvalé. Přijdete o všechny akce asociované s touto kartou.","card-delete-pop":"Všechny akce budou odstraněny z kanálu aktivity a nebude možné kartu znovu otevřít. Toto nelze vrátit zpět.","card-delete-suggest-archive":"Kartu můžete archivovat a tím ji odstranit z tabla a přitom zachovat aktivity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Upravit přílohy","card-edit-labels":"Upravit štítky","card-edit-members":"Upravit členy","card-labels-title":"Změnit štítky karty.","card-members-title":"Přidat nebo odstranit členy tohoto tabla z karty.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Přiložit formulář","cardDeletePopup-title":"Smazat kartu?","cardDetailsActionsPopup-title":"Akce karty","cardLabelsPopup-title":"Štítky","cardMembersPopup-title":"Členové","cardMorePopup-title":"Více","cards":"Karty","change":"Změnit","change-avatar":"Změnit avatar","change-password":"Změnit heslo","change-permissions":"Změnit oprávnění","change-settings":"Change Settings","changeAvatarPopup-title":"Změnit avatar","changeLanguagePopup-title":"Změnit jazyk","changePasswordPopup-title":"Změnit heslo","changePermissionsPopup-title":"Změnit oprávnění","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Kliknutím přidat hvězdičku tomuto tablu.","click-to-unstar":"Kliknutím odebrat hvězdičku tomuto tablu.","clipboard":"Schránka nebo potáhnout a pustit","close":"Zavřít","close-board":"Zavřít tablo","close-board-pop":"Budete moci obnovit tablo kliknutím na tlačítko \"Archivy\" v hlavním menu.","color-black":"černá","color-blue":"modrá","color-green":"zelená","color-lime":"světlezelená","color-orange":"oranžová","color-pink":"růžová","color-purple":"fialová","color-red":"červená","color-sky":"nebeská","color-yellow":"žlutá","comment":"Komentář","comment-placeholder":"Zapsat komentář","computer":"Počítač","create":"Vytvořit","createBoardPopup-title":"Vytvořit tablo","createLabelPopup-title":"Vytvořit štítek","current":"Aktuální","date":"Date","decline":"Zamítnout","default-avatar":"Výchozí avatar","delete":"Smazat","deleteLabelPopup-title":"Smazat štítek?","description":"Popis","disambiguateMultiLabelPopup-title":"Dvojznačný štítek akce","disambiguateMultiMemberPopup-title":"Dvojznačná akce člena","discard":"Zahodit","done":"Hotovo","download":"Stáhnout","edit":"Upravit","edit-avatar":"Změnit avatar","edit-profile":"Upravit profil","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Změnit štítek","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Upravit profil","email":"Email","email-enrollAccount-subject":"Byl vytvořen účet na __siteName__","email-enrollAccount-text":"Ahoj __user__,\n\nMůžeš začít používat službu kliknutím na odkaz níže.\n\n__url__\n\nDěkujeme.","email-fail":"Odeslání emailu selhalo","email-invalid":"Neplatný email","email-invite":"Pozvat pomocí emailu","email-invite-subject":"__inviter__ odeslal pozvánku","email-invite-text":"Ahoj __user__,\n\n__inviter__ tě přizval ke spolupráci na tablu \"__board__\".\n\nNásleduj prosím odkaz níže:\n\n__url__\n\nDěkujeme.","email-resetPassword-subject":"Změň své heslo na __siteName__","email-resetPassword-text":"Ahoj __user__,\n\nPro změnu hesla klikni na odkaz níže.\n\n__url__\n\nDěkujeme.","email-sent":"Email byl odeslán","email-verifyEmail-subject":"Ověř svou emailovou adresu na","email-verifyEmail-text":"Ahoj __user__,\n\nPro ověření emailové adresy klikni na odkaz níže.\n\n__url__\n\nDěkujeme.","error-board-doesNotExist":"Toto tablo neexistuje","error-board-notAdmin":"K provedení změny musíš být administrátor tohoto tabla","error-board-notAMember":"K provedení změny musíš být členem tohoto tabla","error-json-malformed":"Tvůj text není validní JSON","error-json-schema":"Tato JSON data neobsahují správné informace v platném formátu","error-list-doesNotExist":"Tento seznam neexistuje","error-user-doesNotExist":"Tento uživatel neexistuje","error-user-notAllowSelf":"Tato akce pro sebe sama není povolena","error-user-notCreated":"Tento uživatel není vytvořen","error-username-taken":"This username is already taken","export-board":"Exportovat tablo","filter":"Filtr","filter-cards":"Filtrovat karty","filter-clear":"Vyčistit filtr","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filtr je zapnut","filter-on-desc":"Filtrujete karty tohoto tabla. Pro úpravu filtru klikni sem.","filter-to-selection":"Filtrovat výběr","fullname":"Celé jméno","header-logo-title":"Jit zpět na stránku s tably.","hide-system-messages":"Hide system messages","home":"Domů","import":"Import","import-board":"Importovat ze služby Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"Na svém Trello tablu, otevři 'Menu', pak 'More', 'Print and Export', 'Export JSON', a zkopíruj výsledný text","import-json-placeholder":"Sem vlož validní JSON data","import-map-members":"Map members","import-members-map":"Toto importované tablo obsahuje několik členů. Namapuj členy z importu na uživatelské účty Wekan.","import-show-user-mapping":"Zkontrolovat namapování členů","import-user-select":"Vyber uživatele Wekan, kterého chceš použít pro tohoto člena","importMapMembersAddPopup-title":"Select Wekan member","info":"Informace","initials":"Iniciály","invalid-date":"Invalid date","joined":"spojeno","just-invited":"Právě jsi byl pozván(a) do tohoto tabla","keyboard-shortcuts":"Klávesové zkratky","label-create":"Vytvořit nový štítek","label-default":"%s štítek (výchozí)","label-delete-pop":"Nelze vrátit zpět. Toto odebere tento štítek ze všech karet a zničí jeho historii.","labels":"Štítky","language":"Jazyk","last-admin-desc":"Nelze změnit role, protože musí existovat alespoň jeden administrátor.","leave-board":"Opustit tablo","link-card":"Odkázat na tuto kartu","list-archive-cards":"Archivovat všechny karty na tomto seznamu","list-archive-cards-pop":"Toto odstraní z tabla všechny karty z tohoto seznamu. Pro zobrazení archivovaných karet a jejich opětovné obnovení, klikni v \"Menu\" > \"Archivované položky\".","list-move-cards":"Přesunout všechny karty v tomto seznamu","list-select-cards":"Vybrat všechny karty v tomto seznamu","listActionPopup-title":"Vypsat akce","listImportCardPopup-title":"Importovat Trello kartu","lists":"Seznamy","log-out":"Odhlásit","log-in":"Přihlásit","loginPopup-title":"Přihlásit","memberMenuPopup-title":"Nastavení uživatele","members":"Členové","menu":"Menu","move-selection":"Přesunout výběr","moveCardPopup-title":"Přesunout kartu","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Přesunout výběr","multi-selection":"Multi-výběr","multi-selection-on":"Multi-výběr je zapnut","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Moje tabla","name":"Jméno","no-archived-cards":"Žádné archivované karty.","no-archived-lists":"Žádné archivované seznamy.","no-results":"Žádné výsledky","normal":"Normální","normal-desc":"Může zobrazovat a upravovat karty. Nemůže měnit nastavení.","not-accepted-yet":"Pozvánka ještě nebyla přijmuta","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"volitelný","or":"nebo","page-maybe-private":"Tato stránka může být soukromá. Můžete ji zobrazit po <a href='%s'>přihlášení</a>.","page-not-found":"Stránka nenalezena.","password":"Heslo","paste-or-dragdrop":"vložit, nebo přetáhnout a pustit soubor obrázku (pouze obrázek)","participating":"Participating","preview":"Náhled","previewAttachedImagePopup-title":"Náhled","previewClipboardImagePopup-title":"Náhled","private":"Soukromý","private-desc":"Toto tablo je soukromé. Pouze vybraní uživatelé ho mohou zobrazit a upravovat.","profile":"Profil","public":"Veřejný","public-desc":"Toto tablo je veřejné. Je viditelné pro každého, kdo na něj má odkaz a bude zobrazeno ve vyhledávačích jako je Google. Pouze vybraní uživatelé ho mohou upravovat.","quick-access-description":"Pro přidání odkazu do této lišty označ tablo hvězdičkou.","remove-cover":"Odstranit obal","remove-from-board":"Odstranit z tabla","remove-label":"Odstranit štítek","remove-list":"Remove the list","remove-member":"Odebrat uživatele","remove-member-from-card":"Odstranit z karty","remove-member-pop":"Odstranit __name__ (__username__) z __boardTitle__? Uživatel bude odebrán ze všech karet na tomto tablu. Na tuto skutečnost bude upozorněn.","removeMemberPopup-title":"Odstranit člena?","rename":"Přejmenovat","rename-board":"Přejmenovat tablo","restore":"Obnovit","save":"Uložit","search":"Hledat","select-color":"Vybrat barvu","shortcut-assign-self":"Přiřadit sebe k aktuální kartě","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Automatický výběr uživatel","shortcut-clear-filters":"Vyčistit všechny filtry","shortcut-close-dialog":"Zavřít dialog","shortcut-filter-my-cards":"Filtrovat mé karty","shortcut-show-shortcuts":"Otevřít tento seznam odkazů","shortcut-toggle-filterbar":"Přepnout lištu filtrování","shortcut-toggle-sidebar":"Přepnout lištu tabla","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Vytvořit účet","star-board-title":"Kliknutím přidat tablu hvězdičku. Poté bude zobrazeno navrchu seznamu.","starred-boards":"Tabla s hvězdičkou","starred-boards-description":"Tabla s hvězdičkou jsou zobrazena navrchu seznamu.","subscribe":"Odebírat","team":"Tým","this-board":"toto tablo","this-card":"tuto kartu","time":"Time","title":"Název","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Vyřadit člena","unsaved-description":"Popis neni uložen.","unwatch":"Unwatch","upload":"Nahrát","upload-avatar":"Nahrát avatar","uploaded-avatar":"Avatar nahrán","username":"Uživatelské jméno","view-it":"Zobrazit","warn-list-archived":"varování: tato karta je v archivovaném seznamu","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"Co chcete dělat?"});
TAPi18n._registerServerTranslator("cs", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"de.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/de.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["de"] = ["German","Deutsch"];
if(_.isUndefined(TAPi18n.translations["de"])) {
  TAPi18n.translations["de"] = {};
}

if(_.isUndefined(TAPi18n.translations["de"][namespace])) {
  TAPi18n.translations["de"][namespace] = {};
}

_.extend(TAPi18n.translations["de"][namespace], {"accept":"Akzeptieren","act-activity-notify":"[Wekan] Aktivitätsbenachrichtigung","act-addAttachment":"hat __attachment__ an __card__ angehängt","act-addComment":"hat __card__ kommentiert: __comment__","act-createBoard":"hat __board__ erstellt","act-createCard":"hat __card__ zu __list__ hinzugefügt","act-createList":"hat __list__ zu __board__ hinzugefügt","act-addBoardMember":"hat __member__ zu __board__ hinzugefügt","act-archivedBoard":"hat __board__ archiviert","act-archivedCard":"hat __card__ archiviert","act-archivedList":"hat __list__ archiviert","act-importBoard":"hat __board__ importiert","act-importCard":"hat __card__ importiert","act-importList":"hat __list__ importiert","act-joinMember":"hat __member__ zu __card__ hinzugefügt","act-moveCard":"hat __card__ von __oldList__ nach __list__ verschoben","act-removeBoardMember":"hat __member__ von __board__ entfernt","act-restoredCard":"hat __card__ in __board__ wiederhergestellt","act-unjoinMember":"hat __member__ von __card__ entfernt","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Aktionen","activities":"Aktivitäten","activity":"Aktivität","activity-added":"hat %s zu %s hinzugefügt","activity-archived":"hat %s archiviert","activity-attached":"hat %s an %s angehängt","activity-created":"hat %s erstellt","activity-excluded":"hat %s von %s ausgeschlossen","activity-imported":"hat %s in %s von %s importiert","activity-imported-board":"hat %s von %s importiert","activity-joined":"ist %s beigetreten","activity-moved":"hat %s von %s nach %s verschoben","activity-on":"in %s","activity-removed":"hat %s von %s entfernt","activity-sent":"hat %s an %s gesendet","activity-unjoined":"hat %s verlassen","activity-checklist-added":"Checklist zu %s hinzugefügt","add":"Hinzufügen","add-attachment":"Anhang hinzufügen","add-board":"Neues Board erstellen","add-card":"Karte hinzufügen","add-checklist":"Füge eine Checklist hinzu","add-checklist-item":"Füge einen Punkt zu Checklist hinzu","add-cover":"Cover hinzufügen","add-label":"Label hinzufügen","add-list":"Liste hinzufügen","add-members":"Mitglieder hinzufügen","added":"Hinzugefügt","addMemberPopup-title":"Mitglieder","admin":"Admin","admin-desc":"Kann Karten anschauen und bearbeiten, Mitglieder entfernen und Boardeinstellungen ändern.","all-boards":"Alle Boards","and-n-other-card":"und eine andere Karte","and-n-other-card_plural":"und __count__ andere Karten","apply":"Übernehmen","app-is-offline":"Die Anwendung ist derzeit offline. Aktualisieren der Seite führt zu Datenverlust.","archive":"Archiv","archive-all":"Alles archivieren","archive-board":"Board archivieren","archive-card":"Karte archivieren","archive-list":"Diese Liste archivieren","archive-selection":"Auswahl archivieren","archiveBoardPopup-title":"Board archivieren?","archived-items":"Archivierte Einträge","archives":"Archive","assign-member":"Mitglied zuweisen","attached":"angehängt","attachment":"Anhang","attachment-delete-pop":"Das Löschen eines Anhangs kann nicht wieder rückgängig gemacht werden.","attachmentDeletePopup-title":"Anhang löschen?","attachments":"Anhänge","auto-watch":"Neue Boards automatisch beobachten","avatar-too-big":"Das Profilbild ist zu groß (max. 70Kb)","back":"Zurück","board-change-color":"Farbe ändern","board-nb-stars":"%s Sterne","board-not-found":"Board nicht gefunden","board-private-info":"Dieses Board wird <strong>privat</strong> sein.","board-public-info":"Dieses Board wird <strong>öffentlich</strong> sein.","boardChangeColorPopup-title":"Boardfarbe ändern","boardChangeTitlePopup-title":"Board umbenennen","boardChangeVisibilityPopup-title":"Sichtbarkeit ändern","boardChangeWatchPopup-title":"Beobachtung ändern","boardMenuPopup-title":"Boardmenü","boards":"Boards","bucket-example":"z.B. \"Löffelliste\"","cancel":"Abbrechen","card-archived":"Diese Karte wurde archiviert.","card-comments-title":"Diese Karte hat %s Kommentare.","card-delete-notice":"Löschen ist unwiderruflich. Alle Aktionen die dieser Karte zugeordnet sind werden ebenfalls gelöscht.","card-delete-pop":"Alle Aktionen werden vom Aktivitätsfeed entfernt und die Karte kann nicht mehr geöffnet werden. Das Löschen kann nicht widerrufen werden!","card-delete-suggest-archive":"Sie können eine Karte archivieren, um sie von dem Board zu entfernen und die Aktivitäten zu behalten.","card-due":"Ende","card-due-on":"Ende am","card-edit-attachments":"Anhänge ändern","card-edit-labels":"Labels ändern","card-edit-members":"Mitglieder ändern","card-labels-title":"Labels für diese Karte ändern.","card-members-title":"Der Karte Board-Mitglieder hinzufügen oder entfernen.","card-start":"Start","card-start-on":"Start am","cardAttachmentsPopup-title":"Anhängen von","cardDeletePopup-title":"Karte löschen?","cardDetailsActionsPopup-title":"Kartenaktionen","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Mitglieder","cardMorePopup-title":"Mehr","cards":"Karten","change":"Ändern","change-avatar":"Profilbild ändern","change-password":"Passwort ändern","change-permissions":"Berechtigungen ändern","change-settings":"Einstellungen ändern","changeAvatarPopup-title":"Profilbild ändern","changeLanguagePopup-title":"Sprache ändern","changePasswordPopup-title":"Passwort ändern","changePermissionsPopup-title":"Berechtigungen ändern","changeSettingsPopup-title":"Einstellungen ändern","checklists":"Checklists","click-to-star":"Klicken um dem Board einen Stern zu geben.","click-to-unstar":"Klicken um den Stern von dem Board zu entfernen.","clipboard":"Zwischenablage oder Drag & Drop","close":"Schließen","close-board":"Board schließen","close-board-pop":"Sie können das Board wiederherstellen, indem Sie den \"Archiv\"-Button in der Kopfzeile der Startseite anklicken.","color-black":"schwarz","color-blue":"blau","color-green":"grün","color-lime":"hellgrün","color-orange":"orange","color-pink":"pink","color-purple":"lila","color-red":"rot","color-sky":"himmelblau","color-yellow":"gelb","comment":"Kommentar","comment-placeholder":"Kommentar schreiben","computer":"Computer","create":"Erstellen","createBoardPopup-title":"Board erstellen","createLabelPopup-title":"Label erstellen","current":"aktuell","date":"Datum","decline":"Ablehnen","default-avatar":"Standard Profilbild","delete":"Löschen","deleteLabelPopup-title":"Label löschen?","description":"Beschreibung","disambiguateMultiLabelPopup-title":"Labels vereinheitlichen","disambiguateMultiMemberPopup-title":"Mitglieder vereinheitlichen","discard":"Verwerfen","done":"Erledigt","download":"Herunterladen","edit":"Bearbeiten","edit-avatar":"Profilbild ändern","edit-profile":"Profil ändern","editCardStartDatePopup-title":"Startdatum ändern","editCardDueDatePopup-title":"Enddatum ändern","editLabelPopup-title":"Label ändern","editNotificationPopup-title":"Benachrichtigung ändern","editProfilePopup-title":"Profil ändern","email":"E-Mail","email-enrollAccount-subject":"Ihr Benutzerkonto auf __siteName__ wurde erstellt","email-enrollAccount-text":"Hallo __user__,\n\num den Dienst nutzen zu können, klicken Sie bitte auf folgenden Link:\n\n__url__\n\nDanke.","email-fail":"Senden der E-Mail fehlgeschlagen","email-invalid":"Ungültige E-Mail-Adresse","email-invite":"via E-Mail einladen","email-invite-subject":"__inviter__ hat Ihnen eine Einladung geschickt","email-invite-text":"Hallo __user__,\n\n__inviter__ hat Sie zu dem Board \"__board__\" eingeladen.\n\nBitte klicken Sie auf folgenden Link:\n\n__url__\n\nDanke.","email-resetPassword-subject":"Setzten Sie ihr Passwort auf __siteName__ zurück","email-resetPassword-text":"Hallo __user__,\n\num ihr Passwort zurückzusetzen, klicken Sie bitte auf folgenden Link:\n\n__url__\n\nDanke.","email-sent":"E-Mail gesendet","email-verifyEmail-subject":"Bestätigen Sie ihre E-Mail-Adresse auf __siteName__","email-verifyEmail-text":"Hallo __user__,\n\num ihre E-Mail-Adresse zu bestätigen, klicken Sie bitte auf folgenden Link:\n\n__url__\n\nDanke.","error-board-doesNotExist":"Dieses Board existiert nicht","error-board-notAdmin":"Um das zu tun, müssen Sie der Administrator dieses Boards sein","error-board-notAMember":"Um das zu tun, müssen Sie ein Mitglied dieses Boards sein","error-json-malformed":"Ihre Eingabe ist kein gültiges JSON","error-json-schema":"Ihre JSON-Daten enthalten nicht die gewünschten Informationen im richtigen Format","error-list-doesNotExist":"Diese Liste existiert nicht","error-user-doesNotExist":"Dieser Nutzer existiert nicht","error-user-notAllowSelf":"Diese Aktion auf self ist nicht erlaubt","error-user-notCreated":"Dieser Nutzer ist angelegt","error-username-taken":"Dieser Benutzername ist bereits vergeben","export-board":"Board exportieren","filter":"Filter","filter-cards":"Karten filtern","filter-clear":"Filter entfernen","filter-no-label":"Kein Label","filter-no-member":"Kein Mitglied","filter-on":"Filter ist aktiv","filter-on-desc":"Sie filtern die Karten in diesem Board. Klicken um die Filter zu bearbeiten.","filter-to-selection":"Ergebnisse auswählen","fullname":"Vollständiger Name","header-logo-title":"Zurück zur Board Seite.","hide-system-messages":"Systemmeldungen ausblenden","home":"Home","import":"Importieren","import-board":"von Trello importieren","import-board-title":"Board von Trello importieren","import-board-trello-instruction":"Gehen Sie in ihrem Trello-Board auf 'Menü', dann 'Mehr', 'Drucken und Exportieren', 'JSON-Export' und kopieren Sie den dort angezeigten Text","import-json-placeholder":"Fügen Sie die korrekten JSON-Daten hier ein","import-map-members":"Mitglieder zuordnen","import-members-map":"Das importierte Board hat einige Mitglieder. Bitte ordnen Sie die Mitglieder, die importiert werden sollen, Wekan-Nutzern zu","import-show-user-mapping":"Mitgliederzuordnung überprüfen","import-user-select":"Wählen Sie den Wekan-Nutzer aus, der dieses Mitglied sein soll","importMapMembersAddPopup-title":"Wekan-Nutzer auswählen","info":"Informationen","initials":"Initialien","invalid-date":"Ungültiges Datum","joined":"beigetreten","just-invited":"Sie wurden soeben zu diesem Board eingeladen","keyboard-shortcuts":"Tastaturkürzel","label-create":"Neues Label erstellen","label-default":"%s Label (Standard)","label-delete-pop":"Diese Aktion ist unwiderruflich. Das Label wird von allen Karten entfernt und seine Historie wird gelöscht.","labels":"Labels","language":"Sprache","last-admin-desc":"Sie können keine Rollen ändern, weil es mindestens ein Administrator geben muss.","leave-board":"Board verlassen","link-card":"Link zu dieser Karte","list-archive-cards":"Alle Karten in dieser Liste archivieren","list-archive-cards-pop":"Dieses entfernt alle Karten von dieser Liste des Boards. Um archivierte Karten anzuzeigen und wiederherzustellen, klicken Sie auf \"Menü\" > \"Archivierte Einträge\".","list-move-cards":"Alle Karten in dieser Liste verschieben","list-select-cards":"Alle Karten in dieser Liste auswählen","listActionPopup-title":"Listenaktionen","listImportCardPopup-title":"Eine Trello-Karte importieren","lists":"Listen","log-out":"Ausloggen","log-in":"Einloggen","loginPopup-title":"Einloggen","memberMenuPopup-title":"Nutzereinstellungen","members":"Mitglieder","menu":"Menü","move-selection":"Auswahl verschieben","moveCardPopup-title":"Karte verschieben","moveCardToBottom-title":"Zum Ende verschieben","moveCardToTop-title":"Zum Anfang verschieben","moveSelectionPopup-title":"Auswahl verschieben","multi-selection":"Mehrfachauswahl","multi-selection-on":"Mehrfachauswahl ist aktiv","muted":"Stumm","muted-info":"Sie werden über keine Änderung in diesem Board benachrichtigt","my-boards":"Meine Boards","name":"Name","no-archived-cards":"Keine archivierten Karten.","no-archived-lists":"Keine archivierten Listen.","no-results":"Keine Ergebnisse","normal":"Normal","normal-desc":"Kann Karten anschauen und bearbeiten, aber keine Einstellungen ändern.","not-accepted-yet":"Die Einladung wurde noch nicht angenommen","notify-participate":"Benachrichtigungen über alle Karten erhalten, bei denen Sie als Ersteller oder Mitglied teilnehmen","notify-watch":"Benachrichtigungen über alle Boards, Listen oder Karten erhalten, die Sie beobachten","optional":"optional","or":"oder","page-maybe-private":"Diese Seite könnte privat sein. Vielleicht können Sie sie sehen, wenn Sie sich <a href='%s'>einloggen</a>.","page-not-found":"Seite nicht gefunden.","password":"Passwort","paste-or-dragdrop":"Einfügen oder Datei mit Drag & Drop ablegen (nur Bilder)","participating":"Teilnehmen","preview":"Vorschau","previewAttachedImagePopup-title":"Vorschau","previewClipboardImagePopup-title":"Vorschau","private":"Privat","private-desc":"Dieses Board ist privat. Nur Nutzer, die zu dem Board gehören, können es anschauen und bearbeiten.","profile":"Profil","public":"Öffentlich","public-desc":"Dieses Board ist öffentlich. Es ist für jeden, der den Link kennt, sichtbar und taucht in Suchmaschinen wie Google auf. Nur Nutzer, die zum Board hinzugefügt wurden, können es bearbeiten.","quick-access-description":"Markieren Sie ein Board mit einem Stern um eine Verknüpfung in diese Leise hinzuzufügen.","remove-cover":"Cover entfernen","remove-from-board":"Von Board entfernen","remove-label":"Label entfernen","remove-list":"Liste entfernen","remove-member":"Nutzer entfernen","remove-member-from-card":"Von Karte entfernen","remove-member-pop":"__name__ (__username__) von __boardTitle__ entfernen? Das Mitglied wird von allen Karten auf diesem Board entfernt. Er erhält eine Benachrichtigung.","removeMemberPopup-title":"Mitglied entfernen?","rename":"Umbenennen","rename-board":"Board umbenennen","restore":"Wiederherstellen","save":"Speichern","search":"Suchen","select-color":"Farbe auswählen","shortcut-assign-self":"Fügen Sie sich zur aktuellen Karte hinzu","shortcut-autocomplete-emoji":"Emojis vervollständigen","shortcut-autocomplete-members":"Mitglieder vervollständigen","shortcut-clear-filters":"Alle Filter entfernen","shortcut-close-dialog":"Dialog schließen","shortcut-filter-my-cards":"Meine Karten filtern","shortcut-show-shortcuts":"Liste der Tastaturkürzel anzeigen","shortcut-toggle-filterbar":"Filter-Seitenleiste ein-/ausblenden","shortcut-toggle-sidebar":"Seitenleiste ein-/ausblenden","show-cards-minimum-count":"Zeigt die Kartenanzahl an, wenn die Liste mehr enthält als","signupPopup-title":"Benutzerkonto erstellen","star-board-title":"Klicken um das Board mit einem Stern zu kennzeichnen. Es erscheint dann oben in ihrer Boardliste.","starred-boards":"Markierte Boards","starred-boards-description":"Markierte Boards erscheinen oben in ihrer Boardliste.","subscribe":"Abonnieren","team":"Team","this-board":"dieses Board","this-card":"diese Karte","time":"Zeit","title":"Titel","tracking":"Folgen","tracking-info":"Sie werden über alle Änderungen an Karten, die Sie als Ersteller oder Mitglied beteiligt sind, benachrichtigt.","unassign-member":"Mitglied entfernen","unsaved-description":"Sie haben eine nicht gespeicherte Änderung.","unwatch":"Beobachtung entfernen","upload":"Upload","upload-avatar":"Profilbild hochladen","uploaded-avatar":"Profilbild hochgeladen","username":"Benutzername","view-it":"Ansehen","warn-list-archived":"Warnung: Diese Karte befindet sich in einer archivierten Liste","watch":"Beobachten","watching":"Beobatchen","watching-info":"Sie werden über alle Änderungen in diesem Board informiert","welcome-board":"Willkommen-Board","welcome-list1":"Grundlagen","welcome-list2":"Fortgeschritten","what-to-do":"Was willst du tun?"});
TAPi18n._registerServerTranslator("de", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"en.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/en.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
// integrate the fallback language translations 
translations = {};
translations[namespace] = {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Actions","activities":"Activities","activity":"Activity","activity-comment":"commented on %s","activity-added":"added %s to %s","activity-added-card":"added %s to %s event","activity-added-card-on-list":"added %s form to %s","activity-added-card-on-board":"added %s form to %s event","activity-added-list-on-board":"added %s event to %s","activity-add-version-card":"added version %s to %s","activity-add-version-card-on-list":"added version %s to %s form","activity-archived":"removed %s from %s","activity-archived-card":"removed %s from %s event","activity-archived-card-on-board":"removed %s form from %s event","activity-archived-card-on-list":"removed %s form from %s","activity-archived-list-on-board":"removed %s event from %s","activity-archived-version-card":"removed version %s from %s","activity-archived-version-card-on-list":"removed version %s from %s form","activity-restored-version-card":"restored version %s to %s","activity-restored-version-card-on-list":"restored version %s to %s form","activity-attached":"attached %s to %s","activity-copy-board":"copied %s from protocol %s","activity-copy-card-clone":"copied %s from %s event","activity-copy-card-clone-on-list":"copied %s form from %s event","activity-copy-card-original":"copied %s to %s event","activity-copy-card-original-on-board":"copied %s form from %s event to %s event","activity-copy-card-original-on-list":"copied %s form to %s event","activity-copy-list-clone":"copied %s from %s event","activity-copy-list-original":"copied %s to %s event","activity-copy-list-on-board":"copied %s event to %s event","activity-created":"created %s","activity-excluded":"excluded %s from %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"joined %s","activity-moved":"moved %s from %s to %s","activity-on":"on %s","activity-removed":"removed %s from %s","activity-rename-card":"renamed %s","activity-rename-card-on-list":"renamed %s form to %s","activity-rename-list":"renamed %s to %s","activity-rename-list-on-board":"renamed %s event to %s","activity-sent":"restored %s to %s","activity-sent-card":"restored %s to %s event","activity-sent-card-on-board":"restored %s form to %s event","activity-sent-card-on-list":"restored %s form to %s","activity-sent-list-on-board":"restored %s event to %s","activity-update-default-version":"set version %s as a default form version for data entry for %s in %s event","activity-update-default-version-on-list":"set version %s as a default form version for data entry for %s form in %s event","activity-update-description":"changed %s description","activity-update-description-card-on-board":"changed %s form description from %s to %s","activity-update-description-list-on-board":"changed %s event description from %s to %s","activity-update-card-properties":"marked %s as hidden/required/participant","activity-update-card-properties-on-board":"marked %s form as hidden/required/participant in %s event","activity-update-card-properties-on-list":"marked %s form as hidden/required/participant","activity-update-order-card":"changed the position of %s to %s in %s event","activity-update-order-card-on-board":"changed the position of %s form to %s in %s event","activity-update-order-card-on-list":"changed the position of %s form to %s in %s","activity-update-order-list":"changed the position of %s to %s on %s","activity-update-order-list-on-board":"changed the position of %s event to %s on %s","activity-update-repeating":"marked %s as repeating/non-repeating","activity-update-repeating-on-board":"marked %s event as repeating/non-repeating","activity-update-version-card":"updated version of %s","activity-update-version-card-on-list":"updated version of %s form","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Add","add-attachment":"Add an attachment","add-board":"Add a new protocol","add-card":"Add a form","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Add Cover","add-label":"Add the label","add-list":"Add an event","add-version":"Add a version","list-example":"Like “Screening Visit“ for example","add-members":"Add Members","added":"Added","addEventModal-title":"Add an Event","addMemberPopup-title":"Members","admin":"Admin","admin-desc":"Can view and edit forms, remove members, and change settings for the protocol.","all-boards":"Manage Protocol","and-n-other-card":"And __count__ other form","and-n-other-card_plural":"And __count__ other forms","anonymous":"Anonymous","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archive","archive-all":"Archive All","archive-board":"Archive protocol","archive-card":"Archive Form","archive-event":"Archive this event from protocol? You can restore it later from the 'Archived Items' menu.","archive-list":"Archive this event","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive protocol?","archiveEventPopup-title":"Archive Event ?","archived-items":"Archived Items","archives":"Archives","assign-member":"Assign member","attached":"attached","attachment":"Attachment","attachment-delete-pop":"Deleting an attachment is permanent. There is no undo.","attachmentDeletePopup-title":"Delete Attachment?","attachments":"Attachments","auto-watch":"Automatically watch protocols when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"Back","board-change-color":"Change color","board-nb-stars":"%s stars","board-not-found":"Protocol not found","board-private-info":"This protocol will be <strong>private</strong>.","board-public-info":"This protocol will be <strong>public</strong>.","boardChangeColorPopup-title":"Change Protocol Background","boardChangeDescriptionPopup-title":"Update Protocol","boardChangeVisibilityPopup-title":"Change Visibility","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Protocol Menu","boards":"Protocols","bucket-example":"Like “Juno Study Phase II” for example","cancel":"Cancel","go-to-study":"Go to study","card-archived":"This form is archived.","card-comments-title":"This form has %s comment.","card-delete-notice":"Deleting is permanent. You will lose all actions associated with this form.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the form. There is no undo.","card-delete-suggest-archive":"You can archive a form to remove it from the protocol and preserve the activity.","card-delete-archive":"Remove this form from %s? You can restore it later from the 'Archived Items' menu.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-example":"Like “Vital Signs“ for example","card-labels-title":"Change the labels for the form.","card-members-title":"Add or remove members of the protocol from the form.","card-start":"Start","card-start-on":"Starts on","card-version-radio-title":"Selected indicates default version","cardAttachmentsPopup-title":"Attach From","cardArchivePopup-title":"Archive Form?","cardDeletePopup-title":"Remove Form?","cardDetailsActionsPopup-title":"Form Actions","cardDetailsVersionPopup-title":"Version Options","cardDetailsAvailableVersionPopup-title":"Download","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Members","cardMorePopup-title":"More","cards":"Forms","change":"Change","change-avatar":"Change Avatar","change-password":"Change Password","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"Change Avatar","changeLanguagePopup-title":"Change Language","changePasswordPopup-title":"Change Password","changePermissionsPopup-title":"Change Permissions","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Click to star this protocol.","click-to-unstar":"Click to unstar this protocol.","clipboard":"Clipboard or drag & drop","close":"Close","close-board":"Close Protocol","close-board-pop":"You will be able to restore the protocol by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Comment","comment-placeholder":"Write a comment","common":"Common","computer":"Computer","configuration-parameters":"Properties","copy":"Copy","copyToEventPopup-title":"Copy Form To","copy-to":"Copy To","copy-event":"Copy Event","copy-selection":"Copy selection","copySelectionPopup-title":"Copy selection","build":"Build","create":"Create","createBoardPopup-title":"Add Protocol","create-form-failed":"Create form failed!","createLabelPopup-title":"Create Label","createListLabelPopup-title":"Create Label","colon":"%s: %s","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"Delete","deleteLabelPopup-title":"Delete Label?","deleteListLabelPopup-tile":"Delete Label?","description":"Description","design":"Design","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"Download","download-form-tmpl":"Download Form Template","duplicate-form-found":"Form already exist on event definition.","edit":"Edit","editEventModal-title":"Edit Event","edit-avatar":"Change Avatar","edit-event":"Edit Event","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editEventLabelPopup-title":"Edit Labels","editEventMemberPopup-title":"Edit Members","editLabelPopup-title":"Change Label","editListLabelPopup-title":"Change Label","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edit Profile","email":"Email","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join protocol \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.\n","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.\n","error-board-doesNotExist":"This protocol does not exist","error-board-notAdmin":"You need to be admin of this protocol to do that","error-board-notAMember":"You need to be a member of this protocol to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This event does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export protocol","exist-form":"Existing Form","eventDetailModal-title":"Event Detail","event-definition-form":"Forms","filter":"Filter","filter-cards":"Filter Forms","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"You are filtering forms on this protocol. Click here to edit filter.","filter-to-selection":"Filter to selection","form-template":"Form Template","form-versions":"Form Versions","fullname":"Full Name","header-logo-title":"Go back to your protocols page.","hide-system-messages":"Hide system messages","home":"Home","hidden":"Hidden","import":"Import","import-board":"import from Trello","import-board-title":"Import protocol from Trello","import-board-trello-instruction":"In your Trello protocol, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text.","import-failed":"Importing data failed!","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported protocol has some members. Please map the members you want to import to Wekan users","import-success":"Data successfully imported!","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Infos","initials":"Initials","invalid-date":"Invalid date","joined":"joined","just-invited":"You are just invited to this protocol","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Create a new label","label-default":"%s label (default)","label-delete-pop":"There is no undo. This will remove this label from all forms and destroy its history.","label":"Label","labels":"Labels","language":"Language","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Leave Protocol","link-card":"Link to this form","list-archived":"This event is archived.","listMembersPopup-title":"Members","listLabelsPopup-title":"Labels","list-archive-cards":"Archive all forms in this event","list-archive-cards-pop":"This will remove all the forms in this event from the protocol. To view archived forms and bring them back to the protocol, click “Menu” > “Archived Items”.","list-move-cards":"Move all forms in this event","list-select-cards":"Select all forms in this event","listActionPopup-title":"Event Actions","listImportCardPopup-title":"Import a Trello form","lists":"Events","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Member Settings","members":"Members","menu":"Menu","move":"Move","move-event":"Move Event","move-selection":"Move selection","moveCardPopup-title":"Move Form","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveEventPopup-title":"Move Event","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this protocol","my-boards":"My Protocols","name":"Name","newLabel":"Add New Label","newMember":"Add New Member","no":"No","no-archived-cards":"No archived forms or form versions.","no-archived-lists":"No archived events or forms.","no-results":"No results","normal":"Normal","normal-desc":"Can view and edit forms. Can't change settings.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any forms you participate as creator or member","notify-watch":"Receive updates to any protocols, events, or forms you’re watching","offline":"Offline","optional":"optional","or":"or","organization":"Organization","page-maybe-private":"This page may be private. You may be able to view it by <a href='%s'>logging in</a>.","page-not-found":"Page not found.","password":"Password","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","participant":"Participant","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"Private","private-desc":"This protocol is private. Only people added to the protocol can view and edit it.","profile":"Profile","public":"Public","public-desc":"This protocol is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the protocol can edit.","push":"Push","quick-access-description":"Star a protocol to add a shortcut in this bar.","remove":"Remove","remove-event":"All actions will be removed from the activity feed and you won't be able to re-open the event. There is no undo.","removeEventLabelPopup-title":"Remove Event Label","removeEventPopup-title":"Remove Event ?","removeEventLabel-confirm":"Remove this label ?","removeEventMemberPopup-title":"Remove Event Member","removeEventMember-confirm":"Remove this member ?","remove-cover":"Remove Cover","remove-from-board":"Remove from Protocol","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"Remove Member","remove-member-from-card":"Remove from Form","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all forms on this protocol. They will receive a notification.","removeMemberPopup-title":"Remove Member?","rename":"Rename","rename-board":"Rename Protocol","repeating":"Repeating","required":"Required","restore":"Restore","save":"Save","search":"Search","select-color":"Select a color","scheduled":"Scheduled","shortcut-assign-self":"Assign yourself to current form","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my forms","shortcut-show-shortcuts":"Bring up this shortcuts event","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Protocol Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Create an Account","star-board-title":"Click to star this protocol. It will show up at top of your protocols event.","starred-boards":"Starred Protocols","starred-boards-description":"Starred protocols show up at the top of your protocols event.","subscribe":"Subscribe","team":"Team","this-board":"this protocol","this-card":"this form","this-list":"this event","time":"Time","title":"Title","tracking":"Tracking","tracking-info":"You will be notified of any changes to those forms you are involved as creator or member.","type":"Type","unscheduled":"Unscheduled","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","updateTo":"Update Label","updateMember":"Update Member","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","upload-form-success":"Upload __name__ success!","upload-form-failed":"Upload __name__ failed!","username":"Username","view-it":"View it","version":"Versions","versionz":"version","versionDeletePopup-title":"Archive Form Version","version-delete-pop":"Remove this version from %s? You can restore it later from the 'Archived Items' menu.","warn-list-archived":"warning: this form is in an archived event","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this protocol","welcome-board":"Welcome Protocol","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"What do you want to do?","yes":"Yes","space":" ","z":":"};
TAPi18n._loadLangFileObject("en", translations);
TAPi18n._registerServerTranslator("en", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"es-ES.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/es-ES.i18n.json                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["es-ES"] = ["es-ES","es-ES"];
if(_.isUndefined(TAPi18n.translations["es-ES"])) {
  TAPi18n.translations["es-ES"] = {};
}

if(_.isUndefined(TAPi18n.translations["es-ES"][namespace])) {
  TAPi18n.translations["es-ES"][namespace] = {};
}

_.extend(TAPi18n.translations["es-ES"][namespace], {"accept":"Aceptar","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Acciones","activities":"Actividad","activity":"Actividad","activity-added":"ha añadido %s a %s","activity-archived":"ha archivado %s","activity-attached":"ha adjuntado %s a %s","activity-created":"ha creado %s","activity-excluded":"ha excluido %s de %s","activity-imported":"importado %s en %s desde %s","activity-imported-board":"importado %s desde %s","activity-joined":"se ha unido %s","activity-moved":"ha movido %s de %s a %s","activity-on":"en %s","activity-removed":"ha eliminado %s de %s","activity-sent":"ha enviado %s a %s","activity-unjoined":"ha abandonado %s","add":"Añadir","add-attachment":"Añadir archivo adjunto","add-board":"Añadir nuevo tablero","add-card":"Añadir tarjeta","add-cover":"Añadir cubierta","add-label":"Añadir etiqueta","add-list":"Añadir lista","add-members":"Añadir Miembros","added":"Añadido","addMemberPopup-title":"Miembros","admin":"Administrador","admin-desc":"Puedes ver y editar tarjetas, eliminar miembros y cambiar los ajustes del tablero.","all-boards":"Todos los tableros","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Guardar","archive-all":"Guardar Todo","archive-board":"Archivar tablero","archive-card":"Archivar tarjeta","archive-list":"Archivar esta lista","archive-selection":"Archivar selección","archiveBoardPopup-title":"¿Archivar tablero?","archived-items":"Objetos archivados","archives":"Archivadas","assign-member":"Assignar miembro","attached":"adjuntado","attachment":"Adjunto","attachment-delete-pop":"El borrado de un archivo adjunto es permanente. No se puede deshacer.","attachmentDeletePopup-title":"¿Borrar adjunto?","attachments":"Adjuntos","auto-watch":"Automatically watch boards when create it","avatar-too-big":"El avatar es demasiado grande (70Kb max)","back":"Atrás","board-change-color":"Cambiar color","board-nb-stars":"%s estrellas","board-not-found":"tablero no encontrado","board-private-info":"Este tablero será <strong>privado</strong>.","board-public-info":"Este tablero será <strong>público</strong>.","boardChangeColorPopup-title":"Cambiar fondo","boardChangeTitlePopup-title":"Renombrar tablero","boardChangeVisibilityPopup-title":"Cambiar visibilidad","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Menú del tablero","boards":"Tableros","bucket-example":"Al igual que “Bucket List”, por ejemplo","cancel":"Cancelar","card-archived":"Esta tarjeta está archivada.","card-comments-title":"Esta tarjeta tiene %s comentarios.","card-delete-notice":"El borrado es permanente. Perderás todas las acciones asociadas a esta tarjeta.","card-delete-pop":"Todas las acciones se eliminarán de la alimentación de la actividad y no podrán volver a abrir la tarjeta. No se puede deshacer.","card-delete-suggest-archive":"Puedes archivar una tarjeta para quitarla del tablero y conservar la actividad.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Editar archivos adjuntos","card-edit-labels":"Editar etiquetas","card-edit-members":"Editar miembros","card-labels-title":"Cambia las etiquetas de la tarjeta","card-members-title":"Añadir o eliminar miembros del tablero desde la tarjeta.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Adjuntar desde","cardDeletePopup-title":"¿Borrar tarjeta?","cardDetailsActionsPopup-title":"Acciones de tarjeta","cardLabelsPopup-title":"Etiquetas","cardMembersPopup-title":"Miembros","cardMorePopup-title":"Más","cards":"Tarjetas","change":"Cambiar","change-avatar":"Cambiar Avatar","change-password":"Cambiar la contraseña","change-permissions":"Cambiar permisos","change-settings":"Change Settings","changeAvatarPopup-title":"Cambiar Avatar","changeLanguagePopup-title":"Cambiar idioma","changePasswordPopup-title":"Cambiar la contraseña","changePermissionsPopup-title":"Cambiar permisos","changeSettingsPopup-title":"Change Settings","click-to-star":"Haz clic para destacar este tablero.","click-to-unstar":"Haz clic para dejar de destacar este tablero.","clipboard":"Portapapeles o drag & drop","close":"Cerrar","close-board":"Cerrar tablero","close-board-pop":"Podrás restaurar el tablero seleccionando el botón “Archivados” desde la cabecera de la página de inicio.","color-black":"negro","color-blue":"azul","color-green":"verde","color-lime":"lima","color-orange":"naranja","color-pink":"rosa","color-purple":"violeta","color-red":"rojo","color-sky":"cielo","color-yellow":"amarillo","comment":"Comentario","comment-placeholder":"Escribir un comentario","computer":"Ordenador","create":"Crear","createBoardPopup-title":"Crear tablero","createLabelPopup-title":"Crear etiqueta","current":"actual","date":"Date","decline":"Denegar","default-avatar":"Avatar por defecto","delete":"Borrar","deleteLabelPopup-title":"¿Borrar etiqueta?","description":"Descripción","disambiguateMultiLabelPopup-title":"Deshacer ambigüedad en las etiquetas","disambiguateMultiMemberPopup-title":"Deshacer ambigüedad en los miembros","discard":"Descartar","done":"Hecho","download":"Descargar","edit":"Editar","edit-avatar":"Cambiar Avatar","edit-profile":"Edita tu Perfil","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Cambiar etiqueta","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Editar Perfil","email":"Correo electrónico","email-enrollAccount-subject":"Se ha creado un cuenta para ti en __siteName__","email-enrollAccount-text":"Hola __user__,\n\nPara comenzar a utilizar el servicio, haz clic en el siguiente enlace.\n\n__url__\n\nGracias.","email-fail":"Fallo el envío del correo","email-invalid":"Correo no válido","email-invite":"Invitar mediante correo","email-invite-subject":"__inviter__ te ha enviado una invitación","email-invite-text":"Estimado __user__,\n\n__inviter__ te ha invitado a unirte al tablero \"__board__\" para colaborar.\n\nPor favor sigue el siguiente enlace:\n\n__url__\n\nGracias.","email-resetPassword-subject":"Restablecer tu contraseña en __siteName__","email-resetPassword-text":"Hola __user__,\n\nPara restablecer tu contraseña, haz clic en el siguiente enlace.\n\n__url__\n\nGracias.","email-sent":"Correo enviado","email-verifyEmail-subject":"Verificar tu dirección de correo en __siteName__","email-verifyEmail-text":"Hola __user__,\n\nPara verificar tu dirección de correo, haz clic en el siguiente enlace.\n\n__url__\n\nGracias.","error-board-doesNotExist":"Este tablero no existe","error-board-notAdmin":"Necesitas permiso de administrador en este tablero para hacer eso","error-board-notAMember":"Tienes que ser miembro de este tablero para hacer eso","error-json-malformed":"Tu texto no es JSON válido","error-json-schema":"Tus datos JSON no contienen la información adecuada y/o no están en el formato correcto","error-list-doesNotExist":"Esta lista no existe","error-user-doesNotExist":"Este usuario no existe","error-user-notAllowSelf":"Esa acción en si misma no está permitida","error-user-notCreated":"Este usuario no se ha creado","error-username-taken":"This username is already taken","export-board":"Exportar tablero","filter":"Filtrar","filter-cards":"Filtrar Tarjetas","filter-clear":"Eliminar filtro","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filtrar por","filter-on-desc":"Estás filtrando tarjetas en este tablero. Haz clic aquí para editar el filtro.","filter-to-selection":"Filtrar selección","fullname":"Nombre Completo","header-logo-title":"Volver a tu página de tableros","hide-system-messages":"Hide system messages","home":"Inicio","import":"Importar","import-board":"Importar desde Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"En su tablero Trello, vaya a \"Menú\", luego \"Más\", \"Imprimir y exportar\", \"Exportación JSON ', y copia el texto que se muestre","import-json-placeholder":"Pega aquí los datos JSON","import-map-members":"Map members","import-members-map":"El tablero importado tiene algunos miembros. Por favor, asigna los miembros que deseas importar a Wekan","import-show-user-mapping":"Revisar asignación de miembros","import-user-select":"Escoja el usuario Wekan que desea utilizar como miembro","importMapMembersAddPopup-title":"Select Wekan member","info":"Informaciones","initials":"Iniciales","invalid-date":"Invalid date","joined":"se ha unido","just-invited":"Has sido invitado a este tablero","keyboard-shortcuts":"Atajos de teclado","label-create":"Crear una etiqueta nueva","label-default":"%s etiqueta (por defecto)","label-delete-pop":"No se puede deshacer. Esto eliminará esta etiqueta de todas las tarjetas y destruirá su historial.","labels":"Etiquetas","language":"Idioma","last-admin-desc":"No puedes cambiar roles porque debe haber al menos un administrador.","leave-board":"Abandonar Tablero","link-card":"Enlace a esta tarjeta","list-archive-cards":"Archivar todas las tarjetas en esta lista","list-archive-cards-pop":"Esto eliminara todas las tarjetas de esta lista del tablero. Para ver tarjetas archivadas y recuperarlas en el tablero, haz clic en \"Menu\" / \"Objetos Archivados\".","list-move-cards":"Mover todas las tarjetas en esta lista","list-select-cards":"Seleccionar todas las tarjetas en esta lista","listActionPopup-title":"Acciones de la lista","listImportCardPopup-title":"Importar tarjeta de Trello","lists":"Listas","log-out":"Finalizar la sesión","log-in":"Log In","loginPopup-title":"Iniciar sesión","memberMenuPopup-title":"Configurar miembros","members":"Miembros","menu":"Menú","move-selection":"Mover selección","moveCardPopup-title":"Mover Tarjeta","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Mover selección","multi-selection":"Multi-Selección","multi-selection-on":"Multi-selección activada","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Mis Tableros","name":"Nombre","no-archived-cards":"No hay tarjetas archivadas.","no-archived-lists":"No hay listas archivadas.","no-results":"Sin resultados","normal":"Normal","normal-desc":"Puedes ver y editar tarjetas. No puedes cambiar la configuración.","not-accepted-yet":"Invitación no aceptada aún","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"opcional","or":"o","page-maybe-private":"Esta página es privada. Para verla tienes que <a href='%s'>entrar</a>.","page-not-found":"Página no encontrada.","password":"Contraseña","paste-or-dragdrop":"para pegar, o hacer drag & drop de un archivo (solo imágenes)","participating":"Participating","preview":"Vista previa","previewAttachedImagePopup-title":"Vista previa","previewClipboardImagePopup-title":"Vista previa","private":"Privado","private-desc":"Este tablero es privado. Sólo las personas añadidas pueden ver y editar.","profile":"Perfil","public":"Público","public-desc":"Este tablero es público. Es visible para cualquier persona con el enlace y se mostrará en los motores de búsqueda como Google. Sólo personas añadidas al tablero pueden editar.","quick-access-description":"Iniciar un tablero para agregar un acceso directo en este barra","remove-cover":"Eliminar cubierta","remove-from-board":"Eliminar del tablero","remove-label":"Eliminar etiqueta","remove-list":"Remove the list","remove-member":"Eliminar Miembro","remove-member-from-card":"Eliminar de la Tarjeta","remove-member-pop":"Eliminar  __name__ (__username__) de __boardTitle__? El miembro será eliminado de todas las tarjetas de este tablero. Ellos recibirán una notificación.","removeMemberPopup-title":"¿Eliminar miembro?","rename":"Renombrar","rename-board":"Renombrar tablero","restore":"Restaurar","save":"Guardar","search":"Buscar","select-color":"Selecciona un color","shortcut-assign-self":"Asignarme la tarjeta actual","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocompletar miembros","shortcut-clear-filters":"Eliminar todos los filters","shortcut-close-dialog":"Cierra el Dialogo","shortcut-filter-my-cards":"Filtrar mis tarjetas","shortcut-show-shortcuts":"Mostrar atajos de teclado","shortcut-toggle-filterbar":"Mostrar/Ocultar la barra lateral de filtrado","shortcut-toggle-sidebar":"Menú lateral del Tablero","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Crear una cuenta","star-board-title":"Haz clic para destacar este tablero. Se mostrará en la parte superior de tu lista de tableros.","starred-boards":"Tableros Destacados","starred-boards-description":"Los tableros destacados se mostrarán en la parte superior de tu lista de tableros.","subscribe":"Suscribir","team":"Equipo","this-board":"este tablero","this-card":"esta tarjeta","time":"Time","title":"Título","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Desasignar miembro","unsaved-description":"Tienes una descripción sin guardar.","unwatch":"Unwatch","upload":"Subir","upload-avatar":"Subir avatar","uploaded-avatar":"Avatar actualizado","username":"Nombre de usuario","view-it":"Visto","warn-list-archived":"Aviso: esta tarjeta está en una lista archivada","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"¿Qué quieres hacer?"});
TAPi18n._registerServerTranslator("es-ES", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"es.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/es.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["es"] = ["Spanish (Spain)","Español"];
if(_.isUndefined(TAPi18n.translations["es"])) {
  TAPi18n.translations["es"] = {};
}

if(_.isUndefined(TAPi18n.translations["es"][namespace])) {
  TAPi18n.translations["es"][namespace] = {};
}

_.extend(TAPi18n.translations["es"][namespace], {"accept":"Aceptar","act-activity-notify":"[Wekan] Notificación de Actividad","act-addAttachment":"adjuntado __attachment__ a __card__","act-addComment":"comentado en __card__: __comment__","act-createBoard":"creado __board__","act-createCard":"añadido __card__ a __list__","act-createList":"añadido __list__ a __board__","act-addBoardMember":"añadido __member__ a __board__","act-archivedBoard":"__board__ archivado","act-archivedCard":"__card__ archivada","act-archivedList":"__list__ archivada","act-importBoard":"__board__ importado","act-importCard":"__card__ importada","act-importList":"__list__ importada","act-joinMember":"añadido __member__ to __card__","act-moveCard":"movida __card__ desde __oldList__ a __list__","act-removeBoardMember":"borrado __member__ de __board__","act-restoredCard":"restaurada __card__ en __board__","act-unjoinMember":"borrado __member__ de __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Acciones","activities":"Activities","activity":"Actividad","activity-added":"añadido %s a %s","activity-archived":"archivado %s","activity-attached":"adjuntado %s a %s","activity-created":"creado %s","activity-excluded":"excluido %s de %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"se ha unido %s","activity-moved":"movido %s de %s a %s","activity-on":"en %s","activity-removed":"eliminado %s de %s","activity-sent":"enviado %s a %s","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Añadir","add-attachment":"Añadir un adjunto","add-board":"Añadir un nuevo tablero","add-card":"Add a card","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Añadir cubierta","add-label":"Add the label","add-list":"Add a list","add-members":"Añadir Miembros","added":"Añadido","addMemberPopup-title":"Miembros","admin":"Administrador","admin-desc":"Puedes ver y editar fichas, eliminar miembros, y cambiar los ajustes del tablero","all-boards":"Tableros","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Aplicar","app-is-offline":"La aplicación esta actualmente fuera de servicio, refrescar la página causará pérdida de datos","archive":"Guardar","archive-all":"Guardar Todo","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"Archivar esta lista","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"Items archivados","archives":"Archives","assign-member":"Asignar miembros","attached":"adjuntado","attachment":"Adjunto","attachment-delete-pop":"El borrado de un archivo adjunto es permanente. No se puede deshacer.","attachmentDeletePopup-title":"¿Borrar adjunto?","attachments":"Adjuntos","auto-watch":"Vigilar tableros automáticamente cuando se crean","avatar-too-big":"The avatar is too large (70Kb max)","back":"Atrás","board-change-color":"Cambiar color","board-nb-stars":"%s stars","board-not-found":"Tablero no encontrado","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"Este tablero será <strong>público</strong>.","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"Renombrar tablero","boardChangeVisibilityPopup-title":"Cambiar visibilidad","boardChangeWatchPopup-title":"Cambiar Vigilancia","boardMenuPopup-title":"Board Menu","boards":"Tableros","bucket-example":"Like “Bucket List” for example","cancel":"Cancelar","card-archived":"Esta ficha está archivada.","card-comments-title":"Esta ficha tiene %s  comentarios.","card-delete-notice":"El borrado es permanente. Perderás todas las acciones asociadas a esta ficha.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Motivo","card-due-on":"Debido a","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Editar miembros","card-labels-title":"Cambia las etiquetas de la ficha","card-members-title":"Añadir o eliminar miembros del tablero desde la ficha.","card-start":"Empezar","card-start-on":"Empieza","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"¿Borrar ficha?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Etiquetas","cardMembersPopup-title":"Miembros","cardMorePopup-title":"Más","cards":"Cards","change":"Change","change-avatar":"Cambiar Avatar","change-password":"Cambiar la clave","change-permissions":"Cambiar permisos","change-settings":"Cambiar Preferencias","changeAvatarPopup-title":"Cambiar Avatar","changeLanguagePopup-title":"Cambiar idioma","changePasswordPopup-title":"Cambiar la clave","changePermissionsPopup-title":"Cambiar permisos","changeSettingsPopup-title":"Cambiar Preferencias","checklists":"Checklists","click-to-star":"Haz clic para destacar este tablero.","click-to-unstar":"Haz clic para dejar de destacar este tablero.","clipboard":"Clipboard or drag & drop","close":"Cerrar","close-board":"Cerrar el tablero","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Comentario","comment-placeholder":"Escribe un comentario","computer":"Ordenador","create":"Crear","createBoardPopup-title":"Crear tablero","createLabelPopup-title":"Crear etiqueta","current":"actual","date":"Fecha","decline":"Decline","default-avatar":"Avatar por defecto","delete":"Borrar","deleteLabelPopup-title":"Borrar etiqueta","description":"Descripcion","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"Descargar","edit":"Editar","edit-avatar":"Cambiar Avatar","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Cambiar fecha de inicio","editCardDueDatePopup-title":"Cambiar fecha de motivo","editLabelPopup-title":"Cambiar etiqueta","editNotificationPopup-title":"Editar Notificación","editProfilePopup-title":"Edit Profile","email":"Correo electrónico","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"Este nombre de usuario ya está en uso","export-board":"Export board","filter":"Filter","filter-cards":"Fichas de filtro","filter-clear":"Clear filter","filter-no-label":"Sin etiqueta","filter-no-member":"Sin miembro","filter-on":"Filtro activo","filter-on-desc":"Estás filtrando fichas en este tablero. Haz clic aquí para editar el filtro.","filter-to-selection":"Filter to selection","fullname":"Nombre Completo","header-logo-title":"Volver a tu página de tableros","hide-system-messages":"Ocultar los mensajes del sistema","home":"Inicio","import":"Importar","import-board":"importar desde Trello","import-board-title":"Importar tablero desde Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Mapa de miembros","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Seleccionar un miembro de Wekan","info":"Informaciones","initials":"Iniciales","invalid-date":"Fecha no Válida","joined":"se ha unido","just-invited":"You are just invited to this board","keyboard-shortcuts":"Atajos de teclado","label-create":"Crear una etiqueta nueva","label-default":"%s etiqueta (por Defecto)","label-delete-pop":"No se puede deshacer. Esto eliminará esta etiqueta de todas las fichas y destruirá su historia.","labels":"Etiquetas","language":"Idioma","last-admin-desc":"No puedes cambiar roles porque debe haber al menos un administrador.","leave-board":"Dejar el Tablero","link-card":"Enlace a esta ficha","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"Esto eliminara todas las fichas de esta lista del tablero. Para ver fichas archivadas y recuperarlas en el tablero, haz clic en \"Menu\" / \"Artículos Archivados\".","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"Acciones de la lista","listImportCardPopup-title":"Importar una tarjeta de Trello","lists":"Listas","log-out":"Finalizar la sesion","log-in":"Iniciar sesion","loginPopup-title":"Iniciar sesion","memberMenuPopup-title":"Preferencias de Miembro","members":"Miembros","menu":"Menu","move-selection":"Mover selección","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Mover al Final","moveCardToTop-title":"Movel al Principio","moveSelectionPopup-title":"Mover selección","multi-selection":"Multi-Selección","multi-selection-on":"Multi-Selección activada","muted":"Silenciado","muted-info":"No serás notificado de ningún cambio en este tablero","my-boards":"Mis tableros","name":"Nombre","no-archived-cards":"No hay tarjetas archivadas.","no-archived-lists":"No hay listas archivadas.","no-results":"Sin resultados","normal":"Normal","normal-desc":"Puedes ver y editar fichas. No puedes cambiar la configuración.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Recibir actualizaciones de cualquier tarjeta en la que participas como creador o miembro","notify-watch":"Recibir actuaizaciones de cualquier tablero, lista o tarjeta que estés vigilando","optional":"opcional","or":"o","page-maybe-private":"Esta página puede ser privada. Puedes verla por <a href='%s'>logging in</a>.","page-not-found":"Página no encontrada.","password":"Clave","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participando","preview":"Previsualizar","previewAttachedImagePopup-title":"Previsualizar","previewClipboardImagePopup-title":"Previsualizar","private":"Privado","private-desc":"Este tablero es privado. Sólo las personas añadidas al tablero pueden verlo y editarlo.","profile":"Perfil","public":"Público","public-desc":"Este tablero es público. Es visible para cualquier persona con el enlace y se mostrará en los motores de búsqueda como Google. Sólo personas añadidas al tablero pueden editarlo.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Eliminar cubierta","remove-from-board":"Borrar del Tablero","remove-label":"Borrar la etiqueta","remove-list":"Remove the list","remove-member":"Eliminar Miembro","remove-member-from-card":"Eliminar de la Ficha","remove-member-pop":"Eliminar __nombre__ (__usuario__) de __Título del tablero__? El miembro será eliminado de todas las tarjetas de este tablero. Ellos recibirán una notificación.","removeMemberPopup-title":"¿Eliminar miembro?","rename":"Renombrar","rename-board":"Renombrar tablero","restore":"Restaurar","save":"Guardar","search":"Buscar","select-color":"Selecciona un color","shortcut-assign-self":"Asignarte a ti mismo a la tarjeta actual","shortcut-autocomplete-emoji":"Autocompletar emoji","shortcut-autocomplete-members":"Autocompletar miembros","shortcut-clear-filters":"Limpiar todos los filtros","shortcut-close-dialog":"Cerrar Diálogo","shortcut-filter-my-cards":"Filtrar mis tarjetas","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Mostrar recuento de tarjetas si la lista contiene más de","signupPopup-title":"Crear una Cuenta","star-board-title":"Haz clic para destacar este tablero. Se mostrará en la parte superior de tu lista de tableros.","starred-boards":"Tableros Destacados","starred-boards-description":"Los tableros destacados se mostrarán en la parte superior de tu lista de tableros.","subscribe":"Suscribirse","team":"Equipo","this-board":"este tablero","this-card":"esta ficha","time":"Hora","title":"Título","tracking":"Seguimiento","tracking-info":"Serás notificado de cualquier cambio en las tarjetas que estás envuelto como creador o miembro.","unassign-member":"Desasignar miembro","unsaved-description":"Tienes unas descripción no guardada.","unwatch":"Dejar de vigilar","upload":"Cargar","upload-avatar":"Cargar un avatar","uploaded-avatar":"Avatar cargado","username":"Nombre de Usuario","view-it":"Verlo","warn-list-archived":"warning: this card is in an archived list","watch":"Vigilar","watching":"Vigilando","watching-info":"Serás notificado de cualquier cambio en este tablero","welcome-board":"Tablero de Bienvenida","welcome-list1":"Basicos","welcome-list2":"Avanzados","what-to-do":"What do you want to do?"});
TAPi18n._registerServerTranslator("es", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fa.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/fa.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["fa"] = ["Persian","فارسی"];
if(_.isUndefined(TAPi18n.translations["fa"])) {
  TAPi18n.translations["fa"] = {};
}

if(_.isUndefined(TAPi18n.translations["fa"][namespace])) {
  TAPi18n.translations["fa"][namespace] = {};
}

_.extend(TAPi18n.translations["fa"][namespace], {"accept":"تایید","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"اعمال","activities":"فعالیت ها","activity":"فعالیت","activity-added":"%s به %s اضافه شد","activity-archived":"%s بایگانی شد","activity-attached":"%s به %s پیوست شد","activity-created":"%s ایجاد شد","activity-excluded":"%s  از %s مستثنی گردید","activity-imported":"%s از %s وارد %s شد","activity-imported-board":"%s از %s وارد شد","activity-joined":"اتصال به %s","activity-moved":"%s از %s به %s منتقل شد","activity-on":"%s","activity-removed":"%s از %s حذف شد","activity-sent":"ارسال %s به %s","activity-unjoined":"جداسازی %s","activity-checklist-added":"added checklist to %s","add":"افزودن","add-attachment":"افزودن ضمیمه","add-board":"افزودن برد جدید","add-card":"افزودن کارت","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"افزودن کاور","add-label":"افزودن برچسب","add-list":"افزودن لیست","add-members":"افزودن اعضا","added":"اضافه گردید","addMemberPopup-title":"اعضا","admin":"مدیر","admin-desc":"امکان دیدن و ویرایش کارتها،پاک کردن کاربران و تغییر تنظیمات برای تخته","all-boards":"تمام بردها","and-n-other-card":"و __count__ کارت دیگر","and-n-other-card_plural":"و __count__ کارت دیگر","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"آرشیو","archive-all":"تمامی آرشیوها","archive-board":"بایگانی برد","archive-card":"بایگانی کارت","archive-list":"بایگانی این لیست","archive-selection":"بایگانی موارد انتخاب شده ها","archiveBoardPopup-title":"آیا می خواهید بایگانی شود؟","archived-items":"آیتم های بایگانی شده","archives":"آرشیوها","assign-member":"تعیین عضو","attached":"وابسته","attachment":"ضمائم","attachment-delete-pop":"حذف پیوست دایمی خواهد بود، بدون بازگشت","attachmentDeletePopup-title":"آیا می خواهید ضمیمه را حذف کنید؟","attachments":"ضمائم","auto-watch":"Automatically watch boards when create it","avatar-too-big":"حجم تصویر انتخاب شده بیشتر از حد مجاز است .(حد مجاز 70Kb)","back":"بازگشت","board-change-color":"تغییر رنگ","board-nb-stars":"%s ستاره","board-not-found":"برد مورد نظر پیدا نشد","board-private-info":"این برد <strong>خصوصی</strong> خواهد بود.","board-public-info":"این برد <strong>عمومی</strong> خواهد بود.","boardChangeColorPopup-title":"تغییر پس زمینه برد","boardChangeTitlePopup-title":"تغییر نام برد","boardChangeVisibilityPopup-title":"تغغیر وضعیت نمایش","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"منوی برد","boards":"بردها","bucket-example":"مانند \"لیست سبدها\" برای مثال","cancel":"انصراف","card-archived":"این کارت بایگانی شده است.","card-comments-title":"این کارت دارای %s نظر می باشد.","card-delete-notice":"پاک کردن بطور کامل. شما تمامی اقدامات مربوطه را از دست خواهید داد.","card-delete-pop":"همه اقدامات ازاین پردازه (خوراک) حذف خواهد شد و امکان بازگشا کردن کارت وجود نخواهد داشت. هیچ امکان بازگشتی!","card-delete-suggest-archive":"شما می توانید یک کارت را بایگانی کرده با  حفظ فعالیت های آن.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"ویرایش ضمائم","card-edit-labels":"ویرایش برچسب","card-edit-members":"ویرایش اعضا","card-labels-title":"تغییر برچسب کارت","card-members-title":"افزودن یا حذف اعضا از کارت.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"ضمیمه از","cardDeletePopup-title":"آیا می خواهید کارت را حذف کنید؟","cardDetailsActionsPopup-title":"اعمال کارت","cardLabelsPopup-title":"برچسب ها","cardMembersPopup-title":"اعضا","cardMorePopup-title":"بیشتر","cards":"کارت ها","change":"تغییر","change-avatar":"تغییر آواتار","change-password":"تغییر کلمه عبور","change-permissions":"تغییر دسترسی ها","change-settings":"Change Settings","changeAvatarPopup-title":"تغییر آواتار","changeLanguagePopup-title":"تغییر زبان","changePasswordPopup-title":"تغییر کلمه عبور","changePermissionsPopup-title":"تغییر دسترسی ها","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"جهت افزودن ستاره کلیک کنید .","click-to-unstar":"جهت کاهش ستاره کلیک کنید.","clipboard":"ذخیره در حافظه ویا بکش-رهاکن","close":"بستن","close-board":"بستن برد","close-board-pop":"شما می توانید با کلیک بر دکمه \"بایگانی\" از قسمت بالای خانه، تخته را بازگذاری نمایید.","color-black":"مشکی","color-blue":"آبی","color-green":"سبز","color-lime":"لیمویی","color-orange":"نارنجی","color-pink":"صورتی","color-purple":"بنفش","color-red":"قرمز","color-sky":"آبی آسمانی","color-yellow":"زرد","comment":"نظر","comment-placeholder":"ثبت یک نظر","computer":"کامپیوتر","create":"ایجاد","createBoardPopup-title":"ایجاد برد","createLabelPopup-title":"ایجاد برچسب","current":"جاری","date":"Date","decline":"رد","default-avatar":"آواتار پیش فرض","delete":"حذف","deleteLabelPopup-title":"آیا می خواهید برچسب را حذف کنید؟","description":"توضیحات","disambiguateMultiLabelPopup-title":"عمل ابهام زدایی از برچسب","disambiguateMultiMemberPopup-title":"عمل ابهام زدایی از کاربر","discard":"انصراف","done":"پایان","download":"دریافت","edit":"ویرایش","edit-avatar":"تغییر آواتار","edit-profile":"ویرایش پروفایل","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"تغغیر برچسب","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"ویرایش پروفایل","email":"ایمیل","email-enrollAccount-subject":"یک حساب کاربری برای شما در __siteName__ ایجاد شد","email-enrollAccount-text":"سلام __user__ \nبرای شروع به استفاده از این سرویس برروی کلیک روی لینک زیر کلیک نمایید،با تشکر \n__url__.","email-fail":"عدم موفقیت در ارسال نامه الکترونیکی","email-invalid":"پست الکترونیکی نادرست","email-invite":"دعوت از طریق نامه الکترونیکی","email-invite-subject":"__inviter__ برای شما دعوت نامه ارسال کرده است","email-invite-text":"__User__ عزیز\n __inviter__ شما را به عضویت تخته  \"__board__\" برای همکاری دعوت کرده است.\nلطفا لینک زیر را دنبال کنید، باتشکر:\n__url__","email-resetPassword-subject":"تنظیم مجدد کلمه عبور در __siteName__","email-resetPassword-text":"سلام __user__\nجهت تنظیم مجدد کلمه عبور لینک زیر را دنبال نمایید، باتشکر:\n__url__","email-sent":"نامه الکترونیکی فرستاده شد","email-verifyEmail-subject":"تایید آدرس الکترونیکی شما در __siteName__","email-verifyEmail-text":"سلام __user__\nبه منظور تایید آدرس الکترونیکی حساب خود، لینک زیر را دنبال نمایید، باتشکر:\n__url__.","error-board-doesNotExist":"تخته مورد نظر وجود ندارد","error-board-notAdmin":"شما جهت انجام آن باید مدیر تخته باشید","error-board-notAMember":"شما انجام آن ،باید عضو این تخته باشید.","error-json-malformed":"متن درغالب صحیح Json نمی باشد.","error-json-schema":"داده های Json شما، شامل اطلاعات صحیح در غالب درستی نمی باشد.","error-list-doesNotExist":"این لیست موجود نیست","error-user-doesNotExist":"این کاربر وجود ندارد","error-user-notAllowSelf":"این اقدامبروی خود، مجاز نمی باشد","error-user-notCreated":"این کاربر ایجاد نشده است","error-username-taken":"This username is already taken","export-board":"انتقال به بیرون تخته","filter":"فیلتر","filter-cards":"صافی کارتها","filter-clear":"حذف فیلتر","filter-no-label":"No label","filter-no-member":"No member","filter-on":"صافی روشن است","filter-on-desc":"شما صافی برای کارتهای تخته را روشن کرده اید. جهت ویرایش کلیک نمایید.","filter-to-selection":"صافی برای موارد انتخابی","fullname":"نام و نام خانوادگی","header-logo-title":"بازگشت به صفحه تخته.","hide-system-messages":"Hide system messages","home":"خانه","import":"وارد کردن","import-board":"وارد کردن از ترلو","import-board-title":"Import board from Trello","import-board-trello-instruction":"در Trello-ی خود  به 'Menu'، 'More'، 'Print'، 'Export to JSON رفته و متن نهایی را دراینجا وارد نمایید.","import-json-placeholder":"اطلاعات Json معتبر خود را اینجا وارد کنید.","import-map-members":"Map members","import-members-map":"تخته خود وارد شده دارای برخی از اعضا می باشد. لطفا کاربرانی که باید وارد نرم افزار بشوند را مشخص کنید.","import-show-user-mapping":"بررسی نقشه کاربران","import-user-select":"کاربری از نرم افزار را که می خواهید بعنوان این عضو جایگزین شود را انتخاب کنید.","importMapMembersAddPopup-title":"Select Wekan member","info":"اطلاعات","initials":"تخصیصات اولیه","invalid-date":"Invalid date","joined":"متصل","just-invited":"هم اکنون، شما به این تخته دعوت شده اید.","keyboard-shortcuts":"میانبر کلیدها","label-create":"ایجاد برچسب جدید","label-default":"%s برچسب(پیش فرض)","label-delete-pop":"بدون برگشت. این حذفبرچسب را از هر کارت پاک خواهد کردو تاریخچه آن را نیز ازبین می برد.","labels":"برچسب ها","language":"زبان","last-admin-desc":"شما نمی توانید نقش را تغییر دهید چراکه باید حداقل یک مدیری وجود داشته باشد.","leave-board":"خروج از برد","link-card":"ارجاع به این کارت","list-archive-cards":"بایگانی تمامی کارتهای این لیست","list-archive-cards-pop":"این همه کارت ها در این لیست از تخته راحذف خواهد کرد. جهت مشاهده کارت های بایگانی و بازگرداندن آنها ، \"Menu\",\"Archived Item\" را کلیک کنید.","list-move-cards":"انتقال تمام کارت ها در این لیست","list-select-cards":"انتخاب تمام کارت ها در این لیست","listActionPopup-title":"لیست اقدامات","listImportCardPopup-title":"وارد کردن کارت Trello","lists":"لیست ها","log-out":"خروج","log-in":"ورود","loginPopup-title":"ورود","memberMenuPopup-title":"تنظیمات اعضا","members":"اعضا","menu":"منو","move-selection":"حرکت مورد انتخاب شده","moveCardPopup-title":"حرکت کارت","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"حرکت مورد انتخاب شده","multi-selection":"چند انتخابی","multi-selection-on":"چند انتخابی روشن است","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"بردهای من","name":"نام","no-archived-cards":"کارتی در بایگانی نیست","no-archived-lists":"لیستی در بایگانی نیست","no-results":"نتیجه ای ندارد","normal":"عادی","normal-desc":"امکان نمایش و تنظیم کارت بدون امکان تغییر تنظیمات","not-accepted-yet":"دعوت هنوز پذیرفته نشده است","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"انتخابی","or":"یا","page-maybe-private":"این صفحه ممکن است خصوصی باشد.شما با<a href='%s'>ورود</a> می توانید آنرا ملاحظه نمایید.","page-not-found":"صفحه پیدا نشد.","password":"کلمه عبور","paste-or-dragdrop":"جهت چسباندن، یا کشیدن-رهاسازی فایل تصویر به آن (تصویر)","participating":"Participating","preview":"نمایش","previewAttachedImagePopup-title":"نمایش","previewClipboardImagePopup-title":"نمایش","private":"خصوصی","private-desc":"این تخته خصوصی است. فقط تنها افراد اضافه شده به آن  می توانند مشاهده و ویرایش کنند.","profile":"پروفایل","public":"عمومی","public-desc":"این تخته عمومی است. برای هر کسی با لینک ویا جستجو درموتورها مانند گوگل قابل مشاهده است . فقط افرادی که به آن اضافه شده اند  امکان ویرایش دارند.","quick-access-description":"جهت افزودن یک تخته به اینجا،آنرا ستاره دار نمایید.","remove-cover":"حذف کاور","remove-from-board":"حذف از برد","remove-label":"حذف برچسب","remove-list":"Remove the list","remove-member":"حذف عضو","remove-member-from-card":"حذف از کارت","remove-member-pop":"آیا می خواهید __Name__ (__username__) را از __boardTitle__ حذف کنید? کاربر از تمام کارت ها در این تخته حذف خواهد شد و به آنها اطلاع رسانی خواهد شد.","removeMemberPopup-title":"آیا می خواهید کاربر را حذف کنید؟","rename":"تغغیر نام","rename-board":"تغییر نام برد","restore":"بازیابی","save":"ذخیره","search":"جستجو","select-color":"انتخاب رنگ","shortcut-assign-self":"اختصاص خود به کارت فعلی","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"تکمیل خودکار کاربرها","shortcut-clear-filters":"حذف تمامی فیلترها","shortcut-close-dialog":"بستن دیالوگ","shortcut-filter-my-cards":"کارت های من","shortcut-show-shortcuts":"بالا آوردن میانبر این لیست","shortcut-toggle-filterbar":"ضامن نوار صافی","shortcut-toggle-sidebar":"ضامن نوار تخته","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"ایجاد یک اکانت","star-board-title":"جهت ستاره دار کردن تخته کلیک نمایی.این در بالای لیست تخته های شما نمایش داده خواهد شد.","starred-boards":"تخته های ستاره دار","starred-boards-description":"تخته های ستاره دار در بالای لیست تخته ها نمایش داده می شود.","subscribe":"عضوشدن","team":"تیم","this-board":"این برد","this-card":"این کارت","time":"Time","title":"عنوان","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"عدم انتصاب کاربر","unsaved-description":"شما توضیحات ذخیره نشده دارید.","unwatch":"Unwatch","upload":"ارسال","upload-avatar":"ارسال یک آواتار","uploaded-avatar":"آواتار ارسال شد","username":"نام کاربری","view-it":"مشاهده","warn-list-archived":"هشدار: این کارت در یک لیست بایگانی شده است","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"چه کاری می خواهید انجام دهید؟"});
TAPi18n._registerServerTranslator("fa", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fi.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/fi.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["fi"] = ["Finnish","Suomi"];
if(_.isUndefined(TAPi18n.translations["fi"])) {
  TAPi18n.translations["fi"] = {};
}

if(_.isUndefined(TAPi18n.translations["fi"][namespace])) {
  TAPi18n.translations["fi"][namespace] = {};
}

_.extend(TAPi18n.translations["fi"][namespace], {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Actions","activities":"Activities","activity":"Activity","activity-added":"added %s to %s","activity-archived":"archived %s","activity-attached":"attached %s to %s","activity-created":"created %s","activity-excluded":"excluded %s from %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"joined %s","activity-moved":"moved %s from %s to %s","activity-on":"on %s","activity-removed":"removed %s from %s","activity-sent":"sent %s to %s","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Add","add-attachment":"Add an attachment","add-board":"Add a new board","add-card":"Add a card","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Add Cover","add-label":"Add the label","add-list":"Add a list","add-members":"Add Members","added":"Added","addMemberPopup-title":"Members","admin":"Admin","admin-desc":"Can view and edit cards, remove members, and change settings for the board.","all-boards":"All boards","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archive","archive-all":"Archive All","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"Archive this list","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"Archived Items","archives":"Archives","assign-member":"Assign member","attached":"attached","attachment":"Attachment","attachment-delete-pop":"Deleting an attachment is permanent. There is no undo.","attachmentDeletePopup-title":"Delete Attachment?","attachments":"Attachments","auto-watch":"Automatically watch boards when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"Back","board-change-color":"Change color","board-nb-stars":"%s stars","board-not-found":"Board not found","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"This board will be <strong>public</strong>.","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"Rename Board","boardChangeVisibilityPopup-title":"Change Visibility","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Board Menu","boards":"Boards","bucket-example":"Like “Bucket List” for example","cancel":"Cancel","card-archived":"This card is archived.","card-comments-title":"This card has %s comment.","card-delete-notice":"Deleting is permanent. You will lose all actions associated with this card.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-labels-title":"Change the labels for the card.","card-members-title":"Add or remove members of the board from the card.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"Delete Card?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Members","cardMorePopup-title":"More","cards":"Cards","change":"Change","change-avatar":"Change Avatar","change-password":"Change Password","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"Change Avatar","changeLanguagePopup-title":"Change Language","changePasswordPopup-title":"Change Password","changePermissionsPopup-title":"Change Permissions","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Click to star this board.","click-to-unstar":"Click to unstar this board.","clipboard":"Clipboard or drag & drop","close":"Close","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Comment","comment-placeholder":"Write a comment","computer":"Computer","create":"Create","createBoardPopup-title":"Create Board","createLabelPopup-title":"Create Label","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"Delete","deleteLabelPopup-title":"Delete Label?","description":"Description","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"Download","edit":"Edit","edit-avatar":"Change Avatar","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Change Label","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edit Profile","email":"Email","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Filter","filter-cards":"Filter Cards","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"You are filtering cards on this board. Click here to edit filter.","filter-to-selection":"Filter to selection","fullname":"Full Name","header-logo-title":"Go back to your boards page.","hide-system-messages":"Hide system messages","home":"Home","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text.","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Infos","initials":"Initials","invalid-date":"Invalid date","joined":"joined","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Create a new label","label-default":"%s label (default)","label-delete-pop":"There is no undo. This will remove this label from all cards and destroy its history.","labels":"Labels","language":"Language","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Leave Board","link-card":"Link to this card","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"List Actions","listImportCardPopup-title":"Import a Trello card","lists":"Lists","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Member Settings","members":"Members","menu":"Menu","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"My Boards","name":"Name","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"No results","normal":"Normal","normal-desc":"Can view and edit cards. Can't change settings.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"optional","or":"or","page-maybe-private":"This page may be private. You may be able to view it by <a href='%s'>logging in</a>.","page-not-found":"Page not found.","password":"Password","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"Private","private-desc":"This board is private. Only people added to the board can view and edit it.","profile":"Profile","public":"Public","public-desc":"This board is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the board can edit.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Remove Cover","remove-from-board":"Remove from Board","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"Remove Member","remove-member-from-card":"Remove from Card","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all cards on this board. They will receive a notification.","removeMemberPopup-title":"Remove Member?","rename":"Rename","rename-board":"Rename Board","restore":"Restore","save":"Save","search":"Search","select-color":"Select a color","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Create an Account","star-board-title":"Click to star this board. It will show up at top of your boards list.","starred-boards":"Starred Boards","starred-boards-description":"Starred boards show up at the top of your boards list.","subscribe":"Subscribe","team":"Team","this-board":"this board","this-card":"this card","time":"Time","title":"Title","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"Username","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"What do you want to do?"});
TAPi18n._registerServerTranslator("fi", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fr.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/fr.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["fr"] = ["French (France)","Français"];
if(_.isUndefined(TAPi18n.translations["fr"])) {
  TAPi18n.translations["fr"] = {};
}

if(_.isUndefined(TAPi18n.translations["fr"][namespace])) {
  TAPi18n.translations["fr"][namespace] = {};
}

_.extend(TAPi18n.translations["fr"][namespace], {"accept":"Accepter","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Actions","activities":"Activités","activity":"Activité","activity-added":"a ajouté %s à %s","activity-archived":"a archivé %s","activity-attached":"a attaché %s à %s","activity-created":"a créé %s","activity-excluded":"a exclu %s de %s","activity-imported":"a importé %s vers %s depuis %s","activity-imported-board":"a importé %s depuis %s","activity-joined":"a rejoint %s","activity-moved":"a déplacé %s depuis %s vers %s","activity-on":"sur %s","activity-removed":"a supprimé %s vers %s","activity-sent":"a envoyé %s vers %s","activity-unjoined":"a quitté %s","activity-checklist-added":"added checklist to %s","add":"Ajouter","add-attachment":"Joindre un fichier","add-board":"Ajouter un nouveau tableau","add-card":"Ajouter une carte","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Ajouter la couverture","add-label":"Ajouter une étiquette","add-list":"Ajouter une liste","add-members":"Assigner des membres","added":"Ajouté","addMemberPopup-title":"Membres","admin":"Admin","admin-desc":"Peut voir et éditer les cartes, supprimer des membres et changer les paramètres du tableau.","all-boards":"Tous les tableaux","and-n-other-card":"Et __count__ autre carte","and-n-other-card_plural":"Et __count__ autres cartes","apply":"Appliquer","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archiver","archive-all":"Tout archiver","archive-board":"Archiver le tableau","archive-card":"Archiver la carte","archive-list":"Archiver cette liste","archive-selection":"Archiver la selection","archiveBoardPopup-title":"Archiver le tableau ?","archived-items":"Éléments archivés","archives":"Archives","assign-member":"Assigner un membre","attached":"joint","attachment":"Pièce jointe","attachment-delete-pop":"La suppression d'une pièce jointe est définitive. Elle ne peut être annulée.","attachmentDeletePopup-title":"Supprimer la pièce jointe ?","attachments":"Pièces jointes","auto-watch":"Automatically watch boards when create it","avatar-too-big":"La taille du fichier de l’avatar est trop importante (70 Ko au maximum)","back":"Retour","board-change-color":"Changer la couleur","board-nb-stars":"%s étoiles","board-not-found":"Tableau non trouvé","board-private-info":"Ce tableau sera <strong>privé</strong>","board-public-info":"Ce tableau sera <strong>public</strong>.","boardChangeColorPopup-title":"Change la fond du tableau","boardChangeTitlePopup-title":"Renommer le tableau","boardChangeVisibilityPopup-title":"Changer la visibilité","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Menu du tableau","boards":"Tableaux","bucket-example":"Comme « todo list » par exemple","cancel":"Annuler","card-archived":"Cette carte est archivée.","card-comments-title":"Cette carte a %s commentaires.","card-delete-notice":"La suppression est permanente. Vous perdrez toutes les actions associées à cette carte.","card-delete-pop":"Toutes les actions vont être supprimées du suivi d'activités et vous ne pourrez plus utiliser cette carte. Cette action est irréversible.","card-delete-suggest-archive":"Vous pouvez archiver une carte pour la supprimer en préservant le suivi des activités.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Editer les pièces jointes","card-edit-labels":"Editer les étiquettes","card-edit-members":"Modifier les membres","card-labels-title":"Modifier les étiquettes de la carte.","card-members-title":"Ajouter ou supprimer des membres à la carte.","card-start":"Début","card-start-on":"Commence le","cardAttachmentsPopup-title":"Joindre depuis","cardDeletePopup-title":"Supprimer la carte ?","cardDetailsActionsPopup-title":"Actions sur la carte","cardLabelsPopup-title":"Étiquettes","cardMembersPopup-title":"Membres","cardMorePopup-title":"Plus","cards":"Cartes","change":"Changer","change-avatar":"Changer l'avatar","change-password":"Changer le mot de passe","change-permissions":"Changer les permissions","change-settings":"Modifier les paramètres","changeAvatarPopup-title":"Changer l'avatar","changeLanguagePopup-title":"Changer la langue","changePasswordPopup-title":"Changer le mot de passe","changePermissionsPopup-title":"Changer les permissions","changeSettingsPopup-title":"Modifier les paramètres","checklists":"Checklists","click-to-star":"Cliquez pour ajouter ce tableau aux favoris.","click-to-unstar":"Cliquez pour retirer ce tableau des favoris.","clipboard":"Presse-papier ou glisser-déposer","close":"Fermer","close-board":"Fermer le tableau","close-board-pop":"Vous pouvez restaurer le tableau en cliquant sur le bouton « Archives » depuis le menu en entête.","color-black":"noir","color-blue":"bleu","color-green":"vert","color-lime":"citron vert","color-orange":"orange","color-pink":"rose","color-purple":"violet","color-red":"rouge","color-sky":"ciel","color-yellow":"jaune","comment":"Commentaire","comment-placeholder":"Rédiger un commentaire","computer":"Ordinateur","create":"Créer","createBoardPopup-title":"Créer un tableau","createLabelPopup-title":"Créer un étiquette","current":"courant","date":"Date","decline":"Refuser","default-avatar":"Avatar par défaut","delete":"Supprimer","deleteLabelPopup-title":"Supprimer l'étiquette ?","description":"Description","disambiguateMultiLabelPopup-title":"Préciser l'action sur l'étiquette","disambiguateMultiMemberPopup-title":"Préciser l'action sur le membre","discard":"Mettre à la corbeille","done":"Fait","download":"Télécharger","edit":"Éditer","edit-avatar":"Changer l'avatar","edit-profile":"Éditer le profil","editCardStartDatePopup-title":"Modifier la date de début","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Changer l'étiquette","editNotificationPopup-title":"Modifier la Notification","editProfilePopup-title":"Éditer le profil","email":"Email","email-enrollAccount-subject":"Un compte a été créé pour vous sur __siteName__","email-enrollAccount-text":"Bonjour __user__,\n\nPour commencer à utiliser ce service, il suffit de cliquer sur le lien ci-dessous.\n\n__url__\n\nMerci.","email-fail":"Échec de l’envoi du courriel.","email-invalid":"Courriel incorrect.","email-invite":"Inviter par email","email-invite-subject":"__inviter__ vous a envoyé une invitation","email-invite-text":"Cher __user__,\n\n__inviter__ vous invite à rejoindre le tableau \"__board__\" pour collaborer.\n\nVeuillez suivre le lien ci-dessous :\n\n__url__\n\nMerci.","email-resetPassword-subject":"Réinitialiser le mot de passe sur __siteName__","email-resetPassword-text":"Bonjour __user__,\n\nPour réinitialiser votre mot de passe, cliquez sur le lien ci-dessous.\n\n__url__\n\nMerci.","email-sent":"Courriel envoyé","email-verifyEmail-subject":"Vérifier votre adresse de courriel sur __siteName__","email-verifyEmail-text":"Bonjour __user__,\n\nPour vérifier votre compte courriel, il suffit de cliquer sur le lien ci-dessous.\n\n__url__\n\nMerci.","error-board-doesNotExist":"Ce tableau n’existe pas","error-board-notAdmin":"Vous devez être admin de ce tableau pour faire cela","error-board-notAMember":"Vous devez être participant à ce tableau pour faire cela","error-json-malformed":"Votre texte JSON n’est pas valide","error-json-schema":"Vos données JSON ne contiennent pas l’information appropriée dans un format correct","error-list-doesNotExist":"Cette liste n’existe pas","error-user-doesNotExist":"Cet utilisateur n’existe pas","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"Cet utilisateur n’a pas encore été créé.","error-username-taken":"Ce nom d'utilisateur est déjà pris","export-board":"Exporter le tableau","filter":"Filtrer","filter-cards":"Filtrer les cartes","filter-clear":"Retirer les filtres","filter-no-label":"Aucun libellé","filter-no-member":"Aucun membre","filter-on":"Le filtre est actif","filter-on-desc":"Vous êtes en train de filtrer les cartes sur ce tableau. Cliquez ici pour changer les filtres.","filter-to-selection":"Filtre vers la sélection","fullname":"Nom complet","header-logo-title":"Retourner à la page des tableaux","hide-system-messages":"Masquer les messages système","home":"Accueil","import":"Importer","import-board":"Importer depuis Trello","import-board-title":"Importer le tableau depuis Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Collez ici les données JSON valides.","import-map-members":"Map members","import-members-map":"Le tableau que vous venez d’importer contient des participants. Veuillez associer les participants que vous souhaitez importer à des utilisateurs de Wekan.","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Sélectionner le membre Wekan","info":"Infos","initials":"Initiales","invalid-date":"Date invalide","joined":"a joint","just-invited":"You are just invited to this board","keyboard-shortcuts":"Raccourcis clavier","label-create":"Créer une nouvelle étiquette","label-default":"%s label (default)","label-delete-pop":"Cette action est irréversible. Elle supprimera cette étiquette de toutes les cartes ainsi que l'historique associé.","labels":"Étiquettes","language":"Langage","last-admin-desc":"Vous ne pouvez pas changer les rôles car il doit y avoir au moins un admin.","leave-board":"Quitter le tableau","link-card":"Lier cette carte","list-archive-cards":"Archiver les cartes de cette liste","list-archive-cards-pop":"Cela archivera toutes les cartes de cette liste. Pour voir les cartes archivées et les ramener vers le tableau, cliquez sur le « Menu » puis sur « Éléments archivés ».","list-move-cards":"Déplacer les cartes de cette liste","list-select-cards":"Sélectionner les cartes de cette liste","listActionPopup-title":"Liste des actions","listImportCardPopup-title":"Importer une carte Trello","lists":"Listes","log-out":"Déconnexion","log-in":"Connexion","loginPopup-title":"Connexion","memberMenuPopup-title":"Préférence de membre","members":"Membres","menu":"Menu","move-selection":"Déplacer la sélection","moveCardPopup-title":"Déplacer la carte","moveCardToBottom-title":"Aller en bas","moveCardToTop-title":"Aller en haut","moveSelectionPopup-title":"Déplacer la sélection","multi-selection":"Sélection multiple","multi-selection-on":"Multi-Selection active","muted":"Muted","muted-info":"Vous ne serez jamais averti des modifications effectuées dans ce tableau","my-boards":"Mes tableaux","name":"Nom","no-archived-cards":"Pas de carte archivée.","no-archived-lists":"Pas de liste archivée.","no-results":"Pas de résultats","normal":"Normal","normal-desc":"Peut voir et éditer les cartes. Ne peut pas changer les paramètres.","not-accepted-yet":"L’invitation n’a pas encore été acceptée","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"optionnel","or":"ou","page-maybe-private":"Cette page est peut-être privée. Vous pourrez peut-être la voir en vous <a href='%s'>connectant</a>.","page-not-found":"Page non trouvée","password":"Mot de passe","paste-or-dragdrop":"pour coller, ou glissez-déposez une image ici (seulement une image)","participating":"Participating","preview":"Prévisualiser","previewAttachedImagePopup-title":"Prévisualiser","previewClipboardImagePopup-title":"Prévisualiser","private":"Privé","private-desc":"Ce tableau est privé. Seul les membres peuvent y accéder.","profile":"Profil","public":"Public","public-desc":"Ce tableau est public. Il est visible par toutes les personnes possédant le lien et visible dans les moteurs de recherche tels que Google. Seuls les membres peuvent l'éditer.","quick-access-description":"Ajouter un tableau aux favoris pour créer un raccourci dans cette barre.","remove-cover":"Enlever la couverture","remove-from-board":"Retirer du tableau","remove-label":"Retirer cette étiquette","remove-list":"Supprimer la liste","remove-member":"Supprimer le membre","remove-member-from-card":"Supprimer de la carte","remove-member-pop":"Supprimer __name__ (__username__) de __boardTitle__ ? Ce membre sera supprimé de toutes les cartes du tableau et recevra une notification.","removeMemberPopup-title":"Supprimer le membre ?","rename":"Renommer","rename-board":"Renommer le tableau","restore":"Restaurer","save":"Sauvegarder","search":"Chercher","select-color":"Choisissez une couleur","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Auto-complétion des membres","shortcut-clear-filters":"Retirer tous les filtres","shortcut-close-dialog":"Fermer le dialogue","shortcut-filter-my-cards":"Filtrer mes cartes","shortcut-show-shortcuts":"Afficher cette liste de raccourcis","shortcut-toggle-filterbar":"Afficher/Cacher la barre latérale des filtres","shortcut-toggle-sidebar":"Afficher/Cacher la barre latérale du tableau","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Créer un compe","star-board-title":"Cliquer pour ajouter ce tableau aux favoris. Il sera affiché en haut de votre liste de tableaux.","starred-boards":"Tableaux favoris","starred-boards-description":"Les tableaux favoris s'affichent en haut de votre liste de tableaux.","subscribe":"Suivre","team":"Équipe","this-board":"ce tableau","this-card":"cette carte","time":"Time","title":"Titre","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Retirer le membre","unsaved-description":"Vous avez une description non sauvegardée","unwatch":"Unwatch","upload":"Télécharger","upload-avatar":"Télécharger un avatar","uploaded-avatar":"Avatar téléchargé","username":"Nom d'utilisateur","view-it":"Le voir","warn-list-archived":"Attention : cette carte est dans une liste archivée","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"Que voulez-vous faire ?"});
TAPi18n._registerServerTranslator("fr", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"he.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/he.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["he"] = ["Hebrew","עברית"];
if(_.isUndefined(TAPi18n.translations["he"])) {
  TAPi18n.translations["he"] = {};
}

if(_.isUndefined(TAPi18n.translations["he"][namespace])) {
  TAPi18n.translations["he"][namespace] = {};
}

_.extend(TAPi18n.translations["he"][namespace], {"accept":"אישור","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":" __attachment__ שוייך ל- __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"הלוח __board__ נוצר","act-createCard":"הכרטיס __card__ התווסף לרשימה __list__","act-createList":"הרשימה __list__ התווספה ללוח __board__","act-addBoardMember":"המשתמש __member__ שויך ללוח __board__","act-archivedBoard":"הלוח  __board__ הועבר לארכיון","act-archivedCard":"הכרטיס __card__ הועבר לארכיון","act-archivedList":"הרשימה __card__ הועברה לארכיון","act-importBoard":"הלוח __board__ יובא","act-importCard":"הכרטיס __card__ יובא","act-importList":"הרשימה  __list__ יובאה","act-joinMember":"המשתמש  __member__ שוייך לכרטיס __card__","act-moveCard":"הכרטיס __card__ הועבר מהרשימה __oldList__ לרשימה __list__","act-removeBoardMember":"המשתמש __member__ הוסר מהלוח __board__","act-restoredCard":"הכרטיס __card__ שוחזר ללוח __board__","act-unjoinMember":"המשתמש __member__ הוסר מהכרטיס __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"פעולות","activities":"פעילויות","activity":"פעילות","activity-added":"%s נוסף ל%s","activity-archived":"%s אורכב","activity-attached":"%s צורף ל%s","activity-created":"%s נוצר","activity-excluded":"%s לא נכלל ב%s","activity-imported":"%s ייובא מ%s אל %s","activity-imported-board":"%s ייובא מ%s","activity-joined":"%s הצטרף","activity-moved":"%s עבר מ%s ל%s","activity-on":"ב %s","activity-removed":"%s הוסר מ%s","activity-sent":"%s נשלח ל%s","activity-unjoined":"בטל צירוף %s","activity-checklist-added":"רשימת משימות התווספה ל- %s","add":"הוסף","add-attachment":"הוסף קובץ","add-board":"הוסף לוח חדש","add-card":"הוסף כרטיס","add-checklist":"הוסף רשימת משימות","add-checklist-item":"הוסף פריט לרשימת משימות","add-cover":"הוסף כיסוי","add-label":"הוסף תווית","add-list":"הוסף רשימה","add-members":"הוסף חבר","added":"התווסף","addMemberPopup-title":"חבר","admin":"אדמין","admin-desc":"יכול לצפות ולערוך כרטיסים, להסיר חברים ולשנות הגדרות ללוח.","all-boards":"כל הלוחות","and-n-other-card":"ו __count__ כרטיס אחר","and-n-other-card_plural":"ו __count__ כרטיסים אחרים","apply":"אשר שינויים","app-is-offline":"המערכת למטה כרגע, ריענון של הדף יגרום לאבדן מידע","archive":"אחסן בארכיון","archive-all":"אחסן הכל בארכיון","archive-board":"אחסן לוח בארכיון","archive-card":"אחסן כרטיס בארכיון","archive-list":"אחסן רשימה זו בארכיון","archive-selection":"אחסן בחירה בארכיון","archiveBoardPopup-title":"לאחסן לוח זה בארכיון?","archived-items":"פריטים מאוחסנים בארכיון","archives":"ארכיונים","assign-member":"הקצה חבר","attached":"מצורף","attachment":"קובץ מצורף","attachment-delete-pop":"מחיקת קובץ מצורף הינה סופית. אין דרך חזרה.","attachmentDeletePopup-title":"למחוק קובץ מצורף?","attachments":"קבצים מצורפים","auto-watch":"עקוב באופן אוטומטי אחרי לוחות אחרי שהם נוצרים","avatar-too-big":"האווטאר גדול מידי (מקס 70Kb)","back":"חזור","board-change-color":"שנה צבע","board-nb-stars":"%s כוכבים","board-not-found":"לוח לא נמצא","board-private-info":"לוח זה יהיה <strong>פרטי</strong>.","board-public-info":"לוח זה יהיה <strong>ציבורי</strong>.","boardChangeColorPopup-title":"שנה רקע ללוח","boardChangeTitlePopup-title":"שנה שם ללוח","boardChangeVisibilityPopup-title":"שנה תצוגה","boardChangeWatchPopup-title":"שנה את הגדרת המעקב","boardMenuPopup-title":"תפריט לוח","boards":"לוחות","bucket-example":"כמו “Bucket List” לדוגמא","cancel":"בטל","card-archived":"כרטיס זה מאוחסן בארכיון","card-comments-title":"לכרטיס זה %s תגובות.","card-delete-notice":"מחיקה היא סופית. תאבדו את כל הפעולות המשויכות לכרטיס זה.","card-delete-pop":"כל הפעולות יוסרו מלוח הפעילות ולא תוכלו לפתוח מחדש את הכרטיס. אין דרך חזרה.","card-delete-suggest-archive":"באפשרותך לאחסן בארכיון כרטיס כדי להסירו מהלוח ולשמר את הפעילות.","card-due":"תאריך יעד","card-due-on":"תאריך יעד","card-edit-attachments":"ערוך קבצים מצורפים","card-edit-labels":"ערוך תוויות","card-edit-members":"ערוך חברים","card-labels-title":"שנה תוויות לכרטיס.","card-members-title":"הוסף או הסר את חברי הלוח מהכרטיס","card-start":"התחל","card-start-on":"מתחיל ב-","cardAttachmentsPopup-title":"צרף מ","cardDeletePopup-title":"למחוק כרטיס?","cardDetailsActionsPopup-title":"פעולות על הכרטיס","cardLabelsPopup-title":"תוויות","cardMembersPopup-title":"חברים","cardMorePopup-title":"עוד","cards":"כרטיסים","change":"שנה","change-avatar":"שנה אווטאר","change-password":"שנה סיסמא","change-permissions":"שנה הרשאות","change-settings":"שנה הגדרות","changeAvatarPopup-title":"שנה אווטאר","changeLanguagePopup-title":"שנה שפה","changePasswordPopup-title":"שנה סיסמא","changePermissionsPopup-title":"שנה הרשאות","changeSettingsPopup-title":"שנה הגדרות","checklists":"רשימות","click-to-star":"לחץ להוספת הלוח למועדפים","click-to-unstar":"לחץ להסרת הלוח מהמועדפים.","clipboard":"Clipboard or drag & drop","close":"סגור","close-board":"סגור לוח","close-board-pop":"תוכלו לשחזר את הלוח בלחיצה על כפתור \"ארכיונים\" מהכותרת העליונה.","color-black":"שחור","color-blue":"כחול","color-green":"ירוק","color-lime":"ליים","color-orange":"כתום","color-pink":"ורוד","color-purple":"סגול","color-red":"אדום","color-sky":"תכלת","color-yellow":"צהוב","comment":"הערה","comment-placeholder":"כתוב הערה","computer":"מחשב","create":"צור","createBoardPopup-title":"צור לוח","createLabelPopup-title":"צור תווית","current":"נוכחי","date":"תאריך","decline":"סרב","default-avatar":"אווטאר דיפולטי","delete":"מחק","deleteLabelPopup-title":"למחוק תווית?","description":"תיאור","disambiguateMultiLabelPopup-title":"הבהרת פעולת תווית","disambiguateMultiMemberPopup-title":"הבהרת פעולת חבר","discard":"בטל","done":"בוצע","download":"הורד","edit":"ערוך","edit-avatar":"שנה אווטאר","edit-profile":"ערוך פרופיל","editCardStartDatePopup-title":"שנה זמן התחלה","editCardDueDatePopup-title":"שנה זמן סיום","editLabelPopup-title":"שנה תווית","editNotificationPopup-title":"שנה התראה","editProfilePopup-title":"ערוך פרופיל","email":"אמייל","email-enrollAccount-subject":"חשבון נוצר עבורך ב __siteName__","email-enrollAccount-text":"שלום __user__,\n\nלהתחלת השימוש בשירות, לחץ על הקישור המופיע מטה.\n\n__url__\n\nתודה.","email-fail":"שליחת אמייל נכשלה","email-invalid":"כתובת אמייל לא חוקית","email-invite":"הזמן באמצעות אמייל","email-invite-subject":"__inviter__ שלח לך הזמנה","email-invite-text":"שלום __user__,\n\n__inviter__ הזמין אותך להצטרף ללוח \"__board__\" להמשך שיתוף הפעולה.\n\nאנא לחץ על הקישור המופיע מטה:\n\n__url__\n\nתודה.","email-resetPassword-subject":"אפס את סיסמתך ב __siteName__","email-resetPassword-text":"שלום __user__,\n\nלאיפוס סיסמתך, לחץ על הקישור המופיע מטה.\n\n__url__\n\nתודה.","email-sent":"אמייל נשלח","email-verifyEmail-subject":"אמת את כתובת האמייל שלך ב __siteName__","email-verifyEmail-text":"שלום __user__,\n\nלאימות כתובת האמייל של חשבונך, פשוט לחץ על הקישור המופיע מטה.\n\n__url__\n\nתודה.","error-board-doesNotExist":"לוח זה לא קיים","error-board-notAdmin":"צריך להיות אדמין של לוח זה בשביל לעשות זאת","error-board-notAMember":"צריך להיות חבר בלוח זה בשביל לעשות זאת","error-json-malformed":"הטקסט שלך איננו JSON תקין","error-json-schema":"נתוני ה JSON שלך לא כוללים הנחיות בפורמט תקין","error-list-doesNotExist":"רשימה זו לא קיימת","error-user-doesNotExist":"משתמש זה לא קיים","error-user-notAllowSelf":"פעולה זו איננה מותרת","error-user-notCreated":"משתמש זה לא נוצר","error-username-taken":"המשתמש כבר קיים במערכת","export-board":"ייצא לוח","filter":"מסנן","filter-cards":"סנן כרטיסים","filter-clear":"נקה מסנן","filter-no-label":"אין תווית","filter-no-member":"המשתמש לא קיים","filter-on":"מסנן פועל","filter-on-desc":"מסנן כרטיסים בלוח זה פועל. יש ללחוץ כאן לעריכת המסנן.","filter-to-selection":"סנן את הבחירה","fullname":"שם מלא","header-logo-title":"חזור לדף הלוחות שלך.","hide-system-messages":"הסתר הודעות מערכת","home":"בית","import":"ייבא","import-board":"ייבא מטרלו","import-board-title":"ייבא לוח מטרלו","import-board-trello-instruction":"בלוח הטרלו שלך, עבור ל 'Menu', ואז ל 'More', 'Print and Export', 'Export JSON' והעתק את הטקסט שנוצר","import-json-placeholder":"הדבק נתוני JSON תקינים כאן","import-map-members":"מפֱה חברים","import-members-map":"הלוחות המיובאים שלך מכילים חברים. בבקשה מפה את החברים שתרצה לייבא כמשתמשים","import-show-user-mapping":"צפה במיפוי חברים","import-user-select":"בחר במשתמש עבור חבר זה","importMapMembersAddPopup-title":"בחר משתמש","info":"אינפורמציה","initials":"ראשי תיבות","invalid-date":"תאריך שגוי","joined":"הצטרף","just-invited":"הוזמנת ללוח זה","keyboard-shortcuts":"קיצורי מקלדת","label-create":"צור תווית חדשה","label-default":"%s תווית (ברירת מחדל)","label-delete-pop":"אין דרך חזרה. התווית תוסר מכל הכרטיסים וההיסטוריה תימחק.","labels":"תוויות","language":"שפה","last-admin-desc":"לא ניתן לשנות תפקידים מכיוון שחייב להיות אדמין אחד לפחות.","leave-board":"עזוב לוח","link-card":"קישור לכרטיס זה","list-archive-cards":"אחסן בארכיון את כל הכרטיסים שברשימה זו","list-archive-cards-pop":"כל הכרטיסים מרשימה זו יוסרו מהלוח. לצפייה בכרטיסים המאוחסנים בארכיון ולהחזירם ללוח, לחצו \"תפריט\" > \"כרטיסים מאוחסנים בארכיון\".","list-move-cards":"הזז את כל הכרטיסים ברשימה זו","list-select-cards":"בחר את כל הכרטיסים ברשימה זו","listActionPopup-title":"פעולות רשימה","listImportCardPopup-title":"ייבא כרטיס מטרלו","lists":"רשימות","log-out":"התנתק","log-in":"התחבר","loginPopup-title":"התחבר","memberMenuPopup-title":"הגדרות חבר","members":"חברים","menu":"תפריט","move-selection":"הזז בחירה","moveCardPopup-title":"הזז כרטיס","moveCardToBottom-title":"העבר כרטיס לתחתית הרשימה","moveCardToTop-title":"העבר כרטיס לראש הרשימה ","moveSelectionPopup-title":"הזז בחירה","multi-selection":"בחירה מרובה","multi-selection-on":"בחירה מרובה פועלת","muted":"השתק","muted-info":"מעתה אתה לא תקבל עוד התראות על שינויים בלוח זה","my-boards":"הלוחות שלי","name":"שם","no-archived-cards":"אין כרטיסים מאוחסנים בארכיון.","no-archived-lists":"אין רשימות מאוחסנות בארכיון.","no-results":"אין תוצאות","normal":"נורמלי","normal-desc":"יכול לצפות ולערוך כרטיסים. לא יכול לשנות הגדרות.","not-accepted-yet":"הזמנה לא התקבלה עדיין","notify-participate":"קבל התראות על שינויים בכרטיסים שיצרת או שבהם אתה חבר","notify-watch":"קבל התראות על עדכונים בכל לוח, רשימה או כרטיס שבהם אתה חבר","optional":"אופציונלי","or":"או","page-maybe-private":"יתכן שדף זה פרטי. תוכלו לצפות על ידי <a href='%s'>התחברות למערכת</a>","page-not-found":"דף לא נמצא.","password":"סיסמא","paste-or-dragdrop":"בכדי להדביק או drag & drop קובץ תמונה (תמונה בלבד)","participating":"Participating","preview":"תצוגה מקדימה","previewAttachedImagePopup-title":"תצוגה מקדימה","previewClipboardImagePopup-title":"תצוגה מקדימה","private":"פרטי","private-desc":"לוח זה פרטי. רק אנשים שנוספו ללוח יכולים לצפות ולערוך אותו.","profile":"פרופיל","public":"ציבורי","public-desc":"לוח זה ציבורי. כל מי שמחזיק בקישור יכול לצפות בלוח זה והלוח יופיע בתוצאות מנועי חיפוש כגון גוגל. רק אנשים שנוספו ללוח יכולים לערוך אותו.","quick-access-description":"בלחיצה על הכוכב יתווסף קיצור דרך ללוח בשורה זו.","remove-cover":"הסר כיסוי","remove-from-board":"הסר מהלוח","remove-label":"הסר תווית","remove-list":"הסר מהרשימה","remove-member":"הסר חבר","remove-member-from-card":"הסר מהכרטיס","remove-member-pop":"הסר __name__ (__username__) מ __boardTitle__? החבר יוסר מכל הכרטיסים בלוח זה. הוא יקבל על כך הודעה.","removeMemberPopup-title":"להסיר חבר?","rename":"שנה שם","rename-board":"שנה שם ללוח","restore":"שחזר","save":"שמור","search":"חפש","select-color":"בחר צבע","shortcut-assign-self":"הקצה את עצמך לכרטיס הנוכחי","shortcut-autocomplete-emoji":"השלמה אוטומטית לפרצופונים (Emoji)","shortcut-autocomplete-members":"השלמה אוטומטית של חברים","shortcut-clear-filters":"נקה את כל המסננים","shortcut-close-dialog":"סגור חלון","shortcut-filter-my-cards":"סנן את הכרטיסים שלי","shortcut-show-shortcuts":"הבא רשימת קיצורי דרך זו","shortcut-toggle-filterbar":"החלף מצבי מסנן","shortcut-toggle-sidebar":"החלף מצבי מסנן","show-cards-minimum-count":"הצג מספר כרטיסים אם הרשימה מכיל יותר כרטיסים מ-","signupPopup-title":"צור חשבון","star-board-title":"בלחיצה על הכווכב של הלוח יתווסף הלוח לראש רשימת הלוחות שלך.","starred-boards":"לוחות שסומנו בכוכב","starred-boards-description":"לוחות מסומנים בכוכב מופיעים בראש רשימת הלוחות שלך.","subscribe":"הירשם","team":"צוות","this-board":"לוח זה","this-card":"כרטיס זה","time":"זמן","title":"כותרת","tracking":"Tracking","tracking-info":"אתה תקבל התראות על שינויים בכרטיסים שיצרת או שאתה חבר בהם","unassign-member":"בטל הקצאת חבר","unsaved-description":"יש לך תיאור לא שמור.","unwatch":"הספק מעקב","upload":"העלה/טען","upload-avatar":"העלה/ טען אווטאר","uploaded-avatar":"אווטאר הועלה/נטען","username":"שם משתמש","view-it":"צפה","warn-list-archived":"אזהרה: הכרטיס נמצא ברשימה שהועברה לארכיון","watch":"עקוב","watching":"עוקב","watching-info":"מעתה אתה תקבל התראות על עדכונים בלוח זה","welcome-board":"ברוך הבא ללוח","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"מה תרצה לעשות?"});
TAPi18n._registerServerTranslator("he", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"it.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/it.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["it"] = ["Italian","Italiano"];
if(_.isUndefined(TAPi18n.translations["it"])) {
  TAPi18n.translations["it"] = {};
}

if(_.isUndefined(TAPi18n.translations["it"][namespace])) {
  TAPi18n.translations["it"][namespace] = {};
}

_.extend(TAPi18n.translations["it"][namespace], {"accept":"Accetta","act-activity-notify":"[Wekan] Notifiche attività","act-addAttachment":"ha allegato __attachment__ a __card__","act-addComment":"ha commentato su __card__: __comment__","act-createBoard":"ha creato __board__","act-createCard":"ha aggiunto __card__ a __list__","act-createList":"ha aggiunto __list__ a __board__","act-addBoardMember":"ha aggiunto __member__ a __board__","act-archivedBoard":"ha archiviato __board__","act-archivedCard":"ha archiviato __card__","act-archivedList":"ha archiviato __list__","act-importBoard":"ha importato __board__","act-importCard":"ha importato __card__","act-importList":"ha importato __list__","act-joinMember":"ha aggiunto __member__ a __card__","act-moveCard":"ha spostato __card__ da __oldList__ a __list__","act-removeBoardMember":"ha rimosso __member__ da __board__","act-restoredCard":"ha ripristinato __card__ su __board__","act-unjoinMember":"ha rimosso __member__ da __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Azioni","activities":"Attività","activity":"Attività","activity-added":"ha aggiunto %s a %s","activity-archived":"archiviato %s","activity-attached":"allegato %s a %s","activity-created":"creato %s","activity-excluded":"escluso %s da %s","activity-imported":"importato %s in %s da %s","activity-imported-board":"importato %s da %s","activity-joined":"si è unito a %s","activity-moved":"spostato %s da %s a %s","activity-on":"su %s","activity-removed":"rimosso %s da %s","activity-sent":"inviato %s a %s","activity-unjoined":"ha abbandonato %s","activity-checklist-added":"aggiunta checklist a %s","add":"Aggiungere","add-attachment":"Aggiungi allegato","add-board":"Aggiungi una nuova bachecha","add-card":"Aggiungi una scheda","add-checklist":"Aggiungi una checklist","add-checklist-item":"Aggiungi un elemento alla checklist","add-cover":"Aggiungi copertina","add-label":"Aggiungi l'etichetta","add-list":"Aggiungi una lista","add-members":"Aggiungi membri","added":"Aggiunto","addMemberPopup-title":"Membri","admin":"Amministratore","admin-desc":"Può vedere e modificare schede, rimuovere membri e modificare le impostazioni della bacheca.","all-boards":"Tutte le bacheche","and-n-other-card":"E __count__ altra scheda","and-n-other-card_plural":"E __count__ altre schede","apply":"Applica","app-is-offline":"L'applicazione è al momento offline, ricaricando la pagina perderai i dati.","archive":"Archivia","archive-all":"Archivia tutto","archive-board":"Archivia bacheca","archive-card":"Archivia scheda","archive-list":"Archivia questa lista","archive-selection":"Archivia selezione","archiveBoardPopup-title":"Archivia Bacheca?","archived-items":"Elementi archiviati","archives":"Archivi","assign-member":"Aggiungi membro","attached":"allegato","attachment":"Allegato","attachment-delete-pop":"L'eliminazione di un allegato è permanente. Non è possibile annullare.","attachmentDeletePopup-title":"Eliminare l'allegato?","attachments":"Allegati","auto-watch":"Segui automaticamente le bacheche quando le crei","avatar-too-big":"L'avatar è troppo grande (max 70Kb)","back":"Indietro","board-change-color":"Cambia colore","board-nb-stars":"%s stelle","board-not-found":"Bacheca non trovata","board-private-info":"Questa bacheca sarà <strong>privata</strong>.","board-public-info":"Questa bacheca sarà <strong>pubblica</strong>.","boardChangeColorPopup-title":"Cambia sfondo della bacheca","boardChangeTitlePopup-title":"Rinomina bacheca","boardChangeVisibilityPopup-title":"Cambia visibilità","boardChangeWatchPopup-title":"Cambia faccia","boardMenuPopup-title":"Menu bacheca","boards":"Bacheche","bucket-example":"Per esempio come \"una lista di cose da fare\"","cancel":"Cancella","card-archived":"Questa scheda è archiviata.","card-comments-title":"Questa scheda ha %s commenti.","card-delete-notice":"L'eliminazione è permanente. Tutte le azioni associate a questa scheda andranno perse.","card-delete-pop":"Tutte le azioni saranno rimosse dal flusso attività e non sarai in grado di riaprire la scheda. Non potrai tornare indietro.","card-delete-suggest-archive":"Puoi archiviare una scheda per rimuoverla dalla bacheca e preservare la sua attività.","card-due":"Scadenza","card-due-on":"Scade","card-edit-attachments":"Modifica allegati","card-edit-labels":"Modifica etichette","card-edit-members":"Modifica membri","card-labels-title":"Cambia le etichette per questa scheda.","card-members-title":"Aggiungi o rimuovi membri della bacheca da questa scheda","card-start":"Inizio","card-start-on":"Inizia","cardAttachmentsPopup-title":"Allega da","cardDeletePopup-title":"Elimina scheda?","cardDetailsActionsPopup-title":"Azioni scheda","cardLabelsPopup-title":"Etichette","cardMembersPopup-title":"Membri","cardMorePopup-title":"Altro","cards":"Schede","change":"Cambia","change-avatar":"Cambia avatar","change-password":"Cambia password","change-permissions":"Cambia permessi","change-settings":"Cambia impostazioni","changeAvatarPopup-title":"Cambia avatar","changeLanguagePopup-title":"Cambia lingua","changePasswordPopup-title":"Cambia password","changePermissionsPopup-title":"Cambia permessi","changeSettingsPopup-title":"Cambia impostazioni","checklists":"Checklist","click-to-star":"Clicca per stellare questa bacheca","click-to-unstar":"Clicca per togliere la stella da questa bacheca","clipboard":"Clipboard o drag & drop","close":"Chiudi","close-board":"Chiudi bacheca","close-board-pop":"Sarai in grado di ripristinare la bacheca cliccando il tasto \"Archivi\" dall'intestazione della pagina principale.","color-black":"nero","color-blue":"blu","color-green":"verde","color-lime":"lime","color-orange":"arancione","color-pink":"rosa","color-purple":"viola","color-red":"rosso","color-sky":"azzurro","color-yellow":"giallo","comment":"Commento","comment-placeholder":"Scrivi un commento","computer":"Computer","create":"Crea","createBoardPopup-title":"Crea bacheca","createLabelPopup-title":"Crea etichetta","current":"corrente","date":"Data","decline":"Declina","default-avatar":"Avatar predefinito","delete":"Elimina","deleteLabelPopup-title":"Eliminare etichetta?","description":"Descrizione","disambiguateMultiLabelPopup-title":"Disambiguare l'azione Etichetta","disambiguateMultiMemberPopup-title":"Disambiguare l'azione Membro","discard":"Scarta","done":"Fatto","download":"Download","edit":"Modifica","edit-avatar":"Cambia avatar","edit-profile":"Modifica profilo","editCardStartDatePopup-title":"Cambia data di inizio","editCardDueDatePopup-title":"Cambia data di scadenza","editLabelPopup-title":"Cambia etichetta","editNotificationPopup-title":"Modifica notifiche","editProfilePopup-title":"Modifica profilo","email":"Email","email-enrollAccount-subject":"Creato un account per te su __siteName__","email-enrollAccount-text":"Ciao __user__,\n\nPer iniziare ad usare il servizio, clicca sul link seguente:\n\n__url__\n\nGrazie.","email-fail":"Invio email fallito","email-invalid":"Email non valida","email-invite":"Invita via email","email-invite-subject":"__inviter__ ti ha inviato un invito","email-invite-text":"Caro __user__,\n\n__inviter__ ti ha invitato ad unirti alla bacheca \"__board__\" per le collaborazioni.\n\nPer favore clicca sul link seguente:\n\n__url__\n\nGrazie.","email-resetPassword-subject":"Ripristina la tua password su on __siteName__","email-resetPassword-text":"Ciao __user__,\n\nPer ripristinare la tua password, clicca sul link seguente:\n\n__url__\n\nGrazie.","email-sent":"Email inviata","email-verifyEmail-subject":"Verifica il tuo indirizzo email su on __siteName__","email-verifyEmail-text":"Ciao __user__,\n\nPer verificare il tuo account email, clicca sul link seguente:\n\n__url__\n\nGrazie.","error-board-doesNotExist":"Questa bacheca non esiste","error-board-notAdmin":"Devi essere admin di questa bacheca per poterlo fare","error-board-notAMember":"Devi essere un membro di questa bacheca per poterlo fare","error-json-malformed":"Il tuo testo non è un JSON valido","error-json-schema":"Il tuo file JSON non contiene le giuste informazioni nel formato corretto","error-list-doesNotExist":"Questa lista non esiste","error-user-doesNotExist":"Questo utente non esiste","error-user-notAllowSelf":"Questa azione su se stessa non è permessa","error-user-notCreated":"L'utente non è stato creato","error-username-taken":"Questo username è già utilizzato","export-board":"Esporta bacheca","filter":"Filtra","filter-cards":"Filtra schede","filter-clear":"Pulisci filtri","filter-no-label":"Nessuna etichetta","filter-no-member":"Nessun membro","filter-on":"Il filtro è attivo","filter-on-desc":"Stai filtrando le schede su questa bacheca. Clicca qui per modificare il filtro,","filter-to-selection":"Seleziona","fullname":"Nome completo","header-logo-title":"Torna alla tua bacheca.","hide-system-messages":"Nascondi i messaggi di sistema","home":"Home","import":"Importa","import-board":"importa da Trello","import-board-title":"Importa una bacheca da Trello","import-board-trello-instruction":"Nella tua bacheca Trello vai a 'Menu', poi 'Altro', 'Stampa ed esporta', 'Esporta JSON', e copia il testo che compare.","import-json-placeholder":"Incolla un JSON valido qui","import-map-members":"Mappatura dei membri","import-members-map":"La bacheca che hai importato ha alcuni membri. Per favore scegli i membri che vuoi vengano importati negli utenti di Wekan","import-show-user-mapping":"Rivedi la mappatura dei membri","import-user-select":"Scegli l'utente Wekan che vuoi utilizzare come questo membro","importMapMembersAddPopup-title":"Seleziona i membri di Wekan","info":"Info","initials":"Iniziali","invalid-date":"Data non valida","joined":"si è unito a","just-invited":"Sei stato appena invitato a questa bacheca","keyboard-shortcuts":"Scorciatoie da tastiera","label-create":"Crea una nuova etichetta","label-default":"%s etichetta (default)","label-delete-pop":"Non potrai tornare indietro. Procedendo, rimuoverai questa etichetta da tutte le schede e distruggerai la sua cronologia.","labels":"Etichette","language":"Lingua","last-admin-desc":"Non puoi cambiare i ruoli perché deve esserci almeno un admin.","leave-board":"Abbandona bacheca","link-card":"Link a questa scheda","list-archive-cards":"Archivia tutte le schede in questa lista","list-archive-cards-pop":"Questo rimuoverà dalla bacheca tutte le schede in questa lista. Per vedere le schede archiviate e portarle indietro alla bacheca, clicca “Menu” > “Elementi archiviati”","list-move-cards":"Sposta tutte le schede in questa lista","list-select-cards":"Selezione tutte le schede in questa lista","listActionPopup-title":"Azioni disponibili","listImportCardPopup-title":"Importa una scheda di Trello","lists":"Liste","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Impostazioni membri","members":"Membri","menu":"Menu","move-selection":"Sposta selezione","moveCardPopup-title":"Sposta scheda","moveCardToBottom-title":"Sposta in fondo","moveCardToTop-title":"Sposta in alto","moveSelectionPopup-title":"Sposta selezione","multi-selection":"Multi-Selezione","multi-selection-on":"Multi-Selezione attiva","muted":"Silenziato","muted-info":"Non sarai mai notificato delle modifiche in questa bacheca","my-boards":"Le mie bacheche","name":"Nome","no-archived-cards":"Nessuna scheda archiviata.","no-archived-lists":"Nessuna lista archiviata.","no-results":"Nessun risultato","normal":"Normale","normal-desc":"Può visionare e modificare le schede. Non può cambiare le impostazioni.","not-accepted-yet":"Invitato non ancora accettato","notify-participate":"Ricevi aggiornamenti per qualsiasi scheda a cui partecipi come creatore o membro","notify-watch":"Ricevi aggiornamenti per tutte le bacheche, liste o schede che stai seguendo","optional":"opzionale","or":"o","page-maybe-private":"Questa pagina potrebbe essere privata. Potresti essere in grado di vederla <a href='%s'>facendo il log-in</a>.","page-not-found":"Pagina non trovata.","password":"Password","paste-or-dragdrop":"per incollare, oppure trascina & rilascia il file immagine (solo immagini)","participating":"Partecipando","preview":"Anteprima","previewAttachedImagePopup-title":"Anteprima","previewClipboardImagePopup-title":"Anteprima","private":"Privata","private-desc":"Questa bacheca è privata. Solo le persone aggiunte alla bacheca possono vederla e modificarla.","profile":"Profilo","public":"Pubblica","public-desc":"Questa bacheca è pubblica. È visibile a chiunque abbia il link e sarà mostrata dai motori di ricerca come Google. Solo le persone aggiunte alla bacheca possono modificarla.","quick-access-description":"Stella una bacheca per aggiungere una scorciatoia in questa barra.","remove-cover":"Rimuovi cover","remove-from-board":"Rimuovi dalla bacheca","remove-label":"Rimuovi l'etichetta","remove-list":"Rimuovi la lista","remove-member":"Rimuovi utente","remove-member-from-card":"Rimuovi dalla scheda","remove-member-pop":"Rimuovere __name__ (__username__) da __boardTitle__? L'utente sarà rimosso da tutte le schede in questa bacheca. Riceveranno una notifica.","removeMemberPopup-title":"Rimuovere membro?","rename":"Rinomina","rename-board":"Rinomina bacheca","restore":"Ripristina","save":"Salva","search":"Cerca","select-color":"Seleziona un colore","shortcut-assign-self":"Aggiungi te stesso alla scheda corrente","shortcut-autocomplete-emoji":"Autocompletamento emoji","shortcut-autocomplete-members":"Autocompletamento membri","shortcut-clear-filters":"Pulisci tutti i filtri","shortcut-close-dialog":"Chiudi finestra di dialogo","shortcut-filter-my-cards":"Filtra le mie schede","shortcut-show-shortcuts":"Porta in alto questa lista di scorciatoie","shortcut-toggle-filterbar":"Attiva il filtro nella barra laterale","shortcut-toggle-sidebar":"Attiva la bacheca nella barra laterale","show-cards-minimum-count":"Mostra il contatore delle schede se la lista ne contiene più di","signupPopup-title":"Crea un account","star-board-title":"Clicca per stellare questa bacheca. Sarà mostrata all'inizio della tua lista bacheche.","starred-boards":"Bacheche stellate","starred-boards-description":"Le bacheche stellate vengono mostrato all'inizio della tua lista bacheche.","subscribe":"Sottoscrivi","team":"Team","this-board":"questa bacheca","this-card":"questa scheda","time":"Ora","title":"Titolo","tracking":"Monitoraggio","tracking-info":"Sarai notificato per tutte le modifiche alle schede delle quali sei creatore o membro.","unassign-member":"Rimuovi membro","unsaved-description":"Hai una descrizione non salvata","unwatch":"Non seguire","upload":"Upload","upload-avatar":"Carica un avatar","uploaded-avatar":"Avatar caricato","username":"Username","view-it":"Vedi","warn-list-archived":"attenzione: questa scheda è in una lista archiviata","watch":"Segui","watching":"Stai seguendo","watching-info":"Sarai notificato per tutte le modifiche in questa bacheca","welcome-board":"Bacheca di benvenuto","welcome-list1":"Basi","welcome-list2":"Avanzate","what-to-do":"Cosa vuoi fare?"});
TAPi18n._registerServerTranslator("it", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ja.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ja.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ja"] = ["Japanese","日本語"];
if(_.isUndefined(TAPi18n.translations["ja"])) {
  TAPi18n.translations["ja"] = {};
}

if(_.isUndefined(TAPi18n.translations["ja"][namespace])) {
  TAPi18n.translations["ja"][namespace] = {};
}

_.extend(TAPi18n.translations["ja"][namespace], {"accept":"受け入れ","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"操作","activities":"アクティビティ","activity":"アクティビティ","activity-added":"%s を %s に追加しました","activity-archived":"%s をアーカイブしました","activity-attached":"%s を %s に添付しました","activity-created":"%s を作成しました","activity-excluded":"%s を %s から除外しました","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"%s にジョインしました","activity-moved":"%s を %s から %s に移動しました","activity-on":"%s","activity-removed":"%s を %s から削除しました","activity-sent":"%s を %s に送りました","activity-unjoined":"%s への参加を止めました","activity-checklist-added":"%s にチェックリストを追加しました","add":"追加","add-attachment":"添付ファイルの追加","add-board":"ボード追加","add-card":"カードの追加","add-checklist":"チェックリストの追加","add-checklist-item":"チェックリストに項目を追加","add-cover":"カバーの追加","add-label":"ラベルの追加","add-list":"リストの追加","add-members":"メンバーの追加","added":"追加しました","addMemberPopup-title":"メンバー","admin":"管理","admin-desc":"カードの閲覧と編集、メンバーの削除、ボードの設定変更が可能","all-boards":"全てのボード","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"適用","app-is-offline":"現在オフラインです。ページを更新すると保存していないデータは失われます。","archive":"アーカイブ","archive-all":"すべてをアーカイブ","archive-board":"ボードをアーカイブ","archive-card":"カードをアーカイブ","archive-list":"このリストをアーカイブ","archive-selection":"選択したものをアーカイブ","archiveBoardPopup-title":"ボードをアーカイブしますか？","archived-items":"アーカイブされたアイテム","archives":"アーカイブ","assign-member":"メンバーの割当","attached":"添付されました","attachment":"添付ファイル","attachment-delete-pop":"添付ファイルの削除をすると取り消しできません。","attachmentDeletePopup-title":"添付ファイルを削除しますか？","attachments":"添付ファイル","auto-watch":"作成したボードは自動的に監視する","avatar-too-big":"アバターが大きすぎます(最大70KB)","back":"戻る","board-change-color":"色の変更","board-nb-stars":"%s stars","board-not-found":"ボードが見つかりません","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"ボードは公開されます。","boardChangeColorPopup-title":"ボードの背景を変更","boardChangeTitlePopup-title":"ボード名の変更","boardChangeVisibilityPopup-title":"公開範囲の変更","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"ボードメニュー","boards":"ボード","bucket-example":"Like “Bucket List” for example","cancel":"キャンセル","card-archived":"カードはアーカイブされました。","card-comments-title":"%s 件のコメントがあります。","card-delete-notice":"削除は取り消しできません。このカードに関係するすべてのアクションがなくなります。","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"期限","card-due-on":"Due on","card-edit-attachments":"添付ファイルの編集","card-edit-labels":"ラベルの編集","card-edit-members":"メンバーの編集","card-labels-title":"カードのラベルを変更する","card-members-title":"カードからボードメンバーを追加・削除する","card-start":"開始","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"カードを削除しますか？","cardDetailsActionsPopup-title":"カード操作","cardLabelsPopup-title":"ラベル","cardMembersPopup-title":"メンバー","cardMorePopup-title":"さらに見る","cards":"カード","change":"変更","change-avatar":"アバターの変更","change-password":"パスワードの変更","change-permissions":"権限の変更","change-settings":"設定の変更","changeAvatarPopup-title":"アバターの変更","changeLanguagePopup-title":"言語の変更","changePasswordPopup-title":"パスワードの変更","changePermissionsPopup-title":"パーミッションの変更","changeSettingsPopup-title":"設定の変更","checklists":"チェックリスト","click-to-star":"ボードにスターをつける","click-to-unstar":"ボードからスターを外す","clipboard":"クリップボードもしくはドラッグ＆ドロップ","close":"閉じる","close-board":"ボードを閉じる","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"黒","color-blue":"青","color-green":"緑","color-lime":"ライム","color-orange":"オレンジ","color-pink":"ピンク","color-purple":"紫","color-red":"赤","color-sky":"空","color-yellow":"黄","comment":"コメント","comment-placeholder":"コメントを書く","computer":"コンピューター","create":"作成","createBoardPopup-title":"ボードの作成","createLabelPopup-title":"ラベルの作成","current":"現在","date":"日付","decline":"拒否","default-avatar":"デフォルトのアバター","delete":"削除","deleteLabelPopup-title":"ラベルを削除しますか？","description":"詳細","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"捨てる","done":"完了","download":"ダウンロード","edit":"編集","edit-avatar":"アバターの変更","edit-profile":"プロフィールの編集","editCardStartDatePopup-title":"開始日の変更","editCardDueDatePopup-title":"期限の変更","editLabelPopup-title":"ラベルの変更","editNotificationPopup-title":"通知の変更","editProfilePopup-title":"プロフィールの編集","email":"メールアドレス","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"メールの送信に失敗しました","email-invalid":"無効なメールアドレス","email-invite":"メールで招待","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"ボードがありません","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"ユーザーが存在しません","error-user-notAllowSelf":"この操作は許可されていません","error-user-notCreated":"ユーザーが作成されていません","error-username-taken":"このユーザ名は既に使用されています","export-board":"ボードのエクスポート","filter":"フィルター","filter-cards":"カードをフィルターする","filter-clear":"フィルターの解除","filter-no-label":"ラベルなし","filter-no-member":"メンバーなし","filter-on":"フィルター有効","filter-on-desc":"このボードのカードをフィルターしています。フィルターを編集するにはこちらをクリックしてください。","filter-to-selection":"Filter to selection","fullname":"フルネーム","header-logo-title":"自分のボードページに戻る。","hide-system-messages":"システムメッセージを隠す","home":"ホーム","import":"インポート","import-board":"Trelloからインポート","import-board-title":"Trelloからボードをインポート","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"情報","initials":"Initials","invalid-date":"無効な日付","joined":"参加しました","just-invited":"You are just invited to this board","keyboard-shortcuts":"キーボード・ショートカット","label-create":"ラベル作成","label-default":"%s ラベル(デフォルト)","label-delete-pop":"この操作は取り消しできません。このラベルはすべてのカードから外され履歴からも見えなくなります。","labels":"ラベル","language":"言語","last-admin-desc":"最低でも1人以上の管理者が必要なためロールを変更できません。","leave-board":"ボードから退出する","link-card":"このカードへのリンク","list-archive-cards":"リストの全カードをアーカイブする","list-archive-cards-pop":"ボードのこのリスト内のすべてのカードを取り除きます。アーカイブされたカードの確認やそれをボードに戻すには、メニューをクリックし、\"アーカイブされたアイテム\"をクリックしてください。","list-move-cards":"リストの全カードを移動する","list-select-cards":"リストの全カードを選択","listActionPopup-title":"操作一覧","listImportCardPopup-title":"Trelloのカードをインポート","lists":"リスト","log-out":"ログアウト","log-in":"ログイン","loginPopup-title":"ログイン","memberMenuPopup-title":"メンバー設定","members":"メンバー","menu":"メニュー","move-selection":"Move selection","moveCardPopup-title":"カードの移動","moveCardToBottom-title":"最下部に移動","moveCardToTop-title":"先頭に移動","moveSelectionPopup-title":"選択箇所に移動","multi-selection":"複数選択","multi-selection-on":"複数選択有効","muted":"ミュート","muted-info":"このボードの変更は通知されません","my-boards":"自分のボード","name":"名前","no-archived-cards":"アーカイブされたボードはありません","no-archived-lists":"アーカイブされたリストはありません","no-results":"該当するものはありません","normal":"通常","normal-desc":"カードの閲覧と編集が可能。設定変更不可。","not-accepted-yet":"招待はアクセプトされていません","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"任意","or":"or","page-maybe-private":"このページはプライベートです。<a href='%s'>ログイン</a>して見てください。","page-not-found":"ページが見つかりません。","password":"パスワード","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"参加","preview":"プレビュー","previewAttachedImagePopup-title":"プレビュー","previewClipboardImagePopup-title":"プレビュー","private":"プライベート","private-desc":"このボードはプライベートです。ボードメンバーのみが閲覧・編集可能です。","profile":"プロフィール","public":"公開","public-desc":"このボードはパブリックです。リンクを知っていれば誰でもアクセス可能でGoogleのような検索エンジンの結果に表示されます。このボードに追加されている人だけがカード追加が可能です。","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"カバーの削除","remove-from-board":"ボードから外す","remove-label":"ラベルを外す","remove-list":"リストの除去","remove-member":"メンバーを外す","remove-member-from-card":"カードから外す","remove-member-pop":"__boardTitle__ から __name__ (__username__) を外しますか？メンバーはこのボードのすべてのカードから外れ、通知を受けます。","removeMemberPopup-title":"メンバーを外しますか？","rename":"名前変更","rename-board":"ボード名の変更","restore":"Restore","save":"保存","search":"検索","select-color":"色を選択","shortcut-assign-self":"自分をこのカードに割り当てる","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"すべてのフィルターを解除する","shortcut-close-dialog":"ダイアログを閉じる","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"フィルターサイドバーの切り替え","shortcut-toggle-sidebar":"ボードサイドバーの切り替え","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"アカウント作成","star-board-title":"ボードにスターをつけると自分のボード一覧のトップに表示されます。","starred-boards":"スターのついたボード","starred-boards-description":"スターのついたボードはボードリストの先頭に表示されます。","subscribe":"購読","team":"チーム","this-board":"このボード","this-card":"このカード","time":"時間","title":"タイトル","tracking":"トラッキング","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"アンウォッチ","upload":"アップロード","upload-avatar":"アバターのアップロード","uploaded-avatar":"アップロードされたアバター","username":"ユーザー名","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"ウォッチ","watching":"ウォッチしています","watching-info":"このボードの変更が通知されます","welcome-board":"ウェルカムボード","welcome-list1":"基本","welcome-list2":"高度","what-to-do":"何をしたいですか？"});
TAPi18n._registerServerTranslator("ja", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ko.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ko.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ko"] = ["Korean","한국어"];
if(_.isUndefined(TAPi18n.translations["ko"])) {
  TAPi18n.translations["ko"] = {};
}

if(_.isUndefined(TAPi18n.translations["ko"][namespace])) {
  TAPi18n.translations["ko"][namespace] = {};
}

_.extend(TAPi18n.translations["ko"][namespace], {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"동작","activities":"Activities","activity":"활동 상태","activity-added":"%s를 %s에 추가함","activity-archived":"%s 저장됨","activity-attached":"%s를 %s에 첨부함","activity-created":"%s 생성됨","activity-excluded":"%s를 %s에서 제외함","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"%s에 참여","activity-moved":"%s를 %s에서 %s로 옮김","activity-on":"%s에","activity-removed":"%s를 %s에서 삭제함","activity-sent":"%s를 %s로 보냄","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"추가","add-attachment":"Add an attachment","add-board":"새로운 보드를 추가","add-card":"Add a card","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"커버 추가","add-label":"Add the label","add-list":"Add a list","add-members":"Add Members","added":"추가됨","addMemberPopup-title":"멤버","admin":"관리자","admin-desc":"카드를 보거나 수정하고, 멤버를 삭제하고, 보드에 대한 설정을 수정할 수 있습니다.","all-boards":"All boards","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"보관","archive-all":"모두 보관","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"이 목록 보관","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"보관된 아이템","archives":"Archives","assign-member":"Assign member","attached":"첨부됨","attachment":"첨부 파일","attachment-delete-pop":"영구 첨부파일을 삭제합니다. 되돌릴 수 없습니다.","attachmentDeletePopup-title":"첨부 파일을 삭제합니까?","attachments":"첨부 파일","auto-watch":"Automatically watch boards when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"뒤로","board-change-color":"Change color","board-nb-stars":"%s stars","board-not-found":"보드를 찾을 수 없습니다","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"이 보드는 <strong>공개</strong>로 설정됩니다","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"보드 이름 바꾸기","boardChangeVisibilityPopup-title":"표시 여부 변경","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Board Menu","boards":"보드","bucket-example":"Like “Bucket List” for example","cancel":"취소","card-archived":"이 카드를 보관합니다.","card-comments-title":"이 카드에 %s 코멘트가 있습니다.","card-delete-notice":"영구 삭제입니다. 이 카드와 관련된 모든 작업들을 잃게됩니다.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-labels-title":"카드의 라벨 변경.","card-members-title":"카드에서 보드의 멤버를 추가하거나 삭제합니다.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"카드를 삭제합니까?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"라벨","cardMembersPopup-title":"멤버","cardMorePopup-title":"더보기","cards":"Cards","change":"Change","change-avatar":"아바타 변경","change-password":"암호 변경","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"아바타 변경","changeLanguagePopup-title":"언어 변경","changePasswordPopup-title":"암호 변경","changePermissionsPopup-title":"권한 변경","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"보드 별 추가.","click-to-unstar":"보드 별 삭제.","clipboard":"Clipboard or drag & drop","close":"닫기","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"코멘트","comment-placeholder":"Write a comment","computer":"내 컴퓨터","create":"생성","createBoardPopup-title":"보드 생성","createLabelPopup-title":"라벨 생성","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"삭제","deleteLabelPopup-title":"라벨을 삭제합니까?","description":"설명","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"다운로드","edit":"수정","edit-avatar":"아바타 변경","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"라벨 변경","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edit Profile","email":"이메일","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Filter","filter-cards":"카드 필터","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"보드에서 카드를 필터링합니다. 여기를 클릭하여 필터를 수정합니다.","filter-to-selection":"Filter to selection","fullname":"전체 이름","header-logo-title":"보드 페이지로 돌아가기.","hide-system-messages":"Hide system messages","home":"홈","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"정보","initials":"Initials","invalid-date":"Invalid date","joined":"참가함","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"새로운 라벨 생성","label-default":"%s 라벨 (기본)","label-delete-pop":"되돌릴 수 없습니다. 모든 카드에서 라벨을 제거하고, 이력을 제거합니다.","labels":"라벨","language":"언어","last-admin-desc":"적어도 하나의 관리자가 필요하기에 이 역할을 변경할 수 없습니다.","leave-board":"Leave Board","link-card":"카드에대한 링크","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"보드의 목록에서 모든 카드를 삭제합니다. 보관된 카드를 보거나 그것들을 보드로 되돌릴려면, \"메뉴\" > \"보관된 아이템\"을 클릭합니다.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"동작 목록","listImportCardPopup-title":"Import a Trello card","lists":"Lists","log-out":"로그아웃","log-in":"로그인","loginPopup-title":"로그인","memberMenuPopup-title":"Member Settings","members":"멤버","menu":"메뉴","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"내 보드","name":"이름","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"결과 값 없음","normal":"표준","normal-desc":"카드를 보거나 수정할 수 있습니다. 설정값은 변경할 수 없습니다.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"옴션","or":"or","page-maybe-private":"이 페이지를 비공개일 수 있습니다. 이것을 보고 싶으면 <a href='%s'>로그인</a>을 하십시오.","page-not-found":"페이지를 찾지 못 했습니다","password":"암호","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"비공개","private-desc":"비공개된 보드입니다. 오직 보드에 추가된 사람들만 보고 수정할 수 있습니다","profile":"프로파일","public":"공개","public-desc":"공개된 보드입니다. 링크를 가진 모든 사람과 구글과 같은 검색 엔진에서 찾아서 볼수 있습니다. 보드에 추가된 사람들만 수정이 가능합니다.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"커버 제거","remove-from-board":"Remove from Board","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"멤버 제거","remove-member-from-card":"카드에서 제거","remove-member-pop":"__boardTitle__에서 __name__(__username__) 을 제거합니까? 그 멤버는 이 보드의 모든 카드에서 제거됩니다. 그에대한 알람을 받게됩니다.","removeMemberPopup-title":"멤버를 제거합니까?","rename":"새이름","rename-board":"보드 이름 바꾸기","restore":"Restore","save":"저장","search":"검색","select-color":"색 선택","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"계정 생성","star-board-title":"보드에 별을 클릭합니다. 보드 목록에서 최상위로 둘 수 있습니다.","starred-boards":"별표된 보드","starred-boards-description":"별표된 보드들은 보드 목록의 최상단에서 보입니다.","subscribe":"구독","team":"팀","this-board":"보드","this-card":"카드","time":"Time","title":"제목","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"사용자 이름","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"무엇을 원하나요?"});
TAPi18n._registerServerTranslator("ko", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pl.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/pl.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["pl"] = ["Polish","Polski"];
if(_.isUndefined(TAPi18n.translations["pl"])) {
  TAPi18n.translations["pl"] = {};
}

if(_.isUndefined(TAPi18n.translations["pl"][namespace])) {
  TAPi18n.translations["pl"][namespace] = {};
}

_.extend(TAPi18n.translations["pl"][namespace], {"accept":"Akceptuj","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Akcje","activities":"Aktywności","activity":"Aktywność","activity-added":"dodano %s z %s","activity-archived":"zarchiwizowano %s","activity-attached":"załączono %s z %s","activity-created":"utworzono %s","activity-excluded":"wyłączono %s z %s","activity-imported":"zaimportowano %s to %s z %s","activity-imported-board":"zaimportowano %s z %s","activity-joined":"dołączono %s","activity-moved":"przeniesiono % z %s to %s","activity-on":"w %s","activity-removed":"usunięto %s z %s","activity-sent":"wysłano %s z %s","activity-unjoined":"odłączono %s","activity-checklist-added":"added checklist to %s","add":"Dodaj","add-attachment":"Dodaj załącznik","add-board":"Dodaj nową tablicę","add-card":"Dodaj kartę","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Dodaj okładkę","add-label":"Dodaj etykietę","add-list":"Dodaj listę","add-members":"Dodaj członka","added":"Dodano","addMemberPopup-title":"Członkowie","admin":"Admin","admin-desc":"Może widzieć i edytować karty, usuwać członków oraz zmieniać ustawienia tablicy.","all-boards":"Wszystkie tablice","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Zarchiwizuj","archive-all":"Zarchiwizuj wszystkie","archive-board":"Zarchiwizuj tablicę","archive-card":"Zarchiwizuj kartę","archive-list":"Zarchiwizuj tę listę","archive-selection":"Zarchiwizuj zaznaczone","archiveBoardPopup-title":"Zarchiwizować tablicę?","archived-items":"Archived Items","archives":"Zarchiwizowane","assign-member":"Dodaj członka","attached":"załączono","attachment":"Załącznik","attachment-delete-pop":"Usunięcie załącznika jest nieodwracalne.","attachmentDeletePopup-title":"Usunąć załącznik?","attachments":"Załączniki","auto-watch":"Automatically watch boards when create it","avatar-too-big":"Avatar jest za duży (maksymalnie 70Kb)","back":"Wstecz","board-change-color":"Zmień kolor","board-nb-stars":"%s odznaczeń","board-not-found":"Nie znaleziono tablicy","board-private-info":"Ta tablica będzie <strong>prywatna</strong>.","board-public-info":"Ta tablica będzie <strong>publiczna<strong>.","boardChangeColorPopup-title":"Zmień tło tablicy","boardChangeTitlePopup-title":"Zmień nazwę tablicy","boardChangeVisibilityPopup-title":"Zmień widoczność","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Menu tablicy","boards":"Tablice","bucket-example":"Like “Bucket List” for example","cancel":"Anuluj","card-archived":"Ta karta jest zarchiwizowana.","card-comments-title":"Ta karta ma %s komentarzy.","card-delete-notice":"Usunięcie jest trwałe. Stracisz wszystkie akcje powiązane z tą kartą.","card-delete-pop":"Wszystkie akcje będą usunięte z widoku aktywności, nie można będzie ponownie otworzyć karty.  Usunięcie jest nieodwracalne.","card-delete-suggest-archive":"Możesz zarchiwizować kartę w celu usunięcia jej z tablicy oraz zachowania jej aktywności.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edytuj załączniki","card-edit-labels":"Edytuj etykiety","card-edit-members":"Edytuj członków","card-labels-title":"Zmień etykiety karty","card-members-title":"Dodaj lub usuń członków tablicy z karty.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Załącz z","cardDeletePopup-title":"Usunąć kartę?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Etykiety","cardMembersPopup-title":"Członkowie","cardMorePopup-title":"Więcej","cards":"Karty","change":"Zmień","change-avatar":"Zmień Avatar","change-password":"Zmień hasło","change-permissions":"Zmień uprawnienia","change-settings":"Change Settings","changeAvatarPopup-title":"Zmień Avatar","changeLanguagePopup-title":"Zmień język","changePasswordPopup-title":"Zmień hasło","changePermissionsPopup-title":"Zmień uprawnienia","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Kliknij by odznaczyć tę tablicę.","click-to-unstar":"Kliknij by usunąć odznaczenie tej tablicy.","clipboard":"Schowek lub przeciągnij & upuść","close":"Zamknij","close-board":"Zamknij tablicę","close-board-pop":"Możesz przywrócić tablicę klikając przycisk \"Zarchiwizowane\" z głównej belki.","color-black":"czarny","color-blue":"niebieski","color-green":"zielony","color-lime":"limonkowy","color-orange":"pomarańczowy","color-pink":"różowy","color-purple":"fioletowy","color-red":"czerwony","color-sky":"błękitny","color-yellow":"żółty","comment":"Komentarz","comment-placeholder":"Napisz komentarz","computer":"Komputer","create":"Utwórz","createBoardPopup-title":"Utwórz tablicę","createLabelPopup-title":"Utwórz etykietę","current":"obecny","date":"Date","decline":"Odrzuć","default-avatar":"Domyślny avatar","delete":"Usuń","deleteLabelPopup-title":"Usunąć etykietę?","description":"Opis","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Odrzuć","done":"Zrobiono","download":"Pobierz","edit":"Edytuj","edit-avatar":"Zmień Avatar","edit-profile":"Edytuj profil","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Zmień etykietę","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edytuj profil","email":"Email","email-enrollAccount-subject":"Konto zostało utworzone na __siteName__","email-enrollAccount-text":"Witaj __user__,\nAby zacząć korzystać z serwisu, kliknij w link poniżej.\n__url__\nDzięki.","email-fail":"Wysyłanie emaila nie powiodło się.","email-invalid":"Nieprawidłowy email","email-invite":"Zaproś przez email","email-invite-subject":"__inviter__ wysłał Ci zaproszenie","email-invite-text":"Drogi __user__,\n__inviter__ zaprosił Cię do współpracy w tablicy \"__board__\".\nZobacz więcej:\n__url__\nDzięki.","email-resetPassword-subject":"Zresetuj swoje hasło na __siteName__","email-resetPassword-text":"Witaj __user__,\nAby zresetować hasło, kliknij w link poniżej.\n__url__\nDzięki.","email-sent":"Email wysłany","email-verifyEmail-subject":"Zweryfikuj swój adres email na __siteName__","email-verifyEmail-text":"Witaj __user__,\nAby zweryfikować adres email, kliknij w link poniżej.\n__url__\nDzięki.","error-board-doesNotExist":"Ta tablica nie istnieje","error-board-notAdmin":"Musisz być administratorem tej tablicy żeby to zrobić","error-board-notAMember":"Musisz być członkiem tej tablicy żeby to zrobić","error-json-malformed":"Twój tekst nie jest poprawnym JSONem","error-json-schema":"Twój JSON nie zawiera prawidłowych informacji w poprawnym formacie","error-list-doesNotExist":"Ta lista nie isnieje","error-user-doesNotExist":"Ten użytkownik nie istnieje","error-user-notAllowSelf":"Ta akcje nie jest dozwolona","error-user-notCreated":"Ten użytkownik nie został stworzony","error-username-taken":"This username is already taken","export-board":"Eksportuj tablicę","filter":"Filtr","filter-cards":"Odfiltruj karty","filter-clear":"Usuń filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filtr jest włączony","filter-on-desc":"Filtrujesz karty na tej tablicy. Kliknij tutaj by edytować filtr.","filter-to-selection":"Odfiltruj zaznaczenie","fullname":"Full Name","header-logo-title":"Wróć do swojej strony z tablicami.","hide-system-messages":"Hide system messages","home":"Strona główna","import":"Importu","import-board":"zaimportuj z Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"W twojej tablicy na Trello, idź do 'Menu', następnie 'More', 'Print and Export', 'Export JSON' i skopiuj wynik","import-json-placeholder":"Wklej twój JSON tutaj","import-map-members":"Map members","import-members-map":"Twoje zaimportowane tablice mają kilku członków. Proszę wybierz członków których chcesz zaimportować do Wekan","import-show-user-mapping":"Przejrzyj wybranych członków","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Informacje","initials":"Initials","invalid-date":"Invalid date","joined":"dołączył","just-invited":"Właśnie zostałeś zaproszony do tej tablicy","keyboard-shortcuts":"Skróty klawiaturowe","label-create":"Utwórz nową etykietę","label-default":"%s etykieta (domyślna)","label-delete-pop":"There is no undo. This will remove this label from all cards and destroy its history.","labels":"Etykiety","language":"Język","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Opuść tablicę","link-card":"Link do tej karty","list-archive-cards":"Zarchiwizuj wszystkie karty z tej listy","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Przenieś wszystkie karty z tej listy","list-select-cards":"Zaznacz wszystkie karty z tej listy","listActionPopup-title":"Lista akcji","listImportCardPopup-title":"Zaimportuj kartę z Trello","lists":"Listy","log-out":"Wyloguj","log-in":"Zaloguj","loginPopup-title":"Zaloguj","memberMenuPopup-title":"Member Settings","members":"Członkowie","menu":"Menu","move-selection":"Przenieś zaznaczone","moveCardPopup-title":"Przenieś kartę","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Przenieś zaznaczone","multi-selection":"Wielokrotne zaznaczenie","multi-selection-on":"Wielokrotne zaznaczenie jest włączone","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Moje tablice","name":"Nazwa","no-archived-cards":"Brak zarchiwizowanych kart.","no-archived-lists":"Brak zarchiwizowanych list.","no-results":"Brak wyników","normal":"Normal","normal-desc":"Może widzieć i edytować karty. Nie może zmieniać ustawiań.","not-accepted-yet":"Zaproszenie jeszcze nie zaakceptowane","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"opcjonalny","or":"lub","page-maybe-private":"Ta strona może być prywatna. Możliwe, że możesz ją zobaczyć po <a href='%s'>zalogowaniu</a>.","page-not-found":"Strona nie znaleziona.","password":"Hasło","paste-or-dragdrop":"wklej lub przeciągnij & upuść obrazek","participating":"Participating","preview":"Podgląd","previewAttachedImagePopup-title":"Podgląd","previewClipboardImagePopup-title":"Podgląd","private":"Prywatny","private-desc":"Ta tablica jest prywatna. Tylko osoby dodane do tej tablicy mogą ją zobaczyć i edytować.","profile":"Profil","public":"Publiczny","public-desc":"This board is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the board can edit.","quick-access-description":"Odznacz tablicę aby dodać skrót na tym pasku.","remove-cover":"Usuń okładkę","remove-from-board":"Usuń z tablicy","remove-label":"Usuń etykietę","remove-list":"Remove the list","remove-member":"Usuń członka","remove-member-from-card":"Usuń z karty","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all cards on this board. They will receive a notification.","removeMemberPopup-title":"Usunąć członka?","rename":"Zmień nazwę","rename-board":"Zmień nazwę tablicy","restore":"Przywróć","save":"Zapisz","search":"Wyszukaj","select-color":"Wybierz kolor","shortcut-assign-self":"Przypisz siebie do obecnej karty","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Usuń wszystkie filtry","shortcut-close-dialog":"Zamknij okno","shortcut-filter-my-cards":"Filtruj moje karty","shortcut-show-shortcuts":"Przypnij do listy skrótów","shortcut-toggle-filterbar":"Przełącz boczny pasek filtru","shortcut-toggle-sidebar":"Przełącz boczny pasek tablicy","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Utwórz konto","star-board-title":"Click to star this board. It will show up at top of your boards list.","starred-boards":"Odznaczone tablice","starred-boards-description":"Starred boards show up at the top of your boards list.","subscribe":"Zapisz się","team":"Zespół","this-board":"ta tablica","this-card":"ta karta","time":"Time","title":"Tytuł","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Nieprzypisany członek","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Wyślij","upload-avatar":"Wyślij avatar","uploaded-avatar":"Wysłany avatar","username":"Nazwa użytkownika","view-it":"Zobacz","warn-list-archived":"ostrzeżenie: ta karta jest na zarchiwizowanej liście","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"Co chcesz zrobić?"});
TAPi18n._registerServerTranslator("pl", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pt-BR.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/pt-BR.i18n.json                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["pt-BR"] = ["Portuguese (Brazil)","Português do Brasil"];
if(_.isUndefined(TAPi18n.translations["pt-BR"])) {
  TAPi18n.translations["pt-BR"] = {};
}

if(_.isUndefined(TAPi18n.translations["pt-BR"][namespace])) {
  TAPi18n.translations["pt-BR"][namespace] = {};
}

_.extend(TAPi18n.translations["pt-BR"][namespace], {"accept":"Aceitar","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Ações","activities":"Atividades","activity":"Atividade","activity-added":"adicionou %s a %s","activity-archived":"arquivou %s","activity-attached":"anexou %s a %s","activity-created":"criou %s","activity-excluded":"excluiu %s de %s","activity-imported":"importado %s em %s de %s","activity-imported-board":"importado %s de %s","activity-joined":"juntou-se a %s","activity-moved":"moveu %s de %s para %s","activity-on":"em %s","activity-removed":"removeu %s de %s","activity-sent":"enviou %s de %s","activity-unjoined":"saiu de %s","activity-checklist-added":"added checklist to %s","add":"Novo","add-attachment":"Adicionar um anexo","add-board":"Criar um quadro novo","add-card":"Adicionar um cartão","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Adicionar Capa","add-label":"Adicionar a Etiqueta","add-list":"Adicionar uma lista","add-members":"Adicionar Membros","added":"Criado","addMemberPopup-title":"Membros","admin":"Administrador","admin-desc":"Pode ver e editar cartões, remover membros e alterar configurações do quadro.","all-boards":"Todos os quadros","and-n-other-card":"E __count__ outro cartão","and-n-other-card_plural":"E __count__ outros cartões","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Arquivar","archive-all":"Arquivar Tudo","archive-board":"Arquivar Quadro","archive-card":"Arquivar Cartão","archive-list":"Arquivar esta lista","archive-selection":"Arquivar seleção","archiveBoardPopup-title":"Arquivar Quadro?","archived-items":"Itens Arquivados","archives":"Arquivos","assign-member":"Atribuir Membro","attached":"anexado","attachment":"Anexo","attachment-delete-pop":"Excluir um anexo é permanente. Não será possível recuperá-lo.","attachmentDeletePopup-title":"Excluir Anexo?","attachments":"Anexos","auto-watch":"Automatically watch boards when create it","avatar-too-big":"Imagem de avatar muito grande (máx 70KB)","back":"Voltar","board-change-color":"Alterar cor","board-nb-stars":"%s estrelas","board-not-found":"Quadro não encontrado","board-private-info":"Este quadro será <strong>privado</strong>.","board-public-info":"Este quadro será <strong>público</strong>.","boardChangeColorPopup-title":"Alterar Tela de Fundo","boardChangeTitlePopup-title":"Renomear Quadro","boardChangeVisibilityPopup-title":"Alterar Visibilidade","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Menu do Quadro","boards":"Quadros","bucket-example":"\"Bucket List\", por exemplo","cancel":"Cancelar","card-archived":"Este cartão está arquivado.","card-comments-title":"Este cartão possui %s comentários.","card-delete-notice":"A exclusão será permanente. Você perderá todas as ações associadas a este cartão.","card-delete-pop":"Todas as ações serão removidas da lista de Atividades e vocês não poderá re-abrir o cartão. Não há como desfazer.","card-delete-suggest-archive":"Você pode arquivar um cartão para removê-lo do quadro e preservar suas atividades.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Editar anexos","card-edit-labels":"Editar etiquetas","card-edit-members":"Editar membros","card-labels-title":"Alterar etiquetas do cartão.","card-members-title":"Acrescentar ou remover membros do quadro deste cartão.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Anexar a partir de","cardDeletePopup-title":"Excluir Cartão?","cardDetailsActionsPopup-title":"Ações do cartão","cardLabelsPopup-title":"Etiquetas","cardMembersPopup-title":"Membros","cardMorePopup-title":"Mais","cards":"Cartões","change":"Alterar","change-avatar":"Alterar Avatar","change-password":"Alterar Senha","change-permissions":"Alterar permissões","change-settings":"Change Settings","changeAvatarPopup-title":"Alterar Avatar","changeLanguagePopup-title":"Alterar Idioma","changePasswordPopup-title":"Alterar Senha","changePermissionsPopup-title":"Alterar Permissões","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Marcar quadro como favorito.","click-to-unstar":"Remover quadro dos favoritos.","clipboard":"Área de Transferência ou arraste e solte","close":"Fechar","close-board":"Fechar Quadro","close-board-pop":"Você estará habilitado para restaurar o quadro clicando no botão \"Arquivos\" à partir da barra de início.","color-black":"preto","color-blue":"azul","color-green":"verde","color-lime":"verde limão","color-orange":"laranja","color-pink":"cor-de-rosa","color-purple":"roxo","color-red":"vermelho","color-sky":"céu","color-yellow":"amarelo","comment":"Comentário","comment-placeholder":"Escrever um comentário","computer":"Computador","create":"Criar","createBoardPopup-title":"Criar Quadro","createLabelPopup-title":"Criar Etiqueta","current":"atual","date":"Date","decline":"Rejeitar","default-avatar":"Avatar padrão","delete":"Excluir","deleteLabelPopup-title":"Excluir Etiqueta?","description":"Descrição","disambiguateMultiLabelPopup-title":"Desambiguar ações de etiquetas","disambiguateMultiMemberPopup-title":"Desambiguar ações de membros","discard":"Descartar","done":"Feito","download":"Baixar","edit":"Editar","edit-avatar":"Alterar Avatar","edit-profile":"Editar Perfil","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Alterar Etiqueta","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Editar Perfil","email":"E-mail","email-enrollAccount-subject":"Uma conta foi criada para você em __siteName__","email-enrollAccount-text":"Olá __user__\npara iniciar utilizando o serviço basta clicar no link abaixo.\n__url__\nMuito Obrigado.","email-fail":"Falhou ao enviar email","email-invalid":"Email inválido","email-invite":"Convite via Email","email-invite-subject":"__inviter__ lhe enviou um convite","email-invite-text":"Caro __user__\n__inviter__ lhe convidou para ingressar no quadro \"__board__\" como colaborador.\nPor favor prossiga através do link abaixo:\n__url__\nMuito obrigado.","email-resetPassword-subject":"Redefina sua senha em __siteName__","email-resetPassword-text":"Olá __user__\nPara redefinir sua senha, por favor clique no link abaixo.\n__url__\nMuito obrigado.","email-sent":"Email enviado","email-verifyEmail-subject":"Verifique seu endereço de email em __siteName__","email-verifyEmail-text":"Olá __user__\nPara verificar sua conta de email, clique no link abaixo.\n__url__\nObrigado.","error-board-doesNotExist":"Este quadro não existe","error-board-notAdmin":"Você precisa ser administrador desse quadro para fazer isto","error-board-notAMember":"Você precisa ser um membro desse quadro para fazer isto","error-json-malformed":"Seu texto não é um JSON válido","error-json-schema":"Seu JSON não inclui as informações no formato correto","error-list-doesNotExist":"Esta lista não existe","error-user-doesNotExist":"Este usuário não existe","error-user-notAllowSelf":"Esta ação em você mesmo não é permitida","error-user-notCreated":"Este usuário não foi criado","error-username-taken":"This username is already taken","export-board":"Exportar quadro","filter":"Filtrar","filter-cards":"Filtrar Cartões","filter-clear":"Limpar filtro","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filtro está ativo","filter-on-desc":"Você está filtrando cartões neste quadro. Clique aqui para editar o filtro.","filter-to-selection":"Filtrar esta seleção","fullname":"Nome Completo","header-logo-title":"Voltar para a lista de quadros.","hide-system-messages":"Hide system messages","home":"Início","import":"Importar","import-board":"Importar do Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"No seu quadro do Trello, vá em 'Menu', depois em 'Mais', 'Imprimir e Exportar', 'Exportar JSON', então copie o texto emitido","import-json-placeholder":"Cole seus dados JSON válidos aqui","import-map-members":"Map members","import-members-map":"O seu quadro importado tem alguns membros. Por favor determine os membros que você deseja importar para os usuários Wekan","import-show-user-mapping":"Revisar mapeamento dos membros","import-user-select":"Selecione o usuário Wekan que você gostaria de usar como este membro","importMapMembersAddPopup-title":"Select Wekan member","info":"Informações","initials":"Iniciais","invalid-date":"Invalid date","joined":"juntou-se","just-invited":"Você já foi convidado para este quadro","keyboard-shortcuts":"Atalhos do teclado","label-create":"Criar uma nova etiqueta","label-default":"%s etiqueta (padrão)","label-delete-pop":"Não será possível recuperá-la. A etiqueta será removida de todos os cartões e seu histórico será destruído.","labels":"Etiquetas","language":"Idioma","last-admin-desc":"Você não pode alterar funções porque deve existir pelo menos um administrador.","leave-board":"Sair do Quadro","link-card":"Vincular a este cartão","list-archive-cards":"Arquivar todos os cartões nesta lista","list-archive-cards-pop":"Isto removerá todos os cartões desta lista do quadro. Para visualizar os cartões arquivados e trazê-los de volta para o quadro, clique em “Menu” > “Itens Arquivados”.","list-move-cards":"Mover todos os cartões desta lista","list-select-cards":"Selecionar todos os cartões nesta lista","listActionPopup-title":"Listar Ações","listImportCardPopup-title":"Importe um cartão do Trello","lists":"Listas","log-out":"Sair","log-in":"Entrar","loginPopup-title":"Entrar","memberMenuPopup-title":"Configuração de Membros","members":"Membros","menu":"Menu","move-selection":"Mover seleção","moveCardPopup-title":"Mover Cartão","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Mover seleção","multi-selection":"Multi-Seleção","multi-selection-on":"Multi-seleção está ativo","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Meus Quadros","name":"Nome","no-archived-cards":"Nenhum cartão arquivado","no-archived-lists":"Sem listas arquivadas","no-results":"Nenhum resultado.","normal":"Normal","normal-desc":"Pode ver e editar cartões. Não pode alterar configurações.","not-accepted-yet":"Convite ainda não aceito","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"opcional","or":"ou","page-maybe-private":"Esta página pode ser privada. Você poderá vê-la se estiver <a href='%s'>logado</a>.","page-not-found":"Página não encontrada.","password":"Senha","paste-or-dragdrop":"para colar, ou arraste e solte o arquivo da imagem para ca (somente imagens)","participating":"Participating","preview":"Previsualizar","previewAttachedImagePopup-title":"Previsualizar","previewClipboardImagePopup-title":"Previsualizar","private":"Privado","private-desc":"Este quadro é privado. Apenas seus membros podem acessar e editá-lo.","profile":"Perfil","public":"Público","public-desc":"Este quadro é público. Ele é visível a qualquer pessoa com o link e será exibido em mecanismos de busca como o Google. Apenas seus membros podem editá-lo.","quick-access-description":"Clique na estrela para adicionar um atalho nesta barra.","remove-cover":"Remover Capa","remove-from-board":"Remover do Quadro","remove-label":"Remover Etiqueta","remove-list":"Remove the list","remove-member":"Remover Membro","remove-member-from-card":"Remover do Cartão","remove-member-pop":"Remover __name__ (__username__) de __boardTitle__? O membro será removido de todos os cartões neste quadro e será notificado.","removeMemberPopup-title":"Remover Membro?","rename":"Renomear","rename-board":"Renomear Quadro","restore":"Restaurar","save":"Salvar","search":"Buscar","select-color":"Selecione uma cor","shortcut-assign-self":"Atribuir a si o cartão atual","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Preenchimento automático de membros","shortcut-clear-filters":"Limpar todos filtros","shortcut-close-dialog":"Fechar dialogo","shortcut-filter-my-cards":"Filtrar meus cartões","shortcut-show-shortcuts":"Mostrar lista de atalhos","shortcut-toggle-filterbar":"Alternar barra de filtro","shortcut-toggle-sidebar":"Fechar barra lateral.","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Criar uma Conta","star-board-title":"Clique para marcar este quadro como favorito. Ele aparecerá no topo na lista dos seus quadros.","starred-boards":"Quadros Favoritos","starred-boards-description":"Quadros favoritos aparecem no topo da lista dos seus quadros.","subscribe":"Acompanhar","team":"Equipe","this-board":"este quadro","this-card":"este cartão","time":"Time","title":"Título","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Membro não associado","unsaved-description":"Você possui uma descrição não salva","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Carregar um avatar","uploaded-avatar":"Avatar carregado","username":"Nome de usuário","view-it":"Visualizar","warn-list-archived":"aviso: este cartão está em uma lista arquivada","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"O que você gostaria de fazer?"});
TAPi18n._registerServerTranslator("pt-BR", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ro.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ro.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ro"] = ["Romanian","Română"];
if(_.isUndefined(TAPi18n.translations["ro"])) {
  TAPi18n.translations["ro"] = {};
}

if(_.isUndefined(TAPi18n.translations["ro"][namespace])) {
  TAPi18n.translations["ro"][namespace] = {};
}

_.extend(TAPi18n.translations["ro"][namespace], {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Actions","activities":"Activities","activity":"Activity","activity-added":"added %s to %s","activity-archived":"archived %s","activity-attached":"attached %s to %s","activity-created":"created %s","activity-excluded":"excluded %s from %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"joined %s","activity-moved":"moved %s from %s to %s","activity-on":"on %s","activity-removed":"removed %s from %s","activity-sent":"sent %s to %s","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Add","add-attachment":"Add an attachment","add-board":"Add a new board","add-card":"Add a card","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Add Cover","add-label":"Add the label","add-list":"Add a list","add-members":"Add Members","added":"Added","addMemberPopup-title":"Members","admin":"Admin","admin-desc":"Can view and edit cards, remove members, and change settings for the board.","all-boards":"All boards","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Archive","archive-all":"Archive All","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"Archive this list","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"Archived Items","archives":"Arhive","assign-member":"Assign member","attached":"attached","attachment":"Ataşament","attachment-delete-pop":"Deleting an attachment is permanent. There is no undo.","attachmentDeletePopup-title":"Delete Attachment?","attachments":"Ataşamente","auto-watch":"Automatically watch boards when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"Înapoi","board-change-color":"Change color","board-nb-stars":"%s stars","board-not-found":"Board not found","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"This board will be <strong>public</strong>.","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"Rename Board","boardChangeVisibilityPopup-title":"Change Visibility","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Board Menu","boards":"Boards","bucket-example":"Like “Bucket List” for example","cancel":"Cancel","card-archived":"This card is archived.","card-comments-title":"This card has %s comment.","card-delete-notice":"Deleting is permanent. You will lose all actions associated with this card.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-labels-title":"Change the labels for the card.","card-members-title":"Add or remove members of the board from the card.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"Delete Card?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Members","cardMorePopup-title":"More","cards":"Cards","change":"Change","change-avatar":"Change Avatar","change-password":"Change Password","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"Change Avatar","changeLanguagePopup-title":"Change Language","changePasswordPopup-title":"Change Password","changePermissionsPopup-title":"Change Permissions","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Click to star this board.","click-to-unstar":"Click to unstar this board.","clipboard":"Clipboard or drag & drop","close":"Închide","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Comment","comment-placeholder":"Write a comment","computer":"Computer","create":"Create","createBoardPopup-title":"Create Board","createLabelPopup-title":"Create Label","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"Delete","deleteLabelPopup-title":"Delete Label?","description":"Description","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"Download","edit":"Edit","edit-avatar":"Change Avatar","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Change Label","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Edit Profile","email":"Email","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Filter","filter-cards":"Filter Cards","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"You are filtering cards on this board. Click here to edit filter.","filter-to-selection":"Filter to selection","fullname":"Full Name","header-logo-title":"Go back to your boards page.","hide-system-messages":"Hide system messages","home":"Home","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Infos","initials":"Iniţiale","invalid-date":"Invalid date","joined":"joined","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Create a new label","label-default":"%s label (default)","label-delete-pop":"There is no undo. This will remove this label from all cards and destroy its history.","labels":"Labels","language":"Language","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Leave Board","link-card":"Link to this card","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"List Actions","listImportCardPopup-title":"Import a Trello card","lists":"Liste","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Member Settings","members":"Members","menu":"Meniu","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"My Boards","name":"Nume","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"No results","normal":"Normal","normal-desc":"Can view and edit cards. Can't change settings.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"optional","or":"or","page-maybe-private":"This page may be private. You may be able to view it by <a href='%s'>logging in</a>.","page-not-found":"Page not found.","password":"Parolă","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"Privat","private-desc":"This board is private. Only people added to the board can view and edit it.","profile":"Profil","public":"Public","public-desc":"This board is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the board can edit.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Remove Cover","remove-from-board":"Remove from Board","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"Remove Member","remove-member-from-card":"Remove from Card","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all cards on this board. They will receive a notification.","removeMemberPopup-title":"Remove Member?","rename":"Rename","rename-board":"Rename Board","restore":"Restore","save":"Salvează","search":"Caută","select-color":"Select a color","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Create an Account","star-board-title":"Click to star this board. It will show up at top of your boards list.","starred-boards":"Starred Boards","starred-boards-description":"Starred boards show up at the top of your boards list.","subscribe":"Subscribe","team":"Team","this-board":"this board","this-card":"this card","time":"Time","title":"Titlu","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"Username","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"Ce ai vrea sa faci?"});
TAPi18n._registerServerTranslator("ro", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ru.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/ru.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ru"] = ["Russian","Русский"];
if(_.isUndefined(TAPi18n.translations["ru"])) {
  TAPi18n.translations["ru"] = {};
}

if(_.isUndefined(TAPi18n.translations["ru"][namespace])) {
  TAPi18n.translations["ru"][namespace] = {};
}

_.extend(TAPi18n.translations["ru"][namespace], {"accept":"Принять","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Действия","activities":"История действия","activity":"Активность","activity-added":"добавил %s на %s","activity-archived":"отправил в архив %s","activity-attached":"прикрепил %s к %s","activity-created":"создал %s","activity-excluded":"исключено %s из %s","activity-imported":"импорт %s в %s из %s","activity-imported-board":"импортировано %s из %s","activity-joined":"присоединились %s","activity-moved":"переместил %s из %s на %s","activity-on":"%s","activity-removed":"удалено %s из %s","activity-sent":"отправлено %s в %s","activity-unjoined":"вышел из %s","activity-checklist-added":"added checklist to %s","add":"Создать","add-attachment":"Добавить вложение","add-board":"Создать новую доску","add-card":"Добавить карточку","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Прикрепить","add-label":"Добавить метку","add-list":"Добавить список","add-members":"Добавить пользователя","added":"Добавлено","addMemberPopup-title":"Участники","admin":"Администратор","admin-desc":"Может просматривать и редактировать карточки, удалять участников и управлять настройками доски.","all-boards":"Все доски","and-n-other-card":"И __count__ другая карточка","and-n-other-card_plural":"И __count__ другие карточки","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Архивировать","archive-all":"Архивировать все","archive-board":"Архивировать доску","archive-card":"Архивировать карточку","archive-list":"Архивировать список","archive-selection":"Архивировать выбранное","archiveBoardPopup-title":"Заархивировать доску?","archived-items":"Объекты в архиве","archives":"Архивы","assign-member":"Пригласить пользователя","attached":"прикреплено","attachment":"Вложение","attachment-delete-pop":"Если удалить вложение, его нельзя будет восстановить.","attachmentDeletePopup-title":"Удалить вложение?","attachments":"Вложения","auto-watch":"Automatically watch boards when create it","avatar-too-big":"Аватар слишком большой (максимум 70кб)","back":"Назад","board-change-color":"Изменить цвет","board-nb-stars":"%s избранное","board-not-found":"Доска не найдена","board-private-info":"Это доска будет <strong>частной</strong>.","board-public-info":"Эта доска будет <strong>доступной всем</strong>.","boardChangeColorPopup-title":"Изменить фон доски","boardChangeTitlePopup-title":"Переименовать доску","boardChangeVisibilityPopup-title":"Изменить настройки видимости","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Меню доски","boards":"Доски","bucket-example":"Например “Список дел”","cancel":"Отмена","card-archived":"Эта карточка помещена в архив.","card-comments-title":"Комментарии (%s)","card-delete-notice":"Это действие невозможно будет отменить. Все изменения, которые вы вносили в карточку будут потеряны.","card-delete-pop":"Все действия будут удалены из ленты активности и вы не сможете заново открыть карточку. Действие необратимо","card-delete-suggest-archive":"Вы можете заархивировать карточку, чтобы удалить ее с доски и сохранить активность .","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Изменить вложения","card-edit-labels":"Изменить метку","card-edit-members":"Изменить пользователей","card-labels-title":"Редактировать метки.","card-members-title":"Добавить или удалить участника.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Прикрепить из","cardDeletePopup-title":"Удалить карточку?","cardDetailsActionsPopup-title":"Действия в карточке","cardLabelsPopup-title":"Метки","cardMembersPopup-title":"Участники","cardMorePopup-title":"Поделиться","cards":"Карточки","change":"Изменить","change-avatar":"Изменить аватар","change-password":"Изменить пароль","change-permissions":"Изменить права доступа","change-settings":"Change Settings","changeAvatarPopup-title":"Изменить аватар","changeLanguagePopup-title":"Сменить язык","changePasswordPopup-title":"Изменить пароль","changePermissionsPopup-title":"Изменить настройки доступа","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Добавить в  «Избранное»","click-to-unstar":"Удалить из «Избранного»","clipboard":"Буфер обмена или drag & drop","close":"Закрыть","close-board":"Закрыть доску","close-board-pop":"Вы можете восстановить доску, нажав  “Архивы” в заголовке.","color-black":"черный","color-blue":"синий","color-green":"зеленый","color-lime":"лимоновый","color-orange":"оранджевый","color-pink":"зорозвый","color-purple":"фиолетовый","color-red":"красный","color-sky":"голубой","color-yellow":"желтый","comment":"Отправить","comment-placeholder":"Написать комментарий","computer":"Загрузить с компьютера","create":"Создать","createBoardPopup-title":"Создать доску","createLabelPopup-title":"Создать метку","current":"Текущий","date":"Date","decline":"Понизить","default-avatar":"Стандартный аватар","delete":"Удалить","deleteLabelPopup-title":"Удалить метку?","description":"Описание","disambiguateMultiLabelPopup-title":"Разрешить конфликт меток","disambiguateMultiMemberPopup-title":"Разрешить конфликт пользователей","discard":"Отказать","done":"ГОтово","download":"Скачать","edit":"Редактировать","edit-avatar":"Изменить аватар","edit-profile":"Изменить профиль","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Редактирование метки","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Изменить профиль","email":"Эл.почта","email-enrollAccount-subject":"Аккаунт создан для вас здесь __url__","email-enrollAccount-text":"Привет __user__,\n\nДля того, чтобы начать использовать сервис, просто нажми на ссылку.\n\n__url__\n\nСпасибо.","email-fail":"Email не отправлен","email-invalid":"Неверный адрес электронной почти","email-invite":"Пригласить через Email","email-invite-subject":"__inviter__ прислал вам приглашение","email-invite-text":"Дорогой __user__,\n\n__inviter__ пригласил вас на доску \"__board__\" для сотрудничества.\n\nПожайлуйста проследуйте по ссылке:\n\n__url__\n\nСпасибо.","email-resetPassword-subject":"Перейдите по ссылке, чтобы сбросить пароль __url__","email-resetPassword-text":"Привет __user__,\n\nДля сброса пароля перейдите по ссылке.\n\n__url__\n\nThanks.","email-sent":"Email отправлен","email-verifyEmail-subject":"Подтвердите Email перейдя по ссылке __url__","email-verifyEmail-text":"Привет __user__,\n\nДля подтверждения Email перейдите по ссылке.\n\n__url__\n\nСпасибо.","error-board-doesNotExist":"Доска не найдена","error-board-notAdmin":"Вы должны обладать правами админстратора, чтобы сделать это","error-board-notAMember":"Вы должны быть пользователем доски, чтобы сделать это","error-json-malformed":"Ваше текст не является JSON","error-json-schema":"Содержимое вашего JSON не содержит информацию в корректном формате","error-list-doesNotExist":"Список не найден","error-user-doesNotExist":"Пользователь не найден","error-user-notAllowSelf":"Нельзя выполнить это действие на себе","error-user-notCreated":"Пользователь не создан","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Фильтр","filter-cards":"Фильтр карточек","filter-clear":"Очистить фильтр","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"Показываются карточки, соответствующие настройкам фильтра. Нажмите для редактирования.","filter-to-selection":"Filter to selection","fullname":"Полное имя","header-logo-title":"Вернуться к доскам.","hide-system-messages":"Hide system messages","home":"Главная","import":"Импорт","import-board":"Импорт с Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"На вашей Trello доске нажмите “Menu” - “More” - “Print and export - “Export JSON” и скопируйте полученный текст","import-json-placeholder":"Вставьте JSON сюда","import-map-members":"Map members","import-members-map":"Вы ипортировали доску с пользователями. Пожалуйста, составьте карту пользователей, которых вы хотите импортировать в Wekan пользователей","import-show-user-mapping":"Пересмотреть карту пользователей","import-user-select":"Выберите Wekan-пользователя, которого вы хотите использовать в качестве пользователя","importMapMembersAddPopup-title":"Select Wekan member","info":"Информация","initials":"Инициалы","invalid-date":"Invalid date","joined":"вступил","just-invited":"Вы только пригласили на эту доску","keyboard-shortcuts":"Сочетания клавиш","label-create":"Создать метку","label-default":"%s","label-delete-pop":"Это действие невозможно будет отменить. Метка будет удалена во всех карточках.","labels":"Метки","language":"Язык","last-admin-desc":"Вы не можете изменять роли, для этого требуются права администратора.","leave-board":"Покинуть доску","link-card":"Доступна по ссылке","list-archive-cards":"Архивировать все карточки в этом списке","list-archive-cards-pop":"Это действие переместит все карточки в архив и они перестанут быть видимым на доске. Для просмотра карточек в архиве нажмите “Меню” > “Объекты в архиве”.","list-move-cards":"Переместить все карточки в этом списке","list-select-cards":"Выбрать все карточки в этом списке","listActionPopup-title":"Список действий","listImportCardPopup-title":"Импортировать Trello карточку","lists":"Списки","log-out":"Выйти","log-in":"Войти","loginPopup-title":"Войти","memberMenuPopup-title":"Настройки пользователя","members":"Участники","menu":"Меню","move-selection":"Move selection","moveCardPopup-title":"Переместить карточку","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Выбрать несколько","multi-selection-on":"Выбрать несколько из","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Мои доски","name":"Имя","no-archived-cards":"Нет карточек в архиве.","no-archived-lists":"Нет списков в архиве.","no-results":"Ничего не найдено","normal":"Обычный","normal-desc":"Может редактировать карточки. Не может управлять настройками.","not-accepted-yet":"Приглашение еще не принято","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"не обязательно","or":"или","page-maybe-private":"Возможно, эта страница скрыта от незарегистрированных пользователей. Попробуйте <a href='%s'>войти на сайт</a>.","page-not-found":"Страница не найдена.","password":"Пароль","paste-or-dragdrop":"вставьте, или перетащите файл с изображением сюда (только графический фай)","participating":"Participating","preview":"Предпросмотр","previewAttachedImagePopup-title":"Предпросмотр","previewClipboardImagePopup-title":"Предпросмотр","private":"Закрытая","private-desc":"Эта доска с ограниченным доступом. Только участники могут работать с ней.","profile":"Профиль","public":"Открытая","public-desc":"Эта доска может быть видна всем у кого есть ссылка. Также может быть проиндексирована поисковыми системами. Вносить изменения могут только участники.","quick-access-description":"Нажмите на звезду, что добавить ярлык доски на панель.","remove-cover":"Открепить","remove-from-board":"Удалить с доски","remove-label":"Удалить метку","remove-list":"Remove the list","remove-member":"Удалить участника","remove-member-from-card":"Удалить из карточки","remove-member-pop":"Удалить участника __name__ (__username__) из доски __boardTitle__? Участник будет удален из всех карточек. Также он получит уведомление о совершаемом действии.","removeMemberPopup-title":"Удалить участника?","rename":"Переименовать","rename-board":"Переименовать доску","restore":"Восстановить","save":"Сохранить","search":"Поиск","select-color":"Выбрать цвет","shortcut-assign-self":"Связать себя с текущей карточкой","shortcut-autocomplete-emoji":"Автозаполнение emoji","shortcut-autocomplete-members":"Автозаполнение пользователей","shortcut-clear-filters":"Сбросить все фильтры","shortcut-close-dialog":"Закрыть диалог","shortcut-filter-my-cards":"Показать мои карточки","shortcut-show-shortcuts":"Поднять список ярлыков","shortcut-toggle-filterbar":"Переместить фильтр на бововую панель","shortcut-toggle-sidebar":"Переместить доску на боковую панель","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Создать учетную запись","star-board-title":"Добавить в «Избранное». Эта доска будет всегда на виду.","starred-boards":"Добавленные в «Избранное»","starred-boards-description":"Starred boards show up at the top of your boards list.","subscribe":"Подписаться","team":"Участники","this-board":"эту доску","this-card":"текущая карточка","time":"Time","title":"Название","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Отменить назначение пользователя","unsaved-description":"У вас есть несохраненное описание.","unwatch":"Unwatch","upload":"Загрзуить","upload-avatar":"Загрузить аватар","uploaded-avatar":"Загруженный аватар","username":"Имя пользователя","view-it":"Просмотреть","warn-list-archived":"Внимание: Данная карточка находится в списке архива","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"Что вы хотите сделать?"});
TAPi18n._registerServerTranslator("ru", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sr.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/sr.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["sr"] = ["Serbian","Српски језик"];
if(_.isUndefined(TAPi18n.translations["sr"])) {
  TAPi18n.translations["sr"] = {};
}

if(_.isUndefined(TAPi18n.translations["sr"][namespace])) {
  TAPi18n.translations["sr"][namespace] = {};
}

_.extend(TAPi18n.translations["sr"][namespace], {"accept":"Prihvati","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"Akcije","activities":"Aktivnosti","activity":"Aktivnost","activity-added":"dodao %s u %s","activity-archived":"arhivirao %s","activity-attached":"prikačio %s u %s","activity-created":"kreirao %s","activity-excluded":"izuzmi %s iz %s","activity-imported":"uvezao %s u %s iz %s","activity-imported-board":"uvezao %s iz %s","activity-joined":"spojio %s","activity-moved":"premestio %s iz %s u %s","activity-on":"na %s","activity-removed":"uklonio %s iz %s","activity-sent":"poslao %s %s-u","activity-unjoined":"rastavio %s","activity-checklist-added":"added checklist to %s","add":"Dodaj","add-attachment":"Dodaj dokument","add-board":"Dodaj novu tablu","add-card":"Dodaj karticu","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Dodaj zaglavlje","add-label":"Dodaj natpis","add-list":"Dodaj listu","add-members":"Dodaj Članove","added":"Dodao","addMemberPopup-title":"Članovi","admin":"Administrator","admin-desc":"Može da pregleda i menja kartice, uklanja članove i menja podešavanja table","all-boards":"Sve table","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Primeni","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Arhiviraj","archive-all":"Arhiviraj sve","archive-board":"Arhiviraj tablu","archive-card":"Arhiviraj karticu","archive-list":"Arhiviraj ovu listu","archive-selection":"Arhiviraj izabrano","archiveBoardPopup-title":"Da arhiviram tablu ?","archived-items":"Arhivirane stavke","archives":"Arhive","assign-member":"Dodeli člana","attached":"Prikačeno","attachment":"Prikačeni dokument","attachment-delete-pop":"Brisanje prikačenog dokumenta je trajno. Ne postoji vraćanje obrisanog.","attachmentDeletePopup-title":"Obrisati prikačeni dokument ?","attachments":"Prikačeni dokumenti","auto-watch":"Automatically watch boards when create it","avatar-too-big":"Avatar je prevelik (maksimum je 70Kb)","back":"Nazad","board-change-color":"Promeni boju","board-nb-stars":"%s zvezdice","board-not-found":"Tabla nije pronađena","board-private-info":"Ova tabla će biti <strong>privatna<strong>.","board-public-info":"Ova tabla će biti <strong>javna<strong>.","boardChangeColorPopup-title":"Promeni pozadinu table","boardChangeTitlePopup-title":"Preimenuj tablu","boardChangeVisibilityPopup-title":"Promeni Vidljivost","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Meni table","boards":"Table","bucket-example":"Na primer \"Lista zadataka\"","cancel":"Otkaži","card-archived":"Ova kartica je arhivirana","card-comments-title":"Ova kartica ima %s komentar.","card-delete-notice":"Brisanje je trajno. Izgubićeš sve akcije povezane sa ovom karticom.","card-delete-pop":"Sve akcije će biti uklonjene sa liste aktivnosti i kartica neće moći biti ponovo otvorena. Nema vraćanja unazad.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Krajnji datum","card-due-on":"Završava se","card-edit-attachments":"Uredi priloge","card-edit-labels":"Uredi natpise","card-edit-members":"Uredi članove","card-labels-title":"Promeni natpis na kartici.","card-members-title":"Dodaj ili ukloni članove table sa kartice.","card-start":"Početak","card-start-on":"Počinje","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"Delete Card?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Labels","cardMembersPopup-title":"Članovi","cardMorePopup-title":"More","cards":"Cards","change":"Change","change-avatar":"Change Avatar","change-password":"Change Password","change-permissions":"Change permissions","change-settings":"Izmeni podešavanja","changeAvatarPopup-title":"Change Avatar","changeLanguagePopup-title":"Change Language","changePasswordPopup-title":"Change Password","changePermissionsPopup-title":"Change Permissions","changeSettingsPopup-title":"Izmeni podešavanja","checklists":"Checklists","click-to-star":"Click to star this board.","click-to-unstar":"Click to unstar this board.","clipboard":"Clipboard or drag & drop","close":"Close","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Comment","comment-placeholder":"Write a comment","computer":"Computer","create":"Create","createBoardPopup-title":"Create Board","createLabelPopup-title":"Create Label","current":"current","date":"Datum","decline":"Decline","default-avatar":"Default avatar","delete":"Delete","deleteLabelPopup-title":"Delete Label?","description":"Description","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"Download","edit":"Edit","edit-avatar":"Change Avatar","edit-profile":"Edit Profile","editCardStartDatePopup-title":"Izmeni početni datum","editCardDueDatePopup-title":"Izmeni krajnji datum","editLabelPopup-title":"Change Label","editNotificationPopup-title":"Izmeni notifikaciju","editProfilePopup-title":"Edit Profile","email":"Email","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"Korisničko ime je već zauzeto","export-board":"Export board","filter":"Filter","filter-cards":"Filter Cards","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"Nema člana","filter-on":"Filter is on","filter-on-desc":"You are filtering cards on this board. Click here to edit filter.","filter-to-selection":"Filter to selection","fullname":"Full Name","header-logo-title":"Go back to your boards page.","hide-system-messages":"Sakrij sistemske poruke","home":"Home","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Mapiraj članove","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Izaberi člana Wekan-a","info":"Infos","initials":"Initials","invalid-date":"Neispravan datum","joined":"joined","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Create a new label","label-default":"%s label (default)","label-delete-pop":"There is no undo. This will remove this label from all cards and destroy its history.","labels":"Labels","language":"Language","last-admin-desc":"You can’t change roles because there must be at least one admin.","leave-board":"Leave Board","link-card":"Link to this card","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"List Actions","listImportCardPopup-title":"Import a Trello card","lists":"Lists","log-out":"Log Out","log-in":"Log In","loginPopup-title":"Log In","memberMenuPopup-title":"Member Settings","members":"Članovi","menu":"Menu","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Premesti na dno","moveCardToTop-title":"Premesti na vrh","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Utišano","muted-info":"You will never be notified of any changes in this board","my-boards":"My Boards","name":"Name","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"Nema rezultata","normal":"Normalno","normal-desc":"Can view and edit cards. Can't change settings.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"opciono","or":"ili","page-maybe-private":"This page may be private. You may be able to view it by <a href='%s'>logging in</a>.","page-not-found":"Stranica nije pronađena.","password":"Lozinka","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Učestvujem","preview":"Prikaz","previewAttachedImagePopup-title":"Prikaz","previewClipboardImagePopup-title":"Prikaz","private":"Privatno","private-desc":"This board is private. Only people added to the board can view and edit it.","profile":"Profil","public":"Javno","public-desc":"This board is public. It's visible to anyone with the link and will show up in search engines like Google. Only people added to the board can edit.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Remove Cover","remove-from-board":"Ukloni iz table","remove-label":"Ukloni natpis","remove-list":"Ukloni listu","remove-member":"Ukloni člana","remove-member-from-card":"Ukloni iz kartice","remove-member-pop":"Remove __name__ (__username__) from __boardTitle__? The member will be removed from all cards on this board. They will receive a notification.","removeMemberPopup-title":"Ukloni člana ?","rename":"Preimenuj","rename-board":"Preimenuj tablu","restore":"Oporavi","save":"Snimi","search":"Pretraga","select-color":"Izaberi boju","shortcut-assign-self":"Pridruži sebe trenutnoj kartici","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Sam popuni članove","shortcut-clear-filters":"Očisti sve filtere","shortcut-close-dialog":"Zatvori dijalog","shortcut-filter-my-cards":"Filtriraj kartice","shortcut-show-shortcuts":"Prikaži ovu listu prečica","shortcut-toggle-filterbar":"Uključi ili isključi bočni meni filtera","shortcut-toggle-sidebar":"Uključi ili isključi bočni meni table","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Kreiraj nalog","star-board-title":"Klikni da označiš zvezdicom ovu tablu. Pokazaće se na vrhu tvoje liste tabli.","starred-boards":"Table sa zvezdicom","starred-boards-description":"Table sa zvezdicom se pokazuju na vrhu liste tabli.","subscribe":"Pretplati se","team":"Tim","this-board":"ova tabla","this-card":"ova kartica","time":"Vreme","title":"Naslov","tracking":"Praćenje","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"Imaš nesnimljen opis.","unwatch":"Ne posmatraj","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"Korisničko ime","view-it":"Pregledaj je","warn-list-archived":"upozorenje: ova kartica je u arhiviranoj listi","watch":"Posmatraj","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Osnove","welcome-list2":"Napredno","what-to-do":"Šta želiš da uradiš ?"});
TAPi18n._registerServerTranslator("sr", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tr.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/tr.i18n.json                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["tr"] = ["Turkish","Türkçe"];
if(_.isUndefined(TAPi18n.translations["tr"])) {
  TAPi18n.translations["tr"] = {};
}

if(_.isUndefined(TAPi18n.translations["tr"][namespace])) {
  TAPi18n.translations["tr"][namespace] = {};
}

_.extend(TAPi18n.translations["tr"][namespace], {"accept":"Accept","act-activity-notify":"[Wekan] Activity Notification","act-addAttachment":"attached __attachment__ to __card__","act-addComment":"commented on __card__: __comment__","act-createBoard":"created __board__","act-createCard":"added __card__ to __list__","act-createList":"added __list__ to __board__","act-addBoardMember":"added __member__ to __board__","act-archivedBoard":"archived __board__","act-archivedCard":"archived __card__","act-archivedList":"archived __list__","act-importBoard":"imported __board__","act-importCard":"imported __card__","act-importList":"imported __list__","act-joinMember":"added __member__ to __card__","act-moveCard":"moved __card__ from __oldList__ to __list__","act-removeBoardMember":"removed __member__ from __board__","act-restoredCard":"restored __card__ to __board__","act-unjoinMember":"removed __member__ from __card__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"İşlemler","activities":"Aktiviteler","activity":"Etkinlik","activity-added":"added %s to %s","activity-archived":"%s arşivledi","activity-attached":"attached %s to %s","activity-created":"%s oluşturdu","activity-excluded":"excluded %s from %s","activity-imported":"imported %s into %s from %s","activity-imported-board":"imported %s from %s","activity-joined":"joined %s","activity-moved":"moved %s from %s to %s","activity-on":"on %s","activity-removed":"removed %s from %s","activity-sent":"sent %s to %s","activity-unjoined":"unjoined %s","activity-checklist-added":"added checklist to %s","add":"Ekle","add-attachment":"Add an attachment","add-board":"Yeni bir pano ekle","add-card":"Add a card","add-checklist":"Add a checklist","add-checklist-item":"Add an item to checklist","add-cover":"Add Cover","add-label":"Add the label","add-list":"Add a list","add-members":"Add Members","added":"Eklendi","addMemberPopup-title":"Üyeler","admin":"Yönetici","admin-desc":"Kartları görüntüler ve düzenler, üyeleri çıkarır ve pano ayarlarını değiştirir.","all-boards":"All boards","and-n-other-card":"And __count__ other card","and-n-other-card_plural":"And __count__ other cards","apply":"Apply","app-is-offline":"The application is currently offline, refreshing the page will cause data loss.","archive":"Arşiv","archive-all":"Tümünü Arşivle","archive-board":"Archive Board","archive-card":"Archive Card","archive-list":"Bu listeyi arşivle","archive-selection":"Archive selection","archiveBoardPopup-title":"Archive Board?","archived-items":"Arşivlenmiş Öğeler","archives":"Arşiv","assign-member":"Assign member","attached":"dosya eklendi","attachment":"Ek Dosya","attachment-delete-pop":"Ek dosya silme işlemi kalıcıdır. Geri dönüşü yok","attachmentDeletePopup-title":"Ek Dosya Silinsin Mi?","attachments":"Ek Dosyalar","auto-watch":"Automatically watch boards when create it","avatar-too-big":"The avatar is too large (70Kb max)","back":"Geri","board-change-color":"Change color","board-nb-stars":"%s stars","board-not-found":"Pano bulunamadı","board-private-info":"This board will be <strong>private</strong>.","board-public-info":"Bu pano <strong>genel</strong>e açılacaktır.","boardChangeColorPopup-title":"Change Board Background","boardChangeTitlePopup-title":"Pano Adı Değiştirme","boardChangeVisibilityPopup-title":"Görünebilirliği Değiştir","boardChangeWatchPopup-title":"Change Watch","boardMenuPopup-title":"Board Menu","boards":"Panolar","bucket-example":"Like “Bucket List” for example","cancel":"İptal","card-archived":"Bu kart arşivlendi.","card-comments-title":"This card has %s comment.","card-delete-notice":"Silme işlemi kalıcıdır. Bu kartla ilişkili tüm eylemleri kaybedersiniz.","card-delete-pop":"All actions will be removed from the activity feed and you won't be able to re-open the card. There is no undo.","card-delete-suggest-archive":"You can archive a card to remove it from the board and preserve the activity.","card-due":"Due","card-due-on":"Due on","card-edit-attachments":"Edit attachments","card-edit-labels":"Edit labels","card-edit-members":"Edit members","card-labels-title":"Change the labels for the card.","card-members-title":"Add or remove members of the board from the card.","card-start":"Start","card-start-on":"Starts on","cardAttachmentsPopup-title":"Attach From","cardDeletePopup-title":"Kart Silinsin mi?","cardDetailsActionsPopup-title":"Card Actions","cardLabelsPopup-title":"Etiketler","cardMembersPopup-title":"Üyeler","cardMorePopup-title":"More","cards":"Cards","change":"Change","change-avatar":"Avatar Değiştir","change-password":"Parola Değiştir","change-permissions":"Change permissions","change-settings":"Change Settings","changeAvatarPopup-title":"Avatar Değiştir","changeLanguagePopup-title":"Dil Değiştir","changePasswordPopup-title":"Parola Değiştir","changePermissionsPopup-title":"Yetkileri Değiştirme","changeSettingsPopup-title":"Change Settings","checklists":"Checklists","click-to-star":"Bu panoyu yıldızlamak için tıkla.","click-to-unstar":"Bu panunun yıldızını kaldırmak için tıkla.","clipboard":"Clipboard or drag & drop","close":"Kapat","close-board":"Close Board","close-board-pop":"You will be able to restore the board by clicking the “Archives” button from the home header.","color-black":"black","color-blue":"blue","color-green":"green","color-lime":"lime","color-orange":"orange","color-pink":"pink","color-purple":"purple","color-red":"red","color-sky":"sky","color-yellow":"yellow","comment":"Yorum Gönder","comment-placeholder":"Write a comment","computer":"Bilgisayar","create":"Oluştur","createBoardPopup-title":"Pano Oluşturma","createLabelPopup-title":"Etiket Oluşturma","current":"current","date":"Date","decline":"Decline","default-avatar":"Default avatar","delete":"Sil","deleteLabelPopup-title":"Etiket Silinsin mi?","description":"Açıklama","disambiguateMultiLabelPopup-title":"Disambiguate Label Action","disambiguateMultiMemberPopup-title":"Disambiguate Member Action","discard":"Discard","done":"Done","download":"İndir","edit":"Düzenle","edit-avatar":"Avatar Değiştir","edit-profile":"Profili Düzenle","editCardStartDatePopup-title":"Change start date","editCardDueDatePopup-title":"Change due date","editLabelPopup-title":"Etiket Değiştirme","editNotificationPopup-title":"Edit Notification","editProfilePopup-title":"Profili Düzenle","email":"E-posta","email-enrollAccount-subject":"An account created for you on __siteName__","email-enrollAccount-text":"Hello __user__,\n\nTo start using the service, simply click the link below.\n\n__url__\n\nThanks.","email-fail":"Sending email failed","email-invalid":"Invalid email","email-invite":"Invite via Email","email-invite-subject":"__inviter__ sent you an invitation","email-invite-text":"Dear __user__,\n\n__inviter__ invites you to join board \"__board__\" for collaborations.\n\nPlease follow the link below:\n\n__url__\n\nThanks.","email-resetPassword-subject":"Reset your password on __siteName__","email-resetPassword-text":"Hello __user__,\n\nTo reset your password, simply click the link below.\n\n__url__\n\nThanks.","email-sent":"Email sent","email-verifyEmail-subject":"Verify your email address on __siteName__","email-verifyEmail-text":"Hello __user__,\n\nTo verify your account email, simply click the link below.\n\n__url__\n\nThanks.","error-board-doesNotExist":"This board does not exist","error-board-notAdmin":"You need to be admin of this board to do that","error-board-notAMember":"You need to be a member of this board to do that","error-json-malformed":"Your text is not valid JSON","error-json-schema":"Your JSON data does not include the proper information in the correct format","error-list-doesNotExist":"This list does not exist","error-user-doesNotExist":"This user does not exist","error-user-notAllowSelf":"This action on self is not allowed","error-user-notCreated":"This user is not created","error-username-taken":"This username is already taken","export-board":"Export board","filter":"Filter","filter-cards":"Kartları Süz","filter-clear":"Clear filter","filter-no-label":"No label","filter-no-member":"No member","filter-on":"Filter is on","filter-on-desc":"Bu panodaki kartları süzüyorsunuz. Süzgeci düzenlemek için tıklayın.","filter-to-selection":"Filter to selection","fullname":"Ad Soyad","header-logo-title":"Panolar sayfanıza geri dön.","hide-system-messages":"Hide system messages","home":"Home","import":"Import","import-board":"import from Trello","import-board-title":"Import board from Trello","import-board-trello-instruction":"In your Trello board, go to 'Menu', then 'More', 'Print and Export', 'Export JSON', and copy the resulting text","import-json-placeholder":"Paste your valid JSON data here","import-map-members":"Map members","import-members-map":"Your imported board has some members. Please map the members you want to import to Wekan users","import-show-user-mapping":"Review members mapping","import-user-select":"Pick the Wekan user you want to use as this member","importMapMembersAddPopup-title":"Select Wekan member","info":"Infos","initials":"Initials","invalid-date":"Invalid date","joined":"joined","just-invited":"You are just invited to this board","keyboard-shortcuts":"Keyboard shortcuts","label-create":"Yeni bir etiket oluştur","label-default":"%s etiket (varsayılan)","label-delete-pop":"Geri dönüşü yok. Tüm kartlardan bu etiket kaldırılacaktır ve geçmişini yok edecektir.","labels":"Etiketler","language":"Dil","last-admin-desc":"Rolleri değiştiremezsiniz çünkü burada en az bir yönetici olmalıdır.","leave-board":"Leave Board","link-card":"Bu kartın bağlantısı","list-archive-cards":"Archive all cards in this list","list-archive-cards-pop":"This will remove all the cards in this list from the board. To view archived cards and bring them back to the board, click “Menu” > “Archived Items”.","list-move-cards":"Move all cards in this list","list-select-cards":"Select all cards in this list","listActionPopup-title":"Liste İşlemleri","listImportCardPopup-title":"Import a Trello card","lists":"Lists","log-out":"Oturum Kapat","log-in":"Oturum Aç","loginPopup-title":"Oturum Aç","memberMenuPopup-title":"Member Settings","members":"Üyeler","menu":"Menü","move-selection":"Move selection","moveCardPopup-title":"Move Card","moveCardToBottom-title":"Move to Bottom","moveCardToTop-title":"Move to Top","moveSelectionPopup-title":"Move selection","multi-selection":"Multi-Selection","multi-selection-on":"Multi-Selection is on","muted":"Muted","muted-info":"You will never be notified of any changes in this board","my-boards":"Panolarım","name":"Adı","no-archived-cards":"No archived cards.","no-archived-lists":"No archived lists.","no-results":"Sonuç yok","normal":"Normal","normal-desc":"Kartları görüntüler ve düzenler. Ayarları değiştiremez.","not-accepted-yet":"Invitation not accepted yet","notify-participate":"Receive updates to any cards you participate as creater or member","notify-watch":"Receive updates to any boards, lists, or cards you’re watching","optional":"isteğe bağlı","or":"or","page-maybe-private":"Bu sayfa özel olabilir. <a href='%s'>Oturum açarak</a> görülebilir.","page-not-found":"Sayda bulunamadı.","password":"Parola","paste-or-dragdrop":"to paste, or drag & drop image file to it (image only)","participating":"Participating","preview":"Preview","previewAttachedImagePopup-title":"Preview","previewClipboardImagePopup-title":"Preview","private":"Özel","private-desc":"Bu pano özel. Sadece panoya ekli kişiler görüntüleyebilir ve düzenleyebilir.","profile":"Kullanıcı Sayfası","public":"Genel","public-desc":"Bu pano genel. Bağlantı adresi ile herhangi bir kimseye görünür ve Google gibi arama motorlarında gösterilecektir. Panoyu, sadece eklenen kişiler düzenleyebilir.","quick-access-description":"Star a board to add a shortcut in this bar.","remove-cover":"Remove Cover","remove-from-board":"Remove from Board","remove-label":"Remove the label","remove-list":"Remove the list","remove-member":"Üyeyi Çıkar","remove-member-from-card":"Karttan Çıkar","remove-member-pop":"__boardTitle__ panosundan __name__ (__username__) çıkarılsın mı? Üye, bu panodaki tüm kartlardan çıkarılacak ve bir bildirim alacak.","removeMemberPopup-title":"Üyeyi Çıkarmak mı?","rename":"Ad değiştir","rename-board":"Pano Adı Değiştirme","restore":"Restore","save":"Kaydet","search":"Search","select-color":"Bir renk seç","shortcut-assign-self":"Assign yourself to current card","shortcut-autocomplete-emoji":"Autocomplete emoji","shortcut-autocomplete-members":"Autocomplete members","shortcut-clear-filters":"Clear all filters","shortcut-close-dialog":"Close Dialog","shortcut-filter-my-cards":"Filter my cards","shortcut-show-shortcuts":"Bring up this shortcuts list","shortcut-toggle-filterbar":"Toggle Filter Sidebar","shortcut-toggle-sidebar":"Toggle Board Sidebar","show-cards-minimum-count":"Show cards count if list contains more than","signupPopup-title":"Bir Hesap Oluştur","star-board-title":"Bu panoyu yıldızlamak için tıkla. Pano listesinin en üstünde gösterilir.","starred-boards":"Yıldızlı Panolar","starred-boards-description":"Yıldızlanmış panolar, pano listenin en üstünde gösterilir.","subscribe":"Subscribe","team":"Takım","this-board":"bu panoyu","this-card":"bu kart","time":"Time","title":"Başlık","tracking":"Tracking","tracking-info":"You will be notified of any changes to those cards you are involved as creator or member.","unassign-member":"Unassign member","unsaved-description":"You have an unsaved description.","unwatch":"Unwatch","upload":"Upload","upload-avatar":"Upload an avatar","uploaded-avatar":"Uploaded an avatar","username":"Kullanıcı adı","view-it":"View it","warn-list-archived":"warning: this card is in an archived list","watch":"Watch","watching":"Watching","watching-info":"You will be notified of any change in this board","welcome-board":"Welcome Board","welcome-list1":"Basics","welcome-list2":"Advanced","what-to-do":"What do you want to do?"});
TAPi18n._registerServerTranslator("tr", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"zh-CN.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/zh-CN.i18n.json                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["zh-CN"] = ["Chinese (China)","简体中文"];
if(_.isUndefined(TAPi18n.translations["zh-CN"])) {
  TAPi18n.translations["zh-CN"] = {};
}

if(_.isUndefined(TAPi18n.translations["zh-CN"][namespace])) {
  TAPi18n.translations["zh-CN"][namespace] = {};
}

_.extend(TAPi18n.translations["zh-CN"][namespace], {"accept":"接受","act-activity-notify":"[Wekan] 活动通知","act-addAttachment":"添加附件 __attachment__ 至卡片 __card__","act-addComment":"在 __card__ 发布评论: __comment__","act-createBoard":"创建看板 __board__","act-createCard":"添加卡片 __card__  至列表 __list__","act-createList":"添加列表 __list__  至看板 __board__","act-addBoardMember":"添加成员 __member__  至看板 __board__","act-archivedBoard":"归档看板 __board__","act-archivedCard":"归档卡片 __card__","act-archivedList":"归档列表 __list__","act-importBoard":"导入看板 __board__","act-importCard":"导入卡片 __card__","act-importList":"导入列表 __list__","act-joinMember":"添加成员 __member__  至卡片 __card__","act-moveCard":"从列表 __oldList__  移动卡片 __card__  至列表 __list__","act-removeBoardMember":"从看板 __board__ 移除成员 __member__","act-restoredCard":"恢复卡片 __card__  至看板 __board__","act-unjoinMember":"从卡片 __card__ 移除成员 __member__","act-withBoardTitle":"[Wekan] 看板 __board__","act-withCardTitle":"[看板 __board__] 卡片 __card__","actions":"操作","activities":"活动","activity":"活动","activity-added":"添加 %s 至 %s","activity-archived":"归档 %s","activity-attached":"添加附件 %s 至 %s","activity-created":"创建 %s","activity-excluded":"排除 %s 从 %s","activity-imported":"导入 %s 至 %s 从 %s 中","activity-imported-board":"已导入 %s 从 %s 中","activity-joined":"已关联 %s","activity-moved":"将 %s 从 %s 移动到 %s","activity-on":"在 %s","activity-removed":"从 %s 中移除 %s","activity-sent":"发送 %s 至 %s","activity-unjoined":"已解除 %s 关联","activity-checklist-added":"已经将清单添加到 %s","add":"添加","add-attachment":"添加附件","add-board":"添加新看板","add-card":"添加卡片","add-checklist":"添加清单","add-checklist-item":"扩充清单","add-cover":"添加封面","add-label":"添加标签","add-list":"添加清单","add-members":"添加成员","added":"添加","addMemberPopup-title":"成员","admin":"管理员","admin-desc":"可以浏览并编辑卡片，移除成员，并且更改该看板的设置","all-boards":"全部看板","and-n-other-card":"和其他 __count__ 个卡片","and-n-other-card_plural":"和其他 __count__ 个卡片","apply":"应用","app-is-offline":"处于离线状态，刷新页面将导致数据丢失。","archive":"归档","archive-all":"全部归档","archive-board":"归档看板","archive-card":"归档卡片","archive-list":"归档该清单","archive-selection":"归档所选内容","archiveBoardPopup-title":"确定要归档看板吗？","archived-items":"已归档项目","archives":"回收箱","assign-member":"分配成员","attached":"附加","attachment":"附件","attachment-delete-pop":"删除附件的操作不可逆。","attachmentDeletePopup-title":"删除附件？","attachments":"附件","auto-watch":"创建看板时自动关注","avatar-too-big":"头像太大 (最大 70 Kb)","back":"返回","board-change-color":"更改颜色","board-nb-stars":"%s 星标","board-not-found":"看板不存在","board-private-info":"该看板将被设为 <strong>私有</strong>.","board-public-info":"该看板将被设为 <strong>公开</strong>.","boardChangeColorPopup-title":"修改看板背景","boardChangeTitlePopup-title":"重命名看板","boardChangeVisibilityPopup-title":"更改可视级别","boardChangeWatchPopup-title":"更改关注状态","boardMenuPopup-title":"看板菜单","boards":"看板","bucket-example":"例如 “目标清单”","cancel":"取消","card-archived":"该卡片已被归档","card-comments-title":"该卡片有 %s 条评论","card-delete-notice":"彻底删除的操作不可恢复，你将会丢失该卡片相关的所有操作记录。","card-delete-pop":"所有的动作将从活动动态中被移除且您将无法重新打开该卡片。此操作无法撤销。","card-delete-suggest-archive":"你可以将卡片从看板中归档至回收箱，但保留相关活动。","card-due":"到期","card-due-on":"期限","card-edit-attachments":"编辑附件","card-edit-labels":"编辑标签","card-edit-members":"编辑成员","card-labels-title":"更改该卡片上的标签","card-members-title":"在该卡片中添加或移除看板成员","card-start":"开始","card-start-on":"始于","cardAttachmentsPopup-title":"附件来源","cardDeletePopup-title":"彻底删除卡片？","cardDetailsActionsPopup-title":"卡片动作","cardLabelsPopup-title":"标签","cardMembersPopup-title":"成员","cardMorePopup-title":"更多","cards":"卡片","change":"变更","change-avatar":"更改头像","change-password":"更改密码","change-permissions":"更改权限","change-settings":"更改设置","changeAvatarPopup-title":"更改头像","changeLanguagePopup-title":"更改语言","changePasswordPopup-title":"更改密码","changePermissionsPopup-title":"更改权限","changeSettingsPopup-title":"更改设置","checklists":"清单","click-to-star":"点此来标记该看板","click-to-unstar":"点此来去除该看板的标记","clipboard":"剪贴板或者拖放文件","close":"关闭","close-board":"关闭看板","close-board-pop":"您可以通过点击主界面顶部的”回收箱“按钮来还原看板。","color-black":"黑色","color-blue":"蓝色","color-green":"绿色","color-lime":"绿黄","color-orange":"橙色","color-pink":"粉红","color-purple":"紫色","color-red":"红色","color-sky":"天蓝","color-yellow":"黄色","comment":"评论","comment-placeholder":"添加评论","computer":"从本机上传","create":"创建","createBoardPopup-title":"创建看板","createLabelPopup-title":"创建标签","current":"当前","date":"日期","decline":"拒绝","default-avatar":"默认头像","delete":"删除","deleteLabelPopup-title":"删除标签？","description":"描述","disambiguateMultiLabelPopup-title":"消除标签动作歧义","disambiguateMultiMemberPopup-title":"消除会员动作歧义","discard":"放弃","done":"完成","download":"下载","edit":"编辑","edit-avatar":"更改头像","edit-profile":"编辑资料","editCardStartDatePopup-title":"修改起始日期","editCardDueDatePopup-title":"修改截止日期","editLabelPopup-title":"更改标签","editNotificationPopup-title":"编辑通知","editProfilePopup-title":"编辑资料","email":"邮箱","email-enrollAccount-subject":"已为您在 __siteName__ 创建帐号","email-enrollAccount-text":"尊敬的 __user__,\n\n点击下面的链接，即刻开始使用这项服务。\n\n__url__\n\n谢谢。","email-fail":"邮件发送失败","email-invalid":"邮件地址错误","email-invite":"发送邮件邀请","email-invite-subject":"__inviter__ 向您发出邀请","email-invite-text":"尊敬的 __user__,\n\n__inviter__ 邀请您加入看板 \"__board__\" 参与协作。\n\n请点击下面的链接访问看板：\n\n__url__\n\n谢谢。","email-resetPassword-subject":"重置您的 __siteName__ 密码","email-resetPassword-text":"尊敬的 __user__,\n\n点击下面的链接，重置您的密码：\n\n__url__\n\n谢谢。","email-sent":"邮件已发送","email-verifyEmail-subject":"在 __siteName__ 验证您的邮件地址","email-verifyEmail-text":"尊敬的 __user__,\n\n点击下面的链接，验证您的邮件地址：\n\n__url__\n\n谢谢。","error-board-doesNotExist":"该看板不存在","error-board-notAdmin":"需要成为管理员才能执行此操作","error-board-notAMember":"需要成为看板成员才能执行此操作","error-json-malformed":"文本不是合法的 JSON","error-json-schema":"JSON 数据没有用正确的格式包含合适的信息","error-list-doesNotExist":"不存在此列表","error-user-doesNotExist":"该用户不存在","error-user-notAllowSelf":"不允许对自己执行此操作","error-user-notCreated":"该用户未能成功创建","error-username-taken":"此用户名已存在","export-board":"导出看板","filter":"过滤","filter-cards":"过滤卡片","filter-clear":"清空过滤器","filter-no-label":"无标签","filter-no-member":"无成员","filter-on":"过滤器启用","filter-on-desc":"你正在过滤该看板上的卡片，点此编辑过滤。","filter-to-selection":"要选择的过滤器","fullname":"全称","header-logo-title":"返回您的看板页","hide-system-messages":"隐藏系统消息","home":"首页","import":"导入","import-board":"从 Trello 导入","import-board-title":"从Trello导入看板","import-board-trello-instruction":"在你的Trello看板中，点击“菜单”，然后选择“更多”，“打印与导出”，“导出为 JSON” 并拷贝结果文本","import-json-placeholder":"粘贴您有效的 JSON 数据至此","import-map-members":"映射成员","import-members-map":"您导入的看板有一些成员。请将您想导入的成员映射到 Wekan 用户。","import-show-user-mapping":"核对成员映射","import-user-select":"选择您想将此成员映射到的 Wekan 用户","importMapMembersAddPopup-title":"选择Wekan成员","info":"信息","initials":"缩写","invalid-date":"无效日期","joined":"关联","just-invited":"您刚刚被邀请加入此看板","keyboard-shortcuts":"键盘快捷键","label-create":"创建新标签","label-default":"%s 标签 (默认)","label-delete-pop":"此操作不可逆，这将会删除该标签并清除它的历史记录。","labels":"标签","language":"语言","last-admin-desc":"你不能更改角色，因为至少需要一名管理员。","leave-board":"离开看板","link-card":"关联至该卡片","list-archive-cards":"归档清单中的所有卡片","list-archive-cards-pop":"这将会从本看板中移除该清单中的所有卡片。如果需要浏览已归档的卡片并且将其恢复至看板，请点击\"菜单\">\"回收箱\"","list-move-cards":"移动清单中的所有卡片","list-select-cards":"选择清单中的所有卡片","listActionPopup-title":"清单操作","listImportCardPopup-title":"导入 Trello 卡片","lists":"清单","log-out":"登出","log-in":"登录","loginPopup-title":"登录","memberMenuPopup-title":"成员设置","members":"成员","menu":"菜单","move-selection":"移动选择","moveCardPopup-title":"移动卡片","moveCardToBottom-title":"移动至底端","moveCardToTop-title":"移动至顶端","moveSelectionPopup-title":"移动选择","multi-selection":"多选","multi-selection-on":"多选启用","muted":"静默","muted-info":"你将不会收到此看板的任何变更通知","my-boards":"我的看板","name":"名称","no-archived-cards":"没有已归档的卡片","no-archived-lists":"没有已归档的清单","no-results":"无结果","normal":"普通","normal-desc":"可以创建以及编辑卡片，无法更改设置。","not-accepted-yet":"邀请尚未接受","notify-participate":"接收以创建者或成员身份参与的卡片的更新","notify-watch":"接收所有关注的面板、列表、及卡片的更新","optional":"可选","or":"或","page-maybe-private":"本页面被设为私有. 您必须 <a href='%s'>登录</a>以浏览其中内容。","page-not-found":"页面不存在。","password":"密码","paste-or-dragdrop":"从剪贴板粘贴，或者拖放文件到它上面 (仅限于图片)","participating":"参与","preview":"预览","previewAttachedImagePopup-title":"预览","previewClipboardImagePopup-title":"预览","private":"私有","private-desc":"该看板将被设为私有。只有该看板成员才可以进行查看和编辑。","profile":"资料","public":"公开","public-desc":"该看板将被公开。任何人均可通过链接查看，并且将对Google和其他搜索引擎开放。只有添加至该看板的成员才可进行编辑。","quick-access-description":"星标看板在导航条中添加快捷方式","remove-cover":"移除封面","remove-from-board":"从看板中删除","remove-label":"移除标签","remove-list":"删除清单","remove-member":"移除成员","remove-member-from-card":"从该卡片中移除","remove-member-pop":"确定从 __boardTitle__ 中移除 __name__ (__username__) 吗? 该成员将被从该看板的所有卡片中移除，同时他会收到一条提醒。","removeMemberPopup-title":"删除成员？","rename":"重命名","rename-board":"重命名看板","restore":"还原","save":"保存","search":"搜索","select-color":"选择颜色","shortcut-assign-self":"分配当前卡片给自己","shortcut-autocomplete-emoji":"表情符号自动补全","shortcut-autocomplete-members":"自动补全成员","shortcut-clear-filters":"清空全部过滤器","shortcut-close-dialog":"关闭对话框","shortcut-filter-my-cards":"过滤我的卡片","shortcut-show-shortcuts":"显示此快捷键列表","shortcut-toggle-filterbar":"切换过滤器边栏","shortcut-toggle-sidebar":"切换面板边栏","show-cards-minimum-count":"当列表中的卡片多于此阈值时将显示数量","signupPopup-title":"创建账户","star-board-title":"点此来标记该看板，它将会出现在您的看板列表顶部。","starred-boards":"已标记看板","starred-boards-description":"已标记看板将会出现在您的看板列表顶部。","subscribe":"订阅","team":"团队","this-board":"该看板","this-card":"该卡片","time":"时间","title":"标题","tracking":"跟踪","tracking-info":"当任何包含您（作为创建者或成员）的卡片发生变更时，您将得到通知。","unassign-member":"取消分配成员","unsaved-description":"存在未保存的描述","unwatch":"取消关注","upload":"上传","upload-avatar":"上传头像","uploaded-avatar":"头像已经上传","username":"用户名","view-it":"查看","warn-list-archived":"警告: 该卡片位于已归档清单中","watch":"关注","watching":"已关注","watching-info":"当此看板发生变更时会通知你","welcome-board":"“欢迎”看板","welcome-list1":"基本","welcome-list2":"高阶","what-to-do":"要做什么？"});
TAPi18n._registerServerTranslator("zh-CN", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"zh-TW.i18n.json":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// i18n/zh-TW.i18n.json                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["zh-TW"] = ["Chinese (Taiwan)","繁体中文（台湾）"];
if(_.isUndefined(TAPi18n.translations["zh-TW"])) {
  TAPi18n.translations["zh-TW"] = {};
}

if(_.isUndefined(TAPi18n.translations["zh-TW"][namespace])) {
  TAPi18n.translations["zh-TW"][namespace] = {};
}

_.extend(TAPi18n.translations["zh-TW"][namespace], {"accept":"接受","act-activity-notify":"[Wekan] 活動通知","act-addAttachment":"新增附件__attachment__至__card__","act-addComment":"評論__card__: __comment__","act-createBoard":"完成新增 __board__","act-createCard":"將__card__加入__list__","act-createList":"新增__list__至__board__","act-addBoardMember":"在__board__中新增成員__member__","act-archivedBoard":"封存__board__","act-archivedCard":"封存__card__","act-archivedList":"封存__list__","act-importBoard":"匯入__board__","act-importCard":"匯入__card__","act-importList":"匯入__list__","act-joinMember":"在__card__中新增成員__member__","act-moveCard":"將__card__從__oldList__移動至__list__","act-removeBoardMember":"從__board__中移除成員__member__","act-restoredCard":"將__card__回復至__board__","act-unjoinMember":"從__card__中移除成員__member__","act-withBoardTitle":"[Wekan] __board__","act-withCardTitle":"[__board__] __card__","actions":"操作","activities":"活動","activity":"活動","activity-added":"新增 %s 至 %s","activity-archived":"封存 %s","activity-attached":"新增附件 %s 至 %s","activity-created":"建立 %s","activity-excluded":"排除 %s 從 %s","activity-imported":"匯入 %s 至 %s 從 %s 中","activity-imported-board":"已匯入 %s 從 %s 中","activity-joined":"關聯 %s","activity-moved":"將 %s 從 %s 移動到 %s","activity-on":"在 %s","activity-removed":"移除 %s 從 %s 中","activity-sent":"寄送 %s 至 %s","activity-unjoined":"解除關聯 %s","activity-checklist-added":"新增待辦清單至 %s","add":"新增","add-attachment":"新增附件","add-board":"新增看板","add-card":"新增卡片","add-checklist":"新增待辦清單","add-checklist-item":"新增項目","add-cover":"新增封面","add-label":"新增標籤","add-list":"新增清單","add-members":"新增成員","added":"新增","addMemberPopup-title":"成員","admin":"管理員","admin-desc":"可以瀏覽並編輯卡片，移除成員，並且更改該看板的設定","all-boards":"全部看板","and-n-other-card":"和其他 __count__ 個卡片","and-n-other-card_plural":"和其他 __count__ 個卡片","apply":"送出","app-is-offline":"目前狀態為離線，若整重將會造成資料遺失","archive":"刪除","archive-all":"全部刪除","archive-board":"刪除看板","archive-card":"刪除卡片","archive-list":"刪除該清單","archive-selection":"刪除所選內容","archiveBoardPopup-title":"確定要刪除看板嗎？","archived-items":"封存","archives":"封存","assign-member":"分配成員","attached":"附加","attachment":"附件","attachment-delete-pop":"刪除附件的操作無法還原。","attachmentDeletePopup-title":"刪除附件？","attachments":"附件","auto-watch":"新增看板時自動加入觀察","avatar-too-big":"大頭貼太大 (最大 70 Kb)","back":"返回","board-change-color":"更改顏色","board-nb-stars":"%s 星號標記","board-not-found":"看板不存在","board-private-info":"該看板將被設為 <strong>私有</strong>.","board-public-info":"該看板將被設為 <strong>公開</strong>.","boardChangeColorPopup-title":"修改看板背景","boardChangeTitlePopup-title":"重新命名看板","boardChangeVisibilityPopup-title":"更改可視級別","boardChangeWatchPopup-title":"更改觀察","boardMenuPopup-title":"看板選單","boards":"看板","bucket-example":"例如 “目標清單”","cancel":"取消","card-archived":"該卡片已被刪除","card-comments-title":"該卡片有 %s 則評論","card-delete-notice":"徹底刪除的操作不可復原，你將會遺失該卡片相關的所有操作記錄。","card-delete-pop":"所有的動作將從活動動態中被移除且您將無法重新打開該卡片。此操作無法復原。","card-delete-suggest-archive":"你可以將卡片從看板中刪除至回收筒，但保留相關活動。","card-due":"到期","card-due-on":"到期","card-edit-attachments":"編輯附件","card-edit-labels":"編輯標籤","card-edit-members":"編輯成員","card-labels-title":"更改該卡片上的標籤","card-members-title":"在該卡片中新增或移除看板成員","card-start":"開始","card-start-on":"開始","cardAttachmentsPopup-title":"附件來源","cardDeletePopup-title":"徹底刪除卡片？","cardDetailsActionsPopup-title":"卡片動作","cardLabelsPopup-title":"標籤","cardMembersPopup-title":"成員","cardMorePopup-title":"更多","cards":"卡片","change":"變更","change-avatar":"更改大頭貼","change-password":"更改密碼","change-permissions":"更改許可權","change-settings":"更改設定","changeAvatarPopup-title":"更改大頭貼","changeLanguagePopup-title":"更改語言","changePasswordPopup-title":"更改密碼","changePermissionsPopup-title":"更改許可權","changeSettingsPopup-title":"更改設定","checklists":"待辦清單","click-to-star":"點此來標記該看板","click-to-unstar":"點此來去除該看板的標記","clipboard":"剪貼簿貼上或者拖曳檔案","close":"關閉","close-board":"關閉看板","close-board-pop":"您可以透過點選主介面上方的”回收筒“按鈕來還原看板。","color-black":"黑色","color-blue":"藍色","color-green":"綠色","color-lime":"綠黃","color-orange":"橙色","color-pink":"粉紅","color-purple":"紫色","color-red":"紅色","color-sky":"天藍","color-yellow":"黃色","comment":"評論","comment-placeholder":"新增評論","computer":"從本機上傳","create":"建立","createBoardPopup-title":"建立看板","createLabelPopup-title":"建立標籤","current":"目前","date":"日期","decline":"拒絕","default-avatar":"預設大頭貼","delete":"刪除","deleteLabelPopup-title":"刪除標籤？","description":"描述","disambiguateMultiLabelPopup-title":"清除標籤動作歧義","disambiguateMultiMemberPopup-title":"清除成員動作歧義","discard":"取消","done":"完成","download":"下載","edit":"編輯","edit-avatar":"更改大頭貼","edit-profile":"編輯資料","editCardStartDatePopup-title":"更改開始日期","editCardDueDatePopup-title":"更改到期日期","editLabelPopup-title":"更改標籤","editNotificationPopup-title":"更改通知","editProfilePopup-title":"編輯資料","email":"電子郵件","email-enrollAccount-subject":"您在 __siteName__ 的帳號已經建立","email-enrollAccount-text":"親愛的 __user__,\n\n點選下面的連結，即刻開始使用這項服務。\n\n__url__\n\n謝謝。","email-fail":"郵件寄送失敗","email-invalid":"電子郵件地址錯誤","email-invite":"寄送郵件邀請","email-invite-subject":"__inviter__ 向您發出邀請","email-invite-text":"親愛的 __user__,\n\n__inviter__ 邀請您加入看板 \"__board__\" 參與協作。\n\n請點選下面的連結訪問看板：\n\n__url__\n\n謝謝。","email-resetPassword-subject":"重設您在 __siteName__ 的密碼","email-resetPassword-text":"親愛的 __user__,\n\n點選下面的連結，重置您的密碼：\n\n__url__\n\n謝謝。","email-sent":"郵件已寄送","email-verifyEmail-subject":"驗證您在 __siteName__ 的電子郵件","email-verifyEmail-text":"親愛的 __user__,\n\n點選下面的連結，驗證您的電子郵件地址：\n\n__url__\n\n謝謝。","error-board-doesNotExist":"該看板不存在","error-board-notAdmin":"需要成為管理員才能執行此操作","error-board-notAMember":"需要成為看板成員才能執行此操作","error-json-malformed":"不是有效的 JSON","error-json-schema":"JSON 資料沒有用正確的格式包含合適的資訊","error-list-doesNotExist":"不存在此列表","error-user-doesNotExist":"該使用者不存在","error-user-notAllowSelf":"不允許對自己執行此操作","error-user-notCreated":"該使用者未能成功建立","error-username-taken":"這個使用者名稱已被使用","export-board":"Export board","filter":"過濾","filter-cards":"過濾卡片","filter-clear":"清空過濾條件","filter-no-label":"沒有標籤","filter-no-member":"沒有成員","filter-on":"過濾條件啟用","filter-on-desc":"你正在過濾該看板上的卡片，點此編輯過濾條件。","filter-to-selection":"要選擇的過濾條件","fullname":"全稱","header-logo-title":"返回您的看板頁面","hide-system-messages":"隱藏系統訊息","home":"首頁","import":"匯入","import-board":"匯入 Trello 資料","import-board-title":"匯入在 Trello 的看板","import-board-trello-instruction":"在你的Trello看板中，點選“功能表”，然後選擇“更多”，“列印與匯出”，“匯出為 JSON” 並拷貝結果文本","import-json-placeholder":"貼上您有效的 JSON 資料至此","import-map-members":"複製成員","import-members-map":"您匯入的看板有一些成員。請將您想匯入的成員映射到 Wekan 使用者。","import-show-user-mapping":"核對成員映射","import-user-select":"選擇您想將此成員映射到的 Wekan 使用者","importMapMembersAddPopup-title":"選擇 Wekan 成員","info":"資訊","initials":"縮寫","invalid-date":"無效的日期","joined":"關聯","just-invited":"您剛剛被邀請加入此看板","keyboard-shortcuts":"鍵盤快速鍵","label-create":"建立新標籤","label-default":"%s 標籤 (預設)","label-delete-pop":"此操作無法還原，這將會刪除該標籤並清除它的歷史記錄。","labels":"標籤","language":"語言","last-admin-desc":"你不能更改角色，因為至少需要一名管理員。","leave-board":"離開看板","link-card":"關聯至該卡片","list-archive-cards":"刪除清單中的所有卡片","list-archive-cards-pop":"這將會從本看板中移除該清單中的所有卡片。如果需要瀏覽已刪除的卡片並且將其回復至看板，請點選\"選單\">\"回收筒\"","list-move-cards":"移動清單中的所有卡片","list-select-cards":"選擇清單中的所有卡片","listActionPopup-title":"清單操作","listImportCardPopup-title":"匯入 Trello 卡片","lists":"清單","log-out":"登出","log-in":"登入","loginPopup-title":"登入","memberMenuPopup-title":"成員更改","members":"成員","menu":"選單","move-selection":"移動被選擇的項目","moveCardPopup-title":"移動卡片","moveCardToBottom-title":"移至最下面","moveCardToTop-title":"移至最上面","moveSelectionPopup-title":"移動選取的項目","multi-selection":"多選","multi-selection-on":"多選啟用","muted":"靜音","muted-info":"您將不會收到有關這個看板的任何訊息","my-boards":"我的看板","name":"名稱","no-archived-cards":"沒有已刪除的卡片","no-archived-lists":"沒有已刪除的清單","no-results":"無結果","normal":"普通","normal-desc":"可以建立以及編輯卡片，無法更改。","not-accepted-yet":"邀請尚未接受","notify-participate":"接收與你有關的卡片更新","notify-watch":"接收您關注的看板、清單或卡片的更新","optional":"選擇性的","or":"或","page-maybe-private":"本頁面被設為私有. 您必須 <a href='%s'>登入</a>以瀏覽其中內容。","page-not-found":"頁面不存在。","password":"密碼","paste-or-dragdrop":"從剪貼簿貼上，或者拖曳檔案到它上面 (僅限於圖片)","participating":"參與","preview":"預覽","previewAttachedImagePopup-title":"預覽","previewClipboardImagePopup-title":"預覽","private":"私有","private-desc":"該看板將被設為私有。只有該看板成員才可以進行檢視和編輯。","profile":"資料","public":"公開","public-desc":"該看板將被公開。任何人均可透過連結檢視，並且將對Google和其他搜尋引擎開放。只有加入至該看板的成員才可進行編輯。","quick-access-description":"被星號標記的看板在導航列中新增快速啟動方式","remove-cover":"移除封面","remove-from-board":"從看板中刪除","remove-label":"移除標籤","remove-list":"移除清單","remove-member":"移除成員","remove-member-from-card":"從該卡片中移除","remove-member-pop":"確定從 __boardTitle__ 中移除 __name__ (__username__) 嗎? 該成員將被從該看板的所有卡片中移除，同時他會收到一則提醒。","removeMemberPopup-title":"刪除成員？","rename":"重新命名","rename-board":"重新命名看板","restore":"還原","save":"儲存","search":"搜尋","select-color":"選擇顏色","shortcut-assign-self":"分配目前卡片給自己","shortcut-autocomplete-emoji":"自動完成表情符號","shortcut-autocomplete-members":"自動補齊成員","shortcut-clear-filters":"清空全部過濾條件","shortcut-close-dialog":"關閉對話方塊","shortcut-filter-my-cards":"過濾我的卡片","shortcut-show-shortcuts":"顯示此快速鍵清單","shortcut-toggle-filterbar":"切換過濾程式邊欄","shortcut-toggle-sidebar":"切換面板邊欄","show-cards-minimum-count":"顯示卡片數量，當內容超過數量","signupPopup-title":"建立帳戶","star-board-title":"點此標記該看板，它將會出現在您的看板列表上方。","starred-boards":"已標記看板","starred-boards-description":"已標記看板將會出現在您的看板列表上方。","subscribe":"訂閱","team":"團隊","this-board":"這個看板","this-card":"這個卡片","time":"時間","title":"標題","tracking":"追蹤","tracking-info":"你將會收到與你有關的卡片的所有變更通知","unassign-member":"取消分配成員","unsaved-description":"未儲存的描述","unwatch":"取消觀察","upload":"上傳","upload-avatar":"上傳大頭貼","uploaded-avatar":"大頭貼已經上傳","username":"使用者名稱","view-it":"檢視","warn-list-archived":"警告: 該卡片位於已刪除的清單中","watch":"觀察","watching":"觀察中","watching-info":"你將會收到關於這個看板所有的變更通知","welcome-board":"歡迎進入看板","welcome-list1":"基本","welcome-list2":"進階","what-to-do":"要做什麼？"});
TAPi18n._registerServerTranslator("zh-TW", namespace);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"activities.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/activities.js                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Activities don't need a schema because they are always set from the a trusted                                      //
// environment - the server - and there is no risk that a user change the logic                                       //
// we use with this collection. Moreover using a schema for this collection                                           //
// would be difficult (different activities have different fields) and wouldn't                                       //
// bring any direct advantage.                                                                                        //
//                                                                                                                    //
// XXX The activities API is not so nice and need some functionalities. For                                           //
// instance if a user archive a card, and un-archive it a few seconds later we                                        //
// should remove both activities assuming it was an error the user decided to                                         //
// revert.                                                                                                            //
Activities = new Mongo.Collection('activities');                                                                      // 11
                                                                                                                      //
Activities.helpers({                                                                                                  // 13
  board: function board() {                                                                                           // 14
    return Boards.findOne(this.boardId);                                                                              // 15
  },                                                                                                                  // 16
  oldBoard: function oldBoard() {                                                                                     // 17
    return Boards.findOne(this.oldBoardId);                                                                           // 18
  },                                                                                                                  // 19
  user: function user() {                                                                                             // 20
    return Users.findOne(this.userId);                                                                                // 21
  },                                                                                                                  // 22
  member: function member() {                                                                                         // 23
    return Users.findOne(this.memberId);                                                                              // 24
  },                                                                                                                  // 25
  list: function list() {                                                                                             // 26
    return Lists.findOne(this.listId);                                                                                // 27
  },                                                                                                                  // 28
  newList: function newList() {                                                                                       // 29
    return Lists.findOne(this.newListId);                                                                             // 30
  },                                                                                                                  // 31
  oldList: function oldList() {                                                                                       // 32
    return Lists.findOne(this.oldListId);                                                                             // 33
  },                                                                                                                  // 34
  card: function card() {                                                                                             // 35
    return Cards.findOne(this.cardId);                                                                                // 36
  },                                                                                                                  // 37
  oldCard: function oldCard() {                                                                                       // 38
    return Cards.findOne(this.oldCardId);                                                                             // 39
  },                                                                                                                  // 40
  comment: function comment() {                                                                                       // 41
    return CardComments.findOne(this.commentId);                                                                      // 42
  },                                                                                                                  // 43
  attachment: function attachment() {                                                                                 // 44
    return Attachments.findOne(this.attachmentId);                                                                    // 45
  },                                                                                                                  // 46
  newListLink: function newListLink() {                                                                               // 47
    return Blaze.toHTML(HTML.A({                                                                                      // 48
      href: this.newList().absoluteUrl(),                                                                             // 49
      'class': 'action-list'                                                                                          // 50
    }, this.newList().title));                                                                                        // 48
  },                                                                                                                  // 52
  oldListLink: function oldListLink() {                                                                               // 53
    return Blaze.toHTML(HTML.A({                                                                                      // 54
      href: this.oldList().absoluteUrl(),                                                                             // 55
      'class': 'action-list'                                                                                          // 56
    }, this.oldList().title));                                                                                        // 54
  },                                                                                                                  // 58
  oldCardLink: function oldCardLink() {                                                                               // 59
    return Blaze.toHTML(HTML.A({                                                                                      // 60
      href: this.oldCard().absoluteUrl(),                                                                             // 61
      'class': 'action-card'                                                                                          // 62
    }, this.oldCard().title));                                                                                        // 60
  },                                                                                                                  // 64
  checklist: function checklist() {                                                                                   // 65
    return Checklists.findOne(this.checklistId);                                                                      // 66
  },                                                                                                                  // 67
  descriptionListLink: function descriptionListLink() {                                                               // 68
    return Blaze.toHTML(HTML.A({                                                                                      // 69
      href: this.list().absoluteUrl(),                                                                                // 70
      'class': 'action-list'                                                                                          // 71
    }, this.list().description));                                                                                     // 69
  },                                                                                                                  // 73
  descriptionCardLink: function descriptionCardLink() {                                                               // 74
    return Blaze.toHTML(HTML.A({                                                                                      // 75
      href: this.card().absoluteUrl(),                                                                                // 76
      'class': 'action-list'                                                                                          // 77
    }, this.card().description));                                                                                     // 75
  }                                                                                                                   // 79
});                                                                                                                   // 13
                                                                                                                      //
Activities.before.insert(function (userId, doc) {                                                                     // 82
  doc.createdAt = new Date();                                                                                         // 83
});                                                                                                                   // 84
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 86
  // For efficiency create indexes on the date of creation, and on the date of                                        //
  // creation in conjunction with the card or board id, as corresponding views                                        //
  // are largely used in the App. See #524.                                                                           //
  Meteor.startup(function () {                                                                                        // 90
    Activities._collection._ensureIndex({ createdAt: -1 });                                                           // 91
    Activities._collection._ensureIndex({ cardId: 1, createdAt: -1 });                                                // 92
    Activities._collection._ensureIndex({ boardId: 1, createdAt: -1 });                                               // 93
    Activities._collection._ensureIndex({ listId: 1, createdAt: -1 });                                                // 94
  });                                                                                                                 // 95
                                                                                                                      //
  Activities.after.insert(function (userId, doc) {                                                                    // 97
    var activity = Activities._transform(doc);                                                                        // 98
    var participants = [];                                                                                            // 99
    var watchers = [];                                                                                                // 100
    var title = 'act-activity-notify';                                                                                // 101
    var board = null;                                                                                                 // 102
    var description = 'act-' + activity.activityType;                                                                 // 103
    var params = {                                                                                                    // 104
      activityId: activity._id                                                                                        // 105
    };                                                                                                                // 104
    if (activity.userId) {                                                                                            // 107
      // No need send notification to user of activity                                                                //
      // participants = _.union(participants, [activity.userId]);                                                     //
      params.user = activity.user().getName();                                                                        // 110
    }                                                                                                                 // 111
    if (activity.boardId) {                                                                                           // 112
      board = activity.board();                                                                                       // 113
      params.board = board.title;                                                                                     // 114
      title = 'act-withBoardTitle';                                                                                   // 115
      params.url = board.absoluteUrl();                                                                               // 116
    }                                                                                                                 // 117
    if (activity.memberId) {                                                                                          // 118
      participants = _.union(participants, [activity.memberId]);                                                      // 119
      params.member = activity.member().getName();                                                                    // 120
    }                                                                                                                 // 121
    if (activity.listId) {                                                                                            // 122
      var list = activity.list();                                                                                     // 123
      watchers = _.union(watchers, list.watchers || []);                                                              // 124
      params.list = list.title;                                                                                       // 125
    }                                                                                                                 // 126
    if (activity.oldListId) {                                                                                         // 127
      var oldList = activity.oldList();                                                                               // 128
      watchers = _.union(watchers, oldList.watchers || []);                                                           // 129
      params.oldList = oldList.title;                                                                                 // 130
    }                                                                                                                 // 131
    if (activity.cardId) {                                                                                            // 132
      var card = activity.card();                                                                                     // 133
      participants = _.union(participants, [card.userId], card.members || []);                                        // 134
      watchers = _.union(watchers, card.watchers || []);                                                              // 135
      params.card = card.title;                                                                                       // 136
      title = 'act-withCardTitle';                                                                                    // 137
      params.url = card.absoluteUrl();                                                                                // 138
    }                                                                                                                 // 139
    if (activity.commentId) {                                                                                         // 140
      var comment = activity.comment();                                                                               // 141
      params.comment = comment.text;                                                                                  // 142
    }                                                                                                                 // 143
    if (activity.attachmentId) {                                                                                      // 144
      var attachment = activity.attachment();                                                                         // 145
      params.attachment = attachment._id;                                                                             // 146
    }                                                                                                                 // 147
    if (activity.checklistId) {                                                                                       // 148
      var checklist = activity.checklist();                                                                           // 149
      params.checklist = checklist.title;                                                                             // 150
    }                                                                                                                 // 151
    if (board) {                                                                                                      // 152
      var watchingUsers = _.pluck(_.where(board.watchers, { level: 'watching' }), 'userId');                          // 153
      var trackingUsers = _.pluck(_.where(board.watchers, { level: 'tracking' }), 'userId');                          // 154
      var mutedUsers = _.pluck(_.where(board.watchers, { level: 'muted' }), 'userId');                                // 155
      switch (board.getWatchDefault()) {                                                                              // 156
        case 'muted':                                                                                                 // 157
          participants = _.intersection(participants, trackingUsers);                                                 // 158
          watchers = _.intersection(watchers, trackingUsers);                                                         // 159
          break;                                                                                                      // 160
        case 'tracking':                                                                                              // 161
          participants = _.difference(participants, mutedUsers);                                                      // 162
          watchers = _.difference(watchers, mutedUsers);                                                              // 163
          break;                                                                                                      // 164
      }                                                                                                               // 156
      watchers = _.union(watchers, watchingUsers || []);                                                              // 166
    }                                                                                                                 // 167
                                                                                                                      //
    Notifications.getUsers(participants, watchers).forEach(function (user) {                                          // 169
      Notifications.notify(user, title, description, params);                                                         // 170
    });                                                                                                               // 171
  });                                                                                                                 // 172
}                                                                                                                     // 173
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"attachments.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/attachments.js                                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Attachments = new FS.Collection('attachments', {                                                                      // 1
  stores: [                                                                                                           // 2
                                                                                                                      //
  // XXX Add a new store for cover thumbnails so we don't load big images in                                          //
  // the general board view                                                                                           //
  new FS.Store.GridFS('attachments')]                                                                                 // 6
});                                                                                                                   // 1
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 10
  Attachments.allow({                                                                                                 // 11
    insert: function insert(userId, doc) {                                                                            // 12
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                 // 13
    },                                                                                                                // 14
    update: function update(userId, doc) {                                                                            // 15
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                 // 16
    },                                                                                                                // 17
    remove: function remove(userId, doc) {                                                                            // 18
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                 // 19
    },                                                                                                                // 20
                                                                                                                      //
    // We authorize the attachment download either:                                                                   //
    // - if the board is public, everyone (even unconnected) can download it                                          //
    // - if the board is private, only board members can download it                                                  //
    //                                                                                                                //
    // XXX We have a bug with the `userId` verification:                                                              //
    //                                                                                                                //
    //   https://github.com/CollectionFS/Meteor-CollectionFS/issues/449                                               //
    //                                                                                                                //
    download: function download(userId, doc) {                                                                        // 29
      var query = {                                                                                                   // 30
        $or: [{ 'members.userId': userId }, { permission: 'public' }]                                                 // 31
      };                                                                                                              // 30
      return Boolean(Boards.findOne(doc.boardId, query));                                                             // 36
    },                                                                                                                // 37
                                                                                                                      //
                                                                                                                      //
    fetch: ['boardId']                                                                                                // 39
  });                                                                                                                 // 11
}                                                                                                                     // 41
                                                                                                                      //
// XXX Enforce a schema for the Attachments CollectionFS                                                              //
                                                                                                                      //
Attachments.files.before.insert(function (userId, doc) {                                                              // 45
  var file = new FS.File(doc);                                                                                        // 46
  doc.userId = userId;                                                                                                // 47
                                                                                                                      //
  // If the uploaded document is not an image we need to enforce browser                                              //
  // download instead of execution. This is particularly important for HTML                                           //
  // files that the browser will just execute if we don't serve them with the                                         //
  // appropriate `application/octet-stream` MIME header which can lead to user                                        //
  // data leaks. I imagine other formats (like PDF) can also be attack vectors.                                       //
  // See https://github.com/wekan/wekan/issues/99                                                                     //
  // XXX Should we use `beforeWrite` option of CollectionFS instead of                                                //
  // collection-hooks?                                                                                                //
  if (!file.isImage()) {                                                                                              // 57
    file.original.type = 'application/octet-stream';                                                                  // 58
  }                                                                                                                   // 59
});                                                                                                                   // 60
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 62
  Attachments.files.after.insert(function (userId, doc) {                                                             // 63
    Activities.insert({                                                                                               // 64
      userId: userId,                                                                                                 // 65
      type: 'card',                                                                                                   // 66
      activityType: 'addAttachment',                                                                                  // 67
      attachmentId: doc._id,                                                                                          // 68
      boardId: doc.boardId,                                                                                           // 69
      cardId: doc.cardId                                                                                              // 70
    });                                                                                                               // 64
  });                                                                                                                 // 72
                                                                                                                      //
  Attachments.files.after.remove(function (userId, doc) {                                                             // 74
    Activities.remove({                                                                                               // 75
      attachmentId: doc._id                                                                                           // 76
    });                                                                                                               // 75
  });                                                                                                                 // 78
}                                                                                                                     // 79
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"avatars.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/avatars.js                                                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Avatars = new FS.Collection('avatars', {                                                                              // 1
  stores: [new FS.Store.GridFS('avatars')],                                                                           // 2
  filter: {                                                                                                           // 5
    maxSize: 72000,                                                                                                   // 6
    allow: {                                                                                                          // 7
      contentTypes: ['image/*']                                                                                       // 8
    }                                                                                                                 // 7
  }                                                                                                                   // 5
});                                                                                                                   // 1
                                                                                                                      //
function isOwner(userId, file) {                                                                                      // 13
  return userId && userId === file.userId;                                                                            // 14
}                                                                                                                     // 15
                                                                                                                      //
Avatars.allow({                                                                                                       // 17
  insert: isOwner,                                                                                                    // 18
  update: isOwner,                                                                                                    // 19
  remove: isOwner,                                                                                                    // 20
  download: function download() {                                                                                     // 21
    return true;                                                                                                      // 21
  },                                                                                                                  // 21
                                                                                                                      //
  fetch: ['userId']                                                                                                   // 22
});                                                                                                                   // 17
                                                                                                                      //
Avatars.files.before.insert(function (userId, doc) {                                                                  // 25
  doc.userId = userId;                                                                                                // 26
});                                                                                                                   // 27
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"boards.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/boards.js                                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Boards = new Mongo.Collection('boards');                                                                              // 1
                                                                                                                      //
Boards.attachSchema(new SimpleSchema({                                                                                // 3
  title: {                                                                                                            // 4
    type: String                                                                                                      // 5
  },                                                                                                                  // 4
  slug: {                                                                                                             // 7
    type: String,                                                                                                     // 8
    autoValue: function autoValue() {                                                                                 // 9
      // eslint-disable-line consistent-return                                                                        //
      // XXX We need to improve slug management. Only the id should be necessary                                      //
      // to identify a board in the code.                                                                             //
      // XXX If the board title is updated, the slug should also be updated.                                          //
      // In some cases (Chinese and Japanese for instance) the `getSlug` function                                     //
      // return an empty string. This is causes bugs in our application so we set                                     //
      // a default slug in this case.                                                                                 //
      if (this.isInsert && !this.isSet) {                                                                             // 16
        var slug = 'board';                                                                                           // 17
        var title = this.field('title');                                                                              // 18
        if (title.isSet) {                                                                                            // 19
          slug = getSlug(title.value) || slug;                                                                        // 20
        }                                                                                                             // 21
        return slug;                                                                                                  // 22
      }                                                                                                               // 23
    }                                                                                                                 // 24
  },                                                                                                                  // 7
  archived: {                                                                                                         // 26
    type: Boolean,                                                                                                    // 27
    autoValue: function autoValue() {                                                                                 // 28
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 29
        return false;                                                                                                 // 30
      }                                                                                                               // 31
    }                                                                                                                 // 32
  },                                                                                                                  // 26
  createdAt: {                                                                                                        // 34
    type: Date,                                                                                                       // 35
    autoValue: function autoValue() {                                                                                 // 36
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 37
        return new Date();                                                                                            // 38
      } else {                                                                                                        // 39
        this.unset();                                                                                                 // 40
      }                                                                                                               // 41
    }                                                                                                                 // 42
  },                                                                                                                  // 34
  // XXX Inconsistent field naming                                                                                    //
  modifiedAt: {                                                                                                       // 45
    type: Date,                                                                                                       // 46
    optional: true,                                                                                                   // 47
    autoValue: function autoValue() {                                                                                 // 48
      // eslint-disable-line consistent-return                                                                        //
      if (this.isUpdate) {                                                                                            // 49
        return new Date();                                                                                            // 50
      } else {                                                                                                        // 51
        this.unset();                                                                                                 // 52
      }                                                                                                               // 53
    }                                                                                                                 // 54
  },                                                                                                                  // 45
  // De-normalized number of users that have starred this board                                                       //
  stars: {                                                                                                            // 57
    type: Number,                                                                                                     // 58
    autoValue: function autoValue() {                                                                                 // 59
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 60
        return 0;                                                                                                     // 61
      }                                                                                                               // 62
    }                                                                                                                 // 63
  },                                                                                                                  // 57
  // De-normalized label system                                                                                       //
  'labels': {                                                                                                         // 66
    type: [Object],                                                                                                   // 67
    autoValue: function autoValue() {                                                                                 // 68
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 69
        var colors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;                                   // 70
        var defaultLabelsColors = _.clone(colors).splice(0, 6);                                                       // 71
        return defaultLabelsColors.map(function (color) {                                                             // 72
          return {                                                                                                    // 72
            color: color,                                                                                             // 73
            _id: Random.id(6),                                                                                        // 74
            name: ''                                                                                                  // 75
          };                                                                                                          // 72
        });                                                                                                           // 72
      }                                                                                                               // 77
    }                                                                                                                 // 78
  },                                                                                                                  // 66
  'labels.$._id': {                                                                                                   // 80
    // We don't specify that this field must be unique in the board because that                                      //
    // will cause performance penalties and is not necessary since this field is                                      //
    // always set on the server.                                                                                      //
    // XXX Actually if we create a new label, the `_id` is set on the client                                          //
    // without being overwritten by the server, could it be a problem?                                                //
    type: String                                                                                                      // 86
  },                                                                                                                  // 80
  'labels.$.name': {                                                                                                  // 88
    type: String,                                                                                                     // 89
    optional: true                                                                                                    // 90
  },                                                                                                                  // 88
  'labels.$.color': {                                                                                                 // 92
    type: String,                                                                                                     // 93
    allowedValues: ['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime', 'pink', 'black']             // 94
  },                                                                                                                  // 92
  // XXX We might want to maintain more informations under the member sub-                                            //
  // documents like de-normalized meta-data (the date the member joined the                                           //
  // board, the number of contributions, etc.).                                                                       //
  'members': {                                                                                                        // 102
    type: [Object],                                                                                                   // 103
    autoValue: function autoValue() {                                                                                 // 104
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 105
        return [{                                                                                                     // 106
          userId: this.userId || "OpenClinica_user",                                                                  // 107
          isAdmin: true,                                                                                              // 108
          isActive: true,                                                                                             // 109
          group: "public"                                                                                             // 110
        }];                                                                                                           // 106
      }                                                                                                               // 112
    }                                                                                                                 // 113
  },                                                                                                                  // 102
  'members.$.userId': {                                                                                               // 115
    type: String                                                                                                      // 116
  },                                                                                                                  // 115
  'members.$.isAdmin': {                                                                                              // 118
    type: Boolean                                                                                                     // 119
  },                                                                                                                  // 118
  'members.$.isActive': {                                                                                             // 121
    type: Boolean                                                                                                     // 122
  },                                                                                                                  // 121
  'members.$.group': {                                                                                                // 124
    type: String                                                                                                      // 125
  },                                                                                                                  // 124
  permission: {                                                                                                       // 127
    type: String,                                                                                                     // 128
    allowedValues: ['public', 'private']                                                                              // 129
  },                                                                                                                  // 127
  color: {                                                                                                            // 131
    type: String,                                                                                                     // 132
    allowedValues: ['belize', 'nephritis', 'pomegranate', 'pumpkin', 'wisteria', 'midnight'],                         // 133
    autoValue: function autoValue() {                                                                                 // 141
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 142
        return Boards.simpleSchema()._schema.color.allowedValues[0];                                                  // 143
      }                                                                                                               // 144
    }                                                                                                                 // 145
  },                                                                                                                  // 131
  description: {                                                                                                      // 147
    type: String,                                                                                                     // 148
    optional: true,                                                                                                   // 149
    autoValue: function autoValue() {                                                                                 // 150
      if (this.isInsert && !this.isSet) {                                                                             // 151
        return "";                                                                                                    // 152
      }                                                                                                               // 153
    }                                                                                                                 // 154
  },                                                                                                                  // 147
  _parentId: {                                                                                                        // 156
    type: String,                                                                                                     // 157
    optional: true                                                                                                    // 158
  }                                                                                                                   // 156
}));                                                                                                                  // 3
                                                                                                                      //
Boards.helpers({                                                                                                      // 163
  /**                                                                                                                 //
   * Is supplied user authorized to view this board?                                                                  //
   */                                                                                                                 //
                                                                                                                      //
  isVisibleBy: function isVisibleBy(user) {                                                                           // 167
    if (this.isPublic()) {                                                                                            // 168
      // public boards are visible to everyone                                                                        //
      return true;                                                                                                    // 170
    } else {                                                                                                          // 171
      // otherwise you have to be logged-in and active member                                                         //
      return user && this.isActiveMember(user._id);                                                                   // 173
    }                                                                                                                 // 174
  },                                                                                                                  // 175
                                                                                                                      //
                                                                                                                      //
  /**                                                                                                                 //
   * Is the user one of the active members of the board?                                                              //
   *                                                                                                                  //
   * @param userId                                                                                                    //
   * @returns {boolean} the member that matches, or undefined/false                                                   //
   */                                                                                                                 //
  isActiveMember: function isActiveMember(userId) {                                                                   // 183
    if (userId) {                                                                                                     // 184
      return this.members.find(function (member) {                                                                    // 185
        return member.userId === userId && member.isActive;                                                           // 185
      });                                                                                                             // 185
    } else {                                                                                                          // 186
      return false;                                                                                                   // 187
    }                                                                                                                 // 188
  },                                                                                                                  // 189
  isPublic: function isPublic() {                                                                                     // 191
    return this.permission === 'public';                                                                              // 192
  },                                                                                                                  // 193
  lists: function lists() {                                                                                           // 195
    return Lists.find({ boardId: this._id, archived: false }, { sort: { sort: 1 } });                                 // 196
  },                                                                                                                  // 197
  activities: function activities() {                                                                                 // 199
    var activities = Activities.find({ boardId: this._id }, { sort: { createdAt: -1 } }).fetch();                     // 200
    var result = [];                                                                                                  // 201
    var formIds = new Object();                                                                                       // 202
    // show only one type for one form_id                                                                             //
    _.each(activities, function (activity, index) {                                                                   // 204
      if (activity.cardId && (activity.activityType === "addVersionCard" || activity.activityType === "updateVersionCard" || activity.activityType === "archiveVersionCard" || activity.activityType === "restoreVersionCard" || activity.activityType === "renameCard" || activity.activityType === "updateDescriptionCard")) {
        var form = Cards.findOne(activity.cardId);                                                                    // 206
        if (!_.contains(formIds[activity.activityType], form.form_id)) {                                              // 207
          var value = [];                                                                                             // 208
          if (index === 0) {                                                                                          // 209
            value.push(form.form_id);                                                                                 // 210
            formIds[activity.activityType] = value;                                                                   // 211
          } else {                                                                                                    // 212
            if (formIds[activity.activityType]) {                                                                     // 213
              value = formIds[activity.activityType];                                                                 // 214
            }                                                                                                         // 215
            value.push(form.form_id);                                                                                 // 216
            formIds[activity.activityType] = value;                                                                   // 217
          }                                                                                                           // 218
          result.push(activity);                                                                                      // 219
        }                                                                                                             // 220
      } else {                                                                                                        // 221
        result.push(activity);                                                                                        // 222
      }                                                                                                               // 223
    });                                                                                                               // 224
    return result;                                                                                                    // 225
  },                                                                                                                  // 226
  activeMembers: function activeMembers() {                                                                           // 228
    // exclude ghost and inactive member                                                                              //
    var resultMember = _.filter(this.members, function (member) {                                                     // 230
      return member.isActive === true && member.userId !== "OpenClinica_user";                                        // 231
    });                                                                                                               // 232
                                                                                                                      //
    // add user with same group                                                                                       //
    if (Meteor.user()) {                                                                                              // 235
      if (Meteor.user().group) {                                                                                      // 236
        Meteor.subscribe('user-by-group', Meteor.user().group);                                                       // 237
        var users = Users.find({ 'group': Meteor.user().group }).fetch();                                             // 238
        _.each(users, function (user) {                                                                               // 239
          var temporaryUser = {                                                                                       // 240
            userId: user._id,                                                                                         // 241
            isAdmin: true,                                                                                            // 242
            isActive: true,                                                                                           // 243
            group: user.group                                                                                         // 244
          };                                                                                                          // 240
          if (!_.findWhere(resultMember, { userId: user._id })) {                                                     // 246
            resultMember[resultMember.length] = temporaryUser;                                                        // 247
          }                                                                                                           // 248
        });                                                                                                           // 249
      }                                                                                                               // 250
    }                                                                                                                 // 251
    return resultMember;                                                                                              // 252
  },                                                                                                                  // 253
  activeAdmins: function activeAdmins() {                                                                             // 255
    return _.where(this.members, { isActive: true, isAdmin: true });                                                  // 256
  },                                                                                                                  // 257
  memberUsers: function memberUsers() {                                                                               // 259
    return Users.find({ _id: { $in: _.pluck(this.members, 'userId') } });                                             // 260
  },                                                                                                                  // 261
  getLabel: function getLabel(name, color) {                                                                          // 263
    return _.findWhere(this.labels, { name: name, color: color });                                                    // 264
  },                                                                                                                  // 265
  labelIndex: function labelIndex(labelId) {                                                                          // 267
    return _.pluck(this.labels, '_id').indexOf(labelId);                                                              // 268
  },                                                                                                                  // 269
  memberIndex: function memberIndex(memberId) {                                                                       // 271
    return _.pluck(this.members, 'userId').indexOf(memberId);                                                         // 272
  },                                                                                                                  // 273
  hasMember: function hasMember(memberId) {                                                                           // 275
    return !!_.findWhere(this.members, { userId: memberId, isActive: true });                                         // 276
  },                                                                                                                  // 277
  hasAdmin: function hasAdmin(memberId) {                                                                             // 279
    return !!_.findWhere(this.members, { userId: memberId, isActive: true, isAdmin: true });                          // 280
  },                                                                                                                  // 281
  hasGroup: function hasGroup(group) {                                                                                // 283
    return !!_.findWhere(this.members, { group: group, isActive: true });                                             // 284
  },                                                                                                                  // 285
  absoluteUrl: function absoluteUrl() {                                                                               // 287
    return FlowRouter.url('board', { id: this._id, slug: this.slug });                                                // 288
  },                                                                                                                  // 289
  colorClass: function colorClass() {                                                                                 // 291
    return 'board-color-' + this.color;                                                                               // 292
  },                                                                                                                  // 293
                                                                                                                      //
                                                                                                                      //
  // XXX currently mutations return no value so we have an issue when using addLabel in import                        //
  // XXX waiting on https://github.com/mquandalle/meteor-collection-mutations/issues/1 to remove...                   //
  pushLabel: function pushLabel(name, color) {                                                                        // 297
    var _id = Random.id(6);                                                                                           // 298
    Boards.direct.update(this._id, { $push: { labels: { _id: _id, name: name, color: color } } });                    // 299
    return _id;                                                                                                       // 300
  }                                                                                                                   // 301
});                                                                                                                   // 163
                                                                                                                      //
Boards.mutations({                                                                                                    // 304
  archive: function archive() {                                                                                       // 305
    return { $set: { archived: true } };                                                                              // 306
  },                                                                                                                  // 307
  restore: function restore() {                                                                                       // 309
    return { $set: { archived: false } };                                                                             // 310
  },                                                                                                                  // 311
  rename: function rename(title) {                                                                                    // 313
    return { $set: { title: title } };                                                                                // 314
  },                                                                                                                  // 315
  setDescription: function setDescription(description) {                                                              // 317
    return { $set: { description: description } };                                                                    // 318
  },                                                                                                                  // 319
  setColor: function setColor(color) {                                                                                // 321
    return { $set: { color: color } };                                                                                // 322
  },                                                                                                                  // 323
  setVisibility: function setVisibility(visibility) {                                                                 // 325
    return { $set: { permission: visibility } };                                                                      // 326
  },                                                                                                                  // 327
  addLabel: function addLabel(name, color) {                                                                          // 329
    // If label with the same name and color already exists we don't want to                                          //
    // create another one because they would be indistinguishable in the UI                                           //
    // (they would still have different `_id` but that is not exposed to the                                          //
    // user).                                                                                                         //
    if (!this.getLabel(name, color)) {                                                                                // 334
      var _id = Random.id(6);                                                                                         // 335
      return { $push: { labels: { _id: _id, name: name, color: color } } };                                           // 336
    }                                                                                                                 // 337
    return {};                                                                                                        // 338
  },                                                                                                                  // 339
  editLabel: function editLabel(labelId, name, color) {                                                               // 341
    if (!this.getLabel(name, color)) {                                                                                // 342
      var _$set;                                                                                                      // 342
                                                                                                                      //
      var labelIndex = this.labelIndex(labelId);                                                                      // 343
      return {                                                                                                        // 344
        $set: (_$set = {}, _$set['labels.' + labelIndex + '.name'] = name, _$set['labels.' + labelIndex + '.color'] = color, _$set)
      };                                                                                                              // 344
    }                                                                                                                 // 350
    return {};                                                                                                        // 351
  },                                                                                                                  // 352
  removeLabel: function removeLabel(labelId) {                                                                        // 354
    return { $pull: { labels: { _id: labelId } } };                                                                   // 355
  },                                                                                                                  // 356
  addMember: function addMember(memberId, group) {                                                                    // 358
    var memberIndex = this.memberIndex(memberId);                                                                     // 359
    if (memberIndex >= 0) {                                                                                           // 360
      var _$set2;                                                                                                     // 360
                                                                                                                      //
      return {                                                                                                        // 361
        $set: (_$set2 = {}, _$set2['members.' + memberIndex + '.isActive'] = true, _$set2)                            // 362
      };                                                                                                              // 361
    }                                                                                                                 // 366
                                                                                                                      //
    return {                                                                                                          // 368
      $push: {                                                                                                        // 369
        members: {                                                                                                    // 370
          userId: memberId,                                                                                           // 371
          isAdmin: false,                                                                                             // 372
          isActive: true,                                                                                             // 373
          group: group                                                                                                // 374
        }                                                                                                             // 370
      }                                                                                                               // 369
    };                                                                                                                // 368
  },                                                                                                                  // 378
  removeMember: function removeMember(memberId) {                                                                     // 380
    var _$set4;                                                                                                       // 380
                                                                                                                      //
    var memberIndex = this.memberIndex(memberId);                                                                     // 381
                                                                                                                      //
    // we do not allow the only one admin to be removed                                                               //
    var allowRemove = !this.members[memberIndex].isAdmin || this.activeAdmins().length > 1;                           // 384
    if (!allowRemove) {                                                                                               // 385
      var _$set3;                                                                                                     // 385
                                                                                                                      //
      return {                                                                                                        // 386
        $set: (_$set3 = {}, _$set3['members.' + memberIndex + '.isActive'] = true, _$set3)                            // 387
      };                                                                                                              // 386
    }                                                                                                                 // 391
                                                                                                                      //
    return {                                                                                                          // 393
      $set: (_$set4 = {}, _$set4['members.' + memberIndex + '.isActive'] = false, _$set4['members.' + memberIndex + '.isAdmin'] = false, _$set4)
    };                                                                                                                // 393
  },                                                                                                                  // 399
  setMemberPermission: function setMemberPermission(memberId, isAdmin) {                                              // 401
    var _$set5;                                                                                                       // 401
                                                                                                                      //
    var memberIndex = this.memberIndex(memberId);                                                                     // 402
                                                                                                                      //
    // do not allow change permission of self                                                                         //
    if (memberId === Meteor.userId()) {                                                                               // 405
      isAdmin = this.members[memberIndex].isAdmin;                                                                    // 406
    }                                                                                                                 // 407
                                                                                                                      //
    return {                                                                                                          // 409
      $set: (_$set5 = {}, _$set5['members.' + memberIndex + '.isAdmin'] = isAdmin, _$set5)                            // 410
    };                                                                                                                // 409
  },                                                                                                                  // 414
  setGroup: function setGroup(memberId, group) {                                                                      // 416
    var _$set6;                                                                                                       // 416
                                                                                                                      //
    var memberIndex = this.memberIndex(memberId);                                                                     // 417
    return {                                                                                                          // 418
      $set: (_$set6 = {}, _$set6['members.' + memberIndex + '.group'] = group, _$set6)                                // 419
    };                                                                                                                // 418
  },                                                                                                                  // 423
  setParentId: function setParentId(_parentId) {                                                                      // 425
    return { $set: { _parentId: _parentId } };                                                                        // 426
  }                                                                                                                   // 427
});                                                                                                                   // 304
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 430
  Boards.allow({                                                                                                      // 431
    insert: function insert() {                                                                                       // 432
      return true;                                                                                                    // 433
    },                                                                                                                // 434
    update: allowIsBoardAdmin,                                                                                        // 435
    remove: allowIsBoardAdmin,                                                                                        // 436
    fetch: ['members']                                                                                                // 437
  });                                                                                                                 // 431
                                                                                                                      //
  // The number of users that have starred this board is managed by trusted code                                      //
  // and the user is not allowed to update it                                                                         //
  Boards.deny({                                                                                                       // 442
    update: function update(userId, board, fieldNames) {                                                              // 443
      return _.contains(fieldNames, 'stars');                                                                         // 444
    },                                                                                                                // 445
                                                                                                                      //
    fetch: []                                                                                                         // 446
  });                                                                                                                 // 442
                                                                                                                      //
  // We can't remove a member if it is the last administrator                                                         //
  Boards.deny({                                                                                                       // 450
    update: function update(userId, doc, fieldNames, modifier) {                                                      // 451
      if (!_.contains(fieldNames, 'members')) return false;                                                           // 452
                                                                                                                      //
      // We only care in case of a $pull operation, ie remove a member                                                //
      if (!_.isObject(modifier.$pull && modifier.$pull.members)) return false;                                        // 456
                                                                                                                      //
      // If there is more than one admin, it's ok to remove anyone                                                    //
      var nbAdmins = _.where(doc.members, { isActive: true, isAdmin: true }).length;                                  // 460
      if (nbAdmins > 1) return false;                                                                                 // 461
                                                                                                                      //
      // If all the previous conditions were verified, we can't remove                                                //
      // a user if it's an admin                                                                                      //
      var removedMemberId = modifier.$pull.members.userId;                                                            // 466
      return Boolean(_.findWhere(doc.members, {                                                                       // 467
        userId: removedMemberId,                                                                                      // 468
        isAdmin: true                                                                                                 // 469
      }));                                                                                                            // 467
    },                                                                                                                // 471
                                                                                                                      //
    fetch: ['members']                                                                                                // 472
  });                                                                                                                 // 450
                                                                                                                      //
  Meteor.methods({                                                                                                    // 475
    quitBoard: function quitBoard(boardId) {                                                                          // 476
      check(boardId, String);                                                                                         // 477
      var board = Boards.findOne(boardId);                                                                            // 478
      if (board) {                                                                                                    // 479
        var userId = Meteor.userId();                                                                                 // 480
        var index = board.memberIndex(userId);                                                                        // 481
        if (index >= 0) {                                                                                             // 482
          board.removeMember(userId);                                                                                 // 483
          return true;                                                                                                // 484
        } else throw new Meteor.Error('error-board-notAMember');                                                      // 485
      } else throw new Meteor.Error('error-board-doesNotExist');                                                      // 486
    }                                                                                                                 // 487
  });                                                                                                                 // 475
}                                                                                                                     // 489
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 491
  (function () {                                                                                                      // 491
    // Let MongoDB ensure that a member is not included twice in the same board                                       //
    Meteor.startup(function () {                                                                                      // 493
      Boards._collection._ensureIndex({                                                                               // 494
        _id: 1,                                                                                                       // 495
        'members.userId': 1                                                                                           // 496
      }, { unique: true });                                                                                           // 494
    });                                                                                                               // 498
                                                                                                                      //
    // Genesis: the first activity of the newly created board                                                         //
    Boards.after.insert(function (userId, doc) {                                                                      // 501
      if (doc._parentId) {                                                                                            // 502
        if (userId) {                                                                                                 // 503
          Activities.insert({                                                                                         // 504
            userId: userId,                                                                                           // 505
            type: 'board',                                                                                            // 506
            activityTypeId: doc._id,                                                                                  // 507
            activityType: 'copyBoard',                                                                                // 508
            boardId: doc._id,                                                                                         // 509
            oldBoardId: doc._parentId                                                                                 // 510
          });                                                                                                         // 504
        }                                                                                                             // 512
        var allLists = Boards.findOne(doc._parentId).lists().fetch();                                                 // 513
        _.each(allLists, function (list) {                                                                            // 514
          list._parentId = list._id;                                                                                  // 515
          delete list._id;                                                                                            // 516
          delete list.createdAt;                                                                                      // 517
          delete list.modifiedAt;                                                                                     // 518
          list.boardId = doc._id;                                                                                     // 519
          Lists.insert(list);                                                                                         // 520
        });                                                                                                           // 521
      } else {                                                                                                        // 522
        if (userId) {                                                                                                 // 523
          Activities.insert({                                                                                         // 524
            userId: userId,                                                                                           // 525
            type: 'board',                                                                                            // 526
            activityTypeId: doc._id,                                                                                  // 527
            activityType: 'createBoard',                                                                              // 528
            boardId: doc._id                                                                                          // 529
          });                                                                                                         // 524
        }                                                                                                             // 531
      }                                                                                                               // 532
    });                                                                                                               // 533
                                                                                                                      //
    // If the user remove one label from a board, we cant to remove reference of                                      //
    // this label in any card of this board.                                                                          //
    Boards.after.update(function (userId, doc, fieldNames, modifier) {                                                // 537
      if (!_.contains(fieldNames, 'labels') || !modifier.$pull || !modifier.$pull.labels || !modifier.$pull.labels._id) {
        return;                                                                                                       // 542
      }                                                                                                               // 543
                                                                                                                      //
      var removedLabelId = modifier.$pull.labels._id;                                                                 // 545
      Cards.update({ boardId: doc._id }, {                                                                            // 546
        $pull: {                                                                                                      // 549
          labelIds: removedLabelId                                                                                    // 550
        }                                                                                                             // 549
      }, { multi: true });                                                                                            // 548
    });                                                                                                               // 555
                                                                                                                      //
    var foreachRemovedMember = function foreachRemovedMember(doc, modifier, callback) {                               // 557
      Object.keys(modifier).forEach(function (set) {                                                                  // 558
        if (modifier[set] !== false) {                                                                                // 559
          return;                                                                                                     // 560
        }                                                                                                             // 561
                                                                                                                      //
        var parts = set.split('.');                                                                                   // 563
        if (parts.length === 3 && parts[0] === 'members' && parts[2] === 'isActive') {                                // 564
          callback(doc.members[parts[1]].userId);                                                                     // 565
        }                                                                                                             // 566
      });                                                                                                             // 567
    };                                                                                                                // 568
                                                                                                                      //
    // Remove a member from all objects of the board before leaving the board                                         //
    Boards.before.update(function (userId, doc, fieldNames, modifier) {                                               // 571
      if (!_.contains(fieldNames, 'members')) {                                                                       // 572
        return;                                                                                                       // 573
      }                                                                                                               // 574
                                                                                                                      //
      if (modifier.$set) {                                                                                            // 576
        (function () {                                                                                                // 576
          var boardId = doc._id;                                                                                      // 577
          foreachRemovedMember(doc, modifier.$set, function (memberId) {                                              // 578
            Cards.update({ boardId: boardId }, {                                                                      // 579
              $pull: {                                                                                                // 582
                members: memberId,                                                                                    // 583
                watchers: memberId                                                                                    // 584
              }                                                                                                       // 582
            }, { multi: true });                                                                                      // 581
                                                                                                                      //
            Lists.update({ boardId: boardId }, {                                                                      // 590
              $pull: {                                                                                                // 593
                watchers: memberId                                                                                    // 594
              }                                                                                                       // 593
            }, { multi: true });                                                                                      // 592
                                                                                                                      //
            var board = Boards._transform(doc);                                                                       // 600
            board.setWatcher(memberId, false);                                                                        // 601
                                                                                                                      //
            // Remove board from users starred list                                                                   //
            if (!board.isPublic()) {                                                                                  // 604
              Users.update(memberId, {                                                                                // 605
                $pull: {                                                                                              // 608
                  'profile.starredBoards': boardId                                                                    // 609
                }                                                                                                     // 608
              });                                                                                                     // 607
            }                                                                                                         // 613
          });                                                                                                         // 614
        })();                                                                                                         // 576
      }                                                                                                               // 615
    });                                                                                                               // 616
                                                                                                                      //
    // Add a new activity if we add or remove a member to the board                                                   //
    Boards.after.update(function (userId, doc, fieldNames, modifier) {                                                // 619
      if (!_.contains(fieldNames, 'members')) {                                                                       // 620
        return;                                                                                                       // 621
      }                                                                                                               // 622
                                                                                                                      //
      // Say hello to the new member                                                                                  //
      if (modifier.$push && modifier.$push.members) {                                                                 // 625
        var memberId = modifier.$push.members.userId;                                                                 // 626
        Activities.insert({                                                                                           // 627
          userId: userId,                                                                                             // 628
          memberId: memberId,                                                                                         // 629
          type: 'member',                                                                                             // 630
          activityType: 'addBoardMember',                                                                             // 631
          boardId: doc._id                                                                                            // 632
        });                                                                                                           // 627
      }                                                                                                               // 634
                                                                                                                      //
      // Say goodbye to the former member                                                                             //
      if (modifier.$set) {                                                                                            // 637
        foreachRemovedMember(doc, modifier.$set, function (memberId) {                                                // 638
          Activities.insert({                                                                                         // 639
            userId: userId,                                                                                           // 640
            memberId: memberId,                                                                                       // 641
            type: 'member',                                                                                           // 642
            activityType: 'removeBoardMember',                                                                        // 643
            boardId: doc._id                                                                                          // 644
          });                                                                                                         // 639
        });                                                                                                           // 646
      }                                                                                                               // 647
    });                                                                                                               // 648
  })();                                                                                                               // 491
}                                                                                                                     // 649
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cardComments.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/cardComments.js                                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
CardComments = new Mongo.Collection('card_comments');                                                                 // 1
                                                                                                                      //
CardComments.attachSchema(new SimpleSchema({                                                                          // 3
  boardId: {                                                                                                          // 4
    type: String                                                                                                      // 5
  },                                                                                                                  // 4
  cardId: {                                                                                                           // 7
    type: String,                                                                                                     // 8
    optional: true                                                                                                    // 9
  },                                                                                                                  // 7
  listId: {                                                                                                           // 11
    type: String,                                                                                                     // 12
    optional: true                                                                                                    // 13
  },                                                                                                                  // 11
  // XXX Rename in `content`? `text` is a bit vague...                                                                //
  text: {                                                                                                             // 16
    type: String                                                                                                      // 17
  },                                                                                                                  // 16
  // XXX We probably don't need this information here, since we already have it                                       //
  // in the associated comment creation activity                                                                      //
  createdAt: {                                                                                                        // 21
    type: Date,                                                                                                       // 22
    denyUpdate: false,                                                                                                // 23
    autoValue: function autoValue() {                                                                                 // 24
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 25
        return new Date();                                                                                            // 26
      } else {                                                                                                        // 27
        this.unset();                                                                                                 // 28
      }                                                                                                               // 29
    }                                                                                                                 // 30
  },                                                                                                                  // 21
  // XXX Should probably be called `authorId`                                                                         //
  userId: {                                                                                                           // 33
    type: String,                                                                                                     // 34
    autoValue: function autoValue() {                                                                                 // 35
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 36
        return this.userId;                                                                                           // 37
      }                                                                                                               // 38
    }                                                                                                                 // 39
  }                                                                                                                   // 33
}));                                                                                                                  // 3
                                                                                                                      //
CardComments.allow({                                                                                                  // 43
  insert: function insert(userId, doc) {                                                                              // 44
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 45
  },                                                                                                                  // 46
  update: function update(userId, doc) {                                                                              // 47
    return userId === doc.userId;                                                                                     // 48
  },                                                                                                                  // 49
  remove: function remove(userId, doc) {                                                                              // 50
    return userId === doc.userId;                                                                                     // 51
  },                                                                                                                  // 52
                                                                                                                      //
  fetch: ['userId', 'boardId', 'listId']                                                                              // 53
});                                                                                                                   // 43
                                                                                                                      //
CardComments.helpers({                                                                                                // 56
  user: function user() {                                                                                             // 57
    return Users.findOne(this.userId);                                                                                // 58
  }                                                                                                                   // 59
});                                                                                                                   // 56
                                                                                                                      //
CardComments.hookOptions.after.update = { fetchPrevious: false };                                                     // 62
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 64
  // Comments are often fetched within a card, so we create an index to make these                                    //
  // queries more efficient.                                                                                          //
  Meteor.startup(function () {                                                                                        // 67
    CardComments._collection._ensureIndex({ cardId: 1, createdAt: -1 });                                              // 68
  });                                                                                                                 // 69
                                                                                                                      //
  CardComments.after.insert(function (userId, doc) {                                                                  // 71
    Activities.insert({                                                                                               // 72
      userId: userId,                                                                                                 // 73
      activityType: 'addComment',                                                                                     // 74
      boardId: doc.boardId,                                                                                           // 75
      cardId: doc.cardId,                                                                                             // 76
      listId: doc.listId,                                                                                             // 77
      commentId: doc._id                                                                                              // 78
    });                                                                                                               // 72
  });                                                                                                                 // 80
                                                                                                                      //
  CardComments.after.remove(function (userId, doc) {                                                                  // 82
    var activity = Activities.findOne({ commentId: doc._id });                                                        // 83
    if (activity) {                                                                                                   // 84
      Activities.remove(activity._id);                                                                                // 85
    }                                                                                                                 // 86
  });                                                                                                                 // 87
}                                                                                                                     // 88
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cards.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/cards.js                                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Cards = new Mongo.Collection('cards');                                                                                // 1
                                                                                                                      //
// XXX To improve pub/sub performances a card document should include a                                               //
// de-normalized number of comments so we don't have to publish the whole list                                        //
// of comments just to display the number of them in the board view.                                                  //
Cards.attachSchema(new SimpleSchema({                                                                                 // 6
  title: {                                                                                                            // 7
    type: String                                                                                                      // 8
  },                                                                                                                  // 7
  archived: {                                                                                                         // 10
    type: Boolean,                                                                                                    // 11
    autoValue: function autoValue() {                                                                                 // 12
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 13
        return false;                                                                                                 // 14
      }                                                                                                               // 15
    }                                                                                                                 // 16
  },                                                                                                                  // 10
  listId: {                                                                                                           // 18
    type: String                                                                                                      // 19
  },                                                                                                                  // 18
  // The system could work without this `boardId` information (we could deduce                                        //
  // the board identifier from the card), but it would make the system more                                           //
  // difficult to manage and less efficient.                                                                          //
  boardId: {                                                                                                          // 24
    type: String                                                                                                      // 25
  },                                                                                                                  // 24
  formOcoid: {                                                                                                        // 27
    type: String                                                                                                      // 28
  },                                                                                                                  // 27
  coverId: {                                                                                                          // 30
    type: String,                                                                                                     // 31
    optional: true                                                                                                    // 32
  },                                                                                                                  // 30
  form_id: {                                                                                                          // 34
    type: Number                                                                                                      // 35
  },                                                                                                                  // 34
  createdAt: {                                                                                                        // 37
    type: Date,                                                                                                       // 38
    autoValue: function autoValue() {                                                                                 // 39
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 40
        return new Date();                                                                                            // 41
      } else {                                                                                                        // 42
        this.unset();                                                                                                 // 43
      }                                                                                                               // 44
    }                                                                                                                 // 45
  },                                                                                                                  // 37
  dateLastActivity: {                                                                                                 // 47
    type: Date,                                                                                                       // 48
    autoValue: function autoValue() {                                                                                 // 49
      return new Date();                                                                                              // 50
    }                                                                                                                 // 51
  },                                                                                                                  // 47
  description: {                                                                                                      // 53
    type: String,                                                                                                     // 54
    optional: true,                                                                                                   // 55
    autoValue: function autoValue() {                                                                                 // 56
      if (this.isInsert && !this.isSet) {                                                                             // 57
        return "";                                                                                                    // 58
      }                                                                                                               // 59
    }                                                                                                                 // 60
  },                                                                                                                  // 53
  labelIds: {                                                                                                         // 62
    type: [String],                                                                                                   // 63
    optional: true                                                                                                    // 64
  },                                                                                                                  // 62
  members: {                                                                                                          // 66
    type: [String],                                                                                                   // 67
    optional: true                                                                                                    // 68
  },                                                                                                                  // 66
  startAt: {                                                                                                          // 70
    type: Date,                                                                                                       // 71
    optional: true                                                                                                    // 72
  },                                                                                                                  // 70
  dueAt: {                                                                                                            // 74
    type: Date,                                                                                                       // 75
    optional: true                                                                                                    // 76
  },                                                                                                                  // 74
  // XXX Should probably be called `authorId`. Is it even needed since we have                                        //
  // the `members` field?                                                                                             //
  userId: {                                                                                                           // 80
    type: String,                                                                                                     // 81
    autoValue: function autoValue() {                                                                                 // 82
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 83
        return this.userId;                                                                                           // 84
      }                                                                                                               // 85
    }                                                                                                                 // 86
  },                                                                                                                  // 80
  sort: {                                                                                                             // 88
    type: Number,                                                                                                     // 89
    decimal: true                                                                                                     // 90
  },                                                                                                                  // 88
  selected_form_version_id: {                                                                                         // 92
    type: Number,                                                                                                     // 93
    optional: true                                                                                                    // 94
  },                                                                                                                  // 92
  previewUrl: {                                                                                                       // 96
    type: String,                                                                                                     // 97
    optional: true                                                                                                    // 98
  },                                                                                                                  // 96
  versions: {                                                                                                         // 100
    type: [Object],                                                                                                   // 101
    optional: true                                                                                                    // 102
  },                                                                                                                  // 100
  'versions.$.id': {                                                                                                  // 104
    type: Number                                                                                                      // 105
  },                                                                                                                  // 104
  'versions.$.ocoid': {                                                                                               // 107
    type: String                                                                                                      // 108
  },                                                                                                                  // 107
  'versions.$.name': {                                                                                                // 110
    type: String                                                                                                      // 111
  },                                                                                                                  // 110
  'versions.$.description': {                                                                                         // 113
    type: String,                                                                                                     // 114
    optional: true                                                                                                    // 115
  },                                                                                                                  // 113
  'versions.$.previewURL': {                                                                                          // 117
    type: String,                                                                                                     // 118
    optional: true                                                                                                    // 119
  },                                                                                                                  // 117
  'versions.$.artifactURL': {                                                                                         // 121
    type: String,                                                                                                     // 122
    optional: true                                                                                                    // 123
  },                                                                                                                  // 121
  'versions.$.fileLinks': {                                                                                           // 125
    type: [String],                                                                                                   // 126
    optional: true                                                                                                    // 127
  },                                                                                                                  // 125
  'versions.$.archived': {                                                                                            // 129
    type: Boolean,                                                                                                    // 130
    autoValue: function autoValue() {                                                                                 // 131
      if (this.isInsert && !this.isSet) {                                                                             // 132
        return false;                                                                                                 // 133
      }                                                                                                               // 134
    }                                                                                                                 // 135
  },                                                                                                                  // 129
  'versions.$.uploadedFileLinks': {                                                                                   // 137
    type: [String],                                                                                                   // 138
    optional: true                                                                                                    // 139
  },                                                                                                                  // 137
  hidden: {                                                                                                           // 141
    type: Boolean,                                                                                                    // 142
    autoValue: function autoValue() {                                                                                 // 143
      if (this.isInsert && !this.isSet) {                                                                             // 144
        return false;                                                                                                 // 145
      }                                                                                                               // 146
    }                                                                                                                 // 147
  },                                                                                                                  // 141
  required: {                                                                                                         // 149
    type: Boolean,                                                                                                    // 150
    autoValue: function autoValue() {                                                                                 // 151
      if (this.isInsert && !this.isSet) {                                                                             // 152
        return false;                                                                                                 // 153
      }                                                                                                               // 154
    }                                                                                                                 // 155
  },                                                                                                                  // 149
  participate: {                                                                                                      // 157
    type: Boolean,                                                                                                    // 158
    autoValue: function autoValue() {                                                                                 // 159
      if (this.isInsert && !this.isSet) {                                                                             // 160
        return false;                                                                                                 // 161
      }                                                                                                               // 162
    }                                                                                                                 // 163
  },                                                                                                                  // 157
  anonymous: {                                                                                                        // 165
    type: Boolean,                                                                                                    // 166
    autoValue: function autoValue() {                                                                                 // 167
      if (this.isInsert && !this.isSet) {                                                                             // 168
        return false;                                                                                                 // 169
      }                                                                                                               // 170
    }                                                                                                                 // 171
  },                                                                                                                  // 165
  offline: {                                                                                                          // 173
    type: Boolean,                                                                                                    // 174
    autoValue: function autoValue() {                                                                                 // 175
      if (this.isInsert && !this.isSet) {                                                                             // 176
        return false;                                                                                                 // 177
      }                                                                                                               // 178
    }                                                                                                                 // 179
  },                                                                                                                  // 173
  submissionUri: {                                                                                                    // 181
    type: String,                                                                                                     // 182
    optional: true                                                                                                    // 183
  },                                                                                                                  // 181
  _parentId: {                                                                                                        // 185
    type: String,                                                                                                     // 186
    optional: true                                                                                                    // 187
  },                                                                                                                  // 185
  lastModifiedVersionName: {                                                                                          // 189
    type: String,                                                                                                     // 190
    optional: true                                                                                                    // 191
  },                                                                                                                  // 189
  lastModifiedVersionStatus: {                                                                                        // 193
    type: String,                                                                                                     // 194
    optional: true                                                                                                    // 195
  }                                                                                                                   // 193
                                                                                                                      //
}));                                                                                                                  // 6
                                                                                                                      //
Cards.allow({                                                                                                         // 200
  insert: function insert(userId, doc) {                                                                              // 201
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 202
  },                                                                                                                  // 203
  update: function update(userId, doc) {                                                                              // 204
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 205
  },                                                                                                                  // 206
  remove: function remove(userId, doc) {                                                                              // 207
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 208
  },                                                                                                                  // 209
                                                                                                                      //
  fetch: ['boardId']                                                                                                  // 210
});                                                                                                                   // 200
                                                                                                                      //
Cards.helpers({                                                                                                       // 213
  list: function list() {                                                                                             // 214
    return Lists.findOne(this.listId);                                                                                // 215
  },                                                                                                                  // 216
  board: function board() {                                                                                           // 218
    return Boards.findOne(this.boardId);                                                                              // 219
  },                                                                                                                  // 220
  labels: function labels() {                                                                                         // 222
    var _this = this;                                                                                                 // 222
                                                                                                                      //
    var boardLabels = this.board().labels;                                                                            // 223
    var cardLabels = _.filter(boardLabels, function (label) {                                                         // 224
      return _.contains(_this.labelIds, label._id);                                                                   // 225
    });                                                                                                               // 226
    return cardLabels;                                                                                                // 227
  },                                                                                                                  // 228
  hasLabel: function hasLabel(labelId) {                                                                              // 230
    return _.contains(this.labelIds, labelId);                                                                        // 231
  },                                                                                                                  // 232
  user: function user() {                                                                                             // 234
    return Users.findOne(this.userId);                                                                                // 235
  },                                                                                                                  // 236
  isAssigned: function isAssigned(memberId) {                                                                         // 238
    return _.contains(this.members, memberId);                                                                        // 239
  },                                                                                                                  // 240
  activities: function activities() {                                                                                 // 242
    return Activities.find({ cardId: this._id }, { sort: { createdAt: -1 } });                                        // 243
  },                                                                                                                  // 244
  comments: function comments() {                                                                                     // 246
    return CardComments.find({ cardId: this._id }, { sort: { createdAt: -1 } });                                      // 247
  },                                                                                                                  // 248
  attachments: function attachments() {                                                                               // 250
    return Attachments.find({ cardId: this._id }, { sort: { uploadedAt: -1 } });                                      // 251
  },                                                                                                                  // 252
  cover: function cover() {                                                                                           // 257
    var cover = Attachments.findOne(this.coverId);                                                                    // 258
    // if we return a cover before it is fully stored, we will get errors when we try to display it                   //
    // todo XXX we could return a default "upload pending" image in the meantime?                                     //
    return cover && cover.url() && cover;                                                                             // 261
  },                                                                                                                  // 262
  checklists: function checklists() {                                                                                 // 264
    return Checklists.find({ cardId: this._id }, { sort: { createdAt: 1 } });                                         // 265
  },                                                                                                                  // 266
  checklistItemCount: function checklistItemCount() {                                                                 // 268
    var checklists = this.checklists().fetch();                                                                       // 269
    return checklists.map(function (checklist) {                                                                      // 270
      return checklist.itemCount();                                                                                   // 271
    }).reduce(function (prev, next) {                                                                                 // 272
      return prev + next;                                                                                             // 273
    }, 0);                                                                                                            // 274
  },                                                                                                                  // 275
  checklistFinishedCount: function checklistFinishedCount() {                                                         // 277
    var checklists = this.checklists().fetch();                                                                       // 278
    return checklists.map(function (checklist) {                                                                      // 279
      return checklist.finishedCount();                                                                               // 280
    }).reduce(function (prev, next) {                                                                                 // 281
      return prev + next;                                                                                             // 282
    }, 0);                                                                                                            // 283
  },                                                                                                                  // 284
  checklistFinished: function checklistFinished() {                                                                   // 286
    return this.hasChecklist() && this.checklistItemCount() === this.checklistFinishedCount();                        // 287
  },                                                                                                                  // 288
  hasChecklist: function hasChecklist() {                                                                             // 290
    return this.checklistItemCount() !== 0;                                                                           // 291
  },                                                                                                                  // 292
  absoluteUrl: function absoluteUrl() {                                                                               // 294
    var board = this.board();                                                                                         // 295
    return FlowRouter.url('card', {                                                                                   // 296
      boardId: board._id,                                                                                             // 297
      slug: board.slug,                                                                                               // 298
      cardId: this._id                                                                                                // 299
    });                                                                                                               // 296
  },                                                                                                                  // 301
  version: function version() {                                                                                       // 303
    var _this2 = this;                                                                                                // 303
                                                                                                                      //
    return _.find(this.versions, function (version) {                                                                 // 304
      return _this2.selected_form_version_id === version.id;                                                          // 305
    });                                                                                                               // 306
  },                                                                                                                  // 307
  versionIndex: function versionIndex(id) {                                                                           // 309
    return _.pluck(this.versions, 'id').indexOf(id);                                                                  // 310
  },                                                                                                                  // 311
  isArchivedVersion: function isArchivedVersion(id) {                                                                 // 313
    var versionIndex = this.versionIndex(id);                                                                         // 314
    if (versionIndex === -1 || this.versions[versionIndex].archived === undefined) {                                  // 315
      return false;                                                                                                   // 316
    } else {                                                                                                          // 317
      return false || this.versions[versionIndex].archived;                                                           // 318
    }                                                                                                                 // 319
  },                                                                                                                  // 320
  activeVersions: function activeVersions() {                                                                         // 322
    return _.filter(this.versions, function (version) {                                                               // 323
      return !version.archived;                                                                                       // 324
    });                                                                                                               // 325
  },                                                                                                                  // 326
  archivedVersions: function archivedVersions() {                                                                     // 328
    return _.filter(this.versions, function (version) {                                                               // 329
      return version.archived;                                                                                        // 330
    });                                                                                                               // 331
  },                                                                                                                  // 332
  checkArchivedVersions: function checkArchivedVersions() {                                                           // 334
    var checks = _.filter(this.versions, function (version) {                                                         // 335
      return version.archived;                                                                                        // 336
    });                                                                                                               // 337
    return checks.length > 0;                                                                                         // 338
  }                                                                                                                   // 339
});                                                                                                                   // 213
                                                                                                                      //
Cards.mutations({                                                                                                     // 342
  archive: function archive() {                                                                                       // 343
    return { $set: { archived: true } };                                                                              // 344
  },                                                                                                                  // 345
  restore: function restore() {                                                                                       // 347
    return { $set: { archived: false } };                                                                             // 348
  },                                                                                                                  // 349
  setTitle: function setTitle(title) {                                                                                // 351
    return { $set: { title: title } };                                                                                // 352
  },                                                                                                                  // 353
  setDescription: function setDescription(description) {                                                              // 355
    return { $set: { description: description } };                                                                    // 356
  },                                                                                                                  // 357
  move: function move(listId, sortIndex) {                                                                            // 359
    var mutatedFields = { listId: listId };                                                                           // 360
    if (sortIndex !== undefined) {                                                                                    // 361
      mutatedFields.sort = parseInt(sortIndex);                                                                       // 362
    }                                                                                                                 // 363
    return { $set: mutatedFields };                                                                                   // 364
  },                                                                                                                  // 365
  addLabel: function addLabel(labelId) {                                                                              // 367
    return { $addToSet: { labelIds: labelId } };                                                                      // 368
  },                                                                                                                  // 369
  removeLabel: function removeLabel(labelId) {                                                                        // 371
    return { $pull: { labelIds: labelId } };                                                                          // 372
  },                                                                                                                  // 373
  toggleLabel: function toggleLabel(labelId) {                                                                        // 375
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {                                                       // 376
      return this.removeLabel(labelId);                                                                               // 377
    } else {                                                                                                          // 378
      return this.addLabel(labelId);                                                                                  // 379
    }                                                                                                                 // 380
  },                                                                                                                  // 381
  assignMember: function assignMember(memberId) {                                                                     // 383
    return { $addToSet: { members: memberId } };                                                                      // 384
  },                                                                                                                  // 385
  unassignMember: function unassignMember(memberId) {                                                                 // 387
    return { $pull: { members: memberId } };                                                                          // 388
  },                                                                                                                  // 389
  toggleMember: function toggleMember(memberId) {                                                                     // 391
    if (this.members && this.members.indexOf(memberId) > -1) {                                                        // 392
      return this.unassignMember(memberId);                                                                           // 393
    } else {                                                                                                          // 394
      return this.assignMember(memberId);                                                                             // 395
    }                                                                                                                 // 396
  },                                                                                                                  // 397
  setCover: function setCover(coverId) {                                                                              // 399
    return { $set: { coverId: coverId } };                                                                            // 400
  },                                                                                                                  // 401
  unsetCover: function unsetCover() {                                                                                 // 403
    return { $unset: { coverId: '' } };                                                                               // 404
  },                                                                                                                  // 405
  setVersion: function setVersion(selected_form_version_id) {                                                         // 407
    return { $set: { selected_form_version_id: selected_form_version_id } };                                          // 408
  },                                                                                                                  // 409
  setSubmissionUri: function setSubmissionUri(submissionUri) {                                                        // 411
    return { $set: { submissionUri: submissionUri } };                                                                // 412
  },                                                                                                                  // 413
  setHidden: function setHidden(hidden) {                                                                             // 415
    return { $set: { hidden: hidden } };                                                                              // 416
  },                                                                                                                  // 417
  setRequired: function setRequired(required) {                                                                       // 419
    return { $set: { required: required } };                                                                          // 420
  },                                                                                                                  // 421
  setParticipate: function setParticipate(participate) {                                                              // 423
    return { $set: { participate: participate } };                                                                    // 424
  },                                                                                                                  // 425
  setAnonymous: function setAnonymous(anonymous) {                                                                    // 427
    return { $set: { anonymous: anonymous } };                                                                        // 428
  },                                                                                                                  // 429
  setOffline: function setOffline(offline) {                                                                          // 431
    return { $set: { offline: offline } };                                                                            // 432
  },                                                                                                                  // 433
  setPreviewUrl: function setPreviewUrl(previewUrl) {                                                                 // 435
    return { $set: { previewUrl: previewUrl } };                                                                      // 436
  },                                                                                                                  // 437
  setVersions: function setVersions(versions) {                                                                       // 439
    return { $set: { versions: versions } };                                                                          // 440
  },                                                                                                                  // 441
  removeVersion: function removeVersion(id) {                                                                         // 443
    var _$set;                                                                                                        // 443
                                                                                                                      //
    var versionIndex = this.versionIndex(id);                                                                         // 444
    return {                                                                                                          // 445
      $set: (_$set = {}, _$set['versions.' + versionIndex + '.archived'] = true, _$set.lastModifiedVersionName = this.versions[versionIndex].name, _$set.lastModifiedVersionStatus = 'archived', _$set)
    };                                                                                                                // 445
  },                                                                                                                  // 452
  restoreVersion: function restoreVersion(id) {                                                                       // 454
    var _$set2;                                                                                                       // 454
                                                                                                                      //
    var versionIndex = this.versionIndex(id);                                                                         // 455
    return {                                                                                                          // 456
      $set: (_$set2 = {}, _$set2['versions.' + versionIndex + '.archived'] = false, _$set2.lastModifiedVersionName = this.versions[versionIndex].name, _$set2.lastModifiedVersionStatus = 'restore', _$set2)
    };                                                                                                                // 456
  },                                                                                                                  // 463
  setStart: function setStart(startAt) {                                                                              // 465
    return { $set: { startAt: startAt } };                                                                            // 466
  },                                                                                                                  // 467
  unsetStart: function unsetStart() {                                                                                 // 469
    return { $unset: { startAt: '' } };                                                                               // 470
  },                                                                                                                  // 471
  setDue: function setDue(dueAt) {                                                                                    // 473
    return { $set: { dueAt: dueAt } };                                                                                // 474
  },                                                                                                                  // 475
  unsetDue: function unsetDue() {                                                                                     // 477
    return { $unset: { dueAt: '' } };                                                                                 // 478
  }                                                                                                                   // 479
});                                                                                                                   // 342
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 482
  // Cards are often fetched within a board, so we create an index to make these                                      //
  // queries more efficient.                                                                                          //
  Meteor.startup(function () {                                                                                        // 485
    Cards._collection._ensureIndex({ boardId: 1 });                                                                   // 486
  });                                                                                                                 // 487
                                                                                                                      //
  Cards.after.insert(function (userId, doc) {                                                                         // 489
    // auto remove archived form with same title in current event                                                     //
    var archivedForms = Cards.find({ boardId: doc.boardId, listId: doc.listId, title: { $regex: new RegExp("^" + doc.title + "$", "i") }, archived: true }).fetch();
    _.each(archivedForms, function (form, index) {                                                                    // 492
      Cards.remove(form._id);                                                                                         // 493
    });                                                                                                               // 494
                                                                                                                      //
    if (doc._parentId) {                                                                                              // 496
      var oldCard = Cards.findOne(doc._parentId);                                                                     // 497
      if (userId) {                                                                                                   // 498
        Activities.insert({                                                                                           // 499
          userId: userId,                                                                                             // 500
          activityType: 'copyCardClone',                                                                              // 501
          listId: doc.listId,                                                                                         // 502
          cardId: doc._id,                                                                                            // 503
          oldCardId: doc._parentId,                                                                                   // 504
          oldListId: oldCard.listId                                                                                   // 505
        });                                                                                                           // 499
                                                                                                                      //
        Activities.insert({                                                                                           // 508
          userId: userId,                                                                                             // 509
          activityType: 'copyCardOriginal',                                                                           // 510
          boardId: oldCard.boardId,                                                                                   // 511
          listId: oldCard.listId,                                                                                     // 512
          cardId: doc._parentId,                                                                                      // 513
          newCardId: doc._id,                                                                                         // 514
          newListId: doc.listId                                                                                       // 515
        });                                                                                                           // 508
      }                                                                                                               // 517
    } else {                                                                                                          // 518
      if (userId) {                                                                                                   // 519
        Activities.insert({                                                                                           // 520
          userId: userId,                                                                                             // 521
          activityType: 'createCard',                                                                                 // 522
          boardId: doc.boardId,                                                                                       // 523
          listId: doc.listId,                                                                                         // 524
          cardId: doc._id                                                                                             // 525
        });                                                                                                           // 520
      }                                                                                                               // 527
    }                                                                                                                 // 528
  });                                                                                                                 // 529
                                                                                                                      //
  // New activity for card (un)archivage                                                                              //
  Cards.after.update(function (userId, doc, fieldNames, modifier) {                                                   // 532
    if (_.contains(fieldNames, 'archived')) {                                                                         // 533
      if (doc.archived) {                                                                                             // 534
        Activities.insert({                                                                                           // 535
          userId: userId,                                                                                             // 536
          activityType: 'archivedCard',                                                                               // 537
          boardId: doc.boardId,                                                                                       // 538
          listId: doc.listId,                                                                                         // 539
          cardId: doc._id                                                                                             // 540
        });                                                                                                           // 535
      } else {                                                                                                        // 542
        Activities.insert({                                                                                           // 543
          userId: userId,                                                                                             // 544
          activityType: 'restoredCard',                                                                               // 545
          boardId: doc.boardId,                                                                                       // 546
          listId: doc.listId,                                                                                         // 547
          cardId: doc._id                                                                                             // 548
        });                                                                                                           // 543
      }                                                                                                               // 550
    }                                                                                                                 // 551
                                                                                                                      //
    var oldCardTitle = this.previous.title;                                                                           // 553
    if (_.contains(fieldNames, 'title')) {                                                                            // 554
      Activities.insert({                                                                                             // 555
        userId: userId,                                                                                               // 556
        oldCardTitle: oldCardTitle,                                                                                   // 557
        activityType: 'renameCard',                                                                                   // 558
        boardId: doc.boardId,                                                                                         // 559
        listId: doc.listId,                                                                                           // 560
        cardId: doc._id                                                                                               // 561
      });                                                                                                             // 555
    }                                                                                                                 // 563
                                                                                                                      //
    var oldCardDescription = this.previous.description || "no description";                                           // 565
    if (_.contains(fieldNames, 'description')) {                                                                      // 566
      Activities.insert({                                                                                             // 567
        userId: userId,                                                                                               // 568
        oldCardDescription: oldCardDescription,                                                                       // 569
        activityType: 'updateDescriptionCard',                                                                        // 570
        boardId: doc.boardId,                                                                                         // 571
        listId: doc.listId,                                                                                           // 572
        cardId: doc._id                                                                                               // 573
      });                                                                                                             // 567
    }                                                                                                                 // 575
                                                                                                                      //
    // New activity for card moves                                                                                    //
    var oldListId = this.previous.listId;                                                                             // 578
    if (_.contains(fieldNames, 'listId') && doc.listId !== oldListId) {                                               // 579
      Activities.insert({                                                                                             // 580
        userId: userId,                                                                                               // 581
        oldListId: oldListId,                                                                                         // 582
        activityType: 'moveCard',                                                                                     // 583
        listId: doc.listId,                                                                                           // 584
        boardId: doc.boardId,                                                                                         // 585
        cardId: doc._id                                                                                               // 586
      });                                                                                                             // 580
                                                                                                                      //
      // auto remove archived form with same title in current event                                                   //
      var archivedForms = Cards.find({ boardId: doc.boardId, listId: doc.listId, title: { $regex: new RegExp("^" + doc.title + "$", "i") }, archived: true }).fetch();
      _.each(archivedForms, function (form, index) {                                                                  // 591
        Cards.remove(form._id);                                                                                       // 592
      });                                                                                                             // 593
    }                                                                                                                 // 594
                                                                                                                      //
    if (_.contains(fieldNames, 'hidden') || _.contains(fieldNames, 'required') || _.contains(fieldNames, 'participate') || _.contains(fieldNames, 'anonymous') || _.contains(fieldNames, 'offline')) {
      Activities.insert({                                                                                             // 597
        userId: userId,                                                                                               // 598
        activityType: 'updateCardProperties',                                                                         // 599
        boardId: doc.boardId,                                                                                         // 600
        listId: doc.listId,                                                                                           // 601
        cardId: doc._id                                                                                               // 602
      });                                                                                                             // 597
    }                                                                                                                 // 604
                                                                                                                      //
    if (_.contains(fieldNames, 'sort')) {                                                                             // 606
      Activities.insert({                                                                                             // 607
        userId: userId,                                                                                               // 608
        activityType: 'updateOrderCard',                                                                              // 609
        cardId: doc._id,                                                                                              // 610
        boardId: doc.boardId,                                                                                         // 611
        listId: doc.listId,                                                                                           // 612
        sort: doc.sort                                                                                                // 613
      });                                                                                                             // 607
    }                                                                                                                 // 615
                                                                                                                      //
    if (_.contains(fieldNames, 'selected_form_version_id')) {                                                         // 617
      var versionName = _.find(doc.versions, function (version) {                                                     // 618
        return doc.selected_form_version_id === version.id;                                                           // 619
      }).name;                                                                                                        // 620
      Activities.insert({                                                                                             // 621
        userId: userId,                                                                                               // 622
        activityType: 'updateDefaultVersion',                                                                         // 623
        cardId: doc._id,                                                                                              // 624
        boardId: doc.boardId,                                                                                         // 625
        listId: doc.listId,                                                                                           // 626
        versionName: versionName                                                                                      // 627
      });                                                                                                             // 621
    }                                                                                                                 // 629
  });                                                                                                                 // 630
                                                                                                                      //
  // Add a new activity if we add or remove a member to the card                                                      //
  Cards.before.update(function (userId, doc, fieldNames, modifier) {                                                  // 633
    if (_.contains(fieldNames, 'versions')) {                                                                         // 634
      if (modifier.$set.versions) {                                                                                   // 635
        if (modifier.$set.versions.length !== doc.versions.length) {                                                  // 636
          Activities.insert({                                                                                         // 637
            userId: userId,                                                                                           // 638
            activityType: 'addVersionCard',                                                                           // 639
            boardId: doc.boardId,                                                                                     // 640
            listId: doc.listId,                                                                                       // 641
            cardId: doc._id,                                                                                          // 642
            versionName: modifier.$set.versions[modifier.$set.versions.length - 1].name                               // 643
          });                                                                                                         // 637
        } else {                                                                                                      // 645
          Activities.insert({                                                                                         // 646
            userId: userId,                                                                                           // 647
            activityType: 'updateVersionCard',                                                                        // 648
            boardId: doc.boardId,                                                                                     // 649
            listId: doc.listId,                                                                                       // 650
            cardId: doc._id                                                                                           // 651
          });                                                                                                         // 646
        }                                                                                                             // 653
      } else {                                                                                                        // 654
        if (modifier.$set.lastModifiedVersionStatus === 'archived') Activities.insert({                               // 655
          userId: userId,                                                                                             // 657
          activityType: 'archiveVersionCard',                                                                         // 658
          boardId: doc.boardId,                                                                                       // 659
          listId: doc.listId,                                                                                         // 660
          cardId: doc._id,                                                                                            // 661
          versionName: modifier.$set.lastModifiedVersionName                                                          // 662
        });else Activities.insert({                                                                                   // 656
          userId: userId,                                                                                             // 666
          activityType: 'restoreVersionCard',                                                                         // 667
          boardId: doc.boardId,                                                                                       // 668
          listId: doc.listId,                                                                                         // 669
          cardId: doc._id,                                                                                            // 670
          versionName: modifier.$set.lastModifiedVersionName                                                          // 671
        });                                                                                                           // 665
      }                                                                                                               // 673
    }                                                                                                                 // 674
                                                                                                                      //
    if (!_.contains(fieldNames, 'members')) return;                                                                   // 676
    var memberId = void 0;                                                                                            // 678
    // Say hello to the new member                                                                                    //
    if (modifier.$addToSet && modifier.$addToSet.members) {                                                           // 680
      memberId = modifier.$addToSet.members;                                                                          // 681
      if (!_.contains(doc.members, memberId)) {                                                                       // 682
        Activities.insert({                                                                                           // 683
          userId: userId,                                                                                             // 684
          memberId: memberId,                                                                                         // 685
          activityType: 'joinMember',                                                                                 // 686
          boardId: doc.boardId,                                                                                       // 687
          cardId: doc._id                                                                                             // 688
        });                                                                                                           // 683
      }                                                                                                               // 690
    }                                                                                                                 // 691
                                                                                                                      //
    // Say goodbye to the former member                                                                               //
    if (modifier.$pull && modifier.$pull.members) {                                                                   // 694
      memberId = modifier.$pull.members;                                                                              // 695
      Activities.insert({                                                                                             // 696
        userId: userId,                                                                                               // 697
        memberId: memberId,                                                                                           // 698
        activityType: 'unjoinMember',                                                                                 // 699
        boardId: doc.boardId,                                                                                         // 700
        cardId: doc._id                                                                                               // 701
      });                                                                                                             // 696
    }                                                                                                                 // 703
  });                                                                                                                 // 705
                                                                                                                      //
  // Remove all activities associated with a card if we remove the card                                               //
  Cards.after.remove(function (userId, doc) {                                                                         // 708
    Activities.remove({                                                                                               // 709
      cardId: doc._id                                                                                                 // 710
    });                                                                                                               // 709
  });                                                                                                                 // 712
}                                                                                                                     // 713
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checklists.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/checklists.js                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Checklists = new Mongo.Collection('checklists');                                                                      // 1
                                                                                                                      //
Checklists.attachSchema(new SimpleSchema({                                                                            // 3
  cardId: {                                                                                                           // 4
    type: String                                                                                                      // 5
  },                                                                                                                  // 4
  title: {                                                                                                            // 7
    type: String                                                                                                      // 8
  },                                                                                                                  // 7
  items: {                                                                                                            // 10
    type: [Object],                                                                                                   // 11
    defaultValue: []                                                                                                  // 12
  },                                                                                                                  // 10
  'items.$._id': {                                                                                                    // 14
    type: String                                                                                                      // 15
  },                                                                                                                  // 14
  'items.$.title': {                                                                                                  // 17
    type: String                                                                                                      // 18
  },                                                                                                                  // 17
  'items.$.isFinished': {                                                                                             // 20
    type: Boolean,                                                                                                    // 21
    defaultValue: false                                                                                               // 22
  },                                                                                                                  // 20
  finishedAt: {                                                                                                       // 24
    type: Date,                                                                                                       // 25
    optional: true                                                                                                    // 26
  },                                                                                                                  // 24
  createdAt: {                                                                                                        // 28
    type: Date,                                                                                                       // 29
    denyUpdate: false                                                                                                 // 30
  }                                                                                                                   // 28
}));                                                                                                                  // 3
                                                                                                                      //
Checklists.helpers({                                                                                                  // 34
  itemCount: function itemCount() {                                                                                   // 35
    return this.items.length;                                                                                         // 36
  },                                                                                                                  // 37
  finishedCount: function finishedCount() {                                                                           // 38
    return this.items.filter(function (item) {                                                                        // 39
      return item.isFinished;                                                                                         // 40
    }).length;                                                                                                        // 41
  },                                                                                                                  // 42
  isFinished: function isFinished() {                                                                                 // 43
    return 0 !== this.itemCount() && this.itemCount() === this.finishedCount();                                       // 44
  },                                                                                                                  // 45
  getItem: function getItem(_id) {                                                                                    // 46
    return _.findWhere(this.items, { _id: _id });                                                                     // 47
  },                                                                                                                  // 48
  itemIndex: function itemIndex(itemId) {                                                                             // 49
    return _.pluck(this.items, '_id').indexOf(itemId);                                                                // 50
  }                                                                                                                   // 51
});                                                                                                                   // 34
                                                                                                                      //
Checklists.allow({                                                                                                    // 54
  insert: function insert(userId, doc) {                                                                              // 55
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));                                               // 56
  },                                                                                                                  // 57
  update: function update(userId, doc) {                                                                              // 58
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));                                               // 59
  },                                                                                                                  // 60
  remove: function remove(userId, doc) {                                                                              // 61
    return allowIsBoardMemberByCard(userId, Cards.findOne(doc.cardId));                                               // 62
  },                                                                                                                  // 63
                                                                                                                      //
  fetch: ['userId', 'cardId']                                                                                         // 64
});                                                                                                                   // 54
                                                                                                                      //
Checklists.before.insert(function (userId, doc) {                                                                     // 67
  doc.createdAt = new Date();                                                                                         // 68
  if (!doc.userId) {                                                                                                  // 69
    doc.userId = userId;                                                                                              // 70
  }                                                                                                                   // 71
});                                                                                                                   // 72
                                                                                                                      //
Checklists.mutations({                                                                                                // 74
  //for checklist itself                                                                                              //
                                                                                                                      //
  setTitle: function setTitle(title) {                                                                                // 76
    return { $set: { title: title } };                                                                                // 77
  },                                                                                                                  // 78
                                                                                                                      //
  //for items in checklist                                                                                            //
  addItem: function addItem(title) {                                                                                  // 80
    var itemCount = this.itemCount();                                                                                 // 81
    var _id = '' + this._id + itemCount;                                                                              // 82
    return { $addToSet: { items: { _id: _id, title: title, isFinished: false } } };                                   // 83
  },                                                                                                                  // 84
  removeItem: function removeItem(itemId) {                                                                           // 85
    return { $pull: { items: { _id: itemId } } };                                                                     // 86
  },                                                                                                                  // 87
  editItem: function editItem(itemId, title) {                                                                        // 88
    if (this.getItem(itemId)) {                                                                                       // 89
      var _$set;                                                                                                      // 89
                                                                                                                      //
      var itemIndex = this.itemIndex(itemId);                                                                         // 90
      return {                                                                                                        // 91
        $set: (_$set = {}, _$set['items.' + itemIndex + '.title'] = title, _$set)                                     // 92
      };                                                                                                              // 91
    }                                                                                                                 // 96
    return {};                                                                                                        // 97
  },                                                                                                                  // 98
  finishItem: function finishItem(itemId) {                                                                           // 99
    if (this.getItem(itemId)) {                                                                                       // 100
      var _$set2;                                                                                                     // 100
                                                                                                                      //
      var itemIndex = this.itemIndex(itemId);                                                                         // 101
      return {                                                                                                        // 102
        $set: (_$set2 = {}, _$set2['items.' + itemIndex + '.isFinished'] = true, _$set2)                              // 103
      };                                                                                                              // 102
    }                                                                                                                 // 107
    return {};                                                                                                        // 108
  },                                                                                                                  // 109
  resumeItem: function resumeItem(itemId) {                                                                           // 110
    if (this.getItem(itemId)) {                                                                                       // 111
      var _$set3;                                                                                                     // 111
                                                                                                                      //
      var itemIndex = this.itemIndex(itemId);                                                                         // 112
      return {                                                                                                        // 113
        $set: (_$set3 = {}, _$set3['items.' + itemIndex + '.isFinished'] = false, _$set3)                             // 114
      };                                                                                                              // 113
    }                                                                                                                 // 118
    return {};                                                                                                        // 119
  },                                                                                                                  // 120
  toggleItem: function toggleItem(itemId) {                                                                           // 121
    var item = this.getItem(itemId);                                                                                  // 122
    if (item) {                                                                                                       // 123
      var _$set4;                                                                                                     // 123
                                                                                                                      //
      var itemIndex = this.itemIndex(itemId);                                                                         // 124
      return {                                                                                                        // 125
        $set: (_$set4 = {}, _$set4['items.' + itemIndex + '.isFinished'] = !item.isFinished, _$set4)                  // 126
      };                                                                                                              // 125
    }                                                                                                                 // 130
    return {};                                                                                                        // 131
  }                                                                                                                   // 132
});                                                                                                                   // 74
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 135
  Checklists.after.insert(function (userId, doc) {                                                                    // 136
    Activities.insert({                                                                                               // 137
      userId: userId,                                                                                                 // 138
      activityType: 'addChecklist',                                                                                   // 139
      cardId: doc.cardId,                                                                                             // 140
      boardId: Cards.findOne(doc.cardId).boardId,                                                                     // 141
      checklistId: doc._id                                                                                            // 142
    });                                                                                                               // 137
  });                                                                                                                 // 144
                                                                                                                      //
  //TODO: so there will be no activity for adding item into checklist, maybe will be implemented in the future.       //
  // Checklists.after.update((userId, doc) => {                                                                       //
  //   console.log('update:', doc)                                                                                    //
  // Activities.insert({                                                                                              //
  //   userId,                                                                                                        //
  //   activityType: 'addChecklist',                                                                                  //
  //   boardId: doc.boardId,                                                                                          //
  //   cardId: doc.cardId,                                                                                            //
  //   checklistId: doc._id,                                                                                          //
  // });                                                                                                              //
  // });                                                                                                              //
                                                                                                                      //
  Checklists.before.remove(function (userId, doc) {                                                                   // 158
    var activity = Activities.findOne({ checklistId: doc._id });                                                      // 159
    if (activity) {                                                                                                   // 160
      Activities.remove(activity._id);                                                                                // 161
    }                                                                                                                 // 162
  });                                                                                                                 // 163
}                                                                                                                     // 164
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"export.js":["babel-runtime/helpers/classCallCheck",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/export.js                                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});
/* global JsonRoutes */                                                                                               //
if (Meteor.isServer) {                                                                                                // 2
  // todo XXX once we have a real API in place, move that route there                                                 //
  // todo XXX also  share the route definition between the client and the server                                      //
  // so that we could use something like                                                                              //
  // `ApiRoutes.path('boards/export', boardId)``                                                                      //
  // on the client instead of copy/pasting the route path manually between the                                        //
  // client and the server.                                                                                           //
  /*                                                                                                                  //
   * This route is used to export the board FROM THE APPLICATION.                                                     //
   * If user is already logged-in, pass loginToken as param "authToken":                                              //
   * '/api/boards/:boardId?authToken=:token'                                                                          //
   *                                                                                                                  //
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/                                        //
   * for detailed explanations                                                                                        //
   */                                                                                                                 //
  JsonRoutes.add('get', '/api/boards/:boardId', function (req, res) {                                                 // 17
    var boardId = req.params.boardId;                                                                                 // 18
    var user = null;                                                                                                  // 19
    // todo XXX for real API, first look for token in Authentication: header                                          //
    // then fallback to parameter                                                                                     //
    var loginToken = req.query.authToken;                                                                             // 22
    if (loginToken) {                                                                                                 // 23
      var hashToken = Accounts._hashLoginToken(loginToken);                                                           // 24
      user = Meteor.users.findOne({                                                                                   // 25
        'services.resume.loginTokens.hashedToken': hashToken                                                          // 26
      });                                                                                                             // 25
    }                                                                                                                 // 28
                                                                                                                      //
    var exporter = new Exporter(boardId);                                                                             // 30
    if (exporter.canExport(user)) {                                                                                   // 31
      JsonRoutes.sendResult(res, 200, exporter.build());                                                              // 32
    } else {                                                                                                          // 33
      // we could send an explicit error message, but on the other hand the only                                      //
      // way to get there is by hacking the UI so let's keep it raw.                                                  //
      JsonRoutes.sendResult(res, 403);                                                                                // 36
    }                                                                                                                 // 37
  });                                                                                                                 // 38
}                                                                                                                     // 39
                                                                                                                      //
var Exporter = function () {                                                                                          //
  function Exporter(boardId) {                                                                                        // 42
    _classCallCheck(this, Exporter);                                                                                  // 42
                                                                                                                      //
    this._boardId = boardId;                                                                                          // 43
  }                                                                                                                   // 44
                                                                                                                      //
  Exporter.prototype.build = function build() {                                                                       //
    var byBoard = { boardId: this._boardId };                                                                         // 47
    // we do not want to retrieve boardId in related elements                                                         //
    var noBoardId = { fields: { boardId: 0 } };                                                                       // 49
    var noBoardIdNVersions = { fields: { boardId: 0, versions: 0 } };                                                 // 50
    var result = {                                                                                                    // 51
      _format: 'oc-board-1.0.0'                                                                                       // 52
    };                                                                                                                // 51
    _.extend(result, Boards.findOne(this._boardId, { fields: { stars: 0 } }));                                        // 54
    result.lists = Lists.find(byBoard, noBoardId).fetch();                                                            // 55
    result.cards = Cards.find(byBoard, noBoardIdNVersions).fetch();                                                   // 56
    result.comments = CardComments.find(byBoard, noBoardId).fetch();                                                  // 57
    result.activities = Activities.find(byBoard, noBoardId).fetch();                                                  // 58
    // for attachments we only export IDs and absolute url to original doc                                            //
    result.attachments = Attachments.find(byBoard).fetch().map(function (attachment) {                                // 60
      return {                                                                                                        // 61
        _id: attachment._id,                                                                                          // 62
        cardId: attachment.cardId,                                                                                    // 63
        url: FlowRouter.url(attachment.url())                                                                         // 64
      };                                                                                                              // 61
    });                                                                                                               // 66
                                                                                                                      //
    // we also have to export some user data - as the other elements only                                             //
    // include id but we have to be careful:                                                                          //
    // 1- only exports users that are linked somehow to that board                                                    //
    // 2- do not export any sensitive information                                                                     //
    var users = {};                                                                                                   // 72
    result.members.forEach(function (member) {                                                                        // 73
      users[member.userId] = true;                                                                                    // 73
    });                                                                                                               // 73
    result.lists.forEach(function (list) {                                                                            // 74
      users[list.userId] = true;                                                                                      // 74
    });                                                                                                               // 74
    result.cards.forEach(function (card) {                                                                            // 75
      users[card.userId] = true;                                                                                      // 76
      if (card.members) {                                                                                             // 77
        card.members.forEach(function (memberId) {                                                                    // 78
          users[memberId] = true;                                                                                     // 78
        });                                                                                                           // 78
      }                                                                                                               // 79
    });                                                                                                               // 80
    result.comments.forEach(function (comment) {                                                                      // 81
      users[comment.userId] = true;                                                                                   // 81
    });                                                                                                               // 81
    result.activities.forEach(function (activity) {                                                                   // 82
      users[activity.userId] = true;                                                                                  // 82
    });                                                                                                               // 82
    var byUserIds = { _id: { $in: Object.getOwnPropertyNames(users) } };                                              // 83
    // we use whitelist to be sure we do not expose inadvertently                                                     //
    // some secret fields that gets added to User later.                                                              //
    var userFields = { fields: {                                                                                      // 86
        _id: 1,                                                                                                       // 87
        username: 1,                                                                                                  // 88
        'profile.fullname': 1,                                                                                        // 89
        'profile.initials': 1,                                                                                        // 90
        'profile.avatarUrl': 1                                                                                        // 91
      } };                                                                                                            // 86
    result.users = Users.find(byUserIds, userFields).fetch().map(function (user) {                                    // 93
      // user avatar is stored as a relative url, we export absolute                                                  //
      if (user.profile.avatarUrl) {                                                                                   // 95
        user.profile.avatarUrl = FlowRouter.url(user.profile.avatarUrl);                                              // 96
      }                                                                                                               // 97
      return user;                                                                                                    // 98
    });                                                                                                               // 99
    return result;                                                                                                    // 100
  };                                                                                                                  // 101
                                                                                                                      //
  Exporter.prototype.canExport = function canExport(user) {                                                           //
    var board = Boards.findOne(this._boardId);                                                                        // 104
    return board && board.isVisibleBy(user);                                                                          // 105
  };                                                                                                                  // 106
                                                                                                                      //
  return Exporter;                                                                                                    //
}();                                                                                                                  //
                                                                                                                      //
module.exports.Exporter = Exporter;                                                                                   // 109
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"filesUpload.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/filesUpload.js                                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
FilesUpload = new FS.Collection('filesUpload', {                                                                      // 1
  stores: [new FS.Store.GridFS('filesUpload')]                                                                        // 2
});                                                                                                                   // 1
                                                                                                                      //
function isOwner(userId, file) {                                                                                      // 7
  return true;                                                                                                        // 8
}                                                                                                                     // 9
                                                                                                                      //
FilesUpload.allow({                                                                                                   // 11
  insert: isOwner,                                                                                                    // 12
  update: isOwner,                                                                                                    // 13
  remove: isOwner,                                                                                                    // 14
  download: function download() {                                                                                     // 15
    return true;                                                                                                      // 15
  },                                                                                                                  // 15
                                                                                                                      //
  fetch: ['userId']                                                                                                   // 16
});                                                                                                                   // 11
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"import.js":["babel-runtime/helpers/classCallCheck",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/import.js                                                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _classCallCheck;module.import('babel-runtime/helpers/classCallCheck',{"default":function(v){_classCallCheck=v}});
var DateString = Match.Where(function (dateAsString) {                                                                // 1
  check(dateAsString, String);                                                                                        // 2
  return moment(dateAsString, moment.ISO_8601).isValid();                                                             // 3
});                                                                                                                   // 4
                                                                                                                      //
var TrelloCreator = function () {                                                                                     //
  function TrelloCreator(data) {                                                                                      // 7
    _classCallCheck(this, TrelloCreator);                                                                             // 7
                                                                                                                      //
    // we log current date, to use the same timestamp for all our actions.                                            //
    // this helps to retrieve all elements performed by the same import.                                              //
    this._nowDate = new Date();                                                                                       // 10
    // The object creation dates, indexed by Trello id                                                                //
    // (so we only parse actions once!)                                                                               //
    this.createdAt = {                                                                                                // 13
      board: null,                                                                                                    // 14
      cards: {},                                                                                                      // 15
      lists: {}                                                                                                       // 16
    };                                                                                                                // 13
    // The object creator Trello Id, indexed by the object Trello id                                                  //
    // (so we only parse actions once!)                                                                               //
    this.createdBy = {                                                                                                // 20
      cards: {} };                                                                                                    // 21
                                                                                                                      //
    // Map of labels Trello ID => Wekan ID                                                                            //
    // only cards have a field for that                                                                               //
    this.labels = {};                                                                                                 // 25
    // Map of lists Trello ID => Wekan ID                                                                             //
    this.lists = {};                                                                                                  // 27
    // The comments, indexed by Trello card id (to map when importing cards)                                          //
    this.comments = {};                                                                                               // 29
    // the members, indexed by Trello member id => Wekan user ID                                                      //
    this.members = data.membersMapping ? data.membersMapping : {};                                                    // 31
                                                                                                                      //
    // maps a trelloCardId to an array of trelloAttachments                                                           //
    this.attachments = {};                                                                                            // 34
  }                                                                                                                   // 35
                                                                                                                      //
  /**                                                                                                                 //
   * If dateString is provided,                                                                                       //
   * return the Date it represents.                                                                                   //
   * If not, will return the date when it was first called.                                                           //
   * This is useful for us, as we want all import operations to                                                       //
   * have the exact same date for easier later retrieval.                                                             //
   *                                                                                                                  //
   * @param {String} dateString a properly formatted Date                                                             //
   */                                                                                                                 //
                                                                                                                      //
                                                                                                                      //
  TrelloCreator.prototype._now = function _now(dateString) {                                                          //
    if (dateString) {                                                                                                 // 47
      return new Date(dateString);                                                                                    // 48
    }                                                                                                                 // 49
    if (!this._nowDate) {                                                                                             // 50
      this._nowDate = new Date();                                                                                     // 51
    }                                                                                                                 // 52
    return this._nowDate;                                                                                             // 53
  };                                                                                                                  // 54
                                                                                                                      //
  /**                                                                                                                 //
   * if trelloUserId is provided and we have a mapping,                                                               //
   * return it.                                                                                                       //
   * Otherwise return current logged user.                                                                            //
   * @param trelloUserId                                                                                              //
   * @private                                                                                                         //
     */                                                                                                               //
                                                                                                                      //
                                                                                                                      //
  TrelloCreator.prototype._user = function _user(trelloUserId) {                                                      //
    if (trelloUserId && this.members[trelloUserId]) {                                                                 // 64
      return this.members[trelloUserId];                                                                              // 65
    }                                                                                                                 // 66
    return Meteor.userId();                                                                                           // 67
  };                                                                                                                  // 68
                                                                                                                      //
  TrelloCreator.prototype.checkActions = function checkActions(trelloActions) {                                       //
    check(trelloActions, [Match.ObjectIncluding({                                                                     // 71
      data: Object,                                                                                                   // 72
      date: DateString,                                                                                               // 73
      type: String                                                                                                    // 74
    })]);                                                                                                             // 71
    // XXX we could perform more thorough checks based on action type                                                 //
  };                                                                                                                  // 77
                                                                                                                      //
  TrelloCreator.prototype.checkBoard = function checkBoard(trelloBoard) {                                             //
    check(trelloBoard, Match.ObjectIncluding({                                                                        // 80
      closed: Boolean,                                                                                                // 81
      name: String,                                                                                                   // 82
      prefs: Match.ObjectIncluding({                                                                                  // 83
        // XXX refine control by validating 'background' against a list of                                            //
        // allowed values (is it worth the maintenance?)                                                              //
        background: String,                                                                                           // 86
        permissionLevel: Match.Where(function (value) {                                                               // 87
          return ['org', 'private', 'public'].indexOf(value) >= 0;                                                    // 88
        })                                                                                                            // 89
      })                                                                                                              // 83
    }));                                                                                                              // 80
  };                                                                                                                  // 92
                                                                                                                      //
  TrelloCreator.prototype.checkCards = function checkCards(trelloCards) {                                             //
    check(trelloCards, [Match.ObjectIncluding({                                                                       // 95
      closed: Boolean,                                                                                                // 96
      dateLastActivity: DateString,                                                                                   // 97
      desc: String,                                                                                                   // 98
      idLabels: [String],                                                                                             // 99
      idMembers: [String],                                                                                            // 100
      name: String,                                                                                                   // 101
      pos: Number                                                                                                     // 102
    })]);                                                                                                             // 95
  };                                                                                                                  // 104
                                                                                                                      //
  TrelloCreator.prototype.checkLabels = function checkLabels(trelloLabels) {                                          //
    check(trelloLabels, [Match.ObjectIncluding({                                                                      // 107
      // XXX refine control by validating 'color' against a list of allowed                                           //
      // values (is it worth the maintenance?)                                                                        //
      color: String,                                                                                                  // 110
      name: String                                                                                                    // 111
    })]);                                                                                                             // 107
  };                                                                                                                  // 113
                                                                                                                      //
  TrelloCreator.prototype.checkLists = function checkLists(trelloLists) {                                             //
    check(trelloLists, [Match.ObjectIncluding({                                                                       // 116
      closed: Boolean,                                                                                                // 117
      name: String                                                                                                    // 118
    })]);                                                                                                             // 116
  };                                                                                                                  // 120
                                                                                                                      //
  // You must call parseActions before calling this one.                                                              //
                                                                                                                      //
                                                                                                                      //
  TrelloCreator.prototype.createBoardAndLabels = function createBoardAndLabels(trelloBoard) {                         //
    var _this = this;                                                                                                 // 123
                                                                                                                      //
    var boardToCreate = {                                                                                             // 124
      archived: trelloBoard.closed,                                                                                   // 125
      color: this.getColor(trelloBoard.prefs.background),                                                             // 126
      // very old boards won't have a creation activity so no creation date                                           //
      createdAt: this._now(this.createdAt.board),                                                                     // 128
      labels: [],                                                                                                     // 129
      members: [{                                                                                                     // 130
        userId: Meteor.userId(),                                                                                      // 131
        isAdmin: true,                                                                                                // 132
        isActive: true                                                                                                // 133
      }],                                                                                                             // 130
      permission: this.getPermission(trelloBoard.prefs.permissionLevel),                                              // 135
      slug: getSlug(trelloBoard.name) || 'board',                                                                     // 136
      stars: 0,                                                                                                       // 137
      title: trelloBoard.name                                                                                         // 138
    };                                                                                                                // 124
    // now add other members                                                                                          //
    if (trelloBoard.memberships) {                                                                                    // 141
      trelloBoard.memberships.forEach(function (trelloMembership) {                                                   // 142
        var trelloId = trelloMembership.idMember;                                                                     // 143
        // do we have a mapping?                                                                                      //
        if (_this.members[trelloId]) {                                                                                // 145
          (function () {                                                                                              // 145
            var wekanId = _this.members[trelloId];                                                                    // 146
            // do we already have it in our list?                                                                     //
            var wekanMember = boardToCreate.members.find(function (wekanMember) {                                     // 148
              return wekanMember.userId === wekanId;                                                                  // 148
            });                                                                                                       // 148
            if (wekanMember) {                                                                                        // 149
              // we're already mapped, but maybe with lower rights                                                    //
              if (!wekanMember.isAdmin) {                                                                             // 151
                wekanMember.isAdmin = _this.getAdmin(trelloMembership.memberType);                                    // 152
              }                                                                                                       // 153
            } else {                                                                                                  // 154
              boardToCreate.members.push({                                                                            // 155
                userId: wekanId,                                                                                      // 156
                isAdmin: _this.getAdmin(trelloMembership.memberType),                                                 // 157
                isActive: true                                                                                        // 158
              });                                                                                                     // 155
            }                                                                                                         // 160
          })();                                                                                                       // 145
        }                                                                                                             // 161
      });                                                                                                             // 162
    }                                                                                                                 // 163
    trelloBoard.labels.forEach(function (label) {                                                                     // 164
      var labelToCreate = {                                                                                           // 165
        _id: Random.id(6),                                                                                            // 166
        color: label.color,                                                                                           // 167
        name: label.name                                                                                              // 168
      };                                                                                                              // 165
      // We need to remember them by Trello ID, as this is the only ref we have                                       //
      // when importing cards.                                                                                        //
      _this.labels[label.id] = labelToCreate._id;                                                                     // 172
      boardToCreate.labels.push(labelToCreate);                                                                       // 173
    });                                                                                                               // 174
    var boardId = Boards.direct.insert(boardToCreate);                                                                // 175
    Boards.direct.update(boardId, { $set: { modifiedAt: this._now() } });                                             // 176
    // log activity                                                                                                   //
    Activities.direct.insert({                                                                                        // 178
      activityType: 'importBoard',                                                                                    // 179
      boardId: boardId,                                                                                               // 180
      createdAt: this._now(),                                                                                         // 181
      source: {                                                                                                       // 182
        id: trelloBoard.id,                                                                                           // 183
        system: 'Trello',                                                                                             // 184
        url: trelloBoard.url                                                                                          // 185
      },                                                                                                              // 182
      // We attribute the import to current user,                                                                     //
      // not the author from the original object.                                                                     //
      userId: this._user()                                                                                            // 189
    });                                                                                                               // 178
    return boardId;                                                                                                   // 191
  };                                                                                                                  // 192
                                                                                                                      //
  /**                                                                                                                 //
   * Create the Wekan cards corresponding to the supplied Trello cards,                                               //
   * as well as all linked data: activities, comments, and attachments                                                //
   * @param trelloCards                                                                                               //
   * @param boardId                                                                                                   //
   * @returns {Array}                                                                                                 //
   */                                                                                                                 //
                                                                                                                      //
                                                                                                                      //
  TrelloCreator.prototype.createCards = function createCards(trelloCards, boardId) {                                  //
    var _this2 = this;                                                                                                // 201
                                                                                                                      //
    var result = [];                                                                                                  // 202
    trelloCards.forEach(function (card) {                                                                             // 203
      var cardToCreate = {                                                                                            // 204
        archived: card.closed,                                                                                        // 205
        boardId: boardId,                                                                                             // 206
        // very old boards won't have a creation activity so no creation date                                         //
        createdAt: _this2._now(_this2.createdAt.cards[card.id]),                                                      // 208
        dateLastActivity: _this2._now(),                                                                              // 209
        description: card.desc,                                                                                       // 210
        listId: _this2.lists[card.idList],                                                                            // 211
        sort: card.pos,                                                                                               // 212
        title: card.name,                                                                                             // 213
        // we attribute the card to its creator if available                                                          //
        userId: _this2._user(_this2.createdBy.cards[card.id])                                                         // 215
      };                                                                                                              // 204
      // add labels                                                                                                   //
      if (card.idLabels) {                                                                                            // 218
        cardToCreate.labelIds = card.idLabels.map(function (trelloId) {                                               // 219
          return _this2.labels[trelloId];                                                                             // 220
        });                                                                                                           // 221
      }                                                                                                               // 222
      // add members {                                                                                                //
      if (card.idMembers) {                                                                                           // 224
        (function () {                                                                                                // 224
          var wekanMembers = [];                                                                                      // 225
          // we can't just map, as some members may not have been mapped                                              //
          card.idMembers.forEach(function (trelloId) {                                                                // 227
            if (_this2.members[trelloId]) {                                                                           // 228
              (function () {                                                                                          // 228
                var wekanId = _this2.members[trelloId];                                                               // 229
                // we may map multiple Trello members to the same wekan user                                          //
                // in which case we risk adding the same user multiple times                                          //
                if (!wekanMembers.find(function (wId) {                                                               // 232
                  return wId === wekanId;                                                                             // 232
                })) {                                                                                                 // 232
                  wekanMembers.push(wekanId);                                                                         // 233
                }                                                                                                     // 234
              })();                                                                                                   // 228
            }                                                                                                         // 235
            return true;                                                                                              // 236
          });                                                                                                         // 237
          if (wekanMembers.length > 0) {                                                                              // 238
            cardToCreate.members = wekanMembers;                                                                      // 239
          }                                                                                                           // 240
        })();                                                                                                         // 224
      }                                                                                                               // 241
      // insert card                                                                                                  //
      var cardId = Cards.direct.insert(cardToCreate);                                                                 // 243
      // log activity                                                                                                 //
      Activities.direct.insert({                                                                                      // 245
        activityType: 'importCard',                                                                                   // 246
        boardId: boardId,                                                                                             // 247
        cardId: cardId,                                                                                               // 248
        createdAt: _this2._now(),                                                                                     // 249
        listId: cardToCreate.listId,                                                                                  // 250
        source: {                                                                                                     // 251
          id: card.id,                                                                                                // 252
          system: 'Trello',                                                                                           // 253
          url: card.url                                                                                               // 254
        },                                                                                                            // 251
        // we attribute the import to current user,                                                                   //
        // not the author of the original card                                                                        //
        userId: _this2._user()                                                                                        // 258
      });                                                                                                             // 245
      // add comments                                                                                                 //
      var comments = _this2.comments[card.id];                                                                        // 261
      if (comments) {                                                                                                 // 262
        comments.forEach(function (comment) {                                                                         // 263
          var commentToCreate = {                                                                                     // 264
            boardId: boardId,                                                                                         // 265
            cardId: cardId,                                                                                           // 266
            createdAt: _this2._now(comment.date),                                                                     // 267
            text: comment.data.text,                                                                                  // 268
            // we attribute the comment to the original author, default to current user                               //
            userId: _this2._user(comment.memberCreator.id)                                                            // 270
          };                                                                                                          // 264
          // dateLastActivity will be set from activity insert, no need to                                            //
          // update it ourselves                                                                                      //
          var commentId = CardComments.direct.insert(commentToCreate);                                                // 274
          Activities.direct.insert({                                                                                  // 275
            activityType: 'addComment',                                                                               // 276
            boardId: commentToCreate.boardId,                                                                         // 277
            cardId: commentToCreate.cardId,                                                                           // 278
            commentId: commentId,                                                                                     // 279
            createdAt: _this2._now(commentToCreate.createdAt),                                                        // 280
            // we attribute the addComment (not the import)                                                           //
            // to the original author - it is needed by some UI elements.                                             //
            userId: commentToCreate.userId                                                                            // 283
          });                                                                                                         // 275
        });                                                                                                           // 285
      }                                                                                                               // 286
      var attachments = _this2.attachments[card.id];                                                                  // 287
      var trelloCoverId = card.idAttachmentCover;                                                                     // 288
      if (attachments) {                                                                                              // 289
        attachments.forEach(function (att) {                                                                          // 290
          var file = new FS.File();                                                                                   // 291
          // Simulating file.attachData on the client generates multiple errors                                       //
          // - HEAD returns null, which causes exception down the line                                                //
          // - the template then tries to display the url to the attachment which causes other errors                 //
          // so we make it server only, and let UI catch up once it is done, forget about latency comp.               //
          if (Meteor.isServer) {                                                                                      // 296
            file.attachData(att.url, function (error) {                                                               // 297
              file.boardId = boardId;                                                                                 // 298
              file.cardId = cardId;                                                                                   // 299
              if (error) {                                                                                            // 300
                throw error;                                                                                          // 301
              } else {                                                                                                // 302
                var wekanAtt = Attachments.insert(file, function () {                                                 // 303
                  // we do nothing                                                                                    //
                });                                                                                                   // 305
                //                                                                                                    //
                if (trelloCoverId === att.id) {                                                                       // 307
                  Cards.direct.update(cardId, { $set: { coverId: wekanAtt._id } });                                   // 308
                }                                                                                                     // 309
              }                                                                                                       // 310
            });                                                                                                       // 311
          }                                                                                                           // 312
          // todo XXX set cover - if need be                                                                          //
        });                                                                                                           // 314
      }                                                                                                               // 315
      result.push(cardId);                                                                                            // 316
    });                                                                                                               // 317
    return result;                                                                                                    // 318
  };                                                                                                                  // 319
                                                                                                                      //
  // Create labels if they do not exist and load this.labels.                                                         //
                                                                                                                      //
                                                                                                                      //
  TrelloCreator.prototype.createLabels = function createLabels(trelloLabels, board) {                                 //
    var _this3 = this;                                                                                                // 322
                                                                                                                      //
    trelloLabels.forEach(function (label) {                                                                           // 323
      var color = label.color;                                                                                        // 324
      var name = label.name;                                                                                          // 325
      var existingLabel = board.getLabel(name, color);                                                                // 326
      if (existingLabel) {                                                                                            // 327
        _this3.labels[label.id] = existingLabel._id;                                                                  // 328
      } else {                                                                                                        // 329
        var idLabelCreated = board.pushLabel(name, color);                                                            // 330
        _this3.labels[label.id] = idLabelCreated;                                                                     // 331
      }                                                                                                               // 332
    });                                                                                                               // 333
  };                                                                                                                  // 334
                                                                                                                      //
  TrelloCreator.prototype.createLists = function createLists(trelloLists, boardId) {                                  //
    var _this4 = this;                                                                                                // 336
                                                                                                                      //
    trelloLists.forEach(function (list) {                                                                             // 337
      var listToCreate = {                                                                                            // 338
        archived: list.closed,                                                                                        // 339
        boardId: boardId,                                                                                             // 340
        // We are being defensing here by providing a default date (now) if the                                       //
        // creation date wasn't found on the action log. This happen on old                                           //
        // Trello boards (eg from 2013) that didn't log the 'createList' action                                       //
        // we require.                                                                                                //
        createdAt: _this4._now(_this4.createdAt.lists[list.id]),                                                      // 345
        title: list.name                                                                                              // 346
      };                                                                                                              // 338
      var listId = Lists.direct.insert(listToCreate);                                                                 // 348
      Lists.direct.update(listId, { $set: { 'updatedAt': _this4._now() } });                                          // 349
      _this4.lists[list.id] = listId;                                                                                 // 350
      // log activity                                                                                                 //
      Activities.direct.insert({                                                                                      // 352
        activityType: 'importList',                                                                                   // 353
        boardId: boardId,                                                                                             // 354
        createdAt: _this4._now(),                                                                                     // 355
        listId: listId,                                                                                               // 356
        source: {                                                                                                     // 357
          id: list.id,                                                                                                // 358
          system: 'Trello'                                                                                            // 359
        },                                                                                                            // 357
        // We attribute the import to current user,                                                                   //
        // not the creator of the original object                                                                     //
        userId: _this4._user()                                                                                        // 363
      });                                                                                                             // 352
    });                                                                                                               // 365
  };                                                                                                                  // 366
                                                                                                                      //
  TrelloCreator.prototype.getAdmin = function getAdmin(trelloMemberType) {                                            //
    return trelloMemberType === 'admin';                                                                              // 369
  };                                                                                                                  // 370
                                                                                                                      //
  TrelloCreator.prototype.getColor = function getColor(trelloColorCode) {                                             //
    // trello color name => wekan color                                                                               //
    var mapColors = {                                                                                                 // 374
      'blue': 'belize',                                                                                               // 375
      'orange': 'pumpkin',                                                                                            // 376
      'green': 'nephritis',                                                                                           // 377
      'red': 'pomegranate',                                                                                           // 378
      'purple': 'wisteria',                                                                                           // 379
      'pink': 'pomegranate',                                                                                          // 380
      'lime': 'nephritis',                                                                                            // 381
      'sky': 'belize',                                                                                                // 382
      'grey': 'midnight'                                                                                              // 383
    };                                                                                                                // 374
    var wekanColor = mapColors[trelloColorCode];                                                                      // 385
    return wekanColor || Boards.simpleSchema()._schema.color.allowedValues[0];                                        // 386
  };                                                                                                                  // 387
                                                                                                                      //
  TrelloCreator.prototype.getPermission = function getPermission(trelloPermissionCode) {                              //
    if (trelloPermissionCode === 'public') {                                                                          // 390
      return 'public';                                                                                                // 391
    }                                                                                                                 // 392
    // Wekan does NOT have organization level, so we default both 'private' and                                       //
    // 'org' to private.                                                                                              //
    return 'private';                                                                                                 // 395
  };                                                                                                                  // 396
                                                                                                                      //
  TrelloCreator.prototype.parseActions = function parseActions(trelloActions) {                                       //
    var _this5 = this;                                                                                                // 398
                                                                                                                      //
    trelloActions.forEach(function (action) {                                                                         // 399
      if (action.type === 'addAttachmentToCard') {                                                                    // 400
        // We have to be cautious, because the attachment could have been removed later.                              //
        // In that case Trello still reports its addition, but removes its 'url' field.                               //
        // So we test for that                                                                                        //
        var trelloAttachment = action.data.attachment;                                                                // 404
        if (trelloAttachment.url) {                                                                                   // 405
          // we cannot actually create the Wekan attachment, because we don't yet                                     //
          // have the cards to attach it to, so we store it in the instance variable.                                 //
          var trelloCardId = action.data.card.id;                                                                     // 408
          if (!_this5.attachments[trelloCardId]) {                                                                    // 409
            _this5.attachments[trelloCardId] = [];                                                                    // 410
          }                                                                                                           // 411
          _this5.attachments[trelloCardId].push(trelloAttachment);                                                    // 412
        }                                                                                                             // 413
      } else if (action.type === 'commentCard') {                                                                     // 414
        var id = action.data.card.id;                                                                                 // 415
        if (_this5.comments[id]) {                                                                                    // 416
          _this5.comments[id].push(action);                                                                           // 417
        } else {                                                                                                      // 418
          _this5.comments[id] = [action];                                                                             // 419
        }                                                                                                             // 420
      } else if (action.type === 'createBoard') {                                                                     // 421
        _this5.createdAt.board = action.date;                                                                         // 422
      } else if (action.type === 'createCard') {                                                                      // 423
        var cardId = action.data.card.id;                                                                             // 424
        _this5.createdAt.cards[cardId] = action.date;                                                                 // 425
        _this5.createdBy.cards[cardId] = action.idMemberCreator;                                                      // 426
      } else if (action.type === 'createList') {                                                                      // 427
        var listId = action.data.list.id;                                                                             // 428
        _this5.createdAt.lists[listId] = action.date;                                                                 // 429
      }                                                                                                               // 430
    });                                                                                                               // 431
  };                                                                                                                  // 432
                                                                                                                      //
  return TrelloCreator;                                                                                               //
}();                                                                                                                  //
                                                                                                                      //
Meteor.methods({                                                                                                      // 435
  importTrelloBoard: function importTrelloBoard(trelloBoard, data) {                                                  // 436
    var trelloCreator = new TrelloCreator(data);                                                                      // 437
                                                                                                                      //
    // 1. check all parameters are ok from a syntax point of view                                                     //
    try {                                                                                                             // 440
      check(data, {                                                                                                   // 441
        membersMapping: Match.Optional(Object)                                                                        // 442
      });                                                                                                             // 441
      trelloCreator.checkActions(trelloBoard.actions);                                                                // 444
      trelloCreator.checkBoard(trelloBoard);                                                                          // 445
      trelloCreator.checkLabels(trelloBoard.labels);                                                                  // 446
      trelloCreator.checkLists(trelloBoard.lists);                                                                    // 447
      trelloCreator.checkCards(trelloBoard.cards);                                                                    // 448
    } catch (e) {                                                                                                     // 449
      throw new Meteor.Error('error-json-schema');                                                                    // 450
    }                                                                                                                 // 451
                                                                                                                      //
    // 2. check parameters are ok from a business point of view (exist &                                              //
    // authorized) nothing to check, everyone can import boards in their account                                      //
                                                                                                                      //
    // 3. create all elements                                                                                         //
    trelloCreator.parseActions(trelloBoard.actions);                                                                  // 457
    var boardId = trelloCreator.createBoardAndLabels(trelloBoard);                                                    // 458
    trelloCreator.createLists(trelloBoard.lists, boardId);                                                            // 459
    trelloCreator.createCards(trelloBoard.cards, boardId);                                                            // 460
    // XXX add members                                                                                                //
    return boardId;                                                                                                   // 462
  }                                                                                                                   // 463
});                                                                                                                   // 435
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"lists.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/lists.js                                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Lists = new Mongo.Collection('lists');                                                                                // 1
                                                                                                                      //
Lists.attachSchema(new SimpleSchema({                                                                                 // 3
  title: {                                                                                                            // 4
    type: String                                                                                                      // 5
  },                                                                                                                  // 4
  description: {                                                                                                      // 7
    type: String,                                                                                                     // 8
    optional: true,                                                                                                   // 9
    autoValue: function autoValue() {                                                                                 // 10
      if (this.isInsert && !this.isSet) {                                                                             // 11
        return "";                                                                                                    // 12
      }                                                                                                               // 13
    }                                                                                                                 // 14
  },                                                                                                                  // 7
  archived: {                                                                                                         // 16
    type: Boolean,                                                                                                    // 17
    autoValue: function autoValue() {                                                                                 // 18
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 19
        return false;                                                                                                 // 20
      }                                                                                                               // 21
    }                                                                                                                 // 22
  },                                                                                                                  // 16
  boardId: {                                                                                                          // 24
    type: String                                                                                                      // 25
  },                                                                                                                  // 24
  createdAt: {                                                                                                        // 27
    type: Date,                                                                                                       // 28
    autoValue: function autoValue() {                                                                                 // 29
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 30
        return new Date();                                                                                            // 31
      } else {                                                                                                        // 32
        this.unset();                                                                                                 // 33
      }                                                                                                               // 34
    }                                                                                                                 // 35
  },                                                                                                                  // 27
  sort: {                                                                                                             // 37
    type: Number,                                                                                                     // 38
    decimal: true,                                                                                                    // 39
    // XXX We should probably provide a default                                                                       //
    optional: true                                                                                                    // 41
  },                                                                                                                  // 37
  updatedAt: {                                                                                                        // 43
    type: Date,                                                                                                       // 44
    optional: true,                                                                                                   // 45
    autoValue: function autoValue() {                                                                                 // 46
      // eslint-disable-line consistent-return                                                                        //
      if (this.isUpdate) {                                                                                            // 47
        return new Date();                                                                                            // 48
      } else {                                                                                                        // 49
        this.unset();                                                                                                 // 50
      }                                                                                                               // 51
    }                                                                                                                 // 52
  },                                                                                                                  // 43
  labelIds: {                                                                                                         // 54
    type: [String],                                                                                                   // 55
    optional: true                                                                                                    // 56
  },                                                                                                                  // 54
  members: {                                                                                                          // 58
    type: [String],                                                                                                   // 59
    optional: true                                                                                                    // 60
  },                                                                                                                  // 58
  isRepeating: {                                                                                                      // 62
    type: Boolean,                                                                                                    // 63
    optional: true,                                                                                                   // 64
    autoValue: function autoValue() {                                                                                 // 65
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 66
        return false;                                                                                                 // 67
      }                                                                                                               // 68
    }                                                                                                                 // 69
  },                                                                                                                  // 62
  _parentId: {                                                                                                        // 71
    type: String,                                                                                                     // 72
    optional: true                                                                                                    // 73
  }                                                                                                                   // 71
}));                                                                                                                  // 3
                                                                                                                      //
Lists.allow({                                                                                                         // 77
  insert: function insert(userId, doc) {                                                                              // 78
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 79
  },                                                                                                                  // 80
  update: function update(userId, doc) {                                                                              // 81
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 82
  },                                                                                                                  // 83
  remove: function remove(userId, doc) {                                                                              // 84
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));                                                   // 85
  },                                                                                                                  // 86
                                                                                                                      //
  fetch: ['boardId']                                                                                                  // 87
});                                                                                                                   // 77
                                                                                                                      //
Lists.helpers({                                                                                                       // 90
  cards: function cards() {                                                                                           // 91
    var ccards = Cards.find(Filter.mongoSelector({                                                                    // 92
      listId: this._id,                                                                                               // 93
      archived: false                                                                                                 // 94
    }), { sort: { sort: 1 } });                                                                                       // 92
    return ccards;                                                                                                    // 96
  },                                                                                                                  // 97
  cardsInArchived: function cardsInArchived() {                                                                       // 99
    var cards = Cards.find(Filter.mongoSelector({                                                                     // 100
      listId: this._id,                                                                                               // 101
      archived: true                                                                                                  // 102
    }), { sort: { sort: 1 } });                                                                                       // 100
    return cards;                                                                                                     // 104
  },                                                                                                                  // 105
  checkCardsInArchived: function checkCardsInArchived() {                                                             // 107
    var cards = Cards.find(Filter.mongoSelector({                                                                     // 108
      listId: this._id,                                                                                               // 109
      archived: true                                                                                                  // 110
    }), { sort: { sort: 1 } }).count();                                                                               // 108
    return card > 0;                                                                                                  // 112
  },                                                                                                                  // 113
  allCards: function allCards() {                                                                                     // 115
    return Cards.find({ listId: this._id, archived: false });                                                         // 116
  },                                                                                                                  // 117
  board: function board() {                                                                                           // 119
    return Boards.findOne(this.boardId);                                                                              // 120
  },                                                                                                                  // 121
  labels: function labels() {                                                                                         // 123
    var _this = this;                                                                                                 // 123
                                                                                                                      //
    var boardLabels = this.board().labels;                                                                            // 124
    var listLabels = _.filter(boardLabels, function (label) {                                                         // 125
      return _.contains(_this.labelIds, label._id);                                                                   // 126
    });                                                                                                               // 127
    return listLabels;                                                                                                // 128
  },                                                                                                                  // 129
  hasLabel: function hasLabel(labelId) {                                                                              // 131
    return _.contains(this.labelIds, labelId);                                                                        // 132
  },                                                                                                                  // 133
  activities: function activities() {                                                                                 // 135
    var result = Activities.find({ listId: this._id }, { sort: { createdAt: -1 } });                                  // 136
    return result;                                                                                                    // 137
  },                                                                                                                  // 138
  comments: function comments() {                                                                                     // 140
    return CardComments.find({ listId: this._id }, { sort: { createdAt: -1 } });                                      // 141
  },                                                                                                                  // 142
  absoluteUrl: function absoluteUrl() {                                                                               // 144
    var board = this.board();                                                                                         // 145
    return FlowRouter.url('list', {                                                                                   // 146
      boardId: board._id,                                                                                             // 147
      slug: board.slug,                                                                                               // 148
      listId: this._id                                                                                                // 149
    });                                                                                                               // 146
  }                                                                                                                   // 151
});                                                                                                                   // 90
                                                                                                                      //
Lists.mutations({                                                                                                     // 154
  rename: function rename(title) {                                                                                    // 155
    return { $set: { title: title } };                                                                                // 156
  },                                                                                                                  // 157
  setDescription: function setDescription(description) {                                                              // 159
    return { $set: { description: description } };                                                                    // 160
  },                                                                                                                  // 161
  setRepeating: function setRepeating(isRepeating) {                                                                  // 163
    return { $set: { isRepeating: isRepeating } };                                                                    // 164
  },                                                                                                                  // 165
  archive: function archive() {                                                                                       // 167
    return { $set: { archived: true } };                                                                              // 168
  },                                                                                                                  // 169
  restore: function restore() {                                                                                       // 171
    return { $set: { archived: false } };                                                                             // 172
  },                                                                                                                  // 173
  move: function move(boardId) {                                                                                      // 175
    var mutatedFields = { boardId: boardId };                                                                         // 176
    return { $set: mutatedFields };                                                                                   // 177
  },                                                                                                                  // 178
  addLabel: function addLabel(labelId) {                                                                              // 180
    return { $addToSet: { labelIds: labelId } };                                                                      // 181
  },                                                                                                                  // 182
  removeLabel: function removeLabel(labelId) {                                                                        // 184
    return { $pull: { labelIds: labelId } };                                                                          // 185
  },                                                                                                                  // 186
  toggleLabel: function toggleLabel(labelId) {                                                                        // 188
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {                                                       // 189
      return this.removeLabel(labelId);                                                                               // 190
    } else {                                                                                                          // 191
      return this.addLabel(labelId);                                                                                  // 192
    }                                                                                                                 // 193
  },                                                                                                                  // 194
  assignMember: function assignMember(memberId) {                                                                     // 196
    return { $addToSet: { members: memberId } };                                                                      // 197
  },                                                                                                                  // 198
  unassignMember: function unassignMember(memberId) {                                                                 // 200
    return { $pull: { members: memberId } };                                                                          // 201
  },                                                                                                                  // 202
  toggleMember: function toggleMember(memberId) {                                                                     // 204
    if (this.members && this.members.indexOf(memberId) > -1) {                                                        // 205
      return this.unassignMember(memberId);                                                                           // 206
    } else {                                                                                                          // 207
      return this.assignMember(memberId);                                                                             // 208
    }                                                                                                                 // 209
  }                                                                                                                   // 210
});                                                                                                                   // 154
                                                                                                                      //
// Lists.hookOptions.after.update = { fetchPrevious: false };                                                         //
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 215
  Meteor.startup(function () {                                                                                        // 216
    Lists._collection._ensureIndex({ boardId: 1 });                                                                   // 217
  });                                                                                                                 // 218
                                                                                                                      //
  Lists.after.insert(function (userId, doc) {                                                                         // 220
    if (doc._parentId) {                                                                                              // 221
      (function () {                                                                                                  // 221
        var oldlist = Lists.findOne(doc._parentId);                                                                   // 222
        if (userId) {                                                                                                 // 223
          Activities.insert({                                                                                         // 224
            userId: userId,                                                                                           // 225
            type: 'list',                                                                                             // 226
            activityType: 'copyListClone',                                                                            // 227
            listId: doc._id,                                                                                          // 228
            oldListId: doc._parentId                                                                                  // 229
          });                                                                                                         // 224
          Activities.insert({                                                                                         // 231
            userId: userId,                                                                                           // 232
            type: 'list',                                                                                             // 233
            activityType: 'copyListOriginal',                                                                         // 234
            listId: doc._parentId,                                                                                    // 235
            boardId: oldlist.boardId,                                                                                 // 236
            newListId: doc._id                                                                                        // 237
          });                                                                                                         // 231
        }                                                                                                             // 239
        var allCards = Lists.findOne(doc._parentId).allCards().fetch();                                               // 240
        _.each(allCards, function (card) {                                                                            // 241
          card._parentId = card._id;                                                                                  // 242
          var cardId = card._id;                                                                                      // 243
          delete card._id;                                                                                            // 244
          delete card.createdAt;                                                                                      // 245
          delete card.modifiedAt;                                                                                     // 246
          card.listId = doc._id;                                                                                      // 247
          card.boardId = doc.boardId;                                                                                 // 248
          Cards.insert(card, function (newCardId) {                                                                   // 249
            Activities.insert({                                                                                       // 250
              userId: userId,                                                                                         // 251
              activityType: 'copyCardOriginal',                                                                       // 252
              boardId: oldlist.boardId,                                                                               // 253
              listId: doc._parentId,                                                                                  // 254
              cardId: cardId,                                                                                         // 255
              newCardId: newCardId,                                                                                   // 256
              newListId: doc._id                                                                                      // 257
            });                                                                                                       // 250
          });                                                                                                         // 259
        });                                                                                                           // 260
      })();                                                                                                           // 221
    } else {                                                                                                          // 261
      if (userId) {                                                                                                   // 262
        Activities.insert({                                                                                           // 263
          userId: userId,                                                                                             // 264
          type: 'list',                                                                                               // 265
          activityType: 'createList',                                                                                 // 266
          boardId: doc.boardId,                                                                                       // 267
          listId: doc._id                                                                                             // 268
        });                                                                                                           // 263
      }                                                                                                               // 270
    }                                                                                                                 // 271
  });                                                                                                                 // 272
                                                                                                                      //
  Lists.after.update(function (userId, doc, fieldNames, modifier) {                                                   // 274
    if (_.contains(fieldNames, 'archived')) {                                                                         // 275
      if (doc.archived) {                                                                                             // 276
        Activities.insert({                                                                                           // 277
          userId: userId,                                                                                             // 278
          type: 'list',                                                                                               // 279
          activityType: 'archivedList',                                                                               // 280
          listId: doc._id,                                                                                            // 281
          boardId: doc.boardId                                                                                        // 282
        });                                                                                                           // 277
      } else {                                                                                                        // 284
        Activities.insert({                                                                                           // 285
          userId: userId,                                                                                             // 286
          type: 'list',                                                                                               // 287
          activityType: 'restoredList',                                                                               // 288
          listId: doc._id,                                                                                            // 289
          boardId: doc.boardId                                                                                        // 290
        });                                                                                                           // 285
      }                                                                                                               // 292
    }                                                                                                                 // 293
                                                                                                                      //
    var oldBoardId = this.previous.boardId;                                                                           // 295
    if (_.contains(fieldNames, 'boardId') && doc.boardId !== oldBoardId) {                                            // 296
      Activities.insert({                                                                                             // 297
        userId: userId,                                                                                               // 298
        oldBoardId: oldBoardId,                                                                                       // 299
        activityType: 'moveList',                                                                                     // 300
        listId: doc._id,                                                                                              // 301
        boardId: doc.boardId                                                                                          // 302
      });                                                                                                             // 297
    }                                                                                                                 // 304
                                                                                                                      //
    var oldListTitle = this.previous.title;                                                                           // 306
    if (_.contains(fieldNames, 'title')) {                                                                            // 307
      Activities.insert({                                                                                             // 308
        userId: userId,                                                                                               // 309
        oldListTitle: oldListTitle,                                                                                   // 310
        activityType: 'renameList',                                                                                   // 311
        listId: doc._id,                                                                                              // 312
        boardId: doc.boardId                                                                                          // 313
      });                                                                                                             // 308
    }                                                                                                                 // 315
                                                                                                                      //
    var oldListDescription = this.previous.description || "no description";                                           // 317
    if (_.contains(fieldNames, 'description')) {                                                                      // 318
      Activities.insert({                                                                                             // 319
        userId: userId,                                                                                               // 320
        oldListDescription: oldListDescription,                                                                       // 321
        activityType: 'updateDescriptionList',                                                                        // 322
        listId: doc._id,                                                                                              // 323
        boardId: doc.boardId                                                                                          // 324
      });                                                                                                             // 319
    }                                                                                                                 // 326
                                                                                                                      //
    if (_.contains(fieldNames, 'isRepeating')) {                                                                      // 328
      Activities.insert({                                                                                             // 329
        userId: userId,                                                                                               // 330
        activityType: 'updateRepeating',                                                                              // 331
        listId: doc._id,                                                                                              // 332
        boardId: doc.boardId                                                                                          // 333
      });                                                                                                             // 329
    }                                                                                                                 // 335
                                                                                                                      //
    if (_.contains(fieldNames, 'sort')) {                                                                             // 337
      Activities.insert({                                                                                             // 338
        userId: userId,                                                                                               // 339
        activityType: 'updateOrderList',                                                                              // 340
        listId: doc._id,                                                                                              // 341
        boardId: doc.boardId,                                                                                         // 342
        sort: doc.sort                                                                                                // 343
      });                                                                                                             // 338
    }                                                                                                                 // 345
  });                                                                                                                 // 346
                                                                                                                      //
  // Add a new activity if we add or remove a member to the list                                                      //
  Lists.before.update(function (userId, doc, fieldNames, modifier) {                                                  // 349
    if (!_.contains(fieldNames, 'members')) return;                                                                   // 350
    var memberId = void 0;                                                                                            // 352
    // Say hello to the new member                                                                                    //
    if (modifier.$addToSet && modifier.$addToSet.members) {                                                           // 354
      memberId = modifier.$addToSet.members;                                                                          // 355
      if (!_.contains(doc.members, memberId)) {                                                                       // 356
        Activities.insert({                                                                                           // 357
          userId: userId,                                                                                             // 358
          memberId: memberId,                                                                                         // 359
          activityType: 'joinMember',                                                                                 // 360
          boardId: doc.boardId,                                                                                       // 361
          listId: doc._id                                                                                             // 362
        });                                                                                                           // 357
      }                                                                                                               // 364
    }                                                                                                                 // 365
                                                                                                                      //
    // Say goodbye to the former member                                                                               //
    if (modifier.$pull && modifier.$pull.members) {                                                                   // 368
      memberId = modifier.$pull.members;                                                                              // 369
      Activities.insert({                                                                                             // 370
        userId: userId,                                                                                               // 371
        memberId: memberId,                                                                                           // 372
        activityType: 'unjoinMember',                                                                                 // 373
        boardId: doc.boardId,                                                                                         // 374
        listId: doc._id                                                                                               // 375
      });                                                                                                             // 370
    }                                                                                                                 // 377
  });                                                                                                                 // 378
                                                                                                                      //
  Lists.after.remove(function (userId, doc) {                                                                         // 380
    Cards.remove({ listId: doc._id });                                                                                // 381
    CardComments.remove({ listId: doc._id });                                                                         // 382
    Activities.remove({ listId: doc._id });                                                                           // 383
  });                                                                                                                 // 384
}                                                                                                                     // 385
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unsavedEdits.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/unsavedEdits.js                                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// This collection shouldn't be manipulated directly by instead throw the                                             //
// `UnsavedEdits` API on the client.                                                                                  //
UnsavedEditCollection = new Mongo.Collection('unsaved-edits');                                                        // 3
                                                                                                                      //
UnsavedEditCollection.attachSchema(new SimpleSchema({                                                                 // 5
  fieldName: {                                                                                                        // 6
    type: String                                                                                                      // 7
  },                                                                                                                  // 6
  docId: {                                                                                                            // 9
    type: String                                                                                                      // 10
  },                                                                                                                  // 9
  value: {                                                                                                            // 12
    type: String                                                                                                      // 13
  },                                                                                                                  // 12
  userId: {                                                                                                           // 15
    type: String,                                                                                                     // 16
    autoValue: function autoValue() {                                                                                 // 17
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 18
        return this.userId;                                                                                           // 19
      }                                                                                                               // 20
    }                                                                                                                 // 21
  }                                                                                                                   // 15
}));                                                                                                                  // 5
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 25
  var isAuthor = function isAuthor(userId, doc) {                                                                     // 25
    var fieldNames = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];                         // 26
                                                                                                                      //
    return userId === doc.userId && fieldNames.indexOf('userId') === -1;                                              // 27
  };                                                                                                                  // 28
                                                                                                                      //
  UnsavedEditCollection.allow({                                                                                       // 29
    insert: isAuthor,                                                                                                 // 30
    update: isAuthor,                                                                                                 // 31
    remove: isAuthor,                                                                                                 // 32
    fetch: ['userId']                                                                                                 // 33
  });                                                                                                                 // 29
}                                                                                                                     // 35
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/users.js                                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Sandstorm context is detected using the METEOR_SETTINGS environment variable                                       //
// in the package definition.                                                                                         //
var isSandstorm = Meteor.settings && Meteor.settings['public'] && Meteor.settings['public'].sandstorm;                // 3
Users = Meteor.users;                                                                                                 // 5
                                                                                                                      //
Users.attachSchema(new SimpleSchema({                                                                                 // 7
  username: {                                                                                                         // 8
    type: String,                                                                                                     // 9
    optional: true,                                                                                                   // 10
    autoValue: function autoValue() {                                                                                 // 11
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 12
        var name = this.field('profile.fullname');                                                                    // 13
        if (name.isSet) {                                                                                             // 14
          return name.value.toLowerCase().replace(/\s/g, '');                                                         // 15
        }                                                                                                             // 16
      }                                                                                                               // 17
    }                                                                                                                 // 18
  },                                                                                                                  // 8
  emails: {                                                                                                           // 20
    type: [Object],                                                                                                   // 21
    optional: true                                                                                                    // 22
  },                                                                                                                  // 20
  'emails.$.address': {                                                                                               // 24
    type: String,                                                                                                     // 25
    regEx: SimpleSchema.RegEx.Email                                                                                   // 26
  },                                                                                                                  // 24
  'emails.$.verified': {                                                                                              // 28
    type: Boolean                                                                                                     // 29
  },                                                                                                                  // 28
  createdAt: {                                                                                                        // 31
    type: Date,                                                                                                       // 32
    autoValue: function autoValue() {                                                                                 // 33
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert) {                                                                                            // 34
        return new Date();                                                                                            // 35
      } else {                                                                                                        // 36
        this.unset();                                                                                                 // 37
      }                                                                                                               // 38
    }                                                                                                                 // 39
  },                                                                                                                  // 31
  profile: {                                                                                                          // 41
    type: Object,                                                                                                     // 42
    optional: true,                                                                                                   // 43
    autoValue: function autoValue() {                                                                                 // 44
      // eslint-disable-line consistent-return                                                                        //
      if (this.isInsert && !this.isSet) {                                                                             // 45
        return {};                                                                                                    // 46
      }                                                                                                               // 47
    }                                                                                                                 // 48
  },                                                                                                                  // 41
  'profile.avatarUrl': {                                                                                              // 50
    type: String,                                                                                                     // 51
    optional: true                                                                                                    // 52
  },                                                                                                                  // 50
  'profile.emailBuffer': {                                                                                            // 54
    type: [String],                                                                                                   // 55
    optional: true                                                                                                    // 56
  },                                                                                                                  // 54
  'profile.fullname': {                                                                                               // 58
    type: String,                                                                                                     // 59
    optional: true                                                                                                    // 60
  },                                                                                                                  // 58
  'profile.hiddenSystemMessages': {                                                                                   // 62
    type: Boolean,                                                                                                    // 63
    optional: true                                                                                                    // 64
  },                                                                                                                  // 62
  'profile.initials': {                                                                                               // 66
    type: String,                                                                                                     // 67
    optional: true                                                                                                    // 68
  },                                                                                                                  // 66
  'profile.invitedBoards': {                                                                                          // 70
    type: [String],                                                                                                   // 71
    optional: true                                                                                                    // 72
  },                                                                                                                  // 70
  'profile.language': {                                                                                               // 74
    type: String,                                                                                                     // 75
    optional: true                                                                                                    // 76
  },                                                                                                                  // 74
  'profile.notifications': {                                                                                          // 78
    type: [String],                                                                                                   // 79
    optional: true                                                                                                    // 80
  },                                                                                                                  // 78
  'profile.showCardsCountAt': {                                                                                       // 82
    type: Number,                                                                                                     // 83
    optional: true                                                                                                    // 84
  },                                                                                                                  // 82
  'profile.starredBoards': {                                                                                          // 86
    type: [String],                                                                                                   // 87
    optional: true                                                                                                    // 88
  },                                                                                                                  // 86
  'profile.tags': {                                                                                                   // 90
    type: [String],                                                                                                   // 91
    optional: true                                                                                                    // 92
  },                                                                                                                  // 90
  services: {                                                                                                         // 94
    type: Object,                                                                                                     // 95
    optional: true,                                                                                                   // 96
    blackbox: true                                                                                                    // 97
  },                                                                                                                  // 94
  heartbeat: {                                                                                                        // 99
    type: Date,                                                                                                       // 100
    optional: true                                                                                                    // 101
  },                                                                                                                  // 99
  group: {                                                                                                            // 103
    type: String,                                                                                                     // 104
    optional: true                                                                                                    // 105
  }                                                                                                                   // 103
}));                                                                                                                  // 7
                                                                                                                      //
// Search a user in the complete server database by its name or username. This                                        //
// is used for instance to add a new user to a board.                                                                 //
var searchInFields = ['username', 'profile.fullname'];                                                                // 111
Users.initEasySearch(searchInFields, {                                                                                // 112
  use: 'mongo-db',                                                                                                    // 113
  returnFields: [].concat(searchInFields, ['profile.avatarUrl'])                                                      // 114
});                                                                                                                   // 112
                                                                                                                      //
if (Meteor.isClient) {                                                                                                // 117
  Users.helpers({                                                                                                     // 118
    isBoardMember: function isBoardMember() {                                                                         // 119
      var board = Boards.findOne(Session.get('currentBoard'));                                                        // 120
      return board && (board.hasMember(this._id) || board.hasGroup(this.group) || board.hasGroup("public"));          // 121
    },                                                                                                                // 122
    isBoardAdmin: function isBoardAdmin() {                                                                           // 124
      var board = Boards.findOne(Session.get('currentBoard'));                                                        // 125
      return board && (board.hasAdmin(this._id) || board.hasGroup(this.group) || board.hasGroup("public"));           // 126
    }                                                                                                                 // 127
  });                                                                                                                 // 118
}                                                                                                                     // 129
                                                                                                                      //
Users.helpers({                                                                                                       // 131
  boards: function boards() {                                                                                         // 132
    return Boards.find({ userId: this._id });                                                                         // 133
  },                                                                                                                  // 134
  starredBoards: function starredBoards() {                                                                           // 136
    var _profile$starredBoard = this.profile.starredBoards;                                                           // 136
    var starredBoards = _profile$starredBoard === undefined ? [] : _profile$starredBoard;                             // 136
                                                                                                                      //
    return Boards.find({ archived: false, _id: { $in: starredBoards } });                                             // 138
  },                                                                                                                  // 139
  hasStarred: function hasStarred(boardId) {                                                                          // 141
    var _profile$starredBoard2 = this.profile.starredBoards;                                                          // 141
    var starredBoards = _profile$starredBoard2 === undefined ? [] : _profile$starredBoard2;                           // 141
                                                                                                                      //
    return _.contains(starredBoards, boardId);                                                                        // 143
  },                                                                                                                  // 144
  invitedBoards: function invitedBoards() {                                                                           // 146
    var _profile$invitedBoard = this.profile.invitedBoards;                                                           // 146
    var invitedBoards = _profile$invitedBoard === undefined ? [] : _profile$invitedBoard;                             // 146
                                                                                                                      //
    return Boards.find({ archived: false, _id: { $in: invitedBoards } });                                             // 148
  },                                                                                                                  // 149
  isInvitedTo: function isInvitedTo(boardId) {                                                                        // 151
    var _profile$invitedBoard2 = this.profile.invitedBoards;                                                          // 151
    var invitedBoards = _profile$invitedBoard2 === undefined ? [] : _profile$invitedBoard2;                           // 151
                                                                                                                      //
    return _.contains(invitedBoards, boardId);                                                                        // 153
  },                                                                                                                  // 154
  hasTag: function hasTag(tag) {                                                                                      // 156
    var _profile$tags = this.profile.tags;                                                                            // 156
    var tags = _profile$tags === undefined ? [] : _profile$tags;                                                      // 156
                                                                                                                      //
    return _.contains(tags, tag);                                                                                     // 158
  },                                                                                                                  // 159
  hasNotification: function hasNotification(activityId) {                                                             // 161
    var _profile$notification = this.profile.notifications;                                                           // 161
    var notifications = _profile$notification === undefined ? [] : _profile$notification;                             // 161
                                                                                                                      //
    return _.contains(notifications, activityId);                                                                     // 163
  },                                                                                                                  // 164
  hasHiddenSystemMessages: function hasHiddenSystemMessages() {                                                       // 166
    var profile = this.profile || {};                                                                                 // 167
    return profile.hiddenSystemMessages || false;                                                                     // 168
  },                                                                                                                  // 169
  getEmailBuffer: function getEmailBuffer() {                                                                         // 171
    var _profile$emailBuffer = this.profile.emailBuffer;                                                              // 171
    var emailBuffer = _profile$emailBuffer === undefined ? [] : _profile$emailBuffer;                                 // 171
                                                                                                                      //
    return emailBuffer;                                                                                               // 173
  },                                                                                                                  // 174
  getInitials: function getInitials() {                                                                               // 176
    var profile = this.profile || {};                                                                                 // 177
    if (profile.initials) return profile.initials;else if (profile.fullname) {                                        // 178
      return profile.fullname.split(/\s+/).reduce(function (memo, word) {                                             // 182
        return memo + word[0];                                                                                        // 183
      }, '').toUpperCase();                                                                                           // 184
    } else {                                                                                                          // 186
      return this.username[0].toUpperCase();                                                                          // 187
    }                                                                                                                 // 188
  },                                                                                                                  // 189
  getLimitToShowCardsCount: function getLimitToShowCardsCount() {                                                     // 191
    var profile = this.profile || {};                                                                                 // 192
    return profile.showCardsCountAt;                                                                                  // 193
  },                                                                                                                  // 194
  getName: function getName() {                                                                                       // 196
    var profile = this.profile || {};                                                                                 // 197
    return profile.fullname || this.username;                                                                         // 198
  },                                                                                                                  // 199
  getLanguage: function getLanguage() {                                                                               // 201
    var profile = this.profile || {};                                                                                 // 202
    return profile.language || 'en';                                                                                  // 203
  }                                                                                                                   // 204
});                                                                                                                   // 131
                                                                                                                      //
Users.mutations({                                                                                                     // 207
  toggleBoardStar: function toggleBoardStar(boardId) {                                                                // 208
    var _ref;                                                                                                         // 208
                                                                                                                      //
    var queryKind = this.hasStarred(boardId) ? '$pull' : '$addToSet';                                                 // 209
    return _ref = {}, _ref[queryKind] = {                                                                             // 210
      'profile.starredBoards': boardId                                                                                // 212
    }, _ref;                                                                                                          // 211
  },                                                                                                                  // 215
  addInvite: function addInvite(boardId) {                                                                            // 217
    return {                                                                                                          // 218
      $addToSet: {                                                                                                    // 219
        'profile.invitedBoards': boardId                                                                              // 220
      }                                                                                                               // 219
    };                                                                                                                // 218
  },                                                                                                                  // 223
  removeInvite: function removeInvite(boardId) {                                                                      // 225
    return {                                                                                                          // 226
      $pull: {                                                                                                        // 227
        'profile.invitedBoards': boardId                                                                              // 228
      }                                                                                                               // 227
    };                                                                                                                // 226
  },                                                                                                                  // 231
  addTag: function addTag(tag) {                                                                                      // 233
    return {                                                                                                          // 234
      $addToSet: {                                                                                                    // 235
        'profile.tags': tag                                                                                           // 236
      }                                                                                                               // 235
    };                                                                                                                // 234
  },                                                                                                                  // 239
  removeTag: function removeTag(tag) {                                                                                // 241
    return {                                                                                                          // 242
      $pull: {                                                                                                        // 243
        'profile.tags': tag                                                                                           // 244
      }                                                                                                               // 243
    };                                                                                                                // 242
  },                                                                                                                  // 247
  toggleTag: function toggleTag(tag) {                                                                                // 249
    if (this.hasTag(tag)) this.removeTag(tag);else this.addTag(tag);                                                  // 250
  },                                                                                                                  // 254
  toggleSystem: function toggleSystem() {                                                                             // 256
    var value = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];                           // 256
                                                                                                                      //
    return {                                                                                                          // 257
      $set: {                                                                                                         // 258
        'profile.hiddenSystemMessages': !value                                                                        // 259
      }                                                                                                               // 258
    };                                                                                                                // 257
  },                                                                                                                  // 262
  addNotification: function addNotification(activityId) {                                                             // 264
    return {                                                                                                          // 265
      $addToSet: {                                                                                                    // 266
        'profile.notifications': activityId                                                                           // 267
      }                                                                                                               // 266
    };                                                                                                                // 265
  },                                                                                                                  // 270
  removeNotification: function removeNotification(activityId) {                                                       // 272
    return {                                                                                                          // 273
      $pull: {                                                                                                        // 274
        'profile.notifications': activityId                                                                           // 275
      }                                                                                                               // 274
    };                                                                                                                // 273
  },                                                                                                                  // 278
  addEmailBuffer: function addEmailBuffer(text) {                                                                     // 280
    return {                                                                                                          // 281
      $addToSet: {                                                                                                    // 282
        'profile.emailBuffer': text                                                                                   // 283
      }                                                                                                               // 282
    };                                                                                                                // 281
  },                                                                                                                  // 286
  clearEmailBuffer: function clearEmailBuffer() {                                                                     // 288
    return {                                                                                                          // 289
      $set: {                                                                                                         // 290
        'profile.emailBuffer': []                                                                                     // 291
      }                                                                                                               // 290
    };                                                                                                                // 289
  },                                                                                                                  // 294
  setAvatarUrl: function setAvatarUrl(avatarUrl) {                                                                    // 296
    return { $set: { 'profile.avatarUrl': avatarUrl } };                                                              // 297
  },                                                                                                                  // 298
  setGroup: function setGroup(group) {                                                                                // 300
    return { $set: { group: group } };                                                                                // 301
  },                                                                                                                  // 302
  setShowCardsCountAt: function setShowCardsCountAt(limit) {                                                          // 304
    return { $set: { 'profile.showCardsCountAt': limit } };                                                           // 305
  }                                                                                                                   // 306
});                                                                                                                   // 207
                                                                                                                      //
Meteor.methods({                                                                                                      // 309
  setUsername: function setUsername(username) {                                                                       // 310
    check(username, String);                                                                                          // 311
    var nUsersWithUsername = Users.find({ username: username }).count();                                              // 312
    if (nUsersWithUsername > 0) {                                                                                     // 313
      throw new Meteor.Error('username-already-taken');                                                               // 314
    } else {                                                                                                          // 315
      Users.update(this.userId, { $set: { username: username } });                                                    // 316
    }                                                                                                                 // 317
  },                                                                                                                  // 318
  toggleSystemMessages: function toggleSystemMessages() {                                                             // 319
    var user = Meteor.user();                                                                                         // 320
    user.toggleSystem(user.hasHiddenSystemMessages());                                                                // 321
  },                                                                                                                  // 322
  changeLimitToShowCardsCount: function changeLimitToShowCardsCount(limit) {                                          // 323
    check(limit, Number);                                                                                             // 324
    Meteor.user().setShowCardsCountAt(limit);                                                                         // 325
  }                                                                                                                   // 326
});                                                                                                                   // 309
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 329
                                                                                                                      //
  Users.allow({                                                                                                       // 331
    update: function update(userId) {                                                                                 // 332
      return true;                                                                                                    // 333
    }                                                                                                                 // 334
  });                                                                                                                 // 331
                                                                                                                      //
  Meteor.methods({                                                                                                    // 337
    // we accept userId, username, email                                                                              //
                                                                                                                      //
    inviteUserToBoard: function inviteUserToBoard(username, boardId, group) {                                         // 339
      check(username, String);                                                                                        // 340
      check(boardId, String);                                                                                         // 341
      check(group, String);                                                                                           // 342
                                                                                                                      //
      var inviter = Meteor.user();                                                                                    // 344
      var board = Boards.findOne(boardId);                                                                            // 345
      var allowInvite = inviter && board && board.members && _.contains(_.pluck(board.members, 'userId'), inviter._id) && _.where(board.members, { userId: inviter._id })[0].isActive && _.where(board.members, { userId: inviter._id })[0].isAdmin;
      if (!allowInvite) throw new Meteor.Error('error-board-notAMember');                                             // 352
                                                                                                                      //
      this.unblock();                                                                                                 // 354
                                                                                                                      //
      var posAt = username.indexOf('@');                                                                              // 356
      var user = null;                                                                                                // 357
      if (posAt >= 0) {                                                                                               // 358
        user = Users.findOne({ emails: { $elemMatch: { address: username } } });                                      // 359
      } else {                                                                                                        // 360
        user = Users.findOne(username) || Users.findOne({ username: username });                                      // 361
      }                                                                                                               // 362
      if (user) {                                                                                                     // 363
        if (user._id === inviter._id) throw new Meteor.Error('error-user-notAllowSelf');                              // 364
      } else {                                                                                                        // 365
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');                                            // 366
                                                                                                                      //
        var email = username;                                                                                         // 368
        username = email.substring(0, posAt);                                                                         // 369
        var newUserId = Accounts.createUser({ username: username, email: email });                                    // 370
        if (!newUserId) throw new Meteor.Error('error-user-notCreated');                                              // 371
        // assume new user speak same language with inviter                                                           //
        if (inviter.profile && inviter.profile.language) {                                                            // 373
          Users.update(newUserId, {                                                                                   // 374
            $set: {                                                                                                   // 375
              'profile.language': inviter.profile.language                                                            // 376
            }                                                                                                         // 375
          });                                                                                                         // 374
        }                                                                                                             // 379
        Accounts.sendEnrollmentEmail(newUserId);                                                                      // 380
        user = Users.findOne(newUserId);                                                                              // 381
      }                                                                                                               // 382
      board.addMember(user._id, group);                                                                               // 383
      user.addInvite(boardId);                                                                                        // 384
                                                                                                                      //
      try {                                                                                                           // 386
        var params = {                                                                                                // 387
          user: user.username,                                                                                        // 388
          inviter: inviter.username,                                                                                  // 389
          board: board.title,                                                                                         // 390
          url: board.absoluteUrl()                                                                                    // 391
        };                                                                                                            // 387
        var lang = user.getLanguage();                                                                                // 393
        Email.send({                                                                                                  // 394
          to: user.emails[0].address,                                                                                 // 395
          from: Accounts.emailTemplates.from,                                                                         // 396
          subject: TAPi18n.__('email-invite-subject', params, lang),                                                  // 397
          text: TAPi18n.__('email-invite-text', params, lang)                                                         // 398
        });                                                                                                           // 394
      } catch (e) {                                                                                                   // 400
        throw new Meteor.Error('email-fail', e.message);                                                              // 401
      }                                                                                                               // 402
                                                                                                                      //
      return { username: user.username, email: user.emails[0].address };                                              // 404
    }                                                                                                                 // 405
  });                                                                                                                 // 337
}                                                                                                                     // 407
                                                                                                                      //
if (Meteor.isServer) {                                                                                                // 409
  (function () {                                                                                                      // 409
    // Let mongoDB ensure username unicity                                                                            //
    Meteor.startup(function () {                                                                                      // 411
      Users._collection._ensureIndex({                                                                                // 412
        username: 1                                                                                                   // 413
      }, { unique: true });                                                                                           // 412
    });                                                                                                               // 415
                                                                                                                      //
    // Each board document contains the de-normalized number of users that have                                       //
    // starred it. If the user star or unstar a board, we need to update this                                         //
    // counter.                                                                                                       //
    // We need to run this code on the server only, otherwise the incrementation                                      //
    // will be done twice.                                                                                            //
    Users.after.update(function (userId, user, fieldNames) {                                                          // 422
      // Set group on board                                                                                           //
      if (_.contains(fieldNames, 'group')) {                                                                          // 424
        // set group on each owned board                                                                              //
        var boards = Boards.find({ 'members.userId': user._id }).fetch();                                             // 426
        _.each(boards, function (board) {                                                                             // 427
          board.setGroup(user._id, user.group);                                                                       // 428
        });                                                                                                           // 429
      }                                                                                                               // 430
                                                                                                                      //
      // The `starredBoards` list is hosted on the `profile` field. If this                                           //
      // field hasn't been modificated we don't need to run this hook.                                                //
      if (!_.contains(fieldNames, 'profile')) return;                                                                 // 434
                                                                                                                      //
      // To calculate a diff of board starred ids, we get both the previous                                           //
      // and the newly board ids list                                                                                 //
      function getStarredBoardsIds(doc) {                                                                             // 439
        return doc.profile && doc.profile.starredBoards;                                                              // 440
      }                                                                                                               // 441
      var oldIds = getStarredBoardsIds(this.previous);                                                                // 442
      var newIds = getStarredBoardsIds(user);                                                                         // 443
                                                                                                                      //
      // The _.difference(a, b) method returns the values from a that are not in                                      //
      // b. We use it to find deleted and newly inserted ids by using it in one                                       //
      // direction and then in the other.                                                                             //
      function incrementBoards(boardsIds, inc) {                                                                      // 448
        boardsIds.forEach(function (boardId) {                                                                        // 449
          Boards.update(boardId, { $inc: { stars: inc } });                                                           // 450
        });                                                                                                           // 451
      }                                                                                                               // 452
      incrementBoards(_.difference(oldIds, newIds), -1);                                                              // 453
      incrementBoards(_.difference(newIds, oldIds), +1);                                                              // 454
    });                                                                                                               // 455
                                                                                                                      //
    var fakeUserId = new Meteor.EnvironmentVariable();                                                                // 457
    var getUserId = CollectionHooks.getUserId;                                                                        // 458
    CollectionHooks.getUserId = function () {                                                                         // 459
      return fakeUserId.get() || getUserId();                                                                         // 460
    };                                                                                                                // 461
                                                                                                                      //
    if (!isSandstorm) {                                                                                               // 463
      Users.after.insert(function (userId, doc) {                                                                     // 464
        var fakeUser = {                                                                                              // 465
          extendAutoValueContext: {                                                                                   // 466
            userId: doc._id                                                                                           // 467
          }                                                                                                           // 466
        };                                                                                                            // 465
                                                                                                                      //
        fakeUserId.withValue(doc._id, function () {                                                                   // 471
          // Insert the Welcome Board                                                                                 //
          Boards.insert({                                                                                             // 473
            title: TAPi18n.__('welcome-board'),                                                                       // 474
            permission: 'private'                                                                                     // 475
          }, fakeUser, function (err, boardId) {                                                                      // 473
            var sort = 0;                                                                                             // 477
            ['welcome-list1', 'welcome-list2'].forEach(function (title) {                                             // 478
              Lists.insert({ title: TAPi18n.__(title), boardId: boardId, sort: sort }, fakeUser);                     // 479
              sort++;                                                                                                 // 480
            });                                                                                                       // 481
          });                                                                                                         // 482
        });                                                                                                           // 483
      });                                                                                                             // 484
    }                                                                                                                 // 485
  })();                                                                                                               // 409
}                                                                                                                     // 486
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"watchable.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// models/watchable.js                                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// simple version, only toggle watch / unwatch                                                                        //
var simpleWatchable = function simpleWatchable(collection) {                                                          // 2
  collection.attachSchema({                                                                                           // 3
    watchers: {                                                                                                       // 4
      type: [String],                                                                                                 // 5
      optional: true                                                                                                  // 6
    }                                                                                                                 // 4
  });                                                                                                                 // 3
                                                                                                                      //
  collection.helpers({                                                                                                // 10
    getWatchLevels: function getWatchLevels() {                                                                       // 11
      return [true, false];                                                                                           // 12
    },                                                                                                                // 13
    watcherIndex: function watcherIndex(userId) {                                                                     // 15
      return this.watchers.indexOf(userId);                                                                           // 16
    },                                                                                                                // 17
    findWatcher: function findWatcher(userId) {                                                                       // 19
      return _.contains(this.watchers, userId);                                                                       // 20
    }                                                                                                                 // 21
  });                                                                                                                 // 10
                                                                                                                      //
  collection.mutations({                                                                                              // 24
    setWatcher: function setWatcher(userId, level) {                                                                  // 25
      // if level undefined or null or false, then remove                                                             //
      if (!level) return { $pull: { watchers: userId } };                                                             // 27
      return { $addToSet: { watchers: userId } };                                                                     // 28
    }                                                                                                                 // 29
  });                                                                                                                 // 24
};                                                                                                                    // 31
                                                                                                                      //
// more complex version of same interface, with 3 watching levels                                                     //
var complexWatchOptions = ['watching', 'tracking', 'muted'];                                                          // 34
var complexWatchDefault = 'muted';                                                                                    // 35
                                                                                                                      //
var complexWatchable = function complexWatchable(collection) {                                                        // 37
  collection.attachSchema({                                                                                           // 38
    'watchers.$.userId': {                                                                                            // 39
      type: String                                                                                                    // 40
    },                                                                                                                // 39
    'watchers.$.level': {                                                                                             // 42
      type: String,                                                                                                   // 43
      allowedValues: complexWatchOptions                                                                              // 44
    }                                                                                                                 // 42
  });                                                                                                                 // 38
                                                                                                                      //
  collection.helpers({                                                                                                // 48
    getWatchOptions: function getWatchOptions() {                                                                     // 49
      return complexWatchOptions;                                                                                     // 50
    },                                                                                                                // 51
    getWatchDefault: function getWatchDefault() {                                                                     // 53
      return complexWatchDefault;                                                                                     // 54
    },                                                                                                                // 55
    watcherIndex: function watcherIndex(userId) {                                                                     // 57
      return _.pluck(this.watchers, 'userId').indexOf(userId);                                                        // 58
    },                                                                                                                // 59
    findWatcher: function findWatcher(userId) {                                                                       // 61
      return _.findWhere(this.watchers, { userId: userId });                                                          // 62
    },                                                                                                                // 63
    getWatchLevel: function getWatchLevel(userId) {                                                                   // 65
      var watcher = this.findWatcher(userId);                                                                         // 66
      return watcher ? watcher.level : complexWatchDefault;                                                           // 67
    }                                                                                                                 // 68
  });                                                                                                                 // 48
                                                                                                                      //
  collection.mutations({                                                                                              // 71
    setWatcher: function setWatcher(userId, level) {                                                                  // 72
      var _$set;                                                                                                      // 72
                                                                                                                      //
      // if level undefined or null or false, then remove                                                             //
      if (level === complexWatchDefault) level = null;                                                                // 74
      if (!level) return { $pull: { watchers: { userId: userId } } };                                                 // 75
      var index = this.watcherIndex(userId);                                                                          // 76
      if (index < 0) return { $push: { watchers: { userId: userId, level: level } } };                                // 77
      return {                                                                                                        // 78
        $set: (_$set = {}, _$set['watchers.' + index + '.level'] = level, _$set)                                      // 79
      };                                                                                                              // 78
    }                                                                                                                 // 83
  });                                                                                                                 // 71
};                                                                                                                    // 85
                                                                                                                      //
complexWatchable(Boards);                                                                                             // 87
simpleWatchable(Lists);                                                                                               // 88
simpleWatchable(Cards);                                                                                               // 89
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"sandstorm.js":["babel-runtime/helpers/typeof","fs","capnp",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// sandstorm.js                                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _typeof;module.import('babel-runtime/helpers/typeof',{"default":function(v){_typeof=v}});                         //
// Sandstorm context is detected using the METEOR_SETTINGS environment variable                                       //
// in the package definition.                                                                                         //
var isSandstorm = Meteor.settings && Meteor.settings['public'] && Meteor.settings['public'].sandstorm;                // 3
                                                                                                                      //
// In sandstorm we only have one board per sandstorm instance. Since we want to                                       //
// keep most of our code unchanged, we simply hard-code a board `_id` and                                             //
// redirect the user to this particular board.                                                                        //
var sandstormBoard = {                                                                                                // 9
  _id: 'sandstorm',                                                                                                   // 10
                                                                                                                      //
  // XXX Should be shared with the grain instance name.                                                               //
  title: 'Wekan',                                                                                                     // 13
  slug: 'libreboard',                                                                                                 // 14
  members: [],                                                                                                        // 15
                                                                                                                      //
  // Board access security is handled by sandstorm, so in our point of view we                                        //
  // can alway assume that the board is public (unauthorized users won't be able                                      //
  // to access it anyway).                                                                                            //
  permission: 'public'                                                                                                // 20
};                                                                                                                    // 9
                                                                                                                      //
if (isSandstorm && Meteor.isServer) {                                                                                 // 23
  (function () {                                                                                                      // 23
    var getHttpBridge = function getHttpBridge() {                                                                    // 23
      if (!httpBridge) {                                                                                              // 40
        capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');                                                   // 41
        httpBridge = capnpConnection.restore(null, SandstormHttpBridge);                                              // 42
      }                                                                                                               // 43
      return httpBridge;                                                                                              // 44
    };                                                                                                                // 45
                                                                                                                      //
    var reportActivity = function reportActivity(sessionId, path, type, users, caption) {                             // 23
      var httpBridge = getHttpBridge();                                                                               // 106
      var session = httpBridge.getSessionContext(sessionId).context;                                                  // 107
      Meteor.wrapAsync(function (done) {                                                                              // 108
        return Promise.all(users.map(function (user) {                                                                // 109
          return httpBridge.getSavedIdentity(user.id).then(function (response) {                                      // 110
            // Call getProfile() to make sure that the identity successfully resolves.                                //
            // (In C++ we would instead call whenResolved() here.)                                                    //
            var identity = response.identity;                                                                         // 113
            return identity.getProfile().then(function () {                                                           // 114
              return { identity: identity,                                                                            // 115
                mentioned: !!user.mentioned,                                                                          // 116
                subscribed: !!user.subscribed                                                                         // 117
              };                                                                                                      // 115
            });                                                                                                       // 119
          })['catch'](function () {                                                                                   // 120
            // Ignore identities that fail to restore. Either they were added before we set                           //
            // `saveIdentityCaps` to true, or they have lost access to the board.                                     //
          });                                                                                                         // 123
        })).then(function (maybeUsers) {                                                                              // 124
          var users = maybeUsers.filter(function (u) {                                                                // 125
            return !!u;                                                                                               // 125
          });                                                                                                         // 125
          var event = { path: path, type: type, users: users };                                                       // 126
          if (caption) {                                                                                              // 127
            event.notification = { caption: caption };                                                                // 128
          }                                                                                                           // 129
                                                                                                                      //
          return session.activity(event);                                                                             // 131
        }).then(function () {                                                                                         // 132
          return done();                                                                                              // 132
        }, function (e) {                                                                                             // 132
          return done(e);                                                                                             // 133
        });                                                                                                           // 133
      })();                                                                                                           // 134
    };                                                                                                                // 135
                                                                                                                      //
    var updateUserPermissions = function updateUserPermissions(userId, permissions) {                                 // 23
      var _$set;                                                                                                      // 205
                                                                                                                      //
      var isActive = permissions.indexOf('participate') > -1;                                                         // 206
      var isAdmin = permissions.indexOf('configure') > -1;                                                            // 207
      var permissionDoc = { userId: userId, isActive: isActive, isAdmin: isAdmin };                                   // 208
                                                                                                                      //
      var boardMembers = Boards.findOne(sandstormBoard._id).members;                                                  // 210
      var memberIndex = _.pluck(boardMembers, 'userId').indexOf(userId);                                              // 211
                                                                                                                      //
      var modifier = void 0;                                                                                          // 213
      if (memberIndex > -1) modifier = { $set: (_$set = {}, _$set['members.' + memberIndex] = permissionDoc, _$set) };else if (!isActive) modifier = {};else modifier = { $push: { members: permissionDoc } };
                                                                                                                      //
      Boards.update(sandstormBoard._id, modifier);                                                                    // 221
    };                                                                                                                // 222
                                                                                                                      //
    var fs = require('fs');                                                                                           // 24
    var Capnp = require('capnp');                                                                                     // 25
    var Package = Capnp.importSystem('sandstorm/package.capnp');                                                      // 26
    var Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');                                                    // 27
    var Identity = Capnp.importSystem('sandstorm/identity.capnp');                                                    // 28
    var SandstormHttpBridge = Capnp.importSystem('sandstorm/sandstorm-http-bridge.capnp').SandstormHttpBridge;        // 29
                                                                                                                      //
    var httpBridge = null;                                                                                            // 32
    var capnpConnection = null;                                                                                       // 33
                                                                                                                      //
    var bridgeConfig = Capnp.parse(Package.BridgeConfig, fs.readFileSync('/sandstorm-http-bridge-config'));           // 35
                                                                                                                      //
    Meteor.methods({                                                                                                  // 47
      sandstormClaimIdentityRequest: function sandstormClaimIdentityRequest(token, descriptor) {                      // 48
        check(token, String);                                                                                         // 49
        check(descriptor, String);                                                                                    // 50
                                                                                                                      //
        var parsedDescriptor = Capnp.parse(Powerbox.PowerboxDescriptor, new Buffer(descriptor, 'base64'), { packed: true });
                                                                                                                      //
        var tag = Capnp.parse(Identity.Identity.PowerboxTag, parsedDescriptor.tags[0].value);                         // 57
        var permissions = [];                                                                                         // 58
        if (tag.permissions[1]) {                                                                                     // 59
          permissions.push('configure');                                                                              // 60
        }                                                                                                             // 61
                                                                                                                      //
        if (tag.permissions[0]) {                                                                                     // 63
          permissions.push('participate');                                                                            // 64
        }                                                                                                             // 65
                                                                                                                      //
        var sessionId = this.connection.sandstormSessionId();                                                         // 67
        var httpBridge = getHttpBridge();                                                                             // 68
        var session = httpBridge.getSessionContext(sessionId).context;                                                // 69
        var api = httpBridge.getSandstormApi(sessionId).api;                                                          // 70
                                                                                                                      //
        Meteor.wrapAsync(function (done) {                                                                            // 72
          session.claimRequest(token).then(function (response) {                                                      // 73
            var identity = response.cap.castAs(Identity.Identity);                                                    // 74
            var promises = [api.getIdentityId(identity), identity.getProfile(), httpBridge.saveIdentity(identity)];   // 75
            return Promise.all(promises).then(function (responses) {                                                  // 77
              var identityId = responses[0].id.toString('hex').slice(0, 32);                                          // 78
              var profile = responses[1].profile;                                                                     // 79
              return profile.picture.getUrl().then(function (response) {                                              // 80
                var sandstormInfo = {                                                                                 // 81
                  id: identityId,                                                                                     // 82
                  name: profile.displayName.defaultText,                                                              // 83
                  permissions: permissions,                                                                           // 84
                  picture: response.protocol + '://' + response.hostPath,                                             // 85
                  preferredHandle: profile.preferredHandle,                                                           // 86
                  pronouns: profile.pronouns                                                                          // 87
                };                                                                                                    // 81
                                                                                                                      //
                var login = Accounts.updateOrCreateUserFromExternalService('sandstorm', sandstormInfo, { profile: { name: sandstormInfo.name } });
                                                                                                                      //
                updateUserPermissions(login.userId, permissions);                                                     // 94
                done();                                                                                               // 95
              });                                                                                                     // 96
            });                                                                                                       // 97
          })['catch'](function (e) {                                                                                  // 98
            done(e, null);                                                                                            // 99
          });                                                                                                         // 100
        })();                                                                                                         // 101
      }                                                                                                               // 102
    });                                                                                                               // 47
                                                                                                                      //
    Meteor.startup(function () {                                                                                      // 137
      Activities.after.insert(function (userId, doc) {                                                                // 138
        // HACK: We need the connection that's making the request in order to read the                                //
        // Sandstorm session ID.                                                                                      //
        var invocation = DDP._CurrentInvocation.get(); // eslint-disable-line no-undef                                // 141
        if (invocation) {                                                                                             // 142
          var sessionId = invocation.connection.sandstormSessionId();                                                 // 143
                                                                                                                      //
          var eventTypes = bridgeConfig.viewInfo.eventTypes;                                                          // 145
                                                                                                                      //
          var defIdx = eventTypes.findIndex(function (def) {                                                          // 147
            return def.name === doc.activityType;                                                                     // 147
          });                                                                                                         // 147
          if (defIdx >= 0) {                                                                                          // 148
            (function () {                                                                                            // 148
              var ensureUserListed = function ensureUserListed(userId) {                                              // 148
                if (!users[userId]) {                                                                                 // 151
                  var user = Meteor.users.findOne(userId);                                                            // 152
                  if (user) {                                                                                         // 153
                    users[userId] = { id: user.services.sandstorm.id };                                               // 154
                  } else {                                                                                            // 155
                    return false;                                                                                     // 156
                  }                                                                                                   // 157
                }                                                                                                     // 158
                return true;                                                                                          // 159
              };                                                                                                      // 160
                                                                                                                      //
              var mentionedUser = function mentionedUser(userId) {                                                    // 148
                if (ensureUserListed(userId)) {                                                                       // 163
                  users[userId].mentioned = true;                                                                     // 164
                }                                                                                                     // 165
              };                                                                                                      // 166
                                                                                                                      //
              var subscribedUser = function subscribedUser(userId) {                                                  // 148
                if (ensureUserListed(userId)) {                                                                       // 169
                  users[userId].subscribed = true;                                                                    // 170
                }                                                                                                     // 171
              };                                                                                                      // 172
                                                                                                                      //
              var users = {};                                                                                         // 149
                                                                                                                      //
                                                                                                                      //
              var path = '';                                                                                          // 174
              var caption = null;                                                                                     // 175
                                                                                                                      //
              if (doc.cardId) {                                                                                       // 177
                path = 'b/sandstorm/libreboard/' + doc.cardId;                                                        // 178
                Cards.findOne(doc.cardId).members.map(subscribedUser);                                                // 179
              }                                                                                                       // 180
                                                                                                                      //
              if (doc.memberId) {                                                                                     // 182
                mentionedUser(doc.memberId);                                                                          // 183
              }                                                                                                       // 184
                                                                                                                      //
              if (doc.activityType === 'addComment') {                                                                // 186
                (function () {                                                                                        // 186
                  var comment = CardComments.findOne(doc.commentId);                                                  // 187
                  caption = { defaultText: comment.text };                                                            // 188
                  var activeMembers = _.pluck(Boards.findOne(sandstormBoard._id).activeMembers(), 'userId');          // 189
                  (comment.text.match(/\B@(\w*)/g) || []).forEach(function (username) {                               // 191
                    var user = Meteor.users.findOne({ username: username.slice(1) });                                 // 192
                    if (user && activeMembers.indexOf(user._id) !== -1) {                                             // 193
                      mentionedUser(user._id);                                                                        // 194
                    }                                                                                                 // 195
                  });                                                                                                 // 196
                })();                                                                                                 // 186
              }                                                                                                       // 197
                                                                                                                      //
              reportActivity(sessionId, path, defIdx, _.values(users), caption);                                      // 199
            })();                                                                                                     // 148
          }                                                                                                           // 200
        }                                                                                                             // 201
      });                                                                                                             // 202
    });                                                                                                               // 203
                                                                                                                      //
    Picker.route('/', function (params, req, res) {                                                                   // 224
      // Redirect the user to the hard-coded board. On the first launch the user                                      //
      // will be redirected to the board before its creation. But that's not a                                        //
      // problem thanks to the reactive board publication. We used to do this                                         //
      // redirection on the client side but that was sometimes visible on loading,                                    //
      // and the home page was accessible by pressing the back button of the                                          //
      // browser, a server-side redirection solves both of these issues.                                              //
      //                                                                                                              //
      // XXX Maybe the sandstorm http-bridge could provide some kind of "home URL"                                    //
      // in the manifest?                                                                                             //
      var base = req.headers['x-sandstorm-base-path'];                                                                // 234
      var _id = sandstormBoard._id;                                                                                   // 224
      var slug = sandstormBoard.slug;                                                                                 // 224
                                                                                                                      //
      var boardPath = FlowRouter.path('board', { id: _id, slug: slug });                                              // 236
                                                                                                                      //
      res.writeHead(301, {                                                                                            // 238
        Location: base + boardPath                                                                                    // 239
      });                                                                                                             // 238
      res.end();                                                                                                      // 241
    });                                                                                                               // 242
                                                                                                                      //
    // On the first launch of the instance a user is automatically created thanks                                     //
    // to the `accounts-sandstorm` package. After its creation we insert the                                          //
    // unique board document. Note that when the `Users.after.insert` hook is                                         //
    // called, the user is inserted into the database but not connected. So                                           //
    // despite the appearances `userId` is null in this block.                                                        //
    Users.after.insert(function (userId, doc) {                                                                       // 249
      if (!Boards.findOne(sandstormBoard._id)) {                                                                      // 250
        Boards.insert(sandstormBoard, { validate: false });                                                           // 251
        Activities.update({ activityTypeId: sandstormBoard._id }, { $set: { userId: doc._id } });                     // 252
      }                                                                                                               // 256
                                                                                                                      //
      // We rely on username uniqueness for the user mention feature, but                                             //
      // Sandstorm doesn't enforce this property -- see #352. Our strategy to                                         //
      // generate unique usernames from the Sandstorm `preferredHandle` is to                                         //
      // append a number that we increment until we generate a username that no                                       //
      // one already uses (eg, 'max', 'max1', 'max2').                                                                //
      function generateUniqueUsername(username, appendNumber) {                                                       // 263
        return username + String(appendNumber === 0 ? '' : appendNumber);                                             // 264
      }                                                                                                               // 265
                                                                                                                      //
      var username = doc.services.sandstorm.preferredHandle;                                                          // 267
      var appendNumber = 0;                                                                                           // 268
      while (Users.findOne({                                                                                          // 269
        _id: { $ne: doc._id },                                                                                        // 270
        username: generateUniqueUsername(username, appendNumber)                                                      // 271
      })) {                                                                                                           // 269
        appendNumber += 1;                                                                                            // 273
      }                                                                                                               // 274
                                                                                                                      //
      Users.update(doc._id, {                                                                                         // 276
        $set: {                                                                                                       // 277
          username: generateUniqueUsername(username, appendNumber),                                                   // 278
          'profile.fullname': doc.services.sandstorm.name,                                                            // 279
          'profile.avatarUrl': doc.services.sandstorm.picture                                                         // 280
        }                                                                                                             // 277
      });                                                                                                             // 276
                                                                                                                      //
      updateUserPermissions(doc._id, doc.services.sandstorm.permissions);                                             // 284
    });                                                                                                               // 285
                                                                                                                      //
    Meteor.startup(function () {                                                                                      // 287
      Users.find().observeChanges({                                                                                   // 288
        changed: function changed(userId, fields) {                                                                   // 289
          var sandstormData = (fields.services || {}).sandstorm || {};                                                // 290
          if (sandstormData.name) {                                                                                   // 291
            Users.update(userId, {                                                                                    // 292
              $set: { 'profile.fullname': sandstormData.name }                                                        // 293
            });                                                                                                       // 292
          }                                                                                                           // 295
                                                                                                                      //
          if (sandstormData.picture) {                                                                                // 297
            Users.update(userId, {                                                                                    // 298
              $set: { 'profile.avatarUrl': sandstormData.picture }                                                    // 299
            });                                                                                                       // 298
          }                                                                                                           // 301
                                                                                                                      //
          if (sandstormData.permissions) {                                                                            // 303
            updateUserPermissions(userId, sandstormData.permissions);                                                 // 304
          }                                                                                                           // 305
        }                                                                                                             // 306
      });                                                                                                             // 288
    });                                                                                                               // 308
                                                                                                                      //
    // Wekan v0.8 didn’t implement the Sandstorm sharing model and instead kept                                       //
    // the visibility setting (“public” or “private”) in the UI as does the main                                      //
    // Meteor application. We need to enforce “public” visibility as the sharing                                      //
    // is now handled by Sandstorm.                                                                                   //
    // See https://github.com/wekan/wekan/issues/346                                                                  //
    Migrations.add('enforce-public-visibility-for-sandstorm', function () {                                           // 315
      Boards.update('sandstorm', { $set: { permission: 'public' } });                                                 // 316
    });                                                                                                               // 317
  })();                                                                                                               // 23
}                                                                                                                     // 318
                                                                                                                      //
if (isSandstorm && Meteor.isClient) {                                                                                 // 320
  (function () {                                                                                                      // 320
    var sendRpc = function sendRpc(name, message) {                                                                   // 320
      var id = rpcCounter++;                                                                                          // 346
      message.rpcId = id;                                                                                             // 347
      var obj = {};                                                                                                   // 348
      obj[name] = message;                                                                                            // 349
      window.parent.postMessage(obj, '*');                                                                            // 350
      return new Promise(function (resolve, reject) {                                                                 // 351
        rpcs[id] = function (response) {                                                                              // 352
          if (response.error) {                                                                                       // 353
            reject(new Error(response.error));                                                                        // 354
          } else {                                                                                                    // 355
            resolve(response);                                                                                        // 356
          }                                                                                                           // 357
        };                                                                                                            // 358
      });                                                                                                             // 359
    };                                                                                                                // 360
                                                                                                                      //
    // Generated using the following code:                                                                            //
    //                                                                                                                //
    // Capnp.serializePacked(                                                                                         //
    //  Powerbox.PowerboxDescriptor,                                                                                  //
    //  { tags: [ {                                                                                                   //
    //    id: "13872380404802116888",                                                                                 //
    //    value: Capnp.serialize(Identity.PowerboxTag, { permissions: [true, false] })                                //
    //  }]}).toString('base64')                                                                                       //
    //      .replace(/\//g, "_")                                                                                      //
    //      .replace(/\+/g, "-");                                                                                     //
                                                                                                                      //
    var doRequest = function doRequest(serializedPowerboxDescriptor, onSuccess) {                                     // 320
      return sendRpc('powerboxRequest', {                                                                             // 377
        query: [serializedPowerboxDescriptor]                                                                         // 378
      }).then(function (response) {                                                                                   // 377
        if (!response.canceled) {                                                                                     // 380
          onSuccess(response);                                                                                        // 381
        }                                                                                                             // 382
      });                                                                                                             // 383
    };                                                                                                                // 384
                                                                                                                      //
    // Since the Sandstorm grain is displayed in an iframe of the Sandstorm shell,                                    //
    // we need to explicitly expose meta data like the page title or the URL path                                     //
    // so that they could appear in the browser window.                                                               //
    // See https://docs.sandstorm.io/en/latest/developing/path/                                                       //
                                                                                                                      //
    var updateSandstormMetaData = function updateSandstormMetaData(msg) {                                             // 320
      return window.parent.postMessage(msg, '*');                                                                     // 397
    };                                                                                                                // 398
                                                                                                                      //
    var rpcCounter = 0;                                                                                               // 321
    var rpcs = {};                                                                                                    // 322
                                                                                                                      //
    window.addEventListener('message', function (event) {                                                             // 324
      if (event.source === window) {                                                                                  // 325
        // Meteor likes to postmessage itself.                                                                        //
        return;                                                                                                       // 327
      }                                                                                                               // 328
                                                                                                                      //
      if (event.source !== window.parent || _typeof(event.data) !== 'object' || typeof event.data.rpcId !== 'number') {
        throw new Error('got unexpected postMessage: ' + event);                                                      // 333
      }                                                                                                               // 334
                                                                                                                      //
      var handler = rpcs[event.data.rpcId];                                                                           // 336
      if (!handler) {                                                                                                 // 337
        throw new Error('no such rpc ID for event ' + event);                                                         // 338
      }                                                                                                               // 339
                                                                                                                      //
      delete rpcs[event.data.rpcId];                                                                                  // 341
      handler(event.data);                                                                                            // 342
    });                                                                                                               // 343
                                                                                                                      //
    var powerboxDescriptors = {                                                                                       // 362
      identity: 'EAhQAQEAABEBF1EEAQH_GN1RqXqYhMAAQAERAREBAQ' };                                                       // 363
                                                                                                                      //
    window.sandstormRequestIdentity = function () {                                                                   // 386
      doRequest(powerboxDescriptors.identity, function (response) {                                                   // 387
        Meteor.call('sandstormClaimIdentityRequest', response.token, response.descriptor);                            // 388
      });                                                                                                             // 389
    };                                                                                                                // 390
                                                                                                                      //
    FlowRouter.triggers.enter([function (_ref) {                                                                      // 400
      var path = _ref.path;                                                                                           // 400
                                                                                                                      //
      updateSandstormMetaData({ setPath: path });                                                                     // 401
    }]);                                                                                                              // 402
                                                                                                                      //
    Tracker.autorun(function () {                                                                                     // 404
      updateSandstormMetaData({ setTitle: DocHead.getTitle() });                                                      // 405
    });                                                                                                               // 406
                                                                                                                      //
    // Runtime redirection from the home page to the unique board -- since the                                        //
    // home page contains a list of a single board it's not worth to display.                                         //
    //                                                                                                                //
    // XXX Hack. The home route is already defined at this point so we need to                                        //
    // add the redirection trigger to the internal route object.                                                      //
    FlowRouter._routesMap.home._triggersEnter.push(function (context, redirect) {                                     // 413
      redirect(FlowRouter.path('board', {                                                                             // 414
        id: sandstormBoard._id,                                                                                       // 415
        slug: sandstormBoard.slug                                                                                     // 416
      }));                                                                                                            // 414
    });                                                                                                               // 418
                                                                                                                      //
    // XXX Hack. `Meteor.absoluteUrl` doesn't work in Sandstorm, since every                                          //
    // session has a different URL whereas Meteor computes absoluteUrl based on                                       //
    // the ROOT_URL environment variable. So we overwrite this function on a                                          //
    // sandstorm client to return relative paths instead of absolutes.                                                //
    var _absoluteUrl = Meteor.absoluteUrl;                                                                            // 424
    var _defaultOptions = Meteor.absoluteUrl.defaultOptions;                                                          // 425
    Meteor.absoluteUrl = function (path, options) {                                                                   // 426
      var url = _absoluteUrl(path, options);                                                                          // 427
      return url.replace(/^https?:\/\/127\.0\.0\.1:[0-9]{2,5}/, '');                                                  // 428
    };                                                                                                                // 429
    Meteor.absoluteUrl.defaultOptions = _defaultOptions;                                                              // 430
                                                                                                                      //
    // XXX Hack to fix https://github.com/wefork/wekan/issues/27                                                      //
    // Sandstorm Wekan instances only ever have a single board, so there is no need                                   //
    // to cache per-board subscriptions.                                                                              //
    SubsManager.prototype.subscribe = function () {                                                                   // 435
      var _Meteor;                                                                                                    // 435
                                                                                                                      //
      return (_Meteor = Meteor).subscribe.apply(_Meteor, arguments);                                                  // 436
    };                                                                                                                // 437
  })();                                                                                                               // 320
}                                                                                                                     // 438
                                                                                                                      //
// We use this blaze helper in the UI to hide some templates that does not make                                       //
// sense in the context of sandstorm, like board staring, board archiving, user                                       //
// name edition, etc.                                                                                                 //
Blaze.registerHelper('isSandstorm', isSandstorm);                                                                     // 443
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},{"extensions":[".js",".json"]});
require("./server/lib/auth0Utils.js");
require("./server/lib/ocUtils.js");
require("./server/lib/stormpathUtils.js");
require("./server/lib/utils.js");
require("./server/notifications/email.js");
require("./server/notifications/notifications.js");
require("./server/notifications/profile.js");
require("./server/notifications/watch.js");
require("./server/publications/activities.js");
require("./server/publications/avatars.js");
require("./server/publications/boards.js");
require("./server/publications/cardComments.js");
require("./server/publications/cards.js");
require("./server/publications/fast-render.js");
require("./server/publications/unsavedEdits.js");
require("./server/publications/users.js");
require("./config/accounts.js");
require("./config/router.js");
require("./i18n/ar.i18n.json");
require("./i18n/br.i18n.json");
require("./i18n/ca.i18n.json");
require("./i18n/cs.i18n.json");
require("./i18n/de.i18n.json");
require("./i18n/en.i18n.json");
require("./i18n/es-ES.i18n.json");
require("./i18n/es.i18n.json");
require("./i18n/fa.i18n.json");
require("./i18n/fi.i18n.json");
require("./i18n/fr.i18n.json");
require("./i18n/he.i18n.json");
require("./i18n/it.i18n.json");
require("./i18n/ja.i18n.json");
require("./i18n/ko.i18n.json");
require("./i18n/pl.i18n.json");
require("./i18n/pt-BR.i18n.json");
require("./i18n/ro.i18n.json");
require("./i18n/ru.i18n.json");
require("./i18n/sr.i18n.json");
require("./i18n/tr.i18n.json");
require("./i18n/zh-CN.i18n.json");
require("./i18n/zh-TW.i18n.json");
require("./models/activities.js");
require("./models/attachments.js");
require("./models/avatars.js");
require("./models/boards.js");
require("./models/cardComments.js");
require("./models/cards.js");
require("./models/checklists.js");
require("./models/export.js");
require("./models/filesUpload.js");
require("./models/import.js");
require("./models/lists.js");
require("./models/unsavedEdits.js");
require("./models/users.js");
require("./models/watchable.js");
require("./server/migrations.js");
require("./sandstorm.js");
//# sourceMappingURL=app.js.map
