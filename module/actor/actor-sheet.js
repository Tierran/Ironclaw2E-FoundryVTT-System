import { checkApplicability, checkDiceArrayEmpty, diceFieldUpgrade, findTotalDice, getMacroSpeaker, makeCompareReady, parseSingleDiceString, reformDiceString, splitStatString } from "../helpers.js";
import { CommonSystemInfo } from "../systeminfo.js";
import { getConditionByNameIronclaw } from "../conditions.js";
import { hasConditionsIronclaw } from "../conditions.js";
import { Ironclaw2EItem } from "../item/item.js";

/**
 * Extend the basic ActorSheet
 * @extends {ActorSheet}
 */
export class Ironclaw2EActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ironclaw2e", "sheet", "actor"],
            width: 800,
            height: 720,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "battlestats" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/ironclaw2e/templates/actor";

        return `${path}/actor-${this.actor.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const baseData = super.getData();
        baseData.dtypes = ["String", "Number", "Boolean"];
        //console.log(baseData);

        let sheetData = {};
        // Insert the basics
        sheetData.actor = baseData.data;
        sheetData.items = baseData.items;

        // Insert necessary misc data
        sheetData.options = baseData.options;
        sheetData.cssClass = baseData.cssClass;
        sheetData.editable = baseData.editable;
        sheetData.limited = baseData.limited;
        sheetData.title = baseData.title;
        sheetData.dtypes = baseData.dtypes;

        // Prepare items
        if (this.actor.data.type == 'character') {
            this._prepareCharacterItems(sheetData);
        }
        if (this.actor.data.type == 'mook') {
            this._prepareCharacterItems(sheetData);
        }
        if (this.actor.data.type == 'beast') {
            this._prepareBeastItems(sheetData);
        }

        // Grab the actual template data and effects
        sheetData.data = baseData.data.data;
        sheetData.effects = baseData.effects;

        // Get whether the actor is flying for some things
        sheetData.isFlying = baseData.data.data.isFlying === true;

        //console.log(sheetData);
        return sheetData;
    }

    /**
     * Organize and classify Items for Character and Mook sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const gifts = [];
        const extraCareers = [];
        const weapons = [];
        const armors = [];
        const shields = [];
        const lightItems = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;

            // Switch-case to append the item to the proper list
            switch (i.type) {
                case 'item':
                    gear.push(i);
                    break;
                case 'gift':
                    gifts.push(i);
                    break;
                case 'extraCareer':
                    extraCareers.push(i);
                    break;
                case 'weapon':
                    weapons.push(i);
                    break;
                case 'armor':
                    armors.push(i);
                    break;
                case 'shield':
                    shields.push(i);
                    break;
                case 'illumination':
                    lightItems.push(i);
                    break;
                default:
                    gear.push(i);
                    console.warn("Unknown item type in character data, pushed into gear: " + i.name);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.gifts = gifts;
        actorData.extraCareers = extraCareers;
        actorData.weapons = weapons;
        actorData.armors = armors;
        actorData.shields = shields;
        actorData.lightItems = lightItems;
    }

    _prepareBeastItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const gifts = [];
        const weapons = [];
        const lightItems = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;

            // Switch-case to append the item to the proper list, but also remove the default warning since beasts might end up having misc stuff, even if they're not supposed to
            switch (i.type) {
                case 'item':
                    gear.push(i);
                    break;
                case 'gift':
                    gifts.push(i);
                    break;
                case 'weapon':
                    weapons.push(i);
                    break;
                case 'illumination':
                    lightItems.push(i);
                    break;
                default:
                    gear.push(i);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.gifts = gifts;
        actorData.weapons = weapons;
        actorData.lightItems = lightItems;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });


        // Rollable functions.
        html.find('.roll-order').click(this._onOrderRoll.bind(this));
        html.find('.roll-click').click(this._onRoll.bind(this));
        html.find('.roll-init').click(this._onInitRoll.bind(this));
        html.find('.roll-sprint').click(this._onSprintRoll.bind(this));
        html.find('.roll-item').click(this._onItemRoll.bind(this));
        html.find('.roll-item-change').click(this._onItemChangeStat.bind(this));
        html.find('.roll-soak').click(this._onSoakRoll.bind(this));
        html.find('.roll-defense').click(this._onDefenseRoll.bind(this));
        html.find('.roll-enc-effect').click(this._onEncumbranceChange.bind(this));
        html.find('.roll-damage').click(this._onDamageRoll.bind(this));
        html.find('.roll-effects-reset').click(this._onEffectsReset.bind(this));
        html.find('.roll-effects-add').click(this._onEffectsAdd.bind(this));
        html.find('.roll-effects-delete').click(this._onEffectsDelete.bind(this));

        html.find('.roll-double-info-item').dblclick(this._onItemInfo.bind(this));
        html.find('.roll-double-info-cond').dblclick(this._onConditionInfo.bind(this));

        html.find('.roll-career-dice-change').change(this._onChangeExtraCareerDice.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return await Item.create(itemData, { parent: this.actor });
    }

    /**
     * Handle the final creation of dropped Item data on the Actor
     * @param {object[]|object} itemData Item data for the new item
     * @override
     */
    async _onDropItemCreate(itemData) {
        itemData = itemData instanceof Array ? itemData : [itemData];

        for (let item of itemData) {

            if (this.actor.data.data.processingLists?.statChange) { // Check if the processing list and stat change list even exist
                for (let special of this.actor.data.data.processingLists.statChange) { // Loop through the stat change specials
                    if (checkApplicability(special, item, this.actor)) { // Check if the current special applies
                        for (let i = 0; i < special.changeFrom.length; ++i) { // Go through all the potential changes
                            let nameAdded = false;

                            const reg = new RegExp("(" + special.changeFrom[i] + "|" + makeCompareReady(special.changeFrom[i]) + ")", "gi"); // Prepare the regex
                            if (item.data.useDice) { // Check if the item even has anything in the roll field
                                // Replace the roll field with a case-insensitive regex-replaced version with the from-word changed to to-word, with regex to account both for space and no-space versions
                                item.data.useDice = item.data.useDice.replace(reg, special.changeTo[i]);
                                if (nameAdded === false && special.nameAdditionField) { // If the item's name has not been changed yet and there is anything in the addition field
                                    item.name += " " + special.nameAdditionField; // Append the name
                                    nameAdded = true; // Set the bool to mark that the item's name has been changed already
                                }
                            }

                            if (item.data.attackDice) {
                                item.data.attackDice = item.data.attackDice.replace(reg, special.changeTo[i]);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                            if (item.data.defenseDice) {
                                item.data.defenseDice = item.data.defenseDice.replace(reg, special.changeTo[i]);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                            if (item.data.counterDice) {
                                item.data.counterDice = item.data.counterDice.replace(reg, special.changeTo[i]);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                        }
                    }
                }
            }

            if (this.actor.data.data.processingLists?.diceUpgrade) { // Check if the processing list and dice upgrade list even exist
                for (let special of this.actor.data.data.processingLists.diceUpgrade) { // Loop through the dice upgrade specials
                    if (checkApplicability(special, item, this.actor)) { // Check if the current special applies
                        let nameAdded = false;

                        if (item.data.useDice) { // Check if the item even has anything in the roll field
                            const foo = item.data.useDice.split(";"); // Split the roll field into stats and dice
                            if (foo.length > 1) { // If it has dice
                                let bar = findTotalDice(foo[1]); // Find the total amount of dice in it
                                if (checkDiceArrayEmpty(bar)) { // Assuming any dice were found
                                    item.data.useDice = foo[0] + ";" + reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true); // Replace the roll field with the original stats and a reformed, upgraded dice string
                                    if (nameAdded === false && special.nameAdditionField) { // If the item's name has not been changed yet and there is anything in the addition field
                                        item.name += " " + special.nameAdditionField; // Append the name
                                        nameAdded = true; // Set the bool to mark that the item's name has been changed already
                                    }
                                }
                            }
                        }

                        if (item.data.attackDice) {
                            const foo = item.data.attackDice.split(";");
                            if (foo.length > 1) {
                                let bar = findTotalDice(foo[1]);
                                if (checkDiceArrayEmpty(bar)) {
                                    item.data.attackDice = foo[0] + ";" + reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                    if (nameAdded === false && special.nameAdditionField) {
                                        item.name += " " + special.nameAdditionField;
                                        nameAdded = true;
                                    }
                                }
                            }
                        }
                        if (item.data.defenseDice) {
                            const foo = item.data.defenseDice.split(";");
                            if (foo.length > 1) {
                                let bar = findTotalDice(foo[1]);
                                if (checkDiceArrayEmpty(bar)) {
                                    item.data.defenseDice = foo[0] + ";" + reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                    if (nameAdded === false && special.nameAdditionField) {
                                        item.name += " " + special.nameAdditionField;
                                        nameAdded = true;
                                    }
                                }
                            }
                        }
                        if (item.data.counterDice) {
                            const foo = item.data.counterDice.split(";");
                            if (foo.length > 1) {
                                let bar = findTotalDice(foo[1]);
                                if (checkDiceArrayEmpty(bar)) {
                                    item.data.counterDice = foo[0] + ";" + reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                    if (nameAdded === false && special.nameAdditionField) {
                                        item.name += " " + special.nameAdditionField;
                                        nameAdded = true;
                                    }
                                }
                            }
                        }
                        if (item.data.sparkDie) {
                            let bar = findTotalDice(item.data.sparkDie);
                            if (checkDiceArrayEmpty(bar)) {
                                item.data.sparkDie = reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                        }

                        if (item.data.armorDice) {
                            let bar = findTotalDice(item.data.armorDice);
                            if (checkDiceArrayEmpty(bar)) {
                                item.data.armorDice = reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                        }

                        if (item.data.coverDie) {
                            let bar = findTotalDice(item.data.coverDie);
                            if (checkDiceArrayEmpty(bar)) {
                                item.data.coverDie = reformDiceString(diceFieldUpgrade(bar, special.upgradeStepsNumber), true);
                                if (nameAdded === false && special.nameAdditionField) {
                                    item.name += " " + special.nameAdditionField;
                                    nameAdded = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return this.actor.createEmbeddedDocuments("Item", itemData);
    }


    /**
     * Handle the click event to pop-up
     * @param {Event} event   The originating click event
     * @private
     */
    _onOrderRoll(event) {
        event.preventDefault();

        this.actor.popupSelectRolled();
    }

    /**
     * Handle clickable quickrolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;

        if (dataset.roll) {
            let selected = splitStatString(dataset.roll);
            if (!data.hasOwnProperty("skills")) {
                if (!selected.includes("species") && data.traits.species.skills.some(element => selected.includes(element)))
                    selected.push("species");
                if (!selected.includes("career") && data.traits.career.skills.some(element => selected.includes(element)))
                    selected.push("career");
            }
            if (dataset.tnyes && dataset.tn) {
                if (dataset.extradice) {
                    this.actor.popupSelectRolled({ "tnyes": dataset.tnyes, "tnnum": dataset.tn, "prechecked": selected, "extradice": dataset.extradice });
                }
                else
                    this.actor.popupSelectRolled({ "tnyes": dataset.tnyes, "tnnum": dataset.tn, "prechecked": selected });
            }
            else
                this.actor.popupSelectRolled({ "tnyes": false, "tnnum": 3, "prechecked": selected });
        }
    }

    /**
     * Handle sheet initiative rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async _onInitRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;

        const foo = this.actor.initiativeRoll(0)
        if (await foo) {
            this.render();
        }
    }

    /**
     * Handle sheet Sprint rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onSprintRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;

        this.actor.sprintRoll(0);
    }

    /**
     * Handle the soak roll special case
     * @param {Event} event   The originating click event
     * @private
     */
    _onSoakRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;
        let selected = [];

        if (dataset.roll) {
            selected = splitStatString(dataset.roll);
            if (!data.hasOwnProperty("skills")) {
                if (!selected.includes("species") && data.traits.species.skills.some(element => selected.includes(element)))
                    selected.push("species");
                if (!selected.includes("career") && data.traits.career.skills.some(element => selected.includes(element)))
                    selected.push("career");
            }
        }

        this.actor.popupSoakRoll({ "prechecked": selected, "tnyes": true, "tnnum": 3 });
    }

    /**
     * Handle the defense roll special case
     * @param {Event} event   The originating click event
     * @private
     */
    _onDefenseRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;
        let selected = [];

        if (dataset.roll) {
            selected = splitStatString(dataset.roll);
            if (!data.hasOwnProperty("skills")) {
                if (!selected.includes("species") && data.traits.species.skills.some(element => selected.includes(element)))
                    selected.push("species");
                if (!selected.includes("career") && data.traits.career.skills.some(element => selected.includes(element)))
                    selected.push("career");
            }
        }

        this.actor.popupDefenseRoll({ "prechecked": selected });
    }

    /**
     * Handle applying encumbrance conditions
     * @param {Event} event   The originating click event
     * @private
     */
    _onEncumbranceChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const manageburdened = game.settings.get("ironclaw2e", "manageEncumbranceAuto");

        if (manageburdened) {
            ui.notifications.info(game.i18n.localize("ironclaw2e.ui.encumbranceAutoActive"));
            return;
        }

        let removal = dataset.removals.split(",");
        let addition = dataset.additions.split(",");

        if (dataset.removals.length > 0)
            this.actor.deleteEffect(removal);
        if (dataset.additions.length > 0)
            this.actor.addEffect(addition);
    }

    /**
     * Handle the damage applying command
     * @param {Event} event   The originating click event
     * @private
     */
    _onDamageRoll(event) {
        event.preventDefault();

        this.actor.popupDamage();
    }

    /**
     * Handle the condition reset
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsReset(event) {
        event.preventDefault();

        let confirmed = false;
        let dlog = new Dialog({
            title: game.i18n.localize("ironclaw2e.dialog.statusResetConfirmation.title"),
            content: `
     <form class="ironclaw2e">
      <span>${game.i18n.localize("ironclaw2e.dialog.statusResetConfirmation.note")}</span>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.yes"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.no"),
                    callback: () => confirmed = false
                }
            },
            default: "two",
            render: html => { },
            close: html => {
                if (confirmed) {
                    this.actor.resetEffects();
                }
            }
        });
        dlog.render(true);
    }

    /**
     * Handle the condition applying command
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsAdd(event) {
        event.preventDefault();

        this.actor.popupAddCondition();
    }

    /**
     * Handle the condition deletion
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsDelete(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        this.actor.deleteEffect(dataset.id, true);
    }

    /**
     * Handle the condition deletion
     * @param {Event} event   The originating click event
     * @private
     */
    _onChangeExtraCareerDice(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.item) {
            const item = this.actor.items.get(dataset.item);
            item.update({ "_id": item.id, "data.dice": element.value });
        }
    }

    /**
     * Handle the item roll clicks
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;

        if (dataset.roll && dataset.item) {
            const item = this.actor.items.get(dataset.item);

            switch (parseInt(dataset.roll)) {
                case 0:
                    item.giftRoll();
                    break;
                case 1:
                    item.attackRoll();
                    break;
                case 2:
                    item.defenseRoll();
                    break;
                case 3:
                    item.counterRoll();
                    break;
                case 4:
                    item.sparkRoll();
                    break;
                case 5:
                    this.actor.changeLightSource(item);
                    break;
                default:
                    console.warn("_onItemRoll got an unknown value: " + dataset.roll);
                    break;
            }
        }
    }

    /**
     * Handle the item roll clicks
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemChangeStat(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;

        if (dataset.roll && dataset.item) {
            const item = this.actor.items.get(dataset.item);
            let foobar;

            switch (parseInt(dataset.roll)) {
                case 0:
                    if (!item.data.data.hasOwnProperty("showInBattleStats"))
                        break;
                    foobar = { "_id": item.id, "data.showInBattleStats": !item.data.data.showInBattleStats };
                    break;
                case 1:
                    if (!item.data.data.hasOwnProperty("exhausted"))
                        break;
                    foobar = { "_id": item.id, "data.exhausted": !item.data.data.exhausted };
                    break;
                case 2:
                    if (!item.data.data.hasOwnProperty("worn"))
                        break;
                    foobar = { "_id": item.id, "data.worn": !item.data.data.worn };
                    break;
                case 3:
                    if (!item.data.data.hasOwnProperty("held"))
                        break;
                    foobar = { "_id": item.id, "data.held": !item.data.data.held };
                    break;
                case 4:
                    if (!item.data.data.hasOwnProperty("readied"))
                        break;
                    foobar = { "_id": item.id, "data.readied": !item.data.data.readied };
                    break;
                default:
                    console.warn("_onItemChangeStat got an unknown value: " + dataset.roll);
                    break;
            }

            if (foobar) {
                item.update(foobar);
            }
        }
    }

    /**
     * Handle the double-click info-dump event for items
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemInfo(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;

        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item?.sendInfoToChat();
    }

    /**
     * Handle the double-click info-dump event for conditions
     * @param {Event} event   The originating click event
     * @private
     */
    _onConditionInfo(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const data = this.actor.data.data;

        const li = $(event.currentTarget).parents(".effect");
        const cond = this.actor.getEmbeddedDocument("ActiveEffect", li.data("effectId"));
        if (!cond) return;
        const basecondition = getConditionByNameIronclaw(cond);
        if (!basecondition) return;
        let chatdata;
        const speak = getMacroSpeaker(this.actor);
        if (basecondition?.referenceId) {
            chatdata = { speaker: speak, content: `${basecondition.referenceId}` };
        } else {
            let localname = game.i18n.localize(basecondition.label);
            chatdata = {
                speaker: speak,
                content: `<div class="ironclaw2e"><div class="flexrow flex-left"><img class="item-image" style="max-width:20px" src="${basecondition.icon}" title="${localname}" width="20" height="20"/>
                          <span class="normal-label">${localname}</span></div></div>`
            };
        }

        ChatMessage.applyRollMode(chatdata, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatdata);
    }
}
