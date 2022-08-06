import { getCorrectElevationFlag } from "./helpers.js";
import { CommonSystemInfo, getRangeDistanceFromBand } from "./systeminfo.js";

/**
 * A helper class for building MeasuredTemplates for AoE attacks
 * @extends {MeasuredTemplate}
 */
export class AoETemplateIronclaw extends MeasuredTemplate {

    /**
     * A factory method to create an AoETemplateIronclaw instance based on a range
     * @param {string | number} range The range used for the template's radius
     * @param {Function} successfunc Function called when the template is successfully placed
     * @returns {AoETemplateIronclaw | null} The template object, or null if the range given is invalid
     */
    static fromRange(range, { elevation = 0, successfunc = null, originSheet = null } = {}) {
        const usedNumber = (typeof (range) === "string" ? getRangeDistanceFromBand(range) : range);
        if (isNaN(usedNumber) || usedNumber < 0) {
            console.warn("The given range is invalid for templates: " + range);
            return null;
        }

        // Prepare template data
        const templateData = {
            t: "circle",
            user: game.user.id,
            distance: usedNumber,
            direction: 0,
            x: 0,
            y: 0,
            fillColor: game.user.color
        };

        // Return the template constructed from the given range
        const cls = CONFIG.MeasuredTemplate.documentClass;
        const template = new cls(templateData, { parent: canvas.scene });
        const foo = new this(template);
        foo.successFunc = successfunc;
        foo.elevation = elevation;
        foo.originSheet = originSheet;
        return foo;
    }

    /**
     * Creates a preview of the spell template
     */
    drawPreview() {
        const initialLayer = canvas.activeLayer;

        // Draw the template and switch to the template layer
        this.draw();
        this.layer.activate();
        this.layer.preview.addChild(this);

        // Hide the sheet that originated the preview
        this.originSheet?.minimize();

        // Activate interactivity
        this.activatePreviewListeners(initialLayer);
    }

    /* -------------------------------------------- */

    /**
     * Activate listeners for the template preview
     * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
     */
    activatePreviewListeners(initialLayer) {
        const handlers = {};
        let moveTime = 0;

        // Update placement (mouse-move)
        handlers.mm = event => {
            event.stopPropagation();
            let now = Date.now(); // Apply a 20ms throttle
            if (now - moveTime <= 20) return;
            const center = event.data.getLocalPosition(this.layer);
            const snapped = canvas.grid.getSnappedPosition(center.x, center.y, 2);
            this.document.updateSource({ x: snapped.x, y: snapped.y });
            this.refresh();
            moveTime = now;
        };

        // Cancel the workflow (right-click)
        handlers.rc = event => {
            this.layer._onDragLeftCancel(event);
            canvas.stage.off("mousemove", handlers.mm);
            canvas.stage.off("mousedown", handlers.lc);
            canvas.app.view.oncontextmenu = null;
            canvas.app.view.onwheel = null;
            initialLayer.activate();
            this.originSheet?.maximize();
        };

        // Confirm the workflow (left-click)
        handlers.lc = async event => {
            handlers.rc(event);
            const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, 2);
            await this.document.updateSource(destination);
            const [finished] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]);
            const flagfoo = getCorrectElevationFlag();
            await finished?.setFlag(flagfoo.modId, flagfoo.flagId, this.elevation);
            if (this.successFunc) this.successFunc(finished);
        };

        // Rotate the template by 3 degree increments (mouse-wheel)
        handlers.mw = event => {
            if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
            event.stopPropagation();
            let delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
            let snap = event.shiftKey ? delta : 5;
            const update = { direction: this.document.direction + (snap * Math.sign(event.deltaY)) };
            this.document.updateSource(update);
            this.refresh();
        };

        // Activate listeners
        canvas.stage.on("mousemove", handlers.mm);
        canvas.stage.on("mousedown", handlers.lc);
        canvas.app.view.oncontextmenu = handlers.rc;
        canvas.app.view.onwheel = handlers.mw;
    }
}