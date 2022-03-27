Hooks.on("renderTokenHUD", addIronclawTokenButtons);

function addIronclawTokenButtons(hud, html, data) {
    if (!game.settings.get("ironclaw2e", "showTokenExtraButtons")) {
        return; // If the buttons are turned off, return out
    }

    const buttonSize = (hud.object.w < 70 ? `style="max-width:30px;max-height:30px"` : "");
    const fasSize = (hud.object.w < 70 ? `fa-xs` : "");
    const fasPos = (hud.object.w < 70 ? `style="top:-6px"` : "");
    let buttonHtml = `
    <div class="row extra-controls" style="flex:0 0 40px;bottom:-10px">
        <div class="control-icon quick" data-action="pool" ${buttonSize}>
            <i class="fas fa-dice ${fasSize}" ${fasPos}></i>
        </div>
        <div class="control-icon quick" data-action="damage" ${buttonSize}>
            <i class="fas fa-tint ${fasSize}" ${fasPos}></i>
        </div>
    </div>
     `;
    const bottomBar = html.find('.bar1');
    bottomBar.replaceWith(buttonHtml);

    const buttons = html.find('.extra-controls');
    buttons.find('.control-icon').click(hud.object, onIronclawTokenButtonPress.bind(this));
}

function onIronclawTokenButtonPress(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (event.data && (game.user.isGM || event.data.isOwner)) {
        const actor = event.data.actor;
        if (actor) {
            switch (dataset.action) {
                case "pool":
                    return actor.popupSelectRolled();
                case "damage":
                    return actor.popupDamage();
            }
        }
    }
}