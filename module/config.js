
/** The world settings configuration menu */
export class WorldSettingsConfig extends FormApplication {

    /**
     * @override
     * @returns {DocumentSheetOptions}
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "world-settings-config",
            title: game.i18n.localize("ironclaw2e.config.worldConfig.menuLabel"),
            template: `systems/ironclaw2e/templates/popup/world-settings-config.html`,
            width: 500
        });
    }

    /** @override */
    async getData(options) {
        const settings = WorldSettingsConfig.getWorldSettingsObject;
        return {
            settings
        };
    }

    /** @override */
    async _updateObject(event, formData) {
        const oldSettings = WorldSettingsConfig.getWorldSettingsObject;
        for (let [key, value] of Object.entries(formData)) {
            // If the value differs between the old and new settings, update the setting
            if (oldSettings[key] !== value) {
                game.settings.set("ironclaw2e", key, value);
                console.log(`${key} updated: ${value}`);
            }
        }
    }

    /**
     * Get a settings object that is filled with all the world settings
     */
    static get getWorldSettingsObject() {
        let settings = {};
        settings.preferTokenName = game.settings.get("ironclaw2e", "preferTokenName");
        settings.autoPrototypeSetup = game.settings.get("ironclaw2e", "autoPrototypeSetup");
        settings.chatButtons = game.settings.get("ironclaw2e", "chatButtons");
        settings.showDefenseButtons = game.settings.get("ironclaw2e", "showDefenseButtons");
        settings.autoInitiativeConditions = game.settings.get("ironclaw2e", "autoInitiativeConditions");
        settings.autoConditionRemoval = game.settings.get("ironclaw2e", "autoConditionRemoval");
        settings.autoConditionRemovalNoTurns = game.settings.get("ironclaw2e", "autoConditionRemovalNoTurns");
        settings.manageEncumbranceAuto = game.settings.get("ironclaw2e", "manageEncumbranceAuto");
        settings.coinsHaveWeight = game.settings.get("ironclaw2e", "coinsHaveWeight");
        settings.calculateAttackEffects = game.settings.get("ironclaw2e", "calculateAttackEffects");
        settings.calculateDisplaysFailed = game.settings.get("ironclaw2e", "calculateDisplaysFailed");
        settings.calculateDoesNotDisplay = game.settings.get("ironclaw2e", "calculateDoesNotDisplay");
        return settings;
    }
}