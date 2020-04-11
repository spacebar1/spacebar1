/*
This one kinda doubles as both a data object and a tier / renderer. Could fix that at some point.
 */

(function() {
	context: null,
    SBar.ObeliskRenderer = function(building_data) {
        this._initObeliskRenderer(building_data);
    };

    SBar.ObeliskRenderer.prototype = {
      type: SF.TIER_OBELISKR,
			context: null,
			data: null,
			_initObeliskRenderer: function(building_data) {
				this.context = SC.layer1;
				this.data = building_data;
				this.seed = this.data.seed;
      },
      activate: function() {
				SU.addText("1: Inspect")
				SU.addText("X: Leave")
				this.Render();
//	      SG.activeTier.teardown();
        SG.activeTier = this;				 
      },
		
			Render: function() {
				let context = this.context;
				let height = Math.round(SU.r(this.seed, 6.1)*SF.HALF_HEIGHT/2);
				let topwidth = Math.round(SU.r(this.seed, 6.2)*160)+30;
				let basewidth = topwidth+Math.round(SU.r(this.seed, 6.2)*125)+15;
				
				// Right side.
	      context.beginPath();
	      context.moveTo(SF.HALF_WIDTH+basewidth/4, SF.HEIGHT);
				context.lineTo(SF.HALF_WIDTH+basewidth, SF.HEIGHT);
				context.lineTo(SF.HALF_WIDTH+basewidth/2, height+topwidth/2);
				context.lineTo(SF.HALF_WIDTH+basewidth/3, height);
	      context.closePath();
				
				//let mid = SU.r(this.seed, 6.3)*0.5+0.25;
				let mid = SU.r(this.seed, 6.3);
				let r = Math.round(SU.r(this.seed, 6.4)*128);
				let g = Math.round(SU.r(this.seed, 6.5)*128);
				let b = Math.round(SU.r(this.seed, 6.6)*128);
				let lighten = Math.round(SU.r(this.seed, 6.7)*80)+39;
				let dark = "rgb("+r+","+g+","+b+")";
				let light = "rgb("+(r+lighten)+","+(g+lighten)+","+(b+lighten)+")";
				let darker = "rgb("+Math.round(r/2)+","+Math.round(g/2)+","+Math.round(b/2)+")";
				var colorStops = [0, "#000", mid, dark, 1, "#000"];
	      var grd = context.createLinearGradient(0, SF.HEIGHT, 0, height);
	      for (var n = 0; n < colorStops.length; n += 2) {
	        grd.addColorStop(colorStops[n], colorStops[n + 1]);
	      }
	      context.fillStyle = grd;
	      context.fill();
				
				// Left side.
	      context.beginPath();
	      context.moveTo(SF.HALF_WIDTH+basewidth/3, SF.HEIGHT);
				context.lineTo(SF.HALF_WIDTH-basewidth, SF.HEIGHT);
				context.lineTo(SF.HALF_WIDTH-basewidth/3, height+topwidth/2);
				context.lineTo(SF.HALF_WIDTH+basewidth/3, height);
	      context.closePath();
				var colorStops = [0, dark, mid, light, 1, dark];
	      var grd = context.createLinearGradient(0, SF.HEIGHT, 0, height);
	      for (var n = 0; n < colorStops.length; n += 2) {
	        grd.addColorStop(colorStops[n], colorStops[n + 1]);
	      }
	      context.fillStyle = grd;
	      context.fill();
				
				// Symbols.
				let num_sets = 15;
				for (let i = 0; i < num_sets; i++) {
					context.save();
					context.translate(SF.HALF_WIDTH-basewidth/3*i/num_sets, (SF.HEIGHT-height)*i/num_sets+height+topwidth*2/3);
					for (let j = 0; j < 3; j++) {
						let symbol = ST.getSymbol(SU.r(this.seed, i+j*0.1));
						context.rotate(SU.r(this.seed, i+j*0.15)*PIx2);
						SU.text(context, symbol, 0, 0, 'bold '+topwidth/4+'pt serif', darker, 'center')
					}
					context.restore();
				}
				// Don't set the coordtext, because it's already written by the PlanetsideR.
			},
			
			Inspect: function() {
				let raw_name = this.data.name;
				let full_name = raw_name[0]+" "+raw_name[1];
				let time = Math.round(SU.r(this.seed, S$.time)*3)+1;
				if (!SE.PassTime(time)) {
					return;
				}
				
				let message = "You expend great effort in attempt to decipher the symbols on the pillar. Either the symbols are nonsense, "+
				"or you aren't very bright. Eventually you give up and decide to head back to the "+S$.ship.name+". But as you depart the runes begin "+
				"to glow. Suddently you can interpret their purpose clearly. The monument's message reads:\n\n"+
				"    \""+ST.obeliskMessage(this.seed)+"\"\n\n"+
				"As the glowing symbols fade they imbue a residual hue on the ship and crew to guide your way:\n\n    ";
				
				let effect_fields = {name: full_name, seed: this.seed, level: Math.floor(this.data.level/2)+1};
				S$.battle_effect = effect_fields;
				
				message += new SBar.PersistEffect(effect_fields).Text();
				
				let system = this.data.parentData.systemData;
				let log_message = "Visited "+full_name+" in "+this.data.parentData.name+" "+coordToParsec(system.x) + ", " + coordToParsec(-system.y) + " pc";
				S$.logMessage(log_message);
				
				SU.ShowWindow(full_name, message, undefined, '☗');
			},
			
      handleKey: function(key) {
        switch (key) {
	        case SBar.Key.NUM1:
	          this.Inspect();
	          break;
          case SBar.Key.X:
            this.Leave();
            break;
          default:
            error("unrecognized key in inr: " + key);
        }
      },
      Leave: function() {
				// Special case, extra pop to pull down the planetside background.
				SU.PopTier();
				SU.PopTier();
      },
			teardown: function() {
				// no-op.
			},
    };
    SU.extend(SBar.ObeliskRenderer, SBar.Tier);
})();
