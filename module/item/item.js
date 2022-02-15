import { findActorToken, findInItems, findTotalDice } from "../helpers.js";
import { parseSingleDiceString } from "../helpers.js";
import { makeCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { splitStatString } from "../helpers.js";
import { splitStatsAndBonus } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";
import { checkDiceArrayEmpty } from "../helpers.js";
import { checkQuickModifierKey } from "../helpers.js";

import { checkStandardDefense, CommonSystemInfo } from "../systeminfo.js";
import { getSpecialOptionPrototype } from "../systeminfo.js";

import { CommonConditionInfo } from "../conditions.js"

import { CardinalDiceRoller, rollTargetNumberOneLine } from "../dicerollers.js";
import { rollHighestOneLine } from "../dicerollers.js";
import { copyToRollTNDialog } from "../dicerollers.js";
import { Ironclaw2EActor } from "../actor/actor.js";

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

        // Check if the item has the weight attribute, then use it and quantity to calculate total weight
        if (data.hasOwnProperty("weight")) {
            let usedWeight = 0;
            if (typeof (data.weight) !== "string") { // Both to ensure that the .includes doesn't fail and for legacy compatability
                usedWeight = data.weight;
            } else if (data.weight.includes("/")) {
                const foobar = data.weight.split("/");
                if (foobar.length > 1) {
                    const foo = parseInt(foobar[0]);
                    const bar = parseInt(foobar[1]);
                    if (!isNaN(foo) && !isNaN(bar) && bar != 0) {
                        usedWeight = foo / bar;
                    } else {
                        ui.notifications.warn(game.i18n.format("ironclaw2e.ui.itemWeightParseError", { "item": itemData.name, "weight": data.weight }));
                    }
                } else {
                    ui.notifications.warn(game.i18n.format("ironclaw2e.ui.itemWeightParseError", { "item": itemData.name, "weight": data.weight }));
                }
            } else {
                const foobar = parseFloat(data.weight);
                if (!isNaN(foobar)) {
                    usedWeight = foobar;
                } else {
                    ui.notifications.warn(game.i18n.format("ironclaw2e.ui.itemWeightParseError", { "item": itemData.name, "weight": data.weight }));
                }
            }

            data.totalWeight = usedWeight * data.quantity;
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
        // Dice
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
        // Tags
        if (data.giftTags.length > 0) {
            data.giftTagsSplit = splitStatString(data.giftTags);
        }
        // Skill Mark
        if (data.grantsMark) {
            data.skillName = makeCompareReady(data.markSkill);
        }

        // Special settings
        if (data.specialSettings?.length > 0) {
            // If special settings exist, make a new array where the actual processed version of the special settings exist
            // This helps prevent data corruption
            data.usedSpecialSettings = [];

            for (let i = 0; i < data.specialSettings.length; ++i) {
                // Clone the object in the stored array into the actually used array
                data.usedSpecialSettings.push({ ...data.specialSettings[i] });

                data.usedSpecialSettings[i].giftName = itemData.name;
                data.usedSpecialSettings[i].giftId = itemData._id;
                data.usedSpecialSettings[i].settingIndex = i;

                // Applicability settings
                // Self settings
                if (data.usedSpecialSettings[i].typeField) {
                    data.usedSpecialSettings[i].typeArray = splitStatString(data.usedSpecialSettings[i].typeField);
                }

                if (data.usedSpecialSettings[i].nameField) {
                    data.usedSpecialSettings[i].nameArray = splitStatString(data.usedSpecialSettings[i].nameField, false);
                    data.usedSpecialSettings[i].nameArray.forEach((val, index) => data.usedSpecialSettings[i].nameArray[index] = val.toLowerCase());
                }

                if (data.usedSpecialSettings[i].tagField) {
                    data.usedSpecialSettings[i].tagArray = splitStatString(data.usedSpecialSettings[i].tagField);
                }

                if (data.usedSpecialSettings[i].descriptorField) {
                    data.usedSpecialSettings[i].descriptorArray = splitStatString(data.usedSpecialSettings[i].descriptorField);
                }

                if (data.usedSpecialSettings[i].effectField) {
                    data.usedSpecialSettings[i].effectArray = splitStatString(data.usedSpecialSettings[i].effectField);
                }

                if (data.usedSpecialSettings[i].statField) {
                    data.usedSpecialSettings[i].statArray = splitStatString(data.usedSpecialSettings[i].statField);
                }

                if (data.usedSpecialSettings[i].conditionField) {
                    data.usedSpecialSettings[i].conditionArray = splitStatString(data.usedSpecialSettings[i].conditionField);
                }

                if (data.usedSpecialSettings[i].equipField) {
                    data.usedSpecialSettings[i].equipArray = splitStatString(data.usedSpecialSettings[i].equipField);
                }

                if (data.usedSpecialSettings[i].rangeField) {
                    data.usedSpecialSettings[i].rangeArray = splitStatString(data.usedSpecialSettings[i].rangeField);
                }

                if (data.usedSpecialSettings[i].otherOwnedItemField) {
                    data.usedSpecialSettings[i].otherOwnedItemArray = splitStatString(data.usedSpecialSettings[i].otherOwnedItemField);
                }

                // Other settings
                if (data.usedSpecialSettings[i].nameOtherField) {
                    data.usedSpecialSettings[i].nameOtherArray = splitStatString(data.usedSpecialSettings[i].nameOtherField, false);
                    data.usedSpecialSettings[i].nameOtherArray.forEach((val, index) => data.usedSpecialSettings[i].nameOtherArray[index] = val.toLowerCase());
                }

                if (data.usedSpecialSettings[i].descriptorOtherField) {
                    data.usedSpecialSettings[i].descriptorOtherArray = splitStatString(data.usedSpecialSettings[i].descriptorOtherField);
                }

                if (data.usedSpecialSettings[i].effectOtherField) {
                    data.usedSpecialSettings[i].effectOtherArray = splitStatString(data.usedSpecialSettings[i].effectOtherField);
                }

                if (data.usedSpecialSettings[i].statOtherField) {
                    data.usedSpecialSettings[i].statOtherArray = splitStatString(data.usedSpecialSettings[i].statOtherField);
                }

                if (data.usedSpecialSettings[i].equipOtherField) {
                    data.usedSpecialSettings[i].equipOtherArray = splitStatString(data.usedSpecialSettings[i].equipOtherField);
                }

                if (data.usedSpecialSettings[i].rangeOtherField) {
                    data.usedSpecialSettings[i].rangeOtherArray = splitStatString(data.usedSpecialSettings[i].rangeOtherField);
                }

                // Gift Exhaust check
                if (data.usedSpecialSettings[i].worksWhenState === false) {
                    // If the gift does not exhaust when used, or it is _not_ exhausted, set the stored refreshedState as true, otherwise it is false
                    data.usedSpecialSettings[i].refreshedState = (data.exhaustWhenUsed === false || !data.exhausted);
                }

                // Effect settings
                if (data.usedSpecialSettings[i].bonusSourcesField) {
                    data.usedSpecialSettings[i].bonusSources = splitStatString(data.usedSpecialSettings[i].bonusSourcesField);
                }

                if (!data.usedSpecialSettings[i].hasOwnProperty("bonusStatsField") || data.usedSpecialSettings[i].bonusStatsField === "-") {
                    // If the stat field doesn't exist or is just a dash, interpret that as skipping the field
                } else if (data.usedSpecialSettings[i].bonusStatsField) {
                    data.usedSpecialSettings[i].bonusStats = splitStatString(data.usedSpecialSettings[i].bonusStatsField);
                } else { // If the bonus field has stuff, use it, otherwise use the normal gift stuff
                    data.usedSpecialSettings[i].bonusStats = data.giftStats;
                }

                if (!data.usedSpecialSettings[i].hasOwnProperty("bonusDiceField") || data.usedSpecialSettings[i].bonusDiceField === "-") {
                    // If the dice field doesn't exist or is just a dash, interpret that as skipping the field
                } else if (data.usedSpecialSettings[i].bonusDiceField) {
                    data.usedSpecialSettings[i].bonusDice = findTotalDice(data.usedSpecialSettings[i].bonusDiceField);
                } else { // If the bonus field has stuff, use it, otherwise use the normal gift stuff
                    data.usedSpecialSettings[i].bonusDice = data.giftArray;
                }

                if (data.usedSpecialSettings[i].replaceNameField) {
                    data.usedSpecialSettings[i].replaceName = makeCompareReady(data.usedSpecialSettings[i].replaceNameField);
                }

                if (data.usedSpecialSettings[i].changeFromField && data.usedSpecialSettings[i].changeToField) {
                    // Check that both from and to fields have stuff, and then ensure that both have the same length before assiging them
                    const foo = splitStatString(data.usedSpecialSettings[i].changeFromField, false);
                    const bar = splitStatString(data.usedSpecialSettings[i].changeToField, false);
                    if (foo.length === bar.length) {
                        data.usedSpecialSettings[i].changeFrom = foo;
                        data.usedSpecialSettings[i].changeTo = bar;
                    } else {
                        data.usedSpecialSettings[i].changeFrom = null;
                        data.usedSpecialSettings[i].changeTo = null;
                    }
                }
            }
        }
    }

    /**
     * Process Extra Career type specific data
     */
    _prepareCareerData(itemData, actorData) {
        const data = itemData.data;

        data.careerName = (data.forcedCareerName?.length > 0 ? data.forcedCareerName : itemData.name);
        if (data.dice.length > 0) {
            data.diceArray = findTotalDice(data.dice);
            data.valid = checkDiceArrayEmpty(data.diceArray);
            data.skills = [makeCompareReady(data.careerSkill1), makeCompareReady(data.careerSkill2), makeCompareReady(data.careerSkill3)];
            data.skillNames = [data.careerSkill1, data.careerSkill2, data.careerSkill3];
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
                const bar = data.effectsSplit[foo];
                if (bar.length > 0) {
                    const damage = parseInt(bar.slice(-1));
                    data.damageEffect = isNaN(damage) ? -1 : damage;
                } else { data.damageEffect = -1; }
            } else { data.damageEffect = -1; }

            const conds = CommonConditionInfo.getMatchedConditions(data.effectsSplit);
            data.effectConditions = "";
            data.effectConditionsLabel = "";
            if (conds.length > 0) {
                conds.forEach(element => {
                    data.effectConditions += element.id + ",";
                    data.effectConditionsLabel += game.i18n.localize(element.label) + ",";
                });
                data.effectConditions = data.effectConditions.slice(0, -1);
                data.effectConditionsLabel = data.effectConditionsLabel.slice(0, -1);
            }
        } else {
            data.effectsSplit = null;
        }
        // Defense
        if (data.defendWith.length > 0) {
            data.opposingDefenseStats = splitStatString(data.defendWith);
        } else {
            data.opposingDefenseStats = null;
        }
        // Descriptors
        if (data.descriptors.length > 0) {
            data.descriptorsSplit = splitStatString(data.descriptors);
            // Special check to make sure wands have "wand" as a descriptor as far as the system is concerned
            if (!data.descriptorsSplit.includes("wand") && itemData.name.toLowerCase().includes("wand")) {
                data.descriptorsSplit.push("wand");
            }
        } else {
            data.descriptorsSplit = null;
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
        } else {
            data.armorArray = [0, 0, 0, 0, 0];
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
        } else {
            data.coverArray = [0, 0, 0, 0, 0];
        }
    }

    /**
     * Process Light Source type specific data
     */
    _prepareIlluminationData(itemData, actorData) {
        const data = itemData.data;
    }

    /* -------------------------------------------- */
    /* Item Data Modification Functions             */
    /* -------------------------------------------- */

    /**
     * Check whether a gift is usable, ie. not exhausted or does not exhaust at all
     * @param {boolean} countNonExhaust Whether to return true on gifts that are not exhaustible, or only return true for gifts that can be exhausted but aren't
     * @returns {boolean} Whether the gift is usable, ie. refreshed or doesn't exhaust
     */
    giftUsable(countNonExhaust = true) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift exhaust check attempted on a non-gift item: " + itemData.name);
            return;
        }

        if (data.exhaustWhenUsed === false && countNonExhaust === false) {
            return false; // If the gift does not exhaust when used and the function is set to not count those, return false
        }

        const exhaustibletest = data.exhaustWhenUsed === false && countNonExhaust === true; // Set the test as true if the gift does not exhaust when used and the function is set to count non-exhaustible gifts
        return data.exhausted === false || exhaustibletest === true; // Return true if the gift is not exhausted, or if the countnonexhaust is set to true and the gift is not exhaustible
    }

    /**
     * Set or toggle exhaustion in a gift, if able
     * @param {string} mode If given a string of "true" or "false", force-set the exhausted state to that, otherwise toggle it
     * @param {boolean} sendToChat If true, send a message to chat about the new gift exhaust state
     */
    async giftSetExhaust(mode = "", sendToChat = false) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift exhaust toggle attempted on a non-gift item: " + itemData.name);
            return;
        }

        // If the gift does not exhaust when used, return out
        if (data.exhaustWhenUsed === false) {
            return;
        }

        let foo = true;
        if (mode == "true") {
            foo = true;
        } else if (mode == "false") {
            foo = false;
        } else {
            foo = !data.exhausted;
        }

        const statechanging = (foo !== data.exhausted);

        await this.update({ "data.exhausted": foo });

        if (sendToChat && statechanging) {
            let speaker = getMacroSpeaker(this.actor);
            let contents = "";
            if (foo) {
                contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
                <img class="item-image" src="${itemData.img}" title="${itemData.name}" width="20" height="20"/>
                <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.exhaustGift.chatMessage", { "name": itemData.name })}</div>
                </header>
                </div>`;
            } else {
                contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
                <img class="item-image" src="${itemData.img}" title="${itemData.name}" width="20" height="20"/>
                <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.refreshGift.chatMessage", { "name": itemData.name })}</div>
                </header>
                </div>`;
            }
            let chatData = {
                "content": contents,
                "speaker": speaker
            };
            ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
            CONFIG.ChatMessage.documentClass.create(chatData);
        }
    }

    /**
     * Add a new special setting to a gift
     */
    async giftAddSpecialSetting() {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift special setting adding attempted on a non-gift item: " + itemData.name);
            return;
        }

        // Panic escape in case the special settings ever get corrupted
        if (!Array.isArray(data.specialSettings)) {
            console.warn("Gift special options are not an array somehow, resetting...: " + data.specialSettings);
            await this.update({ "data.specialSettings": [] });
        }

        let specialSettings = data.specialSettings;
        let setting = getSpecialOptionPrototype("attackBonus");
        specialSettings.push(setting);

        await this.update({ "data.specialSettings": specialSettings });
        this.giftChangeSpecialSetting(specialSettings.length - 1, "attackBonus", true);
    }

    /**
     * Delete a certain special setting from a gift
     * @param {number} index Index of the setting
     */
    async giftDeleteSpecialSetting(index) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift special setting deletion attempted on a non-gift item: " + itemData.name);
            return;
        }

        // Panic escape in case the special settings ever get corrupted
        if (!Array.isArray(data.specialSettings)) {
            console.warn("Gift special options are not an array somehow, resetting...: " + data.specialSettings);
            return await this.update({ "data.specialSettings": [] });
        }

        let specialSettings = data.specialSettings;
        specialSettings.splice(index, 1);

        await this.update({ "data.specialSettings": specialSettings });
    }

    /**
     * Change a special setting type in a gift
     * @param {number} index Index of the setting
     * @param {string} settingmode Setting type to change into
     * @param {boolean} force Whether to force a change even into the same type
     */
    async giftChangeSpecialSetting(index, settingmode, force = false) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift special setting change attempted on a non-gift item: " + itemData.name);
            return null;
        }

        // Panic escape in case the special settings ever get corrupted
        if (!Array.isArray(data.specialSettings)) {
            console.warn("Gift special options are not an array somehow, resetting...: " + data.specialSettings);
            return await this.update({ "data.specialSettings": [] });
        }

        let specialSettings = data.specialSettings;
        let oldSetting = specialSettings[index];

        // If the setting mode in the setting is the same as the settingmode for the function, and force is not set, return out
        if (oldSetting.settingMode == settingmode && force === false) {
            return null;
        }

        let newSetting = getSpecialOptionPrototype(settingmode);

        // Go through the field names of the new setting and check whether the old setting has any same ones, for any that do, copy the data over
        for (let [key, field] of Object.entries(newSetting)) {
            if (key == "settingMode") continue; // Special skip to not accidentally copy over the setting type, just in case

            if (oldSetting.hasOwnProperty(key)) {
                newSetting[key] = oldSetting[key];
            }
        }

        specialSettings[index] = newSetting;
        return this.update({ "data.specialSettings": specialSettings });
    }

    /**
     * Make sure the special settings array of the gift has no extra data haunting the system
     */
    async giftValidateSpecialSetting() {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift special setting validation attempted on a non-gift item: " + itemData.name);
            return null;
        }

        // Panic escape in case the special settings ever get corrupted
        if (!Array.isArray(data.specialSettings)) {
            console.warn("Gift special options are not an array somehow, resetting...: " + data.specialSettings);
            return await this.update({ "data.specialSettings": [] });
        }

        let specialSettings = [];

        // The actual data validation
        for (let i = 0; i < data.specialSettings.length; ++i) {
            let oldSetting = data.specialSettings[i];
            if (!oldSetting.settingMode) {
                console.error("A special bonus setting lacked a settingMode: " + this.name);
                return null;
            }

            let newSetting = getSpecialOptionPrototype(oldSetting.settingMode);

            // Go through the field names of the new setting and check whether the old setting has any same ones, for any that do, copy the data over
            for (let [key, field] of Object.entries(newSetting)) {
                if (key == "settingMode") continue; // Special skip to not accidentally copy over the setting type, just in case

                if (oldSetting.hasOwnProperty(key)) {
                    newSetting[key] = oldSetting[key];
                }
            }

            specialSettings.push(newSetting);
        }

        if (specialSettings.length == 0) // Special exception to return the item in case the function was successful, but there was nothing to validate
            return this;
        return this.update({ "data.specialSettings": specialSettings });
    }

    /**
     * Change a field in a special setting
     * @param {number} index Index of the special setting
     * @param {string} name The field to change in the special setting
     * @param {any} value
     */
    async giftChangeSpecialField(index, name, value) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift special setting change attempted on a non-gift item: " + itemData.name);
            return null;
        }

        let specialSettings = data.specialSettings;
        specialSettings[index][name] = value;
        return this.update({ "data.specialSettings": specialSettings });
    }

    /**
     * Get the gift this weapon is supposed to exhaust when used
     * @param {boolean} notifications Set to false to disable the missing gift warning
     * @returns {Ironclaw2EItem} The gift to exhaust
     */
    weaponGetGiftToExhaust(notifications = true) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'weapon')) {
            console.error("Weapon get exhaust gift attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.exhaustGift && data.exhaustGiftName.length > 0) {
            const giftToExhaust = findInItems(this.actor?.items, makeCompareReady(data.exhaustGiftName), "gift");
            if (!giftToExhaust) {
                if (notifications) ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustFailure", { "name": itemData.name, "gift": data.exhaustGiftName, "actor": this.actor.name }));
                return null;
            }
            return giftToExhaust;
        }
        else {
            return null;
        }
    }


    /* -------------------------------------------- */
    /* Roll and Chat Functions                      */
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
        const directroll = checkQuickModifierKey();

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
                    this._itemRollSelection(rolls[0], directroll);
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
        const item = this.data;
        const itemData = item.data;
        const actor = this.actor;
        const confirmSend = game.settings.get("ironclaw2e", "confirmItemInfo");

        const templateData = {
            "item": item,
            "itemData": itemData,
            "hasButtons": item.type === "weapon",
            "standardDefense": checkStandardDefense(itemData.defendWith),
            "actorId": actor.id,
            "tokenId": actor.token?.id ?? null,
            "sceneId": actor.token?.parent?.id ?? null,
            "equipHandedness": (item.type === 'weapon' ? CommonSystemInfo.equipHandedness[itemData.equip] : ""),
            "equipRange": (item.type === 'weapon' ? CommonSystemInfo.rangeBands[itemData.range] : "")
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/chat/item-info.html", templateData);

        let flags = { "ironclaw2e.itemInfo": true, "ironclaw2e.itemId": this.id, "ironclaw2e.itemActorId": actor.id, "ironclaw2e.itemTokenId": actor.token?.id, "ironclaw2e.itemSceneId": actor.token?.parent?.id };
        if (item.type === "weapon") {
            flags = mergeObject(flags, {
                "ironclaw2e.weaponName": item.name, "ironclaw2e.weaponDescriptors": itemData.descriptorsSplit, "ironclaw2e.weaponEffects": itemData.effectsSplit,
                "ironclaw2e.weaponAttackStats": itemData.attackStats, "ironclaw2e.weaponEquip": itemData.equip, "ironclaw2e.weaponRange": itemData.range
            });
        }
        const foundToken = findActorToken(actor);
        if (foundToken) {
            const rangePenalty = actor.getRangePenaltyReduction(this);
            let userPos = { "x": foundToken.data.x, "y": foundToken.data.y };
            if (foundToken.data.elevation) userPos.elevation = foundToken.data.elevation;
            flags = mergeObject(flags, {
                "ironclaw2e.itemUserPos": userPos,
                "ironclaw2e.itemUserRangeReduction": rangePenalty.reduction, "ironclaw2e.itemUserRangeAutocheck": rangePenalty.autocheck
            });
        }

        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(actor),
            flags
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
     * @param {boolean} onlyupdate If true, only update the roll data, do not send anything to chat yet
     * @param {number} opposingsuccesses The already-rolled resisting successes, -1 means they haven't been rolled yet
     */
    automaticDamageCalculation(info, ignoreresist = false, onlyupdate = false, opposingsuccesses = -1) {
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        if (!info) { // Return out in case the info turns out blank
            return;
        }

        const item = this.data;
        const itemData = item.data;
        if (item.type !== 'weapon') {
            console.error("A non-weapon type attempted to send Attack Data: " + item.name);
            return;
        }
        if (itemData.effect.length == 0) {
            return; // If the weapon has no effects listed, return out
        }


        if (!info.tnData) { // If the roll info is in highest mode, assume the attack was a counter-attack, and set the flags accordingly
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "counter", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id
                }
            };
            info.message?.update(updatedata);
            return; // Return out of a counter-attack
        }

        const successes = (isNaN(info.tnData.successes) ? 0 : info.tnData.successes);
        const ties = (isNaN(info.tnData.ties) ? 0 : info.tnData.ties);
        const success = successes > 0;
        let usedsuccesses = (success ? successes : ties);

        if (ignoreresist === false && itemData.hasResist) { // If the weapon's attack is a resisted one, set the flags accordingly
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "resist", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id, "ironclaw2e.resistSuccess": success, "ironclaw2e.resistSuccessCount": usedsuccesses
                }
            };
            info.message?.update(updatedata);
            // If the resist has not yet been rolled, return out after setting the resist flags
            if (opposingsuccesses < 0)
                return;
        }
        else { // Else, treat it as a normal attack and set the flags to store the information for future reference
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "attack", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id, "ironclaw2e.attackSuccess": success, "ironclaw2e.attackSuccessCount": usedsuccesses
                }
            };
            info.message?.update(updatedata);
        }

        // If the weapon's attack is resisted and the resists have been rolled, subtract the resistance successes from the attack
        if (itemData.hasResist && opposingsuccesses > 0)
            usedsuccesses -= opposingsuccesses;

        if (onlyupdate) {
            return; // Return out to not send anything in update mode
        }
        else if (usedsuccesses <= 0) { // Ignore a complete failure, only display something if the setting is on
            if (game.settings.get("ironclaw2e", "calculateDisplaysFailed")) {
                this.failedAttackToChat();
            }
        }
        else {
            this.successfulAttackToChat(success, usedsuccesses);
        }
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

        if (successes > 0) {
            this.successfulAttackToChat(success, successes);
        }
        else {
            this.failedAttackToChat();
        }
    }

    /**
     * Resend a normal attack to chat
     */
    resendNormalAttack(message) {
        const success = message.getFlag("ironclaw2e", "attackSuccess");
        const successes = message.getFlag("ironclaw2e", "attackSuccessCount");

        if (successes > 0) {
            this.successfulAttackToChat(success, successes);
        }
        else {
            this.failedAttackToChat();
        }
    }

    /**
     * Send the attack damage to chat, calculating damage based on the given successes
     * @param {boolean} success Whether the attack was a success, or a tie
     * @param {number} usedsuccesses The number of successes, or ties in case the attack was a tie
     */
    async successfulAttackToChat(success, usedsuccesses) {
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        const item = this.data;
        const itemData = item.data;

        const templateData = {
            "item": item,
            "itemData": itemData,
            "successfulAttack": true,
            "hasResist": itemData.hasResist,
            "success": success,
            "resultStyle": "color:" + (success ? CommonSystemInfo.resultColors.success : CommonSystemInfo.resultColors.tie),
            "damageType": (itemData.effectsSplit.includes("slaying") ? "slaying" : (itemData.effectsSplit.includes("critical") ? "critical" : (itemData.damageEffect >= 0 ? "normal" : "conditional"))),
            "isImpaling": itemData.effectsSplit.includes("impaling"),
            "isPenetrating": itemData.effectsSplit.includes("penetrating"),
            "isWeak": itemData.effectsSplit.includes("weak"),
            "doubleDamage": itemData.damageEffect + (usedsuccesses * 2),
            "criticalDamage": itemData.damageEffect + Math.floor(usedsuccesses * 1.5),
            "normalDamage": itemData.damageEffect + usedsuccesses
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/chat/damage-info.html", templateData);

        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor),
            flags: { "ironclaw2e.attackDamageInfo": true }
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatData);
    }

    /**
     * Send a message to chat simply to report that the attack failed
     */
    async failedAttackToChat() { // This function is mostly used for resist rolls to specifically note if the resistance check failed for the attacker
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return; // If the system is turned off, return out
        }
        const item = this.data;
        const itemData = item.data;

        const templateData = {
            "item": item,
            "itemData": itemData,
            "successfulAttack": false,
            "hasResist": itemData.hasResist,
            "success": false,
            "resultStyle": "color:" + CommonSystemInfo.resultColors.failure,
            "damageType": (itemData.effectsSplit.includes("slaying") ? "slaying" : (itemData.effectsSplit.includes("critical") ? "critical" : (itemData.damageEffect ? "normal" : "conditional"))),
            "isImpaling": itemData.effectsSplit.includes("impaling"),
            "isPenetrating": itemData.effectsSplit.includes("penetrating"),
            "isWeak": itemData.effectsSplit.includes("weak"),
            "doubleDamage": 0,
            "criticalDamage": 0,
            "normalDamage": 0
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/chat/damage-info.html", templateData);

        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor),
            flags: { "ironclaw2e.attackDamageInfo": true }
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        CONFIG.ChatMessage.documentClass.create(chatData);
    }

    /* -------------------------------------------- */
    /*  Item Type Specific Rolls                    */
    /* -------------------------------------------- */

    // Gift Rolls

    giftRoll(directroll = false) {
        const theitem = this;
        const itemData = this.data;
        const data = itemData.data;

        if (!(itemData.type === 'gift')) {
            console.error("Gift roll attempted on a non-gift item: " + itemData.name);
            return;
        }

        if (data.canUse == false) {
            return;
        }
        if (data.exhaustWhenUsed == false || data.exhausted == false) {
            if (data.giftStats || data.giftArray)
                this.genericItemRoll(data.giftStats, data.defaultTN, itemData.name, data.giftArray, 0, { directroll }, (data.exhaustWhenUsed ? (x => { this.giftSetExhaust("true"); }) : null));
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
     * @param {boolean} directroll Whether to skip the popup dialog
     * @private
     */
    _itemRollSelection(selection, directroll = false) {
        switch (selection) {
            case 0:
                this.attackRoll(directroll);
                break;
            case 1:
                this.sparkRoll(directroll);
                break;
            case 2:
                this.defenseRoll(directroll);
                break;
            case 3:
                this.counterRoll(directroll);
                break;
            default:
                console.error("Defaulted weapon roll type: " + this);
                break;
        }
    }

    attackRoll(directroll = false, ignoreresist = false, presettn = 3, opposingsuccesses = -1) {
        const item = this;
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Attack roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canAttack == false) {
            return;
        }

        const canQuickroll = data.hasResist && !ignoreresist;
        const callback = (x => {
            if (exhaust) exhaust.giftSetExhaust("true", sendToChat);
            item.automaticDamageCalculation(x, ignoreresist, donotdisplay, opposingsuccesses);
        });

        const donotdisplay = game.settings.get("ironclaw2e", "calculateDoesNotDisplay");
        const exhaust = this.weaponGetGiftToExhaust();
        const sendToChat = game.settings.get("ironclaw2e", "sendWeaponExhaustMessage");
        if (data.exhaustGift && !exhaust) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustAbort", { "name": itemData.name }));
        } else if (data.exhaustGiftNeedsRefresh && exhaust?.giftUsable() === false) { // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            exhaust?.popupRefreshGift();
        } else {
            this.genericItemRoll(data.attackStats, presettn, itemData.name, data.attackArray, 2, { "directroll": canQuickroll && directroll }, callback);
        }
    }

    defenseRoll(directroll = false, otheritem = null, extradice = "") {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Defense roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canDefend == false) {
            return;
        }

        this.genericItemRoll(data.defenseStats, -1, itemData.name, data.defenseArray, 1, { directroll, otheritem, extradice },
            (x => { Ironclaw2EActor.addCallbackToAttackMessage(x?.message, otheritem.messageId); }));
    }

    counterRoll(directroll = false, otheritem = null, extradice = "") {
        const item = this;
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Counter roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canCounter == false) {
            return;
        }

        const exhaust = this.weaponGetGiftToExhaust();
        const sendToChat = game.settings.get("ironclaw2e", "sendWeaponExhaustMessage");
        if (data.exhaustGift && !exhaust) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustAbort", { "name": itemData.name }));
        } else if (data.exhaustGiftNeedsRefresh && exhaust?.giftUsable() === false) { // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            exhaust?.popupRefreshGift();
        } else {
            this.genericItemRoll(data.counterStats, -1, itemData.name, data.counterArray, 3, { directroll, otheritem, extradice },
                (x => { if (exhaust) exhaust.giftSetExhaust("true", sendToChat); item.automaticDamageCalculation(x); Ironclaw2EActor.addCallbackToAttackMessage(x?.message, otheritem.messageId); }));
        }
    }

    sparkRoll(directroll = false) {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Spark roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (data.canSpark == false) {
            return;
        }

        if (!directroll) {
            rollHighestOneLine(data.sparkDie, game.i18n.localize("ironclaw2e.dialog.sparkRoll.label"), "ironclaw2e.dialog.sparkRoll.title", this.actor);
        } else {
            const foo = findTotalDice(data.sparkDie);
            CardinalDiceRoller.rollHighestArray(foo, game.i18n.localize("ironclaw2e.dialog.sparkRoll.label"), this.actor);
        }
    }

    /**
     * Common massive function to process roll data and send it to the actor's popup roll function
     * @param {string[]} stats Skills to autocheck on the dialog
     * @param {number} tn Target number of the roll, -1 if highest
     * @param {string} diceid What to name the item dice
     * @param {number[]} dicearray The dice array of the item being rolled
     * @param {boolean} directroll Whether the roll is a direct one without a popup
     * @param {number} rolltype What type of popup function to use for the roll, mostly to allow automatic use gifts through special case hacks
     * @param {Object} otheritem The opposing item for this roll
     * @param {Function} callback The function to execute after the dice are rolled
     */
    genericItemRoll(stats, tn, diceid, dicearray, rolltype = 0, { directroll = false, otheritem = null, extradice = "" } = {}, callback = null) {
        let tnyes = (tn > 0);
        let usedtn = (tn > 0 ? tn : 3);
        if (this.actor) {
            let formconstruction = ``;
            let usesmoredice = false;
            if (Array.isArray(dicearray)) {
                formconstruction += `<div class="form-group flexrow">
                 <label class="normal-label">${diceid}: ${reformDiceString(dicearray, true)}</label>
	             <input type="checkbox" id="${makeCompareReady(diceid)}" name="${makeCompareReady(diceid)}" value="${makeCompareReady(diceid)}" checked></input>
                </div>`+ "\n";
                usesmoredice = true;
            }

            let label = "";
            const diceinput = {
                "prechecked": stats, "tnyes": tnyes, "tnnum": usedtn, "otherkeys": (usesmoredice ? [diceid] : []), "otherdice": (usesmoredice ? [dicearray] : []),
                "otherinputs": formconstruction, "otherbools": (usesmoredice ? [true] : []), "otherlabel": "", "extradice": extradice
            };

            switch (rolltype) {
                case 0: // Generic gift roll
                    diceinput.otherlabel = this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.giftRoll") + (this.data.data.exhaustWhenUsed ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.gift") + " <strong>" + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.exhausted") + "</strong>" : ": ");
                    this.actor.basicRollSelector(diceinput, { directroll }, callback);
                    break;
                case 1: // Parry roll
                    diceinput.otherlabel = this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.parryRoll") + ": ";
                    this.actor.popupDefenseRoll(diceinput, { directroll, "isparry": true, otheritem }, this, callback);
                    break;
                case 2: // Attack roll
                    diceinput.otherlabel = this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.attackRoll") + (this.data.data.effect ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.effect") + ": " + this.data.data.effect +
                        (this.data.data.opposingDefenseStats?.length > 0 ? ", " + (this.data.data.hasResist ? game.i18n.localize("ironclaw2e.chatInfo.itemInfo.resistWith") + " " + this.data.data.defendWith + " vs. 3 " : game.i18n.localize("ironclaw2e.chatInfo.itemInfo.opposingDefense") + ": " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.attack") + " vs. " + this.data.data.defendWith) : "") : ": ");
                    if (this.weaponGetGiftToExhaust()?.giftUsable() === false) formconstruction += `<strong>${game.i18n.localize("ironclaw2e.dialog.dicePool.giftExhausted")}</strong>` + "\n";
                    this.actor.popupAttackRoll(diceinput, { directroll }, this, callback);
                    break;
                case 3: // Counter roll
                    diceinput.otherlabel = this.data.name + " " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.counterRoll") + (this.data.data.effect ? ", " + game.i18n.localize("ironclaw2e.chatInfo.itemInfo.effect") + ": " + this.data.data.effect : ": ");
                    if (this.weaponGetGiftToExhaust()?.giftUsable() === false) formconstruction += `<strong>${game.i18n.localize("ironclaw2e.dialog.dicePool.giftExhausted")}</strong>` + "\n";
                    this.actor.popupCounterRoll(diceinput, { directroll, otheritem }, this, callback);
                    break;
                default:
                    console.warn("genericItemRoll defaulted when selecting a roll: " + rolltype);
                    this.actor.basicRollSelector(diceinput, { directroll }, callback);
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

    /**
     * Pop up a dialog box to confirm refreshing a gift
     */
    popupRefreshGift() {
        if (this.data.type != "gift")
            return console.error("Tried to refresh a non-gift item: " + this);

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
                    let SEND = html.find('[name=send]');
                    let sent = SEND.length > 0 ? SEND[0].checked : false;

                    this.giftSetExhaust("false", sent);
                }
            }
        });
        dlog.render(true);
    }

    /**
     * Pop up a dialog box to confirm exhausting a gift
     */
    popupExhaustGift() {
        if (this.data.type != "gift")
            return console.error("Tried to exhaust a non-gift item: " + this);

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
                    let SEND = html.find('[name=send]');
                    let sent = SEND.length > 0 ? SEND[0].checked : false;

                    this.giftSetExhaust("true", sent);
                }
            }
        });
        dlog.render(true);
    }

    /**
     * Pop up a dialog box to pick what way to use a weapon
     */
    popupWeaponRollType() {
        if (this.data.type != "weapon")
            return console.error("Tried to popup a weapon roll question a non-weapon item: " + this);

        const item = this.data;
        const itemData = item.data;
        const exhaust = this.weaponGetGiftToExhaust();

        // If the weapon has been marked to exhaust a gift, but no such gift is found, pop a warning
        if (itemData.exhaustGift && !exhaust) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustFailure", { "name": itemData.name, "gift": data.exhaustGiftName, "actor": this.actor.name }));
        }

        // Check if the weapon has an auto-exhaust gift and whether all possible uses would exhaust the gift
        if (exhaust && !itemData.canDefend && !itemData.canSpark) {
            // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            if (itemData.exhaustGiftNeedsRefresh && exhaust?.giftUsable() === false) {
                exhaust?.popupRefreshGift();
                return;
            }
        }

        let first = null;
        let constructionstring = `<div class="form-group">
	   <div class="form-group">`;

        if (itemData.canAttack) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.attack")}:</label>
	    <input type="radio" id="attack" name="weapon" value="0" ${first ? "" : "checked"}></input>`;
            first = first || "attack";
        }
        if (itemData.canSpark) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.spark")}:</label>
	    <input type="radio" id="spark" name="weapon" value="1" ${first ? "" : "checked"}></input>`;
            first = first || "spark";
        }
        if (itemData.canDefend) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.parry")}:</label>
	    <input type="radio" id="defend" name="weapon" value="2" ${first ? "" : "checked"}></input>`;
            first = first || "defend";
        }
        if (itemData.canCounter) {
            constructionstring += `<label>${game.i18n.localize("ironclaw2e.counter")}:</label>
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
                    const directroll = checkQuickModifierKey();
                    let typestring = html.find('input[name=weapon]:checked')[0].value;
                    let rolltype = 0; if (typestring.length != 0) rolltype = parseInt(typestring);
                    if (Number.isInteger(rolltype)) {
                        this._itemRollSelection(rolltype, directroll);
                    }
                }
            }
        });
        dlog.render(true);
    }
}
