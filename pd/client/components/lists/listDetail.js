BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak() {
    const listElement = this.find('.js-list-details');
    if (listElement) {
      const altitude = listElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    Meteor.subscribe('cardComments');
    this.isLoaded = new ReactiveVar(false);
    this.parentComponent().showOverlay.set(true);
    this.parentComponent().mouseHasEnterListDetails = false;
    this.calculateNextPeak();
  },

  scrollParentContainer() {
    const listPanelWidth = 510;
    const bodyBoardComponent = this.parentComponent();

    const $listContainer = bodyBoardComponent.$('.js-lists');
    const $listView = this.$(this.firstNode());
    const listContainerScroll = $listContainer.scrollLeft();
    const listContainerWidth = $listContainer.width();

    const listViewStart = $listView.offset().left;
    const listViewEnd = listViewStart + listPanelWidth;

    let offset = false;
    if (listViewStart < 0) {
      offset = listViewStart;
    } else if(listViewEnd > listContainerWidth) {
      offset = listViewEnd - listContainerWidth;
    }

    if (offset) {
      bodyBoardComponent.scrollLeft(listContainerScroll + offset);
    }
  },

  onRendered() {
    if (!Utils.isMiniScreen()) this.scrollParentContainer();
  },

  onDestroyed() {
    this.parentComponent().showOverlay.set(false);
  },

  events() {
    const events = {
      [`${CSSEvents.transitionend} .js-list-details`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-close-list-details'() {
        Utils.goBoardId(this.data().boardId);
      },
      'mouseenter .js-list-details'() {
        this.parentComponent().showOverlay.set(true);
        this.parentComponent().mouseHasEnterListDetails = true;
      },
      'click .js-member': Popup.open('listMember'),
      'click .js-add-labels': Popup.open('listLabels'),
      'click .js-add-members': Popup.open('listMembers'),
      'submit .js-list-details-title'(evt) {
        if (!this.data().archived) {
          evt.preventDefault();
          const title = this.find('.js-edit-list-title').value;
          this.data().rename(title);
        }
      },
      'submit .js-list-description'(evt) {
        if (!this.data().archived) {
          evt.preventDefault();
          const description = this.currentComponent().getValue();
          this.data().setDescription(description);
          UnsavedEdits.reset({
            fieldName: 'listDescription',
            docId: this.data()._id,
          });
        }
      },
      'click .js-event-repeating'(evt) {
        if (!this.data().archived) {
          const repeating = ((this.find('.js-event-repeating').id).split("-")[1] == "true" ? true : false);
          this.data().setRepeating(repeating);
        }
      },
      'click .js-open-list-details-menu': Popup.open('listAction'),
    }];
  },
}).register('listDetails');

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'listDescription',
      // XXX Recovering the currentCard identifier form a session variable is
      // fragile because this variable may change for instance if the route
      // change. We should use some component props instead.
      docId: Session.get('currentList'),
    };
  }

  close(isReset = false) {
    if (this.isOpen.get() && !isReset) {
      const draft = this.getValue().trim();
      if (draft !== Lists.findOne(Session.get('currentList')).description) {
        UnsavedEdits.set(this._getUnsavedEditKey(), this.getValue());
      }
    }
    super.close();
  }

  reset() {
    UnsavedEdits.reset(this._getUnsavedEditKey());
    this.close(true);
  }

  events() {
    const parentEvents = InlinedForm.prototype.events()[0];
    return [{
      ...parentEvents,
      'click .js-close-inlined-form': this.reset,
    }];
  }
}).register('inlinedListDescription');

// Close the list details pane by pressing escape
EscapeActions.register('detailsPane',
  () => { Utils.goBoardId(Session.get('currentBoard')); },
  () => { return !Session.equals('currentList', null); }, {
    noClickEscapeOn: '.js-list-details,.board-sidebar,#header,.board-overlay',
  }
);
