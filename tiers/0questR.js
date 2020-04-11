/*
 * Building quest object
 * Give the player an option for a quest
 */

(function() {

  SBar.QuestDisplay = function(buildingDataIn, callback, seed, level) {
    this._initQuestDisplay(buildingDataIn, callback, seed, level);
  };

  SBar.QuestDisplay.prototype = {
    data: null,
    qdata: null,
    animImage: null,
    animCtx: null,
    animTime: 0,
    x1: 0,
    y1: 0,
    x2: SF.HALF_WIDTH,
    y2: SF.HALF_HEIGHT,
		callback: null,
    _initQuestDisplay: function(buildingDataIn, callback, seed, level) {
			if (callback) {
				this.callback = callback;
			}
      this.data = buildingDataIn;
			this.seed = seed;
			this.level = level;
			this.money_run = this.level == 1 && this.data.faction == SF.FACTION_NORMAL;
    },
    activate: function() {
      this.textimg = document.createElement('canvas');
      this.textimg.width = SF.WIDTH;
      this.textimg.height = SF.HEIGHT;
      this.tcontext = this.textimg.getContext('2d');

      this.animImage = document.createElement('canvas');
      this.animImage.width = SF.WIDTH;
      this.animImage.height = SF.HEIGHT;
      this.animCtx = this.animImage.getContext('2d');
      this.animImage2 = document.createElement('canvas');
      this.animImage2.width = SF.WIDTH;
      this.animImage2.height = SF.HEIGHT;
      this.animCtx2 = this.animImage2.getContext('2d');
      this.animImage3 = document.createElement('canvas');
      this.animImage3.width = SF.WIDTH;
      this.animImage3.height = SF.HEIGHT;
      this.animCtx3 = this.animImage3.getContext('2d');
      //SU.rect(this.animCtx, 0, 0, SF.WIDTH, SF.HEIGHT, '#000');
			
			
      this.context = SC.layer2;

			//SU.clearText();
      this.qdata = this.getQuest();

      if (!this.qdata.valid) {
        SU.displayBorderNodark("Sorry Nothing Available", this.tcontext);
        S$.find(this.seed + 1.11 + S$.GetWeek()); // mark job found, don't want to run across it again
      } else {
        SU.displayBorderNodark(this.qdata.name, this.tcontext);
        this.drawQuest();
				SU.addText("1: Accept");
				if (!this.money_run) {
					SU.addText("2: View Reward");
				}
      }
			SU.addText("X: Exit");

      SG.activeTier = this;
      // Manually put the dark border once, so it's not overdrawn.
      SU.rect(this.context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,0.8)');
      this.context.drawImage(this.textimg, 0, 0);
    },
    xoff: null,
    yoff: null,
    drawQuest: function() {
      var qdata = this.qdata;
      var parent = qdata.target.parentData;
      this.xoff = 100;
      this.yoff = 120;
      // wrapText: function(context, text, x, y, maxWidth, lineHeight) {
      var context = this.tcontext;
      context.textAlign = 'left';
      var background = qdata.getBackground(this.data, this.money_run);
      // right size
      //this.xoff += SF.HALF_WIDTH;
      this.yoff = 120;

      this.addLine("System", parent.systemData.name);
      this.addLine("Coordinates", coordToParsec(qdata.x) + ", " + coordToParsec(-qdata.y) + " pc");
      this.addLine("Level", this.level);
      var planet = (parent.type === SF.TYPE_PLANET_DATA);
      if (planet) {
        this.addLine("Planet", parent.name);
      } else {
        this.addLine("Belt", parent.name);
      }
      this.addLine("Building", qdata.target.name[0] + " " + qdata.target.name[1]);
			this.addLine("Distance", this.getDistance(this.qdata));
      // duplicated on charR
      this.addLine("");
      /*if (qdata.type === SF.QUEST_PLOT) {
        this.addLine("Reward", "Finding your friend is its own reward");
      } else*/ // if (qdata.type === SF.QUEST_PLUNDER) {
//        this.addLine("Reward", "You keep what you kill.");
//      } else {
			if (this.money_run) {
				this.addLine("Reward: "+SF.SYMBOL_CREDITS+qdata.getMoneyReward())
			} else {
		    var arti = qdata.getArtiReward();
				let skill = new SBar.Skill(arti);
		    this.addLine("Reward");
				this.addLine(skill.name);
				this.addLine(skill.SummaryText());
			}
      this.yoff += 30;
      this.yoff += SU.wrapText(context, background, this.xoff, this.yoff, 400, 20, SF.FONT_L, '#AAA');
    },
		getDistance: function(qdata) {
      let px = this.data.parentData.x;
      let py = this.data.parentData.y;
      let dx = px - qdata.x;
      let dy = py - qdata.y;
      let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
			return coordToParsec(distance) + " pc";
		},
    addLine: function(text, value) {
      var context = this.tcontext;
      context.font = SF.FONT_LB;
      context.fillStyle = '#FFF';
      context.textAlign = 'left';
      context.fillText(text, this.xoff, this.yoff);

      if (value) {
        context.font = SF.FONT_L;
        context.fillStyle = SF.VALUE_COLOR;
        context.textAlign = 'right';
        context.fillText(value, this.xoff + 400, this.yoff);
      }
      this.yoff += 25;
    },
    getQuest: function() {
      var sourceType = this.data.type;
      var sourceFaction = this.data.faction;
      var qtype = null;
      var tfact = sourceFaction;
      let qdata = new SBar.QuestData();
      qdata.questlocate(this.data, this.seed, this.level, this.level + 3, tfact, this.money_run);
			return qdata;
    },
    handleUpdate: function(deltaTime, movex, movey) {
      //this.context.clearRect(0,0,SF.WIDTH,SF.HEIGHT);
      this.context.drawImage(this.textimg, 0, 0);
      this.updateAnim();
    },
    updateAnim: function() {
      SU.circle(this.animCtx, SF.HALF_WIDTH + Math.random() * 40 - 20, SF.HALF_HEIGHT + Math.random() * 30 - 15, 2, "#888");
      this.animCtx.clearRect(SF.HALF_WIDTH + Math.random() * 40 - 22, SF.HALF_HEIGHT + Math.random() * 30 - 17, 4, 4);
      this.animCtx.clearRect(SF.HALF_WIDTH + Math.random() * 40 - 22, SF.HALF_HEIGHT + Math.random() * 30 - 17, 4, 4);
      this.animCtx.clearRect(SF.HALF_WIDTH + Math.random() * 40 - 22, SF.HALF_HEIGHT + Math.random() * 30 - 15, 4, 4);

      this.animCtx2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.animCtx2.drawImage(this.animImage, -10 + (Math.random() - Math.random()) / 4, -5 + (Math.random() - Math.random()) / 4, SF.WIDTH + 20, SF.HEIGHT + 10);
      this.animCtx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.animCtx.drawImage(this.animImage2, 0, 0);
      
      this.animCtx3.globalCompositeOperation="source-over";
      this.animCtx3.drawImage(this.textimg, 0, 0);
      this.animCtx3.globalCompositeOperation="source-in";
      this.animCtx3.drawImage(this.animImage, 0, 0);
      
      this.context.drawImage(this.animImage3, 0, 0);
    },
    handleKey: function(key) {
      switch (key) {
        case SBar.Key.NUM1:
        case SBar.Key.SPACE:
          if (this.qdata.valid) {
            this.accept();
          }
          break;
        case SBar.Key.NUM2:
          if (this.qdata.valid && !this.qdata.money_run) {
						let arti = this.qdata.getArtiReward();
						SU.PushTier(new SBar.ArtifactComplexRenderer(S$.crew[0], arti, /*view_only=*/true));
          }
          break;
        case SBar.Key.X:
          this.cancel();
          break;
        default:
          error("unrecognized key pressed in questr: " + key);
      }
    },
    accept: function() {
      S$.addQuest(this.qdata);
      S$.find(this.seed + 1.11 + S$.GetWeek()); // mark job found
      this.teardown(true);
    },
    cancel: function() {
      this.teardown(false);
    },
    teardown: function(accepted) {
			SU.PopTier();
      if (this.callback) {
        this.callback(accepted);
      }
    }
  };
})();
