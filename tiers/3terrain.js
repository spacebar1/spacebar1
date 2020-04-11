(function() {

    SBar.PlanetTerrain = function(dataIn, cloud) {
        this._initPlanetTerrain(dataIn, cloud);
    };

    SBar.PlanetTerrain.prototype = {
        planetData: null,
        vradius: null, // visible size of planet

        terrainwidthsmall: 64,
        terrainheightsmall: 64,
        terrainwidth: 512,
        terrainheight: 512,
				planetsidewidth: 128,
				planetsideheight: 128,
        smoothness: null, // 1.2 to 1.6 is a good range
        heatmap: null,
        imageDataBig: null,
        rawdatalarge: null,
        canvassmall: null,
        sphereObj: null,
        sphcontext: null,
        terrainResult: null,
  			cloud: null,  // Doing clouds or surface.
		  	cratered: null,
        _initPlanetTerrain: function(dataIn, cloud) {
            this.planetData = dataIn;
            this.vradius = this.planetData.radius * 8;
						this.cloud = cloud;
						if (this.planetData.type == SF.TYPE_BELT_DATA) {
	            this.smoothness = 1.5 + SU.r(this.planetData.seed, 301.2)*0.2;
						} else if (cloud) {
	            this.smoothness = 1.1 + SU.r(this.planetData.seed, 301) * this.planetData.atmosphere;
						} else {
	            this.smoothness = 1.2 + 0.4 * SU.r(this.planetData.seed, 501) + this.planetData.atmosphere/5 - this.planetData.tectonics/4;
						}
						this.cratered = this.planetData.atmosphere <= 0.2 && this.planetData.tectonics <= 0.1 && !this.planetData.haswater && !this.planetData.hasmethane && this.planetData.tempmax < 500 && SU.r(this.planetData.seed, 392) < 0.75;
						if (this.cratered) {
							this.smoothness = 2 - (2-this.smoothness)/2;
						}
						if (dataIn.is_battlestation) {
							this.cratered = true;
							this.battlestation = true;
							this.smoothness = 1.9;
						} else if (dataIn.is_refractor) {
							this.cratered = false;
							this.collector = true;
							this.smoothness = 2.5;
						}
        },
				
        renderSmall: function(context, planetx, planety, zoom) {
					if (this.cloud && this.planetData.ggiant) {
						return;
					}
          if (this.canvassmall === null) {
            var imageData;
						if (this.cloud) {
              imageData = this.generateClouds(this.terrainwidthsmall, this.terrainheightsmall)[0];
						} else if (this.planetData.ggiant) {
                imageData = this.generateGasTerrain(this.terrainwidthsmall, this.terrainheightsmall)[0];
            } else {
                imageData = this.generateFractalTerrain(this.terrainwidthsmall, this.terrainheightsmall)[0];
            }

            this.canvassmall = document.createElement('canvas');
            this.canvassmall.width = this.terrainwidthsmall;
            this.canvassmall.height = this.terrainheightsmall;

            var ctx = this.canvassmall.getContext('2d');
            var sphere = new SBar.Sphere(ctx, this.terrainwidthsmall, imageData);
            sphere.renderFrame(0);
          }
					context.save();
					context.translate(planetx, planety);
					context.rotate(this.planetData.tilt/180*Math.PI);
					if (!zoom) {
						zoom = 1;
					}
          context.drawImage(this.canvassmall, 0, 0, this.terrainwidthsmall, this.terrainwidthsmall, -zoom* this.planetData.radius/2, -zoom*this.planetData.radius/2, zoom*this.planetData.radius, zoom*this.planetData.radius);
					context.restore();
        },
				
        renderLarge: function(timeOffset, ctx, x, y, rad) {
					if (this.cloud && this.planetData.ggiant) {
						return;
					}
          if (this.sphereObj === null) {
            if (this.imageDataBig === null) {
						  if (this.cloud) {
                this.imageDataBig = this.generateClouds(this.terrainwidth, this.terrainheight)[0];
						  } else if (this.planetData.ggiant) {
                let objs = this.generateGasTerrain(this.terrainwidth, this.terrainheight);
                this.imageDataBig = objs[0];
                this.rawdatalarge = objs[1];
              } else {
                var objs = this.generateFractalTerrain(this.terrainwidth, this.terrainheight);
                this.imageDataBig = objs[0];
                this.rawdatalarge = objs[1];
              }
            }
            var d = document.createElement('canvas');
            d.width = this.terrainwidth;
            d.height = this.terrainheight;
            this.sphcontext = d.getContext('2d');
            this.sphereObj = new SBar.Sphere(this.sphcontext, this.terrainwidth, this.imageDataBig);
          }
					var windoffset = this.cloud ? (1 + this.planetData.windspeed / 40) : 1;
          this.sphereObj.renderFrame(timeOffset*windoffset);
					if (!ctx) {
						ctx = SC.layer1;
						x = SF.HALF_WIDTH;
						y = SF.HALF_HEIGHT;
						rad = 1;
					}
					if (this.cloud) {
						rad *= 1.01;
					}
					ctx.save();
					ctx.translate(x, y);
					var cloud_tilt = this.cloud ? SU.r(this.planetData.seed,50.8)/10-0.05 : 0;
					ctx.rotate(this.planetData.tilt/180*Math.PI);
          ctx.drawImage(this.sphcontext.canvas, 0, 0, this.terrainwidth, this.terrainheight, -this.vradius*rad, -this.vradius*rad, this.vradius * 2 * rad, this.vradius * 2 * rad);
					ctx.restore();
        },
        renderTerrain: function() {
            if (this.terrainResult !== null) {
                return this.terrainResult;
            }
            if (this.imageDataBig === null) {
							  if (this.cloud) {
	                  this.imageDataBig = this.generateClouds(this.terrainwidth, this.terrainheight)[0];
								} else if (this.planetData.ggiant) {
                    let objs = this.generateGasTerrain(this.terrainwidth, this.terrainheight);
                    this.imageDataBig = objs[0];
                    this.rawdatalarge = objs[1];
                } else {
                    var objs = this.generateFractalTerrain(this.terrainwidth, this.terrainheight);
                    this.imageDataBig = objs[0];
                    this.rawdatalarge = objs[1];
                }
            }
            var d = document.createElement('canvas');
            d.width = this.terrainwidth;
            d.height = this.terrainheight;
            d.getContext('2d').putImageData(this.imageDataBig, 0, 0);
            this.terrainResult = {img: d, data: this.rawdatalarge, heatmap: this.heatmap, imgdata: this.imageDataBig};
            return this.terrainResult;
        },
				
				// Returns an image render of a specific window of the terrain, for a detailed map.
				renderWindow: function(x, y) {
//					let img_data = this.renderWindowData(x, y).imgdata;
					let height = Math.round(this.planetData.GetRawTerrainHeight(x, y));
          let objs = this.generateFractalTerrain(this.terrainwidth, this.terrainheight, height, /*window_seed=*/this.planetData.seed + x*1.17 + y, this.planetData.GetTerrainHeat(x,y));
          var d = document.createElement('canvas');
          d.width = this.terrainwidth;
          d.height = this.terrainheight;
          d.getContext('2d').putImageData(objs[0], 0, 0);
					return d;
				},
				
				// Returns an image render of a specific window of the terrain, for a detailed map (slightly different return params and generate dimensions).
				renderWindowData: function(x, y) {
					// Mostly same as above.
					let height = Math.round(this.planetData.GetRawTerrainHeight(x, y));
  				let objs = this.generateFractalTerrain(this.planetsidewidth, this.planetsideheight, height, /*window_seed=*/this.planetData.seed + x*1.17 + y, this.planetData.GetTerrainHeat(x,y));
          let return_data = {data: objs[1], imgdata: objs[0]};
					return return_data;
				},
				
				// Craters are not additive. They go to a certain depth. Start with shallowest first?
				// TODO: small scaling. 	
				AddCraters: function(width, height, d) {
					if (!this.cratered) {
						return;
					}
					if (this.battlestation && SG.activeTier.type !== SF.TIER_PLANET) {
						// Don't do craters on the detail of a battlestation, since they're not randomly placed.
						return;
					}
					
					var num_craters = Math.floor(SU.r(this.planetData.seed, 66.2)*500)+300;

          var crater_img = document.createElement('canvas');
          crater_img.width = width;
          crater_img.height = height;
          var crater_ctx = crater_img.getContext('2d');
					// Duplicate on both sides for wrapping.
					// TODO
					SU.rect(crater_ctx, 0, 0, width, height, "#000");
					crater_ctx.save();
					var x_stretch = 0.6;
					crater_ctx.transform(x_stretch, 0, 0, 1, 0, 0);
					
					var s = 66.4;
					var max_depth = Math.floor(SU.r(this.planetData.seed, s++)*20)+15;
					if (this.battlestation) {
						max_depth = Math.floor(SU.r(this.planetData.seed, s)*40)+30;
						let num_rows = Math.floor(SU.r(this.planetData.seed,s++)*3)*2+3;
						let num_per_row = Math.floor(SU.r(this.planetData.seed,s++)*8)+2;
						var spread1 = SU.r(this.planetData.seed,s++)*0.3+0.5;
						var spread2 = 1-(SU.r(this.planetData.seed,s++)*0.1)-0.03;
						var depth = max_depth;// Math.floor((i/num_craters)*max_depth);
						var bump = 0;//Math.floor(SU.r(this.planetData.seed,s++)*depth);
						var color_stops = [0.0, 'rgb('+depth+',0,0)', spread1, 'rgb('+depth+',0,0)', spread2, 'rgb(0,'+bump+',0)', 1, 'rgb(0,0,0)'];
						var rad = SU.r(this.planetData.seed, s++)*40*width/512 + width/60;
						//for (var i = 0; i < num_craters; i++) {
						let baseoff = SU.r(this.planetData.seed, s++)*width;
						// Skip the middle row for buildings.
						for (let i = 0; i < num_rows; i++) if (i != (num_rows-1)/2) {
							let y = height*(i+1)/(num_rows+1);//SU.r(this.planetData.seed, s++)*height;
							let offs = i%2 == 0 ? 0 : width/(num_per_row*2);
							offs += baseoff;
							for (let j = 0; j < num_per_row; j++) {
								//var x = SU.r(this.planetData.seed, s++)*width/x_stretch;
								let x = width*(j)/(num_per_row) + offs;//SU.r(this.planetData.seed, s++)*width/x_stretch;
								//if (i%2) x += width*0.5/(num_per_row+1);
					
								x /= x_stretch;
								if (x+rad/x_stretch > width/x_stretch) {
									x -= width/x_stretch;
								}
								SU.circleRad(crater_ctx, x, y, rad, color_stops);
								SU.circleRad(crater_ctx, x+width/x_stretch, y, rad, color_stops);  // Second time to cover edges.							
								/*
								var depth = max_depth;//Math.floor((i/num_craters)*max_depth);
								var bump = 0;//Math.floor(SU.r(this.planetData.seed,s++)*depth);
								//var spread1 = SU.r(this.planetData.seed,s)*0.3+0.5;
								//var spread2 = 1-(SU.r(this.planetData.seed,s)*0.1)-0.03;
								//var color_stops = [0.0, 'rgb('+depth+',0,0)', spread1, 'rgb('+depth+',0,0)', spread2, 'rgb(0,'+bump+',0)', 1, 'rgb(0,0,0)'];
								var color_stops = [0.0, 'rgb('+depth+',0,0)', 1, 'rgb(0,0,0)'];
								var rad = SU.r(this.planetData.seed, s)*20 *width/512;
								var x = SU.r(this.planetData.seed, s+i+1.2)*width/x_stretch;
								var y = SU.r(this.planetData.seed, s+i+1.3)*height;
					
								x /= x_stretch;
								if (x+rad/x_stretch > width/x_stretch) {
									x -= width/x_stretch;
								}
								//width *= 10;
								SU.circleRad(crater_ctx, x, y, rad, color_stops);
								SU.circleRad(crater_ctx, x+width/x_stretch, y, rad, color_stops);  // Second time to cover edges.
								*/
							}
						}
					} else for (var i = 0; i < num_craters; i++) {
						var depth = Math.floor((i/num_craters)*max_depth);
						var bump = Math.floor(SU.r(this.planetData.seed,s++)*depth);
						if (SU.r(this.planetData.seed,s++) < 0.5) {
							bump = 0;
						}
						var spread1 = SU.r(this.planetData.seed,s++)*0.3+0.5;
						var spread2 = 1-(SU.r(this.planetData.seed,s++)*0.1)-0.03;
						var color_stops = [0.0, 'rgb('+depth+',0,0)', spread1, 'rgb('+depth+',0,0)', spread2, 'rgb(0,'+bump+',0)', 1, 'rgb(0,0,0)'];
						var rad = SU.r(this.planetData.seed, s++)*20 *width/512;
						var x = SU.r(this.planetData.seed, s++)*width/x_stretch;
						var y = SU.r(this.planetData.seed, s++)*height;
					
						x /= x_stretch;
						if (x+rad/x_stretch > width/x_stretch) {
							x -= width/x_stretch;
						}
						SU.circleRad(crater_ctx, x, y, rad, color_stops);
						SU.circleRad(crater_ctx, x+width/x_stretch, y, rad, color_stops);  // Second time to cover edges.
					}
					crater_ctx.restore();
          var crater_data = crater_ctx.getImageData(0, 0, width, height).data;
					for (var i = 0; i < width*height; i++) {
						d[i] -= crater_data[i*4];
						// Add outer ring.
						d[i] += crater_data[i*4+1];
					}
				},
				
				/*
				SmearPoles: function(d, width, height) {
					let smear_length = width;
					let line = 0;
					log("height",height)
					while (smear_length > 1 && line < height) {
						let start = line * width;
						for (let i = 0; i < width; i += smear_length) {
							let value = d[i+start];
							for (let j = 1; j < smear_length; j++) {
								d[i+j+start] = value;
							}
						}
						//if (line % 3 == 0)
						//	smear_length /= 2;
							smear_length -= Math.floor(width/7);
						line++;
					}
					
				},
				*/
				
        generateFractalTerrain: function(width, height, /*optional*/window_height, /*optional*/window_seed, /*optional=*/window_heat) {
            // var start = (new Date()).getTime();
            Math.seedrandom(this.planetData.seed);
						if (window_seed) {
							Math.seedrandom(window_seed);
						}
            if (width % 32 !== 0 || height % 32 !== 0) {
                error("generateTerrain dimensions wrong");
            }
            var w = width;
            var h = height;
						
						let horizontal_symmetric = !window_seed;  // Horizontally symettric.

            var rm = []; // reusable random map
            var rmsize = 1117;
            for (var i = 0; i < rmsize; i++) {
                rm[i] = Math.random() - 0.5;
            }
            var rmcount = 0;

            var dsize = w * h;
            var d = []; // data
            d.length = dsize;
            // Seed corner.
            d[0] = 128;
						if (this.battlestation || this.collector) {
							d[0] = 60;  // Dark and no change in color.
						}

            var step = width;
            var puturb = 128;
						let smoothness = this.smoothness;
						if (window_height) {
	            d[0] = window_height;
							puturb = 32;
							if (this.planetData.type == SF.TYPE_BELT_DATA) {
								puturb = 132;
							}
							//smoothness *= 1.2;
						}
            var half = step / 2;

            var nw, ne, sw, se, c, xhalfmodw, xmodw, xstepmodw, ymodhw, ystepmodhw, yhalfmodhw;
            // fractal terrain generation
            while (step > 1) {
                for (var x = 0; x < w; x += step) {
                    xstepmodw = ((x + step) % w);
                    xhalf = x + half;
                    for (var y = 0; y < h; y += step) {
                        y_w = y * w;
                        ystepmodhw = ((y + step) % h) * w;
                        yhalf = (y + half) * w;
                        // grab the 4 corners
                        nw = d[x + y_w];
												if (horizontal_symmetric) {
	                        ne = d[xstepmodw + y_w];
													if (y + step >= h) {
														sw = nw + (rm[rmcount++ % rmsize]) * puturb;
														se = ne + (rm[rmcount++ % rmsize]) * puturb;
													} else {
		                        sw = d[x + ystepmodhw];
		                        se = d[xstepmodw + ystepmodhw];
													}
												} else {
	                        ne = d[xstepmodw + y_w];
	                        se = d[xstepmodw + ystepmodhw];
	                        sw = d[x + ystepmodhw];
													if (x + step >= w) {
														ne = nw + (rm[rmcount++ % rmsize]) * puturb;
														se = nw + (rm[rmcount++ % rmsize]) * puturb;
													}
													if (y + step >= h) {
														sw = nw + (rm[rmcount++ % rmsize]) * puturb;
														se = ne + (rm[rmcount++ % rmsize]) * puturb;
													}
												}
												//let p0 = puturb;
												//if (y < 30 && rm[rmcount++ % rmsize] < (30-y)/20) {
												//	puturb = 0;
												//}

                        // set the 3 subpoints within the 4 corners
                        c = (nw + ne) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                        d[xhalf + y_w] = c;
                        c = (nw + sw) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                        d[x + yhalf] = c;
                        c = (nw + ne + sw + se) / 4 + (rm[rmcount++ % rmsize]) * puturb;
                        d[xhalf + yhalf] = c;
												//puturb = p0;
                    }
                }
                step = half;
                half = half / 2;
                puturb /= smoothness;
            }
						
						if (this.planetData.waterworld) {
							// Push all the terrain below water level.
							for (var i = 0; i < d.length; i++) {
								d[i] = Math.floor(d[i]/2);
							}							
						}
						
						//this.SmearPoles(d, width, height);

            // move the height map over to image data
            var image = document.createElement('canvas');
            image.width = width;
            image.height = height;
            var context = image.getContext('2d');
            var imageData = context.getImageData(0, 0, width, height);
            var data = imageData.data;

            // build a heat map, taking into account max/min temperatures and seasons and terrain height
						let planet_pixels = h;
						if (planet_pixels == this.planetsidewidth) {
							// Special case of planetside drawing with 128 width.
							// This should get cleaned up and parameterized.
							planet_pixels = this.terrainwidth;							
						}
            var ytemp;
            var tempdiff = this.planetData.tempmax - this.planetData.tempmin;
            var diffdist = (Math.abs(this.planetData.maxtemplat) / 90) * planet_pixels / 2 + planet_pixels / 2;  // max distance from hottest latitude to coldest pole, in y-pixels
            var hotlatpixel;
            if (this.planetData.maxtemplat >= 0) {
                hotlatpixel = Math.floor(planet_pixels / 2 - (this.planetData.maxtemplat / 90) * (planet_pixels / 2));
            } else {
                hotlatpixel = Math.floor(planet_pixels / 2 + (this.planetData.maxtemplat / 90) * (planet_pixels / 2));
            }
            var diffpery = tempdiff / diffdist;
            this.heatmap = [];
            this.heatmap.length = dsize;
						
						if (window_heat) {
							let heat_height = d[0];
	            for (var i = 0; i < w*h; i++) {
                this.heatmap[i] = window_heat - tempdiff * (d[i] - heat_height) / 128;
							}
						} else {
	            var i = 0;
	            for (var y = 0; y < h; y++) {
	                ytemp = this.planetData.tempmax - Math.abs(hotlatpixel - y) * diffpery;
	                for (var x = 0; x < w; x++) {
										  // Higher is colder, lower is warmer.
										  // Note tailored atmospheric lapse rates are not currently implemented, since
										  // all planets have similar behavior of adiabatic expansion in the troposphere.
										  // They just differ a bit in the cooling rate (~2x).
	                    //this.heatmap[i] = ytemp - tempdiff * (d[i] - 128) / 128;
	                    this.heatmap[i] = ytemp - tempdiff * (d[i] - 128) / 512;
	                    i++;
	                }
	            }
						}
						this.AddCraters(width, height, d);

            // now build the terrain
            // planet rock rgb
						let rockbase = SU.r(this.planetData.seed, 170);
						var pr = rockbase*205 + SU.r(this.planetData.seed, 171)*50;
						var pg = rockbase*195 + SU.r(this.planetData.seed, 172)*50;
						var pb = rockbase*180 + SU.r(this.planetData.seed, 173)*50;
            pr /= 255;
            pg /= 255;
            pb /= 255;
            // flora rgb, fully randomize
            var fr = SU.r(this.planetData.seed, 301) * 155 + 100;//rtog + 100;
            var fg = SU.r(this.planetData.seed, 302) * 155 + 100;//(155-rtog)+100;//255
            var fb = SU.r(this.planetData.seed, 303) * 155 + 100;//SU.r(this.planetData.seed, 175) * 50;
            fr /= 255;
            fg /= 255;
            fb /= 255;
 						var waterr = Math.floor(SU.r(this.planetData.seed, 171.3)*100);
 						var waterg = Math.floor(SU.r(this.planetData.seed, 171.4)*100);
 						var waterb = Math.floor(SU.r(this.planetData.seed, 171.5)*128);
						if (this.planetData.hasmethane) {
	 						waterr = Math.floor(SU.r(this.planetData.seed, 171.3)*100)+50;
	 						waterg = Math.floor(SU.r(this.planetData.seed, 171.4)*100)+50;
	 						waterb = Math.floor(SU.r(this.planetData.seed, 171.5)*128);
						}
						// Ice.
            ir = SU.r(this.planetData.seed, 172)*20+200;
            ig = SU.r(this.planetData.seed, 173)*20+200;
            ib = SU.r(this.planetData.seed, 174)*35+220;
            ir /= 255;
            ig /= 255;
            ib /= 255;
						
            var lavatemp = this.planetData.lavatemp;
						let num = 0;
            i1 = 0; // source index
            i2 = 0; // target index
						let water = this.planetData.haswater;// || this.planetData.hasmethane;
						let methane = this.planetData.hasmethane;
						let liquid = water || methane;
					  while (i1 < dsize) {
              if (this.heatmap[i1] > lavatemp) {
                  data[i2] = d[i1];
                  data[i2 + 1] = 0;//Math.floor(d[i1]*0.2);
                  data[i2 + 2] = 0;//Math.floor(d[i1]*0.2);
                  data[i2 + 3] = 255;
              } else if (this.heatmap[i1] > 373) {
                  data[i2] = Math.floor(pr * (d[i1])); // reversed to have hotspots look brighter like desert
                  data[i2 + 1] = Math.floor(pg * (d[i1]));
                  data[i2 + 2] = Math.floor(pb * (d[i1]));
                  data[i2 + 3] = 255;
              } else if (this.heatmap[i1] > 243) {
                  if (d[i1] < 128 && water) { // low enough for water
                      data[i2] = waterr;
                      data[i2 + 1] = waterg;
                      data[i2 + 2] = d[i1]+waterb;
                      data[i2 + 3] = 255;
                  } else if (this.planetData.life && d[i1] < 170) {
                      data[i2] = Math.floor(d[i1] * fr);
                      data[i2 + 1] = Math.floor(d[i1] * fg);
                      data[i2 + 2] = Math.floor(d[i1] * fb);
                      data[i2 + 3] = 255;
                  } else if (this.heatmap[i1] > 243) { // barren normal rock
                      data[i2] = Math.floor(pr * ( d[i1]));
                      data[i2 + 1] = Math.floor(pg * (d[i1]));
                      data[i2 + 2] = Math.floor(pb * (d[i1]));
                      data[i2 + 3] = 255;
                  }
              } else if (liquid) { // liquid methane, ice, or co2 another other condensation
								// NOTE these numbers are also used in3planetD.
								if (this.heatmap[i1] > 84 && this.heatmap[i1] < 185 && d[i1] < 128 && methane) {
									// Liquid methane / hydrocarbons.
                  data[i2] = waterr;
                  data[i2 + 1] = waterg;
                  data[i2 + 2] = d[i1]+waterb;
                  data[i2 + 3] = 255;
								} else {  // ice
                  data[i2] = Math.floor(d[i1] * ir);
                  data[i2 + 1] = Math.floor(d[i1] * ig);
                  data[i2 + 2] = Math.floor(d[i1] * ib);
                  data[i2 + 3] = 255;
								}
              } else { // barren rock
                  data[i2] = Math.floor(pr * (d[i1]));
                  data[i2 + 1] = Math.floor(pg * (d[i1]));
                  data[i2 + 2] = Math.floor(pb * (d[i1]));
                  data[i2 + 3] = 255;
              }
              i1++;
              i2 += 4;
            }

            // var end = (new Date()).getTime();
            return [imageData, d];
        },
        generateGasTerrain: function(width, height) {
            var cold = this.planetData.tempmid < 250;
            Math.seedrandom(this.planetData.seed);
						var bands = 1;
						if (Math.random() * 400 < this.planetData.tempmid) {
							// Some giants don't have bands. Colder ones, moreso.
							bands = Math.floor(Math.random() * 5) + 5;
						}
            var proportion = {};
            var totalProportion = 0;
            for (var i = 0; i < bands; i++) {
                proportion[i] = Math.random() + 0.2;
                totalProportion += proportion[i];
            }
            var r1 = 255 - Math.random() * 60;
            var g1 = 210 - Math.random() * 60;
            var b1 = 150 - Math.random() * 60;
            var r2 = 255 - Math.random() * 60;
            var g2 = 235 - Math.random() * 60;
            var b2 = 220 - Math.random() * 60;
            if (cold) {
                r1 = 80 - Math.random() * 60;
                g1 = 110 - Math.random() * 60;
                b1 = 220 - Math.random() * 60;
                r2 = 130 - Math.random() * 60;
                g2 = 190 - Math.random() * 60;
                b2 = 255 - Math.random() * 60;
            }

            for (var i = 0; i < bands; i++) {
                proportion[i] = proportion[i] / totalProportion;
            }

            var rm = []; // reusable random map adjusted for rgb altering
            var rmsize = 1337;
            for (var i = 0; i < rmsize; i++) {
                rm[i] = Math.random() * 10;
            }
            var rmcount = 0;

            var image = document.createElement('canvas');
            image.width = width;
            image.height = height;
            var context = image.getContext('2d');

            var imageData = context.getImageData(0, 0, width, height);
            var data = imageData.data;

            var start = 0;
            var r, g, b;
            for (var band = 0; band < bands; band++) {
                if (band % 2 === 0) {
                    r = r1;
                    g = g1;
                    b = b1;
                } else {
                    r = r2;
                    g = g2;
                    b = b2;
                }
                for (var y = start; y < start + proportion[band] * height / 2 + 1; y++) {
                    var index = y * width * 4;
                    var bindex = (width - y - 1) * width * 4;
                    for (var x = 0; x < width; x++) {
                        data[index] = r + rm[rmcount++ % rmsize];
                        data[index + 1] = g + rm[rmcount++ % rmsize];
                        data[index + 2] = b + rm[rmcount++ % rmsize];
                        data[index + 3] = 255;

                        data[bindex] = r + rm[rmcount++ % rmsize];
                        data[bindex + 1] = g + rm[rmcount++ % rmsize];
                        data[bindex + 2] = b + rm[rmcount++ % rmsize];
                        data[bindex + 3] = 255;

                        index += 4;
                        bindex += 4;
                    }
                }
                start += Math.floor(proportion[band] * height / 2) + 1;
            }

						// Consistent surface for ggiant.
            var dsize = width * height;
            var d = []; // data
            d.length = dsize;
						for (let i = 0; i < dsize; i++) {
							d[i] = 128;
						}

            return [imageData, d];
        },
        // uses the same fractal generation algorithm now, with a higher level of smoothing
        generateClouds: function(width, height) {
            Math.seedrandom(this.planetData.seed+555);
            if (width % 32 !== 0 || height % 32 !== 0) {
                error("generateClouds dimensions wrong " + width + " " + height);
            }
            var w = width;
            var h = height;

            var rm = []; // reusable random map
            var rmsize = 1111;
            for (var i = 0; i < rmsize; i++) {
                rm[i] = Math.random() - 0.5;
            }
            var rmcount = 0;

            var dsize = w * h;
            var d = []; // data
            d.length = dsize;
            // seed corner
            // seed it low, to have the majority non-cloud
            d[0] = 60;

            var step = width;
            var half = step / 2;
            var puturb = 128;

            var nw, ne, sw, se, c, xhalfmodw, xmodw, xstepmodw, ymodhw, ystepmodhw, yhalfmodhw;
            // fractal terrain generation
            while (step > 1) {
                for (var x = 0; x < w; x += step) {
                    xmodw = (x % w);
                    xstepmodw = ((x + step) % w);
                    xhalfmodw = ((x + half) % w);
                    for (var y = 0; y < h; y += step) {
                        ymodhw = (y % h) * w;
                        ystepmodhw = ((y + step) % h) * w;
                        yhalfmodhw = ((y + half) % h) * w;
                        // grab the 4 corners
                        nw = d[xmodw + ymodhw];
                        ne = d[xstepmodw + ymodhw];
                        sw = d[xmodw + ystepmodhw];
                        se = d[xstepmodw + ystepmodhw];

                        // set the 3 subpoints within the 4 corners
                        c = (nw + ne) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                        d[xhalfmodw + ymodhw] = c;
                        c = (nw + sw) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                        d[xmodw + yhalfmodhw] = c;
                        c = (nw + ne + sw + se) / 4 + (rm[rmcount++ % rmsize]) * puturb;
                        d[xhalfmodw + yhalfmodhw] = c;
                    }
                }
                step = half;
                half = half / 2;
                puturb /= this.smoothness;
            }

            var image = document.createElement('canvas');
            image.width = width;
            image.height = height;
            var context = image.getContext('2d');

            context.fillStyle = 'rgba(0,0,0,0)';
            context.fillRect(0, 0, width, height);

            var imageData = context.getImageData(0, 0, width, height);
            var data = imageData.data;

            var r, g, b;
            if (this.planetData.haswater) {
							/*
                r = 245;
                g = 245;
                b = 255;
							*/
              r = SU.r(this.planetData.seed, 302) * 145 + 100;
              g = SU.r(this.planetData.seed, 303) * 145 + 100;
              b = SU.r(this.planetData.seed, 304) * 145 + 110;
            } else if (this.planetData.hasmethane) {
              r = SU.r(this.planetData.seed, 302) * 145 + 110;
              g = SU.r(this.planetData.seed, 303) * 145 + 110;
              b = SU.r(this.planetData.seed, 304) * 145 + 120;
            } else {
                r = SU.r(this.planetData.seed, 302) * 155 + 100;
                g = SU.r(this.planetData.seed, 303) * 155 + 100;
                b = SU.r(this.planetData.seed, 304) * 155;
            }

            var atmo = this.planetData.atmosphere;
            for (i = 0; i < dsize; i++) {
                var di3 = d[i] / 3;
                data[i * 4] = Math.floor(r - di3);
                data[i * 4 + 1] = Math.floor(g - di3);
                data[i * 4 + 2] = Math.floor(b - di3);
                data[i * 4 + 3] = Math.min(255, (d[i] * atmo * 4));

            }

            return [imageData, d];
        },				
    };
})();
