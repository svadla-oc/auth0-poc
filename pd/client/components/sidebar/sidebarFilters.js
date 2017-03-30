BlazeComponent.extendComponent({
  events() {
    return [{
      'click .js-toggle-label-filter'(evt) {
        evt.preventDefault();
        Filter.labelIds.toggle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-toggle-member-filter'(evt) {
        evt.preventDefault();
        Filter.members.toggle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-clear-all'(evt) {
        evt.preventDefault();
        Filter.reset();
      },
      'click .js-filter-to-selection'(evt) {
        evt.preventDefault();
        const selectedCards = Cards.find(Filter.mongoSelector()).map((c) => {
          return c._id;
        });
        MultiSelection.add(selectedCards);
      },
    }];
  },
}).register('filterSidebar');

function mutateSelectedCards(mutationName, args) {
  let indexPosition = 0;
  if (mutationName === 'move' || mutationName === 'copy') {
    indexPosition = Cards.find({boardId: Session.get("currentBoard"), listId: args}).count();
  }
  Cards.find(MultiSelection.getMongoSelector()).forEach((card) => {
    if (mutationName === 'move') {
      if (Utils.allowMoveOrCopy(card, args)) {
        card.move(args, indexPosition);
      }
    } else if (mutationName === 'copy') {
      if (card.listId !== args) {
        if (Utils.allowMoveOrCopy(card, args)) {
          card._parentId = card._id;
          delete card._id;
          delete card.createdAt;
          delete card.modifiedAt;
          card.listId = args;
          card.sort = indexPosition;
          Cards.insert(card);
        }
      }
    } else {
      card[mutationName](args);
    }
  });
}

BlazeComponent.extendComponent({
  mapSelection(kind, _id) {
    return Cards.find(MultiSelection.getMongoSelector()).map((card) => {
      const methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
      return card[methodName](_id);
    });
  },

  allSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.every(this.mapSelection(kind, _id));
  },

  someSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.some(this.mapSelection(kind, _id));
  },

  events() {
    return [{
      'click .js-toggle-label-multiselection'(evt) {
        const labelId = this.currentData()._id;
        const mappedSelection = this.mapSelection('label', labelId);

        if (_.every(mappedSelection)) {
          mutateSelectedCards('removeLabel', labelId);
        } else if (_.every(mappedSelection, (bool) => !bool)) {
          mutateSelectedCards('addLabel', labelId);
        } else {
          const popup = Popup.open('disambiguateMultiLabel');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          popup.call(this.currentData(), evt);
        }
      },
      'click .js-toggle-member-multiselection'(evt) {
        const memberId = this.currentData()._id;
        const mappedSelection = this.mapSelection('member', memberId);
        if (_.every(mappedSelection)) {
          mutateSelectedCards('unassignMember', memberId);
        } else if (_.every(mappedSelection, (bool) => !bool)) {
          mutateSelectedCards('assignMember', memberId);
        } else {
          const popup = Popup.open('disambiguateMultiMember');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          popup.call(this.currentData(), evt);
        }
      },
      'click .js-copy-selection': Popup.open('copySelection'),
      'click .js-move-selection': Popup.open('moveSelection'),
      'click .js-archive-selection'() {
        mutateSelectedCards('archive');
        EscapeActions.executeUpTo('multiselection');
      },
    }];
  },
}).register('multiselectionSidebar');

Template.disambiguateMultiLabelPopup.events({
  'click .js-remove-label'() {
    mutateSelectedCards('removeLabel', this._id);
    Popup.close();
  },
  'click .js-add-label'() {
    mutateSelectedCards('addLabel', this._id);
    Popup.close();
  },
});

Template.disambiguateMultiMemberPopup.events({
  'click .js-unassign-member'() {
    mutateSelectedCards('assignMember', this._id);
    Popup.close();
  },
  'click .js-assign-member'() {
    mutateSelectedCards('unassignMember', this._id);
    Popup.close();
  },
});

Template.moveSelectionPopup.events({
  'click .js-select-list'() {
    mutateSelectedCards('move', this._id);
    EscapeActions.executeUpTo('multiselection');
  },
});

BlazeComponent.extendComponent({
  list(){
    const selectedForms = Cards.find(MultiSelection.getMongoSelector()).fetch();
    let listIds = [];
    _.each(selectedForms, (form) => {
      listIds.push(form.listId);
    });
    return Lists.find({boardId: Session.get("currentBoard"), archived: false, _id: { $nin: listIds }});
  }
}).register('availableList');

Template.copySelectionPopup.events({
  'click .js-select-list'() {
    mutateSelectedCards('copy', this._id);
    EscapeActions.executeUpTo('multiselection');
  },
});
