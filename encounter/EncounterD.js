/*
 * Tact Data, all details need to initiate combat.
 */
(function() {
	
	SBar.EncounterData = function(obj_data) {
		this._initEncounterData(obj_data);
	};

	SBar.EncounterData.prototype = {
		type: SF.TYPE_ENCOUNTER_DATA,
		
		credits: -1,
		//energy: null,
		// Heroes is an array of names and abilities. Abilities are an array, where each ability is a list of combined seeds and levels (one or more).
		/*
		heroes: [
		  {name: "asdf", skills: [
		       [{seed:12.34, level:6},{seed:34.23, level:2}],
		       [{seed:2.34, level:1}],
		    ]
		  },
		]
		-- Have an object in Tact that the client can pack to pass, and tact unpack
		*/
		
		attacking: false,  // vs. being attacked.
		heroes: null,  // Note final heroes are copied back here after battle, from TG.data.
		battle_effect: null,  // Friendly battle effect, if any.
		num_drinks: 0,
		seed: null,
		battle_type: null,  // Like SF.BATTLE_ANIMAL.
		battle_name: null,
		flee_chance: null,
		abandon_chance: 90,
		blind_brawl_cost: null,  // Health cost per hero.
		description: null,  // Optional description text.
		reward: null, // 'credits' or 'arti'. Default reward if none.
		building_data: null,
		enemy_race: null,
		race_warning: false,
		
		// Battle results.
		fled: null,
		won: null,
		lost: null,
		withdrew: null,
		
		
		_initEncounterData: function(obj_data) {
			for (var key in obj_data) {
				this[key] = obj_data[key];
			}
			let num_enemies = 0;
			for (let hero of this.heroes) {
				if (!hero.friendly) {
					num_enemies++;
				}
			}
			if (this.race_warning) {
				this.flee_chance = 100;
			} else if (this.battle_type === SF.BATTLE_PARTY && num_enemies > 0) {
				this.flee_chance = 0;
			} else	if (this.attacking) {
				this.flee_chance = 100;
			} else if (this.battle_type === SF.BATTLE_BARFIGHT) {
				this.flee_chance = 90;
			} else if (this.battle_type === SF.BATTLE_AMBUSH) {
				this.flee_chance = 0;
			} else {
				// Standard 70% chance plus ship modifications.
				this.flee_chance = 70;
				if (S$.ship.flee_chance) {
					this.flee_chance += Math.floor(S$.ship.flee_chance/100 * (100-this.flee_chance));
				}
			}
			if (this.enemy_race === SF.RACE_SEED_ALPHA && this.flee_chance < 100) {
				// It's a trap and alphas are equipped with anti-flee.
				// But don't lower it if the player is initiating.
				this.flee_chance = Math.round(this.flee_chance * 0.6);
				this.flee_chance = 10;
			}
			this.ComputeBrawlCost();
		},
		
		// Sets the blind brawl cost.
		ComputeBrawlCost: function() {
			// To estimate the battle outcome:
			//    - Add up the damage on both sides.
			//    - Total the abilities that can affect the other team (due to level caps).
			//    - Give a bonus to the side with initiative.
			//    - Adjust the damage by number of applicable abilities.
			//    - Estimate the number of rounds.
			//    - Provide some damage spread.
			// This ignores cooldowns and move speed and effect type. Just a rough estimation.
			// With special considerations, like the Full WMD.
			let friendlies = [];
			let enemies = [];
			let friendly_hp = 0.01;  // (no divide 0)
			let enemy_hp = 0.01;
			for (let hero of this.heroes) {
				if (hero.friendly) {
					friendly_hp += hero.health;
					friendlies.push(hero);
				} else {
					enemy_hp += hero.health;
					enemies.push(hero);					
				}
			}
			let friendly_results = this.ComputeBrawlSide(friendlies, enemies);
			let enemies_results = this.ComputeBrawlSide(enemies, friendlies);
			// The question is how many turns before the friendlies win.
			// Weight damage by proportion of abilities.
			let abilities_both_sides = friendly_results.abilities + enemies_results.abilities + 0.01; // (divide 0).
			friendly_results.damage = friendly_results.damage*friendly_results.abilities / abilities_both_sides + 0.01;
			enemies_results.damage = enemies_results.damage*enemies_results.abilities / abilities_both_sides + 0.01;
			// Turns it take the player to dispatch enemies.
			let enemy_turns = enemy_hp / friendly_results.damage;
			if (this.attacking) enemy_turns--;
			if (enemy_turns < 0) enemy_turns = 0.01;
			let enemy_damage = enemy_turns * enemies_results.damage;
			// Adjust a little to account for not even damage spread.
			enemy_damage *= 1.2;
			this.blind_brawl_cost = Math.round(enemy_damage / friendlies.length);
			if (this.blind_brawl_cost <= 0 || isNaN(this.blind_brawl_cost)) this.blind_brawl_cost = 1;
		},
		
		// Calculates the effectiveness of 'left' heroes attacking 'right' heroes.
		ComputeBrawlSide: function(left, right) {
			let total_damage = 0;
			for (let hero of left) {
				for (let ability of hero.abilities) {
					for (let effect of ability.effects) {
						if (effect.damage) {
							total_damage += effect.damage;
						} else if (effect.full_wmd_effect) {
							total_damage += 1000;
						}
					}
				}					
			}
			// Total applicable abilities, divided by applicable fractions.
			let total_abilities = 0;
			for (let hero of left) {
				for (let ability of hero.abilities) {
					let applicable = 0;
					for (let right_hero of right) {
						// This oversimplifies by assuming abilities effect enemies.
						// But if enemies can't be targeted there's not a lot of hope anyway.
						if (!ability.level_cap || ability.level_cap >= hero.level) {
							applicable++;
						}
					}
					total_abilities += applicable / right.length;
				}
			}
			return {damage: total_damage, abilities: total_abilities};			
		},
		
		// Flee chance if there has been switching sides.
		ComputeMutinyFlee: function() {
			let num_friendly = 0;
			let num_total = 0;
			for (let obj in this.heroes) {
				let hero = this.heroes[obj];
				num_total++;
				if (hero.friendly) {
					num_friendly++;
				}
			}
			this.flee_chance = Math.round(num_friendly/num_total*100);
		},
		
		RecomputeMutiny: function() {
			this.ComputeBrawlCost();
			this.ComputeMutinyFlee();
		},
		
		// The player tried to attack but something interrupted. Flee chance changes.
		ComputeEngageFlee: function() {
			this.flee_chance = Math.round(this.flee_chance/2);
		},
		
    activateTier: function(callback) {
			TG.data.battle_type = this.battle_type;
      var tier = new SBar.EncounterTier(this, callback);
      tier.activate();
    },
		
	};
	
	SU.extend(SBar.EncounterData, SBar.Data);
})();
