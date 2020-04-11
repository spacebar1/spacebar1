(function() {
	
  SBar.EncounterRenderer = function(tier) {
    this._initEncounterRenderer(tier);
  };

  SBar.EncounterRenderer.prototype = {
    tier: null,
    data: null,
		context: null,
		text_layout: null,
    _initEncounterRenderer: function(tier) {
      this.tier = tier;
      this.data = tier.data;
    },
    render: function() {
//      SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.context = SC.layer2;
			this.text_layout = new SBar.TextLayout(this.context);
			var title = this.data.battle_name;
      SU.displayBorder(title, this.context);
      this.context.globalAlpha = 0.25;
			SU.text(this.context, "⚔", SF.HALF_WIDTH, SF.HALF_HEIGHT+120, '260pt '+SF.FONT, '#000', 'center');
      this.context.globalAlpha = 1;
			
			//var story = "You get surrounded by some trees. A pirate's life for me! Or something. (TODO)\n";
			
			this.text_layout.prepRight("Negotiation options");
			this.text_layout.AddValue("Engage");

			// Flee.
			if (this.data.flee_chance >= 100) {
				//text += "  Just Kidding (withdraw): 100%\n";
				this.text_layout.AddValue("Just Kidding (withdraw)", "100%");
			} else {
				this.text_layout.AddValue("Flee", this.data.flee_chance+"%");
//				if (this.data.allow_warning) {
//					this.text_layout.AddValue("    This is your only warning!");
//				}
			}
			
			// Blind brawl.
			if (this.tier.blind_brawl_casualty) {
				let cost = this.data.blind_brawl_cost;
				let cost_text = "N/A (-" + cost + SF.SYMBOL_HEALTH + ")"
				if (cost > 500) {
					cost_text = "N/A (!)";
				}
				this.text_layout.AddValue("Blind Victory", cost_text);
			} else {
				this.text_layout.AddValue("Blind Victory", "-" + this.data.blind_brawl_cost + SF.SYMBOL_HEALTH);
			}
			
			// Bribe.
			let bribe_start = this.data.battle_type == SF.BATTLE_PIRATE ? "Parlaaay" : "Bribe";
			if (this.tier.bribe_cost) {
				this.text_layout.AddValue(bribe_start, "-" + SF.SYMBOL_CREDITS + this.tier.bribe_cost + " (/" + S$.credits + ")");
			} else {
				this.text_layout.AddValue(bribe_start, "N/A");
			}
			
			// Launch escape pod / abandon ship.
			if (S$.ship.ship_type === SF.SHIP_POD) {
				this.text_layout.AddValue("Abandon Crew & Ship", "N/A (already in pod)");
			} else {
				this.text_layout.AddValue("Abandon Crew & Ship", this.data.abandon_chance+"%");
			}
			
			this.text_layout.AddValue("View battlefield");
			
      let left_y = 110; 
			//left_y += SU.wrapText(this.context, story, 100, left_y, 400, 25, SF.FONT_L, '#AAA');
			if (this.data.attacking) {
				let description = this.data.description || "Initiative: You";
				left_y += SU.wrapText(this.context, description, 100, left_y, 400, 25, SF.FONT_L, '#AFA');
			} else {
				//left_y += SU.wrapText(this.context, "Initiative: Them", 100, left_y, 400, 25, SF.FONT_L, '#FAA');
				let description = this.data.description || "Ambushed!";
				left_y += SU.wrapText(this.context, description, 100, left_y, 400, 25, SF.FONT_L, '#FAA');
			}
			left_y += 10;
      //left_y += SU.wrapText(this.context, "Your Crew", 100, left_y, 400, 25, SF.FONT_LB, '#AAA');			

			this.text_layout.prepLeft("");
			this.text_layout.yoff = left_y;
			this.text_layout.AddTitle("Your Crew");

			for (let hero of this.data.heroes) {
				if (hero.friendly) {
					this.text_layout.AddValue(hero.name, hero.PrintOneLine());
					//left_y += SU.wrapText(this.context, hero.PrintOneLine(), 100, left_y, 400, 20, SF.FONT_M, '#AAA');
				}
			}
			left_y += 10;
      //left_y += SU.wrapText(this.context, "Them", 100, left_y, 400, 25, SF.FONT_LB, '#AAA');			
			this.text_layout.AddTitle("Them");

			for (let hero of this.data.heroes) {
				if (!hero.friendly) {
					this.text_layout.AddValue(hero.name, hero.PrintOneLine());
					
//					left_y += SU.wrapText(this.context, hero.PrintOneLine(), 100, left_y, 400, 20, SF.FONT_M, '#AAA');
				}
			}
			
			SU.clearText();
			SU.addText("E: Engage");
			if (this.data.flee_chance >= 100) {
				SU.addText("X: Withdraw");
			} else if (this.data.flee_chance > 0) {
				SU.addText("F: Flee");
			}
			if (!this.tier.blind_brawl_casualty) {
				SU.addText("B: Blind Victory");
			}
			if (this.tier.bribe_cost) {
				SU.addText("R: Bribe");
			}
			if (S$.ship.ship_type !== SF.SHIP_POD && this.data.abandon_chance > 0) {
				SU.addText("A: Abandon Ship")
			}
			SU.addText("V: View Battlefield");
			
    },
		
		
		textCallback: function(key) {
			this.tier.handleKey(key);		
		},
    renderUpdate: function() {

    },
    teardown: function() {
			//this.context.setTransform(1,0,0,1,0,0);
			SU.clearText();
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
//      SB.clear();
    }
  };
  SU.extend(SBar.EncounterRenderer, SBar.TierRenderer);
})();
