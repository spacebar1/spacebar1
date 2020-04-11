/*
  Stores the player position in the universe.
  Needs to be saveable and reloadable from save.
  Needs to have enough detail to load into any place (not including combat and menus).
  In general helper APIs should be used instead of direct fields, since the implementation may require extension or refactoring.
*/
(function() {
	SBar.Position = function() {
    this._initPosition();
  };

  SBar.Position.prototype = {
		type: SF.TYPE_POSITION,

		// Set for data objects location.
		interstellar_coords: null,
		in_system: false,
		planet_index: null,
		moon_index: null,
		belt_index: null,
		building_coords: null,  // Building {x,y} on the parent planet or belt.
		// Set for location and orientation in the 3D scene.
		three_coords: null, // {x, y, z} location.
		three_direction: null,  // {x, y, z} direction looking.
		
    _initPosition: function() {
			// Empty object with no fields.
			// Use an Init() method below.
		},
		
		SetFromParams: function(position_data) {
			for (obj in position_data) {
				this[obj] = position_data[obj];
			}			
		},
		
		SetFromBuilding: function(building_data) {
			this.building_coords = {x: building_data.x, y: building_data.y};
			this.AddPlanetPosition(building_data.parentData)
		},
		
		SetFromSurface: function(planet_data, x, y) {
			
		},

		SetFromPlanet: function(planet_data) {
			this.AddPlanetPosition(planet_data)
		},

		SetFromAsteroid: function(asteroid_data) {
			
		},

		SetFromSystem: function(system_data, x, y) {
			// Also need the x,y,z??
			this.AddSystemPosition(system_data);
		},

		SetFromInterstellar: function(x, y) {
			this.in_system = false;
			this.interstellar_coords = {x: x, y: y};
		},
		
		AddPlanetPosition: function(planet_data) {
			if (planet_data.is_moon) {
				this.moon_index = planet_data.index;
				planet_data = planet_data.parent_planet_data;
			}
			this.planet_index = planet_data.index;
			this.AddSystemPosition(planet_data.systemData);
		},

		AddSystemPosition: function(system_data) {
			this.in_system = true;
			this.interstellar_coords = {x: system_data.x, y: system_data.y};
		},
		
		DebugString() {
			return SU.S(this);
		}
		
		
  };
})();
