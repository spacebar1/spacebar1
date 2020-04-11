/*
 * Belt icon on the system map. Also used for Starport.
 */

(function() {

    SBar.IconBelt = function(tier, beltData) {
        this._initIconBelt(tier, beltData);
    };

    SBar.IconBelt.prototype = {
        type: SF.TYPE_BELT_ICON,
        data: null,
        rendered: false,
        tier: null, // active system tier
        imagesize: 60,
        renderer: false,
        image: null,
        quest: null,
        _initIconBelt: function(tier, beltData) {
            this.tier = tier;
            this.data = beltData;

            var x = this.data.x;
            var y = this.data.y;
            for (var i = 0; i < S$.quests.length; i++) {
                if (S$.quests[i].x === x && S$.quests[i].y === y) {
                    this.quest = new SBar.IconQuestTarget(S$.quests[i], this.tier.context, x * SF.SYSTEM_ZOOM, y * SF.SYSTEM_ZOOM);
                    break;
                }
            }
            //this.quest = new SBar.IconQuestTarget(this.tier.context, x * SF.SYSTEM_ZOOM, y * SF.SYSTEM_ZOOM);
        },
        update: function(shipx, shipy) {
            var offx = this.data.x - shipx;
            var offy = this.data.y - shipy;
            offx *= SF.SYSTEM_ZOOM;
            offy *= SF.SYSTEM_ZOOM;

            if (!this.rendered) {
                this.rendered = true;
                this.image = document.createElement('canvas');
                this.image.width = this.imagesize;
                this.image.height = this.imagesize;
                var context = this.image.getContext('2d');
								
								context.save();
								context.translate(this.imagesize/2, this.imagesize/2);
								if (this.data.is_party_yacht) {
									this.data.DrawAlphaPartyYacht(context, this.imagesize/3, this.imagesize/3);
								} else if (this.data.is_starport) {
									this.data.DrawStarport(context, this.data.starport_rad/4*this.imagesize);
									context.restore();
								} else {
									// Draw belt.
	                context.save();
	               // context.translate(this.imagesize / 2, this.imagesize / 2);
	                context.rotate(-this.data.angle);
	                context.scale(1, 0.5);

	                //var color = Math.floor(SU.r(belt.seed, 17)*150);
	                var color = 150;
	                var colorStops = [0, 'rgba(' + color + ',' + color + ',' + color + ',0.5)', 1, 'rgba(' + 0 + ',' + 0 + ',' + 0 + ',0.0)'];
	                SU.circleRad(context, 0, 0, this.imagesize / 2, colorStops);
								}
                context.restore();
            }

            if (this.quest !== null) {
                this.quest.update(shipx * SF.SYSTEM_ZOOM, shipy * SF.SYSTEM_ZOOM);
            }
            this.tier.context.drawImage(this.image, offx - this.imagesize / 2 + SF.HALF_WIDTH, offy - this.imagesize / 2 + SF.HALF_HEIGHT);

						/*
            if (d2 < this.data.radius * this.data.radius) {
                if (!this.data.justentered) {
                    this.data.activateTier(shipx, shipy, true);
                }
            } else if (this.data.justentered) {
                this.data.justentered = false;
            }
						*/

            return true;

        },
				OverBelt: function(shipx, shipy, x, y) {
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
          offx *= SF.SYSTEM_ZOOM;
          offy *= SF.SYSTEM_ZOOM;					

					var offx2 = offx - x;
					var offy2 = offy - y;
          var d2 = offx2 * offx2 + offy2 * offy2;
          return d2 < 200;
				},
				checkClick:function (shipx, shipy, clickx, clicky) {
          if (this.OverBelt(shipx, shipy, clickx, clicky)) {
						return true;
					}
					return false;
				},				
				updateName: function(shipx, shipy, x, y) {
					if (this.OverBelt(shipx, shipy, x, y)) {
						let writex = -SF.SYSTEM_ZOOM*(shipx - this.data.x);
						let writey = -SF.SYSTEM_ZOOM*(shipy - this.data.y);
						this.DrawNameAt(writex+SF.HALF_WIDTH, writey+SF.HALF_HEIGHT*2/3-20);
						return true;
					}
					return false;
				},
				DrawNameAt: function(x, y) {
					SU.text(SC.layer2, this.data.name, x, y, SF.FONT_SB, "#FFF", 'center');
				},
				updateBig: function(absolutex, absolutey) {
          if (this.quest) {
              this.quest.update(-absolutex+this.data.x*SF.SYSTEM_ZOOM, -absolutey+this.data.y*SF.SYSTEM_ZOOM, true);
          }
          this.tier.context.drawImage(this.image, absolutex - this.imagesize/2, absolutey - this.imagesize/2, this.imagesize, this.imagesize);
				},
        teardown: function() {
        }
    };
    SU.extend(SBar.IconBelt, SBar.Icon);
})();

	
