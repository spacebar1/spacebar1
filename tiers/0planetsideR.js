/*
This one kinda doubles as both a data object and a tier / renderer.
 */

(function() {

    SBar.PlanetsideRenderer = function(planet_or_asteroid_data, x, y) {
        this._initPlanetsideRenderer(planet_or_asteroid_data, x, y);
    };

    SBar.PlanetsideRenderer.prototype = {
      type: SF.TIER_PLANETSIDER,
      data: null,
			parentData: null,  // To also make this a data object for the map builder.
			seed: null,
			x: null,
			y: null,
			level: null,
			parent_img: null,
			is_asteroid: null,
			//mining_days: null,
			mine_details: null,
			_initPlanetsideRenderer: function(planet_or_asteroid_data, x, y) {
        this.data = planet_or_asteroid_data;
				this.parentData = planet_or_asteroid_data;
				this.name = planet_or_asteroid_data.name;
        this.x = x;
				this.y = y;
				this.level = planet_or_asteroid_data.level;
				this.seed = SU.r(this.data.seed,x+y+x*(y+1.11));
				this.is_asteroid = this.data.type === SF.TYPE_BELT_DATA;
				//this.mining_days = Math.floor(3+height/200);
				
				this.mine_details = S$.mineDetails[this.seed];
      },
      activate: function() {
//	      SG.activeTier.teardown();
				this.AddText();
				SU.addText("L: Look Around");
				SU.addText("X: Leave");
				this.Render();
        SG.activeTier = this;				 
      },
			AddText: function() {
				SU.clearText();
				if (this.data.is_starport) {
					return;
				}
				if (this.mine_details) {
					SU.addText("E: Mine for Minerals")
				} else {
					SU.addText("E: Sample Minerals")
				}
				if (S$.ExistsCustomBuilding(this.data.seed, this.x, this.y)) {
					SU.addText("R: Remove Mining Camp")
				}
				if (S$.ship.ship_type !== SF.SHIP_POD) {
					SU.addText("A: Abandon Ship");
				}
				if (S$.tow_ship) {
					SU.addText("T: Abandon Towed Ship");
				}
				//if (S$.ship.cargo.length > 0) {
					SU.addText("S: Stash Cargo");
					SU.addText("I: Stash Items");
					//}
			},
			GetD: function(d, x, y) {
				//var terrain_type = this.data.GetTerrainType(x, y);
				if (this.data.ggiant) {
					return 128;
				}
//				var flat = this.data.isFloating(x,y);
//				if (flat) return 128;
				
				var ret = d[y*128+x];
				if (ret < 128 && (this.data.haswater || this.data.tempmax > 600)) ret = 128;
				if (ret < 128 && this.data.hasmethane) ret = 128;
				return ret;
			},
			// Get color.
			GetC: function(c, x, y, shade) {
				let index = (y*128+x)*4;
        return 'rgb('+(c[index]+shade)+','+(c[index+1]+shade)+','+(c[index+2]+shade)+')';
			},
			Mining: function() {
				var terrain_type = this.data.GetTerrainType(this.x, this.y);
				if (this.data.ggiant) {
					SU.ShowWindow("Head in the Clouds","Peering into the roaring vapors of "+this.data.name+" you fantasize of the untold riches "+
				    "trapped in the gas giant's gravity well. But alas, your ship equipment is incapable of extracting metallic hydrogen or atmospheric xenon. You "+
  					"speculate it would take a city floating in the clouds to effectively mine this place.",  /*callback=*/undefined, '!');
				} else if (terrain_type === SF.TLAVA) {
					SU.ShowWindow("The Molten Diet","Although a jar of lava on the dashboard would add some class to your rig, the laws of termodynamics "+
	  				"would soon apply. And there are safer ways to collect rocks.", /*callback=*/undefined, '!');
				} else if (terrain_type === SF.TWATER) {
					SU.ShowWindow("The Liquid Diet","You find water. Lots and lots of water.", /*callback=*/undefined, '!');
				} else if (terrain_type === SF.TMETHANE) {
					SU.ShowWindow("The Liquid Diet","You find liquid hydrocarbons. Lots of it.", /*callback=*/undefined, '!');
				} else if (terrain_type === SF.TICE) {
					SU.ShowWindow("A Frozen Diet","The snowflake, pretty as it is in all its infinite forms, is still just the solid oxide of common liquids and gasses.", /*callback=*/undefined, '!');
				} else if (terrain_type === SF.TLAND || terrain_type === SF.TDESERT) {
					this.MineTerrain();
				} else {
					error("unknown land type: "+terrain_type);
				}
			},
			MiningSample: function() {
				if (!SE.PassTime(1)) {
					return;
				}
				let area_minerals = this.data.GetAreaMinerals();
				let local_minerals = SU.r(this.seed, 8.1);
				let minerals = local_minerals * area_minerals * 101;
				minerals = Math.floor(minerals);
				
				let mine_time = 4*(SU.r(this.seed, 8.4)+0.5);
				let heat = this.data.GetTerrainHeat(this.x,this.y);
				if (heat < 273) {
					mine_time *= 2;
					if (heat < 173) {
						mine_time *= 2;
					}
				} else if (heat > 373) {
					mine_time *= 2;
					if (heat > 474) {
						mine_time *= 2;
					}
				}
				mine_time = Math.round(mine_time);
				this.mine_details = S$.mineDetails[this.seed];
				
				S$.mineDetails[this.seed] = {minerals: minerals, max_minerals: minerals, mine_time: mine_time};
				// logMessage here doesn't work because of coords conversion, not easy to externalize.
				// Don't really need it anyway- asteroids are obvious, and planets have plenty of other choices.
				//S$.logMessage(this.data.name+" "+this.x+","+this.y+" "+SF.SYMBOL_MINERALS+minerals+" "+SF.SYMBOL_TIME+mine_time)
				this.mine_details = S$.mineDetails[this.seed];				
				S$.AddCustomBuilding(this.data, this.seed, SF.TYPE_CUSTOM_MINE, this.x, this.y, {});
				this.activate();
			},
			MineTerrain: function() {
				if (!this.mine_details) {
					this.MiningSample();
					return;
				}
				
				let mine_time = this.mine_details.mine_time;
				if (S$.ship.mining_speed !== undefined) {
					mine_time /= 1 + (S$.ship.mining_speed/100);
					mine_time = Math.round(mine_time);
				}
				if (!SE.PassTime(mine_time)) {
					return;
				}
				S$.game_stats.minerals_mined++;
				
				// Effective mining is a combination of mining speed and mineral quality.
				// Mineral quality is based on the extraction capability of the ship and
				// the quality of minerals available. To strike a good balance, the
				// minerals number represents the probability that minerals extracted will
				// be of the top level the ship can extract. If it misses the probability,
				// drop the level by 1 and use the probability to try again. So a 50%
				// minerals value with L10 extraction is roughly:
				//  L10: 50%
				//  L9: 25%
				//  L8: 12.5%
				// And so forth.
				let extraction_level = 1;
				let minerals = this.mine_details.minerals;
				if (S$.ship.mining_level !== undefined) {
					extraction_level = S$.ship.mining_level;
				}
				while (extraction_level > 1) {
					if (SU.r(this.seed,S$.time+extraction_level)*100 < minerals) {
						break;
					} else {
						extraction_level--;
					}
				}
				
				// Camp may have been removed.
				if (!S$.ExistsCustomBuilding(this.data.seed, this.x, this.y)) {
					S$.AddCustomBuilding(this.data, this.seed, SF.TYPE_CUSTOM_MINE, this.x, this.y, {});
				}
				
				// Reduce the available minerals in this camp probalistically. Lose less than half on average.
				let rand = SU.r(this.seed,S$.time+1.11);
				let mineral_change = 1-rand*rand;
				this.mine_details.minerals = Math.round(this.mine_details.minerals*mineral_change)
				this.activate();

				let arti = SBar.CargoArtifactData(SU.r(this.seed, 14.14+S$.time), this.data.raceseed, extraction_level, SF.CARGO_ORE);				
				
				let renderer = new SBar.ArtifactComplexRenderer(S$.ship, arti, /*view_only=*/false);
				renderer.is_cargo = true;
				renderer.stashing_cargo = true;
				renderer.callback = this.StashCargoMiningCallback.bind(this);
				SU.PushTier(renderer);
			},
			Render: function() {
				if (this.data.is_starport) {
					this.RenderStarport();
					return;
				}
	      SC.layer0.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // Clear helm.
				
	      var terrainwidth = 512;
        var ctx = SC.layer1;
        ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
//				SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, '#000');
				// Draw the nebula in the background, if needed.
				//ctx.drawImage(SC.backLayer.canvas, 0, 0)
				
//				let starxy = SU.DrawStar(ctx, this.data.systemData, this.data.distanceOut, this.data.x)
//				if (starxy && this.data.is_refractor) {
					//SU.DrawAlphaTriangle(ctx, this.data.seed, starxy[0], starxy[1], -SF.WIDTH*5, SF.HEIGHT, SF.WIDTH*6, SF.HEIGHT);
//					SU.DrawAlphaCone(ctx, this.data.seed+0.13+this.x*1.01+this.y*1.13, starxy[0], starxy[1]);
//				}
				
				if (this.is_asteroid) {
					this.data.tier.dust.update(SF.HALF_WIDTH+SU.r(this.seed, 71.1)*600-300, SF.HALF_HEIGHT+SU.r(this.seed, 71.2)*600-300, 21);
					this.data.tier.dust.update(SF.HALF_WIDTH+SU.r(this.seed, 71.3)*400-200, SF.HALF_HEIGHT+SU.r(this.seed, 71.4)*400-200, 14);
					this.data.tier.dust.update(SF.HALF_WIDTH+SU.r(this.seed, 71.5)*200-100, SF.HALF_HEIGHT+SU.r(this.seed, 71.6)*200-100, 29);
				}				
/*				
	      var cloudimg = this.data.getCloudTerrain().renderTerrain().img;
				// Parent planet, if any.
				if (this.data.is_moon) {
					var parent_scale = 1/this.data.moon_dist;
					ctx.save();
					var x = Math.floor(SU.r(this.data.seed, 95.1)*SF.WIDTH);
					var y = Math.floor(SU.r(this.data.seed, 95.2)*SF.HEIGHT/2);
					ctx.translate(x,y);
					ctx.rotate(SU.r(this.data.seed, 93.11)*PIx2);
					this.data.parent_planet_data.DrawRingsBack(ctx, 0, 0, parent_scale);
					this.data.parent_planet_data.getPlanetTerrain().renderLarge(0, ctx, 0, 0, parent_scale);
					this.data.parent_planet_data.getCloudTerrain().renderLarge(0, ctx, 0, 0, parent_scale);
					this.data.parent_planet_data.DrawRingsFore(ctx, 0, 0, parent_scale);
					ctx.restore();
				}
				// Other moons, if any.
				var moons = this.data.moons;
				if (this.data.is_moon) {
					moons = this.data.parent_planet_data.moons;
				}
				for (var i = 0; i < moons.length; i++) {
					if (!this.data.is_moon || this.data.index !== i) {
						var dist = moons[i].moon_dist;
						var scale = 1/dist;
						if (this.data.is_moon) {
							dist = Math.abs(this.data.moon_dist - dist);
						}
						var x = Math.floor(SU.r(this.data.seed, 95.6+i)*SF.WIDTH);
						var y = Math.floor(SU.r(this.data.seed, 95.7+i)*SF.HEIGHT/2);
						ctx.save();
						ctx.translate(x,y);
						ctx.rotate(SU.r(this.data.seed, 94.11+i)*PIx2);
						// Compromise performance to render large only on the closer objects.
						if (scale > 0.6) {
							moons[i].getPlanetTerrain().renderLarge(0, ctx, 0, 0, scale/2);
							moons[i].getCloudTerrain().renderLarge(0, ctx, 0, 0, scale/2);
						} else {
							moons[i].getPlanetTerrain().renderSmall(ctx, 0, 0, 8*scale);
							moons[i].getCloudTerrain().renderSmall(ctx, 0, 0, 8*scale);
						}
						ctx.restore();
					}
				}
				
				// Clouds.
				if (!this.data.ggiant) {
					ctx.save();
					ctx.globalAlpha = this.data.atmosphere;
					var r = Math.floor(SU.r(this.data.seed,6.8)*128)+128;
					var g = Math.floor(SU.r(this.data.seed,6.9)*128)+128;
					var b = Math.floor(SU.r(this.data.seed,7.0)*128)+128;
	        SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgb('+r+','+g+','+b+')');
					// Stretch horizontal, flatten a bit vertical.
					ctx.transform(3, 0, 0, 1, -SU.r(this.seed, 6.6)*1000, 0);
		      ctx.drawImage(cloudimg, 0, 0, terrainwidth, terrainwidth, 0, 0, SF.WIDTH, SF.HEIGHT);
					if (this.data.atmosphere > 0.5) {
						ctx.transform(1.5, 0, 0, 1.5, -SU.r(this.seed, 6.7)*100, 0);
			      ctx.drawImage(cloudimg, 0, 0, terrainwidth, terrainwidth, 0, 0, SF.WIDTH, SF.HEIGHT);
					}
					if (this.data.atmosphere > 0.75) {
						ctx.transform(1.5, 0, 0, 1.2, -SU.r(this.seed, 6.8)*100, 0);
			      ctx.drawImage(cloudimg, 0, 0, terrainwidth, terrainwidth, 0, 0, SF.WIDTH, SF.HEIGHT);
					}
					ctx.restore();
				}
				*/
				//Asteroid surfaces don't yet use 3D.
				if (this.data.type == SF.TYPE_BELT_DATA) {
					terrain = this.data.getPlanetTerrain().renderWindowData(this.x, this.y);
					for (var dy = 99; dy >= 0; dy--) {
						for (var dx = 0; dx < 100; dx++) {
							var dist = dy;
							var y = 100-dy;
							var x = dx;
						
							// back left, back right, front left, front right
							var p1 = (256-this.GetD(terrain.data,x,y-1))*100/(dist+1);
							var p2 = (256-this.GetD(terrain.data,x+1,y-1))*100/(dist+1);
							var p3 = (256-this.GetD(terrain.data,x+1,y))*100/dist;
							var p4 = (256-this.GetD(terrain.data,x,y))*100/dist;
							var shade = Math.floor((p1-p2)/2+(p4-p3)/3);
							ctx.fillStyle = this.GetC(terrain.imgdata.data, x, y-1, shade);
							if (p2 < p1) ctx.fillStyle = this.GetC(terrain.imgdata.data, x+1, y-1, shade);
							if (p3 < p2) ctx.fillStyle = this.GetC(terrain.imgdata.data, x+1, y, shade);
							if (p4 < p3) ctx.fillStyle = this.GetC(terrain.imgdata.data, x, y, shade);
						
				      ctx.beginPath();
				      ctx.moveTo((dx-25)*500/(dist+1)+200, p1+(dist+1)*6-100);
			        ctx.lineTo((dx-24)*500/(dist+1)+200, p2+(dist+1)*6-100);
			        ctx.lineTo((dx-24)*500/dist+200, p3+dist*6-100);
			        ctx.lineTo((dx-25)*500/dist+200, p4+dist*6-100);
							ctx.closePath();
						
			        ctx.lineWidth = 1;
			        ctx.strokeStyle = ctx.fillStyle;
			        ctx.stroke();
				      ctx.fill();				
						}
					}					
				}
				
				/*
				// Surface
				let terrain;
				if (this.data.GenerateTerrain) {
					// This is here mainly for testing, to jump straight into a building with planetside.
					this.data.GenerateTerrain();
				}
				if (this.data.type == SF.TYPE_PLANET_DATA && !this.data.ggiant || this.data.type == SF.TYPE_BELT_DATA) {
					// Asteroids are pretty dull in reality. They could be done better, but it's kind of a nice contrast
					// that they are all just gray.
					terrain = this.data.getPlanetTerrain().renderWindowData(this.x, this.y);
				} else {
		      terrain = this.data.getPlanetTerrain().renderTerrain();
				}
        //this.terrainResult = {img: d, data: this.rawdatalarge, heatmap: this.heatmap, imgdata: this.imageDataBig};		
				for (var dy = 99; dy >= 0; dy--) {
					for (var dx = 0; dx < 100; dx++) {
						var dist = dy;
						var y = 100-dy;
						var x = dx;
						
						// back left, back right, front left, front right
						var p1 = (256-this.GetD(terrain.data,x,y-1))*100/(dist+1);
						var p2 = (256-this.GetD(terrain.data,x+1,y-1))*100/(dist+1);
						var p3 = (256-this.GetD(terrain.data,x+1,y))*100/dist;
						var p4 = (256-this.GetD(terrain.data,x,y))*100/dist;
						var shade = Math.floor((p1-p2)/2+(p4-p3)/3);
						ctx.fillStyle = this.GetC(terrain.imgdata.data, x, y-1, shade);
						if (p2 < p1) ctx.fillStyle = this.GetC(terrain.imgdata.data, x+1, y-1, shade);
						if (p3 < p2) ctx.fillStyle = this.GetC(terrain.imgdata.data, x+1, y, shade);
						if (p4 < p3) ctx.fillStyle = this.GetC(terrain.imgdata.data, x, y, shade);
						
			      ctx.beginPath();
			      ctx.moveTo((dx-25)*500/(dist+1)+200, p1+(dist+1)*6-100);
		        ctx.lineTo((dx-24)*500/(dist+1)+200, p2+(dist+1)*6-100);
		        ctx.lineTo((dx-24)*500/dist+200, p3+dist*6-100);
		        ctx.lineTo((dx-25)*500/dist+200, p4+dist*6-100);
						ctx.closePath();
						
		        ctx.lineWidth = 1;
		        ctx.strokeStyle = ctx.fillStyle;
		        ctx.stroke();
			      ctx.fill();				
					}
				}
*/				
				
				// Coordinates.
				if (this.is_asteroid) {
					let name = this.name;
					let system_name = this.data.systemData.name;
          SU.writeCoordText(name, system_name);
				} else {
					if (this.data.tier && this.data.tier.renderer) {  // Check for debug to jump in.
			      this.data.tier.renderer.updateCoords(ctx, /*skip_clear=*/true);
					}
				}
				this.WriteDetails(ctx);
			},
			
			RenderStarport: function() {
	      let bufferImg = document.createElement('canvas');
	      bufferImg.width = SF.WIDTH;
	      bufferImg.height = SF.HEIGHT;
	      let ctx = bufferImg.getContext('2d');
				SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, )
				
				let r = Math.floor(SU.r(this.seed,1.51)*128)+128;
				let g = Math.floor(SU.r(this.seed,1.52)*128)+128;
				let b = Math.floor(SU.r(this.seed,1.53)*128)+128;
				let weight = SU.r(this.seed,1.54)/2+0.5;
				let weight2 = SU.r(this.seed,1.55)/2+0.5;
				let drop = Math.floor(SU.r(this.seed, 1.56)*80)+10;
	      colorStops = [0, 'rgba(' + r + ',' + g + ',' + b + ','+weight+')', 1, 'rgba(' + (r-drop) + ',' + (g-drop) + ',' + (b-drop) + ','+weight2+')'];
				let x1 = Math.floor(SU.r(this.seed, 1.57)*SF.WIDTH);
				let x2 = Math.floor(SU.r(this.seed, 1.58)*SF.WIDTH);
				SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, "#888");
				SU.rectGrad(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, x1, 0, x2, SF.HEIGHT, colorStops);
				// Common floor color for all bays here.
				let colors = this.data.StarportColors();
				SU.rect(ctx, 0, SF.HEIGHT*3/4, SF.WIDTH, SF.HEIGHT/4, 'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)');
				SU.line(ctx, 0, SF.HEIGHT*3/4, SF.WIDTH, SF.HEIGHT*3/4, 'rgba('+colors.r/4+','+colors.g/4+','+colors.b/4+',1)', 5);
				
				ctx.save();
				let window_width = SU.r(this.seed, 7.41)*SF.WIDTH*0.7+40;
				let window_height = SU.r(this.seed, 7.42)*SF.HEIGHT*0.5+40;
				let window_x = SU.r(this.seed, 7.43)*(SF.WIDTH-window_width);
				let window_y = SU.r(this.seed, 7.44)*(SF.HEIGHT*0.6-window_height);
				let corner = SU.r(this.seed, 7.45)*15+5
				ctx.save();
				ctx.globalCompositeOperation = "destination-out";
	      SU.rectCorner(ctx, corner, window_x, window_y, window_width, window_height, "F00");
				ctx.restore();
				// Window reflection.
	      colorStops = [0, "rgba(255,255,255,0.3)", 0.5, "rgba(255,255,255,0.2)", 1, "rgba(255,255,255,0)"];
				let rad = Math.min(window_width, window_height)/4;
				SU.circleRad(ctx, window_x+window_width/3+SU.r(this.seed, 8.12)*window_width/3, window_y+window_height/3+SU.r(this.seed, 8.13)*window_height/3, rad, colorStops);				
				SU.circleRad(ctx, window_x+window_width/3+SU.r(this.seed, 8.14)*window_width/3, window_y+window_height/3+SU.r(this.seed, 8.15)*window_height/3, rad, colorStops);				
				let border = SU.r(this.seed, 7.46)*15+5;
				drop = Math.floor(SU.r(this.seed, 7.56)*80)+30;
	      SU.rectCorner(ctx, corner, window_x, window_y, window_width, window_height, undefined, "#444", border);
				ctx.restore();

				// Final draw.
        ctx = SC.layer1;
				ctx.drawImage(bufferImg, 0, 0);			
			},
			
			
			WriteDetails: function(ctx) {
				if (this.data.is_starport) return;
				SU.rect(ctx, 5, SF.HEIGHT-130, 400, 95, 'rgba(0,0,0,0.25)');

	      ctx.font = SF.FONT_L;
	      ctx.strokeStyle = 'white';
	      ctx.lineWidth = 1;
	      ctx.fillStyle = 'white';
				if (this.data.ggiant) {
		      ctx.fillText("Gas Upper Atmosphere", 15, SF.HEIGHT-105);
		      //ctx.fillText("Height: "+height+"M", 15, SF.HEIGHT-75);
  			} else {
					var land_type = this.data.GetTerrainType(this.x, this.y);
					var land_name;
					switch (land_type) {
  					case SF.TLAND:
							land_name = "Soil"
							break;
  					case SF.TWATER:
							land_name = "Water"
							break;
  					case SF.TMETHANE:
							land_name = "Liquid Hydrocarbons"
							break;
  					case SF.TLAVA:
							land_name = "Molten Rock"
							break;
  					case SF.TICE:
							if (this.data.hasmethane) {
								land_name = "Ice & Rock"								
							} else {
								land_name = "Ice"
							}
							break;
  					case SF.TGAS:
							land_name = "Gas"
							break;
  					case SF.TDESERT:
							land_name = "Barren Rock & Sand"
							break;
					}
					if (this.data.is_battlestation || this.data.is_refractor) {
						land_name = "Metal";
					}
		      ctx.fillText(land_name, 15, SF.HEIGHT-105);
		      ctx.fillText("Temperature: "+Math.floor(this.data.GetTerrainHeat(this.x,this.y))+"K", 15, SF.HEIGHT-75);
					var height = Math.floor(this.data.GetTerrainHeight(this.x,this.y)*50+SU.r(this.seed,7.31)*50);
		      ctx.fillText("Height: "+height+"M", 15, SF.HEIGHT-45);
					
				}
				if (this.mine_details) {
					SU.rect(ctx, SF.HALF_WIDTH+5, SF.HEIGHT-130, 400, 95, 'rgba(0,0,0,0.25)');
					SU.text(ctx, '⚒', SF.HALF_WIDTH+20, SF.HEIGHT-60, '45pt '+SF.FONT, "#000");
					
					SU.text(ctx, "Minerals: "+SF.SYMBOL_MINERALS+this.mine_details.minerals+"/"+this.mine_details.max_minerals, SF.HALF_WIDTH+100, SF.HEIGHT-105, SF.FONT_XL, "#FFF");
					SU.text(ctx, "Base mining time: "+SF.SYMBOL_TIME+this.mine_details.mine_time, SF.HALF_WIDTH+100, SF.HEIGHT-75, SF.FONT_XL, "#FFF");
				}
			},
			
			AbandonShip: function() {
				if (S$.ship.ship_type !== SF.SHIP_POD) {
					S$.AddCustomBuilding(this.data, S$.ship.seed, SF.TYPE_CUSTOM_SHIP, this.x, this.y, S$.ship, this.data);
					if (S$.tow_ship) {
						S$.ship = S$.tow_ship;
						delete S$.tow_ship;
					} else {						
						S$.ship = new SBar.Ship(SF.SHIP_POD, /*level=*/1, S$.ship.seed+1, 0);
					}
		      SU.message("Launched escape pod.");
		      S$.logMessage("Launched escape pod.");
					this.Leave();
				}
			},
			
			AbandonTowedShip: function() {
				if (S$.tow_ship) {
					S$.AddCustomBuilding(this.data, S$.tow_ship.seed, SF.TYPE_CUSTOM_SHIP, this.x, this.y, S$.tow_ship, this.data);
					delete S$.tow_ship;
		      SU.message("Towed ship abandoned.");
		      S$.logMessage("Towed ship abandoned.");
					this.Leave();
				}
			},
			
			// Pull off anything that went to stash.
			SpliceCargoStash: function() {
				let stash = [];
				for (let i = S$.ship.cargo.length-1; i >= 0; i--) {
					let arti = S$.ship.cargo[i];
					if (arti.stashed) {
						stash.push(arti)
						S$.ship.cargo.splice(i, 1)						
					}
				}
				return stash;
			},
			// Called after finding mining ore.
			StashCargoMiningCallback: function() {
				let stash = this.SpliceCargoStash();
				if (stash.length > 0) {
					// Remove a mining camp if there is one.
					if (S$.ExistsCustomBuilding(this.data.seed, this.x, this.y)) {
						S$.RemoveCustomBuilding(this.data, this.x, this.y);
					}
					let building_seed = stash[0].params[0].seed;
					S$.AddCustomBuilding(this.data, building_seed, SF.TYPE_CUSTOM_TREASURE, this.x, this.y, {stash: stash, building_seed: building_seed}, this.data);
					this.Leave();
				}
			},
			
			// Called after finishing stash.
			StashCargoCallback: function() {
				let stash = this.SpliceCargoStash();
				if (stash.length > 0) {
					let building_seed = stash[0].params[0].seed;
					S$.AddCustomBuilding(this.data, building_seed, SF.TYPE_CUSTOM_TREASURE, this.x, this.y, {stash: stash, building_seed: building_seed}, this.data);
					let message = "Stashed cargo on "+this.data.name;
		      SU.message(message);
		      S$.logMessage(message);
				}
				this.Leave();
			},
			
			StashCargo: function() {
				if (this.data.isFloating(this.x,this.y)) {
					SU.ShowWindow("The Art of Stealth","Even to your untrained eye, this would make a terrible hiding place.", /*callback=*/undefined, '!');
					return;
				}
				
				let renderer = new SBar.ArtifactComplexRenderer(S$.ship);
				renderer.is_cargo = true;
				renderer.stashing_cargo = true;
				renderer.callback = this.StashCargoCallback.bind(this);
				SU.PushTier(renderer);	
			},
			
			SpliceItemsStash: function() {
				let stash = [];
				for (let i = S$.crew[0].artifacts.length-1; i >= 0; i--) {
					let arti = S$.crew[0].artifacts[i];
					if (arti.stashed) {
						stash.push(arti)
						S$.crew[0].artifacts.splice(i, 1)						
					}
				}
				return stash;
			},
			// Called after finishing stash.
			StashItemsCallback: function() {
				let stash = this.SpliceItemsStash();
				if (stash.length > 0) {
					let building_seed = stash[0].params[0].seed;
					S$.AddCustomBuilding(this.data, building_seed, SF.TYPE_CUSTOM_TREASURE, this.x, this.y, {stash: stash, building_seed: building_seed, item_stash: true}, this.data);
					let message = "Stashed items on "+this.data.name;
		      SU.message(message);
		      S$.logMessage(message);
				}
				this.Leave();
			},
			
			StashItems: function() {
				if (this.data.isFloating(this.x,this.y)) {
					SU.ShowWindow("The Art of Stealth","Even to your untrained eye, this would make a terrible hiding place.", /*callback=*/undefined, '!');
					return;
				}
				
				let renderer = new SBar.ArtifactComplexRenderer(S$.crew[0]);
				renderer.stashing_items = true;
				renderer.callback = this.StashItemsCallback.bind(this);
				SU.PushTier(renderer);	
			},			
			
      handleKey: function(key) {
        switch (key) {
          case SBar.Key.X:
            this.Leave();
            break;
          case SBar.Key.M:
          case SBar.Key.E:
						if (this.data.is_starport) return;
            this.Mining();
            break;
          case SBar.Key.S:
						if (this.data.is_starport) return;
            this.StashCargo();
            break;
          case SBar.Key.I:
						if (this.data.is_starport) return;
            this.StashItems();
            break;
          case SBar.Key.A:
						if (this.data.is_starport) return;
					  this.AbandonShip();
						break;
				  case SBar.Key.T:
						if (this.data.is_starport) return;
						this.AbandonTowedShip();
						break;
					case SBar.Key.R:
						if (S$.ExistsCustomBuilding(this.data.seed, this.x, this.y)) {
							S$.RemoveCustomBuilding(this.data, this.x, this.y);
							//this.activate();
							this.Leave();  // Probably just here to remove the camp.
						}
						break;
		      case SBar.Key.L:
						SU.PushTier(new SBar.LookAroundRenderer());
		        break;
          default:
            error("unrecognized key in psr: " + key);
        }
      },
      Leave: function() {
//				SU.clearText();
//				this.data.reactivateSurface(this.x, this.y);
				SU.PopTier();
      },
			teardown: function() {
	      //SC.textLayer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);  // For coordinates.
			},
    };
    SU.extend(SBar.BuildingTier, SBar.Tier);
})();
