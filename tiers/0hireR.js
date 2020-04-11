/*
 * Building quest object
 * Give the player an option for a quest
 */

(function() {

  SBar.HireDisplay = function(seed, raceseed, level, callback) {
    this._initHireDisplay(seed, raceseed, level, callback);
  };

  SBar.HireDisplay.prototype = {
		seed: null,
		raceseed: null,
		level: null,
		callback: null,
		available: true,
		hero: null,
		context: null,
		cost: null,
		is_pirate: false,  // Set explicitly.
		cave_backstory: null,  // Set explicitly.
		free: false,  // Free hero, no cost.
		crew_override: null,  // Can set a custom crew to hire.
		accept_override: null,
		description_override: null,
    _initHireDisplay: function(seed, raceseed, level, callback) {
			if (callback) {
				this.callback = callback;
			}
			this.seed = seed;
			this.raceseed = raceseed;
			this.level = level;
		},

    activate: function() {
      SG.activeTier = this;			
      this.context = SC.layer2;
      //if (S$.found(this.seed + 2.22)) {
      //  SU.displayBorderNodark("No Crew Available", this.context);
			//	this.available = false;
			//} else {
			if (this.crew_override) {
				this.hero = this.crew_override;
			} else {
				var name = ST.getWord(this.raceseed, this.seed+81.4+S$.time)
				this.hero = new SBar.Crew(name, this.seed+81.5+S$.time, this.raceseed, this.level, /*crew_data=*/undefined, /*is_player=*/undefined, /*is_pirate*/this.is_pirate);
			}
			if (S$.conduct_data['cheerful']) {
				this.hero.morale = SF.MAX_MORALE_SCORE;
			}						
			if (S$.crew.length <= 1 && this.level <= S$.crew[0].base_level+2) {
				this.free = true;
				this.hero.salary = 0;
			}
      SU.displayBorderNodark(this.hero.name, this.context);
			this.DrawHero();
			//}
			
			SU.addText("1: Inspect");
			if (this.available) {
				SU.addText("Space: Hire");
			}
			SU.addText("X: Return");
    },

    handleKey: function(key) {
      switch (key) {
				case SBar.Key.NUM1:
					SU.PushTier(new SBar.ArtifactComplexRenderer(this.hero, undefined, true));
					break;
        case SBar.Key.SPACE:
          if (this.available) {
            this.Accept();
          }
          break;
        case SBar.Key.X:
          this.Teardown();
          break;
        default:
          error("unrecognized key pressed in hirer: " + key);
      }
    },
		
		DrawHero: function() {
			let image = this.hero.GetCachedImage();
			this.context.save();
			this.context.globalAlpha = 0.25;
			this.context.drawImage(image, SF.HALF_WIDTH/2, SF.HALF_HEIGHT/2, SF.HALF_WIDTH, SF.HALF_HEIGHT)
			this.context.restore();
			
      this.xoff = 100;
      this.yoff = 120;
			let background = this.description_override ? this.description_override : ST.Backstory(this.hero, this.cave_backstory);
      this.yoff += SU.wrapText(this.context, background, this.xoff, this.yoff, 400, 20, SF.FONT_L, '#AAA');
			
      this.xoff = SF.HALF_WIDTH+20;
      this.yoff = 120;
      this.yoff += SU.wrapText(this.context, this.hero.name, 730, this.yoff, 190, 25, SF.FONT_L, '#FFF', 'center');
      //this.yoff += 10 + SU.wrapText(this.context, SU.Stringify(this.hero).replace(new RegExp(",", 'g'), ", "), this.xoff, this.yoff, 400, 20, SF.FONT_L, '#AAA');
			var stats_strings = this.hero.StatsStrings();
			for (var i = 0; i < stats_strings.length; i++) {
				let line = stats_strings[i];
//	      this.yoff += SU.wrapText(this.context, stats_strings[i], this.xoff, this.yoff, 400, 20, SF.FONT_L, '#AAA');
				let text = null;
				let right = null;
				if (Array.isArray(line)) {
					text = line[0];
					right = line[1];
				} else {
					text = line;
				}
				if (right) {
			    SU.text(this.context, right, SF.WIDTH-100, this.yoff, SF.FONT_M, SF.STAT_TEXT_COLOR, 'right');
				}
			  this.yoff += SU.wrapText(this.context, text, SF.HALF_WIDTH+20, this.yoff, 200, 22, SF.FONT_M, '#AAF');
			}
			let cost = round2good(SF.LEVEL_XP[this.level]*(SU.r(this.seed,9.17)/2+0.5)/10+1);
			if (this.free) {
				cost = 0;
			}
			this.yoff += 20;
			let text = SF.SYMBOL_CREDITS+cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")";
			if (this.free) {
				text += "... You look like you could use a friend.";
			}
      this.yoff += SU.wrapText(this.context, text, this.xoff, this.yoff, 400, 20, SF.FONT_L, '#AFA');
			if (cost > S$.credits) {
	      this.yoff += SU.wrapText(this.context, "Not enough "+SF.SYMBOL_CREDITS, this.xoff, this.yoff, 400, 20, SF.FONT_LB, '#F66');
				this.available = false;
			}
		},
		
    Accept: function() {
			if (this.accept_override) {
				this.accept_override();
			} else {
				S$.AddCrew(this.hero);
			}
      //S$.find(this.seed + 2.22); // mark hired
      this.Teardown();
    },
		
    Teardown: function() {
			SU.PopTier();
      if (this.callback) {
        this.callback();
      }
    },
  };
})();
