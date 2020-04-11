// Super-region map.
// Intended to be pushed. Not intended to be interactive.

(function() {
	const move_amount = Math.PI/16;
	
  SBar.LookAroundRenderer = function() {
      this._initLookAroundRenderer();
  };
	
	let zoom_levels = [2, 4, 8];

  SBar.LookAroundRenderer.prototype = {
		type: SF.TIER_LOOKAROUND,
		rotationx: 0,  // Radians.
		rotationy: 0,
		start_visibility: null,
		layer0_start_visibility: null,  // Helm.
		current_rotation: null,
		_initLookAroundRenderer: function() {
			this.start_visibility = {};
    },
		
    activate: function() {
			SG.activeTier = this;
			this.current_rotation = SU.GetTravelRenderer(/*skip_setup=*/true).CurrentCameraRotation();
			
			for (let context_key in SC) {
				if (context_key != "rightLayer") {
					SC[context_key].clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				}
			}
			for (let context_key in S3) {
				let canvas = S3[context_key];
				this.start_visibility[context_key] = canvas.style.visibility;
				canvas.style.visibility = 'visible';
			}
			this.layer0_start_visibility = SC.layer0.canvas.style.visibility;
			
			SU.clearText();
			SU.addText("WASD: Turn");
			SU.addText("Mouse: Turn");
			SU.addText("X: Return");
			this.Redraw();
		},
		MouseMove: function(x, y) {
			this.rotationx = x/100;
			this.rotationy = -y/100;
			this.Redraw();
		},
		// Draw the 3D image at the current orientation.
		Redraw: function() {
			if (this.rotationy > Math.PI/2) {
				this.rotationy = Math.PI/2;
			}
			if (this.rotationy < -Math.PI/2) {
				this.rotationy = -Math.PI/2;
			}
			SU.GetTravelRenderer(/*skip_setup=*/true).LookAt(this.current_rotation, this.rotationx, this.rotationy);
		},
    handleKey: function(key) {
			switch (key) {
				case SBar.Key.W:
				case SBar.Key.UP:
					this.rotationy += move_amount;
					this.Redraw();
					return;
				case SBar.Key.S:
				case SBar.Key.DOWN:
					this.rotationy -= move_amount;
					this.Redraw();
					return;
				case SBar.Key.A:
				case SBar.Key.LEFT:
					this.rotationx -= move_amount;
					this.Redraw();
					return;
				case SBar.Key.D:
				case SBar.Key.RIGHT:
					this.rotationx += move_amount;
					this.Redraw();
					return;
				case SBar.Key.R:
				case SBar.Key.X:
		      this.teardown();
					return;
			}
      error("unrecognized key pressed in 7looka: " + key);
    },
		
    teardown: function() {
			SU.GetTravelRenderer(/*skip_setup=*/true).LookAt(this.current_rotation, 0, 0);			
			for (let context_key in S3) {
				S3[context_key].style.visibility = this.start_visibility[context_key];
			}
			SC.layer0.canvas.style.visibility = this.layer0_start_visibility;
			SU.PopTier();
    },
  };
})();
