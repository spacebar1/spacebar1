/*
 * Initial display when an artifact gets found.
 */
(function() {

  var images = null;
  var rot = null;
  var size = 400; // image size. each.

  SBar.ArtifactFindRenderer = function(arti, bdata, cost, trade_callback) {
    this._initArtifactFindRenderer(arti, bdata, cost, trade_callback);
  };
  SBar.ArtifactFindRenderer.prototype = {
    arti: null,  // ArtifactData.
		skill: null,  // SBar.Skill.
		bdata: null,
    staticImage: null,
    arti_shape: null,
		context: null,
		cost: null, // Optional. Only if this is being sold.
		trade_callback: null, // Optional.
		render_calls: null,
		timeout: null,
		background: null,  // Background override.
    s: 0,
    _initArtifactFindRenderer: function(arti, bdata, cost, trade_callback) {
      this.arti = arti;
			this.skill = new SBar.Skill(arti);
			this.bdata = bdata;
      this.context = SC.layer2;
      this.seed = this.skill.seed;
			this.cost = cost;
			this.trade_callback = trade_callback;
			this.render_calls = 0;

      this.arti_shape = new SBar.IconArtifact(this.context, arti);

      if (images === null) {
        images = [];
        rot = 0;
        this.drawImage();
        this.drawImage();
        this.drawImage();
      }
    },
		SetBackground: function(text) {
			this.background = text;
			return this;
		},
    drawImage: function() {
      var image = document.createElement('canvas');
      image.width = size;
      image.height = size;
      var ctx = image.getContext('2d');

      var r = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var g = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var b = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var color = 'rgba(' + r + ',' + g + ',' + b + ',0.05)';
      // context, x, y, width, height, fill, stroke, strokeWidth) {
      SU.rect(ctx, 1, 1, size - 2, size - 2, color, 'rgba(0,0,0,0.1)', 3);
      images.push(image);
    },
    newColor: function(num) {
      var ctx = images[num].getContext('2d');
      ctx.clearRect(0, 0, size, size);
      var r = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var g = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var b = Math.floor(SU.r(this.seed, this.s++) * 128) + 127;
      var color = 'rgba(' + r + ',' + g + ',' + b + ',0.05)';
      SU.rect(ctx, 1, 1, size - 2, size - 2, color, 'rgba(0,0,0,0.1)', 3);
    },
    activate: function() {
      this.staticImage = document.createElement('canvas');
      this.staticImage.width = SF.WIDTH;
      this.staticImage.height = SF.HEIGHT;
      this.context = this.staticImage.getContext('2d');

      SG.activeTier = this;

      SU.displayBorder(this.skill.name, this.context);
			this.skill.WriteDetails(this.context, SF.HALF_WIDTH+50, 330, /*width=*/370);
			if (this.cost) {
	      SU.wrapText(this.context, "Cost: "+SF.SYMBOL_CREDITS+this.cost, 100, 130, 400, 25, SF.FONT_L, '#AAA');
			} else if (this.background || (this.bdata && this.bdata.is_building_data)) {
	      let background = this.background ? this.background : ST.artiBackground(this.bdata, this.skill);
	      SU.wrapText(this.context, background, 100, 130, 400, 25, SF.FONT_L, '#AAA');
			}

      //SB.buttC(this.arti.install.bind(this.arti));

      this.context = SC.layer2;
			this.handleUpdate();
			if (this.cost) {
				if (S$.credits >= this.cost) {
					SU.addText("1: Purchase");				
				}
				SU.addText("X: Exit");				
			} else {
				SU.addText("1: Install");
			}
			// Render every 50 ms, 100 times. Can tweak this based on performance.
			this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);			
    },
    handleUpdate: function() {
			this.render_calls++;
			if (this.timeout == null) {
				return;
			}
			if (this.render_calls < 500) {
				this.timeout = setTimeout(this.handleUpdate.bind(this), 50, 50);
			} else {
				this.timeout = null;
			}

      this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      this.context.drawImage(this.staticImage, 0, 0);

      rot += 0.001;
      var change = Math.floor(Math.random() * 60);
      if (change < 1) {
        this.newColor(change);
      }

      this.context.save();
      this.context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);

      var tsize = size;
      this.context.save();
      this.context.rotate(rot);
      this.context.drawImage(images[0], 0, 0, size, size, -tsize / 2, -tsize / 2, tsize, tsize);
      this.context.restore();
      tsize = size * 0.85;
      this.context.save();
      this.context.rotate(-rot * 1.6);
      this.context.drawImage(images[1], 0, 0, size, size, -tsize / 2, -tsize / 2, tsize, tsize);
      this.context.restore();
      tsize = size * 0.7;
      this.context.save();
      this.context.rotate(rot * 2.17);
      this.context.drawImage(images[2], 0, 0, size, size, -tsize / 2, -tsize / 2, tsize, tsize);
      this.context.restore();


      this.context.save();
      this.arti_shape.CenterAt(200, -250);
//      this.context.rotate(rot * 2.17);
      this.arti_shape.update();
			let skill_name = this.arti_shape.skill.name;
			if (this.arti_shape.skill.level) {
				skill_name += " ("+SF.SYMBOL_LEVEL+this.arti_shape.skill.level+")";
			}
      SU.wrapText(this.context, skill_name, 235, -120, 270, 25, SF.FONT_L, '#FFF', 'center');
			
      this.context.restore();
      this.context.restore();
			
			// TESTING
      //this.teardown();
			
    },
    handleKey: function(key) {
      switch (key) {
        case SBar.Key.NUM1:
        case SBar.Key.SPACE:
					if (!this.cost) {
	          this.Install();
	          break;
					} else if (S$.credits >= this.cost) {
  					this.trade_callback();
						this.Install();
					}
					break;
			  case SBar.Key.X:
					if (this.cost) {
						this.teardown();
					}
					break;
        default:
          error("unrecognized key pressed in artifactr: " + key);
      }
    },
    Install: function() {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			SU.PopTier();
			var target = this.skill.type == SF.SKILL_SHIP ? S$.ship : S$.crew[0];
      SU.PushTier(new SBar.ArtifactComplexRenderer(target, this.arti));
    },
		teardown: function() {
			if (this.timeout != null) {
				clearTimeout(this.timeout);
			}
			SU.PopTier();
		},
  };
})();
