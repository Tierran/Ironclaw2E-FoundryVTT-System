/**
 * Extend the base Combat class to allow for the use of Ironclaw's initiative systems
 * @extends {Combat}
 */
export class Ironclaw2ECombat extends Combat {

    /** @override */
    _getInitiativeFormula(combatant) {
        return "2";
    }

    /** @override */
    _getInitiativeRoll(combatant, formula) {
        //TODO: Actually make the logic for side-based initiatives and make some system to auto-roll the initiative checks
        let foo = combatant.actor ? combatant.actor.initiativeRoll(1).roll : Roll.create(formula).evaluate();
        return foo;
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
            traditional: formData.traditional,
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