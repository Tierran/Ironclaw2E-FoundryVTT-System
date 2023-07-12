import { checkIfDefeatedIronclaw } from "./conditions.js";
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
     * @param {Ironclaw2ECombatant} combatant
     * @param {any} formula
     */
    _getInitiativeRoll(combatant, formula) {
        return combatant.actor ? combatant.actor.initiativeRoll(1).roll : Roll.create(formula).evaluate({ async: true });
    }

    /**
     * Determine the relevant group initiative for a combatant according to the initiative type in the settings
     * @param {Ironclaw2ECombatant} combatant
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
                    if (initType === 0) return side === 1 ? 2 : 1;
                    else return side === 0 ? 2 : 1;
                    break;
                case 2:
                case 3:
                    side = (combatant.actor.hasPlayerOwner || combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ? 1 : 0); // If the combatant is a player or allied, side 1, otherwise side 0
                    if (initType === 2) return side === 1 ? 2 : 1;
                    else return side === 0 ? 2 : 1;
                    break;
                case 4:
                case 5:
                    side = side = (combatant.actor.hasPlayerOwner ? 1 : (combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ? 2 : 0)); // If the combatant is a player, side 1, otherwise if the combatant is allied, side 2, otherwise side 0
                    if (initType === 4) return side === 1 ? 3 : (side === 2 ? 2 : 1);
                    else return side === 0 ? 3 : (side === 1 ? 2 : 1);
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
     * @param {Ironclaw2ECombatant} combatant
     * @param {Ironclaw2ECombatant[]} allcombatants
     * @param {Object} settings
     * @returns {number}
     * @private
     */
    static getInitiativeTN(combatant, allcombatants, settings) {
        if (settings?.manualTN && settings.manualTN > 0) {
            return settings.manualTN;
        }
        else if (combatant && settings?.initType && allcombatants) {
            let otherSide = combatant.getSideCombatants(false, allcombatants);
            return Ironclaw2ECombat.getDistanceTN(Ironclaw2ECombat.getDistanceToClosestOther(combatant, otherSide));
        }
        else return 6;
    }

    /**
     * Get distance between the combatant and closest of the other combatants
     * @param {Ironclaw2ECombatant} combatant
     * @param {Ironclaw2ECombatant[]} othercombatants
     * @returns {number}
     * @private
     */
    static getDistanceToClosestOther(combatant, othercombatants) {
        let distance = Infinity;
        if (combatant?.token) {
            othercombatants.forEach(x => {
                if (x?.token) {
                    if (x.token.hidden !== true) {
                        // If the opponent's token is hidden, assume this means that they're not a valid token to base TN off of
                        const dist = getDistanceBetweenPositions(combatant.token, x.token);
                        if (distance > dist) distance = dist;
                    }
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
        const settings = this.getCombatSettings;

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant?.id;
        let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");

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
                    if (!skipped && x.total === initRoll.highest) {
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

            // Determine the roll mode, if the token or combatant is hidden, roll in gm mode unless another mode is specifically requested
            if ((combatant.token?.hidden || combatant.hidden) && (["roll", "publicroll"].includes(rollMode))) rollMode = "gmroll";

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
        this._playCombatSound("startEncounter");
        Hooks.callAll("combatStart", this, updateData);
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

    /**
     * Get the combat settings for the combat
     * @returns {object} Combat config settings, with stored combat settings potentially replacing some config ones
     */
    get getCombatSettings() {
        // Get settings to know what type of initiative we are using
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);

        // Grab potential settings from the combat instance flags, if the combat has already started
        if (this.round > 0 && settings?.forceSettings === false) {
            settings.sideBased = this.getFlag("ironclaw2e", "sideBased");
            settings.initType = this.getFlag("ironclaw2e", "initiativeType");
            settings.manualTN = this.getFlag("ironclaw2e", "manualTN");
        }

        return settings;
    }
}

export class Ironclaw2ECombatant extends Combatant {
    constructor(data, context) {
        super(data, context);
    }

    /** @override */
    get isDefeated() {
        return this.defeated || checkIfDefeatedIronclaw(this.actor);
    }

    /** 
     * Get the side of the combatant based on the config settings
     * @param {object} settings The settings to use
     * @returns {boolean} Returns true if on the player side, false if not
     */
    getSide(settings = null) {
        // Check if the given settings exist and have the initType set, if not check the combat for settings, if that doesn't work just put out an error value
        let initType = settings?.initType ?? this.combat?.getCombatSettings?.initType ?? -1;
        if (initType === 0 || initType === 1) {
            return this.actor?.hasPlayerOwner;
        } else if (initType >= 0) {
            return this.actor?.hasPlayerOwner || this.token?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        }

        console.warn("Combatant side get defaulted!");
        return false;
    }

    /**
     * Gets all the opposing or same side combatants for this combatant
     * @param {boolean} getallies Whether to get the opponents or allies
     * @returns {Ironclaw2ECombatant[]}
     */
    getSideCombatants(getallies, { allcombatants = [], excludeself = true } = {}) {
        const foo = this;
        // Check if the function is given a set of specific combatants to filter
        if (allcombatants == null || (Array.isArray(allcombatants) && allcombatants.length === 0)) {
            allcombatants = foo.combat?.combatants; // Get the combatant's combat's combatants
            if (allcombatants == null || (Array.isArray(allcombatants) && allcombatants.length === 0))
                return []; // If still nothing to filter, return out with an empty array
        }

        let sideComparison = (getallies ? foo.getSide(settings) : !foo.getSide(settings));
        return allcombatants.filter(x => x?.getSide(settings) === sideComparison && (excludeself ? x !== foo : true));
    }

    /**
     * Check if any of this combatant's allies can threaten the target, to get Tactics auto-selected
     * @returns {boolean} Whether any ally does threaten the target
     */
    checkTacticsForTarget() {
        let target = null;
        if (game.user.targets?.size > 0) {
            [target] = game.user.targets;
        }
        if (!target) return false;

        // Get all the allies
        const allies = this.getSideCombatants(true);
        for (let foo of allies) {
            if (foo.actor.system.actorThreatens) {
                // Loop through the allies, if they threaten, get the distance between the ally and the target
                const distance = getDistanceBetweenPositions(foo.token, target.document, { usecombatrules: true });
                if (distance <= foo.actor.system.threatDistance) {
                    return true // If the distance is under the threatening distance, return true
                }
            }
        }

        // If no ally is found to threaten the target, return false
        return false;
    }

    /**
     * Do things that happen automatically at the start of the combatant's next turn
     */
    async startOfTurnMaintenance() {
        await this.actor?.startOfTurn(); // Actor SOT function
    }

    /**
     * Do things that happen automatically at the end of the combatant's turn
     */
    async endOfTurnMaintenance() {
        await this.actor?.endOfTurn(); // Actor EOT function
    }

    /**
     * Set the conditions for the actor based on the initiative check result
     * @param {import("./dicerollers").DiceReturn} result
     */
    async initiativeConditions(result) {
        if (result?.highest === 1) {
            // Botch
            this.actor?.addEffect("reeling");
        } else if (result?.tnData?.successes >= 2) {
            // Overwhelming successes
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
            console.warn("A combatant was missing an actor, somehow.");
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