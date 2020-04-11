/*
 * Artifact data object and convenience parameters.
 * Keep this just the data for easy cloning and object interaction.
 * (i.e., doesn't matter if the object is instantiated or not - keep it interchangeable)
 * So this isn't actually a class, it's just a utility and a defined structure here.
 * (which is better than a class, because it can be more easily serialized for storage)
 */
(function() {
	/*
			  // Core artifact attributes.
			params: undefined,  // Array, single or multiple of {seed, raceseed, type, level}.
	      // And optional 'for_ai'.
	      // And cargo should have 'cargo_type' (one of SF.CARGO_ORE, SF.CARGO_GOODS, SF.CARGO_CONTRABAND).
			installx: undefined,
			instally: undefined,
			rotation: undefined,
	    fused_points: undefined,  // Array of [x,y] points. This is easier than complex seed tracking.
	    fused_connectors:  // 
	    imprinted:  // Optional indicator that this eqiupment is tied to its owner.
	    cargo_type:  // Only for cargo. Should always be set for cargo.
			bypass_prereqs:  // Skip prereqs for this artifact.
  */	
  SBar.ArtifactData = function(seed, raceseed, level, type, /*optional*/for_ai) {
		let data = {};
		data.params = [];
		data.params.push({seed: seed, raceseed: raceseed, type: type, level: level});
		if (for_ai) {
			data.params[0].for_ai = for_ai;
		}
    return data;
  };
  SBar.CargoArtifactData = function(seed, raceseed, level, cargo_type) {
		let data = SBar.ArtifactData(seed, raceseed, level, SF.SKILL_CARGO);
		data.params[0].cargo_type = cargo_type;
		return data;
	}

})();





