BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.PerfectScrollbar];
  },

  openForm(options) {
    options = options || {};
    options.position = options.position || 'top';

    const forms = this.childComponents('inlinedForm');
    let form = forms.find((component) => {
      return component.data().position === options.position;
    });
    if (!form && forms.length > 0) {
      form = forms[0];
    }
    form.open();
  },

  setSpinner(ready, id) {
    let readyDom = $('.js-ready-'+id);
    let processDom = $('.js-process-'+id);
    if (ready) {
      readyDom.removeClass('hide');
      processDom.addClass('hide');
    } else {
      processDom.removeClass('hide');
      readyDom.addClass('hide');
    }
  },

  addCard(evt) {
    evt.preventDefault();
    const firstCardDom = this.find('.js-minicard:first');
    const lastCardDom = this.find('.js-minicard:last');
    const input = $(evt.currentTarget).find('.js-card-title');
    const position = this.currentData().position;
    const title = input.val().trim();
    const formComponent = this.childComponents('addCardForm')[0];
    let sortIndex;

    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCardDom).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCardDom, null).base;
    }

    const members = formComponent.members.get();
    const labelIds = formComponent.labels.get();
    const board = this.data().board();
    const mainThis = this;

    if (title) {

      this.setSpinner(false, this.data()._id);
      const duplicate = Cards.find({listId : this.data()._id, title: { $regex: new RegExp("^" + title + "$", "i") }, archived: false}).fetch()[0];

      if (duplicate) {
        Utils.showNotif("<a href=" + duplicate.absoluteUrl() + " style='text-decoration: underline'>" + duplicate.title + "</a> is already part of <a href=" + this.data().absoluteUrl() + " style='text-decoration: underline'>" + this.data().title + "</a>. You can add a different form to <a href=" + this.data().absoluteUrl() + " style='text-decoration: underline'>" + this.data().title + "</a>, or add this form to another event.", 'danger');
        mainThis.setSpinner(true, this.data()._id);
      } else {
        // get reference form from db
        let refForm = Cards.find({boardId : this.data().boardId, title: { $regex: new RegExp("^" + title + "$", "i") }}).fetch()[0];

        if (refForm) {
          delete refForm._id;
          refForm.listId = this.data()._id;
          refForm.archived = false;
          delete refForm.createdAt;
          delete refForm.dateLastActivity;
          delete refForm._parentId;
          refForm.labelIds = [];
          refForm.members = [];
          refForm.userId = Meteor.userId();
          if (refForm.activeVersions().length === 1) {
            refForm.selected_form_version_id = refForm.versions[0].id;
            refForm.previewUrl = refForm.versions[0].previewURL;
          } else {
            delete refForm.selected_form_version_id;
            delete refForm.previewUrl;
          }
          refForm.sort = sortIndex;
          refForm.hidden = false;
          refForm.required = false;
          refForm.participate = false;
          refForm.anonymous = false;
          refForm.offline = false;
          if (refForm.submissionUri)
            delete refForm.submissionUri;
          Cards.insert(refForm, (error, cardId) => {
            if (error) {
              Utils.showNotif(TAPi18n.__('create-form-failed'), 'danger');
            } else {
              FlowRouter.go('card', {
                boardId: board._id,
                slug: board.slug,
                cardId: cardId,
              });
            }
            mainThis.setSpinner(true, this.data()._id);
          });
        } else {
          Meteor.call('getForm', board._id, encodeURI(title.toLowerCase()), function(err, form){
            if (!err) {
              if (form === "error") {
                Utils.showNotif(TAPi18n.__('create-form-failed'), 'danger');
                mainThis.setSpinner(true, mainThis.data()._id);
              } else {
                form = Utils.addFieldArchive(form);
                const _id = Cards.insert({
                  title,
                  members,
                  labelIds,
                  listId: mainThis.data()._id,
                  boardId: mainThis.data().board()._id,
                  formOcoid: form.ocoid,
                  description: form.description,
                  sort: sortIndex,
                  form_id: form.id,
                  versions: form.versions,
                  selected_form_version_id: form.versions[0] ? form.versions[0].id : "",
                  previewUrl: form.versions[0] ? form.versions[0].previewURL : "",
                }, function(error, result) {
                  if (error) {
                    Utils.showNotif(TAPi18n.__('create-form-failed'), 'danger');
                  } else {
                    FlowRouter.go('card', {
                      boardId: board._id,
                      slug: board.slug,
                      cardId: result,
                    });
                  }
                  mainThis.setSpinner(true, mainThis.data()._id);
                });
                // In case the filter is active we need to add the newly inserted card in
                // the list of exceptions -- cards that are not filtered. Otherwise the
                // card will disappear instantly.
                // See https://github.com/wekan/wekan/issues/80
                Filter.addException(_id);

                // We keep the form opened, empty it, and scroll to it.
                input.val('').focus();
                autosize.update(input);
                if (position === 'bottom') {
                  mainThis.scrollToBottom();
                }

                formComponent.reset();
              }
            } else {
              Utils.showNotif("Create form failed!", 'danger');
              mainThis.setSpinner(true, mainThis.data()._id);
            }
          });
        }

      }
    }
  },

  scrollToBottom() {
    const container = this.firstNode();
    $(container).animate({
      scrollTop: container.scrollHeight,
    });
  },

  clickOnMiniCard(evt) {
    if (MultiSelection.isActive() || evt.shiftKey) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      const methodName = evt.shiftKey ? 'toggleRange' : 'toggle';
      MultiSelection[methodName](this.currentData()._id);

    // If the card is already selected, we want to de-select it.
    // XXX We should probably modify the minicard href attribute instead of
    // overwriting the event in case the card is already selected.
    } else if (Session.equals('currentCard', this.currentData()._id)) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      Utils.goBoardId(Session.get('currentBoard'));
    }
  },

  cardIsSelected() {
    return Session.equals('currentCard', this.currentData()._id);
  },

  toggleMultiSelection(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    MultiSelection.toggle(this.currentData()._id);
  },

  events() {
    return [{
      'click .js-minicard': this.clickOnMiniCard,
      'click .js-toggle-multi-selection': this.toggleMultiSelection,
      'click .open-minicard-composer': this.scrollToBottom,
      submit: this.addCard,
    }];
  },
}).register('listBody');

function toggleValueInReactiveArray(reactiveValue, value) {
  const array = reactiveValue.get();
  const valueIndex = array.indexOf(value);
  if (valueIndex === -1) {
    array.push(value);
  } else {
    array.splice(valueIndex, 1);
  }
  reactiveValue.set(array);
}

BlazeComponent.extendComponent({
  onCreated() {
    this.labels = new ReactiveVar([]);
    this.members = new ReactiveVar([]);
  },

  reset() {
    this.labels.set([]);
    this.members.set([]);
  },

  getLabels() {
    const currentBoardId = Session.get('currentBoard');
    return Boards.findOne(currentBoardId).labels.filter((label) => {
      return this.labels.get().indexOf(label._id) > -1;
    });
  },

  pressKey(evt) {
    // Pressing Enter should submit the card
    if (evt.keyCode === 13) {
      evt.preventDefault();
      const $form = $(evt.currentTarget).closest('form');
      // XXX For some reason $form.submit() does not work (it's probably a bug
      // of blaze-component related to the fact that the submit event is non-
      // bubbling). This is why we click on the submit button instead -- which
      // work.
      // $form.find('button[type=submit]').click();

    // Pressing Tab should open the form of the next column, and Maj+Tab go
    // in the reverse order
    } else if (evt.keyCode === 9) {
      evt.preventDefault();
      const isReverse = evt.shiftKey;
      const list = $(`#js-list-${this.data().listId}`);
      const listSelector = '.js-list:not(.js-list-composer)';
      let nextList = list[isReverse ? 'prev' : 'next'](listSelector).get(0);
      // If there is no next list, loop back to the beginning.
      if (!nextList) {
        nextList = $(listSelector + (isReverse ? ':last' : ':first')).get(0);
      }

      BlazeComponent.getComponentForElement(nextList).openForm({
        position:this.data().position,
      });

    // Valid form will change the button color to look like active button
    } else {
      let input = $(evt.currentTarget).closest('input');
      if (input.val() !== '') {
        $('button[type="submit"]').addClass('primary');
        $('button[type="submit"]').prop('disabled', false);
      } else {
        $('button[type="submit"]').removeClass('primary');
        $('button[type="submit"]').prop('disabled', true);
      }
    }
  },

  events() {
    return [{
      keyup: this.pressKey,
    }];
  },

  onRendered() {
    const editor = this;
    const $textarea = this.$('textarea');

    autosize($textarea);

    $textarea.escapeableTextComplete([
      // User mentions
      {
        match: /\B@(\w*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.activeMembers(), (member) => {
            const user = Users.findOne(member.userId);
            return user.username.indexOf(term) === 0 ? user : null;
          }));
        },
        template(user) {
          return user.username;
        },
        replace(user) {
          toggleValueInReactiveArray(editor.members, user._id);
          return '';
        },
        index: 1,
      },

      // Labels
      {
        match: /\B#(\w*)$/,
        search(term, callback) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          callback($.map(currentBoard.labels, (label) => {
            if (label.name.indexOf(term) > -1 ||
                label.color.indexOf(term) > -1) {
              return label;
            }
            return null;
          }));
        },
        template(label) {
          return Blaze.toHTMLWithData(Template.autocompleteLabelLine, {
            hasNoName: !label.name,
            colorName: label.color,
            labelName: label.name || label.color,
          });
        },
        replace(label) {
          toggleValueInReactiveArray(editor.labels, label._id);
          return '';
        },
        index: 1,
      },
    ], {
      // When the autocomplete menu is shown we want both a press of both `Tab`
      // or `Enter` to validation the auto-completion. We also need to stop the
      // event propagation to prevent the card from submitting (on `Enter`) or
      // going on the next column (on `Tab`).
      onKeyup(evt, commands) {
        if (evt.keyCode === 9 || evt.keyCode === 13) {
          evt.stopPropagation();
          return commands.KEY_ENTER;
        }
        return null;
      },
    });
  },
}).register('addCardForm');
