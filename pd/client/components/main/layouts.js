Meteor.subscribe('boards');

BlazeLayout.setRoot('body');

const i18nTagToT9n = (i18nTag) => {
  // t9n/i18n tags are same now, see: https://github.com/softwarerero/meteor-accounts-t9n/pull/129
  // but we keep this conversion function here, to be aware that that they are different system.
  return i18nTag;
};

Template.userFormsLayout.onRendered(() => {
  const i18nTag = navigator.language;
  if (i18nTag) {
    T9n.setLanguage(i18nTagToT9n(i18nTag));
  }
  EscapeActions.executeAll();
});

Template.userFormsLayout.helpers({
  languages() {
    return _.map(TAPi18n.getLanguages(), (lang, tag) => {
      const name = lang.name;
      return { tag, name };
    });
  },

  isCurrentLanguage() {
    const t9nTag = i18nTagToT9n(this.tag);
    const curLang = T9n.getLanguage() || 'en';
    return t9nTag === curLang;
  },
});

Template.userFormsLayout.events({
  'change .js-userform-set-language'(evt) {
    const i18nTag = $(evt.currentTarget).val();
    T9n.setLanguage(i18nTagToT9n(i18nTag));
    evt.preventDefault();
  },
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

Template.blanksContent.onRendered(() => {
  // check if user token exist on local storage
  if (localStorage.getItem('userToken')) {
    // if yes then go to homepage
    FlowRouter.go("home");
  } else {

    Meteor.call('getAuthCredentials', function (err, env) {
      localStorage.setItem('authId',env.id);
      localStorage.setItem('authDomain',env.domain);
      localStorage.setItem('authCallback',env.cb);
      const authId = localStorage.getItem('authId');
      const authDomain = localStorage.getItem('authDomain');
      const authCallback = localStorage.getItem('authCallback');

      // if not process Auth0 Login
      let lock = new Auth0Lock(authId, authDomain, {
        auth: {
          responseType: 'token id_token',
          redirectUri: authCallback
        },
        closable: false
      });

      let authentication = new auth0.Authentication({
        domain: authDomain,
        clientID: authId
      });

      let webAuth = new auth0.WebAuth({
        domain: authDomain,
        clientID: authId,
        callbackOnLocationHash: true
      });

      // check if any sso session exist
      authentication.getSSOData(function (err, data) {
        if (data.sso) {
          // if true then use it to login
          localStorage.setItem('email',data.lastUsedUsername);
          webAuth.authorize({
            connection: data.lastUsedConnection.name,
            responseType: 'token id_token',
            scope: 'openid name picture',
            redirectUri: authCallback
          });
        } else {
          // if not then show lock UI to login
          lock.show();
        }
      });
    });
  }
});
