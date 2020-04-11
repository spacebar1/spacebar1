/*
 * Renders any input text. For things like confirmation buttons.
 * Takes a single key as response, and sends it back to the callback.
 */

(function() {

  SBar.BattleLogR = function(title, messageLogs) {
    this._initBattleLogR(title, messageLogs);
  };

  SBar.BattleLogR.prototype = {
    title: null,
		messageLogs: null,
    _initBattleLogR: function(title, messageLogs) {
			// Note this only works for simple keys. If going to complex keys,
			// may need to take some inputs or have the caller check on return.
      this.title = title;
			this.messageLogs = messageLogs;
		},

    activate: function() {
		  var context = TC.targLayer;
      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,0.7)');
      SU.rectCorner(context, 8, 20, 20, SF.WIDTH - 40, SF.HEIGHT - 40, "rgb(50,50,50)", 'rgb(0,0,0)', 2);
			
			let NUM_LINES = 37;
			for (let i = 0; i < NUM_LINES*2 && i < this.messageLogs.length; i++) {
				let x = i < NUM_LINES ? 30 : SF.HALF_WIDTH;
				let y = i < NUM_LINES ? i*20 : (i-NUM_LINES)*20;
				let message_log = this.messageLogs[i];
				if (message_log.icons) {
					for (let j = 0; j < message_log.icons.length; j++) {
						let icon_name = message_log.icons[j];
						if (TG.icons[icon_name]) {
							context.drawImage(TG.icons[icon_name], x+j*20, y + 30, 20, 20);
						}
					}
				}
	      SU.text(context, message_log.turn + ": " + message_log.text, x+110, y + 45, SF.FONT_S, '#FFF'); // start under for measure, then do over
			}
			SU.addText("B: Return");
      SG.activeTier = this;
    },

    handleKey: function(key) {
			// Any key to return.
			this.teardown();
    },
		
    teardown: function() {
			SU.PopTier();
    },
  };
})();
