/*
  Draws an alien.
The globalCompositeOperations could be more effective with separate canvases, but currently
I don't want to put the effort & performance cost into it.
*/

(function() {
	var WIDTH = SF.WIDTH;
	var HEIGHT = SF.HEIGHT;
  var EYE_SIZE = 100;
  var EYE_BUF = 15;
  var EYEUP = (EYE_SIZE + EYE_BUF * 2) / EYE_SIZE;
  var miningColorStops1 = [0, '#A80', 1, '#540'];
  var miningColorStops2 = [0, '#540', 1, '#A80'];
  var constructionColorStops1 = [0, '#FF8', 1, '#AA0'];
  var constructionColorStops2 = [0, '#FF8', 1, '#AA0'];
  var armorColorStops1 = [0, '#666', 1, '#222'];
	SBar.IconAlien = function(seed, raceseed, data_type, data_faction, is_home_bar, override_random, options) {
		this._initIconAlien(seed, raceseed, data_type, data_faction, is_home_bar, override_random, options);
	};

	SBar.IconAlien.prototype = {
		type: SF.TYPE_ALIEN_ICON,
		data_type: null,
		seed: null,
		raceseed: null,
		image: null,
		context: null,
		centerx: null,
		centery: null,
		eyes: null,
		headxs: null,
		headyx: null,
		smilexys: null,
		numHeads: null,
		numArms: null,
    s: 0.1,
    visits: 0.2,
    visitsStart: 0.3, // base seed of visits
    fulls: 0.4,
    reflect1x: null,
    reflect1y: null,
    reflect2x: null,
    reflect2y: null,
		timeout: null,
    bodycenterh: null,
    bodycenterv: null,
		options: null, // May be null. May contain sell_callback.
		
		_initIconAlien: function(seed, raceseed, data_type, data_faction, is_home_bar, override_random, options) {
			this.seed = seed;
			this.is_home_bar = is_home_bar;
			this.raceseed = raceseed;
			this.data_type = data_type;
			this.data_faction = data_faction;
      this.image = document.createElement('canvas');
      this.image.width = WIDTH;
      this.image.height = HEIGHT;
      this.context = this.image.getContext('2d');

      this.width = WIDTH;
      this.height = HEIGHT;
      //this.visits = SU.r((new Date()).getTime(), 1.7);
      //this.fulls = SU.r((new Date()).getTime(), 1.71);
      this.visits = SU.r(S$.time, 1.7);
      this.fulls = SU.r(S$.time, 1.71);
      this.s = 0;
      this.headseed = 0;
			this.options = {};
			if (options) {
				this.options = options;
			}
			
			if (override_random) {
				// Same random results each time.
				this.visits = 234;
				this.fulls = 345;
			}
			this.context.save();
			this.context.translate(WIDTH/2,HEIGHT/2);
			this.xscale = this.rand()/3+0.8;
			this.yscale = this.rand()/3+0.8;
      this.context.scale(this.xscale,this.yscale);

      this.headxs = [];
      this.headys = [];
      this.smilexys = [];
      this.numHeads = Math.floor(this.rand() * this.rand() * this.rand() * this.rand() * 40) + 1;
      this.numArms = Math.floor(this.rand() * this.rand() * this.rand() * 50);

      var numEyes;
      var eyeRand = this.rand();
      if (eyeRand > 0.8)
        numEyes = 1;
      else if (eyeRand > 0.5)
        numEyes = 2;
      else if (eyeRand > 0.4)
        numEyes = 3;
      else if (eyeRand > 0.3)
        numEyes = 4;
      else if (eyeRand > 0.25)
        numEyes = 5;
      else if (eyeRand > 0.2)
        numEyes = 6;
      else if (eyeRand > 0.15)
        numEyes = 8;
      else if (eyeRand > 0.1)
        numEyes = 12;
      else if (eyeRand > 0.05)
        numEyes = 20;
      else if (eyeRand > 0.03)
        numEyes = 50;
      else
        numEyes = 0;
      this.numEyes = numEyes;


      this.headr = Math.floor(this.barrand() * 156) + 100;
      this.headg = Math.floor(this.barrand() * 156) + 100;
      this.headb = Math.floor(this.barrand() * 156) + 100;
      this.fill = 'rgb(' + this.headr + ',' + this.headg + ',' + this.headb + ')';
      this.stroke = 'rgba(' + (this.headr - 100) + ',' + (this.headg - 100) + ',' + (this.headb - 100) + ',1)';
      this.bodyfill = 'rgba(' + (this.headr - 60) + ',' + (this.headg - 60) + ',' + (this.headb - 60) + ',1)';
			if (raceseed === SF.RACE_SEED_HUMAN || raceseed === SF.RACE_SEED_ALPHA) {
				// Human player.
				this.DrawHuman();
				return;
			}			
			
      this.bodycenterh = this.rand() * WIDTH / 5 - WIDTH / 10;
      this.bodycenterv = -HEIGHT/2+this.height * 5 / 7 - this.rand() / 10 * this.height;
			if (override_random) {
				this.bodycenterh = 0;
				this.bodycenterv = 0;
			}
      this.placeHeads();
      this.context.lineJoin = 'round';

      this.eyeimages = [];
      this.eyecontexts = [];
      this.eyer = Math.floor(this.rand() * 256);
      this.eyeg = Math.floor(this.rand() * 256);
      this.eyeb = Math.floor(this.rand() * 256);
      this.reflect1x = this.rand();
      this.reflect1y = this.rand();
      this.reflect2x = this.rand();
      this.reflect2y = this.rand();
			var eye_type = this.rand();
			var eye_sides = Math.floor(this.rand()*4)*Math.floor(this.rand()*4)+4;
      for (var i = 0; i < this.numHeads; i++) {
        this.smilexys[i] = {x: 0, y: 0};

        this.eyeimages[i] = document.createElement('canvas');
        this.eyeimages[i].width = EYE_SIZE + EYE_BUF * 2;
        this.eyeimages[i].height = EYE_SIZE + EYE_BUF * 2;
        this.eyecontexts[i] = this.eyeimages[i].getContext('2d');
        this.eyecontexts[i].translate(EYE_BUF, EYE_BUF);

        var offsetx = this.visitrand() - 0.5;
        var offsety = this.visitrand() - 0.5;
        this.drawEyeTemplate(offsetx, offsety, i, eye_type, eye_sides);
      }			
      this.headblink = [];
      for (var i = 0; i < this.numHeads; i++) {
        this.headblink[i] = 0;
      }
			if (this.rand() < 0.5) {
				this.start_eye_closed = Math.floor(this.visitrand()*40);
				if (this.circle_eyes) {
		      for (var i = 0; i < this.numHeads; i++) {
		        this.headblink[i] = this.start_eye_closed;
		      }
				}
			}
      this.drawAll(override_random);	
			this.context.restore();  // Move off centering x,y.
		},
		DrawHuman: function() {
			this.context.save()
      var r = Math.floor(SU.r(this.seed, 6.12) * 156) + 100;
      var g = Math.floor(SU.r(this.seed, 6.13) * 156) + 100;
      var b = Math.floor(SU.r(this.seed, 6.14) * 156) + 100;
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.context.translate(WIDTH/2, HEIGHT/2);
			
			// Keep it consistent, otherwise there are big advantages / disadvantages.
			var heady = -250;
			var head_size = 120;
			var body_length = 210;
			var body_width = 120;
			var leg_width = 110;
			var leg_x = 150;
			var leg_y = 300;
			var arm_width = 100;
			var arm_x = 220;
			var arm_y = -170;
			
			// Draw twice for the borders.
			let border = "rgb("+(r-100)+","+(g-100)+","+(b-100)+")";
			this.fill = border;
		  SU.circle(this.context, 0, heady, head_size+5, this.fill);
      SU.line(this.context, 0, body_length/2, 0, -body_length/2, this.fill, body_width+10);
      this.context.lineCap = "round";
      SU.line(this.context, 0, body_length/2, -leg_x, leg_y, this.fill, leg_width+10);
      SU.line(this.context, 0, body_length/2, leg_x, leg_y, this.fill, leg_width+10);
      SU.line(this.context, 0, -body_length/4, -arm_x, arm_y, this.fill, arm_width+10);
      SU.line(this.context, 0, -body_length/4, arm_x, arm_y, this.fill, arm_width+10);
			
			
			this.fill = "rgb("+r+","+g+","+b+")";			
		  SU.circle(this.context, 0, heady, head_size, this.fill);
      SU.line(this.context, 0, body_length/2, 0, -body_length/2, this.fill, body_width);
      this.context.lineCap = "round";
      SU.line(this.context, 0, body_length/2, -leg_x, leg_y, this.fill, leg_width);
      SU.line(this.context, 0, body_length/2, leg_x, leg_y, this.fill, leg_width);
      SU.line(this.context, 0, -body_length/4, -arm_x, arm_y, this.fill, arm_width);
      SU.line(this.context, 0, -body_length/4, arm_x, arm_y, this.fill, arm_width);
			
			// Tophat.
			let context = this.context;
      context.beginPath();
      context.moveTo(-WIDTH/4, -HEIGHT/4);
      context.lineTo(-WIDTH/4, -HEIGHT/4-20);
      context.lineTo(-WIDTH/8, -HEIGHT/4-20);
      context.lineTo(-WIDTH/8, -HEIGHT*0.48);
      context.lineTo(WIDTH/8, -HEIGHT*0.48);
      context.lineTo(WIDTH/8, -HEIGHT/4-20);
      context.lineTo(WIDTH/4, -HEIGHT/4-20);
      context.lineTo(WIDTH/4, -HEIGHT/4);
      context.closePath();

      context.lineWidth = 10;
			if (this.raceseed == SF.RACE_SEED_ALPHA) {
				context.fillStyle = "#000"
				context.fill();
				context.strokeStyle = "#444";
				context.stroke();
				// Note friendly Alphas don't have hat symbols.
				// This is easier than trying to track and change symbols on leveling.
			} else {
	      r = Math.floor(SU.r(this.seed, 6.22) * 156) + 100;
	      g = Math.floor(SU.r(this.seed, 6.23) * 156) + 100;
	      b = Math.floor(SU.r(this.seed, 6.24) * 156) + 100;
				let stampsize = 13;
				let fillimg = SU.GetFillPattern(stampsize, this.seed, r, g, b, 256);
			
				context.fillStyle = "#FFF"
				context.fill();
				context.save();
				context.globalCompositeOperation = 'source-atop';
				context.drawImage(fillimg, 0, 0, stampsize, stampsize, -WIDTH/4, -HEIGHT/2, WIDTH/2, HEIGHT/4)
				context.restore();
				//context.fillStyle = context.createPattern(patimg, "repeat");;
	      //context.fill();

				border = "rgb("+(r-100)+","+(g-100)+","+(b-100)+")";
	      context.strokeStyle = border;
	      context.stroke();
			}
			
			this.context.restore();
			
		},
		drawAll: function(override_random) {
      this.context.lineJoin = 'round';
			if (!this.first_visits) {
				this.first_visits = this.visits;
				this.first_headseed = this.headseed;
				this.first_s = this.s;
			} else {
				// Preserve randoms in each draw.
				this.visits = this.first_visits;
				this.headseed = this.first_headseed;
				this.s = this.first_s;
			}
      this.context.clearRect(0, 0, WIDTH, HEIGHT);
			
      this.context.save();
      this.context.lineCap = "round";
      var bodyrot = this.visitrand() * Math.PI / 4 - Math.PI / 8;
			if (override_random) {
				bodyrot = 0;
			}
			this.drawWings(bodyrot);
      this.drawArms(bodyrot);
      this.context.lineCap = "butt";
		  this.has_heads = this.rand() < 0.95;
			if (this.has_heads) {
	      this.drawNecks();
			}
			var body_extra_times = Math.floor(this.rand()*5);
			
      this.drawBody(bodyrot, body_extra_times == 0);
			// Some funky extra drawing.
			for (var i = 0; i < body_extra_times; i++) {
				var type = this.rand();
				if (type < 0.1) {
					this.context.globalCompositeOperation = 'distination-out';
//				} else if (type < 0.4) {
					//this.context.globalCompositeOperation = 'lighter';
				} else if (type < 0.55) {
					this.context.globalCompositeOperation = 'source-atop';
//				} else if (type < 0.8) {
					//this.context.globalCompositeOperation = 'distination-over';
				} else if (type < 0.6) {
					this.context.globalCompositeOperation = 'xor';
				} // Else no special effect.
	      this.drawBody(bodyrot, i == body_extra_times-1);
				this.context.globalCompositeOperation = 'source-over';
			}
      this.drawFeet(bodyrot);
			if (this.has_heads) {
	      this.drawHeads(this.numEyes);				
			}
      this.context.restore();				
		},
		
    placeHeads: function() {
      this.headxs = [];
      this.headys = [];
      for (var i = 0; i < this.numHeads; i++) {
        this.headxs[i] = this.visitrand()*WIDTH/2 - WIDTH/4;
        this.headys[i] = -HEIGHT/2+450 - this.barrand() * 400;
      }
    },
    drawNecks: function() {
			var type_rand = this.rand();
      for (var i = 0; i < this.numHeads; i++) {
				this.drawNeck(type_rand, this.headxs[i], this.headys[i]);
      }
    },
		drawNeck: function(type_rand, headx, heady) {
			var necksize = Math.floor(this.rand()*40)+5;
			if (type_rand < 0.25) {
				// Curved neck.
	      var offy = this.bodycenterh+this.visitrand() * 600 - 300;
	      var offx = this.bodycenterv+this.visitrand() * 600 - 300;
	      SU.quadratic(this.context, headx, heady, offy, offx, this.bodycenterh, this.bodycenterv, this.stroke, necksize / this.numHeads + 3);
	      SU.quadratic(this.context, headx, heady, offy, offx, this.bodycenterh, this.bodycenterv, this.fill, (necksize / this.numHeads + 3) / 2);
			} else if (type_rand < 0.5) {
				// Straight neck.
        SU.line(this.context, headx, heady, this.bodycenterh, this.bodycenterv, this.stroke, necksize / this.numHeads + 3);
        SU.line(this.context, headx, heady, this.bodycenterh, this.bodycenterv, this.fill, (necksize / this.numHeads + 3) / 2);
			} else if (type_rand < 0.8) {
				// Crazy neck.
	      this.context.beginPath();
	      this.context.moveTo(this.bodycenterh, this.bodycenterv, this.stroke);
				var x = this.rand()*300-150;
				var y = this.rand()*300-150;
				var x2 = this.rand()*300-150;
				var y2 = this.rand()*300-150;
	      this.context.quadraticCurveTo(headx+x, heady+y, headx+x2, heady+y2);
				x = this.rand()*300-150;
				y = this.rand()*300-150;
				x2 = this.rand()*300-150;
				y2 = this.rand()*300-150;
	      this.context.quadraticCurveTo(headx+x, heady+y, headx+x2, heady+y2);
	      this.context.quadraticCurveTo(headx+x2, heady+y2, headx, heady);
	      this.context.closePath();

	      this.context.lineWidth = necksize / this.numHeads + 3;
	      this.context.strokeStyle = this.stroke;
	      this.context.stroke();
			}
			// Else no neck.
		},
    drawHeads: function(numEyes) {
      var numAnt;
      var antRand = this.rand();
      if (antRand > 0.8)
        numAnt = 0;
      else if (antRand > 0.6)
        numAnt = 1;
      else if (antRand > 0.4)
        numAnt = 2;
      else
        numAnt = this.rand() * this.rand() * 150;

      for (var i = 0; i < this.numHeads; i++) {
        this.s = 777;
        this.headseed++;

        this.context.save();
        this.context.translate( this.headxs[i], this.headys[i]);
        var headrotation = this.visitrand() * Math.PI / 4 - Math.PI / 8;
        this.context.rotate(headrotation);
        this.context.scale((1 + this.headrand() - 0.25) / (this.numHeads / 3 + 0.75), (1 + this.headrand() - 0.25) / (this.numHeads / 3 + 0.75));
        this.drawHead(numEyes, numAnt, i);

				let orig_s = this.s;
				if (this.data_type === SF.TYPE_OBSERVATORY) {
					this.drawHelmet();
				}
				this.s = orig_s;
				
        this.context.restore();
      }
    },		
    drawHead: function(numEyes, numAnt, headNum) {
      var rotation = this.rand() * 360; // rotation for head shape generation, doesn't rotate any of the head parts

      var rad = this.width / 32 + this.rand() * this.width / 32;

      var x1 = 40;
      var y1 = 40;
      var x2 = x1 - this.rand() * 50 - 75;
      var y2 = y1;
      var x3 = x2;
      var y3 = y2 - this.rand() * 50 - 75;
      var x4 = x1;
      var y4 = y3;

      this.drawEyeStalks(numEyes);

      this.drawAntStalks(numAnt);

      this.context.strokeStyle = this.stroke;
      this.context.lineWidth = 10;
      this.context.fillStyle = this.fill;

			if (this.rand() < 0.5) {
				rotation += Math.PI;
			}			
      this.drawHeadShape(x1, y1, x2, y2, x3, y3, x4, y4, rotation);
      SU.circle(this.context, 0, 0, rad, this.fill, this.stroke, 10);

      // do it again, no border
      this.context.lineWidth = 0;
      this.context.strokeStyle = 'rgba(0,0,0,0)';

      this.drawHeadShape(x1, y1, x2, y2, x3, y3, x4, y4, rotation);
			// Some funky extra drawing.
			if (this.rand() < 0.75) {
				var type = this.rand();
				if (type < 0.2) {
					this.context.globalCompositeOperation = 'source-atop';
				} else if (type < 0.4) {
					this.context.globalCompositeOperation = 'distination-over';
				} else if (type < 0.6) {
					this.context.globalCompositeOperation = 'distination-out';
				} else if (type < 0.8){
					this.context.globalCompositeOperation = 'lighter';
				} // Else no special effect.
	      this.drawHeadShape(x1, y1, x2, y2, x3, y3, x4, y4, rotation);
				this.context.globalCompositeOperation = 'source-over';
			}
      SU.circle(this.context, 0, 0, rad, this.fill);

			let orig_s = this.s;
      if (this.data_type === SF.TYPE_MINING) {
        this.drawMiningHelmet(rad);
      } else if (this.data_type === SF.TYPE_ARMORY) {
        this.drawArmorHelmet(rad);
      } else if (SU.IsCityType(this.data_type)) {
        this.drawBeard();
      } else if (this.data_type === SF.TYPE_COLONY) {
        this.drawFedora(rad);
			} else if (this.data_type === SF.TYPE_CONSTRUCTION) {
				this.drawConstructionHelmet(rad);
      } else if (this.data_type === SF.TYPE_UNIVERSITY) {
      	this.drawUniversityHat(rad);
      }
			this.s = orig_s;

			this.drawNose();
			if (this.rand() < 0.6) {
	      this.drawSmile(headNum);  // Mouth.
			}
      this.drawEyes(numEyes, headNum);
    },		
    drawNose: function(headNum) {
			var nose_type = this.rand();
			if (nose_type < 0.25) {
				// Lines.
				for (var i = 0; i < Math.floor(this.rand()*3)+1; i++) {
		      var x1 = this.rand() * 200 - 100;
		      var y1 = this.rand() * 200 - 100;
		      var x2 = this.rand() * 200 - 100;
		      var y2 = this.rand() * 200 - 100;
		      var x3 = this.rand() * 200 - 100;
		      var y3 = this.rand() * 200 - 100;
		      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.stroke, 10);
		      SU.quadratic(this.context, -x1, y1, -x2, y2, -x3, y3, this.stroke, 10);
				}				
			} else if (nose_type < 0.75) {
	      var y = this.rand() * 200 - 100;
	      var sides = Math.floor(this.rand()*5)+4;
	      var size = Math.floor(this.rand()*100)+10;
				if (this.rand() < 1.5) {
		      var x1 = this.rand() * 200 - 100;
		      var y1 = this.rand() * 200 - 100;
		      var x2 = this.rand() * 200 - 100;
		      var y2 = this.rand() * 200 - 100;
		      var x3 = this.rand() * 200 - 100;
		      var y3 = this.rand() * 200 - 100;
		      this.context.strokeStyle = this.stroke;
		      this.context.lineWidth = 10;
		      this.context.fillStyle = this.fill;
					this.drawHeadShape(x1, y1, x2, y2, x3, y3, 0, 0, 0);
		      // do it again, no border
		      this.context.lineWidth = 0;
		      this.context.strokeStyle = 'rgba(0,0,0,0)';
					this.drawHeadShape(x1, y1, x2, y2, x3, y3, 0, 0, 0);
				}
				
			}
    },		
    drawSmile: function(headNum) {
      var x1 = this.visitrand() * 30 - 15 - 40;
      var y1 = this.visitrand() * 20 + 20;
      var x2 = this.visitrand() * 10 - 5;
      var y2 = this.visitrand() * 60 + 30;
      if (this.data_faction === SF.FACTION_PIRATE) {
        // switch to frown
        y2 -= 100;
      }
      var x3 = this.visitrand() * 30 - 15 + 40;
      var y3 = this.visitrand() * 20 + 20;

      var rotation = this.visitrand() * Math.PI / 4 - Math.PI / 8;
      this.context.save();
      this.context.rotate(rotation);

      var gap = this.visitrand() * 30 + 5;
      SU.quadratic(this.context, x1, y1, x2, y2 + gap / 2, x3, y3, "#FFF", 10);
      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.stroke, 10);
      SU.quadratic(this.context, x1, y1, x2, y2 + gap, x3, y3, this.stroke, 10);
      this.smilexys[headNum].x = x2;
      this.smilexys[headNum].y = y2;
      this.context.restore();
			
			var tongue_rand = this.rand();
      this.context.lineCap = 'round';
			x1 = x2;
			y1 = (y1+y2)/2;
			if (tongue_rand < 0.25) {
				var num = 1;
				if (this.rand() < 0.5) {
					num = Math.floor(this.rand()*4)+1;
				}
				var size = this.rand()*25+5;
				for (var i = 0; i < num; i++) {
		      var x2 = this.visitrand() * 160 - 80;
		      var y2 = this.visitrand() * 160 - 80;
		      var x3 = this.visitrand() * 160 - 80;
		      var y3 = this.visitrand() * 160 - 80;
		      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.stroke, size);
		      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.bodyfill, size-4);
				}
			}
    },
    drawEyes: function(numEyes, headNum) {
      var patchedEye = Math.floor(this.barrand() * numEyes);
      this.s = 256;
      var totalEyes = numEyes;
      while (numEyes > 0) {
        /*
         Algorith: if one, draw in middle. Otherwise draw an eye and a symmetric eye. Then remove two eyes and do again
         */
        this.context.save();
        this.context.scale(1 + this.rand() - 0.5, 1 + this.rand() - 0.5);
        var size = this.rand() * 200 / (totalEyes + 1) + 10;
        var y = 100 - this.rand() * 200;
        var x;
        if (numEyes > 1) {
          x = this.rand() * 100 + 10;
          this.drawEye(x, y, size, headNum, numEyes);
          this.drawEye(-x, y, size, headNum, numEyes - 1);
          if (patchedEye === 1) {
            this.checkEyePiece(x, y, size, headNum);
          } else if (patchedEye === 0) {
            this.checkEyePiece(-x, y, size, headNum);
          }
        } else {
          x = 0;
          this.drawEye(x, y, size, headNum, numEyes);
          if (patchedEye === 0) {
            this.checkEyePiece(x, y, size, headNum);
          }
        }
        numEyes -= 2;
        patchedEye -= 2;
        this.context.restore();
      }
    },		
    drawEyeStalks: function(numEyes) {
      // Same/similar algorthim.
      this.s = 256;
      while (numEyes > 0) {
        this.context.save();
        this.context.scale(1 + this.rand() - 0.5, 1 + this.rand() - 0.5);
        this.rand(); // match the random cycling of eye placement
        var y = 100 - this.rand() * 200;
        var x;
        if (numEyes > 1) {
          x = this.rand() * 100 + 10;
          SU.quadratic(this.context, x, y, (x + y) * (SU.r(y, 4.1) - 0.5), (x - y) * (SU.r(x, 4.2) - 0.5), 0, 0, this.stroke, 3);
          SU.quadratic(this.context, 0 - x, y, (-(x + y)) * (SU.r(y, 4.3) - 0.5), (x - y) * (SU.r(x, 4.4) - 0.5), 0, 0, this.stroke, 3);
        } else {
          x = 0;
          SU.line(this.context, x, y, 0, 0, this.stroke, 5);
        }
        numEyes -= 2;
        this.context.restore();
      }
    },
    drawEyeTemplate: function(offsetx, offsety, headNum, eye_type, eye_sides) {
      var x = EYE_SIZE / 2;
      var y = EYE_SIZE / 2;
      var size = EYE_SIZE;
			
			if (eye_type < 0.35) {
				// Typical circle eyes.
				this.circle_eyes = true;
	      var colorStops = [0, 'black', 0.4, 'black', 0.4, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',1)', 1, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',0.5)'];
	      SU.circle(this.eyecontexts[headNum], x, y, size / 2, 'white');
	      SU.circleRad(this.eyecontexts[headNum], x + offsetx * size / 3, y + offsety * size / 3, size / 3, colorStops);
	      delete colorStops;
	      // add 2 light reflections
	      colorStops = [0, 'white', 0.6, 'white', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect1x - 0.5) * size / 3, y + (this.reflect1y - 0.5) * size / 2, size / 8, colorStops);
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect2x - 0.5) * size / 3, y + (this.reflect2y - 0.5) * size / 2, size / 12, colorStops);
	      // outline
	      SU.circle(this.eyecontexts[headNum], x, y, size / 2, 'rgba(0,0,0,0)', this.stroke, Math.max(3, size / 10));
			} else if (eye_type < 0.5) {
				// Squares.
	      var colorStops = [0, 'black', 0.4, 'black', 0.4, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',1)', 1, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',0.5)'];
	      SU.rect(this.eyecontexts[headNum], x-size / 2, y-size / 2, size, size, 'white');
	      SU.rectRad(this.eyecontexts[headNum], x-size / 2, y-size / 2, size, size, 2*size / 3, 2*size/3, size/3, colorStops);
	      delete colorStops;
	      // add 2 light reflections
	      colorStops = [0, 'white', 0.6, 'white', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect1x - 0.5) * size / 3, y + (this.reflect1y - 0.5) * size / 2, size / 8, colorStops);
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect2x - 0.5) * size / 3, y + (this.reflect2y - 0.5) * size / 2, size / 12, colorStops);
	      // outline
	      SU.rect(this.eyecontexts[headNum], x-size / 2, y-size / 2, size, size, 'rgba(0,0,0,0)', this.stroke, Math.max(3, size / 10));
			} else if (eye_type < 0.6) {
				// Lights only.			
	      var colorStops = [0, 'white', 0.6, 'white', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect1x - 0.5) * size / 3, y + (this.reflect1y - 0.5) * size / 2, size / 8, colorStops);
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect2x - 0.5) * size / 3, y + (this.reflect2y - 0.5) * size / 2, size / 12, colorStops);
			} else if (eye_type < 1.0) {
				// Polygons.
				this.poly_eyes = true;
	      var colorStops = [0, 'black', 0.4, 'black', 0.4, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',1)', 1, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',0.5)'];
      	SU.regularPolygon(this.eyecontexts[headNum], x, y, eye_sides, size/2, 'white');
				SU.regularPolygonRad(this.eyecontexts[headNum], x, y, eye_sides, size/2, colorStops);
	      // add 2 light reflections
	      colorStops = [0, 'white', 0.6, 'white', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect1x - 0.5) * size / 3, y + (this.reflect1y - 0.5) * size / 2, size / 8, colorStops);
	      SU.circleRad(this.eyecontexts[headNum], x + (this.reflect2x - 0.5) * size / 3, y + (this.reflect2y - 0.5) * size / 2, size / 12, colorStops);
	      // outline
      	SU.regularPolygon(this.eyecontexts[headNum], x, y, eye_sides, size/2, 'rgba(0,0,0,0)', this.stroke, Math.max(3, size / 10));
			}
    },		
    drawEye: function(x, y, size, headNum, eyeNum) {
      this.context.drawImage(this.eyeimages[headNum], 0, 0, EYE_SIZE + EYE_BUF * 2, EYE_SIZE + EYE_BUF * 2, x - size * EYEUP / 2, y - size * EYEUP / 2, size * EYEUP, size * EYEUP);

      if (this.headblink[headNum] !== 0) {
				if (this.headblink[headNum] <= 40) {
	        var angle = (1 - (Math.abs(1 - (this.headblink[headNum] % 40) / 20))) * Math.PI / 2;
	        //this.context.lineWidth = 1;
	        this.context.fillStyle = this.stroke;
					for (let pi of [-Math.PI, Math.PI]) {
		        this.context.beginPath();
		        this.context.arc(x, y, size / 2, 0 - angle + pi / 2, angle + pi / 2);
		        this.context.moveTo(0, 0);
		        this.context.closePath();
		        this.context.fill();
					}
  			}
        if (eyeNum === 1) { // only dec once per head
          this.headblink[headNum]--;
        }
      }
    },		
    drawAntStalks: function(numAnts) {
			var ant_type = this.rand();
      this.s = 555;
      var size = this.rand() * 80 / (numAnts + 2) + 5;
			if (ant_type < 0.1) {
				// Stalks.
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.quadratic(this.context, x, y, SU.r(y, 5.1) * 200 - 100, SU.r(x, 5.2) * 200 - 200, 0, 0, this.stroke, 3);
	        SU.circle(this.context, x, y, size / 2, this.fill, this.stroke, 4);
	        numAnts--;
	      }
			} else if (ant_type < 0.2) {
				// Hair
				numAnts *= 2;
				numAnts += 10;
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.quadratic(this.context, x, y, SU.r(y, 5.3) * 200 - 100, SU.r(x, 5.4) * 200 - 200, 0, 0, this.stroke, 2);
	        numAnts--;
	      }
			} else if (ant_type < 0.3) {
				// Crazy Hair
				numAnts *= 10;
				numAnts += 100;
	      while (numAnts > 0) {
	        var y = this.rand() * 400 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.quadratic(this.context, x, y, SU.r(y, 5.5) * 200 - 100, SU.r(x, 5.6) * 200 - 200, 0, 0, this.stroke, 4);
	        numAnts--;
	      }
			} else if (ant_type < 0.4) {
				// Floating bubbles
				numAnts *= 2;
				numAnts += 10;
        var size = Math.floor(this.rand()*8) + 4;
	      while (numAnts > 0) {
	        var y = this.rand() * 100 - 100;
	        var x = this.rand() * 200 - 100;
	        SU.circle(this.context, x, y, size / 2, this.fill, this.stroke, size);
	        numAnts--;
	      }
			} else if (ant_type < 0.5) {
				// Straight out
				numAnts += 5;
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.line(this.context, x, y, 0, 0, this.fill, this.stroke, 5);
	        numAnts--;
	      }
			} else if (ant_type < 0.6) {
				// Lines.
				numAnts += 5;
				var lastx = 0;
				var lasty = 0;
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.line(this.context, x, y, lastx, lasty, this.fill, this.stroke, 5);
					lastx = x;
					lasty = y;
	        numAnts--;
	      }
			} else if (ant_type < 0.7) {
				// Spikes.
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        var size = Math.floor(this.rand()*18) + 4;
	        var width = Math.floor(this.rand()*4) + 2;
	        SU.triangle(this.context, -size, 0, size, 0, x, y, this.fill, this.stroke, width);
					lastx = x;
					lasty = y;
	        numAnts--;
	      }
			// 7 done
			} else if (ant_type < 0.8) {
				// Wild shape.
	      var x1 = this.rand() * 300 - 100;
	      var y1 = this.rand() * 300 - 200;
	      var x2 = this.rand() * 300 - 100;
	      var y2 = this.rand() * 300 - 200;
	      var x3 = this.rand() * 300 - 100;
	      var y3 = this.rand() * 300 - 200;
	      this.context.strokeStyle = this.stroke;
	      this.context.lineWidth = 10;
	      this.context.fillStyle = this.fill;
				this.drawHeadShape(x1, y1, x2, y2, x3, y3, 0, 0, 0);
	      // do it again, no border
	      this.context.lineWidth = 0;
	      this.context.strokeStyle = 'rgba(0,0,0,0)';
				this.drawHeadShape(x1, y1, x2, y2, x3, y3, 0, 0, 0);
			}	else if (ant_type < 0.9) {
				// Long hair.
				numAnts *= 10;
				numAnts += 10;
				let wind1 = this.rand() * 200 - 100;
				let wind2 = this.rand() * 200 - 100;
	      while (numAnts > 0) {
	        var y = this.rand() * 300 - 200;
	        var x = this.rand() * 400 - 200;
	        SU.quadratic(this.context, x + wind1, -y, SU.r(x, 6.1+numAnts) * 200 - 100 + wind2, -SU.r(y, 6.2+numAnts) * 200 - 200, 0, 0, this.stroke, 4);
	        numAnts--;
	      }
			} else if (ant_type < 1.0) {
				// Beard.
				numAnts *= 10;
				numAnts += 10;
	      while (numAnts > 0) {
	        var y = this.rand() * 200 - 200;
	        var x = this.rand() * 300 - 150;
	        SU.line(this.context, x, -y, 0, 0, this.fill, this.stroke, 5);
	        numAnts--;
	      }
			}	
			
    },
    drawHeadShape: function(x1, y1, x2, y2, x3, y3, x4, y4, rotation, custom_s) {
			if (!custom_s) {
				custom_s = 100;
			}
      this.context.save();
      this.context.rotate(rotation);
      this.s = custom_s;
      this.randHeadBezier(x1, y1, x2, y2, x3, y3, x4, y4);
      this.context.rotate(-rotation * 2);
      this.context.scale(-1, 1);
      this.s = custom_s;
      this.randHeadBezier(x1, y1, x2, y2, x3, y3, x4, y4);
      this.context.restore();
    },
    randHeadBezier: function(x1, y1, x2, y2, x3, y3, x4, y4) {
      this.context.beginPath();
      this.context.moveTo(x1, y1);

      this.context.bezierCurveTo(x1 - this.rand() * 150 + 50, y1 - this.rand() * 150 + 50, x2 + this.rand() * 150 - 50, y2 - this.rand() * 150 + 50, x2, y2);
      this.context.bezierCurveTo(x2 - this.rand() * 150 + 50, y2 + this.rand() * 150 - 50, x3 - this.rand() * 150 + 50, y3 - this.rand() * 150 + 50, x3, y3);
      this.context.bezierCurveTo(x3 + this.rand() * 150 - 50, y3 + this.rand() * 150 - 50, x4 - this.rand() * 150 + 50, y4 + this.rand() * 150 - 50, x4, y4);
      this.context.bezierCurveTo(x4 + this.rand() * 150 - 50, y4 + this.rand() * 150 - 50, x1 + this.rand() * 150 - 50, y1 - this.rand() * 150 + 50, x1, y1);

      this.context.stroke();
      this.context.fill();
    },
    drawBody: function(bodyrot, add_decor) {
      if (this.data_type === SF.TYPE_LAB) {
        this.bakbodyfill = this.bodyfill;
        this.bakstroke = this.stroke;
        this.bodyfill = "#FFF";
        this.stroke = "#888";
      }
      this.context.save();
      this.context.translate(this.bodycenterh, this.bodycenterv);
      this.context.rotate(bodyrot);
			
			if (!this.body_pattern) {
				this.pattern_s = this.s;  // Save the rand for additional runs.
				let pattern = SU.GetFillPattern(37, this.rand(), this.headr, this.headg, this.headb, Math.round(this.rand()*80)+40);
	      let pattern_image = document.createElement('canvas');
	      pattern_image.width = 300;
	      pattern_image.height = 300;
	      pattern_image.getContext('2d').drawImage(pattern, 0, 0, 500, 500);
				this.body_pattern = this.context.createPattern(pattern_image, "repeat");
			}
			this.s = this.pattern_s;

      var bodyrad = this.width / 12 + this.barrand() * this.width / 18;
			
			var start_s = this.s;
			this.radial = this.rand() < 0.3;
			if (this.radial) {
				// Save these between runs.
				this.body_sides = Math.floor(this.rand()*5) + 3;
				this.body_also_vertical = this.rand() < 0.5;
			} else {
				this.body_also_vertical = this.rand() < 0.25;
			}
			if (this.radial) {
				// Radial.
				this.context.save();
				var rotates = PIx2 / this.body_sides;
				for (var i = 0; i < this.body_sides; i++) {
					this.context.rotate(rotates);
					this.s = start_s;
					this.DrawBodyStamp(this.body_pattern, this.stroke);
				}
				for (var i = 0; i < this.body_sides; i++) {
					this.context.rotate(rotates);
					this.s = start_s;
					this.DrawBodyStamp(this.body_pattern);
				}
				this.context.restore();
			} else {
				let scales = [[1, 1], [-1, 1]];
				if (this.body_also_vertical) {
					scales.push([1, -1], [-1, -1]);
				}
				// Symmetrical. Draw first with border then no border.
				for (let stroke of [this.stroke, undefined]) {
					for (let scale of scales) {
						this.context.save();
			      this.context.scale(scale[0], scale[1]);
						this.s = start_s;
						this.DrawBodyStamp(this.body_pattern, stroke);
						this.context.restore();
					}					
				}
			}
			
			// Chance of adding some hair.
			if (this.rand() < 0.1) {
				// Crazy Hair
				var strands = Math.floor(this.rand()*100);
	      for (var i = 0; i < strands; i++) {
	        var x = this.rand() * 200 - 100;
	        var y = this.rand() * 200 - 100;
	        var x2 = x + this.visitrand() * 200 - 100;
	        var y2 = y + this.visitrand() * 200 - 100;
	        var x3 = x + this.visitrand() * 400 - 200;
	        var y3 = y + this.visitrand() * 400 - 200;
	        SU.quadratic(this.context, x, y, x2, y2, x3, y3, this.stroke, 2);
	      }
			}
			
      this.context.restore(); // restore body translate and rotation
			this.context.globalCompositeOperation = 'source-over';
			let orig_s = this.s;
			if (add_decor) {
	      if (this.data_type === SF.TYPE_BAR || this.data_type === SF.TYPE_TEMPLE_BAR) {
	        this.addPin(this.bodycenterh, this.bodycenterv, bodyrad, bodyrot);
	      } else if (this.data_type === SF.TYPE_LAB) {
	        this.labCoat(this.bodycenterh, this.bodycenterv, bodyrad, bodyrot);
	        this.bodyfill = this.bakbodyfill;
	        this.stroke = this.bakstroke;
	      } else if (this.data_type === SF.TYPE_ARENA) {
					this.arenaSash(this.bodycenterh, this.bodycenterv, bodyrad, bodyrot);
	      } else if (this.data_type === SF.TYPE_COLONY) {
	        this.drawCamera(this.bodycenterh, this.bodycenterv, bodyrad, bodyrot);
	      } else if (this.data_type === SF.TYPE_JOB) {
						this.drawNecktie(this.bodycenterh, this.bodycenterv, bodyrad, bodyrot);
				}
			}
			this.s = orig_s;
    },
		DrawBodyStamp: function(color, border) {
			let times = Math.floor(this.rand()*13)+1;
			for (var i = 0; i < times; i++) {
				let rand = this.rand();
				if (i === 0) {
					rand /= 3;  // Force some body.
				}
				if (rand < 0.05) {
					// Circles.
					var x1 = this.rand()*400 - 200;
					var y1 = this.rand()*400 - 200;
					var size = this.rand()*100;
					if (border) {
			      SU.circle(this.context, x1, y1, size, color, border, 10);
					} else {
			      SU.circle(this.context, x1, y1, size, color);				
					}
				}
  			else if (rand < 0.08) {
					// Quadratic lines.
					var x1 = this.rand()*400 - 200;
					var y1 = this.rand()*400 - 200;
					var x2 = this.rand()*400 - 200;
					var y2 = this.rand()*400 - 200;
					var x3 = this.rand()*400 - 200;
					var y3 = this.rand()*400 - 200;
					var size = this.rand() * 20 + 5;
		      this.context.lineCap = 'round';
					if (border) {
			      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, border, size + 10);
					} else {
			      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, color, size);
					}
				}
				else if (rand < 0.23) {
					var sides = Math.floor(this.rand() * 7) + 3;
					var x1 = this.rand()*400 - 200;
					var y1 = this.rand()*400 - 200;
					var size = this.rand()*100;
					if (border) {
			      SU.regularPolygon(this.context, x1, y1, sides, size, color, border, 10);
					} else {
			      SU.regularPolygon(this.context, x1, y1, sides, size, color);				
					}
				}
				else if (rand < 0.38) {
	        var thickness = Math.floor(this.rand() * 12) + 5;
		      this.context.beginPath();
		      this.context.moveTo(0, 0);
					for (var i = 0; i < 4; i++) {
			      this.context.bezierCurveTo(this.rand()*400-200, this.rand()*400-200, this.rand()*400-200, this.rand()*400-200, this.rand()*400-200, this.rand()*400-200);
					}
					if (border) {
						this.context.lineWidth = thickness * 2;
		        this.context.strokeStyle = border;
					} else {
						this.context.lineWidth = thickness;
		        this.context.strokeStyle = color;
					}
		      this.context.closePath();
	        this.context.stroke();
		      this.context.fillStyle = color;
		      this.context.fill();
				}			
			}
		},
		drawFeet: function(bodyrot) {
			// Pretty simple for feet. Just some curves, like toes.
      this.context.save();
      this.context.translate(this.bodycenterh, this.bodycenterv);
			this.context.rotate(bodyrot);
      this.context.lineCap = 'round';
			var num_feet = Math.floor(this.rand() * 5); // Times two: 0 to 8.
			var num_toes = Math.floor(this.rand() * 5)+1;
			num_toes = 5;
			var start_s = this.s;
			var v1 = this.rand() * 200 - 100;
			var v2 = this.rand() * 200 - 100;
			var v3 = this.rand() * 200 - 100;
			var v4 = this.rand() * 200 - 100;
			var v5 = this.rand() * 200 - 100;
			var v6 = this.rand() * 200 - 100;
			let base_scale = this.rand()*2+0.5;
			var start_s2 = this.s;
			for (let stroke of [this.stroke, undefined]) {
				this.s = start_s2;
				for (var i = 0; i < num_feet; i++) {
					this.s += i;
					var x = this.rand() * 200 + 10;
					var y = this.rand() * 300 + 210;
					y /= base_scale+2;
					let scales = [[1, 1], [-1, 1]];
					for (let scale of scales) {
						this.context.save();
			      this.context.scale(scale[0]*base_scale, scale[1]*base_scale);
						this.s = start_s;
						this.drawFootStamp(x, y, num_toes, this.fill, stroke, v1, v2, v3, v4, v5, v6);
						this.context.restore();
					}
				}				
			}
			this.context.restore();
		},
		drawFootStamp: function(x1, y1, num_toes, color, border, v1, v2, v3, v4, v5, v6) {
			if (border) {
	      this.context.strokeStyle = border;
	      this.context.lineWidth = 10;
			} else {
	      this.context.strokeStyle = color;
	      this.context.lineWidth = 1;
			}
      this.context.fillStyle = color;
			this.drawHeadShape(x1, y1, x1+v1, y1+v2, x1+v3, y1+v4, x1+v5, y1+v6, 0, 123);
//	    drawHeadShape: function(x1, y1, x2, y2, x3, y3, x4, y4, rotation, custom_s) {
			
		},
    drawWings: function(bodyrot) {
			if (this.rand() < 0.8) {
				return;
			}
			var num_wings = 1;
			if (this.rand() < 0.3) {
				num_wings = Math.floor(this.rand()*4)+1;
			}
			
			// Borrowed from ship.js PathDerelict
      this.context.save();
      this.context.translate(this.bodycenterh, this.bodycenterv);
			this.context.rotate(bodyrot);
			
			var ctx = this.context;
			for (var wing_num = 0; wing_num < num_wings; wing_num++) {
				var xsize = Math.floor(this.rand()*300)*2+100;
				var ysize = Math.floor(this.rand()*300)+100;
	      var xpoints = [];
	      var ypoints = [];
	      for (var i = 0; i < 8; i++) {
	          xpoints[i] = [this.rand() * xsize];
	          ypoints[i] = [(i / 8 - 0.5) * ysize]-300;
	      }			
			
		    ctx.beginPath();
		    ctx.moveTo(0, 0);
		    for (var i = 0; i < 8; i++) {
		        if (Math.abs(Math.floor(xpoints[i] * 10)) % 2 === 1) {
		            ctx.quadraticCurveTo(xsize / 2, ypoints[i], xpoints[i], ypoints[i]);
		        } else {
		            ctx.lineTo(xpoints[i], ypoints[i]);
		        }
		    }
		    ctx.lineTo(0, 0);
		    for (var i = 0; i < 8; i++) {
		        if (Math.abs(Math.floor(xpoints[i] * 10)) % 2 === 1) {
		            ctx.quadraticCurveTo(-xsize / 2, ypoints[i], -xpoints[i], ypoints[i]);
		        } else {
		            ctx.lineTo(-xpoints[i], ypoints[i]);
		        }
		    }
		    ctx.lineTo(0, 0);
		    ctx.closePath();
					
	      ctx.lineWidth = 10;
	      ctx.strokeStyle = this.stroke;
	      ctx.stroke();

	      ctx.fillStyle = this.bodyfill;
	      ctx.fill();
			}
			this.context.restore();
		},
    drawArms: function(bodyrot) {
      this.context.save();
      this.context.translate(this.bodycenterh, this.bodycenterv);
			this.context.rotate(bodyrot);
			var arms_type = this.rand();
			if (arms_type < 0.2) {
				// Tentacles.
	      for (var i = 0; i < this.numArms; i++) {
	        var x1 = this.visitrand()*200-100;
	        var y1 = this.visitrand()*200-100;
	        var x2 = this.visitrand()*400-200;
	        var y2 = this.visitrand()*400-500;
	        var x3 = this.visitrand()*400-200;
	        var y3 = this.visitrand()*400-500;

	        var thickness = this.rand() * 10 + 3;

	        this.context.beginPath();
	        this.context.moveTo(0, 0);
	        this.context.bezierCurveTo(x1, y1, x2, y2, x3, y3);

	        this.context.lineWidth = thickness * 2;
	        this.context.strokeStyle = this.stroke;
	        this.context.stroke();

	        this.context.beginPath();
	        this.context.moveTo(0, 0);
	        this.context.bezierCurveTo(x1, y1, x2, y2, x3, y3);

	        this.context.lineWidth = thickness;
	        this.context.strokeStyle = this.bodyfill;
	        this.context.stroke();
	      }
			} else if (arms_type < 0.3) {
				// Straight out.
	      for (var i = 0; i < this.numArms; i++) {
	        var thickness = this.rand() * 10 + 3;
	        var x1 = this.visitrand()*200-100;
	        var y1 = this.visitrand()*200-100;
	        var x3 = this.visitrand()*400-200;
	        var y3 = this.visitrand()*400-500;
		      SU.line(this.context, x1, y1, x3, y3, this.stroke, thickness * 2);
		      SU.line(this.context, x1, y1, x3, y3, this.bodyfill, thickness);
				}
			} else if (arms_type < 0.5) {
				// Splitting tentacles.
				var num_splits = Math.floor(this.rand()*4)+1
				if (this.numArms > 7) num_splits = 1;
	      for (var i = 0; i < this.numArms; i++) {
	        var thickness = this.rand() * 10 + 3;
	        var x1 = this.visitrand()*200-100;
	        var y1 = this.visitrand()*200-100;
	        var x2 = this.visitrand()*200-100;
	        var y2 = this.visitrand()*200-100;
	        var x3 = this.visitrand()*400-200;
	        var y3 = this.visitrand()*400-500;
		      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.stroke, thickness * 2);
					var temps = this.visits;
					for (var j = 0; j < num_splits; j++) {
		        var x4 = this.visitrand()*400-200;
		        var y4 = this.visitrand()*400-500;
		        var x5 = this.visitrand()*400-200;
		        var y5 = this.visitrand()*400-500;
			      SU.quadratic(this.context, x3, y3, x4, y4, x5, y5, this.stroke, thickness * 2);						
					}
					// Now fill the centers.
					this.visits = temps;
		      SU.quadratic(this.context, x1, y1, x2, y2, x3, y3, this.bodyfill, thickness);
					for (var j = 0; j < num_splits; j++) {
		        var x4 = this.visitrand()*400-200;
		        var y4 = this.visitrand()*400-500;
		        var x5 = this.visitrand()*400-200;
		        var y5 = this.visitrand()*400-500;
			      SU.quadratic(this.context, x3, y3, x4, y4, x5, y5, this.bodyfill, thickness);						
					}
				}
			}
			// Else none.
			this.context.restore();
    },		
    addPin: function(centerx, centery, rad, bodyrot) {
      this.context.save();
			// Don't want the pin to render scaled, it should be a perfect circle.
			// Reset the scaling here, and then set it back.
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.context.translate(WIDTH/2,HEIGHT/2);
      this.context.translate(centerx, centery);
      this.context.rotate(bodyrot);//this.visitrand() * Math.PI / 4 - Math.PI / 8);

      var angle = this.barrand() * Math.PI / 4;
      var x = Math.abs(Math.sin(angle)) * rad;
      if (this.barrand() < 0.5) {
        x = Math.abs(Math.sin(angle)) * rad;
      }
      var y = - Math.abs(Math.cos(angle)) * rad;
      var pinwidth = 50;
			this.context.translate(x,y);

      var rn = fixColor(this.headr + 20);
      var gn = fixColor(this.headg + 20);
      var bn = fixColor(this.headb + 20);
      SU.circle(this.context, 0, 0, pinwidth, 'rgba(' + rn + ',' + gn + ',' + bn + ',1)', this.stroke, 7);

      angle = this.barrand() * Math.PI / 2 - Math.PI / 4;

      // reflection arcs
      this.context.lineCap = 'round';

      this.context.beginPath();
      this.context.arc(0, 0, pinwidth - 3, angle + Math.PI / 4 - Math.PI, angle + Math.PI * 3 / 4 - Math.PI, false);
      this.context.lineWidth = 2;
      this.context.strokeStyle = 'rgba(255,255,255,0.5)';
      this.context.stroke();


      this.context.beginPath();
      this.context.arc(0, 0, pinwidth - 3, angle + Math.PI / 4, angle + Math.PI * 3 / 4, false);
      this.context.lineWidth = 2;
      this.context.strokeStyle = 'rgba(' + (this.headr - 100) + ',' + (this.headg - 100) + ',' + (this.headb - 100) + ',0.5)';
      this.context.stroke();

      var pinheight = 20;
      this.context.font = SF.FONT_XL;
      this.context.fillStyle = 'black';
      this.context.textAlign = 'center';

      var text;
      if (this.is_home_bar) {
        if (S$.faction === SF.FACTION_PIRATE) {
          text = "Stick to the Code";
        } else {
          text = "No Place Like Home";
        }
      } else {
        // normal pin text
        text = ST.barPin(this.barrand(), this.data_faction);
      }

      var words = text.split(" ");
      var index = 0;
      var line1 = "";
      while (this.context.measureText(line1 + " " + words[index]).width < 100 && index < words.length) {
        line1 += " " + words[index];
        index++;
      }
      line1 = line1.trim();
      var line2 = "";
      while (this.context.measureText(line2 + " " + words[index]).width < 100/*90*/ && index < words.length) {
        line2 += " " + words[index];
        index++;
      }
      line2 = line2.trim();
      var line3 = "";

      if (index < words.length) {
        // didn't fit, try again w/ smaller fonts
        pinheight = 14;
        this.context.font = SF.FONT_L;
        words = text.split(" ");
        index = 0;
        line1 = "";
        while (this.context.measureText(line1 + " " + words[index]).width < 100 && index < words.length) {
          line1 += " " + words[index];
          index++;
        }
        line1 = line1.trim();
        line2 = "";
        while (this.context.measureText(line2 + " " + words[index]).width < 100 && index < words.length) {
          line2 += " " + words[index];
          index++;
        }
        line2 = line2.trim();
        line3 = "";
        while (this.context.measureText(line3 + " " + words[index]).width < 100 && index < words.length) {
          line3 += " " + words[index];
          index++;
        }
        line3 = line3.trim();


        if (index < words.length) {
          // didn't fit, try again w/ smaller fonts
          pinheight = 10;
          this.context.font = SF.FONT_S;
          words = text.split(" ");
          index = 0;
          line1 = "";
          while (this.context.measureText(line1 + " " + words[index]).width < 100 && index < words.length) {
            line1 += " " + words[index];
            index++;
          }
          line1 = line1.trim();
          line2 = "";
          while (this.context.measureText(line2 + " " + words[index]).width < 100 && index < words.length) {
            line2 += " " + words[index];
            index++;
          }
          line2 = line2.trim();
          line3 = "";
          while (this.context.measureText(line3 + " " + words[index]).width < 100 && index < words.length) {
            line3 += " " + words[index];
            index++;
          }
          line3 = line3.trim();
          if (index < words.length) {
            error("Remaining text: " + text);
          }
        }
      }

      var yoff = pinheight / 2;
      pinheight *= 1.3; // spacing
      if (line2 === "") {
        this.context.fillText(line1, 0, yoff);
      } else if (line3 === "") {
        this.context.fillText(line1, 0, 0 - pinheight / 2 + yoff);
        this.context.fillText(line2, 0, pinheight / 2 + yoff);
      } else {
        this.context.fillText(line1, 0, 0 - pinheight + yoff);
        this.context.fillText(line2, 0, yoff);
        this.context.fillText(line3, 0, pinheight + yoff);
      }

      this.context.restore();
    },		
		drawHelmet: function() {
			SU.circle(this.context, 0, 5, 130, undefined, "#888", 10);
			SU.circle(this.context, 0, 0, 130, undefined, "#000", 3);

      var colorStops = [0, 'rgba(0,0,0,0.5)', 0.8, 'rgba(0,0,0,0.8)', 1, 'rgba(0,0,0,1)'];
			SU.circleRad(this.context, 0, 0, 130, colorStops);
      var colorStops = [0, 'rgba(255,255,255,0.5)', 0.5, 'rgba(255,255,255,0.3)', 1, 'rgba(255,255,255,0)'];
			SU.circleRad(this.context, 0, -55, 80, colorStops);
		},

    drawBeard: function() {
      if (this.beard === undefined) {
        this.initBeard();
      }
      this.context.drawImage(this.beard, 0, 0, this.beardsize, this.beardsize, -this.beardsize / 2, 30, this.beardsize, this.beardsize);
    },
    initBeard: function() {
      var r = Math.floor(this.barrand() * 156) + 100;
      var g = Math.floor(this.barrand() * 156) + 100;
      var b = Math.floor(this.barrand() * 156) + 100;
      var beardcolor = 'rgb(' + r + ',' + g + ',' + b + ')';
      var beardedge = 'rgba(' + (r - 100) + ',' + (g - 100) + ',' + (b - 100) + ',1)';


      this.beardsize = 150;
      this.beard = document.createElement('canvas');
      this.beard.width = this.beardsize;
      this.beard.height = this.beardsize;
      this.beardctx = this.beard.getContext('2d');

      // lines first
      SU.line(this.beardctx, this.beardsize / 2, this.beardsize / 2, this.beardsize / 4, 0, beardedge, 4);
      SU.line(this.beardctx, this.beardsize / 2, this.beardsize / 2, this.beardsize * 3 / 4, 0, beardedge, 4);

      // fluffy beard, first edges then inside
      this.s = 0;
      for (var i = 0; i < 100; i++) {
        var x = (this.barrand() * (this.beardsize - 30)) + 0;
        var y = (this.barrand() * (this.beardsize - 30)) + 15;
        if (x < this.beardsize - y) {
          SU.circle(this.beardctx, x + y / 2, y, 12, beardcolor, beardedge, 4);
        }
      }
      this.s = 0;
      for (var i = 0; i < 100; i++) {
        var x = (this.barrand() * (this.beardsize - 30)) + 0;
        var y = (this.barrand() * (this.beardsize - 30)) + 15;
        if (x < this.beardsize - y) {
          SU.circle(this.beardctx, x + y / 2, y, 12, beardcolor);
        }
      }
    },
    drawMiningHelmet: function(rad) {
      var x = 0;
      var y = 0 - rad * 3 / 4;
      var size = 100;
      var visorwidth = size * 1.2;
      var visorlength = size / 3;
      var outline = "#530";

      // helmet top
      this.context.beginPath();
      this.context.arc(x, y, size, Math.PI, 0, false);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();

      var grd = this.context.createRadialGradient(x, y, 0, x, y, size);
      for (var n = 0; n < miningColorStops1.length; n += 2) {
        grd.addColorStop(miningColorStops1[n], miningColorStops1[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();

      // visor
      this.context.beginPath();
      this.context.moveTo(-size, y);
      this.context.lineTo(-visorwidth, y + visorlength / 3);
      this.context.quadraticCurveTo(0, y + visorlength, visorwidth, y + visorlength / 3);
      this.context.lineTo(size, y);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();
      grd = this.context.createLinearGradient(0, y, 0, y + visorlength);
      for (var n = 0; n < miningColorStops2.length; n += 2) {
        grd.addColorStop(miningColorStops2[n], miningColorStops2[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();

      // light
      SU.circle(this.context, x, y * 2.5, 30, "#BBC", "#A90", 10);
      SU.circle(this.context, x, y * 2.5, 25, null, "#FFF", 2);
      SU.circle(this.context, x, y * 2.5, 10, "#88A");
      SU.circle(this.context, x, y * 2.5, 5, "#FFF");
    },
		drawConstructionHelmet: function(rad) {
      var x = 0;
      var y = 0 - rad * 3 / 4;
      var size = 100;
      var visorwidth = size * 0.9;
      var visorlength = size / 3;
      var outline = "#880";
			var finwidth = size * 0.1;
			var finheight = size * 0.3;

      // helmet top
      this.context.beginPath();
      this.context.arc(x, y, size, Math.PI, 0, false);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();

      var grd = this.context.createRadialGradient(x, y, 0, x, y, size);
      for (var n = 0; n < constructionColorStops1.length; n += 2) {
        grd.addColorStop(constructionColorStops1[n], constructionColorStops1[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();

      // visor
      this.context.beginPath();
      this.context.moveTo(-size, y);
      this.context.lineTo(-visorwidth, y + visorlength / 3);
      this.context.quadraticCurveTo(0, y + visorlength, visorwidth, y + visorlength / 3);
      this.context.lineTo(size, y);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();
      grd = this.context.createLinearGradient(0, y, 0, y + visorlength);
      for (var n = 0; n < constructionColorStops2.length; n += 2) {
        grd.addColorStop(constructionColorStops2[n], constructionColorStops2[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();

      // Fins.
			SU.rectGrad(this.context, -finwidth, -size*1.4, finwidth*2, finheight, 0, -size, 0, -size*1.5, constructionColorStops2, outline, 5)
			SU.rectGrad(this.context, -finwidth-size*0.35, -size*1.3, finwidth*2, finheight, 0, -size, 0, -size*1.4, constructionColorStops2, outline, 5)
			SU.rectGrad(this.context, -finwidth+size*0.35, -size*1.3, finwidth*2, finheight, 0, -size, 0, -size*1.4, constructionColorStops2, outline, 5)
			
			// Logo.
			// Borrowed from 1buidlingUalien.js.
			let symbols = ST.getSymbol(this.barrand())+ST.getSymbol(this.barrand());
			let text_size = Math.round((this.barrand()*0.2+0.3)*size);
			let y_up = -size*0.5;

			this.context.save();
			let r = Math.floor(this.barrand()*this.barrand() * 255);
			let g = Math.floor(this.barrand()*this.barrand() * 255);
			let b = Math.floor(this.barrand()*this.barrand() * 255);
			this.context.fillStyle = 'rgb('+r+','+g+','+b+')';
			this.context.strokeStyle = "#000";			
			this.context.font = text_size+'pt serif';
			this.context.textAlign = 'center';
			let rand = this.barrand();
			for (let i = 0; i < symbols.length && i < 5; i++) {
				this.context.save();
				this.context.translate(0,y_up-text_size/2);
				this.context.rotate(SU.r(rand+i, 5.12)*PIx2);				
				this.context.lineWidth = 2
				this.context.strokeText(symbols[i], 0, text_size/2);
				this.context.restore();				
			}
			for (let i = 0; i < symbols.length && i < 5; i++) {
				this.context.save();
				this.context.translate(0,y_up-text_size/2);
				this.context.rotate(SU.r(rand+i, 5.12)*PIx2);				
				this.context.fillText(symbols[i], 0, text_size/2);
				this.context.restore();				
			}
			this.context.restore();
			
//	    rectGrad: function(context, x, y, width, height, x1, y1, x2, y2, colorStops, stroke, strokeWidth) {
		},				
    drawArmorHelmet: function(rad) {
      var x = 0;
      var y = 0 - rad * 3 / 4;
      var size = 75;
      var noselen = 40;
      var nosew = 10;
      var bridgew = 20;
      var outline = "#222";

      // helmet top
      this.context.beginPath();
      this.context.arc(x, y, size, Math.PI, 0, false);

      this.context.lineTo(nosew, y);
      this.context.lineTo(nosew, y + noselen - nosew);
      this.context.lineTo(bridgew, y + noselen - nosew);
      this.context.lineTo(bridgew, y + noselen);
      this.context.lineTo(-bridgew, y + noselen);
      this.context.lineTo(-bridgew, y + noselen - nosew);
      this.context.lineTo(-nosew, y + noselen - nosew);
      this.context.lineTo(-nosew, y);

      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();

      var grd = this.context.createRadialGradient(x, y - 30, 0, x, y - 30, size);
      for (var n = 0; n < armorColorStops1.length; n += 2) {
        grd.addColorStop(armorColorStops1[n], armorColorStops1[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();
    },
    drawFedora: function(rad) {
      var y = 0 - rad * 3 / 4;
      var size = 100;
      var visorwidth = size * 1.8;
      var visorlength = size / 7;
      var outline = "#530";

      this.context.beginPath();
      this.context.moveTo(-size, y);
      this.context.quadraticCurveTo(-size * 2 / 3, y * 3, -size / 2, y * 2.2);
      this.context.quadraticCurveTo(0, y * 3, size / 2, y * 2.2);
      this.context.quadraticCurveTo(size * 2 / 3, y * 3, size, y);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();
      grd = this.context.createLinearGradient(0, y * 3, 0, y);
      for (var n = 0; n < miningColorStops2.length; n += 2) {
        grd.addColorStop(miningColorStops2[n], miningColorStops2[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();

      // band
      this.context.beginPath();
      this.context.moveTo(-size, y);
      this.context.lineTo(-size + 6, y - 20);
      this.context.lineTo(size - 6, y - 20);
      this.context.lineTo(size, y);
      this.context.closePath();
      this.context.lineWidth = 5;
      this.context.strokeStyle = 'black';
      this.context.stroke();
      this.context.fillStyle = 'black';
      this.context.fill();

      // brim
      this.context.beginPath();
      this.context.moveTo(-size, y);
      this.context.lineTo(-visorwidth, y + visorlength / 3);
      this.context.quadraticCurveTo(0, y + visorlength, visorwidth, y + visorlength / 3);
      this.context.lineTo(size, y);
      this.context.closePath();

      this.context.lineWidth = 5;
      this.context.strokeStyle = outline;
      this.context.stroke();
      grd = this.context.createLinearGradient(0, y, 0, y + visorlength);
      for (var n = 0; n < miningColorStops2.length; n += 2) {
        grd.addColorStop(miningColorStops2[n], miningColorStops2[n + 1]);
      }
      this.context.fillStyle = grd;
      this.context.fill();
    },
		drawUniversityHat: function(rad) {
			// SU.text(context, "🎒", -300, SF.HALF_HEIGHT-265, 'bold 140pt '+SF.FONT, '#FFF', 'center');
			SU.text(this.context, '🎓', 0, -rad/2, 'bold '+(rad*3)+'pt '+SF.FONT, "#000", 'center');
		},
    checkEyePiece: function(x, y, size, headNum) {
			if (!SU.IsCityType(this.data_type)) {
				return;
			}
			let orig_s = this.s;
      /*if (this.data_faction === SF.FACTION_PIRATE && SU.IsCityType(this.data_type)) {
        if (this.visitrand() < 0.5) {
          this.drawEyePatch(x, y, size);
        } else {
          this.drawLoupe(x, y, size, headNum);
        }
      } else*/ if (this.data_faction === SF.FACTION_PIRATE) {
        this.drawEyePatch(x, y, size);
      } else if (SU.IsCityType(this.data_type)) {
        this.drawLoupe(x, y, size, headNum);
      }
			this.s = orig_s;
    },
    drawLoupe: function(x, y, size, headNum) {
      // chain first
      SU.quadratic(this.context, x, y, x * 2 / 3, -y / 3, x / 3, y / 4, "#000", 2);

      this.context.save();
      this.context.translate(x, y);
      size *= 0.55;
      var r = Math.floor(this.visitrand() * 128) + 100;
      var g = Math.floor(this.visitrand() * 128) + 100;
      var b = Math.floor(this.visitrand() * 128) + 100;
      SU.circle(this.context, 0, 0, size, "#000");
      SU.circle(this.context, 0, 0, size - 1, "#864");
      SU.circle(this.context, 0, 0, size * 0.8, "#AAA");
      SU.circle(this.context, 0, 0, size * 0.75, "#888");
      var colorStops = [0, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',0.15)', 1, 'rgba(' + this.eyer + ',' + this.eyeg + ',' + this.eyeb + ',0.25)'];
      SU.circleRad(this.context, 0, 0, size * 0.75, colorStops);
      colorStops = [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0.0)'];
      SU.circleRad(this.context, size / 5, 0 - size / 5, size * 0.5, colorStops);

      this.context.restore();
    },
    drawEyePatch: function(x, y, size) {
      var rotation = this.visitrand() * Math.PI / 6 - Math.PI / 12;
      this.context.save();
      this.context.translate(x, y);
      this.context.rotate(rotation);
      x = 0;
      y = 0 - size / 15;

      // straps
      SU.line(this.context, 0, 0, 0 - size, 0 - size / 2, "#543");
      SU.line(this.context, 0, 0, size, 0 - size / 2, "#543");

      // 3 curves to create a rounded triangle patch
      this.context.beginPath();
      this.context.moveTo(x, y - size / 2);
      this.context.quadraticCurveTo(x + size, y - size / 2, x + size / 2, y + size / 3);
      this.context.quadraticCurveTo(x, y + size, x - size / 2, y + size / 3);
      this.context.quadraticCurveTo(x - size, y - size / 2, x, y - size / 2);
      this.context.closePath();
      this.context.lineWidth = size / 10;
      this.context.strokeStyle = "#543";
      this.context.stroke();

      this.context.fillStyle = "#210";
      this.context.fill();

      var imgsize = size * 2 / 3;
      // DISABLED this.context.drawImage(SM.pirate, x - imgsize / 2, y - imgsize / 2, imgsize, imgsize);

      this.context.restore();
    },
    drawCamera: function(centerx, centery, rad, bodyrot) {
      this.context.save();
			this.context.rotate(bodyrot);
			this.context.translate(0, -30);
      SU.quadratic(this.context, 0, -25, -rad / 4, 0, -rad * 3 / 5 + this.visitrand() * 30 - 15, -rad * 3 / 5 + this.visitrand() * 30 - 15, "#000", 2);
      SU.quadratic(this.context, 0, -25, rad / 4, 0, rad * 3 / 5 + this.visitrand() * 30 - 15, -rad * 3 / 5 + this.visitrand() * 30 - 15, "#000", 2);

      this.context.rotate(Math.PI * 0.35 + Math.PI * 0.2 * this.visitrand());
      SU.rect(this.context, -34, -25, 8, 10, "#222");
      SU.rect(this.context, 33, -24, 5, 10, "#222");
      SU.rect(this.context, -40, -20, 80, 40, "#333"); // fill black to start
      SU.rect(this.context, -30, -5, 30, 15, "#444");
      SU.circle(this.context, 20, 0, 10, "#777", "#AAA", 5);
      SU.rect(this.context, -15, -25, 12, 10, "#BBB", "222", 4);
      SU.rect(this.context, 20, -25, 10, 8, "#888", "222", 4);
      this.context.restore();
    },
    labCoat: function(centerx, centery, rad, bodyrot) {
			this.context.save();
			this.context.translate(centerx, centery);
			this.context.rotate(bodyrot);
      // buttons
      SU.circle(this.context, -rad / 15, -3 * rad / 4, 5, "#AAA", "#888", 2);
      SU.circle(this.context, rad / 15, -3 * rad / 4, 5, "#AAA", "#888", 2);
      SU.circle(this.context, -rad / 15, -rad / 4, 5, "#AAA", "#888", 2);
      SU.circle(this.context, rad / 15, -rad / 4, 5, "#AAA", "#888", 2);
      SU.circle(this.context, -rad / 15, rad / 4, 5, "#AAA", "#888", 2);
      SU.circle(this.context, rad / 15, rad / 4, 5, "#AAA", "#888", 2);
			this.context.restore();
    },
    arenaSash: function(centerx, centery, rad, bodyrot) {
			this.context.save();
			this.context.translate(centerx, centery);
			this.context.rotate(bodyrot);
			this.context.rotate(Math.PI/4);
      let colorStops = [0, "#888", 1, "#000"];
			for (let i = 0; i < 2; i++) {
	      //SU.rect(this.eyecontexts[headNum], x-size / 2, y-size / 2, size, size, 'white');
		    //rectRad: function(context, x, y, width, height, x1, y1, rad, colorStops, stroke, strokeWidth) {
	      SU.rectRad(this.context, -rad*2, -20, rad*4, 40, 0, 0, rad*2, colorStops, "#000", 5);
				//SU.rect(this.context, -rad*2, -20, rad*4, 40, "#888", "#000", 5)
				for (let j = 0; j < 8; j++) {
		      SU.circleRad(this.context, (j-4)*rad/2, 0, 12, colorStops, "#000", 3);
				}
				this.context.rotate(Math.PI/2);				
			}
			this.context.restore();
    },		
		drawNecktie: function(centerx, centery, rad, bodyrot) {
			var ctx = this.context;
      ctx.save();
      ctx.translate(centerx, centery);
      //ctx.rotate(SU.r(this.seed, 500.6)*0.5-0.25);
			ctx.rotate(bodyrot);
			ctx.translate(0, -rad*1.5);

			var topx = SU.r(this.seed, 500.1) * 0.2 + 0.2;
			var midx = SU.r(this.seed, 500.2) * 0.12 + 0.07;
			var botx = SU.r(this.seed, 500.3) * 0.2 + 0.2;
			var midy = SU.r(this.seed, 500.4) * 0.15 + 0.4;
			var boty = SU.r(this.seed, 500.5) * 1 + 2;
			var boty2 = boty + SU.r(this.seed, 500.5) * 0.1 + 0.2;
			topx *= rad;
			midx *= rad;
			botx *= rad;
			midy *= rad;
			boty *= rad;
			boty2 *= rad;
			
	    ctx.beginPath();
	    ctx.moveTo(-topx, 0);
	    ctx.lineTo(-midx, midy);
	    ctx.lineTo(-botx, boty);
	    ctx.lineTo(0, boty2);
	    ctx.lineTo(+botx, boty);
	    ctx.lineTo(+midx, midy);
	    ctx.lineTo(+topx, 0);
	    ctx.closePath();

			var tier = Math.floor(this.headr+SU.r(this.seed, 501.1)*100-50);
			var tieg = Math.floor(this.headg+SU.r(this.seed, 501.2)*100-50);
			var tieb = Math.floor(this.headb+SU.r(this.seed, 501.3)*100-50);
			var tier2 = Math.floor(this.headr+SU.r(this.seed, 501.4)*100-50);
			var tieg2 = Math.floor(this.headg+SU.r(this.seed, 501.5)*100-50);
			var tieb2 = Math.floor(this.headb+SU.r(this.seed, 501.6)*100-50);
			tier = fixColor(tier);
			tieg = fixColor(tieg);
			tieb = fixColor(tieb);
			tier2 = fixColor(tier2);
			tieg2 = fixColor(tieg2);
			tieb2 = fixColor(tieb2);
      var colorStops = [0, 'rgb(' + tier + ',' + tieg + ',' + tieb+')', 1, 'rgb(' + tier2 + ',' + tieg2 + ',' + tieb2 + ')'];
      grd = ctx.createLinearGradient(0, 0, 0, boty2);
	    for (var n = 0; n < colorStops.length; n += 2) {
	      grd.addColorStop(colorStops[n], colorStops[n + 1]);
	    }
	    ctx.fillStyle = grd;
	    ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
		
			ctx.restore();
		},		
    // Random based on the race
    rand: function() {
      this.s++;
      return SU.r(this.raceseed, this.s);
    },
    // Random based on the race and head number
    headrand: function() {
      this.s++;
      return SU.r(this.raceseed, this.s + this.headseed + 1.13);
    },
    // Random based on the bar (uses the bar seed).
    barrand: function() {
      this.s++;
      return SU.r(this.seed, this.s + 1.14);
    },
    // Different every time on entry
    // Doesn't actuall work for anything past render()- those pieces that use this need to shift to instantiated vars
    visitrand: function() {
      this.visits++;
      return SU.r(this.seed, this.visits + 1.15);
    },
    fullrand: function() {
      this.fulls++;
      return SU.r(this.seed, this.fulls + 1.16);
    },		
		update: function(x, y, context) {
			if (context) {
				this.reupdate_x = x;
				this.reupdate_y = y;
				this.reupdate_context = context;
	      context.drawImage(this.image, x, y);
				return true;
			} else {
				let tier = SG.activeTier;
				if (SG.blinking_seed != this.seed || tier.type !== SF.TIER_BUILDING
					  || (tier.data.type !== SF.TYPE_BAR && tier.data.type !== SF.TYPE_TEMPLE_BAR)) {
					// The player switched off the bar screen and it wasn't properly cleared. Abort here.
					return;
				}
				this.context.save();
	      this.context.clearRect(0, 0, WIDTH, HEIGHT);
				this.context.translate(WIDTH/2,HEIGHT/2);
	      this.context.scale(this.xscale,this.yscale);
				this.visits = this.visitsStart;
				this.drawAll();
	      this.reupdate_context.clearRect(0, 0, WIDTH, HEIGHT);
				this.reupdate_context.drawImage(this.image, this.reupdate_x, this.reupdate_y);
				this.context.restore();
				this.blinks--;
				if (this.blinks > 0) {
					this.timeout = setTimeout(this.update.bind(this), 20);
				}
				return true;
			}
		},
		BindBlinks: function(time_length) {
			if ((!this.circle_eyes && !this.poly_eyes) || this.start_eye_closed || !this.has_heads) {
				return;
			}
			if (!this.timeout) {
				SG.blinking_seed = this.seed;
				this.timeout = setTimeout(this.DoBlinks.bind(this), time_length);			
			}
		},
		DoBlinks: function() {
			for (var headNum = 0; headNum < this.numHeads; headNum++) {
				this.headblink[headNum] = Math.floor(this.fullrand()*10)+40;
			}
			this.blinks = 50;
			this.update();
		},
		ClearBlink: function() {
			if (this.timeout) {
				window.clearTimeout(this.timeout);
				this.timeout = null;
			}
		},
		// Indicates if the given title is alien interior.
		IsValid: function(square_x, square_y) {
			//return this.valid_points[square_x+','+square_y] == true;
			return true;
			/*
			return square_x >= -MAX_WIDTH/2 && square_x < MAX_WIDTH/2
			  && square_y >= -MAX_HEIGHT/2 && square_y < MAX_HEIGHT/2;
			*/
		},
		

	};
	SU.extend(SBar.IconAlien, SBar.Icon);
})();

	
