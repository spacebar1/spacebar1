/*
 * Main starmap tier, always exists and is singleton
 */
(function() {

let MOVE_SPEED = 5;

SBar.StarmapTier = function() {
  this._initStarmapTier();
};

SBar.StarmapTier.prototype = {
  type: SF.TIER_STARMAP,
	MAX_TRAVEL_DISTANCE: 5000,
	//source_system_data: null,  // System that the player came from. See current_system_tier instead.
  region_icons: null,
	ship_icon: null,
  context: null,
  text_context: null,
  renderer: null,
  shipx: null,  // Ship x.
  shipy: null,
	mapcenterx: null,  // Where the map is centered.
	mapcentery: null,
  cursorx: null,  // Cursor x.
  cursory: null,
  minx: 0, // rendering frame boundary
  miny: 0,
	sorted_race_icons: null,
	just_searched: false,
	current_system_tier: null,  // This will be populated if the ship is still in a system, not having traveled.
	//move_mod: null, // Faster scrolling for held keys.
	max_jump_time: 24*5,
	incoming_message: false,
	jump_time: null,  // Time to a proposed jump, if active.
  _initStarmapTier: function() {
      this.region_icons = [];
      this.context = SC.layer1;
      this.text_context = SC.layer2;
  },
	// Transaltes a sensor level to a range.
	SensorRange(level) {
		return 50 + level*5;
	},
  activate: function(xIn, yIn, source_data /*optional*/, skip_teardown/*optional*/) {
		if (SG.mx === null) error ("reminder mx is null, mouse hasn't started");
		if (this.renderer === null) { // Not initialized.
			if (SG.activeTier && SG.activeTier.type === SF.TIER_SYSTEM) {
				this.current_system_tier = SG.activeTier;
				if (this.current_system_tier.shipx) {
					this.current_system_tier.shipxbak = this.current_system_tier.shipx;
					this.current_system_tier.shipybak = this.current_system_tier.shipy;
					delete this.current_system_tier.shipx;
					delete this.current_system_tier.shipy;
				}
			}
			if (!skip_teardown && SG.activeTier) {
				SG.activeTier.teardown();
			}
			SG.starmap = this;
			SG.activeTier = SG.starmap;
      this.mapcenterx = xIn;
      this.mapcentery = yIn;
			//this.source_system_data = source_data;
      this.shipx = xIn;
      this.shipy = yIn;
			this.SetMouseXY();
      this.updateRegions(this.mapcenterx, this.mapcentery);
			this.ship_icon = new SBar.IconMapShip(this, this.shipx, this.shipy);
			this.AddSensorPoint(this.shipx, this.shipy, this.SensorRange(S$.ship.sensor_level));
      this.renderer = new SBar.StarmapRenderer(this);
		}
		// Check incoming message by week.
		let week = Math.floor(S$.time/24/7);
		this.incoming_message = week != S$.last_message_week && SU.r(82.21, week + 31.12) < 0.1;
		this.MouseMove(SG.mx, SG.my);
    this.renderer.render();
  },
	SetWaypoint: function(index) {
		S$.waypoints[index] = [this.cursorx,this.cursory];
		SU.message("Waypoint "+index+" set.");
	},
	CenterWaypoint: function(index) {
		if (index >= S$.waypoints.length) {
			return;
		}
		var waypoint = S$.waypoints[index];
    this.mapcenterx = waypoint[0];
    this.mapcentery = waypoint[1];
    if (this.mapcenterx < this.minx || this.mapcentery < this.miny || this.mapcenterx > this.minx + SF.REGION_SIZE || this.mapcentery > this.miny + SF.REGION_SIZE) {
        this.updateRegions(this.mapcenterx, this.mapcentery);
    }
		this.SetMouseXY();
    this.renderer.renderFullUpdate();
		
//		this.cursorx = waypoint[0];
//		this.cursory = waypoint[1];
//		this.visit();
	},
	ReceiveMessage: function() {
		let week = Math.floor(S$.time/24/7);
		S$.last_message_week = week;
		this.activate();
		SE.InterstellarEvent(this);		
	},
	SaveGame: function() {
		S$.savexy = [this.shipx, this.shipy];
		SU.saveGame();
		if (!S$.conduct_data['cansave']) {
			this.teardown();
			SU.ClearAllLayers();
			new SBar.StartPage().activate();
		}
	},
  handleKey: function(key, key_held_down) {
		// Waypoint key ranges.
		if (key >= SBar.Key.SHIFT0 && key <= SBar.Key.SHIFT9) {
			this.SetWaypoint(key-SBar.Key.SHIFT0);
			return;
		} else if (key >= SBar.Key.NUM0 && key <= SBar.Key.NUM9) {
			this.CenterWaypoint(key-SBar.Key.NUM0);
			return;
		}
		// Shift to move faster.
		var shift = false;
		if (key >= SBar.Key.SHIFT_CODE_MODIFIER) {
			shift = true;
			//this.move_mod = 1.0;
			key -= SBar.Key.SHIFT_CODE_MODIFIER;
		}
		
    switch (key) {
			// TODO: shift, control to move further.
			case SBar.Key.UP:
			case SBar.Key.W:
			case SBar.Key.DOWN:
			case SBar.Key.S:
			case SBar.Key.LEFT:
			case SBar.Key.A:
			case SBar.Key.RIGHT:
			case SBar.Key.D:
				this.shiftmap(shift);
				break;
      case SBar.Key.V:
          this.visit();
          break;
      case SBar.Key.L:
				SU.PushTier(new SBar.LookAroundRenderer());
        break;
      case SBar.Key.X:
          this.exit();
          break;
      case SBar.Key.C:
          this.Recenter();
          break;
			case SBar.Key.R:
				this.Search();
				break;
			case SBar.Key.Z:
//				this.skip_reset_on_pop = true;
				SU.PushTier(new SBar.AreaMapRenderer(this.mapcenterx, this.mapcentery, this.shipx, this.shipy));
				break;
			case SBar.Key.M:
				this.ReceiveMessage();
				break;
			case SBar.Key.G:
				this.SaveGame();
      default:
          error("unrecognized key pressed in starmap: " + key);
      }
  },
  shiftmap: function(shift) {
		var movex = 0;
		var movey = 0;
		if (SG.keys_down[SBar.Key.UP] || SG.keys_down[SBar.Key.W]) {
			movey -= 1;
		}
		if (SG.keys_down[SBar.Key.DOWN] || SG.keys_down[SBar.Key.S]) {
			movey += 1;
		}
		if (SG.keys_down[SBar.Key.LEFT] || SG.keys_down[SBar.Key.A]) {
			movex -= 1;
		}
		if (SG.keys_down[SBar.Key.RIGHT] || SG.keys_down[SBar.Key.D]) {
			movex += 1;
		}
		if (shift) {
			movex *= 10;
			movey *= 10;
		}
		movex *= 70;
		movey *= 70;
		this.movemap(movex, movey);
	},
	movemap: function(movex, movey) {
    this.mapcenterx += movex * SF.STARMAP_ZOOM * MOVE_SPEED/* * this.move_mod*/;
    this.mapcentery += movey * SF.STARMAP_ZOOM * MOVE_SPEED/* * this.move_mod*/;
    this.cursorx += movex * SF.STARMAP_ZOOM * MOVE_SPEED/* * this.move_mod*/;
    this.cursory += movey * SF.STARMAP_ZOOM * MOVE_SPEED/* * this.move_mod*/;
    if (this.mapcenterx < this.minx || this.mapcentery < this.miny || this.mapcenterx > this.minx + SF.REGION_SIZE || this.mapcentery > this.miny + SF.REGION_SIZE) {
        this.updateRegions(this.mapcenterx, this.mapcentery);
    }
		this.renderer.renderFullUpdate();
	},
  clearRegionIcons: function() {
      for (var region_icon in this.region_icons) {
          this.region_icons[region_icon].teardown();
          delete this.region_icons[region_icon];
      }
      delete this.region_icons;
      this.region_icons = [];
  },
  updateRegions: function(x, y) {
      this.minx = SU.AlignByRegion(x);
      this.miny = SU.AlignByRegion(y);
			
			let region_lookup = {};
			for (let region of this.region_icons) {
				region_lookup[region.data.x+"_"+region.data.y] = region;
			}

      this.region_icons = [];

      for (var xi = -1; xi <= 1; xi++) {
          for (var yi = -1; yi <= 1; yi++) {
              var found = false;
              var newx = this.minx + xi * SF.REGION_SIZE;
              var newy = this.miny + yi * SF.REGION_SIZE;
							let lookup_string = newx+"_"+newy;
							let found_region = region_lookup[lookup_string];
							if (found_region) {
                this.region_icons.push(found_region);
								delete region_lookup[lookup_string];
							} else {
                  var data = new SBar.RegionData(newx, newy);
                  var icon = new SBar.IconMapRegion(this, data);
                  this.region_icons.push(icon);
              }
          }
      }

			// Clear out any regions cycled out.
      for (let obj in region_lookup) {
				region_lookup[obj].teardown();
      }
			this.RebuildRaceRegionCache();
  },
	// Rebuild the cached regions for drawing.
	RebuildRaceRegionCache: function() {		
		this.sorted_race_icons = [];
		for (let region_icon of this.region_icons) {
			this.sorted_race_icons = this.sorted_race_icons.concat(region_icon.races);
		}
		this.sorted_race_icons.sort(function(left, right){return left.race.seed - right.race.seed;}); // Lowest first.					
	},
	// Gets the region at x,y.
	GetRegionIconAt: function(x, y) {
		for (let region of this.region_icons) {
			if (region.data.CoordsInRegion(x, y)) {
				return region;
			}
		}
		printStack();
		error("ERROR: can't find region",x,y);
	},
	// Returns the region race data that the cursor is in.
	GetMouseRegionRaceData: function() {
		let region = this.GetRegionIconAt(this.cursorx, this.cursory);
		return region.data.DetermineRace(this.cursorx, this.cursory);
	},
	// Returns the region race data that the ship is in.
	GetShipRegionRaceData: function() {
		let region = this.GetRegionIconAt(this.shipx, this.shipy);
		return region.data.DetermineRace(this.shipx, this.shipy);
	},
	GetShipRegionIcon: function() {
		return this.GetRegionIconAt(this.shipx, this.shipy);		
	},
  getJumpDistance: function() {
    var dx = this.cursorx - this.shipx;
    var dy = this.cursory - this.shipy;
    return Math.sqrt(dx * dx + dy * dy);
	},
	GetTravelTime: function(distance) {
		if (S$.tow_ship) {
			// Half speed.
			return Math.round(distance / S$.ship.speed);
		}
		return Math.round(distance / S$.ship.speed / 2);
	},
  exit: function() {
		/*
		if (this.source_system_data) {
      this.mapcenterx = this.shipx;
      this.mapcentery = this.shipy;
			this.source_system_data.ActivateFreshTier();
		}
		*/
		if (this.current_system_tier) {
			this.current_system_tier.shipx = this.current_system_tier.shipxbak;
			this.current_system_tier.shipy = this.current_system_tier.shipybak;
			delete this.current_system_tier.shipxbak;
			delete this.current_system_tier.shipybak;
			this.current_system_tier.activate();
		}		
  },
	// Wrapper for visit() to easily track distance traveled.
	visit: function() {
		let origx = this.shipx;
		let origy = this.shipy;
		this.visitInternal();
		let offx = this.shipx - origx;
		let offy = this.shipy - origy;
		if (offx !== 0 || offy !== 0) {
			S$.distance_flown += Math.sqrt(offx*offx+offy*offy);
		}
	},
	// Visits a star if selected. Otherwise visits a point in space.
	visitInternal: function() {
		let distance = this.getJumpDistance();
		let multiplier = this.just_searched ? 2 : 1;
		if (distance > this.MAX_TRAVEL_DISTANCE) {
			SU.message("Too far.");
			return;
		}
		this.just_searched = false;
		
		// Check if the player is just returning to the same system.
		for (var i = 0; i < this.region_icons.length; i++) {
			if (this.region_icons[i].CheckReturn(this.cursorx, this.cursory)) {
				this.exit();
				return;
			}
		}
		
		// Split the travel time into several chunks for events.
		var total_time = this.GetTravelTime(distance);
		this.jump_time = total_time;
		var passed_time = 0;
		var offx = this.cursorx - this.shipx;
		var offy = this.cursory - this.shipy;
		while (passed_time < total_time) {
			var time_chunk = Math.min(Math.floor(SU.r(0, S$.time+6.12)*6)+4, total_time-passed_time);
		  var fraction = time_chunk / total_time;
			var newx = this.shipx + fraction*offx;
			var newy = this.shipy + fraction*offy;
			if (passed_time + time_chunk >= total_time) {
				// Last piece.
				newx = this.cursorx;
				newy = this.cursory;
			}
			var me = this;
			var fail_pre_callback = function() {
				if (passed_time > 0) {
					// Update location for the latest portion.
					me.shipx = newx;
					me.shipy = newy;
				}
			}
			
			if (SE.PassTime(time_chunk)) {
				passed_time += time_chunk;
				this.shipx = newx;
				this.shipy = newy;
				for (var i = 0; i < this.region_icons.length; i++) {
					if (this.region_icons[i].CheckEffect(this.shipx, this.shipy, fail_pre_callback)) {
						return;
					}
				}
				let race = this.GetShipRegionIcon().data.DetermineRace(newx, newy).race;
				if (this.CheckEnteredAlpha(race, newx, newy)) {
					return;
				}
				if (this.CheckExitedAlpha(race, newx, newy)) {
					return;
				}
			} else {
				// The full time chunk didn't pass. Break out.
				if (passed_time > 0) {
					// Update location for the latest portion. SetNewLocation() will be called when popped.
					me.shipx = newx;
					me.shipy = newy;
					let activate_callback_noop = function() {
						//this.SetNewLocation(); // Includes re-renderering.
					}
					SU.GetTravelRenderer().ToSystem(this.jump_time, new SBar.DummySystemData(), activate_callback_noop.bind(this));					
				}
				return;
			}
		}
		for (var i = 0; i < this.region_icons.length; i++) {
			if (this.region_icons[i].TryActivate(this.shipx, this.shipy)) {
				// iconMapSystems.js will run the travel.
				return;
			}
		}
		let region = this.GetRegionIconAt(newx, newy);
		let race = region.data.DetermineRace(newx, newy).race;
		if (this.CheckEnteredAlpha(race, newx, newy)) {
			return;
		}
		this.CheckExitedAlpha(race, newx, newy);
		
		let activate_callback = function() {
			this.SetNewLocation(); // Includes re-renderering.
		}
		SU.GetTravelRenderer().ToSystem(this.jump_time, new SBar.DummySystemData(), activate_callback.bind(this));
		
		//this.SetNewLocation();
	},
	EnterAlphaConfirm: function(confirmed) {
		if (!confirmed) {
			this.SetNewLocation();
			return;
		}
		S$.game_stats.bubble_visits++;
		S$.in_alpha_space = true;
		this.UpdateCurrentBubble();
		this.SetNewLocation();
	},
	// Sets the bubbles the player is in.
	UpdateCurrentBubble: function() {
		S$.alpha_bubbles = [];
		let region = this.GetRegionIconAt(this.shipx, this.shipy);
		for (let race of region.data.allAlphas) {
			for (let bubble of race.bubbles) {
				let offx = bubble.x - this.shipx;
				let offy = bubble.y - this.shipy;
				if (offx*offx + offy*offy < bubble.size*bubble.size) {
					// Seed matches IconMapAlpha.
					S$.background_alpha_seed = SU.r(bubble.x, bubble.y);
					S$.alpha_bubbles.push(bubble);
				}
			}
		}
	},
	// Check if entered alpha space.
	CheckEnteredAlpha: function(race, newx, newy) {
		if (S$.in_alpha_space) {
			this.UpdateCurrentBubble();
			return false;
		}
		if (race.seed !== SF.RACE_SEED_ALPHA) {
			return false;
		}
		let activate_callback = function() {
			this.CheckEnteredAlpha2(race, newx, newy);
		}
		SU.GetTravelRenderer().ToSystem(this.jump_time, new SBar.DummySystemData(), activate_callback.bind(this));
		return true;
	},
	CheckEnteredAlpha2: function(race, newx, newy) {
		// Entered alpha space.
		// Need to put the ship at the edge of the bubble.
		// Just pick any bubble, if there's multiple it might get tricking. Ignoring that edge
		// case for now.
		let bubble = race.bubbles[0];
		let dx = bubble.x - newx;
		let dy = bubble.y - newy;
		let angle = Math.atan2(dy, dx);
		// Now place the ship.
		let distance = bubble.size - 0.1;  // Just inside the bubble.
		this.shipx = bubble.x - distance*Math.cos(angle);
		this.shipy = bubble.y - distance*Math.sin(angle);
		
		S$.savexy = [this.shipx, this.shipy];
		SU.saveGame(/*silent=*/true, SF.DREAM_RECURS_SAVE_NAME);  // Dream will recur back to here.
		
		let modified_items = [];
		for (let crew of S$.crew) {
			for (let arti of crew.artifacts) {
				let skill = new SBar.Skill(arti);
				for (let effect of skill.ability.effects) {
					if (effect.healing_effect) {
						modified_items.push(skill.name);
						break;
					}
				}
			}
		}
		let message = "You halt at the edge of the great wall, many parsecs in length. Its dark, dull sheen shifts and "
		  +"glows in great waves. As your ship approaches a window seems to open into the interior... if it can be called that. "
  		+"Inside swirls cloudy colors and darkness.\n\n";
	  if (modified_items.length > 0) {
	  	message += "And you notice some of your equipment is warm to the touch: \n  "+modified_items.join("\n  ")+"\n\n";
	  }
		let wmd_fragment_name = SU.WmdFragmentName();
		if (wmd_fragment_name == "") {
			message += "The color of the wall... the shapes... it all looks eerily familiar. You have a nagging feeling, like you forgot something.\n\n";
		} else {
			let mid_text = " mentions that the shell is made of the same material as itself, and"
			let player_level = S$.crew[0].base_level;
			if (player_level < 10) {
				message += wmd_fragment_name+mid_text+" warns that you're pathetically unprepared to enter that region.\n\n";
			} else if (player_level < 16) {
				message += wmd_fragment_name+mid_text+" says that you'll need its help to survive in there.\n\n";
			} else {
				message += wmd_fragment_name+mid_text+" says you'll probably be ok.\n\n";
			}
		}
		if (S$.conduct_data['need_elite']) {
			for (let obj in S$.xp_level) {
				let level = S$.xp_level[obj];
				if (level < SF.MAX_LEVEL) {
					message += "Yet you feel unworthy to enter.";
					SU.ShowWindow("Test of Character", message, undefined, 'X');
					return true;
				}
			}
		}
		message += "Enter?";
		SU.ConfirmWindow("Into the Dark", message, this.EnterAlphaConfirm.bind(this), '◉');		
		SU.MaybeShowChapter(3);
		return true;
	},
	
	// Check if exiting alpha space. Return true if travel should be interrupted.
	CheckExitedAlpha: function(race, newx, newy) {
		if (!S$.in_alpha_space) {
			return false;
		}
		if (race.seed === SF.RACE_SEED_ALPHA) {
			return false;
		}
		// Check if intercepted trying to exit. - obsolete, always intercept.
		//let intercept_exit = SU.r(12.12, S$.time+12.12) < 0.9;
		//if (!intercept_exit) {
			//this.DoExitAlpha();
			//return true;
			//}
		
		// Get the closest bubble.
		let best_diff = -1;
		let closest = null;
		let region = this.GetRegionIconAt(this.shipx, this.shipy);
		for (let race of region.data.allAlphas) {
			for (let bubble of race.bubbles) {
				let offx = Math.abs(this.shipx - bubble.x);
				let offy = Math.abs(this.shipy - bubble.y);
				let diff = offx*offx + offy*offy - bubble.size*bubble.size;
				if (best_diff === -1 || diff < best_diff) {
					closest = bubble;
					best_diff = diff;
				}
			}
		}
		let dx = closest.x - this.shipx;
		let dy = closest.y - this.shipy;
		let angle = Math.atan2(dy, dx);
		// Now place the ship.
		let distance = closest.size;  // At the edge.
		this.shipx = closest.x - distance*Math.cos(angle);
		this.shipy = closest.y - distance*Math.sin(angle);
		
		let callback = function(encounter_data) {
			/* Removed. Letting them flee.
			if (!encounter_data.won) {
				// Don't let the player leave alpha space.
				return;				
			}
			*/
			this.DoExitAlpha();
		}
		let racedata = {race:{seed: SF.RACE_SEED_ALPHA, level:Math.floor(SU.r(12.15, S$.time+12.16)*9)+10}};
		let message = "A great wall across space blocks your path. It wavers and warps as you approach. Colorful spheres appear around your ship, shifting colors and growing in number and size. The colors fade, and enemy ships remain in their place!";
		SE.HostileSpaceBattle(racedata, message, callback.bind(this));
		return true;
	},
	DoExitAlpha: function() {
		S$.in_alpha_space = false;
		S$.alpha_bubbles = [];
		S$.background_alpha_seed = null;
	  
		// Very similar to EncounterT.CheckHealParty.
		let has_healing = SU.HasHealingCrew();
		if (!has_healing) {
			return;
		}
		let any_healed = false;
		for (let crew of S$.crew) {
			if (crew.health < crew.max_health) {
				crew.health = crew.max_health;
				any_healed = true;
			}
		}
		if (any_healed) {
			SU.message("Crew healed")
		}		
	},
	
	// Marks objects in the area as found.
	AddSensorPoint: function(x, y, range, long_range_scan) {
		//S$.addKnownSensorPoint(x, y, range);
		let any_added = false;
		for (let obj of this.region_icons) {
			any_added |= obj.AddFoundArea(x, y, range*SF.STARMAP_ZOOM, long_range_scan);
			//this.region_icons[i].Reset();
		}
		if (any_added) {
			// Might need to rebuild the race area cache.
			this.RebuildRaceRegionCache();
		}
	},
	// Public.
	SensorScan: function(x, y, range) {
		this.AddSensorPoint(x, y, range, /*long_range_scan=*/true);
	},
	// Also called from IconMapStruct/wormhole.
	SetNewLocation: function() {
		delete this.current_system_tier;
		this.AddSensorPoint(this.shipx, this.shipy, this.SensorRange(S$.ship.sensor_level));
		// Cleaner to rebuild the starmap objects.
		this.teardown();
		this._initStarmapTier();
		this.activate(this.shipx, this.shipy, undefined, /*skip_teardown=*/true);
	},
	Search: function() {
		if (!SE.PassTime(36)) {
			return;
		}
		this.AddSensorPoint(this.shipx, this.shipy, this.SensorRange(S$.ship.sensor_level)*2);
		// Cleaner to rebuild the starmap objects.
		this.teardown();
		this._initStarmapTier();
		this.just_searched = true;
		this.activate(this.shipx, this.shipy);
		/* disabled in preference of time passing
		if (SU.r(0, S$.time+6.13) < 0.5) {
			SE.InterstellarEvent(this);
		}
		*/
	},
	Recenter: function() {
		this.mapcenterx = this.shipx;
		this.mapcentery = this.shipy;
		this.SetMouseXY();
    if (this.shipx < this.minx || this.shipy < this.miny || this.shipx > this.minx + SF.REGION_SIZE || this.shipy > this.miny + SF.REGION_SIZE) {
        this.updateRegions(this.shipx, this.shipy);
    }
    this.renderer.renderFullUpdate();
	},
	SetMouseXY: function() {
    this.cursorx = this.mapcenterx + SG.mx * SF.STARMAP_ZOOM;
    this.cursory = this.mapcentery + SG.my * SF.STARMAP_ZOOM;
	},
	MouseMove: function(x, y) {
    if (SG.misdown) {
				this.movemap(3*(SG.mdownx - x), 3*(SG.mdowny - y));
        SG.mdownx = x;
        SG.mdowny = y;
				this.dragged = true;
        return;
    }		
		this.SetMouseXY();
    this.renderer.renderMouseUpdate();
	},
  HandleClick: function(x, y) {
		if (!this.dragged) {
	    this.cursorx = this.mapcenterx + x * SF.STARMAP_ZOOM;
	    this.cursory = this.mapcentery + y * SF.STARMAP_ZOOM;
			this.visit();
		}
		this.dragged = false;
  },
	CheckForRefresh: function() {
//		if (this.skip_reset_on_pop) {
//			delete this.skip_reset_on_pop;
//			return;
//		}
		// Called after a pop, like battle.
		this.SetNewLocation();
	},
  teardown: function() {
    if (this.renderer !== null) {
      this.renderer.teardown();
      delete this.renderer;
    }
  },
	
};
SU.extend(SBar.StarmapTier, SBar.Tier);
})();
