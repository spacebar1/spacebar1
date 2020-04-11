/*
 * Helper to add enemies to a battle.
 */
(function() {	
		
	// Reminder that all the hero names need to be unique.
	SBar.EnemyBuilder = function(battle_type, level, race_seed, battle_seed, battle_builder) {
		this._initEnemyBuilder(battle_type, level, race_seed, battle_seed, battle_builder);
	};

	SBar.EnemyBuilder.prototype = {
		type: SF.TYPE_ENEMY_BUILDER,
		battle_type: null,
		battle_level: null,
		race_seed: null,
		race_name: null,
		battle_seed: null,
		data: null,
		hero_list: null,
		hero_place_function: null,
		battle_builder: null,
		
		race_speed_mod: null,
		race_health_mod: null,
		unique_name_counts: null, // Maps a base name to the number of times it has appeared.
		
		_initEnemyBuilder: function(battle_type, level, race_seed, battle_seed, battle_builder) {
			this.battle_type = battle_type;
			this.battle_level = level;
			this.race_seed = race_seed;
			this.battle_seed = battle_seed;
			this.race_name = ST.RaceNameOnly(race_seed);
			this.battle_builder = battle_builder;
			this.data = battle_builder.data;
			
			this.race_speed_mod = SU.r(this.race_seed, 7.1) + 0.5;
			this.race_health_mod = SU.r(this.race_seed, 7.1) + 0.5;
			this.unique_name_counts = {};
			this.race_size = Math.floor(SU.r(this.race_seed, 5.12)*3)*2+3;  // 3,5,7.
			if (race_seed === SF.RACE_SEED_HUMAN || race_seed === SF.RACE_SEED_ALPHA) {
				this.race_size = 5;
			}
		},		
		
		AddEnemies: function(hero_list, hero_place_function) {
			this.hero_list = hero_list;
			this.hero_place_function = hero_place_function;
			if (SF.WIN_BATTLES) {
				// No enemies for auto-win.
				return;
			}			
			if (this.data.type === SF.TYPE_ALPHA_DANCE) {
				this.AddAlphaDance();
				return;
			}
			if (this.data.type === SF.TYPE_CORNFIELD) {
				this.AddCornfield();
				return;
			}
			if (this.race_seed === SF.RACE_SEED_ALPHA) {
				this.AddAlphas();
				return;
			}
			// Battle type is a data type by default, with override options.
			switch (this.battle_type) {
  			case SF.BATTLE_SHOP:
					this.ShopBattle();
					return;
				case SF.BATTLE_RACE_MILITARY:
					this.StarmapAmbush();
					return;
				case SF.BATTLE_POLICE:
					this.PoliceAmbush();
					return;
				case SF.BATTLE_QUEST:
					this.QuestAmbush();
					return;
				case SF.BATTLE_PIRATE:
				case SF.BATTLE_AMBUSH:
					this.PirateAmbush();
					return;
				case SF.BATTLE_ANIMAL:
					this.Animals();
					return;
				case SF.BATTLE_BARFIGHT:
					this.BarFight();
					return;
				case SF.BATTLE_PARTY:
					// No enemies.
					return;
				case SF.BATTLE_ALPHA:
					this.AddAlphas();
					return;
				default:
					// No-op, fall through to below.
			}
			
			// Default to a few enemies.
			// This could be removed after all battle types are filled out.
			let num_enemies = Math.floor(SU.r(this.battle_seed, 82.12)*3)+1;
			let level_bonus = 3-num_enemies;
			for (var i = 0; i < num_enemies; i++) {
				let name = ST.getWord(this.race_seed, SU.r(this.battle_seed, i));
				this.AddEnemy(SU.r(this.battle_seed, i), name, this.battle_level+level_bonus);
			}
		},
		
		ShopBattle: function() {
			let shopkeeper_name = ST.getWord(this.race_seed, this.battle_seed);
			let num_companions = Math.floor(SU.r(this.battle_seed, 5.12)*3)+1 // 1-3.
			this.AddEnemy(this.battle_seed, shopkeeper_name, capLevel(this.battle_level+1));
			for (var i = 0; i < num_companions; i++) {
				let name = ST.getWord(this.race_seed, SU.r(this.battle_seed, 5.13+i));
				let level = capLevel(this.battle_level - Math.floor(SU.r(this.battle_seed, 5.15+i)*2));
				this.AddEnemy(SU.r(this.battle_seed, 5.14+i), name, this.battle_level);
			}
		},
		
		StarmapAmbush: function() {
			this.AddMilitaryGroup(this.battle_seed+81.12);
//			this.AddMilitaryGroup(this.battle_seed+81.22);			
		},
		
		PoliceAmbush: function() {
			this.AddPoliceGroup(this.battle_seed+82.12);
			this.AddPoliceGroup(this.battle_seed+82.22);			
		},
		
		AddMilitaryGroup: function(group_seed) {
			let level_off = Math.floor(SU.r(group_seed, 6.1)*5);
			let level = this.battle_level + level_off - 2;
			let num_enemies;
			let title;
			switch (level_off) {
				case 0:
					num_enemies = Math.floor(SU.r(group_seed, 6.2)*3) + 3;  // 3-5.
					title = "Private";
					break;
				case 1:
					num_enemies = Math.floor(SU.r(group_seed, 6.3)*3) + 2;  // 2-4.
					title = "Specialist";
					break;
				case 2:
					num_enemies = Math.round(SU.r(group_seed, 6.4)) + 2;  // 2-3.
					title = "Sergeant";
					break;
				case 3:
					num_enemies = Math.round(SU.r(group_seed, 6.5)) + 1;  // 1-2.
					title = "Captain";
					break;
				case 4:
					num_enemies = 1;
					title = "General";
					break;
			}
			level = capLevel(level);
			for (let i = 0; i < num_enemies; i++) {
				let name = this.race_name+" "+title;
				name = this.GetUniqueName(name);
				this.AddEnemy(this.race_seed+level_off+9.11/*they all get the same seed for the type*/, name, level);
			}
		},

    // Similar to above, maybe not quite as strong.
		AddPoliceGroup: function(group_seed) {
			let level_off = Math.floor(SU.r(group_seed, 7.1)*5);
			let level = this.battle_level + level_off - 2;
			let num_enemies;
			let title;
			switch (level_off) {
				case 0:
					num_enemies = Math.floor(SU.r(group_seed, 6.2)*3) + 3;  // 3-5.
					title = "Officer";
					break;
				case 1:
					num_enemies = Math.floor(SU.r(group_seed, 6.3)*3) + 2;  // 2-4.
					title = "Detective";
					break;
				case 2:
					num_enemies = Math.round(SU.r(group_seed, 6.4)) + 2;  // 2-3.
					title = "Inspector";
					break;
				case 3:
					num_enemies = Math.round(SU.r(group_seed, 6.5)) + 1;  // 1-2.
					title = "Deputy";
					break;
				case 4:
					num_enemies = 1;
					title = "Chief";
					break;
			}
			level = capLevel(level);
			for (let i = 0; i < num_enemies; i++) {
				let name = this.race_name+" "+title;
				name = this.GetUniqueName(name);
				this.AddEnemy(this.race_seed+level_off+9.11/*they all get the same seed for the type*/, name, level);
			}
		},
		
		PirateAmbush: function() {
			let pirate_artis = [
				SBar.ArtifactData(SU.r(this.battle_seed, 94.1), this.race_seed, this.battle_level, SF.SKILL_PIRATE, /*for_ai=*/true),
				SBar.ArtifactData(SU.r(this.battle_seed, 94.2), this.race_seed, this.battle_level, SF.SKILL_STANDARD, /*for_ai=*/true),				
			];
			let num_pirates = Math.floor(SU.r(this.battle_seed, 94.3)*3) + 2;  // 2-4.
			for (let i = 0; i < num_pirates; i++) {
				this.AddEnemy(this.battle_seed+94.4, this.GetUniqueName(this.race_name+" Pirate"), this.battle_level, pirate_artis);
			}			
		},
		
		BarFight: function() {
			let num_patrons = Math.floor(SU.r(this.battle_seed, 94.3)*4) + 3;  // 3-6.
			for (let i = 0; i < num_patrons; i++) {
				let artis = [
					SBar.ArtifactData(SU.r(this.battle_seed, 92.1+i), this.race_seed, this.battle_level, SF.SKILL_PIRATE, /*for_ai=*/true),
					SBar.ArtifactData(SU.r(this.battle_seed, 92.2+i), this.race_seed, this.battle_level, SF.SKILL_STANDARD, /*for_ai=*/true),				
				];
				let name = ST.getWord(this.race_seed, SU.r(this.battle_seed, i));
				let level = capLevel(this.battle_level - Math.floor(SU.r(this.battle_seed, 92.3+i)*3));
				this.AddEnemy(this.battle_seed+91.5+i, name, level, artis);
			}
		},
		
		AddAlphaDance: function() {
			// The enemy positions are set up to center in the middle, and to place enemies first.
			let tact_hero = new JTact.Hero();
			let size = 21;
			let level = Math.floor(S$.time/24)+100;
			let spot = this.hero_place_function(size);
			this.battle_builder.FillLargeCharPlace(spot.x, spot.y, size)
			tact_hero._initHero(spot.x, spot.y, /*friendly=*/false, "✌️ Your Friend ✌️", size, level, SF.RACE_SEED_ALPHA, SF.RACE_SEED_ALPHA, {is_alpha_boss: true, morale: 50});
			tact_hero.SetSpeed(0);
			tact_hero.SetHealth(Math.floor(SU.r(this.battle_seed, 61.21)*8)+level*8);
			tact_hero.personality = SF.P_FERAL;

			let artis = [
				SBar.ArtifactData(SU.r(this.battle_seed, 92.2), this.race_seed, level, SF.SKILL_TRUE_OMEGA, /*for_ai=*/true),				
			];
			tact_hero.for_export_artis = [];
			for (let arti of artis) {
				tact_hero.addBuiltAbility(new SBar.Skill(arti).ability, false);
				tact_hero.for_export_artis.push(arti);
			}
			this.hero_list.push(tact_hero);
		},
		
		// Pretty much the same as above. Could be deduplicated.
		AddCornfield: function() {
			let tact_hero = new JTact.Hero();
			let size = 5;
			let level = Math.floor(S$.time/24)+1;
			let spot = this.hero_place_function(size);
			this.battle_builder.FillLargeCharPlace(spot.x, spot.y, size)
			tact_hero._initHero(spot.x, spot.y, /*friendly=*/false, "✌️ Your Friend ✌️", size, level, SF.RACE_SEED_ALPHA, SF.RACE_SEED_ALPHA, {is_alpha_boss: true, morale: 50});
			tact_hero.SetHealth(Math.floor(SU.r(this.battle_seed, 61.21)*8)+level*8);
			tact_hero.personality = SF.P_FERAL;

			let artis = [
				SBar.ArtifactData(SU.r(this.battle_seed, 92.2), this.race_seed, level, SF.SKILL_TRUE_OMEGA, /*for_ai=*/true),				
			];
			tact_hero.for_export_artis = [];
			for (let arti of artis) {
				tact_hero.addBuiltAbility(new SBar.Skill(arti).ability, false);
				tact_hero.for_export_artis.push(arti);
			}
			this.hero_list.push(tact_hero);
		},
				
		// Biggie needed to be added first, but they'll go last.
		CheckRequeueAlphaBoss: function() {
			if (this.hero_list.length > 0 && this.hero_list[0].is_alpha_boss) {
				let removed_array = this.hero_list.splice(0, 1);
				this.hero_list.push(removed_array[0]);
			}
		},
		
		// Adds alphas.
		// **NOTE this is also called from JTact.OmegaFullEffect**
		AddAlphas: function(/*optional*/max_num_enemies, /*optional*/total_level) {
			if (!max_num_enemies) {
				max_num_enemies = 10;
			}
			// Total up to 3x level.
			// No more than level+2 each.
			// No less than level-5 each.
			if (!total_level) {
				total_level = this.battle_level*3;
			}
			for (let i = 0; i < max_num_enemies; i++) {  // Failsafe limit.
				//let level = Math.floor(SU.r(this.battle_seed, 65.1+i)*8) + this.battle_level - 5;
				let level = Math.floor(SU.r(this.battle_seed, 65.1+i)*(this.battle_level+3));
				level = capLevel(level);
				if (level <= total_level) {
					total_level -= level;
					let artis = [
						// Artifacts are consistent (race_seed-based) for all alphas of the same level.
						SBar.ArtifactData(SU.r(level, 65.4), this.race_seed, level, SF.SKILL_ALPHA_DAMAGE, /*for_ai=*/true),
						SBar.ArtifactData(SU.r(level, 65.5), this.race_seed, level, SF.SKILL_ALPHA, /*for_ai=*/true),
						SBar.ArtifactData(SU.r(level, 65.6), this.race_seed, level, SF.SKILL_ALPHA, /*for_ai=*/true),				
					];					
					this.AddEnemy(this.battle_seed+65.2+i, ST.getAlphaWord(this.battle_seed+i)+" "+SU.AlphaLetter(level), level, artis);
				} else {
					// Missed a shot, end it here rather than filling in lots of low levels.
					break;
				}
				//if (total_level < this.battle_level - 5) {
				//	break;
				//}
			}
		},
		
		Animals: function() {
			let level_off = Math.floor(SU.r(this.battle_seed, 17.1)*6);
			let level = this.battle_level + level_off - 3;
			let num_enemies;
			let title;
			switch (level_off) {
				case 0:
					num_enemies = Math.floor(SU.r(this.battle_seed, 16.2)*6) + 4;  // 4-9.
					title = "Little Beast";
					break;
				case 1:
					num_enemies = Math.floor(SU.r(this.battle_seed, 16.2)*3) + 3;  // 3-5.
					title = "Lesser Beast";
					break;
				case 2:
					num_enemies = Math.floor(SU.r(this.battle_seed, 16.3)*3) + 2;  // 2-4.
					title = "Minor Beast";
					break;
				case 3:
					num_enemies = Math.round(SU.r(this.battle_seed, 16.4)) + 2;  // 2-3.
					title = "Beast";
					break;
				case 4:
					num_enemies = Math.round(SU.r(this.battle_seed, 16.5)) + 1;  // 1-2.
					title = "Great Beast";
					break;
				case 5:
					num_enemies = 1;
					title = "King Beast";
					break;
			}
			level = capLevel(level);
			for (let i = 0; i < num_enemies; i++) {
				// Note the race name for animals will be aligned with the planet.
				let name = this.race_name+" "+title;
				name = this.GetUniqueName(name);
				let enemy = this.AddEnemy(this.race_seed+level_off+9.12/*they all get the same seed for the type*/, name, level);
				enemy.is_feral = true;
			}
		},

		QuestAmbush: function() {
			let thug_artis = [
				SBar.ArtifactData(SU.r(this.battle_seed, 92.1), this.race_seed, this.battle_level, SF.SKILL_PIRATE, /*for_ai=*/true),
				SBar.ArtifactData(SU.r(this.battle_seed, 92.2), this.race_seed, this.battle_level, SF.SKILL_STANDARD, /*for_ai=*/true),				
			];
			this.AddEnemy(this.battle_seed+91.1, this.race_name+" Thug", this.battle_level, thug_artis);
			let bully_artis = [
				SBar.ArtifactData(SU.r(this.battle_seed, 93.1), this.race_seed, this.battle_level, SF.SKILL_PIRATE, /*for_ai=*/true),
				SBar.ArtifactData(SU.r(this.battle_seed, 93.2), this.race_seed, this.battle_level, SF.SKILL_STANDARD, /*for_ai=*/true),				
			];
			this.AddEnemy(this.battle_seed+91.2, this.race_name+" Bully", this.battle_level, bully_artis);			
		},
		
		GetUniqueName: function(base_name) {
			if (this.unique_name_counts[base_name] === undefined) {
				this.unique_name_counts[base_name] = 0;
			} else {
				this.unique_name_counts[base_name]++;
			}
			return base_name + " " + String.fromCharCode('A'.charCodeAt() + this.unique_name_counts[base_name]);
		},
		
		AddEnemy: function(seed, name, level, artis /*optional*/) {
			var spot = this.hero_place_function(this.race_size);
			if (spot.x < 0) {
				// Can't find an open position. Abort.
				return;
			}
			let friendly = false;
			
			let tact_hero = new JTact.Hero();
			
			tact_hero._initHero(spot.x, spot.y, friendly, name, this.race_size, level, seed, this.race_seed);
			
 	    //let sbar_crew = new SBar.Crew(name, seed, this.race_seed, level, /*crew_data=*/undefined, /*is_player=*/undefined,
			//														/*is_pirate=*/this.battle_type === SF.BATTLE_PIRATE || this.battle_type === SF.BATTLE_QUEST);
			//sbar_crew.morale = 50;
			//tact_hero.current_crew = sbar_crew;
			//tact_hero.original_crew = SU.Clone(sbar_crew);
			
			// This matches crew. Could make it consistent when consolidating.
			
			tact_hero.SetSpeed((SU.r(seed, 5.2)+0.5)*this.race_speed_mod);
			tact_hero.SetHealth(Math.floor((0.8+SU.r(seed, 5.3)/2)*level*8*this.race_health_mod));
			//tact_hero.morale = sbar_crew.morale;//50;
			tact_hero.morale = 50;
			tact_hero.personality = SF.P_FERAL;  // Temp for just this battle. Gets updated if the hero joins the team.
			tact_hero.for_export_artis = [];
			if (artis) {
				for (let arti of artis) {
					for (let param of arti.params) {
						param.bypass_prereqs = true;
					}
					tact_hero.addBuiltAbility(new SBar.Skill(arti).ability, friendly);
					tact_hero.for_export_artis.push(arti);
				}
			} else {
				// Default abilities.
				for (var i = 0; i < 3; i++) {
					let arti = SBar.ArtifactData(SU.r(seed, i), this.race_seed, level, SF.SKILL_STANDARD, /*for_ai=*/true);
					for (let param of arti.params) {
						param.bypass_prereqs = true;
					}
					if (i == 0) {
						arti.params[0].type = SF.SKILL_DAMAGE;
					} else if (i == 1) {
						// Racial skills on enemies.
						arti.params[0].seed = arti.params[0].raceseed;
					}
					tact_hero.addBuiltAbility(new SBar.Skill(arti).ability, friendly);
					tact_hero.for_export_artis.push(arti);
				}
			}
			this.hero_list.push(tact_hero);
			return tact_hero;
		},
		
		// Mark the specified enemy_crew as not friendly.
		// Check if others join them.
		HandleEnemyCrew: function(heroes, enemy_crew) {
			if (!enemy_crew) {
				return;
			}
			let enemy_names = {};
			for (let enemy of enemy_crew) {
				enemy_names[enemy.name] = true;
			}
			for (let obj in heroes) {
				let hero = heroes[obj];
				if (enemy_names[hero.name]) {
					hero.friendly = false;
				}
			}
			for (let enemy of enemy_crew) {
				S$.DropCrew(enemy.GetCrewIndex());								
			}
			
			/*
			let enemy_personalities = {};
			let enemy_names = {};
			for (let enemy of enemy_crew) {
				enemy_personalities[enemy.personality] = true;
				enemy_names[enemy.name] = true;
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
					}
				}
			}
			// Personality-based joinings.
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (!enemy_names[crew.name]) {
					// Not yet an enemy. Check if they join in.
					if (enemy_personalities[crew.personality] && SU.r(crew.seed, 86.22) < 0.1) {
						enemy_names[crew.name] = true;
					}
				}
			}
			// Mark the hostile crew.
			for (let obj in heroes) {
				let hero = heroes[obj];
				if (enemy_names[hero.name]) {
					hero.friendly = false;
				}
			}
			*/
		},
				
	};
	
	SU.extend(SBar.EnemyBuilder, SBar.Data);
})();
