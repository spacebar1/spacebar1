/*
 * Ability base class
 * Instead of overriding these, heroes generally just customize this base class
 */
(function() {

    JTact.Ability = function(displayNameIn, effects, cooldown, target) {
        this._initAbility(displayNameIn, effects, cooldown, target);
    };

    JTact.Ability.prototype = {
			// Parameters.
      displayName: null,
      cooldownTime: 0, // Ability cooldown time in turns.
      effects: null,
      target: null, // null if non-targeting ability, or an instance of a Target object
      threat: 1, // default amount of threat generated by an ability
			level_cap: null,  // Highest level enemy that this ability can target.
			
			// Working vars.
        cooldown: 0,  // Turn when the ability becomes active again.			
        _initAbility: function(displayNameIn, effects, cooldown, target) {
					if (effects) {
						this.effects = effects;
					} else {
            this.effects = [];
					}
					if (cooldown) {
						this.cooldownTime = cooldown;
					}
					if (target) {
						this.target = target;
					}
          this.displayName = displayNameIn;
        },
        clone: function() {
            var ret = new JTact.Ability(this.displayName);
            for (var obj in this) {
                //if (this.hasOwnProperty(obj)) {
                    ret[obj] = this[obj];
                //}
            }
            delete ret.effects;
            ret.effects = [];
            for (var i = 0; i < this.effects.length; i++) {
                ret.effects.push(this.effects[i].clone());
            }
            return ret;
        },
				// Printable ability text.
				Print: function(friendly) {
					//var text = this.displayName + ".";
					let first_line = true;
					let text = "";
					for (let effect of this.effects) {
						if (first_line) {
							first_line = false;
						} else {
							text += '\n';
						}
						text += effect.symbol+": "+effect.getText();
					}
					let newline_spaces = "\n    ";
					if (this.level_cap != null) {
						text += newline_spaces+"["+SF.SYMBOL_LEVEL+this.level_cap+"] Max target resist: "+this.level_cap;
					}
					if (this.cooldownTime > 1) {
						if (TG.data && TG.data.turn !== null) {
							var cd = Math.max(0, this.cooldown - TG.data.turn);
							if (cd !== 0) {
								text += newline_spaces+"["+SF.SYMBOL_TIME+cd+"] Remaining Cooldown: " + cd;
							}
						}
						text += newline_spaces+"["+SF.SYMBOL_TIME+this.cooldownTime+"] Cooldown: " + this.cooldownTime;
					}
					/*
					if (this.energy > 0) {
						text += "\n  Cost: " + this.energy + " energy";
					}
					*/
					if (this.target && this.target.range) {
					  text += newline_spaces+"[R"+Math.floor(this.target.range)+"] Range: " + Math.floor(this.target.range);
				  }
					if (this.target && this.target.aoe) {
						text += newline_spaces+"[A"+this.target.aoe+"] Area: " + this.target.aoe;				
					}
					if (this.target && this.target.global) {
						text += newline_spaces+"[↔] Global Effect";
					}
					if (friendly || !TG.data || TG.data.turn === null && this.threat !== undefined && this.threat !== 0) {  // null if tact not running.
						text += newline_spaces+"[T"+this.threat+"] Threat: " + this.threat;
					}
					return text;				
				},
				SummaryText: function() {
					let text = "";
					for (let effect of this.effects) {
						text += effect.symbol;
						if (effect.damage) {
						  text += effect.damage;	
						}
					}
					if (this.level_cap != null) {
						text += " L"+this.level_cap;
					}					
					if (this.cooldownTime > 1) {
						text += " "+SF.SYMBOL_TIME+this.cooldownTime;
					}
					if (this.target && this.target.range) {
					  text += " R" + Math.floor(this.target.range);
				  }
					if (this.target && this.target.aoe) {
						text += " A" + this.target.aoe;				
					}
					return text;
				},
    };
})();

 
