let labelColors;
Meteor.startup(() => {
  labelColors = Boards.simpleSchema()._schema['labels.$.color'].allowedValues;
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentColor = new ReactiveVar(this.data().color);
  },

  labels() {
    return labelColors.map((color) => ({ color, name: '' }));
  },

  isSelected(color) {
    return this.currentColor.get() === color;
  },

  events() {
    return [{
      'click .js-palette-color'() {
        this.currentColor.set(this.currentData().color);
      },
    }];
  },
}).register('formListLabel');

Template.createListLabelPopup.helpers({
  // This is the default color for a new label. We search the first color that
  // is not already used in the board (although it's not a problem if two
  // labels have the same color).
  defaultColor() {
    const labels = Boards.findOne(Session.get('currentBoard')).labels;
    const usedColors = _.pluck(labels, 'color');
    const availableColors = _.difference(labelColors, usedColors);
    return availableColors.length > 1 ? availableColors[0] : labelColors[0];
  },
});

Template.listLabelsPopup.events({
  'click .js-select-label'(evt) {
    const list = Lists.findOne(Session.get('currentList'));
    if (!list.archived) {
      const labelId = this._id;
      list.toggleLabel(labelId);
      evt.preventDefault();
    }
  },
  'click .js-edit-label': Popup.open('editListLabel'),
  'click .js-add-label': Popup.open('createListLabel'),
});

Template.formListLabel.events({
  'click .js-palette-color'(evt) {
    const $this = $(evt.currentTarget);

    // hide selected ll colors
    $('.js-palette-select').addClass('hide');

    // show select color
    $this.find('.js-palette-select').removeClass('hide');
  },
});

Template.createListLabelPopup.events({
  // Create the new label
  'submit .create-label'(evt, tpl) {
    evt.preventDefault();
    const board = Boards.findOne(Session.get('currentBoard'));
    const name = tpl.$('#labelName').val().trim();
    const color = Blaze.getData(tpl.find('.fa-check')).color;
    board.addLabel(name, color);
    Popup.back();
  },
});

Template.editListLabelPopup.events({
  'click .js-delete-label': Popup.afterConfirm('deleteListLabel', function() {
    const board = Boards.findOne(Session.get('currentBoard'));
    board.removeLabel(this._id);
    Popup.back(2);
  }),
  'submit .edit-label'(evt, tpl) {
    evt.preventDefault();
    const board = Boards.findOne(Session.get('currentBoard'));
    const name = tpl.$('#labelName').val().trim();
    const color = Blaze.getData(tpl.find('.fa-check')).color;
    board.editLabel(this._id, name, color);
    Popup.back();
  },
});

Template.listLabelsPopup.helpers({
  isLabelSelected(listId) {
    return _.contains(Lists.findOne(listId).labelIds, this._id);
  },
});
