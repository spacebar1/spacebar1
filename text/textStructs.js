(function() {

    SU.addProps(ST, {
        structName: function(singleSeed, type) {
            var name = "";
            name += ST.getWord(singleSeed, singleSeed) + " ";
            switch (type) {
                case SF.TYPE_STRUCT_MINEFIELD:
                    name += ST.randText(ST.minefield1, singleSeed + 17);
                    name += ST.randText(ST.minefield2, singleSeed + 16);
                    break;
                case SF.TYPE_STRUCT_BADLAND:
                    name += ST.randText(ST.badland1, singleSeed + 14);
                    name += ST.randText(ST.badland2, singleSeed + 13);
                    break;
                case SF.TYPE_STRUCT_WALL:
                    name += ST.randText(ST.wall, singleSeed + 15);
                    break;
                case SF.TYPE_STRUCT_BARREN:
                    name += ST.randText(ST.barrenRegion, singleSeed + 12);
                    break;
                case SF.TYPE_STRUCT_BLACKHOLE:
                    name += ST.randText(ST.blackHole, singleSeed + 11);
                    break;
                case SF.TYPE_STRUCT_NEBULA_WORMHOLE:
                case SF.TYPE_STRUCT_NEBULA_STARS:
                case SF.TYPE_STRUCT_NEBULA_MIXED:
                case SF.TYPE_STRUCT_NEBULA_ROCK:
                case SF.TYPE_STRUCT_NEBULA_EMPTY:
                    name += "Nebula";
                    break;
                case SF.TYPE_STRUCT_WORMHOLE:
                    name = this.WormholeName(singleSeed);
                    break;
                default:
                    error("structName bad type: " + type);
            }
            return name;
        },
				WormholeName: function(seed) {
					var name = "";
					for (var i = 0; i < SU.r(seed, 6.1)*3+3; i++) {
						if (SU.r(seed, 7.1+i) < 0.5) {
							name += String.fromCharCode('A'.charCodeAt() + Math.floor(SU.r(seed, 7.2+i)*26));
						} else {
							name += String.fromCharCode('0'.charCodeAt() + Math.floor(SU.r(seed, 7.2+i)*10));
						}
					}
					return name;
				},
				// "Spacey".
				RaceNameOnly: function(seed) {
					return ST.getWord(seed, 1);
				},
				// "The Spacey Empire".
				RaceName: function(seed) {
					if (seed === SF.RACE_SEED_ALPHA) {
						return "?";
					}
					let name = ST.getWord(seed, 1);
					return "The "+name+" "+ ST.randText(ST.race_empire_names, seed + 2);
				},
				race_empire_names: [
					"Union",
					"Faction",
					"Conglomerate",
					"Shogunate",
					"Regency",
					"Confederation",
					"Corporation",
					"Cooperation",
					"Federation",
					"Rebellion",
					"Empire",
					"Federacy",
					"Monarchy",
					"State",
					"Organization",
					"Establishment",
					"Sector",
					"Principality",
					"Area",
					"Autonomy",
					"Administration",
					"Prefecture",
					"Region",
					"Reserve",
					"Territory",
					"Zone",
					"Bloc",
					"Commune",
					"Oblast",
					"Emirate",
					"Authority",
					"Domain",
					"Command",
					"Realm",
					"Sovereignty",
					"Sphere",
					"Field",
					"Expanse",
					"Mandate",
					"Incursion",
					"League",
					"Company",
					"Society",
					"Circle",
					"Coalition",
					"Consortium",
					"Guild",
					"Alliance",
					"Allies",
					"Collaboration",
					"Axis",
					"Core",
					"Sect",
					"Order",
					"Regime",
					"Dominion",
					"Control",
					"Rule",
					"Systems",
					"",  // Name is the entire type (implicit type).
					"",
					"",
					"",
					"",
					"",
				],
        minefield1: [
            "Mine",
            "Hazard",
            "Bomb",
            "Shell",
            "Charge",
            "Hazard",
            "Burst",
            "Sink",
            "Blast",
            "Batter",
            "Strike",
            "Snake",
            "Snapper",
            "Pop",
            "War"
        ],
        minefield2: [
            "pit",
            "field",
            "zone",
            "yard",
            "range",
            "tract",
            "belt"
        ],
        barrenRegion: [
            "Void",
            "Gap",
            "Chasm",
            "Depth",
            "Chasm",
            "Gulf",
            "Split",
            "Divide",
            "Lull",
            "Vacuum",
            "Split",
            "Canyon",
            "Gulch",
            "Expanse",
            "Null",
            "Abyss"
        ],
        blackHole: [
            "Hole",
            "Rift",
            "Anomaly",
            "Singularity",
            "Gravity Well",
            "Gravity Sink",
            "Remanent",
            "Grinder",
            "Breach",
            "Point",
            "Degenerate",
            "Rupture",
            "Tear",
            "Infinite",
            "Break"
        ],
        wall: [
            "Wall",
            "Barrier",
            "Blockade",
            "Fence",
            "Screen",
            "Limit",
            "Border",
            "Brink",
            "Brim",
            "Confine",
            "Edge",
            "Rim",
            "Hurdle",
            "Repulsar",
            "Bound",
            "Boundary",
            "Moat",
            "Blocker",
            "Rampart",
            "Repeller",
            "Fender",
            "Stasis",
            "Impass"
        ],
        badland1: [
            "Briar",
            "Hot",
            "Spark",
            "Fire",
            "Thorn",
            "Wicked",
            "Grim",
            "Cursed",
            "Foul",
            "Vile",
            "Dire",
            "Rough",
            "Tough",
            "Harsh",
            "Bale",
            "Bane",
            "Mal",
            "Burn",
            "Flame",
            "Char",
            "Roast",
            "Sear",
            "Flash",
            "Boil",
            "Bad"
        ],
        badland2: [
            "patch",
            "bed",
            "scape",
            "yard",
            "field",
            "ground",
            "range",
            "tract",
            "stretch",
            "ward",
            "sector",
            "belt",
            "pit",
            "strip",
            "cloud",
            "aura",
            "halo",
            "nimbus",
            "corona",
            "land"
        ]
    });
})();

