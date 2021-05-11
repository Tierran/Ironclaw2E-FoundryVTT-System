import { findTotalDice } from "./helpers.js";
import { getMacroSpeaker } from "./helpers.js";

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
 * @returns {Promise} The roll
 */
export function rollTargetNumber(tni, d12, d10, d8, d6, d4, label = "", rollingactor = null) {
    let rollstring = formRoll(d12, d10, d8, d6, d4);
    if (rollstring.length == 0)
        return null;

    let roll = new Roll("{" + rollstring + "}cs>" + tni).evaluate();
    const flavorstring = flavorStringTN(roll, label);

    roll.toMessage({
        speaker: getMacroSpeaker(rollingactor),
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label }
    });

    return roll;
};

/**
 * Copies the results of an older roll into a new one while allowing a change in the evaluation method
 * @param {number} tni Target number
 * @param {any} message Message containing the roll to copy
 */
export function copyToRollTN(tni, message, sendinchat = true) {
    if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
        console.log("Somehow, a message that isn't a roll got into 'copyToRollTN'.");
        console.log(message);
        return;
    }
    let rollstring = copyDicePoolResult(message.roll.dice);
    if (rollstring.length == 0)
        return;
    let label = message.getFlag("ironclaw2e", "label");
    if (typeof label != "string")
        return;

    let roll = new Roll("{" + rollstring + "}cs>" + tni).evaluate();
    const flavorstring = "Copy-" + flavorStringTN(roll, label);

    roll.toMessage({
        speaker: message.data.speaker,
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "TN", "ironclaw2e.label": label }
    }, { create: sendinchat });

    return roll;
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
 * @returns {Promise} The roll
 */
export function rollHighest(d12, d10, d8, d6, d4, label = "", rollingactor = null) {
    let rollstring = formRoll(d12, d10, d8, d6, d4);
    if (rollstring.length == 0)
        return null;

    let roll = new Roll("{" + rollstring + "}kh1").evaluate();
    const flavorstring = flavorStringHighest(roll, label);

    roll.toMessage({
        speaker: getMacroSpeaker(rollingactor),
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label }
    });

    return roll;
};

export function copyToRollHighest(message, sendinchat = true) {
    if (!(message) || message.data.type != CONST.CHAT_MESSAGE_TYPES.ROLL) {
        console.log("Somehow, a message that isn't a roll got into 'copyToRollHighest'.");
        console.log(message);
        return;
    }
    let rollstring = copyDicePoolResult(message.roll.dice);
    if (rollstring.length == 0)
        return;
    let label = message.getFlag("ironclaw2e", "label");
    if (typeof label != "string")
        return;

    let roll = new Roll("{" + rollstring + "}kh1").evaluate();
    const flavorstring = "Copy-" + flavorStringHighest(roll, label);

    roll.toMessage({
        speaker: message.data.speaker,
        flavor: flavorstring,
        flags: { "ironclaw2e.rollType": "HIGH", "ironclaw2e.label": label }
    }, { create: sendinchat });

    return roll;
}


/* -------------------------------------------- */
/*  Dialog Macros                               */
/* -------------------------------------------- */

export function rollTargetNumberDialog(tn = 3, d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let dlog = new Dialog({
        title: "Target Number Roll for " + speaker.alias,
        content: `
     <form>
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
                let TN = 0; if (TNSS.length != 0) TN = parseInt(TNSS);
                let D12SS = html.find('[name=d12s]')[0].value;
                let D12S = 0; if (D12SS.length != 0) D12S = parseInt(D12SS);
                let D10SS = html.find('[name=d10s]')[0].value;
                let D10S = 0; if (D10SS.length != 0) D10S = parseInt(D10SS);
                let D8SS = html.find('[name=d8s]')[0].value;
                let D8S = 0; if (D8SS.length != 0) D8S = parseInt(D8SS);
                let D6SS = html.find('[name=d6s]')[0].value;
                let D6S = 0; if (D6SS.length != 0) D6S = parseInt(D6SS);
                let D4SS = html.find('[name=d4s]')[0].value;
                let D4S = 0; if (D4SS.length != 0) D4S = parseInt(D4SS);
                rollTargetNumber(TN, D12S, D10S, D8S, D6S, D4S, label, rollingactor);
            }
        }
    });
    dlog.render(true);
}

export function rollHighestDialog(d12s = 0, d10s = 0, d8s = 0, d6s = 0, d4s = 0, label = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let dlog = new Dialog({
        title: "Highest Roll for " + speaker.alias,
        content: `
     <form>
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
                let D12S = 0; if (D12SS.length != 0) D12S = parseInt(D12SS);
                let D10SS = html.find('[name=d10s]')[0].value;
                let D10S = 0; if (D10SS.length != 0) D10S = parseInt(D10SS);
                let D8SS = html.find('[name=d8s]')[0].value;
                let D8S = 0; if (D8SS.length != 0) D8S = parseInt(D8SS);
                let D6SS = html.find('[name=d6s]')[0].value;
                let D6S = 0; if (D6SS.length != 0) D6S = parseInt(D6SS);
                let D4SS = html.find('[name=d4s]')[0].value;
                let D4S = 0; if (D4SS.length != 0) D4S = parseInt(D4SS);
                rollHighest(D12S, D10S, D8S, D6S, D4S, label, rollingactor);
            }
        }
    });
    dlog.render(true);
}

export function rollTargetNumberOneLine(tnnum = 3, readydice = "", label = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let dlog = new Dialog({
        title: "Target Number Roll for " + speaker.alias,
        content: `
     <form>
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
                let TN = 0; if (TNSS.length != 0) TN = parseInt(TNSS);
                let DICES = html.find('[name=dices]')[0].value;
                let DICE = findTotalDice(DICES);
                rollTargetNumber(TN, DICE[0], DICE[1], DICE[2], DICE[3], DICE[4], label, rollingactor);
            }
        }
    });
    dlog.render(true);
}

export function rollHighestOneLine(readydice = "", label = "", rollingactor = null) {
    let confirmed = false;
    let speaker = getMacroSpeaker(rollingactor);
    let dlog = new Dialog({
        title: "Highest Roll for " + speaker.alias,
        content: `
     <form>
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
                rollHighest(DICE[0], DICE[1], DICE[2], DICE[3], DICE[4], label, rollingactor);
            }
        }
    });
    dlog.render(true);
}

export function copyToRollTNDialog(message) {
    let confirmed = false;
    let dlog = new Dialog({
        title: "Change Roll to TN",
        content: `
     <form>
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
                copyToRollTN(TN, message);
            }
        }
    });
    dlog.render(true);
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
function formRoll(d12, d10, d8, d6, d4) {
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
 * @param {Roll} roll The roll object for which to form a flavor string
 * @param {string} label Label to put in front of the dice results
 * @returns {string} The formed flavor string
 */
function flavorStringTN(roll, label) {
    if (roll.result > 0) {
        return (label.length > 0 ? label + "<br>" : "") + "<p style=\"font-size:20px;color:green\">Success, with " + roll.total + " successes.</p>";
    }
    else {
        let alldice = roll.dice;
        let rawtotal = 0;
        let ties = 0;
        alldice.forEach(x => {
            rawtotal += x.total;
            if (x.total == tni) ties++;
        });
        if (rawtotal == d12 + d10 + d8 + d6 + d4) {
            return (label.length > 0 ? label + "<br>" : "") + "<p style=\"font-size:20px;color:red\">Botch! All ones!</p>";
        }
        else if (ties > 0) {
            return (label.length > 0 ? label + "<br>" : "") + "<p style=\"font-size:20px;color:darkgoldenrod\">Tie, with " + ties + " tied dice.</p>";
        }
        else {
            return (label.length > 0 ? label + "<br>" : "") + "<p style=\"font-size:20px;color:black\">Failure. TN not exceeded or met.</p>";
        }
    }
}

/**
 * Helper function for the highest dice rollers to form the chat message flavor text properly
 * @param {Roll} roll The roll object for which to form a flavor string
 * @param {string} label Label to put in front of the dice results
 * @returns {string} The formed flavor string
 */
function flavorStringHighest(roll, label) {
    return (label.length > 0 ? label + "<br>" : "") + "<p style=\"font-size:20px;color:" + (roll.total > 1 ? "black" : "red") + "\">Highest die was " + roll.total + "</p>";
}

/**
 * Helper function for the dice roller copy functions to turn the dice results of the copied roll into numbers
 * @param {DiceTerm[]} dice The dice of the roll to be copied
 * @returns {string} A new formula to use for the new copy roll
 */
function copyDicePoolResult(dice) {
    let formula = "";
    dice.forEach(x => {
        formula += x.total.toString() + ",";
    });
    if (formula.length > 0) {
        formula = formula.slice(0, -1);
    }

    return formula;
}