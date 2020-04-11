/*
 * The WMD Fragment gives helpful and abusive hints to the player.
 * It is sentient, and it is aware of the player and their thoughts.
 * It also knows a bit about the plot.
 * Bizarre by design - basically something needed to be a mentat for the
 * player and the fragment is both a fun and convenient answer.
 */

(function() {
    SBar.IconFragmentText = function(context, y) {
        this._initIconFragmentText(context, y);
    };

    SBar.IconFragmentText.prototype = {
      type: SF.TYPE_FRAGMENT_TEXT_ICON,
			name: null,
			context: null,
			y: null,
			symbol: null,
			_initIconFragmentText: function(context, y) {
				this.name = SU.WmdFragmentName();
				if (!this.name) {
					// Player doesn't have a fragment.
					return;
				}
				this.context = context;
				this.y = y;
				this.DrawText();
      },

			DrawText: function() {
				//let title = "Message from\n"+this.name;
				let title = this.name;
				this.symbol = '?';
				let message = this.GetMessage();
				let symbol = message[0];
				let text = message[1];
				
				// Get the text height.
	      let textimg = document.createElement('canvas');
	      textimg.width = SF.HALF_WIDTH;
	      textimg.height = SF.HALF_HEIGHT;
	      let tcontext = textimg.getContext('2d');
				
				let title_height = SU.wrapText(tcontext, title, 0, 0, SF.HALF_WIDTH-120, 23, SF.FONT_L, "#000");
				let text_height = SU.wrapText(tcontext, text, 0, 0, SF.HALF_WIDTH-120, 20, SF.FONT_M, "#000")-20;
				
				SU.text(this.context, symbol, SF.WIDTH*3/4, this.y+150, "bold 120pt "+SF.FONT, "rgba(255, 255, 255, 0.15)", 'center');
				//SU.rectCorner(this.context, 12, SF.HALF_WIDTH+50, this.y-10, SF.HALF_WIDTH-100, title_height+text_height+31, 'rgba(0,0,0,0.2)', "#000", 1);
				SU.rectCorner(this.context, 12, SF.HALF_WIDTH+50, this.y-10, SF.HALF_WIDTH-100, title_height+3, 'rgba(255,255,255,0.4)', "#000", 1);
				SU.wrapText(this.context, title, SF.WIDTH*3/4, this.y+10, SF.HALF_WIDTH-120, 23, SF.FONT_L, "#000", 'center');
				SU.wrapText(this.context, text, SF.HALF_WIDTH+60, this.y+title_height+13, SF.HALF_WIDTH-120, 20, SF.FONT_M, "#AAA");
			},
			
			GetMessage: function() {
				if (S$.time < 24*12) {  // First 5 days.
//	if (1==2) {
					if (S$.game_stats.times_wmd_full_activated > 0) {
						return ["✧", "You're out of my league at this time, mate."];
					}
					return ["☀", "Hey! Down here. Yeah, the metal debris on your suit. I'm "+this.name+". " 
					+"Yes, I can talk. No, I can't move. What am I? I'm your chirpy sentient residual companion. Apparently. Okay, I have no idea what I am. "
					+"I've only been here a few days, so gimme a break. But you'll need me if you want to survive out there."];
				}
				for (let crew of S$.crew) {
					if (crew.morale < 50) {
						return ["☺", "This should be obvious, but you have a morale issue in your crew. You'd better take care of them, or you might "
						+"wake with a knife in your back. You could get rid of them. There are some easy ways to do that, like talking to them... and there are more \"clever\" alternatives."]
					}
				}
				let messages = [];
				if (S$.credits < 30 && !S$.conduct_data['no_money']) {
					messages.push(["$", "You're running low on coins. The whistle gets wet, you know. Papa has needs. There are a few options. You can dig up "
				  +"some rocks to sell. Gotta find a good place to dig, though. You can collect items and sell them. Just don't bind them. Beating up aliens can work, too."]);
				}
				if (S$.ship.sensor_level < 2 && !S$.conduct_data['no_equipment']) {
					messages.push(["⠵", "Your sensors are hopelessly bad. Aliens set up beacons that broadcast the names "
				   +"of everything around us. But this ship can't read them. Either you'll need better sensors, or you'll need a better ship. "
					+"Try to find a starport near an alien homeworld to find upgrades. Oh, you may also need a crew with some "+SF.STAT_NAME[SF.STAT_INT]+"."]);
				}
				if (S$.crew[0].base_level < 2) {
					messages.push(["⚔", "You're far too green to survive out there on your own. You will need practice to overcome your ineptness. "
				     +"Experience can be earned many ways: battle, archaeology expeditions... "
				     +"but given what I've seen from you so far, you might want to stick with trade for now. Any maybe later too."])
				}
				if (S$.crew.length < 2) {
					messages.push(["☉", "Looks like you're flying solo, cadet. You might think about getting some help. "
				    +"Be careful about keeping them happy, though... underlings can be more effort than they're worth. And appearances can be deceiving."])
				}
				// General stuff.
				if (messages.length == 0) {
					messages.push(["♬", "Do you hear that? I can whistle without moving my lips. Isn't that cool. Everything about me is so cool. Someday I hope to find whoever or whatever made me, and thank them for my sweet beat."]);
					messages.push(["♬", "If you don't prepare to win, you're preparing to lose. Or something like that. I'll be fine."]);
					messages.push(["♬", "You look familiar to me. Didn't your hat used to be transparent?"]);
					messages.push(["♬", "The greatest challenge of all is coming. One day you will need to face yourself, and win. Of course, it's a paradox, so you can't win. Good luck with that."]);
					messages.push(["♬", "Sometimes aliens are at war with other aliens. You might be able to take advantage of that. Pay attention."]);
					messages.push(["♬", "A space bar is a wonderful thing. Wouldn't you agree? I know you agree, I'm not asking. I'm telling you: space bars are wonderful things. Wouldn't you agree?"]);
					messages.push(["♬", "I have strange dreams sometimes, like I'm traveling back in time. But after I travel back in time I always forget what happened in the future. Aren't dreams weird?"]);
					messages.push(["♬", "This all started at a bar. And if it were up to me, it would end at a bar, too."]);
				}
				return messages[Math.floor(SU.r(1.21, Math.floor(S$.time/24)*messages.length))];
			},
			
      update: function(shipx, shipy, clickx, clicky) {

      },
    };
    SU.extend(SBar.IconCharDetails, SBar.Icon);
})();

	
