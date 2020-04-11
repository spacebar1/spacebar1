(function() {
	const Y_COMPRESS = 0.72;
	const SURFACE_OFFSET = 74;//(SF.HEIGHT-SF.HEIGHT*Y_COMPRESS)/4;
	const low_names = ["Trench", "Gulf", "Abyss", "Void", "Ridge", "Moat", "Gully", "Gorge", "Cut", "Pass", "Canyon", "Ravine", "Chasm", "Depth", "Fissure", "Gap", "Breach", ];
	const mid_names = ["Flat", "Expanse", "Field", "Plateau", "Shore", "Bank", "Strand", "Edge", "Ledge", "Bluff", "Crag", "Hill", "Escarpment", "Dune", "Slope", "Rise", "Bound"];
	const high_names = ["Mount", "Mountain", "Cliff", "Peak", "Dome", "Crest", "Summit", "Range", "Sierra"];
  const terrainwidth = 512;
  const terrainheight = 512;
	const animation_size = 150;

  var targetImg = null;
	
  SBar.PlanetRenderer = function(tier, spin_planet) {
      this._initPlanetRenderer(tier, spin_planet);
  };

  SBar.PlanetRenderer.prototype = {
    planetTerrain: null,
    cloudTerrain: null,
    clickmap: null,
    clickrect: null,
    group: null, //kgroup
    staty: null,
    tier: null,
    data: null,
    context: null,
		iconcontext: null,
		starimg: null,
		starctx: null,
    statsimg: null,
    statsctx: null,
		moon_img: null,
		//parent_img: null,
		//parent_scale: null,
		terrainimg: null,
    cloudimg: null,
		ycompress: Y_COMPRESS,		
		surface_offset: SURFACE_OFFSET,		
		scalex: null,
		scaley: null,
		landmark_image: null, // Separate image to show the landmarks.
		spin_planet: null, // Show the planet spinning animation.
		ship_icon: null,
		_initPlanetRenderer: function(tierIn, spin_planet) {
      this.tier = tierIn;
      this.data = this.tier.data;
      this.context = this.tier.context;
			this.iconcontext = this.tier.iconcontext;
      this.starimg = document.createElement('canvas');
      this.starimg.width = SF.WIDTH;
      this.starimg.height = SF.HEIGHT;
      this.starctx = this.starimg.getContext('2d');
      this.statsimg = document.createElement('canvas');
      this.statsimg.width = SF.WIDTH;
      this.statsimg.height = SF.HEIGHT;
      this.statsctx = this.statsimg.getContext('2d');
			this.spin_planet = spin_planet;
    },
    render: function() {
			this.ship_icon = new SBar.IconMapShip(this);
			this.scalex = SF.WIDTH/terrainwidth;
			this.scaley = SF.HEIGHT/terrainheight*Y_COMPRESS;
      this.terrainimg = this.data.getPlanetTerrain().renderTerrain().img;
			if (!this.data.ggiant) {
	      this.cloudimg = this.data.getCloudTerrain().renderTerrain().img;
			}
      this.landmark_image = document.createElement('canvas');
      this.landmark_image.width = SF.WIDTH;
      this.landmark_image.height = SF.HEIGHT;
			let ctx = this.landmark_image.getContext('2d');
			this.DrawNamedLandmarks(ctx);			
			
			this.moon_img = [];

      this.starctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.statsctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);

      S$.addButtons();
//            SB.buttX(this.tier.depart.bind(this.tier));
      var landCenter = function() {
          this.tier.loadSurfaceRaw(SF.HALF_WIDTH, SF.HALF_HEIGHT);
      };
      //SB.add(SF.HALF_WIDTH - 30, SF.HEIGHT - 80, SU.getTargetIcon(), landCenter.bind(this), 60, 60);

      var name1 = this.data.name;
      var name2 = this.data.systemData.name;
      SU.writeCoordText(name1, name2);

			//let starxy = SU.DrawStar(this.starctx, this.data.systemData, this.data.distanceOut, this.data.x);
			//SU.		DrawAlphaHalo: function(context, seed, x, y, target_radius) {
			//if (this.data.is_refractor && this.data.systemData.alpha_core) {
				//	SU.DrawAlphaHalo(this.starctx, this.data.seed, SF.HALF_WIDTH, SF.HALF_HEIGHT, this.data.radius*15)
		    //triangle: function(context, x, y, x2, y2, x3, y3, fill, stroke, strokeWidth) {
				//	SU.DrawAlphaTriangle(this.starctx, this.data.seed, starxy[0], starxy[1], SF.HALF_WIDTH-this.data.radius*3, SF.HALF_HEIGHT, SF.HALF_WIDTH+this.data.radius*3, SF.HALF_HEIGHT);
				//}
			
      this.planetTerrain = this.data.getPlanetTerrain();
      if (this.data.hasclouds) {
          this.cloudTerrain = this.data.getCloudTerrain();
      }
      for (let moon of this.data.moons) {
        var img = document.createElement('canvas');
        img.width = 200;
        img.height = 200;
        ctx = img.getContext('2d');
				moon.getPlanetTerrain().renderSmall(ctx, 100, 100, SU.r(this.data.seed,105.1)*4+2);
				if (moon.hasclouds) {
					moon.getCloudTerrain().renderSmall(ctx, 100, 100, SU.r(this.data.seed,105.1)*4+2);
				}
				this.moon_img.push(img);
			}
			/*
			if (this.data.is_moon) {
        this.parent_img = document.createElement('canvas');
        this.parent_img.width = SF.WIDTH;
        this.parent_img.height = SF.HEIGHT;
        ctx = this.parent_img.getContext('2d');
				this.parent_scale = 1/this.data.moon_dist;
				this.data.parent_planet_data.getPlanetTerrain().renderLarge(0, ctx, SF.HALF_WIDTH, SF.HALF_HEIGHT, this.parent_scale);
				this.data.parent_planet_data.getCloudTerrain().renderLarge(0, ctx, SF.HALF_WIDTH, SF.HALF_HEIGHT, this.parent_scale);
			}
			*/
			// Double-render to draw the box.
			// Reuse an unused image for the first pass
			//this.statsctx = SC.layer2;
			this.num_stats = 0;
      //this.renderStats();
      //this.statsctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SU.rect(this.statsctx, 0, SURFACE_OFFSET+1, 230, SF.HEIGHT*Y_COMPRESS-2, 'rgba(60,128,200,0.25)');
			this.staty = 107;
      //this.statsctx = this.statsimg.getContext('2d');			
      this.renderStats();
			
      this.renderUpdate();

			this.renderMenu();
    },
    renderMenu: function() {
      for (var i = 0; i < this.tier.surface_icons.length; i++) {
        var building = this.tier.surface_icons[i];
				var name = building.data.name;
				SU.addText((i+1)%10+": "+name[0]+" "+name[1]);
		  }
			//SU.addText("V: Visit");
			for (var i = 0; i < this.data.moons.length; i++) {
				SU.addText(SF.SYMBOL_SHIFT+(i+1)+": "+this.data.moons[i].name);
			}
			SU.addText("L: Look Around");
			if (this.data.is_moon && this.data.parent_planet_data.moons.length > 1) {
				SU.addText("X: Planet");
			} else {
				SU.addText("X: System");
			}	
		},		
    renderUpdate: function() {
      this.iconcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			this.renderUpdateSurface();
			this.renderUpdateMoons();
		  // Parent planet in background.
      //this.context.clearRect(0, SF.HEIGHT-animation_size, animation_size, animation_size);
      //this.context.drawImage(this.starimg, 0, 0);
			/*
			if (this.data.is_moon) {
				var x = SF.HALF_WIDTH+this.data.index*50+50;
				var y = SF.HALF_HEIGHT+this.data.index*50+50;
				this.data.parent_planet_data.DrawRingsBack(this.context, x, y, this.parent_scale);
				this.context.drawImage(this.parent_img, x-SF.HALF_WIDTH, y-SF.HALF_HEIGHT);
				this.data.parent_planet_data.DrawRingsFore(this.context, x, y, this.parent_scale);
			}
			*/
			if (this.spin_planet) {
				const planet_scale = 1;
				const planet_x = 230//SF.HALF_WIDTH;
				//const planet_y = SURFACE_OFFSET+SF.HEIGHT*Y_COMPRESS*0.17;//SF.HALF_HEIGHT;
				const planet_y = SURFACE_OFFSET+SF.HEIGHT*Y_COMPRESS*0.5;//SF.HALF_HEIGHT;
	      //this.context.globalAlpha = (150-this.tier.render_calls)/150;
				this.context.globalAlpha = 1-(this.tier.render_calls/100)*(this.tier.render_calls/100)
				this.data.DrawRingsBack(this.context, planet_x, planet_y, /*scale=*/planet_scale);
				this.planetTerrain.renderLarge(this.tier.timeOffset, this.context, planet_x, planet_y, planet_scale);
	      //this.planetTerrain.renderLarge(this.tier.timeOffset, this.context, animation_size/2, SF.HEIGHT-animation_size/2, 0.25);
	      if (this.data.hasclouds) {
		      this.cloudTerrain.renderLarge(this.tier.timeOffset, this.context, planet_x, planet_y, planet_scale);
		      //this.cloudTerrain.renderLarge(this.tier.timeOffset, this.context, animation_size/2, SF.HEIGHT-animation_size/2, 0.25);
	      }
				this.data.DrawRingsFore(this.context, planet_x, planet_y, /*scale=*/planet_scale);
	      this.context.globalAlpha = 1.0;
			}

      // Moons last to have on top.
      for (var i = 0; i < this.moon_img.length; i++) {
				var x = SF.HALF_WIDTH-(this.moon_img.length/2-i)*150-25;
        //SU.text(this.context, this.data.moons[i].name, x+100, SF.HEIGHT-225, SF.FONT_MB, '#FFF', 'center');
				this.context.drawImage(this.moon_img[i], x, SF.HEIGHT-175)
				// This is called every time the planet rotates. Could cache it.
				let symbol_seed = this.data.moons[i].seed;
				let building_types = S$.GetBuildingTypes(this.data.systemData.seed, symbol_seed);
				if (building_types.length === 0) {
					let symbol = S$.IsKnownPlanet(this.data.systemData.seed, symbol_seed) ? "-" : "?";
					SU.text(this.context, symbol, x+100, SF.HEIGHT-30, "bold 11pt monospace", 'rgba(160,160,160,1)', 'center');							
				} else {
					SU.DrawBuildingSymbols(building_types, this.context, x+100, SF.HEIGHT-45, SF.BUILDING_TEXT_ICON_SIZE, /*center=*/true);
				}							
      }
      this.context.drawImage(this.statsimg, 0, 0);
    },
		renderUpdateSurface: function(icons_only) {
  		this.context.save();
  		this.context.translate(0, SURFACE_OFFSET);
  		this.iconcontext.save();
  		this.iconcontext.translate(0, SURFACE_OFFSET);

			if (!icons_only) {
//				SU.rect(this.context, 0, -SURFACE_OFFSET, SF.WIDTH, SF.HEIGHT, "#000");
				//SU.Hide3dLayers();
				SU.Hide3dLayers(/*show_stars=*/true);				
				
	      this.context.drawImage(this.terrainimg, 0, 0, terrainwidth, terrainwidth, 0, 0, SF.WIDTH, SF.HEIGHT*Y_COMPRESS);
	      this.context.globalAlpha = 0.3;
				if (!this.data.ggiant) {
					this.context.drawImage(this.cloudimg, 0, 0, terrainwidth, terrainwidth, 0, 0, SF.WIDTH, SF.HEIGHT*Y_COMPRESS);
				}
	      this.context.globalAlpha = 1.0;
	      this.context.drawImage(this.landmark_image, 0, 0);
			}
      var len = this.tier.surface_icons.length;
      for (var i = 0; i < len; i++) {
        if (SG.activeTier === this.tier) {
          var obj = this.tier.surface_icons[i];
          if (!obj.update(this.tier.mousesurfacex, this.tier.mousesurfacey, this.scalex, this.scaley)) {
            this.tier.surface_icons.splice(i, 1);
            len = this.tier.surface_icons.length;
          }
        }
      }
      if (SG.activeTier === this.tier) {
        this.updateCoords();
      }
			this.context.restore();  // Remove the translate().
			this.iconcontext.restore();
			if (this.tier.shipx !== null) {
				const coords = this.TranslateCoords([this.tier.shipx, this.tier.shipy])
				this.ship_icon.updatedirect(this.iconcontext, coords[0], coords[1]+SURFACE_OFFSET);
			}			
		},
		renderUpdateMoons: function() {
			const x = SG.mx;
			const y = SG.my;
			if (y > SF.HALF_HEIGHT-175) {
				// Moon spacing is 150.
				var moons_width = this.data.moons.length * 150;
				var x_offset = x+moons_width/2;
				var moon_num = Math.floor(x_offset/150);
				let draw_x = SF.HALF_WIDTH+moon_num*150-moons_width/2+75;
				if (moon_num >= 0 && moon_num < this.data.moons.length) {
					// Not really sure why this layer isn't using planet icons, maybe a historical oversight?
					SU.text(this.iconcontext, this.data.moons[moon_num].name, draw_x, SF.HEIGHT-100, SF.FONT_SB, "#FFF", 'center');
					return;
				}
			}			
		},
    updateCoords: function(optional_context, skip_clear) {
			let msx = this.tier.mousesurfacex;
			let msy = this.tier.mousesurfacey;
      var halfwidth = this.terrainimg.width / 2;
      var text = "";
      if (this.tier.mousesurfacex < halfwidth) {
        text += Math.floor(180 * (halfwidth - this.tier.mousesurfacex) / halfwidth);
        text += "W, ";
      } else {
        text += Math.floor(180 * (this.tier.mousesurfacex - halfwidth) / halfwidth);
        text += "E, ";
      }
      var halfheight = this.terrainimg.height / 2;
      if (this.tier.mousesurfacey < halfheight) {
        text += Math.floor(90 * (halfheight - this.tier.mousesurfacey) / halfheight);
        text += "N";
      } else {
        text += Math.floor(90 * (this.tier.mousesurfacey - halfheight) / halfheight);
        text += "S";
      }
      var name1 = this.data.name;
      var name2 = text;
			if (!msx || msx < 0 || msx > 512 || msy < 0 || msy > 512) {
				name2 = this.data.systemData.name;//"";
			}			
      SU.writeCoordText(name1, name2, optional_context, skip_clear);
    },		
		MouseMove: function(x, y) {
      this.iconcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			this.renderUpdateSurface(/*icons_only=*/true);
			this.renderUpdateMoons();
		},
    renderStats: function() {
			// Approximate system distances.
			let xoff = Math.abs(this.data.x-this.data.systemData.x);
			let yoff = Math.abs(this.data.y-this.data.systemData.y);
			xoff = round10th(Math.pow(xoff, 2.5));
			yoff = round10th(Math.pow(yoff, 2.5));
			if (this.data.x < this.data.systemData.x) xoff *= -1;
			if (this.data.y < this.data.systemData.y) yoff *= -1;
			let au = xoff + ", " + yoff + " au"
      let xy = coordToParsec(this.data.systemData.x) + ", " + coordToParsec(-this.data.systemData.y) + " pc";
			if (S$.ship.sensor_level < SF.SENSOR_COORDINATES) {
				au = "?";
				xy = "?";
			}
      this.addStat("Planet Coords: " + au);
      this.addStat("System Coords: " + xy);
			
			if (S$.ship.sensor_level < SF.SENSOR_PLANET_PROPERTIES) {
				this.addStat("Obliquity: ?");
				this.addStat("Radius: ?");
				this.addStat("Mass: ?");
				this.addStat("Surface Gravity: ?");
			} else {
        var t = Math.floor(this.data.tilt * 10) / 10;
        this.addStat("Obliquity: " + t + "°");
        var rad = Math.floor(this.data.radius / 4 * 1700);
				if (this.data.ggiant) {
					rad *= 5;
				} else if (this.data.is_moon) {
					rad /= 2;
				}
        this.addStat("Radius: " + rad.toLocaleString() + " km");
				// Custom superscript here.
        var m = round100th(this.data.mass * 100);
        this.addStat("Mass: " + m + " x 10²¹kg");
				/*
				var text = "Mass: "+m+"⋅10";
	      var base_width = this.statsctx.measureText(text).width;
        SU.text(this.statsctx, text, 40, this.staty, SF.FONT_L, '#AAA');
	      var superscript_width = this.statsctx.measureText("21").width+base_width;
	      this.statsctx.font = SF.FONT_S;
	      this.statsctx.fillText("21", base_width+42, this.staty-6);
	      this.statsctx.font = SF.FONT_L;
	      this.statsctx.fillText(" kg", superscript_width+37, this.staty);
        this.staty += 30;
				*/
				// End custom.
        var g = round100th(this.data.gravity);
        this.addStat("Surface Gravity: " + g + "g");							
			}

      var tmax = Math.round(this.data.tempmax)+"K";
      var tmin = Math.round(this.data.tempmin)+"K";
			if (S$.ship.sensor_level < SF.SENSOR_TEMP) {
				tmax = "?";
				tmin = "?";
			}						
      var atmo = this.data.atmosphere;
			this.addStat("Minimum Temperature: " + tmin);
      this.addStat("Maximum Temperature: " + tmax);
      var at;
      if (atmo < 0.01) {
          at = "None";
      } else if (atmo < 0.05) {
          at = "Not Much";
      } else if (atmo < 0.10) {
          at = "Thin";
      } else if (atmo < 0.2) {
          at = "Weak";
      } else if (atmo < 0.5) {
          at = "Hazy";
      } else if (atmo < 0.7) {
          at = "Thick";
      } else if (atmo < 0.9) {
          at = "Heavy";
      } else {
          at = "Swimmy";
      }
			if (S$.ship.sensor_level < SF.SENSOR_ATMOSPHERE) {
				at = "?";
			}						
      this.addStat("Atmosphere: " + at);
      var wind = Math.floor(this.data.windspeed * 10) / 10;
			wind += " kph";
			if (S$.ship.sensor_level < SF.SENSOR_ATMOSPHERE) {
				wind = "?";
			}						
      this.addStat("Surface Wind: " + wind);
      var storm = this.data.lightningfreq;
      var st;
      if (storm < 0.25) {
          st = "None";
      } else if (storm < 0.5) {
          st = "Mellow";
      } else if (storm < 1) {
          st = "Poppin'";
      } else if (storm < 2) {
          st = "Shocking";
      } else {
          st = "Juiced";
      }
			if (S$.ship.sensor_level < SF.SENSOR_STORM) {
				st = "?";
			}						
      this.addStat("Storm Activity: " + st);

      var hab = "No";
      if (this.data.habitable) {
          hab = "Yes";
      }
			if (S$.ship.sensor_level < SF.SENSOR_PLANET_LIFE) {
        hab = "?";
			}
      this.addStat("Habitable: " + hab);
      var life = "No";
      if (this.data.life) {
          life = "Yes";
      }
			if (S$.ship.sensor_level < SF.SENSOR_PLANET_LIFE) {
        life = "?";
			}
      this.addStat("Life: " + life);

      var tec = this.data.tectonics;
      var te;
      if (tec < 0.05) {
          te = "Rigid";
      } else if (tec < 0.10) {
          te = "Crusty";
      } else if (tec < 0.2) {
          te = "Shifty";
      } else if (tec < 0.5) {
          te = "Rolling";
      } else {
          te = "Dynamite!";
      }
			if (S$.ship.sensor_level < SF.SENSOR_TECTONICS) {
				te = "?";
			}						
      this.addStat("Tectonics: " + te);

			if (!this.data.is_moon) {  // Planet.
        this.addStat("Major satellites: " + this.data.moons.length);
			}
			/*
			let symbol_seed = this.data.is_moon ? this.data.seed : this.data.seed+SF.PLANET_ONLY_OFFSET;
			let building_types = S$.GetBuildingTypes(symbol_seed);
			if (building_types.length === 0) {
				let symbols = S$.GetBuildingSymbols(this.data.systemData.seed, symbol_seed);
				if (symbols == "-") {
					symbols = "None";
				}
				//this.addStat("Surface structures: "+symbols);
			} else {
				//this.addStat("Surface structures: ");
				//SU.DrawBuildingSymbols(building_types, this.statsctx, 183, this.staty-46, SF.BUILDING_TEXT_ICON_SIZE, false);
			}
			*/
    },
    addStat: function(text) {
      SU.text(this.statsctx, text, 10, this.staty, SF.FONT_M, '#000');
      this.staty += 30;
    },
		// Prints surface named areas on the image.
		DrawNamedLandmarks: function(context) {
			if (this.data.ggiant || this.data.is_battlestation || this.data.is_refractor || S$.ship.sensor_level < SF.SENSOR_NAMES) {
				return;
			}
			let points = {};
			let heights = {};
			for (let i = 0; i < 20; i++) {
				let x = Math.round(SU.r(this.data.seed, 1.1+i)*terrainwidth);
				let y = Math.round(SU.r(this.data.seed, 1.2+i)*terrainwidth);
				let height = this.data.GetTerrainHeight(x, y);
				if (!heights["low"] || height < heights["low"]) {
					heights["low"] = height
					points["low"] = [x, y];
				}
				if (!heights["high"] || height > heights["high"]) {
					heights["high"] = height
					points["high"] = [x, y];
				}
				if (height > 128 && (!heights["mid"] || height < heights["mid"])) {
					heights["mid"] = height
					points["mid"] = [x, y];
				}
			}
			if (heights["mid"] == heights["low"] || heights["mid"] == heights["high"]) {
				// Not unique.
				delete points["mid"];
			}
			if (heights["high"] == heights["low"]) {
				// Not unique.
				delete points["low"];
			}
			let color = "rgba(255, 255, 255, 0.3)";
			if (points["high"]) {
				let name = this.GetLandmarkName(this.data.seed + 4.21, high_names);
				let xy = this.TranslateCoords(points["high"]);
				SU.text(context, name, xy[0], xy[1], SF.FONT_S, color, 'center');
			}
			if (points["mid"]) {
				let name = this.GetLandmarkName(this.data.seed + 4.22, mid_names);
				let xy = this.TranslateCoords(points["mid"]);
				SU.text(context, name, xy[0], xy[1], SF.FONT_S, color, 'center');
			}
			if (points["low"]) {
				let name = this.GetLandmarkName(this.data.seed + 4.23, low_names);
				let xy = this.TranslateCoords(points["low"]);
				SU.text(context, name, xy[0], xy[1], SF.FONT_S, color, 'center');
			}
			
			// Couple more random.
			for (let i = 0; i < 2; i++) {
				if (SU.r(this.data.seed, 6.2+i) < 0.7) {
					let name = ST.getWord(this.data.raceseed, this.data.seed+1.52+i);
					let x = Math.round(SU.r(this.data.seed, 7.1+i)*terrainwidth);
					let y = Math.round(SU.r(this.data.seed, 7.2+i)*terrainwidth);
					let xy = this.TranslateCoords([x, y]);
					SU.text(context, name, xy[0], xy[1], SF.FONT_S, color, 'center');
				}
			}
			
		},
		// Translates the [0->512] map coords onto the drawing map.
		TranslateCoords: function(xy) {
			let x = xy[0]*SF.WIDTH/terrainwidth;
			let y = xy[1]*Y_COMPRESS*SF.HEIGHT/terrainheight;
			return [x, y];
		},
		// Gets a name for the seed and name list.
		GetLandmarkName: function(seed, name_list) {
			let name = ST.getWord(this.data.raceseed, seed+1.52);
			if (SU.r(seed, 5.21) < 0.8) {
				let name2 = name_list[Math.floor(SU.r(seed, 5.22)*name_list.length)];
				if (SU.r(seed, 5.23) < 0.5) {
					name = name + " " + name2;
				} else {
					name = name2 + " " + name;
				}
			}
			return name;
		},		
    teardown: function() {
//            SB.clear();
			SU.clearText();
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.iconcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SC.layer3.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // Coords.
    },
  };
  SU.extend(SBar.PlanetRenderer, SBar.TierRenderer);
})();
