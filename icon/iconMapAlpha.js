/*
 * Stores the area of control for a race.
 * See 5regionD for the object structure of a race.
 */
(function() {
	let fullsize = 300;
	let halfsize = 150;
	let image = null;
	
    SBar.IconMapAlpha = function(region, tier, raceData) {
        this._initIconMapAlpha(region, tier, raceData);
    };

    SBar.IconMapAlpha.prototype = {
        type: SF.TYPE_MAPRACE_ICON,
				region: null,
				tier: null,
				race: null,
				seed: null,
				image: null,
				in_bubble: false,
  			_initIconMapAlpha: function(region, tier, raceData) {
					this.region = region;
          this.tier = tier;
          this.race = raceData;
					this.seed = SU.r(this.race.bubbles[0].x, this.race.bubbles[0].y);
					
					// See if the player is in this bubble, or if this bubble overlaps with one the player is in.
					if (S$.in_alpha_space) {
						for (bubble of S$.alpha_bubbles) {
							let offx = bubble.x - this.race.bubbles[0].x;
							let offy = bubble.y - this.race.bubbles[0].y;
							let max_dist = bubble.size + this.race.bubbles[0].size;
							if (offx*offx + offy*offy < max_dist*max_dist) {
								this.in_bubble = true;
								break;
							}
						}
					}
					
					this.BuildImage();
        },
				BuildImage: function() {
          this.image = document.createElement('canvas');
          this.image.width = fullsize;
          this.image.height = fullsize;
					context = this.image.getContext('2d');
					
					let pattern = SU.GetAlphaPattern(this.seed);
					//let pattern = SU.GetFillPattern(Math.floor(SU.r(this.seed, 52.31)*40)+20, SU.r(this.seed, 15.21), 50, 50, 50, /*max_brightness=*/50);
					context.drawImage(pattern, 0, 0, fullsize, fullsize)
					context.save();
					context.globalCompositeOperation = "destination-in";
					let color_stops = [0, 'rgba(0,0,0,1)', 1, 'rgba(50,50,50,0.0)'];
					if (this.in_bubble) {
						color_stops = [1, 'rgba(255,255,255,1)', 0, 'rgba(255,255,255,0.0)'];
					}
					SU.circleRad(context, halfsize, halfsize, halfsize, color_stops)
					context.restore();
				},
				// Called before stars and stuff.
        update: function(shipx, shipy, mousex, mousey) {
					if (this.in_bubble) {
						this.DrawBlack(shipx, shipy);
						this.DrawSurface(shipx, shipy);
					}
        },
				DrawBlack: function(shipx, shipy) {
          let offx = this.race.bubbles[0].x - shipx;
          let offy = this.race.bubbles[0].y - shipy;
					SU.circle(this.tier.context, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT, this.race.bubbles[0].size/SF.STARMAP_ZOOM, "#000");
				},
				DrawSurface: function(shipx, shipy) {
          let offx = this.race.bubbles[0].x - shipx;
          let offy = this.race.bubbles[0].y - shipy;
					let size = 2*this.race.bubbles[0].size/SF.STARMAP_ZOOM;
					this.tier.context.drawImage(this.image, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH-size/2, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT-size/2, size, size)
				},
				// Called after stars and stuff.
        update2: function(shipx, shipy, mousex, mousey) {
					if (!this.in_bubble) {
						this.DrawBlack(shipx, shipy);
					}
        },
				// Called again at end, to merge the bubble images.
        update3: function(shipx, shipy, mousex, mousey) {
					if (!this.in_bubble) {
						this.DrawSurface(shipx, shipy);
					}
        },
        teardown: function() {
        },
    };
    SU.extend(SBar.IconMapRace, SBar.Icon);
})();

	
