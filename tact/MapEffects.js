/*
 * Map Effects Object
 * 
 * Handles stuff affecting the ground and heroes moving around
 * This object is stored separately from the Map() object, mainly to keep class size down
 */
(function() {

	JTact.MapEffects = function() {
		this._initMapEffects();
	};

	JTact.MapEffects.prototype = {
		mods: null,
		hexImg: null,
		lasty: null, // records the height of the window, if it was drawn
		_initMapEffects: function() {
			this.mods = [];

			this.hexImg = document.createElement('canvas');
			this.hexImg.width = TF.HEX_SIZE;
			this.hexImg.height = TF.HEX_SIZE;
			var ctx = this.hexImg.getContext('2d');
			TU.regularPolygon(ctx, TF.HEX_SIZE / 2, TF.HEX_SIZE / 2, 6, TF.HEX_SIZE / 2, "rgba(0,0,0,1)");
		},
		add: function(mod) {
			this.mods.push(mod);
			//if (this.mod.duration !== TF.FOREVER) {
                
				//}
			},
			remove: function(mod) {
				for (var i = 0; i < this.mods.length; i++) {
					if (this.mods[i] === mod) {
						this.mods.splice(i, 1);
					}
				}
			},
			drawIcons: function() {
				let ctx = TC.layer1;
				// Reduce the areas to just the building.
				//ctx.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			  //SU.rect(ctx, 0, 0, TF.WIDTH, TF.HEIGHT, "#FFF")
				ctx.drawImage(TG.data.map.building, 0, 0, SF.WIDTH, SF.HEIGHT);
				for (var i = 0; i < this.mods.length; i++) {
					var mod = this.mods[i];
					var xy = TG.data.map.getFullXY(mod.x, mod.y);
					var width = TF.HEX_SIZE * mod.size / 2;
					ctx.save();
					ctx.globalAlpha = 0.5;
					ctx.globalCompositeOperation = 'source-atop';
					ctx.drawImage(mod.icon, xy[0] - width, xy[1] - width, width * 2, width * 2);
					ctx.restore();
				}
			},
			// hero is moving
			// remove effects moving off and apply effects moving on. Don't change if the hero was on and stays on
			handleMove: function(hero, newx, newy, bypass_previous) {
				var map = TG.data.map;
				for (var i = 0; i < this.mods.length; i++) {
					var mod = this.mods[i];
					var wasOn = map.overlaps(hero.x, hero.y, hero.size, mod.x, mod.y, mod.size);
					if (bypass_previous) wasOn = false;
					var isOn = map.overlaps(newx, newy, hero.size, mod.x, mod.y, mod.size);
					if (wasOn && !isOn) {
						TU.logMessage(mod.displayName + " no longer affecting " + hero.name, ["end"]);
						mod.onExit(hero);
					} else if (!wasOn && isOn) {
						//TU.logMessage(mod.displayName+" now affecting "+hero.name);
						mod.onEnter(hero);
					}
				}
			},
			// highlight a hex and show its mods if any
			displayHex: function(x, y, show_grid) {
				if (TG.data.map.isValid(x, y)) {
					var xy = TG.data.map.getFullXY(x, y);
					if (show_grid) {
						TC.targLayer.drawImage(this.hexImg, xy[0] - TF.HEX_SIZE / 2, xy[1] - TF.HEX_SIZE / 2);
					}
					this.displayHexDetails(x, y);
				}
			},
			displayHexDetails: function(hexx, hexy) {
				var y = TF.TOP_SUMMARY_BUF+5;
				var origy = y;
				var ctx = TC.hudLayer;
				this.clear();
				//y += TU.wrapText(ctx, "Tile: " + hexx + ", " + hexy, 300, y + 15, 300, 15, SF.FONT_L, "#000") + 7;
//				TU.rect(ctx, 290, TF.TOP_SUMMARY_BUF, 370, y-TF.TOP_SUMMARY_BUF, "rgba(255,255,255,0.5)","#000",1)
				let text = [];
				let icons = [];
				for (let i = 0; i < this.mods.length; i++) {
					var mod = this.mods[i];
					if (TG.data.map.overlaps(hexx, hexy, 1, mod.x, mod.y, mod.size)) {
						icons.push(mod.icon);
						text.push(mod.displayName + ": " + mod.getText());
						//ctx.drawImage(mod.icon, 300, y, 20, 20);
						//var texty = TU.wrapText(ctx, mod.displayName + ": " + mod.getText(), 350, y + 15, 300, 17, SF.FONT_L, "#000");
						//y += Math.max(50, texty);
					}
				}
				if (this.mods.length > 0) {
					TU.rect(ctx, SF.HALF_WIDTH-200, TF.TOP_SUMMARY_BUF, 400, 100*text.length, "rgba(255,255,255,0.5)","#000",1)				
				}
				for (let i = 0; i < text.length; i++) {
					TU.wrapText(ctx, text[i], 360, 35 + i * 100, 330, 17, SF.FONT_L, "#000");
					ctx.drawImage(icons[i], 310, 15 + i * 100, 30, 30);
				}
				this.need_clear = 200;
//				this.lasty = y;
//				if (y !== origy) {
//				}
			},
			// Clear if needed
			clear: function() {
				if (this.need_clear) {
					TC.hudLayer.clearRect(SF.HALF_WIDTH-205, TF.TOP_SUMMARY_BUF - 1, 410, this.need_clear);
					this.need_clear = null;
				}
			}

		};
})();

 
