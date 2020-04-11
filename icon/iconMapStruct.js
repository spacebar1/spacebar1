/*
 * Multi-purpose starmap structure drawing icon
 */

(function() {

    var TITLE_WIDTH = 400;
    var TITLE_HEIGHT = 100;

    SBar.IconMapStruct = function(tier, data, known) {
        this._initIconMapStruct(tier, data, known);
    };

    SBar.IconMapStruct.prototype = {
        type: SF.TYPE_STRUCT_ICON,
        type: null,
        data: null,
        tier: null,
        image: null,
				known: false,
        imagecontext: null,
        titleimage: null,
        titlecontext: null,
        imagesize: null,
        wormhole: null,
  			wormhole_init: false, 
        _initIconMapStruct: function(tier, dataIn, known) {
            this.tier = tier;
            this.data = dataIn;
						this.known = known;
            this.imagesize = this.data.rad * 2 / SF.STARMAP_ZOOM;
            this.buildImage();
        },
				// Returns true if the structure will get drawn.
				WillDraw: function() {
					let type = this.data.type;
					// Note barrens are disabled to help keep the map clean.
					if (type === SF.TYPE_STRUCT_BARREN || type === SF.TYPE_STRUCT_WALL || type === SF.TYPE_STRUCT_MINEFIELD) {
						return false;
					}
					return this.known || type === SF.TYPE_STRUCT_BADLAND || type === SF.TYPE_STRUCT_BLACKHOLE;
				},
        buildImage: function() {
					if (!this.WillDraw()) {
						return;
					}
            this.image = document.createElement('canvas');
            this.image.width = this.imagesize;
            this.image.height = this.imagesize;
            this.imagecontext = this.image.getContext('2d');

            this.nebula = false;
            switch (this.data.type) {
  							// Disabled. Just empty space.
                case SF.TYPE_STRUCT_MINEFIELD:
                    //this.drawMinefield();
                    break;
                case SF.TYPE_STRUCT_BADLAND:
                    this.drawBadland();
                    break;
  							// Disabled. Just empty space.
                case SF.TYPE_STRUCT_WALL:
                    //this.drawWall();
                    break;
                case SF.TYPE_STRUCT_BARREN:
                    this.drawBarren();
                    break;
                case SF.TYPE_STRUCT_BLACKHOLE:
                    this.drawBlackhole();
                    break;
                case SF.TYPE_STRUCT_NEBULA_WORMHOLE:
                case SF.TYPE_STRUCT_NEBULA_STARS:
                case SF.TYPE_STRUCT_NEBULA_MIXED:
                case SF.TYPE_STRUCT_NEBULA_ROCK:
                case SF.TYPE_STRUCT_NEBULA_EMPTY:
                    this.nebula = true;
                    this.drawNebula();
                    break;
                case SF.TYPE_STRUCT_WORMHOLE:
                    this.drawWormhole();
                    break;
                default:
                    error("IconMapStruct bad type: " + this.data.type);
            }

            //if (this.data.type !== SF.TYPE_STRUCT_WORMHOLE) {
							if (this.known) {
                var name = this.data.name;
                var lastIndex = name.lastIndexOf(" ");
                var name1 = name.substring(0, lastIndex);
                var name2 = name.substring(lastIndex + 1);

                this.titleimage = document.createElement('canvas');
                this.titleimage.width = TITLE_WIDTH;
                this.titleimage.height = TITLE_HEIGHT;
                this.titlecontext = this.titleimage.getContext('2d');

                this.titlecontext.save();
                this.titlecontext.translate(TITLE_WIDTH / 2, TITLE_HEIGHT / 2); // center of title
                this.titlecontext.textAlign = 'center';
                if (this.nebula) {
                    this.titlecontext.font = SF.FONT_MB;
                    this.titlecontext.fillStyle = 'rgba(255,255,255,0.15)';
                    this.titlecontext.fillText(name1, 0, 0);
                    this.titlecontext.fillText(name2, 0, 15);
                } else {
                    this.titlecontext.font = SF.FONT_MB;
                    this.titlecontext.fillStyle = 'rgba(255,255,255,0.35)';
                    this.titlecontext.fillText(name1, 0, -5);
                    this.titlecontext.fillText(name2, 0, 15);
                }
							}
            //}
        },
        update: function(shipx, shipy) {
					if (!this.WillDraw()) {
						return;
					}
            var offx = this.data.x - shipx;
            var offy = this.data.y - shipy;
            this.tier.context.globalAlpha = 0.5;
            this.tier.context.drawImage(this.image, offx / SF.STARMAP_ZOOM - this.imagesize / 2 + SF.HALF_WIDTH, offy / SF.STARMAP_ZOOM - this.imagesize / 2 + SF.HALF_HEIGHT);
            if (this.wormhole !== null) {
                var woffx = this.wormhole.x-shipx;
                var woffy = this.wormhole.y-shipy;
								let width = 1;
								if (this.tier.zoom_level) {
									width *= this.tier.zoom_level;
								}
                SU.line(this.tier.context, offx/ SF.STARMAP_ZOOM + SF.HALF_WIDTH, offy/ SF.STARMAP_ZOOM+ SF.HALF_HEIGHT, woffx/ SF.STARMAP_ZOOM + SF.HALF_WIDTH, woffy/ SF.STARMAP_ZOOM+ SF.HALF_HEIGHT, '#888', width);
            }
            this.tier.context.globalAlpha = 1;

            if (this.nebula && this.titleimage !== null) {
                this.tier.context.drawImage(this.titleimage, offx / SF.STARMAP_ZOOM + SF.HALF_WIDTH - TITLE_WIDTH / 2, offy / SF.STARMAP_ZOOM + SF.HALF_HEIGHT - TITLE_HEIGHT / 2 + this.data.rad/SF.STARMAP_ZOOM);
            } else if (this.data.type !== SF.TYPE_STRUCT_WORMHOLE && this.titleimage !== null) {
                this.tier.context.drawImage(this.titleimage, offx / SF.STARMAP_ZOOM + SF.HALF_WIDTH - TITLE_WIDTH / 2, offy / SF.STARMAP_ZOOM + SF.HALF_HEIGHT - TITLE_HEIGHT / 2);
            }						
            return true;
        },
				// Gets the distance (squared) of the mouse from the object.
				WormholeDistance: function(mousex, mousey) {
          if (this.data.type !== SF.TYPE_STRUCT_WORMHOLE) {
						return -1;
					}
          var offx = this.data.x - mousex;
          var offy = this.data.y - mousey;
					return offx*offx+offy*offy;
				},
        // Name gets drawn on top of everything
        updateName: function(shipx, shipy, mousex, mousey) {
					if (!this.WillDraw()) {
						return;
					}
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
          if (this.data.type === SF.TYPE_STRUCT_WORMHOLE) {
						if (this.InWormholeRange(mousex, mousey)) {
							// Overwrite its name based on the entry and end points. Lazy here since it might
							// be a bit expensive.
							if (!this.wormhole_init) {
								this.wormhole_init = true;
	              var targetStruct = this.data.parent.wormholeResolve(this.data);							
	              this.data.name = ST.structName(SU.r(this.data.x + this.data.y + targetStruct.x + targetStruct.y, 0), this.data.type);
								this.buildImage();
							}							
							if (this.titleimage !== null) {
	              this.tier.text_context.drawImage(this.titleimage, offx / SF.STARMAP_ZOOM + SF.HALF_WIDTH - TITLE_WIDTH / 2, offy / SF.STARMAP_ZOOM + SF.HALF_HEIGHT - TITLE_HEIGHT / 2);
							}
							return true;
						}
          }
					return false;
        },
				InWormholeRange: function(shipx, shipy) {
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
					return offx*offx+offy*offy < 40000;
				},
				TryActivate: function(shipx, shipy) {
          if (this.data.type === SF.TYPE_STRUCT_WORMHOLE) {
						if (this.InWormholeRange(shipx, shipy)) {
              if (!this.data.justentered) {
								// Check that neither end is in alpha space. There might be better ways to handle
								// this, but it's convenient to just deactivate wormholes as they get eaten.
                let region_data = new SBar.RegionData(this.data.x, this.data.y);
								let race = region_data.DetermineRace(this.data.x, this.data.y).race;
								if (race.seed === SF.RACE_SEED_ALPHA) {
									SU.message("Inactive");
									return false;
								}
                var targetStruct = this.data.parent.wormholeResolve(this.data);
                region_data = new SBar.RegionData(targetStruct.x, targetStruct.y);
								race = region_data.DetermineRace(targetStruct.x, targetStruct.y).race;
								if (race.seed === SF.RACE_SEED_ALPHA) {
									SU.message("Inactive");
									return false;
								}
								S$.game_stats.wormhole_visits++;
                this.data.justentered = true;
                S$.addKnownWormhole(this.data.x, this.data.y, targetStruct.x, targetStruct.y);
                S$.addKnownWormhole(targetStruct.x, targetStruct.y, this.data.x, this.data.y);
								let activate_callback = function() {
									this.tier.shipx = targetStruct.x;
									this.tier.shipy = targetStruct.y;
									this.tier.SetNewLocation(); // Includes re-renderering.
								}
								SU.GetTravelRenderer().ToSystem(this.tier.jump_time, new SBar.DummySystemData(), activate_callback.bind(this));
              }
							return true;
						} else if (this.data.justentered) {
              this.data.justentered = false;
            }
					}
					return false;
				},
				// Returns true if dialog started.
				CheckEffect: function(shipx, shipy, fail_pre_callback) {
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
					// /4 for half rad, for conservative check right now.
					if (offx*offx+offy*offy > this.data.rad*this.data.rad/4) {
						return;
					}
					if (this.data.type == SF.TYPE_STRUCT_BARREN) {
						// Barren slow currently disabled.
						//if (!SE.PassTime(5, fail_pre_callback)) {
						//	return true;
						//}
					} else if (this.data.type == SF.TYPE_STRUCT_BADLAND) {
						if (SU.r(S$.time, 2.22) < 0.1) {
							SG.death_message = "Death by misadventure (killed while exploring a charged nebula).";  // Death by misadventure references Bruce Lee.
							SU.DamageInterrupt("Shocking Development", "Navigating the charged nebula of "+this.data.name+" the ship and crew take a beating.", 0.05, fail_pre_callback)
							return true;
						}
					} else if (this.data.type == SF.TYPE_STRUCT_BLACKHOLE) {
						SG.death_message = "Death by misadventure (killed while exploring a black hole).";
						SU.DamageInterrupt("Into the Well, Deeply", "Gravitational forces of the "+this.data.name+" tear at the ship.", 0.15, fail_pre_callback)
						return true;
					}
					return false;
				},
        // Drawing functions
        drawBadland: function() {
            var color = '#744';
            this.imagecontext.save();
            this.imagecontext.translate(this.imagesize / 2, this.imagesize / 2);
            var seed = SU.r(this.data.parent.seed, this.data.x + this.data.y);
            var bubbles = Math.floor(SU.r(seed, 501.11)) * 10 + 10;
            for (var i = 0; i < bubbles; i++) {
                var rot = SU.r(seed, 502.11 + i) * Math.PI * 2;
                var dist = SU.r(seed, 503.11 + i) * this.imagesize / 8 + this.imagesize / 8;
                var size = SU.r(seed, 504.11 + i) * this.imagesize / 7 + this.imagesize / 8;
                this.imagecontext.rotate(rot);
                SU.circle(this.imagecontext, 0, dist, size, color);
            }
            this.imagecontext.restore();
        },
        drawNebula: function() {
            var color = '#444';
            SU.circle(this.imagecontext, this.imagesize / 2, this.imagesize / 2, this.imagesize * 2 / 6, color); // little smaller than full zone
            this.imagecontext.restore();
        },
        drawWall: function() {
            var color = '#444';
            var wallSeed = SU.r(this.data.parent.seed, this.data.x + this.data.y);
            var angle = SU.r(wallSeed, 21.12) * Math.PI * 2;
            var dist = this.imagesize * 4 / 9;
            SU.line(this.imagecontext, 0 - Math.sin(angle) * dist + this.imagesize / 2, 0 - Math.cos(angle) * dist + this.imagesize / 2, Math.sin(angle) * dist + this.imagesize / 2, Math.cos(angle) * dist + this.imagesize / 2, color, 10);
        },
        drawBarren: function() {
            // draw crossing arrows
            var color = '#444';
            var half = this.imagesize;
            var len = this.imagesize / 3 + 3;
            var width = half / 15;
            var tri = this.imagesize / 9;
            var buff = this.imagesize / 10;
            SU.line(this.imagecontext, half / 2 - len, half / 2, half / 2 + len, half / 2, color, width);
            SU.line(this.imagecontext, half / 2, half / 2 - len, half / 2, half / 2 + len, color, width);

            SU.triangle(this.imagecontext, buff, half / 2, buff + tri, half / 2 - tri, buff + tri, half / 2 + tri, color);
            SU.triangle(this.imagecontext, this.imagesize - buff, half / 2, this.imagesize - tri - buff, half / 2 - tri, this.imagesize - tri - buff, half / 2 + tri, color);
            SU.triangle(this.imagecontext, half / 2, buff, half / 2 - tri, tri + buff, half / 2 + tri, tri + buff, color);
            SU.triangle(this.imagecontext, half / 2, this.imagesize - buff, half / 2 - tri, this.imagesize - tri - buff, half / 2 + tri, this.imagesize - tri - buff, color);
        },
        drawBlackhole: function() {
            var colorStops = [0, 'black', 0.1, 'black', 0.1, '#744', 0.2, 'rgba(160,80,80,0.5)', 0.98, 'rgba(160,80,80,0.0)', 0.98, '#744', 1, '#744'];
            SU.circleRad(this.imagecontext, this.imagesize / 2, this.imagesize / 2, this.imagesize / 5, colorStops);
        },
        drawMinefield: function() {
            this.imagecontext.save();
            this.imagecontext.translate(this.imagesize / 2, this.imagesize / 2);
            var color = '#744';
            var linewidth = this.imagesize / 10;
            var cirrad = this.imagesize / 5;
            var spikerad = this.imagesize / 2;
            SU.circle(this.imagecontext, 0, 0, cirrad, color);
            var spikes = 6;
            for (var i = 0; i < spikes / 2; i++) {
                SU.line(this.imagecontext, 0 - spikerad, 0, spikerad, 0, color, linewidth);
                this.imagecontext.rotate(Math.PI / (spikes / 2));
            }
            this.imagecontext.restore();
        },
        drawWormhole: function() {
            var size = Math.floor(this.imagesize/2)*2;
            
            //var colorseed = SU.r(this.data.parent.seed, this.data.x + this.data.y);
            var colorseed = SU.r(this.data.parent.x + this.data.parent.y + this.data.trx + this.data.try + this.data.i, 0);
            var r = Math.floor(SU.r(colorseed, 1)*128+128);
            var g = Math.floor(SU.r(colorseed, 2)*128+128);
            var b = Math.floor(SU.r(colorseed, 3)*128+128);
            
            SU.rect(this.imagecontext, 0, 0, size, size, 'rgba('+r+','+g+','+b+',1)');
            //SU.rect(this.imagecontext, 0, 0, size, size, 'rgba(0,0,0,0)', color, 2);
            
            
            //SU.line(this.imagecontext, 0, this.imagesize / 2-0.5, this.imagesize, this.imagesize / 2-0.5, color, 2);
            //SU.line(this.imagecontext, this.imagesize / 2-0.5, 0, this.imagesize / 2-0.5, this.imagesize, color, 2);
            //var colorStops = [0, 'green', 1, 'green'];
            //SU.circleRad(this.imagecontext, this.imagesize / 2, this.imagesize / 3, this.imagesize / 3, colorStops);
            
            var knownWormhole = S$.getKnownWormhole(this.data.x,this.data.y);
            if (knownWormhole !== undefined) {
                this.wormhole = knownWormhole;
            }
        },
        teardown: function() {
        }
    };
    SU.extend(SBar.IconMapStruct, SBar.Icon);
})();

	
