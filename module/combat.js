import { getDistanceBetweenPositions } from "./helpers.js";

/**
 * Extend the base Combat class to allow for the use of Ironclaw's initiative systems
 * @extends {Combat}
 */
export class Ironclaw2ECombat extends Combat {
    constructor(data, context) {
        super(data, context);
    }

    /**
     * 
     * @param {any} combatant
     * @param {any} formula
     */
    _getInitiativeRoll(combatant, formula) {
        return combatant.actor ? combatant.actor.initiativeRoll(1).roll : Roll.create(formula).evaluate({ async: true });
    }

    /**
     * Determine the relevant group initiative for a combatant according to the initiative type in the settings
     * @param {any} combatant
     * @param {any} settings
     * @returns {number}
     * @private
     */
    static getInitiativeGroup(combatant, settings) {
        if (combatant?.actor && combatant?.token && settings?.initType) {
            let side = -1;
            const initType = parseInt(settings.initType);
            switch (initType) {
                case 0:
                case 1:
                    side = combatant.actor.hasPlayerOwner ? 1 : 0; // If the combatant is a player, side 1, otherwise side 0
                    if (initType === 0) return side == 1 ? 2 : 1;
                    else return side == 0 ? 2 : 1;
                    break;
                case 2:
                case 3:
                    side = (combatant.actor.hasPlayerOwner || combatant.token.data?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ? 1 : 0); // If the combatant is a player or allied, side 1, otherwise side 0
                    if (initType === 2) return side == 1 ? 2 : 1;
                    else return side == 0 ? 2 : 1;
                    break;
                case 4:
                case 5:
                    side = side = (combatant.actor.hasPlayerOwner ? 1 : (combatant.token.data?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ? 2 : 0)); // If the combatant is a player, side 1, otherwise if the combatant is allied, side 2, otherwise side 0
                    if (initType === 4) return side == 1 ? 3 : (side == 2 ? 2 : 1);
                    else return side == side == 0 ? 3 : (side == 1 ? 2 : 1);
                    break;
                default:
                    console.warn("Group initiative defaulted on init type");
                    break;
            }
        }
        return -1;
    }

    /**
     * Determine the TN of the initiative check based on the distance to the nearest combatant
     * @param {Combatant} combatant
     * @param {Combatant[]} allcombatants
     * @param {Object} settings
     * @returns {number}
     * @private
     */
    static getInitiativeTN(combatant, allcombatants, settings) {
        if (settings?.manualTN && settings.manualTN > 0) {
            return settings.manualTN;
        }
        else if (combatant?.actor && combatant?.token && settings?.initType && allcombatants) {
            let otherSide;
            if (settings.initType === 0 || settings.initType === 1) {
                let playerOwnerComparison = combatant.actor.hasPlayerOwner;
                otherSide = allcombatants.filter(x => x?.actor?.hasPlayerOwner !== playerOwnerComparison);
            }
            else {
                let playerOwnerComparison = combatant.actor.hasPlayerOwner || combatant.token.data?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
                otherSide = allcombatants.filter(x => (x?.actor?.hasPlayerOwner || x?.token?.data?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) !== playerOwnerComparison);
            }
            return Ironclaw2ECombat.getDistanceTN(Ironclaw2ECombat.getDistanceToClosestOther(combatant, otherSide));
        }
        else return 6;
    }

    /**
     * Get distance between the combatant and closest of the other combatants
     * @param {Combatant} combatant
     * @param {Combatant[]} othercombatants
     * @returns {number}
     * @private
     */
    static getDistanceToClosestOther(combatant, othercombatants) {
        let distance = Infinity;
        if (combatant?.token) {
            othercombatants.forEach(x => {
                if (x?.token) {
                    const dist = getDistanceBetweenPositions(combatant.token.data, x.token.data);
                    if (distance > dist) distance = dist;
                }
            });
        }
        return distance;
    }

    /**
     * Get the initiative target number for a given distance to the nearest foe
     * @param {number} distance
     * @returns {number}
     * @private
     */
    static getDistanceTN(distance) {
        if (distance <= 4) return 2;
        if (distance <= 12) return 3;
        if (distance <= 36) return 4;
        if (distance <= 100) return 5;
        return 6;
    }

    /** @override */
    _prepareCombatant(c, scene, players, settings = {}) {
        c = super._prepareCombatant(c, scene, players, settings);

        c.resource = c.flags?.ironclaw2e?.initiativeResult; // Set the "resource" to track be the initiative result
        return c;
    }

    /** @override */
    async nextTurn() {
        await this.combatant?.endOfTurnMaintenance();
        await super.nextTurn();
        await this.combatant?.startOfTurnMaintenance();
        return this;
    }

    /** @override */
    async resetAll() {
        const updates = this.combatants.map(c => {
            return {
                _id: c.id,
                initiative: null,
                flags: { "ironclaw2e.initiativeResult": null }
            }
        });
        await this.updateEmbeddedDocuments("Combatant", updates);
        return this.update({ turn: 0, combatants: this.combatants.toObject() }, { diff: false });
    }

    /** @override */
    async rollInitiative(ids, { updateTurn = true, messageOptions = {} } = {}) {

        // Get settings to know what type of initiative we are using
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);

        // Grab potential settings from the combat instance flags, if the combat has already started
        if (this.data.round > 0 && settings?.forceSettings === false) {
            settings.sideBased = this.getFlag("ironclaw2e", "sideBased");
            settings.initType = this.getFlag("ironclaw2e", "initiativeType");
            settings.manualTN = this.getFlag("ironclaw2e", "manualTN");
        }

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;

        // Array for stuff to do after all the initiatives have been rolled
        const updates = [];
        const messages = [];
        const conditions = []; // For setting conditions based on the initiative rolls

        // Iterate over Combatants, performing an initiative roll for each
        for (let [i, id] of ids.entries()) {

            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) continue;

            // Roll initiative check
            const tn = Ironclaw2ECombat.getInitiativeTN(combatant, this.combatants, settings);
            const initRoll = await combatant.getInitiativeRollIronclaw(tn);

            let initiative = -2;
            if (settings?.sideBased) { // The normal side-based initiative system for Ironclaw
                initiative = Ironclaw2ECombat.getInitiativeGroup(combatant, settings);
            } else { // The alternative roll-based initiative
                let skipped = false;
                let decimals = 0;
                initRoll.roll.dice.forEach(x => { // Tie-breaker calculation
                    if (!skipped && x.total == initRoll.highest) {
                        skipped = true; // Skip the actual initiative die, set the bool to ensure that multiple dice of the highest value aren't skipped
                        return;
                    }
                    if (decimals < x.total) decimals = x.total;
                });
                initiative = initRoll.highest + (decimals / 20);
            }

            // See if the initiative roll has a flavor message assigned, if so, split the "<p>" out from it and add the token name after it, otherwise just use a generic "Rolling for initiative" message
            let flavorString = initRoll.message.flavor ? [initRoll.message.flavor.slice(0, 3), combatant.token.name + ", ", initRoll.message.flavor.slice(3)].join("") : game.i18n.format("ironclaw2e.chat.rollingForInitiative", { "name": combatant.token.name });
            let initResult = "";
            if (initRoll.tnData) {
                initResult = initRoll.tnData.successes > 0 ? initRoll.tnData.successes.toString() : (initRoll.tnData.ties ? "T" : (initRoll.highest === 1 ? "B" : "F")); // Set the result as either the number of successes, or Ties, Botch, or Fail
                conditions.push({ "combatant": combatant, "result": initRoll });
            }

            updates.push({ _id: id, initiative: initiative, flags: { "ironclaw2e.initiativeResult": initResult } });

            // Determine the roll mode
            let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
            if ((combatant.token.hidden || combatant.hidden) && (["roll", "publicroll"].includes(rollMode))) rollMode = "gmroll";

            // Construct chat message data
            let messageData = mergeObject({
                speaker: {
                    scene: canvas.scene.id,
                    actor: combatant.actor ? combatant.actor.id : null,
                    token: combatant.token.id,
                    alias: combatant.token.name
                },
                flavor: flavorString,
                flags: { "core.initiativeRoll": true }
            }, messageOptions);
            messageData = mergeObject(initRoll.message, messageData);
            // Play 1 sound for the whole rolled set
            if (i > 0) messageData.sound = null;
            const chatData = await initRoll.roll.toMessage(messageData, { create: false, rollMode });

            messages.push(chatData);
        }
        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if (updateTurn && currentId) {
            await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
        }

        // Create multiple chat messages
        await ChatMessage.implementation.create(messages);

        // Give actor the conditions based on their initiative rolls, if the setting is on
        const autoConditions = game.settings.get("ironclaw2e", "autoInitiativeConditions");
        if (autoConditions) {
            for (let cond of conditions) {
                cond.combatant?.initiativeConditions(cond.result);
            }
        }

        // Return the updated Combat
        return this;
    }

    /** @override */
    async startCombat() {
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);
        let updateData = { round: 1, turn: 0 };
        updateData.flags = { "ironclaw2e.sideBased": settings.sideBased, "ironclaw2e.initiativeType": settings.initType, "ironclaw2e.manualTN": settings.manualTN };
        return this.update(updateData);
    }

    /** Add PC advantage to the initiative tie-breaking
     *  @override 
     */
    _sortCombatants(a, b) {
        const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
        const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
        let ci = ib - ia;
        if (ci !== 0) return ci;
        let [apc, bpc] = [a.token?.actor?.hasPlayerOwner || false, b.token?.actor?.hasPlayerOwner || false];
        let cpc = bpc - apc;
        if (cpc !== 0) return cpc;
        let [an, bn] = [a.token?.name || "", b.token?.name || ""];
        let cn = an.localeCompare(bn);
        if (cn !== 0) return cn;
        return a.tokenId - b.tokenId;
    }
}

export class Ironclaw2ECombatant extends Combatant {
    constructor(data, context) {
        super(data, context);
    }

    /**
     * Do things that happen automatically at the start of the combatant's next turn
     */
    async startOfTurnMaintenance() {
        this.actor?.startOfRound(); // Actor SOT function
    }

    /**
     * Do things that happen automatically at the end of the combatant's turn
     */
    async endOfTurnMaintenance() {
        this.actor?.endOfRound(); // Actor EOT function
    }

    /**
     * Set the conditions for the actor based on the initiative check result
     * @param {import("./dicerollers").DiceReturn} result
     */
    async initiativeConditions(result) {
        if (result?.highest == 1) {
            this.actor?.addEffect("reeling");
        } else if (result?.tnData?.successes >= 2) {
            this.actor?.addEffect("focused");
        }
    }

    /**
     * Get the initiative check for the combatant, with a backup system in case the combatant is missing an actor, somehow
     * @param {number} tn
     * @returns {Promise<DiceReturn>}
     */
    getInitiativeRollIronclaw(tn) {
        if (this.actor) {
            return this.actor.initiativeRoll(2, tn);
        }
        else {
            const roll = this.getInitiativeRoll();
            console.warn("A combatant was missing an actor, somehow.")
            return Promise.resolve({ "roll": roll, "highest": roll.total, "tnData": null, "message": {}, "isSent": false });
        }
    }

    /** @override */
    getInitiativeRoll(formula) {
        console.warn("Basic getInitiativeRoll called on Ironclaw2ECombatant. This shouldn't happen.");
        return super.getInitiativeRoll(formula);
    }

    /** @override */
    rollInitiative(formula) { console.warn("Basic rollInitiative called on Ironclaw2ECombatant. This shouldn't happen."); }

    /**
     * Update the initiative check result to the combat tracker for quick reference
     * @returns {null|object}
     * @override
     */
    updateResource() {
        return this.resource = this.getFlag("ironclaw2e", "initiativeResult") || null;
    }
}

/**
 * Extend the base CombatTracker class to allow for the use of Ironclaw's initiative systems
 * @extends {Combat}
 */
export class Ironclaw2ECombatTracker extends CombatTracker {
    constructor(options) {
        super(options);
    }

    /** Replace the default CombatTrackerConfig with a system one
     *  @override 
     */
    activateListeners(html) {
        super.activateListeners(html);
        const tracker = html.find("#combat-tracker");
        const combatants = tracker.find(".combatant");

        html.find('.combat-settings').off("click");

        // Display Combat settings
        html.find('.combat-settings').click(ev => {
            ev.preventDefault();
            new Ironclaw2ECombatTrackerConfig().render(true);
        });
    }
}

export class Ironclaw2ECombatTrackerConfig extends CombatTrackerConfig {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: "systems/ironclaw2e/templates/popup/combat-config.html",
            width: 420

        });
    }

    /** @override */
    async getData(options) {
        return {
            settings: game.settings.get("core", Combat.CONFIG_SETTING),
            initOptions: Ironclaw2ECombatTrackerConfig.getInitiativeOptions()
        };
    }

    /** @override */
    async _updateObject(event, formData) {
        return game.settings.set("core", Combat.CONFIG_SETTING, {
            sideBased: formData.sideBased,
            initType: formData.initType,
            forceSettings: formData.forceSettings,
            skipDefeated: formData.skipDefeated,
            manualTN: formData.manualTN
        });
    }

    static getInitiativeOptions() {
        return [{ key: "ironclaw2e.combat.alliesVsEnemies", value: 2 },
        { key: "ironclaw2e.combat.enemiesVsAllies", value: 3 },
        { key: "ironclaw2e.combat.pcsAlliesEnemies", value: 4 },
        { key: "ironclaw2e.combat.enemiesPcsAllies", value: 5 },
        { key: "ironclaw2e.combat.PCvsNPC", value: 0 },
        { key: "ironclaw2e.combat.NPCvsPC", value: 1 }];
    }
}