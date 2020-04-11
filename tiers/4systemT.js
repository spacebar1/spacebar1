(function() {

  SBar.SystemTier = function(systemData) {
      this._initSystemTier(systemData);
  };

  SBar.SystemTier.prototype = {
    type: SF.TIER_SYSTEM,
    data: null,
		systemx: null,
		systemy: null,
		shipx: null,
		shipy: null,
    renderer: null,
    planetIcons: null,
    beltIcons: null,
    context: null,
		last_area_seed: null,
		last_location_data: null,  // Not storing seed for easy travel source.
    _initSystemTier: function(systemData) {
      this.data = systemData;
      this.context = SC.layer1;
      this.planetIcons = [];
      this.beltIcons = [];
			this.systemx = systemData.x;
			this.systemy = systemData.y;
      for (var i = 0; i < this.data.planets.length; i++) {
        var planetData = this.data.planets[i];
        var icon = new SBar.IconPlanet(this, planetData);
        this.planetIcons.push(icon);
      }
      for (var i = 0; i < this.data.belts.length; i++) {
        var beltData = this.data.belts[i];
        var icon = new SBar.IconBelt(this, beltData);
        this.beltIcons.push(icon);
      }
    },
    activate: function() {
			let hostile_race = null;
			if (SG.activeTier && SG.activeTier.type === SF.TIER_STARMAP && (!SG.last_system || SG.last_system !== this.data.seed)) {
				// Entering this system.
				S$.game_stats.system_visits++;
				let race = SG.activeTier.GetShipRegionRaceData();
				if (race.core && race.race.alignment < SF.NEUTRAL_SCORE) {
					hostile_race = race;
				}				
			} else if (SG.activeTier && SG.activeTier.data && SG.activeTier.data.name) {
				this.last_area_seed = SG.activeTier.data.seed;
			} else {
				this.last_area_seed = null;
			}
			
			if (this.shipx === null) {
				if (SG.activeTier && (SG.activeTier.type === SF.TIER_PLANET || SG.activeTier.type === SF.TIER_PBELT)) {
					// Entering from a planet that jumped to a low level. Set the location of the planet.
					let target_data = SG.activeTier.data;
					this.SetShipTargetLocation(target_data);
					this.last_location_data = target_data;
				} else {
					// Entering from interstellar.
					const entry = this.data.GetSystemEntryPoint();
					this.shipx = entry.x*SF.SYSTEM_ZOOM+SF.HALF_WIDTH;
					this.shipy = entry.z*SF.SYSTEM_ZOOM+SF.HALF_HEIGHT*2/3;
				}
			}
			
      SG.activeTier.teardown();
      SG.activeTier = this;
			this.data.tier = this;  // For reuse after going interstellar.
			
			if (S$.ship.sensor_level >= SF.SENSOR_SYSTEM_STRUCTURES) {
				this.data.ScanNodelay();
			}
			S$.AddSystemBuildingData(this.data);
			
      this.renderer = new SBar.SystemRenderer(this);
      this.renderer.render();
			if (hostile_race) {
				this.CheckHostileEncounter(hostile_race);
			}
    },
		CheckHostileEncounter: function(racedata) {
			let capital = false;
      for (let i = 0; i < this.data.planets.length; i++) {
        if (this.data.planets[i].is_capital) {
        	capital = true;
        }
      }
      for (var i = 0; i < this.data.belts.length; i++) {
        if (this.data.belts[i].is_starport) {
        	capital = true;
        }
			}
			let chance = 0.2;
			if (capital) {
				chance = 0.75;
			}
			if (this.data.in_alpha_bubble) {
				// General systems in alpha areas are unprotected.
				chance = 0;
			}
			if (SU.r(this.data.seed, 4.14+S$.time) < chance || this.data.alpha_core) {
				let callback = function(encounter_data) {
					if (!encounter_data.won) {
						// Don't let the player enter the system on flee.
						this.leaveSystem();
						SG.last_system = -1;						
					}
				}
				let battle = new SBar.BattleBuilder(SF.BATTLE_RACE_MILITARY, this.data, /*attacking=*/false, callback.bind(this),
	      	{description: "Ambushed by "+ST.RaceName(racedata.race.seed)+"!", seed: this.data.seed+S$.time});
				SG.death_message = "Killed by the military while exploring a hostile system.";
				SU.PushBattleTier(battle);
			}
		},
		/*
		Scan: function() {
			if (!SE.PassTime(24)) {
				return;
			}
			this.data.ScanNodelay();
			this.activate();
		},
		*/
		VisitTimeCheck: function(planet_or_belt_data) {
			if (this.last_area_seed && this.last_area_seed == planet_or_belt_data.seed) {
				// Already there, don't pass time.
				return true;
			}
			let result = SE.PassTime(1);
			if (result) {
				if (planet_or_belt_data.type === SF.TYPE_BELT_DATA) {
					if (planet_or_belt_data.is_starport) {
						if (S$.in_alpha_space) {							
							S$.game_stats.pod_visits++;
						} else {
							S$.game_stats.starport_visits++;
						}
					} else if (planet_or_belt_data.is_pirate_base) {
						S$.game_stats.pirate_hideout_visits++;
					} else if (planet_or_belt_data.is_party_yacht) {
						S$.game_stats.party_yacht_visits++;
					} else {
						S$.game_stats.belt_visits++;
					}
				} else {  // Planet data.
					if (planet_or_belt_data.is_moon) {
						S$.game_stats.moon_visits++;
					} else {
						S$.game_stats.planet_visits++;
					}
				}
			}
			return result;
		},
    handleKey: function(key) {
			if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
				// Planet. Move 0 to 10, and reduce all by 1.
				var index = (key-SBar.Key.NUM1);
				if (index < 0) {
					index += 10;
				}
				if (index < this.planetIcons.length) {
					if (!this.VisitTimeCheck(this.planetIcons[index].data)) {
						return;
					}
					//this.planetIcons[index].data.activateTier();
					this.TravelToLocation(this.planetIcons[index].data);
				}
				return;
			}
			if (key >= SBar.Key.SHIFT0 && key <= SBar.Key.SHIFT9) {
				// Belt. Move 0 to 10, and reduce all by 1.
				var index = (key-SBar.Key.SHIFT1);
				if (index < 0) {
					index += 10;
				}
				if (index < this.beltIcons.length) {
					if (!this.VisitTimeCheck(this.beltIcons[index].data)) {
						return;
					}
					//this.beltIcons[index].data.activateTier(0, 0);
					this.TravelToLocation(this.beltIcons[index].data);
				}
				return;
			}
      switch (key) {
        //case SBar.Key.S:
        //  this.Scan();
        //  break;
	      case SBar.Key.L:
					SU.PushTier(new SBar.LookAroundRenderer());
	        break;
        case SBar.Key.X:
          this.leaveSystem();
          break;
        default:
          error("unrecognized key pressed in system: " + key);
      }
    },
    teardown: function() {
      // don't tear down the planet data, since planet entry calls teardown
      // system is also used on the way back up.
			// TODO: doublecheck if this is still true.
      if (this.renderer !== null) {
        this.renderer.teardown();
        delete this.renderer;
      }
    },
    // called when destroying a region
    fullteardown: function() {
      for (var obj in this.planetIcons) {
        this.planetIcons[obj].teardown();
      }
      for (var obj in this.beltIcons) {
        this.beltIcons[obj].teardown();
      }
      delete this.planetIcons;
      delete this.beltIcons;
    },
    leaveSystem: function() {
			SG.last_system = this.data.seed;
      this.teardown();
			this.data.drewNebula = false;					
      if (SG.starmap === null) {
        SG.starmap = new SBar.StarmapTier();
      }
      SG.starmap.activate(this.systemx, this.systemy, this.data);
    },
		MouseMove: function(x, y) {
	    if (this.renderer.RenderUpdate(this.systemx, this.systemy, x, y+SF.HALF_HEIGHT/3)) {
	    	return;
	    }
			var index = Math.floor((x+SF.HALF_WIDTH)/100);
			var y_slot = y+SF.HALF_HEIGHT-SF.HEIGHT*0.70;
			var y_slot2 = y+SF.HALF_HEIGHT-SF.HEIGHT*0.85;
			if (y_slot2 >= 0) {
				if (index < this.beltIcons.length) {
					this.beltIcons[index].DrawNameAt(index * 100+50, SF.HEIGHT*0.85+25);
				}
				return;
			}
			if (y_slot >= 0) {
				if (index < this.planetIcons.length) {
					this.planetIcons[index].DrawNameAt(index * 100+50, SF.HEIGHT*0.7+25);
				}
			}
		},
	  HandleClick: function(x, y) {
			for (var i = 0; i < this.planetIcons.length; i++) {
				if (this.planetIcons[i].checkClick(this.systemx, this.systemy, x, y+SF.HALF_HEIGHT/3)) {
					this.TravelToLocation(this.planetIcons[i].data);
					return;
				}
			}
			for (var i = 0; i < this.beltIcons.length; i++) {
				if (this.beltIcons[i].checkClick(this.systemx, this.systemy, x, y+SF.HALF_HEIGHT/3)) {
					this.TravelToLocation(this.beltIcons[i].data);
					return;
				}
			}
			
			var index = Math.floor((x+SF.HALF_WIDTH)/100);
			var y_slot = y+SF.HALF_HEIGHT-SF.HEIGHT*0.70;
			var y_slot2 = y+SF.HALF_HEIGHT-SF.HEIGHT*0.85;
			if (y_slot2 >= 0) {
				if (index < this.beltIcons.length) {
					this.TravelToLocation(this.beltIcons[index].data);
				}
				return;
			}
			if (y_slot >= 0) {
				if (index < this.planetIcons.length) {
					this.TravelToLocation(this.planetIcons[index].data);
				}
			}
	  },
		SetShipTargetLocation(target_data) {
			this.shipx = (target_data.x-this.systemx)*SF.SYSTEM_ZOOM+SF.HALF_WIDTH;
			this.shipy = (target_data.y-this.systemy)*SF.SYSTEM_ZOOM+SF.HALF_HEIGHT*2/3;
		},
		// Travel to a belt or planet.
		TravelToLocation: function(target_data) {
			//if (target_data.x === this.shipx && target_data.y === this.shipy) {
			if (this.last_location_data && this.last_location_data === target_data) {
				// Already there, no travel needed.
				target_data.activateTier();
				return;
			}

			if (!this.VisitTimeCheck(target_data)) {
				return;
			}
			this.SetShipTargetLocation(target_data);
			
			if (this.last_location_data) {
				this.last_location_data.ClearShipPosition();
			}
			let arrive_callback = function() {
				this.last_location_data = target_data;
				target_data.activateTier();
	      //SG.activeTier = this;				
				//SU.PushTier(new SBar.PlanetsideRenderer(this.data, x, y));
			}
			SU.GetTravelRenderer().ToSystemLocation(this.last_location_data, target_data, arrive_callback.bind(this));
		},
  };
  SU.extend(SBar.SystemTier, SBar.Tier);
})();
