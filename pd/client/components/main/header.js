Template.header.helpers({
  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },

  appIsOffline() {
    return (Meteor.status().status === 'offline' || Meteor.status().status === 'waiting') && !Meteor.status().connected;
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('createBoard'),
});
