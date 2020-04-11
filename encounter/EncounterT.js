(function() {
	SBar.EncounterTier = function(encounterData, callback) {
		this._initEncounterTier(encounterData, callback);
	};

	SBar.EncounterTier.prototype = {
		type: SF.TIER_ENCOUNTER,
		data: null,
		callback: null,
		renderer: null,
		
		blind_brawl_casualty: null,
		bribe_cost: null,
		checked_mutiny: false,
		added_effects: false,

		_initEncounterTier: function(encounterData, callback) {
			this.data = encounterData;
			this.callback = callback;
			this.context = SC.layer1;
			
			this.blind_brawl_casualty = this.BlindBrawlCasualty();
			let raw_bribe_cost = SF.LEVEL_XP[this.data.level]*(0.5+SU.r(this.data.seed, 1.16)/2)+1;
			if (this.data.battle_type == SF.BATTLE_PIRATE || this.data.battle_type == SF.BATTLE_BARFIGHT) {
				this.bribe_cost = round2good(raw_bribe_cost/4);
			} else if (this.data.battle_type == SF.BATTLE_POLICE) {
				this.bribe_cost = round2good(raw_bribe_cost/2);
			} else if (this.data.battle_type == SF.BATTLE_QUEST) {
				this.bribe_cost = round2good(raw_bribe_cost/3);
			} else if (this.data.battle_type == SF.BATTLE_RACE_MILITARY) {
				this.bribe_cost = round2good(raw_bribe_cost*2);
			} else if (this.data.battle_type == SF.BATTLE_AMBUSH) {
				this.bribe_cost = round2good(raw_bribe_cost);
			}			
		},

		// Note this is re-called after mutiny check.
		activate: function() {
			this.renderer = new SBar.EncounterRenderer(this);
			//SG.activeTier.teardown();
			SG.in_battle = true;
			SG.activeTier = this;
			
			this.AddHeroEffects();
			this.renderer.render();

			if (S$.conduct_data['war']) {
				// Straight to combat.
				SU.message(SF.CONDUCTS['war'].title);
				this.Engage();
				return;
			}
		},

		AddHeroEffects: function() {
			if (this.added_effects) {
				return;
			}
			this.added_effects = true;
			let battle_effect = null;
			let drink_effect = null;
			if (this.data.battle_effect) {
				battle_effect = new SBar.PersistEffect(this.data.battle_effect);
			}
			if (this.data.num_drinks) {
				let name = "Inebriated";
				drink_effect = new JTact.SpeedEffect(name, 1-this.data.num_drinks/15, TF.FOREVER);
	      TG.icons[name] = TU.randIcon(this.data.seed, drink_effect.symbol);
			}
			for (hero of this.data.heroes) {
				if (hero.friendly && battle_effect) {
					battle_effect.Apply(hero);
				}
				if (hero.friendly && drink_effect) {
					TU.cloneEffect(drink_effect).apply(hero, hero); 				
				}
				if (hero.seed !== SF.RACE_SEED_HUMAN && hero.seed !== SF.RACE_SEED_ALPHA) {
					// Not the player.
					new SBar.PersistEffect({name: hero.name, seed: hero.seed, level: hero.level, hero: hero}).Apply(hero, hero);
				}
		    for (ability of hero.abilities) {
					for (effect of ability.effects) {
						if (effect.full_wmd_effect) {
							new SBar.PersistEffect({name: "WMD Essence", seed: hero.seed, level: hero.level, hero: hero, full_wmd: true}).Apply(hero, hero);
						}
					}
		    }
				
			}
		},
	
		viewCallback: function() {
			// Done viewing.
			SG.activeTier = this;
			this.renderer = new SBar.EncounterRenderer(this);
			this.renderer.render();
		},
		
		// Flee successful, but a crew got left behind.
		FleeOneLeftBehind() {
			let crew_index = Math.floor(SU.r(this.data.seed, 1.16)*(S$.crew.length-1))+1;
			let crew = S$.crew[crew_index];
			var flee_callback = function(go_back) {
				if (go_back) {
					this.EngageConfirm();
				} else {
		      SU.message("Flee successful.");
					S$.DropCrew(crew_index);
					this.data.fled = true;
					this.EndCombat();
				}
			}
			let text = "The ship is sealed. The thrusters engaged. You barely made it, but you made it. Except upon inspecting the crew you notice "+crew.name+" got left behind. Go back for "+ST.genl[crew.gender]+"?";
			SU.ConfirmWindowInterrupt("The One That Got Away", text, flee_callback.bind(this), '😈');
		},
		
		FightFluffy: function() {
			let any_enemy = null;
			// Remove the enemies. Pick a sample enemy to overwrite.
			for (let i = this.data.heroes.length-1; i >= 0; i--) {
				let candidate = this.data.heroes[i];
				if (!candidate.friendly) {
					if (any_enemy === null) {
						any_enemy = candidate;
					}
					this.data.heroes.splice(i, 1);
				}
			}
			if (any_enemy === null) {
				// Just in case.
				this.EngageConfirm();
			}
			
			let friendly = false;
			let fluffy = new JTact.Hero();
			let raceseed = this.data.seed+1.2;
			let name = ST.getWord(raceseed, this.data.seed+1.3);
			let level = capLevel(this.data.level+Math.round(SU.r(this.data.seed, 5.36)*3)+1);
			fluffy._initHero(any_enemy.x, any_enemy.y, friendly, name, 7, level, this.data.seed+1.4, raceseed);
			fluffy.SetHealth(Math.floor((0.8+SU.r(this.data.seed, 5.3)/2)*level*13));
			fluffy.morale = 50;
			fluffy.personality = SF.P_FERAL;
			fluffy.is_feral = true;
			fluffy.for_export_artis = [];			
			for (var i = 0; i < 4; i++) {
				let arti = SBar.ArtifactData(SU.r(this.data.seed, i+1.17), this.data.seed+1.9, level, SF.SKILL_STANDARD, /*for_ai=*/true);
				if (i == 0) {
					arti.params[0].type = SF.SKILL_DAMAGE;
				}
				fluffy.addBuiltAbility(new SBar.Skill(arti).ability, friendly);
				fluffy.for_export_artis.push(arti);
			}
			this.data.heroes.push(fluffy);
			this.EngageConfirm();
		},
		
		// Crew flee failed, but they're given another chance.
		FleeSympathy: function() {
			let index = Math.floor(SU.r(this.data.seed, 1.25)*4);
			//index = 3;
			switch (index) {
				case 0:
					this.data.fled = true;
					this.EndCombat();
					SU.ShowWindowInterrupt("A Second Chance","As your crew attempts to flee you get blocked at the door.\n\nThen, silently and without explanation, the enemy steps aside. And looks the other way.", undefined, '☮');
					break;
				case 1: {
					let text = "The enemy blocks your escape. They surround you and poke and prod you into a group. The leader wobbles forward, seemingly amused,\n\n\"Tell you what... we haven't had much fun in awhile. We'll let you go if you play with our pet first.\"";
					let callback = function(confirmed) {
						if (confirmed) {
							this.FightFluffy();
						} else {
							this.EngageConfirm();
						}
					}
					SU.ConfirmWindowInterrupt("A Slobbering Proposal", text, callback.bind(this), '👾');
					} break;
				case 2: {
					// This works also for 0 money. Why not, poverty is peaceful.
					let callback = function(confirmed) {
						if (confirmed) {
							S$.credits = 0;
							this.data.fled = true;
							this.EndCombat();
						} else {
							this.EngageConfirm();
						}
					}
					SU.ConfirmWindowInterrupt("Mugged", "You can't run. But they offer your lives for all your money.", callback.bind(this), '💸');
					} break;
				case 3: {
					if (S$.crew.length <= 1) {
						this.EngageConfirm();
						return;
					}
					let crew_index = Math.floor(SU.r(this.data.seed, 1.16)*(S$.crew.length-1))+1;
					let crew = S$.crew[crew_index];
					let callback = function(confirmed) {
						if (confirmed) {
							S$.DropCrew(crew_index);
							for (let obj in this.data.heroes) {
								let hero = this.data.heroes[obj];
								if (!hero.is_player && hero.friendly) {
									SE.ApplyMorale(SE.MORALE_SLAVERY_YES, hero)
								}
							}
							this.data.fled = true;
							this.EndCombat();
						} else {
							for (let obj in this.data.heroes) {
								let hero = this.data.heroes[obj];
								if (!hero.is_player && hero.friendly) {
									SE.ApplyMorale(SE.MORALE_SLAVERY_NO, hero)
								}
							}
							this.EngageConfirm();
						}
					}
					SU.ConfirmWindowInterrupt("What We Become", "You fail to run. But they offer to cut you a deal: you get to go free in exchange for "+crew.name+".", callback.bind(this), '⛓');
					} break;
				default:
					error("nofsym");
			}			
		},
		
		flee: function() {
			if (this.data.flee_chance <= 0) {
				// Flee is not an option.
				return;
			}
			S$.game_stats.times_fled++;
			//this.data.flee_chance = 1;
			if (SU.r(this.data.seed, 1.13)*100 >= this.data.flee_chance) {
	      SU.message("Flee failed.");
				if (SU.r(this.data.seed, 1.24) < 0.2) {
					this.FleeSympathy();
				} else {
					this.data.flee_chance = 0;
					this.activate();
					//this.EngageConfirm();
				}
				return;
			}
			for (let obj in this.data.heroes) {
				let hero = this.data.heroes[obj];
				if (!hero.is_player && hero.friendly) {
					SE.ApplyMorale(SE.MORALE_FLEE, hero);
				}
			}
			
			if (S$.crew.length > 1 && SU.r(this.data.seed, 1.14) < 0.2) {
				this.FleeOneLeftBehind();
				return;
			}
			
      SU.message("Flee successful.");
			this.data.fled = true;
			this.EndCombat();
		},
		
		withdraw: function() {
			this.data.withdrew = true;
			this.EndCombat();
		},
		
		CheckHealParty: function() {
			if (S$.in_alpha_space) {
				return;
			}
			let has_healing = TU.HasHealingHeroes(this.data.heroes);
			if (!has_healing) {
				return;
			}
			let any_healed = false;
			for (let obj in this.data.heroes) {
				let hero = this.data.heroes[obj];
				if (hero.health < hero.max_health) {
					hero.health = hero.max_health;
					any_healed = true;
				}
			}
			if (any_healed) {
				SU.message("Crew healed")
			}
		},		
		
		win: function(/*optional*/skip_win_renderer) {
			if (this.data.battle_type !== SF.BATTLE_PARTY) {
				S$.grace_period_time_start = -100;  // Any attacks anywhere remove the grace period for running away.
				for (let obj in this.data.heroes) {
					let hero = this.data.heroes[obj];
					if (!hero.is_player && hero.friendly) {
						SE.ApplyMorale(SE.MORALE_WIN, hero);
					}
				}
			}
			this.data.won = true;
			this.CheckHealParty();
			this.EndCombat();
			if (!skip_win_renderer) {
				let winner = new SBar.HandleWinRenderer(this.data, this.data.building_data);
				if (this.data.reward) {
					winner.SetReward(this.data.reward)
				}
				SU.PushTier(winner);
			}
		},
		
		lose: function() {
			this.data.lost = true;
			this.EndCombat();
			new SBar.HandleLossRenderer(this.data, this.data.building_data).activate();
		},
		
		tie: function() {
			this.data.withdrew = true;
			this.EndCombat();
			// For now need to use the win renderer to change battle status.
			let winner = new SBar.HandleWinRenderer(this.data, this.data.building_data);
			winner.title_message = "Flee";
			winner.SetReward({no_reward: true})
			SU.PushTier(winner);
		},
		
		EndCombat: function() {
			SU.CopyCrewBattleStats(/*add_health=*/true, this.data);
			SG.in_battle = false;
			this.teardown();
			TG.icons = {};
			TG.icons2 = {};
			SU.PopBattleTier();
			if (this.callback) {
				this.callback(this.data);
			}
		},
		
		// Note this doesn't close out combat (used also for going to TactT). See EndCombat.
		teardown: function() {
			TG.controller = null;  // To be extra sure.
			this.renderer.teardown();
		},
		
		battleCallback: function(tact_data) {
			if (tact_data.battle_won) {
				this.win();
			} else if (tact_data.battle_lost) {
				this.lose();
			} else {
				this.tie();
			}
		},
			
			
		AbandonShipCallback: function(abandon) {
			if (!abandon) {
				// Declined to go through with the abandon.
				return;
			}
			S$.game_stats.ships_abandoned++;
			if (SU.r(this.data.seed, 1.14)*100 >= this.data.abandon_chance) {
	      SU.message("Abandon failed.");
				for (let obj in this.data.heroes) {
					let hero = this.data.heroes[obj];
					if (!hero.is_player && hero.friendly) {
						SE.ApplyMorale(SE.MORALE_ABANDON, hero);
					}
				}
				this.data.abandon_chance = 0;
				this.activate();
				//this.EngageConfirm();
				return;
			}
			
			let crew_saved_index = 0;
			let crew_saved = null;
			if (S$.crew.length > 1 && SU.r(this.data.seed, 1.17) < 0.35) {
				crew_saved_index = Math.floor(SU.r(this.data.seed, 1.16)*(S$.crew.length-1))+1;
				crew_saved = S$.crew[crew_saved_index];
			}
				
			if (S$.crew.length > 1) {
				for (let i = S$.crew.length-1; i > 0; i--) {
					if (i !== crew_saved_index) {
						S$.DropCrew(i);
					}
				}
	      SU.message("Abandoned crew.");
			}
			S$.ship = new SBar.Ship(SF.SHIP_POD, /*level=*/1, S$.ship.seed+1, 0);
			S$.tow_ship = null;
      SU.message("Launched escape pod.");
			
			this.data.fled = true;
			this.EndCombat();
			if (crew_saved_index > 0) {
				SU.ShowWindowInterrupt("Stowaway","As your escape pod hatch rolls closed "+crew_saved.name+" jumps in. "+ST.genup[crew_saved.gender]+" doesn't look entirely pleased with you.", undefined, '🖕');
				SE.ApplyMorale(SE.MORALE_JOINED_ABANDON, crew_saved);
			}
		},
		
		// Launches an escape pod without the crew.
		AbandonShip: function() {
			if (S$.ship.ship_type === SF.SHIP_POD) {
				return;
			}
			let text = "Really abandon ship?";
			if (S$.crew.length > 1) {
				text = "Really abandon ship and crew?";
			}		
			SU.ConfirmWindowInterrupt("A Good Captain...", text, this.AbandonShipCallback.bind(this), '😈')			
		},
				
		// Returns true if blind brawl will result in a death.
		BlindBrawlCasualty: function() {
			let cost = this.data.blind_brawl_cost;
			for (let hero of this.data.heroes) {
				if (hero.friendly && cost >= hero.health) {
					return true;
				}
			}
			return false;
		},
		
		DoBlindBrawl: function() {
			S$.game_stats.blind_brawls++;
			this.BattleMoraleOnce();
			if (this.CheckMoraleImpact()) {
				return;
			}
			let cost = this.data.blind_brawl_cost;
			for (let obj in this.data.heroes) {
				let hero = this.data.heroes[obj];
				hero.health -= cost;
			}
			this.win();
		},
		
		CheckBattlePartyMutiny(name_to_hero) {
			let enemy_personalities = {};
			let enemy_names = {};
			for (let obj in this.data.heroes) {
				let candidate = this.data.heroes[obj];
				if (!candidate.friendly) {
					enemy_personalities[candidate.personality] = true;
					enemy_names[candidate.name] = true;
				}
			}
			let message = "";
			// Morale-based joinings.
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (!enemy_names[crew.name]) {
					// Not yet an enemy. Check if they join in.
					if (crew.LowMorale() && SU.r(crew.seed, 86.21) < 0.5) {  // OK to not have fully random here. They won't stick around.
						enemy_names[crew.name] = true;
						enemy_personalities[crew.personality] = true;
						message += crew.name+" has a bone to pick.\n";
						name_to_hero[crew.name].friendly = false;
						S$.DropCrew(crew.GetCrewIndex());
					}
				}
			}
			// Personality-based joinings.
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (!enemy_names[crew.name]) {
					// Not yet an enemy. Check if they join in.
					if (enemy_personalities[crew.personality] && !crew.HappyMorale() && SU.r(crew.seed, 86.22) < 0.1) {
						enemy_names[crew.name] = true;
						message += crew.name+" is sympathetic to resistence members.\n";
						name_to_hero[crew.name].friendly = false;
						S$.DropCrew(crew.GetCrewIndex());
					}
				}
			}
			if (message == "") {
				return false;
			}
			SU.ShowWindowInterrupt("Mutiny!","Some crew decide it's time for a change in leadership!\n\n"+message, this.activate.bind(this), '⤭');
			this.data.RecomputeMutiny();			
			return true;
		},
		
		// Check if any crew switch sides. Return true if so, and shows details and rebuilds the battle screen.
		CheckMoraleImpact: function() {
			if (this.checked_mutiny) {
				return false;
			}
			this.checked_mutiny = true;
			let name_to_hero = {};
			for (let obj in this.data.heroes) {
				let hero = this.data.heroes[obj];
				name_to_hero[hero.name] = hero;
			}

			if (this.data.battle_type === SF.BATTLE_PARTY) {
				return this.CheckBattlePartyMutiny(name_to_hero);
			}
			if (this.data.battle_type === SF.BATTLE_ANIMAL) {
				return false;
			}
			
			// Check any deserters.
			let message = "Facing a great threat,\n\n";
			let num_added = 0;
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				let hero = name_to_hero[crew.name];
				if (this.data.blind_brawl_cost > crew.health * (1+SU.r(crew.seed, this.data.seed+8.21)*2)) {
					if (SU.r(crew.seed, this.data.seed+8.02)*100 < crew.morale) {
						// Crew panicks.
						++num_added;
						if (crew.personality === SF.P_ROGUE || SU.r(crew.seed, this.data.seed+8.22) < 0.1) {
							message += "  "+crew.name +" deserts and joins the superior team.\n"
							hero.friendly = false;
							S$.DropCrew(crew.GetCrewIndex());
						} else {
							message += "  "+crew.name +" panicks.\n"
							let name = "Panicked";
							let effect = new JTact.FearEffect(name, TF.FOREVER);
							if (!TG.icons[name]) {
					      TG.icons[name] = TU.randIcon(this.data.seed, effect.symbol);
							}
							TU.cloneEffect(effect).apply(hero, hero); 				
						}
					}
				}
			}
			if (num_added > 0) {
				SU.ShowWindowInterrupt("Overwhelming Odds", message, this.activate.bind(this), '☠');
				return true;
			}
			// Check if any enemies want to join the player. Trigger occasionally if the player has overwhelming force.
			if (this.data.battle_type !== SF.BATTLE_ANIMAL && this.data.blind_brawl_cost < S$.crew[0].health/2 && SU.r(this.data.seed, 8.91) < 0.25) {
				let enemies = [];
				for (let hero of this.data.heroes) {
					if (!hero.friendly && !hero.is_alpha_boss) {
						enemies.push(hero);
					}
				}
				if (enemies.length > 0) {
					let me = this;
					let target_hero = enemies[Math.floor(SU.r(this.data.seed, 8.92)*enemies.length)];
					let target_crew = TU.HeroToCrew(target_hero);
					let end_callback = function() {
						this.activate();
					}
					var hire_tier = new SBar.HireDisplay(0, 0, 0, end_callback.bind(this));
					hire_tier.crew_override = target_crew;
					hire_tier.free = true;
					hire_tier.description_override = target_hero.name+", extremely panicked, offers to join your crew in exchange for their life and a small stipend.";
					let accept_callback = function() {
						// Player accepted the join request.
						target_hero.friendly = true;
					}
					hire_tier.accept_override = accept_callback.bind(this);
					SU.PushTier(hire_tier);
					return true;
				}
			}			
			
			return false;
		},
		
		EngageConfirm: function() {
			var battle = new SBar.TactTier(this.data, this.battleCallback.bind(this));
			battle.activate();
		},
		
		// Do battle.
		Engage: function() {
			this.BattleMoraleOnce();
			if (this.CheckMoraleImpact()) {
				return;
			}			
			this.EngageConfirm();
		},
		
		BattleMoraleOnce: function() {
			if (this.checked_mutiny) {
				return;
			}
			if (S$.conduct_data['figurehead']) {
				for (let obj in this.data.heroes) {
					let hero = this.data.heroes[obj];
					if (hero.name == S$.crew[0].name) {
						let name = "Figurehead";
						let effect = new JTact.FearEffect(name, TF.FOREVER);
						if (!TG.icons[name]) {
				      TG.icons[name] = TU.randIcon(this.data.seed, effect.symbol);
						}
						TU.cloneEffect(effect).apply(hero, hero);
						break;						
					}
				}
			}
			
			
			this.data.ComputeEngageFlee();
			
			let morale_obj = null;
			if (!this.data.attacking) {
				// Player is defending, presumably against an enemy. Props to them.
				morale_obj = SE.MORALE_BATTLE_ENEMY;
			} else switch (this.data.battle_type) {
				case SF.BATTLE_ALPHA:
				case SF.BATTLE_PIRATE:
				case SF.BATTLE_QUEST:
					// Good fights.
					morale_obj = SE.MORALE_BATTLE_ENEMY;
					break;
				case SF.BATTLE_ANIMAL:
				case SF.BATTLE_ARENA:
				case SF.BATTLE_BARFIGHT:
				case SF.BATTLE_CORNFIELD:
					// Neutral (ish).
					morale_obj = SE.MORALE_BATTLE_NEUTRAL;
					break;
				case SF.BATTLE_POLICE:
				case SF.BATTLE_RACE_MILITARY:
				case SF.BATTLE_SHOP:
					// Society frowns upon these.
					morale_obj = SE.MORALE_BATTLE_FRIENDLY;
					break;
				case SF.BATTLE_PARTY:
					// Morale is handled in crew.js.
					break;
				default:
					error("need to set battlem1",this.data.battle_type);
					break;
			}
			if (morale_obj === null) {
				return;
			}
			for (let obj in this.data.heroes) {
				let hero = this.data.heroes[obj];
				if (!hero.is_player && hero.friendly) {
					SE.ApplyMorale(morale_obj, hero)
				}
			}
		},

		handleKey: function(key) {
			switch (key) {
				case SBar.Key.E:
					this.Engage();
					break;
				case SBar.Key.F:
					// Flee.
					this.flee();
					break;
				case SBar.Key.X:
					if (this.data.flee_chance >= 100) {
						this.withdraw();
						return;
					}
				case SBar.Key.B:
					// Brawl.
					if (!this.blind_brawl_casualty) {
						this.DoBlindBrawl();
					}
					break;
				case SBar.Key.R:
					// Bribe.
					if (this.bribe_cost && S$.credits >= this.bribe_cost) {
						S$.RemoveCredits(this.bribe_cost);
			      SU.message("Bribe successful.");
						this.withdraw();
					}
					break;
				case SBar.Key.A:
					if (this.data.abandon_chance > 0) {
						this.AbandonShip();
					}
					break;
				case SBar.Key.V:
					// View.
					var battle = new SBar.TactTier(this.data, this.viewCallback.bind(this), /*view_only=*/true);
					battle.activate();
					break;
				case SBar.Key.W:
					if (SF.EXIT_BATTLE_OPTION) {
						this.win(/*skip_win_renderer=*/true);
					}
					break;
				default:
					error("unrecognized key pressed in encounter: " + key);
			}
		},
		HandleClick: function(x, y) {},

	};
	SU.extend(SBar.EncounterTier, SBar.Data);
})();
