

/**
 * Extend the base Token entity by defining a custom data necessary for the Ironclaw system
 * @extends {Token}
 */
export class Ironclaw2EToken extends Token {

    /**
     * Handle changes to Token behavior when a significant status effect is applied
     * @param {string} statusId       The status effect ID being applied, from CONFIG.specialStatusEffects
     * @param {boolean} active        Is the special status effect now active?
     * @internal
     * @override
     */
    _onApplyStatusEffect(statusId, active) {
        switch (statusId) {
            case CONFIG.specialStatusEffects.INVISIBLE:
                canvas.perception.update({ refreshVision: true, refreshLighting: true }, true);
                this.mesh.refresh();
                break;
            case CONFIG.specialStatusEffects.BLIND:
                this.updateVisionSource();
                canvas.perception.update({ initializeVision: true }, true);
                break;
            case CONFIG.specialStatusEffects.MUTE:
                this.updateVisionSource();
                canvas.perception.update({ initializeVision: true }, true);
                break;
        }
    }

    /**
     * Update the VisionSource instance associated with this Token.
     * @param {object} [options]        Options which affect how the vision source is updated
     * @param {boolean} [options.defer]     Defer refreshing the LightingLayer to manually call that refresh later.
     * @param {boolean} [options.deleted]   Indicate that this vision source has been deleted.
     * @override
     */
    updateVisionSource({ defer = false, deleted = false } = {}) {

        // Prepare data
        const origin = this.getMovementAdjustedPoint(this.center);
        const sourceId = this.sourceId;
        const d = canvas.dimensions;
        const isVisionSource = this._isVisionSource();
        const blindEffect = this.document.sight.visionMode === "echolocation" ?
            this.document.hasStatusEffect(CONFIG.specialStatusEffects.MUTE) : this.document.hasStatusEffect(CONFIG.specialStatusEffects.BLIND);

        // Initialize vision source
        if (isVisionSource && !deleted) {
            this.vision.initialize({
                x: origin.x,
                y: origin.y,
                radius: Math.clamped(this.sightRange, 0, d.maxR),
                externalRadius: Math.max(this.w, this.h) / 2,
                angle: this.document.sight.angle,
                contrast: this.document.sight.contrast,
                saturation: this.document.sight.saturation,
                brightness: this.document.sight.brightness,
                attenuation: this.document.sight.attenuation,
                rotation: this.document.rotation,
                visionMode: this.document.sight.visionMode,
                color: Color.from(this.document.sight.color),
                isPreview: !!this._original,
                blinded: blindEffect
            });
            canvas.effects.visionSources.set(sourceId, this.vision);
        }

        // Remove vision source
        else canvas.effects.visionSources.delete(sourceId);

        // Schedule a perception update
        if (!defer && (isVisionSource || deleted)) {
            canvas.perception.update({ refreshVision: true }, true);
        }
    }
}

/**
 * Function to hook on token create, for the wildcard template setting
 * @param {TokenDocument} item
 * @param {object} options
 * @param {string} user
 */
function wildcardTemplateApplying(token, options, user) {
    // Lots of initial checks to make sure the function only runs when it should
    // Only execute if the executing user is the current one
    if (user !== game.userId) {
        return;
    }
    // Only execute if the token is not set as linked
    if (token?.actorLink !== false) {
        return;
    }
    // Only execute if the option is set for the actor
    if (token?.actor?.system.applyTemplateOnSpawn !== true) {
        return;
    }
    if (!(token.texture?.src && typeof token.texture.src === "string")) {
        // Only execute if the token has a texture set with a path
        return;
    }
    const actor = token.actor;
    let noteStatus = false;
    // Check if the entire folder path should be included in the test
    const includeFolder = game.settings.get("ironclaw2e", "templateIncludeFolderPath");
    const imageSplit = includeFolder ? token.texture.src.split() : token.texture.src.split("/");
    const image = includeFolder ? token.texture.src : imageSplit[imageSplit.length - 1];

    // Species templates
    const speciesActive = game.settings.get("ironclaw2e", "templateSpeciesActive");
    const speciesFolder = game.settings.get("ironclaw2e", "templateSpeciesFolder");
    let speciesSuccessful = null;
    if (speciesActive && speciesFolder && actor.system.traits?.species && !actor.system.traits.species.name) {
        // If the setting is on, has a folder and there is no species name
        const folder = game.folders.get(speciesFolder);
        const templates = folder.contents;
        noteStatus = true;
        // Loop through the items
        for (let foo of templates) {
            if (foo.type !== "speciesTemplate") {
                continue; // Ignore wrong types
            }
            // Check if the current template's name shows up anywhere in the token image's name
            const reg = new RegExp("(" + foo.name + ")", "gi"); // Prepare the regex
            if (reg.test(image)) {
                speciesSuccessful = foo;
                break;
            }
        }
    }
    // Career templates
    const careerActive = game.settings.get("ironclaw2e", "templateCareerActive");
    const careerFolder = game.settings.get("ironclaw2e", "templateCareerFolder");
    let careerSuccessful = null;
    if (careerActive && careerFolder && actor.system.traits?.career && !actor.system.traits.career.name) {
        // If the setting is on, has a folder and there is no career name
        const folder = game.folders.get(careerFolder);
        const templates = folder.contents;
        noteStatus = true;
        // Loop through the items
        for (let foo of templates) {
            if (foo.type !== "careerTemplate") {
                continue; // Ignore wrong types
            }
            // Check if the current template's name shows up anywhere in the token image's name
            const reg = new RegExp("(" + foo.name + ")", "gi"); // Prepare the regex
            if (reg.test(image)) {
                careerSuccessful = foo;
                break;
            }
        }
    }

    // If either check succeeded, apply them in a separate async function
    if (speciesSuccessful || careerSuccessful) {
        console.log(game.ironclaw2e.ironclawLogHeader + "Wildcard template system added the following templates: " + (speciesSuccessful?.name ?? " ") + ", " + (careerSuccessful?.name ?? " "));
        (async function () {
            // Waits are present to clear up an apparent race condition
            if (speciesSuccessful) await actor.applyTemplate(speciesSuccessful, { "wait": 500 });
            if (careerSuccessful) await actor.applyTemplate(careerSuccessful, { "wait": 500 });
        })();
    } else if (noteStatus) {
        console.log(game.ironclaw2e.ironclawLogHeader + "Wildcard template system could not find a matching template for: " + image);
    }
}

Hooks.on("createToken", wildcardTemplateApplying);