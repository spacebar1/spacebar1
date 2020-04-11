// Note WebGL is not used here mainly for historical reasons / to avoid
// scope creep. Plus graphics are a slippery slope for a non-graphical game.
// This implementation is a highly simplified version of Samuel Hasler's
// JavaScript Library v0.2 at https://github.com/SamHasler/sphere.

(function() {
	var caches = {};

  SBar.Sphere = function(contextin, sizeIn, imageDatain) {
      this._initSphere(contextin, sizeIn, imageDatain);
  };

  SBar.Sphere.prototype = {	
		context: null,
		size: null,
		canvasImagedata: null,
		textureData: null,
		canvasData: null,
		posDelta: null,
		firstFramePos: 0,
		
    _initSphere: function(contextin, sizeIn, imageDatain) {
      this.context = contextin;
			this.size = sizeIn;
      this.canvasImageData = this.context.getImageData(0, 0, sizeIn, sizeIn);

      this.textureData = imageDatain.data;
      this.canvasData = this.canvasImageData.data;

      this.posDelta = sizeIn / (20 * 1000);
      this.firstFramePos = 0;
			if (caches[sizeIn] === undefined) {
				this.BuildCache(sizeIn);
			}
			this.cache = caches[sizeIn];
		},
		
		BuildCache: function() {
			var size = this.size;
      var cache = new Array(size * size);
		  var V = new Array(3);
		  V[1] = 30;
			var hs_ch = 30 / size;
			var vs_cv = 30 / size;

      var pixel = size * size;
      var v,h,a,s,m1,lh,lv;
      while (pixel--) {
        v = Math.floor(pixel / size);
        h = pixel - v * size;
        V[0] = hs_ch * h - 15;
        V[2] = vs_cv * v - 15;
        a = V[0] * V[0] + 900 + V[2] * V[2];
        s = 3240000 - a * 3024;
        if (s > 0) {
            m1 = (1800 - Math.sqrt(s)) / (2 * a);
            lh = size + size * (Math.atan2(-30 + (m1 * V[1]), m1 * V[0]) + Math.PI) / (2 * Math.PI);
            lv = size * Math.floor(size - 1 - (size * (Math.acos(m1 * V[2] / 12) / Math.PI) % size));
            cache[pixel] = [lv, lh];
        } else {
            cache[pixel] = null;
				}
			}
			caches[size] = cache;
		},

    renderFrame: function(time) {
			var textureData = this.textureData;
			var canvasData = this.canvasData;
			var cache = this.cache;
			var posDelta = this.posDelta;
			var firstFramePos = this.firstFramePos;
      var turnBy = 24 * 60 * 60 + firstFramePos - time * posDelta;
			var size = this.size;
      var pixel = size * size;
			var idxC,idxT,vector;
      while (pixel--) {
        vector = cache[pixel];
        if (vector !== null) {
          //rotate texture on sphere
          idxC = pixel * 4;
          idxT = (Math.floor(vector[1] + turnBy) % size + vector[0]) * 4;
          // Update the values of the pixel;
          canvasData[idxC + 0] = textureData[idxT + 0];
          canvasData[idxC + 1] = textureData[idxT + 1];
          canvasData[idxC + 2] = textureData[idxT + 2];
          canvasData[idxC + 3] = textureData[idxT + 3];
        }
			}
	    this.context.putImageData(this.canvasImageData, 0, 0);
    },
	};
})();
