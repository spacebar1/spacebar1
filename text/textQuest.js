(function() {

    SU.addProps(ST, {
        questName: function(seed) {
            var ret = "The ";
            ret += ST.randText(ST.quest1, seed + 1.97);
            ret += " " + ST.randText(ST.quest2, seed + 2.97);
            ret += " " + ST.randText(ST.quest3, seed + 3.97);
            ret += " " + ST.randText(ST.questNames, seed + 4.97);
            
						/*
            var typeText = null
            
            switch (type) {
                //case SF.QUEST_PLOT:
                //    ret = "Finding Your Friend";
                //    break;
                case SF.QUEST_PLUNDER:
                    typeText = ST.questPillage;
                    break;
                case SF.QUEST_GOLDENPARSEC:
                    typeText = ST.questDrink;
                    break;
                case SF.QUEST_TRADERUN:
                    typeText = ST.questTrade;
                    break;
                case SF.QUEST_ALPHA:
                    typeText = ST.questAlpha;
                    break;
                case SF.QUEST_BOUNTY:
                    typeText = ST.questBounty;
                    break;
                case SF.QUEST_DERELICT:
                    typeText = ST.questDerelict;
                    break;
                default:
                    error("no quest name");
            }
            if (typeText !== null) {
                ret += " "+ST.randText(typeText, seed + 3.97);
            }*/
            return ret;
        },

        // Stuff like "Crazy Angry System Stomp" "Wild Blue Purchase Plan" "Very Angry Revenge Raid". 40x40x40x40. 100x100x100
        // description of an intangible aspect
        // 8 chars max, for every word

				/*
        questTrade: [
            "Exchange",
            "Swap",
            "Swindle",
            "Purchase",
            "Buy",
            "Barter",
            "Order",
            "Delivery"
        ],
        questDerelict: [
            "Salvage",
            "Recover",
            "Loot",
            "Swipe",
            "Collect"
        ],
        questPillage: [
            "Stomp",
            "Smash",
            "Pillage",
            "Plunder",
            "Ravage",
            "Reaping",
            "Raid"
        ],
        questDrink: [
            "Parsec",
            "Drink",
            "Round",
            "Boozer",
            "Spacebar"
        ],
        questAlpha: [
            "Dig",
            "Excavate",
            "Unearth",
            "Search",
            "Uncover"
        ],
        questBounty: [
            "Gambit",
            "Hunt",
            "Seek",
            "Retrieve",
            "Battle",
            "Acquire",
            "Payback",
            "Law",
            "Lasso"
        ],
				*/
        quest1: [
            "Archaic",
            "Crazy",
            "Angry",
            "Lively",
            "Missed",
            "Sad",
            "Open",
            "Closed",
            "Bold",
            "Rising",
            "Wounded",
            "Grave",
            "Awed",
            "Blank",
            "Full",
            "Evil",
            "Friendly",
            "Hostile",
            "Calm",
            "Scary",
            "Annoying",
            "Fearful",
            "Dire",
            "Moot",
            "Unknown",
            "Blessed",
            "Cursed",
            "Known",
            "Knowing",
            "Unknown",
            "Unwise",
            "Wise",
            "Fluent",
            "Savvy",
            "Cool",
            "Shy",
            "Present",
            "Hiding",
            "Fierce",
            "Stout",
            "Stubborn",
            "Bitter",
            "Lanky",
            "Hard",
            "Lax",
            "Strict"
        ],
        // description of a physical aspect
        quest2: [
            "Blue",
            "Solid",
            "Flaky",
            "Arid",
            "Cold",
            "Astral",
            "Planar",
            "Hot",
            "Warm",
            "Buried",
            "Frowning",
            "Light",
            "Red",
            "Green",
            "Fluffy",
            "Peace",
            "Wet",
            "Bright",
            "Heavy",
            "Sharp",
            "Rough",
            "Smooth",
            "Hard",
            "Soft",
            "Shiny",
            "Dull",
            "Hairy",
            "Grizzly",
            "Prickly",
            "Blonde",
            "Dark",
            "Round",
            "Square",
            "Angled",
            "Plush",
            "Brittle",
            "Maleable",
            "Broken",
            "Intact",
            "Harmful",
            "Harmless",
            "Cute",
            "Sparkly",
            "Weaved",
            "Loud",
            "Quiet",
            "Spewing",
            "Blah",
            "Snazzy",
            "Boring",
        ],
        // noun
        quest3: [
            "Revenge",
            "System",
            "Gold",
            "Game",
            "Star",
            "Stellar",
            "Rock",
            "Dust",
            "Stone",
            "Metal",
            "Lazer",
            "Head",
            "Body",
            "Ship",
            "Wind",
            "Toy",
            "Plane",
            "Peanut",
            "Stove",
            "Iron",
            "Blade",
            "Chair",
            "Basket",
            "Lead",
            "Glass",
            "Bottle",
            "Crystal",
            "Ear",
            "Quill",
            "Cloud",
            "Fire",
            "Lava",
            "Spark",
            "Shot",
            "Boot",
            "Hand",
            "File",
            "Paper",
            "Gaze",
            "Shade",
            "Hat",
            "Prize",
            "Stick",
            "Button",
            "Collar",
            "Sky",
            "Blaze",
            "Wire",
            "Hammer",
					  "Kessel",
        ],
				
				questNames: [
            "Exchange",
            "Swap",
            "Swindle",
            "Purchase",
            "Buy",
            "Barter",
            "Order",
            "Delivery",
            "Salvage",
            "Recover",
            "Loot",
            "Swipe",
            "Collect",
            "Stomp",
            "Smash",
            "Pillage",
            "Plunder",
            "Ravage",
            "Reaping",
            "Raid",
            "Parsec",
            "Drink",
            "Round",
            "Boozer",
            "Spacebar",
            "Dig",
            "Excavate",
            "Unearth",
            "Search",
            "Uncover",
            "Gambit",
            "Hunt",
            "Seek",
            "Retrieve",
            "Battle",
            "Acquire",
            "Payback",
            "Law",
            "Lasso",
					  "Run",
				],				
    });
})();


