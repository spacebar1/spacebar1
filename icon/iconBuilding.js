(function() {
		let imagesize = 30;

		let normalimg = null;
		let pirateimg = null;
		let alphaimg = null;

    let mineimg = null;
    let pubimg = null;
		let templeimg = null;
		let templebarimg = null;
    let labimg = null;
		let colonyimg = null;
		let armoryimg = null;
    let cityartiimg = null;
    let cityoreimg = null;
    let citygoodsimg = null;
    let citycontraimg = null;
    let cityallimg = null;
    let cityspecialimg = null;
    let cityshipimg = null;
		let platformimg = null;
		let ruinsimg = null;
		let informationimg = null;
		let animalimg = null;
		let goodyhutimg = null;
		let arenaimg = null;
		let skullbarimg = null;
		let constructionimg = null;
		let obeliskimg = null;
		let universityimg = null;
		let alphabarracksimg = null;
		let alphaairportimg = null;
		let alphahqimg = null;
		let alphadanceimg = null;
		let cornfieldimg = null;
		let observatoryimg = null;
		let shipyardimg = null;
		let hotelimg = null;
		let jobimg = null;
		let backupderelictimg = null; // Overwritten by the ship image in icons.
		let custommineimg = null;
		let treasureimg = null;
		let backupcustomshipimg = null;  // Overwritten by custom ship icons.
		
		function AddIconSymbol(image, symbol) {
			SU.text(image.getContext('2d'), symbol, 50, 80, 'bold 60pt '+SF.FONT, "#000", 'center');
		}
		
		// Draws a float/over platform. Drawn after the main image, for code convenience.
		function DrawPlatform() {
      platformimg = document.createElement('canvas');
      platformimg.width = imagesize;
      platformimg.height = imagesize;
      let ctx = platformimg.getContext('2d');
			ctx.save();
			ctx.transform(1, 0, 0, 0.3, 0, 0);
      var colorStops = [0, '#000', 1, '#888']
      SU.circleRad(ctx, imagesize/2, imagesize*2.7, imagesize/2, colorStops);
			ctx.restore();
		}
		function DrawPirate() {
			// Pirate flag.
      pirateimg = document.createElement('canvas');
      pirateimg.width = 100;
      pirateimg.height = 100;
			let ctx = pirateimg.getContext('2d');
			ctx.save();
			ctx.rotate(-Math.PI/10);
			SU.rectCorner(ctx, 4, 20, 20, 45, 30, "#000");
			SU.line(ctx, 20, 20, 20, 80, "#743", 5);
			//SU.text(ctx, 'X', 42, 47, SF.FONT_XLB, "#F88", 'center');
			SU.text(ctx, '☠️', 42, 47, SF.FONT_XLB, "#F88", 'center');
		}
		function DrawAlpha() {
			// Alpha flag.
      alphaimg = document.createElement('canvas');
      alphaimg.width = 100;
      alphaimg.height = 100;
			let ctx = alphaimg.getContext('2d');
			ctx.save();
			ctx.rotate(-Math.PI/10);
			SU.rectCorner(ctx, 4, 20, 20, 45, 30, "#FFF");
			SU.line(ctx, 20, 20, 20, 80, "#743", 5);
			//SU.text(ctx, 'X', 42, 47, SF.FONT_XLB, "#F88", 'center');
			SU.text(ctx, '☮', 42, 47, SF.FONT_XLB, "#000", 'center');
		}	
		
    function initBar() {
			// Pub.
      pubimg = document.createElement('canvas');
      pubimg.width = 100;
      pubimg.height = 100;
			ctx = pubimg.getContext('2d');
			ctx.lineCap = 'round';
			ctx.translate(0, 10);
			// Handle
			SU.line(ctx, 20, 35, 40, 35, "#000", 10);
			SU.line(ctx, 20, 35, 20, 70, "#000", 10);
			SU.line(ctx, 20, 70, 40, 70, "#000", 10);
			// Body.
			SU.rect(ctx, 30, 20, 40, 60, "#000");
			SU.line(ctx, 35, 80, 65, 80, "#000", 5);
			SU.line(ctx, 42, 35, 42, 65, "#FFF", 3);
			SU.line(ctx, 58, 35, 58, 65, "#FFF", 3);
			// Foam.
			SU.circle(ctx, 30, 14, 10, "#444")
			SU.circle(ctx, 40, 20, 12, "#444")
			SU.circle(ctx, 50, 15, 12, "#444")
			SU.circle(ctx, 60, 22, 13, "#444")
			SU.circle(ctx, 67, 19, 15, "#444")
			SU.circle(ctx, 30, 14, 7, "#FFF")
			SU.circle(ctx, 40, 20, 9, "#FFF")
			SU.circle(ctx, 50, 15, 8, "#FFF")
			SU.circle(ctx, 60, 22, 11, "#FFF")
			SU.circle(ctx, 67, 19, 11, "#FFF")
    }
    function initMine() {
      var full = imagesize;
      var half = full / 2;

      let image = document.createElement('canvas');
      image.width = imagesize;
      image.height = imagesize;
      let imagecontext = image.getContext('2d');
      var ctx = imagecontext;
			ctx.translate(0, 10);

      // var grd = ctx.createRadialGradient(0, 0, 0, 0, -full, 100);
      var grd = ctx.createLinearGradient(0, -half, 0, half);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.5, 'rgba(150,150,150,1)');
      grd.addColorStop(1, 'rgba(100,100,100,1)');
      ctx.fillStyle = grd;

      ctx.save();
      ctx.translate(half, half);

      ctx.beginPath();
      ctx.moveTo(-half, half / 2);
      ctx.quadraticCurveTo(-half / 2, -full * 0.8, 0, half / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-half / 2, half / 2 - 1);
      ctx.quadraticCurveTo(0, -full * 1.2, half / 2, half / 2 - 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, half / 2);
      ctx.quadraticCurveTo(half * 2 / 3, -full * 0.6, half, half / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-half / 4, half / 2);
      ctx.quadraticCurveTo(0, -full * 0.3, half / 4, half / 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      ctx.restore();
      mineimg = image;
    }
    function initArmory() {
				/*
				// Armory. (shield)
	      armoryimg = document.createElement('canvas');
	      armoryimg.width = 74;
	      armoryimg.height = 74;
				ctx = armoryimg.getContext('2d');
				SU.circle(ctx, 37, 37, 33, "#999", "#000", 6);
				SU.circle(ctx, 37, 37, 20, "#A77", "#966", 2);
				SU.circle(ctx, 37, 37, 6, "#FFF", "#855", 2);
				*/
    }
    function initLab() {
			// Science.
      labimg = document.createElement('canvas');
      labimg.width = 100;
      labimg.height = 100;
			ctx = labimg.getContext('2d');

			ctx.save();
			ctx.translate(50, 50);
			ctx.save();
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, "#FFF");
			ctx.restore();
			ctx.save();
			ctx.rotate(Math.PI*2/3);
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, "#FFF");
			ctx.restore();
			ctx.save();
			ctx.rotate(-Math.PI*2/3);
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, "#FFF");
			ctx.restore();
			SU.circle(ctx, 0, 0, 10, "#000");
			ctx.restore();

			ctx.save();
			ctx.translate(50, 50);
			ctx.save();
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, null, "#000", 8);
			ctx.restore();
			ctx.save();
			ctx.rotate(Math.PI*2/3);
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, null, "#000", 8);
			ctx.restore();
			ctx.save();
			ctx.rotate(-Math.PI*2/3);
			ctx.transform(0.4, 0, 0, 1, 0, 0);
			SU.circle(ctx, 0, 0, 40, null, "#000", 8);
			ctx.restore();
			SU.circle(ctx, 0, 0, 10, "#000");
			ctx.restore();
    }	

    function initColony() {
			let seed = 12.34; // This used to be dynamic for slighly different looking colonies.
      var size = imagesize * 0.7;
      var r = Math.floor(SU.r(seed, 5) * 200);
      var g = Math.floor(SU.r(seed, 6) * 200);
      var b = Math.floor(SU.r(seed, 7) * 200);
      var rt = Math.floor(SU.r(seed, 8) * 200); // tree
      var gt = Math.floor(SU.r(seed, 9) * 200);
      var bt = Math.floor(SU.r(seed, 10) * 200);
      let image = document.createElement('canvas');
      image.width = imagesize;
      image.height = imagesize;
      let imagecontext = image.getContext('2d');
      imagecontext.save();
      imagecontext.translate((imagesize - size) / 2, (imagesize - size) / 2);
      SU.line(imagecontext, size / 2, size, size * (0.1 + 0.8 * SU.r(seed, 11)), size / 4 + size / 4 * SU.r(seed, 12), 'rgb(' + rt + ',' + gt + ',' + bt + ')', 10);
      SU.line(imagecontext, size / 2, size, size * (0.1 + 0.8 * SU.r(seed, 13)), size / 4 + size / 4 * SU.r(seed, 14), 'rgb(' + rt + ',' + gt + ',' + bt + ')', 10);
      SU.line(imagecontext, size / 2, size, size * (0.1 + 0.8 * SU.r(seed, 15)), size / 4 + size / 4 * SU.r(seed, 16), 'rgb(' + rt + ',' + gt + ',' + bt + ')', 10);
      SU.circle(imagecontext, size / 2, size / 2, size / 2, 'rgba(255,255,255,0.2)');
      var colorStops = [0, 'rgba(255,255,255,0.8)', 0.3, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0)'];
      SU.circleRad(imagecontext, size * 3 / 5, size * 2 / 5, size / 3, colorStops);
      SU.rect(imagecontext, 0, size / 2 + 5, size, size / 2, 'rgb(' + r + ',' + g + ',' + b + ')'); // building
      SU.rect(imagecontext, size / 2 - 4, size - 8, 8, 13, '#000'); // door
      imagecontext.restore();
			colonyimg = image;
    }
			/* Old city drawing.
//					if (tradeimg === null) {
	      tradeimg = document.createElement('canvas');
	      tradeimg.width = 100;
	      tradeimg.height = 100;
				ctx = tradeimg.getContext('2d');
				// City silhouette.
	      var colorStops = [0, 'rgba(255, 255, 180, 1)', 1, 'rgba(255, 255, 180, 0)'];
	      SU.circleRad(ctx, 50, 100, 80, colorStops);
				SU.rect(ctx, 0, 70, 100, 30, "#000");
				for (var i = 0; i < 10; i++) {
					var height = (10-i*2/3)*8;
					var x = Math.floor(SU.r(this.data.seed, 6.1+i)*100);
					var width = Math.floor(SU.r(this.data.seed, 6.2+i)*(100-x));
					if (i < 5) width /= 2;
					if (width < 8) width += 8;
					var rgb = i*15;
					SU.rect(ctx, x, 100-height, width, height, 'rgb('+rgb+','+rgb+','+rgb+')');
				}
			*/
				/*
				// Trade.
				ctx = tradeimg.getContext('2d');
				SU.circle(ctx, 50, 50, 34, "#FFF", "#000", 17);
				SU.text(ctx, '$', 50, 75, 'bold 55pt '+SF.FONT, "#000", 'center');
				*/
//					}
		function initHotel() {
      img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			ctx = img.getContext('2d');
			// Simple house.
			SU.rect(ctx, 15, 50, 70, 48, "#888", "#000", 6);
			SU.triangle(ctx, 50, 0, 0, 50, 100, 50, "#660", "#000", 6);
			SU.rect(ctx, 40, 70, 20, 25, "#000");
			hotelimg = img;
		}
		function initObservatory() {
      img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			ctx = img.getContext('2d');
			
      var colorStops = [0, 'rgba(255, 255, 180, 1)', 1, 'rgba(255, 255, 180, 0)'];
      SU.circleRad(ctx, 50, 90, 50, colorStops);

			ctx.save();
			ctx.translate(50, 85)
			ctx.transform(1, 0, 0, 0.3, 0, 0);
      SU.circle(ctx, 0, 0, 35, "#666");
			ctx.restore();
      SU.circle(ctx, 45, 75, 10, "#666");
			// Dish background.
			ctx.save();
			ctx.translate(56, 44)
			ctx.rotate(Math.PI/4);
			ctx.transform(1, 0, 0, 0.8, 0, 0);
      SU.circle(ctx, 0, 0, 35, "#000");
			ctx.restore();
			// Dish inside.
			ctx.save();
			ctx.translate(64, 36)
			ctx.rotate(Math.PI/4);
			ctx.transform(1, 0, 0, 0.5, 0, 0);
      SU.circle(ctx, 0, 0, 30, "#FFF", "#000", 10);
			ctx.restore();
			// Antenna.
      SU.circle(ctx, 85, 15, 10, "#666");
			SU.line(ctx, 50, 25, 85, 15, "#666", 5);
			SU.line(ctx, 60, 40, 85, 15, "#666", 5);
			SU.line(ctx, 75, 50, 85, 15, "#666", 5);
			observatoryimg = img;
		}
		function initJob() {
      img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			ctx = img.getContext('2d');

      SU.circle(ctx, 50, 50, 46, "#444");
      SU.circle(ctx, 50, 50, 40, "#FFF");

			ctx.lineCap = "round";
			SU.line(ctx, 35, 23, 35, 40, "#000", 6);
			SU.line(ctx, 65, 23, 65, 40, "#000", 6);
			SU.line(ctx, 35, 23, 65, 23, "#000", 6);

      SU.rectCorner(ctx, 8, 20, 30, 60, 18, "#444");
      SU.rectCorner(ctx, 8, 24, 52, 52, 26, "#444");
      SU.rectCorner(ctx, 8, 35, 45, 30, 15, "#FFF");
      SU.rectCorner(ctx, 8, 40, 48, 20, 8, "#000");
			jobimg = img;
		}
		function initShipyard() {
			// SF1 ISS logo parody.
      img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			ctx = img.getContext('2d');
			ctx.translate(0, 20);
			ctx.scale(1, 0.5)
			
      SU.circle(ctx, 50, 50, 56, "#FF0");
			ctx.globalCompositeOperation = 'destination-out';
      SU.circle(ctx, 50, 50, 36, "#000");
      SU.line(ctx, 50, -10, 50, 110, "#000", 22);
			ctx.globalCompositeOperation = 'source-over';
      SU.line(ctx, 0, 50, 100, 50, "#FF0", 22); // Middle bar.
			ctx.globalCompositeOperation = 'destination-over';
      var colorStops = [0, 'rgba(255, 255, 255, 0.3)', 1, 'rgba(255, 255, 255, 0)'];
      SU.circleRad(ctx, 50, 50, 50, colorStops);
			
			// Squish the image vertically a bit.
      img2 = document.createElement('canvas');
      img2.width = 100;
      img2.height = 100;
			ctx2 = img2.getContext('2d');

			ctx2.transform(1, 0, 0, 0.6, 0, 0);
      ctx2.drawImage(img, 0, 30);
			shipyardimg = img;
		}
		function initRuins() {
			// Simple broken building in black with white highlight.
      ruinsimg = document.createElement('canvas');
      ruinsimg.width = 100;
      ruinsimg.height = 100;
			ctx = ruinsimg.getContext('2d');
		
      var colorStops = [0, 'rgba(255, 255, 255, 0.3)', 1, 'rgba(255, 255, 255, 0)'];
      SU.circleRad(ctx, 50, 50, 50, colorStops);
			ctx.beginPath();
			ctx.moveTo(10, 90);
			ctx.lineTo(10, 50);
			ctx.lineTo(40, 20);
			ctx.lineTo(40, 35);
			ctx.lineTo(40, 40);
			// Begin jagged.
			ctx.lineTo(43, 43);
			ctx.lineTo(45, 50);
			ctx.lineTo(50, 45);
			ctx.lineTo(52, 43);
			ctx.lineTo(54, 45);
			ctx.lineTo(65, 49);
			ctx.lineTo(65, 42);
			ctx.lineTo(67, 42);
			ctx.lineTo(67, 40);
			ctx.lineTo(70, 40);
			ctx.lineTo(80, 50);
			ctx.lineTo(83, 60);
			ctx.lineTo(90, 60);
			// End jagged.
			ctx.lineTo(90, 90);
			ctx.lineTo(60, 90);
			ctx.lineTo(60, 70);
			ctx.lineTo(40, 70);
			ctx.lineTo(40, 90);
			ctx.lineTo(10, 90);
			ctx.closePath();
      ctx.fillStyle = "#000";
      ctx.fill();
		}
		function initConstruction() {
			// Similar to other icons, but can't have the strong white light in the background.
      let img = document.createElement('canvas');
      img.width = 100;
      img.height = 100;
			let ctx = img.getContext('2d');
      let colorStops = [0, 'rgba(255,255,255,0.5)', 1, 'rgba(255,255,255,0.0)'];
      SU.circleRad(ctx, 50, 100, 60, colorStops);
			SU.text(ctx, '🏗️', 50, 80, 'bold 60pt '+SF.FONT, "#000", 'center');
			constructionimg = img;
		}
		/*
    // temple image
    function setTempleColorTimeout() {
        this.colortimeout = S$.time + 1000;
    }
		*/
    function drawTempleRect(imagecontext, x, y) {
        var r = Math.floor(Math.random() * 128);
        var g = Math.floor(Math.random() * 128);
        var b = Math.floor(Math.random() * 128);
        var color = 'rgb(' + (r + 128) + ',' + (g + 128) + ',' + (b + 128) + ')';
        var colordark = 'rgb(' + (r) + ',' + (g) + ',' + (b) + ')';
        SU.rect(imagecontext, x + 1, y + 1, imagesize / 3 - 2, imagesize / 3 - 2, color, colordark, 2);
    }		
    function initTempleBar() {
        //this.setTempleColorTimeout();
        let image = document.createElement('canvas');
        image.width = imagesize;
        image.height = imagesize;
        imagecontext = image.getContext('2d');
        drawTempleRect(imagecontext, imagesize / 3, 0);
        drawTempleRect(imagecontext, imagesize / 6, imagesize / 3);
        drawTempleRect(imagecontext, imagesize / 2, imagesize / 3);
        drawTempleRect(imagecontext, 0, imagesize * 2 / 3);
        drawTempleRect(imagecontext, imagesize / 3, imagesize * 2 / 3);
        drawTempleRect(imagecontext, imagesize * 2 / 3, imagesize * 2 / 3);
        SU.rect(imagecontext, imagesize / 2 - 4, imagesize - 13, 8, 13, '#000'); // door
				templebarimg = image;
    }
    function initTemple() {
        let image = document.createElement('canvas');
        image.width = imagesize;
        image.height = imagesize;
        imagecontext = image.getContext('2d');
				for (let i = 0; i < 50; i++) {
					let r = Math.floor(Math.random()*100)+156;
					let g = Math.floor(Math.random()*100)+156;
					let b = Math.floor(Math.random()*100)+156;
					SU.line(imagecontext, imagesize/2, imagesize, Math.random()*imagesize, 0, 'rgb('+r+','+g+','+b+')');
				}
	      imagecontext.drawImage(templebarimg, 0, 0);
				templeimg = image;
    }		
		/*
    function updateTempleImage() {
        var rand = Math.random();
        if (rand < 1 / 6) {
            this.drawTempleRect(imagesize / 3, 0);
        } else if (rand < 2 / 6) {
            this.drawTempleRect(imagesize / 6, imagesize / 3);
        } else if (rand < 3 / 6) {
            this.drawTempleRect(imagesize / 2, imagesize / 3);
        } else if (rand < 4 / 6) {
            this.drawTempleRect(0, imagesize * 2 / 3);
        } else if (rand < 5 / 6) {
            this.drawTempleRect(imagesize / 3, imagesize * 2 / 3);
            SU.rect(this.imagecontext, imagesize / 2 - 4, imagesize - 13, 8, 13, '#000'); // door
        } else {
            this.drawTempleRect(imagesize * 2 / 3, imagesize * 2 / 3);
        }
    }
		*/

		function drawBaseImages() {
			if (labimg !== null) {
				// Already initialized them.
				return;
			}
			DrawPirate();
			DrawAlpha();
	  	DrawPlatform();
      initBar();
      initTempleBar();
      initTemple();
      initMine();
      initLab();
      initColony();
      initHotel();
      initObservatory();
      initJob();
      initShipyard();
      initRuins();
			// Derelict is missing. Depends on the ship.
			initConstruction();
			
			skullbarimg = SU.InitIconImage('☠');
			armoryimg = SU.InitIconImage('⚔️');
			cityartiimg = SU.InitIconImage('🏙️');
			AddIconSymbol(cityartiimg, "🛡")
			cityoreimg = SU.InitIconImage('🏙️');
			AddIconSymbol(cityoreimg, "⛏")
			citygoodsimg = SU.InitIconImage('🏙️');
			AddIconSymbol(citygoodsimg, "📦")
			citycontraimg = SU.InitIconImage('🏙️');
			AddIconSymbol(citycontraimg, "🍄")
			cityallimg = SU.InitIconImage('🏙️');
			AddIconSymbol(cityallimg, "⭐")
			cityspecialimg = SU.InitIconImage('🏙️');
			AddIconSymbol(cityspecialimg, "❗️")
			cityshipimg = SU.InitIconImage('🏙️');
			AddIconSymbol(cityshipimg, "🚀")			
			informationimg = SU.InitIconImage('ⓘ');
			animalimg = SU.InitIconImage('🐃'); // 🦓 🐺 🦍🐘🦏 🕷
			goodyhutimg = SU.InitIconImage('🍙'); // 🏠 🏡
			arenaimg = SU.InitIconImage('🏟️');  // ⚔️ 🏟️
			obeliskimg = SU.InitIconImage('☗');
			universityimg = SU.InitIconImage('🏫');
			alphabarracksimg = SU.InitIconImage('🏯');
			alphaairportimg = SU.InitIconImage('✈');
			alphahqimg = SU.InitIconImage('☥');
			alphadanceimg = SU.InitIconImage('✨');
			cornfieldimg = SU.InitIconImage('🌽');
			backupderelictimg = SU.InitIconImage('🗼');
			backupcustomshipimg = SU.InitIconImage('🚀');
			//normalimg = SU.InitIconImage('•');
			//normalimg = SU.InitIconImage('⚐');
			normalimg = SU.InitIconImage(' ', /*skip_halo=*/true);  // Intentionally blank.
			custommineimg = SU.InitIconImage('⚒');
			treasureimg = SU.InitIconImage('🔒', /*skip_halo=*/true);//TreasureImage();
		}
		
		SBar.GetBuildingImage = function(type) {
			drawBaseImages();
      switch (type) {
        case SF.TYPE_BAR:
						return pubimg;
        case SF.TYPE_TEMPLE_BAR:
						return templebarimg;
        case SF.TYPE_TEMPLE:
						return templeimg;
        case SF.TYPE_MINING:
					return mineimg;
        case SF.TYPE_ARMORY:
					return armoryimg;
        case SF.TYPE_LAB:
					return labimg;
        case SF.TYPE_CITY_ARTI:
					return cityartiimg;
        case SF.TYPE_CITY_ORE:
					return cityoreimg;
        case SF.TYPE_CITY_GOODS:
					return citygoodsimg;
        case SF.TYPE_CITY_CONTRA:
					return citycontraimg;
        case SF.TYPE_CITY_ALL:
					return cityallimg;
        case SF.TYPE_CITY_SPECIAL:
					return cityspecialimg;
        case SF.TYPE_CITY_SHIP:
					return cityshipimg;
        case SF.TYPE_COLONY:
					return colonyimg;
        case SF.TYPE_HOTEL:
					return hotelimg;
        case SF.TYPE_OBSERVATORY:
					return observatoryimg;
        case SF.TYPE_JOB:
					return jobimg;
        case SF.TYPE_SHIPYARD:
					return shipyardimg;
        case SF.TYPE_RUINS:
					return ruinsimg;
        case SF.TYPE_DERELICT:
					return backupderelictimg;
        case SF.TYPE_INFORMATION:
					return informationimg;
        case SF.TYPE_ANIMAL:
					return animalimg;
        case SF.TYPE_GOODY_HUT:
					return goodyhutimg;
        case SF.TYPE_ARENA:
					return arenaimg;
        case SF.TYPE_CONSTRUCTION:
					return constructionimg;
				case SF.TYPE_OBELISK:
					return obeliskimg;
				case SF.TYPE_UNIVERSITY:
					return universityimg;
				case SF.TYPE_ALPHA_BARRACKS:
					return alphabarracksimg;
				case SF.TYPE_ALPHA_AIRPORT:
					return alphaairportimg;
				case SF.TYPE_ALPHA_HQ:
					return alphahqimg;
				case SF.TYPE_ALPHA_DANCE:
					return alphadanceimg;
				case SF.TYPE_CORNFIELD:
					return cornfieldimg;
				case SF.TYPE_CUSTOM_MINE:
					return custommineimg;
				case SF.TYPE_CUSTOM_TREASURE:
					return treasureimg;
				case SF.TYPE_CUSTOM_SHIP:
					return backupcustomshipimg;
        default:
          error("unrecognized building type (icon): " + type);		
			}	
		}

		SBar.GetFactionImage = function(faction) {
			if (faction === SF.FACTION_NORMAL) {
				return normalimg;
			}
			if (faction === SF.FACTION_PIRATE) {
				return pirateimg;
			}
			if (faction === SF.FACTION_ALPHA) {
				return alphaimg;
			}
			error("noimggfi",faction);
		}
		
		//
		// Class below.
		//
 
    SBar.IconBuilding = function(context, data/*(SBar.BuildingData)*/, floating) {
        this._initIconBuilding(context, data, floating);
    };

    SBar.IconBuilding.prototype = {
      data: null,
      imagecontext: null,
      image: null,
			drawsize:30,
      quest: false,
      // temple variables
      colortimeout: 0,
      templeEffect: null,
		  floating: false,
			_initIconBuilding: function(context, data, floating) {
            this.context = context;
            this.data = data;
						if (floating) {
							this.floating = true;
						}
            this.draw();

            for (var i = 0; i < S$.quests.length; i++) {
                if (S$.quests[i].ts === this.data.seed) {
                    this.quest = new SBar.IconQuestTarget(S$.quests[i], this.context, 0, 0);
                }
            }
        },
        // also called by lower levels to redraw
        draw: function() {
					drawBaseImages();
					this.image = SBar.GetBuildingImage(this.data.type);		
          switch (this.data.type) {
            case SF.TYPE_BAR:
							if (this.data.parentData && this.data.parentData.is_pirate_base && this.data.x === SF.HALF_WIDTH && this.data.y === SF.HALF_HEIGHT) {
								this.image = skullbarimg;
							}
              break;
            case SF.TYPE_TEMPLE_BAR:
              if (S$.found(this.data.seed + SF.TYPE_TEMPLE_BAR)) {
                this.templeEffect = new SBar.IconTempleEffect(this.context, this.data.x, this.data.y, true);
              }
              break;
            case SF.TYPE_TEMPLE:
              if (S$.found(this.data.seed + SF.TYPE_TEMPLE)) {
                  this.templeEffect = new SBar.IconTempleEffect(this.context, this.data.x, this.data.y, false);
              }
              break;
            case SF.TYPE_DERELICT:
							// Note level doesn't matter here, GetImage() specifies the size.
							this.image = new SBar.Ship(/*type=*/SF.SHIP_ALPHA, /*level=*/1, this.data.seed, 0).GetImage(imagesize*2, /*rotate=*/true, imagesize*2);
              break;
          }
        },
        update: function(shipx, shipy, scalex, scaley, skip_name) {
						var datax = this.data.x;
						var datay = this.data.y;
						if (scalex) {
							datax *= scalex;
							datay *= scaley;
						}
            if (this.templeEffect !== null) {
                this.templeEffect.update(0, 0, /*fromplanet=*/true, scalex, scaley);
            }
            if (this.quest) {
                this.quest.update(-datax, -datay, true);
            }
            if (this.data.faction === SF.FACTION_PIRATE) {
                this.context.drawImage(pirateimg, datax - this.drawsize, datay - this.drawsize - this.drawsize / 2, this.drawsize*2, this.drawsize*2);
            }
            if (this.data.faction === SF.FACTION_ALPHA && this.data.type !== SF.TYPE_ANIMAL) {
                this.context.drawImage(alphaimg, datax - this.drawsize, datay - this.drawsize - this.drawsize / 2, this.drawsize*2, this.drawsize*2);
            }
						if (this.floating) {
							if (platformimg === null) {
								DrawPlatform();
							}
	            this.context.drawImage(platformimg, datax - this.drawsize / 2, datay - this.drawsize / 2+5, this.drawsize, this.drawsize);
						}
            this.context.drawImage(this.image, datax - this.drawsize / 2, datay - this.drawsize / 2, this.drawsize, this.drawsize);
						/*
            if (S$.found(this.data.seed) && this.data.type !== SF.TYPE_TEMPLE) {
                // artifact or trade has been removed
                this.context.drawImage(SM.buttCheck, datax - SM.buttCheck.width / 4, datay - SM.buttCheck.height / 4, SM.buttCheck.width/2, SM.buttCheck.height/2);
            }
						*/
						/*
            if (this.data.type === SF.TYPE_TEMPLE || this.data.type === SF.TYPE_TEMPLE_BAR) {
                if (S$.time > this.colortimeout) {
                    this.updateTempleImage();
                    this.setTempleColorTimeout();
                }
            }
						*/
						if (!skip_name) {
		          var offx = this.data.x - shipx;
		          var offy = this.data.y - shipy;
		          if (Math.abs(offx) + Math.abs(offy) < this.drawsize*0.65) {
								SU.text(this.context, this.data.name[0]+" "+this.data.name[1], datax, datay-20, SF.FONT_SB, "#FFF", 'center');
							}
						}
            return true;
        },
				TryActivate: function(shipx, shipy) {
          var offx = this.data.x - shipx;
          var offy = this.data.y - shipy;
          if (Math.abs(offx) + Math.abs(offy) < this.drawsize*0.65) {
              //if (!this.data.justentered) {
                  //this.data.activateTier();
                  return true;
              //}
//          } else if (this.data.justentered) { // outside range
//              this.data.justentered = false;
          }
					return false;
				},
    };
    SU.extend(SBar.IconBuilding, SBar.Icon);
})();

