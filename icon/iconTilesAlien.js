/*
Utilities for handling the alien shape.
Not this is separate from SBar.AlienIcon in part for caching data like the
valid points, which doesn't belong in the ship object.

In the current implementation, the image needs to get drawn to determine where
the tiles can be placed.
*/

(function() {
	var tilesize = SF.ARTI_TILE_SIZE;

  SBar.IconTilesAlien = function(seed, raceseed, has_sell_callback, crew_obj, show_stash) {
    this._initIconTilesAlien(seed, raceseed, has_sell_callback, crew_obj, show_stash);
  };

  SBar.IconTilesAlien.prototype = {
		draw_context: null,
		draw_image: null,
		context: null,
		alien_image: null,
		valid_points: null,
		seed: null,
		raceseed: null,
		has_sell_callback: null,
		show_stash: null,
    _initIconTilesAlien: function(seed, raceseed, has_sell_callback, crew_obj, show_stash) {
			//this.alien_icon = new SBar.IconAlien(seed, raceseed, /*data_type=*/-1, /*data_faction=*/-1, /*is_home_bar=*/false, /*override_random=*/true, {has_sell_callback: has_sell_callback});			
			this.show_stash = show_stash;
			this.alien_image = crew_obj.GetCachedImage();
			this.seed = seed;
		  this.valid_points = {};
      this.draw_image = document.createElement('canvas');
      this.draw_image.width = SF.WIDTH;
      this.draw_image.height = SF.HEIGHT;
			this.draw_context = this.draw_image.getContext('2d');
			this.raceseed = raceseed;
			this.has_sell_callback = has_sell_callback;
			this.DrawAlienTiles();
    },
		DrawAlienTiles: function() {
      this.temp_image = document.createElement('canvas');
      this.temp_image.width = SF.WIDTH;
      this.temp_image.height = SF.HEIGHT;
			this.temp_context = this.temp_image.getContext('2d');
			
			var image_size = SF.HEIGHT;
			var image = this.alien_image;
      this.draw_context.drawImage(image,  0, 0);
			SU.DrawBags(this.draw_context, /*do_backpack=*/this.raceseed===SF.RACE_SEED_HUMAN, /*sell_instead=*/this.has_sell_callback);
			if (this.show_stash) {
				this.AddStash();
			}			

			//this.temp_context.clearRect(rawx, rawy, tilesize, tilesize);
			let draw_size = this.seed === 0 ? SF.WIDTH : image_size;
			SU.AddTileBorders(this.draw_context, draw_size, tilesize, this.valid_points);
			return;
			/*
			
			var img_data = this.draw_context.getImageData(0, 0, SF.WIDTH, SF.HEIGHT).data;
			var half_x = Math.floor(image_size/tilesize/2*1.2);
			if (this.seed === 0) {
				// Human player, go far left for backpack and trash.
				var half_x = Math.floor(SF.WIDTH/tilesize/2);
			}
			var half_y = Math.floor(image_size/tilesize/2);
			
			// Draw borders. To allow for a gradient, stamp the area then fill it in.
			for (var x = -half_x; x < half_x; x++) {
				for (var y = -half_y; y < half_y; y++) {
					var rawx = SF.HALF_WIDTH + x*tilesize;
					var rawy = SF.HALF_HEIGHT + y*tilesize;
					var point = rawx + tilesize/2+(rawy + tilesize/2)*SF.WIDTH;
					if (img_data[point*4+3] !== 0 || img_data[point*4-1] !== 0) {  // Anything drawn here. And check symmetry.
						//SU.rect(this.temp_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");
						//this.temp_context.clearRect(rawx, rawy, tilesize, tilesize);
//						SU.rect(this.temp_context, rawx-4, rawy-4, tilesize+8, tilesize+8, "#000");
						SU.rect(this.temp_context, rawx-1, rawy-1, tilesize+2, tilesize+2, "#FFF");
//						SU.circle(this.temp_context, rawx, rawy, 1, "rgba(255,255,255,0.75)");
						this.valid_points[x+','+y] = true;
					}
				}
			}
			
			this.temp_context.save();
			this.temp_context.globalCompositeOperation = "source-in";
			SU.rect(this.temp_context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(255,255,255,0.5)");
			this.temp_context.restore();
			
//			SU.rect(this.temp_context, 0, 0, SF.WIDTH, SF.HEIGHT, "rgba(0,0,0,0.25)");
			
			
			// Clear centers.
			for (var x = -half_x; x < half_x; x++) {
				for (var y = -half_y; y < half_y; y++) {
					var rawx = SF.HALF_WIDTH + x*tilesize;
					var rawy = SF.HALF_HEIGHT + y*tilesize;
					var point = rawx + tilesize/2+(rawy + tilesize/2)*SF.WIDTH;
					if (img_data[point*4+3] !== 0 || img_data[point*4-1] !== 0) {  // Anything drawn here. And check symmetry.
						//SU.rect(this.temp_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");
						this.temp_context.clearRect(rawx, rawy, tilesize, tilesize);
//						SU.circle(this.temp_context, rawx, rawy, 1, "rgba(255,255,255,0.75)");
						this.valid_points[x+','+y] = true;
					}
				}
			}
			this.draw_context.drawImage(this.temp_image, 0, 0);
			*/
		},
		// Indicates if the given title is ship interior.
		IsValid: function(square_x, square_y) {
			return this.valid_points[square_x+','+square_y] == true;
		},
    update: function(context, x, y) {
			context.drawImage(this.draw_image, x-SF.HALF_WIDTH, y-SF.HALF_HEIGHT);
    },
		AddStash: function() {
			let tile_x = 9;
			let tile_y = -3;
			let tile_width = 15;
			let tile_height = 13;
			SU.rectCorner(this.draw_context, 16, tilesize*tile_x-4+SF.HALF_WIDTH, tilesize*tile_y-4+SF.HALF_HEIGHT, tilesize*tile_width+8, tilesize*tile_height+8, '#444', 'rgb(0,0,0)', 4);
      SU.text(this.draw_context, "🔒", tilesize*(tile_x+tile_width/2)+SF.HALF_WIDTH, tilesize*(tile_y+tile_height/2)+SF.HALF_HEIGHT+50, 'bold 100pt '+SF.FONT, '#FFF', 'center');
		},
	
	};
  
  SU.extend(SBar.IconTilesAlien, SBar.Icon);
})();

