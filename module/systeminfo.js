import { makeCompareReady } from "./helpers.js";

/** Common class for common system info that might be used */
export class CommonSystemInfo {
    /**
     * List of stats that are limited by the Burdened condition
     */
    static burdenedList = Object.freeze(["speed", "climbing", "dodge", "endurance", "jumping", "stealth", "swimming"]);
    /**
     * The standard stats used for soak rolls
     */
    static soakBaseStats = ["body"];
    /**
     * The standard stats used for dodge defense rolls
     */
    static dodgingBaseStats = ["speed", "dodge"];
    /**
     * List of CSS colors to use for different message types
     */
    static resultColors = { success: "green", tie: "darkgoldenrod", normal: "black", failure: "black", botch: "red" };
    /**
     * Font size assigned to the dice result message
     */
    static resultFontSize = "1.7em";
    /**
     * Font size assigned to the highest die result message for target number rolls
     */
    static resultSmallFontSize = "1.1em";
    /**
     * Font size assigned to the highest die result message for target number rolls
     */
    static resultTNMarginSize = "0.3em";
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
     * The range bands in the correct order, in an array for easier access to the next one
     */
    static rangeBandsArray = ["close", "reach", "near", "short", "medium", "long", "verylong", "extreme", "far", "horizon"];
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
        "attackBonus": "Attack Bonus", "defenseBonus": "Defense Bonus", "counterBonus": "Counter Bonus", "resistBonus": "Resist Bonus", "soakBonus": "Soak Bonus", "guardBonus": "Guard Bonus", "aimBonus": "Aim Bonus",
        "sprintBonus": "Sprint Bonus", "initiativeBonus": "Initiative Bonus", "moveBonus": "Movement Bonus", "flyingBonus": "Flying Move Bonus", "encumbranceBonus": "Encumbrance Limit Bonus",
        "currencyValueChange": "Currency Value Change", "statChange": "Stat Change", "diceUpgrade": "Dice Upgrade"
    };
    /**
     * The state of gift exhaustion when the bonus can work
     */
    static giftWorksStates = {
        "anyState": "Any State", "refreshed": "Refreshed", "exhausted": "Exhausted"
    };
    /**
     * The name to check for in weapon's "defend with" field to use the standard defense against it
     * Anything that's _not_ this string is assumed to be a special defense, and the field to be traits and skills separated with commas
     */
    static defenseStandardName = "defense"
    /**
     * The names of the different currencies used in the code
     */
    static currencyNames = ["baseCurrency", "addedCurrency1", "addedCurrency2", "addedCurrency3"];
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
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("defenseBonus"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState",
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "appliesToDodges": true, "appliesToParries": true, "appliesToSpecialDefenses": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("counterBonus"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState",
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("resistBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("soakBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("guardBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusDiceField": "", "replaceNameField": "", "replacesBaseBonus": true
            });
            break;

        case ("aimBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusDiceField": "", "replaceNameField": "", "replacesBaseBonus": true
            });
            break;

        case ("sprintBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("initiativeBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "replaceNameField": ""
            });
            break;

        case ("moveBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "replaceNameField": ""
            });
            break;

        case ("flyingBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "replaceNameField": ""
            });
            break;

        case ("encumbranceBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "encumbranceBonusNumber": 0, "replaceNameField": ""
            });
            break;

        case ("currencyValueChange"):
            return mergeObject(special, {
                "otherOwnedItemField": "", "worksWhenState": "anyState",
                "currencyName": "addedCurrency1", "currencyValue": "0", "replaceNameField": ""
            });
            break;

        case ("statChange"):
            return mergeObject(special, {
                "typeField": "", "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "otherOwnedItemField": "",
                "changeFromField": "", "changeToField": "", "nameAdditionField": ""
            });
            break;

        case ("diceUpgrade"):
            return mergeObject(special, {
                "typeField": "", "nameField": "", "tagField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "otherOwnedItemField": "",
                "upgradeStepsNumber": 0, "nameAdditionField": ""
            });
            break;

        default:
            console.error("Attempted to get a non-existing special option prototype! " + option);
            return null;
            break;
    }
}

/**
 * Get the distance in paces from a range band
 * @param {string} band The range band
 * @returns {number} The distance in paces
 */
export function getRangeDistanceFromBand(band) {
    return (CommonSystemInfo.rangePaces.hasOwnProperty(band) ? CommonSystemInfo.rangePaces[band] : -1);
}

/**
 * Get the distance in paces from a range band
 * @param {string} band The range band
 * @returns {{ minRange: number, maxRange: number } | null} The minimum and maximum ranges of the band
 */
export function getRangeMinMaxFromBand(band) {
    const index = CommonSystemInfo.rangeBandsArray.indexOf(band);
    if (index >= 0) {
        const max = getRangeDistanceFromBand(band);
        const min = index > 0 ? getRangeDistanceFromBand(CommonSystemInfo.rangeBandsArray[index - 1]) + 0.01 : 0;
        if (max >= 0 && min >= 0) {
            return { "minRange": min, "maxRange": max };
        }
    }
    return null;
}

/**
 * Get the band from a distance in paces, rounding upwards
 * @param {number} distance The distance in paces
 * @returns {string | null} The range band, or null if given a NaN
 */
export function getRangeBandFromDistance(distance) {
    if (isNaN(distance)) {
        console.error("Attempted to get a distance that is not a number: " + distance);
        return null;
    }
    const foobar = Object.entries(CommonSystemInfo.rangePaces).sort((a, b) => a[1] - b[1]);
    for (const band of foobar) {
        if (distance <= band[1])
            return band[0];
    }
    console.warn("Attempted to get a distance further away than the max range: " + distance);
    return foobar[foobar.length - 1][0];
}

/**
 * Simple function to check whether the defense field is for the standard defense or not
 * @param {string} defense
 * @returns {boolean} Returns true if the defense is standard, false if not
 */
export function checkStandardDefense(defense) {
    return (makeCompareReady(defense) === CommonSystemInfo.defenseStandardName);
}