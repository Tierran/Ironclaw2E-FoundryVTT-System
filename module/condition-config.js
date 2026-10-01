import { CommonConditionInfo } from "./conditions.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Get the set of condition id's that the world has hidden from the Token HUD
 * @returns {Set<string>}
 */
export function getHudHiddenConditions() {
    return new Set(game.settings.get("ironclaw2e", "hudHiddenConditions") ?? []);
}

/**
 * The settings menu for choosing which conditions show up in the Token HUD
 */
export class ConditionSettingsConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "ironclaw2e-condition-config",
        tag: "form",
        window: {
            title: "ironclaw2e.config.conditionConfig.menuName",
            icon: "fas fa-list-check"
        },
        position: { width: 520, height: 700 },
        form: {
            closeOnSubmit: true,
            handler: ConditionSettingsConfig._saveSettings
        },
        actions: {
            showAll: ConditionSettingsConfig._onShowAll
        }
    };

    static PARTS = {
        form: { template: "systems/ironclaw2e/templates/popup/condition-settings-config.html", scrollable: [".condition-config-groups"] }
    };

    /** @override */
    async _prepareContext(options) {
        const hidden = getHudHiddenConditions();
        const groups = [
            { label: "ironclaw2e.config.conditionConfig.groupPersonal", conditions: [] },
            { label: "ironclaw2e.config.conditionConfig.groupVehicle", conditions: [] },
            { label: "ironclaw2e.config.conditionConfig.groupGeneral", conditions: [] }
        ];

        for (const condition of CommonConditionInfo.conditionList) {
            const group = (condition.actorType === "personal" ? groups[0] : (condition.actorType === "vehicle" ? groups[1] : groups[2]));
            group.conditions.push({ id: condition.id, name: condition.name, img: condition.img, shown: !hidden.has(condition.id) });
        }

        return { groups: groups.filter(x => x.conditions.length > 0) };
    }

    /**
     * Save the unchecked conditions as hidden
     */
    static async _saveSettings(event, form, formData) {
        const data = formData.object;
        const hidden = CommonConditionInfo.conditionList.filter(x => !data[`shown.${x.id}`]).map(x => x.id);
        return game.settings.set("ironclaw2e", "hudHiddenConditions", hidden);
    }

    /**
     * Check every condition's checkbox
     */
    static _onShowAll(event, target) {
        for (const box of this.element.querySelectorAll('input[type="checkbox"]')) box.checked = true;
    }
}
