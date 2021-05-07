// Import Modules
import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EActorSheet } from "./actor/actor-sheet.js";
import { Ironclaw2EItem } from "./item/item.js";
import { Ironclaw2EItemSheet } from "./item/item-sheet.js";

import { rollNormalDialog } from "./dicerollers.js";
import { rollOpposedDialog } from "./dicerollers.js";
import { rollNormalOneLine } from "./dicerollers.js";
import { rollOpposedOneLine } from "./dicerollers.js";
import { makeStatCompareReady } from "./helpers.js";

Hooks.once('init', async function () {

    game.ironclaw2e = {
        Ironclaw2EActor,
        Ironclaw2EItem,
        rollItemMacro,
        popupMacro,
        rollNormalDialog,
        rollOpposedDialog,
        rollNormalOneLine,
        rollOpposedOneLine
    };

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "@initiative",
        decimals: 2
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = Ironclaw2EActor;
    CONFIG.Item.entityClass = Ironclaw2EItem;

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

    // If you need to add Handlebars helpers, here are a few useful examples:
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
});

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createIronclaw2EMacro(data, slot));

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