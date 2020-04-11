/*
 * Planet data and lazy cached maps
 */
(function() {	
	let four_pi_squared = 4 * Math.PI * Math.PI;
	
	let life_building_types = [SF.TYPE_BAR, SF.TYPE_BAR, SF.TYPE_ARMORY,
  				SF.TYPE_CITY_ARTI, SF.TYPE_CITY_ORE, SF.TYPE_CITY_GOODS, SF.TYPE_CITY_CONTRA, SF.TYPE_CITY_ALL, SF.TYPE_CITY_SPECIAL, SF.TYPE_CITY_SHIP,
				 SF.TYPE_HOTEL, SF.TYPE_CONSTRUCTION, SF.TYPE_JOB, SF.TYPE_SHIPYARD, SF.TYPE_LAB, /*SF.TYPE_OBELISK*/ SF.TYPE_UNIVERSITY];


	// Params: is_moon, parent_planet_data, is_battlestation, is_refractor
  SBar.PlanetData = function(mass, distanceOutIn, systemData, index, params) {
    this._initPlanetData(mass, distanceOutIn, systemData, index, params);
  };

  SBar.PlanetData.prototype = {
    type: SF.TYPE_PLANET_DATA,
		is_moon: false,
		moon_dist: null,  // Distance from parent.
		parent_planet_data: null,
    radius: -1,
    distanceOut: null,
    systemData: null,
    surface: null,
    x: null, // absolute position
    y: null,
		base_x: null,  // Position without extra rotation. Useful for matching coordinates independent of time.
		base_y: null,
    seed: null,
    raceseed: null,
    name: null,
    timeOffset: 0,
    index: null, // planet index in system data object, for lookup

    // Physical properties
    ggiant: null,  // Gas giant.
		is_battlestation: false,  // Alpha battlestation.
		is_refractor: false,  // Alpha collector.
    tilt: null,
    tempmin: null, // units in kelvin
    tempmax: null,
    tempmid: null,
    mass: null,
    gravity: null, // g's
    atmosphere: null, // 0 -> 1
    lightningfreq: null,
    windspeed: null, // km/h
    lavatemp: null,
    maxtemplat: null, // latitude of maximum temperature (summer zone), 90 (npole) to 0 (equator) to -90 (spole)
    haswater: null,
		hasmethane: null,
		waterworld: null,
    hasclouds: null,
    tectonics: null,
    danger: null,
    //minerals: null,
    radiationfactor: null, // for solar-powered weapons
    habitable: false,
    life: false,
    templePlanet: false,
    planetTerrain: null,
    cloudTerrain: null,
    tier: null,
    //surfaceTier: null,
    justentered: false,
    // planet stuff below
		building_types: null,  // Array of [TYPE_BUILDING, FACTION]. For quick lookup.
    buildingdata: null,
    templedata: null, // another link to the building data
    generated: false,
		generated_terrain: false,
    terraindata: null,
    terrainheat: null,
    terraintype: null,
    terrainimg: null,
    terrainimgdata: null,
    width: null,
    height: null,
		moons: null, // List of moons with any significant mass.
		is_moon: false,
		is_arth: false,  // Special home planet.
		// On-demand generated data.
		// TODO: make the terrain data on demand.
		rings: null,
		rings_size: 800,
		rings_scale: null,
		is_capital: false,  // Capital planet with lots of buildings.
    _initPlanetData: function(mass, distanceOutIn, systemData, index, params) {
			if (params) {
				for (let obj in params) {
					this[obj] = params[obj];
				}
			}
			/*
			if (params && params.is_moon) {
				this.is_moon = true;
				this.parent_planet_data = params.parent_planet_data;
			}
			*/
      this.distanceOut = distanceOutIn;
      this.systemData = systemData;
      this.index = index;
      this.level = this.systemData.level;
      var starRadius = systemData.radius * 2;
      if (this.systemData.isDead()) {
        starRadius = 0.1;
      } else if (this.systemData.in_alpha_bubble || this.systemData.alpha_core) {
      	starRadius /= 2;
      }
      var starx = systemData.x;
      var stary = systemData.y;
      this.seed = SU.r(this.systemData.seed, (starx + 0.8) * (stary + 0.4) * mass * this.distanceOut);
      this.raceseed = systemData.raceseed;

      this.mass = mass;
      this.radius = Math.pow(this.mass, 1 / 4) * 20; // cube root to get radius based on mass, plus some compression and normalization
      this.ggiant = this.radius > 20 && !this.is_moon;
      this.gravity = this.mass / (this.radius * this.radius) * 700; // surface gravity estimate, see wikipedia
			// Melting point is typically 700 - 1,200 C.
      this.lavatemp = 973 + Math.floor(SU.r(this.seed, 1.53 * 500));
      this.tectonics = SU.r(this.seed, 22) * SU.r(this.seed, 23) * SU.r(this.seed, 24);

      // Example axial tilt of big objects in the solar system: 7.25, 0, 177.36, 23.4, 6.68, 25.19, 3.13, 26.73, 99.77, 28.32, 122.53
      if (SU.r(this.seed, 10) < 0.75) {
        this.tilt = SU.r(this.seed, 11) * 30;
      } else {
        this.tilt = SU.r(this.seed, 12) * 180;
      }
			this.tilt = Math.floor(this.tilt);
      if (this.tilt <= 90) {
        this.maxtemplat = this.tilt;
      } else {
        this.maxtemplat = -1 * (180 - this.tilt);
      }

      // luminosity / distance-squared
      this.radiationfactor = starRadius / (this.distanceOut) * 3;
      // base solar heat, no atmosphere
      var min = 5 * this.radiationfactor;
      var max = 20 * this.radiationfactor;
      // add tilt effect on seasons
      var seasonmod = 1 + Math.abs(this.maxtemplat) / 90; // up to double heat/cool
      max *= seasonmod;
      min *= 2 - (seasonmod);

      this.atmosphere = 1 - (SU.r(this.seed, 13));
      if (this.ggiant) {
        this.atmosphere = SU.r(this.seed, 17) / 2 + 0.5;
      } else if (this.is_moon) {
      	// Moons have atmospheres. Sometimes.
				this.atmosphere *= SU.r(this.seed, 17.31) * SU.r(this.seed, 17.51);
      }
      var heattrap = this.atmosphere * SU.r(this.seed, 15);
      if (this.ggiant) {
        heattrap = SU.r(this.seed, 18) / 2 + 0.5;
      }
			if (this.is_arth) {
				this.atmosphere = 0.75;
				heattrap = 0.5;
			}

      // thick atmosphere stabilizes the temperatures
      var mid = (min + max) / 2;
      min = min + (mid - min) * this.atmosphere;
      max = max - (max - mid) * this.atmosphere;
      // greenhouse effect
      this.tempmin = min * (1 + heattrap * 2);
      this.tempmax = max * (1 + heattrap * 2);
      // Internal heating.
      var dynamo = (SU.r(this.seed, 20) * 200 + 50) *  SU.r(this.seed, 8.41);
			if (this.is_arth) {
				dynamo = 0;
			}
      this.tempmin += dynamo;
      this.tempmax += dynamo;
			if (this.is_moon) {
				// Moons heat a bit from parent planet.
				this.tempmin *= 1.1;
				this.tempmax *= 1.1;
			}
      // radiate at higher temperatures. This is also used as a smoothing factor.
      this.tempmax = this.RadiateAndSmoothTemp(this.tempmax); ///= Math.log(this.tempmax)*0.25;
      this.tempmin = this.RadiateAndSmoothTemp(this.tempmin); ///= Math.log(this.tempmin)*0.25;
      //this.tempmax /= Math.pow(this.tempmax, 0.1);
      //this.tempmin /= Math.pow(this.tempmin, 0.1);
      // place mid
      this.tempmid = (this.tempmin + this.tempmax) / 2;
      // Water can be sustained, or ice (or dry ice, etc.).
      this.haswater = this.atmosphere > 0.2 && this.tempmid <= 373 && this.tempmid > 220 && this.tempmax < this.lavatemp && SU.r(this.seed, 27.7) < 0.8;
			// Methane melting point is 90.7K and boiling point 111.65 K at STP. Ethane boils at 184.6 K. Ammonia goes higher.
      this.hasmethane = this.atmosphere > 0.2 && this.tempmid <= 220 && this.tempmid > 65 && SU.r(this.seed, 27.8) < 0.75;
      this.hasclouds = this.atmosphere > 0.2;
			if (this.is_battlestation || this.is_refractor) {
				this.haswater = false;
				this.hasmethand = false;
				this.hasclouds = false;
			}
			// Also ice world.
			this.waterworld = this.haswater && this.hasclouds && SU.r(this.seed, 20.5) < 0.08;
			if (this.is_arth) {
				this.haswater = true;
				this.waterworld = false;
			}
      if (this.atmosphere < 0.2) {
        this.windspeed = 0;
      }

      this.windspeed = this.tempmid / 3 * this.atmosphere * SU.r(this.seed, 21);
      //this.windspeed *= (this.level + 1 / 6);

      this.lightningfreq = this.atmosphere * Math.pow(this.windspeed, 0.4) / 5 * (this.tempmid / 300);
      if (this.tempmid < 300) {
        this.lightningfreq /= 6; // not likely in frozen clouds
      }
      if (this.lightningfreq < 0.25) {
        this.lightningfreq = 0;
      }

			let habitable_temp = this.tempmid >= 240 && this.tempmid <= 350;
			if (this.systemData.specialType === SF.SYSTEM_RACE_HOMEWORLD) {
				habitable_temp = this.tempmax >= 240 && this.tempmin <= 350;  // Crosses habitable window.
			}
      if (!this.ggiant && this.tempmid >= 240 && this.tempmid <= 350 && this.haswater && !this.systemData.in_alpha_bubble) {
        this.habitable = true;
        if (SU.r(this.seed, 9) > 0.25 || this.systemData.specialType === SF.SYSTEM_RACE_HOMEWORLD) {
          this.life = true;
          var lifecalmmod = (this.level + 1) / 8; // lower level is much calmer, for starting areas
          this.lightningfreq *= lifecalmmod;
          this.windspeed *= lifecalmmod;
          this.tectonics *= lifecalmmod;
        }
      }
			/*
      this.minerals = SU.r(this.seed, 25);
      if (this.life || this.ggiant) {
        this.minerals = 0;
      } else if (this.systemData.specialType === SF.SYSTEM_DEAD_TREASURE) {
        this.minerals = 1;
      }
			*/
			this.SetName();

      this.angle = Math.PI * 2 * this.seed;
			// Adjust the angle for planetary motion over time.
			// Kepler's third law describes orbital periods:
			//   p^2 = 4*pi^2*a^3/ G*(M1 + M2) 
			//     for p measured in seconds, a in meters, and M in kg (and pi = 3.14..).
			// Rotation here is approximated as a circle rather than ellipses.
			let period = four_pi_squared*this.distanceOut*this.distanceOut*this.distanceOut
				                     /this.systemData.star_mass;
	    this.base_x = Math.sin(this.angle) * this.distanceOut + starx;
	    this.base_y = Math.cos(this.angle) * this.distanceOut + stary;
			// But note the scale of the inner planets should be a lot more compressed (can't draw effectively), so remove the sqrt() to accommodate.											 
			// No G constant implemented here.
  		this.angle += Math.PI * 4 * (S$.time/24) / 365 / period;
			
      this.x = Math.sin(this.angle) * this.distanceOut;
      this.y = Math.cos(this.angle) * this.distanceOut;
      this.x += starx;
      this.y += stary;
			if (this.is_moon) {
				period = four_pi_squared*this.moon_dist*this.moon_dist*this.moon_dist
				                     /this.parent_planet_data.mass;
	   		this.angle += Math.PI * 4 * (S$.time/24) / 365 / period;
				this.x = this.parent_planet_data.x + Math.sin(this.angle) * this.moon_dist;
				this.y = this.parent_planet_data.y + Math.cos(this.angle) * this.moon_dist;
//				log("period", period)
			}

      this.danger = 0;
      this.danger += Math.max((this.windspeed - 50) / 100, 0);
      this.danger += Math.max((this.tempmax - 400) / 300, 0);
      this.danger += Math.max((this.gravity - 1) / 3, 0);
      this.danger += Math.max(this.atmosphere - 0.3, 0);
      this.danger += Math.max(this.tectonics - 0.3, 0);
      this.danger /= 5; // max is ~4, scale 0 to 1
			
			this.moons = [];
			if (this.is_battlestation) {
				this.GenerateBattlestation();
			} else if (this.is_refractor) {
				this.GenerateCollector();
			} else if (!this.is_moon) {
				this.AddMoons();
			}
			this.building_types = [];
    },
		AddMoons: function() {
			this.moons = [];
			let num_moons = 0;
			// Star's gravity will rip out moons near it.
			if (SU.r(this.seed, 77.4)*this.radius > 7 && SU.r(this.seed, 77.42) < this.distanceOut) num_moons++;
			if (SU.r(this.seed, 77.5)*this.radius > 15 && SU.r(this.seed, 77.52) < this.distanceOut) num_moons++;
			if (this.ggiant) {
				if (SU.r(this.seed, 77.6) > 0.5 && SU.r(this.seed, 77.62) < this.distanceOut) num_moons++;
				if (SU.r(this.seed, 77.7) > 0.5 && SU.r(this.seed, 77.72) < this.distanceOut) num_moons++;
				if (SU.r(this.seed, 77.8) > 0.5 && SU.r(this.seed, 77.82) < this.distanceOut) num_moons++;
				if (SU.r(this.seed, 77.9) > 0.5 && SU.r(this.seed, 77.92) < this.distanceOut) num_moons++;
			}
			// Major moons start beyond planetary rings.
			let total_dist = SU.r(this.seed, 80.01+1)*0.004+0.002;
			for (let i = 0; i < num_moons; i++) {
				//var moon_proportion = SU.r(this.seed, 77.9+i)*0.02 + 0.0003;
				let mass_fraction = SU.r(this.seed, 77.9+i)*0.75+0.05;
				let moon_mass = this.mass*mass_fraction*mass_fraction;
				if (this.ggiant) {
					moon_mass /= 4;
				}
				//total_dist += SU.r(this.seed, 80.1+1)*0.2+0.025;
				total_dist += SU.r(this.seed, 80.1+1)*0.004+0.002;
				//this.moons[i].moon_dist = total_dist;
        this.moons.push(new SBar.PlanetData(moon_mass, this.distanceOut, this.systemData, i, {is_moon: true, parent_planet_data: this, moon_dist: total_dist}));
				//this.moons[i].x = this.x;
				//this.moons[i].y = this.y;
			}
		},
		SetName: function() {
      this.name = ST.planetName(this.raceseed, this.seed);
			if (this.is_arth) {
				this.name = SF.ARTH_2_NAME;
			}
			if (!this.systemData.was_scanned && S$.ship.sensor_level < SF.SENSOR_NAMES) {
				this.name = this.is_moon ? "Unknown Moon" : "Unknown Planet";
			}
		},
		ResetNames: function() {
			this.SetName();
			for (let moon of this.moons) {
				moon.SetName();
			}
		},
		// Higher temperatures radiate.
		RadiateAndSmoothTemp(temp) {
			return temp / Math.pow(temp, 0.1);
			/*
			Obsolete smoothing (fixed with the updated lava temp).
			if (temp < 100) {
				return temp;
			}
			temp -= 100;
			temp /= Math.log(temp)*0.4;
			temp += 100;
			if (temp < 400) {
				return temp;
			}
			temp -= 400;
			temp /= Math.log(temp)*0.4;
			temp += 400;
			return temp;
			*/
			// Math.log(this.tempmax)*0.25;
			//return temp - (temp-200)/3;
		},
		GenerateBattlestation: function() {
			this.windspeed = 0;
			this.lightningfreq = 0;
			this.hasclouds = false;
			this.atomosphere = 0;
			this.ggiant = false;
			this.gravity = 1;
			this.tectonics = 0;
			this.haswater = false;
			this.tempmin = 295;
			this.tempmax = 295;
			this.tempmid = 295;
			this.atmosphere = 0;
			this.habitable = true;
			this.life = true;
			this.name = "Battlesphere "+this.systemData.name;
		},
		GenerateCollector: function() {
			this.windspeed = 0;
			this.lightningfreq = 0;
			this.hasclouds = false;
			this.atomosphere = 0;
			this.ggiant = false;
			this.gravity = 1;
			this.tectonics = 0;
			this.haswater = false;
			this.tempmin = 295;
			this.tempmax = 295;
			this.tempmid = 295;
			this.atmosphere = 0;
			this.habitable = true;
			this.life = true;
			let prefix = this.systemData.alpha_core ? "Refractor" : "Collector";
			this.name = prefix+" "+ST.getWord(this.raceseed, 5.13+this.index);//this.systemData.name+" "+String.fromCharCode('A'.charCodeAt() + (this.index));
			//this.name = "Collector "+this.name;
		},
    assignTemple: function() {
      this.templePlanet = true;
    },
		genLifeBuilding: function(seed) {
			var faction = SF.FACTION_NORMAL;
			return [life_building_types[Math.floor(SU.r(seed, 1.82)*life_building_types.length)], faction];
		},
    // for fast lookup from quest search
    genBuildingTypes: function() {
			this.building_types = [];
			
			if (this.is_battlestation) {
				this.building_types.push([SF.TYPE_ALPHA_HQ, SF.FACTION_ALPHA]);
				for (let i = 0; i < Math.floor(SU.r(this.seed, 6.12)*4+2); i++) {
					this.building_types.push([SF.TYPE_ALPHA_AIRPORT, SF.FACTION_ALPHA]);
				}
				for (let i = 0; i < Math.floor(SU.r(this.seed, 6.13)*4)+2; i++) {
					this.building_types.push([SF.TYPE_ALPHA_BARRACKS, SF.FACTION_ALPHA]);
				}
				return;
			} else if (this.is_refractor) {
				for (let i = 0; i < Math.floor(SU.r(this.seed, 6.12)*4+2); i++) {
					this.building_types.push([SF.TYPE_ALPHA_AIRPORT, SF.FACTION_ALPHA]);
				}
				for (let i = 0; i < Math.floor(SU.r(this.seed, 6.13)*4)+2; i++) {
					this.building_types.push([SF.TYPE_ALPHA_BARRACKS, SF.FACTION_ALPHA]);
				}
				return;
			} else if (this.systemData.in_alpha_bubble) {
				// All wiped out with no trace (because it's easier than implementing ruins).
				return;
			} else if (this.is_arth && !this.systemData.in_alpha_bubble) {
				// Arth before the freeze.
				for (let i = 0; i < Math.floor(SU.r(this.seed, 6.13)*3)+2; i++) {
					this.building_types.push([SF.TYPE_CITY_ALL, SF.FACTION_NORMAL]);
				}
				this.building_types.push([SF.TYPE_CONSTRUCTION, SF.FACTION_NORMAL]);
				this.building_types.push([SF.TYPE_CORNFIELD, SF.FACTION_NORMAL]);
				return;
			}
			
      if (this.templePlanet) {
				if (this.life && this.systemData.race_controls_system && !this.systemData.in_alpha_bubble) {
					this.building_types.push([SF.TYPE_TEMPLE_BAR, SF.FACTION_NORMAL]);
				} else {
					this.building_types.push([SF.TYPE_TEMPLE, SF.FACTION_ALPHA]);
				}
			}
		
			if (this.life) {
				if (this.systemData.race_controls_system) {
					// Inhabited.
					if (SU.r(this.seed, 103.73) < 0.9) {
						this.building_types.push(this.genLifeBuilding(this.seed+ 105.73));
					}
					if (SU.r(this.seed, 103.83) < 0.7) {
						this.building_types.push(this.genLifeBuilding(this.seed+ 105.83));
					}
					if (SU.r(this.seed, 103.93) < 0.4) {
						this.building_types.push(this.genLifeBuilding(this.seed+ 105.93));
					}
					if (this.systemData.race_controls_system && SU.r(this.seed, 92.12) < 0.25 || this.systemData.specialType === SF.SYSTEM_RACE_HOMEWORLD) {
						// Capital planet.
						this.is_capital = true;
						let num_buildings = Math.floor(SU.r(this.seed, 92.13) * 6) + 2
						for (let i = 0; i < num_buildings; i++) {
							this.building_types.push(this.genLifeBuilding(this.seed+i+ 92.14));
						}
					}
				} else {
					// Wild animals.
					let num_animals = Math.floor(SU.r(this.seed, 91.13) * 7) + 2;
					for (let i = 0; i < num_animals; i++) {
						this.building_types.push([SF.TYPE_ANIMAL, SF.FACTION_NORMAL]);
					}
				}
				return;
			}
			if (!this.systemData.race_controls_system && SU.r(this.systemData.seed, 204.45) < 0.6) {  // Note system seed.
				// Uncolonized system, no buildings.
				return;
			}
			
			if (this.is_moon && SU.r(this.seed, 234.44) < 0.5) {
				// Less chance on moons.
			}
			
			if (SU.r(this.seed, 204.44) < 0.7) {
				// No building.
				if (!this.systemData.race_controls_system && this.building_types.length === 0 && SU.r(this.seed, 97.11) < 0.05) {
					// Small chance of Goody Hut.
					this.building_types.push([SF.TYPE_GOODY_HUT, SF.FACTION_NORMAL]);
				} else if (this.building_types.length === 0 && SU.r(this.seed, 97.18) < 0.03) {
					// Small chance of an obelisk.
					this.building_types.push([SF.TYPE_OBELISK, SF.FACTION_NORMAL]);
				}
				return;
			}
			var faction = SF.FACTION_NORMAL;
      //if (!this.systemData.race_controls_system && SU.r(this.seed, 7.46) < 0.3) {
      //  faction = SF.FACTION_PIRATE;
      //}
      var bRand = SU.r(this.seed, 182);
      if (bRand < 0.3) {
				this.building_types.push([SF.TYPE_COLONY, faction]);
      } else if (bRand < 0.6) {
				this.building_types.push([SF.TYPE_MINING, faction]);
      } else if (bRand < 0.8) {
				this.building_types.push([SF.TYPE_OBSERVATORY, faction]);
      } else if (bRand < 0.9) {
				this.building_types.push([SF.TYPE_DERELICT, SF.FACTION_PIRATE]);
      } else {
				this.building_types.push([SF.TYPE_DERELICT, SF.FACTION_ALPHA]);
      }
    },
    generate: function() {
      if (this.generated) {
        return;
      }
      this.generated = true;
      this.genBuildingTypes();
      this.buildingdata = [];
			for (var i = 0; i < this.building_types.length; i++) {
				this.addBuilding(this.seed + 101.73 + i, this.building_types[i][0], this.building_types[i][1], i);
			}
			
			/*
			if (this.systemData.in_alpha_bubble) {
		    //_initPlanetData: function(mass, distanceOutIn, systemData, index, is_moon, parent_planet_data, alpha_override) {
			  this._initPlanetData(this.mass, this.distanceOut, this.systemData, this.index, this.is_moon, this.parent_planet_data, true);
				// The star died. Needs to be here after generation to not change the buildings.
			}
			*/
    },
		// This is separate from generate() since the terrain is relatively expensive.
		// Buildings will be placed only after generating the terrain. They can be
		// read before then, but will have x,y = 0.
		GenerateTerrain: function() {
      if (this.generated_terrain) {
        return;
      }
      this.generated_terrain = true;
			
			let terrain = this.getPlanetTerrain().renderTerrain();
			this.terraindata = terrain.data;
      this.terrainheat = terrain.heatmap;
      this.terrainimg = terrain.img;
      this.terrainimgdata = terrain.imgdata.data;
      this.width = this.terrainimg.width;
      this.height = this.terrainimg.height;

      // Generate terrain types
      this.terraintype = [];
      this.terraintype.length = this.terrainimg.width * this.terrainimg.height;
      for (var i = 0; i < this.terraintype.length; i++) {
        this.terraintype[i] = SF.TLAND;
        if (this.ggiant) {
          this.terraintype[i] = SF.TGAS;
        } else {
          var depth = this.terraindata[i];
          var heat = this.terrainheat[i];
          if (heat > this.lavatemp) {
            this.terraintype[i] = SF.TLAVA;
          } else if (heat > 373) {
            this.terraintype[i] = SF.TDESERT;
          } else if (heat > 243) {
            if (depth < 128 && this.haswater) {
              this.terraintype[i] = SF.TWATER;
            }
            // else normal land
          } else if (heat >= 84) {
            if (depth < 128 && heat <= 185 && this.hasmethane) {
              this.terraintype[i] = SF.TMETHANE;
            } else if (this.haswater || this.hasmethane) {
	            this.terraintype[i] = SF.TICE;
            }
            // else normal land
          } else if (this.haswater || this.hasmethane /*|| this.heat < 150*/) {
            this.terraintype[i] = SF.TICE;
          }
        }
      }
			this.PlaceBuildings();
		},
    addBuilding: function(seed, type, faction, index) {
      if (type === SF.TYPE_TEMPLE) {
        faction = SF.FACTION_ALPHA;
      }
			// Random x and y to set the seed.
      var building = new SBar.BuildingData(this, /*x=*/SU.r(seed, 13.37)*100, /*y=*/SU.r(seed, 1.337)*100, type, faction);
      this.buildingdata.push(building);
      if (type === SF.TYPE_TEMPLE || type === SF.TYPE_TEMPLE_BAR) {
        this.templedata = building;
      }
    },
		/* Ruins-based version
    addBuilding: function(seed, type, faction, index) {
			let do_ruins = false;
			if (this.systemData.in_alpha_bubble) {
				if (type === SF.TYPE_TEMPLE) {
					// Preserve.
				} else if (type === SF.TYPE_TEMPLE_BAR) {
					// Back to temple.
					type = SF.TYPE_TEMPLE;
				} else {
					// Wiped out.
					do_ruins = true;
				}
			}			
      if (type === SF.TYPE_TEMPLE) {
        faction = SF.FACTION_ALPHA;
      }
			// Random x and y to set the seed.
      var building = new SBar.BuildingData(this, SU.r(seed, 13.37)*100, SU.r(seed, 1.337)*100, type, faction);
			if (do_ruins) {
				let new_name = building.name;
				building = new SBar.BuildingData(this, SU.r(seed, 13.37)*100, SU.r(seed, 1.337)*100, SF.TYPE_RUINS, SF.TYPE_NORMAL);
				building.name = new_name;
			}
      this.buildingdata.push(building);
      if (type === SF.TYPE_TEMPLE || type === SF.TYPE_TEMPLE_BAR) {
        this.templedata = building;
      }
    },
		*/
		PlaceBuildings: function() {
			// Get them out of the way first.
			for (var i = 0; i < this.buildingdata.length; i++) {
				this.buildingdata[i].x = -100;
				this.buildingdata[i].y = -100;
			}
			for (var i = 0; i < this.buildingdata.length; i++) {
				this.PlaceBuilding(this.buildingdata[i]);
			}
		},
		// Note this is also called trying to place custom buildings.
		PlaceBuilding: function(building, do_custom /*optional*/) {
      // try a few times to get a good building location. Then force it.
      var testx, testy;
			var seed = building.seed;
			var clear = false;
      for (var i = 0; i < 15; i++) {
        testx = Math.floor(SU.r(seed, 500 + i) * this.width);
        testy = Math.floor(SU.r(seed, 1500 + i) * (this.height - 10) + 5);
				if (this.is_battlestation || this.is_refractor) {
					// Put the buildings right down the equator.
					testy = this.height/2;
				}
        if (this.isLand(testx, testy) && this.GetTerrainType(testx, testy) != SF.TDESERT) {
          // test if too close to other buildings
          var clear = true;
          for (var j = 0; j < this.buildingdata.length; j++) {
            var diffx = testx - this.buildingdata[j].x;
            var diffy = testy - this.buildingdata[j].y;
            if (diffx * diffx + diffy * diffy < 400) { // ~20 dist.
              clear = false;
              break;
            }
          }
					// Also check clearance from custom buildings if requested.
					if (do_custom) {
						if (S$.custom_buildings[this.seed]) {
							let customs = S$.custom_buildings[this.seed];
							for (let key in customs) {
								let cx = customs[key].x;
								let cy = customs[key].y;
		            var diffx = testx - customs[key].x;
		            var diffy = testy - customs[key].y;
		            if (diffx * diffx + diffy * diffy < 400) { // ~20 dist.
		              clear = false;
		              break;
		            }
							}
						}
					}
        }
				if (clear) {
					break;
				}
      }
			if (!clear) {
				// Force location.
        testx = Math.floor(SU.r(seed, 600) * this.width);
        testy = Math.floor(SU.r(seed, 1600) * (this.height - 10) + 5);
			}
			building.x = testx;
			building.y = testy;
		},
    isLand: function(x, y) {
      return this.ggiant || this.terraintype[x + y * this.width] === SF.TLAND;
    },
		isFloating: function(x, y) {
			var terrain_type = this.GetTerrainType(x, y);
			return this.ggiant || terrain_type === SF.TLAVA || terrain_type === SF.TWATER;
		},
		GetTerrainType: function(x, y) {
			return this.terraintype[x + y * this.width];
		},
		GetTerrainHeat: function(x, y) {
			return this.terrainheat[x + y * this.width];
		},
		GetTerrainHeight: function(x, y) {
			return Math.max(this.terraindata[x + y * this.width], 128)-128;
		},
		GetRawTerrainHeight: function(x, y) {
			return this.terraindata[x + y * this.width];
		},
    getSurfacePixel: function(x, y) {
      var index = (y * this.terrainimg.width + x) * 4;
      return [this.terrainimgdata[index], this.terrainimgdata[index + 1], this.terrainimgdata[index + 2], this.terrainimgdata[index + 3]];
    },
    getPlanetTerrain: function() {
      if (this.planetTerrain === null) {
        this.planetTerrain = new SBar.PlanetTerrain(this, /*cloud=*/false);
      }
      return this.planetTerrain;
    },
    getCloudTerrain: function() {
      if (this.cloudTerrain === null) {
        this.cloudTerrain = new SBar.PlanetTerrain(this, /*cloud=*/true);
      }
      return this.cloudTerrain;
    },
    activateTier: function() {
      this.justentered = true;
      if (this.tier === null) {
        this.tier = new SBar.PlanetTier(this);
      }
      this.tier.activate();
			return this.tier;
    },
		/*
    activateSurface: function(x, y, unused) {
      if (!this.generated) {
        this.generate();
      }
			if (!this.generated_terrain) {
				this.GenerateTerrain();
			}
      if (this.surfaceTier === null) {
        this.surfaceTier = new SBar.SurfaceTier(this);
      }
      this.surfaceTier.activate(x, y, unused);
    },
		*/
		/*
		// Called when the surface buildings changed.
		reactivateSurface(x, y) {
			if (x === undefined && this.surfaceTier !== null) {
				x = this.surfaceTier.x;
				y = this.surfaceTier.y;
			}
      this.surfaceTier = new SBar.SurfaceTier(this);
      this.surfaceTier.activate(x, y);
		},
		*/
    teardown: function() {
      if (this.tier !== null) {
        this.tier.teardown();
      }
      delete this.tier;
      delete this.buildingdata;
    },
		// Builds ring images based on the planet seed.
		DrawRings: function() {
			if (this.rings_drawn) {
				return;
			}
			this.rings_drawn = true;
			
			this.rings_scale = SU.r(this.seed, 7.77)*0.5+1;
			var size = this.rings_size;
			var rad = size / 2;
			
			var rings_flat = document.createElement('canvas');
      rings_flat.width = size;
      rings_flat.height = size;
      var ctx1 = rings_flat.getContext('2d');						
			//var colorStops = [0, 'rgba(0,0,0,0)', 0.5, 'rgba(0,0,0,0)', 0.5, 'rgba(255,100,100,0.75)', 1, 'rgba(255,0,100,0.95)'];
			var colorStops = [];
			colorStops.push(0, 'rgba(0,0,0,0)');
			var start = SU.r(this.seed, 16.1)*0.15+0.65;
			colorStops.push(start, 'rgba(0,0,0,0)');
		  var r = Math.floor(SU.r(this.seed, 16.2)*150)+40;
		  var g = Math.floor(SU.r(this.seed, 16.3)*150)+40;
		  var b = Math.floor(SU.r(this.seed, 16.4)*150)+40;
		  var a = SU.r(this.seed, 16.5)*0.8+0.1;
			colorStops.push(start, 'rgba('+r+','+g+','+b+','+a+')');
			var s = 16.6;
			while (start < 1) {
				var nr = r + Math.floor(SU.r(this.seed, s++)*80)-50;
				var ng = g + Math.floor(SU.r(this.seed, s++)*80)-50;
				var nb = b + Math.floor(SU.r(this.seed, s++)*80)-50;
				var na = a + SU.r(this.seed, s++)*0.2-0.1;
				if (SU.r(this.seed,s++) < 0.25) {
					colorStops.push(start, 'rgba(0,0,0,0)');
				} else {
					colorStops.push(start, 'rgba('+nr+','+ng+','+nb+','+na+')');
				}
				start += SU.r(this.seed, s++)*0.05;
			}
			
			ctx1.translate(rad, rad);
			SU.circleRad(ctx1, 0, 0, rad-3, colorStops);
			// Now map all the pixels to a perspective.
			// The perspective is locked-in, to match the sphere angles.
      var imageData1 = ctx1.getImageData(0, 0, size, size);
      var data1 = imageData1.data;

			var rings_angle = document.createElement('canvas');
      rings_angle.width = size;
      rings_angle.height = size;
      var ctx2 = rings_angle.getContext('2d');						
      var imageData2 = ctx2.getImageData(0, 0, size, size);
      var data2 = imageData2.data;

			// Calculate perspective.
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					var dist = 1+y*0.002;
					dist /= 1.3
					var source = (y*size+x)*4;
					// x will be flattened less, to control z.
					var targetx = Math.floor((rad-x)/dist)+rad;
					var targety = size-Math.floor(y/dist/5)-347;
					
					var target = (targety*size+targetx)*4;
					data2[target] = data1[source];
					data2[target+1] = data1[source+1];
					data2[target+2] = data1[source+2];
					data2[target+3] = data1[source+3];
					// Overlap to fill any gaps.
					data2[target+4] = data1[source];
					data2[target+5] = data1[source+1];
					data2[target+6] = data1[source+2];
					data2[target+7] = data1[source+3];
				}
			}

			ctx2.translate(rad, rad)
			ctx2.putImageData(imageData2, 0, 0);

			this.rings = document.createElement('canvas');
      this.rings.width = size;
      this.rings.height = size;
      var ctx = this.rings.getContext('2d');						
			ctx.translate(rad, rad)
			ctx.drawImage(rings_angle, -rad, -rad);
			
			this.rings_flat = rings_flat;
		},
		DrawRingsCommon: function(ctx, x, y, scale, rotation, background) {
			if (!this.ggiant) {
				return;
			}
			if (this.rings === null) {
				this.DrawRings();
			}
			if (!scale) {
				scale = 1;
			}
			scale *= this.rings_scale;
			ctx.save();
			ctx.translate(x,y);
			ctx.rotate(this.tilt/180*Math.PI);
			if (rotation) {
				ctx.rotate(rotation);
			}
			if (background) {
				ctx.drawImage(this.rings, 0, 0, this.rings_size, this.rings_size/2, -this.rings_size/2*scale, 
					-this.rings_size/2*scale, this.rings_size*scale, this.rings_size/2*scale)
			} else {
				ctx.drawImage(this.rings, 0, this.rings_size/2, this.rings_size, this.rings_size/2, -this.rings_size/2*scale, 
					-0.3, this.rings_size*scale, this.rings_size/2*scale)
			}
			ctx.restore();
		},
		DrawRingsBack: function(ctx, x, y, scale, rotation) {
			this.DrawRingsCommon(ctx, x, y, scale, rotation, true);
		},
		DrawRingsFore: function(ctx, x, y, scale, rotation) {
			this.DrawRingsCommon(ctx, x, y, scale, rotation, false);
		},
		// Note this doesn't pull up custom buildings.
		GetBuildingAt: function(x, y) {
			for (let building of this.buildingdata) {
				if (building.x == x && building.y == y) {
					return building;
				}
			}
			error("nogetbld");
			return null;
		},
		// Refreshes cache. Needed when the buildings on the surface change.
		ResetSurfaceCache: function() {
			//this.surfaceTier = null;
      this.tier = new SBar.PlanetTier(this);
		},
		// Returns the richness of minerals.
		GetAreaMinerals: function() {
			area_minerals = SU.r(this.seed, 8.2);
			let system_minerals = SU.r(this.systemData.seed, 8.3);
			// Fewer minerals on the planets.
			return area_minerals * area_minerals * system_minerals;			
		},
		// Separate layer to avoid recursion.
		ClearShipPositionInternal: function() {
			if (this.tier) {
				this.tier.shipx = null;
				this.tier.shipy = null;
			}
		},
		ClearShipPosition: function() {
			if (this.is_moon) {
				this.parent_planet_data.ClearShipPosition();
				return;
			}
			this.ClearShipPositionInternal();
			for (let moon of this.moons) {
				moon.ClearShipPositionInternal();
			}
		},
  };
  SU.extend(SBar.PlanetData, SBar.Data);
})();

	
