/*
Utilities for handling the ship shape.
Note this is separate from SBar.Ship in part for caching data like the
valid points, which doesn't belong in the ship object.

In the current implementation, the image needs to get drawn to determine where
the tiles can be placed.
*/

(function() {
	var tilesize = SF.ARTI_TILE_SIZE;

  SBar.IconTilesShip = function(ship) {
    this._initIconTilesShip(ship);
  };

  SBar.IconTilesShip.prototype = {
		draw_context: null,
		draw_image: null,
		context: null, // Image.
		ship: null,  // SBar.Ship type.
		valid_points: null,
    _initIconTilesShip: function(ship) {
			this.ship = ship;
		  this.valid_points = {};
      this.draw_image = document.createElement('canvas');
      this.draw_image.width = SF.WIDTH;
      this.draw_image.height = SF.HEIGHT;
			this.draw_context = this.draw_image.getContext('2d');
			this.DrawShipTiles();
    },
		DrawShipTiles: function() {
			var image_size = SF.WIDTH;
			var image = this.ship.GetCachedImage(); 

/*
			// Add trash section.
			let image_context = image.getContext('2d');
      SU.rectCorner(image_context, 8, -460, 200, 200, 160, '#444', 'rgb(0,0,0)', 2);
			image_context.globalAlpha = 0.5;
      SU.text(image_context, "🗑", -360, SF.HALF_HEIGHT-63, 'bold 100pt '+SF.FONT, '#FFF', 'center');
			image_context.globalAlpha = 1;
			*/
			
      this.draw_context.drawImage(image, (-image_size) / 2 + SF.HALF_WIDTH, (-image_size) / 2 + SF.HALF_HEIGHT, image_size, image_size);
			SU.DrawBags(this.draw_context, /*do_backpack=*/false, /*sell_instead=*/false);		
			
			SU.AddTileBorders(this.draw_context, image_size, tilesize, this.valid_points);
/*			
			
			var img_data = this.draw_context.getImageData(0, 0, SF.WIDTH, SF.HEIGHT).data;
			var half_x = Math.floor(image_size/tilesize/2);
			var half_y = Math.floor(image_size/tilesize/2);
			for (var x = -half_x; x < half_x; x++) {
				for (var y = -half_y; y < half_y; y++) {
					var rawx = SF.HALF_WIDTH + x*tilesize;
					var rawy = SF.HALF_HEIGHT + y*tilesize;
					var point = rawx + tilesize/2+(rawy + tilesize/2)*SF.WIDTH;
					if (img_data[point*4+3] !== 0 || img_data[point*4-1] !== 0) {  // Anything drawn here. And check symmetry.
						SU.rect(this.draw_context, rawx, rawy, tilesize, tilesize, "rgba(0,0,0,0.25)");
						SU.circle(this.draw_context, rawx, rawy, 1, "rgba(0,0,0,0.75)");
						this.valid_points[x+','+y] = true;
					}
				}
			}
			*/
		},
		// Indicates if the given tile is ship interior.
		IsValid: function(square_x, square_y) {
			return this.valid_points[square_x+','+square_y] == true;
		},
    update: function(context, x, y) {
			context.drawImage(this.draw_image, x-SF.HALF_WIDTH, y-SF.HALF_HEIGHT);
    },
	};
  
  SU.extend(SBar.IconTilesShip, SBar.Icon);
})();

