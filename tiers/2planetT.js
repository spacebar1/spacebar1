(function() {

  SBar.PlanetTier = function(planetData) {
      this._initPlanetTier(planetData);
  };

  SBar.PlanetTier.prototype = {
    type: SF.TIER_PLANET,
    data: null,
    renderer: null,
    justentered: false,
    context: null,
		iconcontext: null,  // For changes based on mouse movement.
    timeOffset: 0,
		render_calls: 0,
	  timeout: null,
		moon_icons: null,
		surface_icons: null, // icons for rendering
		mousesurfacex: null,
		mousesurfacey: null,
		shipx: null,  // Ship location on the surface, if it has landed.
		shipy: null,
    _initPlanetTier: function(planetData) {
      this.data = planetData;
      this.context = SC.layer1;
			this.iconcontext = SC.layer2;
			this.moon_icons = [];
			
			this.data.generate();
			this.data.GenerateTerrain();
      this.surface_icons = [];
      for (var obj in this.data.buildingdata) {
				if (!S$.removed_buildings[this.data.buildingdata[obj].seed]) {
	        var buildingdata = this.data.buildingdata[obj];
					var floating = this.data.isFloating(buildingdata.x, buildingdata.y);
	        var icon = new SBar.IconBuilding(this.iconcontext, buildingdata, floating);
	        this.surface_icons.push(icon);
				}
      }
			var custom_building_map = S$.custom_buildings[this.data.seed];
			if (custom_building_map) {
				for (var obj in custom_building_map) {
					var custom_data = custom_building_map[obj];
					custom_data = S$.CheckExpiredCustomBuilding(custom_data, this.data, this.data.systemData);
					var floating = this.data.isFloating(custom_data.x, custom_data.y);
					// New obj here, presuming the object may not have been stored.
					this.surface_icons.push(new SBar.IconCustomBuilding(this.iconcontext, this.data, custom_data, floating));
				}
			}
			
			/*
      for (var i = 0; i < this.data.moons.length; i++) {
          var moon_data = this.data.moons[i];
          var icon = new SBar.IconPlanet(this, moon_data);
          this.moon_icons.push(icon);
      }						*/
    },
    activate: function(toxIn, toyIn) {
			if (toxIn) {
	      this.mousesurfacex = toxIn;
	      this.mousesurfacey = toyIn;
			} else {
				this.mousesurfacex = 256;
				this.mousesurfacey = 256;
			}
			// This is before the following teardown.
			const from_system = SG.activeTier.type === SF.TIER_TRAVEL || SG.activeTier.type === SF.TIER_SYSTEM || SG.activeTier.type === SF.TIER_TEST;// || SG.activeTier.type === SF.TIER_PLANET;  // Planet is to allow moons.
      SG.activeTier.teardown();
      SG.activeTier = this;
      this.renderer = new SBar.PlanetRenderer(this, /*spin_planet=*/true);
			S$.AddBuildings(this.data);
			
      this.renderer.render();
			this.render_calls = 0;
			//if (spin_planet) {
				// Render every 50 ms, 100 times.
				this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);
				//} else {
				//this.render_calls = 999;
				//}
						
			this.MouseMove();
			
			SE.PlanetVisit(this.data);			
			if (from_system && (this.data.is_battlestation || this.data.is_refractor)) {
				let callback = function(encounter_data) {
					if (!encounter_data.won) {
						// Don't let the player enter the planet.
						this.depart();
					}
				}
				let battle = new SBar.BattleBuilder(SF.BATTLE_RACE_MILITARY, this.data.systemData, /*attacking=*/false, callback.bind(this),
	      	{description: "Intercepted at "+this.data.name+" by "+ST.RaceName(this.data.raceseed)+"!", seed: this.data.seed+S$.time});
				SG.death_message = "Killed by the military that looked like your friend.";
				SU.PushBattleTier(battle);
			}			
    },
		// Refresh if the buildings changed.
		CheckForRefresh: function() {
			// Easier to avoid transition bugs just by re-rendering everything.
			var x = this.mousesurfacex;
			var y = this.mousesurfacey;
			this._initPlanetTier(this.data);
			this.activate(x, y, /*skip_teardown=*/true);
		},
    handleUpdate: function(deltaTime, movex, movey) {
			if (SG.activeTier !== this) {
				return;
			}
      this.timeOffset += deltaTime;
      this.renderer.renderUpdate();
			this.render_calls++;
			if (this.render_calls < 100) {
				this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);
			} else {
				this.timeout = null;
			}
    },
    handleKey: function(key) {
			if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
				// Building. Move 0 to 10, and reduce all by 1.
				var index = (key-SBar.Key.NUM0)-1;
				if (index < 0) {
					index += 10;
				}
				if (this.surface_icons[index]) {					
					this.VisitBuilding(this.surface_icons[index].data);
					//this.surface_icons[index].data.activateTier();
				}
				return;
			}			
			
			if (key >= SBar.Key.SHIFT0 && key <= SBar.Key.SHIFT9) {
			//if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
				// Moon.
				const index = key-SBar.Key.SHIFT1;
				this.LoadMoon(index);
				return;
			}
//					if ((key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) 
//					    || (key >= SBar.Key.SHIFT0 && key <= SBar.Key.SHIFT9)) {
/*
			if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
				// Switch planets. Reload on that planet.
        this.depart();
	      SG.activeTier.handleKey(key);
				return;
			}
*/
      switch (key) {
	      case SBar.Key.L:
					SU.PushTier(new SBar.LookAroundRenderer());
	        break;
        case SBar.Key.X:
          this.depart();
          break;
//        case SBar.Key.V:
//          this.loadSurfaceRaw(256, 256);
//          break;
        default:
          error("unrecognized key pressed in planet: " + key);
      }
    },
    HandleClick: function(x, y) {
			this.Visit();
			if (y > SF.HALF_HEIGHT-175) {
				// Moon spacing is 150.
				var moons_width = this.data.moons.length * 150;
				var x_offset = x+moons_width/2;
				var moon = Math.floor(x_offset/150);
				if (moon >= 0 && moon < this.data.moons.length) {
					this.LoadMoon(moon);
					return;
				}
			}
		},
		// Also called externally.
		SetShipLocation: function(building_data) {
			this.shipx = building_data.x;
			this.shipy = building_data.y;
		},
		VisitBuilding: function(building_data) {
			if (this.shipx == building_data.x && this.shipy == building_data.y) {
				// Already there. No travel, just enter.
				SU.GetTravelRenderer().RedrawCurrent();
				this.renderer.teardown();	  // Show planetside.
	      SG.activeTier = this;				
        building_data.pushBuildingTier();
				return;
			}
			let activate_callback = function() {
	      SG.activeTier = this;
				this.data.ClearShipPosition();  // Clears all moons too.
				this.SetShipLocation(building_data);
        building_data.pushBuildingTier();
			}
			SU.GetTravelRenderer().ToSurface(this.data, this.shipx, this.shipy, building_data.x, building_data.y, activate_callback.bind(this));
		},
		Visit: function() {
			if (isNaN(this.mousesurfacex) || this.mousesurfacex < 0 || this.mousesurfacex > 512 || this.mousesurfacey < 0 || this.mousesurfacey > 512) {
				error("novisitcoords")
				return;
			}
			
			for (var i = 0; i < this.surface_icons.length; i++) {
				if (this.surface_icons[i].TryActivate(this.mousesurfacex, this.mousesurfacey)) {
					this.VisitBuilding(this.surface_icons[i].data);
					return;
				}
			}
			// No match, push planetside.
			//this.context.setTransform(1, 0, 0, 1, 0, 0); // Reset
			//this.teardown();
			
			let land_callback = function() {
				let x = this.mousesurfacex;
				let y = this.mousesurfacey;
				this.data.ClearShipPosition();  // Clears all moons too.
				this.shipx = x;
				this.shipy = y;
				let data = this.data;
				//this.activate(this.mousesurfacex, this.mousesurfacey);  // Make sure it's the active tier for pop().
	      SG.activeTier = this;				
				SU.PushTier(new SBar.PlanetsideRenderer(this.data, x, y));
			}
			SU.GetTravelRenderer().ToSurface(this.data, this.shipx, this.shipy, this.mousesurfacex, this.mousesurfacey, land_callback.bind(this));
//			this.teardown();
			//SU.PushTier(new SBar.TravelRenderer(this.data.systemData, this.data, this.mousesurfacex, this.mousesurfacey));
			//SU.PushTier(new SBar.PlanetsideRenderer(this.data, this.x, this.mousesurfacey));			
		},		
		MouseMove: function(x, y) {
			// Mouse is on the scale -HALF_WIDTH, -HALF_HEIGHT. Mid-screen at 0,0.
			// Terrain is on scale -256, 256, -256, 256.
			this.mousesurfacex = Math.floor(x*512/SF.WIDTH)+256;
			this.mousesurfacey = Math.floor(512*(y+SF.HALF_HEIGHT-this.renderer.surface_offset)/this.renderer.ycompress/SF.HEIGHT);
			//this.mousesurfacey = Math.floor(y*256/SF.HALF_HEIGHT/this.renderer.ycompress)+256;
			//this.renderer.show_crosshairs = false;
			this.renderer.MouseMove(x, y);
	    //this.renderer.renderUpdate();			
		},				
		LoadMoon: function(index) {
			if (this.data.is_moon) {
				if (this.data.parent_planet_data.moons.length > index) {
					this.teardown();
					this.data.parent_planet_data.moons[index].activateTier();
				}
			} else {
				if (this.data.moons.length > index) {
					this.teardown();
					this.data.moons[index].activateTier();
				}
			}
		},
    depart: function() {
			if (this.data.is_moon) {
        this.data.parent_planet_data.activateTier();
			} else {
        this.data.systemData.activateTier(this.data.x, this.data.y);
			}
    },
    teardown: function() {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
			}
      for (var obj in this.moon_icons) {
          this.moon_icons[obj].teardown();
      }						
      this.timeOffset = 0;
      this.justentered = true;
			if (this.renderer) {
	      this.renderer.teardown();
			}
    },
		
  };
  SU.extend(SBar.PlanetTier, SBar.Data);
})();

