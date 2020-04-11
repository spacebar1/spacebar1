/*
 * Options Renderer object
 */
(function() {

    SBar.OptionsRenderer = function() {
        this._initOptionsRenderer();
    };

    SBar.OptionsRenderer.prototype = {
      type: SF.TIER_OPTSR,
      layer: null,
      textimg: null,
      textctx: null,
			prioractive: null,
			disable_auto_fullscreen: false,
			renderer: null,
			div: null,
			_initOptionsRenderer: function() {
          this.context = SC.layer2;
					this.renderer = this;
      },
      activate: function() {
	      SG.activeTier = this;
				this.render();
			},
			render: function() {
				SG.allow_options_key = false;
				SU.clearTextNoChar();
				SU.addText("F: Full Screen");
				let hotkeys_text = localStorage[SF.LOCALSTORAGE_HIDE_HOTKEYS] ? "Show" : "Hide";
				SU.addText("H: "+hotkeys_text+" Hotkeys Menu");
				let aspect_text = localStorage[SF.LOCALSTORAGE_LOCK_RATIO] ? "Unlock" : "Lock";
				SU.addText("R: "+aspect_text+" Aspect Ratio");
				SU.addText("X: Return");

	      SU.displayBorder("Game Options", this.context);
				
				SB.add(100, 100, SB.imgText("Full Screen (Esc to exit)", 14, 235), this.Fullscreen.bind(this));
				SB.add(100, 150, SB.imgText(hotkeys_text+" Hotkeys Menu", 14, 235), this.ToggleHotkeys.bind(this));
				SB.add(100, 200, SB.imgText(aspect_text+" Aspect Ratio", 14, 235), this.ToggleAspectLock.bind(this));
				
				SU.wrapText(this.context, "Saving the game is available in the interstellar starmap menu.", 100, SF.HEIGHT*0.41, 300, 25, SF.FONT_L, '#FFF');
				
				this.addOptionsDiv();
      },
			Fullscreen: function() {
				this.disable_auto_fullscreen = true;
				SU.GoFullscreen();
			},				
			ToggleHotkeys: function() {
				if (localStorage[SF.LOCALSTORAGE_HIDE_HOTKEYS]) {
					delete localStorage[SF.LOCALSTORAGE_HIDE_HOTKEYS];
				} else {
					localStorage[SF.LOCALSTORAGE_HIDE_HOTKEYS] = true;
				}
				this.ResetUI();
			},				
			ToggleAspectLock: function() {
				if (localStorage[SF.LOCALSTORAGE_LOCK_RATIO]) {
					delete localStorage[SF.LOCALSTORAGE_LOCK_RATIO];
				} else {
					localStorage[SF.LOCALSTORAGE_LOCK_RATIO] = true;
				}
				this.ResetUI();
			},				
			ResetUI: function() {
				SU.ResetScreenResize();
				SU.HandleScreenResize();
				this.teardown();
				this.render();
			},
      addOptionsDiv: function() {
          this.div = document.getElementById("optionsdiv");
					if (!this.div.innerHTML || this.div.innerHTML.length <= 20) {  // Defaults to 13?
						// Only add this once, so it doesn't reset and doesn't need to load out.
						this.div.innerHTML = ""
						+"<font style='color:white'>"
						+"<h2>"+SF.GAME_NAME+"</h2>"
						+"Version "+SF.VERSION+"<br>"
						+"Copyright (c) "+SF.COPYRIGHT_YEAR+"<br>"
						+"Open Source: MIT License<br>"
						+"Project details and source code: <br><a style='color:white' target='_blank' href='https://github.com/jeffhoy1/spacebarone'>https://github.com/jeffhoy1/spacebarone</a><br>"
						+"Bugs and feature requests: <br><a style='color:white' target='_blank' href='https://github.com/jeffhoy1/spacebarone/issues'>https://github.com/jeffhoy1/spacebarone/issues</a><br>"
						+"<h2>Streaming cosmic radio</h2>"
						+"Radio Sidewinder (radiosidewinder.com)<br>"
					  +"<audio controls=”controls”>"
						+"<source	src='http://radiosidewinder.out.airtime.pro:8000/radiosidewinder_b' type='audio/mp3'/>"
						+"Your browser does not support the audio element."
						+"</audio><br><br>"
						+"Hutton Orbital (huttonorbital.com)<br>"
						+"<audio controls=”controls”>"
						+"<source	src='http://bluford.torontocast.com:8447/hq' type='audio/mp3'/>"
						+"Your browser does not support the audio element."
						+"</audio><br><br>"
						+"Nebula Club (nebulaclub.ru)<br>"
						+"<audio controls=”controls”>"
						+"<source	src='http://151.80.97.38:8224/;stream/1' type='audio/mp3'/>"
						+"Your browser does not support the audio element."
						+"</audio><br><br>"
						+"</font>"
					}
					/*
					SU.text(this.context, "Streaming Radio:", 100, SF.HEIGHT*0.41, SF.FONT_L, '#FFF');
					SU.text(this.context, "Radio Sidewinder (radiosidewinder.com)", 120, SF.HEIGHT*0.45, SF.FONT_L, '#FFF');
					SU.text(this.context, "Hutton Orbital (huttonorbital.com)", 120, SF.HEIGHT*0.48, SF.FONT_L, '#FFF');
					SU.text(this.context, "Nebula Club (nebulaclub.ru)", 120, SF.HEIGHT*0.51, SF.FONT_L, '#FFF');
					*/
					this.div.style.position = "absolute";
					let x = Math.round(SF.WIDTH*0.55*SG.scalex);
					let y = Math.round(SF.HEIGHT*0.14*SG.scaley);
					this.div.style.left = x+"px";
					this.div.style.top = y+"px";
					
		      this.div.style.visibility = "visible";
					
					/*
			    expandExport: function() {
			      var exportdiv = document.getElementById("exportdiv");

			      //importdiv.style.visibility = "hidden";
			      //var encstr = DataStore.formatEncodedDataForExport(data);
			      //exportlink.href = "data:application/octet-stream;charset=utf-8;base64,"+encstr;
			      //exportlink.download = (Math.floor(new Date()/1000)%100000000)+".x";
			      var exportarea = document.getElementById("exportarea");
			      //exportarea.style.left = (800 + SF.MARGIN_LEFT + 5) + "px";
			      exportdiv.style.visibility = "visible";
			      exportarea.value = "";
			    },			
					*/		
//          this.inputarea = document.createElement("textarea");
//          this.inputarea.id = "exportarea";
//					this.inputarea.left = 600;
//          this.div.appendChild(this.inputarea);
      },
			
			
			
      handleUpdate: function(deltaTime, movex, movey) {
          // no-op
      },
      handleKey: function(key) {
          switch (key) {
              case SBar.Key.ESC:
              case SBar.Key.X:
              case SBar.Key.O:
                  this.fullteardown();
                  break;
              case SBar.Key.F:
								this.Fullscreen();
								break;
							case SBar.Key.R:
								this.ToggleAspectLock();
								break;
              case SBar.Key.H:
								this.ToggleHotkeys();
								break;
              default:
                  error("unrecognized key pressed in options: " + key);
          }
      },
			
			fullteardown: function() {
				this.teardown();
				SU.PopTier();
			},
			
			// Renderer teardown.
      teardown: function() {
				SG.allow_options_key = true;
	      this.div.style.visibility = "hidden";
				SB.clear();
        this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
      },
  };
})();

 
