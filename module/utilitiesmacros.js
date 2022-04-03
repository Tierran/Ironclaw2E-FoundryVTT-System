// Utilities and Macros
// Random non-helper stuff that are substantial, relatively self-contained, and I couldn't really think of another place to dump into
import { findActorToken, getDistanceBetweenPositions, getMacroSpeaker, getSpeakerActor, splitStatsAndBonus } from "./helpers.js";
import { Ironclaw2EActor } from "./actor/actor.js";
import { Ironclaw2EItem } from "./item/item.js";
import { getRangeBandFromDistance } from "./systeminfo.js";
import { hasConditionsIronclaw } from "./conditions.js";
import { AbilityTemplateIronclaw } from "./ability-template.js";
import { CardinalDiceRoller, copyToRollTNDialog } from "./dicerollers.js";

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

// Chat Message Button Handler
Hooks.on("renderChatMessage", function (message, html, data) {
    // 'Who to show stuff to' system settings
    const noButtons = game.settings.get("ironclaw2e", "chatButtons") === false;
    const showOthersToAll = game.settings.get("ironclaw2e", "showDefenseButtons");
    const buttons = html.find('.button-holder');

    if (noButtons) {
        // If buttons are disabled, remove the buttons from the visible messages
        buttons.remove();
    } else {
        const showAuthor = game.user.isGM || message.isAuthor;
        const showOthers = game.user.isGM || !message.isAuthor || showOthersToAll;

        // Get the flags of the message that determine what type of message it is
        const itemInfo = message.getFlag("ironclaw2e", "itemInfo");
        const attackInfo = message.getFlag("ironclaw2e", "attackDamageInfo");
        const requestRoll = message.getFlag("ironclaw2e", "requestRoll");

        if (itemInfo) {
            if (showAuthor) {
                const attackHolder = buttons.find('.attack-buttons');
                attackHolder.find('.default-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackHolder.find('.skip-attack').click(Ironclaw2EActor.onChatAttackClick.bind(this));
                attackHolder.find('.spark-attack').click(Ironclaw2EActor.onChatSparkClick.bind(this));

                const templateHolder = buttons.find('.template-buttons');
                templateHolder.find('.place-template').click(onPlaceExplosionTemplate.bind(this));
            } else {
                buttons.find('.attack-buttons').remove();
                buttons.find('.template-buttons').remove();
            }
            if (showOthers) {
                const defenseHolder = buttons.find('.defense-buttons');
                defenseHolder.find('.dodge-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.parry-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.special-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.resist-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
                defenseHolder.find('.counter-defense').click(Ironclaw2EActor.onChatDefenseClick.bind(this));
            } else {
                buttons.find('.defense-buttons').remove();
            }
        }
        if (attackInfo) {
            if (showOthers) {
                buttons.find('.soak-button').click(Ironclaw2EActor.onChatSoakClick.bind(this));
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
        showScrollingDistanceText(foundToken, token);
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
            showScrollingDistanceText(foundToken, token);
        } else {
            for (let target of game.user.targets)
                showScrollingDistanceText(foundToken, target);
        }
    }
});

/* -------------------------------------------- */
/*  Request Roll Functions                      */
/* -------------------------------------------- */

/**
 * Trigger a popup to specify what roll to request
 * @param {string} readydice
 * @param {number} tnnum
 * @param {string} whispername
 */
export function requestRollPopup(readydice = "", tnnum = -1, whispername = "") {
    const allowNonGM = game.settings.get("ironclaw2e", "allowNonGMRequestRolls");
    if (!game.user.isGM && !allowNonGM) {
        // If the user is not a GM and the world settings do not allow non-GM's to ask rolls
        ui.notifications.warn("ironclaw2e.ui.requestRollNotAllowed", { localize: true });
        return;
    }

    let confirmed = false;
    const macroSpeaker = getMacroSpeaker(this.actor);
    const userSpeaker = { alias: game.user.name };

    let dialogContent = `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.requestRoll.requestRollAsUser")}:</label>
       <select style="width: 60%" id="selectuser" name="selectuser">
        <option value="0" selected>${userSpeaker.alias}</option>
        <option value="1">${macroSpeaker.alias}</option>
       </select>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.requestRoll.whisperLabel")}:</label>
	   <input type="text" id="whisper" name="whisper" value="${whispername}"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.requestRoll.targetNumber")}:</label>
	   <input type="text" id="tn" name="tn" value="${tnnum}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.requestRoll.rollToRequest")}:</label>
      </div>
	  <div class="form-group">
	   <input type="text" id="dices" name="dices" value="${readydice}"></input>
      </div>
     </form>`;

    let dlog = new Dialog({
        title: game.i18n.localize("ironclaw2e.dialog.requestRoll.requestRollHeader"),
        content: dialogContent,
        buttons: {
            one: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("ironclaw2e.dialog.request"),
                callback: () => confirmed = true
            },
            two: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                callback: () => confirmed = false
            }
        },
        default: "one",
        render: html => { document.getElementById("dices").focus(); },
        close: html => {
            if (confirmed) {
                let USER = html.find('[name=selectuser]')[0].value;
                let usernumber = 0; if (USER.length > 0) usernumber = parseInt(USER);
                let WHISPER = html.find('[name=whisper]')[0].value;
                let whisper = ""; if (WHISPER.length > 0) whisper = WHISPER;
                let TNNUM = html.find('[name=tn]')[0].value;
                let tn = -1; if (TNNUM.length > 0) tn = parseInt(TNNUM);
                let DICES = html.find('[name=dices]')[0].value;
                let dices = ""; if (DICES.length > 0) dices = DICES;

                requestRollToMessage(dices, tn, { "speaker": (usernumber === 1 ? macroSpeaker : userSpeaker), "whisper": whisper });
            }
        }
    });
    dlog.render(true);
}

/**
 * Actual sending of the chat message that requests the roll
 * @param {string} dicepool
 * @param {number} tn
 * @param {any} param2
 */
export async function requestRollToMessage(dicepool, tn, { whisper = "", speaker = null } = {}) {
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
        "tnyes": tnyes,
        "tnnum": tnnum
    };

    const contents = await renderTemplate("systems/ironclaw2e/templates/chat/request-roll.html", templateData);

    let flags = { "ironclaw2e.requestRoll": true, "ironclaw2e.requestDicePool": dicepool, "ironclaw2e.requestTNYes": tnyes, "ironclaw2e.requestTNNum": tnnum, "ironclaw2e.requestSpeaker": speaker.alias };

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

    const messageFlags = message?.data?.flags?.ironclaw2e;

    // Check to make sure the flags actually exist
    if (messageFlags) {
        const splitStats = splitStatsAndBonus(messageFlags.requestDicePool);
        requestActor.popupSelectRolled({
            "tnyes": messageFlags.requestTNYes, "tnnum": messageFlags.requestTNNum, "prechecked": splitStats[0],
            "extradice": splitStats[1], "otherlabel": game.i18n.format("ironclaw2e.chatInfo.requestRoll.rollLabel", { "user": messageFlags.requestSpeaker })
        });
    }
}

/**
 * The function to trigger when a user presses the "Place Template" button
 * @param {any} event
 */
async function onPlaceExplosionTemplate(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const message = game.messages.get($(event.currentTarget).closest('.chat-message')[0]?.dataset?.messageId);

    if (!dataset || !message) {
        console.error("Placing a template didn't get the correct data: " + dataset + " " + message);
        return;
    }

    const messageFlags = message?.data?.flags?.ironclaw2e;
    const otheritem = Ironclaw2EActor.getAttackerItemFlags(messageFlags);
    const attackToken = Ironclaw2EActor.getAttackerToken(otheritem);
    if (!attackToken) {
        return;
    }

    // Function to execute on success, setting the proper flags to the item data message
    const onSuccess = async (x) => {
        const flags = {
            "ironclaw2e.weaponTemplatePos": { "x": x.data.x, "y": x.data.y, "elevation": attackToken.data.elevation },
            "ironclaw2e.weaponTemplateId": x.id,
            "ironclaw2e.weaponTemplateSceneId": x.parent?.id
        };
        message.update({ "_id": x.id, "flags": flags });
    };

    const template = AbilityTemplateIronclaw.fromRange(dataset.arearange, attackToken.data.elevation, onSuccess);
    if (template) template.drawPreview();
}

/* -------------------------------------------- */
/*  Distance Showing Functions                  */
/* -------------------------------------------- */

/**
 * Function that pops up a text showing the distance band to the targettoken from the origintoken
 * @param {Token | TokenDocument} origintoken
 * @param {Token | TokenDocument} targettoken
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
        if (targettoken.hud && targettoken.data && origintoken.data) {
            const distance = getDistanceBetweenPositions(origintoken.data, targettoken.data, { usecombatrules });
            const range = getRangeBandFromDistance(distance, true);
            const text = game.i18n.format("ironclaw2e.ui.rangeScrolling", { "range": range });
            targettoken.hud.createScrollingText(text, { anchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM, direction: CONST.TEXT_ANCHOR_POINTS.TOP, duration, jitter: 0.1, fontSize: 28, stroke: 0x000000, strokeThickness: 4 });
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

        getCostForStep(token, area, options = {}) {
            // Lookup the cost for each square occupied by the token
            options.token = token;
            const costs = area.map(space => terrainRuler.getCost(space.x, space.y, options));
            // If the token has flying or the actor ignores bad footing, it ignores all difficult terrain
            const ignored = hasConditionsIronclaw("flying", token) || token?.actor?.data.data.ignoreBadFooting;
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

/**
 * Adds the Ironclaw context menu options to the chat log
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
            name: "ironclaw2e.showAttackSlaying",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const isslaying = message.getFlag("ironclaw2e", "hangingSlaying");
                const successes = message.getFlag("ironclaw2e", "attackSuccessCount");
                // Check whether the attack effect calculation is active, the message has a roll, doesn't already have slaying, has a weapon id and a positive number of successes set and has explicitly been set to have a hanging normal attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && !isslaying && weaponid && successes > 0 && type === "attack";
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
                weapon?.resendNormalAttack?.(message, true);
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
            name: "ironclaw2e.resolveAsSlaying",
            icon: '<i class="fas fa-fist-raised"></i>',
            condition: li => {
                const message = game.messages.get(li.data("messageId"));
                const active = game.settings.get("ironclaw2e", "calculateAttackEffects");
                const type = message.getFlag("ironclaw2e", "hangingAttack");
                const weaponid = message.getFlag("ironclaw2e", "hangingWeapon");
                const isslaying = message.getFlag("ironclaw2e", "hangingSlaying");
                const successes = message.getFlag("ironclaw2e", "resistSuccessCount");
                // Check whether the attack effect calculation is active, the message has a roll, doesn't already have slaying, has a weapon id and a positive number of successes set and has explicitly been set to have a hanging resist attack
                const allowed = active && message.data.type == CONST.CHAT_MESSAGE_TYPES.ROLL && !isslaying && weaponid && successes > 0 && type === "resist";
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
                weapon?.resolveAsNormalAttack?.(message, true);
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
                Ironclaw2EActor.triggerAttackerRoll(attackMessage, "attack", false, type === "HIGH", message, tn, resists);
            }
        });
}
Hooks.on("getChatLogEntryContext", addIronclawChatLogContext);