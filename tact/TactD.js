/*
 * Tact Data, all details need to track a battlefield.
 * Note this was historically implemented as globals, so may still need some cleanup.
 */
(function() {
	
	//grep -inr "tg\." * | grep -v data | grep -v controller | grep -v icons | grep -v history | grep -v overlay
	
	SBar.TactData = function() {
		this._initTactData();
	};

	SBar.TactData.prototype = {
		type: SF.TYPE_TACT_DATA,
		map: null,
		mapEffects: null,
		heroes: null,  // object map based on name lookup. ***Means the heroes all need unique names***
		turn: null,
		turnEngine: null,
		ai: null,
		activeHero: null,
		tier: null,  // TactTier.
//		num_summons: 0,
		battle_won: false,
		battle_lost: false,
		battle_draw: false,
		
		_initTactData: function() {
		},
		
    activateTier: function() {
      var tier = new SBar.TactTier(this);
    },
		
		UniqueName: function(orig_name) {
			// This could use the race strings for something similar to the existing name. But
			// Tacking on the last char a lot is good enough, and has a fun feel.
			let new_name = orig_name;
			while (this.heroes[new_name]) {
				new_name = new_name + new_name[new_name.length-1];
			}
			return new_name;
		},
		/*
		FilterDeadHeroes: function() {
			let updated_heroes = {};
			for (let obj in this.heroes) {
				if (!this.heroes[obj].dead) {
					updated_heroes[obj] = this.heroes[obj];
				}
			}
			this.heroes = updated_heroes;
		},
		*/
		
	};
	
	SU.extend(SBar.TactData, SBar.Data);
})();
