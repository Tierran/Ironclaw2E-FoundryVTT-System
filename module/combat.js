/**
 * Extend the base Combat class to allow for the use of Ironclaw's initiative systems
 * @extends {Combat}
 */
export class Ironclaw2ECombat extends Combat {
    constructor(...args) {
        super(...args);
    }

    /** @override */
    _getInitiativeFormula(combatant) {
        return "2";
    }

    /** @override */
    _getInitiativeRoll(combatant, formula) {
        return combatant.actor ? combatant.actor.initiativeRoll(1).roll : Roll.create(formula).evaluate();
    }

    /**
     * Get either the initiative check for a side-based init or a highest roll initiative for the traditional init
     * @param {Combatant} combatant
     * @param {Object} settings
     * @param {number} tn
     * @param {string} formula
     * @returns {Object}
     * @private
     */
    _getInitiativeRollIronclaw(combatant, settings, tn, formula) {
        if (settings?.sideBased && combatant?.actor) {
            if (settings.sideBased) {
                return combatant.actor.initiativeRoll(2, tn);
            }
            else {
                return combatant.actor.initiativeRoll(1);
            }
        }
        else
            return { "roll": this._getInitiativeRoll(combatant, formula) };
    }

    /**
     * Determine the TN of the initiative check based on the distance to the nearest combatant
     * @param {Combatant} combatant
     * @param {Combatant[]} allcombatants
     * @param {Object} settings
     * @returns {number}
     * @private
     */
    _getInitiativeTN(combatant, allcombatants, settings) {
        if (settings?.manualTN > 0) {
            return settings.manualTN;
        }
        else if (combatant?.actor && combatant?.token && settings?.initType && allcombatants) {
            let otherSide;
            if (settings.initType === 0 || settings.initType === 1) {
                let playerOwnerComparison = combatant.actor.hasPlayerOwner;
                otherSide = allcombatants.filter(x => x?.actor.hasPlayerOwner !== playerOwnerComparison);
            }
            else {
                let playerOwnerComparison = combatant.actor.hasPlayerOwner || combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
                otherSide = allcombatants.filter(x => (x?.actor.hasPlayerOwner || x?.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) !== playerOwnerComparison);
            }
            return this._getDistanceTN(this._getDistanceToClosestOther(combatant, otherSide));
        }
        else return 2;
    }

    /**
     * Get distance between the combatant and closest of the other combatants
     * @param {Combatant} combatant
     * @param {Combatant[]} othercombatants
     * @returns {number}
     * @private
     */
    _getDistanceToClosestOther(combatant, othercombatants) {
        let distance = 10000;
        if (combatant?.token) {
            othercombatants.forEach(x => {
                if (x?.token) {
                    let dist = canvas.grid.measureDistance(combatant, x);
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
    _getDistanceTN(distance) {
        if (distance <= 4) return 2;
        if (distance <= 12) return 3;
        if (distance <= 36) return 4;
        if (distance <= 100) return 5;
        return 6;
    }

    /** @override */
    async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {

        // Get settings to know what type of initiative we are using
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);

        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        const currentId = this.combatant._id;

        // Iterate over Combatants, performing an initiative roll for each
        const [updates, messages] = ids.reduce((results, id, i) => {
            let [updates, messages] = results;

            // Get Combatant data
            const c = this.getCombatant(id);
            if (!c || !c.owner) return results;

            // Roll initiative
            const tn = this._getInitiativeTN(c, this.combatants, settings);
            const cf = formula || this._getInitiativeFormula(c);
            const roll = this._getInitiativeRollIronclaw(c, settings, tn, cf).roll;


            updates.push({ _id: id, initiative: roll.total });

            // Determine the roll mode
            let rollMode = messageOptions.rollMode || game.settings.get("core", "rollMode");
            if ((c.token.hidden || c.hidden) && (rollMode === "roll")) rollMode = "gmroll";

            // Construct chat message data
            let messageData = mergeObject({
                speaker: {
                    scene: canvas.scene._id,
                    actor: c.actor ? c.actor._id : null,
                    token: c.token._id,
                    alias: c.token.name
                },
                flavor: `${c.token.name} rolls for Initiative!`,
                flags: { "core.initiativeRoll": true }
            }, messageOptions);
            const chatData = roll.toMessage(messageData, { create: false, rollMode });

            // Play 1 sound for the whole rolled set
            if (i > 0) chatData.sound = null;
            messages.push(chatData);

            // Return the Roll and the chat data
            return results;
        }, [[], []]);
        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedEntity("Combatant", updates);

        // Ensure the turn order remains with the same combatant
        if (updateTurn) {
            await this.update({ turn: this.turns.findIndex(t => t._id === currentId) });
        }

        // Create multiple chat messages
        await CONFIG.ChatMessage.entityClass.create(messages);

        // Return the updated Combat
        return this;
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
            initOptions: this.getInitiativeOptions()
        };
    };

    /** @override */
    async _updateObject(event, formData) {
        return game.settings.set("core", Combat.CONFIG_SETTING, {
            sideBased: formData.sideBased,
            initType: formData.initType,
            skipDefeated: formData.skipDefeated
        });
    }

    getInitiativeOptions() {
        return [{ key: "ironclaw2e.combat.PCvsNPC", value: 0 },
        { key: "ironclaw2e.combat.NPCvsPC", value: 1 },
        { key: "ironclaw2e.combat.alliesVsEnemies", value: 2 },
        { key: "ironclaw2e.combat.enemiesVsAllies", value: 3 },
        { key: "ironclaw2e.combat.pcsAlliesEnemies", value: 4 },
        { key: "ironclaw2e.combat.enemiesPcsAllies", value: 5 }];
    }
}