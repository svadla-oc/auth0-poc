'use strict'
if ( Meteor.isServer ) {
  const Future = require('fibers/future');
  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  const Fiber = require('fibers');

  const DOMAIN = "oc4.auth0.com";
  const CLIENT_ID = "cg8JQ1ubaI0vX1P2kZoIO5a11DloD5EW";
  const CLIENT_SECRET = "QokLO2aWDRIIuaYHdGrsm_kOnG6UM6VFBUosJL0p_Ft2N7FtksJsjDzDtUxXwtt3";
  const CALLBACK = process.env.ROOT_URL+"/callback";

  Meteor.methods({
    getAuthCredentials: function() {
      return {
      	domain: DOMAIN,
      	id: CLIENT_ID,
      	secret: CLIENT_SECRET,
      	cb: CALLBACK
      };
    },
    processAuthLogin: function(userInfo) {
      check(userInfo, Object);
      const future = new Future();
      Fiber(function() { 
        try {
          // save user to local db
          let acc = Accounts.createUser({
            username: userInfo.nickName,
            email: userInfo.email,
            password: "oauthUserPasswordDefault"
          });
          if (acc) {
            // send back user info to force login
            let newUser = Users.findOne(acc);
            future.return({
              username: newUser.username,
              password: "oauthUserPasswordDefault"
            });
          }
        } catch(err) {
          let existUser;
          // in case username exist use local db user
          if (err.reason === 'Username already exists.') {
            existUser = Accounts.findUserByUsername(userInfo.nickName);
            future.return({
              username: existUser.username,
              password: "oauthUserPasswordDefault"
            });
          } else if (err.reason === 'Email already exists.') {
            existUser = Accounts.findUserByEmail(userInfo.email);
            future.return({
              username: existUser.username,
              password: "oauthUserPasswordDefault"
            });
          }
        }
      }).run();
      return future.wait();
    }
   });
}
