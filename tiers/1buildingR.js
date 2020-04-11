(function() {

    SBar.BuildingRenderer = function(tier) {
        this._initBuildingRenderer(tier);
    };

    SBar.BuildingRenderer.prototype = {
        tier: null,
        setup: false,
        callbacklocal: null,
        context: null,
        tradebutton: null,
        // jobbutton: null,
			  // Booleans for available options.
  			trade_valid: false,
  			// job_valid: false,
				trade: null,
				trade2: null,  // If multiple purchased available.
				trade3: null,
        _initBuildingRenderer: function(tier) {
            this.tier = tier;
						this.BuildTrades();
        },
				BuildTrades: function() {
          this.trade = new SBar.BuildingTrade(this.tier.data);
					let tier_type = this.tier.data.type;
					if (this.trade.triple_trade) {
						this.trade2 = new SBar.BuildingTrade(this.tier.data, 5.12);
						this.trade3 = new SBar.BuildingTrade(this.tier.data, 5.13);
					}
				},
        render: function() {
            this.tier.botcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            this.tier.midcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            this.tier.topcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);

						if (this.alienr) {
							// Make sure any blinking is wiped out, if the alien gets re-drawn.
							this.alienr.teardown();
						}
            this.alienr = new SBar.BuildingAlienRenderer(this.tier);
						//S$.addButtons();
            //SB.buttX(this.tier.leave.bind(this.tier));

            this.drawMenu();
            this.alienr.render();

						this.UpdateHotkeys();
        },
				// Look at the artifact.
				/*
				Inspect: function() {
					if (!this.trade.arti) {
						return;
					}
				  SBar.ArtifactComplexRenderer = function(ship, arti, skip_char_key, view_only) {
					
          this.trade.arti.find(this.tier.data, this.trade.cost, this.doTrade.bind(this));
				},
				*/
				UpdateHotkeys: function() {
					this.trade_valid = S$.credits >= this.trade.cost && this.trade.available;
					SU.clearText();
					// Could clean up the logic here- push it all into the trade interface, or simplify.
					if (this.trade.buy_text) {
						SU.addText("1: "+this.trade.buy_text);							
						if (this.trade2) {
							SU.addText("2: "+this.trade2.buy_text);							
							SU.addText("3: "+this.trade3.buy_text);							
						}
					} else {
						if (this.trade.doInspect) {
							SU.addText("1: Inspect / Buy");							
						}
						if (this.trade2 && this.trade2.doInspect) {
							SU.addText("2: Inspect / Buy");							
							SU.addText("3: Inspect / Buy");							
						}
						if (this.trade_valid && this.trade.doTrade) {
							if (this.trade.trade_text) {
								SU.addText("T: "+this.trade.trade_text);
							} else {
								SU.addText("T: Purchase");
							}
						}
					}
					SU.addText("A: Attack Host");						
					SU.addText("X: Leave");						
				},
        renderUpdate: function() {
            this.alienr.render();
        },
				
        drawMenu: function() {
					if (this.trade2) {
						this.BuildTrades();  // Refresh remaining credits for all.
						// 3-item drawing.
						this.drawMenuInternal(this.trade, 120);
						this.drawMenuInternal(this.trade2, 420);
						this.drawMenuInternal(this.trade3, 720);
					} else {
						this.drawMenuInternal(this.trade, 720);
					}
				},
				
				drawMenuInternal: function(trade, menux) {
            var ctx = this.tier.topcontext;

            //var menux = 720;
            var menuy = 110;
            var width = 250;
            var height = 500;
            //ctx.clearRect(menux, menuy, width, height);
            ctx.save();
            ctx.translate(menux, menuy);
						
						let colorStops;
            if (!trade.available || !trade.canpay) {
							colorStops = [0, 'rgba(130,100,100,1)', 1, 'rgba(100,90,100,0.8)'];
						} else {
							colorStops = [0, 'rgba(100,130,100,1)', 1, 'rgba(90,100,90,0.8)'];
						}
//            var colorStops = [0, 'rgba(0,0,0,0.9)', 1, 'rgba(90,100,90,0.9)'];
//            SU.rectCornerGrad(ctx, 8,  0, 0, width, height / 2, colorStops, 'rgb(0,0,0)', 2);
//            colorStops = [0, 'rgba(130,100,100,1)', 1, 'rgba(100,90,90,1)'];
            SU.rectCornerGrad(ctx, 8,  0, height / 2, width, height / 2, colorStops, 'rgba(0,0,0,0.8)', 2);

            /*
            var border = "#333";
            var colorStops = [0, 'rgba(220,220,180,1)', 1, 'rgba(190,190,190,1)'];
            SU.rectGrad(ctx, 0, 0, width, height / 2, 0, 0, 0, height, colorStops, border, 3);
            colorStops = [0, 'rgba(180,220,220,1)', 1, 'rgba(190,190,190,1)'];
            SU.rectGrad(ctx, 0, height / 2, width, height / 2, 0, 0, 0, height, colorStops, border, 3);
            */

            ctx.font = '200pt '+SF.FONT;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.textAlign = 'center';
//            ctx.fillText("+", width / 2, 200);            
            if (!trade.available || !trade.canpay) {
              ctx.fillText("X", width / 2, height / 2 + 220);
            } else {
              ctx.fillText("✓", width / 2, height / 2 + 220);
            }
						if (trade.arti) {
							var arti_icon = new SBar.IconArtifact(ctx, trade.arti);
							//arti_icon.DrawAt(SF.HALF_WIDTH, SF.HALF_HEIGHT)
							//ctx.globalAlpha = 0.5;
							arti_icon.DrawAt(width/2,height-120)
							//ctx.globalAlpha = 1;
						} else if (trade.ship) {
							var img = trade.ship.GetImage(250, 0);
				      ctx.drawImage(img, 0,height/2+15);
						}

            ctx.fillStyle = 'white';
            ctx.font = SF.FONT_L;
            ctx.textAlign = 'center';
            let yoff = SU.wrapText(ctx, trade.offertext[0], width / 2, height / 2 + 30, width-20, 24, SF.FONT_L, 'white', 'center');
            if (trade.offertext[1] !== undefined) {
							SU.wrapText(ctx, trade.offertext[1], width / 2, height / 2 + 30 + yoff, width-20, 24, SF.FONT_M, 'white', 'center');
                //ctx.fillText(trade.offertext[1], width / 2, height / 2 + 50 + yoff);
            }
            ctx.fillStyle = 'rgb(200,200,230)';
            ctx.font = SF.FONT_M;
            for (var i = 2; i < trade.offertext.length; i++) {
                ctx.fillText(trade.offertext[i], width / 2, height / 2 + 40 + i * 20);
            }
            ctx.font = SF.FONT_L;
            ctx.fillStyle = 'white';
            for (var i = 0; i < trade.costtext.length; i++) {
                ctx.fillText(trade.costtext[i], width / 2, height / 2 + 260 + i * 30 - trade.costtext.length*30);
            }
						

            var message = null;
            //if (!trade.available) {
            //    message = "SOLD OUT";
            //} else 
						if (!trade.canpay) {
              message = "";
            }
            if (message !== null) {
                ctx.font = SF.FONT_LB;
                ctx.fillStyle = "#B85";
                ctx.textAlign = 'center';
                ctx.fillText(message, width / 2, height + 26);
            } else {
            //    this.tradebutton = SB.add(970 + width / 2 - 30, SF.HEIGHT - 260, SM.buttCheck, this.doTrade.bind(this), 60, 60);
            }
            ctx.restore();
						
						this.UpdateHotkeys();
        },
        doTrade: function() {
					if (!this.trade.doTrade) {
						return;
					}
					//if (this.trade.arti) {
					//	this.Inspect();
					//	return;
					//}
					if (!this.trade.canpay) {
						this.speak("Not enough "+SF.SYMBOL_CREDITS)
					} else if (!this.trade.canhold){
						this.speak("Not enough "+SF.SYMBOL_CARGO)
					} else {
	          this.trade.doTrade();
					}
          //SB.remove(this.tradebutton);
					if (!this.trade.skip_redraw) {
						this.drawMenu();
					}
        },
				doInspect: function(index) {
					if (this.trade2) {
						// Need to have index handling for 3 items.
						if (index == 0 && this.trade.doInspect) {
							this.trade.doInspect();
						} else if (index == 1 && this.trade2.doInspect) {
							this.trade2.doInspect();
						} else if (index == 2 && this.trade3.doInspect) {
							this.trade3.doInspect();
						}
					} else if (index === 0 && this.trade.doInspect) {
						this.trade.doInspect();
					}
				},
        speak: function(text, timeout) {
					if (this.tier.data.type !== SF.TYPE_HOTEL) {
						if (this.timeout) {
	            window.clearTimeout(this.timeout);
			        SC.layer3.clearRect(SF.HALF_WIDTH/2-50, 450, 400, 500); // needs to cover border
						}
						this.timeout = SU.textBubble(text, SF.HALF_WIDTH/2+130, 450, SF.HALF_WIDTH/2, 500, 300); //text, anchor x/y, box x/y, width	
					}
        },
        teardown: function() {
            this.alienr.teardown();
            this.trade.teardown();
            delete this.alienr;
            //delete this.trade;
						SU.clearText();
						if (this.timeout) {
	            window.clearTimeout(this.timeout);
			        SC.layer3.clearRect(SF.HALF_WIDTH/2-50, 450, 400, 500); // needs to cover border
						}
            //SB.clear();
            this.tier.botcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            this.tier.midcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
            this.tier.topcontext.clearRect(0, 0, SF.WIDTH, SF.HEIGHT);
        }
    };
    SU.extend(SBar.BuildingRenderer, SBar.TierRenderer);
})();
