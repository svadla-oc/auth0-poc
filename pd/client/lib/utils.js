Utils = {
	// XXX We should remove these two methods
	goBoardId(_id) {
		const board = Boards.findOne(_id);
		return board && FlowRouter.go('board', {
			id: board._id,
			slug: board.slug,
		});
	},

	goListId(_id) {
		const list = Lists.findOne(_id);
		const board = Boards.findOne(list.boardId);
		return list && FlowRouter.go('list', {
			listId: list._id,
			boardId: board._id,
			slug: board.slug,
		});
	},

	goCardId(_id) {
		const card = Cards.findOne(_id);
		const board = Boards.findOne(card.boardId);
		return board && FlowRouter.go('card', {
			cardId: card._id,
			boardId: board._id,
			slug: board.slug,
		});
	},

	capitalize(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	windowResizeDep: new Tracker.Dependency(),

	// in fact, what we really care is screen size
	// large mobile device like iPad or android Pad has a big screen, it should also behave like a desktop
	// in a small window (even on desktop), Wekan run in compact mode.
	// we can easily debug with a small window of desktop broswer. :-)
	isMiniScreen() {
		this.windowResizeDep.depend();
		return $(window).width() <= 800;
	},

	// Determine the new sort index
	calculateIndex(prevCardDomElement, nextCardDomElement, nCards = 1) {
		let base, increment;
		// If we drop the card to an empty column
		if (!prevCardDomElement && !nextCardDomElement) {
			base = 0;
			increment = 1;
		// If we drop the card in the first position
		} else if (!prevCardDomElement) {
			base = Blaze.getData(nextCardDomElement).sort - 1;
			increment = -1;
		// If we drop the card in the last position
		} else if (!nextCardDomElement) {
			base = Blaze.getData(prevCardDomElement).sort + 1;
			increment = 1;
		}
		// In the general case take the average of the previous and next element
		// sort indexes.
		else {
			const prevSortIndex = Blaze.getData(prevCardDomElement).sort;
			const nextSortIndex = Blaze.getData(nextCardDomElement).sort;
			increment = (nextSortIndex - prevSortIndex) / (nCards + 1);
			base = prevSortIndex + increment;
		}
		// XXX Return a generator that yield values instead of a base with a
		// increment number.
		return {
			base,
			increment,
		};
	},

	showNotif(message, type) {
		let errorDom = $('.board-canvas');
		let parentErrorDom = $('.board-notif');
		Flash.profiles.default = {
			tag: 'div',
			closeButton: '',
			classes: ['js-dom-notif'],
			statePrefix: '',
			attributes: {}
		};
		Flash.switchProfile('default')
		switch(type) {
			case 'danger' :
				Flash.danger("notif", '<a href="#" class="close js-close-notif" style="float: left; padding: 0 5px;">&times</a>' + message, 0, true);
				break;
			case 'success' :
				Flash.success("notif", '<a href="#" class="close js-close-notif" style="float: left; padding: 0 5px;">&times</a>' + message, 0, true);
				break;
		}
		parentErrorDom.removeClass().addClass('board-notif '+type);
		errorDom.removeClass().addClass('board-canvas show-notif');
	},

  modifUrl(originUrl, linkExport) {
    let tmpOrigin, tmpModif, tmpCombine;
    if (linkExport) {
      tmpOrigin = originUrl.split('/api/');
      tmpModif = (window.location.href).split('/b/');
      tmpCombine = tmpModif[0] + '/api/' + tmpOrigin[1];
    } else {
      tmpOrigin = originUrl.split('/b/');
      tmpModif = (window.location.href).split('/b/');
      tmpCombine = tmpModif[0] + '/b/' + tmpOrigin[1];
    }
    return tmpCombine;
  },

  allowMoveOrCopy(card, listId, restore) {
  	// sorting
  	if (card.listId == listId)
  		return true;
    const newEvent = Lists.findOne(listId);
    const duplicate = Cards.find({listId : listId, title: { $regex: new RegExp("^" + card.title + "$", "i") }, archived: false}).fetch()[0];
    let allow = true;
    if (duplicate) {
      allow = false
      if (restore)
      	Utils.showNotif("<a href=" + duplicate.absoluteUrl() + " style='text-decoration: underline'>" + duplicate.title + "</a> is already part of <a href=" + newEvent.absoluteUrl() + " style='text-decoration: underline'>" + newEvent.title + "</a>. You can try to rename <a href=" + duplicate.absoluteUrl() + " style='text-decoration: underline'>" + duplicate.title + "</a> first before continue restoring form process.", 'danger');
      else
      	Utils.showNotif("<a href=" + duplicate.absoluteUrl() + " style='text-decoration: underline'>" + duplicate.title + "</a> is already part of <a href=" + newEvent.absoluteUrl() + " style='text-decoration: underline'>" + newEvent.title + "</a>. You can add a different form to <a href=" + newEvent.absoluteUrl() + " style='text-decoration: underline'>" + newEvent.title + "</a>, or add this form to another event.", 'danger');
    }
    return allow;
  },
	
  closeNotif() {
		if ($(document).find('.js-dom-notif').length !== 0) 
		{
			Flash.clear();
			Flash.clear();
		}
		$(document).find('.board-canvas').removeClass('show-notif');
		$(document).find('.board-notif').removeClass().addClass('board-notif hide');
	},

	modifUrl(originUrl, linkExport) {
		let tmpOrigin, tmpModif, tmpCombine;
		if (linkExport) {
			tmpOrigin = originUrl.split('/api/');
			tmpModif = (window.location.href).split('/b/');
			tmpCombine = tmpModif[0] + '/api/' + tmpOrigin[1];
		} else {
			tmpOrigin = originUrl.split('/b/');
			tmpModif = (window.location.href).split('/b/');
			tmpCombine = tmpModif[0] + '/b/' + tmpOrigin[1];
		}
		return tmpCombine;
	},

	addFieldArchive(oldForm, newForm) {
		// add field archived and compare it value between old and new form
		if (newForm){
			_.each(newForm.versions, (version) => {
	      version.archived = oldForm.isArchivedVersion(version.id);
	    });
	    return newForm;
		} else {
			// add field archived for new form
			_.each(oldForm.versions, (version) => {
	      version.archived = false;
	    });
	    return oldForm;
		}
	},

	archiveVersion(card, version) {
		const result = Cards.find({boardId: card.boardId, selected_form_version_id: version.id, title: { $regex: new RegExp("^" + card.title + "$", "i") }}); 
		const count = result.count();
		const cards = result.fetch();
		if (count > 0) {
			const list = Lists.findOne(cards[0].listId);
			let listForm = '';
			_.each(cards, (form, index) => {
				listForm += "<a href=" + form.absoluteUrl() + " style='text-decoration: underline'>" + form.title + "</a>";
				if (index !== (count - 1))
					listForm += ", "
			});
			Utils.showNotif("Version "+version.name+" is configured as a default form version for data entry in [" + listForm + "]. You can remove this version after your update these events.", 'danger');
		} else {
			const clones = Cards.find({boardId: card.boardId, title: { $regex: new RegExp("^" + card.title + "$", "i") }}).fetch(); 
			_.each(clones, (clone) => {
				clone.removeVersion(version.id);
			})
		}
	},

	parseHash(hash) {
		let object = {};

		if (~hash.indexOf('&state=') && ~hash.indexOf('&token_type=') && ~hash.indexOf('&id_token=') && ~hash.indexOf('&expires_in=') && ~hash.indexOf('#access_token=')) {
			let arrayHash = hash.split('&state=');
			object.state = arrayHash[1];
			arrayHash = arrayHash[0].split('&token_type=');
			object.tokenType = arrayHash[1];
			arrayHash = arrayHash[0].split('&id_token=');
			object.idToken = arrayHash[1];
			arrayHash = arrayHash[0].split('&expires_in=');
			object.expires = arrayHash[1];
			arrayHash = arrayHash[0].split('#access_token=');
			object.accessToken = arrayHash[1];
			return object;
		} else {
			return {
				idToken: undefined
			}
		}
	},

	autoLogin(userInfo) {
		Meteor.call('processAuthLogin', userInfo, function (err, user) {
			if (err) {
				FlowRouter.go('signIn');
			} else {
				Meteor.loginWithPassword(user.username, user.password);
			}
		});
	},

	ssoInterval() {
		let sso = false,

		start = function() {
			if (!this.isRunning()) {
				sso = Meteor.setInterval(function() {
					let authentication = new auth0.Authentication({
			      domain: localStorage.getItem('authDomain'),
			      clientID: localStorage.getItem('authId')
			    });
				  // if the token is not in local storage, there is nothing to check (i.e. the user is already logged out)
				  if (!localStorage.getItem('userToken')) return;

				  authentication.getSSOData(function (err, data) {
				    // if there is still a session, do nothing
				    if (err || (data && data.sso)) return;

				    // if we get here, it means there is no session on Auth0,
				    // then logout user
				    AccountsTemplates.logout();
				  });
				}, 5000)
			}	
		},

		isRunning = function() {
			return sso !== false;
		};

		return {
			sso: sso,
			start: start,
			isRunning: isRunning
		}
	}
};

// A simple tracker dependency that we invalidate every time the window is
// resized. This is used to reactively re-calculate the popup position in case
// of a window resize. This is the equivalent of a "Signal" in some other
// programming environments (eg, elm).
$(window).on('resize', () => Utils.windowResizeDep.changed());