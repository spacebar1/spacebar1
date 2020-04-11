(function() {

	var abilityKeyCodes = [SBar.Key.Q, SBar.Key.W, SBar.Key.E, SBar.Key.R, SBar.Key.T, SBar.Key.Y, SBar.Key.U, SBar.Key.I, /*SBar.Key.O, */SBar.Key.P, SBar.Key.LEFT_BRACKET, SBar.Key.RIGHT_BRACKET, SBar.Key.H, SBar.Key.J, SBar.Key.K, SBar.Key.L]; // ability index maps to key codes
	var num_snapshots = 20;

	SBar.TactTier = function(TactData, callback, view_only) {
		this._initTactTier(TactData, callback, view_only);
	};

	SBar.TactTier.prototype = {
		type: SF.TIER_TACT,
		data: null,
		callback: null,
		renderer: null,
		hero_counter: 0, // Used for turn order.
		//heroes: null,
    targeting: null,
    firstTarget: null,
    selectedAbility: null,
		snapshots: null,
		mgridx: null,
		mgridy: null,
		view_only: null,  // Can't pass turns, just exit button.
		doing_ai: null,
		friendly_ai: false,  // Player requested to auto-run battle.
		torn_down: null,  // Battle has been dismantled.
		wmd_full_fragment_activated: false,
		wmd_recur_fragment_activated: false,
		wmd_fragment_turn_back_clock: false,

		_initTactTier: function(TactData, callback, view_only) {
			this.data = TactData;
			this.callback = callback;
			this.context = TC.layer1;
			this.view_only = view_only;
			//this.heroes = [];
			this.snapshots = {};
		},

		activate: function( /*static-only*/ ) {
      SG.activeTier.teardown();
	    SG.activeTier = this;
			
			TG.controller = this;
				
			TG.data.heroes = {};
			TG.data.turn = 0;
			TG.data.turnEngine = new JTact.TurnEngine(this.view_only);
			TG.data.ai = new JTact.AI();
			this.renderer = new SBar.TactRenderer(this);
			
			// Add the heroes in a separate loop, so that there's no triggered effects with partial setup (like end of game check).
			for (hero of this.data.heroes) {
				this.addHero(hero);
			}
			this.setInitialThreats();

			this.renderer.render();
			
			this.snapShot();
			TG.data.turnEngine.checkNextTurn();
		},
		
		// Save a turn snapshot. For now only save num_snapshots turns back, to cap memory
		// (not that it would be a lot).
		snapShot: function() {
			let snapshot = {'turnengine': TG.data.turnEngine.clone(), 'heroes': {}};
			for (let hero_obj in TG.data.heroes) {
				snapshot.heroes[hero_obj] = TG.data.heroes[hero_obj].fullcopy();
			}
			this.snapshots[TG.data.turn] = snapshot;
			let erase_time = TG.data.turn-num_snapshots;
			if (this.snapshots[erase_time] && erase_time !== 0) {  // Don't erase the start.
				delete this.snapshots[erase_time];
			}
		},
		// Flags end game bits. Doesn't call teardown- map stays interactive.
		CheckEnd: function() {
			if (this.view_only) {
				return;
			}
			let alive_player = false;
			let num_friendly = 0;
			let num_enemy = 0;
			//TG.data.FilterDeadHeroes();
			for (var obj in TG.data.heroes) {
				let hero = TG.data.heroes[obj];
				if (hero.health > 0) {
					hero.friendly ? ++num_friendly : ++num_enemy;
				}
				if (hero.is_player && !hero.dead) {
					alive_player = true;
				}
			}
			if (num_friendly === 0 || !alive_player) {
				this.data.battle_lost = true;
				this.data.battle_won = false;
				this.view_only = true;
				this.friendly_ai = false;
				return;
			}
			if (num_enemy === 0) {
				this.data.battle_won = true;
				this.friendly_ai = false;
				return;
			}
			// Play continued but the win condition ended (like a controlled enemy flipped back to being an enemy).
			if (this.data.battle_won || this.data.battle_lost) {
				delete this.data.battle_won;
				delete this.data.battle_lost;
			}
			return;
		},
		// Declare victory if no damage for num_snapshots turns. This is useful for stalemates and also if
		// something went wrong (bug) in the map.
		CheckStalemate: function() {
			if (TG.data.turn > 200) {
				// Long battle stalemates can happen if both sides have lots of heal.
				this.data.battle_draw = true;
				this.doing_ai = false;
				this.teardown();
				return true;
			}
			if (TG.data.turn < num_snapshots) {
				return false;
			}
			if (this.data.battle_won || this.data.battle_lost) {
				return false;
			}
			// Just check if all healths and hero counts in all snapshots match.
			var hero_healths = {};
			var num_heroes = -1;
			for (var snapshot_obj in this.snapshots) {
				var snapshot = this.snapshots[snapshot_obj];
				for (var hero_obj in snapshot.heroes) {
					var hero = snapshot.heroes[hero_obj];
					if (hero_healths[hero.name] == undefined) {
						hero_healths[hero.name] = hero.health;
					} else {
						if (hero_healths[hero.name] !== hero.health) {
							return false;
						}
					}
				}
				if (num_heroes < 0) {
					num_heroes = Object.keys(snapshot.heroes).length;
				} else {
					if (Object.keys(snapshot.heroes).length !== num_heroes) {
						return false;
					}
				}
			}
			SU.message("Stalemate.")
			this.data.battle_draw = true;
			this.doing_ai = false;
			this.teardown();
			return true;			
		},
		// Resets the game to a point in time.
		// Cooldowns of rewind abilities won't be reset, to prevent infinite retries.
		applyTime: function(turn, used_skill_name) {
			if (turn < 0) turn = 0;
			let snapshot = this.snapshots[turn];
			if (!snapshot) {
				// Erased the snapshot. Abort.
//				TG.data.turnEngine.queueTurnEnd();
				SU.message("Malfunction");
				return;
			}			
			TG.data.turn = turn;
			for (let heroname in TG.data.heroes) {
				let hero = TG.data.heroes[heroname];
				TG.data.map.updateBarrier(hero.x, hero.y, hero.size, false);
			}
			TG.data.heroes = {};
			for (let hero_obj in snapshot.heroes) {
				TG.data.heroes[hero_obj] = snapshot.heroes[hero_obj].fullcopy();
				
				// Set a cooldown on all items that trigger the time rewind.
				// There still potential to go back to the beginning here, if the cooldown is < time back.
				// Wait to see if that's a major problem.
				for (let hero_obj in TG.data.heroes) {
					let hero = TG.data.heroes[hero_obj];
					for (let ability of hero.abilities) {
						for (let effect of ability.effects) {
							if (effect.turnsBack) {
								ability.cooldown = ability.cooldownTime;
							}
						}
					}	
				}
				/*
				let dest_hero = TG.data.heroes[hero_obj];
				for (var i = 0; i < dest_hero.abilities.length; i++) {
					let dest_ability = dest_hero.abilities[i];
				  if (dest_ability.displayName === used_skill_name && dest_ability.cooldownTime > 0) {
						dest_ability.cooldown = TG.data.turn + dest_ability.cooldownTime;
					}
				}	
				*/			
			}
			let snap_turn_engine = snapshot['turnengine'].clone();
			for (let obj in snap_turn_engine) {
				TG.data.turnEngine[obj] = snap_turn_engine[obj];
			}
			for (let heroname in TG.data.heroes) {
				let hero = TG.data.heroes[heroname];
				if (!hero.dead) {
					TG.data.map.updateBarrier(hero.x, hero.y, hero.size, true);
				}
			}
			
			let orig_renderer = this.renderer;
			orig_renderer.teardown();
			this.renderer = new SBar.TactRenderer(this);
			this.renderer.messageLogs = orig_renderer.messageLogs;
			this.renderer.render();
//			TG.data.turnEngine.queueTurnEnd();
		},

		deselectAbility: function() {
			if (TG.overlay !== null) {
				TG.overlay.teardown();
				return;
			}
			this.clearSelected();
			this.selectedAbility = null;
		},
		
		// Get a hero by index, though the heroes don't have a strict order.
		// Used for hotkeys.
		GetHeroByNum: function(num, friendly) {
			for (var obj in TG.data.heroes) {
				let hero = TG.data.heroes[obj];
				if (!hero.dead && hero.friendly === friendly) {
					if (num <= 0) {
						return hero;
					}
					--num;
				}
			}
			return null;
		},

		handleKey: function(code) {
			if (code === SBar.Key.N) {
				if (S$.conduct_data['can_restart_battle']) {
					let callback = function(confirmed) {
						if (confirmed) {
							SU.message("Restarted");
							this.data.battle_lost = false;
							this.data.battle_won = false;
							this.view_only = false;
							this.friendly_ai = false;
							this.applyTime(0);
							TG.data.turnEngine.checkNextTurn();
						}
					}
					SU.ConfirmWindow("Lucid Dreaming", "Really restart combat?", callback.bind(this), '?');			
				}
				return;
			}
			if (code >= SBar.Key.SHIFT0 && code <= SBar.Key.SHIFT9) {
				let num = code-SBar.Key.SHIFT0-1;
				if (num >= 0) {
					this.renderer.mouseMoved(0,0);  // Clear.
					let hero = this.GetHeroByNum(num, /*friendly=*/false)
					if (hero !== null) {
						//this.renderer.displaySelected(hero);
						this.renderer.stickySelect(hero);
					}
				}
				return;
			} else if (code >= SBar.Key.NUM0 && code <= SBar.Key.NUM9) {
				this.renderer.mouseMoved(0,0);  // Clear.
				let num = code-SBar.Key.NUM0-1;
				if (num >= 0) {
					this.renderer.mouseMoved(0,0);  // Clear.
					let hero = this.GetHeroByNum(num, /*friendly=*/true)
					if (hero !== null) {
						this.renderer.stickySelect(hero);
					}
				}
				return;
			}
			if (code === SBar.Key.G) {
				this.renderer.show_grid = !this.renderer.show_grid;
				this.renderer.redrawMap();
				this.MouseMove(SG.mx, SG.my, /*force=*/true);
				return;
			}
			if (code === SBar.Key.B) {
				this.renderer.BattleLog();
				return;
			}
			if (this.view_only || (code === SBar.Key.X && (this.data.battle_lost || this.data.battle_won))) {
				if (code === SBar.Key.X) { // Exit.
					this.expireAllEffectsAtEnd();
					this.teardown();
					return;
				}
				return;				
			}
			if (this.selectedAbility && code === SBar.Key.X) {
				this.deselectAbility();
				return;
			}
			
			// Debug escape to allow viewing from a logic crash on AI.
			if (code === SBar.Key.M) {
				this.doing_ai = false;
				return;
			}
			if (code === SBar.Key.A) {
				if (this.friendly_ai) {
					this.friendly_ai = false;
				} else {
					this.EnableFriendlyAi();
				}
				return;
			}
			if (this.doing_ai && !this.view_only) {
				error("ignore input during npc (1)");
				return;
			}
			try {
				if (code === SBar.Key.ESC) { // cancel
					this.deselectAbility();
					return;
				}
				var hero = TG.data.activeHero;

				if (code === SBar.Key.S) { // move
					//this.selectedAbility = TG.controller.getMoveAbility(hero);
					//if (hero.moveAbility.cooldown <= TG.data.turn) {
						if (this.selectedAbility == hero.moveAbility) {
							this.deselectAbility();
						} else {
							this.selectedAbility = hero.moveAbility;
						}
					//}
				} else if (code === SBar.Key.D) { // defend, skip a turn
					this.selectedAbility = hero.defendAbility;
				} else {
					for (var i = 0; i < hero.abilities.length; i++) {
						if (abilityKeyCodes[i] === code) {
							if (this.selectedAbility == hero.abilities[i]) {
								this.deselectAbility();
							} else {
								var ability = hero.abilities[i];
								if (ability.cooldown <= TG.data.turn /*&& (ability.energy === null || ability.energy <= hero.energy)*/) {
									this.selectedAbility = hero.abilities[i];
								}
							}
						}
					}
					// else wrong key mashed or ability is not available, toss it
				}

				this.clearSelected();

				if (this.selectedAbility !== null) {
					if (this.selectedAbility.target === null) {
						// Auto cast, non-targeted self.
						TG.controller.explicitCast(hero, hero, this.selectedAbility);
						this.selectedAbility = null;
						this.clearSelected();
					} else if (this.selectedAbility.target.global) {
						// Auto cast, non-targeted global.
						TG.controller.GlobalCast(hero, this.selectedAbility);
						this.selectedAbility = null;
						this.clearSelected();
					} else {
						this.targeting = this.selectedAbility.target; // enter target mode
						TG.data.map.buildTargetMap(hero, this.selectedAbility.target, /*actual_draw=*/true);
						this.renderer.showTargeting(this.selectedAbility.displayName);
						var xy = TG.data.map.getHexXY(SG.mx+SF.HALF_WIDTH, SG.my+SF.HALF_HEIGHT);
						this.renderer.mouseMoved(xy[0], xy[1], this.selectedAbility, this.targeting);
					}
				}
			} finally {
				TG.data.turnEngine.checkNextTurn();
			}
		},
		clearSelected: function() {
			this.renderer.clearTargeting();
			this.targeting = null;
			this.firstTarget = null;
			this.renderer.clearSelected();
		},
		HandleClick: function(x, y) {
			x += SF.HALF_WIDTH;
			y += SF.HALF_HEIGHT;
      if (TH.mClick(x, y) !== false) {
				return;
			}
			if (TG.overlay !== null) {
				error("no click overlay");
				return;
			}
			if (this.doing_ai && !this.view_only) {
				error("ignore input during npc (2)");
				return;
			}

			if (this.targeting === null || this.selectedAbility === null) {
				// sticky select something?
				var xy = TG.data.map.getHexXY(x, y);
				var targetHero = this.renderer.getMouseOver(xy[0], xy[1]);
				if (targetHero !== null) {
					this.renderer.stickySelect(targetHero);
				}
				return;
			}
			if (this.view_only) {
				return;
			}

			var target = null;

			if (this.targeting.terrain) {
				// just need to pass the XY and cast
				var xy = TG.data.map.getHexXY(x, y);
				var moveDist = TG.data.map.getTargetDist(xy[0], xy[1]);
				if (moveDist < 255) {
					var xy = TG.data.map.getHexXY(x, y);
					target = {
						x: xy[0],
						y: xy[1],
						name: "ground",
						ground: true
					};
				}
			} else {
				var xy = TG.data.map.getHexXY(x, y);
				var targetHero = this.renderer.getMouseOver(xy[0], xy[1]);
				if (targetHero !== null && targetHero.isTargetable()) {
					target = targetHero;
				}
			}

			if (target !== null) {
				if (this.firstTarget !== null) {
					if (target.ground) {
						target = {
							first: this.firstTarget.name,
							second: target,
						};
					} else {
						target = {
							first: this.firstTarget.name,
							second: target.name,
						};
					}
				}

				this.targeting = false;
				this.renderer.clearSelected();
				this.renderer.clearTargeting();
				TG.controller.explicitCast(TG.data.activeHero, target, this.selectedAbility);
				this.selectedAbility = null;
				TG.data.turnEngine.checkNextTurn();
			}

		},
		MouseMove: function(x, y, force /*optional*/) {
			if (TG.overlay !== null) {
				return;
			}
			if (this.doing_ai && !this.view_only) {
				error("ignore input during npc (3)");
				return;
			}
			x += SF.HALF_WIDTH;
			y += SF.HALF_HEIGHT;
			
			var xy = TG.data.map.getHexXY(x, y);
			if (!force && xy[0] === this.mgridx && xy[1] === this.mgridy) {
				return;
			}
			this.mgridx = xy[0];
			this.mgridy = xy[1];

      var c = null;
      if (TH.mMove(x, y) !== null) {
				return;
      }

			try {
				this.renderer.mouseMoved(this.mgridx, this.mgridy, this.selectedAbility, this.targeting);
			} finally {
				TG.data.turnEngine.checkNextTurn();
			}
		},

		//
		// Battle handling.
		//
		// The game turn advanced, this is the next ready hero
		readyHero: function(hero) {
			if (hero.dead) {
				// Shouldn't really happen that a dead hero gets in the turn queue, but move on just in case.
				error("errreadyHero d ",hero.name);
				TG.data.turnEngine.checkNextTurn();
				return;
			}
			TG.data.activeHero = hero;
			hero.PassEffectTime();  // Note this might expire a control effect.
			this.doing_ai = !hero.friendly;
			// The logic here is complicated to figure out when to insert delays into AI movement.
			// Currently it's easier to have here than to find all the end turn places.
			if (hero.friendly) {
				this.first_ai = true;
				if (this.first_player) {  // Delay from the last AI.
					this.first_player = false;
					setTimeout(this.readyHero2.bind(this), 100);
				} else {
					this.readyHero2();
				}
			} else {
				this.first_player = true;
				if (this.first_ai) {
					this.first_ai = false;
					this.readyHero2();
				} else {
					setTimeout(this.readyHero2.bind(this), 100);
				}
			}
		},
		// This version is set up to run with an optional delay for NPCs.
		readyHero2: function() {
			hero = TG.data.activeHero;
			if (!this.data.battle_lost) {  // Switch unconscious to view_only at game end.
				if (hero.health <= 0) {
					// Hero is unconscious.
					TG.data.turnEngine.queueTurnEnd();
					TG.data.turnEngine.checkNextTurn();
					return;
				} else {
					hero.death_ticks = 0;
				}
			}

			//SG.activeTier.CheckEnd();
			this.CheckEnd();
			if (this.data.battle_lost) {
				// Show the end message and prevent AI from acting.
				this.renderer.readyMap();
				this.renderer.clearMapHistory();
				return;
			}
			
			
			//if (!hero.friendly) {
				this.renderer.readyMap();
				//}
			//this.renderer.heroReadied(hero.name, TG.data.turn);
			if (this.applyControlMods(hero)) {
				// No-op here, the controlled char should end its turn.
			} else if (!hero.friendly) {
				if (this.view_only) {
					return;
				}
				TG.data.ai.doHeroTurn(hero);
			} else if (!TG.data.turnEngine.readyToTick) {
				// Start turn for human player
				//this.renderer.readyMap();
				this.renderer.clearMapHistory();
				if (this.friendly_ai) {
					TG.data.ai.doHeroTurn(hero);
				}
			}
			TG.data.turnEngine.checkNextTurn();
		},
		GlobalCast: function(sourceHero, ability_orig) {
			let ability = ability_orig.clone();
			let target = new JTact.AoeTarget(/*range=*/0, /*aoe=*/999);
			target.terrain = true;
			target.ground = true;
			target.respect_vision = false;
			target.x = sourceHero.x;
			target.y = sourceHero.y;
			ability.target = target;
			for (let xy_off of [[6, 0], [-6, 0], [0, 6], [0, -6]]) {
			// x1, y1, x2, y2, icon, friendly, /*optional*/ability_name, /*optional*/caster_name
				this.renderer.queueArrowDraw({x1: sourceHero.x, y1: sourceHero.y, x2: sourceHero.x+xy_off[0], y2: sourceHero.y+xy_off[1], friendly: sourceHero.friendly, ability_name: ability.displayName, caster_name: sourceHero.name}); // queue before the hero moves
			}
			this.explicitCast(sourceHero, target, ability);
		},
		// Cast an effect on a target
		explicitCast: function(sourceHero, target /*generally hero, or ground*/ , ability) {
			this.handleThreat(sourceHero, target, ability);
			// Queue before cast, in case the hero alters their queue position.
			//TG.data.turnEngine.queueHero(sourceHero, 1);
			this.renderer.queueArrowDraw({x1: sourceHero.x, y1: sourceHero.y, x2: target.x, y2: target.y, icon: TG.icons[ability.displayName], friendly: sourceHero.friendly, ability_name: ability.displayName, caster_name: sourceHero.name});
			this.doCast(sourceHero, target, ability);

			if (this.CheckWmdFragmentEffects(sourceHero)) {
				return;
			}

			TG.data.turnEngine.queueTurnEnd();
		},
		// Checks if a WMD fragment activation needs to be handled.
		// Returns true if breaking out of battle.
		CheckWmdFragmentEffects: function(sourceHero) {
			if (this.wmd_fragment_turn_back_clock) {
				S$.game_stats.times_wmd_fragment_activated++;
				let fragment_details = this.wmd_fragment_turn_back_clock;
				// Clear it first, in case of problems.
				this.wmd_fragment_turn_back_clock = false;
		    TG.controller.applyTime(fragment_details.time, fragment_details.name);
				return false;
			}
			if (this.wmd_full_fragment_activated) {
				S$.game_stats.times_wmd_full_activated++;
				S$.killed_friend_in_this_timeline = false;
				let delayed_function2 = function() {
					this.callback = undefined;
					this.teardown();				
					SG.in_battle = false;
					SU.PopBattleTier();
					S$.DoTimeTravelBack(this.data.battle_type);
				}
				let delayed_function = function() {
		      SU.fadeOutIn(delayed_function2.bind(this));
				}
				this.doing_ai = true;  // Disable input for a moment.
				this.renderer.readyMap();
				this.renderer.PrintWmdMessage(sourceHero.name);
				window.setTimeout(delayed_function.bind(this), 2 * 1000);
				
				// Graphics don't really belong here, but it's all getting torn down soon.
				let bossxy = this.renderer.WmdCasterXY(sourceHero.name);
				let dark_effect = new SBar.IconTempleEffect(TC.hudLayer, 0, 0, false);
				let dark_count = 0;
				let do_dark = function() {
					TC.hudLayer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
					dark_count++;
					if (dark_count >= 59) {
						return;
					}
					TC.hudLayer.save();
					TC.hudLayer.globalAlpha = Math.min(dark_count*5, 100)/100;
					TC.hudLayer.translate(bossxy[0], bossxy[1]);
					TC.hudLayer.transform(10, 0, 0, 10, 0, 0);
					dark_effect.update(0, 0, true);
					TC.hudLayer.restore();
					window.setTimeout(do_dark.bind(this), 50);
				}
				window.setTimeout(do_dark.bind(this), 50);
				return true;
			} 
			if (this.wmd_recur_fragment_activated) {
				// The Dream Recurs. Straight out and load the save.
				let callback = function() {
					S$.game_stats.dreams_recurred++;
					this.callback = undefined;
					this.teardown();				
					SG.in_battle = false;
					SU.PopBattleTier();
				}
				S$.DoDreamRecurs(callback.bind(this));
				return true;
			}			
		},
		/*
		 * Handle threat updates
		 * Tact system (keeping it simple here):
		 *   - Threat is on the ability. Equal to the level plus or minus some modifier.
		 *   - Aoe hits them all.
		 *   - Global and abilitity hits them all.
		 * WoW system: heals are global spread at 0.5 per 1 healed, damage is target threat at 1 per damage.
		 *   Buffs and debuffs depend on the ability
		 *   And heroes have lots of other options to gain and lose threat
		 */
		handleThreat: function(sourceHero, target, ability) {
			if (sourceHero.friendly) { // AI only takes threat from human (friendly) heroes
				if (ability.target !== null && ability.target.aoe) {
					// aoe ability, apply threat in multiples
					var affected = TG.data.map.collectHeroes(target.x, target.y, ability.target.aoe);
					for (var hero_target of affected) {
						hero_target.addThreat(sourceHero, ability.threat);
					}
					//var threatPer = ability.threat / affected.length; // going to NaN is ok
					//for (var i = 0; i < affected.length; i++) {
					//	var ntarget = affected[i];
					//	ntarget.addThreat(sourceHero, threatPer);
					//}
				} else if (target.friendly === false) {
					target.addThreat(sourceHero, ability.threat);
				} else {
					// self-target or friendly target, apply threat to all enemies
					// var affected = 0;
					// for (var obj in TG.data.heroes) {
					// 	var hero = TG.data.heroes[obj];
					// 	if (!hero.friendly) {
					// 		affected++;
					// 	}
					// }
					// var threatPer = ability.threat / affected; // going to NaN is ok
					for (var obj in TG.data.heroes) {
						var hero = TG.data.heroes[obj];
						if (!hero.dead && !hero.friendly) {
							hero.addThreat(sourceHero, ability.threat);
						}
					}
				}
			}
		},
		// internal function for casting portion
		doCast: function(sourceHero, target, ability) {
			if (ability.target === null) {
				TU.logMessage(sourceHero.name + " uses " + ability.displayName, [sourceHero.name, ability.displayName]);
			} else {
				var desc = sourceHero.name + " uses " + ability.displayName;
				if (target.ground) {
					desc += " at " + target.x + ", " + target.y;
				} else {
					desc += " on " + target.name;
				}
				TU.logMessage(desc, [sourceHero.name, ability.displayName, "target", target.name]);
			}

			let targets = [];
			if (ability.target && ability.target.aoe)  {
	      targets = TG.data.map.collectHeroes(target.x, target.y, ability.target.aoe);				
			} else {
				targets.push(target);
			}
			
			for (final_target of targets) {
				if (ability.level_cap && final_target.level && final_target.level > ability.level_cap) {
					TU.logMessage("L"+ability.level_cap+" ability fizzled on L"+final_target.level+" "+final_target.name/*, [sourceHero.name, ability.displayName, "target", target.name]*/);
				} else {
					for (var i = 0; i < ability.effects.length; i++) {
						var effect = ability.effects[i];
						var clone = this.applyEffect(effect, sourceHero, final_target);
						clone.updateAbility(ability);
						if (clone.negated) {
							// Negate entire ability.
							break;
						}
					}
					if (ability.cooldownTime > 0) {
						ability.cooldown = TG.data.turn + ability.cooldownTime;
					}
					/*
					if (ability.energy !== null) {
						sourceHero.energy -= ability.energy;
						if (sourceHero.energy < 0) {
							error("error: hero energy went negative " + sourceHero.energy);
						}
					}
					*/

/* handled in the effects
					if (sourceHero.health <= 0) {
						sourceHero.handleUnconscious();
						return;
					}
					if (final_target.health <= 0) {
						final_target.handleUnconscious();
					}		
					*/	
				}
			}
		},
		// Cast an effect only, like something triggered from a DOT, or a fireball hitting a bunch of targets
		doEffect: function(effect, sourceHero, target, overtime /*optional*/ ) {
			if (!target.name) target = TG.data.heroes[target];
			if (!target || target.dead) {
				// Left the battlefield.
				return;
			}
			if (overtime) {
				TU.logMessage("Effect " + effect.displayName + " triggered on " + target.name, ["time", effect.displayName, target.name]);
			} else {
				TU.logMessage("Effect " + effect.displayName + " applied on " + target.name, ["react", effect.displayName, target.name]);
			}
			var clone = this.applyEffect(effect, sourceHero, target);
			return clone;
		},
		applyEffect: function(effect, sourceHero, target) {
			var origTarget = target;
			effect = TU.cloneEffect(effect); // don't want to use the original due to it being changed by mods
			// this can sometimes be confusing, because effect object changes will get lost
			effect.preapply(sourceHero, target); // see if it needs any updates based on source & target
			this.applySourceMods(sourceHero, effect);
			if (!target.ground) {
				this.applyMods(target, effect);
			}
			if (!effect.negated) {
				let apply_return = effect.apply(sourceHero, origTarget);
				if (apply_return && apply_return.x) {
					// Summoned a hero. Draw the arrow.
					this.renderer.queueArrowDraw({x1: sourceHero.x, y1: sourceHero.y, x2: apply_return.x, y2: apply_return.y, friendly: sourceHero.friendly});
				}
				if (!target.ground) {
					this.applyCleanupMods(target);
				}
			}
			return effect;
		},
		// An effect is being applied by a hero, see if it needs modification
		applySourceMods: function(hero, effect) {
			if (!hero || !hero.mods) {
				return;
		  }
			for (var i = 0; i < hero.mods.length; i++) {
				hero.mods[i].checkSourceImpact(effect);
			}
			// see if any of them got used up
			for (var i = hero.mods.length - 1; i >= 0; i--) {
				if (hero.mods[i].negated) {
					hero.mods.splice(i, 1);
				}
			}
		},		
		// An effect is being applied to this hero, see if it needs modification
		applyMods: function(hero, effect) {
			if (!hero.mods) {
				return;
		  }
			for (var i = 0; i < hero.mods.length; i++) {
				hero.mods[i].checkImpact(effect);
			}
			// see if any of them got used up
			for (var i = hero.mods.length - 1; i >= 0; i--) {
				if (hero.mods[i].negated) {
					hero.mods.splice(i, 1);
				}
			}
		},
		// Something has been applied to the hero, see if anything triggers afterward
		applyCleanupMods: function(hero) {
			for (var i = 0; i < hero.mods.length; i++) {
				hero.mods[i].checkCleanup();
			}
			// see if any of them got used up
			for (var i = hero.mods.length - 1; i >= 0; i--) {
				if (hero.mods[i].negated) {
					hero.mods.splice(i, 1);
				}
			}
		},
		// see if the player is under spell control, like charms or fear
		// These actions will queue a turn end, if appropriate
		applyControlMods: function(hero) {
			var controlled = false;
			for (var i = 0; i < hero.mods.length; i++) {
				controlled |= hero.mods[i].checkControlled();
				if (controlled) {
					break;
				}
			}
			// see if any of them got used up
			for (var i = hero.mods.length - 1; i >= 0; i--) {
				if (hero.mods[i].negated) {
					hero.mods.splice(i, 1);
				}
			}
			return controlled;
		},
		expireAllEffectsAtEnd: function() {
			if (this.view_only) {
				return;
			}
			for (let obj in TG.data.heroes) {
				let hero = TG.data.heroes[obj];
				if (!hero.dead) {
					for (var i = hero.mods.length - 1; i >= 0; i--) {
						if (!hero.mods[i].persist_at_end) {
							TU.logMessage("Effect " + hero.mods[i].displayName + " expired at end on " + hero.name, ["end", hero.mods[i].displayName, hero.name]);
							hero.mods[i].unapply();
							hero.mods.splice(i, 1);
						}
					}
				}
			}
		},
		addHero: function(hero) {
//			var x = hero.x;
//			var y = hero.y
//			hero.moveTo(0, 0); // Applies ground mods.
//			hero.moveTo(x, y); // Applies ground mods.
			while (TG.data.heroes[hero.name]) {
				// Need to make the name unique.
				hero.ChangeName(hero.name+"+");
			}
			//hero.turn_order = this.hero_counter++;
			TG.data.heroes[hero.name] = hero;
			TG.data.turnEngine.queueHero(hero, 0);
			TG.data.mapEffects.handleMove(hero, hero.x, hero.y, /*bypass=*/true);
		},
			
		setInitialThreats: function() {
			let friendly = [];
			let hostile = [];
			let first_friendly_name = undefined;
			for (let obj in TG.data.heroes) {
				let hero = TG.data.heroes[obj];
				if (hero.friendly) {
					if (!first_friendly_name) {
						first_friendly_name = hero.name;
					}
					friendly.push(hero);
				} else {
					hostile.push(hero);
				}
			}
			for (let npc of hostile) {
				for (let player of friendly) {
					npc.addThreat(player, 1);
				}
				npc.threatTarget = first_friendly_name;
			}
		},
		
		EnableFriendlyAi: function() {
			// Note this doesn't allow disabling friendly AI, because it can be tricky when jumping back into enemy turns.
			let message = "Enable auto control of player characters? They aren't always very smart...";
			let me = this;
			
			let callback = function(confirmed) {
				if (confirmed) {
					me.friendly_ai = true;
					TG.data.ai.doHeroTurn(TG.data.activeHero);
					TG.data.turnEngine.checkNextTurn();
				}
			}
			SU.ConfirmWindow("Auto Combat", message, callback, '?');			
		},
		
		// A faction lost, or view is over, end map.
		teardown: function() {
			//printStack();
			//return;
			if (this.data.battle_won) {
				this.data.heroes = TG.data.heroes;
				for (let obj in TG.data.heroes) {
					if (!TG.data.heroes[obj].friendly) {  // Includes dead enemies here. Victory means all enemies dispatched.
						S$.game_stats.enemies_killed++;
					}
				}
			}
			TG.controller = null;
			if (this.torn_down) {
				return;
			}
			this.torn_down = true;
			TG.data.turn = null;  // Indicate it's not running.
			this.renderer.teardown();
			if (this.callback) {
				this.callback(this.data);
			}
			if (TG.overlay !== null) {
				TG.overlay.teardown();
				TG.overlay = null;
			}
		}
	};
	SU.extend(SBar.TactTier, SBar.Data);
})();
