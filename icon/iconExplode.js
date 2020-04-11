(function() {
//    var image = null;
//    var imagectx = null;
    var explodeimgsize = 40;
    var maxtimer = 50;

/*
    SBar.resetExplodeImage = function() {
        image = null;
    }
		*/
    SBar.IconExplode = function(context, x, y, size, timer_off) {
        this._initIconExplode(context, x, y, size, timer_off);
    };
    SBar.IconExplode.prototype = {
        type: SF.TYPE_EXPLODE,
        context: null,
        x1: null,
        y1: null,
        x2: null,
        y2: null,
        x3: null,
        y3: null,
        size: null,
        timer: null,
        rot1: null,
        rot2: null,
        rot3: null,
  			image: null,
        _initIconExplode: function(context, x, y, size, timer_off) {
            this.context = context;
            this.size = size;
            this.timer = 5;
						if (timer_off) {
							this.timer -= timer_off
						}
            this.x1 = x + Math.random() * size * 4 - size * 2;
            this.y1 = y + Math.random() * size * 4 - size * 2;
            this.x2 = x + Math.random() * size * 4 - size * 2;
            this.y2 = y + Math.random() * size * 4 - size * 2;
            this.x3 = x + Math.random() * size * 4 - size * 2;
            this.y3 = y + Math.random() * size * 4 - size * 2;
            this.rot1 = Math.random() * Math.PI * 2;
            this.rot2 = Math.random() * Math.PI * 2;
            this.rot3 = Math.random() * Math.PI * 2;
            this.initImage();
        },
        initImage: function() {
            this.image = document.createElement('canvas');
            this.image.width = explodeimgsize;
            this.image.height = explodeimgsize;
            imagectx = this.image.getContext('2d');

            imagectx.save();
            imagectx.translate(explodeimgsize / 2, explodeimgsize / 2);

            var width = explodeimgsize / 10 * (Math.random()+0.45);
            for (var i = 0; i < 100; i++) {
                imagectx.rotate(Math.random());
                var x = Math.random() * (explodeimgsize / 2 - width);
                var r = Math.floor(Math.random() * 150) + 105;
                var g = Math.floor(Math.random() * 100);
                var b = Math.floor(Math.random() * 50);
                SU.circle(imagectx, x, 0, width, 'rgba(' + r + ',' + g + ',' + b + ',0.2)');
            }
            imagectx.restore();
        },
        update: function(shipx, shipy, mirror) {
            this.timer++;
						if (this.timer < 5) return true;  // Waiting to start.
            var modsize = explodeimgsize * this.size * this.timer / maxtimer;
            var fade = 1 - (this.timer / maxtimer);
            this.context.globalAlpha = fade;
            this.draw(shipx, shipy, mirror, modsize, this.x1, this.y1, this.rot1);
            this.draw(shipx, shipy, mirror, modsize, this.x2, this.y2, this.rot2);
            this.draw(shipx, shipy, mirror, modsize, this.x3, this.y3, this.rot3);
            this.context.globalAlpha = 1;
            if (this.timer >= maxtimer) {
                return false;
            } else {
                return true;
            }
        },
        draw: function(shipx, shipy, mirror, modsize, x, y, rot) {
            var offx = x - shipx;
            var offy = y - shipy;
            this.context.save();
            this.context.translate(offx + SF.HALF_WIDTH, offy + SF.HALF_HEIGHT);
            this.context.rotate(rot);
            this.context.drawImage(this.image, 0, 0, explodeimgsize, explodeimgsize, 0 - modsize / 2, 0 - modsize / 2, modsize, modsize);
            this.context.restore();
            if (mirror) {
                this.context.save();
                this.context.translate(offx + SF.HALF_WIDTH + mirror, offy + SF.HALF_HEIGHT);
                this.context.rotate(rot);
                this.context.drawImage(this.image, 0, 0, explodeimgsize, explodeimgsize, 0 - modsize / 2, 0 - modsize / 2, modsize, modsize);
                this.context.restore();
            }
        }

    };
    SU.extend(SBar.IconExplode, SBar.Icon);
})();	
