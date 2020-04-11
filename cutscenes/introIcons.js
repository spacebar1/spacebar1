
(function() {
	
	let char_size = 130;
	
	// IntroIconCrew is designed to be able to be rendered at any time point, for easy debugging.
	// Params options: crew: <crew_obj>, is_alpha, is_imaginary (additional, to show transparency).
  SBar.IntroIconCrew = function(context, params) {
    this._initIntroIconCrew(context, params);
  };

  SBar.IntroIconCrew.prototype = {
		seed: null,
		context: null,
		image: null,
		positions: null,
		last_position_index: -1,
		speech: null,
		last_speech_index: -1,
		teleport: null,
		imaginary_time: null,
		fade_out_time: null,
		is_imaginary: false,
		_initIntroIconCrew: function(context, params) {
			this.positions = [];
			this.speech = [];
			this.context = context;
			this.BuildImage(params);
			if (params.imaginary_time) {
				this.imaginary_time = params.imaginary_time;
			}
			if (params.fade_out_time) {
				this.fade_out_time = params.fade_out_time;
			}
			if (params.is_imaginary) {
				this.is_imaginary = true;
			}
    },
		BuildImage: function(params) {
      this.image = document.createElement('canvas');
      this.image.width = char_size;
      this.image.height = char_size;
      this.image_context = this.image.getContext('2d');
			
			let alien_image = null;
			if (params.is_alpha) {
				//  = function(seed, raceseed, data_type, data_faction, is_home_bar, override_random, options) {
				alien_image = new SBar.IconAlien(SF.RACE_SEED_ALPHA, SF.RACE_SEED_ALPHA, /*data_type=*/undefined, /*data_factions=*/undefined, /*is_home_bar=*/false).image;
				this.seed = 1;
			} else if (params.crew) {
				alien_image = params.crew.GetCachedImage();
				this.seed = params.crew.seed;
			}
				
			let orig_height = alien_image.height;
			this.image_context.drawImage(alien_image, alien_image.width/2-orig_height/2, 0, orig_height, orig_height, 0, 0, char_size, char_size);
		},
		AddPosition: function(x, y, time) {
			this.positions.push([x, y, time]);			
		},
		// Walk the player somewhere. Break it up into multiple hops.
		MoveTo: function(start_x, start_y, end_x, end_y, start_time, end_time) {
			let s = 1;
			this.AddPosition(start_x, start_y, start_time);
			let current_time = start_time;
			while (current_time < end_time && end_time - current_time > 1600) {
				let hop_time = Math.round(SU.r(this.seed, s++)*400)+800;
				current_time += hop_time;
				let x = start_x+(end_x-start_x)*(current_time-start_time)/(end_time-start_time)*(SU.r(this.seed, s++)/5+0.9);
				let y = start_y+(end_y-start_y)*(current_time-start_time)/(end_time-start_time)*(SU.r(this.seed, s++)/5+0.9);
				this.AddPosition(x, y, current_time);
			}
			this.AddPosition(end_x, end_y, end_time);
		},
		GetPositionAt: function(time) {
			if (this.positions.length > this.last_position_index+1 && this.positions[this.last_position_index+1][2] <= time) {
				this.last_position_index++;
			}
			let current = this.positions[this.last_position_index];
			if (this.positions.length <= this.last_position_index+1) {
				return current;
			}
			// Character hops to get to the next position.
			let next = this.positions[this.last_position_index+1];
			let current_fraction = 1-(time-current[2])/(next[2]-current[2]);
			let next_fraction = 1-current_fraction;
			let height = -Math.sin(Math.PI*current_fraction)*Math.abs(current[0]-next[0])/4;
			return [current_fraction*current[0]+next_fraction*next[0], current_fraction*current[1]+next_fraction*next[1]+height];
		},
		AddSpeech: function(text, time, duration) {
			this.speech.push([text, time, duration]);
		},
		CheckSpeech: function(time, position) {
			if (this.speech.length > this.last_speech_index+1 && this.speech[this.last_speech_index+1][1] <= time) {
				this.last_speech_index++;
				let details = this.speech[this.last_speech_index];
        let text = details[0];
		    //textBubble: function(text, anchorx, anchory, boxx, boxy, width, duration) {
				if (position[0] < SF.HALF_WIDTH) {
	        SU.textBubble(text, position[0]+20, position[1]-40, position[0]-60, position[1]-150, 300, details[2]);
				} else {
	        SU.textBubble(text, position[0]-20, position[1]-40, position[0]-240, position[1]-150, 300, details[2]);					
				}
			}
		},
		AddTeleport: function(time, duration, topx, topy) {
			this.teleport = [time, duration, topx, topy];
		},
		CheckTeleport: function(time, position) {
			if (!this.teleport || time < this.teleport[0] || this.tele_done) {
				return;
			}
			for (let i = 0; i < 8; i++) {
	      let x = Math.floor(Math.random() * char_size);
	      let y = Math.floor(Math.random() * char_size);
				this.image_context.clearRect(x, y, 5, 5);
			}
			
			if (time > this.teleport[0] + this.teleport[1]) {
				this.tele_done = true;
        this.image_context.clearRect(0, 0, char_size, char_size);
			}
			let topx = this.teleport[2];
			let topy = this.teleport[3];
			//DrawAlphaTriangle: function(context, seed, farx, fary, x1, y1, x2, y2) {
			SU.DrawAlphaTriangle(this.context, time, topx, topy, position[0]-40, position[1]-65, position[0]+40, position[1]-65);
		},
		handleUpdate: function(time) {
			let position = this.GetPositionAt(time);
			this.CheckSpeech(time, position);
			this.CheckTeleport(time, position);
			let faded = false;
			if (this.is_imaginary || (this.imaginary_time && time < this.imaginary_time)) {
				this.context.globalAlpha = Math.cos(time/300)/4+0.5;//0.5;//SU.r(this.seed, 1.11+time);
				faded = true;
			}
			if (this.fade_out_time && time >= this.fade_out_time) {
				let fade_amount = 1 - (time-this.fade_out_time)/1000;
				if (fade_amount < 0) fade_amount = 0;
				this.context.globalAlpha = fade_amount;
				faded = true;
			}
			this.context.drawImage(this.image, position[0]-char_size/2, position[1]-char_size/2);
			if (faded) {
				this.context.globalAlpha = 1;
			}
		}
  };
})();



(function() {
	
	let image_size = 400;
	
  SBar.IntroIconShip = function(context, ship) {
    this._initIntroIconShip(context, ship);
  };

  SBar.IntroIconShip.prototype = {
		context: null,
		image: null,
		last_position_index: -1,
		positions: null,
		effect_icon: null,
		hide_until: null,
		_initIntroIconShip: function(context, ship) {
			this.positions = [];
			this.context = context;
			this.BuildImage(ship);
			this.effect_icon = new SBar.IconTempleEffect(this.context, 0, 0, true);
    },
		SetHideUntil: function(time) {
			this.hide_until = time;
		},
		BuildImage: function(ship) {
      this.image = document.createElement('canvas');
      this.image.width = image_size;
      this.image.height = image_size;
      let context = this.image.getContext('2d');
			
			let ship_image = ship.GetCachedImage();
			let orig_height = ship_image.height;
			context.drawImage(ship_image, ship_image.width/2-orig_height/2, 0, orig_height, orig_height, 0, 0, image_size, image_size);
		},
		AddPosition: function(x, y, scale, time) {
			this.positions.push([x, y, scale, time]);			
		},
		GetPositionAt: function(time) {
			if (this.positions.length > this.last_position_index+1 && this.positions[this.last_position_index+1][3] <= time) {
				this.last_position_index++;
			}
			let current = this.positions[this.last_position_index];
			if (this.positions.length <= this.last_position_index+1) {
				return current;
			}
			let next = this.positions[this.last_position_index+1];
			let current_fraction = 1-(time-current[3])/(next[3]-current[3]);
			let next_fraction = 1-current_fraction;
			return [current_fraction*current[0]+next_fraction*next[0], current_fraction*current[1]+next_fraction*next[1], current_fraction*current[2]+next_fraction*next[2]];
		},
		handleUpdate: function(time) {
			if (this.hide_until && time < this.hide_until) {
				return;
			}
			
			let position = this.GetPositionAt(time);
			this.context.save();
			this.context.translate(position[0], position[1]);
			this.context.rotate(time/200);

			// Visual effect.
			this.context.save();
			this.context.scale(position[2]*1.5, position[2]*1.5);
			this.effect_icon.update(1, 1, true);
			this.context.restore();
			
			// Rotating ship.
			this.context.scale(position[2], position[2]);
			this.context.drawImage(this.image, -image_size/2, -image_size/2);
			this.context.restore();
		}
  };
})();


(function() {
	let image_size = 400;
		
  SBar.IntroIconTree = function(context) {
    this._initIntroIconTree(context);
  };

  SBar.IntroIconTree.prototype = {
		context: null,
		image: null,
		x: null,
		y: SF.HEIGHT-300,
		_initIntroIconTree: function(context) {
			this.context = context;
			this.BuildTree();
    },
		BuildTree: function() {
			let s = 1;
      this.image = document.createElement('canvas');
      this.image.width = image_size;
      this.image.height = image_size;
      let context = this.image.getContext('2d');

			// Game-level randoms.
      let treeheight = SU.r(1.1, s++) * 80 + 180;
      let treewidth = SU.r(1.2, s++) * 20 + 10;
      this.x = SU.r(1.3, s++) * 100 + 100;
      if (SU.r(1.4, s++) < 0.5) {
        this.x = SF.WIDTH - this.x;
      }
      SU.rect(context, image_size/2-treewidth/2, image_size-treeheight, treewidth, treeheight, "#000");

      SU.circle(context, image_size/2, image_size-treeheight - 50, 50, "#000");
      for (var i = 1; i < 50; i++) {
        SU.circle(context, image_size/2-(SU.r(1.5, s++) - 0.5) * 100, image_size-treeheight + (SU.r(1.6, s++) - 0.5) * 100, SU.r(1.7, s++) * 40 + 5, "#000");
      }
		},
		handleUpdate: function(time) {
			this.context.drawImage(this.image, this.x-image_size/2, this.y-image_size/2);
		}		
  };
})();

(function() {
	let image_height = 200;
	let image_width = SF.WIDTH;
		
  SBar.IntroIconGrass = function(context) {
    this._initIntroIconGrass(context);
  };

  SBar.IntroIconGrass.prototype = {
		context: null,
		image: null,
		x: null,
		y: SF.HEIGHT-300,
		_initIntroIconGrass: function(context) {
			this.context = context;
			this.BuildGrass();
    },
		BuildGrass: function() {
			let s = 1;
      this.image = document.createElement('canvas');
      this.image.width = image_width;
      this.image.height = image_height;
      let context = this.image.getContext('2d');
			
      SU.rect(context, 0, 100, SF.WIDTH, 100, "#000");

      let c = document.createElement('canvas');
      c.width = 20;
      c.height = 40;
      let grass = c.getContext('2d');

      grass.fillStyle = "#000";
      grass.beginPath();
			// Full random, for wind
      grass.moveTo(Math.random() * 20, 0);
      grass.lineTo(5, 40);
      grass.lineTo(15, 40);
      grass.closePath();
      grass.fill();

      for (var i = 0; i < 1000; i++) {
        context.drawImage(c, (SU.r(2.1, s++)) * (SF.WIDTH+20) - 10, 60 + (SU.r(2.2, s++)) * 15);
      }			
		},
		handleUpdate: function(time) {
			this.context.drawImage(this.image, 0, SF.HEIGHT-image_height);
		}		
  };
})();



(function() {
	let image_size = 50;
		
  SBar.IntroIconWmd = function(context) {
    this._initIntroIconWmd(context);
  };

  SBar.IntroIconWmd.prototype = {
		context: null,
		image: null,
		x: null,
		y: null,
		effect_icon: null,
		positions: [],
		last_position_index: -1,
		_initIntroIconWmd: function(context) {
			this.positions = [];
			this.context = context;
			this.BuildImage();
			this.effect_icon = new SBar.IconTempleEffect(this.context, 0, 0, false);
    },
		BuildImage: function() {
			let s = 1;
      this.image = document.createElement('canvas');
      this.image.width = image_size;
      this.image.height = image_size;
      let context = this.image.getContext('2d');
			
			context.save()
			context.translate(image_size/2, image_size/2);
			context.rotate(SU.r(12.23,23.34)*PIx2);
			SU.rect(context, -image_size/4, -image_size/4, image_size/2, image_size/2, "#222", 1, "#444");
			context.restore();
		},
		AddPosition: function(x, y, time) {
			this.positions.push([x, y, time]);			
		},
		// Similar to ship.
		GetPositionAt: function(time) {
			if (this.positions.length > this.last_position_index+1 && this.positions[this.last_position_index+1][2] <= time) {
				this.last_position_index++;
			}
			let current = this.positions[this.last_position_index];
			if (this.positions.length <= this.last_position_index+1) {
				return current;
			}
			let next = this.positions[this.last_position_index+1];
			let current_fraction = 1-(time-current[2])/(next[2]-current[2]);
			let next_fraction = 1-current_fraction;
			return [current_fraction*current[0]+next_fraction*next[0], current_fraction*current[1]+next_fraction*next[1]];
		},		
		handleUpdate: function(time) {
			let xy = this.GetPositionAt(time);
			// Visual effect.
			this.context.save();
			//this.context.scale(position[2]*1.5, position[2]*1.5);
			this.effect_icon.update(-xy[0], -xy[1], true);
			this.context.restore();
			
			this.context.drawImage(this.image, xy[0]-image_size/2, xy[1]-image_size/2);
		}		
  };
})();




(function() {
	let image_size = 400;
		
  SBar.IntroIconBar = function(context, x, y, building_name) {
    this._initIntroIconBar(context, x, y, building_name);
  };

  SBar.IntroIconBar.prototype = {
		context: null,
		image: null,
		lights1: null,
		lights2: null,
		x: null,
		y: null,
		_initIntroIconBar: function(context, x, y, building_name) {
			this.context = context;
			this.x = x;
			this.y = y;
			this.BuildImage(building_name);
    },
		BuildImage: function(building_name) {
			let font = SF.FONT_XLB;
      this.lights1 = document.createElement('canvas');
      this.lights1.width = image_size;
      this.lights1.height = image_size;
			let y1 = -15;
			let y2 = 15;
      let context = this.lights1.getContext('2d');
			context.save();
			context.translate(image_size/2, image_size/2);
			context.rotate(-0.2);
			SU.text(context, building_name[0].toUpperCase(), 0, y1, font, "#F00", "center");
			SU.text(context, building_name[1].toUpperCase(), 0, y2, font, "#F00", "center");

			// Get the width for a plaque.
      let line1_width = context.measureText(building_name[0].toUpperCase()).width;
      let line2_width = context.measureText(building_name[1].toUpperCase()).width;
			context.restore();
			
      this.lights2 = document.createElement('canvas');
      this.lights2.width = image_size;
      this.lights2.height = image_size;
      context = this.lights2.getContext('2d');
			context.save();
			context.translate(image_size/2, image_size/2);
			context.rotate(-0.2);
			SU.text(context, building_name[0].toUpperCase(), 0, y1, font, "#000", "center");
			SU.text(context, building_name[1].toUpperCase(), 0, y2, font, "#F00", "center");
			context.restore();
			
      this.image = document.createElement('canvas');
      this.image.width = image_size;
      this.image.height = image_size;
      context = this.image.getContext('2d');
			SU.text(context, "🏠", image_size/2, image_size/2+150, "280pt "+SF.FONT, "#FFF", "center");
			context.save();
			context.translate(image_size/2, image_size/2);
			context.rotate(-0.2);
			let sign_width = Math.max(line1_width, line2_width)+60;
			SU.rectCorner(context, 8, -sign_width/2, -110, sign_width, 70, "#763", "#431", 4);
			context.restore();
		},

		handleUpdate: function(time) {
			this.context.drawImage(this.image, this.x-image_size/2, this.y-image_size*0.8);
			let lights = SU.r(1.23, Math.round(time/100))<0.8 ? this.lights1 : this.lights2;
			this.context.drawImage(lights, this.x-image_size/2, this.y-image_size*0.96);
			//this.context.drawImage(lights, SF.HALF_WIDTH, SF.HALF_HEIGHT);
		}		
  };
})();



// Some sort of rumble image.
(function() {
	let size = 20;
		
  SBar.IntroIconFight = function(context, x, y, start_time) {
    this._initIntroIconFight(context, x, y, start_time);
  };

  SBar.IntroIconFight.prototype = {
		context: null,
		image: null,
		start_time: null,
		x: null,
		y: null,
		done: false,
		_initIntroIconFight: function(context, x, y, start_time) {
			this.context = context;
			this.x = x;
			this.y = y;
			this.start_time = start_time;
			this.effect_icon = new SBar.IconExplode(this.context, 0, 0, size);
    },

		handleUpdate: function(time) {
			if (this.done) {
				return;
			}
			if (time >= this.start_time) {
				if (!this.effect_icon.update(-this.x+SF.HALF_WIDTH, -this.y+SF.HALF_HEIGHT, false)) {
					this.done = true;
				}
			}
		}		
  };
})();




