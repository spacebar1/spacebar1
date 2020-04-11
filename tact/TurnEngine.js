/*
 * Turn Engine, tracks turns (fractional turns have been removed).
 */
(function() {

	//var TYPE_HERO = 200;
	//var TYPE_EFFECT_EXPIRY = 201;
	//var TYPE_TRIGGER = 202;

	JTact.TurnEngine = function() {
		this._initTurnEngine();
	};

	JTact.TurnEngine.prototype = {
		readyToTick: false, // An action ended and ready to move on to the next hero. Also see below.
		queue: null,
		_initTurnEngine: function() {
			this.queue = [];
			//this.dots = [];
			this.readyToTick = true; // queue up the first move
		},
		/*
		 * This function is part of the readyToTick non-inline TurnEngine control flow, to prevent deep recursion
		 * A hero / action / event / etc calls this method to notify the TurnEngine that their turn 
		 * is over after the thread ends processing, and time is ready to move forward.
		 * Time should move forward when all effects and controller code has resolved / finished running
		 * CheckNextTurn provides the advancement, but only if a turn end (action) has been finished.
		 */
		queueTurnEnd: function() {
			this.readyToTick = true;
		},
		// Called at the end of user input, to see if gameplay should advance
		checkNextTurn: function() {
			while (this.readyToTick) {
				this.readyToTick = false;
				this.advanceClock();
			}
		},
		queueHero: function(hero, relativeTurns) {
			var turn = TG.data.turn + relativeTurns;
			//hero.readyTime = turn;
			var queueObj = {
				name: hero.name,
				turn: turn,
				//type: TYPE_HERO
			};
			for (var i = 0; i < this.queue.length; i++) {
				// add it at the appropriate time in the queue. Account for relative hero order.
				var next = this.queue[i];
				let next_hero = TG.data.heroes[next.name];
				if (next.turn > turn/* || (next.turn === turn && next.name && hero.turn_order < next_hero.turn_order)*/) {
					this.queue.splice(i, 0, queueObj);
					return;
				}
			}
			// nothing after it, append to the end of the queue
			this.queue.push(queueObj);
		},
		handleTEDeath: function(hero) {
			for (var i = this.queue.length - 1; i >= 0; i--) {
				if (this.queue[i].name === hero.name) {
					this.queue.splice(i, 1);
				}
			}
		},
		// go to the next queued action
		advanceClock: function() {
			let old_turn = TG.data.turn;
			TG.data.turn = this.queue[0].turn;
			if (old_turn < TG.data.turn) { // time elapsed
				TG.controller.snapShot();
				if (TG.controller.CheckStalemate()) {
					return;
				}
			}
			let next = this.queue[0];
			this.queue.splice(0, 1); // Remove the first.
			TG.data.turn = round100th(next.turn);

			let nexthero = TG.data.heroes[next.name];
			if (!nexthero || nexthero.dead) {
				// Dot or something killed the hero. Go to the next.
				this.readyToTick = true;
				return;
			}

			this.queueHero(nexthero, 1);
			TG.controller.readyHero(nexthero);
		},
		clone: function() {
			let clone = new JTact.TurnEngine();
			clone.readyToTick = true;
			clone.queue = SU.Clone(this.queue);
			return clone;
		},
		// Returns the slot position for this hero by name.
		GetQueuePosition(name) {
			for (let i = 0; i < this.queue.length; i++) {
				if (this.queue[i].name == name) {
					return i;
				}
			}
			return "?";
		},
	};
})();
