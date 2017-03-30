Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-board-copy'() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard._parentId = currentBoard._id;
    delete currentBoard._id;
    delete currentBoard.createdAt;
    delete currentBoard.modifiedAt;
    delete currentBoard.slug;
    currentBoard.title = currentBoard.title + ' Copy';
    Boards.insert(currentBoard);
    Popup.close();
  },
});

Template.boardMenuPopup.helpers({
  exportUrl() {
    const boardId = Session.get('currentBoard');
    const loginToken = Accounts._storedLoginToken();
    return Utils.modifUrl(FlowRouter.url(`api/boards/${boardId}?authToken=${loginToken}`), true);
  },
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `oc-export-board-${boardId}.json`;
  },
});

Template.boardChangeDescriptionPopup.events({
  submit(evt, tpl) {
    const newDesc = tpl.$('.js-board-desc').val().trim();
    if (newDesc) {
      this.setDesciption(newDesc);
      Popup.close();
    }
    evt.preventDefault();
  },
});

BlazeComponent.extendComponent({
  watchLevel() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.getWatchLevel(Meteor.userId());
  },

  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = Meteor.user();
    return user && user.hasStarred(boardId);
  },

  isMiniScreen() {
    return Utils.isMiniScreen();
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.stars >= 2;
  },

  url2Study() {
    return 'http://ocbridge.openclinica.info:8080/'+Session.get('currentBoard');
  },

  events() {
    return [{
      'click .js-edit-board-title': Popup.open('boardChangeDescription'),
      'click .js-star-board'() {
        Meteor.user().toggleBoardStar(Session.get('currentBoard'));
      },
      'click .js-open-board-menu': Popup.open('boardMenu'),
      'click .js-change-visibility': Popup.open('boardChangeVisibility'),
      'click .js-watch-board': Popup.open('boardChangeWatch'),
      'click .js-open-filter-view'() {
        Sidebar.setView('filter');
      },
      'click .js-filter-reset'(evt) {
        evt.stopPropagation();
        Sidebar.setView();
        Filter.reset();
      },
      'click .js-multiselection-activate'() {
        const currentCard = Session.get('currentCard');
        MultiSelection.activate();
        if (currentCard) {
          MultiSelection.add(currentCard);
        }
      },
      'click .js-multiselection-reset'(evt) {
        evt.stopPropagation();
        MultiSelection.disable();
      },
      'click .js-log-in'() {
        FlowRouter.go('atSignIn');
      },
      'click .js-push-btn'() {
        Meteor.call('pushProtocol', Session.get('currentBoard'), function(err, status){
          if (err)
            Utils.showNotif(TAPi18n.__('import-failed'), 'danger');
          else
            if (0 < status/200 && status/200 < 2)
              Utils.showNotif(TAPi18n.__('import-success'), 'success');
            else
              Utils.showNotif(TAPi18n.__('import-failed'), 'danger');
       });
      }
    }];
  },
}).register('boardHeaderBar');

BlazeComponent.extendComponent({
  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [{
      'click .js-select-background'(evt) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const newColor = this.currentData().toString();
        currentBoard.setColor(newColor);
        evt.preventDefault();
      },
    }];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.visibilityMenuIsOpen = new ReactiveVar(false);
    this.visibility = new ReactiveVar('private');
  },

  visibilityCheck() {
    return this.currentData() === this.visibility.get();
  },

  setVisibility(visibility) {
    this.visibility.set(visibility);
    this.visibilityMenuIsOpen.set(false);
  },

  toggleVisibilityMenu() {
    this.visibilityMenuIsOpen.set(!this.visibilityMenuIsOpen.get());
  },

  onSubmit(evt) {
    evt.preventDefault();
    const title = this.find('.js-new-board-title').value;
    const visibility = this.visibility.get();
    const boardId = Boards.insert({
      title,
      permission: visibility,
      members: [{
        userId: Meteor.user()._id,
        isAdmin: true,
        isActive: true,
        group: Meteor.user().group || 'default'
      }]
    });

    if (boardId){
      Meteor.call('postProtocol', boardId);
    }

    Utils.goBoardId(boardId);

    // Immediately star boards crated with the headerbar popup.
    Meteor.user().toggleBoardStar(boardId);
  },

  events() {
    return [{
      'click .js-select-visibility'() {
        this.setVisibility(this.currentData());
      },
      'click .js-change-visibility': this.toggleVisibilityMenu,
      'click .js-import': Popup.open('boardImportBoard'),
      submit: this.onSubmit,
    }];
  },
}).register('createBoardPopup');

BlazeComponent.extendComponent({
  visibilityCheck() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return this.currentData() === currentBoard.permission;
  },

  selectBoardVisibility() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const visibility = this.currentData();
    currentBoard.setVisibility(visibility);
    Popup.close();
  },

  events() {
    return [{
      'click .js-select-visibility': this.selectBoardVisibility,
    }];
  },
}).register('boardChangeVisibilityPopup');

BlazeComponent.extendComponent({
  watchLevel() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.getWatchLevel(Meteor.userId());
  },

  watchCheck() {
    return this.currentData() === this.watchLevel();
  },

  events() {
    return [{
      'click .js-select-watch'() {
        const level = this.currentData();
        Meteor.call('watch', 'board', Session.get('currentBoard'), level, (err, ret) => {
          if (!err && ret) Popup.close();
        });
      },
    }];
  },
}).register('boardChangeWatchPopup');
