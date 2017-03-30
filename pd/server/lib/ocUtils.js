if ( Meteor.isServer ) {
  let bodyParser = require('body-parser'); 
  let Future = require('fibers/future');
  let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  let consul = require('consul')({
    host: process.env.CONSUL_SERVER_URL,
    port: process.env.CONSUL_SERVER_PORT
  });

  Picker.middleware(bodyParser.urlencoded({ extended: false }));
  Picker.middleware(bodyParser.json());

  let postApi = Picker.filter(function(req, res) {
    return req.method == "POST";
  });

  let putApi = Picker.filter(function(req, res) {
    return req.method == "PUT";
  });


	Meteor.methods({
    getForm: function(protocolId, formTitle) {
    	check(protocolId, String);
    	check(formTitle, String);
      let future = new Future();
      let xmlhttp = new XMLHttpRequest();
    	xmlhttp.open("GET", "http://fm.openclinica.info:8080/api/protocol/"+protocolId+"/forms/"+formTitle, true);
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
        	if (0 < xmlhttp.status/200 && xmlhttp.status/200 < 2)
          	future.return(JSON.parse(xmlhttp.responseText));
        	else
        		future.return("error");
        }
      }
	    xmlhttp.send();

      return future.wait();
    },
    pushProtocol: function(boardId) {
    	let exportClass = require('../../models/export.js');
    	check(boardId, String);

    	const exporter = new exportClass.Exporter(boardId);
    	let xmlhttp = new XMLHttpRequest();
    	let future = new Future();
			xmlhttp.open("POST", "http://pm.openclinica.info:8082/rest/importjson", true);
			xmlhttp.setRequestHeader("Content-Type", "application/json");
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState === 4)
					future.return(xmlhttp.status);
      }
			xmlhttp.send(JSON.stringify(exporter.build()));

			return future.wait();
    },
    postProtocol: function(id) {
    	check(id, String);

    	let obj = {
    		protocolID : id
    	}

    	let xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST", "http://ocbridge.openclinica.info:8085/api/createWebApp", true);
			xmlhttp.setRequestHeader("Content-Type", "application/json");
			xmlhttp.send(JSON.stringify(obj));
    },
    uploadForm: function(boardId, formId, files) {
      check(boardId, String);
      check(formId, Number);
      check(files, Array);

      let request = require('request'),
      FormData = require('form-data'),
      fs = require('fs'),
      future = new Future(),
      streams = [];
      let formData = new FormData();
      _.each(files, (file) => {
        // create temp file
        fs.writeFile(file.name, file.binary, {encoding:"binary"}, function (err) {
          streams.push(fs.createReadStream(process.env.PWD + '/programs/server/' + file.name));
          if (files.length === streams.length) {
            formData = {
              file: streams
            }
            request.post({url:'http://fm.openclinica.info:8080/api/protocol/'+boardId+'/forms/'+formId+'/artifacts', formData: formData}, function optionalCallback(err, httpResponse, body) {
              if (err) {
                future.return("error");
              } else {
                future.return(JSON.parse(body));
              }
              // remove temp file
              _.each(files, (tmpFile) => {
                fs.unlink(process.env.PWD + '/programs/server/' + tmpFile.name);
              })
            });
          }
        });
        
      })
      return future.wait();
    },
    createServiceConsul: function() {
      let service = {"ID":"ProtocolDesigner-b8rie0uf3jw8wylb89q4o4z9sjba8s9c","Name":"ProtocolDesigner","Tags":[],"Address":"pd.openclinica.info","Port":8082,"Check": {"Name": "Server up","Notes": "Ensure Protocol Designer is running","TCP": "pd.openclinica.info:8082","Interval": "10s"}}

      consul.agent.service.register(service, function(err, result) {
        if (err) 
          console.log("--> error on agent.service.register : ",err);
      });
    },
  });

  postApi.route('/copyProtocol', function(params, req, res, next) {
    let id = req.body.boardId;
    let title = req.body.title;
    if (id && title) {
      id = id.trim();
      title = title.trim();
      let board = Boards.findOne(id);
      let lists = Lists.find({boardId: id, archived: false}).fetch();
      if (board){
        delete board._id;
        delete board.createdAt;
        delete board.modifiedAt;
        delete board.slug;
        board._parentId = id;
        board.title = title;
        board.slug = slug = getSlug(title);

        _.each(board.members, (member) => {
          if (member.group == ''){
            board.setGroup(member.userId, (member.group || "public"));
            member.group = member.group || "public";
          }
        });
        
        Boards.insert(board, function(err, cloneId) {
          let code, result;
          if (err) {
            code = 500;
            result = {
              error: err.message
            }
          } else {
            code = 200;
            result = {
              boardId: cloneId,
              protocolUrl: Meteor.absoluteUrl() + 'b/' + cloneId + '/' + board.slug,
            }
          }
          res.setHeader( 'Content-Type', 'application/json' );
          res.statusCode = code;
          res.end( JSON.stringify( result ) );  
        })
      } else {
        res.setHeader( 'Content-Type', 'application/json' );
        res.statusCode = 404;
        res.end( JSON.stringify( {error : "Board not found."} ) );
      }
    } else {
      res.setHeader( 'Content-Type', 'application/json' );
      res.statusCode = 404;
      res.end( JSON.stringify( {error : "Missing parameter."} ) );
    }
  });

  postApi.route('/protocols', function(params, req, res, next) {
    let title = req.body.title;
    if (title) {
      Boards.insert({
        title: title.trim(),
        permission: "public",
      }, function(err, boardId) {
        let code, result;
        if (err) {
          code = 500;
          result = {
            error: err.message
          }
        } else {
          code = 200;
          let board = Boards.findOne(boardId);
          result = {
            boardId: boardId,
            protocolUrl: Meteor.absoluteUrl() + 'b/' + boardId + '/' + board.slug,
          }
        }
        res.setHeader( 'Content-Type', 'application/json' );
        res.statusCode = code;
        res.end( JSON.stringify( result ) );
      })
    } else {
      res.setHeader( 'Content-Type', 'application/json' );
      res.statusCode = 404;
      res.end( JSON.stringify( {error: 'Title not found.'} ) );
    }

  });

  postApi.route('/renameProtocol', function(params, req, res, next) {
    let listBoardId = req.body.listBoardId, newName = req.body.title, code = 200, message = undefined;

    if (listBoardId && newName) {
      if (!listBoardId[0]) {
        code = 404;
        message = JSON.stringify( {error: 'Empty listBoardId.'} );
      } else {
        let result = {
          listBoardId: [],
          protocolUrls: [],
        };
        _.each(listBoardId, (boardId) => {
          let board = Boards.findOne(boardId);
          board.rename(newName);
          result.listBoardId.push(boardId);
          result.protocolUrls.push(Meteor.absoluteUrl() + 'b/' + boardId + '/' + board.slug);

          let clones = Boards.find({_parentId: boardId}).fetch();
          _.each(clones, (clone) => {
            clone.rename(newName);
            result.listBoardId.push(clone._id);
            result.protocolUrls.push(Meteor.absoluteUrl() + 'b/' + clone._id + '/' + clone.slug);
          });
        });
        message = JSON.stringify( result );
      }
    } else {
      code = 404;
      message =  JSON.stringify( {error: 'Missing parameter.'} );
    }
    res.setHeader( 'Content-Type', 'application/json' );
    res.statusCode = code;
    if (message)
      res.end(message);
    else
      res.end();

  });
}

Meteor.startup(() => {
  if (process.env.CONSUL_SERVER_URL)
    Meteor.call("createServiceConsul");
});
    
