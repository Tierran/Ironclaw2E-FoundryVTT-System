/** Common class for common system info that might be used */
export class CommonSystemInfo {
    /**
     * List of stats that are limited by the Burdened condition
     */
    static burdenedList = Object.freeze(["speed", "climbing", "dodge", "endurance", "jumping", "stealth", "swimming"]);
    /**
     * List of CSS colors to use for different message types
     */
    static resultColors = { success: "green", tie: "darkgoldenrod", normal: "black", failure: "black", botch: "red" };
    /**
     * Font size assigned to the dice result message
     */
    static resultFontSize = "1.7em";
    /**
     * The handedness of a weapon
     */
    static equipHandedness = { "goodhand": "Good hand", "offhand": "Off hand", "twohands": "Two hands", "other": "Other" };
    /**
     * The range of a weapon
     */
    static rangeBands = {
        "close": "Close", "reach": "Reach", "near": "Near", "short": "Short", "medium": "Medium", "long": "Long",
        "verylong": "Very Long", "extreme": "Extreme", "far": "Far", "horizon": "Horizon"
    };
    /**
     * The amount of paces each range band maps to
     */
    static rangePaces = {
        "close": 1, "reach": 2, "near": 4, "short": 12, "medium": 36, "long": 100,
        "verylong": 300, "extreme": 1000, "far": 3000, "horizon": 11000
    };
    /**
     * The special option types that gift items can have
     */
    static giftSpecialOptions = {
        "attackBonus": "Attack Bonus", "defenseBonus": "Defense Bonus", "counterBonus": "Counter Bonus", "soakBonus": "Soak Bonus", "guardBonus": "Guard Bonus", "sprintBonus": "Sprint Bonus",
        "initiativeBonus": "Initiative Bonus", "moveBonus": "Movement Bonus", "flyingBonus": "Flying Move Bonus", "statChange": "Stat Change", "diceUpgrade": "Dice Upgrade"
    }
}

/**
 * Get an empty base prototype for a given type of special option object
 * @param {string} option The special option type to get
 * @returns {object} The default empty special option
 */
export function getSpecialOptionPrototype(option) {
    let special = { "settingMode": option };

    switch (option) {
        case ("attackBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "equipField": "", "rangeField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("defenseBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "equipField": "", "rangeField": "", "worksWhenExhausted": true,
                "appliesToDodge": true, "appliesOnlyToDodge": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("counterBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "equipField": "", "rangeField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("soakBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("guardBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("sprintBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("initiativeBonus"):
            return mergeObject(special, {
                "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "conditionField": "", "worksWhenExhausted": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("moveBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherItemField": "", "worksWhenExhausted": true,
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "replaceNameField": ""
            });
            break;

        case ("flyingBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherItemField": "", "worksWhenExhausted": true,
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "replaceNameField": ""
            });
            break;

        case ("encumbranceBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherItemField": "", "worksWhenExhausted": true,
                "encumbranceBonusNumber": 0, "replaceNameField": ""
            });
            break;

        case ("statChange"):
            return mergeObject(special, {
                "typeField": "", "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "otherItemField": "", "equipField": "", "rangeField": "",
                "changeFromField": "", "changeToField": "", "nameAdditionField": ""
            });
            break;

        case ("diceUpgrade"):
            return mergeObject(special, {
                "typeField": "", "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "otherItemField": "", "equipField": "", "rangeField": "",
                "upgradeStepsNumber": 0, "nameAdditionField": ""
            });
            break;

        default:
            console.error("Attempted to get a non-existing special option prototype! " + option);
            return null;
            break;
    }
}