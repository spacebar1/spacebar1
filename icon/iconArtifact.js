/*
 * Single artifact shape display and stats.
 */

(function() {
  var maxsize = 200;
  var imgbuf = 10;
  var PIx2 = (Math.PI * 2) - 0.0001;

  SBar.IconArtifact = function(ctx, arti) {
    this._initIconArtifact(ctx, arti);
  };

  SBar.IconArtifact.prototype = {
    type: SF.TYPE_ARTIFACT_SHAPE_ICON,
		arti: null, // Artifact data.
		skill: null, // SBar.Skill. Used for params here and also by the complex renderer.
    points: null, // List of x,y points that make up the artifact.
		pointsset: null, // Hashset "x,y" of points.
		points_orig: null, // Unrotated points.
		connectors: null, // list of x1,y1 -> x2,y2 connections.
		connectors_orig: null, // list of x1,y1 -> x2,y2 connections.
    ctx: null,
    seed: null,
    image: null,
		disabled_image: null,  // Image for when the prereqs aren't met.
		x: 0,
		y: 0,
    drawx: 0,
    drawy: 0,
		limit: null, // Maximum dimension length.
		rotation: 0,
		invalid_position: null,
    _initIconArtifact: function(ctx, arti) {
			this.skill = new SBar.Skill(arti);
      this.seed = this.skill.seed;
			
      this.ctx = ctx;
			this.arti = arti;
			this.points_orig = [];
      this.points = [];
      this.pointsset = {};
      this.connectors = [];
      this.connectors_orig = [];
      if (this.skill.type === SF.SKILL_OMEGA_FRAGMENT) {
        this.GenerateOmegaFragment();
      } else if (this.skill.type === SF.SKILL_TRUE_OMEGA) {
        this.GenerateTrueOmega();
		  } else if (this.skill.type === SF.SKILL_DARK_ENGINE) {
				this.GenerateDarkEngine();
		  } else if (this.skill.type === SF.SKILL_CARGO) {
				this.GenerateCargo();
      } else if (arti.fused_points) {
				this.points = SU.Clone(arti.fused_points);
				//for (let point of this.points) {
				//	this.pointsset[point[0]+","+point[1]] = true;
				//}
			} else {
        this.GenerateShape();
      }
			this.NormalizeAndMeasure(/*skip_normalize=*/arti.fused_points !== undefined);
			if (arti.fused_connectors) {
				this.connectors = SU.Clone(arti.fused_connectors);
				this.connectors_orig = SU.Clone(arti.fused_connectors);
			} else {
	      var num_connectors = 0;
	      if (this.skill.type === SF.SKILL_OMEGA_FRAGMENT || this.skill.type === SF.SKILL_TRUE_OMEGA || 
					  (this.skill.type >= SF.SKILL_SHIP && this.skill.type <= SF.SKILL_SHIP_SENSORS) || this.skill.type === SF.SKILL_DARK_ENGINE
				    || this.skill.type === SF.SKILL_STATS || this.skill.type === SF.SKILL_CARGO) {
					// Leave at 0.
				} else if (this.skill.type === SF.SKILL_BOOST) {
					// Boost needs at least one.
					// 1 - 5.
					num_connectors = Math.floor(SU.r(this.seed, 0.33)*5)+1;
				} else if (this.skill.type === SF.SKILL_ALPHA) {
					// 2 - 6.
					num_connectors = Math.floor(SU.r(this.seed, 0.33)*6)+1;
				} else {
					// Default the rest of the types to 0 - 4;
					num_connectors = Math.floor(SU.r(this.seed, 0.33)*5)
				}
				if (this.skill.skip_connectors) {
					num_connectors = 0;
				}
	      this.AddConnectors(num_connectors);
			}
      this.DrawArtifact();
			if (this.arti.installx !== undefined) {
				this.CenterAtTile(this.arti.installx, this.arti.instally, this.arti.rotation);
			}
    },
		AddPoint: function(x, y) {
      this.points.push([x, y]);
			this.pointsset[x+','+y] = true;
		},
    GenerateOmegaFragment: function() {
			// 5x5 grid. The center portion will be filled in.
			let rand = 0;
			for (let i = -2; i <= 2; i++) {
				for (let j = -2; j <= 2; j++) {
					if (SU.r(this.seed, 9.19+rand) < 0.5) {
						this.AddPoint(i, j);
					}
					rand++;
				}
			}
			this.AddPoint(0,0);
			
			//for (var i = 0; i < 10; i++) {
			//	this.AddPoint(i-5,0);
			//}
			/*
			this.AddPoint(-2, -2);
			this.AddPoint(-2, 0);
			this.AddPoint(-2, 2);
			this.AddPoint(0, -2);
			this.AddPoint(0, 0);
			this.AddPoint(0, 2);
			this.AddPoint(2, -2);
			this.AddPoint(2, 0);
			this.AddPoint(2, 2);
			*/
    },
    GenerateTrueOmega: function() {
			this.AddPoint(0,0);
    },		
    GenerateDarkEngine: function() {
			this.AddPoint(0,0);
			this.AddPoint(0,1);
			this.AddPoint(1,1);
			this.AddPoint(1,0);
			this.AddPoint(-1,0);
			this.AddPoint(-1,1);
			this.AddPoint(2,0);
			this.AddPoint(2,1);
			this.AddPoint(0,-1);
			this.AddPoint(1,-1);
			this.AddPoint(0,2);
			this.AddPoint(1,2);
    },
    GenerateShape: function() {
      //let raw_points = Math.floor(SU.r(this.seed, 0.29) * 1000);
      //let raw_points = Math.floor(SU.r(this.seed, 0.29) * 2000);
      // Points is 0 to 1000. General power of the artifact.
      //var size_points = Math.floor(raw_points * (SU.r(this.seed, 1.29) / 2 + 0.1));
			
			//var num_points = Math.floor((SU.r(this.seed, 5.69)+0.5)*70/Math.sqrt(size_points+50))+3;
			let num_points = Math.floor(SU.r(this.seed, 5.69)*15)+5;
      this.points.push([0, 0]);
			this.pointsset["0,0"] = true;
			num_points--;
			var tries = 1000;
			// Algorithm: pick a random existing point, and grow it in any direction.
			let r = SU.r(this.seed, 1.23);
			while(num_points > 0 && tries > 0) {
				var rootindex = Math.floor(SU.r(this.seed, r++)*this.points.length);
				var rootpoint = this.points[rootindex];
				var dir = SU.r(this.seed, r++);
				var testpoint = null;
				if (dir < 0.25) {
					testpoint = [rootpoint[0]-1, rootpoint[1]];
				} else if (dir < 0.5) {
					testpoint = [rootpoint[0]+1, rootpoint[1]];
				} else if (dir < 0.75) {
					testpoint = [rootpoint[0], rootpoint[1]-1];
				} else {
					testpoint = [rootpoint[0], rootpoint[1]+1];
				}
				if (!this.pointsset[testpoint[0]+','+testpoint[1]]) {
					this.points.push(testpoint);
					this.pointsset[testpoint[0]+','+testpoint[1]] = true;
					num_points--;
				}
				tries--;
			}
			if (tries === 0) {
				error("Failed GenerateShape tries.");
			}
		},
		GenerateCargo: function() {
			// Cargo is generally predictably shaped, but not always convenient.
			let cargo_type = this.skill.skill_params.cargo_type;
			switch (cargo_type) {
				case SF.CARGO_ORE:
					// Ore is big, with the corners clipped.
					// Smallest is a 3x3 plus sign, which can be carried by the starting ship.
					let width = Math.floor(SU.r(this.seed, 33.01)*4)+3; // 3-6;
					let height = Math.floor(SU.r(this.seed, 33.02)*4)+3; // 3-6;
					for (let i = 0; i < width; i++) {
						for (let j = 0; j < height; j++) {
							let corner = (i === 0 || i === width-1) && (j === 0 || j === height-1);
							if (!corner) {
								this.AddPoint(i,j);
							}
						}
					}
					break;
				case SF.CARGO_CONTRABAND:
					// Contraband is small. Intended to be convenient but risky.
					this.AddPoint(0,0);
					if (SU.r(this.seed, 31.01) < 0.8) {
						this.AddPoint(1,0);
						if (SU.r(this.seed, 31.02) < 0.7) {
							this.AddPoint(2,0);
						}
						if (SU.r(this.seed, 31.03) < 0.7) {
							this.AddPoint(1,1);
						}
						if (SU.r(this.seed, 31.04) < 0.7) {
							this.AddPoint(1,-1);
						}
					}
					break;
				case SF.CARGO_GOODS:
			  default:
					// Generally small.
					let r = SU.r(this.seed, 32.01);
					if (r < 0.4) {
						// Square.
						let size = Math.floor(SU.r(this.seed, 32.02)*3)+2; // 2-4;
						for (let i = 0; i < size; i++) {
							this.AddPoint(i,0);
							this.AddPoint(i,1);
						}
					} else if (r < 0.8) {
						// Line.
						let size = Math.floor(SU.r(this.seed, 32.03)*7)+2; // 2-8;
						for (let i = 0; i < size; i++) {
							this.AddPoint(i,0);
						}
					} else {
						// Box.
						let size = Math.floor(SU.r(this.seed, 32.04)*3)+2; // 2-4;
						for (let i = 0; i < size; i++) {
							for (let j = 0; j < size; j++) {
								this.AddPoint(i,j);
							}
						}
					}
					break;
			}
		},
		AddConnectors: function(num_connectors) {
			var connector_set = [];
			var tries = 1000;
			var r = SU.r(this.seed, 1.77);
			// Algorithm: pick a random block. Random direction. Add if it's unattached and no connector.
			while (num_connectors > 0 && tries > 0) {
				var rootindex = Math.floor(SU.r(this.seed, r++)*this.points.length);
				var rootpoint = this.points[rootindex];
				var dir = SU.r(this.seed, r++);
				var testpoint = null;
				if (dir < 0.25) {
					testpoint = [rootpoint[0]-1, rootpoint[1]];
				} else if (dir < 0.5) {
					testpoint = [rootpoint[0]+1, rootpoint[1]];
				} else if (dir < 0.75) {
					testpoint = [rootpoint[0], rootpoint[1]-1];
				} else {
					testpoint = [rootpoint[0], rootpoint[1]+1];
				}
				if (!this.pointsset[testpoint[0]+','+testpoint[1]] && 
				    !connector_set[rootpoint[0]+','+rootpoint[1]+','+testpoint[0]+','+testpoint[1]]) {
					this.connectors.push([rootpoint[0], rootpoint[1], testpoint[0], testpoint[1]]);
					this.connectors_orig.push([rootpoint[0], rootpoint[1], testpoint[0], testpoint[1]]);
					connector_set[rootpoint[0]+','+rootpoint[1]+','+testpoint[0]+','+testpoint[1]] = true;
					num_connectors--;
				}
				tries--;
			}
			if (tries === 0) {
				error("Failed AddConnectors tries.");
			}
			delete connector_set;
		},
		// Sets indices starting at 0,0, and records the max sizes.
		NormalizeAndMeasure: function(skip_normalize) {
			// Normalize to minimum x and y.
			var minx = 999;
			var miny = 999;
			var maxx = -999;
			var maxy = -999;
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				if (point[0] < minx) {
					minx = point[0];
				}
				if (point[0] > maxx) {
					maxx = point[0];
				}
				if (point[1] < miny) {
					miny = point[1];
				}
				if (point[1] > maxy) {
					maxy = point[1];
				}
			}
			var dx = Math.round((minx+maxx)/2);
			var dy = Math.round((miny+maxy)/2);
			// Normalize.
			if (!skip_normalize) {
				for (var i = 0; i < this.points.length; i++) {
					var point = this.points[i];
					point[0] -= dx;
					point[1] -= dy;
				}
			}
			this.limit = 0;
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				if (point[0] > this.limit) {
					this.limit = point[0];
				}
				if (-point[0] > this.limit) {
					this.limit = -point[0];
				}
				if (point[1] > this.limit) {
					this.limit = point[1];
				}
				if (-point[1] > this.limit) {
					this.limit = -point[1];
				}
			}
			// Rebuild the hashset.
      this.pointsset = {};
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				this.pointsset[point[0]+','+point[1]] = true;
			}
			// Record original points.
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				this.points_orig.push([point[0],point[1]]);
			}
			
    },
		DrawArtifact: function(/*optional, used internally*/disabled) {
			if (!disabled) {
				// Draw the corresponding disabled version.
				this.DrawArtifact(/*disabled=*/true);
			}
			if (this.invalid_position) {
				fill_pattern = SU.GetFillPattern(40, this.seed, 255, 0, 0);
			} else if (disabled) {
				//fill_pattern = SU.GetFillPattern(40, this.seed, 0, 0, 0);
			} else {
				fill_pattern = this.GetFillPattern();
			}
			let image = disabled ? this.disabled_image : this.image;
			if (!image) {
	      image = document.createElement('canvas');
	      this.image_size_x = (this.limit+2) * SF.ARTI_TILE_SIZE * 2 + imgbuf * 2;
	      this.image_size_y = (this.limit+2) * SF.ARTI_TILE_SIZE * 2 + imgbuf * 2;
	      image.width = this.image_size_x;
	      image.height = this.image_size_y;
				if (disabled) {
					this.disabled_image = image;
				} else {
					this.image = image;
				}
			}
      let context = image.getContext('2d');
			context.clearRect(0, 0, image.width, image.height);
			context.save();
      context.translate(this.image_size_x/2, this.image_size_y/2);
		
			/*
      var rot_pattern = document.createElement('canvas');
      var size = 40;
      rot_pattern.width = size;
      rot_pattern.height = size;
      var rotc = rot_pattern.getContext('2d');
			rotc.translate(size/2, size/2);
			rotc.rotate(-this.rotation*Math.PI/180);
			SC.layer3.drawImage(rot_pattern, SF.HALF_WIDTH, SF.HALF_HEIGHT);
			*/
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];

	      context.beginPath();
				var x = point[0]*SF.ARTI_TILE_SIZE;
				var y = point[1]*SF.ARTI_TILE_SIZE;
		    context.rect(point[0]*SF.ARTI_TILE_SIZE, point[1]*SF.ARTI_TILE_SIZE, SF.ARTI_TILE_SIZE, SF.ARTI_TILE_SIZE);
	      context.closePath();
	      context.save();
	      context.clip();  // Comment out this to see full picture.
				context.translate(SF.ARTI_TILE_SIZE/2,SF.ARTI_TILE_SIZE/2);
				context.rotate(-this.rotation*Math.PI/180);
				if (disabled && !this.invalid_position) {
		      //context.drawImage(fill_pattern, 0, 0, 40, 40, -this.image_size_x/2, -this.image_size_x/2, this.image_size_x, this.image_size_y);
//					for (let i = -this.image_size_x/2; i < this.image_size_x; i+= 5) {
//						let color = i % 2 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
//						SU.rect(context, i, -this.image_size_x/2, 11, this.image_size_y, color);	
//					}
					SU.rect(context, -this.image_size_x/2, -this.image_size_x/2, this.image_size_x, this.image_size_y, 'rgba(0,0,0,0.5)');
//					for (let i = -this.image_size_x/2; i < this.image_size_x; i+= 11) {
//						SU.line(context, i, -this.image_size_x/2, i, this.image_size_y, "#F00")
//						SU.text(context, "X", 0, 0+50, 'bold 100pt '+SF.FONT, "F00", 'center')						
//					}
				} else {
		      context.drawImage(fill_pattern, 0, 0, 40, 40, -this.image_size_x/2, -this.image_size_x/2, this.image_size_x, this.image_size_y);
				}
	      context.restore();
				
				// Draw borders where needed.
				let border_color = disabled ? "#F00" : "#000";
				if (!this.pointsset[(point[0])+','+(point[1]-1)]) {
					SU.line(context, x, y, x + SF.ARTI_TILE_SIZE, y, border_color, 1);
				}
				if (!this.pointsset[(point[0])+','+(point[1]+1)]) {
					SU.line(context, x, y+SF.ARTI_TILE_SIZE, x + SF.ARTI_TILE_SIZE, y+SF.ARTI_TILE_SIZE, border_color, 1);
				}
				if (!this.pointsset[(point[0]+1)+','+(point[1])]) {
					SU.line(context, x+SF.ARTI_TILE_SIZE, y, x + SF.ARTI_TILE_SIZE, y+SF.ARTI_TILE_SIZE, border_color, 1);
				}
				if (!this.pointsset[(point[0]-1)+','+(point[1])]) {
					SU.line(context, x, y, x, y+SF.ARTI_TILE_SIZE, border_color, 1);
				}
			}
			let connector_edge = disabled ? "#F00" : "#000";
			// Add connectors.
      for (var i = 0; i < this.connectors.length; i++) {
        var c = this.GetConnectorCenter(this.connectors[i]);
        var rot = this.GetConnectorDirection(this.connectors[i]);
				context.save();
	      context.translate(c[0], c[1]);
				context.rotate(rot);
	      context.beginPath();
	      context.arc(0, 0, 6, 0, Math.PI, false);
	      context.closePath();
        context.lineWidth = 2;
        context.strokeStyle = connector_edge;
        context.stroke();
				context.fillStyle = "#FFF";
        context.fill();
				context.restore();
				/*
	      context.arc(SF.ARTI_TILE_SIZE*point[0]+SF.ARTI_TILE_SIZE/2, SF.ARTI_TILE_SIZE*point[1]+SF.ARTI_TILE_SIZE/2, SF.ARTI_TILE_SIZE/2, 0, PIx2, false);
							
        SU.circle(context, c[0], c[1], 6, "#FFF", 2, "#000");
				*/
      }
			context.restore();
    },
    // Places artifact for drawing.
    CenterAt: function(x, y) {
      this.drawx = x;
      this.drawy = y;
    },
		CenterAtTile: function(x, y, rotation) {
			this.x = x;
			this.y = y;
      this.drawx = x*SF.ARTI_TILE_SIZE;
      this.drawy = y*SF.ARTI_TILE_SIZE;
			if (rotation != this.rotation) {
				this.rotation = rotation;
				this.HandleRotation();
			}
		},
		CenterIfValid: function(x, y, rotation, ship_shape) {
			var lastx = this.x;
			var lasty = this.y;
			var lastrot = this.rotation;
			var lastdrawx = this.drawx;
			var lastdrawy = this.drawy;
			this.CenterAtTile(x, y, rotation);
			if (!this.IsValidPosition(ship_shape)) {
				this.x = lastx;
				this.y = lasty;
				this.rotation = lastrot;
				this.drawx = lastdrawx;
				this.drawy = lastdrawy;
				this.HandleRotation(lastrot);
				return false;
			}
			return true;
		},
		CenterReturnValid: function(x, y, rotation, ship_shape) {
			var lastx = this.x;
			var lasty = this.y;
			var lastrot = this.rotation;
			var lastdrawx = this.drawx;
			var lastdrawy = this.drawy;
			this.CenterAtTile(x, y, rotation);
			return this.IsValidPosition(ship_shape);
		},
		// Returns the rotation for a single point.
		PointRotate: function(point) {
			var mod_point = [point[0],point[1]];
			var new_point;
			if (this.rotation == 0) {
				new_point = [mod_point[0], mod_point[1]];
			} else if (this.rotation == 90) {
				new_point = [mod_point[1], -mod_point[0]];
			} else if (this.rotation == 180) {
				new_point = [-mod_point[0], -mod_point[1]];
			} else if (this.rotation == 270) {
				new_point = [-mod_point[1], mod_point[0]];
			} else {
				error("Badrot");
			}
			new_point[0] = Math.round(new_point[0]);
			new_point[1] = Math.round(new_point[1]);
			return new_point
		},
		// Returns the rotation for two points.
		PointRotate2: function(point) {
			var first = this.PointRotate([point[0],point[1]]);
			var second = this.PointRotate([point[2],point[3]]);
			return [first[0],first[1],second[0],second[1]];
		},
		// Move to the specified rotation.
		HandleRotation: function() {
			if (this.skill.type === SF.SKILL_DARK_ENGINE) {
				return;
			}
			this.pointsset = {};
			this.points = [];
			for (var i = 0; i < this.points_orig.length; i++) {
				var old_point = this.points_orig[i];
				var new_point = this.PointRotate(old_point);
				this.points.push(new_point);
				this.pointsset[new_point[0]+','+new_point[1]] = true;
			}
			this.connectors = [];
			for (var i = 0; i < this.connectors_orig.length; i++) {
				this.connectors.push(this.PointRotate2(this.connectors_orig[i]));
				var x = this.connectors[i];
			}
			this.DrawArtifact();
		},
    ResetContext: function(ctx) {
      this.ctx = ctx;
    },
		update: function(/*optional*/disabled) {
			let image = disabled ? this.disabled_image : this.image;
/*			if (disabled) {
				this.ctx.save();
				this.ctx.globalAlpha = 0.5;
				this.ctx.globalCompositeOperation = "exclusion";
	      this.ctx.drawImage(this.image, this.drawx-this.image_size_x/2, this.drawy-this.image_size_y/2);
				this.ctx.globalAlpha = 0.5;
				this.ctx.globalCompositeOperation = "xor";
	      this.ctx.drawImage(this.image, this.drawx-this.image_size_x/2, this.drawy-this.image_size_y/2);
//				this.ctx.save();
//				this.ctx.globalAlpha = 0.5;
			}
			*/
			// 50% darken / multiply. Screen+xor at 50% looks good.
			// screen, multiply?, overlay,  darken, xor?, color-dodge*, color-burn*, difference?, exclusion*, 
      this.ctx.drawImage(image, this.drawx-this.image_size_x/2, this.drawy-this.image_size_y/2);
//			if (disabled) {
//				this.ctx.restore();
//			}
    },
		DrawAt: function(x, y) {
      this.ctx.drawImage(this.image, x-this.image_size_x/2, y-this.image_size_y/2);
		},
    teardown: function() {
    },
		GetConnectorCenter: function(connector) {
			return [SF.ARTI_TILE_SIZE*(connector[0]+connector[2])/2+SF.ARTI_TILE_SIZE/2, SF.ARTI_TILE_SIZE*(connector[1]+connector[3])/2+SF.ARTI_TILE_SIZE/2];
		},
		GetConnectorDirection: function(connector) {
			if (connector[0] < connector[2]) {
				return Math.PI/2;
			} else if (connector[0] > connector[2]) {
				return Math.PI*3/2;
			} else if (connector[1] < connector[3]) {
				return Math.PI;
			} else {
				return 0;
			}
			return [SF.ARTI_TILE_SIZE*(connector[0]+connector[2])/2+SF.ARTI_TILE_SIZE/2, SF.ARTI_TILE_SIZE*(connector[1]+connector[3])/2+SF.ARTI_TILE_SIZE/2];
		},
    GetFillPattern: function() {
      var r = Math.floor(SU.r(this.seed, 12.5) * 200) + 50;
      var g = Math.floor(SU.r(this.seed, 12.6) * 200) + 50;
      var b = Math.floor(SU.r(this.seed, 12.7) * 200) + 50;
			if (this.skill.type === SF.SKILL_OMEGA_FRAGMENT || this.skill.type === SF.SKILL_DARK_ENGINE || this.skill.type === SF.SKILL_TRUE_OMEGA) {
				r = Math.floor(SU.r(this.seed, 12.8) * 70)
				g = Math.floor(SU.r(this.seed, 12.9) * 70)
				b = Math.floor(SU.r(this.seed, 12.1) * 70)
			}			
			return SU.GetFillPattern(40, this.seed, r, g, b);
    },
		// Test each square for placement validity.
		IsValidPosition: function(ship_shape) {
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				if (!ship_shape.IsValid(point[0]+this.x,point[1]+this.y)) {
					return false;
				}
			}
			return true;
		},
		// Return true if the point is on the artifact.
		IsArtiTile: function(point) {
			for (var i = 0; i < this.points.length; i++) {
				if (this.points[i][0] == point[0] && this.points[i][1] == point[1]) {
					return true;
				}
			}			
			return false;
		},
		IsOverlap: function(other_icon) {
			for (var i = 0; i < this.points.length; i++) {
				var point = this.points[i];
				if (other_icon.pointsset[(this.x+point[0]-other_icon.x)+','+(this.y+point[1]-other_icon.y)] === true) {
					return true;
				}
			}
			return false;
		},
		SetInvalidPosition: function(is_invalid) {
			if (this.invalid_position === is_invalid) {
				return;
			}
			this.invalid_position = is_invalid;
			this.DrawArtifact();
		},
		// Returns the points in this artifact with an offset. 
		GetPoints(offx, offy) {
			let updated_points = [];
			for (point of this.points) {
				updated_points.push([point[0]+offx, point[1]+offy]);
			}
			return updated_points;
		},
		// Returns the connectors in this artifact with an offset. 
		GetConnectors(offx, offy) {
			let updated_connectors = [];
			for (connector of this.connectors) {
				updated_connectors.push([connector[0]+offx, connector[1]+offy, connector[2]+offx, connector[3]+offy]);
			}
			return updated_connectors;
		},
  }
  SU.extend(SBar.IconArtifact, SBar.Icon);

})();
	
