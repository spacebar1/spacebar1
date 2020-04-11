(function() {
	/*
	
	let BUILDING_SYMBOLS = null;
	DefineBuildingSymbols = function() {
		BUILDING_SYMBOLS = {};
		BUILDING_SYMBOLS[SF.TYPE_BAR] = "☕";
		BUILDING_SYMBOLS[SF.TYPE_TEMPLE_BAR] = "☕";
		BUILDING_SYMBOLS[SF.TYPE_TEMPLE] = "☥";
		BUILDING_SYMBOLS[SF.TYPE_MINING] = "⚒";
		BUILDING_SYMBOLS[SF.TYPE_CITY_ARTI] = "⚖1";
		BUILDING_SYMBOLS[SF.TYPE_CITY_ORE] = "⚖2";
		BUILDING_SYMBOLS[SF.TYPE_CITY_GOODS] = "⚖3";
		BUILDING_SYMBOLS[SF.TYPE_CITY_CONTRA] = "⚖4";
		BUILDING_SYMBOLS[SF.TYPE_CITY_ALL] = "⚖5";
		BUILDING_SYMBOLS[SF.TYPE_CITY_SPECIAL] = "⚖6";
		BUILDING_SYMBOLS[SF.TYPE_CITY_SHIP] = "⚖7";
		BUILDING_SYMBOLS[SF.TYPE_COLONY] = "♜";
		BUILDING_SYMBOLS[SF.TYPE_LAB] = "⚛"; // ✄
		BUILDING_SYMBOLS[SF.TYPE_ARMORY] = "⚔";
		BUILDING_SYMBOLS[SF.TYPE_HOTEL] = "⌂";
		BUILDING_SYMBOLS[SF.TYPE_OBSERVATORY] = "🛰";
		BUILDING_SYMBOLS[SF.TYPE_JOB] = "☏";
		BUILDING_SYMBOLS[SF.TYPE_SHIPYARD] = "H";//"🚀";
		BUILDING_SYMBOLS[SF.TYPE_DERELICT] = "☬";
		BUILDING_SYMBOLS[SF.TYPE_INFORMATION] = "ⓘ";
		BUILDING_SYMBOLS[SF.TYPE_ANIMAL] = "3";
		BUILDING_SYMBOLS[SF.TYPE_GOODY_HUT] = "";
		BUILDING_SYMBOLS[SF.TYPE_CONSTRUCTION] = "🏗️";
		BUILDING_SYMBOLS[SF.TYPE_ARENA] = "🏟️";
		BUILDING_SYMBOLS[SF.TYPE_OBELISK] = "☖";
		BUILDING_SYMBOLS[SF.TYPE_UNIVERSITY] = "🏫";
		BUILDING_SYMBOLS[SF.TYPE_ALPHA_BARRACKS] = "🏯";
		BUILDING_SYMBOLS[SF.TYPE_ALPHA_AIRPORT] = "✈";
		BUILDING_SYMBOLS[SF.TYPE_ALPHA_HQ] = "☥";
		BUILDING_SYMBOLS[SF.TYPE_ALPHA_DANCE] = "✨";
		BUILDING_SYMBOLS[SF.TYPE_CORNFIELD] = "🌽";
	};
		*/

    SU.addProps(ST, {
			/*
			BuildingSymbol: function(type) {
				if (!BUILDING_SYMBOLS) {
					DefineBuildingSymbols();
				}
				return BUILDING_SYMBOLS[type];
			},
			*/
			
        buildingName: function(type, languageSeed, seed) {
            switch (type) {
                case SF.TYPE_BAR:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.bar1, seed + 30) + " " + ST.randText(ST.bar2, seed + 31)];
                    break;
                case SF.TYPE_TEMPLE_BAR:
                    return [ST.getWord(languageSeed, seed) + "'s " + ST.randText(ST.templeBar1, seed + 32), ST.randText(ST.bar1, seed + 33) + " " + ST.randText(ST.bar2, seed + 34)];
                    break;
                case SF.TYPE_TEMPLE:
                    return ["The Mysterious", ST.getAlphaWord(seed)];
                    break;
                case SF.TYPE_MINING:
                    return [ST.randText(ST.mine1, seed + 35), ST.getWord(languageSeed, seed)];
                    break;
				        case SF.TYPE_CITY_ARTI:
				        case SF.TYPE_CITY_ORE:
				        case SF.TYPE_CITY_GOODS:
				        case SF.TYPE_CITY_CONTRA:
				        case SF.TYPE_CITY_ALL:
				        case SF.TYPE_CITY_SPECIAL:
				        case SF.TYPE_CITY_SHIP:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.tradepost1, seed + 36)];
                    break;
                case SF.TYPE_COLONY:
                    return [ST.randText(ST.colony1, seed + 37), ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_ARMORY:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.armory1, seed + 38)];
                    break;
                case SF.TYPE_LAB:
                    return [ST.randText(ST.lab1, seed + 39), ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_HOTEL:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.hotel, seed + 40)];
                    break;
                case SF.TYPE_OBSERVATORY:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.observatory, seed + 41)];
                    break;
                case SF.TYPE_JOB:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.job, seed + 42)];
                    break;
                case SF.TYPE_SHIPYARD:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.shipyard, seed + 43)];
                    break;
                case SF.TYPE_DERELICT:
                    return ["Derelict", ST.getWord(languageSeed, seed+44)];
                    break;
                case SF.TYPE_INFORMATION:
                    return ["IRC",""];
                    break;
                case SF.TYPE_ANIMAL:
                    return ["Wild", ST.getWord(languageSeed, seed+45)];
                    break;
                case SF.TYPE_GOODY_HUT:
                    return ["Cave", ST.getWord(languageSeed, seed+46)];
                    break;
                case SF.TYPE_ARENA:
                    return ["Arena", ST.getWord(languageSeed, seed+47)];
                    break;
                case SF.TYPE_CONSTRUCTION:
                    return [ST.getWord(languageSeed, seed) + "'s", ST.randText(ST.construction, seed + 48)];
                    break;
                case SF.TYPE_OBELISK:
                    return ["Monument", ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_UNIVERSITY:
                    return ["University", ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_ALPHA_BARRACKS:
                    return ["Barracks", ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_ALPHA_AIRPORT:
                    return ["Shipyard", ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_ALPHA_HQ:
                    return ["Control Center", ST.getWord(languageSeed, seed)];
                    break;
                case SF.TYPE_ALPHA_DANCE:
                    return ["The Dance Floor 💃🕺", ""];
                    break;
	                case SF.TYPE_CORNFIELD:
	                    return ["The Cornfield", ""];
	                    break;
                default:
                    error("no building name for " + type);
                    return ["Err", "Err"];
            }
        },
        barGreeting: function(seed, faction) {
            if (faction === SF.FACTION_PIRATE) {
                return ST.randText(ST.barGreetingPirate, seed + 151);
            } else {
                return ST.randText(ST.barGreeting1, seed + 150);
            }
        },
        contraband: function(seed) {
            return ST.randText(ST.contraband1, seed + 170);
        },
				obeliskMessage: function(seed) {
          return ST.randText(ST.obelisk1, seed + 171).replace("NUMBER100", Math.round(SU.r(seed, 8.21)*100));
				},
				HotelService: function(seed) {
          return "The "+ST.randText(ST.hotel1, seed+81.21)+" "+ST.randText(ST.hotel2, seed+81.22)+" "+ST.randText(ST.hotel3, seed+81.23);
				},
        contraband1: [
            "Spaceweed",
            "White Horizon",
            "Space Base",
            "Space Cadet",
            "Spaceball",
            "Event Horizon",
            "Rainbow",
            "Space Rock",
            "Ufo Oil",
            "Sky Diamonds",
            "Pirate Gold",
            "Honeymoon",
            "Ghostbusting",
            "Comet Snow",
            "Black Sunshine",
            "Space Dust",
            "Moonshine"
        ],
        bar1: [
            "Grand",
            "Awful",
            "Bumpy",
            "Chilly",
            "Damp",
            "Dry",
            "Dull",
            "Fat",
            "Greasy",
            "Grumpy",
            "Harsh",
            "Hushed",
            "Lazy",
            "Low",
            "Outdated",
            "Nutty",
            "Puny",
            "Quaint",
            "Tepid",
            "Ratty",
            "Roasted",
            "Silent",
            "Spotty",
            "Thirsty",
            "Tough",
            "Weak",
            "Zippy",
            "Creeping",
            "Lovely",
            "Ugly",
            "Nasty",
            "Rude",
            "Vile",
            "Polite",
            "Lively",
            "Filthy",
            "Blithe",
            "Laconic",
            "Bucolic",
            "Ornery",
            "Gullible",
            "Thrifty",
            "Nervous",
            "Crispy",
            "Endless",
            "Smelly",
            "Grimy",
            "Rusty",
            "Foul",
            "Fetid",
            "Tiny",
            "Puny",
            "Petite",
            "Bulky",
            "Hot",
            "Sultry",
            "Frosty",
            "Bitter",
            "Antic",
            "Caustic",
            "Corpulent",
            "Dowdy",
            "Endemic",
            "Friable",
            "Garrulous",
            "Insolvent",
            "Insolent",
            "Invidious",
            "Jejune",
            "Jocular",
            "Limpid",
            "Mordant",
            "Obtuse",
            "Pernicious",
            "Petulant",
            "Puckish",
            "Impish",
            "Risible",
            "Sclerotic",
            "Spasmodic",
            "Turgid",
            "Verdant",
            "Wheedling",
            "Absurd",
            "Droll",
            "Rich",
            "Poor",
            "Silly",
            "Witty",
            "Hairy",
            "Wide",
            "Mangy",
            "Sketchy",
            "Dirty",
            "Bold",
            "Old",
            "Gummy",
            "Sour",
            "Bleak",
            "Wet",
            "Open",
            "Strange",
            "Dark",
            "Big",
            "Gritty",
            "Angry"
        ],
        bar2: [
            "Rotisserie",
            "Deed",
            "Wittness",
            "Log",
            "Toadstool",
            "Corner",
            "Hovel",
            "Place",
            "Seat",
            "Nook",
            "Niche",
            "Joint",
            "Hangout",
            "Abode",
            "Post",
            "Berth",
            "Dock",
            "Den",
            "Pump",
            "Stall",
            "Outhouse",
            "Head",
            "Privy",
            "Washroom",
            "Ottoman",
            "Couch",
            "Cupboard",
            "Counter",
            "Hutch",
            "Thing",
            "Stuff",
            "Glass",
            "Bottle",
            "Flagon",
            "Flask",
            "Jug",
            "Jar",
            "Urn",
            "Draft",
            "Toast",
            "Cup",
            "Shot",
            "Canteen",
            "Carafe",
            "Chalice",
            "Flagon",
            "Noggin",
            "Phial",
            "Tumbler",
            "Mug",
            "Bowl",
            "Drink",
            "Chalice",
            "Grail",
            "Beaker",
            "Draught",
            "Potion",
            "Stein",
            "Boot",
            "Shoe",
            "Pumps",
            "Hand",
            "Fist",
            "Shaker",
            "Salt",
            "Pepper",
            "Paw",
            "Mitt",
            "Mirror",
            "Plate",
            "Spoon",
            "Fork",
            "Door",
            "Lamp",
            "Clock",
            "Chimney",
            "Inn",
            "Sock",
            "Ring",
            "Kettle",
            "Toaster",
            "Spatula",
            "Saucepan",
            "Sponge",
            "Rug",
            "Coaster",
            "Box",
            "Tin",
            "Jar",
            "Saucer",
            "Gravy",
            "Blender",
            "Fryer",
            "Juicer",
            "Canister",
            "Cookbook",
            "Tray",
            "Platter",
            "Ladle",
            "Bowl",
            "Goblet",
            "Cadet",
            "School",
            "Bucket",
            "Rack",
            "Spice Rack",
            "Grinder",
            "Mill",
            "Napkin",
            "Towel",
            "Recliner",
            "Drawer",
            "Curio",
            "Buffet",
            "Hutch",
            "Sideboard",
            "Apron",
            "Crab Shack",
            "Bar",
            "Tavern",
            "Taverna",
            "Alehouse",
            "Beer Garden",
            "Bistro",
            "Canteen",
            "Lounge",
            "Barstool",
            "Table",
            "Chair",
            "Gameroom",
            "Inn",
            "Pub",
            "Speakeasy",
            "Blind Pig",
            "Blind Tiger",
            "Bootleggings",
            "Saloon",
            "Tap",
            "Blaster",
            "Blitzer",
            "Drinkery",
            "Tanker",
            "Joint",
            "Starhouse",
            "Restaurant",
            "Dump",
            "Hole",
            "Hovel",
            "Spot",
            "Place",
            "Room",
            "Barley",
            "Brew",
            "Malt",
            "Mutton",
            "Inn",
            "Habit",
            "House",
            "Brewery",
            "Microbrew",
            "World",
            "Compass",
            "Storeroom",
            "Cellar",
            "Cantina",
            "Stand",
            "Booth",
            "Country Store",
            "Log"
        ],
        barGreeting1: [
            "Welcome adventurer!",
            "Greetings space cowboy!",
            "Welcome!",
            "What's up?",
            "Speak to me",
            "Hey",
            "Greetings",
            "Yello",
            "G'Day",
            "Howdy",
            "Salut",
            "Giddyup",
            "Wotcha",
            "Ahoy-hoy",
            "What's new?",
            "Hihi",
            "How's it hanging?",
            "How ya doing?",
            "What it be?",
            "What's cooking?",
            "What's shakin, bacon?",
            "What's crackalackin?",
            "Ello Mate!",
            "Greetings arthling",
            "(The alien stares at your ear, silently licking its lips)"
        ],
        barGreetingPirate: [
            "Yo ho ho",
            "What?",
            "Yeah?",
            "Hey Girl",
            "Fail."
        ],
        /*
         temple1: [
         'A',
         'The',
         'One',
         'That',
         'New',
         'Old',
         'Minor',
         'More',
         'Another',
         'Different',
         'Second',
         'Third',
         'Temporary',
         'Alternate',
         'Primary',
         'Flipside',
         'Surrogate',
         'Ancillary',
         'Needless',
         'Unused',
         'Derelict',
         'Extra'
         ],
         temple2: [
         'Disused',
         'Gelatinous',
         'Angry',
         'Great',
         'Grandiose',
         'Spooky',
         'Troubled',
         'Wicked',
         'Fierce',
         'Disturbed',
         'Condemned',
         'Defeated',
         'Lonely',
         'Weary',
         'Vengeful',
         'Eager',
         'Zealous'
         ],
         */
        temple3: [
            'Fane',
            'Temple',
            'Crypt',
            'Causeway',
            'Hall',
            'Trail',
            'Jelly',
            'Castle',
            'Church',
            'Ruin',
            'Bane',
            'Waste',
            'Wreck',
            'Laboratory',
            'Derelict',
            'Remains',
            'Rubble',
            'Wine Cellar',
            'Basement',
            'Vault',
            'Archive',
            'Cellar',
            'Beer Cellar',
            'Rum Hole'
        ],
        tradepost1: [
            'Trading Post',
            'Store',
            'Shop',
            'Inventory',
            'Lot',
            'Bargain Basement',
            'Boutique',
            'Market',
            'Stand',
            'Outlet',
            'Market',
            'Emporium',
            'Energy Emporium',
            'Showroom',
            'Exchange',
            'Bazaar',
            'Mart',
            'Mom and Pop'
        ],
        colony1: [
            'Cache',
            'Hoard',
            'Treasure Patch',
            'Outpost',
            'Settlement',
            'Frontier',
            'Station',
            'Settlement',
            'Dome',
            'Biodome',
            'Terrarium',
            'Greenhouse',
            'Arboretum',
            'Conservatory',
            'Getaway',
            'Hideout',
            'Nursery',
            'Estate',
            'Homestead',
            'Plantation',
            'Ranch',
            'Nursery',
            'Garden'
        ],
        armory1: [
            'Armory',
            'Arsenal',
            'Depot',
            'Magazine',
            'Stockpile',
            'Repository',
            'Depository',
            'Stock',
            'Storehouse',
            'Warehouse',
            'Shed',
            'Stockroom',
            'Store',
            'Bin',
            'Barn',
            'Wares'
        ],
        mine1: [
            'Mine',
            'Pit',
            'Field',
            'Quarry',
            'Ditch',
            'Lode',
            'Shaft',
            'Vein',
            'Trench',
            'Trove',
            'Crater',
            'Excavation',
            'Well',
            'Dig',
            'Burrow',
            'Hole',
            'Trough'
        ],
        lab1: [
            'Mill',
            'Foundry',
					  'Smithy',
            'Plant',
            'Factory',
            'Lab',
            'Laboratory',
            'Workshop',
            'Sweatshop',
            'Cooperative',
            'Forge',
            'Workroom'
        ],
        templeBar1: [
            'Shifting',
            'Ancient',
            'Mysterious',
            'Blocky',
            'Square',
            'Pastel',
            'Retro',
            'Crazy',
            'Unworldly',
            'Squatted',
            'Colorful'
        ],
				hotel: [
					'Hostel',
					'Hotel',
					'Inn',
					'Motel',
					'Resort',
					'Lodge',
					'Getaway',
					'Shack',
					'Country House',
					'Chalet',
					'Hut'
				],
				observatory: [
					'Observatory',
					'Lookout',
					'Skygazer',
					'Tower',
					'Watch',
					'Scanner',
					'Radio',
					'Dish',
					'Starmapper',
					'Planetarium'
				],
				job: [
					'Temp Agency',
					'Contracting',
					'Higher for Hire',
					'Work Bureau',
					'Assignments',
					'Space Firm',
					'Company Inc.',
					'Delivery'
				],			
				shipyard: [
					'Dry Dock',
					'Port',
					'Shipyard',
					'Dockyard',
					'Harbor',
					'Skyport'
				],					
				construction: [
					'Construction',
					'Builders',
					'Developers',
					'Architects',
					'Engineering'
				],
				// Some of these messages are intentional rip-offs of church billboard sayings, graffiti, and similar. It's supposed to be corny signposts.
				obelisk1: [
					'Our sign broke. Come inside for the message.',
					'Sorry about the landscape.',
					'Property of a hoarder.',
					'If you can read this you have way too much time on your hands.',
					'Remember, remember the 5th of November."',
					'Mind the obelisk.',
					'I never finish anyth',
					'Things I hate: 1: Cryptic messages. 2: Irony. 3: Lists.',
					'I can explain it to you but I can\'t understand it for you.',
					'If you can read this the assassins have failed.',
					'If you are making the snow please stop.',
					'Too cold to change sign. Message inside.',
					'Congratulations graduates!',
					'No parking in this vicinity.',
					'Be thankful you\'re still above ground.',
					'Life has no remote. Get up and change yourself.',
					'If we\'re not back in NUMBER100 years, just wait longer...',
					'Our handwriting is terrible so we chiseled it in stone.',
					'According to this pillar I am pregnant. The father is Nutella.',
					'Under construction.',
					'If you can\'t convince them, confuse them.',
					'In order for you to insult Us, We would first need to value your opinion.',
					'This is not the pillar you are looking for.',
					'Do not read the next sentence.',
					'You that read wrong.',
					'Translation of this message was a test. A pointless, pointless test.',
					'We regret what we engraved when we were hungry.',
					'I finished a construction project and all I got was this lousy pillar.',
					'Try learning another language.',
					'Don\'t make me engrave in capital letters.',
					'It\'s always Friday somewhere.',
					'e=mc^2. But you didn\'t hear it from us.',
					'Caution: do not set on fire. Even if you really, really want to.',
					'Mind the gap.',
					'They told me not to build this pillar, but I showed them.',
					'Warning: do not pick up hitchhikers in this zone.',
					'Speed limit: NUMBER1000.',
					'Message not yet engraved. Sorry for the inconvenience.',
					'This pillar must be kept closed at all times.',
					'No soliciting.',
					'Yard sale next Saturday.',
					'Members and non-members only.',
					'Caution: local fauna may eat you and that may make them sick.',
					'Sorry we\'re closed but we\'re still awesome.',
					'Watch where you step.',
					'NUMBER100 days with no occupational accident.',
					'Temporary pillar message.',
					'Caution: this pillar has sharp edges.',
					'It made sense when we started but we really missed the point.',
					'We moved this pillar NUMBER100 steps to the left just to mess with its builders.',
					'Facilities are for customers only.',
					'Extreme fire hazard.',
					'I\'d turn back if I were you.',
					'Thanks Hywewpea for the great engraving.',
					'Even we don\'t know what we wrote.',
					'Just because you can reproduce doesn\'t mean you should.',
					'Please don\'t feed fingers to the natives.',
					'Your message here.',
					'Thank you for noticing this notice. Your noticing it has been reported to the authorities.',
					'Happy birthday!',
					'Do not leave valuables in your ships.',
					'NUMBER100 parking spaces remain.',
					'Sign read by NUMBER100 visitors.',
					'Pillar number NUMBER100.',
					'Get off the lawn!',	
				],
				hotel1: [
					'Presidential',
					'Opulent',
					'Plush',
					'Posh',
					'Expensive',
					'Extravagant',
					'Fantastic',
					'Royal',
					'Magnificent',
					'Noble',
					'Grand',
					'Regal',
					'Luxurious',
					'Sublime',
					'Divine',
					'Glorious',
					'Delightful',
					'Famous',
					'Famed',
					'Acclaimed',
					'Award-winning',
					'Great',
					'Renowned',
					'Heavenly',
				],
				hotel2: [
					'Health',
					'Recovery',
					'Fitness',
					'Comfort',
					'Happiness',
					'Spirit',
					'Relaxation',
					'Leisure',
					'Holiday',
					'Quiet',
					'Rest',
					'Vacation',
					'Calm',
					'Relief',
					'Recess',
					'Respite',
				],
				hotel3: [
					'Restoration',
					'Makeover',
					'Massage',
					'Renewal',
					'Revival',
					'Spa',
					'Recovery',
					'Rebuilding',
					'Sauna',
					'Mineral Spring',
					'Retreat',
					'Haven',
					'Bath',
					'Club',
					'Spring',
					'Gymnasium',
					'Therapy',
					'Pool',
					'Hot Tub',
					'Cleansing',
					'Shower',
					'Scrubbing',
				],
    });
})();


