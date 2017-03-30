Meteor.publish('cardComments',() => {
  return CardComments.find();
});