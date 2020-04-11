/*
Icons and handling for custom buildings.
This contains the icon and data model and FoundShipDisplay - it should get refactored.
*/
(function() {
  SBar.IconCustomBuilding = function(context, parent_data, data, floating) {
      this._initIconCustomBuilding(context, parent_data, data, floating);
  };

  SBar.IconCustomBuilding.prototype = {
    data: null,  // 'this' - see below.
		parent_data: null, // Surface data.
		custom_data: null, // Data passed in.
    imagecontext: null,
    image: null,
    imagesize: 30,
		drawsize: 30,
    quest: false,
	  floating: false,
		// Data fields.
		name: null,
		x: null,
		y: null,
		_initIconCustomBuilding: function(context, parent_data, data, floating) {
        this.context = context;
				this.custom_data = data;
        this.data = this; // Workaround to also have this the data object for now.
				this.parent_data = parent_data;
				if (floating) {
					this.floating = true;
				}
				this.name = [this.custom_data.data.name, ""];//this.custom_data.name;
        this.draw();  // Note this might override this.name.
				this.x = this.custom_data.x;
				this.y = this.custom_data.y;
				this.faction = SF.FACTION_NORMAL;
				if (this.custom_data.data && this.custom_data.data.level) {
					this.level = this.custom_data.data.level;
				} else {
					this.level = S$.crew[0].base_level;
				}
      },
      draw: function() {
        switch (this.custom_data.type) {
          case SF.TYPE_CUSTOM_SHIP:
						this.image = new SBar.Ship(-1, -1, -1, -1, this.custom_data.data).GetImage(this.imagesize, /*rotate=*/true); 
						break;
          case SF.TYPE_CUSTOM_TREASURE:
						this.image = SBar.GetBuildingImage(this.custom_data.type);
						if (this.custom_data.data.item_stash) {
							this.name = ["Stashed Items", ""];
						} else {
							this.name = ["Stashed Cargo", ""];
						}
						break;
					case SF.TYPE_RUINS:
						this.image = new SBar.IconBuilding(this.context, {seed:this.custom_data.seed, type:SF.TYPE_RUINS}, this.floating).image;
						break;
					case SF.TYPE_CUSTOM_MINE:
						let mine_details = S$.mineDetails[this.custom_data.seed];
						this.name = [SF.SYMBOL_MINERALS+mine_details.minerals+"/"+mine_details.max_minerals+" "+SF.SYMBOL_TIME+mine_details.mine_time, ""];
						this.image = SBar.GetBuildingImage(this.custom_data.type);
						break;
          default:
						// Normal building type has been added. Use the parent IconBuilding class.
						// super().
						this.data = new SBar.BuildingData(this.parent_data, this.custom_data.x, this.custom_data.y, this.custom_data.type, this.custom_data.data.faction);
						this.super_icon = new SBar.IconBuilding(this.context, this.data, this.floating);
						this.image = this.super_icon.image;
						this.name = this.data.name;
						if (this.custom_data.data.name) {
							this.name = this.custom_data.data.name;
							this.data.name = this.custom_data.data.name;  // Not really sure why this one is needed.
						}
						break;
        }
			},
			pushBuildingTier: function() {
        switch (this.custom_data.type) {
          case SF.TYPE_CUSTOM_SHIP:
						// FoundShipDisplay is defined below.
						SU.PushTier(new SBar.FoundShipDisplay(this.parent_data, this.custom_data));
						//new SBar.FoundShipDisplay(this.custom_data.data).activate();
						break;
          case SF.TYPE_CUSTOM_TREASURE:
						this.FoundTreasure();
						break;
					case SF.TYPE_RUINS:
						SU.PushTier(new SBar.PlanetsideRenderer(this.parent_data, this.x, this.y));						
						SU.PushTier(new SBar.RuinsRenderer(this));
						break;
					case SF.TYPE_CUSTOM_MINE:
						SU.PushTier(new SBar.PlanetsideRenderer(this.parent_data, this.x, this.y));
						break;
          default:
						// Normal building type has been added.
						this.super_icon.data.pushBuildingTier();
						break;
				}
			},
			
			FoundTreasure: function() {
				S$.RemoveCustomBuilding(this.parent_data, this.x, this.y);
				// Reuse the implementation in 0planetsideR.js.
				let planet_renderer = new SBar.PlanetsideRenderer(this.parent_data, this.x, this.y)
				if (this.custom_data.data.item_stash) {
					let items = this.custom_data.data.stash;
					for (let arti of items) {
						S$.crew[0].artifacts.push(arti);
					}
					planet_renderer.StashItems();
				} else {
					let cargo = this.custom_data.data.stash;
					for (let arti of cargo) {
						S$.ship.cargo.push(arti);
					}
					planet_renderer.StashCargo();
				}
				return;
			}
	  };
		SU.extend(SBar.IconCustomBuilding, SBar.IconBuilding);
})();


(function() {
  // Note this is called for derelicts in space, as well as custom buildings.
  SBar.FoundShipDisplay = function(parent_data, ship_data/*required if only called for custom building*/) {
    this._initFoundShipDisplay(parent_data, ship_data);
  };

  SBar.FoundShipDisplay.prototype = {
		custom_data: null,
    ship_data: null,
		parent_data: null,
		message: null,
    _initFoundShipDisplay: function(parent_data, custom_data) {
			this.custom_data = custom_data;
			this.ship_data = custom_data.data;
			this.parent_data = parent_data;
		},
		SetMessage: function(text) {
			this.message = text;
			return this;
		},
		
		activate: function() {
      //SG.activeTier.teardown();
      SG.activeTier = this;
			//SU.clearText();
			SU.addText("1: Take Ship");
			SU.addText("S: Ship Details");
			SU.addText("R: Ship Cargo");
			SU.addText("X: Cancel");


			var context = SC.layer2;
      SU.displayBorder(this.ship_data.name, context);

			var image_size = SF.HEIGHT*0.75;
			var image = new SBar.Ship(-1, -1, -1, -1, this.ship_data).GetImage(image_size);
//			var image = this.ship_data.ship.GetImage(image_size); 
      context.globalAlpha = 0.35;
      context.drawImage(image, (-image_size) / 2 + SF.HALF_WIDTH, (-image_size) / 2 + SF.HALF_HEIGHT, image_size, image_size);
      context.globalAlpha = 1;

			if (!this.message) {
				this.message = "Your abandoned ship.";
			}
      SU.wrapText(context, this.message, 70, 110, 670, 25, SF.FONT_L, '#AAA');			
		},
		
		TakeShip: function() {
			if (S$.tow_ship) {
				SU.message("Ship already in tow.");
				return;
			}
			if (S$.conduct_data['escape_pod']) {
				SU.message(SF.CONDUCTS['escape_pod'].title);
				return;
			}
			if (this.parent_data) {
				S$.RemoveCustomBuilding(this.parent_data, this.custom_data.x, this.custom_data.y);
			}
			if (S$.ship.ship_type !== SF.SHIP_POD) {
				S$.tow_ship = S$.ship;
			}
			S$.game_stats.ships_acquired++;
			S$.ship = new SBar.Ship(-1, -1, -1, -1, this.ship_data);
      SU.message("Ship acquired.");
      S$.logMessage("Ship acquired.");
			
			this.teardown();
		},
		
		Inspect: function() {
			SU.PushTier(new SBar.ArtifactComplexRenderer(new SBar.Ship(-1, -1, -1, -1, this.ship_data),
			            undefined, /*view_only=*/true));
		},
		
		ShowCargo: function() {
			let renderer = new SBar.ArtifactComplexRenderer(new SBar.Ship(-1, -1, -1, -1, this.ship_data),
			    undefined, /*view_only=*/true);
			renderer.is_cargo = true;
			SU.PushTier(renderer);
		},
		
	  handleKey: function(key) {
	    switch (key) {
	      case SBar.Key.NUM1:
          this.TakeShip();
					break;
				case SBar.Key.S:
					this.Inspect();
					break;
				case SBar.Key.R:
					this.ShowCargo();
					break;
	      case SBar.Key.X:
					this.teardown();
	        //this.Cancel();
	        break;
	      default:
	        error("unrecognized key pressed in questr: " + key);
	    }
	  },
	
    teardown: function() {
			SU.PopTier();
    },
  };
})();

