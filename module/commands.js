import { rollHighestArray } from "./dicerollers.js";
import { rollTargetNumberArray } from "./dicerollers.js";

import { findTotalDice } from "./helpers.js";
import { splitStatsAndBonus } from "./helpers.js";
import { makeStatCompareReady } from "./helpers.js";

/**
 * A function intended for the ChatCommands integration, it takes a string and tries to convert it into a sort-of one-line roll
 * @param {string} inputstring A one-line style string, with a target number attached to it after a semicolon after the one-line part
 */
export function ironclawRollChat(inputstring) {
    if (typeof inputstring !== "string") {
        console.error("Something other than a string inputted into ironclawRoll: " + inputstring.toString());
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
        rollTargetNumberArray(tn, dicearray);
    else
        rollHighestArray(dicearray);
}

/**
 * A function intended for the ChatCommands integration, it takes a string and tries to use it as a stat string to open the actor's dice popup with pre-checked fields
 * @param {string} inputstring An item roll string, with a target number attached to it after an extra semicolon after the extra dice section
 * @param {any} speaker The caller of the function
 */
export function ironclawRollActorChat(inputstring, speaker) {
    if (typeof inputstring !== "string") {
        console.error("Something other than a string inputted into ironclawRollActorChat: " + inputstring.toString());
        return;
    }

    if (!speaker?.actor || !speaker?.token) {
        ui.notifications.warn(game.i18n.localize("ironclaw2e.ui.actorNotSelectedActorroll"));
        return;
    }

    let actor = (speaker?.token ? game.actors.tokens[speaker.token] : null)?.token?.actor;
    if (!actor) {
        actor = game.actors.get(speaker.actor);
        if (!actor) {
            ui.notifications.warn(game.i18n.format("ironclaw2e.chat.actorNotFoundForSpeaker", { "name": speaker.toString() }));
            return;
        }
    }

    let specialcheck = makeStatCompareReady(inputstring); // Special checks to allow certain special quick rolls
    if (specialcheck === "soak") {
        actor.popupSoakRoll(["body"], true, 3);
        return;
    }
    if (specialcheck === "dodging" || specialcheck === "defense" || specialcheck === "defence") {
        actor.popupDefenseRoll(["speed", "dodge"], false); // Actually dodge roll, despite being called "defense", in order to avoid confusion with the dodge skill for the system
        return;
    }

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