Lists = new Mongo.Collection('lists');

Lists.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  description: {
    type: String,
    optional: true,
    autoValue() { 
      if (this.isInsert && !this.isSet) {
        return "";
      }
    },
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  boardId: {
    type: String,
  },
  createdAt: {
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true,
  },
  updatedAt: {
    type: Date,
    optional: true,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isUpdate) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  labelIds: {
    type: [String],
    optional: true,
  },
  members: {
    type: [String],
    optional: true,
  },
  isRepeating: {
    type: Boolean,
    optional: true,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  _parentId: {
    type: String,
    optional: true,
  }
}));

Lists.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Lists.helpers({
  cards() {
    const ccards = Cards.find(Filter.mongoSelector({
      listId: this._id,
      archived: false,
    }), { sort: {sort: 1} });
    return ccards;
  },

  cardsInArchived() {
    const cards = Cards.find(Filter.mongoSelector({
      listId: this._id,
      archived: true,
    }), { sort: {sort: 1} });
    return cards;
  },

  checkCardsInArchived() {
    const cards = Cards.find(Filter.mongoSelector({
      listId: this._id,
      archived: true,
    }), { sort: {sort: 1} }).count();
    return card > 0;
  },

  allCards() {
    return Cards.find({ listId: this._id, archived: false });
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  labels() {
    const boardLabels = this.board().labels;
    const listLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return listLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  activities() {
    const result = Activities.find({ listId: this._id }, { sort: { createdAt: -1 }});
    return result;
  },

  comments() {
    return CardComments.find({ listId: this._id }, { sort: { createdAt: -1 }});
  },

  absoluteUrl() {
    const board = this.board();
    return FlowRouter.url('list', {
      boardId: board._id,
      slug: board.slug,
      listId: this._id,
    });
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title }};
  },

  setDescription(description) {
    return { $set: { description }};
  },

  setRepeating(isRepeating) {
    return { $set: { isRepeating }};
  },

  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },

  move(boardId) {
    const mutatedFields = { boardId };
    return { $set: mutatedFields };
  },

  addLabel(labelId) {
    return { $addToSet: { labelIds: labelId }};
  },

  removeLabel(labelId) {
    return { $pull: { labelIds: labelId }};
  },

  toggleLabel(labelId) {
    if (this.labelIds && this.labelIds.indexOf(labelId) > -1) {
      return this.removeLabel(labelId);
    } else {
      return this.addLabel(labelId);
    }
  },

  assignMember(memberId) {
    return { $addToSet: { members: memberId }};
  },

  unassignMember(memberId) {
    return { $pull: { members: memberId }};
  },

  toggleMember(memberId) {
    if (this.members && this.members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },
});

// Lists.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  Meteor.startup(() => {
    Lists._collection._ensureIndex({ boardId: 1 });
  });

  Lists.after.insert((userId, doc) => {
    if (doc._parentId) {
      const oldlist = Lists.findOne(doc._parentId);
      if (userId) {
        Activities.insert({
          userId,
          type: 'list',
          activityType: 'copyListClone',
          listId: doc._id,
          oldListId: doc._parentId,
        });
        Activities.insert({
          userId,
          type: 'list',
          activityType: 'copyListOriginal',
          listId: doc._parentId,
          boardId: oldlist.boardId,
          newListId: doc._id,
        });
      }
      const allCards = Lists.findOne(doc._parentId).allCards().fetch();
      _.each(allCards, (card) => {
        card._parentId = card._id;
        let cardId = card._id;
        delete card._id;
        delete card.createdAt;
        delete card.modifiedAt;
        card.listId = doc._id;
        card.boardId = doc.boardId;
        Cards.insert(card, (newCardId) => {
          Activities.insert({
            userId,
            activityType: 'copyCardOriginal',
            boardId: oldlist.boardId,
            listId: doc._parentId,
            cardId,
            newCardId,
            newListId: doc._id,
          });
        });
      });
    } else {
      if (userId) {
        Activities.insert({
          userId,
          type: 'list',
          activityType: 'createList',
          boardId: doc.boardId,
          listId: doc._id,
        });
      }
    }
  });

  Lists.after.update(function(userId, doc, fieldNames, modifier) {
    if (_.contains(fieldNames, 'archived')) {
      if (doc.archived) {
        Activities.insert({
          userId,
          type: 'list',
          activityType: 'archivedList',
          listId: doc._id,
          boardId: doc.boardId,
        });
      } else {
        Activities.insert({
          userId,
          type: 'list',
          activityType: 'restoredList',
          listId: doc._id,
          boardId: doc.boardId,
        });
      }
    }

    const oldBoardId = this.previous.boardId;
    if (_.contains(fieldNames, 'boardId') && doc.boardId !== oldBoardId) {
      Activities.insert({
        userId,
        oldBoardId,
        activityType: 'moveList',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }
    
    const oldListTitle = this.previous.title;
    if (_.contains(fieldNames, 'title')) {
      Activities.insert({
        userId,
        oldListTitle,
        activityType: 'renameList',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }

    const oldListDescription = this.previous.description || "no description";
    if (_.contains(fieldNames, 'description')) {
      Activities.insert({
        userId,
        oldListDescription,
        activityType: 'updateDescriptionList',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }

    if (_.contains(fieldNames, 'isRepeating')) {
      Activities.insert({
        userId,
        activityType: 'updateRepeating',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }

    if (_.contains(fieldNames, 'sort')) {
      Activities.insert({
        userId,
        activityType: 'updateOrderList',
        listId: doc._id,
        boardId: doc.boardId,
        sort: doc.sort,
      });
    }
  });

    // Add a new activity if we add or remove a member to the list
  Lists.before.update((userId, doc, fieldNames, modifier) => {
    if (!_.contains(fieldNames, 'members'))
      return;
    let memberId;
    // Say hello to the new member
    if (modifier.$addToSet && modifier.$addToSet.members) {
      memberId = modifier.$addToSet.members;
      if (!_.contains(doc.members, memberId)) {
        Activities.insert({
          userId,
          memberId,
          activityType: 'joinMember',
          boardId: doc.boardId,
          listId: doc._id,
        });
      }
    }

    // Say goodbye to the former member
    if (modifier.$pull && modifier.$pull.members) {
      memberId = modifier.$pull.members;
      Activities.insert({
        userId,
        memberId,
        activityType: 'unjoinMember',
        boardId: doc.boardId,
        listId: doc._id,
      });
    }
  });

  Lists.after.remove((userId, doc) => {
    Cards.remove({listId: doc._id});
    CardComments.remove({listId: doc._id});
    Activities.remove({listId: doc._id});
  });
}
