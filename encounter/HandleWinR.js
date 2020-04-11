/*
 * Dialog at battle loss or other game end.
 */
(function() {

  let BACKGROUND_SIZE = 500;

  SBar.HandleWinRenderer = function(encounter_data, bdata) {
    this._initHandleWinRenderer(encounter_data, bdata);
  };
  SBar.HandleWinRenderer.prototype = {
		encounter_data: null,
		bdata: null,
		context: null,
		text_image: null,
		background_image: null,
		credits: null, // Artifact or credits should be null.
		artifact: null,
		skill: null,
		arti_shape: null,
		seed: null,
		timeout: null,
		render_calls: 0,
		text_layout: null,
		no_reward: false,
		reward: null, // Optional 'credits', 'artifact', 'ship', 'no_reward'.
		title_message: "Victory",
		raceseed: null,
		
    _initHandleWinRenderer: function(encounter_data, bdata) {
			this.encounter_data = encounter_data;
			this.bdata = bdata;
			this.seed = encounter_data.seed;
			this.reward = {};
			this.raceseed = this.bdata.raceseed || (this.bdata.parentData && this.bdata.parentData.raceseed);
    },
		
		// Could switch these to param overrides, if there's more needed.
		SetReward: function(reward) {
			this.reward = reward;
			return this;
		},
/*		
		SetCredits: function(credits) {
			this.reward.credits = credits;
			return this;
		},
		
		SetShip: function(ship) {
			this.ship = ship;
			return this;
		},
		
		SetArtifact: function(artifact) {
			this.artifact = artifact;
			return this;
		},
		*/
    activate: function() {
			if (this.reward.artifact && this.reward.artifact.params[0].type === SF.SKILL_TRUE_OMEGA) {
				// Only way the player gets the omega in battle is killing their friend.
				S$.game_stats.times_killed_friend++;
				S$.killed_friend_in_this_timeline = true;
			}
			
			if (!this.reward.credits && !this.reward.ship && !this.reward.artifact && !this.reward.no_reward) {
				// Default reward.
				if (this.bdata.type == SF.TYPE_DERELICT) {
					this.DoShip();
				} else if (SU.r(this.seed, 1.51) < 0.4 && this.faction !== SF.FACTION_ALPHA && this.raceseed !== SF.RACE_SEED_ALPHA) {
					// Alpha victories don't do credits.
					this.DoCredits();
				} else {
					this.DoArtifact();
				}
			}

      this.background_image = document.createElement('canvas');
      this.background_image.width = BACKGROUND_SIZE;
      this.background_image.height = BACKGROUND_SIZE;
      let context = this.background_image.getContext('2d');
	
			if (this.reward.credits) {
				context.save();
				context.globalAlpha = 0.15;
		    SU.text(context, SF.SYMBOL_CREDITS, BACKGROUND_SIZE/2, BACKGROUND_SIZE/2, 'bold 100pt monospace', "#FFF", 'center', "#000", 5);
				context.restore();
			} else if (this.reward.ship) {
				context.save();
				context.globalAlpha = 0.15;
				context.drawImage(this.reward.ship.GetImage(BACKGROUND_SIZE, /*rotate=*/false), 0, 0); 
				context.restore();
		  } else if (!this.reward.no_reward) {
				context.save();
				context.translate(BACKGROUND_SIZE/2, BACKGROUND_SIZE/2);
	      this.arti_shape = new SBar.IconArtifact(context, this.reward.artifact);
	      this.arti_shape.CenterAt(0, 0);
				context.scale(3, 3);
				context.globalAlpha = 0.15;
	//      this.context.rotate(rot * 2.17);
	      this.arti_shape.update();
				context.restore();
			}


      this.text_image = document.createElement('canvas');
      this.text_image.width = SF.WIDTH;
      this.text_image.height = SF.HEIGHT;
      this.context = this.text_image.getContext('2d');
			this.text_layout = new SBar.TextLayout(this.context);
			
      SG.activeTier = this;
			
      SU.displayBorder(this.title_message+" at " + this.encounter_data.battle_name.split(" at ")[0], this.context);

			let y = 100;
			if (!this.reward.no_reward) {
				if (this.reward.credits) {
		      var background = ST.moneyBackground(this.bdata, this.skill);
		      y += SU.wrapText(this.context, background, 75, y, 400, 20, SF.FONT_M, '#AAA');
					y += 30;
		      y += SU.wrapText(this.context, "Reward: "+SF.SYMBOL_CREDITS+this.reward.credits, 75, y, 400, 25, SF.FONT_MB, '#AAA');
	//				this.text_layout.prepLeft("Reward");
	//				this.text_layout.AddValue(SF.SYMBOL_CREDITS+this.reward.credits);
	//				y = 110;
	//	      y += SU.wrapText(this.context, "Reward", SF.HALF_WIDTH, y, 100, 25, SF.FONT_LB, '#AAA');
	//	      y += SU.wrapText(this.context, SF.SYMBOL_CREDITS+this.reward.credits, SF.HALF_WIDTH, y, 400, 25, SF.FONT_M, '#AAA');
				} else if (this.reward.ship) {
					y += SU.wrapText(this.context, "Reward: "+this.reward.ship.name, 75, y, 400, 20, SF.FONT_M, '#AAA');
				} else {
					this.skill = new SBar.Skill(this.reward.artifact);
					if (this.bdata && this.bdata.is_building_data) {
			      var background = ST.artiBackground(this.bdata, this.skill);
			      y += SU.wrapText(this.context, background, 75, y, 400, 20, SF.FONT_M, '#AAA');
					}
					y += 30;
					y += this.skill.WriteDetails(this.context, 75, y, /*width=*/400);
				}

				y += 30;
				let xp = round2good(SF.LEVEL_XP[this.bdata.level]/3);
				if (this.encounter_data.type == SF.BATTLE_PARTY) {
					xp = 0;
				}
	      y += SU.wrapText(this.context, "XP: "+xp, 75, y, 400, 20, SF.FONT_M, '#AAA');
				S$.AddXp("combat", xp);
			}
			
			this.AddHeroStatus();

			
//      var background = ST.DefeatBackground(this.bdata);
//      SU.wrapText(this.context, background, 100, 130, 400, 25, SF.FONT_L, '#AAA');

//      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
//      this.context.drawImage(this.staticImage, 0, 0);
			// Render every 50 ms, 100 times. Can tweak this based on performance.
			if (!this.reward.ship) {
				SU.clearText();
				SU.addText("1: Continue");							
			}
			this.handleUpdate();
			this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);			
			
    },
		
		DoArtifact: function() {
			let skill_type = SU.RandArtiType(this.seed, this.faction);
			if (this.faction === SF.FACTION_ALPHA || this.raceseed === SF.RACE_SEED_ALPHA) {
				skill_type = SF.SKILL_ALPHA;
				if (SU.r(this.seed, 91.2) < 0.25) {
					skill_type = SF.SKILL_OMEGA_FRAGMENT;
				}
			}			
			
			this.reward.artifact = SBar.ArtifactData(SU.r(this.seed, 72.1*S$.time), this.raceseed, this.bdata.level, skill_type);
//			SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(SU.r(this.seed, 72.1), this.raceseed, this.level, skill_type), this.data));
		},
		
		DoShip: function() {
			this.reward.ship = new SBar.Ship(/*type=*/SF.SHIP_ALPHA, /*level=*/this.bdata.level, this.bdata.seed, SF.RACE_SEED_ALPHA)
			SU.clearText();
			SU.addText("1: Inspect");
			SU.addText("SPACE: Take Ship");
			SU.addText("X: Leave Ship");
		},
		
		AddHeroStatus: function() {
			let hero_map = {};
			let encounter_map = {};
			for (let hero of S$.crew) {
				hero_map[hero.name] = hero;
			}
			let new_members = [];
			let same_members = [];
			let dead_members = [];
			for (obj in this.encounter_data.heroes) {
				let hero = this.encounter_data.heroes[obj];
				encounter_map[hero.name] = hero;
				if (hero.friendly) {
					if (hero.death_ticks > TF.MAX_DEATH_TICKS) {
						if (hero_map[hero.name]) {
							dead_members.push(hero);
						}  // Else a new hero died, leave them out of the list.
					}
					if (hero_map[hero.name]) {
						same_members.push(hero);
					} else {
						new_members.push(hero);
					}
				}
			}
			// Extra check for dead members, in case they're removed from the encounter hero list.
			for (let hero of S$.crew) {
				if (!encounter_map[hero.name] || encounter_map[hero.name].death_ticks > TF.MAX_DEATH_TICKS) {
					dead_members.push(hero);
				}
			}

			// Morale update before the rest.
			for (let x = 0; x < dead_members.length; x++) {
				for (obj in this.encounter_data.heroes) {
					let hero = this.encounter_data.heroes[obj];
					if (encounter_map[hero.name].death_ticks < TF.MAX_DEATH_TICKS) {
						SE.ApplyMorale(SE.MORALE_LOSE_TEAMMATE, hero);
					}
				}
			}
			for (let hero of dead_members) {
				for (let i = 0; i < S$.crew.length; i++) {
					if (S$.crew[i].name === hero.name) {
						S$.DropCrew(i);
					}
				}
			}
						
			this.text_layout.prepRight("Team Condition");
//			let y = 110;
//      y += SU.wrapText(this.context, "Team Condition", 100, y, 400, 25, SF.FONT_LB, '#AAA');
			if (same_members.length > 0) {
//				this.text_layout.AddTitle("Crew Status");
//	      y += SU.wrapText(this.context, "Crew Status", 100, y, 400, 25, SF.FONT_MB, '#AAA');
				for (let hero of same_members) {
					this.WriteHero(hero/*, hero_map[hero.name]*/)
				}
			}
			if (new_members.length > 0) {
				this.text_layout.AddTitle("New Crew Members");
//	      y += SU.wrapText(this.context, "New Crew Members", 100, y, 400, 25, SF.FONT_MB, '#AAA');
				for (let hero of new_members) {
					this.WriteHero(hero/*, hero_map[hero.name]*/)
					// Gained a hero.
					S$.AddCrew(TU.HeroToCrew(hero));
				}
			}
			if (dead_members.length > 0) {
				this.text_layout.AddTitle("Deceased Crew Members");
//	      y += SU.wrapText(this.context, "Deceased Crew Members", 100, y, 400, 25, SF.FONT_MB, '#AAA');
				for (let hero of dead_members) {
					this.WriteHero(hero/*, hero_map[hero.name]*/, /*dead=*/true)
				}
			}						
		},
		
		// Writes the hero details. Also updates their stats.
		WriteHero: function(hero, /*optional*/dead) {
			hero;  // Might not be in the crew array yet.
			let stats = /*updated_hero.name+" "+*/hero.health+"/"+hero.max_health;
			let original_crew = hero.original_crew;
			if (original_crew) {
				let health_change = hero.health - original_crew.health;
				if (health_change > 0) {
					stats += " (+"+health_change+")";
				} if (health_change < 0) {
					stats += " ("+health_change+")";
				}
			}
			stats += SF.SYMBOL_HEALTH+" ";
			stats += hero.morale;
			if (original_crew) {
				let morale_change = hero.morale - original_crew.morale;
				if (morale_change > 0) {
					stats += " (+"+morale_change+")";
				} if (morale_change < 0) {
					stats += " ("+morale_change+")";
				}
			}
				//stats += SF.SYMBOL_MORALE;
			stats += " "+SE.MoraleSymbol(hero.morale);
				//return SU.wrapText(this.context, stats, x, y, 400, 20, SF.FONT_M, '#AAA');
			if (dead) {
				stats = "";
			}
			this.text_layout.AddValue(hero.name, stats);
		},
		DoCredits: function() {
			this.reward.credits = round2good(SF.LEVEL_XP[this.encounter_data.level]*(SU.r(this.seed, 1.52)+1.0)/4);
			if (this.reward.credits <= 0) {
				this.reward.credits = 1;
			}
			if (this.pirate) {
				this.reward.credits *= 2;
			}
			S$.AddCredits(this.reward.credits);
		},		
    handleUpdate: function() {
			if (SG.activeTier != this) {
				return;
			}
			this.render_calls++;
			if (this.timeout == null) {
				return;
			}
			if (this.render_calls < 500) {
				this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);
			} else {
				this.timeout = null;
			}
			let rx = 2*this.render_calls/3 + 500/3;
      SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SC.layer2.drawImage(this.text_image, 0, 0);
			SC.layer2.save();
			SC.layer2.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			SC.layer2.rotate(rx*PIx2/500);
			SC.layer2.drawImage(this.background_image, -BACKGROUND_SIZE/2, -BACKGROUND_SIZE/2);
			SC.layer2.rotate(rx*PIx2/500);
			SC.layer2.drawImage(this.background_image, -BACKGROUND_SIZE/2, -BACKGROUND_SIZE/2);
			SC.layer2.rotate(rx*PIx2/500);
			SC.layer2.drawImage(this.background_image, -BACKGROUND_SIZE/2, -BACKGROUND_SIZE/2);
			SC.layer2.restore();
			return;
    },
    handleKey: function(key) {
      switch (key) {
        case SBar.Key.NUM1:
					if (this.reward.ship) {
						SU.PushTier(new SBar.ArtifactComplexRenderer(this.reward.ship, undefined, /*view_only=*/true));						
						break;
					}
        case SBar.Key.SPACE:
					if (this.reward.ship) {
						if (S$.tow_ship) {
							SU.message("Lose ship in tow");
							return;
						} else {
							if (S$.conduct_data['escape_pod']) {
								SU.message(SF.CONDUCTS['escape_pod'].title);
								return;
							}
							S$.tow_ship = S$.ship;
							S$.game_stats.ships_acquired++;
							S$.ship = this.reward.ship;
							SU.message("Old ship in tow");
							this.teardown();
						}
						break;
					}
        case SBar.Key.X:
        case SBar.Key.ESC:
					if (S$.tow_ship && this.bdata.is_building_data) {
						// Leave it behind.
						S$.AddCustomBuilding(this.bdata.parentData, this.reward.ship.seed, SF.TYPE_CUSTOM_SHIP, this.bdata.x, this.bdata.y, this.reward.ship);
					}
					this.teardown();
					break;
        default:
          error("unrecognized key pressed in hwinr: " + key);
      }
    },
		teardown: function() {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			SU.CleanImageCache();
			SU.PopTier();
			//new SBar.Treasure(this.bdata).activate();
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			if (this.reward.artifact) {
				let target = this.skill.type == SF.SKILL_SHIP ? S$.ship : S$.crew[0];
	      SU.PushTier(new SBar.ArtifactComplexRenderer(target, this.reward.artifact));				
			}
		},
  };
})();
