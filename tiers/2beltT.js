(function() {

  SBar.BeltTier = function(beltData) {
      this._initBeltTier(beltData);
  };

  SBar.BeltTier.prototype = {
    type: SF.TIER_PBELT,
    mousex: null,
    mousey: null,
    shipx: null,
    shipy: null,
    data: null,
    renderer: null,
    asteroids: null,
    context: null,
		dust: null,
    _initBeltTier: function(beltData) {
      this.data = beltData;
      this.asteroids = [];
      this.context = SC.layer1;

      this.dust = new SBar.IconBeltDust(this, 1, this.data.seed+1);

			this.custom_obj_map = [];
			var custom_building_map = S$.custom_buildings[this.data.seed];
			if (custom_building_map) {
				for (var obj in custom_building_map) {
					let custom_data = custom_building_map[obj];
					custom_data = S$.CheckExpiredCustomBuilding(custom_data, this.data, this.data.systemData);
					this.custom_obj_map[custom_data.x+","+custom_data.y] = custom_data;
				}
			}

      for (var i = 0; i < this.data.asteroids.length; i++) {
				let custom_data = this.custom_obj_map[this.data.asteroids[i].x+","+this.data.asteroids[i].y];
        var asteroid = new SBar.IconAsteroid(this, i, custom_data);
        this.asteroids.push(asteroid);
      }
    },
    activate: function(shipx, shipy) {
      this.renderer = new SBar.BeltRenderer(this);
      SG.activeTier.teardown();
			S$.AddBuildings(this.data);
			
			//this.shipx = 0;
			//this.shipy = 0;
			if (shipx) {
				this.shipx = shipx;
				this.shipy = shipy;
			} else if (this.shipx === null) {
				// Entry location.
				this.shipx = Math.floor(SU.r(this.data.seed, 55.1)*SF.WIDTH);
				this.shipy = Math.floor(SU.r(this.data.seed, 55.2)*SF.HEIGHT);
			}
			this.mousex = 0;
			this.mousey = 0;
			let pirate_encounter = false;
			if (SG.activeTier.type === SF.TIER_SYSTEM && this.data.is_pirate_base && !this.data.systemData.in_alpha_bubble) {
				if (!SG.activeTier.last_area_seed || SG.activeTier.last_area_seed != this.data.seed) {
					if (SU.r(9.21,this.data.seed+S$.time) < 0.1) {
						pirate_encounter = true;
					}
				}
			}
			let alpha_encounter = false;
			if (SG.activeTier.type === SF.TIER_SYSTEM && this.data.is_party_yacht) {
				alpha_encounter = true;
			}
	    SG.activeTier = this;
      this.renderer.render();
			this.MouseMove(SG.mx, SG.my);
			if (alpha_encounter) {
				this.AlphaEncounter();
			}	else if (pirate_encounter) {
				this.PirateEncounter()
			}
    },
    handleKey: function(key) {
			if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
				// Building. Move 0 to 10, and reduce all by 1.
				var index = (key-SBar.Key.NUM1);
				if (index < 0) {
					index += 10;
				}
				this.VisitBuilding(index);
				return;
			}
			
      switch (key) {
				case SBar.Key.X:
            this.depart();
            break;
				case SBar.Key.V:
					this.Visit();
					break;
        default:
            error("unrecognized key pressed in belt: " + key);
      }
    },
		Visit: function() {
			for (let asteroid of this.asteroids) {
				if (asteroid.TryActivate(this.mousex, this.mousey)) {
					break;
				}
			}
		},
		VisitBuilding: function(index) {
			// Need to account for empty asteroids / bays, when selecting from number.
			var check_index = 0;
			for (var i = 0; i < this.asteroids.length; i++) {
				if (this.asteroids[i].building_name) {
					if (index == check_index) {
						this.asteroids[i].TryActivate(this.asteroids[i].building_icon.data.x, this.asteroids[i].building_icon.data.y);
						return;
					}
					check_index++;
				}
			}
		},
		MouseMove: function(x, y) {
			// Mouse is on the scale -HALF_WIDTH, -HALF_HEIGHT. Mid-screen at 0,0.
			this.mousex = x+SF.HALF_WIDTH;
			this.mousey = y+SF.HALF_HEIGHT;
			if (this.mousex < 0 || this.mousex > SF.WIDTH || this.mousey < 0 || this.mousey > SF.HEIGHT) {
				return;
			}
	    this.renderer.renderUpdate();
		},
	  HandleClick: function(x, y) {
			this.Visit();
	  },
		PirateEncounterCallback: function(encounter_data) {
			if (!encounter_data.won) {
				// Don't let the player enter the system.
				this.depart();
				return;
			}
      SG.activeTier = this;
      this.renderer.render();
			this.MouseMove(SG.mx, SG.my);
		},		
		PirateEncounter: function() {
			let battle = new SBar.BattleBuilder(SF.BATTLE_PIRATE, this.data, /*attacking=*/false, this.PirateEncounterCallback.bind(this),
			   {seed: this.data.seed+S$.time, battle_name: this.data.name+" Pirate Ambush", description: "Pirates intercept your ship."});
			SG.death_message = "Killed by pirate ambush while in their domain.";
			SU.PushBattleTier(battle);
		},		
		AlphaEncounter: function() {
			let callback = function(encounter_data) {
				if (!encounter_data.won) {
					// Don't let the player enter the planet.
					this.depart();
					return;
				}
	      SG.activeTier = this;
	      this.renderer.render();
				this.MouseMove(SG.mx, SG.my);
			}
			let battle = new SBar.BattleBuilder(SF.BATTLE_RACE_MILITARY, this.data.systemData, /*attacking=*/false, callback.bind(this),
      	{description: "Intercepted at "+this.data.name+" by "+ST.RaceName(this.data.raceseed)+"!", seed: this.data.seed+S$.time});
			SG.death_message = "Killed by strange creatures that looked like your friend while in their domain.";
			SU.PushBattleTier(battle);
		},
		// Refresh if the buildings changed.
		CheckForRefresh: function() {
			// Easier to avoid transition bugs just by re-rendering.
			this.data.activateTier();
		},		
    depart: function() {
        this.teardown();
        this.data.systemData.activateTier(this.data.x, this.data.y);
    },
    teardown: function() {
        this.renderer.teardown();
    }
  };
  SU.extend(SBar.BeltTier, SBar.Tier);
})();

