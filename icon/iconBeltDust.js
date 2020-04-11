/*
 * Asteroid Belt Dust
 */
(function() {

    SBar.IconBeltDust = function(beltTierIn, level, seed) {
        this._initBeltDust(beltTierIn, level, seed);
    };

    SBar.IconBeltDust.prototype = {
        type: SF.TYPE_DUST,
        imagesize: 500, // dust image size
        dustsize: 32,
				dustrad: 18, // Lower is denser dust.
        seed: null,
        beltTier: null,
        data: null,
        tgtcontext: null,
        dustimage: null,
        fullsize: null, // full image drawn size
        movemod: null, // how fast to move the image

        _initBeltDust: function(beltTierIn, level, seed) {
            this.beltTier = beltTierIn;
            this.data = this.beltTier.data;
            this.tgtcontext = this.beltTier.context;

            this.seed = seed;
            this.fullsize = 1500;//this.data.tilesize * this.data.tilew * 1.5;
            this.movemod = 0.8;
            this.fullsize /= Math.pow(2, 3 - level);
            this.movemod /= Math.pow(2, 3 - level);
            this.generateDust(this.buildDustStamp()); // relies on dust stamp being generated	
        },
        // stamp used as a singleton for the belt
        buildDustStamp: function() {
            //var start = (new Date()).getTime()
            var image = document.createElement('canvas');
            image.width = this.dustsize;
            image.height = this.dustsize;
            var context = image.getContext('2d');

            var imageData = context.getImageData(0, 0, this.dustsize, this.dustsize);
            var data = imageData.data;


            var rm = this.data.randoms; // reusable random map
            var rmsize = this.data.randomssize;
            var rmcount = 0;

            ////
            var smoothness = 2.0;

            var w = this.dustsize;
            var h = this.dustsize;
            var hh = this.dustsize / 2;
            var hw = this.dustsize / 2;
            var dsize = w * h;
            var d = []; // data
            d.length = dsize;
            // seed corner
            // seed it low, to have the majority non-cloud
            d[0] = -70;
            d[hw] = -70;
            d[hh * w] = -70;
            d[hh * w + hw] = 128;

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
						//e[0] = Math.floor(SU.r(this.seed, 88.1)*150)+20
            e[0] = 20;
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

            var r = (this.data.systemData.r + 400) / 655;
            var g = (this.data.systemData.g + 400) / 655;
            var b = (this.data.systemData.b + 400) / 655;
            for (var i = 0; i < dsize; i++) {
                var di3 = e[i];
                data[i * 4] = di3 * r;
                data[i * 4 + 1] = di3 * g;
                data[i * 4 + 2] = di3 * b;
                data[i * 4 + 3] = d[i];
            }
            context.putImageData(imageData, 0, 0);
            //var end = (new Date()).getTime()
            return image;
        },
        update: function(x, y, zoom) {
            //this.tgtcontext.drawImage(this.dustimage, SF.HALF_WIDTH - this.beltTier.x * this.movemod - this.fullsize / 2, SF.HALF_HEIGHT - this.beltTier.y * this.movemod - this.fullsize / 2, this.fullsize, this.fullsize);
						this.tgtcontext.drawImage(this.dustimage, x-this.fullsize*zoom/2, y-this.fullsize*zoom/2, this.fullsize*zoom, this.fullsize*zoom);
            return true;
        },
        // Density similar to the asteroid generation algorithm
        generateDust: function(stamp) {
            var passes;
            //if (level == 3) {
            //	passes = 150;
            //} else {
            passes = 300 + SU.r(this.seed, 55) * 400;
            //}

            //var rad = Math.min(15, this.beltTier.radius/3);
            var xoff = Math.cos(- this.data.angle);
            var yoff = Math.sin(- this.data.angle);

            this.dustimage = document.createElement('canvas');
            this.dustimage.width = this.imagesize;
            this.dustimage.height = this.imagesize;
            var context = this.dustimage.getContext('2d');

            context.fillStyle = 'rgba(0,0,0,0)';
            context.fillRect(0, 0, this.imagesize, this.imagesize);

            while (passes > 0) {
                var pos = (SU.r(this.seed, passes+8.21) * 2 - 1) * SU.r(this.seed, passes + 8.22) * this.dustrad;
                var x = pos * xoff;
                var y = pos * yoff;
                var centerdist = Math.sqrt(x * x + y * y);
                var width = Math.sqrt(this.dustrad - centerdist) / 2;
                x += width * (SU.r(this.seed, passes + 8.23) * 2 - 1) * 1.5;
                y += width * (SU.r(this.seed, passes + 8.24) * 2 - 1) * 1.5;

                x *= 25; // 500 px image / 20 blocks wide
                y *= 25;
                context.save();
                context.translate(x + this.imagesize / 2, y + this.imagesize / 2);
                context.rotate(SU.r(this.seed, passes + 8.25) * Math.PI * 2);
                var size2 = SU.r(this.seed, passes + 8.26) * this.dustsize + this.dustsize / 2;
                context.drawImage(stamp, 0 - size2 / 2, 0 - size2 / 2, size2, size2);
                context.restore();
                passes--;
            }
        }
    };
    SU.extend(SBar.IconBeltDust, SBar.Icon);
})();
