// base object for any standalone screen that manages its own rendering
// could get rid of this and all parent objects
(function() {
    SBar.Tier = function(x, y) {
        this._initTier(context, type, x, y);
    };
    
    SBar.Tier.prototype = {
        _initTier: function(x, y) {
            this.generated = false;
            error("notierinit");
        },
        // generate is for fast composition to load through or query, without rendering
        generate: function() {
            this.generated = true;
            error("notiergen");
        },
        // Flip to this tier
        activate: function(shipxIn, shipyIn) {
            if (!this.generated) {
                this.generate();
            }
            error("notieract");
        },
        // Checks to see if ship entered this tier
        /*
        entered: function(shipx, shipy) {
            error("notierenter");
        },
        */
        // Game frame
        handleUpdate: function(deltaTime, movex, movey) {
            error("notierupdate");
        },
        // Key input
        handleKey: function(key) {
            error("notierkey");
        },
        // Clean up objects
        teardown: function() {
            error("notiertear");
        }

    };

})();



