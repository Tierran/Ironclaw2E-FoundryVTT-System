import { CommonSystemInfo } from "../systeminfo.js";

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
        let selectables = { "handedness": CommonSystemInfo.equipHandedness, "range": CommonSystemInfo.rangeBands, "giftOptions": CommonSystemInfo.giftSpecialOptions };
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

        // Roll handlers, click handlers, etc. 
        html.find('.add-new-special').click(this._onAddNewSpecial.bind(this));
        html.find('.delete-special-option').click(this._onDeleteSpecial.bind(this));
        html.find('.change-setting-mode').change(this._onChangeSpecialOption.bind(this));
        html.find('.special-change-field').change(this._onChangeSpecialField.bind(this));
        html.find('.special-change-number').change(this._onChangeSpecialNumber.bind(this));
        html.find('.special-change-boolean').change(this._onChangeSpecialBoolean.bind(this));
    }

    /**
     * Handle the addition of a new special option
     * @param {Event} event Originationg event
     */
    _onAddNewSpecial(event) {
        this.item.giftAddSpecialSetting();
    }

    /**
     * Handle the deletion of a special option
     * @param {Event} event Originationg event
     */
    _onDeleteSpecial(event) {
        const li = $(event.currentTarget).parents(".special-option");
        const index = li.data("special-index");
        this.item.giftDeleteSpecialSetting(index);
        //li.slideUp(200, () => this.render(false));
    }

    /**
     * Handle the change of a setting mode
     * @param {Event} event Originationg event
     */
    _onChangeSpecialOption(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".special-option");
        const index = li.data("special-index");
        const option = event.currentTarget.value;
        this.item.giftChangeSpecialSetting(index, option);
    }

    /**
     * Handle change in a text field special setting
     * @param {any} event
     */
    _onChangeSpecialField(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".special-option");
        const index = li.data("special-index");
        const name = event.currentTarget.name;
        const value = event.currentTarget.value;
        this.item.giftChangeSpecialField(index, name, value);
    }

    /**
     * Handle change in a text field special setting
     * @param {any} event
     */
    _onChangeSpecialNumber(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".special-option");
        const index = li.data("special-index");
        const name = event.currentTarget.name;
        const value = parseInt(event.currentTarget.value);
        if (typeof value !== "number") return;
        this.item.giftChangeSpecialField(index, name, value);
    }

    /**
     * Handle change in a text field special setting
     * @param {any} event
     */
    _onChangeSpecialBoolean(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".special-option");
        const index = li.data("special-index");
        const name = event.currentTarget.name;
        const value = event.currentTarget.checked;
        this.item.giftChangeSpecialField(index, name, value);
    }
}
