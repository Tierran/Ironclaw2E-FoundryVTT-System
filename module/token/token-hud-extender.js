/**
 * Hooks function to replace the bottom resource bar for TokenHUD with additional Ironclaw buttons
 * @param {TokenHUD} hud The actual HUD object
 * @param {any} html The HTML object
 * @param {any} data Hook data
 */
function addIronclawTokenButtons(hud, html, data) {
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

    const buttonSize = (hud.object.w < 70 ? `style="max-width:30px;max-height:30px"` : "");
    const fasSize = (hud.object.w < 70 ? `fa-xs` : "");
    const fasPos = (hud.object.w < 70 ? `style="top:-6px"` : "");
    let buttonHtml = `
    <div class="row extra-controls" style="flex:0 0 40px;bottom:-10px">
        <div class="control-icon quick" title="${leftData.title}" data-action="${leftData.name}" ${buttonSize}>
            <i class="fas ${leftData.icon} ${fasSize}" ${fasPos}></i>
        </div>
        <div class="control-icon quick" title="${rightData.title}" data-action="${rightData.name}" ${buttonSize}>
            <i class="fas ${rightData.icon} ${fasSize}" ${fasPos}></i>
        </div>
    </div>
     `;
    const bottomBar = html.find('.bar1');
    bottomBar.replaceWith(buttonHtml);

    const buttons = html.find('.extra-controls');
    buttons.find('.control-icon').click(hud.object, onIronclawTokenButtonPress.bind(this));
}
Hooks.on("renderTokenHUD", addIronclawTokenButtons);

function onIronclawTokenButtonPress(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (event.data && (game.user.isGM || event.data.isOwner)) {
        const actor = event.data.actor;
        if (actor) {
            switch (dataset.action) {
                case "pool":
                    return actor.basicRollSelector();
                case "damage":
                    return actor.popupDamage();
                case "condition":
                    return actor.popupAddCondition();
            }
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

/** 
 * Monkey-patch the status effects to take into consideration what type of actor they're for
 */
export function TokenHUDStatusMonkeyPatch() {
    TokenHUD.prototype._getStatusEffectChoices = function () {
        const token = this.object;
        const doc = token.document;

        // Get statuses which are active for the token actor
        const actor = token.actor || null;
        const statuses = actor ? actor.effects.reduce((obj, e) => {
            const id = e.getFlag("core", "statusId");
            if (id) {
                obj[id] = {
                    id: id,
                    overlay: !!e.getFlag("core", "overlay")
                };
            }
            return obj;
        }, {}) : {};

        // TODO: Add filtering to what status effects are allowed for actor types

        // Prepare the list of effects from the configured defaults and any additional effects present on the Token
        const tokenEffects = foundry.utils.deepClone(doc.effects) || [];
        if (doc.overlayEffect) tokenEffects.push(doc.overlayEffect);
        return CONFIG.statusEffects.concat(tokenEffects).reduce((obj, e) => {
            const src = e.icon ?? e;
            if (src in obj) return obj;
            const status = statuses[e.id] || {};
            const isActive = !!status.id || doc.effects.includes(src);
            const isOverlay = !!status.overlay || doc.overlayEffect === src;
            obj[src] = {
                id: e.id ?? "",
                title: e.label ? game.i18n.localize(e.label) : null,
                src,
                isActive,
                isOverlay,
                cssClass: [
                    isActive ? "active" : null,
                    isOverlay ? "overlay" : null
                ].filterJoin(" ")
            };
            return obj;
        }, {});
    };
}