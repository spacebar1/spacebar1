(function() {
	// Hero background:
  // 3 paragraphs:
	//   1. How the hero is met. What they do at the bar, how they look. How they approach.
	//   2. The hero's story. How they grew up, what they want.
	//   3. Interaction / ending. What they are looking for. Why they'd join. Running from something?
	// Text generally aligns with one of the four personality types.
	// Different structures of the text?

    SU.addProps(ST, {
        Backstory: function(hero, cave_backstory /*optional*/) {
					if (hero.is_player) {
						return "You vaguely remember a night of heavy drinking. And a bet about a cornfield."
					}
					let story = ST.BackstoryIntro(hero)+"\n\n"+ST.BackstoryPast(hero)+"\n\n"+ST.BackstoryReason(hero);
					if (cave_backstory) {
						story = "You find a strange creature in a cave."+"\n\n"+ST.BackstoryPast(hero)+"\n\n"+ST.BackstoryReason(hero);
					}
					// Tokens: GEN_UP (She), GEN (she), POS (her), POS_UP (Her), GENL (him/her).
					story = story.replace(new RegExp("GEN_UP", 'g'), ST.genup[hero.gender])
						.replace(new RegExp("GENL", 'g'), ST.genl[hero.gender])
						.replace(new RegExp("GEN", 'g'), ST.gen[hero.gender])
		  			.replace(new RegExp("POS_UP", 'g'), ST.posup[hero.gender])
  					.replace(new RegExp("POS", 'g'), ST.pos[hero.gender])
  					.replace(new RegExp("NAME", 'g'), hero.name);
					return story;
        },
				
        genup: ["She", "He", "They", "It"],
        gen: ["she", "he", "they", "it"],
        genl: ["her", "him", "them", "it"],
        posup: ["Her", "His", "Their", "Its"],
        pos: ["her", "his", "their", "its"],
					
        BackstoryIntro: function(hero) {
					// Updated: start with the core descriptions. Build up the rest before/after, in either/or syntax options.
					// 1. Player's place in the bar. (1-2?)
					// 2. Alien introduction. (1-2?)
					// 3. Description. (1+)
					// 4. Reaction.
					var seed = hero.seed;
					var s = 6.11;
					var p = ST.randText(ST.back11, s++)
					 + " " + ST.randText(ST.back12, s++)
 				 if (SU.r(seed, s++) < 0.75) {
   				 // More description.
 					 p += " "+ST.randText(ST.back132a, s++)
 					     + " "+ST.randText(ST.back132b, s++);
 					 if (SU.r(seed, s++) < 0.5) {
 						 p += " and "+ST.randText(ST.back132c, s++);
 					 } 
 					 p += "."
 				 }
				 if (SU.r(seed, s++) < .15) {
					 // Notice something about it.
					 p += " " + ST.randText(ST.back134, s++)
					 + " " + ST.randText(ST.back135, s++)
					 + ", " + ST.randText(ST.back136, s++)
					 + " " + ST.randText(ST.back137, s++)
					 + " are " 
					 + ST.randText(ST.back138, s++)
					 + " " + ST.randText(ST.back139, s++) + ".";
				 } else {
				 	// about it.
					 p += " " + ST.randText(ST.back1core, s++);
				 }
				 // Personality behavior.
					 p += " " + ST.randText(ST.back1corea[hero.personality], s++)
				 // Speak.
					 p += " " + ST.randText(ST.back1la[hero.personality], s++)
					 p += " " + ST.randText(ST.back1lb, s++)
					 return p;
        },
					
			//		seed, name, personality


        back1core: [
            "GEN_UP's a heck of a thing.",
            "GEN_UP almost looks handsome.",
					  "GEN_UP's massive.",
					  "GEN_UP fills your side of the room.",
					  "GEN_UP's tiny.",
					  "GEN_UP's translucent.",
					  "POS_UP shape is constantly shifting.",
					  "Colors swirl within GENL.",
					  "POS_UP pieces move independently.",
					  "GEN_UP disgusts you.",
					  "You can't tell what to make of GENL.",
					  "GEN_UP's all bubbles and slime.",
					  "POS_UP skin slides around POS body.",
					  "GEN_UP inflates and deflates.",
					  "GEN_UP shakes POS jacobean ruff.",
        ],
				
				// INEPT, MEEK, MYSTERY, ROGUE.
				back1corea: [
					[
						"And GEN writhes indecisively.",
						"And GEN appears impatient.",
						"And looks fickle.",
						"And you watch GENL pace erratically.",
						"And GEN squints crudely.",
						"And GEN trips on POS tentacles.",
					],
					[
						"And GEN cowers away.",
						"And GEN appears to lack courage.",
						"And you wonder what GEN wants.",
						"And GEN seems to meow.",
						"And keeps POS head down.",
						"And GEN looks like GEN would speak, but then stops.",
					],
					[
						"But covered in a heavy robe, it's hard to tell.",
						"And GEN seems to fade in and out of sight.",
						"But you get the feeling POS appearances may be deceiving.",
						"But GEN quickly covers up in POS cloak.",
						"And POS eyes shine eerily.",
						"But you think to yourself, that can't be right.",
					],
					[
						"And GEN adjusts prominent eye patches.",
						"And GEN takes pride in POS leather jacket.",
						"And GEN strides hautily.",
						"And GEN might be charming, if not dangerous.",
						"But you wonder about POS intentions.",
						"And GEN flashes a dagger.",
					],
				],
				
        back132a: [
            "Classically",
            "Oddly",
					  "Certainly",
					  "Strangely",
					  "Surely",
					  "Not quite",
					  "Bizarrely",
					  "Likely",
					  "Probably",
					  "Definitely",
					  "Maybe",
        ],				
				
        back132b: [
            "large",
            "small",
					  "brutish",
					  "green",
					  "bearded",
					  "clean-shaven",
					  "thin",
					  "thick",
					  "wide",
					  "long",
					  "wriggly",
					  "trained",
					  "squiggly",
					  "shifting",
					  "short",
					  "lucid",
					  "popeyed",
					  "foreign",
					  "strange",
					  "transparent",
        ],
				
        back132c: [
            "green",
            "cold",
					  "steamy",
					  "purple",
					  "blue",
					  "red",
					  "yellow",
					  "hairy",
					  "prickly",
        ],
				
        back11: [
            "Sipping at a drink, you scan the foreign shapes in the room.",
            "At the back of the bar nobody seems to noice a group of alien shapes in the corner.",
            "While inquiring about crew, everything in the room takes notice.",
            "You barely have a chance to sit down.",
            "Exhausted, you collapse into a bizarrely shapen chair.",
        ],

        back12: [
            "A \"typical\" alien seems to take notice.",
            "One of the locals stares at you awhile, and eventually gets up.",
					  "They all sit patiently, staring at your ear and licking their lips. One gets the courage to peel off.",
					  "Something moves forward.",
					  "A shape appears before you.",
					  "In no short order, the bartender wriggles to an alien nursing POS mug.",
					  "The room goes quiet. An alien stands up.",
        ],

        back133: [
            "all at once.",
            "in POS own way.",
            "not that GEN seemed to care.",
            "as far as you could tell.",
            "more or less.",
            "barely begins to describe GEN.",
            "about sums GEN up.",
            "at least.",
        ],
				
        back134: [
            "Attached to",
            "With",
            "Under",
            "Around three",
            "Behind two",
            "Above five",
            "Behind",
        ],
				
        back135: [
            "long",
            "short",
            "green",
            "purple",
            "blue",
            "spiky",
            "slimy",
            "shiny",
        ],
				
        back136: [
            "wet",
            "cold",
            "dry",
            "steaming",
					  "bizarre",
					  "unworldly",
        ],
				
        back137: [
            "shoulders",
            "tails",
            "arms",
            "tentacles",
            "things",
            "appendages",
            "blobs",
        ],
				
        back138: [
            "spherical",
            "square",
            "metallic",
            "colorful",
            "glowing",
            "floating",
            "sinking",
            "shifting",
        ],
				
        back139: [
            "orbs",
            "bracelets",
            "baubles",
            "digits",
            "eyes",
            "mouths",
            "fingers",
            "toes",
            "laces",
            "running sneakers",
        ],
				
				// INEPT, MEEK, MYSTERY, ROGUE.				
				back1la: [
					[
						"Ineptly",
						"Pettily",
						"Oddly",
						"Messily",
						"Irritably",
					],
					[
						"Lethargically",
						"Uncertainly",
						"Hesitantly",
						"Quietly",
						"Slowly",
					],
					[
						"Secretively",
						"Covertly",
						"Cryptically",
						"Strangely",
						"Curiously",
					],
					[
						"Playfully",
						"Slyly",
						"Slickly",
						"Sneakily",
						"Impishly",
					],
					
				],				
				
        back1lb: [
            "GEN speaks to you.",
            "GEN nods to you.",
            "GEN begins to speak.",
            "GEN watches you.",
            "GEN approachs, and GEN leans in.",
            "GEN waits. You wait. Eventually GEN speaks.",
            "GEN glances around the room.",
        ],
				
        BackstoryPast: function(hero) {
//					"You want to hear my story? Really? There's not much to tell, really. Well, here it is. I was abandoned by my squid of a father. Left to the"
//					wolves. So I struck out on my own. Hard times, I tell you, or it wouldn't end up like this.
					var seed = hero.seed;
					var s = 6.13;
					
					if (SU.r(seed, s++) < 0.1) {
						return "\""+ST.back2shortcut[hero.personality]+"\"";
					}
					var p = "\"";
					 p += ST.randText(ST.back21a[hero.personality], s++)
					if (SU.r(seed, s++) < 0.67) {
					 p += " " + ST.randText(ST.back21b[hero.personality], s++)
					}
					if (SU.r(seed, s++) < 0.67) {
					 p += " " + ST.randText(ST.back21c[hero.personality], s++)
					}
					 p += " " + ST.randText(ST.back22, s++)
					 p += ". " + ST.randText(ST.back22a, s++)
					 p += " " + ST.randText(ST.back22b, s++)
					 p += ". " + ST.randText(ST.back23, s++)
					if (SU.r(seed, s++) < 0.73) {
					 p += ". " + ST.randText(ST.back23a, s++)
					}
					if (SU.r(seed, s++) < 0.67) {
					 p += ". " + ST.randText(ST.back23b, s++)
					}
					 p += ". " + ST.randText(ST.back24, s++)

					return p+".\"";
        },
				
				back2shortcut: [
					"I don't really know about my past. Hard to remember, you know. But don't hold that against me.",
					"GEN_UP looks like GEN is about to speak, stops, and deliberates.",
					"Where I come from? I can't talk about it.",
					"Me? I'm NAME. Surely you've heard of me.",
				],
					
				back21a: [
					[
						"I'm, ummm... well...",
						"Hang on a sec, I need to remember.",
						"Who am I? Who are you?",
						"Let me check my nametag.",
						"Are names really important?",
					],
					[
						"You want to know about me?",
						"Am I presentable?",
						"You want to know my name?",
						"You want me to cause a commotion?",
						"Why do I look like this, you wonder?",
					],
					[
						"I can't talk about it.",
						"Some secrets should remain forgotten.",
						"I'm running from my past.",
						"It's only important that I'm here.",
						"Let's just move past the introductions.",
					],
					[
						"Listen up.",
						"Finally you have the attention of NAME.",
						"I'm here now.",
						"I've never crossed a man that didn't deserve it.",
						"It's your lucky day.",
					],
				],					

				back21b: [
					[
						"Meh.",
						"I can't remember.",
						"Introductions sound like effort.",
						"Get over it, gramps.",
						"Lame.",
					],
					[
						"Really?",
						"Are you sure?",
						"I better answer before you change your mind.",
						"It's nice to be asked.",
						"My apologies, I'm not always eloquent.",
					],
					[
						"Seriously.",
						"Don't look at me like that.",
						"You know it as well as I.",
						"It's not up to me.",
						"And some things can't be shared.",
					],
					[
						"And I have lots of better offers, so let's make this quick.",
						"And the pleasure is all yours, just to be straight.",
						"And I've never stolen anything big, if that's what you're thinking.",
						"And the jacket goes to my grave, so get over it.",
						"And I'm the quickest shot in the quadrant.",
					],
				],					
					
				// INEPT, MEEK, MYSTERY, ROGUE.				

				back21c: [
					[
						"Not that it matters.",
						"Not that you'll remember.",
						"Not that you'll pay me what I'm worth.",
						"Not that I care.",
						"Not that I want to work.",
					],
					[
						"Well, however it turns out, thank you.",
						"You should know that I don't like violence.",
						"It's good to find a sympathetic soul.",
						"And thank you for asking, if I haven't thanked you yet.",
						"And I like your shirt.",
					],
					[
						"If that's a problem, let's just end it here.",
						"And I won't expect you to answer anything, either.",
						"So let's just let bygones be bygones.",
						"For all you know, I'd just lie anyway.",
						"Speak quickly, my time left is short.",
					],
					[
						"Now, should we get another round before I start?",
						"Maybe you should test my aim, not my patience.",
						"Why do you keep looking at me like that?",
						"My record has been cleared, so don't bother checking.",
						"Not that much else matters, if we respect our mothers.",
					],
				],
				
        back22: [
            "Well, here it is",
            "Alright, then",
            "Very well, I suppose I'll explain",
            "Well, if you insist",
            "Although I suppose I can share some details",
            "Alright, you got it out of me",
            "Well, some things I do like to share",
            "Well, there is this one thing",
            "Okay, listen closely",
					  "Fine, if you must know",
        ],
				
        back22a: [
            "When I was a small squid",
            "Back when my tubes had not yet encrusted",
            "When I was a wee little nematode",
            "Before the third age",
            "Not that long ago",
            "If I remember correctly",
            "When I lost my fifth arm",
            "Back when I had only two heads",
        ],
				
        back22b: [
            "something tragic happened to me",
            "my life was forever changed",
            "I lost a part of myself",
            "my life lost all its meaning",
            "something happened, and I was never the same",
            "my life took a dark turn",
        ],
				
        back23: [
          "I was abandoned by my squid of a father",
          "My mother sold me to the slavers",
          "I got drunk, and gambled away most of my heads",
          "I fell off the roof, and now I can never act again",
          "I started getting into some really addictive programming",
          "My soap ended on a cliffhanger. And was never renewed",
          "My best friend turned out to be imaginary",
          "My ship crash landed in this pathetic corner of space",
          "I became a great cartoonist",
          "My lover's spouse came back from work early",
				  "I had to live under the stairs. And they all made fun of me",
				  "I found a magical portal to this place. But it was a one-way trip",
				  "My internalized rage started leaking",
				  "I realized that I needed a lot of money to be happy",
				  "My third yacht broke down",
				  "I got tax audited",
				  "I got hit by a firework",
				  "I started wearing pajamas. Everywhere",
				  "I could not longer pronounce t's and s's",
          "My mother made me eat my vegetables",
          "I had to get up for class, first thing in the afternoon",
          "I got a zit, and everyone pointed",
          "I asked someone out, and they said no",
          "One of my tentacles grew longer than the others",
          "My seventh head developed Tourettes",
          "I became allergic to pasta",
          "I abandoned my dream of stand-up comedy",
          "I got lazy",
				  "I found snakes on the spaceship",
				  "My friend John got hit by a flying lawnmower during the halftime show",
				  "My brother was eaten by his beard",
				  "Karma caught up",
				  "I found out grated parmesan is made out of wood",
				  "I found out everybody dies",
				  "My jetpack gave out",
					"I found out donkeys are more dangerous than spaceships",
					"I found out that orange juice is actually yellow",
					"I started wondering about the meaning of life",
					"I got hooked on DOTA",
					"I realized I'm not very smart",
					"I got a mortgage",
					"I got married and had kids",
					"I grew a mullet, on fourteen heads",
					"I realized I was starting to like olives",
					"I watched the movie Interstellar, and liked it",
					"My parents were poor",
					"My parents were rich",
					"I'm an orphan, voluntarily",
					"I haven't had any hardships. Which is a real problem when we are all defined by our tragic pasts."
				  
					
        ],
				
        back23a: [
          "Left to the wolves, so to say",
          "And I started selling my organs for cash",
          "Which got me into tobacco farming",
          "I never forgave myself",
          "I had to steal from my friends",
          "I hit rock bottom",
          "It's not something I share lightly",
					"And I started to think I'm in the Matrix",
					"Which might explain my fear of heights",
					"And I'll never visit a cornfield again",
					"And cows seem strangely attracted to me",
					"Which made me think a lot about materialism",
					"And I might never speak again",
					"I ask why, everyday",
					"They say all you need is love, but it's a lie",
					"And cake is a lie",
					"Yipee",
        ],
				
        back23b: [
            "So I struck out on my own",
            "Obviously that's how I came to be here",
            "I had no choice, you have to understand",
            "Don't go judging me",
            "And now I have to live with myself",
            "I know I've made mistakes, but I think everyone deserves a second chance",
            "There wasn't anything I could do",
        ],
				
        back24: [
            "And now you know my secret",
            "I told you it wasn't pretty, but now you know",
            "Life just doesn't work out like we expect",
            "I don't need your pity, just your money",
            "I'm sure you have similar stories... we all do",
            "But I hope it can be forgiven",
        ],

				
        BackstoryReason: function(hero) {

//					So there it is. Take it or leave it.
//  Later- But i'd be grateful for the work. I need it desperately. 	 And I may be an arrogant punk, but at least I'd be your punk.		
					
					
					var seed = hero.seed;
					var s = 6.35;
					
					var p = "\""
					p += ST.randText(ST.back31, s++) + ". ";
					p += "But I'd be "+ST.randText(ST.back32[hero.personality], s++)+". "
					if (SU.r(seed, s++) < 0.67) {
						p += ST.randText(ST.back33[hero.personality], s++) + ". ";
					}
					var type = ST.randText(ST.back34[hero.personality], s++);
					var ptext = hero.p_text.toLowerCase();
					p += hero.name+" may be known as the "+ptext+" "+type+", but I'd be your "+ptext+" "+type;
					return p+".\"";
        },
					
        back31: [
            "And so there you have it",
            "And that's not a pretty story, but it's my story",
            "And I warned you not to ask",
            "And take it or leave it. It is what it is",
            "And that's not something that can be forgotten",
        ],
				
				// INEPT, MEEK, MYSTERY, ROGUE.				
				back32: [
					[
						"lamer if I have to work",
						"incompetent, if you hire me. Maybe too honest",
						"occasionally useful in some work",
						"always calling you gramps when we work",
						"sad to finally have to work",
					],
					[
						"gracious to have the work",
						"grateful for work",
						"hard-working and diligent",
						"the best worker you have",
						"always cheerful in my work",
					],
					[
						"quiet in my work",
						"barely noticible",
						"magically delicious",
						"mostly out of sight",
						"watching from the shadows",
					],
					[
						"ready for an opportunity",
						"eager for the booty",
						"ready to swab the plank",
						"not sharing my eye patches with you. Pink eye is real",
						"quick to draw",
					],
				],					

				back33: [
					[
						"My dad says I have to get a job or lose my allowance",
						"It's not that bad, I suppose",
						"And I expect we'll meet lots of chicks",
						"I guess I could do worse",
						"I heard you're rich",
					],
					[
						"I need it desperately",
						"The rent is due soon",
						"I have nowhere else to go",
						"I like you",
						"I just want to help",
					],
					[
						"I promise not to stare at your ear too much",
						"I can offer little, and expect little",
						"Perhaps our paths cross ways",
						"I'm best left out of sight",
						"I have no reason to lie",
					],
					[
						"You see, I need to outrun my parole officer",
						"I need some quick cash",
						"I owe a blob some money for dumping some stuff",
						"Hey I got five kids to feed",
						"I need a new gun",
					],
				],			
				
				back34: [
					[
						"punk",
						"kid",
						"dreamer",
						"fool",
						"dud",
					],
					[
						"coward",
						"wimp",
						"alarmist",
						"weakling",
						"squid",
					],
					[
						"enigma",
						"mystery",
						"figure",
						"thing",
						"problem",
					],
					[
						"rogue",
						"thief",
						"crook",
						"bully",
						"rascal",
					],
				],			
// End, "NAME may be an arrogant punk, but GEN's your punk."
// demand pay in advance
    });
})();


