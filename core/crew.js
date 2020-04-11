/*
Crew are the party members. The first crew is always the player's
(named) character. Crew have one native skill apiece (randomly
selected) as well as a set of attributes and attribute modifiers.
All characters start with a damage skill. Levels are 1-20.

Skills map to JTact abilities. Skill dimensions are:
 - Power: main effect amount (damage, healing, etc.).
 - Duration.
 - Range.
 - Cooldown.
A subset of dimensions applies to each skill. Bonuses are
applied based on the character and their artifacts.
Crews also have character attributes:
 - Max health.
 - Current health.
 - Armor (% reduction, multiplicitive to 1)
 - Shield (flat extra HP. Also works vs. energy weapons.)
 - Move speed.
 - Personality category and fatal flaw.
 - Backstory: based on the crew's seed.
*/
(function() {
	let RELATIVE_LEVEL_START = 3;
  // Allows up to a 0-100-100-100-100 distribution based on proportions.
	// More likely they will get to 100 in a couple categories.
	let MAX_TOTAL_STATS = 400;
	let STAT_LEVEL_MULTIPLIER = MAX_TOTAL_STATS/(SF.MAX_LEVEL+RELATIVE_LEVEL_START);
	
  //var weapon = null;
	// personalities: inept, meek, mysterious, roguelike
	// big list: http://ideonomy.mit.edu/essays/traits.html
  SBar.Crew = function(name, seed, raceseed, level, crew_data, is_player/*optional*/, is_pirate/*optional*/) {
    this._initCrew(name, seed, raceseed, level, crew_data, is_player, is_pirate);
  };

  SBar.Crew.prototype = {
		type: SF.TYPE_HERO,
	  name: null,
		seed: null,
		is_player: false,
		is_pirate: false,
		resist_level: null,
		base_level: null,
		personality: null,
		p_text: null, // Personality text.
		morale: null, // 0 to 100.
		max_morale: SF.MAX_MORALE_SCORE,
		flaw: null,
		gender: null,
		// Combat stats.
		health: null,
		max_health: null,
		base_max_health: null,
		speed: null,
		// Original stats before mods.
		base_speed: null,
		xp: null,
		morale_history: null,
		// Stats lists of numbers: STR, DEX, INT, WIS, CHA. See the SF definitions for indexing - SF.NUM_STATS, SF.STAT_STR, etc.
		stats: null,
		stat_proportions: null,
		bonus_stats: null,  // University trained.

		new_backstory: null,
		artifacts: null,  // List of connected list of arti params.
		placed_starting_artifacts: null,
		salary: null,

    _initCrew: function(name, seed, raceseed, level, crew_data, is_player/*optional*/, is_pirate/*optional*/) {
			if (crew_data) {
				// Loading from stringify or a crew copy. Copy crew fields into this crew.
				for (obj in crew_data) {
					this[obj] = crew_data[obj];
				}
				return;
			}
			if (is_pirate) {
				this.is_pirate = is_pirate;
			}
			this.bonus_stats = [];
			for (let i = 0; i < SF.NUM_STATS; i++) {
				this.bonus_stats.push(0);
			}
			this.base_level = capMaxLevel(level);
			this.resist_level = this.base_level;
			this.xp = SF.LEVEL_XP[this.base_level];
			if (this.base_level === 1) {
				this.xp = 0;
			}
			this.name = name;
			if (is_player) {
				this.GeneratePlayer(this.base_level);
			} else {
				this.GenerateRandom(seed, this.base_level);
			}
			this.raceseed = raceseed;
			this.health = this.max_health;
			this.artifacts = this.GetStartingArtifacts();
			this.morale_history = [];
			this.salary = this.GenerateSalary();  // Note this won't grow as the character levels up.
		},
		
		GeneratePlayer: function(base_level) {
			this.seed = 0;
			this.is_player = true;
			this.personality = SF.P_PLAYER;
			this.p_text = "Unpredictable";
			this.morale = SF.MAX_MORALE_SCORE;
			//this.max_health = 8;
			this.max_health = 6+Math.floor(base_level*(SU.r(this.seed, 6.19)*7));  // 6 - 12 starting hp.
			if (SF.DEBUG_HEALTH) {
				this.max_health = 800;
			}
			this.base_max_health = this.max_health;
			this.speed = 1;
			this.base_speed = this.speed;
			
			//this.base_skills = [new SBar.Skill({seed: this.seed, level: base_level, raceseed: 0, type:SF.SKILL_STANDARD})];
			this.gender = -1;  // Player.
			this.SetStatProportions(SU.r(6.12, 6.13));  // Game-based seed.
			this.UpdateStats();
		},
		
		GenerateRandom: function(seed, base_level) {
			this.seed = seed;
			this.personality = Math.floor(SU.r(seed, 5.15)*4);  // Note feral wont' happen for NPCs, only animals and alphas.
			this.p_text = this.GetPersonalityText(this.personality);
			//this.morale = SF.HAPPY_SCORE;
			this.morale = Math.round(SU.r(seed, 18.33)*50)+35;  // 35-85.
			// Possibility of many genders and gender identities, plus alien possibilities.
			// But actually the pronoun code assumes it's one of three for indexing.
			let num_race_genders = 4;//Math.floor(SU.r(seed, 0.74)*7)+1;
			this.gender = Math.floor(SU.r(seed, 0.742)*num_race_genders);
			this.max_health = 4+Math.floor(base_level*(SU.r(seed, 5.17)*6+4));  // 4 - 9 hp per level.
			if (SF.DEBUG_HEALTH) {
				this.max_health += 800;
			}
			this.base_max_health = this.max_health;
			this.speed = SU.r(seed, 5.2)+0.5;
			this.base_speed = this.speed;
			this.SetFlaw();
			this.SetStatProportions(seed);
			this.UpdateStats();
		},
		
		SetFlaw: function() {
			var flawr = SU.r(this.seed, 92.1);
			switch (this.personality) {
  			case SF.P_INEPT:
					if (flawr < 0.5) {
						this.flaw = SF.FLAW_BAD_MORALE;
					} else {
						this.flaw = SF.FLAW_SICK;
					}
					break;
  			case SF.P_MEEK:
					if (flawr < 0.5) {
						this.flaw = SF.FLAW_FISHING;
					} else {
						this.flaw = SF.FLAW_AGE;
					}
					break;
  			case SF.P_MYSTERY:
					if (flawr < 0.5) {
						this.flaw = SF.FLAW_METAMORPH;
					} else {
						this.flaw = SF.FLAW_MINDGEL;
					}
					break;
  			case SF.P_ROGUE:
					if (flawr < 0.5) {
						this.flaw = SF.FLAW_STEAL_MONEY;
					} else {
						this.flaw = SF.FLAW_MURDER;
					}
					break;
			  default:
					error("no flaw for "+this.personality);
		  }
	  },
		
		SetStatProportions: function(seed) {
			// At level 20 the average is 75 with ranges 25-100.
			// At level 1 the average is 10 with ranges 1 - 25.
			this.stat_proportions = [];
			for (let i = 0; i < SF.NUM_STATS; i++) {
				this.stat_proportions.push(SU.r(seed, 6.15+i));
			}
			// Normalize the total proportion to 1.
			let total_proportion = 0;
			for (let proportion of this.stat_proportions) {
				total_proportion += proportion;
			}
			for (let i = 0; i < SF.NUM_STATS; i++) {
				this.stat_proportions[i] /= total_proportion;
			}
		},
		
		// Updates the crew stats for their level.
		UpdateStats: function() {
			let level = this.base_level;
			level += RELATIVE_LEVEL_START;
			this.stats = [];
			for (let proportion of this.stat_proportions) {
				this.stats.push(capStat(Math.round(proportion*level*STAT_LEVEL_MULTIPLIER)));
			}
			for (let i = 0; i < this.stats.length; i++) {
				this.stats[i] += this.bonus_stats[i];
			}
		},
		
		// Increments a stat by one.
		IncrementStat: function(index) {
			this.stats[index]++;
			this.bonus_stats[index]++;
			S$.BuildOfficerStats();
		},
		
		ResetPersonalityText: function() {
			this.p_text = this.GetPersonalityText(this.personality);
		},		
	
		GetPersonalityText: function(personality) {
			var p_list;
			switch (personality) {
				case SF.P_INEPT:
					p_list = ["Useless", "Inept", "Aimless", "Shiftless"];
					break;
				case SF.P_MEEK:
					p_list = ["Meek", "Quiet", "Serious", "Sensitive"];
					break;
				case SF.P_MYSTERY:
					p_list = ["Mysterious", "Unknown", "Withdrawn", "Hidden"];
					break;
				case SF.P_ROGUE:
					p_list = ["Rouguelike", "Sly", "Sneaky", "Shifty"];
					break;
				case SF.P_FERAL:
					p_list = ["Feral"];
					break;
				default:
					p_list = ["Bland"];
			}
			var index = Math.floor(SU.r(this.seed, 5.521)*p_list.length);
			return p_list[index];
		},
		
		Heal: function(amount) {
			this.health += amount;//Math.floor(amount);
			if (this.health > this.max_health) {
				this.health = this.max_health;
			}
		},
		
		Damage: function(amount) {
			this.health -= amount;
			// TODO: death.
		},
		
		HealFull: function() {
			this.health = this.max_health;
		},
		
		// Puts any crew-based events in the time queue.
		AddEvents: function() {
			if (!this.flaw) {
				return;
			}
			SE.QueueEvent(SU.r(this.seed, 8.21)*3000+300, this.flaw, this.name)	
			/*
			if (this.flaw === SF.FLAW_METAMORPH) {
				SE.QueueEvent(SU.r(this.seed, 8.21)*400+300, "Metamorphosis", this.name)	
			} else if (this.flaw === SF.FLAW_AGE) {
				SE.QueueEvent(SU.r(this.seed, 8.22)*3000+300, "DieOfAge", this.name)	
			}
			*/
		},
		
		HappyMorale() {
			return this.morale >= SF.HAPPY_SCORE;
		},
		
		ContentMorale() {
			return this.morale < SF.HAPPY_SCORE && this.morale >= SF.CONTENT_SCORE;
		},
		
		LowMorale() {
			return this.morale < SF.CONTENT_SCORE;
		},
		
		GetGenderString: function() {
			if (this.gender === -1) {
				return "Player";
			}
			// This tries to account for more than 2 genders and gender identities.
			// Use a race term to make it not clearly defined.
			return ST.getWord(this.raceseed, this.gender+6.12);
		},
		
		GetCrewIndex() {
			for (var i = 0; i < S$.crew.length; i++) {
				if (this.seed === S$.crew[i].seed) {
					return i;
				}
			}
			return -1; // May be a hero not get hired.
		},
		
		GenerateSalary: function() {
			if (this.personality === SF.P_FERAL) {
				return 0;
			}
			return round2good((1+SU.r(this.seed, 8.93))*SF.LEVEL_XP[this.base_level-1]/20 + 1);
		},
		GetSalary: function() {
			return this.salary;
		},
		
		StatsStrings: function() {
			let stats = [];
			stats.push(
				"Level: "+this.base_level,
				"Resist Level: "+this.resist_level,
				"Health: "+this.health+" / "+this.max_health,
				"Speed: "+Math.round(TF.BASE_MOVE*this.speed));
			stats.push("");
			let abilities = "";
			for (let i = 0; i < SF.NUM_STATS; i++) {
				//stats.push(this.stats[i]+" "+SF.STAT_NAME[i]);
				stats.push([SF.STAT_FULL_NAME[i],this.stats[i]+" "+SF.STAT_NAME[i]]);
			}
			stats.push("");
			if (this.is_player) {
				stats.push("(This is You)");
			} else if (this.seed === 0) {
				stats.push(
				  "(This is your clone)",
				  "Personality: "+this.p_text,
					"Morale: "+this.morale+" / "+this.max_morale+" "+SE.MoraleSymbol(this.morale),
					"Weekly Salary: "+SF.SYMBOL_CREDITS+this.GetSalary(),
				);	
			} else {
				stats.push(
				  "Gender: "+this.GetGenderString(),
				  "Personality: "+this.p_text,
					"Morale: "+this.morale+" / "+this.max_morale+" "+SE.MoraleSymbol(this.morale),
					"Bonus: "+new SBar.PersistEffect({name: "", seed: this.seed, level: this.base_level}).Text(),
					"Weekly Salary: "+SF.SYMBOL_CREDITS+this.GetSalary(),
				);	
			}
			return stats;			
		},
		
		// Largely duplicated with SBar.Ship().
		GetStartingArtifacts: function() {
			this.placed_starting_artifacts = false;
			var num_artis = 2;//Math.floor(SU.r(this.seed, 11.12)*3)+1;
			var arti_level = capMaxLevel(this.base_level);
			var artis = [];
			if (this.is_player) {
				//artis = [new SBar.ArtifactData(this.seed+11.01, this.level, 0, SF.SKILL_OMEGA_FRAGMENT)];
				artis.push(SBar.ArtifactData(this.seed+11.01, 0, this.base_level, SF.SKILL_OMEGA_FRAGMENT, /*for_ai=*/false));
			}
			for (var i = 0; i < num_artis; i++) {
				let type = i == 0 ? SF.SKILL_DAMAGE : SF.SKILL_STANDARD;
				if (this.is_pirate) {
					type = SF.SKILL_PIRATE;
				}
				artis.push(SBar.ArtifactData(this.seed+11.21+i, 0, arti_level, type, /*for_ai=*/false));
			}
			//if (!this.is_player) {
			for (let arti of artis) {
				arti.imprinted = true;
				for (let param of arti.params) {
					param.bypass_prereqs = true;
				}
			}
				//}
			return artis;
		},		
		// Deferred placements, since this can take 20-100ms+ to render aliens.
		// Duplicated with SBar.Crew().
		PlaceStartingArtifacts: function() {
			if (this.placed_starting_artifacts) {
				return;
			}
			this.placed_starting_artifacts = true;
			var arti_icons = [];
			var char_shape = new SBar.IconTilesAlien(this.seed, this.raceseed, undefined, this);
			for (var i = 0; i < this.artifacts.length; i++) {
				var arti_icon = new SBar.IconArtifact(null, this.artifacts[i]);
				arti_icons.push(arti_icon);
				// Try to place it. Always install in mid for better chances. Throw it out if no place.
				for (var j = 0; j < 100; j++) {
					var y = Math.floor(SU.r(this.seed, 71.1+i*2.27+j)*40)-20;
					// Small shift on x, to raise likelihood of finding a clear position.
					var x = Math.floor(SU.r(this.seed, 71.2+i*2.28+j)*6)-3;
					var rot = (j%4)*90;
					let clear = false;
				  if (arti_icon.CenterIfValid(x, y, rot, char_shape)) {
						clear = true;
						for (var icon_index = 0; icon_index < arti_icons.length - 1; icon_index++) {
							if (arti_icon.IsOverlap(arti_icons[icon_index])) {
								clear = false;
								break;
							}
						}
				  }					
					if (clear || j == 99) {  // Just pick an invalid location if can't find a place.
						this.artifacts[i].installx = x;
						this.artifacts[i].instally = y;
						this.artifacts[i].rotation = rot;
						break;
					}						
				}
			}			
		},
		
		// Applies the artifact stats, for any SKILL_STATS.
		RebuildArtiStats: function() { 
			this.resist_level = this.base_level;
			this.speed = this.base_speed;
			let health_proportion = this.health / this.max_health;
			this.max_health = this.base_max_health;
			if (this.max_morale != SF.MAX_MORALE_SCORE) {
				let morale_diff = this.max_morale - SF.MAX_MORALE_SCORE;
				this.morale -= morale_diff;
				this.max_morale -= morale_diff;
			}
			for (let full_artifact of this.artifacts) {
				for (let param of full_artifact.params) {
					if (param.type === SF.SKILL_STATS && !full_artifact.backpack)  {
						let skill = new SBar.Skill(full_artifact);
						this.ApplyArtiSkill(skill);
					}
				}
			}
			this.health = Math.round(this.max_health*health_proportion);
		},
		
		ApplyArtiSkill: function(skill) {
			if (!skill.MeetsPrereqs(this.stats)) {
				return;
			}
			if (skill.stats_skills.health) {
				this.max_health += skill.stats_skills.health;
			}
			if (skill.stats_skills.speed) {
				this.speed += skill.stats_skills.speed;
			}
			if (skill.stats_skills.morale) {
				this.morale += skill.stats_skills.morale;
				this.max_morale += skill.stats_skills.morale;
			}
			if (skill.stats_skills.resist_level && skill.stats_skills.resist_level > this.resist_level) {
				this.resist_level = skill.stats_skills.resist_level;
			}
		},
		
		ShowMoraleHistory: function() {
			let message = "";
			for (let i = this.morale_history.length-1; i >= 0; i--) {
				message += this.morale_history[i]+"\n";
			}
			if (this.is_player) {
				message = "(This is you)";
			}
			SU.ShowWindow(this.name+" Morale History", message, undefined, SE.MoraleSymbol(this.morale));			
		},
		
		GetHeroIndex: function() {
			for (let i = 0; i < S$.crew.length; i++) {
				if (S$.crew[i].name == this.name) {
					return i;
				}
			}
			error("can't get hindex");
			return -1;
		},
		
		PurgeCrewForce: function(confirmed) {
			if (!confirmed) {
				return;
			}
			S$.game_stats.crew_purge_attempts++;
			for (let i = 1; i < S$.crew.length; i++) {
				SE.ApplyMorale(SE.MORALE_PURGE_FORCE, S$.crew[i]);
			}
			SE.PartyBattle(/*callback=*/undefined, "The Executive Reorganization", "Change is in the winds.", [this]);
		},
		
		PurgeCrewAccept: function(confirmed) {
			if (!confirmed) {
				return;
			}
			let accepted = SU.r(this.seed, 15.24)*100 < this.morale;
			if (accepted) {
				SU.message("Crew departed");
				S$.DropCrew(this.GetHeroIndex());
				if (SG.activeTier.type === SF.TIER_CHARR) {
					SG.activeTier.activate();  // Refresh crew hero list.
				}
				return;
			}
			SE.ApplyMorale(SE.MORALE_TRIED_PURGE, this);
			message = this.name+" is disinclined to acquiesce to your request.\n\nUse force?";  // Pirates of the Caribbean.
			SU.ConfirmWindow("Executive Reorganization", message, this.PurgeCrewForce.bind(this), "🗡");
		},
		
		PurgeCrew: function() {
			let message = "Really send "+this.name+" off in an escape pod?";
			SU.ConfirmWindow("The Plank", message, this.PurgeCrewAccept.bind(this), "🥾");
		},
		
		// Grabs an image from cache if it can. Only caches crew images, not inspection of other aliens.
		GetCachedImage: function() {
			if (!SG.image_cache[this.name]) {
				let image = new SBar.IconAlien(this.seed, this.raceseed, /*data_type=*/-1, /*data_faction=*/-1, /*is_home_bar=*/false, /*override_random=*/true, {skip_trash_bag: true}).image;
				for (let crew of S$.crew) {
					if (crew === this) {
						SG.image_cache[this.name] = image;
						break;
					}
				}
				return image;
			}
			return SG.image_cache[this.name];		 
		},
		
		ChangeAllHealth: function(amount) {
			this.health += amount;
			this.max_health += amount;
			this.base_max_health += amount;
			if (this.health < 1) this.health = 1;
			if (this.max_health < 1) this.max_health = 1;
			if (this.base_max_health < 1) this.base_max_health = 1;
		},
		
		// Level up. Will call an arti gift for the main hero (seed = 0).
		LevelUp: function() {
			if (this.xp < SF.LEVEL_XP[this.base_level+1]) {
				error("levelingerror");
				return;
			}
			let hp = Math.floor(SU.r(this.seed, this.base_level+1.31)*6)+4;  // 4-9;
			if (this.is_player) {
				hp += 2;
			}
			this.health += hp;
			this.max_health += hp;
			this.base_max_health += hp;
			this.resist_level++;
			this.base_level++;
			SU.message(SF.SYMBOL_LEVEL+this.base_level+" +"+hp+SF.SYMBOL_HEALTH);
			SE.ApplyMorale(SE.MORALE_LEVEL, this);
			if (this.is_player) {
				for (let i = 1; i < S$.crew.length; i++) {
					SE.ApplyMorale(SE.MORALE_LEVEL_PLAYER, S$.crew[i]);
				}
				SU.PushTier(new SBar.PlayerLevelUp(this));
			} else {
				this.UpdateStats();
			}
			this.RebuildArtiStats();
			S$.BuildOfficerStats();
		}
  };

  /////////////////////
	// BEGIN LEVEL UP
  /////////////////////
	let level_flavor_text = [
		["(l0)", ""],
		["(l1)", ""],
		["The way to get started is to quit talking and begin doing.", "Walt Disney."],
		["You feel you are thoroughly on the right path.", "Nethack."],
		["You have not died of dysentery. You have not died from a swarm of soldier ants. You have not died from staying awhile and listening. You're still alive, and this was a triumph.", "Oregon trail, nethack, diablo, portal."],
		["You have learned if you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.", "James Cameron."],
		["You have learned beneath the rule of men entirely great the pen is mightier than the sword.", "Edward Bulwer-Lytton."],
		["You realize that all your life you have been coasting along as if you were in a dream. Suddenly, facing the trials of the last few days, you have come alive.", "Morrowind / Bethesda. "],
		["War. War never Changes. But you have. And you will continue to change... to improve... to succeed.", "Fallout (war never changes)."],
		["Patience... discipline... the call of glory and the show of power is no longer your concern. You know that your time will come.", "Undead in World of Warcraft (patience, discipline)."],
		["It's time to kick ass and chew bubblegum... and you're all outta gum.", "Duke Nukem. But 3D Realms ripped it off too."],
		["Like a knight and a dragon you wonder why it took so long to realize that steel wins battles but gold wins wars.", "Dota, Dragon Knight."],
		["We all make choices in life, but in the end our choices make us.", "Bioshock."],
		["Battlecruiser operational. Goliath online. Jacked up and good to go. Your power is truly overwhelming.", "Starcraft (multiple)."],
		["They say you can stand in the ashes of a trillion dead souls, and ask the ghosts if honor matters. Not that you asked.", "Mass Effect 3."],
		["If life were predictable it would cease to be life, and be without flavor.", "Eleanor Roosevelt."],
		["The world bends itself to your will. Your time is limited, and you will not waste it living someone else's life. The path forward will not be without challenges, but it is now your path.", "Steve Jobs (partial)."],
		["With great power comes great responsibility. Your power is great, and you wonder... to whom are you responsible? Do you not answer to only yourself?", "Popularized by Stan Lee / Spider Man (partial)."],
		["You look at the world, into it and it looks back at you. Sometimes you can't see yourself clearly until you see yourself through the eyes of others.", "Ellen DeGeneres."],
		["Mental acuity... finesse and stature... total awareness... you now know the truth: there is no spoon.", "The Matrix (spoon)."],
		["Something is wrong. You see through the world, and it is not the world you knew. The cake was a lie. And you see corruption spreading... a path forward... and Shaka when the walls fell. You feel awash with guilt. You must find a way to repair the distored and fracturing world.", "Cake is from Portal. Shaka from Star Trek: TNG. The rest is your destiny."],
	]

	// Handles artifact selection for a player leveling.
  SBar.PlayerLevelUp = function(crew) {
    this._initPlayerLevelUp(crew);
  };

  SBar.PlayerLevelUp.prototype = {
		crew: null,
		seed: null,
		artis: null,  // 3 candidate artis.
		context: null,
    _initPlayerLevelUp: function(crew) {
			this.crew = crew;
			this.seed = this.crew.seed + 7.21 + this.crew.base_level;
			this.artis = [];
		  this.context = SC.layer2;
		},

    activate: function() {
      SG.activeTier = this;
			SU.clearTextNoChar();
			SU.addText("1: Inspect / Select");
			SU.addText("2: Inspect / Select");
			SU.addText("3: Inspect / Select");
			SU.addText("Q: Quote Source");
			
			this.AddArtiCandidate(this.GetArtiLevel(S$.xp_level.combat), SF.SKILL_STANDARD);
			let trade_type = SU.r(this.seed, this.crew.base_level+81.38) < 0.4 ? SF.SKILL_STATS : SF.SKILL_BOOST;  // Boost is a bit more interesting.
			this.AddArtiCandidate(this.GetArtiLevel(S$.xp_level.trade), trade_type);
			this.AddArtiCandidate(this.GetArtiLevel(S$.xp_level.arch), SF.SKILL_ALPHA);
			
			this.DrawBackground();
			this.DrawArtis();
		},
		
		GetArtiLevel(type_level) {
			let level = this.crew.base_level - Math.floor((this.crew.base_level-type_level)/2);
			if (level > this.crew.base_level) {
				level = this.crew.base_level;
			}
			return level;
		},
		
		AddArtiCandidate(level, type) {
			this.artis.push(SBar.ArtifactData(this.seed + 4.45 + this.artis.length, this.crew.raceseed, level, type));
		},
		
		DrawBackground: function() {
			SU.DrawCrewBackground(this.context, this.crew.seed);
			
			/*
			let size = 15;
      let r = Math.floor(SU.r(this.crew.seed, 12.5) * 100);
      let g = Math.floor(SU.r(this.crew.seed, 12.6) * 100);
      let b = Math.floor(SU.r(this.crew.seed, 12.7) * 100);
			let fill_pattern = SU.GetFillPattern(size, this.crew.seed, r, g, b);
      this.context.drawImage(fill_pattern, 0, 0, size, size, 0, 0, SF.WIDTH, SF.HEIGHT);
			let colorStops2 = [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,1)'];
			SU.fillRadGrad(this.context, SF.HALF_WIDTH, SF.HALF_HEIGHT, SF.HALF_WIDTH, colorStops2);
			*/
			
			
			let alien_image = this.crew.GetCachedImage();
      this.context.drawImage(alien_image,  0, 0);
			// No bags here.
			
			let orig_stats = SU.Clone(this.crew.stats);
			this.crew.UpdateStats();
			let new_stats = this.crew.stats;
			
			// Double-draw to get the measurement.
			let y = this.DrawPlayerLevelText(orig_stats, new_stats);
			let box_height = y - 25;
      var colorStops = [0, 'rgba(130,100,130,0.7)', 1, 'rgba(100,90,100,0.8)'];
      SU.rectCornerGrad(this.context, 8, SF.HALF_WIDTH-260, 17, 520, box_height, colorStops, 2, "#000");
			this.DrawPlayerLevelText(orig_stats, new_stats);
			/*
			y = 50;
      y += SU.wrapText(this.context, "LEVEL "+this.crew.base_level, SF.HALF_WIDTH, y, 500, 25, SF.FONT_XLB:, '#FFF','center');
      y += SU.wrapText(this.context, level_flavor_text[this.crew.base_level][0], SF.HALF_WIDTH, y, 500, 25, SF.FONT_L, '#FFF','center');
      y += SU.wrapText(this.context, "Choose a reward", SF.HALF_WIDTH, y, 500, 20, SF.FONT_M, '#AAA','center');
			*/
		},
		
		// Returns height, for measurement.
		DrawPlayerLevelText: function(orig_stats, new_stats) {
			let y = 50;
      y += SU.wrapText(this.context, "LEVEL "+this.crew.base_level, SF.HALF_WIDTH, y, 500, 25, SF.FONT_XLB, '#FFF','center');
      y += SU.wrapText(this.context, level_flavor_text[this.crew.base_level][0], SF.HALF_WIDTH, y, 500, 25, SF.FONT_L, '#FFF','center');
			
			y += 10;
			for (let i = 0; i < SF.NUM_STATS; i++) {
				let diff = new_stats[i] - orig_stats[i];
	      SU.text(this.context, ""+new_stats[i]+" "+SF.STAT_NAME[i], SF.HALF_WIDTH+90, y, SF.FONT_M, SF.STAT_TEXT_COLOR,'right');
	      y += SU.wrapText(this.context, "+"+diff+" "+SF.STAT_FULL_NAME[i], SF.HALF_WIDTH-90, y, 500, 20, SF.FONT_M, "#FFF",'left');
			}
			y += 10;
			
      y += SU.wrapText(this.context, "Choose a reward", SF.HALF_WIDTH, y, 500, 20, SF.FONT_M, '#FFF','center');
			return y;
		},
		
		
		DrawArtis: function() {
			for (let i = 0; i < this.artis.length; i++) {
				let arti = this.artis[i];
				let skill = new SBar.Skill(arti);
				
				// width is 1k. Place centers at 200, 500, 800.
				let x = 200 + i*300;
				
				// These are similar to the boxes in 1buildingR.drawMenuInternal().
        var width = 250;
        var height = 500;
        var colorStops = [0, 'rgba(100,130,100,1)', 1, 'rgba(90,100,90,1)'];
        SU.rectCornerGrad(this.context, 8,  x-width/2, SF.HALF_HEIGHT, width, height/2, colorStops, 'rgb(0,0,0)', 2);
				
				
				var arti_icon = new SBar.IconArtifact(this.context, arti);
				arti_icon.DrawAt(x, SF.HALF_HEIGHT+150);
				let y = SF.HALF_HEIGHT+30;
	      y += SU.wrapText(this.context, skill.name+" ("+SF.SYMBOL_LEVEL+skill.level+")", x, y, 240, 25, SF.FONT_L, '#FFF','center');
	      SU.wrapText(this.context, skill.SummaryText(), x, y, 240, 25, SF.FONT_L, '#FFF', 'center');

			}
		},

		Inspect: function(index) {
			let me = this;
			let callback = function(completed) {
				S$.skip_xp = false;
				if (completed) {
					me.teardown();
				}
			}
			S$.skip_xp = true;
			SU.PushTier(new SBar.ArtifactComplexRenderer(this.crew, this.artis[index], /*view_only=*/false, /*browse=*/true, callback));
		},
		
		QuoteDetails() {
			let text = "\""+level_flavor_text[this.crew.base_level][0]+"\"\n\n"+level_flavor_text[this.crew.base_level][1];
			SU.ShowWindow("Quote Details", text, /*callback=*/undefined, '📜');
		},

    handleKey: function(key) {
      switch (key) {
		    case SBar.Key.NUM1:
		    case SBar.Key.NUM2:
		    case SBar.Key.NUM3:
					this.Inspect(key-SBar.Key.NUM1);
					return;
		    case SBar.Key.Q:
					this.QuoteDetails();
					return;
				default:
		      error("unrecognized key pressed in plevel: " + key);
			}
    },
		
    teardown: function() {
			SU.PopTier();
    },
  };	
  /////////////////////
	// END LEVEL UP
  /////////////////////
})();
