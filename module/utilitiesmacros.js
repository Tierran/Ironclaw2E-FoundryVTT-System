// Utilities and Macros
// Random non-helper stuff that are substantial, relatively self-contained, and I couldn't really think of another place to dump into
import { findActorToken, getDistanceBetweenPositions, getMacroSpeaker, getSpeakerActor, splitStatsAndBonus } from "./helpers.js";
import { Ironclaw2EActor } from "./actor/actor.js";
import { getRangeBandFromDistance } from "./systeminfo.js";

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
            } else {
                buttons.find('.attack-buttons').remove();
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
    const defenseActor = getSpeakerActor();

    if (!defenseActor) {
        ui.notifications.warn("ironclaw2e.ui.actorNotFoundForMacro", { localize: true });
        return null;
    }

    const messageId = message.id;
    const messageFlags = message?.data?.flags?.ironclaw2e;
    const splitStats = splitStatsAndBonus(messageFlags.requestDicePool);

    defenseActor.popupSelectRolled({
        "tnyes": messageFlags.requestTNYes, "tnnum": messageFlags.requestTNNum, "prechecked": splitStats[0],
        "extradice": splitStats[1], "otherlabel": game.i18n.format("ironclaw2e.chatInfo.requestRoll.rollLabel", { "user": messageFlags.requestSpeaker })
    });
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
        // Double-check that everything that should exist does
        if (targettoken.hud && targettoken.data && origintoken.data) {
            const distance = getDistanceBetweenPositions(origintoken.data, targettoken.data);
            const range = getRangeBandFromDistance(distance, true);
            const text = game.i18n.format("ironclaw2e.ui.rangeScrolling", { "range": range });
            targettoken.hud.createScrollingText(text, { anchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM, direction: CONST.TEXT_ANCHOR_POINTS.TOP, duration: 3000, jitter: 0.1, fontSize: 28, stroke: 0x000000, strokeThickness: 4 });
        }
    }
}