/*
 * Button utilities
 * Operates only on the top button layer to keep things efficient
 * TODO: move button layer above char layer when rewriting stuff
 */
(function() {
    var buttons = null; // {x, y, w, h, img, call}
    var bover = null; // current button hovered over
    var bdown = null; // current button pressed
    var ctx = null;
    var buf = 5; // edge around image
    var colorStopsNormal = [0, 'rgba(100,100,100,0.5)', 1, 'rgba(0,0,0,0.25)'];
    var colorStopsOver = [0, 'rgba(50,50,50,0.75)', 1, 'rgba(0,0,0,0.5)'];
    var colorStopsDown = [0, 'rgba(155,155,155,0.7)', 1, 'rgba(0,0,0,0.25)'];

    SBar.Button = function() {
        this._initButton();
    };
    SBar.Button.prototype = {
        _initButton: function() {
            buttons = [];
        },
        // Needs to be called after context is created
        setContext: function(ctxIn) {
            ctx = ctxIn;
        },
        // returns a button object that can be removed
        // x and y and w and h are full button dimensions. The image will be smaller by buf on each side
        add: function(x, y, image, clickCallback, w, h) { // width and height are optional
            if (w === undefined) {
                w = image.width + buf * 2;
            }
            if (h === undefined) {
                h = image.height + buf * 2;
								if (image.overdrawn) {
	                h = image.height*0.67 + buf * 2;
								}
            }
            var rad = Math.min(h, w) / 10;
            var b = {x: x, y: y, w: w, h: h, img: image, call: clickCallback, rad: rad};
            buttons.push(b);
            this.draw(b, colorStopsNormal);
            return b;
        },
        imgText: function(text, size, width, /*optional*/yoff) {
					if (!yoff) yoff = 0;
          var img = document.createElement('canvas');
          img.width = width;
          img.height = size * 1.5;
					img.overdrawn = true;
          var context = img.getContext('2d');
          context.font = ' ' + size + 'pt '+SF.FONT;
          context.fillStyle = '#FFF';
          context.textAlign = 'center';
          context.fillText(text, width / 2, size+yoff);
          return img;
        },				
        remove: function(obj) {
            if (obj === null)
                return;
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                if (b.x === obj.x && b.y === obj.y) { // should be enough, buttons don't overlap
                    ctx.clearRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
                    buttons.splice(i, 1);
				            bdown = null;
				            bover = null;
                    break;
                }
            }
        },
        // Saves off all buttons
        get: function() {
            return buttons;
        },
        // Restores some saved buttons
        put: function(buttonsIn) {
            this.clear();
            buttons = buttonsIn;
            this.drawAll();
        },
        // Removes all
        clear: function() {
					if (SU.bubbleTimeout) {
                window.clearTimeout(SU.bubbleTimeout);
                delete SU.bubbleTimeout;
            }
            ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            delete buttons;
            buttons = [];
            bdown = null;
            bover = null;
        },
        drawAll: function() {
            ctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            for (var i = 0; i < buttons.length; i++) {
                this.draw(buttons[i], colorStopsNormal);
            }
        },
        draw: function(b, colorStops, clear/*optional*/) {
            if (clear !== undefined && clear === true) {
                ctx.clearRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4); // a little buffer for overdraw from stroke
            }
            // rectGrad: function(context, x, y, width, height, x1, y1, x2, y2, colorStops, stroke, strokeWidth) {        
            //SU.rectGrad(ctx, b.x, b.y, b.w, b.h, 0, b.y, 0, b.y + b.h, colorStops);
            var r = b.rad;

            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(b.w - r, 0);
            ctx.arc(b.w - r, r, r, Math.PI * 3 / 2, 0);
            ctx.lineTo(b.w, b.h - r);
            ctx.arc(b.w - r, b.h - r, r, 0, Math.PI / 2);
            ctx.lineTo(r, b.h);
            ctx.arc(r, b.h - r, r, Math.PI / 2, Math.PI);
            ctx.lineTo(0, r);
            ctx.arc(r, r, r, Math.PI, Math.PI * 3 / 2);
            ctx.closePath();
            ctx.restore();

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000";
            ctx.stroke();

            var grd = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
            for (var n = 0; n < colorStops.length; n += 2) {
                grd.addColorStop(colorStops[n], colorStops[n + 1]);
            }
            ctx.fillStyle = grd;
            ctx.fill();

						if (b.img.overdrawn) {
							// Handling for text to be larger than the image box.
	            ctx.drawImage(b.img, 0, 0, b.img.width, b.img.height, b.x + buf, b.y + buf, b.w - buf * 2, b.h*1.2 - buf * 2);
						} else {
	            ctx.drawImage(b.img, 0, 0, b.img.width, b.img.height, b.x + buf, b.y + buf, b.w - buf * 2, b.h - buf * 2);
						}
        },
        // handle mouse movement
        mMove: function(x, y) {
          var b = this.find(x, y);
          if (b === null) {
            // over nothing, reset all
            if (bover !== null) {
              this.draw(bover, colorStopsNormal, true);
              bover = null;
            }
            if (bdown !== null) {
              this.draw(bdown, colorStopsNormal, true);
              bdown = null;
            }
          } else {
            if (bover !== null && bover.x === b.x && bover.y === b.y) {
              return; // already over or pressed, don't color over
            }
						if (bover !== null) {
							// Another button is highlighted, need to deselect it.
              this.draw(bover, colorStopsNormal, true);
						}
            bover = b;
            this.draw(b, colorStopsOver, true);
          }
        },
        // mouse down
        mDown: function(x, y) {
            var b = this.find(x, y);
            if (b !== null) {
                bdown = b;
                this.draw(b, colorStopsDown, true);
            }
        },
        // mouse up
        mUp: function(x, y) {
            var b = this.find(x, y);
            if (b !== null) {
                // make sure same button was pressed
                if (bdown !== null && b.x === bdown.x && b.y === bdown.y) {
                    bover = b;
                    bdown = null;
                    this.draw(b, colorStopsOver, true);
                    if (b.call !== undefined && b.call !== null) {
                        b.call(); // run the click action
                        return true;
                    }
                }
            }
            return false;
        },
        // Finds button at x,y, or returns null
        find: function(x, y) {
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                if (b.x <= x && b.y <= y && b.x + b.w >= x && b.y + b.h >= y) {
                    return b;
                }
            }
            return null;
        },
        buttX: function(callback) {
            SB.add(SF.WIDTH - 80, SF.HEIGHT - 80, SM.buttX, callback, 60, 60);
        },
        buttC: function(callback) {
            SB.add(SF.WIDTH - 50, SF.HEIGHT - 80, SM.buttCheck, callback, 60, 60);
        },
				GetButtonOver: function() {
					return bover;
				},
    };
})();

SB = new SBar.Button();
SG.sb_is_ready = true;
