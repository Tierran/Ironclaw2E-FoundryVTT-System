import { findTotalDice } from "../helpers.js";
import { makeStatCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { splitStatString } from "../helpers.js";
import { splitStatsAndBonus } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";
import { checkDiceArrayEmpty } from "../helpers.js";
import { CommonSystemInfo } from "../helpers.js";

import { rollTargetNumberOneLine } from "../dicerollers.js";
import { rollHighestOneLine } from "../dicerollers.js";
import { copyToRollTNDialog } from "../dicerollers.js"

/**
 * Extend the basic Item for Ironclaw's systems.
 * @extends {Item}
 */
export class Ironclaw2EItem extends Item {
    /** @override
     * Perform any last data modifications after super.prepareData has finished executing
     */
    prepareData() {
        super.prepareData();

    }

    /** @override
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareDerivedData() {
        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        // Check if the item has the weight attribute, then calculate total weight from it and quantity
        if (data.hasOwnProperty("weight")) {
            data.totalWeight = data.weight * data.quantity;
        }

        if (itemData.type === 'gift') this._prepareGiftData(itemData, actorData);
        if (itemData.type === 'extraCareer') this._prepareCareerData(itemData, actorData);
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
        else if (data.exhaustWhenUsed) {
            data.giftStats = null;
            data.giftArray = null;
            data.canUse = true;
        }
        else {
            data.giftStats = null;
            data.giftArray = null;
            data.canUse = false;
        }
    }

    /**
     * Process Extra Career type specific data
     */
    _prepareCareerData(itemData, actorData) {
        const data = itemData.data;

        if (data.dice.length > 0) {
            data.diceArray = findTotalDice(data.dice);
            data.valid = checkDiceArrayEmpty(data.diceArray);
            data.skills = [makeStatCompareReady(data.careerSkill1), makeStatCompareReady(data.careerSkill2), makeStatCompareReady(data.careerSkill3)];
        } else {
            data.valid = false;
        }
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
        // Effects
        if (data.effect.length > 0) {
            data.effectsSplit = splitStatString(data.effect);
            const foo = data.effectsSplit.findIndex(element => element.includes("damage"));
            if (foo >= 0) {
                const bar = data.effectsSplit.splice(foo, 1);
                if (bar.length > 0) {
                    const damage = parseInt(bar[0].slice(-1));
                    data.damageEffect = isNaN(damage) ? 0 : damage;
                }
            }
            if (data.hasResist) {
                data.resistStats = splitStatString(data.specialResist);
            }
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

    /* -------------------------------------------- */
    /* End of Data Processing                       */
    /* -------------------------------------------- */

    /**
     * Generic function to roll whatever is appropriate for the item
     */
    async roll() {
        // Basic template rendering data
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;

        switch (item.type) {
            case 'gift':
                this.giftRoll();
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
                this.sendInfoToChat();
                break;
        }
    }

    /** 
     *  Send information about the item to the chat as a message
     */
    async sendInfoToChat() {
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;
        const confirmSend = game.settings.get("ironclaw2e", "confirmItemInfo");

        let contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
        <img class="item-image" src="${item.img}" title="${item.name}" width="30" height="30"/>
        <h3 class="chat-header">${item.name}</h3>
        </header>
        <div class="chat-content">`;
        if (itemData.description)
            contents += `<div class="chat-item">${itemData.description}</div>`;

        contents += `<div class="chat-item">`;
        switch (item.type) {
            case 'gift':
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.tags")}:</strong> ${itemData.giftTags}</p>
                        <p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.refresh")}:</strong> ${itemData.refresh}, <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.exhausted")}:</strong> 
                        ${itemData.exhaustWhenUsed ? (itemData.exhausted ? game.i18n.localize("ironclaw2e.yes") : game.i18n.localize("ironclaw2e.no")) : game.i18n.localize("ironclaw2e.never")}</p>`;
                if (itemData.useDice) contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.giftDice")}:</strong> ${itemData.useDice},
                                                   <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.defaultTN")}:</strong> ${itemData.defaultTN}</p>`;
                else contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.giftDiceNothing")}</strong></p>`;
                break;
            case 'extraCareer':
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.name")}:</strong> ${itemData.careerName}</p>
                        <p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.dice")}:</strong> ${itemData.dice}</p>
                        <p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.skills")}:</strong> ${itemData.careerSkill1}, ${itemData.careerSkill2}, ${itemData.careerSkill3}</p>`;
                break;
            case 'weapon':
                if (itemData.hasResist)
                    contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.resistWith")}:</strong> ${itemData.specialResist} vs. 3</p>`;
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.effect")}:</strong> ${itemData.effect}</p>
                        <p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.descriptors")}:</strong> ${itemData.descriptors}</p>
                        <p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.equip")}:</strong> ${itemData.equip}, <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.range")}:</strong> ${itemData.range}</p>`;
                if (itemData.attackDice) contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.attackDice")}:</strong> ${itemData.attackDice}</p>`;
                if (itemData.useSpark) contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.sparkDice")}:</strong> ${itemData.sparkDie}</p>`;
                if (itemData.defenseDice) contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.parryDice")}:</strong> ${itemData.defenseDice}</p>`;
                if (itemData.counterDice) contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.counterDice")}:</strong> ${itemData.counterDice}</p>`;
                break;
            case 'illumination':
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.dimLight")}:</strong> ${itemData.dimLight}, <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.brightLight")}:</strong> ${itemData.brightLight},
                            <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.angle")}:</strong> ${itemData.lightAngle}</p>`;
                break;
            case 'armor':
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.armorDice")}:</strong> ${itemData.armorDice}, 
                            <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.worn")}:</strong> ${itemData.worn ? game.i18n.localize("ironclaw2e.yes") : game.i18n.localize("ironclaw2e.no")}</p>`;
                break;
            case 'shield':
                contents += `<p><strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.coverDie")}:</strong> ${itemData.coverDie}, 
                            <strong>${game.i18n.localize("ironclaw2e.chatInfo.itemInfo.held")}:</strong> ${itemData.held ? game.i18n.localize("ironclaw2e.yes") : game.i18n.localize("ironclaw2e.no")}</p>`;
                break;
            default:
                break;
        }
        contents += `</div></div></div>`;

        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor)
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));

        if (confirmSend) {
            let confirmed = false;
            let dlog = new Dialog({
                title: game.i18n.format("ironclaw2e.dialog.chatInfo.itemInfo.title", { "name": this.data.name }),
                content: `
     <form>
      <h1>${game.i18n.format("ironclaw2e.dialog.chatInfo.itemInfo.header", { "name": this.data.name })}</h1>
     </form>
     `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.send"),
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
                close: html => {
                    if (confirmed) {
                        CONFIG.ChatMessage.documentClass.create(chatData);
                    }
                }
            });
            dlog.render(true);
        } else {
            CONFIG.ChatMessage.documentClass.create(chatData);
        }
    }

    /**
     * After attacking with a weapon, calculate damage from successes and attributes
     * @param {DiceReturn} info The roll information returned by the system dice rollers
     * @param {boolean} ignoreresist Whether to ignore the fact that the weapon has a resist roll, used when such a weapon is used in a counter-attack
     */
    automaticDamageCalculation(info, ignoreresist = false) {
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        if (!info) { // Return out in case the info turns out blank
            return;
        }

        const item = this.data;
        const itemData = item.data;
        if (item.type !== 'weapon') {
            console.warn("A non-weapon type attempted to send Attack Data: " + item.name);
            return;
        }
        if (itemData.effect.length == 0) {
            return; // If the weapon has no effects listed, return out
        }


        if (!info.tnData) { // If the roll info is in highest mode, assume the attack was a counter-attack, and set the flags accordingly
            let updatedata = {
                flags: { "ironclaw2e.hangingAttack": "counter", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor.id, "ironclaw2e.hangingToken": this.actor.token.id }
            };
            info.message.update(updatedata);
            return; // Return out of a counter-attack
        }

        if ((!info.tnData.successes || info.tnData.successes < 1) && (!info.tnData.ties || info.tnData.ties < 1)) {
            return; // Return out of a complete failure, no need to display anything
        }
        const successes = (isNaN(info.tnData.successes) ? 0 : info.tnData.successes);
        const ties = (isNaN(info.tnData.ties) ? 0 : info.tnData.ties);
        const success = successes > 0;
        const usedsuccesses = (success ? successes : ties);

        if (ignoreresist === false && itemData.hasResist && usedsuccesses > 0) { // If the weapon's attack was a successful resist roll, set the flags accordingly and return out
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "resist", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor.id, "ironclaw2e.hangingToken": this.actor.token.id,
                    "ironclaw2e.resistSuccess": success, "ironclaw2e.resistSuccessCount": usedsuccesses
                }
            };
            info.message.update(updatedata);
            return; // Return out of a resisted weapon
        }

        this.successfulAttackToChat(success, usedsuccesses);
    }

    /**
     * Resolve a counter-attack roll by giving it a TN from which to calculate damage
     */
    async resolveCounterAttack(message) {
        let info = await copyToRollTNDialog(message, "ironclaw2e.dialog.counterResolve.title");
        this.automaticDamageCalculation(info, true); // No separate return in case of null, the calculation function itself checks for null
    }

    /**
     * Resolve a resisted attack by giving it the opposition's resist successes, from which it can calculate damage
     */
    async resolveResistedAttack(message) {
        let confirmed = false;
        const success = message.getFlag("ironclaw2e", "resistSuccess");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");

        let resolvedopfor = new Promise((resolve) => {
            let dlog = new Dialog({
                title: game.i18n.localize("ironclaw2e.dialog.resistResolve.title"),
                content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <span class="small-label">${game.i18n.localize("ironclaw2e.dialog.resistResolve.successes")}: ${successes}</span>
      </div>
      <div class="form-group">
       <span class="small-text">${success ? "" : game.i18n.localize("ironclaw2e.dialog.resistResolve.tiedMessage")}</span>
      </div>
      <div class="form-group">
       <label class="normal-label" for="opfor">${game.i18n.localize("ironclaw2e.dialog.resistResolve.opposing")}:</label>
	   <input id="opfor" name="opfor" value="" onfocus="this.select();"></input>
      </div>
     </form>
     `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.resolve"),
                        callback: () => confirmed = true
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                        callback: () => confirmed = false
                    }
                },
                default: "one",
                render: html => { document.getElementById("opfor").focus(); },
                close: html => {
                    if (confirmed) {
                        let OPFOR = html.find('[name=opfor]')[0].value;
                        let opposing = 0; if (OPFOR.length > 0) opposing = parseInt(OPFOR);
                        resolve(opposing);
                    } else {
                        resolve(null);
                    }
                }
            });
            dlog.render(true);
        });
        let opposingsuccesses = await resolvedopfor;
        if (opposingsuccesses === null) return; // Return out if the user just cancels the prompt

        if (successes > opposingsuccesses) {
            this.successfulAttackToChat(true, successes - opposingsuccesses);
        }
        else {
            this.failedAttackToChat();
        }
    }

    /**
     * Resolve a resisted attack as if it were just an ordinary attack roll, in case it was countered and turned into one
     */
    resolveAsNormalAttack(message) {
        const success = message.getFlag("ironclaw2e", "resistSuccess");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
        this.successfulAttackToChat(success, successes);
    }

    /**
     * Send the attack damage to chat, calculating damage based on the given successes
     * @param {boolean} success Whether the attack was a success, or a tie
     * @param {number} usedsuccesses The number of successes, or ties in case the attack was a tie
     */
    successfulAttackToChat(success, usedsuccesses) {
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        const item = this.data;
        const itemData = item.data;

        let contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
        <img class="item-image" src="${item.img}" title="${item.name}" width="25" height="25"/>
        <h3 class="chat-header-lesser">${game.i18n.format("ironclaw2e.chatInfo.damageCalcInfo.header", { "name": item.name })}</h3>
        </header>
        <div class="chat-content"><div class="chat-item">`;

        if (success) {
            contents += `<p style="color:${CommonSystemInfo.resultColors.success}">${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.attackSuccess")}:</p>`;
        } else {
            contents += `<p style="color:${CommonSystemInfo.resultColors.tie}">${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.attackTied")}:</p>`;
        }

        if (itemData.effectsSplit.includes("slaying")) {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.slayingDamage")}: <strong>${itemData.damageEffect + (usedsuccesses * 2)}</strong></p>`;
        } else if (itemData.effectsSplit.includes("critical")) {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.criticalDamage")}: <strong>${itemData.damageEffect + Math.floor(usedsuccesses * 1.5)}</strong></p>`;
        } else {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.normalDamage")}: <strong>${itemData.damageEffect + usedsuccesses}</strong></p>`;
        }
        if (itemData.effectsSplit.includes("impaling")) {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.impalingDamage")}: <strong>${itemData.damageEffect + (usedsuccesses * 2)}</strong>, ${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.impalingNote")}</p>`;
        }

        if (itemData.effectsSplit.includes("penetrating")) {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.penetratingAttack")}</p>`;
        }
        if (itemData.effectsSplit.includes("weak")) {
            contents += `<p>${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.weakAttack")}</p>`;
        }
        contents += `<p class="small-text">${game.i18n.localize("ironclaw2e.chatInfo.damageCalcInfo.allEffects")}: ${itemData.effect}</p>`;

        contents += `</div></div></div>`;
        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor)
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatData);
    }

    /**
     * Send a message to chat simply to report that the attack failed
     */
    failedAttackToChat() { // This function is mostly used for resist rolls to specifically note if the resistance check failed for the attacker
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        const item = this.data;
        const itemData = item.data;

        let contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
        <img class="item-image" src="${item.img}" title="${item.name}" width="25" height="25"/>
        <h3 class="chat-header-lesser">${game.i18n.format("ironclaw2e.chatInfo.damageCalcInfo.header", { "name": item.name })}</h3>
        </header>
        <div class="chat-content"><div class="chat-item">`;

        if (itemData.hasResist) {
            contents += `<p style="color:${CommonSystemInfo.resultColors.failure}">Attack was resisted completely!</p>`;
        } else {
            contents += `<p style="color:${CommonSystemInfo.resultColors.failure}">Attack did not hit at all!</p>`;
        }

        contents += `</div></div></div>`;
        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor)
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatData);
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
        if (data.exhaustWhenUsed == false || data.exhausted == false) {
            if (data.giftStats || data.giftArray)
                this.genericItemRoll(data.giftStats, data.defaultTN, itemData.name, data.giftArray, 0, (data.exhaustWhenUsed ? (x => theitem.update({ "data.exhausted": true })) : null));
            else if (data.exhaustWhenUsed) // Check just in case, even though there should never be a situation where canUse is set, but neither rollable stats / dice nor exhaustWhenUsed aren't
                this.popupExhaustGift();
        }
        else if (data.exhaustWhenUsed == true && data.exhausted == true) {
            this.popupRefreshGift();
        }
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

        this.genericItemRoll(data.attackStats, 3, itemData.name, data.attackArray, 2, (x => { this.automaticDamageCalculation(x); }));
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

        this.genericItemRoll(data.counterStats, -1, itemData.name, data.counterArray, 3, (x => { this.automaticDamageCalculation(x); }));
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

        rollHighestOneLine(data.sparkDie, game.i18n.localize("ironclaw2e.dialog.sparkRoll.label"), "ironclaw2e.dialog.sparkRoll.title", this.actor);
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
                    this.actor.popupSelectRolled(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.giftRoll") + (this.data.data.exhaustWhenUsed ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.gift") + " <strong>" + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.exhausted") + "</strong>" : ": "), callback);
                    break;
                case 1: // Parry roll
                    this.actor.popupDefenseRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.parryRoll") + ": ", true, callback);
                    break;
                case 2: // Attack roll
                    this.actor.popupAttackRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.attackRoll") + (this.data.data.effect ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.effect") + ": " + this.data.data.effect + (this.data.data.hasResist ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.resistWith") + " " + this.data.data.specialResist + " vs. 3 " : "") : ": "), callback);
                    break;
                case 3: // Counter roll
                    this.actor.popupCounterRoll(stats, tnyes, usedtn, "", formconstruction, (usesmoredice ? [diceid] : null), (usesmoredice ? [dicearray] : null), this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.counterRoll") + (this.data.data.effect ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.effect") + ": " + this.data.data.effect : ": "), callback);
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
            title: game.i18n.format("ironclaw2e.dialog.refreshGift.title", { "name": speaker.alias }),
            content: `
     <form>
      <h1>${game.i18n.format("ironclaw2e.dialog.refreshGift.header", { "item": this.data.name, "actor": this.actor?.data.name })}</h1>
     <div class="form-group">
       <label class="normal-label">Send to chat?</label>
       <input type="checkbox" id="send" name="send" value="1" checked></input>
     </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.refresh"),
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
            close: html => {
                if (confirmed) {
                    this.update({ "data.exhausted": false });
                    let SEND = html.find('[name=send]');
                    let sent = SEND.length > 0 ? SEND[0].checked : false;

                    if (sent) {
                        let contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
        <img class="item-image" src="${item.img}" title="${item.name}" width="20" height="20"/>
        <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.refreshGift.chatMessage", { "name": item.name })}</div>
        </header>
        </div>`;
                        let chatData = {
                            "content": contents,
                            "speaker": speaker
                        };
                        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
                        CONFIG.ChatMessage.documentClass.create(chatData);
                    }
                }
            }
        });
        dlog.render(true);
    }

    popupExhaustGift() {
        if (this.data.type != "gift")
            return console.warn("Tried to exhaust a non-gift item: " + this);

        const item = this.data;
        const itemData = item.data;

        let confirmed = false;
        let speaker = getMacroSpeaker(this.actor);
        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.exhaustGift.title", { "name": speaker.alias }),
            content: `
     <form>
      <h1>${game.i18n.format("ironclaw2e.dialog.exhaustGift.header", { "item": this.data.name, "actor": this.actor?.data.name })}</h1>
     <div class="form-group">
       <label class="normal-label">Send to chat?</label>
       <input type="checkbox" id="send" name="send" value="1" checked></input>
     </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.exhaust"),
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
            close: html => {
                if (confirmed) {
                    this.update({ "data.exhausted": true });
                    let SEND = html.find('[name=send]');
                    let sent = SEND.length > 0 ? SEND[0].checked : false;

                    if (sent) {
                        let contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
        <img class="item-image" src="${item.img}" title="${item.name}" width="20" height="20"/>
        <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.exhaustGift.chatMessage", { "name": item.name })}</div>
        </header>
        </div>`;
                        let chatData = {
                            "content": contents,
                            "speaker": speaker
                        };
                        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
                        CONFIG.ChatMessage.documentClass.create(chatData);
                    }
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

        let first = null;
        let constructionstring = `<div class="form-group">
	   <div class="form-group">`;

        if (itemData.canAttack) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.dialog.weaponRoll.attack")}:</label>
	    <input type="radio" id="attack" name="weapon" value="0" ${first ? "" : "checked"}></input>`;
            first = first || "attack";
        }
        if (itemData.canSpark) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.dialog.weaponRoll.spark")}:</label>
	    <input type="radio" id="spark" name="weapon" value="1" ${first ? "" : "checked"}></input>`;
            first = first || "spark";
        }
        if (itemData.canDefend) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.dialog.weaponRoll.parry")}:</label>
	    <input type="radio" id="defend" name="weapon" value="2" ${first ? "" : "checked"}></input>`;
            first = first || "defend";
        }
        if (itemData.canCounter) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.dialog.weaponRoll.counter")}:</label>
	    <input type="radio" id="counter" name="weapon" value="3" ${first ? "" : "checked"}></input>`;
            first = first || "counter";
        }

        constructionstring += `
	   </div>
      </div>`;

        let confirmed = false;
        let speaker = getMacroSpeaker(this.actor);
        let dlog = new Dialog({
            title: game.i18n.format("ironclaw2e.dialog.weaponRoll.title", { "name": speaker.alias }),
            content: `
     <form>
      <h1>${game.i18n.format("ironclaw2e.dialog.weaponRoll.header", { "item": this.data.name, "actor": this.actor?.data.name })}</h1>
      ${constructionstring}
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.pick"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById(first).focus(); },
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
