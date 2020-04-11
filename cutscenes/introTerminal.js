
(function() {


    var commandtext = null;

    var gentext = [
        "Clusters: ",
        "Galaxies: ",
        "Aliens:   ",
        "Systems:  ",
        "Planets:  ",
        "Moons:    ",
  			"Buildings:",
        "Bars:     ",
        "Drinks:   "
    ];

    var startTiggerText = "Jumpstart universe...";
    var stopTriggerText = "Stop.";
    var downTriggerText = "Attempt countdown instead...";
    /*
     "That took too long, going to start Counting backwards from infinity" 
     (everything, plus stuff not even there). 
     Then swirl it all into a black hole. (with fade back in to the bartender)
     Add stars to the background during thie process. 
     */
    var ctx;
    var fontsize = 16;
    var linedist = 50;
    var fade = [];
    var white = null;
    var stopGeneration = false;
    var countingDown = false;

    var setup = false;
    var startx = 10;
    var starty = 30;
    var maxlines = Math.floor((SF.HEIGHT - starty * 2) / linedist)+2;
    var timeouts = [];
		var speed = 1100;
		var skipped_blank_lines = 0;  // Don't incrememnt line numbers on the empty lines.


    SBar.IntroTerminal = function(callback) {
        this._initIntroTerminal(callback);
    };

    SBar.IntroTerminal.prototype = {
        _initIntroTerminal: function(callback) {
					this.callback = callback;
					
            commandtext = [
                "WMD/>RESET \"*\",8,1",
                "",
                "",
                "Measure infinite universe...",
                "Store in bag of holding...",
                "Randomly generate purple hippos...",
                "Add butterfly for effect...",
                "Prepare big bang for decompression...",
                "Anyone have a lighter?",
                "Jumpstart universe...",
                "",
                "",
                "",
                "",
                "Build large hadron collider...",
                "Fry those crispy inner planets...",
                "Should have built a heat pump...",
                "To freeze mean comets...",
                "Settle on settle settled water...",
                "Add worms to space holes...",
                "Turn the worms...",
                "Create intergalactic sense of wonder...",
                "Hmmm... Fatal error on " + ST.planetName(Math.random(), Math.random()),
                "Revive clone...",
                "Last time we lost the clone...",
                "Hope it thaws fast...",
                "Whoops, need a mortal coil...",
                "Apologies for that last error...",
                "Those responsible are now in stasis...",
                "Engineer daywalker grues...",
                "Ugh, they got the architects...",
                "Search for natural predator...",
                "Splice dead beef with the cafe babe...",
                "Got some Illuminati...",
                "Smoke those kippers...",
                "Set ninjas against pirates...",
                "Fruit flies like banana...",
                "Bake lie into cake...",
                "Recalibrate cosmological constant...",
                "100 bottles of beer on the wall...",
                "Not nearly enough...",
                "1,000,000,000 bottles of beer...",
                "But 640,000 ought to be enough...",
                "Triangulate triangles...",
                "Reticulate splines...",
                "Shift red...",
                "Caculate 42nd fibonacci number...",
                "Ignore person behind curtain...",
                "The server went down...",
                "Retrieve them from cellar...",
                "Stop.",
                "",
                "",
                "We're not getting anywhere...",
                "Major Tom to infinity...",
                "",
                "",
                "Attempt countdown instead...",
                "",
                "",
                "Much better...",
                "Feed tribbles...",
                "Reconfabulate the energymotron...",
                "Waste more time...",
                "Test your patience...",
                "Trust me, it builds character...",
                "Push the TURBO button for speed...",
                "Find your blue lawn...",
                "Are we there yet?",
                "Yes.",
                "Hide unpaid elven work force...",
                "Oh, one escaped... make an example.",
                "Recycle their abaci...",
                "Escape the matrix...",
                "Drink too much...",
                "Fall on floor...",
                "Spin world...",
            ];
        },

        activate: function() {
					S$.showed_intro_terminal = true;
          ctx = SC.layer1;

          SG.activeTier.teardown();
          SG.activeTier = this;
					SU.clearTextNoChar();
					SU.addText("X: Skip");

          //SB.buttX(this.exit.bind(this));

          SU.rect(ctx, 0, 0, SF.WIDTH, SF.HEIGHT, "#000");

          // do this last, so SU.rect doesn't wipe out fillStyle
          ctx.font = fontsize + 'pt monospace';
          ctx.fillStyle = '#888';
          ctx.textAlign = 'left';

          this.createFades();
          this.timeout(this.commandLines, 0);
        },
        commandLines: function() {
            var totaltime = 0;
            for (var i = 0; i < commandtext.length; i++) {
                // closure with parameters
                var funct = (function(i2) {
                    return function() {
                        this.commandLine(i2);
                    }
                })(i);
                this.timeout(funct, totaltime);
                var time = speed;//Math.random()*1000+500;
                totaltime += time;
            }
            this.timeout(this.exit.bind(this), totaltime);
        },
        commandLine: function(linenum) {
          var text = commandtext[linenum];
					if (text == "") {
						skipped_blank_lines++;
					}
          var lineslot = (linenum-skipped_blank_lines) % maxlines;
          var y = starty + lineslot * linedist;
          if (text == startTiggerText) {
              this.timeout(this.generating, 500);
          } else if (text == stopTriggerText) {
              this.timeout(this.stopGenerating, 0);
          } else if (text == downTriggerText) {
              this.timeout(this.countDown, 0);
          }

          ctx.fillText(text, startx, y);

          // fade out
          for (var i = 0; i < 20; i++) {
              var funct = (function(i2) {
                  return function() {
                      ctx.drawImage(fade[i2], startx - 5, y - 20, SF.HALF_WIDTH, fontsize + 10);
                  }
              })(i);
              this.timeout(funct, 5500 + 50 * i);
          }
        },
        generating: function() {
            this.timeout(this.goingInfinite, 0);
            for (var i = 0; i < gentext.length; i++) {
                var funct = (function(i2) {
                    return function() {
                        this.genLine(i2);
                    }
                })(i);
                this.timeout(funct, (i + 1) * 279);
            }
        },
        goingInfinite: function() {
            var text = "Going infinite";
            var length = ctx.measureText(text).width;
            ctx.fillText(text, SF.HALF_WIDTH + startx, starty);
            for (var i = 0; i < 30; i++) {
                var funct = (function(i2) {
                    return function() {
                        if (!stopGeneration) {
                            ctx.fillText(".", SF.HALF_WIDTH + startx + length + i2 * 10, starty);
                        }
                    }
                })(i);
                this.timeout(funct, 2000 + i * 2000);
            }
        },
        genLine: function(linenum) {
            multiplier = (linenum + 1);
            this.updateGenLine(linenum, 1, multiplier);
        },
        updateGenLine: function(linenum, num, multiplier) {
            if (!stopGeneration) { // normal counting up
                var y = starty + (linenum + 1) * linedist;
                ctx.drawImage(white, SF.HALF_WIDTH + startx, y - 20, SF.HALF_WIDTH - startx, fontsize + 10);
                ctx.fillText(gentext[linenum] + " " + num, SF.HALF_WIDTH + startx, y);

                var newnum = Math.floor(num + multiplier);
                multiplier = multiplier + multiplier / (40 - linenum * 3);

                var funct = function() {
                    this.updateGenLine(linenum, newnum, multiplier)
                };
                this.timeout(funct, 50);
            }
        },
        stopGenerating: function() {
            stopGeneration = true;

            // fade out
            for (var j = 0; j < gentext.length + 1; j++) {
                var fadey = starty + j * linedist;
                for (var i = 0; i < 20; i++) {
                    var funct = (function(i2, fadey2) {
                        return function() {
                            ctx.drawImage(fade[i2], SF.HALF_WIDTH + startx, fadey2 - 20, SF.HALF_WIDTH - startx, fontsize + 10);
                        }
                    })(i, fadey);
                    this.timeout(funct, 2000 + j * 200 + i * 50);
                }
            }
        },
        countDown: function() {
            this.timeout(this.goingFinite, 0);

            for (var i = 0; i < gentext.length; i++) {
                var funct = (function(i2) {
                    return function() {
                        this.genDownLine(i2);
                    }
                })(i);
                this.timeout(funct, (i + 1) * 279);
            }

        },
        genDownLine: function(linenum) {
            var y = starty + (linenum + 1) * linedist;
            ctx.fillText(gentext[linenum] + " 999999999999999999999999999999999", SF.HALF_WIDTH + startx, y);
        },
        goingFinite: function() {
            var text = "Going finite";
            var length = ctx.measureText(text).width;
            ctx.fillText(text, SF.HALF_WIDTH + startx, starty);
            for (var i = 0; i < 5; i++) {
                var funct = (function(i2) {
                    return function() {
                        ctx.fillText(".", SF.HALF_WIDTH + startx + length + i2 * 10, starty);
                    }
                })(i);
                this.timeout(funct, 2000 + i * 2000);
            }
        },
        createFades: function() {
            for (var i = 0; i < 20; i++) {
                var c = document.createElement('canvas');
                c.width = 1;
                c.height = 1;
                var cctx = c.getContext('2d')
                var color = 'rgba(0,0,0,' + (1 / (20 - i)) + ')'; // inverse to compensate for the multiplicative layering fade out (a bunch of 0.1 will never get to full fade)
                SU.rect(cctx, 0, 0, 1, 1, color);
                fade[i] = cctx.canvas;
            }
            white = fade[19];
        },
        timeout: function(funct, delay) {
            var timeout = window.setTimeout(funct.bind(this), delay);
            timeouts.push(timeout);
        },
        teardown: function() {
	        SC.layer1.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        },
        exit: function() {
            for (var i = 0; i < timeouts.length; i++) {
                clearTimeout(timeouts[i]);
            }
            //SU.sendHome();
						let fade_func = function() {
							this.teardown();
							this.callback();
						}
			      SU.fadeOutIn(fade_func.bind(this));
        },
        handleKey: function(key) {
            switch (key) {
                case SBar.Key.X:
                    // TODO: right layer
                    this.exit();
                    break;
                default:
                    error("unrecognized key pressed in introTerminal: " + key);
            }
        }


    };
})();

 
