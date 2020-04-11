/*
 * Hero Viewer Class. Especially for the HUD hero displays at top and bottom.
 */
(function() {
	var clockimg = null; // just a reusable canvas for drawing clocks
	var percent1 = null; // channel percent of TF.MAX_SHOW_TURNS
	var percent2 = null; // ready percent of TF.MAX_SHOW_TURNS
	var hex_pad = 2;
	var hex_padx2 = 4;
	var init_large = false;
	
	var activeImages = {};
	var selectedImages = {};
	var friendlyImages = {};
	var hostileImages = {};
	var invalidTargetImages = {};
	var fallenImages = {};

	JTact.HeroView = function(hero, renderer) {
		this._initHeroView(hero, renderer);
	};

	JTact.HeroView.prototype = {
		hero: null,
		renderer: null,
		size: null,
		width: null,
		baseImg: null,
		activeImg: null,
		selectImg: null,
		aggroImg: null,
		tophovers: null,
		bothovers: null,
		topdetail: null,
		botdetail: null,
		_initHeroView: function(hero, renderer) {
			this.hero = hero;
			this.renderer = renderer;
			if (!init_large) {
				// Generate large icon images.
				this.size = 100;
				this.width = this.size / 2;
				this.setup();
				init_large = true;
			}
			this.size = TF.HEX_SIZE * this.hero.size;
			this.width = this.size / 2;
			this.setup();
		},
		setup: function() {
			this.baseImg = TG.icons[this.hero.name];
			
			if (!activeImages[this.size]) {
				let activeImg = document.createElement('canvas');
				activeImg.width = this.size + hex_padx2;
				activeImg.height = this.size + hex_padx2;
				var ctx = activeImg.getContext('2d');
				ctx.save();
				ctx.translate(this.width + hex_pad, this.width + hex_pad);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, this.width-3, undefined, "rgba(255,0,255,1)", 6);
				TU.regularPolygon(ctx, 0, 0, 6, this.width-3, undefined, "rgba(255,255,255,1)", 2);
				// Shape indicator of the active hero.
				TU.circle(ctx, this.width/3, -this.width*3/4, this.width/3, "rgba(255,0,255,1)", "#000", 1);
				//SU.text(ctx, '*', 0, 0, "bold ""pt sans-serif", "rgba(255,255,255,1)", 'center', "#000", 2);
				
				//SU.circle(ctx, 0, 0, this.width-2, undefined, "rgba(255,0,255,0.5)", 6);
				ctx.restore();
				activeImages[this.size] = activeImg;
			}

			if (!selectedImages[this.size]) {
				let selectImg = document.createElement('canvas');
				selectImg.width = this.size;
				selectImg.height = this.size;
				ctx = selectImg.getContext('2d');
				ctx.save();
				ctx.translate(this.width, this.width);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, this.width, "rgba(0,0,0,0.5)");
				ctx.restore();
				selectedImages[this.size] = selectImg;
			}
			
			if (!friendlyImages[this.size]) {
				let friendlyImg = document.createElement('canvas');
				friendlyImg.width = this.size + hex_padx2;
				friendlyImg.height = this.size + hex_padx2;
				let ctx = friendlyImg.getContext('2d');
				ctx.save();
				ctx.translate(this.width + hex_pad, this.width + hex_pad);
				ctx.rotate(PIx2 / 12);
				//TU.regularPolygon(ctx, 0, 0, 6, this.width*2/3, undefined, "rgba(255,255,255,0.5)", this.width/3);
			  var colorStops = [0.5, 'rgba(255,255,255,0.0)', 1, 'rgba(255,255,255,1)'];
//				SU.circleRad(ctx, 0, 0, this.width*0.9, colorStops);
//				SU.circle(ctx, 0, 0, this.width*0.9, undefined, "rgba(0,0,0,0.5)", 2);
TU.regularPolygon(ctx, 0, 0, 6, this.width*3/4, undefined, "rgba(255,255,255,0.4)", this.width*1/6);
TU.regularPolygon(ctx, 0, 0, 6, this.width*3/4+this.width*1/6, undefined, "rgba(255,255,255,0.8)", this.width*1/6);
				ctx.restore();
				friendlyImages[this.size] = friendlyImg;
			}
			
			if (!hostileImages[this.size]) {
				let img = document.createElement('canvas');
				img.width = this.size + hex_padx2;
				img.height = this.size + hex_padx2;
				let ctx = img.getContext('2d');
				ctx.save();
				ctx.translate(this.width + hex_pad, this.width + hex_pad);
				ctx.rotate(PIx2 / 12);
			  //var colorStops = [0, 'rgba(0,0,0,0.75)', 1, 'rgba(0,0,0,0)'];
				//SU.circleRad(ctx, 0, 0, this.width, colorStops);
				TU.regularPolygon(ctx, 0, 0, 6, this.width*3/4, undefined, "rgba(0,0,0,0.4)", this.width*1/6);
				TU.regularPolygon(ctx, 0, 0, 6, this.width*3/4+this.width*1/6, undefined, "rgba(0,0,0,0.8)", this.width*1/6);
				ctx.restore();
				hostileImages[this.size] = img;
			}			
			
			if (!invalidTargetImages[this.size]) {
				let invalidTargetImage = document.createElement('canvas');
				invalidTargetImage.width = this.size + hex_padx2;
				invalidTargetImage.height = this.size + hex_padx2;
				ctx = invalidTargetImage.getContext('2d');
				ctx.save();
				ctx.translate(this.width + hex_pad, this.width + hex_pad);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, this.width, "rgba(255,0,0,0.5)");
				ctx.restore();
				invalidTargetImages[this.size] = invalidTargetImage;
			}
			
			if (!fallenImages[this.size]) {
				fallenImages[this.size] = {};
				for (let i = 1; i <= 3; i++) {
					let image = document.createElement('canvas');
					image.width = this.size + hex_padx2;
					image.height = this.size + hex_padx2;
					ctx = image.getContext('2d');
					ctx.save();
					ctx.translate(this.width + hex_pad, this.width + hex_pad);
					ctx.rotate(PIx2 / 12);
					TU.regularPolygon(ctx, 0, 0, 6, this.width, "rgba(128,0,0,0.5)");
					ctx.restore();
					fallenImages[this.size][i]= image;
					
	        //grd = ctx.createRadialGradient(this.size/2, this.size/2, 0, this.size/2, this.size/2, this.size/2);
		      grd = ctx.createLinearGradient(0, 0, this.size, this.size);					
					var colorStops = [0, 'rgba(255,255,255,1)', 1, 'rgba(255,0,0,1)'];
	        for (var n = 0; n < colorStops.length; n += 2) {
	          grd.addColorStop(colorStops[n], colorStops[n + 1]);
	        }
					
					SU.text(ctx, '-'+i, image.width/2, this.size*3/4, "bold "+(this.size/2)+"pt "+SF.FONT, grd, 'center', "#000", 2);
				}
			}
			
		},
		drawIcon: function(is_active) {
			var ctx = TC.layer1;
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			var width = TF.HEX_SIZE * this.hero.size / 2;

			// Hero image.
			ctx.drawImage(this.baseImg, xy[0] - this.width, xy[1] - this.width, width * 2, width * 2);			
			
			// ICON_OVERLAYS duplicate code (check other location).
			// Friendly/hostile indicator.
			if (this.hero.friendly) {
				let img = friendlyImages[this.size];
				ctx.drawImage(img, xy[0] - img.width/2, xy[1] - img.height/2);
			} else {
				let img = hostileImages[this.size];
				ctx.drawImage(img, xy[0] - img.width/2, xy[1] - img.height/2);
			}
			if (is_active) {  // Put it below the hero's image.
				this.drawActive();
			}
			if (TG.icons2[this.hero.name]) {
				let img = TG.icons2[this.hero.name]
				ctx.drawImage(img, xy[0] - this.size/2, xy[1] - this.size/2, this.size, this.size);
			}
			
			// now draw health
			var percent = this.hero.health / this.hero.max_health;
			if (percent < 0) {
				percent = 0;
			}
			TU.rect(ctx, xy[0] - this.width, xy[1] - this.width * 0.8, width * 2 * percent, width / 5, "rgba(0,155,0,0.75)"); // green
			TU.rect(ctx, xy[0] - this.width + width * 2 * percent, xy[1] - this.width * 0.8, width * 2 * (1 - percent), width / 5, "rgba(0,0,0,0.75)"); // black after
			TU.rect(ctx, xy[0] - this.width, xy[1] - this.width * 0.8, width * 2, width / 5, undefined, "rgba(0,0,0,1)", 1); // border
						
			// Turns
			//this.setTurnDisplayPercents();
			/*
			if (percent1 > 0) {
				TU.rect(ctx, xy[0] - this.width, xy[1] - this.width * 0.6, width * 2 * percent1, width / 10, "rgba(0,0,255,1)"); // blue
			}
			if (percent2 > 0) {
				TU.rect(ctx, xy[0] - this.width + width * 2 * percent1, xy[1] - this.width * 0.6, width * 2 * percent2, width / 10, "rgba(255,255,255,1)"); // white after
			}
			if (percent1 + percent2 > 0) {
				TU.rect(ctx, xy[0] - this.width, xy[1] - this.width * 0.6, width * 2 * (percent1 + percent2), width / 10, undefined, "rgba(0,0,0,0.5)", 1); // border
			}
			*/
			
		},
		drawHealthChange: function() {
			let ctx = TC.layer1;
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			if (this.hero.health <= 0 && this.hero.death_ticks > 0 && this.hero.death_ticks <= 3) {
				let img = fallenImages[this.size][this.hero.death_ticks];
				ctx.drawImage(img, xy[0] - img.width/2, xy[1] - img.height/2);
			} else if (this.hero.last_drawn_health !== null) {
				let health_change = this.hero.health - this.hero.last_drawn_health;
			  if (health_change != 0) {
//					let circle_color = health_change > 0 ? "#8F8" : "#F88";
					let circle_color = health_change > 0 ? 'rgba(128,255,128,0.5)' : 'rgba(255,128,128,0.5)';
					TU.circle(ctx, xy[0], xy[1] - this.hero.size*3-10, 20, circle_color, 1, "#000");
					if (health_change > 0) {
						health_change = "+"+health_change;
					}
					SU.text(ctx, health_change, xy[0], xy[1] - this.hero.size*3, SF.FONT_XL, "#000", "center");
			  }
			}			
		},
		drawInvalidTarget: function() {
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			TC.targLayer.drawImage(invalidTargetImages[this.size], xy[0] - this.width, xy[1] - this.width);
		},
		// Draws a little indicator of the current threat target.
		drawThreatIcon: function(threat_changed) {
			if (this.hero.friendly || this.hero.death_ticks > 3 || TG.data.heroes[this.hero.name].dead) {
				return 0;
			}			
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			if (this.hero.threatTarget) {
				if (threat_changed) {
					TU.regularPolygon(TC.layer1, xy[0] - this.width*3/4, xy[1] - this.width*2/5, 8, this.width/2, "rgba(255,255,255,0.75)");					
				}
				if (TG.data.heroes[this.hero.threatTarget]) {
					TC.layer1.drawImage(TG.data.heroes[this.hero.threatTarget].icon, xy[0] - this.width, xy[1] - this.width*2/3, this.width/2, this.width/2);
				}
			}
		},
		// check if hero covers this hex x,y
		isMouseOver: function(x, y) {
			if (this.hero.dead) {
				return false;
			}
			var dist = TG.data.map.getHexDist(x, y, this.hero.x, this.hero.y);
			return (dist <= (this.hero.size - 1) / 2);
		},
		drawActive: function() {
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			TC.layer1.drawImage(activeImages[this.size], xy[0] - this.width - hex_pad, xy[1] - this.width - hex_pad);

			// draw aggro markers
			for (var name in TG.data.heroes) {
				var hero = TG.data.heroes[name];
				if (!hero.friendly && !hero.dead) {
					if (hero.threatTarget === this.hero.name) {
						this.renderer.heroViews[name].drawAggroing();
					}
				}
			}
		},
		drawSelected: function() {
			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
			TC.targLayer.drawImage(selectedImages[this.size], xy[0] - this.width, xy[1] - this.width);
		},
		clearSelected: function() {
			this.renderer.drawTargetImage();
		},
		drawAggroing: function() {
//			var xy = TG.data.map.getFullXY(this.hero.x, this.hero.y);
//			TC.layer1.drawImage(this.aggroImg, xy[0] - this.width - hex_pad, xy[1] - this.width - hex_pad);
		},
		clearTopSummary: function() {
			var ctx = TC.hudLayer;

			var w = 400;
			var h = 160;
			var topbuf = TF.TOP_SUMMARY_BUF;
			var trapw = 50;
			var trapw2 = trapw * 2;
			var x = (TF.WIDTH - w - trapw2) / 2;
			var y = topbuf;
			ctx.clearRect(x - 2, y - 2, w + trapw2 + 4, h + 4);
			if (this.tophovers !== null) {
				TH.removeList(this.tophovers);
			}
			this.tophovers = [];
		},
		clearBotSummary: function() {
			var w = 400;
			var trapw = 50;
			var trapw2 = trapw * 2;
			var x = (TF.WIDTH - w - trapw2) / 2;
			TC.hudLayer.clearRect(x - 2, TF.HEIGHT - 162, 504, 200);
			if (this.bothovers !== null) {
				TH.removeList(this.bothovers);
			}
			this.bothovers = [];
		},
		// Shows a hero in the hud trapezoid, either at top or at bottom
		displaySummary: function(top) {
			var hovers = null;
			if (top) {
				if (this.tophovers !== null) {
					TH.removeList(this.tophovers);
				}
				this.tophovers = [];
				hovers = this.tophovers;
			} else {
				if (this.bothovers !== null) {
					TH.removeList(this.bothovers);
				}
				this.bothovers = [];
				hovers = this.bothovers;
			}

			var ctx = TC.hudLayer;
			var w = 400;
			var h = 100;
			var topbuf = TF.TOP_SUMMARY_BUF;
			var trapw = 50;
			var trapw2 = trapw * 2;
			var x = SF.HALF_WIDTH - w/2 - trapw;
			var y = (top ? topbuf : TF.HEIGHT - h);

			var hover = TH.add(x + trapw, y, w, h);
			hovers.push(hover);

			if (top) {
				this.drawTrap(x, y, x + w + trapw2, y, x + w + trapw, y + h, x + trapw, y + h, this.hero.friendly);
			} else {
				this.drawTrap(x + trapw, y, x + w + trapw, y, x + w + trapw2, y + h, x, y + h, this.hero.friendly);
			}
			ctx.drawImage(this.baseImg, x + trapw - 10, y, 100, 100);
			
			// ICON_OVERLAYS duplicate code (check other location).
			if (this.hero.friendly) {
				let img = friendlyImages[100];
				ctx.drawImage(img, x + trapw - 10, y, 100, 100);
			} else {
				let img = hostileImages[100];
				ctx.drawImage(img, x + trapw - 10, y, 100, 100);
			}
			if (TG.icons2[this.hero.name]) {
				ctx.drawImage(TG.icons2[this.hero.name], x + trapw - 10, y, 100, 100);
			}
			if (this.hero.health <= 0 && this.hero.death_ticks > 0 && this.hero.death_ticks <= 3) {
				let img = fallenImages[100][this.hero.death_ticks];
				ctx.drawImage(img, x + trapw - 10, y, 100, 100);
			}
			
			//var text_color = this.hero.friendly ? "#000" : "#FFF";
			var text_color = this.hero.friendly ? "#000" : "#FFF";
			if (this.hero.name.length > 12) {
				TU.text(ctx, this.hero.name, x + trapw + 240, y + 33, SF.FONT_XL, text_color, "center");
			} else {
				TU.text(ctx, this.hero.name, x + trapw + 240, y + 33, "26pt "+SF.FONT, text_color, "center");
			}
			TU.text(ctx, SF.SYMBOL_LEVEL+this.hero.level, x + trapw + 75, y + 23, SF.FONT_L, text_color, "left");
			if (TG.data.activeHero.name !== this.hero.name) {
				TU.text(ctx, SF.SYMBOL_TIME+(TG.data.turnEngine.GetQueuePosition(this.hero.name)+1), x + trapw + 72, y + 91, SF.FONT_M, text_color, "left");
			}

			// Aggro details.
			var aggroy = top ? y + 5 : y + 65;
			if (this.hero.friendly) {
				// Show aggro count for this hero.
				var icon = TG.icons["target"];
				ctx.drawImage(icon, x + 20, aggroy, 30, 30);
				TU.text(ctx, this.getThreatCount() + "", x + 35, aggroy + 21, SF.FONT_L, "#FFF", "center");
				hover = TH.add(x + 20, aggroy, 30, 30, this.getThreatText());
				hovers.push(hover);
			} else {
				// Show aggro target.
				var targetName = this.hero.threatTarget;
				if (targetName !== null) {
					var icon = TG.icons[targetName];
					ctx.drawImage(icon, x + 20, aggroy, 30, 30);
					hover = TH.add(x + 20, aggroy, 30, 30, this.getThreatText());
					hovers.push(hover);
				}
			}

			// Bars common
			var hwidth = w * 0.6;
			var hheight = 10;
			var hx = x + w * 0.4;
			var hy = y + h * 0.43;

			// Turns
			//this.setTurnDisplayPercents();
			/*
			if (percent1 > 0) {
				TU.rect(ctx, hx, hy + hheight, hwidth * percent1, 5, "rgba(0,0,255,1)"); // blue
			}
			if (percent2 > 0) {
				TU.rect(ctx, hx + hwidth * percent1, hy + hheight, hwidth * percent2, 5, "rgba(255,255,255,1)"); // white after
			}
			if (percent1 + percent2 > 0) {
				TU.rect(ctx, hx, hy + hheight, hwidth * (percent1 + percent2), 5, undefined, "rgba(0,0,0,0.5)", 1); // border
			}
			*/

			// Health on top
			let me = this;
			var percent = this.hero.health / this.hero.max_health;
			if (percent < 0) {
				percent = 0;
			}
			TU.rect(ctx, hx, hy, hwidth * percent, hheight, "rgb(0,155,0)"); // green
			TU.rect(ctx, hx + hwidth * percent, hy, hwidth * (1 - percent), hheight, "rgb(0,0,0)"); // black after
			TU.rect(ctx, hx, hy, hwidth, hheight, undefined, "rgb(0,0,0)", 1); // border
			TU.text(ctx, this.hero.health + "/" + this.hero.max_health, hx + hwidth / 2, hy + 10, SF.FONT_MB, "#FFF", "center");

			var iy = Math.round(y + h * 0.62); // icon y
			var size = 30;
			var ix = Math.round(x + w * 0.24);
			for (var i = 0; i < this.hero.abilities.length; i++) {
				var ability = this.hero.abilities[i];
				var icon = TG.icons[ability.displayName];
				let x = ix + i * (size + 10) + 60;
				if (/*this.hero.friendly &&*/ ability.target === null) {
					// Draw an indicator if this ability will be cast without another click.
					TU.rect(ctx, x, iy, size, size, "#FF0", "#000", 1);
				} else if (ability.target.global) {
					TU.rect(ctx, x, iy, size, size, "#F0F", "#000", 1);
				}
				ctx.drawImage(icon, x, iy, size, size);
				this.addClock(ability.cooldown - TG.data.turn, ability.cooldownTime, x, iy, size, ctx, true);
				this.addCost(ability.energy, this.hero.energy, x, iy, size, ctx);
				var text = this.getAbilityText(i, ability);
				let click_index = top ? undefined : i;
				hover = TH.add(x, iy, size, size, text, click_index, ability.displayName);
				hovers.push(hover);
			}
			iy = Math.round(y+h*0.33);
			ix = Math.round(x+w+5);
			icon = TG.icons["Move"];
			ctx.drawImage(icon, ix, iy, size, size);
			let click_index = top ? undefined : -2;
			var hover = TH.add(ix, iy, size, size, "Hotkey: S\nMove at speed " + this.hero.maxMove(), click_index, "Move");
			hovers.push(hover);
			TU.text(ctx, this.hero.maxMove(), ix - 15 + size, iy + 22, SF.FONT_LB, "#FFF", "center");
			var icon = TG.icons["Defend"];
			ctx.drawImage(icon, ix-5 + size, iy, size, size);
			click_index = top ? undefined : -1;
			var hover = TH.add(ix-5 + size, iy, size, size, "Hotkey: D\nReduce damage by 30% while defending", click_index, "Defend");
			hovers.push(hover);

			var buffy = (top ? y + h : y - 60);
			var debuffy = buffy + 30;
			var mx = x + trapw;
			TU.rect(ctx, mx, buffy + 10, w, 10, "rgba(0,155,0,0.25)");
			TU.rect(ctx, mx, debuffy + 10, w, 10, "rgba(155,0,0,0.25)");
			var mods = this.hero.mods;
			var count = 0;
			for (var i = 0; i < mods.length; i++) {
				var mod = mods[i];
				if (mod.buff) {
					this.drawMod(mod, mx + 10 + count * 30, buffy, 30, hovers);
					count++;
				}
			}
			count = 0;
			for (var i = 0; i < mods.length; i++) {
				var mod = mods[i];
				if (!mod.buff) {
					this.drawMod(mod, mx + 10 + count * 30, debuffy, 30, hovers);
					count++;
				}
			}
		},
		// draw an indicator of how much cooldown is left
		addClock: function(cdleft, cdfull, x, y, sizeDraw, ctxDraw, andRemain) {
			var size = 100;
			if (cdleft <= 0 || cdfull <= 0) {
				return; // nothing to draw
			}
			if (clockimg === null) {
				clockimg = document.createElement('canvas');
				clockimg.width = size;
				clockimg.height = size;
			}
			var ctx = clockimg.getContext('2d');
			ctx.clearRect(0, 0, size, size);

			// want to have a pie slice of the remaining amount
			ctx.beginPath();
			var rad = (1 - (cdleft / cdfull)) * PIx2;
			ctx.moveTo(size / 2, size / 2);
			ctx.arc(size / 2, size / 2, size, rad - PIx2 / 4, PIx2 - PIx2 / 4);
			ctx.lineTo(size / 2, size / 2);
			ctx.fillStyle = "rgba(0,0,0,0.75)";
			ctx.fill();
			ctx.closePath();

			ctxDraw.drawImage(clockimg, x, y, sizeDraw, sizeDraw);
			if (andRemain) {
				this.addRemain(cdleft, x, y, sizeDraw, ctxDraw);
			}
		},
		addCost: function(cost, available, x, y, size, ctx) {
			if (cost > 0 && available < cost) {
				if (TG.icons["cost"] === undefined) {
					var temp = TU.textIcon("$");
					var icon = TU.blankIcon();
					var iconCtx = icon.getContext('2d');
					TU.rect(iconCtx, 0, 0, icon.height, icon.width, 'rgba(255,255,255,0.5)');
					iconCtx.drawImage(temp, 0, 0); // put the $ on top
					TG.icons["cost"] = icon;
				}
				var icon = TG.icons["cost"];
				ctx.drawImage(icon, x, y, size, size);
			}
		},
		// Draw the remaining time on an ability or buff icon
		addRemain: function(remain, x, y, size, ctx) {
			TU.rect(ctx, x, y, size, size, "rgba(0,0,0,0.25)");
			if (remain < 10) {
				remain = round10th(remain);
			} else {
				remain = Math.round(remain);
			}
			TU.text(ctx, remain, x + size / 2, y + size / 2 + 7, SF.FONT_L, "#FFF", "center");
		},
		drawMod: function(mod, x, y, size, hovers) {
			var text = (mod.buff ? "Buff" : "Debuff");
			text += ": " + mod.displayName + "\n";
			text += mod.getText() + "\n";
			if (mod.duration === TF.FOREVER) {
				text += "  never expires";
			} else if (mod.turns_left >= 0) {
				text += "  expires in " + round100th(mod.turns_left) + " turns";
			}
			var icon = TG.icons[mod.displayName];
			TC.hudLayer.drawImage(icon, x, y, size, size);
			if (mod.duration !== TF.FOREVER && mod.turns_left >= 0) {
				this.addRemain(mod.turns_left, x, y, size, TC.hudLayer);
			}
			var hover = TH.add(x, y, size, size, text);
			hovers.push(hover);
		},
		drawTrap: function(x1, y1, x2, y2, x3, y3, x4, y4, friendly) {
			var ctx = TC.hudLayer;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.lineTo(x3, y3);
			ctx.lineTo(x4, y4);
			ctx.lineTo(x1, y1);
			ctx.closePath();
			if (friendly) {
				ctx.fillStyle = "rgba(255,255,255,0.5)";
			} else {
				ctx.fillStyle = "rgba(0,0,0,0.5)";
			}
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000";
			ctx.stroke();
		},
		getAbilityText: function(index, ability) {
			var text = "";
			if (this.hero.friendly) {
				text += TF.abilityKeyMap[index] + ": ";
			}
			text += ability.displayName + "\n";
			text += ability.Print(this.hero.friendly);
			return text;
		},
		// Returns the number of mobs targeting the hero.
		getThreatCount: function() {
			if (!this.hero.friendly) {
				return 0;
			}
			var count = 0;
			for (var name in TG.data.heroes) {
				var hero = TG.data.heroes[name];
				if (!hero.friendly && !hero.dead) {
					if (hero.threatTarget === this.hero.name) {
						count++;
					}
				}
			}
			return count;
		},
		// Threat tooltip text.
		getThreatText: function() {
			var text = "";
			if (this.hero.friendly) {
				// show aggro against this friendly hero
				text += "Aggro Generated\n";
				for (var name in TG.data.heroes) {
					var hero = TG.data.heroes[name];
					if (!hero.friendly && !hero.dead) {
						var threat_switch = hero.threatMax * TF.THREAT_RETARGET_AMOUNT;
						var val = hero.threatList[this.hero.name];
						if (val === undefined) {
							val = 0;
						}
						text += "  " + name + ": " + round100th(val - threat_switch) + " (" + round100th(val) + " / " + round100th(threat_switch) + ")";
						if (hero.threatTarget === this.hero.name) {
							text += " [targeted]";
						}
						text += "\n";
					}
				}
			} else {
				text += "Aggro\n";
				var list = this.hero.threatList;
				for (var source in list) {
					var val = list[source];
					if (TG.data.heroes[source] && !TG.data.heroes[source].dead) {
						text += source + ": " + val + " / " + this.hero.threatMax;
						if (this.hero.threatTarget === source) {
							text += " [target]";
						}
						text += "\n";
					}
				}
			}
			return text;
		},

	};
})();
