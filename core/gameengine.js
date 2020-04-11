/*
Copyright (c) 2020 Jeff Hoy
MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

TODOs:
*/

/*

Game engine and globals.

Global shorthands:
 SU: SBar.Utils
 ST: SBar.Text
 SC: SBar.Canvas
 SF: SBar.Final
 SM: SBar.Media
 S$: character sheet / game data
 SG: Sbar global
 TU: Tact util
 TF: Tact final
 TG: Tact global
 TC: Tact canvas
 */

/** 
 * @namespace SBar
 */
var SBar = {};

(function() {

  /**
   * @license Space Bar Copyright (C) 2020
   */
  var KEYSDOWN = [];

  SBar.Final = {
		// Debug tools.
		ALL_BUILDINGS: false,            // All buildings set to this type (i.e, 3 = CITY). Or false for no override.
		ALL_STARPORTS: false,            // Makes all belts into starports.
		DEBUG_HEALTH: false,             // Lots of extra health for friendlies.
		WIN_BATTLES: false,              // Automatically win battles (no enemies).
		DEBUG_SENSORS: false,            // Travel far in space.
		SHOW_SPACE_ALL: false,           // Show all objects on the starmap.
		ALWAYS_SPACE_ENCOUNTERS: false,  // Immediate encounters in space.
		DISABLE_SPACE_ENCOUNTERS: false, // No encounters in space.
		NO_BUBBLES: false,               // No alpha region spheres.
		STATIC_SEED: false,              // Keep the same global seed on each reload.
		VERY_FAST_SHIPS: false,          // Fast travel animations (but not skipped).
		// Useful debug options. These are automatically enabled when loading the test framework (at the top, or test framework SHIFT-P ENABLE_SHIFT_DEBUGS).
		ALLOW_NAVIGATE_AWAY: false,      // Disables the check to prevent browser forward/back.
		EXIT_BATTLE_OPTION: false,       // 'W' to win/exit battles (no win renderer).
		FAST_TRAVEL: true,              // Skip travel animation.
		// Common debug options.
		LOAD_TEST_FRAMEWORK: true,      // Loads the test framework on load, instead of the start menu.
		ENABLE_SHIFT_DEBUGS: true,      // SHIFT-P: Show the testing harness overlay. SHIFT-L: Save game state import/export.
		// Debug abilities are in skill.js L491.

		VERSION: 0.05,
		COPYRIGHT_YEAR: "2020",
		
    // building types. These are here to be close to the debug above.
    TYPE_BAR: 0,             // Space bar!
    TYPE_TEMPLE_BAR: 1,      // Special friendly bar temple, treated as its own type
    TYPE_MINING: 2,          // sells minerals
    TYPE_CITY_ARTI: 3,       // Cities buy items of different types.
    TYPE_CITY_ORE: 4,
    TYPE_CITY_GOODS: 5,
    TYPE_CITY_CONTRA: 6,
    TYPE_CITY_ALL: 7,
    TYPE_CITY_SPECIAL: 8,
    TYPE_CITY_SHIP: 9,
    TYPE_COLONY: 10,         // Colony/biodome. Buys goods or minerals at a premium.
    TYPE_LAB: 11,            // Sells goods/contraband
    TYPE_ARMORY: 12,         // Sells upgrades and artifacts
    TYPE_TEMPLE: 13,         // alpha temple
    TYPE_HOTEL: 14,          // Heal up.
    TYPE_OBSERVATORY: 15,    // Buy starmap.
    TYPE_JOB: 16,            // Quest.
    TYPE_SHIPYARD: 17,       // Ship trading.
    TYPE_RUINS: 18,          // Destroyed building or pillaged stash.
    TYPE_INFORMATION: 19,    // Information station on starports.
    TYPE_ANIMAL: 20,         // Native lifeform on planet.
    TYPE_GOODY_HUT: 21,      // Prize. Or ambush.
    TYPE_CONSTRUCTION: 22,   // For building buildings.
    TYPE_ARENA: 23,          // Arena battles.
		TYPE_OBELISK: 24,        // Mystery stone that gives some bonus. / pillar / monument.
		TYPE_UNIVERSITY: 25,     // Train skills.
    TYPE_DERELICT: 26,       // Derelict ship.
		// Custom building types.
		TYPE_CUSTOM_SHIP: 27,    // Custom ship left behind.
		TYPE_CUSTOM_TREASURE: 28,
		TYPE_CUSTOM_MINE: 29,
		
		TYPE_ALPHA_BARRACKS: 30, // Alpha enemies.
		TYPE_ALPHA_AIRPORT: 31,  // Alpha enemies.
		TYPE_ALPHA_HQ: 32,       // Alpha enemies.
		TYPE_ALPHA_DANCE: 33,    // Friend's / boss's dance floor.
		TYPE_CORNFIELD: 34,      // Main plot location.
		// -- Reminder to update 7buildingFindR if adding more building types. --
				
		// Credit levels is also used for XP levels. It could use a rename.
		//LEVEL_XP: [1,2,5,10,20,50,100,200,500,1000],
		//LEVEL_XP: [0,1,2,4,6,8,10,15,20,30,40,60,80,100,150,200,300,400,600,800,1000],
		//LEVEL_XP: [0,1,2,4,7,10,20,40,70,100,200,400,700,1000,2000,4000,7000,10000,20000,40000,80000,/*level 21*/99999999],
		// Current formula: each level is the prior x (1+0.95^level). So a slowly decreasing multiplicitive increase.
    // 0 entry just for 0-index (level starts at 1). Max 20 (MAX_LEVEL).
		// The last number is just for array safety backup, it shouldn't come up (clients should check MAX_LEVEL).
		// Note L1 is not used for XP ('15' should never show up) but needs to be there for L1 money calculations like L1 arti sale price.
		LEVEL_XP: [0,/*L1, non-0 for money*/15,30,60,120,220,420,750,1300,2300,/*level 10*/4000,6500,11000,17000,27000,40000,60000,90000,130000,200000,300000,/*level 21*/99999999],
		SYMBOL_CREDITS: "$", //₵⊕. Symbol goes before text.
		SYMBOL_CARGO: "■", //▪ ■ □ ▢ ▣ ▤ ▩ ◽ ◼ ◾ ⎕. Before text.
		SYMBOL_TIME: "⧗",  // Before text.
		SYMBOL_HEALTH: "♥",  // After text.
		SYMBOL_MORALE: "☺", // After text, like health.
		SYMBOL_HAPPY: ":)",  // :) 😊
		SYMBOL_CONTENT: ":/",  // :/ 😐
		SYMBOL_SAD: ":(",  // :( 😞
		SYMBOL_LEVEL: "L", // Before text.
		SYMBOL_SHIFT: "⇧", // To instruct the player to push the shift key.
		// SYMBOL_SPEED: "⇒", // Before text.  // This symbol removed because it's not memorable and it's rarely used.
		SYMBOL_MINERALS: "💎", // Before text.
    WIDTH: 1000,
    HEIGHT: 800,
    TEXT_WIDTH: 280,
    TEXT_HEIGHT: 800,
    MARGIN_LEFT: 15,
    MARGIN_TOP: 5,
    //HALF_HYPOT: 800, // distance from center to corner plus ~70 pad
    //HALF_HYPOT2: 640000, // squared
    HALF_WIDTH: null,
    HALF_HEIGHT: null,
    SYSTEM_ZOOM: 60, // system zoom relative to space
    STARMAP_ZOOM: 13, // ratio of interstellar to starmap
    KNOWN_BLOCK_SIZE: null, // storage arrays for tracking known stars and object, same as region size
    REGION_SIZE: 10000, // region hieght and width, constructs can be twice this big. Needs to be > WIDTH and HEIGHT at min
		                   // Note region size was original au, but now is some ae / LY hybrid.
    MAX_QUESTS: 5,
    VALUE_COLOR: "#FAF", // common highlight color for displays
		ARTI_TILE_SIZE: 20,  // Artifact block size, in pixels.
		// General confirmation key.
		CONFIRM_KEY_VALUE: 32,
		CONFIRM_KEY_DISPLAY: "SPACE",
		FRIENDLY_SCORE: 60,  // Alignment of this and higher is friendly.
		NEUTRAL_SCORE: 40,  // Alignment of this and higher is neutral.
		MAX_ALIGN_SCORE: 100,
		HAPPY_SCORE: 60,  // Alignment of this and higher is friendly.
		CONTENT_SCORE: 40,  // Alignment of this and higher is neutral.
		MAX_MORALE_SCORE: 100,
		MAX_LEVEL: 20,  // Levels go up to 20.
		DREAM_RECURS_SAVE_NAME: "dream_save",
		WMD_ABILITY_NAME: "World Modification Device (The WMD)",
		WMD_FRAGMENT_NAME: "WMD Residual",
		ORIGINAL_BUBBLE_TIME: 48, // Time that the original bubble appears.
		ORIGINAL_BUBBLE_X: 75,
		ORIGINAL_BUBBLE_Y: 75,
		CORNFIELD_EVENT_HOURS: 6,  // Cornfield event will triger if time is <= this value. It's not 0 to allow a small amount of travel time.
		HOSTILE_RACE_GRACE_PERIOD_HOURS: 72,  // Time the player has to run away when meeting a hostile race.
		LOCALSTORAGE_HIDE_HOTKEYS: "hide_hotkeys",
		LOCALSTORAGE_LOCK_RATIO: "lock_ratio",
		BUILDING_TEXT_ICON_SIZE: 20,  // Size of building icon images alongsize text.
		ARTH_2_NAME: "Arth 2",
		GAME_NAME: "SPACEBAR-1",  // Stylized name.
		FONT: "sans-serif",
		FONT_S: "10pt sans-serif",
		FONT_M: "12pt sans-serif",
		FONT_L: "14pt sans-serif",
		FONT_XL: "20pt sans-serif",
		FONT_SB: "bold 10pt sans-serif",
		FONT_MB: "bold 12pt sans-serif",
		FONT_LB: "bold 14pt sans-serif",
		FONT_XLB: "bold 20pt sans-serif",
		
		// Predefined character seed.
		RACE_SEED_HUMAN: 0,  // Also the player's hero seed.
		RACE_SEED_ALPHA: 1,
		
    // object types
    TYPE_UNDEFINED: -1,
			
		// Stat list indices: STR, DEX, INT, WIS, CHA.
		// Note The Good Place stats don't map to D&D stats (there are 5 here anyway)
		// But the D&D abbreviations are used here for relevancy and also to make it
		// flexible so these names could be changed easily.
		// Stats affect prerequites for items. Rough breakdown:
		//  - STR: damage.
		//  - DEX: move abilities, physical buffs. ship move.
		//  - INT: offensive abilities. ship scans.	
		//  - WIS: buffs / defensive abilities, health.
		//  - CHA: summons, conversions and related effects, threat.
		NUM_STATS: 5,
		STAT_STR: 0,
		STAT_DEX: 1,
		STAT_INT: 4,
		STAT_WIS: 3,
		STAT_CHA: 2,
		// Joke from The Good Place.
		STAT_FULL_NAME: ["Dancing Ability", "Coolness", "Smart-brained", "Freshness", "Dopeness"],
		// STAT_NAME: ["STR", "DEX", "INT", "WIS", "CHA"],
		//STAT_NAME: ["DAN", "COO", "DOP", "FRE", "SMA"],
		//STAT_NAME: ["⚔", "❄️", "📖", "☢", "🗣"],
    STAT_NAME: ["🗡️", "❄️", "📖", "🥼", "🕶️"],  // 💂
		STAT_OFFICER_TITLE: ["Security Officer", "Communications", "Science Officer", "Chief Engineer", "First Officer"],
		STAT_TEXT_COLOR: "#F8F",
			
    // Factions
    FACTION_NORMAL: 50,
    FACTION_PIRATE: 51,
    FACTION_ALPHA: 52,
    // Icons objects
    TYPE_SHINY: 100,
    TYPE_MINERAL: 101,
    TYPE_ASTEROID: 102,
    TYPE_DUST: 103,
    TYPE_REGION_ICON: 104,
    TYPE_STRUCT_ICON: 105,
    TYPE_SYSTEM_ICON: 106,
    TYPE_PLANET_ICON: 107,
    TYPE_BELT_ICON: 108,
    TYPE_MAP_STRUCT: 109,
    TYPE_ERUPT: 110,
    TYPE_EXPLODE: 111,
    TYPE_ARTIFACT_ICON: 112,
    TYPE_ARTIFACT_SHAPE_ICON: 113,
    TYPE_ARTIFACT_ICON_COMPLEX: 114,
		TYPE_SHIP_MAP_ICON: 115,
		TYPE_CURSOR_ICON: 116,
    TYPE_ALIEN_ICON: 117,
		TYPE_MAPRACE_ICON: 118,
    TYPE_STRUCT_NEBULA: 150,  // This one is used for nebula in the background.
    TYPE_STRUCT_BARREN: 151,
    TYPE_STRUCT_BLACKHOLE: 152,
    TYPE_STRUCT_BADLAND: 153,
    TYPE_STRUCT_WALL: 154, // Disabled.
    TYPE_STRUCT_MINEFIELD: 155, // Disabled.
    TYPE_STRUCT_NEBULA_STARS: 156,
    TYPE_STRUCT_NEBULA_ROCK: 157,
    TYPE_STRUCT_NEBULA_MIXED: 158,
    TYPE_STRUCT_NEBULA_WORMHOLE: 159,
    TYPE_STRUCT_NEBULA_EMPTY: 160,
    TYPE_STRUCT_WORMHOLE: 161,
    TYPE_ICON_GENERIC: 162,
    TYPE_TEMPLE_OBJ: 163,
    TYPE_TEMPLE_STAIRS: 164,
    TYPE_STARPORT_ICON: 165,
    TYPE_CHAR_DETAILS_ICON: 166,
		TYPE_FRAGMENT_TEXT_ICON: 167,
    // Data Objects
    TYPE_REGION_DATA: 200,
    TYPE_SYSTEM_DATA: 201,
    TYPE_PLANET_DATA: 202,
    TYPE_BELT_DATA: 203,
    TYPE_ENCOUNTER_DATA: 204,
    TYPE_TACT_DATA: 205,
		TYPE_BATTLE_BUILDER: 206,
		TYPE_MAP_BUILDER: 207,
		TYPE_ENEMY_BUILDER: 208,
		TYPE_SHIP: 209,
		TYPE_HERO: 210,
		TYPE_POSITION: 210,
    // System special types
    SYSTEM_NORMAL: 250,
    SYSTEM_DEAD_ROCKS: 251,
    SYSTEM_DEAD_MIXED: 253,
    SYSTEM_DEAD_TREASURE: 254,
    SYSTEM_RACE_HOMEWORLD: 255,
		SYSTEM_ALPHA_CORE: 256,
		SYSTEM_ARTH: 257,  // Original home system.
    // Enemies
    TYPE_MINE_WEAPON: 301,
    // Tiers
    TIER_TEMPLE: 500,
    TIER_BUILDING: 501,
    TIER_PLANET: 503,
    TIER_PBELT: 504,
    TIER_SYSTEM: 505,
    TIER_SPACE: 506,
    TIER_STARMAP: 507,
    TIER_CHARR: 508,
    TIER_TEST: 509,
    TIER_OPTSR: 510,
    TIER_START: 511,
    TIER_COMPLEX: 512,
    TIER_PLANETSIDER: 513,
    TIER_ENCOUNTER: 514,
    TIER_TACT: 515,
    TIER_INFORMATIONR: 516,
		TIER_OBELISKR: 517,
		TIER_BIGMAP: 518,
		TIER_INTRO: 519,
    TIER_LOADR: 520,
		TIER_BUILDINGFINDR: 521,
    TIER_TRAVEL: 522,
		TIER_LOOKAROUND: 523,
		// End object types.
		
    // Terrain types
    TLAND: 531,
    TWATER: 532,
    TLAVA: 533,
    TICE: 534,
    TGAS: 535,
    TDESERT: 536,
		TMETHANE: 537,
		// Skill types for heroes and artifacts.
		SKILL_OMEGA_FRAGMENT: 700,  // WMD fragment.
		SKILL_TRUE_OMEGA: 701,  // Full WMD.
		SKILL_DARK_ENGINE: 702,
		SKILL_ALPHA: 703,
		SKILL_ALPHA_DAMAGE: 704,
		SKILL_PIRATE: 705,
		SKILL_SHIP: 706,  // Ship skill effective subtypes follow. Value range follows to sensors.
		SKILL_SHIP_SPEED: 707,
		SKILL_SHIP_FLEE: 708,
		SKILL_SHIP_MINING_LEVEL: 709,
		SKILL_SHIP_MINING_SPEED: 710,
		SKILL_SHIP_CARGO: 711,
		SKILL_SHIP_SENSORS: 712,  // This one is indexed in iconArtifact.js.
		SKILL_STANDARD: 713,
		SKILL_DAMAGE: 714,  // Damage ability with cooldown 1.
		SKILL_PIRATE_DAMAGE: 715,
		SKILL_NOSUMMON: 716,  // Like SKILL_STANDARD but skip summons.
		SKILL_BOOST: 717,  // Connected artifact boost.
		SKILL_STATS: 718,  // Hero stats (level, hp, speed).
		SKILL_CARGO: 719,  // Cargo. Not actually a skill, but stored like other skills.
		// Hero personalities.
		// Note these need to start at 0, since they are used for indexing.
		P_INEPT: 0,
		P_MEEK: 1,
		P_MYSTERY: 2,
		P_ROGUE: 3,
		P_PLAYER: 4, // Player is last, for indexing.
		P_FERAL: 5,
		// Hero flaws.
		FLAW_BAD_MORALE: 750,
		FLAW_SICK: 751,
		FLAW_FISHING: 752,
		FLAW_AGE: 753,
		FLAW_METAMORPH: 754,
		FLAW_MINDGEL: 755,
		FLAW_STEAL_MONEY: 756,
		FLAW_MURDER: 757,
		// Ship types.
		SHIP_ALPHA: 721,  // Also includes the player's starting ship, which will override the name.
		SHIP_COMMON: 722,
		SHIP_MINING: 723,  // Effective subtype of SHIP_COMMON.
		SHIP_CARGO: 724,  // Effective subtype of SHIP_COMMON.
		SHIP_POD: 725,  // Escape pod.
		SHIP_PIRATE: 726,  // Pirate.
		// Trade goods types. Note these numbers are indexed by value in the code.
		CARGO_ORE: 631,
		CARGO_GOODS: 632,
		CARGO_CONTRABAND: 633,
		
		// Battle types.
		//BATTLE_ALPHA1: 801,
		//BATTLE_ALPHA2: 802,
		//BATTLE_ALPHA3: 803,
		//BATTLE_PLANT: 804,
		BATTLE_ANIMAL: 805,
		BATTLE_ALPHA: 806,
		BATTLE_POLICE: 807,
		BATTLE_PIRATE: 808,
		BATTLE_ARENA: 809,
		//BATTLE_BUILDING: 810,
		BATTLE_RACE_MILITARY: 811,
		BATTLE_QUEST: 812,
		BATTLE_SHOP: 813,
		BATTLE_BARFIGHT: 814,
		BATTLE_PARTY: 815,
		BATTLE_AMBUSH: 816,
		BATTLE_CORNFIELD: 817,
		
		// Battle AI, for tact.
		AI_TARGET_PLAYER: 850,  // Target friendlies.
		AI_TARGET_COMP: 851,  // Target enemies.
		AI_TARGET_BOTH: 852,  // Friendlies and enemies.
		AI_HEALTH_0: 853,  // For revive.
		AI_HEALTH_50: 854,  // Target health is 50% or less.
		AI_HEALTH_90: 855,  // Target health is 90% or less.
		AI_HEALTH_LESS: 856,  // Caster health is less than target.
		// This is now default for all effects.
		//AI_CHECK_EFFECT: 857,  // Make sure the effect hasn't been applied already.
		AI_CHECK_BUFFS: 858,  // Make sure the target has buffs.
		AI_CHECK_DEBUFFS: 859,  // Make sure the target has debuffs.
		AI_CHECK_SUMMONED: 860,  // Make sure the target was summoned this combat.
		
		// Look these up using "S$.conduct_data['no_equipment']".
		CONDUCTS: {
			// Bonuses.
			upper_class: {title: "Upper Upper Class", desc: "Start with lots of money.", bonus: true},  // D&D reference.
			explore_mode: {title: "Heroic Drama Power", desc: "Your crew cannot die from damage.", bonus: true},  // The Tick reference.
			nonalcoholic: {title: "Nonalcoholic", desc: "It's a life choice. And a good one.", bonus: true},  // Good choice.
			cansave: {title: "Interstellar Clones", desc: "You can reload saved games in Interstellar.", bonus: true},
			all_sensors: {title: "Total Awareness", desc: "Top-of-the-line ship sensors.", bonus: true},  // (Heightened Senses)
			all_friendly: {title: "Diplomatic Tongue", desc: "All aliens start friendly.", bonus: true},
			can_restart_battle: {title: "Lucid Dream", desc: "Restart battles at any time.", bonus: true},  // (Future sight).
			cheerful: {title: "Inherently Optimistic", desc: "Crew start out happy.", bonus: true},
			guardian_angel: {title: "Guardian Angel", desc: "Accompanied by an alien friend.", bonus: true},
			fast_ships: {title: "Flexible Reality", desc: "Fast ships.", bonus: true},
			random_bonus_1: {title: "Random #1", desc: "Random bonus #1.", bonus: true},
			random_bonus_2: {title: "Random #2", desc: "Random bonus #2.", bonus: true},
			random_bonus_3: {title: "Random #3", desc: "Random bonus #3.", bonus: true},
			// Challenges.
			no_crew: {title: "Lone Star", desc: "Your only crew is You.", bonus: false},  // Spaceballs reference.
			no_money_start: {title: "No Post Code Envy", desc: "Start with no money.", bonus: false},  // Lorde reference.
			no_money: {title: "Drinking Problem", desc: "Not allowed to hold onto money.", bonus: false},
			escape_pod: {title: "Escape Velocity", desc: "Your only ship is an escape pod.", bonus: false},
			pirate: {title: "Pirate's Life", desc: "Plunder. Always plunder.", bonus: false},
			war: {title: "You Are War", desc: "Enough talk. Straight to battle.", bonus: false},  // Nethack reference.
			time_limit: {title: "Tempus Edax Rerum", desc: "Tick, tock, You're on the clock.", bonus: false},
			pacifist: {title: "Pacifist", desc: "Your crew cannot deal damage.", bonus: false},
			no_equipment: {title: "All Organic", desc: "Your crew cannot install any equipment or items.", bonus: false},
			no_sensors: {title: "Flying Blind", desc: "No sensors.", bonus: false},
			no_dream: {title: "Headshot", desc: "The dream doesn't recur.", bonus: false},
			figurehead: {title: "Figurehead", desc: "Born to lead, not to bleed.", bonus: false},
			need_elite: {title: "Elite", desc: "A challenge of days past.", bonus: false},  // Elite reference.
			random_challenge_1: {title: "Random #1", desc: "Random challenge #1.", bonus: false},
			random_challenge_2: {title: "Random #2", desc: "Random challenge #2.", bonus: false},
			random_challenge_3: {title: "Random #3", desc: "Random challenge #3.", bonus: false},
			// Additional conduct ideas:
			//  - Interstellar Hostility: (random) Encounters in space.
		},
		
		// Sensor levels.
		SENSOR_COORDINATES: 1,  // Show absolute coordinates.
		SENSOR_NAMES: 2,  // Show names of systems and planets (and moons and belts).
		SENSOR_NUM_AND_SIZE: 3,  // Show number and size of systems.
		SENSOR_MOON_STRUCTURES: 4,  // Show buildings on planets and asteroids from planet view.
		SENSOR_HAZARD: 5,  // Show planet hazard.
		SENSOR_PLANET_LIFE: 6,  // Show if the planet has life.
		SENSOR_SYSTEM_LIFE: 7,  // Show which planets in system have life.
		SENSOR_RACE_DOMAINS: 8,  // Can see race domains before meeting the race, if found within sensor range.
		SENSOR_SYSTEM_STRUCTURES: 9,  // Show buildings on all planets and asteroids in the system view.
		SENSOR_PLANET_PROPERTIES: 10,  // Planet measures from planet view.
		SENSOR_TEMP: 11,  // Planet temp from planet iew.
		SENSOR_ATMOSPHERE: 12,  // Planet atmosphere from planet view.
		SENSOR_STORM: 13,  // Planet storms from planet view.
		SENSOR_TECTONICS: 14,  // Planet tectonics from planet view.
  };
  SBar.Final.HALF_WIDTH = SBar.Final.WIDTH / 2;
  SBar.Final.HALF_HEIGHT = SBar.Final.HEIGHT / 2;
  SBar.Final.SYSTEM_BACK_SCALE_RATE = SBar.Final.SYSTEM_SCALE_RATE * 100;
  SBar.Final.KNOWN_BLOCK_SIZE = SBar.Final.REGION_SIZE;

  // These can't go in the serialized char data object
	// NOTE to update ResetGlobals().
  SBar.Global = {
    activeTier: null, // tracks current map tier (map, space, system, planet, etc)
    starmap: null, // Singleton starmap tier.
		helm: null, // Singleon helm layer.
    mx: null, // mouse x from center
    my: null, // mouse y from center
    misdown: null, // mouse clicker is down
		mdownx: null, // mouse down x.
		mdowny: null, // mouse down y.
    dirx: null, // move direction x
    diry: null, // move direction y
    mmod: null, // amount of movement, 0 or 1
    sendingHome: false,
		keys_down: KEYSDOWN,
		allow_char_key: true,  // Indicates if the char key ('c') is allowed.
		allow_options_key: true,  // Indicates if the options key ('o') is allowed.
		scalex: 1,  // Amount of x/y scale due to full screen rendering.
		scaley: 1,
		in_battle: false,  // Encounter or battle is active.
		last_system: null,  // Seed for the last system visited, if any (set when exiting).
		image_cache: {},  // Cache of crew and ship images.
		sb_is_ready: false,  // Button utils have been set up.
		allow_browser_leave: true,  // Try to block navigation if the player misclicks forward/back.
		blinking_seed: null,  // Workaround global to check if a bartender can blink.
		travel_renderer: null,
		death_message: null,  // Common place to post how the player died. Bit of a hack to have it here.
		//key_stayed_down: false, // Indicates that the player is holding down a key.
  };
	SBar.ResetGlobals = function() {
		//SG.activeTier = null;
		SG.starmap = null;
		SG.misdown = null;
		SG.mdownx = null;
		SG.mdowny = null;
		SG.mmod = null;
		SG.sendingHome = false;
		SG.keys_down = KEYSDOWN;
		SG.allow_char_key = true;
		SG.allow_options_key = true;
		SG.in_battle = null;
		SG.last_system = null;
		SG.allow_browser_leave = false;
		SG.image_cache = {};
		TG.icons = {};
		TG.icons2 = {};
		TG.controller = null;
		TG.overlay = null;
	};

	// 'S3'. 3D canvases. Note these don't have a 2d context.
	SBar.THREE = {
		three1: null,  // Base 3D layer. Starfield.
		three2: null,  // General 3D layer.
	};
	// 'SC'. Note a lot of code makes assumptions about existence and order of these, change with care.
	// Try to keep it around 3 layers for 2D graphics, for performance and shouldn't really need more.
	// Also note these are actually canvas contexts, not canvases.
	// TIP: SC.<layer>.canvas to get the parent image from an image context.
  SBar.Canvas = {
    // layers. Try to keep it around 5 layers total. Performance seemed bad at 10
		layer0: null, // Helm.
		layer1: null, // active scrolling map and objects on the map
		layer2: null, // Overlay layer for pushed tiers. Needs to be above normal tier layers. hud: coordinates, system and planet details, bar menus.
		layer3: null, //  layer3: buttons for the current layer1. Also overlay messages.
    rightLayer: null, // Separate area, dedicated text area on the right.
  };
  // TODO: remove these and use drawn images.
  SBar.Media = {
    // Ship, enemy
    lleg: null,
    rleg: null,
    // Buttons
    buttGear: null,
    buttShip: null,
    buttX: null,
    buttCheck: null,
    buttQuest: null,
    buttRight: null,
    buttLeft: null,
  };
  for (var obj in SBar.Media) {
    var file = SBar.Media[obj];
    if (file !== null) {
      var img = new Image();
      img.src = file;
      SBar.Media[obj] = img;
    }
  }

  SBar.Engine = function() {

    this.startGame = function() {
      setupCanvas();
			// Every game needs to have a seed. It can be reset.
      Math.seedrandom(new Date());
			// Temp S$ for startup.
			S$ = {game_seed: Math.random()*100};
			if (SF.STATIC_SEED) {
	      Math.seedrandom(0);
				S$ = {game_seed: 0};
			}
//      S$ = new SBar.GameData(Math.random()*100);
			windowResize();
			if (SF.LOAD_TEST_FRAMEWORK) {
				// Need to load the test page first to set up the seed.
	      new SBar.TestPage().activate();
				return;
			}
			var startpage = new SBar.StartPage();
			startpage.activate();
    };

    function setupCanvas() {
			// 3D Starfield
      var three1 = document.createElement('canvas');
      three1.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block;width: '+SF.WIDTH+'px;height: '+SF.HEIGHT+'px;');
      three1.width = SF.WIDTH;
      three1.height = SF.HEIGHT;
			S3.three1 = three1;
      document.getElementById('container').appendChild(three1);

			// 3D above the starfield
      var three2 = document.createElement('canvas');
      three2.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block;width: '+SF.WIDTH+'px;height: '+SF.HEIGHT+'px;');
      three2.width = SF.WIDTH;
      three2.height = SF.HEIGHT;
			S3.three2 = three2;
      document.getElementById('container').appendChild(three2);
			
			// 2D layers.
      for (var obj in SC) {
        var layer = document.createElement('canvas');
				if (obj == "rightLayer") {
					// Right text area.
		      layer.setAttribute('style', 'position:absolute;left:1000px;top:0px;align: center;display: inline-block;width: '+SF.TEXT_WIDTH+'px;height: '+SF.TEXT_HEIGHT+'px;');
		      layer.width = SF.TEXT_WIDTH;
		      layer.height = SF.TEXT_HEIGHT;
				} else {
	        layer.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block;width: '+SF.WIDTH+'px;height: '+SF.HEIGHT+'px;');
	        layer.width = SF.WIDTH;
	        layer.height = SF.HEIGHT;
				}
        document.getElementById('container').appendChild(layer);
        SC[obj] = layer.getContext('2d');
      }
      SB.setContext(SC.layer3);
      SU.buildImages();
			
			// Tact layers aliases. Remove or rename these if desired.
			TC.layer1 = SC.layer1;
			TC.targLayer = SC.layer2;
			TC.hudLayer = SC.layer3;
    }
  };

  // Intercept keys
  SBar.Key = {
    SHIFT_CODE_MODIFIER: 10000,
    CTRL_CODE_MODIFIER: 100000,
		BACKSPACE: 8,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    SPACE: 32,
    PG_UP: 33,
    PG_DOWN: 34,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    PLUS: 43,
    DEL: 46,
    NUM0: 48,
    NUM1: 49,
    NUM2: 50,
    NUM3: 51,
    NUM4: 52,
    NUM5: 53,
    NUM6: 54,
    NUM7: 55,
    NUM8: 56,
    NUM9: 57,
    EQUAL: 61,
    A: 65,
		B: 66,
    C: 67,
    D: 68,
		E: 69,
    F: 70,
		G: 71,
		H: 72,
		I: 73,
    J: 74,
		K: 75,
		L: 76,
    M: 77,
		N: 78,
    O: 79,
    P: 80,
		Q: 81,
    R: 82,
    S: 83,
    T: 84,
		U: 85,
    V: 86,
    W: 87,
    X: 88,
		Y: 89,
		Z: 90,
		COMMAND: 91,
    BACKQUOTE: 192,
		LEFT_BRACKET: 219,
		RIGHT_BRACKET: 221,
    EXCLAIM: 10049,
    ASTERISK: 10056,
    SHIFT0: 10048,
    SHIFT1: 10049,
    SHIFT2: 10050,
    SHIFT3: 10051,
    SHIFT4: 10052,
    SHIFT5: 10053,
    SHIFT6: 10054,
    SHIFT7: 10055,
    SHIFT8: 10056,
    SHIFT9: 10057,
    SHIFTL: 10076,
    SHIFTO: 10079,
    SHIFTP: 10080,
    SHIFTX: 10088,
    F2: 113
  };
  //var ARROWDOWN = 0;
  var keydown = function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
		// Track if any keys have been held down. So the user can add navigation keys.
		var key_already_pressed = false;
		for (var key_down in KEYSDOWN) {
			if (KEYSDOWN[key_down]) {
				key_already_pressed = true;
			}
		}
		//var key_already_pressed = KEYSDOWN[code] === true;
    KEYSDOWN[code] = true;	
    if (code === SBar.Key.SHIFT || code === SBar.Key.CTRL || code === SBar.Key.ALT || code === SBar.Key.COMMAND) {
      return;
    }

    if (e.shiftKey) {
      code += SBar.Key.SHIFT_CODE_MODIFIER;
    } else if (e.ctrlKey || e.metaKey) {
			// metaKey is mac command and sometimes windows window key. Important to block pressing 'r' on a cmd-r page refresh.
      code += SBar.Key.CTRL_CODE_MODIFIER;
    }
		/*
    if (code === SBar.Key.ESC) {
      if (SG.activeTier.type !== SF.TIER_OPTSR && SG.activeTier.type !== SF.TIER_START) {
				SU.PushTier(new SBar.OptionsRenderer());
        return;
      }
    } else*/ if (code === SBar.Key.SHIFTP && SF.ENABLE_SHIFT_DEBUGS) {
      (new SBar.TestPage()).activate();
      return;
    } else if (code === SBar.Key.SHIFTL && SF.ENABLE_SHIFT_DEBUGS) {
			SU.PushTier(new SBar.LoadRenderer());
      return;
    }
		if (code === SBar.Key.O && SG.allow_options_key) {
			if (!SG.activeTier || SG.activeTier.type != SF.TIER_OPTSR) {
				SU.PushTier(new SBar.OptionsRenderer());
			}
			return;
		}
		if (code === SBar.Key.C && SG.allow_char_key) {
			SU.PushTier(new SBar.CharacterRenderer());
			return;
		}

    if (S$ !== null && SG.activeTier !== null) {
      SG.activeTier.handleKey(code, key_already_pressed, e.key);
    }
  };

  var keyup = function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    KEYSDOWN[code] = false;
  };

  var mousedown = function(event) {
//    SB.mDown(event.pageX - SF.MARGIN_LEFT, event.pageY - SF.MARGIN_TOP);
    SB.mDown(SG.mx+SF.HALF_WIDTH, SG.my+SF.HALF_HEIGHT);
    SG.mdownx = SG.mx;
    SG.mdowny = SG.my;
    SG.misdown = true;
  };
  var mouseup = function(event) {
    //var hit = SB.mUp(event.pageX - SF.MARGIN_LEFT, event.pageY - SF.MARGIN_TOP);
		var hit = SB.mUp(SG.mx+SF.HALF_WIDTH, SG.my+SF.HALF_HEIGHT);
    if (!hit) {
      if (SG.activeTier && SG.activeTier.HandleClick) {
				if (SG.mx === null) {
					mousemove(event);  // Force setting the mouse position.
				}
        SG.activeTier.HandleClick(SG.mx, SG.my);
      }
    }
    SG.misdown = false;
  };
  var mousemove = function(event) {
		// These scale the mouse x,y for fullscreen.
    var x = Math.floor((event.pageX - SF.MARGIN_LEFT)/SG.scalex);
    var y = Math.floor((event.pageY - SF.MARGIN_TOP)/SG.scaley);
		var prior_mx = SG.mx;
		var prior_my = SG.my;
    SG.mx = x - SF.HALF_WIDTH;
    SG.my = y - SF.HALF_HEIGHT;
    if (SG.sb_is_ready) { // Buttons maybe not loaded yet
      SB.mMove(x, y);  // Update buttons.
    }
		if ((prior_mx != SG.mx || prior_my != SG.my) && SG.activeTier && SG.activeTier.MouseMove) {
			SG.activeTier.MouseMove(SG.mx, SG.my);
		}
  };
  var windowResize = function(event) {
		SU.ResetScreenResize();
		SU.HandleScreenResize();
		// Try to redraw, to remove blurring.
		if (SG.activeTier && SG.activeTier.renderer && SG.activeTier.renderer.render && SG.activeTier.renderer.teardown) {
			SG.activeTier.renderer.teardown();
			SG.activeTier.renderer.render();
		}
  };
	var wheel = function(event) {
		// Zoom in and zoom out on starmap.
		if (SG.activeTier && (SG.activeTier.type === SF.TIER_STARMAP || SG.activeTier.type === SF.TIER_BIGMAP)) {
			let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
			if (delta < 0) {
				SG.activeTier.handleKey(SBar.Key.Z);
			} else {
				SG.activeTier.handleKey(SBar.Key.I);
			}
		}
	};

  window.addEventListener("keydown", keydown, false);
  window.addEventListener("keyup", keyup, false);
  window.addEventListener("mousedown", mousedown, false);
  window.addEventListener("mouseup", mouseup, false);
  window.addEventListener("mousemove", mousemove, false);
  window.addEventListener('resize', windowResize);
  window.addEventListener("mousewheel", wheel);
  window.addEventListener("DOMMouseScroll", wheel);

  var fullscreenChange = function(event) {
		if (SG.activeTier && SG.activeTier.disable_auto_fullscreen) {
			// The window resize from explicit resize will trigger, so don't trigger here.
			// This function is for when the player uses browser options to go fullscreen.
			SG.activeTier.disable_auto_fullscreen = false;
			return;
		}
		windowResize();
		/*
		//if (SU.IsFullscreen()) {
			SU.ResetScreenResize();
			SU.HandleScreenResize();
			//}// else {
//		}
		*/
  };
  window.addEventListener('mozfullscreenchange', fullscreenChange);
  window.addEventListener('webkitfullscreenchange', fullscreenChange);
  window.addEventListener('fullscreenchange', fullscreenChange);
	var navigateAway = function(event) {
		if (SG.allow_browser_leave || SF.ALLOW_NAVIGATE_AWAY) {
			delete e['returnValue'];
		} else {
			event.preventDefault();
			event.returnValue = '';
		}
	}
	window.addEventListener("beforeunload", navigateAway);
})();

// Global vars
var PIx2 = Math.PI * 2;
var SF = SBar.Final;
var S3 = SBar.THREE;
var SC = SBar.Canvas;
var SM = SBar.Media;
var SG = SBar.Global;
var S$ = null;

// Globals set up during file parsing.
// var SU = SBar.Utils;
// var ST = SBar.Text;
// var SE = SBar.Events;
// var SB = null; // var SB = SBar.Button; done later

// KICKOFF
// Export for Closure Compiler
function startGame() {
  (new SBar.Engine()).startGame();
}
window['SBarStart'] = startGame;

//
// Tact stuff below here. Can merge it in.
//
var JTact = {};
JTact.Final = {  // 'TF.' to access.
    // a lot of the finals can get added here by individual classes
    WIDTH: 1000,
    HEIGHT: 800,
    FOREVER: 99999,
    HEX_SIZE: 12,
    BASE_MOVE: 10, // Base move speed, in hexes per turn.
    ICON_SIZE: 100, // height and width
    DAMAGE_PREFIX: "DAMAGE_", // to indicate using an icon
	  abilityKeyMap: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', 'H', 'J', 'K', 'L'], // ability index maps to key
    MAX_SHOW_TURNS: 2, // max num turns to show on icons
    TOP_SUMMARY_BUF: 0, // extra buffer from the top summary to the top of the window
    SIDEBAR_WIDTH: 0,
    GROUND_SOURCE: "GROUND",
    THREAT_RETARGET_AMOUNT: 1.3, // 130% threat needed to change targets
    // General effect types
    EFFECT_DAMAGE: 100,
    //EFFECT_DAMAGE_MAGICAL: 101,
    EFFECT_GENERIC: 110,
    EFFECT_GENERAL_BUFF: 111,
    EFFECT_GENERAL_DEBUFF: 112,
    EFFECT_CHAR_ACTION: 120,
    EFFECT_CHAR_STATE: 121,
    EFFECT_STASIS: 122,
    EFFECT_HEALTH_MOD: 130,
    EFFECT_SIZE_MOD: 131,
    EFFECT_HEAL: 140,
    EFFECT_DEFEND: 141,
    EFFECT_NORMAL_MOVE: 142,
    EFFECT_GATE_MOVE: 143,
    EFFECT_MOVEMENT_SLOW: 150,
    EFFECT_MOVEMENT_HASTE: 151,
    EFFECT_MOVEMENT_SNARE: 152,
    EFFECT_TERRAIN: 160,
	  MAX_DEATH_TICKS: 2,  // Unconscious up to this point.
};

// NOTE to update ResetGlobals().
JTact.Global = {
    icons: {},
    icons2: {},
    controller: null,  // TactTier.
    overlay: null, // handle to the overlay or null
  	wmd_message: null,  // Stores the last (full) wmd message, if any.
};

var TF = JTact.Final;
var TG = JTact.Global;
var TC = {};

var mod = function(a, n) { // fixed version to work around the javascript modulo bug
    return ((a % n) + n) % n;
};

// need to deal with floating point rounding issues a lot
var round100th = function(val) {
    return Math.round(val * 100) / 100;
};
var round10th = function(val) {
    return Math.round(val * 10) / 10;
};
var round100int = function(val) {
    return Math.round(val / 100) * 100;
};
// Integer rounding with significant digits.
var roundPrecision = function(val, digits) {
	return Math.round(Number.parseFloat(val).toPrecision(digits));
}
// Converts an original coordinate (au, but not really) to a parsec coordinate. 'pctoau'.
var coordToParsec = function(coord) {
	return round10th(coord/400);
};
// Rounds to 2 significant digits, if over 100. Useful as a general integer rounding.
var round2good = function(val) {
	if (val > 100) {
		return roundPrecision(val, 2);
	}
	return Math.round(val);
}
var capLevel = function(level) {
	if (level < 1) return 1;
	return capMaxLevel(level);
}
var capMaxLevel = function(level) {
	return Math.min(level, SF.MAX_LEVEL)
}
var capMorale = function(morale) {
	if (morale < 0) {
		return 0;
	} else if (morale > 100) {
		return 100;
	} else {
		return morale;
	}
}
var capStat = function(stat) {
	if (stat < 1) {
		return 1;
	} else if (stat > 100) {
		return 100;
	} else {
		return stat;
	}
}
let fixColor = function(color) {
	if (color < 0) {
		return 0;
	}
	if (color > 255) {
		return 255;
	}
	return color;
}

