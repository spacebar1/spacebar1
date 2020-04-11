(function() {

	let char_height = SF.HEIGHT-170;

	// cutscene_type is an object with one of the following: intro, discover_wmd, get_wmd.
  SBar.IntroTier = function(/*optional*/callback, /*optional*/building_data) {
      this._initIntroTier(callback, building_data);
  };

  SBar.IntroTier.prototype = {
    type: SF.TIER_INTRO,
		// Cutscene types.
		first_intro: false,
		discover_wmd: false,
		get_wmd: false,
		spacebar1: false,
		// End intro types.
		building_data: false,  // Not always set.
		callback: null,
    renderer: null,
		ms: 0,  // Milliseconds elapsed. See below for debug value.
		frame_ms: 20, // Milliseconds per frame.
		timeout: null,
		backctx: null,
		frontctx: null,
		crewctx: null,
		done_with_space_pan: false,
		pan_text: null,
		end_time: null,
		// Debug/testing fields.
		ms_start: 0,  // Time point to start the animation.
		//ms_start: 24000,  // Time point to start the animation.
		do_pan: true,  // Disable to skip the scrolling text + pan down.
		
		
		_initIntroTier: function(callback, building_data) {
			this.callback = callback;
			this.building_data = building_data;
			
		// Chapter 0: intro cutscene
		// Chapter 1: opening at the bar
    // Chapter 2: first seeing alphas
    // Chapter 3: first visiting a sphere
    // Chapter 4: first going back in time / discover wmd
		// Chapter 5: going back in time again / get wmd		
			if (building_data && building_data.type === SF.TYPE_BAR) {
				// SpaceBar1.
				this.spacebar1 = true;
			} else if (S$.current_chapter < 0) {
				this.first_intro = true;
				S$.current_chapter = 0;
			} else if (S$.current_chapter < 4) {
				this.discover_wmd = true;
				S$.current_chapter = 4;
			} else if (S$.current_chapter < 5) {
				this.get_wmd = true;
				S$.current_chapter = 5;
			}
      this.backctx = SC.layer1;
      this.crewctx = SC.layer2;				
      this.frontctx = SC.layer3;
    },
		// Used for debug.
		SetCutscene(name) {
			this.spacebar1 = false;
			this.first_intro = false;
			this.discover_wmd = false;
			this.get_wmd = false;
			this[name] = true;
		},
    activate: function() {
			SG.activeTier.teardown();
      SG.activeTier = this;
			
			// Intro normally happens only near the start time;
			if (S$.time > SF.CORNFIELD_EVENT_HOURS && this.building_data && this.building_data.type === SF.TYPE_CORNFIELD) {
				if (S$.got_wmd_in_past) {
					// Empty cornfield.
					if (this.callback) {
						this.callback();
					}
					SU.ShowWindow("Abandoned", "The Cornfield is empty");
					return;
				} else if (S$.current_chapter > 1) {
					this.ToBattle();
					return;
				}
			}

			this.renderer = new SBar.IntroRenderer(this);
			
			if (this.first_intro) {
				this.SetupIntro();
			} else if (this.discover_wmd) {
				this.SetupDiscoverWmd();
			} else if (this.get_wmd) {
				this.SetupGetWmd();
			} else if (this.spacebar1) {
				this.SetupFinalSpacebar();
			}
			this.renderer.AddIcon(new SBar.IntroIconGrass(this.crewctx));

			//this.pan_text = ["asdf"];
			if (this.do_pan) {
				this.BeginPan();
			} else {
				this.StartMain();
			}
			//this.ms_start = 10000;
			//this.StartMain();
    },
		// Player gets abducted.
		SetupIntro: function() {
			this.pan_text = [
        "A short time ago",
        "on a planet near,",
        "near to here...",
        "",
        "Well, actually...",
        "It was here...",
        "",
        "(Bum. Bum. Bum...)",
        "",
        "Chapter 0:",
				"The First Chapter",
        "",
        "You find yourself",
        "in a cornfield.",
        "Next to your friend.",
        "Possibly drunk.",
        "Or so you thought...",
      ];

			/*
			this.pan_text = [
        "A short, short time ago",
        "on a planet near,",
        "near to here...",
        "",
        "Well, actually...",
        "It was here...",
        "",
        "(Bum. Bum. Bum...)",
        "",
        "NOTHING!",
        "",
        "Chapter 0:",
				"The First Chapter",
        "",
        "As it turns out you live",
        "in a podunk town in the",
        "middle of nowhere...",
        "",
        "With no career, no",
        "prospects, and worse,",
        "no good games, you got",
        "drunk. And some bet",
			  "about a cornfield.",
        "",
        "Or so you thought..."
      ];
			*/
			this.renderer.AddIcon(new SBar.IntroIconTree(this.crewctx));
			
			// Note this is copied below (currently).
			let friend = new SBar.IntroIconCrew(this.crewctx, {is_alpha: true})
			let hero = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0]})
			friend.AddPosition(SF.WIDTH*0.6, char_height, 0);
			
			let start = 0;
			hero.AddPosition(SF.WIDTH*0.4, char_height, 0);
			friend.AddSpeech("Hey it worked.", 1+start, 1500)
			hero.AddSpeech("What worked?", 2000+start, 1500)
			hero.AddSpeech("Is that a UFO?", 8000+start, 1500)
			friend.AddSpeech("Yeah", 10000+start, 800)
			friend.AddSpeech("Barely...", 10800+start, 700)
			hero.AddTeleport(11000+start, 3000, SF.WIDTH*0.3, SF.HEIGHT*0.3);  // Topx, y of the tele target.
			friend.AddSpeech("Hey!", 12000+start, 1000)
			friend.AddSpeech("Hey get back here!", 13000+start, 1500)
			this.renderer.AddIcon(friend);
			this.renderer.AddIcon(hero);

			let wmd = new SBar.IntroIconWmd(this.crewctx);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-200, 0);
			this.renderer.AddIcon(wmd);
						
			let ship = new SBar.IntroIconShip(this.crewctx, S$.ship);
			ship.AddPosition(SF.WIDTH*0.4, 0, 0, 0+start);
			ship.AddPosition(SF.WIDTH*0.4, 0, 0, 3000+start);
			ship.AddPosition(SF.WIDTH*0.3, SF.HEIGHT*0.3, 1, 10000+start);
			ship.AddPosition(SF.WIDTH*0.3, SF.HEIGHT*0.3, 1, 14000+start);
			ship.AddPosition(SF.WIDTH*0.6, -SF.HEIGHT*0.3, 0, 15000+start);			
			this.renderer.AddIcon(ship);
			this.end_time = 16000;
		},
		// Player discovers the location of the WMD and witnesses the abduction.
		SetupDiscoverWmd: function() {
			this.pan_text = [
				"Chapter 5:",
				"Perspective",
			];
			
			let tree = new SBar.IntroIconTree(this.crewctx);
			// Place the chars on the side opposite the tree.
			let xoff = tree.x < SF.HALF_WIDTH ? SF.HALF_WIDTH*0.8 : 0;
			let hero_icon = null;
			let crew_icons = [];
			for (let i = S$.crew.length-1; i >= 0; i--) {
				let crew = S$.crew[i];
				let icon = new SBar.IntroIconCrew(this.crewctx, {crew: crew});
				if (i === 0) {
					hero_icon = icon;
				}
				crew_icons.push(icon);
				let start_x = SU.r(32.1, 32.2+i)*SF.HALF_WIDTH*0.8+SF.HALF_WIDTH*0.2+xoff;
				icon.AddPosition(start_x, char_height, 0);
				icon.MoveTo(start_x, char_height, tree.x, char_height, 1000, 5000+Math.round(SU.r(1.23, i)*500));
				this.renderer.AddIcon(icon);
			}
			this.renderer.AddIcon(tree);
			hero_icon.AddSpeech("Shhh... someone's coming. Lets hide.", 100, 1500)
			
			// Move in the others.

			let friend = new SBar.IntroIconCrew(this.crewctx, {is_alpha: true})
			let imaginary = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0], imaginary: true})
			xoff = SU.r(1.51, 5.25) < 0.5 ? SF.WIDTH*1.2 : SF.WIDTH*-0.4;
			friend.AddPosition(xoff+SF.WIDTH*0.2, char_height, 0);
			imaginary.AddPosition(xoff, char_height, 0);
			friend.MoveTo(xoff+SF.WIDTH*0.2, char_height, SF.WIDTH*0.6, char_height, 7000, 12000+Math.round(SU.r(1.23, 1.3)*500));
			imaginary.MoveTo(xoff, char_height, SF.WIDTH*0.4, char_height, 7000, 12000+Math.round(SU.r(1.23, 1.4)*500));
			this.renderer.AddIcon(friend);
			this.renderer.AddIcon(imaginary);
			
			let wmd = new SBar.IntroIconWmd(this.crewctx);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-120, 0);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-120, 15000);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-200, 16000);
			this.renderer.AddIcon(wmd);

			friend.AddSpeech("Look at this.", 16000, 1000)
			imaginary.AddSpeech("What is it?", 17000, 1000)
			friend.AddSpeech("Some sort of alien device.", 18000, 1100)
			imaginary.AddSpeech("What does it do?", 19100, 900)
			friend.AddSpeech("Hmmm lets see.", 20000, 1000)

			let ship = new SBar.IntroIconShip(this.crewctx, S$.GetStartingShip());
			this.renderer.AddIcon(ship);
			ship.AddPosition(SF.WIDTH*0.6, SF.HEIGHT*0.3, 1, 0);
			ship.SetHideUntil(22000);

			friend.AddSpeech("Ooooo...", 22500, 3000)
			imaginary.AddSpeech("Ooooo...", 22500, 3000)

			ship.AddPosition(SF.WIDTH*0.5, SF.HEIGHT*0.3, 1, 24000);
			ship.AddPosition(SF.WIDTH*0.6, -SF.HEIGHT*0.3, 0, 30000);
			imaginary.AddSpeech("Hey do you think it can make me real?", 26000, 2000)
			friend.AddSpeech("Why? You're my imaginary friend.", 28000, 1500)
			imaginary.AddSpeech("Just for a minute. To see what it's like.", 30000, 1500)
			friend.AddSpeech("Fine. Then I'm changing you back.", 32000, 1500)
			imaginary.imaginary_time = 35000;
			
			let start = 36000;
			// Copied from above.
			friend.AddSpeech("Hey it worked.", 1+start, 1500)
			imaginary.AddSpeech("What worked?", 2000+start, 1500)
			imaginary.AddSpeech("Is that a UFO?", 8000+start, 1500)
			friend.AddSpeech("Yeah", 10000+start, 800)
			friend.AddSpeech("Barely...", 10800+start, 700)
			imaginary.AddTeleport(11000+start, 3000, SF.WIDTH*0.3, SF.HEIGHT*0.3);  // Topx, y of the tele target.
			friend.AddSpeech("Hey!", 12000+start, 1000)
			friend.AddSpeech("Get back here!", 13000+start, 1500)
			
			ship.AddPosition(SF.WIDTH*0.4, 0, 0, 0+start);
			ship.AddPosition(SF.WIDTH*0.4, 0, 0, 3000+start);
			ship.AddPosition(SF.WIDTH*0.3, SF.HEIGHT*0.3, 1, 10000+start);
			ship.AddPosition(SF.WIDTH*0.3, SF.HEIGHT*0.3, 1, 14000+start);
			ship.AddPosition(SF.WIDTH*0.6, -SF.HEIGHT*0.3, 0, 15000+start);			

			friend.AddSpeech("Crap...", 15000+start, 1500)
			//friend.MoveTo(SF.WIDTH*0.6, char_height, SF.WIDTH-tree.x, char_height, 17000+start, 22000+start);
			this.end_time = 17000+start;
		},
		
		// Player gets the WMD.
		SetupGetWmd: function() {
			S$.times_traveled_back_to_gathering++;
			let num_prior_heroes = S$.times_traveled_back_to_gathering-1;
			this.pan_text = [
				"Chapter 5."+(num_prior_heroes+1)+":",
				"This looks familiar...",
			];		
			//num_prior_heroes = 1;

			let tree = new SBar.IntroIconTree(this.crewctx);
			let hidden_char = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0]});
			hidden_char.AddPosition(tree.x, char_height, 0);
			this.renderer.AddIcon(hidden_char);
			this.renderer.AddIcon(tree);

			// Put all the other crew re-visiting behind other icons.
			for (let i = 0; i < num_prior_heroes; i++) {
				let new_hero = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0]});
				this.renderer.AddIcon(new_hero);
				
				let x1 = SF.WIDTH*1.2+SF.WIDTH*SU.r(42.2, 1.13+i)*0.3;
				let x2 = SF.WIDTH*0.6+SF.WIDTH*SU.r(42.3, 1.12+i)*0.3;
				let x3 = SF.WIDTH*0.6+SU.r(42.4, 1.15+i)*4*2;  // Standing over the others.
				let x4 = SF.WIDTH*0.6+SF.WIDTH*SU.r(42.4, 1.14+i)*0.3;
				if (SU.r(42.1, 1.11+i) < 0.5) {
					x1 = SF.WIDTH - x1;
					x2 = SF.WIDTH - x2;
					x4 = SF.WIDTH - x4;
				}
				new_hero.AddPosition(x1, char_height, 0);
				new_hero.MoveTo(x1, char_height, x3, char_height, 9001+SU.r(42.2, 1.12+i)*1000, 11000+Math.round(SU.r(1.38, 1+i)*500));
				new_hero.MoveTo(x3, char_height, x4, char_height, 11500+SU.r(42.2, 1.12+i)*500, 12500+Math.round(SU.r(1.38, 1+i)*500));
				new_hero.AddSpeech("Hey!", 13000, 1000);
			}
			let hero_icon = null;
			let crew_icons = [];
			// Skip drawing the other crew on re-visits.
			let max_crew_num = num_prior_heroes > 0 ? 0 : S$.crew.length-1;
			for (let i = max_crew_num; i >= 0; i--) {
				let crew = S$.crew[i];
				let icon = new SBar.IntroIconCrew(this.crewctx, {crew: crew});
				if (i === 0) {
					hero_icon = icon;
				}
				crew_icons.push(icon);
				//let start_x = SU.r(32.1, 32.2+i)*SF.HALF_WIDTH*0.8+SF.HALF_WIDTH*0.2+xoff;
				let start_x = SF.WIDTH+SU.r(32.1, 32.2+i)*SF.HALF_WIDTH*0.3+SF.HALF_WIDTH*0.2;
				icon.AddPosition(start_x, char_height, 0);
				let offx = i === 0 ? 0 : SU.r(32.1, 32.3+i)*SF.WIDTH*0.3;
				icon.MoveTo(start_x, char_height, SF.WIDTH*0.6-offx, char_height, 0, 5000+Math.round(SU.r(1.28, i)*500));
				this.renderer.AddIcon(icon);
			}

			let wmd = new SBar.IntroIconWmd(this.crewctx);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-120, 0);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-120, 7000);
			wmd.AddPosition(SF.WIDTH*0.56, SF.HEIGHT-200, 8000);
			this.renderer.AddIcon(wmd);

			hero_icon.AddSpeech("Found it", 8000, 1000)

			hero_icon.AddSpeech("Mine. All mine.", 14500, 1000)

			let friend = new SBar.IntroIconCrew(this.crewctx, {is_alpha: true})
			this.renderer.AddIcon(friend);
			friend.AddPosition(SF.WIDTH*1.2, char_height, 0);
			let x1 = SF.WIDTH*1.2;
			let x2 = SF.WIDTH*0.8;
			let x3 = SF.WIDTH*1.3;
			friend.MoveTo(x1, char_height, x2, char_height, 9001, 16000+Math.round(SU.r(1.38, 1)*1000));
			friend.AddSpeech("What the!", 17000, 1000)
			friend.MoveTo(x2, char_height, x3, char_height, 17500, 18500+Math.round(SU.r(1.48, 2)*500));

			if (num_prior_heroes > 0) {
				let fight_effect = new SBar.IntroIconFight(this.crewctx, SF.WIDTH*0.6, char_height, 11500);
				this.renderer.AddIcon(fight_effect);
			}
			
			this.end_time = 19000;
			S$.got_wmd_in_past = true;
		},
		
		SetupFinalSpacebar: function() {
			S$.game_stats.won_game = true;
			this.pan_text = [
				"Epilogue:",
				"A place",
				"to call your own.",
			];
			let bar = new SBar.IntroIconBar(this.crewctx, SF.WIDTH*0.04, char_height, this.building_data.name);
			let friend = new SBar.IntroIconCrew(this.crewctx, {is_alpha: true});
			let imaginary = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0], is_imaginary: true, fade_out_time: 17000})
			let hero = new SBar.IntroIconCrew(this.crewctx, {crew: S$.crew[0]});
			this.renderer.AddIcon(bar);
			this.renderer.AddIcon(friend);
			this.renderer.AddIcon(imaginary);
			this.renderer.AddIcon(hero);
			hero.AddPosition(SF.WIDTH*0.3, char_height, 0);
			friend.AddPosition(SF.WIDTH*1.2, char_height, 0);
			imaginary.AddPosition(SF.WIDTH*1.4, char_height, 0);
			friend.MoveTo(SF.WIDTH*1.2, char_height, SF.WIDTH*0.6, char_height, 2000, 6000+Math.round(SU.r(1.23, 2.1)*500));
			imaginary.MoveTo(SF.WIDTH*1.4, char_height, SF.WIDTH*0.7, char_height, 2000, 6000+Math.round(SU.r(1.24, 2.2)*500));

			hero.AddSpeech("Hey.", 6000, 1500)
			friend.AddSpeech("Hey.", 9000, 1000)
			imaginary.AddSpeech("Hey.", 10100, 700)
			hero.AddSpeech("You're probably wondering who I am", 13000, 1500)
			friend.AddSpeech("Not really...", 16000, 700)
			friend.AddSpeech("You look like a good friend", 17000, 1500)
			hero.AddSpeech("Well...", 20000, 1000)
			hero.AddSpeech("Grab a drink?", 22000, 1500)
			friend.AddSpeech("Grab a drink?", 22000, 1500)
			this.end_time = 24000;
		},
		
		BeginPan: function() {
			this.renderer.SpacePan(this.pan_text);
			this.handleSpacePanUpdate();
		},
		handleSpacePanUpdate: function() {
			if (this.done_with_space_pan) {
				this.StartMain();
				return;
			}
			this.renderer.updateSpacePan(this.frame_ms);
			
			//this.ms += this.frame_ms;
      this.timeout = window.setTimeout(this.handleSpacePanUpdate.bind(this), this.frame_ms);
		},
		handleCutsceneUpdate: function() {
			this.renderer.updateCutscene(this.ms);
			if (this.ms > this.end_time) {
				if (this.spacebar1) {
					this.renderer.pan_y = SF.HEIGHT;
					this.SpaceBarEnding();
				} else {
					this.exit();
				}
				return;
			}
			this.ms += this.frame_ms;
      this.timeout = window.setTimeout(this.handleCutsceneUpdate.bind(this), this.frame_ms);
		},
		StartMain: function() {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
			this.ms = this.ms_start;
			this.renderer.updateCutscene(this.ms);
			this.ms += this.frame_ms;
      this.timeout = window.setTimeout(this.handleCutsceneUpdate.bind(this), this.frame_ms);
		},
		SpaceBarEnding: function() {
			if (this.done_with_pan_up) {
				this.teardown();
	      SU.PushTier(new SBar.GameSummaryRenderer());
				return;
			}
			this.ms += this.frame_ms;
			this.renderer.panup(this.frame_ms, this.end_time);
      this.timeout = window.setTimeout(this.SpaceBarEnding.bind(this), this.frame_ms);
		},
    exit: function() {
			//this.teardown();
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
      //this.teardown();
			
			if (this.first_intro) {
				SU.sendHome(this.teardown.bind(this));
			} else if (this.discover_wmd) {
				let battle_function = function() {
					this.teardown();
					this.ToBattle();
				}
	      SU.fadeOutIn(battle_function.bind(this));
			} else if (this.get_wmd) {
				let arti_function = function() {
					this.teardown();
					if (this.callback) {
						this.callback();
					}
		      SU.PushTier(new SBar.ArtifactFindRenderer(this.GetWmdArtifactData(), this.building_data));
				}
	      SU.fadeOutIn(arti_function.bind(this));
			} else {
				error("nointroexit")
			}
    },
		
		GetWmdArtifactData: function() {
			return SBar.ArtifactData(/*seed=*/1, /*raceseed=*/1, /*level=*/1, SF.SKILL_TRUE_OMEGA);
		},
		
		// Fight the friend in the past.
		ToBattle: function() {
			let planet_data = this.building_data.parentData;
			planet_data.ResetSurfaceCache();
			let params = {};
			params["description"] = "Your friend notices you moving behind the tree.\n\n\"Oh hey, you're back. Are you ready to die yet?\"";
			params["reward"] = {artifact: this.GetWmdArtifactData()};
			SG.death_message = "Killed by your friend at the beginning of it all.";
			SU.PushBattleTier(new SBar.BattleBuilder(SF.BATTLE_CORNFIELD, this.building_data, /*attacking=*/true, this.BattleCallback.bind(this), params));
		},
		
		BattleCallback: function(encounter_data) {
			this.teardown();
			if (this.callback) {
				this.callback();
			}
		},
		
    teardown: function() {
			if (this.renderer) {
				this.renderer.teardown();
			}
    },
		
	  handleKey: function(key, key_held_down) {
	    switch (key) {
				// TODO: shift, control to move further.
	      case SBar.Key.X:
	          this.exit();
	          break;
	      default:
	          error("unrecognized key pressed in starmap: " + key);
	      }
	  },
  };
})();





 
