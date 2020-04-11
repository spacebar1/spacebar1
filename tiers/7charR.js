/*
 * Character Renderer object, the general game sheet.
 */
(function() {
  var size = 100;
	var message_lines = 25;
	
	SHOW_BASE = 3;
	SHOW_LOG = 0;
	SHOW_QUESTS = 1;
	SELECTED_QUEST = 8;
	//SHOW_HERO_DROP = 2;
	SHOW_NOTES = 4;
	SHOW_ADD_NOTE = 5;
	SHOW_CAPTAINS_LOG = 6;
	//SHOW_CARGO = 7;
	SHOW_HUD_MESSAGES = 7;
	
	let ship_y = 580; // 420
	let tow_ship_y = 680;

  SBar.CharacterRenderer = function() {
    this._initCharacterRenderer();
  };

  SBar.CharacterRenderer.prototype = {
    type: SF.TIER_CHARR,
    priorActive: null, // Used to get the quest indicator.
    back_context: null,
    context: null,
    questDist: null,
    buttRight: null, // pointer for other right drawing to clear
    buttRight2: null, // pointer for other right drawing to clear
    buttMore: null, // scroll the messages right
    buttLess: null, // scroll the messages left
    rot: 0,
		intialized: false, // Delayed init.
		showing: null, // What's showing, like SHOW_LOG.
		showing_num: null, // Optional index for what's showing.
		text_layout: null,
		seed: null,
		
    _initCharacterRenderer: function() {
			// Delayed init.
    },
    activate: function() {	
			this.seed = S$.game_seed;
			this.initialized = true;
      this.back_context = SC.layer1;
      this.context = SC.layer2;
      this.textimg = document.createElement('canvas');
      this.textimg.width = SF.WIDTH;
      this.textimg.height = SF.HEIGHT;
      this.tcontext = this.textimg.getContext('2d');
			SU.CopyCrewBattleStats(/*add_health=*/false);
			this.text_layout = new SBar.TextLayout(this.tcontext);			

			if (!this.priorActive) {
	      this.priorActive = SG.activeTier;
			} else if (this.priorActive.timeout) {
				// Don't want the planet to keep spinning.
				clearTimeout(this.priorActive.timeout);
			}
      SG.activeTier = this;
			
      this.questDist = [];
			this.ShowBase();
    },
		CheckForRefresh: function() {
			// Coming back in from an artifact renderer. Refresh the character levels.
			this.activate();
		},
		DrawBackground: function() {
			this.back_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			// Background.
			let size = 15;
      let r = Math.floor(SU.r(this.seed, 42.5) * 30)+20;
      let g = Math.floor(SU.r(this.seed, 42.6) * 30)+20;
      let b = Math.floor(SU.r(this.seed, 42.7) * 30)+20;
			let fill_pattern = SU.GetFillPattern(size, this.seed, r, g, b, 40);
      this.back_context.drawImage(fill_pattern, 0, 0, size, size, 0, 0, SF.WIDTH, SF.HEIGHT);
			let colorStops = [0, 'rgba(0,0,0,1)', 1, 'rgba(0,0,0,0.0)'];
			SU.rectGrad(this.back_context, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, SF.HEIGHT, colorStops);
		},

		ShowBase: function() {
			this.showing = SHOW_BASE;

			this.DrawBackground();
			SU.DrawTopBanner(this.context, SU.CharTitleString());
			new SBar.IconCharDetails(S$.crew[0], this.context, 100);
			for (let i = 1; i < S$.crew.length; i++) {
				new SBar.IconCharDetails(S$.crew[i], this.context, 200+i*100);
			}
			if (S$.crew.length > 6) {
				// They won't all fit on the screen. Good luck to the player managing this crew!
	      SU.text(this.context, "+"+(S$.crew.length-6), SF.HALF_WIDTH-80, SF.HEIGHT-31, '40pt '+SF.FONT, "#FFF");
			}
			new SBar.IconCharDetails(S$.ship, this.context, ship_y);
			if (S$.tow_ship) {
				new SBar.IconCharDetails(S$.tow_ship, this.context, tow_ship_y);
			}
			
			
			let y = 115;
			new SBar.IconFragmentText(this.context, y);
			y += 195;
			this.DrawOfficers(y);
			y += 165;
			let spacing = 26;
      SU.text(this.context, "Bar Date "+SU.TimeString(S$.time), SF.HALF_WIDTH+50, y, SF.FONT_L, '#FFF');
			//if (S$.quests.length > 0) {
				y += spacing;
	      SU.text(this.context, "Quests: "+S$.quests.length, SF.HALF_WIDTH+50, y, SF.FONT_L, '#FFF');
				//}
			//if (S$.battle_effect) {
				y += spacing;
				let medical_status = "Unequipped";
				if (SU.HasHealingCrew()) {
					if (S$.in_alpha_space) {
						medical_status = "Nonfunctional";
					} else {
						medical_status = "Equipped";
					}
				}
	      SU.text(this.context, "Medical Bay: "+medical_status, SF.HALF_WIDTH+50, y, SF.FONT_L, '#FFF');
				y += spacing;
				let battle_effect_text = S$.battle_effect ? S$.battle_effect.name+": "+new SBar.PersistEffect(S$.battle_effect).Text() : "";
	      SU.text(this.context, battle_effect_text, SF.HALF_WIDTH+50, y, SF.FONT_L, '#FFF');
				//}
			//if (S$.NumDrinks() > 0) {
				y += spacing;
				let text = new JTact.SpeedEffect(name, 1-S$.NumDrinks()/15, TF.FOREVER).getText();
				text = S$.NumDrinks() > 0 ? "Inebriated: "+text : "";
	      SU.text(this.context, text, SF.HALF_WIDTH+50, y, SF.FONT_L, '#FFF');
				//}
			//y += spacing;
			//new SBar.IconFragmentText(this.context, y);
			
      for (var i = 0; i < S$.quests.length; i++) {
        this.addQuest(i);
      }
      this.handleUpdate();
		},
		DrawOfficers: function(y) {
      SU.text(this.context, "Ship Roles", SF.HALF_WIDTH+50, y, SF.FONT_LB, '#FFF');
			y += 26;
			for (let i = 0; i < SF.NUM_STATS; i++) {
				let text = SF.STAT_OFFICER_TITLE[i]+" "+S$.officer_names[i];
				let text_right = " "+S$.officer_stats[i]+" "+SF.STAT_NAME[i];
	      SU.text(this.context, text_right, SF.HALF_WIDTH+120, y, SF.FONT_M, SF.STAT_TEXT_COLOR, 'right');
	      SU.text(this.context, text, SF.HALF_WIDTH+135, y, SF.FONT_M, '#FFF', 'left');
				/*
				let text = SF.STAT_OFFICER_TITLE[i]+" ("+SF.STAT_NAME[i]+"):"
				let text_right = S$.officer_names[i]+" ("+S$.officer_stats[i]+")";
	      SU.text(this.context, text, SF.HALF_WIDTH+70, y, SF.FONT_M, '#FFF', 'left');
	      SU.text(this.context, text_right, SF.WIDTH-70, y, SF.FONT_M, '#F8F', 'right');
				*/
				y += 26;
			}
		},
		UpdateHotkeys: function() {
			var crew_range = "";
			if (S$.crew.length > 1) {
				crew_range = "-"+S$.crew.length;
			}

			SU.clearTextNoChar();
			if (this.showing === SHOW_ADD_NOTE) {
				SU.addText("[Type Note]");
				SU.addText("ENTER: End");
				return;
			}
			if (this.showing === SHOW_CAPTAINS_LOG) {
	      if (this.showing_num - message_lines > 0) { // scroll left
					SU.addText("LEFT: Previous");
	      }
	      if (this.showing_num < S$.messageLog.length+1) { // scroll right
					SU.addText("RIGHT: Next");
	      }
				SU.addText("X: Back");
				return;
			}
			if (this.showing === SHOW_NOTES) {
	      if (this.showing_num > 0) { // scroll left
					SU.addText("LEFT: Previous");
	      }
	      if (this.showing_num + message_lines < S$.messageLog.length) { // scroll right
					SU.addText("RIGHT: Next");
	      }
				SU.addText("A: Add Entry");
				if (S$.notesLog.length > 0) {
					var notes_range = "";
					if (S$.notesLog.length > 1) {
						notes_range = "-"+SF.SYMBOL_SHIFT+S$.notesLog.length;
					}
					SU.addText(SF.SYMBOL_SHIFT+"1"+notes_range+": Delete Entry");
				}
				SU.addText("X: Back");
				return;
			}
			// Quests.
			if (this.showing === SELECTED_QUEST) {
				SU.addText("D: Drop Quest");
				SU.addText("X: Back");
				return;
			} else if (this.showing == SHOW_QUESTS) {
				if (S$.quests.length > 0) {
					var quest_range = "";
					if (S$.quests.length > 1) {
						quest_range = "-"+S$.quests.length;
					}
					SU.addText("1"+quest_range+": Quest Select");
				}
				SU.addText("X: Back");
				return;
			}
			if (this.showing === SHOW_HUD_MESSAGES) {
				SU.addText("X: Back");
				return;
			}
			// Base keys.
			SU.addText("1"+crew_range+": Crew Member");
			SU.addText("S: Ship");
			SU.addText("C: Cargo");
			
			SU.addText("Q: Quests");
			SU.addText("L: Captain's Log");
			SU.addText("M: HUD Messages");
			SU.addText("N: Custom Notes");
//			SU.addText("O: Save State");
			if (S$.tow_ship) {
				SU.addText("T: Swap Towed Ship");
			}
			SU.addText("P: Party Battle");
			SU.addText("B: Building Search");
			SU.addText("X: Exit");
		},
    addQuest: function(index) {
			var me = this;

      var quest = S$.quests[index];
      var tier = this.priorActive;
      var tierType = tier.type;
      var data = tier.data; // undefined for space and starmap
      var x = 0;
      var y = 0;
      if (tierType) {
        switch (tierType) {
          case SF.TIER_TEMPLE:
          case SF.TIER_BUILDING:
            x = data.parentData.x;
            y = data.parentData.y;
            break;
          case SF.TIER_PLANET:
          case SF.TIER_PBELT:
            x = data.x;
            y = data.y;
            break;
          case SF.TIER_SYSTEM:
            x = data.x; // tier?
            y = data.y; // tier?
            break;
          case SF.TIER_SPACE:
            x = tier.x;
            y = tier.y;
            break;
          case SF.TIER_STARMAP:
            x = tier.shipx;
            y = tier.shipy;
            break;
          case SF.TIER_TEST:
            // no-op
            break;
          default:
            error("no xy for tier " + tierType);
            break;

        }
      } else {
        error("no tier for tierType2 " + tierType);
      }
      var dx = x - quest.x;
      var dy = y - quest.y;
      var distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
      this.questDist.push(distance);

      var selected = S$.selectedQuest === index;
      var name = quest.n;
      //if (name !== "Finding Your Friend") {
        name = name.substring(4); // strip off 'The '
				//}
      if (name.length > 28) {
        var lastspace = name.lastIndexOf(" ");
        name = name.substring(0, lastspace) + "...";
      }
    },
    ShowCaptainsLog: function(start, offset) {
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.tcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			
      if (start !== undefined && start !== null) {
				this.showing_num = start;
      } else if (offset !== undefined) {
				this.showing_num += offset;
      }
			start = this.showing_num;
			this.showing = SHOW_CAPTAINS_LOG;			
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft("", /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "Captain's Log", "📖");
			

      for (var i = start-1; i >= start - message_lines; i--) {
        var msg = S$.messageLog[i];
        if (msg !== undefined) {
					//this.text_layout.AddWrapText("Day "+Math.floor(msg[0]/24)+" "+msg[0]%24+":00: " + msg[1]);
					//this.text_layout.AddWrapText(SU.TimeString(msg[0])+": " + msg[1]);
		      //SU.text(this.tcontext, SU.TimeString(msg[0])+": " + msg[1], 100, 140+i*20, SF.FONT_M, '#AAA');
					this.text_layout.TextLine((i+1)+". "+SU.TimeString(msg[0])+": " + msg[1]);
        }
      }
			this.handleUpdate();
    },
		ShowHudMessages: function() {
      this.tcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			this.showing = SHOW_HUD_MESSAGES;
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft("", /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "Latest HUD Messages", "💬");
			for (let i = S$.hudMessages.length-1; i >=0; i--) {
				let msg = S$.hudMessages[i];
				this.text_layout.TextLine((i+1)+". "+SU.TimeString(msg[0])+": " + msg[1]);
//				this.text_layout.AddValue(S$.hudMessages[i]);
			}
			this.handleUpdate();
		},
    ShowNotes: function(start, offset) {
      if (start !== undefined && start !== null) {
				this.showing_num = start;
      } else if (offset !== undefined) {
				this.showing_num += offset;      	
      }
			start = this.showing_num;
			this.showing = SHOW_NOTES;
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft("", /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "Captain's Notes", "📓");

      for (var i = start-1; i >= start - message_lines; i--) {
        var msg = S$.notesLog[i];
        if (msg !== undefined) {
					this.text_layout.TextLine((i+1)+". "+msg);
        }
      }
			this.handleUpdate();
    },
		AddNote: function() {
			this.showing = SHOW_ADD_NOTE;
			this.new_note = "";
			if (SG.starmap) {
				this.new_note += Math.floor(SG.starmap.x)+","+Math.floor(-SG.starmap.y)+" ";
			}
			if (this.priorActive && this.priorActive.data && this.priorActive.data.name) {
				this.new_note += this.priorActive.data.name + ": ";
			}
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft("", /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "New Note", "📓");
			this.text_layout.AddValue(this.new_note);
			this.handleUpdate();
		},
		AddNoteChar: function(key, actual_key) {
			if (key === SBar.Key.BACKSPACE) {
				if (this.new_note.length > 0) {
					this.new_note = this.new_note.substring(0, this.new_note.length - 1);					
				}
			} else {
				this.new_note += actual_key;
			}
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft("", /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "New Note", "📓");
			this.text_layout.AddValue(this.new_note);
			this.handleUpdate();
		},
		FinishAddNote: function() {
			//this.showing = SHOW_NOTES;
			S$.notesLog.push(this.new_note);
			this.ShowNotes(S$.notesLog.length);
		},
		DeleteNote: function(num) {
			S$.notesLog.splice(num, 1);
			this.ShowNotes(S$.notesLog.length);
		},
		SelectQuest(index) {
			if (index >= S$.quests.length) {
				return;
			}
			this.showing_num = index;
			this.UpdateHotkeys();
			S$.selectQuest(index);
			this.ShowQuest(index);
		},
    ShowQuest: function(num) {
			if (num === -1) {
				this.showing = SHOW_QUESTS;
	      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
	      this.text_layout.prepLeft("Quests", /*clear=*/true);
				SU.DrawTopBanner(this.tcontext, "Quest Select", "❓");
				for (var i = 0; i < S$.quests.length; i++) {
					var quest = S$.quests[i];
		      this.text_layout.AddValue((i+1)+": "+quest.n);
				}
				this.UpdateHotkeys();
				this.handleUpdate();
				return;
			}
			this.showing = SELECTED_QUEST;
      var qdata = S$.getQuestObj(S$.quests[num]);
      var parent = qdata.target.parentData;
      this.text_layout.prepRight("", /*clear=*/true);  // Just for the clear.
      this.text_layout.prepLeft(qdata.name, /*clear=*/true);
			SU.DrawTopBanner(this.tcontext, "Quest Select", "❓");

      this.text_layout.AddValue("System", parent.systemData.name);
      this.text_layout.AddValue("Coordinates", coordToParsec(qdata.x) + ", " + coordToParsec(-qdata.y) + " pc");
      this.text_layout.AddValue("Danger", parent.systemData.level);
      var planet = (parent.type === SF.TYPE_PLANET_DATA);
      if (planet) {
        this.text_layout.AddValue("Planet", parent.name);
        var danger = "";
        if (parent.danger < 0.2)
          danger = "Low";
        else if (parent.danger < 0.4) {
          danger = "Medium";
        } else {
          danger = "High";
        }
        this.text_layout.AddValue("Planet danger", danger);
      } else {
        this.text_layout.AddValue("Belt", parent.name);
      }
      this.text_layout.AddValue("Building", qdata.target.name[0] + " " + qdata.target.name[1]);
      //this.text_layout.AddValue("Distance", Math.floor(this.questDist[num] / 100) / 10 + " k");
			this.text_layout.AddValue("Distance", coordToParsec(this.questDist[num]) + " pc");
			
      // duplicated on questR
      this.text_layout.AddValue("");
			if (qdata.money_run) {
				this.text_layout.AddValue("Reward: "+SF.SYMBOL_CREDITS+qdata.getMoneyReward())
			} else {
        var arti = qdata.getArtiReward();
				let skill = new SBar.Skill(arti);
				this.text_layout.AddValue("Reward");
				this.text_layout.AddValue(skill.name);
				this.text_layout.AddValue(skill.SummaryText());
			}
      var context = this.tcontext;
      context.font = SF.FONT_LB;
      context.fillStyle = '#FFF';
      context.textAlign = 'right';

			this.UpdateHotkeys();
			this.handleUpdate();
    },
    handleUpdate: function() {
			this.UpdateHotkeys();
			if (this.showing === SHOW_BASE) {
				return;
			}
			this.DrawBackground();
      this.context.drawImage(this.textimg, 0, 0);
    },
		SwapTowed: function() {
			if (S$.tow_ship) {
				var temp = S$.tow_ship;
				S$.tow_ship = S$.ship;
				S$.ship = temp;
				SU.message("Ships swapped");
				this.redraw();
			}
		},
		PartyBattleCallback: function(encounter_data) {
			this.activate();  // Refresh details.
		},
		PartyBattle: function() {
			if (SG.in_battle) {
				SU.message("Already in battle");
				return;
			}
			S$.game_stats.party_battles++;
			SE.PartyBattle(this.PartyBattleCallback.bind(this))
		},
		BuildingSearch: function() {
			SU.PushTier(new SBar.BuildingFindRenderer(this.context));
		},
    handleKey: function(key, not_used, actual_key) {
			switch (this.showing) {
				case SHOW_ADD_NOTE:
					// Special key input.
					if (key === SBar.Key.ESC || key === SBar.Key.ENTER) {
						this.FinishAddNote();
					} else {
						this.AddNoteChar(key, actual_key);
					}				
					return;
				case SELECTED_QUEST:
					if (key === SBar.Key.D) {
	          S$.dropQuest(this.showing_num);
	          this.redraw();
					}
					if (key === SBar.Key.X) {
						this.ShowQuest(-1);
					}
					return;
				case SHOW_QUESTS:
					if (key >= SBar.Key.NUM1 && key <= SBar.Key.NUM4) {
						this.SelectQuest(key - SBar.Key.NUM1);
					}
					if (key === SBar.Key.X) {
						this.ShowBase();
					}
					return;
				case SHOW_CAPTAINS_LOG:
					if (key === SBar.Key.LEFT) {
						this.ShowCaptainsLog(null, -message_lines);
					} else if (key === SBar.Key.RIGHT) {
						this.ShowCaptainsLog(null, message_lines);
					} else if (key === SBar.Key.X) {
						this.ShowBase();
					}
					return;
				case SHOW_NOTES:
					if (key >= SBar.Key.SHIFT1 && key <= SBar.Key.SHIFT9) {
						this.DeleteNote(key-SBar.Key.SHIFT1);
					} if (key === SBar.Key.LEFT) {
						this.ShowNotes(null, -message_lines);
					} else if (key === SBar.Key.RIGHT) {
						this.ShowNotes(null, message_lines);
					} else if (key === SBar.Key.A) {
						this.AddNote();
					} else if (key === SBar.Key.X) {
						this.ShowBase();
					}
					return;
				case SHOW_HUD_MESSAGES:
					if (key === SBar.Key.X) {
						this.ShowBase();
					}
					return;
				default:  // Base, continue.
			}
			if (key >= SBar.Key.NUM1 && key <= SBar.Key.NUM9) {
				this.ShowCharArtis(key - SBar.Key.NUM1);
				return;
			}
			switch (key) {
				case SBar.Key.L:
          this.ShowCaptainsLog(S$.messageLog.length);
					return;
				case SBar.Key.C:
          this.ShowCargoArtis();
					return;
				case SBar.Key.N:
					this.ShowNotes(S$.notesLog.length);
					return;
				case SBar.Key.S:
					this.ShowShipArtis();
					return;
//				case SBar.Key.O:
//					this.ShowOpts();
//					return;
				case SBar.Key.T:
					this.SwapTowed();
					return;
				case SBar.Key.Q:
					this.ShowQuest(-1);
					return;
				case SBar.Key.M:
          this.ShowHudMessages();
					return;
				case SBar.Key.X:
          this.teardown();
					return;
				case SBar.Key.P:
					this.PartyBattle();
					return;
				case SBar.Key.B:
					this.BuildingSearch();
					return;
				default:
          error("unrecognized key in 7charr: " + key);
					return;
			}		
    },
	  HandleClick: function(x, y) {
			if (this.showing !== SHOW_BASE) {
				return;
			}			
			x += SF.HALF_WIDTH;
			y += SF.HALF_HEIGHT;
			if (x < SF.HALF_WIDTH) {
				// Char.
				if (y < 100) {
					return;
				}
				if (y < 300) {
					this.ShowCharArtis(0);
					return;
				}
				this.ShowCharArtis(Math.floor((y-300)/100)+1);
				return;
			}
			// Ship.
			if (y >= ship_y && y < tow_ship_y) {
				this.ShowShipArtis();
			} else if (y >= tow_ship_y && y < tow_ship_y+100 && S$.tow_ship) {
				SU.PushTier(new SBar.ArtifactComplexRenderer(S$.tow_ship));
			}
	  },
		
    redraw: function() {
			SU.PopTier();
			SU.PushTier(this);
    },
    teardown: function() {
      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SU.PopTier();
    },
    ShowShipArtis: function() {
			SU.PushTier(new SBar.ArtifactComplexRenderer(S$.ship));
    },
    ShowCharArtis: function(char_index) {
			if (char_index >= S$.crew.length) {
				return;
			}
			SU.PushTier(new SBar.ArtifactComplexRenderer(S$.crew[char_index]));
    },
    ShowCargoArtis: function(char_index) {
			let renderer = new SBar.ArtifactComplexRenderer(S$.ship);
			renderer.is_cargo = true;
			SU.PushTier(renderer);
    },
    ShowOpts: function() {
			SU.PushTier(new SBar.OptionsRenderer());
    }
  };
})();

 
