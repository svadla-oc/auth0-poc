allowIsBoardAdmin = function(userId, board) {
	const user = Users.findOne(userId);
  return board && (board.hasAdmin(userId) || board.hasGroup(user.group) || board.hasGroup("public"));
};

allowIsBoardMember = function(userId, board) {
	const user = Users.findOne(userId);
  return board && (board.hasMember(userId) || board.hasGroup(user.group) || board.hasGroup("public"));
};

allowIsBoardMemberByCard = function(userId, card) {
  const board = card.board();
  return board && board.hasMember(userId);
};
