import { getCorrectElevationFlag } from "./helpers.js";
import { CommonSystemInfo, getRangeDistanceFromBand } from "./systeminfo.js";

/**
 * A helper class for building MeasuredTemplates for AoE attacks
 * @extends {MeasuredTemplate}
 */
export class AbilityTemplateIronclaw extends MeasuredTemplate {

    /**
     * A factory method to create an AbilityTemplate instance based on a range
     * @param {string | number} range The range used for the template's radius
     * @param {Function} successfunc Function called when the template is successfully placed
     * @returns {AbilityTemplate | null} The template object, or null if the range given is invalid
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
            this.data.update({ x: snapped.x, y: snapped.y });
            this.refresh();
            moveTime = now;
        };

        // Cancel the workflow (right-click)
        handlers.rc = event => {
            this.layer._onDragLeftCancel(event);
            canvas.stage.off("mousemove", handlers.mm);
            canvas.stage.off("mousedown", handlers.lc);
            canvas.app.view.oncontextmenu = null;
            initialLayer.activate();
            this.originSheet?.maximize();
        };

        // Confirm the workflow (left-click)
        handlers.lc = async event => {
            handlers.rc(event);
            const destination = canvas.grid.getSnappedPosition(this.data.x, this.data.y, 2);
            await this.data.update(destination);
            const [finished] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.data]);
            const flagfoo = getCorrectElevationFlag();
            await finished?.setFlag(flagfoo.modId, flagfoo.flagId, this.elevation);
            if (this.successFunc) this.successFunc(finished);
        };

        // Activate listeners
        canvas.stage.on("mousemove", handlers.mm);
        canvas.stage.on("mousedown", handlers.lc);
        canvas.app.view.oncontextmenu = handlers.rc;
    }
}