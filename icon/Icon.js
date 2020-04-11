// base object for any standalone object that manages its own rendering

(function() {
    SBar.Icon = function(context, type, x, y) {
        /*
        this._initObj(context, type, x, y);
        */
    };
    SBar.Icon.prototype = {
        type: SF.TYPE_UNDEFINED,
        update: function(shipx, shipy) {
            return true;
        },
        // Clean up objects
        teardown: function() {
            error("noicontear "+this.type);
        }

    };
})();
