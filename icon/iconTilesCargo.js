/*
Ship cargo shape.
*/

(function() {
	var tilesize = SF.ARTI_TILE_SIZE;

  SBar.IconTilesCargo = function(ship, show_stash, has_sell_callback) {
    this._initIconTilesCargo(ship, show_stash, has_sell_callback);
  };

  SBar.IconTilesCargo.prototype = {
		draw_context: null,
		draw_image: null,
		context: null, // Image.
		ship: null,  // SBar.Ship type.
		valid_points: null,
		show_stash: false,
		has_sell_callback: null,
    _initIconTilesCargo: function(ship, show_stash, has_sell_callback) {
			this.ship = ship;
		  this.valid_points = {};
      this.draw_image = document.createElement('canvas');
      this.draw_image.width = SF.WIDTH;
      this.draw_image.height = SF.HEIGHT;
			this.draw_context = this.draw_image.getContext('2d');
			this.show_stash = show_stash;
			this.has_sell_callback = has_sell_callback;
			this.DrawCargoTiles();
    },
		DrawCargoTiles: function() {
			var image_size = SF.WIDTH;
			var image = this.ship.GetCachedImage(); 

/*
			// Add trash section.
			let image_context = image.getContext('2d');
      SU.rectCorner(image_context, 8, -460, 200, 200, 160, '#444', 'rgb(0,0,0)', 2);
			image_context.globalAlpha = 0.5;
			let trash_icon = "🗑";
			if (this.has_sell_callback) {
				trash_icon = SF.SYMBOL_CREDITS;
			}			
      SU.text(image_context, trash_icon, -360, SF.HALF_HEIGHT-63, 'bold 100pt '+SF.FONT, '#FFF', 'center');
			image_context.globalAlpha = 1;
			*/
      this.draw_context.drawImage(image, (-image_size) / 2 + SF.HALF_WIDTH, (-image_size) / 2 + SF.HALF_HEIGHT, image_size, image_size);
			//this.draw_context.drawImage(image, -image_size*1.2 + SF.HALF_WIDTH, -image_size + SF.HALF_HEIGHT, image_size*2, image_size*2);
			
			SU.DrawBags(this.draw_context, /*do_backpack=*/false, /*sell_instead=*/this.has_sell_callback);			
			if (this.show_stash) {
				this.AddStash();
			}			
			
			var img_data = this.draw_context.getImageData(0, 0, SF.WIDTH, SF.HEIGHT).data;
			
			let cargo_width = Math.floor(Math.sqrt(this.ship.max_cargo));
			if (cargo_width > 15) {
				cargo_width = 15;
			}
			let cargo_height = Math.floor(this.ship.max_cargo/cargo_width);
			let remainder = this.ship.max_cargo % cargo_width;
			
			//SU.rect(this.draw_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");			
			let ystart = -Math.floor(cargo_height/2) - 1;
			let full_height = cargo_height;
			if (remainder > 0) full_height++;
			SU.rectCorner(this.draw_context, 4, SF.HALF_WIDTH-4+tilesize, SF.HALF_HEIGHT+ystart*tilesize-4, cargo_width*tilesize+8, full_height*tilesize+8, 'rgba(0,0,0,0.5)');
			
			for (let y = ystart; y < ystart+cargo_height; y++) {
				for (let x = 1; x < cargo_width+1; x++) {
					this.AddTile(x, y);
				}
			}
			let y = ystart+cargo_height;
			for (let x = 1; x < remainder+1; x++) {
				this.AddTile(x, y);
			}
		},
		// Borrowed from ship implementation.
		AddTile: function(x, y) {
			var rawx = SF.HALF_WIDTH + x*tilesize;
			var rawy = SF.HALF_HEIGHT + y*tilesize;
			SU.rect(this.draw_context, rawx, rawy, tilesize, tilesize, "rgba(255,255,255,0.25)");
			SU.circle(this.draw_context, rawx, rawy, 1, "rgba(0,0,0,0.75)");
			this.valid_points[x+','+y] = true;
		},
		AddStash: function() {
			SU.rectCorner(this.draw_context, 4, -tilesize*16-4+SF.HALF_WIDTH, -tilesize*11-4+SF.HALF_HEIGHT, tilesize*15+8, tilesize*20+8, '#444', 'rgb(0,0,0)', 2);
      SU.text(this.draw_context, "🔒", -165+SF.HALF_WIDTH, 20+SF.HALF_HEIGHT, 'bold 100pt '+SF.FONT, '#FFF', 'center');
			for (let y = -11; y < 9; y++) {
				for (let x = -16; x < -1; x++) {
					this.AddTile(x, y);
				}
			}
		},
		// Indicates if the given tile is ship interior.
		IsValid: function(square_x, square_y) {
			return this.valid_points[square_x+','+square_y] == true;
		},
    update: function(context, x, y) {
			context.drawImage(this.draw_image, x-SF.HALF_WIDTH, y-SF.HALF_HEIGHT);
    },
	};
  
  SU.extend(SBar.IconTilesCargo, SBar.Icon);
})();

