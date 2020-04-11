/*
 * Building trade object
 */

(function() {
	job_offset = 1.23;
	
	// Scale of 0 - 10.
	let MINERAL_TERMS = [
		"nonexistent",
		"pathetic",
		"meager",
		"weak",
		"poor",
		"solid",
		"flush",
		"rich",
		"lush",
		"opulent",
		"magnificent",
	];

  SBar.BuildingTrade = function(buildingDataIn, /*optional*/seed_off) {
      this._initBuildingTrade(buildingDataIn, seed_off);
  };

  SBar.BuildingTrade.prototype = {
    seed: null,
    data: null,
    tier: null,
    offertext: null,
    wanttext: null,
    available: true,
    canpay: true,
    canhold: true,
    // trade-specific stuff
    drinkname: null,
    cost: null,
    offer: null,
    costtype: null,
    offertype: null,
    arti: null,
    //drinksOrdered: 0,
    //isHomeBar: null,
		trade_text: null, // Overrides "T: Trade".
    numBought: 0,
		doTrade: null,
		doInspect: null,
		skip_redraw: false,  // If true, don't redraw the menu + text at the end of the trade.
		triple_trade: false,  // Show 3 trade windows (3 instantiations) rather than 1.
		buy_text: null,  // Optional text for the purchase hotkey in the text on right.
		
    _initBuildingTrade: function(buildingDataIn, seed_off) {
      this.data = buildingDataIn;
      this.tier = this.data.tier;
      //this.isHomeBar = this.tier.isHomeBar;
      this.offertext = [];
      this.costtext = [];
      //while (S$.found(this.data.seed + this.numBought)) {
      //    this.numBought++;
      //}
      this.seed = this.data.seed;// + this.numBought;
			if (seed_off) {
				this.seed += seed_off;
			}
      //this.available = !S$.found(this.seed);
			let near_level = this.data.level;
			let level_seed = SU.r(this.seed+S$.time, 31.32);
			if (level_seed < 0.15) {
				near_level--;
			} else if (level_seed > 0.85) {
				near_level++;
			}
			near_level = capLevel(near_level);
			let week = S$.GetWeek();

      switch (this.data.type) {
        case SF.TYPE_BAR:
        case SF.TYPE_TEMPLE_BAR:
            // shiny for drink
            this.drinkname = (this.data.faction === SF.FACTION_PIRATE ? "Grog" : ST.barDrink(this.seed + S$.time));
						if (S$.conduct_data['nonalcoholic']) {
							this.drinkname = "Virgin "+this.drinkname;
						}
						// Cost is 1-to-level.
						//var cost_base = SU.r(this.seed+S$.time, 7.71);
						//this.cost = Math.floor(cost_base*cost_base*10*this.data.level)+1;
						this.cost = Math.floor(SU.r(this.seed+S$.time, 7.71)*this.data.level)+1;
						if (this.tier.isHomeBar) {
							this.cost = 0;  // It's on the house.
						}
						this.trade_text = "Buy a Drink";						
            this.offertext.push(this.drinkname);
            this.offertext.push("On Tap");
						let cost_text = "";
						if (this.cost === 0) {
	            cost_text = "On the house";
						} else {
							cost_text = SF.SYMBOL_CREDITS+this.cost;
						}
            this.costtext.push(cost_text+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
						if (S$.NumDrinks() > 0) {
							if (S$.NumDrinks() > 1) {
								this.costtext.push(S$.NumDrinks()+" drinks consumed");
							} else {
								this.costtext.push("1 drink consumed");
							}
						}
            this.canpay = S$.credits >= this.cost;
            this.doTrade = this.barTrade;
						//}
          break;
        case SF.TYPE_MINING: 
        case SF.TYPE_LAB:
					this.triple_trade = true;
					{  // Avoid 'let' issues.
					if (this.CheckSoldOut()) {
						return;
					}
          var type = SU.r(this.seed, 12.12);
					
					let cargo_type;
					if (this.data.type === SF.TYPE_MINING) {
						cargo_type = SF.CARGO_ORE;
					} else if (this.data.faction === SF.FACTION_PIRATE) {
						cargo_type = SF.CARGO_CONTRABAND;
					} else {
						cargo_type = SF.CARGO_GOODS;
					}
					
					this.cost = SF.LEVEL_XP[near_level] * ((SU.r(this.seed, 89.1)/2+0.5))/4;
					if (cargo_type === SF.CARGO_ORE) {
						this.cost /= 3;
					}
					this.cost = round2good(this.cost);
					if (this.cost < 1) {
						this.cost = 1;
					}
						//this.cost *= 100;
          //this.cost = Math.round(this.cost);

					this.arti = SBar.CargoArtifactData(SU.r(this.seed, 14.14), this.data.raceseed, near_level, cargo_type);
					this.arti.cost = this.cost;
          //this.offertext = this.arti.getShopText();
					let skill = new SBar.Skill(this.arti);
	        //var stats = arti.getShopText();
					//this.offertext.push(skill.name);
					this.offertext.push(skill.name+" ("+SF.SYMBOL_LEVEL+skill.level+")");
					
					let summary = skill.SummaryText();
					if (summary.length > 0) {
						this.offertext.push(summary)
					}
					
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
					this.costtext.push("\n"+this.TimeLeft()+" left");
          //this.doTrade = this.artiTrade;
          this.doInspect = this.miningInspect;
          this.canpay = S$.credits >= this.cost;
				  }
          break;
        case SF.TYPE_CITY_ARTI:
        case SF.TYPE_CITY_ORE:
        case SF.TYPE_CITY_GOODS:
        case SF.TYPE_CITY_CONTRA:
        case SF.TYPE_CITY_ALL:
        case SF.TYPE_CITY_SPECIAL:
        case SF.TYPE_CITY_SHIP:
        case SF.TYPE_COLONY:
		      S$.find(this.seed);
					this.skip_redraw = true;
					this.city_data = S$.foundData[this.seed];
					if (this.city_data === undefined || this.city_data.week != week) {
						// Reset the amount of cash available.
						this.city_data = {cash: round2good(SF.LEVEL_XP[near_level] * 5 * (SU.r(this.seed, 61.34)*0.4+0.8)), week: week};
						S$.foundData[this.seed] = this.city_data;
					}					
					
					switch (this.data.type) {
		        case SF.TYPE_CITY_ARTI:
							this.offertext.push("Buying unimprinted technology of all types.");
							break;
		        case SF.TYPE_CITY_ORE:
							this.offertext.push("Buying all minerals");
							break;
		        case SF.TYPE_CITY_GOODS:
							this.offertext.push("Buying all goods");
							break;
		        case SF.TYPE_CITY_CONTRA:
							this.offertext.push("Wanted: the good stuff");
							break;
		        case SF.TYPE_CITY_ALL:
							this.offertext.push("Unload cargo here");
							break;
		        case SF.TYPE_CITY_SPECIAL:
							this.offertext.push("Trendy items needed");
							break;
		        case SF.TYPE_CITY_SHIP:
							this.offertext.push("Ships wanted");
							break;
		        case SF.TYPE_COLONY:
							this.offertext.push("Critical supplies needed");
							break;
						default:
							error("errctype");
					}
					this.trade_text = "Examine Offers"
					this.costtext.push("Cash on hand: "+SF.SYMBOL_CREDITS+this.city_data.cash)
					if (this.data.type === SF.TYPE_COLONY) {
						this.costtext.push("Supplies restock in "+this.TimeLeft())
					} else if (this.data.type === SF.TYPE_CITY_SPECIAL) {
						this.costtext.push("Trends change in "+this.TimeLeft())
					} else {
						this.costtext.push("Bank run in "+this.TimeLeft())
					}
					this.canpay = true;
					this.doTrade = this.cityTrade;
          break;
        case SF.TYPE_ARMORY:
					this.triple_trade = true;
					{  // Avoid 'let' issues.
					if (this.CheckSoldOut()) {
						return;
					}
					var bought = this.GetNumBought();

          var type = SU.r(this.seed, 12.12);
					
					this.cost = round2good(SF.LEVEL_XP[near_level] * (SU.r(this.seed, 89.1)+1)/4);
					
					if (this.data.faction === SF.FACTION_PIRATE) {
						this.arti = SBar.ArtifactData(this.seed + 8.8 + week, this.data.raceseed, near_level, SF.SKILL_PIRATE);
						this.cost *= 3;
          } else if (type < 0.3) {
						this.arti = SBar.ArtifactData(this.seed + 8.82 + week, this.data.raceseed, near_level, SF.SKILL_BOOST);
						this.cost *= 2;
          } else if (type < 0.6) {
						this.arti = SBar.ArtifactData(this.seed + 8.83 + week, this.data.raceseed, near_level, SF.SKILL_STATS);
						// Leave at base cost.
          } else if (type < 0.9) {
						this.arti = SBar.ArtifactData(this.seed + 8.84 + week, this.data.raceseed, near_level, SF.SKILL_STANDARD);
						this.cost *= 3;
          } else {
						this.arti = SBar.ArtifactData(this.seed + 8.85 + week, this.data.raceseed, near_level, SF.SKILL_ALPHA);
						this.cost *= 10;
          }
					this.cost = round2good(this.cost);
					this.arti.cost = this.cost;
						//this.cost *= 100;
          //this.cost = Math.round(this.cost);

          //this.offertext = this.arti.getShopText();
					let skill = new SBar.Skill(this.arti);
	        //var stats = arti.getShopText();
					//this.offertext.push(skill.name);
					this.offertext.push(skill.name+" ("+SF.SYMBOL_LEVEL+skill.level+")");
					let summary = skill.SummaryText();
					if (summary.length > 0) {
						this.offertext.push(summary)
					}
					
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
					this.costtext.push("\n"+this.TimeLeft()+" left");
          //this.doTrade = this.artiTrade;
          this.doInspect = this.artiInspect;
          this.canpay = S$.credits >= this.cost;
				  }
          break;
				case SF.TYPE_HOTEL:
					this.triple_trade = true;
					this.buy_text = "Purchase";
					let level_off = Math.floor(SU.r(this.seed, 81.23)*3)-1;
					this.hotel_level_limit = capLevel(this.data.level + level_off);
					let service_name = ST.HotelService(this.seed);
					this.offertext.push(service_name);
					this.hotel_morale_level = Math.floor(SU.r(this.seed, 81.24)*3);
					this.hotel_service_time = SU.r(this.seed, 81.25)*20+4; // Hours.
					
					let base_cost = SF.LEVEL_XP[this.data.level]/10+1;
					base_cost *= (this.hotel_morale_level)+1;
					base_cost *= (level_off+3)/3;
					base_cost = base_cost * 3 / Math.sqrt(this.hotel_service_time);  // Long time costs less intentionally.
					base_cost = round2good(base_cost);
					this.hotel_service_time *= (this.hotel_morale_level/2)+1;  // But high level also takes longer.
					this.hotel_service_time = Math.floor(this.hotel_service_time);

					this.offertext.push(SU.TimeString(this.hotel_service_time)+"\n"+"Up to "+SF.SYMBOL_LEVEL+this.hotel_level_limit);
					
					this.cost = round2good(base_cost);
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
          this.canpay = S$.credits >= this.cost;
          this.doInspect = this.hotelTrade;
					break;
				case SF.TYPE_OBSERVATORY:
					if (S$.found(this.data.seed)) {
						this.available = false;
						this.offertext.push("Sold out");
						return;
					}
					this.cost = this.data.level*(Math.floor(SU.r(this.seed, 5.67))*5+5);
					this.distance = this.data.level*(Math.floor(SU.r(this.seed, 5.67)*35)+30);
					this.offertext.push("Regional starchart\n"+coordToParsec(this.distance)+" pc"); 
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
					this.costtext.push("\n"+this.TimeLeft()+" left");
          this.canpay = S$.credits >= this.cost;
          this.doTrade = this.observatoryTrade;
					break;
			  case SF.TYPE_JOB:
					this.triple_trade = true;
					if (this.CheckSoldOut("Check back later")) {
						return;
					}
					this.job_level = near_level;
					if (this.job_level > 1 && SU.r(this.seed, 103.1) < 0.5) {
						this.job_level = 1;
					}
					this.job_week = week;
					let quest = this.GetQuestDisplay(/*callback=*/undefined);
					let qdata = quest.getQuest();
					this.offertext.push(qdata.name);
					if (this.job_level === 1 && this.data.faction === SF.FACTION_NORMAL) {
						this.offertext.push("Basic Delivery ("+SF.SYMBOL_CREDITS+qdata.getMoneyReward()+")");
					} else {
						this.offertext.push("Advanced Delivery\n"+SF.SYMBOL_LEVEL+near_level);
					}
					this.offertext[this.offertext.length-1] = this.offertext[this.offertext.length-1] + "\n"+quest.getDistance(qdata);
					
					this.costtext.push("\n"+this.TimeLeft()+" left");
					this.canpay = !S$.found(this.tier.data.seed + job_offset + S$.GetWeek());
					this.doInspect = this.jobTrade;
					//this.doTrade = this.jobTrade;
					//this.trade_text = "Seek Job";
					this.buy_text = "Inquire";
					break;
			  case SF.TYPE_SHIPYARD:
					this.triple_trade = true;
					if (this.CheckSoldOut()) {
						return;
					}
					var bought = this.GetNumBought();
          var type = SU.r(this.seed, 12.13);
					
					if (type < 0.5) {
						if (this.data.faction === SF.FACTION_PIRATE) {
							this.ship = new SBar.Ship(SF.SHIP_PIRATE, near_level, this.seed+week, this.data.raceseed);
						} else {
							this.ship = new SBar.Ship(SF.SHIP_COMMON, near_level, this.seed+week, this.data.raceseed);
						}
						this.cost = round2good(this.ship.GetValue());
						this.ship.cost = this.cost;
						this.offertext.push(this.ship.name+" ("+SF.SYMBOL_LEVEL+this.ship.level+")");
						this.doInspect = this.shipInspect;
					} else {
						this.arti = SBar.ArtifactData(this.seed + 8.81 + week, this.data.raceseed, near_level, SF.SKILL_SHIP);
						this.cost = round2good(SF.LEVEL_XP[near_level] * (SU.r(this.seed, 89.1)+1)/4);
						this.arti.cost = this.cost;
						let skill = new SBar.Skill(this.arti);
						this.offertext.push(skill.name+" ("+SF.SYMBOL_LEVEL+skill.level+")");
						let summary = skill.SummaryText();
						if (summary.length > 0) {
							this.offertext.push(summary)
						}
	          this.doInspect = this.artiInspect;
					}
          this.canpay = S$.credits >= this.cost;
					//this.offertext.push(this.ship.name);
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
					this.costtext.push("\n"+this.TimeLeft()+" left");
					break;
				case SF.TYPE_GOODY_HUT:
					// Goody hut, no trades.
					break;
			  case SF.TYPE_ARENA:
					this.triple_trade = true;
					if (this.CheckSoldOut("Check back later")) {
						return;
					}
					this.buy_text = "Fight!";
					this.arena_level = capLevel(this.data.level+Math.floor(SU.r(this.seed, 81.23)*3)-1); // -1 to +1.
					var bought = this.GetNumBought();

					var week2 = week + bought;
					//this.skip_redraw = true;
					//this.arena_level = Math.min(bought+1, this.data.level);
          //this.doTrade = this.arenaBattle;
          this.doInspect = this.arenaBattle;
					
					// Matches BattleBuilder.
					// battlebuilder.tact_data.battle_name
					//this.trade_text = "Enter Arena";
					this.cost = 0;
					this.canpay = true;
					this.arena_seed = this.seed+week2;
					this.arena_purse = round2good(SF.LEVEL_XP[this.arena_level]/4*(1+SU.r(this.arena_seed, 31.1)/2));
					this.battle_name = ST.BattleName(this.arena_seed, /*attacking=*/true, this.data.name);	
					this.offertext.push(this.battle_name+" ("+SF.SYMBOL_LEVEL+this.arena_level+")");
					this.costtext.push("Prize Purse: "+SF.SYMBOL_CREDITS+this.arena_purse);
					this.costtext.push("\n"+this.TimeLeft()+" left");
					break;
        case SF.TYPE_CONSTRUCTION:
					// Note this doesn't currently upgrade newly created buildings. That's just feature gap - hassle to implement.
					var bought = this.GetNumBought();
					var week2 = week + bought;
					let is_arth = this.data.parentData.is_arth;  // Building a bar on Arth is necessary.
					let build_new = SU.r(this.seed, week2+1.1) < 0.5 || is_arth;
					let found_place = false;
					//let found_index = 0;
					if (build_new) {
						let asteroid_index;
						if (this.data.parentData.type === SF.TYPE_PLANET_DATA) {
							let num_existing = this.data.parentData.buildingdata.length;
							if (S$.custom_buildings[this.data.parentData.seed]) {
								// O(n) object length is quick here.
								num_existing += Object.keys(S$.custom_buildings[this.data.parentData.seed]).length;
							}
							// Just don't put too many buildings on the planet.
							found_place = num_existing < 10 || is_arth;
							if (found_place) {
								// Generate a temp building just to get it placed on the planet.
								// Just use a random x,y to scramble the seed.
					      let temp_building = new SBar.BuildingData(this.data.parentData, SU.r(this.seed, week2+13.2)*1000, SU.r(this.seed, week2+13.3)*1000, -1, -1);
								this.data.parentData.PlaceBuilding(temp_building, /*do_custom=*/true);
								this.construction_x = temp_building.x;
								this.construction_y = temp_building.y;
							}
						} else {  // Belt.
							let candidates = [];
							for (let asteroid of this.data.parentData.asteroids) {
								if (!asteroid.bdata && !S$.ExistsCustomBuilding(this.data.parentData.seed, asteroid.x, asteroid.y)) {
									let xy = asteroid.x+","+asteroid.y;
									candidates.push(asteroid);
								}
							}
							if (candidates.length > 0) {
  							let selected_index = Math.floor(SU.r(this.seed, week2+7.1)*candidates.length);
								found_place = true;
								this.construction_x = candidates[selected_index].x;
								this.construction_y = candidates[selected_index].y;
								//found_index = candidates[selected_index];
							}
						}
						if (found_place) {
							// This maybe should get combined with planet / belt generation of building types.
							let faction = this.data.faction;
							let type;
							let type_rand = SU.r(this.seed, week2+7.2);
							if (faction === SF.FACTION_PIRATE) {
								if (type_rand < 0.2) {
									type = SF.TYPE_BAR;
								} else if (type_rand < 0.4) {
									type = SF.TYPE_LAB;
								} else if (type_rand < 0.6) {
									type = SF.TYPE_ARMORY;
								} else if (type_rand < 0.8) {
									type = SF.TYPE_ARENA;
								} else {
									type = SF.TYPE_SHIPYARD;
								}
							} else {
								if (type_rand < 0.15) {
									type = SF.TYPE_BAR;
								} else if (type_rand < 0.3) {
									type = SF.TYPE_ARMORY;
								} else if (type_rand < 0.45) {
									type = SF.TYPE_CITY;
								} else if (type_rand < 0.6) {
									type = SF.TYPE_HOTEL;
								} else if (type_rand < 0.75) {
									type = SF.TYPE_JOB;
								} else if (type_rand < 0.9) {
									type = SF.TYPE_SHIPYARD;
								} else {
									type = SF.TYPE_LAB;
								}
							}
							if (is_arth) {
								type = SF.TYPE_BAR;
							}
							this.construction_type = type;
							// Custom buildings will use raw data for storage. This test_building is just to pull up its name.
				      let test_building = new SBar.BuildingData(this.data.parentData, this.construction_x, this.construction_y, type, faction);
							this.construction_seed = test_building.seed;
							if (is_arth) {
								test_building.name = this.GetArthBarName();
							}
							let name_text = test_building.name[0]+" "+test_building.name[1];
							if (!is_arth) {
								name_text += " "+SF.SYMBOL_LEVEL+capMaxLevel(this.data.level)
							}
							
							this.offertext.push("New Building Schematics:");
							this.offertext.push(name_text);
							
							this.cost = round2good(SF.LEVEL_XP[this.data.level] * (SU.r(this.seed, week2+1.12) + 1)/2);
							if (is_arth && S$.conduct_data['no_money']) {
								this.cost = 0;  // For no-money conduct.
							}
		          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
		          this.canpay = S$.credits >= this.cost;
							this.doTrade = this.constructionBuild;							
						}
					}
					if (!build_new || !found_place) {
						let candidates = [];
						if (this.data.parentData.type === SF.TYPE_PLANET_DATA) {
							for (let building_data of this.data.parentData.buildingdata) {
								candidates.push(building_data);
							}
						} else {  // Belt.
							for (let asteroid of this.data.parentData.asteroids) {
								if (asteroid.bdata !== null && asteroid.bdata !== undefined) {
									candidates.push(asteroid.bdata);
								}
							}
						}
						if (candidates.length === 0) {
							this.offertext.push("No projects currently available.");
						} else {
							let target_index = Math.floor(SU.r(this.seed, week2+1.11)*candidates.length);
							this.target_bdata = candidates[target_index];
							this.offertext.push("Upgrade Schematics:");
							this.offertext.push(this.target_bdata.name[0]+" "+this.target_bdata.name[1]+" "+SF.SYMBOL_LEVEL+capMaxLevel(this.target_bdata.level+1));
							
							this.cost = round2good(SF.LEVEL_XP[this.target_bdata.level+1] * (SU.r(this.seed, week2+1.13) + 1));
		          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
		          this.canpay = S$.credits >= this.cost;
							this.doTrade = this.constructionUpgrade;							
						}
					}
					
					this.costtext.push("\nNext plan in: "+this.TimeLeft());
          break;
			  case SF.TYPE_UNIVERSITY:
					this.stat_num = Math.floor(SU.r(this.seed, 4.12)*SF.NUM_STATS);
					let stat_symbol = SF.STAT_NAME[this.stat_num];
					this.max_stat = capStat(this.data.level*5+Math.floor(SU.r(this.seed, 4.13)*5));
					this.training_time = 24*7;
					var bought = this.GetNumBought();
					
					this.cost = round2good(SF.LEVEL_XP[this.data.level] * ((SU.r(this.seed, 89.7)/2+0.5+bought/10))/3)+1;
					this.offertext.push("+1 "+stat_symbol);
					this.offertext.push("Up to max: "+this.max_stat+" "+stat_symbol);
					this.offertext.push("Training time: "+SU.TimeString(this.training_time));
          this.costtext.push(SF.SYMBOL_CREDITS+this.cost+" ("+SF.SYMBOL_CREDITS+S$.credits+")");
          this.canpay = S$.credits >= this.cost;
					this.available = this.UniversityAnyToChange();
					this.doTrade = this.universityTrade;
					this.trade_text = "Go to School";
					break;
        default:
          error("Unrecognized building type (utrade): " + this.data.type);
      }
    },
		TimeLeft: function() {
			var week = S$.GetWeek();
			var time = (week+1)*24*7 - S$.time;
			//return "⧗ "+Math.floor(time/24)+" "+Math.floor(time%24)+":00";
			return "⧗"+Math.floor(time/24)+":"+Math.floor(time%24);
		},
		// Common setup if the item is sold out for the week.
		CheckSoldOut: function(message) {
			var last_purchase = S$.foundData[this.seed];
			var week = S$.GetWeek();
			if (last_purchase !== undefined && last_purchase === week) {
				this.available = false;
				if (message) {
					this.offertext.push(message);
				} else {
					this.offertext.push("Sold out");
				}
				this.offertext.push(this.TimeLeft());
				return true;
			}
			return false;
		},
		// Sell out for the week.
		SellOut: function() {
			if (!S$.foundData[this.seed]) {
	      S$.find(this.seed);
			}
			S$.foundData[this.seed] = S$.GetWeek();			
		},
		constructionUpgrade: function() {
			this.target_bdata.level = capMaxLevel(this.target_bdata.level+1);
			let new_level = this.target_bdata.level;
			S$.custom_building_levels[this.target_bdata.seed] = new_level;
			this.AddOneBought();
      S$.RemoveCredits(this.cost);
      this.AddJournal("Construction upgrade");			
			S$.game_stats.buildings_upgraded++;
			SE.PassTime(1);
      this._initBuildingTrade(this.data);  // Refresh selection, and may have modified this building.
		},
		GetArthBarName: function() {
			return [S$.crew[0].name+"'s", "SPACEBAR-"+(S$.bars_built_on_arth+1)];
		},
		constructionBuild: function() {
			let params = {faction:this.data.faction, level: this.data.level};
			if (this.data.parentData.is_arth) {
				params["name"] = this.GetArthBarName();
			}
			S$.AddCustomBuilding(this.data.parentData, this.construction_seed, this.construction_type, this.construction_x, this.construction_y, params);
			if (this.data.parentData.type === SF.TYPE_PLANET_DATA) {
				this.data.parentData.ResetSurfaceCache();
			}
			this.AddOneBought();
      S$.RemoveCredits(this.cost);
      this.AddJournal("New construction");			
			S$.game_stats.buildings_built++;
			if (this.data.parentData.is_arth) {
				S$.bars_built_on_arth++;
			}
			SE.PassTime(1);
      this._initBuildingTrade(this.data);  // Refresh selection, and may have modified this building.
		},
    barTrade: function() {
			if (this.tier.isHomeBar && S$.time < 288 /*12 days, 5 after start*/ && SU.MaybeShowChapter(1)) {
//				this._initBuildingTrade(this.data);
				this.skip_redraw = true;
				return;
			}
			/*
			if (S$.conduct_data['nonalcoholic']) {
				this.tier.renderer.speak("No drinks, by choice...", 3000);
				return;
			}
			*/
			// Chance of giving another drink.
			if (S$.IsDrunk() && SU.r(this.seed, 74.1+S$.time) < 0.3 && this.data.faction !== SF.FACTION_PIRATE) {
				var enough_message = ST.barEnough(this.data.seed);
        this.tier.renderer.speak(enough_message, 3000);
				return;
			}
			S$.game_stats.drinks++;
      this.AddJournal("Ordered " + this.drinkname);
      //S$.logMessage("Ordered " + this.drinkname + " from " + this.data.name[0] + " " + this.data.name[1]);
      //S$.addKnownBar(this.seed);
      S$.find(this.seed);
      S$.RemoveCredits(this.cost);
      var advice = null;
			S$.HaveDrink();
			this.skip_redraw = false;
			
			SE.PassTime(1);
			var me = this;
      var redraw_callback = function() {
        me.tier.renderer.drawMenu()
      };
			
			var bar_event = SU.r(this.seed, 64.1+S$.time);
			//this.bar_event = 0.55;
			this.skip_redraw = false;
			if (!S$.conduct_data['no_crew'] && (bar_event < 0.1 || (/*bar_event < 0.5 && */S$.crew.length <= 1))) {
				// Hire.
				this.skip_redraw = true;
        var callback = function() {
					redraw_callback();
        };
        var new_tier = new SBar.HireDisplay(this.tier.data.seed, this.tier.data.raceseed, this.tier.data.level, callback);
				new_tier.is_pirate = this.data.faction === SF.FACTION_PIRATE;
				SU.PushTier(new_tier);
			} else if (bar_event < 0.5) {
				// Gossip.
				this.skip_redraw = true;
				SU.ShowWindow("Inebriated Gossip", ST.barGossip(this.seed, this.data.faction+".", S$.time), redraw_callback, '🗣');
			} else if (bar_event < 0.6) {
				// Bar fight if pirate. Nothing otherwise.
				if (this.data.faction === SF.FACTION_PIRATE) {
					this.skip_redraw = true;
					this.barFightBattle();
				}
			} else {
				// Location details.
				this.skip_redraw = true;
				let rumor = this.LocationRumor();
				SU.ShowWindow("An Open Secret", rumor, redraw_callback, 'X');
			}
			
      this._initBuildingTrade(this.data);
    },
		// Returns text for a location rumor (mining or building information).
		LocationRumor: function() {
			let system = null;
			if (SG.starmap === null) {
				// Not yet initialized on top tier.
        system = new SBar.RegionData(0, 0).GetRandomSystem(this.seed);
			} else {
				let starmap = SG.starmap;
				let region_index = Math.floor(SU.r(this.seed, 88.1+S$.time)*starmap.region_icons.length);
				system = starmap.region_icons[region_index].data.GetRandomSystem(this.seed);
			}
			
			let pirate = this.data.faction === SF.FACTION_PIRATE;
			let text = "Let me pass along a little tip for you, kid. This is a secret but I don't need it anymore so don't go blabbing... ";
			if (system === null) {
				text += "Well, then again... I got nothing.";
				return text;
			}
			system.generate();
			// Belt minerals.
			if (SU.r(this.seed, 88.1+S$.time) < 0.25 && system.belts.length > 0) {
				let belt_index = Math.floor(SU.r(this.seed, 88.1+S$.time)*system.belts.length);
				let belt = system.belts[belt_index];
				belt.generate();
				text += "There's an asteroid belt named "+belt.name+" in system "+system.name+".";
				text += " You can find it at "+coordToParsec(system.x) + ", " + coordToParsec(-system.y) + " pc.";
				text += " The minerals in that belt are "+MINERAL_TERMS[Math.round(belt.GetAreaMinerals()*10)]/*Math.round(belt.GetAreaMinerals()*100)*/+".";
				return text;
			}
			// Planet minerals.
			if (SU.r(this.seed, 88.1+S$.time) < 0.5 && system.planets.length > 0) {
				let planet_index = Math.floor(SU.r(this.seed, 88.2+S$.time)*system.planets.length);
				let planet = system.planets[planet_index];
				planet.generate();
				text += "There's a planet named "+planet.name+" in system "+system.name+".";
				text += " You can find it at "+coordToParsec(system.x) + ", " + coordToParsec(-system.y) + " pc.";
				let minerals = Math.round(planet.GetAreaMinerals()*10);
				if (pirate) {
					// Pirates lie for fun.
					minerals = Math.floor(SU.r(this.seed, 88.6+S$.time)*10);
				}
				text += " The minerals on that planet are "+MINERAL_TERMS[minerals]+".";
				return text;
			}
			// Any building.
			let buildings = [];
			for (let belt of system.belts) {
				belt.generate();
				for (let asteroid of belt.asteroids) {
					if (asteroid.bdata) {
						buildings.push([asteroid.bdata, belt]);
					}
				}
			}
			for (let planet of system.planets) {
				planet.generate();
				for (let building of planet.buildingdata) {
					buildings.push([building, planet]);
				}
			}
			if (buildings.length === 0) {
				text += "Ah, forget it, kid. I changed my mind...";
				return text;
			}
			let building_index = Math.floor(SU.r(this.seed, 88.4+S$.time)*buildings.length);
			let building = buildings[building_index];
			text += "There's a place named "+building[0].name[0]+" "+building[0].name[1]+" at "+building[1].name+" in the "+system.name+".";
			text += " You can find it at "+coordToParsec(system.x) + ", " + coordToParsec(-system.y) + " pc.";
			text += " I'll never forget that place... but I should say no more.";
			return text;
		},
		artiInspect: function() {
			var target = this.arti.params.length > 0 && this.arti.params[0].type == SF.SKILL_SHIP ? S$.ship : S$.crew[0];
			SU.PushTier(new SBar.ArtifactComplexRenderer(target, this.arti, /*view_only=*/!this.canpay, /*browse=*/this.canpay, this.completeArtiTrade.bind(this)));			
		},
		// Note this completes multiple types of artifact-like purchases (artis, ore, etc).
    completeArtiTrade: function(completed) {
			if (!completed) {
				return;
			}
			if (this.arti.params[0].cargo_type === SF.CARGO_CONTRABAND) {
				for (let i = 1; i < S$.crew.length; i++) {
					SE.ApplyMorale(SE.MORALE_CONTRABAND, S$.crew[i]);
				}
			}
//				this.skip_redraw = true;
				this.SellOut();
				// this.AddOneBought();

	      S$.RemoveCredits(this.cost);
	      this.AddJournal("Bought "+(new SBar.Skill(this.arti)).name);			
				this.costtext[1] = "(" + S$.credits + " on hand)";
				//var temp_arti = this.arti;
				delete this.arti;
				delete this.doInspect;
				delete this.doTrade;
        this._initBuildingTrade(this.data);
        this.tier.renderer.drawMenu();
				//var target = temp_arti.type == SF.SKILL_SHIP ? S$.ship : S$.crew[0];
				//SU.PushTier(new SBar.ArtifactComplexRenderer(target, temp_arti, /*view_only=*/false));			
    },
		/*
    licenseTrade: function() {
        S$.credits -= S$.licenseCost;
        S$.licenseCost *= 10;
        this.costtext[1] = "(" + S$.credits + " on hand)";
        if (S$.faction === SF.FACTION_NORMAL) {
            S$.setFaction(SF.FACTION_PIRATE);
        } else {
            S$.setFaction(SF.FACTION_NORMAL);
        }
        //S$.setHomeBar(this.data);
        //this.isHomeBar = true;
        this.drinksOrdered = 0;
        this._initBuildingTrade(this.data); // switch to selling
        //SU.saveGame();
    },
		*/
		ArenaBattleCallback: function(encounter_data) {
			if (encounter_data.won) {
				this.AddOneBought();
			}
      this._initBuildingTrade(this.data);
      //SG.activeTier = this.tier;
      this.tier.renderer = new SBar.BuildingRenderer(this.tier);
      this.tier.renderer.render();
		},		
		arenaBattle: function() {
			let orig_level = this.data.level;
			this.data.level = this.arena_level;
			let battle = new SBar.BattleBuilder(SF.BATTLE_ARENA, this.data, /*attacking=*/true, this.ArenaBattleCallback.bind(this),
			  {seed: this.arena_seed, reward: {credits: this.arena_purse}, battle_name: this.battle_name,
		     description: "Out of consideration to their newest victims the Game Master allows you to cower first."});
 			SG.death_message = "Killed in an arena.";
			SU.PushBattleTier(battle);
 		 this.data.level = orig_level;
		},
		barFightBattleCallback: function(encounter_data) {
			// After battle things carry on normally.
      this._initBuildingTrade(this.data);
      SG.activeTier = this.tier;
      this.tier.renderer = new SBar.BuildingRenderer(this.tier);
      this.tier.renderer.render();
		},		
		barFightBattle: function() {
			let battle = new SBar.BattleBuilder(SF.BATTLE_BARFIGHT, this.data, /*attacking=*/false, this.barFightBattleCallback.bind(this),
			   {seed: S$.time, battle_name: ST.BattleName(S$.time, /*attacking=*/true, this.data.name),
				  description: "A bar fight breaks out in the vicinity."});
			SG.death_message = "Killed in a barfight.";
			SU.PushBattleTier(battle);
		},		
		observatoryTrade: function() {
			var data = this.data;
      S$.RemoveCredits(this.cost);
      this.AddJournal("Bought starmap");			
			if (this.data.is_moon) {
        data = this.data.parent_planet_data;
			}
			var system = data.parentData.systemData;
			
      S$.find(this.seed);
			if (SG.starmap) {
				// Might not be initialized yet.
				// This won't work unless space regions are properly set up (not from debug, or visit starmap first).				
				SG.starmap.SensorScan(system.x, system.y, this.distance);
				// Reset data caches.
				this.data.parentData.systemData.ResetNames();
			} else {
				error("nostarmapobserv")
			}
			this._initBuildingTrade(this.data);
      this.tier.renderer = new SBar.BuildingRenderer(this.tier);
      this.tier.renderer.render();
		},
    teardown: function() {

    },
    //doTrade: function() {
    //    error("dotrade needs override");
    //},
		hotelTrade: function() {
			if (SE.PassTime(this.hotel_service_time)) {
				SU.message("Party rested");
	      S$.RemoveCredits(this.cost);
	      this.AddJournal("Hotel service");			
				for (var i = 0; i < S$.crew.length; i++) {
					S$.crew[i].HealFull();
					if (S$.crew[i].base_level <= this.hotel_level_limit) {
						if (this.hotel_morale_level === 0) {
						  SE.ApplyMorale(SE.MORALE_HOTEL_LEVEL1, S$.crew[i]);
						} else if (this.hotel_morale_level === 1) {
						  SE.ApplyMorale(SE.MORALE_HOTEL_LEVEL2, S$.crew[i]);
						} else if (this.hotel_morale_level === 2) {
						  SE.ApplyMorale(SE.MORALE_HOTEL_LEVEL3, S$.crew[i]);
						}
					}
				}
        this._initBuildingTrade(this.data);
				this.tier.renderer.drawMenu();
			}
		},
		GetQuestDisplay: function(callback) {
			return new SBar.QuestDisplay(this.tier.data, callback, this.seed+job_offset+this.job_week, this.job_level);
		},
		jobTrade: function() {
			//this.skip_redraw = true;
      if (S$.quests.length >= SF.MAX_QUESTS) {
          this.tier.renderer.speak("Too many jobs already!", 3000);
          return;
      }
      var callback = function(accepted) {
				if (accepted) {
					this.SellOut();
	        this._initBuildingTrade(this.data);
					this.tier.renderer.drawMenu();
		      this.tier.renderer = new SBar.BuildingRenderer(this.tier);
		      this.tier.renderer.render();
				}
      };
			
      var quest = this.GetQuestDisplay(callback.bind(this));
			SU.PushTier(quest);
		},
		completeShipTrade: function(completed) {
			if (!completed) {
				return;
			}
			
			this.SellOut();
//			this.AddOneBought();

			this.costtext[1] = "(" + S$.credits + " on hand)";

      S$.RemoveCredits(this.cost);
      this.AddJournal("Bought ship: "+this.ship.name);			
			S$.tow_ship = S$.ship;
			S$.game_stats.ships_acquired++;
			S$.ship = this.ship;
			var temp_arti = this.arti;
			delete this.ship;
			delete this.doInspect;
			delete this.doTrade;
			SU.message("Old ship in tow");
      this._initBuildingTrade(this.data);
			this.tier.renderer.drawMenu();
		},
		shipInspect: function() {
			if (S$.tow_ship) {
        this.tier.renderer.speak("Lose your towed ship first.", 3000);
				return;
			}
			if (S$.conduct_data['escape_pod']) {
				SU.message(SF.CONDUCTS['escape_pod'].title);
				return;
			}
			SU.PushTier(new SBar.ArtifactComplexRenderer(this.ship, undefined, /*view_only=*/!this.canpay, /*browse=*/this.canpay, this.completeShipTrade.bind(this)));
		},
		AddOneBought: function() {
			if (!S$.foundData[this.seed]) {
	      S$.find(this.seed);				
				S$.foundData[this.seed] = 1
			} else {
				S$.foundData[this.seed]++;
			}			
		},
		GetNumBought: function() {
			let bought = 0;
			if (S$.foundData[this.seed]) {
				bought = S$.foundData[this.seed];
			}	
			return bought;		
		},
		miningInspect: function() {
			let renderer = new SBar.ArtifactComplexRenderer(S$.ship, this.arti, /*view_only=*/!this.canpay, /*browse=*/this.canpay, this.completeArtiTrade.bind(this));
			renderer.is_cargo = true;
			SU.PushTier(renderer);			
		},
		cityTrade: function() {
			var me = this;
			var draw_callback = function() {
	      me._initBuildingTrade(me.data);						
        me.tier.renderer.drawMenu()
			};
//			this.skip_redraw = true;
			// Ship.
			if (this.data.type == SF.TYPE_CITY_SHIP) {
				if (S$.tow_ship && S$.tow_ship !== SF.SHIP_POD) {
					var offer = Math.min(Math.floor(S$.tow_ship.GetValue()/2), this.city_data.cash);
					var ship_callback = function(key) {
						if (key == SBar.Key.X) {
							// no-op.
						} else if (key == SBar.Key.NUM1) {
							if (S$.tow_ship) {
								S$.AddCredits(offer);
								if (S$.tow_ship.cost) {
									let profit = offer - S$.tow_ship.cost;
									if (profit > 0) {
										S$.AddXp("trade", profit);								
									}
								}
								delete S$.tow_ship;
					      SU.message("Towed ship sold.");
					      me.AddJournal("Towed ship sold.");
								me.city_data.cash -= offer;
							}
						}
			      me._initBuildingTrade(me.data);
						me.tier.renderer.drawMenu();
					}				
					var text = "";
					var keys = [SBar.Key.NUM1, SBar.Key.X];

					text = S$.tow_ship.name+"\nOffering: "+SF.SYMBOL_CREDITS+offer+"\n";
					var tier = new SBar.TextDisplay("Master Negotiator", text, ["1: Sell Ship", "X: Cancel"], keys, ship_callback, '🛸');
					SU.PushTier(tier);
					return;
				} else {
					SU.ShowWindow("Master Negotiator", "You have no ship in tow. I wouldn't leave you without a ship!", draw_callback, '🛸');
				}
				return;
			} // End ship.
			// Artifacts.
			let sell_callback = function(arti, price_callback) {
				let price = price_callback(arti);
				SU.message("Sold "+new SBar.Skill(arti).name);
	      me.AddJournal("Sold "+new SBar.Skill(arti).name);
				S$.AddCredits(price);
				me.city_data.cash -= price;
				if (arti.cost) {
					let profit = price - arti.cost;
					if (profit > 0) {
						S$.AddXp("trade", profit);
					}
				}
        me._initBuildingTrade(me.data);
				me.tier.renderer.drawMenu();				
			}
			
			if (this.data.type == SF.TYPE_CITY_ARTI) {
				let renderer = new SBar.ArtifactComplexRenderer(S$.crew[0]);
				
				let this_seed = this.seed;
				let this_level = this.data.level;
				let price_callback = function(arti) {
					let value = 0;
					let any_arti_seed = 0;
					for (let param of arti.params) {
						value += SF.LEVEL_XP[Math.min(param.level, this_level)]/3;
						any_arti_seed = param.seed;
					}
					value *= 5;
					// Value should be modified by the store. And need something random for the artifact.
					value *= 1-SU.r(this_seed+any_arti_seed, 1.52)/2;
					// Good chance the merchant doesn't want this.
					if (SU.r(me.seed+any_arti_seed, 1.53) < 0.7) {
						value *= SU.r(this_seed+any_arti_seed, 1.54)/3;
					}
					value = Math.min(me.city_data.cash, round2good(value));
					if (arti.imprinted) {
						value = 0;
					}
					return value;
				}
				renderer.price_callback = price_callback;
				renderer.sell_callback = sell_callback;
				SU.PushTier(renderer);			
				return;
			}
			// Cargo (ore, goods, contraband / specialty). Works similar to artifacts.
			let renderer = new SBar.ArtifactComplexRenderer(S$.ship);
			renderer.is_cargo = true;
			
			let this_seed = this.seed;
			let this_level = this.data.level;
			let multipliers;  // [ore, goods, contraband] multipliers.
			if (this.data.type == SF.TYPE_CITY_ORE) {
				multipliers = [2, 0, 0];
			} else if (this.data.type == SF.TYPE_CITY_GOODS) {
				multipliers = [0, 2, 0];
			} else if (this.data.type == SF.TYPE_CITY_CONTRA) {
				multipliers = [0, 0, 3];
			} else if (this.data.type == SF.TYPE_CITY_ALL) {
				multipliers = [0.4, 0.4, 0.4];
			} else if (this.data.type == SF.TYPE_CITY_SPECIAL || this.data.type == SF.TYPE_COLONY) {
				multipliers = [0.1, 0.1, 0.1];
			}
			
			let price_callback = function(arti) {
				let level = arti.params[0].level;
				let cargo_type = arti.params[0].cargo_type;
				let base_value = SU.BaseCargoValue(level, cargo_type);
				let value = base_value;
				if (cargo_type === SF.CARGO_ORE) {
					value *= multipliers[0];
				} else if (cargo_type === SF.CARGO_GOODS) {
					value *= multipliers[1];
				} else {
					value *= multipliers[2];
				}
				let arti_seed = arti.params[0].seed;
				if (this.data.type == SF.TYPE_CITY_SPECIAL && SU.r(this_seed+S$.GetWeek(), arti_seed+1) < 0.2) {
					value = base_value * 5;
				}
				if (tihs.data.type == SF.TYPE_COLONY && SU.r(this_seed+S$.GetWeek(), arti_seed+2) < 0.1) {
					value = base_value * 7;
				}
				value *= SU.r(this_seed, arti_seed + 3) + 0.5;
				value = Math.round(value);
				value = Math.min(me.city_data.cash, round2good(value));
				return value;				
			}
			renderer.price_callback = price_callback.bind(this);
			renderer.sell_callback = sell_callback;
			renderer.merchant_cash = this.city_data.cash;
			SU.PushTier(renderer);			
		},
		UniversityAnyToChange: function() {
			let any_to_change = false;
			for (let crew of S$.crew) {
				if (crew.stats[this.stat_num] < this.max_stat) {
					any_to_change = true;
				}
			}
			return any_to_change;
		},
		universityTrade: function() {
			if (!this.UniversityAnyToChange()) {
				SU.message("Too high skills");
				return;
			}
			
			this.AddOneBought();
      S$.RemoveCredits(this.cost);
      this.AddJournal("Studied");			
			if (SE.PassTime(this.training_time)) {
				for (let crew of S$.crew) {
					if (crew.stats[this.stat_num] < this.max_stat) {
						crew.IncrementStat(this.stat_num);
						//crew.stats[this.stat_num]++;
					}
				}
				SU.message("Crew trained");
//				this.stat_num = Math.floor(SU.r(this.seed, 4.12)*SF.NUM_STATS);
//				let stat_symbol = SF.STAT_NAME[this.stat_num];
//				this.max_stat = capStat(this.data.level*5+Math.floor(SU.r(this.seed, 4.13)*5));
			} else {
				SU.message("Study interrupted");
			}
      this._initBuildingTrade(this.data);
			this.tier.renderer.drawMenu();
		},
		AddJournal: function(message) {
			let system = this.data.parentData.systemData;
			// Could log the type here and draw it later, if it's important to know the building type.
			let text = /*"["+ST.BuildingSymbol(this.data.type)+"] " + */message + " ["+this.data.name[0] + " " + this.data.name[1]+"] ["+this.data.parentData.name+"]";
			if (S$.ship.sensor_level >= SF.SENSOR_COORDINATES) {
				text += " ["+coordToParsec(system.x)+", "+coordToParsec(system.y)+" pc]";
			}
      S$.logMessage(text);
		},
  };
})();
