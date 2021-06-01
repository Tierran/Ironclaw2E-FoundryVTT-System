import { rollHighest } from "./dicerollers.js";
import { rollTargetNumber } from "./dicerollers.js";

import { findTotalDice } from "./helpers.js";
import { splitStatsAndBonus } from "./helpers.js";

/**
 * A function intended for the ChatCommands integration, it takes a string and decides what mode to use from it
 * @param {string} inputstring A one-line style string, with a target number attached to it after a semicolon after the one-line part
 */
export function ironclawRollChat(inputstring) {
    if (typeof inputstring !== "string") {
        console.warn("Something other than a string inputted into ironclawRoll: " + inputstring.toString());
        return;
    }
    if (inputstring.length === 0) {
        return; // Return out of the iroll if there is nothing after the command itself
    }

    let tn = -1;
    let foo = inputstring.split(";"); // If the string contains a semicolon, it will split into two parts, and the second part will be used for a TN
    if (foo[0].length === 0)
        return; // Return out of the iroll if the roll command itself is empty

    let dicearray = findTotalDice(foo[0]);
    if (foo.length > 1) {
        let bar = parseInt(foo[1].trim());
        if (!isNaN(bar))
            tn = bar;
    }

    if (tn > 0)
        rollTargetNumber(tn, dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4]);
    else
        rollHighest(dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4]);
}

export function ironclawRollActorChat(inputstring, speaker) {
    if (typeof inputstring !== "string") {
        console.warn("Something other than a string inputted into ironclawRollActorChat: " + inputstring.toString());
        return;
    }

    if (!speaker?.actor) {
        ui.notifications.info("No actor selected for /actorroll.");
        return;
    }

    let actor = game.actors.get(speaker.actor);
    let tn = -1;
    let usedstring = inputstring;
    let foo = inputstring.split(";"); // Attempt to check whether the input has two semicolons, and use the value after the third as a TN
    if (foo.length > 2) {
        let bar = parseInt(foo[2].trim());
        if (!isNaN(bar))
            tn = bar;
        usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
    }

    let firstsplit = splitStatsAndBonus(usedstring);
    actor.popupSelectRolled(firstsplit[0], tn > 0, (tn > 0 ? tn : 3), firstsplit[1]);
}