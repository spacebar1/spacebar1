
(function() {
    SBar.StarmapRenderer = function(tier) {
        this._initStarmapRenderer(tier);
    };

    SBar.StarmapRenderer.prototype = {
      tier: null,
			context: null,
			text_context: null,
      _initStarmapRenderer: function(tier) {
        this.tier = tier;
        this.context = this.tier.context;
        this.text_context = this.tier.text_context;
      },
      render: function() {
        S$.addButtons();
        this.renderFullUpdate();
				SU.clearText();
				SU.addText("V: Visit");
				SU.addText(SF.SYMBOL_SHIFT+"C: Recenter");
				SU.addText(SF.SYMBOL_SHIFT+"1-9: Set Waypoint");
				SU.addText("1-9: Center Waypoint");
				SU.addText("WASD: Scroll Map");
				SU.addText("R: Search");
				SU.addText("Z: Zoom Out");
				if (S$.conduct_data['cansave']) {
					SU.addText("G: Save Game");
				} else {
					SU.addText("G: Save and Exit");
				}
				if (this.tier.incoming_message) {
					SU.addText("M: Message Comms");
				}
				SU.addText("L: Look Around");
				if (this.tier.current_system_tier) {
					SU.addText("X: Return to system");
				}
      },
			// Redraws everything.
      renderFullUpdate: function() {
				this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);

				for (let race_icon of this.tier.sorted_race_icons) {
					race_icon.update(this.tier.mapcenterx, this.tier.mapcentery);							
				}

				// Alpha icons are complicated to cover up other pieces. Drawn in 3 stages.
				for (let icon of this.tier.region_icons) {
					for (let alpha_icon of icon.alpha_icons) {
						alpha_icon.update(this.tier.mapcenterx, this.tier.mapcentery, this.tier.cursorx, this.tier.cursory);
					}
				}
				
				for (let icon of this.tier.region_icons) {
          icon.update(this.tier.mapcenterx, this.tier.mapcentery, this.tier.cursorx, this.tier.cursory);
				}
				
				for (let icon of this.tier.region_icons) {
					for (let alpha_icon of icon.alpha_icons) {
						alpha_icon.update2(this.tier.mapcenterx, this.tier.mapcentery, this.tier.cursorx, this.tier.cursory);
					}
				}
				for (let icon of this.tier.region_icons) {
					for (let alpha_icon of icon.alpha_icons) {
						alpha_icon.update3(this.tier.mapcenterx, this.tier.mapcentery, this.tier.cursorx, this.tier.cursory);
					}
				}
				

				// Vision distance.
				let ship_draw_x = SF.HALF_WIDTH+(this.tier.shipx-this.tier.mapcenterx)/SF.STARMAP_ZOOM;
				let ship_draw_y = SF.HALF_HEIGHT+(this.tier.shipy-this.tier.mapcentery)/SF.STARMAP_ZOOM;
				let searched_multiplier = 1;
				if (this.tier.just_searched) {
					searched_multiplier = 2;
					//this.tier.just_searched = false;
				}
				SU.circle(this.context, ship_draw_x, ship_draw_y, searched_multiplier*this.tier.SensorRange(S$.ship.sensor_level), 'rgba(155,155,255,0.25)');

				this.tier.ship_icon.update(this.tier.mapcenterx, this.tier.mapcentery);
				//SU.circle(this.context, ship_draw_x, ship_draw_y, this.tier.GetMaxJumpDistance()/SF.STARMAP_ZOOM, undefined, "#224", 2)
				
				if (this.tier.incoming_message) {
					this.DrawIncomingMessage();
				}

				this.renderMouseUpdate();
				SU.Hide3dLayers(/*show_stars=*/false);										
      },
			// Ship is getting hailed.
			DrawIncomingMessage: function() {
        SU.rectCorner(this.context, 8, SF.HALF_WIDTH-165, SF.HEIGHT - 185, 330, 50, 'rgba(0,0,0,0.5)', "#300", 2);
				SU.text(this.context, "Incoming Transmission", SF.HALF_WIDTH, SF.HEIGHT - 150, SF.FONT_XLB, "#F00", 'center');
			},
			// Redraws just the items dependent on the cursor position.
			renderMouseUpdate: function() {
				this.text_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				// Don't clear any fading messages on the right.
				let racedata = this.tier.GetMouseRegionRaceData();
//					if (racedata.race.seed !== SF.RACE_SEED_ALPHA) {
        for (var region_icon of this.tier.region_icons) {
					region_icon.updateName(this.tier.mapcenterx, this.tier.mapcentery, this.tier.cursorx, this.tier.cursory);
        }
//					}
				this.writeCoords();
				if (racedata.core) {
					this.PrintRace(racedata.race);
				}					
        this.drawJumpJuice();
			},
      drawJumpJuice: function() {
        var distance = this.tier.getJumpDistance();
				var time = this.tier.GetTravelTime(distance);
				let multiplier = this.tier.just_searched ? 2 : 1;
				let color = "#88F";
				let travel_range = 5000;
				//let travel_range = S$.ship.sensors*65*multiplier;
				if (distance > travel_range) {
					if (distance > this.tier.MAX_TRAVEL_DISTANCE) {
						color = "#444";
					} else {
						color = "#F88";
					}
				}
        SU.rect(this.text_context, SF.HALF_WIDTH-80, SF.HEIGHT - 85, 160, 50, 'rgba(0,0,0,0.5)');
				SU.text(this.text_context, SU.TimeString(time), SF.HALF_WIDTH, SF.HEIGHT - 50, SF.FONT_XLB, color, 'center');
				if (S$.tow_ship) {
					SU.text(this.text_context, "Ship in tow", SF.HALF_WIDTH, SF.HEIGHT - 22, SF.FONT_MB, "#A44", 'center');
				}
				/*
          var energy = S$.energy;
          var max_energy = S$.max_energy;
          var cost = this.tier.getJumpCost();
          SU.rect(this.context, SF.HALF_WIDTH - 85, SF.HEIGHT - 85, max_energy+10, 40, 'rgba(0,0,0,0.75)', "#888", 1);
          if (energy - cost <= 0) {
              SU.rect(this.context, SF.HALF_WIDTH - 80, SF.HEIGHT - 100, max_energy, 10, "#888", "#040", 2);
          } else {
              SU.rect(this.context, SF.HALF_WIDTH - 80, SF.HEIGHT - 100, max_energy, 10, undefined, "#040", 2);
              SU.rect(this.context, SF.HALF_WIDTH - 80, SF.HEIGHT - 100, energy, 10, "#080");
              SU.rect(this.context, SF.HALF_WIDTH - 80, SF.HEIGHT - 100, energy - cost, 10, "#0F0");
          }
					SU.text(this.context, "Energy: "+cost, SF.HALF_WIDTH - 80, SF.HEIGHT - 70, SF.FONT_SB, '#888');
			  */
      },
      writeCoords: function() {
				let xy = coordToParsec(this.tier.cursorx) + ", " + coordToParsec(-this.tier.cursory) + " pc";
				if (S$.ship.sensor_level < SF.SENSOR_COORDINATES) {
					xy = "Unknown Location";
				}
				SU.writeCoordText("Interstellar", xy);
      },
			PrintRace: function(race) {
				if (S$.raceAlignment[race.seed] === undefined) {
					return;
				}
				if (race.seed !== SF.RACE_SEED_ALPHA && !S$.IsRaceKnown(race.seed) && S$.ship.sensor_level < SF.SENSOR_RACE_DOMAINS) {
					return;
				}
				let font = SF.FONT_L;
				let bold_font = SF.FONT_LB
				let spacing = 27;
				let color = "rgba(255,255,255,0.5)"
				let y = SF.HEIGHT-95;
				let x = 20;
        SU.rect(this.text_context, x-10, y-23, 340, SF.HEIGHT-y+20, 'rgba(0,0,0,0.5)');
				
				if (race.seed === SF.RACE_SEED_ALPHA) {
					let red = 'rgba(255,128,128,0.5)';
					SU.text(this.text_context, "unknown", x, y, font, red);
					SU.text(this.text_context, "unknown", x, y+spacing, font, red);
					SU.text(this.text_context, "unknown", x, y+spacing*2, font, red);
					//SU.text(this.text_context, "unknown", x, y+spacing*3, font, red);
				} else {
					SU.text(this.text_context, ST.RaceName(race.seed), x, y, font, color);
					SU.text(this.text_context, SF.SYMBOL_LEVEL+race.level, x, y+spacing, font, color);
					let alignment_score_text = " ("+race.alignment+"%)";
					if (race.alignment >= SF.FRIENDLY_SCORE) {
						SU.text(this.text_context, "Friendly"+alignment_score_text, x, y+spacing*2, font, 'rgba(255,255,255,0.5)');
					} else if (race.alignment >= SF.NEUTRAL_SCORE) {
						SU.text(this.text_context, "Neutral"+alignment_score_text, x, y+spacing*2, font, 'rgba(255,255,128,0.5)');
					} else {
						SU.text(this.text_context, "Hostile"+alignment_score_text, x, y+spacing*2, bold_font, 'rgba(255,128,128,0.5)');
					}
					if (S$.raceRival[race.seed]) {
						SU.text(this.text_context, "Rival: "+ST.RaceName(S$.raceRival[race.seed]), x, y+spacing*3, font, color);
					}
				}
				
				
				
				//if (race.alignment >= SF.FRIENDLY) {
				//	SU.text(this.text_context, "Friendly", 70, SF.HEIGHT-50, font, color);
				//} else {
				//	SU.text(this.text_context, "Hostile", 70, SF.HEIGHT-50, bold_font, 'rgba(255,128,128,0.5)');
				//}
			},
      teardown: function() {
				this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				this.text_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				//SC.textLayer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // Coord text.
				SU.clearText();
        // SB.clear();
      }
    };
    SU.extend(SBar.StarmapRenderer, SBar.TierRenderer);
})();
