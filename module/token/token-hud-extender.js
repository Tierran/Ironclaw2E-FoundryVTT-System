import { getHudHiddenConditions } from "../condition-config.js";

/**
 * The system Token HUD, which filters status effects by actor type and replaces the bottom resource bar with additional Ironclaw buttons
 */
export class Ironclaw2ETokenHUD extends foundry.applications.hud.TokenHUD {
    static DEFAULT_OPTIONS = {
        actions: {
            ironclawButton: Ironclaw2ETokenHUD._onIronclawButton
        }
    };

    /**
     * Filter the status effects to only those meant for the actor's type (personal or vehicle), and remove the ones the world has hidden
     * Hidden conditions that are active on the token are kept, so that they can still be removed through the HUD
     * @override
     */
    _getStatusEffectChoices() {
        const choices = super._getStatusEffectChoices();
        const actorScale = this.actor?.getActorScaleType?.();
        const hidden = getHudHiddenConditions();
        for (const status of CONFIG.statusEffects) {
            if (!choices[status.id]) continue;
            const wrongType = ("actorType" in status) && status.actorType !== actorScale;
            const isHidden = hidden.has(status.id) && !choices[status.id].isActive;
            if (wrongType || isHidden) delete choices[status.id];
        }
        return choices;
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        this._addIronclawButtons();
    }

    /**
     * Replace the bottom resource bar with the configured Ironclaw buttons
     */
    _addIronclawButtons() {
        if (!game.settings.get("ironclaw2e", "showTokenExtraButtons")) {
            return; // If the buttons are turned off, return out
        }

        const leftOption = game.settings.get("ironclaw2e", "leftButtonOption");
        const rightOption = game.settings.get("ironclaw2e", "rightButtonOption");

        const leftData = getButtonData(leftOption);
        const rightData = getButtonData(rightOption);

        if (!leftData || !rightData) {
            // Null check
            console.error("Somehow, the Token HUD Extender failed to get proper option data: " + leftOption + " " + rightOption);
            return;
        }

        const bottomBar = this.element.querySelector(".bar1");
        if (!bottomBar) return;

        const small = this.object.w < 70;
        const buttonSize = (small ? `style="max-width:30px;max-height:30px"` : "");
        const fasSize = (small ? `fa-xs` : "");
        const buttonHtml = `
    <div class="row extra-controls flexrow" style="flex:0 0 40px;bottom:-10px">
        <button type="button" class="control-icon" data-action="ironclawButton" data-option="${leftData.name}" data-tooltip="${leftData.title}" ${buttonSize}>
            <i class="fas ${leftData.icon} ${fasSize}" inert></i>
        </button>
        <button type="button" class="control-icon" data-action="ironclawButton" data-option="${rightData.name}" data-tooltip="${rightData.title}" ${buttonSize}>
            <i class="fas ${rightData.icon} ${fasSize}" inert></i>
        </button>
    </div>
     `;
        bottomBar.outerHTML = buttonHtml;
    }

    /**
     * Handle a press of one of the Ironclaw buttons
     * @this {Ironclaw2ETokenHUD}
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static _onIronclawButton(event, target) {
        const token = this.object;
        if (!(game.user.isGM || token?.isOwner)) return;
        const actor = token.actor;
        if (!actor) return;

        switch (target.dataset.option) {
            case "pool":
                return actor.basicRollSelector();
            case "damage":
                return actor.popupDamage();
            case "condition":
                return actor.popupAddCondition();
        }
    }
}

/**
 * @typedef {{
 *   name: string,
 *   title: string,
 *   icon: string
 * }} ButtonReturn
 */

/**
 * Get the button information for the given option
 * @param {string} option
 * @returns {ButtonReturn}
 */
function getButtonData(option) {
    if (!TokenExtenderOptions.buttonOptions.hasOwnProperty(option)) return null;
    return { "name": option, "title": TokenExtenderOptions.buttonOptions[option], "icon": TokenExtenderOptions.buttonIcons[option] }
}

/** Class for holding all the configuration data for Token Extender */
export class TokenExtenderOptions {
    /**
     * The token button options that can be shown in the HUD
     */
    static buttonOptions = {
        "pool": "Dice Pool Popup", "damage": "Damage Popup", "condition": "Condition Adding"
    };
    /**
     * The Font Awesome icon name used for the options
     */
    static buttonIcons = {
        "pool": "fa-dice", "damage": "fa-tint", "condition": "fa-thermometer-quarter"
    };
}
