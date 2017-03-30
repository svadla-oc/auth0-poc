let previousPath;
FlowRouter.triggers.exit([({path}) => {
  previousPath = path;
}]);

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentCard', null);
    Session.set('currentList', null);
    Utils.closeNotif();
    let check = Utils.ssoInterval();
    if (!check.isRunning()) {
      check.start();
    }
    
    Filter.reset();
    EscapeActions.executeAll();

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardListHeaderBar',
      content: 'boardList',
    });
  },
});

FlowRouter.route('/callback', {
  name: 'callback',
  action() {
    if (!window.location.hash) {
      FlowRouter.go('signIn');
    } else {
      // parse hash url to get data token 
      const token = Utils.parseHash(window.location.hash);
      // check idToken
      if (token.idToken) {
        // decode idToken to get user profile
        const userProfile = jwt_decode(token.idToken);
        localStorage.setItem('userToken', token.idToken);
        localStorage.setItem('accessToken', token.accessToken);
        // use user profile to login
        Utils.autoLogin({
          nickName: userProfile.name,
          email: localStorage.getItem('email')
        });
      } else {
        // if no token data then back to login page
        FlowRouter.go('signIn');
      }
    }

    BlazeLayout.render('blanksLayout', {
      content: 'loadingCallback',
    });
  },
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    const currentBoard = params.id;
    const previousBoard = Session.get('currentBoard');
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
    Session.set('currentList', null);
    Utils.closeNotif();
    let check = Utils.ssoInterval();
    if (!check.isRunning()) {
      check.start();
    }

    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (previousBoard !== currentBoard) {
      EscapeActions.executeAll();
    } else {
      EscapeActions.executeUpTo('popup-close');
    }

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardHeaderBar',
      content: 'board',
    });
  },
});

FlowRouter.route('/b/:boardId/:slug/l/:listId', {
  name: 'list',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    EscapeActions.executeUpTo('inlinedForm');
    Utils.closeNotif();
    let check = Utils.ssoInterval();
    if (!check.isRunning()) {
      check.start();
    }
    
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', null);
    Session.set('currentList', params.listId);

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardHeaderBar',
      content: 'board',
    });
  },
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    if (Meteor.user()){
      Meteor.subscribe('user-extra-group', Meteor.user()._id);
    }
    EscapeActions.executeUpTo('inlinedForm');

    Utils.closeNotif();
    let check = Utils.ssoInterval();
    if (!check.isRunning()) {
      check.start();
    }

    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    Session.set('currentList', null);

    BlazeLayout.render('defaultLayout', {
      headerBar: 'boardHeaderBar',
      content: 'board',
    });
  },
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action() {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        header: 'shortcutsModalTitle',
        onCloseGoTo: previousPath,
      });
    } else {
      BlazeLayout.render('defaultLayout', {
        headerBar: 'shortcutsHeaderBar',
        content: shortcutsTemplate,
      });
    }
  },
});

FlowRouter.route('/import', {
  name: 'import',
  triggersEnter: [
    AccountsTemplates.ensureSignedIn,
    () => {
      Session.set('currentBoard', null);
      Session.set('currentCard', null);

      Filter.reset();
      EscapeActions.executeAll();
    },
  ],
  action() {
    let check = Utils.ssoInterval();
    if (!check.isRunning()) {
      check.start();
    }
    BlazeLayout.render('defaultLayout', {
      headerBar: 'importHeaderBar',
      content: 'import',
    });
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('defaultLayout', { content: 'notFound' });
  },
};

// We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
const redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId',
};

_.each(redirections, (newPath, oldPath) => {
  FlowRouter.route(oldPath, {
    triggersEnter: [(context, redirect) => {
      redirect(FlowRouter.path(newPath, context.params));
    }],
  });
});

// // As it is not possible to use template helpers in the page <head> we create a
// // reactive function whose role is to set any page-specific tag in the <head>
// // using the `kadira:dochead` package. Currently we only use it to display the
// // board title if we are in a board page (see #364) but we may want to support
// // some <meta> tags in the future.
// const appTitle = 'Wekan';

// // XXX The `Meteor.startup` should not be necessary -- we don't need to wait for
// // the complete DOM to be ready to call `DocHead.setTitle`. But the problem is
// // that the global variable `Boards` is undefined when this file loads so we
// // wait a bit until hopefully all files are loaded. This will be fixed in a
// // clean way once Meteor will support ES6 modules -- hopefully in Meteor 1.3.
// Meteor.isClient && Meteor.startup(() => {
//   Tracker.autorun(() => {
//     const currentBoard = Boards.findOne(Session.get('currentBoard'));
//     const titleStack = [appTitle];
//     if (currentBoard) {
//       titleStack.push(currentBoard.title);
//     }
//     DocHead.setTitle(titleStack.reverse().join(' - '));
//   });
// });

Meteor.isClient && Meteor.startup(() => {
  Tracker.autorun(() => {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const titleStack = [];
    if (currentBoard) {
      titleStack.push(currentBoard.title);
    }
    DocHead.setTitle(titleStack);
  });
});