/*
 * Hero Base Class
 * Data object (try to sepearate out changes and drawing)
 * Represents one of the player or enemy characters
 * 
 * Normally this class would get extended by heros that define their own skills
 */
(function() {
    JTact.Hero = function() {
        // Note: do NOT run init on the parent Hero here, for easy cloning
    };

    JTact.Hero.prototype = {
			current_crew: null, // Link to the crew.js record for this hero (part of S$.crew for friendlies). Optional.
			original_crew: null, // Copy of the original crew record for this hero, to get stat changes. Optional.
      name: null,
			seed: null,
      health: 1,
      max_health: 100,
			morale: 100,
			personality: null,  // Temp personality. Use is_feral if needed to override.
			is_feral: false,
			is_alpha_boss: false,
      //energy: 0,
      //maxEnergy: 0,
      x: null, // hex x, y. NOTE: do not update these directly. Use moveTo() to make sure it accounts for map barriers and effects
      y: null,
      size: 5,
      speed: 1, // speed relative to default of 1, scales by TF.BASE_MOVE
			level: null,
      abilities: null,  // array.
      mods: null, // status modifiers: buffs, debuffs, global effects, terrain effects, etc. that may affect gameplay
      friendly: null,
			original_friendly: null,
      icon: null,
      //readyTime: null, // end time of recover or channel
      threatList: null, // threat table in {target, amount} hashmap (not actually a list).
      threatTarget: null, // current target, for AI
      threatMax: 0,  // Largest threat value.
      // Variables that get used if the hero is channeling
//        channeling: false,
//        channelTarget: null,
//        channelAbility: null,
      moveAbility: null, // Special move ability.
      defendAbility: null, // Special defend ability.
      //turn_order: 0, // Hero’s order relative to others on the same turn.
			death_ticks: 0,  // Up to TF.MAX_DEATH_TICKS hits when fallen.
			summoned: false,  // Hero was summoned in this combat.
			is_player: false,  // Main hero.
			// This hero is permanently dead.
			// These are tracked here rather than removed from TG.heroes to make sure
			// all the hero references are intact (even if buggy).
			// And reminder that dead heroes are never meant to come back (see death_ticks instead).
			dead: false,
			last_drawn_health: null,  // How much health the hero had on last paused draw.
			
			// Fields for export, if it joins the crew.
			raceseed: null,
			for_export_artis: null,
			
			// This version just does the base stats and no battle layout.
				_initHeroOnly: function(xIn, yIn, friendlyIn, nameIn, size, level, seed, raceseed) {
          this.name = nameIn;
          this.abilities = [];
          this.mods = [];
          this.threatList = {};
          this.friendly = friendlyIn;
          this.original_friendly = this.friendly;
					if (size) {
						this.size = size;
					}
					this.level = level;
					this.seed = seed;
					this.raceseed = raceseed;
				},
				UpdateIcon() {
          if (this.name === undefined || this.name === null) {
            error("error: need name for icon");
            return;
          }
					let symbols = this.name[0]
					if (this.name.length > 1) {
						symbols += this.name[1];
					}
					symbols = this.name[0]+ST.getSymbol(this.seed);
					
          //var text = "";
					/*
					let symbols = "";
					for (let word of this.name.split(' ')) {
						symbols += word[0];
					}
					if (symbols.length === 1) {
						symbols += this.name[this.name.length-1];
					}
					*/
					/*if (this.seed === SF.RACE_SEED_HUMAN) {
						// Main player icon.
	          TG.icons[this.name] = this.PlayerHeroIcon();
					} else*/ 
					if (this.is_alpha_boss) {
	          TG.icons[this.name] = TU.alphaBossIcon();
					} else if (this.raceseed === SF.RACE_SEED_ALPHA) {
	          TG.icons[this.name] = TU.alphaIcon(this.name, this.seed, this.level, this.friendly);
					}	else if (this.current_crew) {
	          TG.icons[this.name] = TU.imageHeroIcon(this.name, this.seed, symbols, this.current_crew.GetCachedImage());
					} else {
	          TG.icons[this.name] = TU.randHeroIcon(this.seed, symbols);
					}
          this.icon = TG.icons[this.name];
				},
				// Might need to change the name if it's not unique.
				ChangeName: function(new_name) {
					this.name = new_name;
					this.UpdateIcon();
				},
        _initHero: function(xIn, yIn, friendlyIn, nameIn, size, level, seed, raceseed, params) {
					this._initHeroOnly(xIn, yIn, friendlyIn, nameIn, size, level, seed, raceseed);
					for (let obj in params) {
						this[obj] = params[obj];
					}
            if (this.icon === null) {
							this.UpdateIcon();
            }
            this.moveTo(xIn, yIn);

            this.defendAbility = new JTact.Ability("Defend"); // matches icon name in Viewer
            this.defendAbility.threat = 0;
            var effect = new JTact.DefendEffect("Defending", 1);
            this.defendAbility.effects.push(effect);

            this.moveAbility = new JTact.Ability("Move");
            this.moveAbility.target = new JTact.HeroMoveTarget(this.maxMove());
            this.moveAbility.threat = 0;
            var effect = new JTact.MoveEffect("Moving"); // matches icon name in Viewer
            this.moveAbility.effects.push(effect);
        },
        // convenience method called in hero constructors to add abilities
        addAbility: function(name, effects, params, target) {
            if (target === undefined) {
                target = null;
            }
            var ability = new JTact.Ability(name); // use the same seed as hero
            //var chars = TF.abilityKeyMap[this.abilities.length];
						var icon_chars = name[0];
						/*
						var icon_chars = chars;
						if (!this.friendly) {
						  var words = name.split(' ');
							if (words.length >= 2) {
								icon_chars = words[0][0]+words[1][0];
							} else {
								icon_chars = name.substring(0, 2);
							}
						}*/
            TG.icons[name] = TU.randIcon(this.seed+this.abilities.length, icon_chars);
            ability.target = target;
            for (var obj in effects) {
                var effect = effects[obj];
                ability.effects.push(effect);
                //chars = name.substring(0, 2);
                TG.icons[effect.displayName] = TG.icons[name];
            }
            this.abilities.push(ability);
            if (params !== undefined) {
                for (var obj in params) {
                    ability[obj] = params[obj];
                }
            }
            return ability;
        },
				addBuiltAbility: function(ability, friendly) {
					this.abilities.push(ability);
					let symbols = "";
					for (let effect of ability.effects) {
						symbols += effect.symbol;
					}
					if (!symbols) {
						symbols = ability.displayName[0];
					}
					if (!TG.icons[ability.displayName]) {
						TG.icons[ability.displayName] = TU.randIcon(this.seed+this.abilities.length, symbols);
					}
				},
        // Checks persistent effects on this hero to see if it matches the provided category
        hasEffectType: function(checkType) {
            for (var i = 0; i < this.mods.length; i++) {
                if (this.mods[i].type === checkType) {
                    return true;
                }
            }
            return false;
        },
				// Creates a copy of this hero, for caching.
				fullcopy: function() {
					let ret = new JTact.Hero();
					let suclone = SU.Clone(this);
					for (obj in suclone) {
						ret[obj] = suclone[obj];
					}
					ret.moveAbility = this.moveAbility.clone();
					ret.defendAbility = this.defendAbility.clone();
					ret.mods = [];
					for (let mod of this.mods) {
						ret.mods.push(mod.clone());
					}
					ret.abilities = [];
					for (let ability of this.abilities) {
						ret.abilities.push(ability.clone());
					}
					ret.icon = this.icon;
					return ret;
				},
				// Clones a hero and sets it up for battle.
        heroclone: function() {
            var ret = new JTact.Hero();
            for (var obj in this) {
                ret[obj] = this[obj];
            }
            ret.abilities = [];
            for (var obj in this.abilities) {
                ret.abilities.push(this.abilities[obj].clone());
            }
            ret.mods = [];
            for (var obj in this.mods) {
                ret.mods.push(this.mods[obj].clone());
            }
						ret.for_export_artis = []
            for (var obj in this.for_export_artis) {
                ret.for_export_artis.push(SU.Clone(this.for_export_artis[obj]));
            }
						ret.x = 0;
						ret.y = 0;
						ret.morale = Math.round(SU.r(this.seed, 51.25)*30+30);  // Clones aren't exactly excited.
						// Don't want to link to the original.
						delete ret.current_crew;
						delete ret.original_crew;
						
						// Filter stuff that's obviously broken by cloning.
						for (let i = ret.abilities.length-1; i >= 0; i--) {  // Count down for index stability.
							let remove = false;
							for (let effect of ret.abilities[i].effects) {
								if (effect.clone_self_effect) {
									remove = true;
								}
							}
							remove |= ret.friendly && ret.for_export_artis[i] && !ret.for_export_artis[i].imprinted;
							if (remove) {
								ret.abilities.splice(i, 1);
								ret.for_export_artis.splice(i, 1);
							}
						}
						ret.name = TG.data.UniqueName(ret.name);
						// Update any persistent effects for the clone.
						for (let mod of ret.mods) {
							if (mod.target && mod.target == this.name) {
								mod.target = ret.name
							}
						}
						
						TG.icons[ret.name] = TG.icons[this.name];
						TG.icons2[ret.name] = TG.icons2[this.name];
						//ret.icon = this.icon;
            return ret;
        },
        // returns the time to move the given distance
        calcMoveTurns: function(dist) {
	    		return 1;
        },
        maxMove: function() {
            return Math.round(TF.BASE_MOVE * this.speed);
        },
				SetSpeed: function(speed) {
					this.speed = speed;
					this.resetMoveAbility();
				},
        isTargetable: function() {
            var ret = TG.data.map.targetOverlaps(this.x, this.y, this.size);
            return ret;
        },
        removeMod: function(mod) {
          for (var i = 0; i < this.mods.length; i++) {
            if (this.mods[i].displayName === mod.displayName) { // can't use object compare due to clones
              this.mods[i].negated = true;
              this.mods.splice(i, 1);
              return true;
            }
          }
          return false;
        },
        moveTo: function(newx, newy) {
            TG.data.mapEffects.handleMove(this, newx, newy);
            if (this.x !== null) {
                TG.data.map.updateBarrier(this.x, this.y, this.size, /*present=*/false);
            }
            this.x = newx;
            this.y = newy;
            TG.data.map.updateBarrier(this.x, this.y, this.size, /*present=*/true);
        },
				// A character hit 0 hp.
        handleUnconscious: function() {
					if (this.friendly && S$.conduct_data['explore_mode']) {
						this.health = 1;
						SU.message(SF.CONDUCTS['explore_mode'].title);
						return;
					}
					
          TU.logMessage(this.name + " unconscious "+this.death_ticks);
					this.death_ticks++;
					if (this.death_ticks === 1) {
            for (var obj in TG.data.heroes) {
							let check_hero = TG.data.heroes[obj];
							if (!check_hero.dead) {
                check_hero.threatHandleUnconscious(this.name);								
							}
            }
						SG.activeTier.CheckEnd();
					}
					if (this.death_ticks > TF.MAX_DEATH_TICKS) {
						this.handleDeath();
					}
				},
				
				// A character is fully gone.
        handleDeath: function() {
          TG.data.map.updateBarrier(this.x, this.y, this.size, false);
          TU.logMessage(this.name + " died");
          TG.data.turnEngine.handleTEDeath(this);
					SG.activeTier.renderer.RemoveHeroView(this);
          //delete TG.data.heroes[this.name];
					this.dead = true;
					if (this.is_player) {
						TG.controller.CheckEnd();
					}
        },
        addThreat: function(sourceHero, amount) {
            if (amount === 0) {
                return;
            }
						if (!sourceHero.friendly || this.friendly) {
							// Only update threat for enemies.
							return;
						}
            var source_name = sourceHero.name;
            if (this.threatList[source_name] === undefined) {
                this.threatList[source_name] = 0;
            }
            this.threatList[source_name] += amount;
            if (this.threatList[source_name] > this.threatMax) {
                this.threatMax = this.threatList[source_name];
            }
            // Now check if this triggers a new target
//            if (source_name !== this.threatTarget) {
            var current = this.threatList[this.threatTarget];
            if (current === undefined || this.threatList[source_name] > current * TF.THREAT_RETARGET_AMOUNT) {
                this.threatTarget = source_name;
                if (current !== undefined) {
                    TG.controller.renderer.queueThreatDraw(this.name, this.threatTarget);
                }
            }
//            }
        },
        reduceThreat: function(sourceHero, amount) {
            if (amount === 0) {
                return;
            }
						if (!sourceHero.friendly || this.friendly) {
							// Only update threat for enemies.
							return;
						}
            var name = sourceHero.name;
            if (this.threatList[name] === undefined) {
                this.threatList[name] = 0;
            }
            this.threatList[name] -= amount;
            // Now check if this triggers a new target
            if (name == this.threatTarget) {
							var max = this.threatList[name];
							var top_name = name;
							for (key in this.threatList) {
								var candidate = this.threatList[key];
								if (candidate > max) {
									top_name = key;
									max = candidate;
								}
							}
							if (top_name != name) {
                this.threatTarget = top_name;
                this.threatMax = max;
                TG.controller.renderer.queueThreatDraw(this.name, this.threatTarget);
							}
            }
						
						/*
            if (this.threatList[name] > this.threatMax) {
                this.threatMax = this.threatList[name];
            }
            // Now check if this triggers a new target
            if (name !== this.threatTarget) {
                var current = this.threatList[this.threatTarget];
                if (current === undefined || this.threatList[name] > current * TF.THREAT_RETARGET_AMOUNT) {
                    this.threatTarget = name;
                    if (current !== undefined) {
                        TG.controller.renderer.queueThreatDraw(this.name, this.threatTarget);
                    }
                }
            }
						*/
        },				
        // A hero fell, check if it's the targeted one, and clear threat for them.
        threatHandleUnconscious: function(deadName) {
            //if (this.friendly) {
            //    return;
            //}
            //delete this.threatList[deadName];
						if (!this.threatList[deadName]) {
							return;
						}
						this.threatList[deadName] = 0;
            if (deadName === this.threatTarget) {
                var best = -999;
                for (var obj in this.threatList) {
                    var val = this.threatList[obj];
                    if (val > best && obj !== deadName) {
                        this.threatTarget = obj;
                        best = val;
                    }
                }
            }
        },
				
				SetHealth: function(health) {
					this.health = health;
					this.max_health = health;
				},
				/*
        addEnergy: function(amount) {
            this.energy += amount;
            if (this.energy > this.maxEnergy) {
                this.energy = this.maxEnergy;
            }
        },
				*/
        // Special case to update based on latest hero speed and size.
        resetMoveAbility: function() {
            this.moveAbility.target = new JTact.HeroMoveTarget(this.maxMove());
        },
				// Printable hero text.
				Print: function(/*optional*/for_poly) {
					var text = this.name + ".";
					text += " "+SF.SYMBOL_LEVEL+this.level+".";
					text += " "+this.max_health+SF.SYMBOL_HEALTH+".";
					if (!for_poly) {
						text += " Size: "+this.size+".";
					}
					text += " Speed: "+this.maxMove()+".";
					//text += "\n";
					//text += " Abilities: \n";
					for (let ability of this.abilities) {
						text += "\n    "+ability.displayName+": ";
						//text += "  " + ability.Print() + "\n";
						text += "  " + ability.SummaryText();// + "\n"
					}
					return text;				
				},
				// One-line print.
				PrintOneLine: function() {
					//var text = this.name;
					//text += " "+
					let text = SF.SYMBOL_LEVEL+this.level;
					text += " "+SF.SYMBOL_HEALTH+this.max_health+ " ";
					//text += " speed"+this.maxMove()+"  { ";
					for (let ability of this.abilities) {
						for (let effect of ability.effects) {
							text += effect.symbol+"";
						}
					}
					//text[text.length-1] = "}";
					//text += "}"
					return text;
				},
				ResetDrawnHealth() {
					this.last_drawn_health = this.health;
				},
				// Pass a turn for the hero.
				// Apply DOTs and expire effects as appropriate.
				PassEffectTime: function() {
					for (let mod of this.mods) {
						if (mod.duration === TF.FOREVER || (mod.turns_left !== null && mod.turns_left > 0)) {
							if (mod.turns_left !== null) {
								mod.turns_left--;
							}
							if (mod.elapseTime) {
								mod.elapseTime();
							}
						}
						if (mod.turns_left !== null && mod.turns_left <= 0) {
							if (!hero.dead) {
								mod.unapply();
								mod.negated = true;
								TU.logMessage("Effect " + mod.displayName + " expired on " + hero.name, ["end", mod.displayName, hero.name]);
							}
						}
					}
					
					this.mods = this.mods.filter(function(mod) {  // filter() needs true to keep it.
						return !mod.negated;
					});
				},
    };
})();

 
