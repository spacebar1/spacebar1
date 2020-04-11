// Handling for persistent effects, bonuses added to characters.
(function() {
	
	// Fields needed for a persistent effect:
	//   Name, seed, level

	// Applies an effect to a hero.
	SBar.PersistEffect = function(fields) {
		this._initPersistEffect(fields);
	};

	SBar.PersistEffect.prototype = {
		effect: null,
		name: null,
		seed: null,
		hero: null,
		_initPersistEffect: function(fields) {
			this.name = fields.name;
			this.seed = fields.seed;
			this.hero = fields.hero;
			if (fields.full_wmd) {
				this.effect = new JTact.EffectImmunityEffect(this.name, TF.FOREVER);
			} else {
				this.effect = this.BuildEffect(fields);
			}
		},
		BuildEffect: function(fields) {
			let name = fields.name;
			let level = fields.level;
			let seed = fields.seed;
			
			// As a rule of thumb, level 20 has major effect (+50% damage, double range, etc.), and scales down to 1.
			let num_effects = 9;
			let effect_type = Math.floor(SU.r(seed, 8.81)*num_effects);
			//effect_type = 7;
			switch (effect_type) {
				case 0:
				default:
					return new JTact.RangeEffect(name, 1+level/20, TF.FOREVER);
				case 1: 
					return new JTact.SpeedEffect(name, 1+level/20, TF.FOREVER);
				case 2: 
					return new JTact.DamageDealtEffect(name, 1+level/40, TF.FOREVER);
				case 3: 
					return new JTact.DamageReceivedEffect(name, 1-level/40, TF.FOREVER);
				case 4: 
					return new JTact.ModifyCDEffect(name, 1-level/40, TF.FOREVER);
				case 5: 
					return new JTact.ModifyAreaEffect(name, 1+level/20, TF.FOREVER);
				case 6: 
					return new JTact.ModifyDurationEffect(name, 1+level/20, TF.FOREVER);
				case 7:
					return new JTact.HealthChangeEffect(name, 2*level, TF.FOREVER);
				case 8:
					let amount = Math.floor(level/5) + 1;  // 1 - 5 (at level 20).
					return new JTact.ResistChangeEffect(name, amount, TF.FOREVER)
			  // 9 total. The total number matches num_effects above.
			}
		},
		Text() {
			return this.effect.getText();
		},
		Apply: function(hero) {
			// Deferred icon, in case caller just needs the Text().
			if (!TG.icons) {
				error("peffect noicons");
				return;
			}
			if (!TG.icons[this.name]) {
	      TG.icons[this.name] = TU.randIcon(this.seed, this.effect.symbol);
			}
			// Don't want to use the original in case they need to get managed independently.
			TU.cloneEffect(this.effect).apply(hero, hero); 
		},
	};

	SU.extend(SBar.PersistEffect, SBar.Data);
})();
