/*
 * Location-based Effect Object, represents a single map/ground modifier
 * 
 */
(function() {

    JTact.TerrainMod = function() {
        // unused - create subclass 
        // this._initTerrainMod();
    };

    JTact.TerrainMod.prototype = {
        displayName: null,
        icon: null,
        x: null, // hex x, y
        y: null,
        size: null, // in hexes
        duration: TF.FOREVER,
        effectObjs: null,
        _initTerrainMod: function(x, y, size, displayName) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.displayName = displayName;
            this.effectObjs = {};
            if (this.icon === null) {
                var char = displayName.substring(0, 1);
                TG.icons[this.name] = TU.randHeroIcon(this.name, char);
            }
        },
        // Apply to heroes entering
        // By default applies the effect. This can be overriden or customized
        onEnter: function(hero) {
            var effect = this.getEffect();
            if (effect !== undefined && effect !== null) {
                var effectClone = TG.controller.doEffect(effect, TF.GROUND_SOURCE, hero);
                this.effectObjs[hero.name] = effectClone;
            }
        },
        // Apply to heroes exiting
        // By default removes the effect. This can be overriden or customized
        onExit: function(hero) {
            var mod = this.effectObjs[hero.name];
						if (!mod) {  // Hopefully temporary, mod wasn't applied for some reason.
							return;
						}
            if (mod.unapply) {
                mod.unapply();
            }
            hero.removeMod(mod);
            delete this.effectObjs[hero.name];
        },
        // Get the effect to apply, if using the default impl of applying effects to heroes that enter
        getEffect: function() {
            error("override");
        },
        // return effect description
        getText: function() {
            return "/override TerrainMod.getText()";
        }
    };
})();


(function() {

    JTact.DefendArea = function(x, y, size, amount) {
        this._initDefendArea(x, y, size, amount);
    };

    JTact.DefendArea.prototype = {
        displayName: null,
        x: null, // hex x, y
        y: null,
        size: null, // in hexes
        amount: null,
        _initDefendArea: function(x, y, size, amount) {
            this.drawIcon();
            var display = "Fort";
            TG.icons[display] = this.icon;
            this._initTerrainMod(x, y, size, display);
            this.amount = round10th(amount);
        },
        getEffect: function() {
            var title = "Fortress position";
            var effect = new JTact.DamageReceivedEffect(title, this.amount, TF.FOREVER);
            effect.casted = false;
            TG.icons[title] = this.icon;
            return effect;
        },
        // return effect description
        getText: function() {
            return "Heroes in fort take "+ Math.round((1-this.amount) * 100) + "% reduced physical damage" ;
        },
        drawIcon: function() {
            var icon = TU.blankIcon();
            this.icon = icon;
            var ctx = icon.getContext('2d');
            TU.rect(ctx, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, "#888"); // green for goo
            TU.text(ctx, "D", TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.7, "bold 50pt "+SF.FONT, "#444", "center");
            TU.applyHexStamp(ctx);
        }
    };
})();

TU.extend(JTact.DefendArea, JTact.TerrainMod);
 
 


(function() {

    JTact.FireArea = function(x, y, size, dmgPerTurn) {
        this._initFireArea(x, y, size, dmgPerTurn);
    };

    JTact.FireArea.prototype = {
        displayName: null,
        x: null, // hex x, y
        y: null,
        size: null, // in hexes
        _initFireArea: function(x, y, size, dmgPerTurn) {
            this.dmgPerTurn = dmgPerTurn;
            this.drawIcon();
            var display = "Heat Exhaustion";
            TG.icons[display] = this.icon;
            this._initTerrainMod(x, y, size, display);
        },
        getEffect: function() {
            var title = "Heat";
            var effect = new JTact.PersistentDOT(title, "Burning", this.dmgPerTurn);
						let me = this;
            effect.getText = function() {
                return "Burned for "+me.dmgPerTurn+" damage / turn";
            };
            effect.casted = false;
            TG.icons[title] = this.icon;
            return effect;
        },
        // return effect description
        getText: function() {
            return "Those in the area take "+this.dmgPerTurn+" damage / turn";
        },
        drawIcon: function() {
            var icon = TU.blankIcon();
            this.icon = icon;
            var ctx = icon.getContext('2d');
            TU.rect(ctx, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, "#A66"); // red for fire
            TU.text(ctx, "H", TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.7, "bold 50pt "+SF.FONT, "#622", "center");
            TU.applyHexStamp(ctx);
        }
    };
})();

TU.extend(JTact.FireArea, JTact.TerrainMod);



(function() {

    JTact.RangeArea = function(x, y, size, amount) {
        this._initRangeArea(x, y, size, amount);
    };

    JTact.RangeArea.prototype = {
        displayName: null,
        x: null, // hex x, y
        y: null,
        size: null, // in hexes
        amount: null,
        _initRangeArea: function(x, y, size, amount) {
            this.drawIcon();
            var display = "High Point";
            TG.icons[display] = this.icon;
            this._initTerrainMod(x, y, size, display);
            this.amount = amount;
        },
        getEffect: function() {
            var title = "Up on high";
            var effect = new JTact.RangeEffect(title, this.amount, TF.FOREVER);
            effect.casted = false;
            TG.icons[title] = this.icon;
            return effect;
        },
        // return effect description
        getText: function() {
            return "Hero range modified by " + Math.round(this.amount * 100) + "%";
        },
        drawIcon: function() {
            var icon = TU.blankIcon();
            this.icon = icon;
            var ctx = icon.getContext('2d');
            TU.rect(ctx, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, "#AAA");
            TU.text(ctx, "R", TF.ICON_SIZE/2, TF.ICON_SIZE*0.7, "bold 50pt "+SF.FONT, "#666","center");
            TU.applyHexStamp(ctx);
        }
    };
})();

TU.extend(JTact.RangeArea, JTact.TerrainMod);



(function() {

    JTact.SlowArea = function(x, y, size, amount) {
        this._initSlowArea(x, y, size, amount);
    };

    JTact.SlowArea.prototype = {
        displayName: null,
        x: null, // hex x, y
        y: null,
        size: null, // in hexes
        amount: null,
        _initSlowArea: function(x, y, size, amount) {
            this.drawIcon();
						if (amount < 1) {
	            var display = "Slow Pit";
						} else {
	            var display = "Speed Area";
						}
            TG.icons[display] = this.icon;
            this._initTerrainMod(x, y, size, display);
            this.amount = amount;
        },
        getEffect: function() {
					if (this.amount) {
            var title = "Stuck";
					} else {
            var title = "Sped";
					}
            var effect = new JTact.SpeedEffect(title, this.amount, TF.FOREVER);
            effect.getText = function() {
                return "Modifies speed by " + Math.round(this.amount * 100) + "%";
            };
            effect.casted = false;
            TG.icons[title] = this.icon;
            return effect;
        },
        // return effect description
        getText: function() {
            return "Modifies speed by " + Math.round(this.amount * 100) + "%";
        },
        drawIcon: function() {
            var icon = TU.blankIcon();
            this.icon = icon;
            var ctx = icon.getContext('2d');
            TU.rect(ctx, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, "#5A5"); // green for goo
            TU.text(ctx, "S", TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.7, "bold 50pt "+SF.FONT, "#161", "center");
            TU.applyHexStamp(ctx);
        }
    };
})();

TU.extend(JTact.SlowArea, JTact.TerrainMod);
 


 
