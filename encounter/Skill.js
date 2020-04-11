// Generates the artifact details from the seed and other raw data.
(function() {
	let GLOBAL_RANGE = 99999;
	
	let ai_effects = [
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.DamageEffect,
		JTact.HealEffect,
		JTact.HealEffect,
		JTact.HealEffect,
		JTact.HealEffect,
		JTact.HealthChangeEffect,
		JTact.BleedEffect,
		JTact.CancelBuffsEffect,
		JTact.CancelDebuffsEffect,
		JTact.ConfuseEffect,
		JTact.ConvertEffect,
		JTact.ConvertEffect,
		JTact.DamageDotEffect,
		JTact.DamageDealtEffect,
		JTact.DamageDealtEffect,
		JTact.DamageReceivedEffect,
		JTact.DamageReceivedEffect,
		JTact.DamageShieldEffect,
		JTact.DamageShieldEffect,
		JTact.DamageShieldEffect,
		JTact.FearEffect,
		JTact.FingerOfDeathEffect,
		JTact.HealDotEffect,
		JTact.HealDotEffect,
		JTact.HealthEchoEffect,
		JTact.HealthRewindEffect,
		JTact.HealthSwapEffect,
		JTact.FullImmunityEffect,
		JTact.DamageImmunityEffect,
		JTact.EffectImmunityEffect,
		JTact.LifestealEffect,
		JTact.PullEffect,
		JTact.PushEffect,
		JTact.ReincarnateEffect,
		JTact.ReviveEffect,
		JTact.RewindEffect,
		JTact.SpeedEffect,
		JTact.SpeedEffect,
		JTact.RangeEffect,
		JTact.RangeEffect,
		JTact.SpellBlockEffect,
		JTact.SpellBlockEffect,
		JTact.SpellBlockEffect,
		JTact.StasisEffect,
		JTact.StunEffect,
		JTact.SleepEffect,
		JTact.SleepEffect,
		JTact.SummonEffect,
		JTact.SummonEffect,
		JTact.SummonEffect,
		JTact.SummonEffect,
		JTact.SummonEffect,
		JTact.PolymorphEffect,
		JTact.PolymorphEffect,
		JTact.CloneEffect,
		JTact.TimeBombEffect,
		JTact.UnsummonEffect,
		JTact.ControlSummonEffect,
		JTact.ModifyCDEffect,
		JTact.ModifyAreaEffect,
		JTact.ModifyDurationEffect,
	];
	
	let all_effects = [
		JTact.DashEffect,
		JTact.ChangeCDEffect,
		JTact.ChangeCDEffect,
		JTact.TeleportEffect,
		JTact.ThreatTauntEffect,
		JTact.ThreatTauntEffect,
		JTact.ThreatTauntDotEffect,
		JTact.ThreatFadeEffect,
		JTact.ResistChangeEffect,
		JTact.ResistChangeEffect,
		JTact.ResistLevelEffect,
		JTact.CopyAbilityEffect,
		JTact.InvisibilityEffect,
	];
	for (let effect of ai_effects) {
		all_effects.push(effect);
	}
	
	// Skill. artifact_data is an array of one (single) or more (connected) artifact data sets.
	SBar.Skill = function(artifact_data) {
		this._initSkill(artifact_data);
	};

	SBar.Skill.prototype = {
		// Note some of these aren't valid for connected artifact.
		// Might need to revisit which of these are internal.
		seed: null,
		raceseed: null,
		level: null,
		type: null,
		
		skill_params: null,
		name: null,
		desc: null,  // Description of the skill (artifact).
		detail: null,  // Skill detailed description.
		req_stat: null,  // Prereq stat, put in the best skill object for everything but effects.
		prereq_stats: null,  // Array of prereqs for each stat.
		ship_skills: null,
		stats_skills: null,  // {speed, health, level}.
		skill_boost: null,  // Filled when skill boosts. {damage, damage_percent, range, range_percent, aoe, aoe_percent, 
			                  //   duration, duration_percent, threat, threat_percent, cooldown_percent, level_cap}
		ability: null,
		skip_connectors: null,  // The icon shouldn't use any connectors for this.
		_initSkill: function(artifact_data) {
			if (artifact_data.params === undefined) {
				error("Not an artifact");
				printStack();
				return;				
			}
			if (artifact_data.params.length === 1) {
				this.InitSingleSkill(artifact_data.params[0]);
			} else {
				this.CombineSkills(artifact_data);
			}
		},
			
	  // Builds a skill based on a (single) set of artifact data.
		InitSingleSkill: function(skill_params) {
			this.skill_params = skill_params;
			this.seed = skill_params.seed;
			this.raceseed = skill_params.raceseed;
			if (!this.raceseed) {
				// Does this need to be set more formally? i.e., why isn't it always set?
//				this.raceseed = 0;
				this.raceseed = SU.r(this.seed, 7.12);
			}
			this.level = skill_params.level;
			this.type = skill_params.type;
			this.for_ai = skill_params.for_ai;
			
			this.detail = "";
			switch (this.type) {
				case SF.SKILL_CARGO:
					let cargo_type = skill_params.cargo_type;
					if (!cargo_type) {
						error("no cargo type");
						cargo_type = SF.CARGO_GOODS;
					}
					this.name = ST.cargoName(this.seed, this.level, cargo_type);
					if (cargo_type === SF.CARGO_GOODS) {
						this.detail = "Typical trade goods.";
					} else if (cargo_type === SF.CARGO_ORE) {
						this.detail = "Typical trade ores.";
					} else {
						this.detail = "Typical less-than-legal trade goods.";
					}
					let value = SU.BaseCargoValue(this.level, cargo_type);
					this.detail += " Standard market value: "+SF.SYMBOL_CREDITS+value+".";
					break;
				case SF.SKILL_OMEGA_FRAGMENT:
					{
					//this.name = "Omega 13 Fragment";
					//this.name = ST.getAlphaWord(this.seed + 61.5)+" the "+SF.WMD_FRAGMENT_NAME;					
					this.name = ST.getWord(this.seed+61.4, this.seed + 61.5)+" the "+SF.WMD_FRAGMENT_NAME;					
					//this.desc = "A strange device, and strangely familiar."
					this.desc = "Sentient and won't shut up."
					// plot skill.
	        let effect = new JTact.OmegaFragmentEffect(this.name/*SF.WMD_FRAGMENT_NAME*/, 2);
	        this.ability = new JTact.Ability(this.name, [effect], 100);
					this.ability.threat = 10;
					this.ability.target = new JTact.GlobalTarget();
					this.detail = this.ability.Print();
				  }
					break;
				case SF.SKILL_TRUE_OMEGA:
					{
					this.name = SF.WMD_ABILITY_NAME;
					this.desc = "Phenomenal cosmic powers... Itty bitty box."  // Disney's Aladdin.
					// plot skill.
	        let effect = new JTact.OmegaFullEffect("WMD", 2);
	        this.ability = new JTact.Ability(this.name, [effect], 1);
					this.ability.threat = 100;
					this.ability.target = new JTact.GlobalTarget();
					this.detail = this.ability.Print();
				  }
					break;
				case SF.SKILL_DARK_ENGINE:
					this.ship_skills = {};
					this.name = "Color Engine";
					this.ship_skills.speed = 10;
					this.detail = "A ridiculously implausible device. It occasionally radiates transient globes of light.\n+"+this.ship_skills.speed+" speed";
					this.req_stat = SF.STAT_DEX;
					break;
				case SF.SKILL_ALPHA:
				case SF.SKILL_ALPHA_DAMAGE:
					if (SU.r(this.seed, 93.4) < 0.5) {
						// Named artifact.
			      var rawdata = ST.artifacts_text[Math.floor(SU.r(this.seed, 0.111) * ST.artifacts_text.length)];
						this.name = rawdata[1];
						if (rawdata[2]) {
							this.desc = rawdata[2];
						} else {
	            this.desc = "Its mystery is exceeded only by its power.";
						}
					} else {
						// Random text.
			      this.name = ST.getAlphaWord(this.seed + 7.11);
			      this.desc = ST.getAlphaWord(this.seed + 7.21) + " " + ST.getAlphaWord(this.seed + 7.31) + " " + ST.getAlphaWord(this.seed + 7.41);
					}
	        this.name = ST.artiPrefix(this.seed, this.level) + this.name; // "The " and arti adjectives.
					this.ability = this.BuildAbility(this.type);
					// Special case: alpha gets two abilities.
					// TODO: need to combining targeting, cooldown, take care of move effects+connects etc?
					this.seed += 10;
					let ability2 = this.BuildAbility(this.type);
					for (let i = 0; i < 10; i++) {
						// Try for a complementary ability.
						if (ability2.effects[0].ai_target == this.ability.effects[0].ai_target) {
							// Includes match on 'undefined'.
							break;
						}
						this.seed += 10;
						ability2 = this.BuildAbility(this.type);
					}
					if (!this.ability.level_cap && ability2.level_cap) {
						// Make sure a lack of level cap on the first ability doesn't skip the cap on the second.
						this.ability.level_cap = ability2.level_cap;
					}
					this.ability.effects.push(ability2.effects[0]);
					this.ability.threat += ability2.threat;
					/*
			if (type === SF.SKILL_ALPHA) {
				// Special case: alpha gets two abilities.
				data.params.push({seed: seed+10, raceseed: raceseed, type: type, level: level});
			}
					*/
				
					this.detail = this.ability.Print();
					break;
				case SF.SKILL_SHIP:
				case SF.SKILL_SHIP_SPEED:
				case SF.SKILL_SHIP_FLEE:
				case SF.SKILL_SHIP_MINING_LEVEL:
				case SF.SKILL_SHIP_MINING_SPEED:
				case SF.SKILL_SHIP_CARGO:
				case SF.SKILL_SHIP_SENSORS:
					this.ship_skills = {};
					this.BuildShipSkill();
					break;
				case SF.SKILL_STATS:
					this.stats_skills = {};
					this.BuildStatsSkill();
					break;
				case SF.SKILL_BOOST:
					this.name = ST.abilityName(SU.r(this.seed, 0.104));
					this.BuildSkillBoost();
					break;
				default:
					// Standard skills, including pirate.
					this.name = ST.abilityName(SU.r(this.seed, 0.103));
					//this.desc = "Do I belong to you or do you belong to me?";
					this.desc = ST.artiPrefixBase(this.seed, this.level);  // Two reasonably interesting terms.
					this.ability = this.BuildAbility(this.type);
					this.detail = this.ability.Print();	
					if (this.type == SF.SKILL_PIRATE_DAMAGE || this.type == SF.SKILL_PIRATE) {
						this.detail = "[Outlaw Tech]\n"+this.detail;  // Less-than-legal.
					}
					break;
			}
			if (this.ability && this.ability.target && this.ability.target.move_effect) {
				this.skip_connectors = true;
			}
			if (this.ability && this.ability.target && this.ability.target.aoe > 0 && this.ability.target.aoe%2 == 0) {
				// Area needs to be odd for layout.
				this.ability.target.aoe++;
				if (this.ability.Print) {
					this.detail = this.ability.Print();					
				}
			}
			this.BuildPrereqStats();
		},
			
		CombineSkills: function (artifact_data) {
			let connected_skills = [];
			let connected_boosts = [];
			let all_connected = [];
			this.level = -1;
			for (let single_data_set of artifact_data.params) {
				if (single_data_set.level > this.level) {
					this.level = single_data_set.level;
				}
			}
			for (let single_data_set of artifact_data.params) {
				let new_skill = new SBar.Skill({params:[single_data_set]});
				this.CombinePrereqStats(new_skill);
				if (single_data_set.type === SF.SKILL_BOOST) {
					if (single_data_set.level >= this.level) {
						connected_boosts.push(new_skill);
						all_connected.push(new_skill);
					}
				} else {
					connected_skills.push(new_skill);
					all_connected.push(new_skill);
				}
			}
			
			// Combine the names in fun ways.
			this.name = "";
			this.detail = "";
			let num_skills = all_connected.length
			for (var i = 0; i < num_skills; i++) {
				let skill = all_connected[i];
				let skill_name = skill.name;
				this.name += skill_name.substring(Math.round(skill_name.length*i/num_skills),
								Math.round(skill_name.length*(i+1)/num_skills));
			}
			
			// Set the type and seed.
			this.type = artifact_data.params[0].type;
			this.seed = artifact_data.params[0].seed;
			for (let i = 1; i < artifact_data.params.length; i++) {
				let check_type = artifact_data.params[i].type;
				if (check_type < this.type || check_type == SF.SKILL_PIRATE_DAMAGE || check_type == SF.SKILL_PIRATE) {
					this.type = check_type;
				}
				this.seed += artifact_data.params[i].seed;  // Symmetric / order-independent.
			}			

			// Set up the boosts into a single combined set.
			let total_boosts = {};
			if (connected_boosts.length > 0) {
				for (let connected_boost_skill of connected_boosts) {
					let connected_boost = connected_boost_skill.skill_boost;
					for (let obj in connected_boost) {
						if (!total_boosts[obj]) {
							total_boosts[obj] = connected_boost[obj];
							if (obj === "nullify" || obj === "copy_boost") total_boosts[obj] = 1;
						} else {
							if (obj === "cooldown_percent") {
								total_boosts[obj] *= connected_boost[obj];
						  } else if (obj === "nullify" || obj === "copy_boost") {
								total_boosts[obj]++;
							} else if (obj === "level_cap") {
								total_boosts[obj] = Math.max(total_boosts[obj], connected_boost[obj]);
							} else {
								total_boosts[obj] += connected_boost[obj];
							}
						}
					}
				}
			}
			
			// Set up the abilities and apply targeting boosts.
			if (connected_skills.length > 0) {
				// Take the averages for level and targeting.
				let total_range = 0;
				let total_aoe = 0;
				let total_level_cap = 0;
				let total_cooldown = 0;
				let level_count = 0;
				let total_threat = 0;
				// Collect the totals to compute averages.
				for (let connected_skill of connected_skills) {
					let ability = connected_skill.ability;
					if (ability.threat) {
						total_threat += ability.threat;
					}
					if (ability.target) {
						if (ability.target.range) {
							total_range += ability.target.range;
						}
						if (ability.target.aoe) {
							total_aoe += ability.target.aoe;
						}
					}
					if (ability.level_cap) {
						total_level_cap += ability.level_cap;
						++level_count;
					}
					if (ability.cooldownTime) {
						total_cooldown += ability.cooldownTime;
					} else {
						++total_cooldown;
					}
				}				
				
				// Add boosts.
				let final_range = Math.round(total_range/connected_skills.length)
				if (total_boosts.range) {
					final_range += total_boosts.range;
				}
				if (total_boosts.range_percent) {
					final_range *= 1+total_boosts.range_percent/100;
					final_range = Math.round(final_range);
				}
				let final_aoe = Math.round(total_aoe/connected_skills.length);
				if (total_boosts.aoe) {
					final_aoe += total_boosts.aoe;
				}
				if (total_boosts.aoe_percent) {
					final_aoe *= 1+total_boosts.aoe_percent/100;
					final_aoe = Math.round(final_aoe);
				}
				let final_level_cap = -1;
				if (level_count > 0) {
					// Damage ignores level, unless it's connected to a level check.
					final_level_cap = Math.round(total_level_cap / level_count);
					if (total_boosts.level_cap && final_level_cap < total_boosts.level_cap) {
						final_level_cap = total_boosts.level_cap;
					}
				}
				let final_cooldown = Math.round(total_cooldown/connected_skills.length);
				if (final_cooldown > 1 && final_cooldown*total_boosts.cooldown_percent) {
					final_cooldown = Math.round(final_cooldown*total_boosts.cooldown_percent);
				}
				let target = new JTact.SpellTarget(final_range);
				if (final_aoe > 0) {
					if (final_aoe%2 == 0) {
						// Area needs to be odd for layout.
						final_aoe++;
					}
					target.aoe = final_aoe;
					target.terrain = true;
				}
				if (total_boosts.global) {
					target = new JTact.GlobalTarget();
				}
	      this.ability = new JTact.Ability(this.name, [], Math.round(final_cooldown), target);
				if (final_level_cap > 0) {
					this.ability.level_cap = final_level_cap;
				}
				this.ability.threat = total_threat;
				if (total_boosts.threat) {
					this.ability.threat += total_boosts.threat;
				}
				if (total_boosts.threat_percent) {
					this.ability.threat = Math.round(this.ability.threat*total_boosts.threat_percent);
				}
				let first_effect = true;
				for (let connected_skill of connected_skills) {
					for (let effect of connected_skill.ability.effects) {
						effect.displayName = this.name;
						// Add damage boosts if needed.
						if (effect.damage) {
							if (total_boosts.damage) {
								effect.damage += total_boosts.damage;
							}
							if (total_boosts.damage_percent) {
								effect.damage *= 1+total_boosts.damage_percent/100;
								effect.damage = Math.round(effect.damage);
							}
						}
						// Add duration if needed.
						if (effect.duration) {
							if (total_boosts.duration) {
								effect.duration += total_boosts.duration;
							}
							if (total_boosts.duration_percent) {
								effect.duration *= 1+total_boosts.duration_percent/100;
								effect.duration = Math.round(effect.duration);
							}
						}
						this.ability.effects.push(effect);
						// Apply any copy boosts to the first effect.
						if (first_effect) {
							first_effect = false;
							if (total_boosts.copy_boost) {
								for (let i = 0; i < total_boosts.copy_boost; i++) {
									this.ability.effects.push(effect.clone());
								}
							}
						}
					}
				}
				// Apply any nullify boosts.
				if (total_boosts.nullify) {
					for (let i = 0; i < total_boosts.nullify && this.ability.effects.length > 0; i++) {
						this.ability.effects.splice(this.ability.effects.length-1, 1);
					}
				}
			}	 // End 'if any abilities' section.
			
			// Special case handling for the 'unimprint' mod.
			if (total_boosts.unimprint) {
				this.ability.unimprint = true;
			}
						
			// Set up text.
			if (this.ability) {				
				this.ability.displayName = this.name;
				this.detail = this.ability.Print() + "\n";
				if (this.type == SF.SKILL_PIRATE_DAMAGE || this.type == SF.SKILL_PIRATE) {
					this.detail = "[Outlaw Tech]\n"+this.detail;					
				}
			}
			if (connected_boosts.length > 0) {
				this.detail += this.SkillBoostDetailText(total_boosts);
			} else {
				this.detail = this.detail.slice(0, -1)  // Remove trailing newline.
			}
		},
					
		// Returns a cooldown value and decrements remaining points accordingly.
		// All cooldowns should be 2 or higher.
		CalcCooldown: function(remaining_obj) {
			let max_cooldown_mod = SU.r(this.seed, 0.215)*10;
			let cooldown_fraction = SU.r(this.seed, 0.225)*0.5;
			if (remaining_obj.value < cooldown_fraction) {
				// Not enough points, return something high.
				return Math.floor(max_cooldown_mod)+3;
			}
			remaining_obj.value -= cooldown_fraction;
			return 2 + Math.floor(cooldown_fraction * 2 * max_cooldown_mod);
		},
		
		// Returns a range value and decrements remaining points accordingly.
		CalcRange: function(remaining_obj, /*optional*/friendly) {
			// Some chance that it's self-targeting, if allowed.
			if (friendly && SU.r(this.seed, 0.87) < 0.3) {
				return 0;
			}
			let max_range_mod = SU.r(this.seed, 0.25)*30+5;
			let range_fraction = SU.r(this.seed, 0.26)*0.25;
			// Some chance that it's short range.
			if (SU.r(this.seed, 0.27) < 0.4) {
				max_range_mod = SU.r(this.seed, 0.25)*6;
				range_fraction = SU.r(this.seed, 0.26)*0.1;
			}
			
			if (remaining_obj.value < range_fraction) {
				return 3;
			}
			remaining_obj.value -= range_fraction;
			return 3 + Math.round(max_range_mod*4*range_fraction);
		},

		// Probabilistically return an AOE value or 0 and decrements remaining points accordingly.
		CalcAoe: function(remaining_obj) {
			if (/*this.for_ai || */SU.r(this.seed, 0.27) > 0.35) {
				// Not using AOE.
				return 0;
			}
			// Small chance of global.
			if (!this.for_ai && SU.r(this.seed, 4.27) < 0.1) {
				remaining_obj.value /= 3;
				return GLOBAL_RANGE;
			}
			
			let max_aoe_mod = SU.r(this.seed, 0.28)*15+3;
			let aoe_fraction = SU.r(this.seed, 0.29)*0.5;
			if (remaining_obj.value < aoe_fraction) {
				return 0;
			}
			remaining_obj.value -= aoe_fraction;
			return 2 + Math.round(max_aoe_mod*2*aoe_fraction);
		},
		
		// Takes some of the remainder for duration. Should return something > 1.
		CalcDuration: function(remaining_obj) {
			let max_duration = SU.r(this.seed, 3.01)*10+8;
			let taken = SU.r(this.seed, 3.02) * 0.6 * remaining_obj.value;
			remaining_obj.value -= taken;
			return 1 + Math.round(max_duration*taken);
		},
		
		// Returns an appropriate target type based on the parameters.
		BuildTarget: function(range, aoe) {
			if (aoe === GLOBAL_RANGE) {
				return new JTact.GlobalTarget();
			}	else if (aoe !== undefined && aoe > 0) {
				return new JTact.AoeTarget(range, aoe);
			} else if (range !== undefined && range > 0) {
				return new JTact.SpellTarget(range);
			} else {
				return undefined; // Self-targeting only.
			}
		},
		
		BuildAbility: function() {
			let remaining_obj = {};  // Wrap in an obj to pass by reference.
			remaining_obj.value = 1;
			let cooldown = this.CalcCooldown(remaining_obj);

			let effect_template;
			let deb1 = 0;
			let deb2 = 0;
			if (this.for_ai) {
				let num = Math.floor(SU.r(this.seed, 2.35)*ai_effects.length);
				effect_template = ai_effects[num];
				deb1 = num;
			} else {
				let num = Math.floor(SU.r(this.seed, 2.36)*all_effects.length);
				effect_template = all_effects[num];
				deb2 = num;
			}
			
			// ***** DEBUG TESTING OVERRIDE
      //effect_template = JTact.ConvertEffect;
			//effect_template = SU.r(this.seed,5.1)<0.5 ? JTact.StasisEffect : JTact.StunEffect;
						
			if (this.type == SF.SKILL_DAMAGE || this.type == SF.SKILL_PIRATE_DAMAGE || this.type == SF.SKILL_PIRATE || this.type == SF.SKILL_ALPHA_DAMAGE) {
				cooldown = 1;  // Force a weaker no-cooldown damage skill.
				remaining_obj.value = 0.5;
				effect_template = JTact.DamageEffect;
			}
			// Don't let summons summon again. The implementation and display would get messy.
			if (this.type == SF.SKILL_NOSUMMON && (effect_template == JTact.SummonEffect || effect_template == JTact.CloneEffect || effect_template == JTact.PolymorphEffect)) {
				effect_template = JTact.DamageEffect;
			}
			
			let ability;
			if (effect_template == JTact.DamageEffect || effect_template == JTact.LifestealEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let amount = 3 * this.level;
				amount *= 1-SU.r(this.seed, 0.23)*0.3;  // Some randomness, don't make stronger.
				if (effect_template == JTact.LifestealEffect) {
					amount *= 0.5 + SU.r(this.seed, 0.235)*0.5;
				}
				if (this.type == SF.SKILL_PIRATE_DAMAGE || this.type == SF.SKILL_PIRATE) {
					// Pirate gear is strong but comes with detection risk.
					amount *= 2;
				}
				amount = Math.round(amount * remaining_obj.value);
				if (amount < 1) amount = 1;
				let skew = SU.r(this.seed, 0.24)/2;  // Fairly low variance.
				if (this.type == SF.SKILL_PIRATE_DAMAGE || this.type == SF.SKILL_PIRATE) {
					skew += 0.5;  // High variance for pirates.
				}
	      var effect = new effect_template(this.name, amount, skew);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.HealEffect) {
				let range = this.CalcRange(remaining_obj, /*friendly=*/true);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				let health = 4 * this.level;
				health *= 1-SU.r(this.seed, 0.23)*0.3;  // Some randomness, don't make stronger.
				health = Math.round(health * remaining_obj.value);
	      var effect = new effect_template(this.name, health);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.BleedEffect
		    || effect_template == JTact.HealDotEffect) {
				let range = this.CalcRange(remaining_obj, /*friendly=*/effect_template == JTact.HealDotEffect);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				let duration = this.CalcDuration(remaining_obj);
				let amount = 8 * this.level;
				amount *= 1-SU.r(this.seed, 3.02)*0.3;  // Some randomness, don't make stronger.
				amount = Math.round(amount * remaining_obj.value);
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.CancelBuffsEffect
				|| effect_template == JTact.CancelDebuffsEffect
				|| effect_template == JTact.HealthSwapEffect
			  || effect_template == JTact.UnsummonEffect
			  || effect_template == JTact.ControlSummonEffect
			  || effect_template == JTact.CloneEffect
		  	) {
				let self_buff = effect_template == JTact.CloneEffect || effect_template == JTact.CancelDebuffsEffect;
				let range = this.CalcRange(remaining_obj, /*friendly=*/self_buff);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
	      var effect = new effect_template(this.name);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.DamageDotEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let duration = this.CalcDuration(remaining_obj);
				let amount = 6 * this.level;
				amount *= 1-SU.r(this.seed, 3.02)*0.3;  // Some randomness, don't make stronger.
				amount = Math.round(amount * remaining_obj.value);
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.DamageDealtEffect
			  || effect_template == JTact.DamageReceivedEffect
			  || effect_template == JTact.SpeedEffect
			  || effect_template == JTact.RangeEffect
			  || effect_template == JTact.ModifyAreaEffect
				|| effect_template == JTact.ModifyCDEffect
			  || effect_template == JTact.ModifyDurationEffect) {
				// Keep it in the range of 0.5 and 1.5.
				let amount = SU.r(this.seed, 3.031) * 0.2;
				if (SU.r(this.seed, 3.032) < 0.5) {
					amount = 0.5 + amount;
				} else {
					amount = 1.5 - amount;
				}
				if ((effect_template == JTact.SpeedEffect || effect_template == JTact.RangeEffect) && SU.r(this.seed, 3.072) < 0.5) {
					// Chance of 0 or double.
					if (SU.r(this.seed, 3.082) < 0.5) {
						amount = 0;
					} else {
						amount = 2;
					}
				}
				let buff = effect_template == JTact.DamageDealtEffect && amount > 1
				    || effect_template == JTact.DamageReceivedEffect && amount < 1
				    || effect_template == JTact.SpeedEffect && amount > 1
				    || effect_template == JTact.RangeEffect && amount > 1
				    || effect_template == JTact.ModifyAreaEffect && amount > 1
						|| effect_template == JTact.ModifyDurationEffect && amount > 1;
				let range = this.CalcRange(remaining_obj, /*friendly=*/buff);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				let duration = this.CalcDuration(remaining_obj);
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.DamageShieldEffect
    			|| effect_template == JTact.ResistLevelEffect) {
				let range = this.CalcRange(remaining_obj, /*friendly=*/true);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				let duration = this.CalcDuration(remaining_obj);
				let amount = 8 * this.level;
				amount *= 1-SU.r(this.seed, 3.04)*0.3;  // Some randomness, don't make stronger.
				amount = Math.round(amount * remaining_obj.value);
				if (effect_template == JTact.ResistLevelEffect) {
					amount = this.level + Math.round(SU.r(this.seed, 3.06)*2) + 1;
				}
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.FingerOfDeathEffect) {
				let range = Math.round(this.CalcRange(remaining_obj/2))+1;
				cooldown *= 2;
	      var effect = new effect_template(this.name);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range));
			} else if (effect_template == JTact.HealthEchoEffect || effect_template == JTact.HealthRewindEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let turns_back = Math.floor(SU.r(this.seed, 3.05) * 8 * remaining_obj.value) + 1;
	      var effect = new effect_template(this.name, turns_back);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.FullImmunityEffect 
				|| effect_template == JTact.DamageImmunityEffect 
				|| effect_template == JTact.EffectImmunityEffect 
				|| effect_template == JTact.ConfuseEffect
				|| effect_template == JTact.ConvertEffect
				|| effect_template == JTact.FearEffect
			  || effect_template == JTact.ReincarnateEffect
			  || effect_template == JTact.SpellBlockEffect
			  || effect_template == JTact.StasisEffect
			  || effect_template == JTact.StunEffect
			  || effect_template == JTact.SleepEffect
				|| effect_template == JTact.InvisibilityEffect
  			) {					
			let buff = effect_template == JTact.FullImmunityEffect
					|| effect_template == JTact.DamageImmunityEffect
					|| effect_template == JTact.EffectImmunityEffect
			    || effect_template == JTact.DamageReceivedEffect && amount < 1
			    || effect_template == JTact.SpellBlockEffect
			    || effect_template == JTact.InvisibilityEffect;
				let range = this.CalcRange(remaining_obj, /*friendly=*/buff);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				let duration = Math.floor(SU.r(this.seed, 3.05) * 6 * remaining_obj.value) + 2;
				if (effect_template == JTact.SpellBlockEffect || effect_template == JTact.SleepEffect) {
					// Roughly double.
					duration = Math.round(duration * (SU.r(this.seed, 3.45) + 1.5));
				}
	      var effect = new effect_template(this.name, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.PullEffect) {
				let range = Math.floor(this.CalcRange(remaining_obj) * 3 * (1 + SU.r(this.seed, 3.06) * 0.1));
				let aoe = this.CalcAoe(remaining_obj);
	      var effect = new effect_template(this.name);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.PushEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let amount = Math.floor((1 + SU.r(this.seed, 3.07)) * 30 * remaining_obj.value);
	      var effect = new effect_template(this.name, amount);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.RewindEffect) {
				let turns_back = Math.floor(SU.r(this.seed, 3.05) * 4 * remaining_obj.value) + 1;
	      var effect = new effect_template(this.name, turns_back);
	      ability = new JTact.Ability(this.name, [effect], cooldown);
			} else if (effect_template == JTact.SummonEffect || effect_template == JTact.PolymorphEffect) {
				let is_poly = effect_template == JTact.PolymorphEffect;
				
				let seedx = SU.r(this.seed, 1.11);
				let raceseedx = this.raceseed;
				if (raceseedx === SF.RACE_SEED_ALPHA) {
					// Don't summon alphas here, because they'll have hats = level,
					// but won't match other alphas of that level.
					raceseedx = SU.r(this.seed, 5.12);
				}
				let levelx = this.level;
				if (is_poly) {
					levelx = this.level + Math.floor(SU.r(seedx, 4.41)*3);
					if (SU.r(seedx, 4.42) < 0.5) {
						// Low level;
						levelx = Math.floor(SU.r(seedx, 4.43)*5)+1;
					}
				}
				let cooldown = Math.floor(SU.r(this.seed, 1.12))*15+10;
				
		    let hero_template = function(x, y, friendly, name_suffix) {
		        this._initTemplate(x, y, friendly, name_suffix);
		    };
		    hero_template.prototype = {
	        _initTemplate: function(x, y, friendly) {
						var seed = seedx;
						let name = ST.getWord(raceseedx, seed);
						if (TG.data && TG.data.heroes) {
							// Tact is initialized.
							name = TG.data.UniqueName(name);
						}
						let raceseed = raceseedx;
						let level = levelx;
						let size = Math.floor(SU.r(seed, 4.29)*3)*2+3;
						if (x === undefined) {  // Battle hasn't been set up, just want base data.
							this._initHeroOnly(x, y, friendly, name, size, level, seed, raceseed);
						} else {
	            this._initHero(x, y, friendly, name, size, level, seed, raceseed);
						}
						let health = Math.round(level*(3+SU.r(seed, 4.43)*5));
						this.SetHealth(health);
						this.speed = SU.r(seed, 4.44)+0.5;
						this.for_export_artis = [];
						for (var i = 0; i < 3; i++) {
							// Since friendly changes based on who has the skill, make it deterministic here.
							let arti = SBar.ArtifactData(SU.r(seed, i), raceseed, level, SF.SKILL_NOSUMMON, /*for_ai=*/true);
							if (i == 0) {
								arti.params[0].type = SF.SKILL_DAMAGE;
							}
							this.for_export_artis.push(arti);
							this.addBuiltAbility(new SBar.Skill(arti).ability, friendly);
						}
	        }
		    };
				SU.extend(hero_template, JTact.Hero);
				
				let effect;
				if (is_poly) {
					let is_buff = levelx >= this.level;
					let duration = Math.floor(SU.r(this.seed, 4.44)*5)+3;
					effect = new effect_template(this.name, hero_template, duration, is_buff);
					
					if (SU.r(seedx, 4.42) < 0.5 || !is_buff) {
						// Ranged.
						let range = this.CalcRange(remaining_obj);
						let aoe = this.CalcAoe(remaining_obj);
			      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
					} else {
						// Self target.
			      ability = new JTact.Ability(this.name, [effect], cooldown);
					}
				} else {
					effect = new effect_template(this.name, hero_template);
		      ability = new JTact.Ability(this.name, [effect], cooldown);
				}
			} else if (effect_template == JTact.TimeBombEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let amount = 5 * this.level;
				amount *= 1-SU.r(this.seed, 0.23)*0.3;  // Some randomness, don't make stronger.
				amount = Math.round(amount * remaining_obj.value);
				let delay = 2 + Math.floor(SU.r(this.seed, 3.06)*3);
	      var effect = new effect_template(this.name, amount, delay);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.DashEffect) {
				let distance = 10 + this.level * 2 + Math.floor(SU.r(this.seed, 3.07) * 15);
        effect = new effect_template(this.name, distance);
				let target = new JTact.HeroMoveTarget(distance);
	      ability = new JTact.Ability(this.name, [effect], cooldown, target);
			} else if (effect_template == JTact.ChangeCDEffect) {
				let range = this.CalcRange(remaining_obj);
				let aoe = this.CalcAoe(remaining_obj);
				let amount = 5 * (Math.round(this.level/3)+1);
				amount *= 1-SU.r(this.seed, 0.213)*0.3;  // Some randomness, don't make stronger.
				let buff = true;
				if (SU.r(this.seed, 0.25) < 0.5) {
					buff = false;
				}
				amount = Math.round(amount * remaining_obj.value);
	      var effect = new effect_template(this.name, amount, buff);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.TeleportEffect) {
				let distance = 8 + this.level * 2 + Math.floor(SU.r(this.seed, 3.09) * 13);
        effect = new effect_template(this.name, distance);
				let target = new JTact.HeroTeleTarget(distance);
	      ability = new JTact.Ability(this.name, [effect], cooldown, target);
			} else if (effect_template == JTact.ThreatTauntEffect) {
				let range = this.CalcRange(remaining_obj)*2;
				let aoe = this.CalcAoe(remaining_obj)*2;
				let amount = 3+this.level+Math.floor((1 + SU.r(this.seed, 3.07)) * 10 * remaining_obj.value);
	      var effect = new effect_template(this.name, amount);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.ThreatTauntDotEffect) {
				let range = this.CalcRange(remaining_obj)*2;
				let aoe = this.CalcAoe(remaining_obj)*2;
				let duration = this.CalcDuration(remaining_obj);
				let amount = 3+this.level+Math.floor((1 + SU.r(this.seed, 3.14)) * 10 * remaining_obj.value);
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.ThreatFadeEffect) {
				let amount = this.level + Math.floor(SU.r(this.seed, 3.18) * 10);
	      var effect = new effect_template(this.name, amount);
	      ability = new JTact.Ability(this.name, [effect], cooldown);
			} else if (effect_template == JTact.HealthChangeEffect
          				|| effect_template == JTact.ResistChangeEffect) {
				let amount = 4 * this.level;
				amount *= 1-SU.r(this.seed, 3.54)*0.3;  // Some randomness, don't make stronger.
				if (effect_template == JTact.ResistChangeEffect) {
					amount = Math.round(amount/4)+1;
				}
				if (SU.r(this.seed, 3.55) < 0.5) {
					amount *= -1;
				}
				let range = this.CalcRange(remaining_obj, /*friendly=*/amount > 0);
				let aoe = range ? this.CalcAoe(remaining_obj) : 0;
				amount = Math.round(amount * remaining_obj.value);
				let duration = this.CalcDuration(remaining_obj);
	      var effect = new effect_template(this.name, amount, duration);
	      ability = new JTact.Ability(this.name, [effect], cooldown, this.BuildTarget(range, aoe));
			} else if (effect_template == JTact.ReviveEffect) {
				let range = this.CalcRange(remaining_obj)+1;
				let cooldown = Math.floor(SU.r(this.seed, 1.12))*15+10;
				effect = new effect_template(this.name);
	      ability = new JTact.Ability(this.name, [effect], cooldown, new JTact.SpellTarget(range));
			} else if (effect_template == JTact.CopyAbilityEffect) {
				let range = this.CalcRange(remaining_obj)+1;
				let slot = Math.floor(SU.r(this.seed, 8.12)*3); // 0-2.
				effect = new effect_template(this.name, slot);
	      ability = new JTact.Ability(this.name, [effect], cooldown, new JTact.SpellTarget(range));
			} else {
				error("No effect_template, using backup","deb1",deb1,"deb2",deb2,"full",SU.Stringify(effect_template));
				this.type = SF.SKILL_DAMAGE;
				return this.BuildAbility();
			}
			
			ability.level_cap = this.level + 1 + Math.floor(SU.r(this.seed, 2.99)*2);
			if (effect_template == JTact.FingerOfDeathEffect) {
				ability.level_cap -= 2;
			}
			if (effect_template == JTact.ConvertEffect) {
				ability.level_cap -= 1;
			}
			if (effect_template == JTact.ResistLevelEffect) {
				ability.level_cap += 2;
			}
			ability.level_cap = capLevel(ability.level_cap);
			if (effect_template == JTact.DamageEffect
			  || effect_template == JTact.ThreatFadeEffect
				|| effect_template == JTact.ThreatTauntDotEffect
			  || effect_template == JTact.ThreatTauntEffect
			  || effect_template == JTact.SummonEffect) {
				ability.level_cap = null;
			}
			//ability.level_cap = 50;
			if (ability.effects[0].threat_effect) {
				ability.threat = 0;
			} else {
				ability.threat = Math.round(this.level/2);
			}
			return ability;
		},
		
		BuildShipSkill: function() {
			let skill_type = this.type;
			if (skill_type === SF.SKILL_SHIP) {
				// Pick a subtype.
				let skill_rand = SU.r(this.seed, 5.42);
				if (skill_rand < 0.2) {
					skill_type = SF.SKILL_SHIP_MINING_LEVEL;
				} else if (skill_rand < 0.4) {
					skill_type = SF.SKILL_SHIP_SENSORS;
				} else if (skill_rand < 0.5) {
					skill_type = SF.SKILL_SHIP_MINING_SPEED;
				} else if (skill_rand < 0.7) {
					skill_type = SF.SKILL_SHIP_SPEED;
				} else if (skill_rand < 0.8) {
					skill_type = SF.SKILL_SHIP_FLEE;
				} else {
					skill_type = SF.SKILL_SHIP_CARGO;
				}
			}
			let word = ST.getWord(this.raceseed, this.seed);
			switch (skill_type) {
				case SF.SKILL_SHIP_MINING_LEVEL:
					// Note mining level and sensor level is max among all, whereas others are additive.
					this.ship_skills.mining_level = capLevel(Math.floor(SU.r(this.seed, 6.41)*4)-1+this.level); // 1 lower - 2 higher level.
					this.name = word+" Mining Laser";
					this.detail = "Mining level "+this.ship_skills.mining_level;
					this.req_stat = SF.STAT_INT;
					break;
				case SF.SKILL_SHIP_SENSORS:
					this.ship_skills.sensor_level = capLevel(Math.floor(SU.r(this.seed, 6.41)*3)-1+this.level); // 1 lower - 1 higher level.
					//this.ship_skills.sensors = Math.floor(SU.r(this.seed, 6.27)*this.level)+1;
					this.name = word+" Sensors";
					this.detail = "Sensor level "+this.ship_skills.sensor_level;
					this.req_stat = SF.STAT_INT;
					break;
				case SF.SKILL_SHIP_MINING_SPEED:
					this.ship_skills.mining_speed = Math.floor(SU.r(this.seed, 6.22)*this.level + this.level);  // Up to 2*level.
					this.name = word+" Mining Collector";
					this.detail = "+"+this.ship_skills.mining_speed+"% improved mining speed";
					this.req_stat = SF.STAT_INT;
					break;
				case SF.SKILL_SHIP_SPEED:
					this.ship_skills.speed = Math.floor(SU.r(this.seed, 6.21)*this.level/3+this.level/2)+1;
					this.name = word+" Engine Boost";
					this.detail = "+"+this.ship_skills.speed+" speed";
					this.req_stat = SF.STAT_DEX;
					break;
				case SF.SKILL_SHIP_FLEE:
					this.ship_skills.flee_chance = Math.floor(SU.r(this.seed, 6.28)*this.level*2+this.level*3);
					this.name = word+" Turbo Jets";
					this.detail = "Improved flee chance: "+this.ship_skills.flee_chance+"%";
					this.req_stat = SF.STAT_WIS;
					break;
				case SF.SKILL_SHIP_CARGO:
					this.ship_skills.max_cargo = Math.floor(SU.r(this.seed, 6.23)*this.level*2)+this.level;
					this.name = word+" Cargo Expansion";
					this.detail = "+"+this.ship_skills.max_cargo+" cargo space";
					this.req_stat = SF.STAT_STR;
					break;
			}
			this.desc = "For ambitious ship modifications."
		},
		
		BuildStatsSkill: function() {
			var skill_rand = SU.r(this.seed, 5.42);
			if (skill_rand < 0.25) {
				this.stats_skills.speed = (Math.floor(SU.r(this.seed, 6.21)*this.level/2+this.level/4)+1)/TF.BASE_MOVE;
				this.detail = "+"+Math.round(this.stats_skills.speed*TF.BASE_MOVE)+" speed";
				this.req_stat = SF.STAT_DEX;
			} else if (skill_rand < 0.5) {
				this.stats_skills.health = Math.floor(SU.r(this.seed, 6.21)*this.level/2+this.level/4)+1;
				this.detail = "+"+this.stats_skills.health+SF.SYMBOL_HEALTH;
				this.req_stat = SF.STAT_STR;
			} else if (skill_rand < 0.75) {
				this.stats_skills.morale = Math.floor(SU.r(this.seed, 6.21)*this.level)+this.level;
				this.detail = "+"+this.stats_skills.morale+" morale";
				this.req_stat = SF.STAT_CHA;
			} else {
				this.stats_skills.resist_level = capLevel(Math.floor(SU.r(this.seed, 6.23)*3-1)+this.level);
				this.detail = /*SF.SYMBOL_LEVEL+*/"Resist Level = "+this.stats_skills.resist_level;
				this.req_stat = SF.STAT_WIS;
			}
			this.name = ST.abilityName(SU.r(this.seed, 0.109));
			this.desc = "About time.";
		},
				
		BuildSkillBoost: function() {
			this.skill_boost = {};
			this.detail = "(";
			let type = SU.r(this.seed, 17.1);
			type = 0.22;  // Debug.
			// Note connected skill level caps and skill ability requirement handling exists elsewhere.
			// Skill boosts of level X generally cannot boost artifacts of level > X. This is overpower mitigation.
			const max_effectiveness = 20;
			if (type < 0.1) {
				this.skill_boost.damage = Math.round((SU.r(this.seed, 17.2)+0.2)*this.level) + 1;
				this.req_stat = SF.STAT_STR;
			} else if (type < 0.2) {
				this.skill_boost.damage_percent = Math.round((SU.r(this.seed, 17.3)+0.2)*max_effectiveness) + 1;
				this.req_stat = SF.STAT_STR;
			} else if (type < 0.25) {
				this.skill_boost.copy_boost = true;
				this.req_stat = SF.STAT_CHA;
			} else if (type < 0.3) {
				this.skill_boost.range = Math.round((SU.r(this.seed, 17.4)+0.2)*max_effectiveness) + 1;
				this.req_stat = SF.STAT_DEX;
			} else if (type < 0.35) {
				this.skill_boost.range_percent = Math.round((SU.r(this.seed, 17.5)+0.2)*max_effectiveness) + 1;
				this.req_stat = SF.STAT_DEX;
			} else if (type < 0.4) {
				this.skill_boost.aoe = Math.round((SU.r(this.seed, 17.6)+0.2)*max_effectiveness/2) + 1;
				this.req_stat = SF.STAT_DEX;
			} else if (type < 0.45) {
				this.skill_boost.aoe_percent = Math.round((SU.r(this.seed, 17.7)+0.2)*max_effectiveness) + 1;
				this.req_stat = SF.STAT_DEX;
			} else if (type < 0.5) {
				this.skill_boost.duration = Math.round((SU.r(this.seed, 17.6)+0.2)*max_effectiveness/3) + 1;
				this.req_stat = SF.STAT_WIS;
			} else if (type < 0.55) {
				this.skill_boost.duration_percent = this.level+Math.floor(SU.r(max_effectiveness, 17.8)*3) - 1;
				this.req_stat = SF.STAT_WIS;
			} else if (type < 0.65) {
				this.skill_boost.nullify = true;
				this.req_stat = SF.STAT_INT;
			} else if (type < 0.7) {
				this.skill_boost.threat = Math.round(this.level*SU.r(this.seed, 17.8)*2) - this.level;
				this.req_stat = SF.STAT_CHA;
			} else if (type < 0.75) {
				this.skill_boost.threat_percent = Math.round(this.level*SU.r(this.seed, 17.8)*6) - max_effectiveness*3;
				this.req_stat = SF.STAT_CHA;
			} else if (type < 0.8) {
				this.skill_boost.level_cap = this.level+Math.floor(SU.r(this.seed, 17.8)*3) - 1;
				this.req_stat = SF.STAT_WIS;
			} else if (type < 0.85) {
				this.skill_boost.unimprint = true;
				this.req_stat = SF.STAT_INT;
			} else if (type < 0.90) {
				this.skill_boost.global = true;
				this.req_stat = SF.STAT_INT;
			} else {
				this.skill_boost.cooldown_percent = 1 - (Math.round((SU.r(this.seed, 17.9)+0.2)*max_effectiveness) + 1)/100;
				this.req_stat = SF.STAT_WIS;
			}
			this.detail = this.SkillBoostDetailText(this.skill_boost, /*use connected fyi=*/true, this.level);
			this.desc = "This could come in handy.";
		},
		
		SkillBoostDetailText: function(boost, use_for_connected_text, /*optional unless use_for_connected_text*/level) {
			let text = "";
			if (!use_for_connected_text) {
				text += "Modifications:\n";
			}
			if (boost.unimprint) {
				text += "Unbinds";
			}
			if (boost.global) {
				text += "Global Effect";
			}
			if (boost.damage) {
				text += "+"+boost.damage+" damage";
			}
			if (boost.damage_percent) {
				text += "+"+boost.damage_percent+"% damage";
			}
			if (boost.range) {
				text += "+"+boost.range+" range";
			}
			if (boost.range_percent) {
				text += "+"+boost.range_percent+"% range";
			}
			if (boost.aoe) {
				text += "+"+boost.aoe+" area";
			}
			if (boost.aoe_percent) {
				text += "+"+boost.aoe_percent+"% area";
			}
			if (boost.duration) {
				text += "+"+boost.duration+" turns effect duration";
			}
			if (boost.duration_percent) {
				text += "+"+boost.duration_percent+"% effect duration";
			}
			if (boost.nullify) {
				text += "Negates an effect";
				if (boost.nullify !== true) {
					// Overloaded with count.
					text += " (x"+boost.nullify+")";
				}
			}
			if (boost.copy_boost) {
				text += "Duplicates an effect";
				if (boost.copy_boost !== true) {
					// Overloaded with count.
					text += " (x"+boost.copy_boost+")";
				}
			}
			if (boost.threat !== undefined) {
				if (boost.threat >= 0) {
					text += "+"+boost.threat+" threat";
				} else {
					text += boost.threat+" threat";
				}
			}
			if (boost.threat_percent !== undefined) {
				if (boost.threat_percent >= 0) {
					text += "+"+boost.threat_percent+"% threat";
				} else {
					text += boost.threat_percent+"% threat";
				}
			}
			if (boost.cooldown_percent) {
				text += round100th(100-boost.cooldown_percent*100)+"% reduced cooldown";
			}
			if (boost.level_cap) {
				text += "max target level "+boost.level_cap;
			}
			if (use_for_connected_text) {
				text += " [connected skills to "+SF.SYMBOL_LEVEL+level+"]";
			}
			return text;
		},
		
		// Short text, like for a shop.
		SummaryText: function() {
			if (this.ability) {
				return this.ability.SummaryText() + "\n" + this.PrereqsText();
			} else {
				if (this.req_stat !== null) {
					return this.detail + "\n" + this.PrereqsText();
				} else {
					return this.detail;
				}
			}
			return "";
		},
		WriteDetails: function(context, x, y, width) {
			if (width) {
				let yoff = SU.wrapText(context, this.PrereqsText(), x+width/2, y, width, 20, SF.FONT_M, "#FAF", 'center');
        return yoff + SU.wrapText(context, this.detail, x, y+yoff, width, 20, SF.FONT_M, "#FAA");
			} else {
				SU.text(context, this.PrereqsText(), x, y, width, SF.FONT_M, "#FAF");
        SU.text(context, this.detail, x, y+20, SF.FONT_M, '#FAA');
				return 40;
			}
		},
		// Set the prereqs. Note this is called only for a single abilitiy (see below for multiple).
		// Note this implementation preservers order and consolidation of overlapping prereqs
		// by using one slot per stat.
		BuildPrereqStats: function() {
			this.prereq_stats = [];
			for (let i = 0; i < SF.NUM_STATS; i++) {
				this.prereq_stats.push(0);
			}
			if (this.skill_params && this.skill_params.bypass_prereqs) {
				return;
			}
			if (this.ability && this.ability.effects) {
				// Note alpha items have two effects, so different prereq seeds here.
				for (let i = 0; i < this.ability.effects.length; i++) {
					let effect = this.ability.effects[i];
					if (effect.stat !== null && effect.stat !== undefined) {
						// Decent amount of spread for variety, touches into the next level.
						let offset = Math.floor(SU.r(this.seed, 71.25+i)*13)-6;  // -6 to +6
						let prereq = capStat(this.level*5+offset);
						if (prereq > this.prereq_stats[effect.stat]) {
							this.prereq_stats[effect.stat] = prereq;
						}
					}
				}
			}
			if (this.req_stat !== null) {
				// Similar to above.
				let offset = Math.floor(SU.r(this.seed, 71.25)*13)-6;  // -6 to +6
				let prereq = capStat(this.level*5+offset);
				if (prereq > this.prereq_stats[this.req_stat]) {
					this.prereq_stats[this.req_stat] = prereq;
				}
			}
		},
		CombinePrereqStats: function(new_skill) {
			if (!this.prereq_stats) {
				this.prereq_stats = [];
				for (let i = 0; i < SF.NUM_STATS; i++) {
					this.prereq_stats.push(0);
				}
			}
			for (let i = 0; i < SF.NUM_STATS; i++) {
				if (new_skill.prereq_stats[i] > this.prereq_stats[i]) {
					this.prereq_stats[i] = new_skill.prereq_stats[i];
				}
			}
		},
		PrereqsText: function() {
			let lines = [];
			for (let i = 0; i < SF.NUM_STATS; i++) {
				if (this.prereq_stats[i] > 0) {
					lines.push(this.prereq_stats[i]+SF.STAT_NAME[i]);
				}
			}
			if (lines.length === 0) {
				return "No Prereqs";
			} else {
				return lines.join(" ");
			}
		},
		// Returns true if the stats in stats_list is sufficient to use this skill.
		MeetsPrereqs: function(stats_list) {
			if (!this.prereq_stats) {
				// This skill may have no prereqs.
				return true;
			}
			if (!stats_list) {
				printStack();
			}
			for (let i = 0; i < SF.NUM_STATS; i++) {
				if (stats_list[i] < this.prereq_stats[i]) {
					return false;
				}
			}
			return true;
		}
	};

	SU.extend(SBar.Skill, SBar.Data);
})();
