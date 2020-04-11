/*
 * Visited temple effect
 * Black or white particles. or just reverse the white one?
 * 
 * Algorithm is to use two images, so that it fades out as it goes out. use alpha and flip between the two
 * 
 * Black - pull it in, dark in background
 * 
 */
(function() {
    var size = 120;

    SBar.IconTempleEffect = function(context, x, y, white) {
        this._initIconTempleEffect(context, x, y, white);
    };

    SBar.IconTempleEffect.prototype = {
        type: SF.TYPE_ICON_GENERIC,
        tier: null,
        white: true,
        x: null,
        y: null,
        i1: null,
        i1c: null,
        i2: null,
        i2c: null,
        ialpha: null,
        ialphac: null,
        context: null,
        _initIconTempleEffect: function(context, x, y, white) {
            this.x = x;
            this.y = y;
            this.white = white;
            this.context = context;

            this.i1 = document.createElement('canvas');
            this.i1.width = size;
            this.i1.height = size;
            this.i1c = this.i1.getContext('2d');
            //SU.circle(this.i1c, size / 2, size / 2, size / 2, 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')');
            if (this.white) {
                SU.rect(this.i1c, 0, 0, size, size, 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')');
            } else {
                SU.rect(this.i1c, 0, 0, size, size, '#000');
            }
            this.i2 = document.createElement('canvas');
            this.i2.width = size;
            this.i2.height = size;
            this.i2c = this.i2.getContext('2d');

            this.ialpha = document.createElement('canvas');
            this.ialpha.width = size;
            this.ialpha.height = size;
            this.ialphac = this.ialpha.getContext('2d');
            var colorStops = [0, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0)'];
            SU.circleRad(this.ialphac, size / 2, size / 2, size / 2, colorStops);
            this.pattern = this.i1c.createPattern(this.ialpha, "repeat");

        },
        update: function(shipx, shipy, fromplanet, scalex, scaley) {
            this.i1c.globalCompositeOperation = 'source-over';
            if (this.white) {
                // outward
                SU.circle(this.i1c, Math.random() * size / 2 + size / 4, Math.random() * size / 2 + size / 4, 2, 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')');
                this.i1c.drawImage(this.i1, -3, -3, size + 6, size + 6);
            } else {
                SU.circle(this.i1c, Math.random() * (size - 12) + 6, Math.random() * (size - 12) + 6, 3, 'rgb(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ')');
                this.i1c.drawImage(this.i1, 3, 3, size - 6, size - 6);
            }

            this.i1c.globalCompositeOperation = 'copy';
            this.i2c.drawImage(this.i1, 0, 0, size, size);
            this.i2c.save();
            this.i2c.globalCompositeOperation = 'destination-in';
            this.i2c.fillStyle = this.pattern;
            this.i2c.fillRect(0, 0, size, size);
            this.i2c.restore();

            var offx = this.x - shipx;
            var offy = this.y - shipy;
						if (scalex) {
							offx *= scalex; // Actually scalex.
							offy *= scaley;
						}
						if (!fromplanet) {
							offx += SF.HALF_WIDTH;
							offy += SF.HALF_HEIGHT;
						}
            var d = Math.sqrt(offx * offx + offy * offy);
            //if (this.white && d < size * 1.5) { // just be in the general area
            //    S$.MaxEnergy();
            //}
            this.context.drawImage(this.i2, offx - size / 2, offy - size / 2);
            return true;
        }
    };
    SU.extend(SBar.IconTempleEffect, SBar.Icon);
})();
