/*
Ideas:
Take control of an animal (higher level).

Implemented effects:

Damage
Heal
Bleed (damage when moving)
CancelBuffs
CancelDebuffs
Confuse
Convert
DamageDot
DamageDealt (reduce + amplify)
DamageReceived (reduce + amplify)
DamageShield
Dash
Defend
Fear
FingerOfDeath
HealDot
HealthEcho  (reapplies health changes)
HealthChangeEffect
HealthRewind
HealthSwap
Immunity
Invisibility
Lifesteal
/Move
/PersistentDOT (ground effect)
Polymorph
Pull
Push
/Range (and ground effect)
ChangeCD
ModifyCD
Reincarnate
Revive
Rewind
Speed (slow and haste, including snare)
Range
SpellBlock
Stasis
Stun
Summon
Clone (extends Summon)
Teleport
ThreatTaunt
ThreatTauntDot
ThreatFade
TimeBomb
ResistChange
ResistLevel
Unsummon
ControlSummon
ModifyAreaEffect
ModifyDurationEffect
DamageImmunityEffect
EffectImmunityEffect

NO AI:
DashEffect
(DefendEffect)
(MoveEffect)
(PersistentDOT)
ChangeCDEffect
TeleportEffect
(All threat)

*/

// Damage effect comes first.
(function() {
	
	let seed = 0;

JTact.DamageEffect = function(displayNameIn, damageIn, damage_skew) {
  this._initDamageEffect(displayNameIn, damageIn, damage_skew);
};
JTact.DamageEffect.prototype = {
	symbol: '†',
	stat: SF.STAT_STR,
  damage: null,
	damage_skew: null, // From 0 to 1. 0 or undefined means no skew. 1 means it can go up to double.
  _initDamageEffect: function(displayNameIn, damageIn, damage_skew) {
    this._initEffect(displayNameIn);
    this.type = TF.EFFECT_DAMAGE;
    this.damage = damageIn;
		this.damage_skew = damage_skew;
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
		if (this.damage_skew) {
			var min = Math.round(this.damage * (1-this.damage_skew));
			var max = Math.round(this.damage * (1+this.damage_skew));
			if (min != max) {
				return min + '-' + max + ' damage';
			}
		}
    return this.damage + ' damage';
  },
  apply: function(source, target) {
		let damage = this.damage;
		if (this.damage_skew) {
			var multiplier = 1 + SU.r(TG.data.turn+this.damage, seed++)*this.damage_skew*2 - this.damage_skew;
			damage = Math.round(damage * multiplier);
		}
		if (source && source.friendly && S$.conduct_data['pacifist']) {
			SU.message(SF.CONDUCTS['pacifist'].title);
			return;
		}		
    target.health = Math.round(target.health - damage);
    TU.logMessage('Applied ' + damage + ' damage', [
      'react', this.displayName, target.name, TF.DAMAGE_PREFIX + damage
    ]);
		if (source.friendly) {
			S$.game_stats.crew_damage_dealt += damage;
		} else {
			S$.game_stats.crew_damage_taken += damage;
		}
		if (target.health <= 0) {
			target.handleUnconscious();
		}		
  }
};
TU.extend(JTact.DamageEffect, JTact.Effect);


JTact.HealEffect = function(displayNameIn, strengthIn, /*optional*/keep_alpha_heal) {
  this._initHealEffect(displayNameIn, strengthIn, keep_alpha_heal);
};
JTact.HealEffect.prototype = {
	symbol: '♥',
	stat: SF.STAT_WIS,
  strength: null,
	healing_effect: true,
  _initHealEffect: function(displayNameIn, strengthIn, keep_alpha_heal) {
    this._initEffect(displayNameIn);
    this.buff = true;
    this.strength = strengthIn;
		if (S$.in_alpha_space && !keep_alpha_heal) {
			this.strength = 0;
		}
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_50];
  },
  getText: function() {
    return this.strength + ' healing';
  },
  apply: function(source, target) {
		let orig = target.health;
    target.health = Math.round(target.health +this.strength);
    if (target.health > target.max_health) {
      target.health = target.max_health;
    }
		if (source.friendly) {
			S$.game_stats.crew_health_healed += target.health - orig;
		}
  }
};
TU.extend(JTact.HealEffect, JTact.Effect);




JTact.SummonEffect = function(displayNameIn, hero_template) {
  this._initSummonEffect(displayNameIn, hero_template);
};
JTact.SummonEffect.prototype = {
	symbol: '⁑',
	stat: SF.STAT_CHA,
  hero_template: null,
	text: null,
	summon_effect: null,
	persist_at_end: null,
  _initSummonEffect: function(displayNameIn, hero_template) {
    this._initEffect(displayNameIn);
    this.hero_template = hero_template;
		this.ai_target = SF.AI_TARGET_COMP;
		this.summon_effect = true;
		this.persist_at_end = true;		
  },
  getText: function() {
		if (!this.text) {
			this.text = 'Summons: <<\n'+new this.hero_template().Print()+">>";
		}
		return this.text;
  },
	// Common for use in CloneEffect and ReviveEffect as well.
  summonCommon: function(source, new_hero) {
		var places = TG.data.map.GetHeroPlaces(source.x, source.y);
		if (places.length == 0) {
			// no space to place something.
	    TU.logMessage("No space to summon");
			return;
		}
		if (source.friendly) {
			S$.game_stats.team_members_summoned++;
		}
		var place = places.pop();
		// This is borrowed from BattleBuilder.
		let xoff = 0;
		let yoff = 0;
		if (new_hero.size == 5) {
			xoff = Math.floor(SU.r(seed++, 0.1) * 3) - 1;
			yoff = Math.floor(SU.r(seed++, 0.2) * 3) - 1;
		} else if (new_hero.size == 3) {
			xoff = Math.floor(SU.r(seed++, 0.3) * 5) - 2;
			yoff = Math.floor(SU.r(seed++, 0.4) * 5) - 2;
		}
	  place.x += xoff;
		place.y += yoff;
		
		new_hero.summoned = true;
    new_hero.moveTo(place.x, place.y);
		new_hero.threatList = SU.Clone(source.threatList);
		new_hero.threatTarget = SU.Clone(source.threatTarget);
		new_hero.threatMax = source.threatMax;
		TG.data.heroes[new_hero.name] = new_hero;
		//new_hero.turn_order = SG.activeTier.hero_counter++;
	  TG.data.turnEngine.queueHero(new_hero, 1);
		SG.activeTier.renderer.AddHeroView(new_hero);
		return new_hero;
  },
	apply: function(source, target) {
		let new_hero = new this.hero_template(0, 0, source.friendly/*, " ("+(++TG.data.num_summons)+")"*/);
		new_hero.morale = Math.round(SU.r(new_hero.seed, 51.26)*20+40);
		this.summonCommon(source, new_hero);
		return new_hero;
	}
};
TU.extend(JTact.SummonEffect, JTact.Effect);



/*
* End common effects
*/

JTact.UnsummonEffect = function(displayNameIn) {
  this._initUnsummonEffect(displayNameIn);
};
JTact.UnsummonEffect.prototype = {
	symbol: '↻',
	stat: SF.STAT_CHA,
	_initUnsummonEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_CHECK_SUMMONED];
	},
  getText: function() {
    return 'Unsummons a target summoned in this battle';
  },
  apply: function(source, target) {
		if (target.summoned) {
			target.handleDeath();
		}
  },	
};
TU.extend(JTact.UnsummonEffect, JTact.Effect);


JTact.ControlSummonEffect = function(displayNameIn) {
  this._initControlSummonEffect(displayNameIn);
};
JTact.ControlSummonEffect.prototype = {
	symbol: '⬲',
	stat: SF.STAT_CHA,
	_initControlSummonEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_CHECK_SUMMONED];
	},
  getText: function() {
    return 'Convinces a target summoned this battle to join sides.';
  },
  apply: function(source, target) {
		if (target.summoned) {
			target.friendly = source.friendly;
			if (!target.friendly) {
				target.threatList = SU.Clone(source.threatList);
				target.threatTarget = SU.Clone(source.threatTarget);
				target.threatMax = source.threatMax;		
			}
		}
  },	
};
TU.extend(JTact.ControlSummonEffect, JTact.Effect);



JTact.BleedEffect = function(displayNameIn, damage, duration) {
  this._initBleedEffect(displayNameIn, damage, duration);
};
JTact.BleedEffect.prototype = {
	symbol: '☈',
	stat: SF.STAT_DEX,
  damage: null,
  duration: null,
  target: null,
  _initBleedEffect: function(displayNameIn, damage, duration) {
    this._initEffect(displayNameIn);
    this.type = TF.EFFECT_MOVEMENT_SLOW;
    this.damage = damage;
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    return 'Moving causes ' + this.damage + ' damage per step for '+this.duration+' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },	
  checkSourceImpact: function(newEffect) {
    if (newEffect.type === TF.EFFECT_NORMAL_MOVE) {
      var distance = newEffect.distance;
      var damage = Math.floor(this.damage * distance);
      var newEffect = new JTact.DamageEffect(this.displayName, damage);
      newEffect.casted = false;
      TG.controller.doEffect(newEffect, this.target, this.target);
    }
  }
};
TU.extend(JTact.BleedEffect, JTact.Effect);


JTact.CancelBuffsEffect = function(displayNameIn) {
  this._initCancelBuffsEffect(displayNameIn);
};
JTact.CancelBuffsEffect.prototype = {
	symbol: '❖',
	stat: SF.STAT_INT,
  _initCancelBuffsEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_CHECK_BUFFS];
  },
  getText: function() {
    return 'Cancels buffs';
  },
  apply: function(source, target) {
		for (let mod of target.mods) {
			if (mod.buff) {
				mod.unapply();
			}
		}
		target.mods = target.mods.filter(function(mod) {  // filter() needs true to keep it.
			return !mod.buff;
		});
  }
};
TU.extend(JTact.CancelBuffsEffect, JTact.Effect);


JTact.CancelDebuffsEffect = function(displayNameIn) {
  this._initCancelDebuffsEffect(displayNameIn);
};
JTact.CancelDebuffsEffect.prototype = {
	symbol: '✜',
	stat: SF.STAT_INT,
  _initCancelDebuffsEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_CHECK_DEBUFFS];
  },
  getText: function() {
    return 'Cancels debuffs';
  },
  apply: function(source, target) {
		for (let mod of target.mods) {
			if (!mod.buff) {
				mod.unapply();
			}
		}
		target.mods = target.mods.filter(function(mod) {  // filter() needs true to keep it.
			return mod.buff;
		});
  }
};
TU.extend(JTact.CancelDebuffsEffect, JTact.Effect);



JTact.CloneEffect = function(displayNameIn) {
  this._initCloneEffect(displayNameIn);
};
JTact.CloneEffect.prototype = {
	symbol: '⁑',
	stat: SF.STAT_CHA,
	clone_self_effect: null,
	persist_at_end: null,
  _initCloneEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.clone_self_effect = true;
		this.persist_at_end = true;
		this.ai_target = SF.AI_TARGET_COMP;		
  },
  getText: function() {
    return 'Creates a clone, more or less';
  },
  apply: function(source, target) {
		let new_hero = target.heroclone();
		if (source.friendly) {
			S$.game_stats.crew_clones++;
		}
		//new_hero.name += " ("+(++TG.data.num_summons)+")";
		//new_hero.UpdateIcon();
		this.summonCommon(source, new_hero);
		return new_hero;
  },
};
// Note custom extend.
TU.extend(JTact.CloneEffect, JTact.SummonEffect);  // Custom extend.




JTact.ConfuseEffect = function(displayNameIn, duration) {
  this._initConfuseEffect(displayNameIn, duration);
};
JTact.ConfuseEffect.prototype = {
	symbol: '�',
	stat: SF.STAT_INT,
	duration: null,
  _initConfuseEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn, duration);
		this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Confuses the target into attacking the nearest character for '+this.duration+" turns";
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
	checkControlled: function() {
		var nearest_hero = null;
		var nearest_distance = 99999;
		var affected = TG.data.heroes[this.target];
		for (var key in TG.data.heroes) {
			if (key != this.target) {
				var candidate = TG.data.heroes[key];
				var distance = TG.data.map.getHexDist(affected.x, affected.y, candidate.x, candidate.y);
				if (distance < nearest_distance) {
					nearest_distance = distance;
					nearest_hero = candidate;
				}
			}
		}
		if (nearest_hero == null || !TG.data.ai.AttackTarget(affected, nearest_hero, /*override_friendly=*/true)) {
			TG.controller.explicitCast(affected, affected, hero.defendAbility);
		}
		return true;	
	},
};
TU.extend(JTact.ConfuseEffect, JTact.Effect);


JTact.ConvertEffect = function(displayNameIn, duration) {
  this._initConvertEffect(displayNameIn, duration);
};
JTact.ConvertEffect.prototype = {
	symbol: '㊉',
	stat: SF.STAT_CHA,
	convert_effect: true,
	duration: null,
	targetName: null,
	persist_at_end: null,
  _initConvertEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn, duration);
		this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.persist_at_end = true;
  },
  getText: function() {
    return 'Convinces the target to join sides for '+this.duration+' turns. Persists if battle ends before expiration';
  },
  apply: function(source, target) {
		// Clear any existing conversion mods. Latest convert takes precedence.
		target.mods = target.mods.filter(function(mod) {  // filter() needs true to keep it.
			return !mod.convert_effect;
		});
		
    this.targetName = target.name;
    this.applyPersistentEffect(source, target);
		target.friendly = source.friendly;
		if (!target.friendly) {
			target.threatList = SU.Clone(source.threatList);
			target.threatTarget = SU.Clone(source.threatTarget);
			target.threatMax = source.threatMax;		
		}
		if (source.friendly) {
			S$.game_stats.enemies_converted++;
		}
  },
  unapply: function() {
    var target = TG.data.heroes[this.targetName];
		target.friendly = target.original_friendly;
  },
};
TU.extend(JTact.ConvertEffect, JTact.Effect);


JTact.DamageDotEffect = function(displayNameIn, damage, duration) {
  this._initDamageDotEffect(displayNameIn, damage, duration);
};

JTact.DamageDotEffect.prototype = {
	symbol: '†',
	stat: SF.STAT_STR,
  damage: null,
  duration: null,
  _initDamageDotEffect: function(displayNameIn, damage, duration) {
    this._initEffect(displayNameIn);
    this.damage = damage;
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    return this.damage + ' damage per turn for ' + this.duration + ' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    //TG.data.turnEngine.registerDotEffect(this, this.duration);
  },
  elapseTime: function() {
    if (this.negated) {
      return;
    }
    // When time elapses, apply it as a new non-persistent, non-casted effect
    var damage = round100th(this.damage);
    var newEffect = new JTact.DamageEffect(this.displayName, damage);
    newEffect.casted = false;
    TG.controller.doEffect(
        newEffect, this.target, this.target, true /*overtime*/);
  }
};
TU.extend(JTact.DamageDotEffect, JTact.Effect);


JTact.DamageDealtEffect = function(displayNameIn, amount, duration) {
  this._initDamageDealtEffect(displayNameIn, amount, duration);
};
JTact.DamageDealtEffect.prototype = {
	symbol: '▶',
	stat: SF.STAT_WIS,
  amount: null,
  _initDamageDealtEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
		if (amount > 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount < 1) {
	    text = '-' + Math.round((1-this.amount) * 100) + '% damage dealt';
		} else {
	    text = '+' + Math.round((this.amount-1) * 100) + '% damage dealt';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    for (ability of target.abilities) {
			for (effect of ability.effects) {
	      if (effect.damage !== null && Math.round(effect.damage * this.amount) > 0) {
	        effect.damage = Math.round(effect.damage * this.amount);
	      }
			}
    }
    this.targetName = target.name;
  },
  unapply: function() {
    var target = TG.data.heroes[this.targetName];
    for (ability of target.abilities) {
			for (effect of ability.effects) {
	      if (effect.damage !== null && effect.damage > 0) {
	        effect.damage = Math.round(effect.damage/this.amount);
	      }
			}
    }
  }
};
TU.extend(JTact.DamageDealtEffect, JTact.Effect);


JTact.DamageReceivedEffect = function(displayNameIn, amount, duration) {
  this._initDamageReceivedEffect(displayNameIn, amount, duration);
};
JTact.DamageReceivedEffect.prototype = {
	symbol: '◀',
	stat: SF.STAT_WIS,
  amount: null,
  _initDamageReceivedEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
		if (amount < 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount < 1) {
	    text = '-' + Math.round((1-this.amount) * 100) + '% damage taken';
		} else {
	    text = '+' + Math.round((this.amount-1) * 100) + '% damage taken';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    if (newEffect.type === TF.EFFECT_DAMAGE) {
      TU.logMessage(
          'Modified damage to ' + (this.amount * 100) + '%',
          ['react', this.displayName]);
      newEffect.damage *= this.amount;
    }
  }
};
TU.extend(JTact.DamageReceivedEffect, JTact.Effect);



JTact.DamageShieldEffect = function(displayNameIn, amount, duration) {
  this._initDamageShieldEffect(displayNameIn, amount, duration);
};
JTact.DamageShieldEffect.prototype = {
	symbol: 'Ø',
	stat: SF.STAT_WIS,
  strength: null,
  _initDamageShieldEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
    this.buff = true;
    this.amount = amount;
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_COMP;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    return 'Prevents ' + this.amount + ' damage within '+this.duration+' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    if (newEffect.type === TF.EFFECT_DAMAGE) {
			if (this.amount >= newEffect.damage) {
				this.amount -= newEffect.damage;
				newEffect.damage = 0;
	      TU.logMessage('Blocked all damage', ['react', this.displayName]);
	      newEffect.negated = true;
			} else {
	      TU.logMessage('Blocked '+this.amount+' damage', ['react', this.displayName]);
				newEffect.damage -= this.amount;
				this.amount = 0;
			}
			if (this.amount <= 0) {
				this.negated = true;
			}
		}
  },
};
TU.extend(JTact.DamageShieldEffect, JTact.Effect);


JTact.DashEffect = function(displayNameIn, distance) {
  this._initDashEffect(displayNameIn, distance);
};
JTact.DashEffect.prototype = {
	symbol: '⇒',
	stat: SF.STAT_DEX,
  _initDashEffect: function(displayNameIn, distance) {
    this._initEffect(displayNameIn);
    this.type = TF.EFFECT_NORMAL_MOVE;
		this.distance = distance;
  },
  getText: function() {
    return 'Sprint to a location within '+this.distance;
  },
  apply: function(source, target) {
    source.moveTo(target.x, target.y);
  },
};
TU.extend(JTact.DashEffect, JTact.Effect);


JTact.DefendEffect = function(displayNameIn, duration) {
  this._initDefendEffect(displayNameIn, duration);
};
JTact.DefendEffect.prototype = {
  _initDefendEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.duration = duration;
    this.buff = true;
    this.type = TF.EFFECT_DEFEND;
  },
  getText: function() {
    return '-30% damage taken';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    if (newEffect.type === TF.EFFECT_DAMAGE/* ||
        newEffect.type === TF.EFFECT_DAMAGE_MAGICAL*/) {
      TU.logMessage(
          'Defend reduced damage by 30%', ['react', this.displayName]);
      newEffect.damage = Math.round(newEffect.damage * 0.7);
    }
  }
};
TU.extend(JTact.DefendEffect, JTact.Effect);


JTact.FearEffect = function(displayNameIn, duration) {
  this._initFearEffect(displayNameIn, duration);
};
JTact.FearEffect.prototype = {
	symbol: '!',
	stat: SF.STAT_INT,
	duration: null,
  _initFearEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn, duration);
		this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    let text = 'Runs away';
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
	checkControlled: function() {
		var affected = TG.data.heroes[this.target];
		var away_from = TG.data.heroes[affected.threatTarget];
		if (!away_from) {
			// If it's a friendly, just pick first.
			for (var obj in TG.data.heroes) {
				away_from = TG.data.heroes[obj];
				break;
			}
		}
		// Make a utility of this?
		var distance = Math.round(TF.BASE_MOVE * affected.speed);
		var dx = affected.x - away_from.x;
		var dy = affected.y - away_from.y;
		var rad = Math.atan2(dy, dx); // In radians
		var start_distance = Math.sqrt(dx*dx + dy*dy);
		var steps = distance;
		var bestx = -1;
		var besty = -1;
		TG.data.map.updateBarrier(affected.x, affected.y, affected.size, /*present=*/false);
		for (var i = 1; i <= steps; i++) {
			var x = away_from.x + Math.round(Math.cos(rad)*distance*i/steps + Math.cos(rad)*start_distance);
			var y = away_from.y + Math.round(Math.sin(rad)*distance*i/steps + Math.sin(rad)*start_distance);
			if (TG.data.map.isValidStamp(x, y, affected.size)) {
				bestx = x;
				besty = y;
			} else {
				// Hit a barrier.
				break;
			}
		}
		TG.data.map.updateBarrier(affected.x, affected.y, affected.size, /*present=*/true);
		if (bestx < 0) {
			TG.controller.explicitCast(affected, affected, hero.defendAbility);
		} else {
			var moveAbility = affected.moveAbility;
			var moveTarg = {
				x: bestx,
				y: besty,
				name: "ground",
				ground: true
			};
			// Need to explicit cast to end the turn and update turn engine queue.
			TG.controller.explicitCast(affected, moveTarg, moveAbility);
		}
		return true;	
	},
};
TU.extend(JTact.FearEffect, JTact.Effect);



JTact.FingerOfDeathEffect = function(displayNameIn) {
  this._initFingerOfDeathEffect(displayNameIn);
};
JTact.FingerOfDeathEffect.prototype = {
	symbol: '☛',
	stat: SF.STAT_INT,
  _initFingerOfDeathEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Outright kills the target';
  },
  apply: function(source, target) {
		if (source.friendly && S$.conduct_data['pacifist']) {
			SU.message(SF.CONDUCTS['pacifist'].title);
			return;
		}
		target.health = 0;
		target.handleUnconscious();
  }
};
TU.extend(JTact.FingerOfDeathEffect, JTact.Effect);



JTact.HealDotEffect = function(displayNameIn, heal, duration, /*optional*/keep_alpha_heal) {
  this._initHealDotEffect(displayNameIn, heal, duration, keep_alpha_heal);
};
JTact.HealDotEffect.prototype = {
	symbol: '♥',
	stat: SF.STAT_WIS,
  heal: null,
  duration: null,
  healPerTurn: null,
	healing_effect: true,
	keep_alpha_heal: false,
  _initHealDotEffect: function(displayNameIn, heal, duration, keep_alpha_heal) {
    this._initEffect(displayNameIn);
    this.heal = heal;
		this.keep_alpha_heal = keep_alpha_heal;
		if (S$.in_alpha_space && !keep_alpha_heal) {
			this.heal = 0;
		}
    this.duration = duration;
    this.buff = true;
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [/*SF.AI_CHECK_EFFECT, */SF.AI_HEALTH_90];
  },
  getText: function() {
		let text = this.heal + ' healing per turn';
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    this.sourceName = source.name;		
		if (TG.data && TG.data.turnEngine) {  // May not have started yet.
	    //TG.data.turnEngine.registerDotEffect(this, this.duration);
		}
  },
  elapseTime: function() {
    if (this.negated) {
      return;
    }
    // When time elapses, apply it as a new non-persistent, non-casted effect
    var heal = round100th(this.heal);
    var newEffect = new JTact.HealEffect(this.displayName, heal, this.keep_alpha_heal);
    newEffect.casted = false;
    TG.controller.doEffect(
        newEffect, TG.data.heroes[this.sourceName], this.target,
        true /*overtime*/);
    TU.logMessage(
        'Healed ' + this.target + ' for ' + heal + ' health',
        ['react', this.displayName, this.target]);
  }
};
TU.extend(JTact.HealDotEffect, JTact.Effect);



JTact.HealthChangeEffect = function(displayNameIn, amount, duration) {
  this._initHealthChangeEffect(displayNameIn, amount, duration);
};
JTact.HealthChangeEffect.prototype = {
	symbol: '+',
	stat: SF.STAT_WIS,
  amount: null,
  duration: null,
  target: null,
	sourceName: null,
	targetName: null,
  _initHealthChangeEffect: function(displayNameIn, amount, duration) {
		if (amount < 0) this.symbol = '-';
    this._initEffect(displayNameIn);
    this.amount = Math.round(amount);
    this.duration = duration;
		if (amount > 0) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
		let text = "";
		if (this.amount < 0) {
			text = "-"+(-1*this.amount)+SF.SYMBOL_HEALTH;
		} else {
			text = "+"+this.amount+SF.SYMBOL_HEALTH;
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    target.max_health += this.amount;
		target.health += this.amount;
		if (target.health <= 0) {
			target.handleUnconscious();			
		}
    this.sourceName = source.name;
    this.targetName = target.name;
  },
  unapply: function() {
    let source = TG.data.heroes[this.sourceName];
    let target = TG.data.heroes[this.targetName];
    target.max_health -= this.amount;
		target.health -= this.amount;
		if (target.health <= 0) {
			//target.handleUnconscious();			
			target.health = 1;
		} else {
			target.death_ticks = 0;
		}
  }
};
TU.extend(JTact.HealthChangeEffect, JTact.Effect);



JTact.HealthEchoEffect = function(displayNameIn, turns_back) {
  this._initHealthEchoEffect(displayNameIn, turns_back);
};
JTact.HealthEchoEffect.prototype = {
	symbol: '〃',
	stat: SF.STAT_WIS,
  turns_back: null,
  _initHealthEchoEffect: function(displayNameIn, turns_back) {
    this._initEffect(displayNameIn);
		this.turns_back = turns_back;
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_HEALTH_50];
  },
  getText: function() {
    return 'Reapplies health changes over last ' + this.turns_back + ' turns';
  },
  apply: function(source, target) {
		var turn = TG.data.turn - this.turns_back;
		if (turn < 0) turn = 0;
		var snapshot = SG.activeTier.snapshots[turn];
		if (!snapshot) {
			error("can't get snapshot",turn);
			return;
		}
		var amount = Math.round(target.health - snapshot.heroes[target.name].health);
		if (amount < 0) {
	    var effect = new JTact.DamageEffect("HealthEchoDamage", -1*amount);
		  effect.casted = false;
		  TG.controller.doEffect(effect, source, target);
		} else {
	    var effect = new JTact.HealEffect("HealthEchoHeal", amount);
		  effect.casted = false;
		  TG.controller.doEffect(effect, source, target);
		}
  },
};
TU.extend(JTact.HealthEchoEffect, JTact.Effect);


JTact.HealthRewindEffect = function(displayNameIn, turns_back) {
  this._initHealthRewindEffect(displayNameIn, turns_back);
};
JTact.HealthRewindEffect.prototype = {
	symbol: '〃',
	stat: SF.STAT_WIS,
  turns_back: null,
  _initHealthRewindEffect: function(displayNameIn, turns_back) {
    this._initEffect(displayNameIn);
		this.turns_back = turns_back;
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_50];
  },
  getText: function() {
    return 'Resets health to ' + this.turns_back + ' turns ago';
  },
  apply: function(source, target) {
		var turn = TG.data.turn - this.turns_back;
		if (turn < 0) turn = 0;
		var snapshot = SG.activeTier.snapshots[turn];
		if (!snapshot || !snapshot.heroes[target.name] || !target) {
			error("can't get snapshot",turn);
			return;
		}
		target.health = snapshot.heroes[target.name].health;
  },
};
TU.extend(JTact.HealthRewindEffect, JTact.Effect);


JTact.HealthSwapEffect = function(displayNameIn) {
  this._initHealthSwapEffect(displayNameIn);
};

JTact.HealthSwapEffect.prototype = {
	symbol: '↔',
	stat: SF.STAT_WIS,
  _initHealthSwapEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_HEALTH_LESS];
  },
  getText: function() {
    return 'Swaps health with the target (up to maximum health)';
  },
  apply: function(source, target) {
		var temp = source.health;
		source.health = target.health;
		target.health = temp;
		if (source.health > source.max_health) {
			source.health = source.max_health;
		}
		if (target.health > target.max_health) {
			target.health = target.max_health;
		}
		if (target.health <= 0) {
			target.handleUnconscious();
		}		
		if (source.health <= 0) {
			source.handleUnconscious();
		}		
  },
};
TU.extend(JTact.HealthSwapEffect, JTact.Effect);


JTact.FullImmunityEffect = function(displayNameIn, duration) {
  this._initFullImmunityEffect(displayNameIn, duration);
};
JTact.FullImmunityEffect.prototype = {
	symbol: '⦿',
	stat: SF.STAT_WIS,
  _initFullImmunityEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.duration = duration;
    this.buff = true;		
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_90];
  },
  getText: function() {
		let text = 'Immunity from damage and effects';
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;		
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    // Negate everything.
    newEffect.negated = true;
    TU.logMessage('Immunity negated effect', ['react', this.displayName]);
  }
};
TU.extend(JTact.FullImmunityEffect, JTact.Effect);


JTact.DamageImmunityEffect = function(displayNameIn, duration) {
  this._initDamageImmunityEffect(displayNameIn, duration);
};
JTact.DamageImmunityEffect.prototype = {
	symbol: '⦿',
	stat: SF.STAT_WIS,
  _initDamageImmunityEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.duration = duration;
    this.buff = true;		
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_90];
  },
  getText: function() {
		let text = 'Immunity from damage';
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;		
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    // Negate damage.
		if (newEffect.damage > 0) {
	    newEffect.negated = true;
	    TU.logMessage('Immunity negated effect', ['react', this.displayName]);
		}
  }
};
TU.extend(JTact.DamageImmunityEffect, JTact.Effect);


JTact.EffectImmunityEffect = function(displayNameIn, duration) {
  this._initEffectImmunityEffect(displayNameIn, duration);
};
JTact.EffectImmunityEffect.prototype = {
	symbol: '⦿',
	stat: SF.STAT_WIS,
  _initEffectImmunityEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.duration = duration;
    this.buff = true;		
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_90];
  },
  getText: function() {
		let text = 'Immunity from effects';
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;		
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    // Negate all but damage.
		if (!newEffect.damage) {
	    newEffect.negated = true;
	    TU.logMessage('Immunity negated effect', ['react', this.displayName]);
		}
  }
};
TU.extend(JTact.EffectImmunityEffect, JTact.Effect);



JTact.LifestealEffect = function(displayNameIn, damageIn, skew) {
  this._initLifestealEffect(displayNameIn, damageIn, skew);
};
JTact.LifestealEffect.prototype = {
	symbol: '‡',
	// Note extends damage.
  _initLifestealEffect: function(displayNameIn, damageIn, skew) {
		this._initDamageEffect(displayNameIn, damageIn, skew);
		this.ai_target = SF.AI_TARGET_PLAYER;
	},
	// Copied from DamageEffect.
  getText: function() {
		if (this.damage_skew) {
			var min = Math.round(this.damage * (1-this.damage_skew));
			var max = Math.round(this.damage * (1+this.damage_skew));
			if (min != max) {
				return min + '-' + max + ' lifesteal';
			}
		}
    return this.damage + ' lifesteal';
  },
  apply: function(source, target) {
		let damage = Math.round(this.damage);
		if (this.damage_skew) {
			var multiplier = 1 + SU.r(TG.data.turn+this.damage, seed++)*this.damage_skew*2 - this.damage_skew;
			damage = Math.round(damage * multiplier);
		}
    target.health = target.health - damage;
		source.health += damage;
		if (source.health > source.max_health) {
			source.health = source.max_health;
		}
		if (target.health <= 0) {
			target.handleUnconscious();
		}		
    TU.logMessage('Stole ' + damage + ' life', [
      'react', this.displayName, target.name, TF.DAMAGE_PREFIX + damage
    ]);
  }
};
TU.extend(JTact.LifestealEffect, JTact.DamageEffect);  // Note extends damage.


JTact.MoveEffect = function(displayNameIn) {
  this._initMoveEffect(displayNameIn);
};
JTact.MoveEffect.prototype = {
  cooldownTime: 1,
	distance: null,
  _initMoveEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
    this.type = TF.EFFECT_NORMAL_MOVE;
  },
  getText: function() {
    return 'Moves the target';
  },
  preapply: function(source, target) {
		this.distance = TG.data.map.getHexDist(source.x, source.y, target.x, target.y); // Used for BleedEffect.
  },
  apply: function(source, target) {
    // var moveDist = TG.data.map.getTargetDist(target.x, target.y);
    source.moveTo(target.x, target.y);
  },
  updateAbility: function(ability) {
    ability.cooldownTime = this.cooldownTime;
  }
};
TU.extend(JTact.MoveEffect, JTact.Effect);


// Ground effect.
JTact.PersistentDOT = function(displayNameIn, triggerName, damagePerTurn) {
  this._initPersistentDOT(displayNameIn, triggerName, damagePerTurn);
};
JTact.PersistentDOT.prototype = {
	symbol: '',
	stat: SF.STAT_DMG,
  duration: null,
  damagePerTurn: null,
  _initPersistentDOT: function(displayNameIn, triggerName, damagePerTurn) {
    this._initEffect(displayNameIn);
    this.duration = TF.FOREVER;
    this.damagePerTurn = damagePerTurn;
    this.triggerName = triggerName;
  },
  getText: function() {
    return this.damagePerTurn + ' damage per turn';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    //TG.data.turnEngine.registerDotEffect(this, this.duration);
  },
  elapseTime: function() {
    if (this.negated) {
      return;
    }
    // When time elapses, apply it as a new non-persistent, non-casted effect
    var damage = round100th(this.damagePerTurn);
    var newEffect = new JTact.DamageEffect(this.displayName, damage);
    newEffect.casted = false;
    TG.controller.doEffect(
        newEffect, this.target, this.target, true /*overtime*/);
  }
};
TU.extend(JTact.PersistentDOT, JTact.Effect);



JTact.PolymorphEffect = function(displayNameIn, hero_template, duration, is_buff) {
  this._initPolymorphEffect(displayNameIn, hero_template, duration, is_buff);
};
JTact.PolymorphEffect.prototype = {
	symbol: '⁂',
	stat: SF.STAT_CHA,
  hero_template: null,
	duration: null,
	text: null,
	polymorph_effect: true,
	targetName: null,
  _initPolymorphEffect: function(displayNameIn, hero_template, duration, is_buff) {
    this.duration = duration;
    this._initEffect(displayNameIn);
    this.hero_template = hero_template;
    this.buff = is_buff;
		if (is_buff) {
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
  },
  getText: function() {
		if (!this.text) {
			this.text = 'For '+this.duration+' turns changes the target into a: <<\n'+new this.hero_template().Print(/*for_poly=*/true)+">>";
		}
		return this.text;
  },
	apply: function(source, target) {
		// Clear any existing polymorph mods.
		// Need to unapply to reset the stored details.
		target.mods = target.mods.filter(function(mod) {  // filter() needs true to keep it.
			if (mod.polymorph_effect) {
				mod.unapply();
			}
			return !mod.polymorph_effect;
		});
		
		this.original_hero = target.heroclone();
		
		target.original_abilities = target.abilities;
		let temp_hero = new this.hero_template(0, 0, source.friendly/*, " ("+(++TG.data.num_summons)+")"*/);
		target.abilities = temp_hero.abilities;
		
		target.delta_level = temp_hero.level - target.level;
		target.delta_max_health = temp_hero.max_health - target.max_health;
		target.delta_speed = temp_hero.speed - target.speed;
		
		let health_fraction = target.health / target.max_health;
		target.speed += target.delta_speed;
		target.max_health += target.delta_max_health;
		target.level += target.delta_level;
		target.health = Math.round(target.max_health * health_fraction);
		
		/*
		
		target.original_level = target.level;
		//target.mods = [];
		target.level = temp_hero.level;
		let health_fraction = target.health / target.max_health;
		target.original_max_health = target.max_health;
		target.original_health = target.health;
		target.max_health = temp_hero.max_health;
		target.health = Math.round(target.max_health * health_fraction);
		target.original_speed = target.speed;
		target.speed = temp_hero.speed;
		*/
    this.applyPersistentEffect(source, target);
	  this.targetName = target.name;
	},
	unapply: function() {
	  var target = TG.data.heroes[this.targetName];
		if (target.dead) {
			return;
		}
		target.abilities = target.original_abilities;
		let health_fraction = target.health / target.max_health;
		target.speed -= target.delta_speed;
		target.max_health -= target.delta_max_health;
		target.level -= target.delta_level;
		target.health = Math.round(target.max_health * health_fraction);
		
		delete target.delta_speed;
		delete target.delta_max_health;
		delete target.delta_level;
		delete target.original_abilities;
		/*
		target.level = target.original_level;
		let health_fraction = target.health / target.max_health;
		target.max_health = target.original_max_health;
		target.health = Math.round(target.max_health * health_fraction);
		target.speed = target.original_speed;
		delete target.original_health;
		delete target.original_max_health;
		delete target.original_abilities;
		delete target.original_level;
		delete target.original_speed;
		delete target.original_mods;
		*/
	},
};
TU.extend(JTact.PolymorphEffect, JTact.Effect);



JTact.PullEffect = function(displayNameIn) {
  this._initPullEffect(displayNameIn);
};
JTact.PullEffect.prototype = {
	symbol: '¶',
	stat: SF.STAT_DEX,
  _initPullEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Pulls enemies close';
  },
  apply: function(source, target) {
		if (source == target) {
			return;
		}
		var dx = target.x - source.x;
		var dy = target.y - source.y;
		var rad = Math.atan2(dy, dx); // In radians
		var distance = Math.sqrt(dx*dx + dy*dy);
		var steps = distance;
		var bestx = -1;
		var besty = -1;
		TG.data.map.updateBarrier(target.x, target.y, target.size, /*present=*/false);
		for (var i = steps; i > 0; i--) {
			var x = source.x + Math.round(Math.cos(rad)*distance*i/steps);
			var y = source.y + Math.round(Math.sin(rad)*distance*i/steps);
			if (TG.data.map.isValidStamp(x, y, target.size)) {
				bestx = x;
				besty = y;
			} else {
				// Hit a barrier.
				break;
			}
		}
		TG.data.map.updateBarrier(target.x, target.y, target.size, /*present=*/true);
		if (bestx >= 0) {
	    target.moveTo(bestx, besty);
		}
  }
};
TU.extend(JTact.PullEffect, JTact.Effect);


JTact.PushEffect = function(displayNameIn, distance) {
  this._initPushEffect(displayNameIn, distance);
};
JTact.PushEffect.prototype = {
	symbol: 'P',
	stat: SF.STAT_DEX,
  distance: null,
  _initPushEffect: function(displayNameIn, distance) {
    this._initEffect(displayNameIn);
    this.distance = distance;
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Pushes enemies away up to distance '+this.distance;
  },
  apply: function(source, target) {
		if (source == target) {
			return;
		}
		var dx = target.x - source.x;
		var dy = target.y - source.y;
		var rad = Math.atan2(dy, dx); // In radians
		var start_distance = Math.sqrt(dx*dx + dy*dy);
		var steps = this.distance;
		var bestx = -1;
		var besty = -1;
		TG.data.map.updateBarrier(target.x, target.y, target.size, /*present=*/false);
		for (var i = 1; i <= steps; i++) {
			var x = source.x + Math.round(Math.cos(rad)*this.distance*i/steps + Math.cos(rad)*start_distance);
			var y = source.y + Math.round(Math.sin(rad)*this.distance*i/steps + Math.sin(rad)*start_distance);
			if (TG.data.map.isValidStamp(x, y, target.size)) {
				bestx = x;
				besty = y;
			} else {
				// Hit a barrier.
				break;
			}
		}
		TG.data.map.updateBarrier(target.x, target.y, target.size, /*present=*/true);
		if (bestx >= 0) {
	    target.moveTo(bestx, besty);
		}
  }
};
TU.extend(JTact.PushEffect, JTact.Effect);


JTact.RangeEffect = function(displayNameIn, amount, duration) {
  this._initRangeEffect(displayNameIn, amount, duration);
};
JTact.RangeEffect.prototype = {
	symbol: '↗',
	stat: SF.STAT_DEX,
  amount: null,
  duration: null,
	change_amounts: null,
  _initRangeEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
    this.amount = amount;
		if (amount > 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount > 1) {
	    text = '+' + Math.round((this.amount-1) * 100) + '% range';
		} else {
	    text = '-' + Math.round((1-this.amount) * 100) + '% range';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
		this.change_amounts = [];
    for (var i = 0; i < target.abilities.length; i++) {
      var ability = target.abilities[i];
      if (ability.target !== null) {
				let orig = ability.target.range;
				ability.target.range = Math.round(ability.target.range*this.amount);
				if (ability.target.range < 1) {
					ability.target.range = 1;
				}
				this.change_amounts[i] = ability.target.range - orig;
      }
    }
    this.targetName = target.name;
  },
  unapply: function() {
    var target = TG.data.heroes[this.targetName];
    for (var i = 0; i < target.abilities.length; i++) {
      var ability = target.abilities[i];
      if (ability.target !== null && this.change_amounts[i]) {
				ability.target.range -= this.change_amounts[i];
        //ability.target.range /= this.amount;
				//ability.target.range = Math.round(ability.target.range);
      }
    }
  }
};
TU.extend(JTact.RangeEffect, JTact.Effect);


JTact.ChangeCDEffect = function(displayNameIn, reduction, is_buff) {
  this._initChangeCDEffect(displayNameIn, reduction, is_buff);
};
JTact.ChangeCDEffect.prototype = {
	symbol: '⧗',
	stat: SF.STAT_DEX,
  reduction: null,
  _initChangeCDEffect: function(displayNameIn, reduction, is_buff) {
    this._initEffect(displayNameIn);
    this.reduction = reduction;
		this.buff = is_buff;
  },
  getText: function() {
		if (this.buff) {
			//	    return '-' + this.reduction + " cooldowns";
			return "Lowers current cooldowns by "+this.reduction;
		} else {
			//	    return '+' + this.reduction + " cooldowns";
			return "Raises current cooldowns by "+this.reduction;
		}
  },
  apply: function(source, target) {
    for (var i = 0; i < target.abilities.length; i++) {
      var ability = target.abilities[i];
			// Leave skills with no practical cooldown.
      if (ability.cooldownTime > 1) {
				if (this.buff) {
		        ability.cooldown -= this.reduction;
				} else {
	        ability.cooldown += this.reduction;
				}
			}
    }
  }
};
TU.extend(JTact.ChangeCDEffect, JTact.Effect);


JTact.ModifyCDEffect = function(displayNameIn, amount, duration) {
  this._initModifyCDEffect(displayNameIn, amount, duration);
};
JTact.ModifyCDEffect.prototype = {
	symbol: '⧗',
	stat: SF.STAT_DEX,
  amount: null,
	modified: false,
  _initModifyCDEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
		if (amount < 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount < 1) {
	    text = '-' + Math.round((1-this.amount) * 100) + '% cooldowns';
		} else {
	    text = '+' + Math.round((this.amount-1) * 100) + '% cooldowns';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    for (ability of target.abilities) {
			if (ability.cooldownTime > 0 && Math.round(ability.cooldownTime*this.amount) > 0) {
				this.modified = true;
				ability.cooldownTime = Math.round(ability.cooldownTime*this.amount);
			}
    }
    this.targetName = target.name;
  },
  unapply: function() {
		if (!this.modified) {
			return;
		}
    var target = TG.data.heroes[this.targetName];
    for (ability of target.abilities) {
			ability.cooldownTime = Math.round(ability.cooldownTime/this.amount);
    }
  }
};
TU.extend(JTact.ModifyCDEffect, JTact.Effect);


JTact.ModifyAreaEffect = function(displayNameIn, amount, duration) {
  this._initModifyAreaEffect(displayNameIn, amount, duration);
};
JTact.ModifyAreaEffect.prototype = {
	symbol: '◍',
	stat: SF.STAT_DEX,
  amount: null,
	modified: false,
  _initModifyAreaEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
		if (amount > 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount < 1) {
	    text = '-' + Math.round((1-this.amount) * 100) + '% ability area of effect';
		} else {
	    text = '+' + Math.round((this.amount-1) * 100) + '% ability area of effect';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    for (ability of target.abilities) {
			if (ability.target && ability.target.aoe && Math.round(ability.target.aoe*this.amount) > 0) {
				this.modified = true;
				ability.target.aoe = Math.round(ability.target.aoe*this.amount);
			}
    }
    this.targetName = target.name;
  },
  unapply: function() {
		if (!this.modified) {
			return;
		}
    var target = TG.data.heroes[this.targetName];
    for (ability of target.abilities) {
			if (ability.target && ability.target.aoe) {
				ability.target.aoe = Math.round(ability.target.aoe/this.amount);
			}
    }
  }
};
TU.extend(JTact.ModifyAreaEffect, JTact.Effect);



JTact.ModifyDurationEffect = function(displayNameIn, amount, duration) {
  this._initModifyDurationEffect(displayNameIn, amount, duration);
};
JTact.ModifyDurationEffect.prototype = {
	symbol: '⧗',
	stat: SF.STAT_DEX,
  amount: null,
	modified: false,
  _initModifyDurationEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
		if (amount > 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		let text = "";
		if (this.amount < 1) {
	    text = '-' + Math.round((1-this.amount) * 100) + '% ability durations';
		} else {
	    text = '+' + Math.round((this.amount-1) * 100) + '% ability durations';
		}
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    for (ability of target.abilities) {
			for (effect of ability.effects) {
	      if (effect.duration && Math.round(effect.duration * this.amount) > 0) {
	        effect.duration = Math.round(effect.duration * this.amount);
					this.modified = true;
	      }
			}
    }
    this.targetName = target.name;
  },
  unapply: function() {
		if (!this.modified) {
			return;
		}
    var target = TG.data.heroes[this.targetName];
    for (ability of target.abilities) {
			for (effect of ability.effects) {
				if (effect.duration) {
					effect.duration = Math.round(effect.duration / this.amount);
				}
			}
    }
  }
};
TU.extend(JTact.ModifyDurationEffect, JTact.Effect);



JTact.ReincarnateEffect = function(displayNameIn, duration) {
  this._initReincarnateEffect(displayNameIn, duration);
};
JTact.ReincarnateEffect.prototype = {
	symbol: '&',
	stat: SF.STAT_WIS,
  duration: null,
  _initReincarnateEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.buff = true;
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_50/*, SF.AI_CHECK_EFFECT*/];
  },
  getText: function() {
    return 'Revives target at full health if killed within ' + this.duration +
        ' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkCleanup: function() {
		var target = TG.data.heroes[this.target]
    if (target.health <= 0) {
      target.health = target.max_health;
      this.negated = true;
      TU.logMessage(
          'Reincarnate effect revived target', ['react', this.displayName]);
    }
  }
};
TU.extend(JTact.ReincarnateEffect, JTact.Effect);


JTact.ReviveEffect = function(displayNameIn) {
  this._initReviveEffect(displayNameIn);
};
JTact.ReviveEffect.prototype = {
	symbol: '↟',
	stat: SF.STAT_WIS,
  _initReviveEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_COMP;
		this.ai_rules = [SF.AI_HEALTH_0];
  },
  getText: function() {
    return 'Revives the target at 50% health.';
  },
  apply: function(source, target) {
		if (target.health <= 0) {
			target.health = Math.round(target.max_health/2);
			target.death_ticks = 0;
		}
  },
};
// Note custom extend.
TU.extend(JTact.ReviveEffect, JTact.Effect);  // Custom extend.



JTact.RewindEffect = function(displayNameIn, turns) {
  this._initRewindEffect(displayNameIn, turns);
};
JTact.RewindEffect.prototype = {
	symbol: '⇤',
	stat: SF.STAT_WIS,
  turnsBack: null,
  _initRewindEffect: function(displayNameIn, turns) {
    this._initEffect(displayNameIn);
    this.turnsBack = turns;
		this.ai_target = SF.AI_TARGET_PLAYER;
		this.ai_rules = [SF.AI_HEALTH_50];
  },
  getText: function() {
    return 'Restores time to ' + this.turnsBack + ' turns ago';
  },
  apply: function(source, target) {
    TG.controller.applyTime(Math.max(TG.data.turn - this.turnsBack, 0), this.displayName);
  }
};
TU.extend(JTact.RewindEffect, JTact.Effect);


JTact.OmegaFragmentEffect = function(displayNameIn) {
  this._initOmegaFragmentEffect(displayNameIn);
};
JTact.OmegaFragmentEffect.prototype = {
	symbol: 'ω',
	omega_fragment_effect: true,
  _initOmegaFragmentEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
    this.turnsBack = 2;
  },
  getText: function() {
    //return 'A mysterious device. Maybe it rearranges matter. Maybe it obliterates everything.';
		//return 'Always talking. Never answering.';
		return 'Strange talking debris. Maybe it tries to talk the enemy to death.';
  },
	// Note this uses preapply rather than apply, because an enemy can resist the apply.
  preapply: function(source, target) {
		let target_has_wmd = false;
    for (ability of target.abilities) {
			for (effect of ability.effects) {
				if (effect.full_wmd_effect) {
					target_has_wmd = true;
				}
			}
    }
		if (target_has_wmd) {
			TG.controller.wmd_full_fragment_activated = true;
			TG.wmd_message = "WMD/> RESET \"*\",8,1";
		} else if (S$.in_alpha_space && !S$.conduct_data['no_dream']) {
			TG.controller.wmd_recur_fragment_activated = true;
		} else {
			TG.controller.wmd_fragment_turn_back_clock = {time: Math.max(TG.data.turn - this.turnsBack, 0), name: this.displayName};
		}
  },
  apply: function(source, target) {
	}
};
TU.extend(JTact.OmegaFragmentEffect, JTact.Effect);


// WMD.
JTact.OmegaFullEffect = function(displayNameIn) {
  this._initOmegaFullEffect(displayNameIn);
};
JTact.OmegaFullEffect.prototype = {
	symbol: 'Ω',
	stat: null,  // Wipe out for the extend.
	full_wmd_effect: true,
  _initOmegaFullEffect: function(displayNameIn) {
    this._initEffect(displayNameIn);
		this.ai_target = SF.AI_TARGET_COMP;
		this.summon_effect = true;
		this.persist_at_end = true;				
  },
  getText: function() {
    return "Phenomenal cosmic powers..."  // Disney's Aladdin.
  },
  apply: function(source, target) {
		let type = Math.floor(SU.r(12.23,23.33+TG.data.turn)*3);
		if (type === 0) {
			// Summon alphas. Two per enemy.
			TG.wmd_message = "WMD/> LOAD \"*\",8,1";
			if (target.friendly != source.friendly) {
				// Need to recreate alphas, same as the BattleBuilder. This is a bit messy, but probably not worth restructuring.
				// Just something to mock behavior.
				let place_function = function(unused) {
					return [1, 1];
				}
				let mock_battle_builder = {data: null};
				let enemy_builder = new SBar.EnemyBuilder(/*battle_type=*/undefined, /*level=*/20, SF.RACE_SEED_ALPHA, 12.34+seed++, mock_battle_builder);
				enemy_builder.hero_place_function = place_function;
				enemy_builder.hero_list = [];
				let num_to_summon=2;//Math.round(SU.r(12.23,23.34+seed++)*5)+5;
				enemy_builder.AddAlphas(num_to_summon, /*total_level=*/200);
				for (let hero of enemy_builder.hero_list) {
					let new_hero = hero.heroclone();
					new_hero.friendly = source.friendly;
					this.summonCommon(source, new_hero);
				}
			}
			return true;
		} else if (type === 1) {
			// Clone the player chars.
			TG.wmd_message = "WMD/> CLONE \"*\",8,1";
			if (target.friendly) {
				let new_hero = target.heroclone();
				new_hero.friendly = source.friendly;
				if (source.friendly) {
					S$.game_stats.crew_clones++;
				}
				this.summonCommon(source, new_hero);
				return new_hero;
			}
			return true;
		} else {
			// Global damage.
			TG.wmd_message = "WMD/> KILL \"*\",8,1";
			if (target.friendly != source.friendly) {
				var newEffect = new JTact.DamageEffect(this.displayName, 50);
				newEffect.casted = false;
				TG.controller.doEffect(newEffect, TG.data.heroes[source.name], target, true/*overtime*/);
				
				//TG.icons["WMD Spectacle"] = TG.icons[this.displayName];
				/*
				let stun = new JTact.StunEffect(this.displayName, 5);
				stun.apply(source, target);
				*/
			}
			return true;
		}
  },
};
// Note custom extend.
TU.extend(JTact.OmegaFullEffect, JTact.SummonEffect);  // Custom extend.


/*
 * General algorithm is just make slow and haste multiplicative
 * And restore the amount change, when the effect expires
 * Not a perfectly balanced algorithm, but should be pretty solid for gameplay
 */
JTact.SpeedEffect = function(displayNameIn, amount, duration) {
  this._initSpeedEffect(displayNameIn, amount, duration);
};
JTact.SpeedEffect.prototype = {
	symbol: '⇒',
	stat: SF.STAT_DEX,
  amount: null,
  duration: null,
  target: null,
  changeamount: null,
  _initSpeedEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
    this.type = TF.EFFECT_MOVEMENT_SLOW;
    this.amount = amount;
    this.duration = duration;
		if (amount > 1) {
	    this.buff = true;
			this.ai_target = SF.AI_TARGET_COMP;
		} else {
			this.ai_target = SF.AI_TARGET_PLAYER;
		}
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
		let text = "";
    if (this.amount == 0) {
			text = '0 Movement';
		} else if (this.amount < 1) {
      text = Math.round((1-this.amount) * 100) + '% slow';
    } else {
	    text = Math.round((this.amount-1) * 100) + '% haste';
    }
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;
  },
  preapply: function(source, target) {
		let new_speed = target.speed * this.amount;
		this.changeamount = new_speed - target.speed;
  },
  apply: function(source, target) {
		if (!this.changeamount) {
			// Might have been called as a battle buff.
			let new_speed = target.speed * this.amount;
	    this.changeamount = new_speed - target.speed;
		}
    this.applyPersistentEffect(source, target);
    target.speed += this.changeamount;
    target.resetMoveAbility();
    this.targetName = target.name;
  },
  unapply: function() {
    var target = TG.data.heroes[this.targetName];
    target.speed -= this.changeamount;
    target.resetMoveAbility();
  }
};
TU.extend(JTact.SpeedEffect, JTact.Effect);

/*
  preapply: function(source, target) {
    this.changeamount = target.speed * this.amount;
  },
  apply: function(source, target) {
		if (!this.changeamount) {
			// Might have been called as a battle buff.
	    this.changeamount = target.speed * this.amount;
		}
    this.applyPersistentEffect(source, target);
    target.speed *= this.changeamount;
    target.resetMoveAbility();
    this.targetName = target.name;
  },
  unapply: function() {
    var target = TG.data.heroes[this.targetName];
    target.speed /= this.changeamount;
    target.resetMoveAbility();
  }
*/


JTact.SpellBlockEffect = function(displayNameIn, duration) {
  this._initSpellBlockEffect(displayNameIn, duration);
};
JTact.SpellBlockEffect.prototype = {
	symbol: '★',
	stat: SF.STAT_DEX,
  strength: null,
  _initSpellBlockEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.buff = true;
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_COMP;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    return 'Blocks one spell within ' + this.duration + ' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
  },
  checkImpact: function(newEffect) {
    if (newEffect.type !== TF.EFFECT_DAMAGE && !newEffect.buff &&
        newEffect.casted) {
      TU.logMessage(
          'Spell shield blocked: ' + newEffect.displayName,
          ['react', this.displayName, newEffect.displayName]);
      newEffect.negated = true;
      this.negated = true;
    }
  },
};
TU.extend(JTact.SpellBlockEffect, JTact.Effect);


JTact.StasisEffect = function(displayNameIn, duration) {
  this._initStasisEffect(displayNameIn, duration);
};
JTact.StasisEffect.prototype = {
	symbol: '∞',
	stat: SF.STAT_INT,
  _initStasisEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
    this.duration = duration;
		this.ai_target = SF.AI_TARGET_PLAYER;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
  },
  getText: function() {
    return 'Places the target in stasis for ' + this.duration + ' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    //var relativePos =
    //    TG.data.turnEngine.getQueuePos(target.name) - TG.data.turn;
		//TG.data.turnEngine.requeueHero(target, relativePos + this.duration);
  },
  checkImpact: function(newEffect) {
    // just negate everything during the statis interval?
    newEffect.negated = true;
    TU.logMessage('Stasis negated effect', ['react', this.displayName]);
  },
	checkControlled: function() {
		TG.data.turnEngine.queueTurnEnd();
		return true;
	},
};
TU.extend(JTact.StasisEffect, JTact.Effect);


JTact.StunEffect = function(displayNameIn, durationIn) {
  this._initStunEffect(displayNameIn, durationIn);
};
JTact.StunEffect.prototype = {
	symbol: '◘',
	stat: SF.STAT_INT,
  duration: null,
  _initStunEffect: function(displayNameIn, durationIn) {
    this._initEffect(displayNameIn);
    this.duration = durationIn;
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Stuns for ' + this.duration + ' turns';
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
    TU.logMessage(
        target.name + ' will ready at ' + (TG.data.turn + this.duration),
        ['react', this.displayName, target.name]);
    //TG.data.turnEngine.requeueHero(target, this.duration);
  },
	/*
  elapseTime: function(turns) {
    // Note this hasn't been tested yet.
    if (this.negated && !this.requeued) {
      this.requeued = true;
      TG.data.turnEngine.requeueHero(this.target, 0);
    }
  }
	*/
	checkControlled: function() {
		TG.data.turnEngine.queueTurnEnd();
		return true;
	},
};
TU.extend(JTact.StunEffect, JTact.Effect);



JTact.SleepEffect = function(displayNameIn, durationIn) {
  this._initSleepEffect(displayNameIn, durationIn);
};
JTact.SleepEffect.prototype = {
	symbol: 'Z',
	stat: SF.STAT_INT,
  duration: null,
	targetName: null,
  _initSleepEffect: function(displayNameIn, durationIn) {
    this._initEffect(displayNameIn);
    this.duration = durationIn;
		this.ai_target = SF.AI_TARGET_PLAYER;
  },
  getText: function() {
    return 'Target sleeps for ' + this.duration + ' turns or until stirred';
  },
  apply: function(source, target) {
    this.targetName = target.name;
    this.applyPersistentEffect(source, target);
    TU.logMessage(
        target.name + ' will awake at ' + (TG.data.turn + this.duration),
        ['react', this.displayName, target.name]);
    //TG.data.turnEngine.requeueHero(target, this.duration);
  },
  checkImpact: function(neweffect) {
		// Any effect dispels the effect.
		let hero = TG.data.heroes[this.target]
		for (var i = hero.mods.length - 1; i >= 0; i--) {
			if (hero.mods[i] === this) { // NOTE: true object reference comparison to find exact match
				hero.mods.splice(i, 1);
				TU.logMessage(hero.name + " awoken", ["end", this.displayName, hero.name]);
				break;
			}
		}	
    //TG.data.turnEngine.requeueHero(hero, 0);
  },
	checkControlled: function() {
		TG.data.turnEngine.queueTurnEnd();
		return true;
	},	
};
TU.extend(JTact.SleepEffect, JTact.Effect);


JTact.TeleportEffect = function(displayNameIn, x, y, dist) {
  this._initTeleportEffect(displayNameIn, x, y, dist);
};
JTact.TeleportEffect.prototype = {
	symbol: '☂',
	stat: SF.STAT_DEX,
  x: null,
  y: null,
  dist: null,
  _initTeleportEffect: function(displayNameIn, x, y, dist) {
    this._initEffect(displayNameIn);
    this.x = x;
    this.y = y;
    this.dist = dist;
  },
  getText: function() {
    return 'Teleport';
  },
  apply: function(source, target) {
    source.moveTo(target.x, target.y);
  }
};
TU.extend(JTact.TeleportEffect, JTact.Effect);


JTact.ThreatTauntDotEffect = function(displayNameIn, amount_per_turn, duration) {
  this._initThreatTauntDotEffect(displayNameIn, amount_per_turn, duration);
};
JTact.ThreatTauntDotEffect.prototype = {
	symbol: '⚑',
	stat: SF.STAT_CHA,
  amount_per_turn: null,
	duration: null,
	threat_effect: true,
  _initThreatTauntDotEffect: function(displayNameIn, amount_per_turn, duration) {
    this._initEffect(displayNameIn);
		this.amount_per_turn = amount_per_turn;
		this.duration = duration;
  },
  getText: function() {
		return "+"+this.amount_per_turn+" threat to target for "+this.duration+" turns";
  },
  apply: function(source, target) {
	  this.applyPersistentEffect(source, target);
	  //TG.data.turnEngine.registerDotEffect(this, this.duration);
  },
	elapseTime: function() {
	  if (this.negated) {
	    return;
	  }
    var newEffect = new JTact.ThreatTauntEffect(this.displayName, this.amount_per_turn);
    newEffect.casted = false;
		TG.controller.doEffect(newEffect, TG.data.heroes[this.sourceName], this.target, true/*overtime*/);
	}
};
TU.extend(JTact.ThreatTauntDotEffect, JTact.Effect);


JTact.ThreatTauntEffect = function(displayNameIn, amount) {
  this._initThreatTauntEffect(displayNameIn, amount);
};
JTact.ThreatTauntEffect.prototype = {
	symbol: '⚑',  // Flag
	stat: SF.STAT_CHA,
  amount: null,
	threat_effect: true,
  _initThreatTauntEffect: function(displayNameIn, amount) {
    this._initEffect(displayNameIn);
		this.amount = amount;
  },
  getText: function() {
		return "+"+this.amount+" threat to target";
  },
  apply: function(source, target) {
		target.addThreat(source, this.amount);
  }
};
TU.extend(JTact.ThreatTauntEffect, JTact.Effect);



JTact.ThreatFadeEffect = function(displayNameIn, amount) {
  this._initThreatFadeEffect(displayNameIn, amount);
};
JTact.ThreatFadeEffect.prototype = {
	symbol: '♫',  // Music notes.
	stat: SF.STAT_CHA,
  amount: null,
	threat_effect: true,
  _initThreatFadeEffect: function(displayNameIn, amount) {
    this._initEffect(displayNameIn);
		this.amount = amount;
  },
  getText: function() {
		return "-"+this.amount+" threat";
  },
  apply: function(source, target) {
		for (var obj in TG.data.heroes) {
			var hero = TG.data.heroes[obj];
			if (!hero.dead && hero.name !== source.name && !hero.friendly) {
				hero.reduceThreat(source, this.amount);
			}
		}
  }
};
TU.extend(JTact.ThreatFadeEffect, JTact.Effect);



JTact.InvisibilityEffect = function(displayNameIn, duration) {
  this._initInvisibilityEffect(displayNameIn, duration);
};
JTact.InvisibilityEffect.prototype = {
	symbol: '♫',  // Music notes.
	stat: SF.STAT_INT,
  duration: null,
	threat_effect: true,
	amount: 100,
	sourceName: null,
  _initInvisibilityEffect: function(displayNameIn, duration) {
    this._initEffect(displayNameIn);
		this.duration = duration;
		this.buff = true;
  },
  getText: function() {
		return "Invisibility (greatly reduced threat) until broken";
  },
  apply: function(source, target) {
		this.sourceName = source.name;
    this.applyPersistentEffect(source, target);
		for (var obj in TG.data.heroes) {
			var hero = TG.data.heroes[obj];
			if (!hero.dead && hero.name !== source.name && !hero.friendly) {
				hero.reduceThreat(target, this.amount);
			}
		}
  },
	unapply: function() {
		let source = TG.data.heroes[this.sourceName];
		for (var obj in TG.data.heroes) {
			var hero = TG.data.heroes[obj];
			if (!hero.dead && !hero.friendly) {
				hero.addThreat(source, this.amount);
			}
		}
	},
  checkSourceImpact: function(newEffect) {
    if (newEffect.type === TF.EFFECT_NORMAL_MOVE || newEffect.type === TF.EFFECT_DEFEND) {
			return;
		}
    this.negated = true;
	}
};
TU.extend(JTact.InvisibilityEffect, JTact.Effect);



JTact.TimeBombEffect = function(displayNameIn, damage, delay) {
	this._initTimeBombEffect(displayNameIn, damage, delay);
};

JTact.TimeBombEffect.prototype = {
	symbol: '◷',//'❥',
	stat: SF.STAT_INT,
	damage: null,
	duration: null,
	elapsedTime: 0,
	sourceName: null,
	_initTimeBombEffect: function(displayNameIn, damage, delay) {
		this._initEffect(displayNameIn);
		this.damage = damage;
		this.duration = delay;
		this.ai_target = SF.AI_TARGET_PLAYER;
//		this.ai_rules = [SF.AI_CHECK_EFFECT];
	},
	getText: function() {
		return "Time Bomb explodes after " + this.duration + " turns for " + this.damage + " damage";
	},
	apply: function(source, target) {
		this.applyPersistentEffect(source, target);
    this.sourceName = source.name;		
		//TG.data.turnEngine.registerDotEffect(this, this.duration);
	},
	elapseTime: function() {
		if (this.negated || this.turns_left > 0) {
			return;
		}
		var newEffect = new JTact.DamageEffect("Bomb Explosion", this.damage);
		newEffect.casted = false;
		TG.controller.doEffect(newEffect, TG.data.heroes[this.sourceName], this.target, true/*overtime*/);
	},
};
TU.extend(JTact.TimeBombEffect, JTact.Effect);




JTact.ResistChangeEffect = function(displayNameIn, amount, duration) {
  this._initResistChangeEffect(displayNameIn, amount, duration);
};
JTact.ResistChangeEffect.prototype = {
	symbol: SF.SYMBOL_LEVEL,
	stat: SF.STAT_WIS,
  amount: null,
  _initResistChangeEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
    this.amount = amount;
    this.duration = duration;
		this.buff = amount > 0;		
  },
  getText: function() {
		let text = this.amount > 0 ? "+" : "-";
		text += Math.abs(this.amount)+" resistence level";
		if (this.duration !== TF.FOREVER) {
			text += ' for ' + this.duration + ' turns';
		}
		return text;		
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
		target.level += this.amount;
  },
  unapply: function() {
		let target = TG.data.heroes[this.target]
		target.level -= this.amount;
  }
};
TU.extend(JTact.ResistChangeEffect, JTact.Effect);


JTact.ResistLevelEffect = function(displayNameIn, amount, duration) {
  this._initResistLevelEffect(displayNameIn, amount, duration);
};
JTact.ResistLevelEffect.prototype = {
	symbol: SF.SYMBOL_LEVEL,
	stat: SF.STAT_WIS,
  amount: null,
	amount_changed: null,
  _initResistLevelEffect: function(displayNameIn, amount, duration) {
    this._initEffect(displayNameIn);
    this.amount = amount;
    this.duration = duration;
  },
  getText: function() {
		return "Sets resistance to level "+this.amount+" for "+this.duration+" turns";
  },
  apply: function(source, target) {
    this.applyPersistentEffect(source, target);
		this.amount_changed = this.amount - target.level;
		target.level = this.amount;
  },
  unapply: function() {
		let target = TG.data.heroes[this.target]
		target.level -= this.amount_changed;
  }
};
TU.extend(JTact.ResistLevelEffect, JTact.Effect);



JTact.CopyAbilityEffect = function(displayNameIn, slot) {
  this._initCopyAbilityEffect(displayNameIn, slot);
};
JTact.CopyAbilityEffect.prototype = {
	symbol: 'Ꚙ',
	stat: SF.STAT_DEX,
	slot: null,
  _initCopyAbilityEffect: function(displayNameIn, slot) {
    this._initEffect(displayNameIn);
    this.slot = slot;
  },
  getText: function() {
		return "Copies the target's ability in slot "+(this.slot+1)+" for the duration of battle";
  },
  apply: function(source, target) {
		if (target.abilities.length > this.slot) {
	    for (let i = 0; i < source.abilities.length; i++) {
				let ability = source.abilities[i];
				for (effect of ability.effects) {
		      if (effect.displayName === this.displayName) {
						// Found the source ability. Clone the target's.
						source.abilities[i] = target.abilities[this.slot].clone();
						return;
		      }
				}
	    }
		}
  },
};
TU.extend(JTact.CopyAbilityEffect, JTact.Effect);



})();  // End function for the file.
