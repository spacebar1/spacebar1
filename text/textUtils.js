SBar.Text = {};
var ST = SBar.Text;

(function() {
    SU.addProps(ST, {
        // common utility to pick a random entry out of a text array
        randText: function(textArray, seed) {
            return textArray[Math.floor(SU.r(seed, 1.1) * textArray.length)];
        },
        systemName: function(raceSeed, seed, is_binary) {
					let name = ST.getWord(raceSeed, seed);
					if (SU.r(seed, 1.17) < 0.1) {
						return name + " "+(Math.floor(SU.r(seed, 1.18)*8)+2);
					}
					if (is_binary) {
            return ST.getWord(raceSeed, seed) + " AB";
					} else if (SU.r(seed, 1.18) < 0.4) {
						name += " System";
					}
					return name;
        },
        deadSystemName: function(raceSeed, seed) {
            return ST.getWord(raceSeed, seed) + " Rogue";
        },
        planetName: function(raceSeed, seed) {
          let name = ST.getWord(raceSeed, seed);
					if (SU.r(seed, 1.28) < 0.1) {
						name += " "+(Math.floor(SU.r(seed, 1.29)*8)+2);
					}
					return name;
        },
        beltName: function(raceSeed, seed) {
            return "Belt " + ST.getWord(raceSeed, seed);
        },
				/*
        attrs: {
            weapon: {
                base: "Weapons",
                damage: "Bonus Damage",
                range: "Bonus Range",
                firerate: "Bonus Fire Rate",
                moverate: "Bonus Missile Speed",
                stun: "Chance to Stun",
                slow: "Chance to Slow",
                daze: "Chance to Daze", // slower firing back
                disarm: "Temporary Disarm",
                lifesteal: "Energy Steal",
                bonusnear: "Point Blank Bonus",
                penetrate: "Shield Penetration",
                pierce: "Body Pierce",
                instakill: "Lethal Aim",
                crit: "Critical Hit Chance",
                multishot: "Chaotic Multishot",
                stardist: "Solar Powered Weaponry",
                split: "Fragmenting Warheads", // splits at some point, or upon firing. Direction could be random
                detshot: "Corpse Explosion" // enemies explode into shots
                        // damage specific to certain environment / types / levels, 
                        // teleport effects?
            },
            shield: {
                base: "Shields",
                health: "Bonus Health",
                armor: "Bonus Armor",
                recharge: "Bonus Repair Rate",
                lightmit: "Lightning Mitigation",
                firemit: "Volcano Mitigation",
                lavamit: "Lava Mitigation",
                poisonmit: "Poison Mitigation",
                dodge: "Shield Deflection Chance",
                cryheal: "Health from Shinies",
                stunresist: "Stun Resist",
                lowsave: "Chance of a Low Save",
                maxhit: "Impact Lifeline" // such as 40% max per shot
                        // resist to certain enemies / types/ environment /levels/colors
                        // survive star flying
            },
            engine: {
                base: "Engine",
                interstellar: "Interstellar Speed Bonus",
                system: "System Speed Bonus",
                surface: "Surface Speed Bonus",
                temple: "Foot Speed Bonus",
                speed: "Speed Bonus",
                jumpjuice: "Jumpdrive Bonus Power",
                jumpefficiency: "Jumpdrive Efficiency",
                gravitymit: "Gravity Nullification",
                windmit: "High Wind Handling",
                //hitspeed: "Drama Speed Boost",
                efficiency: "Energy Efficiency",
                store: "Energy Store"
            },
            sensor: {
                base: "Sensors",
                system: "System Savvy",
                asteroid: "Asteroid Acumen",
                planet: "Planet Perception",
                universe: "Universal Understanding",
                people: "People Passion",
                trap: "Trap Training",
            }
        },
        prof: {
            explore: "Explorer",
            alpha: "Archaeologist",
            shopper: "Space Diva",
            collector: "Gold Farmer",
            barhop: "Bar Hopper",
            courier: "Delivery Boy",
            bhunter: "Bounty Hunter",
            vigilante: "Vigilante",
            plunder: "Viking Raider",
            pillage: "Privateer"
        },
				
        questNames: {
            400: "Walk the Line",
            401: "To Plunder!",
            402: "The Golden Parsec",
            403: "Tipping the Scales",
            404: "Excavation",
            405: "Acquisition",
            406: "Salvage Operation"
        }
				*/

    });

})();



