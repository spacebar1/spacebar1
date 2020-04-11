/*
 * A data object holds the data of the layer objects, like the color of a star or wind on a planet
 * The constructor makes the pieces needed to get info about an object without rendering it. 
 * Use generate() to build objects underneath for transversal
 * 
 * Data Hierarchy:
 *   Region
 *     System
 *       Planet
 *         Surface (some references to planet)
 *           Building
 *             Temple
 *       Belt, also stored asteroids
 *         Building
 *           Temple
 */

(function() {
    SBar.Data = function() {
    };
    SBar.Data.prototype = {
        type: SF.TYPE_UNDEFINED,
        generate: function() {
            error("nodatagen");
        },
        // Clean up objects
        teardown: function() {
            error("nodatatear");
        }

    };
})();
