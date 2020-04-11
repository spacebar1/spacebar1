/**
 * Stores all key gameplay data, ship and crew. Stores all non-procedural game state.
 * Values need to be explicitly set (not set in prototype) to get picked up by serialization for saving.
 * Reminder not to use sets here, since they don't stringify easily.
 */
(function() {
  let foundMax = 25000; // erase after this many entries	
  let buildingSystemMax = 5000; // Number of system buildings to store. erase after this many entries	
  //var maxBuildingSystems = 5000;  // Max number of systems to track buildings. Needs to be small enough to scan reasonably quickly, and to save to storage.
	let PLANET_SYMBOLS = {0: "⓪", 1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤", 6: "⑥", 7: "⑦", 8: "⑧", 9: "⑨", 10: "⑩"};
	let BELT_SYMBOLS = {0: "⓿", 1: "❶", 2: "❷", 3: "❸", 4: "❹", 5: "❺", 6: "❻", 7: "❼", 8: "❽", 9: "❾", 10: "❿"};
	let MOON_SYMBOLS = {/*No unicode for this 0.*/ 0: "", 1: "⓵", 2: "⓶", 3: "⓷", 4: "⓸", 5: "⓹", 6: "⓺", 7: "⓻", 8: "⓼", 9: "⓽", 10: "⓾"};	
	
  SBar.GameData = function(name_seed) {
    this._initGameData(name_seed);
  };

  SBar.GameData.prototype = {
    // Game attributes.
    time: null, // global game time counter, for triggered events. In hours (24-hour days).
    version: null, // data version for backward compatibility if needed. Note this is set explicitly below, to be written.
		events: null, // Queued events. [time, action] format. Earliest first.
    game_seed: null, // doubles for the lang for the Alphas
    player_name: null, // Player's name.
    //hardcore: null,
    //difficulty: null,
		position: null, // All details of the player's position in the game world. SBar.Position object.

		// Ship/player configuration.
		ship: null,  // Ship data object.  Note ship cache just stores the main and tow images.
		tow_ship: null,  // Ship in tow.
		crew: null, // Characters in party array (SBar.Crew). First is always the player.
    credits: null, // Use SF.SYMBOL_CREDITS.
    //goods: null, // Also contraband.
		faction: null,
		//licenseCost: null,
		officer_stats: null,  // Best part stats for each of the types.
		officer_names: null,  // Player names providing the best stats.
		
		xp: null, // Object of {combat, trade, arch (archaeology but I can't reliably spell it)} XP.
		xp_level: null,  // Current level of each of the xp fields.

    // Data attributes
    knownStars: null, // known stars are stored only as locations (for now). It is a hashmap based on region_sizeXregion_size blocks, with an array or known star in each block
		scannedStars: null, // Stars known from the observatory scans. Names of these are known.
    knownStructs: null,
    knownWormholes: null,
		raceAlignment: null,  // < 40 is hostile. < 60 is netural. 60+ is friendly.
		raceRival: null,  // Same-region rival for alignment changes.
		//hostileRaces: null,  // Overrides of default.
		//friendlyRaces: null,  // Overrides of default.
    foundSet: null, // hashset of found artifacts, planets, etc. based on uid (typically seed / location combo)
    foundList: null, // chronological list of elements in the hashset, for pruning.
    foundIndex: null, // index into last found element
		foundData: null, // Optional data for a found element.
		systemBuildingSet: null,  // Capped at buildingSystemMax systems.
		buildingPruneList: null,
		buildingPruneIndex: null,
		mineDetails: null,  // Holds updated minerals for all the mines. {minerals:, max_minerals:, mine_time:}
    origHomeSeed: null,
    quests: null,
    selectedQuest: null, // index
    messageLog: null,
    notesLog: null,
		hudMessages: null,
		drink_times: null,  // Array of times when drinks imbibed. Length is how drunk the player is (minus any old entries that need filtering).
		waypoints: null, // A location in space, specified for a specific key.
		custom_buildings: null, // Hashmap {seed, [data list]} of CustomBuildingData data.
		removed_buildings: null,
		custom_building_levels: null,  // Hashmap {seed, level} of buildings that have modified levels.
		done_intro: false,  // Visited the first bar once.
		conduct_data: null,  // Conduct key name Set. Overwritten from startmenu.
		battle_effect: null,  // Global battle persistent effect, if any. Like from an obelisk. {name, seed, level}.
		last_message_week: -1,  // Last week that an incoming message was taken.
		in_alpha_space: false,
		alpha_bubbles: null,  // Alpha spheres the ship is currently in.
		background_alpha_seed: null,  // Used for SU.draw2DStarsBackground().
		savexy: null,  // X,Y interstellar for a save game.
		bossxy: [SF.ORIGINAL_BUBBLE_X, SF.ORIGINAL_BUBBLE_Y],  // Location of the alpha boss / original friend.
		showed_intro_terminal: false,
	  // The player had time traveled back and picked up the WMD before the friend.
		// From this point the friend won't have the WMD, and won't have bubbles in space.
		got_wmd_in_past: false,
		// Chapter 0: intro cutscene
		// Chapter 1: opening at the bar
    // Chapter 2: first seeing alphas
    // Chapter 3: first visiting a sphere
    // Chapter 4: first going back in time / discover wmd
		// Chapter 5: going back in time again / get wmd
		current_chapter: -1,
		bars_built_on_arth: 0,
		times_traveled_back_to_gathering: 0,  // For the number of players that should appear at the cornfield, last cutscene.
		killed_friend_in_this_timeline: false,
		
		grace_period_time_start: -1, // Last time the player met a new race, to allow them to run away..
		
		// Tracking for gametime.
		// These should only be informational, anything important to gameplay should be stored above.
		game_stats: {
			// Game stats tracked elsewhere:
			//  - times_traveled_back_to_gathering
			//  - bars_built_on_arth
			//  - conducts
			//  - player name, level, stats, etc.
			//  - item possessions (levels, details, etc) - scroll through them? Summary text?
			//  - Crew members.
			won_game: false,
			times_killed_friend: 0,
			player_time_passed: 0,
			enemies_killed: 0,
			battles_engaged: 0,
			times_fled: 0,
			ships_abandoned: 0,
			blind_brawls: 0,
			crew_purge_attempts: 0,
			party_battles: 0,
			transmissions_investigated: 0,
			times_wmd_fragment_activated: 0,  // Higher than times_traveled_back_to_gathering, which is just cornfields.
			times_wmd_full_activated: 0,
			dreams_recurred: 0,
			crew_clones: 0,
			team_members_summoned: 0,
			crew_damage_dealt: 0,
			crew_damage_taken: 0,
			crew_health_healed: 0,
			crew_lost: 0,
			crew_members_joined: 0,
			enemies_converted: 0,
			quests_completed: 0,

			system_visits: 1,			
			starport_visits: 0,
			pirate_hideout_visits: 0,
			party_yacht_visits: 0,
			belt_visits: 0,
			moon_visits: 0,
			pod_visits: 0,
			planet_visits: 1,
			building_visits: 1,
			bubble_visits: 0,
			wormhole_visits: 0,
			
			buildings_destroyed: 0,
			minerals_mined: 0,
			cargo_acquired: 0,
			contraband_acquired: 0,
			items_acquired: 0,
			drinks: 0,
			distance_flown: 0,
			ships_acquired: 0,
			credits_acquired: 0,
			credits_spent: 0,
			buildings_built: 0,
			buildings_upgraded: 0,
		},
		
    _initGameData: function(name_seed) {
			// SPECIAL CASE. Lots of constructors rely on S$ for lookups. It needs to be set early.
			S$ = this;
			// The seedrandom implementation seems to treat "q" and "qq" the same, so put some noise around it.
  		Math.seedrandom(name_seed + '\0'); // Deterministic for next step.
	    this.game_seed = Math.random() * 100;
	    this.player_name = name_seed;
      this.time = 8*24+11;  // Start on day 8 at 11:00 AM.
			this.game_stats.player_time_passed += this.time;
      this.version = SF.VERSION;
			this.events = [];
			//SBar.Events.AddMoraleCheck();
			this.position = new SBar.Position();

      this.drinks = 0;
      this.knownStars = {};
			this.scannedStars = {};
      this.knownStructs = {};
      this.knownWormholes = {};
			this.raceAlignment = {};			
			this.raceRival = {};			
			//this.hostileRaces = {};
			//this.friendlyRaces = {};			
      //this.credits = 0;
			this.credits = Math.floor(SU.r(this.game_seed, 1.1)*15)+10;
      //this.goods = 0;
      this.foundSet = {};
      this.foundList = [];
      this.foundIndex = 0;
      this.systemBuildingSet = {};
      this.buildingPruneList = [];
      this.buildingPruneIndex = 0;
      this.messageLog = [];
			this.notesLog = [];
			this.hudMessages = [];
      this.quests = []; // {"n": name, "x": x, "y": y, "stx": stx, "sty": sty, "b": buildingLookup, "t": type, "ss": souceSeed, "ts": targetSeed}
			this.faction = SF.FACTION_NORMAL;  // Public.
      this.logMessage("Awoke in a \"cozy\" bar on an alien planet.");
			this.crew = [];
			this.crew.push(new SBar.Crew(this.player_name, /*player seed*/SF.RACE_SEED_HUMAN, /*player raceseed*/SF.RACE_SEED_HUMAN, /*level=*/1, /*crew_data=*/undefined, /*is_player=*/true));
			
			this.waypoints = [];
			this.custom_buildings = {};
			this.removed_buildings = {};
			this.custom_building_levels = {};
			this.conduct_data = {};

			this.foundData = {};
			this.mineDetails = {};
			
			this.xp = {};
			this.xp.combat = 0;
			this.xp.trade = 0;
			this.xp.arch = 0;
			this.xp_level = {};
			this.xp_level.combat = 1;
			this.xp_level.trade = 1;
			this.xp_level.arch = 1;
			this.skip_xp = false;
			this.drink_times = [];
			this.raceAlignment[SF.RACE_SEED_ALPHA] = 0;
			this.BuildOfficerStats();
			this.ship = this.GetStartingShip();  // Comes after officer stats.
      this.SetOrigBar(this.GetOrigBar());
    },
		
		GetStartingShip: function() {
			return new SBar.Ship(SF.SHIP_ALPHA, /*level=*/1, this.game_seed, -1);
		},
		
		// Called when time traveling back.
		// Note this preserves the known systems. And should probably preserve races?
		ResetSettingsTimeTravel: function() {
			this.time = 0;  // Back to the true beginning start time: finding the WMD in the cornfield.
      this.foundSet = {};
      this.foundList = [];
      this.foundIndex = 0;
      this.systemBuildingSet = {};
      this.buildingPruneList = [];
      this.buildingPruneIndex = 0;
			this.events = [];
      this.knownStars = {};
			this.scannedStars = {};
      this.knownStructs = {};
      this.knownWormholes = {};
			this.raceAlignment = {};			
			this.raceRival = {};			
      this.quests = [];
			this.custom_buildings = {};
			this.removed_buildings = {};
			this.custom_building_levels = {};
			this.mineDetails = {};
			this.in_alpha_space = false;
			this.alpha_bubbles = null;
		},
		
		// Returns a display name for the XP type.
		XpTypeName: function(type) {
			if (type == "trade") {
				return "Trade";
			}
			if (type == "arch") {
				return "Archaeology";
			}
			if (type == "combat") {
				return "Combat";
			}
			return "UnknownType";
		},
		AddXp: function(type, amount) {
			if (this.skip_xp) {
				return;  // For special cases.
			}
			this.xp[type] += amount;
			let xp = this.xp[type];
			SU.message("+"+this.XpTypeName(type)+" XP");
			let level = this.xp_level[type];
			// Update type level, and if level up is needed.
			while (level < SF.MAX_LEVEL && SF.LEVEL_XP[level+1] <= xp) {
				this.xp_level[type] += 1;
				level += 1;
			//	SU.message(this.XpTypeName(type)+" Leveled");
			}
			//let leveled = level > this.crew[0].level;
			// Add matching XP to all crew and check leveling.
			let leveled = false;
			for (let i = 0; i < this.crew.length; i++) {
				let crew = S$.crew[i];
				crew.xp += amount;
				if (SF.LEVEL_XP[crew.base_level+1] <= crew.xp) {
					leveled = true;
				}
			}
			if (leveled) {
				SU.message("Level ready");
			}
		},
    // only when game loads for first time, not when loading from a character sheet
    GetOrigBar: function() {
      for (var dist = 0; dist < 10; dist++) {
        for (var x = -dist; x <= dist; x++) {
          for (var y = -dist; y <= dist; y++) {
            var region = new SBar.RegionData(x * SF.REGION_SIZE, y * SF.REGION_SIZE);
            for (var obj in region.systems) {
              var systemData = region.systems[obj];
              systemData.generate();
							if (systemData.race_controls_system) {
	              for (var p in systemData.planets) {
	                var planet = systemData.planets[p];
	                if (planet.life && planet.templePlanet) { // has at least one temple bar
	                  planet.generate();
	                  return planet.templedata;
	                }
	              }
							}
              systemData.teardown();
            }
            region.teardown();
          }
        }
      }
      error("error: no home system to jump to, going to change seed and keep looking");
	    this.game_seed = SU.r(this.game_seed, 6.6);
      return this.GetOrigBar();
    },
    addButtons: function() {
      //if (SG.charButtons) {
      //    SB.put(SG.charButtons);
      //    return;
      //}
//			var renderer = function() {
//				SU.PushTier(new SBar.CharacterRenderer());
//			}
//      SB.add(SF.WIDTH - 160, SF.HEIGHT-80, SM.buttShip, renderer, 60, 60);
      //SG.charButtons = SB.get();
    },
		/*
    setDifficulty: function(diff) {
      this.difficulty = diff;
      var val = 1;
      if (diff === 0) {
        val = 50;
      } else if (diff === 2) {
        val = 25;
      }
    },
		*/
		// Gets the sector index for these x,y coordinates.
		GetBlock: function(x, y) {
      var blockx = Math.floor(x / SF.KNOWN_BLOCK_SIZE);
      var blocky = Math.floor(y / SF.KNOWN_BLOCK_SIZE);
			return blockx + "," + blocky
		},
    addKnownStar: function(x, y) {
			/*
      var block_index = this.GetBlock(x,y);
      var block = this.knownStars[block_index];
      if (!block) {
        this.knownStars[block_index] = {};
      }
			*/
      this.getKnownStarBlock(x,y)[x + "," + y] = true;
    },
    getKnownStarBlock: function(x, y) {
			var block_index = this.GetBlock(x,y);
			if (!this.knownStars[block_index]) {
        this.knownStars[block_index] = {};
			}
      return this.knownStars[block_index];
    },
    addKnownStructure: function(x, y, struct) {
			/*
      var block_index = this.GetBlock(x,y);
      var block = this.knownStructs[block_index];
      if (!block || block === undefined) {
        this.knownStructs[block_index] = {};
      }
			*/
      this.getKnownStructBlock(x,y)[x + "," + y] = true;
    },
    getKnownStructBlock: function(x, y) {
			var block_index = this.GetBlock(x,y);
			if (!this.knownStructs[block_index]) {
        this.knownStructs[block_index] = {};
			}
      return this.knownStructs[block_index];
    },
    addKnownWormhole: function(sx, sy, tx, ty) {
      this.knownWormholes[sx + "," + sy] = {x: tx, y: ty};
    },
    getKnownWormhole: function(sx, sy) {
      return this.knownWormholes[sx + "," + sy];
    },
    // add an object to the found map, cyclic list
    // only adds it if not already found
		// Use find() + foundData to store data.
    find: function(uid) {
      if (!this.found(uid)) {
        uid += "";
        var oldItem = this.foundList[this.foundIndex];
        if (oldItem !== undefined) {
          delete this.foundSet[oldItem];
					// Is there a problem here with cast to string, and direct access by numbers?
					if (this.foundData[oldItem]) {
						delete this.foundData[oldItem];
					}
        }
        this.foundSet[uid] = true;
        this.foundList[this.foundIndex] = uid;
        this.foundIndex++;
        if (this.foundIndex >= foundMax) {
          this.foundIndex = 0;
        }
      }
    },
    unfind: function(uid) {
      uid += "";
      delete this.foundSet[uid];
    },
    // check if object in found map
    found: function(uid) {
      uid += "";
      return (this.foundSet[uid] === true);
    },
		AddCrew: function(hero) {
			if (S$.conduct_data['no_crew']) {
				SU.message(SF.CONDUCTS['no_crew'].title);
				return;
			}
			if (S$.conduct_data['cheerful']) {
				hero.morale = SF.MAX_MORALE_SCORE;
			}			
			if (S$.crew.length >= 10) {
				SU.message("Too many crew");
				return;
			}
			S$.crew_members_joined++;
			if (!hero.is_player) {
				for (let arti of hero.artifacts) {
					arti.imprinted = true;
				}
			}
			// Ensure name uniqueness for all crew.
			let names = {};
			for (let crew of S$.crew) {
				names[crew.name] = true;
			}
			while (names[hero.name]) {
				hero.name += "+";
			}
      this.crew.push(hero);
			hero.AddEvents();
      this.logMessage("Crew member joined: " + hero.name);
			SU.message("Crew added");
			this.BuildOfficerStats();
		},
		DropCrew: function(index) {
			if (index === 0) {
				error("can't drop player")
				return;
			}
			if (index < 0) {
				return;
			}
			S$.game_stats.crew_lost++;
			delete SG.image_cache[this.crew[index].name];
      this.crew.splice(index, 1);
			this.BuildOfficerStats();
		},
    logMessage: function(line) {
      this.messageLog.push([this.time, line]);
			if (this.messageLog.length > 500) {
				this.messageLog.splice(0, this.messageLog.length - 500);
			}
    },
    // set when the game loads
    SetOrigBar: function(building_data) {
			this.raceAlignment[building_data.parentData.systemData.raceseed] = 100;  // Friendly starting region.			
      this.origHomeSeed = building_data.seed;
			this.position.SetFromBuilding(building_data);
    },
    // full game load
    loadCharData: function(data, silent, final_callback, pre_callback) {
      if (!data || !data.savexy) {
        SU.message("Invalid game data");
        error("Invalid game data, no home");
        return;
      }
			SG.allow_browser_leave = false;
      var cb = function() {
				if (pre_callback) {
					pre_callback();
				}
        for (var i in data) {
          S$[i] = data[i];
        }
				// Build any objects out of the stored data.
				for (var i = 0; i < S$.crew.length; i++) {
					S$.crew[i] = new SBar.Crew(-1, -1, -1, -1, S$.crew[i]);
				}
				S$.ship = new SBar.Ship(-1, -1, -1, -1, S$.ship);
				let new_position = new SBar.Position();
				new_position.SetFromParams(S$.position);
				S$.position = new_position;
				
        if (!silent) {
					SU.message("Data Loaded");
				}
				SU.resetSU();
				SBar.ResetGlobals();
				new SBar.StarmapTier().activate(S$.savexy[0], S$.savexy[1]);
				if (final_callback) {
					final_callback();
				}
      };
      SU.fadeOutIn(cb);
    },
		// Player used the fragment around alphas (not this is different from DoTimeTravelBack).
		DoDreamRecurs: function(orig_callback) {
      let charData = SU.formatDataFromImport(localStorage[SF.DREAM_RECURS_SAVE_NAME]);
			charData.in_alpha_space = false;
			charData.alpha_bubbles = null;
			
			let final_callback = function() {
			// 		ShowWindow: function(title, text, callback, icon, is_interrupt/*used internally*/) {
				let message = "You bolt upright, your bedsheets heavy with sweat. "+
				  "Your heart hurts. You had that dream again, that dream where something terrible happened. "+
				  "And you disovered you could time travel, but only to the past to change a decision, and you'd forget everything you learned...\n\n"+

					"You know that dream. You’ve had it before. Your arms are dripping. "+
				  "Your head hurts. You hate that dream. "+
				  "It makes you question reality. It twists your mind.\n\n"+
				
				  "The moments pass. Details of the memory "+
				  "break up and fade, back into the nothingness where dreams are born. You briefly wonder if a dream unremembered is "+
				  "a dream never remembered. It is a night where you are glad to have awoken. "+
				  "And now you can’t remember what the dream was all about. Just that it was that same "+
					"dream again...";
				SU.ShowWindow("The Dream Recurs", message, /*callback=*/undefined, "⌛");
			}
      S$.loadCharData(charData, /*silent=*/true, final_callback, orig_callback);
		},
		// Fragment was activated on the WMD. Travel back in time.
		DoTimeTravelBack: function(battle_type) {
			let shipx = -300;
			let shipy = -300;
			let called_from_arth = battle_type === SF.BATTLE_CORNFIELD;
			if (SG.starmap) {
				shipx = SG.starmap.shipx;
				shipy = SG.starmap.shipy;
			} else {
				error("no starmap from DoTimeTravelBack");
			}
			SU.resetSU();
			SBar.ResetGlobals();
			let callback = function() {
				SU.resetSU();
				SBar.ResetGlobals();
				this.ResetSettingsTimeTravel();
				if (called_from_arth) {
					let region = new SBar.RegionData(0, 0);
					for (let systemData of region.systems) {
						if (systemData.specialType === SF.SYSTEM_ARTH) {
							systemData.generate();
							for (let planet of systemData.planets) {
								if (planet.is_arth) {
									planet.activateTier();
									return;
								}
							}
						}
					}
					error("arth2 not found");
				} else {  // Not called from arth.
					new SBar.StarmapTier().activate(shipx, shipy);
				}
			};
			if (this.showed_intro_terminal) {
				callback.call(this);
			} else {
				let intro_terminal = new SBar.IntroTerminal(callback.bind(this));
				intro_terminal.activate();
			}
		},
    /* 
     * Quest:
     * - coords
     * - UID for checking
     * - xy for directions?
     * - reward and other stuff?
     *  return {"n": name, "x": x, "y": y, "b": buildingLookup, "t": type, "ss": souceSeed, "ts": targetSeed}; // reward? text comes from sourceSeed
     */
    addQuest: function(questObj) {
      if (this.quests.length >= SF.MAX_QUESTS) {
        SU.message("Too many quests");
        error("Too many quests");
				return;
      }
      this.quests.push(questObj.charData());
      this.selectedQuest = this.quests.length - 1;
      this.addKnownStar(questObj.stx, questObj.sty);
    },
    // called when deleted
    dropQuest: function(index) {
      var ss = this.quests[index].ss; // source seed
      S$.unfind(ss + 1); // remove mark for job found
      this.selectedQuest--;
      if (this.selectedQuest < 0) {
        this.selectedQuest = 0;
      }
      this.quests.splice(index, 1);
    },
    // called when completed
    closeQuest: function(index) {
			S$.game_stats.quests_completed++;
			this.quests[index].completed = true;
      this.quests.splice(index, 1);
      if (this.quests.length === 0) {
        this.selectedQuest = null;
      } else {
        this.selectedQuest--;
        if (this.selectedQuest < 0) {
          this.selectedQuest = 0;
        }
      }
    },
    selectQuest: function(index) {
      this.selectedQuest = index;
    },
    deselectQuests: function() {
      this.selectedQuest = null;
    },
    QuestEncounterClear: function(uid, skip_message) {
      for (var i = 0; i < this.quests.length; i++) {
        var quest = this.quests[i];
        if (uid === quest.ts) {
          var full = this.getQuestObj(quest);
					if (!skip_message) {
	          SU.message("Quest Encounter "+full.name);
					}
          //this.logMessage("Completed task: " + full.name);
          //full.completeQuest();
          this.closeQuest(i);
          break;
        }
      }
    },
    getQuestObj: function(data) {
      var full = new SBar.QuestData();
      full.loadFromCharData(data);
      return full;
    },
    getQuestObjBySeed: function(seed) {
      for (var i = 0; i < this.quests.length; i++) {
        if (this.quests[i].ts === seed) {
          return this.getQuestObj(this.quests[i]);
        }
      }
      return undefined;
    },
    knownQuest: function(seed) {
      for (var i = 0; i < this.quests.length; i++) {
        if (this.quests[i].ts === seed) {
          return true;
        }
      }
      return false;
    },
    setFaction: function(newFaction) {
      if (this.faction !== newFaction) {
        //this.goods = 0;
        this.faction = newFaction;
        var numQuests = this.quests.length;
        for (var i = 0; i < numQuests; i++) {
          this.dropQuest(0);
        }
      }
    },
		
		// Player has a drink.
		HaveDrink: function() {
			if (S$.conduct_data['nonalcoholic']) {
				return;
			}
			// Note this doesn't filter old entries.
			this.drink_times.push(this.time);
			if (this.IsDrunk()) {
				for (let i = 1; i < this.crew.length; i++) {
					SE.ApplyMorale(SE.MORALE_DRUNK, this.crew[i]);
				}
			}
		},
		// Player had the max number of drinks.
		IsDrunk: function() {
			return this.NumDrinks() >= 5;
			/*
			//var active_drinks = this.time <= this.last_drink_time + 2 * 24;
			if (this.num_drinks > 0 && !active_drinks) {
				// Two days have passed. Reset drinks.
				this.num_drinks = 0;
				return false;
			}
			if (active_drinks) {
				return this.num_drinks >= 5;
			}
			*/
		},
		NumDrinks: function() {
			this.drink_times = this.drink_times.filter(function(time) {  // filter() needs true to keep it.
				return time >= S$.time - 2*24;
			});
			return this.drink_times.length;
		},
		GetWeek: function() {
			return Math.floor(this.time/24/7);
		},
		
		//
		//  ** Begin building and system stat tracking **
		//
		
		GetSystemBuildingData: function(system_seed) {
			var set = this.systemBuildingSet[system_seed];
			if (set === undefined) {
				this.systemBuildingSet[system_seed] = {};
				set = this.systemBuildingSet[system_seed];
				set.seed_buildings = {};
				set.moons = {};
				set.visits = 0;
				// Prune if needed. This isn't optimal in terms of LRU, but
				// it's just a storage / memory failsafe and not expected to
				// be needed often.
				this.buildingPruneList[this.buildingPruneIndex] = system_seed;
				this.buildingPruneIndex++;
				if (this.buildingPruneIndex >= buildingSystemMax) {
					this.buildingPruneIndex = 0;
				}
				let next_set = this.buildingPruneList[this.buildingPruneIndex];
				if (next_set) {
					delete this.systemBuildingSet[next_set];
				}
			}
			return set;			
		},
		
		AddBuildings: function(planet_or_belt_data, /*optional*/long_range_scan) {
			let seed = planet_or_belt_data.seed;
			let system = this.GetSystemBuildingData(planet_or_belt_data.systemData.seed);
			this.AddSystemBuildingData(planet_or_belt_data.systemData);
			if (system.seed_buildings[seed]) {
				// Already added.
				return;
			}
			planet_or_belt_data.genBuildingTypes();
			system.seed_buildings[seed] = [];
			let node = system.seed_buildings[seed];
			for (let building of planet_or_belt_data.building_types) {
				// Just numeric values in a list for efficient storage.
				if (building[0] !== undefined && building[0] !== null) {
					// Asteroid slots can line up with buildings, which might result in a null building.
					node.push([building[0], building[1], planet_or_belt_data.level]);
				}
			}
			system.tech = planet_or_belt_data.level;
			if (planet_or_belt_data.moons) {
				system.moons[seed] = [];
				for (let moon of planet_or_belt_data.moons) {
					system.moons[seed].push(moon.seed);
					if (long_range_scan || S$.ship.sensor_level >= SF.SENSOR_MOON_STRUCTURES) {
						this.AddBuildings(moon, planet_or_belt_data);
					}
				}
			}
			system.tech = planet_or_belt_data.level;
		},			
		
		// Add a single building.
		AddKnownBuilding: function(planet_or_belt_data, type, faction, level) {
			const seed = planet_or_belt_data.seed;
			const system_seed = planet_or_belt_data.systemData.seed;
			let system = this.GetSystemBuildingData(system_seed);
			this.AddSystemBuildingData(planet_or_belt_data.systemData);
			if (!system.seed_buildings[seed]) {
				system.seed_buildings[seed] = [];
			}
			system.seed_buildings[seed].push([type, faction, level]);
		},
		RemoveKnownBuilding: function(planet_or_belt_data, type, faction, level) {
			const seed = planet_or_belt_data.seed;
			const system_seed = planet_or_belt_data.systemData.seed;
			let system = this.GetSystemBuildingData(system_seed);
			if (!system.seed_buildings[seed]) {
				// Shouldn't happen, but reasonably ok to ignore.
				error("noremove1");
				return;
			}
			//for (let building of system.seed_buildings[seed]) {
			// Reminder to only remove one building.
			let buildings = system.seed_buildings[seed];
			for (let i = 0; i < buildings.length; i++) {
				let building = buildings[i];
				if (building[0] === type && building[1] === faction && building[2] === level) {
					buildings.splice(i, 1);
					return;
				}
			}
			// Couldn't find it. Shouldn't happen, but reasonably ok to ignore.
			error("noremove2");
		},
		AddSystemBuildingData: function(system_data) {
			let system = this.GetSystemBuildingData(system_data.seed);
			if (system.planets !== undefined && system_data.name === system.name) {
				// Already set.
				// Note the name may change if sensors get upgraded.
				return;
			}
			system.belts = system_data.numbelts;
			system.planets = system_data.numplanets;
			system.systemx = system_data.x;
			system.systemy = system_data.y;
			system.level = system_data.level;
			system.name = system_data.name;
		},
		// Returns the unique buildings in the system. Or planet/belt (node_seed) and moons.
		GetBuildingTypes: function(system_seed, /*optional*/node_seed) {
			let system = this.GetSystemBuildingData(system_seed);
			if (!system) {
				return [];
			}
			let types_set = new Set();  // Set is ok here since it's not serialized.
			let node_seeds = [];
			// Collect the nodes to look at.
			if (node_seed) {
				node_seeds.push(node_seed);
				if (system.moons[node_seed]) {
					node_seeds = node_seeds.concat(system.moons[node_seed]);
				}
			} else {  // System.
				for (obj in system.seed_buildings) {
					node_seeds.push(obj);
				}
			}
			// Grab the buildings for those nodes.
			for (let seed of node_seeds) {
				const node = system.seed_buildings[seed];
				if (node) {
					for (let building of node) {
						types_set.add(building[0]);
					}
				}
			}
			return Array.from(types_set)
		},
		GetMoonsSymbol: function(system_seed, node_seed) {
			let system = this.GetSystemBuildingData(system_seed);
			let moons = system.moons[node_seed];
			if (moons && moons.length > 0) {
				return MOON_SYMBOLS[moons.length];
			}
			return "";
		},
		
		IsKnownPlanet: function(system_seed, node_seed) {
			return this.GetSystemBuildingData(system_seed).seed_buildings[node_seed] !== undefined;
		},
		GetSystemStatSymbols: function(system_seed) {
			var set = this.GetSystemBuildingData(system_seed);
			if (set.planets === undefined) {
				// Not initialized at the system level.
				return "?";
			}
			var symbols = "";
			if (set.planets) {
				symbols += PLANET_SYMBOLS[set.planets];
			}
			if (set.belts) {
				symbols += BELT_SYMBOLS[set.belts];
			}
			if (set.tech) {
				symbols += SF.SYMBOL_LEVEL+set.tech;//"T"+set.tech;
			}
			if (symbols == "") {
				symbols = "-";
			}
			return symbols;
		},
		TrackSystemVisit: function(system_seed) {
			let set = this.GetSystemBuildingData(system_seed);
			set.visits++;
		},
		
		//
		//  ** Custom buildings **
		//

		
		// Removes a standard building from being displayed. The planet and belt tiers skip showing these.
		RemoveStandardBuilding: function(building_data) {
			this.removed_buildings[building_data.seed] = true;
			this.RemoveKnownBuilding(building_data.parentData, building_data.type, building_data.faction, building_data.level)
		},
		// Adds a custom building. If 'expiration_data' is provided it must be building or asteroid data and an expiration will be added.
		AddCustomBuilding: function(planet_or_belt_data, seed, type, x, y, data, /*optional*/expiration_data) {
			let expiration = null;
			if (expiration_data) {
				expiration = this.time + this.CalculateExpiration(expiration_data, x, y);
			}
			if (!this.custom_buildings[planet_or_belt_data.seed]) {
				this.custom_buildings[planet_or_belt_data.seed] = {};
			}
			this.custom_buildings[planet_or_belt_data.seed][seed] = {type: type, seed: seed, x: x, y: y, data: data, expiration: expiration};
			if (!data.faction) {
				data.faction = SF.FACTION_NORMAL;
			}
			if (!data.level) {
				data.level = S$.crew[0].base_level;
				if (data.data && data.data.level) {
					data.level = data.data.level;
				}
			}
			this.AddKnownBuilding(planet_or_belt_data, type, data.faction, data.level);
		},
		// Returns true if a custom building exists at x,y.
		GetCustomBuilding: function(parent_seed, x, y) {
			if (!this.custom_buildings[parent_seed]) {
				return undefined;
			}
			let set = this.custom_buildings[parent_seed];
			for (let key in set) {
				if (set[key].x == x && set[key].y == y) {
					return set[key];
				}
			}
			return undefined;
		},
		
		ExistsCustomBuilding: function(parent_seed, x, y) {
			return this.GetCustomBuild !== undefined;
		},
		
		RemoveCustomBuilding: function(planet_or_belt_data, x, y) {
			let parent_seed = planet_or_belt_data.seed;
			let building = this.GetCustomBuilding(parent_seed, x, y);
			if (!building) {
				error("nocustomremove");
				return;
			}
			if (this.custom_buildings[parent_seed]) {
				delete this.custom_buildings[parent_seed][building.seed];
			} else {
				error("nocustomremove2");
			}
			this.RemoveKnownBuilding(planet_or_belt_data, building.type, building.data.faction, building.data.level);
		},

		
		// Generates an expiration for this building or asteroid data, based on likelyhood of it being found.
		CalculateExpiration: function(expiration_data, x, y) {
			// expiration_data is a planetD or beltD (type 202, 203).
			if (!expiration_data) {
				return null;
			}
			let is_planet = expiration_data.type === SF.TYPE_PLANET_DATA;
			let is_moon = is_planet && expiration_data.is_moon;
			let is_belt = expiration_data.type === SF.TYPE_BELT_DATA;
			if (!expiration_data.type === SF.TYPE_BELT_DATA && !expiration_data.type === SF.TYPE_PLANET_DATA) {
				error("bad expiration_data");
				return null;
			}
			let systemData = expiration_data.systemData;
			let nearby_buildings = expiration_data.building_types.length > 0;
			let race_controls_system = systemData.race_controls_system;
			let fast_find = false;
			if (is_planet) {
				if (expiration_data.is_capital) {
					fast_find = true;
				}
			} else {
				// Asteroid.
				if (expiration_data.is_pirate_base || expiration_data.is_starport) {
					fast_find = true;
				}
			}
			let expiration = SU.r(expiration_data.seed, 9.95)*400+200; // 200-600 days by default.
			if (is_moon || is_belt) expiration *= 2;  // Moons and belts are less likely to be visited.
			if (nearby_buildings) expiration /= 2;  // Area has visitors.
			if (race_controls_system) expiration /= 2;  // Area has visitors.
			if (fast_find) expiration /= 10;  // Lots and lots of visitors.
			if (is_planet && !expiration_data.ggiant) {
				if (expiration_data.GetTerrainHeight(x, y) > 20) {  // 128 scale.
					// Remote.
					expiration *= 2;
				}
				if (expiration_data.GetTerrainHeat(x, y) > 400) {
					// Heat can cause decay.
					expiration /= 2;
				}
				if (expiration_data.lightningfreq > 0.5) {
					expiration /= 2;
				}
				if (expiration_data.tectonics > 0.5) {
					expiration /= 4;
				}
			}
			expiration = Math.round(expiration);
			return expiration*24; // Convert to hours.
		},
		CheckExpiredCustomBuilding: function(custom_data, planet_or_belt_data, systemData) {
			if (systemData.in_alpha_bubble) {
				custom_data.expiration = 1;
			}
			if (!custom_data.expiration || custom_data.expiration > this.time) {
				// Not expired.
				return custom_data;
			}
			// Expire the building.
			this.RemoveKnownBuilding(planet_or_belt_data, custom_data.type, custom_data.data.faction, custom_data.data.level);
			this.AddKnownBuilding(planet_or_belt_data, SF.TYPE_RUINS, custom_data.data.faction, custom_data.data.level);
			
			custom_data.type = SF.TYPE_RUINS;
			custom_data.data.time = custom_data.expiration;
			if (!custom_data.data.name) {
				custom_data.data.name = "cargo";
			}
			//if (custom_data.data.name) {
				custom_data.data.building_name = custom_data.data.name;
				//}			
				
			delete custom_data.expiration;
			return custom_data;
			
			//let custom_data = {name: "Ruins of "+this.data.name[0], seed: this.data.seed, building_name:this.data.name[0]+" "+this.data.name[1], time: S$.time};
			
			//S$.AddCustomBuilding(this.data.parentData.seed, this.data.seed, SF.TYPE_RUINS, this.data.x, this.data.y, custom_data);	
		},
		
		//
		//  ** End building and system stat tracking **
		//
				
		
		AddHudMessage: function(message) {
			if (message.includes(SF.SYMBOL_TIME)) {
				return;  // Don't want to log time passing.
			}
			// Only store the last 20 or so.
			// End holds the newest.
			this.hudMessages.push([this.time, message]);
			if (this.hudMessages.length > 25) {
				this.hudMessages.splice(0, this.hudMessages.length - 25);
			}
		},
		// Default alignment for a race seed.
		BaseAlignment: function(seed) {
			if (S$.conduct_data['all_friendly']) {
				return SF.MAX_ALIGN_SCORE;
			}
			return Math.round(SU.r(this.game_seed, seed)*SF.MAX_ALIGN_SCORE);
		},
		AddRaceAlignment: function(seed, rivalseed) {
			this.raceAlignment[seed] = this.BaseAlignment(seed);
			if (rivalseed) {
				this.raceRival[seed] = rivalseed;
			}
	  },
		ChangeRaceAlignment: function(seed, amount) {
			if (seed === SF.RACE_SEED_ALPHA) {
				// Can't change.
				return;
			}
			if (this.raceAlignment[seed] === undefined) {
				this.AddRaceAlignment(seed);
			}
			this.ChangeRaceAlignmentInternal(seed, amount);
			if (this.raceRival[seed]) {
				this.ChangeRaceAlignmentInternal(this.raceRival[seed], -1*amount);
			}
		},
		ChangeRaceAlignmentInternal: function(seed, amount) {
			let prior_score = this.raceAlignment[seed];
			this.raceAlignment[seed] += amount;
			if (this.raceAlignment[seed] > SF.MAX_ALIGN_SCORE) this.raceAlignment[seed] = SF.MAX_ALIGN_SCORE;
			if (this.raceAlignment[seed] < 0) this.raceAlignment[seed] = 0;
			let new_score = this.raceAlignment[seed];
			if (new_score < SF.NEUTRAL_SCORE && prior_score >= SF.NEUTRAL_SCORE) {
				SU.message(ST.RaceNameOnly(seed)+" "+SF.SYMBOL_SAD);
			} else if (new_score >= SF.NEUTRAL_SCORE && prior_score < SF.NEUTRAL_SCORE) {
				SU.message(ST.RaceNameOnly(seed)+" "+SF.SYMBOL_HAPPY);
			}				
		},
		found_race_seed_offset: 2.32,
		AddKnownRace: function(seed) {
			this.find(seed+this.found_race_seed_offset);
		},
		IsRaceKnown: function(seed) {
			return this.found(seed+this.found_race_seed_offset);
		},
		AddCredits: function(amount) {
			if (this.conduct_data['no_money']) {
				SU.message(SF.CONDUCTS['no_money'].title);
				return;
			}
			S$.game_stats.credits_acquired += amount;
			this.credits += amount;
		},
		RemoveCredits: function(amount) {
			if (this.conduct_data['no_money']) {
				SU.message(SF.CONDUCTS['no_money'].title);
				return;
			}
			S$.game_stats.credits_spent += amount;
			this.credits -= amount;
			if (this.credits < 0) {
				// Shouldn't happen, just in case.
				this.credits = 0;
			}
		},
		// Sets each of the officers based on best stats
		// (crew members can hold multiple positions).
		BuildOfficerStats: function() {
			this.officer_stats = []
			this.officer_names = []
			for (let i = 0; i < SF.NUM_STATS; i++) {
				this.officer_stats.push(0);
				this.officer_names.push("");
			}
			for (let crew of S$.crew) {
				for (let i = 0; i < SF.NUM_STATS; i++) {
					if (crew.stats[i] > this.officer_stats[i]) {
						this.officer_stats[i] = crew.stats[i];
						this.officer_names[i] = crew.name;
					}
				}
			}
			if (S$.ship) {  // Might not be initialized yet.
				S$.ship.RebuildArtiStats();
			}
			if (S$.tow_ship) {
				S$.tow_ship.RebuildArtiStats();
			}
		},

  };
})();
