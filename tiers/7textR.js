/*
 * Renders any input text. For things like confirmation buttons.
 * Takes a single key as response, and sends it back to the callback.
 */

(function() {

  SBar.TextDisplay = function(title, text, key_text, keys, callback, icon, is_interrupt) {
    this._initTextDisplay(title, text, key_text, keys, callback, icon, is_interrupt);
  };

  SBar.TextDisplay.prototype = {
    title: null,
		text: null,
		keys: null, // List of valid keys.
		key_text: true,
		callback: null,
		icon: null,
		is_interrupt: null, // Interrupting dialogs use a more noticable background.
    _initTextDisplay: function(title, text, key_text, keys, callback, icon, is_interrupt) {
			// Note this only works for simple keys. If going to complex keys,
			// may need to take some inputs or have the caller check on return.
      this.title = title;
			this.text = text;
			this.key_text = key_text;
			this.keys = keys;
			this.callback = callback;
			this.icon = icon;
			this.is_interrupt = is_interrupt;
		},

    activate: function() {
		  var context = SC.layer2;
			
			if (this.is_interrupt) {
	      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(50,0,0,0.7)');

	      SU.rect(context, 135, 135, 25, 25, "rgb(100,0,0)", 'rgb(0,0,0)', 2);
	      SU.rect(context, 130+SF.WIDTH - 290, 135, 25, 25, "rgb(100,0,0)", 'rgb(0,0,0)', 2);
	      SU.rect(context, 135, 130+SF.HEIGHT - 340, 25, 25, "rgb(100,0,0)", 'rgb(0,0,0)', 2);
	      SU.rect(context, 130+SF.WIDTH - 290, 130+SF.HEIGHT - 340, 25, 25, "rgb(100,0,0)", 'rgb(0,0,0)', 2);


	      SU.rect(context, 145, 145, SF.WIDTH - 290, SF.HEIGHT - 340, "rgb(100,100,100)", 'rgb(0,0,0)', 2);
	      SU.rect(context, 150, 150, SF.WIDTH - 300, SF.HEIGHT - 350, "rgb(50,50,50)", 'rgb(0,0,0)', 2);

	      SU.text(context, this.title, 177, 160, SF.FONT_XLB, '#FFF'); // start under for measure, then do over
	      var measure = context.measureText(this.title);
	      SU.rect(context, 165, 125, measure.width + 30, 50, "rgb(100,100,100)", 'rgb(0,0,0)', 2);
	      SU.rect(context, 170, 130, measure.width + 20, 40, "rgb(170,170,170)", 'rgb(0,0,0)', 2);
	      SU.text(context, this.title, 177, 160, SF.FONT_XLB, '#000');

	      SU.wrapText(context, this.text, 170, 210, 670, 25, SF.FONT_L, '#AAA');
			} else {
	      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,0.7)');
	      SU.rectCorner(context, 8, 150, 150, SF.WIDTH - 300, SF.HEIGHT - 350, "rgb(50,50,50)", 'rgb(0,0,0)', 2);

	      SU.text(context, this.title, 177, 160, SF.FONT_XLB, '#FFF'); // start under for measure, then do over
	      var measure = context.measureText(this.title);
	      SU.rectCorner(context, 4, 170, 130, measure.width + 20, 40, "rgb(100,100,100)", 'rgb(0,0,0)', 2);
	      SU.text(context, this.title, 177, 160, SF.FONT_XLB, '#FFF');

	      SU.wrapText(context, this.text, 170, 210, 670, 25, SF.FONT_L, '#AAA');
			}
			
			for (var i = 0; i < this.key_text.length; i++) {
				SU.addText(this.key_text[i]);
			}
			if (this.icon) {
				SU.circle(context, SF.WIDTH - 175, 140, 50, "rgb(100,100,100)", "#000", 5);
				SU.text(context, this.icon, SF.WIDTH - 175, 165, 'bold 50pt '+SF.FONT, '#FFF', 'center');
			}
      SG.activeTier = this;
    },

    handleKey: function(key) {
			for (var i = 0; i < this.keys.length; i++) {
				if (this.keys[i] === key) {
					this.teardown(key);
					return;
				}
			}
      error("unrecognized key pressed in 7textr: " + key);
    },
		
    teardown: function(key) {
			SU.PopTier();
      if (this.callback) {
        this.callback(key);
      }
    },
  };
})();
