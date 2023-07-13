import { CardinalDiceRoller } from "./dicerollers.js";

import { findTotalDice, parseSingleDiceString, splitStatString } from "./helpers.js";
import { splitStatsAndBonus } from "./helpers.js";
import { makeCompareReady } from "./helpers.js";
import { CommonSystemInfo } from "./systeminfo.js";
import { requestRollToMessage } from "./utilitiesmacros.js";

export function chatCommandsIntegration(chatCommands) {
    // Using async and delays to ensure the same press of enter does not also automatically close the dialog

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
        commandKey: "/popuproll",
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
        commandKey: "/quickroll",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRollActorChat(messageText, chatdata?.speaker, true);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user",
        description: game.i18n.localize("ironclaw2e.command.quickroll")
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
        description: game.i18n.localize("ironclaw2e.command.quickroll")
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

    // Add damage to the currently selected actor
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/actordamage",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawDamageApplyChat(messageText, chatdata?.speaker);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-tint",
        description: game.i18n.localize("ironclaw2e.command.actordamage")
    }));

    // Send a chat message that asks users to roll selected dice
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/requestroll",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRequestRollChat(messageText, chatdata?.speaker);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user",
        description: game.i18n.localize("ironclaw2e.command.requestroll")
    }));

    // Send a chat message that asks users to roll selected dice
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/askroll",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRequestRollChat(messageText, chatdata?.speaker);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user",
        description: game.i18n.localize("ironclaw2e.command.requestroll")
    }));

    // Send a whisper message that asks select users to roll selected dice
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/whisperask",
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
            await game.ironclaw2e.sleep(100);
            ironclawRequestRollChat(messageText, chatdata?.speaker, true);
        },
        shouldDisplayToChat: false,
        iconClass: "fa-user-secret",
        description: game.i18n.localize("ironclaw2e.command.whisperask")
    }));
}

/**
 * A function intended for the ChatCommands integration, it takes a string and tries to convert it into a sort-of one-line roll
 * @param {string} inputstring A one-line style string, with a target number attached to it after a semicolon after the one-line part
 */
function ironclawRollChat(inputstring) {
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
        CardinalDiceRoller.rollTargetNumberArray(tn, dicearray);
    else
        CardinalDiceRoller.rollHighestArray(dicearray);
}

/**
 * A function intended for the ChatCommands integration, it takes a string and tries to use it as a stat string to open the actor's dice popup with pre-checked fields
 * @param {string} inputstring An item dice pool string, with a target number attached to it after an extra semicolon after the extra dice section
 * @param {any} speaker The caller of the function
 * @param {boolean} direct Whether the roll pops a dialog or just rolls directly
 */
function ironclawRollActorChat(inputstring, speaker, direct = false) {
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

    const piecedinput = inputstring.split(";"); // Split the input to pieces
    const specialcheck = makeCompareReady(piecedinput[0]); // Special checks to allow certain special quick rolls
    if (specialcheck === "soak") {
        actor.popupSoakRoll({ "prechecked": actor.getActorScaleType() === "vehicle" ? CommonSystemInfo.soakVehicleStats : CommonSystemInfo.soakBaseStats, "tnyes": true, "tnnum": 3, "extradice": (piecedinput.length > 1 ? piecedinput[1] : "") }, { "directroll": direct });
        return;
    }
    if (specialcheck === "dodging" || specialcheck === "defense" || specialcheck === "defence") {
        actor.popupDefenseRoll({ "prechecked": CommonSystemInfo.dodgingBaseStats, "extradice": (piecedinput.length > 1 ? piecedinput[1] : "") }, { "directroll": direct });
        // Actually dodge roll, despite being called "defense", in order to avoid confusion with the dodge skill for the system
        return;
    }

    let tn = -1;
    let usedstring = inputstring;

    // Attempt to check whether the input has two semicolons, and use the value after the third as a TN
    if (piecedinput.length > 2) {
        let bar = parseInt(piecedinput[2].trim());
        if (!isNaN(bar))
            tn = bar;
        usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
    } else if (piecedinput.length === 2) { // Attempt to check whether the input has only one semicolon and see if the part after the semicolon contains actual dice or a plain number
        const test = splitStatString(piecedinput[1]); // Split the potential dice string into pieces for the single dice check
        if (test.length > 0) {
            let bar = parseInt(piecedinput[1].trim());
            if (parseSingleDiceString(test[0]) === null && !isNaN(bar)) {
                tn = bar;
                usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
            }
        }
    }

    let firstsplit = splitStatsAndBonus(usedstring);
    actor.basicRollSelector({ "prechecked": firstsplit[0], "tnyes": tn > 0, "tnnum": (tn > 0 ? tn : 3), "extradice": firstsplit[1] }, { "directroll": direct });
}

/**
 * A function intended for the ChatCommands integration, it takes a readied damage and soak numbers, and a condition name as well as whether to skip the dialogue, all separated by semicolons
 * @param {string} inputstring An item roll string, with a target number attached to it after an extra semicolon after the extra dice section
 * @param {any} speaker The caller of the function
 */
function ironclawDamageApplyChat(inputstring, speaker) {
    if (typeof inputstring !== "string") {
        console.error("Something other than a string inputted into ironclawDamageApplyChat: " + inputstring.toString());
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

    const quickstrings = ["quick", "skip", "direct"]; // Inputs for the fourth slot that trigger a silent damage-applying
    const piecedinput = inputstring.split(";"); // Split the input to pieces
    let damage = parseInt(piecedinput[0]);
    let soak = (piecedinput.length > 1 ? parseInt(piecedinput[1]) : 0);
    const conditions = (piecedinput.length > 2 ? piecedinput[2] : "");
    const quick = (piecedinput.length > 3 ? quickstrings.includes(makeCompareReady(piecedinput[3])) : false);

    // Check for NaN's
    damage = (isNaN(damage) ? 0 : damage);
    soak = (isNaN(soak) ? 0 : soak);

    if (quick)
        actor.silentDamage(damage, soak, conditions);
    else
        actor.popupDamage(damage, soak, conditions);
}

function ironclawRequestRollChat(inputstring, speaker, expectwhisper = false) {
    if (typeof inputstring !== "string") {
        console.error("Something other than a string inputted into ironclawRequestRollChat: " + inputstring.toString());
        return;
    }

    const usedSpeaker = game.user.isGM ? { alias: game.user.name } : speaker;

    const piecedinput = inputstring.split(";"); // Split the input to pieces
    let whisperUsers = "";

    if (expectwhisper) {
        whisperUsers = piecedinput.splice(0, 1)[0];
        inputstring = inputstring.substring(inputstring.indexOf(";") + 1);
    }

    let tn = -1;
    let usedstring = inputstring;
    let gifts = "";

    // Lots of complicated checks to make sure the input is parsed correctly
    if (piecedinput.length > 3) { // If all possible semicolons are present, do basic validation and just pass things along
        let bar = parseInt(piecedinput[2].trim());
        if (!isNaN(bar))
            tn = bar;
        gifts = piecedinput[3];
        usedstring = inputstring.slice(0, inputstring.lastIndexOf(";", inputstring.lastIndexOf(";") - 1)); // Remove the last two semicolons from the string used for determining dice pools
    } else if (piecedinput.length === 3) {// Attempt to check whether the input has two semicolons, and see if the last value is a TN or a Gift list
        const test = splitStatString(piecedinput[1]); // Split the potential dice string into pieces for the single dice check
        if (test.length > 0 && parseSingleDiceString(test[0]) === null) { // If the test turns out to reveal that the second part does not contain dice, assume the last two parts are the TN and gift list
            let bar = parseInt(piecedinput[1].trim());
            if (!isNaN(bar))
                tn = bar;
            gifts = piecedinput[2];
            usedstring = inputstring.slice(0, inputstring.lastIndexOf(";", inputstring.lastIndexOf(";") - 1)); // Remove the last two semicolons from the string used for determining dice pools
        } else {
            let bar = parseInt(piecedinput[2].trim());
            if (!isNaN(bar))
                tn = bar;
            else
                gifts = piecedinput[2];
            usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
        }
    } else if (piecedinput.length === 2) { // Attempt to check whether the input has only one semicolon and see if the part after the semicolon contains actual dice or a plain number
        const test = splitStatString(piecedinput[1]); // Split the potential dice string into pieces for the single dice check
        if (test.length > 0) {
            let bar = parseInt(piecedinput[1].trim());
            if (parseSingleDiceString(test[0]) === null && !isNaN(bar)) {
                tn = bar; // If the dice string doesn't parse and the number parse produces a number, assume the last value is a TN
                usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
            } else if (parseSingleDiceString(test[0]) === null && isNaN(bar)) {
                gifts = piecedinput[1]; // If the dice string doesn't parse and neither does the number, assume the last value is a list of gifts
                usedstring = inputstring.slice(0, inputstring.lastIndexOf(";")); // Remove the last semicolon from the string used for determining dice pools
            }
        }
    }

    requestRollToMessage(usedstring, tn, { "speaker": usedSpeaker, "whisper": whisperUsers, "requestedgifts": gifts });
}