/*
This one kinda doubles as both a data object and a tier / renderer. Could fix that at some point.
 */

(function() {
	context: null,
    SBar.RuinsRenderer = function(custom_building) {
        this._initRuinsRenderer(custom_building);
    };

    SBar.RuinsRenderer.prototype = {
      type: SF.TIER_OBELISKR,
			context: null,
			data: null,
			custom_data: null,
			seed: null,
			_initRuinsRenderer: function(custom_building) {
				this.context = SC.layer1;
				this.data = custom_building;
				this.seed = this.data.custom_data.seed//custom_building.parent_data.seed;
				this.custom_data = this.data.custom_data.data;
      },
      activate: function() {
				SU.addText("R: Remove Sign")
				SU.addText("X: Leave")
				this.Render();
        SG.activeTier = this;				 
      },
			
			// Returns the height.
			DrawText: function(context, raceseed, seed, name, time) {
				let y = SF.HALF_HEIGHT-50;
				let top_line = ST.getWord(raceseed, seed++)+" "+ST.getWord(raceseed, seed++)+" "+ST.getWord(raceseed, seed++);
				top_line = top_line.toUpperCase();
	      y += SU.wrapText(context, top_line, SF.HALF_WIDTH, y, 350, 25, SF.FONT_L, '#000', 'center');
			
				let line = "";
				let num_lines = Math.floor(SU.r(seed, 9.21)*15)+5;
				let building_num = Math.floor(SU.r(seed, 9.23)*num_lines);
				for (let i = 0; i < num_lines; i++) {
					if (i > 0) {
						line += " ";
					}
					if (building_num === i) {
						line += name;
					} else {
						line += ST.getWord(raceseed, seed++);
					}
				}
				y += 5;
	      y += SU.wrapText(context, line.toLowerCase(), SF.HALF_WIDTH, y, 350, 20, SF.FONT_M, '#000', 'center');
			
				line = "";
				num_lines = Math.floor(SU.r(seed, 9.22)*15)+5;
				date_num = Math.floor(SU.r(seed, 9.24)*num_lines);
				for (let i = 0; i < num_lines; i++) {
					if (i > 0) {
						line += " ";
					}
					if (date_num === i) {
						line += SU.TimeString(time);
					} else {
						line += ST.getWord(raceseed, seed++);
					}
				}
				y += 10;
	      y += SU.wrapText(context, line.toLowerCase(), SF.HALF_WIDTH, y, 350, 20, SF.FONT_M, '#000', 'center');			
			
				return y-(SF.HALF_HEIGHT-50);
			},			
		
			Render: function() {
				let name = this.custom_data.building_name;
				let time = this.custom_data.time;
				let seed = this.seed;
				let raceseed = this.data.parent_data.raceseed;
				let context = this.context;
			
				context.save();
				let scalex = SU.r(seed, 17.1)*0.4+0.8;
				let scaley = SU.r(seed, 17.2)*0.4+0.8;
				context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
				let rot = SU.r(seed, 17.3)*0.08-0.04;
				context.rotate(rot*Math.PI);
				context.translate(-SF.HALF_WIDTH, -SF.HALF_HEIGHT);
				context.scale(scalex, scaley);
				let height = this.DrawText(context, raceseed, seed, name, time);
				let colorStops = [0, '#888', 0.5, '#AAA', 1, '#888'];
				SU.rectGrad(context, SF.HALF_WIDTH-10, SF.HALF_HEIGHT, 20, SF.HEIGHT*2, SF.HALF_WIDTH-10, 0, SF.HALF_WIDTH+20, 0, colorStops, "#000", 1);
				SU.rectCorner(context, 20, SF.HALF_WIDTH-200, SF.HALF_HEIGHT-100, 400, height+65, "#BB5");
				SU.circle(context, SF.HALF_WIDTH, SF.HALF_HEIGHT-70, 80, "#77C", "#BB5", 20);
				SU.rectCorner(context, 12, SF.HALF_WIDTH-190, SF.HALF_HEIGHT-90, 380, height+45, "#77C");
				SU.rectCorner(context, 12, SF.HALF_WIDTH-180, SF.HALF_HEIGHT-80, 360, height+25, "#AAC");
			
				context.save();
				context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT-115);
				for (let i = 0; i < 4; i++) {
					context.rotate(SU.r(seed, 8.21+i) * Math.PI * 2);
					SU.text(context, ST.getSymbol(seed+i), 0, 0, 'bold 30pt serif', "#BB5", 'center')
				}
				context.restore();
				this.DrawText(context, raceseed, seed, name, time);
				context.restore();
			},
			
      handleKey: function(key) {
        switch (key) {
          case SBar.Key.R:
						this.RemoveSign();
            break;
          default:
						this.Leave();
						break;
        }
      },
      Leave: function() {
				// Special case, extra pop to pull down the planetside background.
				SU.PopTier();
				SU.PopTier();
      },
			RemoveSign: function() {
				S$.RemoveCustomBuilding(this.data.parent_data, this.data.x, this.data.y);
				this.Leave();
			},
			teardown: function() {
				// no-op.
			},
    };
    SU.extend(SBar.RuinsRenderer, SBar.Tier);
})();
