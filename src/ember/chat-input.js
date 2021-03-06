var FFZ = window.FrankerFaceZ,
	utils = require("../utils"),
	constants = require("../constants"),

	is_android = navigator.userAgent.indexOf('Android') !== -1,

	MOD_COMMANDS = {
		ban: {
			label: '/ban &lt;user&gt; <i>[reason]</i>',
			info: 'Permanently Ban User'
		},
		unban: {
			label: '/unban &lt;user&gt;',
			info: 'Unban User'
		},
		timeout: {
			label: '/timeout &lt;user&gt; <i>[duration=600] [reason]</i>',
			info: 'Temporarily Ban User'
		},
		untimeout: {
			label: '/untimeout &lt;user&gt;',
			info: 'Unban Temporarily-Banned User'
		},

		clear: {info: 'Clear Chat for All Users'},
		slow: {
			label: '/slow <i>[duration=120]</i>',
			info: 'Enable Slow Mode'
		},
		slowoff: {info: 'Disable Slow Mode'},

		followers: {
			label: '/followers <i>[duration]</i>',
			info: 'Enable Followers-Only Mode'
		},
		followersoff: { info: 'Disable Followers-Only Mode'},

		r9kbeta: {info: 'Enable R9k Mode'},
		r9kbetaoff: {info: 'Disable R9k Mode'},

		subscribers: {info: 'Enable Subscribers-Only Mode'},
		subscribersoff: {info: 'Disable Subscribers-Only Mode'},

		emoteonly: {info: 'Enable Emote-Only Mode'},
		emoteonlyoff: {info: 'Disable Emote-Only Mode'},

		unpin: {info: 'Unpin the current Pinned Cheer'},
		reset: {info: 'Clear the current Top Cheer'}
	},

	BROADCASTER_COMMANDS = {
		mod: {
			label: '/mod &lt;user&gt;',
			info: 'Make User a Moderator'
		},
		unmod: {
			label: '/unmod &lt;user&gt;',
			info: 'Remove User\'s Moderator Status'
		},

		host: {
			label: '/host &lt;channel&gt;',
			info: 'Enter Host Mode with Channel'
		},

		unhost: {info: 'Exit Host Mode'},

		commercial: {
			label: '/commercial <i>[length]</i>',
			info: 'Trigger Commercial(s) for Length'
		}
	},

	DEFAULT_COMMANDS = {
		color: {
			label: '/color &lt;color&gt;',
			info: 'Set Username Color'
		},

		help: {
			label: '/help <i>[command]</i>',
			info: 'List Available Chat Commands'
		},

		me: {
			label: '/me &lt;message&gt;',
			info: 'Send a Colored Chat "Action"'
		},

		w: {
			label: '/w &lt;user&gt; &lt;message&gt;',
			info: 'Whisper to User'
		},

		disconnect: {info: 'Disconnect from Chat'},
		mods: {info: 'List Chat Moderators'},
	},

	CHARCODES = {
		AT_SIGN: 64,
		COLON: 58,
		PERIOD: 46,
		SLASH: 47
	},

	KEYCODES = {
		BACKSPACE: 8,
		TAB: 9,
		ENTER: 13,
		ESC: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		TWO: 50,
		COLON: 59,
		FAKE_COLON: 186
	},

	selection_start = function(e) {
		if ( typeof e.selectionStart === "number" )
			return e.selectionStart;

		if ( ! e.createTextRange )
			return -1;

		var n = document.selection.createRange(),
			r = e.createTextRange();

		r.moveToBookmark(n.getBookmark());
		r.moveStart("character", -e.value.length);
		return r.text.length;
	},

	move_selection = function(e, pos) {
		if ( e.setSelectionRange )
			e.setSelectionRange(pos, pos);
		else if ( e.createTextRange ) {
			var r = e.createTextRange();
			r.move("character", -e.value.length);
			r.move("character", pos);
			r.select();
		}
	},


	build_sort_key = function(item, now, is_whisper) {
		if ( item.type === 'emoticon' )
			return '2|' + (item.favorite ? 1 : 2) + '|' + item.sort + '|' + item.label;

		else if ( item.type === 'emoji' )
			return '3|' + (item.favorite ? 1 : 2) + '|' + item.label;

		return '4|' + item.label;
	};


// ---------------------
// Settings
// ---------------------

FFZ.settings_info.input_quick_reply = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Reply to Whispers with /r",
	help: "Automatically replace /r at the start of the line with the command to whisper to the person you've whispered with most recently."
};

FFZ.settings_info.input_mru = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Chat Input History",
	help: "Use the Up and Down arrows in chat to select previously sent chat messages."
};

FFZ.settings_info.input_complete_emotes = {
	type: "select",
	options: {
		0: "Disabled",
		1: "Channel and Sub Only",
		2: "All Emoticons"
	},

	value: 2,

	process_value: utils.process_int(2),

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Emoticons",
	help: "Use tab completion to complete emoticon names in chat.",

	on_update: function(val) {
		if ( this._inputv )
			Ember.propertyDidChange(this._inputv, 'ffz_emoticons');
	}
}


FFZ.settings_info.input_complete_keys = {
	type: "boolean",
	value: false,

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Alternate Input",
	help: "When this is enabled, Tab and Shift-Tab will cycle through possible values and Space will insert the value."
}


FFZ.settings_info.input_complete_commands = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Commands",
	help: "Use tab completion to complete commands in chat.",

	on_update: function(val) {
		if ( this._inputv )
			Ember.propertyDidChange(this._inputv, 'ffz_commands');
	}
}


FFZ.settings_info.input_complete_aliases = {
	type: "select",
	options: {
		0: "Disabled",
		1: "By Name or Alias",
		2: "Aliases Only"
	},

	value: 1,

	process_value: utils.process_int(1),

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete User Aliases",
	help: "Use tab completion to complete aliases you've given to users rather than their username.",

	on_update: function(val) {
		if ( this._inputv )
			Ember.propertyDidChange(this._inputv, 'ffz_name_suggestions');
	}
}


FFZ.settings_info.input_complete_name_at = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Usernames with At Sign",
	help: "When enabled, tab-completed usernames will have an @ sign before them if you typed one. This is default Twitch behavior, but unnecessary."
}


FFZ.settings_info.input_complete_name_require_at = {
	type: "boolean",
	value: false,

	no_bttv: true,

	category: "Chat Input",
	name: "Tab-Complete Usernames Require At Sign",
	help: "When enabled, tab-completion will only suggest usernames if triggered with an @ sign."
}


FFZ.settings_info.input_emoticons_case_sensitive = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Emoticons Case Sensitive",
	help: "When enabled, tab-completion for emoticons is case sensitive."
}


FFZ.settings_info.input_complete_without_prefix = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	no_bttv: true,

	name: "Tab-Complete Sub Emotes without Prefix",
	help: "Allow you to tab complete a sub emote without including its prefix. Example: Battery into chrisBattery",

	on_update: function(val) {
		if ( this._inputv )
			Ember.propertyDidChange(this._inputv, 'ffz_emoticons');
	}
}


FFZ.settings_info.input_emoji = {
	type: "boolean",
	value: true,

	category: "Chat Input",
	//visible: false,
	no_bttv: true,

	name: "Enter Emoji By Name",
	help: "Replace emoji that you type by name with the character. :+1: becomes 👍."
};


// ---------------------
// Initialization
// ---------------------

FFZ.prototype.setup_chat_input = function() {
	this.log("Hooking the Ember Chat Input component.");
	this.update_views("component:chat/twitch-chat-input", this.modify_chat_input);
}


FFZ.prototype.modify_chat_input = function(component) {
	var f = this,
		ConvoInput = utils.ember_resolve('component:twitch-conversations/conversation-input');

	utils.ember_reopen_view(component, {
		ffz_mru_index: -1,
		ffz_current_suggestion: 0,
		ffz_partial_word: '',
		ffz_partial_word_start: -1,
		ffz_suggestions_visible: false,
		ffz_freeze_suggestions: -1,
		ffz_suggestions_el: null,
		ffz_name_suggestions: [],
		ffz_chatters: [],

		ffz_init: function() {
			// We don't want to store references to conversation input handlers.
			if ( ! ConvoInput || ! (this.parentView instanceof ConvoInput) )
				f._inputv = this;

			var s = this._ffz_minimal_style = document.createElement('style');
			s.id = 'ffz-minimal-chat-textarea-height';
			document.head.appendChild(s);

			this.set('ffz_name_suggestions', this.get('suggestions'));

			// Redo our key bindings.
			var t = this.$("textarea");

			if ( ! t || ! t.length )
				f.error("Cannot find textarea in Twitch Chat Input.");

			if ( ! this.has_bttv ) {
				t.off("keydown");
				t.off("keyup");
				t.on("keypress", this._ffzKeyPress.bind(this));
				t.on("keydown", this._ffzKeyDown.bind(this));
			}

			t.on("paste", this._ffzPaste.bind(this));

			t.attr('rows', 1);

			this.ffzResizeInput();
			setTimeout(this.ffzResizeInput.bind(this), 500);
		},

		ffz_destroy: function() {
			if ( f._inputv === this )
				f._inputv = undefined;

			this.ffzResizeInput();

			if ( this._ffz_minimal_style ) {
				this._ffz_minimal_style.parentElement.removeChild(this._ffz_minimal_style);
				this._ffz_minimal_style = undefined;
			}

			// Reset normal key bindings.
			var t = this.$("textarea");

			t.attr('rows', undefined);

			t.off("keyup");
			t.off("keydown");
			t.off("keypress");
			t.off("paste");

			t.on("keyup", this._onKeyUp.bind(this));
			t.on("keydown", this._onKeyDown.bind(this));
		},

		// Pasting~!
		_ffzPaste: function(event) {
			var data = (event.clipboardData || (event.originalEvent && event.originalEvent.clipboardData) || window.clipboardData),
				text = data && data.getData('text/plain');

			// If we don't have a colon, there can't be any emoji.
			// Likewise, if the user doesn't want input emoji, don't convert them.
			if ( ! f.settings.input_emoji || text.indexOf(':') === -1 )
				return;

			// Alright, check for emoji now.
			var output = [],
				input = text.split(':'),
				last_was_emoji = false;

			output.push(input.shift());
			for(var i=0, l = input.length - 1; i < l; i++) {
				var segment = input[i],
					emoji = ! last_was_emoji ? f.emoji_data[f.emoji_names[segment]] : null;

				if ( emoji ) {
					output.push(emoji.raw);
					last_was_emoji = true;
				} else {
					output.push((last_was_emoji ? '' : ':') + segment);
					last_was_emoji = false;
				}
			}

			output = output.join("") + (last_was_emoji ? '' : ':') + input[input.length-1];

			// Let the browser's paste be do as it do if there weren't any emoji.
			if ( output.length === text.length )
				return;

			// Can we get the selection in our input box?
			var input = this.get('chatTextArea'),
				s_val = input && input.value,
				s_start = input && input.selectionStart,
				s_end = input && input.selectionEnd;

			if ( ! input || typeof s_start !== "number" || typeof s_end !== "number" )
				return;

			// Still here? We're clear to inject this ourselves then.
			event.stopPropagation();
			event.preventDefault();

			input.value = s_val.substr(0, s_start) + output + s_val.substr(s_end);
			move_selection(input, s_start + output.length);
		},


		// Suggestions

		ffzBuildSuggestionItem: function(i, item) {
			// Returns a new element for the suggestions list.
			if ( ! item )
				return null;

			var t = this,
				el = utils.createElement('div', 'suggestion'),
				inner = utils.createElement('div'),
				width = item.width ? (246 - item.width) + 'px' : null;

			el.setAttribute('data-id', i);
			el.classList.toggle('ffz-favorite', item.favorite || false);

			if ( item.image ) {
				el.classList.add('has-image');
				el.classList.toggle('is-emoji', item.type === 'emoji');
				el.style.backgroundImage = 'url("' + utils.quote_attr(item.image) + '")';
			}

			inner.innerHTML = item.label;
			if ( width )
				inner.style.maxWidth = width;
			el.appendChild(inner);

			if ( f.settings.input_complete_emotes && item.info ) {
				var info = utils.createElement('span');
				info.innerHTML = item.info;
				el.classList.add('has-info');
				if ( width )
					info.style.maxWidth = width;
				el.appendChild(info);
			}

			el.addEventListener('mouseenter', function() {
				if ( t.get('ffz_freeze_suggestions') === -1 ) {
					var els = el.parentElement.querySelectorAll('.suggestion'),
						middle = els[Math.floor(els.length / 2)];
					t.set('ffz_freeze_suggestions', middle ? parseInt(middle.getAttribute('data-id')) : i)
				}

				t.set('ffz_current_suggestion', i);
			});

			el.addEventListener('mouseup', function() {
				t.ffzCompleteSuggestion(item);
			});

			el.addEventListener('wheel', function(e) {
				// We want to scroll the list up or down. Harder than it sounds. In order
				// to scroll it well, we should use the center item, not the one under
				// the mouse.
				var suggestions = t.get('ffz_sorted_suggestions'),
					first_el = el.parentElement.querySelector('.suggestion:first-of-type'),
					first = first_el && parseInt(first_el.getAttribute('data-id'));

				first += event.deltaY > 0 ? 1 : -1;

				t.set('ffz_freeze_suggestions', -1);
				t.set('ffz_current_suggestion', Math.min(first + 2, suggestions.length - 1));
			});

			return el;
		},


		ffzUpdateSuggestions: function() {
			var visible = this.get('ffz_suggestions_visible');
			if ( visible ) {
				if ( this.get('ffz_updating') )
					return;

				this.set('ffz_updating', true);

				var el = this.ffz_suggestions_el,
					current = this.get('ffz_current_suggestion') || 0;

				if ( ! el ) {
					el = this.ffz_suggestions_el = utils.createElement('div', 'suggestions ffz-suggestions');
					this.get('element').appendChild(el);

				} else
					el.innerHTML = '';

				var suggestions = this.get('ffz_sorted_suggestions'),
					freeze = this.get('ffz_freeze_suggestions'),
					middle = freeze === -1 ? current : freeze,

					first = Math.max(0, middle - 2),
					last = Math.min(suggestions.length, first + 5),
					added = false;

				first = Math.min(first, Math.max(0, last - 5));

				if ( current >= suggestions.length ) {
					this.set('ffz_current_suggestion', first);
					current = first;
				}

				for(var i=first; i < last; i++) {
					var item = suggestions[i],
						item_el = this.ffzBuildSuggestionItem(i, item);

					if ( i === current )
						item_el.classList.add('highlighted');

					if ( item_el ) {
						el.appendChild(item_el);
						added = true;
					}
				}

				if ( ! added ) {
					var item_el = utils.createElement('div', 'suggestion disabled');
					item_el.textContent = 'No matches.';
					el.appendChild(item_el);
				}

				this.set('ffz_updating', false);

			} else if ( this.ffz_suggestions_el ) {
				jQuery(this.ffz_suggestions_el).remove();
				this.ffz_suggestions_el = null;
			}

		}.observes('ffz_suggestions_visible', 'ffz_sorted_suggestions', 'ffz_current_suggestion'),


		ffzHideSuggestions: function() {
			this.set('ffz_suggestions_visible', false);
			this.set('ffz_freeze_suggestions', -1);
			this.set('ffz_current_suggestion', 0);
		},


		ffzShowSuggestions: function() {
			this.set('ffz_current_suggestion', 0);
			this.ffzFetchNameSuggestions();
			this.set('ffz_freeze_suggestions', -1);
			this.set('ffz_suggestions_visible', true);
			this.ffzSetPartialWord();
		},


		ffzSetPartialWord: function() {
			var area = this.get('chatTextArea');
			if ( area && this.get('ffz_suggestions_visible') ) {
				var text = this.get('messageText'),
					ind = selection_start(area);

				if ( ind === -1 )
					return this.ffzHideSuggestions();

				var start = text.lastIndexOf(' ', ind - 1) + 1;
				this.set('ffz_partial_word_start', start);

				var match = text.substr(start).match(/^[^ ]*/);
				if ( match && match[0] )
					this.set('ffz_partial_word', match[0]);
				else if ( text.charAt(0) === '/' && text.charAt(1) !== ' ' && start === (text.indexOf(' ') + 1) )
					// Assume the first word after a command is a username.
					this.set('ffz_partial_word', '@');
				else
					this.ffzHideSuggestions();
			}
		}.observes('messageText'),


		ffzFetchNameSuggestions: function() {
			if ( ! this.get('ffz_suggestions_visible') )
				this.set('ffz_name_suggestions', this.get('suggestions')() || []);
		}.observes('suggestions'),


		ffzCompleteSuggestion: function(item, add_space) {
			if ( ! item ) {
				var suggestions = this.get('ffz_sorted_suggestions'),
					current = this.get('ffz_current_suggestion');

				item = suggestions && suggestions[current];
			}

			this.ffzHideSuggestions();

			var t = this,
				ind = this.get('ffz_partial_word_start'),
				text = this.get('messageText'),

				first_char = text.charAt(0),
				is_cmd = (first_char === '/' || first_char === '.') && text.substr(1,3).toLowerCase() !== 'me ',

				trail, prefix;

			if ( item ) {
				var content = ((f.settings.input_complete_name_at && ! is_cmd && item.type === 'user' && this.get('ffz_partial_word').charAt(0) === '@') ? '@' : '') +
						((item.command_content && is_cmd ?
							item.command_content : item.content) || item.label);

				prefix = text.substr(0, ind) + content;
				trail =  text.substr(ind + this.get('ffz_partial_word').length);
			} else {
				var area = this.get('chatTextArea'),
					ind = selection_start(area);

				prefix = text.substr(0, ind);
				trail = text.substr(ind);
			}

			prefix += !add_space && trail ? '' : ' ';

			this.set('messageText', prefix + trail);
			this.set('ffz_partial_word', '');
			this.set('ffz_partial_word_start', -1);
			if ( item )
				this.trackSuggestionsCompleted();
			Ember.run.next(function() {
				var area = t.get('chatTextArea');
				move_selection(area, prefix.length);
				area.focus();

				/*var text = t.get('messageText'),
					ind = text.indexOf(' '),
					start = ind !== -1 && text.substr(0, ind);

				if ( (prefix.length-1) === ind && f.settings.input_complete_commands && (start.charAt(0) === '/' || start.charAt(0) === '.') ) {
					var commands = t.get('ffz_commands'),
						cmd = commands[start.substr(1)];

					if ( cmd && cmd.label && cmd.label.split(' ',2)[1] === '&lt;user&gt;' ) {
						t.ffzFetchNameSuggestions();
						t.set("ffz_suggestions_visible", true);
						t.ffzSetPartialWord();
					}
				}*/
			});
		},


		ffz_commands: function() {
			var commands = _.extend({}, DEFAULT_COMMANDS),
				in_conversation = ConvoInput && this.parentView instanceof ConvoInput,
				room = this.get('parentView.room'),
				ffz_room = room && f.rooms[room.get('id')],
				is_moderator = room && room.get('isModeratorOrHigher'),
				user = f.get_user(),
				is_broadcaster = room && user && user.login === room.get('name');

			if ( in_conversation )
				return {};

			if ( is_moderator )
				commands = _.extend(commands, MOD_COMMANDS);

			if ( is_broadcaster)
				commands = _.extend(commands, BROADCASTER_COMMANDS);

			// FFZ Commands

			for(var cmd in FFZ.chat_commands) {
				var data = FFZ.chat_commands[cmd];
				if ( commands[cmd] || ! data || data.short )
					continue;

				var enabled = data.hasOwnProperty('enabled') ? data.enabled : true;
				if ( typeof enabled === "function" )
					try {
						enabled = data.enabled.call(f, ffz_room, [])
					} catch(err) {
						f.error('command "' + cmd + '" enabled', err);
						enabled = false;
					}

				if ( ! enabled )
					continue;

				commands[cmd] = {
					label: data.label,
					info: data.info,
					alias: false
				}
			}


			// Aliases
			for(var cmd in f._command_aliases) {
				var data = f._command_aliases[cmd],
					replacement = data[0],
					label = data[1];

				if ( ! label ) {
					var vars = utils.extract_cmd_variables(replacement, true);
					label = vars.join(' ');
				} else
					label = utils.sanitize(label);

				commands[cmd] = {
					label: '/' + cmd + (label ? ' ' + label : ''),
					info: replacement,
					alias: true
				}
			}

			return commands;

		}.property('parentView.room.isModeratorOrHigher', 'parentView.room.name'),


		ffz_emoticons: function() {
			var emotes = [],
				used_ids = [],

				in_conversation = ConvoInput && this.parentView instanceof ConvoInput,
				room = ! in_conversation && this.get('parentView.room'),
				room_id = room && room.get('id'),
				user_emotes = utils.ember_lookup('service:user-emotes'),

				set_data, set_name, replacement, url, is_inventory, is_sub_set, fav_list,
				emote_set, emote, emote_id, code, sort_factor, is_fav,
				prefix_length, per_pref,

				user = f.get_user(),
				ffz_sets = f.getEmotes(user && user.login, room_id),

				setting = f.settings.input_complete_emotes;

			if ( ! setting )
				return {};


			if ( user_emotes ) {
				var es = user_emotes.allEmotes;
				if ( es && es.emoticon_sets ) {
					for(var set_id in es.emoticon_sets) {
						emote_set = es.emoticon_sets[set_id];
						is_inventory = f._twitch_inventory_sets.indexOf(set_id) !== -1;
						fav_list = f.settings.favorite_emotes['twitch-' + (is_inventory ? 'inventory' : set_id)] || [];
						is_sub_set = false;
						set_data = !is_inventory && f.get_twitch_set(set_id);
						set_name = set_data && set_data.c_name;
						if ( ! emote_set )
							continue;

						if ( is_inventory )
							set_name = 'Twitch Inventory';

						else if ( set_name ) {
							if ( set_name === '--global--' )
								set_name = 'Twitch Global';
							else if ( set_name === '--twitch-turbo--' || set_name === 'turbo' || set_name === '--turbo-faces--' )
								set_name = 'Twitch Turbo';
							else if ( set_name === '--prime--' || set_name === '--prime-faces--' )
								set_name = 'Twitch Prime';
							else {
								set_name = 'Channel: ' + FFZ.get_capitalization(set_name);
								is_sub_set = true;
							}

						} else
							set_name = "Unknown Source";

						if ( setting === 1 && ! is_sub_set )
							continue;

						prefix_length = f.settings.input_complete_without_prefix && is_sub_set ? utils.find_common_prefix(_.pluck(emote_set, 'code'), true) : 0;
						sort_factor = is_sub_set ? 1 : is_inventory ? 8 : 9;

						for(var i = 0; i < emote_set.length; i++) {
							emote = emote_set[i];
							if ( used_ids.indexOf(emote.id) !== -1 )
								continue;

							code = emote && emote.code;
							code = code && (constants.KNOWN_CODES[code] || code);
							replacement = f.settings.replace_bad_emotes && constants.EMOTE_REPLACEMENTS[emote.id];
							url = replacement ?
								(constants.EMOTE_REPLACEMENT_BASE + replacement) :
								(constants.TWITCH_BASE + emote.id + "/1.0");

							is_fav = fav_list.indexOf(emote.id) !== -1;

							emotes.push({
								type: 'emoticon',
								label: code,
								info: set_name,
								sort: sort_factor,
								image: url,
								width: null,
								favorite: is_fav
							});

							used_ids.push(emote.id);

							if ( prefix_length !== 0 ) {
								// We have a common prefix, so make sure this emote is longer
								// than the prefix length, and add it.
								var unprefixed = code.substr(prefix_length);
								if ( unprefixed )
									emotes.push({
										type: 'emoticon',
										label: '<i>' + code.substr(0, prefix_length) + '</i>' + unprefixed,
										match: unprefixed,
										content: code,
										info: set_name,
										sort: sort_factor,
										image: url,
										width: null,
										favorite: is_fav
									});
							}
						}
					}
				}
			}

			used_ids = [];

			for(var i=0; i < ffz_sets.length; i++) {
				emote_set = f.emote_sets[ffz_sets[i]];
				if ( ! emote_set )
					continue;

				if ( setting === 1 && f.default_sets.indexOf(emote_set.id) !== -1 )
					continue;

				set_name = (emote_set.source || "FFZ") + " " + (emote_set.title || "Global");
				fav_list = f.settings.favorite_emotes[emote_set.hasOwnProperty('source_ext') ? 'ffz-ext-' + emote_set.source_ext + '-' + emote_set.source_id : 'ffz-' + emote_set.id] || [];

				prefix_length = emote_set.prefix_length || 0;

				if ( prefix_length === 0 && emote_set.has_prefix )
					prefix_length = utils.find_common_prefix(_.pluck(emote_set.emoticons, 'name'), emote_set.has_prefix !== 2);

				sort_factor = emote_set._type === 1 ? 3 : f.default_sets.indexOf(emote_set.id) === -1 ? 2 : 6;

				for(emote_id in emote_set.emoticons) {
					emote = emote_set.emoticons[emote_id];
					if ( emote.hidden || ! emote.name || used_ids.indexOf(emote_id) !== -1 )
						continue;

					is_fav = fav_list.indexOf(emote.id) !== -1;

					emotes.push({
						type: "emoticon",
						label: emote.name,
						info: set_name,
						sort: sort_factor,
						image: emote.urls[1],
						width: emote.width,
						favorite: is_fav
					});

					per_pref = emote.hasOwnProperty('prefix_length') ? emote.prefix_length : prefix_length;

					if ( per_pref !== 0 ) {
						// We have a common prefix, so make sure this emote is longer
						// than the prefix length, and add it.
						var unprefixed = emote.name.substr(per_pref);
						if ( unprefixed )
							emotes.push({
								type: "emoticon",
								label: '<i>' + emote.name.substr(0, per_pref) + '</i>' + unprefixed,
								match: unprefixed,
								content: emote.name,
								info: set_name,
								sort: sort_factor,
								image: emote.urls[1],
								width: emote.width,
								favorite: is_fav
							});
					}
				}
			}

			return emotes;
		}.property(),

		_setPartialName: function() {
			if ( f.has_bttv )
				return this._super();
		}.observes('messageText'),

		ffz_suggestions: function() {
			var output = [],
				emotes = this.get('ffz_emoticons'),
				commands = this.get('ffz_commands'),
				suggestions = this.get('ffz_name_suggestions'); //.mapBy('id').uniq();

			if ( f.settings.input_complete_commands ) {
				// Include Commands
				for(var command_name in commands) {
					var cmd = '/' + command_name,
						data = commands[command_name];

					output.push({
						type: "command",
						match: cmd,
						alternate_match: command_name.toLowerCase(),
						content: data.content || cmd,
						label: data.label || cmd,
						info: data.alias ? 'Alias: ' + data.info : 'Command' + (data.info ? ': ' + data.info : '')
					});
				}
			}

			if ( f.settings.input_complete_emotes ) {
				// Include Emoticons
				for(var i=0; i < emotes.length; i++)
					output.push(emotes[i]);
					/*var emote = emotes[i],
						sort_factor = 9,
						label = emote[1] === emote_name ?
							emote[1] :
							('<i>' + emote[1].substr(0, emote[1].length - emote_name.length) + '</i>' + emote_name);

					if ( emote[2] ) {
						if ( emote[3] )
							sort_factor = 1;

					} else {
						var set_data = f.emote_sets[emote[3]];
						if ( set_data )
							if ( set_data._type === 1 )
								sort_factor = 3;
							else
								sort_factor = ffz.default_sets.indexOf(set_data.id) === -1 ? 2 : 6;
					}

					output.push({
						type: "emoticon",
						match: emote_name,
						sort: sort_factor,
						content: emote[1],
						label: label,
						info: emote[4],
						image: emote[5],
						width: emote[6],
						favorite: emote[7] || false
					});
				}*/


				if ( f.settings.parse_emoji ) {
					// Include Emoji
					var setting = f.settings.parse_emoji,
						fav_list = f.settings.favorite_emotes['emoji'] || [];

					for(var short_name in f.emoji_names) {
						var eid = f.emoji_names[short_name],
							emoji = f.emoji_data[eid];

						if ( ! emoji || !(setting === 3 ? emoji.one : (setting === 2 ? emoji.noto : emoji.tw)) )
							continue;

						var sn = ':' + short_name + ':',
							src = (f.settings.parse_emoji === 3 ? emoji.one_src : (f.settings.parse_emoji === 2 ? emoji.noto_src : emoji.tw_src));

						output.push({
							type: "emoji",
							match: ':' + short_name + ':',
							content: emoji.raw,
							label: emoji.name,
							info: sn,
							image: src,
							width: 18,
							favorite: fav_list.indexOf(emoji.raw) !== -1
						});
					}
				}
			}


			// Always include Users
			var user_output = {},
				alias_setting = f.settings.input_complete_aliases;

			for(var i=0; i < suggestions.length; i++) {
				var suggestion = suggestions[i],
					name = suggestion.id,
					display_name = suggestion.displayName,
					username_match;

				if ( name === undefined ) {
					var dnt = display_name && display_name.trim();
					if ( dnt && /^[a-z0-9_]+$/i.test(dnt) )
						name = dnt.toLowerCase();
					else
						continue;
				}

				if ( ! display_name ) {
					display_name = name.capitalize();
					username_match = true;
				} else
					username_match = display_name.trim().toLowerCase() === name;

				var alias = f.aliases[name];

				if ( user_output[name] && ! user_output[name].is_alias ) {
					var token = user_output[name];
					token.whispered |= suggestion.whispered;
					if ( suggestion.timestamp > token.timestamp )
						token.timestamp = suggestion.timestamp;
				}

				if ( user_output[display_name] && ! user_output[display_name].is_alias ) {
					var token = user_output[display_name];
					token.whispered |= suggestion.whispered;
					if ( suggestion.timestamp > token.timestamp )
						token.timestamp = suggestion.timestamp;

				} else {
					if ( alias_setting !== 2 ) {
						output.push(user_output[display_name] = {
							type: "user",
							command_content: name,
							label: display_name,
							alternate_match: username_match ? null : name,
							whispered: suggestion.whispered,
							timestamp: suggestion.timestamp || new Date(0),
							info: 'User' + (username_match ? '' : ' (' + name + ')'),
							is_display_name: ! username_match,
							is_alias: false
						});

						if ( ! username_match )
							output.push(user_output[name] = {
								type: "user",
								label: name,
								alternate_match: display_name,
								whispered: suggestion.whispered,
								timestamp: suggestion.timestamp || new Date(0),
								info: 'User (' + display_name + ')',
								is_alias: false
							});
					}

					if ( alias && alias_setting ) {
						if ( user_output[alias] && user_output[alias].is_alias ) {
							var token = user_output[alias];
							token.whispered |= suggestion.whispered;
							token.timestamp = Math.max(token.timestamp, suggestion.timestamp);

						} else if ( ! user_output[alias] )
							output.push(user_output[alias] = {
								type: "user",
								command_content: name,
								label: alias,
								whispered: suggestion.whispered,
								timestamp: suggestion.timestamp || new Date(0),
								info: 'User Alias (' + name + ')',
								is_alias: true
							});
					}
				}
			}

			return output;

		}.property('ffz_emoticons', 'ffz_name_suggestions'),


		ffz_filtered_suggestions: Ember.computed("ffz_suggestions", "ffz_partial_word", "ffz_partial_word_start", function() {
			var suggestions = this.get('ffz_suggestions'),
				partial = this.get('ffz_partial_word'),
				word_start = this.get('ffz_partial_word_start'),
				part2 = partial.substr(1),
				char = partial.charAt(0),
				is_at = char === '@',
				is_command = char === '.' || char === '/';

			return suggestions.filter(function(item) {
				var name = item.match || item.content || item.label,
					type = item.type;

				if ( ! name )
					return false;

				if ( type === 'command' ) {
					if ( word_start > 0 )
						return false;

					if ( is_command )
						return item.alternate_match.indexOf(part2.toLowerCase()) === 0;

					return name.toLowerCase().indexOf(partial.toLowerCase()) === 0;
				}

				if ( type === 'user' ) {
					// Names are case insensitive, and we have to ignore the leading @ of our
					// partial word when matching.
					if ( ! is_at && f.settings.input_complete_name_require_at )
						return false;

					name = name.toLowerCase();
					var part = (is_at ? part2 : partial).toLowerCase(),
						alt_name = item.alternate_match;

					return name.indexOf(part) === 0 || (alt_name && alt_name.indexOf(part) === 0);

				} else if ( type === 'emoji' || ! f.settings.input_emoticons_case_sensitive ) {
					name = name.toLowerCase();
					return name.indexOf(partial.toLowerCase()) === 0;
				}

				return name.indexOf(partial) === 0;
			});
		}),


		ffz_sorted_suggestions: Ember.computed("ffz_filtered_suggestions.[]", function() {
			var text = this.get('messageText'),
				now = Date.now(),
				char = text.charAt(0),
				is_command = char === '/' || char === '.',
				is_whisper = is_command && text.substr(1, 2) === 'w ';

			return this.get('ffz_filtered_suggestions').sort(function(a, b) {
				// First off, sort users ahead of everything else.
				if ( a.type === 'user' ) {
					if ( b.type !== 'user' )
						return -1;

					else if ( is_whisper ) {
						if ( a.whisper && ! b.whisper )
							return -1;
						else if ( ! a.whisper && b.whisper )
							return 1;
					}

					if ( a.is_display_name && ! b.is_display_name )
						return -1;
					else if ( ! a.is_display_name && b.is_display_name )
						return 1;

					if ( a.timestamp > b.timestamp ) return -1;
					else if ( a.timestamp < b.timestamp ) return 1;

					var an = a.label.toLowerCase(),
						bn = b.label.toLowerCase();

					if ( an < bn ) return -1;
					else if ( an > bn ) return 1;
					return 0;

				} else if ( b.type === 'user' )
					return 1;

				var an = build_sort_key(a, now, is_whisper),
					bn = build_sort_key(b, now, is_whisper);

				if ( an < bn ) return -1;
				if ( an > bn ) return 1;
				return 0;
			});
		}),

		// Input Control

		ffzOnInput: function() {
			if ( ! f._chat_style || f.settings.minimal_chat < 2 || is_android )
				return;

			var now = Date.now(),
				since = now - (this._ffz_last_resize || 0);

			if ( since > 500 )
				this.ffzResizeInput();

		}.observes('messageText'),

		ffzResizeInput: function() {
			this._ffz_last_resize = Date.now();

			var el = this.get('element'),
				t = el && el.querySelector('textarea');

			if ( ! t || ! f._chat_style || f.settings.minimal_chat < 2 )
				return;

			// Unfortunately, we need to change this with CSS.
			this._ffz_minimal_style.innerHTML = 'body.ffz-minimal-chat-input .ember-chat .chat-interface .textarea-contain textarea { height: auto !important; }';
			var height = Math.max(32, Math.min(128, t.scrollHeight));
			this._ffz_minimal_style.innerHTML = 'body.ffz-minimal-chat-input .ember-chat .chat-interface .textarea-contain textarea { height: ' + height + 'px !important; }';

			if ( height !== this._ffz_last_height ) {
				utils.update_css(f._chat_style, "input_height", 'body.ffz-minimal-chat-input .ember-chat .chat-interface { height: ' + height + 'px !important; }' +
					'body.ffz-minimal-chat-input .ember-chat .chat-messages, body.ffz-minimal-chat-input .ember-chat .chat-interface .emoticon-selector { bottom: ' + height + 'px !important; }');
				f._roomv && f._roomv.get('stuckToBottom') && f._roomv._scrollToBottom();
			}

			this._ffz_last_height = height;
		},

		hideSuggestions: Ember.on("document.mouseup", function(event) {
			var target = event.target,
				cl = target.classList;

			if ( f.has_bttv )
				this._super();

			if ( ! this.get('ffz_suggestions_visible') || cl.contains('suggestion') || cl.contains('suggestions') || target === this.get('chatTextArea') )
				return;

			this.ffzHideSuggestions();
		}),


		_ffzKeyPress: function(event) {
			var t = this,
				e = event || window.event,
				key = e.charCode || e.keyCode;

			switch(key) {
				case CHARCODES.AT_SIGN:
					// If we get an @, show the menu. But only if we're at a new word
					// boundary, or the start of the line.
					if ( ! this.get('ffz_suggestions_visible') ) {
						var ind = selection_start(this.get('chatTextArea')) - 1;
						Ember.run.next(function() {
							if ( ind < 0 || t.get('messageText').charAt(ind) === ' ' ) {
								t.ffzShowSuggestions();
								t.trackSuggestions("@");
							}
						});
					}

					break;

				case CHARCODES.PERIOD:
				case CHARCODES.SLASH:
					// If we get a command, show the menu, but only if we're at the start of a line.
					if ( ! this.get('ffz_suggestions_visible') && f.settings.input_complete_commands && !(ConvoInput && this.parentView instanceof ConvoInput) ) {
						var ind = selection_start(this.get('chatTextArea')) - 1;
						Ember.run.next(function() {
							if ( ind === -1 )
								t.ffzShowSuggestions();
						});
					}

					break;

				case CHARCODES.COLON:
					if ( f.settings.input_emoji ) {
						var textarea = this.get('chatTextArea'),
							ind = selection_start(textarea);

						ind > 0 && Ember.run.next(function() {
							var text = t.get('messageText'),
								emoji_start = text.lastIndexOf(':', ind - 1);

							if ( emoji_start !== -1 && ind !== -1 && text.charAt(ind) === ':' ) {
								var match = text.substr(emoji_start + 1, ind - emoji_start - 1),
									emoji_id = f.emoji_names[match],
									emoji = f.emoji_data[emoji_id];

								if ( emoji ) {
									var prefix = text.substr(0, emoji_start) + emoji.raw;
									t.ffzHideSuggestions();
									t.set('messageText', prefix + text.substr(ind + 1));
									Ember.run.next(function() {
										move_selection(t.get('chatTextArea'), prefix.length);
									});
								}
							}
						})
					}
			}
		},


		_ffzKeyDown: function(event) {
			var t = this,
				e = event || window.event,
				key = e.charCode || e.keyCode;

			switch(key) {
				case KEYCODES.ESC:
					if ( this.get('ffz_suggestions_visible') ) {
						this.ffzHideSuggestions();
						e.preventDefault();
					}

					break;


				case KEYCODES.BACKSPACE:
					if ( this.get('ffz_suggestions_visible') && (this.get('ffz_partial_word').length === 1 || selection_start(this.get('chatTextArea')) === 0) )
						this.ffzHideSuggestions();

					break;


				case KEYCODES.TAB:
					// If we do Ctrl-Tab or Alt-Tab. Just don't
					// even think of doing suggestions.
					if ( e.ctrlKey || e.altKey || e.metaKey )
						break;

					e.preventDefault();

					var text = this.get('messageText');
					if ( text.length === 0 )
						break;

					if ( text.charAt(0) !== '/' || f.settings.input_complete_name_require_at ) {
						var ind = selection_start(this.get('chatTextArea')),
							part = text.substr(ind > 0 ? ind - 1 : 0),
							match = /^[^ ]+/.exec(part);

						if ( ! match || match[0].length === 0 )
							break;
					}

					// If suggestions aren't visible... show them. And set that we
					// triggered the suggestions with tab.
					if ( ! this.get('ffz_suggestions_visible') ) {
						this.ffzFetchNameSuggestions();
						this.set('ffz_suggestions_visible', true);
						this.ffzSetPartialWord();
						this.trackSuggestions("Tab");

					// If suggestions are visible, tab through the possibilities.
					} else if ( f.settings.input_complete_keys ) {
						var suggestions = this.get('ffz_sorted_suggestions'),
							current = this.get('ffz_current_suggestion') + ((e.shiftKey || e.shiftLeft) ? -1 : 1);

						if ( current < 0 )
							current = suggestions.length - 1;
						else if ( current >= suggestions.length )
							current = 0;

						this.set('ffz_freeze_suggestions', -1);
						this.set('ffz_current_suggestion', current);

					// Otherwise, complete the suggestion.
					} else
						this.ffzCompleteSuggestion();

					break;


				case KEYCODES.PAGE_UP:
				case KEYCODES.PAGE_DOWN:
					// Navigate through suggestions if those are open.
					if ( this.get('ffz_suggestions_visible') && !( e.shiftKey || e.shiftLeft || e.ctrlKey || e.metaKey ) ) {
						var suggestions = this.get('ffz_sorted_suggestions'),
							current = this.get('ffz_current_suggestion') + (key === KEYCODES.PAGE_UP ? -5 : 5);

						if ( current < 0 )
							current = 0;
						else if ( current >= suggestions.length )
							current = suggestions.length - 1;

						this.set('ffz_freeze_suggestions', -1);
						this.set('ffz_current_suggestion', current);
						e.preventDefault();
					}

					break;

				case KEYCODES.UP:
				case KEYCODES.DOWN:
					// First, navigate through suggestions if those are open.
					if ( this.get('ffz_suggestions_visible') && !( e.shiftKey || e.shiftLeft || e.ctrlKey || e.metaKey ) ) {
						var suggestions = this.get('ffz_sorted_suggestions'),
							current = this.get('ffz_current_suggestion') + (key === KEYCODES.UP ? -1 : 1);

						if ( current < 0 )
							current = suggestions.length - 1;
						else if ( current >= suggestions.length )
							current = 0;

						this.set('ffz_freeze_suggestions', -1);
						this.set('ffz_current_suggestion', current);
						e.preventDefault();
						break;

					// Otherwise, if we're holding any special modifiers, don't do
					// anything special to avoid breaking functionality.
					} else if ( e.shiftKey || e.shiftLeft || e.ctrlKey || e.metaKey )
						break;

					// If MRU is enabled, cycle through it if the cursor's position doesn't
					// change as a result of this action.
					else if ( f.settings.input_mru )
						Ember.run.next(this.ffzCycleMRU.bind(this, key, selection_start(this.get("chatTextArea"))));

					// If MRU isn't enabled, cycle through the whisper targets.
					else
						Ember.run.next(this.cycleWhisperTargets.bind(this, key));

					break;


				case KEYCODES.ENTER:
					if ( e.shiftKey || e.shiftLeft )
						break;

					this.set('ffz_mru_index', -1);

					if ( this.get('ffz_suggestions_visible') )
						this.ffzCompleteSuggestion();
					else {
						this.set("_currentWhisperTarget", -1);
						setTimeout(this.ffzResizeInput.bind(this), 25);
						this.sendAction("sendMessage");
					}

					if ( e.stopPropagation )
						e.stopPropagation();

					e.preventDefault();
					break;


				case KEYCODES.SPACE:
					// First things first, if we're currently showing suggestions, get rid of them.
					if ( this.get('ffz_suggestions_visible') )
						if ( f.settings.input_complete_keys ) {
							this.ffzCompleteSuggestion(null, true);
							e.preventDefault();
						} else
							this.ffzHideSuggestions();

					// After pressing space, if we're entering a command, do stuff!
					// TODO: Better support for commands.
					var sel = selection_start(this.get('chatTextArea'));
					Ember.run.next(function() {
						var text = t.get("messageText"),
							ind = text.indexOf(' '),
							start = ind !== -1 && text.substr(0, ind);

						if ( ind !== sel )
							return;

						if ( f.settings.input_quick_reply && start === '/r' ) {
							var target = t.get("uniqueWhisperSuggestions.0");
							if ( target ) {
								t.set("_currentWhisperTarget", 0);
								t.set("messageText", "/w " + target + t.get("messageText").substr(2));

								Ember.run.next(function() {
									move_selection(t.get('chatTextArea'), 4 + target.length);
								});
							} else {
								t.set("messageText", "/w " + t.get('messageText').substr(2));
								Ember.run.next(function() {
									move_selection(t.get('chatTextArea'), 3);
									t.ffzFetchNameSuggestions();
									t.set("ffz_suggestions_visible", true);
									t.ffzSetPartialWord();
								});
							}

						} /* else if ( f.settings.input_complete_commands && (start.charAt(0) === '/' || start.charAt(0) === '.') ) {
							var commands = t.get('ffz_commands'),
								cmd = commands[start.substr(1)];

							if ( cmd && cmd.label && cmd.label.split(' ',2)[1] === '&lt;user&gt;' ) {
								t.ffzFetchNameSuggestions();
								t.set("ffz_suggestions_visible", true);
								t.ffzSetPartialWord();
							}
						}*/
					});
			}
		},


		ffzCycleMRU: function(key, start_ind) {
			// We don't want to do this if the keys were just moving the cursor around.
			var cur_pos = selection_start(this.get("chatTextArea"));
			if ( start_ind !== cur_pos )
				return;

			var ind = this.get('ffz_mru_index'),
				mru = this.get('parentView.room.mru_list') || [];

			if ( key === KEYCODES.UP )
				ind = (ind + 1) % (mru.length + 1);
			else
				ind = (ind + mru.length) % (mru.length + 1);

			var old_val = this.get('ffz_old_mru');
			if ( old_val === undefined || old_val === null ) {
				old_val = this.get('messageText');
				this.set('ffz_old_mru', old_val);
			}

			var new_val = mru[ind];
			if ( new_val === undefined ) {
				this.set('ffz_old_mru', undefined);
				new_val = old_val;
			}

			this.set('ffz_mru_index', ind);
			this.set('messageText', new_val);
		}
	});
}