import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EItem } from "./item/item.js";
import { checkIfDisadvantagedIronclaw, hasConditionsIronclaw } from "./conditions.js";
import { CommonSystemInfo, getRangeDistanceFromBand, getRangeMinMaxFromBand, getRangeDiceFromDistance, getRangeBandFromDistance } from "./systeminfo.js";

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
        let diceindex = checkDiceIndex(sides);
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
 * A helper function to split a dice string to its component forms and add each comma-separated set of dice to its own dice array
 * @param {string} dicestring
 * @returns {[number[]]} An array of dice arrays
 */
export function findTotalDiceArrays(dicestring) {
    let totalarrays = [];

    if (typeof (dicestring) !== "string") {
        console.error("Something that was not a string inputted to dice parser: " + dicestring);
        return totaldice;
    }

    let foos = dicestring.split(",");
    for (let i = 0; i < foos.length; ++i) {
        const bar = findTotalDice(foos[i]);
        totalarrays.push(bar);
    }
    return totalarrays;
}

/**
 * Simple helper to check which dice array index a die with a given number of sides would belong to
 * @param {number} sides The sides of the die to check
 * @returns {number} The dice array index the dice would belong to, or -2 for invalid
 */
export function checkDiceIndex(sides) {
    if (isNaN(sides)) {
        console.error("Something that was NaN inputted to dice index checker: " + sides);
        return -2;
    }

    switch (sides) {
        case 12:
            return 0;
        case 10:
            return 1;
        case 8:
            return 2;
        case 6:
            return 3;
        case 4:
            return 4;
        case 0: // Special case to separate a d0 from other invalid dice, since a d0 can represent a non-existing trait
            return -1;
        default:
            return -2;
    }
}

/**
 * Simple helper to check which dice array side a certain index belongs to
 * @param {number} index The index of the die to check
 * @returns {number} The dice array side the dice would belong to, or -2 for invalid
 */
export function checkDiceSides(index) {
    if (isNaN(index)) {
        console.error("Something that was NaN inputted to dice index checker: " + index);
        return -2;
    }

    switch (index) {
        case 0:
            return 12;
        case 1:
            return 10;
        case 2:
            return 8;
        case 3:
            return 6;
        case 4:
            return 4;
        case -1: // Special case to separate a d0 from other invalid dice, since a d0 can represent a non-existing trait
            return 0;
        case 5: // And same here, a special exception for a zero die
            return 0;
        default:
            return -2;
    }
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
 * Helper function to take a set of dice arrays and combine them all into a single dice array
 * @param {[number[]]} dicearrays
 * @param {boolean} warninput Whether to send a warning about bad input or not
 * @returns {number[]}
 */
export function flattenDicePoolArray(dicearrays, warninput = true) {
    let total = [0, 0, 0, 0, 0];
    if (!Array.isArray(dicearrays) || dicearrays.length === 0 || !Array.isArray(dicearrays[0])) {
        if (warninput) console.warn("Unexpected input when flattening a dice array set: " + dicearrays);
        return total;
    }

    for (let pool of dicearrays) {
        total = addArrays(total, pool);
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
 * Helper function to limit a set of dice arrays to some maximum die size
 * @param {[number[]]} dicearrays
 * @param {number} maxdie
 * @returns {[number[]]} A new, limited set of dice arrays
 */
export function enforceLimitArray(dicearrays, maxdie) {
    if (!Array.isArray(dicearrays))
        return console.error("Something other than an array inputted into limit enforcer: " + dicearray);
    if (isNaN(maxdie))
        return console.error("Something other than a number inputted into limit enforcer as the limit: " + maxdie);

    let newpools = [];
    for (let pool of dicearrays) {
        const limited = enforceLimit(pool, maxdie);
        newpools.push(limited);
    }

    return newpools;
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
    let usedArray = dicearray;
    if (dicearray.length > 0 && Array.isArray(dicearray[0])) {
        // Assume the inputted string is in fact a set of dice arrays, so flatten them into one
        usedArray = flattenDicePoolArray(dicearray);
    }
    if (usedArray.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice string reformer: " + usedArray);
        return "";
    }

    let reformedString = "";
    for (let i = 0; i < usedArray.length; ++i) {
        if (usedArray[i] != 0) {
            let amount = usedArray[i];
            let dicetype = checkDiceSides(i);
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

/**
 * A helper to reduce the dice set type by the steps given, then returning the dice string for the set
 * Note that this function assumes that only a single die type is given, an array with multiple dice types will only use the highest one
 * @param {number[]} dicearray
 * @param {number} steps
 * @param {boolean} allowzerodie
 * @returns {string}
 */
export function reduceDiceStringSet(dicearray, steps, allowzerodie = false) {
    if (!Array.isArray(dicearray)) {
        console.error("Something that was not an array inputted to dice set reducer: " + dicearray);
        return -1;
    }
    if (dicearray.length != 5) {
        console.error("Something that was not a dice array (based on length) inputted to dice set reducer: " + dicearray);
        return -1;
    }
    const index = checkDiceIndex(getDiceArrayMaxValue(dicearray));
    const amount = dicearray[index];
    let reducedIndex = index + steps; // Plus, since a higher index means a smaller die
    if (reducedIndex < 0) reducedIndex = 0; // Clamp to 0, just in case
    if (allowzerodie) {
        // Allow reduction up to zero die
        if (reducedIndex > 5) reducedIndex = 5;
    } else {
        // Clamp to a minimum of d4
        if (reducedIndex > 4) reducedIndex = 4;
    }

    // Return a reconstructed dice string for the reduced dice set, without a number in the front if it's a one
    return (amount === 1 ? "" : amount.toString()) + "d" + checkDiceSides(reducedIndex).toString();
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

    if (stats.length > 0) {
        let foos = stats.split(",");
        for (let i = 0; i < foos.length; ++i) {
            statarray.push((comparisonready ? makeCompareReady(foos[i]) : foos[i]));
        }
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
/*  Actor & Token Helpers                       */
/* -------------------------------------------- */

/**
 * Helper function to get what speaker to use in the dice roller output, dependent on the system settings
 * @param {Ironclaw2EActor} rollingactor The actor to find a speaker for
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
 * @param {Ironclaw2EActor} actor The actor to find a token for
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
 * @returns {Ironclaw2EActor | null} The actor of the current speaker, or null if nothing found
 */
export function getSpeakerActor() {
    const speaker = ChatMessage.getSpeaker();
    let actor = null;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    return actor;
}

/**
 * Get the actor from a chat message's speaker field
 */
export function getActorFromSpeaker({ actor = "", scene = "", token = "" }) {
    // Get the actor, either through the scene if synthetic, or actor if a full one
    let actualActor = null;
    if (scene && token) {
        const foo = game.scenes.get(scene)?.tokens.get(token);
        actualActor = foo?.actor;
    } else if (actor) {
        actualActor = game.actors.get(actor);
    }
    return actualActor;
}

/**
 * Get the token from a chat message's speaker field
 */
export function getTokenFromSpeaker({ actor = "", scene = "", token = "" }) {
    // Get the token, either through the scene if possible, or by finding one for the actor
    let actualToken = null;
    if (scene && token) {
        actualToken = game.scenes.get(scene)?.tokens.get(token);
    } else if (actor) {
        const foo = game.actors.get(actor);
        actualToken = findActorToken(foo);
    }
    return actualToken;
}

/* -------------------------------------------- */
/*  Range & Distance Helpers                    */
/* -------------------------------------------- */

/**
 * @typedef {{
 *   minRange: number,
 *   maxRange: number
 * }} RangeBandMinMax
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   elevation: number | undefined
 * }} TokenPosition
 */

/**
 * Helper function that determines the distance between two points on the current canvas, with the elevation of things included in the measurement
 * @param {TokenPosition} origin The origin of measurement, usually the attacker or otherwise active actor
 * @param {TokenPosition} target The target to which to measure the distance, usually the defender or otherwise passive actor
 * @param {boolean} [measurevertical] Whether to measure the vertical distance as well, defaults to true
 * @param {boolean} [usecombatrules] Whether to use the ranged combat rules for vertical distance, defaults to false
 * @returns {number} The total distance between origin and target
 */
export function getDistanceBetweenPositions(origin, target, { measurevertical = true, usecombatrules = false } = {}) {
    const useRulerMeasurement = game.settings.get("ironclaw2e", "matchStandardRuler"); // Whether to use the same imprecise ruler measurement, rather than the full-precision measurements
    const diagonalRule = game.settings.get("ironclaw2e", "diagonalRule");

    // Null check for the two positions, this should never happen
    if (!origin || !target) {
        // Return a NaN in this case, and send an error to the log
        console.error("The 'getDistanceBetweenPositions' helper received null values for either or both positions: " + origin + " " + target);
        return NaN;
    }

    // Get the distance from the map grid, which gets the pure horizontal distance
    let distance = canvas.grid.measureDistance(origin, target, { gridSpaces: useRulerMeasurement });
    // See if the vertical distance can even be measured, or that there is a point to it
    if (measurevertical && typeof origin.elevation === "number" && typeof target.elevation === "number" && Math.abs(target.elevation - origin.elevation) >= 1) {
        // Check whether the measurement is asking for raw distance or for the distance according to combat rules
        if (usecombatrules) {
            // For combat rules, ignore the height difference from above the target unless the vertical distance is higher than horizontal distance
            if (origin.elevation > target.elevation) {
                if (origin.elevation - target.elevation > distance)
                    distance = (useRulerMeasurement ? Math.round(origin.elevation - target.elevation) : origin.elevation - target.elevation);
            } else { // But if the origin is below the target, add the vertical distance to the horizontal distance
                distance += (useRulerMeasurement ? Math.round(target.elevation - origin.elevation) : target.elevation - origin.elevation);
            }
        }
        else {
            if (useRulerMeasurement) {
                // Mimic the imprecise ruler measurements for vertical distance as well
                if (diagonalRule === "SAME") {
                    // In "SAME" mode, apply the equidistant rule to vertical distance as well, which in practice means only take it into effect if the vertical distance is larger than horizontal
                    if (Math.abs(origin.elevation - target.elevation) > distance)
                        distance = Math.abs(origin.elevation - target.elevation);
                } else {
                    // Round the output just like the ruler measurement would
                    distance = Math.round(Math.hypot(distance, target.elevation - origin.elevation));
                }
            } else {
                // Fully precise measurement
                distance = Math.hypot(distance, target.elevation - origin.elevation);
            }
        }
    }

    return distance;
}

/**
 * Helper function to check whether a range is within the given range band
 * @param {number | RangeBandMinMax | string} range The range to check, either as a number meaning single distance, another range band, or a name of the range to check
 * @param {RangeBandMinMax} rangeband The range band to check against
 */
export function checkIfWithinRange(range, rangeband) {
    let usedRange = 0;
    // Check to make sure both range and rangeband are usable
    if ((!range && range !== 0) || !rangeband) {
        console.error("checkIfWithinRange was given null range or rangeband: " + range + " " + rangeband);
        return false;
    }
    if (typeof range === "string") {
        usedRange = getRangeDistanceFromBand(range);
    } else if (range.maxRange) {
        usedRange = range.maxRange;
    } else {
        usedRange = range;
    }

    // Inclusive check if the given range is under the maximum range of the given rangeband
    if (usedRange <= rangeband.maxRange) {
        // Usually exclusive check if the given range is over the minimum range of the given rangeband, minRange of zero instead uses an inclusive check
        if ((rangeband.minRange === 0 ? usedRange >= rangeband.minRange : usedRange > rangeband.minRange)) {
            return true;
        }
    }
    return false;
}

/**
 * Helper function to get the functional range of something from given range bands
 * @param {string | string[]} range
 * @param {boolean} shorterOkay // Whether shorter distances than what was given are okay, in which case, the returned min is zero
 * @param {boolean} longerOkay // Whether longer distances than what was given are okay, in which case, the returned max is Infinity
 * @returns {RangeBandMinMax | null} // Returns either the min and max of the range, or null in case no range band was mapped successfully
 */
export function getRangeBandMinMax(range, shorterOkay = false, longerOkay = false) {
    const usedRanges = Array.isArray(range) ? range : [range];
    let min = Infinity, max = 0;
    let foundAnything = false;
    for (let foo of usedRanges) {
        const paces = getRangeMinMaxFromBand(foo);
        if (paces) {
            foundAnything = true;
            if (paces.minRange < min)
                min = paces.minRange;
            if (paces.maxRange > max)
                max = paces.maxRange;
        }
    }

    if (longerOkay) {
        max = Infinity;
    }
    if (shorterOkay) {
        min = 0;
    }

    if (foundAnything)
        return { "minRange": min, "maxRange": max };
    else
        return null;
}

/**
 * Get the template position based on the attacking message's flag data
 * @returns {TokenPosition | null}
 */
export function getTemplatePosition({ weaponTemplatePos = null, weaponTemplateId = "", weaponTemplateSceneId = "" }) {
    // Try to find the actual template and use its position
    if (weaponTemplateId && weaponTemplateSceneId) {
        const templateScene = game.scenes.get(weaponTemplateSceneId);
        if (templateScene) {
            const template = templateScene.templates.get(weaponTemplateId);
            if (template) {
                const flagfoo = getCorrectElevationFlag();
                return { "x": template.data.x, "y": template.data.y, "elevation": template.getFlag(flagfoo.modId, flagfoo.flagId) };
            }
        }
    }

    // If not found, just use the stored position from the flags, inputted to this function
    return weaponTemplatePos;
}

/* -------------------------------------------- */
/*  Gift Special Bonus Helpers                  */
/* -------------------------------------------- */

/**
 * Checks the special's applicability in a given situation
 * @param {object} special The special setting
 * @param {Ironclaw2EItem} item The target item for the bonus setting or the data for one
 * @param {Ironclaw2EActor} actor The actor of the check
 * @param {Object} otheritem Data from the other item, mostly used for the weapon attacking the actor
 * @param {boolean} defensecheck Special trigger for defense bonus, whether the check is for a defense
 * @param {string} defensetype Special trigger for defense bonus, what type of defense this is
 * @param {boolean} rallycheck Special trigger for rally bonuses, only really used for range penalties
 * @returns {boolean} Whether the target is applicable for the special
 */
export function checkApplicability(special, item, actor,
    { otheritem = null, itemlessdata = null, defensecheck = false, defensetype = "", rallycheck = false, usecheck = false, hasoneinroll = false, isauthor = false } = {}) {
    if (!special) {
        // In case the check is given something that doesn't exist
        return false;
    }

    // Gift exhaust related checks
    // Gift state check, if the bonus is applicable only when refreshed and the gift is exhausted, or if applicable only when exhausted and the gift is refreshed, return false
    if ((special.worksWhenState === "refreshed" && special.refreshedState === false) || (special.worksWhenState === "exhausted" && special.refreshedState === true)) {
        return false;
    }
    // Extra bonus "Exhausts on Use" field check to make sure if the check is in place, the setting won't be added if the refresh state is false
    if (special.bonusExhaustsOnUse === true && special.refreshedState === false) {
        return false;
    }

    // Special permissive check for the bonus auto-use setting, if the setting is for "applied" and this is not marked as a use check, skip all the rest of the checks
    if (special.bonusAutoUsed === "applied" && usecheck === false) {
        return true; // The only permissive check, since this skips all but the above failing checks to allow the bonus to appear otherwise
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

    // Special rally check
    if (rallycheck) {
        if (special.appliesToRallying === false) {
            return false; // Return false if the check is a rally and the special specifically does not apply to rallying
        }
    }

    // Roll authorship check
    if (special.allowOnOthers === false && isauthor === false) {
        return false; // Return false if the special does not allow for others and the user is not an author of the target roll
    }
    else if (special.allowOnOthers === true && isauthor === false) {
        // If the special does allow use on others and the user is not an author of the target roll, check whether the game option allows use
        const allowOthers = game.settings.get("ironclaw2e", "allowRerollingOthersDice");
        if (allowOthers === false && !game.user.isGM) {
            return false; // Return false if the setting is turned off and the user is not a GM
        }
    }
    // Favor reroll type check for ones
    if (special.rerollType === "FAVOR" && !hasoneinroll) {
        return false; // Return false if there is no dice rolled a one in the originating roll
    }

    // Item-specific checks
    if (special.itemless && itemlessdata) {
        // If the special is actually itemless and itemless data has been set
        if (special.statArray && !special.statArray.some(x => itemlessdata.statArray?.includes(x))) {
            return false;
        }
    } else if (item) {
        // If an item has been given
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
            if (special.effectArray && !special.effectArray.some(x => splitStatString(itemData.data.effect)?.includes(x))) {
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
    } else if (special.typeArray || special.nameArray || special.equipArray || special.rangeArray || special.tagArray || special.descriptorArray || special.effectArray || special.statArray || special.needsSecondReadiedWeapon === true) {
        return false; // If the special has fields that would expect an item and none is given, fail the check
    }
    // Actor-specific checks
    if (actor) {
        if (special.conditionArray && !hasConditionsIronclaw(special.conditionArray, actor)) {
            return false;
        }
        if (special.otherOwnedItemArray && !special.otherOwnedItemArray.some(x => findInItems(actor.items, x))) {
            return false;
        }
        if (special.needsSecondReadiedWeapon === true && item) {
            // Listed under Actor-specific checks, but needs both actor and item to be present
            const anotherReadiedWeapon = actor.items.some(x => x.id !== item.id && x.type === "weapon" && x.data.data.readied === true);
            if (anotherReadiedWeapon === false)
                return false;
        }
    } else if (special.conditionArray || special.otherOwnedItemArray || special.needsSecondReadiedWeapon === true) {
        return false; // If the special has fields that would expect an actor and none is given, fail the check
    }
    // Other-item-specific checks
    if (otheritem) {
        if (special.nameOtherArray && !special.nameOtherArray.some(x => otheritem.name?.toLowerCase().includes(x))) {
            return false;
        }
        if (special.descriptorOtherArray && !special.descriptorOtherArray.some(x => otheritem.descriptors?.includes(x))) {
            return false;
        }
        if (special.effectOtherArray && !special.effectOtherArray.some(x => otheritem.effects?.includes(x))) {
            return false;
        }
        if (special.statOtherArray && !special.statOtherArray.some(x => otheritem.stats?.includes(x))) {
            return false;
        }
        if (special.equipOtherArray && !special.equipOtherArray.includes(makeCompareReady(otheritem.equip))) {
            return false;
        }
        if (special.rangeOtherArray) {
            const requireSuccess = game.settings.get("ironclaw2e", "requireSpecialRangeFound");
            const foundToken = findActorToken(actor);
            const functionalRange = getRangeBandMinMax(special.rangeOtherArray, special.appliesShorterRange, special.appliesLongerRange);
            // Actual range checks
            if (requireSuccess && special.useActualRange && (!otheritem.attackerPos || !foundToken || !functionalRange)) {
                return false; // If the special uses actual range, the system settings require that this check goes through and either the attacker or defender position can't be determined, fail the check
            } else if (special.useActualRange) {
                if (otheritem?.attackerPos && foundToken?.data && functionalRange) {
                    const dist = getDistanceBetweenPositions(otheritem.attackerPos, foundToken.data);
                    if (!checkIfWithinRange(dist, functionalRange)) {
                        return false; // If the range check goes through and either the distance between defender and attacker is less than min or more than max, fail the check
                    }
                }
                // Weapon range band checks
            } else if (!special.useActualRange && !special.appliesShorterRange && !special.appliesLongerRange) {
                if (!special.rangeOtherArray.includes(otheritem.range)) {
                    return false; // If neither range boolean is set, simply check whether or not the weapon range band is included in the rangeOtherArray 
                }
            } else if (!special.useActualRange) {
                const weaponRange = getRangeDistanceFromBand(otheritem.range);
                if (weaponRange >= 0 && (!checkIfWithinRange(weaponRange, functionalRange))) {
                    return false; // If either boolean is set, check whether the weapon's range band is outside the special's range bands
                }
            }
        }
    } else if (special.nameOtherArray || special.descriptorOtherArray || special.effectOtherArray || special.statOtherArray || special.equipOtherArray || special.rangeOtherArray) {
        return false; // If the special has fields that would expect the other item and none is given, fail the check
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
/*  Bonus Construction Helpers                  */
/* -------------------------------------------- */

/**
 * @typedef {{
 *   otherkeys: Map<string,object>,
 *   otherdice: Map<string,number[]>,
 *   othernames: Map<string,string>,
 *   otherbools: Map<string,boolean>,
 *   otherinputs: string
 * }} DicePoolFormReturn
 */

/**
 * Generic command to add a new bonus field to the dice pool dialog
 * @param {number[]} fielddice The dice for this particular field
 * @param {string} fieldname The name to use for the field in the actual messages
 * @param {string} fieldlabel The label for this field in the dice pool popup
 * @param {boolean} autocheck Whether the field is checked or not by default
 * @param {string} itemid The item id related to this field, if any
 * @param {boolean} exhaustonuse Whether tapping the field will make the related gift exhausted
 * @param {any} param6 The mostly mandatory data which holds the previous values which are being added to
 * @returns {DicePoolFormReturn} Returns a holder object which returns the inputs with the added bonuses
 */
export function formDicePoolField(fielddice, fieldname, fieldlabel, autocheck = true, { itemid = null, exhaustonuse = false } = {},
    { otherkeys = new Map(), otherdice = new Map(), othernames = new Map(), otherbools = new Map(), otherinputs = "" } = {}) {
    let fieldId = foundry.utils.randomID(12); // Make a random id to use for identifying this exact field
    while (otherkeys.has(fieldId)) fieldId = foundry.utils.randomID(12); // Pure paranoia check
    otherkeys.set(fieldId, { "itemId": itemid, "exhaustOnUse": exhaustonuse });
    otherdice.set(fieldId, fielddice);
    othernames.set(fieldId, fieldname);
    otherbools.set(fieldId, autocheck);
    otherinputs += `<div class="form-group flexrow">
                <label class="normal-label">${fieldlabel}</label>
	            <input type="checkbox" id="${fieldId}" name="${fieldId}" ${(autocheck ? "checked" : "")}></input>
                </div>`+ "\n";
    return { otherkeys, otherdice, othernames, otherbools, otherinputs };
}

/**
 * Apply range penalty from the raw distance in paces to the roll
 * @param {any} otherinputs
 * @param {any} otherbools
 * @param {any} otherkeys
 * @param {any} otherdice
 * @param {any} othernames
 * @param {number} distance The distance to get a penalty for, in paces
 * @param {number} reduction The degree of penalty reduction
 * @param {boolean} autocheck Whether to autocheck the penalty, only really false for when a wand is used
 * @param {boolean} allowovermax Whether to allow a range penalty over the maximum distance to exist (true), or to show it as an error (false)
 * @returns {object} Returns a holder object which returns the inputs with the added bonuses
 */
export function getDistancePenaltyConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, distance, { reduction = 0, autocheck = true, allowovermax = false, explosionpenalty = false } = {}) {
    const usePenalties = game.settings.get("ironclaw2e", "rangePenalties");
    if (!usePenalties) {
        // If the penalties are turned off, just return out with the inputs as they were
        return { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs };
    }

    let foo = null;
    const foobar = getRangeDiceFromDistance(distance, reduction, allowovermax, true);
    const distanceDice = foobar.rangeDice;
    const rangeBand = foobar.rangeBandOriginal;
    const distKey = "Range Penalty";
    if (distanceDice === "error") {
        otherinputs += `<div class="form-group flexrow">
                <label class="normal-label"><strong>${game.i18n.localize("ironclaw2e.dialog.dicePool.rangeOverMax")}</strong></label>
                </div>`+ "\n";
    } else if (distanceDice) {
        const diceArray = findTotalDice(distanceDice);
        const distLabel = game.i18n.format((explosionpenalty ? "ironclaw2e.dialog.dicePool.rangePenaltyExplosion" : "ironclaw2e.dialog.dicePool.rangePenaltyAttacker"), { "range": rangeBand, "penalty": distanceDice });
        foo = formDicePoolField(diceArray, distKey, distLabel, autocheck, {}, { otherkeys, otherdice, othernames, otherbools, otherinputs });
        otherkeys = foo.otherkeys;
        otherdice = foo.otherdice;
        othernames = foo.othernames;
        otherbools = foo.otherbools;
        otherinputs = foo.otherinputs;
    }
    return (foo ? foo : { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs });
}

/**
 * Apply combat advantage for the attacker based on the target's condition
 * @param {any} otherkeys
 * @param {any} otherdice
 * @param {any} otherinputs
 * @param {any} otherbools
 * @param {Token} target
 * @param {boolean} autocheck Whether to autocheck the penalty, only really false for when a wand is used
 * @returns {object} Returns a holder object which returns the inputs with the added bonuses
 */
export function getCombatAdvantageConstruction(otherkeys, otherdice, othernames, otherbools, otherinputs, target, { autocheck = true } = {}) {
    let foo = null;
    if (target && checkIfDisadvantagedIronclaw(target)) {
        const diceArray = findTotalDice(CommonSystemInfo.combatAdvantageDice);
        const advKey = "Combat Advantage";
        const advLabel = game.i18n.format("ironclaw2e.dialog.dicePool.combatAdvantage", { "bonus": CommonSystemInfo.combatAdvantageDice });
        foo = formDicePoolField(diceArray, advKey, advLabel, autocheck, {}, { otherkeys, otherdice, othernames, otherbools, otherinputs });
        otherkeys = foo.otherkeys;
        otherdice = foo.otherdice;
        othernames = foo.othernames;
        otherbools = foo.otherbools;
        otherinputs = foo.otherinputs;
    }

    return (foo ? foo : { "otherkeys": otherkeys, "otherdice": otherdice, "othernames": othernames, "otherbools": otherbools, "otherinputs": otherinputs });
}

/* -------------------------------------------- */
/*  Misc Helpers                                */
/* -------------------------------------------- */

/**
 * Helper function to search through a given item list for any items matching the name given
 * Used over .items.getName() to allow slightly inexact name lookup, rather than requiring exactly the correct name
 * @param {Collection} itemlist The actor's item list to be checked
 * @param {string} itemname The item in question to search for
 * @param {string} itemtype Optionally, also limit the search based on item type, in cases where that might matter
 * @returns {Ironclaw2EItem} Returns the item in question
 */
export function findInItems(itemlist, itemname, itemtype = null) {
    if (!itemlist || typeof itemlist[Symbol.iterator] !== 'function') {
        console.error("Find in items failed, received something not iterable: " + itemlist);
        return null;
    }

    const useitemtype = itemtype ? true : false;
    // First remove all whitespace from the itemname, then make a case-insensitive regexp from it
    const regex = new RegExp(`^${itemname.replace(/\s/g, '')}\$`, "gi");
    // Go through all the items until the itemname regexp (and optionally the itemtype) match with something
    return itemlist.find(element => (useitemtype ? element.data.type === itemtype : true) && regex.test(element.data.name.replace(/\s/g, '')));
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

/**
 * Helper to check whether the quick roll dialog skip button is held
 * @returns {boolean} Whether the skip key was held
 */
export function checkQuickModifierKey() {
    const downkeys = game.keyboard.downKeys;
    const binds = game.keybindings.get("ironclaw2e", "quickRollModifier");
    for (let bind of binds) {
        if (downkeys.has(bind.key)) {
            let allmods = 0;
            bind.modifiers.forEach(x => { if (downkeys.has(x)) allmods++; });
            if (bind.modifiers.length == allmods) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Get the correct flag identifiers to use for non-core elevation
 */
export function getCorrectElevationFlag() {
    let modId = "ironclaw2e";
    let flagId = "elevation";
    if (game.ironclaw2e.useETLElevation) {
        modId = "enhanced-terrain-layer";
    }
    return { modId, flagId };
}

/**
 * @typedef {{
 *   confirmed: boolean,
 *   chatSent: boolean
 * }} ConfirmationReturn
 */

/**
 * Pop up a confirmation box and return a promise to how it is resolved
 * @param {string} title
 * @param {string} message
 * @param {string} button
 * @param {boolean} localize
 * @returns {Promise<ConfirmationReturn>}
 */
export function popupConfirmationBox(title, message, button, { localize = true, actorname = "", itemname = "", targetname = "", defaultbutton = "one", includesend = false, senddefault = true } = {}) {
    let confirmed = false;
    const usedTitle = (localize ? game.i18n.format(title, { "actor": actorname, "item": itemname, "target": targetname }) : title);
    const sendPart = `
     <div class="form-group">
       <label class="normal-label">${game.i18n.localize("ironclaw2e.dialog.sendToChat")}</label>
       <input type="checkbox" id="send" name="send" value="1" ${senddefault ? "checked" : ""}></input>
     </div>`;
    let contents = `
     <form class="ironclaw2e">
      <h1>${(localize ? game.i18n.format(message, { "actor": actorname, "item": itemname, "target": targetname }) : message)}</h1>
      ${(includesend ? sendPart : "")}
     </form>
     `;
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usedTitle,
            content: contents,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: (localize ? game.i18n.localize(button) : button),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: defaultbutton,
            render: html => { },
            close: html => {
                let sent = false;
                if (confirmed) {
                    if (includesend) {
                        let SEND = html.find('[name=send]');
                        sent = SEND.length > 0 ? SEND[0].checked : false;
                    }
                }
                resolve({ "confirmed": confirmed, "chatSent": sent });
            }
        });
        dlog.render(true);
    });
    return resolvedroll;
}