import { CommonSystemInfo } from "./systeminfo.js";

/**
 * @typedef {{
 * name: string,
 * plural: string,
 * amount: number,
 * weight: number,
 * value: string,
 * sign: number
 * }} CurrencyData
 */

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
            width: 600
        });
    }

    /** @override */
    async getData(options) {
        const settings = WorldSettingsConfig.getWorldSettingsObject;
        const rangeCombatRules = CommonSystemInfo.rangeCombatRules;
        return {
            settings,
            rangeCombatRules
        };
    }

    /** @override */
    async _updateObject(event, formData) {
        const oldSettings = WorldSettingsConfig.getWorldSettingsObject;
        for (let [key, value] of Object.entries(formData)) {
            if (!oldSettings.hasOwnProperty(key)) {
                console.error("Form data object had an extra property that was not present in Settings: " + key);
                continue;
            }
            // If the value differs between the old and new settings, update the setting
            if (oldSettings[key] !== value) {
                await game.settings.set("ironclaw2e", key, value);
                console.log(`${key} updated: ${value}`);
            }
        }

        return formData;
    }

    /**
     * Get a settings object that is filled with all the world settings
     */
    static get getWorldSettingsObject() {
        let settings = {};
        settings.preferTokenName = game.settings.get("ironclaw2e", "preferTokenName");
        settings.autoPrototypeSetup = game.settings.get("ironclaw2e", "autoPrototypeSetup");
        settings.allowNonGMRequestRolls = game.settings.get("ironclaw2e", "allowNonGMRequestRolls");
        settings.sendWeaponExhaustMessage = game.settings.get("ironclaw2e", "sendWeaponExhaustMessage");
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
        settings.rangePenalties = game.settings.get("ironclaw2e", "rangePenalties");
        settings.matchStandardRuler = game.settings.get("ironclaw2e", "matchStandardRuler");
        settings.requireSpecialRangeFound = game.settings.get("ironclaw2e", "requireSpecialRangeFound");
        settings.showRangeCombatRules = game.settings.get("ironclaw2e", "showRangeCombatRules");
        settings.showTokenExtraButtons = game.settings.get("ironclaw2e", "showTokenExtraButtons");
        settings.askReadyWhenUsed = game.settings.get("ironclaw2e", "askReadyWhenUsed");
        settings.sendWeaponReadyExhaustMessage = game.settings.get("ironclaw2e", "sendWeaponReadyExhaustMessage");
        settings.weaponExhaustNeedsRefreshed = game.settings.get("ironclaw2e", "weaponExhaustNeedsRefreshed");
        settings.npcItemHasDescription = game.settings.get("ironclaw2e", "npcItemHasDescription");
        settings.sendGiftUseExhaustMessage = game.settings.get("ironclaw2e", "sendGiftUseExhaustMessage");
        settings.dicePoolsSourceOrdered = game.settings.get("ironclaw2e", "dicePoolsSourceOrdered");
        settings.oneLineDicesOrdered = game.settings.get("ironclaw2e", "oneLineDicesOrdered");
        settings.sparkDieAutoDwindle = game.settings.get("ironclaw2e", "sparkDieAutoDwindle");
        settings.allowRerollingOthersDice = game.settings.get("ironclaw2e", "allowRerollingOthersDice");
        settings.showOthersTacticsUse = game.settings.get("ironclaw2e", "showOthersTacticsUse");
        settings.autoAddOnFireLight = game.settings.get("ironclaw2e", "autoAddOnFireLight");
        settings.vehicleStationCaptainOverride = game.settings.get("ironclaw2e", "vehicleStationCaptainOverride");
        return settings;
    }
}

/** The coinage settings configuration menu */
export class CoinageSettingsConfig extends FormApplication {

    static acceptableCurrencyPropertiesParsed = ["name", "plural", "weight", "value", "sign", "parsedSign", "used"];

    static dataValidationProperties = ["name", "plural", "weight", "value", "sign", "used"];

    /**
     * @override
     * @returns {DocumentSheetOptions}
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "coinage-settings-config",
            title: game.i18n.localize("ironclaw2e.config.coinageConfig.menuLabel"),
            template: `systems/ironclaw2e/templates/popup/coinage-settings-config.html`,
            width: 600
        });
    }

    /** @override */
    async getData(options) {
        const settings = CoinageSettingsConfig.getCoinageSettingsObject();
        return {
            settings
        };
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable) return;
        html.find(".reset-settings").click(this.resetSettings.bind(this));
    }

    /** @override */
    async _updateObject(event, formData) {
        const oldSettings = CoinageSettingsConfig.getCoinageSettingsObject(false);
        let newSettings = {};
        let parsedSettings = {};
        let inputFailed = false;
        let changed = false;

        // Parsing into a proper object
        for (let [key, value] of Object.entries(formData)) {
            const splitKey = key.split(".");
            if (splitKey.length !== 2) {
                console.error("Somehow, a key for the coinage config was split into an unusual number: " + key);
                continue;
            }
            if (!CommonSystemInfo.currencyNames.includes(splitKey[0])) {
                console.error("Somehow, a key for the coinage config was not part of the presets: " + splitKey[0]);
                continue;
            }
            if (!CoinageSettingsConfig.acceptableCurrencyPropertiesParsed.includes(splitKey[1])) {
                console.error("Somehow, a key for the coinage config was not part of the presets: " + splitKey[1]);
                continue;
            }
            if (!parsedSettings.hasOwnProperty(splitKey[0])) {
                parsedSettings[splitKey[0]] = {};
            }
            if (splitKey[1] === "parsedSign") {
                parsedSettings[splitKey[0]]["sign"] = value.codePointAt(0);
            } else {
                parsedSettings[splitKey[0]][splitKey[1]] = value;
            }
        }
        // Actual setting input
        for (let foo of CommonSystemInfo.currencyNames) {
            if (!parsedSettings.hasOwnProperty(foo)) {
                console.error("Parsed settings from form data is missing a field: " + foo);
                inputFailed = true;
                continue;
            }
            newSettings[foo] = {};
            for (let bar of CoinageSettingsConfig.dataValidationProperties) {
                // Base currency special cases
                if (foo === "baseCurrency" && (bar === "value" || bar === "used")) {
                    if (bar === "value")
                        newSettings[foo].value = "1";
                    if (bar === "used")
                        newSettings[foo].used = true;
                } else if (!parsedSettings[foo].hasOwnProperty(bar)) { // Error situation
                    console.error("Parsed settings property from form data is missing a field: " + bar);
                    inputFailed = true;
                    continue;
                } else { // Default set
                    newSettings[foo][bar] = parsedSettings[foo][bar];
                }
                // Check whether the value has changed from the old one
                if ((!oldSettings.hasOwnProperty(foo) || !oldSettings[foo].hasOwnProperty(bar)) || (oldSettings.hasOwnProperty(foo) && oldSettings[foo].hasOwnProperty(bar) && oldSettings[foo][bar] !== newSettings[foo][bar])) {
                    changed = true;
                    console.log(`${foo}.${bar} updated: ${newSettings[foo][bar]}`);
                }
            }
        }
        // Actually set the setting, if nothing went wrong and something has changed
        if (!inputFailed && changed) {
            return game.settings.set("ironclaw2e", "currencySettings", newSettings);
        }
        return null;
    }

    /** 
     *  Reset coinage settings back to defaults
     */
    async resetSettings(event) {
        event.preventDefault();

        const defaultSettings = CoinageSettingsConfig.getCoinageDefaultSettings();

        return this._onSubmit(event, { "updateData": defaultSettings });
    }

    /**
     * Get a settings object that is filled with all the world settings
     */
    static getCoinageSettingsObject(parsesigns = true) {
        let settings = {};
        settings = game.settings.get("ironclaw2e", "currencySettings");
        if (parsesigns) {
            settings.baseCurrency.parsedSign = String.fromCodePoint([settings.baseCurrency.sign]);
            settings.addedCurrency1.parsedSign = String.fromCodePoint([settings.addedCurrency1.sign]);
            settings.addedCurrency2.parsedSign = String.fromCodePoint([settings.addedCurrency2.sign]);
            settings.addedCurrency3.parsedSign = String.fromCodePoint([settings.addedCurrency3.sign]);
        }
        return settings;
    }

    /**
     * Get the default currency settings
     */
    static getCoinageDefaultSettings(parsesigns = false) {
        const defaultSettings = {
            baseCurrency: {
                "name": "denar",
                "plural": "denarii",
                "weight": 4.5,
                "value": "1",
                "sign": 208,
                "used": true
            }, addedCurrency1: {
                "name": "orichalk",
                "plural": "orichalks",
                "weight": 3.5,
                "value": "1/12",
                "sign": 415,
                "used": true
            }, addedCurrency2: {
                "name": "aureal",
                "plural": "aureals",
                "weight": 6.3,
                "value": "24",
                "sign": 8371,
                "used": true
            }, addedCurrency3: {
                "name": "quinqunx",
                "plural": "quinqunxes",
                "weight": 13.5,
                "value": "3",
                "sign": 81,
                "used": true
            }
        };

        if (parsesigns) {
            defaultSettings.baseCurrency.parsedSign = String.fromCodePoint([defaultSettings.baseCurrency.sign]);
            defaultSettings.addedCurrency1.parsedSign = String.fromCodePoint([defaultSettings.addedCurrency1.sign]);
            defaultSettings.addedCurrency2.parsedSign = String.fromCodePoint([defaultSettings.addedCurrency2.sign]);
            defaultSettings.addedCurrency3.parsedSign = String.fromCodePoint([defaultSettings.addedCurrency3.sign]);
        }

        return defaultSettings;
    }
}

/** The template settings configuration menu */
export class WildcardTemplateConfig extends FormApplication {

    /**
     * @override
     * @returns {DocumentSheetOptions}
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "wildcard-template-config",
            title: game.i18n.localize("ironclaw2e.config.wildcardTemplateConfig.menuLabel"),
            template: `systems/ironclaw2e/templates/popup/wildcard-template-config.html`,
            width: 600
        });
    }

    /** @override */
    async getData(options) {
        const settings = WildcardTemplateConfig.getTemplateSettingsObject;
        return {
            settings
        };
    }

    /** @override */
    async _updateObject(event, formData) {
        const oldSettings = WildcardTemplateConfig.getTemplateSettingsObject;
        for (let [key, value] of Object.entries(formData)) {
            if (!oldSettings.hasOwnProperty(key)) {
                console.error("Form data object had an extra property that was not present in Settings: " + key);
                continue;
            }
            // If the value differs between the old and new settings, update the setting
            if (oldSettings[key] !== value) {
                await game.settings.set("ironclaw2e", key, value);
                console.log(`${key} updated: ${value}`);
            }
        }

        return formData;
    }

    /**
     * Get a settings object that is filled with all the world settings
     */
    static get getTemplateSettingsObject() {
        let settings = {};
        settings.templateIncludeFolderPath = game.settings.get("ironclaw2e", "templateIncludeFolderPath");
        settings.templateSpeciesActive = game.settings.get("ironclaw2e", "templateSpeciesActive");
        settings.templateSpeciesFolder = game.settings.get("ironclaw2e", "templateSpeciesFolder");
        settings.templateCareerActive = game.settings.get("ironclaw2e", "templateCareerActive");
        settings.templateCareerFolder = game.settings.get("ironclaw2e", "templateCareerFolder");
        return settings;
    }
}