/*
 * Core Map Object
 * 
 * Main elements:
 *   1. A "wall map" supplied to the map object, consisting of a black(blocked)+white(clear) image of the terrain. Typical size a multiple of 120x80
 *   2. A background image. Drawn behind the map and has no impact on gameplay itself, purely aestetic
 *   
 * The map object generates
 *   3. Hex grid based on sampling the wall map
 *   
 * Utilities:
 *   - isHexValid (blocked or clear)  
 *   
 */
(function() {

    var hexSize = null; // pixels
    var heightRatio = 0.866025; // ratio of hex height vs width
    var hexHeight = null;
    var hexImg = null;

    JTact.Map = function(wallMap, backgroundImg, buildingImg, width, height) {
        this._initMap(wallMap, backgroundImg, buildingImg, width, height);
    };

    JTact.Map.prototype = {
        name: "Unnamed",
        wallMap: null,
        mapData: null,  // Image data. Storing different stuff in different colors. +1 is the move map.
        background: null,
        grid: null,
        width: null,
        height: null,
        wallWidth: null,
        wallHeight: null,
        // Variables for calculating movement
        targetImg: null,
        targetImgCtx: null,
        moveHexImg: null,
        shadowHexImg: null, // border around targeting hexes
			_initMap: function(wallMapIn, backgroundImg, buildingImg, width, height) {
            hexSize = TF.HEX_SIZE;
            hexHeight = hexSize * heightRatio;
            this.width = width;
            this.height = height;
            this.background = backgroundImg;
						this.building = buildingImg;
            if (hexImg === null) {
                this.buildHexImage();
            }
            this.setupObjs();
            this.sampleWallMap(wallMapIn);
            this.buildGrid();
            TG.data.mapEffects = new JTact.MapEffects();
        },
        setupObjs: function() {
            this.targetImg = document.createElement('canvas');
            this.targetImg.width = TF.WIDTH;
            this.targetImg.height = TF.HEIGHT;
            this.targetImgCtx = this.targetImg.getContext('2d');

            this.moveHexImg = document.createElement('canvas');
            this.moveHexImg.width = hexSize;
            this.moveHexImg.height = hexSize;
            var ctx = this.moveHexImg.getContext('2d');
            TU.regularPolygon(ctx, hexSize / 2, hexSize / 2, 6, hexSize / 2, "rgba(0,0,255,0.5)");

            this.shadowHexImg = document.createElement('canvas');
            this.shadowHexImg.width = hexSize;
            this.shadowHexImg.height = hexSize;
            ctx = this.shadowHexImg.getContext('2d');
            TU.regularPolygon(ctx, hexSize / 2, hexSize / 2, 6, hexSize / 2, "rgba(0,0,0,0.7)");
        },
        // condense the provided larger wall map into a tight hex matrix (sample it)
        // can't just draw the original map onto a smaller one, because it would be doing squares instead of offset hexes
        sampleWallMap: function(startMap) {
            var startWidth = startMap.width;
            var startHeight = startMap.height;
            var startDataObj = startMap.getContext("2d").getImageData(0, 0, startWidth, startHeight);
            var startData = startDataObj.data;

            this.wallMap = document.createElement('canvas');
            this.wallMap.width = this.width;
            this.wallMap.height = this.height;
            var ctx = this.wallMap.getContext('2d');
            TU.rect(ctx, 0, 0, this.width, this.height, "#000");
            var mapDataObj = ctx.getImageData(0, 0, this.width, this.height);
            this.mapData = mapDataObj.data;

						var half_hex = Math.floor(hexSize/2);
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    // source x,y
									var rawx = hexSize * x;
									if (y % 2) rawx += half_hex;
									var rawy = Math.floor(hexSize * y * heightRatio);
									if (rawx < startMap.width && rawy < startMap.height && startData[(rawx + rawy * startWidth) * 4] > 127) {
                    this.mapData[(x + y * this.width) * 4] = 255;
									}
                }
            }
            ctx.putImageData(mapDataObj, 0, 0);
        },
        // Build the image of hexes, based on the tight hex matrix
        buildGrid: function() {
            if (this.grid === null) {
                this.grid = document.createElement('canvas');
                this.grid.width = this.width * hexSize;
                this.grid.height = this.height * hexSize;
            } else {
                var ctx2 = this.grid.getContext('2d');
                ctx2.clearRect(0, 0, this.grid.width, this.grid.height);
            }
            var ctx = this.grid.getContext('2d');

            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    // target x,y
                    var tx = (y % 2 ? x * hexSize + hexSize / 2 : x * hexSize); // get x, offset odd rows
                    var ty = y * hexHeight; // get x, offset odd rows

                    if (this.mapData[(x + y * this.width) * 4] === 255) {
                        ctx.drawImage(hexImg, tx - hexSize / 2, ty - hexSize / 2);
                    }
                }
            }
        },
        drawGrid: function() {
            TC.layer1.drawImage(this.grid, 0, 0);
        },
        // Draws a single hex
        buildHexImage: function() {
            hexImg = document.createElement('canvas');
            hexImg.width = hexSize;
            hexImg.height = hexSize;
            var ctx = hexImg.getContext('2d');
//            TU.regularPolygon(ctx, hexSize / 2, hexSize / 2, 6, hexSize / 2, "rgba(0,0,0,0.24)", "rgba(0,0,0,0.1)", 1);
            TU.regularPolygon(ctx, hexSize / 2, hexSize / 2, 6, hexSize / 2, "rgba(0,0,0,0.10)");
        },
        // Is this hex on the map?
        isValid: function(x, y) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
							// Value of 1 means something is blocking. Value of 0 means off map.
                if (this.mapData[(x + y * this.width) * 4] > 1) {
                    return true;
                }
            }
            return false;
        },
				// Returns true if the size is valid at the center point.
				isValidStamp: function(x, y, size) {
					if (!this.isValid(x,y)) {
						return false;
					}
          var rad = Math.floor(size / 2);
					for (var i = 1; i <= rad; i++) {
						var hexes = this.collectHexes(x, y, i);
						for (let hex of hexes) {
							if (!this.isValid(hex[0], hex[1])) {
								return false;
							}
						}
					}
					return true;					
				},
        // get canvas x,y for given hex x,y. Goes to center of the hex
        getFullXY: function(x, y) {
            var tx = (y % 2 ? x * hexSize + hexSize / 2 : x * hexSize); // get x, offset odd rows
            var ty = y * hexHeight; // get x, offset odd rows
            return [Math.round(tx), Math.round(ty)];
        },
        // get closest (covering) hex x,y for the given canvas coordinates
        getHexXY: function(x, y) {
            var hexx = Math.round(x / hexSize);
            var hexy = Math.round(y / hexHeight);
            // test this one and the six nearby cells and take the closest
            var offx = hexy % 2; // shifted
            var obj = [99999999, 0, 0]; // [bestDist, besthexx, besthexy]
            this.checkForBetter(x, y, hexx, hexy, obj);
            this.checkForBetter(x, y, hexx - 1, hexy, obj);
            this.checkForBetter(x, y, hexx + 2, hexy, obj);
            this.checkForBetter(x, y, hexx - 1 + offx, hexy - 1, obj);
            this.checkForBetter(x, y, hexx + offx, hexy - 1, obj);
            this.checkForBetter(x, y, hexx - 1 + offx, hexy + 1, obj);
            this.checkForBetter(x, y, hexx + offx, hexy + 1, obj);
            return [obj[1], obj[2]];
        },
        // part of getHexXY() to find the closest hex. retobj format is [bestDist, besthexx, besthexy]
        checkForBetter: function(x, y, checkhexx, checkhexy, retObj) {
            var xy = this.getFullXY(checkhexx, checkhexy);
            var dx = xy[0] - x;
            var dy = xy[1] - y;
            var dist = dx * dx + dy * dy;
            if (dist < retObj[0]) {
                retObj[0] = dist;
                retObj[1] = checkhexx;
                retObj[2] = checkhexy;
            }
        },
        // given canvas x,y, returns the closest hex center x,y
        getHexFullXY: function(x, y) {
            var xy = this.getHexXY(x, y);
            return this.getFullXY(xy[0], xy[1]);
        },
        // gets the distance from source for the given hex, requres the target/move map to have been built
        getTargetDist: function(x, y) {
            return this.mapData[(x + y * this.width) * 4 + 1];
        },
        // Get the distance between two hexes. algorithm from http://www.redblobgames.com/grids/hexagons/#conversions
        getHexDist: function(x1, y1, x2, y2) {
            var c1x = x1 - (y1 - (y1 & 1)) / 2;
            var c1z = y1;
            var c1y = -c1x - c1z;

            var c2x = x2 - (y2 - (y2 & 1)) / 2;
            var c2z = y2;
            var c2y = -c2x - c2z;

            var ret = (Math.abs(c1x - c2x) + Math.abs(c1y - c2y) + Math.abs(c1z - c2z)) / 2;
            return ret;
        },
        // check if two hexes cover one another, like checking if a hero is on a terrain feature
        overlaps: function(x1, y1, size1, x2, y2, size2) {
            size1 = (size1 - 1) / 2;
            size2 = (size2 - 1) / 2;
            var dist = this.getHexDist(x1, y1, x2, y2);
            return (dist < size1 + size2 + 1);
        },
        // Mark the hexes where the player can target, and then create an image of it
        // Algorithm is a "flood fill" flattened recursion starting from the hero
        // The mapData object's G color is used for efficient storage, first step is to wipe it out
        // The mapData stores the distance from center, which can be used by the caller to compute move time to that hex
        buildTargetMap: function(hero, target, actual_draw) {
            var startx = hero.x;
            var starty = hero.y;
            var maxDist = target.range;
            if (target.rangePlusSize) {
                maxDist += (hero.size - 1) / 2;
            }
						var pathSize = null;
						if (target.pathSize) {
							pathSize = hero.size;
						}
            var obstacleClear = (target.obstacles ? 255 : 1);
            if (pathSize !== null) {
                if ((pathSize - 1) % 2 !== 0) {
                    error("Path size is not symmetrical0");
                    return;
                }
            }
            var endSize = null;
						if (target.endSize) {
							endSize = hero.size;
						}
            if (endSize !== null) {
                if ((endSize - 1) % 2 !== 0) {
                    error("End size is not symmetrical1");
                    return;
                }
            }

            // remove clipping on the source hero
            TG.data.map.updateBarrier(hero.x, hero.y, hero.size, false);

            this.targetImgCtx.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
            this.centerx = startx;
            this.centery = starty;

            var pathRad = (pathSize !== null ? (pathSize - 1) / 2 : null);
            // clear any existing
            var data = this.mapData;
            var width = this.width;
            for (var i = 1 /*offest 1*/; i < data.length; i += 4) {
                data[i] = 255;
            }

            // flood fill from hero center
            var qx = [startx];
            var qy = [starty];
            data[(startx + starty * width) * 4 + 1] = 0;
            var index = 0;
            while (index < qx.length) {
                var x = qx[index];
                var y = qy[index];
                var dist = data[(x + y * width) * 4 + 1] + 1;
                if (dist > maxDist) {
                    break;
                }
                // do the 6 hex directions
                var hexes = this.collectHexes(x, y);
                for (var xy of hexes) {
                    this.checkMove(xy[0], xy[1], qx, qy, dist, pathRad, obstacleClear, target.respect_vision, actual_draw);
                }
                index++;
            }
            delete qx;
            delete qy;

            if (endSize !== null) {
                // there is a non-pathing final footprint
                // need to go through again and check that every space is valid with the footprint
                this.targetImgCtx.clearRect(0, 0, TF.WIDTH, TF.HEIGHT);
                var endRad = (endSize - 1) / 2;
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (this.mapData[(x + y * this.width) * 4 + 1] < 255) {
                            var dist = this.mapData[(x + y * this.width) * 4 + 1];
                            this.mapData[(x + y * this.width) * 4 + 1] = 255;
                            this.checkMove(x, y, null, null, dist, endRad, 255, target.respect_vision, actual_draw);
                        }
                    }
                }
            }

            // draw a border around the targetable area
            var shadowSize = null;
            if (endSize !== null) {
                shadowSize = endRad;
            } else if (pathSize !== null) {
                shadowSize = pathRad;
            } else if (target.aoe !== null && target.aoe !== undefined) {
                shadowSize = (target.aoe - 1) / 2;
            }
            if (shadowSize !== null && actual_draw) {
                // add effect borders around the valid targets
                // do another flood fill across the entire map, starting on all valid hexes
                var qx = [];
                var qy = [];
                // first collect the set of hexes bordering the targetable hexes
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (this.mapData[(x + y * this.width) * 4 + 1] < 255) {
                            var hexes = this.collectHexes(x, y);
                            for (var xy of hexes) {
                                if (this.mapData[(xy[0] + xy[1] * this.width) * 4 + 1] === 255 && this.mapData[(xy[0] + xy[1] * this.width) * 4] >= obstacleClear) {
                                    qx.push(xy[0]);
                                    qy.push(xy[1]);
                                    data[(xy[0] + xy[1] * width) * 4 + 2] = 1; // note storing in second (unused) slot now
                                }
                            }
                        }
                    }
                }
                // then fill them out
                var index = 0;
                while (index < qx.length) {
                    var x = qx[index];
                    var y = qy[index];
                    var dist = data[(x + y * width) * 4 + 2] + 1;
                    if (dist > shadowSize) {
                        break;
                    }
                    // do the 6 hex directions
                    var hexes = this.collectHexes(x, y);
                    for (var xy of hexes) {
                        this.checkShadow(xy[0], xy[1], qx, qy, dist, obstacleClear);
                    }
                    index++;
                }
                delete qx;
                delete qy;
                // And then wipe out all the shadow storage and stamp them in the same pass
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (data[(x + y * width) * 4 + 2] > 0) {
                            var xy = this.getFullXY(x, y);
                            this.targetImgCtx.drawImage(this.shadowHexImg, xy[0] - hexSize / 2, xy[1] - hexSize / 2);
                            data[(x + y * width) * 4 + 2] = 0;
                        }
                    }
                }
            }

            // all done, put the source hero clipping back in
            TG.data.map.updateBarrier(hero.x, hero.y, hero.size, true);
        },
        // Walks and collects the nearby hex coordinates at a given radius. Returned in clockwise order starting to the right, if that matters
        collectHexes: function(x, y, rad/*optional*/) {
            var ret = [];
            if (!rad || rad === 1) {
                var shift = y % 2; // odd-number shifted rows need to index one ahead
                ret.push([x + 1, y]);
                ret.push([x + shift, y + 1]);
                ret.push([x - 1 + shift, y + 1]);
                ret.push([x - 1, y]);
                ret.push([x - 1 + shift, y - 1]);
                ret.push([x + shift, y - 1]);
                return ret;
            }
            // rad > 1, need to do some walking
            var tx = x + rad;
            var ty = y;
            for (var i = 0; i < rad; i++) { // walk down left
                ret.push([tx, ty]);
                if (ty % 2 === 0)
                    tx--;
                ty++;
            }
            for (var i = 0; i < rad; i++) { // walk left
                ret.push([tx, ty]);
                tx--;
            }
            for (var i = 0; i < rad; i++) { // walk up left
                ret.push([tx, ty]);
                if (ty % 2 === 0)
                    tx--;
                ty--;
            }
            for (var i = 0; i < rad; i++) { // walk up right
                ret.push([tx, ty]);
                if (ty % 2 === 1)
                    tx++;
                ty--;
            }
            for (var i = 0; i < rad; i++) { // walk right
                ret.push([tx, ty]);
                tx++;
            }
            for (var i = 0; i < rad; i++) { // down right to start
                ret.push([tx, ty]);
                if (ty % 2 === 1)
                    tx++;
                ty++;
            }
            //ret.push([tx, ty]);

            return ret;
        },
        // used by buildPathMap to check if a tile is safe. qx and qy are the x and y queues for filling out
        checkMove: function(x, y, qx, qy, dist, pathRad, obstacleClear, respect_vision, actual_draw) {
            if (pathRad && (x - pathRad < 0 || y - pathRad < 0 || x + pathRad > this.width || y + pathRad > this.height)) {
                return; // off map bounds
            }
            if (this.mapData[(x + y * this.width) * 4 + 1] !== 255) {
                // already filled
                return;
            }
            var valid = true;
            if (pathRad !== null) { // continuous check of fit
                // check that every edge along the hero is valid
                var hexes = this.collectHexes(x, y, pathRad);
                for (var xy of hexes) {
                    valid &= this.mapData[(xy[0] + xy[1] * this.width) * 4] >= obstacleClear;
                }
            } else {
                // no path width, just check the cell is valid
                valid = this.mapData[(x + y * this.width) * 4] >= obstacleClear;
            }
            if (!valid) {
                return;
            }
            if (respect_vision && !this.hasVision(x, y, this.centerx, this.centery)) {
                return;
            }

            // looks valid
            this.mapData[(x + y * this.width) * 4 + 1] = dist;
            if (qx !== null) {
                qx.push(x);
                qy.push(y);
            }
						if (actual_draw) {
	            // stamp the valid hex
	            var xy = this.getFullXY(x, y);
	            this.targetImgCtx.drawImage(this.moveHexImg, xy[0] - hexSize / 2, xy[1] - hexSize / 2);
						}
        },
        // fill out the border of a targeting area
        checkShadow: function(x, y, qx, qy, dist, obstacleClear) {
            if (x < 0 || y < 0 || x > this.width || y > this.height) {
                return; // off map bounds
            }
            if (this.mapData[(x + y * this.width) * 4 + 1] !== 255) {
                // already targetable
                return;
            }
            if (this.mapData[(x + y * this.width) * 4 + 2] !== 0) {
                // already shadow
                return;
            }
            var valid = true;
            // no path width, just check the cell is valid
            valid = this.mapData[(x + y * this.width) * 4] >= obstacleClear;
            if (!valid) {
                return;
            }

            // looks valid
            this.mapData[(x + y * this.width) * 4 + 2] = dist; // Note: +2
            if (qx !== null) {
                qx.push(x);
                qy.push(y);
            }
        },
        // Add a physical barrier to the map, like a hero or a rock
        // Sets a value of 1, to indicate a barrier but not off the map bounds.
        // If vision-blocking, sets value to 0 instead (removes it from the gamefield)
        updateBarrier: function(x, y, width, present, visionBlock/*optional*/) {
            var val = (present ? (visionBlock ? 0 : 1) : 255); // adding or removing the barrier. not present = 255, present = 1, present & vision block = 0
            if ((width - 1) % 2 !== 0) {
                error("barrier width is not symmetrical");
                return;
            }
            this.mapData[(x + y * this.width) * 4] = val; // center
            var rad = (width - 1) / 2;
            for (var dist = 1; dist <= rad; dist++) {
                var hexes = this.collectHexes(x, y, dist);
                for (var xy of hexes) {
                    this.mapData[(xy[0] + xy[1] * this.width) * 4] = val;
                }
            }
            if (visionBlock) {
							// Rebuild the visible grid.
              this.buildGrid();
            }
        },
				
				drawDebug(x, y, color) {
          var tx = (y % 2 ? x * hexSize + hexSize / 2 : x * hexSize); // get x, offset odd rows
          var ty = y * hexHeight; // get x, offset odd rows
          TU.rect(this.targetImgCtx, tx-2, ty-2, 5, 5, color);
				},
				
        // Check if a given footprint edges up to any of the targeting hexes
        targetOverlaps: function(xin, yin, size) {
          var rad = Math.floor(size / 2);
					var count = 0;
          for (var y = 0; y < this.height; y++) {
              for (var x = 0; x < this.width; x++) {
										if (this.mapData[(x + y * this.width) * 4 + 1] < 255) {
											++count;
											//this.drawDebug(x, y, "#FF0")
										}
              }
          }

          var hexes = this.collectHexes(xin, yin, rad);
					for (var xy of hexes) {
						//this.drawDebug(xy[0], xy[1], "#00F")
            if (this.mapData[(xy[0] + xy[1] * this.width) * 4 + 1] < 255) {
                return true;
            }
          }
          return false;
        },
        // Returns all heroes in range (bordering this big hex)
        collectHeroes: function(x, y, width) {
            var ret = [];
            for (var obj in TG.data.heroes) {
                var hero = TG.data.heroes[obj];
                if (!hero.dead && this.getHexDist(x, y, hero.x, hero.y) < (hero.size - 1) / 2 + (width - 1) / 2 + 1) {
                    ret.push(hero);
                }
            }
            return ret;
        },
        // AI generate a path
        // This is a two-part algorithm. 
        //   - First, path out from the target based on the move ability
        //   - Then path out from the source to find one of those edges
        pathToTarget: function(shero, thero, range, skip_map_build) {
					// Find the distances across the map.
					var move_target = new JTact.HeroMoveTarget(200);
					if (!skip_map_build) {
						this.buildTargetMap(shero, move_target, /*actual_draw=*/false);
					}
					
					// Look for available spots where the source hero could attack the target.
          var nearest_rad;
					var nearest = 200; // Max distance to consider.
					var bestx = -1;
					var besty = -1;
					for (var nearest_try = 0; nearest_try < 3; nearest_try++) {
						switch (nearest_try) {
						case 0:
							// width of the two hero bodies
							nearest_rad = Math.floor((shero.size - 1) / 2) + Math.floor((thero.size - 1) / 2) + 1;
							break;
						case 1:
							// Something somewhat close.
							nearest_rad = Math.floor((shero.size - 1) / 2) + Math.floor((thero.size - 1) / 2) + 10;
							break;
						case 2:
						default:
							// Furthest range out.
							nearest_rad = Math.floor((shero.size - 1) / 2) + Math.floor((thero.size - 1) / 2) + range;
							break;						
						}
	          var hexes = this.collectHexes(thero.x, thero.y, nearest_rad);
	          for (var xy of hexes) {
	            var distance = this.mapData[(xy[0] + xy[1] * this.width) * 4 + 1];
							if (distance < nearest) {
		            var hasvision = this.hasVision(thero.x, thero.y, xy[0], xy[1]);
		            if (hasvision && this.isValidStamp(xy[0], xy[1], shero.size)) {
									nearest = distance;
									bestx = xy[0];
									besty = xy[1];
		            }
							}
	          }
						if (nearest < 200) {
							// Found a place to stand.
							break;
						}
					}
					if (nearest >= 200) {
						return null;
					}
					// This check is disabled because AI won't go around distant corridors to engage.
//					if (this.getHexDist(bestx, besty, thero.x, thero.y) >= this.getHexDist(shero.x, shero.y, thero.x, thero.y)) {
						// Didn't find anything better.
//						return null;
//					}
					
					// Trace back the path.
					var dist = nearest;
					var x = bestx;
					var y = besty;
          var ret = [];
          ret.push([bestx, besty]); // take the special match x/y

          while (dist > 0) {
              dist--;
              var hexes = this.collectHexes(x, y);
              var found = false;
              for (var xy of hexes) {
                  if (this.mapData[(xy[0] + xy[1] * this.width) * 4 + 1] === dist) {
                    var x = xy[0];
                    var y = xy[1];
										ret.push([x, y]);
                    found = true;
                    break;
                  }
              }
              if (!found) {
                  error("odd, couldn't find next path step");
                  return null;
              }
          }
					ret.reverse();
          return ret;					
        },
        // Check if two tiles are clear of vision-blocking boundaries
        // Approximate algorithm, for now
        hasVision: function(x1, y1, x2, y2) {
            var dist = this.getHexDist(x1, y1, x2, y2);
            var xy1 = this.getFullXY(x1, y1);
            var xy2 = this.getFullXY(x2, y2);
            // approximate algorithm: take number of steps = dist and check each step
            var dx = (xy2[0] - xy1[0]) / dist;
            var dy = (xy2[1] - xy1[1]) / dist;
            for (var i = 1; i < dist; i++) {
                var checkx = xy1[0] + i * dx;
                var checky = xy1[1] + i * dy;
                var checkxy = this.getHexXY(checkx, checky); // too slow?
                if (this.mapData[(checkxy[0] + checkxy[1] * this.width) * 4] === 0) { // invalid
                    return false;
                }
            }
            // all points check out
            return true;
        },
				
				// Gets a list of available places around the center point.
				// Returned list is sorted closest last (for efficient pop).
				// Note the BattleBuilder has a similar implementation with randomization.
				GetHeroPlaces: function(centerx, centery) {
					var hero_places = [];
					// This is a little complicated to compute because the hexes don't line up perfectly. Just
					// go for a suboptimal grid for now.
					for (var y = 0; y < this.height; y += 7) { // Large hero size
						for (var x = 0; x < this.width; x += 7) {
							if (this.isValidStamp(x, y, 7)) {
								var dist = this.getHexDist(x, y, centerx, centery);
								hero_places.push({x: x, y: y, dist: dist});
							}
						}
					}			
					hero_places.sort(function(left, right){return right.dist - left.dist;}); // Highest first, to prepare for pop().
					return hero_places;
				},				
    };
})();

 
