import { findTotalDice } from "../helpers.js";
import { makeStatCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { splitStatsAndBonus } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";

import { rollTargetNumberOneLine } from "../dicerollers.js";
import { rollHighestOneLine } from "../dicerollers.js";

/**
 * Extend the basic Item for Ironclaw's systems.
 * @extends {Item}
 */
export class Ironclaw2EItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        // Check if the item has the weight attribute, then calculate total weight from it and quantity
        if (data.hasOwnProperty("weight")) {
            data.totalWeight = data.weight * data.quantity;
        }

        if (itemData.type === 'gift') this._prepareGiftData(itemData, actorData);
        if (itemData.type === 'weapon') this._prepareWeaponData(itemData, actorData);
        if (itemData.type === 'armor') this._prepareArmorData(itemData, actorData);
        if (itemData.type === 'shield') this._prepareShieldData(itemData, actorData);
        if (itemData.type === 'illumination') this._prepareIlluminationData(itemData, actorData);
    }

    /**
     * Process Gift type specific data
     */
    _prepareGiftData(itemData, actorData) {
        const data = itemData.data;

        if (data.useDice.length > 0) {
            let firstsplit = splitStatsAndBonus(data.useDice);
            data.giftStats = firstsplit[0];
            data.giftArray = (firstsplit[1].length > 0 ? findTotalDice(firstsplit[1]) : null);
            data.canUse = true;
        }
        else {
            data.giftStats = null;
            data.giftArray = null;
            data.canUse = false;
        }

        // Extra Career support
        /*
        if (!data.refresh || data.refresh.length == 0 || makeStatCompareReady(data.refresh) == "none") {
            data.hasRefresh = false;
        } else {
            data.hasRefresh = true;
        }*/
    }

    /**
     * Process Weapon type specific data
     */
    _prepareWeaponData(itemData, actorData) {
        const data = itemData.data;

        // Attack
        if (data.attackDice.length > 0) {
            let attacksplit = splitStatsAndBonus(data.attackDice);
            data.attackStats = attacksplit[0];
            data.attackArray = (attacksplit[1].length > 0 ? findTotalDice(attacksplit[1]) : null);
            data.canAttack = true;
        }
        else {
            data.attackStats = null;
            data.attackArray = null;
            data.canAttack = false;
        }
        // Defense
        if (data.defenseDice.length > 0) {
            let defensesplit = splitStatsAndBonus(data.defenseDice);
            data.defenseStats = defensesplit[0];
            data.defenseArray = (defensesplit[1].length > 0 ? findTotalDice(defensesplit[1]) : null);
            data.canDefend = true;
        }
        else {
            data.defenseStats = null;
            data.defenseArray = null;
            data.canDefend = false;
        }
        // Counter
        if (data.counterDice.length > 0) {
            let countersplit = splitStatsAndBonus(data.counterDice);
            data.counterStats = countersplit[0];
            data.counterArray = (countersplit[1].length > 0 ? findTotalDice(countersplit[1]) : null);
            data.canCounter = true;
        }
        else {
            data.counterStats = null;
            data.counterArray = null;
            data.canCounter = false;
        }
        // Spark
        if (data.useSpark && data.sparkDie.length > 0) {
            data.sparkArray = findTotalDice(data.sparkDie);
            data.canSpark = true;
        }
        else {
            data.sparkArray = null;
            data.canSpark = false;
        }
    }

    /**
     * Process Armor type specific data
     */
    _prepareArmorData(itemData, actorData) {
        const data = itemData.data;

        // Armor
        if (data.armorDice.length > 0) {
            data.armorArray = findTotalDice(data.armorDice);
        }
    }

    /**
     * Process Shield type specific data
     */
    _prepareShieldData(itemData, actorData) {
        const data = itemData.data;

        // Shield
        if (data.coverDie.length > 0) {
            data.coverArray = findTotalDice(data.coverDie);
        }
    }

    /**
     * Process Light Source type specific data
     */
    _prepareIlluminationData(itemData, actorData) {
        const data = itemData.data;
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     */
    async roll() {
        // Basic template rendering data
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;

        switch (item.type) {
            case 'gift':
                if (itemData.exhaustWhenUsed && itemData.exhausted) {
                    this.popupRefreshGift();
                } else {
                    this.giftRoll();
                }
                break;
            case 'weapon':
                let rolls = [];
                if (itemData.canAttack) rolls.push(0);
                if (itemData.canSpark) rolls.push(1);
                if (itemData.canDefend) rolls.push(2);
                if (itemData.canCounter) rolls.push(3);

                if (rolls.length == 1) {
                    this._itemRollSelection(rolls[0]);
                } else {
                    this.popupWeaponRollType();
                }
                break;
            case 'illumination':
                if (this.actor) {
                    this.actor.changeLightSource(this);
                }
                break;
            case 'armor':
                this.update({ "data.worn": !itemData.worn });
                break;
            case 'shield':
                this.update({ "data.held": !itemData.held });
                break;
            default:
                break;
        }
        /**
        let roll = new Roll('d20+@abilities.str.mod', actorData);
        let label = `Rolling ${item.name}`;
        roll.roll().toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label
        });
        */
    }

    async sendInfoToChat() {
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;
        const confirmSend = game.settings.get("ironclaw2e", "confirmItemInfo");

        let chatData = {};
        switch (item.type) {
            case 'gift':
                chatData = {
                    content:
                        `<div style="font-size:10px">Description: ${itemData.description}</div>
                        <p>Tags: ${itemData.giftTags}</p>
                        <p>Refresh: ${itemData.refresh}, Exhausted: ${itemData.exhausted ? "Yes" : "No"}
                        <p>Gift dice: ${itemData.useDice}, Default TN: ${itemData.defaultTN}`
                };
                break;
            case 'weapon':
                chatData = {
                    content:
                        `<div style="font-size:10px">Description: ${itemData.description}</div>
                        <p>Effect: ${itemData.effect}</p>
                        <p>Descriptors: ${itemData.descriptors}</p>
                        <p>Equip: ${itemData.equip}, Range: ${itemData.range}</p>`
                };
                break;
            case 'illumination':
                chatData = {
                    content:
                        `<div style="font-size:10px">Description: ${itemData.description}</div>
                        <p>Dim Light: ${itemData.dimLight}, Bright Light: ${itemData.brightLight}, Angle: ${itemData.lightAngle}</p>`
                };
                break;
            case 'armor':
                chatData = { content: `<div style="font-size:10px">Description: ${itemData.description}</div><p>Armor Dice: ${itemData.armorDice}, Worn: ${itemData.worn ? "Yes" : "No"}</p>` };
                break;
            case 'shield':
                chatData = { content: `<div style="font-size:10px">Description: ${itemData.description}</div><p>Cover Die: ${itemData.coverDie}, Held: ${itemData.held ? "Yes" : "No"}</p>` };
                break;
            default:
                chatData = {
                    content: `<div style="font-size:10px">Description: ${itemData.description}</div>`
                };
                break;
        }

        chatData = mergeObject(chatData, { speaker: getMacroSpeaker(this.actor) });

        if (confirmSend) {
            let confirmed = false;
            let dlog = new Dialog({
                title: "Send item info for " + this.data.name,
                content: `
     <form>
      <h1>Send ${this.data.name} info to chat?</h1>
     </form>
     `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Send",
                        callback: () => confirmed = true
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => confirmed = false
                    }
                },
                default: "one",
                render: html => { },
                close: html => {
                    if (confirmed) {
                        CONFIG.ChatMessage.entityClass.create(chatData);
                    }
                }
            });
            dlog.render(true);
        } else {
            CONFIG.ChatMessage.entityClass.create(chatData);
        }
    }

    /* -------------------------------------------- */
    /*  Item Type Specific Rolls                    */
    /* -------------------------------------------- */

    // Gift Rolls

    giftRoll() {
        const theitem = this;
        const itemData = this.data;
        const data = itemData.data;

        if (!(itemData.type === 'gift')) {
            console.warn("Gift roll attempted on a non-gift item: " + itemData.name);
            return;
        }

        if (data.canUse == false) {
            return;
        }
        if (data.exhaustWhenUsed == false || data.exhausted == false)
            this.genericItemRoll(data.giftStats, data.defaultTN, itemData.name, data.giftArray, 0, (data.exhaustWhenUsed ? (x => theitem.update({ "data.exhausted": true })) : null));
        else if (data.exhaustWhenUsed == true && data.exhausted == true)
            ui.notifications.info("Gift " + itemData.name + " is exhausted and cannot be used.");
    }

    // Weapon Rolls

    /**
     * Select the correct weapon roll funtion to call based on the received integer
     * @param {number} selection
     * @private
     */
    _itemRollSelection(selection) {
        switch (selection) {
            case 0:
                this.attackRoll();
                break;
            case 1:
                this.sparkRoll();
                break;
            case 2:
                this.defenseRoll();
                break;
            case 3:
                this.counterRoll();
                break;
            default:
                console.warn("Defaulted weapon roll type: " + this);
                break;
        }
    }

    attackRoll() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.warn("Attack roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canAttack == false) {
            return;
        }

        this.genericItemRoll(data.attackStats, 3, itemData.name, data.attackArray, 2);
    }

    defenseRoll() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.warn("Defense roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canDefend == false) {
            return;
        }

        this.genericItemRoll(data.defenseStats, -1, itemData.name, data.defenseArray, 1);
    }

    counterRoll() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.warn("Counter roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canCounter == false) {
            return;
        }

        this.genericItemRoll(data.counterStats, -1, itemData.name, data.counterArray, 3);
    }

    sparkRoll() {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.warn("Spark roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canSpark == false) {
            return;
        }

        rollHighestOneLine(data.sparkDie, "Rolling Spark die...", this.actor);
    }

    /**
     * Common function to process roll data and send it to the actor's popup roll function
     * @param {string[]} stats Skills to autocheck on the dialog
     * @param {number} tn Target number of the roll, -1 if highest
     * @param {string} diceid What to name the item dice
     * @param {number[]} dicearray The dice array of the item being rolled
     * @param {number} rolltype What type of popup function to use for the roll, mostly to allow automatic use gifts through special case hacks
     * @param {Function} callback The function to execute after the dice are rolled
     */
    genericItemRoll(stats, tn, diceid, dicearray, rolltype = 0, callback = null) {
        let tnyes = (tn > 0);
        let usedtn = (tn > 0 ? tn : 3);
        if (this.actor) {
            let formconstruction = ``;
            let usesmoredice = false;
            if (Array.isArray(dicearray)) {
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${diceid}: ${reformDiceString(dicearray, true)}</label>
	             <input type="checkbox" id="${makeStatCompareReady(diceid)}" name="${makeStatCompareReady(diceid)}" value="${makeStatCompareReady(diceid)}" checked></input>
                </div>`+ "\n";
                usesmoredice = true;
            }

            switch (rolltype) {
                case 0: // Generic gift roll
                    this.actor.popupSelectRolled(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " gift roll: ", callback);
                    break;
                case 1: // Parry roll
                    this.actor.popupDefenseRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " parry roll: ", true, callback);
                    break;
                case 2: // Attack roll
                    this.actor.popupAttackRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " attack roll" + (this.data.data.effect ? ", Effect: " + this.data.data.effect : ": "), callback);
                    break;
                case 3: // Counter roll
                    this.actor.popupCounterRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " counter roll" + (this.data.data.effect ? ", Effect: " + this.data.data.effect : ": "), callback);
                    break;
                default:
                    console.warn("genericItemRoll defaulted when selecting a roll: " + rolltype);
                    this.actor.popupSelectRolled(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), "", callback);
                    break;
            }

        }
        else {
            // For GM tests on items without actors
            if (tnyes)
                rollTargetNumberOneLine(usedtn, reformDiceString(dicearray));
            else
                rollHighestOneLine(reformDiceString(dicearray));
        }
    }

    /* -------------------------------------------- */
    /*  Item Popup Functions                        */
    /* -------------------------------------------- */

    popupRefreshGift() {
        if (this.data.type != "gift")
            return console.warn("Tried to refresh a non-gift item: " + this);

        const item = this.data;
        const itemData = item.data;

        let confirmed = false;
        let speaker = getMacroSpeaker(this.actor);
        let dlog = new Dialog({
            title: "Refresh Gift for " + speaker.alias,
            content: `
     <form>
      <h1>Refresh ${this.data.name} for ${this.actor?.data.name}?</h1>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Refresh",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { },
            close: html => {
                if (confirmed) {
                    this.update({ "data.exhausted": !itemData.exhausted });
                }
            }
        });
        dlog.render(true);
    }

    popupWeaponRollType() {
        if (this.data.type != "weapon")
            return console.warn("Tried to popup a weapon roll question a non-weapon item: " + this);

        const item = this.data;
        const itemData = item.data;

        let first = true;
        let constructionstring = `<div class="form-group">
	   <div class="form-group">`;

        if (itemData.canAttack) {
            constructionstring += `<label>Attack:</label>
	    <input type="radio" id="attack" name="weapon" value="0" ${first ? "checked" : ""}></input>`;
            first = false;
        }
        if (itemData.canSpark) {
            constructionstring += `<label>Spark:</label>
	    <input type="radio" id="spark" name="weapon" value="1" ${first ? "checked" : ""}></input>`;
            first = false;
        }
        if (itemData.canDefend) {
            constructionstring += `<label>Defend:</label>
	    <input type="radio" id="defend" name="weapon" value="2" ${first ? "checked" : ""}></input>`;
            first = false;
        }
        if (itemData.canCounter) {
            constructionstring += `<label>Counter:</label>
	    <input type="radio" id="counter" name="weapon" value="3" ${first ? "checked" : ""}></input>`;
            first = false;
        }

        constructionstring += `
	   </div>
      </div>`;

        let confirmed = false;
        let speaker = getMacroSpeaker(this.actor);
        let dlog = new Dialog({
            title: "Weapon Roll Type for " + speaker.alias,
            content: `
     <form>
      <h1>Choose ${this.data.name}'s roll type for ${this.actor?.data.name}</h1>
      ${constructionstring}
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Pick",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { },
            close: html => {
                if (confirmed) {
                    let typestring = html.find('input[name=weapon]:checked')[0].value;
                    let rolltype = 0; if (typestring.length != 0) rolltype = parseInt(typestring);
                    if (Number.isInteger(rolltype)) {
                        this._itemRollSelection(rolltype);
                    }
                }
            }
        });
        dlog.render(true);
    }
}
