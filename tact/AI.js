/*
 * AI
 * Controls enemy NPC turns, or if requested player character turns.
 * This is pretty simple. AI is intended to be understable and predictable for the human player.
 */
(function() {

	JTact.AI = function() {
		this._initAI();
	};

	JTact.AI.prototype = {
		first_check: null,
		
		_initAI: function() {},
		doHeroTurn: function(hero) {
			this.built_path_map = false;
			
			if (hero.friendly) {
				// The player requested full auto-combat.
				// Since player characters don't have threat, just attack the closest enemy. It's not optimal.
				let closest_distance = 99999;
				let closest_enemy = null;
				for (let obj in TG.data.heroes) {
					let candidate = TG.data.heroes[obj];
					if (!candidate.friendly && !candidate.dead) {
						// Simplistic distance, doesn't account for barriers;
						let distance = TG.data.map.getHexDist(hero.x, hero.y, candidate.x, candidate.y);
						if (distance < closest_distance) {
							closest_distance = distance;
							closest_enemy = candidate;
						}
					}
				}
				if (closest_enemy === null || !this.AttackTarget(hero, closest_enemy, /*override_friendly=*/true)) {
					this.justDefend(hero);
				}
				return;
			}
			
			// Prioritize helping teammates when it makes sense.
			//for (let ability of hero.abilities) {
		  // Damage is often first. Start from the other end.
		  for (var i = hero.abilities.length-1; i >= 0; i--) {
				let ability = hero.abilities[i];
				// Presumes 1 effect for monster abilities.
				var effect = ability.effects[0];
				if (ability.cooldown <= TG.data.turn && effect && effect.ai_target === SF.AI_TARGET_COMP) {  // Helping own AI.
					// Some distance buffer for targeting to larger heroes.
					var candidates;
					if (ability.target) {
						candidates = TG.data.map.collectHeroes(hero.x, hero.y, ability.target.range + 5);
					} else {
						// Self-cast ability.
						candidates = [hero];
					}
					for (let target of candidates) {
						if (this.WithinLevel(ability, target) && this.WithinRange(hero, target, ability) && this.MeetsAiCriteria(hero, target, effect)) {
							if (ability.target && ability.target.global) {
								TG.controller.GlobalCast(hero, ability);
							} else {
								TG.controller.explicitCast(hero, target, ability);
							}
							return true;
						}
					}
				}
			}
	
			// Attack targets.
			let main_target = TG.data.heroes[hero.threatTarget];
			if (!main_target || main_target.dead) {
				error("NO MAIN TARGET",hero.threatTarget);
				this.justDefend(hero);
				return;
			}
			if (main_target.friendly && this.AttackTarget(hero, main_target)) {
				return;
			}
			// Can't get to target. Try others, starting at next highest threat.
			var threats = [];
			for (threat in hero.threatList) {
				if (threat != hero.threatTarget) {
					threats.push([threat, hero.threatList[threat]]);
				}
			}
			threats.sort(function(left, right){return left[1] - right[1];});
			for (threat of threats) {
				let backup_target = TG.data.heroes[threat[0]];
				if (backup_target && backup_target.friendly && !backup_target.dead && this.AttackTarget(hero, backup_target)) {
					return;
				}
			}
			this.justDefend(hero);
		},
		// Returns true if the target meets AI rules for this effect.
		MeetsAiCriteria: function(source, target, effect) {
			if (effect.ai_target === null) {
				error("noaitarget",SU.Stringify(effect));
				return false;
			}
			if ((effect.ai_target === SF.AI_TARGET_PLAYER) != target.friendly) {
				return false;
			}
			// Don't reapply anything already there.
      for (let mod of target.mods) {
				if (mod.displayName == effect.displayName) {
					return false;
				}
      }								
			if (effect.ai_rules === null) {
				return true;
			}
			for (let rule of effect.ai_rules) {
				switch (rule) {
				case SF.AI_HEALTH_0:
					if (target.health > 0) {
						// Return false to indicate not a target.
						return false;
					}
					break;
				case SF.AI_HEALTH_50:
					if (target.health * 2 > target.max_health) {
						return false;
					}
					break;
				case SF.AI_HEALTH_90:
					if (target.health * 10 > target.max_health * 9) {
						return false;
					}
					break;
				case SF.AI_HEALTH_LESS:
					if (target.health < source.health) {
						return false;
					}
					break;
					/*
				case SF.AI_CHECK_EFFECT:
          for (let mod of target.mods) {
						if (mod.displayName == effect.displayName) {
							return false;
						}
          }					
					break;
					*/
				case SF.AI_CHECK_BUFFS:
					var buffs = 0;
					for (let mod of target.mods) {
						if (mod.buff) {
							buffs++;
						}
					}
					if (buffs === 0) {
						return false;
					}
					break;
				case SF.AI_CHECK_DEBUFFS:
					var debuffs = 0;
					for (let mod of target.mods) {
						if (!mod.buff) {
							debuffs++;
						}
					}
					if (debuffs === 0) {
						return false;
					}
					break;
				case SF.AI_CHECK_SUMMONED:
					return target.summoned;
				default:
					error("noaicheck");
				}
			}
			return true;
		},
		// Returns true if the ability is applicable to the target's level, or otherwise valid.
		WithinLevel: function(ability, target) {
			if (!ability.level_cap || !target.level) {
				return true;
			}
			return target.level <= ability.level_cap;
		},
		// Returns true if the ability is in range for a cast (with vision).
		WithinRange: function(hero, target, ability) {
			if (ability.target && ability.target.global) {
				return true;
			}
			if (!ability.target) {
				return hero.name == target.name;
			}
			var range = ability.target.range;
			var dist = TG.data.map.getHexDist(hero.x, hero.y, target.x, target.y) - 1;
			var srad = (hero.size - 1) / 2;
			var trad = (target.size - 1) / 2;
			return range + srad + trad >= dist && TG.data.map.hasVision(hero.x, hero.y, target.x, target.y);
		},
		AttackTarget: function(hero, target, /*optional*/override_friendly) {
			//for (let ability of hero.abilities) {
		  for (var i = hero.abilities.length-1; i >= 0; i--) {
				let ability = hero.abilities[i];
				// Presumes 1 effect for monster abilities.
				var effect = ability.effects[0];
				if (ability.cooldown <= TG.data.turn && effect && effect.ai_target === SF.AI_TARGET_PLAYER) {
					if (this.WithinLevel(ability, target) && this.WithinRange(hero, target, ability)
					    && (override_friendly || this.MeetsAiCriteria(hero, target, effect))) {
						if (ability.target && ability.target.global) {
							TG.controller.GlobalCast(hero, ability);
						} else {
							TG.controller.explicitCast(hero, target, ability);
						}
						return true;
					}
				}
			}

			var range = 1;
			// Get the range for the first likely used ability. Note this is used
			// just as a backup target location to walk to, not to build out the map.
			for (let ability of hero.abilities) {
				if (ability.effects[0].ai_target === SF.AI_TARGET_PLAYER && ability.target) {
					range = ability.target.range;
					break;
				}
			}
					
			// else need to move in range / vision
			// get an array of steps to the target
			var path = TG.data.map.pathToTarget(hero, target, range, /*skip_build_map=*/this.built_path_map);
			this.built_path_map = true;

			if (path === null) {
				return false;
			}
			
			var speed = Math.round(TF.BASE_MOVE * hero.speed);
			var moves = Math.min(path.length - 1, speed); // move to being within range, or as far as possible

			var dest = path[moves];
			if (!dest) {
				return false;
			}

			var moveAbility = hero.moveAbility;
			var moveTarg = {
				x: dest[0],
				y: dest[1],
				name: "ground",
				ground: true
			};

			TG.controller.explicitCast(hero, moveTarg, moveAbility);
			return true;
		},
		justDefend: function(hero) {
			// very simple
			TG.controller.explicitCast(hero, hero, hero.defendAbility);
		}
	};
})();
