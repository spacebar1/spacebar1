/*
 * Stores the area of control for a race.
 * See 5regionD for the object structure of a race.
 */
(function() {
	let fullsize = 1000;
	let halfsize = 500;
	
    SBar.IconMapRace = function(region, tier, raceData) {
        this._initIconMapRace(region, tier, raceData);
    };

    SBar.IconMapRace.prototype = {
        type: SF.TYPE_MAPRACE_ICON,
				region: null,
				tier: null,
				race: null,
				seed: null,
				r: null,
				g: null,
				b: null,
				image: null,
  			_initIconMapRace: function(region, tier, raceData) {
					this.region = region;
          this.tier = tier;
          this.race = raceData;
					this.seed = raceData.seed;
          this.buildBubblesImage();
        },
        buildBubblesImage: function() {
          this.image = document.createElement('canvas');
          this.image.width = fullsize;
          this.image.height = fullsize;
					imagecontext = this.image.getContext('2d');
					
					if (this.race.bubbles.length == 0) {
						return;
					}
					let centerx = this.race.bubbles[0].x;
					let centery = this.race.bubbles[0].y;
					
					let r = Math.floor(SU.r(this.seed,7.51)*60);					
					let g = Math.floor(SU.r(this.seed,7.52)*60);					
					let b = 60 - Math.min(r,g);

					
					this.pattern = SU.BuildRaceStamp(this.seed, r, g, b);//SU.GetFillPattern(stamp_size, this.seed, r, g, b);
					
					/*  The original symbol-based visualization was really nice, but it was a starmap scrolling performance bottleneck.
					context.save();
					context.translate(stamp_size/2, stamp_size/2);
					for (let i = 0; i < Math.floor(SU.r(this.seed,8.5)*4)+2; i++) {
						context.rotate(SU.r(this.seed,8.51+i) * PIx2);
						let size = SU.r(this.seed,8.52+i)*20 + 10;
						SU.text(context, ST.getSymbol(this.seed+i), 0, size/4, 'bold '+size+'pt '+SF.FONT, 'rgb('+r+','+g+','+b+')', 'center');
					}					
					context.restore();
					*/
//					SU.circle(imagecontext, 250, 250, 500, this.pattern);

//          imagecontext.globalCompositeOperation = 'source-in';

					for (let bubble of this.race.bubbles) {
					  let offx = bubble.x - centerx;
					  let offy = bubble.y - centery;
						SU.circle(imagecontext, offx/SF.STARMAP_ZOOM+halfsize, offy/SF.STARMAP_ZOOM+halfsize, bubble.size/SF.STARMAP_ZOOM, 'rgb('+r*2+','+g*2+','+b*2+')');
					}
					for (let bubble of this.race.bubbles) {
            let offx = bubble.x - centerx;
            let offy = bubble.y - centery;
						SU.circle(imagecontext, offx/SF.STARMAP_ZOOM+halfsize, offy/SF.STARMAP_ZOOM+halfsize, bubble.size/SF.STARMAP_ZOOM-2, 'rgb('+(r/2)+','+(g/2)+','+(b/2)+')');
					}
					imagecontext.save();
					// Single beginpath here to get the pattern all in one draw (no bubble overlaps).
		      imagecontext.beginPath();
					for (let bubble of this.race.bubbles) {
            let offx = bubble.x - centerx;
            let offy = bubble.y - centery;
			      imagecontext.arc(offx/SF.STARMAP_ZOOM+halfsize, offy/SF.STARMAP_ZOOM+halfsize, bubble.size/SF.STARMAP_ZOOM-2, 0, PIx2, false);
					}
		      imagecontext.closePath();
					imagecontext.rotate(SU.r(this.seed, 39.39) * PIx2) // Matches 1BuildingAlienR.
	        imagecontext.fillStyle = this.pattern;
	        imagecontext.fill();
					imagecontext.restore();
        },
        update: function(shipx, shipy, mousex, mousey) {
					//
					// Reminder this is called explicitly.
					// Ordering needs to be handled explicitly.
					//
					if (this.race.bubbles.length == 0) {
						return;
					}
          let offx = this.race.bubbles[0].x - shipx;
          let offy = this.race.bubbles[0].y - shipy;
					if (!S$.IsRaceKnown(this.seed)) {
						// Remove this race region from view (carve it out from others) if not discovered yet.
						this.tier.context.save();
						this.tier.context.globalCompositeOperation = "destination-out"
						this.tier.context.drawImage(this.image, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH-halfsize, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT-halfsize)
						this.tier.context.restore();
					} else {
						this.tier.context.drawImage(this.image, offx/SF.STARMAP_ZOOM+SF.HALF_WIDTH-halfsize, offy/SF.STARMAP_ZOOM+SF.HALF_HEIGHT-halfsize)
					}
        },
        teardown: function() {
        },
    };
    SU.extend(SBar.IconMapRace, SBar.Icon);
})();

	
