Template.userAvatarList.helpers({
  userData() {
    // We need to handle a special case for the search results provided by the
    // `matteodem:easy-search` package. Since these results gets published in a
    // separate collection, and not in the standard Meteor.Users collection as
    // expected, we use a component parameter ("property") to distinguish the
    // two cases.
    if (this.userId)
      Meteor.subscribe('user-extra-group', this.userId);
    const userCollection = this.esSearch ? ESSearchResults : Users;
    return userCollection.findOne(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = Users.findOne(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  presenceStatusClassName() {
    const user = Users.findOne(this.userId);
    const userPresence = presences.findOne({ userId: this.userId });
    if (user && user.isInvitedTo(Session.get('currentBoard')))
      return 'pending';
    else if (!userPresence)
      return 'disconnected';
    else if (Session.equals('currentBoard', userPresence.state.currentBoardId))
      return 'active';
    else
      return 'idle';
  },
});

Template.userAvatarList.events({
  'click .js-change-avatar': Popup.open('changeAvatar'),
});

Template.userAvatarInitialsList.helpers({
  initials() {
    if (this.userId)
      Meteor.subscribe('user-extra-group', this.userId);
    const user = Users.findOne(this.userId);
    return user && user.getInitials();
  },

  viewPortWidth() {
    if (this.userId)
      Meteor.subscribe('user-extra-group', this.userId);
    const user = Users.findOne(this.userId);
    return (user && user.getInitials().length || 1) * 12;
  },
});

Template.listMembersPopup.helpers({
  isListMember() {
    const listId = Template.parentData()._id;
    const listMembers = Lists.findOne(listId).members || [];
    return _.contains(listMembers, this.userId);
  },

  user() {
    return Users.findOne(this.userId);
  },
});

Template.listMembersPopup.events({
  'click .js-select-member'(evt) {
    const list = Lists.findOne(Session.get('currentList'));
    if (!list.archived) {
      const memberId = this.userId;
      list.toggleMember(memberId);
      evt.preventDefault();
    }
  },
});

Template.listMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

Template.listMemberPopup.events({
  'click .js-remove-member'() {
    const list = Lists.findOne(this.listId);
    if (!list.archived) {
      list.unassignMember(this.userId);
    }
    Popup.close();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});