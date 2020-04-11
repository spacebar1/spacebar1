/*
 * Quest data object

Note the quest search logic could use a rewrite, especially now that it's any-building match.
 */

(function() {
    SBar.QuestData = function() {
        this._initQuestData();
    };

    SBar.QuestData.prototype = {
        name: null,
        seed: null,
        data: null,
        valid: null, // means that there is a valid quest stored here
        target: null,
        type: null, // quest type, SF.QUEST_BOUNTY, SF.QUEST_PLOT etc
        x: null, // targetX and Y
        y: null,
        stx: null, // star X and Y
        sty: null,
        planetsGened: 0,
        // search location params
        targetTypes: null,
        levelMin: null,
        levelMax: null,
        targetFaction: null,
				money_run: false,
        _initQuestData: function() {
            // seed is set by input to the locator functions
            this.name = "noname";
        },
        // stored into char object
        charData: function() {
            // name, buildingData, type, sourceSeed
            return {"n": this.name, "x": this.x, "y": this.y, stx: this.stx, sty: this.sty, "b": SU.buildingToCoords(this.target), "t": this.type, "ss": this.seed, "ts": this.target.seed, "bx": this.target.x, "by": this.target.y, "money_run": this.money_run}; // source type? reward? text comes from sourceSeed
        },
        loadFromCharData: function(data) {
            this.name = data.n;
            this.x = data.x;
            this.y = data.y;
            this.stx = data.stx;
            this.sty = data.sty;
            this.target = SU.coordsToBuilding(data.b);
            this.type = data.t;
            this.seed = data.ss;
						this.money_run = data.money_run;
        },
        getBackground: function(bdata, money_run) {
            return ST.questBackground(this, this.seed, bdata, money_run);
        },
        /*
         * Find a building of the requested level range
         * Use the data objects to scan everything
         * And use a random search order for systems, planets/belts, buildings etc
         */
        questlocate: function(sourceData, seed, levelMin, levelMax, faction, money_run) {
            this.data = sourceData;
            this.seed = seed;
            this.levelMin = levelMin;
            this.levelMax = levelMax;
            this.targetFaction = faction;
						this.money_run = money_run;

            var systemData = this.data.parentData.systemData;
            var x = systemData.x;
            var y = systemData.y;
            var regions = [];
            for (var i = -2; i <= 2; i++) {
                for (var j = -2; j <= 2; j++) {
                    regions.push([x + i * SF.REGION_SIZE, y + j * SF.REGION_SIZE]);
                }
            }
            var indexes = SU.randomOrder(regions, this.seed + 5.25);
            for (var i = 0; i < regions.length; i++) {
                var index = indexes[i];
                var regioncoords = regions[index];
                var region = this.locateInRegion(regioncoords[0], regioncoords[1]);
                if (this.planetsGened >= 2 && !this.valid) {
                    error("2+planets gened, falling out");
                    return;
                } else if (this.valid) {
									if (this.target.parentData.base_x) {
                    this.x = this.target.parentData.base_x;
                    this.y = this.target.parentData.base_y;
									} else {										
                    this.x = this.target.parentData.x;
                    this.y = this.target.parentData.y;
									}
                    this.stx = this.target.parentData.systemData.x;
                    this.sty = this.target.parentData.systemData.y;
                    this.name = ST.questName(this.seed);
                    return;
                }
            }
        },
        locateInRegion: function(x, y) {
            var region = new SBar.RegionData(x, y);
            var systems = region.systems;
            let indexes = SU.randomOrder(systems, this.seed + 5.75);
            for (var i = 0; i < systems.length; i++) {
                var index = indexes[i];
                var system = systems[index];
                system.generate();
                if (this.levelMin <= system.level && system.level <= this.levelMax) {
                    if (SU.r(this.seed, 6.45) < 0.5) {
                        // belts first
                        this.locateInBelts(system);
                        this.locateInPlanets(system);
                    } else {
                        this.locateInPlanets(system);
                        this.locateInBelts(system);
                    }
                    system.teardown();
                    if (this.valid || this.planetsGened >= 2) {
                        break;
                    }
                }
            }
            region.teardown();
            return region;
        },
        locateInBelts: function(system) {
            var belts = system.belts;
            let indexes = SU.randomOrder(belts, this.seed + 7.45);
            for (var i = 0; i < belts.length; i++) {
                var index = indexes[i];
                let belt = belts[index];
                belt.generate();
                var asteroids = belt.asteroids;
                let i2s = SU.randomOrder(asteroids, this.seed + 8.45);
                for (var j = 0; j < asteroids.length; j++) {
                    var i2 = i2s[j];
                    var bdata = asteroids[i2].bdata;
                    if (bdata !== null) {
                        this.checkBuilding(bdata);
                    }
                }
            }
        },
        locateInPlanets: function(system) {
            var planets = system.planets;
            let indexes = SU.randomOrder(planets, this.seed + 9.45);
            for (var i = 0; i < planets.length; i++) {
                var index = indexes[i];
                let planet = planets[index];
                planet.genBuildingTypes();

                var hastarget = false;
								for (var j = 0; j < planet.building_types.length; j++) {
									var building_type = planet.building_types[j];
									if (building_type[1] == this.targetFaction) {
										hastarget = true;
									}
								}
                if (hastarget) {
                    planet.generate();
                    this.planetsGened++;
                    var buildings = planet.buildingdata;
                    let building_order = SU.randomOrder(buildings, this.seed + 10.45);
                    for (var j = 0; j < buildings.length; j++) {
                        var building = building_order[j];
                        var bdata = buildings[building];
                        this.checkBuilding(bdata);
                    }
                    if (this.valid || this.planetsGened >= 2) {
                        break;
                    }
                }
            }
        },
        checkBuilding: function(bdata) {
            if (this.valid) {
                return;
            }
            if (bdata.faction === this.targetFaction) {
                if (!S$.found(bdata.seed) && !S$.knownQuest(bdata.seed)) {
                    this.valid = true;
                    this.target = bdata;
                    return;
                }
            }
        },
        getArtiReward: function() {
            let level = capMaxLevel(this.target.level + 1);
						// Could make this more comprehensive for rewards. But on the other hand
						// special artis are a nice treat for going to the effort.
						let skill_type = SU.RandArtiType(this.seed, this.targetFaction);
						return SBar.ArtifactData(this.seed + 5.55, this.seed + 5.56, level, skill_type);
        },
				getMoneyReward: function() {
					return Math.round(SF.LEVEL_XP[1]*(SU.r(this.seed, 6.16)*0.5+0.5));
				},
        findArtifactCallback: function() {
            // no-op
        },
    };
    SU.extend(SBar.QuestData, SBar.Data);
})();
