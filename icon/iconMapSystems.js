/*
 * All the stars in a region
 */
(function() {

    var PADDING = 20; // star rad extra border
    var SCALED_REGION = SF.REGION_SIZE / SF.STARMAP_ZOOM;
    var DETAILS_PRINT_DIST2 = 40000; // 100 real px
		let white_star_image;
		let white_star_image_size = 50;

    SBar.IconMapSystems = function(tier, regionData, allStars, knownCoordsSet) {
        this._initIconMapSystems(tier, regionData, allStars, knownCoordsSet);
    };

    SBar.IconMapSystems.prototype = {
        type: SF.TYPE_SYSTEM_ICON,
        allStars: null,
				knownCoordsSet: null,
        regionData: null,
				x: null,
				y: null,
        image: null,
        imagecontext: null,
        imagesize: null,
        tier: null,
        effects: null,
        _initIconMapSystems: function(tier, regionData, allStars, knownCoordsSet) {
            this.tier = tier;
            this.imagesize = SCALED_REGION + PADDING * 2;
            this.regionData = regionData;
            this.x = this.regionData.x;
            this.y = this.regionData.y;
            this.allStars = allStars;
						this.knownCoordsSet = knownCoordsSet;
						if (!white_star_image) {
							this.BuildWhiteStarImage();
						}
            this.buildImage();
        },
				BuildWhiteStarImage: function() {
					white_star_image = document.createElement('canvas');
          white_star_image.width = white_star_image_size;
          white_star_image.height = white_star_image_size;
          let context = white_star_image.getContext('2d');
          //let colorStops = [0, '#000', 1, '#000'];
          //SU.circleRad(context, white_star_image_size/2, white_star_image_size/2, white_star_image_size*20, colorStops);
					SU.circle(context, white_star_image_size/2, white_star_image_size/2, white_star_image_size*3, "#000");
          let colorStops = [0, 'white', 0.2, 'rgb(255,255,255)', 0.33, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0)'];
          SU.circleRad(context, white_star_image_size/2, white_star_image_size/2, white_star_image_size/2, colorStops);
				},
        buildImage: function() {
            this.image = document.createElement('canvas');
            this.image.width = this.imagesize;
            this.image.height = this.imagesize;
            this.imagecontext = this.image.getContext('2d');
            this.imagecontext.save();
            this.imagecontext.translate(PADDING, PADDING); // bit of padding to draw stars off the region, and center back

            var quests = S$.quests;
            this.effects = [];
            for (var obj in this.allStars) {
              var data = this.allStars[obj];
              var tx = (data.x - this.x) / SF.STARMAP_ZOOM; // target x
              var ty = (data.y - this.y) / SF.STARMAP_ZOOM;
              var rad = (data.radius / SF.STARMAP_ZOOM) * 10+3;
							if (this.knownCoordsSet[data.x + "," + data.y]) {
                var colorStops = [0, 'white', 0.2, 'rgb(' + data.colorstr + ')', 0.33, 'rgba(' + data.colorstr + ',0.5)', 1, 'rgba(' + data.colorstr + ',0)'];
                if (data.isDead() || data.in_alpha_bubble) {
                    colorStops = [0, 'rgba(150,150,150,0.6)', 1, 'rgba(200,200,200,0.1)'];
                }

                // Check if active quest in this system
                for (var i = 0; i < quests.length; i++) {
                    var quest = quests[i];
                    if (quest.stx === data.x && quest.sty === data.y) {
                        this.effects.push(new SBar.IconQuestTarget(quest, this.tier.context, quest.stx / SF.STARMAP_ZOOM, quest.sty / SF.STARMAP_ZOOM));
                        break;
                    }
                }
                // check for other effects
                if (S$.found(data.seed + SF.TYPE_TEMPLE_BAR)) {
                    this.effects.push(new SBar.IconTempleEffect(this.tier.context, data.x / SF.STARMAP_ZOOM, data.y / SF.STARMAP_ZOOM, true));
                } else if (S$.found(data.seed + SF.TYPE_TEMPLE)) {
                    this.effects.push(new SBar.IconTempleEffect(this.tier.context, data.x / SF.STARMAP_ZOOM, data.y / SF.STARMAP_ZOOM, false));
                }
                var blackStops = [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,1)'];
                SU.circleRad(this.imagecontext, tx, ty, rad, blackStops);
                SU.circleRad(this.imagecontext, tx, ty, rad, colorStops);
							} else if (!data.isDead()) {
								// Star not discovered yet.
								this.imagecontext.drawImage(white_star_image, tx-rad/2, ty-rad/2, rad, rad);
							}
            }
            this.imagecontext.restore();
        },
        update: function(shipx, shipy, mousex, mousey) {
            var offx = this.x - shipx;
            var offy = this.y - shipy;
            this.tier.context.drawImage(this.image, offx / SF.STARMAP_ZOOM + SF.HALF_WIDTH - PADDING, offy / SF.STARMAP_ZOOM + SF.HALF_HEIGHT - PADDING);
            // Print any star details if the ship is in the region.
            //if (shipx > this.x && shipy > this.y && shipx < this.x + SF.REGION_SIZE && shipy < this.y + SF.REGION_SIZE) {

            for (var i = 0; i < this.effects.length; i++) {
                this.effects[i].update(shipx / SF.STARMAP_ZOOM, shipy / SF.STARMAP_ZOOM);
            }						
        },
        updateName: function(shipx, shipy, mousex, mousey) {
					let closest_distance = 999999999;
					let closest_star;
          for (var obj in this.allStars) {
            var star = this.allStars[obj];
						//if (this.knownCoordsSet[star.x + "," + star.y]) {
              offx = star.x - mousex;
              offy = star.y - mousey;
							let dist_hypot2 = offx * offx + offy * offy;
              if (dist_hypot2 < DETAILS_PRINT_DIST2 && dist_hypot2 < closest_distance) {
								closest_distance = dist_hypot2;
								closest_star = star;
              }
							//}
						
						/*
						// Debug to draw the race seed.
            var offx = star.x - shipx;
            var offy = star.y - shipy;
						star.generate();
						SU.text(this.tier.text_context, round100th(star.raceseed), offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT, SF.FONT_XLB, 'rgba(0,0,255,0.5)', 'center');
						*/
          }
					if (closest_star) {
            closest_star.generate();
						let x = (closest_star.x - shipx) / SF.STARMAP_ZOOM + SF.HALF_WIDTH;
						let y = (closest_star.y - shipy) / SF.STARMAP_ZOOM + SF.HALF_HEIGHT+25;
						if (S$.getKnownStarBlock(closest_star.x, closest_star.y)[closest_star.x + "," + closest_star.y]) {
							SU.text(this.tier.text_context, closest_star.name, (closest_star.x - shipx) / SF.STARMAP_ZOOM + SF.HALF_WIDTH, (closest_star.y - shipy) / SF.STARMAP_ZOOM + SF.HALF_HEIGHT-15, SF.FONT_MB, 'rgba(255,255,255,0.8)', 'center')
							let symbol_seed = closest_star.seed;
							let symbols = S$.GetSystemStatSymbols(symbol_seed);
							if (!symbols || symbols == "") {
								symbols = "?";
							}
							SU.text(this.tier.text_context, symbols, x, y, SF.FONT_SB, 'rgba(255,255,255,0.8)', 'center')
							let building_types = S$.GetBuildingTypes(symbol_seed);
							SU.DrawBuildingSymbols(building_types, this.tier.text_context, x, y+10, SF.BUILDING_TEXT_ICON_SIZE, /*center=*/true);
						} else if (!closest_star.isDead()) {
							SU.text(this.tier.text_context, "unknown", x, y-40, SF.FONT_SB, 'rgba(255,255,255,0.8)', 'center')
						}
						return true;
					}
					return false;
				},
				
        teardown: function() {
        },
				
				ClosestStar: function(shipx, shipy) {
					let closest_distance = 999999999;
					let closest_star;
          for (var obj in this.allStars) {
            var star = this.allStars[obj];
            offx = star.x - shipx;
            offy = star.y - shipy;
						let dist_hypot2 = offx * offx + offy * offy;
            if (dist_hypot2 < DETAILS_PRINT_DIST2 && dist_hypot2 < closest_distance) {
							closest_distance = dist_hypot2;
							closest_star = star;
            }
          }
					return closest_star;
				},
				// Similar to TryActivate(), but just seeing if the player is going back to the current system.
				CheckReturn: function(shipx, shipy) {
					let closest_star = this.ClosestStar(shipx, shipy);
					if (closest_star) {
						if (this.tier.current_system_tier && closest_star.seed === this.tier.current_system_tier.data.seed) {
							return true;
						}
					}
					return false;
				},
				
				TryActivate: function(shipx, shipy) {
					let closest_star = this.ClosestStar(shipx, shipy);
					if (closest_star) {
						//closest_star.activateTier(this.x, this.y);
						/* This is checked above now.	
						if (this.tier.current_system_tier && closest_star.seed === this.tier.current_system_tier.data.seed) {
							//closest_star.activateTier();
							this.tier.current_system_tier.shipx = this.tier.current_system_tier.shipxbak;
							this.tier.current_system_tier.shipy = this.tier.current_system_tier.shipybak;
							delete this.tier.current_system_tier.shipxbak;
							delete this.tier.current_system_tier.shipybak;
							this.tier.current_system_tier.activate();
							return true;
						}
						*/
						
						let activate_callback = function() {
							S$.TrackSystemVisit(closest_star.seed);
							closest_star.activateTier();
						}
						SU.GetTravelRenderer().ToSystem(this.tier.jump_time, closest_star, activate_callback.bind(this));
						
						return true;
					}
					return false;
				}
    };
    SU.extend(SBar.IconMapSystems, SBar.Icon);
})();

	
