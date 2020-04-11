/*
 * Asteroid. Also used for Starport shop.
 */
(function() {

  SBar.IconAsteroid = function(beltTierIn, indexIn, custom_building_data) {
      this._initIconAsteroid(beltTierIn, indexIn, custom_building_data);
  };

  SBar.IconAsteroid.prototype = {
    type: SF.TYPE_ASTEROID,
    beltTier: null,
    data: null,
    seed: null,
    raceseed: null,
    terrainwidth: 128, // 256
    terrainheight: 128,
    imageDataBig: null,
    transmapBig: null,
    bufferImg: null,
    bufferCtx: null,
    x: null,
    y: null,
    rotx: null, // rotate coordinates to the field's plane
    roty: null,
    tgtcontext: null,
    imgwidth: null,
    imgheight: null,
    himgwidth: null,
    himgheight: null,
    rotation: null,
    asteroidImg: null,
    building_icon: null,
    buildingData: null,
		building_name: null,
		asteroid_name: null,
    _initIconAsteroid: function(beltTierIn, indexIn, custom_building_data) {
      this.beltTier = beltTierIn;
      this.data = this.beltTier.data;
      this.raceseed = this.data.raceseed;
      this.tgtcontext = this.beltTier.context;
      var astd = this.data.asteroids[indexIn];
      this.x = astd.x;
      this.y = astd.y;
      this.buildingData = astd.bdata;
      
      // these are used to draw the lines to the asteroids, isolate the rotated belt components
      //this.rotx = this.x * Math.cos(this.data.angle) - this.y * Math.sin(this.data.angle);
      //this.roty = this.x * Math.sin(this.data.angle) + this.y * Math.cos(this.data.angle);

      this.seed = this.data.seed + this.x + this.y;
      var scale = SU.r(this.seed, 2.1) + 1.5;
      scale *= 1.2;

      this.imgwidth = this.terrainwidth * scale;
      this.imgheight = this.terrainheight * scale;
      this.himgwidth = this.imgwidth / 2;
      this.himgheight = this.imgheight / 2;
      this.rotation = SU.r(this.seed, 3.1) * Math.PI * 2;

      // render
      var objs = this.generateAsteroid(this.terrainwidth, this.terrainheight, this.seed);
      this.imageDataBig = objs[0];
      this.transmapBig = objs[1];

      this.bufferImg = document.createElement('canvas');
      this.bufferImg.width = this.imgwidth;
      this.bufferImg.height = this.imgheight;
      this.bufferCtx = this.bufferImg.getContext('2d');
			if (this.data.is_party_yacht) {
				this.asteroid_name = this.data.name;//.substring(9)+"-"+String.fromCharCode('1'.charCodeAt() + indexIn);
			} else	if (this.data.is_starport) {
				let colors = this.data.StarportColors();
				// Note composite operations won't work well here, since it's a standalone icon.
				SU.circle(this.bufferCtx, this.bufferImg.width/2, this.bufferImg.height/2, this.bufferImg.height/2*0.8,'rgba('+colors.r+','+colors.g+','+colors.b+',1)')
				SU.circle(this.bufferCtx, this.bufferImg.width/2, this.bufferImg.height/2, this.bufferImg.height/2*0.8,undefined,'rgba('+colors.r/2+','+colors.g/2+','+colors.b/2+',1)',10)
				if (this.data.name.startsWith("Starport")) {
					// Strip "Starport ".
					this.asteroid_name = this.data.name.substring(9)+"-"+String.fromCharCode('1'.charCodeAt() + indexIn);
				} else {
					this.asteroid_name = this.data.name+"-"+String.fromCharCode('1'.charCodeAt() + indexIn);
				}
			} else {
	      this.asteroidImg = document.createElement('canvas');
	      this.asteroidImg.width = this.terrainwidth;
	      this.asteroidImg.height = this.terrainheight;
	      var ccontext = this.asteroidImg.getContext('2d');
	      ccontext.putImageData(this.imageDataBig, 0, 0);
	      this.drawAsteroid();
				// Strip "Belt ".
				let name = this.data.name.startsWith("Unknown") ? this.data.name : this.data.name.substring(5);
				this.asteroid_name = name+"-"+String.fromCharCode('1'.charCodeAt() + indexIn);
			}

			if (custom_building_data) {
				//this.objs.push(new SBar.IconCustomBuilding(this.context, this.data, custom_data, floating));
				this.data_clone = SU.Clone(custom_building_data);
				//this.data_clone.x += SF.HALF_WIDTH;
				//this.data_clone.y += SF.HALF_HEIGHT;
				this.building_icon = new SBar.IconCustomBuilding(this.tgtcontext, this.data, this.data_clone, /*floating=*/false);
				this.building_name = this.building_icon.name;
			} else if (this.buildingData !== null && !S$.removed_buildings[this.buildingData.seed]) {
          this.addBuilding();
      }
    },
    addBuilding: function() {
      this.building_icon = new SBar.IconBuilding(this.beltTier.context, this.buildingData);
			this.building_name = this.buildingData.name;
    },
    drawAsteroid: function() {
        this.bufferCtx.save(); // also copied below
        this.bufferCtx.translate(this.himgwidth, this.himgheight);
        this.bufferCtx.rotate(this.rotation);
        this.bufferCtx.drawImage(this.asteroidImg, 0 - this.himgwidth, 0 - this.himgheight, this.imgwidth, this.imgheight);
        this.bufferCtx.restore();
    },
		OverAsteroid: function(x, y) {
      //var offx = this.x+SF.HALF_WIDTH - x;
      //var offy = this.y+SF.HALF_HEIGHT - y;
      var offx = this.x - x;
      var offy = this.y - y;
			return offx*offx + offy*offy < 1800;
		},
    update: function(shipx, shipy) {
//        this.tgtcontext.drawImage(this.bufferImg, SF.HALF_WIDTH - shipx + this.x - this.himgwidth, SF.HALF_HEIGHT - shipy + this.y - this.himgheight, 0, 0 );//this.imgwidth, this.imgheight);
//				this.tgtcontext.drawImage(this.bufferImg, SF.HALF_WIDTH+this.x-50, SF.HALF_HEIGHT+this.y -50, 100, 100);
				this.tgtcontext.drawImage(this.bufferImg, this.x-50, this.y-50, 100, 100);
        if (this.building_icon !== null) {
          this.building_icon.update(shipx,shipy,undefined,undefined,true/*skip_name*/);
        }
        return true;
    },
		// Separate for rendering on top.
		updateName: function(shipx, shipy) {
			var display_name = this.building_name ? this.building_name[0]+" "+this.building_name[1] : this.asteroid_name;
      if (this.OverAsteroid(shipx, shipy)) {
//				SU.text(this.tgtcontext, display_name, this.x+SF.HALF_WIDTH, this.y+SF.HALF_HEIGHT-20, SF.FONT_SB, "#FFF", 'center');
				SU.text(this.tgtcontext, display_name, this.x, this.y-20, SF.FONT_SB, "#FFF", 'center');
				return true;
			}
			return false;
		},
		TryActivate: function(shipx, shipy) {
      if (this.OverAsteroid(shipx, shipy)) {
				this.beltTier.shipx = this.x;
				this.beltTier.shipy = this.y;
	      if (this.building_icon) {
          if (this.building_icon.TryActivate(this.building_icon.data.x, this.building_icon.data.y)) {
		        this.building_icon.data.pushBuildingTier();
          }
	      } else {
					this.beltTier.teardown();
					let planetsider = new SBar.PlanetsideRenderer(this.data, this.x, this.y);
					planetsider.name = this.asteroid_name;
					SU.PushTier(planetsider);
	      }
				return true;
			}
			return false;
		},
    // modified fractal algorithm, one layer for height map, another layer for asteroid shape, and a final pass for craters
    // **this is reused by the map to create a background
    generateAsteroid: function(width, height, seed) {
        var surfsmoothness = 1.1 + SU.r(seed, 1.1) / 3;
        var shapesmoothness = 1.85 + SU.r(seed, 5.1)/10;
        
        if (width % 32 !== 0 || height % 32 !== 0) {
            error("generateAsteroid dimensions wrong " + width + " " + height);
        }
        var w = width;
        var h = height;

        Math.seedrandom(seed);

        var rm = this.data.randoms; // reusable random map
        var rmsize = this.data.randomssize;
        var rmcount = Math.floor(Math.random()*rmsize/2);

        var dsize = w * h;
        var d = []; // data
        d.length = dsize;
        // seed corner
        // seed it low, to have the majority non-cloud

        var step = width;
        var half = step / 2;
        var puturb = 128;

        var hw = w / 2;
        var hh = h / 2;

        d[0] = -75 - rm[rmcount++] * 100;
        d[hw] = -75 - rm[rmcount++] * 100;
        d[hh * w] = -75 - rm[rmcount++] * 100;
        d[hh * w + hw] = 100 + rm[rmcount++] * 50;

        step = half;
        half = half / 2;
        puturb /= shapesmoothness;
        //var start = (new Date()).getTime()

        var nw, ne, sw, se, c, xhalfmodw, xmodw, xstepmodw, ymodhw, ystepmodhw, yhalfmodhw;
        // fractal terrain generation
        while (step > 1) {
            var roundfactor = half / 10; // round middles a bit, to reduce spines
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
                    c = (nw + ne) / 2 + rm[rmcount++ % rmsize] * puturb;
                    d[xhalfmodw + ymodhw] = c + roundfactor;
                    c = (nw + sw) / 2 + rm[rmcount++ % rmsize] * puturb;
                    d[xmodw + yhalfmodhw] = c + roundfactor;
                    c = (nw + ne + sw + se) / 4 + rm[rmcount++ % rmsize] * puturb;
                    d[xhalfmodw + yhalfmodhw] = c + roundfactor;
                }
            }
            step = half;
            half = half / 2;
            puturb /= shapesmoothness;
        }

        // bump map
        // reused fractal algorithm
        var e = []; // data
        e.length = dsize;
        e[0] = 155;
        step = width;
        half = step / 2;
        puturb = 128;
        while (step > 1) {
            for (var x = 0; x < w; x += step) {
                xhalfmodw = ((x + half) % w);
                xstepmodw = ((x + step) % w);
                xmodw = (x % w);
                for (var y = 0; y < h; y += step) {
                    ymodhw = (y % h) * w;
                    ystepmodhw = ((y + step) % h) * w;
                    yhalfmodhw = ((y + half) % h) * w;
                    // grab the 4 corners
                    nw = e[xmodw + ymodhw];
                    ne = e[xstepmodw + ymodhw];
                    sw = e[xmodw + ystepmodhw];
                    se = e[xstepmodw + ((y + step) % h) * w];

                    // set the 3 subpoints within the 4 corners
                    c = (nw + ne) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                    e[xhalfmodw + ymodhw] = c;
                    c = (nw + sw) / 2 + (rm[rmcount++ % rmsize]) * puturb;
                    e[xmodw + yhalfmodhw] = c;
                    c = (nw + ne + sw + se) / 4 + (rm[rmcount++ % rmsize]) * puturb;
                    e[xhalfmodw + yhalfmodhw] = c;
                }
            }
            step = half;
            half = half / 2;
            puturb /= surfsmoothness;
        }

        // keep randoms in here, since array is normalized into -0.5 to 0.5, and it's not a lot of random calls
        var numpits = Math.floor(Math.random() * 100);
        for (var pit = 0; pit < numpits; pit++) {
            var size = Math.floor(Math.random() * Math.random() * 25) + 3;
            var x = Math.floor(Math.random() * (w - 40)) + 20;
            var y = Math.floor(Math.random() * (h - 40)) + 20;
            for (var i = 0 - size; i < size; i++) {
                for (var j = 0 - size; j < size; j++) {
                    var depth = size - Math.sqrt(i * i + j * j);
                    if (depth > 0)
                        e[x + i + (y + j) * w] *= 10 / (10 + depth);
                }
            }
        }

        var image = document.createElement('canvas');
        image.width = width;
        image.height = height;
        var context = image.getContext('2d');

        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, width, height);

        var imageData = context.getImageData(0, 0, width, height);
        var data = imageData.data;

        var r = 1 + (Math.random() - 0.5) / 2;
        var g = 1 + (Math.random() - 0.5) / 2;
        var b = 1 + (Math.random() - 0.5) / 2;
        for (i = 0; i < dsize; i++) {
            var di3 = (d[i] * e[i]) / 130 + 10;//+e[i]/2;
            //di3 = d[i];
            data[i * 4] = di3 * r;//Math.floor(r-di3);
            data[i * 4 + 1] = di3 * g;//Math.floor(g-di3);
            data[i * 4 + 2] = di3 * b;//Math.floor(b-di3);
            if (d[i] >= 10) {
                data[i * 4 + 3] = 255;
            } else if (d[i] >= 0) {
                data[i * 4 + 3] = Math.max(0, d[i] * 25);
            } else {
                data[i * 4 + 3] = 0;
            }
        }

        return [imageData, d];
    }


  };
  SU.extend(SBar.IconAsteroid, SBar.Icon);
})();
