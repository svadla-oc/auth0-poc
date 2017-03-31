const passwordField = AccountsTemplates.removeField('password');
const emailField = AccountsTemplates.removeField('email');
AccountsTemplates.addFields([{
  _id: 'username',
  type: 'text',
  displayName: 'username',
  required: true,
  minLength: 2,
}, emailField, passwordField]);

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: false,
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: true,
  onLogoutHook() {
    // on logout process we need to remove userToken from localStorage
    // and logout Auth0 to remove sso session
    localStorage.removeItem('userToken');
    let webAuth = new auth0.WebAuth({
      domain: localStorage.getItem('authDomain'),
      clientID: localStorage.getItem('authId')
    });
    
    webAuth.logout({
      returnTo: FlowRouter.url('signIn'),
      client_id: localStorage.getItem('authId')
    });
  },
});

['signUp', 'resetPwd', 'forgotPwd', 'enrollAccount'].forEach(
  (routeName) => AccountsTemplates.configureRoute(routeName));

// custom signIn page
AccountsTemplates.configureRoute('signIn', {
  layoutType: 'blaze',
  name: 'signIn',
  path: '/sign-in',
  layoutTemplate: 'blanksContent'
});

Accounts.onLogin(function() {
  FlowRouter.go("home");
});

// We display the form to change the password in a popup window that already
// have a title, so we unset the title automatically displayed by useraccounts.
AccountsTemplates.configure({
  texts: {
    title: {
      changePwd: '',
    },
  },
});

AccountsTemplates.configureRoute('changePwd', {
  redirect() {
    // XXX We should emit a notification once we have a notification system.
    // Currently the user has no indication that his modification has been
    // applied.
    Popup.back();
  },
});

if (Meteor.isServer) {
  if (process.env.MAIL_FROM) {
    Accounts.emailTemplates.from = process.env.MAIL_FROM;
  }

  ['resetPassword-subject', 'resetPassword-text', 'verifyEmail-subject', 'verifyEmail-text', 'enrollAccount-subject', 'enrollAccount-text'].forEach((str) => {
    const [templateName, field] = str.split('-');
    Accounts.emailTemplates[templateName][field] = (user, url) => {
      return TAPi18n.__(`email-${str}`, {
        url,
        user: user.getName(),
        siteName: Accounts.emailTemplates.siteName,
      }, user.getLanguage());
    };
  });
}
