/*
 * Main view from the helm: ship cockpit.
 * Note the helm is not a tier. It's a drawing interface that can be updated. It draws on its own helm layer.
 * Does this also Handle travel, repositioning the ship, 3D views, and HUD overlays?
 */
(function() {
	// Characters for a static random instrument.
	let RAND_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890;:<>?/\\|+=-*#@";
	
	let group_buffer = -4; // Between groups of numbers.
	let rand = 0;

    SBar.Helm = function() {
        this._initHelm();
    };

    SBar.Helm.prototype = {
			seed: null,
			context: null,
			instruments: null,  // {key, {x, y, w, h}}
			ship_name: null,
			_initHelm: function() {
				this.seed = S$.ship.seed;
				this.context = SC.layer0;
				this.instruments = {};
//      },
//			
//			activate: function() {
				this.DrawFrame();
				this.AddInstrumentPositions();
				
				this.UpdateStandardInstruments();
				this.UpdateInstrument("heading", [0,0,0]);
				this.UpdateInstrument("orientation", [0,0,0]);
				this.UpdateInstrument("galaxyxyz", [0,0,0]);
				this.UpdateInstrument("systemxyz", [0,0,0]);
				this.UpdateInstrument("planetxyz", [0,0,0]);
				this.UpdateInstrument("speed", 0);
				
			// Heading x3
			// Orientation x3
			// galaxyxyz x3
			// systemxyz x3
			// planetxyz x3
			// speed
			// random				
			},
			
			// Returns a random string 2-6 chars for display in the HUD.
			// See inspiration at https://www.nytimes.com/2019/12/16/climate/methane-leak-satellite.html.
			GetRandomStatic: function(seed) {
				let len = Math.floor(SU.r(seed, 1.71+S$.time)*6)+1;
				let str = "";
				for (let i = 0; i < len; i++) {
					str += RAND_CHARS[Math.floor(SU.r(seed, 1.72+i+S$.time)*RAND_CHARS.length)];
				}
				return str;
			},
			
			AddInstrumentPositions: function() {
				// Prefer placing instruments where there is a pixel.

				// Get the CanvasPixelArray from the given coordinates and dimensions.
				this.canvas_width = this.context.canvas.width;
				this.canvas_height = this.context.canvas.height;
				let imagedata = this.context.getImageData(0, 0, this.canvas_width, this.canvas_height);
				let pixels = imagedata.data;

				this.AddInstrumentPosition(this.seed+18.01, "time", 1, pixels);
				this.AddInstrumentPosition(this.seed+18.02, "speed", 1, pixels);
				this.AddInstrumentPosition(this.seed+18.03, "random", 1, pixels);
				this.AddInstrumentPosition(this.seed+18.04, "galaxyxyz", 3, pixels);
				this.AddInstrumentPosition(this.seed+18.05, "systemxyz", 3, pixels);
				this.AddInstrumentPosition(this.seed+18.06, "planetxyz", 3, pixels);
				this.AddInstrumentPosition(this.seed+18.07, "heading", 3, pixels);
				this.AddInstrumentPosition(this.seed+18.08, "orientation", 3, pixels);
				this.AddInstrumentPosition(this.seed+18.09, "shipname", 1, pixels);
				let s = 0;
				for (keyx of ["random1", "random2"]) {
					s++;
					if (SU.r(this.seed, 6.1+s) < 0.8) {
						if (this.AddInstrumentPosition(this.seed+18.08+s, keyx, 1, pixels)) {
							this.instruments[keyx]["randstatic"] = this.GetRandomStatic(this.seed+18.081+s);
						}
					}
				}
			},
			// Attempts to put a float into 6 charaters.
			FormatForDisplay: function(value) {
				if (value > 99999) {
					return "+";
				}
				return Math.round(Number.parseFloat(value).toPrecision(4)*10000)/10000;
			},
			// Updates are in the format: {galaxyxyz: [x,y,z], ...}
			// Time will be pulled automatically.
			// Valid keys:
			// Heading x3
			// Orientation x3
			// galaxyxyz x3
			// systemxyz x3
			// planetxyz x3
			// speed
			// random
			// (not time)
			// Hull temp?
			UpdateInstrument: function(key, value) {
				if (!this.instruments[key]) {
					// Couldn't place the instrument.
					return;
				}
				if (key == "time") {
					//if (value.length > 6) {
					//	value = value.substr(value.length-3);
					//}
					value = value.substr(2);  // Strip the time symbol.
					this.UpdateSingleInstrument(key, value);
				} else if (key == "speed") {
					this.UpdateSingleInstrument(key, this.FormatForDisplay(value));
				} else if (key == "random" || key == "random1" || key == "random2" || key == "shipname") {
					this.UpdateSingleInstrument(key, value);
				} else {
					this.UpdateTripleInstrument(key, value);					
				}
			},
			// Updates time and any random instruments.
			UpdateStandardInstruments: function() {
				this.UpdateInstrument("time", SU.TimeString(S$.time));
				this.UpdateInstrument("random", Math.round(SU.r(12.34, rand++)*99999));
				this.UpdateInstrument("shipname", this.GetShipName());
				for (key of ["random1", "random2"]) {
					if (this.instruments[key]) {
						this.UpdateInstrument(key, this.instruments[key]["randstatic"]);
					}
				}
				for (keyx of ["random1", "random2"]) {
					if (this.instruments[keyx] && SU.r(this.seed, rand++) < 0.1) {
						this.instruments[keyx]["randstatic"] = this.GetRandomStatic(this.seed+18.082+rand);
					}
				}				
			},
			
			// Abbreviate the ship name.
			GetShipName: function() {
				if (!this.ship_name) {
					let num_chars = Math.floor(SU.r(this.seed, 8.21)*5)+3;  // 3-7.
					if (num_chars > S$.ship.name.length) {
						this.ship_name = S$.ship.name;
					} else {
						let start = Math.floor(SU.r(this.seed, 8.42)*(S$.ship.name.length-num_chars));
						this.ship_name = S$.ship.name.substr(start, num_chars);
					}
				}
				return this.ship_name;
			},
			
			UpdateSingleInstrument(key, value) {
				let instrument = this.instruments[key];
				SU.rect(this.context, instrument.x, instrument.y, instrument.w, instrument.h, instrument.back_color, "#000", 1);
				SU.text(this.context, value, instrument.x+instrument.w-10, instrument.y+instrument.font_size+5, 
					instrument.font_size+"pt monospace", instrument.text_color, 'right');							
			},
						
			UpdateTripleInstrument(key, value) {
				let instrument = this.instruments[key];
				let font = instrument.font_size+"pt monospace";
				SU.rect(this.context, instrument.x, instrument.y, instrument.w, instrument.h, instrument.back_color, "#000", 1);
//				SU.rect(this.context, instrument.x, instrument.y+group_buffer+instrument.h, instrument.w, instrument.h, instrument.back_color, "#000", 1);
//				SU.rect(this.context, instrument.x, instrument.y+group_buffer*2+instrument.h*2, instrument.w, instrument.h, instrument.back_color, "#000", 1);

				SU.text(this.context, this.FormatForDisplay(value[0]), instrument.x+instrument.w-10, instrument.y+instrument.font_size+5, font, instrument.text_color, 'right');
				SU.text(this.context, this.FormatForDisplay(value[1]), instrument.x+instrument.w-10, instrument.y+instrument.font_size+5+30, font, instrument.text_color, 'right');
				SU.text(this.context, this.FormatForDisplay(value[2]), instrument.x+instrument.w-10, instrument.y+instrument.font_size+5+60, font, instrument.text_color, 'right');
			},
			
			DrawFrame: function() {
				//SU.rect(this.context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(180,120,120,0.5)")
				this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
				let edge_width = Math.round(SU.r(this.seed, 0.1)*3)+1;
				
				let brightness = Math.round(SU.r(this.seed, 4.11)*30);
				let left_pieces = Math.round(SU.r(this.seed, 0.2)*3);
				for (let i = 0; i < left_pieces; i++) {
					brightness += Math.round(SU.r(this.seed, 3.17+i)*30)+10;
					this.DrawQuadangle(this.seed+i+0.11, edge_width, brightness, /*reversey=*/false, /*edge=*/true);
				}
				
				let bot_pieces = Math.round(SU.r(this.seed, 0.2)*4);
				brightness = Math.round(SU.r(this.seed, 4.12)*30);
				for (let i = 0; i < bot_pieces; i++) {
					brightness += Math.round(SU.r(this.seed, 3.13+i)*30)+10;
					this.DrawQuadangle(this.seed+i+0.12, edge_width, brightness, /*reversey=*/true);
				}
				let top_pieces = Math.round(SU.r(this.seed, 0.2)*5);
				if (left_pieces == 0 && bot_pieces == 0) top_pieces += 2;
				brightness = Math.round(SU.r(this.seed, 4.13)*30);
				for (let i = 0; i < top_pieces; i++) {
					brightness += Math.round(SU.r(this.seed, 3.12+i)*30)+10;
					this.DrawQuadangle(this.seed+i+0.13, edge_width, brightness, /*reversey=*/false);
				}
			},
			
			DrawQuadangle: function(seed, edge_width, brightness, reversey, edge) {
				edge_width *= 2;
				//let brightness = Math.round(SU.r(seed, 3.12)*80)+20;
				let color = 'rgb('+brightness+', '+brightness+', '+brightness+')'
				
				let x1 = SU.r(seed, 1.1)*SF.WIDTH/2-SF.WIDTH/2;
				let y1 = SU.r(seed, 1.2)*SF.HEIGHT/2-SF.HEIGHT/2;
				let x2 = SU.r(seed, 1.3)*SF.WIDTH;
				let y2 = SU.r(seed, 1.4)*SF.HEIGHT/2-SF.HEIGHT/2;
				let x3 = SU.r(seed, 1.5)*SF.WIDTH;
				let y3 = SU.r(seed, 1.6)*SF.HEIGHT/2*0.8;
				let x4 = SU.r(seed, 1.7)*SF.WIDTH/2-SF.WIDTH/2;
				let y4 = SU.r(seed, 1.8)*SF.HEIGHT/2*0.8;
				
				// Reduce jagged edges.
				if (y4 < y3 && SU.r(seed, 2.12) < 0.5) {
					let temp = y3;
					y3 = y4;
					y4 = temp;
				}
				if (x2 < x3 && SU.r(seed, 2.13) < 0.5) {
					let temp = x2;
					x2 = x3;
					x3 = temp;
				}
				
				if (reversey) {
					y1 = SF.HEIGHT-y1;
					y2 = SF.HEIGHT-y2;
					y3 = SF.HEIGHT-y3;
					y4 = SF.HEIGHT-y4;
				}
				if (edge) {
					// Pick points on the left edge.
					x1 = SU.r(seed, 1.1)*SF.WIDTH/2-SF.WIDTH;
					y1 = SU.r(seed, 1.2)*SF.HEIGHT/2;
					x2 = SU.r(seed, 1.3)*SF.WIDTH/4;
					y2 = SU.r(seed, 1.4)*SF.HEIGHT/2;
					x3 = SU.r(seed, 1.5)*SF.WIDTH/4;
					y3 = SU.r(seed, 1.6)*SF.HEIGHT/2+SF.HEIGHT/2;
					x4 = SU.r(seed, 1.7)*SF.WIDTH/2-SF.WIDTH;
					y4 = SU.r(seed, 1.8)*SF.HEIGHT/2+SF.HEIGHT/2;
				}
				let doleft = edge===undefined || SU.r(seed, 5.21) > 0.6;
				let doright = edge===undefined || SU.r(seed, 5.22) > 0.6;
				let pattern = this.BuildMetalPattern(seed);
				if (doleft) {
					SU.quadangle(this.context, x1, y1, x2, y2, x3, y3, x4, y4, undefined, "#000", 2);
				}
				if (doright) {
					SU.quadangle(this.context, SF.WIDTH-x1, y1, SF.WIDTH-x2, y2, SF.WIDTH-x3, y3, SF.WIDTH-x4, y4, undefined, "#000", 2);
				}
				if (doleft) {
					SU.quadangle(this.context, x1, y1, x2, y2, x3, y3, x4, y4, pattern);
				}
				if (doright) {
					SU.quadangle(this.context, SF.WIDTH-x1, y1, SF.WIDTH-x2, y2, SF.WIDTH-x3, y3, SF.WIDTH-x4, y4, pattern);
				}
				
			},
			
			// Something txtured that looks kinda like metal.
			BuildMetalPattern: function(seed) {
				let smallsizex = Math.floor(SU.r(seed,8.4)*5)+5;
				let smallsizey = Math.floor(SU.r(seed,8.4)*5)+5;
	      let stampsmall = document.createElement('canvas');
	      stampsmall.width = smallsizex;
	      stampsmall.height = smallsizey;
	      let contextsmall = stampsmall.getContext('2d');
				let shade = Math.round(SU.r(seed, 9.1)*80)+15;
				SU.rect(contextsmall, 0, 0, smallsizex, smallsizey, 'rgb('+shade+','+shade+','+shade+')');
				
				let num_lines = Math.round(SU.r(seed, 71.1)*5)+15;
				shade = Math.round(SU.r(seed, 9.1)*80)+15;
				for (let i = 0; i < num_lines; i++) {
					// Random transparent lines.
					let r = shade + Math.round(SU.r(seed, 9.11+i)*10)-5;
					let g = shade + Math.round(SU.r(seed, 9.12+i)*10)-5;
					let b = shade + Math.round(SU.r(seed, 9.13+i)*10)-5;
					/*
					SU.line(contextsmall, Math.round(SU.r(seed+i, 71.2)*30)-10, Math.round(SU.r(seed+i, 71.3)*30)-10, 
					        Math.round(SU.r(seed+i, 71.4))*30-10, Math.round(SU.r(seed+i, 71.5)*30)-10,
								'rgba('+r+','+g+','+b+','+Math.round(SU.r(seed+i, 71.6)*128)+')',
							Math.round(SU.r(seed+i, 71.7)*4)+1);  // Width.
					*/
					SU.circle(contextsmall, Math.round(SU.r(seed+i, 71.2)*20)-10, Math.round(SU.r(seed+i, 71.3)*20)-10, 
					        Math.round(SU.r(seed+i, 71.4)*5)+1, 
					'rgba('+r+','+g+','+b+','+Math.round(SU.r(seed+i, 71.6)*128)+')');
				}
				
				let sizex = Math.floor(SU.r(seed,8.4)*150)+75;
				let sizey = Math.floor(SU.r(seed,8.5)*150)+75;
				sizex2=sizex*2; // Make them even.
				sizey2=sizey*2;
	      let stamp = document.createElement('canvas');
	      stamp.width = sizex2;
	      stamp.height = sizey2;
	      let context = stamp.getContext('2d');
				
				// Make it 4-way symmetric.
				context.save();
	      context.drawImage(stampsmall, 0, 0, sizex, sizey);
	      context.scale(-1, -1);
	      context.drawImage(stampsmall, -sizex2, -sizey2, sizex, sizey);
	      context.scale(-1, 1);
	      context.drawImage(stampsmall, 0, -sizey2, sizex, sizey);
	      context.scale(-1, -1);
	      context.drawImage(stampsmall, -sizex2, 0, sizex, sizey);
				context.restore();

				//SU.rect(context, 0, 0, sizex2, sizey2, "#F00")
		
	      return context.createPattern(stamp, "repeat");									
			},			
			
			// Return true if this box doesn't overlap with an existing instrument.
			InstrumentSpaceIsClear(x, y, w, h, buffer) {
				for (key in this.instruments) {
					let instrument = this.instruments[key];
					// Check that the left of the candidate overlaps with the existing, and so forth.
					if (x <= instrument.x + instrument.w + buffer && x + w >= instrument.x - buffer) {
						if (y <= instrument.y + instrument.h + buffer && y + h >= instrument.y - buffer) {
							return false;
						}
					}
				}
				return true;
			},
			
			// Returns true if the given space is not empty.
			// Note when looking at pixels, can't used the scaled coordinates.
			CanvasHasPixelAt(pixels, x, y) {
				// Un-scale the coordinates.
				x = Math.round(x*this.canvas_width/SF.WIDTH);
				y = Math.round(y*this.canvas_width/SF.WIDTH);
				return pixels[(y*this.canvas_width+x)*4+3] !== 0;
			},
			
			AddInstrumentPosition: function(seed, key, num_slots, pixels) {
				// Try several times to place the instrument.
				for (let i = 0; i < 5; i++) {
					if (this.AddInstrumentPosition2(seed+0.19+i, key, num_slots, pixels)) {
						return true;
					}
				}
				return false;
			},
			
			AddInstrumentPosition2: function(seed, key, num_slots, pixels) {
				//let font_size = Math.round(SU.r(seed, 8.12))*15+10;
				let font_size = 20;
				let h = font_size*1.3+8;
				let w = font_size*5+24;
				h += (num_slots-1)*(h+group_buffer);
				let sidebuffer = 20;
				//let sideoff = Math.round(SU.r(seed, 8.13)*SF.HALF_HEIGHT);
				// Try a bunch of times to find an open space. Just abandon if none found.
				
				
				let x = 0;
				let y = 0;
				let available_width = SF.WIDTH-w;
				let available_height = SF.HEIGHT-h;
				let point = Math.round(SU.r(seed, 8.15)*(2*available_width+2*available_height));
				if (point > (available_width+2*available_height)) {
					// Bottom.
					x = point - (available_width+2*available_height);
					y = SF.HEIGHT - h - sidebuffer;
				} else if (point > available_height*2) {
					// Top.
					x = point - 2*available_height;
					y = sidebuffer;
				} else if (point > available_height) {
					// Right.
					x = SF.WIDTH-w-sidebuffer;
					y = point - available_height;
				} else {
					// Left.
					x = sidebuffer;
					y = point;
				}
				
				//let x = Math.round(SU.r(seed, 17.71)*(SF.WIDTH-w));
				//let y = Math.round(SU.r(seed, 17.72)*(SF.HEIGHT-h));
				
				if (!this.InstrumentSpaceIsClear(x, y, w, h, sidebuffer)) {
					return false;
				}
				//if (force && !this.CanvasHasPixelAt(pixels, Math.round(x), Math.round(y))) {
//				if (force && !this.CanvasHasPixelAt(pixels, Math.round(x+w/2), Math.round(y+h/2))) {
				if (!(
						this.CanvasHasPixelAt(pixels, x, y) &&
						this.CanvasHasPixelAt(pixels, x, y+h) &&
						this.CanvasHasPixelAt(pixels, x+w, y) &&
						this.CanvasHasPixelAt(pixels, x+y, y+h) &&
						this.CanvasHasPixelAt(pixels, Math.round(x+w/2), Math.round(y+h/2))
					)) {	
					// No helm metal at this location.
					return false;
				}
				
				let r = Math.round(SU.r(seed, 17.1)*100+156);
				let g = Math.round(SU.r(seed, 17.2)*100+156);
				let b = Math.round(SU.r(seed, 17.3)*100+156);
				let text_color = 'rgb('+r+', '+g+', '+b+')';
				let back_shade = Math.round(SU.r(seed, 17.4)*80);
				let back_color = 'rgb('+back_shade+', '+back_shade+', '+back_shade+')';
				
				this.instruments[key] = {x: x, y: y, h: h, w: w, font_size: font_size, text_color: text_color, back_color: back_color};
				
				//color = "#444"
				return true;
				
				//(SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
				
		    //rectCorner: function(ctx, corner, x, y, width, height, fill, stroke, strokeWidth) {
			},

			// Renderer teardown.
      teardown: function() {
				error("don't tear down the helm. It should be persistent.")
      },
  };
})();

 
