var FFZ = window.FrankerFaceZ,
	constants = require("../constants"),
	utils = require("../utils");
	//styles = require("../styles");


// ---------------------
// Settings
// ---------------------

FFZ.basic_settings.dark_twitch = {
	type: "boolean",
	no_bttv: true,

	category: "General",
	name: "Dark Twitch",
	help: "Apply a dark background to channels and other related pages for easier viewing.",

	get: function() {
		return this.settings.dark_twitch;
	},

	set: function(val) {
		this.settings.set('dark_twitch', val);
		this.settings.set('dark_no_blue', val);
	}
};

FFZ.basic_settings.separated_chat = {
	type: "boolean",
	no_bttv: true,

	category: "Chat",
	name: "Separated Lines",
	help: "Use alternating rows and thin lines to visually separate chat messages for easier reading.",

	get: function() {
		return this.settings.chat_rows && this.settings.chat_separators !== '0';
	},

	set: function(val) {
		this.settings.set('chat_rows', val);
		this.settings.set('chat_separators', val ? '2' : '0');
	}
};

FFZ.basic_settings.minimalistic_chat = {
	type: "boolean",

	category: "Chat",
	name: "Minimalistic UI",
	help: "Hide all of chat except messages and the input box and reduce chat margins.",

	get: function() {
		return this.settings.minimal_chat === 3 && this.settings.chat_padding;
	},

	set: function(val) {
		this.settings.set('minimal_chat', val ? 3 : 0);
		this.settings.set('chat_padding', val);
	}
};

FFZ.basic_settings.high_contrast = {
	type: "boolean",

	category: "Chat",
	name: "High Contrast",
	help: "Display chat using white and black for maximum contrast. This is suitable for capturing and chroma keying chat to display on stream.",

	get: function() {
		return this.settings.high_contrast_chat !== '222';
	},

	set: function(val) {
		this.settings.set('high_contrast_chat', val ? '111': '222');
	}
};

FFZ.basic_settings.keywords = {
	type: "button",

	category: "Chat",
	no_bttv: 6,

	name: "Highlight Keywords",
	help: "Set additional keywords that will be highlighted in chat.",

	method: function() {
		FFZ.settings_info.keywords.method.call(this, null, true);
	}
};

FFZ.basic_settings.banned_words = {
	type: "button",

	category: "Chat",
	no_bttv: 6,

	name: "Banned Keywords",
	help: "Set a list of words that will be removed from chat messages, locally.",

	method: function() {
		FFZ.settings_info.banned_words.method.call(this, null, true);
	}
};



FFZ.settings_info.twitch_chat_dark = {
	type: "boolean",
	value: false,
	visible: false
	};


FFZ.settings_info.twitch_theme = {
	value: '',
	visible: false
};


FFZ.settings_info.dark_twitch = {
	type: "boolean",
	value: false,

	no_bttv: true,
	//visible: function() { return ! this.has_bttv },

	category: "Appearance",
	name: "Dark Twitch",
	help: "Apply a dark background to channels and other related pages for easier viewing.",

	on_update: function(val) {
			var cb = document.querySelector('input.ffz-setting-dark-twitch');
			if ( cb )
				cb.checked = val;

			if ( this.has_bttv )
				return;

			var RH = this._roomv && this._roomv.get('ffz_recent_el');
			if ( RH )
				RH.classList.toggle('dark', val);

			(this.is_clips ? document.querySelector('html') : document.body).classList.toggle("ffz-dark", val);

			var Settings = utils.ember_settings(),
				ThemeManager = utils.ember_lookup('service:theme-manager');

			if ( val ) {
				this._load_dark_css();
				if ( ThemeManager ) {
					this.settings.set('twitch_theme', ThemeManager.get('themes.activeTheme'));
					ThemeManager.set('themes.activeTheme', 'theme--dark');
				}
				if ( Settings ) {
					this.settings.set('twitch_chat_dark', Settings.get('darkMode'));
					Settings.set('darkMode', true);
				}
			} else {
				if ( ThemeManager )
					ThemeManager.set('themes.activeTheme', this.settings.twitch_theme);
				if ( Settings )
					Settings.set('darkMode', this.settings.twitch_chat_dark);
			}

			// Try coloring chat replay
			window.jQuery && jQuery('.chatReplay').toggleClass('dark', val || false);
			//jQuery('.rechat-chat-line').parents('.chat-container').toggleClass('dark', val || this.settings.twitch_chat_dark);
		}
	};


FFZ.settings_info.dark_no_blue = {
	type: "boolean",
	value: false,

	//no_bttv: true,

	category: "Appearance",
	name: "Gray Chat (no blue)",
	help: "Make the dark theme for chat and a few other places on Twitch a bit darker and not at all blue.",

	on_update: function(val) {
			document.body.classList.toggle("ffz-no-blue", val);
		}
	};


FFZ.settings_info.hide_recent_past_broadcast = {
	type: "boolean",
	value: false,

	//no_bttv: true,
	no_mobile: true,

	category: "Channel Metadata",
	name: "Hide \"Watch Last Broadcast\"",
	help: "Hide the \"Watch Last Broadcast\" banner at the top of offline Twitch channels.",

	on_update: function(val) {
			document.body.classList.toggle("ffz-hide-recent-past-broadcast", val);
		}
	};


// ---------------------
// Initialization
// ---------------------

FFZ.prototype.setup_dark = function() {
	document.body.classList.toggle("ffz-hide-recent-past-broadcast", this.settings.hide_recent_past_broadcast);
	document.body.classList.toggle("ffz-no-blue", this.settings.dark_no_blue);

	if ( this.has_bttv )
		return;

	(this.is_clips ? document.querySelector('html') : document.body).classList.toggle('ffz-dark', this.settings.dark_twitch);

	if ( ! this.settings.dark_twitch )
		return;

	var Settings = utils.ember_settings(),
		ThemeManager = utils.ember_lookup('service:theme-manager');

	if ( ThemeManager ) {
		ThemeManager.set('themes.activeTheme', 'theme--dark');
	} else if ( Settings )
		Settings.set('darkMode', true);

	this._load_dark_css();
}


FFZ.prototype._load_dark_css = function() {
	if ( this._dark_style )
		return;

	this.log("Injecting FrankerFaceZ Dark Twitch CSS.");

	var s = this._dark_style = document.createElement('link');

	s.id = "ffz-dark-css";
	s.setAttribute('rel', 'stylesheet');
	s.setAttribute('href', constants.SERVER + "script/dark" + (this.is_clips ? '-clips' : '') + (constants.DEBUG ? "" : ".min") + ".css?_=" + (constants.DEBUG ? Date.now() : FFZ.version_info));
	document.head.appendChild(s);
}


FFZ.prototype.add_clips_darken_button = function() {
	if ( this.embed_in_clips )
		return;

	this.log("Adding Clips Darken button.");

	var f = this,
		btn = utils.createElement('a', 'button button--hollow ffz-darken-clips', f.settings.dark_twitch ? 'Light' : 'Dark');

	btn.addEventListener('click', function() {
		f.settings.set('dark_twitch', ! f.settings.dark_twitch);
		btn.textContent = f.settings.dark_twitch ? 'Light' : 'Dark';
	});

	document.body.appendChild(btn);
}