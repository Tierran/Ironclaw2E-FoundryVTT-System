import { makeCompareReady } from "./helpers.js";

/**
 * @typedef {{
 *   minRange: number,
 *   maxRange: number
 * }} RangeBandMinMax
 */

/**
 * @typedef {{
 *   rangeDice: string,
 *   rangeBandUsed: string
 *   rangeBandOriginal: string
 * }} RangeDiceReturn
 */

/**
 * @typedef {{
 *   label: string,
 *   visionName: string,
 *   detectionModes: Array<ExtraSenseDetectionData>,
 *   detectionPassives: Array<ExtraSenseDetectionData>
 * }} ExtraSenseData
 */

/**
 * @typedef {{
 *   id: string,
 *   range: number | null
 * }} ExtraSenseDetectionData
 */

// Commonly in the system, die types are referred to with integers based around their index position in the system's dice arrays, whether or not they're actually in an array:
// [0] = d12's, [1] = d10's, [2] = d8's, [3] = d6's, [4] = d4's
// 0 = d12, 1 = d10, 2 = d8, 3 = d6, 4 = d4

// So a die type of 2 would refer to a d8

/** Common class for common system info that might be used */
export class CommonSystemInfo {

    /* -------------------------------------------- */
    /*  Common System Variables                     */
    /* -------------------------------------------- */

    /**
     * List of stats that are limited by the Burdened condition
     */
    static burdenedList = Object.freeze(["speed", "climbing", "dodge", "endurance", "jumping", "stealth", "swimming"]);
    /**
     * The integer die-type the Burdened condition limits to
     */
    static burdenedLimit = 2;
    /**
     * The standard stats used for soak rolls
     */
    static soakBaseStats = Object.freeze(["body"]);
    /**
     * The vehicle stats used for soak rolls
     */
    static soakVehicleStats = Object.freeze(["soak"]);
    /**
     * The standard stats used for dodge defense rolls
     */
    static dodgingBaseStats = Object.freeze(["speed", "dodge"]);
    /**
     * The standard stats used for rallying rolls
     */
    static rallyBaseStats = Object.freeze(["will", "leadership"]);
    /**
     * The standard stats used for initiative rolls
     */
    static initiativeBaseStats = Object.freeze(["speed", "mind"]);
    /**
     * The standard stats used for sprint rolls
     */
    static sprintBaseStats = Object.freeze(["speed"]);

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
     * Contains sets for each actor type that determines what sorts of items the system will allow them to have
     */
    static actorAllowedTypes = {
        "character": new Set(["gift", "weapon", "armor", "shield", "illumination", "extraCareer", "speciesTemplate", "careerTemplate", "item"]),
        "mook": new Set(["gift", "weapon", "armor", "shield", "illumination", "extraCareer", "speciesTemplate", "careerTemplate", "item"]),
        "beast": new Set(["gift", "weapon", "armor", "shield", "illumination", "extraCareer", "speciesTemplate", "careerTemplate", "item"]),
        "marker": new Set([]),
        "vehicle": new Set(["weapon", "armor", "shield", "illumination", "item", "vehicleStation", "vehicleModification"])
    };

    /**
     * The handedness of a weapon
     */
    static equipHandedness = { "goodhand": "Good hand", "offhand": "Off hand", "twohands": "Two hands", "strapped": "Strapped to arm", "other": "Other" };
    /**
     * The range of a weapon
     */
    static rangeBands = {
        "close": "Close", "reach": "Reach", "near": "Near", "short": "Short", "medium": "Medium", "long": "Long",
        "verylong": "Very Long", "extreme": "Extreme", "far": "Far", "horizon": "Horizon"
    };
    /**
     * The range bands in the order of shortest to longest
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
     * The penalties for each range
     */
    static rangeDice = {
        "close": "", "reach": "", "near": "", "short": "d8", "medium": "d12", "long": "2d12",
        "verylong": "3d12", "extreme": "4d12", "far": "5d12", "horizon": "6d12"
    };
    /**
     * The over maximum range penalty, if allowed
     * Pure homebrew, here mostly as a placeholder option
     */
    static rangeOverMaxDice = "12d12";
    /**
     * The combat advantage bonus
     */
    static combatAdvantageDice = "d8";
    /**
     * The name to check for in weapon's "defend with" field to use the standard defense against it
     * Anything that's _not_ this string is assumed to be a special defense, and the field to be traits and skills separated with commas
     */
    static defenseStandardName = "defense"

    /**
     * The special option types that gift items can have
     */
    static giftSpecialOptions = {
        "attackBonus": "Attack Bonus", "defenseBonus": "Defense Bonus", "counterBonus": "Counter Bonus", "resistBonus": "Resist Bonus", "soakBonus": "Soak Bonus", "guardBonus": "Guard Bonus", "aimBonus": "Aim Bonus",
        "sprintBonus": "Sprint Bonus", "initiativeBonus": "Initiative Bonus", "moveBonus": "Movement Bonus", "flyingBonus": "Flying Move Bonus", "rerollBonus": "Reroll Bonus", "rangePenaltyReduction": "Range Penalty Reduction",
        "encumbranceBonus": "Encumbrance Limit Bonus", "currencyValueChange": "Currency Value Change", "statChange": "Stat Change", "diceUpgrade": "Dice Upgrade"
    };
    /**
     * Special option types that use fields normally reserved for item checks for other data
     */
    static giftItemlessOptions = new Set(["rerollBonus"]);
    /**
     * Special option types that can default to the gift's skill in some way
     */
    static giftGenericSkillOptions = new Set(["rerollBonus"]);
    /**
     * The state of gift exhaustion when the bonus can work
     */
    static giftWorksStates = {
        "anyState": "Any State", "refreshed": "Refreshed", "exhausted": "Exhausted"
    };
    /**
     * The auto-use state, whether the gift is always or never checked, or whether that's controlled by applicability settings and the bonus always shows on the list
     */
    static giftBonusAutoUseOptions = {
        "always": "Always", "never": "Never", "applied": "By Applicability"
    };

    /**
     * The roll result possibilities for vehicle stations
     */
    static vehicleRollResults = {
        "genericResult": "Generic Result", "attackResult": "Attack Result",
    };

    /**
     * Reroll types that exist within the system and the associated translation strings
     */
    static rerollTypes = {
        "FAVOR": "ironclaw2e.dialog.reroll.typeFavor",
        "LUCK": "ironclaw2e.dialog.reroll.typeLuck",
        "KNACK": "ironclaw2e.dialog.reroll.typeKnack",
        "KEEN": "ironclaw2e.dialog.reroll.typeKeen",
        "ONE": "ironclaw2e.dialog.reroll.typeOne"
    };

    /**
     * The names of the different currencies used in the code
     */
    static currencyNames = ["baseCurrency", "addedCurrency1", "addedCurrency2", "addedCurrency3"];
    /**
     * The values and names of the diagonal measurement rules
     */
    static diagonalRules = {
        "EUCL": "Euclidean",
        "RDCL": "Rounded Euclidean",
        "ONTW": "One-Two Diagonals",
        "SAME": "Equidistant"
    };
    /**
     * The rule settings used to determine whether combat rules are used in distance measuring
     */
    static rangeCombatRules = { 0: "Never", 1: "In Combat", 2: "Always" };
    /**
     * The default light source settings, caused by the On Fire condition
     */
    static fireConditionLightSource = {
        "dim": 4, "bright": 1, "angle": 360, "color": "#fe4c10", "alpha": 0.35, "animation": {
            "type": "flame", "speed": 5, "intensity": 7
        }
    };

    /**
     * Default vision settings for a token
     */
    static defaultVision = { "range": 0, "visionMode": "basic" };
    /**
     * The list of extra senses a gift can give, alongside system data about what they do
     * @enum [ExtraSenseData]
     */
    static extraSenses = {
        //"basic": { label: "VISION.ModeBasicVision", visionName: "basic", detectionModes: [], detectionPassives: [] },
        "nightVision": { label: "ironclaw2e.info.sense.nightVision", visionName: "nightVision", detectionModes: [], detectionPassives: [] },
        "echolocation": { label: "ironclaw2e.info.sense.echolocation", visionName: "echolocation", detectionModes: [{ id: "emitUltrasound", range: null }, { id: "basicSight", range: 0 }], detectionPassives: [{ id: "hearUltrasound", range: 100}] },
        "keenEars": { label: "ironclaw2e.info.sense.keenEars", visionName: "", detectionModes: [], detectionPassives: [{ id: "hearUltrasound", range: 100 }] }
    };

    /**
     * Vehicle classes
     */
    static vehicleClasses = {
        "dispatch": "ironclaw2e.info.vehicleClass.dispatch",
        "tender": "ironclaw2e.info.vehicleClass.tender",
        "cargo": "ironclaw2e.info.vehicleClass.cargo",
        "middling": "ironclaw2e.info.vehicleClass.middling",
        "great": "ironclaw2e.info.vehicleClass.great",
        "other": "ironclaw2e.info.vehicleClass.other"
    };
    /**
     * Vehicle needed draft levels
     */
    static vehicleDraftLevels = {
        "none": "ironclaw2e.info.vehicleDraft.none",
        "shallow": "ironclaw2e.info.vehicleDraft.shallow",
        "deep": "ironclaw2e.info.vehicleDraft.deep",
        "veryDeep": "ironclaw2e.info.vehicleDraft.veryDeep"
    };
    /**
     * Vehicle station staffing levels
     */
    static vehicleStationStaffing = {
        "fullyStaffed": "ironclaw2e.info.vehicleStationCondition.fullyStaffed",
        "understaffed": "ironclaw2e.info.vehicleStationCondition.understaffed",
        "abandoned": "ironclaw2e.info.vehicleStationCondition.abandoned"
    };
    /**
     * Vehicle station physical conditions
     */
    static vehicleStationStaffing = {
        "intact": "ironclaw2e.info.vehicleStationCondition.intact",
        "damaged": "ironclaw2e.info.vehicleStationCondition.damaged",
        "destroyed": "ironclaw2e.info.vehicleStationCondition.destroyed"
    };
    /**
     * Vehicle station mental conditions
     */
    static vehicleStationStaffing = {
        "fine": "ironclaw2e.info.vehicleStationCondition.fine",
        "afraid": "ironclaw2e.info.vehicleStationCondition.afraid"
    };
}

/* -------------------------------------------- */
/*  Gift Special Options                        */
/* -------------------------------------------- */

/**
 * Get an empty base prototype for a given type of gift special option object
 * @param {string} option The special option type to get
 * @returns {object} The default empty special option
 */
export function getGiftSpecialOptionPrototype(option) {
    let special = { "settingMode": option };

    switch (option) {
        case ("attackBonus"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState", "needsSecondReadiedWeapon": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("defenseBonus"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState", "needsSecondReadiedWeapon": false,
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "appliesToDodges": true, "appliesToParries": true, "appliesToSpecialDefenses": true,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("counterBonus"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState", "needsSecondReadiedWeapon": false,
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("resistBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "nameOtherField": "", "descriptorOtherField": "", "effectOtherField": "", "statOtherField": "", "equipOtherField": "", "rangeOtherField": "", "useActualRange": true, "appliesLongerRange": false, "appliesShorterRange": false,
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("soakBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
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
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("initiativeBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusSourcesField": "", "bonusStatsField": "", "bonusDiceField": "", "bonusAutoUsed": "always", "bonusExhaustsOnUse": false, "replaceNameField": ""
            });
            break;

        case ("moveBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "ignoreBadFooting": false, "replaceNameField": ""
            });
            break;

        case ("flyingBonus"):
            return mergeObject(special, {
                "conditionField": "", "otherOwnedItemField": "", "worksWhenState": "anyState",
                "bonusStrideNumber": 0, "bonusDashNumber": 0, "bonusRunNumber": 0, "replaceNameField": ""
            });
            break;

        case ("rerollBonus"):
            return mergeObject(special, {
                "statField": "", "conditionField": "", "worksWhenState": "anyState", "allowOnOthers": false,
                "rerollType": "FAVOR", "bonusExhaustsOnUse": false, "identifierOverride": "", "replaceNameField": ""
            });
            break;

        case ("rangePenaltyReduction"):
            return mergeObject(special, {
                "nameField": "", "descriptorField": "", "effectField": "", "statField": "", "equipField": "", "rangeField": "", "conditionField": "", "worksWhenState": "anyState", "appliesToRallying": false,
                "penaltyReductionNumber": 0, "replaceNameField": ""
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


/* -------------------------------------------- */
/*  Vehicle Station Objects                     */
/* -------------------------------------------- */

/**
 * Get an empty base prototype for a given type of vehicle station result object
 * @param {string} option The station result type to get
 * @returns {object} The default empty station result
 */
export function getVehicleStationResultPrototype(option) {
    let special = { "resultMode": option };

    switch (option) {
        case ("genericResult"):
            return mergeObject(special, {
                "successNumber": "", "nameField": "", "effectField": "", "specialCaseField": "", "needsToBeFine": false
            });
            break;

        case ("attackResult"):
            return mergeObject(special, {
                "successNumber": "", "nameField": "", "effectField": "", "specialCaseField": "", "needsToBeFine": false,
                "permitsDefense": true, "rangeField": "long", "damageNumber": 0, "burningNumber": 0
            });
            break;

        default:
            console.error("Attempted to get a non-existing station result prototype! " + option);
            return null;
            break;
    }
}

/**
 * Get an empty base prototype for a vehicle station special load for attacks
 * @returns {object} The default empty special load
 */
export function getVehicleSpecialLoadPrototype() {
    return {
        "nameField": "", "effectField": "",
        "damageNumber": 0, "burningNumber": 0, "weakDamage": false
    };
}


/* -------------------------------------------- */
/*  System Info Helpers                         */
/* -------------------------------------------- */

/**
 * Get the distance in paces from a range band
 * @param {string} band The range band
 * @returns {number} The distance in paces
 */
export function getRangeDistanceFromBand(band) {
    return (CommonSystemInfo.rangePaces.hasOwnProperty(band) ? CommonSystemInfo.rangePaces[band] : -1);
}

/**
 * Get the actual range band in paces from a range band
 * @param {string} band The range band
 * @returns {RangeBandMinMax | null} The minimum and maximum ranges of the band in paces, minimum exclusive unless zero, maximum inclusive
 */
export function getRangeMinMaxFromBand(band) {
    const index = CommonSystemInfo.rangeBandsArray.indexOf(band);
    if (index >= 0) {
        const max = getRangeDistanceFromBand(band);
        const min = index > 0 ? getRangeDistanceFromBand(CommonSystemInfo.rangeBandsArray[index - 1]) : 0;
        if (max >= 0 && min >= 0) {
            return { "minRange": min, "maxRange": max };
        }
    }
    return null;
}

/**
 * Get the band from a distance in paces, rounding upwards
 * @param {number} distance The distance in paces
 * @param {boolean} readable Whether to return a compare-ready key or a readable name
 * @returns {string | null} The range band, or null if given a NaN
 */
export function getRangeBandFromDistance(distance, readable = false) {
    if (isNaN(distance)) {
        console.error("Attempted to get a distance that is not a number: " + distance);
        return null;
    }
    // Sort the ranges from shortest to longest, just in case
    const foobar = Object.entries(CommonSystemInfo.rangePaces).sort((a, b) => a[1] - b[1]);
    for (const band of foobar) { // Loop through the range bands and return the one where the distance is equal or less than the band's
        if (distance <= band[1])
            return readable ? CommonSystemInfo.rangeBands[band[0]] : band[0];
    }
    console.warn("Attempted to get a distance further away than the max range: " + distance);
    return readable ? "Over Maximum" : "overmax";
}

/**
 * Get the range dice for the matching band
 * @param {string} band The range band
 * @param {number} reduction The degree of range reduction
 * @param {boolean} readable Whether the range band names are compare-ready keys or human-readable names
 * @returns {RangeDiceReturn} The range dice and range band
 */
export function getRangeDiceFromBand(band, reduction = 0, readable = false) {
    let usedBand = band;
    if (reduction > 0) { // If there is usable range reduction, get the actual penalty 
        const index = CommonSystemInfo.rangeBandsArray.indexOf(band);
        usedBand = CommonSystemInfo.rangeBandsArray[(index - reduction >= 0 ? index - reduction : 0)];
    }
    return {
        "rangeDice": (CommonSystemInfo.rangeDice.hasOwnProperty(usedBand) ? CommonSystemInfo.rangeDice[usedBand] : ""),
        "rangeBandUsed": readable ? CommonSystemInfo.rangeBands[usedBand] : usedBand, "rangeBandOriginal": readable ? CommonSystemInfo.rangeBands[band] : band
    };
}

/**
 * Get the range dice matching the distance given
 * @param {number} distance The range band
 * @param {number} reduction The degree of range reduction
 * @param {boolean} allowovermax Whether to allow a dice penatly for over maximum distance, or just return an error
 * @param {boolean} readable Whether the range band names are compare-ready keys or human-readable names
 * @returns {RangeDiceReturn} The range dice and range band
 */
export function getRangeDiceFromDistance(distance, reduction = 0, allowovermax = false, readable = false) {
    const band = getRangeBandFromDistance(distance);
    // A very complicated-looking get, which gets the distance for the last range band in the system info, to compare against the distance given
    if (distance > CommonSystemInfo.rangePaces[CommonSystemInfo.rangeBandsArray[CommonSystemInfo.rangeBandsArray.length - 1]]) {
        // If the distance is longer than the maximum range band, return either an error message or a max range dice setting
        return {
            "rangeDice": (allowovermax ? CommonSystemInfo.rangeOverMaxDice : "error"),
            "rangeBandUsed": readable ? "Over Maximum" : "overmax", "rangeBandOriginal": readable ? "Over Maximum" : "overmax"
        };
    }
    if (band)
        return getRangeDiceFromBand(band, reduction, readable);
    return { "rangeDice": "", "rangeBandUsed": "", "rangeBandOriginal": "" };
}

/**
 * Simple function to check whether the defense field is for the standard defense or not
 * @param {string} defense
 * @returns {boolean} Returns true if the defense is standard, false if not
 */
export function checkStandardDefense(defense) {
    return (makeCompareReady(defense) === CommonSystemInfo.defenseStandardName);
}

/** Simple function to get a property list for reroll types */
export function getSpecialSettingsRerolls() {
    const cloned = { ...CommonSystemInfo.rerollTypes };
    delete cloned["ONE"];
    return cloned;
}

/** Simple function to get a property list for a threat range selection */
export function getThreatRanges() {
    const same = { "same": game.i18n.localize("ironclaw2e.sheets.item.weaponStats.threatSameWeapon") };
    const cloned = { ...same, ...CommonSystemInfo.rangeBands };
    return cloned;
}

/**
 * Function to construct an object for the reroll dialog that only has the reroll types that can be used
 * @param {Map<string,any>} rerolltypes
 */
export function specialSettingsRerollIntersection(rerolltypes) {
    let foo = {};
    let first = null;
    for (let [key, value] of rerolltypes) {
        if (!first) first = key;
        foo[key] = value?.identifierOverride || game.i18n.localize(CommonSystemInfo.rerollTypes[key]);
    }
    return { "usableRerolls": foo, "firstType": first };
}

/**
 * Function to get the GM reroll type map for reroll dialog construction
 * @param {boolean} hasone Whether there is a one in the roll
 */
export function specialSettingsRerollGMMap(hasone) {
    let foo = new Map();
    for (let [bar, value] of Object.entries(CommonSystemInfo.rerollTypes)) {
        if (!hasone && (bar === "ONE" || bar === "FAVOR"))
            continue;
        foo.set(bar, null);
    }
    return foo;
}

/**
 * Function to check whether the given actor type is allowed to have the given item type
 * @param {string} actortype
 * @param {string} itemtype
 * @returns {boolean}
 */
export function checkActorItemAllowedType(actortype, itemtype) {
    if (!actortype || typeof actortype !== "string") {
        console.error("Actor item type check was given a non-existent actor type: " + actortype);
        return false;
    }
    if (!itemtype || typeof itemtype !== "string") {
        console.error("Actor item type check was given a non-existent item type: " + itemtype);
        return false;
    }

    if (!(actortype in CommonSystemInfo.actorAllowedTypes)) {
        console.warn("Actor item type check could not find the allowed sets for the actor type: " + actortype);
        return true;
    }

    return CommonSystemInfo.actorAllowedTypes[actortype].has(itemtype);
}