/*
 * Building data object
 * Building has a type and faction. Faction determines if player is hostile and goes to temple
 * Corresponds to one temple, a separate data object
 */

(function() {

    SBar.BuildingData = function(parentDataIn, x, y, type, faction) {
        this._initBuildingData(parentDataIn, x, y, type, faction);
    };

    SBar.BuildingData.prototype = {
        seed: null,
        raceseed: null,
        parentData: null, // could be planet or asteroid belt data.
        x: null,
        y: null,
        type: null, // like SF.TYPE_BAR. Also see next is_building_data.
				is_building_data: true,
        faction: null, // like SF.FACTION_NORMAL
        name: null,
        justentered: false,
        tier: null,
        trade: null,
        level: null,
        _initBuildingData: function(parentDataIn, x, y, type, faction) {
					if (SF.ALL_BUILDINGS !== false) {
						type = SF.ALL_BUILDINGS;
					}
          this.parentData = parentDataIn;
          this.x = Math.floor(x);
          this.y = Math.floor(y);
          this.type = type;
					// See SF.ALL_BUILDINGS for building debug.
					//if (this.type != SF.TYPE_TEMPLE_BAR) {
						// Debug line.
            //this.type = SF.TYPE_JOB;
						//}
          this.faction = faction;
          //if (this.type === SF.TYPE_DERELICT) {
              //this.faction = SF.FACTION_ALPHA;
          //}
          this.seed = SU.r(this.parentData.seed, x * 1.78 + y * 2.89);
          this.raceseed = this.parentData.raceseed;
          //if (this.faction === SF.FACTION_ALPHA && this.type != SF.TYPE_TEMPLE_BAR) {
          //    this.raceseed = S$.game_seed;
          //}
          //this.faction = SF.FACTION_PIRATE;
          this.name = ST.buildingName(this.type, this.raceseed, this.seed);
					
					// Take level from parent unless there's an override.
          this.level = this.parentData.level;
					if (this.type === SF.TYPE_DERELICT || this.type === SF.TYPE_TEMPLE) {
						this.level = Math.floor(SU.r(this.seed, 3.12)*20)+1;  // 1-20.
            this.faction = SF.FACTION_ALPHA;
						this.raceseed = SF.RACE_SEED_ALPHA;
					}
					if (this.type === SF.TYPE_GOODY_HUT) {
						// Don't allow the player to exploit goody huts.
						this.level = Math.min(this.level, S$.crew[0].base_level);
					}
					if (S$.custom_building_levels[this.seed]) {
						this.level = S$.custom_building_levels[this.seed];
					}
        },
        pushBuildingTier: function(drunk) {
          this.justentered = true;
					if (this.type === SF.TYPE_INFORMATION) {
						// Special case, add the starport background.
						SU.PushTier(new SBar.PlanetsideRenderer(this.parentData, this.x, this.y));						
						this.tier = new SBar.InformationRenderer(this.parentData);
					} else if (this.type === SF.TYPE_OBELISK) {
						SU.PushTier(new SBar.PlanetsideRenderer(this.parentData, this.x, this.y));						
						this.tier = new SBar.ObeliskRenderer(this);
					} else {
	          this.tier = new SBar.BuildingTier(this);
					}
					SU.PushTier(this.tier);
        }
    };
    SU.extend(SBar.BuildingData, SBar.Data);
})();
