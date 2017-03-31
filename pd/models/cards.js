Cards = new Mongo.Collection('cards');

// XXX To improve pub/sub performances a card document should include a
// de-normalized number of comments so we don't have to publish the whole list
// of comments just to display the number of them in the board view.
Cards.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  listId: {
    type: String,
  },
  // The system could work without this `boardId` information (we could deduce
  // the board identifier from the card), but it would make the system more
  // difficult to manage and less efficient.
  boardId: {
    type: String,
  },
  formOcoid: {
    type: String,
  },
  coverId: {
    type: String,
    optional: true,
  },
  form_id: {
    type:Number,
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
  dateLastActivity: {
    type: Date,
    autoValue() {
      return new Date();
    },
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
  labelIds: {
    type: [String],
    optional: true,
  },
  members: {
    type: [String],
    optional: true,
  },
  startAt: {
    type: Date,
    optional: true,
  },
  dueAt: {
    type: Date,
    optional: true,
  },
  // XXX Should probably be called `authorId`. Is it even needed since we have
  // the `members` field?
  userId: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return this.userId;
      }
    },
  },
  sort: {
    type: Number,
    decimal: true,
  },
  selected_form_version_id: {
    type: Number,
    optional: true,
  },
  previewUrl: {
    type: String,
    optional: true,
  },
  versions: {
    type: [Object],
    optional: true,
  },
  'versions.$.id': {
    type: Number,
  },
  'versions.$.ocoid': {
    type: String,
  },
  'versions.$.name': {
    type: String,
  },
  'versions.$.description': {
    type: String,
    optional: true,
  },
  'versions.$.previewURL': {
    type: String,
    optional: true
  },
  'versions.$.artifactURL': {
    type: String,
    optional: true
  },
  'versions.$.fileLinks': {
    type: [String],
    optional: true
  },
  'versions.$.archived': {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  'versions.$.uploadedFileLinks': {
    type: [String],
    optional: true
  },
  hidden: {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  required: {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  participate: {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  anonymous: {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  offline: {
    type: Boolean,
    autoValue() {
      if (this.isInsert && !this.isSet) {
        return false;
      }
    },
  },
  submissionUri: {
    type: String,
    optional: true,
  },
  _parentId: {
    type: String,
    optional: true,
  },
  lastModifiedVersionName: {
    type: String,
    optional: true,
  },
  lastModifiedVersionStatus: {
    type: String,
    optional: true,
  }

}));

Cards.allow({
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

Cards.helpers({
  list() {
    return Lists.findOne(this.listId);
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, (label) => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },

  hasLabel(labelId) {
    return _.contains(this.labelIds, labelId);
  },

  user() {
    return Users.findOne(this.userId);
  },

  isAssigned(memberId) {
    return _.contains(this.members, memberId);
  },

  activities() {
    return Activities.find({ cardId: this._id }, { sort: { createdAt: -1 }});
  },

  comments() {
    return CardComments.find({ cardId: this._id }, { sort: { createdAt: -1 }});
  },

  attachments() {
    return Attachments.find({ cardId: this._id }, { sort: { uploadedAt: -1 }});
  },

 


  cover() {
    const cover = Attachments.findOne(this.coverId);
    // if we return a cover before it is fully stored, we will get errors when we try to display it
    // todo XXX we could return a default "upload pending" image in the meantime?
    return cover && cover.url() && cover;
  },

  checklists() {
    return Checklists.find({ cardId: this._id }, { sort: { createdAt: 1 }});
  },

  checklistItemCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.itemCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinishedCount() {
    const checklists = this.checklists().fetch();
    return checklists.map((checklist) => {
      return checklist.finishedCount();
    }).reduce((prev, next) => {
      return prev + next;
    }, 0);
  },

  checklistFinished() {
    return this.hasChecklist() && this.checklistItemCount() === this.checklistFinishedCount();
  },

  hasChecklist() {
    return this.checklistItemCount() !== 0;
  },

  absoluteUrl() {
    const board = this.board();
    return FlowRouter.url('card', {
      boardId: board._id,
      slug: board.slug,
      cardId: this._id,
    });
  },

  version() {
    return _.find(this.versions, (version) => {
      return this.selected_form_version_id === version.id;
    });
  },

  versionIndex(id) {
    return _.pluck(this.versions, 'id').indexOf(id);
  },

  isArchivedVersion(id) {
    const versionIndex = this.versionIndex(id);
    if (versionIndex === -1 || this.versions[versionIndex].archived === undefined) {
      return false;
    } else {
      return false || this.versions[versionIndex].archived;
    }
  },

  activeVersions() {
    return _.filter(this.versions, (version) => {
      return !version.archived;
    })
  },

  archivedVersions() {
    return _.filter(this.versions, (version) => {
      return version.archived;
    })
  },

  checkArchivedVersions() {
    const checks = _.filter(this.versions, (version) => {
      return version.archived;
    })
    return checks.length > 0;
  }
});

Cards.mutations({
  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },

  setTitle(title) {
    return { $set: { title }};
  },

  setDescription(description) {
    return { $set: { description }};
  },

  move(listId, sortIndex) {
    const mutatedFields = { listId };
    if (sortIndex !== undefined) {
      mutatedFields.sort = parseInt(sortIndex);
    }
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

  setCover(coverId) {
    return { $set: { coverId }};
  },

  unsetCover() {
    return { $unset: { coverId: '' }};
  },

  setVersion(selected_form_version_id) {
    return { $set: { selected_form_version_id }};
  },

  setSubmissionUri(submissionUri) {
    return { $set: { submissionUri }};
  },

  setHidden(hidden) {
    return { $set: { hidden}};
  },

  setRequired(required) {
    return { $set: {required}};
  },

  setParticipate(participate) {
    return { $set: {participate}};
  },

  setAnonymous(anonymous) {
    return { $set: {anonymous}};
  },

  setOffline(offline) {
    return { $set: {offline}};
  },

  setPreviewUrl(previewUrl) {
    return { $set: {previewUrl}};
  },

  setVersions(versions) {
    return { $set: {versions}}
  },

  removeVersion(id) {
    const versionIndex = this.versionIndex(id);
    return {
      $set: {
        [`versions.${versionIndex}.archived`]: true,
        lastModifiedVersionName: this.versions[versionIndex].name,
        lastModifiedVersionStatus: 'archived'
      },
    };
  },

  restoreVersion(id) {
    const versionIndex = this.versionIndex(id);
    return {
      $set: {
        [`versions.${versionIndex}.archived`]: false,
        lastModifiedVersionName: this.versions[versionIndex].name,
        lastModifiedVersionStatus: 'restore'
      },
    };
  },

  setStart(startAt) {
    return { $set: { startAt }};
  },

  unsetStart() {
    return { $unset: { startAt: '' }};
  },

  setDue(dueAt) {
    return { $set: { dueAt }};
  },

  unsetDue() {
    return { $unset: { dueAt: '' }};
  },
});

if (Meteor.isServer) {
  // Cards are often fetched within a board, so we create an index to make these
  // queries more efficient.
  Meteor.startup(() => {
    Cards._collection._ensureIndex({ boardId: 1 });
  });

  Cards.after.insert((userId, doc) => {
    // auto remove archived form with same title in current event
    const archivedForms = Cards.find({boardId: doc.boardId, listId : doc.listId, title: { $regex: new RegExp("^" + doc.title + "$", "i") }, archived: true}).fetch();
    _.each(archivedForms, (form, index) => {
      Cards.remove(form._id);
    });

    if(doc._parentId) {
      const oldCard = Cards.findOne(doc._parentId);
      if (userId) {
        Activities.insert({
          userId,
          activityType: 'copyCardClone',
          listId: doc.listId,
          cardId: doc._id,
          oldCardId: doc._parentId,
          oldListId: oldCard.listId,
        });

        Activities.insert({
          userId,
          activityType: 'copyCardOriginal',
          boardId: oldCard.boardId,
          listId: oldCard.listId,
          cardId: doc._parentId,
          newCardId: doc._id,
          newListId: doc.listId,
        });
      }
    } else {
      if (userId) {
        Activities.insert({
          userId,
          activityType: 'createCard',
          boardId: doc.boardId,
          listId: doc.listId,
          cardId: doc._id,
        });
      }
    }
  });

  // New activity for card (un)archivage
  Cards.after.update(function(userId, doc, fieldNames, modifier) {
    if (_.contains(fieldNames, 'archived')) {
      if (doc.archived) {
        Activities.insert({
          userId,
          activityType: 'archivedCard',
          boardId: doc.boardId,
          listId: doc.listId,
          cardId: doc._id,
        });
      } else {
        Activities.insert({
          userId,
          activityType: 'restoredCard',
          boardId: doc.boardId,
          listId: doc.listId,
          cardId: doc._id,
        });
      }
    }

    const oldCardTitle = this.previous.title;
    if (_.contains(fieldNames, 'title')) {
      Activities.insert({
        userId,
        oldCardTitle,
        activityType: 'renameCard',
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    }

    const oldCardDescription = this.previous.description || "no description";
    if (_.contains(fieldNames, 'description')) {
      Activities.insert({
        userId,
        oldCardDescription,
        activityType: 'updateDescriptionCard',
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    }

    // New activity for card moves
    const oldListId = this.previous.listId;
    if (_.contains(fieldNames, 'listId') && doc.listId !== oldListId) {
      Activities.insert({
        userId,
        oldListId,
        activityType: 'moveCard',
        listId: doc.listId,
        boardId: doc.boardId,
        cardId: doc._id,
      });

      // auto remove archived form with same title in current event
      const archivedForms = Cards.find({boardId: doc.boardId, listId : doc.listId, title: { $regex: new RegExp("^" + doc.title + "$", "i") }, archived: true}).fetch();
      _.each(archivedForms, (form, index) => {
        Cards.remove(form._id);
      });
    }

    if (_.contains(fieldNames, 'hidden') || _.contains(fieldNames, 'required') || _.contains(fieldNames, 'participate') || _.contains(fieldNames, 'anonymous') || _.contains(fieldNames, 'offline')) {
      Activities.insert({
        userId,
        activityType: 'updateCardProperties',
        boardId: doc.boardId,
        listId: doc.listId,
        cardId: doc._id,
      });
    }

    if (_.contains(fieldNames, 'sort')) {
      Activities.insert({
        userId,
        activityType: 'updateOrderCard',
        cardId: doc._id,
        boardId: doc.boardId,
        listId: doc.listId,
        sort: doc.sort,
      });
    }

    if (_.contains(fieldNames, 'selected_form_version_id')) {
      const versionName = _.find(doc.versions, (version) => {
        return doc.selected_form_version_id === version.id;
      }).name;
      Activities.insert({
        userId,
        activityType: 'updateDefaultVersion',
        cardId: doc._id,
        boardId: doc.boardId,
        listId: doc.listId,
        versionName,
      });
    }
  });

  // Add a new activity if we add or remove a member to the card
  Cards.before.update((userId, doc, fieldNames, modifier) => {
    if (_.contains(fieldNames, 'versions')) {
      if (modifier.$set.versions) {
        if (modifier.$set.versions.length !== doc.versions.length){
          Activities.insert({
            userId,
            activityType: 'addVersionCard',
            boardId: doc.boardId,
            listId: doc.listId,
            cardId: doc._id,
            versionName: modifier.$set.versions[modifier.$set.versions.length - 1].name,
          });
        } else {
          Activities.insert({
            userId,
            activityType: 'updateVersionCard',
            boardId: doc.boardId,
            listId: doc.listId,
            cardId: doc._id
          });
        }
      } else {
        if (modifier.$set.lastModifiedVersionStatus === 'archived')
          Activities.insert({
            userId,
            activityType: 'archiveVersionCard',
            boardId: doc.boardId,
            listId: doc.listId,
            cardId: doc._id,
            versionName: modifier.$set.lastModifiedVersionName,
          });
        else
          Activities.insert({
            userId,
            activityType: 'restoreVersionCard',
            boardId: doc.boardId,
            listId: doc.listId,
            cardId: doc._id,
            versionName: modifier.$set.lastModifiedVersionName,
          });
      }
    }

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
          cardId: doc._id,
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
        cardId: doc._id,
      });
    }

  });

  // Remove all activities associated with a card if we remove the card
  Cards.after.remove((userId, doc) => {
    Activities.remove({
      cardId: doc._id,
    });
  });
}
