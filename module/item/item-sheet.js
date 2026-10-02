import { CommonSystemInfo, getRangeDistanceFromBand, getSpecialSettingsRerolls, getThreatRanges } from "../systeminfo.js";
import { getAllItemsInWorld, popupConfirmationBox } from "../helpers.js";
import { getConditionSelectObject } from "../conditions.js";
const { ItemSheet } = foundry.appv1.sheets;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class Ironclaw2EItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ironclaw2e", "sheet", "item"],
            width: 720,
            height: 600,
            dragDrop: [{dropSelector: null }],
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
        sheetData.isGM = game.user.isGM;

        // Prepare the description editor
        sheetData.richDescription = await TextEditor.enrichHTML(sheetData.system.description, { async: true, secrets: sheetData.editable });

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
            "lightAnimations": CONFIG.Canvas.lightAnimations, "extraSenses": CommonSystemInfo.extraSenses, "threatRanges": getThreatRanges(), "staffingConditions": CommonSystemInfo.vehicleStationStaffing,
            "physicalConditions": CommonSystemInfo.vehicleStationPhysical, "mentalConditions": CommonSystemInfo.vehicleStationMental
        };
        sheetData.selectables = selectables;
        sheetData.showDirectoryOptions = game.user.isGM && !this.item.parent;
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
        html.find('.convert-to-magic').click(this._onConvertToMagic.bind(this));

        html.find('.change-setting-mode').change(this._onChangeSpecialOption.bind(this));
        html.find('.special-change-field').change(this._onChangeSpecialField.bind(this));
        html.find('.special-change-number').change(this._onChangeSpecialNumber.bind(this));
        html.find('.special-change-boolean').change(this._onChangeSpecialBoolean.bind(this));

        html.find('.vehicle-captain-reset').change(this._onVehicleCaptainReset.bind(this));

        // Spell attack handlers
        html.find('.add-spell-attack').click(this._onAddSpellAttack.bind(this));
        html.find('.delete-spell-attack').click(this._onDeleteSpellAttack.bind(this));
        html.find('.spell-attack-field').change(this._onChangeSpellAttackField.bind(this));
        html.find('.spell-attack-boolean').change(this._onChangeSpellAttackField.bind(this));
        html.find('.add-spell-tier').click(this._onAddSpellTier.bind(this));
        html.find('.delete-spell-tier').click(this._onDeleteSpellTier.bind(this));
        html.find('.spell-tier-field').change(this._onChangeSpellTierField.bind(this));
        html.find('.spell-tier-number').change(this._onChangeSpellTierField.bind(this));
    }

    /**
     * Convert a gift into a magic gift, after confirmation
     * @param {Event} event
     * @private
     */
    async _onConvertToMagic(event) {
        event.preventDefault();
        const confirmation = await popupConfirmationBox("ironclaw2e.dialog.convertMagicGift.title", "ironclaw2e.dialog.convertMagicGift.header", "ironclaw2e.dialog.convert",
            { "itemname": this.item.name, "defaultbutton": "two" });
        if (!confirmation.confirmed) return;

        // Close the gift sheet first, so the item reopens with the magic gift sheet
        const item = this.item;
        await this.close();
        const converted = await item.giftConvertToMagic();
        if (converted) converted.sheet.render(true);
    }

    /**
     * Add a new spell attack to a magic gift
     * @param {Event} event
     * @private
     */
    _onAddSpellAttack(event) {
        event.preventDefault();
        this.item.spellAddAttack();
    }

    /**
     * Delete a spell attack from a magic gift
     * @param {Event} event
     * @private
     */
    _onDeleteSpellAttack(event) {
        event.preventDefault();
        const index = parseInt($(event.currentTarget).closest(".spell-attack").data("attackIndex"));
        this.item.spellDeleteAttack(index);
    }

    /**
     * Change a field in a spell attack
     * @param {Event} event
     * @private
     */
    _onChangeSpellAttackField(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const index = parseInt($(element).closest(".spell-attack").data("attackIndex"));
        const value = element.type === "checkbox" ? element.checked : element.value;
        this.item.spellChangeAttackField(index, element.dataset.field, value);
    }

    /**
     * Get the spell attack and success tier indices of a tier element
     * @param {HTMLElement} element
     * @returns {number[]}
     * @private
     */
    _getSpellTierIndices(element) {
        const attackindex = parseInt($(element).closest(".spell-attack").data("attackIndex"));
        const tierindex = parseInt($(element).closest(".spell-tier").data("tierIndex"));
        return [attackindex, tierindex];
    }

    /**
     * Add a new success tier to a spell attack
     * @param {Event} event
     * @private
     */
    _onAddSpellTier(event) {
        event.preventDefault();
        const attackindex = parseInt($(event.currentTarget).closest(".spell-attack").data("attackIndex"));
        this.item.spellAddTier(attackindex);
    }

    /**
     * Delete a success tier from a spell attack
     * @param {Event} event
     * @private
     */
    _onDeleteSpellTier(event) {
        event.preventDefault();
        const [attackindex, tierindex] = this._getSpellTierIndices(event.currentTarget);
        this.item.spellDeleteTier(attackindex, tierindex);
    }

    /**
     * Change a field in a spell attack's success tier
     * @param {Event} event
     * @private
     */
    _onChangeSpellTierField(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const [attackindex, tierindex] = this._getSpellTierIndices(element);
        let value = element.value;
        if (element.type === "number") {
            value = parseInt(value);
            if (isNaN(value)) return;
        }
        this.item.spellChangeTierField(attackindex, tierindex, element.dataset.field, value);
    }

    /** @inheritdoc */
    _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        if (data.type === "Actor") {
            return this._onDropActor(event, data);
        }
    }

    /**
     * In case of vehicle stations, insert the dragged actor as the captain
     */
    async _onDropActor(event, data) {
        if (!this.item.isOwner) return false;
        if (this.item.type !== "vehicleStation") return false;

        // Actors with actual stats from the directory can be dragged onto a vehicle station as the captain
        try {
            const dropped = fromUuidSync(data.uuid);
            if (dropped.type !== "character" && dropped.type !== "mook" && dropped.type !== "beast") {
                ui.notifications.info(game.i18n.format("ironclaw2e.ui.actorTypeMismatch", { mismatch: dropped.type }));
                return false;
            }
            if (dropped.parent) {
                ui.notifications.info("ironclaw2e.ui.actorFromDirectoryWarning", { localize: true });
                return false;
            }
            await this.item.update({ "_id": this.item.id, "system.stationCaptain": data.uuid });
            return true;
        }
        catch (err) {
            ui.notifications.warn(err);
        }
        return false;
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
                        const gifts = getAllItemsInWorld(this.item.type);
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

    /**
     * Handle reseting the vehicle's default crew
     * @param {Event} event   The originating change event
     * @private
     */
    _onVehicleCaptainReset(event) {
        event.preventDefault();
        //TODO
    }
}
