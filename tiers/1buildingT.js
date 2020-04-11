/*
 */

(function() {

    SBar.BuildingTier = function(buildingData) {
        this._initBuildingTier(buildingData);
    };

    SBar.BuildingTier.prototype = {
        type: SF.TIER_BUILDING,
        data: null,
        botcontext: null,
        midcontext: null,
        topcontext: null,
        renderer: null,
        numordered: 0,
        isHomeBar: false, // unique bar the player always goes back to, can change
  			render_calls: 0,
  			//friendly: null,
			  //timeout: null,
        _initBuildingTier: function(buildingData) {
            this.data = buildingData;
						/*
            this.botcontext = SC.backLayer;
            this.midcontext = SC.layer1;
            this.topcontext = SC.textLayer;
						*/
            this.botcontext = SC.layer1;
            this.midcontext = SC.layer1;
            this.topcontext = SC.layer2;
						// Doublecheck, in case jumped into the building directly.
						if (this.data.parentData.GenerateTerrain) {  // Might be a belt.							
							this.data.parentData.GenerateTerrain();
						}
						//this.friendly = S$.faction == this.data.faction || this.data.type === SF.TYPE_BAR
            //    || this.data.type === SF.TYPE_TEMPLE_BAR;
        },
        activate: function(returningDrunk) {
						if (SG.activeTier) {  // Unset if returning home? / IntroTerminal.
	            SG.activeTier.teardown();
						}
	          SG.activeTier = this;
						SG.allow_browser_leave = false;
            this.isHomeBar = (S$.origHomeSeed === this.data.seed);
						if (this.CheckQuestBattle()) {
							return;
						}
						if (this.data.type === SF.TYPE_GOODY_HUT) {
							this.DoGoodyHut();
							return;
						}
						if (this.data.type === SF.TYPE_CORNFIELD) {
							this.DoCornfield();
							return;
						}
						if (this.data.type === SF.TYPE_BAR && this.data.parentData.is_arth
							  && S$.got_wmd_in_past && !S$.killed_friend_in_this_timeline) {
							this.DoSpacebar1();
							return;
						}

            if (returningDrunk) {
                delete this.data.parentData.systemData.drewNebula; // reset
                SG.sendingHome = false;
            }
						
						if (this.data.type === SF.TYPE_ANIMAL || this.data.type === SF.TYPE_DERELICT 
							  || this.data.type === SF.TYPE_ALPHA_DANCE || this.data.faction === SF.FACTION_ALPHA) {
							if (this.data.type === SF.TYPE_ANIMAL) {
								SG.death_message = "Killed by picking a fight with wild animals on their own turf. Tragic death by safari.";
							} else if (this.data.type === SF.TYPE_DERELICT) {
								SG.death_message = "Killed picking a fight with strange creatures that looked like your friend hanging out in their ship.";
							} else if (this.data.type === SF.TYPE_ALPHA_DANCE) {
								SG.death_message = "Killed on a dance floor.";
							} else if (this.data.type === SF.TYPE_TEMPLE) {
					 			SG.death_message = "Killed while crashing the party.";
							} else if (this.data.faction === SF.FACTION_ALPHA) {
								SG.death_message = "Killed by strange creatures that looked like your friend.";
							}
							
							// Straight to combat.									
							this.ToBattle(/*attacking=*/true);
							if (this.data.type === SF.TYPE_TEMPLE) {
								SU.MaybeShowChapter(2);
							}
							return;
						}
						if (S$.conduct_data['pirate']) {
							// Straight to combat.
							SU.message(SF.CONDUCTS['pirate'].title);
							SG.death_message = "Killed by piracy.";
							this.ToBattle(/*attacking=*/true);
							return;
						}
						S$.game_stats.building_visits++;

            this.renderer = new SBar.BuildingRenderer(this);
            this.renderer.render();
											
            if (this.data.type === SF.TYPE_TEMPLE_BAR) {
                //S$.setHomeBar(this.data); // new home
                if (!S$.found(this.data.seed + SF.TYPE_TEMPLE_BAR)) {
                    // light it up
                    S$.find(this.data.seed + SF.TYPE_TEMPLE_BAR); // mark active temple
                    S$.find(this.data.parentData.seed + SF.TYPE_TEMPLE_BAR); // also mark planet
                    S$.find(this.data.parentData.systemData.seed + SF.TYPE_TEMPLE_BAR); // and system
                    this.data.parentData.ResetSurfaceCache();
                    this.data.parentData.systemData.tier = null;
                }
            }						

						if (returningDrunk) {
              if (this.data.faction === SF.FACTION_PIRATE) {
                  this.renderer.speak("Arrr ye be blind pissed!", 3000);
              } else {
                  this.renderer.speak("Drank too much again, huh?", 3000);
              }
            } else if (this.isHomeBar) {
							if (S$.done_intro) {
                var text = "Welcome back "+S$.player_name+"!";
                this.renderer.speak(text, 3000);
							}
            } else {
                var text = ST.barGreeting(this.data.seed, this.data.faction);
                this.renderer.speak(text, 3000);
            }
						//this.SetRenderTimeout();
            if (this.data.type === SF.TYPE_TEMPLE_BAR) {
							SU.message("Party rested");
							for (var i = 0; i < S$.crew.length; i++) {
								S$.crew[i].HealFull();
							}
							//S$.CheckLevelUp();
						}										

						if (this.data.raceseed) {
							S$.AddKnownRace(this.data.raceseed);
						}
        },
				DoGoodyHut: function() {
					// Note goody huts are capped a he player's level in 1buildingD.js.
					this.goody_hut = true;
					// Goody huts shouldn't give epic rewards. They're just good for starting out.
					let goody_result = SU.r(this.data.seed, 37.01);
					if (goody_result < 0.15) {
						// Ambush.
						SG.death_message = "Killed by ambush while exploring a cave.";
						this.ToBattle(/*attacking=*/false);
					} else if (goody_result < 0.3) {
						SU.ShowWindow("Absolutely Nothing", "The cave has been long since abandoned.", undefined, ' ');
					} else if (goody_result < 0.6) {
						// Money.
						let credits = round2good(SF.LEVEL_XP[this.data.level]*(SU.r(this.data.seed, 1.52)+1.0)/4);
						SU.ShowWindow("Hidden Stash", "You find "+SF.SYMBOL_CREDITS+credits+"!", undefined, SF.SYMBOL_CREDITS);
						S$.AddCredits(credits);
					} else if (goody_result < 0.8) {
						// Artifact.
						// Borrowed from HandleWinR.
						let skill_type = SF.SKILL_STANDARD;
						let rand_type = SU.r(this.data.seed, 94.23);
						if (rand_type < 0.05) {
							skill_type = SF.SKILL_ALPHA;
						} else if (rand_type < 0.2) {
							skill_type = SF.SKILL_SHIP;
						} else if (rand_type < 0.25) {
							skill_type = SF.SKILL_BOOST;
						} else if (rand_type < 0.3) {
							skill_type = SF.SKILL_STATS;
						}			
						let arti = SBar.ArtifactData(SU.r(this.data.seed, 34.02), this.data.raceseed, this.data.level, skill_type);
						if (skill_type === SF.SKILL_ALPHA) {
							S$.AddXp("arch", SF.LEVEL_XP[this.data.level]/2);
						}					
						SU.PushTier(new SBar.ArtifactFindRenderer(arti, this.data));
					} else {
		        var new_tier = new SBar.HireDisplay(this.data.seed, this.data.raceseed, this.data.level);
						new_tier.cave_backstory = true;
						SU.PushTier(new_tier);
					}
					S$.RemoveStandardBuilding(this.data);							
          this.data.parentData.ResetSurfaceCache();
					return;					
				},
				DoSpacebar1: function() {
          this.data.parentData.ResetSurfaceCache();
					SU.PushTier(new SBar.IntroTier(this.leave.bind(this), this.data));
					//new SBar.IntroTier(this.leave.bind(this), this.data).activate();
				},
				DoCornfield: function() {
					S$.RemoveStandardBuilding(this.data);							
          this.data.parentData.ResetSurfaceCache();
					SU.PushTier(new SBar.IntroTier(this.leave.bind(this), this.data));
					//new SBar.IntroTier(this.leave.bind(this), this.data).activate();
				},
				// See if there's a quest that triggers a battle on entering this building.
				CheckQuestBattle: function() {
					this.quest = S$.getQuestObjBySeed(this.data.seed);
					if (!this.quest) {
						return false;
					}
					if (this.quest.money_run) {
						let credits = this.quest.getMoneyReward();
						S$.AddCredits(credits);
						S$.QuestEncounterClear(this.data.seed, /*skip_message=*/true);
						SU.message("+"+SF.SYMBOL_CREDITS+credits+" Delivery Complete")
						return false;
					}
					
		      this.quests = []; // {"n": name, "x": x, "y": y, "stx": stx, "sty": sty, "b": buildingLookup, "t": type, "ss": souceSeed, "ts": targetSeed}
					//let level = this.data.parentData.systemData.level;
					let description = this.data.faction === SF.FACTION_PIRATE ? 
  					"Mark acquired" : "Local muscle \"surprises\" you with a delivery of their own.";
					let battle = new SBar.BattleBuilder(SF.BATTLE_QUEST, this.data, /*attacking=*/false, this.QuestBattleCallback.bind(this),
						{reward: {artifact: this.quest.getArtiReward()}, battle_name: this.quest.name,
				     description: description});
		 			SG.death_message = "Killed trying to deliver a package.";
					SU.PushBattleTier(battle);
					return true;
				},
				QuestBattleCallback: function(encounter_data) {
					S$.QuestEncounterClear(this.data.seed);
					// Remove quest indictors.
          //this.data.parentData.ResetSurfaceCache();
          //this.data.parentData.systemData.tier = null;
					
					// Remain in the building.
          SG.activeTier = this;
          this.renderer = new SBar.BuildingRenderer(this);
          this.renderer.render();
					
					if (encounter_data.won) {
						S$.ChangeRaceAlignment(this.data.raceseed, 5);
					}
				},
				// Called on return from a dialog. Check if it's a goody hut.
				PopCallback: function() {
					if (this.goody_hut) {
						this.leave();
					} else if (this.renderer) {
            this.renderer.render();
					}
				},
        handleUpdate: function() {
          this.renderer.renderUpdate();
        },
				// Movement is only occasionaly, to minimize performance drain.
				/*
				SetRenderTimeout: function() {
					// Timeout is 5 seconds to 65 seconds.
					var move_timeout = Math.floor(Math.random()*90000+10000);
					//var move_timeout = 1;
					this.render_calls = Math.floor(Math.random()*100) + 5;
					this.timeout = setTimeout(this.handleUpdate.bind(this), move_timeout);
				},
				*/
				BattleCallback: function(encounter_data) {
					if (encounter_data.won) {
						S$.game_stats.buildings_destroyed++;
						if (this.data.custom_data) {
							this.RemoveCustomBuilding(this.data.parent_data, this.data.x, this.data.y);
						} else {
							S$.RemoveStandardBuilding(this.data);
						}
						if (this.data.type !== SF.TYPE_ANIMAL && this.data.type !== SF.TYPE_GOODY_HUT && this.data.type !== SF.TYPE_DERELICT) {  // Animals don't leave ruins. Perhaps they could come back after time.
							if (this.data.faction !== SF.FACTION_PIRATE) {
								S$.ChangeRaceAlignment(this.data.parentData.systemData.raceseed, -2);
							}
							let custom_data = {name: "Ruins of "+this.data.name[0], seed: this.data.seed, building_name:this.data.name[0]+" "+this.data.name[1], time: S$.time};
							if (this.data.parentData.type === SF.TYPE_PLANET_DATA) {
								S$.AddCustomBuilding(this.data.parentData, this.data.seed, SF.TYPE_RUINS, this.data.x, this.data.y, custom_data);		
							} else { // Asteroid belt.
								//let index = this.data.index;
								//let asteroid_data = this.data.parentData.asteroids[index];
								S$.AddCustomBuilding(this.data.parentData, this.data.seed, SF.TYPE_RUINS, this.data.x, this.data.y, custom_data);		
							}							
						}
						if (this.data.parentData.ResetSurfaceCache) {
	            this.data.parentData.ResetSurfaceCache();
						}
						this.leave();
						return;
					}
					// If no win or lose, remain in the building if possible.
					// Note some types like animals can't be visited.
					if (this.data.faction === SF.FACTION_NORMAL/*this.friendly*/ && this.data.type !== SF.TYPE_ANIMAL && this.data.type !== SF.TYPE_GOODY_HUT) {
	          SG.activeTier = this;
	          this.renderer = new SBar.BuildingRenderer(this);
	          this.renderer.render();
					} else {
						this.leave();
				  }
				},								
				ToBattle: function(attacking) {
					let battle_type = this.data.type === SF.TYPE_ANIMAL ? SF.BATTLE_ANIMAL : SF.BATTLE_SHOP;
					let params = {};
					if (this.data.type === SF.TYPE_TEMPLE) {
						params["description"] = "\"Hey come join the party!\"";
					} else if (this.data.type === SF.TYPE_ALPHA_DANCE) {
						//params["description"] = "\"Oh hey, you're back. Are you ready to die yet? Well I guess you wouldn't remember... but we both agreed, and you're still wearing that silly hat. Look, I'm not happy about it, either. So let's just get this over with.\"";
						params["description"] = "\"Are you ready to die yet?";
						/*let has_omega = false;
						for (let crew of S$.crew) {
							for (let arti of crew.artifacts) {
								let skill = new SBar.Skill(arti);
								for (let effect of skill.ability.effects) {
									if (effect.omega_fragment_effect) {
										has_omega = true;
									}
								}
							}
						}
						*/
						let wmd_fragment_name = SU.WmdFragmentName();
						if (wmd_fragment_name) {
							params["description"] += "\n\n"+wmd_fragment_name+" begins to hum an ominous tune."
						}
						// Player shouldn't be able to win the dance floor, but just in case they win a WMD.
						params["reward"] = {artifact: SBar.ArtifactData(/*seed=*/1, /*raceseed=*/1, /*level=*/1, SF.SKILL_TRUE_OMEGA)};
					}
					SU.PushBattleTier(new SBar.BattleBuilder(battle_type, this.data, attacking, this.BattleCallback.bind(this), params));
					if (this.data.type === SF.TYPE_ALPHA_DANCE) {
						SU.MaybeShowChapter(4);
					}					
				},
        handleKey: function(key) {
            switch (key) {
                case SBar.Key.X:
                    this.leave();
                    break;
                case SBar.Key.T:
                    this.renderer.doTrade();
                    break;
										/*
                case SBar.Key.H:
									this.renderer.Hire();
									break;
										*/
                case SBar.Key.A:
									// Attack.
									SG.death_message = "Killed by picking a fight with the peaceful.";
									this.ToBattle(/*attacking=*/true);
									break;
                case SBar.Key.NUM1:
                case SBar.Key.NUM2:
                case SBar.Key.NUM3:
									this.renderer.doInspect(key-SBar.Key.NUM1);
									break;
                default:
                    error("unrecognized key pressed in building: " + key);
            }
        },
        leave: function() {
					
            this.justentered = true;
						S$.done_intro = true;
						SU.PopTier();
						//this.teardown();
        },
        teardown: function() {
					//if (this.timeout != null) {
					//	clearTimeout(this.timeout);
					//}
					if (this.renderer) {
	          this.renderer.teardown();
						this.renderer = null;
					}
        }
    };
    SU.extend(SBar.BuildingTier, SBar.Tier);
})();
