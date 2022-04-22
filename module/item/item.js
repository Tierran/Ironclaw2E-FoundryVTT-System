import { findActorToken, findInItems, findTotalDice, formDicePoolField, getTokenFromSpeaker, popupConfirmationBox } from "../helpers.js";
import { parseSingleDiceString } from "../helpers.js";
import { makeCompareReady } from "../helpers.js";
import { reformDiceString } from "../helpers.js";
import { splitStatString } from "../helpers.js";
import { splitStatsAndBonus } from "../helpers.js";
import { getMacroSpeaker } from "../helpers.js";
import { checkDiceArrayEmpty } from "../helpers.js";
import { checkQuickModifierKey } from "../helpers.js";

import { checkStandardDefense, CommonSystemInfo, getRangeDistanceFromBand } from "../systeminfo.js";
import { getSpecialOptionPrototype } from "../systeminfo.js";

import { CommonConditionInfo } from "../conditions.js"

import { CardinalDiceRoller, rollTargetNumberOneLine, rollVariableOneLine } from "../dicerollers.js";
import { rollHighestOneLine } from "../dicerollers.js";
import { copyToRollTNDialog } from "../dicerollers.js";
import { Ironclaw2EActor } from "../actor/actor.js";

/**
 * Extend the basic Item for Ironclaw's systems.
 * @extends {Item}
 */
export class Ironclaw2EItem extends Item {

    /* -------------------------------------------- */
    /* Static Functions                             */
    /* -------------------------------------------- */

    /**
     * Transfer template flags from one object to another
     * @param {object} source
     * @param {object} target
     */
    static transferTemplateFlags(source, target) {
        const sourceFlags = source?.data.flags?.ironclaw2e;
        if ("weaponTemplatePos" in sourceFlags) {
            const flags = {
                "ironclaw2e.weaponTemplatePos": sourceFlags.weaponTemplatePos,
                "ironclaw2e.weaponTemplateId": sourceFlags.weaponTemplateId,
                "ironclaw2e.weaponTemplateSceneId": sourceFlags.weaponTemplateSceneId
            };
            target.update({ "_id": target.id, "flags": flags });
        }
    }

    /**
     * Simple helper that just sets the exhaust state of an entire array of gifts, helper to help combat against race conditions
     * @param {Ironclaw2EItem[]} gifts
     * @param {string} state "toggle" changes the state to the opposite, "true" or "false" set it to that state, otherwise errors out. "true" exhausts, "false" refreshes.
     * @returns {Promise<boolean>} Whether there were any gifts to exhaust
     */
    static async giftSetExhaustArray(gifts, state) {
        if (gifts?.length > 0) {
            const giftUseToChat = game.settings.get("ironclaw2e", "sendGiftUseExhaustMessage");
            for (let exhaust of gifts) { await exhaust.giftToggleExhaust(state, giftUseToChat); }
            return true;
        }
        return false;
    }

    /* -------------------------------------------- */
    /* Overrides                                    */
    /* -------------------------------------------- */

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
                // If the gift does not exhaust when used, or it is _not_ exhausted, set the stored refreshedState as true, otherwise it is false
                data.usedSpecialSettings[i].refreshedState = (data.exhaustWhenUsed === false || !data.exhausted);

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
            // Damage
            const foo = data.effectsSplit.findIndex(element => element.includes("damage"));
            if (foo >= 0) {
                let bar = data.effectsSplit[foo];
                let flat = false;
                if (bar.includes("flat")) {
                    bar = bar.replaceAll("flat", "");
                    flat = true;
                }
                if (bar.length > 0) {
                    const damage = parseInt(bar.slice(-1));
                    data.damageEffect = isNaN(damage) ? -1 : damage;
                    data.damageFlat = flat && data.damageEffect >= 0;
                } else { data.damageEffect = -1; }
            } else { data.damageEffect = -1; }
            //Multi-attack
            let multiType = "";
            const multi = data.effectsSplit.findIndex(element => {
                if (element.includes("group")) {
                    multiType = "group";
                    return true;
                } else if (element.includes("sweep")) {
                    multiType = "sweep";
                    return true;
                } else if (element.includes("explosion")) {
                    multiType = "explosion";
                    return true;
                } else if (element.includes("crowd")) {
                    multiType = "crowd";
                    return true;
                } else if (element.includes("landscape")) {
                    multiType = "landscape";
                    return true;
                }
                return false;
            });
            if (multi > 0) {
                data.multiAttackType = multiType;
                if (multiType === "sweep" || multiType === "explosion") {
                    const multiString = data.effectsSplit[multi].replaceAll(/([:;])/g, "");
                    const distString = multiString.substring(multiType.length);
                    if (CommonSystemInfo.rangeBandsArray.includes(distString)) {
                        data.multiAttackRange = distString;
                        data.multiAttackRangeShown = CommonSystemInfo.rangeBands[distString];
                    }
                }
                data.attackAutoHits = (multiType === "explosion") && data.hasResist;
                data.attackHasTemplate = data.attackAutoHits && data.multiAttackRange;
            } else { data.multiAttackType = ""; }
            // Condition effects
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
     * @param {string} toggle "toggle" changes the state to the opposite, "true" or "false" set it to that state, otherwise errors out. "true" exhausts, "false" refreshes.
     * @param {boolean} sendToChat If true, send a message to chat about the new gift exhaust state
     * @returns {Promise<boolean | null>} Returns either whether gift is exhausted or not, or null in case of an error
     */
    async giftToggleExhaust(toggle = "toggle", sendToChat = false) {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'gift')) {
            console.error("Gift exhaust toggle attempted on a non-gift item: " + itemData.name);
            return null;
        }

        // If the gift does not exhaust when used, return out
        if (data.exhaustWhenUsed === false) {
            return null;
        }

        let endState = null;
        switch (toggle) {
            case "toggle":
                endState = !data.readied;
                break;
            case "true": // Exhausted
                endState = true;
                break;
            case "false": // Refreshed
                endState = false;
                break;
            default:
                console.error("Gift exhaust toggle defaulted! " + toggle);
                break;
        }

        if (endState === null) {
            return null;
        }

        const statechanging = (endState !== data.exhausted);
        if (statechanging) {
            await this.update({ "_id": this.id, "data.exhausted": endState });

            if (sendToChat) {
                let speaker = getMacroSpeaker(this.actor);
                let contents = "";
                if (endState) {
                    contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
                <img class="item-image" src="${itemData.img}" title="${itemData.name}" width="20" height="20"/>
                <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.exhaustGift.chatMessage", { "item": itemData.name })}</div>
                </header>
                </div>`;
                } else {
                    contents = `<div class="ironclaw2e"><header class="chat-item flexrow">
                <img class="item-image" src="${itemData.img}" title="${itemData.name}" width="20" height="20"/>
                <div class="chat-header-small">${game.i18n.format("ironclaw2e.dialog.refreshGift.chatMessage", { "item": itemData.name })}</div>
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

        return endState;
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

        if (!this.actor) {
            // If the item has no actor, skip this and simply return null
            return null;
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

    /**
     * Toggle the readiness of the weapon
     * @param {string} toggle The state to toggle to
     * @returns {Promise<boolean | null>} Returns either the state the weapon was set to, or null in case of an error
     */
    async weaponToggleReady(toggle = "toggle") {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'weapon')) {
            console.error("Weapon ready toggle attempted on a non-weapon item: " + itemData.name);
            return null;
        }

        let endState = null;
        switch (toggle) {
            case "toggle":
                endState = !data.readied;
                break;
            case "true":
                endState = true;
                break;
            case "false":
                endState = false;
                break;
            default:
                console.error("Weapon ready toggle defaulted! " + toggle);
                break;
        }

        if (endState !== null) {
            if (endState === true && data.exhaustGift && data.exhaustGiftWhenReadied) {
                const sendToChat = game.settings.get("ironclaw2e", "sendWeaponReadyExhaustMessage");
                const needsRefreshed = game.settings.get("ironclaw2e", "weaponExhaustNeedsRefreshed");
                const exhaust = this.weaponGetGiftToExhaust();

                // If the weapon has a gift to exhaust that can't be found or is exhausted, warn about it or pop a refresh request about it respectively
                if (!exhaust) {
                    ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustAbort", { "name": itemData.name }));
                    return null;
                } else if (needsRefreshed && exhaust?.giftUsable() === false) { // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
                    const confirmation = await exhaust?.popupGiftExhaustToggle(false);
                    if (confirmation !== false) {
                        return null;
                    }
                }

                const worked = await exhaust.giftToggleExhaust("true", sendToChat);
                if (worked !== true) {
                    return null;
                }
            }

            // Actually update
            await this.update({ "_id": this.id, "data.readied": endState });
        }

        return endState;
    }

    /**
     * Weapon auto-stow
     */
    async weaponAutoStow() {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'weapon')) {
            console.error("Weapon ready toggle attempted on a non-weapon item: " + itemData.name);
            return;
        }

        if (!this.actor) {
            // Skip this function for items without actors
            return;
        }

        if (data.autoStow) {
            await this.weaponToggleReady("false");
        }
    }

    /**
     * Ready the weapon when it is used
     * @returns {Promise<boolean>} Returns whether the weapon is ready to use
     */
    async weaponReadyWhenUsed() {
        const itemData = this.data;
        const data = itemData.data;
        if (!(itemData.type === 'weapon')) {
            console.error("Weapon ready toggle attempted on a non-weapon item: " + itemData.name);
            return false;
        }

        // If the weapon is already readied, return true
        if (data.readied) {
            return true;
        }

        // If the weapon doesn't need to be readied, return true
        if (!data.readyWhenUsed) {
            return true;
        }

        const confirm = game.settings.get("ironclaw2e", "askReadyWhenUsed");
        if (confirm) {
            const confirmation = await popupConfirmationBox("ironclaw2e.dialog.readyWhenUsed.title", "ironclaw2e.dialog.readyWhenUsed.header", "ironclaw2e.dialog.ready", { "itemname": itemData.name, "actorname": this.actor.name });
            if (!confirmation.confirmed) {
                return false;
            }
        }

        const state = (await this.weaponToggleReady("true")) === true;
        return state;
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
     * Get the chat message flags for this item
     */
    getItemFlags() {
        const item = this.data;
        const itemData = item.data;
        const actor = this.actor;

        // TODO: Make the system use speaker rather than these flags
        let flags = { "ironclaw2e.itemId": this.id, "ironclaw2e.itemActorId": actor?.id, "ironclaw2e.itemTokenId": actor?.token?.id, "ironclaw2e.itemSceneId": actor?.token?.parent?.id };
        if (item.type === "weapon") {
            flags = mergeObject(flags, {
                "ironclaw2e.weaponName": item.name, "ironclaw2e.weaponDescriptors": itemData.descriptorsSplit, "ironclaw2e.weaponEffects": itemData.effectsSplit,
                "ironclaw2e.weaponAttackStats": itemData.attackStats, "ironclaw2e.weaponEquip": itemData.equip, "ironclaw2e.weaponRange": itemData.range
            });
            if (itemData.multiAttackType) {
                flags = mergeObject(flags, {
                    "ironclaw2e.weaponMultiAttack": itemData.multiAttackType, "ironclaw2e.weaponMultiRange": itemData.multiAttackRange ?? null,
                });
            }
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

        return flags;
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
            "actorId": actor?.id ?? null,
            "tokenId": actor?.token?.id ?? null,
            "sceneId": actor?.token?.parent?.id ?? null,
            "equipHandedness": (item.type === 'weapon' ? CommonSystemInfo.equipHandedness[itemData.equip] : ""),
            "equipRange": (item.type === 'weapon' ? CommonSystemInfo.rangeBands[itemData.range] : "")
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/chat/item-info.html", templateData);

        let flags = { "ironclaw2e.itemInfo": true };
        flags = mergeObject(flags, this.getItemFlags());

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
            return null; // If the system is turned off, return out
        }
        if (!info) { // Return out in case the info turns out blank
            return null;
        }

        const item = this.data;
        const itemData = item.data;
        if (item.type !== 'weapon') {
            console.error("A non-weapon type attempted to send Attack Data: " + item.name);
            return null;
        }
        if (itemData.effect.length == 0) {
            return null; // If the weapon has no effects listed, return out
        }


        if (!info.tnData) { // If the roll info is in highest mode, assume the attack was a counter-attack, and set the flags accordingly
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "counter", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id, "ironclaw2e.hangingSlaying": itemData.effectsSplit?.includes("slaying") ?? false
                }
            };
            info.message?.update(updatedata);
            return null; // Return out of a counter-attack
        }

        const successes = (isNaN(info.tnData.successes) ? 0 : info.tnData.successes);
        const ties = (isNaN(info.tnData.ties) ? 0 : info.tnData.ties);
        const success = successes > 0;
        let usedsuccesses = (success || itemData.hasResist ? successes : ties); // Ties don't count for resisted weapons

        if (ignoreresist === false && itemData.hasResist) { // If the weapon's attack is a resisted one, set the flags accordingly
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "resist", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id, "ironclaw2e.hangingSlaying": itemData.effectsSplit?.includes("slaying") ?? false, "ironclaw2e.resistSuccess": success, "ironclaw2e.resistSuccessCount": usedsuccesses
                }
            };
            info.message?.update(updatedata);
            // If the resist has not yet been rolled, return out after setting the resist flags
            if (opposingsuccesses < 0 && !itemData.attackAutoHits)
                return null;
        }
        else { // Else, treat it as a normal attack and set the flags to store the information for future reference
            let updatedata = {
                flags: {
                    "ironclaw2e.hangingAttack": "attack", "ironclaw2e.hangingWeapon": this.id, "ironclaw2e.hangingActor": this.actor?.id, "ironclaw2e.hangingToken": this.actor?.token?.id,
                    "ironclaw2e.hangingScene": this.actor?.token?.parent?.id, "ironclaw2e.hangingSlaying": itemData.effectsSplit?.includes("slaying") ?? false, "ironclaw2e.attackSuccess": success, "ironclaw2e.attackSuccessCount": usedsuccesses
                }
            };
            info.message?.update(updatedata);
        }

        // Send to chat if there are successes, failures are displayed as well, or the attack is an explosion
        const toChat = usedsuccesses > 0 || game.settings.get("ironclaw2e", "calculateDisplaysFailed") || itemData.attackAutoHits;
        if (onlyupdate) {
            return null; // Return out to not send anything in update mode
        } else if (toChat) {
            return this.attackToChat({ success, "rawsuccesses": usedsuccesses, "opposingrolled": opposingsuccesses >= 0, "opposingsuccesses": opposingsuccesses });
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
        let forceSlaying = false;
        const success = message.getFlag("ironclaw2e", "resistSuccess");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
        const isSlaying = this.data.data.effectsSplit?.includes("slaying") ?? false;

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
      ${!isSlaying /* A bit confusing-looking, but simply, only add this part if the weapon isn't already a slaying weapon*/ ? `
      <div class="form-group">
        <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.resistResolve.slaying")}</label>
        <input type="checkbox" id="slaying" name="slaying" value="1"></input>
      </div>
      ` : ""}
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
                        let SLAYING = html.find('[name=slaying]')[0];
                        forceSlaying = SLAYING?.checked ?? false;
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

        this.attackToChat({ "success": successes > opposingsuccesses, "rawsuccesses": successes, "opposingrolled": true, "opposingsuccesses": opposingsuccesses, "forceslaying": forceSlaying });
    }

    /**
     * Resolve a resisted attack as if it were just an ordinary attack roll, in case it was countered and turned into one
     */
    resolveAsNormalAttack(message, forceslaying = false) {
        const success = message.getFlag("ironclaw2e", "resistSuccess");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");

        this.attackToChat({ "success": success, "rawsuccesses": successes, forceslaying });
    }

    /**
     * Resend a normal attack to chat
     */
    resendNormalAttack(message, forceslaying = false) {
        const success = message.getFlag("ironclaw2e", "attackSuccess");
        const successes = message.getFlag("ironclaw2e", "attackSuccessCount");

        this.attackToChat({ "success": success, "rawsuccesses": successes, forceslaying });
    }

    /**
     * Send the attack damage to chat, calculating damage based on the given successes
     * @param {boolean} success Whether the attack was a success, or a tie
     * @param {number} rawsuccesses The number of successes, or ties in case the attack was a tie
     * @param {boolean} opposingrolled Whether the opposing successes have been rolled
     * @param {number} opposingsuccesses The opposing successes
     * @param {boolean} forceslaying Whether to force the attack to have the slaying trait, for resolving attacks against vulnerabilities
     */
    async attackToChat({ success = false, rawsuccesses = 0, opposingrolled = false, opposingsuccesses = 0, forceslaying = false } = {}) {
        if (!game.settings.get("ironclaw2e", "calculateAttackEffects")) {
            return null; // If the system is turned off, return out
        }
        const item = this.data;
        const itemData = item.data;

        const usedsuccesses = opposingrolled ? rawsuccesses - opposingsuccesses : rawsuccesses;
        const successfulAttack = usedsuccesses > 0 || itemData.attackAutoHits;
        const negativeSuccesses = usedsuccesses <= 0; // More like non-positive, but I prefer two-word variable names

        const flat = itemData.damageFlat ?? false;
        const slaying = forceslaying || (itemData.effectsSplit?.includes("slaying") ?? false);
        const impaling = itemData.effectsSplit?.includes("impaling") ?? false;
        const critical = itemData.effectsSplit?.includes("critical") ?? false;
        const penetrating = itemData.effectsSplit?.includes("penetrating") ?? false;
        const weak = itemData.effectsSplit?.includes("weak") ?? false;

        // Account for multiple damage-multiplying effects
        const effectCount = (slaying ? 1 : 0) + (impaling ? 1 : 0) + (critical ? 1 : 0);
        let hasMultipleBaseEffects = false;
        let combinedDamage = 0;
        let combinedImpalingDamage = 0;
        if (effectCount >= 2) {
            // The damage calculcations might look a little off, it's to avoid calculating the default damage increase from successes more than once
            if (slaying && critical) {
                hasMultipleBaseEffects = true;
                combinedDamage = itemData.damageEffect + (usedsuccesses * 2) + Math.floor(usedsuccesses * 0.5);
            }
            if (impaling) {
                combinedImpalingDamage = itemData.damageEffect + (usedsuccesses * 2) + (slaying ? (usedsuccesses) : 0) + (critical ? Math.floor(usedsuccesses * 0.5) : 0);
            }
        }

        const templateData = {
            "item": item,
            "itemData": itemData,
            "successfulAttack": successfulAttack,
            "hasResist": itemData.hasResist,
            "success": success,
            "negativeSuccesses": negativeSuccesses,
            "resultStyle": "color:" + (successfulAttack ? (success || itemData.attackAutoHits ? CommonSystemInfo.resultColors.success : CommonSystemInfo.resultColors.tie) : CommonSystemInfo.resultColors.failure),

            "isFlat": flat,
            "isSlaying": slaying,
            "isImpaling": impaling,
            "isCritical": critical,
            "isNormal": itemData.damageEffect >= 0,
            "isConditional": itemData.damageEffect < 0,
            "isPenetrating": penetrating,
            "isWeak": weak,
            "doubleDamage": itemData.damageEffect + (usedsuccesses * 2),
            "criticalDamage": itemData.damageEffect + Math.floor(usedsuccesses * 1.5),
            "normalDamage": itemData.damageEffect + usedsuccesses,
            "flatDamage": itemData.damageEffect,

            "hasMultipleMultipliers": effectCount >= 2,
            hasMultipleBaseEffects,
            combinedDamage,
            combinedImpalingDamage
        };

        const contents = await renderTemplate("systems/ironclaw2e/templates/chat/damage-info.html", templateData);

        let flags = { "ironclaw2e.attackDamageInfo": true, "ironclaw2e.attackDamageAutoHits": itemData.attackAutoHits, "ironclaw2e.attackDamageDefense": itemData.opposingDefenseStats, "ironclaw2e.attackDamageSlaying": slaying };
        flags = mergeObject(flags, this.getItemFlags());

        let chatData = {
            content: contents,
            speaker: getMacroSpeaker(this.actor),
            flags
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return CONFIG.ChatMessage.documentClass.create(chatData);
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
                this.genericItemRoll(data.giftStats, data.defaultTN, itemData.name, data.giftArray, 0, { directroll }, (data.exhaustWhenUsed ? (x => { this.giftToggleExhaust("true"); }) : null));
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

    /**
     * Weapon attack roll function
     * @param {boolean} directroll Whether to attempt to roll without a dialog
     * @param {boolean} ignoreresist Ignore the resisted aspect of the attack
     * @param {number} presettn The TN to use
     * @param {number} opposingsuccesses The number of opposing successes for resisted attacks
     */
    async attackRoll(directroll = false, ignoreresist = false, presettn = 3, opposingsuccesses = -1, sourcemessage = null, defendermessage = null) {
        const item = this;
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Attack roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        // Make sure this weapon can actually attack
        if (data.canAttack == false) {
            return;
        }

        // If the weapon isn't readied and auto-ready is toggled on
        if (this.actor && !data.readied && data.readyWhenUsed) {
            const usable = await this.weaponReadyWhenUsed();
            if (!usable) {
                return; // If the weapon is not usable, return out
            }
        }

        // Grab the user's target
        let target = null;
        if (defendermessage) {
            target = getTokenFromSpeaker(defendermessage.data.speaker);
        } else if (game.user.targets?.size > 0) {
            [target] = game.user.targets;
        }

        // Prepare the relevant data
        const exhaust = this.weaponGetGiftToExhaust();
        const canQuickroll = data.hasResist && !ignoreresist;
        const sendToChat = game.settings.get("ironclaw2e", "sendWeaponExhaustMessage");
        const donotdisplay = game.settings.get("ironclaw2e", "calculateDoesNotDisplay");
        const needsRefreshed = game.settings.get("ironclaw2e", "weaponExhaustNeedsRefreshed");
        const callback = (async x => {
            if (exhaust) exhaust.giftToggleExhaust("true", sendToChat);
            await item.weaponAutoStow();
            const foo = await item.automaticDamageCalculation(x, ignoreresist, donotdisplay, opposingsuccesses);
            if (sourcemessage && foo) Ironclaw2EItem.transferTemplateFlags(sourcemessage, foo);
        });

        // If the weapon has a gift to exhaust that can't be found or is exhausted, warn about it or pop a refresh request about it respectively instead of the roll
        if (data.exhaustGift && !data.exhaustGiftWhenReadied && !exhaust) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustAbort", { "name": itemData.name }));
        } else if (data.exhaustGift && !data.exhaustGiftWhenReadied && needsRefreshed && exhaust?.giftUsable() === false) {
            // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            exhaust.popupRefreshGift();
        } else {
            // Actually roll
            this.genericItemRoll(data.attackStats, presettn, itemData.name, data.attackArray, 2, { "directroll": canQuickroll && directroll, target }, callback);
        }
    }

    /**
     * Weapon defense roll function
     * @param {boolean} directroll Whether to attempt to roll without a dialog
     * @param {object} otheritem The other side's data
     * @param {string} extradice Extra dice
     */
    async defenseRoll(directroll = false, otheritem = null, extradice = "") {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Defense roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        // Make sure the weapon can actually defend
        if (data.canDefend == false) {
            return;
        }

        // If the weapon isn't readied and auto-ready is toggled on
        if (this.actor && !data.readied && data.readyWhenUsed) {
            const usable = await this.weaponReadyWhenUsed();
            if (!usable) {
                return; // If the weapon is not usable, return out
            }
        }

        // Pop the roll
        this.genericItemRoll(data.defenseStats, -1, itemData.name, data.defenseArray, 1, { directroll, otheritem, extradice },
            (x => { Ironclaw2EActor.addCallbackToAttackMessage(x?.message, otheritem?.messageId); }));
    }

    /**
     * Weapon counter roll function
     * @param {boolean} directroll Whether to attempt to roll without a dialog
     * @param {object} otheritem The other side's data
     * @param {string} extradice Extra dice
     */
    async counterRoll(directroll = false, otheritem = null, extradice = "") {
        const item = this;
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Counter roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        // Make sure the weapon can actually counter
        if (data.canCounter == false) {
            return;
        }

        // If the weapon isn't readied and auto-ready is toggled on
        if (this.actor && !data.readied && data.readyWhenUsed) {
            const usable = await this.weaponReadyWhenUsed();
            if (!usable) {
                return; // If the weapon is not usable, return out
            }
        }

        // Prepare the relevant data
        const exhaust = this.weaponGetGiftToExhaust();
        const sendToChat = game.settings.get("ironclaw2e", "sendWeaponExhaustMessage");
        const needsRefreshed = game.settings.get("ironclaw2e", "weaponExhaustNeedsRefreshed");
        const callback = (async x => {
            if (exhaust) exhaust.giftToggleExhaust("true", sendToChat);
            await item.weaponAutoStow();
            await item.automaticDamageCalculation(x);
            Ironclaw2EActor.addCallbackToAttackMessage(x?.message, otheritem?.messageId);
        });

        // If the weapon has a gift to exhaust that can't be found or is exhausted, warn about it or pop a refresh request about it respectively instead of the roll
        if (data.exhaustGift && !data.exhaustGiftWhenReadied && !exhaust) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.weaponGiftExhaustAbort", { "name": itemData.name }));
        } else if (data.exhaustGift && !data.exhaustGiftWhenReadied && needsRefreshed && exhaust?.giftUsable() === false) {
            // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            exhaust.popupRefreshGift();
        } else {
            // Actually roll
            this.genericItemRoll(data.counterStats, -1, itemData.name, data.counterArray, 3, { directroll, otheritem, extradice }, callback);
        }
    }

    /**
     * Weapon spark roll function
     * @param {boolean} directroll Whether to attempt to roll without a dialog
     */
    async sparkRoll(directroll = false) {
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;

        if (!(itemData.type === 'weapon')) {
            console.error("Spark roll attempted on a non-weapon item: " + itemData.name);
            return;
        }

        // Make sure the weapon has a spark roll
        if (data.canSpark == false) {
            return;
        }

        // If the weapon isn't readied and auto-ready is toggled on
        if (this.actor && !data.readied && data.readyWhenUsed) {
            const usable = await this.weaponReadyWhenUsed();
            if (!usable) {
                return; // If the weapon is not usable, return out
            }
        }

        // Depending on the directroll setting, either show the simple dialog or do the roll automatically
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
    genericItemRoll(stats, tn, diceid, dicearray, rolltype = 0, { directroll = false, otheritem = null, target = null, extradice = "" } = {}, callback = null) {
        let tnyes = (tn > 0);
        let usedtn = (tn > 0 ? tn : 3);
        if (this.actor) {
            // If the weapon has separate dice, add a new dice field to the popup dialog construction
            let formconstruction = ``;
            let moredice = null;
            if (Array.isArray(dicearray)) {
                moredice = formDicePoolField(dicearray, diceid, `${diceid}: ${reformDiceString(dicearray, true)}`, true, { "itemid": this.id });
            }

            // Prepare the actual dice input object separately from the roll types
            formconstruction = (moredice ? moredice.otherinputs : "");
            const diceinput = {
                "prechecked": stats, "tnyes": tnyes, "tnnum": usedtn, "otherkeys": (moredice ? moredice.otherkeys : new Map()), "otherdice": (moredice ? moredice.otherdice : new Map()),
                "othernames": (moredice ? moredice.othernames : new Map()),"otherinputs": formconstruction, "otherbools": (moredice ? moredice.otherbools : new Map()), "otherlabel": "", "extradice": extradice
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
                    this.actor.popupAttackRoll(diceinput, { directroll, target }, this, callback);
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
        else if (game.user.isGM) {
            // For rolls on items without actors
            const results = rollVariableOneLine(tnyes, usedtn, dicearray ? reformDiceString(dicearray) : "");
            // Anonymous async function to handle the callback
            (async function () {
                const foo = await results;
                if (foo && callback) callback(foo);
            })();
        }
    }

    /* -------------------------------------------- */
    /*  Item Popup Functions                        */
    /* -------------------------------------------- */

    /**
     * Pop up a dialog box to confirm changing the exhaustion state of the gift
     * @param {boolean} mode What state to change to
     */
    async popupGiftExhaustToggle(mode) {
        if (this.data.type != "gift") {
            console.error("Tried to set exhaust on a non-gift item: " + this);
            return null;
        }

        const item = this.data;
        const itemData = item.data;
        const speaker = getMacroSpeaker(this.actor);

        const sendToChat = game.settings.get("ironclaw2e", "defaultSendGiftExhaust");
        const title = mode ? "ironclaw2e.dialog.exhaustGift.title" : "ironclaw2e.dialog.refreshGift.title";
        const message = mode ? "ironclaw2e.dialog.exhaustGift.header" : "ironclaw2e.dialog.refreshGift.header";
        const button = mode ? "ironclaw2e.dialog.exhaust" : "ironclaw2e.dialog.refresh";

        const confirmation = await popupConfirmationBox(title, message, button, { "includesend": true, "senddefault": sendToChat, "itemname": item.name, "actorname": speaker.alias });

        if (confirmation.confirmed) {
            return await this.giftToggleExhaust(mode.toString(), confirmation.chatSent);
        }
        return null;
    }

    /**
     * Pop up a dialog box to confirm refreshing a gift
     */
    popupRefreshGift() {
        return this.popupGiftExhaustToggle(false);
    }

    /**
     * Pop up a dialog box to confirm exhausting a gift
     */
    popupExhaustGift() {
        return this.popupGiftExhaustToggle(true);
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
            const needsRefreshed = game.settings.get("ironclaw2e", "weaponExhaustNeedsRefreshed");
            // If the weapon needs a refreshed gift to use and the gift is not refreshed, immediately pop up a refresh request on that gift
            if (needsRefreshed && exhaust?.giftUsable() === false) {
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
