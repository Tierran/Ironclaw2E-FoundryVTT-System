import { findTotalDice } from "./helpers.js";
import { getMacroSpeaker } from "./helpers.js";
import { CommonSystemInfo } from "./helpers.js";

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
 */
export async function rollTargetNumber(tni, d12, d10, d8, d6, d4, label = "", rollingactor = null, sendinchat = true) {
    let rollstring = formRoll(d12, d10, d8, d6, d4);
    if (rollstring.length == 0)
        return null;

    let roll = await new Roll("{" + rollstring + "}cs>" + tni).evaluate({ async: true });

    const successes = roll.total;
    let highest = 0;
    let ties = 0;
    roll.dice.forEach(x => {
        if (x.total == tni) ties++;
        if (x.total > highest) highest = x.total;
    });

    const flavorstring = flavorStringTN(successes, ties, highest == 1, label);

    /** @type TNData */
    let tnData = { "successes": successes, "ties": ties };

    let msg = await roll.toMessage({
        speaker: getMacroSpeaker(rollingactor),
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label }
    }, { create: sendinchat });

    return { "roll": roll, "highest": highest, "tnData": tnData, "message": msg, "isSent": sendinchat };
};

/**
 * Copies the results of an older roll into a new one while allowing a change in the evaluation method
 * @param {number} tni Target number
 * @param {Object} message Message containing the roll to copy
 * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
 * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
 */
export async function copyToRollTN(tni, message, sendinchat = true) {
    if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
        console.log("Somehow, a message that isn't a roll got into 'copyToRollTN'.");
        console.log(message);
        return;
    }
    let rollstring = copyDicePoolResult(message.roll);
    if (rollstring.length == 0)
        return;
    let label = message.getFlag("ironclaw2e", "label");
    if (typeof label != "string")
        return;

    let roll = await new Roll("{" + rollstring + "}cs>" + tni).evaluate({ async: true });

    const successes = roll.total;
    let highest = 0;
    let ties = 0;
    roll.terms[0].results.forEach(x => {
        if (x.result == tni) ties++;
        if (x.total > highest) highest = x.total;
    });

    const flavorstring = flavorStringTN(successes, ties, highest == 1, "Copy TN: " + label);

    /** @type TNData */
    let tnData = { "successes": successes, "ties": ties };

    let msg = await roll.toMessage({
        speaker: message.data.speaker,
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label }
    }, { create: sendinchat });

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
 */
export async function rollHighest(d12, d10, d8, d6, d4, label = "", rollingactor = null, sendinchat = true) {
    let rollstring = formRoll(d12, d10, d8, d6, d4);
    if (rollstring.length == 0)
        return null;

    let roll = await new Roll("{" + rollstring + "}kh1").evaluate({ async: true });
    const flavorstring = flavorStringHighest(roll.total, label);

    let msg = await roll.toMessage({
        speaker: getMacroSpeaker(rollingactor),
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label }
    }, { create: sendinchat });

    return { "roll": roll, "highest": roll.total, "tnData": null, "message": msg, "isSent": sendinchat };
};

/**
 * Copies the results of an older roll into a new one while allowing a change in the evaluation method
 * @param {number} tni Target number
 * @param {Object} message Message containing the roll to copy
 * @param {boolean} sendinchat Optional value, set to false for the dice roller to not send the roll message into chat, just create the data for it
 * @returns {Promise<DiceReturn>} Promise of the roll and the message object or data (depending on sendinchat, true | false) in an object
 */
export async function copyToRollHighest(message, sendinchat = true) {
    if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
        console.log("Somehow, a message that isn't a roll got into 'copyToRollHighest'.");
        console.log(message);
        return;
    }
    let rollstring = copyDicePoolResult(message.roll);
    if (rollstring.length == 0)
        return;
    let label = message.getFlag("ironclaw2e", "label");
    if (typeof label != "string")
        return;

    let roll = await new Roll("{" + rollstring + "}kh1").evaluate({ async: true });
    const flavorstring = flavorStringHighest(roll.total, "Copy High: " + label);

    let msg = await roll.toMessage({
        speaker: message.data.speaker,
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label }
    }, { create: sendinchat });

    return { "roll": roll, "highest": roll.total, "tnData": null, "message": msg, "isSent": sendinchat };
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
 * @param {string} rolltitle The title shown as the dialog's purpose
 * @param {Actor} rollingactor The actor for which the roll is for
 */
export async function rollTargetNumberDialog(tn = 3, d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: (rolltitle ? rolltitle : "Target Number Roll") + " for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>Target Number of Roll:</label>
	   <input id="tn" name="tn" value="${tn.toString()}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label>D12 dice to Roll:</label>
	   <input id="d12s" name="d12s" value="${d12s != 0 ? d12s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D10 dice to Roll:</label>
	   <input id="d10s" name="d10s" value="${d10s != 0 ? d10s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D8 dice to Roll:</label>
	   <input id="d8s" name="d8s" value="${d8s != 0 ? d8s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D6 dice to Roll:</label>
	   <input id="d6s" name="d6s" value="${d6s != 0 ? d6s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D4 dice to Roll:</label>
	   <input id="d4s" name="d4s" value="${d4s != 0 ? d4s.toString() : ""}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
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
                    resolve(rollTargetNumber(TN, D12S, D10S, D8S, D6S, D4S, label, rollingactor));
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
 * @param {string} rolltitle The title shown as the dialog's purpose
 * @param {Actor} rollingactor The actor for which the roll is for
 */
export async function rollHighestDialog(d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: (rolltitle ? rolltitle : "Highest Roll") + " for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>D12 dice to Roll:</label>
	   <input id="d12s" name="d12s" value="${d12s != 0 ? d12s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D10 dice to Roll:</label>
	   <input id="d10s" name="d10s" value="${d10s != 0 ? d10s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D8 dice to Roll:</label>
	   <input id="d8s" name="d8s" value="${d8s != 0 ? d8s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D6 dice to Roll:</label>
	   <input id="d6s" name="d6s" value="${d6s != 0 ? d6s.toString() : ""}" onfocus="this.select();"></input>
      </div>
	  <div class="form-group">
       <label>D4 dice to Roll:</label>
	   <input id="d4s" name="d4s" value="${d4s != 0 ? d4s.toString() : ""}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
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
                    resolve(rollHighest(D12S, D10S, D8S, D6S, D4S, label, rollingactor));
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
 * @param {string} rolltitle The title shown as the dialog's purpose
 * @param {Actor} rollingactor The actor for which the roll is for
 */
export async function rollTargetNumberOneLine(tnnum = 3, readydice = "", label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: (rolltitle ? rolltitle : "Target Number Roll") + " for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>Target Number of Roll:</label>
	   <input id="tn" name="tn" value="${tnnum}" onfocus="this.select();"></input>
      </div>
      <div class="form-group">
       <label>Dice to roll:</label>
      </div>
	  <div class="form-group">
	   <input id="dices" name="dices" value="${readydice}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
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
                    resolve(rollTargetNumber(TN, DICE[0], DICE[1], DICE[2], DICE[3], DICE[4], label, rollingactor));
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
 * @param {string} rolltitle The title shown as the dialog's purpose
 * @param {Actor} rollingactor The actor for which the roll is for
 */
export async function rollHighestOneLine(readydice = "", label = "", rolltitle = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: (rolltitle ? rolltitle : "Highest Roll") + " for " + speaker.alias,
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>Dice to roll:</label>
      </div>
	  <div class="form-group">
	   <input id="dices" name="dices" value="${readydice}" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Roll!",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("dices").focus(); },
            close: html => {
                if (confirmed) {
                    let DICES = html.find('[name=dices]')[0].value;
                    let DICE = findTotalDice(DICES);
                    resolve(rollHighest(DICE[0], DICE[1], DICE[2], DICE[3], DICE[4], label, rollingactor));
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
 * @param {string} rolltitle The title shown as the dialog's purpose
 */
export async function copyToRollTNDialog(message, rolltitle = "") {
    let confirmed = false;
    let resolvedroll = new Promise((resolve) => {
        let dlog = new Dialog({
            title: (rolltitle ? rolltitle : "Change Roll to TN"),
            content: `
     <form class="ironclaw2e">
      <div class="form-group">
       <label>Target Number:</label>
      </div>
	  <div class="form-group">
	   <input id="tn" name="tn" onfocus="this.select();"></input>
      </div>
     </form>
     `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Copy",
                    callback: () => confirmed = true
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => confirmed = false
                }
            },
            default: "one",
            render: html => { document.getElementById("tn").focus(); },
            close: html => {
                if (confirmed) {
                    let DICES = html.find('[name=tn]')[0].value;
                    let TN = 0; if (DICES.length > 0) TN = parseInt(DICES);
                    resolve(copyToRollTN(TN, message));
                } else {
                    resolve(null);
                }
            }
        });
        dlog.render(true);
    });
    return await resolvedroll;
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
 */
export function formRoll(d12, d10, d8, d6, d4) {
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
 * @param {boolean} botched Whether the roll was botched
 * @param {string} label Label to put in front of the dice results
 * @returns {string} The formed flavor string
 */
function flavorStringTN(successes, ties, botched, label) {
    if (successes > 0) {
        return (label.length > 0 ? "<p>" + label + "</p>" : "") + `<p style="font-size:20px;color:${CommonSystemInfo.resultColors.success}">Success, with ${successes} successes.</p>`;
    }
    else {
        if (botched) {
            return (label.length > 0 ? "<p>" + label + "</p>" : "") + `<p style="font-size:20px;color:${CommonSystemInfo.resultColors.botch}">Botch! All ones!</p>`;
        }
        else if (ties > 0) {
            return (label.length > 0 ? "<p>" + label + "</p>" : "") + `<p style="font-size:20px;color:${CommonSystemInfo.resultColors.tie}">Tie, with ${ties} tied dice.</p>`;
        }
        else {
            return (label.length > 0 ? "<p>" + label + "</p>" : "") + `<p style="font-size:20px;color:${CommonSystemInfo.resultColors.failure}">Failure. TN not exceeded or met.</p>`;
        }
    }
}

/**
 * Helper function for the highest dice rollers to form the chat message flavor text properly
 * @param {number} highest The highest die result for the roll
 * @param {string} label Label to put in front of the dice results
 * @returns {string} The formed flavor string
 */
function flavorStringHighest(highest, label) {
    return (label.length > 0 ? "<p>" + label + "</p>" : "") + "<p style=\"font-size:20px;color:" + (highest > 1 ? CommonSystemInfo.resultColors.normal : CommonSystemInfo.resultColors.botch) + "\">Highest die was " + highest + "</p>";
}

/**
 * Helper function for the dice roller copy functions to turn the dice results of the copied roll into numbers
 * @param {Roll} roll The roll to be copied
 * @returns {string} A new formula to use for the new copy roll
 */
function copyDicePoolResult(roll) {
    let formula = "";

    if (roll.dice.length > 0) {
        roll.dice.forEach(x => {
            formula += x.total.toString() + ",";
        });
        if (formula.length > 0) {
            formula = formula.slice(0, -1);
        }
    }
    else if (roll.terms.length > 0) {
        roll.terms[0].results.forEach(x => {
            formula += x.result.toString() + ",";
        });
        if (formula.length > 0) {
            formula = formula.slice(0, -1);
        }
    }

    return formula;
}