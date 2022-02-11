import { makeCompareReady, getAllItemsInWorld, getAllActorsInWorld } from "./helpers.js";
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
    // Version 0.4 check
    let version = "0.4.0";
    if (checkIfNewerVersion(version, lastversion)) { // If 0.4 would be newer than the last recorded version, it means it's pre-0.4 and needs the gift update
        ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationNotice", {"version": version}), { permanent: true });

        // Item changes, first grab all items from everywhere
        let itemsToChange = getAllItemsInWorld();
        let problemItems = [];

        // The actual item change
        for (let item of itemsToChange) {
            if (item.type == "gift") {
                await giftNameLookup(item);
            } else if (item.type == "weapon") {
                if (!(await weaponUpgradePointFour(item))) {
                    problemItems.push(item);
                }
            }
        }

        // In case of potential problems the GM might need to check
        if (problemItems.length > 0) {
            ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationWarning", { "version": version }), { permanent: true });
            problemItemToChat(problemItems);
        } else {
            ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationComplete", { "version": version }), { permanent: true });
        }

        console.log("0.4, Gift refactor update, done!");
    }

    // Version 0.5.5 check
    version = "0.5.5";
    if (checkIfNewerVersion(version, lastversion)) { // Same deal, if 0.5.5 is newer than the last version, it means it's pre-0.5.5
        ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationNotice", { "version": version }), { permanent: true });

        // Currency changes
        let allActors = getAllActorsInWorld();

        // Currency update for all actors
        for (let actor of allActors) {
            await currencyUpgradePointFiveFive(actor);
        }

        ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationComplete", { "version": version }), { permanent: true });
        console.log("0.5.5, currency upgrade, done!");
    }

    // Version 0.5.6 check
    version = "0.5.6";
    if (checkIfNewerVersion(version, lastversion)) {
        ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationNotice", { "version": version }), { permanent: true });

        // Item changes, first grab all items from everywhere
        let itemsToChange = getAllItemsInWorld("gift");
        let problemItems = [];

        // Validate the data for special settings
        for (let item of itemsToChange) {
            const foo = await giftUpgradePointFiveSix(item);
            if (!(foo)) {
                problemItems.push(item);
            }
        }

        // In case of potential problems the GM might need to check
        if (problemItems.length > 0) {
            ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationWarning", { "version": version }), { permanent: true });
            problemItemToChat(problemItems);
        } else {
            ui.notifications.info(game.i18n.format("ironclaw2e.ui.dataMigrationComplete", { "version": version }), { permanent: true });
        }

        console.log("0.5.6, special setting upgrade, done!");
    }
}

/**
 * Helper function to send all items with potential problems to console log and chat message
 * @param {Object[]} problemitems
 */
export function problemItemToChat(problemitems) {
    console.log(problemitems);

    let contents = "<p>Potential problem Items to check:</p>";
    for (let item of problemitems) {
        contents += "<p>";
        contents += "<strong>" + item.name + "</strong>";
        if (item.actor) {
            contents += ", belonging to character: " + item.actor.name;
            if (item.actor.token?.parent) {
                contents += ", under the scene: " + item.actor.token.parent.name;
            }
        }
        contents += "</p>";
    }

    let chatData = {
        content: contents
    };

    ChatMessage.applyRollMode(chatData, "gmroll");
    ChatMessage.create(chatData);
}

/**
 * Process the weapon data and upgrade it to the newer template values
 * @param {any} weapon
 * @returns {boolean} If the function returns false, there might be an issue with the automatic migration
 */
async function weaponUpgradePointFour(weapon) {
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
            const foobar = makeCompareReady(weaponData.range);
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

    await weapon.update(updateData);

    return fail;
}

async function currencyUpgradePointFiveFive(actor) {
    const actorData = actor.data.data;
    const coinageData = actorData.coinage;
    if (!coinageData) return null; // In case coinage doesn't exist, just immediately quit
    let updateData = {};
    updateData.coinage = {};

    if (coinageData.denar) {
        updateData.coinage.baseCurrency = { amount: (coinageData.denar.amount || 0) };
        await actor.update({ "data.coinage.-=denar": null });
    }
    if (coinageData.orichalk) {
        updateData.coinage.addedCurrency1 = { amount: (coinageData.orichalk.amount || 0) };
        await actor.update({ "data.coinage.-=orichalk": null });
    }
    if (coinageData.aureal) {
        updateData.coinage.addedCurrency2 = { amount: (coinageData.aureal.amount || 0) };
        await actor.update({ "data.coinage.-=aureal": null });
    }
    if (coinageData[""]) {
        await actor.update({ "data.coinage.-=": null });
    }

    return actor.update({ "data": updateData });
}

async function giftUpgradePointFiveSix(item) {
    let itemData = item.data.data;
    if (itemData.specialSettings?.length > 0) {
        for (let i = 0; i < itemData.specialSettings.length; ++i) {
            if (itemData.specialSettings[i].otherItemField)
                await item.giftChangeSpecialField(i, "otherOwnedItemField", itemData.specialSettings[i].otherItemField);
        }
        return item.giftValidateSpecialSetting();
    }
    return item;
}

/**
 * Gift name lookup and special setting system
 * @param {any} gift
 */
function giftNameLookup(gift) {
    const giftData = gift.data.data;
    let updateData = {};
    let settings = [];

    switch (makeCompareReady(gift.name)) {
        // Veteran
        case ("veteran"):
            settings.push(getSpecialOptionPrototype("guardBonus"));
            settings.push(getSpecialOptionPrototype("aimBonus"));
            break;
        // Giant
        case ("giant"):
            settings.push(getSpecialOptionPrototype("encumbranceBonus"));
            settings[0].encumbranceBonusNumber = 1;
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
            settings.push(getSpecialOptionPrototype("defenseBonus"));
            settings[1].conditionField = "Afraid, Terrified";
            settings[1].appliesToParries = false;
            break;
        case ("flightoftheprey"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 1;
            settings[0].bonusDashNumber = 4;
            settings[0].bonusRunNumber = 16;
            settings[0].conditionField = "Afraid";
            settings[0].replaceNameField = "Coward";
            settings.push(getSpecialOptionPrototype("defenseBonus"));
            settings[1].conditionField = "Afraid"; // Separate bonuses for dodge and parry to ensure the replacement system works
            settings[1].appliesToParries = false;
            settings[1].replaceNameField = "Coward";
            settings.push(getSpecialOptionPrototype("defenseBonus"));
            settings[2].conditionField = "Afraid";
            settings[2].appliesToDodges = false;
            break;
        case ("ophidian"):
            settings.push(getSpecialOptionPrototype("moveBonus"));
            settings[0].bonusStrideNumber = 2;
            settings[0].bonusDashNumber = -2;
            break;
        // Flight bonuses
        case ("flying"):
            settings.push(getSpecialOptionPrototype("flyingBonus"));
            settings[0].bonusStrideNumber = 3;
            settings[0].bonusRunNumber = 12;
            settings.push(getSpecialOptionPrototype("sprintBonus"));
            settings[1].conditionField = "Flying";
            settings[1].bonusStatsField = "Weather Sense";
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
            settings[1].replaceNameField = "Strength";
            break;
        // Counter bonuses
        case ("focusedfighter"):
            settings.push(getSpecialOptionPrototype("counterBonus"));
            settings[0].conditionField = "Focused";
            settings.push(getSpecialOptionPrototype("defenseBonus"));
            settings[1].conditionField = "Focused";
            break;
        // Defense bonuses
        case ("fencing"):
            settings.push(getSpecialOptionPrototype("defenseBonus"));
            settings[0].descriptorField = "Fencing";
            settings[0].bonusStatsField = "Dodge";
            settings[0].appliesToDodges = false;
            break;
        // Soak bonuses
        case ("resolve"):
            settings.push(getSpecialOptionPrototype("soakBonus"));
            settings[0].bonusStatsField = "Will";
            break;
        case ("shieldsoak"):
            settings.push(getSpecialOptionPrototype("soakBonus"));
            settings[0].bonusSourcesField = "Shield";
            break;
        case ("guardsoak"):
            settings.push(getSpecialOptionPrototype("soakBonus"));
            settings[0].bonusSourcesField = "Guard";
            break;
        case ("naturalarmor"):
            settings.push(getSpecialOptionPrototype("soakBonus"));
            settings[0].bonusStatsField = "Species";
            break;
        // Initiative bonuses
        case ("dangersense"):
            settings.push(getSpecialOptionPrototype("initiativeBonus"));
            break;
    }

    updateData["data.specialSettings"] = settings;
    return gift.update(updateData);
}