// Utilities and Macros
// Random non-helper stuff that are substantial, relatively self-contained, and I couldn't really think of another place to dump into
import { checkQuickModifierKey, convertCamelCase, findActorToken, getActorFromSpeaker, getDistanceBetweenPositions, getMacroSpeaker, getSpeakerActor, makeCompareReady, splitStatsAndBonus, splitStatString } from "./helpers.js";
import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EItem } from "./item/item.js";
import { getRangeBandFromDistance } from "./systeminfo.js";
import { hasConditionsIronclaw } from "./conditions.js";
import { CardinalDiceRoller, copyToRollTNDialog, rerollDialog } from "./dicerollers.js";
const { renderTemplate } = foundry.applications.handlebars;

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

// Chat Message Button Handler
Hooks.on("renderChatMessage", function (message, html, data) {
    // 'Who to show stuff to' system settings
    const noButtons = game.settings.get("ironclaw2e", "chatButtons") === false;
    const showOthersToAll = game.settings.get("ironclaw2e", "showDefenseButtons");
    const showDescription = game.settings.get("ironclaw2e", "npcItemHasDescription");
    const showTactics = game.settings.get("ironclaw2e", "showOthersTacticsUse");
    const buttons = html.find('.button-holder');

    // Chat message button system
    if (noButtons) {
        // If buttons are disabled, remove the buttons from the visible messages
        buttons.remove();
    } else {
        const showAuthor = game.user.isGM || message.isAuthor; // Check to show buttons meant to the author
        const showOthers = game.user.isGM || !message.isAuthor || showOthersToAll; // Check to show buttons meant for others

        // Get the flags of the message that determine what type of message it is
        const itemInfo = message.getFlag("ironclaw2e", "itemInfo");
        const attackInfo = message.getFlag("ironclaw2e", "attackDamageInfo");
        const requestRoll = message.getFlag("ironclaw2e", "requestRoll");

        if (itemInfo) {
            const tacticsButtons = buttons.find('.tactics-buttons');
            const tacticsBox = tacticsButtons.find('.tactics-checkbox');
            if (tacticsBox[0]) tacticsBox[0].checked = message.getFlag("ironclaw2e", "attackUsingTactics") ?? false; // Set the checkbox to its supposed state

            if (showAuthor) {
                const attackButtons = buttons.find('.attack-buttons');
                attackButtons.find('.default-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackButtons.find('.skip-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackButtons.find('.spark-attack').click(Ironclaw2EActor.onChatSparkClick.bind(this));

                buttons.find('.gift-buttons').find('.default-gift-use').click(Ironclaw2EActor.onChatGiftUseClick.bind(this));

                const templateButtons = buttons.find('.template-buttons');
                templateButtons.find('.place-template').click(Ironclaw2EActor.onPlaceExplosionTemplate.bind(this));

                // Only bind the tactics change here to ensure only the author and GM can do it
                tacticsBox.change(Ironclaw2EActor.onChangeTacticsUse.bind(this));
                if (tacticsBox[0]) tacticsBox[0].disabled = false;
            } else {
                buttons.find('.attack-holder').remove();
                buttons.find('.gift-holder').remove();
                if (!showTactics) {
                    // Remove the tactics checkbox from being visible
                    tacticsButtons.remove();
                }
            }

            if (showOthers) {
                const defenseButtons = buttons.find('.defense-buttons');
                defenseButtons.find('.dodge-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseButtons.find('.parry-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseButtons.find('.special-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseButtons.find('.resist-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseButtons.find('.counter-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
            } else {
                buttons.find('.defense-buttons').remove();
            }
        }
        if (attackInfo) {
            if (showOthers) {
                buttons.find('.soak-button').click(Ironclaw2EActor.onChatSoakClick.bind(this));
                buttons.find('.apply-tier-button').click(Ironclaw2EActor.onChatApplyTierClick.bind(this));
            } else {
                buttons.remove();
            }
        }
        if (requestRoll) {
            if (showOthers) {
                buttons.find('.asked-roll-button').click(onRequestRollTrigger.bind(this));
            } else {
                buttons.remove();
            }
        }
    }

    // Description hiding system, only go here if some descriptions should be hidden
    if (showDescription === false && !game.user.isGM) {
        const actor = getActorFromSpeaker(message.speaker);
        // If the actor exists and has no player owner
        const hideDescription = (actor && actor?.hasPlayerOwner === false);
        if (hideDescription) {
            // If description should be hidden, remove it
            html.find('.item-description').remove();
            html.find('.item-statistics').remove();
        }
    }
});

// Distance Text Handlers
Hooks.on("targetToken", function (user, token, targeted) {
    const showRange = game.settings.get("ironclaw2e", "showRangeWhenTargeting");
    if (!(showRange && user.id === game.userId)) {
        // Unless the option is on and the user this triggered to is the current one, return out
        return;
    }
    // Only show the text when the token is targeted, not un-targeted
    if (targeted) {
        const foundToken = findActorToken(getSpeakerActor());
        showScrollingDistanceText(foundToken, token.document ? token.document : token);
    }
});

Hooks.on("updateToken", function (token, data, options, userid) {
    const showRange = game.settings.get("ironclaw2e", "showRangeWhenTargeting");
    if (!showRange || game.user.targets.size === 0) {
        // If the option is turned off or the current user does not have any targets, return out
        return;
    }
    if (!data.hasOwnProperty("x") && !data.hasOwnProperty("y") && !data.hasOwnProperty("elevation")) {
        // If the update has nothing to do with position, return out
        return;
    }
    const isTargeted = game.user.targets.ids.includes(token.id);
    const foundToken = findActorToken(getSpeakerActor());
    if (isTargeted || token.id === foundToken.id) {
        if (isTargeted) {
            showScrollingDistanceText(foundToken, token.document ? token.document : token);
        } else {
            for (let target of game.user.targets) {
                showScrollingDistanceText(foundToken, target.document ? target.document : target);
            }
        }
    }
});

/* -------------------------------------------- */
/*  Request Roll Functions                      */
/* -------------------------------------------- */

/**
 * Split a free-text dice pool into its stat names and bonus dice, keeping the names as typed
 * @param {string} text Dice pool text, eg. "Body, Melee Combat;d12"
 * @returns {{names: string[], bonus: string}}
 */
function splitRequestPoolText(text) {
    text = (text ?? "").trim();
    if (!text) return { "names": [], "bonus": "" };
    // A plain dice string without a semicolon, eg. "2d6", is all bonus dice
    if (!text.includes(";") && splitStatsAndBonus(text)[0].length === 0) return { "names": [], "bonus": text };

    const index = text.indexOf(";");
    const statPart = (index >= 0 ? text.slice(0, index) : text);
    const bonus = (index >= 0 ? text.slice(index + 1).trim() : "");
    return { "names": statPart.split(",").map(x => x.trim()).filter(x => x.length > 0), bonus };
}

/**
 * Trigger a popup to specify what roll to request
 * @param {string} readydice
 * @param {number} tnnum
 * @param {string} whispername
 */
export async function requestRollPopup(readydice = "", readygifts = "", tnnum = 3, whispername = "") {
    const allowNonGM = game.settings.get("ironclaw2e", "allowNonGMRequestRolls");
    if (!game.user.isGM && !allowNonGM) {
        // If the user is not a GM and the world settings do not allow non-GM's to ask rolls
        ui.notifications.warn("ironclaw2e.ui.requestRollNotAllowed", { localize: true });
        return;
    }

    const macroSpeaker = getMacroSpeaker(this?.actor);
    const userSpeaker = { alias: game.user.name };

    // Build the trait and skill checkbox lists from the character data model, pre-checking any that are in the given dice pool
    const characterModel = game.model.Actor.character;
    const ready = splitRequestPoolText(readydice);
    const readyNames = new Set(ready.names.map(x => makeCompareReady(x)));
    const usedNames = new Set();
    const makeStat = key => {
        const checked = readyNames.has(makeCompareReady(key));
        if (checked) usedNames.add(makeCompareReady(key));
        return { key, "label": convertCamelCase(key), checked };
    };
    const traits = Object.keys(characterModel.traits).map(makeStat);
    const skills = Object.keys(characterModel.skills).map(makeStat);

    // Whisper options are the other users currently online, plus the given whisper target if it's someone else
    const whisperUsers = game.users.filter(x => x.active && x.id !== game.user.id).map(x => ({ "name": x.name, "selected": x.name === whispername }));
    if (whispername && !whisperUsers.some(x => x.selected)) whisperUsers.push({ "name": whispername, "selected": true });

    const templateData = {
        "userAlias": userSpeaker.alias,
        "macroAlias": macroSpeaker.alias,
        whisperUsers,
        "readygifts": readygifts,
        "tnnum": tnnum,
        traits,
        skills
    };

    const dialogContent = await renderTemplate("systems/ironclaw2e/templates/popup/request-popup.html", templateData);

    const data = await foundry.applications.api.DialogV2.wait({
        window: { title: "ironclaw2e.dialog.requestRoll.requestRollHeader" },
        position: { width: 600 },
        content: dialogContent,
        buttons: [{
            action: "request",
            icon: "fas fa-check",
            label: "ironclaw2e.dialog.request",
            default: true,
            callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object
        }, {
            action: "cancel",
            icon: "fas fa-times",
            label: "ironclaw2e.dialog.cancel"
        }],
        rejectClose: false
    });
    if (!data || typeof data !== "object") return; // Cancelled or closed

    const usernumber = parseInt(data.selectuser) || 0;
    const whisper = data.whisper ?? "";
    const tn = (data.tn === null || data.tn === undefined || data.tn === "" ? -1 : parseInt(data.tn));
    const gifts = data.gifts ?? "";

    // The requested dice pool is the checked traits and skills
    const dices = [...traits, ...skills].filter(x => data[`stat.${x.key}`]).map(x => x.label).join(", ");

    requestRollToMessage(dices, (isNaN(tn) ? -1 : tn), { "speaker": (usernumber === 1 ? macroSpeaker : userSpeaker), "whisper": whisper, "requestedgifts": gifts });
}

/**
 * Actual sending of the chat message that requests the roll
 * @param {string} dicepool
 * @param {number} tn
 * @param {any} param2
 */
export async function requestRollToMessage(dicepool, tn, { whisper = "", speaker = null, requestedgifts = "" } = {}) {
    const allowNonGM = game.settings.get("ironclaw2e", "allowNonGMRequestRolls");
    if (!game.user.isGM && !allowNonGM) {
        // If the user is not a GM and the world settings do not allow non-GM's to request rolls
        ui.notifications.warn("ironclaw2e.ui.requestRollNotAllowed", { localize: true });
        return;
    }
    if (!dicepool) {
        // Stop the request roll sending if there is nothing requested
        ui.notifications.info("ironclaw2e.ui.requestRollEmpty", { localize: true });
        return;
    }

    speaker = speaker ?? ChatMessage.getSpeaker();
    const tnyes = tn > 0;
    const tnnum = tn > 0 ? tn : 3;

    const templateData = {
        "speaker": speaker.alias,
        "stats": dicepool,
        "requestedGifts": requestedgifts,
        "tnyes": tnyes,
        "tnnum": tnnum
    };

    const contents = await renderTemplate("systems/ironclaw2e/templates/chat/request-roll.html", templateData);

    let flags = {
        "ironclaw2e.requestRoll": true, "ironclaw2e.requestDicePool": dicepool, "ironclaw2e.requestedGifts": requestedgifts,
        "ironclaw2e.requestTNYes": tnyes, "ironclaw2e.requestTNNum": tnnum, "ironclaw2e.requestSpeaker": speaker.alias
    };

    let chatData = {
        content: contents,
        speaker,
        flags
    };
    // Check whether the whisper field even contains anything, then whether there are multiple users there split with commas
    if (typeof whisper === "string" && whisper?.length > 0) {
        let whisperIds = [];
        const whisperSplit = whisper.split(",");
        if (whisperSplit.length > 1) {
            for (let foo of whisperSplit) {
                whisperIds = whisperIds.concat(ChatMessage.getWhisperRecipients(foo));
            }
        } else {
            whisperIds = whisperIds.concat(ChatMessage.getWhisperRecipients(whisper));
        }
        chatData.whisper = whisperIds;
    } else {
        ChatMessage.applyRollMode(chatData, "publicroll");
    }
    CONFIG.ChatMessage.documentClass.create(chatData);
}

/**
 * The function to trigger when a user presses the "Roll dice pool" button
 * @param {any} event
 */
async function onRequestRollTrigger(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);
    const requestActor = getSpeakerActor();

    if (!requestActor) {
        ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        return null;
    }
    const direct = checkQuickModifierKey();
    const messageFlags = message?.flags?.ironclaw2e;

    // Check to make sure the flags actually exist
    if (messageFlags) {
        const splitStats = splitStatsAndBonus(messageFlags.requestDicePool);
        const splitGifts = splitStatString(messageFlags.requestedGifts ?? []);
        const giftSetup = requestActor.requestedGiftDialogConstruction(splitGifts);
        requestActor.basicRollSelector({
            "tnyes": messageFlags.requestTNYes, "tnnum": messageFlags.requestTNNum, "prechecked": splitStats[0], "otherkeys": giftSetup.otherkeys,
            "otherdice": giftSetup.otherdice, "othernames": giftSetup.othernames, "otherbools": giftSetup.otherbools, "otherinputs": giftSetup.otherinputs,
            "extradice": splitStats[1], "otherlabel": game.i18n.format("ironclaw2e.chatInfo.requestRoll.rollLabel", { "user": messageFlags.requestSpeaker })
        }, { "directroll": direct });
    }
}

/* -------------------------------------------- */
/*  Distance Showing Functions                  */
/* -------------------------------------------- */

/**
 * Function that pops up a text showing the distance band to the targettoken from the origintoken
 * @param {TokenDocument} origintoken
 * @param {TokenDocument} targettoken
 */
export function showScrollingDistanceText(origintoken, targettoken) {
    // Only show the text if the origin and target exist, and are not the same token
    if (origintoken && targettoken && origintoken.id !== targettoken.id) {
        const combatRule = game.settings.get("ironclaw2e", "showRangeCombatRules");
        const duration = game.settings.get("ironclaw2e", "showRangeDuration") ?? 3000;
        let usecombatrules = combatRule === 2;
        if (combatRule === 1) {
            if (game.combat?.getCombatantByToken(origintoken.id))
                usecombatrules = true;
        }
        // Double-check that everything that should exist does
        if (targettoken && origintoken) {
            const center = targettoken.object.center;
            const distance = getDistanceBetweenPositions(origintoken, targettoken, { usecombatrules });
            const range = getRangeBandFromDistance(distance, true);
            const text = game.i18n.format("ironclaw2e.ui.rangeScrolling", { "range": range });
            canvas.interface.createScrollingText(center, text, { anchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM, direction: CONST.TEXT_ANCHOR_POINTS.TOP, duration, jitter: 0.1, fontSize: 28, stroke: 0x000000, strokeThickness: 4 });
        }
    }
}


/* -------------------------------------------- */
/*  Drag Ruler Integration                      */
/* -------------------------------------------- */

/**
 * Drag Ruler integration for the Ironclaw system
 * @param {SpeedProvider} SpeedProvider
 */
export function ironclawDragRulerIntegration(SpeedProvider) {
    class Ironclaw2ESpeedProvider extends SpeedProvider {
        get colors() {
            return [
                { id: "stride", default: 0x0000FF, name: "ironclaw2e.speeds.stride" },
                { id: "dash", default: 0x00DE00, name: "ironclaw2e.speeds.dash" },
                { id: "run", default: 0xFFFF00, name: "ironclaw2e.speeds.run" }
            ];
        }

        getRanges(token) {
            const stridespeed = token.actor?.system.stride || 0;
            const dashspeed = token.actor?.system.dash || 0;
            const runspeed = token.actor?.system.run || 0;

            const ranges = [
                { range: stridespeed, color: "stride" },
                { range: dashspeed + stridespeed, color: "dash" },
                { range: runspeed, color: "run" }
            ];

            return ranges;
        }

        getCostForStep(token, area, options = {}) {
            // Lookup the cost for each square occupied by the token
            options.token = token;
            const costs = area.map(space => terrainRuler.getCost(space.x, space.y, options));
            // If the token has flying or the actor ignores bad footing, it ignores all difficult terrain
            const ignored = hasConditionsIronclaw("flying", token) || token?.actor?.system.ignoreBadFooting;
            if (ignored) {
                return 1;
            }
            // Return the maximum of the costs
            return costs.reduce((max, current) => Math.max(max, current));
        }
    }

    dragRuler.registerSystem("ironclaw2e", Ironclaw2ESpeedProvider);
}

/* -------------------------------------------- */
/*  Context Menus                               */
/* -------------------------------------------- */
/* eslint-disable */

/**
 * Small function to get the hanging actor from a message
 * @param {any} message
 * @private
 */
function getHangingActor(message) {
    const actorid = message.getFlag("ironclaw2e", "hangingActor");
    const tokenid = message.getFlag("ironclaw2e", "hangingToken");
    const sceneid = message.getFlag("ironclaw2e", "hangingScene");
    return game.scenes.get(sceneid)?.tokens.get(tokenid)?.actor || game.actors.get(actorid);
}

/**
 * Get the weapon a hanging attack message was rolled with, as the right spell attack for magic gifts
 * @param {ChatMessage} message
 * @returns {Ironclaw2EItem | null}
 */
function getHangingWeapon(message) {
    const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
    const actor = getHangingActor(message);
    const weapon = actor?.items.get(weaponid) || game.items.get(weaponid);
    return weapon?.asSpellAttack(message.getFlag("ironclaw2e", "hangingSpellAttack")) ?? null;
}

/**
 * Adds the Ironclaw context menu options to the chat log
 * @param {any} html
 * @param {any} entryOptions The menu
 */
function _icNormalizeTarget(target) {
  // V13 often passes HTMLElement; some flows pass jQuery. Normalize to HTMLElement.
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (target[0] instanceof HTMLElement) return target[0];
  return null;
}

function _icGetMessageIdFromTarget(targetEl) {
  if (!targetEl) return null;

  // Sometimes the target is a child inside the message; walk up to something that has a message id.
  const el =
    targetEl.closest?.("[data-message-id], [data-messageId], li.chat-message, .chat-message") ?? targetEl;

  // Foundry typically uses data-message-id in chat log markup, but be defensive.
  return (
    el?.dataset?.messageId ??
    el?.dataset?.messageid ?? // just in case something lowercases it
    el?.getAttribute?.("data-message-id") ??
    el?.getAttribute?.("data-messageId") ??
    null
  );
}

function _icGetMessageFromTarget(target) {
  const el = _icNormalizeTarget(target);
  const messageId = _icGetMessageIdFromTarget(el);
  return messageId ? game.messages.get(messageId) : null;
}

function addIronclawChatLogContext(app, entryOptions) {
  entryOptions.push(
    {
      name: "ironclaw2e.context.chatLog.copyToTN",
      icon: '<i class="fas fa-bullseye"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const type = message.getFlag("ironclaw2e", "rollType");
        const allowed = message.isRoll && type && type === "HIGH";
        return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;
        copyToRollTNDialog(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.changeTN",
      icon: '<i class="fas fa-bullseye"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const type = message.getFlag("ironclaw2e", "rollType");
        const allowed = message.isRoll && type && type === "TN";
        return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;
        copyToRollTNDialog(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.copyToHighest",
      icon: '<i class="fas fa-dice-d6"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const type = message.getFlag("ironclaw2e", "rollType");
        const allowed = message.isRoll && type && type === "TN";
        return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;
        CardinalDiceRoller.copyToRollHighest(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.rerollOne",
      icon: '<i class="fas fa-redo"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const rerollable =
          message.getFlag("ironclaw2e", "rollIntermediary") ||
          message.getFlag("ironclaw2e", "originalRoll");
        const hasOne = message.getFlag("ironclaw2e", "hasOne");
        const type = message.getFlag("ironclaw2e", "rollType");
        const allowed = message.isRoll && rerollable && hasOne && type !== "MINI";
        return allowed && (game.user.isGM || message.isAuthor) && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const type = message.getFlag("ironclaw2e", "rollType");
        const targetNumber = message.getFlag("ironclaw2e", "targetNumber");
        if (type === "TN") {
          CardinalDiceRoller.copyToRollTN(targetNumber, message, true, "ONE");
        } else {
          CardinalDiceRoller.copyToRollHighest(message, true, "ONE");
        }
      }
    },
    {
      name: "ironclaw2e.context.chatLog.rerollDialog",
      icon: '<i class="fas fa-redo"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const rerollable = message.getFlag("ironclaw2e", "rollIntermediary");
        const hasOne = message.getFlag("ironclaw2e", "hasOne");
        const statsUsed = message.getFlag("ironclaw2e", "usedActorStats");
        const actor = getSpeakerActor();
        const usableRerolls = actor
          ? (actor.getGiftRerollTypes?.(statsUsed, hasOne, message.isAuthor, false)?.size ?? 0) > 0
          : game.user.isGM;

        const type = message.getFlag("ironclaw2e", "rollType");
        const allowed = message.isRoll && rerollable && usableRerolls && type !== "MINI";
        return allowed && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const actor = getSpeakerActor();
        rerollDialog(message, actor);
      }
    },

    // Combat roll context options
    {
      name: "ironclaw2e.context.chatLog.showAttack",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const successes = message.getFlag("ironclaw2e", "attackSuccessCount");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && weaponid && successes > 0 && type === "attack";
        return allowed && (game.user.isGM || (message.isAuthor && actor?.isOwner)) && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resendNormalAttack?.(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.showAttackSlaying",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const isslaying = message.getFlag("ironclaw2e", "hangingSlaying");
        const successes = message.getFlag("ironclaw2e", "attackSuccessCount");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && !isslaying && weaponid && successes > 0 && type === "attack";
        return allowed && message.isAuthor && actor?.isOwner && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resendNormalAttack?.(message, true);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.resolveCounter",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && weaponid && type === "counter";
        return allowed && message.isAuthor && actor?.isOwner && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resolveCounterAttack?.(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.resolveResist",
      icon: '<i class="fas fa-bolt"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && weaponid && successes > 0 && type === "resist";
        return allowed && message.isAuthor && actor?.isOwner && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resolveResistedAttack?.(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.resolveAsNormal",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && weaponid && successes > 0 && type === "resist";
        return allowed && message.isAuthor && actor?.isOwner && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resolveAsNormalAttack?.(message);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.resolveAsSlaying",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
        const type = message.getFlag("ironclaw2e", "hangingAttack");
        const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
        const isslaying = message.getFlag("ironclaw2e", "hangingSlaying");
        const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
        const actor = getHangingActor(message);

        const allowed = active && message.isRoll && !isslaying && weaponid && successes > 0 && type === "resist";
        return allowed && message.isAuthor && actor?.isOwner && message.isContentVisible;
      },
      callback: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;

        const weapon = getHangingWeapon(message);
        weapon?.resolveAsNormalAttack?.(message, true);
      }
    },
    {
      name: "ironclaw2e.context.chatLog.attackAgainstDefense",
      icon: '<i class="fas fa-fist-raised"></i>',
      condition: target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return false;

        const type = message.getFlag("ironclaw2e", "rollType");
        const messageid = message.getFlag("ironclaw2e", "defenseForAttack");
        const attackMessage = game.messages.get(messageid);

        const allowed = message.isRoll && attackMessage && type;
        return (
          allowed &&
          (game.user.isGM || attackMessage.isAuthor) &&
          attackMessage.isContentVisible &&
          message.isContentVisible
        );
      },
      callback: async target => {
        const message = _icGetMessageFromTarget(target);
        if (!message) return;
        attackAgainstDefense(message);
      }
    }
  );
}

Hooks.on("getChatMessageContextOptions", addIronclawChatLogContext);

/**
 * Attack against a defense roll, using its result as the attack's TN or as the opposing successes
 * The original attacker rolls the original weapon, anyone else picks one of their own actor's weapons
 * @param {ChatMessage} message The defense roll message
 * @param {boolean} anyAttacker Whether actors other than the original attacker can attack, as with the chat button
 */
async function attackAgainstDefense(message, anyAttacker = false) {
    const type = message.getFlag("ironclaw2e", "rollType");
    const attackMessage = game.messages.get(message.getFlag("ironclaw2e", "defenseForAttack"));
    if (!type || !attackMessage) return;

    const tn = (type === "HIGH" ? message.rolls[0].result : 3);
    const resists = (type === "TN" ? message.rolls[0].result : -1);
    const ignoreresist = type === "HIGH";

    if (anyAttacker) {
        // Attack as the actor the user is acting as, unless that's the original attacker
        const originalActor = Ironclaw2EActor.getItemActor(Ironclaw2EActor.getItemActorFlags(attackMessage.flags?.ironclaw2e));
        const actor = getSpeakerActor();
        if (actor && actor.uuid !== originalActor?.uuid) {
            const weapon = await pickAttackWeapon(actor);
            return weapon?.attackRoll(false, ignoreresist, tn, resists, { "defendermessage": message });
        }
        if (!actor && originalActor && !originalActor.isOwner) {
            ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
            return;
        }
    }

    Ironclaw2EActor.triggerAttackerRoll(attackMessage, "attack", false, ignoreresist, message, tn, resists);
}

/**
 * Ask which of an actor's weapons to attack with, skipping the question if there is only one
 * @param {Ironclaw2EActor} actor
 * @returns {Promise<Ironclaw2EItem|null>}
 */
async function pickAttackWeapon(actor) {
    // Magic gifts are listed once per spell attack that can attack
    const weapons = [];
    for (let item of actor.items) {
        if (item.type === "magicGift") {
            item.system.spellAttacks?.forEach((attack, index) => {
                if (attack.attackDice?.length > 0) weapons.push({ "value": `${item.id}.${index}`, "name": `${item.name}: ${attack.name}` });
            });
        } else if (item.isWeaponLike && item.system.canAttack) {
            weapons.push({ "value": item.id, "name": item.name });
        }
    }
    if (weapons.length === 0) {
        ui.notifications.warn(game.i18n.format("ironclaw2e.ui.noAttackWeapons", { "name": actor.name }));
        return null;
    }
    const getPicked = value => {
        const [id, index] = value.split(".");
        return actor.items.get(id)?.asSpellAttack(index === undefined ? null : parseInt(index)) ?? null;
    };
    if (weapons.length === 1) return getPicked(weapons[0].value);

    const options = weapons.map(x => `<option value="${x.value}">${Handlebars.escapeExpression(x.name)}</option>`).join("");
    const picked = await foundry.applications.api.DialogV2.wait({
        window: { title: "ironclaw2e.dialog.attackDefense.title" },
        content: `<div class="form-group"><label>${game.i18n.format("ironclaw2e.dialog.attackDefense.pickWeapon", { "name": Handlebars.escapeExpression(actor.name) })}</label><select name="weapon">${options}</select></div>`,
        buttons: [{
            action: "attack",
            icon: "fas fa-fist-raised",
            label: "ironclaw2e.dialog.attackDefense.attack",
            default: true,
            callback: (event, button) => button.form.elements.weapon.value
        }, {
            action: "cancel",
            icon: "fas fa-times",
            label: "ironclaw2e.dialog.cancel"
        }],
        rejectClose: false
    });
    return (picked && picked !== "cancel" ? getPicked(picked) : null);
}

// Add an "Attack This Defense" button to defense rolls that answer an attack, usable by anyone
Hooks.on("renderChatMessageHTML", function (message, html) {
    if (game.settings.get("ironclaw2e", "chatButtons") === false) return;
    const attackMessage = game.messages.get(message.getFlag("ironclaw2e", "defenseForAttack"));
    if (!message.isRoll || !message.getFlag("ironclaw2e", "rollType") || !attackMessage || !message.isContentVisible) return;

    const content = html.querySelector(".message-content");
    if (!content || content.querySelector(".attack-this-defense")) return;

    const holder = document.createElement("div");
    holder.className = "ironclaw2e";
    holder.innerHTML = `<div class="chat-item button-holder flexrow"><button type="button" class="attack-this-defense"><i class="fas fa-fist-raised"></i> ${game.i18n.localize("ironclaw2e.chatInfo.attackThisDefense")}</button></div>`;
    content.append(holder);
    holder.querySelector(".attack-this-defense").addEventListener("click", event => {
        event.preventDefault();
        attackAgainstDefense(message, true);
    });
});

/**
 * Automatically resolve a counter-attack rolled against a TN (countering a resisted attack) once the attacker has rolled against it
 * If the counter has as many or more successes than the attack, the counter's damage is sent to chat, the same as resolving it from the context menu
 * Only one client does this: the counter roll's author if they are online, otherwise the active GM
 * @param {ChatMessage} message The attack roll message that was updated
 * @param {object} changes The changes made to the message
 */
async function autoResolveCounterAttack(message, changes) {
    const answer = foundry.utils.getProperty(changes, "flags.ironclaw2e.counterAnswer");
    if (!answer?.counterMessageId || !game.settings.get("ironclaw2e", "calculateAttackEffects")) return;

    const counterMessage = game.messages.get(answer.counterMessageId);
    if (!counterMessage?.getFlag("ironclaw2e", "counterAgainstTN")) return;
    const resolver = (counterMessage.author?.active ? counterMessage.author : game.users.activeGM);
    if (resolver?.id !== game.user.id || counterMessage.getFlag("ironclaw2e", "counterResolved")) return;

    // The counter only deals damage if it ties or beats the attack
    const countersuccesses = counterMessage.getFlag("ironclaw2e", "resistSuccessCount") ?? 0;
    const attacksuccesses = answer.successes ?? 0;
    if (countersuccesses <= 0 || countersuccesses < attacksuccesses) return;

    const weapon = getHangingWeapon(counterMessage);
    if (!weapon) return;

    await counterMessage.setFlag("ironclaw2e", "counterResolved", true);
    return weapon.attackToChat({ "success": countersuccesses > attacksuccesses, "rawsuccesses": countersuccesses, "opposingrolled": true, "opposingsuccesses": attacksuccesses, "countertie": true });
}
Hooks.on("updateChatMessage", autoResolveCounterAttack);
/* eslint-enable */

/**
 * Adds the Ironclaw context menu options to the item folder directory
 * @param {foundry.applications.sidebar.DocumentDirectory} application
 * @param {any} entryOptions The menu
 */
function addIronclawItemDirectoryFolderContext(application, entryOptions) {
    // The folder hook fires for every directory, only the Items directory has template folders
    if (application.documentName !== "Item") return;
    entryOptions.push(
        {
            name: "ironclaw2e.context.items.setAsSpeciesSource",
            icon: '<i class="fas fa-bullseye"></i>',
            condition: header => {
                const folder = game.folders.get(header.closest(".directory-item")?.dataset.folderId);
                return game.user.isGM && !!folder?.contents.some(x => x.type === "speciesTemplate");
            },
            callback: header => {
                const id = header.closest(".directory-item").dataset.folderId;
                game.settings.set("ironclaw2e", "templateSpeciesFolder", id);
            }
        },
        {
            name: "ironclaw2e.context.items.setAsCareerSource",
            icon: '<i class="fas fa-bullseye"></i>',
            condition: header => {
                const folder = game.folders.get(header.closest(".directory-item")?.dataset.folderId);
                return game.user.isGM && !!folder?.contents.some(x => x.type === "careerTemplate");
            },
            callback: header => {
                const id = header.closest(".directory-item").dataset.folderId;
                game.settings.set("ironclaw2e", "templateCareerFolder", id);
            }
        });
}
Hooks.on("getFolderContextOptions", addIronclawItemDirectoryFolderContext);

/**
 * Adds the Ironclaw context menu options to the item directory
 * @param {foundry.applications.sidebar.tabs.ItemDirectory} application
 * @param {any} entryOptions The menu
 */
function addIronclawItemDirectoryEntryContext(application, entryOptions) {
    entryOptions.push(
        {
            name: "ironclaw2e.context.items.sendToChat",
            icon: '<i class="fas fa-comment-dots"></i>',
            condition: li => {
                const id = li.dataset.entryId;
                return game.user.isGM && game.items.has(id);
            },
            callback: li => {
                const id = li.dataset.entryId;
                const item = game.items.get(id);
                if (item)
                    item.sendInfoToChat();
                else
                    ui.notifications.warn("ironclaw2e.ui.itemNotFound", { "localize": true });
            }
        });
}
Hooks.on("getItemContextOptions", addIronclawItemDirectoryEntryContext);
