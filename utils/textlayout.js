// Standardized way to write text in two columns.

/*
 * Generates treasure. Generally corresponds to a BattleBuilder victory.
 */
(function() {
  SBar.TextLayout = function(context) {
    this._initTextLayout(context);
  };

  SBar.TextLayout.prototype = {
		context: null,
		xoff: null,
		yoff: null,
		
    _initTextLayout: function(context) {
			this.context = context;
			this.xoff = 0;
			this.yoff = 0;
    },

    prepLeft: function(text, clear) {
			if (clear) {
	      this.context.clearRect(0, 0, SF.HALF_WIDTH, SF.HEIGHT);
			}
      this.xoff = 100;
      this.yoff = 100;
			if (text) {
	      this.AddTitle(text);
			}
    },
		
    prepRight: function(text, clear) {
			if (clear) {
	      this.context.clearRect(SF.HALF_WIDTH, 0, SF.HALF_WIDTH, SF.HEIGHT);
			}
      this.xoff = SF.HALF_WIDTH + 20;
      this.yoff = 100;
			if (text) {
	      this.AddTitle(text);
			}
    },
		
		
    AddTitle: function(text) {
      this.yoff += 10;
      var context = this.context;
      context.font = SF.FONT_LB;
      context.fillStyle = '#FFF';
      context.textAlign = 'left';
      context.fillText(text, this.xoff, this.yoff);
/*
      if (value) {
        context.fillStyle = SF.VALUE_COLOR;
        context.textAlign = 'right';
        context.fillText(value, this.xoff + 300, this.yoff);
      }
			*/
      this.yoff += 30;
    },				
		
    AddValue: function(text, value, bold) {
      var context = this.context;
      if (bold) {
        context.font = SF.FONT_LB;
      } else {
        context.font = SF.FONT_L;
      }
      context.fillStyle = '#FFF';
      context.textAlign = 'left';
      context.fillText(text, this.xoff + 25, this.yoff);
      context.fillStyle = SF.VALUE_COLOR;
			if (value !== null && value !== undefined) {
	      context.textAlign = 'right';
	      context.fillText(value, this.xoff + 400, this.yoff);
			}
      this.yoff += 25;
    },
		
		TextLine: function(text) {
      SU.text(this.context, text, this.xoff + 25, this.yoff, SF.FONT_M, '#AAA');
			this.yoff += 22;
		},
		
    AddWrapText: function(text, value) {
      this.yoff += SU.wrapText(this.context, text, this.xoff + 25, this.yoff, 400, 25, SF.FONT_L, "#FFF");
    },				

  };
})();

