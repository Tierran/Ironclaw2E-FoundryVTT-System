// Import Modules
import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EActorSheet } from "./actor/actor-sheet.js";

import { Ironclaw2EItem } from "./item/item.js";
import { Ironclaw2EItemSheet } from "./item/item-sheet.js";

import { requestRollPopup } from "./utilitiesmacros.js";

import { Ironclaw2ECombat } from "./combat.js";
import { Ironclaw2ECombatant } from "./combat.js";
import { Ironclaw2ECombatTracker } from "./combat.js";

import { CardinalDiceRoller } from "./dicerollers.js";
import { rollTargetNumberDialog } from "./dicerollers.js";
import { rollHighestDialog } from "./dicerollers.js";
import { rollTargetNumberOneLine } from "./dicerollers.js";
import { rollHighestOneLine } from "./dicerollers.js";
import { copyToRollTNDialog } from "./dicerollers.js";

import { getSpeakerActor, makeCompareReady } from "./helpers.js";

import { getVersionNumbers } from "./versionupgrade.js";
import { checkIfNewerVersion } from "./versionupgrade.js";
import { upgradeVersion } from "./versionupgrade.js";

import { chatCommandsIntegration } from "./commands.js";

import { CommonConditionInfo } from "./conditions.js";

import { CommonSystemInfo } from "./systeminfo.js";

import { registerHandlebarsHelpers } from "./handlebars.js";

import { WorldSettingsConfig } from "./config.js";
import { CoinageSettingsConfig } from "./config.js";
import { measureDistances } from "./canvas.js";

/* -------------------------------------------- */
/*  Base Hooks                                  */
/* -------------------------------------------- */

Hooks.once('init', async function () {

    game.ironclaw2e = {
        // Document claases
        Ironclaw2EActor,
        Ironclaw2EItem,
        Ironclaw2ECombat,
        Ironclaw2ECombatant,
        Ironclaw2ECombatTracker,
        // Hotbar macros
        rollItemMacro,
        popupMacro,
        popupSelect,
        popupDamage,
        requestRollPopup,
        // Dice rolling commands
        CardinalDiceRoller,
        rollTargetNumberDialog,
        rollHighestDialog,
        rollTargetNumberOneLine,
        rollHighestOneLine,
        // System info
        CommonSystemInfo,
        CommonConditionInfo,
        // Misc
        "useCUBConditions": false,
        waitUntilReady,
        sleep
    };

    // Define custom Document classes
    CONFIG.Actor.documentClass = Ironclaw2EActor;
    CONFIG.Item.documentClass = Ironclaw2EItem;
    CONFIG.Combat.documentClass = Ironclaw2ECombat;
    CONFIG.Combatant.documentClass = Ironclaw2ECombatant;
    CONFIG.ui.combat = Ironclaw2ECombatTracker;
    CONFIG.statusEffects = CommonConditionInfo.conditionList;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "-1",
        decimals: 2
    };
    CONFIG.time.roundTime = 6;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ironclaw2e", Ironclaw2EActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ironclaw2e", Ironclaw2EItemSheet, { makeDefault: true });

    // Register system world config menus
    game.settings.registerMenu("ironclaw2e", "worldSettingsConfig", {
        name: "ironclaw2e.config.worldConfig.menuName",
        hint: "ironclaw2e.config.worldConfig.menuHint",
        label: "ironclaw2e.config.worldConfig.menuLabel",
        icon: "fas fa-globe",
        type: WorldSettingsConfig,
        restricted: true
    });
    game.settings.registerMenu("ironclaw2e", "coinageSettingsConfig", {
        name: "ironclaw2e.config.coinageConfig.menuName",
        hint: "ironclaw2e.config.coinageConfig.menuHint",
        label: "ironclaw2e.config.coinageConfig.menuLabel",
        icon: "fas fa-coins",
        type: CoinageSettingsConfig,
        restricted: true
    });
    // Register system world settings
    game.settings.register("ironclaw2e", "preferTokenName", {
        name: "ironclaw2e.config.preferTokenName",
        hint: "ironclaw2e.config.preferTokenNameHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "autoPrototypeSetup", {
        name: "ironclaw2e.config.autoPrototypeSetup",
        hint: "ironclaw2e.config.autoPrototypeSetupHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "allowNonGMRequestRolls", {
        name: "ironclaw2e.config.allowNonGMRequestRolls",
        hint: "ironclaw2e.config.allowNonGMRequestRollsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "sendWeaponExhaustMessage", {
        name: "ironclaw2e.config.sendWeaponExhaustMessage",
        hint: "ironclaw2e.config.sendWeaponExhaustMessageHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    game.settings.register("ironclaw2e", "showRangeCombatRules", {
        name: "ironclaw2e.config.showRangeCombatRules",
        hint: "ironclaw2e.config.showRangeCombatRulesHint",
        scope: "world",
        type: Number,
        default: 1,
        config: false,
        choices: CommonSystemInfo.rangeCombatRules
    });
    // Chat button configs
    game.settings.register("ironclaw2e", "chatButtons", {
        name: "ironclaw2e.config.chatButtons",
        hint: "ironclaw2e.config.chatButtonsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "showDefenseButtons", {
        name: "ironclaw2e.config.showDefenseButtons",
        hint: "ironclaw2e.config.showDefenseButtonsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    // Initiative condition config
    game.settings.register("ironclaw2e", "autoInitiativeConditions", {
        name: "ironclaw2e.config.autoInitiativeConditions",
        hint: "ironclaw2e.config.autoInitiativeConditionsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    // Auto condition removal configs
    game.settings.register("ironclaw2e", "autoConditionRemoval", {
        name: "ironclaw2e.config.autoConditionRemoval",
        hint: "ironclaw2e.config.autoConditionRemovalHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    game.settings.register("ironclaw2e", "autoConditionRemovalNoTurns", {
        name: "ironclaw2e.config.autoConditionRemovalNoTurns",
        hint: "ironclaw2e.config.autoConditionRemovalNoTurnsHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    // Encumbrance configs
    game.settings.register("ironclaw2e", "manageEncumbranceAuto", {
        name: "ironclaw2e.config.manageEncumbranceAuto",
        hint: "ironclaw2e.config.manageEncumbranceAutoHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    game.settings.register("ironclaw2e", "coinsHaveWeight", {
        name: "ironclaw2e.config.coinsHaveWeight",
        hint: "ironclaw2e.config.coinsHaveWeightHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    // Damage calculation configs
    game.settings.register("ironclaw2e", "calculateAttackEffects", {
        name: "ironclaw2e.config.calculateAttackEffects",
        hint: "ironclaw2e.config.calculateAttackEffectsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "calculateDisplaysFailed", {
        name: "ironclaw2e.config.calculateDisplaysFailed",
        hint: "ironclaw2e.config.calculateDisplaysFailedHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "calculateDoesNotDisplay", {
        name: "ironclaw2e.config.calculateDoesNotDisplay",
        hint: "ironclaw2e.config.calculateDoesNotDisplayHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    // Range settings
    game.settings.register("ironclaw2e", "diagonalRule", {
        name: "ironclaw2e.config.diagonalRule",
        hint: "ironclaw2e.config.diagonalRuleHint",
        scope: "world",
        config: false,
        default: "EUCL",
        type: String,
        choices: CommonSystemInfo.diagonalRules,
        onChange: rule => canvas.grid.diagonalRule = rule
    });
    game.settings.register("ironclaw2e", "rangePenalties", {
        name: "ironclaw2e.config.rangePenalties",
        hint: "ironclaw2e.config.rangePenaltiesHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: false
    });
    game.settings.register("ironclaw2e", "matchStandardRuler", {
        name: "ironclaw2e.config.matchStandardRuler",
        hint: "ironclaw2e.config.matchStandardRulerHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });
    game.settings.register("ironclaw2e", "requireSpecialRangeFound", {
        name: "ironclaw2e.config.requireSpecialRangeFound",
        hint: "ironclaw2e.config.requireSpecialRangeFoundHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });

    // Coinage settings
    game.settings.register("ironclaw2e", "currencySettings", {
        scope: "world",
        type: Object,
        default: {
            baseCurrency: {
                "name": "denar",
                "plural": "denarii",
                "weight": 4.5,
                "value": "1",
                "sign": 208,
                "used": true
            }, addedCurrency1: {
                "name": "orichalk",
                "plural": "orichalks",
                "weight": 3.5,
                "value": "1/12",
                "sign": 415,
                "used": true
            }, addedCurrency2: {
                "name": "aureal",
                "plural": "aureals",
                "weight": 6.3,
                "value": "24",
                "sign": 8371,
                "used": true
            }, addedCurrency3: {
                "name": "quinqunx",
                "plural": "quinqunxes",
                "weight": 13.5,
                "value": "3",
                "sign": 81,
                "used": true
            }
        },
        config: false
    });
    // Register a version number that was used last time to allow determining if a new version is being used, world-scope for system function updates
    game.settings.register("ironclaw2e", "lastSystemVersionWorld", {
        scope: "world",
        type: String,
        default: game.system.data.version,
        config: false
    });

    // Register system client settings
    game.settings.register("ironclaw2e", "defaultSendDamage", {
        name: "ironclaw2e.config.defaultSendDamage",
        hint: "ironclaw2e.config.defaultSendDamageHint",
        scope: "client",
        type: Boolean,
        default: true,
        config: true
    });
    game.settings.register("ironclaw2e", "confirmItemInfo", {
        name: "ironclaw2e.config.confirmItemInfo",
        hint: "ironclaw2e.config.confirmItemInfoHint",
        scope: "client",
        type: Boolean,
        default: false,
        config: true
    });
    game.settings.register("ironclaw2e", "showRangeWhenTargeting", {
        name: "ironclaw2e.config.showRangeWhenTargeting",
        hint: "ironclaw2e.config.showRangeWhenTargetingHint",
        scope: "client",
        type: Boolean,
        default: true,
        config: true
    });
    game.settings.register("ironclaw2e", "showRangeDuration", {
        name: "ironclaw2e.config.showRangeDuration",
        hint: "ironclaw2e.config.showRangeDurationHint",
        scope: "client",
        type: Number,
        default: 3000,
        range: {min: 1000, max: 4000, step: 200},
        config: true
    });

    // Register a version number that was used last time to allow determining if a new version is being used, client-scope for potential update logs and such
    game.settings.register("ironclaw2e", "lastSystemVersionClient", {
        scope: "client",
        type: String,
        default: game.system.data.version,
        config: false
    });

    // TO BE REMOVED in the version 0.6, old single-setting version check stored in the client
    game.settings.register("ironclaw2e", "lastSystemVersion", {
        scope: "client",
        type: String,
        default: game.system.data.version,
        config: false
    });

    // Register keybinds for the system
    game.keybindings.register("ironclaw2e", "quickRollModifier", {
        name: "Quick Roll Modifier Key",
        hint: "If pressed, the system will attempt to skip dialog popups and instead make dice rolls or execute funtions immediately with default values, where available.",
        editable: [
            {
                key: "ControlLeft"
            },
            {
                key: "ControlRight"
            }
        ],
        restricted: false
    });

    // Handlebars helper registration
    registerHandlebarsHelpers();

    console.log("Ironclaw2E System init complete");
});

Hooks.once('setup', async function () {
    // Combat Utility Belt check
    let cubActive = game.modules.get("combat-utility-belt")?.active == true;
    let conditionsActive = cubActive ? game.settings.get("combat-utility-belt", "enableEnhancedConditions") : false; // Since get throws an error if the key does not exist, first check if CUB is even active
    if (cubActive && conditionsActive) {
        game.ironclaw2e.useCUBConditions = true;
        console.log("CUB detected and Enhanced Conditions active! Using CUB Conditions.");
    }

    console.log("Ironclaw2E System setup complete");
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
            forceSettings: false,
            skipDefeated: false,
            manualTN: -1
        });
    }

    // CUB remove defaults nag
    if (game.ironclaw2e.useCUBConditions && game.settings.get("combat-utility-belt", "removeDefaultEffects") === false) {
        ui.notifications.info(game.i18n.localize("ironclaw2e.ui.removeDefaultConditionsNag"), { permanent: true });
    }

    // World Version checks 
    if (game.user.isGM) {
        // TO BE REMOVED
        const obsoleteLastVersion = game.settings.get("ironclaw2e", "lastSystemVersion");
        if (checkIfNewerVersion("0.5.5", obsoleteLastVersion)) {
            game.settings.set("ironclaw2e", "lastSystemVersion", game.system.data.version);
        }
        // REMOVE THE SPECIAL CHECK
        const lastVersion = (checkIfNewerVersion("0.5.5", obsoleteLastVersion) ? obsoleteLastVersion : game.settings.get("ironclaw2e", "lastSystemVersionWorld"));
        // TO BE REMOVED END
        console.log("Last system version played: " + lastVersion);
        if (checkIfNewerVersion(game.system.data.version, lastVersion)) {
            await upgradeVersion(lastVersion);
        }
        game.settings.set("ironclaw2e", "lastSystemVersionWorld", game.system.data.version);
    }

    // Client Version checks
    const lastClientVersion = game.settings.get("ironclaw2e", "lastSystemVersionClient");
    if (checkIfNewerVersion(game.system.data.version, lastClientVersion)) {
        // Insert changelog popups here
    }
    game.settings.set("ironclaw2e", "lastSystemVersionClient", game.system.data.version);


    console.log("Ironclaw2E System ready");
});


/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function () {
    // Implement Euclidean measurement by default
    canvas.grid.diagonalRule = game.settings.get("ironclaw2e", "diagonalRule");
    SquareGrid.prototype.measureDistances = measureDistances;
});


/* -------------------------------------------- */
/*  Additional Hooks                            */
/* -------------------------------------------- */

/**
 * Adds the Ironclaw context menu options to the given menu
 * @param {any} html
 * @param {any} entryOptions The menu
 */
function addIronclawChatLogContext(html, entryOptions) {
    entryOptions.push(
        {
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
        },
        {
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
                CardinalDiceRoller.copyToRollHighest(message);
            }
        },
        {
            name: "ironclaw2e.rerollOne",
            icon: '<i class="fas fa-redo"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const original = message.getFlag("ironclaw2e", "originalRoll");
                const hasOne = message.getFlag("ironclaw2e", "hasOne");
                const allowed = message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && original && hasOne;
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                const type = message.getFlag("ironclaw2e", "rollType");
                if (type === "TN") {
                    CardinalDiceRoller.copyToRollTN(parseInt(message.roll.formula.slice(message.roll.formula.indexOf(">") + 1)), message, true, true);
                } else {
                    CardinalDiceRoller.copyToRollHighest(message, true, true);
                }
            }
        },
        {
            name: "ironclaw2e.showAttack",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const successes = message.getFlag("ironclaw2e", "attackSuccessCount");
                // Check whether the attack effect calculation is active, the message has a roll, has a weapon id and a positive number of successes set and has explicitly been set to have a hanging normal attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && weaponid && successes > 0 && type === "attack";
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const actorid = message.getFlag("ironclaw2e", "hangingActor");
                const tokenid = message.getFlag("ironclaw2e", "hangingToken");
                const sceneid = message.getFlag("ironclaw2e", "hangingScene");
                const actor = game.scenes.get(sceneid)?.tokens.get(tokenid)?.actor || game.actors.get(actorid);
                const weapon = actor?.items.get(weaponid) || game.items.get(weaponid);
                weapon?.resendNormalAttack?.(message);
            }
        },
        {
            name: "ironclaw2e.resolveCounter",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                // Check whether the attack effect calculation is active, the message has a roll, has a weapon id set and has explicitly been set to have a hanging counter-attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && weaponid && type === "counter";
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const actorid = message.getFlag("ironclaw2e", "hangingActor");
                const tokenid = message.getFlag("ironclaw2e", "hangingToken");
                const sceneid = message.getFlag("ironclaw2e", "hangingScene");
                const actor = game.scenes.get(sceneid)?.tokens.get(tokenid)?.actor || game.actors.get(actorid);
                const weapon = actor?.items.get(weaponid) || game.items.get(weaponid);
                weapon?.resolveCounterAttack?.(message);
            }
        },
        {
            name: "ironclaw2e.resolveResist",
            icon: '<i class="fas fa-bolt"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
                // Check whether the attack effect calculation is active, the message has a roll, has a weapon id and a positive number of successes set and has explicitly been set to have a hanging resist attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && weaponid && successes > 0 && type === "resist";
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const actorid = message.getFlag("ironclaw2e", "hangingActor");
                const tokenid = message.getFlag("ironclaw2e", "hangingToken");
                const sceneid = message.getFlag("ironclaw2e", "hangingScene");
                const actor = game.scenes.get(sceneid)?.tokens.get(tokenid)?.actor || game.actors.get(actorid);
                const weapon = actor?.items.get(weaponid) || game.items.get(weaponid);
                weapon?.resolveResistedAttack?.(message);
            }
        },
        {
            name: "ironclaw2e.resolveAsNormal",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
                // Check whether the attack effect calculation is active, the message has a roll, has a weapon id and a positive number of successes set and has explicitly been set to have a hanging resist attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && weaponid && successes > 0 && type === "resist";
                return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
            },
            callback: li => {
                const message = game.messages.get(li.data("messageId"));
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const actorid = message.getFlag("ironclaw2e", "hangingActor");
                const tokenid = message.getFlag("ironclaw2e", "hangingToken");
                const sceneid = message.getFlag("ironclaw2e", "hangingScene");
                const actor = game.scenes.get(sceneid)?.tokens.get(tokenid)?.actor || game.actors.get(actorid);
                const weapon = actor?.items.get(weaponid) || game.items.get(weaponid);
                weapon?.resolveAsNormalAttack?.(message);
            }
        },
        {
            name: "ironclaw2e.attackAgainstDefense",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const type = message.getFlag("ironclaw2e", "rollType");
                const messageid = message.getFlag("ironclaw2e", "defenseForAttack");
                const attackMessage = game.messages.get(messageid);
                // Check that the message is a roll and that the message has a callback id to the attacker's item info chat message
                const allowed = message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && attackMessage && type;
                return allowed && (game.user.isGM || attackMessage.isAuthor) && attackMessage.isContentVisible && message.isContentVisible;
            },
            callback: async li => {
                const message = game.messages.get(li.data("messageId"));
                const type = message.getFlag("ironclaw2e", "rollType");
                const messageid = message.getFlag("ironclaw2e", "defenseForAttack");
                const attackMessage = game.messages.get(messageid);
                const tn = (type === "HIGH" ? message.roll.result : 3);
                const resists = (type === "TN" ? message.roll.result : -1);
                Ironclaw2EActor.triggerAttackerRoll(attackMessage, "attack", false, type === "HIGH", tn, resists);
            }
        });
}
Hooks.on("getChatLogEntryContext", addIronclawChatLogContext);

/* -------------------------------------------- */
/*  Functions                                   */
/* -------------------------------------------- */

/**
 * Delay an async function for set milliseconds
 * @param {number} ms
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Quick and dirty way to make condition adding and removing wait until the game is fully ready
 * @param {any} resolve
 */
async function waitUntilReady(resolve) {
    while (!game.ready) {
        await sleep(500);
    }
    return true;
}

/* -------------------------------------------- */
/*  External Module Support                     */
/* -------------------------------------------- */

// Drag Ruler integration
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
            const stridespeed = token.actor?.data.data.stride || 0;
            const dashspeed = token.actor?.data.data.dash || 0;
            const runspeed = token.actor?.data.data.run || 0;

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

// ChatCommands integration
// Using async and delays to ensure the same press of enter does not also automatically close the dialog
Hooks.on("chatCommandsReady", chatCommandsIntegration);

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
    if (!("data" in data)) return ui.notifications.warn(game.i18n.localize("ironclaw2e.ui.macroOwnedItemsWarning"));
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
 * Roll an item macro for the currently selected actor, if the actor has the given item
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const actor = getSpeakerActor();
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(game.i18n.format("ironclaw2e.ui.actorDoesNotHaveItem", { "itemName": itemName }));

    // Trigger the item roll
    return item.roll();
}

/**
 * Popup a certain type of dialog screen on the currently selected actor
 * @param {number} popup The type of popup to open
 * @returns {Promise}
 */
function popupMacro(popup) {
    const actor = getSpeakerActor();
    if (!actor) return ui.notifications.warn(game.i18n.localize("ironclaw2e.ui.actorNotFoundForMacro"));

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
            ui.notifications.warn(game.i18n.format("ironclaw2e.ui.popupNotFoundForMacro", { "popup": popup }));
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
 * @param {boolean} quick Whether the roll skips the dialog
 */
function popupSelect(prechecked = [], tnyes = false, tnnum = 3, extradice = "", quick = false) {
    const actor = getSpeakerActor();
    if (!actor) return ui.notifications.warn(game.i18n.localize("ironclaw2e.ui.actorNotFoundForMacro"));

    return actor.basicRollSelector({ prechecked, tnyes, tnnum, extradice }, { "directroll": quick === true });
}

/**
 * Popup the standard dice pool selection dialog with some readied data
 * @param {number} readydamage The damage to use for default
 * @param {number} readysoak The soak to use for default
 * @param {string} damageconditions Extra conditions to be added alongside the damage conditions
 * @param {boolean} quick Whether the roll skips the dialog
 */
function popupDamage(readydamage = 0, readysoak = 0, damageconditions = "", quick = false) {
    const actor = getSpeakerActor();
    if (!actor) return ui.notifications.warn(game.i18n.localize("ironclaw2e.ui.actorNotFoundForMacro"));

    if (quick === true)
        return actor.silentDamage(readydamage, readysoak, damageconditions);
    else
        return actor.popupDamage(readydamage, readysoak, damageconditions);
}