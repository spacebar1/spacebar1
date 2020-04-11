(function() {


    SBar.CreditsRenderer = function() {
        this._initCreditsRenderer();
    };

    SBar.CreditsRenderer.prototype = {
			s: 0, // Rotating seed.
			names_generated: 0,
			current_image: null,
			current_context: null,
			next_image: null,
			next_context: null,
			mask_image: null,  // White pillar.
			mask_image2: null,  // Fade in.
			temp_mask_image: null,
			temp_mask_context: null,
			credits_y: 0,
			credits_y_delta: 0.6,
//			credits_y_delta: 8,
			credits_image: null,
			frame_ms: 20,
			background_count: 0,
			background_duration_frames: 500, // 10 sec. More or less
			background_duration_frames_base: 500, // 10 sec.
			lower_layers: null, // All the drawing layers except top. In order.
			top_layer: null,
			draw_functions: null,
			timeout: null,

			_initCreditsRenderer: function() {
				this.lower_layers = [];
				this.lower_layers.push(SC.layer1);
				this.lower_layers.push(SC.layer2);				
				this.lower_layers.push(SC.layer3);				
				
				this.top_layer = SC.layer3;
      },
			
	    activate: function(callback) {
	      SG.activeTier = this;			
				SU.clearTextNoChar();
				SU.addText("X: Exit to Main Menu");
				S$.ship.sensor_level = 20;
				this.DrawCredits();
				
	      this.current_image = document.createElement('canvas');
	      this.current_image.width = SF.WIDTH;
	      this.current_image.height = SF.HEIGHT;
	      this.current_context = this.current_image.getContext('2d');

	      this.next_image = document.createElement('canvas');
	      this.next_image.width = SF.WIDTH;
	      this.next_image.height = SF.HEIGHT;
	      this.next_context = this.next_image.getContext('2d');
				
	      this.temp_mask_image = document.createElement('canvas');
	      this.temp_mask_image.width = SF.WIDTH;
	      this.temp_mask_image.height = SF.HEIGHT;
	      this.temp_mask_context = this.temp_mask_image.getContext('2d');
				
				// White pillar.
	      this.mask_image = document.createElement('canvas');
	      this.mask_image.width = SF.WIDTH;
	      this.mask_image.height = SF.HEIGHT;
	      let mask_context = this.mask_image.getContext('2d');
  			let color_stops = [0, 'rgba(0,0,0,0.0)', 0.4, 'rgba(255,255,255,0.5)', 0.6, 'rgba(255,255,255,0.5)', 1, 'rgba(0,0,0,0)'];
				SU.rectGrad(mask_context, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, SF.WIDTH, 0, color_stops)


				// Vertical gradient that will be used to fade out the text.
	      this.mask_image2 = document.createElement('canvas');
	      this.mask_image2.width = SF.WIDTH;
	      this.mask_image2.height = SF.HEIGHT;
	      let mask_context2 = this.mask_image2.getContext('2d');
  			color_stops = [0, 'rgba(0,0,0,0.0)', 0.1, 'rgba(0,0,0,0.0)', 0.3, 'rgba(255,255,255,1)', 0.7, 'rgba(255,255,255,1)', 0.9, 'rgba(0,0,0,0.0)', 1, 'rgba(0,0,0,0)'];
				SU.rectGrad(mask_context2, 0, 0, SF.WIDTH, SF.HEIGHT, 0, 0, 0, SF.HEIGHT, color_stops)
				
				this.TakeScreenshot(this.next_context);
				
				this.DrawUpdate();
			},
			
			DrawUpdate: function() {
				if (this.credits_y > this.credits_image.height) {
					this.TrueTeardown();
					return;
				}
				// Fade the text vertically.
				this.temp_mask_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				this.temp_mask_context.drawImage(this.mask_image2, 0, 0);
				this.temp_mask_context.save();
				this.temp_mask_context.globalCompositeOperation = "source-in";
				this.temp_mask_context.drawImage(this.credits_image, SF.HALF_WIDTH-150, SF.HEIGHT*0.85-this.credits_y);
				this.temp_mask_context.restore();
				
				this.top_layer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				
				if (this.background_count <= 20) {
					this.top_layer.drawImage(this.current_image, 0, 0);
					this.top_layer.save();
					this.top_layer.globalAlpha = this.background_count*5/100;
					this.top_layer.drawImage(this.next_image, 0, 0);
					this.top_layer.restore();
				} else {
					this.top_layer.drawImage(this.next_image, 0, 0);
				}
				this.background_count++;
				if (this.background_count > this.background_duration_frames) {
					this.background_count = 0;
					this.background_duration_frames = Math.round((0.5+2.5*SU.r(this.s++, 8.60))*this.background_duration_frames_base);
					this.current_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
					this.current_context.drawImage(this.next_image, 0, 0);
					this.TakeScreenshot(this.next_context);
				}
				
				this.top_layer.drawImage(this.mask_image, 0, 0);
				this.top_layer.drawImage(this.temp_mask_image, 0, 0);
				
				this.credits_y += this.credits_y_delta;
				this.timeout = window.setTimeout(this.DrawUpdate.bind(this), this.frame_ms);
			},
			
			DrawCredits: function() {
				// One long image is doable here.
	      this.credits_image = document.createElement('canvas');
	      this.credits_image.width = 300;
	      this.credits_image.height = 7000;
	      let context = this.credits_image.getContext('2d');
				
				let x = 150;
				
				let y = 50;
				SU.text(context, SF.GAME_NAME, x, y, 'bold 30pt '+SF.FONT, '#444', 'center');
				y += 40;
				
				// Group the text to have extra custom text at the end.
				let text_groups = [];
				for (name_group of name_groups) {
					let group = [name_group[0]];
					let num = name_group[1] + Math.floor(SU.r(this.s++, 8.50)*(name_group[2]-name_group[1]+1));
					for (let i = 0; i < num; i++) {
						let name = this.RandName();
						group.push(name);
					}
					text_groups.push(group);
				}
				let special_group = ["Special Thanks To:"];
				special_group.push("Melanie");  // Jeff's wife, for putting up with Jeff and this game for so many years.
				special_group.push("Anastasia");  // Jeff's daughter, for her lifelong support.
				special_group.push("Steve");  // Steve Hess, for great early design input.
				special_group.push("Jeff");  // Jeff Hoy, main game author.
				special_group.push("NASA");  // For taking our imaginations into reality.
				special_group.push("Wikipedia Authors");  // For creating a great space reference.
				special_group.push("And You!");
				special_group.push("Our Intrepid Explorer");  // For everything you'll do in life.
				text_groups.push(special_group);
				text_groups.push(["", ""]);
				text_groups.push(["", ""]);
				text_groups.push(["We *Care* About your Comments", "Call us at: "+this.RandName()+this.RandName()+this.RandName()]);
				text_groups.push(["", ""]);
				text_groups.push(["", ""]);
				text_groups.push(["Thanks for Playing!", "Your patronage helps support", "the development of SPACEBAR-2:", "The Search for More Space.", "And More Bar."]);
				text_groups.push(["", ""]);
				text_groups.push(["", ""]);
				text_groups.push(["Made...", "In Pittsburgh"]);
				
				//let min = 0;
				//let max = 0;
				for (text_group of text_groups) {
					y += 10;
					SU.text(context, text_group[0], x, y, SF.FONT_LB, '#444', 'center');
					y += 21;
					for (let i = 1; i < text_group.length; i++) {  // Starts at 1.
						SU.text(context, text_group[i], x, y, SF.FONT_M, '#000', 'center');
						y += 19;
					}
//					let num = name_group[1] + Math.floor(SU.r(this.s++, 8.50)*(name_group[2]-name_group[1]+1));
//					for (let i = 0; i < num; i++) {
//					}
					//min += name_group[1]
					//max += name_group[2]
				}
			},
			
			TakeScreenshot: function(target_context) {
				target_context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				for (let layer of this.lower_layers) {
					layer.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
				}

				// Belt is here twice because it's less likely to succeed (frequency per system).
				if (!this.draw_functions) {
					this.draw_functions = [this.DrawStarmap.bind(this), this.DrawSystem.bind(this), this.DrawPlanet.bind(this), this.DrawSurface.bind(this), this.DrawPlanetside.bind(this), this.DrawBelt.bind(this), this.DrawBelt.bind(this)];
				}

				let success = false;
				while (!success) {
					let draw_function = this.draw_functions[Math.floor(SU.r(this.s++, 8.16)*this.draw_functions.length)];
					success = draw_function();
				}

				for (let layer of this.lower_layers) {
					if (layer && layer.canvas) {
						// Scale it down for fullscreen to scale it back up.
						target_context.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, SF.WIDTH, SF.HEIGHT);
					}
				}
				if (SG.activeTier !== this && SG.activeTier.teardown) {
					SG.activeTier.teardown();
				}
	      SG.activeTier = this;			
				SU.clearTextNoChar();
				SU.addText("X: Exit to Main Menu");
			},
			
			DrawSystem: function() {
				this.GetRandSystem().activateTier();
				return true;
			},
			
			DrawStarmap: function() {
				let starmap = new SBar.StarmapTier();
				let xy = this.RandXY();
				starmap.activate(xy.x, xy.y);
				return true;
			},
			
			DrawPlanet: function() {
				let system = this.GetRandSystem();
				if (system.numplanets <= 0) {
					return false;
				}
				let index = Math.floor(SU.r(this.s++, 8.14)*system.numplanets);
				system.planets[index].activateTier();
				return true;
			},
			
			DrawSurface: function() {
				let system = this.GetRandSystem();
				if (system.numplanets <= 0) {
					return false;
				}
				let index = Math.floor(SU.r(this.s++, 8.14)*system.numplanets);
				system.planets[index].activateTier();
				return true;
			},
			
			DrawPlanetside: function() {
				let system = this.GetRandSystem();
				if (system.numplanets <= 0) {
					return false;
				}
				let index = Math.floor(SU.r(this.s++, 8.14)*system.numplanets);
				system.planets[index].activateTier();
				SG.activeTier.Visit();
				return true;
			},
			
			DrawBelt: function() {
				let system = this.GetRandSystem();
				if (system.numbelts <= 0) {
					return false;
				}
				let index = Math.floor(SU.r(this.s++, 8.15)*system.numbelts);
				let belt = system.belts[index];
				belt.activateTier();
				return true;
			},
			
			GetRandSystem: function() {
				let xy = this.RandXY();
				var region = new SBar.RegionData(xy.x, xy.y);
				let num_systems = region.systems.length;
				let index = Math.floor(SU.r(this.s++, 8.13)*num_systems);
				let system = region.systems[index];
				system.generate();
				return system;
			},
			
			// Random XY, with preference for areas toward the center, for greater chance where the player may have visited.
			RandXY: function() {
				// Skew toward the center.
				let x = SU.r(this.s++, 8.10)*SU.r(this.s++, 8.10)*100000;
				let y = SU.r(this.s++, 8.11)*SU.r(this.s++, 8.11)*100000;
				return {x: x, y: y};
			},
			
			RandName: function() {
				this.names_generated++;
				if (this.names_generated < 20 || (this.names_generated < 70 && SU.r(this.s++, 8.30)*50 > this.names_generated-20)) {
					let first_index = Math.floor(SU.r(this.s++, 8.20)*first_names.length);
					let last_index = Math.floor(SU.r(this.s++, 8.21)*surnames.length);
					return first_names[first_index]+" "+surnames[last_index];
				}
				if (this.names_generated < 120 || (this.names_generated < 220 && SU.r(this.s++, 8.30)*50 > this.names_generated-120)) {
					let race = 8.32+this.s++;
					return ST.getWord(race, 8.33)+" "+ST.getWord(race, 8.34);
				}
				return ST.getWord(SF.RACE_SEED_ALPHA, 8.32+this.s++)
			},
			
	    handleKey: function(key) {
	      switch (key) {
					case SBar.Key.X:
						this.TrueTeardown();
						break;
				}
			},
			
			// No-op teardown for the generated teirs to not call into anything.
			teardown: function() {
				
			},
			
			TrueTeardown: function() {
				let callback = function() {
					// Full clear of all layers.
					if (this.timeout) {
						clearTimeout(this.timeout);
					}
					SU.PopTier();
					for (let obj in SC) {
						SC[obj].clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
					}
					new SBar.StartPage().activate();
				}
				SU.fadeOutIn(callback.bind(this));
			},
    };
		
		// Name, min count, max count.
		// Totals 140 - 214 names.
		let name_groups = [
			["Executive Producer", 1, 1],
			["Associate Producer", 1, 1],
			["Assistant Producers", 2, 3],
			["Lead Designer", 1, 1],
			["Data Architect", 1, 1],
			["Visuals Architect", 1, 1],
			["Functional Architect", 1, 1],
			["Starmap Architects", 2, 4],
			["Planet Design Team", 3, 5],
			["Surface Concept Art", 1, 1],
			["Surface Art Team", 2, 3],
			["Buildings Concept", 1, 1],
			["Building Positioning", 1, 3],
			["Level Design", 1, 1],
			["Combat Design", 1, 1],
			["Combat Art", 2, 3],
			["Combat AI", 2, 3],
			["Executive Team", 3, 5],
			["Development Director", 1, 1],
			["Lead Programmers", 2, 3],
			["Core Engine Programmers", 7, 13],
			["Graphics Programmers", 2, 4],
			["3D Development Team", 2, 3],
			["Wormhole Implementation", 1, 1],
			["Events Framework", 1, 1],
			["Events Implementation", 1, 1],
			["Chief Writer", 1, 1],
			["Research Team", 2, 3],
			["Story Writers", 2, 4],
			["Plot Development Team", 3, 5],
			["Art Director", 1, 1],
			["Lead Artists", 2, 3],
			["Visuals Design Team", 5, 11],
			["Player Design", 1, 1],
			["Items Framework", 1, 2],
			["Items Implementation", 2, 3],
			["Item Text", 1, 1],
			["Asteroid Implementation", 1, 2],
			["Starport Implementation", 1, 2],
			["Mining Implementation", 1, 1],
			["Quest Framework", 1, 1],
			["Chief Sound Engineer", 1, 1],
			["Musical Composition", 1, 1],
			["Voice Acting", 1, 2],
			["Sound Effects", 1, 3],
			["Marketing Lead", 1, 1],
			["Marketing Team", 2, 3],
			["Project Management", 2, 3],
			["Costume Designer", 1, 1],
			["Production Lead", 1, 1],
			["Production Team", 8, 12],
			["QA Director", 1, 1],
			["QA Leads", 2, 4],
			["QA Harness Implementation", 2, 3],
			["QA Team", 13, 21],
			["Cutscene Director", 1, 1],
			["Cutscene Movie Crew", 5, 7],
			["Line Managers", 2, 4],
			["Packaging and Distribution", 3, 5],
			["Manual and Documentation", 2, 4],
			["Internationalization Team", 2, 3],
			["Tech Support", 2, 3],
			["Hair Stylists", 2, 2],
			["Interns", 2, 4],
			["Uncredited Cameos", 13, 17],
		];
		
		// Top names from https://en.wikipedia.org/wiki/List_of_most_popular_given_names
		let first_names = [
			"Mohamed", "Abdelkader", "Ahmed", "Youssef", "Yassin",
			"Peter", "Pierre", "George", "Manuel", "Juan", "Antonio",
			"Mamadou", "Moussa", "Mahamadou",
			"Hamza", "Junior", "Blessing", "Gift", "Mehdi", "Aziz",
			"Fatima", "Sara", "Fatiha",
			"Shaimaa", "Fatma", "Maha", "Mary", "Marie", "Mariam",
			"Isabel", "Esperanza", "Aya", "Rania", "Sarah",
			"Fatoumata", "Mariam", "Aminata",
			"Salma", "Imane", "Rita",
			"Precious", "Princess", "Angel",
			"Mariam", "Shayma", "Khawla",
			"Santiago", "Mateo", "Juan",
			"Daniel", "Dylan", "Kevin",
			"Miguel", "Arthur", "Davi",
			"Noah", "Liam", "Jackson",
			"William", "Logan",
			"Agustín", "Benjamín", "Vicente",
			"Stevenson", "Stanley", "Samuel",
			"Jayden", "Daniel", "Joshua",
			"Ramón", "Juan", "José",
			"Luis", "Alexander",
			"Sebastián", "Ian",
			"James", "John", "Robert",
			"Sofía", "María", "Lucía",
			"Alysha", "Isabella", "Emily",
			"Alice", "Valentina", "Helena",
			"Olivia", "Emma", "Charlotte", "Ava",
			"Léa", "Alice",
			"Sofía", "Emilia", "Isidora",
			"Widelene", "Mirlande", "Islande",
			"Gabrielle", "Amelia", "Tianna",
			"Ximena", "Valentina",
			"Elizabeth", "Beatriz", "Valentina", "Camila",
			"Patricia", "Linda", "Florencia", "Agustina",
			"An", "Bo", "Cheng", "De", "Dong", "Feng", "Gang", "Guo",
			"Hui", "Jian", "Jie", "Kang", "Liang", "Ning", "Peng", "Tao",
			 "Wei", "Yong", "Wen",
			"Aarav", "Reyansh", "Hossein", "Ori", "Ariel", "Noam", "Amit",
			"Elias", "Majd", "Adam", "Omri", "Eyal", "Minato", "Ichika",
			"Itsuki", "Ren",
			"Elie", "Charbel", "Amar",
			"Baatar", "Krishna", "Kiran",
			"Nathaniel", "Gabriel",
			"Maryam", "Jana",
			"Ai", "Bi", "Cai", "Dan", "Fang", "Hong", "Hui", "Juan",
			"Lan", "Li", "Lian", "Na", "Ni", "Qian", "Qiong", "Shan",
			"Shu", "Ting", "Xia", "Xian", "Yan", "Yun", "Zhen",
			"Aadya", "Diya", "Saanvi",
			"Tamar", "Avigail", "Adele",
			"Eden", "Yarin", "Nur",
			"Sakura", "Riko", "Aoi",
			"Rimas", "Jana", "Hala",
			"Ayzere", "Inzhu", "Ayaru",
			"Nor", "Hannah", "Aishah",
			"Odval", "Bolormaa", "Bayarmaa",
			"Shristi", "Sunita", "Raibina",
			"Angel", "Althea",
			"Noel", "Joel", "Marc", "Eric",
			"Davit", "Narek", "Lukas", "Jakob",
			"Maksim", "Artsiom",
			"Lucas", "Louis", "Hugo",
			"Stefan", "Georgi", "Aleksandar",
			"Ben", "Jonas", "Malik", "Aputsiaq",
			"Bence", "Levente",
			"Aron", "Jack", "Mihail", "Damjan", "Oksar",
			"Antoni", "Jakub", "Szymon",
			"João", "Martim", "Rodrigo",
			"Dragan", "Nikola", "Jakub",
			"Amelia", "Ajla", "Melisa",
			"Nareh", "Mari", "Maneh",
			"Zahra", "Nuray", "Sevinj", "Gunel",
			"Amina", "Merjem", "Viktoria",
			"Mia", "Lucija", "Tereza",
			"Ellen", "Pipaluk", "Daisy", 
			"Hanna", "Emily", "Jana", "Nora",
			"Zuzanna", "lena", "Leonor", "Matilde",
			"Sofiya", "Mariya", "Zala", 
			"Ane", "June", "Nahia", "Martina", "Alie",
			"Hiro", "Teiki", "Moana", "Marama", "Teva", "Tehei", "Ioane",
			"Tiare", "Hinano", "Poema", "Maeva", "Vaea", "Moeata", "Teura", "Heikapu",
			// Special names.
			"Walter", "Alan", "David",
		];

		// From https://en.wikipedia.org/wiki/List_of_most_common_surnames_in_Asia and other pages.
		let surnames = [
			"Hovhannisyan", "Sargsyan", "Grigoryan", "Mammadov", "Aliyev", "Huseynov",
			"Ahmed", "Vuennaa", "Ali", "Bonik", "Bosu", "Chowdhury",
			"Debnath", "Gazi", "Marma", "Mirza", "Saha", "Thakur",
			"Wong", "Lau", "Lee", "Cheung", "Chan", "Yeung", "Chiu",
			"Cohen", "Levi", "Mizrachi", "Peretz", "Biton", "Dahan",
			"Satō", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Itō", "Nakamura", "Kobayashi",
			"Kim", "Lee", "Park", "Jeong", "Kang", "Cho", "Yoon", "Jang", "Lim", "Han",
			"Santos", "Reyes", "Cruz",
			"Perera", "Fernando", "de Silva", "Bandara", "Kumara",	"Chen",
			"Kilmaz", "Kaya", "Demir", "Sahin", "Celik", "Yildiz",
			"Nguyen", "Tran", "Le", "Pham",
			"Gruber", "Huber", "Bauer", "Wagner",
			"Peeters", "Janssens", "Maes",
			"Ivanov", "Georgiev", "Dimitrov",
			"Horvat", "Babic", "Maric",
			"Novak", "Svoboda", "Dvorak",
			"Nielsen", "Jensen", "Hansen",
			"Tamm", "Saar", "Sepp",
			"Smirnov", "Vassiljev", "Petrov",
			"Joensen", "Hansen", "Jacobsen",
			"Martin", "Bernard", "Dubois",
			"Muller", "Schmidt", "Schneider",
			"Murphy", "Kelly", "Sillivan",
			"Rossi", "Russo", "Ferrari",
			"Krasniqi", "Gashi", "Berisha",
			"Nowak", "Kowalski", "Silva", "Pereira", "Costa",
			"Popa", "Popescu", "Pop",
			"Gonzalez", "Rodriguez", "Hernandez",
			"Tremblay", "Gagnon", "Roy",
			"Smith", "Johnson", "Williams",
			"Garcia", "Lopez", "Gomez", "Sanchez", "Diaz", "Castro",
			"Sousa", "Oliveira", "Lima", "Gomes",
			"Tjon", "Pinas", "Chin", "Mohan",
			"Devi", "Zhang", "Li", "Liu", "Singh", "Wu", "Xu",
			"Brown", "Miller", "Davis", "Garcia", "Anderson", "Taylor", "Thomas",
			"Moore", "Martin", "White", "Harris", "Clark", "Walker", "Hall",
			"Allen", "Young", "King", "Green", "Gonzalez", "Baker", "Sanchez",
			"Rivera", "Cox", "Ward", "Torres", "Sanders", "Flores", 
			// Special names.
			"Plinge", "Spelvin", "Smithee", "Agnew",
		]		
})();




 
