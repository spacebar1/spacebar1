/*
 * Asteroid Belt Data, generate to fill out for rendering
 * 
 * Some params like name are consistent across ring and need to be generated above
 */
(function() {

    var NONE = 0;
    var MINERAL = 1;
    var MINERS = 2;
    var PIRATES = 3;
    var DERELICTS = 4;

    SBar.BeltData = function(systemDataIn, distanceOutIn, angleIn, nameIn, numInRingIn, index, is_starport, is_party_yacht) {
        this._initBeltData(systemDataIn, distanceOutIn, angleIn, nameIn, numInRingIn, index, is_starport, is_party_yacht);
    };

    SBar.BeltData.prototype = {
      // finals
      type: SF.TYPE_BELT_DATA,
      //radius: 20,
      //tilew: 5, // tile matrix width. should match beltrad.
      //tilesize: 100, // tile width
      //beltrad: 4, // radius of belt, in tiles
			beltrad: 300,
      randomssize: 567,
      //ASTEROID: 1, // start tile defs
      // passed in
      systemData: null,
      distanceOut: null,
      numInRing: null,
      name: null,
      angle: null, // angle to the star, angle of cloud is tangental
      index: null, // belt index in system data object, for lookup
			is_starport: false,
			is_party_yacht: false,
			starport_rad: null, // 0-1 proportion of map radius.
			starport_spokes: null,
			is_pirate_base: false,
			
      // local objects
      level: null,
      x: null, // absolute position
      y: null,
      seed: null,
      raceseed: null,
      natives: null, // natives occupying belt and defs
      surface: null,
      setup: false,
      dustStamp: null, // image to use as a dust pattern
      planetTerrain: null,
      justentered: false,
      //tiles: null, // 20x20, centered at 0,0
      entryrad: null,
      tier: null,
      otherType: null, // buildings can be bars and this type
      // Contained objects
      MINERAL: 1, // used by asteroid
      faction: null,
      asteroids: null,
      randoms: null, // reusable random map
			num_asteroids: null,
			building_types: null,
			buildings_set: false,
      _initBeltData: function(systemDataIn, distanceOutIn, angleIn, nameIn, numInRingIn, index, is_starport, is_party_yacht) {
          this.distanceOut = distanceOutIn;
          this.systemData = systemDataIn;
          this.numInRing = numInRingIn;
          this.name = nameIn;
          this.angle = angleIn;
          this.index = index;
          this.level = this.systemData.level;
					this.is_starport = is_starport;
					this.is_party_yacht = is_party_yacht;
          //this.entryrad = this.beltrad * this.tilesize * 1.5;
          this.asteroids = [];
          //this.tiles = [];

					if (!this.systemData.was_scanned && S$.ship.sensor_level < SF.SENSOR_NAMES) {
						this.name = this.is_starport ? "Unknown Starport" : "Unknown Belt";
					}					
          var starRadius = this.systemData.radius;
          var starx = this.systemData.x;
          var stary = this.systemData.y;
          this.seed = SU.r(this.systemData.seed, (starx + 0.9) * (stary + 0.5) * starRadius * this.distanceOut + this.numInRing); // unique seed for this clump
          this.ring_seed = SU.r(this.systemData.seed, (starx + 0.9) * (stary + 0.5) * starRadius * this.distanceOut); // shared seed for all clumps in ring
          this.raceseed = this.systemData.raceseed;

          //this.angle = Math.PI*2*this.seed;
          this.x = Math.sin(this.angle) * this.distanceOut;
          this.y = Math.cos(this.angle) * this.distanceOut;
          this.x += starx;
          this.y += stary;
					
          //this.minerals = SU.r(this.seed, 20.2);
          //if (this.systemData.specialType === SF.SYSTEM_DEAD_TREASURE) {
          //    this.minerals = 1;
          //}
          this.num_asteroids = Math.floor(SU.r(this.seed, 0.5) * 10) + 1;
					if (this.is_starport) {
						this.starport_rad = SU.r(this.seed, 1.90)*0.5+0.25;
						this.num_asteroids = Math.floor(SU.r(this.seed, 0.5) * 16*this.starport_rad) + 2;
						this.starport_spokes = Math.floor(SU.r(this.seed, 1.92)*6)+2;
					}
					this.building_types = [];
					this.genBuildingTypes();
      },
			generate: function() {
				this.Setup();
			},
			genBuildingTypes: function() {
				if (this.buildings_set) {
					return;
				}
				this.buildings_set = true;
				if (this.is_party_yacht) {
					let faction = SF.FACTION_ALPHA;
					this.yacht_building_places = [];
					this.building_types.push([SF.TYPE_ALPHA_DANCE, faction]);
					this.yacht_building_places.push([SF.WIDTH*0.5, SF.HEIGHT*0.45]);
					this.building_types.push([SF.TYPE_ALPHA_HQ, faction]);
					this.yacht_building_places.push([SF.WIDTH*0.5, SF.HEIGHT*0.67]);
					for (let i = 0; i < 4; i++) {
						this.building_types.push([SF.TYPE_BAR, faction]);
					}
					for (let i = 0; i < 2; i++) {
						this.building_types.push([SF.TYPE_ALPHA_BARRACKS, faction]);
					}
					for (let i = 0; i < 4; i++) {
						this.building_types.push([SF.TYPE_BAR, faction]);
					}
					// Bars.
					this.yacht_building_places.push([SF.WIDTH*0.32, SF.HEIGHT*0.45]);
					this.yacht_building_places.push([SF.WIDTH*0.35, SF.HEIGHT*0.52]);
					this.yacht_building_places.push([SF.WIDTH*0.65, SF.HEIGHT*0.52]);
					this.yacht_building_places.push([SF.WIDTH*0.68, SF.HEIGHT*0.45]);
					// Barracks.
					this.yacht_building_places.push([SF.WIDTH*0.42, SF.HEIGHT*0.62]);
					this.yacht_building_places.push([SF.WIDTH*0.58, SF.HEIGHT*0.62]);
					// Bars.
					this.yacht_building_places.push([SF.WIDTH*0.47, SF.HEIGHT*0.51]);
					this.yacht_building_places.push([SF.WIDTH*0.53, SF.HEIGHT*0.51]);
					this.yacht_building_places.push([SF.WIDTH*0.46, SF.HEIGHT*0.76]);
					this.yacht_building_places.push([SF.WIDTH*0.54, SF.HEIGHT*0.76]);
					let airport_distance = SF.HEIGHT*0.43;
					let angle = -Math.PI/2;
					let end_angle = Math.PI/2;
					let angle_diff = (end_angle-angle)/9;					
					for (let i = 0; i < 10; i++) {
						if (i < 2 || i >= 8) {
							this.building_types.push([SF.TYPE_BAR, faction]);
						} else {
							this.building_types.push([SF.TYPE_ALPHA_AIRPORT, faction]);
						}
						this.yacht_building_places.push([Math.round(SF.HALF_WIDTH+Math.sin(angle)*airport_distance), Math.round(SF.HALF_HEIGHT*0.9+Math.cos(angle)*airport_distance)]);
						angle += angle_diff;
					}
					return;
				}
				if (this.is_starport) {
					let faction = SF.FACTION_NORMAL;
					if (this.systemData.in_alpha_bubble) {
						faction = SF.FACTION_ALPHA;
					}
					for (let i = 0; i < this.num_asteroids; i++) {
						let rand_type = SU.r(this.seed, 51.2+i);
						if (rand_type < 0.5) {
							this.building_types.push([]); // None.
						} else if (rand_type < 0.55) {
							this.building_types.push([SF.TYPE_BAR, faction]);
						} else if (rand_type < 0.6) {
							this.building_types.push([SF.TYPE_LAB, faction]);
						} else if (rand_type < 0.65) {
							this.building_types.push([SF.TYPE_ARMORY, faction]);
						} else if (rand_type < 0.70) {
							this.building_types.push([SF.TYPE_CONSTRUCTION, faction]);
						} else if (rand_type < 0.75) {
							this.building_types.push([SF.TYPE_SHIPYARD, faction]);
						} else if (rand_type < 0.80) {
							this.building_types.push([SF.TYPE_JOB, faction]);
						} else if (rand_type < 0.85) {
							this.building_types.push([SF.TYPE_OBSERVATORY, faction]);
						} else if (rand_type < 0.90) {
							this.building_types.push([SF.TYPE_HOTEL, faction]);
						} else {
							this.building_types.push([SF.TYPE_COLONY, faction]);
						}
					}
					// Randomly set (probably) a shipyard and (definitely) a bar.
					this.building_types[Math.floor(SU.r(this.seed, 74.12)*this.num_asteroids)] = [SF.TYPE_SHIPYARD, faction];
					this.building_types[Math.floor(SU.r(this.seed, 74.13)*this.num_asteroids)] = [SF.TYPE_BAR, faction];
					// Always have an information station in the center.
					this.building_types.push([SF.TYPE_INFORMATION, SF.FACTION_NORMAL]);  // Always friendly.
					this.num_asteroids++;
					if (this.systemData.in_alpha_bubble) {
						for (let i = 0; i < this.num_asteroids; i++) {
							if (this.building_types[i].length === 0) {
								this.building_types[i] = [SF.TYPE_ALPHA_BARRACKS, faction];
							}
						}
					}
					return;
				}
				if (SU.r(this.seed, 51.1) < 0.7 || this.systemData.in_alpha_bubble) {
					// Empty.
					return;
				} else if (this.building_types.length === 0 && SU.r(this.seed, 97.18) < 0.03) {
					// Small chance of an obelisk.
					this.building_types.push([SF.TYPE_OBELISK, SF.FACTION_NORMAL]);
					return;
				}
				
				let race_system = this.systemData.race_controls_system;
				if (race_system) {
					if (SU.r(this.seed, 51.5) < 0.5) {
						// Only a few asteroids getting mined in core systems.
						let num = Math.floor(SU.r(this.seed, 51.4)*3)+1;
						for (let i = 0; i < num && i < this.num_asteroids; i++) {
							this.building_types.push([SF.TYPE_MINING, SF.FACTION_NORMAL]);
						}
					}					
					return;
				}
				// Border system, thar be pirates afoot.
				this.is_pirate_base = SU.r(this.seed, 51.7) < 0.1;
				if (this.is_pirate_base) {
					for (let i = 0; i < this.num_asteroids; i++) {
						let rand_type = SU.r(this.seed, 51.9+i);
						if (rand_type < 0.4) {
							this.building_types.push([]); // None.
						} else if (rand_type < 0.5) {
							this.building_types.push([SF.TYPE_BAR, SF.FACTION_PIRATE]);
						} else if (rand_type < 0.6) {
							this.building_types.push([SF.TYPE_JOB, SF.FACTION_PIRATE]);
						} else if (rand_type < 0.7) {
							this.building_types.push([SF.TYPE_LAB, SF.FACTION_PIRATE]);
						} else if (rand_type < 0.8) {
							this.building_types.push([SF.TYPE_ARMORY, SF.FACTION_PIRATE]);
						} else if (rand_type < 0.85) {
							this.building_types.push([SF.TYPE_ARENA, SF.FACTION_PIRATE]);
						} else if (rand_type < 0.9) {
							this.building_types.push([SF.TYPE_SHIPYARD, SF.FACTION_PIRATE]);
						} else {
							this.building_types.push([SF.TYPE_CONSTRUCTION, SF.FACTION_PIRATE]);
						}
					}
					// Always have a specially skinned bar in the center.
					this.building_types.push([SF.TYPE_BAR, SF.FACTION_PIRATE]);
					this.num_asteroids++;
					return;
				}
				
				var rand_type = SU.r(this.seed, 51.2);
				if (rand_type < 0.2) {
					// Mining.
					var num = Math.floor(SU.r(this.seed, 51.3)*2)+1;
					for (var i = 0; i < num && i < this.num_asteroids; i++) {
						this.building_types.push([SF.TYPE_MINING, SF.FACTION_NORMAL]);
					}
				} else if (rand_type < 0.25) {
				  this.building_types.push([SF.TYPE_DERELICT, SF.FACTION_NORMAL]);
				} else if (rand_type < 0.3) {
					this.building_types.push([SF.TYPE_DERELICT, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.35) {
					this.building_types.push([SF.TYPE_DERELICT, SF.FACTION_ALPHA]);
				} else if (rand_type < 0.5) {
					this.building_types.push([SF.TYPE_BAR, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.55) {
					this.building_types.push([SF.TYPE_CONSTRUCTION, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.62) {
					this.building_types.push([SF.TYPE_JOB, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.75) {
					this.building_types.push([SF.TYPE_LAB, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.85) {
					this.building_types.push([SF.TYPE_ARMORY, SF.FACTION_PIRATE]);
				} else if (rand_type < 0.9) {
					this.building_types.push([SF.TYPE_ARENA, SF.FACTION_PIRATE]);
				} else {
					this.building_types.push([SF.TYPE_SHIPYARD, SF.FACTION_PIRATE]);
				}
			},
			Setup: function() {
        if (!this.setup) {
          this.generateRandomArray(); // pregenerated randoms for contained objects to use
          this.placeObjects();
          this.setup = true;
				}
			},
      generateRandomArray: function() {
          this.randoms = [];
          this.randoms.length = this.randomssize;
          for (var i = 0; i < this.randomssize; i++) {
              this.randoms[i] = Math.random() - 0.5;
          }
      },
      placeObjects: function() {
				if (this.is_party_yacht) {
					for (let i = 0; i < this.building_types.length; i++) {
						let x = this.yacht_building_places[i][0];
						let y = this.yacht_building_places[i][1];
						let building = new SBar.BuildingData(this, x, y, this.building_types[i][0], this.building_types[i][1]);
	          this.asteroids.push({x: x, y: y, bdata: building});						
					}
					return;
				}
				if (this.is_starport || this.is_pirate_base) {
					// Place in a ring.
					let rot = SU.r(this.seed, 120.1)*PIx2;
					for (let i = 0; i < this.num_asteroids; i++) {
						if (!this.starport_rad) {
							this.starport_rad = SU.r(this.seed, 1.93)*0.5+0.25;  // for pirate base.
						}
						rot += PIx2/(this.num_asteroids-1);
						let x = Math.round(Math.cos(rot)*this.starport_rad*SF.HALF_HEIGHT)+SF.HALF_WIDTH;
						let y = Math.round(Math.sin(rot)*this.starport_rad*SF.HALF_HEIGHT)+SF.HALF_HEIGHT;
						if (i === this.num_asteroids - 1) {
							// Special building in the center. Information station for starports and skull bar for pirate base.
							x = SF.HALF_WIDTH;
							y = SF.HALF_HEIGHT;
						}
						let building = this.building_types[i].length == 0 ? null :
    						new SBar.BuildingData(this, x, y, this.building_types[i][0], this.building_types[i][1]);
            this.asteroids.push({x: x, y: y, bdata: building});						
					}
					return;
				}
				
          // mass is roughly 0 to 1.5
					var cos_theta = Math.cos(-this.angle);
					var sin_theta = Math.sin(-this.angle);

          var placed = 0;
          var tries = 500;
          while (placed < this.num_asteroids && tries > 0) {
            var xpos = (SU.r(this.seed, 549.1+tries)*2-1) * this.beltrad;  // [-1, 1].
						var ypos = (SU.r(this.seed, 551.1+tries)*2-1)*(this.beltrad-Math.sqrt(Math.abs(xpos)*17.3))/2;
            var x = Math.round(xpos*cos_theta-ypos*sin_theta)+SF.HALF_WIDTH;
            var y = Math.round(xpos*sin_theta+ypos*cos_theta)+SF.HALF_HEIGHT;
						var clear = true;
						for (var i = 0; i < this.asteroids.length; i++) {
							var comparison = this.asteroids[i];
							var dx = comparison.x-x;
							var dy = comparison.y-y;
							if (dx*dx+dy*dy < 4900) { // Within 70.
								clear = false;
								break;
							}
						}
						if (clear) {
              var building = null;
							if (this.building_types.length > placed) {
								var building_type = this.building_types[placed];
                building = new SBar.BuildingData(this, x, y, building_type[0], building_type[1]);
							}
              this.asteroids.push({x: x, y: y, bdata: building});
              placed++;
						}
            tries--;
          }

      },
      activateTier: function() {
        if (!this.setup) {
            this.Setup();
        }
        this.justentered = true;
        //if (this.tier === null) {
			  // Don't cache the tier in case buildings changed.
				// But preserve the x/y.
				const old_tier = this.tier;
        this.tier = new SBar.BeltTier(this);
				if (old_tier && old_tier.shipx) {
					this.tier.shipx = old_tier.shipx;
					this.tier.shipy = old_tier.shipy;
				}
			  //}
        this.tier.activate();
				return this.tier;
      },
      teardown: function() {
          if (this.tier !== null) {
              this.tier.teardown();
          }
          delete this.asteroids;
          delete this.tiles;
      },
			
			//
			// Fields with planetside terrain compatibility.
			// 
			GetTerrainType: function() {
				return SF.TLAND;
			},
			GetTerrainHeat: function(x, y) {
				// return 200;
				
				// Similar to 3planetD.
	      // luminosity / distance-squared
	      this.radiationfactor = this.systemData.radius / (this.distanceOut) * 3;
	      // base solar heat, no atmosphere
	      var min = 5 * this.radiationfactor;
	      var max = 20 * this.radiationfactor;
				return Math.round(SU.r(this.seed, 1.23+x+y)*(max-min)+min);
			},
			GetTerrainHeight: function() {
				return 0;
			},
			getPlanetTerrain: function() {
	      if (this.planetTerrain === null) {
					this.radius = 10;
					this.cloud = false;
					this.atmosphere = 0;
					this.tectonics = 0.01;
	        this.planetTerrain = new SBar.PlanetTerrain(this, /*cloud=*/false);
					this.haswater = false;
					this.hasmethane = false;
					this.tempmax = 210;
					this.tempmin = 190;
					this.ggiant = false;
					this.tile = 0;
					this.windspeed = 0;
					this.waterworld = false;
					this.maxtemplat = 90;
					this.life = false;
					this.lavatemp = 900;
					this.tempmid = 200;
					this.moons = [];
	      }
	      return this.planetTerrain;
				
			},
			getCloudTerrain: function() {
				return this.getPlanetTerrain();
			},
			isFloating: function() {
				return false;
			},
			
			// This isn't data, but it's a convenient place to have common drawing for the starport.
			// Caller should center the context.
			DrawStarport: function(context, radius) {
				if (!this.starport_image) {
					this.starport_image = {};
				}
				if (!this.starport_image[radius]) {
					this.starport_image[radius] = document.createElement('canvas');
	        this.starport_image[radius].width = SF.WIDTH;
	        this.starport_image[radius].height = SF.HEIGHT;
					let new_context = this.starport_image[radius].getContext('2d');
					new_context.save();
					new_context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
					if (this.systemData.in_alpha_bubble) {
						this.DrawAlphaStarport(new_context, radius);
					} else {
						this.DrawBaseStarport(new_context, radius);
					}
					new_context.restore();
				}
				context.drawImage(this.starport_image[radius], -SF.HALF_WIDTH, -SF.HALF_HEIGHT);
			},
				
			DrawBaseStarport: function(context, radius) {
				context.save();
				let colors = this.StarportColors();
				let width = (SU.r(this.seed, 1.91)*0.7+0.05)*radius/6;
				// Multiply by 2 here, so the gradient can overshoot the radius.
				let color_stops = [(radius-width)/radius/2-0.01, 'rgba(0,0,0,0)', (radius-width)/radius/2-0.01, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)', (radius-width)/radius/2, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 0.5, 'rgba(255,255,255,1)', (radius+width)/radius/2, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', (radius+width)/radius/2+0.01, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)',  (radius+width)/radius/2+0.01, 'rgba(0,0,0,0)'];
				SU.circleRad(context, 0, 0, radius*2, color_stops)
				context.rotate(SU.r(this.seed, 1.93)*PIx2);
				let spokes = this.starport_spokes;
				context.save();
				context.globalCompositeOperation = 'lighten';
				for (let i = 0; i < spokes; i++) {
					context.rotate(PIx2/spokes);
					// Rescale the color stops 0->1.
					color_stops = [0, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)', 0.1, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 0.5, 'rgba(255,255,255,1)', 0.9, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 1, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)'];
					SU.rectGrad(context, -radius, -width, radius, width*2, 0,-width, 0, width, color_stops);
				}
				// Inner hub light.
				context.globalCompositeOperation = 'behind';
				color_stops = [0, 'rgba(255,255,255,1)', 1, 'rgba('+colors.r+','+colors.g+','+colors.b+',0.0)'];
				SU.circleRad(context, 0, 0, radius, color_stops)				
				context.restore();
				context.restore();
			},
			DrawAlphaStarport: function(context, radius) {
				let pattern = SU.GetAlphaPattern(this.seed);
				let fullsize = radius*2.7;
				let halfsize = fullsize/2;
				context.drawImage(pattern, -halfsize, -halfsize, fullsize, fullsize)
				context.save();
				context.globalCompositeOperation = "destination-in";
//				let color_stops = [0, 'rgba(0,0,0,1)', 1, 'rgba(50,50,50,0.0)'];
//				let color_stops = [0, 'rgba(50,50,50,1)', 1, 'rgba(0,0,0,0)'];
				let color_stops = [0, 'rgba(0,0,0,0)', 1, 'rgba(50,50,50,1)'];
				SU.circleRad(context, 0, 0, halfsize, color_stops)
				context.globalCompositeOperation = "destination-over";  // Behind
				SU.circle(context, 0, 0, halfsize, "#000");
				// White halo.
				//color_stops = [0, 'rgba(255,255,255,1)', 1, 'rgba(255,255,255,0)'];
				//SU.circleRad(context, 0, 0, halfsize*1.5, color_stops)
				context.restore();				
				if (radius > 20) {
					// Quick check to not put halos on the icon.
					SU.DrawAlphaHalo(context, this.seed, 0, 0, radius*2);
				}
				
				/*
				context.save();
				let colors = this.StarportColors();
				let width = (SU.r(this.seed, 1.91)*0.7+0.05)*radius/6;
				// Multiply by 2 here, so the gradient can overshoot the radius.
				let color_stops = [(radius-width)/radius/2-0.01, 'rgba(0,0,0,0)', (radius-width)/radius/2-0.01, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)', (radius-width)/radius/2, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 0.5, 'rgba(255,255,255,1)', (radius+width)/radius/2, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', (radius+width)/radius/2+0.01, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)',  (radius+width)/radius/2+0.01, 'rgba(0,0,0,0)'];
				SU.circleRad(context, 0, 0, radius*2, color_stops)
				context.rotate(SU.r(this.seed, 1.93)*PIx2);
				let spokes = this.starport_spokes;
				context.save();
				context.globalCompositeOperation = 'lighten';
				for (let i = 0; i < spokes; i++) {
					context.rotate(PIx2/spokes);
					// Rescale the color stops 0->1.
					color_stops = [0, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)', 0.1, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 0.5, 'rgba(255,255,255,1)', 0.9, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 1, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)'];
					SU.rectGrad(context, -radius, -width, radius, width*2, 0,-width, 0, width, color_stops);
				}
				// Inner hub light.
				context.globalCompositeOperation = 'behind';
				color_stops = [0, 'rgba(255,255,255,1)', 1, 'rgba('+colors.r+','+colors.g+','+colors.b+',0.0)'];
				SU.circleRad(context, 0, 0, radius, color_stops)				
				context.restore();
				context.restore();
				*/
			},
			// Loosely based on the Gamemaster's party ship from Thor Ragnarok.
			DrawAlphaPartyYacht: function(ctx, width, height) {
				//SU.circle(context, 0, 0, size/2, "#F00");
				let size = height;
				let half = height/2;
				
				//DrawAlphaHalo: function(context, seed, x, y, target_radius) {
				let s = 0;
				SU.DrawAlphaHalo(ctx, S$.time+s++, SU.r(1, S$.time+s++)*size/10-size/20, SU.r(1, S$.time+s++)*size/10-size/20, Math.floor(SU.r(1, S$.time+s++)*half/2)+half/2);
				SU.DrawAlphaHalo(ctx, S$.time+s++, SU.r(1, S$.time+s++)*size/10-size/20, SU.r(1, S$.time+s++)*size/10-size/20, Math.floor(SU.r(1, S$.time+s++)*half/2)+half/2);
				SU.DrawAlphaHalo(ctx, S$.time+s++, SU.r(1, S$.time+s++)*size/10-size/20, SU.r(1, S$.time+s++)*size/10-size/20, Math.floor(SU.r(1, S$.time+s++)*half/2)+half/2);
				
	      ctx.beginPath();
				// Arc: x, y, rad, start angle, end angle. optional counterclockwise.
        // Angle of 0 is right.
				ctx.arc(0, -half*0.05, half*0.95, Math.PI*0.5, Math.PI*1.4);  // Outer arc.
	      ctx.arc(0, -half*0.2, half*0.8, Math.PI*1.4, Math.PI*0.6, true); // Back in.
	      ctx.arc(0, -half*0.2, half*0.6, Math.PI*0.7, Math.PI*1.3); // Inner outer arc.
	      ctx.arc(0, -half*0.4, half*0.4, Math.PI*1.3, Math.PI*0.7, true);
				// Middle circle and spin around.
	      ctx.arc(0, -half*0.1, half*0.2, Math.PI*0.9, Math.PI*0.1);
				// Symetric on the other side.
	      ctx.arc(0, -half*0.4, half*0.4, Math.PI*0.3, -Math.PI*0.3, true);
	      ctx.arc(0, -half*0.2, half*0.6, -Math.PI*0.3, Math.PI*0.3);
	      ctx.arc(0, -half*0.2, half*0.8, Math.PI*0.4, -Math.PI*0.4, true);
				ctx.arc(0, -half*0.05, half*0.95, -Math.PI*0.4, Math.PI*0.5);
				
				
	      ctx.closePath();
				let pattern = SU.GetFillPattern(17, 12.34, 255, 255, 255, 255);  // Seed from the main game seed.

        ctx.fillStyle = pattern;
				ctx.fillStyle = "#FFF";
        ctx.fill();
				ctx.save();
				ctx.globalCompositeOperation = "source-in";				
				ctx.drawImage(pattern, -width/2, -half, width, height)
				ctx.restore();
				
        ctx.lineWidth = size/80;
        ctx.strokeStyle = "#444";
        ctx.stroke();
			},
			StarportColors: function() {
				return {r: Math.floor(SU.r(this.seed, 1.87)*256),
		        		g: Math.floor(SU.r(this.seed, 1.88)*256),
								b: Math.floor(SU.r(this.seed, 1.89)*256)};
			},
			// For parity with planets.
			GetRawTerrainHeight: function(x, y) {
				return 128;
			},
			GetAsteroidAt: function(x, y) {
				for (let asteroid of this.asteroids) {
					if (asteroid.x == x && asteroid.y == y) {
						return asteroid;
					}
				}
				error("nogetast");
				return null;
			},
			// Returns the richness of minerals.
			GetAreaMinerals: function() {
				area_minerals = SU.r(this.seed, 8.2);
				let system_minerals = SU.r(this.systemData.seed, 8.3);
				return area_minerals * system_minerals;
			},
			ClearShipPosition: function() {
				if (this.tier) {
					this.tier.shipx = null;
					this.tier.shipy = null;
				}
			},
    };
    SU.extend(SBar.BeltData, SBar.Data);
})();

	
