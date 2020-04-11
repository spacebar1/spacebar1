(function() {

    SBar.BeltRenderer = function(tier) {
        this._initBeltRenderer(tier);
    };

    SBar.BeltRenderer.prototype = {
      tier: null,
      data: null,
      context: null,
      staty: null,
      starimg: null,
      starctx: null,
      statsimg: null,
      statsctx: null,
			ship_icon: null,
			//cursor: null,
      _initBeltRenderer: function(tierIn) {
        this.tier = tierIn;
        this.data = this.tier.data;
        this.context = this.tier.context;
        this.starimg = document.createElement('canvas');
        this.starimg.width = SF.WIDTH;
        this.starimg.height = SF.HEIGHT;
        this.starctx = this.starimg.getContext('2d');
        this.statsimg = document.createElement('canvas');
        this.statsimg.width = SF.WIDTH;
        this.statsimg.height = SF.HEIGHT;
        this.statsctx = this.statsimg.getContext('2d');
				//this.cursor = new SBar.IconCursor(this.context, this.tier.x, this.tier.y);
      },
      render: function() {
				this.ship_icon = new SBar.IconMapShip(this);
				SU.Hide3dLayers(/*show_stars=*/true);				
				//this.context.setTransform(SF.WIDTH/this.terrainwidth,0,0,SF.HEIGHT/this.terrainheight,0,0);
				SU.clearText();  // To work around dance floor getting drawn twice?
				if (!this.data.is_party_yacht) {
					SU.addText("V: Visit");
				}
				var building_num = 1;
				for (var i = 0; i < this.tier.asteroids.length; i++) {
					var asteroid = this.tier.asteroids[i];
					if (asteroid.building_name) {
						SU.addText(building_num+": "+asteroid.building_name[0]+" "+asteroid.building_name[1]);
						building_num++;
					}
				}
				SU.addText("X: System");
			
        S$.addButtons();
        //SB.buttX(this.tier.depart.bind(this.tier));

        var name1 = this.data.name;
        var name2 = this.data.systemData.name;
				if (S$.ship.sensor_level < SF.SENSOR_NAMES) {
					name1 = "Unknown Belt";
					name2 = "Unknown System";
				}
        SU.writeCoordText(name1, name2);

				/*let starxy =*/// SU.DrawStar(this.starctx, this.data.systemData, this.data.distanceOut, this.data.x)
				//if (starxy) {
					// Draw line to alpha core.
				//	SU.triangle(this.starctx, starxy[0], starxy[1], -this.data.starport_rad*100+SF.HALF_WIDTH, SF.HALF_HEIGHT, this.data.starport_rad*100+SF.HALF_WIDTH, SF.HALF_HEIGHT, 'rgba(255, 255, 255, 0.25)')
					//}
        this.staty = 110;
				this.renderStats();
        this.renderUpdate();
      },
      renderStats: function() {
				/*
				if (this.data.is_party_yacht) {
					// Leave it blank.
				} else if (this.data.is_starport) {
					SU.rect(this.statsctx, 25, 85, 300, 67, 'rgba(0,0,0,0.25)');
          this.addStat("Shop Bays: " + (this.tier.asteroids.length-1));
          this.addStat("Radius: " + round2good(this.data.starport_rad*100)+"m");
				} else {
					SU.rect(this.statsctx, 25, 85, 300, 35, 'rgba(0,0,0,0.25)');
          this.addStat("Large asteroids: " + this.tier.asteroids.length);
				}
				*/
			},
      addStat: function(text) {
        SU.text(this.statsctx, text, 40, this.staty, SF.FONT_L, '#AAA');
        this.staty += 30;
      },
      renderUpdate: function() {
        this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
//  					SU.rect(this.context,0, 0, SF.WIDTH,SF.HEIGHT,"#888")

				this.tier.dust.update(SF.HALF_WIDTH-200, SF.HALF_HEIGHT-200, 22);
				this.context.globalAlpha = 0.5;
				this.tier.dust.update(SF.HALF_WIDTH, SF.HALF_HEIGHT, 15);
				this.context.globalAlpha = 1;
				
        this.context.drawImage(this.starimg, 0, 0);
        for (var obj in this.tier.objs) {
            if (!this.tier.objs[obj].update(this.tier.mousex, this.tier.mousey)) {
                delete this.tier.objs[obj];
            }
        }
				
				if (this.data.is_starport) {
					if (!this.cache_image) {
	          this.cache_image = document.createElement('canvas');
	          this.cache_image.width = SF.WIDTH;
	          this.cache_image.height = SF.HEIGHT;
						context = this.cache_image.getContext('2d');
						context.save();
						context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
						this.data.DrawStarport(context, SF.HALF_HEIGHT*this.data.starport_rad);
						context.restore();
					}
					this.context.drawImage(this.cache_image, 0, 0);
				} else if (this.data.is_party_yacht) {
					if (!this.cache_image) {
	          this.cache_image = document.createElement('canvas');
	          this.cache_image.width = SF.WIDTH;
	          this.cache_image.height = SF.HEIGHT;
						context = this.cache_image.getContext('2d');
						context.save();
						context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
						this.data.DrawAlphaPartyYacht(context, SF.WIDTH, SF.HEIGHT);
						context.restore();
					}
					this.context.drawImage(this.cache_image, 0, 0);
				}

        for (var obj in this.tier.asteroids) {
            if (SG.activeTier === this.tier) {
							this.tier.asteroids[obj].update(this.tier.mousex, this.tier.mousey);
            }
        }
				
				this.context.globalAlpha = 0.25;
				this.tier.dust.update(SF.HALF_WIDTH+200, SF.HALF_HEIGHT+200, 30);
				this.context.globalAlpha = 1;
					
        if (SG.activeTier === this.tier) {
					for (asteroid of this.tier.asteroids) {
            if (asteroid.updateName(this.tier.mousex, this.tier.mousey)) {
            	break;
            }
          }
        }
        this.context.drawImage(this.statsimg, 0, 0);	
				
				if (this.tier.shipx !== null) {
					//const coords = this.TranslateCoords([this.tier.shipx, this.tier.shipy])
					//this.ship_icon.updatedirect(this.iconcontext, coords[0], coords[1]+SURFACE_OFFSET);
					this.ship_icon.updatedirect(this.context, this.tier.shipx, this.tier.shipy);
				}								
      },
      teardown: function() {
					//	this.context.setTransform(1,0,0,1,0,0);
          this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
					SU.clearText();
          //SB.clear();
      }
    };
    SU.extend(SBar.BeltRenderer, SBar.TierRenderer);
})();
