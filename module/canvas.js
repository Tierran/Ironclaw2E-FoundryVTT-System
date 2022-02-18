// Straight out of Foundry's D&D5e system
/** @override */
export const measureDistances = function (segments, options = {}) {
    if (!options.gridSpaces) return BaseGrid.prototype.measureDistances.call(this, segments, options);

    // Track the total number of diagonals
    let nDiagonal = 0;
    const rule = this.parent.diagonalRule;
    const d = canvas.dimensions;

    // Iterate over measured segments
    return segments.map(s => {
        let r = s.ray;

        // Determine the total distance traveled
        let nx = Math.abs(Math.ceil(r.dx / d.size));
        let ny = Math.abs(Math.ceil(r.dy / d.size));

        // Determine the number of straight and diagonal moves
        let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);
        nDiagonal += nd;

        // Standard Euclidean measurement
        if (rule === "EUCL" || rule === "RDCL") {
            return Math.round(Math.hypot(nx, ny) * canvas.scene.data.gridDistance);
        }

        // The one-two, or five-ten, compromise
        else if (rule === "ONTW") {
            let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
            let spaces = (nd10 * 2) + (nd - nd10) + ns;
            return spaces * canvas.dimensions.distance;
        }

        // Diagonal movement same as orthogonal
        else return (ns + nd) * canvas.scene.data.gridDistance;
    });
};
