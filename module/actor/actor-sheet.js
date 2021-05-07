import { rollNormal } from "../dicerollers.js";
import { rollOpposed } from "../dicerollers.js";
import { rollNormalDialog } from "../dicerollers.js";
import { rollOpposedDialog } from "../dicerollers.js";
import { splitStatString } from "../helpers.js";

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
            height: 640,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];

        // Prepare items.
        if (this.actor.data.type == 'character') {
            this._prepareCharacterItems(data);
        }
        if (this.actor.data.type == 'mook') {
            this._prepareCharacterItems(data);
        }
        if (this.actor.data.type == 'beast') {
            this._prepareBeastItems(data);
        }

        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
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
        const weapons = [];
        const armors = [];
        const shields = [];
        const lightItems = [];

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
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
                    gear.push(i);
                    break;
                default:
                    gear.push(i);
                    console.warn("Unknown item type in character data, pushed into gear: " + i);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.gifts = gifts;
        actorData.weapons = weapons;
        actorData.armors = armors;
        actorData.shields = shields;
    }

    _prepareBeastItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const gifts = [];
        const weapons = [];

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
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
                default:
                    gear.push(i);
                    break;
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.gifts = gifts;
        actorData.weapons = weapons;
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
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Rollable functions.
        html.find('.roll-order').click(this._onOrderRoll.bind(this));
        html.find('.roll-click').click(this._onRoll.bind(this));
        html.find('.roll-item').click(this._onItemRoll.bind(this));
        html.find('.roll-item-change').click(this._onItemChangeStat.bind(this));
        html.find('.roll-soak').click(this._onSoakRoll.bind(this));
        html.find('.roll-defense').click(this._onDefenseRoll.bind(this));
        html.find('.roll-damage').click(this._onDamageRoll.bind(this));
        html.find('.roll-effects-reset').click(this._onEffectsReset.bind(this));
        html.find('.roll-effects-add').click(this._onEffectsAdd.bind(this));
        html.find('.roll-effects-delete').click(this._onEffectsDelete.bind(this));

        // Drag events for macros.
        if (this.actor.owner) {
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
    _onItemCreate(event) {
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
        return this.actor.createOwnedItem(itemData);
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
                    this.actor.popupSelectRolled(selected, dataset.tnyes, dataset.tn, dataset.extradice);
                }
                else
                    this.actor.popupSelectRolled(selected, dataset.tnyes, dataset.tn);
            }
            else
                this.actor.popupSelectRolled(selected);
        }
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

        this.actor.popupSoakRoll(selected, true, 3);
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

        this.actor.popupDefenseRoll(selected, false);
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
     * Handle the damage applying command
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsReset(event) {
        event.preventDefault();

        let confirmed = false;
        let dlog = new Dialog({
            title: "Confirmation Box",
            content: `
     <form class="ironclaw2e">
      <span>Are you sure you want to reset all status effects?</span>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Yes",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "No",
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
     * Handle the damage applying command
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsAdd(event) {
        event.preventDefault();

        this.actor.popupAddCondition();
    }

    /**
     * Handle the damage applying command
     * @param {Event} event   The originating click event
     * @private
     */
    _onEffectsDelete(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        this.actor.deleteEffect(dataset.id);
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
            const item = this.actor.getOwnedItem(dataset.item);

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
            const item = this.actor.getOwnedItem(dataset.item);
            let foobar;

            switch (parseInt(dataset.roll)) {
                case 0:
                    if (!item.data.data.hasOwnProperty("showInBattleStats"))
                        break;
                    foobar = { "_id": item._id, "data.showInBattleStats": !item.data.data.showInBattleStats };
                    break;
                case 1:
                    if (!item.data.data.hasOwnProperty("exhausted"))
                        break;
                    foobar = { "_id": item._id, "data.exhausted": !item.data.data.exhausted };
                    break;
                case 2:
                    if (!item.data.data.hasOwnProperty("worn"))
                        break;
                    foobar = { "_id": item._id, "data.worn": !item.data.data.worn };
                    break;
                case 3:
                    if (!item.data.data.hasOwnProperty("held"))
                        break;
                    foobar = { "_id": item._id, "data.held": !item.data.data.held };
                    break;
                default:
                    console.warn("_onItemChangeStat got an unknown value: " + dataset.roll);
                    break;
            }

            if (foobar) {
                this.actor.updateOwnedItem(foobar);
            }
        }
    }
}