(function() {

    SBar.IntroRenderer = function(tier) {
        this._initIntroRenderer(tier);
    };

    SBar.IntroRenderer.prototype = {
			tier: null,
			backctx: null,
			ctx: null,
			crewctx: null,
			buffctx: null,
			icons: null,
			pan_y: 0,

			_initIntroRenderer: function(tier) {
				this.tier = tier;
				
				SU.clearTextNoChar();
				SU.addText("X: Skip");
				
        this.backctx = this.tier.backctx;
        this.crewctx = this.tier.crewctx;
        this.frontctx = this.tier.frontctx;
        this.createBuffCtx();
        this.drawStars();
				SU.Hide3dLayers();
				
				this.icons = [];
      },
			
			AddIcon: function(icon) {
				this.icons.push(icon);
			},
			
			updateCutscene: function(time_ms) {
				if (!this.first_cutscene) {
	        this.backctx.drawImage(this.buffctx.canvas, 0, SF.HEIGHT, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, SF.HEIGHT);
					this.first_cutscene = true;
				}
        this.crewctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
				for (let icon of this.icons) {
					icon.handleUpdate(time_ms);
				}
			},

      createBuffCtx: function() {
          var c = document.createElement('canvas');
          c.width = SF.WIDTH;
          c.height = SF.HEIGHT * 2;
          this.buffctx = c.getContext('2d');
          SU.rect(this.buffctx, 0, 0, SF.WIDTH, SF.HEIGHT * 2, "#000");
      },
      drawStars: function() {
				let stars = SU.draw2DStarsBackground();
				this.buffctx.drawImage(stars, 0, 0);
				this.buffctx.drawImage(stars, 0, SF.HEIGHT);

        // Wipe out stars in the atmosphere.
        var colorStops = [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,1)'];
        SU.rectGrad(this.buffctx, 0, SF.HEIGHT, SF.WIDTH, SF.HEIGHT * 2, 0, SF.HEIGHT, 0, SF.HEIGHT * 2, colorStops);
        SU.rectGrad(this.buffctx, 0, SF.HEIGHT, SF.WIDTH, SF.HEIGHT * 2, 0, SF.HEIGHT, 0, SF.HEIGHT * 2, colorStops);

        // Add atmosphere.
        var colorStops = [0, 'rgba(0,0,0,0)', 1, 'rgba(150,150,255,0.55)'];
        SU.rectGrad(this.buffctx, 0, SF.HEIGHT, SF.WIDTH, SF.HEIGHT * 2, 0, SF.HEIGHT, 0, SF.HEIGHT * 2, colorStops);

        this.backctx.drawImage(this.buffctx.canvas, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, SF.HEIGHT);
      },
			
			/////////////////////////////////////////
			//
			//  Begin text scrolling + pan.
			//
			/////////////////////////////////////////
			texttime: null,
			textindex: -1,
			textlines: null,
			spaceText: null,
			SpacePan: function(text) {
				this.textlines = [];
        //SB.buttX(this.tier.exit.bind(this.tier));

				this.spaceText = text;
		    this.numlines = this.spaceText.length;
		    this.fontsize = 60;
		    this.skew = 3.0;
		    this.height = this.fontsize + 30;
				
			},
      updateSpacePan: function(deltaTime) {
				if (this.panningdown) {
					this.pandown(deltaTime);
					return;
				}
				let linedelay = 2000;
		    let scrolldelay = 10000;
		    let fully = SF.HEIGHT * 3 / 4;
        this.texttime += deltaTime;
        var line = Math.floor(this.texttime / linedelay);
        if (line > this.textindex && line < this.spaceText.length) {
            // add a new line
            this.textindex = line;
            var text = this.scaleText(this.spaceText[line]);
            this.textlines.push(text);
        }
        this.frontctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
				let max_text_time = this.numlines * 2000 + 6000;
        if (this.texttime > max_text_time - 5000 && this.texttime < max_text_time) {
            this.frontctx.globalAlpha = (max_text_time - this.texttime) / 5000;
        }

        for (var i = 0; i < this.textlines.length; i++) {
            var linetime = this.texttime - i * linedelay + 9000;
            var perspective = 1 / (linetime / scrolldelay);
            if (this.height * perspective * perspective * 2 - 15 > 0) {
                this.frontctx.drawImage(this.textlines[i], SF.HALF_WIDTH - SF.WIDTH * perspective * perspective, SF.HEIGHT - fully + fully * perspective * perspective,
                        SF.WIDTH * perspective * perspective * 2, this.height * perspective * perspective * 2 - 15);
            }
        }

        if (this.texttime > max_text_time ) {
            this.panningdown = true;
            this.frontctx.globalAlpha = 1;
        }
      },
      scaleText: function(text) {
          let c = document.createElement('canvas');
          c.width = SF.WIDTH;
          c.height = this.height;
          let textctx = c.getContext('2d');

          textctx.font = 'bold ' + this.fontsize + 'pt '+SF.FONT;
          textctx.fillStyle = '#BB7';
          textctx.textAlign = 'center';
          textctx.fillText(text, SF.HALF_WIDTH, this.height - 20);

          c = document.createElement('canvas');
          c.width = SF.WIDTH;
          c.height = this.height;
          let textctx2 = c.getContext('2d');

          for (var i = 0; i < this.height; i++) {
              textctx2.drawImage(textctx.canvas, 0, i, SF.WIDTH, 1, this.height - (i * this.skew / 2), i, SF.WIDTH - (this.height - i * this.skew), 1);
          }
          return textctx2.canvas;

      },
			
      pandown: function(deltaTime) {
				this.crewctx.save();
				this.crewctx.translate(0, SF.HEIGHT-this.pan_y)
				this.updateCutscene(0);  // Draw the initial icon locations.
				this.crewctx.restore();
				
        if (this.pan_y < SF.HEIGHT) {
						let pan_amount = deltaTime / 10;
						if (this.pan_y < pan_amount) {
							this.pan_y += this.pan_y + 1;
						} else {
	            this.pan_y += deltaTime / 10;
						}
            if (this.pan_y >= SF.HEIGHT) {
                this.pan_y = SF.HEIGHT;
            }
        }

        this.backctx.drawImage(this.buffctx.canvas, 0, this.pan_y, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, SF.HEIGHT);
				
				if (this.pan_y >= SF.HEIGHT) {
          this.panningdown = false;
					this.tier.done_with_space_pan = true;
				}
      },
	
			// Opposite of above.
			panup: function(deltaTime, endTime) {
				this.crewctx.save();
				this.crewctx.translate(0, SF.HEIGHT-this.pan_y)
				this.updateCutscene(endTime);  // Draw the initial icon locations.
				this.crewctx.restore();
				
        if (this.pan_y > 0) {
            this.pan_y -= deltaTime / 10;
            if (this.pan_y <= 0) {
                this.pan_y = 0;
            }
        }

        this.backctx.drawImage(this.buffctx.canvas, 0, this.pan_y, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, SF.HEIGHT);
				
				if (this.pan_y <= 0) {
					this.tier.done_with_pan_up = true;
				}
			},
						
			/////////////////////////////////////////
			//
			//  End text scrolling + pan.
			//
			/////////////////////////////////////////
			
	    teardown: function() {
        this.backctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        this.crewctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        this.frontctx.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				SU.Show3dLayers();
	    },
			
			
    };
})();




 
