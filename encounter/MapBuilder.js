/*
 * Battlebuilder map portions.
 */
(function() {	
	
  var forew = SF.WIDTH;
  var foreh = SF.WIDTH;
  var hallbuff = 400; // add some buffer for halls

	var round22 = function(val) {
	    return Math.round(val * 22) / 22;
	};
	
	// Reminder that all the hero names need to be unique.
	SBar.MapBuilder = function(data, map_sizex, map_sizey) {
		this._initMapBuilder(data, map_sizex, map_sizey);
	};

	SBar.MapBuilder.prototype = {
		type: SF.TYPE_MAP_BUILDER,
		seed: null,
		data: null,
		s: null, // Random incrementing seed.
		map: null,
		bufi: null,
		bufc: null,
		forei: null,
		forec: null,
		ship_image: null,
		map_sizex: null,
		map_sizey: null,
		background: null,
		background_ctx: null,
		building: null,
		building_ctx: null,
		
		_initMapBuilder: function(data, map_sizex, map_sizey) {
			this.data = data;
			this.seed = data.seed;
	
			this.map_sizex = map_sizex;
			this.map_sizey = map_sizey;
			this.s = 0;
		},
		
		BuildBackground: function() {
			if (!this.data.is_building_data && this.data.type !== SF.TIER_PLANETSIDER && this.data.type !== SF.TYPE_PLANET_DATA
			    && this.data.type !== SF.TIER_STARMAP && this.data.type !== SF.TYPE_BELT_DATA && this.data.type !== SF.TYPE_SYSTEM_DATA) {
				error("TODO: unsupported background",this.data.type);
			}
			
      var background = document.createElement('canvas');
      background.width = SF.WIDTH;
      background.height = SF.HEIGHT;
      var background_ctx = background.getContext('2d');

      var building = document.createElement('canvas');
      building.width = SF.WIDTH;
      building.height = SF.HEIGHT;
      var building_ctx = building.getContext('2d');
			
			if (this.data.type === SF.TIER_STARMAP || this.data.type === SF.TYPE_BELT_DATA || this.data.type === SF.TYPE_SYSTEM_DATA) {
				// Synthetic space combat.
				background_ctx.drawImage(SU.draw2DStarsBackground(),0,0);
			} else if (this.data.parentData.type == SF.TYPE_PLANET_DATA && this.data.parentData.ggiant) {
				var surface_image = this.data.parentData.terrainimg;
				var source_size = Math.floor(SU.r(this.seed, 5.4)*30)+30;
				var x = this.data.x-Math.floor(source_size/2);
				var y = this.data.y-Math.floor(source_size/2);
				if (!x) {
					// TEMPORARY pick a place on the surface for planet data. This should migrate to buildings or other surface items.
					x = 100;
					y = 100;
				}
				if (x < 0) x = 0;
				if (x + source_size >= surface_image.width) {
					x = surface_image.width - source_size - 1;
				}
				if (y < 0) y = 0;
				if (y + source_size >= surface_image.height) {
					y = surface_image.height - source_size - 1;
				}
//				let detailed_surface_image = BuildDetailedSurface(surface_image, )
				background_ctx.drawImage(surface_image, x, y, source_size, source_size, 0, 0, SF.WIDTH, SF.HEIGHT);
	      //TU.rect(background_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(255,255,255,0.5)');  // Lighten it for easier reading.
			} else if (this.data.type == SF.TIER_PLANETSIDER) {
				let background_image = this.data.data.getPlanetTerrain().renderWindow(this.data.x, this.data.y);
				background_ctx.drawImage(background_image, 0, 0, SF.WIDTH, SF.HEIGHT);
			} else if (this.data.type == SF.TYPE_PLANET_DATA) {
				// Planet on the surface. Largely similar to below.
				let background_image = this.data.getPlanetTerrain().renderWindow(this.data.x, this.data.y);
				background_ctx.drawImage(background_image, 0, 0, SF.WIDTH, SF.HEIGHT);
			} else if (this.data.parentData.type == SF.TYPE_PLANET_DATA) {
				let background_image = this.data.parentData.getPlanetTerrain().renderWindow(this.data.x, this.data.y);
				background_ctx.drawImage(background_image, 0, 0, SF.WIDTH, SF.HEIGHT);
			} else if (this.data.parentData.type == SF.TYPE_BELT_DATA) {
				if (this.data.parentData.is_starport) {
					let colors = this.data.parentData.StarportColors();
					// Same as 2beltD.js.
					color_stops = [0, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)', 0.1, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 0.5, 'rgba(255,255,255,1)', 0.9, 'rgba('+colors.r+','+colors.g+','+colors.b+',1)', 1, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)'];
					SU.rectGrad(background_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, 0, SF.HEIGHT, color_stops);
					SU.rect(background_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,0.5)');  // Don't want a bright background.
				} else if (this.data.parentData.is_party_yacht) {
					background_ctx.globalAlpha = 0.5;  // Don't want a bright background.
					this.data.parentData.DrawAlphaPartyYacht(background_ctx, SF.WIDTH*10, SF.HEIGHT*10);
					background_ctx.globalAlpha = 1;
				} else {
					// Building on an asteroid. Note starports use no background (space).
	//					var surface_image = this.data.parentData.getPlanetTerrain().renderTerrain().img;
					//var aindex = this.data.index;
					//var aobj = this.data.parentData.asteroids[aindex];
					var aobj = this.data.parentData.GetAsteroidAt(this.data.x, this.data.y);
					var orig_data = this.data;  // TEMPORARY DATA SWITCH FOR PROTOTYPE
					this.data = this.data.parentData; // set to belt for asteroid generation, it uses a couple local vars
					this.generateAsteroid = SBar.IconAsteroid.prototype.generateAsteroid;
					var asize = 128;
					var seed = this.data.seed + aobj.x + aobj.y;
					var objs = this.generateAsteroid(asize, asize, seed);
					var imageDataBig = objs[0];
					this.data = orig_data;
					var orig_data = this.data;  // END TEMPORARY DATA SWITCH FOR PROTOTYPE

					var asti = document.createElement('canvas');
					asti.width = asize;
					asti.height = asize;
					var astc = asti.getContext('2d');

					TU.rect(background_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, '#000');
					astc.putImageData(imageDataBig, 0, 0);

					var source_size = Math.floor(SU.r(this.seed, 5.4)*20)+20;
					var startx = Math.floor(SU.r(this.seed, 5.5)*30)+30;
					var starty = Math.floor(SU.r(this.seed, 5.6)*30)+30;

					//var surface_image = this.data.parentData.asteroids[0].bdata.asteroidImg;
					background_ctx.drawImage(asti, startx, starty, source_size, source_size, 0, 0, SF.WIDTH, SF.HEIGHT);
		      //TU.rect(background_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(255,255,255,0.25)');  // Lighten it for easier reading.
				}
			} else {
				error("No background type");
			}
			this.background_ctx = background_ctx;
			this.background = background;
			this.building_ctx = building_ctx;
			this.building = building;
		},
		
		BuildMap: function(force_larger_room) {
      let clip_map = document.createElement('canvas'); // seeds the playfield barriers
      clip_map.width = SF.WIDTH;
      clip_map.height = SF.HEIGHT;
      let clip_ctx = clip_map.getContext('2d');
//      TU.rect(clip_ctx, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");
//      TU.circle(clip_ctx, 400, 400, 395, "#FFF");

//			this.genMapMall();

			var r = Math.floor(SU.r(this.seed, 9.87) * 100);
			var g = Math.floor(SU.r(this.seed, 9.77) * 100);
			var b = Math.floor(SU.r(this.seed, 9.67) * 100);
			this.wall_color = 'rgb('+r+','+g+','+b+')';

			
      let composite = document.createElement('canvas');
      composite.width = SF.WIDTH;
      composite.height = SF.HEIGHT;
      let composite_ctx = composite.getContext('2d');


			var gen_function;
      switch (this.data.type) {
				case SF.TYPE_PLANET_DATA:
          gen_function = this.genMapPlanet.bind(this);
					break;
        case SF.TYPE_TEMPLE:
        case SF.TYPE_TEMPLE_BAR:
          gen_function = this.genMapTemple.bind(this);
          break;
        case SF.TYPE_DERELICT:
          gen_function = this.genMapDerelict.bind(this);
          break;
        case SF.TYPE_COLONY:
          gen_function = this.genMapBigRoom.bind(this);
          break;
        case SF.TYPE_LAB:
          gen_function = this.genMapLab.bind(this);
          break;
        case SF.TYPE_MINING:
          gen_function = this.genMapMine.bind(this);
          break;
        case SF.TYPE_ANIMAL:
        case SF.TYPE_GOODY_HUT:
          gen_function = this.genMapAnimal.bind(this);
          break;
				case SF.TIER_STARMAP:
				case SF.TYPE_BELT_DATA:
				case SF.TYPE_SYSTEM_DATA:
					// Note synthetic input object type when coming from starmap.
          gen_function = this.genMapPlayerShip.bind(this);
					break;
        case SF.TYPE_ARENA:
          gen_function = this.genMapArena.bind(this);
					break;
        case SF.TYPE_ALPHA_HQ:
          gen_function = this.genMapAlphaHq.bind(this);
					break;
        case SF.TYPE_ALPHA_DANCE:
          gen_function = this.genMapAlphaDance.bind(this);
					break;
        case SF.TYPE_CORNFIELD:
          gen_function = this.genMapCornfield.bind(this);
					break;
        case SF.TYPE_ALPHA_AIRPORT:
          gen_function = this.genMapAlphaAirport.bind(this);
					break;
        case SF.TYPE_ALPHA_BARRACKS:
          gen_function = this.genMapAlphaBarracks.bind(this);
					break;
        case SF.TYPE_ARMORY:
        case SF.TYPE_CITY_ARTI:
        case SF.TYPE_CITY_ORE:
        case SF.TYPE_CITY_GOODS:
        case SF.TYPE_CITY_CONTRA:
        case SF.TYPE_CITY_ALL:
        case SF.TYPE_CITY_SPECIAL:
        case SF.TYPE_CITY_SHIP:
        case SF.TYPE_CONSTRUCTION:
        default:
          gen_function = this.genMapMall.bind(this);
          break;
      }
			gen_function(clip_ctx, "#FFF");
			if (force_larger_room) {
				SU.regularPolygon(clip_ctx, clip_map.width/2, clip_map.height/2, 6, clip_map.width/4,  "#FFF");
				SU.regularPolygon(this.building_ctx, clip_map.width/2, clip_map.height/2, 6, clip_map.width/4, this.wall_color, this.wall_color, 10);
			}
			gen_function(this.building_ctx, this.wall_color, this.wall_color);
			
			centerxy = this.ApproximateCenter(clip_map, clip_map.width, clip_map.height);
			clip_map = this.CenterImage(clip_map, centerxy[0], centerxy[1]);
			this.building = this.CenterImage(this.building, centerxy[0], centerxy[1]);
			this.building_ctx = this.building.getContext('2d');
			
			composite_ctx.drawImage(clip_map, 0, 0);
			
			
			this.drawFore();
      composite_ctx.globalCompositeOperation = 'source-in';
			var source_size = Math.floor(SU.r(this.seed, 7.4)*(forew-20)/2)*2+20;
			var startx = forew/2 - source_size/2; //Math.floor(SU.r(this.seed, 7.5)*(forew-source_size));
			var starty = foreh/2 - source_size/2; //Math.floor(SU.r(this.seed, 7.6)*(foreh-source_size));
			
      composite_ctx.drawImage(this.forei, startx, starty, source_size, source_size, 0, 0, SF.WIDTH, SF.HEIGHT);
//			if (this.data.type !== SF.TYPE_DERELICT) {
				this.building_ctx.drawImage(composite, 0, 0);
//			}

      this.map = new JTact.Map(clip_map, this.background, this.building, this.map_sizex, this.map_sizey);
      this.map.name = "todomapname";
			TG.data.map = this.map;
			
//      map.updateBarrier(35, 35, 9, true, true); // vision testing
			
		},
		
		// Returns a roughly centered image.
		ApproximateCenter: function(original_image, width, height) {
			let context = original_image.getContext('2d');
      let data = context.getImageData(0, 0, width, height).data;
			let maxx = 0;
			let minx = width;
			let maxy = 0;
			let miny = height;
			for (let x = 0; x < width; x += 25) {
				for (let y = 0; y < height; y += 25) {
					// White clip, all colors should be present.
					if (data[(y*width+x)*4] > 0) {
						if (x < minx) {
							minx = x;
						}
						if (x > maxx) {
							maxx = x;
						}
						if (y < miny) {
							miny = y;
						}
						if (y > maxy) {
							maxy = y;
						}
					}
				}				
			}
			let centerx = -Math.round((maxx + minx)/2 - width/2);
			let centery = -Math.round((maxy + miny)/2 - height/2);
			return [centerx, centery];
		},
		
		CenterImage: function(original_image, centerx, centery) {
      let new_image = document.createElement('canvas');
      new_image.width = original_image.width;
      new_image.height = original_image.height;
      let new_context = new_image.getContext('2d');
			
			new_context.drawImage(original_image, centerx, centery)
			return new_image;
		},
		
		genMapPlanet: function(context, color, border) {
			// Simple oval.
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			context.scale(1.3, 1);
			if (border) {
	      TU.circle(context, 0, 0, 350, color, border, 10);
			} else {
	      TU.circle(context, 0, 0, 350, color);
			}
			context.restore();			
		},		
		
		genMapMall: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			if (border) {
	      TU.circle(context, 0, 0, 200, color, border, 10);
			} else {
	      TU.circle(context, 0, 0, 200, color);
			}
      var angle = SU.r(this.seed, 62.2) * PIx2 * 3 / 16 + PIx2 / 12;
      while (angle < PIx2) {
				context.save();
				context.rotate(angle);
				if (border) {
					SU.line(context, 0, 0, 300, 0, border, 110)
				} else {
					SU.line(context, 0, 0, 300, 0, color, 100)
				}
				if (border) {
					SU.regularPolygon(context, 300, 0, 6, 90, color, border, 10);
				} else {
					SU.regularPolygon(context, 300, 0, 6, 90, color);
				}
				context.restore();
        angle += SU.r(this.seed, angle) * PIx2 * 3 / 16 + PIx2 / 6;
      }
			context.restore();			
		},
		
		genMapDerelict: function(context, color, border) {
			if (!this.ship_image) {
				let ship = new SBar.Ship(/*type=*/SF.SHIP_ALPHA, /*level=*/1, this.seed, 0);
				this.ship_image = ship.GetImage(SF.HEIGHT*2, /*rotate=*/false, 2000); 
				this.ship_interior_image = ship.GetImage(SF.HEIGHT*2, /*rotate=*/false, 2000, /*interior_only=*/true); 
			}
			this.DrawShipCommon(context, color);
		},		
		
		genMapPlayerShip: function(context, color, border) {
			if (!this.ship_image) {
				var image_size = SF.HEIGHT*0.75;
				this.ship_image = S$.ship.GetImage(SF.HEIGHT*2, /*rotate=*/false, 2000); 
				this.ship_interior_image = S$.ship.GetImage(SF.HEIGHT*2, /*rotate=*/false, 2000, /*interior_only=*/true); 
			}
			this.DrawShipCommon(context, color);
		},
		
		DrawShipCommon: function(context, color) {
			if (color == "#FFF") {  // Clipping
				context.save();
				SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, "#FFF");
				context.globalCompositeOperation="destination-in";	 // Preserve the shape as white.
	      context.drawImage(this.ship_interior_image, (SF.WIDTH-SF.HEIGHT)-SF.HALF_WIDTH, -SF.HALF_HEIGHT);
				context.restore();			
			} else {
	      context.drawImage(this.ship_image, (SF.WIDTH-SF.HEIGHT)-SF.HALF_WIDTH, -SF.HALF_HEIGHT);
			}
		},
				
		genMapArena: function(context, color, border) {
			// Simple large octogon arena.
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			SU.regularPolygon(context, 0, 0, 8, SF.HALF_WIDTH*2/3, "#FFF");
			context.restore();
		},

				
		genMapAlphaDance: function(context, color, border) {
			// Large square. It's a dance floor!
			let width = SF.HEIGHT*0.7;
			this.BorderRect(context, SF.HALF_WIDTH-width/2, SF.HALF_HEIGHT-width/2, width, width, color, border, 10);
		},
		
		genMapCornfield: function(context, color, border) {
			// Large square. It's a cornfield..
			let width = SF.HEIGHT*0.5;
			this.BorderRect(context, SF.HALF_WIDTH-width/2, SF.HALF_HEIGHT-width/2, width, width, color, border, 10);
		},
		
		// ST:TNG bridge layout, main elements.
		genMapAlphaHq: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			// Main bridge.
			this.BorderCircle(context, 0, 0, SF.HALF_WIDTH*0.5, color, border, 10)
			if (border) {
				context.clearRect(-SF.HALF_WIDTH, SF.HALF_HEIGHT*0.4+5, SF.WIDTH, SF.HALF_HEIGHT);
			} else {
				context.clearRect(-SF.HALF_WIDTH, SF.HALF_HEIGHT*0.4, SF.WIDTH, SF.HALF_HEIGHT);
			}
			// Turbolifts.
			this.BorderCircle(context, -SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, SF.HALF_WIDTH*0.15, color, border, 10)
			this.BorderCircle(context, SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, SF.HALF_WIDTH*0.15, color, border, 10)
			if (border) {
				SU.line(context, -SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, 0, 0, color, 100);
				SU.line(context, SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, 0, 0, color, 100);
			} else {
				SU.line(context, -SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, 0, 0, color, 90);
				SU.line(context, SF.HALF_WIDTH*0.4, -SF.HALF_HEIGHT*0.7, 0, 0, color, 90);
			}
			// Ready room. More or less.
			this.BorderRect(context, SF.HALF_WIDTH*0.5, -SF.HALF_HEIGHT*0.3, SF.HALF_WIDTH*0.25, SF.HALF_HEIGHT*0.5, color, border, 10);
			if (border) {
				SU.line(context, 0, 0, SF.HALF_WIDTH*0.6, 0, color, 100);
			} else {
				SU.line(context, 0, 0, SF.HALF_WIDTH*0.6, 0, color, 90);
			}
			
			context.restore();
		},
		
		// Fly strips.
		genMapAlphaAirport: function(context, color, border) {
			for (let i = 0; i < Math.floor(SU.r(this.seed, 93.11)*7)+4; i++) {
				let width = SU.r(this.seed, 93.12+i)*90+50;
				let x1 = SF.WIDTH/10;
				let x2 = SF.WIDTH*9/10;
				let y1 = SF.HEIGHT/10;
				let y2 = SF.HEIGHT*9/10;
				let spot = SU.r(this.seed, 93.12+i)*SF.HEIGHT*0.6+SF.HEIGHT*0.2;
				if (i%2 == 0) {
					x1 = spot;
					x2 = spot;
					if (border) {
						y1 -= 5;
						y2 += 5;
					}
				} else {
					y1 = spot;
					y2 = spot;
					if (border) {
						x1 -= 5;
						x2 += 5;
					}
				}
				if (border) {
					SU.line(context, x1, y1, x2, y2, border, width+10)
				} else {
					SU.line(context, x1, y1, x2, y2, color, width)
				}
			}
		},		
		
		// Squares.
		genMapAlphaBarracks: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			let half_size = Math.round(SU.r(this.seed, 92.12)*SF.HALF_HEIGHT/3+SF.HALF_HEIGHT/2);
			this.BorderRect(context, -half_size, -half_size, half_size*2, half_size*2, color, border, 10);
			for (let i = 0; i < Math.floor(SU.r(this.seed, 92.13)*4)+1; i++) {
				let half_size = Math.round(SU.r(this.seed, 92.12+i)*SF.HALF_HEIGHT/3+SF.HALF_HEIGHT/3);
				let x = Math.round(SU.r(this.seed, 92.15+i)*SF.HALF_HEIGHT*2/3-SF.HALF_HEIGHT/3);
				let y = Math.round(SU.r(this.seed, 92.16+i)*SF.HALF_HEIGHT*2/3-SF.HALF_HEIGHT/3);
				this.BorderRect(context, x-half_size, y-half_size, half_size*2, half_size*2, color, border, 10);
			}
			context.restore();
		},
				
		genMapTemple: function(context, color, border) {
			// Chain of rooms, very squarelike.
			var s = 1;
			var size = round22((SU.r(this.seed, 8.8)*100)*2+100);
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			
			this.BorderRect(context, -size/2, -size/2, size, size, color, border, 10);
			/*
			if (border) {
				SU.rect(context, -size/2, -size/2, size, size, color, border, 10);
			} else {
				SU.rect(context, -size/2, -size/2, size, size, color);
			}
			*/
			var prevx = 0;
			var prevy = 0;
			var nextx = prevx;
			var nexty = prevy;
			var maxx = 0;
			var maxy = 0;
			var num_boxes = Math.floor(SU.r(this.seed, 8.7)*6)+2;
			for (var i = 0; i < num_boxes; i++) {
				size = round22(Math.floor(SU.r(this.seed, 8.5)*100)*2+130);
				if (SU.r(this.seed, 8.6+s) < 0.5) {
					nextx = round22(Math.floor(SU.r(this.seed, 8.5+s)*(SF.WIDTH-size)) + size/2 - SF.HALF_WIDTH);
					if (Math.abs(nextx) > maxx) {
						maxx = round22(Math.abs(nextx));
					}
				} else {
					nexty = round22(Math.floor(SU.r(this.seed, 8.4+s)*(SF.HEIGHT-size)) + size/2 - SF.HALF_HEIGHT);
					if (Math.abs(nexty) > maxy) {
						maxy = round22(Math.abs(nexty));
					}
				}
				var line_width = Math.floor(SU.r(this.seed, 8.4+s)*50)+80;
				if (border) {
					SU.line(context, prevx, prevy, nextx, nexty, border, line_width+10)
//					SU.rect(context, nextx-size/2, nexty-size/2, size, size, color, border, 10);
				} else {
					SU.line(context, prevx, prevy, nextx, nexty, color, line_width)
//					SU.rect(context, nextx-size/2, nexty-size/2, size, size, color);
				}
				this.BorderRect(context, nextx-size/2, nexty-size/2, size, size, color, border, 10);				
				prevx = nextx;
				prevy = nexty;
				s++;				
			}
			if (maxx < 150 && maxy < 150) {
				// Didn't get big enough. Add some space.
				if (border) {
					SU.line(context, -305, 0, 305, 0, border, 130)
				} else {
					SU.line(context, -300, 0, 300, 0, color, 120)
				}
			}
			context.restore();
		},
		
    genMapLab: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			context.rotate(SU.r(this.seed, 33.2)*PIx2);

      var steps = 40 + Math.floor(SU.r(this.seed, 73.1) * 30);
      var gridsize = 3; // minimum 5x5
      var mid = Math.floor(gridsize / 2);
      var x = mid;
      var y = mid;
      var points = {};

      var rot = SU.r(this.seed, 99) * PIx2;
      var s = Math.sin(rot);
      var c = Math.cos(rot);

      while (steps > 0) {
        if (SU.r(this.seed, 75.1 + steps) < 0.07) {
          // reset to the center, so there are more dead ends
          x = mid;
          y = mid;
        }
        steps--;
        points[x + ',' + y] = true;
        if (SU.r(this.seed, 78.1 + steps) > 0.5) { // horiz
          if (SU.r(this.seed, 78.2 + steps) > 0.5) {
            if (x > 0) {
              x--;
            }
          } else {
            if (x < gridsize - 1) {
              x++;
            }
          }
        } else { // vert
          if (SU.r(this.seed, 78.3 + steps) > 0.5) {
            if (y > 0) {
              y--;
            }
          } else {
            if (y < gridsize - 1) {
              y++;
            }
          }
        }
      }
      // rotation:
      // x -> x*c-y*s
      // y -> x*s+y*c
      // now build the rooms
      var roomsize = 100 * SU.r(this.seed, 79.1) + 100;
      var spacing = 150 * SU.r(this.seed, 79.2) + 200; // don't make it exactly the same as roomsize, for pathing
      var hallw = 80 * SU.r(this.seed, 79.3) + 80;
      var sides = 4 + Math.floor(SU.r(this.seed, 79.4) * 4) * 2;
      for (var i = 0; i < gridsize; i++) { // x
        for (var j = 0; j < gridsize; j++) { // y
          if (points[i + ',' + j] === true) {
            var x = (i - mid) * spacing;
            var y = (j - mid) * spacing;
						if (border) {
							SU.regularPolygon(context, x * c - y * s, x * s + y * c, sides, roomsize, color, border, 10);
						} else {
							SU.regularPolygon(context, x * c - y * s, x * s + y * c, sides, roomsize, color);
						}
            if (i < gridsize && points[(i + 1) + ',' + j] === true) {
							if (border) {
								SU.line(context, x * c - y * s, x * s + y * c, (x + spacing) * c - y * s, (x + spacing) * s + y * c, border, 90)
							} else {
								SU.line(context, x * c - y * s, x * s + y * c, (x + spacing) * c - y * s, (x + spacing) * s + y * c, color, 80)
							}
            }
            if (j < gridsize && points[i + ',' + (j + 1)] === true) {
							if (border) {
								SU.line(context, x * c - y * s, x * s + y * c, x * c - (y + spacing) * s, x * s + (y + spacing) * c, border, 90)
							} else {
								SU.line(context, x * c - y * s, x * s + y * c, x * c - (y + spacing) * s, x * s + (y + spacing) * c, color, 80)
							}
            }

          }
        }
      }
			context.restore();
    },		
				
    // Algorithm is sprinkle a bunch of rooms, then connect rooms outward, always selecting closest room to connect to
    genMapMine: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
      var num = Math.floor(SU.r(this.seed, 6.1) * 10) + 5;
      var rooms = [];
      var known = [];
      var size = SU.r(this.seed, 6.4) * 250 + 300;
      this.genRandom(context, color, border, size, 0, 0);
      known.push([0, 0]);
      for (var i = 0; i < num; i++) {
        var size = SU.r(this.seed, 6.3 + i) * 250 + 250;
        var x = SU.r(this.seed, 6.1 + i) * (SF.WIDTH - size * 2 - hallbuff) - SF.HALF_WIDTH + size + hallbuff / 2;
        var y = SU.r(this.seed, 6.2 + i) * (SF.HEIGHT - size * 2 - hallbuff) - SF.HALF_HEIGHT + size + hallbuff / 2;
        this.genRandom(context, color, border, size, x, y);
        rooms.push([x, y, x * x + y * y]);
      }
      rooms.sort(function(a, b) {
        return a[2] - b[2];
      });
      for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var max = 999999999999;
        var choice = null;
        for (var j = 0; j < known.length; j++) {
          var room2 = known[j];
          var dx = room2[0] - room[0];
          var dy = room2[1] - room[1];
          var d = dx * dx + dy * dy;
          if (d < max) {
            max = d;
            choice = room2;
          }
        }
        var width = SU.r(this.seed, 6.5 + i) * 75 + 80;
				if (border) {
					SU.line(context, room[0], room[1], choice[0], choice[1], border, width+10)
				} else {
					SU.line(context, room[0], room[1], choice[0], choice[1], color, width)
				}
        known.push(room);
      }
			context.restore();
    },				
		
		// Big arena.
    genMapAnimal: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
      var size = 800; //SU.r(this.seed, 6.4) * 000 + 800;
      this.genRandom(context, color, border, size, 0, 0);
			context.restore();
    },						
		
    genMapBigRoom: function(context, color, border) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
      var dist = 300;
      this.genRandom(context, color, border, dist * 3, 0, 0);
      var num = Math.floor(SU.r(this.seed, 15.1) * 7) + 3;
      for (var i = 0; i < num; i++) {
        var angle = SU.r(this.seed, 15.15 + i) * PIx2;
        var size = SU.r(this.seed, 15.25 + i) * 300 + 250;
        var x = Math.sin(angle) * dist;
        var y = Math.cos(angle) * dist;
        this.genRandom(context, color, border, size, x, y);
      }
      var dist = 350;
      var num = Math.floor(SU.r(this.seed, 16.1) * 7) + 3;
      for (var i = 0; i < num; i++) {
        var angle = SU.r(this.seed, 16.15 + i) * PIx2;
        var size = SU.r(this.seed, 16.25 + i) * 200 + 400;
        var x = Math.sin(angle) * dist;
        var y = Math.cos(angle) * dist;
        this.genRandom(context, color, border, size, x, y);
      }
			context.restore();
    },						
		
    genRandom: function(context, color, border, size, x, y) {
			var s = 1;
			
			// Identify the angles first.
      var numpoints = Math.floor(SU.r(this.seed, s++) * 12) + 3;
      var rads = [];
      for (var i = 0; i < numpoints; i++) {
        rads.push(SU.r(this.seed, s++) * PIx2);
      }
      rads.push(0);
      rads.push(PIx2 / 3);
      rads.push(PIx2 * 2 / 3);
      numpoints += 3;
      rads.sort(function(a, b) {
        return b - a;
      });

			context.save();
			context.translate(x,y);
			context.save()
			context.rotate(rads[0]);
      context.beginPath();
      var dist = SU.r(this.seed, s++) * size / 4 + size / 4;
      context.moveTo(dist, 0);
			context.restore();
			for (var i = 1; i < rads.length; i++) {
				context.save();
				context.rotate(rads[i]);
	      dist = SU.r(this.seed, s++) * size / 4 + size / 4;
				context.lineTo(dist, 0);
				context.restore();
			}
      context.closePath();
      if (border) {
        context.lineWidth = 10;
        context.strokeStyle = border;
        context.stroke();
      }			
      context.fillStyle = color;
      context.fill();
			context.restore();
    },		
				
    drawFore: function() {
			if (this.data.type === SF.TYPE_TEMPLE || this.data.type === SF.TYPE_TEMPLE_BAR/* || this.data.type === SF.TYPE_DERELICT*/
			    || this.data.type === SF.TYPE_ALPHA_BARRACKS || this.data.type === SF.TYPE_ALPHA_AIRPORT || this.data.type === SF.TYPE_ALPHA_HQ
			    || this.data.type === SF.TYPE_ALPHA_DANCE) {
				this.drawTempleFore();
				return;
			}
			// This algorithm is a modified version of the artifact coloring.
			var size = forew;
	      var stampi = document.createElement('canvas');
	      stampi.width = size;
	      stampi.height = size;
	      var stampc = stampi.getContext('2d');

	      var r = Math.floor(SU.r(this.seed, 12.5) * 100) + 50;
	      var g = Math.floor(SU.r(this.seed, 12.6) * 100) + 50;
	      var b = Math.floor(SU.r(this.seed, 12.7) * 100) + 50;
	      SU.rect(stampc, 0, 0, size, size, 'rgb(' + r + ',' + g + ',' + b + ')');
	      var times = Math.floor(SU.r(this.seed, 12.1) * 30) + 20;
	      for (var i = 0; i < times; i++) {
	        var option = Math.floor(SU.r(this.seed, 12.2 + i) * 3);
	        switch (option) {
	          case 0:
	            SU.circle(stampc, SU.r(this.seed, 17.2 + i) * size, SU.r(this.seed, 17.3 + i) * size, SU.r(this.seed, 17.4 + i) * size/2, 'rgb(' + r + ',' + g + ',' + b + ')');
	            break;
	          case 1:
	            SU.line(stampc, SU.r(this.seed, 18.2 + i) * size, SU.r(this.seed, 18.3 + i) * size, SU.r(this.seed, 18.4 + i) * size, SU.r(this.seed, 18.5 + i) * size, 'rgb(' + r + ',' + g + ',' + b + ')', SU.r(this.seed, 18.4 + i) * size/10);
	            break;
	          case 2:
	            SU.regularPolygon(stampc, SU.r(this.seed, 18.2 + i) * size/2, SU.r(this.seed, 18.3 + i) * size/2, Math.floor(SU.r(this.seed, 18.4 + i) * 9) + 3, SU.r(this.seed, 18.5 + i) * size/4, 'rgb(' + r + ',' + g + ',' + b + ')', null, 0);
	            break;
	        }
	        r += Math.floor(SU.r(this.seed, 9.5 + i) * 100) - 50;
	        g += Math.floor(SU.r(this.seed, 9.6 + i) * 100) - 50;
	        b += Math.floor(SU.r(this.seed, 9.7 + i) * 100) - 50;
					r = fixColor(r);
					g = fixColor(g);
					b = fixColor(b);
	      }
				// Overlay the image on itself, for fractalish varity.
				times = Math.round(SU.r(this.seed, 91.21)*13)+2;
				for (let i = 0; i < times; i++) {
					let alpha1 = SU.r(this.seed, 62.1+i)*0.6+0.15;
					let alpha2 = SU.r(this.seed, 62.2+i)*0.6+0.15;
					let alpha3 = SU.r(this.seed, 62.3+i)*0.6+0.15;
					let alpha4 = SU.r(this.seed, 62.4+i)*0.6+0.15;
					stampc.save();
					stampc.translate(size/2, size/2);
					stampc.rotate(Math.PI/2);
					stampc.globalAlpha = alpha1;
					stampc.drawImage(stampi, -size/2, -size/2, size, size);
					stampc.rotate(Math.PI/2);
					stampc.globalAlpha = alpha2;
					stampc.drawImage(stampi, -size/2, -size/2, size, size);
					stampc.rotate(Math.PI/2);
					stampc.globalAlpha = alpha3;
					stampc.drawImage(stampi, -size/2, -size/2, size, size);
			
					stampc.globalAlpha = alpha4;
					stampc.drawImage(stampi, -size/2, -size/2, size/2, size/2);
					stampc.drawImage(stampi, 0, -size/2, size/2, size/2);
					stampc.drawImage(stampi, -size/2, 0, size/2, size/2);
					stampc.drawImage(stampi, 0, 0, size/2, size/2);
					stampc.restore();
				}
				
				// Random rotate the final image.
				stampc.save();
				stampc.translate(size/2, size/2);
				stampc.rotate(SU.r(this.seed, 91.22)*Math.PI*2);				
				stampc.drawImage(stampi, -size/2, -size/2, size, size);
				stampc.restore();
			
	      this.forei = stampi;
	      this.forec = stampc;
		},
		
		drawTempleFore: function() {
      this.forei = document.createElement('canvas');
      this.forei.width = forew;
      this.forei.height = foreh;
      this.forec = this.forei.getContext('2d');

      var s = 9;
      var data = this.data;

      // random background to start, not a lot of pixels
      var ssize = 15;
      var stampi = document.createElement('canvas');
      stampi.width = ssize;
      stampi.height = ssize;
      var stampc = stampi.getContext('2d');

      var imageData = stampc.getImageData(0, 0, ssize, ssize);
      var data = imageData.data;
      var length = data.length;

      var rswing = Math.floor(SU.r(this.seed, this.s++) * 30) + 20;
      var gswing = Math.floor(SU.r(this.seed, this.s++) * 30) + 20;
      var bswing = Math.floor(SU.r(this.seed, this.s++) * 30) + 20;
      var r, g, b;

      rswing *= 4;
      gswing *= 4;
      bswing *= 4;
      r = Math.floor(SU.r(this.seed, this.s++) * (80 - rswing)) + 100;
      g = Math.floor(SU.r(this.seed, this.s++) * (80 - gswing)) + 100;
      b = Math.floor(SU.r(this.seed, this.s++) * (80 - bswing)) + 100;

      for (i = 0; i < length; i += 4) {
        data[i] = Math.floor(r + SU.r(this.seed, s++) * rswing);
        data[i + 1] = Math.floor(g + SU.r(this.seed, s++) * gswing);
        data[i + 2] = Math.floor(b + SU.r(this.seed, s++) * bswing);
        data[i + 3] = 255;
      }
      stampc.putImageData(imageData, 0, 0);
      this.forec.drawImage(stampi, 0, 0, ssize, ssize, 0, 0, forew, foreh);

      // then condense and mirror, over and over, to create patterns
      this.bufi = document.createElement('canvas');
      this.bufi.width = forew;
      this.bufi.height = foreh;
      this.bufc = this.bufi.getContext('2d');

      var times =  Math.floor(SU.r(this.seed, s++) * 3) + 6;
      this.forec.save();
      this.forec.translate(forew / 2, foreh / 2);
      for (var i = 0; i < times; i++) {
        var scale = SU.r(this.seed, s++) / 2 + 0.8;
        var rot = SU.r(this.seed, s++) * PIx2;
        this.foreStamp(scale, rot);
      }
      this.forec.rotate(SU.r(this.seed, s++) * PIx2);
      this.forec.drawImage(this.forei, -forew / 2, -foreh / 2);
      this.forec.restore();

      // add a textured background, reuse foreground images
      for (i = 0; i < length; i += 4) {
        data[i] = Math.floor(SU.r(this.seed, s++) * 100);
        data[i + 1] = Math.floor(SU.r(this.seed, s++) * 80);
        data[i + 2] = Math.floor(SU.r(this.seed, s++) * 20);
        data[i + 3] = 255;
      }
      stampc.putImageData(imageData, 0, 0);

      TU.rect(this.forec, 0, 0, forew, foreh, 'rgba(255,255,255,0.65)');  // Lighten it for easier reading.
    },
    foreStamp: function(scale, rot) {
      this.bufc.drawImage(this.forei, 0, 0);
      this.forec.save();
      this.forec.rotate(rot);

      this.forec.drawImage(this.bufi, 0, 0, forew, foreh, 0, 0, scale * forew / 2, scale * foreh / 2);
      this.forec.save();
      this.forec.scale(1, -1);
      this.forec.drawImage(this.bufi, 0, 0, forew, foreh, 0, 0, scale * forew / 2, scale * foreh / 2);
      this.forec.restore();
      this.forec.save();
      this.forec.scale(-1, 1);
      this.forec.drawImage(this.bufi, 0, 0, forew, foreh, 0, 0, scale * forew / 2, scale * foreh / 2);
      this.forec.restore();
      this.forec.save();
      this.forec.scale(-1, -1);
      this.forec.drawImage(this.bufi, 0, 0, forew, foreh, 0, 0, scale * forew / 2, scale * foreh / 2);
      this.forec.restore();

      this.forec.restore();
    },		
		
		// Generates two lists of all the available places, based on large hero size.
		// Centered around the two input coordinates.
		// Input coordinates to track the distance (for sorting).
		// Negative input coordinates for random placement order.
		// Lists are sorted closest last (for efficient pop).
		// Note the map.js has a similar (duplicate) implementation (same name) for a single non-random list.
		GetHeroPlaces: function(x1, y1, x2, y2, hero_places1, hero_places2) {
			var max_drift = SU.r(this.seed, 12.7)*10;
			var s = 8.3;
			
			var ystart = Math.floor(SU.r(this.seed, 8.7)*3);
			// This is a little complicated to compute because the hexes don't line up perfectly. Just
			// go for a suboptimal grid for now.
			for (var y = ystart; y < this.map_sizey; y += 7) { // Large hero size
				var xstart = Math.floor(SU.r(this.seed, 8.8+s)*7);
				for (var x = xstart; x < this.map_sizex; x += 7) {
					if (this.map.isValidStamp(x, y, 7)) {
						var dist1 = x1 < 0 ? SU.r(this.seed, s) : this.map.getHexDist(x, y, x1, y1) + Math.floor(SU.r(this.seed, s+0.3)*max_drift);
						var dist2 = x2 < 0 ? SU.r(this.seed, s) : this.map.getHexDist(x, y, x2, y2) + Math.floor(SU.r(this.seed, s+0.4)*max_drift);
						hero_places1.push({x: x, y: y, dist: dist1});
						hero_places2.push({x: x, y: y, dist: dist2});
						s++;
					}
				}
			}			
			hero_places1.sort(function(left, right){return right.dist - left.dist;}); // Highest first, to prepare for pop().
			hero_places2.sort(function(left, right){return right.dist - left.dist;});
		},
		
		IsValid: function(x, y) {
			return this.map.isValid(x, y);
		},
		
		// Draw a rect. With a border if specified.
		BorderRect: function(context, x, y, xwidth, ywidth, color, border, border_width) {
			if (border) {
				SU.rect(context, x, y, xwidth, ywidth, color, border, border_width);
			} else {
				SU.rect(context, x, y, xwidth, ywidth, color);
			}
		},
		BorderCircle: function(context, x, y, rad, color, border, border_width) {
			if (border) {
				SU.circle(context, x, y, rad, color, border, border_width);
			} else {
				SU.circle(context, x, y, rad, color);
			}
		}
		
	};
	
})();
