/*
 * A region is an block of space and its contained stars, structures, etc.
 * Regions allow for fast lookup of objects in an area that can be queried from anywhere.
 * Region structures and races may overlap into adjacent regions (see following details).
 * 
 * Structure placement strategy:
 *   - Small number of structures/zone
 *   - Random placement of structures in a region, can go up to SF.REGION_SIZE/2 into adjacent (static RegionData.getStructures used by this class)
 *   - When structure placements conflict, region with higher seed gets priority
 *   - Zones query all adjacent structures to compute conflicts and resolve structures (RegionData.resolveStructures)
 *   - Then place stars after resolving
 *   - Races are generated similar to the structures, and can overlap by SF.REGION_SIZE/2.
 * 
 * Nebulas contain stars, systems without stars, and asteroid systems and asteroid systems without stars  
 * Nebulas are added after normal structs resolve, so they shouldn't interfere with any collision detection
 *   
 * Structure data object:
 *   {x, y, rad, rseed, type, sbarObj, name, parent}
 *   
 * Race object structure:
 * 						let race_obj = {level: level, seed: race_seed, alignment: alignment};
 *					race_obj.bubbles = [{x: racex, y: racey, size: main_size}];
 */

(function() {
	
	let year = 365*24;
	let week = 7*24;

    var MAX_STRUCT_SIZE = SF.REGION_SIZE/2;
    var MIN_STRUCT_SIZE = SF.REGION_SIZE / 8;
    var RANGE_STRUCT_SIZE = MAX_STRUCT_SIZE - MIN_STRUCT_SIZE;
    var MIN_NEB_SIZE = SF.REGION_SIZE / 20;
    var MAX_NEB_SIZE = SF.REGION_SIZE / 6;
    var RANGE_NEB_SIZE = MAX_NEB_SIZE - MIN_NEB_SIZE;
    var REGION_OVERLAP = 0.3; // 30% overlap
		var HALF_REGION_SIZE = SF.REGION_SIZE / 2;

    SBar.RegionData = class {
      type = SF.TYPE_REGION;
      seed = null;
      x = 0;
      y = 0;
      allStructs = null;
      myStructs = null;
      systems = null;
			allRaces = null;  // Race regions. Level-ordered list of {level, seed, friendly, bubbles: list of {x, y, size}}. Size is radius.
			myRaces = null;  // Races for just this region.
			allAlphas = null;
			myAlphas = null;
      wormholes = null; // unresolved indices to regions
      placedWormholes = 0;
			constructor(xIn, yIn) {
					// Generation time is in the 0.5ms range. A bit less on average. Up to 2ms.
					// IconMapRegion is somewhere around 1ms.
					// To track time do:
					// var t1 = performance.now(); var t0 = performance.now();. write ("Time1: " + (t1 - t0));
            this.systems = [];
            this.x = SU.AlignByRegion(xIn);
            this.y = SU.AlignByRegion(yIn);
            this.seed = SBar.RegionData.getSeed(this.x, this.y);

            this.resolveStructures();
            this.resolveRaces();
            this.resolveAlphas();

            // Generate the structure types
            for (var i = 0; i < this.myStructs.length; i++) {
                var struct = this.myStructs[i];
                var randtype = SU.r(this.seed, i + 7.65);
                if (randtype >= 0.8) {
                    struct.type = SF.TYPE_STRUCT_MINEFIELD;
                    this.systems.push(new SBar.SystemData(this, struct.x, struct.y, SF.SYSTEM_DEAD_TREASURE));
                    struct.sbarObj = SBar.IconStructMinefield;
                } else if (randtype >= 0.6) {
                    struct.type = SF.TYPE_STRUCT_WALL;
                    struct.sbarObj = SBar.IconStructWall;
                } else if (randtype >= 0.4) {
                    struct.type = SF.TYPE_STRUCT_BADLAND;
                    this.systems.push(new SBar.SystemData(this, struct.x, struct.y, SF.SYSTEM_DEAD_TREASURE));
                    struct.sbarObj = SBar.BadlandStructIcon;
                } else if (randtype >= 0.07) {
                    struct.type = SF.TYPE_STRUCT_BARREN;
                    struct.sbarObj = SBar.BarrenStructIcon;
                } else {
                    struct.type = SF.TYPE_STRUCT_BLACKHOLE;
                    struct.sbarObj = SBar.BlackholeStructIcon;
                }
            }

            this.connectWormholeRegions();
            this.addNebulas();
            this.addRemainingWormholes();

            // fill out details for all structs
            for (var i = 0; i < this.myStructs.length; i++) {
                var struct = this.myStructs[i];
                struct.name = ST.structName(SU.r(this.seed, struct.x + struct.y), struct.type);
								if (S$.ship.sensor_level < SF.SENSOR_NAMES) {
									struct.name = "Unknown";
								}
                struct.parent = this;
            }

            var num_systems = Math.floor(SU.r(this.seed, 72.27) * 71) + 30; // 30-100
            for (var z = 0; z < num_systems; z++) {
                var systemx = this.x + SU.r(this.seed, z + 1.23) * SF.REGION_SIZE;
                var systemy = this.y + SU.r(this.seed, z + 5.67) * SF.REGION_SIZE;
                systemx = Math.floor(systemx);
                systemy = Math.floor(systemy);
                var clear = true;
                for (var obj in this.allStructs) {
                    var check = this.allStructs[obj];
                    var diffx = check.x - systemx;
                    var diffy = check.y - systemy;
                    var dist = check.rad + 15;
                    if (diffx * diffx + diffy * diffy < dist * dist) {
                        // overlapping with structure, skip
                        clear = false;
                        break;
                    }
                }
                if (!clear) for (var obj in this.systems) {
                    var check = this.systems[obj];
                    var diffx = check.x - systemx;
                    var diffy = check.y - systemy;
                    var dist = check.radius + 15;
                    if (diffx * diffx + diffy * diffy < dist * dist) {
                        // overlapping stars, skip
                        clear = false;
                        break;
                    }
                }
                if (clear && Math.abs(systemx)+Math.abs(systemy) > 1000) {  // Keep them away from 0,0.
                    this.systems.push(new SBar.SystemData(this, systemx, systemy));
                }
            }
						if (SBar.RegionData.IsZedZed(this.x, this.y)) {
							// Special case to add the home system.
              this.systems.push(new SBar.SystemData(this, 0, 0, SF.SYSTEM_ARTH));
						}
						
						// Hide any systems covered by alpha regions.
						// And also mark when the systems are in a visible bubble.
						let me = this;
						this.systems = this.systems.filter(function(system) {  // filter() needs true to keep it.
							let clear = true;
						  for (let alpha of me.allAlphas) {
								for (let bubble of alpha.bubbles) {
                   let diffx = bubble.x - system.x;
                   let diffy = bubble.y - system.y;
  								 let dist = bubble.size;
                   if (diffx * diffx + diffy * diffy < dist * dist) {
										clear = false;
										break;
									}
								}
								// Unless the ship is in the bubble.
								if (!clear && S$.in_alpha_space) {
									for (bubble of S$.alpha_bubbles) {
                    let diffx = bubble.x - system.x;
                    let diffy = bubble.y - system.y;
										let dist = bubble.size;
                    if (diffx * diffx + diffy * diffy < dist * dist) {
											clear = true;
											system.in_alpha_bubble = true;
											break;
										}
									}
								}							
							}
							return clear;
						});
						
        }
				// Needs to be static for calling from other regions (don't store as a member variable).
				static IsZedZed(x, y) {
					return x === 0 && y === 0;
				}
        // try adding nebula groups, in empty areas as structs
        // Nebulas also add stars to the systems obj
        addNebulas() {
            var wormholed = false;
            var num = Math.floor(SU.r(this.seed, 27.1) * 5) + 2; // 2~6
            var tries = 50;
            var nebs = [];
            for (var i = 0; i < tries && num > 0; i++) {
                var structx = this.x + SU.r(this.seed, i + 27.67) * (SF.REGION_SIZE - RANGE_NEB_SIZE * 2) + RANGE_NEB_SIZE;
                var structy = this.y + SU.r(this.seed, i + 27.78) * (SF.REGION_SIZE - RANGE_NEB_SIZE * 2) + RANGE_NEB_SIZE;
                var rad = SU.r(this.seed, i + 27.89) * RANGE_NEB_SIZE + MIN_NEB_SIZE;
                rad /= 2;
                // check collision and throw out if needed
                var clear = true;
                for (var j = 0; j < this.allStructs.length; j++) {
                    var check = this.allStructs[j];
                    var diffx = check.x - structx;
                    var diffy = check.y - structy;
                    var okdist = check.rad + rad;
                    if (diffx * diffx + diffy * diffy < okdist * okdist) {
                        clear = false;
                        break;
                    }
                }
                if (clear) {
                    num--;
                    var numstars = Math.floor(SU.r(this.seed, i + 32.56) * 6);
                    var data = {x: structx, y: structy, rad: rad, rseed: this.seed};
                    data.sbarObj = SBar.IconStructNebula;

                    this.myStructs.push(data); // do first for rendering under
                    this.allStructs.push(data);
                    nebs.push(data);

                    var rtype = SU.r(this.seed, i + 27.56);
                    if (rtype > 0.90 && !wormholed) {
                        data.type = SF.TYPE_STRUCT_NEBULA_WORMHOLE;
                        this.addNebWormholes(data);
                        wormholed = true;
                    } else if (rtype > 0.6) {
                        // higher probability here after wormholes
                        data.type = SF.TYPE_STRUCT_NEBULA_EMPTY;
                    } else if (rtype > 0.2) {
                        this.addNebStars(data, numstars, SF.SYSTEM_NORMAL);
                        data.type = SF.TYPE_STRUCT_NEBULA_STARS;
                    } else if (rtype > 0.1) {
                        this.addNebStars(data, numstars, SF.SYSTEM_DEAD_MIXED);
                        data.type = SF.TYPE_STRUCT_NEBULA_MIXED;
                    } else {
                        this.addNebStars(data, numstars, SF.SYSTEM_DEAD_ROCKS);
                        data.type = SF.TYPE_STRUCT_NEBULA_ROCK;
                    }
                }
            }
        }
        addNebStars(neb, num, systemType) {
            var okdist = 70;
            let res = [];
            var tries = 500;
            for (var i = 0; i < tries; i++) {
                // place stuff closer to the center to match the graphic
                var x = SU.r(this.seed, i + 31.56) * neb.rad - neb.rad / 2;
                var y = SU.r(this.seed, i + 31.86) * neb.rad - neb.rad / 2;
                if (x * x + y * y < neb.rad * neb.rad / 4) {
                    // fits in the circle, check if it's not near another placed object
                    x += neb.x;
                    y += neb.y;
                    var clear = true;
                    for (var obj in res) {
                        var check = res[obj];
                        var diffx = x - check.x;
                        var diffy = y - check.y;
                        if (diffx * diffx + diffy * diffy < okdist * okdist) {
                            clear = false;
                            break;
                        }
                    }
                    if (clear) {
                        var typescramble = SU.r(this.seed, i + 37.57);
                        if (typescramble > 0.8) {
                            typescramble = SU.r(this.seed, i + 38.58);
                            if (typescramble > 0.65) {
                                systemType = SF.SYSTEM_NORMAL;
                            } else if (typescramble > 0.35) {
                                systemType = SF.SYSTEM_DEAD_MIXED;
                            } else {
                                systemType = SF.SYSTEM_DEAD_ROCKS;
                            }
                        }
                        this.systems.push(new SBar.SystemData(this, x, y, systemType));
                        res.push({x: x, y: y});
                        num--;
                    }
                }
                if (num <= 0) {
                    for (var obj in res) {
                        delete res[obj];
                    }
                    return;
                }
            }
            error("couldn't place neb objs, res: " + num);
        }
				/*
				Wormhole algorithm is tricky. Wormholes should be symmetric, with existence on both ends and same identifiers (whether visited or not).
				The existence of generation of a wormhole between two regions needs to be symmetric. Generally based on the two regions' base xy.
				Where the wormhole goes into that region doesn't need to be known when placing - that can be looked up later.
				We just need a guaranteed that the wormhole will exist in the other region.
				connectWormholeRegions() define the regions that will connect.
				Then wormholeResolve() will get the specific coordinates lined up.
				*/
        connectWormholeRegions() {
            // Wormhole algorithm is query nearby regions, and create a combined rand to check generation
            // Then use indicies to match them up rather than resolving full regions
            this.wormholes = [];
            for (var x = -2; x <= 2; x++) {
                for (var y = -2; y <= 2; y++) {
                    if (x !== 0 && y !== 0) { // skip intra-region for now
                        var rx = this.x + SF.REGION_SIZE * x;
                        var ry = this.y + SF.REGION_SIZE * y;
                        var rand = SU.r(rx + (ry * 1.1) + this.x + (this.y * 1.1), 1.11); // THIS NEEDS TO BE 2-WAY SYMMETRICAL
                        if (rand > 0.93) {
                          this.wormholes.push({x: null, y: null, trx: rx, try: ry, i: 1}); // target regions and i is wormhole index to the region
												}
                        // try for a second
                        rand = SU.r(rx + (ry * 1.1) + this.x + (this.y * 1.1), 5.55);
                        if (rand > 0.93) {
                          this.wormholes.push({x: null, y: null, trx: rx, try: ry, i: 2});
												}
                        // and third
                        rand = SU.r(rx + (ry * 1.1) + this.x + (this.y * 1.1), 6.66);
                        if (rand > 0.93) {
                          this.wormholes.push({x: null, y: null, trx: rx, try: ry, i: 3});
												}
												/*
                                rand = SU.r(rx + (ry * 1.1) + this.x + (this.y * 1.1), 7.77);
                                if (rand > 0.85) {
                                    this.wormholes.push({x: null, y: null, trx: rx, try: ry, i: 3});
                                }
                            }
                        }*/
                    }
                }
            }
        }
        addNebWormholes(neb) {
            this.placedWormholes = 0;
            var mindist = 100;
            let res = [];
            var tries = 30;
            for (var i = 0; i < tries && this.placedWormholes < this.wormholes.length; i++) {
                // place stuff closer to the center to match the graphic
                var x = SU.r(this.seed, i + 31.56) * neb.rad - neb.rad / 2;
                var y = SU.r(this.seed, i + 31.86) * neb.rad - neb.rad / 2;
                if (x * x + y * y < neb.rad * neb.rad / 4) {
                    // fits in the circle, check if it's not near another placed object
                    x += neb.x;
                    y += neb.y;
                    var clear = true;
                    for (var obj in res) {
                        var check = res[obj];
                        var diffx = x - check.x;
                        var diffy = y - check.y;
                        if (diffx * diffx + diffy * diffy < mindist * mindist) {
                            clear = false;
                            break;
                        }
                    }
                    if (clear && Math.abs(x)+Math.abs(y) > 5000) {  // Keep them away from 0,0.
                        var wormhole = this.wormholes[this.placedWormholes];
                        this.addWormholeStruct(wormhole, x, y);
                        res.push({x: x, y: y});
                        this.placedWormholes++;
                    }
                }
            }
            for (var obj in res) {
                delete res[obj];
            }
        }
        addWormholeStruct(indexObj, x, y) {
            var data = {x: x, y: y, rad: 50,
                trx: indexObj.trx, try: indexObj.try, i: indexObj.i,
                rseed: this.seed, type: SF.TYPE_STRUCT_WORMHOLE, sbarObj: SBar.IconStructWormhole, justentered: false};
            this.myStructs.push(data);
            this.allStructs.push(data);

        }
        addRemainingWormholes() {
            var tries = 500;
            while (this.placedWormholes < this.wormholes.length) {
                var wx = Math.floor(this.x + SU.r(this.seed, tries + 1.74) * SF.REGION_SIZE);
                var wy = Math.floor(this.y + SU.r(this.seed, tries + 5.64) * SF.REGION_SIZE);
                var clear = true;
                for (var obj in this.allStructs) {
                    var check = this.allStructs[obj];
                    var diffx = check.x - wx;
                    var diffy = check.y - wy;
                    var dist = check.rad + 25;
                    if (diffx * diffx + diffy * diffy < dist * dist) {
                        // overlapping with structure, skip
                        clear = false;
                        break;
                    }
                }
                if (clear && Math.abs(wx)+Math.abs(wy) > 5000) {  // Keep them away from 0,0.
                    this.addWormholeStruct(this.wormholes[this.placedWormholes], wx, wy);
                    this.placedWormholes++;
                }
                tries--;
                if (tries <= 0) {
                    error("cannot place all wormholes " + this.placedWormholes + " " + this.wormholes.length);
                    break;
                }
            }
        }
        wormholeResolve(struct) {
            let targetRegion = new SBar.RegionData(struct.trx, struct.try);
            var targetWH = null;
            for (var obj in targetRegion.myStructs) {
                var wh = targetRegion.myStructs[obj];
                if (wh.type === SF.TYPE_STRUCT_WORMHOLE && wh.trx === this.x && wh.try === this.y && wh.i === struct.i) {
                    targetWH = wh;
                }
            }
            if (targetWH === null) {
                error("cannot find jump match " + struct.trx + " " + struct.try + " " + struct.i);
            }
            return targetWH;
        }
        generate() {
            // everything generated up front?
        }
        static getSeed(xIn, yIn) {
            return SU.r(xIn+1, yIn+2);
        }
        // Generates region's raw structures, to others to query to check overlap
        // uses no object properties- fully static function
        // also does not take into account collisions, this is used for collision detection
        static getStructures(xIn, yIn, resultArray) { /*static function*/
            var resindex = resultArray.length; // just do collision detection for new stuff from this function call
            var randseed = SBar.RegionData.getSeed(xIn, yIn);
            var maxstructs = Math.floor(SU.r(randseed, 78.57) * 6) + 5; // 5~10
            for (var structind = 0; structind < maxstructs; structind++) {
                var structx = Math.floor(xIn + SU.r(randseed, structind + 78.67) * SF.REGION_SIZE);
                var structy = Math.floor(yIn + SU.r(randseed, structind + 78.78) * SF.REGION_SIZE);
                var rad = SU.r(randseed, structind + 78.89) * RANGE_STRUCT_SIZE * (1+SU.r(randseed, structind + 78.29)*2) + MIN_STRUCT_SIZE;
                rad /= 2;
                // check collision and throw out if needed
                var clear = true;
                for (var i = resindex; i < resultArray.length; i++) {
                    var check = resultArray[i];
                    var diffx = check.x - structx;
                    var diffy = check.y - structy;
                    var dist = check.rad + rad;
                    if (diffx * diffx + diffy * diffy < dist * dist * REGION_OVERLAP) {
                        clear = false;
                        break;
                    }
                }
                if (clear && Math.abs(structx)+Math.abs(structy) > 5000) {  // Keep them away from 0,0.
                    resultArray.push({x: structx, y: structy, rad: rad, rseed: randseed});
                }
            }
        }
        // Computes the list of active structures that overlap into this region.
        resolveStructures() {
            let results = [];
            this.allStructs = [];
            this.myStructs = [];
            for (var xind = -1; xind <= 1; xind++) {
                for (var yind = -1; yind <= 1; yind++) {
                    SBar.RegionData.getStructures(this.x + xind * SF.REGION_SIZE, this.y + yind * SF.REGION_SIZE, results);
                }
            }
            // got the full list of structures, now resolve them. n^2 algorithm, so don't have more than 40 structs or so.
            for (var i = 0; i < results.length; i++) {
                let struct = results[i];
                let clear = true;
                for (var j = 0; j < results.length; j++) {
                    if (i !== j) {
                        var check = results[j];
                        if (check !== undefined) {
                            if (check.rseed > struct.rseed) {
                                var diffx = check.x - struct.x;
                                var diffy = check.y - struct.y;
                                var dist = check.rad + struct.rad;
                                if (diffx * diffx + diffy * diffy < dist * dist * REGION_OVERLAP) {
                                    // overlapping with higher priority, nuke struct.
                                    clear = false;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!clear) {
                    delete results[i];
                } else {
                    this.allStructs.push(struct);
                }
            }
            for (var obj in this.allStructs) {
                var struct = this.allStructs[obj];
                if (struct.rseed === this.seed) {
                    this.myStructs.push(struct);
                }
            }
        }
				// Get the home coordinates for the closest alpha region. Returns null if none.
				GetClosestAlpha(x, y) {
					let max_distance_squared = -1;
					let closest_alpha = null;
					for (let alpha of this.allAlphas) {
						let xoff = alpha.bubbles[0].x - x;
						let yoff = alpha.bubbles[0].y - y;
						let distance = xoff*xoff + yoff*yoff;
						if (max_distance_squared === -1 || max_distance_squared > distance) {
							max_distance_squared = distance;
							closest_alpha = alpha;
						}
					}
					return closest_alpha;  // Null if none.
				}
        // Resolves overlapping alpha race areas
        resolveAlphas() {
          this.allAlphas = [];
          this.myAlphas = [];
          for (var xind = -1; xind <= 1; xind++) {
            for (var yind = -1; yind <= 1; yind++) {
							let add_system = xind === 0 && yind === 0 ? this : undefined;
              let results = SBar.RegionData.getAddAlphas(this.x + xind * SF.REGION_SIZE, this.y + yind * SF.REGION_SIZE, add_system);
							this.allAlphas = this.allAlphas.concat(results);
							if (xind == 0 && yind == 0) {
								this.myAlphas = results;
							}
            }
          }
				}
				// Get the alphas, and also add core systems. Adds their system to the region if 'region_for_system'.
				static getAddAlphas(xIn, yIn, /*optional*/region_for_system) { /*static function*/
					let alphas = [];
					if (S$.got_wmd_in_past || SF.NO_BUBBLES) {
						return alphas; // Friend isn't generating bubbles.
					}
					
					let is_zed_zed = this.IsZedZed(xIn, yIn);
          let randseed_outer = this.getSeed(xIn, yIn);
					let num_alpha = Math.floor(SU.r(randseed_outer, 18.21) * 2.5); // Chance of one or two.
					if (is_zed_zed) num_alpha++;
					if (S$.conduct_data['time_limit']) num_alpha = 4;  // They're all over the place.
					for (let i = 0; i < num_alpha; i++) {
            let racex = Math.floor(xIn + SU.r(randseed_outer, 18.22+i) * SF.REGION_SIZE);
            let racey = Math.floor(yIn + SU.r(randseed_outer, 18.23+i) * SF.REGION_SIZE);
	          let randseed = this.getSeed(racex, racey);
						
						let start_time = Math.floor(SU.r(randseed, 18.24+i)*year) + week;  // At least a week, within the first year.
						if (is_zed_zed && i == 0) {
							start_time = SF.ORIGINAL_BUBBLE_TIME;  // Special case of the home region starting at 2 days.
							racex = SF.ORIGINAL_BUBBLE_X;
							racey = SF.ORIGINAL_BUBBLE_X;
						}						
						let max_size = Math.floor(SU.r(randseed, 18.255+i)*SF.REGION_SIZE+SF.REGION_SIZE/6);
						if (S$.conduct_data['time_limit']) {
							max_size = SF.REGION_SIZE * 0.65;
						}						
						if (Math.abs(xIn+HALF_REGION_SIZE-racex)+max_size > SF.REGION_SIZE || Math.abs(yIn+HALF_REGION_SIZE-racey)+max_size > SF.REGION_SIZE) {
							max_size /= 2;
						}
						let size = 0;
						if (S$.conduct_data['time_limit']) {
							let final_size_time = Math.floor(SU.r(randseed, 18.24+i)*year*4) + year;  // > 1 year. The years set here is basically the time limit.
							size = (S$.time-start_time)*max_size/(final_size_time-start_time);
							if (size < 0) {
								size = 0;
							} else if (size > max_size) {
								size = max_size;
							}
						} else {
							// Growth slows over time.
							let decay = SU.r(randseed, 18.25)*0.5+0.25;
							let epochs = (S$.time-start_time)/(Math.floor(SU.r(randseed, 18.26)*year) + year/2);  // Roughly yearly epochs.
							// Note exponentiation is about 10x slower than multiplication.
							// Still plenty fast for occasional use.
							// Take the exponential decay, and that's how much growth remains (flip it).
							if (epochs > 0) {
								let generated_decay = Math.pow(decay, epochs);
								size = max_size - generated_decay * max_size;
							}
						}
						if (size < 150 && size > 0) size = 150;  // Don't want them to be invisible.
						
						let level = Math.floor(SU.r(randseed, 98.13)*6)+10;
						let race_obj = {level: level, seed: SF.RACE_SEED_ALPHA, alignment: 0};
						//let MAX_REGION_EXTRA = SF.REGION_SIZE * 0.65;
						// Max size is MAX_REGION_EXTRA.
						race_obj.bubbles = [{x: racex, y: racey, size: size}];
						alphas.push(race_obj);
						if (region_for_system && size > 0) {
	            region_for_system.systems.push(new SBar.SystemData(region_for_system, racex, racey, SF.SYSTEM_ALPHA_CORE));
						}
					}
					return alphas;
				}
        // Resolves overlapping race areas
        resolveRaces() {
          this.allRaces = [];
          this.myRaces = [];
          for (var xind = -1; xind <= 1; xind++) {
            for (var yind = -1; yind <= 1; yind++) {
                let results = SBar.RegionData.getRaces(this.x + xind * SF.REGION_SIZE, this.y + yind * SF.REGION_SIZE);
								this.allRaces = this.allRaces.concat(results);
								if (xind == 0 && yind == 0) {
									this.myRaces = results;
									for (let race of results) {
                    this.systems.push(new SBar.SystemData(this, race.bubbles[0].x,race.bubbles[0].y, SF.SYSTEM_RACE_HOMEWORLD));
									}
								}
            }
          }
				}
				// Fully static function, just needing {x, y}, like getStructures and getAddAlphas.
				static getRaces(xIn, yIn) { /*static function*/
					let resultArray = []
					let MAX_REGION_EXTRA = SF.REGION_SIZE * 0.60;
					// Like structures, races can spill into adjacent regions.
          let randseed = this.getSeed(xIn, yIn);
					let num_races = Math.floor(SU.r(randseed, 8.21) * 4)+1; //1; //Math.floor(SU.r(randseed, 8.21) * 3)+1;
					for (let i = 0; i < num_races; i++) {
						let race_seed = SU.r(randseed, 8.25+i);
            let racex = Math.floor(xIn + SU.r(race_seed, 8.22) * SF.REGION_SIZE);
            let racey = Math.floor(yIn + SU.r(race_seed, 8.23) * SF.REGION_SIZE);						
						let main_size = (SU.r(race_seed, 8.255)*SF.REGION_SIZE+SF.REGION_SIZE)/6;
						if (num_races > 1) {
							main_size = main_size * 2/3;
						}
						// Don't go above adjacent region + size/2 for overlaps.
						if (Math.abs(xIn+HALF_REGION_SIZE-racex)+main_size > SF.REGION_SIZE || Math.abs(yIn+HALF_REGION_SIZE-racey)+main_size > SF.REGION_SIZE) {
							main_size /= 2;
						}
						
						let level = Math.floor(SU.r(race_seed, 8.26)*20)+1;
            // low level near the starting areas
            var distfrom00 = Math.sqrt(racex*racex + racey*racey) / 50000;
            if (distfrom00 < 1) {
                level = capLevel(Math.floor(level * distfrom00));
            }
						let alignment = S$.raceAlignment[race_seed] === undefined ? S$.BaseAlignment(race_seed) : S$.raceAlignment[race_seed];
						let race_obj = {level: level, seed: race_seed, alignment: alignment};
						race_obj.bubbles = [{x: racex, y: racey, size: main_size}];
						let extra_bubbles = Math.floor(SU.r(race_seed, 8.25) * 6)+2; // 2~7.
						for (let j = 0; j < extra_bubbles; j++) {
							let angle = SU.r(race_seed, 8.26 + j) * PIx2;
							let dist = SU.r(race_seed, 8.27 + j) * main_size + main_size/3;
							let extra_size = SU.r(race_seed, 8.28 + j) * main_size/2+dist/2;
							let extra_x = Math.floor(racex+Math.sin(angle)*dist);
							let extra_y = Math.floor(racey+Math.cos(angle)*dist);
							// Don't go too deep into region overlaps.
							// Also don't go above the size iconMapRace can print.
							if (Math.abs(xIn+HALF_REGION_SIZE-extra_x)+extra_size < MAX_REGION_EXTRA && Math.abs(yIn+HALF_REGION_SIZE-extra_y)+extra_size < MAX_REGION_EXTRA) {
								race_obj.bubbles.push({x: extra_x, y: extra_y, size: extra_size});
							}
						}
						if (Math.abs(racex)+Math.abs(racey) > 10000) {  // Keep them away from 0,0.
							resultArray.push(race_obj);
						}
					}
					return resultArray;
				}
				// Returns the race seed for this x,y coordinate. Returns a random region race if no overlaps.
				// If in alpha, returns both the alpha and embeds what would have been there.
				DetermineRace(x, y) {
					let alpha_result = null
					for (let race of this.allAlphas) {
						for (let bubble of race.bubbles) {
							let offx = bubble.x - x;
							let offy = bubble.y - y;
							if (offx * offx + offy * offy < bubble.size * bubble.size) {
								alpha_result = {race: race, core: true};
							}
						}
					}
					
					// Need to find the race with the highest seed.
					let highest_seed = -1;
					let best_match = null;
					for (let race of this.allRaces) {
						for (let bubble of race.bubbles) {
							let offx = bubble.x - x;
							let offy = bubble.y - y;
							if (offx * offx + offy * offy < bubble.size * bubble.size) {
								if (race.seed > highest_seed) {
									best_match = {race: race, core: true};
									highest_seed = race.seed;
									break;
								}
							}
						}
					}
					if (highest_seed === -1) {
						// Get a random race for this region.
						let race = this.allRaces[Math.floor(SU.r(this.seed+x+y,92.12)*this.allRaces.length)];
						best_match = {race: race, core: false};
					}
					if (alpha_result) {
						alpha_result.original_race = best_match;
						best_match = alpha_result;
					}
					return best_match;
				}
        teardown() {
            for (var obj in this.results) {
                delete this.allStructs[obj];
            }
            delete this.allStructs;
            delete this.myStructs;
            for (var obj in this.systems) {
                this.systems[obj].teardown();
                delete this.systems[obj];
            }
            delete this.systems;
        }
        // Used by system draw background nebula
        getNebulaAt(x, y) {
            for (var obj in this.myStructs) {
                var struct = this.myStructs[obj];
                var type = struct.type;
                if (type === SF.TYPE_STRUCT_BADLAND || type === SF.TYPE_STRUCT_NEBULA || type === SF.TYPE_STRUCT_NEBULA_STARS || type === SF.TYPE_STRUCT_NEBULA_ROCK || type === SF.TYPE_STRUCT_NEBULA_MIXED || type === SF.TYPE_STRUCT_NEBULA_WORMHOLE || type === SF.TYPE_STRUCT_NEBULA_EMPTY) {
                    var dx = x - struct.x;
                    var dy = y - struct.y;
                    if (dx * dx + dy * dy < struct.rad * struct.rad) {
                        return struct;
                    }
                }
            }
            return null;
        }
				// Returns true if the coordinates are in this region.
				CoordsInRegion(x, y) {
					return x >= this.x && x < this.x + SF.REGION_SIZE
        					&& y >= this.y && y < this.y + SF.REGION_SIZE;
				}
				GetRandomSystem(seed) {
					if (!this.systems || this.systems.length === 0) {
						return null;
					}
					let rand_index = Math.floor(SU.r(seed, 88.7+S$.time)*this.systems.length);
					return this.systems[rand_index];
				}
    };

    SU.extend(SBar.RegionData, SBar.Data);
})();
