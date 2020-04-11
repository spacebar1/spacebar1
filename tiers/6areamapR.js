// Super-region map.
// Intended to be pushed. Not intended to be interactive.

(function() {
    SBar.AreaMapRenderer = function(x, y, shipx, shipy) {
        this._initAreaMapRenderer(x, y, shipx, shipy);
    };
		
		let zoom_levels = [2, 4, 8];

    SBar.AreaMapRenderer.prototype = {
			type: SF.TIER_BIGMAP,
			x: null,
			y: null,
			shipx: null,
			shipy: null,
			context: null,
			text_context: null,
			zoom_index: null,  // Current index into zoom_levels.
			zoom_level: null,
			_initAreaMapRenderer: function(x, y, shipx, shipy) {
				this.x = x;
				this.y = y;
				this.shipx = shipx;
				this.shipy = shipy;
			  this.context = SC.layer2;
			  this.text_context = SC.layer2;
				this.zoom_index = 0;
      },
			
	    activate: function() {
	      this.minx = SU.AlignByRegion(this.x);
	      this.miny = SU.AlignByRegion(this.y);
				SG.activeTier = this;
				SU.clearText();
				if (this.zoom_index < zoom_levels.length-1) {
					SU.addText("Z: Zoom Out");
				}
				SU.addText("I: Zoom In");
				SU.addText("X: Return");

				let zoom_level = zoom_levels[this.zoom_index];
				this.zoom_level = zoom_level;

				this.context.save();
				SU.rect(this.context, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");
				
				// Wipe out the lower layer due to races running destination-out.
				// And clear the coordinates that will get pulled out as well.
				SU.rect(SC.layer1, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");
//				SC.textLayer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
				this.context.scale(1/zoom_level, 1/zoom_level);
				this.context.translate(SF.HALF_WIDTH*(zoom_level-1), SF.HALF_HEIGHT*(zoom_level-1));
				
				let sorted_race_icons = [];
//				for (let region_icon of this.region_icons) {
//					this.sorted_race_icons = this.sorted_race_icons.concat(region_icon.races);
//				}
//				this.sorted_race_icons.sort(function(left, right){return left.race.seed - right.race.seed;}); // Lowest first.					
				
				
				let outs = Math.round(zoom_level*0.6)+1;
				let icons = [];
	      for (var xi = -outs; xi <= outs; xi++) {
          for (var yi = -outs; yi <= outs; yi++) {
            var newx = this.minx + xi * SF.REGION_SIZE;
            var newy = this.miny + yi * SF.REGION_SIZE;
            var data = new SBar.RegionData(newx, newy);
            var icon = new SBar.IconMapRegion(this, data);
            //icon.update(this.x, this.y, 0, 0);
						sorted_race_icons = sorted_race_icons.concat(icon.races);
						icons.push(icon);
          }
	      }
				
				sorted_race_icons.sort(function(left, right){return left.race.seed - right.race.seed;}); // Lowest first.
				for (let race_icon of sorted_race_icons) {
					race_icon.update(this.x, this.y);
				}

				for (let icon of icons) {
					for (let icon2 of icon.alpha_icons) {
						icon2.update(this.x, this.y, 0, 0);
					}
				}

				for (icon of icons) {
					icon.update(this.x, this.y, 0, 0);
				}
				
				for (let icon of icons) {
					for (let icon2 of icon.alpha_icons) {
						icon2.update2(this.x, this.y, 0, 0);
					}
				}
				for (let icon of icons) {
					for (let icon2 of icon.alpha_icons) {
						icon2.update3(this.x, this.y, 0, 0);
					}
				}
				
				new SBar.IconMapShip(this, this.shipx, this.shipy, /*large=*/true).update(this.x, this.y);
				this.context.restore();
				
				SU.rectCorner(this.context, 8, SF.HALF_WIDTH-200, 25, 400, 30, 'rgba(30,30,60,0.5)', "#448", 2);
				let text = "Area Map x"+zoom_level;
	      SU.text(this.context, text, SF.HALF_WIDTH, 50, SF.FONT_XL, '#88F', 'center');
				
			},
			
	    handleKey: function(key) {
				switch (key) {
					case SBar.Key.NUM1:
					case SBar.Key.SPACE:
					case SBar.Key.X:
					case SBar.Key.R:
			      this.teardown();
						return;
				  case SBar.Key.Z:
						if (this.zoom_index < zoom_levels.length-1) {
							this.zoom_index++;
						}
						this.activate();
						break;
				  case SBar.Key.I:
						if (this.zoom_index > 0) {
							this.zoom_index--;
							this.activate();
						} else if (this.zoom_index === 0){
							this.teardown();
						}
						break;
				}
	      error("unrecognized key pressed in 6areamapr: " + key);
	    },
			
	    teardown: function(key) {
				SU.PopTier();
	      //if (this.callback) {
	      //  this.callback(key);
	      //}
	    },
    };
})();
