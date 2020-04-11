(function() {


    SBar.HighScoreRenderer = function() {
        this._initHighScoreRenderer();
    };

    SBar.HighScoreRenderer.prototype = {
			context: null,

			_initHighScoreRenderer: function() {
				this.context = SC.layer2;
      },
			
	    activate: function() {
	      SG.activeTier = this;
				SC.layer1.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SC.layer2.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SU.clearTextNoChar();
				SU.addText("C: Clear High Scores");
				SU.addText("X: Exit to Main Menu");

				// Get a background with a nebula.
				if (SF.FAST_TRAVEL) {
					SU.rect(SC.layer0, 0, 0, SF.WIDTH, SF.HEIGHT, "#000")
				} else {
					let travel = SU.GetTravelRenderer(/*skip_active=*/true);
					travel.AddNebula(Math.random());
					travel.RedrawCurrent()
				}
				SU.Show3dLayers(/*hide_helm=*/true);
				
				//SU.rect(this.context, 0, 0, SF.WIDTH, 80, 'rgba(255,255,255,0.4)')
				//SU.text(this.context, "The Hall of Legends", SF.HALF_WIDTH, 50, SF.FONT_XLB, '#000', 'center');
				SU.DrawTopBanner(this.context, "The Hall of Legends", "🏆");
				
				let y = 100;
				let scores = SU.getHighScores();
				if (scores.length === 0) {
					SU.text(this.context, "No high scores.", SF.HALF_WIDTH, SF.HALF_HEIGHT, SF.FONT_XL, '#FFF', 'center');
				}
				for (let score of SU.getHighScores()) {
					if (score.won) {
						SU.text(this.context, "🏆", 30, y+2, SF.FONT_M, '#AFA');
					}
					SU.text(this.context, SF.SYMBOL_LEVEL+score.level, 60, y, SF.FONT_M, '#AAA');
					SU.text(this.context, SU.TimeString(score.time), 90, y, SF.FONT_M, '#AAF');
					let x = 180;
					SU.text(this.context, score.name, x, y, SF.FONT_M, '#FFF');
					y += 22;
					if (score.conduct_data) {
						let first = true;
						let text = "";
						for (let obj in score.conduct_data) {
							if (first) {
								first = false;
							} else {
								text += ", ";
							}
							for (let obj2 in SF.CONDUCTS) {
								if (obj == obj2) {
									text += SF.CONDUCTS[obj2].title;
								}
							}
						}
						if (text != "") {
							SU.text(this.context, text, x, y, SF.FONT_M, '#ACA');
							y += 22;
						}
					}					
					SU.text(this.context, score.death, x, y, SF.FONT_M, '#888');
					y += 30;
				}
			},						
			
			ClearHighScores: function() {
				let deleteConfirm = function(confirmed) {
					if (confirmed) {
						SU.DeleteHighScores();
						this.activate();
					}
				}
				SU.ConfirmWindow("Delete Confirmation", "Really delete all high scores?", deleteConfirm.bind(this), "!");
			},
			
	    handleKey: function(key) {
	      switch (key) {
					case SBar.Key.C:
						this.ClearHighScores();
						break;
					case SBar.Key.X:
						this.teardown();
						break;
				}
			},
			
			teardown: function() {
				this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SU.PopTier();
			},
    };
		
})();

