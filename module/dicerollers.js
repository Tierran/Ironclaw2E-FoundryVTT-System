import { findTotalDice } from "./helpers.js";
import { getMacroSpeaker } from "./helpers.js";

import { CommonSystemInfo } from "./systeminfo.js";

/**
 * The unified dice roller system class for the Cardinal dice pool system.
 * This class holds a lot of static functions that help roll the dice in such a way as to be easily readable and useful for the Cardinal system.
 */
export class CardinalDiceRoller {

    /**
     * @typedef {{
     *   roll: Roll,
     *   highest: number,
     *   tnData: TNData|null,
     *   message: Object,
     *   isSent: boolean
     * }} DiceReturn
     */

    /**
     * @typedef {{
     *   successes: number,
     *   ties: number
     * }} TNData
     */


    /* -------------------------------------------- */
    /*  Dice Rolling Functions Proper               */
    /* -------------------------------------------- */

    /**
     * A common dice roller function to roll a set of dice against a target number
     * @param {number} tni Target number
     * @param {number} d12 d12's to roll
     * @param {number} d10 d10's to roll
     * @param {number} d8 d8's to roll
     * @param {number} d6 d6's to roll
     * @param {number} d4 d4's to roll
     * @param {string} label Optional value to display some text before the result text
     * @param {Actor} rollingactor Optional value to display the roll as from a specific actor
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     * @protected
     */
    static async rollTargetNumber(tni, d12, d10, d8, d6, d4, label = "", rollingactor = null, sendinchat = true) {
        let rollstring = CardinalDiceRoller.formRoll(d12, d10, d8, d6, d4);
        if (rollstring.length == 0)
            return null;

        let roll = await new Roll("{" + rollstring + "}cs>" + tni).evaluate({ async: true });

        const successes = roll.total;
        let highest = 0;
        let ties = 0;
        let hasOne = false;
        roll.terms[0].results.forEach(x => {
            if (x.result == tni) ties++;
            if (x.result > highest) highest = x.result;
            if (x.result === 1) hasOne = true;
        });

        const flavorstring = CardinalDiceRoller.flavorStringTN(successes, ties, highest, label);

        /** @type TNData */
        let tnData = { "successes": successes, "ties": ties };

        let msg = await roll.toMessage({
            speaker: getMacroSpeaker(rollingactor),
            flavor: flavorstring,
            flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label, "ironclaw2e.originalRoll": true, "ironclaw2e.hasOne": hasOne }
        }, { create: sendinchat });

        return { "roll": roll, "highest": highest, "tnData": tnData, "message": msg, "isSent": sendinchat };
    };

    /**
     * Overload of sorts for the "rollTargetNumber" dice roller function, taking in a dice array instead of raw dice
     * @param {number} tni Target number
     * @param {number[]} dicearray The dice array to roll, five numbers corresponding to dice the amount of dice to roll, [0] = d12, [1] = d10 ... [4] = d4
     * @param {string} label Optional value to display some text before the result text
     * @param {Actor} rollingactor Optional value to display the roll as from a specific actor
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     */
    static async rollTargetNumberArray(tni, dicearray, label = "", rollingactor = null, sendinchat = true) {
        return await CardinalDiceRoller.rollTargetNumber(tni, dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4], label, rollingactor, sendinchat);
    }

    /**
     * Copies the results of an older roll into a new one while allowing a change in the evaluation method
     * @param {number} tni Target number
     * @param {Object} message Message containing the roll to copy
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     */
    static async copyToRollTN(tni, message, sendinchat = true, rerollone = false) {
        if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
            console.warn("Somehow, a message that isn't a roll got into 'copyToRollTN'.");
            console.warn(message);
            return;
        }
        let rollstring = rerollone ? CardinalDiceRoller.copyRerollHighestOne(message.roll) : CardinalDiceRoller.copyDicePoolResult(message.roll);
        if (rollstring.length == 0)
            return;
        let label = message.getFlag("ironclaw2e", "label");
        if (typeof label != "string")
            return;

        let roll = await new Roll("{" + rollstring + "}cs>" + tni).evaluate({ async: true });

        const successes = roll.total;
        let highest = 0;
        let ties = 0;
        let hasOne = false;
        roll.terms[0].results.forEach(x => {
            if (x.result == tni) ties++;
            if (x.result > highest) highest = x.result;
            if (x.result === 1) hasOne = true;
        });

        const flavorstring = CardinalDiceRoller.flavorStringTN(successes, ties, highest,
            `${(rerollone ? game.i18n.localize("ironclaw2e.chatInfo.reroll") : game.i18n.localize("ironclaw2e.chatInfo.copy"))} ${game.i18n.localize("ironclaw2e.chatInfo.tn")}: ` + label);

        /** @type TNData */
        let tnData = { "successes": successes, "ties": ties };

        let msg = await roll.toMessage({
            speaker: message.data.speaker,
            flavor: flavorstring,
            flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label, "ironclaw2e.originalRoll": false, "ironclaw2e.hasOne": hasOne }
        }, { create: sendinchat });

        await CardinalDiceRoller.copyIronclawRollFlags(message, msg, tnData);

        return { "roll": roll, "highest": highest, "tnData": tnData, "message": msg, "isSent": sendinchat };
    }

    /**
     * A common dice roller function to roll a set of dice and take the highest one
     * @param {number} d12 d12's to roll
     * @param {number} d10 d10's to roll
     * @param {number} d8 d8's to roll
     * @param {number} d6 d6's to roll
     * @param {number} d4 d4's to roll
     * @param {string} label Optional value to display some text before the result text
     * @param {Actor} rollingactor Optional value to display the roll as from a specific actor
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     * @protected
     */
    static async rollHighest(d12, d10, d8, d6, d4, label = "", rollingactor = null, sendinchat = true) {
        let rollstring = CardinalDiceRoller.formRoll(d12, d10, d8, d6, d4);
        if (rollstring.length == 0)
            return null;

        let roll = await new Roll("{" + rollstring + "}kh1").evaluate({ async: true });
        const flavorstring = CardinalDiceRoller.flavorStringHighest(roll.total, label);

        let hasOne = roll.terms[0].results.some(x => x.result === 1); // Find if one of the dice rolled a "1"

        let msg = await roll.toMessage({
            speaker: getMacroSpeaker(rollingactor),
            flavor: flavorstring,
            flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label, "ironclaw2e.originalRoll": true, "ironclaw2e.hasOne": hasOne }
        }, { create: sendinchat });

        return { "roll": roll, "highest": roll.total, "tnData": null, "message": msg, "isSent": sendinchat };
    };

    /**
     * Overload of sorts for the "rollHighest" dice roller function, taking in a dice array instead of raw dice
     * @param {number[]} dicearray The dice array to roll, five numbers corresponding to dice the amount of dice to roll, [0] = d12, [1] = d10 ... [4] = d4
     * @param {string} label Optional value to display some text before the result text
     * @param {Actor} rollingactor Optional value to display the roll as from a specific actor
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     */
    static async rollHighestArray(dicearray, label = "", rollingactor = null, sendinchat = true) {
        return await CardinalDiceRoller.rollHighest(dicearray[0], dicearray[1], dicearray[2], dicearray[3], dicearray[4], label, rollingactor, sendinchat);
    }

    /**
     * Copies the results of an older roll into a new one while allowing a change in the evaluation method
     * @param {Object} message Message containing the roll to copy
     * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
     * @param {boolean} rerollone Set to true to make the copy function also reroll a single one-showing die, preferring the largest die type
     * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
     */
    static async copyToRollHighest(message, sendinchat = true, rerollone = false) {
        if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
            console.warn("Somehow, a message that isn't a roll got into 'copyToRollHighest'.");
            console.warn(message);
            return;
        }
        let rollstring = rerollone ? CardinalDiceRoller.copyRerollHighestOne(message.roll) : CardinalDiceRoller.copyDicePoolResult(message.roll);
        if (rollstring.length == 0)
            return;
        let label = message.getFlag("ironclaw2e", "label");
        if (typeof label != "string")
            return;

        let roll = await new Roll("{" + rollstring + "}kh1").evaluate({ async: true });
        const flavorstring = CardinalDiceRoller.flavorStringHighest(roll.total,
            `${(rerollone ? game.i18n.localize("ironclaw2e.chatInfo.reroll") : game.i18n.localize("ironclaw2e.chatInfo.copy"))} ${game.i18n.localize("ironclaw2e.chatInfo.high")}: ` + label);

        let hasOne = roll.terms[0].results.some(x => x.result === 1); // Find if one of the dice "rolled" a "1"

        let msg = await roll.toMessage({
            speaker: message.data.speaker,
            flavor: flavorstring,
            flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label, "ironclaw2e.originalRoll": false, "ironclaw2e.hasOne": hasOne }
        }, { create: sendinchat });

        await CardinalDiceRoller.copyIronclawRollFlags(message, msg);

        return { "roll": roll, "highest": roll.total, "tnData": null, "message": msg, "isSent": sendinchat };
    }

    /* -------------------------------------------- */
    /*  Helpers                             */
    /* -------------------------------------------- */

    /**
     * Helper function for the dice rollers to form the roll command properly
     * @param {number} d12 d12's to roll
     * @param {number} d10 d10's to roll
     * @param {number} d8 d8's to roll
     * @param {number} d6 d6's to roll
     * @param {number} d4 d4's to roll
     * @returns {string} Properly set-up string to give to a Roll
     * @private
     */
    static formRoll(d12, d10, d8, d6, d4) {
        let rollstring = "";
        for (var i = 0; i < d12; i++) {
            rollstring += "1d12,";
        }
        for (var i = 0; i < d10; i++) {
            rollstring += "1d10,";
        }
        for (var i = 0; i < d8; i++) {
            rollstring += "1d8,";
        }
        for (var i = 0; i < d6; i++) {
            rollstring += "1d6,";
        }
        for (var i = 0; i < d4; i++) {
            rollstring += "1d4,";
        }
        if (rollstring.length > 0) {
            rollstring = rollstring.slice(0, -1);
        }
        return rollstring;
    };

    /**
     * Helper function for the target number dice rollers to form the chat message flavor text properly
     * @param {number} successes The number of successes for the roll
     * @param {number} ties The number of ties for the roll
     * @param {number} highest The highest die result for the roll
     * @param {string} label Label to put in front of the dice results
     * @returns {string} The formed flavor string
     * @private
     */
    static flavorStringTN(successes, ties, highest, label) {
        const botched = highest == 1; // Whether the roll was botched based on whether the highest-showing die is 1
        if (successes > 0) {
            return (label.length > 0 ? "<p>" + label + "</p>" : "") +
                `<p style="font-size:${CommonSystemInfo.resultFontSize};margin-bottom:${CommonSystemInfo.resultTNMarginSize};color:${CommonSystemInfo.resultColors.success}">${game.i18n.format("ironclaw2e.chat.success", { "successes": successes })}</p>` +
                CardinalDiceRoller.flavorStringHighest(highest, "", true);
        }
        else {
            if (botched) {
                return (label.length > 0 ? "<p>" + label + "</p>" : "") +
                    `<p style="font-size:${CommonSystemInfo.resultFontSize};color:${CommonSystemInfo.resultColors.botch}">${game.i18n.localize("ironclaw2e.chat.botch")}</p>`;
            }
            else if (ties > 0) {
                return (label.length > 0 ? "<p>" + label + "</p>" : "") +
                    `<p style="font-size:${CommonSystemInfo.resultFontSize};margin-bottom:${CommonSystemInfo.resultTNMarginSize};color:${CommonSystemInfo.resultColors.tie}">${game.i18n.format("ironclaw2e.chat.tie", { "ties": ties })}</p>` +
                    CardinalDiceRoller.flavorStringHighest(highest, "", true);
            }
            else {
                return (label.length > 0 ? "<p>" + label + "</p>" : "") +
                    `<p style="font-size:${CommonSystemInfo.resultFontSize};margin-bottom:${CommonSystemInfo.resultTNMarginSize};color:${CommonSystemInfo.resultColors.failure}">${game.i18n.localize("ironclaw2e.chat.failure")}</p>` +
                    CardinalDiceRoller.flavorStringHighest(highest, "", true);
            }
        }
    }

    /**
     * Helper function for the highest dice rollers to form the chat message flavor text properly
     * @param {number} highest The highest die result for the roll
     * @param {string} label Label to put in front of the dice results
     * @param {boolean} small Whether to ask for the small version of the string
     * @returns {string} The formed flavor string
     * @private
     */
    static flavorStringHighest(highest, label, small = false) {
        return (label.length > 0 ? "<p>" + label + "</p>" : "") + (small ? `<p style="font-size:${CommonSystemInfo.resultSmallFontSize};margin-top:0px;` : `<p style="font-size:${CommonSystemInfo.resultFontSize};`) + `
    color:${(highest > 1 ? CommonSystemInfo.resultColors.normal : CommonSystemInfo.resultColors.botch)}">${game.i18n.format("ironclaw2e.chat.highest", { "highest": highest })}</p>`;
    }

    /**
     * Helper function for the dice roller copy functions to turn the dice results of the copied roll into numbers
     * @param {Roll} roll The roll to be copied
     * @returns {string} A new formula to use for the new copy roll
     * @private
     */
    static copyDicePoolResult(roll) {
        let formula = "";

        if (roll.terms.length > 0) {
            roll.terms[0].results.forEach(x => {
                formula += x.result.toString() + ",";
            });
            if (formula.length > 0) {
                formula = formula.slice(0, -1);
            }
        }

        return formula;
    }

    /**
     * Helper function for the dice roller copy functions to reroll one "1" and copy the rest of the dice results as numbers
     * @param {Roll} roll
     * @returns {string} A new formula to use for the new copy roll, with the highest "1" as a die to be rolled
     * @private
     */
    static copyRerollHighestOne(roll) {
        let onefound = false, formula = "";

        if (roll.terms.length > 0) {
            roll.terms[0].results.forEach((x, i) => {
                if (!onefound && x.result == 1) {
                    onefound = true;
                    formula += roll.terms[0].terms[i] + ",";
                } else {
                    formula += x.result.toString() + ",";
                }
            });
            if (formula.length > 0) {
                formula = formula.slice(0, -1);
            }
        }

        return formula;
    }

    /**
     * Helper function for the dice roller to copy roll flags to the copied rolls
     * @param {Message} origin The message to copy the flags from
     * @param {Message} target The message to copy the flags to
     * @param {TNData} tndata The TN Data to use to replace the recorded successes and success state for the relevant roll, if empty those will not be copied
     * @private
     */
    static async copyIronclawRollFlags(origin, target, tndata = null) {
        if (!origin || !target) {
            return;
        }

        const hangingType = origin.getFlag("ironclaw2e", "hangingAttack");
        const defenseAttack = origin.getFlag("ironclaw2e", "defenseForAttack");
        let updatedata = {
            "flags": {}
        };

        if (hangingType) {
            updatedata.flags = mergeObject(updatedata.flags, {
                "ironclaw2e.hangingAttack": hangingType, "ironclaw2e.hangingWeapon": origin.getFlag("ironclaw2e", "hangingWeapon"), "ironclaw2e.hangingActor": origin.getFlag("ironclaw2e", "hangingActor"),
                "ironclaw2e.hangingToken": origin.getFlag("ironclaw2e", "hangingToken"), "ironclaw2e.hangingScene": origin.getFlag("ironclaw2e", "hangingScene")
            });

            if (tndata) {
                const successes = (isNaN(tndata.successes) ? 0 : tndata.successes);
                const ties = (isNaN(tndata.ties) ? 0 : tndata.ties);
                const success = successes > 0;
                const usedsuccesses = (success ? successes : ties);

                if (hangingType === "attack") {
                    updatedata.flags = mergeObject(updatedata.flags, { "ironclaw2e.attackSuccess": success, "ironclaw2e.attackSuccessCount": usedsuccesses });
                } else if (hangingType === "resist") {
                    updatedata.flags = mergeObject(updatedata.flags, { "ironclaw2e.resistSuccess": success, "ironclaw2e.resistSuccessCount": usedsuccesses });
                }
            }
        }
        if (defenseAttack) {
            updatedata.flags = mergeObject(updatedata.flags, { "ironclaw2e.defenseForAttack": defenseAttack});
        }

        await target.update(updatedata);
    }
}


/* -------------------------------------------- */
/*  Dialog Macros                               */
/* -------------------------------------------- */

/**
 * Dialog macro function for a target number roll that displays a separate input field for every dice type
 * No inputs need to actually be given, but default values can be inputted
 * @param {number} tn Target number for the roll
 * @param {number} d12s Number of d12 dice
 * @param {number} d10s Number of d10 dice
 * @param {number} d8s Number of d8 dice
 * @param {number} d6s Number of d6 dice
 * @param {number} d4s Number of d4 dice
 * @param {string} label The label given to the roll function to display in the chat message
 * @param {string} rolltitle The title shown as the dialog's purpose, translated if one is found
 * @param {Actor} rollingactor The actor for which the roll is for
 * @returns {Promise<DiceReturn> | Promise<null>} Promise of the roll data in an object, or null if cancelled
 */
export async function rollTargetNumberDialog(tn = 3, d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    const usetranslation = !rolltitle || game.i18n.has(rolltitle); // Use translations if either rolltitle does not exist, or it exists and has a translation equivalent
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usetranslation ? game.i18n.format(rolltitle || "ironclaw2e.dialog.macroDefault.titleTN", { "name": speaker.alias }) : speaker.alias + ": " + rolltitle,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.targetNumber")}:</label>
	   <input type="text" id="tn" name="tn" value="${tn.toString()}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d12Dice")}:</label>
	   <input type="text" id="d12s" name="d12s" value="${d12s != 0 ? d12s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d10Dice")}:</label>
	   <input type="text" id="d10s" name="d10s" value="${d10s != 0 ? d10s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d8Dice")}:</label>
	   <input type="text" id="d8s" name="d8s" value="${d8s != 0 ? d8s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d6Dice")}:</label>
	   <input type="text" id="d6s" name="d6s" value="${d6s != 0 ? d6s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d4Dice")}:</label>
	   <input type="text" id="d4s" name="d4s" value="${d4s != 0 ? d4s.toString() : ""}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.roll"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("tn").focus(); },
            close: html => {
                if (confirmed) {
                    let TNSS = html.find('[name=tn]')[0].value;
                    let TN = 0; if (TNSS.length > 0) TN = parseInt(TNSS);
                    let D12SS = html.find('[name=d12s]')[0].value;
                    let D12S = 0; if (D12SS.length > 0) D12S = parseInt(D12SS);
                    let D10SS = html.find('[name=d10s]')[0].value;
                    let D10S = 0; if (D10SS.length > 0) D10S = parseInt(D10SS);
                    let D8SS = html.find('[name=d8s]')[0].value;
                    let D8S = 0; if (D8SS.length > 0) D8S = parseInt(D8SS);
                    let D6SS = html.find('[name=d6s]')[0].value;
                    let D6S = 0; if (D6SS.length > 0) D6S = parseInt(D6SS);
                    let D4SS = html.find('[name=d4s]')[0].value;
                    let D4S = 0; if (D4SS.length > 0) D4S = parseInt(D4SS);
                    resolve(CardinalDiceRoller.rollTargetNumber(TN, D12S, D10S, D8S, D6S, D4S, label, rollingactor));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
}

/**
 * Dialog macro function for a highest roll that displays a separate input field for every dice type
 * No inputs need to actually be given, but default values can be inputted
 * @param {number} d12s Number of d12 dice
 * @param {number} d10s Number of d10 dice
 * @param {number} d8s Number of d8 dice
 * @param {number} d6s Number of d6 dice
 * @param {number} d4s Number of d4 dice
 * @param {string} label The label given to the roll function to display in the chat message
 * @param {string} rolltitle The title shown as the dialog's purpose, translated if one is found
 * @param {Actor} rollingactor The actor for which the roll is for
 * @returns {Promise<DiceReturn> | Promise<null>} Promise of the roll data in an object, or null if cancelled
 */
export async function rollHighestDialog(d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    const usetranslation = !rolltitle || game.i18n.has(rolltitle); // Use translations if either rolltitle does not exist, or it exists and has a translation equivalent
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usetranslation ? game.i18n.format(rolltitle || "ironclaw2e.dialog.macroDefault.titleHighest", { "name": speaker.alias }) : speaker.alias + ": " + rolltitle,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d12Dice")}:</label>
	   <input type="text" id="d12s" name="d12s" value="${d12s != 0 ? d12s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d10Dice")}:</label>
	   <input type="text" id="d10s" name="d10s" value="${d10s != 0 ? d10s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d8Dice")}:</label>
	   <input type="text" id="d8s" name="d8s" value="${d8s != 0 ? d8s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d6Dice")}:</label>
	   <input type="text" id="d6s" name="d6s" value="${d6s != 0 ? d6s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.d4Dice")}:</label>
	   <input type="text" id="d4s" name="d4s" value="${d4s != 0 ? d4s.toString() : ""}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.roll"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("d12s").focus(); },
            close: html => {
                if (confirmed) {
                    let D12SS = html.find('[name=d12s]')[0].value;
                    let D12S = 0; if (D12SS.length > 0) D12S = parseInt(D12SS);
                    let D10SS = html.find('[name=d10s]')[0].value;
                    let D10S = 0; if (D10SS.length > 0) D10S = parseInt(D10SS);
                    let D8SS = html.find('[name=d8s]')[0].value;
                    let D8S = 0; if (D8SS.length > 0) D8S = parseInt(D8SS);
                    let D6SS = html.find('[name=d6s]')[0].value;
                    let D6S = 0; if (D6SS.length > 0) D6S = parseInt(D6SS);
                    let D4SS = html.find('[name=d4s]')[0].value;
                    let D4S = 0; if (D4SS.length > 0) D4S = parseInt(D4SS);
                    resolve(CardinalDiceRoller.rollHighest(D12S, D10S, D8S, D6S, D4S, label, rollingactor));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
}

/**
 * Dialog macro function for a target number roll that displays a single dice input field for standard dice notation that will then be parsed
 * No inputs need to actually be given, but default values can be inputted
 * @param {number} tnnum The target number for the roll
 * @param {string} readydice The dice for the roll, in standard dice notation to be parsed
 * @param {string} label The label given to the roll function to display in the chat message
 * @param {string} rolltitle The title shown as the dialog's purpose, translated if one is found
 * @param {Actor} rollingactor The actor for which the roll is for
 * @returns {Promise<DiceReturn> | Promise<null>} Promise of the roll data in an object, or null if cancelled
 */
export async function rollTargetNumberOneLine(tnnum = 3, readydice = "", label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    const usetranslation = !rolltitle || game.i18n.has(rolltitle); // Use translations if either rolltitle does not exist, or it exists and has a translation equivalent
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usetranslation ? game.i18n.format(rolltitle || "ironclaw2e.dialog.macroDefault.titleTN", { "name": speaker.alias }) : speaker.alias + ": " + rolltitle,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.targetNumber")}:</label>
	   <input type="text" id="tn" name="tn" value="${tnnum}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.oneLineDice")}:</label>
      </div>
	  <div class="form-group">
	   <input type="text" id="dices" name="dices" value="${readydice}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.roll"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("tn").focus(); },
            close: html => {
                if (confirmed) {
                    let TNSS = html.find('[name=tn]')[0].value;
                    let TN = 0; if (TNSS.length > 0) TN = parseInt(TNSS);
                    let DICES = html.find('[name=dices]')[0].value;
                    let DICE = findTotalDice(DICES);
                    resolve(CardinalDiceRoller.rollTargetNumberArray(TN, DICE, label, rollingactor));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
}

/**
 * Dialog macro function for a target number roll that displays a single dice input field for standard dice notation that will then be parsed
 * No inputs need to actually be given, but default values can be inputted
 * @param {string} readydice The dice for the roll, in standard dice notation to be parsed
 * @param {string} label The label given to the roll function to display in the chat message
 * @param {string} rolltitle The title shown as the dialog's purpose, translated if one is found
 * @param {Actor} rollingactor The actor for which the roll is for
 * @returns {Promise<DiceReturn> | Promise<null>} Promise of the roll data in an object, or null if cancelled
 */
export async function rollHighestOneLine(readydice = "", label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    const usetranslation = !rolltitle || game.i18n.has(rolltitle); // Use translations if either rolltitle does not exist, or it exists and has a translation equivalent
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usetranslation ? game.i18n.format(rolltitle || "ironclaw2e.dialog.macroDefault.titleHighest", { "name": speaker.alias }) : speaker.alias + ": " + rolltitle,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.oneLineDice")}:</label>
      </div>
	  <div class="form-group">
	   <input type="text" id="dices" name="dices" value="${readydice}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.roll"),
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
                    let DICES = html.find('[name=dices]')[0].value;
                    let DICE = findTotalDice(DICES);
                    resolve(CardinalDiceRoller.rollHighestArray(DICE, label, rollingactor));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
}

/**
 * Function that takes a message with a roll and asks for a target number to use in copying the results of the roll to a new one
 * @param {ChatMessage} message The chat message to copy the roll from, assuming it has one
 * @param {string} rolltitle The title shown as the dialog's purpose, translated if one is found
 * @returns {Promise<DiceReturn> | Promise<null>} Promise of the roll data in an object, or null if cancelled
 */
export async function copyToRollTNDialog(message, rolltitle = "") {
    let confirmed = false;
    const usetranslation = !rolltitle || game.i18n.has(rolltitle); // Use translations if either rolltitle does not exist, or it exists and has a translation equivalent
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: usetranslation ? game.i18n.format(rolltitle || "ironclaw2e.dialog.macroDefault.titleCopyTN") : rolltitle,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>${game.i18n.localize("ironclaw2e.dialog.macroDefault.targetNumberCopy")}:</label>
      </div>
	  <div class="form-group">
	   <input type="text" id="tn" name="tn" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.copy"),
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("ironclaw2e.dialog.cancel"),
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("tn").focus(); },
            close: html => {
                if (confirmed) {
                    let DICES = html.find('[name=tn]')[0].value;
                    let TN = 0; if (DICES.length > 0) TN = parseInt(DICES);
                    resolve(CardinalDiceRoller.copyToRollTN(TN, message));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
}