/*
 * 
 * Alien Renderer
 */
(function() {
  var WIDTH = SF.WIDTH;
  var HEIGHT = SF.HEIGHT;
  var tbarsize = 150;
	var bottleimg = null;

  SBar.BuildingAlienRenderer = function(tier) {
    this._initBuildingAlienRenderer(tier);
  };

  SBar.BuildingAlienRenderer.prototype = {
    tier: null,
    data: null,
    image: null,
    botcontext: null,
    midcontext: null,
    topcontext: null,
    s: 0,
    visits: 0,
    visitsStart: 0, // base seed of visits
    fulls: 0,
    headseed: 0,
    fill: null,
    stroke: null,
    eyeimages: null,
    eyecontexts: null,
    backr: null,
    backg: null,
    backb: null,
    headr: null,
    headg: null,
    headb: null,
    _initBuildingAlienRenderer: function(tier) {
      this.tier = tier;
      this.botcontext = tier.botcontext;
      this.midcontext = tier.midcontext;
      this.topcontext = tier.topcontext;
      this.data = this.tier.data;
      //this.data.faction = SF.FACTION_PIRATE;
      //this.data.type = SF.TYPE_MINING;
      this.width = WIDTH;
      this.height = HEIGHT;
      //this.visitsStart = SU.r((new Date()).getTime(), 4.51);
      this.visitsStart = SU.r(S$.time, 4.51);
      this.visits = this.visitsStart;
      //this.fulls = SU.r((new Date()).getTime(), 4.52);
      this.fulls = SU.r(S$.time, 4.52);

			if (bottleimg === null) {
				this.InitBottles();
			}

      this.drawBackground();
      this.drawForeground();
    },
    /*
     
     Variable numbers:
     - heads: 1-3, 1 being most common
     - eyes: 0-lots, 1 and 2 being most common
     - antennae: 0-lots, 0 or lots being most common
     - arms: 0-lots, 0, 2, 4 and lots being most common
     - hat/flair/pins (how does it end?)?
     
     Variable placement:
     - smile
     - eyes, could be anywhere even stalks
     - stalks
     - space between heads
     - body
     - head rotation
     
     Color:
     - shirt
     - this.background
     - pin with random phrase
     - eyes
     - stalks
     - face is offset from body
     
     Modifications:
     - smile arc
     - stalk arc
     - stalk size
     - eye size
     - smile size
     - body shape
     - neck this.width (if any)
     - arm shape
     - head size + brain size on top of it / shape
     - eye shape: bug, oval, round
     
     Examples:
     - martian alien
     - alien blob
     
     Strategy on procedural random number generation:
     - Some things need to be identical shape, like the heads, so they get a specific random seed start
     - Most details and numbers of things are specific to the planet (one alien race), so keyed off the planet seed
     - Most position of stuff is random every time, even reentering the same bar
     - Some stuff like the pins are specific to the bar
     
     */


    render: function() {
      if (this.tier.type === SF.TIER_START) {
				this.drawBell();
        return;
      }
      this.s = 0;
      this.headseed = 0;
      this.visits = this.visitsStart;

			if (this.data.type !== SF.TYPE_HOTEL) {
				this.alien = new SBar.IconAlien(this.data.seed, this.data.raceseed, this.data.type, this.data.faction, this.data.seed === S$.origHomeSeed);
				this.alien.update(-SF.HALF_WIDTH/3,0,this.midcontext);
				if (!this.done_blinks && this.fullrand() < 0.55) {
					this.alien.BindBlinks((Math.floor(this.fullrand()*300)+30)*1000);
					//this.alien.BindBlinks(0);
				}
				this.done_blinks = true;
			}
      if (this.data.type === SF.TYPE_LAB) {
        this.drawBubbles();
      }
			
			if (this.data.type === SF.TYPE_HOTEL) {
				this.drawBell();
			}
			
    },

    drawBubbles: function() {
      if (this.bubbles === undefined) {
        this.initBubbles();
      }
      for (var i = 0; i < this.bubblenum; i++) {
        this.midcontext.drawImage(this.bubble, 0, 0, this.bubblesize, this.bubblesize, this.bubbles[i][0], this.bubbles[i][1], this.bubbles[i][2], this.bubbles[i][2]);
        this.bubbles[i][0] += (Math.random() - 0.5); // update x
        this.bubbles[i][1] -= Math.random() / 2 + this.bubbles[i][3]; // update y
        if (this.bubbles[i][1] < -this.bubblesize) {
          this.bubbles[i][0] = Math.random() * SF.WIDTH;
          this.bubbles[i][1] = SF.HEIGHT - Math.random() * 200;
          this.bubbles[i][2] = Math.random() * 30 + 10;
          this.bubbles[i][3] = this.visitrand();
        }
      }
    },
    initBubbles: function() {
      this.bubblesize = 50;
      this.bubble = document.createElement('canvas');
      this.bubble.width = this.bubblesize;
      this.bubble.height = this.bubblesize;
      this.bubblectx = this.bubble.getContext('2d');

      var colorStops = [0, 'rgba(255,255,255,0.2)', 0.98, 'rgba(255,255,255,0.1)', 0.98, 'rgba(0,0,0,0.25)', 1, 'rgba(0,0,0,0.25)'];
      SU.circleRad(this.bubblectx, this.bubblesize / 2, this.bubblesize / 2, this.bubblesize / 2, colorStops);
      colorStops = [0, 'rgba(0,0,0,0.05)', 1, 'rgba(0,0,0,0)'];
      SU.circleRad(this.bubblectx, this.bubblesize * 2 / 5, this.bubblesize * 3 / 5, this.bubblesize / 3, colorStops);
      colorStops = [0, 'rgba(255,255,255,0.3)', 1, 'rgba(255,255,255,0)'];
      SU.circleRad(this.bubblectx, this.bubblesize * 3 / 5, this.bubblesize * 2 / 5, this.bubblesize / 3, colorStops);

      this.bubblenum = Math.floor(this.barrand() * 10) + 5;
      this.bubbles = [];
      for (var i = 0; i < this.bubblenum; i++) {
				var starty = SU.r(this.data.seed, 660+i)*SF.HEIGHT;
        this.bubbles.push([this.visitrand() * SF.WIDTH, starty/*SF.HEIGHT + this.visitrand() * 600*/, this.visitrand() * 90 + 5, this.visitrand()]); // x, y, size, speed
      }
    },
    background_seed: null,
    drawBackground: function() {
      if (!this.background_seed) {
        // Same background next time it gets drawn.
        this.background_seed = this.s;
      }
      this.s = this.background_seed;
      this.backr = Math.floor(this.barrand() * 256);
      this.backg = Math.floor(this.barrand() * 256);
      this.backb = Math.floor(this.barrand() * 256);

      SU.rect(this.botcontext, 0, 0, this.width, this.height, "#000"); // fill black to start
      var colorStops = [0, 'rgba(' + this.backr + ',' + this.backg + ',' + this.backb + ',0.5)', 1, 'rgba(' + this.backr + ',' + this.backg + ',' + this.backb + ',1)'];
      SU.rectGrad(this.botcontext, 0, 0, this.width, this.height, 0, 0, 0, this.height, colorStops);
      delete colorStops;
      colorStops = [0, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0.01)'];
      SU.circleRad(this.botcontext, this.barrand() * this.width, 0, this.height + 100, colorStops);
      delete colorStops;
      colorStops = [0, 'rgba(' + 100 + ',' + 100 + ',' + 100 + ',0.25)', 1, 'rgba(' + 0 + ',' + 0 + ',' + 0 + ',0.75)'];
      SU.rectGrad(this.botcontext, 0, 0, this.width, this.height, 0, 0, 0, this.height, colorStops);
      delete colorStops;

      if (this.data.type === SF.TYPE_TEMPLE_BAR) {
        this.drawTempleBarBackground();
      } else if (this.data.raceseed && this.data.raceseed !== SF.RACE_SEED_HUMAN
				// Put a race pattern on the wall. But if the race controls the system.
			  && this.data.parentData && this.data.parentData.systemData && this.data.parentData.systemData.race_controls_system) {
				let seed = this.data.raceseed;
				let r = Math.floor(SU.r(seed,7.51)*60);					
				let g = Math.floor(SU.r(seed,7.52)*60);					
				let b = 60 - Math.min(r,g);
			
				let pattern = SU.BuildRaceStamp(seed, r, g, b);
				this.botcontext.save();
				this.botcontext.globalAlpha = 0.16;
				let scale = SU.r(seed, 51.39)*4+1;
				this.botcontext.scale(scale,scale)
				this.botcontext.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
				this.botcontext.rotate(SU.r(seed, 39.39) * PIx2);
				SU.rect(this.botcontext, -SF.WIDTH, -SF.HEIGHT, SF.WIDTH*2, SF.HEIGHT*2, pattern);
				this.botcontext.restore();
      }

      this.drawBuildingName();

      if (this.data.type === SF.TYPE_BAR || this.data.type === SF.TYPE_TEMPLE_BAR) {
        var y1 = this.height / 6 + 80;
        var y2 = this.height * 2 / 6 + 65;
        var y3 = this.height * 3 / 6 + 50;
				var r = Math.floor(this.barrand()*this.barrand() * 255)/2;
				var g = Math.floor(this.barrand()*this.barrand() * 255)/2;
				var b = Math.floor(this.barrand()*this.barrand() * 255)/2;				
        if (this.barrand() > 0.35) {
          this.drawShelf(y1, r, g, b);
        }
        if (this.barrand() > 0.35) {
          this.drawShelf(y2, r, g, b);
        }
        this.drawShelf(y3, r, g, b);
      } else if (this.data.type === SF.TYPE_MINING) {
        this.drawHammers(SF.WIDTH / 4, SF.HEIGHT / 3);
        this.drawHammers(3 * SF.WIDTH / 4, SF.HEIGHT / 3);
      } else if (this.data.type === SF.TYPE_ARMORY) {
        this.drawSword();
      } else if (this.data.type === SF.TYPE_SHIPYARD) {
				this.drawAnchor();
			}
    },
    background_drawn: false,
    tiles: [],
    tilesdark: [],
    drawTempleBarBackground: function() {
      var randseed = S$.time;
      var yoff = Math.floor(SU.r(this.data.seed, 346.25) * tbarsize);
      for (var y = 0; y < SF.HEIGHT; y += tbarsize) {
        var off = Math.floor(SU.r(this.data.seed, y) * tbarsize);
        for (var x = 0; x - off < SF.WIDTH; x += tbarsize) {
          randseed++
          this.drawTempleSquare(x - off, y - yoff, tbarsize, randseed);
        }
      }
      this.background_drawn = true;
    },
    drawTempleSquare: function(x, y, size, randseed) {
      if (!this.background_drawn || SU.r(randseed, 643.23) > 0.97) {
				let r = Math.floor(this.visitrand()*60);
				let g = Math.floor(this.visitrand()*60);
				let b = Math.floor(this.visitrand()*60);
        /*var r = Math.floor(Math.random() * 60);
        var g = Math.floor(Math.random() * 60);
        var b = Math.floor(Math.random() * 60);
				*/
        if (!this.tiles[x]) {
          this.tiles[x] = [];
          this.tilesdark[x] = [];
        }
        this.tiles[x][y] = 'rgb(' + (r) + ',' + (g) + ',' + (b) + ')';
        this.tilesdark[x][y] = 'rgb(' + (Math.floor(r / 2)) + ',' + (Math.floor(g / 2)) + ',' + (Math.floor(b / 2)) + ')';
      }
      SU.rect(this.botcontext, x + 3, y + 3, size - 6, size - 6, this.tiles[x][y], this.tilesdark[x][y], 6);
    },
    drawHammers: function(centerx, centery) {
      this.botcontext.save();
      this.botcontext.translate(centerx, centery);
      this.botcontext.rotate(-Math.PI / 4);

      var colorStops = [0, '#222', 1, '#444'];
      SU.rectRad(this.botcontext, -150, -20, 300, 40, -150, 0, 150, colorStops, 2, "#000");
      colorStops = [0, '#666', 1, '#444'];
      SU.rectRad(this.botcontext, 95, -60, 50, 120, 120, 0, 60, colorStops, 2, "#000");

      this.botcontext.rotate(-Math.PI / 2);
      colorStops = [0, '#222', 1, '#444'];
      SU.rectRad(this.botcontext, -150, -20, 300, 40, -150, 0, 150, colorStops, 2, "#000");
      colorStops = [0, '#666', 1, '#444'];
      SU.rectRad(this.botcontext, 95, -60, 50, 120, 120, 0, 60, colorStops, 2, "#000");

      this.botcontext.restore();
    },
    drawSword: function() {
      var len = this.barrand() * 500 + 100;
      var bladew1 = this.barrand() * 15 + 6;
      var bladew2 = this.barrand() * 15 + 3;
      var tiplen = this.barrand() * 20 + 10;
      var guardw = this.barrand() * 30 + bladew1;
      var guardlen = this.barrand() * 20 + 3;
      var gripw = this.barrand() * 5 + 5;
      var griplen = this.barrand() * 40 + 35;

      this.botcontext.save();
      this.botcontext.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT / 2);

      // blade top
      this.botcontext.beginPath();
      this.botcontext.moveTo(-len / 2, 0 - bladew1);
      this.botcontext.lineTo(len / 2, 0 - bladew2);
      this.botcontext.lineTo(len / 2 + tiplen, 0);
      this.botcontext.lineTo(-len / 2, 0);
      this.botcontext.closePath();
      var colorStops = [0, '#BBB', 1, '#444'];
      SU.fillRadGrad(this.botcontext, 100, 300, 500, colorStops);
      this.botcontext.lineWidth = 1;
      this.botcontext.strokeStyle = "#000";
      this.botcontext.stroke();

      // blade bot
      this.botcontext.beginPath();
      this.botcontext.moveTo(-len / 2, bladew1);
      this.botcontext.lineTo(len / 2, bladew2);
      this.botcontext.lineTo(len / 2 + tiplen, 0);
      this.botcontext.lineTo(-len / 2, 0);
      this.botcontext.closePath();
      var colorStops = [0, '#777', 1, '#111'];
      SU.fillRadGrad(this.botcontext, 100, -300, 500, colorStops);
      this.botcontext.lineWidth = 1;
      this.botcontext.strokeStyle = "#000";
      this.botcontext.stroke();

      //grip
      colorStops = [0, '#000', 1, '#333'];
      SU.rectRad(this.botcontext, 0 - len / 2 - guardlen - griplen, 0 - gripw, griplen, gripw * 2, 0 - len / 2 - guardlen, 0 - gripw / 2, griplen, colorStops, 1, "#000");

      // guard on top
      var colorStops = [0, '#666', 1, '#444'];
      SU.rectRad(this.botcontext, 0 - len / 2 - guardlen, 0 - guardw, guardlen, guardw * 2, 0 - len / 2 - guardlen / 2, 0 - guardw / 2, guardw, colorStops, 1, "#000");

      // hanging hooks
      colorStops = [0, '#000', 1, '#333'];
      SU.rectRad(this.botcontext, 0 - len / 2 + 5, 5, 10, 5 + bladew1, 0, 0, 20, colorStops, 1, "#000");
      colorStops = [0, '#111', 1, '#444'];
      SU.rectRad(this.botcontext, 0 + len / 2 - 10, 5, 10, 5 + bladew2, 0, 0, 20, colorStops, 1, "#000");

      this.botcontext.restore();
    },
		drawAnchor: function() {
			// Duplicate with iconBuilding.
			
      img = document.createElement('canvas');
			var size = 400;
      img.width = size;
      img.height = size;
			ctx = img.getContext('2d');
			ctx.translate(200, 200);

			// SF1 ISS logo parody.
			var scale = 4;
			
      SU.circle(ctx, 0, 0, 56*scale, "#888");
			ctx.globalCompositeOperation = 'destination-out';
      SU.circle(ctx, 0, 0, 36*scale, "#000");
      SU.line(ctx, 0, -50*scale, 0, 50*scale, "#000", 22*scale);
			ctx.globalCompositeOperation = 'source-over';
      SU.line(ctx, -50*scale, 0, 50*scale, 0, "#888", 22*scale);
			ctx.globalCompositeOperation = 'destination-over';
      var colorStops = [0, 'rgba(255, 255, 255, 0.3)', 1, 'rgba(255, 255, 255, 0)'];
      SU.circleRad(ctx, 0, 0, 0, colorStops);

			
			var ctx2 = this.botcontext;

      ctx2.save();
			ctx2.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT-size/2);
      ctx2.rotate(SU.r(this.data.seed, 32.39) * Math.PI / 32 - Math.PI / 64);
			ctx2.transform(1, 0, 0, 0.6, 0, 0);
      ctx2.drawImage(img, -size/2, 0);
      ctx2.restore();
			
		},
    drawShelf: function(starty, r, g, b) {
			var rgb0 = 'rgb('+(r+60)+','+(g+60)+','+(b+60);
			var rgb1 = 'rgb('+(r+30)+','+(g+30)+','+(b+30);
			var rgb2 = 'rgb('+r+','+g+','+b;
      SU.rect(this.botcontext, 0, starty - this.height / 40, this.width, this.height / 40, rgb0);
      SU.rect(this.botcontext, 0, starty, this.width, this.height / 80, rgb1);
      SU.rect(this.botcontext, 0, starty + this.height / 80, this.width, this.height / 40, rgb2);
      this.addBottles(starty);
    },
    addBottles: function(y) {
      for (var x = this.barrand() * 50 - 50; x < this.width; x += 30) {
        if (this.barrand() > 0.17) { // skip some
					x += this.addBottle(x, y);
        }
      }
    },
		addBottle: function(x, y) {
			var width = this.barrand()*70+20;
			var height = this.barrand()*130+25;
			// this.botcontext.drawImage(SM.bottle, bottlex, 0, 100, 150, x, y - 78, 50, 75);
			var colorwidth = width * 0.8;
			var maxheight = height * 0.35;
			var r = Math.floor(this.barrand()*this.barrand() * 255);
			var g = Math.floor(this.barrand()*this.barrand() * 255);
			var b = Math.floor(this.barrand()*this.barrand() * 255);
			var opaq = 1-this.barrand()*this.barrand()/2;
			var colorheight = this.barrand()*(maxheight-10)+10;
			SU.rectCorner(this.botcontext, 6, x - colorwidth/2, y - colorheight-12, colorwidth, colorheight, 'rgba('+r+','+g+','+b+','+opaq+')')
			var colorStops = [0, 'rgba('+r+','+g+','+b+',0.25)', 1, 'rgba('+r+','+g+','+b+',0)'];
			SU.circleRad(this.botcontext, x, y - height/3, Math.min(width/2,height/2)*0.7, colorStops);
			this.botcontext.drawImage(bottleimg, x - width/2, y - height*0.95 - 12, width, height);
			
			/*
			r += Math.floor(Math.random() * 150)-75;
			g += Math.floor(Math.random() * 150)-75;
			b += Math.floor(Math.random() * 150)-75;
			*/
			r = fixColor(Math.floor(this.barrand()*255)-125);
			g = fixColor(Math.floor(this.barrand()*255)-125);
			b = fixColor(Math.floor(this.barrand()*255)-125);
			this.botcontext.fillStyle = 'rgb('+r+','+g+','+b+')';
			this.botcontext.strokeStyle = "#000";

			let symbols = ST.getSymbol(this.barrand())+ST.getSymbol(this.barrand());
			let text_size = Math.round(Math.min(height,width*2)/4);
			let y_up = (height/3 - text_size)/2;
			this.botcontext.font = text_size+'pt serif';
			this.botcontext.textAlign = 'center';
			let rand = this.barrand();
			for (let i = 0; i < symbols.length && i < 5; i++) {
				this.botcontext.save();
				this.botcontext.translate(x,y-14-y_up-text_size/2);
				this.botcontext.rotate(SU.r(rand+i, 5.12)*PIx2);				
				this.botcontext.lineWidth = 2;
				this.botcontext.strokeText(symbols[i], 0, text_size/2);
				this.botcontext.restore();				
			}
			for (let i = 0; i < symbols.length && i < 5; i++) {
				this.botcontext.save();
				this.botcontext.translate(x,y-14-y_up-text_size/2);
				this.botcontext.rotate(SU.r(rand+i, 5.12)*PIx2);				
				this.botcontext.fillText(symbols[i], 0, text_size/2);
				this.botcontext.restore();				
			}
			return width;
		},
    drawBuildingName: function() {
			//if (this.tier.type !== SF.TIER_START) {
			//	return;
			//}
      this.botcontext.save();
      this.botcontext.translate(SF.WIDTH / 2, 40); // center of sign
      this.botcontext.rotate(SU.r(this.data.seed, 32.19) * Math.PI / 32 - Math.PI / 64);

      this.botcontext.font = "bold 40pt "+SF.FONT;
      this.botcontext.textAlign = 'center';
      var name1 = this.data.name[0];
      var name2 = this.data.name[1];
      var wide = Math.max(this.botcontext.measureText(name1).width, this.botcontext.measureText(name2).width);
      SU.rect(this.botcontext, 0 - wide / 2 - 20, -30, 20, 20, 'rgba(55,20,10,1)'); // top left corner
      SU.rect(this.botcontext, 0 - wide / 2 - 20, 80, 20, 20, 'rgba(55,20,10,1)'); // bottom left corner
      SU.rect(this.botcontext, wide / 2, -30, 20, 20, 'rgba(55,20,10,1)'); // top right corner
      SU.rect(this.botcontext, wide / 2, 80, 20, 20, 'rgba(55,20,10,1)'); // bottom right corner
      SU.rect(this.botcontext, 0 - wide / 2 - 13, -23, wide + 26, 116, 'rgba(155,120,80,1)', 'rgba(55,20,10,1)', 5); // outer
      SU.rect(this.botcontext, 0 - wide / 2 - 10, -20, wide + 20, 110, 'rgba(155,120,80,1)', 'rgba(120,70,20,1)', 5); // inner

      this.botcontext.fillStyle = 'rgba(55,20,10,1)';
      this.botcontext.fillText(name1, 0, 25);
      this.botcontext.fillText(name2, 0, 78);

      this.botcontext.restore();
    },
    drawForeground: function() {
      // top surface
      SU.rect(this.topcontext, 0, this.height * 0.7, this.width, this.height * 0.2, 'rgba(100,50,10,1)');
      var colorStops = [0, 'rgba(255,255,255,0.55)', 1, 'rgba(255,255,255,0.01)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.7, this.width, this.height * 0.2, 0, this.height * 0.7, this.width, this.height * 0.9, colorStops);
      colorStops = [0, 'rgba(' + this.backr + ',' + this.backg + ',' + this.backb + ',0.25)', 1, 'rgba(' + this.backr + ',' + this.backg + ',' + this.backb + ',0.01)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.7, this.width, this.height * 0.2, 0, this.height * 0.7, 0, this.height * 0.9, colorStops);

      this.headr = Math.floor(this.barrand() * 156) + 100;
      this.headg = Math.floor(this.barrand() * 156) + 100;
      this.headb = Math.floor(this.barrand() * 156) + 100;
      if (this.data.type === SF.TYPE_LAB) {
        colorStops = [0, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0.01)'];
      } else {
        colorStops = [0, 'rgba(' + this.headr + ',' + this.headg + ',' + this.headb + ',0.5)', 1, 'rgba(' + this.headr + ',' + this.headg + ',' + this.headb + ',0.01)'];
      }
      SU.rectRad(this.topcontext, 0, this.height * 0.7, this.width, this.height * 0.2, this.width / 4, this.height * 0.7, this.width / 2, colorStops);

      colorStops = [0, 'rgba(120,70,50,1)', 1, 'rgba(80,50,30,1)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.7, this.width, this.height * 0.002, 0, this.height * 0.7, this.width, this.height, colorStops);

      SU.rect(this.topcontext, 0, this.height * 0.9, this.width, this.height, 'rgba(90,50,20,1)');
      colorStops = [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0.01)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.9, this.width, this.height, 0, this.height * 0.9, this.width, this.height, colorStops);

      SU.rect(this.topcontext, 0, this.height * 0.9, this.width, this.height * 0.003, 'rgba(120,70,50,1)');
      colorStops = [0, 'rgba(120,70,50,1)', 1, 'rgba(60,40,30,1)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.9, this.width, this.height * 0.003, 0, this.height * 0.9, this.width, this.height, colorStops);

      SU.rect(this.topcontext, 0, this.height * 0.92, this.width, this.height, 'rgba(60,30,5,1)');
      colorStops = [0, 'rgba(255,255,255,0.05)', 1, 'rgba(0,0,0,0.15)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.92, this.width, this.height, 0, this.height * 0.95, this.width, this.height, colorStops);

      colorStops = [0, 'rgba(100,50,40,1)', 1, 'rgba(50,30,20,1)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.92, this.width, this.height * 0.003, 0, this.height * 0.92, this.width, this.height, colorStops);


      colorStops = [0, 'rgba(0,0,0,0.10)', 1, 'rgba(0,0,0,0.24)'];
      SU.rectGrad(this.topcontext, 0, this.height * 0.92, this.width, this.height, 0, this.height * 0.95, 0, this.height, colorStops);
      delete colorStops;
    },
		InitBottles: function() {
			// Bottle.
      bottleimg = document.createElement('canvas');
      bottleimg.width = 200;
      bottleimg.height = 390;
			ctx = bottleimg.getContext('2d');
			ctx.save();
			ctx.globalAlpha = 0.25;
      var colorStops = [0, 'white', 0.5, 'rgba(0,0,0,0)', 1, 'white'];
			SU.rectCornerGrad(ctx, 20, 20, 220, 160, 160, colorStops);
      colorStops = [0, 'white', 0.5, 'rgba(0,0,0,0)', 0.5, 'rgba(0,0,0,0)', 1, 'white'];
			SU.rectCornerGrad(ctx, 20, 20, 220, 160, 160, colorStops, null, null, true);
			ctx.save();
			ctx.transform(1, 0, 0, 0.1, 0, 0);
			ctx.globalAlpha = 0.5;
			SU.circle(ctx, 100, 3750, 75, "#FFF");
			SU.circle(ctx, 100, 3720, 35, "#FFF");
			SU.circle(ctx, 100, 2250, 75, "#FFF");
			ctx.restore();
			ctx.save();
			ctx.globalAlpha = 0.15;
			SU.rectCorner(ctx, 0, 80, 150, 40, 70, "#FFF");
			SU.rectCornerGrad(ctx, 0, 80, 150, 40, 70, colorStops, null, null, true);
			ctx.globalAlpha = 0.35;
			ctx.transform(1, 0, 0, 0.1, 0, 0);
			SU.circle(ctx, 100, 2210, 25, "#FFF");
			SU.circle(ctx, 100, 1510, 25, "#FFF");
			ctx.restore();
			ctx.transform(1, 0, 0, 0.2, 0, 0);
			SU.circle(ctx, 100, 760, 25, "#FFF");
		}, 
		drawBell: function() {
			var left = 655;
			let y = 1000;  // Twice actual y, for the coming transform.
      if (this.tier.type !== SF.TIER_START) {
	      SU.circle(this.topcontext, left, y/2+130, 40, "#888");
				this.topcontext.save();
				this.topcontext.transform(1, 0, 0, 0.5, 0, 0);
	      SU.circle(this.topcontext, left, y+290, 50, "#222");
	      SU.circle(this.topcontext, left, y+300, 50, "#222");
	      SU.circle(this.topcontext, left, y+280, 48, "#222");
	      SU.circle(this.topcontext, left, y+270, 40, "#444");
	      SU.circle(this.topcontext, left, y+250, 40, "#888");
	      SU.circle(this.topcontext, left, y+245, 40, "#888");
	      SU.circle(this.topcontext, left, y+235, 35, "#888");

			  var color_stops = [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.topcontext, left, y+270, 20, color_stops);
	      SU.circleRad(this.topcontext, left+20, y+325, 20, color_stops);
				this.topcontext.restore();
			  color_stops = [0, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(this.topcontext, left+15, y/2+115, 15, color_stops);

				this.topcontext.save();
				this.topcontext.transform(1, 0, 0, 0.5, 0, 0);
	      SU.circle(this.topcontext, left, y+195, 8, "#552");
	      SU.circle(this.topcontext, left, y+185, 8, "#552");
	      SU.circle(this.topcontext, left, y+165, 16, "#330");
	      SU.circle(this.topcontext, left, y+160, 16, "#552");
			  color_stops = [0, 'rgba(220,220,120,0.25)', 1, 'rgba(0,0,0,0)'];
	      SU.circleRad(this.topcontext, left, y+160, 16, color_stops);
				this.topcontext.restore();
			}
			
			// Plaque / placard.
			this.topcontext.save();
			this.topcontext.translate(0, 60);
      this.topcontext.rotate(-0.05);
			left = 120;
			// Plaque gradient front.
		  color_stops = [0, "#663", 1, "#330"];
      grd = this.topcontext.createLinearGradient(left-20, 550, left-20, 620);
      for (var n = 0; n < color_stops.length; n += 2) {
        grd.addColorStop(color_stops[n], color_stops[n + 1]);
      }
			SU.triangle(this.topcontext, left-20, 553, left-40, 640, left-1, 639, grd, "#331", 2);
			
			// Plaque gradient back.
		  color_stops = [0, "#996", 1, "#663"];
      grd = this.topcontext.createLinearGradient(left, 550, left, 620);
      for (var n = 0; n < color_stops.length; n += 2) {
        grd.addColorStop(color_stops[n], color_stops[n + 1]);
      }
			
			// Text twice, to center it.
			var text = ST.getWord(this.data.raceseed, 1.11)+" "+ST.getWord(this.data.raceseed, 1.21);
			if (SU.r(this.data.raceseed, 1.42) < 0.5) text += " "+ST.getWord(this.data.raceseed, 1.31);
      if (this.tier.type === SF.TIER_START) {
	      //text = this.data.name[0]+"\n"+this.data.name[1];
				text = "Early days-\nExpect bugs"
			}
			var height = SU.wrapText(this.topcontext, text, left+150, 580, 300, 30, SF.FONT_XL, "#FFF", "center");
			
      this.topcontext.beginPath();
      this.topcontext.moveTo(left-20, 552); // Top left.
      this.topcontext.lineTo(left+300, 552);  // Top right.
      this.topcontext.lineTo(left+320, 648);  // bottom right.
      this.topcontext.lineTo(left, 653);  // Bottom left.
      this.topcontext.closePath();
      this.topcontext.lineWidth = 2;
      this.topcontext.strokeStyle = "#331";
      this.topcontext.stroke();
			this.topcontext.fillStyle = grd;
			this.topcontext.fill();
			
			SU.wrapText(this.topcontext, text, left+156, 620-height/2, 300, 30, SF.FONT_XL, "#000", "center");
      //if (this.tier.type === SF.TIER_START) {
			//	SU.wrapText(this.topcontext, "Early days - Expect bugs", left+156, 670-height/2, 300, 30, SF.FONT_S, "#000", "center");
			//}
			this.topcontext.restore();
		},

    // Random based on the race
    rand: function() {
      this.s++;
      return SU.r(this.data.raceseed, 4.11 + this.s);
    },
		/*
    // Random based on the race and head number
    headrand: function() {
      this.s++;
      return SU.r(this.data.raceseed, 4.12 + this.s + this.headseed);
    },
		*/
    // Random based on the bar
    barrand: function() {
      this.s++;
      return SU.r(this.data.seed, 4.13 + this.s);
    },
    // Different every time on entry
    // Doesn't actually work for anything past render()- those pieces that use this need to shift to instantiated vars
    visitrand: function() {
      this.visits++;
      return SU.r(this.data.seed, 4.14 + this.visits);
    },
    fullrand: function() {
      this.fulls++;
      return SU.r(this.data.seed, 4.15 + this.fulls);
    },
    teardown: function() {
			if (this.alien) this.alien.ClearBlink();
      delete this.headxs;
      delete this.headys;
      delete this.smilexys;
      delete this.eyeimages;
      delete this.eyecontexts;
      delete this.bubbles;
    }
  };
})();
