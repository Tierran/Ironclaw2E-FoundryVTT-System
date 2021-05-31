import { rollHighest } from "./dicerollers.js";
import { rollTargetNumber } from "./dicerollers.js";

import { findTotalDice } from "./helpers.js";
import { splitSingleDiceString } from "./helpers.js";

/**
 * A function intended for the ChatCommands integration, it takes a string and decides what mode to use from it
 * @param {string} inputstring A one-line style string, with potentially a target number as a simple number for the "first" dice argument
 */
export function ironclawRollChat(inputstring) {
    if (typeof inputstring !== "string") {
        console.warn("Something other than a string inputted into ironclawRoll: " + inputstring.toString());
    }

    let dicearray = findTotalDice(inputstring);
    let tn = -1;
    let foo = inputstring.split(","); // If the first value from the command is a simple number and not a dice string, change the roll into a TN roll and use the number as a TN
    if (foo.length > 0 && !splitSingleDiceString(foo[0])) {
        let bar = parseInt(foo[0].trim());
        if (!isNaN(bar))
            tn = bar;
    }

    if (tn > 0)
        rollTargetNumber(tn, dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4]);
    else
        rollHighest(dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4]);
}