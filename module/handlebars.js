import { makeCompareReady } from "./helpers.js";
import { checkConditionIronclaw, checkConditionQuota, hasConditionsIronclaw } from "./conditions.js";
import { CommonSystemInfo } from "./systeminfo.js";

/* eslint-disable */
/** Handlebars helper registration */
export function registerHandlebarsHelpers() {
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('equalTo', function (val, compare) {
        return val === compare;
    });

    Handlebars.registerHelper('equalOrNothing', function (str, compare) {
        return str.length == 0 || makeCompareReady(str) == compare;
    });

    Handlebars.registerHelper('valueRoundTo', function (val, roundto) {
        return isNaN(val) ? "NaN" : val.toFixed(roundto);
    });

    Handlebars.registerHelper('usableGift', function (gift) {
        return gift.system.exhaustWhenUsed || gift.system.useDice?.length > 0;
    });

    Handlebars.registerHelper('propertyExists', function (thing, str) {
        return (str in thing);
    });

    Handlebars.registerHelper('isCombatantNoInit', function (actorid) {
        // True if lacking an init, false if has an init or is not a combatant
        const foo = game.combat?.getCombatantByActor(actorid);
        if (!foo) return false;
        return foo.initiative == null;
    });

    Handlebars.registerHelper('typeCheck', function (foo, bar) {
        return foo == bar;
    });

    Handlebars.registerHelper('conditionCheck', function (cond, name) {
        return checkConditionIronclaw(cond, name);
    });

    Handlebars.registerHelper('conditionQuotaCheck', function (cond) {
        return checkConditionQuota(cond);
    });

    Handlebars.registerHelper('extraSenseHasVision', function (val) {
        return CommonSystemInfo.extraSenses[val]?.visionName;
    });

    Handlebars.registerHelper('extraSenseHasPassives', function (val) {
        return CommonSystemInfo.extraSenses[val]?.detectionPassives?.length > 0;
    });
}

/** Load Handlebars templates */
async function loadHandleBarTemplates() {
    // register templates parts
    const templatePaths = [
        "systems/ironclaw2e/templates/parts/battlestats.html",
        "systems/ironclaw2e/templates/parts/details.html",
        "systems/ironclaw2e/templates/parts/statuseffects.html",
        "systems/ironclaw2e/templates/parts/gifts.html",
        "systems/ironclaw2e/templates/parts/combatgear.html",
        "systems/ironclaw2e/templates/parts/items.html",
        "systems/ironclaw2e/templates/parts/vehicledetails.html",
        "systems/ironclaw2e/templates/parts/vehiclestations.html"
    ];
    return loadTemplates(templatePaths);
}

Hooks.once("setup", function () {
    loadHandleBarTemplates();
});