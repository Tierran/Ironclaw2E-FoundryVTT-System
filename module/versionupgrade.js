import { makeStatCompareReady } from "./helpers.js";
import { CommonSystemInfo, getSpecialOptionPrototype } from "./systeminfo.js";


/**
 * Split the version number of the system into its component parts and put them into an array
 * @param {string} version System version number as a string
 * @returns {number[]} Array containing the component numbers of the version number
 */
export function getVersionNumbers(version) {
    if (typeof (version) !== "string") {
        console.error("System version spliter given something that was not a string: " + version);
        return null;
    }

    let versionarray = [];
    let versiontest = new RegExp("(\\d+)\\.(\\d+)\\.(\\d+)?"); // Regex to match and split the version number

    if (versiontest.test(version)) {
        const result = version.match(versiontest);
        for (let i = 1; i < result.length; ++i) {
            versionarray.push(result[i]); // Push each separate number in the version to a separate index in the array
        }
    } else {
        console.error("System version splitter given something which could not be split: " + version);
        return null;
    }

    return versionarray;
}

/**
 * Check if the testing version number is newer than the base version number
 * @param {string} testing The version number to test
 * @param {string} baseversion The version number to test against
 * @returns {boolean} If true, the tested version is newer than the base version
 */
export function checkIfNewerVersion(testing, baseversion) {
    const oldver = getVersionNumbers(baseversion);
    const newver = getVersionNumbers(testing);

    for (let i = 0; i < newver.length; ++i) {
        if (newver[i] != oldver[i])
            return newver[i] > oldver[i];
    }

    return false;
}

/**
 * Check what data modifications upgrading from last version needs
 * @param {string} lastversion
 */
export async function upgradeVersion(lastversion) {
    if (getVersionNumbers(lastVersion)[0] < 4) {
        ui.notifications.info(game.i18n.localize("System update to 0.4 requires data migration, please wait..."), { permanent: true });

        // Item changes, first grab all items from everywhere
        let itemsToChange = [];
        let problemItems = [];
        for (let item of game.items) {
            itemsToChange.push(item);
        }
        for (let actor of game.actors) {
            for (let item of actor.items) {
                itemsToChange.push(item);
            }
        }
        for (let scene of game.scenes) {
            for (let token of scene.tokens) {
                if (token.actor) {
                    for (let item of token.actor.items) {
                        itemsToChange.push(item);
                    }
                }
            }
        }
        // The actual item change
        for (let item of itemsToChange) {
            if (item.type == "gift") {
                giftNameLookup(item);
            } else if (item.type == "weapon") {
                if (!weaponUpgradePointFour(item)) {
                    problemItems.push(item);
                }
            }
        }
    }
}

/**
 * Process the weapon data and upgrade it to the newer template values
 * @param {any} weapon
 * @returns {boolean} If the function returns false, there might be an issue with the automatic migration
 */
function weaponUpgradePointFour(weapon) {
    const weaponData = weapon.data.data;
    let updateData = {};
    let fail = true;
    if (weaponData.specialResist) {
        updateData["data.defendWith"] = weaponData.specialResist;
    }

    if (weaponData.equip) {
        if (weaponData.equip.toLowerCase().includes("good")) {
            updateData["data.equip"] = "goodhand";
        } else if (weaponData.equip.toLowerCase().includes("off")) {
            updateData["data.equip"] = "offhand";
        } else if (weaponData.equip.toLowerCase().includes("two") || weaponData.equip.toLowerCase().includes("2")) {
            updateData["data.equip"] = "twohands";
        } else {
            updateData["data.equip"] = "other";
        }
    } else {
        updateData["data.equip"] = "goodhand";
        fail = false;
    }

    if (weaponData.range) {
        const intAttempt = parseInt(weaponData.range);
        if (!isNaN(intAttempt)) {
            const foobar = Object.entries(CommonSystemInfo.rangePaces).sort((a, b) => a[1] - b[1]);
            let matchFound = false;
            for (const band of foobar) {
                if (intAttempt <= CommonSystemInfo.rangePaces[band]) {
                    updateData["data.range"] = band;
                    matchFound = true;
                    break;
                }
            }
            if (!matchFound) {
                updateData["data.range"] = "close";
                fail = false;
            }
        } else if (typeof (weaponData.range) === "string") {
            const foobar = makeStatCompareReady(weaponData.range);
            if (foobar in CommonSystemInfo.rangeBands) {
                updateData["data.range"] = foobar;
            } else {
                updateData["data.range"] = "close";
                fail = false;
            }
        } else {
            updateData["data.range"] = "close";
            fail = false;
        }
    } else {
        updateData["data.range"] = "close";
    }

    weapon.update(updateData);

    return fail;
}

/**
 * Gift name lookup and special setting system
 * @param {any} gift
 */
function giftNameLookup(gift) {
    const giftData = gift.data.data;
    let updateData = {};
    let settings = [];

    switch (makeStatCompareReady(gift.name)) {
        // Veteran
        case ("veteran"):
            settings.push(getSpecialOptionPrototype("guardBonus"));
            break;
        // Move bonuses
        case ("fastmover"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 1;
            settings[0].bonusDashNumber = 2;
            settings[0].bonusRunNumber = 6;
            break;
        case ("allfours"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 1;
            settings[0].bonusDashNumber = 2;
            settings[0].bonusRunNumber = 6;
            settings[0].conditionField = "All Fours";
            break;
        case ("coward"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 1;
            settings[0].bonusDashNumber = 3;
            settings[0].bonusRunNumber = 9;
            settings[0].conditionField = "Afraid, Terrified";
            break;
        case ("flightoftheprey"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 1;
            settings[0].bonusDashNumber = 4;
            settings[0].bonusRunNumber = 16;
            settings[0].conditionField = "Afraid";
            settings[0].replaceNameField = "Coward";
            break;
        case ("ophidian"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 2;
            settings[0].bonusDashNumber = -2;
            break;
        // Flight bonuses
        case ("fastmover"):
            settings.push(getSpecialOptionPrototype("flyingBonus"));
            settings[0].bonusStrideNumber = 3;
            settings[0].bonusRunNumber = 12;
            break;
        case ("wings"):
            settings.push(getSpecialOptionPrototype("flyingBonus"));
            settings[0].bonusStrideNumber = 1;
            break;
        // Attack bonuses
        case ("strength"):
            settings.push(getSpecialOptionPrototype("attackBonus"));
            settings[0].statField = "Brawling, Melee Combat, Throwing";
            settings.push(getSpecialOptionPrototype("encumbranceBonus"));
            settings[1].encumbranceBonusNumber = 1;
            break;
        case ("improvedstrength"):
            settings.push(getSpecialOptionPrototype("attackBonus"));
            settings[0].statField = "Brawling, Melee Combat, Throwing";
            settings[0].replaceNameField = "Strength";
            settings.push(getSpecialOptionPrototype("encumbranceBonus"));
            settings[1].encumbranceBonusNumber = 2;
            settings[0].replaceNameField = "Strength";
            break;
        // Giant
        case ("giant"):
            settings.push(getSpecialOptionPrototype("encumbranceBonus"));
            settings[0].encumbranceBonusNumber = 1;
            break;
    }

    updateData["data.specialSettings"] = settings;
    gift.update(updateData);
}