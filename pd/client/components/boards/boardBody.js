const subManager = new SubsManager();

BlazeComponent.extendComponent({
  onCreated() {
    this.draggingActive = new ReactiveVar(false);
    this.showOverlay = new ReactiveVar(false);
    this.isBoardReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId)
        return;
      const handle = subManager.subscribe('board', currentBoardId);
      if (Meteor.user()){
        subManager.subscribe('user-extra-group', Meteor.user()._id);
      }
        
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isBoardReady.set(handle.ready());
        });
      });
    });

    this._isDragging = false;
    this._lastDragPositionX = 0;

    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;
    this.mouseHasEnterListDetails = false;
  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const lists = this.$('.js-lists');
    lists && lists.animate({
      scrollLeft: position,
    });
  },

  currentCardIsInThisList() {
    const currentCard = Cards.findOne(Session.get('currentCard'));
    const listId = this.currentData()._id;
    return currentCard && currentCard.listId === listId;
  },

  showCurrentList() {
    const currentList = Lists.findOne(Session.get('currentList'));
    const listId = this.currentData()._id;
    return currentList && currentList._id === listId;
  },

  onlyShowCurrentCard() {
    return Utils.isMiniScreen() && Session.get('currentCard');
  },

  onlyShowCurrentList() {
    return Utils.isMiniScreen() && Session.get('currentList');
  },

  showArchiveList() {
    if (Session.get('currentList')) {
      const currentList = Lists.findOne(Session.get('currentList'));
      return currentList.archived;
    } else {
      return false;
    }
  },

  currentCardInArchivedList() {
    const currentCard = Cards.findOne(Session.get('currentCard'));
    return currentCard && currentCard.list().archived;
  },

  events() {
    return [{
      // XXX The board-overlay div should probably be moved to the parent
      // component.
      // 'mouseenter .board-overlay'() {
      //   if (this.mouseHasEnterCardDetails || this.mouseHasEnterListDetails) {
      //     this.showOverlay.set(false);
      //   }
      // },

      // Click-and-drag action
      'mousedown .board-canvas'(evt) {
        // Translating the board canvas using the click-and-drag action can
        // conflict with the build-in browser mechanism to select text. We
        // define a list of elements in which we disable the dragging because
        // the user will legitimately expect to be able to select some text with
        // his mouse.
        const noDragInside = ['a', 'input', 'textarea', 'p', '.js-list-header'];
        if ($(evt.target).closest(noDragInside.join(',')).length === 0) {
          this._isDragging = true;
          this._lastDragPositionX = evt.clientX;
        }
      },
      'mouseup'() {
        if (this._isDragging) {
          this._isDragging = false;
        }
      },
      'mousemove'(evt) {
        if (this._isDragging) {
          // Update the canvas position
          this.listsDom.scrollLeft -= evt.clientX - this._lastDragPositionX;
          this._lastDragPositionX = evt.clientX;
          // Disable browser text selection while dragging
          evt.stopPropagation();
          evt.preventDefault();
          // Don't close opened card or inlined form at the end of the
          // click-and-drag.
          EscapeActions.executeUpTo('popup-close');
          EscapeActions.preventNextClick();
        }
      },
    }];
  },
}).register('board');

Template.boardBody.events({
  'click .js-close-notif'() {
    Utils.closeNotif();
  }
})

Template.boardBody.onRendered(function() {
  const self = BlazeComponent.getComponentForElement(this.firstNode);

  self.listsDom = this.find('.js-lists');

  if (!Session.get('currentCard')) {
    self.scrollLeft();
  }

  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  self.listsDom._uihooks = {
    removeElement(node) {
      const removeNode = _.once(() => {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details') || $(node).hasClass('js-list-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0,
        });
        $(self.listsDom).one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    },
  };

  $(self.listsDom).sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.js-list-header',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'list placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      Popup.close();
    },
    stop() {
      $(self.listsDom).find('.js-list:not(.js-list-composer)').each(
        (i, list) => {
          const data = Blaze.getData(list);
          Lists.update(data._id, {
            $set: {
              sort: i,
            },
          });
        }
      );
    },
  });

  function userIsMember() {
    return Meteor.user() && Meteor.user().isBoardMember();
  }

  // Disable drag-dropping while in multi-selection mode, or if the current user
  // is not a board member
  self.autorun(() => {
    const $listDom = $(self.listsDom);
    if ($listDom.data('sortable')) {
      $(self.listsDom).sortable('option', 'disabled',
        MultiSelection.isActive() || !userIsMember());
    }
  });
});

BlazeComponent.extendComponent({
  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  onInput(evt) {
    let input = $(evt.currentTarget).closest('input');
    if (input.val() !== '') {
      $('button[type="submit"]').addClass('primary');
      $('button[type="submit"]').prop('disabled', false);
    } else {
      $('button[type="submit"]').removeClass('primary');
      $('button[type="submit"]').prop('disabled', true);
    }
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const titleInput = this.find('.list-name-input');
        const title = titleInput.value.trim();
        const currentBoard = this.data().currentBoard;
        const sort = Lists.find({boardId: currentBoard._id}).count();
        if (title) {
          Lists.insert({
            title,
            boardId: currentBoard._id,
            sort: sort,
          }, function(status,result) {
            FlowRouter.go('list', {
              boardId: currentBoard._id,
              slug: currentBoard.slug,
              listId: result,
            });
          });

          titleInput.value = '';
          titleInput.focus();
        }
      },
      keyup: this.onInput
    }];
  },
}).register('addListForm');       
