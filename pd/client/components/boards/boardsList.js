BlazeComponent.extendComponent({

  boards() {
    if (Meteor.user()) {
      Meteor.subscribe('user-extra-group', Meteor.user()._id);
      const user = Users.findOne({_id: Meteor.user()._id});
      if (user.group)
        return Boards.find();
      else 
        return Boards.find({
           archived: false,
            'members.userId': Meteor.userId(),
          }, {
            sort: ['title'],
          });
    }
  },

  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },

  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [{
      'click .js-add-board': Popup.open('createBoard'),
      'click .js-star-board'(evt) {
        const boardId = this.currentData()._id;
        Meteor.user().toggleBoardStar(boardId);
        evt.preventDefault();
      },
      'click .js-accept-invite'() {
        const boardId = this.currentData()._id;
        Meteor.user().removeInvite(boardId);
      },
      'click .js-decline-invite'() {
        const boardId = this.currentData()._id;
        Meteor.call('quitBoard', boardId, (err, ret) => {
          if (!err && ret) {
            Meteor.user().removeInvite(boardId);
            FlowRouter.go('home');
          }
        });
      },
    }];
  },
}).register('boardList');

Template.listBoard.helpers({
  boards() {
    return Boards.find();
  }
});