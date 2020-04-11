(function() {
	let name_symbols = //"!@#$%^&*()-+=?/><{}|\✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅☥⌂¤೧๏ᐃ᏿ᐳᑝᑡᖰᗎᚖ♁♜♨〰⧗⧖☺♡♬♻❄☂‡Ð▣◉◙⇒✉☀☃☁★✑✒÷‰√≠∞❛❜✄✁✂✇✿❀«»♪♫…◆◇✣✰✧✦☼☾❆❅❄✵♲♻⚑⚐←↑→↓↔↕⇄⇅↲↳↴↵↶↷↺↻➔➘➙➚➜➟➠➤➥➨➫➬➭➮➯➲➳➵➶➷➸➹➺➻➼➽➾◀▶◁▷◊ℝℚℙℂℤ½¼¾αβγδεζηθλμξωΦΨ⊨⊭⊻⊼⊽⋅⅀⌀⌈⌉⌊⌋∫∬∭∮∯∰∱∲∳∴∵∻∼∽∾≀≁≈≂≃≅≡≢≣≉≊≋≌≍≎≏≐≑≒≓≖≗≘≙≚≛≜≝≞≟≠⊧⊥∧∨∀∃∄¬∆∇∈∉∋∌∩∪⊂⊃⊄⊅⊆⊇∏∑Ω×±÷∅∗∙∂√∛∜∝∞∁∟∠∡∢∥∦⊕⊗≤≥≪≫";
	  "!“#$%&‘()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁ ÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿЁЂЃЄЅІЇЈЉЊЋЌЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийऎएऐऑऒओऔकखगघङचछजझञटठडढणतथदधनऩपफबभमयरऱलळऴवशषसह一丁丂七丄丅丆万丈三上下丌不与丏丐丑丒专且丕世丗丘丙业丛东丝丞丟丠両丢丣两严並丧丨丩个丫丬中丮丯丰‐‒–—―‖‗‘’‚‛“”„‟†‡•‣․‥…‧⁇⁈⁉⁊⁋⁌⁍⁎⁏⁐⁑⁒⁗₠₡₢₣₤₥₦₧₨₩₪₫€₭₮₯₰₱∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅☥⌂¤೧๏ᐃᐳᑝᑡᖰᗎᚖ♁♜♨〰⧗⧖☺♡♬♻❄☂‡Ð▣◉◙⇒✉☀☃☁★✑✒÷‰√≠∞❛❜✄✁✂✇✿❀«»♪♫…◆◇✣✰✧✦☼☾❆❅❄✵♲♻⚑⚐←↑→↓↔↕⇄⇅↲↳↴↵↶↷↺↻➔➘➙➚➜➟➠➤➥➨➫➬➭➮➯➲➳➵➶➷➸➹➺➻➼➽➾◀▶◁▷◊ℝℚℙℂℤ½¼¾αβγδεζηθλμξωΦΨ⊨⊭⊻⊼⊽⋅⅀⌀⌈⌉⌊⌋∫∬∭∮∯∰∱∲∳∴∵∻∼∽∾≀≁≈≂≃≅≡≢≣≉≊≋≌≍≎≏≐≑≒≓≖≗≘≙≚≛≜≝≞≟≠⊧⊥∧∨∀∃∄¬∆∇∈∉∋∌∩∪⊂⊃⊄⊅⊆⊇∏Ω×±÷∅∗∙∂√∛∜∝∁∟∠∡∢∥∦⊕⊗≤≥≪≫";
    let alpha_symbols_raw = "🕊🤤💯❓✌️☎️🔸🦊☘️⛔️🛡🚫📸⚽️🤧⚖️💟☺️🕹🦁🦋🔴🦄🗡⚙️🛠🔱☄️✏️🤖⛏🧡❣️🤩☕️⚜️⚠️🥀⚡️❗️🤔✈️⭐️🤪🤗☁️❌✅🙄♥️🔞🤬❤️🤣🖤⚔️🏳️‍🌈✔️😄😃😀😊😉😍😘😚😗😙😜😝😛😳😁😔😌😒😞😣😢😂😭😪😥😰😅😓😩😫😨😱😠😡😤😖😆😋😷😎😴😵😲😟😦😧😈👿😮😬😐😕😯😶😇😏😑👲👳👮👷💂👶👦👧👨👩👴👵👱👼👸😺😸😻😽😼🙀😿😹😾👹👺🙈🙉🙊💀👽💩🔥✨🌟💫💥💢💦💧💤💨👂👀👃👅👄👍👎👌👊✊✌👋✋👐👆👇👉👈🙌🙏☝👏💪🚶🏃💃👫👪👬👭💏💑👯🙆🙅💁🙋💆💇💅👰🙎🙍🙇🎩👑👒👟👞👡👠👢👕👔👚👗🎽👖👘👙💼👜👝👛👓🎀🌂💄💛💙💜💚❤💔💗💓💕💖💞💘💌💋💍💎👤👥💬👣💭🐶🐺🐱🐭🐹🐰🐸🐯🐨🐻🐷🐽🐮🐗🐵🐒🐴🐑🐘🐼🐧🐦🐤🐥🐣🐔🐍🐢🐛🐝🐜🐞🐌🐙🐚🐠🐟🐬🐳🐋🐄🐏🐀🐃🐅🐇🐉🐎🐐🐓🐕🐖🐁🐂🐲🐡🐊🐫🐪🐆🐈🐩🐾💐🌸🌷🍀🌹🌻🌺🍁🍃🍂🌿🌾🍄🌵🌴🌲🌳🌰🌱🌼🌐🌞🌝🌚🌑🌒🌓🌔🌕🌖🌗🌘🌜🌛🌙🌍🌎🌏🌋🌌🌠⭐☀⛅☁⚡☔❄⛄🌀🌁🌈🌊🎍💝🎎🎒🎓🎏🎆🎇🎐🎑🎃👻🎅🎄🎁🎋🎉🎊🎈🎌🔮🎥📷📹📼💿📀💽💾💻📱☎📞📟📠📡📺📻🔊🔉🔈🔇🔔🔕📢📣⏳⌛⏰⌚🔓🔒🔏🔐🔑🔎💡🔦🔆🔅🔌🔋🔍🛁🛀🚿🚽🔧🔩🔨🚪🚬💣🔫🔪💊💉💰💴💵💷💶💳💸📲📧📥📤✉📩📨📯📫📪📬📭📮📦📝📄📃📑📊📈📉📜📋📅📆📇📁📂✂📌📎✒✏📏📐📕📗📘📙📓📔📒📚📖🔖📛🔬🔭📰🎨🎬🎤🎧🎼🎵🎶🎹🎻🎺🎷🎸👾🎮🃏🎴🀄🎲🎯🏈🏀⚽⚾🎾🎱🏉🎳⛳🚵🚴🏁🏇🏆🎿🏂🏊🏄🎣☕🍵🍶🍼🍺🍻🍸🍹🍷🍴🍕🍔🍟🍗🍖🍝🍛🍤🍱🍣🍥🍙🍘🍚🍜🍲🍢🍡🍳🍞🍩🍮🍦🍨🍧🎂🍰🍪🍫🍬🍭🍯🍎🍏🍊🍋🍒🍇🍉🍓🍑🍈🍌🍐🍍🍠🍆🍅🌽🏠🏡🏫🏢🏣🏥🏦🏪🏩🏨💒⛪🏬🏤🌇🌆🏯🏰⛺🏭🗼🗾🗻🌄🌅🌃🗽🌉🎠🎡⛲🎢🚢⛵🚤🚣⚓🚀✈💺🚁🚂🚊🚉🚞🚆🚄🚅🚈🚇🚝🚋🚃🚎🚌🚍🚙🚘🚗🚕🚖🚛🚚🚨🚓🚔🚒🚑🚐🚲🚡🚟🚠🚜💈🚏🎫🚦🚥⚠🚧🔰⛽🏮🎰♨🗿🎪🎭📍🚩";
    let alpha_symbols = Array.from(alpha_symbols_raw);
		
    // Returns a word in the alpha's language.
    ST.getAlphaWord = function(seed) {
        return ST.getWord(SF.RACE_SEED_ALPHA, seed);
    },
		
		ST.getSymbol = function(seed) {
			return name_symbols[Math.floor(SU.r(seed, 7.12)*name_symbols.length)];
		},
     
    // language is a subset (seed#) that creates a subset of the available pieces
    ST.getWord = function(lang, seed) {
			//if (lang === SF.RACE_SEED_ALPHA) {
			//	return this.getAlphaWord(seed);
			//}
			if (lang === SF.RACE_SEED_ALPHA) {
				return getAlphaSyl(seed, startbal)+" "+getAlphaSyl(seed*0.67+0.67, startbal);
			}
			
			
        var spaceIndex = Math.floor(SU.r(seed, 43.17)*5); // chance of an extra space
        var len = Math.floor(SU.r(seed, 1.55) * 2) + 1; // 1-2 parts, plus chances to raise
        if (SU.r(seed, 4.55) > 0.75) {
            len++;
        }
        if (SU.r(lang, 4.56) > 0.75) {  // Note this one uses lang.
            len++;
        }
        var startbal = SU.r(seed, 5.55) / 2;
        var word = "";
        for (var i = 0; i < len; i++) {
            var docap = false;
            if (i > 0) {
                var spaced = false;
                var dospecial = SU.r(lang, 2.55);
                if (dospecial > 0.8) {
                    // apostrophes
                    var hitspecial = SU.r(seed, 3.55 + i);
                    if (hitspecial > 0.60) {
                        // apostrophes allowed and randomed
                        word += '\'';
                        spaced = true;
                    }
                }
                else if (dospecial > 0.6) {
                    // spaces
                    var hitspecial = SU.r(seed, 3.55 + i);
                    if (hitspecial > 0.5) {
                        word += ' ';
                        docap = true;
                        spaced = true;
                    }
                }
                if (i === spaceIndex && !spaced) {
                    word += ' ';
                    docap = true;
                }
            }
            if (i === 0) {
                docap = true;
            }
            if (docap) {
                word += SU.capitalize(getSyl(lang, seed + i*0.57, startbal));
            } else {
                word += getSyl(lang, seed + i*0.53, startbal);
            }

        }
        if (word.length > 20) {
            word = word.substring(0, 20);
        }
        return word;
    };
    // get a syllable, start + vowel + end
    // might have a start or end consonant or both
    var getSyl = function(lang, seed, startbal) {
        /*
         var percentCoverage = SU.r(lang, 1.66) / 10 + 0.05; // .05 to .15
         var numStart = Math.floor(startLen * percentCoverage);
         var numMid = Math.floor(midLen * percentCoverage);
         var numEnd = Math.floor(endLen * percentCoverage);
         */
        var numStart = 6;
        var numMid = 4;
        var numEnd = 6;

        var parts = SU.r(seed, 8.66); // ~1/3 chance for each front+vowel,vowel+end,front+vowel+end 
        var slot, index;
        var str = "";

        if (parts > 0.6 - startbal) {
            // now to get the char, one rand for slot index (0-to-numStart) and another based on lang to cross subsets
            slot = Math.floor(SU.r(seed, 2.66) * numStart) + 50;
            index = Math.floor(SU.r(lang, 3.66) * slot * 50.66) % startLen;
            str += ST.sylstart[index];
        }

        slot = Math.floor(SU.r(seed, 4.66) * numMid) + 50;
        index = Math.floor(SU.r(lang, 5.66) * slot * 51.66) % midLen;
        str += ST.sylvowel[index];

        if (parts < 0.9 - startbal) {
            slot = Math.floor(SU.r(seed, 6.66) * numEnd) + 50;
            index = Math.floor(SU.r(lang, 7.66) * slot * 52.66) % endLen;
            str += ST.sylend[index];
        }

        return str;
    };
		
    var getAlphaSyl = function(seed) {
			return alpha_symbols[Math.floor(SU.r(seed, 5.14)*alpha_symbols.length)];
//			let len = Math.floor(SU.r(seed, 5.13)*2)+1;
/*
			len = 1;
			let str = "";
			for (let i = 0; i < len; i++) {
				str += alpha_symbols[Math.floor(SU.r(seed, 5.14+i)*alpha_symbols.length)];
			}
*/
			/*
			let lang = SF.RACE_SEED_ALPHA;
	    var numStart = alphaStartLen;
	    var numMid = alphaMidLen;
	    var numEnd = alphaEndLen;

        var parts = SU.r(seed, 8.66); // ~1/3 chance for each front+vowel,vowel+end,front+vowel+end 
        var slot, index;
        var str = "";

        if (parts > 0.6 - startbal) {
            // now to get the char, one rand for slot index (0-to-numStart) and another based on lang to cross subsets
            slot = Math.floor(SU.r(seed, 2.66) * numStart) + 50;
            index = Math.floor(SU.r(lang, 3.66) * slot * 50.66) % alphaStartLen;
            str += ST.alphasylstart[index];
        }

        slot = Math.floor(SU.r(seed, 4.66) * numMid) + 50;
        index = Math.floor(SU.r(lang, 5.66) * slot * 51.66) % alphaMidLen;
        str += ST.alphasylvowel[index];

        if (parts < 0.9 - startbal) {
            slot = Math.floor(SU.r(seed, 6.66) * numEnd) + 50;
            index = Math.floor(SU.r(lang, 7.66) * slot * 52.66) % alphaEndLen;
            str += ST.alphasylend[index];
        }
*/
        //return str;
    };		

    ST.sylstart = [
        "b",
        "b",
        "b",
        "c",
        "c",
        "c",
        "ch",
        "d",
        "d",
        "dr",
        "f",
        "f",
        "fr",
        "g",
        "gl",
        "gr",
        "h",
        "h",
        "h",
        "j",
        "j",
        "j",
        "k",
        "kl",
        "kr",
        "kw",
        "l",
        "l",
			  "ł",
        "ll",
        "m",
        "m",
        "m",
        "n",
        "n",
        "n",
			  "ń",
        "p",
        "pl",
        "pr",
        "r",
        "r",
        "r",
        "r",
        "s",
        "s",
        "sn",
        "sp",
        "sr",
        "st",
        "sh",
        "t",
        "t",
			  "θ",
        "th",
        "tr",
        "v",
        "vl",
        "w",
        "wh",
        "y",
        "z",
        "zh"
    ];

    ST.sylvowel = [
        "a",
        "a",
        "á",
			  "ą",
        "aa",
        "ae",
        "ao",
        //"ay",
        "e",
        "e",
        "e",
        "e",
        "e",
        "ę",
        "ea",
        "i",
        "i",
        "ia",
        "iy",
        "o",
        "o",
        "o",
        "ó",
        "oi",
        "oo",
        //"oy",
        "u",
        "u",
        "u",
        "ü",
        "y",
        "y"
    ];

    ST.sylend = [
        "b",
        "b",
        "bs",
        "c",
        "c",
        "ch",
        "ct",
        "d",
        "d",
        "d",
        "f",
        "f",
        "ft",
        "g",
        "g",
        "g",
        "h",
        "hm",
        "hn",
        "ht",
        "j",
        "j",
        "k",
        "k",
        "l",
        "l",
			  "ł",
        "ld",
        "lf",
        "m",
        "m",
        "mn",
        "n",
        "ns",
        "nm",
        "p",
        "ps",
        "pt",
        "q",
        "r",
        "r",
        "rs",
        "rl",
        "rn",
        "rm",
        "rt",
        "rts",
        "s",
        "s",
        "s",
        "s",
        "s",
        "s",
        "s",
        "s",
        "st",
        "t",
        "t",
        "t",
        "t",
        "ts",
        "th",
        "v",
        "vs",
        //"w",
        "x",
        "y",
        "z"
    ];
		

    ST.alphasylstart = [
        "B",
        "B",
        "B",
        "C",
        "C",
        "C",
        "CH",
        "D",
        "D",
        "DR",
        "F",
        "F",
        "FR",
        "G",
        "GL",
        "GR",
        "H",
        "H",
        "H",
        "J",
        "J",
        "J",
        "K",
        "KL",
        "KR",
        "L",
        "L",
        "M",
        "M",
        "M",
        "N",
        "N",
        "N",
        "P",
        "PL",
        "PR",
        "R",
        "R",
        "R",
        "R",
        "S",
        "S",
        "SN",
        "SP",
        "SR",
        "ST",
        "SH",
        "T",
        "T",
        "TH",
        "TR",
        "V",
        "W",
        "WH",
        "Y",
        "Z",
        "ZH"
    ];

    ST.alphasylvowel = [
        "A",
        "A",
        "AE",
        "AO",
        //"ay",
        "E",
        "E",
        "E",
        "E",
        "E",
        "EA",
        "I",
        "I",
        "IA",
        "IY",
        "O",
        "O",
        "O",
        "OI",
        "OO",
        //"oy",
        "U",
        "U",
        "U",
        "Y"
    ];

    ST.alphasylend = [
        "B",
        "B",
        "BS",
        "C",
        "C",
        "CH",
        "CT",
        "D",
        "D",
        "D",
        "F",
        "F",
        "FT",
        "G",
        "G",
        "G",
        "H",
        "HT",
        "J",
        "J",
        "K",
        "K",
        "L",
        "L",
        "LD",
        "LF",
        "M",
        "M",
        "MN",
        "N",
        "NS",
        "NM",
        "P",
        "PS",
        "PT",
        "Q",
        "R",
        "R",
        "RS",
        "RL",
        "RN",
        "RM",
        "RT",
        "RTS",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "ST",
        "T",
        "T",
        "T",
        "T",
        "TS",
        "TH",
        "V",
        "VS",
        //"w",
        "X",
        "Y",
        "Z"
    ];	

    var startLen = ST.sylstart.length;
    var midLen = ST.sylvowel.length;
    var endLen = ST.sylend.length;
    var alphaStartLen = ST.alphasylstart.length;
    var alphaMidLen = ST.alphasylvowel.length;
    var alphaEndLen = ST.alphasylend.length;
})();
