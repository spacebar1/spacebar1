/*
 * Planet or moon icon on the system map.
 */

(function() {
    var imgInhab = null; // inhabited indicator
    var imgTemple = null; // inhabited indicator
    var imgSize = 50;

    SBar.IconPlanet = function(tier, planetData) {
        this._initIconPlanet(tier, planetData);
    };

    SBar.IconPlanet.prototype = {
      type: SF.TYPE_PLANET_ICON,
      data: null,
      rendered: false,
      tier: null, // active system tier
      terrainwidthsmall: 64,
      terrainheightsmall: 64,
      planetCanvas: null,
      cloudCanvas: null,
      quest: false,
      templeEffect: null,
      _initIconPlanet: function(tier, planetData) {
				this.tier = tier;
        this.data = planetData;

        this.planetTerrain = this.data.getPlanetTerrain();
        this.cloudTerrain = this.data.getCloudTerrain();

				let base_x = this.data.base_x;
				let base_y = this.data.base_y;
        var x = this.data.x;
        var y = this.data.y;
        for (var i = 0; i < S$.quests.length; i++) {
            if (S$.quests[i].x === base_x && S$.quests[i].y === base_y) {
                this.quest = new SBar.IconQuestTarget(S$.quests[i], this.tier.context, 0, 0);
            }
        }
        //this.quest = new SBar.IconQuestTarget(S$.quests[i], this.tier.context, 0, 0);
				/*
        if (S$.found(this.data.seed + SF.TYPE_TEMPLE_BAR)) {
            this.templeEffect = new SBar.IconTempleEffect(this.tier.context, x * SF.SYSTEM_ZOOM, y * SF.SYSTEM_ZOOM, true);
        } else if (S$.found(this.data.seed + SF.TYPE_TEMPLE)) {
            this.templeEffect = new SBar.IconTempleEffect(this.tier.context, x * SF.SYSTEM_ZOOM, y * SF.SYSTEM_ZOOM, false);
        }
				*/
        if (imgInhab === null) {
            this.buildImages();
        }
        this.scaleSize = this.data.radius * 2;
      },
      buildImages: function() {
        imgInhab = document.createElement('canvas');
        imgInhab.width = imgSize;
        imgInhab.height = imgSize;
        var ctx = imgInhab.getContext('2d');
        var color = 'rgba(0, 128, 0, 0.5)';
        SU.line(ctx, 0, imgSize / 2, imgSize, imgSize / 2, color, 2);
        SU.line(ctx, imgSize / 2, 0, imgSize / 2, imgSize, color, 2);
        SU.circle(ctx, imgSize / 2, imgSize / 2, imgSize / 2 - 3, undefined, color, 4);

        imgTemple = document.createElement('canvas');
        imgTemple.width = imgSize;
        imgTemple.height = imgSize;
        var ctx = imgTemple.getContext('2d');
        color = 'rgba(128, 128, 128, 0.5)';
        var d = imgSize / 2 * 0.70;
        SU.line(ctx, imgSize / 2 - d, imgSize / 2 - d, imgSize / 2 + d, imgSize / 2 + d, color, 2);
        SU.line(ctx, imgSize / 2 - d, imgSize / 2 + d, imgSize / 2 + d, imgSize / 2 - d, color, 2);
        SU.circle(ctx, imgSize / 2, imgSize / 2, imgSize / 2 - 7, undefined, color, 4);
      },
      update: function(shipx, shipy, clickx, clicky) {
        var offx = this.data.x - shipx;
        var offy = this.data.y - shipy;
        offx *= SF.SYSTEM_ZOOM;
        offy *= SF.SYSTEM_ZOOM;
				
				if (this.data.ggiant) {
					this.data.DrawRingsBack(this.tier.context, offx + SF.HALF_WIDTH, offy + SF.HALF_HEIGHT, 0.07);
				}
        this.planetTerrain.renderSmall(this.tier.context, offx + SF.HALF_WIDTH, offy + SF.HALF_HEIGHT);
        if (this.data.hasclouds && !this.data.ggiant) {
            this.cloudTerrain.renderSmall(this.tier.context, offx + SF.HALF_WIDTH, offy + SF.HALF_HEIGHT);
        }
				if (this.data.ggiant) {
					this.data.DrawRingsFore(this.tier.context, offx + SF.HALF_WIDTH, offy + SF.HALF_HEIGHT, 0.07);
				}
        if (this.quest) {
            this.quest.update(-offx, -offy);
        }
				
				/*
        if (d2 < this.data.radius * this.data.radius) {
            if (!this.data.justentered) {
                this.data.activateTier();
            }
        } else if (this.data.justentered) {
            this.data.justentered = false;
        }
				*/

        return true;
      },
			OverPlanet: function(shipx, shipy, x, y) {
        var offx = this.data.x - shipx;
        var offy = this.data.y - shipy;
        offx *= SF.SYSTEM_ZOOM;
        offy *= SF.SYSTEM_ZOOM;					

				var offx2 = offx - x;
				var offy2 = offy - y;
        var d2 = offx2 * offx2 + offy2 * offy2;
        return d2 < this.data.radius * this.data.radius;					
			},
			checkClick:function (shipx, shipy, clickx, clicky, pre_time_check) {
				if (this.OverPlanet(shipx, shipy, clickx, clicky)) {
					/*
					if (!pre_time_check(this.data)) {
						return true;
					}
					//this.data.activateTier();
					this.tier.TravelToPlanet();
					*/
					return true;
				}
				return false;
			},
			updateName: function(shipx, shipy, x, y) {
				if (this.OverPlanet(shipx, shipy, x, y)) {
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
				var scale_ratio = 2;
				var scale = this.scaleSize * scale_ratio;
				var rings_scale = 0.08 * scale_ratio;
				if (this.data.ggiant) {
					this.data.DrawRingsBack(this.tier.context, absolutex, absolutey, rings_scale);
				}
        if (this.quest) {
            this.quest.update(-absolutex, -absolutey, true);
        }
        this.planetTerrain.renderSmall(this.tier.context, absolutex, absolutey, scale_ratio);
        if (this.data.hasclouds && !this.data.ggiant) {
            this.cloudTerrain.renderSmall(this.tier.context, absolutex, absolutey, scale_ratio);
        }
				if (this.data.ggiant) {
					this.data.DrawRingsFore(this.tier.context, absolutex, absolutey, rings_scale);
				}
			},
      teardown: function() {
      }
    };
    SU.extend(SBar.IconPlanet, SBar.Icon);
})();

	
