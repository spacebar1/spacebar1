/*
This one kinda doubles as both a data object and a tier / renderer. Could fix that at some point.
 */

(function() {

		// Time delay between messages.
	let time_delay = 28 * 24; // Month or so.
	
	let all_messages = [
["Colorful Pyramids", "We have reports of colorful pyramids that materialized across the galaxy. Trespassing is not recommended: the pyramids are guarded by strange creatures in black hats, though they seem to stick to themselves when left alone. We also hear that when the aliens can be driven out their buildings make great places to set up microbrews. Their pyramids really light up the night when visited by a crowd..."],
        ["Spatial Anomaly", "An unexplained ripple in space-time has appeared in the nearby vicinity, many parsecs in length. You can't miss it. Our scientists are mounting an expedition to study the phenomenon."],
        ["Disappearing Ships", "We lost contact with our scientists. Nearby aliens are reporting similar losses. Caution should be used when approaching the anomaly."],
        ["Widespread Anomalies", "It seems the strange anomaly is not an isolated event. Similar structures have been identified across the galaxy. The cause is unknown. We have taken to calling them TERM (TERMFULL) due to their strange nature and possible threat to our people."],
        ["Dying Stars", "Be aware that stars in the vicinity of the TERM are disappearing. The cause is unknown, though it is no doubt related to the TERM. Central Command is on high alert."],
        ["Mysterious Message", "We have begun receiving multidirectional broadcast of a digital image on high-frequency subspace channels, repeated at regular intervals. The image is a series of symbols... basic shapes like drawn by a child. The broadcast is originating from all TERM. Their meaning or purpose is unknown. Our linguists are studying the message around the clock."],
        ["Lost Ships", "Widespread reports of lost ships are coming in on a regular basis, linked to proximity to the TERM. WARNING: do not approach TERM. Or approach them at your own peril."],
        ["Mysterious Message, part 2", "Our linguists have decoded a portion of the mysterious message:\n\n"
          +"\"Dear inhabitants of our galaxy, as you are no doubt aware by now we are coming. We have the WMD so you obviously can’t stop us. You can’t fight us. Well you can, but it wouldn’t end well. We’d rather you not fight us. It would be more convenient if you just went away or dealt with each other on your own. But you can’t run from us, either. That would be no good. Unfortunately you may need to die.\""
          +"\n\nOur scientists continue to work around the clock to decode the remainder of the message, though its intent is painfully clear."],
        ["Changing of the Physics", "The TERM continue to grow and appear across the galaxy in all directions. Our physicists are baffled: they are far too large for material of any known type to allow a gravitationally bound structure. They show no gravitational lensing. Yet the TERM appear to block light and radiation of all known types. Put quite simply, our physicists say that these TERM shouldn't exist: they don't obey the natural laws of our universe."],
        ["Mysterious Message, part 3", "Our linguists have decoded a second portion of the mysterious symbol broadcast:\n\n"
       +"\"... It’s nothing personal. Resistance is fungible. Okay, here are our demands: we are looking for an imaginary friend. And then we need to kill them. That’s it. It’s a one-time request. Once we’re done we’ll stop bothering you. You can run but you can’t hide. So please don’t hide. Or run... don’t do that either. We are on a mission. Once it’s complete we will stop razing your cities and slaughtering your people and converting your stars into death weapons.\""
         +"\n\nWe have no idea what this means, or how to meet their demands."],
        ["Root of Evil", "Our scientists have pinpointed the source of the TERM. They originated and spread from sector zed zed nine plural zed alpha at coordinates (0, 0) on bar date "+SU.TimeString(1)+"."],
        ["Diplomatic Solution", "With all attempts at communication failed and their intent clear, we are pursuing alternative strategies to deal with the TERM. A payload of our finest thermonuclear weapons have embarked on a peacemaking mission toward the anomalies."],
        ["Mysterious Message, part 4", "Our linguists have decoded the entirety of the mysterious message:\n\n"
             +"\"... We promise. We’re being sincere. We apologize for any inconvenience to your people and the civilizations we may have destroyed in the process. Okay. That’s all. Oh, what’s that? Okay, fine. Ahem! Message repeats... There. Done. So do you think that will help? It’s not like they’re going to help us after they’re dead... oh, what? Still? Well where’s the damn... oh there it is... No, forget it. No I’m not doing it again. Just broadcast the thing on a loop. Oh, I do? Fine, whatever. Ahem! Message repeats...\"",
         ],
       ["Diplomacy Failed", "The TERM were unaffected by our peace envoy. Stay tuned for next steps..."],
        ["Certain Doom", "This is the intern posting. I'm not sure if I should be doing this, but everyone that works at the ministry has fled. I think this will be our final broadcast. I'm no authority, but I would suggest that all non-essential personnel evacuate the core systems, if you haven't already. Most are fleeing for distant regions. A few have gone to worship the anomalies. Some have refused to evacuate, not surprisingly, including all the shopkeepers committed to keeping their stores open. If you can read this message: RUN! Run for your lives. And it may be a good time to make peace with whatever deity you worship, or find one if you're behind the times."],
		 // Reminder to keep it at 23 or fewer messages, for the 'X' to work.
		 // 14 messages currently.
		 // Raw earlier message: Dear inhabitants of our galaxy, as you are no doubt aware by now we are coming. Obviously, you can’t stop us. You can’t fight us. Well you can, but it wouldn’t end well. We’d rather you not fight us. It would be more convenient if you just went away and dealt with each other on your own. But you can’t run from us, either. That would be no good. Unfortunately you may need to die. It’s nothing personal. Resistance is fungible. Okay, here are our demands: we are looking for a (an imaginary?) friend. And then kill them. That’s it. It’s a one-time request. Once we’re done we’ll stop bothering you. You can run but you can’t hide. So please don’t hide. Or run... don’t do that either. We’re on a mission. Once it’s complete we will stop razing your cities and slaughtering your people and converting your stars into death weapons. We promise. We’re being sincere. We apologize for any inconvenience to your people and the civilizations we may have destroyed in the process. Okay. That’s all. Oh, what’s that? Okay, fine. Ahem! Message repeats... There. Done. So do you think that will help? It’s not like they’re going to help us after they’re dead... oh, what? Still? Well where’s the damn... oh there it is... No, forget it. I’m not doing it again. Just broadcast the damn thing on a loop. Oh, I do? Fine, whatever. Ahem! Message repeats...
	];
	
	// Nicknames for the spheres.
	let nicknames = [
		["DYSON Superballs", "Dynamically Yielded Structures Out of Nothing"],
		["ROUS", "Ridiculously Oversized and Unnaturally Spherical"],
		["SPACEBALLs", "Synchronously Placed And Curiously Empty Ballistically Accelerating Linear Lesions"],
//		["WTFs", "Witnessed Theoretical Fractures"],
		["WTFs", "Wavy Transformational Fluxes"],
//		["WTFs", "Weird Tensor Fields"],
//		["WTFs", "WTF are those giant things"],
		["AREA51s", "Anomalous Regions Easily Abolished 51 of our best scientists"],
		["CTHULHUs", "Critical Threats Having Unlimited Local Hadron Ubiquitousness"],
		["JEFFREYs", "Because no one ever expects anything terrible to come from something named Jeffrey"],
		["BFG9000", "Big Flying Globes of 9000 parsecs or more"],
		["SITH", "Strongly Accelerating Transitional Hemorrhage"],
		["BORG", "Boring Originators of Romero Green space zombies"],
		["TROPEs", "Tactical Reuse Of Popular Explanations"],
		["MORDOR", "Massive, Obtrusive Round Domes Over Reality"],
		["CYLONS", "Crimson, Yellow, Lime, Orange and Navy Spheres"],
		["Species 8472", "The number of spheres identified before we lost count"],
		["REAPERs", "Rapid Eradication And Probably Exterminating Races"],
		["DALEKs", "Deadly Anomalous Leaks"],
		["REAVERs", "Replicating Ecosystem And Variable Environment Radii"],
	];
	
	let filler1pre = [
		"I know a thing about",
		"Tell me about",
		"You know about",
		"Don't ask about",
		"I have a question about",
		"You wanted to know about",
		"Don't mention anything about",
		"You mentioned something about",
		"I forgot about",
		"Forget about",
		"We should sync about",
		"I'll tell them about",
		"I have bad news about",
		"I have good news about",
		"I don't know anything about",
		"I'd like to know about",
		"I heard you found out about",
		"I heard you know about",
		"I know you know about",
		"You should tell me about",
		"You should know about",
	];
	let filler1post = [
		"sister",
		"mother",
		"money",
		"ship",
		"retreat",
		"stuff",
		"contraband",
		"life",
		"head",
		"battle",
		"fight",
		"cargo",
		"friend",
		"family",
		"coat",
		"pet",
		"music",
		"guitar",
		"gum",
		"love",
		"target",
		"food",
		"style",
		"health",
		"game",
		"data",
		"problem",
		"activity",
		"video",
		"goal",
		"disease",
		"weapon",
		"finding",
		"statement",
		"photo",
		"loss",
		"donation",
		"error",
		"fortune",
		"book",
		"trade",
		"reason",
		"chance",
		"profit",
		"travel",
		"case",
		"group",
		"work",
		"plight",
		"symptom",
		"advice",
		"outlook",
		"situation",
		"predicament",
		"clothes",
		"eyepiece",
		"laptop",
		"shoe",
		"finger",
		"leg",
		"heart",
		"hat",
		"cross stitching",
		"indie game",
		"space game",
		"stuffed animal",
		"toy",
		"stapler",
		"cheese dip",
		"sanity",
		"references",
		"grief",
		"history",
		"home",
		"safety",
		"infection",
		"parasite",
		"children",
		"facehugger",
		"new head",
		"lost stuff",
	];
	
	let filler2pre = [
		"Ask",
		"Meet",
		"Tell",
		"Don't tell",
		"Never ask",
		"Contact",
		"Don't contact",
//		"Engage",
		"Show",
//		"Hide",
//		"Follow",
//		"Imitate",
//		"Know",
//		"Sing to",
//		"Pursue",
		"Find",
//		"Attack",
//		"Forget",
//		"Ignore",
//		"Worship",
		"Lie to",
//		"Celebrate",
//		"Friend",
	];
	
	let filler2post = [
		"at the dock",
		"about your mother",
		"about your sister",
		"about the authorities",
		"if you like",
		"again",
		"or their godparents",
		"over the BBS",
		"or forget me",
		"or else",
		"this time",
		"if you want",
		"or die trying",
		"over and over",
		"to find the truth",
		"about a doctor",
		"it's about time",
		"it's time",
		"at your own risk",
		"if you dare",
		"you fool",
		"you idiot",
		"you genius",
		"you recluse",
		"you savant",
		"about gossip",
		"in private",
		"offline",
		"another time",
		"openly",
		"I have a lawyer",
		"about bad news",
		"if you have any sense",
		"it's your fault",
		"it's my fault",
		"you did before",
		"if that's how you deal",
		"at your peril",
		"I have a gun",
		"I'm reloading",
		"I brought a gift",
		"I have kids",
		"I'm single",
		"I'm sleepy",
		"I'm wired",
		"I don't care",
		"I care deeply",
		"I'm not that nice",
		"I know people",
		"I can't help",
		"I can help",
		"I might help",
	];
	
			// Maybe you should ask your mother.
			// Meet me at the dock.
			// Why are you asking me?
			// Never ask me that.
			// Are you kidding? This is a public broadcast.	
	
	context: null,
    SBar.InformationRenderer = function(data) {
        this._initInformationRenderer(data);
    };

    SBar.InformationRenderer.prototype = {
      type: SF.TIER_INFORMATIONR,
			data: null,
			context: null,
			_initInformationRenderer: function(data) {
				this.context = SC.layer2;
				this.data = data;
      },
      activate: function() {
				SU.clearTextNoChar();
				SU.addText("X: Leave")
				this.text_layout = new SBar.TextLayout(this.context);
				if (this.data.raceseed == SF.RACE_SEED_ALPHA) {
					this.RenderAlpha();
				} else {
					this.RenderNormal();
				}
//	      SG.activeTier.teardown();
        SG.activeTier = this;				 
      },
			
			RenderAlpha: function() {
	      SU.displayBorder("Imaginarium and Reconstitution Console (IRC)", this.context);

				let player_name = S$.crew[0].name;
				this.text_layout.prepRight("Project Progress");
				this.text_layout.AddValue("Step 1: Take over galaxy","Imminent");
				this.text_layout.AddValue("Step 2: Capture "+player_name,"Imminent");
				this.text_layout.AddValue("Step 3: Kill "+player_name,"Imminent");
				this.text_layout.AddValue("Step 4: Re-imagine "+player_name,"Pending");
				this.text_layout.AddValue("Step 5: Profit?","Pending");

				this.text_layout.prepLeft(this.data.systemData.name+" Command Dashboard");
				this.text_layout.AddValue("Foreman on duty: "+ST.getWord(this.data.raceseed, this.data.seed+1.11));
				let yacht_location = coordToParsec(S$.bossxy[0])+", "+coordToParsec(-S$.bossxy[1])+"pc";
				this.text_layout.AddValue(SF.GAME_NAME+" location: "+yacht_location);
				let status_terms = ["Awesome", "Awesomer", "Awesomest", "Awesome squared", "Awesome + infinity", "Awesome and beyond"];
				let status_term = status_terms[Math.floor(SU.r(this.data.seed, 8.322)*status_terms.length)];
				this.text_layout.AddValue("Supreme Leader status: "+status_term);
				let days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
				let day = days[Math.floor(SU.r(this.data.seed, 8.32)*days.length)];
				this.text_layout.AddValue("Casual Day: "+day);
				this.text_layout.AddValue("Number of days since accident: "+Math.floor(S$.time/24).toLocaleString());
				this.text_layout.AddValue("Minions in system: "+(Math.floor(SU.r(this.data.systemData.seed, 8.35)*100000)+5000).toLocaleString());
				let positions = ["Soldier","Lemming","Decoy","Pilot","Cannon Fodder","Gunner","Number Two","Foreman","Cook","Dogmeat"];
				let position = positions[Math.floor(SU.r(this.data.seed, 8.33)*positions.length)];
				this.text_layout.AddValue("Position hiring: "+position);
				this.text_layout.AddValue("Work type: Involuntary");
				this.text_layout.AddValue("Pay scale: "+SF.SYMBOL_CREDITS+"0");
				let day2 = days[Math.floor(SU.r(this.data.seed, 8.34)*days.length)];
				this.text_layout.AddValue("Weekly dance: "+day2);
				this.text_layout.AddValue("Systems subdued: "+Math.round(S$.time*10000000*(1-SU.r(2.12, 8.36)*0.97)).toLocaleString());  // Global seed.
				this.text_layout.AddValue("Lunch menu: "+ST.getWord(this.data.raceseed, this.data.seed+1.12));
				let features = ["Gluten-free", "No MSG", "Dairy", "Vegan", "Vegetarian", "Keto", "Ice cream", "Cotton candy", "Pill form"];
				let feature = features[Math.floor(SU.r(this.data.seed, 8.33)*features.length)];
				this.text_layout.AddValue("Lunch feature: "+feature);
				let missings = ["Red stapler", "Inbox", "Outbox", "Pink slip", "Amazon box", "Silly putty", "Yo-yo", "Fidget spinner"];
				let missing = missings[Math.floor(SU.r(this.data.seed, 8.33)*missings.length)];
				this.text_layout.AddValue("Lost-and-found: "+missing);

			},
		
			RenderNormal: function() {
	      SU.displayBorder("Intragalactic Rapid Communication (IRC)", this.context);
				
				this.text_layout.prepLeft("Wideband Transmission Fabric (WTF)");
				

				let messages = [];
				for (let i = 0; i < all_messages.length; i++) {
					let announce_time = time_delay * i;
					if (S$.time >= announce_time) {
						messages.push([all_messages[i], announce_time]);
					}
				}
				for (let i = 0; i < messages.length; i++) {
					let reverse_num = messages.length-i-1;
					let char = String.fromCharCode('A'.charCodeAt() + reverse_num);
					// Reverse order.
					let message_pair = messages[reverse_num];
					this.text_layout.AddValue(char+": "+message_pair[0][0], SU.TimeString(message_pair[1]));
					SU.addText(char+": Message Details")
				}
				
				// Set up microbrews in the ruins, and they seem to light up quite spectacularly. Black hats. 

				this.text_layout.prepRight("Basic Broadcast Subsystem (BBS)");
				this.AddFiller();
			},
			
			AddFiller: function() {
//				for (let i = 0; i < 10; i++) {
					let source = ST.getWord(this.data.raceseed, 7.65+S$.time);
					let target = ST.getWord(this.data.raceseed, 7.66+S$.time);
					this.AddFillerQuestion(SU.r(this.data.seed, 7.71+S$.time), source, target);
					//this.AddFillerAnswer(SU.r(this.data.seed, 7.72+i+S$.time), source, target);
//				}
			},

			AddFillerQuestion: function(seed, source, target) {
				let msg1 = filler1pre[Math.floor(SU.r(seed, 1.23)*filler1pre.length)];
				let subject = "";
				let subject2 = "";
				let subject_r = SU.r(seed, 1.231);
				if (subject_r < 0.25) {
//					if (subject_r < 0.1) {
//						subject = "my";
//						subject2 = "yourself";
//					} else {
						subject = "my";
						subject2 = "me";
//					}
				} else if (subject_r < 0.5) {
					subject = "your";
					subject2 = "me";
				} else if (subject_r < 0.6) {
					subject = "her";
					subject2 = "her";
				} else if (subject_r < 0.7) {
					subject = "his";
					subject2 = "him";
				} else if (subject_r < 0.8) {
					subject = "their";
					subject2 = "them";
				} else {
					//subject2 = ST.getWord(this.data.raceseed, 7.95+S$.time);
					subject2 = "me";
					subject = ST.getWord(this.data.raceseed, 7.95+S$.time)+"'s";
				}
				let msg2 = filler1post[Math.floor(SU.r(seed, 1.24)*filler1post.length)];
				let msg3 = filler2pre[Math.floor(SU.r(seed, 1.25)*filler2pre.length)];
				let msg4 = filler2post[Math.floor(SU.r(seed, 1.26)*filler2post.length)];
				this.text_layout.AddValue(target+":");				
				this.text_layout.AddWrapText("   "+msg1+" "+subject+" "+msg2+".");
				this.text_layout.AddValue("      -"+source);

				this.text_layout.AddValue("");
				this.text_layout.AddValue(source+":");
				this.text_layout.AddWrapText("   "+msg3+" "+subject2+" "+msg4+".");
				this.text_layout.AddValue("      -"+target);
//				this.text_layout.AddValue(target+": "+msg1+" "+msg1a+" "+msg2+" -"+source);
//				this.text_layout.AddValue(source+": "+msg3+" "+msg4+" -"+target);
			},
			
			ShowMessage: function(message_num) {
				if (message_num * time_delay > S$.time) {
					return;
				}
				// Single nickname for all instances.
				let nickname_pair = nicknames[Math.floor(SU.r(12.31, 12.32)*nicknames.length)];
				let message = all_messages[message_num][1];
				message = message.replace(/TERMFULL/g, nickname_pair[1]);  // Before next line.
				message = message.replace(/TERM/g, nickname_pair[0]);
				if (all_messages[message_num][0] == "Mysterious Message") {
					let message_symbols = "";
					for (let i = 0; i < 100; i++) {
						message_symbols += ST.getWord(SF.RACE_SEED_ALPHA, 71.3+i) + " ";
					}
					message += "\n\n"+message_symbols;
				}
				SU.ShowWindow(all_messages[message_num][0], message, /*callback=*/undefined, "ⓘ");
			},
			
      handleKey: function(key) {
				if (this.data.raceseed !== SF.RACE_SEED_ALPHA) {
					let message_num = key-SBar.Key.A;
					if (message_num < all_messages.length) {
						this.ShowMessage(message_num);
						return;
					}
				}
        switch (key) {
          case SBar.Key.X:
            this.Leave();
            break;
          default:
            error("unrecognized key in inr: " + key);
        }
      },
      Leave: function() {
				// Special case, extra pop to pull down the planetside background.
				SU.PopTier();
				SU.PopTier();
      },
			teardown: function() {
				// no-op.
			},
    };
    SU.extend(SBar.InformationRenderer, SBar.Tier);
})();
