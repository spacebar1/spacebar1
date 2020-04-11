/*
 * A little indicator of the player's location on the starmap.
 * Note this is also used for other maps.
 */
(function() {

    SBar.IconMapShip = function(tier, x, y, /*optional*/large) {
        this._initIconMapShip(tier, x, y, large);
    };

    SBar.IconMapShip.prototype = {
      type: SF.TYPE_SHIP_MAP_ICON,
			x: null,
			y: null,
      image: null,
      imagecontext: null,
      imagesize: 20,
      tier: null,
			_initIconMapShip: function(tier, x, y, large) {
        this.tier = tier;
        this.x = x;
        this.y = y;
				if (large) {
//	            this.buildImage();
					this.buildLargeImage();
				} else {
          this.buildImage();
				}
      },
      buildImage: function() {
        this.image = document.createElement('canvas');
        this.image.width = this.imagesize;
        this.image.height = this.imagesize;
        this.imagecontext = this.image.getContext('2d');
				//SU.text(this.imagecontext, "+", this.imagesize/2, 15, SF.FONT_S, '#88F', 'center'); //✶
				SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, 8, 'rgba(255,255,255,0.5)');
				SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, 8, 'rgba(0,0,0,0.5)');
				SU.line(this.imagecontext, this.imagesize/2 - 7, this.imagesize/2, this.imagesize/2 + 7, this.imagesize/2, "#FFF", 2);
				SU.line(this.imagecontext, this.imagesize/2, this.imagesize/2 - 7, this.imagesize/2, this.imagesize/2 + 7, "#FFF", 2);
				SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, 4, undefined, "#88F", 1);
      },
			buildLargeImage: function() {
				this.imagesize = 100;
        this.image = document.createElement('canvas');
        this.image.width = this.imagesize;
        this.image.height = this.imagesize;
        this.imagecontext = this.image.getContext('2d');
				SU.line(this.imagecontext, this.imagesize/2 - 40, this.imagesize/2, this.imagesize/2 + 40, this.imagesize/2, "#88F", 5);
				SU.line(this.imagecontext, this.imagesize/2, this.imagesize/2 - 40, this.imagesize/2, this.imagesize/2 + 40, "#88F", 5);
				SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, 40, 'rgba(155,155,255,0.6)');
//					SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, 40, undefined, "#88F", 10);
//					SU.circle(this.imagecontext, this.imagesize/2, this.imagesize/2, this.imagesize/2, "#88F");
			},
      update: function(shipx, shipy) {
          var offx = this.x - shipx;
          var offy = this.y - shipy;
          this.tier.context.drawImage(this.image, offx/SF.STARMAP_ZOOM + SF.HALF_WIDTH - this.imagesize/2, offy/SF.STARMAP_ZOOM + SF.HALF_HEIGHT - this.imagesize/2);
          return true;
      },
			updatedirect: function(context, x, y) {
        context.drawImage(this.image, x - this.imagesize/2, y - this.imagesize/2);
			},
      teardown: function() {
      },
    };
    SU.extend(SBar.IconMapShip, SBar.Icon);
})();

	
