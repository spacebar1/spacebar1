(function() {

    var image1 = null;
    var image2 = null;
    var size = 80; // no larger than twice the iconMapSystems padding

    SBar.IconQuestTarget = function(quest_obj, context, x, y) {
        this._initIconQuestTarget(quest_obj, context, x, y);
    };
    SBar.IconQuestTarget.prototype = {
        type: SF.TYPE_ICON_GENERIC,
				quest_obj: null,
        context: null,
        x: null,
        y: null,
        _initIconQuestTarget: function(quest_obj, context, x, y) {
					this.quest_obj = quest_obj;
          this.context = context;
          this.x = x;
          this.y = y;
          if (image1 === null) {
              this.buildQuestTarget();
          }
        },
        update: function(shipx, shipy, fromsurface) {
					if (this.quest_obj.completed) {
						return;
					}
          var offx = this.x - shipx;
          var offy = this.y - shipy;
          this.context.save();
					if (fromsurface) {
            this.context.translate(offx, offy);
					} else {
						this.context.translate(SF.HALF_WIDTH + offx, SF.HALF_HEIGHT + offy);
					}
          this.context.rotate(S$.time / 300);
          this.context.drawImage(image1, -size / 2, -size / 2);
          this.context.rotate(-S$.time / 150); // twice to reverse first
          this.context.drawImage(image2, -size / 2, -size / 2);
          this.context.restore();
          return true;
        },
        buildQuestTarget: function() {
            image1 = document.createElement('canvas');
            image1.width = size;
            image1.height = size;
            var ctx = image1.getContext('2d');
            ctx.save();
            ctx.translate(size / 2, size / 2);

            // arc: centerx, centery, rad, start rad, end rad, reverse
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(100,100,100,0.5)';
            //ctx.strokeStyle = 'rgba(200,200,200,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 - 3, PIx2 / 40, PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 - 3, PIx2 / 40 + PIx2 / 4, PIx2 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 - 3, PIx2 / 40 + PIx2 / 2, PIx2 / 2 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 2 - 3, PIx2 / 40 + PIx2 * 3 / 4, PIx2 * 3 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();

            ctx.lineWidth = 2;
            //ctx.strokeStyle = 'rgba(100,100,100,0.5)';
            ctx.strokeStyle = 'rgba(200,200,200,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, size / 4 - 2, PIx2 / 40, PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 4 - 2, PIx2 / 40 + PIx2 / 4, PIx2 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 4 - 2, PIx2 / 40 + PIx2 / 2, PIx2 / 2 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size / 4 - 2, PIx2 / 40 + PIx2 * 3 / 4, PIx2 * 3 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.restore();


            image2 = document.createElement('canvas');
            image2.width = size + 4;
            image2.height = size + 4;
            ctx = image2.getContext('2d');
            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(150,150,150,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, size * 3 / 8 - 1, PIx2 / 40, PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size * 3 / 8 - 1, PIx2 / 40 + PIx2 / 4, PIx2 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size * 3 / 8 - 1, PIx2 / 40 + PIx2 / 2, PIx2 / 2 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size * 3 / 8 - 1, PIx2 / 40 + PIx2 * 3 / 4, PIx2 * 3 / 4 + PIx2 / 5 + PIx2 / 40, false);
            ctx.stroke();
            ctx.restore();

            //SU.circle(ctx, 0, 0, size / 2 - 3, 'rgba(255,255,255,0.25)');
            //SU.line(ctx, -size / 2, 0, size / 2, 0, 'rgba(255,255,150,1)');
            //SU.line(ctx, 0, -size / 2, 0, size / 2, 'rgba(255,255,150,1)');
        }

    };
    SU.extend(SBar.IconQuestTarget, SBar.Icon);
})();	
