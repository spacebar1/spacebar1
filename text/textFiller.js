(function() {

    SU.addProps(ST, {
				BackgroundBase: function(bdata, fail) {
					if (!bdata.parentData || !bdata.parentData.systemData) {
						// Might have been a space fight with no system data.
						return "In the nothingness of space... ";
					}
					
          var seed = bdata.seed;

          var pdata = bdata.parentData; // also belt
          var sdata = pdata.systemData;

          var region = new SBar.RegionData(sdata.x, sdata.y);

          var min = null;
          var closest = null;
          for (var i = 0; i < region.myStructs.length; i++) {
              var struct = region.myStructs[i];
              if (struct.type !== SF.TYPE_STRUCT_WORMHOLE) {
                  var dist = (struct.x - sdata.x) * (struct.x - sdata.x) + (struct.y - sdata.y) * (struct.y - sdata.y); // sqrt for actual
                  if (dist < min || min === null) {
                      closest = struct;
                      min = dist;
                  }
              }
          }
					
          // intro
          var ret = "";

          // struct
          ret += ST.randText(ST.abStruct1, seed + 5.1) + " ";
          ret += ST.randText(ST.abStruct2, seed + 5.2) + " that would be ";
          ret += ST.randText(ST.abStruct3, seed + 5.3) + " ";
          ret += ST.randText(ST.abStruct4, seed + 5.4) + " ";
          ret += closest.name + ", ";
          region.teardown();
          delete region;
					if (fail) {
	          ret += ST.randText(ST.abFail1, seed + 5.6) + ". ";
	          ret += ST.randText(ST.abFail2, seed + 5.7) + ". ";
	          ret += ST.randText(ST.abFail3, seed + 4, 1) + "! ";
					} else {
	          ret += ST.randText(ST.abStruct5, seed + 5.6) + ". ";
	          ret += ST.randText(ST.abRest1, seed + 5.7) + ". ";
	          ret += ST.randText(ST.abRelief, seed + 4, 1) + "! ";
					}

          // path
          ret += "You " + ST.randText(ST.abJourney0, seed + 5.8) + " through the " + ST.randText(ST.abJourney1, seed + 5.8) + " of the " + sdata.name;
          ret += " and the " + ST.randText(ST.abJourney1, seed + 5.9) + " of " + pdata.name;
					if (bdata.name[1] && bdata.name[1] != "") {
	          ret += " to the " + ST.randText(ST.abJourney1, seed + 6.0) + " of " + bdata.name[0] + " " + bdata.name[1] + ". ";
					} else {
	          ret += " to the " + ST.randText(ST.abJourney1, seed + 6.0) + " of " + bdata.name[0] + ". ";
					}
					return ret;
				},
        artiBackground: function(bdata, arti_skill) {
            var desc = arti_skill.desc;
            var seed = bdata.seed;
						let ret = this.BackgroundBase(bdata);

            // treasure
            ret += ST.randText(ST.abFought0, seed + 6.0) + " you " + ST.randText(ST.abFought1, seed + 6.1) + " the " + ST.randText(ST.abFought2, seed + 6.2) + " " + ST.randText(ST.abFought3, seed + 6.3);
            ret += " to claim your " + ST.randText(ST.abFought4, seed + 6.4) + ". ";

            // Alpha
            if (arti_skill.type === SF.SKILL_ALPHA) {
                ret += "It is a blocky device, with curiously shifting colors and rotating symbols. ";
            }

            // Get
            ret += "You " + ST.randText(ST.abGrasp1, seed + 6.5) + " " + ST.randText(ST.abGrasp1b, seed + 6.55) + ", and it " + ST.randText(ST.abGrasp2, seed + 6.5) + ". ";
            ret += "As " + ST.randText(ST.abGrasp1b, seed + 6.65) + " merges with your equipment, " + ST.randText(ST.abEnter0, seed + 6.77) + " thought " + ST.randText(ST.abEnter1, seed + 6.8) + ":\n\n";
            ret += arti_skill.name+": "+desc;

            return ret;

        },
				// Like arti background, but just money as a reward.
        moneyBackground: function(bdata) {
            var seed = bdata.seed;
						let ret = this.BackgroundBase(bdata);

            // treasure
            ret += ST.randText(ST.abFought0, seed + 6.0) + " you " + ST.randText(ST.abFought1, seed + 6.1) + " the " + ST.randText(ST.abFought2, seed + 6.2) + " " + ST.randText(ST.abFought3, seed + 6.3);
            ret += " to claim your " + ST.randText(ST.abFought4, seed + 6.4) + ". ";
            return ret;

        },				
        DefeatBackground: function(bdata) {
					let ret = "";
					if (!bdata || !bdata.seed) {
						ret = "In the cold depths of space you no longer sorrow over those who last heard your scream."
					} else {
	          var seed = bdata.seed;
						ret = this.BackgroundBase(bdata, /*fail=*/true);
	          ret += ST.randText(ST.abFail4, seed + 4.13, 1) + ".";
					}
					// See You Space Cowboy...
					ret += "\n\nAnd at last, as your existence fades away, you have one final thought of your friend and all that could have been..."
					return ret;
				},
				
				BattleName: function(seed, attacking, place_name) {
					if (!place_name) {
						// place_name could be undefined.
						place_name = ST.randText(ST.battlePlace1, seed + 21.1) + " " + ST.randText(ST.battlePlace1, seed + 21.1);
					} else if (Array.isArray(place_name)) {
						place_name = place_name[0] + " " + place_name[1]; // Parts of building name.
					}
					// The Granest Ambush at ...
					let name = "The ";
					if (SU.r(seed, 21.44) < 0.5) {
						name += ST.randText(ST.battleAdjPre, seed + 21.2) + ST.randText(ST.battleMain, seed + 21.4).toLowerCase();
					} else {
						name += ST.randText(ST.battleMain, seed + 21.5) + ST.randText(ST.battleAdjPost, seed + 21.3);
					}
//name += ST.randText(ST.battleAdjPre, seed + 21.2) + ST.randText(ST.battleMain, seed + 21.5).toLowerCase() + ST.randText(ST.battleAdjPost, seed + 21.3);
					name += " at " + place_name;
					return name;
				},
        battlePlace1: [
            "Unknown",
            "Furious",
            "Forgotten",
            "Dieing",
            "Dueling",
            "Angry",
            "Open",
            "Blighted",
            "Lost",
            "Free",
            "Last",
        ],
        battlePlace2: [
            "Tomb",
            "Void",
            "Stone",
            "Run",
            "Land",
            "River",
            "Harbor",
            "Creek",
            "House",
            "Mill",
            "Road",
            "Hill",
            "Wood",
            "Bluff",
            "Bay",
            "Springs",
            "Grove",
        ],
        battleAdjPre: [
            "A",
            "Ab",
            "Ante",
            "Be",
            "Com",
            "Contra",
            "Counter",
            "De",
            "Dis",
            "Ex",
            "Extra",
            "Hemi",
            "In",
            "Inter",
            "Out",
            "Over",
            "Pro",
            "Re",
            "Semi",
            "Trans",
            "Ultra",
            "Un",
            "Acro",
            "Allo",
            "Alter",
            "Anti",
            "Auto",
            "Bi",
            "Di",
            "Dys",
            "Epi",
            "Fore",
            "Hyper",
            "Hypo",
            "Ig",
            "Il",
            "Im",
            "Intra",
            "Ir",
            "Mal",
            "Meso",
            "Mid",
            "Mis",
            "Mono",
            "Multi",
            "Non",
            "Octo",
            "Pan",
            "Penta",
            "Per",
            "Peri",
            "Poly",
            "Post",
            "Pre",
            "Proto",
            "Quasi",
            "Sub",
            "Supra",
            "Tri",
            "Up",
            "Xeno",
					  "Bos",
					  "New",
					"Dis",
					"Syn",
					"Uber",
					"Quad",
					"Quint",
					"Great",
        ],
        battleMain: [
            "Symmetric",
            "Ego",
            "Wait",
            "Aerobic",
            "Bellum",
            "Mobile",
            "Operation",
            "Active",
            "Appear",
            "Function",
            "Legal",
            "Regular",
            "Data",
            "Normal",
            "Strange",
            "Zero",
            "Partite",
            "Fold",
            "Faced",
					  "Cost",
					  "Game",
            "Massacre",
            "Piracy",
            "Hijack",
            "Theft",
            "Robbery",
            "Heist",
            "Holdup",
            "Looting",
            "Mugging",
            "Assault",
            "Attack",
            "Aggression",
            "Charge",
            "Incursion",
            "Invasion",
            "Offensive",
            "Slaughter",
            "Raid",
            "Strike",
            "Abuse",
            "Seizure",
            "Ambush",
            "Trap",
            "Waylay",
            "Lurkers",
            "Deception",
            "Bait",
            "Ploy",
            "Catch",
            "Agress",
            "Advance",
            "Assail",
            "Surprise",
            "Snare",
            "Trick",
            "Pounce",
            "Toy",
            "Consider",
            "Guess",
            "Project",
            "Vision",
            "Reflection",
            "Echo",
            "Follow",
            "Reverse",
            "Catch",
            "Copy",
            "Effect",
            "Effort",
            "Return",
            "Muse",
            "Gambit",
            "Device",
            "Jig",
            "Play",
            "Ploy",
            "Ruse",
            "Scheme",
            "Tactic",
            "Dodge",
            "Feint",
            "Move",
            "Bluff",
            "Cheat",
            "Snare",
            "Strategy",
					  "Stone",
					  "Trust",
					  "Position",
					  "Weeping",
					  "Coming",
					  "Sorry",
					  "Lamb",
					  "Wall",
					  "Brick",
					  "Time",
					  "Speech",
					  "Price",
					  "End",
					  "Take",
					  "Life",
					  "Night",
					  "Dream",
					  "Keep",
					  "Repeat",
					  "Fall",
					  "World",
					  "Mind",
					  "Eye",
					  "Fire",
					  "Stairs",
					  "Rock",
					  "Moon",
					  "Fly",
					  "Give",
					  "Bad",
					  "Dark",
					  "Shake",
					  "Alone",
					  "Stop",
					  "Pain",
					  "Hold",
					  "Limit",
					  "Border",
					  "Ice",
					  "Trial",
					  "Hope",
					  "History",
					  "Art",
					  "Map",
					  "System",
					  "Method",
					  "Theory",
					  "Control",
					  "Fact",
					  "Area",
					  "Idea",
					  "Policy",
					  "Paper",
					  "Truth",
					  "Goal",
					  "Lonely",
					  "Road",
					  "Path",
					  "Moment",
					  "Event",
					  "Flight",
					  "Find",
					  "Lake",
					  "Blood",
					  "Depth",
					  "Studio",
					  "Study",
					  "Debt",
					  "Drink",
					  "Loss",
					  "Entry",
					  "Region",
					  "Delivery",
					  "Tense",
					  "Ruin",
					  "Noise",
					  "Song",
					  "Mud",
					  "Gate",
					  "Hall",
					  "Warn",
					  "Error",
					  "Affair",
					  "Dirt",
					  "Land",
					  "Hat",
					  "Work",
					  "Form",
					  "Place",
					  "Number",
					  "Part",
					  "Field",
					  "Job",
					  "State",
					  "Course",
					  "Trade",
					  "Line",
					  "Risk",
					  "Light",
					  "Test",
					  "Future",
					  "Cause",
					  "Side",
					  "Chance",
					  "Salt",
					  "Act",
					  "War",
					  "Cycle",
					  "Wind",
					  "Sign",
					  "Task",
					  "Rain",
					  "Trouble",
					  "Club",
					  "Factor",
					  "Gear",
					  "Wave",
					  "Will",
					  "Change",
					  "Natural",
					  "Check",
					  "Guard",
					  "Drive",
					  "Worry",
					  "Main",
					  "Stand",
					  "Lane",
					  "Worth",
					  "Post",
					  "Note",
					"Sight",
					"Spring",
					"Box",
					"Step",
					"Leaf",
					"Sock",
					"Bag",
					"Shot",
					"Roar",
					"Call",
					"Make",
					"Hoy",
					"Look",
					"Sphere",
					"Line",
					"Green",
					"Nine",
					"Only",
					"Solo",
					"Rag",
					"Hall",
					"Blue",
					"Star",
					"Sky",
					"Plain",
					"Rage",
					"Like",
					"Peace",
					"Final",
					"Stage",
					],				
	        battleAdjPost: [
						  "able",
						  "ac",
						  "acity",
						  "ade",
						  "age",
						  "aholic",
						  "fly",
						  "al",
						  "algia",
						  "an",
						  "ance",
						  "ant",
						  "ar",
						  "ard",
						  "arium",
						  "ation",
						  "cide",
						  "cracy",
						  "cule",
						  "cy",
						  "crat",
						  "dom",
						  "dox",
						  "ed",
						  "ee",
						  "eer",
						  "en",
						  "ence",
						  "ent",
						  "er",
						  "ern",
						  "escence",
						  "ese",
						  "esque",
						  "ess",
						  "est",
						  "etic",
						  "ette",
						  "ful",
						  "fy",
						  "ial",
						  "ian",
						  "iasis",
						  "iatric",
						  "ible",
						  "ile",
						  "ily",
						  "ine",
						  "ing",
						  "ious",
						  "ish",
						  "ism",
						  "ist",
						  "ite",
						  "itis",
						  "ity",
						  "ive",
						  "ization",
						  "ize",
						  "less",
						  "ling",
						  "ly",
						  "ment",
						  "ness",
						  "oid",
						  "ology",
						  "opsy",
						  "or",
						  "ory",
						  "ous",
						  "phobia",
						  "phyte",
						  "sect",
						  "ship",
						  "sion",
						  "some",
						  "sophy",
						  "th",
						  "tion",
						  "trpohy",
						  "tude",
						  "ty",
						  "ular",
						  "uous",
						  "ure",
						  "ward",
						  "ware",
						  "wise",
						  "y",
	            "sight",
	            "agon",
	            "norant",
	            "plex",
	            "nym",
	            "stop",
	            "pole",
						  "foy",
						  "kid",
						"i",
						"bet",
						"belt",
						"boon",
						"ic",
						"on",
						"up",
	        ],															
        abRelief: [
            "Finally",
            "Alas",
            "Whew",
            "Wow",
            "Horray",
            "Egad",
            "Horray",
            "Hurrah",
            "Jeepers",
            "Phew",
            "Thank Goodness"
        ],
        abFail3: [
            "Sigh",
            "Rage",
            "Fail",
            "Misery",
            "Sorry",
            "Loss",
        ],
        abStruct1: [
            "In",
            "Across",
            "On",
            "Over",
            "Opposite",
            "Beyond",
            "Against",
            "Facing",
            "Away from",
            "Near",
            "Around"
        ],
        abStruct2: [
            "a void of space",
            "emptiness",
            "space",
            "a region",
            "the edge",
            "a place",
            "a hole",
            "a barren field",
            "desolation",
            "an expanse",
            "a tract",
            "a sector",
            "a place",
            "the realm",
            "a sphere",
            "a stretch",
            "a territory"
        ],
        abStruct3: [
            "generally unknown",
            "in the middle of nowhere",
            "completely unknown",
            "barely known",
            "long since forgotten",
            "yet unexplored",
            "not worth visiting",
            "entirely unremarkable",
            "vast and desolate",
            "forgettable and hostile",
            "nameless and bland",
            "stark against the stars",
            "abandoned to civilization",
            "unadorned by the starcharts",
            "completely omitted"
        ],
        abStruct4: [
            "if not for its proximity to the",
            "if not for its closeness to the",
            "if not marked by the nearby",
            "except for the nearby",
            "save for the nearby",
            "excepting the nearby",
            "save for the famous"
        ],
        abStruct5: [
            "you finally found it",
            "you can relax",
            "the journey is over",
            "the end is in sight"
        ],
        abFail1: [
            "it is over",
            "you can relax eternally",
            "your great pain has come to an end",
            "you finally see the light",
            "your suffering is over",
            "you release a final whisper",
        ],
        abRest1: [
            "Relax",
            "Rest now",
            "Chill",
            "It is time to unwind",
            "Let yourself cool off",
            "Breathe easy",
            "Sit back",
            "Don't worry",
            "No worries",
            "Calm washes over",
            "Loosen up",
            "Take a load off"
        ],
        abFail2: [
            "Rest now",
            "Let go",
            "Be still",
            "Calm overwhelms you",
        ],
        abJourney0: [
            "journeyed",
            "flew",
            "voyaged",
            "traveled",
            "trekked",
            "wandered",
            "passed",
            "toured",
            "rode",
            "sailed"
        ],
        abJourney1: [
            "bridges",
            "sights",
            "sounds",
            "smells",
            "gateway",
            "home",
            "portal",
            "pylon",
            "locale",
            "island",
            "bosom",
            "address",
            "edge",
            "border",
            "relief",
            "dwelling",
            "location",
            "spot",
            "area",
            "site",
            "region",
            "section",
            "position",
            "locus",
            "way",
            "depths",
            "pit",
            "remoteness",
            "chasm",
            "abyss",
            "fissure",
            "gulf",
            "void",
            "brink",
            "edge",
            "remote",
            "terminus",
            "brim",
            "end"
        ],
        abFought0: [
            "Merrily",
            "Underhandedly",
            "Naturally",
            "Casually",
            "Easily",
            "Painfully",
            "Firmly"
        ],
        abFought1: [
            "fought",
            "vanquished",
            "overcame",
            "conquered",
            "crushed",
            "survived",
            "bested",
            "mastered",
            "outlived",
            "subdued",
            "overwhelmed",
            "outplayed",
            "outrivaled",
            "triumphed over",
            "clobbered"
        ],
        abFought2: [
            "wild",
            "hostile",
            "nasty",
            "untamed",
            "vicious",
            "unbroken",
            "brutish",
            "feral",
            "barbaric",
            "brutal",
            "cruel",
            "inhuman",
            "merciless",
            "primitive"
        ],
        abFought3: [
            "natives",
            "minions",
            "locals",
            "monsters",
            "beasts",
            "devils",
            "freaks",
            "villains",
            "brutes",
            "fiends",
            "ruffians",
            "troglodytes",
            "animals",
            "swine"
        ],
        abFought4: [
            "treasure",
            "prize",
            "winnings",
            "bounty",
            "crown",
            "medal",
            "gold",
            "purse",
            "reward",
            "cake",
            "trophy",
            "gravy",
            "loot",
            "spoils"
        ],
        abGrasp1: [
            "grasp for",
            "reach out",
            "hold high",
            "laugh manically at",
            "cry a bit in",
            "throw your sack over",
            "test the heft of",
            "drop",
            "cover"
        ],
        abGrasp1b: [
            "the glow",
            "its form",
            "its shine",
            "the motion",
            "the treature",
            "the mystery",
            "the oddity",
            "the artifact",
            "the object",
            "its splendor",
            "it magically",
            "its presence"
        ],
        abGrasp2: [
            "recoils",
            "shudders",
            "screams",
            "laughs back",
            "spins",
            "jumps",
            "whistles",
            "shreaks",
            "rotates",
            "turns",
            "blinks",
            "sighs"
        ],
        abEnter0: [
            "an alien",
            "an unwelcome",
            "a foreign",
            "an odd",
            "an unfamiliar",
            "an unusual",
            "an eerily mellow"
        ],
        abEnter1: [
            "enters your mind",
            "slips into shadow",
            "penetrates your mind",
            "comes uninvited",
            "overwhelms you",
            "arrives from nowhere",
            "dominates the room",
            "crosses into perception",
            "emerges uninvited",
            "rises from its presence",
            "hammers in from all directions",
            "laughs angrily",
            "compels you",
            "shouts mockingly",
            "whispers sarcastically",
            "speaks to you",
            "screams silently"
        ],
				abFail4: [
            "But it was not meant to be",
            "In this edge of the universe you met your match",
            "The shock of how it happened had no time to set in",
            "An abrupt end to your journey",
				],
        qPirate1: [
            "Here's the target",
            "Do this",
            "Your orders",
            "You've been commanded",
            "The Godfather asks for a favor",
            "The mob is forming",
            "The gang is assembling",
            "Her Majesty's command",
            "Our will",
            "Pirate's code",
            "Follow this",
            "Off with you",
            "The syndicate sends this",
            "Join the horde",
            "From the cartel",
            "Be a team player",
            "Union chief says",
            "Pyramid scheme",
            "It's a racket",
            "Be a good felon",
            "Welcome to the Mafia",
            "If you want to move up",
					  "Time fo the hit",
        ],
        qPirate2: [
            "My reasons are my own",
            "Don't ask questions",
            "Now go away",
            "Be quick",
            "Bye",
            "Don't come back",
            "Like I care",
            "Don't argue",
            "Get out",
            "Punk",
            "Idiot",
            "Fool",
            "Loser",
            "Crybaby",
            "Underling",
            "Dead men don't talk"
        ],
        questBackground: function(qdata, seed, bdata, money_run) {
            if (bdata.faction === SF.FACTION_PIRATE) {
                return ST.randText(ST.qPirate1, seed++) + ". " + ST.randText(ST.qPirate2, seed++) + ".";
                //return "Here's the target. My reasons are my own.";
            }

            // getMidStruct
            var x1 = qdata.stx;
            var y1 = qdata.sty;
            var x2 = bdata.parentData.systemData.x;
            var y2 = bdata.parentData.systemData.y;
            var mx = (x1 + x2) / 2;
            var my = (y1 + y2) / 2;
            var region = new SBar.RegionData(mx, my);

            var min = null;
            var closest = null;
            for (var i = 0; i < region.myStructs.length; i++) {
                var struct = region.myStructs[i];
                if (struct.type !== SF.TYPE_STRUCT_WORMHOLE) {
                    var dist = (struct.x - mx) * (struct.x - mx) + (struct.y - my) * (struct.y - my); // sqrt for actual
                    if (dist < min || min === null) {
                        closest = struct;
                        min = dist;
                    }
                }
            }
            S$.addKnownStructure(closest.x, closest.y, closest);

            var ret = "";

            /*
             var num = Math.floor(SU.r(seed, 4.44) * 2) + 2;
             for (var i = 0; i < num; i++) {
             ret += ST.qMisc(seed++) + " ";
             }
             ret += ST.randText(ST.qQuest0, seed++) + ", " + ST.randText(ST.qQuest1, seed++) + " " + qdata.target.name[0] + " " + qdata.target.name[1] + ". ";
             num = 2;
             for (var i = 0; i < num; i++) {
             ret += ST.qMisc(seed++) + " ";
             }
             ret += ST.randText(ST.qQuestEnd1, seed++) + " and " + ST.randText(ST.qQuestEnd2, seed++) + ". ";
             num = Math.floor(SU.r(seed, 4.64) * 2) + 2;
             for (var i = 0; i < num; i++) {
             ret += ST.qMisc(seed++) + " ";
             }
             */

            // mix up the sentences
            var mix = [];
            for (var i = 0; i < 5; i++) {
                mix.push(0);
            }
            mix.push(1);
            mix.push(2);
            mix.push(3);
            var order = SU.randomOrder(mix, seed++);
            for (var i = 0; i < mix.length; i++) {
                switch (mix[order[i]]) {
                    case 0:
                        // general chatter
                        ret += ST.qMisc(seed++) + " ";
                        break;
                    case 1:
                        // quest target
                        ret += ST.randText(ST.qQuest0, seed++) + ", " + ST.randText(ST.qQuest1, seed++) + " " + qdata.target.name[0] + " " + qdata.target.name[1] + ". ";
                        break;
                    case 2:
                        // data sent
                        ret += ST.randText(ST.qQuestEnd1, seed++) + ". " + ST.randText(ST.qQuestEnd2, seed++) + ". ";
                        break;
                    case 3:
                        ret += ST.randText(ST.qQuestStruct1, seed++) + " the " + closest.name + ". ";
                        break;
                }
            }

            closest = null;
            region.teardown();
            delete region;
						if (money_run) {
							ret += "It's a delivery. Basic."
						} else {
							ret += "Basically it's a delivery. With potential complications."
						}

            return ret;
        },
        qMisc: function(seed) {
            var ret = ST.randText(ST.qMisc1, seed);
            var last = ret[ret.length - 1];
            if (last !== '.' && last !== '?' && last !== '!') {
                return ret + ".";
            }
            return ret;
        },
        // add a period if not already . or ? or ! at the end
        qMisc1: [
            "Ahem?",
            "Yes...",
            "Well...",
            "Well well well...",
            "The cat dragged it in",
            "Let me see...",
            "I recall...",
            "Why a favor?",
            "Some things are for me to know",
            "I'm not asking for much",
            "I won't ask for much",
            "Why do you do this?",
            "Let me consider",
            "Maybe because you don't know what you don't know, you know?",
            "I'm thinking that people like us should know better",
            "I'm thinking...",
            "Then I lost some weight",
            "What can I say?",
            "I find everybody has a price",
            "That's what they said to me, at least",
            "I wouldn't want to hear it either",
            "Do some people think they know better?",
            "I ask you",
            "Tell me how it is",
            "Forget it, it was rhetorical",
            "Maybe Mandelbrot could tell us",
            "Who could say?",
            "I wonder, are you listening?",
            "I heard them laughing",
            "I'll tell you the story",
            "Stay awhile and listen",
            "It all goes back to the day",
            "But when I was a kid, we had to fly both ways, uphill, in the snow",
            "And then I said, 'yuck'",
            "And they just go on and on, babble rabble you know...",
            "I'll say it again",
            "You remind me of a small fry",
            "Do you look up to me?",
            "Look around and ask yourself",
            "If you can help me out...",
            "Are you sure you know what you're looking for?",
            "All right, here you go, if this makes sense",
            "I'm not so sure of the details",
            "Oh, I remember clearly now",
            "Just a moment, I'll be right back",
            "Turns out it was common sense",
            "Just think about it for awhile",
            "Then I realized everything complicated is simple once I understand it",
            "But when you get down to it, why does it matter?",
            "Better to work with those who work without, I find",
            "It could be a piece of cake",
            "I won't ask for an arm or a leg or a tentacle",
            "But it all seemed alien to me",
            "I don't want to burst your bubble, so I won't",
            "Keep listening, we can get closer to the goal",
            "Together, we can work together",
            "Hmmm...",
            "What do you think?",
            "How does it sound?",
            "I forgot what I was saying",
            "Where was I going with that?",
            "What were you saying?",
            "Oh, you were saying that?",
            "You thought so too?",
            "I can tell you we were thinking the same thing",
            "Oh, yes",
            "Yes, yes",
            "I remember how to remember, but not what to remember",
            "Ah yes... ah yes",
            "Ha ha ha.. uh?",
            "It's funny",
            "Is it funny?",
            "And then I forgot",
            "Does your face hurt?",
            "I suppose everything that happens will happen",
            "I mean, nevermind...",
            "To be frank...",
            "Honestly...",
            "Just sayin'...",
            "Beware",
            "It follows naturally...",
            "Sorta like a mad hatter",
            "Gosh, it's been awhile",
            "Be warned",
            "Goovy",
            "I'll need my boomstick",
            "Don't say I didn't warn you",
            "Heed my words",
            "Heed my advice",
            "Same difference to me, to us, really",
            "But those of you who know me know I mean no disrespect",
            "I think it relates to hump day?",
            "Yeah, no. Not no, but yeah...",
            "So I said, 'give it one hundred and ten percent'",
            "I thought, 'careful biting the bullet, it might bite back'",
            "Let's break the ice, if you know what I mean",
            "I think I heard it from a friend who heard it from a sorta friend",
            "To predict the future we must think about it",
            "But be careful, you could lose yourself in this",
            "I'll be fine, you can do what you love",
            "Stop interrupting me",
            "Time flies like banana",
            "I'm confused",
            "I hear the best revenge is to live well",
            "But if you know your weakness, you won't sharpen your strengths",
            "And do your best, I know you might",
            "So be prepared, or prepare to be so so",
            "I find Knowing is half the battle",
            "Really, mediocrity would be perfect here",
            "So life is about the giving and the getting",
            "I always try to be a blob of value",
            "I Knocked on wood then titanium then adamantium",
            "I heard war is an accidental art, but not here",
            "I guess this is what happens from too much drink",
            "I'm not sure why people think art and philosophy can be meaningful",
            "Be forewarned...",
            "Now let's discuss...",
            "You might wish I'd say 'as you wish'",
            "I stood on shoulders of giants, and all that",
            "It's the real deal",
            "I speak the truth",
            "Think about it",
            "So be or don't be, just don't be here in the morning",
            "Yeah, surely you can call me Shirley",
            "I'll thank you very little",
            "That reminds me I was married once to someone that looked like you",
            "I find if you don't have your health, you don't have anything",
            "Keep looking at me like that and I'll get you the crazy pills",
            "People like you should know to know thyself",
            "It's like the man on the grassy knoll",
            "I'll introduce you to someone you can call Squishy",
            "Yet vegetables are poison, if you ask me",
            "It's because all my food comes in pill form",
            "I'd recommend a drink for the road",
            "Or I'd recommend a road for the drink",
            "It's kind of a big deal",
            "Maybe it has something to do with a dingo",
            "You get the idea",
            "It's no longer a mystery",
            "Things are not always as they seem",
            "I worry about exploding stars",
            "If our star doesn't explode first",
            "But...",
            "Okay...",
            "I guess...",
            "Have I told you this before?",
            "Stop me if you've heard this",
            "There are rumors going around",
            "My neighbors have been talking",
            "Your arrival is an omen",
            "You arrived just in time",
            "Ummm...",
            "Errr...",
            "On the other hand...",
            "Stop interrupting",
            "Continuing on...",
            "It's all games in the end",
            "Yada yada yada",
            "Let's reflect"
        ],
        qQuest0: [
            "Here's the scoop",
            "Here's the deal",
            "Listen closely",
            "Get ready",
            "Be alert",
            "Here we go",
            "Know your goal",
            "Do me a favor",
            "This is what I ask",
            "I need this",
            "Help me out",
            "Be a pal",
            "Accept my task",
            "Take note",
            "Harken",
            "Receive my task",
            "Be all ears",
            "Mark my words",
            "Take heed",
            "Give me your ear",
            "Consider my request",
            "Mind my words"
        ],
        qQuest1: [
            "take a look at",
            "journey to",
            "arrive at",
            "the task is",
            "go to",
            "visit",
            "call upon",
            "stopover at",
            "stop by",
            "swing by",
            "pay a visit to",
            "call on",
            "inspect",
            "tour",
            "chat at",
            "bust in",
            "enter",
            "show up at",
            "drop by",
            "meet",
            "see",
            "contact",
            "approach",
            "saddle"
        ],
        qQuestEnd1: [
            "I'll send the details",
            "Here are the charts",
            "Here's the data",
            "Uplink established",
            "Take my details",
            "You got the numbers",
            "Go with these plans",
            "Take my map",
            "Follow this",
            "Watch your back",
            "Help me out"
        ],
        qQuestEnd2: [
            "I'll make it worth your while",
            "The money's in the bag",
            "Cash on the nail",
            "You'll do well for it",
            "I pay well",
            "It's good for you"
        ],
        qQuestStruct1: [
            "Look out past",
            "It's beyond",
            "It's well beyond",
            "Try to cross",
            "Go past",
            "Go out beyond",
            "Look through",
            "Cross over",
            "Traverse",
            "Sail around",
            "Voyage beyond",
            "Trek past",
            "Bridge",
            "Navigate",
            "Pass through",
            "You could cut across"
        ]

    });
})();


