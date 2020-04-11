// system renderer

(function() {
    var nebImgSize = 40;
    SBar.SystemRenderer = function(tier) {
        this._initSystemRenderer(tier);
    };

    SBar.SystemRenderer.prototype = {
      tier: null,
      data: null,
      colorStops: null,
      colorStops2: null,  // Binary.
      statContext: null,
      staty: null,
			stats: null,
			ship_icon: null,
      _initSystemRenderer: function(tierIn) {
        this.tier = tierIn;
        this.data = this.tier.data;
        this.colorStops = [0, 'white', 0.2, 'rgb(' + this.data.colorstr + ')', 0.21, 'rgba(' + this.data.colorstr + ',0.5)', 0.23, 'rgba(' + this.data.colorstr + ',0.2)', 1, 'rgba(255,255,255,0.0)'];
				if (this.data.is_binary) {
          this.colorStops2 = [0, 'white', 0.2, 'rgb(' + this.data.colorstr2 + ')', 0.21, 'rgba(' + this.data.colorstr2 + ',0.5)', 0.23, 'rgba(' + this.data.colorstr2 + ',0.2)', 1, 'rgba(255,255,255,0.0)'];
				}
        this.statContext = SC.layer1;				
      },
      render: function() {
				this.ship_icon = new SBar.IconMapShip(this);
				this.stats = [];
        S$.addButtons();
//            SB.buttX(this.tier.leaveSystem.bind(this.tier));

        this.drawAll();
        this.renderStats();
				this.renderMenu();
        var name = this.data.name;
        let xy = coordToParsec(this.tier.systemx) + ", " + coordToParsec(-this.tier.systemy) + " pc";
				if (S$.ship.sensor_level < SF.SENSOR_COORDINATES) {
					xy = "Unknown Location";
				}
        SU.writeCoordText(name, xy);
				if (this.tier.shipx !== null) {
					this.ship_icon.updatedirect(this.tier.context, this.tier.shipx, this.tier.shipy);
				}			
      },
      RenderUpdate: function(shipx, shipy, x, y) {
        SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				for (planet_icon of this.tier.planetIcons) {
					if (planet_icon.updateName(shipx, shipy, x, y)) {
						return true;
					}
				}
				for (belt_icon of this.tier.beltIcons) {
					if (belt_icon.updateName(shipx, shipy, x, y)) {
						return true;
					}
				}
				return false;
      },
      drawAll: function() {
        var centerx = SF.HALF_WIDTH;
        var centery = SF.HALF_HEIGHT;

        var context = this.tier.context;
        context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SU.Hide3dLayers(/*show_stars=*/true);				
				context.save();
				context.translate(0, -SF.HALF_HEIGHT/3);

				if (this.data.alpha_core || this.data.in_alpha_bubble) {
          for (let planet of this.data.planets) {
						if (planet.is_refractor) {
	            var offx = planet.x - this.data.systemx;
	            var offy = planet.y - this.data.systemy;
	            offx *= SF.SYSTEM_ZOOM;
	            offy *= SF.SYSTEM_ZOOM;
							offx += centerx;
							offy += centery;
							SU.line(context, centerx, centery, offx, offy, "#FFF", 1)
						}
          }
					SU.DrawAlphaStar(context, this.data, 0, 0, SF.HALF_WIDTH, SF.HALF_HEIGHT, 15);
				}	
        for (var i = 0; i < this.data.numplanets; i++) {
            var planet = this.data.planets[i];
            SU.circleRad(context, centerx, centery, planet.distanceOut * SF.SYSTEM_ZOOM, null, 'rgba(255,255,255,0.15)', 1);
        }
        for (var obj in this.data.beltrings) {
            var dist = this.data.beltrings[obj];
            SU.circleRad(context, centerx, centery, dist * SF.SYSTEM_ZOOM, null, 'rgba(100,100,100,0.15)', 1);
        }
				if (!this.data.isDead() && !this.data.in_alpha_bubble && !this.data.alpha_core) {
            // habitable zone
            SU.circleRad(context, centerx, centery, SF.SYSTEM_ZOOM * this.data.habcenter, null, 'rgba(0,255,0,0.05)', SF.SYSTEM_ZOOM * this.data.habwidth);
            // star
            SU.circleRad(context, centerx, centery, this.data.main_radius * SF.SYSTEM_ZOOM / 2, this.colorStops);
						if (this.data.is_binary) {
              SU.circleRad(context, centerx + this.data.binaryx/3000*this.data.binary_distance, centery + this.data.binaryy/3000*this.data.binary_distance, this.data.binary_radius * SF.SYSTEM_ZOOM / 2, this.colorStops2);
						}
        }
        for (var obj in this.tier.beltIcons) {
            var icon = this.tier.beltIcons[obj];
            icon.update(this.tier.systemx, this.tier.systemy);
            if (SG.activeTier !== this.tier) {
                return;
            }
        }
        // planets last to have on top
        for (var obj in this.tier.planetIcons) {
            var icon = this.tier.planetIcons[obj];
            icon.update(this.tier.systemx, this.tier.systemy);
            if (SG.activeTier !== this.tier) {
                return;
            }
        }
				context.restore();
				SU.rect(context, 0, SF.HEIGHT*0.72, SF.WIDTH, SF.HEIGHT*0.15, 'rgba(50,50,50,0.75)');
				SU.rect(context, 0, SF.HEIGHT*0.87, SF.WIDTH, SF.HEIGHT*0.13, 'rgba(0,0,0,0.75)');
				SU.line(context, 0, SF.HEIGHT*0.72, SF.WIDTH, SF.HEIGHT*0.72, 'rgba(100,100,100,0.5)')
				SU.line(context, 0, SF.HEIGHT*0.87, SF.WIDTH, SF.HEIGHT*0.87, 'rgba(100,100,100,0.5)')
				for (var i = 0; i < this.tier.beltIcons.length; i++) {
					this.IconAndText(context, this.tier.beltIcons[i], i*100+50, SF.HEIGHT*0.925, SF.HEIGHT*0.97)
				  //var icon = this.tier.beltIcons[i];
          //icon.updateBig(i*100+50, SF.HEIGHT*0.925);
					//SU.text(context, S$.GetKnownBuildingCount(icon.data.seed), i*100+50, SF.HEIGHT*0.97, "bold 11pt monospace", 'rgba(160,160,160,1)', 'center');
				}
				for (var i = 0; i < this.tier.planetIcons.length; i++) {
					this.IconAndText(context, this.tier.planetIcons[i], i*100+50, SF.HEIGHT*0.775, SF.HEIGHT*0.83)
				  //var icon = this.tier.planetIcons[i];
          //icon.updateBig(i*100+50, SF.HEIGHT*0.775);
					//SU.text(context, S$.GetKnownBuildingCount(icon.data.seed), i*100+50, SF.HEIGHT*0.83, "bold 11pt monospace", 'rgba(160,160,160,1)', 'center');
				}
      },
			IconAndText: function(context, icon, x, icony, texty) {
        icon.updateBig(x, icony);
				let symbol_seed = icon.data.seed;
				let building_types = S$.GetBuildingTypes(this.data.seed, symbol_seed);
				if (building_types.length === 0) {
					let symbol = S$.IsKnownPlanet(this.data.seed, symbol_seed) ? "-" : "?";
					SU.text(context, symbol, x, texty, "bold 11pt monospace", 'rgba(160,160,160,1)', 'center');
				} else {
					SU.DrawBuildingSymbols(building_types, context, x, texty-15, SF.BUILDING_TEXT_ICON_SIZE, /*center=*/true);
				}
				let moon_symbol = S$.GetMoonsSymbol(this.data.seed, symbol_seed);
				if (moon_symbol != "") {
					SU.text(context, moon_symbol, x, texty+20, "bold 11pt monospace", 'rgba(160,160,160,1)', 'center');
				}
			},
      renderStats: function() {
				/*

        //this.statContext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        this.staty = 110;
        this.statContext.font = SF.FONT_M;
        this.statContext.fillStyle = 'white';
        this.statContext.textAlign = 'left';

				let system_size = Math.floor(this.data.radius * 80)/10 + " AU";
				if (S$.ship.sensor_level < SF.SENSOR_NUM_AND_SIZE) {
					system_size = "?";
				}					
        this.addStat("System Size: " + system_size);
				if (S$.ship.sensor_level < SF.SENSOR_HAZARD) {
          this.addStat("Hazard Level: ?");
        } else if (this.data.level < 3) {
            this.addStat("Hazard Level: Low");
        } else if (this.data.level < 3) {
            this.addStat("Hazard Level: Medium");
        } else {
            this.addStat("Hazard Level: High");
        }
				let num_planets = S$.ship.sensor_level < SF.SENSOR_NUM_AND_SIZE ? "?" : this.data.numplanets;
        this.addStat("Major Planets: " + num_planets);
        //this.addStat("Asteroid Rings: " + this.data.beltrings.length);
				let num_belts = S$.ship.sensor_level < SF.SENSOR_NUM_AND_SIZE ? "?" : this.data.belts.length;
				this.addStat("Asteroid Belts: " + num_belts);
				if (S$.ship.sensor_level >= SF.SENSOR_PLANET_LIFE) {
          var inhab = false;
          for (var i = 0; i < this.data.numplanets; i++) {
              if (this.data.planets[i].life) {
                  this.addStat("Inhabited Planet: " + (i + 1));
                  inhab = true;
              }
          }
          if (!inhab) {
              this.addStat("Inhabited Planets: None");
          }
				}
				if (S$.GetSystemBuildingData(this.data.seed).tech !== undefined) {
					let tech = S$.GetSystemBuildingData(this.data.seed).tech;
					if (S$.ship.sensor_level < SF.SENSOR_HAZARD) {
            tech = "?";
					}
					this.addStat("Area Tech Level: "+tech);
				}
				SU.rect(this.statContext, 25, 85, 300, this.stats.length*30+10, 'rgba(0,0,0,0.25)');
				this.drawStats();
				*/
      },
      renderMenu: function() {
        for (var i = 0; i < this.data.numplanets; i++) {
          var planet = this.data.planets[i];
					var name = planet.name;
					var text = (i+1)%10+": "+name;
					/*
					if (planet.moons.length > 0) {
						text += " ("+planet.moons.length+")";							
					}
					if (this.tier.planetIcons[i].data.life) {
						text += "*";
					}
					*/
					if (this.tier.planetIcons[i].quest) {
						text += "!";
					}
					SU.addText(text);
			  }
        for (var i = 0; i < this.data.belts.length; i++) {
          var belt = this.data.belts[i];
					var name = belt.name;
					SU.addText(SF.SYMBOL_SHIFT+(i+1)%10+': '+name);
			  }
				//SU.addText("S: Scan");
				SU.addText("L: Look Around");
				SU.addText("X: Starmap");
			},
      addStat: function(text) {
				this.stats.push(text);
      },
			drawStats: function() {
				for (let stat of this.stats) {
          SU.text(this.statContext, stat, 40, this.staty, SF.FONT_L, '#AAA');
          this.staty += 30;
				}
			},
			/*
      // exchanges an absolute coordinate for a zoomed relative one
      convertToCanvasX: function(pos) {
          return (pos - this.data.systemx) * SF.SYSTEM_ZOOM;
      },
      convertToCanvasY: function(pos) {
          return (pos - this.data.systemy) * SF.SYSTEM_ZOOM;
      },
			*/
      teardown: function() {
        SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SU.clearText();
				SU.Hide3dLayers(/*show_stars=*/false);								
        this.statContext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SC.layer3.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // Coords.
        if (this.neb !== null) {
            delete this.neb;
        }
//            SB.clear();
      }
    };
    SU.extend(SBar.SystemRenderer, SBar.TierRenderer);
})();
