Meteor.publish('user-miniprofile', function(userId) {
  check(userId, String);

  return Users.find(userId, {
    fields: {
      'username': 1,
      'profile.fullname': 1,
      'profile.avatarUrl': 1,
    },
  });
});

Meteor.publish('user-extra-group', function(userId) {
	check(userId, String);
	return Users.find(userId, {
		fields: {
      'username': 1,
      'profile': 1,
      'emails': 1,
			'group': 1
		}
	});
});

Meteor.publish('user-by-group', function(group) {
  check(group, String);
  return Users.find({'group': group}, {
    fields: {
      'username': 1,
      'profile': 1,
      'emails': 1,
      'group': 1,
    }
  })
});

