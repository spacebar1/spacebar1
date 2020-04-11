/*
 * Draws the image and details for a crew or ship into a details box.
 * Tailored for the 7charR.js display.
 */

(function() {
    SBar.IconCharDetails = function(ship_or_hero, context, y) {
        this._initIconCharDetails(ship_or_hero, context, y);
    };

    SBar.IconCharDetails.prototype = {
      type: SF.TYPE_CHAR_DETAILS_ICON,
			picture: null,
			context: null,
			_initIconCharDetails: function(ship_or_hero, context, y) {
				this.picture = ship_or_hero.GetCachedImage();
				this.context = context;
				if (ship_or_hero.type === SF.TYPE_SHIP) {
					this.DrawShip(ship_or_hero, y);
				} else if (ship_or_hero.is_player) {
					this.DrawPlayerCrew(ship_or_hero, y);
				} else {
					this.DrawCrew(ship_or_hero, y);
				}
      },

			DrawPlayerCrew(crew, y) {
				let height = 150;
				let x = 180;

				//this.context.globalAlpha = 0.5;
				this.context.drawImage(this.picture, 0, 0, SF.WIDTH, SF.HEIGHT, x-200, y, height*SF.WIDTH/SF.HEIGHT*1.3, height*1.3);
				//this.context.globalAlpha = 1;
				
				y += 7;
	      SU.text(this.context, crew.name, x, y+25, SF.FONT_LB, '#FFF');
				x += 22;
				y += 50;
				let health_color = crew.health/crew.max_health < 0.25 ? "#F00" : crew.health/crew.max_health < 0.5 ? "#FF0" : "#FFF";
	      SU.text(this.context, crew.health+"/"+crew.max_health+" "+SF.SYMBOL_HEALTH, x, y, SF.FONT_M, health_color);
				
				y += 23;
	      SU.text(this.context, SF.SYMBOL_CREDITS+" "+S$.credits, x, y, SF.FONT_M, '#FFF');
				
				y += 23;
				let text_xp = "";
				let xp_color = "#FFF";
				if (crew.base_level < SF.MAX_LEVEL) {
					text_xp = " ("+crew.xp+"/"+(SF.LEVEL_XP[crew.base_level+1])+")"
					if (crew.base_level < SF.MAX_LEVEL && SF.LEVEL_XP[crew.base_level+1] <= crew.xp) {
						text_xp += " "+SF.SYMBOL_SHIFT;
						xp_color = "#FF0";
					}
				}
	      SU.text(this.context, SF.SYMBOL_LEVEL+crew.base_level+text_xp, x, y, SF.FONT_M, xp_color);
				
				
				for (let obj in S$.xp) {
					y += 23;
					let display_type = S$.XpTypeName(obj);
					let xp = S$.xp[obj];
					let level = S$.xp_level[obj];
					let text = display_type+" "+ST.level_names[obj][level];
					// Leave off the level here so the title is more meaningful
					text += " ("/*+SF.SYMBOL_LEVEL+level+" "*/+xp;
					if (level < SF.MAX_LEVEL) {
						text += "/"+(SF.LEVEL_XP[level+1]);
					}
					//text += "xp)";
					text += ")";
		      SU.text(this.context, text, x, y, SF.FONT_M, "#FFF");
				}				
			},
			
			
			DrawCrew: function(crew, y) {
				let height = 100;
				let x = 0;

				SU.rectCorner(this.context, 12, x+50, y, SF.HALF_WIDTH-100, height, 'rgba(255,255,255,0.2)', "#000", 1);

				// Create a clipping with rounded corners, to put the picture on a rounded canvas.
	      let clip_image = document.createElement('canvas');
	      clip_image.width = SF.HALF_WIDTH-100;
	      clip_image.height = height;
				let clip_context = clip_image.getContext('2d');				
				SU.rectCorner(clip_context, 12, 0, 0, SF.HALF_WIDTH-96, height-4, "#FFF");  // Color doesn't matter.
				
				clip_context.save();
				clip_context.globalCompositeOperation = 'source-in';
				clip_context.drawImage(this.picture, SF.WIDTH/4, SF.HEIGHT/8, SF.WIDTH*3/4, SF.HALF_HEIGHT, 0, 0, height*SF.WIDTH/SF.HEIGHT*1.5, height);
				clip_context.restore();
				this.context.drawImage(clip_image, x+52, y+2);
				
				// Picture is drawn. Now continue.
				x += 200;
	      SU.text(this.context, crew.name, x, y+25, SF.FONT_MB, '#FFF');
				let health_color = crew.health/crew.max_health < 0.25 ? "#F00" : crew.health/crew.max_health < 0.5 ? "#FF0" : "#FFF";
				x += 20;
	      SU.text(this.context, crew.health+"/"+crew.max_health+" "+SF.SYMBOL_HEALTH, x, y+48, SF.FONT_S, '#FFF');
				let morale_color = crew.LowMorale() ? "#F00" : crew.ContentMorale() ? "#FF0" : "#FFF";
	      SU.text(this.context, crew.morale+"/"+crew.max_morale+" "+SE.MoraleSymbol(crew.morale), x, y+68, SF.FONT_S, morale_color);
				let text_xp = "";
				let xp_color = "#FFF";
				if (crew.base_level < SF.MAX_LEVEL) {
					text_xp = " ("+crew.xp+"/"+(SF.LEVEL_XP[crew.base_level+1])+")"
					if (crew.base_level < SF.MAX_LEVEL && SF.LEVEL_XP[crew.base_level+1] <= crew.xp) {
						text_xp += " "+SF.SYMBOL_SHIFT;
						xp_color = "#FF0";
					}
				}
	      SU.text(this.context, SF.SYMBOL_LEVEL+crew.base_level+text_xp, x, y+88, SF.FONT_S, xp_color);
			},
			
			DrawShip: function(ship, y) {
				let x = SF.HALF_WIDTH+50;
				let height = 100;
				SU.rectCorner(this.context, 12, x, y, SF.HALF_WIDTH-100, height, 'rgba(155,155,255,0.2)', "#000", 1);

				// DUPLICATE CODE -- CLEAN UP
				// Create a clipping with rounded corners, to put the picture on a rounded canvas.
	      let clip_image = document.createElement('canvas');
	      clip_image.width = SF.HALF_WIDTH-100;
	      clip_image.height = height;
				let clip_context = clip_image.getContext('2d');				
				SU.rectCorner(clip_context, 12, 0, 0, SF.HALF_WIDTH-96, height-4, "#FFF");  // Color doesn't matter.
				
				clip_context.save();
				clip_context.globalCompositeOperation = 'source-in';
				clip_context.drawImage(this.picture, 0, SF.HEIGHT/4, SF.WIDTH, SF.HALF_HEIGHT, -50, 0, height*SF.WIDTH/SF.HEIGHT*2, height);
				clip_context.restore();
				this.context.drawImage(clip_image, x+2, y+2);
				// END DUPLICATE
				
				x += 100;
	      SU.text(this.context, ship.name, x, y+25, SF.FONT_MB, '#FFF');
				x += 20;
	      SU.text(this.context, "Speed: "+ship.speed, x, y+48, SF.FONT_S, '#FFF');
	      SU.text(this.context, "Sensor Level: "+ship.sensor_level, x, y+68, SF.FONT_S, '#FFF');
	      SU.text(this.context, "Cargo space: "+ship.max_cargo+SF.SYMBOL_CARGO, x, y+88, SF.FONT_S, '#FFF');
			},
			
			
      update: function(shipx, shipy, clickx, clicky) {

      },
    };
    SU.extend(SBar.IconCharDetails, SBar.Icon);
})();

	
