/*
Ship + artifact complex renderer and editor.
 */
(function() {
  var max_connection_dist = 300;
  var max_connection_dist2 = max_connection_dist * max_connection_dist;

  // NOTE any changes here need to be reflected in ResetChanges() below.
  SBar.ArtifactComplexRenderer = function(ship_or_hero, arti, view_only, /*optional*/browse, /*optional*/callback) {
    this._initArtifactComplexRenderer(ship_or_hero, arti, view_only, browse, callback);
  };
  SBar.ArtifactComplexRenderer.prototype = {
		ship_or_hero: null,
		is_ship: null, // Or hero.
		is_cargo: null,  // If ship, may be cargo instead. Set directly by the caller.
		stashing_cargo: null,  // If 'is_cargo', show the stash area (for first indexed ship). Set directly by the caller.
		stashing_items: null,  // Show the stash items area (for the first crew). Set directly by the caller.
		context: null,
		active_arti: null,
		active_icon: null, // Icon picked up / to be installed, if any.
		orig_arti: null,  // Original artifact passed in, if any.
		temp_connected_artis: null,  // Connected artifacts, if hover-connected.
		arti_data: null,
		arti_icons: null,
		all_arti_data: null, // Map of arti_data by crew index.
		all_arti_icons: null, // Map of arti_icons by crew index.
		callback: null,
		x: null, // Current placement x,y,rotation.
		y: null,
		rot: null,
		shape_icon: null,  // Ship or character tiles.
		connections_to_draw: null,
		is_valid: true,  // New artifact position is valid.
		active_index: null,  // This is index of the the hero or ship currently being shown.
		view_only: null,
		browse: null,  // Option to purchase or exit.
		heroes_copy: null,  // Copy of S$.crew for transient stats calculation.
		ships_copy: null,  // Copy of the ships for temporary handling.
		//original_ship: null,  // Original ship passed in, not the temp version created.
		price_callback: null,  // Returns the price for an artifact. Means this is a selling interface.
		sell_callback: null,  // Callback o sell an artifact.
		completed: false,  // Indicates a normal completion (as opposed to direct exit/abort), for the callback.
		skip_xp: false,  // Don't award XP for this arti.

    _initArtifactComplexRenderer: function(ship_or_hero, arti, view_only, browse, callback) {
			this.ship_or_hero = ship_or_hero;
			this.is_ship = this.ship_or_hero.type == SF.TYPE_SHIP;
			
			this.connections_to_draw = [];
			if (arti) {
				if (S$.conduct_data['no_equipment'] && !this.is_ship) {
					SU.message(SF.CONDUCTS['no_equipment'].title);
				} else {
					this.orig_arti = arti;
					this.active_arti = SU.Clone(arti);
				}
			}
			this.view_only = view_only;
			if (SG.in_battle) {
				// Don't allow artifact shuffle during combat.
				this.view_only = true;
			}
			this.browse = browse;
			this.callback = callback;
			this.CheckArchXp(arti);
    },
		// Arti is optional, if proposing to add an artifact.
    activate: function(callback) {
      this.context = SC.layer2;
			if (callback) {
				this.callback = callback;
			}
			SU.clearTextNoChar();
			this.x = Math.floor(SG.mx/SF.ARTI_TILE_SIZE);
			this.y = Math.floor(SG.my/SF.ARTI_TILE_SIZE);
			
			let ship_or_hero_orig = this.ship_or_hero;
			
			// Create ship/hero clones for use by the renderer.
			if (this.is_ship) {
				if (!this.ship_or_hero.placed_starting_artifacts) {
					// This was deferred, since it can take 20-100 ms or more.
					this.ship_or_hero.PlaceStartingArtifacts();
				}							
				let player_ships = ship_or_hero_orig.name == S$.ship.name || (S$.tow_ship && ship_or_hero_orig.name == S$.tow_ship.name);
				this.ships_copy = [];
				if (player_ships) {
					// Pull up the original ships, not the working copy that may have been modified.
					this.ships_copy.push(new SBar.Ship(undefined, undefined, undefined, undefined, SU.Clone(S$.ship)))
					if (S$.tow_ship) {
						if (!S$.tow_ship.placed_starting_artifacts) {
							S$.tow_ship.PlaceStartingArtifacts();
						}							
						this.ships_copy.push(new SBar.Ship(undefined, undefined, undefined, undefined, SU.Clone(S$.tow_ship)))
					}
				} else {
					// Viewing a ship in a shop or on the ground.
					this.ships_copy.push(new SBar.Ship(undefined, undefined, undefined, undefined, SU.Clone(ship_or_hero_orig)))
				}
				if (this.ships_copy.length > 1 && ship_or_hero_orig.name == this.ships_copy[1].name) {
					this.ship_or_hero = this.ships_copy[1];
			  } else {
					this.ship_or_hero = this.ships_copy[0];
			  }			
			} else {
				// Make a copy of the heroes to work with. This will be tossed at the end.
				this.heroes_copy = [];
				for (let hero of S$.crew) {
					this.heroes_copy.push(new SBar.Crew(undefined, undefined, undefined, undefined, SU.Clone(hero)));
					if (this.ship_or_hero.name == this.heroes_copy[this.heroes_copy.length-1].name) {
						this.ship_or_hero = this.heroes_copy[this.heroes_copy.length-1];
					}
				}
			}			
			
			if (this.is_ship) {
				this.all_arti_data = {};
				this.all_arti_icons = {};
				for (var i = 0; i < this.ships_copy.length; i++) {
					if (ship_or_hero_orig.name === this.ships_copy[i].name) {  // Quick check, since this is a copy.
						this.active_index = i;
					}
					this.all_arti_data[i] = [];
					this.all_arti_icons[i] = [];
					let artifacts = this.is_cargo ? this.ships_copy[i].cargo : this.ships_copy[i].artifacts;
		      for (var artifact of artifacts) {
						let new_arti = SU.Clone(artifact);
						var arti_icon = new SBar.IconArtifact(this.context, new_arti);
						this.all_arti_data[i].push(new_arti);
		        this.all_arti_icons[i].push(arti_icon);
		      }
				}
				this.arti_data = this.all_arti_data[this.active_index];
				this.arti_icons = this.all_arti_icons[this.active_index];				
			} else {
				// Cache all the heroes' artifacts.
				this.all_arti_data = {};
				this.all_arti_icons = {};
				for (var i = 0; i < S$.crew.length; i++) {
					if (ship_or_hero_orig === S$.crew[i]) {
						this.active_index = i;
					}
					if (!S$.crew[i].placed_starting_artifacts) {
						// This was deferred, since it can take 20-100 ms or more.
						S$.crew[i].PlaceStartingArtifacts();
					}										
					this.all_arti_data[i] = [];
					this.all_arti_icons[i] = [];
		      for (var artifact of S$.crew[i].artifacts) {
						let new_arti = SU.Clone(artifact);
						var arti_icon = new SBar.IconArtifact(this.context, new_arti);
						this.all_arti_data[i].push(new_arti);
		        this.all_arti_icons[i].push(arti_icon);
		      }
				}
				if (this.active_index === null || this.active_index === 30) {
					// Not a crew member - inspecting to hire.
					this.active_index = 30;  // Past heroes.
					this.all_arti_data[this.active_index] = [];
					this.all_arti_icons[this.active_index] = [];
					if (!this.ship_or_hero.placed_starting_artifacts) {
						this.ship_or_hero.PlaceStartingArtifacts();
					}										
		      for (var artifact of this.ship_or_hero.artifacts) {
						let new_arti = SU.Clone(artifact);
						var arti_icon = new SBar.IconArtifact(this.context, new_arti);
						this.all_arti_data[this.active_index].push(new_arti);
		        this.all_arti_icons[this.active_index].push(arti_icon);
		      }
				}
				this.arti_data = this.all_arti_data[this.active_index];
				this.arti_icons = this.all_arti_icons[this.active_index];
			}
			
			this.rot = 0;
			if (this.is_cargo) {
				// Show stash only for the first.
				this.shape_icon = new SBar.IconTilesCargo(this.ship_or_hero, this.stashing_cargo && this.active_index === 0, this.price_callback != null)
			} else if (this.is_ship) {
				this.shape_icon = new SBar.IconTilesShip(this.ship_or_hero)
			} else {
				let show_stash = this.stashing_items && this.active_index === 0;
				this.shape_icon = new SBar.IconTilesAlien(this.ship_or_hero.seed, this.ship_or_hero.raceseed, this.price_callback != null, this.ship_or_hero, show_stash);
			}
			
			if (this.active_arti !== null) {
				this.active_icon = new SBar.IconArtifact(this.context, this.active_arti);
				this.active_icon.CenterAtTile(0, 0, 0);
			}
			this.render();
      SG.activeTier = this;			
			
//			this.UpdateOverlaps();
//			this.RebuildConnections();
//			this.render();
			this.UpdateForMouseMove();
		},
		
		CheckArchXp: function(arti) {
			if (!arti || !arti.params || !arti.params[0] || this.skip_xp || this.done_arch_xp) {
				return;
			}
			this.done_arch_xp = true;
			if (arti.params[0].type === SF.SKILL_ALPHA) {
				S$.AddXp("arch", SF.LEVEL_XP[arti.params[0].level]);				
			}
		},
						
		// Gets the icon currently over. Or null if none.
		GetOverIcon: function() {
      for (var i = 0; i < this.arti_icons.length; i++) {
				var check_point = [this.x-this.arti_data[i].installx, this.y-this.arti_data[i].instally];
				if (this.arti_icons[i].IsArtiTile(check_point)) {
					return this.arti_icons[i];
				}
			}
			return null;
		},
		
		// Returns a similar color dimension based on the seed.
		ShiftColor: function(color, seed) {
			color += SU.r(seed, 19.91)*10-5;
			color = fixColor(Math.floor(color));
			// Need to have it lighter than black.
			if (color < 30) color = 30;
			return color;
		},

		// Random textured background.
		DrawBackground: function() {
			SU.DrawCrewBackground(this.context, this.ship_or_hero.seed);
			
			/*
			var width = 40;
			var height = 20;
			
      image = document.createElement('canvas');
      image.width = width;
      image.height = height;
      var ctx = image.getContext('2d');
			
			var r = Math.floor(SU.r(seed, 18.81)*78)+30;
			var g = Math.floor(SU.r(seed, 18.82)*78)+30;
			var b = Math.floor(SU.r(seed, 18.83)*78)+30;
			SU.rect(ctx, 0, 0, width, height, "rgb("+r+","+g+","+b+")");
			
			for (var i = 0; i < SU.r(seed, 17.7)*20+15; i++) {
				var type = Math.floor(SU.r(seed, 18.7+i)*2);
				r = this.ShiftColor(r, 18.91+i);
				g = this.ShiftColor(g, 18.91+i);
				b = this.ShiftColor(b, 18.91+i);
				switch (type) {
					case 0:
						SU.line(ctx, SU.r(seed, 19.01+i)*width, SU.r(seed, 19.02+i)*height, SU.r(seed, 19.03+i)*width, SU.r(seed, 19.04+i)*height, 
    						"rgb("+r+","+g+","+b+")", SU.r(seed, 19.04+i)*10);
						break;
					case 1:
			      SU.circle(ctx, SU.r(seed, 20.02+i)*height, SU.r(seed, 20.03+i)*width, SU.r(seed, 20.04+i)*10, "rgb("+r+","+g+","+b+")");
						break;
					default:
						error("no 7cr back: "+type);
				}
			}
			
			// Draw multiple times with overlaps and alphas.			
			this.context.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT);
			this.context.globalAlpha = 0.75;
			ctx.save();
			ctx.transform(-1, 0, 0, -1, 0, 0);
			ctx.restore();
			this.context.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT);
			this.context.globalAlpha = 0.5;
			ctx.save();
			ctx.transform(1, 0, 0, -1, 0, 0);
			ctx.restore();
			this.context.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT);
			this.context.globalAlpha = 0.25;
			ctx.save();
			ctx.transform(-1, 0, 0, 1, 0, 0);
			ctx.restore();
			this.context.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT);
			this.context.globalAlpha = 1;
			*/
		},
		
		// Check a level up. Lots going on to have it in this class, but it's the best place for it.
		CrewLevelReady: function() {
			if (this.orig_arti || this.is_ship) {
				return false;
			}
			let crew = this.ship_or_hero;
			return crew.base_level < SF.MAX_LEVEL && SF.LEVEL_XP[crew.base_level+1] <= crew.xp;
		},
		
		LevelUp: function() {
			if (!this.CrewLevelReady()) {
				return;
			}
			let crew = S$.crew[this.active_index];
			if (crew.is_player) {
				// There will be an arti gift. Tear down the existing ArtifactComplexRenderer.
				this.teardown();
				crew.LevelUp();
				return;
			}
			crew.LevelUp();
			this.ResetChanges();  // Rebuild interface from real crew.
		},
		
		// Common code to render the text on the left box.
		RenderLeftText: function() {
			let ytop = 120;
      ytop += SU.wrapText(this.context, this.ship_or_hero.name, 165, 80, 190, 25, SF.FONT_L, '#FFF', 'center') - 30;
			if (this.is_cargo) {
	      SU.text(this.context, "Cargo bay size: "+this.ship_or_hero.max_cargo, 70, ytop, SF.FONT_M, '#AAF');
				ytop += 25;
			} else {  // Ship or hero both have StatsStrings.
				for (line of this.ship_or_hero.StatsStrings()) {
					let text = null;
					let right = null;
					if (Array.isArray(line)) {
						text = line[0];
						right = line[1];
					} else {
						text = line;
					}
					if (right) {
		        SU.text(this.context, right, 260, ytop, SF.FONT_M, SF.STAT_TEXT_COLOR, 'right');
					}
	        ytop += SU.wrapText(this.context, text, 70, ytop, 200, 23, SF.FONT_M, '#AAF');
				}
			}
			return ytop;
		},
		
		render: function() {
			this.DrawBackground();
			this.shape_icon.update(this.context, SF.HALF_WIDTH, SF.HALF_HEIGHT);
			
			// Draw artifacts.
			this.context.save();
			this.context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			for (let i = 0; i < this.arti_icons.length; i++) {
				let arti_icon = this.arti_icons[i];
				let prereqs_met = this.PrereqsMet(arti_icon.skill);
				arti_icon.update(!prereqs_met);
			}
			// Draw the costs on top, so they don't get clipped.
			if (this.price_callback) {
				for (let i = 0; i < this.arti_icons.length; i++) {
					let arti_icon = this.arti_icons[i];
					let arti_data = this.arti_data[i];
		      SU.text(this.context, SF.SYMBOL_CREDITS+this.price_callback(arti_data), arti_icon.drawx+SF.ARTI_TILE_SIZE/2, arti_icon.drawy+20, SF.FONT_XLB, '#AAF', 'center', "#444",4);
				}
			}
			// Clear selected arti.
      //this.context.clearRect(200, -300, 300, 500);
			let display_icon = null;
			if (this.active_icon) {
				let prereqs_met = this.PrereqsMet(this.active_icon.skill);				
				display_icon = this.active_icon;
				this.context.globalAlpha = 0.75;
				this.active_icon.update(!prereqs_met);
				this.context.globalAlpha = 1;
			} else {
				display_icon = this.GetOverIcon();
			}
			if (display_icon !== null) {
				let skill_name = display_icon.skill.name;
				let prereqs_met = this.PrereqsMet(display_icon.skill);				
				if (display_icon.skill.level) {
					skill_name += " ("+SF.SYMBOL_LEVEL+display_icon.skill.level+")";
				}
				// Draw a first time to measure height.
				let y = this.DrawArti(skill_name, display_icon, prereqs_met);
				this.ArtiBox(180, -250, y+243, prereqs_met);
//				this.context.globalAlpha = 0.5;
//				display_icon.DrawAt(300,-150);
//				this.context.globalAlpha = 1;
				// Draw it all again, now that the height is known.
				this.DrawArti(skill_name, display_icon, prereqs_met);
			}
			for (var i = 0; i < this.connections_to_draw.length; i++) {
				var points = this.connections_to_draw[i];
	      SU.circle(this.context, points[0], points[1], 6, "#0F0", 3, "#000");
			}
			this.context.restore();
			
			// Left text box.
			// First pass to measure the window.
			let ytop = this.RenderLeftText();
      var colorStops = [0, 'rgba(0,0,0,0.75)', 1, 'rgba(0,0,0,0.45)'];
			SU.rectCornerGrad(this.context, 8, 50, 50, 220, ytop-55, colorStops, 'rgb(0,0,0)', 2);
			this.RenderLeftText();
			
			// Overlays.
			if (this.view_only) {
				SU.rectCorner(this.context, 8, SF.HALF_WIDTH-150, 25, 300, 30, 'rgba(0,0,0,0.5)', "#000", 2);
	      SU.text(this.context, "VIEWING ONLY", SF.HALF_WIDTH, 50, SF.FONT_XLB, '#F88', 'center');
			} else if (this.CrewLevelReady()) {
				SU.rectCorner(this.context, 8, SF.HALF_WIDTH-200, 25, 400, 30, 'rgba(0,0,0,0.5)', "#000", 2);
				let text = "LEVEL READY";
				if (S$.crew[this.active_index].is_player) {
					text = "PLAYER "+text;
				}
	      SU.text(this.context, text, SF.HALF_WIDTH, 50, SF.FONT_XLB, '#F88', 'center');
			} else if (this.merchant_cash !== undefined) {
				SU.rectCorner(this.context, 8, SF.HALF_WIDTH-150, 25, 300, 30, 'rgba(0,0,0,0.5)', "#000", 2);
	      SU.text(this.context, "Cash on hand: "+SF.SYMBOL_CREDITS+this.merchant_cash, SF.HALF_WIDTH, 50, SF.FONT_XL, '#88F', 'center');
			}
			
			// Hotkeys text.
			SU.clearTextNoChar();
			if (this.is_ship) {
				if (S$.tow_ship) {
					SU.addText("1-2: Switch Ship");			
				}
				if (this.ship_or_hero.IsOwned() && !this.is_cargo) {
					SU.addText("T: Scuttle Ship");			
				}
			} else {
				if (S$.crew.length > 1) {
					SU.addText("1-"+S$.crew.length+": Switch Crew");			
				}
			}
			SU.addText("SPACE: Complete");
			SU.addText("Q,E: Rotate");
			SU.addText("R: Reset Changes");
			if (this.CrewLevelReady()) {
				SU.addText("L: Level Up");
			}
			if (!this.is_ship && this.active_index > 0) {
				SU.addText("M: Morale History");
				SU.addText("P: Purge Crew");
			}
			if (this.view_only || !this.orig_arti || this.browse) {
				SU.addText("X: Exit");
			}
		},
		
		// Returns true if this arti's skill can be used by the crew or ship stats.
		PrereqsMet: function(skill) {
		  return (!this.is_ship && skill.MeetsPrereqs(this.ship_or_hero.stats))
  			|| (this.is_ship && skill.MeetsPrereqs(S$.officer_stats));
		},
		
		DrawArti: function(skill_name, display_icon, prereqs_met) {
			let y = -220;
      y += SU.wrapText(this.context, skill_name, 335, y, 270, 28, SF.FONT_L, '#FFF', 'center');
			if (display_icon.skill.type === SF.SKILL_ALPHA && display_icon.skill.desc) {
				// Special case of writing out the alpha arti descriptions.
				// Because they're that good :)
        y += SU.wrapText(this.context, display_icon.skill.desc, 335, y, 270, 20, SF.FONT_M, '#FFF', 'center') + 10;
			}
			if (display_icon.arti.imprinted && !this.CheckUnimprinted(display_icon.skill)) {
        y += SU.wrapText(this.context, "[Bound to "+this.ship_or_hero.name+"]", 335, y, 270, 20, SF.FONT_M, '#FAA', 'center');				
			}
			if (!prereqs_met) {
        y += SU.wrapText(this.context, "Prereqs not met", 335, y, 270, 20, SF.FONT_LB, '#F00', 'center');				
			}
			if (display_icon.arti.cost && !this.active_icon) {
        y += SU.wrapText(this.context, "[Paid "+SF.SYMBOL_CREDITS+display_icon.arti.cost+"]", 335, y, 270, 20, SF.FONT_M, '#FAA', 'center');				
			}
			y += display_icon.skill.WriteDetails(this.context, 200, y, 270);
			return y;				
		},
		
		ArtiBox: function(x, y, height, prereqs_met) {
      var colorStops = [0, 'rgba(0,0,0,0.85)', 1, 'rgba(0,0,0,0.65)'];
			if (!prereqs_met) {
				var colorStops = [0, 'rgba(100,0,0,0.85)', 1, 'rgba(100,0,0,0.65)'];
			}
      SU.rectCornerGrad(this.context, 8, x, y, 300, height, colorStops, 'rgb(0,0,0)', 2);			
			if (this.active_icon) {
	      SU.text(this.context, "⇩", x+280, y+30, SF.FONT_XL, '#FFF', 'center');
			}
		},

		handleRotate: function(rot) {
			if (this.active_icon === null) {
				return;
			}
			var new_rot = this.rot + rot;
			if (new_rot < 0) {
				new_rot += 360;
			}
			if (new_rot >= 360) {
				new_rot -= 360;
			}

			this.rot = new_rot;
			if (this.active_icon !== null) {
			  this.is_valid = this.active_icon.CenterReturnValid(this.x, this.y, this.rot, this.shape_icon);
				this.active_icon.SetInvalidPosition(!this.is_valid);
			}
			this.UpdateOverlaps();
			this.RebuildConnections();
			this.render();
		},
		
		Install: function() {
			if (this.active_icon === null) {
				return;
			}
			if (this.temp_connected_artis.length > 0) {
				// Need to pick an x,y. Use the active artifact. Set the new ones relative. This preserves the order that was shown.
				// Take the old installx/y, and any offsets, and set them now.
				this.active_arti.installx = this.x;
				this.active_arti.instally = this.y;
				this.active_arti.rotation = this.rot;
				this.active_icon = new SBar.IconArtifact(this.context, this.active_arti);
				
				let fused_arti = SU.Clone(this.active_arti);
				fused_arti.rot = 0;
				fused_arti.fused_points = this.active_icon.GetPoints(0, 0);
				fused_arti.fused_connectors = this.active_icon.GetConnectors(0, 0);
				let newx = this.x;
				let newy = this.y;
				// Need to fuse (merge) the artifacts. Pick up all the connected ones and build the new one.
				let removed_icons = [];
				let is_original = false;
				for (let i = this.arti_data.length; i >= 0; i--) {
					for (let connected_index = 0; connected_index < this.temp_connected_artis.length; connected_index++) {
						if (this.arti_data[i] === this.temp_connected_artis[connected_index]) {
							for (let param of this.arti_data[i].params) {
								fused_arti.params.push(param);
							}
							fused_arti.fused_points = fused_arti.fused_points.concat(
								  this.arti_icons[i].GetPoints(this.arti_data[i].installx - newx, this.arti_data[i].instally - newy));
							fused_arti.fused_connectors = fused_arti.fused_connectors.concat(
								  this.arti_icons[i].GetConnectors(this.arti_data[i].installx - newx, this.arti_data[i].instally - newy));
							this.arti_data.splice(i, 1);
							this.arti_icons.splice(i, 1);
						}
					}
				}
				fused_arti.fused_connectors = this.ClearInternalConnectors(fused_arti.fused_points, fused_arti.fused_connectors);
				this.active_arti = fused_arti;
				this.active_arti.installx = this.x;
				this.active_arti.instally = this.y;
				this.active_arti.rotation = 0;
				this.rot = 0;
				this.active_icon = new SBar.IconArtifact(this.context, this.active_arti);
				this.temp_connected_artis = null;
				this.connections_to_draw = [];				
			} 
			this.active_arti.installx = this.x;
			this.active_arti.instally = this.y;
			this.active_arti.rotation = this.rot;
			
			this.arti_data.push(this.active_arti);
			this.active_icon = new SBar.IconArtifact(this.context, this.active_arti);
			this.arti_icons.push(this.active_icon);
			this.active_arti = null;
			this.active_icon = null;
	
			this.UpdateOverlaps();
			this.RebuildConnections();
			this.RebuildArtis();
			this.render();
		},
		
		// Removes any connectors that connect the artifact internally.
		ClearInternalConnectors: function(points, connectors) {
			// Check that the destination is not within the points.
			let points_set = {};
			for (let point of points) {
				points_set[point[0]+","+point[1]] = true;
			}
			return connectors.filter(function(points) {  // filter() needs true to keep it.
				return !points_set[points[2]+","+points[3]];
			});
		},
		
		// Update the hero artis and rebuild stats. Updates real_heroes
		// if specified, otherwise the temp working copies.
		RebuildArtis: function(real_heroes) {
			if (real_heroes && this.orig_arti) {
				if (this.orig_arti.params[0] && this.orig_arti.params[0].type === SF.SKILL_CARGO) {
					if (this.orig_arti.params[0].cargo_type === SF.CARGO_CONTRABAND) {
						S$.game_stats.contraband_acquired++;
					} else {
						S$.game_stats.cargo_acquired++;
					}
				} else {
					S$.game_stats.items_acquired++;
				}
			}
			if (this.is_cargo) {
				let ship_list = real_heroes ? [S$.ship, S$.tow_ship] : this.ships_copy;
				for (let i = 0; i < ship_list.length; i++) {
					if (ship_list[i]) {
						ship_list[i].cargo = [];						
						for (arti of this.all_arti_data[i]) {
							let arti_export = SU.Clone(arti);
							if (i == 0 && this.stashing_cargo) {
								// Main ship. Check if the cargo is stashed.
								// Current bounds for stash:
				        // -11, -16
				        // -11, -2
				        // 8, -16
				        // 8, -2
								let x = arti_export.installx;
								let y = arti_export.instally;
								arti_export.stashed = undefined;
								if (x <= -2 && y >= -11 && y <= 8) {
									arti_export.stashed = true;
								} 
							}							
							if (this.IsInTrash(arti_export.installx, arti_export.instally)) {		
								if (this.price_callback && real_heroes) {
									this.sell_callback(arti_export, this.price_callback);
								}
							} else {
								ship_list[i].cargo.push(SU.Clone(arti_export));
							}
						}
					}
				}				
			} else if (this.is_ship) {
				// If no orig_arti here, a ship is being purchased instead of a ship arti. Don't rebuild.
				if (this.orig_arti) {
					let ship_list = real_heroes ? [S$.ship, S$.tow_ship] : this.ships_copy;
					for (let i = 0; i < ship_list.length; i++) {
						if (ship_list[i]) {
							ship_list[i].artifacts = [];						
							for (arti of this.all_arti_data[i]) {
								if (!this.IsInTrash(arti.installx, arti.instally)) {		
									ship_list[i].artifacts.push(SU.Clone(arti));
								}
							}
							ship_list[i].RebuildArtiStats();
						}
					}
				}
			} else {
				let heroes_list = real_heroes ? S$.crew : this.heroes_copy;
				for (var i = 0; i < heroes_list.length; i++) {
					let orig_num_artis = heroes_list[i].artifacts.length;
					heroes_list[i].artifacts = [];
					for (arti of this.all_arti_data[i]) {
						let arti_export = SU.Clone(arti);
						let trashed = false;
						let x = arti_export.installx;
						let y = arti_export.instally;
						if (i == 0) {
							// Human player. Check backpack.
							// Current bounds for backpack:
			        // -9, -2
			        // -9, 7
			        // -23, 7
			        // -23, -2
							arti_export.backpack = undefined;
							if (x <= -9 && y >= -2 && y <= 7) {
								arti_export.backpack = true;
							} 
							if (this.stashing_items) {
								// Check if stashed.
								// Current bounds for stash:
								// let tile_x = 9;
								// let tile_y = -3;
								// let tile_width = 15;
								// let tile_height = 13;
								let x = arti_export.installx;
								let y = arti_export.instally;
								arti_export.stashed = undefined;
								if (x >= 9 && y >= -3 && y < 10) {
									arti_export.stashed = true;
								}
							}
						}
						if (this.IsInTrash(x, y)) {
							trashed = true;
						}						
						if (trashed) {
							if (this.price_callback && real_heroes) {
								this.sell_callback(arti_export, this.price_callback);
							}
						} else {
							if (!arti_export.backpack) {
								if (this.CheckUnimprinted(new SBar.Skill(arti_export))) {
									arti_export.imprinted = false;
									arti.imprinted = false;
								} else {
									arti_export.imprinted = true;
									arti.imprinted = true;
								}
							}
							let arti_clone = SU.Clone(arti_export);
							heroes_list[i].artifacts.push(arti_clone);
						}
					}
					heroes_list[i].RebuildArtiStats();
					let new_num_artis = heroes_list[i].artifacts.length;
					if (real_heroes && new_num_artis != orig_num_artis && i !== 0) {
						for (let x = orig_num_artis; x < new_num_artis; x++) {
							SE.ApplyMorale(SE.MORALE_GAIN_ARTI, heroes_list[i]);	
						}
						for (let x = new_num_artis; x < orig_num_artis; x++) {
							SE.ApplyMorale(SE.MORALE_LOSE_ARTI, heroes_list[i]);							
						}
					}
				}
			}
		},
		
		CheckUnimprinted: function(skill) {
			return (skill.ability && skill.ability.unimprint) || (skill.skill_boost && skill.skill_boost.unimprint);
		},
		
		FinalizeAndExit: function() {
			if (this.view_only) {
	      this.teardown();
				return;
			}
			this.RebuildArtis(/*real_heroes=*/true);
			this.completed = true;
			//if (this.orig_arti) {
				// Installed something.
	      //SU.saveGame();				
				//}
      this.teardown();			
		},
		
		RebuildConnections: function() {
			if (!this.active_icon) {
				return;
			}
			if (this.temp_connected_artis) {
				// Restore the original.
				this.active_icon.skill = new SBar.Skill(this.active_arti);
				this.temp_connected_artis = null;
			}
			
			// First get all the connection sources.
			var connections = {};
			this.connections_to_draw = [];
			for (var i = 0; i < this.arti_icons.length; i++) {
				var icon = this.arti_icons[i];
	      for (var j = 0; j < icon.connectors.length; j++) {
					var c = icon.connectors[j];
					connections[(c[0]+icon.x)+','+(c[1]+icon.y)+','+(c[2]+icon.x)+','+(c[3]+icon.y)] = i;
				}
			}
			if (this.active_icon) {
				var icon = this.active_icon;
	      for (var j = 0; j < icon.connectors.length; j++) {
					var c = icon.connectors[j];
					connections[(c[0]+icon.x)+','+(c[1]+icon.y)+','+(c[2]+icon.x)+','+(c[3]+icon.y)] = -1;
				}
			}
			// Then identify the connections.
			for (var i = 0; i < this.arti_icons.length; i++) {
				var icon = this.arti_icons[i];
				var connected_artis = [];
	      for (var j = 0; j < icon.connectors.length; j++) {
					var c = icon.connectors[j];
					var other_connector = connections[(c[2]+icon.x)+','+(c[3]+icon.y)+','+(c[0]+icon.x)+','+(c[1]+icon.y)];
					if (other_connector !== undefined) {
						if (other_connector === -1) {
							connected_artis.push(this.active_arti);
						} else {
							connected_artis.push(this.arti_data[other_connector]);
						}
						var x = ((c[0]+c[2])/2+icon.x)*SF.ARTI_TILE_SIZE+SF.ARTI_TILE_SIZE/2;
						var y = ((c[1]+c[3])/2+icon.y)*SF.ARTI_TILE_SIZE+SF.ARTI_TILE_SIZE/2;
						this.connections_to_draw.push([x,y]);
					}
				}
			}
			this.temp_connected_artis = [];
			if (this.active_icon) {
				var icon = this.active_icon;
				var connected_artis = [];
	      for (var j = 0; j < icon.connectors.length; j++) {
					var c = icon.connectors[j];
					var other_connector = connections[(c[2]+icon.x)+','+(c[3]+icon.y)+','+(c[0]+icon.x)+','+(c[1]+icon.y)];
					if (other_connector !== undefined) {
						let already_added = false;
						for (let candidate of connected_artis) {
							if (candidate === this.arti_data[other_connector]) {
								already_added = true;
								break;
							}
						}
						if (!already_added) {
							connected_artis.push(this.arti_data[other_connector]);
							this.temp_connected_artis.push(this.arti_data[other_connector]);  // Full artis in a list.
						}
					}					
				}
				let temp_connected_params = SU.Clone(this.active_arti);  // Params in a list.
				for (let connected_arti of connected_artis) {
					for (let param of connected_arti.params) {
						temp_connected_params.params.push(param)
					}
				}
				if (temp_connected_params.params.length > 1) {
					// Rebuild the skill details temporarily for viewing.
					this.active_icon.skill = new SBar.Skill(temp_connected_params);
				}
			}
		},
		
		// Dehighlights the active artifact if it overlaps with another.
		UpdateOverlaps: function() {
			if (this.active_icon === null) {
				return;
			}
			for (let arti_icon of this.arti_icons) {
				if (arti_icon.IsOverlap(this.active_icon)) {
					this.is_valid = false;
					this.active_icon.SetInvalidPosition(!this.is_valid);
				}
			}
		},
		
		// Change to a different crew member.
		SwitchCrew: function(crew_num) {
			if (crew_num >= this.heroes_copy.length) {
				return;
			}
			if (this.active_arti && this.active_arti.imprinted && !this.CheckUnimprinted(this.active_arti)) {
				SU.message("Bound to "+this.ship_or_hero.name);
				return;
			}
			this.ship_or_hero = this.heroes_copy[crew_num];
			let show_stash = this.stashing_items && crew_num === 0;
			this.shape_icon = new SBar.IconTilesAlien(this.ship_or_hero.seed, this.ship_or_hero.raceseed, this.sell_callback != null, this.ship_or_hero, show_stash);
			
			this.active_index = crew_num;
			this.arti_data = this.all_arti_data[this.active_index];
			this.arti_icons = this.all_arti_icons[this.active_index];
			
			this.UpdateForMouseMove();
		},
		// Change to a different ship.
		SwitchShip: function(ship_num) {
			if (ship_num >= this.ships_copy.length) {
				return;
			}
			this.ship_or_hero = this.ships_copy[ship_num];
			this.active_index = ship_num;
			if (this.is_cargo) {
	  		this.shape_icon = new SBar.IconTilesCargo(this.ship_or_hero, this.stashing_cargo && this.active_index === 0, this.sell_callback != null)
			} else {
  			this.shape_icon = new SBar.IconTilesShip(this.ship_or_hero);
			}
			this.arti_data = this.all_arti_data[this.active_index];
			this.arti_icons = this.all_arti_icons[this.active_index];
			
			this.UpdateForMouseMove();
		},
    handleKey: function(key) {
      switch (key) {
				case SBar.Key.SPACE:
					if (this.active_icon !== null) {
						if (this.is_valid) {
							this.Install();
						}
					} else {
						this.FinalizeAndExit();
					}
					break;
					/*
				case SBar.Key.UP:
				case SBar.Key.W:
					this.handleMove(0, -1);
					break;
				case SBar.Key.DOWN:
				case SBar.Key.S:
					this.handleMove(0, 1);
					break;
				case SBar.Key.LEFT:
				case SBar.Key.A:
					this.handleMove(-1, 0);
					break;
				case SBar.Key.RIGHT:
				case SBar.Key.D:
					this.handleMove(1, 0);
					break;				
					*/
				case SBar.Key.Q:
					this.handleRotate(90);
					break;				
				case SBar.Key.E:
					this.handleRotate(-90);
					break;				
        case SBar.Key.ESC:
				case SBar.Key.X:
					if (this.view_only || this.browse) {
						this.teardown();
					} else if (!this.orig_arti) {
						// Undo any changes and exit
						this.ResetChanges();
						this.teardown();
					}
					break;
        case SBar.Key.R:
					this.ResetChanges();
					break;
        case SBar.Key.L:
					this.LevelUp();
					break;
				case SBar.Key.M:
					if (!this.is_ship && this.active_index > 0) {
						this.ship_or_hero.ShowMoraleHistory();
					}
					break;
				case SBar.Key.P:
					if (!this.is_ship && this.active_index > 0 && !this.orig_arti) {
						if (SG.in_battle) {
							SU.message("Already in battle");
							return;
						}
						this.ResetChanges();
						this.teardown();
						// Get the actual crew, not the clone.						
						S$.crew[this.ship_or_hero.GetHeroIndex()].PurgeCrew();
					}
					break;
				case SBar.Key.T:
					if (this.is_ship && this.ship_or_hero.IsOwned() && !this.is_cargo) {
						this.ResetChanges();
						this.teardown();
						this.ship_or_hero.ScuttleShip();
					}
					return;
			  case SBar.Key.NUM1:
			  case SBar.Key.NUM2:
			  case SBar.Key.NUM3:
			  case SBar.Key.NUM4:
			  case SBar.Key.NUM5:
			  case SBar.Key.NUM6:
			  case SBar.Key.NUM7:
			  case SBar.Key.NUM8:
			  case SBar.Key.NUM9:
			  case SBar.Key.NUM0:
					if (this.is_ship) {
						this.SwitchShip(key-SBar.Key.NUM1);
					} else {
						this.SwitchCrew(key-SBar.Key.NUM1);
					}
					break;
        default:
          error("unrecognized key pressed in artifact: " + key);
      }
    },
		MouseMove: function(x, y) {
			var tilex = Math.floor(x/SF.ARTI_TILE_SIZE);
			var tiley = Math.floor(y/SF.ARTI_TILE_SIZE);
			if (tilex === this.x && tiley === this.y) {
				// Only redraw if needed.
				return;
			}
			this.x = tilex;
			this.y = tiley;
			this.UpdateForMouseMove();
		},
		// Separate function to be called on re-render.
		UpdateForMouseMove: function() {
			if (this.active_icon !== null) {
			  this.is_valid = this.active_icon.CenterReturnValid(this.x, this.y, this.rot, this.shape_icon);
				// Allow putting any size into the trash area.
				if (this.IsInTrash(this.x, this.y)) {
					this.is_valid = true;
				}
				this.active_icon.SetInvalidPosition(!this.is_valid);
			}

			this.UpdateOverlaps();
			this.RebuildConnections();
			this.render();
		},
	  HandleClick: function(x, y) {
			if (this.active_icon !== null) {
				// Place an actively held arti.
				this.handleKey(SBar.Key.SPACE);
				return;
			}
			// Pick up the artifact.
			var over = this.GetOverIcon();
			if (over !== null) {
				if (this.is_ship && !this.is_cargo && !this.IsInTrash(over.arti.installx, over.arti.instally)) {
					// Ship equipment fuses to the ship.
					SU.message("Fused to Ship");
					return;
				}
				//if (over.arti.original) {
					// Can't take stuff the crew owns.
				//	SU.message("Original Equipment");
				//	return;
				//}
				this.active_icon = over;
				this.active_arti = over.arti;				
		  	//this.x = this.active_arti.installx;
				//this.y = this.active_arti.instally;
				
				this.active_arti.installx = null;
				this.active_arti.instally = null;
				this.rot = this.active_arti.rotation;
			  this.is_valid = this.active_icon.CenterReturnValid(this.x, this.y, this.rot, this.shape_icon);
				this.active_icon.SetInvalidPosition(!this.is_valid);
				
				for (var i = this.arti_data.length-1; i >= 0; i--) {
					if (this.arti_data[i] === this.active_arti) {
						this.arti_data.splice(i, 1);
						this.arti_icons.splice(i, 1);
					}
				}				
				
				this.UpdateOverlaps();
				this.RebuildConnections();
				this.RebuildArtis();
				this.render();
			}
			
	  },
		// Returns true if the x, y indicate a trash location.
		// Current bounds for trash:
    // -14, 10
    // -14, 17
    // -23, 17
    // -23, 10
		// Don't really need to check the min x.
		IsInTrash: function(x, y) {
			return x <= -14 && y >= 10;
		},
		// Unapplies any changes made in this session.
		ResetChanges: function() {
			if (this.orig_arti) {
				this.active_arti = SU.Clone(this.orig_arti);
			} else {
				this.active_arti = null;
				this.active_icon = null;
			}
	    this._initArtifactComplexRenderer(this.ship_or_hero, this.orig_arti, this.view_only, this.browse, this.callback);
			this.activate();			
		},
    teardown: function() {
      if (this.callback) {
        this.callback(this.completed);
      }
			SU.PopTier();
    },
  };
})();
