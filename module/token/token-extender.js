
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
    if (token?.data.actorLink !== false) {
        return;
    }
    // Only execute if the option is set for the actor
    if (token?.actor?.data.data.applyTemplateOnSpawn !== true) {
        return;
    }
    const actorData = token.actor.data;
    // Species templates
    const speciesActive = game.settings.get("ironclaw2e", "templateSpeciesActive");
    const speciesFolder = game.settings.get("ironclaw2e", "templateSpeciesFolder");
    let speciesSuccessful = null;
    if (speciesActive && speciesFolder && !actorData.data.traits.species.name) {
        // If the setting is on, has a folder and there is no species name
        const folder = game.folders.get(speciesFolder);
        const templates = folder.contents;
        // Loop through the items
        for (let foo of templates) {
            if (foo.type !== "speciesTemplate") {
                continue; // Ignore wrong types
            }
            // Check if the current template's name shows up anywhere in the token image's name
            const reg = new RegExp("(" + foo.name + ")", "gi"); // Prepare the regex
            if (reg.test(token.data.img)) {
                speciesSuccessful = foo;
                break;
            }
        }
    }
    // Career templates
    const careerActive = game.settings.get("ironclaw2e", "templateCareerActive");
    const careerFolder = game.settings.get("ironclaw2e", "templateCareerFolder");
    let careerSuccessful = null;
    if (careerActive && careerFolder && !actorData.data.traits.career.name) {
        // If the setting is on, has a folder and there is no career name
        const folder = game.folders.get(careerFolder);
        const templates = folder.contents;
        // Loop through the items
        for (let foo of templates) {
            if (foo.type !== "careerTemplate") {
                continue; // Ignore wrong types
            }
            // Check if the current template's name shows up anywhere in the token image's name
            const reg = new RegExp("(" + foo.name + ")", "gi"); // Prepare the regex
            if (reg.test(token.data.img)) {
                careerSuccessful = foo;
                break;
            }
        }
    }

    // If either check succeeded, apply them in a separate async function
    if (speciesSuccessful || careerSuccessful) {
        const actor = token.actor;
        (async function () {
            // Waits are present to clear up an apparent race condition
            if (speciesSuccessful) await actor.applyTemplate(speciesSuccessful, {"wait": 500});
            if (careerSuccessful) await actor.applyTemplate(careerSuccessful, { "wait": 500 });
        })();
    }
}

Hooks.on("createToken", wildcardTemplateApplying);