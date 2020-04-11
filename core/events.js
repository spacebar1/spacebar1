/*
 Event framework. Global 'SE'.

 Passage of time can trigger events. And events get registered to trigger at some
 specific time. Time passage will halt at the next event.
*/
(function() {
	var base_seed = 1;
	let event_num = 1.1;  // For random seeds. Better than time because time doesn't always advance on interrupts.
	
	// Personality types. Copied from SBar.Final.
	let INEPT = 0;
	let MEEK = 1;
	let MYSTERY = 2;
	let ROGUE = 3;
	let FERAL = 4;
	
  SBar.Events = {
		/*
		************************************************************
		  MORALE FIELD DEFINITIONS
		  1. morale seed (to be combined with crew seed).
		  2. message text for the moral history.
		  3. default morale change for the event.
		  4. variance (required, can be 0. non-negative. will get hero-deterministic-random added / subtracted).
		  5+. pairs of {personality, change} (no variance).
		************************************************************
		*/
		MORALE_PAY: [1.1, "Payday", 2, 1],  // Weekly pay.
		MORALE_NOPAY: [1.2, "Unpaid", -20, 10],
		MORALE_LARGE_PARTY: [1.3, "Too many crew", -2, 1, INEPT, 1],
		MORALE_MULTIPLE_PIRATE: [1.4, "Rogues fly solo", 0, 0, ROGUE, -1],
		MORALE_MEEK_PIRATE: [1.5, "Bully in crew", 0, 0, MEEK, -1],
		MORALE_FRIEND_IN_PARTY: [1.6, "Friend in party", 1, 0, ROGUE, -1],
		MORALE_CLONE: [2.1, "Clone in crew", -1, 2],
		MORALE_GAIN_ARTI: [2.2, "Gained item", 2, 0],
		MORALE_LOSE_ARTI: [2.3, "Lost item", -8, 2],  // They get upset if you remove their stuff.
		MORALE_CONTRABAND: [2.4, "Contraband", -2, 1, ROGUE, 4],
		MORALE_LOSE_TEAMMATE: [2.5, "Death of friend", 0, 1, MEEK, -5, MYSTERY, -3],
		MORALE_LEVEL: [2.6, "Level up", 10, 5],
		MORALE_LEVEL_PLAYER: [2.7, "Captain level up", 1, 2],
		MORALE_DRUNK: [2.8, "Drunk", 0, 1, ROGUE, 2],  // Some like to drink, some don't.
		MORALE_FERAL: [3.1, "Feral", 0, 0, FERAL, -1],
		MORALE_TRIED_PURGE: [3.2, "Tried to Purge", -5, 2],
		MORALE_PURGE_FORCE: [3.3, "Purge with Force", -5, 2],
		MORALE_NO_FISHING: [3.4, "Denied Fishing Holiday", -18, 5],
		MORALE_HOTEL_LEVEL1: [3.5, "Nice Hotel Services", 1, 1, ROGUE, -1],
		MORALE_HOTEL_LEVEL2: [3.6, "Great Hotel Services", 2, 2, ROGUE, -1],
		MORALE_HOTEL_LEVEL3: [3.7, "Amazing Hotel Services", 3, 2, ROGUE, -1],
		MORALE_BAD_MOOD: [4.1, "Woke up in a bad mood", -20, 15],
		MORALE_TEAM_BAD_MOOD: [4.2, "Crewmember in a foul mood", -5, 4],
		MORALE_MIND_GEL_GOOD: [4.3, "Mind gelled", 15, 10],
		MORALE_MIND_GEL_BAD: [4.4, "Mind gelled", -40, 15],
		MORALE_STOLE_MONEY: [4.5, "No particular reason", 10, 5],
		MORALE_CREW_MURDERED: [4.6, "Murder on the deck", -15, 5],
		MORALE_CAUSED_MURDER: [4.7, "Murder on the deck", 10, 5],
		MORALE_9TIMES_POSITIVE: [5.1, "Mysterious visitor", 5, 3, MEEK, 3],
		MORALE_9TIMES_NEGATIVE: [5.2, "Mysterious visitor", -5, 3, INEPT, 3],  // Intentionally asymmetric with above.
		// Battle-related.
		MORALE_BATTLE_FRIENDLY: [9.1, "We're the baddies", -1, 1, MEEK, -3, ROGUE, 1],  // Also includes blind brawl.
		MORALE_BATTLE_NEUTRAL: [9.2, "Animal hunting", 0, 1, MEEK, -3, ROGUE, 1],
		MORALE_BATTLE_ENEMY: [9.3, "Doing right", 1, 1, MEEK, -3, ROGUE, 1],
		MORALE_WIN: [9.4, "Won a battle", 1, 1, ROGUE, 1],
		MORALE_FLEE: [9.5, "Fled", -1, 1, INEPT, 1, MEEK, 1, ROGUE, -1],
		MORALE_ABANDON: [9.6, "Captain tried to abandon ship", -20, 15, ROGUE, 10],
		MORALE_JOINED_ABANDON: [9.7, "Survived an abandon attempt", -25, 15, ROGUE, 10],
		MORALE_SLAVERY_YES: [9.8, "The Good of the Many", -10, 5],
		MORALE_SLAVERY_NO: [9.9, "The Good of the One", 5, 3],
		
		MoraleSymbol: function(morale) {
			if (morale < SF.CONTENT_SCORE) {
				return SF.SYMBOL_SAD;
			} else if (morale < SF.HAPPY_SCORE) {
				return SF.SYMBOL_CONTENT;
			} else {
				return SF.SYMBOL_HAPPY;
			}
		},
		
		// Print a message if morale changed past a boundary.
		PrintBoundaryMorale: function(old_morale, new_morale, name) {
			let new_symbol = this.MoraleSymbol(new_morale);
			if (new_symbol != this.MoraleSymbol(old_morale)) {
				SU.message(name+" "+new_symbol);
			}
		},
		
		// Note 'crew' can be from crew.js or hero.js. It must have: seed, morale, personality.
		ApplyMorale(morale_data, crew) {
			let old_morale = crew.morale;
			crew.morale += morale_data[2];
			if (morale_data[3] !== 0) {
				// Add or subtract up to the variance value.
				// This is random each time run mainly because there's no morale-type specific value to make it hero specific.
				crew.morale += Math.floor(SU.r(crew.seed, 16.1+morale_data[0])*(morale_data[3]*2))+1 - morale_data[3];
			}
			for (let i = 4; i < morale_data.length; i += 2) {
				let personality = morale_data[i];
				if (personality === crew.personality) {
					crew.morale += morale_data[i+1];
				}
			}
			crew.morale = capMorale(crew.morale);
			if (old_morale == crew.morale) {
				return;
			}
			this.PrintBoundaryMorale(old_morale, crew.morale, crew.name);
			let morale_change = crew.morale-old_morale;
			let morale_change_string = morale_change >= 0 ? "+"+morale_change : ""+morale_change;
			// Update the morale history.
			let true_crew = crew;
			if (crew.current_crew) {
				// This is a battle hero.js. Go to the crew.js for history.
				true_crew = true_crew.current_crew;
			}
			if (true_crew.morale_history) {
				if (true_crew.morale_history.length > 16) {
					true_crew.morale_history.splice(0, 1);
				}
				true_crew.morale_history.push(SU.TimeString(S$.time)+": "+morale_change_string+" ("+crew.morale+") "+morale_data[1]);
			}
		},

		MoraleDayPassed: function() {
			let pirate_count = 0;
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				// MORALE_LARGE_PARTY.
				let max_size = Math.floor(SU.r(crew.seed, 31.1)*4)+3;  // 3-6.
				if (S$.crew.length > max_size) {
					this.ApplyMorale(this.MORALE_LARGE_PARTY, crew);
					SU.message("Crew Infighting "+crew.name);
				}
				// MORALE_MULTIPLE_PIRATE.
				if (crew.is_pirate || crew.personality === ROGUE) {
					++pirate_count;
				}
				if (crew.personality === FERAL) {
					this.ApplyMorale(this.MORALE_FERAL, crew);
					SU.message("Feral crew "+crew.name);
				}
				// MORALE_CLONE.
				for (let j = 0; j < i; j++) {
					// n^2 is ok here since they are short lists.
					// A clone will have a longer name, and be later in the crew list.
					let candidate_name = S$.crew[j].name;
					if (candidate_name == crew.name.substring(0, candidate_name.length)) {
						this.ApplyMorale(this.MORALE_CLONE, crew);
						SU.message("Unhappy clone "+crew.name);
					}
				}
			}
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (pirate_count > 1) {
					// Negative morale for additional pirates.
					this.ApplyMorale(this.MORALE_MULTIPLE_PIRATE, crew);
					SU.message("Crew Infighting "+crew.name);
				}
				if (pirate_count > 0 && crew.personality === MEEK) {
					this.ApplyMorale(this.MORALE_MEEK_PIRATE, crew);
					SU.message("Crew Infighting "+crew.name);
				}
			}
		},

		
		MoraleWeekPassed: function() {
			// Payday.
			let total_salary = 0;
			for (let i = 1; i < S$.crew.length; i++) {
				total_salary += S$.crew[i].GetSalary();
			}
			if (total_salary <= 0) {
				return;
			}
			
			if (S$.crew.length > 1) {
				SU.message("Payday");
			}
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				let salary = crew.GetSalary();
				if (S$.credits < salary) {
					SU.message("Cannot pay "+crew.name);
					this.ApplyMorale(SE.MORALE_NOPAY, crew);
				} else {
					S$.RemoveCredits(salary);
					this.ApplyMorale(SE.MORALE_PAY, crew);
				}
			}
			// Check personality friends.
			let personalities = {};
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (crew.personality != FERAL) {
					if (!personalities[crew.personality]) {
						personalities[crew.personality] = 1;
					} else {
						personalities[crew.personality]++;
					}
				}
			}
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (personalities[crew.personality] > 1) {
					this.ApplyMorale(SE.MORALE_FRIEND_IN_PARTY, crew);
				}
			}
		},
		
		/*
			// End morale.
		*/		
		
		message_passed_time: 0,
		message_timeout: null,

		// A defined block of time passed. Check morale ando ther changes.
		CheckPeriodicChanges: function(old_time, new_time) {
			if (Math.floor(old_time/168) != Math.floor(new_time/168)) {
				this.MoraleWeekPassed();
				this.CheckBossMove();
			}
			if (Math.floor(old_time/24) != Math.floor(new_time/24)) {
				this.MoraleDayPassed();
			}
		},
			
		PassTime: function(duration) {
			if (S$.events.length > 0 && S$.events[0].time <= S$.time + duration) {
				var event = S$.events[0];
        S$.events.splice(0, 1);
				S$.time = event.time;
				//SBar.Events[event.name](event.params);
				this.TriggerEvent(event.type, event.crew_name);
				return false;
			}
			if (!this.PassTimeAnywhere(duration)) {
				return false;
			}
			switch (SG.activeTier.type) {
				case SF.TIER_STARMAP:
					if (!this.PassTimeInterstellar(duration)) {
						return false;
					}
					break;
				case SF.TIER_SYSTEM:
					if (!this.PassTimeSystem(duration)) {
						return false;
					}
					break;
				case SF.TIER_PLANETSIDER:
					// Generally mining a planet or asteroid.
					let data = SG.activeTier.data;
					if (data.type === SF.TYPE_PLANET_DATA) {
						if (!this.PassTimePlanetsidePlanet(duration)) {
							return false;
						}
					} else {  // Asteroid.
						if (!this.PassTimePlanetsideAsteroid(duration)) {
							return false;
						}
					}
					break;
				case SF.TIER_BUILDING:
					// Nothing special yet.
					break;
				default:
					//error("unknown passtime type "+SG.activeTier.type);
					break;
			}
			let orig_time = S$.time;
			S$.time += duration;
			S$.game_stats.player_time_passed += duration;
			this.CheckPeriodicChanges(orig_time, S$.time);
			this.AppendTimeout(duration);
			this.Heal(duration);
			return true;
		},
		
		PassTimeSystem: function(duration) {
			// Chance of police showing up.
			let data = SG.activeTier.data;
			if (data.in_alpha_bubble) {
				// Encounters handled elsewhere.
				return true;
			}
			let rand = SU.r(event_num++, 9.31);
			if (!data.race_controls_system) {
				return true;
			}
			// Chance of police showing up.
			let prob_no_police = 0.95;
			if (rand < Math.pow(prob_no_police, duration)) {
				return true;
			}
			// Illegal tech scan.
			let contraband_name = "";
			for (let arti of S$.ship.cargo) {
				for (let param of arti.params) {
					if (param.cargo_type === SF.CARGO_CONTRABAND) {
						contraband_name = "goods";
					}
				}
			}
			if (S$.tow_ship) {
				for (let arti of S$.tow_ship.cargo) {
					for (let param of arti.params) {
						if (param.cargo_type === SF.CARGO_CONTRABAND) {
							contraband_name = "goods";
						}
					}
				}
			}
			for (let crew of S$.crew) {
				for (let arti of crew.artifacts) {
					for (let param of arti.params) {
						if (param.type == SF.SKILL_PIRATE_DAMAGE || param.type == SF.SKILL_PIRATE) {
							contraband_name = "technology";
						}
					}
				}
			}
			if (S$.ship.ship_type === SF.SHIP_PIRATE || (S$.tow_ship && S$.tow_ship.ship_type === SF.SHIP_PIRATE)) {
				contraband_name = "equipment";
			}
			if (contraband_name == "") {
				return true;
			}
			S$.ChangeRaceAlignment(data.raceseed, -5);
			let callback = function() {
				
			}
			SG.death_message = "Killed by running contraband.";
			SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_POLICE, data, /*attacking=*/false, callback,
				{description: "The local law enforcement scanned your ship and discovered illegal "+contraband_name+"."}));
			return false;
		},
		
		// Adds an event to the timer queue. event_name is the function name to run (currently
		// scoped to SBar.Events). Params is a parameter or parameter array/object that gets
	  // passed to event_name (may be set as undefined).
		QueueEvent: function(delta_time, event_type, crew_name) {
			var new_time = S$.time + delta_time;
			var i = 0;
			var event = {time: new_time, type: event_type, crew_name: crew_name};
			for (var i = 0; i < S$.events.length; i++) {
				if (S$.events[i].time > new_time) {
          S$.events.splice(i, 0, event);
					return;
				}
			}
			// Nothing after it, append to the end.
			S$.events.push(event)
		},
		
		// Queue up a timeout message. Handle cases of consecutive time passed.
		AppendTimeout: function(time) {
			if (this.message_passed_time > 0) {
				clearTimeout(this.message_timeout);
			}
			this.message_passed_time += time;
			this.message_timeout = setTimeout(this.MessageTimeout.bind(this), 50);
		},
		MessageTimeout: function() {
			SU.message(SU.TimeString(this.message_passed_time))
			this.message_passed_time = 0;
		},
		
		Heal: function(time_passed) {
			// 1 health for each hour passed.
			for (var i = 0; i < S$.crew.length; i++) {
				S$.crew[i].Heal(time_passed/10);
			}
			/*
			var new_day = Math.floor(S$.time);
			var old_day = Math.floor(S$.time-time_passed);
			var amount = new_day - old_day;
			if (amount > 0) {
				for (var i = 0; i < S$.crew.length; i++) {
					S$.crew[i].Heal(amount);
				}
			}
			*/
		},
		
		//MoraleCheck: function() {
			// TODO.
			// Notify if it drops below a threshold?
			//this.AddMoraleCheck();
		//},
			
		
		TriggerEvent: function(type, crew_name) {
			let crew = null;
			let crew_index = -0;
			for (let i = 1; i < S$.crew.length; i++) {
				if (S$.crew[i].name == crew_name) {
					crew = S$.crew[i];
					crew_index = i;
				}
			}
			if (crew === null) {
				// Already gone.
				return;
			}
			
			switch (type) {
				case SF.FLAW_BAD_MORALE:
					SU.ShowWindowInterrupt("Up Too Late", crew_name+" woke up in a dreadfully foul mood this morning. They claim it's for no reason at all, just one of those days. Maybe they stayed up way too late playing games. And it seems to have worn off on the crew.", undefined, '😡');
					this.ApplyMorale(SE.MORALE_BAD_MOOD, crew);
					for (let i = 1; i < S$.crew.length; i++) {
						if (i != crew_index) {
							this.ApplyMorale(SE.MORALE_TEAM_BAD_MOOD, S$.crew[i]);
						}
					}
					break;
				case SF.FLAW_SICK:
					let health_loss = Math.floor(crew.base_max_health / 3);
					let speed_loss = crew.speed / 3;
					SU.ShowWindowInterrupt("Bad Hot Peppers", crew_name+" has been known for eating all kinds of crazy objects. The behavior seems to have finally caught up with "+ST.genl[crew.gender]+". You tried taking "+ST.genl[crew.gender]+" to the medical unit, but turns out there's no cure for stupid.\n\n  -"+health_loss+SF.SYMBOL_HEALTH+"\n  -"+Math.round(TF.BASE_MOVE*speed_loss)+" speed", undefined, '🤢');
					crew.ChangeAllHealth(-health_loss);
					crew.speed -= speed_loss;
					crew.base_speed -= speed_loss;
					break;
				case SF.FLAW_AGE:
					SU.ShowWindowInterrupt("Strange Brew", crew_name+" suddenly keels over and dies. An autopsy reveals the cause is old age, although "+ST.gen[crew.gender]+" never mentioned "+ST.pos[crew.gender]+" age, or much at all for that matter.", undefined, '☠');
					S$.DropCrew(crew_index);
					break;
				case SF.FLAW_METAMORPH:
					var old_hero = S$.crew[crew_index];
					var new_name = ST.getWord(old_hero.seed+80.8, old_hero.seed+81.8);
					var new_hero = new SBar.Crew(new_name, old_hero.seed+82.8, old_hero.raceseed+82.9, capLevel(old_hero.base_level-2));
					new_hero.new_backstory = crew_name+" transformed into "+new_name+".";
					new_hero.morale = old_hero.morale;
			
					SU.ShowWindowInterrupt("The Metamorphosis of "+new_hero.name, "It's strange you hadn't noticed... the increasingly gooey mass of "+crew_name+" had built itself a cocoon in the back of the ship. And now having been withdrawn for some time, you can only assume it slept in its pod. With popping crackles and a groan, the pod layers cleave from its widening seam. A new shape emerges. \"Behold, I am "+new_hero.name+"!\"", undefined, '🐞');
					S$.crew[crew_index] = new_hero;
					//new_hero.AddEvents(); Don't have a new flaw here.
		      S$.logMessage(old_hero.name+" transformed into "+new_hero.name);
					break;
				case SF.FLAW_MINDGEL:
					if (S$.crew.length <= 2) {
						break;
					}
					var target_index = Math.floor(SU.r(crew.seed, 51.12)*(S$.crew.length - 2))+1;
					if (target_index >= crew_index) {
						target_index += 1;
					}
					var target_crew = S$.crew[target_index];
					SU.ShowWindowInterrupt(ST.getWord(crew.raceseed, 61.33)+" Mind Gel", "Suddenly "+crew.name+" grabs "+target_crew.name+". "+crew.name+" clutches "+target_crew.name+"'s body tightly and they both collapse to the floor."+
					  " When they wake up "+crew.name+" answers to "+target_crew.name+" and "+target_crew.name+" answers to "+crew.name+".", undefined, '⚭');
					let temp = target_crew.personality;
					target_crew.personality = crew.personality;
					crew.personality = temp;
					temp = target_crew.morale;
					target_crew.morale = crew.morale;
					crew.morale = temp;
					temp = target_crew.max_morale;
					target_crew.max_morale = crew.max_morale;
					crew.max_morale = temp;
					this.ApplyMorale(SE.MORALE_MIND_GEL_GOOD, target_crew);
					this.ApplyMorale(SE.MORALE_MIND_GEL_BAD, crew);
					break;
				case SF.FLAW_STEAL_MONEY:
					if (S$.credits < 2) {
						return;
					}
					this.ApplyMorale(SE.MORALE_STOLE_MONEY, crew);
					S$.credits = Math.round(S$.credits/2);
					SU.ShowWindowInterrupt("Psychologically and Physically", "Your purse feels lighter...", undefined, '💰');
					break;
				case SF.FLAW_MURDER:
					if (S$.crew.length <= 2) {
						break;
					}
					var target_index = Math.floor(SU.r(crew.seed, 51.12)*(S$.crew.length - 2))+1;
					if (target_index >= crew_index) {
						target_index += 1;
					}
					var target_crew = S$.crew[target_index];
					SU.ShowWindowInterrupt("Bloody Knife", "You awake to find "+target_crew.name+" dead on the floor, with a knife in "+ST.pos[target_crew.gender]+" back. No one saw anything, but you have your suspicions...", undefined, '🗡');
					S$.DropCrew(target_index);
					this.ApplyMorale(SE.MORALE_CAUSED_MURDER, crew);
					for (let i = 1; i < S$.crew.length; i++) {
						if (i != crew_index) {
							this.ApplyMorale(SE.MORALE_CREW_MURDERED, S$.crew[i]);
						}
					}
				}
		},
		
		//
		// Triggered events.
		//
		PlanetVisit: function(planet_data) {
			// Check fishing holiday.
			if (!planet_data.waterworld || !planet_data.life) {
				return;
		  }
			var hero_num = -1;
			for (var i = 0; i < S$.crew.length; i++) {
				if (S$.crew[i].flaw === SF.FLAW_FISHING) {		
					hero_num = i;
					break;
				}
			}
			if (hero_num === -1) {
				return;
			}
			var hero = S$.crew[hero_num];
			var callback = function(going_fishing) {
				if (going_fishing) {
					SE.PassTime(7*24);
				} else {
					this.ApplyMorale(this.MORALE_NO_FISHING, hero);
					if (hero.LowMorale()) {
						SU.ShowWindow("Predictable Consequences", hero.name+" grabs a fishing pole and launches an escape pod.", undefined, '🐟');
						S$.DropCrew(hero.GetHeroIndex());
					}
				}
			}
			if (SU.r(hero.seed, event_num++) < 0.5) {				
				SU.ConfirmWindowInterrupt("That Ocean Planet", 
				    hero.name+" has decided to go on a fishing holiday. An ocean planet teeming with life is just too much for "+ST.genl[hero.gender]+" to resist. "+
				    ST.genup[hero.gender]+" assures that everyone will have a good week, but you're not so sure. Go fishing?", callback.bind(this), '🐟');
			}
		},
		
		// General checks based on morale.
		PassTimeAnywhere: function(duration) {
			let event_chance_per_hour = 0.003; // Once every two weeks.
			for (let i = 1; i < S$.crew.length; i++) {
				let crew = S$.crew[i];
				if (crew.LowMorale() && SU.r(crew.seed,event_num++) < duration * event_chance_per_hour) {
					// Unhappy crew member.
					if (SU.r(crew.seed, 93.21) < 0.5) {
						SU.ShowWindowInterrupt("Change of Direction", crew.name+" is fed up with your leadership and takes off in an escape pod.", undefined, '☛');
						S$.DropCrew(i);
						return false;
					} else {
						let me = this;
						let callback = function() {
							me.PartyBattle(/*callback=*/undefined, "The Service of "+crew.name, "Seriously, how could "+crew.name+" not like you...", [crew], /*attacking=*/false);
						}
						SU.ShowWindowInterrupt("The Service of "+crew.name, "Angry at the lack of spoils and tired of your ignoring "+ST.pos[crew.gender]+" complaints, "+crew.name+" suits up and opens fire.", callback, '⚔');
						return false;
					}
				}
			}
			return true;
		},		
		
		// Check if the player is in a hostile race area.
		PassTimeInterstellar: function(duration) {
			let race = SG.activeTier.GetShipRegionRaceData();
			if (race.alpha) {
				race = race.alpha;
			}
			if (!race.core || race.race.alignment >= SF.NEUTRAL_SCORE) {
				return true;
			}
			if (SF.DISABLE_SPACE_ENCOUNTERS) {
				return true;
			}
			if (race.race.seed === SF.RACE_SEED_ALPHA && !S$.in_alpha_space) {
				// On the edge of a sphere.
				return true;
			}

			var event_chance_per_hour = 0.006;  // Once per week.
			base_seed++;
			if (SU.r(base_seed,event_num++) < duration * event_chance_per_hour || SF.ALWAYS_SPACE_ENCOUNTERS) {
				this.HostileSpaceBattle(race);
				return false;
			}
			return true;
		},
		
		HostileSpaceBattle: function(racedata, /*optional*/description, /*optional*/callback) {
			let data = {};
			data.seed = event_num++;
			data.raceseed = racedata.race.seed;
			data.level = racedata.race.level;
			data.type = SF.TIER_STARMAP;
			data.name = ST.RaceName(racedata.race.seed)
			let starmap_tier = SG.activeTier;
			if (!callback) {
				callback = function(encounter_data) {
					starmap_tier.activate(starmap_tier.shipx, starmap_tier.shipy);
				}
			}
			if (!description) {
				description = "Ambushed by "+ST.RaceName(racedata.race.seed)+"!";
			}
			let battle = new SBar.BattleBuilder(SF.BATTLE_RACE_MILITARY, data, /*attacking=*/false, callback.bind(this),
		      {description: description});
			SG.death_message = "Killed by trespassing.";
			SU.PushBattleTier(battle);
		},
		
		PassTimePlanetsidePlanet: function(duration) {
			this.planetside_tier = SG.activeTier;
			let data = SG.activeTier.data;
			/*
			tectonics  // 0.1 is low. 0.3 is medium. 0.5 is high.
			windspeed  // km.
			lightningfreq  // 1.16 is high.
			*/
			// Calculate the probability per hour (of not happening), then compute likelihood for the duration (of not happening).
			let prob_techtonics = 1-Math.pow(data.tectonics, 3);
			let prob_lightning = 1-Math.pow(data.lightningfreq/3, 4);
			let prob_wind = 1-Math.pow(data.windspeed/300, 4);
			let rand = SU.r(event_num++, 6.14);
			if (rand > Math.pow(prob_techtonics, duration)) {
				SG.death_message = "Killed an earthquake, while digging into the ground, next to a flightworthy ship.";
				SU.DamageInterrupt("Rocked and Rolled", "An earthquake rips through the mining camp, damaging ship and crew.", 0.1)
				return false;
			} else if (rand > Math.pow(prob_lightning, duration)) {
				SG.death_message = "Killed by lightning, while holding a shovel, next to an insulated ship.";
				SU.DamageInterrupt("1.21 Jiggawatts", "Lightning strikes from above, blasting ship and crew.", 0.2)
				return false;
			} else if (rand > Math.pow(prob_wind, duration)) {
				SG.death_message = "Killed by your own shovel, picked up by the wind, and delivered on your head.";
				SU.DamageInterrupt("Point that Wing Downwind!", "Strong winds buffet your ship and equipment, making surface mining impossible.", 0.02)
				return false;
			}
			if (data.systemData.in_alpha_bubble) {
				SG.death_message = "Killed by venturing into where you were not prepared to be.";
				SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_ALPHA, SG.activeTier, /*attacking=*/false, this.MineBattleCallback.bind(this),
					  {description: "Ambushed!"}));
				return false;
			} else if (data.systemData.race_controls_system) {
				// Chance of police showing up.
				let prob_no_police = 0.5;
				if (rand > Math.pow(prob_no_police, duration)) {
					S$.ChangeRaceAlignment(data.systemData.raceseed, -1);
					// Attacking = true to allow for withdraw.
					S$.AddKnownRace(data.systemData.raceseed);
					SG.death_message = "Killed by arguing with the police.";
					SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_POLICE, SG.activeTier, /*attacking=*/true, this.MineBattleCallback.bind(this),
						  {description: "The local law enforcement shows up and politely asks you to move along."}));
					return false;
				}
			} else if (data.life) {
				// Wild beasts attack.
				let prob_no_beasts = 0.95;  // Reversed for math.pow.
				if (rand > Math.pow(prob_no_beasts, duration)) {
					SG.death_message = "Killed by picking a fight with wild animals on their own turf. Tragic death by safari.";
					SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_ANIMAL, SG.activeTier, /*attacking=*/false, this.MineBattleCallback.bind(this),
						   {description: "Attacked by native lifeforms!"}));
					return false;
				}
			}
			
			return true;
		},
		
		MineBattleCallback: function(encounter_data) {
			this.planetside_tier.activate(this.planetside_tier.data, this.planetside_tier.x, this.planetside_tier.y)
		},
		
		
		PassTimePlanetsideAsteroid: function(duration) {
			this.planetside_tier = SG.activeTier;
			let data = SG.activeTier.data;
			let rand = SU.r(event_num++, 6.15);
			if (data.systemData.race_controls_system) {
				// Chance of police showing up.
				let prob_no_police = 0.7;
				if (rand > Math.pow(prob_no_police, duration)) {
					S$.ChangeRaceAlignment(data.systemData.raceseed, -1);
					// Attacking = true to allow for withdraw.
					SG.death_message = "Killed by arguing with the police.";
					SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_POLICE, SG.activeTier, /*attacking=*/true, this.MineBattleCallback.bind(this),
						 {description: "The local law enforcement shows up and politely asks you to move along."}));
					return false;
				}
			} else {
				// Chance of pirates.
				let prob_no_pirates = 0.99;
				if (rand > Math.pow(prob_no_pirates, duration)) {
					SG.death_message = "Killed by pirate ambush while mining a remote asteroid.";
					SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_PIRATE, SG.activeTier, /*attacking=*/false, this.MineBattleCallback.bind(this),
						 {description: "Raided by pirates!"}));
 				 return false;
				}
				return true;
			}
			return true;
		},
		
		
		// Crew encounters an event in space.
		InterstellarEvent: function(starmap_tier) {
			let num_events = 6;
			let event_index = Math.floor(SU.r(event_num++, 6.13)*num_events);
			//event_index = 3;
			switch (event_index) {
				case 0:
					this.InterstellarWormhole(starmap_tier);
					break;
				case 1:
					this.InterstellarHiddenSystem(starmap_tier);
					break;
				case 2:
					this.InterstellarHiddenBelts(starmap_tier);
					break;
				case 3:
				case 4:
				case 5:
					this.Interstellar9TimesIn10(starmap_tier);
					break;
				default:
					error("noevent_index1");
			}
		},
		
		// Some of these are borrowed from Tier1 goody huts.
		Do9TimesIn10: function(starmap_tier, race_data) {
			S$.game_stats.transmissions_investigated++;
			let num_events = 7;
			let event_index = Math.floor(SU.r(event_num++, 6.14)*num_events);
			//event_index = 6;
			switch (event_index) {
				case 0:
					// Ambush.
					let data = {};
					data.seed = 12.34+event_num++;
					data.raceseed = race_data.seed;
					data.level = race_data.level;
					data.type = SF.TIER_STARMAP;
					data.name = S$.ship.name;//ST.getWord(race_data.seed, 42.12+event_num++);
					let battle = new SBar.BattleBuilder(SF.BATTLE_AMBUSH, data, /*attacking=*/false, undefined, {seed: 12.34+event_num++, description: "Ambushed!"});
					SG.death_message = "Killed by rolling the dice one time too many.";
					SU.PushBattleTier(battle);
					break;
				case 1:
					// Nothing.
					SU.ShowWindow("Absolutely Nothing", "You are unable to find the source of the signal before it fades away.", undefined, ' ');
					break;
				case 2:
					// Money.
					let credits = round2good(SF.LEVEL_XP[race_data.level]*(SU.r(race_data.seed, 1.52+event_num++)+1.0)/4);
					SU.ShowWindow("Cha-ching!", "You find destroyed pieces of a derelict with "+SF.SYMBOL_CREDITS+credits+".", undefined, SF.SYMBOL_CREDITS);
					S$.AddCredits(credits);
					break;
				case 3:
					// Artifact.
					let skill_type = SF.SKILL_STANDARD;
					let rand_type = SU.r(race_data.seed, 94.2+event_num++);
					if (rand_type < 0.05) {
						skill_type = SF.SKILL_ALPHA;
					} else if (rand_type < 0.2) {
						skill_type = SF.SKILL_SHIP;
					} else if (rand_type < 0.25) {
						skill_type = SF.SKILL_BOOST;
					} else if (rand_type < 0.3) {
						skill_type = SF.SKILL_STATS;
					}			
					SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(SU.r(race_data.seed, 34.02+event_num++), race_data.seed, race_data.level, skill_type), undefined)
											.SetBackground("You find pieces of an obliterated derelict with one intact item."));
					break;
				case 4:
					// Hire event.
	        var hire = new SBar.HireDisplay(21.31+event_num++, race_data.seed, race_data.level);
					hire.free = true;
					hire.description_override = "You find an escape pod floating alone in space. Its occupant is relieved to see you and offers to join your crew.";
					SU.PushTier(hire);
					break;
				case 5:
					// Morale event.
					let positive = SU.r(5.21,event_num++) > 0.51;  // Asymettrics.
					let message = "The mysterious entity "+ST.getWord(33.12+event_num++,42.12+event_num++)+" visits the ship and "+(positive ? "delights" : "scares")+" the crew.";
					let morale_type = positive ? SE.MORALE_9TIMES_POSITIVE : SE.MORALE_9TIMES_NEGATIVE;
					for (let i = 1; i < S$.crew.length; i++) {
						let crew = S$.crew[i];
						this.ApplyMorale(morale_type, crew);						
					}
					SU.ShowWindow("Unexplained Visitor", message, undefined, "👤");
					break;
				case 6:
					// Derelict with likely ambush.
			    let ship = new SBar.Ship(/*type=*/SF.SHIP_COMMON, /*level=*/race_data.level, 92.12+event_num++, race_data.seed)
					let callback = function() {
						let took_ship = S$.ship.name == ship.name;
						if (took_ship && SU.r(51.21,1.31+event_num++) < 0.9) {
							// Ambush.
							let data = {};
							data.seed = 12.34+event_num++;
							data.raceseed = race_data.seed;
							data.level = race_data.level;
							data.type = SF.TIER_STARMAP;
							data.name = S$.ship.name;//ST.getWord(race_data.seed, 42.12+event_num++);
							let battle = new SBar.BattleBuilder(SF.BATTLE_AMBUSH, data, /*attacking=*/false, undefined, 
								  {seed: 12.35+event_num++, description: "It was a trap. The original crew was hiding under the floor grates. Strange how you keep forgetting to check there."});
							SG.death_message = "Killed by not checking under the floor grates.";
							SU.PushBattleTier(battle);
						}
					}
					SU.PushTier(new SBar.FoundShipDisplay(/*parent_data=*/undefined, {data:ship})
							.SetMessage("You find a derelict drifting in space. Inexplicably it's fully functional and with no sign of its crew."), callback);
					break;
				default:
					error("noevent_index2");
			}			
		},
		
		Interstellar9TimesIn10: function(starmap_tier) {
			let race = SG.activeTier.GetShipRegionRaceData().race;
			var callback = function(investigate) {
				if (investigate) {
					this.Do9TimesIn10(starmap_tier, race);
				} else {
					for (let i = 1; i < S$.crew.length; i++) {
						let crew = S$.crew[i];
						if (crew.LowMorale() && SU.r(crew.seed, 5.13+event_num++) < 0.25) {
							let callback2 = function() {
								this.Do9TimesIn10(starmap_tier, race);
							}
							SU.ShowWindowInterrupt("Empowered Employee", crew.name+" grabs the controls and responds to the hail.", callback2.bind(this), '🚨');
							break;
						}
					}
				}
			}
			SU.ConfirmWindowInterrupt("9 Times out of 10", "Yeah baby! "+ST.RaceNameOnly(race.seed)+" distress call ("+SF.SYMBOL_LEVEL+race.level+")!\n\nCheck it out?", callback.bind(this), '🎲');
		},
		
		InterstellarWormhole: function(starmap_tier) {
			let seed = SU.r(event_num++, 6.14);
			let max_dist = 100000;
			let callback = function(confirmed) {
				if (!confirmed) {
					for (let i = 1; i < S$.crew.length; i++) {
						let crew = S$.crew[i];
						if (crew.LowMorale() && SU.r(crew.seed, 5.12+event_num++) < 0.25) {
							let callback2 = function() {
								callback(/*confirmed=*/true);
							}
							SU.ShowWindowInterrupt("Nothing to lose", "Before you have a chance to react "+crew.name+" vocally disagrees and takes the ship into the anomaly.", callback2, '🚨');
						}
					}
					return;
				}
				S$.game_stats.wormhole_visits++;
				let xoff = SU.r(seed, 6.15)*100000-max_dist/2;
				let yoff = SU.r(seed, 6.16)*100000-max_dist/2;
				new SBar.StarmapTier().activate(starmap_tier.shipx+xoff, starmap_tier.shipy+yoff);
			}
			
			SU.ConfirmWindow("Transient Wormhole",
			    "You discover a wormhole not captured on any of your starcharts. Upon closer eximation its stability and position appears to be in flux. Enter?",
    			callback, '🎲');
		},
		InterstellarHiddenSystem: function(starmap_tier) {
			let callback = function(confirmed) {
				if (!confirmed) {
					return;
				}
				let system_data = new SBar.SystemData(starmap_tier.region_icons[0].data, starmap_tier.shipx+0.5, starmap_tier.shipy+0.5);
				system_data.generate();
				if (system_data.planets.length < 2) {
					system_data = new SBar.SystemData(starmap_tier.region_icons[0].data, starmap_tier.shipx+0.5, starmap_tier.shipy+0.5);
					system_data.generate();
				}
				new SBar.SystemTier(system_data).activate();
			}
			SU.ConfirmWindow("Hidden System",
			    "An entire star system decloaks before your eyes. They hail. They say you're welcome to visit, but only briefly before they return to subspace. Enter?",
					callback, '☆');
		},
		InterstellarHiddenBelts: function(starmap_tier) {
			let callback = function(confirmed) {
				if (!confirmed) {
					return;
				}
				let system_data = new SBar.SystemData(starmap_tier.region_icons[0].data, starmap_tier.shipx+0.5, starmap_tier.shipy+0.5, SF.SYSTEM_DEAD_ROCKS);
				system_data.generate();
				if (system_data.planets.length < 2) {
					system_data = new SBar.SystemData(starmap_tier.region_icons[0].data, starmap_tier.shipx+0.5, starmap_tier.shipy+0.5, SF.SYSTEM_DEAD_ROCKS);
					system_data.generate();
				}
				new SBar.SystemTier(system_data).activate();
			}
			SU.ConfirmWindow("Hidden Asteroids",
			    "You stumble upon some very remote asteroids in the depths of space. Visit?",
					callback, '☄');
		},
		
		// Something triggered a battle against the party. Check if others join in.
		// TODO: pull in sympathetic crew. This needs to be done on engage?
		PartyBattle: function(callback, title, description, /*optional array*/enemy_crew, /*optional*/attacking) {
			if (attacking === undefined) {
				attacking = true;
			}
			if (!title) title = "Party Battle";
			if (!description) description = "The captain calls for a brawl.";
			let data = {};
			data.seed = 12.34;
			data.raceseed = 23.45;
			data.level = 1;
			data.type = SF.TIER_STARMAP;
			data.name = "asdf"
			
			let battle = new SBar.BattleBuilder(SF.BATTLE_PARTY, data, attacking, callback, 
				{seed: 51.21+event_num++, reward: {no_reward: true}, battle_name: title, description: description, enemy_crew: enemy_crew});
			SG.death_message = "Killed by your own crew.";
			SU.PushBattleTier(battle);
		},
		
		CheckBossMove: function() {
			if (S$.got_wmd_in_past || SF.NO_BUBBLES || SU.r(S$.time, 12.71) > 0.25) {
				return;
			}
			// Relocate.
			let relocate_distance = SU.r(S$.time, 12.72)*SF.REGION_SIZE*2 + SF.REGION_SIZE/2;
			let relocate_angle = SU.r(S$.time, 12.72)*PIx2;
			let current_xy = S$.bossxy;
			let target_x = current_xy[0]+Math.sin(relocate_angle)*relocate_distance;
			let target_y = current_xy[1]+Math.cos(relocate_angle)*relocate_distance;
			// Find the nearest generated sphere.
			let region = new SBar.RegionData(target_x, target_y);
			let closest_alpha_race = region.GetClosestAlpha(target_x, target_y);
			if (closest_alpha_race === null) {
				return;
			}
			S$.bossxy = [closest_alpha_race.bubbles[0].x, closest_alpha_race.bubbles[0].y];
		},
		
  };
	
	
})();

var SE = SBar.Events;

