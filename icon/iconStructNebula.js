/*
 * For drawing a nebula in the background.
 */
(function() {

    var STAMP_SIZE = 16;
    var IMAGE_SIZE = 200;

    SBar.IconStructNebula = function(tier, data) {
        this._initIconStructNebula(tier, data);
    };

    // NOTE: this is also created directly by the system to copy over a background
    SBar.IconStructNebula.prototype = {
        type: SF.TYPE_STRUCT_NEBULA,
        data: null,
        image: null,
        imagedata: null,
        rendered: false,
        tier: null, // active system tier
        renderdist: null,
        rad2: null, //rad squared for fast compare
        entered: false,
        _initIconStructNebula: function(tier, data) {
            this.tier = tier;
            this.data = data;
            this.seed = SU.r(this.data.parent.seed, this.data.x + this.data.y);
            this.renderdist = ((SF.WIDTH+SF.HEIGHT)/2 + this.data.rad);  // Could be a hypotenuse. Using this for convenience.
            this.renderdist = this.renderdist * this.renderdist;
            this.titledist = this.data.rad * this.data.rad;
        },
				// OBSOLETE / UNUSED.
        buildImage: function() {
            var seed = this.seed;
            var stamp = document.createElement('canvas');
            stamp.width = STAMP_SIZE;
            stamp.height = STAMP_SIZE;
            var context = stamp.getContext('2d');

            var imageData = context.getImageData(0, 0, STAMP_SIZE, STAMP_SIZE);
            var data = imageData.data;
            var dsize = STAMP_SIZE * STAMP_SIZE;

            var rm = [];
            for (var i = 0; i < 260; i++) {
                rm.push(SU.r(seed, i + 1.07) - 0.5);
            }
            /* REUSED */

            //   var rm = this.data.randoms; // reusable random map
            var rmsize = rm.length;
            var rmcount = 0;

            ////
            var smoothness = 2.0;

            var w = STAMP_SIZE;
            var h = STAMP_SIZE;
            var hh = STAMP_SIZE / 2;
            var hw = STAMP_SIZE / 2;
            var dsize = w * h;
            var d = []; // data
            d.length = dsize;
            // seed corner
            // seed it low, to have the majority non-cloud
            d[0] = -70;
            d[hw] = -70;
            d[hh * w] = -70;
            d[hh * w + hw] = 100;

            var step = w;
            var half = step / 2;
            var puturb = 128;

            step = half;
            half = half / 2;
            puturb /= smoothness;

            var nw, ne, sw, se, c, xhalfmodw, xmodw, xstepmodw, ymodhw, ystepmodhw, yhalfmodhw;
            // fractal terrain generation, algorithm reused
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
                        c = (nw + ne) / 2 + rm[rmcount++ % rmsize] * puturb;
                        d[xhalfmodw + ymodhw] = c;
                        c = (nw + sw) / 2 + rm[rmcount++ % rmsize] * puturb;
                        d[xmodw + yhalfmodhw] = c;
                        c = (nw + ne + sw + se) / 4 + rm[rmcount++ % rmsize] * puturb;
                        d[xhalfmodw + yhalfmodhw] = c;
                    }
                }
                step = half;
                half = half / 2;
                puturb /= smoothness;
            }

            var e = []; // e is brightness, d is transparency
            e.length = dsize;
            e[0] = 50;
            step = w;
            half = step / 2;
            puturb = 128;

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
                        nw = e[xmodw + ymodhw];
                        ne = e[xstepmodw + ymodhw];
                        sw = e[xmodw + ystepmodhw];
                        se = e[xstepmodw + ystepmodhw];

                        // set the 3 subpoints within the 4 corners
                        c = (nw + ne) / 2 + rm[rmcount++ % rmsize] * puturb;
                        e[xhalfmodw + ymodhw] = c;
                        c = (nw + sw) / 2 + rm[rmcount++ % rmsize] * puturb;
                        e[xmodw + yhalfmodhw] = c;
                        c = (nw + ne + sw + se) / 4 + rm[rmcount++ % rmsize] * puturb;
                        e[xhalfmodw + yhalfmodhw] = c;
                    }
                }
                step = half;
                half = half / 2;
                puturb /= smoothness;
            }

            var r = SU.r(seed, 101) * 2 + 1;
            var g = SU.r(seed, 102) * 2 + 1;
            var b = SU.r(seed, 103) * 2 + 1;
            var color = SU.r(seed, 104);
            if (color > 0.667) {
                r = 0;
            } else if (color > 0.333) {
                g = 0;
            } else {
                b = 0;
            }
            for (var i = 0; i < dsize; i++) {
                var di3 = e[i];
                data[i * 4] = di3 * r;
                data[i * 4 + 1] = di3 * g;
                data[i * 4 + 2] = di3 * b;
                data[i * 4 + 3] = Math.min(d[i], di3 / 2);
            }
            /* end REUSED */


            context.putImageData(imageData, 0, 0);

            this.image = document.createElement('canvas');
            this.image.width = IMAGE_SIZE;
            this.image.height = IMAGE_SIZE;
            var context = this.image.getContext('2d');


            var passes = 20 + SU.r(seed, 55) * this.data.rad / 15;

            context.translate(IMAGE_SIZE / 2, IMAGE_SIZE / 2);
            while (passes > 0) {
                var x = IMAGE_SIZE * SU.r(seed, passes + 0.5) / 3;
                var y = 0;//IMAGE_SIZE * SU.r(seed, passes + 1.5);
                var size2 = SU.r(seed, passes + 0.25) * 130 + 50;
                var hypot = Math.sqrt((size2 / 2) * (size2 / 2) + (size2 / 2) * (size2 / 2));
                if (x + hypot > IMAGE_SIZE / 2) {
                    x = IMAGE_SIZE / 2 - hypot;
                }
                context.save();
                context.rotate(SU.r(seed, passes + 0.35) * Math.PI * 2); // first to random circular area
                context.translate(x, y);
                context.rotate(SU.r(seed, passes + 0.75) * Math.PI * 2);
                context.drawImage(stamp, 0 - size2 / 2, 0 - size2 / 2, size2, size2);
                context.restore();
                passes--;
            }
            context.restore();

            this.imagedata = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;

        },
				// OBSOLETE / UNUSED. And above.
/*				
        update: function(shipx, shipy) {
            var offx = this.data.x - shipx;
            var offy = this.data.y - shipy;
            var d2 = offx * offx + offy * offy;
            if (d2 < this.renderdist) {
                if (!this.rendered) {
                    this.buildImage();
                    this.rendered = true;
                }
                if (d2 < this.titledist && !this.entered) {
                    this.entered = true;
                    this.tier.enterStruct(this.data);
                } else if (d2 > this.titledist && this.entered) {
                    this.entered = false;
                    this.tier.leaveStruct(this.data);
                }

                this.tier.context.drawImage(this.image, 0, 0, IMAGE_SIZE, IMAGE_SIZE, offx - this.data.rad + SF.HALF_WIDTH, offy - this.data.rad + SF.HALF_HEIGHT, this.data.rad * 2, this.data.rad * 2);
            }

            return true;
        },
				*/
        updateForSystem: function(shipx, shipy, context) {
					var rad = this.data.rad * 3;
          if (!context) {
              context = this.tier.context;
          }
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
          context.drawImage(this.image, 0, 0, IMAGE_SIZE, IMAGE_SIZE, offx - rad + SF.HALF_WIDTH, offy - rad + SF.HALF_HEIGHT, rad * 2, rad * 2);
					/*
            if (!context) {
                context = this.tier.context;
            }
            var offx = this.data.x - shipx;
            var offy = this.data.y - shipy;
            context.globalAlpha = 0.25;
            context.drawImage(this.image, 0, 0, IMAGE_SIZE, IMAGE_SIZE, SF.SYSTEM_ZOOM * (offx - this.data.rad) + SF.HALF_WIDTH, SF.SYSTEM_ZOOM * (offy - this.data.rad) + SF.HALF_HEIGHT, SF.SYSTEM_ZOOM * this.data.rad * 2, SF.SYSTEM_ZOOM * this.data.rad * 2);
            context.globalAlpha = 1;
					*/
        },
        // checks if a spot is bright enough for lightning
        canSpark: function(x, y) {
            var index = (Math.floor(x) * IMAGE_SIZE + Math.floor(y)) * 4;
            return (this.imagedata[index + 3] > 50);
        },
        teardown: function() {
        }
    };
    SU.extend(SBar.IconStructNebula, SBar.Icon);
})();

	
