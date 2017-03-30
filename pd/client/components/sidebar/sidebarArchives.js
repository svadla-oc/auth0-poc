BlazeComponent.extendComponent({
  tabs() {
    return [
      { name: TAPi18n.__('lists'), slug: 'lists' },
      { name: TAPi18n.__('event-definition-form'), slug: 'cards' },
    ];
  },
 
  archivedCardsAndVersions() {
    const cards = Cards.find({boardId: Session.get('currentBoard')});
    // manual grouping
    const archivedCardsAndVersions = _.flatten(_.chain(cards.fetch()).groupBy("form_id").map(function(form) {
      // get archived form
      const archivedVersion = _.filter(form[0].versions, (version) => {
        return version.archived;
      });
      // add all archived form on group
      let archivedObject = [];
      _.each(form, (card) => {
        if (card.archived) {
          archivedObject.push({
            "form": card,
            "archived_versions": archivedVersion
          });
        }
      });
      // if no archived form add any archived version
      if ((archivedObject.length === 0) && (archivedVersion.length > 0)) {
        archivedObject.push({
          "form": form[0],
          "archived_versions": archivedVersion
        });
      }
      return archivedObject;
    }).value());

    return archivedCardsAndVersions;
  },

  archivedListsAndCards() {
    const lists = Lists.find({boardId: Session.get('currentBoard')});
    const archivedListsAndCards = _.flatten(_.chain(lists.fetch()).map(function(list) {
      // get archived form
      const archivedCards = _.filter(list.cardsInArchived().fetch(), (card) => {
        return card.archived;
      });
      // add all archived list and unarchived list that contain archived card
      let archivedObject = [];
      if (list.archived || (archivedCards.length > 0)) {
        archivedObject.push({
          "list": list,
          "archived_cards": archivedCards
        })
      }
      return archivedObject;
    }).value());
    return archivedListsAndCards;
  },

  onRendered() {
    // XXX We should support dragging a card from the sidebar to the board
  },

  events() {
    return [{
      'click .js-restore-card'() {
        let card = this.currentData();
        if (!card._id)
          card = this.currentData().form;
        let listincards = Lists.find({boardId : card.boardId, cardId : card.cardId}).fetch();
       
        _.each(listincards, function(element){
          let output = element.restore();
        });
        if (Utils.allowMoveOrCopy(card, card.listId, true)){
          card.restore();
        }

        Utils.goCardId(card._id);
      },
      'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
        const cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      }),
      'click .js-restore-list'() {
        const cd = this.currentData().list;
        let cardsinlist = Cards.find({boardId : cd.boardId, listId : cd._id}).fetch();
       
        _.each(cardsinlist, function(element){
          let output = element.restore();
        }); 

        cd.restore();
        Utils.goListId(cd._id);
      },
       'click .js-restore-event'() {
        this.restore();
        Popup.close();
      },
      'click .js-remove-list': Popup.afterConfirm('removeEvent', function() {
        Lists.remove(this._id);
        Popup.close();
      }),
      'click .js-restore-version'() {
        const object = this.currentData();
        const forms = Cards.find({boardId: Session.get('currentBoard'), form_id: object.formId}).fetch();
        _.each(forms, (form) => {
          form.restoreVersion(object.version.id);
        })
      },
    }];
  },
}).register( 'archivesSidebar');     
