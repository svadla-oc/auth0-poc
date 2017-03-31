BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak() {
    const cardElement = this.find('.js-card-details');
    if (cardElement) {
      const altitude = cardElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    this.isLoaded = new ReactiveVar(false);
    this.parentComponent().showOverlay.set(true);
    this.parentComponent().mouseHasEnterCardDetails = false;
    this.calculateNextPeak();
  },

  isWatching() {
    const card = this.currentData();
    return card.findWatcher(Meteor.userId());
  },

  scrollParentContainer() {
    const cardPanelWidth = 510;
    const bodyBoardComponent = this.parentComponent();

    const $cardContainer = bodyBoardComponent.$('.js-lists');
    const $cardView = this.$(this.firstNode());
    const cardContainerScroll = $cardContainer.scrollLeft();
    const cardContainerWidth = $cardContainer.width();

    const cardViewStart = $cardView.offset().left;
    const cardViewEnd = cardViewStart + cardPanelWidth;

    let offset = false;
    if (cardViewStart < 0) {
      offset = cardViewStart;
    } else if(cardViewEnd > cardContainerWidth) {
      offset = cardViewEnd - cardContainerWidth;
    }

    if (offset) {
      bodyBoardComponent.scrollLeft(cardContainerScroll + offset);
    }
  },

  onRendered() {
    if (!Utils.isMiniScreen()) this.scrollParentContainer();
  },

  onDestroyed() {
    this.parentComponent().showOverlay.set(false);
  },

  clientUrl: window.document.origin,

  setCheckBox(type, value) {
    var trueDom = '#' +type+ '-true';
    var falseDom = '#' +type+ '-false';
    if (value) {
      this.$(trueDom).removeClass('hide');
      this.$(falseDom).addClass('hide');
    } else {
      this.$(trueDom).addClass('hide');
      this.$(falseDom).removeClass('hide');
    }
  },

  uploading(onProcess) {
    let readyDom = $('.js-ready');
    let processDom = $('.js-process');
    if (onProcess) {
      processDom.removeClass('hide');
      readyDom.addClass('hide');
    } else {
      readyDom.removeClass('hide');
      processDom.addClass('hide');
    }
  },

  events() {
    const events = {
      [`${CSSEvents.transitionend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
      [`${CSSEvents.animationend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-close-card-details'() {
        Utils.goBoardId(this.data().boardId);
      },
      'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
      'submit .js-card-description'(evt) {
        if (!this.data().archived) {
          evt.preventDefault();
          const description = this.currentComponent().getValue();
          let cards = Cards.find({boardId : this.data().boardId, form_id: this.data().form_id}).fetch();
          _.each(cards, (card) => {
            card.setDescription(description);
          });
          UnsavedEdits.reset({
            fieldName: 'cardDescription',
            docId: this.data()._id,
          });
        }
      },
      'submit .js-card-details-title'(evt) {
        if (!this.data().archived) {
          evt.preventDefault();
          const title = this.currentComponent().getValue().trim();
          let usedTitle = Cards.find({boardId : this.data().boardId, title: { $regex: new RegExp("^" + title + "$", "i") }});
          let allow = false;
          if (!_.contains((_.pluck(usedTitle.fetch(), "_id")), this.data()._id)) {
            if (usedTitle.count() > 0) {
              Utils.showNotif(title+" is already used on this protocol. Please use different title.", 'danger');
            } else {
              allow = true;
            }
          } else {
            // allow rename with different case
            allow = true;
          }

          if (allow) {
            if (title) {
              let cards = Cards.find({boardId : this.data().boardId, form_id: this.data().form_id}).fetch();
              _.each(cards, (card) => {
                card.setTitle(title);
              })
            }
          }
        }
      },
      'click .js-member': Popup.open('cardDetailMember'),
      'click .js-add-members': Popup.open('cardMembers'),
      'click .js-add-labels': Popup.open('cardLabels'),
      'mouseenter .js-card-details'() {
        this.parentComponent().showOverlay.set(true);
        this.parentComponent().mouseHasEnterCardDetails = true;
      },
      'submit .js-card-details-subUri'(evt) {
        if (!this.data().archived) {
          evt.preventDefault();
          const submissionUri = this.currentComponent().getValue().trim();
          if (submissionUri) 
              this.data().setSubmissionUri(submissionUri);
        }
      },
      'click .js-edit-card-hidden'(evt) {
        if (!this.data().archived) {
          let value = ((evt.target.id).split('-')[1]) === "true" ? false : true;
          this.data().setHidden(value);
          this.setCheckBox('hidden', value);
        }
      },
      'click .js-edit-card-required'(evt) {
        if (!this.data().archived) {
          let value = ((evt.target.id).split('-')[1]) === "true" ? false : true;
          this.data().setRequired(value);
          this.setCheckBox('required', value);
        }
      },
      'click .js-edit-card-participate'(evt) {
        if (!this.data().archived) {
          let value = ((evt.target.id).split('-')[1]) === "true" ? false : true;
          this.data().setParticipate(value);
          this.setCheckBox('participate', value);
        }
      },
      'click .js-edit-card-anonymous'(evt) {
        if (!this.data().archived) {
          let value = ((evt.target.id).split('-')[1]) === "true" ? false : true;
          this.data().setAnonymous(value);
          this.setCheckBox('anonymous', value);
        }
      },
      'click .js-edit-card-offline'(evt) {
        if (!this.data().archived) {
          let value = ((evt.target.id).split('-')[1]) === "true" ? false : true;
          this.data().setOffline(value);
          this.setCheckBox('offline', value);
        }
      },
      'click .js-design-form-btn'(evt) {
        $('#formUpload').trigger("reset");
        this.$('.js-design-form-input').click();
      },
      'change input[name=_version]'(evt) {
        if (!this.data().archived) {
          let versionValue = $('input[name=_version]:checked').val();
          this.data().setVersion(versionValue);
          _.each(this.data().versions, (version) => {
            if (version.id.toString() === versionValue) {
              this.data().setPreviewUrl(version.previewURL);
            }
          });
        }
      },
      'click .js-card-version-2nd-action'(evt){
        let id = (evt.target.id).split('version-')[1];
        _.each(this.data().versions, (version) => {
          if ((version.id).toString() === id) {
            Session.set("currentCardVersion",version);
          }
        });
      },
      'click .js-card-version-action': Popup.open('cardDetailsVersion'),
      'change .js-design-form-input'(evt) {
        if (!this.data().archived) {
          this.uploading(true);
          let file, fileUrl, fileBinaries = [], fileNames = [],
          obj = [],
          params = [],
          currentCard = this.data(),
          filesLength = evt.target.files.length,
          mainThis = this;

          FS.Utility.eachFile(evt, (f) => {
            try {
              let board = Boards.findOne(Session.get('currentBoard'));
              params.push(f.name);

              let reader = new FileReader();
              reader.readAsBinaryString(f);
              $(reader).on('load', function processFile(file) {
                obj.push({
                  binary: file.target.result,
                  name: f.name
                });
                if (obj.length === filesLength) {
                  Meteor.call('uploadForm', board._id, currentCard.form_id, obj, function(err, response) {
                    if (err || (response === 'error'))
                      Utils.showNotif(TAPi18n.__('upload-form-failed', {name: params.join(', ')}), 'danger');
                    else {
                      Utils.showNotif(TAPi18n.__('upload-form-success', {name: params.join(', ')}), 'success');
                      response = Utils.addFieldArchive(currentCard, response);
                      const cards = Cards.find({boardId: currentCard.boardId, title: { $regex: new RegExp("^" + currentCard.title + "$", "i") }}).fetch();
                      _.each(cards, (card) => {
                        // set as default version if no version selected
                        if (!card.selected_form_version_id) {
                          card.setVersion(response.versions[0].id);
                          card.setPreviewUrl(response.versions[0].previewURL);
                        }
                        card.setVersions(response.versions);
                      });
                      _.each(response.versions, (version) => {
                        if (currentCard.selected_form_version_id === version.id) {
                          currentCard.setPreviewUrl(version.previewURL);
                        }
                      })
                    }
                    mainThis.uploading(false);
                  }); 
                }
              });
            } catch (e) {
              this.setError('no-uploaded-file-found');
              Utils.showNotif(TAPi18n.__('upload-form-failed', {name: params.join(', ')}), 'danger');
              fileBinaries = [];
              mainThis.uploading(false);
            }
          });
        }
      },
      'click .js-preview-form-btn'(evt) {
        window.open(this.data().previewUrl,'_blank');
      }
    }];
  },
}).register('cardDetails');

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'cardDescription',
      // XXX Recovering the currentCard identifier form a session variable is
      // fragile because this variable may change for instance if the route
      // change. We should use some component props instead.
      docId: Session.get('currentCard'),
    };
  }

  close(isReset = false) {
    if (this.isOpen.get() && !isReset) {
      const draft = this.getValue().trim();
      if (draft !== Cards.findOne(Session.get('currentCard')).description) {
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
}).register('inlinedCardDescription');

Template.cardDetailsActionsPopup.helpers({
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },
});

Template.cardDetailsActionsPopup.events({
  'click .js-members': Popup.open('cardMembers'),
  'click .js-labels': Popup.open('cardLabels'),
  'click .js-attachments': Popup.open('cardAttachments'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-move-card': Popup.open('moveCard'),
  'click .js-move-card-to-top'(evt) {
    evt.preventDefault();
    const minOrder = _.min(this.list().cards().map((c) => c.sort));
    this.move(this.listId, minOrder - 1);
  },
  'click .js-move-card-to-bottom'(evt) {
    evt.preventDefault();
    const maxOrder = _.max(this.list().cards().map((c) => c.sort));
    this.move(this.listId, maxOrder + 1);
  },
  'click .js-archive'(evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
  'click .js-morerestore': Popup.open('cardMore'),
  'click .js-toggle-watch-card'() {
    const currentCard = this;
    const level = currentCard.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'card', currentCard._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
  'click .js-archive-card': Popup.afterConfirm('cardArchive', function() {
    Popup.close();
    this.archive();
    Utils.goBoardId(this.boardId);
  }),
  'click .js-copy-card-to': Popup.open('copyToEvent'),
  'click .js-restore-card'() {
    if (Utils.allowMoveOrCopy(this, this.listId, true)){
      this.restore();
    }
    console.log(this);
  }
});

Template.editCardTitleForm.onRendered(function() {
  autosize(this.$('.js-edit-card-title'));
});

Template.editCardTitleForm.events({
  'keydown .js-edit-card-title'(evt) {
    // If enter key was pressed, submit the data
    if (evt.keyCode === 13) {
      $('.js-submit-edit-card-title-form').click();
    }
  },
});

Template.moveCardPopup.events({
  'click .js-select-list'() {
    // XXX We should *not* get the currentCard from the global state, but
    // instead from a “component” state.
    const card = Cards.findOne(Session.get('currentCard'));
    if (Utils.allowMoveOrCopy(card, this._id)) {
      card.move(this._id);
    }

    Popup.close();
  },
});

Template.copyToEventPopup.events({
  'click .js-select-list'() {
    const card = Cards.findOne(Session.get('currentCard'));
    const list = Lists.findOne(this._id);
    let maxOrder = 0; 
    if (list.cards().fetch().length !== 0)
      maxOrder = _.max(list.cards().map((c) => c.sort));
    if (Utils.allowMoveOrCopy(card, this._id)) {
      card._parentId = card._id;
      delete card._id;
      delete card.createdAt;
      delete card.modifiedAt;
      card.sort = maxOrder + 1;
      card.listId = this._id;
      Cards.insert(card, (err, cardId) => {
        if (!err)
          Utils.goCardId(cardId);
      });
    }

  }
});

Template.cardMorePopup.events({
  'click .js-delete': Popup.afterConfirm('cardArchive', function() {
    Popup.close();
    Cards.remove(this._id);
    Utils.goBoardId(this.boardId);
  }),
});

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  () => { Utils.goBoardId(Session.get('currentBoard')); },
  () => { return !Session.equals('currentCard', null); }, {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header,.board-overlay',
  }
);

BlazeComponent.extendComponent({

  activeCard() {
    return Cards.findOne(Session.get("currentCard"));
  },

  currentCardVersion() {
    return Session.get('currentCardVersion');
  },

  href() {
    let version = Session.get('currentCardVersion');
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(version));
  },

  events() {
    return [{
      'click .js-preview-version'(evt) {
        window.open(this.currentCardVersion().previewURL, '_blank');
        Popup.close();
      },
      'click .js-archive-version': Popup.afterConfirm('versionDelete', function() {
        let card = Cards.findOne(Session.get("currentCard"));
        let version = Session.get("currentCardVersion");
        Utils.archiveVersion(card, version);
        Popup.close();
      }),
      'click .js-download-version': Popup.open('cardDetailsAvailableVersion'),
    }]
  }

}).register('cardDetailsVersionPopup');

BlazeComponent.extendComponent({

  type() {
    let obj = [];
    let version = Session.get("currentCardVersion");
    _.each(version.uploadedFileLinks, (link) => {
      let tmp = link.split('/');
      obj.push({
        href: link,
        name: (_.last(tmp))
      })
    })
    return obj;
  }

}).register('cardDetailsAvailableVersionPopup');
