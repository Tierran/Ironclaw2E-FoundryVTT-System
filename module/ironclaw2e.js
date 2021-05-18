// Import Modules
import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EActorSheet } from "./actor/actor-sheet.js";
import { Ironclaw2EItem } from "./item/item.js";
import { Ironclaw2EItemSheet } from "./item/item-sheet.js";

import { Ironclaw2ECombat } from "./combat.js";
import { Ironclaw2ECombatTracker } from "./combat.js";

import { rollTargetNumberDialog } from "./dicerollers.js";
import { rollHighestDialog } from "./dicerollers.js";
import { rollTargetNumberOneLine } from "./dicerollers.js";
import { rollHighestOneLine } from "./dicerollers.js";
import { copyToRollTNDialog } from "./dicerollers.js";
import { copyToRollHighest } from "./dicerollers.js";

import { makeStatCompareReady } from "./helpers.js";

Hooks.once('init', async function () {

    game.ironclaw2e = {
        Ironclaw2EActor,
        Ironclaw2EItem,
        rollItemMacro,
        popupMacro,
        popupSelect,
        rollTargetNumberDialog,
        rollHighestDialog,
        rollTargetNumberOneLine,
        rollHighestOneLine
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = Ironclaw2EActor;
    CONFIG.Item.entityClass = Ironclaw2EItem;
    CONFIG.Combat.entityClass = Ironclaw2ECombat;
    CONFIG.ui.combat = Ironclaw2ECombatTracker;
    CONFIG.time.roundTime = 6;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "-1",
        decimals: 2
    };

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ironclaw2e", Ironclaw2EActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ironclaw2e", Ironclaw2EItemSheet, { makeDefault: true });

    // Register system settings
    game.settings.register("ironclaw2e", "preferTokenName", {
        name: "Use token names:",
        hint: "If checked, dice rollers will not use actor's own names and will instead use the name and presentation of their tokens, when available. Always works for synthetic actors, whereas linked actors require an active scene.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("ironclaw2e", "manageEncumbranceAuto", {
        name: "Manage encumbrance automatically:",
        hint: "If checked, the system will automatically manage Burdened, Over-Burdened and Cannot Move statuses for actors, based on their carried weight and worn armors. Do not try to change them manually when active, doing so is likely to cause errors.",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("ironclaw2e", "coinsHaveWeight", {
        name: "Make coins have weight:",
        hint: "If checked, the weight of coins will be added to the encumbrance of the actor.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("ironclaw2e", "autoPrototypeSetup", {
        name: "Auto-setup prototype tokens:",
        hint: "If checked, newly created actors will have their prototype token's attributes use type-specific defaults.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    // Handlebars helper registration:
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('equalOrNothing', function (str, compare) {
        return str.length == 0 || makeStatCompareReady(str) == compare;
    });

    Handlebars.registerHelper('valueRoundTo', function (val, roundto) {
        return val.toFixed(roundto);
    });
});

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createIronclaw2EMacro(data, slot));

    // Check and set default Combat Tracker options if they do not exist
    let ctOptions = game.settings.get("core", Combat.CONFIG_SETTING);

    if (jQuery.isEmptyObject(ctOptions)) {
        game.settings.set("core", Combat.CONFIG_SETTING, {
            sideBased: true,
            initType: 2,
            skipDefeated: false,
            manualTN: -1
        });
    }

    // Combat Utility Belt warning
    if (!game.cub) {
        ui.notifications.info("Combat Utility Belt not detected! Please install and activate CUB and its Enhanced Conditions for condition tracking.");
    }
});

Hooks.once("dragRuler.ready", (SpeedProvider) => {
    class Ironclaw2ESpeedProvider extends SpeedProvider {
        get colors() {
            return [
                { id: "stride", default: 0x0000FF, name: "ironclaw2e.speeds.stride" },
                { id: "dash", default: 0x00DE00, name: "ironclaw2e.speeds.dash" },
                { id: "run", default: 0xFFFF00, name: "ironclaw2e.speeds.run" }
            ];
        }

        getRanges(token) {
            const stridespeed = token.actor.data.data.stride;
            const dashspeed = token.actor.data.data.dash;
            const runspeed = token.actor.data.data.run;

            const ranges = [
                { range: stridespeed, color: "stride" },
                { range: dashspeed + stridespeed, color: "dash" },
                { range: runspeed, color: "run" }
            ];

            return ranges;
        }
    }

    dragRuler.registerSystem("ironclaw2e", Ironclaw2ESpeedProvider);
});

async function loadHandleBarTemplates() {
    // register templates parts
    const templatePaths = [
        "systems/ironclaw2e/templates/parts/battlestats.html"
    ];
    return loadTemplates(templatePaths);
}

Hooks.once("init", function () {
    loadHandleBarTemplates();
});

Hooks.on("preCreateActor", function (createData) {
    const autoPrototypeSetup = game.settings.get("ironclaw2e", "autoPrototypeSetup");
    if (!autoPrototypeSetup) // If not enabled, immediately return out of the hook
        return true;

    createData.token = {};
    createData.token.displayName = 20;

    if (createData.type === 'character') {
        createData.token.actorLink = true;
        createData.token.vision = true;
    }
});

function addIronclawChatLogContext(html, entryOptions) {
    entryOptions.push({
        name: "ironclaw2e.copyToTN",
        icon: '<i class="fas fa-bullseye"></i>',
        condition: li => {
            const message = game.messages.get(li.data("messageId"));
            const type = message.getFlag("ironclaw2e", "rollType");
            const allowed = message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && type && type != "TN";
            return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
        },
        callback: li => {
            const message = game.messages.get(li.data("messageId"));
            copyToRollTNDialog(message);
        }
    }, {
        name: "ironclaw2e.changeTN",
        icon: '<i class="fas fa-bullseye"></i>',
        condition: li => {
            const message = game.messages.get(li.data("messageId"));
            const type = message.getFlag("ironclaw2e", "rollType");
            const allowed = message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && type && type == "TN";
            return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
        },
        callback: li => {
            const message = game.messages.get(li.data("messageId"));
            copyToRollTNDialog(message);
        }
    },
        {
            name: "ironclaw2e.copyToHighest",
            icon: '<i class="fas fa-dice-d6"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const type = message.getFlag("ironclaw2e", "rollType");
                const allowed = message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && type && type != "HIGH";
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                copyToRollHighest(message);
            }
        });
}

Hooks.on("getChatLogEntryContext", addIronclawChatLogContext);

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createIronclaw2EMacro(data, slot) {
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.ironclaw2e.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "ironclaw2e.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}

/**
 * Popup a certain type of dialog screen on the currently selected actor
 * @param {number} popup The type of popup to open
 * @returns {Promise}
 */
function popupMacro(popup) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor) return ui.notifications.warn("No actor found to popup macro for: " + speaker);

    // Trigger the popup
    switch (popup) {
        case 0:
            return actor.popupSelectRolled();
            break;
        case 1:
            return actor.popupDamage();
            break;
        case 2:
            return actor.popupAddCondition();
            break;
        default:
            ui.notifications.warn("No specific popup command found for: " + popup);
            return actor.popupSelectRolled();
            break;
    }
}

/**
 * Popup the standard dice pool selection dialog with some readied data
 * @param {string[]} prechecked Array of skills to autocheck on the dialog, must be in lowercase and without spaces
 * @param {boolean} tnyes Whether to use a TN, true for yes
 * @param {number} tnnum TN to use, ignored if highest roll
 * @param {string} extradice Default extra dice to use for the bottom one-line slot
 */
function popupSelect(prechecked = [], tnyes = false, tnnum = 3, extradice = "") {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    if (!actor) return ui.notifications.warn("No actor found to popup macro for: " + speaker);

    return actor.popupSelectRolled(prechecked, tnyes, tnnum, extradice);
}