import { Ironclaw2EActorSheet } from "./actor/actor-sheet.js";
import { CoinageSettingsConfig, WildcardTemplateConfig, WorldSettingsConfig } from "./config.js";
import { Ironclaw2EItemSheet } from "./item/item-sheet.js";

/* -------------------------------------------- */
/*  Tour Extensions                             */
/* -------------------------------------------- */

/**
 * Extend the base Tour for the Ironclaw configs
 * @extends {Tour}
 */
export class IronclawConfigTour extends Tour {
    /** @override */
    async start() {
        await super.start();
    }

    /** @override */
    async _preStep() {
        if ("activateSettings" in this.currentStep && this.currentStep.activateSettings) {
            const code = await this.checkForSettings();
            if (code >= 0) {
                game.settings.sheet.activateTab("system");
            } else {
                console.error("For some reason, the Tour has stalled!");
            }
        }
        if ("openSettingsApp" in this.currentStep) {
            let foo = getSettingsClass(this.currentStep.openSettingsApp);
            let bar = null;
            if (foo) {
                bar = new foo();
            }

            if (bar) {
                const code = await waitApplicationRender(bar);
                if (code >= 0) {
                    bar.bringToTop();
                } else {
                    console.error("For some reason, the Tour has stalled!");
                }
            } else {
                console.error("For some reason, the Tour has stalled!");
            }
        }
        if ("closeSettingsApp" in this.currentStep) {
            let foo = getSettingsClass(this.currentStep.closeSettingsApp);
            let bar = null;
            if (foo) {
                bar = Object.values(ui.windows).find((app) => app instanceof foo)
            }
            if (bar) {
                await bar.close({ force: true });
            }
        }

        await super._preStep();
    }

    /**
     * @returns {Promise<number>}
     */
    checkForSettings() {
        const foo = Object.values(ui.windows).find((app) => app instanceof SettingsConfig);
        if (!(foo instanceof SettingsConfig)) {
            return waitApplicationRender(game.settings.sheet);
        }
        return 0;
    }
}

/**
 * Extend the base Tour for the Ironclaw actor sheets
 * @extends {Tour}
 */
export class IronclawActorTour extends Tour {

    /** @override */
    async start() {
        this.sheet = this._getSheet();
        await super.start();
    }

    /** @override */
    get canStart() {
        const foo = this._getSheet();
        if (foo) return true;
        return false;
    }

    /** @override */
    async _preStep() {
        await this._activateTab();
        await super._preStep();
    }

    /** @override */
    _getTargetElement(selector) {
        // A normal selector can be used if the step asks
        if ("normalSelector" in this.currentStep && this.currentStep.normalSelector)
            return super._getTargetElement(selector);
        // Or the tour will use the sheet directly as the root
        if (this.sheet?.element?.length > 0)
            return this.sheet.element[0].querySelector(selector);

        console.error("Actor Sheet Tour used super._getTargetElement instead of its own!");
        return super._getTargetElement(selector);
    }

    /** Switch sheet tabs */
    _activateTab() {
        if (this.currentStep.tab) {
            return this.sheet.activateTab(this.currentStep.tab);
        }
    }

    /** Get the appropriate opened sheet for the tour
     * @returns {Ironclaw2EActorSheet | undefined}
     */
    _getSheet() {
        const tour = this;
        return Object.values(ui.windows).find((app) => app instanceof Ironclaw2EActorSheet && tour.config.actorType === app?.actor?.type);
    }
}

/**
 * Extend the base Tour for the Ironclaw item sheets
 * @extends {Tour}
 */
export class IronclawItemTour extends Tour {

    /** @override */
    async start() {
        this.sheet = this._getSheet();
        await super.start();
    }

    /** @override */
    get canStart() {
        const foo = this._getSheet();
        if (foo) return true;
        return false;
    }

    /** @override */
    async _preStep() {
        await this._activateTab();
        await super._preStep();
    }

    /** @override */
    _getTargetElement(selector) {
        // A normal selector can be used if the step asks
        if ("normalSelector" in this.currentStep && this.currentStep.normalSelector)
            return super._getTargetElement(selector);
        // Or the tour will use the sheet directly as the root
        if (this.sheet?.element?.length > 0)
            return this.sheet.element[0].querySelector(selector);

        console.error("Actor Sheet Tour used super._getTargetElement instead of its own!");
        return super._getTargetElement(selector);
    }

    /** Switch sheet tabs */
    _activateTab() {
        if (this.currentStep.tab) {
            return this.sheet.activateTab(this.currentStep.tab);
        }
    }

    /** Get the appropriate opened sheet for the tour
     * @returns {Ironclaw2EItemSheet | undefined}
     */
    _getSheet() {
        const tour = this;
        return Object.values(ui.windows).find((app) => app instanceof Ironclaw2EItemSheet && tour.config.itemType === app?.item?.type);
    }
}

/**
 * Extend the item Tour for the Ironclaw gift item sheets
 * @extends {IronclawItemTour}
 */
export class IronclawGiftTour extends IronclawItemTour {
    /** @override */
    async start() {
        this.addedSpecials = [];
        this.latestAdd = -1;
        await super.start();
    }

    /** @override */
    async _preStep() {
        await this._insertSpecial();
        await super._preStep();
    }

    /** @override 
     * @param {string} selector
     */
    _getTargetElement(selector) {
        if (this.sheet?.element?.length > 0) {
            if (/(@index)/.test(selector))
                return this.sheet.element[0].querySelector(selector.replace(/(@index)/, this.latestAdd.toFixed(0)));
        }

        return super._getTargetElement(selector);
    }

    /** @override */
    exit() {
        try {
            this._cleanUp();
        } catch (err) {
            console.error(err);
        }
        super.exit();
    }

    /** @override */
    async complete() {
        await this._cleanUp();
        return super.complete();
    }

    async _insertSpecial() {
        if ("addSpecial" in this.currentStep) {
            await this.sheet.item.giftAddSpecialSetting(this.currentStep.addSpecial);
            this.latestAdd = this.sheet.item.system.specialSettings.length - 1;
            this.addedSpecials.push(this.latestAdd);
        }
    }

    async _cleanUp() {
        for (let index of this.addedSpecials.reverse()) {
            await this.sheet.item.giftDeleteSpecialSetting(index);
        }
        
    }
}

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/**
 * Simple helper to make a time-outing Promise from waiting for an application to finish rendering, a bit hacky but works
 * @param {Application} app
 */
function waitApplicationRender(app) {
    const foo = (async () => {
        app.render(true);
        while (!app.rendered) {
            await game.ironclaw2e.sleep(100);
        }
        return 0;
    });
    const bar = (async () => {
        await game.ironclaw2e.sleep(10000);
        return -1;
    });

    return Promise.race([foo(), bar()]);
}

/**
 * Helper to determine what config the tour needs
 * @param {string} app
 * @returns {FormApplication}
 */
function getSettingsClass(app) {
    switch (app) {
        case "world":
            return WorldSettingsConfig;
        case "coinage":
            return CoinageSettingsConfig;
        case "template":
            return WildcardTemplateConfig;
        default:
            return null;
    }
}