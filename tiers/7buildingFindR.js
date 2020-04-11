/*
 * Known Building Search interface.
 */
(function() {
	let select_color = "#AAF";
	
	let building_type_images = null;
	let faction_type_images = null;
	
	let MAX_BUILDING_INT = 29;  // See gameengine.js.
	
	// Enums.
	let FILTER_MAX_LEVEL = 1;
	let FILTER_MIN_LEVEL = 2;
	let FILTER_BUILDING_TYPE = 3;
	let FILTER_FACTION_TYPE = 4;
	let FILTER_ALPHA_BUBBLE = 5;

  SBar.BuildingFindRenderer = function(context) {
    this._initBuildingFindRenderer(context);
  };

  SBar.BuildingFindRenderer.prototype = {
    type: SF.TIER_BUILDINGFINDR,
		context: null,
		buildings: null,  // Building system list. Built for scanning.
		alpha_region_index: null,  // Region & alpha locations. For faster lookup if a system is covered by alpha.
		race_region_index: null,  // Region & race locations. For faster lookup of a race.
		shipx: null,
		shipy: null,
		max_known_level: null,
		sort_type: "distance",
		sort_forward: true,
		
		filter_min_level: null,
		filter_max_level: null,
		filter_building_types: null,
		filter_num_building_types: null,
		filter_faction: null,
		filter_in_alpha: false,
		
    _initBuildingFindRenderer: function(context) {
			this.context = context;
			this.ResetFilters();
		},

    activate: function() {
			SU.clearTextNoChar();
      SG.activeTier = this;
			SU.addText("R: Reset");
			SU.addText("X: Exit");
			if (SG.starmap) {
				this.shipx = SG.starmap.shipx;
				this.shipy = SG.starmap.shipy;
			} else {
				this.shipx = 0;
				this.shipy = 0;
				error("no starmap from BuildingFindR, using 0,0");
			}
			this.GenerateIndex();
			this.Redraw();
    },
		
		// Redraws the page. Also redraws buttons, since it may be the same layer.
		Redraw: function() {
      SB.clear();
			this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			this.AddButtonFilters();
			this.AddSortButtons();
			this.RunSearchAndPrint();
		},
		
		// Builds a lookup index of building systems.
		GenerateIndex: function() {
			this.buildings = [];
			this.alpha_region_index = {};
			this.race_region_index = {};
			for (let obj in S$.systemBuildingSet) {
				let set = S$.systemBuildingSet[obj];
				if (set.systemx) {
					// Found a system.
					this.AddSystem(obj, set);
				}
			}
		},
		
		// Returns true if {x, y} is in an alpha bubble.
		InAlphaSpace: function(x, y) {
      const regionx = SU.AlignByRegion(x);
      const regiony = SU.AlignByRegion(y);
			// Check adjacent regions that can overlap.
      for (var xind = -1; xind <= 1; xind++) {
        for (var yind = -1; yind <= 1; yind++) {
					let checkregionx = regionx + xind * SF.REGION_SIZE;
					let checkregiony = regiony + yind * SF.REGION_SIZE;
					const key = checkregionx+","+checkregiony;
					// Add caches if needed.
					if (!this.alpha_region_index[key]) {
						this.alpha_region_index[key] = SBar.RegionData.getAddAlphas(checkregionx, checkregiony);
					}
					// Check for overlapping regions.
					const region_alphas = this.alpha_region_index[key];
					for (const alpha of region_alphas) {
						for (const bubble of alpha.bubbles) {
							const xoff = bubble.x - x;
							const yoff = bubble.y - y;
							if (xoff * xoff + yoff * yoff < bubble.size * bubble.size) {
								return true;
							}
						}
					}
        }
      }
			return false;
		},
		
		LookupRace: function(x, y) {
      const regionx = SU.AlignByRegion(x);
      const regiony = SU.AlignByRegion(y);
			let highest_seed = -1;
			// Check adjacent regions that can overlap.
      for (var xind = -1; xind <= 1; xind++) {
        for (var yind = -1; yind <= 1; yind++) {
					let checkregionx = regionx + xind * SF.REGION_SIZE;
					let checkregiony = regiony + yind * SF.REGION_SIZE;
					const key = checkregionx+","+checkregiony;
					// Add caches if needed.
					if (!this.race_region_index[key]) {
						this.race_region_index[key] = SBar.RegionData.getRaces(checkregionx, checkregiony);
					}
					// Check for overlapping regions.
					const region_races = this.race_region_index[key];
					for (let race of region_races) {
						for (let bubble of race.bubbles) {
							let offx = bubble.x - x;
							let offy = bubble.y - y;
							if (offx * offx + offy * offy < bubble.size * bubble.size) {
								if (race.seed > highest_seed) {
									highest_seed = race.seed;
									break;
								}
							}
						}
					}
        }
      }
			return highest_seed;
		},
		
		// Adds a system to the index.
		// Also flags if the system is in alpha space.
		AddSystem: function(system_seed_str, building_data) {
			let x = building_data.systemx;
			let y = building_data.systemy;
			
			let dx = x - this.shipx;
			let dy = y - this.shipy;
			let distance = coordToParsec(Math.sqrt(dx * dx + dy * dy))
			
			const in_alpha = this.InAlphaSpace(x, y);			
			const race = this.LookupRace(x, y);
			let alignment = null;
			if (race && S$.IsRaceKnown(race) && S$.raceAlignment[race] !== undefined) {
				alignment = S$.raceAlignment[race];
			}
			if (in_alpha) {
				// Overload this field.
				alignment = "-";
			}
			for (let seed in building_data.seed_buildings) {
				for (let building of building_data.seed_buildings[seed]) {
					let level = building[2];
					this.buildings.push({system_name: building_data.name, system_seed: system_seed_str, alignment: alignment, visits: building_data.visits, distance: distance, x:x, y:y, type: building[0], faction: building[1], level: level, in_alpha: in_alpha});
					if (this.max_known_level === null || level > this.max_known_level) {
						this.max_known_level = level;
					}
				}
			}
		},
		
		ButtonClick: function() {
			let clicked_button = SB.GetButtonOver();
			if (!clicked_button) {
				return;
			}
			
			switch (clicked_button.find_type) {
				case FILTER_MIN_LEVEL: {
					const value = clicked_button.find_value;
					if (this.filter_min_level === value) {
						this.filter_min_level = null;
					} else {
						this.filter_min_level = value;
					}
					break;
				}
				case FILTER_MAX_LEVEL: {
					const value = clicked_button.find_value;
					if (this.filter_max_level === value) {
						this.filter_max_level = null;
					} else {
						this.filter_max_level = value;
					}
					break;
				}
				case FILTER_BUILDING_TYPE: {
					const type = clicked_button.find_value;
					if (this.filter_building_types[type]) {
						delete this.filter_building_types[type];
						this.filter_num_building_types--;
					} else {
						this.filter_building_types[type] = true;
						this.filter_num_building_types++;
					}
					break;
				}
				case FILTER_FACTION_TYPE: {
					const type = clicked_button.find_value;
					if (this.filter_faction === type) {
						this.filter_faction = null;
					} else {
						this.filter_faction = type;
					}
					break;
				}
				case FILTER_ALPHA_BUBBLE: {
					this.filter_in_alpha = !this.filter_in_alpha;
					break;
				}
				default:
					error("nocbft",clicked_button.find_type);
			}
			this.Redraw();
		},
		
		ChangeSort: function() {
			let clicked_button = SB.GetButtonOver();
			if (!clicked_button) {
				return;
			}
			if (this.sort_type === clicked_button.sort_type) {
				// Same button clicked again. Reverse sort order.
				this.sort_forward = !this.sort_forward;
			} else {
				this.sort_type = clicked_button.sort_type;
				this.sort_forward = true;
			}
			this.Redraw();
		},
		
		SortSystems: function(systems) {
			if (this.sort_type === "distance") {
				if (this.sort_forward) {
					systems = systems.sort(function(a, b) { return a[0].distance - b[0].distance; });
				} else {
					systems = systems.sort(function(a, b) { return b[0].distance - a[0].distance; });
				}
			} else if (this.sort_type === "name") {
				if (this.sort_forward) {
					systems = systems.sort(function(a, b) { return a[0].system_name.localeCompare(b[0].system_name); });
				} else {
					systems = systems.sort(function(a, b) { return b[0].system_name.localeCompare(a[0].system_name); });
				}
			} else if (this.sort_type === "level") {
				if (this.sort_forward) {
					systems = systems.sort(function(a, b) { return a[0].level - b[0].level; });
				} else {
					systems = systems.sort(function(a, b) { return b[0].level - a[0].level; });
				}
			} else if (this.sort_type === "visits") {
				// Visits go high-to-low by default, unlike the others.
				if (this.sort_forward) {
					systems = systems.sort(function(a, b) { return b[0].visits - a[0].visits; });
				} else {
					systems = systems.sort(function(a, b) { return a[0].visits - b[0].visits; });
				}
			} else if (this.sort_type === "%") {
				// Visits go high-to-low by default, unlike the others.
				// Need to handle the overloaded "-" alignment for alpha bubbles.
				if (this.sort_forward) {
					systems = systems.sort(function(a, b) {
						let aleft = a[0].alignment;
						if (aleft === "-") aleft = -1;
						let aright = b[0].alignment;
						if (aright === "-") aright = -1;
						return aright - aleft; 
					});
				} else {
					systems = systems.sort(function(a, b) {
						let aleft = a[0].alignment;
						if (aleft === "-") aleft = -1;
						let aright = b[0].alignment;
						if (aright === "-") aright = -1;
						return aleft - aright;
					});
				}
			} 
		},
				
		// Note the highlighting of the button is also implemented here.
		// This is to help reduce the number of layers (clearing on draw), and also
		// keeps the x/y positioning logic together.
		AddButtonFilters: function() {
			let y = 100;
			SU.text(this.context, "≥ Level", 130, y, SF.FONT_M, "#AAA","right");
			for (let i = 1; i <= SF.MAX_LEVEL && i <= this.max_known_level; i++) {
				let button = SB.add(i*40+110, y-15, SB.imgText(i, 11, 20), this.ButtonClick.bind(this));
				button.find_type = FILTER_MIN_LEVEL;
				button.find_value = i;
				if (this.filter_min_level === i) {
					SU.rect(this.context, i*40+110, y-14, 30, 20, select_color);
				}
			}
			y += 30;
			SU.text(this.context, "≤ Level", 130, y, SF.FONT_M, "#AAA","right");
			for (let i = 1; i <= SF.MAX_LEVEL && i <= this.max_known_level; i++) {
				let button = SB.add(i*40+110, y-15, SB.imgText(i, 11, 20), this.ButtonClick.bind(this));
				button.find_type = FILTER_MAX_LEVEL;
				button.find_value = i;
				if (this.filter_max_level === i) {
					SU.rect(this.context, i*40+110, y-14, 30, 20, select_color);
				}
			}
			y += 50;
			
			// Alpha bubble ate system.
			let abutton = SB.add(SF.WIDTH-107, y+21, SB.imgText("-", 14, 30), this.ButtonClick.bind(this));
			abutton.find_type = FILTER_ALPHA_BUBBLE;
			if (this.filter_in_alpha) {
				SU.rect(this.context, SF.WIDTH-107, y+23, 39, 21, select_color);
			}
			
			if (building_type_images === null) {
				building_type_images = {};
				for (let type = 0; type <= MAX_BUILDING_INT; type++) {
					let full_image = SBar.GetBuildingImage(type);
		      let img = document.createElement('canvas');
		      img.width = 25;
		      img.height = 25;
					let ctx = img.getContext('2d');
					ctx.drawImage(full_image, 0, 0, 25, 25);
					building_type_images[type] = img;
				}
				
				faction_type_images = {};
				for (let faction = SF.FACTION_NORMAL; faction <= SF.FACTION_ALPHA; faction++) {
					let full_image = SBar.GetFactionImage(faction);
		      let img = document.createElement('canvas');
		      img.width = 30;
		      img.height = 30;
					let ctx = img.getContext('2d');
					ctx.drawImage(full_image, 0, 0, 30, 30);
					faction_type_images[faction] = img;
				}
			}
			
			for (let type = 0; type <= MAX_BUILDING_INT; type++) {
				const wrap_num = 15;
				let image = building_type_images[type];
				let newy = y-15;
				let newx = type*40+100;
				if (type >= wrap_num) {
					newx = (type-wrap_num)*40+100;
					newy += 40;
				}
				let button = SB.add(newx, newy, image, this.ButtonClick.bind(this));
				button.find_type = FILTER_BUILDING_TYPE;
				button.find_value = type;
				if (this.filter_building_types[type]) {
					SU.rect(this.context, newx, newy, 35, 35, select_color);
				}
			}
			
			// Factions.
			let num_added = 0;
			for (let faction = SF.FACTION_NORMAL; faction <= SF.FACTION_ALPHA; faction++) {
				let image = faction_type_images[faction];
				let x = SF.WIDTH-270+num_added*50;
				let button = SB.add(x, y+11, image, this.ButtonClick.bind(this));
				button.find_type = FILTER_FACTION_TYPE;
				button.find_value = faction;
				if (this.filter_faction === faction) {
					SU.rect(this.context, x+1, y+11, 38, 38, select_color);
				}
				num_added++;
			}			
		},
		
		PassesFilters: function(building) {
			if (this.filter_min_level !== null && building.level < this.filter_min_level) {
				return false;
			}
			if (this.filter_max_level !== null && building.level > this.filter_max_level) {
				return false;
			}
			if (this.filter_num_building_types > 0 && !this.filter_building_types[building.type]) {
				return false;
			}
			if (this.filter_faction !== null && this.filter_faction !== building.faction) {
				return false;
			}
			if (this.filter_in_alpha && building.in_alpha) {
				return false;
			}
			return true;
		},
		
		RunSearchAndPrint: function() {
			// Format: this.buildings.push({system_seed: seed, distance: distance, x:x, y:y, type: building[0], faction: building[1], level: level, in_alpha: in_alpha});
			SU.DrawTopBanner(this.context, "Known Building Search", "🔍");
			
			let num_systems = 0;
			let systems = {};
			for (let building of this.buildings) {
				if (this.PassesFilters(building)) {
					if (!systems[building.system_seed]) {
						systems[building.system_seed] = [];
					}
					systems[building.system_seed].push(building);
					num_systems++;
				}
			}
			if (num_systems === 0) {
				SU.text(this.context, "No Results", SF.HALF_WIDTH, SF.HALF_HEIGHT, SF.FONT_XLB, "#AAA", 'center');
			} else {
				let system_list = [];
				for (let obj in systems) {
					system_list.push(systems[obj]);
				}
				this.SortSystems(system_list);
				this.PrintSystems(system_list);
			}
		},
		
		PrintSystems: function(systems) {
			let max = 10;
			for (let i = 0; i < systems.length && i < max; i++) {
				this.PrintSystem(systems[i], i);
			}
			if (systems.length > max) {
				SU.text(this.context, "+"+(systems.length-max), SF.HALF_WIDTH, SF.HEIGHT-32, SF.FONT_XLB, "#888", 'center');
			}
		},
		
		AddSortButtons: function() {
			let y = 280;
			let button = SB.add(40, y, SB.imgText("%", 14, 30), this.ChangeSort.bind(this));
			button.sort_type = "%";
			button = SB.add(100, y, SB.imgText("Name", 14, 135), this.ChangeSort.bind(this));
			button.sort_type = "name";
			button = SB.add(300, y, SB.imgText("Distance", 14, 135), this.ChangeSort.bind(this));
			button.sort_type = "distance";
			button = SB.add(460, y, SB.imgText("Level", 14, 50), this.ChangeSort.bind(this));
			button.sort_type = "level";
			button = SB.add(530, y, SB.imgText("Visits", 14, 50), this.ChangeSort.bind(this));
			button.sort_type = "visits";
		},		
		
		PrintSystem: function(system, line_num) {
			let y = 340 + line_num * 42;
			if (line_num%2 == 1) {
				SU.rect(this.context, 0, y-29, SF.WIDTH, 42, 'rgba(0,0,0,0.25)')
			}
			
			let building_types = {};
			let building_list = [];
			let min_level = 9999;
			let max_level = -1;
			for (let building of system) {
				if (!building_types[building.type]) {
					building_list.push({type: building.type, faction: building.faction});
					building_types[building.type] = true;
				}
				if (building.level > max_level) max_level = building.level;
				if (building.level < min_level) min_level = building.level;
			}
			let font = SF.FONT_L;
			let building = system[0];
			if (building.alignment !== null) {
				SU.text(this.context, building.alignment, 60, y, SF.FONT_L, "#FFA", 'center');
			}
			SU.text(this.context, building.system_name, 175, y, SF.FONT_LB, "#AAA", 'center');
			let place_text = roundPrecision(building.distance, 2)+"pc ["+
			            round10th(coordToParsec(building.x), 2)+", "+
									-round10th(coordToParsec(building.y), 2)+"]";
			SU.text(this.context, place_text, 375, y, font, "#AAF", 'center');
			SU.text(this.context, min_level, 495, y, font, "#FFF", 'center');
			SU.text(this.context, building.visits, 560, y, font, "#FAA", 'center');
			//if (min_level != max_level) {
			//	SU.text(this.context, max_level, 550, y, font, "#FFF");
			//}
			for (let i = 0; i < building_list.length; i++) {
				let x = 600+i*40;
				this.context.drawImage(building_type_images[building_list[i].type], x, y-21);
				this.context.drawImage(faction_type_images[building_list[i].faction], x-5, y-24);
			}
			
			
		},
		
		ResetFilters: function() {
			this.filter_min_level = null;
			this.filter_max_level = null;
			this.filter_building_types = {};
			this.filter_num_building_types = 0;
			this.filter_faction = null;
		},

    handleKey: function(key) {
			switch (key) {
				case SBar.Key.R:
	        this.ResetFilters();
					this.Redraw();
					return;
				case SBar.Key.X:
          this.teardown();
					return;
				default:
					return;
			}					
    },
		
    teardown: function() {
			SU.PopTier();
    },
  };
})();

 
