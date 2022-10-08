import { CommonSystemInfo, getRangeDistanceFromBand, getSpecialSettingsRerolls } from "../systeminfo.js";
import { getAllItemsInWorld } from "../helpers.js";
import { getConditionSelectObject } from "../conditions.js";

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
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        const baseData = super.getData();
        baseData.dtypes = ["String", "Number", "Boolean"];

        let sheetData = {};
        // Insert the basics
        sheetData.item = baseData.data;
        sheetData.system = baseData.data.system;

        // Insert necessary misc data
        sheetData.options = baseData.options;
        sheetData.cssClass = baseData.cssClass;
        sheetData.editable = baseData.editable;
        sheetData.limited = baseData.limited;
        sheetData.title = baseData.title;
        sheetData.dtypes = baseData.dtypes;
        sheetData.sheetEngine = "prosemirror";

        // Prepare the description editor
        sheetData.richDescription = await TextEditor.enrichHTML(sheetData.system.description, { async: true });

        // Add structural sheet stuff
        let currencyOptions = {};
        const currencySettings = game.settings.get("ironclaw2e", "currencySettings");
        for (let foo of CommonSystemInfo.currencyNames) {
            if (foo === "baseCurrency")
                continue; // Base currency cannot be added as the 'currencyValueChange' bonus
            if (!currencySettings.hasOwnProperty(foo)) {
                console.error("Currency settings was missing a currency field somehow: " + foo);
                continue;
            }
            currencyOptions[foo] = currencySettings[foo].name;
        }
        let selectables = {
            "handedness": CommonSystemInfo.equipHandedness, "range": CommonSystemInfo.rangeBands, "giftOptions": CommonSystemInfo.giftSpecialOptions, "giftStates": CommonSystemInfo.giftWorksStates,
            "currencyOptions": currencyOptions, "giftBonusUses": CommonSystemInfo.giftBonusAutoUseOptions, "giftRerolls": getSpecialSettingsRerolls(), "systemConditions": getConditionSelectObject(),
            "lightAnimations": CONFIG.Canvas.lightAnimations, "extraSenses": CommonSystemInfo.extraSenses
        };
        sheetData.selectables = selectables;
        sheetData.isGM = game.user.isGM;
        sheetData.showDirectoryOptions = game.user.isGM && !this.item.parent;
        sheetData.rangeDistance = getRangeDistanceFromBand(sheetData.system.range);
        sheetData.showGiftSkill = sheetData.system.grantsMark || sheetData.system.specialSkillUse;

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

        // Gift special handlers 
        html.find('.add-new-special').click(this._onAddNewSpecial.bind(this));
        html.find('.delete-special-option').click(this._onDeleteSpecial.bind(this));
        html.find('.copy-special-settings').click(this._onCopySpecialSettings.bind(this));
        html.find('.copy-all-aspects').click(this._onCopyAllAspects.bind(this));

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
     * Handle the copying of Special Settings
     * @param {Event} event Originationg event
     */
    _onCopySpecialSettings(event) {
        if (game.user.isGM) {
            // Pop a dialog to confirm
            let confirmed = false;
            let dlog = new Dialog({
                title: game.i18n.localize("ironclaw2e.dialog.copyItem.title"),
                content: `
     <form>
      <h2>${game.i18n.format("ironclaw2e.dialog.copyItem.copySpecial", { "name": this.item.name })}</h2>
     </form>
     `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.copy"),
                        callback: () => confirmed = true
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                        callback: () => confirmed = false
                    }
                },
                default: "one",
                render: html => { },
                close: async html => {
                    if (confirmed) { // Only copy these settings and replace existing ones if confirmed
                        const gifts = getAllItemsInWorld("gift");
                        gifts.delete(this.item);
                        ui.notifications.info("ironclaw2e.ui.itemUpdateInProgress", { localize: true, permanent: true });
                        for (let gift of gifts) {
                            if (gift.name === this.item.name) {
                                console.log(gift); // Log all potential changes to console, just in case
                                await gift.update({ "system.specialSettings": this.item.system.specialSettings });
                            }
                        }
                        ui.notifications.info("ironclaw2e.ui.itemUpdateComplete", { localize: true, permanent: true });
                    }
                }
            });
            dlog.render(true);
        }
    }

    /**
     * Handle the copying of item data
     * @param {Event} event Originationg event
     */
    _onCopyAllAspects(event) {
        if (game.user.isGM) {
            // Pop a dialog to confirm
            let confirmed = false;
            let dlog = new Dialog({
                title: game.i18n.localize("ironclaw2e.dialog.copyItem.title"),
                content: `
     <form>
      <h2>${game.i18n.format("ironclaw2e.dialog.copyItem.copyAll", { "name": this.item.name })}</h2>
     </form>
     `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.copy"),
                        callback: () => confirmed = true
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                        callback: () => confirmed = false
                    }
                },
                default: "one",
                render: html => { },
                close: async html => {
                    if (confirmed) { // Only copy the item data and replace existing ones if confirmed
                        const items = getAllItemsInWorld(this.item.type);
                        items.delete(this.item);
                        // Grab the source data only
                        const sorsa = this.item._source;
                        ui.notifications.info("ironclaw2e.ui.itemUpdateInProgress", { localize: true, permanent: true });
                        for (let item of items) {
                            if (item.name === this.item.name) {
                                console.log(item); // Log all potential changes to console, just in case
                                await item.update({ "system": sorsa.system, "img": sorsa.img });
                            }
                        }
                        ui.notifications.info("ironclaw2e.ui.itemUpdateComplete", { localize: true, permanent: true });
                    }
                }
            });
            dlog.render(true);
        }
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
        //console.log(`${name}: ${value}`);
        this.item.giftChangeSpecialField(index, name, value);
    }

    /**
     * Handle change in a number field special setting
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
     * Handle change in a boolean special setting
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
