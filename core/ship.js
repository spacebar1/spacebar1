/*
Ship and related utils. Doesn't include installed artifacts.
ship_data can be imported in lieu of the first three parameters.

Ship stats range from 5 to 100.
*/
(function() {
	let SHIP_TILE_SIZE = 64;
	
  SBar.Ship = function(ship_type, level, seed, raceseed, ship_data/*optional, provide instead of the other inputs to override*/) {
    this._initShip(ship_type, level, seed, raceseed, ship_data);
  };

  SBar.Ship.prototype = {
		type: SF.TYPE_SHIP,
		seed: null,
		raceseed: null,
		level: null,
		ship_type: null,
		starting_ship: false,
		artifacts: null,  // List of connected list of arti params.
		placed_starting_artifacts: null,
		name: null,
		// Public stats.
		speed: null,
		max_cargo: null,
		//used_cargo: 0,
		cargo: null,
		sensor_level: null,
		mining_level: null,
		mining_speed: null,  // Mining speed improvement %.
		flee_chance: null,
		// 'expiration' might be set, if a custom building uses ship data.
		
    _initShip: function(ship_type, level, seed, raceseed, ship_data) {
			if (ship_data) {
				// Copy fields directly.
				for (obj in ship_data) {
					this[obj] = ship_data[obj];
				}
				return;
			}
			if (raceseed === -1) {
				// Special case.
				this.starting_ship = true;
			}
			if (ship_type === SF.SHIP_COMMON) {
				let subtype = SU.r(seed, 7.31);
				if (subtype < 0.3) {
					ship_type = SF.SHIP_CARGO;
				} else if (subtype < 0.6) {
					ship_type = SF.SHIP_MINING;
				}
			}
			this.level = capMaxLevel(level);
			this.ship_type = ship_type;
			this.seed = seed;
			this.raceseed = raceseed;
      this.artifacts = [];
			this.cargo = [];
			//this.level = 10;
			//this.ship_type = SF.SHIP_COMMON;
			this.SetStats();
			this.artifacts = this.GetStartingArtifacts()
			this.name = this.GetName();
			this.RebuildArtiStats();
		},
		
		SetStats: function() {
			// Dimensions are speed, sensors, cargo, and equipment.
			this.speed = 0;
			this.sensor_level = 0;
			this.max_cargo = 0;
			this.mining_speed = 0;
			this.mining_level = 0;
			this.flee_chance = 0;
			
			// Only cargo and speed are set by default.
			this.speed = Math.floor((SU.r(this.seed, 9.12)+1)*this.level)+15+Math.floor(SU.r(this.seed, 9.13)*5);
			// At least 9 for small ore.
			this.max_cargo = Math.floor((SU.r(this.seed, 9.12)*4+1)*(this.level+2))+9;//+Math.floor(SU.r(this.seed, 9.13)*5);
			switch (this.ship_type) {
				case SF.SHIP_ALPHA:
					this.speed -= 10;  // Color engine.
					break;
				case SF.SHIP_COMMON:
					break;
				case SF.SHIP_MINING:
				case SF.SHIP_CARGO:
					this.speed = Math.round(this.speed/2)+5;
					this.max_cargo *= 3;
					break;
				case SF.SHIP_PIRATE:
					this.speed *= 2;
					break;
				case SF.SHIP_POD:
					this.speed = 10;
					this.max_cargo = 0;
					break;
				default:
					error("errsets",this.ship_type);
			}	
			if (SF.VERY_FAST_SHIPS) {
				this.speed = 200;
			}
			if (S$.conduct_data['fast_ships']) {
				this.speed *= 4;
				this.speed += 10;
			}
		},
		GetStartingArtifacts: function(points) {
			this.placed_starting_artifacts = false;
			
			let artis = [];
			switch (this.ship_type) {
				case SF.SHIP_ALPHA:
					artis.push(SBar.ArtifactData(this.seed+11.01, this.raceseed, this.level, SF.SKILL_SHIP_SENSORS));
					artis.push(SBar.ArtifactData(this.seed+11.02, this.raceseed, this.level, SF.SKILL_DARK_ENGINE));
					break;
				case SF.SHIP_COMMON:
					// Random types.
					artis.push(SBar.ArtifactData(this.seed+11.01, this.raceseed, this.level, SF.SKILL_SHIP_SENSORS));
					artis.push(SBar.ArtifactData(this.seed+11.02, this.raceseed, this.level, SF.SKILL_SHIP));
					artis.push(SBar.ArtifactData(this.seed+11.03, this.raceseed, this.level, SF.SKILL_SHIP));
					break;
				case SF.SHIP_MINING:
					artis.push(SBar.ArtifactData(this.seed+11.01, this.raceseed, this.level, SF.SKILL_SHIP_SENSORS));
					artis.push(SBar.ArtifactData(this.seed+11.02, this.raceseed, this.level, SF.SKILL_SHIP_MINING_LEVEL));
					break;
				case SF.SHIP_CARGO:
					artis.push(SBar.ArtifactData(this.seed+11.01, this.raceseed, this.level, SF.SKILL_SHIP_SENSORS));
					artis.push(SBar.ArtifactData(this.seed+11.02, this.raceseed, this.level, SF.SKILL_SHIP_CARGO));
					artis.push(SBar.ArtifactData(this.seed+11.03, this.raceseed, this.level, SF.SKILL_SHIP_CARGO));
					break;
				case SF.SHIP_PIRATE:
					// Weaker sensors.
					artis.push(SBar.ArtifactData(this.seed+11.01, this.raceseed, capLevel(Math.floor(this.level/2)), SF.SKILL_SHIP_SENSORS));
					artis.push(SBar.ArtifactData(this.seed+11.02, this.raceseed, this.level, SF.SKILL_SHIP_SPEED));
					artis.push(SBar.ArtifactData(this.seed+11.03, this.raceseed, this.level, SF.SKILL_SHIP_SPEED));
					artis.push(SBar.ArtifactData(this.seed+11.04, this.raceseed, this.level, SF.SKILL_SHIP_FLEE));
					break;
				case SF.SHIP_POD:
					// None.
					break;
				default:
					error("errgetsa",this.ship_type);
			}	
			return artis;
		},
		// Deferred placements, since this can take 20ms to render ships.
		// Duplicated with SBar.Crew().
		PlaceStartingArtifacts: function() {
			if (this.placed_starting_artifacts) {
				return;
			}
			this.placed_starting_artifacts = true;
			var arti_icons = [];
			var ship_shape = new SBar.IconTilesShip(this);
			for (var i = 0; i < this.artifacts.length; i++) {
				var arti_icon = new SBar.IconArtifact(null, this.artifacts[i]);
				arti_icons.push(arti_icon);
				// Try to place it. Always install in mid for better chances. Throw it out if no place.
				for (var j = 0; j < 100; j++) {
					var y = Math.floor(SU.r(this.seed, 71.1+i*2.27+j)*40)-20;
					// Small shift on x, to raise likelihood of finding a clear position.
					var x = Math.floor(SU.r(this.seed, 71.2+i*2.28+j)*6)-3;
					var rot = (j%4)*90;
				  if (arti_icon.CenterIfValid(x, y, rot, ship_shape)) {
						var clear = true;
						for (var icon_index = 0; icon_index < arti_icons.length - 1; icon_index++) {
							if (arti_icon.IsOverlap(arti_icons[icon_index])) {
								clear = false;
								break;
							}
						}
						if (clear || j == 99) {  // Just pick an invalid location if can't find a place.
							this.artifacts[i].installx = x;
							this.artifacts[i].instally = y;
							this.artifacts[i].rotation = rot;
							break;
						}						
				  }					
				}
			}			
		},
		
		// Applies the artifact stats.
		RebuildArtiStats: function() {
			this.SetStats();
			for (let artifact of this.artifacts) {
				this.ApplyArtifactStats(new SBar.Skill(artifact));
			}
			if (S$.conduct_data['no_sensors']) {
				this.sensor_level = 0;
			} else if (S$.conduct_data['all_sensors']) {
				this.sensor_level = SF.MAX_LEVEL;
			}
		},
		
		ApplyArtifactStats: function(skill) {
			if (!skill.MeetsPrereqs(S$.officer_stats)) {
				return;
			}
			for (var key in skill.ship_skills) {
				if (key == "mining_level" || key == "flee_chance") {
					// Mining level is not additive.
					this[key] = Math.max(this[key], skill.ship_skills[key]);
				} else {
					this[key] += skill.ship_skills[key];
				}
			}
		},
		
		StatsStrings: function() {
			let stats = [];
			stats.push(
				"Speed: "+this.speed,
				"Sensor Level: "+this.sensor_level,
				"Cargo Space: "+this.max_cargo+SF.SYMBOL_CARGO,
				"Mining Level: "+this.mining_level,
				"Mining Speed: +"+this.mining_speed+"%",
				"Improved Flee: +"+this.flee_chance+"%",
			);
			if (this.ship_type === SF.SHIP_PIRATE) {
	      stats.push("[Outlaw Tech]")
			}
			stats.push("");
			//stats.push("Officer Stats:");
			for (let i = 0; i < SF.NUM_STATS; i++) {
				//stats.push("  "+S$.officer_stats[i]+" "+SF.STAT_NAME[i]);
				
				//let text = SF.STAT_OFFICER_TITLE[i]+" "+S$.officer_names[i];
				//let text_right = " "+S$.officer_stats[i]+" "+SF.STAT_NAME[i];
				
				stats.push([SF.STAT_OFFICER_TITLE[i], S$.officer_stats[i]+" "+SF.STAT_NAME[i]]);
			}
			return stats;
		},
		
		// Scale is used as a simple level-based adjust for the number of available
		// cells. It still has a big range between big and small ships, but is
		// quick and simple.
		GetScale: function() {
			if (this.ship_type === SF.SHIP_ALPHA) {
				return 0.5;
			}
			//if (this.ship_type === SF.SHIP_POD) {
			//	return 0.3;
			//}
			return this.level/55+0.3+SU.r(this.seed,5.15)*0.2;
		},
		
    ship_names: [
      "Junker",
			"Tin Can",
			"Explorer",
			"Ride",
			"Freighter",
			"Corvette",
			"Cruiser",
			"Guardian",
			"Valiant",
			"Navigator",
			"Interceptor",
			"Slayer",
			"Atlas",
			"Intrepid",
			"Lifeboat",
			"Module",
			"Raker",
			"Hopper",
			"Excelsior",
			"Icarus",
			"Jet",
			"Orbiter",
			"Argonaut",
			"Pioneer",
			"Raider",
			"Dart",
			"Glider",
			"Ascender",
			"Pod",
			"Rocket",
    ],
		GetName: function() {
			if (this.starting_ship) {
				return "Possibly Stolen UFO";
				//return "Probably Stolen "+ST.getAlphaWord(2.12);
				//return "Stolen "+ST.randText(ST.artiAdv, this.seed + 43.13) + " " + ST.randText(ST.artiAdj, this.seed + 43.33);
				//return "Possibly Hot UFO";			
				//return "Weird and Possibly Hot UFO";			
				//return S$.player_name + "'s Weird and Possibly Hot UFO";			
			}
			switch (this.ship_type) {
				case SF.SHIP_ALPHA:
					return ST.randText(ST.artiAdv, this.seed + 43.13) + " " + ST.randText(ST.artiAdj, this.seed + 43.33) + " " + "Mystery";
				case SF.SHIP_COMMON:
					//return "The "+ST.randText(ST.artiAdv, this.seed + 42.13) + " " + ST.randText(ST.artiAdj, this.seed + 42.33) + " " + ST.randText(this.ship_names, this.seed + 42.43);
					return ST.randText(ST.artiAdv, this.seed + 42.13) + " " + ST.randText(ST.artiAdj, this.seed + 42.33) + " " + ST.getWord(this.raceseed, this.seed);
				case SF.SHIP_MINING:
					return "Mining " + ST.randText(ST.artiAdj, this.seed + 42.33) + " " + ST.getWord(this.raceseed, this.seed);
				case SF.SHIP_CARGO:
					return "Freighter " + ST.randText(ST.artiAdj, this.seed + 42.33) + " " + ST.getWord(this.raceseed, this.seed);
				case SF.SHIP_PIRATE:
					return ST.getWord(this.seed, this.seed+1.11);
					//return "The "+ST.randText(ST.artiAdv, this.seed + 42.13) + " " + ST.randText(ST.artiAdj, this.seed + 42.33) + " " + ST.randText(this.ship_names, this.seed + 42.43);
				case SF.SHIP_POD:
					return "Handy Escape Pod";
				default:
					error("noshipname");
			}
		},
		
		GetCachedImage: function() {
			let lookup_key = S$.tow_ship === this ? "tow_ship" : "main_ship";
			let lookup_name = S$.tow_ship === this ? "tow_ship_name" : "main_ship_name";
			if (!SG.image_cache[lookup_key] || SG.image_cache[lookup_name] !== this.name) {
				let image = this.GetImage(SF.HEIGHT, 0, SF.HEIGHT)
				SG.image_cache[lookup_key] = image;
				SG.image_cache[lookup_name] = this.name;
			}
			return SG.image_cache[lookup_key];		 
		},
		GetImage: function(size, rotate, full_size_override, interior_only) {
			this.ship_interior_only = interior_only;
			var full_size = 600;
			if (full_size_override) {
				full_size = full_size_override;
			}
      var full_image = document.createElement('canvas');
      full_image.width = full_size;
      full_image.height = full_size;
      full_ctx = full_image.getContext('2d');
			
			var scaled_half = Math.round(full_size * this.GetScale()/2);
			var scaled_size = scaled_half * 2;  // Keep it multiples of 2 for symmetry.
			// Shift context to account for ship scaling size.
			full_ctx.save();
			full_ctx.translate(full_size/2-scaled_half, full_size/2-scaled_half);

			switch (this.ship_type) {
				case SF.SHIP_ALPHA:
					this.DrawAlphaImage(full_ctx, scaled_size);
					break;
				case SF.SHIP_COMMON:
				case SF.SHIP_MINING:
				case SF.SHIP_CARGO:
					this.DrawCommonImage(full_ctx, scaled_size);
					break;
				case SF.SHIP_PIRATE:
					this.DrawButterflyImage(full_ctx, scaled_size);
					break;
				case SF.SHIP_POD:
					this.DrawPodImage(full_ctx, scaled_size);
					break;
				default:
					error("noshipimg",this.ship_type);
			}
			full_ctx.restore();
			
			if (size === full_size && !rotate) {
				return full_image;
			}
						
      var image = document.createElement('canvas');
      image.width = size;
      image.height = size;
      ctx = image.getContext('2d');
			ctx.translate(size/2, size/2);
			if (rotate) {
				ctx.rotate(SU.r(this.seed, 1.73) * PIx2);
			}			
			ctx.drawImage(full_image, 0, 0, full_size, full_size, -size/2, -size/2, size, size);
						
			delete this.ship_interior_only;
			return image;
		},
		/*
		// Returns an adjusted x position for a pirate ship.
		PirateAdjust: function(x) {
			if (this.ship_type === SF.SHIP_PIRATE) {
				return x/2;
			}
			return x;
		},
		*/
		DrawCommonImage: function(ctx, size) {
			ctx.save();
      ctx.translate(size / 2, 0);

      var r = Math.floor(SU.r(this.seed, 73.4) * 160);
      var g = Math.floor(SU.r(this.seed, 73.5) * 160);
      var b = Math.floor(SU.r(this.seed, 73.6) * 160);
			let border = "rgb("+r+","+g+","+b+")";
			let line_width = size/100;
			
			// Wings. Common wings are straight.
			var wingx = (SU.r(this.seed, 1.22)*0.25+0.25)*size;
			var wingy0 = SU.r(this.seed, 1.23)*size/2;
			var wingy1 = SU.r(this.seed, 1.24)*size;
			var wingy2 = SU.r(this.seed, 1.25)*size/2+size/2;
			
			// start up /down (todo)
      ctx.beginPath();
      ctx.moveTo(0, wingy0);
      ctx.lineTo(-wingx, wingy1);
      ctx.lineTo(0, wingy2);
      ctx.lineTo(wingx, wingy1);
      ctx.closePath();
			var colorStops = [0, 'rgb('
			  +Math.floor(SU.r(this.seed,141)*128)+','+Math.floor(SU.r(this.seed,142)*128)+','+Math.floor(SU.r(this.seed,143)*128)+')',
			   1, 'rgb('+Math.floor(SU.r(this.seed,144)*128)+','+Math.floor(SU.r(this.seed,145)*128)+','+Math.floor(SU.r(this.seed,146)*128)+')'];
//	       grd = ctx.createRadialGradient(0, size/2, 0, 0, size/2, size/2);
      var grd = ctx.createLinearGradient(0, 0, 0, size);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      ctx.fillStyle = grd;
			ctx.fill();
			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}
			
			// Core bulkhead outline.
			var points = [];  // x,y structural pairs.
			var y = 0;
			while (y < 1) {
				points.push([SU.r(this.seed, y)/4*size, y*size]);
				y += SU.r(this.seed, y+2.22)/4+0.1;
			}
			points.push([SU.r(this.seed, y)/4*size, size]);

      ctx.beginPath();
      ctx.moveTo(0, 0);
			for (var i = 0; i < points.length; i++) {
				ctx.lineTo(-points[i][0], points[i][1]);
			}
			for (var i = points.length-1; i >= 0; i--) {
				ctx.lineTo(points[i][0], points[i][1]);
			}
      ctx.closePath();
			colorStops = [0, 'rgb('
			  +Math.floor(SU.r(this.seed,101)*128)+','+Math.floor(SU.r(this.seed,102)*128)+','+Math.floor(SU.r(this.seed,103)*128)+')',
			   1, 'rgb('+Math.floor(SU.r(this.seed,104)*128)+','+Math.floor(SU.r(this.seed,105)*128)+','+Math.floor(SU.r(this.seed,106)*128)+')'];
      grd = ctx.createRadialGradient(0, size/2, 0, 0, size/2, size/2);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      ctx.fillStyle = grd;
			ctx.fill();
			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}
			ctx.restore();
			
			// Equipment. Stamp an image multiple times.
			var eqsize = 200;
      var eqimage = document.createElement('canvas');
      eqimage.width = eqsize;
      eqimage.height = eqsize;
      eqctx = eqimage.getContext('2d');
			eqctx.translate(eqsize/2, eqsize/2);
      eqctx.beginPath();
      eqctx.moveTo(0, 0);
			for (var i = 0; i < Math.floor(SU.r(this.seed, 110)*6)+2; i++) {
				if (SU.r(this.seed, 111+i) < 0.5) {
          eqctx.quadraticCurveTo(SU.r(this.seed, 111.1+i)*eqsize-eqsize/2, SU.r(this.seed, 111.2+i)*eqsize-eqsize/2,
					   SU.r(this.seed, 111.3+i)*eqsize-eqsize/2, SU.r(this.seed, 111.4+i)*eqsize-eqsize/2);
				} else {
					eqctx.lineTo(SU.r(this.seed, 111.5+i)*eqsize-eqsize/2, SU.r(this.seed, 111.6+i)*eqsize-eqsize/2);
				}
			}
      eqctx.closePath();
			colorStops = [0, 'rgb('
			  +Math.floor(SU.r(this.seed,121)*128)+','+Math.floor(SU.r(this.seed,122)*128)+','+Math.floor(SU.r(this.seed,123)*128)+')',
			   1, 'rgb('+Math.floor(SU.r(this.seed,124)*128)+','+Math.floor(SU.r(this.seed,125)*128)+','+Math.floor(SU.r(this.seed,126)*128)+')'];
      grd = eqctx.createRadialGradient(0, size/2, 0, 0, size/2, size/2);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      eqctx.fillStyle = grd;
			eqctx.fill();
			if (!this.ship_interior_only) {
				eqctx.lineWidth = line_width;
	      eqctx.strokeStyle = border;
	      eqctx.stroke();
			}
			eqctx.restore();
			// Stamp equipment.
			ctx.save();
      ctx.translate(size / 2, 0);
			
			// Cockpit.
//      SU.line(ctx, 0, 0, 0, size, 1, "#000");
			var x1 = SU.r(this.seed, 201)*size/10;
			var x2 = SU.r(this.seed, 202)*size/8+size/30;
			var y = SU.r(this.seed, 203)*size/5+size/30;
      ctx.beginPath();
      ctx.moveTo(-x1, 0);
      ctx.lineTo(-x2, y);
      ctx.lineTo(x2, y);
      ctx.lineTo(x1, 0);
      ctx.closePath();
			// Similar color to above.
			ctx.fillStyle = 'rgb('+Math.floor(SU.r(this.seed,101)*128/2)+','+Math.floor(SU.r(this.seed,102)*128/2)+','+Math.floor(SU.r(this.seed,103)*128/2)+')';
//      ctx.fillStyle = 'rgba('
//			  +Math.floor(SU.r(this.seed,121)*68)+','+Math.floor(SU.r(this.seed,122)*68)+','+Math.floor(SU.r(this.seed,123)*128)+',1)',
      ctx.fill();
			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
				ctx.stroke();
			}
			ctx.restore();
		},
		DrawAlphaTile: function(scale, seed, color_seed, ctx, x, y, is_background) {
      var r = Math.floor(SU.r(color_seed, 71.4) * 256);
      var g = Math.floor(SU.r(color_seed, 71.5) * 256);
      var b = Math.floor(SU.r(color_seed, 71.6) * 256);
			let sides = Math.floor(SU.r(this.seed, seed)*4)+3;
			let size = SHIP_TILE_SIZE*scale*2.5;
			let radius = SHIP_TILE_SIZE*scale*(SU.r(seed, 71.13)*0.4+0.8);
			//let radius = size/2;
			let rotation = SU.r(seed, 71.12)*PIx2;
			let do_circle = SU.r(seed, 8.14) < 0.2;
			if (is_background) {
				let border = scale*5;
				let color = 'rgb('+r+','+g+','+b+')';
				//SU.rect(ctx, x*SHIP_TILE_SIZE*scale-border, y*SHIP_TILE_SIZE*scale-border, SHIP_TILE_SIZE*scale+border*2, SHIP_TILE_SIZE*scale+border*2, 'rgb('+r+','+g+','+b+')');
				// Similar to below.
				ctx.save();
				ctx.translate(x*SHIP_TILE_SIZE*scale, y*SHIP_TILE_SIZE*scale);
				ctx.rotate(rotation);
				if (do_circle) {
					SU.circle(ctx, 0, 0, radius+border, color)
				} else {
					SU.regularPolygon(ctx, 0, 0, sides, radius+border, color);
				}
				ctx.restore();
			} else {
				let fill_pattern = SU.GetFillPattern(Math.round(SU.r(this.seed, color_seed)*20)+10, seed, r, g, b, 255);
				// Need a temp image to get the pattern on the polygon.
	      let tile = document.createElement('canvas');
	      tile.width = size;
	      tile.height = size;
	      tile_ctx = tile.getContext('2d');
				// Similar to above.
				tile_ctx.save()
				tile_ctx.translate(size/2, size/2);
				if (do_circle) {
					SU.circle(tile_ctx, 0, 0, radius, "#FFF")
				} else {
					SU.regularPolygon(tile_ctx, 0, 0, sides, radius, "#FFF");
				}
				tile_ctx.restore();
				tile_ctx.save()
				tile_ctx.globalCompositeOperation = "source-in";
				tile_ctx.drawImage(fill_pattern, 0, 0, size, size);
				tile_ctx.restore();
				
				ctx.save();
				ctx.translate(x*SHIP_TILE_SIZE*scale, y*SHIP_TILE_SIZE*scale);
				ctx.rotate(rotation);
				//SU.regularPolygon(ctx, 0, 0, sides, size/2+border, color);
				ctx.drawImage(tile, -size/2, -size/2);
				ctx.restore();
			}
		},
		DrawAlphaImage: function(ctx, size) {
			ctx.save();
			let scale = size/400;
      ctx.translate(size / 2, size / 2);
			
			// Modified version of the 7complexR.GenerateShape().
			let points = [];
			let pointsset = {};
			pointsset["0,0"] = true;
			let r = SU.r(this.seed, 1.23);
			let num_points = Math.round((this.level+4)*1.3);
      points.push([0, 0]);
			num_points--;
			var tries = 300;
			// Algorithm: pick a random existing point, and grow it in any direction.
			while(num_points > 0 && tries > 0) {
				let rootindex = Math.floor(SU.r(this.seed, r++)*points.length);
				let rootpoint = points[rootindex];
				let dir = SU.r(this.seed, r++);
				let testpoint = null;
				if (dir < 0.25) {
					testpoint = [rootpoint[0]-1, rootpoint[1]];
				} else if (dir < 0.5) {
					testpoint = [rootpoint[0]+1, rootpoint[1]];
				} else if (dir < 0.75) {
					testpoint = [rootpoint[0], rootpoint[1]-1];
				} else {
					testpoint = [rootpoint[0], rootpoint[1]+1];
				}
				if (!pointsset[testpoint[0]+','+testpoint[1]]) {
					points.push(testpoint);
					pointsset[testpoint[0]+','+testpoint[1]] = true;
					num_points--;
				}
				tries--;
			}
			if (tries === 0) {
				error("Failed GenerateShape2 tries.");
			}
			
			let minx = 999;
			let miny = 999;
			let maxx = -999;
			let maxy = -999;
			for (let point of points) {
				if (point[0] < minx) {
					minx = point[0];
				}
				if (point[0] > maxx) {
					maxx = point[0];
				}
				if (point[1] < miny) {
					miny = point[1];
				}
				if (point[1] > maxy) {
					maxy = point[1];
				}
			}
			let dx = ((minx+maxx)/2)+0.5;
			let dy = ((miny+maxy)/2)+0.5;
			// Normalize.
			for (let point of points) {
				point[0] -= dx;
				point[1] -= dy;
			}
			
			let arti_data = SBar.ArtifactData(this.seed, this.seed+1, 20, SF.SKILL_ALPHA);
			let icon = new SBar.IconArtifact(ctx, arti_data);
			let seed = this.seed;
			let color_seed = this.seed
			let tile_seed_start = seed;
			if (!this.ship_interior_only) {
				for (let point of points) {
					seed++;
					// No seed change for the background.
					if (Math.abs(point[0] < 4 && Math.abs(point[1] < 4))) {
						this.DrawAlphaTile(scale, seed, color_seed, ctx, point[0], point[1], /*is_background=*/true);
					}
				}
			}
			seed = tile_seed_start;
			for (let point of points) {
				seed++;
				color_seed++;
				if (Math.abs(point[0] < 4 && Math.abs(point[1] < 4))) {
					this.DrawAlphaTile(scale, seed, color_seed, ctx, point[0], point[1]);
				}
			}
			ctx.restore();
	  },		
		DrawButterflyImage: function(ctx, size) {
      var r = Math.floor(SU.r(this.seed, 74.4) * 250);
      var g = Math.floor(SU.r(this.seed, 74.5) * 250);
      var b = Math.floor(SU.r(this.seed, 74.6) * 250);
			let border = "rgb("+r+","+g+","+b+")";
			let line_width = size/100;

			ctx.save();
      ctx.translate(size / 2, size / 2);
      var xpoints = [];
      var ypoints = [];
      for (var i = 0; i < 8; i++) {
          xpoints[i] = [SU.r(this.seed, i + 0.21) * size / 2];
          ypoints[i] = [(i / 8 - 0.5) * size];
      }
      this.PathDerelict(xpoints, ypoints, ctx, size);

			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}

      r = Math.floor(SU.r(this.seed, 71.1) * 155) + 100;
      g = Math.floor(SU.r(this.seed, 71.2) * 155) + 100;
      b = Math.floor(SU.r(this.seed, 71.3) * 155) + 100;
      var color = 'rgb(' + r + ',' + g + ',' + b + ')'
      ctx.fillStyle = color;

      ctx.fill();
      this.PathDerelict(xpoints, ypoints, ctx, size);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -size / 2);
      ctx.lineTo(-size / 8, 0);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(size / 8, 0);
      ctx.lineTo(0, -size / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();

			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}

      var r = Math.floor(SU.r(this.seed, 71.4) * 155) + 100;
      var g = Math.floor(SU.r(this.seed, 71.5) * 155) + 100;
      var b = Math.floor(SU.r(this.seed, 71.6) * 155) + 100;
      var color2 = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillStyle = color2;
      ctx.fill();
			var color3 = 'rgb(' + Math.floor(r/2) + ',' + Math.floor(g/2) + ',' + Math.floor(b/2) + ')';

      SU.line(ctx, 0, -size / 2, 0, size / 2, 1, "#000");
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(-size / 10, -size * 1 / 6);
      ctx.lineTo(size / 10, -size * 1 / 6);
      ctx.closePath();
      ctx.fillStyle = color3;
      ctx.fill();
			if (!this.ship_interior_only) {
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}
			
			ctx.restore();
//      ctx.stroke();
      //ctx.quadraticCurveTo(0, y + visorlength, visorwidth, y + visorlength / 3);
      //return color2;
	  },
	  PathDerelict: function(xpoints, ypoints, ctx, size) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (var i = 0; i < 8; i++) {
  				if (SU.r(this.seed, i+812.2) < 0.5) {
              ctx.quadraticCurveTo(size / 2, ypoints[i], xpoints[i], ypoints[i]);
          } else {
              ctx.lineTo(xpoints[i], ypoints[i]);
          }
      }
      ctx.lineTo(0, 0);
      for (var i = 0; i < 8; i++) {
  				if (SU.r(this.seed, i+812.2) < 0.5) {  // Repeat 812.2.
              ctx.quadraticCurveTo(-size / 2, ypoints[i], -xpoints[i], ypoints[i]);
          } else {
              ctx.lineTo(-xpoints[i], ypoints[i]);
          }
      }
      ctx.lineTo(0, 0);
      ctx.closePath();
	  },
		DrawPodImage: function(ctx, size) {
      var r = Math.floor(SU.r(this.seed, 75.4) * 250);
      var g = Math.floor(SU.r(this.seed, 75.5) * 250);
      var b = Math.floor(SU.r(this.seed, 75.6) * 250);
			let border = "rgb("+r+","+g+","+b+")";
			let line_width = size/100;

			ctx.save();
      ctx.translate(size / 2, 0);

			var points = [];  // x,y structural pairs.
			points.push([0,0]);
			var y = 0;
			y += SU.r(this.seed, y+2.22)/4+0.1;
			while (y < 1) {
				points.push([Math.round(SU.r(this.seed, y)/6*size+0.1*size), Math.round(y*size)]);
				y += SU.r(this.seed, y+2.22)/4+0.1;  // Repeat 2.22.
			}
			points.push([0, size]);
			
			// Outline.
			if (!this.ship_interior_only) {
	      ctx.beginPath();
	      ctx.moveTo(-points[0][0], points[0][1]);
				for (var i = 1; i < points.length-1; i++) {
		      ctx.lineTo(-points[i][0], points[i][1]);
				}
				for (i = points.length-1; i >= 0; i--) {
		      ctx.lineTo(points[i][0], points[i][1]);
				}				
	      ctx.closePath();
	      ctx.lineWidth = line_width;
	      ctx.strokeStyle = border;
	      ctx.stroke();
			}
			
			// Fill.
			for (var i = 0; i < points.length-1; i++) {
	      ctx.beginPath();
	      ctx.moveTo(-points[i][0], points[i][1]);
	      ctx.lineTo(-points[i+1][0], points[i+1][1]);
	      ctx.lineTo(points[i+1][0], points[i+1][1]);
	      ctx.lineTo(points[i][0], points[i][1]);
	      ctx.closePath();
	      r = Math.floor(SU.r(this.seed, 71.1+i) * 50+50);
	      g = Math.floor(SU.r(this.seed, 71.2+i) * 50+50);
	      b = Math.floor(SU.r(this.seed, 71.3+i) * 50+50);
	      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')'
	      ctx.fill();
			}
			ctx.restore();
		},

		// Get the ship value.
		GetValue: function() {
			return round2good(SF.LEVEL_XP[this.level]*(SU.r(this.seed, 89.1)+1)/2);
			/*
			var cost = this.level * 1000;
			for (var i = 0; i < this.artifacts.length; i++) {
				var artifact = this.artifacts[i];
				cost += artifact.params[0].level;
			}
			cost *= 1+SU.r(this.seed, 8.1)/10;
			return Math.floor(cost);
			*/
		},
		
		// Destroy the ship, no remains.
		// Note the ship passed in might be a clone. Compare by name.
		ScuttleShip: function() {
			if (this.ship_type === SF.SHIP_POD && !S$.tow_ship) {
				// Can't scuttle a pod if the player only has a pod.
	      SU.message("No other ships.");
				return;
			}
			let callback = function(confirmed) {
				if (!confirmed) {
					return;
				}
				if (confirmed) {
					if (S$.tow_ship && S$.tow_ship.name === this.name) {
						S$.tow_ship = null;
					} else if (S$.ship.name === this.name) {
						if (S$.tow_ship) {
							S$.ship = S$.tow_ship;
							S$.tow_ship = null;
						} else {
							// No alternate ships.
							S$.ship = new SBar.Ship(SF.SHIP_POD, /*level=*/1, this.seed+1, 0);
						}
					} else {
						error("noscuttlematch");
					}
					if (SG.activeTier.CheckForRefresh) {
						// Refresh the char screen if needed.
						SG.activeTier.CheckForRefresh();
					}
		      SU.message("Ship scuttled.");
				}
			}
			SU.ConfirmWindow("Setting Her Loose", "Really scuttle the "+this.name+", with no chance for recovery? Leaving it somewhere safe might be better.", callback.bind(this), '?');
		},
		
		IsOwned: function() {
			return S$.ship.name === this.name || (S$.tow_ship && S$.tow_ship.name === this.name);
		}
  };
})();
