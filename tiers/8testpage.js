(function() {
	
	let ranonce = false;

	SBar.TestPage = function() {
		this._initTestPage();
	};

	SBar.TestPage.prototype = {
		type: SF.TIER_TEST,
		_initTestPage: function() {},
		activate: function() {
			SF.ALLOW_NAVIGATE_AWAY = true;
			SF.EXIT_BATTLE_OPTION = true;
//			SF.FAST_TRAVEL = true;

			if (!ranonce) {
				log("running")
				ranonce = true;
				let name = ST.getWord(SU.r(9.1, 9.3), SU.r(9.1, 9.4));
				//name = "asdf"
	      S$ = new SBar.GameData(name);
			}
			if (1==2) {
				log("drawing background", S$.GetOrigBar().parentData.systemData)
				SU.PushTier(new SBar.TravelRenderer(S$.GetOrigBar().parentData.systemData));
				log("S#",S$.position.DebugString())
				return;
			}
			
			if (1==2) {
				log("drawing helm");
				let helm = new SBar.Helm();
				SU.PushTier(helm);
				helm.UpdateStandardInstruments();
				return;
			}
			


			//					return;
			/*
			SG.activeTier.teardown();
			let system = S$.GetOrigBar().parentData.systemData;
			
	    let belt = new SBar.BeltData(system, 1, 1, "test", 0, 0, false, false);//function(systemDataIn, distanceOutIn, angleIn, nameIn, numInRingIn, index, is_starport, is_party_yacht) {
				SC.textLayer.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			belt.DrawAlphaPartyYacht(SC.textLayer, SF.WIDTH, SF.HEIGHT);
			return;
			*/
				

			if (SG.activeTier !== null && SG.activeTier !== undefined && SG.activeTier !== this) {
				SG.activeTier.teardown();
			}
			SG.activeTier = this;
			// clear in case coming back in
			SC.layer1.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SC.layer3.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SU.text(SC.layer1, "Test Framework", 20, 30, SF.FONT_XL, "#F88");

			var y = 50;
			let x = 30;

			SB.add(x, y, SB.imgText("(1) Starmap", 14, 135), this.starmap.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(2) System", 14, 135), this.system.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(3) Planet", 14, 135), this.planet.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(4) Asteroid Belt", 14, 135), this.belt.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Starport", 14, 135), this.starport.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(5) (Obsolete)", 14, 135), this.planet.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(6) Home Bar", 14, 135), this.bar.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(7) Temple", 14, 135), this.temple.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(8) Random Shop", 14, 135), this.RandomShop.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(9) WMD Core", 14, 135), this.WmdCoreSystem.bind(this));
			
			y += 100;
			SB.add(x, y, SB.imgText("(B) Random Battle", 14, 135), this.RandomBattle.bind(this));
			y += 50;
//			SB.add(30, y, SB.imgText("Treasure", 14, 135), this.Treasure.bind(this));
//			y += 50;
//			SB.add(30, y, SB.imgText("Victory", 14, 135), this.Victory.bind(this));
//			y += 50;
			
			
			y = 50;
			x = 240;
			SB.add(x, y, SB.imgText("(!) Add Quest", 14, 135), this.addQuest.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Add Credits", 14, 135), this.addCredits.bind(this));
			y += 50;
			//SB.add(240, y, SB.imgText("(X) Max Stats", 14, 135), this.maxstats.bind(this));
			//y += 50;
			SB.add(x, y, SB.imgText("SetHardcore", 14, 135), this.SetHardcore.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(`) Randomize Seed", 14, 165), this.randomseed.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Stable Seed", 14, 135), this.stableseed.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("L20 Sensors", 14, 135), this.SetSensors.bind(this));

			// Artifacts.
			y += 100;
			SB.add(x, y, SB.imgText("(A) Add Artifact", 14, 135), this.addarti.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Ship Artifact", 14, 135), this.addshiparti.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Boost Artifact", 14, 135), this.addboostarti.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Stats Artifact", 14, 135), this.addstatsarti.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Add Cargo", 14, 135), this.AddCargo.bind(this));
			y += 50;

			y = 50;
			x = SF.HALF_WIDTH + 30;
			SB.add(x, y, SB.imgText("Start Page", 14, 135), this.startpage.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Intro", 14, 135), this.intro.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("IntroDiscWmd", 14, 135), this.introDiscoverWmd.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("IntroGetWmd", 14, 135), this.introGetWmd.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("IntroSpacebar1", 14, 135), this.introSpacebar1.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("IntroTerminal", 14, 135), this.introTerminal.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Go Pirate", 14, 135), this.pirate.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(C) Char Sheet", 14, 135), this.Ship.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(H) Add Hero", 14, 135), this.AddHero.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Add Towed Ship", 14, 135), this.AddShipInTow.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(X) Add XP", 14, 135), this.AddXp.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Morale Nopay", 14, 135), this.NoPay.bind(this));
			y += 50;
			
			y = 50;
			x = SF.WIDTH * 3/4;
			SB.add(x, y, SB.imgText("Go to Arth2", 14, 135), this.GoArth2.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Set Found WMD", 14, 135), this.SetFoundWmd.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Set Chapter 1", 14, 135), this.SetChapter1.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Set Chapter 3", 14, 135), this.SetChapter3.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Set Chapter 4", 14, 135), this.SetChapter4.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Set Time = -10", 14, 135), this.SetLowTime.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(T) Add Time", 14, 135), this.AddTime.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("Game Summary", 14, 135), this.GameSummary.bind(this));
			y += 50;
			SB.add(x, y, SB.imgText("(E) End Credits", 14, 135), this.EndCredits.bind(this));
			//this.pirate();
			//this.randomseed();

			// SB.clear();
			//let y = SF.HALF_HEIGHT-20;			

			
			

			/*
			this.type = SF.TYPE_MINING
			this.context = SC.layer1;
			var b = new SBar.IconBuilding(this, this);
			this.x = 0;
			this.y = 0;
			b.update(100,100)
			*/

			if (S$.crew.length === 1) {
				S$.AddCredits(5000);
				//S$.credits = 0;
				for (let i = 0; i < 1; i++) {
					this.AddSingleCrew();
				}
				//this.AddShipInTow();
			}
			//this.GameSummary();
			//S$.ship.ship_type = SF.SHIP_PIRATE;
			//this.asteroidBuilding();
			//this.addarti();
			//this.teardown();
		  //S$.battle_effect = {name: "test_effect", seed: 12.34, level: 10};
			//S$.drink_times = [528, 529];
			//S$.conduct_data['can_restart_battle'] = true;
			
			// Custom sign.
			//SU.PushTier(new SBar.RuinsRenderer({custom_data: {data: {building_name:["asdf","qwer"], time:10}, seed:12.34}, parent_data: {raceseed: 23.45, seed: 34.56}}));
			//new SBar.TravelRenderer(S$.GetOrigBar().parentData.systemData);
			//new SBar.TravelRenderer(S$.GetOrigBar().parentData.systemData).Test1();
		},
		
		handleUpdate: function(deltaTime, movex, movey) {
			// noop
		},
		starmap: function() {
			//new SBar.HandleLossRenderer(undefined).activate();
			//return;
			if (SG.starmap === null) {
				SG.starmap = new SBar.StarmapTier();
			}
			SG.starmap.activate(-100, -100);
			SG.starmap.SensorScan(-100, -100, 300);
		},
		system: function() {
			var homeData = S$.GetOrigBar().parentData.systemData;
			homeData.activateTier(homeData.x, homeData.y);
		},
		getAnySystem: function() {
			var region = new SBar.RegionData(0, 0);
			for (var obj in region.systems) {
				var systemData = region.systems[obj];
				systemData.generate();
				for (var p in systemData.planets) {
					var planet = systemData.planets[p];
					if (!planet.life && planet.templePlanet) { // hostile temple
						return systemData;
					}
				}
			}
		},
		planet: function() {
			var planet = S$.GetOrigBar().parentData.systemData.planets[0];
			planet.activateTier();
		},
		tryBeltRegion: function(x, y) {
			var region = new SBar.RegionData(x, y);
			for (let systemData of region.systems) {
				systemData.generate();
				for (let belt of systemData.belts) {
					belt.generate();
					if (belt.building_types.length > 0) {
						belt.activateTier();
						return true;
					}
				}
			}
			return false;
		},
		belt: function() {
			if (this.tryBeltRegion(0,0)) {
				return;
			}
			if (this.tryBeltRegion(-10000,-10000)) {
				return;
			}
			if (this.tryBeltRegion(10000,-10000)) {
				return;
			}
			if (this.tryBeltRegion(10000,10000)) {
				return;
			}
			error("Can't find a belt with buildings (x4)")
		},
		starport: function() {
			SF.ALL_STARPORTS = true;
			this.belt();
		},
		/*
		surface: function() {
			let system = S$.GetOrigBar().parentData.systemData;
			let planet = system.planets[Math.floor(system.planets.length/2)];
			planet.activateSurface(0, 0);
		},
		*/
		temple: function() {
			var planets = this.getAnySystem().planets;
			for (var i = 0; i < planets.length; i++) {
				var planet = planets[i];
				if (planet.templePlanet) {
					planet.generate();
					let tier = planet.activateTier();
					tier.SetShipLocation(planet.templedata);
					planet.templedata.pushBuildingTier();
					return;
				}
			}
		},
		bar: function() {
			//S$.GetOrigBar().activateTier();
			SU.sendHome();
		},
		RandomShop: function() {
			var bs = S$.GetOrigBar().parentData.buildingdata;
			for (let building of bs) {
				if (building.type !== SF.TYPE_BAR && building.type !== SF.TYPE_TEMPLE_BAR) {
					let tier = building.parentData.activateTier();
					tier.SetShipLocation(building);
					building.pushBuildingTier();					
				}
			}
			error("not found");
		},
		RandomBattle: function() {
			let data = {};
			data.seed = Math.random();
			data.raceseed = 1//Math.random();
			data.level = 1;
			data.type = SF.TIER_STARMAP;
			data.name = "asdf"
			
			let battle = new SBar.BattleBuilder(SF.BATTLE_ALPHA, data, /*attacking=*/true, this.RandomBattleCallback.bind(this), {seed: Math.random()});
			SG.death_message = "Killed by random battle.";
			SU.PushBattleTier(battle);
		},
		RandomBattleCallback: function(encounter_data) {
			// No-op.
		},
		randomseed: function() {
			S$ = new SBar.GameData(ST.getAlphaWord(0));
		},
		stableseed: function() {
			S$ = new SBar.GameData("12.46");
		},
		addarti: function() {
//			let arti = SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_ALPHA);
//			let arti = SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_TRUE_OMEGA);
//			let arti = SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_OMEGA_FRAGMENT);
			let arti = SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_STANDARD);
      SU.PushTier(new SBar.ArtifactFindRenderer(arti, S$.GetOrigBar()));
		},
		addshiparti: function() {
			SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_SHIP), S$.GetOrigBar()));
		},
		addboostarti: function() {
			SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/8, SF.SKILL_BOOST), S$.GetOrigBar()));
		},
		addstatsarti: function() {
			SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_STATS), S$.GetOrigBar()));
		},
		AddCargo: function() {
			//S$.ship.AddCargo(S$.ship.CreateCargo(Math.random(), 5, Math.floor(Math.random() * 3) + 1));
			//SU.PushTier(new SBar.ArtifactFindRenderer(SBar.ArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.SKILL_CARGO), S$.GetOrigBar()));
//			let renderer = new SBar.ArtifactComplexRenderer(S$.ship, SBar.CargoArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.CARGO_ORE));
			let renderer = new SBar.ArtifactComplexRenderer(S$.ship, SBar.CargoArtifactData(Math.random(), /*raceseed=*/1, /*level=*/5, SF.CARGO_GOODS));
			renderer.is_cargo = true;
			SU.PushTier(renderer);	
		},
		addCredits: function() {
			S$.AddCredits(1000000);
		},
		asteroidBuilding: function() {
			var system = S$.GetOrigBar().parentData.systemData;
			for (var i = 0; i < system.belts.length; i++) {
				var belt = system.belts[i];
				belt.generate();
				for (var j = 0; j < belt.asteroids.length; j++) {
					var ast = belt.asteroids[j];
					if (ast.bdata !== null) {
						var b = ast.bdata;
						var type = b.type;
						if (type !== SF.TYPE_BAR && type !== SF.TYPE_TEMPLE_BAR) {
							b.faction = SF.FACTION_PIRATE;
							b.activateTier(false);
							return;
						}
					}
				}
			}
			error("not found");
		},
		handleKey: function(key) {
			switch (key) {
				case SBar.Key.NUM1:
					this.starmap();
					break;
				case SBar.Key.NUM2:
					this.system();
					break;
				case SBar.Key.NUM3:
					this.planet();
					break;
				case SBar.Key.NUM4:
					this.belt();
					break;
				case SBar.Key.NUM5:
					this.planet();
					break;
				case SBar.Key.NUM6:
					this.bar();
					break;
				case SBar.Key.NUM7:
					this.temple();
					break;
				case SBar.Key.NUM8:
					this.RandomShop();
					break;
				case SBar.Key.NUM9:
					this.WmdCoreSystem();
					break;
				case SBar.Key.B:
					this.RandomBattle();
					break;
				case SBar.Key.J:
				case SBar.Key.EXCLAIM:
					this.addQuest();
					break;
				case SBar.Key.BACKQUOTE:
					this.randomseed();
					break;
				case SBar.Key.A:
					this.addarti();
					break;
					//case SBar.Key.X:
					//this.maxstats();
					//break;
				case SBar.Key.C:
					this.Ship();
					break;
				case SBar.Key.H:
					this.AddHero();
					break;
				case SBar.Key.T:
					this.AddTime();
					break;
				case SBar.Key.X:
					this.AddXp();
					break;
				case SBar.Key.E:
					this.EndCredits();
					break;
				default:
					error("unrecognized key pressed in testpage: " + key);
			}
		},
		startpage: function() {
			new SBar.StartPage().activate();
		},
		intro: function() {
			let intro = new SBar.IntroTier();
			intro.activate();
		},
		introDiscoverWmd: function() {
			S$.current_chapter = 3;
			let intro = new SBar.IntroTier();
			intro.activate();
		},
		introGetWmd: function() {
			S$.current_chapter = 4;
			let intro = new SBar.IntroTier();
			intro.activate();
		},
		introTerminal: function() {
			let intro = new SBar.IntroTerminal();
			intro.activate();
		},
		introSpacebar1: function() {
			let intro = new SBar.IntroTier();
			intro.SetCutscene("spacebar1");
			intro.building_data = {name: ["Test", "Name"]}
			intro.activate();
		},
		addQuest: function() {
			var bdata = S$.GetOrigBar().parentData.buildingdata[1];
			SU.PushTier(new SBar.QuestDisplay(bdata, undefined, 1, 1));
		},
		pirate: function() {
			S$.faction = SF.FACTION_PIRATE;
		},
		Ship: function() {
			SU.PushTier(new SBar.CharacterRenderer());
		},
		//maxstats: function() {
		//	error("TODO: maxstats");
		//},
		AddHero: function() {
			var new_tier = new SBar.HireDisplay(Math.random(), Math.random(), /*level=*/20);
			SU.PushTier(new_tier);
		},
		SetHardcore: function() {
			S$.hardcore = true;
		},
		AddTime: function() {
			SE.PassTime(100000*5*24);
			//SE.PassTime(5*24);
		},
		AddSingleCrew: function() {
	    // this._initCrew(name, seed, raceseed, level, crew_data, is_player, is_pirate);
			let race = Math.random();
			//let race = 1;  /*1 for alpha*/
			S$.AddCrew(new SBar.Crew(ST.getWord(race, Math.random()), 
			           Math.random(), race, capLevel(Math.floor(SU.r(Math.random(),Math.random())*21))));
		},
		AddShipInTow: function() {
			S$.tow_ship = new SBar.Ship(SF.SHIP_COMMON, /*level=*/20, /*seed=*/Math.random(), Math.random());			
		},
		AddXp: function() {
			S$.AddXp("combat", 100);
		},
		NoPay: function() {
			for (let i = 1; i < S$.crew.length; i++) {
			  SE.ApplyMorale(SE.MORALE_NOPAY, S$.crew[i]);
			}			
		},
		WmdCoreSystem: function() {
			// Need to add, since these don't appear until entering a bubble.
			let region = new SBar.RegionData(0, 0);
			race_obj = {level: 20, seed: SF.RACE_SEED_ALPHA, alignment: 0};
			race_obj.bubbles = [{x: 0, y: 0, size: 1000}];
			region.allAlphas.push(race_obj)
			region.myAlphas.push(race_obj)
			
			S$.in_alpha_space = true;
			S$.background_alpha_seed = Math.random();
			S$.alpha_bubbles = [];
			
			let system = new SBar.SystemData(region, S$.bossxy[0], S$.bossxy[1], SF.SYSTEM_ALPHA_CORE)
			system.activateTier(system.x, system.y);
		},
		GoArth2: function() {
			SF.NO_BUBBLES = true;
			let region = new SBar.RegionData(0, 0);
			for (let systemData of region.systems) {
				if (systemData.specialType === SF.SYSTEM_ARTH) {
					systemData.generate();
					for (let planet of systemData.planets) {
						if (planet.is_arth) {
							planet.activateTier();
							return;
						}
					}
				}
			}
			error("arth2 not found");
		},		
		SetFoundWmd: function() {
			S$.got_wmd_in_past = true;
		},
		SetChapter1: function() {
			S$.current_chapter = 1;
		},
		SetChapter3: function() {
			S$.current_chapter = 3;
		},
		SetChapter4: function() {
			S$.current_chapter = 4;
		},
		SetLowTime: function() {
			S$.time = -10;
		},
		//Pillar effect.
	  // S$.battle_effect = {name: "test_effect", seed: 12.34, level: 10};
		
		GameSummary: function() {
      SU.PushTier(new SBar.GameSummaryRenderer());
		},

		EndCredits: function() {
      SU.PushTier(new SBar.CreditsRenderer());
		},
		
		SetSensors: function() {
			S$.ship.sensor_level = 20;
		},
		teardown: function() {
			SC.layer1.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			SB.clear();
			S$.addButtons();
		},
	};
})();
