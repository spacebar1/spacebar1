(function() {
	JTact.Utils = {
		extendedClasses: {},
		// first argument extends second (all prototype fields in o2 get applied to o1)
		// Also checks if o1 has already been extended, which indicates a bug
		extend: function(o1, o2) {
			if (o1 === undefined || o2 === undefined) {
				error("extend error: " + o1 + ", " + o2);
			}
			if (TU.extendedClasses[o1]) {
				error("Problem: already extended class " + o1 + ", probably forgot to change extend line in a copy-pasted class");
				return;
			}
			for (var m in o2.prototype) {
				if (!(m in o1.prototype)) {
					o1.prototype[m] = o2.prototype[m];
				}
			}
			TU.extendedClasses[o1] = true;
		},
		addProps: function(o1, o2) {
			for (var p in o2) {
				o1[p] = o2[p];
			}
		},
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
			if (fill) {
				context.fillStyle = fill;
				context.fill();
			}
			if (stroke) {
				context.lineWidth = strokeWidth;
				context.strokeStyle = stroke;
				context.stroke();
			}
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
		capitalize: function(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
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

			//ctx.beginPath();
			//ctx.rect(x, y, width, height);
			//ctx.closePath();
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
		text: function(context, text, x, y, font, color, align) {
			var origalign = context.textAlign;
			if (align) {
				context.textAlign = align;
			} else {
				context.textAlign = 'left';
			}
			context.font = font;
			context.fillStyle = color;
			context.fillText(text, x, y);
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
					} else {
						line = testLine;
					}
				}
				context.fillText(line, x, y + yoff);
				yoff += lineHeight;
			}
			return yoff;
		},
		cloneEffect: function(old) {
			var ret = new JTact.Effect(old.displayName);
			for (var obj in old) {
				ret[obj] = old[obj];
			}
			return ret;
		},
		// just forwards to viewer.logMessage
		logMessage: function(altText, iconList) {
			TG.controller.renderer.logMessage(altText, iconList);
		},
		blankIcon: function() {
			var img = document.createElement('canvas');
			img.width = TF.ICON_SIZE;
			img.height = TF.ICON_SIZE;
			return img;
		},
		// Plain-looking icon based on a character or two
		textIcon: function(text) {
			var img = document.createElement('canvas');
			img.width = TF.ICON_SIZE;
			img.height = TF.ICON_SIZE;
			var ctx = img.getContext('2d');

			ctx.font = 'bold 50pt '+SF.FONT;
			ctx.lineWidth = 3;
			ctx.fillStyle = '#000';
			ctx.strokeStyle = "#000";
			ctx.textAlign = 'center';
			ctx.fillText(text, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.73);
			ctx.strokeText(text, TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.73);

			return img;
		},
		// generate a unique looking hero/effect icon based on this seed
		// Hero = true if it needs to be a hex
		// And optional text to display
		randIcon: function(seed, symbols, hero /*optional*/ ) {
			var img = document.createElement('canvas');
			img.width = TF.ICON_SIZE + 4;
			img.height = TF.ICON_SIZE + 4;
			var ctx = img.getContext('2d');
			ctx.translate(2, 2);
			var size2 = TF.ICON_SIZE * 1.5;

			// text and shape
			var r = Math.floor(SU.r(seed++, 51.71) * 256);
			var g = Math.floor(SU.r(seed++, 51.72) * 256);
			var b = Math.floor(SU.r(seed++, 51.73) * 256);

			TU.rect(ctx, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, "#FFF", "#000", 4);
			ctx.save();
			ctx.translate(-TF.ICON_SIZE / 4, -TF.ICON_SIZE / 4); // overdraw past the bounds
			var rounds = Math.floor(SU.r(seed++, 51.74) * 4) + 1;
			for (var i = 0; i < 2; i++) {
				var numpoints = Math.floor(SU.r(seed++, 51.75) * 16) + 8;
				if (i == 1) {
					numpoints -= 7;
					r += Math.floor(SU.r(seed++, 51.76) * 150)-75;
					g += Math.floor(SU.r(seed++, 51.77) * 150)-75;
					b += Math.floor(SU.r(seed++, 51.78) * 150)-75;
					r = fixColor(r);
					g = fixColor(g);
					b = fixColor(b);
				}
				ctx.beginPath();
				ctx.moveTo(SU.r(seed++, 51.79) * size2, SU.r(seed++, 51.80) * size2);
				for (var y = 0; y < numpoints; y++) {
					// Select randomly from drawing APIs
					// void arcTo(in float x1, in float y1, in float x2, in float y2, in float radius);
					// bezierCurveTo(in float cp1x, in float cp1y, in float cp2x, in float cp2y, in float x, in float y);
					// lineTo(in float x, in float y);
					// quadraticCurveTo(in float cpx, in float cpy, in float x, in float y);
					var type = Math.floor(SU.r(seed++, 51.81) * 4);
					switch (type) {
						case 0:
							ctx.arcTo(SU.r(seed++, 1.82) * size2, SU.r(seed++, 2.83) * size2, SU.r(seed++, 3.84) * size2, SU.r(seed++, 4.85) * size2, SU.r(seed++, 5.86) * PIx2);
							break;
						case 1:
							ctx.bezierCurveTo(SU.r(seed++, 1.87) * size2, SU.r(seed++, 2.88) * size2, SU.r(seed++, 3.89) * size2, SU.r(seed++, 4.90) * size2, SU.r(seed++, 5.91) * size2, SU.r(seed++, 6.92) * size2);
							break;
						case 2:
							ctx.lineTo(SU.r(seed++, 7.93) * size2, SU.r(seed++, 8.94) * size2);
							break;
						case 3:
							ctx.quadraticCurveTo(SU.r(seed++, 9.95) * size2, SU.r(seed++, 10.96) * size2, SU.r(seed++, 11.97) * size2, SU.r(seed++, 12.97) * size2);
							break;
						default:
							error("drawicontypeerror");
					}
				}
				ctx.closePath();
				ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',1)';
				ctx.fill();
			}
			ctx.restore();

			if (hero) {
				TU.applyHexStamp(ctx);
				ctx.save();
				var w = TF.ICON_SIZE / 2;
				ctx.translate(w, w);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, w, null, "#000", 2);
				ctx.restore();
			} else {
				// Ability icon.
				TU.applyCircleStamp(ctx);
				TU.circle(ctx, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, TF.ICON_SIZE / 2, undefined, "#000", 2);
			}

			r += Math.floor(SU.r(seed++, 51.98) * 150)-75;
			g += Math.floor(SU.r(seed++, 51.99) * 150)-75;
			b += Math.floor(SU.r(seed++, 52.01) * 150)-75;
			r = fixColor(r);
			g = fixColor(g);
			b = fixColor(b);
			
			ctx.save();
			// Letters and symbols.
			let fillstyle1;
			//let fillstyle2;
			let hero_symbol1_rot = SU.r(seed+1, 5.12)*PIx2;					
			let hero_symbol2_rot = SU.r(seed+2, 5.12)*PIx2;					
			if (hero) {
				/*
				let fill_image = SU.GetFillPattern(TF.ICON_SIZE, seed, r, g, b);
				*/
				/*
				let pattern_img_small = document.createElement('canvas');
				pattern_img_small.width = 16;
				pattern_img_small.height = 16;
				let ctx_small = pattern_img_small.getContext('2d');
				SU.rect(ctx_small, 0, 0, 16, 16, 'rgb(' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ')')
				for (let i = 0; i < 10; i++) {
					TU.circle(ctx_small, SU.r(seed++, 52.01)*16, SU.r(seed++, 52.01)*16, SU.r(seed++, 52.01)*16, 
							'rgba(' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ',0.4)');
				}
				for (let i = 0; i < 10; i++) {
					TU.rect(ctx_small, SU.r(seed++, 52.01)*16, SU.r(seed++, 52.01)*16, 1, 1, 
							'rgba(' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ',' + Math.floor(SU.r(seed++, 52.01)*256) + ',0.7)');
				}
				*/
				/*
				let pattern_img_large = document.createElement('canvas');
				pattern_img_large.width = TF.ICON_SIZE;
				pattern_img_large.height = TF.ICON_SIZE;
				let ctx_large = pattern_img_large.getContext('2d');
				ctx_large.drawImage(fill_image, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);				
				fillstyle1 = ctx_large.createPattern(pattern_img_large, "repeat");
				*/
				let pattern_img_large = document.createElement('canvas');
				pattern_img_large.width = TF.ICON_SIZE;
				pattern_img_large.height = TF.ICON_SIZE;
				let ctx_large = pattern_img_large.getContext('2d');
				ctx_large.save();
				ctx_large.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
				ctx_large.rotate(-hero_symbol1_rot);
				ctx_large.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
				ctx_large.drawImage(img, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);				
				ctx_large.restore();
				//TU.rect(ctx_large, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, 'rgba(255,255,255,0.5)');
								
				//fillstyle1 = "#FFF";
				 fillstyle1 = ctx_large.createPattern(pattern_img_large, "repeat"); // This version uses the background.
				
				// Rotate the pattern for filling the second rotated symbol.
				let pattern_img_large2 = document.createElement('canvas');
				pattern_img_large2.width = TF.ICON_SIZE;
				pattern_img_large2.height = TF.ICON_SIZE;
				let ctx_large2 = pattern_img_large2.getContext('2d');
				ctx_large2.save();
				ctx_large2.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
				ctx_large2.rotate(-hero_symbol2_rot);
				ctx_large2.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
				ctx_large2.drawImage(img, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);
				ctx_large2.restore();
				//TU.rect(ctx_large2, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE, 'rgba(255,255,255,0.5)');
				fillstyle2 = ctx_large2.createPattern(pattern_img_large2, "repeat");
				
				// Lighten up the original background, so the text is easier to read.
				ctx.save();
				var w = TF.ICON_SIZE / 2;
				ctx.translate(w, w);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, w, 'rgba(255, 255, 255, 0.5)');
				ctx.restore();
				
				ctx.strokeStyle = "#000";
				ctx.lineWidth = 5;
			} else {  // Ability icon.
				//ctx.fillStyle = 'rgb(' + Math.round(255-r/3) + ',' + Math.round(255-g/3) + ',' + Math.round(255-b/3) + ')';
				ctx.fillStyle = "#000";
				ctx.strokeStyle = "#FFF";
				ctx.lineWidth = 10;
			}
			ctx.textAlign = 'center';
			ctx.globalCompositeOperation = 'source-atop';  // Don't overflow the hex bounds.
			for (let i = 0; i < symbols.length && i < 5; i++) {
				ctx.save();
				if (hero) {
					let rot = i === 0 ? hero_symbol1_rot : hero_symbol2_rot;
					ctx.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
					ctx.rotate(rot);
					ctx.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
					ctx.fillStyle = i === 0 ? fillstyle1 : fillstyle2;
					/*
					//if (i === 0) {
						//ctx.fillStyle = fillstyle1;
						//} else {
						ctx.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
						ctx.rotate(hero_symbol2_rot);
						ctx.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
						//ctx.fillStyle = fillstyle1; // fillstyle2;
						//}
					ctx.fillStyle = fillstyle1;
					*/
				}
				ctx.font = '60pt '+SF.FONT;
				ctx.strokeText(symbols[i], TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.79);
				ctx.restore();
			}
			for (let i = 0; i < symbols.length && i < 5; i++) {
				ctx.save();
				if (hero) {
					let rot = i === 0 ? hero_symbol1_rot : hero_symbol2_rot;
					ctx.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
					ctx.rotate(rot);
					ctx.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
					ctx.fillStyle = i === 0 ? fillstyle1 : fillstyle2;
					/*
					//if (i === 0) {
						//ctx.fillStyle = fillstyle1;
						//} else {
						ctx.translate(TF.ICON_SIZE/2,TF.ICON_SIZE/2);
						let hero_symbol2_rot = SU.r(seed+i, 5.12)*PIx2;					
						ctx.rotate(hero_symbol2_rot);
						ctx.translate(-TF.ICON_SIZE/2,-TF.ICON_SIZE/2);
						//ctx.fillStyle = fillstyle1; // fillstyle2;
						//}
					ctx.fillStyle = fillstyle1;
					*/
				}
				ctx.font = '60pt '+SF.FONT;
				ctx.fillText(symbols[i], TF.ICON_SIZE / 2, TF.ICON_SIZE * 0.79);
				ctx.restore();
			}
			ctx.restore();
			
			// Re-fill edge if the characters spilled over.
			if (hero) {
				ctx.save();
				var w = TF.ICON_SIZE / 2;
				ctx.translate(w, w);
				ctx.rotate(PIx2 / 12);
				TU.regularPolygon(ctx, 0, 0, 6, w, null, "#000", 2);
				ctx.restore();
			}			

			return img;
		},
		// Same as randIcon(), but put it in a hex
		randHeroIcon: function(seed, symbols) {
			return TU.randIcon(seed, symbols, /*hero=*/true);
		},
		// Turn the image into a hex
		applyHexStamp: function(ctx) {
			if (TU.hexstamp === undefined) {
				var w = TF.ICON_SIZE / 2;
				var img = document.createElement('canvas');
				img.width = TF.ICON_SIZE;
				img.height = TF.ICON_SIZE;
				var hexctx = img.getContext('2d');
				hexctx.save();
				hexctx.translate(w, w);
				hexctx.rotate(PIx2 / 12);
				TU.regularPolygon(hexctx, 0, 0, 6, w, "#000");
				hexctx.restore();
				TU.hexstamp = img;
			}

			ctx.save();
			ctx.globalCompositeOperation = 'destination-atop';
			ctx.drawImage(TU.hexstamp, 0, 0);
			ctx.restore();
		},
		applyCircleStamp: function(ctx) {
			if (TU.circlestamp === undefined) {
				var w = TF.ICON_SIZE / 2;
				var img = document.createElement('canvas');
				img.width = TF.ICON_SIZE;
				img.height = TF.ICON_SIZE;
				var circlectx = img.getContext('2d');
				circlectx.save();
				circlectx.translate(w, w);
				TU.circle(circlectx, 0, 0, TF.ICON_SIZE / 2, "#000");
				circlectx.restore();
				TU.circlestamp = img;
			}

			ctx.save();
			ctx.globalCompositeOperation = 'destination-atop';
			ctx.drawImage(TU.circlestamp, 0, 0);
			ctx.restore();
		},
		imageHeroIcon: function(name, seed, symbols, image) {
			//			TU.applyHexStamp(ctx);
			
			let img = document.createElement('canvas');
			img.width = TF.ICON_SIZE + 4;
			img.height = TF.ICON_SIZE + 4;
			let ctx = img.getContext('2d');
			ctx.translate(2, 2);
  		ctx.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);
			
			if (seed === SF.RACE_SEED_HUMAN) {
				this.DrawBigHat(seed, ctx);
			}
			TG.icons2[name] = img;

			let updated_icon = this.randHeroIcon(seed, "");
  		updated_icon.getContext('2d').drawImage(img, -2, -2)
			
			return updated_icon;
		},
		
		alphaIconxxx: function(name, seed, level, friendly) {
			if (!SG.image_cache[SF.RACE_SEED_ALPHA]) {
				SG.image_cache[SF.RACE_SEED_ALPHA] = new SBar.IconAlien(SU.r(SF.RACE_SEED_ALPHA, 12.34), SF.RACE_SEED_ALPHA, /*data_type=*/-1, /*data_faction=*/-1, /*is_home_bar=*/false, /*override_random=*/true, {skip_trash_bag: true}).image;
			}
			let image = SG.image_cache[SF.RACE_SEED_ALPHA];		
		},
		alphaIcon: function(name, seed, level, friendly) {
			if (!SG.image_cache[name]) {
				SG.image_cache[name] = new SBar.IconAlien(seed, SF.RACE_SEED_ALPHA, /*data_type=*/-1, /*data_faction=*/-1, /*is_home_bar=*/false, /*override_random=*/true, {skip_trash_bag: true}).image;
			}
			let image = SG.image_cache[name];		 
						
			let img = document.createElement('canvas');
			img.width = TF.ICON_SIZE + 4;
			img.height = TF.ICON_SIZE + 4;
			let ctx = img.getContext('2d');
			ctx.translate(2, 2);
  		ctx.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);

			this.DrawBigHat(seed, ctx, /*black_color=*/true);
			TG.icons2[name] = img;
			
			let icon = this.randHeroIcon(seed, "");
  		icon.getContext('2d').drawImage(img, -2, -2)
			
			if (!friendly) {  // Simpler for friendly alphas to have no letter.
	      r = Math.floor(SU.r(seed, 9.22) * 156) + 100;
	      g = Math.floor(SU.r(seed, 9.23) * 156) + 100;
	      b = Math.floor(SU.r(seed, 9.24) * 156) + 100;
				let letter = SU.AlphaLetter(level);
				this.text(ctx, letter, TF.ICON_SIZE/2, Math.round(TF.ICON_SIZE*0.45), '40pt '+SF.FONT, "rgb("+r+","+g+","+b+")", 'center')
			}
			return icon;
		},
		
		// Big tophat!
		// *** MOSTLY COPIED FROM + CONSISTENT WITH iconAlien.js ***
		DrawBigHat(seed, context, /*optional*/black_color, /*optional*/black_edge) {
			let WIDTH = TF.ICON_SIZE;
			let HEIGHT = TF.ICON_SIZE
			context.save();
			context.translate(WIDTH/2, HEIGHT/2);
      context.beginPath();
      context.moveTo(-WIDTH/2, HEIGHT/20);
      context.lineTo(-WIDTH/2, 0);
      context.lineTo(-WIDTH/4-2, 0);
      context.lineTo(-WIDTH/4-2, -HEIGHT*0.48);
      context.lineTo(WIDTH/4+2, -HEIGHT*0.48);
      context.lineTo(WIDTH/4+2, 0);
      context.lineTo(WIDTH/2, 0);
      context.lineTo(WIDTH/2, HEIGHT/20);
      context.closePath();

      //context.fillStyle = "#888";
//      this.context.drawImage(this.eyeimages[headNum], 0, 0, EYE_SIZE + EYE_BUF * 2, EYE_SIZE + EYE_BUF * 2, x - size * EYEUP / 2, y - size * EYEUP / 2, size * EYEUP, size * EYEUP);
		
			if (black_color) {
				context.fillStyle = "#000";
				context.fill();
				border = black_edge ? "#000" : "#444";
	      context.strokeStyle = border;
			} else {
	      r = Math.floor(SU.r(seed, 6.22) * 156) + 100;
	      g = Math.floor(SU.r(seed, 6.23) * 156) + 100;
	      b = Math.floor(SU.r(seed, 6.24) * 156) + 100;
				let stampsize = 13;
				let fillimg = SU.GetFillPattern(stampsize, seed, r, g, b, 256);
				context.fillStyle = "#FFF"
				context.fill();
				context.save();
				context.globalCompositeOperation = 'source-atop';
				context.drawImage(fillimg, 0, 0, stampsize, stampsize, -WIDTH/2, -HEIGHT/2, WIDTH, HEIGHT/2+HEIGHT/20)
				context.restore();
				//context.fillStyle = context.createPattern(patimg, "repeat");;
	      //context.fill();			
				border = "rgb("+(r-100)+","+(g-100)+","+(b-100)+")";
	      context.strokeStyle = border;
			}
      context.lineWidth = 2;
      context.stroke();
		
			context.restore();							
		},
		
		alphaBossIcon: function() {
			if (!SG.image_cache[SF.RACE_SEED_ALPHA]) {
				SG.image_cache[SF.RACE_SEED_ALPHA] = new SBar.IconAlien(SU.r(SF.RACE_SEED_ALPHA, 12.34), SF.RACE_SEED_ALPHA, /*data_type=*/-1, /*data_faction=*/-1, /*is_home_bar=*/false, /*override_random=*/true, {skip_trash_bag: true}).image;
			}
			let image = SG.image_cache[SF.RACE_SEED_ALPHA];		 
						
			let img = document.createElement('canvas');
			img.width = TF.ICON_SIZE + 4;
			img.height = TF.ICON_SIZE + 4;
			let ctx = img.getContext('2d');
			ctx.translate(2, 2);
  		//ctx.drawImage(image, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, TF.ICON_SIZE, TF.ICON_SIZE);

			// Basic legs. This are both a throwback to Agent USA and a compromise for having few pixels to work with here.
			let legs_color = "#444";
			SU.line(ctx, Math.round(TF.ICON_SIZE*0.4), Math.round(TF.ICON_SIZE*0.5), Math.round(TF.ICON_SIZE*0.4), Math.round(TF.ICON_SIZE*0.75), legs_color, Math.round(TF.ICON_SIZE*0.1));
			SU.line(ctx, Math.round(TF.ICON_SIZE*0.45), Math.round(TF.ICON_SIZE*0.75), Math.round(TF.ICON_SIZE*0.23), Math.round(TF.ICON_SIZE*0.75), legs_color, Math.round(TF.ICON_SIZE*0.1));
			SU.line(ctx, Math.round(TF.ICON_SIZE*0.6), Math.round(TF.ICON_SIZE*0.5), Math.round(TF.ICON_SIZE*0.6), Math.round(TF.ICON_SIZE*0.75), legs_color, Math.round(TF.ICON_SIZE*0.1));
			SU.line(ctx, Math.round(TF.ICON_SIZE*0.55), Math.round(TF.ICON_SIZE*0.75), Math.round(TF.ICON_SIZE*0.77), Math.round(TF.ICON_SIZE*0.75), legs_color, Math.round(TF.ICON_SIZE*0.1));
			//ctx.save();
			//ctx.transform(1, 0, 0, 1.2, 0, 0)
			this.DrawBigHat(8.12, ctx, /*black_color=*/true, /*black_edge=*/true);
			//ctx.restore();
			TG.icons2[name] = img;
			
			let icon = this.randHeroIcon(8.13, "");
  		icon.getContext('2d').drawImage(img, -2, -2)
			
      r = Math.floor(SU.r(8.15, 9.22) * 156) + 100;
      g = Math.floor(SU.r(8.16, 9.23) * 156) + 100;
      b = Math.floor(SU.r(8.17, 9.24) * 156) + 100;
//			let letter = SU.AlphaLetter(level);
//			this.text(ctx, letter, TF.ICON_SIZE/2, Math.round(TF.ICON_SIZE*0.45), '40pt '+SF.FONT, "rgb("+r+","+g+","+b+")", 'center')
			return icon;
		},
				
		
		// Converts a hero.js to crew.js.
		HeroToCrew(hero) {
			let new_crew = new SBar.Crew(hero.name, hero.seed, hero.raceseed, hero.level);
			if (hero.is_feral/* || hero.raceseed === SF.RACE_SEED_ALPHA*/) {
				new_crew.personality = SF.P_FERAL;
				new_crew.ResetPersonalityText();
			}
			new_crew.base_level = hero.level;
			new_crew.artifacts = SU.Clone(hero.for_export_artis);
			new_crew.health = hero.health;
			new_crew.max_health = hero.max_health;
			new_crew.base_max_health = hero.max_health;
			new_crew.morale = hero.morale;
			new_crew.speed = hero.speed;
			new_crew.base_speed = hero.speed;  // Not this is intentionally not base (doesn't exist). Which can pick up whatever the end value was.
			// Note personality is not copied. That can be scrambled.
			// Also note that the player copy becomes an NPC with personality.
			return new_crew;
		},
		HasHealingHeroes(heroes) {
			for (let obj in heroes) {
				let hero = heroes[obj];
				if (hero.friendly) {
			    for (ability of hero.abilities) {
						for (effect of ability.effects) {
							if (effect.healing_effect) {
								// Shortcut for checking the healing abilities.
								return true;
							}
						}
			    }
				}
			}
			return false;
		},
	};
})();

var TU = JTact.Utils;
