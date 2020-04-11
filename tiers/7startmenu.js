/*
 * Game start renderer and conducts.
 * 
 */
(function() {
	let PAGE_MENU = 1;
	let PAGE_NEW_MENU = 2;
	let PAGE_CONDUCTS = 3;
	let PAGE_BARTENDER_EDIT = 4;
	
  var menux = 730;		
  var menuy = 110;
  var width = 250;
  var height = 550;

  SBar.StartPage = function() {
      this._initStartPage();
  };

  SBar.StartPage.prototype = {
    type: SF.TIER_START,
    // tier objects for alien renderer
    data: null,
    faction: SF.FACTION_NORMAL,
    seed: null,
    name: ["", SF.GAME_NAME],
    nameShort: null,
    botcontext: null,
    midcontext: null,
    topcontext: null,
    // game settings
    bartender: null,
    difficulty: 0,
    hardcore: false,
		conducts: null,  // Conduct key name Set (map to true).
		current_page: null,
		showing_bonuses: false,  // vs. showing challenges.
		counter: 0,
		existing_name: null,
    _initStartPage: function() {
				SU.clearTextNoChar();
        //Math.seedrandom(new Date()); // needed for next steps
        this.layer = SC.layer2;
        this.data = this;

        this.botcontext = SC.layer1;
        this.midcontext = SC.layer1;
        this.topcontext = SC.layer1;
        this.menucontext = SC.layer2;
				
				this.conducts = {};	
    },
    activate: function() {
      SG.activeTier = this;
			this.bartenderNext();
      this.drawMainMenu();
    },
		drawExteriorWindow: function() {
			//SC.layer2.clearRect(100, 200, 500, 300);
//        SU.rectCorner(this.midcontext, 10, 95, 195, 510, 310, 'rgba(55,20,10,1)');
      SU.rect(this.midcontext, 95, 195, 510, 310, "#555");
      SU.rect(this.midcontext, 92, 500, 514, 10, "#777");
			this.midcontext.clearRect(100, 200, 500, 300);
			SU.line(this.midcontext, 100, 350, 600, 350, "#555", 5)
			SU.line(this.midcontext, 266, 200, 266, 500, "#555", 5)
			SU.line(this.midcontext, 433, 200, 433, 500, "#555", 5)
		},
		/*
		// Draws the pictures on the wall?
    drawPics: function() {
			this.star_image = SU.drawBackground();
			let y = 50+Math.round(SU.r(11.9,11.0)*150);
			let x = -500+Math.round(SU.r(11.1,11.2)*300);
			let seed = 1;
			//SU.drawBackground();
			
      let w = Math.round(SU.r(11.1,11.2+seed++)*400+50);
      let h = Math.round(SU.r(11.3,11.4+seed++)*200+100);
			let xoff = w+40+Math.round(SU.r(11.1,11.2+seed++)*1000);
			
			let reverse = SU.r(4.1, 4.2) < 0.5;
			while (x < SF.WIDTH) {
				x += xoff;
				if (reverse) {
					this.drawPic(SF.WIDTH-x, y, w, h, seed)
				} else {
					this.drawPic(x, y, w, h, seed)
				}
				seed += 1.11;
			}
    },
		drawPic: function(x, y, w, h, seed) {
      let ctx = this.midcontext;
      let wid = 5;
			// Hangers.
      SU.line(ctx, x, y, x + w / 2, y-50, "#000");
      SU.line(ctx, x + w, y, x + w / 2, y-50, "#000");
      SU.rectCorner(ctx, wid, x - wid, y - wid, w + wid * 2, h + wid * 2, 'rgba(55,20,10,1)');
			
			
			let xstart = Math.round((SF.WIDTH-200-w)*SU.r(4.12, seed));
			let ystart = Math.round((SF.HEIGHT-200-h)*SU.r(4.13, seed));
      ctx.drawImage(this.star_image, xstart, ystart, w, h, x, y, w, h);
		},
		*/
    drawMainMenu: function() {
      this.current_page = PAGE_MENU;
			SU.clearTextNoChar();
			SU.addText("S: New");
			SU.addText("H: Hall of Legends");
			SU.addText("C: Credits");
		
      var ctx = this.menucontext;
      SB.clear();
      ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);

      ctx.save();
      ctx.translate(menux, menuy);

      var colorStops = [0, 'rgba(120,120,80,0.8)', 1, 'rgba(90,90,90,0.8)'];
      SU.rectCornerGrad(ctx, 8,  0, 0, width, height, colorStops, 'rgb(0,0,0)', 2);
      ctx.restore();

      var starti = SB.imgText("New", 16, 220);
      SB.add(menux + 10, menuy + 10, starti, this.newGame.bind(this));

      if (localStorage["char"]) {
				let load_detail = SU.loadSaveDetails();
				let load_text = this.LoadDetailFormat(load_detail);
	      SU.text(ctx, load_text, menux+width/2, menuy+95, SF.FONT_L, '#000', 'center');
				
				let text = load_detail.cansave ? "Load Save" : "Resume Save";
        let loadi = SB.imgText(text, 16, 220);
				SU.addText("R: "+text);
				SU.addText("D: Delete Save");
				SB.add(menux + 10, menuy + 110, loadi, this.loadGame.bind(this));
        var deli = SB.imgText("Delete Save", 16, 220);
        SB.add(menux + 10, menuy + 160, deli, this.delGame.bind(this));
      } else {
				SU.text(ctx, "(No save in progress)", menux + width/2, menuy + 110 + 5, SF.FONT_M, "#000", 'center')
      }

      var starti = SB.imgText("Hall of Legends", 16, 220);
      SB.add(menux + 10, menuy + 475, starti, this.highScores.bind(this));

      //SU.text(ctx, "version "+SF.VERSION, menux+width/2, menuy + 505, SF.FONT_S, '#000', 'center');
      var starti = SB.imgText("Credits", 16, 220);
      SB.add(menux + 10, menuy + 515, starti, this.credits.bind(this));

      //var loadi = SB.imgText("Test Framework", 16, 220);
      //SB.add(menux + 10, menuy + 210, loadi, this.testPage.bind(this));
    },
    drawNewMenu: function() {
      this.current_page = PAGE_NEW_MENU;
			SU.clearTextNoChar();
			SU.addText("C: Char Name");
			SU.addText("B: Bonuses");
			SU.addText("H: Challenges");
			SU.addText("X: Back");
			SU.addText("SPACEBAR: Start");

			var ctx = this.menucontext;
      var yoff = 0;
      SB.clear();
      ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      ctx.save();
      ctx.translate(menux, menuy);
      var colorStops = [0, 'rgba(120,120,80,0.8)', 1, 'rgba(90,90,90,0.8)'];
      SU.rectCornerGrad(ctx, 8,  0, 0, width, height, colorStops, 'rgb(0,0,0)', 2);
      ctx.restore();

			SU.text(ctx, "New", menux + width/2, menuy + 31, SF.FONT_XLB, '#000', 'center');
			SU.text(ctx, "Name", menux + width/2, menuy + 80, SF.FONT_L, '#000', 'center');
      var bari = SB.imgText(this.nameShort, 16, 180);
			let y = 90;
      SB.add(menux + 10, menuy + y, bari, this.bartenderEdit.bind(this));
      //SB.add(menux + 210, menuy + y, SM.buttRight, this.bartenderNext.bind(this));
			let img = SB.imgText('↻', 16, 16, 2);
      SB.add(menux + 210, menuy + y, img, this.bartenderNext.bind(this));
			y += 55;
			for (let i = 0; i < SF.NUM_STATS; i++) {
				let text = SF.STAT_FULL_NAME[i]+" ";
	      SU.text(ctx, text, menux+30, menuy+y, SF.FONT_L, '#000', 'left');
	      SU.text(ctx, S$.crew[0].stats[i]+" "+SF.STAT_NAME[i], menux+225, menuy+y, SF.FONT_L, SF.STAT_TEXT_COLOR, 'right');
				y += 25;
			}
			
			y += 40
			let num_bonuses = 0;
			let num_challenges = 0;
			for (let conduct_key in this.conducts) {
				if (SF.CONDUCTS[conduct_key].bonus) {
					num_bonuses++;
				} else {
					num_challenges++;
				}
			}
			
      SB.add(menux + 10, menuy + y, SB.imgText("Bonuses ("+num_bonuses+")", 16, 220), this.DrawBonuses.bind(this));
			y += 40
      SB.add(menux + 10, menuy + y, SB.imgText("Challenges ("+num_challenges+")", 16, 220), this.DrawChallenges.bind(this));
      // go back
      SB.add(menux + 10, menuy + 10, SM.buttLeft, this.drawMainMenu.bind(this), 20, 20);
      // start
      SB.add(menux + width / 2 - 30, menuy + height - 70, SM.buttCheck, this.start.bind(this), 60, 60);
    },
		DrawBonuses: function() {
			this.DrawConducts(true);
		},
		DrawChallenges: function() {
			this.DrawConducts(false);
		},
		// Note if 'bonuses' is not specified the value will be preserved from before.
		DrawConducts: function(bonuses) {
			SU.clearTextNoChar();
			SU.addText("X: Back");

      this.current_page = PAGE_CONDUCTS;
			if (bonuses !== undefined) {
				this.showing_bonuses = bonuses;
			}
      var ctx = this.menucontext;
      SB.clear();
      ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			
      var colorStops = [0, 'rgba(120,120,80,0.8)', 1, 'rgba(90,90,90,0.8)'];
      //SU.rectCornerGrad(ctx, 8,  50, 150, SF.WIDTH-100, SF.HEIGHT-200, colorStops, 'rgb(0,0,0)', 2);
			SU.rectCornerGrad(ctx, 8,  menux-width, menuy, width*2, height, colorStops, 'rgb(0,0,0)', 2);

      // go back
      //SB.add(400, 172, SM.buttLeft, this.drawNewMenu.bind(this), 20, 20);
      // SB.add(menux + 10 - width, menuy + 10, SM.buttLeft, this.drawNewMenu.bind(this), 20, 20);					
      // start
      // Confirm.
      SB.add(menux + width / 2 - 30, menuy + height - 70, SM.buttCheck/*SM.buttRight*/, this.drawNewMenu.bind(this), 60, 60);
			
			let title = this.showing_bonuses ? "Bonuses" : "Challenges";
			SU.text(ctx, title, menux, menuy + 28, SF.FONT_XLB, '#000', 'center');
			
			let yoff_orig = 220;
			let yoff = yoff_orig;
			let xoff = 0;
			let max_list_length = 9;
			for (let conduct_key in SF.CONDUCTS) {
				let conduct = SF.CONDUCTS[conduct_key];
      	if (conduct.bonus === this.showing_bonuses) {
					--max_list_length;
					if (max_list_length == -1) {
						// Start a second column.
						xoff = width;
						yoff = yoff_orig;
					}
					let y = yoff;
					let x = menux + 10 - width + xoff;
					yoff += 40;
					
				
          let new_button = SB.add(x, y, SB.imgText(conduct.title, 16, 220), this.ClickConduct.bind(this));
					conduct.key = conduct_key;  // Conduct data didn't originally have its key.
					new_button.conduct_data = conduct;
					
					if (this.conducts[conduct_key]) {
            SU.rect(ctx, x, y, 230, 25, "#00F");
					}
					
				}
			}
		},
		ClickConduct: function() {
			if (!SB.GetButtonOver()) {
				return;
			}
			this.clicked_button = true;
			let conduct_data = SB.GetButtonOver().conduct_data;
			if (this.conducts[conduct_data.key]) {
				delete this.conducts[conduct_data.key];
			} else {
				this.conducts[conduct_data.key] = true;
			}
			this.DrawConducts();
		},
    bartenderEdit: function() {
      var ctx = this.menucontext;
      if (this.current_page == PAGE_BARTENDER_EDIT) {
          return;
      }
      this.current_page = PAGE_BARTENDER_EDIT;
      SB.clear();
      this.menucontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);

      ctx.save();
      ctx.translate(menux, menuy);

      var colorStops = [0, 'rgba(120,120,80,0.8)', 1, 'rgba(90,90,90,0.8)'];
      SU.rectCornerGrad(ctx, 8,  0, 0, width, height, colorStops, 'rgb(0,0,0)', 2);
      ctx.restore();

			SU.text(ctx, "Name", menux + width/2, menuy + 40, ' '+SF.FONT_L, '#000', 'center');
			
			this.old_name = this.nameShort;
			this.nameShort = "";
			this.DrawNameEdit();
    },
		AddBartenderNameChar: function(key, actual_key) {
      if (this.current_page != PAGE_BARTENDER_EDIT) {
      	error("abnc noshow");
				return;
      }
			if (key === SBar.Key.BACKSPACE) {
				if (this.nameShort.length > 0) {
					this.nameShort = this.nameShort.substring(0, this.nameShort.length - 1);					
				}
			} else {
				this.nameShort += actual_key;
			}
			this.DrawNameEdit();
		},
		DrawNameEdit: function() {
			SG.allow_options_key = false;
			SU.clearTextNoChar();
			SU.addText("ENTER: done");
      var ctx = this.menucontext;
      var colorStops = [0, 'rgba(120,120,120,0.8)', 1, 'rgba(90,90,90,0.8)'];
      SU.rectCornerGrad(ctx, 8,  menux+10, menuy+60, width-20, 30, colorStops, 'rgb(0,0,0)', 2);
			SU.text(ctx, this.nameShort, menux + width/2, menuy + 80, SF.FONT_L, '#FFF', 'center');
		},
		FinishBartenderName: function() {
			SG.allow_options_key = true;
			if (!this.nameShort || this.nameShort == "") {
				this.nameShort = this.old_name;
			}
			this.newBartenderCommon();
		},
    bartenderNext: function() {
			this.counter++;
			
			let existing_name = "";
			if (!this.first_bartender_done) {
				this.first_bartender_done = true;
				let load_detail = SU.loadSaveDetails();
				existing_name = load_detail.name;
			}
			if (existing_name) {
				this.nameShort = existing_name;
			} else {
	      this.nameShort = ST.getWord(SU.r(9.1, 9.3+this.counter), SU.r(9.1, 9.4+this.counter));
			}
      //this.seed = SU.r(9.1, 9.3+this.counter);//Math.random();
			this.newBartenderCommon();
    },
		// Draws the picture for the start menu.
		newBartenderCommon: function() {
      S$ = new SBar.GameData(this.nameShort);
      this.seed = SU.r(9.1, 9.5);//Math.random();
      this.name[0] = this.nameShort + "'s";
			if (this.alienr) {
        this.alienr.teardown();
			}
      this.alienr = new SBar.BuildingAlienRenderer(this);
			this.drawArth();
      this.drawExteriorWindow();
      this.drawNewMenu();
			this.alienr.render();
		},
		drawArth: function() {
			arth = null;
			let orig_bubbles = SF.NO_BUBBLES;
			SF.NO_BUBBLES = true;  // Allow arth2.
			let region = new SBar.RegionData(0, 0);
			for (let systemData of region.systems) {
				if (systemData.specialType === SF.SYSTEM_ARTH) {
					systemData.generate();
					for (let planet of systemData.planets) {
						if (planet.is_arth) {
							arth = planet;
							break;
						}
					}
				}
			}
			let arthx = 10;
			let arthy = 10;
			arth.generate();
			for (let building of arth.buildingdata) {
				if (building.type === SF.TYPE_CORNFIELD) {
					arthx = building.x;
					arthy = building.y;
				}
			}
			let travel = SU.GetTravelRenderer(/*skip_activetier=*/true);
			travel.SurfacePoint(arth, arthx, arthy);
			SF.NO_BUBBLES = orig_bubbles;
		},
		confirmStartOverwrite: function(confirmed) {
			if (!confirmed) {
				return;
			}
      delete localStorage.char;
			delete localStorage.chardetail;
			this.start();
		},
    start: function() {
			if (localStorage.char) {
				let load_detail = SU.loadSaveDetails();
				let load_text = this.LoadDetailFormat(load_detail);
				SU.ConfirmWindow("Confirm", "Start a new game and remove the saved game? "+load_text, this.confirmStartOverwrite.bind(this), "?");
				return;
			}				
			
			this.GenerateRandomConducts(this.conducts, true);
			this.GenerateRandomConducts(this.conducts, false);
			S$.credits = Math.floor(SU.r(this.seed, 5.31)*8)+4;
			S$.conduct_data = this.conducts;
			if (S$.conduct_data['upper_class']) {
				S$.credits = round2good(SF.LEVEL_XP[10]*(1+10*SU.r(this.seed, 83.12)));
			}
			if (S$.conduct_data['no_money_start'] || S$.conduct_data['no_money']) {
				S$.credits = 0;
			}
			if (S$.conduct_data['escape_pod']) {
				S$.ship = new SBar.Ship(SF.SHIP_POD, /*level=*/1, S$.ship.seed+1, 0);
			}
			if (S$.conduct_data['no_sensors'] || S$.conduct_data['all_sensors']) {
				S$.ship.RebuildArtiStats();
			}
			if (S$.conduct_data['guardian_angel']) {
				let crew_seed = SU.r(this.seed, 5.33);
				let crew_race = SU.r(this.seed, 5.32);
				let level = 5+Math.floor(SU.r(crew_seed, 5.34)*6);
				let name = ST.getWord(crew_race, crew_seed);
			  //SBar.Crew = function(name, seed, raceseed, level, crew_data, is_player/*optional*/, is_pirate/*optional*/) {
				let crew = new SBar.Crew(name, crew_seed, crew_race, level)
				crew.salary = 0;
				crew.morale = SF.MAX_MORALE_SCORE;
				crew.flaw = undefined;
				S$.AddCrew(crew);
			}
			if (S$.conduct_data['fast_ships']) {
				S$.ship = S$.GetStartingShip();
			}
			
      var intro = new SBar.IntroTier({intro: true});
      intro.activate();
    },
		GenerateRandomConducts: function(conducts, doing_bonus) {
			// This is a little tricky since the number should correlate
			// with a random conduct, but also shouldn't overlap.
			// So actually the numbers don't correlate here, it's just a number
			// of random count.
			// This doesn't account for any conducts explicitly selected.
			let choices = [];
			
			for (let conduct_key in SF.CONDUCTS) {
				let conduct = SF.CONDUCTS[conduct_key];
      	if (conduct.bonus === doing_bonus && !conduct_key.startsWith("random_")) {
					choices.push(conduct_key);
				}
			}
			let num_random = 0;
			for (let obj in conducts) {
				if (obj.startsWith("random_") && SF.CONDUCTS[obj].bonus === doing_bonus) {
					num_random++;
					delete conducts[obj];
				}
			}
			if (num_random === 0) {
				return;
			}
			let randoff = doing_bonus ? 1.1 : 2.2;
			let selected_slots = [];
			for (let i = 0; i < num_random; i++) {
				// Choose a slot position based on the number of slots not taken.
				// Then increment as needed to avoid collisions.
				if (choices.length-i <= 0) {
					error("Cant randconduct");
					return;
				}
				let raw_slot = Math.floor(SU.r(this.seed, i+12.3+randoff)*(choices.length-i));
				for (let j = 0; j < i; j++) {
					if (raw_slot === selected_slots[j]) {
						raw_slot++;
					}
				}
				selected_slots.push(raw_slot);
			}
			
			for (let slot of selected_slots) {
				conducts[choices[slot]] = true;
			}
		},
    newGame: function() {
        this.drawNewMenu();
    },
    loadGame: function() {
			if (!localStorage["char"]) {
				return;
			}
			let load_detail = SU.loadSaveDetails();
			if (load_detail.version === SF.VERSION) {
        SU.loadGame();
			} else {
				let text = "The current game version is different than the saved game version. Saved games between different "
				  + "game versions may or may not be compatible, depending on what changed in the game.\n\nContinue?\n\n"
				  + "  Saved game version: "+load_detail.version+"\n"
					+ "  Current game version: "+SF.VERSION;
					let callback = function(confirmed) {
						if (confirmed) {
			        SU.loadGame();
						}
					}
					SU.ConfirmWindow("Warning", text, callback.bind(this), "💾");
			}
    },
		deleteConfirm: function(confirmed) {
			if (!confirmed) {
				return;
			}
      delete localStorage.char;
			delete localStorage.chardetail;
      SB.clear();
      this.drawMainMenu();
		},
    delGame: function() {
			let load_detail = SU.loadSaveDetails();
			let load_text = this.LoadDetailFormat(load_detail);
			SU.ConfirmWindow("Delete Confirmation", "Really delete the saved game: "+load_text+"?", this.deleteConfirm.bind(this), "?");
    },
    testPage: function() {
        var testpage = new SBar.TestPage();
        testpage.activate();
    },
    handleUpdate: function(deltaTime, menux, movey) {
        //this.alienr.render();
    },
    handleKey: function(key, not_used, actual_key) {
			switch (this.current_page) {
				case PAGE_MENU:
					if (key === SBar.Key.R) {
						this.loadGame();
					} else if (key === SBar.Key.D) {
	          if (localStorage.char) {
							this.delGame();
						}
					} else if (key === SBar.Key.S) {
						this.drawNewMenu();
					} else if (key === SBar.Key.C) {
						this.credits();
					} else if (key === SBar.Key.H) {
						this.highScores();
					}
					break;
				case PAGE_NEW_MENU:
					if (key === SBar.Key.C) {
						this.bartenderEdit();
					} else if (key === SBar.Key.B) {
						this.DrawConducts(true);
					} else if (key === SBar.Key.H) {
						this.DrawConducts(false);
					} else if (key === SBar.Key.X) {
						this.drawMainMenu();
					} else if (key === SBar.Key.SPACE) {
						this.start();
					}
					break;
				case PAGE_CONDUCTS:
				  if (key === SBar.Key.X) {
					  this.drawNewMenu();
					}
					break;
				case PAGE_BARTENDER_EDIT:
					if (key === SBar.Key.ESC || key === SBar.Key.ENTER) {
						this.FinishBartenderName();
					} else {
						this.AddBartenderNameChar(key, actual_key);
					}				
					break;
			}
    },
		MouseMove: function(x, y) {
			if (this.current_page != PAGE_CONDUCTS) {
				return;
			}
      SC.layer3.clearRect(menux-300, menuy, 600, 100);
			let button = SB.GetButtonOver();
			if (!button) {
				return;
			}
			let conduct_data = SB.GetButtonOver().conduct_data;
			if (!conduct_data) {
				// Not every button is a conduct button.
				return;
			}
			let description = conduct_data.desc;
			SU.wrapText(SC.layer3, description, menux, menuy + 70, SF.WIDTH/3, 24, SF.FONT_L, 'black', 'center');
			
			/*
			var tilex = Math.floor(x/SF.ARTI_TILE_SIZE);
			var tiley = Math.floor(y/SF.ARTI_TILE_SIZE);
			if (tilex === this.x && tiley === this.y) {
				// Only redraw if needed.
				return;
			}
			this.x = tilex;
			this.y = tiley;
			this.UpdateForMouseMove();
			*/
		},
		LoadDetailFormat: function(load_detail) {
			return load_detail.name+" "+SU.TimeString(load_detail.time)/*+" (v"+load_detail.version+")"*/;
		},
		credits: function() {
			this.teardown();
      new SBar.CreditsRenderer().activate();
		},		
		highScores: function() {
			SU.PushTier(new SBar.HighScoreRenderer());
		},		
    teardown: function() {
			log("teardown")
			printStack()
      if (this.alienr) {
          this.alienr.teardown();
          delete this.alienr;
      }
			SU.clearTextNoChar();

      SB.clear();
      this.botcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.midcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.topcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.menucontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
    }
  };
})();

 
