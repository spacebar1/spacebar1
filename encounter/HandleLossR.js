/*
 * Dialog at battle loss or other game end.
 */
(function() {

  var images = null;

  SBar.HandleLossRenderer = function(encounter_data, bdata) {
    this._initHandleLossRenderer(encounter_data, bdata);
  };
  SBar.HandleLossRenderer.prototype = {
		encounter_data: null,
		bdata: null,
		context: null,
		staticImage: null,
		render_calls: null,
		timeout: null,
		explodes: null,
		title: null,
		description: null,
		div: null,
    _initHandleLossRenderer: function(encounter_data, bdata) {
			this.encounter_data = encounter_data;
			this.bdata = bdata;
      this.context = SC.layer2;
			this.render_calls = 0;
			//this.explode = new SBar.IconExplode(this.context, 0, 0, 10);
			this.explodes = [];
			for (let i = 0; i < Math.floor(Math.random()*30)+10; i++) {
				this.explodes.push(new SBar.IconExplode(this.context, Math.random()*SF.HALF_WIDTH-SF.HALF_WIDTH/2,
				 Math.random()*SF.HALF_HEIGHT-SF.HALF_HEIGHT/2, Math.random()*35+3, Math.round(Math.random()*30)));
			}
			
			if (encounter_data) {
				this.title = "Defeat at " + this.encounter_data.battle_name.split(" at ")[0];
				this.title = "Defeat at " + this.encounter_data.battle_name.split(" at ")[0];
				if (SG.death_message) {
					SG.death_message = " "+SG.death_message;
				} else {
					SG.death_message = "";
				}
				SG.death_message = "Defeated at "+this.encounter_data.battle_name.split(" at ")[1]+". "+SG.death_message;
			} else {
				this.title = "Defeat"
			}
			this.description = ST.DefeatBackground(this.bdata);
    },
		
		SetTitleDescription: function(title, description) {
			this.title = title;
			this.description = description;
			return this;
		},

    activate: function() {
      SG.activeTier.teardown();
			
			SG.allow_browser_leave = true;
			SB.clear();
      this.staticImage = document.createElement('canvas');
      this.staticImage.width = SF.WIDTH;
      this.staticImage.height = SF.HEIGHT;
      this.context = this.staticImage.getContext('2d');

      SG.activeTier = this;
			
      SU.displayBorder(this.title, this.context);

      SU.wrapText(this.context, this.description, 100, 130, SF.HALF_WIDTH-150, 25, SF.FONT_L, '#AAA');
			this.AddBonusConduct();

      this.context = SC.layer2;
			this.handleUpdate();
			// Render every 50 ms, 100 times. Can tweak this based on performance.
			this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);			
			SU.clearText();
			//SU.addText("1: View Score");							
			SU.addText("X: Continue");
			
			this.UpdateDiv();
    },
		AddBonusConduct: function() {
			if (S$.crew[0].base_level > 5) {
				return;
			}
			let choices = [];
			for (let conduct_key in SF.CONDUCTS) {
				let conduct = SF.CONDUCTS[conduct_key];
      	if (conduct.bonus && !conduct_key.startsWith("random_")) {
					choices.push(conduct_key);
				}
			}
			let choice_num = Math.floor(SU.r(6.12, S$.time+1)*choices.length);
			let conduct = SF.CONDUCTS[choices[choice_num]];
			let text = "You have earned a guilt-free bonus for the next game (select in \"Bonuses\"):\n\n  "+conduct.title+"\n  "+conduct.desc;
      SU.wrapText(this.context, text, SF.HALF_WIDTH+50, 130, SF.HALF_WIDTH-150, 25, SF.FONT_L, '#AAF');
		},
		UpdateDiv: function() {
			let links = [
				"https://www.youtube.com/watch?v=hR69EKvcW-4",  // Kaneda's Death (Sunshine).
				"https://www.youtube.com/watch?v=67VATPxULPk",  // Nathan's Death (Ex Machina).
				"https://www.youtube.com/watch?v=RJ9iImcu4_0",  // Spike's Death (Cowboy Bebop).
				"https://www.youtube.com/watch?v=3pbuEujuirY",  // Big Daddy's Death (Kick Ass).
				"https://www.youtube.com/watch?v=Ebh-hSCSdv0",  // Kris's End (Solaris 2002).
				"https://www.youtube.com/watch?v=GWNRRnXmGKs",  // Vampire Smile (Kyla La Grange).
				"https://www.youtube.com/watch?v=cmmbBo8RYoE",  // T-800's Death (Terminator 2).
			];
			let scene_num = Math.floor(SU.r(1.23, 3.45)*links.length); // Game seed.
			let scene_link = links[scene_num];
      this.div = document.getElementById('endgamediv');
      //this.div = document.getElementById('container')
			this.div.style.position = "absolute";
			this.div.style.left = Math.round(SF.WIDTH*0.15*SG.scalex)+"px";
			this.div.style.top = Math.round(SF.HEIGHT*0.68*SG.scaley)+"px";
			this.div.innerHTML = "<a href='"+scene_link+"' target='_blank' style='font-size:16px; font-family: "+SF.FONT+";color:#AAA'>Death Scene #"+(scene_num+1)+" (new window)</a>";
      this.div.style.visibility = "visible";
		},
    handleUpdate: function() {
			this.render_calls++;
			if (this.timeout == null) {
				return;
			}
			if (this.render_calls < 100) {
				this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);
			} else {
				this.timeout = null;
			}

      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.context.drawImage(this.staticImage, 0, 0);

			
			this.explodes = this.explodes.filter(function(explode) {  // filter() needs true to keep it.
				return explode.update(0,0);
			});
    },
    handleKey: function(key) {
      switch (key) {
        case SBar.Key.NUM1:
					// TODO: view score.
        case SBar.Key.SPACE:
        case SBar.Key.X:
        case SBar.Key.ESC:
					this.teardown();
        default:
          error("unrecognized key pressed in hlossr: " + key);
      }
    },
		teardown: function() {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
			}
      this.div.style.visibility = "hidden";
			this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SU.PopTier();
      SU.PushTier(new SBar.GameSummaryRenderer());
		},
  };
})();
