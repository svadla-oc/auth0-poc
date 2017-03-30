if ( Meteor.isServer ) {
	let stormpath = require('stormpath');
	let Fiber = require('fibers');
	// Create API Key from env(.bashrc)
  let api = new stormpath.ApiKey(
    process.env.STORMPATH_CLIENT_APIKEY_ID,
    process.env.STORMPATH_CLIENT_APIKEY_SECRET
  );
  // Create client
  let client = new stormpath.Client({
    apiKey: api
  });

  // Use Picker to catch request
	Picker.route('/sso', function(params, req, res, next) {
		let groupName = undefined;

	  function saveUser(user, isNew, status) {
	  	// Encapsulate meteor method on fiber to prevent error
	  	Fiber(function() { 
	  		// create function to redirect page to flowrouter
	  		let sendResponse = function(location) {
	  			res.writeHead(301, {
	        	'Location': location
		      });
		      res.end();
	  		};
	  		// Username and email value must be unique so we can use try-catch to catch the existed file or new user with username or email that already exist on database. Send to sign-up page if found.
	  		try {
	  			let acc = Accounts.createUser(user);
	  			if (acc) {
	  				let newUser = Users.findOne(acc);
	  				if (groupName) {
	  					newUser.setGroup(groupName);
	  				}
	  				sendResponse('/stormpath/sign-in/'+newUser.username);
	  			}
	  		} catch(err) {
	  			let existUser;
	  			if (err.reason === 'Username already exists.') {
	  				existUser = Users.find({username: user.username}).fetch()[0];
	  				if (groupName) {
	  					existUser.setGroup(groupName);
	  				}
	  				_.each(existUser.emails, function(email) {
	  					if (email.address === user.email) {
	  						sendResponse('/stormpath/sign-in/'+existUser.username);
	  					} else {
	  						sendResponse('https://automation2.panduwana.com/restricted/secret');
	  					}
	  				});
	  			} else {
	  				sendResponse('https://automation2.panduwana.com/restricted/secret');
	  			}
	  		}
  			
		  }).run();
	  }

	  // Handle callback from Site
	  client.getApplication(process.env.STORMPATH_APPLICATION_HREF, function(err, application) {
	  	application.handleIdSiteCallback(req.url, function (err, idSiteAuthenticationResult) {

		    if (err) {
		      res.end(500);
		    } else {
					client.getGroup(idSiteAuthenticationResult.account.groups.href, function (err, group) {
						if (group.items[0]) {
					  	groupName = group.items[0].name;
						} else {
					  	groupName = "no-group";
						}
			    	function newUser (isNew, status) {
			    		saveUser({
				    		username: idSiteAuthenticationResult.account.givenName,
				    		email: idSiteAuthenticationResult.account.email,
				    		password: idSiteAuthenticationResult.account.givenName
		          }, isNew, status);
			    	}
			  		newUser(idSiteAuthenticationResult.isNew, idSiteAuthenticationResult.status);
					});
		    }
		  });
	  });
	});
}