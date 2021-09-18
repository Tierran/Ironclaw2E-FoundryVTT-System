import { CommonSystemInfo } from "../helpers.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class Ironclaw2EItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ironclaw2e", "sheet", "item"],
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/ironclaw2e/templates/item";
        // Return a single sheet for all item types.
        //return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const baseData = super.getData();
        let sheetData = {};
        // Insert the basics
        sheetData.item = baseData.data;
        sheetData.data = baseData.data.data;

        // Insert necessary misc data
        sheetData.options = baseData.options;
        sheetData.cssClass = baseData.cssClass;
        sheetData.editable = baseData.editable;
        sheetData.limited = baseData.limited;
        sheetData.title = baseData.title;
        sheetData.dtypes = baseData.dtypes;

        // Add structural sheet stuff
        let selectables = { "handedness": CommonSystemInfo.equipHandedness, "range": CommonSystemInfo.rangeBands };
        sheetData.selectables = selectables;

        return sheetData;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Roll handlers, click handlers, etc. would go here.
    }
}
