/*
 * Text tooltip utilities
 * Based on button implementation
 */
(function() {
    var POS_X = 280;
    var POS_Y = 280;
    var WIDTH = 440;
    var buttons = null; // {x, y, w, h, text}
    var bover = null; // current button hovered over
    var ctx = null;
    var height = 0;
		icon_size = 100;

    JTact.HudHelper = function() {
        this._initHudHelper();
    };
    JTact.HudHelper.prototype = {
        _initHudHelper: function() {
            buttons = [];
        },
        // returns a button object that can be removed
        add: function(x, y, w, h, text, click_index, icon_name /*optional*/) { // width and height are optional. click_index is optional.
            if (ctx === null) {
                ctx = TC.hudLayer;
            }
            var b = {x: x, y: y, w: w, h: h, text: text, click_index: click_index, icon_name: icon_name};
            buttons.push(b);
            return b;
        },
        remove: function(obj) {
            if (obj === null)
                return;
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                if (b === obj) { // NOTE: changed this for direct object comparison (multiple covers at 0,0)
                    buttons.splice(i, 1);
                    break;
                }
            }
        },
        removeList: function(logHovers) {
            for (var i = 0; i < logHovers.length; i++) {
                TH.remove(logHovers[i]);
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
            delete buttons;
            buttons = [];
            bover = null;
        },
        draw: function(b) {
            this.clearDraw();
            if (b.text === undefined || b.text === null || b.text === "") {
                // may be a covering area with no popup, like the right sidebar
                return false;
            }
            //wrapText: function(context, text, x, y, maxWidth, lineHeight, font, color, align) {
            height = TU.wrapText(ctx, b.text, POS_X + 20, POS_Y + 20, WIDTH-25, 20, SF.FONT_L, "#000") + 7;
            TU.rect(ctx, POS_X, POS_Y, WIDTH, height, "#AAA", "#000", 2);
            TU.wrapText(ctx, b.text, POS_X + 20, POS_Y + 20, WIDTH-25, 20, SF.FONT_L, "#000");
						if (b.icon_name) {
							let icon = TG.icons[b.icon_name];
							ctx.drawImage(icon, POS_X-icon_size-5, POS_Y, icon_size, icon_size);
						}
						return true;
        },
        clearDraw: function() {
					let clear_height = Math.max(height + 4, icon_size) + 5;
          ctx.clearRect(POS_X - 2 - icon_size-5, POS_Y - 2, WIDTH +icon_size + 9, clear_height);
        },
        // handle mouse movement
        mMove: function(x, y) {
            var b = this.find(x, y);
            if (b !== null) {
                if (bover !== null && bover.x === b.x && bover.y === b.y) {
                    //return b; // already over or pressed, don't color over
										return null;  // 
                }
                bover = b;
                if (!this.draw(b)) {
									return null; // If didn't draw, allow mouse to go through.
								}
            } else {
                if (bover !== null) {
                    this.clearDraw();
                    bover = null;
                }
            }
            return b;
        },
				// Handles mouse click.
				mClick: function(x, y) {
          var b = this.find(x, y);
					if (b === null) {
						return false;
					}
					if (b.click_index !== undefined) {
            let key_code;
						if (b.click_index >= 0) {
							key_code = TF.abilityKeyMap[b.click_index].charCodeAt(0);
						} else if (b.click_index === -1) {
							key_code = 68;  // 'D', defend.
						} else if (b.click_index === -2) {
							key_code = 83;  // 'S', move.
						}
						SG.activeTier.handleKey(key_code)
						return true;
					}
					return false;
				},
        // Finds button at x,y, or returns null
        find: function(x, y) {
            var ret = null;
            for (var i = 0; i < buttons.length; i++) {
                var b = buttons[i];
                if (b.x <= x && b.y <= y && b.x + b.w >= x && b.y + b.h >= y) {
                    // NOTE: go through all of them, and pick the last one (presumably on top)
                    ret = b;
                }
            }
            return ret;
        }
    };
})();

TH = new JTact.HudHelper();
