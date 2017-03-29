$(document).ready(function() {

  // Redirect Rules
  // 1. If lasturi known via a cookie use that.
  // 2. If lasturi not known, then implement an Auth0 rule to redirect to an app based on roles

  var subdomain = window.location.host.split('.')[0]
  var defaultRedirectURI = window.location.origin + '/ssoCallback.html'

  var customers = {
    kitchensink: {
      "domain": "https://oc4.auth0.com/login",
      "params": {
        //"state" : "",
        //"auth0Client":"",
        "nonce": "no idea what should be here",
        "client": "UCB0KGJAXx4V2CoX0Gvvwb1u17HSqpuR",
        "protocol": "oauth2",
        "redirect_uri": defaultRedirectURI,
        "connection": subdomain,
        "audience": "kkapi",
        "response_type": "token id_token",
        "scope": "openid name picture"
      }
    },
    skeleton: {
      "domain": "https://oc4.auth0.com/login",
      "params": {
        //"state" : "",
        //"auth0Client":"",
        "nonce": "no idea what should be here",
        "client": "UCB0KGJAXx4V2CoX0Gvvwb1u17HSqpuR",
        "protocol": "oauth2",
        "redirect_uri": defaultRedirectURI,
        "connection": subdomain,
        "audience": "kkapi",
        "response_type": "token id_token",
        "scope": "openid name picture"
      }
    }
  };

  // Where's ths subdomain
  if (subdomain) {
    // Set redirect_uri if present in URL
    var redirectURI = getParameterByName('redirect_uri')
    if (redirectURI) {
      customers[subdomain].params.redirect_uri = redirectURI
    }

    var recursiveDecoded = decodeURIComponent($.param(customers[subdomain].params));
    var loginURL = customers[subdomain].domain + "?" + recursiveDecoded

    console.log(loginURL);
    console.log(getParameterByName('redirect_uri'))
    window.location.replace(loginURL);

  }else{
    alert('Where\'s your subdomain mr. customer ??')
  }


  function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

});
