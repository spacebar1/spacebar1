/*
 * Star icon on the system map
 */

(function() {
	let four_pi_squared = 4 * Math.PI * Math.PI;

    SBar.SystemData = function(regionData, xIn, yIn, specialType) {
        this._initSystemData(regionData, xIn, yIn, specialType);
    };

    SBar.SystemData.prototype = {
      type: SF.TYPE_SYSTEM_DATA,
      regionData: null,
      specialType: null, // normal, dead system, gem world, etc.
      x: 0,
      y: 0,
      seed: -1,
			raceseed: -1,
			racedata: null,  // See 5regionD for schema.
			race_controls_system: false,
      r: -1,
      g: -1,
      b: -1,
			r2: -1,  // For binary.
			g2: -1,
			b2: -1,
      radius: -1,
      colorstr: null,
      colorstr2: null,  // For binary.
			main_radius: 1,  // Main and binary star radii.
			binary_radius: 0,
			binary_distance: 0,  // Just a 0-1 scale, for drawing.
		  binaryx: null,  // x,y coordinates of the binary star.
		  binaryy: null,
      // Generated vars
      generated: false,
      planets: null,
      numplanets: -1,
			numbelts: -1,
      name: null,
      colorstrwhite: null,
      habcenter: null,
      habwidth: null,
      belts: null,
      beltrings: null,
      tier: null,
      level: null,
      templePlanetNum: null,
      drewNebula: false,
			star_mass: null,  // Relative star mass
			is_binary: null,
			need_starport: false,
			in_alpha_bubble: false,  // This system is in a massive alpha structure.
			has_party_yacht: false,
			alpha_core: false,
			was_scanned: false, // Data about this system is known from an observatory.
			travel_renderer: null,  // SBar.TravelRenderer used for 3D rendering.
			_initSystemData: function(regionData, xIn, yIn, specialType) {
        this.regionData = regionData;
        this.x = xIn;
        this.y = yIn;
        if (specialType === undefined) {
            this.specialType = SF.SYSTEM_NORMAL;
        } else {
            this.specialType = specialType;
        }
        this.seed = SU.r(0, (this.x + 0.7) * (this.y + 0.3)+this.y);

        this.radius = (SU.r(this.seed, 7) + 0.2) * 3.5;
				if (this.specialType === SF.SYSTEM_RACE_HOMEWORLD) {
					this.radius = (SU.r(this.seed, 7.1)/2 + 0.7) * 3.5;
					this.need_starport = SU.r(this.seed, 7.2) < 0.6;
				} else if (this.specialType === SF.SYSTEM_ARTH) {
					this.radius = 4.2;
				}
				// Radius > 2 has an increasing chance of being binary.
				this.is_binary = !this.isDead() && (SU.r(this.seed, 5.2) > 0.4) && (this.radius > SU.r(this.seed, 5.1) * 2 + 2);
				this.star_mass = this.radius * this.radius;
        if (this.isDead() || this.in_alpha_bubble) {
            this.r = 0;
            this.g = 0;
            this.b = 0;
        } else {
            this.r = Math.floor(SU.r(this.seed, 5) * 200) + 55;
            this.g = Math.floor(SU.r(this.seed, 6) * 200) + 55;
            this.b = Math.floor(SU.r(this.seed, 7) * 200) + 55;
        }
        this.colorstr = this.r + ',' + this.g + ',' + this.b;
				if (this.is_binary) {
					// Mass and radius relations can be complicated, due to denisty and gravity.
					// Approximate with mass = r^2, as above.
					let binary_mass_fraction = SU.r(this.seed, 5.5)/2;  // < 0.5.
					this.main_radius = Math.sqrt(1-binary_mass_fraction);
					this.binary_radius = Math.sqrt(binary_mass_fraction);
					this.binary_distance = SU.r(this.seed, 5.6)*100+80;
					// Shift colors from the main.
          this.r2 = fixColor(this.r + Math.floor(SU.r(this.seed, 5.1) * 150)-75);
          this.g2 = fixColor(this.g + Math.floor(SU.r(this.seed, 5.2) * 150)-75);
          this.b2 = fixColor(this.b + Math.floor(SU.r(this.seed, 5.3) * 150)-75);
					if (SU.r(this.seed, 5.13) < 0.25) {
						// Chance of random colors.
            this.r2 = Math.floor(SU.r(this.seed, 5.1) * 200) + 55;
            this.g2 = Math.floor(SU.r(this.seed, 5.2) * 200) + 55;
            this.b2 = Math.floor(SU.r(this.seed, 5.3) * 200) + 55;
					}
          this.colorstr2 = this.r2 + ',' + this.g2 + ',' + this.b2;
					// Same heuristic here as for planet orbital periods.
					let period = Math.cbrt(four_pi_squared*this.binary_distance*this.binary_distance*this.binary_distance
						                     /(this.star_mass*(1-binary_mass_fraction)));
					// No G constant implemented here. 1 period value is maybe half an earth year or so. So double the angle.
		  		this.angle = Math.PI * 4 * (S$.time/24) / 365 / period;
	
		      this.binaryx = Math.sin(this.angle) * this.binary_distance;
		      this.binaryy = Math.cos(this.angle) * this.binary_distance;
				}
      },
      generate: function() {
				if (this.generated) {
					return;
				}
		
				// Broader races for this region. Note this.racedata is referenced externally.
				this.racedata = this.regionData.DetermineRace(this.x, this.y);
				if (this.racedata.race.seed === SF.RACE_SEED_ALPHA && this.specialType !== SF.SYSTEM_ALPHA_CORE) {
					// The original race is embedded.
					if (!this.racedata.original_race) {
						error("noracedr");
					}
					this.racedata_alpha = this.racedata;
					this.racedata = this.racedata.original_race;
				}
				this.raceseed = this.racedata.race.seed;
				if (this.specialType === SF.SYSTEM_ARTH) {
					this.raceseed = SF.RACE_SEED_ALPHA;
				}
				this.level = this.racedata.race.level;
				if (this.racedata_alpha) {
					this.level = this.racedata_alpha.race.level;
				}
				this.race_controls_system = this.racedata.core;
				if (this.specialType === SF.SYSTEM_ALPHA_CORE) {
					this.race_controls_system = true;
					this.alpha_core = true;
					this.in_alpha_bubble = true;
					this.level = Math.floor(SU.r(this.seed, 1.82)*6)+15;
					let boss_xy = S$.bossxy;
					this.has_party_yacht = this.x === boss_xy[0] && this.y === boss_xy[1];
					this.GenerateAlphaCore();
					return;
				}
			
        var whitewashout = 2;
        this.colorstrwhite = (255 - Math.floor((255 - this.r) / whitewashout)) + ',' + (255 - Math.floor((255 - this.g) / whitewashout)) + ',' + (255 - Math.floor((255 - this.b) / whitewashout));
				
				this.SetName();

				let planet_material_and_distance = [];
        this.planets = [];
        var rand = 1;
        this.numplanets = 0;
        var distanceout = 0.1 + SU.r(this.seed, 1.65 + rand++) * 0.2;
        while (distanceout < this.radius && this.numplanets <= 9) {
					// more planets on bigger systems
					// this works pretty well, but go for more squash at the center
          //var proportion = (SU.r(this.seed, rand++) + distanceout/2.3 + 0.03) * (Math.sqrt(distanceout) * 3 + 0.1) * Math.sqrt(24 / this.radius) / 10;
					var proportion = SU.r(this.seed, 1.11 + rand++) * distanceout * 1.2 + distanceout/10 + 0.02;
					// Shave a little from matter loss at the disc edges.
					if (distanceout > this.radius/3) {
						proportion /= SU.r(this.seed, 1.12 + rand++) * distanceout * 2 + 1;
					}
          var dist = distanceout + proportion / 2;
          distanceout += proportion;
					if (dist < this.radius) {
						let mass = proportion / this.radius * dist * 5;
						planet_material_and_distance.push([mass, dist]);
						//proportionOfSystem * this.distanceOut * 5;
	          this.numplanets++;
					}
        }
				// Swap the order of a few planets, to approximate for current (2019) theory of hot jupiters.
				for (let i = 0; i < Math.floor(SU.r(this.seed, 8.21)*this.numplanets/3); i++) {
					let source_index = Math.floor(SU.r(this.seed, 8.22+i)*this.numplanets);
					let target_index = Math.floor(SU.r(this.seed, 8.23+i)*this.numplanets);
					if (source_index != target_index) {
						let temp_material = planet_material_and_distance[target_index][0];
						planet_material_and_distance[target_index][0] = planet_material_and_distance[source_index][0];
						planet_material_and_distance[source_index][0] = temp_material;
					}
				}
				if (this.specialType === SF.SYSTEM_ARTH) {
					// Make sure there's a habitible planet.
					planet_material_and_distance = planet_material_and_distance.filter(function(data) {  // filter() needs true to keep it.
						// Remove anything near the special planet.
						return data[1] < 0.5 || data[1] > 2.0;
					});
					planet_material_and_distance.push([0.5, 1.4, true]);
					this.numplanets = planet_material_and_distance.length;
					planet_material_and_distance = planet_material_and_distance.sort(function(left, right){return left[1] - right[1];});
				}
				// Now build the actual planets.
				for (let i = 0; i < planet_material_and_distance.length; i++) {
					let material_and_distance = planet_material_and_distance[i];
          let planet = new SBar.PlanetData(material_and_distance[0], material_and_distance[1], this, i, {is_arth: material_and_distance[2]});
          this.planets.push(planet);
				}
				
				if (this.numplanets <= 3 && SU.r(this.seed, 1.13 + rand++) < 0.25 && this.specialType !== SF.SYSTEM_ARTH) {
					// Chance of no planets.
					this.numplanets = 0;
					this.planets = [];
				}
        this.habcenter = Math.pow(this.radius, 1) / 3; // linear to radius, to correspond to radiation factor formula
        this.habwidth = Math.pow(this.radius, 1) / 6;

        // assign a temple
        // skew chance of a temple_bar (put temple on habitable planets) strongly toward lower levels to help out starting area
        // goal is about 90% chance at level 0, 20% chance at level 3, low chance above level 5
        // then cut in half?
        var totprob = 0;
        var dif = 10 - this.level;
        var lifeprob = dif * dif * dif * dif / 11000;
        // works out to about 90% [0], 60% [1], 37% [2], 22% [3],  12% [4], 6% [5], 2% [6]
        for (var i = 0; i < this.planets.length; i++) {
            var planet = this.planets[i];
            if (planet.life) {
                totprob += lifeprob * this.planets.length;
            } else {
                totprob++;
            }
        }
        var spot = SU.r(this.seed, 103) * totprob;
				if (!this.in_alpha_bubble && this.specialType !== SF.SYSTEM_ARTH) {
          for (var i = 0; i < this.planets.length; i++) {
            var planet = this.planets[i];
            if (planet.life) {
              spot -= lifeprob * this.planets.length;
            } else {
              spot--;
            }
            if (spot <= 0) {
              this.templePlanetNum = i;
              this.planets[i].assignTemple();
              break;
            }
          }
				}
        this.addAsteroidBelts();
        this.generated = true;
/*					
				if (this.in_alpha_bubble && !this.alpha_core) {
					// Collector is eating the star.
          let planet = new SBar.PlanetData(SU.r(this.seed, 5.52+i)*0.02+0.005, 0, this, 0, {is_refractor: true});
          this.planets.push(planet);
				}
*/				
      },
			SetName: function() {
        this.name = ST.systemName(this.raceseed, this.seed, this.is_binary);
				if (this.specialType === SF.SYSTEM_ARTH) {
					this.name = "Metsys Los";
				} else if (this.specialType === SF.SYSTEM_RACE_HOMEWORLD) {
					this.name = ST.RaceNameOnly(this.raceseed)+" "+ST.getWord(this.raceseed, this.seed);
				} else if (this.isDead()) {
            this.name = ST.deadSystemName(this.raceseed, this.seed);
        }
				this.was_scanned = S$.scannedStars[this.x + "," + this.y] === true;
				if (!this.was_scanned && S$.ship.sensor_level < SF.SENSOR_NAMES) {
					this.name = "Unknown System";
				}
			},
			// Reset all names in the system.
			ResetNames: function() {
				this.SetName();
				for (let planet of this.planets) {
					planet.ResetNames();
				}
			},
			GenerateAlphaCore: function() {
				this.name = /*"WMD Core "+*/ST.getWord(this.raceseed, this.seed);
        this.planets = [];
				let num_collectors = Math.floor(SU.r(this.seed, 5.51)*6)+2;
				for (let i = 0; i < num_collectors; i++) {
          let planet = new SBar.PlanetData(SU.r(this.seed, 5.52+i)*0.02+0.005, SU.r(this.seed, 61.2)*0.35+(i+1)*0.2, this, i, {is_refractor: true});
          this.planets.push(planet);
				}
        this.numplanets = num_collectors+1;
        let planet = new SBar.PlanetData(SU.r(this.seed, 61.3)*0.15+0.15, SU.r(this.seed, 61.3)*0.35+(num_collectors+1)*0.4, this, num_collectors, {is_battlestation: true});
        this.planets.push(planet);
				
				// One ring with lots.
				this.numbelts = 1;
        this.belts = [];
				let dist = SU.r(this.seed, 61.4)*1.35+(num_collectors+2)*0.4;
				let num_starports = Math.floor(SU.r(this.seed, 61.7)*7)+2;
        let proportion = Math.PI * 2 / num_starports;
				let start = 0;
				for (let i = 0; i < num_starports; i++) {
					//let angle = SU.r(this.seed, dist * 0.2);
					let name = "Pod "+ST.getWord(this.raceseed, 5.12+i);// i;//String.fromCharCode('A'.charCodeAt() + i);
          let angle = start + SU.r(this.seed, dist * 0.2 + i * 0.3) * proportion * 3 / 4;
          var belt = new SBar.BeltData(this, dist, angle, name, i, this.belts.length, true);
					this.belts.push(belt);
          start += proportion;
				}
        this.beltrings = [];
        this.beltrings.push(dist);
				// Party yacht if needed.
				if (this.has_party_yacht) {
					let name = SF.GAME_NAME+" (Party Yacht Edition) 🎉🎈";
          let angle = SU.r(this.seed, 9.32)*PIx2;
					let dist2 = dist+0.3;
          var belt = new SBar.BeltData(this, dist2, angle, name, 0, this.belts.length, false, /*party_yacht=*/true);
					this.belts.push(belt);
          start += proportion;
          this.beltrings.push(dist2);
				}
			},
      addAsteroidBelts: function() {
				this.numbelts = 0;
        this.belts = [];
        this.beltrings = [];
        for (var i = 0; i < this.planets.length - 1; i++) {
          var planet1 = this.planets[i];
          var planet2 = this.planets[i + 1];
          // add a belt chance between every normal / gas giant transition
          if (planet1.ggiant !== planet2.ggiant || this.need_starport) {
            var dist = (planet1.distanceOut + planet2.distanceOut) / 2;
            if (SU.r(this.seed, 63.25 + dist) > 0.5 || this.need_starport) {
              this.addBelt(dist);
            }
          }
        }
        if (this.specialType === SF.SYSTEM_DEAD_ROCKS) {
          // special rocky system, switch planets to asteroids
          for (var i = 0; i < this.numplanets; i++) {
            var p = this.planets[i];
            this.addBelt(p.distanceOut);
            delete this.planets[i];
          }
          delete this.planets;
          this.planets = [];
          this.numplanets = 0;
					if (this.numbelts === 0) {
            this.addBelt(SU.r(this.seed, 1.23));
					}
        }
      },
      addBelt: function(dist) {
        dist *= 1 + (SU.r(this.seed, 155 + dist) - 0.5) / 20;
        this.beltrings.push(dist);

        let beltname = ST.beltName(this.raceseed, this.seed + 55 * (dist + 0.7));

        var numzones = Math.floor(Math.sqrt(dist * this.radius) * 1.5);
        if (numzones < 1) {
            numzones = 1;
        }
        var proportion = Math.PI * 2 / numzones;
        var start = 0;
        for (var j = 0; j < numzones; j++) {
					if (this.numbelts <= 9) {
            var endchar = String.fromCharCode('A'.charCodeAt() + j);
            var angle = start + SU.r(this.seed, dist * 0.2 + j * 0.3) * proportion * 3 / 4;
						let name = beltname + " " + endchar;
						let is_starport = SF.ALL_STARPORTS || (this.race_controls_system && SU.r(this.seed, dist+j) < 0.05);
						if (this.need_starport) {
							is_starport = true;
							this.need_starport = false;
						}
						is_starport &= !this.in_alpha_bubble;
						if (is_starport) {
							name = "Starport "+ST.getWord(this.raceseed, dist+j);
						}
            var belt = new SBar.BeltData(this, dist, angle, name, j, this.belts.length, is_starport);
            this.belts.push(belt);
            start += proportion;
						this.numbelts++;
					}
        }
      },
      teardown: function() {
        if (this.tier !== null) {
          this.tier.fullteardown();
        }
        for (var obj in this.planets) {
          this.planets[obj].teardown();
          delete this.planets[obj];
        }
        delete this.planets;
        for (var obj in this.belts) {
          this.belts[obj].teardown();
          delete this.belts[obj];
        }
        delete this.belts;
      },
      isDead: function() {
        return this.specialType === SF.SYSTEM_DEAD_MIXED || this.specialType === SF.SYSTEM_DEAD_ROCKS || this.specialType === SF.SYSTEM_DEAD_TREASURE;
      },
      activateTier: function() {
        if (!this.generated) {
          this.generate();
        }
        if (this.tier === null) {
          this.tier = new SBar.SystemTier(this);
        }
        this.tier.activate();
      },
			// Works around any re-entry bugs from the starmap.
			ActivateFreshTier: function() {
				this.generated = false;
				this.tier = null;
				this.activateTier();
			},
      // Returns a common seed for all systems in a nebula.
      nebulaRegionSeed: function() {
        const nebData = this.regionData.getNebulaAt(this.x, this.y);
        if (nebData === null) {
					return null;
				}
				return SU.r(nebData.parent.seed, nebData.x + nebData.y);
				/*
        if (this.drewNebula) {
          return;
        }
        var nebData = this.regionData.getNebulaAt(this.x, this.y);
        if (nebData !== null) {
          //var neb = new nebData.sbarObj(this.tier, nebData); // nebula or badland
					var neb = new SBar.IconStructNebula(this.tier, nebData);
          neb.buildImage();
          neb.updateForSystem(this.x, this.y, SC.layer1);
          delete neb;
        }
        this.drewNebula = true;
				*/
      },
			// Immediate scan, like from SF.TYPE_OBSERVATORY.
			// In the data object so it doesn't need to generate a tier.
			ScanNodelay(/*optional*/long_range_scan) {
				if (!this.generated) {
					this.generate();
				}
				for (let planet of this.planets) {
					S$.AddBuildings(planet, long_range_scan);
				}
				for (let belt of this.belts) {
					S$.AddBuildings(belt);
				}
				S$.AddSystemBuildingData(this);
			},
			/*
			GetTravelRenderer: function() {
				if (!this.travel_renderer) {
					this.travel_renderer = new SBar.TravelRenderer(this);
				}
				return this.travel_renderer;
			},
			*/
			// Interstellar will arrive at this point. Function of the system+ship.
			GetSystemEntryPoint: function() {
				const seed = this.seed+S$.ship.seed;
				let scale = 8;
				return {x: SU.r(seed, 1.1)*scale-scale/2, y: SU.r(seed, 1.2)*scale-scale/2, z: SU.r(seed, 1.3)*scale-scale/2};
			}
    };
    SU.extend(SBar.SystemData, SBar.Data);
})();

	
