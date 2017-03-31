BlazeComponent.extendComponent({
  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const list = this.currentData();
    if (newTitle) {
      list.rename(newTitle.trim());
    }
  },

  isWatching() {
    const list = this.currentData();
    return list.findWatcher(Meteor.userId());
  },

  limitToShowCardsCount() {
    return Meteor.user().getLimitToShowCardsCount();
  },

  showCardsCountForList(count) {
    return count > this.limitToShowCardsCount();
  },

  events() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      submit: this.editTitle,
    }];
  },
}).register('listHeader');

Template.listActionPopup.helpers({
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },
});


Template.listActionPopup.events({
  'click .js-edit-event'() {
    Modal.open('editEventFormModal');
    Popup.close();
  },
  'click .js-edit-event-label': Popup.open('editEventLabel'),
  'click .js-add-card'() {
    const listDom = document.getElementById(`js-list-${this._id}`);
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    listComponent.openForm({ position: 'top' });
    Popup.close();
  },
  'click .js-list-subscribe'() {},
  'click .js-select-cards'() {
    const cardIds = this.allCards().map((card) => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-toggle-watch-list'() {
    const currentList = this;
    const level = currentList.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'list', currentList._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
  'click .js-close-list'(evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
  'click .js-copy-event'() {
    let currentEvent = Lists.findOne(this._id);
    currentEvent._parentId = currentEvent._id;
    delete currentEvent._id;
    delete currentEvent.createdAt;
    delete currentEvent.modifiedAt;
    currentEvent.title = currentEvent.title + " Copy";
    currentEvent.sort = Lists.find({ boardId: this.boardId}).count();
    Lists.insert(currentEvent, (err, listId) => {
      if (!err)
        Utils.goListId(listId);
    });
    Popup.close();
  },
  'click .js-remove-event': Popup.afterConfirm('archiveEvent', function() {
   
    const cardIds = this.allCards();
   
    const allCardsInThisList = cardIds.fetch();

    _.each(allCardsInThisList, function(element){
      var output = element.archive();
    });
  

    let currentEvent = Lists.findOne(this._id);
    
    currentEvent.archive();
    Utils.goBoardId(Session.get("currentBoard"));
    Popup.close()

  }),
  'click .js-restore-event'() {
    this.restore();
    Popup.close();
    console.log(this);
  }
});
