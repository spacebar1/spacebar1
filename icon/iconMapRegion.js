/*
 * A region is an block of space and its contained stars, structures, etc.
 * Regions are also responsible for drawing stuff like stars within its region,
 *  as well as structures centered in the region
 */

(function() {
    SBar.IconMapRegion = function(tier, region_data) {
        this._initIconMapRegion(tier, region_data);
    };

    SBar.IconMapRegion.prototype = {
        type: SF.TYPE_REGION_ICON,
        data: null,
        tier: null,
        objs: null,  // Stars
        structs: null,
				races: null,
				alpha_icons: null,
	  		_initIconMapRegion: function(tier, region_data) {
            this.data = region_data;
            this.tier = tier;
            this.objs = [];
            this.structs = [];
            this.races = [];					
						this.alpha_icons = [];	
						
						let allStars = this.data.systems;
						let knownCoords = S$.getKnownStarBlock(this.data.x, this.data.y);
						if (!knownCoords) knownCoords = {};
            this.objs.push(new SBar.IconMapSystems(tier, this.data, allStars, knownCoords));

            var allStructs = this.data.myStructs;
            knownCoords = S$.getKnownStructBlock(this.data.x, this.data.y);
            if (knownCoords !== undefined && knownCoords !== null) {
                for (var obj in allStructs) {
                    var struct = allStructs[obj];
                    var newObj = new SBar.IconMapStruct(tier, struct, SF.SHOW_SPACE_ALL || knownCoords[struct.x + "," + struct.y]);
                    this.structs.push(newObj);
                }
            }
						// Races. Note these are drawn separately by the renderer.
						for (let race of this.data.myRaces) {
							//if (SF.SHOW_SPACE_ALL || S$.raceAlignment[race.seed]) {  // Known.
								this.races.push(new SBar.IconMapRace(this, tier, race));
								//}
						}
						for (let alpha of this.data.myAlphas) {
							this.alpha_icons.push(new SBar.IconMapAlpha(this, tier, alpha));
						}
        },
        // structs in back, then stars then struct names
        update: function(shipx, shipy, mousex, mousey) {
          for (var obj in this.structs) {
              this.structs[obj].update(shipx, shipy);
          }
          for (var obj in this.objs) {
              this.objs[obj].update(shipx, shipy, mousex, mousey);
          }
					/*
					for (let race of this.data.allAlphas) {
					  let offx = race.bubbles[0].x - shipx;
					  let offy = race.bubbles[0].y - shipy;
						let halfsize = 500;
						SU.circle(this.tier.context, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH-0, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT-0, race.bubbles[0].size/SF.STARMAP_ZOOM, "#888")
					}
					*/
        },
				// Second-pass update.
				/*
        update2: function(shipx, shipy, mousex, mousey) {
					for (let race of this.data.allAlphas) {
					  let offx = race.bubbles[0].x - shipx;
					  let offy = race.bubbles[0].y - shipy;
						let halfsize = 500;
						SU.circle(this.tier.context, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH-0, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT-0, race.bubbles[0].size/SF.STARMAP_ZOOM-1, "#000")
					}
				},
				*/
        updateName: function(shipx, shipy, mousex, mousey) {
            for (var obj in this.structs) {
                this.structs[obj].updateName(shipx, shipy);
            }
						let wormhole_to_display = null;
						let closest = 999999999;
	          for (var obj in this.structs) {
							if (this.structs[obj].InWormholeRange(mousex, mousey)) {
								let distance = this.structs[obj].WormholeDistance(mousex, mousey);
								if (distance >= 0 && distance < closest) {
									closest = distance;
									wormhole_to_display = this.structs[obj];
								}
							}						
	//              if (this.structs[obj].updateName(shipx, shipy, mousex, mousey)) {
	//              	return;
	//              }
	          }
						if (wormhole_to_display !== null) {
							wormhole_to_display.updateName(shipx, shipy, mousex, mousey);
							return;
						}
	          for (var obj in this.objs) {
	              if (this.objs[obj].updateName(shipx, shipy, mousex, mousey)) {
	              	return;
	              }
	          }
						
        },
        teardown: function() {
            this.data.teardown();
            this.data = null;
            for (var obj in this.objs) {
                this.objs[obj].teardown();
                delete this.objs[obj];
            }
            delete this.structs;
            for (var obj in this.structs) {
                this.structs[obj].teardown();
                delete this.structs[obj];
            }
            delete this.structs;
        },
				// Similar to TryActivate(), but just seeing if the player is going back to the current system.
				CheckReturn: function(shipx, shipy) {
					for (var i = 0; i < this.objs.length; i++) {
						if (this.objs[i].CheckReturn(shipx, shipy)) {
							return true;
						}
					}
					return false;
				},
				
				TryActivate: function(shipx, shipy) {
					for (var i = 0; i < this.objs.length; i++) {
						if (this.objs[i].TryActivate(shipx, shipy)) {
							return true;
						}
					}
					
					let wormhole_to_activate = null;
					let closest = 999999999;
          for (var obj in this.structs) {
						if (this.structs[obj].InWormholeRange(shipx, shipy)) {
							let distance = this.structs[obj].WormholeDistance(shipx, shipy);
							if (distance >= 0 && distance < closest) {
								closest = distance;
								wormhole_to_activate = this.structs[obj];
							}
						}						
//              if (this.structs[obj].updateName(shipx, shipy, mousex, mousey)) {
//              	return;
//              }
          }
					if (wormhole_to_activate !== null) {
						if (wormhole_to_activate.TryActivate(shipx, shipy)) {
							return true;
						}
					}
					
					/*
					for (var i = 0; i < this.structs.length; i++) {
						if (this.structs[i].TryActivate(shipx, shipy)) {
							return true;
						}
					}*/
					return false;
				},
				CheckEffect: function(shipx, shipy, fail_pre_callback) {
					for (var i = 0; i < this.structs.length; i++) {
						if (this.structs[i].CheckEffect(shipx, shipy, fail_pre_callback)) {
							return true;
						}
					}
					return false;
				},
				// Add stars within range when visiting a new location.
				AddFoundArea: function(x, y, range, long_range_scan) {
					// Stars.
          var allStars = this.data.systems;
         // var knownCoords = S$.getKnownStarBlock(x, y);
					var any_added = false;
					for (var obj in allStars) {
            var star = allStars[obj];
            if (S$.getKnownStarBlock(star.x, star.y)[star.x + "," + star.y] === undefined || long_range_scan) {
							var offx = x-star.x;
							var offy = y-star.y;
							if (offx * offx + offy * offy <= range * range) {
								any_added = true;
								S$.addKnownStar(star.x, star.y);			
								if (long_range_scan) {
									S$.scannedStars[star.x + "," + star.y] = true;
									star.ScanNodelay(long_range_scan);
								}
							}
            }
					}
					// Structures.
          var allStructs = this.data.myStructs;
         // knownCoords = S$.getKnownStructBlock(x, y);
					for (var obj in allStructs) {
            var struct = allStructs[obj];
            if (S$.getKnownStructBlock(struct.x, struct.y)[struct.x + "," + struct.y] === undefined) {
							var offx = x-struct.x;
							var offy = y-struct.y;
							var dist = struct.rad + range;
							if (offx * offx + offy * offy <= dist * dist) {
								any_added = true;
								S$.addKnownStructure(struct.x, struct.y);
							}
            }
					}
					// Races.
					//for (race of this.data.myRaces) {
					for (let i = 0; i < this.data.myRaces.length; i++) {
						let race = this.data.myRaces[i];
						for (bubble of race.bubbles) {
							let xoff = bubble.x - x;
							let yoff = bubble.y - y;
							let dist = range + bubble.size;
							// Just choose the rival at the opposite end of the array. No rival for middle.
							let rival = this.data.myRaces.length-1-i === i ? null : this.data.myRaces[this.data.myRaces.length - 1 - i];
							if (xoff*xoff + yoff*yoff < dist*dist && (!S$.raceAlignment[race.seed] || (rival && S$.raceRival[rival.seed]))) {
								any_added = true;
								if (long_range_scan || S$.ship.sensor_level >= SF.SENSOR_RACE_DOMAINS) {
									S$.AddKnownRace(race.seed);
								}
								if (rival) {
									S$.AddRaceAlignment(race.seed, rival.seed);
								} else {
									S$.AddRaceAlignment(race.seed);
								}
							}
						}
					}
					
					if (any_added) {
						this._initIconMapRegion(this.tier, this.data)
					}
					return any_added;
				},
    };

    SU.extend(SBar.IconMapRegion, SBar.Icon);
})();
