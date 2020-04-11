(function() {

  var MAX_LOGS = 200;
  var TARGET_MSG_Y = 200; // for the little targeting popup
	var footImages = [];
		
	SBar.TactRenderer = function(tier) {
		this._initTactRenderer(tier);
	};

	SBar.TactRenderer.prototype = {
		tier: null,
		data: null,
		battle_display_name: null,

		lastSelected: null,
		hovering: null,
		messageLogs: null, // Keeping in case needed.
		heroViews: null,
		arrows: null, // queued arrows to draw
		threats: null, // Queued threat icons to draw.
		selected: null,
		render_active_hero: null,
		stickingSelect: false,
		unstickButton: null,
		compassLog: null,
		show_grid: false,

		_initTactRenderer: function(tier) {
			this.tier = tier;
			this.data = tier.data;
			if (this.data.battle_name.split(" at ").length > 0) {
				this.battle_display_name = this.data.battle_name.split(" at ")[0];
			} else {
				this.battle_display_name = this.data.battle_name;
			}

			this.messageLogs = [];
			this.arrows = [];
			this.threats = [];
			SU.clearText();
			SU.addText('#: Display Character');
			SU.addText(SF.SYMBOL_SHIFT+'#: Display Enemy');
			SU.addText('G: Toggle Grid');
			SU.addText('B: Battle Log');
			SU.addText('A: Auto Combat');
			if (S$.conduct_data['can_restart_battle']) {
				SU.addText('N: Restart Battle');
			}
		},
		render: function() {
			if (this.calledonce) {
				this.redraw();  // Called from screen resize.
				return;
			}
			this.calledonce = true;
			this.cleanup();
			this.mapInit();
		},
		cleanup: function() {
			SB.clear();
			TC.layer1.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
		},
		renderUpdate: function() {

		},
		teardown: function() {
			
		},
		
		AddHeroView: function(hero) {
			this.heroViews[hero.name] = new JTact.HeroView(hero, this);
		},

		RemoveHeroView: function(hero) {
			if (this.heroViews[hero.name]) {
				delete this.heroViews[hero.name];
			}
		},

		// called once, after map is set up
		mapInit: function() {
			// Hero renderers
			TC.layer1.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);			
			this.heroViews = {};
			for (var obj in TG.data.heroes) {
				this.AddHeroView(TG.data.heroes[obj]);
			}

			// Draw some template graphics
			TG.icons["target"] = TU.blankIcon();
			var ctx = TG.icons["target"].getContext('2d'); // arrow
			TU.line(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#000", 12);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#000", 8);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#000", 8);

			TG.icons["time"] = TU.blankIcon();
			ctx = TG.icons["time"].getContext('2d'); // clock
			TU.circle(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE / 3, "#AAA", "#000", 4);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE / 5, "#000", 4);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.7, TF.ICON_SIZE / 2, "#000", 7);

			TG.icons["end"] = TU.textIcon("X");

			TG.icons["damage"] = TU.textIcon("*");

			//TG.icons["channels"] = TU.textIcon("_");

			TG.icons["ground"] = TU.blankIcon();
			ctx = TG.icons["ground"].getContext('2d');
			TU.regularPolygon(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, 6, TF.ICON_SIZE / 3, "rgba(255,255,255,0.24)", "rgba(150,150,150,0.24)", 1);

			TG.icons["react"] = TU.blankIcon();  // Same as the target icon, but white.
			ctx = TG.icons["react"].getContext('2d');
			TU.line(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#FFF", 12);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#FFF", 8);
			TU.line(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#FFF", 8);
			//TG.icons["react"] = TU.blankIcon(); // connects two dots
			//ctx = TG.icons["react"].getContext('2d');
			//TU.circle(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.1, "#000");
			//TU.circle(ctx, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.13, "#000");
			//TU.line(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE / 2, "#000", 4);

			TG.icons["damage"] = TU.blankIcon(); // red X
			ctx = TG.icons["damage"].getContext('2d');
			TU.line(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.8, TF.ICON_SIZE * 0.8, "#800", 12);
			TU.line(ctx, TF.ICON_SIZE * 0.8, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.8, "#800", 12);

			TG.icons["Defend"] = TU.blankIcon();
			ctx = TG.icons["Defend"].getContext('2d');
			TU.circle(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.3, "#AAA", "#000", 14);
			TU.circle(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.06, "#000", "#000", 14);
			TG.icons["Defending"] = TG.icons["Defend"];

			TG.icons["Move"] = TU.blankIcon("");
			var ctx = TG.icons["Move"].getContext('2d'); // boots
			TU.line(ctx, TF.ICON_SIZE * 0.4, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.4, TF.ICON_SIZE * 0.8, "#000", 16); // left boot
			TU.line(ctx, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.7, TF.ICON_SIZE * 0.4, TF.ICON_SIZE * 0.7, "#000", 20);
			TU.line(ctx, TF.ICON_SIZE * 0.6, TF.ICON_SIZE * 0.2, TF.ICON_SIZE * 0.6, TF.ICON_SIZE * 0.8, "#000", 16); // right boot
			TU.line(ctx, TF.ICON_SIZE * 0.8, TF.ICON_SIZE * 0.7, TF.ICON_SIZE * 0.6, TF.ICON_SIZE * 0.7, "#000", 20);
			TG.icons["Moving"] = TG.icons["Move"];

			// Persistent buttons
			var plus = SB.imgText("+", 14, 14);
			var minus = SB.imgText("-", 14, 14);
		},
		redrawMap: function() {
			TC.layer1.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			TC.hudLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			TG.data.mapEffects.drawIcons();
			// Do the grid and effects first for composite operations.
			TC.layer1.save();
			TC.layer1.globalCompositeOperation = 'destination-over';
			if (TG.data.map.background) {
				TC.layer1.drawImage(TG.data.map.background, 0, 0);
			} else {
				// Simple background.
				var colorStops = [0, 'rgba(60,150,150,1)', 1, 'rgba(110,110,110,1)'];
				TU.rectGrad(TC.layer1, 0, 0, TF.WIDTH, TF.HEIGHT, 0, 0, 500, TF.HEIGHT, colorStops);
			}
			TC.layer1.restore();
			if (this.show_grid) {
				TG.data.map.drawGrid();
			}

			if (this.render_active_hero !== null && this.heroViews[this.render_active_hero]) {
				this.heroViews[this.render_active_hero].clearBotSummary();
			}

			for (var obj in TG.data.heroes) {
				let hero = TG.data.heroes[obj];
				if (hero && !hero.dead) {
					this.heroViews[obj].drawIcon(/*is_active=*/TG.data.activeHero === hero);
				}
			}
			this.displayActive(TG.data.activeHero);
			for (var obj in this.arrows) {
				TC.layer1.globalAlpha = 0.5;
				this.drawArrow(this.arrows[obj]);
				TC.layer1.globalAlpha = 1;
			}
			for (var obj in this.heroViews) {
				if (this.heroViews[obj] && this.threats && this.threats[obj]) {
					this.heroViews[obj].drawThreatIcon(this.threats[obj]);
				}
				this.heroViews[obj].drawHealthChange();
			}

			//if (!this.drew_name) {
				// Battle name.
				TC.hudLayer.font = SF.FONT_LB;
				let text = this.battle_display_name+" "+SF.SYMBOL_TIME+TG.data.turn;
				let text_width = TC.hudLayer.measureText(text).width;
				TU.rect(TC.hudLayer, 0, 0, text_width+20, 30, "rgba(255, 255, 255, 0.5)");
				TU.text(TC.hudLayer, text, 10, 23, SF.FONT_LB, "#FFF");
				//this.drew_name = true;
				//}

			if (this.data.battle_lost) {
				TU.rect(TC.hudLayer, SF.HALF_WIDTH-200, 200, 400, 40, "rgba(128, 0, 0, 0.75)", "#000", 1);
				TU.text(TC.hudLayer, "Defeat! 'X' to exit.", SF.HALF_WIDTH, 230, SF.FONT_XLB, "#FFF", 'center');
			} else if (this.tier.view_only) {
				TU.rect(TC.hudLayer, SF.HALF_WIDTH-200, 200, 400, 40, "rgba(128, 128, 0, 0.75)", "#000", 1);
				TU.text(TC.hudLayer, "Viewing only. 'X' to exit.", SF.HALF_WIDTH, 230, SF.FONT_XLB, "#FFF", 'center');
			} else if (this.data.battle_won) {
				TU.rect(TC.hudLayer, SF.HALF_WIDTH-200, 200, 400, 40, "rgba(0, 0, 128, 0.75)", "#000", 1);
				TU.text(TC.hudLayer, "Victory! 'X' to exit.", SF.HALF_WIDTH, 230, SF.FONT_XLB, "#FFF", 'center');
			}
		},
		clearMapHistory: function() {
			this.arrows = [];
			this.threats = {};
			for (let obj in TG.data.heroes) {
				TG.data.heroes[obj].ResetDrawnHealth();
			}
		},
		// Game time advanced, full map refresh and show active hero
		readyMap: function() {
			this.redrawMap();
			this.tier.MouseMove(SG.mx, SG.my, /*force=*/true);
			/*
			if (!dont_clear) {
				for (let obj in TG.data.heroes) {
					TG.data.heroes[obj].ResetDrawnHealth();
				}
			}
			*/
		},
		// Combined message log function to record icons and description text
		// Leaving this for now, in case user wants to pull up the log?
		logMessage: function(altText, iconList) {
			var turn = round10th(TG.data.turn);
			var entry = {
				icons: iconList,
				text: altText,
				turn: turn,
				//ai: this.loggingAI
			};
			this.messageLogs.splice(0, 0, entry); // push at front
			if (this.messageLogs.length > MAX_LOGS) {
				this.messageLogs.splice(MAX_LOGS, 1); // drop last
			}
		},
		clearSelected: function() {
			if (this.selected !== null && this.heroViews[this.selected.name]) {
				this.heroViews[this.selected.name].clearTopSummary();
			} else {
				TG.data.mapEffects.clear();
			}
			this.lastSelected = null;
			this.selected = null;
			this.stickingSelect = false;
			if (this.unstickButton !== null) {
				SB.remove(this.unstickButton);
//				SB.clear();
				this.unstickButton = null;
			}
		},
		showHover: function(hero) {
			//if (!this.hovering || this.hovering.name !== hero.name) {
			this.heroViews[hero.name].drawSelected();
			//}
			//this.hovering = hero;
		},
		displayTargeted: function(hero) {
			if (!hero.isTargetable()) {
				return;
			}
			this.selected = hero;
			this.showHover(hero);
			this.heroViews[hero.name].displaySummary(true);
		},
		displaySelected: function(hero) {
			this.selected = hero;
			this.showHover(hero);
			this.heroViews[hero.name].displaySummary(true);
		},
		// Sticky select on a mouse click, so the select is not lost after moving
		stickySelect: function(hero) {
			var unselect_instead = hero.name == this.lastSelected;
			this.clearSelected();
			if (unselect_instead) {
				return;
			}
			this.lastSelected = hero.name;

			this.displaySelected(hero);
			this.stickingSelect = true;
			var unstick = SB.imgText("X", 15, 15);
			this.unstickButton = SB.add(700, TF.TOP_SUMMARY_BUF + 5, unstick, this.clearSelected.bind(this));
		},
		displayActive: function(hero) {
			this.render_active_hero = hero.name;
			//this.heroViews[hero.name].drawActive();
			if (!this.heroViews[hero.name]) {
				return;
			}
			this.heroViews[hero.name].displaySummary(false);
		},
		getMouseOver: function(x, y) {
			for (var obj in this.heroViews) {
				if (this.heroViews[obj].isMouseOver(x, y)) {
					return TG.data.heroes[obj];
				}
			}
			return null;
		},
		// Highlights a threat target icon at the next refresh.
		queueThreatDraw: function(hero_name, target_name) {
			this.threats[hero_name] = true;
		},
//		drawThreat: function(threatObj) {
//			this.heroViews[threatObj[0]].drawThreatIcon(threatObj[1]);
//		},
		// draw the arrow at next refresh
		queueArrowDraw: function(params) {
			// x1, y1, x2, y2, icon, friendly, /*optional*/ability_name, /*optional*/caster_name
			this.arrows.push(params);
		},
		// draws arrow immediately, to draw a bunch after queued
		drawArrow: function(arrow_params) {
			let is_wmd = arrow_params.ability_name && arrow_params.ability_name == SF.WMD_ABILITY_NAME;
			let color = arrow_params.friendly ? "#080" : "#800";
			var border = "rgba(255, 255, 255, 1)";
			var sxy = TG.data.map.getFullXY(arrow_params.x1, arrow_params.y1);
			var txy = TG.data.map.getFullXY(arrow_params.x2, arrow_params.y2);
			var ctx = TC.layer1;
			if (!is_wmd && (sxy[0] !== txy[0] || sxy[1] !== txy[1])) {
				// Skip drawing arrow if self-cast / no target.
				var angle = Math.atan2(txy[0] - sxy[0], txy[1] - sxy[1]);
				ctx.save();
				ctx.translate(txy[0], txy[1]);
				ctx.rotate(-angle);
				let startxy = SU.RotateAround(sxy[0]-txy[0], sxy[1]-txy[1], angle);
				
				// White arrow with a darker arrow inside.
	      ctx.beginPath();
	      ctx.moveTo(startxy[0], startxy[1]);
	      ctx.lineTo(0, -15);
	      ctx.lineTo(-5, -15);
	      ctx.lineTo(0, -5);
	      ctx.lineTo(5, -15);
	      ctx.lineTo(0, -15);
				ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = border;
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();
	      ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
				/*
				TU.line(ctx, startxy[0], startxy[1], 0, -5, border, 4);
				TU.line(ctx, 0, -5, -7, -12, border, 4);
				TU.line(ctx, 0, -5, 7, -12, border, 4);				
				TU.line(ctx, startxy[0], startxy[1], 0, -5, color, 2);
				TU.line(ctx, 0, -5, -7, -12, color, 2);
				TU.line(ctx, 0, -5, 7, -12, color, 2);
				*/
				ctx.restore();
			}

			// Put the ability icon on the arrow
			var icon = arrow_params.icon;
			if (icon && !is_wmd) {
				var size = 26;
				ctx.save();
				//ctx.globalAlpha = 0.5;
				//TU.rect(ctx, (sxy[0] + txy[0]) / 2 - size / 2, (sxy[1] + txy[1]) / 2 - size / 2, size, size, "#FFF");
				ctx.drawImage(icon, (sxy[0] + txy[0]) / 2 - size / 2, (sxy[1] + txy[1]) / 2 - size / 2, size, size);
				ctx.restore();
			}
			if (is_wmd) {
				this.PrintWmdMessage(arrow_params.caster_name);
				// Special case of plot effect.
				//TU.text(TC.hudLayer, "WMD/>LOAD MINIONS,8,1", (sxy[0] + txy[0]) / 2 - size / 2, (sxy[1] + txy[1]) / 2 - size*2, SF.FONT_SB, "#FFF", 'center');
				//TU.text(TC.hudLayer, "WMD/>LOAD MINIONS,8,1", (sxy[0] + txy[0]) / 2 + size*0.0, (sxy[1] + txy[1]) / 2 + size*0.45, "bold 14pt monospace", "#FFF", 'center');
			}
		},
		WmdCasterXY: function(caster_name) {
			for (var obj in TG.data.heroes) {
				if (TG.data.heroes[obj].name == caster_name) {
					caster = TG.data.heroes[obj];
					return TG.data.map.getFullXY(caster.x, caster.y);
				}
			}
			error("nowmdbossmsg");
			return [0, 0];
		},
		// Prints a message on the alpha boss's hat.
		PrintWmdMessage: function(caster_name) {
			let casterxy = this.WmdCasterXY(caster_name);
			TU.text(TC.layer1, TG.wmd_message, casterxy[0], casterxy[1]+12, "bold 14pt monospace", "#FFF", 'center');
		},
		showTargeting: function(text) {
			this.clearTargeting();
			this.drawTargetImage();
			TU.rect(TC.hudLayer, SF.HALF_WIDTH-200, TARGET_MSG_Y, 400, 40, "rgba(128, 128, 255, 0.5)", "#000", 1);
			text = "Targeting: " + text;
			TU.text(TC.hudLayer, text, SF.HALF_WIDTH, TARGET_MSG_Y + 30, SF.FONT_XLB, "#000", 'center');
		},
		clearTargeting: function() {
			TC.hudLayer.clearRect(0, TARGET_MSG_Y - 2, SF.WIDTH, SF.HALF_HEIGHT);
			TC.targLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
		},
		drawTargetImage: function() {
			TC.targLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			if (this.tier.targeting) {
				TC.targLayer.globalAlpha = 0.3;
				TC.targLayer.drawImage(TG.data.map.targetImg, 0, 0);
				TC.targLayer.globalAlpha = 1;
			}
			if (this.tier.targeting && this.tier.selectedAbility.level_cap) {
				let cap = this.tier.selectedAbility.level_cap;
				if (cap) {
					for (var obj in TG.data.heroes) {
						let hero = TG.data.heroes[obj];
						if (!hero.dead && hero.level > cap) {
							this.heroViews[obj].drawInvalidTarget();
						}
					}
				}
			}			
			
		},
		drawTargetFoot: function(x, y, size) {
			if (footImages[size] === undefined) {
				var newimg = document.createElement('canvas');
				newimg.width = size * TF.HEX_SIZE;
				newimg.height = size * TF.HEX_SIZE;
				var ctx = newimg.getContext('2d');
				ctx.save();
				ctx.translate(newimg.width / 2, newimg.height / 2);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, size / 2 * TF.HEX_SIZE, "rgba(50,100,150,1)", "#000", 1);
				ctx.restore();
				footImages[size] = newimg;
			}
			var img = footImages[size];
			var xy = TG.data.map.getFullXY(x, y);
			TC.targLayer.globalAlpha = 0.5;
			TC.targLayer.drawImage(img, xy[0] - img.width / 2, xy[1] - img.width / 2);
			TC.targLayer.globalAlpha = 1;
		},
		// Updates the targeting field shadow.
		mouseUpdateFootprintTarget: function(x, y, ability, target) {
//			TC.hudLayer.clearRect(190 - 2, TARGET_MSG_Y - 2, 370 + 4, 40 + 4);

			var text = null;
			var moveDist = TG.data.map.getTargetDist(x, y);
			if (moveDist < 255) {
				var footsize = 1;
				if (target.pathSize) {
					footsize = TG.data.activeHero.size;
				}
				if (target.endSize) {
					footsize = TG.data.activeHero.size;
				}
				if (target.aoe !== null) {
					footsize = target.aoe;
				}
				this.drawTargetFoot(x, y, footsize);
			}
/*
				if (ability.displayName === "Move") {
					var hero = TG.data.activeHero;
					var turns = hero.calcMoveTurns(moveDist);
					text = "Distance: " + moveDist + ", turns: " + turns;
				} else {
					text = "Targeting: " + ability.displayName + "";

				}

				if (target.aoe !== null) {
					var heroes = TG.data.map.collectHeroes(x, y, target.aoe);
					for (var obj in heroes) {
						this.showHover(heroes[obj]);
					}
				}

			} else {
				text = "Out of range";
			}
				*/
				
		},
		mouseMoved: function(x, y, ability, target) {
//			TC.targLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			this.drawTargetImage();
			if (ability !== null && target && target.terrain) {
				this.mouseUpdateFootprintTarget(x, y, ability, target);
				return;
			}
			// no ability or hero targeting ability, display a hero if over
			var hero = this.getMouseOver(x, y);
			if (hero === null || hero === undefined) {
				if (!this.stickingSelect) {
					this.lastSelected = null;
					this.clearSelected();
					// Check if the tile should be displayed
					if (!this.tier.targeting) {
						TG.data.mapEffects.displayHex(x, y, this.show_grid);
					}
				}
			} else {
				if (this.lastSelected === null || this.lastSelected !== hero.name) {
					if (!this.stickingSelect) {
						this.lastSelected = hero.name;
						this.clearSelected();
						if (ability !== null) {
							this.displayTargeted(hero);
						} else {
							this.displaySelected(hero);
						}
					}
				}
			}
			TU.rect(TC.targLayer, 0, TF.HEIGHT-30, 120, 30, "rgba(0, 0, 0, 0.5)");
			var distance = TG.data.map.getHexDist(x, y, TG.data.activeHero.x, TG.data.activeHero.y);
			distance = Math.max(0, distance-(TG.data.activeHero.size-1)/2);
			TU.text(TC.targLayer, "Distance: "+distance, 12, TF.HEIGHT-10, SF.FONT_M, "#FFF");
		},
		redraw: function() {
			TC.layer1.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			TC.targLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);

			// redraw map
			this.redrawMap();
			if (this.tier.targeting) {
				this.showTargeting();
			}
		},
		
		//heroReadied: function(name, turn) {},
		
		BattleLog: function() {
			/*
			let text = "";
			for (let i = 0; i < 16 && i < this.messageLogs.length; i++) {
				let log = this.messageLogs[i];
				text += log.turn + ": " + log.text + "\n";
			}
			*/
			SU.PushTier(new SBar.BattleLogR("Battle Log", this.messageLogs));
		},

		// Battle ending, clean up
		teardown: function() {
			TC.hudLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			TC.targLayer.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			TC.layer1.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
			SB.clear();
		}
	};
	SU.extend(SBar.TactRenderer, SBar.TierRenderer);
})();
