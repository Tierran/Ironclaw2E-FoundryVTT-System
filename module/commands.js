import { rollHighestArray } from "./dicerollers.js";
import { rollTargetNumberArray } from "./dicerollers.js";

import { findTotalDice } from "./helpers.js";
import { splitStatsAndBonus } from "./helpers.js";
import { makeCompareReady } from "./helpers.js";

export function chatCommandsIntegration(chatCommands) {

    // Basic command to trigger a one-line highest or TN roll from the chat, with the dice included after the command
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/iroll",
        invokeOnCommand: (chatlog, messageText, chatdata) => {
            ironclawRollChat(messageText);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-dice-d6",
        description: game.i18n.localize("ironclaw2e.command.iroll")
    }));

    // Trigger an actor dice pool popup, with optional preselected stats and dice
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/actorroll",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRollActorChat(messageText, chatdata?.speaker);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user",
        description: game.i18n.localize("ironclaw2e.command.actorroll")
    }));

    // Trigger an silent actor dice pool roll
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/directroll",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRollActorChat(messageText, chatdata?.speaker, true);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user",
        description: game.i18n.localize("ironclaw2e.command.directroll")
    }));

    // Use an item as the currently selected actor
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/itemuse",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            game.ironclaw2e.rollItemMacro(messageText.trim());
        },
        shouldDisplayToChat: false,
        iconClass: "fa-fist-raised",
        description: game.i18n.localize("ironclaw2e.command.itemuse")
    }));
}

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
 * @param {boolean} direct Whether the roll pops a dialog or just rolls directly
 */
export function ironclawRollActorChat(inputstring, speaker, direct = false) {
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

    let specialcheck = makeCompareReady(inputstring); // Special checks to allow certain special quick rolls
    if (specialcheck === "soak") {
        actor.popupSoakRoll(direct, ["body"], true, 3);
        return;
    }
    if (specialcheck === "dodging" || specialcheck === "defense" || specialcheck === "defence") {
        actor.popupDefenseRoll(direct, ["speed", "dodge"], false); // Actually dodge roll, despite being called "defense", in order to avoid confusion with the dodge skill for the system
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
    if (direct)
        actor.popupSelectRolled(firstsplit[0], tn > 0, (tn > 0 ? tn : 3), firstsplit[1]);
    else
        actor.popupSelectRolled(firstsplit[0], tn > 0, (tn > 0 ? tn : 3), firstsplit[1]);
}