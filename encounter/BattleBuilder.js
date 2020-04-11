/*
 * Helper to build a battle object
 */
(function() {	
	let MAX_ENEMIES = 10;
	
	// Reminder that all the hero names need to be unique.
	SBar.BattleBuilder = function(battle_type, data, attacking, callback, /*optional*/params) {
		this._initBattleBuilder(battle_type, data, attacking, callback, params);
	};

	SBar.BattleBuilder.prototype = {
		type: SF.TYPE_BATTLE_BUILDER,
		battle_type: null,
		attacking: null,
		encounter_data: null,
		heroes: null,
		seed: null,
		data: null,
		hero_places1: null,  // array of {x, y, dist}
		hero_places2: null,
		hero_used_places: null,  // Set of "x,y".
		s: null, // Random incrementing seed.
		enemy_race: null,
		callback: null,
		description: null,
		battle_name: null,
		enemy_crew: null,
		reward: null,
		race_warning: false,
		
		_initBattleBuilder: function(battle_type, data, attacking, callback, params) {
			this.battle_type = battle_type;
			this.data = data;
			this.seed = data.seed;
			this.attacking = attacking;
			this.callback = callback;

			// Overrides: seed, reward, battle name, description, enemy_crew, etc.
			for (let obj in params) {
				this[obj] = params[obj];
			}
		},

    activate: function() {
			S$.game_stats.battles_engaged++;
			if (this.battle_type === SF.BATTLE_ANIMAL && this.data.parentData && this.data.parentData.type === SF.TYPE_PLANET_DATA) {
				// Animal types correspond to the planet.
				this.enemy_race = this.data.parentData.seed;
			} else if (this.data.raceseed) {
				this.enemy_race = this.data.raceseed;
			} else if (this.data.parentData && this.data.parentData.raceseed) {
				this.enemy_race = this.data.parentData.raceseed;
			} else {
				this.enemy_race = -1;
			}
			if (this.battle_type === SF.BATTLE_RACE_MILITARY && this.enemy_race !== SF.RACE_SEED_ALPHA) {
				if (!S$.IsRaceKnown(this.enemy_race)) {
					S$.AddKnownRace(this.enemy_race);
					this.race_warning = true;
					let phrases = [
						"Looks like you stumbled into the wrong area of space. We'll give you a chance to run.",
						"Looks like you took a wrong turn. We best not see you around here again.",
						"Run, run from my gun.",  // Pumped up Kicks.
						"Just walk away, and we'll spare your lives. Just walk away.",  // Mad Mad (original).
						"There was a rumor that you lived to tell your tale. Just this once we'll help that rumor come true.",
						"Welcome to the most dangerous game. We'll give you a head start.",  // Richard Connell short story.
						"It's fortunate you visited while our boss is on the can.",
						"We're planning to open fire in 3... 2...",
					];
					this.description = phrases[Math.floor(SU.r(this.seed, 3.12)*phrases.length)];
					S$.grace_period_time_start = S$.time;
				} else if (S$.grace_period_time_start + SF.HOSTILE_RACE_GRACE_PERIOD_HOURS <= S$.time) {
					this.description = "Best keep running. Next time you won't be so lucky.";
					this.race_warning = true;
				}
			}
			// DEBUG
			//this.attacking = false;//SU.r(this.seed, 5.21) < 0.5;			
			this.s = 0;
		
			TG.data = new SBar.TactData();

			let map_sizex = 84;
			let map_sizey = 77;
			this.map_builder = new SBar.MapBuilder(this.data, map_sizex, map_sizey);
			this.map_builder.BuildBackground();
			this.map_builder.BuildMap();
			this.hero_places1 = [];
			this.hero_places2 = [];			
			this.hero_used_places = {};
			let friendly_center_x;
			let friendly_center_y;
			let enemy_center_x;
			let enemy_center_y;
			//if (SU.r(this.seed, 22.1) < 0.3) {  // Random placement.
		  if (!this.attacking) {  // Ambushed friendly have random placement.
				friendly_center_x = -1;
				friendly_center_y = -1;
			} else {
				// Pick a center, not too close to the edge. Don't really want to compute the map
				// size here, so stay within the inner 2/3 of a full map.
			  friendly_center_x = Math.floor((SU.r(this.seed, 22.3)*2/3+1/6) * map_sizex);
			  friendly_center_y = Math.floor((SU.r(this.seed, 22.4)*2/3+1/6) * map_sizey);
			}
			//if (SU.r(this.seed, 22.2) < 0.3) {  // Random placement.
			if (this.attacking) {  // Ambushed enemies have random placement.
				enemy_center_x = -1;
				enemy_center_y = -1;
			} else {
				// Same as for friendlies.
			  enemy_center_x = Math.floor((SU.r(this.seed, 22.5)*2/3+1/6) * map_sizex);
			  enemy_center_y = Math.floor((SU.r(this.seed, 22.6)*2/3+1/6) * map_sizey);
			}
			if (this.data.type === SF.TYPE_ALPHA_DANCE) {
				// Put the biggie in the middle.
				enemy_center_x = Math.floor(map_sizex/2);
				enemy_center_y = Math.floor(map_sizey/2);
			}
			this.map_builder.GetHeroPlaces(friendly_center_x, friendly_center_y, enemy_center_x, enemy_center_y, this.hero_places1, this.hero_places2);
			let available_places = this.hero_places1.length+this.hero_places2.length;
			if (available_places < S$.crew.length + MAX_ENEMIES) {
				// The map might not be big enough. Force enough space.
				this.map_builder.BuildMap(/*force_larger_room=*/true);
				this.hero_places1 = [];
				this.hero_places2 = [];			
				this.hero_used_places = {};
				this.map_builder.GetHeroPlaces(Math.floor(map_sizex/2), Math.floor(map_sizey/2), -1, -1, this.hero_places1, this.hero_places2);
			}
			
			let me = this;
			let hero_place_function = function(size) {
				return me.GetNextHeroSpot(me.hero_places2, size);
			}
			this.heroes = [];
			let enemy_builder = new SBar.EnemyBuilder(this.battle_type, this.data.level, this.enemy_race, this.seed, this);
			if (this.attacking && this.data.type !== SF.TYPE_ALPHA_DANCE) {  // Dance needs to add biggie first.
				this.AddCrew();  // Needs to come after the map, for the globals.
				enemy_builder.AddEnemies(this.heroes, hero_place_function);
			} else {
				enemy_builder.AddEnemies(this.heroes, hero_place_function);
				this.AddCrew();
			}
			// Biggie needed to be added first, but they'll go last.
			enemy_builder.CheckRequeueAlphaBoss();
			if (this.enemy_crew) {
				enemy_builder.HandleEnemyCrew(this.heroes, this.enemy_crew);
			}
			
			this.AddEffectAreas();
			let battle_name = this.battle_name ? this.battle_name : ST.BattleName(this.seed, this.attacking, this.data.name);	
			this.encounter_data = new SBar.EncounterData({
				battle_name: battle_name, seed: this.seed, level: this.data.level, battle_type: this.battle_type, 
				attacking: this.attacking, heroes: this.heroes, building_data: this.data, enemy_race: this.enemy_race,
			  race_warning: this.race_warning});
			if (this.reward) {
				this.encounter_data.reward = this.reward;
			}
			if (this.description) {
				this.encounter_data.description = this.description;
			}
			if (S$.battle_effect) {
				this.encounter_data.battle_effect = S$.battle_effect;
			}
			this.encounter_data.num_drinks = S$.NumDrinks();

			this.encounter_data.activateTier(this.callback);
		},

    // Map mods. Added after heroes for controller setup.
		AddEffectAreas: function() {
			if (!this.data.parentData || this.data.parentData.type !== SF.TYPE_PLANET_DATA || this.data.parentData.ggiant) {
				// Only effect areas on planets with surfaces.
				return;
			}
			let x = this.data.x;
			let y = this.data.y;
			let planet_data = this.data.parentData;
			let height = planet_data.GetTerrainHeight(x, y);
			//let terrain = planet_data.GetTerrainType(x, y);
			let heat = planet_data.GetTerrainHeat(x, y);

			let type = null;
			let amount;
			if (heat > 370) {
				type = JTact.FireArea;
				amount = Math.round(SU.r(this.seed, 8.22)*this.data.level/2)+1;
			} else if (heat < 273) {
				type = JTact.SlowArea;
				amount = round10th(SU.r(this.seed, 8.23)/2)+0.3;
			} else if (height > 50) {
				// Range could be high or low.
				type = JTact.RangeArea;
				if (SU.r(this.seed, 8.24) < 0.5) {
					amount = round10th(SU.r(this.seed, 8.25)/2)+1.2;
				} else {
					amount = round10th(SU.r(this.seed, 8.26)/2)+0.3;
				}
				amount = round10th(SU.r(this.seed, 8.27)/2)+0.4;
			} else {
				// Random defend or speed area.
				if (SU.r(this.seed, 8.28) < 0.3) {
					type = JTact.SlowArea;
					amount = round10th(SU.r(this.seed, 8.29)/2)+1.2;
				} else if (SU.r(this.seed, 8.30) < 0.3) {
					type = JTact.DefendArea;
					amount = round10th(SU.r(this.seed, 8.31)/2)+0.3;
				}
			}
			if (type === null) {
				return;
			}
			let size = Math.round(SU.r(this.seed, 8.32)*30)+10;
			
			for (let attempt = 0; attempt <= 5; attempt++) {
				let x = Math.floor(SU.r(this.seed, 9.01+attempt)*this.map_builder.map_sizex);
				let y = Math.floor(SU.r(this.seed, 9.02+attempt)*this.map_builder.map_sizey);
				if (this.map_builder.IsValid(x, y)) {
			    TG.data.mapEffects.add(new type(x, y, size, amount));
					return;
				}
			}
		},
		
		// Heroes.
		AddCrew: function() {
			for (hero of S$.crew) {
				let tact_hero = this.AddCrewMember(hero);
			}
		},
		
		AddCrewMember: function(sbar_crew) {
			let tact_hero = new JTact.Hero();
			var size = Math.floor(SU.r(sbar_crew.seed, 4.21)*3)*2+3;
			if (sbar_crew.raceseed === SF.RACE_SEED_HUMAN || sbar_crew.raceseed === SF.RACE_SEED_ALPHA) {
				size = 5;
			}
			var spot = this.GetNextHeroSpot(this.hero_places1, size);
			if (spot.x < 0) {
				// Can't find an open position. Abort.
				return;
			}
			
			let friendly = true;
      tact_hero._initHero(spot.x, spot.y, friendly, sbar_crew.name, size, sbar_crew.resist_level, sbar_crew.seed, sbar_crew.raceseed);
			tact_hero.current_crew = sbar_crew;
			tact_hero.original_crew = SU.Clone(sbar_crew);
			tact_hero.UpdateIcon();  // Needed after setting the original_crew for the custom icon.
			tact_hero.SetSpeed(sbar_crew.speed);
			tact_hero.health = sbar_crew.health;
			tact_hero.morale = sbar_crew.morale;
			tact_hero.personality = sbar_crew.personality;
			tact_hero.max_health = sbar_crew.max_health;
			tact_hero.is_player = sbar_crew.is_player;
			tact_hero.for_export_artis = [];
			for (artifact of sbar_crew.artifacts) {
				if (!artifact.backpack) {
					let arti_clone = SU.Clone((artifact));
					for (let single of arti_clone.params) {
						single.for_ai = false;
					}
					let skill = new SBar.Skill(arti_clone);
					if (skill.ability) {  // Might be a boost module of some type.
						if (skill.MeetsPrereqs(sbar_crew.stats)) {
							tact_hero.addBuiltAbility(skill.ability, friendly);
							tact_hero.for_export_artis.push(artifact);
						}
					}
				}
			}
			this.heroes.push(tact_hero);
			return tact_hero;
		},
	
		GetNextHeroSpot(sorted_places, size) {
			if (sorted_places.length <= 0) {
				return {x: -1, y: -1};
			}
			var spot = sorted_places.pop();
			while (this.hero_used_places[(spot.x+","+spot.y)] !== undefined) {
				if (sorted_places.length <= 0) {
					return {x: -1, y: -1};
				}
				var spot = sorted_places.pop();
			}
			this.hero_used_places[(spot.x+","+spot.y)] = true;
			
			this.s++;
			var xoff = 0;
			var yoff = 0;
			if (size == 5) {
				xoff = Math.floor(SU.r(this.seed, this.s+0.1) * 3) - 1;
				yoff = Math.floor(SU.r(this.seed, this.s+0.2) * 3) - 1;
			} else if (size == 3) {
				xoff = Math.floor(SU.r(this.seed, this.s+0.1) * 5) - 2;
				yoff = Math.floor(SU.r(this.seed, this.s+0.2) * 5) - 2;
			}
		  spot.x += xoff;
			spot.y += yoff;
			
			return spot;
		},
		
		// Remove covered places from consideration.
		FillLargeCharPlace(x, y, size) {
			let cover_rad = Math.floor(size/2)+5;  // 4 is rad of a large stamp.
			for (let candidate of this.hero_places1) {
				if (this.map_builder.map.getHexDist(candidate.x, candidate.y, x, y) <= cover_rad) {
					this.hero_used_places[(candidate.x+","+candidate.y)] = true;
				}
			}
		},
		
	};
	
	SU.extend(SBar.BattleBuilder, SBar.Data);
})();
