/*
 * Effect base class
 * 
 * Several general types will instantiate this, such as "DamageEffect" or "StunEffect"
 * Or this base class can be instantiated for highly customized effects
 */
(function() {

    JTact.Effect = function(displayNameIn) {
        this._initEffect(displayNameIn);
    };

    JTact.Effect.prototype = {
  			symbol: '?',  // Generic placeholder.
        displayName: null,
        //sourceName: null, // name of hero causing the effect. Storing name insteaf of full obj for efficient cloning. Can also be "GROUND", if ground is generating
        type: TF.EFFECT_GENERIC, // See JTact.Final for values
        overTime: false, // instant or persists for some time
        duration: 0, // only applies to overTime effects
        turns_left: null, // Number of turns left, for overTime effects.
        buff: false, // buff or debuff
        negated: false, // something may have prevented this effect while being applied. Note: negates entire ability.
        target: null, // Target hero that gets the effect, if it is persistent
        casted: true, // Effect was explicitly casted. True by default, would be false for stuff like DOTs and terrain effects and damage aura
				ai_target: null,  // Targeting for AI. AI_TARGET_PLAYER or AI_TARGET_COMP.
  			ai_rules: null,  // List of targeting rules.
        _initEffect: function(displayNameIn) {
					/*
            if (sourceIn === TF.GROUND_SOURCE || sourceIn === undefined) {
                this.sourceName = TF.GROUND_SOURCE;
            } else {
                this.sourceName = sourceIn.name;
            }
					*/
            this.displayName = displayNameIn;
        },
        // Any effect is being applied by this hero. Check if it is affected by any source hero mods.
        checkSourceImpact: function(newEffect) {
            // no-op by default
            // optionally override this if this effect is a hero mod
        },
        // Another effect is being applied to the hero. Check if this effect modifies that one at all
        checkImpact: function(newEffect) {
            // no-op by default
            // optionally override this if this effect is a hero mod
        },
        checkCleanup: function(heroObj) {
            // no-op by default
            // optionally override this if this effect is a hero mod
        },
        checkControlled: function(heroObj) {
            // no-op by default
            // optionally override this if this effect does something when the hero readies, like something controlling the hero or changing hero movement speed
					// Return true if the hero is controlled and doesn't get manual input.
					return false;
        },
        getText: function() {
            return "/override Effect.getText()";
        },
        //
        preapply: function(source, target) {
            // no-op by default
            // optionally override if this effect needs to be updated before it gets applied (to set damage based on target, for example)
        },
        // apply should only be called by the controller. Need to account for mods when applying the ability
        apply: function(source, target) {
            error("/override Effect.apply()");
        },
        updateAbility: function(ability) {
            // no-op by default
            // Optionally called after the effect is applied for any cleanup on the ability. For example, for variable recovery time based on the ability
        },
        // Called by implementers to stick a persistent mod on a hero
        // Dissolves any existing matching effect
        applyPersistentEffect: function(source, target) {
					/* See if it's better without this.
          // this type of persist effect negates any previously applied
          for (var obj in target.mods) {
            var mod = target.mods[obj];
            if (this.displayName === mod.displayName) {
              // this is a recast of an active dot, kill older one
              mod.negated = true;
              //TG.data.turnEngine.unqueueEffect(mod);
              mod.unapply();
              this.preapply(source, target); // might need to recalculate after the change
              TU.logMessage("Cast overrides old effect on " + target.name, ["react", this.displayName]);
            }
          }
					*/

          target.mods.push(this);
          this.target = target.name;
					if (this.duration && this.duration !== TF.FOREVER) {
            this.turns_left = this.duration
            //TG.data.turnEngine.queueEffectExpiry(target.name, this, this.duration);
					}
        },
        unapply: function() {
            // no-op by default
            // optionally do something when this over-time effect expires
        },
				/*
        // Generate a unique ID for this effect for replay lookup
        getReplayUID: function() {
            return "" + TG.data.turn + this.sourceName + this.displayName;
        },
				*/
        clone: function() {
            var ret = new JTact.Effect(/*TG.data.heroes[this.sourceName], */this.displayName);
						//Object.assign(ret, this)
						//let ret = Object.create(this);
            for (var obj in this) {
                ret[obj] = this[obj];
            }
            return ret;
        }
    };
})();

 
