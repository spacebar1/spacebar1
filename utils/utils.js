// Global namespace on these
function error(a, b, c, d, e, f, g, h, i, j, k) {
  log(a, b, c, d, e, f, g, h, i, j, k);
}

let c = 0;

function log(a, b, c, d, e, f, g, h, i, j, k) {
  var str = a;
  if (b !== undefined)
    str += " - " + b;
  if (c !== undefined)
    str += " - " + c;
  if (d !== undefined)
    str += " - " + d;
  if (e !== undefined)
    str += " - " + e;
  if (f !== undefined)
    str += " - " + f;
  if (g !== undefined)
    str += " - " + g;
  if (h !== undefined)
    str += " - " + h;
  if (i !== undefined)
    str += " - " + i;
  if (j !== undefined)
    str += " - " + j;
  if (k !== undefined)
    str += " - " + k;

  // Grab line number of the 'log' call to show the actual calling function.
  var err = getErrorObject();
  var line = err.stack.split("\n")[3];
  var index = line.lastIndexOf("/");
  line = line.substring(index+1);
  console.log("("+line + " " + str);
}
function printStack() {
	var err = getErrorObject();
	var lines = err.stack.split("\n")
	for (var i = 3; i < lines.length; i++) {
		var line = lines[i];
	  var index = line.lastIndexOf("/");
	  console.log(line.substring(index+1));
	}
}
function getErrorObject() {
  try {
    throw Error('');
  } catch (err) {
    return err;
  }
}

(function() {

	// Saves the state of the current tier.
	var stack_images = [];
	/*
	var	stack_ctx_main = [];
	var stack_ctx_text = [];
	var stack_ctx_layer = [];
	*/
	var stack_buttons = [];
	var	stack_tier = [];
	var	stack_callbacks = [];
	var stack_candochar = [];
	var x;  // Used for randoms.

  SBar.Utils = {
    // first argument extends second
    extend: function(o1, o2) {
      if (o1 === undefined || o2 === undefined) {
        error("extend error: " + o1 + ", " + o2);
      }
      for (var m in o2.prototype) {
        if (!(m in o1.prototype)) {
          o1.prototype[m] = o2.prototype[m];
        }
      }
    },
    addProps: function(o1, o2) {
      for (var p in o2) {
        o1[p] = o2[p];
      }
    },
    // Generates a new "random" number based on the seed and offset, result value 0.0 < 1.0
    r: function(seed, offset) {
		if (offset === undefined/* || seed === -1*/) {
        error("bad su.r");
				printStack();
      }
			// The 'sin' method has drawbacks but the solution here doesn't
			// need sequential uncorrelated - just something uncorrelated with
			// the input seeds. The multiplication here breaks up any potential
			// correlations between the seed and offset.
			// https://stackoverflow.com/a/19303725/1791917
      x = Math.sin(seed + offset + seed * offset + S$.game_seed) * 10000;
      return x - Math.floor(x);
    },
		// Resets SBar.Utils.
		resetSU: function() {
			//stack_ctx_main = [];
			//stack_ctx_text = [];
			//stack_ctx_layer = [];
			stack_images = [];
			stack_buttons = [];
			stack_tier = [];
			stack_callbacks = [];
			stack_candochar = [];
			delete this.combat_layers;
		},
    // writes two lines of text
    coordText1: "",
    coordText2: "",
    writeCoordText: function(line1, line2, optional_context, skip_clear) {
      //if (SU.coordText1 !== line1 || SU.coordText2 !== line2) {
			SU.coordText1 = line1;
      SU.coordText2 = line2;
      var context = optional_context ? optional_context : SC.layer3;
      if (!skip_clear) {
				context.clearRect(0, 0, 450, 70);
			}

      // Background for better readability
      context.fillStyle = 'rgba(0,0,0,0.25)';
      context.fillRect(5, 5, 400, 65);

      context.font = SF.FONT_L;
      context.strokeStyle = 'white';
      context.lineWidth = 1;
      context.fillStyle = 'white';
      //context.fill();
      context.fillText(line1, 15, 30);
      context.fillText(line2, 15, 60);
			//}
    },
    // array of [line1, line2, timeout, intervalFunc]
    messages: [],
    off: 55,
    message: function(line1, line2) {
      if (!line2) {
        line2 = "";
      }
      if (line1.length > 33) {
        line1 = line1.substring(0, 30) + "...";
      }
      if (line2.length > 33) {
        line2 = line2.substring(0, 30) + "...";
      }
      var message = {line1: line1, line2: line2, timeout: 25, interval: null};

      // find a free display
      for (var i = 0; i < 10; i++) {
        if (SU.messages[i] === undefined) {
          SU.messages[i] = message;
          SU.messageStart(i);
          break;
        }
      }
			let message_text = line1;
			if (line2 != "") {
				message_text += "\n"+line2;
			}
			S$.AddHudMessage(message_text); // Record it in the log. Hud log is ok, mostly transient stuff anyway.
    },
    messageStart: function(index) {
      SU.messageFader(index);
      var func = function() {
        SU.messageFader(index);
      };
      var message = SU.messages[index];
      message.interval = window.setInterval(func.bind(this), 100);
    },
    messageFader: function(index) {
      var context = SC.layer3;
      context.clearRect(SF.WIDTH-261, 724 - index * SU.off, 304, 55);
      var message = SU.messages[index];

      if (message.timeout > 0) {
        // Background for better readability
        if (message.timeout / 15 > 1) {
          context.globalAlpha = 1;
        } else {
          context.globalAlpha = message.timeout / 15;
        }
        context.fillStyle = 'rgba(0,0,0,0.25)';
        context.fillRect(SF.WIDTH-260, 726 - index * SU.off, 250, 51);

        context.font = SF.FONT_L;
        context.strokeStyle = '#FFF';
        context.lineWidth = 1;
        context.fillStyle = '#FFF';
				context.textAlign = 'left';
        //context.fill();
        context.fillText(message.line1, SF.WIDTH-250, 745 - index * SU.off);
        context.fillText(message.line2, SF.WIDTH-250, 769 - index * SU.off);

        context.globalAlpha = 1;
        message.timeout--;
      } else if (message.timeout <= 0) { // execute on 0 to clear
        window.clearInterval(message.interval);
        delete SU.messages[index];
      }
    },
    borderColor: "#888",
    textBubble: function(text, anchorx, anchory, boxx, boxy, width, duration) {
      var ctx = SC.layer3;

      var height = SU.wrapText(ctx, text, boxx + width / 2, boxy + 25, width, 30, SF.FONT_XL, "#FFF", "center");

      SU.triangle(ctx, anchorx, anchory, boxx + width / 2 - 10, boxy + height / 2 - 10, boxx + width / 2 + 10, boxy + height / 2 + 10, SU.borderColor);
      SU.triangle(ctx, anchorx, anchory, boxx + width / 2 - 10, boxy + height / 2 + 10, boxx + width / 2 + 10, boxy + height / 2 - 10, SU.borderColor);

      //rectCorner: function(ctx, corner, x, y, width, height, fill, stroke, strokeWidth) {
      height += 14;
      ctx.clearRect(boxx - 10, boxy - 10, width + 20, height + 10); // wipe out interior for seethrough
      SU.rectCorner(ctx, 15, boxx - 10, boxy - 10, width + 20, height + 10, 'rgba(100,100,100,0.85)', SU.borderColor, 10);

      SU.wrapText(ctx, text, boxx + width / 2, boxy + 25, width, 30, SF.FONT_XL, "#FFF", "center");

      var cb = function() {
        ctx.clearRect(boxx - 20, boxy - 20, width + 40, height + 40); // needs to cover border
        var x = Math.min(anchorx, boxx + width / 2) - 20;
        var y = Math.min(anchory, boxy + height / 2) - 20;
        ctx.clearRect(x, y, Math.abs(anchorx - (boxx + width / 2)) + 40, Math.abs(anchory - (boxy + height / 2)) + 40); // get the anchor
      };
			if (!duration) {
				duration = 2000;
			}
      this.bubbleTimeout = window.setTimeout(cb, duration);
			return this.bubbleTimeout;
    },
    PIx2: (Math.PI * 2) - 0.0001,
    circleRad: function(context, x, y, rad, colorStops, stroke, strokeWidth) {
      context.beginPath();
      context.arc(x, y, rad, 0, PIx2, false);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (colorStops !== null) {
        grd = context.createRadialGradient(x, y, 0, x, y, rad);
        for (var n = 0; n < colorStops.length; n += 2) {
          grd.addColorStop(colorStops[n], colorStops[n + 1]);
        }
        context.fillStyle = grd;
        context.fill();
      }
    },
    star: function(context, x, y, points, inrad, outrad, colorStops) {
      context.beginPath();
      context.moveTo(0, -outrad);
      for (var n = 1; n < points * 2; n++) {
        var radius = n % 2 === 0 ? outrad : inrad;
        var x2 = radius * Math.sin(n * Math.PI / points);
        var y2 = -radius * Math.cos(n * Math.PI / points);
        context.lineTo(x + x2, y + y2);
      }
      context.closePath();

      var grd = context.createRadialGradient(x, y, 0, x, y, outrad);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      context.fillStyle = grd;
      context.fill();
    },
    regularPolygon: function(context, x, y, sides, radius, fill, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y - radius);
      for (var i = 1; i < sides; i++) {
        var dx = Math.sin(i * PIx2 / sides) * radius;
        var dy = 0 - Math.cos(i * PIx2 / sides) * radius;
        context.lineTo(x + dx, y + dy);
      }
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      context.fillStyle = fill;
      context.fill();
    },
    regularPolygonGrad: function(context, x, y, sides, radius, colorStops, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y - radius);
      for (var i = 1; i < sides; i++) {
        var dx = Math.sin(i * PIx2 / sides) * radius;
        var dy = 0 - Math.cos(i * PIx2 / sides) * radius;
        context.lineTo(x + dx, y + dy);
      }
      context.closePath();

      var grd;
      if (colorStops !== null) {
        grd = context.createRadialGradient(x, y, 0, x, y, radius);
        for (var n = 0; n < colorStops.length; n += 2) {
          grd.addColorStop(colorStops[n], colorStops[n + 1]);
        }
        context.fillStyle = grd;
        context.fill();
      }

      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
    },
    regularPolygonRad: function(context, x, y, sides, radius, colorStops, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y - radius);
      for (var i = 1; i < sides; i++) {
        var dx = Math.sin(i * PIx2 / sides) * radius;
        var dy = 0 - Math.cos(i * PIx2 / sides) * radius;
        context.lineTo(x + dx, y + dy);
      }
      context.closePath();

      var grd;
      if (colorStops !== null) {
        grd = context.createRadialGradient(x, y, 0, x, y, radius);
        for (var n = 0; n < colorStops.length; n += 2) {
          grd.addColorStop(colorStops[n], colorStops[n + 1]);
        }
        context.fillStyle = grd;
        context.fill();
      }
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (colorStops !== null) {
        grd = context.createRadialGradient(x, y, 0, x, y, radius);
        for (var n = 0; n < colorStops.length; n += 2) {
          grd.addColorStop(colorStops[n], colorStops[n + 1]);
        }
        context.fillStyle = grd;
        context.fill();
      }			
    },				
    line: function(context, x, y, x2, y2, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x2, y2);
      //context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
    },
    quadratic: function(context, x, y, x2, y2, x3, y3, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x2, y2, x3, y3);
      //context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
    },
    circle: function(context, x, y, rad, fill, stroke, strokeWidth) {
      context.beginPath();
      context.arc(x, y, rad, 0, PIx2, false);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
    },
    triangle: function(context, x, y, x2, y2, x3, y3, fill, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x2, y2);
      context.lineTo(x3, y3);
      context.lineTo(x, y);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
    },
    quadangle: function(context, x, y, x2, y2, x3, y3, x4, y4, fill, stroke, strokeWidth) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x2, y2);
      context.lineTo(x3, y3);
      context.lineTo(x4, y4);
      context.lineTo(x, y);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
    },
    rect: function(context, x, y, width, height, fill, stroke, strokeWidth) {
      context.beginPath();
      context.rect(x, y, width, height);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
    },
    rectGrad: function(context, x, y, width, height, x1, y1, x2, y2, colorStops, stroke, strokeWidth) {
      context.beginPath();
      context.rect(x, y, width, height);
      context.closePath();

      grd = context.createLinearGradient(x1, y1, x2, y2);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      context.fillStyle = grd;
      context.fill();

    },
    fillRadGrad: function(context, x1, y1, rad, colorStops) {
      var grd = context.createRadialGradient(x1, y1, 0, x1, y1, rad);
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      context.fillStyle = grd;
      context.fill();
    },
    rectRad: function(context, x, y, width, height, x1, y1, rad, colorStops, stroke, strokeWidth) {
      context.beginPath();
      context.rect(x, y, width, height);
      context.closePath();
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (colorStops !== null) {
        grd = context.createRadialGradient(x1, y1, 0, x1, y1, rad);
        for (var n = 0; n < colorStops.length; n += 2) {
          grd.addColorStop(colorStops[n], colorStops[n + 1]);
        }
        context.fillStyle = grd;
        context.fill();
      }
    },
    ellipse: function(context, centerx, ccentery, radx, rady, fill, stroke, strokeWidth) {
      context.save(); // save state
      context.beginPath();

      context.translate(centerx - radx, ccentery - rady);
      context.scale(radx, rady);
      context.arc(1, 1, 1, 0, PIx2, false);
      context.restore(); // restore to original state

      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.stroke();
      }
      if (fill) {
        context.fillStyle = fill;
        context.fill();
      }
    },
    sendHome: function(optional_teardown) {
      SG.sendingHome = true;
      var func = function() {
				if (optional_teardown) {
					optional_teardown();
				}
        let homeBar = S$.GetOrigBar();
        //homeBar.activateTier(true);
				let tier = homeBar.parentData.activateTier();  // Put the ship on the planet.
				S$.TrackSystemVisit(homeBar.parentData.systemData.seed);
				tier.SetShipLocation(homeBar);
				// Special case, if the player looks around before traveling.
				SU.GetTravelRenderer(/*skip_activetier=*/true).SurfacePoint(homeBar.parentData, homeBar.x, homeBar.y);
				homeBar.pushBuildingTier();
      };
      SU.fadeOutIn(func.bind(this));
    },
    fading: false,
    // callback is called in the middle
    fadeOutIn: function(callback) {
      SU.fadeOut(callback, SU.fadeIn);
    },
    fadeOut: function(callback, callback2) {
      var layer = document.createElement('canvas');
      layer.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block');
			layer.style.width = SC.layer2.canvas.width+SF.TEXT_WIDTH+"px";
			layer.style.height = SC.layer2.canvas.height+"px";

 			this.temp_canvas_node = document.getElementById('container').appendChild(layer);
      SC.tempScreenLayer = layer.getContext('2d');

      if (!this.fading) {
        this.fading = true;
        var context = SC.tempScreenLayer;
        //SC.tempScreenLayer.show();
        for (var i = 0; i <= 20; i++) {
          var funct = (function(i2) {
            return function() {
              var amount = ((i2) / 20);
              context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
              SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,' + amount + ')');
            };
          })(i);
          window.setTimeout(funct, i * 50);
        }
        var func = function() {
          this.fading = false;
					while (stack_images.length > 0) {
						SU.PopTier();
					}
					SB.clear();
					this.removeExport();
          if (callback) {
            callback();
          }
          if (callback2) {
            callback2();
          }
        };
        window.setTimeout(func.bind(this), 21 * 50);
      }
    },
    fadeIn: function() {
      var context = SC.tempScreenLayer;
      //SC.tempScreenLayer.show();
      context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,1)');
      for (var i = 0; i <= 20; i++) {
        var funct = (function(i2) {
          return function() {
            var amount = ((20 - i2) / 20);
            context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,' + amount + ')');
            if (i2 === 20) {
							SU.temp_canvas_node.parentNode.removeChild(SU.temp_canvas_node)
							delete SU.temp_canvas_node;
              delete SC.tempScreenLayer;
              SG.sendingHome = false;
            }
          };
        })(i);
        window.setTimeout(funct, i * 50);
      }
    },
		ClearAllLayers: function() {
			for (let layer_name in SBar.Canvas) {
				let layer = SBar.Canvas[layer_name];
				//layer.setTransform(1, 0, 0, 1, 0, 0);
				//layer.globalcompositeoperation = "source-over";
				//SU.rect(layer, 0, 0, SF.HEIGHT, SF.WIDTH, "#000");
				layer.clearRect(0, 0, SF.HEIGHT, SF.WIDTH);
			}
		},
    buildImages: function() {
      // set up default images, if any
      // good to have, chances are this is faster than loading them over the network or file

			//TODO: remove these after all button removal.
      // left leg
      var img = document.createElement('canvas');
      img.width = 7;
      img.height = 12;
      var ctx = img.getContext('2d');

      SU.rect(ctx, 4, 0, 3, 12, "#999");
      SU.rect(ctx, 0, 8, 7, 4, "#999");
      SM.lleg = img;

      // right leg
      img = document.createElement('canvas');
      img.width = 7;
      img.height = 12;
      ctx = img.getContext('2d');

      SU.rect(ctx, 0, 0, 3, 12, "#999");
      SU.rect(ctx, 0, 8, 7, 4, "#999");
      SM.rleg = img;

      // right arrow
      img = document.createElement('canvas');
      img.width = 90;
      img.height = 90;
      ctx = img.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(11, 4);
      ctx.lineTo(82, 45);
      ctx.lineTo(11, 86);
      ctx.lineTo(36, 45);
      ctx.lineTo(11, 4);
      ctx.closePath();
      ctx.fillStyle = "#FFF";
      ctx.fill();
      SM.buttRight = img;
			
      // left arrow
      img = document.createElement('canvas');
      img.width = 90;
      img.height = 90;
      ctx = img.getContext('2d');
      ctx.scale(-1, 1);
      ctx.drawImage(SM.buttRight, -90, 0);
      SM.buttLeft = img;
			
			// 'X' for button.
      img = document.createElement('canvas');
      img.width = 74;
      img.height = 74;
			ctx = img.getContext('2d');
			SU.text(ctx, 'X', 37, 65, '60pt serif', "#FFF", 'center');
			SM.buttX = img;
			
			// 'S' for ship.
      img = document.createElement('canvas');
      img.width = 74;
      img.height = 74;
			ctx = img.getContext('2d');
			SU.text(ctx, 'S', 37, 65, ' 60pt serif', "#FFF", 'center');
			SM.buttShip = img;
			
			// '!' for quest.
      img = document.createElement('canvas');
      img.width = 74;
      img.height = 74;
			ctx = img.getContext('2d');
			SU.text(ctx, '!', 37, 65, ' 60pt serif', "#FFF", 'center');
			SM.buttQuest = img;
			
			// Checkmark.
      img = document.createElement('canvas');
      img.width = 74;
      img.height = 74;
			ctx = img.getContext('2d');
			SU.text(ctx, '✓', 37, 65, 'bold 60pt serif', "#FFF", 'center');
			SM.buttCheck = img;
			
			// Three lines for config.
      img = document.createElement('canvas');
      img.width = 74;
      img.height = 74;
			ctx = img.getContext('2d');
			SU.line(ctx, 10, 17, 64, 17, "#FFF", 5);
			SU.line(ctx, 10, 37, 64, 37, "#FFF", 5);
			SU.line(ctx, 10, 57, 64, 57, "#FFF", 5);
			SM.buttGear = img;
			

/*
				// Display an image at start
				
			var func = function() {
				SU.rect(SC.layer1, 500, 200, 500, 500, "#888")
				SC.layer1.drawImage(img, 500, 200);
			}
      window.setTimeout(func.bind(this), 100);
	*/		
			

//  Aura behind.			
//      var colorStops = [0, 'white', 1, 'rgba(0,0,0,0)'];
//      SU.circleRad(ctx, 50, 50, 40, colorStops);			
    },
    capitalize: function(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    /* 
     * move these
     */


    expandExport: function() {
      var exportdiv = document.getElementById("exportdiv");

      //importdiv.style.visibility = "hidden";
      //var encstr = DataStore.formatEncodedDataForExport(data);
      //exportlink.href = "data:application/octet-stream;charset=utf-8;base64,"+encstr;
      //exportlink.download = (Math.floor(new Date()/1000)%100000000)+".x";
      var exportarea = document.getElementById("exportarea");
      //exportarea.style.left = (800 + SF.MARGIN_LEFT + 5) + "px";
      exportdiv.style.visibility = "visible";
      exportarea.value = "";
    },
    exportGame: function() {
      var exportarea = document.getElementById("exportarea");
      var str = this.formatDataForExport(S$);
      exportarea.value = str;
    },
		exportGameUnencoded: function() {
      var exportarea = document.getElementById("exportarea");
      var str = SU.S(S$);
      exportarea.value = str;
		},
    removeExport: function() {
      var exportdiv = document.getElementById("exportdiv");
      exportdiv.style.visibility = "hidden";
    },
    importGame: function() {
      var exportarea = document.getElementById("exportarea");
      var str = exportarea.value;
      var charData = SU.formatDataFromImport(str);
      localStorage.char = charData;
      S$.loadCharData(charData);
    },
		Stringify: function(obj, with_limit/*optional*/) {
      // debug version
      //var cache = [];
			var cache = new Set();
			var num_objs = 0;
      var str = JSON.stringify(obj, function(key, value) {
        if (typeof value === 'object' && value !== null) {
				  //error("NEW   ", JSON.stringify(value))
					//error("NEW   ", key)
				  if (cache.has(value)) {
          //if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            error("debug: cyclic object",key,value);
            //error("debug: cyclic object",key,JSON.stringify(value));
						for (var x in value) {
							error("field: ",x);
						}
            return;
          }
          //cache.push(value);
					cache.add(value);
					if (with_limit) {
						++num_objs;
						if (num_objs >= 500) {
							if (num_objs === 500) {
								error("limiting at 500 objects");
							}
							return;						
						}						
					}
        }
        return value;
      });
      cache = null;
			return str;
      // faster non-debug version:
      //var str = JSON.stringify(data);
		},
		S: function(obj) {
			return SU.Stringify(obj, /*with_limit=*/true);
		},
		S1: function(obj) {
			return SU.Stringify(obj, /*with_limit=*/false);
		},
    formatDataForExport: function(data) {
			let Set_toJSON = function(key, value) {
			  if (typeof value === 'object' && value instanceof Set) {
			    return [...value];
			  }
			  return value;
			}
			// This doesn't really need to be base 64, but with potential for all the special chars it's a convenient storage format.
			var str = window.btoa(encodeURIComponent(SU.Stringify(data)));
      return "[" + str + "]";
    },
    formatDataFromImport: function(data) {
			if (!data) {
				//error("cannot load, no data");
				return "";
			}
      if (data[0] !== '[') {
        error("format error");
        SU.message("Game data format error");
        return;
      }
      let last = data.indexOf("]");
			if (last < 0) {
        error("data error");
        SU.message("Game data incomplete");
        return;
			}
      data = data.replace(/\s/g, ''); // newline fix
      last = data.indexOf("]");
      data = data.substring(1, last);
			data = decodeURIComponent(window.atob(data));
      var str = JSON.parse(data);
      return str;
    },
    saveGame: function(/*optional*/silent, /*optional used for second save*/save_field) {
			if (!save_field) {
				save_field = "char";
			}
      localStorage[save_field] = SU.formatDataForExport(S$);
			localStorage[save_field+"detail"]=SU.formatDataForExport({name: S$.crew[0].name, time: S$.time, cansave: S$.conduct_data['cansave'], version:S$.version});
			if (!silent) {
	      SU.message("Game Saved");
			}
    },
    loadGame: function() {
      let charData = SU.formatDataFromImport(localStorage["char"]);
      S$.loadCharData(charData);
			if (!S$.conduct_data['cansave']) {
	      delete localStorage["char"];
				delete localStorage["chardetail"];
			}
      return true;
    },
		loadSaveDetails: function() {
			return SU.formatDataFromImport(localStorage["chardetail"]);
		},
		getHighScores: function() {
      let scores = SU.formatDataFromImport(localStorage["scores"]);
			if (!scores) {
				scores = [];
			}
			return scores;
		},
		addHighScore: function(name, death, level, time, won, conduct_data) {
			
      let scores = SU.formatDataFromImport(localStorage["scores"]);
			if (!scores) {
				scores = [];
			}
			scores.push({name: name, death: death, level: level, time: time, won: won, conduct_data: conduct_data});
			scores.sort(function(left, right){
				// Sort by winning then highest level then shortest time.
				if (right.won !== left.won) {
					return left.won;
				}
				if (right.level !== left.level) {
					return right.level - left.level;
				}
				if (right.time !== left.time) {
					return left.time - right.time;
				}
				return left.name < right.name;  // Tiebreaker.
			});
			if (scores.length > 20) {
				scores = scores.slice(0, 20);
			}
      localStorage["scores"] = SU.formatDataForExport(scores);
		},
		DeleteHighScores: function() {
      localStorage["scores"] = [];
		},
    displayBorderNodark: function(title, ctx) {
      SU.rectCorner(ctx, 8, 50, 50, SF.WIDTH - 100, SF.HEIGHT - 150, "rgb(50,50,50)", 'rgb(0,0,0)', 2);

      SU.text(ctx, title, 77, 60, SF.FONT_XLB, '#FFF'); // start under for measure, then do over
      var measure = ctx.measureText(title);
      SU.rectCorner(ctx, 4, 70, 30, measure.width + 20, 40, "rgb(100,100,100)", 'rgb(0,0,0)', 2);
      SU.text(ctx, title, 77, 60, SF.FONT_XLB, '#FFF');
    },
    displayBorder: function(title, ctx) {
      SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, 'rgba(0,0,0,0.7)');
      SU.displayBorderNodark(title, ctx);
    },
    rectCorner: function(ctx, corner, x, y, width, height, fill, stroke, strokeWidth) {
      var r = corner;
      var w = width;
      var h = height;

      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.arc(w - r, r, r, Math.PI * 3 / 2, 0);
      ctx.lineTo(w, h - r);
      ctx.arc(w - r, h - r, r, 0, Math.PI / 2);
      ctx.lineTo(r, h);
      ctx.arc(r, h - r, r, Math.PI / 2, Math.PI);
      ctx.lineTo(0, r);
      ctx.arc(r, r, r, Math.PI, Math.PI * 3 / 2);
      ctx.closePath();
      ctx.restore();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    },
    rectCornerGrad: function(ctx, corner, x, y, width, height, colorStops, stroke, strokeWidth, horizontal) {
      var r = corner;
      var w = width;
      var h = height;

      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.arc(w - r, r, r, Math.PI * 3 / 2, 0);
      ctx.lineTo(w, h - r);
      ctx.arc(w - r, h - r, r, 0, Math.PI / 2);
      ctx.lineTo(r, h);
      ctx.arc(r, h - r, r, Math.PI / 2, Math.PI);
      ctx.lineTo(0, r);
      ctx.arc(r, r, r, Math.PI, Math.PI * 3 / 2);
      ctx.closePath();
      ctx.restore();
			var grd;
			if (horizontal) {
				grd = ctx.createLinearGradient(x, y, x + width, y);
			} else {
	      grd = ctx.createLinearGradient(x, y, x, y + height);
			}
      for (var n = 0; n < colorStops.length; n += 2) {
        grd.addColorStop(colorStops[n], colorStops[n + 1]);
      }
      ctx.fillStyle = grd;
      ctx.fill();

      if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    },
    buildingToCoords: function(dataObj) {
      var parentData = dataObj.parentData;
      var parentIndex = parentData.index;
      var parentType = parentData.type;
      var systemData = parentData.systemData;
      var sx = systemData.x;
      var sy = systemData.y;
      return {bx: dataObj.x, by: dataObj.y, parentIndex: parentIndex, parentType: parentType, sx: sx, sy: sy};
    },
    coordsToBuilding: function(data) {
      // data structure, from above: [bx,by,parentIndex,parentType,sx,sy];
			/*
			var bx = data[0];
			var by = data[1];
      var parentIndex = data[2];
      var parentType = data[3];
      var sx = data[4];
      var sy = data[5];
			*/
      var region = new SBar.RegionData(data.sx, data.sy);
      var targetsys = null;

      for (var obj in region.systems) {
        var systemData = region.systems[obj];
        if (systemData.x === data.sx && systemData.y === data.sy) {
          targetsys = systemData;
					break;
        }
      }
      if (targetsys === null) {
        error("cannot find home");
        return;
      }
      targetsys.generate();
      var target = null;
      if (data.parentType === SF.TYPE_PLANET_DATA) {
        var planet = targetsys.planets[data.parentIndex];
        planet.generate();
        target = planet.GetBuildingAt(data.bx, data.by);
				if (!target) error ("noctbplanet",SU.S(data))
      } else {
        var belt = targetsys.belts[data.parentIndex];
        belt.generate();
        target = belt.GetAsteroidAt(data.bx, data.by).bdata;
				if (!target) error ("noctbbelt",SU.S(data))
      }
      return target;

    },
		// Common pattern for alpha objects within a single sphere.
		GetAlphaPattern: function(/*optional*/seed) {
			if (!seed) seed = S$.background_alpha_seed;
			if (!seed) seed = S$.time;
			return SU.GetFillPattern(Math.floor(SU.r(seed, 52.31)*40)+20, SU.r(seed, 15.21), 50, 50, 50, /*max_brightness=*/50);
		},
		// Draws a common alpha energy signature burst.
		DrawAlphaHalo: function(context, seed, x, y, target_radius) {
			context.save();
			context.translate(x, y);
			let num_lights = Math.floor(SU.r(seed, 9.31)*9)+5;
			for (let i = 0; i < num_lights; i++) {
				context.rotate(SU.r(seed, 9.32+i)*PIx2);
				let rad = SU.r(seed, 9.33+i)*target_radius/2+target_radius/4;
	      let r = Math.floor(SU.r(seed, 12.5+i) * 150)+100;
	      let g = Math.floor(SU.r(seed, 12.6+i) * 150)+100;
	      let b = Math.floor(SU.r(seed, 12.7+i) * 150)+100;
				let color1 = "rgba("+r+","+g+","+b+",0.15)";
				let color2 = "rgba("+r+","+g+","+b+",0)";
				let colorstops = [0, color1, 1, color2];
				SU.circleRad(context, 0, target_radius*0.9, rad, colorstops)
			}
			context.restore();
		},
		// Draws stars.
    draw2DStarsBackground: function() {
      let img = document.createElement('canvas');
      img.width = SF.WIDTH;
      img.height = SF.HEIGHT;
      var context = img.getContext('2d');
      //var context = SC.backLayer;
      context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT); // useful for redrawing
      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");
			if (S$.in_alpha_space) {
				let fullsize = SF.WIDTH*2;
				let halfsize = SF.WIDTH;
				// Inside the sphere.
				let pattern = SU.GetAlphaPattern();
				context.globalAlpha = 0.5;
				context.drawImage(pattern, 0, 0, fullsize, fullsize)
				context.globalAlpha = 1;
				/*
				context.save();
				context.globalCompositeOperation = "destination-in";
				let color_stops = [0, 'rgba(0,0,0,1)', 1, 'rgba(50,50,50,0.0)'];
				if (this.in_bubble) {
					color_stops = [1, 'rgba(255,255,255,1)', 0, 'rgba(255,255,255,0.0)'];
				}
				SU.circleRad(context, SF.WIDTH/2, SF.HEIGHT/2, halfsize, color_stops)
				context.restore();
				*/
				return img;
			}

	    var numstars = 20;
	    var starsize = 20;		
			var stars = [];	
      for (var i = 0; i < numstars; i++) {
          var c = document.createElement('canvas');
          c.width = starsize;
          c.height = starsize
          var starCtx = c.getContext('2d');
          star = starCtx.canvas;
          var r = Math.floor(Math.random() * 55 + 200);
          var g = 200;
          var b = Math.floor(Math.random() * 55 + 200);
          var colorStops = [0, 'rgba(' + r + ',' + g + ',' + b + ',1)', 1, 'rgba(' + r + ',' + g + ',' + b + ',0)'];
          SU.circleRad(starCtx, starsize / 2, starsize / 2, starsize / 2, colorStops);
          stars[i] = star;
      }

      var tempimg = document.createElement('canvas');
      tempimg.width = SF.WIDTH;
      tempimg.height = SF.HEIGHT;
      var tempctx = tempimg.getContext('2d');
//      SU.rect(tempctx, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");

      // add stars
      for (var i = 0; i < 1000; i++) {
				var size = Math.random()*Math.random();
				size *= starsize/4;
        tempctx.drawImage(stars[i % numstars], Math.random() * SF.WIDTH, Math.random() * SF.HEIGHT * 2, size, size);
      }
			// Speed it up with stamps.
      var tempimg2 = document.createElement('canvas');
      tempimg2.width = SF.WIDTH;
      tempimg2.height = SF.HEIGHT;
      var tempctx2 = tempimg2.getContext('2d');
      tempctx2.drawImage(tempimg, 0, 0, SF.WIDTH, SF.HEIGHT);
			for (var i = 0; i < 6; i++) {
				tempctx2.translate(SF.WIDTH/2 + i * 10, SF.HEIGHT/2);  // Some offset to break symmetry.
				tempctx2.rotate(Math.PI/2);
				tempctx2.translate(-SF.WIDTH/2, -SF.HEIGHT/2);
	      tempctx2.drawImage(tempimg, 0, 0, SF.WIDTH/2, SF.HEIGHT/2);
	      tempctx2.drawImage(tempimg, SF.WIDTH/2, 0, SF.WIDTH/2, SF.HEIGHT/2);
	      tempctx2.drawImage(tempimg, 0, SF.HEIGHT/2, SF.WIDTH/2, SF.HEIGHT/2);
	      tempctx2.drawImage(tempimg, SF.WIDTH/2, SF.HEIGHT/2, SF.WIDTH/2, SF.HEIGHT/2);
			}			

      context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT); // useful for redrawing
      SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");
      context.drawImage(tempimg2, 0, 0);
			
			return img;
    },
    // Create an array with a random list of indexes into an array of the same length
    // Useful for walking over an array in a random order
    randomOrder: function(array, seed) {
      var ret = [];
      var length = array.length;
      for (var i = 0; i < length; i++) {
        ret.push(i);
      }
      // now scramble them
      for (var i = 0; i < length; i++) {
        var swap = Math.floor(SU.r(seed, i) * length);
        var temp = ret[i];
        ret[i] = ret[swap];
        ret[swap] = temp;
      }
      return ret;
    },
    text: function(context, text, x, y, font, color, align, stroke, strokeWidth) {
			var origalign = context.textAlign;
			if (align) {
				context.textAlign = align;
			} else {
				context.textAlign = 'left';
			}
			context.font = font;
			context.fillStyle = color;
      if (stroke) {
        context.lineWidth = strokeWidth;
        context.strokeStyle = stroke;
        context.strokeText(text, x, y);
				context.fillText(text, x, y);
      } else {
				context.fillText(text, x, y);
      }
			context.textAlign = origalign;
    },
    wrapText: function(context, text, x, y, maxWidth, lineHeight, font, color, align) {
      context.font = font;
      context.fillStyle = color;
      if (align) {
        context.textAlign = align;
      } else {
        context.textAlign = "left";
      }
      var yoff = 0;

      var lines = text.split('\n');

      for (var row = 0; row < lines.length; row++) {
        var line = '';
        var words = lines[row].split(' ');
        for (var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = context.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y + yoff);
            line = words[n] + ' ';
            yoff += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        context.fillText(line, x, y + yoff);
        yoff += lineHeight;
      }
      return yoff;
    },
    getTargetIcon: function() {
      if (this.targetImg === null || this.targetImg === undefined) {
        var size = 50;
        this.targetImg = document.createElement('canvas');
        this.targetImg.width = size;
        this.targetImg.height = size;
        var ctx = this.targetImg.getContext('2d');
        SU.circle(ctx, size / 2, size / 2, size / 4, "#FFF");
        SU.line(ctx, size / 2, 0, size / 2, size, "#FFF", 4);
        SU.line(ctx, 0, size / 2, size, size / 2, "#FFF", 4);
      }
      return this.targetImg;
    },
    // Deep copies an object. Just the object, not the template.
    Clone: function(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
		// Faster alternative with limitations.
		FastClone: function(obj) {
	    if (null == obj || "object" != typeof obj) return obj;
	    if (obj instanceof Array) {
	        var copy = [];
	        for (var i = 0, len = obj.length; i < len; i++) {
	            copy[i] = SU.FastClone(obj[i]);
	        }
	        return copy;
	    }
	    if (obj instanceof Object) {
	        var copy = {};
	        for (var attr in obj) {
	            if (obj.hasOwnProperty(attr)) copy[attr] = SU.FastClone(obj[attr]);
	        }
	        return copy;
	    }
			error("Bad FastClone: ",Stringify(obj));
		},
		/*
    checkIntersection: function(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
      // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
      var denominator, a, b, numerator1, numerator2;
      denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
      if (denominator === 0) {
        return [false];
      }
      a = line1StartY - line2StartY;
      b = line1StartX - line2StartX;
      numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
      numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
      a = numerator1 / denominator;
      b = numerator2 / denominator;

      if (a > 0 && a < 1 && b > 0 && b < 1) {
        // if we cast these lines infinitely in both directions, they intersect here:
        var x = line1StartX + (a * (line1EndX - line1StartX));
        var y = line1StartY + (a * (line1EndY - line1StartY));
        return [true, x, y];
      } else {
        return [false];
      }
    },
    checkIntersectionInfinite1: function(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
      // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
      var denominator, a, b, numerator1, numerator2;
      denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
      if (denominator === 0) {
        return [false];
      }
      a = line1StartY - line2StartY;
      b = line1StartX - line2StartX;
      numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
      numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
      a = numerator1 / denominator;
      b = numerator2 / denominator;

      // if line2 is a segment and line1 is infinite, they intersect if:
      if (b > 0 && b < 1) {
        // var x = line1StartX + (a * (line1EndX - line1StartX));
        // var y = line1StartY + (a * (line1EndY - line1StartY));
        return true;
      } else {
        return false;
      }
      // if line1 is a segment and line2 is infinite, they intersect if:
      //if (a > 0 && a < 1) {
    },
		*/
		text_line: 0,
		clearTextNoChar: function() {
 			this.rect(SC.rightLayer, 0, 0, SF.TEXT_WIDTH, SF.TEXT_HEIGHT, "#111");
 			SU.text_line = 15;
			SU.odd = false;
			SG.allow_char_key = false;
			let actual_canvas_height = SC.layer2.canvas.height;
			if (SG.allow_options_key) {
				SU.rect(SC.rightLayer, 0, actual_canvas_height-20, SF.TEXT_WIDTH, 20, "#222");
  			SU.wrapText(SC.rightLayer, "O: Options", 10, actual_canvas_height-6,
	  			SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
			}
		},
		clearText: function() {
			SU.clearTextNoChar();
			// All the line.
			SG.allow_char_key = true;
			// Put the text on the true bottom, right pane isn't scaled.
//			SU.wrapText(SC.rightLayer, "C: Crew Details", 10, actual_canvas_height-6,
//							SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
			//SU.addText("C: Crew Details");
			//SU.addText("");
			let actual_canvas_height = SC.layer2.canvas.height;
			SU.rect(SC.rightLayer, 0, actual_canvas_height-60, SF.TEXT_WIDTH, 20, "#222");
			SU.wrapText(SC.rightLayer, "C: Crew Details", 10, actual_canvas_height-46,
				SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
		},
		odd: false,
		addText: function(text) {
			var start = SU.text_line;
      height = 5 + SU.wrapText(SC.rightLayer, text, 10, SU.text_line,
				SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
			if (!SU.odd) SU.rect(SC.rightLayer, 0, start-15, SF.TEXT_WIDTH, height-1, "#222");
			else SU.rect(SC.rightLayer, 0, start-15, SF.TEXT_WIDTH, height-1, "#111");
			SU.wrapText(SC.rightLayer, text, 10, SU.text_line,
							SF.TEXT_WIDTH-20, 18, '10.5pt monospace', '#888');
			SU.text_line = start + height;				
			SU.odd = !SU.odd;
		},
		PushTier: function(new_tier, optional_callback) {
			let images_copy = {};
			stack_images.push(images_copy);
			for (let layer_name in SBar.Canvas) {
				let layer = SBar.Canvas[layer_name];
	      let img = document.createElement('canvas');
	      img.width = layer.canvas.width;
	      img.height = layer.canvas.height;
	      var ctx = img.getContext('2d');
				ctx.drawImage(layer.canvas, 0, 0);
				images_copy[layer_name] = ctx;
//				layer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			}
			
			/*
			var layer = optional_source_layer ? optional_source_layer : SC.layer2;
      var img = document.createElement('canvas');
      img.width = layer.canvas.width; //SF.WIDTH;
      img.height = layer.canvas.height; //SF.HEIGHT;
      var ctx = img.getContext('2d');
			ctx.drawImage(layer.canvas, 0, 0);
			stack_ctx_layer.push(layer)
			stack_ctx_main.push(ctx);

      img = document.createElement('canvas');
      img.width = SC.rightLayer.canvas.width; //SF.TEXT_WIDTH;
      img.height = SC.rightLayer.canvas.height; //SF.TEXT_HEIGHT;
      ctx = img.getContext('2d');
			ctx.drawImage(SC.rightLayer.canvas, 0, 0);
			stack_ctx_text.push(ctx);
			*/

			stack_buttons.push(SB.get());
			stack_tier.push(SG.activeTier);
			stack_callbacks.push(optional_callback); // Can be undefined.
			stack_candochar.push(SG.allow_char_key);
			
      SB.clear();
			SU.clearText();
			new_tier.activate();
		},
		PopTier: function() {
			let images_copy = stack_images.pop();
			if (!images_copy) {
				return;
			}
			
			for (let layer_name in images_copy) {
				let layer = SBar.Canvas[layer_name];
				if (layer) {  // Fade layer may have been removed.
					layer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
					layer.save();
					layer.setTransform(1, 0, 0, 1, 0, 0);
		      layer.drawImage(images_copy[layer_name].canvas, 0, 0);
					layer.restore();
				}
			}
			
			SG.allow_char_key = stack_candochar.pop();
      SB.put(stack_buttons.pop());
      SG.activeTier = stack_tier.pop();
			let callback = stack_callbacks.pop();
			if (callback) {
				callback();
			}
			if (!SG.activeTier) {
				return;
			}
			if (SG.activeTier.CheckForRefresh) {
				SG.activeTier.CheckForRefresh();
			}
			if (SG.activeTier.PopCallback) {
				SG.activeTier.PopCallback();
			}
			// Don't activate the existing tier. Just let it pick up where it left off.
		},		
		// Save off all the important layers, to prepare for a combat stack.
		PushBattleTier: function(new_tier) {
			if (!SG.death_message) {
				error("NOTE: no death message queued.");
			}
			if (this.combat_layers) {
				error("already stored combat_layers")
			}
			this.combat_layers = true;
			this.PushTier(new_tier);
			/*
			this.combat_layers = {}
			for (let layer_name in SBar.Canvas) {
				let layer = SBar.Canvas[layer_name];
	      let img = document.createElement('canvas');
	      img.width = layer.canvas.width;
	      img.height = layer.canvas.height;
	      var ctx = img.getContext('2d');
				ctx.drawImage(layer.canvas, 0, 0);
				this.combat_layers[layer_name] = ctx;
				layer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
			}
			stack_buttons.push(SB.get());
			stack_tier.push(SG.activeTier);
      SB.clear();
			SU.clearText();
			new_tier.activate();
			*/
		},
		PopBattleTier: function() {
			if (!this.combat_layers) {
				error("nocombat pop");
			}
			this.combat_layers = false;
			this.PopTier();
			/*
			for (let layer_name in this.combat_layers) {
				let layer = SBar.Canvas[layer_name];
				if (layer) {  // Fade layer may have been removed.
					layer.save();
					layer.setTransform(1, 0, 0, 1, 0, 0);
		      layer.drawImage(this.combat_layers[layer_name].canvas, 0, 0);
					layer.restore();
				}
			}
      SB.put(stack_buttons.pop());
      SG.activeTier = stack_tier.pop();
			delete this.combat_layers;
			if (SG.activeTier.CheckForRefresh) {
				SG.activeTier.CheckForRefresh();
			}
			if (SG.activeTier.PopCallback) {
				SG.activeTier.PopCallback();
			}
			*/
		},
		// Shows a confirmation window with the provided title, text, keys and callback. 
		ConfirmWindow: function(title, text, callback, icon, is_interrupt/*used internally*/) {
			let new_callback = function(key) {
				let confirmed = key === SF.CONFIRM_KEY_VALUE;
				if (callback) {
					callback(confirmed);
				} else {
					error("nocallback confirmwindow")
				}
			}
			var tier = new SBar.TextDisplay(title, text, [SF.CONFIRM_KEY_DISPLAY+": Confirm", "X: Cancel"], [SF.CONFIRM_KEY_VALUE, SBar.Key.X], new_callback, icon, is_interrupt);
			SU.PushTier(tier);
		},
		// Just shows some text. X or 1 exits.
		ShowWindow: function(title, text, callback, icon, is_interrupt/*used internally*/) {
			let tier = new SBar.TextDisplay(title, text, [SF.CONFIRM_KEY_DISPLAY+": Continue"], [SF.CONFIRM_KEY_VALUE, SBar.Key.X], callback, icon, is_interrupt);
			SU.PushTier(tier);
		},
		// Different background for these interrupting (negative) windows.
		ConfirmWindowInterrupt: function(title, text, callback, icon) {
			SU.ConfirmWindow(title, text, callback, icon, true);
		},
	  ShowWindowInterrupt: function(title, text, callback, icon) {
			SU.ShowWindow(title, text, callback, icon, true);
		},
		// Returns the time hours in a common displayable time format.
		TimeString: function(time) {
			return SF.SYMBOL_TIME+" "+Math.floor(time/24)+":"+Math.floor(time%24);
		},
		// For refractors. Presumes y is above, in the farx/fary. So y1,y2 should be roughly the same.
		DrawAlphaTriangle: function(context, seed, farx, fary, x1, y1, x2, y2) {
			// It should be a transparent cone. Approximate with triangles.
			let temp;
			if (x1 > x2) {
				temp = x2;
				x2 = x1;
				x1 = temp;
				temp = y2;
				y2 = y1;
				y1 = temp;
			}
			let xspread = x2 - x1;
			
			//SU.triangle(this.starctx, starxy[0], starxy[1], SF.HALF_WIDTH-this.data.radius*3, SF.HALF_HEIGHT, SF.HALF_WIDTH+this.data.radius*3, SF.HALF_HEIGHT, 'rgba(255, 255, 255, 0.25)')
			for (let i = 0; i < Math.floor(SU.r(seed, 8.14)*20)+20; i++) {
				let s1 = SU.r(seed, 8.15+i)*xspread;
				let s2 = SU.r(seed, 8.16+i)*xspread;
				if (s1 > s2) {
					temp = s2;
					s2 = s1;
					s1 = temp;
				}
				//if (SU.r(seed, 8.19+i) < 0.5) {
					//SU.triangle(context, farx, fary, x1+s1, y1, x1+s2, y2, "rgba(0,0,0,0.1)");
					//} else {
					SU.triangle(context, farx, fary, x1+s1, y1, x1+s2, y2, "rgba(255,255,255,0.1)");
					//}
			}
		},
		// Alpha lines surrounding the viewer.
		DrawAlphaCone: function(context, seed, starx, stary) {
			SU.rect(context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(255,255,255,0.1)")
			context.save();
			context.translate(starx, stary);
			for (let i = 0; i < Math.floor(SU.r(seed, 8.14)*30)+30; i++) {
				context.rotate(PIx2*SU.r(seed, 8.17+i));
				if (SU.r(seed, 8.19+i) < 0.3) {
					SU.triangle(context, 0, 0, SF.WIDTH, 0, SF.WIDTH, SU.r(seed, 8.18+i)*1000+50, "rgba(0,0,0,0.1)");
				} else {
					SU.triangle(context, 0, 0, SF.WIDTH, 0, SF.WIDTH, SU.r(seed, 8.18+i)*1000+50, "rgba(255,255,255,0.1)");
				}
			}
			context.restore();
		},
		
		DrawAlphaStar: function(orig_context, systemdata, distance_out, viewer_x, /*optional past here*/ starx, stary, radius) {
			//context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      let tempi = document.createElement('canvas');
      tempi.width = SF.WIDTH;
      tempi.height = SF.HEIGHT;
      let context = tempi.getContext('2d');
			
			if (!starx) {
	      starx = SF.HALF_WIDTH + (SF.HALF_WIDTH * (systemdata.x - viewer_x) / systemdata.radius);
	      stary = SF.HALF_HEIGHT - (SF.HALF_HEIGHT * distance_out / systemdata.radius);
	      radius = 15 * systemdata.radius * systemdata.main_radius / distance_out;
			}

      context.save();
      context.translate(starx, stary);

			let pattern = SU.GetAlphaPattern();
			let fullsize = radius*2.7;
			let halfsize = fullsize/2;
			context.drawImage(pattern, -halfsize, -halfsize, fullsize, fullsize)
			context.save();
			context.globalCompositeOperation = "destination-in";
			let color_stops = [0, 'rgba(0,0,0,1)', 1, 'rgba(50,50,50,0.0)'];
			SU.circleRad(context, 0, 0, halfsize, color_stops)
			context.globalCompositeOperation = "destination-over";  // Behind
			SU.circle(context, 0, 0, halfsize, "#000");
			// White halo.
			//color_stops = [0, 'rgba(255,255,255,1)', 1, 'rgba(255,255,255,0)'];
			//SU.circleRad(context, 0, 0, halfsize*1.5, color_stops)
			context.restore();				
			SU.DrawAlphaHalo(context, systemdata.seed, 0, 0, fullsize*0.9);
			
      context.restore();
			orig_context.drawImage(tempi, 0, 0);
			return [starx, stary];
			
		},
		/*
		// Common utility function for drawing the system star.
		DrawStar: function(context, systemdata, distance_out, viewer_x) {
			if (systemdata.alpha_core || systemdata.in_alpha_bubble) {
				return this.DrawAlphaStar(context, systemdata, distance_out, viewer_x);
			}
      if (systemdata.isDead() || systemdata.in_alpha_bubble) {
				return;
			}
			context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      var starx = SF.HALF_WIDTH + (SF.HALF_WIDTH * (systemdata.x - viewer_x) / systemdata.radius);
      var stary = SF.HALF_HEIGHT - (SF.HALF_HEIGHT * distance_out / systemdata.radius);
      var starrad = 15 * systemdata.radius * systemdata.main_radius / distance_out;
      var coronapoint = 0.3;
      var flarerad = starrad * 2;
      var rotation = SU.r(systemdata.seed, 101) * Math.PI * 2;

      var starpoints = Math.floor(SU.r(systemdata.seed, 102) * 7 + 4);

      context.save();
      context.translate(starx, stary);
      context.rotate(SU.r(systemdata.seed, 103) * Math.PI * 2);
      var colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr + ',1)', coronapoint, 'rgba(' + systemdata.colorstr + ',0.20)', 1, 'rgba(' + systemdata.colorstr + ',0.0)'];
      SU.star(context, 0, 0, starpoints, starrad * coronapoint / 2, starrad, colorStops);
      context.restore();

      context.save();
      context.translate(starx, stary);
      context.rotate(rotation);
      colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr + ',1)', coronapoint, 'rgba(' + systemdata.colorstr + ',0.20)', 1, 'rgba(' + systemdata.colorstr + ',0.0)'];
      SU.star(context, 0, 0, starpoints, starrad * coronapoint / 2, flarerad, colorStops);
      context.restore();

      colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr + ',0.5)', 1, 'rgba(' + systemdata.colorstr + ',0.0)'];
      SU.circleRad(context, starx, stary, starrad * 2, colorStops);
			// Binary. Mostly repeat of above.
			if (!systemdata.is_binary) {
				return;
			}
      var starx = SF.HALF_WIDTH + (SF.HALF_WIDTH * (systemdata.x + systemdata.binaryx/distance_out - viewer_x) / systemdata.radius);
      var stary = SF.HALF_HEIGHT - (SF.HALF_HEIGHT * (1-systemdata.binaryy/distance_out/distance_out) * distance_out / systemdata.radius);
      var starrad = 15 * systemdata.radius * systemdata.binary_radius / distance_out;
      var coronapoint = 0.3;
      var flarerad = starrad * 2;
      var rotation = SU.r(systemdata.seed, 104) * Math.PI * 2;

      var starpoints = Math.floor(SU.r(systemdata.seed, 105) * 7 + 4);

      context.save();
      context.translate(starx, stary);
      context.rotate(SU.r(systemdata.seed, 106) * Math.PI * 2);
      var colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr2 + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr2 + ',1)', coronapoint, 'rgba(' + systemdata.colorstr2 + ',0.20)', 1, 'rgba(' + systemdata.colorstr2 + ',0.0)'];
      SU.star(context, 0, 0, starpoints, starrad * coronapoint / 2, starrad, colorStops);
      context.restore();

      context.save();
      context.translate(starx, stary);
      context.rotate(rotation);
      colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr2 + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr2 + ',1)', coronapoint, 'rgba(' + systemdata.colorstr2 + ',0.20)', 1, 'rgba(' + systemdata.colorstr2 + ',0.0)'];
      SU.star(context, 0, 0, starpoints, starrad * coronapoint / 2, flarerad, colorStops);
      context.restore();

      colorStops = [0, 'rgb(' + systemdata.colorstrwhite + ')', coronapoint / 2, 'rgb(' + systemdata.colorstr2 + ')', coronapoint / 2, 'rgba(' + systemdata.colorstr2 + ',0.5)', 1, 'rgba(' + systemdata.colorstr2 + ',0.0)'];
      SU.circleRad(context, starx, stary, starrad * 2, colorStops);			
			
		},
		*/
		// Artifact and hero character fill pattern.
		GetFillPattern: function(size, seed, r, g, b, /*optional*/max_brightness) {
			if (!max_brightness) {
				max_brightness = 150;
			}
      var stampi = document.createElement('canvas');
      stampi.width = size;
      stampi.height = size;
      var stampc = stampi.getContext('2d');
      SU.rect(stampc, 0, 0, size, size, 'rgb(' + r + ',' + g + ',' + b + ')');
      var times = Math.floor(SU.r(seed, 12.1) * 9) + 5;
      for (var i = 0; i < times; i++) {
        var option = Math.floor(SU.r(seed, 12.2 + i) * 3);
        switch (option) {
          case 0:
            SU.circle(stampc, SU.r(seed, 17.2 + i) * size, SU.r(seed, 17.3 + i) * size, SU.r(seed, 17.4 + i) * size/2, 'rgb(' + r + ',' + g + ',' + b + ')');
            break;
          case 1:
            SU.line(stampc, SU.r(seed, 18.2 + i) * size, SU.r(seed, 18.3 + i) * size, SU.r(seed, 18.4 + i) * size, SU.r(seed, 18.5 + i) * size, 'rgb(' + r + ',' + g + ',' + b + ')', SU.r(seed, 18.4 + i) * 5);
            break;
          case 2:
            SU.regularPolygon(stampc, SU.r(seed, 18.2 + i) * size/2, SU.r(seed, 18.3 + i) * size/2, Math.floor(SU.r(seed, 18.4 + i) * 9) + 3, SU.r(seed, 18.5 + i) * 10, 'rgb(' + r + ',' + g + ',' + b + ')', null, 0);
            break;
        }
        r += Math.floor(SU.r(seed, 9.5 + i) * max_brightness) - max_brightness/2;
        g += Math.floor(SU.r(seed, 9.6 + i) * max_brightness) - max_brightness/2;
        b += Math.floor(SU.r(seed, 9.7 + i) * max_brightness) - max_brightness/2;
				r = fixColor(r);
				g = fixColor(g);
				b = fixColor(b);
      }
			// Overlay the image on itself, for varity.
			stampc.translate(size/2, size/2);
			stampc.rotate(Math.PI/2);
			stampc.globalAlpha = 0.75;
			stampc.drawImage(stampi, -size/3, -size/3, size, size);
			stampc.rotate(Math.PI/2);
			stampc.globalAlpha = 0.5;
			stampc.drawImage(stampi, -size/4, -size/4, size, size);
			stampc.rotate(Math.PI/2);
			stampc.globalAlpha = 0.25;
			stampc.drawImage(stampi, -size/5, -size/6, size, size);
			
			stampc.globalAlpha = 0.35;
			stampc.drawImage(stampi, -size/2, -size/2, size/2, size/2);
			stampc.drawImage(stampi, 0, -size/2, size/2, size/2);
			stampc.drawImage(stampi, -size/2, 0, size/2, size/2);
			stampc.drawImage(stampi, 0, 0, size/2, size/2);
			
      return stampi;
		},
		
		// Switch the browser to fullscreen.
		GoFullscreen() {
			//let container = document.getElementById("container");
			let container = document.getElementsByTagName("BODY")[0];
			if (container.requestFullScreen) {
				container.requestFullScreen();
			} else if (container.webkitRequestFullScreen) {
				container.webkitRequestFullScreen();
			} else if (container.mozRequestFullScreen) {
				container.mozRequestFullScreen();
			}
		},
		
	  // Switch back to base canvas to prepare for a resize. Update layers.
		ResetScreenResize: function() {
			// Opposite of above. Could make these into utilities.
			let old_width = SC.layer2.canvas.width; //window.outerWidth - SF.TEXT_WIDTH;
			let old_height = SC.layer2.canvas.height; //window.outerHeight;
			let new_width = SF.WIDTH;
			let new_height = SF.HEIGHT;
			
			let container = document.getElementById('container');
			container.style.width = new_width+SF.TEXT_WIDTH+"px";
			container.style.height = SF.HEIGHT+"px";
			container.style.border = "0px";
			
			SG.scalex = 1;
			SG.scaley = 1;
			
			// TODO: put this in the same loop below? Build an array first? Or just combine them?
			for (let context_key in S3) {
				S3[context_key].width = new_width;
				S3[context_key].height = new_height;
			}
			
			for (let context_key in SC) {
				let orig_canvas = SC[context_key].canvas;
				if (context_key == "rightLayer") {
					let bottom_amount_to_keep = 150;
					let temp_canvas = document.createElement('canvas');
					temp_canvas.width = SF.TEXT_WIDTH;
					temp_canvas.height = new_height;
		      let temp_context = temp_canvas.getContext('2d');
					SU.rect(temp_context, 0, 0, SF.TEXT_WIDTH, new_height, "#111");					
					temp_context.drawImage(orig_canvas, 0, 0);
					// Put the crew hotkey on the bottom.
					temp_context.drawImage(orig_canvas, 0, old_height-bottom_amount_to_keep, SF.TEXT_WIDTH, bottom_amount_to_keep, 0, new_height-bottom_amount_to_keep, SF.TEXT_WIDTH, bottom_amount_to_keep);
					
					orig_canvas.height = new_height;
					let context = orig_canvas.getContext('2d');
					context.drawImage(temp_canvas, 0, 0);
//		      orig_canvas.setAttribute('style', 'position:absolute;left:'+new_width+'px;top:0px;align: center;display: inline-block;width: '+orig_canvas.width+'px;height: '+orig_canvas.height+'px;');
				} else {
					let temp_canvas = document.createElement('canvas');
					temp_canvas.width = new_width;
					temp_canvas.height = new_height;
		      let temp_context = temp_canvas.getContext('2d');
					// Undo the scaling of the prior.
					temp_context.save();
					temp_context.scale(new_width/old_width, new_height/old_height);
					temp_context.drawImage(orig_canvas, 0, 0);
					temp_context.restore();
					
					orig_canvas.width = new_width;
					orig_canvas.height = new_height;
					let context = orig_canvas.getContext('2d');
					context.drawImage(temp_canvas, 0, 0);
					context.scale(SG.scalex, SG.scaley);
//	        orig_canvas.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block;width: '+orig_canvas.width+'px;height: '+orig_canvas.height+'px;');
				}
			}			
			
			SF.TEXT_HEIGHT = new_height;			
		},		
			
	  // Browser switched sizes or went to fullscreen. Update layers for the new size.
		HandleScreenResize: function() {
			let old_width = SF.WIDTH;
			let old_height = SF.HEIGHT;
			let new_width = window.innerWidth - SF.TEXT_WIDTH;
			let text_width = SF.TEXT_WIDTH;
			let show_text = true;
			if (localStorage[SF.LOCALSTORAGE_HIDE_HOTKEYS]) {
				show_text = false;
				text_width = 0;
				new_width = window.innerWidth;
				//SC["rightLayer"].globalAlpha = 0;  // Transparent to simulate hidden.
			} else {
				//SC["rightLayer"].globalAlpha = 1;
			}
			let new_height = window.innerHeight;
			
			let container = document.getElementById('container');
			container.style.width = window.innerWidth+"px";
			container.style.height = window.innerHeight+"px";
			container.style.left = "0px";
			container.style.top = "0px";
			container.style.border = "0px";

			// Maintain a 1000/800 aspect ratio on the main window.
			// Pad the left and right or top and bottom as needed.
			if (localStorage[SF.LOCALSTORAGE_LOCK_RATIO]) {
		    //document.getElementById('container').style = "left:"+left_pad+"px";
//				element.
		    //SF.MARGIN_LEFT = left_pad;
		    //SF.MARGIN_TOP = top_pad;
				
//			left_pad = 100
//			top_pad = 100;
//			document.getElementById('container').setAttribute("style", "left:"+left_pad+"px")
			//document.getElementById('container').setAttribute("style", "left:100px")
			//document.getElementById('container').style.left = "100px";
			
				let target_ratio = SF.WIDTH / SF.HEIGHT;
				let current_ratio = (window.innerWidth-text_width)/window.innerHeight;
				if (target_ratio <= current_ratio) {
					// Horizontal padding.
					new_width = Math.round(window.innerHeight * target_ratio)+text_width;
					container.style.width = new_width+"px";
					container.style.left = Math.round((window.innerWidth - new_width) / 2)+"px";
					new_width -= text_width;
				} else {
					// Vertical padding.
					new_height = Math.round((window.innerWidth-text_width)/target_ratio);
					container.style.height = new_height+"px";
					container.style.top = Math.round((window.innerHeight - new_height) / 2)+"px";
				}
			}
			SG.scalex = new_width/old_width;
			SG.scaley = new_height/old_height;


//			window.innerWidth

//SF.WIDTH
//width: 100%;
//height: 100%;
// Don't forget to reset the mouse
// Move windowResize to a utility and condense.
			
for (let context_key in S3) {
	S3[context_key].width = new_width;
	S3[context_key].height = new_height;
}

			// Resize the canvases, preserving the original data.
			for (let context_key in SC) {
				let orig_canvas = SC[context_key].canvas;
				if (context_key == "rightLayer") {
					let bottom_amount_to_keep = 150;
					let temp_canvas = document.createElement('canvas');
					temp_canvas.width = SF.TEXT_WIDTH;
					temp_canvas.height = new_height;
		      let temp_context = temp_canvas.getContext('2d');
					SU.rect(temp_context, 0, 0, SF.TEXT_WIDTH, new_height, "#111");				
					// Put the crew hotkey on the bottom.
					temp_context.drawImage(orig_canvas, 0, 0, SF.TEXT_WIDTH, SF.HEIGHT-bottom_amount_to_keep, 0, 0, SF.TEXT_WIDTH, SF.HEIGHT-bottom_amount_to_keep);
					temp_context.drawImage(orig_canvas, 0, SF.HEIGHT-bottom_amount_to_keep, SF.TEXT_WIDTH, bottom_amount_to_keep, 0, new_height-bottom_amount_to_keep, SF.TEXT_WIDTH, bottom_amount_to_keep);
					
					orig_canvas.height = new_height;
					let context = orig_canvas.getContext('2d');
					context.drawImage(temp_canvas, 0, 0);
		      orig_canvas.setAttribute('style', 'position:absolute;left:'+new_width+'px;top:0px;align: center;display: inline-block;width: '+orig_canvas.width+'px;height: '+orig_canvas.height+'px;');
					orig_canvas.style.visibility=show_text ? "visible" : "hidden";
					if (!show_text) {
						orig_canvas.style.left = new_width-SF.TEXT_WIDTH;
					}
				} else {
					let temp_canvas = document.createElement('canvas');
					temp_canvas.width = new_width;
					temp_canvas.height = new_height;
		      let temp_context = temp_canvas.getContext('2d');
					temp_context.scale(SG.scalex, SG.scaley);
					temp_context.drawImage(orig_canvas, 0, 0);
					
					orig_canvas.width = new_width;
					orig_canvas.height = new_height;
					let context = orig_canvas.getContext('2d');
					context.drawImage(temp_canvas, 0, 0);
					context.scale(SG.scalex, SG.scaley);
	        orig_canvas.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block;width: '+orig_canvas.width+'px;height: '+orig_canvas.height+'px;');
				}
			}
			
			// Leave SF.HEIGHT, WIDTH, etc to the original. These will draw scaled.
			SF.TEXT_HEIGHT = new_height;
			
	    let element = document.getElementById('container');
	    let position = element.getBoundingClientRect();
	    SF.MARGIN_LEFT = position.left;
	    SF.MARGIN_TOP = position.top;			
			
			if (SG.helm) {
				SG.helm = new SBar.Helm();
			}
			
		},

		// 2D rotate around a point.
		RotateAround: function(x, y, angle) {
			let newx = x * Math.cos(angle) - y * Math.sin(angle);
			let newy = x * Math.sin(angle) + y * Math.cos(angle);
			return [newx, newy];
		},
		
		// Shows a damage window, with possible death chance.
		DamageInterrupt(title, description, damage_percent, fail_pre_callback) {
			description += "\n\n";
			for (var i = 0; i < S$.crew.length; i++) {
				var hero = S$.crew[i];
				let prior = hero.health;
				hero.health -= hero.max_health*damage_percent;
				hero.health = Math.floor(hero.health);
				if (i !== 0) {
					// Let the main player die here, but others would get brought back up.
					hero.health = Math.max(1, hero.health);
				}
				description += hero.name+": "+hero.health+"/"+hero.max_health+SF.SYMBOL_HEALTH+" ("+Math.round(hero.health-prior)+")"+"\n";
			}
			if (fail_pre_callback) {
				fail_pre_callback();
			}
			if (S$.crew[0].health <= 0) {
				new SBar.HandleLossRenderer().SetTitleDescription(
					title,
					description+"\nIn the moment you reflect upon the splendor of it all, but only briefly..."
				).activate();
			} else {
				SU.ShowWindowInterrupt(title, description);
			}
			return true;
		},
		// Special case: if the player is in battle, copy up the health of the battle heroes for display.
		CopyCrewBattleStats: function(add_health, /*optional*/encounter_data) {
			if (!SG.in_battle) {
				// Only copy up if in the battle.
				return;
			}
			if (!encounter_data) {
				encounter_data = TG.data;
			}
			if (!encounter_data) {
				error("noccbs edata")
			}
			for (let obj in encounter_data.heroes) {
				let hero = encounter_data.heroes[obj];
				if (add_health) {
					if (hero.health <= 0) {
						hero.health = 1;
					} else if (hero.health > hero.max_health) {
	  				hero.health = hero.max_health;
  				}
				}
				if (hero.current_crew) {
					hero.current_crew.health = hero.health;
					hero.current_crew.morale = hero.morale;
				}
			}
		},
		
		DrawCrewBackground: function(context, seed) {
			let size = 15;
      let r = Math.floor(SU.r(seed, 12.5) * 100);
      let g = Math.floor(SU.r(seed, 12.6) * 100);
      let b = Math.floor(SU.r(seed, 12.7) * 100);
			let fill_pattern = SU.GetFillPattern(size, seed, r, g, b);
      context.drawImage(fill_pattern, 0, 0, size, size, 0, 0, SF.WIDTH, SF.HEIGHT);
			let colorStops2 = [0, 'rgba(0,0,0,0)', 0.3, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,1)'];
			SU.circleRad(context, SF.HALF_WIDTH, SF.HALF_HEIGHT, SF.HALF_WIDTH*1.4, colorStops2);
		},
		
		// Backpack also.
		DrawBags: function(context, do_backpack, sell_instead) {
			context.save();
			context.translate(SF.HALF_WIDTH, SF.HALF_HEIGHT);
			// Backpack.
			if (do_backpack) {
	      SU.rectCorner(context, 16, -460, -40, 300, 200, '#CB9', 'rgb(0,0,0)', 4);
	      //SU.rectCorner(context, 16, -460, -40, 300, 200, '#CB9');
	      //SU.rect(context, -460, -40, 300, 200, '#CB9');
	      SU.rect(context, -460, -40, 300, 200, 'rgba(200,150,70,0.5)');
			}
			// Trash.
      SU.rectCorner(context, 16, -460, 200, 200, 160, '#444', 'rgb(0,0,0)', 4);
			SU.rect(context, -460, 200, 200, 160, 'rgba(70,20,0,0.5)');
			context.globalAlpha = 0.5;
			let trash_icon = "🗑";
			if (sell_instead) {
				trash_icon = SF.SYMBOL_CREDITS;
			}
      SU.text(context, trash_icon, -360, SF.HALF_HEIGHT-63, 'bold 100pt '+SF.FONT, '#FFF', 'center');
			if (do_backpack) {
	      SU.text(context, "🎒", -300, SF.HALF_HEIGHT-285, 'bold 120pt '+SF.FONT, '#FFF', 'center');
			}
			context.globalAlpha = 1;
			context.restore();
		},		
		// Returns a letter representing the alpha.
		AlphaLetter: function(level) {
		  let letter = String.fromCharCode('A'.charCodeAt() + (level-1));
			if (level > 26) {
				letter = "Ω";
			}
			return letter;
		},
		// "The Legend of Sam and the Ridiculously Bland Spaceship"".
		CharTitleString: function() {
			return "The "+ST.charTitle(1.23, S$.crew[0].base_level)+" "+S$.player_name+" and the "+S$.ship.name;
		},

		DrawTopBanner: function(context, text, symbol) {
			SU.rect(context ,50, 17, SF.WIDTH-100, 40, 'rgba(255,255,255,0.5)', "#AAA", 2);
	
			SU.rect(context, 45, 12, 10, 10, "#444");
			SU.rect(context, 45, 52, 10, 10, "#444");
			SU.rect(context, SF.WIDTH-55, 12, 10, 10, "#444");
			SU.rect(context, SF.WIDTH-55, 52, 10, 10, "#444");
	
      SU.text(context, text, SF.HALF_WIDTH, 47, SF.FONT_XLB, '#000', 'center');
			if (symbol) {
	      SU.text(context, symbol, 80, 47, SF.FONT_XLB, '#000', 'center');
	      SU.text(context, symbol, SF.WIDTH-80, 47, SF.FONT_XLB, '#000', 'center');
			}
		},
		
		// In full screen mode.
		IsFullscreen: function() {
	    return document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
		},
		// Draws lines around the grid of the image portions that are present. Like in alien + ship artifact views.
		// Draw context already has something drawn on it (like a ship or image).
		// image_size is used to indicate how far left/right to draw.
		AddTileBorders: function(draw_context, image_size, tilesize, valid_points) {
      let temp_image = document.createElement('canvas');
      temp_image.width = SF.WIDTH;
      temp_image.height = SF.HEIGHT;
			let temp_context = temp_image.getContext('2d');
			
			let img_data = draw_context.getImageData(0, 0, SF.WIDTH, SF.HEIGHT).data;
			let half_x = Math.floor(image_size/tilesize/2*1.2);
//			if (this.seed === 0) {
				// Human player, go far left for backpack and trash.
//				var half_x = Math.floor(SF.WIDTH/tilesize/2);
//			}
			var half_y = Math.floor(image_size/tilesize/2);
			
			// Draw borders. To allow for a gradient, stamp the area then fill it in.
			for (var x = -half_x; x < half_x; x++) {
				for (var y = -half_y; y < half_y; y++) {
					var rawx = SF.HALF_WIDTH + x*tilesize;
					var rawy = SF.HALF_HEIGHT + y*tilesize;
					var point = rawx + tilesize/2+(rawy + tilesize/2)*SF.WIDTH;
					if (img_data[point*4+3] !== 0 || img_data[point*4-1] !== 0) {  // Anything drawn here. And check symmetry.
						//SU.rect(temp_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");
						//temp_context.clearRect(rawx, rawy, tilesize, tilesize);
//						SU.rect(temp_context, rawx-4, rawy-4, tilesize+8, tilesize+8, "#000");
						if (!this.IsTileBorder(x, y)) {
							SU.rect(temp_context, rawx-1, rawy-1, tilesize+2, tilesize+2, "#FFF");
//						SU.circle(temp_context, rawx, rawy, 1, "rgba(255,255,255,0.75)");
							valid_points[x+','+y] = true;
						}
					}
				}
			}
			
			temp_context.save();
			temp_context.globalCompositeOperation = "source-in";
			SU.rect(temp_context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(255,255,255,0.5)");
			temp_context.restore();
			
//			SU.rect(temp_context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(0,0,0,0.25)");
			
			
			// Clear centers.
			for (var x = -half_x; x < half_x; x++) {
				for (var y = -half_y; y < half_y; y++) {
					var rawx = SF.HALF_WIDTH + x*tilesize;
					var rawy = SF.HALF_HEIGHT + y*tilesize;
					var point = rawx + tilesize/2+(rawy + tilesize/2)*SF.WIDTH;
					if (img_data[point*4+3] !== 0 || img_data[point*4-1] !== 0) {  // Anything drawn here. And check symmetry.
						//SU.rect(temp_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");
						if (!this.IsTileBorder(x, y)) {
							temp_context.clearRect(rawx, rawy, tilesize, tilesize);
						}
//						SU.circle(temp_context, rawx, rawy, 1, "rgba(255,255,255,0.75)");
					}
				}
			}
			draw_context.drawImage(temp_image, 0, 0);			
			
		},
		// Returns true if the tile borders the trash.
		// Based on IsInTrash in 7complexR (x <= -14 && y >= 10).
		// Also handles edges of the screen.
		IsTileBorder: function(x, y) {
			return y === 9 && x <= -13 || x === -13 && y >= 9 || x < -23 && y >= 9 || y > 17 && x <= -13
			   || y > 18 || y < -19;
		},
		
		MaybeShowChapter: function(chapter_num) {
			if (S$.current_chapter >= chapter_num) {
				return false;
			}
			S$.current_chapter = chapter_num;
			
			let gender = Math.floor(SU.r(12.23, 42.32)*3);
			let plural1 = "s";
			let plural2="s";
			let plural3="was";
			if (gender == 2) {
				// "they look" vs. "she looks".
				plural1 = "";
				plural2 = "re";
				plural3 = "were";
			}
			let title = "";
			let description = "";
			if (chapter_num === 1) {
				title = "Chapter 1: The Truth is Out There (and it Ran Away)";
				let letter = SU.AlphaLetter(Math.floor(SU.r(1,2)*20));
				description = ""//"Groggily you peel your head off the polished bar. That must have been one hell of a night. A strange blob stares at your ear, poking the person beside you."
+"\"Naghh...\" the sound of your voice wakes your friend. "+ST.genup[gender]+" peel"+plural1+" "+ST.pos[gender]+" face off the polished bar. Except it's not your friend. "+ST.genup[gender]+" look"+plural1+" different somehow, and with the large letter "+letter+" embroidered on "+ST.pos[gender]+" hat."
+" "+ST.genup[gender]+" look"+plural1+" you in the eye and suddenly jump"+plural1+" upright. \"Wha... is it really you? I can't believe...\""
+"\n\n"+ST.posup[gender]+" eyes grow wider as "+ST.gen[gender]+" poke"+plural1+" your arm. \"Wait, no... you don't remember, do you? No, how could... wait a second. I rescued you. I saved you. "+ST.genup[gender]+" would have killed you. Don't you get it? "+ST.genup[gender]+" "+plural3+" going to KILL you!"
+" Oh, hell, no. Now "+ST.gen[gender]+"'"+plural2+" going to kill ME. We're not safe here. Don't you see?? You need to run. Run now. Run! Take the ship. Take the money, I don't care. Run! Don't look back! And whatever you do, get away from me!\""
+"\n\nAll within that moment "+ST.gen[gender]+" bolt"+plural1+" out the door, leaving you at the bar. With a strange creature staring at your ear... licking its lips."
/*							
				let contraband_name = new SBar.Skill(SBar.CargoArtifactData(SU.r(this.seed, 14.14), this.data.raceseed, this.data.level, SF.CARGO_CONTRABAND)).name.toLowerCase();
			SU.ShowWindow("", "\"Look everyone, it's not dead!\" the alien in front of you pushes your arm with a mug. Nevermind that it speaks perfect English, its "+
		    "shape is comically grotesque and seems to be grinning wildy. Matched by a dozen similar shapes scattered about the room, each staring at "+
		    "your ears with the same eerie, simple smile. In fact, the whole room reminds you of any of the run-down bars in your hometown. Minus the smiles. \"Where am I?\", is "+
			  "all you can manage. The shape stops staring at your ear long enough to quiver,\n\n"+
		    "\""+this.data.name[0]+" "+this.data.name[1]+" and look I'm not your momma. I don't know where you came from. I don't have your keys. "+
		    "I can't pronounce your name and I'm not cooking you flapjacks. If I had a "+SF.SYMBOL_CREDITS+" for each alien that stumbled in blind drunk "+
		    "I'd be able to buy a "+contraband_name+". Look kid, it's not that I'm insensitive, but I have a reputation "+
			  "to protect. I can't be seen getting friendly with your type. Take my advice and stick to your own star system.\"");
	      //this._initBuildingTrade(this.data);
				//return;
				*/			
			} else if (chapter_num === 2) {
				//title = "Chapter 2: The Party Proliferations";
				title = "Chapter 2: The Party Must Go On";
				description = ""
+"You approach the huge pyramid. Bright beams of colorful light extend from its pinnacle, like searchlights dancing across the sky. "
+"Several humanoids mill about the entrance. No, not humanoids. They're actual humans!"
+"\n\nYou walk closer and abruptly stop. They each look exactly like your friend, clothes and all. But even at a distance you "
+"know they are not your friend. Plus they each have a large embroidered letter on their hat."
+"\n\n\"Hey!\" the nearest calls, waving "+ST.pos[gender]+" beer bottle in your direction. \"Hey I think I know you!\" "
+"\n\n\"Oh wow, it is you!\" another calls. \"Oh wait. Aren't we supposed to kill you? But no, shhh... we never saw you. You were never here... for the party must go on!\"";
			} else if (chapter_num === 3) {
				title = "Chapter 3: Hit the Wall";
				description = ""
+"Your ship approaches a great wall in space. \"Nonsense!\" you think to yourself. How could there be a wall in space? "
+"And yet there it is, a solid colorful barrier many parsecs in length blocking your path. On its surface transient colors appear and swirl like "
+"soap on moving water."
+"\n\nYou check your ship's sensors. Nothing. No mass. No gravity. No reflection. No albedo. "
+"Your sensors show absolutely no indication of the wall before you, but there it is, as plain as your stupidity."
+"\n\nYou slow your ship and keep a reasonable distance. There is something oddly familiar about the entire situation. "
+"Those shifting colors, the nonsense of it all... where had you seen it before?";
			} else if (chapter_num === 4) {
				title = "Chapter 4: For the Last Time, for the First Time";  // Spaceballs reference.
				//params["description"] = "\"Oh hey, you're back. Are you ready to die yet? Well I guess you wouldn't remember... but we both agreed, and you're still wearing that silly hat. Look, I'm not happy about it, either. So let's just get this over with.\"";				
				description = ""
+"Among the spotlights and disco balls and the lighted floor tiles your friend stands in the center of a huge dance hall. Sort of. "
+"Twenty times taller and glowing various colors, "+ST.gen[gender]+" look"+plural1+" more like something that ate your friend."
+"\n\n\"Oh hey, you're back,\" "+ST.gen[gender]+" start"+plural1+" calmly, \"Are you ready to die yet? Oh stop looking so surprised. We both agreed. "
+"Well I guess you wouldn't remember... and it's not your fault I suppose. But here you are. Still here. Still wearing that silly hat. "
+"It goes against the natural order, you know. And now everything's all funked up. It's been a real annoyance, you know. Almost ruined the party.\""
+"\n\n\"So, yeah, time to die. Look, I'm not happy about this either. We dismantled half the galaxy getting you here. So let's just get this over with. "
+"I'm not saying that everything is going to go back to normal. Well, maybe for me it is. You'll be dead, of course. I wish things could have been different, "
+"but here we are, and we can't change the past...\""
			}
			SU.ShowWindow(title, description);
			return true;
		},
		
		// Returns the name of the first WMD fragment held by the crew. Or empty if none.
		WmdFragmentName: function() {
			for (let crew of S$.crew) {
				for (let arti of crew.artifacts) {
					let skill = new SBar.Skill(arti);
					for (let effect of skill.ability.effects) {
						if (effect.omega_fragment_effect) {
							return skill.name;
						}
					}
				}
			}
		},
		// Builds a pattern to show for a race, similar to a simple flag graphic.
		BuildRaceStamp: function(seed, r, g, b) {
			let sizex = Math.floor(SU.r(seed,8.4)*110)+35;
			let sizey = Math.floor(SU.r(seed,8.5)*110)+35;
      let stamp = document.createElement('canvas');
      stamp.width = sizex;
      stamp.height = sizey;
			let size = Math.max(sizex, sizey);
      let context = stamp.getContext('2d');
			
			// Random symbol.
			let s = 0;
			let size2 = size*1.3;
			let off = (size2-size)/2;
			for (let x = 0; x < Math.round(SU.r(seed, s++)*3)+1; x++) {
	      context.beginPath();
	      context.moveTo(SU.r(seed, s++)*size2, SU.r(seed, s++)*size2);
				for (let i = 0; i < Math.round(SU.r(seed, s++)*5)+2; i++) {
		      //context.lineTo(SU.r(seed, s++)*size, SU.r(seed, s++)*size);
					let type = Math.floor(SU.r(seed++, 51.81) * 4);
					switch (type) {
						case 0:
							context.arcTo(SU.r(seed++, 1.82) * size2-off, SU.r(seed++, 2.83) * size2-off, SU.r(seed++, 3.84) * size2-off, SU.r(seed++, 4.85) * size2-off, SU.r(seed++, 5.86) * PIx2);
							break;
						case 1:
							context.bezierCurveTo(SU.r(seed++, 1.87) * size2-off, SU.r(seed++, 2.88) * size2-off, SU.r(seed++, 3.89) * size2-off, SU.r(seed++, 4.90) * size2-off, SU.r(seed++, 5.91) * size2-off, SU.r(seed++, 6.92) * size2-off);
							break;
						case 2:
							context.quadraticCurveTo(SU.r(seed++, 9.95) * size2-off, SU.r(seed++, 10.96) * size2-off, SU.r(seed++, 11.97) * size2-off, SU.r(seed++, 12.97) * size2-off);
							break;
						case 3:
							context.lineTo(SU.r(seed++, 9.95) * size2-off, SU.r(seed++, 10.96) * size2-off);
							break;
							/*
						case 4:
							SU.regularPolygon(context, SU.r(seed++, 9.95) * size2, SU.r(seed++, 10.96) * size2, Math.round(SU.r(seed++, 82.31)*4)+3, SU.r(seed++, 11.97) * size2/3, 'rgb('+r+','+g+','+b+')');
							//SU.circle(context, SU.r(seed++, 9.95) * size2, SU.r(seed++, 10.96) * size2, SU.r(seed++, 11.97) * size2/2, 'rgb('+r+','+g+','+b+')');
							break;
							*/
						default:
							error("drawicontypeerror");
					}
				}
	      context.closePath();
	      context.fillStyle = 'rgb('+r+','+g+','+b+')';
	      context.fill();
			}
			
			context.save();
      context.scale(-1, -1);
			context.drawImage(stamp, -size, -size);
      context.scale(-1, 1);
			context.drawImage(stamp, size, -size);
      context.scale(1, -1);
			context.drawImage(stamp, -size, -size);
			context.restore();
			
			//SU.rect(context, 0, 0, size, size, 'rgb('+r+','+g+','+b+')');
      return context.createPattern(stamp, "repeat");					
		},		
		RandArtiType: function(seed, faction) {
			let skill_type = SF.SKILL_STANDARD;
			if (faction === SF.FACTION_PIRATE) {
				skill_type = SF.SKILL_PIRATE;
			}
			let rand_type = SU.r(seed, 94.2);
			if (rand_type < 0.05) {
				skill_type = SF.SKILL_ALPHA;
			} else if (rand_type < 0.2) {
				skill_type = SF.SKILL_SHIP;
			} else if (rand_type < 0.35) {
				skill_type = SF.SKILL_BOOST;
			} else if (rand_type < 0.5) {
				skill_type = SF.SKILL_STATS;
			}
			return skill_type;
		},
		BaseCargoValue: function(level, type) {
			let value = SF.LEVEL_XP[level]/3;
			if (type === SF.CARGO_CONTRABAND) {
				value *= 10;
			}
			if (value < 2) value = 2;
			return round2good(value);
		},
		// Clear out unneded images in the cache, to make sure they don't build up over time.
		CleanImageCache: function() {
			let names_to_save = {};
			names_to_save[SF.RACE_SEED_ALPHA] = true;
			names_to_save["tow_ship"] = true;
			names_to_save["main_ship"] = true;
			names_to_save["tow_ship_name"] = true;
			names_to_save["main_ship_name"] = true;
			for (let crew of S$.crew) {
				names_to_save[crew.name] = true;
			}
			for (let obj in SG.image_cache) {
				if (!names_to_save[obj]) {
					delete SG.image_cache[obj];
				}
			}
		},
		IsCityType: function(type) {
			switch(type) {
				case SF.TYPE_CITY_ARTI:
				case SF.TYPE_CITY_ORE:
				case SF.TYPE_CITY_GOODS:
				case SF.TYPE_CITY_CONTRA:
				case SF.TYPE_CITY_ALL:
				case SF.TYPE_CITY_SPECIAL:
				case SF.TYPE_CITY_SHIP:
					return true;
				default:
					return false;
			}
		},
		// For a list of building types, draws icons for those buildings in a row.
		DrawBuildingSymbols: function(types, context, origx, y, height, center) {
			let x = origx;
			if (center) {
				x -= Math.round(types.length*height/2);
			}
			for (let type of types) {
				let image = SBar.GetBuildingImage(type);
	      context.drawImage(image, x, y, height, height);				
				x += height;
			}
		},
		HasHealingCrew: function() {
			for (let crew of S$.crew) {
				for (let arti of crew.artifacts) {
					let skill = new SBar.Skill(arti);
					for (let effect of skill.ability.effects) {
						if (effect.healing_effect) {
							return true;
						}
					}
				}
			}
		},
		Hide3dLayers: function(leave_stars) {
			if (!leave_stars) {
				S3.three1.style.visibility = 'hidden';
			} else {
				S3.three1.style.visibility = 'visible';
			}
			S3.three2.style.visibility = 'hidden';
			SC.layer0.canvas.style.visibility = 'hidden';
		},
		Show3dLayers: function(hide_helm) {
			S3.three1.style.visibility = 'visible';
			S3.three2.style.visibility = 'visible';
			if (hide_helm) {
				SC.layer0.canvas.style.visibility = 'hidden';
			} else {
				SC.layer0.canvas.style.visibility = 'visible';
			}
		},
		// Travel renderer singleton.
		GetTravelRenderer: function(skip_activetier) {
			if (!SG.travel_renderer) {
				let system_data = null;
				if (SG.activeTier) {
					// If starting in a system without a renderer try to use the system context if possible.
					let data = SG.activeTier.data;
					if (data) {
						if (data.type === SF.TYPE_SYSTEM_DATA) {
							system_data = data;
						} else if (data.type === SF.TYPE_PLANET_DATA || data.type === SF.TYPE_BELT_DATA) {
							system_data = data.systemData;
						} else if (data.parentData && data.parentData.systemData) {
							// Building.
							system_data = data.parentData.systemData;
						}
					}
				}
				if (system_data === null) {
					system_data = new SBar.DummySystemData();
				}
				SG.travel_renderer = new SBar.TravelRenderer(system_data);
				SG.travel_renderer.CheckSetup(undefined, skip_activetier);
			}
			return SG.travel_renderer;
		},
		// Common helper to generate an image based on a unicode symbol.				
		InitIconImage: function(symbol, /*optional*/skip_halo) {
      let img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			let ctx = img.getContext('2d');
			if (!skip_halo) {
	      let colorStops = [0, 'rgba(255,255,255,1)', 1, 'rgba(255,255,255,0)'];
	      SU.circleRad(ctx, 50, 50, 50, colorStops);
			}
			SU.text(ctx, symbol, 50, 80, 'bold 60pt '+SF.FONT, "#000", 'center');
			return img;
		},
		// Returns the input coordinate, aligned to the edge of a region boundary.
		AlignByRegion(coord) {
      return Math.floor(coord / SF.REGION_SIZE) * SF.REGION_SIZE;
		},
		
  };
})();

var SU = SBar.Utils;

