/*
 * Target base class and class implementations
 * 
 * TODO: hero move mod for targeting (flying hero)
 */
(function() {

    JTact.Target = function(range) {
        this._initTarget(range);
    };

    // Defaults to spell nuke type targeting
    JTact.Target.prototype = {
        // faction?
        range: null,
        rangePlusSize: true, // range is in addition to hero size
        terrain: false, // false = heroes targeted, true = ground targeted
        obstacles: false, // respects hero and terrain obstacles
        // aoe options
        aoe: null, // aoe hex size, or null
        // Terrain options
        pathSize: null, // If true the hero size will be used, AND object targeting must respect path fit (like normal movement)
        endSize: null, // If true the hero size must fit where the object lands, but it can pass over boundaries
//        target2: null, // optional second JTact.Target object, for 2-target effects
//        target2reorigin: true, // true = change the origin of the second target to the first target. false = both ranges start from caster
				move_effect: false,  // Movement or teleportation-related.
				respect_vision: true,
  			nontarget: null,
        _initTarget: function(range) {
            this.range = range;
        }
    };

    // Target for normal hero movement
    JTact.HeroMoveTarget = function(range) {
        this._initHeroMoveTarget(range);
    };

    JTact.HeroMoveTarget.prototype = {
        _initHeroMoveTarget: function(range) {
            this.range = range;
            this.terrain = true;
            this.obstacles = true;
            this.pathSize = true;
            this.rangePlusSize = false;
						this.move_effect = true;
						// Allow walking around corners. Unlike spells.
						this.respect_vision = false;
        }
    };

    // Target for a teleport-type effect
    JTact.HeroTeleTarget = function(range) {
        this._initHeroTeleTarget(range);
    };

    JTact.HeroTeleTarget.prototype = {
        _initHeroTeleTarget: function(range) {
            this.range = range;
            this.terrain = true;
            this.obstacles = false;
            this.endSize = true;
            this.rangePlusSize = false;
						this.move_effect = true;
        }
    };

    // Target for short-range melee
    JTact.MeleeTarget = function(range) {
        this._initMeleeTarget(range);
    };

    JTact.MeleeTarget.prototype = {
        _initMeleeTarget: function(range) {
            this.range = range;
            this.obstacles = false;  // If true the heros won't be targetable.
        }
    };

    // For general spells, nukes... anything ranged that respects line-of-sight but not obstacles
    JTact.SpellTarget = function(range, aoe) {
        this._initSpellTarget(range, aoe);
    };

    JTact.SpellTarget.prototype = {
        _initSpellTarget: function(range, aoe) {
            this.range = range;
						this.aoe = aoe;
        }
    };


    // Fireball type stuff
    JTact.AoeTarget = function(range, aoe) {
        this._initAoeTarget(range, aoe);
    };

    JTact.AoeTarget.prototype = {
        _initAoeTarget: function(range, aoe) {
            this.range = range;
            this.terrain = true;
            this.aoe = aoe;
        }
    };


    // Hits everything.
    JTact.GlobalTarget = function() {
        this._initGlobalTarget();
    };

    JTact.GlobalTarget.prototype = {
        _initGlobalTarget: function() {
            this.terrain = false;
						this.global = true;
        }
    };

	
})();

TU.extend(JTact.HeroMoveTarget, JTact.Target);
TU.extend(JTact.MeleeTarget, JTact.Target);
TU.extend(JTact.SpellTarget, JTact.Target);
TU.extend(JTact.HeroTeleTarget, JTact.Target);
TU.extend(JTact.AoeTarget, JTact.Target);
TU.extend(JTact.GlobalTarget, JTact.Target);




 
