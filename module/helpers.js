import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EItem } from "./item/item.js";
import { hasConditionsIronclaw } from "./conditions.js";
import { CommonSystemInfo } from "./systeminfo.js";

/* -------------------------------------------- */
/*  Dice Helpers                                */
/* -------------------------------------------- */
// Note that the dicerollers.js has some of its own helpers, the difference is that these ones could / are also be used elsewhere, whereas the dicerollers.js helpers are purely for its internal use

/**
 * Helper function to split a string of dice into component forms, separated by commas, then parsed into an array, to allow easy rolling
 * @param {string} dicestring String containing standard dice notation, separated by commas
 * @returns {number[]} Array of dice in the string, in this order: d12, d10, d8, d6, d4
 */
export function findTotalDice(dicestring) {
    let totaldice = [0, 0, 0, 0, 0];

    if (typeof (dicestring) !== "string") {
        console.error("Something that was not a string inputted to dice parser: " + dicestring);
        return totaldice;
    }

    let foos = dicestring.split(",");
    for (let i = 0; i < foos.length; ++i) {
        let bar = parseSingleDiceString(foos[i]);
        if (!Array.isArray(bar))
            continue;

        let total = bar[0], sides = bar[1];

        if (total == 0 || sides == 0)
            continue;
        let diceindex = checkDiceArrayIndex(sides);
        if (diceindex >= 0)
            totaldice[diceindex] += total;
        else if (diceindex < -1) // Special exception to allow a d0 in dice inputs without logging it as unusual
            console.log("Non-standard dice found while totaling up dice: " + dicestring);
    }
    return totaldice;
}

/**
 * Helper function to parse a single part of a dice string, eg. "3d12"
 * @param {string} dicestring The single dice to be parsed
 * @returns {number[] | null} Returns a two-part array, first containing the number of dice, second the sides of the die used; returns null if the input cannot be parsed
 */
export function parseSingleDiceString(dicestring) {
    let bar = dicestring.trim();
    let index = bar.search(/d/i); // Search for the letter d in the string
    if (index == -1)
        return null; // If none found, just return null
    let total = 0, sides = 0;
    if (index == 0) // If d is the first character, take it to mean a single die
        total = 1;
    else
        total = parseInt(bar.slice(0, index)); // Otherwise slice the string at d and parse the first part for the number of dice
    sides = parseInt(bar.slice(index + 1)); // Slice the string at d and parse the second part for the sides of the die

    if (isNaN(total) || isNaN(sides))
        return null; // If either of the variables end up as NaN, return null

    return [total, sides]; // Return total and sides as an array
}

/**
 * Simple helper to check which dice array index a die with a given number of sides would belong to
 * @param {number} sides The sides of the die to check
 * @returns {number} The dice array index the dice would belong to, or -1 for invalid
 */
export function checkDiceArrayIndex(sides) {
    if (isNaN(sides)) {
        console.error("Something that was NaN inputted to dice index checker: " + sides);
        return -1;
    }

    if (sides == 12)
        return 0;
    else if (sides == 10)
        return 1;
    else if (sides == 8)
        return 2;
    else if (sides == 6)
        return 3;
    else if (sides == 4)
        return 4;
    else if (sides == 0) // Special case to separate a d0 from other invalid dice, since a d0 can represent a non-existing trait
        return -1;
    else
        return -2;
}

/**
 * Simple helper function to quick check whether a dice array actually has any dice
 * @param {number[]} dicearray
 * @returns {boolean} Returns true if there is dice in the array
 */
export function checkDiceArrayEmpty(dicearray) {
    if (!Array.isArray(dicearray)) {
        console.error("Something that was not an array inputted to dice array checker: " + dicearray);
        return false;
    }
    if (dicearray.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice array checker: " + dicearray);
        return false;
    }

    return dicearray[0] != 0 || dicearray[1] != 0 || dicearray[2] != 0 || dicearray[3] != 0 || dicearray[4] != 0;
}

/**
 * Helper function to add two arrays of numbers together, primarily for adding dice pools together
 * @param {number[]} foo First array
 * @param {number[]} bar Second array
 * @param {number} outputLength Set the length of the output array, leave empty or non-positive to auto-calculate from input array lengths
 * @returns {number[]} New array composed of the added values
 */
export function addArrays(foo, bar, outputLength = -1) {
    let total = [];

    if (!Array.isArray(foo) || !Array.isArray(bar)) {
        if (Array.isArray(foo) && !Array.isArray(bar))
            return foo;
        else if (!Array.isArray(foo) && Array.isArray(bar))
            return bar;
        else
            return total;
    }

    let totallength = foo.length;
    if (totallength < bar.length)
        totallength = bar.length;
    if (outputLength > 0)
        totallength = outputLength;

    for (let i = 0; i < totallength; ++i) {
        if (i < foo.length && i < bar.length)
            total.push(foo[i] + bar[i]);
        else if (i < foo.length)
            total.push(foo[i]);
        else if (i < bar.length)
            total.push(bar[i]);
        else
            total.push(0);
    }
    return total;
}

/**
 * Helper function to limit a dice array to some maximum die size, by adding all larger dice into the max die and changing them to zero
 * @param {number[]} dicearray The dice array to limit
 * @param {number} maxdie The maximum allowed die, corresponding to dice array index: 0 = d12, 1 = d10, 2 = d8, 3 = d6, 4 = d4
 * @returns {number[]} A new, limited dice array
 */
export function enforceLimit(dicearray, maxdie) {
    if (!Array.isArray(dicearray) || dicearray.length != 5)
        return console.error("Something other than a proper dice array inputted into limit enforcer: " + dicearray);
    if (isNaN(maxdie))
        return console.error("Something other than a number inputted into limit enforcer as the limit: " + maxdie);

    let limit = maxdie;
    if (!Number.isInteger(limit)) limit = Math.round(limit);
    if (limit < 0) limit = 0;
    if (limit > 4) limit = 4;
    let newarray = [dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4]];
    for (let i = 0; i < limit; ++i) {
        newarray[limit] += newarray[i];
        newarray[i] = 0;
    }

    return newarray;
}

/**
 * Helper function to reform a standard notation dice string from a dice array
 * Primarily intended to be used for showing already-parsed dice in the UI
 * @param {number[]} dicearray The array of dice to be parsed, in the same format as findTotalDice returns
 * @param {boolean} humanreadable Whether to put spaces between the dice components
 * @returns {string} The completed string in dice notation
 */
export function reformDiceString(dicearray, humanreadable = false) {
    if (!Array.isArray(dicearray)) {
        console.error("Something that was not an array inputted to dice string reformer: " + dicearray);
        return "";
    }
    if (dicearray.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice string reformer: " + dicearray);
        return "";
    }

    let reformedString = "";
    for (let i = 0; i < dicearray.length; ++i) {
        if (dicearray[i] != 0) {
            let amount = dicearray[i];
            let dicetype = 0;
            switch (i) {
                case 0:
                    dicetype = 12;
                    break;
                case 1:
                    dicetype = 10;
                    break;
                case 2:
                    dicetype = 8;
                    break;
                case 3:
                    dicetype = 6;
                    break;
                case 4:
                    dicetype = 4;
                    break;
            }
            reformedString += (amount == 1 ? "" : amount.toString()) + "d" + dicetype.toString() + "," + (humanreadable ? " " : "");
        }
    }

    if (reformedString.length > 1) {
        reformedString = reformedString.slice(0, (humanreadable ? -2 : -1));
    }

    return reformedString;
}

/**
 * Simple helper function to get the maximized dice pool value from a dice array
 * @param {number[]} dicearray The array of dice to get the maximized value from
 * @returns {number} The maximized value of the highest die in the array, effectively the number of sides the highest die has
 */
export function getDiceArrayMaxValue(dicearray) {
    if (!Array.isArray(dicearray)) {
        console.error("Something that was not an array inputted to dice pool maximizer: " + dicearray);
        return -1;
    }
    if (dicearray.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice pool maximizer: " + dicearray);
        return -1;
    }

    if (dicearray[0] > 0)
        return 12;
    else if (dicearray[1] > 0)
        return 10;
    else if (dicearray[2] > 0)
        return 8;
    else if (dicearray[3] > 0)
        return 6;
    else if (dicearray[4] > 0)
        return 4;
    else
        return 0;
}

/**
 * Helper function to get which dice array is bigger
 * @param {number[]} alpha The first dice array to compare
 * @param {number[]} beta The second dice array to compare
 * @returns {number} Whether either of the arrays is bigger, negative value if alpha is bigger, positive if beta is, zero if both are considered equal
 */
export function compareDiceArrays(alpha, beta) {
    if (!Array.isArray(alpha)) {
        console.error("Something that was not an array inputted to dice pool comparer: " + alpha);
        return 1;
    }
    if (!Array.isArray(beta)) {
        console.error("Something that was not an array inputted to dice pool comparer: " + beta);
        return -1;
    }
    if (alpha.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice pool comparer: " + alpha);
        return 1;
    }
    if (beta.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice pool comparer: " + beta);
        return -1;
    }

    for (let i = 0; i < alpha.length; ++i) {
        if (alpha[i] > beta[i]) {
            return -1;
        } else if (beta[i] > alpha[i]) {
            return 1;
        }
    }

    return 0;
}


/* -------------------------------------------- */
/*  Stat Helpers                                */
/* -------------------------------------------- */

/**
 * A simple helper to ensure every string that is compared gets treated equally everywhere, rather than risking typos or other weirdness
 * @param {string} text Text to reduce to comparable state
 * @returns {string} The text in all lowercase with whitespace trimmed away
 */
export function makeCompareReady(text) {
    return typeof (text) === "string" ? text.trim().replace(/\s/g, '').toLowerCase() : "error";
}

/**
 * A simple helper to convert camelCase strings into nicer, more human-readable form
 * @param {string} camelCase The camelCase string to parse
 * @returns {string} Human-readable version of camelCase
 */
export function convertCamelCase(camelCase) {
    return typeof (camelCase) === "string" ? camelCase.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); }) : "error";
}

/**
 * Helper function to split a string of stat names, separated by commas, into an array containing comparison-ready versions of the component strings, to allow for easy checks
 * @param {string} stats String containing stat names, separated by commas and containing no spaces inside the names
 * @param {boolean} comparisonready Whether to make the split strings comparison-ready or not, almost always kept at true
 * @returns {string[]} An array of strings containing the stat names
 */
export function splitStatString(stats, comparisonready = true) {
    let statarray = [];

    if (typeof (stats) != "string") {
        console.error("Something that was not a string inputted to skill splitter: " + stats);
        return statarray;
    }

    let foos = stats.split(",");
    for (let i = 0; i < foos.length; ++i) {
        statarray.push((comparisonready ? makeCompareReady(foos[i]) : foos[i]));
    }
    return statarray;
}

/**
 * Helper function to split a string containing stat names, separated by commas, as well as extra non-stat dice in dice notation, which are separated from the stats by a semicolon and from each other by commas
 * @param {string} fullset String containing stat names, separated by commas, and a separate section containing extra dice in dice notation, separated from each other by commas an from the stat names by a semicolon
 * @param {boolean} ignorecheck If true, ignore the initial check for pure dicestring and force the function to act as if the check didn't pass
 * @returns {[string[], string]} Returns an array first containing the array of split-up stat names, and second the string of the extra dice
 */
export function splitStatsAndBonus(fullset, ignorecheck = false) {
    let statarray = [];
    let dicestring = "";

    if (typeof (fullset) != "string") {
        console.error("Something that was not a string inputted to stat and bonus splitter: " + fullset);
        return [statarray, dicestring];
    }

    let firstsplit = fullset.split(";");
    const test = splitStatString(fullset);
    // Check if there was no semicolon present and the first index of the test returns as dice, to check whether to treat the entire input as just a dice string
    if (ignorecheck || (firstsplit.length === 1 && parseSingleDiceString(test[0]))) {
        dicestring = fullset;
    } else { // If not, perform the splitting normally
        if (firstsplit[0].length > 0) {
            statarray = splitStatString(firstsplit[0]);
        }
        if (firstsplit.length > 1) {
            dicestring = firstsplit[1];
        }
    }

    return [statarray, dicestring];
}

/**
 * Small helper to check whether a given skill is subject to the burdened limit
 * @param {string} name Name of the skill
 * @returns {boolean} Returns true if the limit applies
 */
export function burdenedLimitedStat(name) {
    return CommonSystemInfo.burdenedList.includes(makeCompareReady(name));
}


/* -------------------------------------------- */
/*  Gift Special Bonus Helpers                  */
/* -------------------------------------------- */

/**
 * Checks the special's applicability in a given situation
 * @param {object} special The special setting
 * @param {Ironclaw2EItem} item The target item for the bonus setting or the data for one
 * @param {Ironclaw2EActor} actor The actor of the check
 * @param {boolean} defensecheck Special trigger for defense bonus, whether the check is for a defense
 * @param {string} defensetype Special trigger for defense bonus, what type of defense this is
 * @returns {boolean} Whether the target is applicable for the special
 */
export function checkApplicability(special, item, actor, defensecheck = false, defensetype = "") {
    if (!special) {
        // In case the check is given something that doesn't exist
        return false;
    }

    // Gift state check, if the bonus is applicable only when refreshed and the gift is exhausted, or if applicable only when exhausted and the gift is refreshed, return false
    if ((special.worksWhenState === "refreshed" && special.refreshedState === false) || (special.worksWhenState === "exhausted" && special.refreshedState === true)) {
        return false;
    }
    // Special defense bonus check
    if (defensecheck) {
        if (!special.appliesToDodges && defensetype === "dodge") {
            return false; // Return false if the special does not apply to dodges and this is a dodge
        }
        if (!special.appliesToParries && defensetype === "parry") {
            return false; // Return false if the special does not apply to parries and this is a parry
        }
        if (!special.appliesToSpecialDefenses && defensetype === "special") {
            return false; // Return false if the special does not apply to special defenses and this is a special defense
        }
    }
    // Item-specific checks
    if (item) {
        const itemData = (item instanceof Ironclaw2EItem ? item.data : item);
        if (special.typeArray && !special.typeArray.includes(makeCompareReady(itemData.type))) {
            return false;
        }
        if (special.nameArray && !special.nameArray.some(x => itemData.name.toLowerCase().includes(x))) {
            return false;
        }
        if (special.equipArray && !special.equipArray.includes(makeCompareReady(itemData.data.equip))) {
            return false;
        }
        if (special.rangeArray && !special.rangeArray.includes(makeCompareReady(itemData.data.range))) {
            return false;
        }

        // If the target is an already existing item, take advantage of the preprocessed data
        if (item instanceof Ironclaw2EItem) {
            if (special.tagArray && !special.tagArray.some(x => itemData.data.giftTagsSplit?.includes(x))) {
                return false;
            }
            if (special.descriptorArray && !special.descriptorArray.some(x => itemData.data.descriptorsSplit?.includes(x))) {
                return false;
            }
            if (special.effectArray && !special.effectArray.some(x => itemData.data.effectsSplit?.includes(x))) {
                return false;
            }
            if (special.statArray) {
                if (itemData.data.giftStats && !special.statArray.some(x => itemData.data.giftStats?.includes(x)))
                    return false;
                // Complicated check, it checks whether any of the weapon fields exist, then if it can find anything matching from the stats if they exist, it then inverts that value to mean whether nothing was found
                if (itemData.data.attackStats || itemData.data.defenseStats || itemData.data.counterStats) {
                    if (!((itemData.data.attackStats && special.statArray.some(x => itemData.data.attackStats?.includes(x))) ||
                        (itemData.data.defenseStats && special.statArray.some(x => itemData.data.defenseStats?.includes(x))) ||
                        (itemData.data.counterStats && special.statArray.some(x => itemData.data.counterStats?.includes(x)))))
                        return false; // If nothing was found, return false
                }
            }
        } else { // Otherwise, do special versions of checks for the raw data
            if (special.tagArray && !special.tagArray.some(x => splitStatString(itemData.data.giftTags)?.includes(x))) {
                return false;
            }
            if (special.descriptorArray && !special.descriptorArray.some(x => splitStatString(itemData.data.descriptors)?.includes(x))) {
                return false;
            }
            if (special.effectArray && !special.effectArray.some(x => splitStatString(itemData.data.effectsSplit)?.includes(x))) {
                return false;
            }
            if (special.statArray) {
                if (itemData.data.useDice && !special.statArray.some(x => splitStatsAndBonus(itemData.data.useDice)[0]?.includes(x)))
                    return false;
                if (itemData.data.attackDice || itemData.data.defenseDice || itemData.data.counterDice) {
                    if (!((itemData.data.attackDice && special.statArray.some(x => splitStatsAndBonus(itemData.data.attackDice)[0]?.includes(x))) ||
                        (itemData.data.defenseDice && special.statArray.some(x => splitStatsAndBonus(itemData.data.defenseDice)[0]?.includes(x))) ||
                        (itemData.data.counterDice && special.statArray.some(x => splitStatsAndBonus(itemData.data.counterDice)[0]?.includes(x)))))
                        return false;
                }
            }
        }
    }
    // Actor-specific checks
    if (actor) {
        if (special.conditionArray && !hasConditionsIronclaw(special.conditionArray, actor)) {
            return false;
        }
        if (special.otherItemArray && special.otherItemArray.some(x => !findInItems(actor.items, x))) {
            return false;
        }
    }

    return true;
}

/**
 * Upgrade the given dice array dice into higher types
 * @param {number[]} dicearray The dice array to upgrade
 * @param {number} upgrade The amount to upgrade
 * @returns {number[]} The upgraded dice array
 */
export function diceFieldUpgrade(dicearray, upgrade) {
    let upgArray = [0, 0, 0, 0, 0];

    for (let i = 0; i < 5; ++i) {
        let target = i - upgrade; // Reversed, as the smaller the array index, the bigger the die type, hence upgrade steps subtract target index
        if (target < 0) target = 0; // Clamp to 0 and 4, in case of overflow
        if (target > 4) target = 4;

        upgArray[target] += dicearray[i];
    }

    return upgArray;
}

/* -------------------------------------------- */
/*  Misc Helpers                                */
/* -------------------------------------------- */

/**
 * Helper function to get what speaker to use in the dice roller output, dependent on the system settings
 * @param {Actor} rollingactor The actor to find a speaker for
 * @returns {Object} Returns the speaker data
 */
export function getMacroSpeaker(rollingactor) {
    if (!rollingactor)
        return ChatMessage.getSpeaker(); // In case the function ever receives an actor that does not exist

    const prefertokens = game.settings.get("ironclaw2e", "preferTokenName");
    if (prefertokens) {
        let chattoken = findActorToken(rollingactor);
        if (chattoken) {
            return ChatMessage.getSpeaker({ token: chattoken });
        }
    }

    return (rollingactor ? ChatMessage.getSpeaker({ actor: rollingactor }) : ChatMessage.getSpeaker());
}

/**
 * Helper function to find the token for a given actor, or return undefined if no token is found
 * On non-synthetic actors, requires the token's actorLink to be TRUE in order to pick them
 * @param {Actor} actor The actor to find a token for
 * @returns {TokenDocument} Returns the found token, or null
 */
export function findActorToken(actor) {
    if (!actor)
        return null;

    let foundtoken = null;
    if (actor.token) {
        foundtoken = actor.token;
    }
    else {
        let tokenarray = actor.getActiveTokens(true);
        if (tokenarray.length > 0 && tokenarray[0]?.data?.actorLink === true)
            foundtoken = tokenarray[0].document;
    }
    return foundtoken;
}

/**
 * Helper function to get the actor of the current speaker, be it the user default or the currently selected actor, or null if no actor is found
 * @returns {Actor | null} The actor of the current speaker, or null if nothing found
 */
export function getSpeakerActor() {
    const speaker = ChatMessage.getSpeaker();
    let actor = null;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    return actor;
}

/**
 * Helper function to search through a given item list for any items matching the name given
 * @param {Array} itemlist The actor's item list to be checked
 * @param {string} itemname The item in question to search for
 * @param {string} itemtype Optionally, also limit the search based on item type, in cases where that might matter
 * @returns {Object} Returns the item in question
 */
export function findInItems(itemlist, itemname, itemtype = null) {
    if (!itemlist || typeof itemlist[Symbol.iterator] !== 'function') {
        console.error("Find in items failed, received something not iterable: " + itemlist);
        return null;
    }

    const useitemtype = itemtype ? true : false;

    return itemlist.find(element => (useitemtype ? element.data.type == itemtype : true) && makeCompareReady(element.data.name) == itemname);
}

/**
 * Helper function to check against nulls and other non-arrays when concating two arrays
 * @param {any[]} foo First array to concat
 * @param {any[]} bar Second array to concat
 */
export function nullCheckConcat(foo, bar) {
    if (!Array.isArray(foo) || !Array.isArray(bar)) {
        if (Array.isArray(foo) && !Array.isArray(bar))
            return foo; // Only foo is an array, so just return it
        else if (!Array.isArray(foo) && Array.isArray(bar))
            return bar; // Only bar is an array, so just return it
        else
            return null; // Neither is an array, so abort completely and return null
    }

    return foo.concat(bar);
}

/**
 * Loop through all actors that exist in the game world, and return them as a Set
 * @returns {Set} Set of all actors that exist
 */
export function getAllActorsInWorld() {
    let allActors = new Set();

    for (let actor of game.actors) {
        allActors.add(actor);
    }
    for (let scene of game.scenes) {
        for (let token of scene.tokens) {
            if (token.actor) {
                allActors.add(token.actor);
            }
        }
    }

    return allActors;
}

/**
 * Loop through all items that exist in the game world, and return them as a Set
 * @param {string} itemtype The type of items to get
 * @returns {Set} Set of all items that exist
 */
export function getAllItemsInWorld(itemtype = "") {
    let allItems = new Set();

    for (let item of game.items) {
        if (!itemtype || item.type == itemtype)
            allItems.add(item);
    }
    for (let actor of game.actors) {
        for (let item of actor.items) {
            if (!itemtype || item.type == itemtype)
                allItems.add(item);
        }
    }
    for (let scene of game.scenes) {
        for (let token of scene.tokens) {
            if (token.actor) {
                for (let item of token.actor.items) {
                    if (!itemtype || item.type == itemtype)
                        allItems.add(item);
                }
            }
        }
    }

    return allItems;
}