/*
Other options:
 - arena fights
 - total levsl of all items
(but trying to keep it to 1 page)
*/

(function() {

    SBar.GameSummaryRenderer = function() {
        this._initGameSummaryRenderer();
    };

    SBar.GameSummaryRenderer.prototype = {
			context: null,
			heading: null,
			detail: null,
			lines: null,  // Text lines.
			image: null,
			ms: 0,
			frame_ms: 20, // Milliseconds per frame.
			times_drawn: 0,
			text_element: null,
			_initGameSummaryRenderer: function() {
	      this.context = SC.layer1;				
				this.lines = [];
				
				// Debug.
				//S$.game_stats.won_game = true;
				//S$.killed_friend_in_this_timeline = true;
				//S$.game_stats.times_killed_friend = 5;
      },
			
	    activate: function(callback) {
	      SG.activeTier = this;			
				SU.clearText();  // Allow char.
	      SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // For coordinates.
				SU.addText("T: Text Version");
				SU.addText("J: Just One More Turn");
				SU.addText("X: Exit to Credits");
				
				//SU.text(SC.layer1, 'ASDF', SF.HALF_WIDTH, 65, 'bold 60pt '+SF.FONT, "#FFF", 'center');
				this.BuildContent();
				this.DrawContent();
	      this.timeout = window.setTimeout(this.DrawUpdate.bind(this), this.frame_ms);
			},
			
			// Advance time and draw, fading-in the text.
			DrawUpdate: function() {
				this.ms += this.frame_ms;
				// Draw a mask using an angled gradient that will be used as the brightness.
				let y_start = -SF.HEIGHT/2+this.ms/2;
				
				if (y_start > SF.HEIGHT) {
					// Done.
					this.timeout = null;
					return;
				}
				
        this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				let color_stops = [0, 'rgba(255,255,255,1)', 1, 'rgba(255,255,255,0)'];
				SU.rect(this.context, 0, y_start-SF.HEIGHT, SF.WIDTH, SF.HEIGHT, "#FFF");
				SU.rectGrad(this.context, 0, y_start, SF.WIDTH, y_start+SF.HEIGHT/2, 0, y_start, 0, y_start+SF.HEIGHT/2, color_stops);
				this.context.save();
				this.context.globalCompositeOperation = "source-in";
				this.context.drawImage(this.image, 0, 0);
				this.context.restore();
				
	      this.timeout = window.setTimeout(this.DrawUpdate.bind(this), this.frame_ms);
			},
			
			// Draws the text on an image.
			DrawContent: function() {
	      this.image = document.createElement('canvas');
	      this.image.width = SF.WIDTH;
	      this.image.height = SF.HEIGHT;
	      let context = this.image.getContext('2d');
				
				// Same as 7charR.js.
	      SU.text(context, this.heading, SF.HALF_WIDTH, 47, SF.FONT_XLB, '#ACA', 'center');
				
				let y = 80;
				if (this.center_details) {
					SU.text(context, this.detail, SF.HALF_WIDTH, y, SF.FONT_L, "#AAF", "center");
					y += 20;
				} else {
					y += SU.wrapText(context, this.detail, SF.WIDTH*0.05, y, SF.WIDTH*0.9, 22, SF.FONT_L, "#AAF", "left");
				}
				y += 20;

				let half_line_count = Math.round(this.lines.length/2);  // Rounds up.
				for (let i = 0; i < half_line_count; i++) {
					let line = this.lines[i];
		      SU.text(context, line[0], SF.WIDTH*0.35, y, SF.FONT_L, '#FFF', 'right');
		      SU.text(context, line[1], SF.WIDTH*0.36, y, SF.FONT_L, '#FAA', 'left');
					if (half_line_count+i < this.lines.length) {
						let line = this.lines[half_line_count+i];
			      SU.text(context, line[0], SF.WIDTH*0.75, y, SF.FONT_L, '#FFF', 'right');
			      SU.text(context, line[1], SF.WIDTH*0.76, y, SF.FONT_L, '#FAA', 'left');
					}
					y+= 22;
				}
			},

			// Note this currently skips lines if the value is 0.
			AddLine: function(left, right) {
				if (right !== 0) {
					this.lines.push([left, right]);
				}
			},
			
			BuildContent: function() {
				let name = S$.crew[0].name;
				let stats = S$.game_stats;
				
				this.heading = SU.CharTitleString();
				
				this.detail = "";
				if (stats.won_game) {
					this.detail = "You cautiously enter the bar. A room full of patrons quietly turn to face you. Then in unison they begin to sing. "
					+ "The drunk patrons sing, and you are bathed in their musical dissonance. "
					+ "They sing and they drink to your saving the universe. "
					+ "They drink and they sing to your saving your friend... "
					+ "or maybe not. It's also possible they are just very drunk and have no idea who you are. ";
					if (S$.killed_friend_in_this_timeline) {
						this.detail += "Having traveled back in time to kill your friend, meta points for going all Blade Runner on your creator, "
						  +"but you can't help the Terminator feeling that you've grown from the champion of imagination into the fabric of nightmares. ";
						if (stats.times_killed_friend > 0) {
							this.detail += stats.times_killed_friend+" times, no less! ";
						}
						// Partial Avengers: Engame reference.
						this.detail += "You are thankful that the laws of time travel obey neither the rules of Back To The Future nor of Avengers: Endgame."
					}
				} else if (SG.death_message) {
					this.detail += " "+SG.death_message;
					this.center_details = true;
				}
				SU.addHighScore(this.heading, SG.death_message, S$.crew[0].base_level, stats.player_time_passed, stats.won_game, S$.conduct_data);
				
				for (let obj in S$.conduct_data) {
					let conduct = SF.CONDUCTS[obj];
					if (conduct.bonus) {
						this.AddLine("Voluntary Bonus", conduct.title);
					} else {
						this.AddLine("Voluntary Challenge", conduct.title);
					}
				}
				this.AddLine(/*name+*/"Level", S$.crew[0].base_level);
				this.AddLine(/*name+*/"Max Health", S$.crew[0].max_health);
				this.AddLine("Drinks Consumed", stats.drinks);
				this.AddLine("Distance Flown", coordToParsec(stats.distance_flown)+"pc");
				this.AddLine("Credits Acquired", stats.credits_acquired);
				this.AddLine("Credits Spent", stats.credits_spent);
				this.AddLine("Time elapsed for "+name, SU.TimeString(stats.player_time_passed));
				this.AddLine("Time elapsed for your friend", SU.TimeString(S$.time));
				this.AddLine("Times traveled to Cornfield", S$.times_traveled_back_to_gathering);
				this.AddLine("Enemies Killed", stats.enemies_killed);
				this.AddLine("Battles Fought", stats.battles_engaged);
				this.AddLine("Battles Fled", stats.times_fled);
				this.AddLine("Ships Abandoned", stats.ships_abandoned);
				this.AddLine("Blind Victories", stats.blind_brawls);
				this.AddLine("Crew Purge Attempts", stats.crew_purge_attempts);
				this.AddLine("Party Brawls", stats.party_battles);
				this.AddLine("Transmissions Investigated", stats.transmissions_investigated);
				this.AddLine("Times Time Traveled", stats.times_wmd_fragment_activated);
				this.AddLine("Dreams Recurred", stats.dreams_recurred);
				this.AddLine("WMD Activations", stats.times_wmd_full_activated);
				this.AddLine("Times Crew Cloned", stats.crew_clones);
				this.AddLine("Times Crew Summoned", stats.team_members_summoned);
				this.AddLine("Crew Damage Dealt", stats.crew_damage_dealt);
				this.AddLine("Crew Damage Taken", stats.crew_damage_taken);
				this.AddLine("Crew Damage Healed", stats.crew_health_healed);
				this.AddLine("Crew Members Lost", stats.crew_lost);
				this.AddLine("Crew Members Joined", stats.crew_members_joined);
				this.AddLine("Enemies Converted", stats.enemies_converted);
				this.AddLine("Quests Completed", stats.quests_completed);
				this.AddLine("System Visits", stats.system_visits);
				this.AddLine("Planet Visits", stats.planet_visits);
				this.AddLine("Building Visits", stats.building_visits);
				this.AddLine("Starport Visits", stats.starport_visits);
				this.AddLine("Friend's Starport Visits", stats.pod_visits);
				this.AddLine("Pirate Base Visits", stats.pirate_hideout_visits);
				this.AddLine(SF.GAME_NAME+" Ship Visits", stats.party_yacht_visits);
				this.AddLine("Asteroid Belt Visits", stats.belt_visits);
				this.AddLine("Moon Visits", stats.moon_visits);
				this.AddLine("Bubble Visits", stats.bubble_visits);
				this.AddLine("Wormhole Visits", stats.wormhole_visits);
				this.AddLine("Buildings Built", stats.buildings_built);
				this.AddLine("Buildings Upgraded", stats.buildings_upgraded);
				this.AddLine("Buildings Destroyed", stats.buildings_destroyed);
				this.AddLine("Minerals Mined", stats.minerals_mined);
				this.AddLine("Cargo Acquired", stats.cargo_acquired);
				this.AddLine("Contraband Acquired", stats.contraband_acquired);
				this.AddLine("Ships Acquired", stats.ships_acquired);
				this.AddLine("Items Acquired", stats.items_acquired);
				this.AddLine("Bars built on "+SF.ARTH_2_NAME, S$.bars_built_on_arth);
			},
			
			ToggleText: function() {
        let div = document.getElementById("exportdiv");
				if (this.text_element) {
					div.style.visibility = "hidden";
					this.text_element.parentNode.removeChild(this.text_element);
					this.text_element = null;
					return;
				}
				if (SU.IsFullscreen()) {
					SU.message("Exit Fullscreen First");
					return;
				}
				
        this.text_element = document.createElement("textarea");
        this.text_element.id = "summaryarea";
        div.appendChild(this.text_element);
	      let exportarea = document.getElementById("summaryarea");
	      exportarea.value = this.FormatAsText();
				div.style.visibility = "visible";
			},
			FormatAsText: function() {
				let text = "";
				text += this.heading+"\n\n";
				if (this.detail != "") {
					text += this.detail+"\n\n";
				}
				for (let line of this.lines) {
					text += line[0]+": "+line[1]+"\n";
				}
				return text;
			},
			
			teardown: function() {
				if (this.timeout) {
					clearTimeout(this.timeout);
					this.timeout = null;
				}
				if (this.text_element) {
					this.ToggleText();
				}
        this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			},
			
	    handleKey: function(key) {
	      switch (key) {
					case SBar.Key.T:
						this.ToggleText();
						break;
					case SBar.Key.X:
					case SBar.Key.J:
						if (this.text_element) {
							this.ToggleText();
						} else {
							this.teardown();
							SU.PopTier();
				      SU.PushTier(new SBar.CreditsRenderer());
						}
						break;
				}
			},

    };
})();




 
