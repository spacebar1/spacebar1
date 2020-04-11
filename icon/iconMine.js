/*
OBSOLETE
OBSOLETE
OBSOLETE
OBSOLETE
*/
/*
 * Mine Icon
 * 
 xx
 5  Types?
 magnetic
 proximity
 contact
 (laser tower)
 light up when getting close??
 stealth
 
 */
(function() {

    var imagesize = 50;
    var darkimage = null;
    var darkimagectx = null;
    var activeimage = null;
    var activeimagectx = null;

    SBar.IconMine = function(tier, data) {
        this._initMine(tier, data);
    };

    SBar.IconMine.prototype = {
        type: SF.TYPE_MINE_WEAPON,
        tier: null,
        data: null,
        tgtcontext: null,
        x: null,
        y: null,
        uid: null,
        activated: false,
        imagesize: 50,
        minesize: 20,
        linewidth: 4,
        startx: 0,
        starty: 0,
        image: null, // link to dark or active image
        explodeIcon: null,
        _initMine: function(tier, data) {
            this.tier = tier;
            this.data = data;
            this.tgtcontext = this.tier.context;
            this.x = this.data.x;
            this.y = this.data.y;
            this.uid = this.data.uid;

            this.startx = this.x;
            this.starty = this.y;
            this.level = this.data.level;

            if (darkimage === null) {
                this.buildImages();
            }
            this.image = darkimage;
        },
        // make this static
        buildImages: function() {
            // dark image
            darkimage = document.createElement('canvas');
            darkimage.width = imagesize;
            darkimage.height = imagesize;
            darkimagectx = darkimage.getContext('2d');
            var colorStops = [0, 'rgba(0,0,150,1)', 1, 'rgba(0,0,0,1)'];
            SU.circleRad(darkimagectx, imagesize / 2, imagesize / 2, this.minesize / 2 - 2, colorStops);
            var colorStops = [/*0, 'rgba(0,0,0,1)',*/ 0, 'rgba(150,150,150,1)', 1, 'rgba(0,0,0,1)'];
            SU.rectRad(darkimagectx, imagesize / 2 - this.linewidth / 2, imagesize / 2 - this.minesize / 2, this.linewidth, this.minesize, imagesize / 2, imagesize / 2, this.minesize / 2, colorStops);
            SU.rectRad(darkimagectx, imagesize / 2 - this.minesize / 2, imagesize / 2 - this.linewidth / 2, this.minesize, this.linewidth, imagesize / 2, imagesize / 2, this.minesize / 2, colorStops);

            // active image
            activeimage = document.createElement('canvas');
            activeimage.width = imagesize;
            activeimage.height = imagesize;
            activeimagectx = activeimage.getContext('2d');
            var colorStops = [0, 'rgba(50,50,255,1)', 1, 'rgba(0,0,150,1)'];
            SU.circleRad(activeimagectx, imagesize / 2, imagesize / 2, this.minesize / 2 - 2, colorStops);
            var colorStops = [/*0, 'rgba(0,0,0,1)',*/ 0, 'rgba(150,150,150,1)', 1, 'rgba(0,0,0,1)'];
            SU.rectRad(activeimagectx, imagesize / 2 - this.linewidth / 2, imagesize / 2 - this.minesize / 2, this.linewidth, this.minesize, imagesize / 2, imagesize / 2, this.minesize / 2, colorStops);
            SU.rectRad(activeimagectx, imagesize / 2 - this.minesize / 2, imagesize / 2 - this.linewidth / 2, this.minesize, this.linewidth, imagesize / 2, imagesize / 2, this.minesize / 2, colorStops);
        },
        update: function(shipx, shipy) {
            var magdist = 200;
            var explodedist = 25;
            var magspeed = 3; // maximum attraction speed

            var offx = this.x - shipx;
            var offy = this.y - shipy;
            var dist = Math.sqrt(offx * offx + offy * offy);
            if (this.explodeIcon !== null) {
                var ret = this.explodeIcon.update(shipx, shipy);
                if (ret === false) {
                    delete this.explodeIcon;
                }
                return ret;
            } else if (dist < explodedist) {
                //S$.minehit(this.level * 50 + 30);
								error("TODO: minehit");
                this.explodeIcon = new SBar.IconExplode(this.tier, this.x, this.y, this.imagesize/10);
                return true;
            } else if (dist < magdist) {
                if (!this.activated) {
                    this.activated = true;
                    this.image = activeimage;
                }
                var speed = (magdist - dist) / magdist * magspeed / (dist + 0.000001); // dist portion to normalize to 1
                this.x -= offx * speed;
                this.y -= offy * speed;
            } else if (this.startx !== this.x || this.starty !== this.y) {
                // move back to starting location
                if (this.activated) {
                    this.activated = false;
                    this.image = darkimage;
                }
                var offx2 = this.x - this.startx;
                var offy2 = this.y - this.starty;
                var dist2 = Math.sqrt(offx2 * offx2 + offy2 * offy2);
                if (dist2 < 2) {
                    this.x = this.startx;
                    this.y = this.starty;
                } else {
                    this.x -= magspeed / 10 * offx2 / dist2;
                    this.y -= magspeed / 10 * offy2 / dist2;
                }
            }
            this.tgtcontext.drawImage(this.image, offx - imagesize / 2 + SF.HALF_WIDTH, offy - imagesize / 2 + SF.HALF_HEIGHT);
            return true;
        }
    };
})();


