/*
 * Options Renderer object
 */
(function() {

    SBar.LoadRenderer = function() {
        this._initLoadRenderer();
    };

    SBar.LoadRenderer.prototype = {
        type: SF.TIER_LOADR,
        layer: null,
        textimg: null,
        textctx: null,
				prioractive: null,
        _initLoadRenderer: function() {
            this.context = SC.layer2;
        },
        activate: function() {
//            if (SG.activeTier.type === SF.TIER_CHARR) {
                // may have disabled the ship buttons
//                return;
//            }
            this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
//            SB.clear();
            this.addDiv();

            this.drawOpts();
						
						this.prioractive = SG.activeTier;
            SG.activeTier = this; //last step once set up
        },
        handleUpdate: function(deltaTime, movex, movey) {
            // no-op
        },
        handleKey: function(key) {
            switch (key) {
                case SBar.Key.ESC:
                case SBar.Key.X:
                case SBar.Key.P:
                    this.teardownLocal();
                    break;
                default:
                    error("unrecognized key pressed in loadr: " + key);
            }
        },
        drawOpts: function() {
            this.textimg = document.createElement('canvas');
            this.textimg.width = SF.WIDTH;
            this.textimg.height = SF.HEIGHT;
            var context = this.textimg.getContext('2d');
            this.textctx = context;

            SU.displayBorder("Save State", this.textctx);
/*
            context.font = SF.FONT_XLB;
            context.fillStyle = '#FFF';
            context.textAlign = 'left';
            context.fillText("Hotkeys: ", 100, 130);

            context.font = 'bold 30pt '+SF.FONT;
            context.fillStyle = '#FFF';
            context.textAlign = 'center';
            context.fillText("SPACEBAR IS PAUSED!", SF.HALF_WIDTH, SF.HEIGHT - 300);
*/
            SB.buttX(this.teardownLocal.bind(this));
/*
            this.hoty = 170;
            this.renderHotkey("TODO: update this", "");
            this.renderHotkey("Ship", "TODO (S)");
            this.renderHotkey("PAUSE, Menu", "ESC");
            this.renderHotkey("Pause", "P");
            this.renderHotkey("Job", "J, !");
            this.renderHotkey("Trade", "T");
            this.renderHotkey("Accept", "Spacebar!");
            this.renderHotkey("Exit / Launch", "X");
*/
						
	            SU.text(this.textctx, "Version: "+SF.VERSION, 100, 110, SF.FONT_MB, '#FFF');
						

            SB.add(100, 130, SB.imgText("Save Game", 14, 155), this.saveGame.bind(this));

						if (!S$.hardcore) {
	            SB.add(100, 180, SB.imgText("Load Saved Game", 14, 155), this.loadGame.bind(this));
	            SU.expandExport();
	            SB.add(100, 280, SB.imgText("Export Game Data", 14, 155), this.exportGame.bind(this));
	            SB.add(100, 310, SB.imgText("Export Raw Data", 14, 155), this.exportGameUnencoded.bind(this));
	            SB.add(100, 370, SB.imgText("Import Game Data", 14, 155), this.importGame.bind(this));
						}

            this.context.drawImage(this.textimg, 0, 0);
        },
        hotx: 150,
        hoty: null,
        renderHotkey: function(name, value) {
            SU.text(this.textctx, name, this.hotx, this.hoty, SF.FONT_MB, '#FFF');
            SU.text(this.textctx, value, this.hotx + 300, this.hoty, SF.FONT_MB, SF.VALUE_COLOR, 'right');

            this.hoty += 22;
        },
        saveGame: function() {
					S$.savexy = [0, 0];
					S$.conduct_data['cansave'] = true;
					if (this.prioractive.type === SF.TIER_STARMAP) {
						S$.savexy = [this.prioractive.shipx, this.prioractive.shipy];
					}
            SU.saveGame();
        },
        loadGame: function() {
            SU.loadGame();
        },
        exportGame: function() {
            SU.exportGame();
        },
        exportGameUnencoded: function() {
            SU.exportGameUnencoded();
        },
        importGame: function() {
            SU.importGame();
        },
        refresh: function() {
            this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            this.context.drawImage(this.textimg, 0, 0);
        },
        addDiv: function() {
            this.div = document.getElementById("exportdiv");
            this.inputarea = document.createElement("textarea");
            this.inputarea.id = "exportarea";
						this.inputarea.left = 600;
            this.div.appendChild(this.inputarea);
        },
        teardownLocal: function() {
            this.div.removeChild(this.inputarea);
            SU.removeExport();
            this.context.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
						SU.PopTier();
        },
        // combined draw for kobjs and text
        // this would be called from a game load, need to tear down the base tier
        teardown: function() {
            this.teardownLocal();
//            SG.activeTier.teardown();
        }
    };
})();

 
