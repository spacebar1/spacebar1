/*
 * Travel renderer: handles all 3D travel.
 * Stores the 3D models, and tries to be efficient to minimize performance issues.
 * In general this object should not be used to track game data and state - just use it for animations.
 */
(function() {
	const near_plane = 0.001;  // To get in close.
	const perspective_camera_angle = 75;
	const max_ship_speed = 80;  // Roughly.
	const min_ship_speed = 15;  // Roughly.
	let rand = 0;
	let DISTANCE_MULTIPLIER = 1000;

	// The dummy system data is just an empty system for when the ship stops in interstellar.
	// The TravelRenderer generally assumes there is a system. So this is a minimal empty system.
  SBar.DummySystemData = function() {
      this._initDummySystemData();
  };

  SBar.DummySystemData.prototype = {	
    _initDummySystemData: function() {
			//error("synthetic system data")
    	this.seed = Math.random();
			this.radius = 0;
			this.main_radius = 1;
			this.is_binary = false;
			this.r = 255;
			this.g = 255;
			this.b = 255;
    },
		nebulaRegionSeed: function() {
			return null;
		},
		GetSystemEntryPoint: function() {
			return {x: 0, y: 0, z: 0};
		},
	};
	

  SBar.TravelRenderer = function(systemData) {
      this._initTravelRenderer(systemData);
  };

  SBar.TravelRenderer.prototype = {
    type: SF.TIER_TRAVEL,
		renderer: null,
		systemData: null,
		seed: null,
		stars_scene: null,
		stars_camera: null,
		stars_renderer: null,
		system_scene: null,
		system_camera: null,
		system_renderer: null,
		check_running: null, // Indicates that a transition has started.
		added_planets: null,  // Seeds for added planets.
		planet_meshes: null,  // 3D meshes based on planet seed.
		planet_positions: null,  // Vectors of the plane locations, by seed.
		planet_sizes: null,  // Planet sizes, by seed.
		finish_callback: null,  // Next stage to run after the travel.
		added_terrain_meshes: null,
		_initTravelRenderer: function(systemData) {
			if (!SG.helm) {
				SG.helm = new SBar.Helm();
			}
			
			this.systemData = systemData;
			this.seed = this.systemData.seed+1.23;
			this.added_planets = {};
			this.planet_meshes = {};
			this.planet_positions = {};
			this.planet_sizes = {};
			this.added_terrain_meshes = [];
			this.stars_renderer = null; // Explicit. See below.
    },
    //activate: function() {
		CheckSetup: function(planet_data, skip_activetier) {	
			if (SG.activeTier !== this && !skip_activetier) {
	      SG.activeTier.teardown();
	      SG.activeTier = this;
				delete this.check_running;
			}
			for (let mesh of this.added_terrain_meshes) {
				// Remove any existing meshes. There should only be one or zero.
				mesh.geometry.dispose();
				mesh.material.dispose();
				this.system_scene.remove(mesh);
			}
			
			SU.Show3dLayers();
			//this.RenderTerrain();
			//return;
			if (!this.stars_renderer) {
				// Setup is needed.
				this.GenerateStars();  // Also sets up the stars camera.
				if (S$.in_alpha_space) {
					this.AddAlphaShell();
				} else {
					const nebula_region_seed = this.systemData.nebulaRegionSeed();
					if (nebula_region_seed) {
						this.AddNebula(nebula_region_seed);
					}
				}
				//this.stars_renderer.render(this.stars_scene, this.stars_camera);
				this.SetupSystem();
				this.AddSystemStars();
			}
			if (planet_data) {
				this.AddPlanets(planet_data);
			}
			
			//this.DoLanding();
			//this.TravelSurface();
			//this.SystemTravel();
			//this.DoInterstellar();
		},
		// Skip travel animination.
		CheckFastTravel: function(finish_callback) {
			if (!SF.FAST_TRAVEL) {
				return false;
			}
			if (SG.activeTier !== this) {
	      SG.activeTier.teardown();
	      SG.activeTier = this;
				delete this.check_running;
			}
			this.teardown();
			if (finish_callback) {
				finish_callback();
			}			
			return true;
		},
		// Request to show the current view.
		RedrawCurrent: function() {
			if (this.CheckFastTravel()) {
				return;
			}
			SU.Show3dLayers();
			this.system_renderer.render(this.system_scene, this.system_camera);
			this.RenderStarsDirection();
		},
		CurrentCameraRotation: function() {
			return this.system_camera.rotation.clone();
		},
		// Used for looking around.
		LookAt: function(origin, rotatex, rotatey) {
			SU.Show3dLayers();
			this.system_camera.rotation.copy(origin);
			this.system_camera.rotateY(-rotatex);
			this.system_camera.rotateX(rotatey);  // Reversed here.
			this.system_renderer.render(this.system_scene, this.system_camera);
			this.RenderStarsDirection();
		},
		// Interstellar travel.
		ToSystem: function(travel_time, new_system_data, finish_callback) {
			if (this.CheckFastTravel(finish_callback)) {
				return;
			}
			this.finish_callback = finish_callback;
			this.CheckSetup();
			this.DoInterstellar(travel_time, new_system_data);
		},
		// Request to go to the surface at the given x/y.
		// The ship may be in orbit or may travel th surface.
		ToSurface: function(planet_data, startx, starty, surfacex, surfacey, finish_callback) {
			if (this.CheckFastTravel(finish_callback)) {
				return;
			}
			this.finish_callback = finish_callback;
			this.CheckSetup(planet_data);
			if (!startx) {
				this.DoLanding(planet_data, surfacex, surfacey);
			} else {
				this.TravelSurface(planet_data, startx, starty, surfacex, surfacey);
			}
		},
		SurfacePoint: function(planet_data, surfacex, surfacey, finish_callback) {
			if (SF.FAST_TRAVEL) {
				return;
			}
			this.finish_callback = finish_callback;
			this.CheckSetup(planet_data, /*skip_activetier=*/true);
			SU.Show3dLayers(/*hide_helm=*/true);
			this.DoSurfacePoint(planet_data, surfacex, surfacey);
		},
		ToSystemLocation: function(source, target, finish_callback) {
			if (this.CheckFastTravel(finish_callback)) {
				return;
			}
			this.finish_callback = finish_callback;
			this.CheckSetup(target);
			this.SystemTravel(source, target);
		},
		// Terrain. Note this requires the camera to be placed, and will face the camera.
		AddTerrainSquare: function(planet_data, surfacex, surfacey) {
			planet_data.generate();
			planet_data.GenerateTerrain();
			let terrain = planet_data.getPlanetTerrain().renderWindowData(surfacex, surfacey);
			let tdata = terrain.data;
			let size = 0.02;
			let segments = 127;
			let geometry = new THREE.PlaneGeometry(size, size, segments, segments)
			for (var i = 0, l = geometry.vertices.length; i < l; i++) {
				geometry.vertices[i].z = (tdata[i]/128-1)/100;
				if (tdata[i] < 128) geometry.vertices[i].z = 0;
			}
			this.terrain_height = geometry.vertices[geometry.vertices.length/2].z;
			const material = new THREE.MeshPhongMaterial({color: 0xdddddd, wireframe: false, map: new THREE.CanvasTexture(terrain.imgdata),
				side: THREE.DoubleSide,
			  });
			mesh = new THREE.Mesh(geometry, material);
			
//				let mesh_position = planet_position.clone();
//				mesh_position.add(this.SurfaceXyToVector(this.x, this.y, this.planet_size*1.005));
			mesh.position.copy(this.planet_positions[planet_data.seed]);
			mesh.position.add(this.SurfaceXyToVector(planet_data, surfacex, surfacey, this.planet_sizes[planet_data.seed]*1.01));
//				let vector = new THREE.Vector3(0, 0, -1);
//				this.system_camera.getWorldDirection(vector);
			mesh.lookAt(this.system_camera.position);
			mesh.rotateZ(0.75);  // Roughly square with the viewer after landing rotation.

			this.system_scene.add(mesh);
			this.added_terrain_meshes.push(mesh);
			//this.system_scene.add(new THREE.AmbientLight(0xaaaaaa));
		},
	
		SurfaceXyToVector(planet_data, surfacex, surfacey, dist) {
			// x any z are given from the x / longitude.
			let x = Math.sin(-Math.PI/2+Math.PI*surfacex/256)*dist;
			let z = Math.cos(-Math.PI/2+Math.PI*surfacex/256)*dist;
			// Need to get the third dimension.
			// Since dist^2 = x^2 + y^2 + z^2,
			//   y = Sqrt(dist^2 - x^2 - z^2).
			let plane_dist = Math.cos(-Math.PI/2+Math.PI*surfacey/512);
			x *= plane_dist;
			z *= plane_dist;
			let y = Math.sqrt(dist*dist-x*x-z*z);
			if (surfacey > 256) y *= -1;
			let vector = new THREE.Vector3(x, y, z);
			
			let quaternion = new THREE.Quaternion();
			this.planet_meshes[planet_data.seed].getWorldQuaternion(quaternion);
			vector.applyQuaternion(quaternion);
			return vector;
		},
		
		
		GetTravelPointAtTime: function(planet_data, time_fraction, dist_out) {
			// Draw a line between start and end. Determine the ship's point on this line. Then push it out from the planet center.
			let point = this.travel_end.clone().sub(this.travel_start);
			point.multiplyScalar(time_fraction);
			point = this.travel_start.clone().add(point).normalize().multiplyScalar(dist_out);
			return point.add(this.planet_positions[planet_data.seed]);
		},
		
		TravelSurface: function(planet_data, startx, starty, targetx, targety) {
			let dist_out = this.planet_sizes[planet_data.seed]*1.004;
			if (!this.check_running) {
				this.check_running = true;
				this.travel_count = 0;
				this.travel_end = this.SurfaceXyToVector(planet_data, targetx, targety, dist_out);
				this.travel_start = this.SurfaceXyToVector(planet_data, startx, starty, dist_out);
				let diff_distance = this.travel_end.distanceTo(this.travel_start);
				this.travel_steps = Math.round(diff_distance*120*min_ship_speed/S$.ship.speed)+1;
			}
			this.system_camera.position.copy(this.GetTravelPointAtTime(planet_data, this.travel_count/this.travel_steps, dist_out));
			
			// Keep the camera up pointing away from the surface.
			this.system_camera.lookAt(this.planet_positions[planet_data.seed]);
			let up_vector = new THREE.Vector3(0, 0, -1);
			this.system_camera.getWorldDirection(up_vector);
			
			this.system_camera.up.copy(up_vector);
			let next_point = this.GetTravelPointAtTime(planet_data, (this.travel_count+1)/this.travel_steps, dist_out);
			this.system_camera.lookAt(next_point);
			this.system_camera.rotateZ(Math.PI);  // Planet is below.
			this.system_camera.rotateX(-Math.PI*0.1);  // Look down a little.
			
			if (this.travel_count % 20 === 0) {
				this.UpdateHelmInstruments(this.system_camera.position.distanceTo(next_point), this.planet_positions[planet_data.seed]);
			}
			
			this.system_renderer.render(this.system_scene, this.system_camera);
			this.RenderStarsDirection();
			let callback = function() {
				this.TravelSurface(planet_data, startx, starty, targetx, targety);
			}
			if (this.travel_count < this.travel_steps) {
				this.timeout = setTimeout(callback.bind(this), 50, 50);
				this.travel_count++;
			} else {
				this.UpdateHelmInstruments(0, this.planet_positions[planet_data.seed]);
				this.FinishTravel();
			}
		},
		SystemTravel: function(source_data, target_data) {
			if (!this.check_running) {
				this.check_running = true;
				this.AddPlanets(target_data);
				this.travel_end = this.planet_positions[target_data.seed].clone();
				if (source_data) {
					if (!this.planet_positions[source_data.seed]) {
						this.AddPlanets(source_data);
					}
					this.travel_start = this.planet_positions[source_data.seed].clone();
				} else {
					const entry = this.systemData.GetSystemEntryPoint();
					this.travel_start = new THREE.Vector3(entry.x, entry.y, entry.z);
					this.travel_start.normalize().multiplyScalar(1000);
				}
				let diff = this.travel_end.clone().sub(this.travel_start);
				// Start the ship 5 units away from planet center.
				let five_off = diff.clone().normalize().multiplyScalar(5);
				this.travel_end.sub(five_off);
				this.travel_start.add(five_off);
				//this.travel_steps = Math.round(Math.sqrt(diff.x*diff.x+diff.y*diff.y+diff.z*diff.z)/10)+1;
				this.travel_count = 0;
				//this.half_time = this.travel_steps / 2;
				let velocity = 0;
				let velocity_add = 0.0003*S$.ship.speed/min_ship_speed;
				this.travel_fraction = 0;
				
				this.travel_points = [];
				
				while(this.travel_fraction < 0.5) {
					velocity += velocity_add;
	  			this.travel_fraction += velocity;
					if (this.travel_fraction < 0.5) {
						this.travel_points.push([this.travel_fraction, velocity]);
					}
				}
				// Symmetric on the slowdown, with a blip in center if needed.
				let len = this.travel_points.length;
				for (let i = len-1; i >= 0; i--) {
					this.travel_points.push([1-this.travel_points[i][0], this.travel_points[i][1]]);
				}
				this.travel_steps = this.travel_points.length;
			}
			
			let point = this.travel_end.clone().sub(this.travel_start);
			point.multiplyScalar(this.travel_points[this.travel_count][0]);
			point = this.travel_start.clone().add(point);
			this.system_camera.position.copy(point);
			
			this.system_camera.lookAt(this.travel_end);
			let shake_amount = 0.4/S$.ship.level*this.travel_points[this.travel_count][1];
			this.system_camera.rotateX(SU.r(target_data.seed, this.travel_count)*shake_amount);
			this.system_camera.rotateZ(SU.r(target_data.seed+1, this.travel_count)*shake_amount);
			this.system_camera.rotateY(SU.r(target_data.seed+2, this.travel_count)*shake_amount);
			
			this.system_renderer.render(this.system_scene, this.system_camera);
			this.RenderStarsDirection();
			
			if (this.travel_count % 20 === 0 && this.travel_count < this.travel_points.length-1) {
				this.UpdateHelmInstruments(this.travel_points[this.travel_count][1]);
			}
			
			if (this.travel_count < this.travel_points.length-1) {
				let callback = function() {
					this.SystemTravel(source_data, target_data);
				}
				this.timeout = setTimeout(callback.bind(this), 50, 50);
				this.travel_count++;
			}	else {
				this.UpdateHelmInstruments(0);
				this.FinishTravel();
			}
			
		},		
		
		DoLanding: function(planet_data, surfacex, surfacey) {
			if (!this.check_running) {
				// check_running is set below.
				this.travel_count = 0;
				this.added_terrain = false;
				//this.travel_steps = Math.round(90*min_ship_speed/S$.ship.speed)+1;
				
				// This requires the camera to be placed, to look back.
				this.system_camera.position.copy(this.planet_positions[planet_data.seed]);
				this.system_camera.position.add(this.SurfaceXyToVector(planet_data, surfacex, surfacey, 5));
				if (!this.added_terrain) {
					if (!planet_data.ggiant) {
						this.AddTerrainSquare(planet_data, surfacex, surfacey);
					}
					this.added_terrain = true;
				}				
				
				// Build the travel points.
				let velocity = 0.000003;
				this.travel_dists = [];
				let last_value = this.planet_sizes[planet_data.seed]*1.0125;
				if (this.terrain_height) {
					last_value += this.terrain_height;
				}
				while (last_value < 5) {
					this.travel_dists.push(last_value);
					//velocity += velocity_add;
					last_value += velocity;
					//velocity*=1.1;
					velocity*=1.04+S$.ship.speed/min_ship_speed/20;
				}
				this.travel_dists.push(last_value);
				this.travel_dists.reverse();
				this.travel_steps = this.travel_dists.length-1;
			}
			
			let dist = this.travel_dists[this.travel_count];
			
			//let dist = this.planet_sizes[planet_data.seed]*1.005
			
			this.system_camera.position.copy(this.planet_positions[planet_data.seed]);
			this.system_camera.position.add(this.SurfaceXyToVector(planet_data, surfacex, surfacey, dist));
			
			if (!this.check_running) {
				this.check_running = true;
				this.system_camera.lookAt(this.planet_positions[planet_data.seed]);
				let vector = new THREE.Vector3(0, 0, -1);
			}

			// Roll the camera a bit.
			let vector = new THREE.Vector3(0, 0, -1);
			this.system_camera.getWorldDirection(vector);
			//this.system_camera.rotateOnAxis(vector, 0.1);
			if (this.travel_count < this.travel_steps*3/4) {
				//this.system_camera.up.applyAxisAngle(vector, -0.015);
				this.system_camera.rotateZ(0.015)
			} else {
				this.system_camera.rotateX(Math.PI*2/this.travel_steps)
			}


			this.system_renderer.render(this.system_scene, this.system_camera);
			
			this.RenderStarsDirection();

			if (this.travel_count % 20 === 0 && this.travel_count < this.travel_steps) {
				let dist2 = this.travel_dists[this.travel_count+1]; // One extra position in the array added above.
				this.UpdateHelmInstruments(dist-dist2, this.planet_positions[planet_data.seed]);
			}

			this.travel_count++;
			let landing_callback = function() {
				this.DoLanding(planet_data, surfacex, surfacey);
			}
			if (this.travel_count < this.travel_steps) {
				this.timeout = setTimeout(landing_callback.bind(this), 50, 50);				
			} else {
				this.UpdateHelmInstruments(0, this.planet_positions[planet_data.seed]);
				this.FinishTravel();
			}
		},
		
		DoSurfacePoint: function(planet_data, surfacex, surfacey) {
			this.system_camera.position.copy(this.planet_positions[planet_data.seed]);  // Direction for the terrain.
			this.system_camera.position.add(this.SurfaceXyToVector(planet_data, surfacex, surfacey, 10));
			if (!this.added_terrain) {
				if (!planet_data.ggiant) {
					this.AddTerrainSquare(planet_data, surfacex, surfacey);
				}
			}				
			let height = this.planet_sizes[planet_data.seed]*1.0125;
			if (this.terrain_height) {
				height += this.terrain_height*1.1;
			}
			this.system_camera.position.copy(this.planet_positions[planet_data.seed]);  // Before terrain.
			this.system_camera.position.add(this.SurfaceXyToVector(planet_data, surfacex, surfacey, height));
			this.RenderStarsDirection();
			
			this.system_camera.lookAt(this.planet_positions[planet_data.seed]);
			this.system_camera.rotateX(Math.PI/2-0.2);  // Planet is below.
			this.system_renderer.render(this.system_scene, this.system_camera);
			
			//this.FinishTravel();
			this.teardown();			
		},
		
		RenderStarsDirection: function() {		
			let vector = new THREE.Vector3(0, 0, -1);
			this.system_camera.getWorldDirection(vector);
			this.stars_camera.lookAt(vector);
			this.stars_camera.up.copy(this.system_camera.up);
			this.stars_camera.rotation.copy(this.system_camera.rotation);
			this.stars_renderer.render(this.stars_scene, this.stars_camera);
		},
	
    handleUpdate: function(deltaTime, movex, movey) {
        // no-op
    },
    handleKey: function(key) {
        switch (key) {
            //case SBar.Key.ESC:
            //case SBar.Key.X:
            //case SBar.Key.O:
            //    this.teardown();
            //    break;
            default:
                error("unrecognized key pressed in travel: " + key);
        }
    },
		SetupSystem: function() {
			this.system_scene = new THREE.Scene();
			this.system_camera = new THREE.PerspectiveCamera(perspective_camera_angle, S3.three2.width/S3.three2.height, near_plane, 10000 );
			this.system_renderer = new THREE.WebGLRenderer({canvas: S3.three2, antialias: true, alpha: true });
			this.system_renderer.setSize(S3.three2.width, S3.three2.height);
			//document.body.appendChild( this.system_renderer.domElement );				
		},
		
		// Returns a vector for the position for this planet.
		PlanetPosition: function(planet_data) {
			let position = new THREE.Vector3();
			position.x = (planet_data.x - planet_data.systemData.x) * DISTANCE_MULTIPLIER;
			position.y = (planet_data.y - planet_data.systemData.y) * DISTANCE_MULTIPLIER;
			position.z = 0;  // Everything on the same plane for now.
			return position;
		},
		PlanetRotation: function(planet_data) {
			return Math.PI*2/planet_data.tilt;
		},
		
		// Surface of the star.
		StarTexture: function(r, g, b, a) {
      let image = document.createElement('canvas');
			const size_small = 16;
      image.width = size_small;
      image.height = size_small;
			let context = image.getContext('2d');
		
			let imagedata = context.getImageData(0, 0, size_small, size_small);
			let data = imagedata.data;
			
			let start = 0;
			while (start < data.length) {
					data[start] = fixColor(r + SU.r(this.seed, rand++)*50-25);
					data[start+1] = fixColor(g + SU.r(this.seed, rand++)*50-25);
					data[start+2] = fixColor(b + SU.r(this.seed, rand++)*50-25);
					data[start+3] = fixColor(a + SU.r(this.seed, rand++)*50-25);;
					start += 4;
			}
			this.SmoothEdges(data, size_small);
			
			context.putImageData(imagedata, 0, 0)
			let texture = new THREE.CanvasTexture(imagedata);
			return texture;
		},
		
		AddAlphaSystemStar: function() {
			let base_size = 100;
			const stargeometry = new THREE.SphereGeometry(base_size, 32, 32);
			const texture = new THREE.CanvasTexture(this.ResizedAlphaImage(this.seed+1.11));
			const starmaterial = new THREE.MeshPhongMaterial({
				map: texture,
				lightMap: texture,
				lightMapIntensity: 2,  // Brighten it a bit.
				specular: 0x555555,
				shininess: 15,
			});
			let star = new THREE.Mesh(stargeometry, starmaterial);
			this.system_scene.add(star);
			
			const color = "#FFF";
			var light = new THREE.PointLight(color, 1, 0, 1); // Light that decays.
			light.position.set(0, 0, 0);
			this.system_scene.add(light);				
		},
		
		// Also handles binaries.
		AddSystemStars: function() {
			if (S$.in_alpha_space) {
				this.AddAlphaSystemStar();
			} else {
				this.AddSystemStar(this.systemData.main_radius, 0, 0, this.systemData.r, this.systemData.g, this.systemData.b);
			}
			if (this.systemData.is_binary) {
				this.AddSystemStar(this.systemData.binary_radius, this.systemData.binaryx, this.systemData.binaryy, this.systemData.r2, this.systemData.g2, this.systemData.b2);
			}
			this.system_scene.add(new THREE.AmbientLight("#FFF", 0.25));
		},
		
		// Note the sun is about 10x the width of Jupiter.
		AddSystemStar: function(radius, x, y, r, g, b) {
			const position = new THREE.Vector3(x, 0, y);
			x *= DISTANCE_MULTIPLIER;
			y *= DISTANCE_MULTIPLIER;
			
			let rad_to_size_factor = 10; // Star rads are rougly 0.6 to 4.5. With planets around size 1, stars around size 20 on average.
			let base_size = radius * rad_to_size_factor;
			const stargeometry = new THREE.SphereGeometry(base_size, 32, 32);
			const starmaterial = new THREE.MeshPhongMaterial({
				map: this.StarTexture(r, g, b, 255),
				//side: THREE.DoubleSide,
				//transparent: false,
				emissive: "#FFF",
				emissiveIntensity: 0.5,
			});
//			starmaterial.emissive = "#FFF"
//			starmaterial.emissiveIntensity = 1;
			let star = new THREE.Mesh(stargeometry, starmaterial);
			star.position.copy(position);
			this.system_scene.add(star);
/*
			const stargeometry2 = new THREE.SphereGeometry(base_size*1.1, 32, 32);
			let brightoff = Math.floor(SU.r(this.systemData.seed, 1.2)*150-75);
			const starmaterial2 = new THREE.MeshBasicMaterial({map: this.StarTexture(r+brightoff, g+brightoff, b+brightoff, 155), transparent: true});
			let star2 = new THREE.Mesh(stargeometry2, starmaterial2);
			star2.position.copy(position);
			this.system_scene.add(star2);
*/
			// Color around the star. Workaround for volumetric lighting.
      let image = document.createElement('canvas');
			const size = 128;
      image.width = size;
      image.height = size;
      //var colorStops = [0, 'rgba(' + r + ',' + g + ',' + b + ',0.5)', 1, 'rgba(' + r + ',' + g + ',' + b + ',0)'];
			// Prevent the sprite color from overlapping with the sphere. It can cause flickering.
      var colorStops = [0, 'rgba(255,255,255,0)', 0.19, 'rgba(255,255,255,0)', 0.19, 'rgba(' + r + ',' + g + ',' + b + ',0.5)', 1, 'rgba(' + r + ',' + g + ',' + b + ',0)'];
			let context = image.getContext('2d');
      SU.circleRad(context, size/2, size/2, size/2, colorStops);
			
			const halotexture = new THREE.CanvasTexture(image);
			//const main_strength = Math.floor(radius*255);
			//const color = 'rgb('+main_strength+','+main_strength+','+main_strength+')';
			const halomaterial = new THREE.SpriteMaterial({map: halotexture})
			const halosprite = new THREE.Sprite(halomaterial);
			const halo_size = base_size*10;
			halosprite.scale.set(halo_size, halo_size, 1);
			halosprite.position.copy(position);
			this.system_scene.add(halosprite);
		
			const color = "#FFF";
			var light = new THREE.PointLight(color, radius, 0, 1); // Light that decays.
			light.position.copy(position);
			this.system_scene.add(light);				
		},
		
		// Adds rings from a gas giant.
		AddRings: function(planet_data) {
			const planet_obj = this.planet_meshes[planet_data.seed];
			this.system_camera.position.copy(planet_obj.position).add(new THREE.Vector3(4, 4, 0));
			this.system_camera.lookAt(planet_obj.position);

			planet_data.DrawRings();
			const rings_image = planet_data.rings_flat;
			const rings_texture = new THREE.CanvasTexture(rings_image);
			rings_texture.minFilter = THREE.LinearFilter;
			let material = new THREE.MeshPhongMaterial({
			  map: rings_texture,
				side: THREE.DoubleSide,
				transparent: true
			});
			let geometry = new THREE.PlaneGeometry(6, 6);
			let rings_mesh = new THREE.Mesh(geometry, material);
			rings_mesh.position.copy(planet_obj.position).add(new THREE.Vector3(0,0,0));
			let quaternion = new THREE.Quaternion();
			rings_mesh.rotateX(Math.PI/2);
			planet_obj.getWorldQuaternion(quaternion);
			rings_mesh.applyQuaternion(quaternion);
			this.system_scene.add(rings_mesh);
		},
		
		AddPlanets: function(planet_data) {
			if (this.added_planets[planet_data.seed]) {
				return;
			}
			this.added_planets[planet_data.seed] = true;
			if (planet_data.type === SF.TYPE_BELT_DATA) {
				this.AddBelt(planet_data);
			} else {
				this.AddPlanet(planet_data);
			}
			if (planet_data.ggiant) {
				this.AddRings(planet_data);
			}
			if (planet_data.moons) {
				for (let moon of planet_data.moons) {
					this.AddPlanet(moon);
				}
			}
		},
		
		// Just a generic sphere with a light for now.
		AddBelt: function(belt_data) {
			let belt_position = this.PlanetPosition(belt_data);
			this.planet_positions[belt_data.seed] = belt_position;
			const belt_size = 3;
			this.planet_sizes[belt_data.seed] = belt_size;
			
/*			
			const size_small = 16;
      let beltimg = document.createElement('canvas');
			beltimg.width = size_small;
			beltimg.height = size_small;
			let context_small = beltimg.getContext('2d');
			let imagedata = context_small.getImageData(0, 0, size_small, size_small);
			let data = imagedata.data;
			let r = Math.round(fixColor(SU.r(belt_data.seed, 8.21)*50));
			let varyr = Math.round(SU.r(belt_data.seed, 8.24)*80)*2;
			let varya = Math.round(SU.r(belt_data.seed, 8.27)*60);
			let start = 0;
			let rand = 30001;
			while (start < data.length) {
				let val = Math.round(fixColor(SU.r(this.seed, rand++)*50)+50);
				data[start] = val;
				data[start+1] = val;
				data[start+2] = val;
				data[start+3] = Math.round(fixColor(SU.r(this.seed, rand++)*100));
					start += 4;
			}
			this.SmoothEdges(data, size_small);
			context_small.putImageData(imagedata, 0, 0)
			
			
			const beltgeometry = new THREE.SphereGeometry(belt_size, 64, 64); // TODO: 32 / 64
			const belttexture = new THREE.CanvasTexture(beltimg);
			const beltmaterial = new THREE.MeshPhongMaterial( {
								map: belttexture,
								transparent: true
							} );
			let belt = new THREE.Mesh(beltgeometry, beltmaterial);
			belt.position.copy(belt_position);
			this.system_scene.add(belt);			
			this.planet_meshes[belt_data.seed] = belt;
			*/
      let image = document.createElement('canvas');
			const size = 128;
      image.width = size;
      image.height = size;
			let context = image.getContext('2d');
      var colorStops = [0, 'rgba(128,128,128,1)', 1, 'rgba(128,128,128,0)'];
      SU.circleRad(context, size/2, size/2, size/2, colorStops);
			
			const halotexture = new THREE.CanvasTexture(image);
			const halomaterial = new THREE.SpriteMaterial({map: halotexture})
			const halosprite = new THREE.Sprite(halomaterial);
			halosprite.scale.set(3, 3, 1);
			halosprite.position.copy(belt_position);
			this.system_scene.add(halosprite);
			/*
			let light = new THREE.PointLight( 0xffffff, 0.2, 1, 2);
			light.position.copy(belt_position);
			this.system_scene.add(light);				
			*/
		},
		
		AddPlanet: function(planet_data) {
			let planet_position = this.PlanetPosition(planet_data);
			
			const parent = planet_data.parent_planet_data;
			if (parent) {
				// Moons need to be on the same plane as parent planet rotation (usually).
				// There's probably an easier way to do this, but the rotation APIs on Object3D are convenient.
				let parent_quaternion = new THREE.Quaternion();
				let parent_mesh = this.planet_meshes[parent.seed];
				parent_mesh.getWorldQuaternion(parent_quaternion);
				
				let parent_position = this.planet_positions[parent.seed];
				let dist_out = planet_position.distanceTo(parent_position);
				//parent_mesh.rotateY(Math.PI/2);
				parent_mesh.rotateY(planet_data.angle);
				let vector = new THREE.Vector3(0, 0, -1);
				let angle = parent_mesh.getWorldDirection(vector);
				parent_mesh.setRotationFromQuaternion(parent_quaternion);
				planet_position = angle.multiplyScalar(dist_out).add(parent_position);
				
			}
			this.planet_positions[planet_data.seed] = planet_position;
			// Radius is in the 5-20 range. Bring it down to < 5 range.
			const planet_size = planet_data.radius / 25;
			this.planet_sizes[planet_data.seed] = planet_size;
			
			
			const planetgeometry = new THREE.SphereGeometry(planet_size, 64, 64); // TODO: 32 / 64
			const planetimg = planet_data.getPlanetTerrain().renderTerrain().img;
			const planettexture = new THREE.CanvasTexture(planetimg);
			//const planetmaterial = new THREE.MeshBasicMaterial({map: planettexture});
			const planetmaterial = new THREE.MeshPhongMaterial( {
//									specular: 0x555555,
//									shininess: 15,
								map: planettexture,
//											specularMap: cloudtexture,
//											normalMap: planettexture,
								//normalScale: new THREE.Vector2( 0.85, 0.85 ),
				//side: THREE.DoubleSide,
				//transparent: true
							} );
			let planet = new THREE.Mesh(planetgeometry, planetmaterial);
			planet.position.copy(planet_position);
			planet.rotateX(this.PlanetRotation(planet_data));
			this.system_scene.add(planet);
			
			if (!planet_data.ggiant) {
				const cloudgeometry = new THREE.SphereGeometry(planet_size+0.01, 64, 64); // TODO: 32 / 64
				const cloudimg = planet_data.getCloudTerrain().renderTerrain().img;
				const cloudtexture = new THREE.CanvasTexture(cloudimg);
//						const cloudmaterial = new THREE.MeshBasicMaterial({map: cloudtexture, transparent: true/*side: THREE.BackSide*/});
				const cloudmaterial = new THREE.MeshPhongMaterial( {
									specular: 0x555555,
									shininess: 15,
									map: cloudtexture,
//											specularMap: cloudtexture,
//											normalMap: planettexture,
									//normalScale: new THREE.Vector2( 0.85, 0.85 ),
									side: THREE.DoubleSide,
									transparent: true
								} );

				var clouds = new THREE.Mesh(cloudgeometry, cloudmaterial);
				clouds.position.copy(planet_position);
				clouds.rotateX(this.PlanetRotation(planet_data));
				this.system_scene.add(clouds);
			}
			if (planet_data.is_refractor) {
				let center_vector = new THREE.Vector3(0, 0, 0);
				let distance = center_vector.distanceTo(planet_position);
				
				//let geometry = new THREE.ConeGeometry(planet_size, distance, 32, 1, /*openEnded=*/true);
				let geometry = new THREE.CylinderGeometry(0.1, planet_size*1.1, distance, 32, 1, /*openEnded=*/true);
				
				const size_small = 16;
	      let image_small = document.createElement('canvas');
				image_small.width = size_small;
				image_small.height = size_small;
				let context_small = image_small.getContext('2d');
				SU.rect(context_small, 0, 0, size_small, size_small, 'rgba(255,255,255,0.5)');
				const texture = new THREE.CanvasTexture(image_small);
				
				let material = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true,
				  side: THREE.DoubleSide,
				});
				let cone = new THREE.Mesh(geometry, material);
				this.system_scene.add(cone);
				let half_position = new THREE.Vector3(planet_position.x/2, planet_position.y/2, planet_position.z/2);
				cone.position.copy(half_position);
				//cone.position.copy(planet_position);
				cone.lookAt(center_vector);
				cone.rotateX(Math.PI/2)
			}
			this.planet_meshes[planet_data.seed] = planet;
		},
		
		GenerateStars: function() {
			this.stars_scene = new THREE.Scene();
			this.stars_camera = new THREE.PerspectiveCamera(perspective_camera_angle, S3.three1.width/S3.three1.height, near_plane, 1000);
			
			this.stars_renderer = new THREE.WebGLRenderer({canvas: S3.three1, antialias: true, alpha: true});
			this.stars_renderer.setSize(S3.three1.width, S3.three1.height);
			//document.body.appendChild(this.stars_renderer.domElement);
			
			var starsGeometry = new THREE.Geometry();

			for (let i = 0; i < 10000; i++) {
				var star = new THREE.Vector3();
				star.x = THREE.Math.randFloatSpread(1000);
				star.y = THREE.Math.randFloatSpread(1000);
				star.z = THREE.Math.randFloatSpread(1000);
				if (star.x > -200 && star.x < 200 && star.y > -200 && star.y < 200 && star.z > -200 && star.z < 200) {
					// Skip it.
				} else {
					starsGeometry.vertices.push(star);
				}
			}
			var starsMaterial = new THREE.PointsMaterial({color: 0xffffff});
			var starField = new THREE.Points(starsGeometry, starsMaterial);
			this.stars_scene.add(starField);
		},
		
		// Adds a nice graphical nebula to the stars layer. Lots of inspiration, like https://en.wikipedia.org/wiki/Nebula.
		AddNebula: function(nebula_region_seed) {
			if (this.added_nebula) {
				return;
			}
			this.added_nebula = true;
			const nebula_size = 10;  // Doesn't really matter. Ship is constant positioned in stars.
			const geometry = new THREE.SphereGeometry(nebula_size, 32, 32);
			const image = this.NebulaImage(nebula_region_seed);
			const texture = new THREE.CanvasTexture(image);
			//const planetmaterial = new THREE.MeshBasicMaterial({map: planettexture});
			const material = new THREE.MeshPhongMaterial({
			  map: texture,
				side: THREE.DoubleSide,
				transparent: true
			});
			let mesh = new THREE.Mesh(geometry, material);
			this.stars_scene.add(new THREE.AmbientLight(0xffffff));
			this.stars_scene.add(mesh);
			
			const nebula_size2 = 9;
			const geometry2 = new THREE.SphereGeometry(nebula_size2, 32, 32);
			const image2 = this.NebulaImageDark(nebula_region_seed);
			const texture2 = new THREE.CanvasTexture(image2);
			const material2 = new THREE.MeshPhongMaterial({
			  map: texture2,
				side: THREE.DoubleSide,
				transparent: true
			});
			let mesh2 = new THREE.Mesh(geometry2, material2);
			mesh2.rotateX(Math.PI/3);  // Offset with the other image.
			mesh2.rotateY(Math.PI/3);
			mesh2.rotateZ(Math.PI/3);
			this.stars_scene.add(mesh2);
		},
		
		AddAlphaShell: function() {
			const nebula_size = 10;  // Doesn't really matter. Ship is constant positioned in stars.
			const geometry = new THREE.SphereGeometry(10, 32, 32);
			const image = this.ResizedAlphaImage(this.seed+1.12);
			
			const texture = new THREE.CanvasTexture(image);
			//const planetmaterial = new THREE.MeshBasicMaterial({map: planettexture});
			const material = new THREE.MeshPhongMaterial({
			  map: texture,
				side: THREE.DoubleSide,
				transparent: true
			});
			let mesh = new THREE.Mesh(geometry, material);
			this.stars_scene.add(new THREE.AmbientLight(0xffffff));
			this.stars_scene.add(mesh);
		},
		ResizedAlphaImage: function(seed) {
			let image = SU.GetAlphaPattern(seed);
			
			const size_small = 32;
      let image_small = document.createElement('canvas');
			image_small.width = size_small;
			image_small.height = size_small;
			let context_small = image_small.getContext('2d');
			context_small.drawImage(image, 0, 0, image.width, image.height, 0, 0, size_small, size_small);
			let imagedata = context_small.getImageData(0, 0, size_small, size_small);
			let data = imagedata.data;
			this.SmoothEdges(data, size_small);
			context_small.putImageData(imagedata, 0, 0)
			
			return image_small;
		},
		
		// Nebula texture. Try to make it look nice: colorful with lots of variety.
		NebulaImage: function(nebula_region_seed) {
			const size_small = 16;
      let image_small = document.createElement('canvas');
			image_small.width = size_small;
			image_small.height = size_small;
			let context_small = image_small.getContext('2d');
			let imagedata = context_small.getImageData(0, 0, size_small, size_small);
			let data = imagedata.data;
			/*
			for (let i = 0; i < size_small; i++) {
				for (let j = 0; j < size_small; j++) {
					
				}
			}
			*/
			let r = fixColor(SU.r(nebula_region_seed, 8.21)*255);
			let g = fixColor(SU.r(nebula_region_seed, 8.22)*255);
			let b = fixColor(SU.r(nebula_region_seed, 8.23)*255);
			
			let varyr = Math.round(SU.r(nebula_region_seed, 8.24)*80)*2;
			let varyg = Math.round(SU.r(nebula_region_seed, 8.25)*80)*2;
			let varyb = Math.round(SU.r(nebula_region_seed, 8.26)*80)*2;
			let varya = Math.round(SU.r(nebula_region_seed, 8.27)*80)+20;
			
			let start = 0;
			let rand = 10001;
			while (start < data.length) {
				data[start] = fixColor(r + SU.r(this.seed, rand++)*varyr-varyr/2);
				data[start+1] = fixColor(g + SU.r(this.seed, rand++)*varyg-varyg/2);
				data[start+2] = fixColor(b + SU.r(this.seed, rand++)*varyb-varyb/2);
				data[start+3] = fixColor(SU.r(this.seed, rand++)*varya);
				/*
					data[start] = fixColor(SU.r(this.seed, rand++)*255);
					data[start+1] = fixColor(SU.r(this.seed, rand++)*255);
					data[start+2] = fixColor(SU.r(this.seed, rand++)*255);
					data[start+3] = fixColor(SU.r(this.seed, rand++)*30);
				*/
					start += 4;
			}
			this.SmoothEdges(data, size_small);
			context_small.putImageData(imagedata, 0, 0)
			//SU.rect(context_small, 0, 0, size_small, size_small, "#F00");
			return image_small;
/*			
			const size = 512;
      let image = document.createElement('canvas');
			image.width = size;
			image.height = size;
			let context = image.getContext('2d');
			SU.rect(context, 0, 0, size, size, 'rgba(255,0,0,0.1)');
			return image;
			*/
		},
		
		// Black image to superimpose on the nebula image.
		NebulaImageDark: function(nebula_region_seed) {
			const size_small = 16;
      let image_small = document.createElement('canvas');
			image_small.width = size_small;
			image_small.height = size_small;
			let context_small = image_small.getContext('2d');
			let imagedata = context_small.getImageData(0, 0, size_small, size_small);
			let data = imagedata.data;
			/*
			for (let i = 0; i < size_small; i++) {
				for (let j = 0; j < size_small; j++) {
					
				}
			}
			*/
			let r = Math.round(fixColor(SU.r(nebula_region_seed, 8.21)*50));
			
			let varyr = Math.round(SU.r(nebula_region_seed, 8.24)*80)*2;
			let varya = Math.round(SU.r(nebula_region_seed, 8.27)*60);
			
			let start = 0;
			let rand = 20001;
			while (start < data.length) {
				//let val = Math.round(fixColor(r + SU.r(this.seed, rand++)*varyr-varyr/2));
				let val = 0;//Math.round(fixColor(SU.r(this.seed, rand++)*50));
				data[start] = val;
				data[start+1] = val;
				data[start+2] = val;
				data[start+3] = Math.round(fixColor(SU.r(this.seed, rand++)*256));
					start += 4;
			}
			this.SmoothEdges(data, size_small);
			context_small.putImageData(imagedata, 0, 0)
			return image_small;
		},		
		// Textures will have a discontinuity at the edges.
		// Wrap the image data values at the edges to prevent this.
		SmoothEdges: function(data, size) {
			for (let i = 0; i < size; i++) {
				let start = size*i*4;
				for (let j = 0; j < 4; j++) {
					data[start+j] = data[start+j+size*4-4];
				}
			}
			let last_row = size*(size-1)*4;
			for (let i = 4; i < size*4; i++) {
				data[i] = data[i-4];
				data[i+last_row] = data[i+last_row-4];
			}
		},
		
		// Warp bubbles. Note this mode of travel updates the clock.
		DoInterstellar: function(travel_time, new_system_data) {
			if (!this.check_running) {
				this.end_time = S$.time;
				this.start_time = S$.time - travel_time;
				S$.time = this.start_time;
				
				this.check_running = true;
				this.travel_count = 0;

	      this.temp_layer = document.createElement('canvas');
	      this.temp_layer.setAttribute('style', 'position:absolute;left:0px;top:0px;align: center;display: inline-block');
				this.temp_layer.style.width = SC.layer2.canvas.width+"px";
				this.temp_layer.style.height = SC.layer2.canvas.height+"px";
				this.temp_context = this.temp_layer.getContext('2d');
				
				// Put the fade and colors below the helm and above the 3D layers.
				let container = document.getElementById('container');
				container.insertBefore(this.temp_layer, SC.layer0.canvas);
				
				// TODO: WHY IS THIS NEEDED? Why doesn't the layer start with the appropriate scale?
				this.temp_context.scale(SG.scalex/2.85, SG.scaley/5);
				this.travel_steps = Math.round((travel_time+1)/48*120*min_ship_speed/S$.ship.speed)+1;

				this.icons = [];
				for (let i = 0; i < Math.floor(SU.r(rand++, 2.13)*10+5); i++) {
					let x = Math.floor(SU.r(rand++, 2.14)*SF.WIDTH);
					let y = Math.floor(SU.r(rand++, 2.15)*SF.HEIGHT);
					let scale = SU.r(rand++, 2.15)*5+2;
					this.icons.push({x: x, y: y, scale:scale, icon: new SBar.IconTempleEffect(this.temp_context, 0, 0, SU.r(rand++, 2.16)>0.5)});
				}
			}
			// Fade in for a quarter of the time, fade out a quarter of the time. White bubbles for the rest.
			this.temp_context.clearRect(0, 0, SF.WIDTH*2, SF.HEIGHT*2);
			this.temp_context.save();
			if (this.travel_count < Math.round(this.travel_steps/4)) {
				this.temp_context.globalAlpha = this.travel_count/(this.travel_steps/4);
			} else if (this.travel_count < Math.round(this.travel_steps*3/4)) {
				this.temp_context.globalAlpha = 1;
				if (this.travel_count == Math.round(this.travel_steps/4)) {
					// Move the ship to the new system.
					this.DisposeScenes();
					this._initTravelRenderer(new_system_data)
					this.CheckSetup();
					const entry = this.systemData.GetSystemEntryPoint();
					const entry_vector = new THREE.Vector3(entry.x, entry.y, entry.z);
					this.system_camera.position.copy(entry_vector);
					let center_vector = new THREE.Vector3(0, 0, 0);
					this.system_camera.lookAt(center_vector);
					this.RenderStarsDirection();					
				}
			} else {
				this.temp_context.globalAlpha = (this.travel_steps-this.travel_count)/(this.travel_steps/4);
			}
			SU.rect(this.temp_context, 0, 0, SF.WIDTH*2, SF.HEIGHT*2, 'rgb(255,255,255)');
			for (let icon of this.icons) {
				this.temp_context.save();
				this.temp_context.translate(icon.x, icon.y);
				this.temp_context.scale(icon.scale, icon.scale);
				icon.icon.update(0, 0, true);  // Use true here to prevent draw shifting.
				this.temp_context.restore();
			}
			this.temp_context.restore();

			if (this.travel_count % 20 === 0) {
				S$.time = this.start_time + Math.round(travel_time*this.travel_count/this.travel_steps);
				let velocity = Math.floor(SU.r(rand++, 2.12)*99999);
				this.UpdateInterstellarInstruments(velocity);
			}
			// Draw the travel progress. Can't use the temp context here because it's scaled.
			let pixels_per_step = 3;
			SU.rect(SC.layer1, SF.HALF_WIDTH-this.travel_steps*pixels_per_step/2, SF.HALF_HEIGHT, this.travel_steps*pixels_per_step, 10, 'rgba(0,0,0,1)');
			SU.rect(SC.layer1, SF.HALF_WIDTH-this.travel_steps*pixels_per_step/2, SF.HALF_HEIGHT, this.travel_count*pixels_per_step, 10, 'rgba(128,128,128,1)');
			if (this.travel_count < this.travel_steps) {
				let next = function() {
					this.DoInterstellar(travel_time, new_system_data);
				}
				this.timeout = setTimeout(next.bind(this), 50, 50);
				this.travel_count++;
			} else {
				S$.time = this.end_time;
				this.UpdateInterstellarInstruments(0);
				this.temp_layer.parentNode.removeChild(this.temp_layer)
				delete this.temp_layer;
				this.FinishTravel();
			}
		},
		
		UpdateInterstellarInstruments: function(velocity) {
			let helm = SG.helm;
			helm.UpdateStandardInstruments();
			helm.UpdateInstrument("systemxyz", [
				0, 0, 0
			  ]);
		  let vector = new THREE.Vector3(0, 0, -1);
			this.system_camera.getWorldDirection(vector);
			helm.UpdateInstrument("heading", [
				SU.r(rand++, 2.12)*100,
				SU.r(rand++, 2.12)*100,
				SU.r(rand++, 2.12)*100,
			  ]);
			helm.UpdateInstrument("orientation", [
				SU.r(rand++, 2.12)*100,
				SU.r(rand++, 2.12)*100,
				SU.r(rand++, 2.12)*100,
			  ]);
			helm.UpdateInstrument("speed", velocity);
		},
		
		UpdateHelmInstruments: function(velocity, near_planet) {
			let helm = SG.helm;
			helm.UpdateStandardInstruments();
			helm.UpdateInstrument("systemxyz", [
				this.system_camera.position.x,
				this.system_camera.position.y,
				this.system_camera.position.z,
			  ]);
		  let vector = new THREE.Vector3(0, 0, -1);
			this.system_camera.getWorldDirection(vector);
			helm.UpdateInstrument("heading", [
				vector.x,
				vector.y,
				vector.z,
			  ]);
			helm.UpdateInstrument("orientation", [
				this.system_camera.up.x,
				this.system_camera.up.y,
				this.system_camera.up.z,
			  ]);
			helm.UpdateInstrument("speed", velocity);
			if (near_planet) {
				let planet_vector = this.system_camera.position.clone().sub(near_planet);
				helm.UpdateInstrument("planetxyz", [
					planet_vector.x,
					planet_vector.y,
					planet_vector.z,
				  ]);
			}
			
			/*
			this.AddInstrumentPosition(this.seed+18.04, "galaxyxyz", 3, pixels);
			*/
		},
		
		FinishTravel: function() {
			if (SG.activeTier && SG.activeTier.type !== SF.TIER_TRAVEL) {
				// Overlay got pushed. Finish after it pops.
				SU.message("Travel complete.")
				return;
			}
			this.teardown();
			if (this.finish_callback) {
				this.finish_callback();
				delete this.finish_callback;
			}
		},
		
		// A tier popped while traveling.
		// But it might have also popped for other reasons.
		CheckForRefresh: function() {
			if (this.finish_callback) {
				this.FinishTravel();
			}
		},
		
		dispose3: function(obj) {
		    var children = obj.children;
		    var child;

		    if (children) {
					for (let i = children.length - 1; i >= 0; i--) { 
		        //for (var i=0; i<children.length; i+=1) {
		            child = children[i];

		            this.dispose3(child);
		        }
						if (obj.remove) {
				      obj.remove(child);
						}
						
		    }

		    var geometry = obj.geometry;
		    var material = obj.material;

		    if (geometry) {
		        geometry.dispose();
		    }

		    if (material) {
		        var texture = material.map;

		        if (texture) {
		            texture.dispose();
		        }

		        material.dispose();
		    }
		},
		
		// Dispose and remove all objects from the scene.
		DisposeScene: function(scene) {
			for (let i = scene.children.length - 1; i >= 0; i--) { 
	      let obj = scene.children[i];
				if (obj.geometry) {
					obj.geometry.dispose();
				}
				if (obj.material) {
					if (obj.material.map) {
						obj.material.map.dispose();
					}
					obj.material.dispose();
				}
	      scene.remove(obj);
      }
		},
		DisposeScenes: function() {
			if (this.stars_scene) {
				this.dispose3(this.stars_scene);
				this.stars_renderer.render(this.stars_scene, this.stars_camera);
				this.stars_renderer.renderLists.dispose();
				
				this.stars_scene.dispose()
				this.stars_renderer.clear()
				this.stars_renderer.dispose();
				
				delete this.stars_scene;
				delete this.stars_renderer;
			}
			if (this.system_scene) {
				this.dispose3(this.system_scene);
				this.system_renderer.render(this.system_scene, this.system_camera);
				this.system_renderer.renderLists.dispose();
				
				this.system_scene.dispose()
				this.system_renderer.clear()
				this.system_renderer.dispose();
				
				delete this.system_scene;
				delete this.system_renderer;
			}
//			this.system_scene = new THREE.Scene();
//			this.system_camera = new THREE.PerspectiveCamera(perspective_camera_angle, S3.three2.width/S3.three2.height, near_plane, 10000 );
//			this.system_renderer = new THREE.WebGLRenderer({canvas: S3.three2, antialias: true, alpha: true });
			
		},
		// Look around something, for debug.
		DebugAround(distance, position) {
			let vector = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize().multiplyScalar(distance);

			let point = position.clone().add(vector);
			this.system_camera.position.copy(point);
			
			this.system_camera.lookAt(position);
			this.system_renderer.render(this.system_scene, this.system_camera);
			this.RenderStarsDirection();
			let rerun = function() {
				this.DebugAround(distance, position);
			};
			this.timeout = setTimeout(rerun.bind(this), 500);
		},
		
		// Renderer teardown.
    teardown: function() {
			// Note that scenes are disposed only when traveling to another system.
			clearTimeout(this.timeout);
			if (this.temp_layer) {
				this.temp_layer.parentNode.removeChild(this.temp_layer)
			}
			//this.stars_renderer.dispose();
			this.done = true;
			//SU.PopTier();
    },
  };
})();

 
